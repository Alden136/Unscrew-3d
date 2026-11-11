# Unscrew 3D

A mobile 3D screw-sorting puzzle for the browser, built with Three.js and Vite.

**Play it:** <https://alden136.github.io/unscrew-3d/>

## How to play

Drag to spin the model and tap screws to sort them into matching colour boxes. Screws with no
matching box go to the tray; fill it and you're out of space. Take the whole model apart to win.

There are 20 levels, each a different model. Glass parts appear from level 2 and frozen screws
(two taps) from level 6. Each level awards up to three stars: finish it, send at most 2 screws
to the tray, and beat the target time.

## Running it

```bash
npm install
npm run dev      # dev server, reachable from a phone on the same network
npm test         # checks every level can be fully taken apart
npm run build    # static build in dist/
```

Pushes to the default branch are tested and published to GitHub Pages by
`.github/workflows/deploy-pages.yml`.

## Code

- `src/models.js`: the 20 models and per-level settings
- `src/level.js`: places screws so every level is solvable
- `src/main.js`: the game itself
- `index.html`, `src/style.css`: the UI
- `tests/levels.test.mjs`: level tests
