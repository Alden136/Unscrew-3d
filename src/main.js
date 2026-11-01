import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildLevel, RAY_FAR } from './level.js';
import { sfx, isSoundEnabled, setSoundEnabled, vibrate } from './audio.js';
import './style.css';

const BOX_COUNT = 4;
const BASE_BUFFER = 5;
const MAX_BUFFER = 7;
const SLOT_BOOSTERS = 1;
const HINTS = 3;

const $ = (s) => document.querySelector(s);
const div = (cls) => { const e = document.createElement('div'); e.className = cls; return e; };
const ui = {
  boxes: $('#boxes'), buffer: $('#buffer'), stage: $('#stage'), canvas: $('#c'), fx: $('#fx'),
  level: $('#level-label'), progress: $('#progress-fill'), toast: $('#toast'),
  overlay: $('#overlay'), ovTitle: $('#ov-title'), ovText: $('#ov-text'), ovPrimary: $('#ov-primary'), ovSecondary: $('#ov-secondary'),
  slotBtn: $('#bst-slot'), hintBtn: $('#bst-hint'), sound: $('#btn-sound'), restart: $('#btn-restart'),
};

// ---------------------------------------------------------------------------
// Three.js scene
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

scene.add(new THREE.HemisphereLight(0xffffff, 0x88b46a, 0.9));
const sun = new THREE.DirectionalLight(0xfff4e0, 1.7);
sun.position.set(6, 12, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 35 });
sun.shadow.normalBias = 0.03;
scene.add(sun);

