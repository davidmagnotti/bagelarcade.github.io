/* =====================================================================
   DISPLAY performance control (pause-menu Settings) - GRAPHICS QUALITY
   Three modes on one lever:
     HIGH   - full detail, crisp per-tile render (nothing stripped).
     MEDIUM - the cheap render pipeline (cached ground+scenery blits, flat-shaded
              characters, costly passes stripped) at FULL window size, BUT with
              full-detail water drawn back on top. The experiment: the cheap
              pipeline's speed with a sea that still looks good.
     LOW    - the cheap pipeline throughout (water is a light animated overlay).
   The cheap pipeline is the fix for a desktop panel that runs WebGL games fine
   but chokes on our Canvas2D per-frame work when the window is large. Persists the
   choice (tf_gfx) and locks the auto-tuner to it (js/24-perf.js).

   Performance mode (shrank the window) and the Render-resolution slider were
   removed - the cheap pipeline covers their cases at full size, so any persisted
   value for them is cleared here to recover a previously shrunk/soft display.
   ===================================================================== */
(function(){
'use strict';

// Retire the removed levers: force the window back to full size and native
// resolution, whatever a past session persisted.
PERF=false; try{ SafeStore.set('tf_perf','0'); }catch(e){}
URQ=1;      try{ SafeStore.del('tf_urq'); }catch(e){}

// Convenience query flags at load, so a mode can be set without opening the menu.
// ?high / ?medium / ?low pick a mode directly; the older ?fast / ?lowgfx /
// ?perfmode all map to LOW (their historical "cheap pipeline" meaning).
try{
  const q=(location.search||'').toLowerCase();
  let m=null;
  if(q.indexOf('medium')>=0) m='medium';
  else if(q.indexOf('high')>=0) m='high';
  else if(q.indexOf('low')>=0||q.indexOf('fast')>=0||q.indexOf('lowgfx')>=0||q.indexOf('perfmode')>=0) m='low';
  if(m){ GFXMODE=m; FASTGFX=(m!=='high'); try{ SafeStore.set('tf_gfx',m); }catch(e){} }
}catch(e){}
if(typeof refreshLOWFX==='function') refreshLOWFX();
if(typeof resize==='function') resize();

function setGfxMode(mode){
  if(mode!=='high'&&mode!=='medium'&&mode!=='low') return;
  GFXMODE = mode;
  FASTGFX = (mode!=='high');
  if(typeof refreshLOWFX==='function') refreshLOWFX();
  try{ SafeStore.set('tf_gfx', mode); }catch(e){}
  // The bake scale (GC_S) depends on FASTGFX, so the cached ground/scenery must
  // be re-baked when the pipeline changes - otherwise the old-scale blit draws at
  // the wrong size. (See gcScale in js/10-rendering.js.)
  if(typeof invalidateGround==='function') invalidateGround();
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(typeof tfGfxLock==='function') tfGfxLock();   // honor this deliberate choice
  if(typeof resize==='function') resize();
  syncPerfUI();
  if(typeof toast==='function') toast(
    mode==='high'   ? 'Graphics: High - full detail.' :
    mode==='medium' ? 'Graphics: Medium - lighter render, full-detail water.' :
                      'Graphics: Low - lightest render, best for slow machines.');
}
window.setGfxMode = setGfxMode;
// Back-compat shim for any old caller: on => Low (cheap pipeline), off => High.
window.setFastMode = function(on){ setGfxMode(on?'low':'high'); };

window.syncPerfUI = function(){
  const ids={high:'cfgGfxHigh', medium:'cfgGfxMedium', low:'cfgGfxLow'};
  for(const m in ids){ const b=document.getElementById(ids[m]); if(b) b.classList.toggle('on', GFXMODE===m); }
};

// Fold the graphics control into the existing settings sync so it updates on menu open.
if(typeof syncCfgUI==='function'){
  const _sync=syncCfgUI;
  syncCfgUI=function(){ _sync(); syncPerfUI(); };
}

function inject(){
  if(document.getElementById('cfgGfxHigh')) return true;
  const anchor=document.getElementById('cfgFlashOff');
  const row=anchor && anchor.closest('.pRow');
  if(!row) return false;
  const dim='text-transform:none;letter-spacing:0;color:var(--parch-dim);font-size:10px;';
  row.insertAdjacentHTML('afterend',
    '<div class="pRow"><span>Graphics '+
      '<span style="'+dim+'">(Medium &amp; Low are lighter for slow machines; Medium keeps nice water)</span></span>'+
    '<div class="pSeg"><button class="btn" id="cfgGfxHigh">High</button>'+
    '<button class="btn" id="cfgGfxMedium">Medium</button>'+
    '<button class="btn" id="cfgGfxLow">Low</button></div></div>');
  document.getElementById('cfgGfxHigh').onclick=()=>setGfxMode('high');
  document.getElementById('cfgGfxMedium').onclick=()=>setGfxMode('medium');
  document.getElementById('cfgGfxLow').onclick=()=>setGfxMode('low');
  syncPerfUI();
  return true;
}
if(!inject()){
  let n=0; const iv=setInterval(()=>{ if(inject()||++n>40) clearInterval(iv); }, 250);
}
})();
