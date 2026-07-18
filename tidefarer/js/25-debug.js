/* =====================================================================
   PERF OVERLAY / STAGE PROFILER  -  tidefarer/?perf
   Times each stage of the frame so the bottleneck is measured, not guessed:
   render(), the individual update functions, total JS per frame, and the
   time spent OUTSIDE our JS (browser style/layout/paint/GPU compositing).
   Diagnostic only; activates solely when ?perf is in the URL.
   ===================================================================== */
(function(){
'use strict';
try{ if((location.search||'').toLowerCase().indexOf('perf')<0) return; }catch(e){ return; }
if(typeof frame!=='function') return;

const now = ()=>performance.now();
const acc = {};              // per-frame accumulated ms, keyed by stage
function bump(k,ms){ acc[k]=(acc[k]||0)+ms; }

// Wrap a global function (by name) so its self-time accumulates each frame.
function wrapGlobal(name){
  try{
    const f = (0,eval)(name);          // read current global binding
    if(typeof f!=='function') return;
    const w = function(){ const t=now(); const r=f.apply(this,arguments); bump(name, now()-t); return r; };
    (0,eval)(name+'=w');               // reassign global binding
  }catch(e){}
}
// Wrap an object method so its self-time accumulates.
function wrapMethod(obj,label,key){
  try{
    if(!obj||typeof obj[key]!=='function') return;
    const f=obj[key];
    obj[key]=function(){ const t=now(); const r=f.apply(this,arguments); bump(label, now()-t); return r; };
  }catch(e){}
}

['render','updateNPCs','updateWorld','updateMobs','updatePlayer','updateProjs',
 'ambientFX','updateGulls','stampExplore','updateBossUI','pollGamepad','refreshUI']
  .forEach(wrapGlobal);
if(typeof WX==='object')    wrapMethod(WX,'WX.update','update');
if(typeof Music==='object') wrapMethod(Music,'Music.update','update');
if(typeof Amb==='object')   wrapMethod(Amb,'Amb.update','update');

const ema=(o,n)=> o? o*0.9+n*0.1 : n;
let fps=0, jsms=0, prev=0, uiN=0;

const box=document.createElement('div');
box.style.cssText='position:fixed;top:6px;left:6px;z-index:99999;'+
  'font:12px/1.3 monospace;white-space:pre;color:#0f0;background:rgba(0,0,0,.78);'+
  'padding:6px 9px;border-radius:6px;pointer-events:none;text-shadow:0 1px 2px #000';
document.body.appendChild(box);

const _frame=frame;
frame=function(ts){
  for(const k in acc) delete acc[k];   // reset stage timers for this frame
  const t0=now();
  _frame(ts);
  const js=now()-t0;                    // total JS time this frame
  jsms=ema(jsms, js);
  if(prev){ const dt=ts-prev; if(dt>0&&dt<3000) fps=ema(fps,1000/dt); }
  const gap = prev? (ts-prev) : 0;
  prev=ts;

  if(++uiN%8===0){
    const nonjs = Math.max(0, gap - js); // time outside our JS: paint/layout/GPU
    const stages = Object.keys(acc).map(k=>[k,acc[k]]).sort((a,b)=>b[1]-a[1]).slice(0,6);
    let s='FPS '+fps.toFixed(0)+'   frameJS '+jsms.toFixed(0)+'ms   nonJS '+nonjs.toFixed(0)+'ms\n'+
          'RQ='+(typeof RQ!=='undefined'?RQ.toFixed(2):'?')+' LOWFX='+(typeof LOWFX!=='undefined'?LOWFX:'?')+
          ' DPR='+DPR.toFixed(2)+'  canvas '+cv.width+'x'+cv.height+'\n';
    for(const [k,v] of stages) s+='  '+v.toFixed(0).padStart(4)+'ms  '+k+'\n';
    box.textContent=s;
  }
};
})();
