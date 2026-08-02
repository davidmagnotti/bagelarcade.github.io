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

   Player override: once the player picks display settings in the pause menu
   (Performance mode, effect toggles) the tuner freezes to that choice and only
   steps in if frames collapse to a near-slideshow (~1 FPS) - so a deliberate
   choice isn't auto-downgraded a second later. See USERGFX / tfGfxLock().

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

// avg ms/frame this high is an unplayable slideshow (~1.4 FPS). Even when the
// player has locked their display choice we still rescue past this point.
const CATASTROPHIC=700;

// Called when the player changes a display setting in the pause menu. Freezes
// the auto-tuner to their choice (see USERGFX) unless frames turn catastrophic.
window.tfGfxLock=function(){
  USERGFX=true;
  try{ SafeStore.set('tf_gfxlock','1'); }catch(e){}
};

let safe=false;
try{
  const q=(location.search||'').toLowerCase();
  safe = q.indexOf('safe')>=0 || q.indexOf('lo')>=0;
}catch(e){}
if(safe) SAFE=true;

/* The boot probe (js/01b-gpu-probe.js) flags a software-rasterized canvas. When
   it does, start one tier down (rq 0.80 - a barely-perceptible resolution drop)
   instead of waiting ~1s of janky full-detail frames for the live tuner to react.
   Kept to a single, near-invisible step so a false positive on a capable machine
   costs almost nothing (the tuner is one-way-down and can't climb back up). */
const softCanvas = (typeof SOFTCANVAS!=='undefined') && SOFTCANVAS;
let tier = safe ? MAX : (softCanvas && !USERGFX ? 1 : 0);
let acc=0, cnt=0, prev=0, cooldownUntil=0, slowStreak=0;

function apply(){
  RQ=TIERS[tier].rq;
  // Feed the tier's low-gfx state into the shared LOWFX derivation so the
  // player's Fast-graphics choice (js/01-core refreshLOWFX) isn't clobbered.
  TIER_LOW=TIERS[tier].low;
  if(typeof refreshLOWFX==='function') refreshLOWFX(); else LOWFX=TIER_LOW||PERF;
  if(typeof resize==='function') resize();
}
apply();

/* One stall frame - another window/pop-up grabbing the main thread, a GC pause,
   or the tab returning to the foreground - used to be enough to slam the render
   scale to the floor (this tuner is one-way-down), leaving the whole screen fuzzy
   until a refresh reset the tier. Guard it: drop the current timing window on any
   focus/visibility change so the catch-up frame after a stall is never measured,
   and (below) require the slowness to actually persist before stepping down. */
function resetTiming(){ prev=0; acc=0; cnt=0; slowStreak=0; }
window.addEventListener('blur', resetTiming);
window.addEventListener('focus', resetTiming);
window.addEventListener('pageshow', resetTiming);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) resetTiming(); });

const _frame=frame;
frame=function(ts){
  _frame(ts);
  if(safe) return; // pinned
  if(BENCH){ prev=ts; return; } // benchmark harness is driving; don't auto-tune
  if(G.paused || G.menuPause || document.hidden){ prev=ts; return; }
  if(prev){ const dt=ts-prev; if(dt>0 && dt<2000){ acc+=dt; cnt++; } }
  prev=ts;
  // Evaluate roughly every 0.6s of wall time (or 60 frames, whichever first),
  // so slow machines still get judged quickly.
  if((acc>=600 || cnt>=60) && cnt>0){
    const avg=acc/cnt; acc=0; cnt=0;
    if(ts<cooldownUntil) return;
    // The player locked their display choice: leave it alone unless frames have
    // collapsed to a slideshow, in which case rescue regardless of the lock.
    if(USERGFX && avg<CATASTROPHIC) return;
    if(avg>22 && tier<MAX){                 // under ~45fps: step down
      // Only step down once the slow reading has held across two evaluation
      // windows (~1.2s). A lone transient hitch trips one window and the next
      // window recovers - resetting the streak - so it can no longer drag the
      // render resolution to the floor permanently (the "fuzzy until refresh" bug).
      if(++slowStreak>=2){
        const jump = avg>120 ? 3 : avg>55 ? 2 : 1;   // very slow => drop harder
        tier=Math.min(MAX, tier+jump);
        apply();
        cooldownUntil=ts+900;                 // let the new tier settle
        slowStreak=0;
      }
    } else {
      slowStreak=0;                          // frames are healthy again
    }
    // (The old "shrink the window" fallback at the lowest tier was removed with
    //  Performance mode - the lowest tier already engages the Fast-graphics
    //  pipeline at full size, which is the better answer.)
  }
};
})();
