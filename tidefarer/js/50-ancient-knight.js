/* ============================================================================
   THE DROWNED KNIGHT  -  the ancient spirit who teaches the FLOW of blades
   ----------------------------------------------------------------------------
   Orin sends the castaway up to the isle's far north-east headland to "look
   around for an old friend." The friend is a ghost - the isle's first protector,
   long dead and dryly amused about it - who teaches the advanced combat layer in
   a short hands-on DRILL, in the exact spirit of Rask's parry lesson:

     Lesson 1 - CANCEL:  strike, then break the swing early with a dash.
     Lesson 2 - CHAIN:   dash, and dash again - footwork past its natural end.
     Lesson 3 - DEFLECT: time a slash to turn the knight's practice strike aside.

   Clearing all three GRADUATES the combo prototype into a real, earned ability:
   it sets P.unlocked.combos, which is what 49-combo-proto.js
   now gates on. During the drill itself the moves are on loan (P.knightDrill also
   flips ON()), the same way Rask enables the timed parry before it's formally learned.

   The knight NPC + its dialogue live in 04-data.js (spawnNPCs) and 06-dialog.js.
   This file owns the drill state machine, the spirit-reveal flourish, the unlock,
   and the spectral render is a small hook in 10-rendering.js (look.spectral).
   ============================================================================ */
(function(){
'use strict';

function ready(){ return (typeof P!=='undefined') && P; }
function now(){ return (typeof G!=='undefined' && G.time!=null) ? G.time : 0; }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||4200); }
function isTouchDev(){ return (typeof isTouch!=='undefined') && isTouch; }

// The three lessons. `hint` is the instruction toast; `check(D,dt)` returns true the
// moment the lesson is satisfied. Kept data-driven so the feel is easy to retune.
var LESSONS = [
  { key:'cancel', title:'CANCEL',
    hint:function(){ return 'Lesson one - <b>CANCEL</b>. '+(isTouchDev()?'Tap <b>⚔</b>, then <b>⤷</b>':'Press <b>attack</b> (Space), then <b>dash</b> (Ctrl / L)')+' - strike, then <b>break the swing early with a dash</b> before it lands you flat-footed.'; },
    done:'The recovery is yours to spend, not the enemy\'s.',
    // a dash begun within a breath of a swing = the stroke cancelled into footwork
    check:function(D){ return D._dashStarted && D._lastAtk>0 && (now()-D._lastAtk) < 0.6; } },
  { key:'chain', title:'CHAIN',
    hint:function(){ return 'Lesson two - <b>CHAIN</b>. '+(isTouchDev()?'Tap <b>⤷</b>, then <b>⤷</b> again':'<b>Dash</b> (Ctrl / L), then <b>dash again</b>')+' - carry your footwork <b>past its natural end</b>. Watch your <b>stamina</b>.'; },
    done:'Twice-quick. Few living feet manage it.',
    // two dash-starts inside a short window = a chained dash
    check:function(D){ var t=D.dashTimes; return t.length>=2 && (t[t.length-1]-t[t.length-2]) < 0.85; } },
  { key:'deflect', title:'PARRY',
    hint:function(){ return 'Lesson three - <b>PARRY</b>. I will strike; '+(isTouchDev()?'tap the <b>◆ parry</b> button':'press <b>O</b> (or attack)')+' <b>the instant my blow reaches you</b> to turn it aside. Timing, not flailing - a blade well-met needs no shield.'; },
    done:'Turned clean. That is the whole of it.',
    // hands-on: driven by the throw-cycle in updateKnightDrill (parry the knight's strike)
    check:function(D){ return !!D._deflected; } },
];

/* ---------- keep the training ground clear (slimes shooed, stray clutter felled) ----------
   The worldgen already keeps the NE arena tree-free and lays the approach ribbon
   (see carveKnightApproach / blockedZone in 02-worldgen.js); this is the runtime
   sweep for anything mobile (wandered slimes) or any stray node, done when the ghost
   reveals and again as the drill begins so nothing crowds the lesson. */
function clearKnightArena(radius){
  if(typeof G==='undefined' || !G.npcs) return;
  var k=G.npcs.find(function(n){ return n.id==='knight'; }); if(!k) return;
  var R=radius||6.0, kx=k.x, ky=k.y;
  if(G.mobs) G.mobs = G.mobs.filter(function(m){ return dist(m.x,m.y,kx,ky) >= R; });
  if(G.nodes){
    var keep=[];
    for(var i=0;i<G.nodes.length;i++){ var n=G.nodes[i];
      if(dist(n.x,n.y,kx,ky) < R){ if(n.tx!=null && typeof setSolid==='function') setSolid(n.tx|0,n.ty|0,0); continue; }
      keep.push(n);
    }
    G.nodes=keep;
  }
  if(typeof invalidateScenery==='function') invalidateScenery();
}

