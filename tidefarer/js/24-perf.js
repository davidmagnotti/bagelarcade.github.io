/* =====================================================================
   ADAPTIVE PERFORMANCE
   Scales render resolution down and, at lower tiers, strips the expensive
   decorative passes (cinematic grade, bloom, dynamic lighting, water sheen,
   foam, fog, crows/gulls, cloud shadows). Fast devices - phones especially -
   stay at full fidelity; weak/software-rendered desktop canvases (e.g. Edge
   on a Surface with no GPU acceleration) get rescued automatically.

   Reacts on ELAPSED TIME, not a fixed frame count, so a machine stuck at a
   few FPS ratchets down within ~1s instead of tens of seconds, and can jump
   several tiers at once when frames are catastrophically slow. One-way down.

   Escape hatch: tidefarer/?safe (or ?lo) pins the lowest tier + minimal-GPU
   mode (no dynamic lighting) from the first frame.
   ===================================================================== */
(function(){
'use strict';
if(typeof RQ==='undefined' || typeof frame!=='function') return;

const TIERS=[
  {rq:1.00, low:false},   // full quality
  {rq:0.80, low:false},   // fewer pixels
  {rq:0.62, low:false},   // fewer still
  {rq:0.45, low:true}     // lowest res + bare-bones render (no decorative passes)
];
const MAX=TIERS.length-1;

let safe=false;
try{
  const q=(location.search||'').toLowerCase();
  safe = q.indexOf('safe')>=0 || q.indexOf('lo')>=0;
}catch(e){}
if(safe) SAFE=true;

let tier = safe ? MAX : 0;
let acc=0, cnt=0, prev=0, cooldownUntil=0;

function apply(){
  RQ=TIERS[tier].rq;
  LOWFX=TIERS[tier].low;
  if(typeof resize==='function') resize();
}
apply();

const _frame=frame;
frame=function(ts){
  _frame(ts);
  if(safe) return; // pinned
  if(G.paused || document.hidden ||
     document.body.classList.contains('photoing')){ prev=ts; return; }
  if(prev){ const dt=ts-prev; if(dt>0 && dt<2000){ acc+=dt; cnt++; } }
  prev=ts;
  // Evaluate roughly every 0.6s of wall time (or 60 frames, whichever first),
  // so slow machines still get judged quickly.
  if((acc>=600 || cnt>=60) && cnt>0){
    const avg=acc/cnt; acc=0; cnt=0;
    if(ts<cooldownUntil) return;
    if(avg>22 && tier<MAX){                 // under ~45fps: step down
      const jump = avg>120 ? 3 : avg>55 ? 2 : 1;   // very slow => drop harder
      tier=Math.min(MAX, tier+jump);
      apply();
      cooldownUntil=ts+900;                 // let the new tier settle
    }
  }
};
})();
