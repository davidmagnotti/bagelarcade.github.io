const { chromium } = require('playwright');
const dir = '/tmp/claude-0/-home-user-bagelarcade-github-io/fcf3e5a8-e09f-5361-b8b4-5a4b9ae1ca4a/scratchpad/shots';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto('file:///home/user/bagelarcade.github.io/walls.html');
  await page.waitForTimeout(1600);
  await page.evaluate(() => {
    // dismiss the one-time intro lore modal to reveal the hero title screen
    for (const id of ['lore-intro']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
    document.querySelectorAll('.overlay.show').forEach(o => o.classList.remove('show'));
    const ts = document.getElementById('title-screen'); if (ts) ts.classList.remove('hidden');
    ['titleMute', 'titleDev'].forEach(id => { const e = document.getElementById(id); if (e) e.style.visibility = 'hidden'; });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: dir + '/title-raw.png' });
  console.log('title captured');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
