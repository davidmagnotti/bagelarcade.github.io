/* ============================================================================
   FLOW HOTKEY HINTS  -  a keyboard-only, self-effacing combat-key legend
   ----------------------------------------------------------------------------
   Once you've learned the flow from the Drowned Knight, the first few fights fade
   in a small hint by the hotbar - the KEYS (attack / dash / interact) and the
   COMBOS (deflect / cancel / chain) - then it stops showing once you've clearly
   got it. Hold H to peek it again any time.

   It is scrupulously out of the way of the other input modes:
     - TOUCH players never see it (the on-screen buttons are their affordance).
     - GAMEPAD players never see it while the pad is in use (input.gpDir active).
   Isolated + additive: one DOM node, driven off a wrapped updatePlayer.
   ============================================================================ */
(function(){
'use strict';

function ready(){ return (typeof P!=='undefined') && P; }
function now(){ return (typeof G!=='undefined' && G.time!=null) ? G.time : 0; }
function isTouchDev(){ return (typeof isTouch!=='undefined') && isTouch; }

var LIMIT = 4;      // auto-show for the first few post-learn encounters, then leave it be
var SHOW  = 6.0;    // seconds visible per trigger

var el=null, visT=0, wasCombat=false, padSeenT=-1;
var seen=0;
try{ var s=(typeof SafeStore!=='undefined') && SafeStore.get('tf_flowhint'); if(s!=null && s!==false) seen=parseInt(s,10)||0; }catch(e){}

// A gamepad giving input recently => treat it as pad play and stay hidden. If gamepad
// access is blocked/denied, input.gpDir simply stays null and this never trips.
function padActive(){
  if(typeof input!=='undefined' && input && input.gpDir) padSeenT = now();
  return padSeenT>=0 && (now()-padSeenT) < 4;
}

function build(){
  if(el) return el;
  el=document.createElement('div');
  el.id='flowHint';
  el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:98px;z-index:60;'+
    'pointer-events:none;opacity:0;transition:opacity .4s ease;max-width:min(92vw,660px);'+
    'text-align:center;font:12px/1.55 Verdana,Geneva,sans-serif;color:#efe2c4;'+
    'background:rgba(16,12,7,.74);border:1px solid #4a3826;border-radius:10px;padding:6px 13px;'+
    'box-shadow:0 3px 10px rgba(0,0,0,.5);text-shadow:0 1px 2px #000;white-space:nowrap;overflow:hidden;';
  el.innerHTML=
    '<div>⚔ <b>Space</b>/<b>K</b> Attack &nbsp;·&nbsp; ⟲ <b>Ctrl</b>/<b>L</b> Dash &nbsp;·&nbsp; ⛨ <b>O</b> Deflect &nbsp;·&nbsp; <b>E</b> Interact</div>'+
    '<div style="color:#8fe8cf;margin-top:1px;">attack→dash → <b>Cancel</b> &nbsp;·&nbsp; dash→dash → <b>Chain</b> &nbsp;·&nbsp; time <b>O</b> to a blow → <b>Deflect</b> (refunds stamina)</div>';
  (document.body||document.documentElement).appendChild(el);
  return el;
}
function setVisible(v){ build(); el.style.opacity = v ? '0.96' : '0'; }

function tick(dt){
  if(!ready()) return;
  // keyboard players only: never on touch, never while a gamepad is in use
  if(isTouchDev() || padActive()){ if(el) setVisible(false); visT=0; wasCombat=false; return; }
  // only once the flow is actually learned - before that the hint would teach moves you can't do
  if(!(P.unlocked && P.unlocked.combos)){ if(el) setVisible(false); return; }
  var playing = (typeof G!=='undefined' && G.state==='play' && !G.paused && !G.camCine && !G.interior &&
                 !(typeof dlg!=='undefined' && dlg.open) && !P.dead);
  if(!playing){ if(el) setVisible(false); visT=0; wasCombat=false; return; }

  var inCombat = !!(typeof G!=='undefined' && G.mobs && G.mobs.some(function(m){
    return !m.dead && !m.sealed && m.state==='chase' && dist(P.x,P.y,m.x,m.y)<9; }));

  // rising edge into a fight -> auto-show for the first LIMIT encounters, then stop nagging
  if(inCombat && !wasCombat && seen < LIMIT){
    visT = SHOW; seen++;
    try{ if(typeof SafeStore!=='undefined') SafeStore.set('tf_flowhint', ''+seen); }catch(e){}
  }
  wasCombat = inCombat;

  // quiet manual recall: hold H to peek the legend any time, forever
  var peek = (typeof keys!=='undefined' && keys['h']);
  if(peek) visT = Math.max(visT, 0.25);

  if(visT>0){
    visT -= dt;
    if(!inCombat && !peek) visT = Math.min(visT, 1.2);   // once the fight's over, fade it soon
    setVisible(true);
  } else setVisible(false);
}

if(typeof window.updatePlayer==='function'){
  var _u=window.updatePlayer;
  window.updatePlayer=function(dt){ var r=_u.apply(this,arguments); try{ tick(dt||0); }catch(e){} return r; };
}
})();
