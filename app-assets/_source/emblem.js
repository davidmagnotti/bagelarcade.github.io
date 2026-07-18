// Shared emblem builder for "Every Wall Falls" app assets.
// Emblem is authored in a 200x200 coordinate space, centered.
// A breached fortress battlement — the wall, falling. Bronze ember in the breach.

function stoneDefs(idp, mode) {
  // mode: 'dark' or 'light'
  const light = mode === 'light';
  return `
  <linearGradient id="${idp}-wall" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"   stop-color="${light ? '#c7bfa9' : '#63636a'}"/>
    <stop offset="0.5" stop-color="${light ? '#a9a08a' : '#42424a'}"/>
    <stop offset="1"   stop-color="${light ? '#8c8371' : '#26262c'}"/>
  </linearGradient>
  <linearGradient id="${idp}-merlon" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"   stop-color="${light ? '#ded6c0' : '#74747c'}"/>
    <stop offset="1"   stop-color="${light ? '#a49a83' : '#3c3c44'}"/>
  </linearGradient>
  <linearGradient id="${idp}-bronze" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e4c887"/>
    <stop offset="0.5" stop-color="#c9a860"/>
    <stop offset="1" stop-color="#8a6a34"/>
  </linearGradient>
  <radialGradient id="${idp}-ember" cx="0.5" cy="0.35" r="0.9">
    <stop offset="0"    stop-color="#ffd89a"/>
    <stop offset="0.35" stop-color="#f0a24a"/>
    <stop offset="0.7"  stop-color="#c15a23"/>
    <stop offset="1"    stop-color="#5a1f10"/>
  </radialGradient>
  <radialGradient id="${idp}-glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0"   stop-color="#ffb45a" stop-opacity="0.55"/>
    <stop offset="0.5" stop-color="#c9822f" stop-opacity="0.18"/>
    <stop offset="1"   stop-color="#c9822f" stop-opacity="0"/>
  </radialGradient>`;
}

// Build one merlon (rectangular tooth) with bronze top light.
function merlon(x, w, topY, walkY, idp) {
  return `
    <rect x="${x}" y="${topY}" width="${w}" height="${walkY - topY}" fill="url(#${idp}-merlon)" stroke="#1a1a1c" stroke-width="1.2"/>
    <rect x="${x}" y="${topY}" width="${w}" height="3" fill="url(#${idp}-bronze)" opacity="0.9"/>`;
}

