# Tidefarer 3D — Emberwick

A cel-shaded **3D reimagining of Tidefarer's home isle**, playable in the
browser on PC and mobile. Open **`index.html`** to play.

This is a **vertical slice / engine**, not the whole game. It converts the look
*and* the moment-to-moment play of Chapter I (Emberwick) to 3D — terrain,
exploration, combat, enemies, NPCs, HUD, a day cycle. It is deliberately the
foundation the remaining islands and the 2D game's deep systems (full quest
graph, dialog trees, economy, cutscenes, the other 8 worlds and their dungeons)
would be ported into region by region — that remains a large ongoing effort.

## What plays today

- **One cohesive procedural island** with real elevation and biomes — beach,
  meadow, forest, and a rocky ruin-tor — generated from a heightmap, not flat
  discs. The isle's real zones from the 2D game are placed by their in-game
  coordinates: the Village, Orin's Tower, Driftwood Dock, Willa's Farm, the
  Slime Meadow, Whisperwood, the Old Ruins, Rask's Grove, Ember Springs,
  Smuggler's Cove and the Old Orchard.
- **Combat** — swing your sword to squash **slimes** and see off **wolves**;
  enemies wander, aggro, chase and hit back, with damage numbers, knockback,
  death and respawn. You have vigour, stamina, a dodge **roll**, and coins.
- **NPCs** — Elder Maren, Willa and Rask, with floating name labels and real
  lines lifted from the game; walk up and **talk**.
- **A day/night cycle** — a moving sun, shifting sky and fog, lamplight and
  glowing windows that carry into dusk, and a clock.
- **HUD** — vigour/stamina bars, coins, a live **minimap** (zones, enemies,
  NPCs, your heading), zone banners, dialogue toasts, and a hit vignette.
- **AAA-leaning look** — warm soft key light, soft grounded shadows, bloom on
  lamps/windows, atmospheric haze, a filmic warm colour-grade + vignette, and
  cel-shaded ink outlines throughout.

## Controls

| | PC | Mobile |
|---|---|---|
| Move | WASD / arrows | left-thumb stick |
| Look | drag mouse, or Q/E (turn) + R/C (tilt) | right-thumb look stick |
| Zoom | mouse wheel | — |
| Swing | Space | **SWING** |
| Talk / interact | F | **TALK** |
| Dodge roll | Shift | **ROLL** |
| Warp to a zone | keys 1–9 | — |

The player is **the masked princess** — the castaway who is secretly royalty,
in her pale Emberwick mask (dark eye-slits, the red warrior's sigil, her bound
ponytail) with eyes that blink, matching the 2D game's protagonist.

## Running it

Uses ES modules + an import-map, so it must be served over HTTP (not `file://`):
on GitHub Pages `…/tidefarer3d/index.html` just works; locally run
`python3 -m http.server` from the repo root.

## Files

- `index.html` — the playable 3D game (this).
- `emberwick.html` — the earlier static look-test (village vignette), kept for
  reference.
- `vendor/` — Three.js r160 core + the minimal post-processing modules,
  vendored locally. No CDN, no build step; every mesh, texture, the terrain and
  the sky are generated in code.

## Performance

Auto-scales on touch devices (lower pixel ratio, smaller shadow map, no
antialiasing, lighter terrain/particles, flat water). Only the sun casts
shadows. On real GPU hardware it runs far faster and looks sharper than a
software renderer.
