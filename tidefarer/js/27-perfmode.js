/* =====================================================================
   PERFORMANCE MODE toggle
   Renders the game into a smaller centered box so the GPU composites far
   fewer pixels each frame - the one lever that helps machines that are slow
   to present a full-viewport canvas. Adds a Settings toggle (pause menu),
   keeps it in sync, and persists the choice. Auto-enable lives in the perf
   tuner (js/24-perf.js), which flips it on when the lowest tier is still slow.
   ===================================================================== */
(function(){
'use strict';

// Convenience: tidefarer/?lowgfx (or ?perfmode) forces Performance Mode on at
// load, so it can be enabled without reaching the in-game pause menu.
try{
  const q=(location.search||'').toLowerCase();
  if(q.indexOf('lowgfx')>=0 || q.indexOf('perfmode')>=0){
    PERF=true; LOWFX=true; try{ SafeStore.set('tf_perf','1'); }catch(e){}
    if(typeof resize==='function') resize();
  }
}catch(e){}

function setPerfMode(on){
  PERF = !!on;
  if(PERF) LOWFX = true;   // engage aggressive low-gfx stripping immediately
  try{ SafeStore.set('tf_perf', PERF?'1':'0'); }catch(e){}
  if(typeof resize==='function') resize();
  syncPerfUI();
  if(typeof toast==='function') toast(PERF
    ? 'Performance mode on - smaller picture, smoother framerate.'
    : 'Performance mode off - full screen.');
}
window.setPerfMode = setPerfMode;

window.syncPerfUI = function(){
  const on=document.getElementById('cfgPerfOn'), off=document.getElementById('cfgPerfOff');
  if(on){ on.classList.toggle('on', PERF); off.classList.toggle('on', !PERF); }
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
  row.insertAdjacentHTML('afterend',
    '<div class="pRow"><span>Performance mode '+
      '<span style="text-transform:none;letter-spacing:0;color:var(--parch-dim);font-size:10px;">(smaller picture, smoother)</span></span>'+
    '<div class="pSeg"><button class="btn" id="cfgPerfOn">On</button>'+
    '<button class="btn" id="cfgPerfOff">Off</button></div></div>');
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
