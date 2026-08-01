/* =====================================================================
   DISPLAY performance control (pause-menu Settings) - FAST GRAPHICS
   One lever: the cheap render pipeline (cached ground+scenery blits, flat-shaded
   characters, costly passes stripped) at FULL window size. It's the fix for a
   desktop panel that runs WebGL games fine but chokes on our Canvas2D per-frame
   work when the window is large. Persists the choice and locks the auto-tuner
   to it (js/24-perf.js).

   Performance mode (shrank the window) and the Render-resolution slider were
   removed - Fast graphics covers their cases at full size, so any persisted
   value for them is cleared here to recover a previously shrunk/soft display.
   ===================================================================== */
(function(){
'use strict';

// Retire the removed levers: force the window back to full size and native
// resolution, whatever a past session persisted.
PERF=false; try{ SafeStore.set('tf_perf','0'); }catch(e){}
URQ=1;      try{ SafeStore.del('tf_urq'); }catch(e){}

// Convenience query flags at load (?fast / ?lowgfx / ?perfmode all now mean
// "Fast graphics"), so the mode can be set without opening the pause menu.
try{
  const q=(location.search||'').toLowerCase();
  if(q.indexOf('fast')>=0 || q.indexOf('lowgfx')>=0 || q.indexOf('perfmode')>=0){
    FASTGFX=true; try{ SafeStore.set('tf_fast','1'); }catch(e){}
  }
}catch(e){}
if(typeof refreshLOWFX==='function') refreshLOWFX();
if(typeof resize==='function') resize();

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

window.syncPerfUI = function(){
  const fon=document.getElementById('cfgFastOn'), foff=document.getElementById('cfgFastOff');
  if(fon){ fon.classList.toggle('on', FASTGFX); foff.classList.toggle('on', !FASTGFX); }
};

// Fold Fast graphics into the existing settings sync so it updates on menu open.
if(typeof syncCfgUI==='function'){
  const _sync=syncCfgUI;
  syncCfgUI=function(){ _sync(); syncPerfUI(); };
}

function inject(){
  if(document.getElementById('cfgFastOn')) return true;
  const anchor=document.getElementById('cfgFlashOff');
  const row=anchor && anchor.closest('.pRow');
  if(!row) return false;
  const dim='text-transform:none;letter-spacing:0;color:var(--parch-dim);font-size:10px;';
  row.insertAdjacentHTML('afterend',
    '<div class="pRow"><span>Fast graphics '+
      '<span style="'+dim+'">(full size, smoother - best for slow machines)</span></span>'+
    '<div class="pSeg"><button class="btn" id="cfgFastOn">On</button>'+
    '<button class="btn" id="cfgFastOff">Off</button></div></div>');
  document.getElementById('cfgFastOn').onclick=()=>setFastMode(true);
  document.getElementById('cfgFastOff').onclick=()=>setFastMode(false);
  syncPerfUI();
  return true;
}
if(!inject()){
  let n=0; const iv=setInterval(()=>{ if(inject()||++n>40) clearInterval(iv); }, 250);
}
})();
