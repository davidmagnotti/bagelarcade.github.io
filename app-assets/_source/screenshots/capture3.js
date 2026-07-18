const { chromium } = require('playwright');
const path = require('path');
const dir = '/tmp/claude-0/-home-user-bagelarcade-github-io/fcf3e5a8-e09f-5361-b8b4-5a4b9ae1ca4a/scratchpad/shots';
require('fs').mkdirSync(dir, { recursive: true });

async function loadState(page, mode, level, gold) {
  await page.evaluate(({ mode, level, gold }) => {
    window.EWFDEV.open();
    document.getElementById('devMode').value = mode;
    document.getElementById('devLevel').value = String(level);
    document.getElementById('devGold').value = String(gold);
    document.getElementById('devShopAll').classList.add('on');
    document.getElementById('devShopNone').classList.remove('on');
    document.getElementById('devUpAll').classList.add('on');
    document.getElementById('devUpNone').classList.remove('on');
    document.getElementById('devGo').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  }, { mode, level, gold });
}
const hideChrome = (page) => page.evaluate(() => {
  for (const id of ['lore-intro', 'guide-tip']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
});

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto('file:///tmp/claude-0/-home-user-bagelarcade-github-io/fcf3e5a8-e09f-5361-b8b4-5a4b9ae1ca4a/scratchpad/walls_dbg.html');
  await page.waitForTimeout(1000);

  // ---------- FARM ----------
  await loadState(page, 'conquest-farm', 5, 500);
  await page.waitForTimeout(900);
  await hideChrome(page);
  await page.evaluate(() => {
    const D = window.__DBG; const { cols, rows } = D.dims();
    // weight toward harvest camps (they colour the board green/tan), sprinkle military
    const TYPES = ['lumber', 'quarrycamp', 'farmhouse', 'barracks', 'lumber', 'farmhouse', 'range', 'quarrycamp', 'forge', 'lumber', 'siegeworks', 'farmhouse'];
    D.topup();
    // sweep in a scattered order so multi-cell footprints interlock
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (D.occupied(c, r)) continue;
        const t = TYPES[(c * 5 + r * 3 + ((r % 2) ? 2 : 0)) % TYPES.length];
        D.topup();
        D.place(t, c, r);
      }
    }
    D.clearFx();                 // remove the "can't place" floaters
    D.setRes(360, 220, 280);     // realistic-looking resource bar
    D.redraw();
  });
  await page.waitForTimeout(250);
  await page.evaluate(() => { window.__DBG.clearFx(); window.__DBG.redraw(); });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(dir, 'farm-raw.png') });
  console.log('farm built');

  // ---------- SIEGE ----------
  await loadState(page, 'conquest-siege', 5, 500);
  await page.waitForTimeout(900);
  await hideChrome(page);
  // deploy waves across all lanes; dismiss coach popups each wave (they pause the game)
  for (let wave = 0; wave < 12; wave++) {
    await page.evaluate(() => {
      const D = window.__DBG;
      D.dismiss();
      const units = ['grunt', 'runner', 'brute', 'flyer'];
      for (let lane = 0; lane < 4; lane++) { D.lane(lane); for (const u of units) D.spawn(u); }
    });
    await page.waitForTimeout(420);
  }
  await page.evaluate(() => window.__DBG.dismiss());
  await page.waitForTimeout(1400);
  await page.evaluate(() => window.__DBG.dismiss());
  await hideChrome(page);
  await page.screenshot({ path: path.join(dir, 'siege-raw.png') });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const D = window.__DBG; D.dismiss(); for (let lane = 0; lane < 4; lane++) { D.lane(lane); for (const u of ['grunt','runner','brute','flyer']) D.spawn(u); } });
  await page.waitForTimeout(1300);
  await page.evaluate(() => window.__DBG.dismiss());
  await page.screenshot({ path: path.join(dir, 'siege-raw2.png') });
  console.log('siege captured');

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
