import * as THREE from 'three';

// Shared geometry for every screw. Local +Y points out of the surface the screw sits in.
const headGeo = new THREE.CylinderGeometry(0.17, 0.18, 0.07, 24);
headGeo.translate(0, 0.035, 0);

const capGeo = new THREE.SphereGeometry(0.17, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2);
capGeo.scale(1, 0.35, 1);
capGeo.translate(0, 0.07, 0);

const slotGeo = new THREE.BoxGeometry(0.22, 0.035, 0.045);
slotGeo.translate(0, 0.115, 0);

const shaftGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.42, 10);
shaftGeo.translate(0, -0.21, 0);

const threadGeo = new THREE.TorusGeometry(0.05, 0.012, 4, 12);
threadGeo.rotateX(Math.PI / 2);

// Generous invisible hit target so screws are easy to tap with a finger.
const hitGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 10);
hitGeo.translate(0, 0.08, 0);

// Everything above is modelled at unit size; scale it up so heads read clearly on a phone.
const SCALE = 1.3;
for (const g of [headGeo, capGeo, slotGeo, shaftGeo, threadGeo, hitGeo]) g.scale(SCALE, SCALE, SCALE);

const shaftMat = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.85, roughness: 0.3 });
const hitMat = new THREE.MeshBasicMaterial({ visible: false });

const matCache = new Map();
function materialsFor(hex) {
  if (!matCache.has(hex)) {
    const base = new THREE.Color(hex);
    matCache.set(hex, {
      head: new THREE.MeshStandardMaterial({ color: base, roughness: 0.32, metalness: 0.08 }),
      slot: new THREE.MeshStandardMaterial({ color: base.clone().multiplyScalar(0.4), roughness: 0.6 }),
    });
  }
  return matCache.get(hex);
}

/** Build a screw mesh group. Returns { group, hit }. */
export function createScrew(hex) {
  const m = materialsFor(hex);
  const group = new THREE.Group();

  const head = new THREE.Mesh(headGeo, m.head);
  const cap = new THREE.Mesh(capGeo, m.head);
  const s1 = new THREE.Mesh(slotGeo, m.slot);
  const s2 = new THREE.Mesh(slotGeo, m.slot);
  s2.rotation.y = Math.PI / 2;
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  head.castShadow = cap.castShadow = true;
  group.add(head, cap, s1, s2, shaft);

  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(threadGeo, shaftMat);
    t.position.y = (-0.08 - i * 0.08) * SCALE;
    group.add(t);
  }

  const hit = new THREE.Mesh(hitGeo, hitMat);
  group.add(hit);
  return { group, hit };
}
