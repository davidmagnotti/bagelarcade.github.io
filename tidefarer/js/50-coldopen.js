/* ============================================================================
   COLD OPEN  (prototype, flag-gated)   -   js/50-coldopen.js
   ----------------------------------------------------------------------------
   Replaces the passive shore CUTSCENE with PLAYABLE gameplay: the very first
   thing the player does is FIGHT. You are the princess (unmasked, royal garb),
   on the deck of your ship in the night storm, and a cursed violet spirit
   climbs the rail. You cut it down with the REAL combat engine (sword + dash +
   parry). Then the cursed sea rises, the deck goes out from under you, and the
   curse takes your memory, your face (the mask), and your trained techniques -
   but NOT the blade in your hand. You wash ashore a masked castaway who still
   carries a warrior's sword, and Elder Maren reads you for what you are.

   DESIGN INTENT
     - The FIGHTING is the hook. A new player is swinging a sword in the first
       ~15 seconds, not watching a slideshow or running gathering errands.
     - The amnesia premise is weaponised: you feel the power, then lose it, and
       the whole game is climbing back to the ceiling this minute showed you.
     - You KEEP the sword ashore (Maren's "you carry a warrior's blade") but the
       curse strips the techniques (dash/parry) and memory - so you retrain with
       Rask (parry) and Orin (dash), and Bram now fits ARMOR, not a first blade.

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

  /* ---- the deck: a small bespoke world, a plank ship-deck ringed by black sea.
     Added as a WORLD_DEF so switchWorld drives it like any other world. The
     surrounding DEEP water is non-walkable (walkTile), so it fences the arena
     on its own - no solids needed. ------------------------------------------- */
  function genDeck(){
    var W=MAPW, H=MAPH, cx=W/2, cy=H/2, rx=6.4, ry=9.2;
    for(var y=0;y<H;y++){
      for(var x=0;x<W;x++){
        var dx=(x+0.5-cx)/rx, dy=(y+0.5-cy)/ry;
        G.map[y*W+x] = (dx*dx+dy*dy<=1) ? T.PLANK : T.DEEP;
      }
    }
    // a ring of shallow around the hull so the plank doesn't meet the abyss with a hard edge
    for(var y2=0;y2<H;y2++){
      for(var x2=0;x2<W;x2++){
        if(G.map[y2*W+x2]!==T.DEEP) continue;
        var dx2=(x2+0.5-cx)/(rx+1.6), dy2=(y2+0.5-cy)/(ry+1.6);
        if(dx2*dx2+dy2*dy2<=1) G.map[y2*W+x2]=T.SHALLOW;
      }
    }
  }
  if(typeof WORLD_DEFS!=='undefined' && !WORLD_DEFS.deck){
    WORLD_DEFS.deck = {
      W:30, H:36, seed:12207,
      zones:{ deck:{x:15, y:18, r:9, name:'The Deck'} },
      spawn:{x:15.5, y:24.5},
      title:'THE NIGHT STRAIT', sub:'A STORM WITH NO MERCY',
      gen: genDeck
    };
  }

  /* ---- the purple spirit: a real, fightable mob (violet Night Wraith), tuned
     to be a satisfying but WINNABLE first fight for a flailing new player. ---- */
  function spawnColdSpirit(){
    var m = (typeof spawnMob==='function') ? spawnMob('wraith', 15, 16, false) : null;
    if(!m) return null;
    m.hp = m.maxhp = 80;      // ~6-8 clean sword hits
    m.dmg = 7;                // gentle: the player has 100 HP and no armour yet
    m.speed = Math.min(m.speed||4, 3.4);
    m.aggro = 20;
    m.boss = true; m.bigBoss = true;   // boss HP bar; never respawns
    m.name = 'The Drowning Dark';
    m.title = 'THE DROWNING DARK';
    m.subtitle = 'IT RISES TO MEET YOU';
    m.coldSpirit = 1;
    return m;
  }

  /* ---- boot the board: princess kit, into the deck world, spawn the spirit,
     then a one-card intro that hands control to the fight. ------------------- */
  function coldOpenBoard(){
    if(typeof switchWorld!=='function'){ bailToShore(); return; }
    // the princess, as she was: unmasked, royal garb, and a trained warrior
    P.story = P.story || {};
    P.story.masked = 0; P.story.royalGarb = 1; P.story.necklace = true; P.story.coldOpen = 1;
    P.unlocked = P.unlocked || {};
    P.unlocked.melee = true; P.unlocked.dash = true; P.unlocked.parry = true;
    P.weapon = 'melee'; P.swordTier = Math.max(P.swordTier||0, 1);
    P.hp = P.maxhp;
    CO._done = false;

    // Bram now fits ARMOUR, not a first blade (you kept the sword through the wreck).
    // Rewrite his opening errand's reward + words for the cold-open path. applyQuestDialogue
    // has already run at boot, so this override wins; a stock game always reloads fresh, so
    // it never leaks into the shipping opening.
    if(typeof QUESTS!=='undefined' && QUESTS.kit && !QUESTS.kit._coArmor){
      var k = QUESTS.kit; k._coArmor = 1;
      k.rw = { armor:1, gold:5, xp:{ melee:60 } };
      k.brief = 'That\'s a warrior\'s blade you carry - but you\'ll not last a week on this isle in wet rags. Take my axe and pick off the rack: fell a tree for wood, break a rock for stone, and bring them back. I\'ll hammer you out armour worthy of that steel.';
      k.log = 'Chop a tree for 1 wood and mine a rock for 1 stone with Bram\'s tools, then return to Bram for armour.';
      k.doneText = 'Good hands - and now good plate to keep them swinging. *CLANG* - fitted and buckled. A blade\'s only half of it, though: go east, past the meadow, and find old Rask. He\'ll teach you to TURN a strike aside - the thing that keeps you breathing when they come at you two and three at once. Then Maren will have work worthy of you.';
    }

    switchWorld('deck');
    spawnColdSpirit();
    if(typeof banner==='function') banner('THE NIGHT STRAIT', 'A STORM WITH NO MERCY');

    if(typeof storyCard==='function'){
      storyCard('<i>Rain on black water, and a storm with no mercy in it. Your ship pitches under you - and something climbs the rail: a shape of cold violet light, wrong and reaching. Your blade is already in your hand.</i>',
        { label:'Cut it down', onOk:function(){ if(typeof toast==='function') toast('', 1); } });
    }
  }

  /* ---- the spirit falls -> the cursed sea rises and takes the ship. --------- */
  function coldOpenWave(){
    if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
    if(typeof G!=='undefined'){ G.slowmo=Math.max(G.slowmo||0,1.2); G.shake=1.0; }
    // a violet -> deep-dark full-screen wash (pure DOM, no engine coupling)
    var ov = document.getElementById('coWave');
    if(!ov){
      ov = document.createElement('div'); ov.id='coWave';
      ov.style.cssText = 'position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;'+
        'transition:opacity 1.2s ease-in;background:radial-gradient(circle at 50% 62%, rgba(150,80,220,0.9), rgba(10,4,24,0.99));';
      document.body.appendChild(ov);
    }
    requestAnimationFrame(function(){ ov.style.opacity='1'; });
    setTimeout(function(){
      if(typeof storyCard==='function'){
        storyCard('<i>The sea itself rises to answer - cold and wrong, lit from beneath. The deck goes out from under you and the dark closes over. Something is pulled from you as you sink: your name, your face, the light behind your eyes. Only the blade stays, locked in your hand.</i>',
          { label:'...', onOk:coldOpenAshore });
      } else { coldOpenAshore(); }
    }, 1400);
  }

  /* ---- wash ashore: the curse has taken hold. Masked, memory gone, techniques
     stripped - but the SWORD remains. Reuse the original startFresh for correct
     cove placement / quests, with the shore cutscene skipped (we just played it
     for real). --------------------------------------------------------------- */
  function coldOpenAshore(){
    P.story = P.story || {};
    P.story.royalGarb = 0;                 // the royal wear is gone; _startFresh sets masked=1
    P.unlocked = P.unlocked || {};
    P.unlocked.dash = false;               // the curse took the trained techniques...
    P.unlocked.parry = false;
    // ...but NOT the blade: keep P.unlocked.melee + swordTier so Maren reads a warrior
    CO._skip = true;                       // make shoreCutscene fall straight through to Maren
    if(typeof switchWorld==='function') switchWorld('isle');
    if(typeof CO._origStartFresh==='function') CO._origStartFresh();
    else bailToShore();
    var ov = document.getElementById('coWave');
    if(ov){ ov.style.transition='opacity 1s ease-out'; ov.style.opacity='0'; setTimeout(function(){ if(ov.parentNode) ov.parentNode.removeChild(ov); }, 1100); }
    setTimeout(function(){ CO._skip = false; }, 800);
  }

  function bailToShore(){
    // last-ditch: if anything is missing, fall through to the stock opening so we never soft-lock
    CO._skip = false;
    if(typeof CO._origStartFresh==='function') CO._origStartFresh();
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

  // killMob: catch the spirit's death and fire the wave.
  if(typeof window.killMob==='function'){
    var _killMob = window.killMob;
    window.killMob = function(m, skill){
      var r = _killMob.apply(this, arguments);
      try{ if(ON() && m && m.coldSpirit && !CO._done){ CO._done=true; setTimeout(coldOpenWave, 750); } }catch(e){}
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
        // jump straight into the cold open from anywhere (for testing)
        CO.on = true; CO._done=false; CO._skip=false;
        coldOpenBoard();
      }],
    ]]);
  }
})();
