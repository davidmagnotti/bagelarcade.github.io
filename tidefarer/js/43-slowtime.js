/* =====================================================================
   SLOW-TIME — Joan's gift (the warrior's half of the Tidefarer's book).
   -----------------------------------------------------------------------
   The marquee mechanic the roadmap names (STORY.md, "The two gifts"):
   in a slowed world the warrior strikes many times before a foe can answer.

   Implementation is a clean time-split, not a new physics: the main loop
   (js/21-exploration.js) feeds the PLAYER full dt and the WORLD (mobs, their
   projectiles, ambient timers) the reduced dt this module hands back from
   `slowTimeTick`. The hero keeps her cadence while everything else crawls.

   Costed and player-triggered (Q on a keyboard, an on-screen disc on touch):
   a pool of mana drains while it holds, then a short cooldown before the tide
   will gather again. Granted once, by `grantSlowTime()`, from the book scene.
   ===================================================================== */
(function(){
'use strict';

const SLOW = {
  MOB_DT   : 0.30,   // the world runs at ~a third while the tide is stilled
  START_MP : 12,     // the focus it takes to still the tide at all
  DRAIN    : 15,     // mana/sec spent holding it open (real-time)
  MAX_DUR  : 6.0,    // a hard ceiling even on a deep mana pool
  COOLDOWN : 5.0,    // the lull before it can be called again
};

function slowActive(){ return (typeof G!=='undefined') && (G.playerSlow||0) > 0; }
window.slowTimeActive = slowActive;

// ---- grant: the book hands the warrior her half ------------------------------
function grantSlowTime(){
  P.spells = P.spells || {};
  if(!P.spells.slowtime){
    P.spells.slowtime = 1;
    if(typeof toast==='function') toast('<b style="color:#bfe8ff">You learn to STILL THE TIDE.</b> Press <b>Q</b> (or the blue disc) and the world crawls while you do not - strike many times before a foe can answer. It spends focus, and needs a breath to gather again.', 9000);
  }
  slowEnsureBtn();
  if(typeof refreshUI==='function') refreshUI();
}
window.grantSlowTime = grantSlowTime;

function slowFlash(msg){
  if(typeof toastErr==='function') toastErr(msg);
  else if(typeof addFloat==='function') addFloat(msg, P.x, P.y-2.2, '#bfe8ff', 1.1);
  P.atkCd = Math.max(P.atkCd||0, 0.2);
}

// ---- trigger / end -----------------------------------------------------------
function triggerSlowTime(){
  if(typeof G==='undefined' || G.state!=='play' || G.paused || G.menuPause) return;
  if(G.bossIntro || (typeof dlg!=='undefined' && dlg.open) || (typeof P==='undefined')) return;
  if(!(P.spells && P.spells.slowtime) || P.dead) return;
  if(slowActive()){ slowEnd(); return; }                         // press again to let go early
  if((P.slowCd||0) > 0){ slowFlash('The tide has to gather again.'); return; }
  if((P.mp||0) < SLOW.START_MP){ slowFlash('Not enough focus to still the tide.'); return; }
  G.playerSlow = SLOW.MAX_DUR;
  if(typeof Snd!=='undefined' && Snd.magic) Snd.magic();
  slowOverlay(true);
  if(typeof addFloat==='function') addFloat('THE TIDE STILLS', P.x, P.y-2.6, '#bfe8ff', 1.3);
  if(typeof shockwave==='function') shockwave(P.x, P.y, 'rgba(150,215,255,0.7)', 44);
  G.shake = Math.max(G.shake||0, 0.22);
}
window.triggerSlowTime = triggerSlowTime;

function slowEnd(){
  if(!slowActive()){ slowOverlay(false); return; }
  G.playerSlow = 0;
  P.slowCd = SLOW.COOLDOWN;
  slowOverlay(false);
  if(typeof addFloat==='function') addFloat('the tide runs again', P.x, P.y-2.2, '#8fb8d8', 0.9);
}
window.slowTimeEnd = slowEnd;

// ---- the per-frame hook the main loop calls ----------------------------------
// Returns the dt the WORLD should advance by this frame; the player always gets
// full dt. Drains mana and ends the effect on empty / cap / cooldown expiry.
function slowTimeTick(dt, raw){
  raw = raw || dt;
  if((P.slowCd||0) > 0) P.slowCd = Math.max(0, P.slowCd - raw);
  slowUpdateBtn();
  if(!slowActive()) return dt;
  G.playerSlow -= raw;
  P.mp = (P.mp||0) - SLOW.DRAIN * raw;
  if(P.mp <= 0){ P.mp = 0; slowEnd(); return dt; }
  if(G.playerSlow <= 0){ slowEnd(); return dt; }
  return dt * SLOW.MOB_DT;
}
window.slowTimeTick = slowTimeTick;

// ---- the tint overlay --------------------------------------------------------
let _ov=null;
function slowMakeOverlay(){
  if(_ov || typeof document==='undefined') return;
  if(!document.getElementById('slowOvStyle')){
    const st=document.createElement('style'); st.id='slowOvStyle';
    st.textContent =
      '#slowOv{position:fixed;inset:0;z-index:22;pointer-events:none;opacity:0;'+
      'transition:opacity .18s ease;mix-blend-mode:screen;'+
      'background:radial-gradient(ellipse at 50% 46%, rgba(120,190,255,0) 42%, rgba(70,130,205,.18) 78%, rgba(40,80,150,.42) 100%);}'+
      '#slowOv.on{opacity:1;}'+
      '#slowOv::after{content:"";position:absolute;inset:0;mix-blend-mode:overlay;opacity:.5;'+
      'background:repeating-linear-gradient(0deg, rgba(180,220,255,.05) 0px, rgba(180,220,255,.05) 1px, transparent 2px, transparent 4px);}'+
      '#slowBtn{transition:opacity .14s ease, filter .14s ease;background:'+
      'radial-gradient(circle at 50% 46%, rgba(90,170,220,.55) 0%, rgba(48,100,150,.6) 42%, transparent 46%),'+
      'linear-gradient(180deg,#3a2c1c 0%,#2a1e12 60%,#20160c 100%);}'+
      '#slowBtn.cooldown{opacity:.4;filter:grayscale(.9) brightness(.8);}'+
      '#slowBtn.active{filter:brightness(1.35) drop-shadow(0 0 8px rgba(140,205,255,.8));}';
    document.head.appendChild(st);
  }
  _ov=document.createElement('div'); _ov.id='slowOv';
  document.body.appendChild(_ov);
}
function slowOverlay(on){
  slowMakeOverlay();
  if(_ov) _ov.classList.toggle('on', !!on);
}

// ---- the on-screen disc (touch + a visible affordance for the key) -----------
let _btn=null;
function slowEnsureBtn(){
  if(_btn || typeof document==='undefined') return;
  const host=document.getElementById('actBtns'); if(!host) return;
  _btn=document.createElement('div');
  _btn.className='abtn small'; _btn.id='slowBtn'; _btn.title='Still the tide (Q)';
  _btn.textContent='◷';
  // drop it just above the dodge disc
  const dodge=document.getElementById('dodgeBtn');
  if(dodge) host.insertBefore(_btn, dodge); else host.appendChild(_btn);
  if(typeof pressable==='function') pressable(_btn, ()=>{ triggerSlowTime(); });
  else _btn.addEventListener('click', ()=>triggerSlowTime());
  slowUpdateBtn();
}
function slowUpdateBtn(){
  if(!_btn) return;
  const show = !!(P.spells && P.spells.slowtime);
  _btn.style.display = show ? 'flex' : 'none';
  if(!show) return;
  _btn.classList.toggle('active', slowActive());
  _btn.classList.toggle('cooldown', !slowActive() && (P.slowCd||0)>0);
}
window.slowEnsureBtn = slowEnsureBtn;

// ---- keyboard: Q stills the tide ---------------------------------------------
window.addEventListener('keydown', function(e){
  if(typeof G==='undefined' || G.state!=='play') return;
  if(G.bossIntro || (typeof dlg!=='undefined' && dlg.open)) return;
  const el=document.activeElement;
  if(el && (el.tagName==='INPUT' || el.tagName==='TEXTAREA')) return;
  if((e.key||'').toLowerCase()==='q'){ e.preventDefault(); triggerSlowTime(); }
});

// build the disc as soon as the HUD exists, in case the gift is already earned
// (a restored save). Harmless if the button host isn't up yet.
if(typeof document!=='undefined'){
  if(document.readyState!=='loading') slowEnsureBtn();
  else document.addEventListener('DOMContentLoaded', slowEnsureBtn);
}
})();
