// Hand-built models, one per level, plus each level's difficulty settings.
//
// Every model is a list of parts, listed inner-most first. A screw may only be covered by parts
// that come later in the list, which guarantees the model can always be taken apart.
// Primitives are positioned in model (world) space: y is up, the front faces +z.

const PI = Math.PI;

// --- primitive helpers -------------------------------------------------------
// r = Euler rotation [x, y, z]; f = direction the primitive's local +y axis should face (overrides r).
const B = (w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => ({ t: 'box', s: [w, h, d], p: [x, y, z], r: [rx, ry, rz] });
const C = (rt, rb, h, x, y, z, rx = 0, ry = 0, rz = 0) => ({ t: 'cyl', s: [rt, rb, h], p: [x, y, z], r: [rx, ry, rz] });
const D = (r, x, y, z, rx = 0, ry = 0, rz = 0) => ({ t: 'dome', s: [r], p: [x, y, z], r: [rx, ry, rz] });
const K = (r, h, x, y, z, rx = 0, ry = 0, rz = 0) => ({ t: 'cone', s: [r, h], p: [x, y, z], r: [rx, ry, rz] });
const S = (r, x, y, z) => ({ t: 'sphere', s: [r], p: [x, y, z], r: [0, 0, 0] });
/** Torus: ring radius R, tube radius r. Lies in the local XY plane (axis along z). */
const T = (R, r, x, y, z, rx = 0, ry = 0, rz = 0) => ({ t: 'torus', s: [R, r], p: [x, y, z], r: [rx, ry, rz] });
/** Point a primitive's local +y axis along `dir` (e.g. a disc mounted on a curved wall). */
const facing = (prim, dir) => ({ ...prim, f: dir });

const part = (name, color, screws, ...prims) => ({ name, color, screws, prims });
const glass = (p) => ({ ...p, glass: true });

/** Unit direction in the xz-plane at angle `a` from +z (towards +x). */
const around = (a) => [Math.sin(a), 0, Math.cos(a)];

// --- models --------------------------------------------------------------------
const MODELS = {
  birdhouse() {
    const flower = (x, z, color) => part('flower', color, 0, C(0.035, 0.035, 0.42, x, 0.56, z), S(0.14, x, 0.8, z));
    return [
      part('base', '#86d95a', 3, C(1.6, 1.7, 0.35, 0, 0.175, 0)),
      part('post', '#b9824f', 2, B(0.5, 2.6, 0.5, 0, 1.65, 0)),
      part('house', '#f6c26b', 5, B(1.8, 1.6, 1.6, 0, 3.75, 0)),
      part('braces', '#a8703f', 0, B(0.14, 0.75, 0.14, -0.47, 2.62, 0, 0, 0, 0.64), B(0.14, 0.75, 0.14, 0.47, 2.62, 0, 0, 0, -0.64)),
      part('shelf', '#d79a55', 2, B(1.2, 0.15, 0.6, 0, 3.05, 1.08)),
      part('entrance', '#6b3b1f', 1, C(0.35, 0.35, 0.1, 0, 3.95, 0.83, PI / 2, 0, 0)),
      part('trim', '#ffffff', 0, T(0.42, 0.06, 0, 3.95, 0.86)),
      part('perch', '#8a5a33', 0, C(0.06, 0.06, 0.45, 0, 3.55, 1.02, PI / 2, 0, 0)),
      part('bird', '#4fb6e8', 0,
        S(0.2, 0.25, 3.33, 1.1), S(0.14, 0.42, 3.56, 1.16),
        K(0.05, 0.15, 0.6, 3.56, 1.16, 0, 0, -PI / 2), B(0.2, 0.05, 0.12, 0.0, 3.4, 1.1, 0, 0, 0.5)),
      part('roof-l', '#e05a3a', 3, B(1.5, 0.2, 2.0, -0.55, 4.95, 0, 0, 0, 0.7)),
      part('roof-r', '#e05a3a', 3, B(1.5, 0.2, 2.0, 0.55, 4.95, 0, 0, 0, -0.7)),
      part('ridge', '#b8432a', 1, B(0.3, 0.18, 2.1, 0, 5.5, 0)),
      flower(1.0, 0.65, '#ff7eb6'),
      flower(-0.95, 0.75, '#ffffff'),
      flower(0.65, -1.0, '#ffd23f'),
    ];
  },

  cottage() {
    const ang = Math.atan2(1.35, 2);
    // Picket fence with a gap for the gate in front of the door.
    const fence = (x0, x1) => {
      const prims = [B(x1 - x0, 0.12, 0.08, (x0 + x1) / 2, 0.62, 2.0), B(x1 - x0, 0.12, 0.08, (x0 + x1) / 2, 0.95, 2.0)];
      for (let x = x0 + 0.15; x <= x1 - 0.1; x += 0.45) prims.push(B(0.22, 0.75, 0.08, x, 0.8, 2.08));
      return prims;
    };
    return [
      part('lawn', '#7fd257', 8, B(5.6, 0.4, 4.6, 0, 0.2, 0)),
      part('walls', '#fff1d6', 9, B(3.6, 2.4, 2.8, 0, 1.6, 0)),
      part('gable', '#f4dcb0', 2, B(1.6, 0.7, 2.7, 0, 3.15, 0)),
      part('roof-l', '#d9553a', 4, B(2.5, 0.25, 3.4, -1.0, 3.45, 0, 0, 0, ang)),
      part('roof-r', '#d9553a', 4, B(2.5, 0.25, 3.4, 1.0, 3.45, 0, 0, 0, -ang)),
      part('ridge', '#a83b26', 1, B(0.32, 0.2, 3.5, 0, 4.25, 0)),
      part('chimney', '#a8634a', 2, B(0.5, 1.0, 0.5, 1.1, 4.1, -0.7)),
      part('chimney-cap', '#6b4a3a', 0, B(0.64, 0.12, 0.64, 1.1, 4.66, -0.7)),
      part('door', '#9a5530', 2, B(0.8, 1.3, 0.12, -0.7, 1.05, 1.45)),
      part('door-knob', '#ffc61a', 0, S(0.07, -0.45, 1.0, 1.53)),
      part('doorstep', '#c9c2b4', 1, B(0.84, 0.18, 0.56, -0.7, 0.49, 1.78)),
      part('path', '#b5afa4', 0, C(0.16, 0.16, 0.05, -0.68, 0.42, 2.2)),
      glass(part('window', '#7fd4ff', 2, B(0.9, 0.7, 0.12, 0.8, 1.9, 1.45))),
      part('shutters', '#4f8fd8', 2, B(0.3, 0.75, 0.08, 0.18, 1.9, 1.46), B(0.3, 0.75, 0.08, 1.42, 1.9, 1.46)),
      part('window-box', '#a8703f', 1, B(1.0, 0.22, 0.3, 0.8, 1.32, 1.56)),
      part('blooms', '#ff7eb6', 0, S(0.08, 0.5, 1.49, 1.56), S(0.08, 0.8, 1.5, 1.58), S(0.08, 1.1, 1.49, 1.56)),
      part('side-window', '#7fd4ff', 2, B(0.12, 0.7, 0.9, 1.85, 1.8, 0)),
      part('fence-l', '#f4ead8', 2, ...fence(-2.6, -1.2)),
      part('fence-r', '#f4ead8', 3, ...fence(-0.25, 2.6)),
      part('mailbox', '#3c6fd8', 2, B(0.4, 0.9, 0.4, -2.3, 0.85, 1.3)),
      part('mail-flag', '#e04848', 0, B(0.05, 0.3, 0.14, -2.08, 1.15, 1.3)),
      part('bush', '#4fb04a', 3, D(0.7, 2.1, 0.4, -1.4)),
      part('tree', '#45b14a', 2, S(0.72, -2.25, 2.25, -1.75), S(0.5, -2.0, 2.75, -1.55)),
      part('trunk', '#8a5a33', 0, C(0.16, 0.2, 1.5, -2.25, 1.1, -1.75)),
    ];
  },

  robot() {
    return [
      part('plate', '#7f8fa6', 6, C(2.2, 2.3, 0.4, 0, 0.2, 0)),
      part('leg-l', '#4d6fa8', 3, B(0.8, 1.6, 0.8, -0.6, 1.2, 0)),
      part('leg-r', '#4d6fa8', 3, B(0.8, 1.6, 0.8, 0.6, 1.2, 0)),
      part('torso', '#e8edf5', 8, B(2.4, 2.0, 1.4, 0, 3.0, 0)),
      part('belt', '#2b3a55', 2, B(2.5, 0.3, 1.5, 0, 2.17, 0)),
      part('neck', '#7f8fa6', 2, C(0.32, 0.32, 0.35, 0, 4.17, 0)),
      part('head', '#e8edf5', 6, B(1.6, 1.2, 1.2, 0, 4.9, 0)),
      part('ear-l', '#ff8a1c', 1, C(0.3, 0.3, 0.2, -0.9, 4.9, 0, 0, 0, PI / 2)),
      part('ear-r', '#ff8a1c', 1, C(0.3, 0.3, 0.2, 0.9, 4.9, 0, 0, 0, PI / 2)),
      part('eyes', '#7fe8ff', 0, S(0.12, -0.3, 5.0, 0.55), S(0.12, 0.3, 5.0, 0.55)),
      glass(part('visor', '#2b3a55', 2, B(1.2, 0.36, 0.12, 0, 5.0, 0.64))),
      part('mouth', '#4a5a80', 0, B(0.7, 0.16, 0.06, 0, 4.6, 0.62)),
      part('antenna', '#ff8a1c', 1, B(0.3, 0.6, 0.3, 0, 5.8, 0)),
      part('antenna-ball', '#e04848', 1, S(0.22, 0, 6.27, 0)),
      part('panel', '#a9b8d0', 3, B(1.3, 0.9, 0.15, 0, 3.1, 0.76)),
      part('buttons', '#e04848', 0,
        C(0.09, 0.09, 0.06, -0.35, 3.3, 0.86, PI / 2, 0, 0), C(0.09, 0.09, 0.06, 0, 3.3, 0.86, PI / 2, 0, 0),
        C(0.09, 0.09, 0.06, 0.35, 3.3, 0.86, PI / 2, 0, 0)),
      part('pack', '#a9b8d0', 4, B(1.6, 1.4, 0.5, 0, 3.1, -0.95)),
      part('arm-l', '#4d6fa8', 3, B(0.6, 1.8, 0.6, -1.55, 2.9, 0)),
      part('arm-r', '#4d6fa8', 3, B(0.6, 1.8, 0.6, 1.55, 2.9, 0)),
      part('shoulder-l', '#ff8a1c', 1, D(0.42, -1.55, 3.8, 0)),
      part('shoulder-r', '#ff8a1c', 1, D(0.42, 1.55, 3.8, 0)),
      part('hand-l', '#7f8fa6', 2, B(0.7, 0.5, 0.7, -1.55, 1.75, 0)),
      part('hand-r', '#7f8fa6', 2, B(0.7, 0.5, 0.7, 1.55, 1.75, 0)),
      part('knee-l', '#7f8fa6', 1, C(0.3, 0.3, 0.14, -0.6, 1.25, 0.46, PI / 2, 0, 0)),
      part('knee-r', '#7f8fa6', 1, C(0.3, 0.3, 0.14, 0.6, 1.25, 0.46, PI / 2, 0, 0)),
      part('foot-l', '#2b3a55', 2, B(1.0, 0.5, 1.3, -0.6, 0.65, 0.2)),
      part('foot-r', '#2b3a55', 2, B(1.0, 0.5, 1.3, 0.6, 0.65, 0.2)),
    ];
  },

  lighthouse() {
    const r = (y) => 1.5 - (0.5 * (y - 0.6)) / 4.2; // tower radius at height y
    const posts = Array.from({ length: 8 }, (_, i) => {
      const a = (i * PI) / 4 + PI / 8;
      return B(0.08, 0.3, 0.08, Math.sin(a) * 1.38, 5.15, Math.cos(a) * 1.38);
    });
    return [
      part('rock', '#9aa3ad', 6, C(2.6, 2.9, 0.6, 0, 0.3, 0)),
      part('boulders', '#7f8894', 2, S(0.35, 1.95, 0.75, 0.9), S(0.28, 1.55, 0.72, 1.65), S(0.3, -1.3, 0.72, 1.9)),
      part('tower', '#fbfbf7', 8, C(1.0, 1.5, 4.2, 0, 2.7, 0)),
      part('shed', '#c98b5a', 3, B(1.0, 0.8, 0.8, -1.85, 1.0, -1.1)),
      part('shed-roof', '#8a4a32', 1, B(1.2, 0.12, 1.05, -1.85, 1.47, -1.1, 0.18, 0, 0)),
      part('shed-door', '#6b4a3a', 1, B(0.4, 0.6, 0.06, -1.85, 0.92, -0.67)),
      part('stripe-low', '#e04848', 3, C(r(1.375) + 0.06, r(1.825) + 0.06, 0.45, 0, 1.6, 0)),
      part('stripe-high', '#e04848', 3, C(r(2.975) + 0.06, r(3.425) + 0.06, 0.45, 0, 3.2, 0)),
      part('gallery', '#3b4656', 4, C(1.45, 1.45, 0.2, 0, 4.9, 0)),
      part('railing', '#3b4656', 0, ...posts, T(1.38, 0.045, 0, 5.28, 0, PI / 2, 0, 0)),
      part('lamp', '#fff2a8', 0, S(0.32, 0, 5.45, 0)),
      glass(part('lantern', '#ffe27a', 3, C(0.75, 0.75, 0.9, 0, 5.45, 0))),
      part('cap', '#e04848', 2, K(0.95, 0.8, 0, 6.3, 0)),
      part('vane', '#3b4656', 0, S(0.13, 0, 6.75, 0), C(0.03, 0.03, 0.45, 0, 7.0, 0), B(0.5, 0.08, 0.04, 0.05, 7.12, 0), K(0.08, 0.16, 0.34, 7.12, 0, 0, 0, -PI / 2)),
      part('door', '#5b7fb8', 2, B(0.7, 1.1, 0.25, 0, 1.15, r(1.15) - 0.01)),
      part('steps', '#c7c2b8', 1, B(0.9, 0.2, 0.4, 0, 0.7, r(1.15) + 0.36)),
      part('window', '#5b7fb8', 1, B(0.45, 0.6, 0.15, 0, 3.9, r(3.9) - 0.02)),
      part('side-window', '#5b7fb8', 1, B(0.45, 0.6, 0.15, r(2.6) - 0.02, 2.6, 0, 0, PI / 2, 0)),
    ];
  },

  windmill() {
    const flower = (x, z, color) => part('flower', color, 0, C(0.035, 0.035, 0.42, x, 0.71, z), S(0.13, x, 0.95, z));
    const pickets = [B(2.0, 0.12, 0.08, 0.8, 0.8, -2.05), B(2.0, 0.12, 0.08, 0.8, 1.1, -2.05)];
    for (let x = -0.05; x <= 1.7; x += 0.45) pickets.push(B(0.22, 0.75, 0.08, x, 0.92, -2.12));
    const parts = [
      part('base', '#86d95a', 7, C(3, 3.1, 0.5, 0, 0.25, 0)),
      part('tower', '#f4e4c4', 9, C(1.35, 1.6, 4, 0, 2.5, 0)),
      part('ring', '#e07a3c', 3, C(1.55, 1.55, 0.3, 0, 4.6, 0)),
      part('roof', '#c75b2a', 4, D(1.45, 0, 4.75, 0)),
      part('finial', '#ffc61a', 0, K(0.2, 0.5, 0, 6.42, 0), S(0.12, 0, 6.72, 0)),
      part('porch', '#fbf0da', 4, B(1.5, 1.9, 0.8, 0, 1.45, 1.55)),
      part('door', '#b3643a', 2, B(0.9, 1.3, 0.12, 0, 1.25, 2.0)),
      part('window', '#d98a4e', 2, B(0.7, 1.0, 0.2, 1.45, 2.6, 0, 0, PI / 2, 0)),
      part('shutters-r', '#6a9e5b', 1, B(0.3, 1.0, 0.08, 1.4, 2.6, 0.62, 0, PI / 2, 0), B(0.3, 1.0, 0.08, 1.4, 2.6, -0.62, 0, PI / 2, 0)),
      part('back-window', '#d98a4e', 2, B(0.7, 1.0, 0.2, -1.45, 2.6, 0, 0, PI / 2, 0)),
      part('shutters-l', '#6a9e5b', 1, B(0.3, 1.0, 0.08, -1.4, 2.6, 0.62, 0, PI / 2, 0), B(0.3, 1.0, 0.08, -1.4, 2.6, -0.62, 0, PI / 2, 0)),
      part('step', '#e9c79a', 3, B(2.2, 0.35, 0.7, 0, 0.68, 2.3)),
      part('crate', '#cf9a5e', 3, B(0.9, 0.8, 0.9, -2.0, 0.9, -1.0, 0, 0.4, 0)),
      part('barrel', '#a8703f', 2, C(0.38, 0.42, 0.9, -1.2, 0.95, -2.05)),
      part('sacks', '#e9d7b0', 2, S(0.35, 1.95, 0.8, 1.15), S(0.3, 2.25, 0.75, 0.5)),
      part('fence', '#f4ead8', 2, ...pickets),
      flower(-1.4, 1.95, '#ff7eb6'),
      flower(1.5, 2.15, '#ffd23f'),
      flower(-1.0, 2.5, '#ffffff'),
      part('hub', '#fbf0da', 1, C(0.32, 0.32, 0.7, 0, 3.4, 1.75, PI / 2, 0, 0)),
    ];
    for (let k = 0; k < 4; k++) {
      const a = PI / 4 + (k * PI) / 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      const px = -dy, py = dx;
      const cx = dx * 1.6, cy = 3.4 + dy * 1.6;
      const rz = a - PI / 2;
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

  car() {
    const parts = [
      part('road', '#5d6470', 4, B(6.2, 0.3, 3.6, 0, 0.15, 0)),
      part('markings', '#f4f1ea', 0, ...[-2.4, -1.0, 0.4, 1.8].map((x) => B(0.6, 0.02, 0.12, x, 0.31, 1.65))),
      part('chassis', '#e8473b', 7, B(4.4, 0.9, 2.0, 0, 1.25, 0)),
      part('stripes', '#f4f1ea', 2, B(1.15, 0.04, 0.25, 1.6, 1.72, -0.2), B(1.15, 0.04, 0.25, 1.6, 1.72, 0.2)),
      part('headlights', '#fff6c2', 0, C(0.18, 0.18, 0.08, 2.23, 1.38, 0.65, 0, 0, PI / 2), C(0.18, 0.18, 0.08, 2.23, 1.38, -0.65, 0, 0, PI / 2)),
      part('grille', '#3b4656', 0, B(0.06, 0.3, 0.7, 2.22, 1.3, 0)),
      part('taillights', '#ff4d5e', 0, B(0.06, 0.18, 0.35, -2.22, 1.42, 0.68), B(0.06, 0.18, 0.35, -2.22, 1.42, -0.68)),
      part('exhaust', '#9aa3ad', 0, C(0.09, 0.09, 0.4, -2.45, 0.92, 0.6, 0, 0, PI / 2)),
      part('cabin', '#f4f1ea', 4, B(2.4, 0.9, 1.8, -0.2, 2.15, 0)),
      glass(part('windshield', '#9fe0ff', 2, B(0.1, 0.65, 1.5, 1.02, 2.15, 0))),
      glass(part('window-l', '#9fe0ff', 1, B(1.6, 0.5, 0.08, -0.2, 2.2, 0.92))),
      glass(part('window-r', '#9fe0ff', 1, B(1.6, 0.5, 0.08, -0.2, 2.2, -0.92))),
      part('mirrors', '#e8473b', 0, B(0.14, 0.14, 0.26, 0.9, 1.95, 1.05), B(0.14, 0.14, 0.26, 0.9, 1.95, -1.05)),
      part('rack', '#3b4656', 2, B(1.8, 0.12, 1.4, -0.2, 2.68, 0)),
      part('luggage', '#ffc61a', 2, B(0.8, 0.4, 0.9, -0.35, 2.94, 0)),
      part('spoiler', '#2b2f36', 2, B(0.45, 0.08, 1.8, -1.95, 2.15, 0), B(0.08, 0.42, 0.08, -1.95, 1.9, 0.6), B(0.08, 0.42, 0.08, -1.95, 1.9, -0.6)),
      part('bumper-f', '#c9ced6', 2, B(0.3, 0.4, 2.0, 2.3, 1.0, 0)),
      part('plate', '#ffffff', 0, B(0.04, 0.2, 0.5, 2.47, 1.0, 0)),
      part('bumper-r', '#c9ced6', 2, B(0.3, 0.4, 2.0, -2.3, 1.0, 0)),
      part('cone', '#ff8a1c', 1, K(0.25, 0.6, 2.7, 0.64, 1.4), B(0.5, 0.06, 0.5, 2.7, 0.33, 1.4)),
    ];
    for (const x of [-1.4, 1.4]) {
      for (const z of [-1.15, 1.15]) {
        parts.push(part('wheel', '#2b2f36', 2, C(0.6, 0.6, 0.4, x, 0.9, z, PI / 2, 0, 0)));
      }
    }
    for (const x of [-1.4, 1.4]) {
      for (const z of [-1.4, 1.4]) {
        parts.push(part('hubcap', '#dfe3ea', 1, C(0.3, 0.3, 0.1, x, 0.9, z, PI / 2, 0, 0)));
      }
    }
    return parts;
  },

  rocket() {
    const padLights = Array.from({ length: 6 }, (_, i) => {
      const a = (i * PI) / 3 + PI / 6;
      return S(0.11, Math.sin(a) * 2.35, 0.53, Math.cos(a) * 2.35);
    });
    const parts = [
      part('pad', '#8a96a8', 7, C(2.6, 2.8, 0.5, 0, 0.25, 0)),
      part('pad-lights', '#ffd23f', 0, ...padLights),
      part('body', '#f5f5f5', 10, C(1.1, 1.1, 4.5, 0, 2.95, 0)),
      part('skirt', '#3b4656', 2, C(1.18, 1.3, 0.35, 0, 0.88, 0)),
      part('band-low', '#3c6fd8', 2, C(1.16, 1.16, 0.25, 0, 2.4, 0)),
      part('nose', '#ec5a3a', 3, K(1.1, 1.6, 0, 6.0, 0)),
      part('tip', '#ffc61a', 0, S(0.12, 0, 6.8, 0)),
      part('band', '#3c6fd8', 4, C(1.18, 1.18, 0.35, 0, 4.6, 0)),
      glass(part('window', '#7fd4ff', 1, C(0.45, 0.45, 0.2, 0, 3.6, 1.12, PI / 2, 0, 0))),
      part('window-frame', '#c9ced6', 0, T(0.47, 0.06, 0, 3.6, 1.18)),
      glass(part('porthole', '#7fd4ff', 1, C(0.32, 0.32, 0.15, 0, 1.75, 1.12, PI / 2, 0, 0))),
    ];
    [PI / 3, PI, (5 * PI) / 3].forEach((th, i) => {
      parts.push(part(`fin-${i}`, '#ec5a3a', 3, B(0.2, 1.6, 1.1, Math.sin(th) * 1.6, 1.45, Math.cos(th) * 1.6, 0, th, 0)));
    });
    const tt = (2 * PI) / 3;
    const at = (r, y) => [Math.sin(tt) * r, y, Math.cos(tt) * r];
    parts.push(part('gantry', '#ffc61a', 5, B(0.5, 4.2, 0.5, ...at(2.4, 2.6), 0, tt, 0)));
    parts.push(part('arm', '#ffc61a', 2, B(0.4, 0.3, 1.3, ...at(1.65, 4.0), 0, tt, 0)));
    parts.push(part('platform', '#3b4656', 1, B(0.85, 0.15, 0.85, ...at(2.4, 4.78), 0, tt, 0)));
    parts.push(part('beacon', '#ff4d5e', 0, S(0.1, ...at(2.74, 4.95))));
    const ft = (4 * PI) / 3; // fuel tank sits between two fins
    parts.push(part('fuel-tank', '#c9ced6', 2, C(0.4, 0.4, 1.0, Math.sin(ft) * 2.0, 1.0, Math.cos(ft) * 2.0)));
    parts.push(part('fuel-pipe', '#7f8fa6', 0, B(0.12, 0.12, 0.7, Math.sin(ft) * 1.35, 1.3, Math.cos(ft) * 1.35, 0, ft, 0)));
    return parts;
  },

  snowman() {
    const coal = '#2b2f36';
    const onBelly = (e) => [0, 3.45 + Math.sin(e) * 1.0, Math.cos(e) * 1.0];
    return [
      part('snow', '#e6f3ff', 4, C(2.4, 2.6, 0.3, 0, 0.15, 0)),
      part('body', '#ffffff', 8, S(1.4, 0, 1.55, 0)),
      part('belly', '#ffffff', 6, S(1.0, 0, 3.45, 0)),
      part('buttons', coal, 0, ...[0.3, 0, -0.3].map((e) => S(0.09, ...onBelly(e)))),
      part('head', '#ffffff', 4, S(0.7, 0, 4.95, 0)),
      part('face', coal, 0,
        S(0.07, -0.22, 5.12, 0.64), S(0.07, 0.22, 5.12, 0.64),
        ...[-0.24, -0.12, 0, 0.12, 0.24].map((x) => S(0.045, x, 4.76 + Math.abs(x) * 0.35, 0.66))),
      part('nose', '#ff8a1c', 0, K(0.15, 0.6, 0, 5.0, 0.9, PI / 2, 0, 0)),
      part('scarf', '#e04848', 3, T(0.72, 0.16, 0, 4.3, 0, PI / 2, 0, 0)),
      part('scarf-tail', '#e04848', 1, B(0.26, 0.6, 0.08, 0.38, 3.95, 0.86, 0, 0, 0.18)),
      part('arm-l', '#8a5a33', 2, B(1.3, 0.22, 0.22, -1.45, 3.75, 0, 0, 0, -0.4)),
      part('arm-r', '#8a5a33', 2, B(1.3, 0.22, 0.22, 1.45, 3.75, 0, 0, 0, 0.4)),
      part('brim', coal, 2, C(0.85, 0.85, 0.12, 0, 5.6, 0)),
      part('hat', coal, 2, C(0.5, 0.5, 0.8, 0, 6.06, 0)),
      part('hat-band', '#e04848', 1, C(0.53, 0.53, 0.2, 0, 5.9, 0)),
      part('broom', '#c98b5a', 1, C(0.05, 0.05, 2.4, 1.7, 1.75, 1.0), C(0.18, 0.32, 0.55, 1.7, 0.58, 1.0)),
      part('snowballs', '#f4faff', 2, S(0.3, -1.6, 0.6, 1.2), S(0.3, -1.95, 0.6, 0.72), S(0.27, -1.75, 0.98, 0.98)),
      part('pine', '#2f8f4e', 2, K(0.55, 0.8, -1.6, 0.7, -1.3), K(0.42, 0.65, -1.6, 1.2, -1.3), K(0.3, 0.5, -1.6, 1.62, -1.3)),
    ];
  },

  treehouse() {
    return [
      part('ground', '#7fd257', 5, C(2.8, 3.0, 0.4, 0, 0.2, 0)),
      part('trunk', '#8a5a33', 6, C(0.55, 0.7, 4.5, 0, 2.65, 0)),
      part('platform', '#d6a36a', 6, B(3.0, 0.25, 3.0, 0, 3.3, 0)),
      part('rail-back', '#b9824f', 2, B(3.0, 0.35, 0.14, 0, 3.6, -1.43)),
      part('rail-left', '#b9824f', 2, B(0.14, 0.35, 3.0, -1.43, 3.6, 0)),
      part('hut', '#f2d29b', 5, B(1.8, 1.3, 1.6, 0.3, 4.075, 0.2)),
      part('door', '#9a5530', 1, B(0.6, 0.9, 0.1, 0.5, 3.9, 1.03)),
      part('window', '#7fd4ff', 1, B(0.1, 0.45, 0.5, 1.23, 4.1, 0.2)),
      part('roof', '#d9553a', 3, B(2.2, 0.25, 2.0, 0.3, 4.95, 0.2, 0, 0, 0.25)),
      part('leaves-big', '#45b14a', 5, S(1.2, -0.3, 6.3, -0.3)),
      part('leaves-small', '#5cc95a', 3, S(0.9, 1.0, 6.0, 0.6)),
      part('ladder', '#c48a4a', 3,
        B(0.22, 3.0, 0.15, -0.4, 1.9, 1.75), B(0.22, 3.0, 0.15, 0.4, 1.9, 1.75),
        B(0.8, 0.12, 0.1, 0, 1.0, 1.75), B(0.8, 0.12, 0.1, 0, 1.7, 1.75),
        B(0.8, 0.12, 0.1, 0, 2.4, 1.75), B(0.8, 0.12, 0.1, 0, 3.1, 1.75)),
    ];
  },

  sailboat() {
    return [
      part('water', '#4fb6e8', 4, C(3.2, 3.3, 0.3, 0, 0.15, 0)),
      part('hull', '#f4f1ea', 6, B(4.2, 1.0, 1.6, -0.2, 0.8, 0)),
      part('bow', '#f4f1ea', 2, B(1.13, 1.0, 1.13, 1.9, 0.8, 0, 0, PI / 4, 0)),
      part('stripe', '#3c6fd8', 3, B(4.25, 0.2, 1.65, -0.2, 0.45, 0)),
      part('deck', '#d6a36a', 4, B(4.3, 0.15, 1.75, -0.2, 1.375, 0)),
      part('cabin', '#f6c26b', 3, B(1.4, 0.8, 1.2, -1.3, 1.85, 0)),
      part('mast', '#8a5a33', 0, C(0.12, 0.15, 4.2, 0.6, 3.55, 0)),
      part('mainsail', '#ffffff', 4, B(1.8, 3.0, 0.08, -0.4, 3.3, 0)),
      part('jib', '#ffe27a', 3, B(1.1, 2.2, 0.08, 1.45, 2.8, 0, 0, 0, -0.35)),
      part('flag', '#e04848', 1, B(0.6, 0.35, 0.06, 0.95, 5.45, 0)),
      part('lifebuoy', '#ff5a3a', 1, T(0.32, 0.11, -1.3, 1.85, 0.72)),
    ];
  },

  train() {
    const parts = [
      part('track', '#6b5a4a', 4, B(6.4, 0.25, 2.0, 0, 0.125, 0)),
      part('chassis', '#2b2f36', 4, B(5.0, 0.4, 1.6, 0, 1.05, 0)),
      part('boiler', '#d23c3c', 6, C(0.85, 0.85, 3.0, 0.8, 2.1, 0, 0, 0, PI / 2)),
      part('cab', '#2f5fae', 5, B(1.6, 2.0, 1.6, -1.5, 2.25, 0)),
      part('cab-roof', '#2b2f36', 2, B(2.0, 0.2, 1.9, -1.5, 3.35, 0)),
      part('chimney', '#2b2f36', 2, C(0.35, 0.25, 0.9, 1.8, 3.3, 0)),
      part('dome', '#ffc61a', 1, D(0.4, 0.5, 2.88, 0)),
      part('smokebox', '#3b4656', 2, C(0.9, 0.9, 0.15, 2.35, 2.1, 0, 0, 0, PI / 2)),
      part('cowcatcher', '#c9ced6', 2, B(0.5, 0.55, 1.4, 2.65, 0.95, 0, 0, 0, 0.5)),
    ];
    for (const x of [-1.6, 0, 1.6]) {
      for (const z of [-0.9, 0.9]) parts.push(part('wheel', '#c9ced6', 1, C(0.55, 0.55, 0.3, x, 0.8, z, PI / 2, 0, 0)));
    }
    return parts;
  },

  balloon() {
    return [
      part('pad', '#86d95a', 4, C(2.2, 2.3, 0.3, 0, 0.15, 0)),
      part('basket', '#b9824f', 4, B(1.4, 1.0, 1.4, 0, 0.8, 0)),
      part('rim', '#8a5a33', 2, B(1.55, 0.15, 1.55, 0, 1.35, 0)),
      part('sandbag-l', '#d9c08a', 1, B(0.5, 0.5, 0.5, -0.97, 0.85, 0)),
      part('sandbag-r', '#d9c08a', 1, B(0.5, 0.5, 0.5, 0.97, 0.85, 0)),
      part('ropes', '#6b5a4a', 0,
        B(0.08, 1.0, 0.08, -0.77, 1.9, -0.77), B(0.08, 1.0, 0.08, 0.77, 1.9, -0.77),
        B(0.08, 1.0, 0.08, -0.77, 1.9, 0.77), B(0.08, 1.0, 0.08, 0.77, 1.9, 0.77)),
      part('balloon', '#ec5a3a', 9, S(2.0, 0, 4.85, 0)),
      part('skirt', '#ffc61a', 2, C(1.05, 0.75, 0.5, 0, 2.6, 0)),
      part('band', '#ffc61a', 4, T(2.0, 0.14, 0, 4.85, 0, PI / 2, 0, 0)),
      part('crown', '#ffc61a', 2, D(0.8, 0, 6.6, 0)),
    ];
  },

  castle() {
    const parts = [
      part('ground', '#7fd257', 6, B(6.4, 0.4, 3.2, 0, 0.2, 0)),
      part('wall', '#c7c2b8', 6, B(3.2, 2.4, 0.8, 0, 1.6, 0)),
      part('tower-l', '#b5afa4', 5, C(0.9, 0.95, 3.6, -2.2, 2.2, 0)),
      part('tower-r', '#b5afa4', 5, C(0.9, 0.95, 3.6, 2.2, 2.2, 0)),
      part('gate', '#8a5a33', 2, B(1.2, 1.6, 0.15, 0, 1.2, 0.47)),
      part('banner-l', '#3c6fd8', 1, B(0.55, 1.0, 0.08, -1.05, 1.9, 0.44)),
      part('banner-r', '#3c6fd8', 1, B(0.55, 1.0, 0.08, 1.05, 1.9, 0.44)),
    ];
    for (const x of [-0.9, 0, 0.9]) parts.push(part('merlon', '#b5afa4', 1, B(0.5, 0.45, 0.8, x, 3.025, 0)));
    for (const x of [-2.2, 2.2]) {
      parts.push(part('spire', '#3c6fd8', 2, K(1.15, 1.4, x, 4.7, 0)));
      parts.push(part('flag', '#ffc61a', 1, B(0.6, 0.4, 0.06, x + 0.3, 5.75, 0), C(0.05, 0.05, 1.0, x, 5.75, 0)));
    }
    return parts;
  },

  pagoda() {
    return [
      part('base', '#b5afa4', 6, B(4.4, 0.4, 4.4, 0, 0.2, 0)),
      part('tier-1', '#d23c3c', 6, B(2.6, 1.2, 2.6, 0, 1.0, 0)),
      part('door-front', '#ffc61a', 1, B(0.8, 0.9, 0.1, 0, 0.85, 1.33)),
      part('door-back', '#ffc61a', 1, B(0.8, 0.9, 0.1, 0, 0.85, -1.33)),
      part('roof-1', '#2f3a4a', 6, B(3.8, 0.2, 3.8, 0, 1.7, 0)),
      part('tier-2', '#d23c3c', 4, B(2.0, 1.0, 2.0, 0, 2.3, 0)),
      part('roof-2', '#2f3a4a', 4, B(3.0, 0.2, 3.0, 0, 2.9, 0)),
      part('tier-3', '#d23c3c', 3, B(1.4, 0.9, 1.4, 0, 3.45, 0)),
      part('roof-3', '#2f3a4a', 3, B(2.2, 0.2, 2.2, 0, 4.0, 0)),
      part('spire', '#ffc61a', 2, K(0.5, 1.4, 0, 4.8, 0)),
    ];
  },

  tractor() {
    const parts = [
      part('field', '#9b6b43', 4, B(6.0, 0.3, 3.6, 0, 0.15, 0)),
      part('body', '#3fae4a', 5, B(3.0, 1.0, 1.4, 0.3, 1.6, 0)),
      part('hood', '#3fae4a', 3, B(1.6, 0.7, 1.2, 1.2, 2.45, 0)),
      part('cabin', '#f4f1ea', 4, B(1.4, 1.6, 1.5, -0.7, 2.9, 0)),
      glass(part('windshield', '#9fe0ff', 1, B(0.08, 1.0, 1.1, 0.02, 3.0, 0))),
      glass(part('side-glass-l', '#9fe0ff', 1, B(1.0, 0.9, 0.08, -0.7, 3.0, 0.79))),
      glass(part('side-glass-r', '#9fe0ff', 1, B(1.0, 0.9, 0.08, -0.7, 3.0, -0.79))),
      part('roof', '#ffc61a', 2, B(1.7, 0.2, 1.8, -0.7, 3.8, 0)),
      part('exhaust', '#3b4656', 0, C(0.15, 0.15, 1.0, 1.7, 3.3, 0.35)),
    ];
    for (const z of [-1.0, 1.0]) parts.push(part('rear-wheel', '#2b2f36', 2, C(1.0, 1.0, 0.5, -0.9, 1.3, z, PI / 2, 0, 0)));
    for (const z of [-1.27, 1.27]) parts.push(part('rear-hub', '#ffc61a', 1, C(0.42, 0.42, 0.12, -0.9, 1.3, z, PI / 2, 0, 0)));
    for (const z of [-0.9, 0.9]) parts.push(part('front-wheel', '#2b2f36', 1, C(0.55, 0.55, 0.4, 1.5, 0.85, z, PI / 2, 0, 0)));
    return parts;
  },

  airplane() {
    return [
      part('stand', '#8a96a8', 2, C(0.8, 1.0, 0.3, 0, 0.15, 0)),
      part('pole', '#8a96a8', 2, C(0.3, 0.3, 1.6, 0, 1.1, 0)),
      part('fuselage', '#f4f1ea', 7, C(0.7, 0.7, 5.0, 0, 2.6, 0, 0, 0, PI / 2)),
      part('nose', '#e8473b', 2, D(0.7, 2.5, 2.6, 0, 0, 0, -PI / 2)),
      part('tail-cone', '#f4f1ea', 2, K(0.7, 1.4, -3.2, 2.6, 0, 0, 0, PI / 2)),
      part('wings', '#3c6fd8', 6, B(1.4, 0.18, 6.0, 0.3, 2.4, 0)),
      part('engine-l', '#c9ced6', 1, C(0.3, 0.3, 0.9, 0.5, 2.0, 1.6, 0, 0, PI / 2)),
      part('engine-r', '#c9ced6', 1, C(0.3, 0.3, 0.9, 0.5, 2.0, -1.6, 0, 0, PI / 2)),
      part('fin', '#e8473b', 2, B(0.9, 1.2, 0.12, -3.0, 3.35, 0)),
      part('stabilizer', '#3c6fd8', 2, B(0.7, 0.12, 2.2, -3.0, 2.7, 0)),
      glass(part('cockpit', '#9fe0ff', 1, D(0.5, 1.2, 3.2, 0))),
      part('propeller', '#3b4656', 2, B(0.1, 1.8, 0.26, 3.25, 2.6, 0), B(0.1, 1.8, 0.26, 3.25, 2.6, 0, PI / 2, 0, 0)),
    ];
  },

  mushroom() {
    const parts = [
      part('grass', '#7fd257', 5, C(2.8, 3.0, 0.35, 0, 0.175, 0)),
      part('stem', '#fbf0da', 6, C(1.2, 1.4, 2.6, 0, 1.65, 0)),
      part('gills', '#f2d29b', 2, C(2.4, 2.4, 0.15, 0, 2.8, 0)),
      part('cap', '#e04848', 9, D(2.4, 0, 2.8, 0)),
      part('door', '#9a5530', 2, B(0.8, 1.3, 0.15, 0, 1.0, 1.33)),
    ];
    for (const a of [-PI / 4, PI / 4, PI]) {
      const d = around(a);
      parts.push(part('window', '#7fd4ff', 1, facing(C(0.3, 0.3, 0.12, d[0] * 1.29, 2.0, d[2] * 1.29), d)));
    }
    // Spots sink into the cap; a spot covers the cap screws beneath it.
    [[0.45, 0.4], [0.9, 2.1], [0.4, 3.4], [0.75, 4.7], [1.25, 5.6]].forEach(([e, a]) => {
      const dir = [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
      parts.push(part('spot', '#ffffff', 1, S(0.38, dir[0] * 2.3, 2.8 + dir[1] * 2.3, dir[2] * 2.3)));
    });
    parts.push(part('chimney', '#b5afa4', 2, C(0.3, 0.3, 1.0, 1.0, 5.1, -0.5)));
    return parts;
  },

  ferris() {
    const legs = (z) => [
      B(0.3, 4.1, 0.3, -0.75, 2.3, z, 0, 0, -0.376),
      B(0.3, 4.1, 0.3, 0.75, 2.3, z, 0, 0, 0.376),
    ];
    const spokes = (z) => [0, PI / 4, PI / 2, (3 * PI) / 4].map((a) => B(4.6, 0.22, 0.12, 0, 4.2, z, 0, 0, a));
    const parts = [
      part('base', '#8a96a8', 5, B(4.4, 0.4, 2.4, 0, 0.2, 0)),
      part('frame-back', '#c9ced6', 3, ...legs(-0.75)),
      part('frame-front', '#c9ced6', 3, ...legs(0.75)),
      part('hub', '#ffc61a', 2, C(0.35, 0.35, 2.3, 0, 4.2, 0, PI / 2, 0, 0)),
      part('spokes-back', '#f4f1ea', 3, ...spokes(-0.55)),
      part('spokes-front', '#f4f1ea', 3, ...spokes(0.55)),
      part('ring-back', '#e8473b', 4, T(2.4, 0.13, 0, 4.2, -0.55)),
      part('ring-front', '#e8473b', 4, T(2.4, 0.13, 0, 4.2, 0.55)),
    ];
    const cabinColors = ['#3c6fd8', '#ffc61a', '#3fae4a', '#ff8a1c', '#9150e6', '#17c3d6'];
    for (let k = 0; k < 6; k++) {
      const a = (k * PI) / 3 + PI / 6;
      parts.push(part('cabin', cabinColors[k], 2, B(0.6, 0.6, 0.86, 2.4 * Math.cos(a), 4.2 + 2.4 * Math.sin(a) - 0.4, 0)));
    }
    return parts;
  },

  satellite() {
    return [
      part('stand', '#8a96a8', 3, C(1.2, 1.4, 0.3, 0, 0.15, 0)),
      part('pole', '#8a96a8', 2, C(0.3, 0.3, 1.4, 0, 1.0, 0)),
      part('core', '#e0b54a', 8, C(1.0, 1.0, 2.6, 0, 3.0, 0)),
      part('ring-low', '#c9ced6', 3, C(1.1, 1.1, 0.25, 0, 1.9, 0)),
      part('ring-high', '#c9ced6', 3, C(1.1, 1.1, 0.25, 0, 4.2, 0)),
      part('arm-l', '#c9ced6', 1, B(0.9, 0.3, 0.3, -1.4, 3.0, 0)),
      part('arm-r', '#c9ced6', 1, B(0.9, 0.3, 0.3, 1.4, 3.0, 0)),
      glass(part('panel-l', '#3b6fd8', 4, B(2.6, 0.1, 1.6, -3.1, 3.0, 0))),
      glass(part('panel-r', '#3b6fd8', 4, B(2.6, 0.1, 1.6, 3.1, 3.0, 0))),
      part('dish', '#f4f1ea', 2, K(1.0, 0.5, 0, 4.6, 0, PI, 0, 0)),
      part('antenna', '#3b4656', 1, B(0.25, 0.9, 0.25, 0, 5.3, 0)),
    ];
  },

  clocktower() {
    const parts = [
      part('plaza', '#b5afa4', 5, C(2.8, 3.0, 0.4, 0, 0.2, 0)),
      part('plinth', '#c7c2b8', 6, B(2.6, 1.2, 2.6, 0, 1.0, 0)),
      part('shaft', '#e9d8b4', 8, B(1.9, 3.6, 1.9, 0, 3.4, 0)),
      part('door', '#8a5a33', 2, B(0.9, 1.1, 0.15, 0, 0.95, 1.35)),
      part('ledge', '#c7c2b8', 4, B(2.2, 0.3, 2.2, 0, 5.35, 0)),
      part('bell', '#ffc61a', 1, D(0.45, 0, 5.5, 0)),
    ];
    for (const a of [0, PI / 2, PI, (3 * PI) / 2]) {
      const d = around(a);
      parts.push(part('clock', '#fbfbf7', 2, facing(C(0.7, 0.7, 0.15, d[0] * 1.02, 4.4, d[2] * 1.02), d)));
    }
    for (const x of [-0.8, 0.8]) for (const z of [-0.8, 0.8]) parts.push(part('pillar', '#e9d8b4', 1, B(0.3, 1.0, 0.3, x, 6.0, z)));
    parts.push(part('roof', '#2f5fae', 4, K(1.6, 1.6, 0, 7.3, 0)));
    return parts;
  },
};

// --- levels --------------------------------------------------------------------
// colors: how many screw colours; maxScrews: cap on screws; ice: screws frozen in ice (two taps);
// intro: one-time tip shown on the level.
export const LEVELS = [
  { model: 'birdhouse', name: 'Birdhouse', colors: 3, maxScrews: 15, intro: 'Drag to rotate · Tap a screw to unscrew it' },
  { model: 'cottage', name: 'Cottage', colors: 3, maxScrews: 21, intro: 'A part falls off when its last screw is out' },
  { model: 'robot', name: 'Robot', colors: 4, maxScrews: 24 },
  { model: 'lighthouse', name: 'Lighthouse', colors: 4, maxScrews: 27, intro: 'Glass parts still block the screws behind them' },
  { model: 'windmill', name: 'Windmill', colors: 4, maxScrews: 30 },
  { model: 'car', name: 'Roadster', colors: 5, maxScrews: 30, ice: 3, intro: 'Frozen screws: the first tap cracks the ice' },
  { model: 'rocket', name: 'Rocket', colors: 5, maxScrews: 33, ice: 3 },
  { model: 'snowman', name: 'Snowman', colors: 4, maxScrews: 24, ice: 4 },
  { model: 'treehouse', name: 'Tree House', colors: 5, maxScrews: 36, ice: 3 },
  { model: 'sailboat', name: 'Sailboat', colors: 5, maxScrews: 30 },
  { model: 'train', name: 'Steam Train', colors: 6, maxScrews: 36, ice: 3 },
  { model: 'balloon', name: 'Hot-Air Balloon', colors: 5, maxScrews: 27 },
  { model: 'castle', name: 'Castle Gate', colors: 6, maxScrews: 36, ice: 4 },
  { model: 'pagoda', name: 'Pagoda', colors: 6, maxScrews: 39, ice: 3 },
  { model: 'tractor', name: 'Tractor', colors: 6, maxScrews: 39, ice: 5 },
  { model: 'airplane', name: 'Propeller Plane', colors: 6, maxScrews: 36, ice: 4 },
  { model: 'mushroom', name: 'Mushroom House', colors: 5, maxScrews: 33 },
  { model: 'ferris', name: 'Ferris Wheel', colors: 7, maxScrews: 45, ice: 4 },
  { model: 'satellite', name: 'Satellite', colors: 7, maxScrews: 42, ice: 5 },
  { model: 'clocktower', name: 'Clock Tower', colors: 7, maxScrews: 48, ice: 6 },
];

export function modelParts(name) {
  const build = MODELS[name];
  if (!build) throw new Error(`unknown model ${name}`);
  return build();
}
