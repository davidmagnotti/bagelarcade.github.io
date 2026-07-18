# Tidefarer

Isometric sandbox adventure (formerly the single-file `ember.html`). All art is
drawn procedurally and all audio is synthesized — there are no external assets.

## Structure

- `index.html` — the shell: HUD/panel markup, links `styles.css`, and loads the
  `js/*.js` files **in numeric order** (they are plain classic scripts sharing
  one global scope, so order matters).
- `styles.css` — all styling.
- `js/` — the game logic, split by the original section comments:

| File | Section |
|------|---------|
| `01-core.js` | constants, helpers, value noise, synth audio, canvas, game-state root |
| `02-worldgen.js` | world generation & object placement |
| `03-art.js` | procedural sprites + the mascot figure |
| `04-data.js` | items, skills, quests, NPCs, mobs |
| `05-inventory-skills-quests.js` | inventory / skills / quest logic |
| `06-dialog.js` | dialog system, toasts & floating text |
| `07-input.js` | keyboard, mouse, touch joystick |
| `08-ui-panels.js` | panels, hotbar, HUD |
| `09-gameplay.js` | interaction, gathering, combat, per-frame updates |
| `10-rendering.js` | world rendering, minimap & big map |
| `11-main-loop.js` | main loop & boot |
| `12-world-layer.js` | the mainland, sailing, dodge roll |
| `13-aaa-layer.js` | adaptive music, ambience, weather, dynamic light, juice |
| `14-meta-layer.js` | achievements, save codes, gamepad |
| `15-interiors.js` | building interiors |
| `16-autosave.js` | auto-save to local storage |
| `17-pause-menu.js` | pause menu & settings |
| `18-economy.js` | materials, smithing, cooking, brewing, trade |
| `19-purpose.js` | village projects & supply contracts |
| `20-lore.js` | lore, living interiors, extra quests |
| `21-exploration.js` | fog of war, zone discovery, fast travel |
| `22-definitive-edition.js` | definitive-edition polish layer |
| `23-pause-affordance.js` | pause-screen affordance |

The split is byte-for-byte faithful: concatenating `js/*.js` in order reproduces
the original inline script exactly, so behavior is unchanged.
