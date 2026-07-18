const { PNG } = require('pngjs');
const fs = require('fs');
const dir = '/tmp/claude-0/-home-user-bagelarcade-github-io/fcf3e5a8-e09f-5361-b8b4-5a4b9ae1ca4a/scratchpad/shots';
const src = PNG.sync.read(fs.readFileSync(dir + '/farm-raw.png'));
const { width: w, height: h } = src;
const lum = new Array(h).fill(0);
for (let y = 0; y < h; y++) {
  let s = 0, n = 0;
  for (let x = 0; x < w; x += 5) { const i = (y * w + x) * 4; s += src.data[i] + src.data[i + 1] + src.data[i + 2]; n++; }
  lum[y] = s / (n * 3);
}
// board bottom: last bright row in the top half
let boardBottom = 0;
for (let y = 200; y < 1100; y++) if (lum[y] > 50) boardBottom = y;
// tray top: first row from boardBottom where the next 160 rows stay panel-bright (tray bg ~ lum 40+)
let trayTop = -1;
for (let y = boardBottom + 20; y < h - 300; y++) {
  let ok = true;
  for (let k = 0; k < 160; k += 8) if (lum[y + k] < 36) { ok = false; break; }
  if (ok) { trayTop = y; break; }
}
console.log('boardBottom', boardBottom, 'trayTop', trayTop);
const cutStart = boardBottom + 55;
const cutEnd = trayTop - 30;
const removed = Math.max(0, cutEnd - cutStart);
const outH = h - removed;
const out = new PNG({ width: w, height: outH });
for (let y = 0; y < cutStart; y++) src.data.copy(out.data, (y * w) * 4, (y * w) * 4, ((y + 1) * w) * 4);
for (let y = cutEnd; y < h; y++) { const dy = y - removed; src.data.copy(out.data, (dy * w) * 4, (y * w) * 4, ((y + 1) * w) * 4); }
fs.writeFileSync(dir + '/farm-crop.png', PNG.sync.write(out));
console.log('wrote farm-crop.png', w + 'x' + outH, 'removed', removed);
