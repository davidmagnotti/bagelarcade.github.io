/* =====================================================================
   DEFINITIVE EDITION LAYER
   Additive patch: Photo Mode, Radiance (bloom) post-process,
   gamepad rumble, title-screen embers. Wraps existing functions;
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
    filter:drop-shadow(0 0 6px rgba(255,154,60,.8));opacity:0;
    animation:edRise linear infinite;}
  @keyframes edRise{
    0%{transform:translate(0,0) scale(1);opacity:0;}
    8%{opacity:.9;}
    60%{opacity:.7;}
    100%{transform:translate(var(--dx),-108vh) scale(.4);opacity:0;}
  }
  /* ---------- photo mode ---------- */
  #photoUI{position:fixed;inset:0;z-index:60;display:none;}
  #photoStage{position:absolute;inset:0;pointer-events:auto;cursor:grab;touch-action:none;}
  #photoStage.grabbing{cursor:grabbing;}
  .phBarT,.phBarB{position:fixed;left:0;right:0;height:0;background:#000;z-index:61;
    transition:height .35s ease;pointer-events:none;}
  .phBarT{top:0;} .phBarB{bottom:0;}
  #photoUI.boxed .phBarT,#photoUI.boxed .phBarB{height:11vh;}
  #phTop{position:absolute;top:14px;left:0;right:0;display:flex;justify-content:space-between;
    align-items:center;padding:0 16px;z-index:62;pointer-events:none;}
  #phTop .phTitle{font-family:Georgia,serif;font-size:12px;letter-spacing:5px;color:var(--parch);
    text-shadow:0 1px 4px #000;opacity:.85;}
  #phTop .btn{pointer-events:auto;}
  #phDock{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:62;
    display:flex;flex-direction:column;gap:8px;align-items:center;max-width:94vw;}
  #phChips{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;}
  .phChip{pointer-events:auto;cursor:pointer;font-size:11px;font-weight:bold;color:var(--parch);
    padding:6px 12px;border-radius:999px;border:1px solid #4a3826;background:rgba(20,14,8,.82);
    box-shadow:0 2px 6px rgba(0,0,0,.5);letter-spacing:.5px;}
  .phChip.sel{border-color:var(--ember);color:#ffd9a0;box-shadow:0 0 10px rgba(255,154,60,.45);}
  #phActs{display:flex;gap:10px;}
  #phHint{font-size:10px;letter-spacing:2px;color:var(--parch-dim);text-shadow:0 1px 3px #000;}
  body.photoing #hud,body.photoing #hotbar,body.photoing #menuBtns,
  body.photoing #touchUI,body.photoing #bossBar{display:none !important;}
  @media (max-width:700px){ #phHint{display:none;} #phTop{top:10px;} #phDock{bottom:10px;} }
`;
document.head.appendChild(st);

/* ---------- title-screen dressing ---------- */
document.title='Emberwick Isle - Definitive Edition';
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
  if(!CFG.bloom || !cv.width) return;
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

/* ---------- PHOTO MODE ---------- */
ACH.shutterbug={t:'Shutterbug',d:'Capture a shot in Photo Mode.'};

const PH={on:false, boxed:false, filter:0};
const FILTERS=[
  {n:'Natural',  f:''},
  {n:'Golden',   f:'sepia(0.25) saturate(1.35) contrast(1.06) brightness(1.06) hue-rotate(-8deg)'},
  {n:'Noir',     f:'grayscale(1) contrast(1.28) brightness(1.05)'},
  {n:'Dream',    f:'saturate(1.45) blur(0.6px) brightness(1.08) contrast(0.94)'},
  {n:'Frostbound',f:'saturate(0.78) hue-rotate(16deg) brightness(1.05) contrast(1.06)'},
  {n:'Old Ember',f:'sepia(0.55) saturate(1.1) contrast(1.12) brightness(0.98)'}
];

document.body.insertAdjacentHTML('beforeend',
  '<div id="photoUI">'+
    '<div id="photoStage"></div>'+
    '<div class="phBarT"></div><div class="phBarB"></div>'+
    '<div id="phTop"><div class="phTitle">\uD83D\uDCF7 PHOTO MODE</div>'+
      '<button class="btn ghostly" id="phExit">\u2715 Exit</button></div>'+
    '<div id="phDock">'+
      '<div id="phChips"></div>'+
      '<div id="phActs">'+
        '<button class="btn" id="phBox">\u25AD Letterbox</button>'+
        '<button class="btn gold" id="phSnap">\uD83D\uDCF8 Save Shot</button>'+
      '</div>'+
      '<div id="phHint">DRAG TO PAN \u00B7 P / ESC TO EXIT</div>'+
    '</div>'+
  '</div>');

const phUI=document.getElementById('photoUI');
const phChips=document.getElementById('phChips');
FILTERS.forEach((F,i)=>{
  const c=document.createElement('div');
  c.className='phChip'+(i===0?' sel':''); c.textContent=F.n;
  c.onclick=()=>{ PH.filter=i; cv.style.filter=F.f;
    phChips.querySelectorAll('.phChip').forEach((el,j)=> el.classList.toggle('sel',j===i));
    if(typeof Snd!=='undefined'&&Snd.tone) Snd.tone(720+i*40,0.05,'sine',0.04); };
  phChips.appendChild(c);
});

function enterPhoto(){
  if(PH.on) return;
  if(G.state!=='play' || G.interior || P.dead || CINE){ 
    if(G.interior) toast('Step outside first - the light in here is no good for portraits.');
    return;
  }
  if(G.paused) togglePause(false);
  closeAllPanels(); closeDialog();
  PH.on=true;
  document.body.classList.add('photoing');
  phUI.style.display='block';
  phUI.classList.toggle('boxed',PH.boxed);
  cv.style.filter=FILTERS[PH.filter].f;
}
function exitPhoto(){
  if(!PH.on) return;
  PH.on=false;
  document.body.classList.remove('photoing');
  phUI.style.display='none';
  cv.style.filter='';
}
document.getElementById('phExit').onclick=exitPhoto;
document.getElementById('phBox').onclick=function(){
  PH.boxed=!PH.boxed; phUI.classList.toggle('boxed',PH.boxed);
  this.classList.toggle('on',PH.boxed);
};

/* drag to pan */
const stage=document.getElementById('photoStage');
let dragId=null, dlx=0, dly=0;
stage.addEventListener('pointerdown',e=>{
  dragId=e.pointerId; dlx=e.clientX; dly=e.clientY;
  stage.classList.add('grabbing');
  try{ stage.setPointerCapture(e.pointerId); }catch(err){}
});
stage.addEventListener('pointermove',e=>{
  if(dragId!==e.pointerId) return;
  G.cam.x-=e.clientX-dlx; G.cam.y-=e.clientY-dly;
  dlx=e.clientX; dly=e.clientY;
});
const endDrag=e=>{ if(dragId===e.pointerId){ dragId=null; stage.classList.remove('grabbing'); } };
stage.addEventListener('pointerup',endDrag);
stage.addEventListener('pointercancel',endDrag);

/* save the shot: bakes filter, letterbox and a small caption into a PNG */
document.getElementById('phSnap').onclick=function(){
  const out=document.createElement('canvas');
  out.width=cv.width; out.height=cv.height;
  const oc=out.getContext('2d');
  oc.filter=FILTERS[PH.filter].f||'none';
  oc.drawImage(cv,0,0);
  oc.filter='none';
  let bh=0;
  if(PH.boxed){
    bh=Math.round(out.height*0.11);
    oc.fillStyle='#000';
    oc.fillRect(0,0,out.width,bh);
    oc.fillRect(0,out.height-bh,out.width,bh);
  }
  oc.save();
  oc.globalAlpha=0.85; oc.fillStyle='#f0e2c0';
  oc.textAlign='right'; oc.shadowColor='rgba(0,0,0,.85)'; oc.shadowBlur=8;
  try{ oc.letterSpacing='3px'; }catch(e){}
  oc.font=Math.max(12,Math.round(out.height*0.024))+'px Georgia';
  oc.fillText('EMBERWICK ISLE', out.width-24, out.height-(bh? bh+16 : 20));
  oc.restore();
  out.toBlob(b=>{
    if(!b) return;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(b);
    a.download='emberwick-'+new Date().toISOString().replace(/[:.]/g,'-').slice(0,19)+'.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  },'image/png');
  award('shutterbug');
  toast('\uD83D\uDCF8 Shot saved to your downloads.');
  if(typeof Snd!=='undefined'&&Snd.tone) Snd.tone(980,0.06,'square',0.05);
};

/* pause-menu entry point */
const pauseBtns=document.getElementById('pauseBtns');
if(pauseBtns){
  const b=document.createElement('button');
  b.className='btn'; b.id='photoBtn'; b.textContent='\uD83D\uDCF7 Photo Mode';
  pauseBtns.insertBefore(b,pauseBtns.firstChild);
  b.onclick=enterPhoto;
}

/* hotkeys - capture phase so the game's own key handler stays quiet */
window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(PH.on){
    if(k==='escape'||k==='p') exitPhoto();
    if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
    e.stopPropagation();
    return;
  }
  if(k==='p' && G.state==='play' && !G.paused && !dlg.open && !CINE && !G.interior && !P.dead){
    e.stopPropagation();
    enterPhoto();
  }
},true);

/* frame wrap: photo mode freezes the world but keeps water, flame and
   firefly shimmer alive - a living postcard */
const _frame=frame;
frame=function(ts){
  if(PH.on){
    requestAnimationFrame(frame);
    const raw=Math.min(0.05,(ts-lastT)/1000||0.016); lastT=ts;
    if(G.state!=='play' || G.interior){ exitPhoto(); render(); return; }
    G.time+=raw*0.3;
    render();
    return;
  }
  _frame(ts);
};

/* keep the keyboard hint honest */
const oc2=document.getElementById('ovControls');
if(oc2 && !isTouch) oc2.innerHTML += ' \u00B7 <b>P</b> photo mode';
})();


