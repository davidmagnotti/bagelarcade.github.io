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
     - RIPOSTE refills it: a perfect dodge (the existing P.empower reward) hands
       back a big chunk, so reading a blow pays for the next flourish.
     - NO hard exhaustion. At empty the advanced options simply wink out until it
       recharges; you never get stun-locked for spending it. This is an
       exploration RPG, not a soulslike.
     - SHIELD is a hold-block, a SEPARATE tool from the timing-parry (which stays
       exactly as it is). Bram already hands you the sword; the shield rides along
       (P.unlocked.melee => P.unlocked.shield while the prototype is on).

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
    atkCancel:  { window: 0.22, cost: 20 },   // re-swing once recovery has <= window left
    dashChain:  { cost: 25 },                 // stamina per chained (2nd+) dash
    block:      { drain: 30, hitCost: 15, reduce: 0.6 },  // /s held, per blocked hit, dmg cut
    riposteRefund: 60,    // stamina handed back on a perfect-dodge riposte
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
  // Is the shield available to raise? Once learned, or on loan during the knight's drill.
  var shieldReady = function(){
    return !!(ready() && ((P.unlocked && P.unlocked.shield) || P.knightDrill));
  };

  /* ---- stamina state (lazy-attached to the player) ---- */
  function ready(){ return (typeof P!=='undefined') && P; }
  function ensureStam(){
    if(!ready()) return false;
    if(P.stamMax==null){ P.stamMax=CFGP.stamMax; P.stam=CFGP.stamMax; P.stamRegenT=0; }
    return true;
  }
  function stamHas(n){ return (P.stam||0) >= n; }
  function spend(n){ P.stam=Math.max(0,(P.stam||0)-n); P.stamRegenT=CFGP.regenDelay; }
  function refund(n){ P.stam=Math.min(P.stamMax||CFGP.stamMax,(P.stam||0)+n); }

  /* ---- little feedback helpers (reuse the game's own juice) ---- */
  function fx_cancel(){
    if(typeof burst==='function') burst(P.x, P.y-0.5, '#ffe0a0', 6, 2.2);
    if(typeof Snd!=='undefined' && Snd.tone) Snd.tone(680,0.05,'square',0.025,220);
  }
  function fx_riposte(){
    if(typeof addFloat==='function') addFloat('+VIGOR', P.x, P.y-3.0, '#7fe0c0', 1.15);
  }
  function fx_block(sx,sy){
    var mx=(P.x+(sx==null?P.x:sx))/2, my=(P.y+(sy==null?P.y:sy))/2;
    if(typeof addFloat==='function') addFloat('BLOCK', P.x, P.y-2.0, '#bfd8ff', 1.15);
    if(typeof burst==='function') burst(mx, my-0.3, '#cfe2ff', 10, 2.4);
    if(typeof G!=='undefined'){ G.shake=Math.max(G.shake||0,0.14); G.hitStop=Math.max(G.hitStop||0,0.04); }
    if(typeof buzz==='function') buzz(12);
    if(typeof Snd!=='undefined' && Snd.tone) Snd.tone(300,0.06,'triangle',0.03,120);
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
    // guard tint while blocking, spent-red flash when empty, teal otherwise
    if(P.blocking) stamFill.style.background='linear-gradient(180deg,#bfd8ff,#5f8fd8)';
    else if((P.stam||0)<CFGP.atkCancel.cost) stamFill.style.background='linear-gradient(180deg,#e8b98f,#b8683a)';
    else stamFill.style.background='linear-gradient(180deg,#8fe8cf,#2f9e86)';
  }

  /* ========================= touch: shield button ========================= */
  var blockBtn=null;
  function buildBlockBtn(){
    if(blockBtn || typeof isTouch==='undefined' || !isTouch) return;
    var act=document.getElementById('actBtns'); if(!act) return;
    blockBtn=document.createElement('div');
    blockBtn.className='abtn small';
    blockBtn.id='blockBtn';
    blockBtn.textContent='🛡';
    blockBtn.style.background='radial-gradient(circle at 38% 32%, rgba(150,180,235,.75), rgba(60,90,150,.6))';
    // order: Talk / shield / dash / sword  -> sit the shield just above the dash button
    var dodge=document.getElementById('dodgeBtn');
    if(dodge) act.insertBefore(blockBtn, dodge); else act.appendChild(blockBtn);
    var set=function(v){ return function(e){ if(input) input.blockHeld=v; if(e&&e.preventDefault) e.preventDefault(); }; };
    if(window.PointerEvent){
      blockBtn.addEventListener('pointerdown', set(true));
      blockBtn.addEventListener('pointerup', set(false));
      blockBtn.addEventListener('pointercancel', set(false));
      blockBtn.addEventListener('pointerleave', set(false));
    } else {
      blockBtn.addEventListener('touchstart', set(true));
      blockBtn.addEventListener('touchend', set(false));
      blockBtn.addEventListener('touchcancel', set(false));
    }
  }
  function syncBlockBtn(){
    if(typeof isTouch==='undefined' || !isTouch) return;
    if(!blockBtn) buildBlockBtn();
    if(!blockBtn) return;
    var show = ON() && ready() && shieldReady() &&
               !(typeof G!=='undefined' && G.interior);
    blockBtn.style.display = show ? '' : 'none';
    if(show){
      var ok = stamHas(1);
      blockBtn.classList.toggle('cooldown', !ok);
      blockBtn.style.outline = P.blocking ? '3px solid rgba(190,216,255,.9)' : 'none';
    }
  }

  /* ===================== per-frame: regen + block + HUD ===================== */
  function comboTick(dt){
    if(!ON() || !ensureStam()) { if(ready()) P.blocking=false; syncStamBar(); syncBlockBtn(); return; }

    // --- block: hold to guard, drains stamina, drops when spent or when busy ---
    var kbHold = (typeof keys!=='undefined') && (keys['shift'] || keys['k']);
    var want = ((input && input.blockHeld) || kbHold) &&
               shieldReady() && stamHas(1) &&
               typeof G!=='undefined' && G.state==='play' &&
               !(typeof dlg!=='undefined' && dlg.open) && !G.interior &&
               !P.dead && (P.rollT||0)<=0 && (P.stunT||0)<=0;
    P.blocking = !!want;
    if(want){ P.stam=Math.max(0,(P.stam||0)-CFGP.block.drain*dt); P.stamRegenT=CFGP.regenDelay; }

    // --- passive regen after the no-spend delay (never while actively guarding) ---
    P.stamRegenT=Math.max(0,(P.stamRegenT||0)-dt);
    if(!P.blocking && P.stamRegenT<=0 && (P.stam||0)<P.stamMax){
      P.stam=Math.min(P.stamMax,(P.stam||0)+CFGP.regenRate*dt);
    }

    // remember whether the attack button was held THIS frame, so the attack-cancel
    // can fire only on a fresh re-press next frame (holding = free natural cadence,
    // a deliberate re-tap during recovery = a stamina-costing combo cancel).
    P._atkDownPrev = !!(typeof input!=='undefined' && input && (input.attack || input.mouseDown));
    P._dashKeyPrev = !!(typeof keys!=='undefined' && (keys['control'] || keys['l']));

    syncStamBar();
    syncBlockBtn();
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

  // tryRoll: CHAIN a dash mid-cooldown by spending stamina (present it to the
  // original as a fresh, free dash). A FIRST dash off cooldown is free - only a
  // chained dash (dashing again before the cooldown clears) costs stamina. The
  // dash key is polled every frame while held, so we chain only on a fresh press,
  // never while Ctrl/L is held down (touch taps are already discrete). Without
  // stamina it falls through to the stock behaviour (single dash, or dash2's one
  // chain). Also catch the perfect-dodge riposte and refund stamina for the read.
  if(typeof window.tryRoll==='function'){
    var _tryRoll=window.tryRoll;
    window.tryRoll=function(){
      var dashKeyNow = (typeof keys!=='undefined') && (keys['control'] || keys['l']);
      var heldSpam = dashKeyNow && ready() && P._dashKeyPrev;   // key held from a prior frame
      if(ON() && ensureStam() && !heldSpam && P.unlocked && P.unlocked.dash &&
         (P.rollT||0)<=0 && (P.rollCd||0)>0 && stamHas(CFGP.dashChain.cost)){
        spend(CFGP.dashChain.cost);
        P.rollCd=0; P.dashChain=0;   // hand the original a clean, chargeable dash
        if(typeof G!=='undefined') P._evChain=G.time;   // drill marker
      }
      var beforeEmp = (ready() && P.empowerT) || 0;
      var r=_tryRoll.apply(this,arguments);
      if(ON() && ensureStam() && (P.empowerT||0) > beforeEmp){ refund(CFGP.riposteRefund); fx_riposte(); }
      return r;
    };
  }

  // hurtPlayer: a raised shield chips a frontal blow. Parry (checked first inside
  // the original) still wins outright; block is the fallback that softens what a
  // parry didn't catch. Hazards/back-hits (no frontal source) cut straight through.
  if(typeof window.hurtPlayer==='function'){
    var _hurtPlayer=window.hurtPlayer;
    window.hurtPlayer=function(dmg,src){
      if(ON() && ready() && P.blocking && (P.rollT||0)<=0 && P.hurtT<=0 &&
         src && src.x!=null && typeof parryCovers==='function' && parryCovers(src.x,src.y) &&
         !(( P.parryT||0)>0) && ensureStam() && stamHas(CFGP.block.hitCost)){
        spend(CFGP.block.hitCost);
        dmg = Math.max(1, dmg*(1-CFGP.block.reduce));
        fx_block(src.x, src.y);
        if(typeof G!=='undefined') P._evBlock=G.time;   // drill marker
      }
      return _hurtPlayer.call(this, dmg, src);
    };
  }

  /* ============================ dev menu section ============================ */
  function toggleCombo(b){
    window.COMBO.on = !window.COMBO.on;
    try{ if(typeof SafeStore!=='undefined') SafeStore.set('tf_combo', window.COMBO.on?'1':'0'); }catch(e){}
    if(window.COMBO.on){ ensureStam(); }
    if(b) b.textContent='Combo system: '+(window.COMBO.on?'ON':'off');
    syncStamBar(); syncBlockBtn();
    if(typeof note==='function') note('Combo prototype '+(window.COMBO.on?'ON - stamina, cancels & shield live':'off'));
  }
  window.toggleCombo=toggleCombo;

  // Register through the DEV menu's public hook (its SECTIONS array is private to
  // that file's IIFE). The hook rebuilds the panel if it's already open.
  if(typeof window.devRegisterSection==='function'){
    window.devRegisterSection(['Combo prototype (experimental)', [
      ['Combo system: '+(window.COMBO.on?'ON':'off'), function(b){ toggleCombo(b); }],
      ['Learn the flow (knight unlock)', function(){
        if(!ready()) return;
        P.unlocked=P.unlocked||{}; P.unlocked.combos=true; P.unlocked.shield=true;
        P.unlocked.melee=true; P.swordTier=Math.max(P.swordTier||0,1);
        P.story=P.story||{}; P.story.flowLearned=1;
        if(typeof buildHotbar==='function') buildHotbar();
        if(typeof note==='function') note('The flow learned (combos + shield, as from the knight)');
      }],
      ['Grant shield + sword', function(){
        if(!ready()) return;
        P.unlocked=P.unlocked||{}; P.unlocked.melee=true; P.unlocked.shield=true;
        P.swordTier=Math.max(P.swordTier||0,1);
        if(typeof buildHotbar==='function') buildHotbar();
        if(typeof note==='function') note('Shield + sword granted');
      }],
      ['Refill stamina', function(){ if(ensureStam()){ P.stam=P.stamMax; if(typeof note==='function') note('Stamina refilled'); } }],
    ]]);
  }
})();
