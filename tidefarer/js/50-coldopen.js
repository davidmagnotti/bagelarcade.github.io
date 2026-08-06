/* ============================================================================
   COLD OPEN  (prototype, flag-gated)   -   js/50-coldopen.js
   ----------------------------------------------------------------------------
   Replaces the passive shore CUTSCENE with a PLAYABLE, taught opening: the very
   first thing the player does is FIGHT. You are the princess (unmasked, royal
   garb) on the storm-lit deck of your ship. A brief prompt teaches the combat
   (chain strikes into a finisher, dash, parry); you PRACTISE on a few small
   violet wisps; then a huge purple spirit heaves up out of the black water and
   you cannot best it. It cannot take your life - the royal blood forbids it -
   so it takes something else: your memory. You wash ashore a masked, amnesiac
   castaway who still carries a warrior's sword, and Elder Maren reads you for
   what you are.

   THE SEQUENCE
     1. Board the ship-deck world (a ship-shaped plank hull ringed by black sea).
     2. Intro card teaches "use your skills"; hands control to the fight.
     3. PRACTISE: cut down 3 small wisps with the real combat engine.
     4. The big spirit rises - invulnerable, unwinnable (a scripted loss).
     5. DEFEAT: "I cannot take you from this world... but I can take something else."
     6. The memory-theft wash -> you wake amnesiac on Emberwick's shore.

   DESIGN INTENT
     - The FIGHTING is the hook, and it is TAUGHT by doing, not by a slideshow.
     - The amnesia premise is weaponised and given a VILLAIN cause: the loss is
       the inciting crime, and it seeds the lore rule (the old blood cannot be
       killed by his magic - so he curses/takes instead).
     - You KEEP the sword ashore (Maren's "you carry a warrior's blade") but the
       curse strips the techniques (dash/parry) and memory - so you retrain with
       Rask (parry) and Orin (dash), and Bram now fits ARMOUR, not a first blade.

   SAFETY
     - OFF by default. Gated on window.COLDOPEN.on - flip it in the DEV menu
       ("Cold open (prototype)") or set localStorage tf_coldopen=1. With the flag
       off, the wrappers pass straight through and the shipping opening is EXACTLY
       as before (the shore cutscene).
     - Everything is monkey-patched onto the globals; the core files are
       untouched but for one small, coldOpen-gated line in startIntro (Maren).
   ============================================================================ */
