import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createScrew } from './screw.js';
import { LEVELS, modelParts } from './models.js';

export { LEVELS };

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

export const LEVEL_COUNT = LEVELS.length;

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
    case 'sphere': return new THREE.SphereGeometry(pr.s[0], 40, 24);
    case 'torus': return new THREE.TorusGeometry(pr.s[0], pr.s[1], 16, 64);
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
    // Base disc (useful when a cone is flipped over, like a satellite dish).
    if (r >= 0.3) out.push({ p: V(0, -h / 2, 0), n: V(0, -1, 0) });
    if (r >= 0.9) {
      const rb = r * 0.62, nb = Math.floor((2 * Math.PI * rb) / 0.65);
      for (let i = 0; i < nb; i++) {
        const th = (i * 2 * Math.PI) / nb;
        out.push({ p: V(rb * Math.sin(th), -h / 2, rb * Math.cos(th)), n: V(0, -1, 0) });
      }
    }
  } else if (pr.t === 'sphere') {
    const r = pr.s[0];
    out.push({ p: V(0, r, 0), n: V(0, 1, 0) });
    for (const e of [-0.35, 0.2, 0.8]) {
      const n = Math.max(3, Math.floor((2 * Math.PI * r * Math.cos(e)) / 0.65));
      for (let i = 0; i < n; i++) {
        const th = ((i + (e > 0.5 ? 0.5 : 0)) * 2 * Math.PI) / n;
        const p = V(r * Math.cos(e) * Math.sin(th), r * Math.sin(e), r * Math.cos(e) * Math.cos(th));
        out.push({ p, n: p.clone().normalize() });
      }
    }
  } else if (pr.t === 'torus') {
    const [R, r] = pr.s;
    if (r >= 0.1) {
      const n = Math.max(6, Math.floor((2 * Math.PI * R) / 0.65));
      for (let i = 0; i < n; i++) {
        const th = (i * 2 * Math.PI) / n;
        const c = Math.cos(th), sn = Math.sin(th);
        out.push({ p: V((R + r) * c, (R + r) * sn, 0), n: V(c, sn, 0) });
        out.push({ p: V(R * c, R * sn, r), n: V(0, 0, 1) });
        out.push({ p: V(R * c, R * sn, -r), n: V(0, 0, -1) });
      }
    }
  }
  return out;
}

const _inv = new THREE.Matrix4();
const _lp = new THREE.Vector3();

/** Is a world-space point inside a primitive mesh (grown by `grow` units)? Primitives are convex. */
export function insidePrim(mesh, point, grow = 0.02) {
  _lp.copy(point).applyMatrix4(_inv.copy(mesh.matrixWorld).invert());
  const pr = mesh.userData.prim;
  const { x, y, z } = _lp;
  switch (pr.t) {
    case 'box':
      return Math.abs(x) < pr.s[0] / 2 + grow && Math.abs(y) < pr.s[1] / 2 + grow && Math.abs(z) < pr.s[2] / 2 + grow;
    case 'cyl': {
      const [rt, rb, h] = pr.s;
      if (Math.abs(y) >= h / 2 + grow) return false;
      const t = THREE.MathUtils.clamp((y + h / 2) / h, 0, 1);
      return Math.hypot(x, z) < rb + (rt - rb) * t + grow;
    }
    case 'dome':
      return y > -grow && _lp.length() < pr.s[0] + grow;
    case 'cone': {
      const [r, h] = pr.s;
      if (Math.abs(y) >= h / 2 + grow) return false;
      const t = THREE.MathUtils.clamp(0.5 - y / h, 0, 1);
      return Math.hypot(x, z) < r * t + grow;
    }
    case 'sphere':
      return _lp.length() < pr.s[0] + grow;
    case 'torus': {
      const [R, r] = pr.s;
      return Math.hypot(Math.hypot(x, y) - R, z) < r + grow;
    }
    default:
      return false;
  }
}

