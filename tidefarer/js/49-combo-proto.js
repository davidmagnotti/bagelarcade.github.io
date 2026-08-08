/* ============================================================================
   COMBO PROTOTYPE  (dev-flagged, experimental)   -   js/49-combo-proto.js
   ----------------------------------------------------------------------------
   A sandbox for the stamina / animation-cancel / shield-block combat layer.
   It is OFF by default and gated on window.COMBO.on - flip it in the DEV menu
   ("Combo prototype" section) or set localStorage tf_combo=1. With the flag
   off, this file installs its wrappers but every one of them no-ops straight
   through to the original, so the shipping game plays EXACTLY as before.

   DESIGN (locked with David):
     - STAMINA is the fuel for the ADVANCED layer only. Basic play never touches
       it: normal-cadence swings, your FIRST dodge dash, movement and the timing
       PARRY are all free. Stamina is spent by three things and nothing else -
         1. cancelling attack recovery to re-swing FASTER than the natural rhythm
         2. CHAINING dashes (the 2nd, 3rd, ... roll back-to-back)
         3. HOLDING the shield block
     - RIPOSTE / DEFLECT refill it: a perfect dodge (P.empower) and a timed DEFLECT
       (a turned blow - the core sets P.deflectT) each hand back a chunk, so reading
       a blow pays for the next flourish.
     - NO hard exhaustion. At empty the advanced options simply wink out until it
       recharges; you never get stun-locked for spending it. This is an
       exploration RPG, not a soulslike.
     - DEFLECT is a TIMED slash (the game's own parry, elevated into the flow) - not a
       held shield. Time your strike to an incoming blow and it turns aside with a
       distinct blade-catch animation (drawn in 10-rendering) and a stamina refund.
       There is no shield item and no hold-block.

   Everything below is monkey-patched onto the globals so the core files
   (07-input, 08-ui-panels, 09-gameplay, 12-world-layer) stay untouched.
   ============================================================================ */
