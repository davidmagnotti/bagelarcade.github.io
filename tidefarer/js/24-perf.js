/* =====================================================================
   ADAPTIVE PERFORMANCE
   Scales render resolution down (and, at the lowest tier, drops the most
   expensive full-screen post-FX) when the frame rate can't keep up.
   Fast devices - phones especially - stay at full fidelity; weak desktop
   GPUs (e.g. Surface), where canvas blend-mode passes are slow, get
   rescued automatically. One-way step-down with hysteresis-free cooldown
   so a genuine slowdown ratchets quality down but a single hitch doesn't.
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
let tier=0, acc=0, cnt=0, cooldown=0, prev=0;

function apply(){
  RQ=TIERS[tier].rq;
  LOWFX=TIERS[tier].low;
  if(typeof resize==='function') resize();
}

const _frame=frame;
frame=function(ts){
  _frame(ts);
  // Only judge steady, active gameplay frames.
  if(G.state!=='play' || G.paused || document.hidden ||
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
