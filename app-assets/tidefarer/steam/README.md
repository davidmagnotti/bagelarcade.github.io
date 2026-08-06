# Tidefarer — Steam Graphical Assets

The full set of store, library and community art for the **Tidefarer** Steamworks
listing, rendered on-brand from the game's identity: a lone sailboat on a calm
sea at sunset — navy dusk sky, a sinking sun, cream sails, teal water.

Live copies (handy for pasting URLs into Steamworks):
`https://bagelarcade.com/app-assets/tidefarer/steam/<filename>`

## Graphical assets → where they go in Steamworks

Upload under **Store → Edit Store Page → Graphical Assets** (and **Library Assets**):

| File | Size | Steamworks slot |
|------|------|-----------------|
| `small_capsule_462x174.png` | 462×174 | **Small Capsule** — search results, lists, recommendations. Must carry a legible logo. |
| `header_capsule_920x430.png` | 920×430 | **Header Capsule** — top of the store page, wishlist, cart. The primary capsule. |
| `main_capsule_1232x706.png` | 1232×706 | **Main Capsule** — front-page / featured carousels and daily deals. |
| `vertical_capsule_748x896.png` | 748×896 | **Vertical Capsule** — seasonal-sale and some category pages. |
| `page_background_1438x810.png` | 1438×810 | **Page Background** — atmospheric fill behind the store page (kept dark/quiet so content stays readable). |
| `library_capsule_600x900.png` | 600×900 | **Library Capsule** — portrait "box art" tile in a player's Steam library grid. |
| `library_hero_3840x1240.png` | 3840×1240 | **Library Hero** — wide banner behind the library detail page. No logo baked in — Steam overlays the library logo on top (boat sits right-of-centre to keep the left clear). |
| `library_logo_1280x720.png` | 1280×720 | **Library Logo** — transparent PNG (emblem + wordmark) laid over the hero. |
| `community_icon_184x184.png` | 184×184 | **Community Icon** — group/hub avatar; square, tight on the boat. |

### Screenshots
`screenshots/` holds six 1920×1080 captures from **live gameplay** (Steam's
recommended screenshot size; minimum five required). Same shots as the
Microsoft/Apple sets, in upload order:

1. `tidefarer-1-world` — the isle, village and sea, HUD live
2. `tidefarer-2-village` — moving through Emberwick village
3. `tidefarer-3-map` — the Emberwick Isle world map
4. `tidefarer-4-quests` — the quest log
5. `tidefarer-5-skills` — melee / archery / fishing / farming skills and perks
6. `tidefarer-6-satchel` — the inventory / satchel

## Not generated here (you still need these for a Steam release)

- **Client icon** — a 32×32 icon in your depot (`.ico`/`.tga`), set in the app's
  installation config. Derive it from `community_icon_184x184.png` if you want a
  match. (Store-page assets above do **not** cover this.)
- **Trailer** — Steam strongly recommends at least one video; not an image asset.
- **Age/description/tags** — text metadata, entered in Steamworks directly.

## Brand colors

| Purpose | Hex |
|---------|-----|
| Dusk sky (top) | `#273750` |
| Warm horizon band | `#caa05c` |
| Sun core → edge | `#ffe9ae` → `#e97b23` |
| Sea (teal → navy) | `#207d73` → `#213a50` |
| Cream sails / wordmark | `#efe6d2` |
| Gold rule accent | `#d9b268` |

## Regenerating

All capsule/library/logo/icon art is pure vector, so it re-exports crisply at
any size. Sources live in `../_source/`:

- `scene.js` — the shared brand scene (boat, sun, sea) and the `TIDEFARER`
  wordmark, as SVG.
- `build-steam.js` — composes every deliverable above at its exact pixel size.

```sh
cd ../_source
NODE_PATH=$(npm root -g) node build-steam.js      # writes into ../steam
```

Requires Playwright + Chromium (the repo's capture toolchain). Screenshots are
copied from the live-gameplay captures in `../screenshots/microsoft/`.
