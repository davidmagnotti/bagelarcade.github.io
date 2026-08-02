# Tidefarer 3D — Emberwick

A cel-shaded **3D reimagining of Tidefarer's home isle**, playable in the
browser on PC and mobile. Open **`index.html`** to play.

This is a **vertical slice / engine**, not the whole game. It converts the look
*and* the moment-to-moment play of Chapter I (Emberwick) to 3D — terrain,
exploration, combat, enemies, NPCs, HUD, a day cycle. It is deliberately the
foundation the remaining islands and the 2D game's deep systems (full quest
graph, dialog trees, economy, cutscenes, the other 8 worlds and their dungeons)
would be ported into region by region — that remains a large ongoing effort.

## Emberwick coverage (audit vs. the 2D game)

**In the 3D slice now:**
- All **11 named landmarks** as terrain clearings: Village, Willa's Farm,
  Driftwood Dock, Orin's Tower, the Old Ruins, Slime Meadow, Whisperwood,
  Rask's Grove, Ember Springs, Smuggler's Cove, Old Orchard.
- All **11 isle NPCs**, each with real lines: Elder Maren, Bram the Smith,
  Willa the Farmer, Rask the Bladesworn, **Sage Orin** (wizard), **Captain
  Brant**, **Finn the Fisher**, **Perrin the Innkeep**, **Nia**, **the
  Woodworker** — plus **Pip the cat**.
- Buildings: cottages, the well, Orin's Tower, the forge, and the **Ember
  Hearth** inn.
- Enemies: **slimes**, **wolves**, **skeletons**, and the **Hollow King** boss
  (crowned, with a ghostlight aura) at the ruins — his dread grays the sky as
  you approach and lifts as you leave.
- The **sword quest** chain (Maren → Bram → chop/mine → forge).

**Not yet ported (the ongoing systems work):** building interiors, the full
quest graph and turn-ins (Rask's parry drill, Willa's kill/feast quests, Orin's
gravelord/skeleton hunts, Brant's ship-repair *set-sail* line, Nia's cat/shell
quests), fishing/cooking/farming/smithing economy, fog-of-war + fast travel,
and the other 8 islands and their dungeons. Those remain the large remaining
effort — this island is the populated, playable template they'd follow.

## What plays today

- **One cohesive procedural island** with real elevation and biomes — beach,
  meadow, forest, and a rocky ruin-tor — generated from a heightmap, not flat
  discs. The isle's real zones from the 2D game are placed by their in-game
  coordinates: the Village, Orin's Tower, Driftwood Dock, Willa's Farm, the
  Slime Meadow, Whisperwood, the Old Ruins, Rask's Grove, Ember Springs,
  Smuggler's Cove and the Old Orchard.
- **Combat** — swing your sword to squash **slimes**, **wolves** and
  **skeletons**; enemies wander, aggro, chase, and **telegraph** their strikes
  (a red **!** that flares **WHITE**), with damage numbers, knockback, death and
  respawn. Vigour, stamina, and coins.
- **Parry** — pure timing, no extra button: swing on a foe's **white flash** and
  your guard turns the blow (staggers them, no damage taken). Taught by
  **Rask's drill** in the grove — turn his blade three times to learn it.
- **Solid collision** — you can't walk through buildings, trees, rocks, the
  forge, or people.
- Drops **straight into the isle** (no title screen); Elder Maren wakes you.
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
| Swing (once earned) | Space | **SWING** |
| Talk / chop / mine | F | contextual button |
| Dash (earned later) | Shift | — |
| Pause | Esc / P | ❚❚ button |
| Warp to a zone | keys 1–9 | — |

**First quest — the sword.** You wash ashore **beside Bram's forge**, exactly as
in the 2D game, and **Elder Maren** is at your side (you can't move until her
four-page wake-speech — lifted verbatim — is done). She sends you to **Bram** at
the forge east of the well; he hands you an axe and pick and asks for **1 wood +
1 stone** — **chop** a tree and **mine** a rock, bring them back, and he forges
your **iron sword**, then sends you **east past the meadow to Rask** to learn the
parry. Only then can you fight. The action button is contextual — it shows
**TALK / CHOP / MINE** only when something's in reach.

The player is **the masked princess** — the castaway who is secretly royalty,
in her pale Emberwick mask (dark eye-slits, the red warrior's sigil, her bound
ponytail) with eyes that blink, and **her mother's pendant at her throat**,
matching the 2D game's protagonist.

**Parity with the 2D isle.** Emberwick's layout and opening are ported 1:1 from
the 2D game: every zone, building, NPC and enemy sits at its original in-game
tile, every NPC speaks its **verbatim** 2D lines, and the sword-quest and Rask's
parry-drill dialogue are the 2D game's own text. The Old Ruins reach north to a
**cold spit** where the **Hollow King** and his five bone-guard stand, as they do
in the 2D isle; the **Ember Hearth** inn, **Willa's Farm**, **Driftwood Dock**,
**Orin's Tower**, **Rask's Grove**, **Smuggler's Cove** and the **Whisperwood**
(where **Pip** prowls) all keep their 2D positions.

## Running it

Uses ES modules + an import-map, so it must be served over HTTP (not `file://`):
on GitHub Pages `…/td3d/index.html` just works; locally run
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
