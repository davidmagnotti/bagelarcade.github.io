# Tidefarer — Store Assets

App-store publishing assets for **Tidefarer**. The installable-app (PWA) icons and
manifest live with the game at `tidefarer/`; this folder holds the marketing assets
for the Microsoft/Xbox Store, the Apple App Store, and Steam.

| Store | Folder | What's there |
|-------|--------|--------------|
| Apple App Store | `screenshots/apple/` | 1290×2796 portrait screenshots (app icon ships with the PWA at `tidefarer/icons/icon-1024.png`) |
| Microsoft / Xbox | `screenshots/microsoft/` | 1920×1080 landscape screenshots |
| **Steam** | `steam/` | Full graphical-asset set (capsules, library, hero, transparent logo, community icon) + 1920×1080 screenshots — see `steam/README.md` |

All screenshots are captured from **live gameplay** (no cut-scenes): the isometric
isle of Emberwick, its village and folk, the world map, and the quest / skill /
satchel panels. The dev build tag is stripped for clean captures.

## Screenshots

| Folder | Size | Store | Notes |
|--------|------|-------|-------|
| `screenshots/microsoft/` | 1920×1080 (landscape) | Microsoft / Xbox Store | Exceeds the 1366×768 minimum; sized for desktop + Xbox. Up to 10 accepted. |
| `screenshots/apple/` | 1290×2796 (portrait) | Apple App Store | The required iPhone 6.9" display size (iPhone 16 Pro Max class). Also valid: 1320×2868. Up to 10 accepted. |

Both sets share the same six shots, in upload order:

1. `tidefarer-1-world` — the isle, village and sea, HUD live
2. `tidefarer-2-village` — moving through Emberwick village, NPCs and quest markers
3. `tidefarer-3-map` — the Emberwick Isle world map
4. `tidefarer-4-quests` — the quest log
5. `tidefarer-5-skills` — melee / archery / fishing / farming skills and perks
6. `tidefarer-6-satchel` — the inventory / satchel

### Apple notes
- The 6.9" set (1290×2796) is the only iPhone size Apple currently *requires*; App
  Store Connect will reuse it for smaller iPhones. Add a 13" iPad set (2064×2752)
  only if you ship an iPad build.

### Microsoft notes
- 1920×1080 covers desktop and Xbox listings. PNG or JPEG, at least one required.

## App Store / listing description

> Tidefarer is an isometric sandbox adventure about a masked castaway washed ashore
> on Emberwick, an island sealed off from the world by a cursed strait and a spirit
> rising in its northern graveyard. Explore hand-drawn shores, farm and fish, forge
> blades and brew tonics, take up quests from the island's folk, and learn to parry,
> dodge, and fell the Hollow Spirit before you set sail for the wilder mainland of
> Greyharbor. Every sprite is drawn procedurally and every sound is synthesized as
> you play, so the whole game is tiny, loads instantly, and runs fully offline with
> no downloads and no ads. Play with touch, keyboard and mouse, or a gamepad, and
> pick up right where you left off thanks to automatic saves. Set foot ashore, earn
> a new name, and find out what the tide gave back.

## Regenerating

Screenshots are captured headlessly from the live game (Playwright + Chromium),
driving past the opening cut-scene into free-roam before shooting. Re-run the
capture against a local `python3 -m http.server` serving the repo root, pointed at
`/tidefarer/`.

The Steam capsule / library / logo / icon art is pure vector, rendered from
`_source/scene.js` (the brand scene + `TIDEFARER` wordmark) by
`_source/build-steam.js`:

```sh
cd _source
NODE_PATH=$(npm root -g) node build-steam.js      # writes into ../steam
```
