// Tidefarer — Steam (and general storefront) graphical assets.
// Renders every Steam capsule / library / hero / logo size from the shared
// vector brand scene, plus a square community icon. Run with global playwright:
//   NODE_PATH=$(npm root -g) node build-steam.js [outDir]
const { chromium } = require('playwright');
const { scene, boat, wordmark, scrim } = require('./scene.js');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || path.resolve(__dirname, '..', 'steam');
fs.mkdirSync(OUT, { recursive: true });

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function page(w, h, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head>
    <body><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"
      viewBox="0 0 ${w} ${h}">${inner}</svg></body></html>`;
}

// Each deliverable returns the inner SVG for its exact pixel size.
const deliverables = [

  // ---- Store capsules ----------------------------------------------------
  // Small capsule — search results / lists. Tiny; keep the wordmark dominant.
  { file: 'small_capsule_462x174.png', w: 462, h: 174, svg: (w, h) =>
      scene(w, h, { horizon: 0.6, boatCx: 0.82, boatScale: 0.78, sunR: 0.28, vignette: 0.34 }) +
      scrim(w * 0.34, h * 0.5, w * 0.5, h * 0.7, 0.6) +
      wordmark(w * 0.38, h * 0.6, w * 0.62, { tag: false })
  },

  // Header capsule — the main capsule at the top of the store page & wishlist.
  { file: 'header_capsule_920x430.png', w: 920, h: 430, svg: (w, h) =>
      scene(w, h, { horizon: 0.58, boatCx: 0.74, boatScale: 0.82, vignette: 0.3 }) +
      scrim(w * 0.35, h * 0.5, w * 0.5, h * 0.85, 0.55) +
      wordmark(w * 0.37, h * 0.5, w * 0.58)
  },

  // Main capsule — front-page / featured carousel.
  { file: 'main_capsule_1232x706.png', w: 1232, h: 706, svg: (w, h) =>
      scene(w, h, { horizon: 0.54, boatCx: 0.5, boatScale: 0.66, vignette: 0.34 }) +
      scrim(w * 0.5, h * 0.84, w * 0.7, h * 0.42, 0.62) +
      wordmark(w * 0.5, h * 0.83, w * 0.62)
  },

  // Vertical capsule — seasonal sales / category pages (portrait).
  { file: 'vertical_capsule_748x896.png', w: 748, h: 896, svg: (w, h) =>
      scene(w, h, { horizon: 0.64, boatCx: 0.5, boatScale: 0.6, vignette: 0.34 }) +
      scrim(w * 0.5, h * 0.19, w * 0.7, h * 0.24, 0.6) +
      wordmark(w * 0.5, h * 0.18, w * 0.8)
  },

  // Page background — behind the store page content (kept atmospheric).
  { file: 'page_background_1438x810.png', w: 1438, h: 810, svg: (w, h) =>
      scene(w, h, { horizon: 0.5, boatCx: 0.62, boatScale: 0.72, vignette: 0.5 })
  },

  // ---- Steam library -----------------------------------------------------
  // Library capsule (grid "box art") — portrait, wordmark prominent.
  { file: 'library_capsule_600x900.png', w: 600, h: 900, svg: (w, h) =>
      scene(w, h, { horizon: 0.56, boatCx: 0.5, boatScale: 0.58, vignette: 0.38 }) +
      scrim(w * 0.5, h * 0.82, w * 0.85, h * 0.34, 0.66) +
      wordmark(w * 0.5, h * 0.8, w * 0.82)
  },

  // Library hero — wide banner behind the library detail page. No wordmark
  // (Steam overlays the transparent library logo on top of this).
  { file: 'library_hero_3840x1240.png', w: 3840, h: 1240, svg: (w, h) =>
      scene(w, h, { horizon: 0.55, boatCx: 0.62, boatScale: 0.78, vignette: 0.42 })
  },

  // Library logo — transparent wordmark + emblem, placed over the hero.
  { file: 'library_logo_1280x720.png', w: 1280, h: 720, transparent: true, svg: (w, h) =>
      `<g transform="translate(${w * 0.5} ${h * 0.44})">${boat((h * 0.44) / 704)}</g>` +
      wordmark(w * 0.5, h * 0.78, w * 0.66)
  },

  // ---- Community ---------------------------------------------------------
  // Community / capsule icon — square, tight on the boat like the app icon.
  { file: 'community_icon_184x184.png', w: 184, h: 184, svg: (w, h) =>
      scene(w, h, { horizon: 0.6, boatCx: 0.5, boatScale: 0.78, sunR: 0.3, vignette: 0.3 })
  },
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  for (const d of deliverables) {
    const p = await browser.newPage({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: 1 });
    await p.setContent(page(d.w, d.h, d.svg(d.w, d.h)), { waitUntil: 'networkidle' });
    await p.waitForTimeout(150);
    await p.screenshot({
      path: path.join(OUT, d.file),
      omitBackground: !!d.transparent,
      clip: { x: 0, y: 0, width: d.w, height: d.h },
    });
    await p.close();
    console.log('wrote', d.file);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
