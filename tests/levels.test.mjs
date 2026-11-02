// Plays every level as a player would: orbiting the camera within the game's limits and tapping
// only screws the game accepts (uncovered, and not hidden behind geometry from that viewpoint).
// Fails if any level can't be fully taken apart, or if a screw is buried / nearly impossible to tap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildLevel, RAY_FAR, insidePrim, headPoints, LEVELS, LEVEL_COUNT } from '../src/level.js';

const LEVEL_NUMBERS = Array.from({ length: Number(process.env.LEVELS || LEVEL_COUNT) }, (_, i) => i + 1);
const MIN_TAP_FRACTION = 0.05; // a newly freed screw must be tappable from >= 5% of camera angles

const rc = new THREE.Raycaster();
const tmp = new THREE.Vector3();

// Mirrors blockerOf() in src/main.js.
function blockerOf(L, s) {
  const meshes = L.parts.filter((p) => p.attached && !p.decor && p !== s.part).flatMap((p) => p.meshes);
  rc.set(tmp.copy(s.pos).addScaledVector(s.normal, 0.02), s.normal);
  rc.near = 0;
  rc.far = RAY_FAR;
  const h = rc.intersectObjects(meshes, false)[0];
  return h ? h.object.userData.part : null;
}

// Camera positions reachable with the game's OrbitControls limits (see fitCamera() in main.js).
function cameraPositions(L) {
  const aspect = 390 / 560;
  const vf = THREE.MathUtils.degToRad(38);
  const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
  const d = (L.radius / Math.sin(Math.min(vf, hf) / 2)) * 0.66;
  const out = [];
  for (const dist of [d * 0.55, d * 1.6])
    for (let pol = 0.25; pol <= 1.75; pol += 0.15)
      for (let az = 0; az < Math.PI * 2; az += Math.PI / 12)
        out.push(new THREE.Vector3().setFromSpherical(new THREE.Spherical(dist, pol, az)).add(L.center));
  return out;
}

// Mirrors handleTap() in src/main.js, aiming at the screw head.
function tapWorksFrom(L, s, cam) {
  const live = L.screws.filter((x) => !x.removed).map((x) => x.hit);
  const solid = L.parts.filter((p) => p.attached && !p.glass).flatMap((p) => p.meshes);
  const head = s.pos.clone().addScaledVector(s.normal, 0.12);
  rc.set(cam, head.clone().sub(cam).normalize());
  rc.near = 0;
  rc.far = Infinity;
  const hit = rc.intersectObjects(live, false)[0];
  if (!hit || hit.object.userData.screw !== s) return false;
  const wall = rc.intersectObjects(solid, false)[0];
  return !(wall && wall.distance < hit.distance - 0.25);
}

// Mirrors dropPart(): decorative parts go with their hosts.
function drop(L, p) {
  p.attached = false;
  for (const d of L.parts) if (d.decor && d.attached && d.hosts?.includes(p)) drop(L, d);
}

test('every level is a different model', () => {
  const models = LEVELS.map((l) => l.model);
  assert.equal(new Set(models).size, models.length, `repeated models: ${models}`);
});

for (const level of LEVEL_NUMBERS) {
  test(`level ${level} can be fully taken apart with real taps`, () => {
    const L = buildLevel(level);
    L.root.updateMatrixWorld(true);
    const cfg = LEVELS[level - 1];
    const count = (k) => L.screws.filter((s) => s[k]).length;
    if (process.env.VERBOSE) {
      console.log(`L${level} ${L.name}: ${L.screws.length} screws, ${new Set(L.screws.map((s) => s.color)).size} colours, ` +
        `ice ${count('ice')}, mystery ${count('mystery')}, decor [${L.parts.filter((p) => p.decor).map((p) => p.name)}]`);
    }
    assert.equal(count('ice'), Math.min(cfg.ice || 0, L.screws.length), 'ice screw count');
    assert.equal(count('mystery'), cfg.mystery || 0, 'mystery screw count');
    const all = L.parts.flatMap((p) => p.meshes);
    assert.equal(L.screws.length % 3, 0, 'screw count must be a multiple of 3');

    for (const s of L.screws) {
      // Ignore the primitive the screw is mounted on; every other primitive must stay clear of the head.
      const others = all.filter((m) => !insidePrim(m, s.pos, 0.03));
      const buried = headPoints(s.pos, s.normal).some((pt) => others.some((m) => insidePrim(m, pt)));
      assert.ok(!buried, `screw ${s.id} on ${s.part.name} is buried inside another part`);
    }

    const cams = cameraPositions(L);
    const checked = new Set();
    let removed = 0;
    while (removed < L.screws.length) {
      const free = L.screws.filter((s) => !s.removed && !blockerOf(L, s));
      for (const s of free) {
        if (checked.has(s)) continue;
        checked.add(s);
        const frac = cams.filter((c) => tapWorksFrom(L, s, c)).length / cams.length;
        assert.ok(frac >= MIN_TAP_FRACTION,
          `screw ${s.id} on ${s.part.name} is uncovered but only tappable from ${(frac * 100).toFixed(1)}% of views`);
      }
      const tappable = free.filter((s) => cams.some((c) => tapWorksFrom(L, s, c)));
      const left = L.screws.filter((s) => !s.removed).map((s) => `${s.id}@${s.part.name}(blocked by ${blockerOf(L, s)?.name ?? '-'})`);
      assert.ok(tappable.length > 0, `stuck after ${removed} screws; remaining: ${left.join(', ')}`);
      for (const s of tappable) {
        s.removed = true;
        s.part.screws.delete(s);
        removed++;
        if (s.part.screws.size === 0 && s.part.index !== 0 && s.part.attached) drop(L, s.part);
      }
    }
  });
}
