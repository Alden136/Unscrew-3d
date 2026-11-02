# Unscrew 3D

A mobile-first 3D screw-sorting puzzle that runs in the browser (Three.js + Vite).

Spin a model through 360°, tap screws to unscrew them, and sort them into the matching
colour boxes. Screws with no matching box wait in the tray. If the tray fills up, you lose.
Once a part has no screws left, it tumbles away. Take the whole model apart to win.

There are 20 levels, each a different hand-built model: birdhouse, cottage, robot,
lighthouse, windmill, roadster, rocket, snowman, tree house, sailboat, steam train,
hot-air balloon, castle gate, pagoda, tractor, propeller plane, mushroom house,
ferris wheel, satellite and clock tower. New mechanics arrive gradually:

- **Glass parts** (from level 2): you can see through them, but they still block the
  screws behind them.
- **Frozen screws** (from level 6): the first tap cracks the ice, the second unscrews.

The level list (grid button, top left) replays any level you've unlocked. Each level awards
up to three stars: you lose one for needing an extra tray slot and one for using hints.

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

- `src/models.js`: the 20 models, built from simple primitives (boxes, cylinders, domes,
  cones, spheres, tori), and each level's settings: colours, screw cap, frozen screws and an
  optional one-time tip.
- `src/level.js`: turns a model into a level. Screw spots are sampled on part surfaces. A
  spot is legal only if the head sits in open air and no part listed earlier (further
  inside) covers it, so the "covers" graph has no cycles and every level can be fully taken
  apart. Parts that end up with no screws never cover a screw, and they fall with the part
  they're attached to. Screw colours always come in multiples of 3.
- `src/main.js`: game loop, input (tap vs. drag), raycast blocking checks, box/tray logic,
  part-falling animation, boosters, win/lose flow.
- `src/screw.js`: shared screw mesh (head, cross slot, threaded shaft, oversized
  invisible hit target for fingers).
- `src/audio.js`: synthesized WebAudio sound effects and haptics. There are no asset files.
- `index.html` and `src/style.css`: the UI (title screen, HUD, boxes, tray, boosters, dialogs and
  level list), drawn with HTML/CSS and inline SVG icons over the transparent 3D canvas. The font
  is Fredoka, bundled from `@fontsource-variable/fredoka` so the game works offline.

Progress (current and unlocked levels) and the sound setting are saved in `localStorage`.

## Tests

`npm test` plays every level the way a player would: it orbits the camera only within the
game's limits and taps only screws the game accepts. It fails if a level can't be fully
taken apart, if a screw is buried inside another part, or if an uncovered screw is
tappable from fewer than 5% of camera angles. The Pages workflow runs it before deploying.

`window.__unscrew` exposes the game state for automated testing.