/* ---------- the reveal: a cold shimmer where the ghost stands ---------- */
function knightRevealFx(){
  clearKnightArena();
  var k = (typeof G!=='undefined' && G.npcs) ? G.npcs.find(function(n){ return n.id==='knight'; }) : null;
  var x = k? k.x : (ready()?P.x:0), y = k? k.y : (ready()?P.y:0);
  if(typeof banner==='function') banner('AN OLD PROTECTOR', 'The headland was never empty');
  if(typeof shockwave==='function') shockwave(x, y-0.3, 'rgba(190,216,238,0.85)', 34);
  if(typeof burst==='function') burst(x, y-0.6, '#cfe2f4', 22, 3.0);
  if(typeof G!=='undefined'){ G.flash=Math.max(G.flash||0, 0.16); }
  if(typeof Snd!=='undefined'){ if(Snd.magic) Snd.magic(); else if(Snd.tone) Snd.tone(220,0.5,'sine',0.05,90); }
}

/* ---------- drill lifecycle ---------- */
function announceLesson(){
  var D=P.knightDrill; if(!D) return;
  var L=LESSONS[D.lesson]; if(!L) return;
  toastMsg(L.hint(), 6000);
}
function beginKnightDrill(){
  if(!ready()) return;
  clearKnightArena();   // sweep any wandered foes/clutter before the lesson starts
  P.knightDrill = { lesson:0, t0:now(), lockT:1.3, guardT:0,
                    _prevAtk:0, _prevRoll:0, _lastAtk:-99, _dashStarted:false, dashTimes:[] };
  // top the tank so the chain/guard lessons never stall on an empty bar
  P.stamMax = P.stamMax || (window.COMBO && window.COMBO.cfg ? window.COMBO.cfg.stamMax : 100);
  P.stam = P.stamMax;
  if(typeof banner==='function') banner('THE FLOW OF BLADES', 'Three lessons - watch, and do');
  // let the banner read first, then the first instruction eases in (no detection until lockT clears)
  setTimeout(function(){ if(P.knightDrill && P.knightDrill.lesson===0) announceLesson(); }, 1000);
}
// re-state the current lesson (the dialogue "I'm ready" hook)
function knightDrillNudge(){ if(P.knightDrill) announceLesson(); }

function finishKnightDrill(){
  if(!ready()) return;
  P.knightDrill = null;
  P.unlocked = P.unlocked || {};
  P.unlocked.combos = true;     // <-- this is what graduates the prototype for real players
  P.story = P.story || {}; P.story.flowLearned = 1;
  if(typeof G!=='undefined'){ G.slowmo=Math.max(G.slowmo||0,0.4); if(P) { } }
  if(typeof banner==='function') banner('THE FLOW IS YOURS', 'Move like water');
  if(typeof Snd!=='undefined' && Snd.levelup) Snd.levelup();
  if(typeof burst==='function' && ready()) burst(P.x, P.y-0.6, '#bfe0ff', 26, 3.2);
  // the lesson, distilled - a click-through card so the controls can't be missed
  var msg = '<b style="color:#bcd8ee">The Drowned Knight\'s lesson is yours.</b><br><br>'+
    'A new <b style="color:#8fe8cf">stamina</b> gauge sits under your health - the fuel for the flow. Ordinary fighting never touches it; only the <i>advanced</i> moves do, and it refills fast when you let it.<br><br>'+
    '• <b>Cancel</b> - '+(isTouchDev()?'attack, then dash':'attack, then dash (Ctrl / L)')+' to break a swing\'s recovery.<br>'+
    '• <b>Chain</b> - dash again mid-cooldown to keep moving (costs stamina).<br>'+
    '• <b>Re-strike</b> - '+(isTouchDev()?'tap attack again quickly':'tap attack again faster than the rhythm')+' to cut your recovery short (costs stamina).<br>'+
    '• <b>Parry</b> - '+(isTouchDev()?'time the <b>◆</b> button':'press <b>O</b> (or time a strike)')+' to an incoming blow to <b>turn it aside</b>, and it <b>refunds stamina</b>.<br>'+
    '• A <b>perfect dodge</b> refunds stamina too - reading a blow pays for your next flourish.';
  var showCard = function(){ if(typeof storyCard==='function') storyCard(msg,{label:'Move like water'}); else toastMsg(msg, 9000); };
  // if the finish lands mid-dialogue, hold the card until it closes (mirrors unlockDash)
  if(typeof dlg!=='undefined' && dlg.open){ P._dashCardPending = showCard; } else showCard();
  if(typeof refreshUI==='function') refreshUI();
  if(typeof questReadySweep==='function') questReadySweep();
  if(typeof autoSave==='function') autoSave();
}

