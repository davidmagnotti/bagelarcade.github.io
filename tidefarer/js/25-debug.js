/* =====================================================================
   PERF OVERLAY / STAGE PROFILER  -  tidefarer/?perf
   Times each frame stage and reports the MEDIAN over a rolling window, so a
   one-time boot spike (synchronous sprite/world generation) can't pollute the
   steady-state numbers the way an exponential average did. Shows render(), the
   individual update functions, total JS per frame, time outside JS (paint/GPU),
   and the single worst frame (boot cost). Activates only with ?perf.
   ===================================================================== */
(function(){
'use strict';
try{ if((location.search||'').toLowerCase().indexOf('perf')<0) return; }catch(e){ return; }
if(typeof frame!=='function') return;

const now=()=>performance.now();
const acc={};                         // per-frame stage self-times
function bump(k,ms){ acc[k]=(acc[k]||0)+ms; }

function wrapGlobal(name){
  try{ const f=window[name]; if(typeof f!=='function') return;   // globals are window props
    window[name]=function(){ const t=now(); const r=f.apply(this,arguments); bump(name,now()-t); return r; };
  }catch(e){}
}
function wrapMethod(obj,label,key){
  try{ if(!obj||typeof obj[key]!=='function') return; const f=obj[key];
    obj[key]=function(){ const t=now(); const r=f.apply(this,arguments); bump(label,now()-t); return r; };
  }catch(e){}
}
['render','updateNPCs','updateWorld','updateMobs','updatePlayer','updateProjs',
 'ambientFX','updateGulls','stampExplore','updateBossUI','pollGamepad','refreshUI']
  .forEach(wrapGlobal);
if(typeof WX==='object')    wrapMethod(WX,'WX.update','update');
if(typeof Music==='object') wrapMethod(Music,'Music.update','update');
if(typeof Amb==='object')   wrapMethod(Amb,'Amb.update','update');

const N=40;
const jsBuf=[], gapBuf=[], stageBuf={};   // rolling windows
let prev=0, worst=0, uiN=0;
const push=(a,v)=>{ a.push(v); if(a.length>N) a.shift(); };
const median=a=>{ if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y); return s[s.length>>1]; };

const box=document.createElement('div');
box.style.cssText='position:fixed;top:6px;left:6px;z-index:99999;'+
  'font:12px/1.3 monospace;white-space:pre;color:#0f0;background:rgba(0,0,0,.78);'+
  'padding:6px 9px;border-radius:6px;pointer-events:none;text-shadow:0 1px 2px #000';
document.body.appendChild(box);

const _frame=frame;
frame=function(ts){
  for(const k in acc) delete acc[k];
  const t0=now();
  _frame(ts);
  const js=now()-t0;
  push(jsBuf,js);
  if(js>worst) worst=js;
  for(const k in acc){ (stageBuf[k]||(stageBuf[k]=[])); push(stageBuf[k],acc[k]); }
  if(prev){ const gap=ts-prev; if(gap>0&&gap<5000) push(gapBuf,gap); }
  prev=ts;

  if(++uiN%8===0){
    const gapM=median(gapBuf), jsM=median(jsBuf);
    const fps= gapM? 1000/gapM : 0;
    const nonjs=Math.max(0, gapM - jsM);
    const stages=Object.keys(stageBuf).map(k=>[k,median(stageBuf[k])])
      .sort((a,b)=>b[1]-a[1]).slice(0,7);
    let mem='';
    try{ if(performance.memory) mem='  heap '+(performance.memory.usedJSHeapSize/1048576|0)+'MB'; }catch(e){}
    let s='=== BUILD '+(typeof BUILD!=='undefined'?BUILD:'?')+' ===\n'+
          'FPS '+fps.toFixed(0)+'   frameJS '+jsM.toFixed(0)+'ms   nonJS '+nonjs.toFixed(0)+'ms\n'+
          'state '+(typeof G!=='undefined'?G.state:'?')+mem+
          '   worstframe '+worst.toFixed(0)+'ms\n'+
          'RQ='+(typeof RQ!=='undefined'?RQ.toFixed(2):'?')+' LOWFX='+(typeof LOWFX!=='undefined'?LOWFX:'?')+
          ' DPR='+DPR.toFixed(2)+'  canvas '+cv.width+'x'+cv.height+'\n'+
          (typeof GPUINFO==='object'? 'canvas raster: '+GPUINFO.class+
            ' ('+(GPUINFO.perIter||0).toFixed(2)+'ms/iter)\n' : '');
    for(const [k,v] of stages) s+='  '+v.toFixed(1).padStart(5)+'ms  '+k+'\n';
    box.textContent=s;
    if(uiN%64===0) console.log('[perf]\n'+s); // easy copy from DevTools console
  }
};
})();