function emblem(idp, mode, opts = {}) {
  const walkY = 78;      // top of the curtain wall / walkway line
  const topY = 56;       // top of merlons
  const baseY = 168;     // bottom of wall
  const x0 = 30, x1 = 170;
  const wallW = x1 - x0; // 140

  // 5 merlons, 4 gaps. merlon=20, gap=15 -> 5*20+4*15 = 160? too wide. use merlon=18,gap=15.5 ->5*18+4*15.5=90+62=152.
  // target 140: merlon=17, gap=13.75 -> 85+55=140. center merlon spans 71.5..88.5 -> center 80? we want center 100.
  // Recompute centered on x=100. 5 merlons m=17 g=13.75, total 140, start x=30 end 170, center=100. m3 = 30+2*(17+13.75)=30+61.5=91.5..108.5 center100. good.
  const m = 17, g = 13.75;
  const mx = [];
  let cx = x0;
  for (let i = 0; i < 5; i++) { mx.push(cx); cx += m + g; }

  // Breach: central merlon (mx[2]) cloven. Jagged vertical gap.
  // Breach polygon (dark void with ember). Zigzag both edges from top gap widening to base.
  const bc = 100; // breach center x
  // Asymmetric jagged breach — shattered masonry, widening toward the base.
  const breach = `
    M ${bc-4} ${topY}
    L ${bc-11} ${walkY}
    L ${bc-4}  ${walkY+22}
    L ${bc-16} ${walkY+44}
    L ${bc-7}  ${walkY+64}
    L ${bc-20} ${baseY}
    L ${bc+19} ${baseY}
    L ${bc+9}  ${walkY+66}
    L ${bc+18} ${walkY+46}
    L ${bc+7}  ${walkY+24}
    L ${bc+13} ${walkY}
    L ${bc+5}  ${topY}
    Z`;
  // Brighter inner ember core: same jagged silhouette, inset — fire glowing deeper in the gap.
  const emberCore = `
    M ${bc-1} ${walkY-6}
    L ${bc-7}  ${walkY}
    L ${bc-1}  ${walkY+22}
    L ${bc-11} ${walkY+44}
    L ${bc-3}  ${walkY+64}
    L ${bc-13} ${baseY-4}
    L ${bc+13} ${baseY-4}
    L ${bc+5}  ${walkY+66}
    L ${bc+12} ${walkY+46}
    L ${bc+3}  ${walkY+24}
    L ${bc+9}  ${walkY}
    L ${bc+2}  ${walkY-6}
    Z`;

  // Falling / dislodged blocks tumbling out of the breach to the right.
  const debris = `
    <g stroke="#1a1a1c" stroke-width="1.1">
      <rect x="128" y="30" width="16" height="11" rx="1" fill="url(#${idp}-merlon)" transform="rotate(24 136 35)"/>
      <rect x="150" y="60" width="12" height="9" rx="1" fill="url(#${idp}-wall)" transform="rotate(-18 156 64)"/>
      <rect x="140" y="92" width="10" height="8" rx="1" fill="url(#${idp}-wall)" transform="rotate(33 145 96)"/>
    </g>`;

  // Curtain wall block courses (mortar joints), drawn as strokes, clipped to wall (minus breach).
  const jointColor = mode === 'light' ? 'rgba(60,50,36,0.55)' : 'rgba(12,12,14,0.7)';
  const hiColor = mode === 'light' ? 'rgba(255,250,235,0.35)' : 'rgba(150,150,158,0.28)';
  let joints = '';
  const courseYs = [walkY, walkY + 18, walkY + 36, walkY + 54, walkY + 72];
  courseYs.forEach((cy, r) => {
    joints += `<line x1="${x0}" y1="${cy}" x2="${x1}" y2="${cy}" stroke="${jointColor}" stroke-width="1.4"/>`;
    joints += `<line x1="${x0}" y1="${cy + 1}" x2="${x1}" y2="${cy + 1}" stroke="${hiColor}" stroke-width="0.8"/>`;
    // vertical joints, offset per row
    const off = (r % 2) * 17.5;
    for (let vx = x0 + off + 17.5; vx < x1; vx += 35) {
      joints += `<line x1="${vx}" y1="${cy}" x2="${vx}" y2="${Math.min(baseY, cy + 18)}" stroke="${jointColor}" stroke-width="1.2"/>`;
    }
  });

  const bronzeBand = `<rect x="${x0}" y="${walkY - 3}" width="${wallW}" height="3.2" fill="url(#${idp}-bronze)" opacity="0.85"/>`;

  return `
  <defs>
    ${stoneDefs(idp, mode)}
    <clipPath id="${idp}-wallclip">
      <path d="M ${x0} ${walkY} L ${x1} ${walkY} L ${x1} ${baseY} L ${x0} ${baseY} Z
               ${breach}" clip-rule="evenodd"/>
    </clipPath>
  </defs>
  <g>
    <!-- ember glow behind breach -->
    <ellipse cx="${bc}" cy="${baseY - 30}" rx="60" ry="70" fill="url(#${idp}-glow)"/>
    ${opts.debrisBehind ? debris : ''}
    <!-- merlons -->
    ${mx.map((x, i) => i === 2 ? '' : merlon(x, m, topY, walkY, idp)).join('')}
    <!-- central merlon split halves -->
    ${merlon(mx[2], m / 2 - 1, topY, walkY, idp)}
    ${merlon(mx[2] + m / 2 + 1, m / 2 - 1, topY - 1, walkY, idp)}
    <!-- curtain wall -->
    <rect x="${x0}" y="${walkY}" width="${wallW}" height="${baseY - walkY}" fill="url(#${idp}-wall)" stroke="#1a1a1c" stroke-width="1.4"/>
    ${bronzeBand}
    <g clip-path="url(#${idp}-wallclip)">${joints}</g>
    <!-- outer wall outline over joints -->
    <rect x="${x0}" y="${walkY}" width="${wallW}" height="${baseY - walkY}" fill="none" stroke="#1a1a1c" stroke-width="1.4"/>
    <!-- breach void + ember -->
    <path d="${breach}" fill="url(#${idp}-ember)"/>
    <path d="${breach}" fill="none" stroke="${mode === 'light' ? '#4a3a22' : '#0c0c0e'}" stroke-width="1.6"/>
    <!-- bright ember core -->
    <path d="${emberCore}" fill="url(#${idp}-ember)" opacity="0.9"/>
    ${opts.debrisBehind ? '' : debris}
  </g>`;
}

module.exports = { emblem };
