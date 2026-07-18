const { chromium } = require('playwright');
const dir = '/tmp/claude-0/-home-user-bagelarcade-github-io/fcf3e5a8-e09f-5361-b8b4-5a4b9ae1ca4a/scratchpad/shots';
async function loadState(page, mode, level, gold){
  await page.evaluate(({mode,level,gold})=>{ window.EWFDEV.open();
    document.getElementById('devMode').value=mode; document.getElementById('devLevel').value=String(level);
    document.getElementById('devGold').value=String(gold);
    document.getElementById('devShopAll').classList.add('on'); document.getElementById('devShopNone').classList.remove('on');
    document.getElementById('devUpAll').classList.add('on'); document.getElementById('devUpNone').classList.remove('on');
    document.getElementById('devGo').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
  },{mode,level,gold});
}
(async()=>{
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport:{width:430,height:932}, deviceScaleFactor:3 });
  const page = await ctx.newPage();
  await page.goto('file:///tmp/claude-0/-home-user-bagelarcade-github-io/fcf3e5a8-e09f-5361-b8b4-5a4b9ae1ca4a/scratchpad/walls_dbg.html');
  await page.waitForTimeout(1000);
  for(const lvl of [13, 20]){
    await loadState(page,'conquest-siege',lvl,600);
    await page.waitForTimeout(900);
    for(let w=0; w<12; w++){
      await page.evaluate(()=>{ const D=window.__DBG; D.dismiss(); for(let l=0;l<4;l++){ D.lane(l); for(const u of ['grunt','runner','brute','flyer']) D.spawn(u); } });
      await page.waitForTimeout(400);
    }
    await page.evaluate(()=>window.__DBG.dismiss());
    await page.waitForTimeout(1400);
    await page.evaluate(()=>window.__DBG.dismiss());
    await page.evaluate(()=>{ ['lore-intro','guide-tip'].forEach(id=>{const e=document.getElementById(id); if(e)e.style.display='none';}); });
    await page.screenshot({ path: dir + '/siege-l'+lvl+'.png' });
    console.log('captured level', lvl);
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
