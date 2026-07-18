/* =====================================================================
   EFFECTS PANEL - per-effect checkboxes in the pause menu (Display section).
   Toggles the FX flags (persisted). They take effect in Performance mode;
   normal-detail devices always render everything. Grouped cheap vs pricey.
   ===================================================================== */
(function(){
'use strict';
if(typeof FX==='undefined') return;

const GROUPS = [
  ['Costly (off by default)', [
    ['grade','Cinematic color grade'],
    ['lighting','Dynamic night lighting'],
    ['bloom','Bloom glow'],
    ['cloudShadows','Cloud shadows'],
    ['foam','Shore foam'],
  ]],
  ['Cheap (on by default)', [
    ['fog','Ground fog'],
    ['decals','Blood & gore'],
    ['particles','Particles'],
    ['fireflies','Fireflies'],
    ['birds','Birds'],
    ['vignette','Vignette'],
  ]],
];

function build(){
  if(document.getElementById('fxPanel')) return true;
  const anchor=document.getElementById('cfgPerfOn');           // the Performance-mode row
  const row=anchor && anchor.closest('.pRow');
  if(!row) return false;
  let html='<div id="fxPanel" style="margin:8px 0 2px;padding:9px 11px;border-radius:9px;'+
    'background:rgba(20,14,8,.5);border:1px solid #3a2c1c;">'+
    '<div style="font-size:11px;color:var(--parch-dim);margin-bottom:7px;">'+
    'Effects in Performance mode - untick to go faster</div>';
  for(const [title,items] of GROUPS){
    html+='<div style="font-size:10px;letter-spacing:.5px;color:var(--ember);margin:4px 0 3px;text-transform:uppercase;">'+title+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;">';
    for(const [k,label] of items){
      html+='<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;color:var(--parch);">'+
        '<input type="checkbox" data-fx="'+k+'"'+(FX[k]?' checked':'')+' style="cursor:pointer;">'+label+'</label>';
    }
    html+='</div>';
  }
  html+='</div>';
  row.insertAdjacentHTML('afterend', html);
  document.querySelectorAll('#fxPanel input[data-fx]').forEach(cb=>{
    cb.onchange=()=>{
      const k=cb.getAttribute('data-fx');
      FX[k]=cb.checked?1:0;
      try{ SafeStore.set('tf_fx_'+k, FX[k]?'1':'0'); }catch(e){}
    };
  });
  return true;
}
if(!build()){ let n=0; const iv=setInterval(()=>{ if(build()||++n>40) clearInterval(iv); },250); }
})();
