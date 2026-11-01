import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createScrew } from './screw.js';

/** How far (world units) a part may sit above a screw and still block it. */
export const RAY_FAR = 2.6;

export const PALETTE = [
  { name: 'red', hex: '#ec3a3a' },
  { name: 'blue', hex: '#2c6fe8' },
  { name: 'yellow', hex: '#ffc61a' },
  { name: 'green', hex: '#2fbf55' },
  { name: 'purple', hex: '#9150e6' },
  { name: 'pink', hex: '#ff5fc4' },
  { name: 'cyan', hex: '#17c3d6' },
  { name: 'orange', hex: '#ff8a1c' },
];

// ---------------------------------------------------------------------------
// Primitive helpers. Every primitive is positioned in model (world) space.
// ---------------------------------------------------------------------------
const B = (w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => ({ t: 'box', s: [w, h, d], p: [x, y, z], r: [rx, ry, rz] });
const C = (rt, rb, h, x, y, z, rx = 0, ry = 0, rz = 0) => ({ t: 'cyl', s: [rt, rb, h], p: [x, y, z], r: [rx, ry, rz] });
const D = (r, x, y, z) => ({ t: 'dome', s: [r], p: [x, y, z], r: [0, 0, 0] });
const K = (r, h, x, y, z, rx = 0, ry = 0, rz = 0) => ({ t: 'cone', s: [r, h], p: [x, y, z], r: [rx, ry, rz] });
const part = (name, color, screws, ...prims) => ({ name, color, screws, prims });

// Parts are listed inner-most first. A screw may only be covered by parts that
// come later in the list, which guarantees the puzzle can always be taken apart.
const TEMPLATES = [
  {
    name: 'Windmill',
    build() {
      const parts = [
        part('base', '#86d95a', 7, C(3, 3.1, 0.5, 0, 0.25, 0)),
        part('tower', '#f4e4c4', 9, C(1.35, 1.6, 4, 0, 2.5, 0)),
        part('ring', '#e07a3c', 3, C(1.55, 1.55, 0.3, 0, 4.6, 0)),
        part('roof', '#c75b2a', 4, D(1.45, 0, 4.75, 0)),
        part('porch', '#fbf0da', 4, B(1.5, 1.9, 0.8, 0, 1.45, 1.55)),
        part('door', '#b3643a', 2, B(0.9, 1.3, 0.12, 0, 1.25, 2.0)),
        part('window', '#d98a4e', 2, B(0.7, 1.0, 0.2, 1.45, 2.6, 0, 0, Math.PI / 2, 0)),
        part('back-window', '#d98a4e', 2, B(0.7, 1.0, 0.2, -1.45, 2.6, 0, 0, Math.PI / 2, 0)),
        part('step', '#e9c79a', 3, B(2.2, 0.35, 0.7, 0, 0.68, 2.3)),
        part('crate', '#cf9a5e', 3, B(0.9, 0.8, 0.9, -2.0, 0.9, -1.0, 0, 0.4, 0)),
        part('hub', '#fbf0da', 1, C(0.32, 0.32, 0.7, 0, 3.4, 1.75, Math.PI / 2, 0, 0)),
      ];
      for (let k = 0; k < 4; k++) {
        const a = Math.PI / 4 + (k * Math.PI) / 2;
        const dx = Math.cos(a), dy = Math.sin(a);
        const px = -dy, py = dx; // perpendicular inside the blade plane
        const cx = dx * 1.6, cy = 3.4 + dy * 1.6;
        const rz = a - Math.PI / 2;
        const prims = [
          B(0.24, 2.4, 0.18, cx + px * 0.36, cy + py * 0.36, 2.27, 0, 0, rz),
          B(0.24, 2.4, 0.18, cx - px * 0.36, cy - py * 0.36, 2.27, 0, 0, rz),
        ];
        for (let j = 0; j < 4; j++) {
          const o = -0.9 + j * 0.6;
          prims.push(B(0.95, 0.16, 0.12, cx + dx * o, cy + dy * o, 2.23, 0, 0, rz));
        }
        parts.push(part(`blade-${k}`, '#d79a55', 3, ...prims));
      }
      return parts;
    },
  },
  {
    name: 'Robot',
    build() {
      return [
        part('plate', '#7f8fa6', 6, C(2.2, 2.3, 0.4, 0, 0.2, 0)),
        part('leg-l', '#4d6fa8', 3, B(0.8, 1.6, 0.8, -0.6, 1.2, 0)),
        part('leg-r', '#4d6fa8', 3, B(0.8, 1.6, 0.8, 0.6, 1.2, 0)),
        part('torso', '#e8edf5', 8, B(2.4, 2.0, 1.4, 0, 3.0, 0)),
        part('neck', '#7f8fa6', 2, C(0.32, 0.32, 0.35, 0, 4.17, 0)),
        part('head', '#e8edf5', 6, B(1.6, 1.2, 1.2, 0, 4.9, 0)),
        part('visor', '#2b3a55', 2, B(1.2, 0.36, 0.12, 0, 5.0, 0.64)),
        part('antenna', '#ff8a1c', 1, B(0.3, 0.6, 0.3, 0, 5.8, 0)),
        part('panel', '#a9b8d0', 3, B(1.3, 0.9, 0.15, 0, 3.1, 0.76)),
        part('pack', '#a9b8d0', 4, B(1.6, 1.4, 0.5, 0, 3.1, -0.95)),
        part('arm-l', '#4d6fa8', 3, B(0.6, 1.8, 0.6, -1.55, 2.9, 0)),
        part('arm-r', '#4d6fa8', 3, B(0.6, 1.8, 0.6, 1.55, 2.9, 0)),
        part('hand-l', '#7f8fa6', 2, B(0.7, 0.5, 0.7, -1.55, 1.75, 0)),
        part('hand-r', '#7f8fa6', 2, B(0.7, 0.5, 0.7, 1.55, 1.75, 0)),
        part('foot-l', '#2b3a55', 2, B(1.0, 0.35, 1.3, -0.6, 0.58, 0.2)),
        part('foot-r', '#2b3a55', 2, B(1.0, 0.35, 1.3, 0.6, 0.58, 0.2)),
      ];
    },
  },
  {
    name: 'Rocket',
    build() {
      const parts = [
        part('pad', '#8a96a8', 7, C(2.6, 2.8, 0.5, 0, 0.25, 0)),
        part('body', '#f5f5f5', 10, C(1.1, 1.1, 4.5, 0, 2.95, 0)),
        part('nose', '#ec5a3a', 3, K(1.1, 1.6, 0, 6.0, 0)),
        part('band', '#3c6fd8', 4, C(1.18, 1.18, 0.35, 0, 4.6, 0)),
        part('window', '#7fd4ff', 1, C(0.45, 0.45, 0.2, 0, 3.6, 1.12, Math.PI / 2, 0, 0)),
      ];
      [Math.PI / 3, Math.PI, (5 * Math.PI) / 3].forEach((th, i) => {
        const r = 1.6;
        parts.push(part(`fin-${i}`, '#ec5a3a', 3, B(0.2, 1.6, 1.1, Math.sin(th) * r, 1.45, Math.cos(th) * r, 0, th, 0)));
      });
      const tt = (2 * Math.PI) / 3;
      parts.push(part('gantry', '#ffc61a', 5, B(0.5, 4.2, 0.5, Math.sin(tt) * 2.4, 2.6, Math.cos(tt) * 2.4, 0, tt, 0)));
      parts.push(part('arm', '#ffc61a', 2, B(0.4, 0.3, 1.3, Math.sin(tt) * 1.65, 4.0, Math.cos(tt) * 1.65, 0, tt, 0)));
      return parts;
    },
  },
  {
    name: 'Cottage',
    build() {
      const ang = Math.atan2(1.35, 2);
      return [
        part('lawn', '#7fd257', 8, B(5.6, 0.4, 4.6, 0, 0.2, 0)),
        part('walls', '#fff1d6', 9, B(3.6, 2.4, 2.8, 0, 1.6, 0)),
        part('gable', '#f4dcb0', 2, B(1.6, 0.7, 2.7, 0, 3.15, 0)),
        part('roof-l', '#d9553a', 4, B(2.5, 0.25, 3.4, -1.0, 3.45, 0, 0, 0, ang)),
        part('roof-r', '#d9553a', 4, B(2.5, 0.25, 3.4, 1.0, 3.45, 0, 0, 0, -ang)),
        part('chimney', '#a8634a', 2, B(0.5, 1.0, 0.5, 1.1, 4.1, -0.7)),
        part('door', '#9a5530', 2, B(0.8, 1.3, 0.12, -0.7, 1.05, 1.45)),
        part('window', '#7fd4ff', 2, B(0.9, 0.7, 0.12, 0.8, 1.9, 1.45)),
        part('side-window', '#7fd4ff', 2, B(0.12, 0.7, 0.9, 1.85, 1.8, 0)),
        part('fence', '#e9c79a', 4, B(4.8, 0.5, 0.18, 0, 0.75, 2.05)),
        part('mailbox', '#3c6fd8', 2, B(0.4, 0.9, 0.4, -2.3, 0.85, 1.3)),
        part('bush', '#4fb04a', 3, D(0.7, 2.1, 0.4, -1.4)),
      ];
    },
  },
];

export const TEMPLATE_COUNT = TEMPLATES.length;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeGeometry(pr) {
  switch (pr.t) {
    case 'box': {
      const [w, h, d] = pr.s;
      return new RoundedBoxGeometry(w, h, d, 2, Math.min(0.07, Math.min(w, h, d) * 0.3));
    }
    case 'cyl': return new THREE.CylinderGeometry(pr.s[0], pr.s[1], pr.s[2], 40);
    case 'dome': return new THREE.SphereGeometry(pr.s[0], 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    case 'cone': return new THREE.ConeGeometry(pr.s[0], pr.s[1], 40);
    default: throw new Error(`unknown primitive ${pr.t}`);
  }
}

function spread(d, inset = 0.25, step = 0.55) {
  const range = d - 2 * inset;
  if (range <= 0) return [0];
  const n = Math.max(1, Math.floor(range / step) + 1);
  if (n === 1) return [0];
  return Array.from({ length: n }, (_, i) => -range / 2 + (i * range) / (n - 1));
}

/** Candidate screw spots for a primitive, in its local frame. */
function primCandidates(pr) {
  const out = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  if (pr.t === 'box') {
    const half = pr.s.map((v) => v / 2);
    for (let a = 0; a < 3; a++) {
      const u = (a + 1) % 3, v = (a + 2) % 3;
      const du = pr.s[u], dv = pr.s[v];
      if (Math.min(du, dv) < 0.2 || Math.max(du, dv) < 0.3) continue;
      for (const sign of [1, -1]) {
        for (const uu of spread(du)) {
          for (const vv of spread(dv)) {
            const p = [0, 0, 0], n = [0, 0, 0];
            p[a] = sign * half[a]; p[u] = uu; p[v] = vv; n[a] = sign;
            out.push({ p: V(...p), n: V(...n) });
          }
        }
      }
    }
  } else if (pr.t === 'cyl') {
    const [rt, rb, h] = pr.s;
    spread(h, 0.3, 0.6).forEach((y, row) => {
      const r = rb + (rt - rb) * ((y + h / 2) / h);
      if (r < 0.25) return;
      const n = Math.max(4, Math.min(16, Math.floor((2 * Math.PI * r) / 0.65)));
      for (let i = 0; i < n; i++) {
        const th = ((i + (row % 2) * 0.5) * 2 * Math.PI) / n;
        out.push({
          p: V(r * Math.sin(th), y, r * Math.cos(th)),
          n: V(Math.sin(th), (rb - rt) / h, Math.cos(th)).normalize(),
        });
      }
    });
    for (const [sign, r] of [[1, rt], [-1, rb]]) {
      if (r < 0.3) continue;
      out.push({ p: V(0, (sign * h) / 2, 0), n: V(0, sign, 0) });
      if (r >= 0.9) {
        const rr = r * 0.62;
        const n = Math.floor((2 * Math.PI * rr) / 0.65);
        for (let i = 0; i < n; i++) {
          const th = (i * 2 * Math.PI) / n;
          out.push({ p: V(rr * Math.sin(th), (sign * h) / 2, rr * Math.cos(th)), n: V(0, sign, 0) });
        }
      }
    }
  } else if (pr.t === 'dome') {
    const r = pr.s[0];
    out.push({ p: V(0, r, 0), n: V(0, 1, 0) });
    for (const e of [0.3, 0.85]) {
      const n = Math.max(4, Math.floor((2 * Math.PI * r * Math.cos(e)) / 0.65));
      for (let i = 0; i < n; i++) {
        const th = (i * 2 * Math.PI) / n;
        const p = V(r * Math.cos(e) * Math.sin(th), r * Math.sin(e), r * Math.cos(e) * Math.cos(th));
        out.push({ p, n: p.clone().normalize() });
      }
    }
  } else if (pr.t === 'cone') {
    const [r, h] = pr.s;
    const y = -h / 4, rr = r * 0.75;
    const n = Math.max(4, Math.floor((2 * Math.PI * rr) / 0.65));
    for (let i = 0; i < n; i++) {
      const th = (i * 2 * Math.PI) / n;
      out.push({ p: V(rr * Math.sin(th), y, rr * Math.cos(th)), n: V(Math.sin(th) * h, r, Math.cos(th) * h).normalize() });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Level construction
// ---------------------------------------------------------------------------
export function levelSettings(level) {
  return {
    template: (level - 1) % TEMPLATES.length,
    colors: Math.min(PALETTE.length, 2 + Math.ceil(level / 2)),
    maxScrews: Math.min(72, 15 + level * 5),
    seed: level * 7919 + 13,
  };
}

/**
 * Build a level: a THREE.Group holding the model, plus game data for parts and screws.
 */
export function buildLevel(level) {
  const cfg = levelSettings(level);
  const rng = mulberry32(cfg.seed);
  const tpl = TEMPLATES[cfg.template];
  const specs = tpl.build();

  const root = new THREE.Group();
  const parts = specs.map((spec, index) => {
    const group = new THREE.Group();
    root.add(group);
    const mat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.62, metalness: 0, side: THREE.DoubleSide });
    const meshes = spec.prims.map((pr) => {
      const m = new THREE.Mesh(makeGeometry(pr), mat);
      m.position.fromArray(pr.p);
      m.rotation.fromArray(pr.r);
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.prim = pr;
      group.add(m);
      return m;
    });
    const p = { index, name: spec.name, group, meshes, mat, target: spec.screws, screws: new Set(), attached: true, center: new THREE.Vector3() };
    meshes.forEach((m) => { m.userData.part = p; });
    return p;
  });
  root.updateMatrixWorld(true);
  const allMeshes = parts.flatMap((p) => p.meshes);

  // 1. Gather legal candidate positions. A spot is legal when nothing belonging to the
  //    same or an earlier (inner) part sits in front of it.
  const rc = new THREE.Raycaster();
  rc.far = RAY_FAR;
  const byPart = parts.map(() => []);
  for (const p of parts) {
    for (const m of p.meshes) {
      const others = allMeshes.filter((x) => x !== m);
      for (const c of primCandidates(m.userData.prim)) {
        const pos = c.p.clone().applyMatrix4(m.matrixWorld);
        const n = c.n.clone().transformDirection(m.matrixWorld);
        if (n.y < -0.45) continue; // facing the floor: hard to see, skip
        rc.set(pos.clone().addScaledVector(n, 0.01), n);
        const hits = rc.intersectObjects(others, false);
        // Spots buried inside, or flush against, another part are rejected too.
        const ok = hits.every((h) => h.object.userData.part.index > p.index && h.distance > 0.3);
        if (ok) byPart[p.index].push({ part: p, pos, normal: n });
      }
    }
  }

  // 2. Pick screws per part with a minimum spacing.
  const chosen = [];
  const minD2 = 0.6 * 0.6;
  const farEnough = (pos) => chosen.every((c) => c.pos.distanceToSquared(pos) > minD2);
  for (const p of parts) {
    const list = shuffle(byPart[p.index], rng);
    let count = 0;
    for (const c of list) {
      if (count >= p.target) break;
      if (farEnough(c.pos)) { chosen.push(c); count++; }
    }
  }

  // 3. Clamp total to the level budget and to a multiple of three, never stripping a part's last screw.
  const countOf = (p) => chosen.filter((c) => c.part === p).length;
  const removeOne = () => {
    const pool = chosen.filter((c) => countOf(c.part) > 1);
    if (!pool.length) return false;
    const victim = pool[Math.floor(rng() * pool.length)];
    chosen.splice(chosen.indexOf(victim), 1);
    return true;
  };
  while (chosen.length > cfg.maxScrews && removeOne());
  while (chosen.length % 3 !== 0) {
    if (!removeOne()) {
      // Every part is down to one screw: add spare ones instead.
      const spare = parts.flatMap((p) => byPart[p.index]).find((c) => !chosen.includes(c) && farEnough(c.pos));
      if (!spare) break;
      chosen.push(spare);
    }
  }

  // Parts that ended up without screws are purely decorative: the game never lets them
  // block a screw (otherwise the level could dead-lock) and drops them on completion.
  for (const p of parts) p.decor = countOf(p) === 0;

  // 4. Colours: every colour appears in multiples of three.
  const triples = chosen.length / 3;
  const k = Math.min(cfg.colors, triples);
  const colorList = [];
  for (let i = 0; i < triples; i++) {
    const col = PALETTE[i % k];
    colorList.push(col, col, col);
  }
  shuffle(colorList, rng);

  // 5. Re-centre each part so it can tumble around its own middle when it falls off.
  for (const p of parts) {
    const box = new THREE.Box3().setFromObject(p.group);
    box.getCenter(p.center);
    p.group.position.copy(p.center);
    p.meshes.forEach((m) => m.position.sub(p.center));
  }
  root.updateMatrixWorld(true);

  // 6. Build screw meshes.
  const up = new THREE.Vector3(0, 1, 0);
  const screws = chosen.map((c, id) => {
    const col = colorList[id];
    const { group, hit } = createScrew(col.hex);
    group.position.copy(c.pos);
    group.quaternion.setFromUnitVectors(up, c.normal);
    root.add(group);
    const s = { id, part: c.part, color: col.name, hex: col.hex, pos: c.pos.clone(), normal: c.normal.clone(), mesh: group, hit, baseQuat: group.quaternion.clone(), removed: false };
    hit.userData.screw = s;
    c.part.screws.add(s);
    return s;
  });

  const bounds = new THREE.Box3().setFromObject(root);
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());

  return {
    level,
    name: tpl.name,
    root,
    parts,
    screws,
    center: sphere.center,
    radius: sphere.radius,
    colors: PALETTE.slice(0, k),
  };
}
