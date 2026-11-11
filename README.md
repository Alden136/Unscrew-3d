# Unscrew 3D

A mobile-first 3D screw-sorting puzzle that runs in the browser, built with Three.js and Vite.

**Play it:** <https://alden136.github.io/unscrew-3d/>

## How to play

Spin the model, tap screws to unscrew them, and sort them into the matching colour boxes.
A full box flies away and a new colour takes its place. A screw with no matching box goes to
the tray, and if the tray fills up with nothing left to play, you're out of space. When a part
has no screws left it tumbles away. Take the whole model apart to win.

A screw is covered if a part sits right in front of it. Tapping it makes it wiggle, and the
part in the way flashes red.

| Action | Input |
| --- | --- |
| Rotate the model | drag |
| Zoom | pinch, or the mouse wheel |
| Unscrew | tap a screw |
| **+ Slot** | adds one tray slot, once per level (also offered when you run out of space) |

The game is portrait only. On a phone turned sideways it asks you to turn it upright, and the
clock pauses.

### Levels

There are 20 levels, each a different hand-built model: birdhouse, cottage, robot, lighthouse,
windmill, roadster, rocket, snowman, tree house, sailboat, steam train, hot-air balloon, castle
gate, pagoda, tractor, propeller plane, mushroom house, ferris wheel, satellite and clock tower.
The number of colours goes from 3 to 7, with a few easier levels along the way.

Two mechanics arrive gradually:

- **Glass parts** (from level 2): you can see through them, but they still cover the screws
  behind them.
- **Frozen screws** (from level 6): the first tap cracks the ice, the second unscrews.

The level list (grid button, top left) replays any level you've unlocked.

### Stars

Each level has three stars, one per goal:

1. **Taken apart**: finish the level.
2. **Tidy**: send at most 2 screws to the tray, without using an extra slot.
3. **Fast**: beat the target time shown next to the progress bar. The clock starts on your first
   tap and pauses while a dialog or the level list is open.

The win screen shows which goals you hit. The level list keeps your best result for each level.

## Running it

```bash
npm install
npm run dev      # dev server, also reachable from a phone on the same network
npm test         # level tests (see below)
npm run build    # static build in dist/, with relative paths so it can be hosted anywhere
```

To play from a phone's home screen, open the page and use **Add to Home Screen**. The web app
manifest makes it open full-screen in portrait.

## Deploying

Every push to the default branch runs `.github/workflows/deploy-pages.yml`, which runs the
tests, builds the game and publishes it to GitHub Pages. The repository's Pages source must be
set to GitHub Actions (**Settings → Pages → Build and deployment → Source**).

## Project layout

| File | What it does |
| --- | --- |
| `src/models.js` | The 20 models and each level's settings. |
| `src/level.js` | Turns a model into a level: places the screws and assigns colours. |
| `src/main.js` | The game: rendering, input, boxes and tray, falling parts, timer, stars, dialogs. |
| `src/screw.js` | The screw mesh, with an oversized invisible hit area for fingers. |
| `src/audio.js` | Synthesized sound effects and vibration. There are no audio files. |
| `index.html`, `src/style.css` | The UI, drawn in HTML and CSS with inline SVG icons over the 3D canvas. |
| `tests/levels.test.mjs` | The level tests. |
| `public/` | App icons and the web app manifest. |

The font is Fredoka, bundled from `@fontsource-variable/fredoka` so the game works offline.
Progress (current and unlocked levels, stars, tips already seen) and the sound setting are
saved in the browser's `localStorage`.

### Models and levels

Each model is a list of parts, listed from the inside out. Parts are built from boxes,
cylinders, domes, cones, spheres and tori, and can be marked as glass.

Each entry in `LEVELS` picks a model and sets its number of colours, a screw cap, frozen
screws, and an optional one-time tip. It can also set its own target time with `par`.
Otherwise the target is about 2.2 seconds per screw plus a little for each frozen screw.

### How screws are placed

Screw spots are sampled on part surfaces. A spot is only used if the screw head sits in open
air, and nothing from the same part or an earlier part covers it. That rule means the
"covers" relationship can't loop, so every level can always be fully taken apart. The screw
total is always a multiple of 3, with each colour in sets of 3.

A part with no screws is decorative. It never covers a screw, and it falls with the part it
is attached to: whatever it touches, or a part named with `on(...)`. A decoration marked
`fixed(...)` belongs to the base and stays until the level is cleared.

## Tests

`npm test` plays every level as a player would. It turns the camera only within the game's
limits and taps only screws the game would accept. It fails if:

- a level can't be fully taken apart,
- a screw is buried inside another part,
- an uncovered screw can be tapped from fewer than 5% of camera angles,
- or two levels use the same model.

The deploy workflow runs these tests before publishing.

For browser automation, `window.__unscrew` exposes the game state and a few helpers.
