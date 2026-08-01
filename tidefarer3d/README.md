# Tidefarer 3D — Emberwick look-test

A standalone, self-contained **cel-shaded 3D** rebuild of Tidefarer's home isle,
**Emberwick**, made to answer one question: *what would Tidefarer feel like in
3D, and is it worth doing?* It is a look/feel prototype, **not** the real game
engine — none of the 2D game's systems (quests, dialog, economy, combat) are
here.

Open `emberwick.html` to walk around.

## What's in it

The signature beats of the 2D isle, rebuilt as toon geometry:

- **Emberwick Village** — timber-framed cottages with slate/terracotta roofs,
  glowing windows, a tiled plaza, and the well.
- **Orin's Tower** — a stone beacon with a lit window.
- **Driftwood Dock** — planks and the moored ferry you arrive on.
- **The Slime Meadow** — bouncing green slimes you can squash.
- **Whisperwood** — a stand of bushy trees; **Willa's fold** with sheep.
- Iron **lamp-posts** with live flames, berry bushes, flowers, grass.

The "AAA" feel comes from lighting, not polygons: a warm low-angle sun, soft
grounded shadows, **bloom** on the lamplight and windows, atmospheric haze, and
a warm colour-grade + vignette — tuned toward the mood of the 2D game.

## Controls

| | PC | Mobile |
|---|---|---|
| Move | WASD / arrows | left-thumb joystick |
| Look | drag mouse | right-side drag |
| Zoom | mouse wheel | — |
| Swing (squash a slime) | Space | **SWING** button |
| Jump to a landmark | keys **1–6** | — |

## Running it

Because it uses ES modules + an import-map, it must be served over HTTP, not
opened as a `file://` path:

- On GitHub Pages it just works: `…/tidefarer3d/emberwick.html`.
- Locally: `python3 -m http.server` from the repo root, then open
  `http://localhost:8000/tidefarer3d/emberwick.html`.

## Dependencies / assets

- **Three.js r160** is vendored under `vendor/` (core + the minimal
  post-processing modules) — no CDN, no build step, in keeping with the game's
  no-external-assets ethos.
- Every mesh, texture, and the sky are generated in code. There are no image or
  model files.

## Performance notes

Detects touch devices and dials back automatically (lower pixel ratio, smaller
shadow map, no antialiasing, flat water, fewer scatter instances). Only the sun
casts shadows; lamps/beacon are cheap point lights that don't. On real GPU
hardware it runs far faster than in a software renderer.
