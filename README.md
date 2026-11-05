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

The level list (grid button, top left) replays any level you've unlocked.

Each level has three stars to earn, one per goal:

1. **Taken apart**: finish the level.
2. **Tidy**: send at most 2 screws to the tray, without using an extra slot.
3. **Fast**: beat the target time shown next to the progress bar. The clock starts on your
   first tap and pauses while a dialog or the level list is open. The target is about 2.2
   seconds per screw plus a little for ice; a level can set its own with `par` in
   `src/models.js`.

The win screen shows which goals you hit, and the level list keeps your best result.

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
