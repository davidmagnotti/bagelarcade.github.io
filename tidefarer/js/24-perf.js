/* =====================================================================
   ADAPTIVE PERFORMANCE
   Scales render resolution down (and, at the lowest tier, drops the most
   expensive full-screen post-FX) when the frame rate can't keep up.
   Fast devices - phones especially - stay at full fidelity; weak desktop
   GPUs (e.g. Surface), where canvas blend-mode passes are slow, get
   rescued automatically. One-way step-down so a genuine slowdown ratchets
   quality down but a single hitch doesn't.

   Escape hatch: tidefarer/?safe (or ?lo) forces the lowest tier + minimal-GPU
   mode (no dynamic lighting) from the very first frame - a guaranteed-light
   fallback if the normal page overwhelms a weak GPU at load.
   ===================================================================== */
(function(){
'use strict';
if(typeof RQ==='undefined' || typeof frame!=='function') return;

const TIERS=[
  {rq:1.00, low:false},   // full quality
  {rq:0.82, low:false},   // ~33% fewer pixels
  {rq:0.66, low:false},   // ~56% fewer pixels
  {rq:0.50, low:true}     // ~75% fewer pixels + no cinematic grade / bloom
];

let safe=false;
try{
  const q=(location.search||'').toLowerCase();
  safe = q.indexOf('safe')>=0 || q.indexOf('lo')>=0;
}catch(e){}
if(safe) SAFE=true;

let tier = safe ? TIERS.length-1 : 0;   // safe mode pins the lowest tier
let acc=0, cnt=0, cooldown=0, prev=0;

function apply(){
  RQ=TIERS[tier].rq;
  LOWFX=TIERS[tier].low;
  if(typeof resize==='function') resize();
}
apply(); // establish the starting tier (matters for safe mode)

const _frame=frame;
frame=function(ts){
  _frame(ts);
  if(safe) return; // pinned - nothing to tune
  // Judge any live, animating frame (including the living title screen, which
  // is where a weak GPU can choke first) - just not paused/hidden/photo frames.
  if(G.paused || document.hidden ||
     document.body.classList.contains('photoing')){ prev=ts; return; }
  if(prev){ const dt=ts-prev; if(dt>0 && dt<250){ acc+=dt; cnt++; } }
  prev=ts;
  if(cnt>=48){
    const avg=acc/cnt; acc=0; cnt=0;
    if(cooldown>0){ cooldown--; return; }
    // avg > ~22ms  =>  under ~45fps sustained: drop one quality tier.
    if(avg>22 && tier<TIERS.length-1){ tier++; apply(); cooldown=3; }
  }
};
})();
