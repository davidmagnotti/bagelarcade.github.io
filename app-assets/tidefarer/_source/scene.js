// Tidefarer — reusable brand scene + wordmark, rendered as SVG.
// The look mirrors the app icon: a lone sailboat on a calm sea at sunset —
// navy dusk sky, a warm sun sinking to the horizon, cream sails, teal water.
// Everything here is pure vector so it re-exports crisply at any capsule size.

let _uid = 0;
const uid = (p) => `${p}${(_uid++).toString(36)}`;

// ---------------------------------------------------------------------------
// The sailboat, drawn in a local space where (0,0) is the waterline at the
// centre of the hull. Sails rise into negative Y. Scale/position by the caller.
// ---------------------------------------------------------------------------
function boat(scale) {
  const sailR = uid('sr'), sailL = uid('sl'), hull = uid('hl');
  return `
  <defs>
    <linearGradient id="${sailR}" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0" stop-color="#fbf3dd"/>
      <stop offset="0.55" stop-color="#efe1c1"/>
      <stop offset="1" stop-color="#d9c49a"/>
    </linearGradient>
    <linearGradient id="${sailL}" x1="1" y1="0" x2="0" y2="0.4">
      <stop offset="0" stop-color="#fdf7e6"/>
      <stop offset="0.6" stop-color="#f1e6c9"/>
      <stop offset="1" stop-color="#e0cda4"/>
    </linearGradient>
    <linearGradient id="${hull}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a301c"/>
      <stop offset="1" stop-color="#2b1a0f"/>
    </linearGradient>
  </defs>
  <g transform="scale(${scale})">
    <!-- foam at the hull's shoulders -->
    <ellipse cx="-92" cy="6" rx="52" ry="11" fill="#cfe0dc" opacity="0.75"/>
    <ellipse cx="92" cy="6" rx="52" ry="11" fill="#cfe0dc" opacity="0.75"/>
    <!-- hull: dark half-ellipse below the waterline -->
    <path d="M -122 0 A 122 78 0 0 0 122 0 Z" fill="url(#${hull})"/>
    <!-- deck rail -->
    <path d="M -132 0 L 132 0 L 96 -26 L -96 -26 Z" fill="#7a5636"/>
    <path d="M -96 -26 L 96 -26 L 90 -30 L -90 -30 Z" fill="#9c744a"/>
    <!-- mast -->
    <rect x="-3.5" y="-352" width="7" height="332" fill="#161311"/>
    <!-- jib (left sail) -->
    <path d="M -8 -334 C -104 -244 -104 -78 -40 -34 L -8 -34 Z" fill="url(#${sailL})"/>
    <!-- main (right sail) -->
    <path d="M 8 -346 C 128 -252 132 -66 44 -30 L 8 -30 Z" fill="url(#${sailR})"/>
    <!-- soft seam shadow along the mast side of the main -->
    <path d="M 8 -346 C 40 -300 46 -150 30 -34 L 8 -34 Z" fill="#000" opacity="0.06"/>
    <!-- pennant -->
    <path d="M 8 -352 L 62 -340 L 8 -326 Z" fill="#df574d"/>
  </g>`;
}

