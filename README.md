# Unscrew 3D

A mobile-first 3D screw-sorting puzzle that runs in the browser (Three.js + Vite).

Spin a model through 360°, tap screws to unscrew them, and sort them into the matching
colour boxes. Screws with no matching box wait in the tray. If the tray fills up, you lose.
Once a part has no screws left, it tumbles away. Take the whole model apart to win.

## Play

```bash
npm install
npm run dev        # serves on your LAN too, so you can open it on your phone
npm run build      # static build in dist/ (relative paths, host anywhere)
```

On a phone, open the dev URL and use **Add to Home Screen**. The page ships a web app
manifest, so it launches full-screen in portrait.

## Live build

Every push to the default branch is built and published to GitHub Pages by
`.github/workflows/deploy-pages.yml`:
<https://alden136.github.io/unscrew-3d/>

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Controls

| Action | Input |
| --- | --- |
| Rotate the model | drag |
| Zoom | pinch / mouse wheel |
| Unscrew | tap a screw |
| **+ Slot** booster | adds one tray slot (once per level, also offered when you run out of space) |
| **Hint** booster | turns the camera to a free screw that fits an open box |

## How it works

- `src/level.js`: model templates (windmill, robot, rocket, cottage), built from simple
  primitives. Screw spots are sampled on part surfaces. A spot is legal only if no part
  listed earlier (further inside) covers it, so the "covers" graph has no cycles and every
  level can be fully taken apart. Screw colours always come in multiples of 3. Difficulty
  (screw count, number of colours) goes up with the level number, and models repeat in a
  cycle.
- `src/main.js`: game loop, input (tap vs. drag), raycast blocking checks, box/tray logic,
  part-falling animation, boosters, win/lose flow.
- `src/screw.js`: shared screw mesh (head, cross slot, threaded shaft, oversized
  invisible hit target for fingers).
- `src/audio.js`: synthesized WebAudio sound effects and haptics. There are no asset files.

Progress (current level) and the sound setting are saved in `localStorage`.

`window.__unscrew` exposes the game state for automated testing.
