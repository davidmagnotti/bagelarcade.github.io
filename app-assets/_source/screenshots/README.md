# Screenshot generation

These scripts render the App Store screenshots from live gameplay with Playwright
(Chromium). Run against a local checkout with `walls.html`.

Pipeline:
1. A tiny debug hook is injected into a throwaway copy `walls_dbg.html` (the real
   `walls.html` is never modified). The hook exposes `window.__DBG` with helpers to
   place farm buildings on exact cells, deploy siege troops, dismiss coach modals,
   and set resources. The injection anchor is the line `window.EWFDEV={ open:openDev };`.
2. `capture3.js`  → builds a full farm board + a live land siege (farm-raw, siege-raw)
   `siegevar.js`  → captures varied-era sieges (naval L13, boss L20)
   `title.js`     → captures the clean hero title screen
   `cropfarm.js`  → stitches the empty band out of the farm capture (farm-crop)
3. `compose.js`   → frames each capture as a device card with a bronze-on-stone
   headline on the branded background, at 1290×2796. Edit its `screens` array to
   change captions or swap images.

All captures use a 430×932 viewport at deviceScaleFactor 3 (= 1290×2796,
Apple's iPhone 6.9" class).