// A pair of distant gulls, drawn as two soft strokes each.
function gull(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none"
     stroke="#2f4152" stroke-width="4" stroke-linecap="round" opacity="0.8">
    <path d="M -22 0 Q -11 -12 0 -2"/>
    <path d="M 0 -2 Q 11 -12 22 0"/>
  </g>`;
}

// ---------------------------------------------------------------------------
// Full brand scene sized exactly to w x h.
//   o.horizon   0..1  vertical position of the waterline (default 0.56)
//   o.boatCx    0..1  horizontal centre of the boat / sun (default 0.5)
//   o.boatScale 0..1  boat size as a fraction of height (default 0.62)
//   o.vignette  0..1  strength of the dark edge vignette (default 0.28)
//   o.sky            'dusk' (default) — reserved for future variants
// ---------------------------------------------------------------------------
function scene(w, h, o = {}) {
  const horizonY = h * (o.horizon ?? 0.56);
  const boatCx = w * (o.boatCx ?? 0.5);
  const sunR = Math.min(w, h) * (o.sunR ?? 0.24);
  const sunCy = horizonY - sunR * 0.28;
  const boatScale = (h * (o.boatScale ?? 0.62)) / 704; // 704 ≈ boat height in local units
  const boatBaseY = horizonY + h * 0.02;
  const vig = o.vignette ?? 0.28;

  const sky = uid('sky'), sea = uid('sea'), sun = uid('sun'),
        glow = uid('glow'), refl = uid('refl'), vgn = uid('vgn');

  return `
  <defs>
    <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#273750"/>
      <stop offset="0.42" stop-color="#3a3f51"/>
      <stop offset="0.74" stop-color="#8a6c4c"/>
      <stop offset="1" stop-color="#caa05c"/>
    </linearGradient>
    <linearGradient id="${sea}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#207d73"/>
      <stop offset="0.5" stop-color="#1a5f62"/>
      <stop offset="1" stop-color="#213a50"/>
    </linearGradient>
    <radialGradient id="${sun}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe9ae"/>
      <stop offset="0.4" stop-color="#ffc659"/>
      <stop offset="0.78" stop-color="#f5932f"/>
      <stop offset="1" stop-color="#e97b23"/>
    </radialGradient>
    <radialGradient id="${glow}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffcf86" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#e9a95f" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#e9a95f" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${refl}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffd98f" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ffd98f" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${vgn}" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="${vig}"/>
    </radialGradient>
  </defs>

  <!-- sky -->
  <rect width="${w}" height="${h}" fill="url(#${sky})"/>
  <!-- warm haze over the horizon behind the boat -->
  <rect x="${boatCx - w}" y="${horizonY - h}" width="${w * 2}" height="${h * 1.3}"
        fill="url(#${glow})" transform="translate(${w * 0 })"/>
  <ellipse cx="${boatCx}" cy="${horizonY}" rx="${Math.max(w, h) * 0.62}" ry="${h * 0.6}"
        fill="url(#${glow})"/>
  <!-- sun -->
  <circle cx="${boatCx}" cy="${sunCy}" r="${sunR}" fill="url(#${sun})"/>
  <!-- sea (drawn over the sun's lower limb) -->
  <rect x="0" y="${horizonY}" width="${w}" height="${h - horizonY}" fill="url(#${sea})"/>
  <!-- horizon line -->
  <rect x="0" y="${horizonY - h * 0.004}" width="${w}" height="${h * 0.008}" fill="#f2e6c4" opacity="0.9"/>
  <!-- sun reflection on the water -->
  <ellipse cx="${boatCx}" cy="${horizonY + h * 0.06}" rx="${sunR * 1.15}" ry="${h * 0.045}" fill="url(#${refl})"/>
  <ellipse cx="${boatCx}" cy="${horizonY + h * 0.14}" rx="${sunR * 0.8}"  ry="${h * 0.03}"  fill="url(#${refl})"/>
  <ellipse cx="${boatCx}" cy="${horizonY + h * 0.22}" rx="${sunR * 0.5}"  ry="${h * 0.02}"  fill="url(#${refl})"/>
  <!-- gulls -->
  ${gull(boatCx - Math.min(w, h) * 0.3, horizonY - h * 0.18, Math.min(w, h) / 900)}
  ${gull(boatCx + Math.min(w, h) * 0.34, horizonY - h * 0.24, Math.min(w, h) / 780)}
  <!-- foreground swell -->
  <g fill="none" stroke="#1c6f6c" stroke-width="${Math.max(2, h * 0.006)}" stroke-linecap="round" opacity="0.6">
    <path d="M ${w * 0.1} ${h * 0.9} q ${w * 0.09} ${-h * 0.02} ${w * 0.18} 0"/>
    <path d="M ${w * 0.62} ${h * 0.94} q ${w * 0.08} ${-h * 0.02} ${w * 0.16} 0"/>
    <path d="M ${w * 0.38} ${h * 0.83} q ${w * 0.07} ${-h * 0.018} ${w * 0.14} 0"/>
  </g>
  <!-- boat -->
  <g transform="translate(${boatCx} ${boatBaseY})">${boat(boatScale)}</g>
  <!-- vignette -->
  <rect width="${w}" height="${h}" fill="url(#${vgn})"/>`;
}

// ---------------------------------------------------------------------------
// TIDEFARER wordmark, engraved-serif with a gold rule and italic tagline.
// The word spans exactly `width` px, centred at (cx, y) on its baseline, so
// layout is deterministic in every frame. tag=false drops the tagline.
// ---------------------------------------------------------------------------
function wordmark(cx, y, width, { tag = true, tagline = 'Set foot ashore. Earn a new name.' } = {}) {
  const face = '#efe6d2', gold = '#d9b268', dim = '#c8bda4';
  const serif = "'Trajan Pro','Optima','Palatino Linotype','Palatino',Georgia,serif";
  const fs = width / 7.0;              // font-size that reads well for "TIDEFARER"
  const sh = Math.max(2, fs * 0.045);  // engraved shadow offset
  const x0 = cx - width / 2;
  const T = (dx, dy, fill, extra = '') =>
    `<text x="${x0 + dx}" y="${dy}" font-size="${fs}" textLength="${width}" lengthAdjust="spacingAndGlyphs" fill="${fill}" ${extra}>TIDEFARER</text>`;
  return `
  <g font-family="${serif}" font-weight="700" text-anchor="start">
    ${T(sh, y + sh, '#0b0b0c', 'opacity="0.85"')}
    ${T(-sh * 0.4, y - sh * 0.4, '#7d5f3a')}
    ${T(0, y, face)}
  </g>
  <rect x="${cx - width * 0.31}" y="${y + fs * 0.32}" width="${width * 0.62}" height="${Math.max(2, fs * 0.03)}" fill="${gold}"/>
  ${tag ? `<text x="${cx}" y="${y + fs * 0.62}" font-size="${fs * 0.3}" letter-spacing="${fs * 0.012}" font-style="italic" fill="${dim}" text-anchor="middle"
      font-family="'Palatino Linotype','Palatino',Georgia,serif">${tagline}</text>` : ''}`;
}

// A soft dark scrim so a wordmark stays legible over the bright scene.
function scrim(cx, cy, rx, ry, strength = 0.55) {
  const g = uid('scrim');
  return `<defs><radialGradient id="${g}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#0a0d12" stop-opacity="${strength}"/>
      <stop offset="1" stop-color="#0a0d12" stop-opacity="0"/>
    </radialGradient></defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${g})"/>`;
}

module.exports = { scene, boat, wordmark, scrim };
