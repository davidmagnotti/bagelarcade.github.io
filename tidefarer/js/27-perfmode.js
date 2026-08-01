/* =====================================================================
   DISPLAY performance controls (pause-menu Settings)
   Three levers, cheapest visual cost first:
     - Fast graphics : the cheap render pipeline (cached ground+scenery blits,
                       costly passes stripped) at FULL window size. The fix for a
                       big desktop panel that runs WebGL games fine but chokes on
                       our Canvas2D per-tile draw storm when the window is large.
     - Render resolution : a slider (50-100%) trading sharpness for fill-rate.
     - Performance mode  : shrinks the DISPLAYED canvas into a smaller centered
                       box (fewest on-screen pixels) - the last resort.
   Each persists the choice and locks the auto-tuner to it (js/24-perf.js).
   ===================================================================== */
(function(){
'use strict';

// Convenience query flags at load, so a mode can be set without the pause menu:
//   ?lowgfx / ?perfmode -> Performance mode (smaller picture)
//   ?fast               -> Fast graphics (full size, cheap pipeline)
try{
  const q=(location.search||'').toLowerCase();
  if(q.indexOf('lowgfx')>=0 || q.indexOf('perfmode')>=0){
    PERF=true; if(typeof refreshLOWFX==='function') refreshLOWFX(); else LOWFX=true;
    try{ SafeStore.set('tf_perf','1'); }catch(e){}
    if(typeof resize==='function') resize();
  }
  if(q.indexOf('fast')>=0){
    FASTGFX=true; if(typeof refreshLOWFX==='function') refreshLOWFX();
    try{ SafeStore.set('tf_fast','1'); }catch(e){}
    if(typeof resize==='function') resize();
  }
}catch(e){}

function setPerfMode(on){
  PERF = !!on;
  if(typeof refreshLOWFX==='function') refreshLOWFX(); else if(PERF) LOWFX=true;
  try{ SafeStore.set('tf_perf', PERF?'1':'0'); }catch(e){}
  if(typeof tfGfxLock==='function') tfGfxLock();  // honor this deliberate choice
  if(typeof resize==='function') resize();
  syncPerfUI();
  if(typeof toast==='function') toast(PERF
    ? 'Performance mode on - smaller picture, smoother framerate.'
    : 'Performance mode off - full screen.');
}
window.setPerfMode = setPerfMode;

function setFastMode(on){
  FASTGFX = !!on;
  if(typeof refreshLOWFX==='function') refreshLOWFX();
  try{ SafeStore.set('tf_fast', FASTGFX?'1':'0'); }catch(e){}
  // The bake scale (GC_S) depends on FASTGFX, so the cached ground/scenery must
  // be re-baked at the new scale - otherwise the old-scale blit draws at the
  // wrong size. (See gcScale in js/10-rendering.js.)
  if(typeof invalidateGround==='function') invalidateGround();
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(typeof tfGfxLock==='function') tfGfxLock();   // honor this deliberate choice
  if(typeof resize==='function') resize();
  syncPerfUI();
  if(typeof toast==='function') toast(FASTGFX
    ? 'Fast graphics on - full size, lighter rendering.'
    : 'Fast graphics off - full detail.');
}
window.setFastMode = setFastMode;

function setRenderScale(pct){
  URQ = Math.max(0.5, Math.min(1, (pct||100)/100));
  try{ SafeStore.set('tf_urq', String(URQ)); }catch(e){}
  if(typeof tfGfxLock==='function') tfGfxLock();
  if(typeof resize==='function') resize();
  const lbl=document.getElementById('cfgResVal');
  if(lbl) lbl.textContent='('+Math.round(URQ*100)+'%)';
}
window.setRenderScale = setRenderScale;

window.syncPerfUI = function(){
  const on=document.getElementById('cfgPerfOn'), off=document.getElementById('cfgPerfOff');
  if(on){ on.classList.toggle('on', PERF); off.classList.toggle('on', !PERF); }
  const fon=document.getElementById('cfgFastOn'), foff=document.getElementById('cfgFastOff');
  if(fon){ fon.classList.toggle('on', FASTGFX); foff.classList.toggle('on', !FASTGFX); }
  const res=document.getElementById('cfgRes'), rv=document.getElementById('cfgResVal');
  if(res){ res.value=Math.round(URQ*100); }
  if(rv){ rv.textContent='('+Math.round(URQ*100)+'%)'; }
};

// Fold Performance into the existing settings sync so it updates on menu open.
if(typeof syncCfgUI==='function'){
  const _sync=syncCfgUI;
  syncCfgUI=function(){ _sync(); syncPerfUI(); };
}

function inject(){
  if(document.getElementById('cfgPerfOn')) return true;
  const anchor=document.getElementById('cfgFlashOff');
  const row=anchor && anchor.closest('.pRow');
  if(!row) return false;
  const dim='text-transform:none;letter-spacing:0;color:var(--parch-dim);font-size:10px;';
  row.insertAdjacentHTML('afterend',
    // Fast graphics - the recommended lever for a large window that runs slow.
    '<div class="pRow"><span>Fast graphics '+
      '<span style="'+dim+'">(full size, lighter rendering)</span></span>'+
    '<div class="pSeg"><button class="btn" id="cfgFastOn">On</button>'+
    '<button class="btn" id="cfgFastOff">Off</button></div></div>'+
    // Render resolution - trade sharpness for fill-rate while staying full-size.
    '<div class="pRow"><span>Render resolution '+
      '<span style="'+dim+'" id="cfgResVal">(100%)</span></span>'+
    '<input type="range" id="cfgRes" min="50" max="100" step="5" value="100" '+
      'style="flex:0 0 120px;cursor:pointer;"></div>'+
    // Performance mode - the smaller-window last resort.
    '<div class="pRow"><span>Performance mode '+
      '<span style="'+dim+'">(smaller picture, smoother)</span></span>'+
    '<div class="pSeg"><button class="btn" id="cfgPerfOn">On</button>'+
    '<button class="btn" id="cfgPerfOff">Off</button></div></div>');
  document.getElementById('cfgFastOn').onclick=()=>setFastMode(true);
  document.getElementById('cfgFastOff').onclick=()=>setFastMode(false);
  const res=document.getElementById('cfgRes');
  res.oninput=()=>setRenderScale(parseInt(res.value,10));
  document.getElementById('cfgPerfOn').onclick=()=>setPerfMode(true);
  document.getElementById('cfgPerfOff').onclick=()=>setPerfMode(false);
  syncPerfUI();
  return true;
}
if(!inject()){
  let n=0; const iv=setInterval(()=>{ if(inject()||++n>40) clearInterval(iv); }, 250);
}

// Honor the persisted setting once everything is up.
if(PERF && typeof resize==='function') resize();
})();
