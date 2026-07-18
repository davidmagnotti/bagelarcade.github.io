/* =====================================================================
   PERF OVERLAY  -  tidefarer/?perf
   Shows live FPS, time spent inside render(), the active quality tier, the
   canvas backing size, and scene entity counts. Purely diagnostic; only
   activates when ?perf is in the URL, so it costs nothing normally.
   ===================================================================== */
(function(){
'use strict';
try{ if((location.search||'').toLowerCase().indexOf('perf')<0) return; }catch(e){ return; }
if(typeof render!=='function' || typeof frame!=='function') return;

const ema=(o,n)=> o? o*0.9+n*0.1 : n;
let rms=0, fps=0, prev=0;

const _render=render;
render=function(){
  const t0=performance.now();
  _render();
  rms=ema(rms, performance.now()-t0);
};

const box=document.createElement('div');
box.style.cssText='position:fixed;top:6px;left:6px;z-index:99999;'+
  'font:12px/1.35 monospace;white-space:pre;color:#0f0;background:rgba(0,0,0,.72);'+
  'padding:6px 9px;border-radius:6px;pointer-events:none;text-shadow:0 1px 2px #000';
document.body.appendChild(box);

let uiT=0;
const _frame=frame;
frame=function(ts){
  _frame(ts);
  if(prev){ const dt=ts-prev; if(dt>0&&dt<2000) fps=ema(fps,1000/dt); }
  prev=ts;
  uiT++;
  if(uiT%10===0){
    const nd=(G.nodes?G.nodes.length:0), dc=(G.decor?G.decor.length:0),
          mb=(G.mobs?G.mobs.length:0), pa=(G.parts?G.parts.length:0);
    box.textContent =
      'FPS '+fps.toFixed(0)+'   render '+rms.toFixed(1)+'ms\n'+
      'state '+G.state+'   RQ='+(typeof RQ!=='undefined'?RQ.toFixed(2):'?')+
        '  LOWFX='+(typeof LOWFX!=='undefined'?LOWFX:'?')+'  DPR='+DPR.toFixed(2)+'\n'+
      'canvas '+cv.width+'x'+cv.height+'   view '+VW+'x'+VH+'\n'+
      'nodes '+nd+'  decor '+dc+'  mobs '+mb+'  parts '+pa;
  }
};
})();