const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.ShadowMaterial({ opacity: 0.16 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
const controls = new OrbitControls(camera, ui.canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.rotateSpeed = 0.85;
controls.minPolarAngle = 0.25;
controls.maxPolarAngle = 1.75;
controls.autoRotateSpeed = 0.8;

function resize() {
  const { clientWidth: w, clientHeight: h } = ui.stage;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(ui.stage);
resize();

// ---------------------------------------------------------------------------
// Tiny tween system
// ---------------------------------------------------------------------------
const tweens = new Set();
const animate = (dur, update) => new Promise((res) => tweens.add({ t: 0, dur, update, res }));
const easeOut = (k) => 1 - (1 - k) ** 3;
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let G = null;
const rc = new THREE.Raycaster();
const tmpV = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);
const qTmp = new THREE.Quaternion();

function savedLevel() {
  try { return Math.max(1, parseInt(localStorage.getItem('unscrew3d.level'), 10) || 1); } catch { return 1; }
}
function saveLevel(n) {
  try { localStorage.setItem('unscrew3d.level', String(n)); } catch { /* ignore */ }
}

function disposeLevel(g) {
  scene.remove(g.root);
  for (const p of g.parts) {
    p.meshes.forEach((m) => m.geometry.dispose());
    p.mat.dispose();
  }
}

function startLevel(n) {
  if (G) disposeLevel(G);
  hideOverlay();
  ui.fx.innerHTML = '';

  const L = buildLevel(n);
  scene.add(L.root);
  G = {
    ...L,
    boxes: new Array(BOX_COUNT).fill(null),
    cells: [],
    buffer: [],
    need: {},
    hexOf: {},
    removed: 0,
    pending: 0,
    transitions: 0,
    over: false,
    won: false,
    falling: [],
    slotBoosters: SLOT_BOOSTERS,
    hints: HINTS,
  };
  for (const s of G.screws) {
    G.need[s.color] = (G.need[s.color] || 0) + 1;
    G.hexOf[s.color] = s.hex;
  }
  for (const c in G.need) G.need[c] /= 3;

  ui.level.textContent = `Level ${n}`;
  ui.buffer.innerHTML = '';
  for (let i = 0; i < BASE_BUFFER; i++) addSlot(false);
  ui.boxes.innerHTML = '';
  for (let i = 0; i < BOX_COUNT; i++) {
    const cell = div('box-cell');
    ui.boxes.append(cell);
    G.cells.push(cell);
  }
  for (let i = 0; i < BOX_COUNT; i++) spawnBox(i, false);

  fitCamera();
  controls.autoRotate = true;
  updateProgress();
  updateBoosters();
  updateBufferWarn();
  saveLevel(n);
  toast(n === 1 ? 'Drag to rotate · Tap a screw to unscrew it' : G.name, n === 1 ? 4500 : 1800);
}

function fitCamera() {
  const vf = THREE.MathUtils.degToRad(camera.fov);
  const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  const d = (G.radius / Math.sin(Math.min(vf, hf) / 2)) * 0.66;
  controls.target.copy(G.center);
  camera.position.setFromSpherical(new THREE.Spherical(d, 1.18, 0.5)).add(G.center);
  controls.minDistance = d * 0.55;
  controls.maxDistance = d * 1.6;
  controls.update();
}

// ---------------------------------------------------------------------------
// Boxes & tray
// ---------------------------------------------------------------------------
function addSlot(animated) {
  const el = div(animated ? 'hole new' : 'hole');
  ui.buffer.append(el);
  G.buffer.push({ el, color: null, hex: null, state: 'empty' });
}

function accessibleCounts() {
  const counts = {};
  for (const s of G.screws) if (!s.removed && !blockerOf(s)) counts[s.color] = (counts[s.color] || 0) + 1;
  return counts;
}

function pickNextColor() {
  const cands = Object.keys(G.need).filter((c) => G.need[c] > 0);
  if (!cands.length) return null;
  const present = new Set(G.boxes.filter(Boolean).map((b) => b.color));
  const access = accessibleCounts();
  const inTray = {};
  for (const b of G.buffer) if (b.color) inTray[b.color] = (inTray[b.color] || 0) + 1;
  // Favour colours the player can actually reach right now, and colours stuck in the tray.
  const weights = cands.map((c) => (1 + 2 * (access[c] || 0) + 5 * (inTray[c] || 0)) * (present.has(c) ? 0.3 : 1));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  let pick = cands[cands.length - 1];
  for (let i = 0; i < cands.length; i++) {
    r -= weights[i];
    if (r <= 0) { pick = cands[i]; break; }
  }
  G.need[pick]--;
  return pick;
}

function spawnBox(i, animated = true) {
  const g = G;
  const cell = G.cells[i];
  cell.innerHTML = '';
  const color = pickNextColor();
  if (!color) {
    G.boxes[i] = null;
    cell.append(div('box empty-cell'));
    return;
  }
  const el = div(animated ? 'box enter' : 'box');
  el.style.setProperty('--c', G.hexOf[color]);
  const inner = div('inner');
  const holes = [div('hole'), div('hole'), div('hole')];
  inner.append(...holes);
  el.append(inner);
  cell.append(el);
  const box = { i, color, el, holes, reserved: 0, filled: 0, leaving: animated };
  G.boxes[i] = box;
  if (animated) {
    G.transitions++;
    setTimeout(() => {
      if (G !== g) return;
      box.leaving = false;
      G.transitions--;
      pullFromBuffer();
      checkState();
    }, 360);
  }
}

function completeBox(box) {
  const g = G;
  box.leaving = true;
  G.transitions++;
  sfx.box();
  vibrate(18);
  setTimeout(() => box.el.classList.add('done'), 140);
  setTimeout(() => {
    if (G !== g) return;
    G.transitions--;
    spawnBox(box.i, true);
    checkState();
  }, 650);
}

function screwIcon(hex, extra = '') {
  const e = div(`screw-icon ${extra}`);
  e.style.setProperty('--c', hex);
  return e;
}

function landInBox(box, idx, hex) {
  box.holes[idx].append(screwIcon(hex, 'pop'));
  box.filled++;
  sfx.land();
  if (box.filled === 3) completeBox(box);
}

function landInTray(slot) {
  slot.el.append(screwIcon(slot.hex, 'pop'));
  slot.state = 'filled';
  sfx.land();
  pullFromBuffer();
}

/** Reserve a landing spot for a screw of `color`: a matching box first, else the tray. */
function reserveDestination(color, hex) {
  const box = G.boxes.find((b) => b && !b.leaving && b.color === color && b.reserved < 3);
  if (box) {
    const idx = box.reserved++;
    return { el: box.holes[idx], land: () => landInBox(box, idx, hex) };
  }
  const slot = G.buffer.find((b) => b.state === 'empty');
  if (slot) {
    Object.assign(slot, { state: 'incoming', color, hex });
    return { el: slot.el, land: () => landInTray(slot) };
  }
  return null;
}

/** Move any tray screws that now have a matching open box. */
function pullFromBuffer() {
  for (const box of G.boxes) {
    if (!box || box.leaving) continue;
    for (const slot of G.buffer) {
      if (box.reserved >= 3) break;
      if (slot.state !== 'filled' || slot.color !== box.color) continue;
      const from = centerOf(slot.el);
      const hex = slot.hex;
      slot.el.innerHTML = '';
      Object.assign(slot, { state: 'empty', color: null, hex: null });
      const idx = box.reserved++;
      G.pending++;
      flyTo(hex, from, box.holes[idx], () => landInBox(box, idx, hex));
    }
  }
  updateBufferWarn();
}

function updateBufferWarn() {
  const free = G.buffer.filter((b) => b.state === 'empty').length;
  ui.buffer.classList.toggle('full-soon', free <= 1);
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function flyTo(hex, from, el, onLand) {
  const g = G;
  const r = el.getBoundingClientRect();
  const size = r.width;
  const f = screwIcon(hex, 'flyer');
  f.style.width = f.style.height = `${size}px`;
  ui.fx.append(f);
  const sx = from.x - size / 2, sy = from.y - size / 2;
  const tx = r.left, ty = r.top;
  const mx = (sx + tx) / 2, my = Math.min(sy, ty) - 50;
  const anim = f.animate(
    [
      { transform: `translate(${sx}px, ${sy}px) scale(1.3) rotate(0deg)` },
      { transform: `translate(${mx}px, ${my}px) scale(1.45) rotate(200deg)`, offset: 0.5 },
      { transform: `translate(${tx}px, ${ty}px) scale(1) rotate(360deg)` },
    ],
    { duration: 480, easing: 'ease-in-out', fill: 'forwards' },
  );
  anim.onfinish = () => {
    f.remove();
    if (G !== g) return;
    G.pending--;
    onLand();
    checkState();
  };
}

// ---------------------------------------------------------------------------
// Screws & parts
// ---------------------------------------------------------------------------
/** The first attached part covering this screw, or null if the screw is free. */
function blockerOf(s) {
  const meshes = [];
  for (const p of G.parts) if (p.attached && !p.decor && p !== s.part) meshes.push(...p.meshes);
  rc.set(tmpV.copy(s.pos).addScaledVector(s.normal, 0.02), s.normal);
  rc.near = 0;
  rc.far = RAY_FAR;
  const hit = rc.intersectObjects(meshes, false)[0];
  return hit ? hit.object.userData.part : null;
}

function screenPos(v) {
  const p = v.clone().project(camera);
  const r = ui.canvas.getBoundingClientRect();
  return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
}

async function tryRemove(s) {
  const g = G;
  if (!G || G.over || G.won || s.removed) return;
  const blocker = blockerOf(s);
  if (blocker) {
    wiggle(s);
    flashPart(blocker);
    sfx.blocked();
    vibrate(25);
    return;
  }
  const dest = reserveDestination(s.color, s.hex);
  if (!dest) {
    wiggle(s);
    if (G.pending > 0 || G.transitions > 0) return; // things are still settling; let them finish
    ui.buffer.classList.remove('warn');
    void ui.buffer.offsetWidth;
    ui.buffer.classList.add('warn');
    sfx.blocked();
    checkState();
    return;
  }

  s.removed = true;
  s.part.screws.delete(s);
  G.removed++;
  G.pending++;
  updateProgress();
  sfx.unscrew();
  vibrate(10);
  controls.autoRotate = false;

  const start = s.pos.clone();
  await animate(0.26, (k) => {
    s.mesh.position.copy(start).addScaledVector(s.normal, 0.6 * easeOut(k));
    s.mesh.quaternion.copy(s.baseQuat).multiply(qTmp.setFromAxisAngle(Y, -k * Math.PI * 4));
  });
  if (G !== g) return;
  // The base (part 0) anchors the model and only falls away once the level is cleared.
  if (s.part.screws.size === 0 && s.part.attached && s.part.index !== 0) dropPart(s.part);
  const from = screenPos(s.mesh.position);
  s.mesh.removeFromParent();
  flyTo(s.hex, from, dest.el, dest.land);
}

function wiggle(s) {
  const tan = new THREE.Vector3().crossVectors(s.normal, Math.abs(s.normal.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : Y).normalize();
  animate(0.32, (k) => {
    if (s.removed) return;
    s.mesh.position.copy(s.pos).addScaledVector(tan, Math.sin(k * Math.PI * 6) * 0.06 * (1 - k));
  });
}

function flashPart(p) {
  animate(0.45, (k) => p.mat.emissive.setRGB(0.55 * (1 - k), 0.05 * (1 - k), 0));
}

function dropPart(p) {
  p.attached = false;
  sfx.drop();
  vibrate(15);
  const dir = p.center.clone().sub(G.center).setY(0);
  if (dir.lengthSq() < 0.01) dir.set(Math.random() - 0.5, 0, 1);
  dir.normalize().multiplyScalar(2.5 + Math.random() * 1.5);
  dir.y = 3 + Math.random() * 2;
  const rnd = () => (Math.random() - 0.5) * 6;
  p.mat.transparent = true;
  G.falling.push({ p, vel: dir, spin: new THREE.Vector3(rnd(), rnd(), rnd()), t: 0 });
}

function updateFalling(dt) {
  if (!G) return;
  for (let i = G.falling.length - 1; i >= 0; i--) {
    const f = G.falling[i];
    f.t += dt;
    f.vel.y -= 16 * dt;
    f.p.group.position.addScaledVector(f.vel, dt);
    f.p.group.rotation.x += f.spin.x * dt;
    f.p.group.rotation.y += f.spin.y * dt;
    f.p.group.rotation.z += f.spin.z * dt;
    if (f.t > 0.7) f.p.mat.opacity = Math.max(0, 1 - (f.t - 0.7) / 0.6);
    if (f.t > 1.3) {
      f.p.group.removeFromParent();
      G.falling.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Win / lose
// ---------------------------------------------------------------------------
function checkState() {
  if (!G) return;
  updateBufferWarn();
  if (G.over || G.won) return;
  if (G.removed === G.screws.length) {
    if (G.pending === 0 && G.transitions === 0) win();
    return;
  }
  if (G.pending > 0 || G.transitions > 0) return;
  // Lose only when the tray is full and no reachable screw fits an open box.
  if (!G.buffer.every((b) => b.state === 'filled')) return;
  const open = new Set(G.boxes.filter((b) => b && !b.leaving && b.reserved < 3).map((b) => b.color));
  const canMove = G.screws.some((s) => !s.removed && open.has(s.color) && !blockerOf(s));
  if (!canMove) fail();
}

function fail() {
  G.over = true;
  sfx.fail();
  vibrate(80);
  const canExtend = G.slotBoosters > 0 && G.buffer.length < MAX_BUFFER;
  showOverlay({
    title: 'Out of Space!',
    text: canExtend ? 'The tray is full. Add an extra slot to keep going?' : 'The tray is full and no screw fits a box.',
    primary: canExtend
      ? { label: '+1 Slot', fn: () => { useSlotBooster(); G.over = false; hideOverlay(); } }
      : { label: 'Retry', fn: () => startLevel(G.level) },
    secondary: canExtend ? { label: 'Retry', fn: () => startLevel(G.level) } : null,
  });
}

async function win() {
  G.won = true;
  const g = G;
  for (const p of G.parts) if (p.attached) dropPart(p);
  sfx.win();
  vibrate(40);
  confetti();
  controls.autoRotate = true;
  await wait(1100);
  if (G !== g) return;
  showOverlay({
    title: 'Level Complete!',
    text: `You took apart the ${G.name.toLowerCase()}!`,
    primary: { label: 'Next Level', fn: () => startLevel(G.level + 1) },
    secondary: { label: 'Replay', fn: () => startLevel(G.level) },
  });
}

function confetti() {
  const colors = ['#ec3a3a', '#2c6fe8', '#ffc61a', '#2fbf55', '#9150e6', '#ff5fc4'];
  for (let i = 0; i < 60; i++) {
    const c = div('confetti');
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    c.style.animationDelay = `${Math.random() * 0.4}s`;
    ui.fx.append(c);
    setTimeout(() => c.remove(), 3500);
  }
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function updateProgress() {
  ui.progress.style.width = `${(100 * G.removed) / Math.max(1, G.screws.length)}%`;
}

function updateBoosters() {
  ui.slotBtn.querySelector('.count').textContent = G.slotBoosters;
  ui.hintBtn.querySelector('.count').textContent = G.hints;
  ui.slotBtn.disabled = G.slotBoosters <= 0 || G.buffer.length >= MAX_BUFFER;
  ui.hintBtn.disabled = G.hints <= 0;
}

let toastTimer = 0;
function toast(msg, ms = 2000) {
  ui.toast.textContent = msg;
  ui.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.add('hidden'), ms);
}

function showOverlay({ title, text, primary, secondary }) {
  ui.ovTitle.textContent = title;
  ui.ovText.textContent = text;
  ui.ovPrimary.textContent = primary.label;
  ui.ovPrimary.onclick = primary.fn;
  ui.ovSecondary.classList.toggle('hidden', !secondary);
  if (secondary) {
    ui.ovSecondary.textContent = secondary.label;
    ui.ovSecondary.onclick = secondary.fn;
  }
  ui.overlay.classList.remove('hidden');
}
function hideOverlay() { ui.overlay.classList.add('hidden'); }

// ---------------------------------------------------------------------------
// Boosters
// ---------------------------------------------------------------------------
function useSlotBooster() {
  if (G.slotBoosters <= 0 || G.buffer.length >= MAX_BUFFER) return;
  G.slotBoosters--;
  addSlot(true);
  updateBoosters();
  updateBufferWarn();
}

function useHint() {
  if (!G || G.over || G.won || G.hints <= 0) return;
  const open = new Set(G.boxes.filter((b) => b && !b.leaving && b.reserved < 3).map((b) => b.color));
  const free = G.screws.filter((s) => !s.removed && !blockerOf(s));
  const s = free.find((x) => open.has(x.color)) || free[0];
  if (!s) return;
  G.hints--;
  updateBoosters();
  focusOn(s);
  animate(1.4, (k) => {
    if (s.removed) return;
    s.mesh.scale.setScalar(1 + 0.6 * Math.abs(Math.sin(k * Math.PI * 4)) * (1 - k * 0.3));
  }).then(() => s.mesh.scale.setScalar(1));
}

function focusOn(s) {
  controls.autoRotate = false;
  const target = controls.target;
  const dist = camera.position.distanceTo(target);
  const startDir = camera.position.clone().sub(target).normalize();
  const endDir = s.normal.clone().multiplyScalar(0.75).add(s.pos.clone().sub(target).normalize().multiplyScalar(0.25));
  endDir.y = THREE.MathUtils.clamp(endDir.y, -0.15, 0.85);
  endDir.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(startDir, endDir);
  const qi = new THREE.Quaternion();
  animate(0.6, (k) => {
    qi.identity().slerp(q, easeInOut(k));
    camera.position.copy(startDir).applyQuaternion(qi).multiplyScalar(dist).add(target);
  });
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
function handleTap(x, y) {
  if (!G || G.over || G.won) return;
  const r = ui.canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  rc.setFromCamera(ndc, camera);
  rc.near = 0;
  rc.far = Infinity;
  const live = G.screws.filter((s) => !s.removed).map((s) => s.hit);
  const hit = rc.intersectObjects(live, false)[0];
  if (!hit) return;
  // Ignore screws hidden behind solid geometry from this viewpoint.
  const solid = G.parts.filter((p) => p.attached).flatMap((p) => p.meshes);
  const wall = rc.intersectObjects(solid, false)[0];
  if (wall && wall.distance < hit.distance - 0.25) return;
  tryRemove(hit.object.userData.screw);
}

let tap = null;
let activePointers = 0;
ui.canvas.addEventListener('pointerdown', (e) => {
  activePointers++;
  sfx.unlock();
  controls.autoRotate = false;
  tap = activePointers === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() } : null;
});
ui.canvas.addEventListener('pointermove', (e) => {
  if (tap && e.pointerId === tap.id && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 10) tap = null;
});
const endPointer = (e) => {
  activePointers = Math.max(0, activePointers - 1);
  if (tap && e.pointerId === tap.id) {
    if (e.type === 'pointerup' && performance.now() - tap.t < 450) handleTap(e.clientX, e.clientY);
    tap = null;
  }
};
window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);

ui.slotBtn.addEventListener('click', () => { sfx.unlock(); useSlotBooster(); });
ui.hintBtn.addEventListener('click', () => { sfx.unlock(); useHint(); });
ui.restart.addEventListener('click', () => { sfx.unlock(); startLevel(G.level); });
ui.sound.classList.toggle('muted', !isSoundEnabled());
ui.sound.addEventListener('click', () => {
  setSoundEnabled(!isSoundEnabled());
  ui.sound.classList.toggle('muted', !isSoundEnabled());
  sfx.unlock();
});

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  for (const t of tweens) {
    t.t += dt;
    const k = Math.min(1, t.t / t.dur);
    t.update(k);
    if (k >= 1) { tweens.delete(t); t.res(); }
  }
  updateFalling(dt);
  controls.update();
  renderer.render(scene, camera);
});

// Debug / automated-test hook.
window.__unscrew = {
  get state() { return G; },
  startLevel,
  tryRemove: (s) => tryRemove(s),
  blockerOf: (s) => blockerOf(s),
  project: (v) => screenPos(v),
};

startLevel(savedLevel());