(function(){
  'use strict';

  /* ---- tunables: the whole feel lives here, one place to dial it in ---- */
  var CFGP = {
    stamMax:      100,
    regenDelay:   0.7,    // seconds of NOT spending before stamina starts coming back
    regenRate:    45,     // stamina per second once regen kicks in
    atkCancel:  { window: 0.36, cost: 14 },   // re-swing anywhere in the recovery (a forgiving cancel window)
    dashChain:  { cost: 14 },                 // stamina per chained (2nd+) dash - kept cheap so combos flow
    airSlash:   { cost: 18 },                 // stamina per Air Slash (the ranged crescent, see 09-gameplay tryAirSlash)
    riposteRefund: 60,    // stamina handed back on a perfect-dodge riposte
    deflectRefund: 45,    // stamina handed back on a timed DEFLECT (a turned blow)
  };

  window.COMBO = window.COMBO || { on:false };
  window.COMBO.cfg = CFGP;
  try{ if(typeof SafeStore!=='undefined' && SafeStore.get('tf_combo')==='1') window.COMBO.on = true; }catch(e){}

  // The advanced layer is live when: the dev flag forces it on, OR the player has
  // earned it from the ancient knight (P.unlocked.combos), OR they're mid-drill with
  // him (P.knightDrill) - the drill enables the moves before they're formally learned,
  // the same way Rask's parry drill does.
  var ON = function(){
    return !!( (window.COMBO && window.COMBO.on) ||
               (typeof P!=='undefined' && P && ((P.unlocked && P.unlocked.combos) || P.knightDrill)) );
  };
  /* ---- stamina state (lazy-attached to the player) ---- */
  function ready(){ return (typeof P!=='undefined') && P; }
  function ensureStam(){
    if(!ready()) return false;
    if(P.stamMax==null){ P.stamMax=CFGP.stamMax; P.stam=CFGP.stamMax; P.stamRegenT=0; }
    return true;
  }
  function stamHas(n){ return (P.stam||0) >= n; }
  // Orin's Vigor Draught (P.superStamT>0): stamina drains HALF as fast, so it lasts twice as
  // long. We keep the gate costs (stamHas) at face value - the draught stretches the tank,
  // it doesn't let you act on fumes - but the actual deduction is halved while it holds.
  function spend(n){ if((P.superStamT||0)>0) n*=0.5; P.stam=Math.max(0,(P.stam||0)-n); P.stamRegenT=CFGP.regenDelay; }
  function refund(n){ P.stam=Math.min(P.stamMax||CFGP.stamMax,(P.stam||0)+n); }

  /* ---- little feedback helpers (reuse the game's own juice) ---- */
  function fx_cancel(){
    if(typeof burst==='function') burst(P.x, P.y-0.5, '#ffe0a0', 6, 2.2);
    if(typeof Snd!=='undefined' && Snd.tone) Snd.tone(680,0.05,'square',0.025,220);
  }
  function fx_riposte(){
    if(typeof addFloat==='function') addFloat('+VIGOR', P.x, P.y-3.0, '#7fe0c0', 1.15);
  }

  /* ============================ HUD: stamina bar ============================ */
  var stamBar=null, stamFill=null;
  function buildStamBar(){
    if(stamBar) return;
    var hpFill=document.getElementById('hpFill');
    if(!hpFill) return;
    var hpBar=hpFill.closest ? hpFill.closest('.bar') : hpFill.parentNode;
    if(!hpBar || !hpBar.parentNode) return;
    stamBar=document.createElement('div');
    stamBar.className='bar';
    stamBar.id='stamBar';
    stamBar.style.cssText='height:11px;margin-top:5px;';
    stamFill=document.createElement('div');
    stamFill.className='fill';
    stamFill.id='stamFill';
    stamFill.style.cssText='width:100%;background:linear-gradient(180deg,#8fe8cf,#2f9e86);transition:width .08s;';
    stamBar.appendChild(stamFill);
    hpBar.parentNode.insertBefore(stamBar, hpBar.nextSibling);
  }
  function syncStamBar(){
    var show = ON() && ready() && (P.unlocked && (P.unlocked.melee||P.unlocked.dash)) &&
               typeof G!=='undefined' && G.state==='play';
    if(!stamBar){ if(show) buildStamBar(); }
    if(!stamBar) return;
    stamBar.style.display = show ? '' : 'none';
    if(!show) return;
    ensureStam();
    var f=Math.max(0,Math.min(1,(P.stam||0)/(P.stamMax||CFGP.stamMax)));
    stamFill.style.width=(f*100)+'%';
    // gold while Orin's Vigor Draught holds; spent-red when too low for a cancel; teal otherwise
    if((P.superStamT||0)>0) stamFill.style.background='linear-gradient(180deg,#ffe6a0,#e0a63a)';
    else if((P.stam||0)<CFGP.atkCancel.cost) stamFill.style.background='linear-gradient(180deg,#e8b98f,#b8683a)';
    else stamFill.style.background='linear-gradient(180deg,#8fe8cf,#2f9e86)';
  }

  /* ===================== per-frame: regen + deflect payoff + HUD ===================== */
  function comboTick(dt){
    if(!ON() || !ensureStam()) { syncStamBar(); return; }

    // --- DEFLECT payoff: a timed slash that turns a blow (the game's parry, elevated
    // into the flow) hands stamina back, so a good read fuels your next flourish. The
    // core sets P.deflectT>0 the instant a blow is turned (melee or a batted shot); we
    // catch the rising edge here so both paths pay out exactly once. ---
    var dnow = P.deflectT||0;
    if(dnow > (P._deflectPrev||0) + 0.001 && dnow > 0.3){ refund(CFGP.deflectRefund); fx_riposte(); }
    P._deflectPrev = dnow;

    // --- passive regen after the no-spend delay ---
    P.stamRegenT=Math.max(0,(P.stamRegenT||0)-dt);
    if(P.stamRegenT<=0 && (P.stam||0)<P.stamMax){
      P.stam=Math.min(P.stamMax,(P.stam||0)+CFGP.regenRate*dt);
    }

    // remember whether the attack button was held THIS frame, so the attack-cancel
    // can fire only on a fresh re-press next frame (holding = free natural cadence,
    // a deliberate re-tap during recovery = a stamina-costing combo cancel).
    P._atkDownPrev = !!(typeof input!=='undefined' && input && (input.attack || input.mouseDown));
    P._dashKeyPrev = !!(typeof keys!=='undefined' && (keys['control'] || keys['l']));

    syncStamBar();
  }

  /* ============================ wrappers ============================ */
  // updatePlayer(dt): drive the per-frame combo tick right after the real update.
  if(typeof window.updatePlayer==='function'){
    var _updatePlayer=window.updatePlayer;
    window.updatePlayer=function(dt){
      var r=_updatePlayer.apply(this,arguments);
      try{ comboTick(dt||0); }catch(e){}
      return r;
    };
  }

  // tryAttack: cancel the recovery TAIL to re-swing faster, at a stamina cost.
  // Fires ONLY on a fresh re-press (not while the button is held - see _atkDownPrev),
  // only when a foe is in reach (no bleeding stamina at the air), and only in the
  // last `window` of recovery. So holding attack keeps the free natural cadence, and
  // it's a deliberate faster-than-rhythm re-tap that spends stamina to compress the combo.
  if(typeof window.tryAttack==='function'){
    var _tryAttack=window.tryAttack;
    window.tryAttack=function(useMouse){
      var downNow = !!(typeof input!=='undefined' && input && (input.attack || input.mouseDown));
      var freshPress = downNow && !(ready() && P._atkDownPrev);
      if(ON() && ensureStam() && freshPress && P.weapon==='melee' &&
         (P.atkCd||0)>0 && (P.atkCd||0)<=CFGP.atkCancel.window &&
         typeof G!=='undefined' && G.state==='play' &&
         !(typeof dlg!=='undefined' && dlg.open) && !G.interior &&
         !(P.stunT>0) && !P.dead && !P.riding){
        var mobNear = typeof G!=='undefined' && G.mobs && G.mobs.some(function(m){
          return !m.dead && !m.sealed && typeof dist==='function' && dist(P.x,P.y,m.x,m.y)<2.2; });
        if(mobNear && stamHas(CFGP.atkCancel.cost)){
          spend(CFGP.atkCancel.cost);
          P.atkCd=0;          // clear the tail so the real swing fires now
          fx_cancel();
          if(typeof G!=='undefined') P._evCancel=G.time;   // drill marker
        }
      }
      return _tryAttack.apply(this,arguments);
    };
  }

  // tryRoll: CANCEL an attack by dashing out of its recovery, spending stamina to
  // chain the dash even while the roll is still on cooldown (present it to the
  // original as a fresh, free dash). This ONLY costs stamina when it's a genuine
  // dash-CANCEL - you dash while still in a swing's recovery (P.atkCd>0). Plain
  // repeated dashing with nothing to cancel never touches stamina: it just falls
  // through to the stock dash, which respects its own cooldown for free. The dash
  // key is polled every frame while held, so we chain only on a fresh press, never
  // while Ctrl/L is held down (touch taps are already discrete). Also catch the
  // perfect-dodge riposte and refund stamina for the read.
  if(typeof window.tryRoll==='function'){
    var _tryRoll=window.tryRoll;
    window.tryRoll=function(){
      var dashKeyNow = (typeof keys!=='undefined') && (keys['control'] || keys['l']);
      var heldSpam = dashKeyNow && ready() && P._dashKeyPrev;   // key held from a prior frame
      var cancelling = ready() && (P.atkCd||0)>0 && P.weapon==='melee';   // dashing out of a swing = a real cancel
      if(ON() && ensureStam() && !heldSpam && cancelling && P.unlocked && P.unlocked.dash &&
         (P.rollT||0)<=0 && (P.rollCd||0)>0 && stamHas(CFGP.dashChain.cost)){
        spend(CFGP.dashChain.cost);
        P.rollCd=0; P.dashChain=0;   // hand the original a clean, chargeable dash
        if(typeof G!=='undefined') P._evChain=G.time;   // drill marker
        P._evDashCancel=(typeof G!=='undefined')?G.time:0;   // UI: flash dodge btn green-available
      }
      var beforeEmp = (ready() && P.empowerT) || 0;
      var rollBefore = (ready() && P.rollT) || 0;
      var r=_tryRoll.apply(this,arguments);
      // A dash CANCELS the tail of a swing: the instant you dash, clear the attack recovery so
      // you can strike straight back out of the dash (attack->dash->attack flows freely). Only
      // when the dash actually fired, and only with the flow learned.
      if(ON() && ready() && (P.rollT||0) > rollBefore){ P.atkCd=0; }
      if(ON() && ensureStam() && (P.empowerT||0) > beforeEmp){ refund(CFGP.riposteRefund); fx_riposte(); }
      return r;
    };
  }


  /* ============================ dev menu section ============================ */
  function toggleCombo(b){
    window.COMBO.on = !window.COMBO.on;
    try{ if(typeof SafeStore!=='undefined') SafeStore.set('tf_combo', window.COMBO.on?'1':'0'); }catch(e){}
    if(window.COMBO.on){ ensureStam(); }
    if(b) b.textContent='Combo system: '+(window.COMBO.on?'ON':'off');
    syncStamBar();
    if(typeof note==='function') note('Combo prototype '+(window.COMBO.on?'ON - stamina, cancels & parry live':'off'));
  }
  window.toggleCombo=toggleCombo;

  // Register through the DEV menu's public hook (its SECTIONS array is private to
  // that file's IIFE). The hook rebuilds the panel if it's already open.
  if(typeof window.devRegisterSection==='function'){
    window.devRegisterSection(['Combo prototype (experimental)', [
      ['Combo system: '+(window.COMBO.on?'ON':'off'), function(b){ toggleCombo(b); }],
      ['Learn the flow (knight unlock)', function(){
        if(!ready()) return;
        P.unlocked=P.unlocked||{}; P.unlocked.combos=true;
        P.unlocked.melee=true; P.swordTier=Math.max(P.swordTier||0,1);
        P.story=P.story||{}; P.story.flowLearned=1;
        if(typeof buildHotbar==='function') buildHotbar();
        if(typeof note==='function') note('The flow learned (stamina, cancels, chain & parry)');
      }],
      ['Refill stamina', function(){ if(ensureStam()){ P.stam=P.stamMax; if(typeof note==='function') note('Stamina refilled'); } }],
    ]]);
  }
})();
