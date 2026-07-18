const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');
const shots = '/tmp/claude-0/-home-user-bagelarcade-github-io/fcf3e5a8-e09f-5361-b8b4-5a4b9ae1ca4a/scratchpad/shots';
const OUT = process.argv[2] || '/home/user/bagelarcade.github.io/app-assets/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const W = 1290, H = 2796;
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(shots, f)).toString('base64');
const dims = (f) => { const p = PNG.sync.read(fs.readFileSync(path.join(shots, f))); return { w: p.width, h: p.height }; };

const bg = `
  <div style="position:absolute;inset:0;background:
     radial-gradient(120% 90% at 50% 34%, #2a2a2e 0%, #191919 55%, #0c0c0d 100%);"></div>
  <div style="position:absolute;inset:0;opacity:.5;
     background:radial-gradient(70% 40% at 50% 108%, rgba(201,130,47,.5), rgba(201,130,47,0) 70%);"></div>
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 2px,transparent 2px 4px);"></div>`;

// device-card marketing screenshot
function card(file, eyebrow, title) {
  const img = b64(file), d = dims(file);
  const Wc = 1030, marginX = (W - Wc) / 2;
  const Hc = Math.round(Wc * d.h / d.w);
  const cy = 1590;                       // vertical centre of the card region
  const cardTop = Math.round(cy - Hc / 2);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:${W}px;height:${H}px;overflow:hidden;}
    .stage{position:relative;width:${W}px;height:${H}px;
      font-family:'Optima','Palatino Linotype','Palatino',Georgia,serif;}
    .eyebrow{position:absolute;top:150px;left:0;right:0;text-align:center;
      color:#c9a860;font-size:31px;letter-spacing:9px;text-transform:uppercase;font-weight:700;}
    .title{position:absolute;top:212px;left:70px;right:70px;text-align:center;
      color:#d9d4c7;font-size:76px;line-height:1.06;font-weight:700;letter-spacing:1px;
      text-shadow:-1px -1px 0 #6a6a6e, 2px 3px 0 #0a0a0b, 4px 6px 8px rgba(0,0,0,.6);}
    .card{position:absolute;top:${cardTop}px;left:${marginX}px;width:${Wc}px;height:${Hc}px;
      border-radius:46px;overflow:hidden;border:3px solid rgba(201,168,96,.55);
      box-shadow:0 30px 70px rgba(0,0,0,.6), 0 0 0 1px rgba(0,0,0,.6),
        inset 0 2px 0 rgba(255,255,255,.08);}
    .card img{width:100%;height:100%;object-fit:cover;display:block;}
  </style></head><body><div class="stage">
    ${bg}
    <div class="eyebrow">${eyebrow}</div>
    <div class="title">${title}</div>
    <div class="card"><img src="${img}"></div>
  </div></body></html>`;
}

// full-bleed hero (screenshot already carries its own branding)
function full(img) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;} html,body{width:${W}px;height:${H}px;overflow:hidden;}
    img{width:${W}px;height:${H}px;object-fit:cover;display:block;}
  </style></head><body><img src="${img}"></body></html>`;
}

const screens = [
  { file: 'screenshot-1-title.png', html: () => full(b64('title-raw.png')) },
  { file: 'screenshot-2-build.png', html: () => card('farm-crop.png', 'Build your war-camp', 'Every building is a<br>puzzle piece') },
  { file: 'screenshot-3-siege.png', html: () => card('siege-raw.png', 'Then storm the walls', 'Command the army<br>at the gates') },
  { file: 'screenshot-4-naval.png', html: () => card('siege-l13.png', 'Five ages of siegecraft', 'Ram and tunnel,<br>tower and warship') },
  { file: 'screenshot-5-boss.png', html: () => card('siege-l20.png', 'From Troy to Yorktown', 'Face history’s<br>great commanders') },
];

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const s of screens) {
    const page = await ctx.newPage();
    await page.setContent(s.html(), { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, s.file), clip: { x: 0, y: 0, width: W, height: H } });
    await page.close();
    console.log('wrote', s.file);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
