/* =====================================================================
   DEFINITIVE EDITION LAYER
   Additive patch: Radiance (bloom) post-process, gamepad rumble,
   title-screen embers. Wraps existing functions;
   touches nothing above this line.
   ===================================================================== */
(function(){
'use strict';

/* ---------- injected styles ---------- */
const st=document.createElement('style');
st.textContent=`
  .edBadge{margin:2px auto 10px;display:inline-block;font-family:Georgia,serif;
    font-size:11px;letter-spacing:6px;color:#e8c98f;padding:4px 14px 3px 20px;
    border-top:1px solid rgba(201,162,78,.55);border-bottom:1px solid rgba(201,162,78,.55);}
  .edEmbers{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
  .edEmber{position:absolute;bottom:-12px;width:5px;height:5px;border-radius:50%;
    background:radial-gradient(circle,#ffd9a0 0%,#ff9a3c 45%,rgba(255,120,30,0) 72%);
    opacity:0;animation:edRise linear infinite;}
  @keyframes edRise{
    0%{transform:translate(0,0) scale(1);opacity:0;}
    8%{opacity:.9;}
    60%{opacity:.7;}
    100%{transform:translate(var(--dx),-108vh) scale(.4);opacity:0;}
  }
`;
document.head.appendChild(st);

/* ---------- title-screen dressing ---------- */
document.title='Tidefarer';
const ovCard=document.querySelector('#titleOv .ovCard');
if(ovCard){
  const h1=ovCard.querySelector('h1');
  if(h1) h1.insertAdjacentHTML('afterend','<div class="edBadge">DEFINITIVE EDITION</div>');
}
const titleOv=document.getElementById('titleOv');
if(titleOv){
  const wrap=document.createElement('div'); wrap.className='edEmbers';
  for(let i=0;i<16;i++){
    const e=document.createElement('span'); e.className='edEmber';
    const dur=(7+Math.random()*8).toFixed(1);
    e.style.left=(3+Math.random()*94)+'%';
    e.style.setProperty('--dx',(Math.random()*120-60).toFixed(0)+'px');
    e.style.animationDuration=dur+'s';
    e.style.animationDelay=(-Math.random()*+dur).toFixed(1)+'s';
    const s=(3+Math.random()*4).toFixed(1); e.style.width=s+'px'; e.style.height=s+'px';
    wrap.appendChild(e);
  }
  titleOv.insertBefore(wrap, titleOv.firstChild);
}

/* ---------- Radiance (soft bloom) post-process ---------- */
if(CFG.bloom===undefined) CFG.bloom=1;
const flashRow=document.getElementById('cfgFlashOff');
if(flashRow && flashRow.closest('.pRow')){
  flashRow.closest('.pRow').insertAdjacentHTML('afterend',
    '<div class="pRow"><span>Radiance glow (bloom)</span>'+
    '<div class="pSeg"><button class="btn" id="cfgBloomOn">On</button>'+
    '<button class="btn" id="cfgBloomOff">Off</button></div></div>');
  document.getElementById('cfgBloomOn').onclick=()=>{ CFG.bloom=1; saveCfg(); syncCfgUI(); };
  document.getElementById('cfgBloomOff').onclick=()=>{ CFG.bloom=0; saveCfg(); syncCfgUI(); };
}
const _syncCfgUI=syncCfgUI;
syncCfgUI=function(){
  _syncCfgUI();
  const on=document.getElementById('cfgBloomOn'), off=document.getElementById('cfgBloomOff');
  if(on){ on.classList.toggle('on',!!CFG.bloom); off.classList.toggle('on',!CFG.bloom); }
};

const bloomCv=document.createElement('canvas');
const bloomCx=bloomCv.getContext('2d');
function drawRadiance(){
  if(!CFG.bloom || !fxOn('bloom') || G.state!=='play' || !cv.width) return;
  /* Bloom reads the whole main canvas back (drawImage(cv,...)) then re-composites
     it with a 'lighter' blend. On a software-raster canvas that per-frame readback
     is brutal, so the boot probe (js/01b-gpu-probe.js) switches it off outright. */
  if(typeof SOFTCANVAS!=='undefined' && SOFTCANVAS) return;
  const bw=Math.max(1,(cv.width/6)|0), bh=Math.max(1,(cv.height/6)|0);
  if(bloomCv.width!==bw || bloomCv.height!==bh){ bloomCv.width=bw; bloomCv.height=bh; }
  bloomCx.clearRect(0,0,bw,bh);
  /* Extract the highlights while downscaling to the tiny bloom buffer. Running
     the tone-curve filter here (on a ~1/6-size canvas) instead of on the full
     screen keeps it cheap - a per-frame full-screen canvas blur/filter is fast
     on iOS but murders desktop Chrome/Edge (Skia). */
  bloomCx.save();
  try{ if(typeof bloomCx.filter==='string') bloomCx.filter='brightness(0.72) contrast(1.75) saturate(1.5)'; }catch(e){}
  bloomCx.imageSmoothingEnabled=true;
  bloomCx.drawImage(cv,0,0,bw,bh);
  bloomCx.restore();
  const night=(typeof nightAmount==='function')? nightAmount() : 0;
  cx.save();
  cx.setTransform(1,0,0,1,0,0);
  cx.globalCompositeOperation='lighter';
  cx.globalAlpha=0.15+night*0.14;
  /* Upscaling the small buffer with smoothing IS the blur - no costly filter. */
  cx.imageSmoothingEnabled=true;
  cx.drawImage(bloomCv,0,0,cv.width,cv.height);
  cx.restore();
}
const _render=render;
render=function(){ _render(); drawRadiance(); };

/* ---------- gamepad rumble (mirrors haptics setting) ---------- */
const _buzz=buzz;
buzz=function(ms){
  _buzz(ms);
  if(!CFG.shake) return;
  try{
    const gps=navigator.getGamepads? navigator.getGamepads():[];
    for(const gp of gps){
      if(gp && gp.vibrationActuator && gp.vibrationActuator.playEffect)
        gp.vibrationActuator.playEffect('dual-rumble',
          {duration:Math.min(400,ms||60), strongMagnitude:0.6, weakMagnitude:0.3});
    }
  }catch(e){}
};

})();