// The knight lobs a slow, readable practice strike (the same woodblock Rask pitches);
// timing a slash to it turns it via the game's shot-parry, which sets P.deflectT + marks
// the shot .parried - both of which the deflect lesson watches.
function throwKnightStrike(D){
  if(typeof G==='undefined' || !G.npcs || !ready()) return;
  var k=G.npcs.find(function(n){ return n.id==='knight'; }); if(!k) return;
  var dx=P.x-k.x, dy=(P.y-0.3)-(k.y-0.3), l=Math.hypot(dx,dy)||1;
  var sp=4.6;   // a gentle lob, visible its whole flight so the timing reads fair
  var pr={ x:k.x, y:k.y-0.3, vx:dx/l*sp, vy:dy/l*sp, life:l/sp+1.2,
           kind:'woodblock', from:'knight', owner:k, dmg:1, skill:'melee' };
  G.projs.push(pr); D.proj=pr;
  k.swing=0.3; k.face={x:dx/l, y:dy/l};
  if(typeof Snd!=='undefined' && Snd.tone) Snd.tone(300,0.06,'square',0.03,150);
}

function updateKnightDrill(dt){
  if(!ready() || !P.knightDrill) return;
  var D=P.knightDrill;
  // bail gracefully if the run ends underfoot (death / leaving the world)
  if(P.dead){ return; }
  // --- edge-detect the player's actions this frame ---
  var atk=(P.atkCd||0);
  if(atk > (D._prevAtk||0) + 0.1) D._lastAtk = now();   // atkCd jumped up = a fresh swing
  D._prevAtk = atk;
  var roll=(P.rollT||0);
  D._dashStarted = (roll>0 && (D._prevRoll||0)<=0);      // dash just began this frame
  D._prevRoll = roll;
  if(D._dashStarted){ D.dashTimes.push(now()); if(D.dashTimes.length>6) D.dashTimes.shift(); }
  // brief lock after a banner/lesson change so detection doesn't fire on stale input
  if(D.lockT>0){ D.lockT-=dt; if(D.guardT) D.guardT=0; return; }
  var L=LESSONS[D.lesson]; if(!L) { finishKnightDrill(); return; }
  // the DEFLECT lesson is hands-on: the knight lobs a slow practice strike and you time a
  // slash to turn it (the same shot-parry as Rask's billet). Run the throw cycle here.
  if(L.key==='deflect' && !D._deflected){
    D.throwT = (D.throwT==null? 0.5 : D.throwT) - dt;
    var pr=D.proj;
    if(pr && pr.parried){ D._deflected=true; }
    else if(pr && pr.life<=0){                       // it got past the guard (a 1hp tap) or fell short
      D.proj=null; D.throwT=0.9;
      if(typeof addFloat==='function') addFloat('watch it in - swing as it reaches you', P.x, P.y-2.3, '#ffd0a0', 1.05);
    } else if(!pr && D.throwT<=0){
      throwKnightStrike(D);
    }
  }
  if(L.check(D, dt)){
    // lesson cleared
    if(typeof addFloat==='function') addFloat(L.title+'  ✓', P.x, P.y-2.6, '#bfe0ff', 1.5);
    if(typeof G!=='undefined'){ G.hitStop=Math.max(G.hitStop||0,0.08); }
    if(typeof Snd!=='undefined' && Snd.crit) Snd.crit();
    toastMsg('<b style="color:#bcd8ee">'+L.done+'</b>', 2200);
    D.lesson++;
    // reset per-lesson accumulators so the next lesson starts clean; the lock covers the
    // hand-off so the praise line reads before the next instruction eases in.
    D.guardT=0; D.dashTimes.length=0; D._lastAtk=-99; D.lockT=1.4;
    D.proj=null; D._deflected=false; D.throwT=null;   // fresh state for the deflect cycle
    if(D.lesson >= LESSONS.length){ finishKnightDrill(); return; }
    // the praise line lingers, then the next lesson's instruction eases in after it
    (function(nextIdx){ setTimeout(function(){ if(P.knightDrill && P.knightDrill.lesson===nextIdx) announceLesson(); }, 1250); })(D.lesson);
  }
}

/* ---------- hook the per-frame update (composes after 49's wrapper) ---------- */
if(typeof window.updatePlayer==='function'){
  var _updatePlayerK = window.updatePlayer;
  window.updatePlayer = function(dt){
    var r = _updatePlayerK.apply(this, arguments);
    try{ updateKnightDrill(dt||0); }catch(e){}
    return r;
  };
}

/* ---------- exports (dialogue in 06-dialog.js calls these) ---------- */
window.beginKnightDrill = beginKnightDrill;
window.knightDrillNudge = knightDrillNudge;
window.knightRevealFx   = knightRevealFx;
window.finishKnightDrill = finishKnightDrill;   // (dev/testing convenience)
window.updateKnightDrill = updateKnightDrill;   // (dev/testing convenience)
window.clearKnightArena = clearKnightArena;

})();