/** Sample points covering a screw head (centre column plus rim) sitting at `pos` facing `n`. */
export function headPoints(pos, n) {
  const t1 = new THREE.Vector3().crossVectors(n, Math.abs(n.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
  const t2 = new THREE.Vector3().crossVectors(n, t1);
  const at = (h, a = 0, b = 0) => pos.clone().addScaledVector(n, h).addScaledVector(t1, a).addScaledVector(t2, b);
  const r = 0.2;
  return [at(0.04), at(0.15), at(0.08, r), at(0.08, -r), at(0.08, 0, r), at(0.08, 0, -r)];
}

/**
 * Choose screw spots. A spot is legal when its head sits in open air and nothing belonging to the
 * same or an earlier (inner) part, or to a decorative part, sits in front of it.
 */
function placeScrews(parts, allMeshes, decor, cfg, rng) {
  const rc = new THREE.Raycaster();
  rc.far = RAY_FAR;
  const byPart = parts.map(() => []);
  for (const p of parts) {
    if (decor.has(p)) continue;
    for (const m of p.meshes) {
      const others = allMeshes.filter((x) => x !== m);
      for (const c of primCandidates(m.userData.prim)) {
        const pos = c.p.clone().applyMatrix4(m.matrixWorld);
        const n = c.n.clone().transformDirection(m.matrixWorld);
        if (n.y < -0.45) continue; // facing the floor: hard to see, skip
        // The head must not be buried in, or clip into, any other primitive. (The ray test below
        // only looks RAY_FAR ahead, so on its own it can't tell a spot is deep inside a big part.)
        if (headPoints(pos, n).some((pt) => others.some((o) => insidePrim(o, pt)))) continue;
        rc.set(pos.clone().addScaledVector(n, 0.01), n);
        const hits = rc.intersectObjects(others, false);
        const ok = hits.every((h) => {
          const q = h.object.userData.part;
          return q.index > p.index && !decor.has(q) && h.distance > 0.3;
        });
        if (ok) byPart[p.index].push({ part: p, pos, normal: n });
      }
    }
  }

  // Pick screws with a minimum spacing. First give every part one screw, most cramped parts first
  // (so a big neighbour can't crowd a small part out), then fill each part up to its target.
  const chosen = [];
  const minD2 = 0.6 * 0.6;
  const farEnough = (pos) => chosen.every((c) => c.pos.distanceToSquared(pos) > minD2);
  const lists = parts.map((p) => shuffle(byPart[p.index], rng));
  const wanting = parts.filter((p) => p.target > 0 && !decor.has(p));
  for (const p of [...wanting].sort((a, b) => lists[a.index].length - lists[b.index].length)) {
    const c = lists[p.index].find((x) => farEnough(x.pos));
    if (c) chosen.push(c);
  }
  for (const p of wanting) {
    let count = chosen.filter((c) => c.part === p).length;
    for (const c of lists[p.index]) {
      if (count >= p.target) break;
      if (!chosen.includes(c) && farEnough(c.pos)) { chosen.push(c); count++; }
    }
  }

  // Clamp to the level budget and to a multiple of three, never stripping a part's last screw.
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
  return { chosen, countOf };
}

// ---------------------------------------------------------------------------
// Level construction
// ---------------------------------------------------------------------------
export function levelSettings(level) {
  const def = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1];
  return {
    ice: 0,
    ...def,
    colors: Math.min(PALETTE.length, def.colors),
    seed: level * 7919 + 13,
  };
}

/**
 * Build a level: a THREE.Group holding the model, plus game data for parts and screws.
 */
export function buildLevel(level) {
  const cfg = levelSettings(level);
  const rng = mulberry32(cfg.seed);
  const specs = modelParts(cfg.model);
  const UP = new THREE.Vector3(0, 1, 0);

  const root = new THREE.Group();
  const parts = specs.map((spec, index) => {
    const group = new THREE.Group();
    root.add(group);
    const mat = spec.glass
      ? new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.62, metalness: 0, side: THREE.DoubleSide });
    const meshes = spec.prims.map((pr) => {
      const m = new THREE.Mesh(makeGeometry(pr), mat);
      m.position.fromArray(pr.p);
      if (pr.f) m.quaternion.setFromUnitVectors(UP, new THREE.Vector3(...pr.f).normalize());
      else m.rotation.fromArray(pr.r);
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.prim = pr;
      group.add(m);
      return m;
    });
    const p = {
      index, name: spec.name, group, meshes, mat, glass: !!spec.glass, baseOpacity: mat.opacity,
      target: spec.screws, screws: new Set(), attached: true, center: new THREE.Vector3(),
    };
    meshes.forEach((m) => { m.userData.part = p; });
    return p;
  });
  root.updateMatrixWorld(true);
  const allMeshes = parts.flatMap((p) => p.meshes);

  // Screw placement. Parts that end up with no screws are decorative. A decorative part never
  // falls on its own, so it must never sit in front of a screw. Placement is repeated, treating
  // decorative parts as off-limits, until the set of decorative parts stops growing.
  const decor = new Set(parts.filter((p) => p.target === 0));
  let placed;
  for (let pass = 0; pass < 6; pass++) {
    placed = placeScrews(parts, allMeshes, decor, cfg, mulberry32(cfg.seed + pass));
    const fresh = parts.filter((p) => !decor.has(p) && placed.countOf(p) === 0);
    if (!fresh.length) break;
    fresh.forEach((p) => decor.add(p));
  }
  const { chosen } = placed;
  for (const p of parts) p.decor = decor.has(p);

  // Decorative parts fall away together with the first part they are attached to (anything they
  // touch other than the base), so nothing is left floating.
  for (const d of decor) {
    const box = new THREE.Box3().setFromObject(d.group).expandByScalar(0.05);
    d.hosts = parts.filter((q) => q !== d && q.index !== 0 && !decor.has(q) && box.intersectsBox(new THREE.Box3().setFromObject(q.group)));
  }

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

  // 6. Frozen screws (two taps).
  const iceIds = new Set(shuffle(chosen.map((_, i) => i), rng).slice(0, cfg.ice));

  // 7. Build screw meshes.
  const screws = chosen.map((c, id) => {
    const col = colorList[id];
    const ice = iceIds.has(id);
    const { group, hit, iceMesh } = createScrew(col.hex, { ice });
    group.position.copy(c.pos);
    group.quaternion.setFromUnitVectors(UP, c.normal);
    root.add(group);
    const s = {
      id, part: c.part, color: col.name, hex: col.hex, pos: c.pos.clone(), normal: c.normal.clone(),
      mesh: group, hit, baseQuat: group.quaternion.clone(), removed: false,
      ice, iceMesh,
    };
    hit.userData.screw = s;
    c.part.screws.add(s);
    return s;
  });

  const bounds = new THREE.Box3().setFromObject(root);
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  // Widest horizontal reach from the centre: rotating the model can bring any of it face-on.
  let horizRadius = 0;
  const v = new THREE.Vector3();
  for (const p of parts) {
    for (const m of p.meshes) {
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        horizRadius = Math.max(horizRadius, Math.hypot(v.x - sphere.center.x, v.z - sphere.center.z));
      }
    }
  }

  return {
    level,
    name: cfg.name,
    intro: cfg.intro || null,
    root,
    parts,
    screws,
    center: sphere.center,
    radius: sphere.radius,
    horizRadius,
    colors: PALETTE.slice(0, k),
  };
}