(function(){
  'use strict';

  window.COLDOPEN = window.COLDOPEN || { on:false };
  try{ if(typeof SafeStore!=='undefined' && SafeStore.get('tf_coldopen')==='1') window.COLDOPEN.on = true; }catch(e){}
  var CO = window.COLDOPEN;
  var ON = function(){ return !!(CO && CO.on); };

  var CLAMP_MIN = 20;   // during the cold open the player never dies - the loss is scripted
  var WISPS = 3;        // small spirits to practise on before the big one

  /* ---- the deck: a bespoke world - a ship-shaped plank hull (pointed bow to
     the north) ringed by black sea. The surrounding DEEP water is non-walkable
     (walkTile), so it fences the arena on its own. -------------------------- */
  function genDeck(){
    var W=MAPW, H=MAPH, cx=W/2, cy=H/2, rx=13, ry=18;
    for(var y=0;y<H;y++){
      var dyn=(y+0.5-cy)/ry;
      var base=(Math.abs(dyn)<=1)? Math.sqrt(1-dyn*dyn)*rx : -1;
      // narrow the forward half into a prow so it reads as a ship, not a raft
      var taper=(y+0.5<cy)? (1-Math.pow((cy-(y+0.5))/cy,1.5)*0.5) : 1;
      var hw=base*taper, hws=(base>=0? (base+1.7)*taper : -1);
      for(var x=0;x<W;x++){
        var ddx=Math.abs(x+0.5-cx);
        if(base>=0 && ddx<=hw) G.map[y*W+x]=T.PLANK;
        else if(base>=0 && ddx<=hws) G.map[y*W+x]=T.SHALLOW;   // a soft shallows collar
        else G.map[y*W+x]=T.DEEP;
      }
    }
  }
  if(typeof WORLD_DEFS!=='undefined' && !WORLD_DEFS.deck){
    WORLD_DEFS.deck = {
      W:44, H:50, seed:12207,
      zones:{ deck:{x:22, y:25, r:16, name:'The Deck'} },
      spawn:{x:22.5, y:36.5},
      title:'THE NIGHT STRAIT', sub:'A STORM WITH NO MERCY',
      gen: genDeck
    };
  }

  /* ---- small practice spirit: a weak, friendly-to-fight violet wisp. -------- */
  function spawnWisp(x,y){
    var m = (typeof spawnMob==='function') ? spawnMob('wraith', x, y, false) : null;
    if(!m) return null;
    m.hp = m.maxhp = 16;                 // ~2 hits
    m.dmg = 4;                           // barely stings
    m.speed = Math.min(m.speed||4, 2.4); // slow enough to read
    m.aggro = 22;
    m.name = 'A Wisp of the Dark';
    m.coldWisp = 1;
    return m;
  }

  /* ---- the big spirit: invulnerable, unwinnable - the scripted defeat. ------ */
  function spawnColdBoss(){
    var m = (typeof spawnMob==='function') ? spawnMob('wraith', 22, 24, false) : null;
    if(!m) return null;
    m.hp = m.maxhp = 999;
    m.dmg = 10; m.speed = Math.min(m.speed||4, 2.8); m.aggro = 30;
    m.r = 0.9;
    m.boss = true; m.bigBoss = true;
    m.name = 'The Drowning Dark';
    m.title = 'THE DROWNING DARK';
    m.subtitle = 'IT RISES TO MEET YOU';
    m.coldBoss = 1;
    return m;
  }

  /* ---- boot the board: princess kit, deck world, teaching card -> practice. - */
  function coldOpenBoard(){
    if(typeof switchWorld!=='function'){ bailToShore(); return; }
    // the princess, as she was: unmasked, royal garb, and a trained warrior
    P.story = P.story || {};
    P.story.masked = 0; P.story.royalGarb = 1; P.story.necklace = true; P.story.coldOpen = 1;
    P.unlocked = P.unlocked || {};
    P.unlocked.melee = true; P.unlocked.dash = true; P.unlocked.parry = true;
    P.weapon = 'melee'; P.swordTier = Math.max(P.swordTier||0, 1);
    P.hp = P.maxhp;
    CO.phase = 'intro'; CO.wispsLeft = WISPS; CO.bossT = 0; CO.bossHits = 0; CO._done = false;

    // Bram now fits ARMOUR, not a first blade (you kept the sword through the wreck).
    if(typeof QUESTS!=='undefined' && QUESTS.kit && !QUESTS.kit._coArmor){
      var k = QUESTS.kit; k._coArmor = 1;
      k.rw = { armor:1, gold:5, xp:{ melee:60 } };
      k.brief = 'That\'s a warrior\'s blade you carry - but you\'ll not last a week on this isle in wet rags. Take my axe and pick off the rack: fell a tree for wood, break a rock for stone, and bring them back. I\'ll hammer you out armour worthy of that steel.';
      k.log = 'Chop a tree for 1 wood and mine a rock for 1 stone with Bram\'s tools, then return to Bram for armour.';
      k.doneText = 'Good hands - and now good plate to keep them swinging. *CLANG* - fitted and buckled. A blade\'s only half of it, though: go east, past the meadow, and find old Rask. He\'ll teach you to TURN a strike aside - the thing that keeps you breathing when they come at you two and three at once. Then Maren will have work worthy of you.';
    }

    switchWorld('deck');
    if(typeof banner==='function') banner('THE NIGHT STRAIT', 'A STORM WITH NO MERCY');

    if(typeof storyCard==='function'){
      storyCard('<i>Rain on black water, and a storm with no mercy in it. Your ship pitches under you - and the dark is climbing the rails: wisps of cold violet light, wrong and reaching.</i><br><br>You are of the royal blood, a warrior trained since you could stand - your body knows this. <b>Cut them down:</b> keep your strikes flowing to break into a heavier <b>finisher</b>, <b>dash</b> clear of their lunges, and time a swing into a blow to <b>parry</b> it.',
        { label:'Draw steel', onOk:startPractice });
    } else { startPractice(); }
  }

  function startPractice(){
    CO.phase = 'practice'; CO.wispsLeft = WISPS;
    spawnWisp(18,30); spawnWisp(26,30); spawnWisp(22,27);
    if(typeof addFloat==='function') addFloat('USE YOUR SKILLS', P.x, P.y-3.0, '#c9b0ff', 1.2);
  }

  /* ---- practice cleared -> the big spirit rises. --------------------------- */
  function coldOpenBoss(){
    if(CO.phase==='defeat' || CO.phase==='done') return;
    if(typeof banner==='function') banner('THE DROWNING DARK', 'IT RISES TO MEET YOU');
    if(typeof storyCard==='function'){
      storyCard('<i>The wisps were only its fingers. The black water heaves - and the dark itself rises out of it, vast and cold and reaching, filling the deck between you and the sky.</i>',
        { label:'Stand and fight', onOk:beginBoss });
    } else { beginBoss(); }
  }
  function beginBoss(){
    CO.phase = 'boss'; CO.bossT = 0; CO.bossHits = 0;
    spawnColdBoss();
    if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
    if(typeof G!=='undefined'){ G.shake=0.9; G.slowmo=Math.max(G.slowmo||0,1.1); }
    // Resolve the unwinnable fight on a timer (reliable regardless of frame pacing).
    // Mashers trip it a touch earlier via the damageMob wrapper; this is the backstop.
    setTimeout(function(){ if(CO.phase==='boss') triggerDefeat(); }, 6000);
  }

  /* ---- the scripted defeat: it cannot kill you, so it takes your memory. ---- */
  function triggerDefeat(){
    if(CO.phase==='defeat' || CO.phase==='done') return;
    CO.phase = 'defeat';
    coldOpenDefeat();
  }
  function coldOpenDefeat(){
    // freeze the boss and stagger the hero for the beat
    try{ (G.mobs||[]).forEach(function(m){ if(m && m.coldBoss){ m.state='idle'; m.frozen=1; } }); }catch(e){}
    P.hurtT = 0.6;
    if(typeof G!=='undefined'){ G.shake=1.0; G.slowmo=Math.max(G.slowmo||0,1.3); }
    if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
    if(typeof storyCard==='function'){
      storyCard('<i>Your blade bites the dark and stops - it will not cut what has no flesh. Cold closes around you and lifts you off your feet. A voice comes, vast and unhurried:</i><br><br><b style="color:#c9a0ff">You are of the old blood, little tide. I cannot take you from this world - that door your line barred to me long ago.</b> <i>The grip tightens.</i> <b style="color:var(--ember)">...But I can take something else.</b>',
        { label:'...', onOk:coldOpenWave });
    } else { coldOpenWave(); }
  }

  /* ---- the memory-theft wash. --------------------------------------------- */
  function coldOpenWave(){
    if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
    if(typeof G!=='undefined'){ G.slowmo=Math.max(G.slowmo||0,1.2); G.shake=1.0; }
    var ov = document.getElementById('coWave');
    if(!ov){
      ov = document.createElement('div'); ov.id='coWave';
      ov.style.cssText = 'position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;'+
        'transition:opacity 1.3s ease-in;background:radial-gradient(circle at 50% 55%, rgba(150,80,220,0.92), rgba(10,4,24,0.99));';
      document.body.appendChild(ov);
    }
    requestAnimationFrame(function(){ ov.style.opacity='1'; });
    setTimeout(function(){
      if(typeof storyCard==='function'){
        storyCard('<i>The world tips away. Something is torn loose and carried off into the dark - your name, your face, the light behind your eyes. The cold takes all of it. Then the sea takes the rest, and closes over. Only the blade stays, locked in your hand.</i>',
          { label:'...', onOk:coldOpenAshore });
      } else { coldOpenAshore(); }
    }, 1500);
  }

  /* ---- wash ashore, amnesiac: masked, memory + techniques gone, sword kept.
     Reuse the original startFresh for correct cove/quests, cutscene skipped. -- */
  function coldOpenAshore(){
    CO.phase = 'done';
    P.story = P.story || {};
    P.story.royalGarb = 0;                 // the royal wear is gone; _startFresh sets masked=1
    P.unlocked = P.unlocked || {};
    P.unlocked.dash = false;               // the curse took the trained techniques...
    P.unlocked.parry = false;
    // ...but NOT the blade: keep P.unlocked.melee + swordTier so Maren reads a warrior
    P.hp = P.maxhp;
    CO._skip = true;                       // make shoreCutscene fall straight through to Maren
    if(typeof switchWorld==='function') switchWorld('isle');
    if(typeof CO._origStartFresh==='function') CO._origStartFresh();
    else bailToShore();
    var ov = document.getElementById('coWave');
    if(ov){ ov.style.transition='opacity 1s ease-out'; ov.style.opacity='0'; setTimeout(function(){ if(ov.parentNode) ov.parentNode.removeChild(ov); }, 1100); }
    setTimeout(function(){ CO._skip = false; }, 800);
  }

  function bailToShore(){
    CO._skip = false;
    if(typeof CO._origStartFresh==='function') CO._origStartFresh();
  }

  /* ---- per-frame: keep the hero alive (the loss is scripted), and time out the
     unwinnable boss if the player just keeps swinging at it. ------------------ */
  function tick(dt){
    if(!ON() || typeof G==='undefined' || G.worldId!=='deck') return;
    if(P && P.hp>0 && P.hp<CLAMP_MIN) P.hp=CLAMP_MIN;
    if(CO.phase==='boss'){
      CO.bossT = (CO.bossT||0) + (dt||0);
      // resolve the unwinnable fight on time alone, so the loss always lands even
      // if the player stops swinging or backs off (an early trip on futile hits
      // lives in the damageMob wrapper for players who mash into it).
      if(CO.bossT>=6) triggerDefeat();
    }
  }

  /* ============================ wrappers ============================ */
  // startFresh: on a new game, divert into the cold open when the flag is on.
  if(typeof window.startFresh==='function'){
    CO._origStartFresh = window.startFresh;
    window.startFresh = function(){
      if(!ON()) return CO._origStartFresh.apply(this, arguments);
      G.wiping = false;
      P.story = P.story || {};
      P.rod = false;
      try{ for(var k in EXPL) delete EXPL[k]; }catch(e){}
      if(typeof Snd!=='undefined'){ Snd.init(); if(typeof Amb!=='undefined') Amb.ensure(); if(typeof Music!=='undefined') Music.nextT=0; }
      var t=document.getElementById('titleOv'); if(t) t.style.display='none';
      G.state = 'play';
      if(typeof openingQuests==='function') openingQuests();
      if(typeof updateQuestUI==='function') updateQuestUI();
      var begin = function(){ coldOpenBoard(); };
      if(document.readyState==='loading') window.addEventListener('DOMContentLoaded', begin, {once:true});
      else begin();
    };
  }

  // shoreCutscene: while _skip is set (the wash-ashore handoff), skip the ship
  // slideshow entirely and go straight to Maren's first words.
  if(typeof window.shoreCutscene==='function'){
    var _shore = window.shoreCutscene;
    window.shoreCutscene = function(onDone){
      if(ON() && CO._skip){ if(typeof onDone==='function') onDone(); return; }
      return _shore.apply(this, arguments);
    };
  }

  // killMob: count practice wisps; when the last falls, raise the big spirit.
  if(typeof window.killMob==='function'){
    var _killMob = window.killMob;
    window.killMob = function(m, skill){
      var r = _killMob.apply(this, arguments);
      try{
        if(ON() && m && m.coldWisp){
          CO.wispsLeft = Math.max(0, (CO.wispsLeft||1) - 1);
          if(CO.wispsLeft<=0 && CO.phase==='practice'){ CO.phase='transition'; setTimeout(coldOpenBoss, 900); }
        }
      }catch(e){}
      return r;
    };
  }

  // damageMob: the big spirit is invulnerable - blows land with "NO EFFECT", and
  // enough futile hits (once the fight has had a beat to breathe) trip the defeat.
  if(typeof window.damageMob==='function'){
    var _damageMob = window.damageMob;
    window.damageMob = function(m, dmg, knock, skill){
      if(ON() && m && m.coldBoss){
        m.hp = m.maxhp; m.hurtT = Math.max(m.hurtT||0, 0.12);
        CO.bossHits = (CO.bossHits||0) + 1;
        if((CO.bossHits % 2)===1 && typeof addFloat==='function') addFloat('NO EFFECT', m.x, m.y-1.6, '#b98fe0', 1.0);
        if(CO.phase==='boss' && CO.bossHits>=5 && (CO.bossT||0)>=2.0) triggerDefeat();
        return;   // never damages
      }
      return _damageMob.apply(this, arguments);
    };
  }

  // hurtPlayer: keep the hero alive through the cold open (the loss is scripted).
  if(typeof window.hurtPlayer==='function'){
    var _hurtPlayer = window.hurtPlayer;
    window.hurtPlayer = function(dmg, src){
      var r = _hurtPlayer.apply(this, arguments);
      try{ if(ON() && typeof G!=='undefined' && G.worldId==='deck' && P && P.hp>0 && P.hp<CLAMP_MIN) P.hp=CLAMP_MIN; }catch(e){}
      return r;
    };
  }

  // updatePlayer: drive the per-frame tick right after the real update.
  if(typeof window.updatePlayer==='function'){
    var _updatePlayer = window.updatePlayer;
    window.updatePlayer = function(dt){
      var r = _updatePlayer.apply(this, arguments);
      try{ tick(dt||0); }catch(e){}
      return r;
    };
  }

  /* ============================ dev menu ============================ */
  function toggleColdOpen(b){
    CO.on = !CO.on;
    try{ if(typeof SafeStore!=='undefined') SafeStore.set('tf_coldopen', CO.on?'1':'0'); }catch(e){}
    if(b) b.textContent = 'Cold open: ' + (CO.on?'ON':'off');
    if(typeof note==='function') note('Cold open ' + (CO.on ? 'ON - "Start Over" now opens on the deck fight' : 'off - stock shore cutscene'));
  }
  window.toggleColdOpen = toggleColdOpen;

  if(typeof window.devRegisterSection==='function'){
    window.devRegisterSection(['Cold open (prototype)', [
      ['Cold open: ' + (CO.on?'ON':'off'), function(b){ toggleColdOpen(b); }],
      ['Play the deck fight now', function(){
        CO.on = true; CO._done=false; CO._skip=false; CO.phase=null;
        coldOpenBoard();
      }],
    ]]);
  }
})();
