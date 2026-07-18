const { chromium } = require('playwright');
const { emblem } = require('./emblem.js');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || '/home/user/bagelarcade.github.io/tidefarer/../app-assets';
fs.mkdirSync(OUT, { recursive: true });

// --- Background pieces --------------------------------------------------
function scanlines(op) {
  return `<pattern id="scan" width="1" height="4" patternUnits="userSpaceOnUse">
    <rect width="1" height="2" fill="#000" opacity="${op}"/>
  </pattern>`;
}

// Dark stone background block (matches title screen)
function darkBg(w, h) {
  return `
    <defs>
      <radialGradient id="bg" cx="0.5" cy="0.42" r="0.75">
        <stop offset="0" stop-color="#26262a"/>
        <stop offset="0.6" stop-color="#191919"/>
        <stop offset="1" stop-color="#0c0c0d"/>
      </radialGradient>
      ${scanlines(0.16)}
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect width="${w}" height="${h}" fill="url(#scan)"/>`;
}

// Light "aged parchment / limestone" background
function lightBg(w, h) {
  return `
    <defs>
      <radialGradient id="bg" cx="0.5" cy="0.4" r="0.8">
        <stop offset="0" stop-color="#efe7d4"/>
        <stop offset="0.65" stop-color="#e2d7bf"/>
        <stop offset="1" stop-color="#cdbf9f"/>
      </radialGradient>
      ${scanlines(0.05)}
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect width="${w}" height="${h}" fill="url(#scan)"/>`;
}

// Engraved wordmark, Trajan-style caps. mode dark/light.
function wordmark(cx, y, scale, mode) {
  const light = mode === 'light';
  const fill = light ? '#5a5044' : '#c8c3b6';
  // engraved shadow stack
  const shadow = light
    ? 'text-shadow:none;'
    : '';
  const over = '#c9a860';
  const dim = light ? '#7c7057' : '#9a9384';
  return `
  <g transform="translate(${cx} ${y}) scale(${scale})" text-anchor="middle"
     font-family="'Trajan Pro','Optima','Palatino Linotype','Palatino',Georgia,serif">
    <text y="0" font-size="30" letter-spacing="7" fill="${over}" font-weight="700">FROM TROY TO YORKTOWN</text>
    <g font-weight="700" letter-spacing="4">
      <text y="78" font-size="98" fill="${light ? '#3a332a' : '#0a0a0b'}" opacity="0.9" transform="translate(3 4)">EVERY WALL</text>
      <text y="78" font-size="98" fill="${light ? '#8c8271' : '#6a6a6e'}" transform="translate(-1.5 -1.5)">EVERY WALL</text>
      <text y="78" font-size="98" fill="${fill}">EVERY WALL</text>
      <text y="182" font-size="98" fill="${light ? '#3a332a' : '#0a0a0b'}" opacity="0.9" transform="translate(3 4)">FALLS</text>
      <text y="182" font-size="98" fill="${light ? '#8c8271' : '#6a6a6e'}" transform="translate(-1.5 -1.5)">FALLS</text>
      <text y="182" font-size="98" fill="${fill}">FALLS</text>
    </g>
    <rect x="-150" y="212" width="300" height="3" fill="#9c7b3f"/>
    <text y="256" font-size="26" letter-spacing="1" font-style="italic" fill="${dim}"
      font-family="'Palatino Linotype','Palatino',Georgia,serif">Five wars. Three thousand years. One army at the gates.</text>
  </g>`;
}

function page(w, h, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;}svg{display:block;}</style></head>
    <body><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg></body></html>`;
}

// Place the 200x200 emblem centered at (cx,cy) with given target size.
function placeEmblem(cx, cy, size, idp, mode, opts) {
  const s = size / 200;
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${s})">
    <svg width="200" height="200" viewBox="0 0 200 200">${emblem(idp, mode, opts)}</svg></g>`;
}

// ---- Deliverable definitions ------------------------------------------
const deliverables = [
  // App icon (iOS + Android store): full bleed, no transparency, 1024
  {
    file: 'icon-1024.png', w: 1024, h: 1024,
    svg: () => page(1024, 1024,
      darkBg(1024, 1024) +
      placeEmblem(512, 512, 760, 'i1', 'dark', { debrisBehind: false })
    )
  },
  // Android adaptive foreground: emblem within 66% safe zone, transparent bg
  {
    file: 'icon-android-foreground.png', w: 1024, h: 1024, transparent: true,
    svg: () => page(1024, 1024,
      placeEmblem(512, 512, 560, 'af', 'dark', { debrisBehind: false })
    )
  },
  // Splash — dark mode (full image)
  {
    file: 'splash-dark.png', w: 2048, h: 2048,
    svg: () => page(2048, 2048,
      darkBg(2048, 2048) +
      placeEmblem(1024, 760, 760, 'sd', 'dark', {}) +
      wordmark(1024, 1300, 1.75, 'dark')
    )
  },
  // Splash — light mode (full image)
  {
    file: 'splash-light.png', w: 2048, h: 2048,
    svg: () => page(2048, 2048,
      lightBg(2048, 2048) +
      placeEmblem(1024, 760, 760, 'sl', 'light', {}) +
      wordmark(1024, 1300, 1.75, 'light')
    )
  },
  // Transparent centered logo (emblem + wordmark) for Median "logo + bg color" splash mode
  {
    file: 'splash-logo-transparent.png', w: 2048, h: 2048, transparent: true,
    svg: () => page(2048, 2048,
      placeEmblem(1024, 720, 720, 'lt', 'dark', {}) +
      wordmark(1024, 1240, 1.75, 'dark')
    )
  },
];

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const d of deliverables) {
    const page2 = await browser.newPage({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: 1 });
    await page2.setContent(d.svg(), { waitUntil: 'networkidle' });
    await page2.waitForTimeout(200);
    await page2.screenshot({
      path: path.join(OUT, d.file),
      omitBackground: !!d.transparent,
      clip: { x: 0, y: 0, width: d.w, height: d.h }
    });
    await page2.close();
    console.log('wrote', d.file);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
