// Tiny synthesized sound effects (no audio files needed).
let ctx = null;
let enabled = true;
try { enabled = localStorage.getItem('unscrew3d.sound') !== 'off'; } catch { /* storage unavailable */ }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ freq = 440, to = null, dur = 0.1, type = 'sine', vol = 0.15, delay = 0 }) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  unlock() { if (enabled) ac(); },
  unscrew() {
    tone({ freq: 380, to: 1100, dur: 0.16, type: 'square', vol: 0.05 });
    tone({ freq: 900, to: 1500, dur: 0.08, type: 'triangle', vol: 0.08, delay: 0.12 });
  },
  crack() {
    tone({ freq: 2400, to: 1200, dur: 0.06, type: 'square', vol: 0.05 });
    tone({ freq: 1800, to: 700, dur: 0.12, type: 'triangle', vol: 0.1, delay: 0.03 });
  },
  land() { tone({ freq: 1500, to: 900, dur: 0.06, type: 'triangle', vol: 0.12 }); },
  blocked() { tone({ freq: 160, to: 90, dur: 0.15, type: 'sawtooth', vol: 0.08 }); },
  box() {
    [660, 880, 1320].forEach((f, i) => tone({ freq: f, dur: 0.14, type: 'triangle', vol: 0.12, delay: i * 0.07 }));
  },
  drop() { tone({ freq: 260, to: 70, dur: 0.35, type: 'sine', vol: 0.18 }); },
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.13, delay: i * 0.1 }));
  },
  fail() {
    [440, 370, 311, 262].forEach((f, i) => tone({ freq: f, dur: 0.25, type: 'sawtooth', vol: 0.06, delay: i * 0.14 }));
  },
};

export function isSoundEnabled() { return enabled; }
export function setSoundEnabled(on) {
  enabled = on;
  try { localStorage.setItem('unscrew3d.sound', on ? 'on' : 'off'); } catch { /* ignore */ }
}

export function vibrate(ms) {
  if (enabled && navigator.vibrate) navigator.vibrate(ms);
}
