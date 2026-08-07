/* ============================================================================
   COLD OPEN  (the mainline opening)   -   js/50-coldopen.js
   ----------------------------------------------------------------------------
   The playable intro. You are the princess (unmasked, royal garb) on the deck
   of your ship in a NEVER-ENDING night storm - rain, lightning, thunder, the
   hull rocking under you. Cursed sea-things climb the rails; you learn the
   blade by cutting them down. Then a vast horror rises that you cannot beat.
   It cannot take your life (the old blood forbids it) so it takes your memory,
   and you wake amnesiac on Emberwick's shore, still gripping a warrior's sword.

   This pass:
     - NO modal text cards. Beats are non-blocking CAPTIONS (auto-timed, click to
       skip) - a couple pause the action to explain, none has an "OK" button.
     - PERMANENT STORM on the deck (WX forced to storm for worldId 'deck', plus
       night + instant rain here), and the whole ship ROCKS (a render-time camera
       sway while on deck).
     - A real SHIP: a raised wooden bulwark rings the deck and a mast stands at
       centre, all depth-sorted with the player (walk behind the far rail, in
       front of the near rail) - drawn by wrapping drawDecor.
     - NEW foes (no wraiths): brine-crawlers you practise on, then the Deep Maw.
       Custom art via a drawMob wrapper; base kinds drive only AI/stats.

   MAINLINE: ON by default; a dev can opt out (DEV menu / localStorage
   tf_coldopen=0), which falls back to waking on the shore with Maren.
   Everything is monkey-patched onto the globals; core files untouched but for
   the WX storm hook (13-aaa-layer) and one coldOpen-gated line in startIntro.
   ============================================================================ */
(function(){
  'use strict';

  window.COLDOPEN = window.COLDOPEN || { on:true };
  try{ var _cv=(typeof SafeStore!=='undefined') && SafeStore.get('tf_coldopen'); if(_cv==='0') window.COLDOPEN.on=false; else if(_cv==='1') window.COLDOPEN.on=true; }catch(e){}
  var CO = window.COLDOPEN;
  var ON = function(){ return !!(CO && CO.on); };

  // (the hero has unlimited health in the cold open - hp is clamped to full; the loss is scripted)
  var SMALLS = 3;       // brine-crawlers to practise on before the Deep Maw

  /* ========================= the deck world ========================= */
  // A ship-shaped plank hull (pointed bow to the north) ringed by black sea.
  function genDeck(){
    var W=MAPW, H=MAPH, cx=W/2, cy=H/2, rx=13, ry=18;
    for(var y=0;y<H;y++){
      var dyn=(y+0.5-cy)/ry;
      var base=(Math.abs(dyn)<=1)? Math.sqrt(1-dyn*dyn)*rx : -1;
      var taper=(y+0.5<cy)? (1-Math.pow((cy-(y+0.5))/cy,1.5)*0.5) : 1;
      var hw=base*taper, hws=(base>=0? (base+1.7)*taper : -1);
      for(var x=0;x<W;x++){
        var ddx=Math.abs(x+0.5-cx);
        if(base>=0 && ddx<=hw) G.map[y*W+x]=T.PLANK;
        else if(base>=0 && ddx<=hws) G.map[y*W+x]=T.SHALLOW;
        else G.map[y*W+x]=T.DEEP;
      }
    }
  }
  if(typeof WORLD_DEFS!=='undefined' && !WORLD_DEFS.deck){
    WORLD_DEFS.deck = {
      W:44, H:50, seed:12207,
      zones:{ deck:{x:22, y:25, r:16, name:'The Deck'} },
      spawn:{x:22.5, y:34.5},
      title:'THE NIGHT STRAIT', sub:'A STORM WITH NO MERCY',
      gen: genDeck
    };
  }

  // Ring the deck with a raised bulwark + a mast at centre. Pushed as decor so the
  // live pass depth-sorts each piece with the player (correct occlusion). Rails carry
  // the OPEN edges (the sides facing the sea) so drawDecor knows where to raise wood.
  function isPlank(x,y){ return (typeof tileAt==='function') && tileAt(x,y)===T.PLANK; }
  function placeShipDecor(){
    var cx=Math.round(MAPW/2), cy=Math.round(MAPH/2);
    for(var y=0;y<MAPH;y++){
      for(var x=0;x<MAPW;x++){
        if(!isPlank(x,y)) continue;
        var edges=0;                         // bit 1=up(y-1) 2=right(x+1) 4=down(y+1) 8=left(x-1)
        if(!isPlank(x,y-1)) edges|=1;
        if(!isPlank(x+1,y)) edges|=2;
        if(!isPlank(x,y+1)) edges|=4;
        if(!isPlank(x-1,y)) edges|=8;
        if(edges) G.decor.push({kind:'coRail', x:x+0.5, y:y+0.5, edges:edges});
      }
    }
    // the mast, dead centre - a solid the player walks around
    G.decor.push({kind:'coMast', x:cx+0.5, y:cy+0.5});
    if(typeof G.solid!=='undefined'){ var i=cy*MAPW+cx; if(i>=0&&i<G.solid.length) G.solid[i]=1; }
    // a couple of cargo crates for footing landmarks / cover
    [[cx-4,cy+3],[cx+4,cy+2],[cx-3,cy-4]].forEach(function(c){
      if(isPlank(c[0],c[1])) G.decor.push({kind:'coCrate', x:c[0]+0.5, y:c[1]+0.5});
    });
  }

  /* ========================= new foes (no wraiths) ========================= */
  // Small brine-crawler: base 'skeleton' AI (a plain walker), custom art.
  function spawnCrawler(x,y){
    var m = (typeof spawnMob==='function') ? spawnMob('skeleton', x, y, false) : null;
    if(!m) return null;
    m.hp=m.maxhp=16; m.dmg=4; m.speed=Math.min(m.speed||3,2.3); m.aggro=24;
    m.name='Brine-Crawler'; m.coldFoe='crawler'; m.coldSmall=1;
    m.boss=false; m.bigBoss=false; m.title=null;
    return m;
  }
  // The Deep Maw: base 'minotaur' AI (a slow heavy), invulnerable + scripted, custom art.
  function spawnDeepMaw(x,y){
    var m = (typeof spawnMob==='function') ? spawnMob('minotaur', x, y, false) : null;
    if(!m) return null;
    m.hp=m.maxhp=999; m.dmg=10; m.speed=Math.min(m.speed||2,2.2); m.aggro=30; m.r=1.1;
    m.boss=true; m.bigBoss=true; m.title='THE DEEP MAW'; m.subtitle='IT RISES TO MEET YOU';
    m.name='The Deep Maw'; m.coldFoe='deepmaw'; m.coldBoss=1;
    return m;
  }

  /* ========================= captions (no OK button) ========================= */
  // A non-blocking bottom caption. Auto-fades after `dur`; click anywhere to skip.
  // opts.pause holds the action while it reads (for the dramatic beats).
  var capEl=null;
  function ensureCapCSS(){
    if(document.getElementById('coCapCSS')) return;
    var st=document.createElement('style'); st.id='coCapCSS';
    st.textContent='#coCap{position:fixed;left:0;right:0;bottom:6%;z-index:58;display:none;'+
      'justify-content:center;pointer-events:none;transition:opacity .4s;}'+
      '#coCap .in{max-width:min(760px,88vw);margin:0 16px;padding:14px 22px;border-radius:12px;'+
      'background:linear-gradient(180deg,rgba(18,10,28,.82),rgba(10,6,20,.9));'+
      'border:1px solid rgba(150,110,200,.35);box-shadow:0 6px 30px rgba(0,0,0,.5);'+
      'color:#efe6d8;font-family:"Palatino Linotype",Palatino,Georgia,serif;font-size:16px;'+
      'line-height:1.5;text-align:center;text-shadow:0 1px 3px #000;}'+
      '#coCap .in b{color:#ffd7a0;} #coCap .in i{color:#c9b0ff;}';
    document.head.appendChild(st);
  }
  function coCaption(html, dur, opts){
    opts=opts||{};
    ensureCapCSS();
    if(!capEl){ capEl=document.createElement('div'); capEl.id='coCap'; capEl.innerHTML='<div class="in"></div>'; document.body.appendChild(capEl); }
    capEl.querySelector('.in').innerHTML = html;
    capEl.style.display='flex'; capEl.style.opacity='0';
    requestAnimationFrame(function(){ capEl.style.opacity='1'; });
    var wasPlay = (typeof G!=='undefined' && G.state==='play' && !G.paused);
    if(opts.pause && wasPlay) G.paused=true;
    var done=false;
    function finish(){
      if(done) return; done=true;
      capEl.style.opacity='0';
      setTimeout(function(){ if(capEl) capEl.style.display='none'; }, 420);
      if(opts.pause && wasPlay && typeof G!=='undefined') G.paused=false;
      document.removeEventListener('pointerdown', skip, true);
      window.removeEventListener('keydown', skip, true);
      if(opts.onDone) opts.onDone();
    }
    function skip(e){ if(e&&e.preventDefault)e.preventDefault(); finish(); }
    setTimeout(finish, dur||4000);
    // allow click/key to skip after a short beat (so the opening tap doesn't blow past it)
    setTimeout(function(){ document.addEventListener('pointerdown', skip, true); window.addEventListener('keydown', skip, true); }, 600);
  }

  /* ========================= the sequence ========================= */
  function coldOpenBoard(){
    if(typeof switchWorld!=='function'){ bailToShore(); return; }
    P.story = P.story || {};
    P.story.masked=0; P.story.royalGarb=1; P.story.necklace=true; P.story.coldOpen=1;
    P.unlocked = P.unlocked || {};
    // The intro is a flash of your SKILLED self - the full flow is yours here (stamina,
    // cancels, chains, deflect), which is what the Deep Maw tears away below (coldOpenAshore).
    P.unlocked.melee=true; P.unlocked.dash=true; P.unlocked.parry=true; P.unlocked.combos=true;
    P.weapon='melee'; P.swordTier=Math.max(P.swordTier||0,1);
    P.hp=P.maxhp;
    CO.phase='intro'; CO.smallsLeft=SMALLS; CO.bossT=0; CO.bossHits=0;

    // Bram fits ARMOUR, not a first blade (you kept the sword through the wreck).
    if(typeof QUESTS!=='undefined' && QUESTS.kit && !QUESTS.kit._coArmor){
      var k=QUESTS.kit; k._coArmor=1;
      k.rw={ armor:1, gold:5, xp:{ melee:60 } };
      k.brief='That\'s a warrior\'s blade you carry - but you\'ll not last a week on this isle in wet rags. Take my axe and pick off the rack: fell a tree for wood, break a rock for stone, and bring them back. I\'ll hammer you out armour worthy of that steel.';
      k.log='Chop a tree for 1 wood and mine a rock for 1 stone with Bram\'s tools, then return to Bram for armour.';
      k.doneText='Good hands - and now good plate to keep them swinging. *CLANG* - fitted and buckled. A blade\'s only half of it, though: go east, past the meadow, and find old Rask. He\'ll teach you to TURN a strike aside - the thing that keeps you breathing when they come at you two and three at once. Then Maren will have work worthy of you.';
    }

    switchWorld('deck');
    placeShipDecor();
    // deep-night, and the tempest already at full fury (no fade-in)
    if(typeof G!=='undefined'){ G.dayT=0.9; }
    if(typeof WX!=='undefined'){ WX.rain=1; WX.target=1; WX.timer=999; }
    if(typeof banner==='function') banner('THE NIGHT STRAIT','A STORM WITH NO MERCY');

    // TEACH FIRST, then fight. Two quick PAUSED captions explain the mechanics with no
    // foes on the deck yet - so nothing swarms you while you're reading - then the waves begin.
    CO.phase='teach';
    coCaption('The dark climbs the rails - and your hands remember the blade. <b>Attack</b> (Space / K), <b>dash</b> their lunges (Ctrl / L), and time <b>O</b> to <b>deflect</b> a blow.', 5600, {pause:true, onDone:function(){
      coCaption('<b>WEAVE</b> it: <b>attack → dash</b> cancels your recovery, <b>dash → dash</b> chains, a <b>deflect</b> turns a blow. Mind the <b>stamina</b> bar under your health - it fuels the flow, and a deflect or perfect dodge refunds it. Now - <b>cut them down.</b>', 6800, {pause:true, onDone:startWaves});
    }});
  }

  /* A few escalating rounds of brine-crawlers, not one wave. Each round spawns in a
     ring around the hero; clear it and the next rolls in after a short beat; clear the
     last and the Deep Maw rises. */
  var WAVES=[3,4,5];
  function rr(a,b){ return a+Math.random()*(b-a); }
  function startWaves(){ CO.wave=0; nextWave(); }
  function nextWave(){
    if(CO.phase==='defeat'||CO.phase==='done') return;
    CO.wave=(CO.wave||0)+1;
    if(CO.wave>WAVES.length){ CO.phase='transition'; setTimeout(coldOpenBoss,900); return; }
    CO.phase='practice';
    var n=WAVES[CO.wave-1], got=0;
    for(var i=0;i<n;i++){
      var a=(i/n)*Math.PI*2 + CO.wave*0.7;
      var sx=Math.round(P.x+Math.cos(a)*rr(4,6.5)), sy=Math.round(P.y+Math.sin(a)*rr(4,6.5));
      if(spawnCrawler(sx,sy)) got++;
    }
    CO.smallsLeft=Math.max(1,got);
    if(CO.wave>1){ if(typeof banner==='function') banner('WAVE '+CO.wave, 'THE SEA IS NOT DONE WITH YOU'); }
    else if(typeof addFloat==='function') addFloat('USE YOUR SKILLS', P.x, P.y-3.0, '#c9b0ff', 1.25);
  }

  function coldOpenBoss(){
    if(CO.phase==='defeat'||CO.phase==='done') return;
    CO.phase='boss'; CO.bossT=0; CO.bossHits=0;
    spawnDeepMaw(22,29);   // close in front of the hero (spawn ~22,34) so it looms in view
    if(typeof banner==='function') banner('THE DEEP MAW','IT RISES TO MEET YOU');
    if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
    if(typeof G!=='undefined'){ G.shake=0.9; G.slowmo=Math.max(G.slowmo||0,1.1); }
    coCaption('The crawlers were only its fingers. The black water heaves - and the <b>Deep Maw</b> rises out of it, vast and cold, filling the deck between you and the sky.', 4500, {pause:false});
    // the fight is unwinnable - resolve on a timer (mashers trip it sooner; see damageMob)
    setTimeout(function(){ if(CO.phase==='boss') triggerDefeat(); }, 6500);
  }

  function triggerDefeat(){ if(CO.phase==='defeat'||CO.phase==='done') return; CO.phase='defeat'; coldOpenDefeat(); }
  function coldOpenDefeat(){
    try{ (G.mobs||[]).forEach(function(m){ if(m&&m.coldBoss){ m.state='idle'; m.frozen=1; } }); }catch(e){}
    P.hurtT=0.6;
    if(typeof G!=='undefined'){ G.shake=1.0; G.slowmo=Math.max(G.slowmo||0,1.3); }
    if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
    coCaption('Your blade stops in the dark and will not bite. Cold lifts you off your feet. A voice, vast and unhurried:<br><br><b style="color:#c9a0ff">You are of the old blood, little tide. I cannot take you from this world - that door your line barred to me.</b> <i style="color:#ffb0a0">...But I can take something else.</i>',
      7000, {pause:true, onDone:coldOpenWave});
  }

  function coldOpenWave(){
    if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
    if(typeof G!=='undefined'){ G.slowmo=Math.max(G.slowmo||0,1.2); G.shake=1.0; }
    var ov=document.getElementById('coWave');
    if(!ov){ ov=document.createElement('div'); ov.id='coWave';
      ov.style.cssText='position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;transition:opacity 1.3s ease-in;background:radial-gradient(circle at 50% 55%, rgba(150,80,220,0.92), rgba(10,4,24,0.99));';
      document.body.appendChild(ov); }
    requestAnimationFrame(function(){ ov.style.opacity='1'; });
    setTimeout(function(){
      coCaption('The world tips away. Something is torn loose and carried off into the dark - your name, your face, the light behind your eyes. Only the blade stays, locked in your hand.',
        6000, {pause:true, onDone:coldOpenAshore});
    }, 1400);
  }

  function coldOpenAshore(){
    CO.phase='done';
    P.story=P.story||{}; P.story.royalGarb=0;
    // the Deep Maw takes your name and your face - but NOT your muscle memory ("only the
    // blade stays, locked in your hand"). You keep the full combat flow: dash, parry, and
    // the cancels/chains/deflect + stamina. Training on the isle becomes a refresher, not
    // a re-teach (see Orin, who just offers a tonic now).
    P.unlocked=P.unlocked||{};
    P.hp=P.maxhp;
    if(typeof switchWorld==='function') switchWorld('isle');
    if(typeof CO._origStartFresh==='function') CO._origStartFresh(); else bailToShore();
    var ov=document.getElementById('coWave');
    if(ov){ ov.style.transition='opacity 1s ease-out'; ov.style.opacity='0'; setTimeout(function(){ if(ov.parentNode) ov.parentNode.removeChild(ov); }, 1100); }
  }
  function bailToShore(){ if(typeof CO._origStartFresh==='function') CO._origStartFresh(); }

  function tick(dt){
    if(!ON() || typeof G==='undefined' || G.worldId!=='deck') return;
    if(P && P.hp>0 && P.hp<P.maxhp) P.hp=P.maxhp;   // unlimited health - the loss is scripted, not fought
    if(CO.phase==='boss'){ CO.bossT=(CO.bossT||0)+(dt||0); if(CO.bossT>=7) triggerDefeat(); }
  }

  /* ========================= custom art (wrappers) ========================= */
  // A raised wooden bulwark panel between two base screen points, rising by H.
  function railPanel(p1, p2, H){
    var g=cx;
    // the planked wall face
    g.beginPath(); g.moveTo(p1.x,p1.y); g.lineTo(p2.x,p2.y); g.lineTo(p2.x,p2.y-H); g.lineTo(p1.x,p1.y-H); g.closePath();
    g.fillStyle='#4a3320'; g.fill();
    g.fillStyle='rgba(0,0,0,0.28)'; g.fill();                // storm-dark
    // stacked plank seams (two horizontal courses) + vertical staves = a built-up wall
    g.strokeStyle='rgba(24,16,10,0.7)'; g.lineWidth=1;
    for(var s=1;s<=2;s++){ var hy=H*(s/3);
      g.beginPath(); g.moveTo(p1.x,p1.y-hy); g.lineTo(p2.x,p2.y-hy); g.stroke(); }
    for(var t=0.25;t<1;t+=0.25){ var mx=p1.x+(p2.x-p1.x)*t, my=p1.y+(p2.y-p1.y)*t; g.beginPath(); g.moveTo(mx,my); g.lineTo(mx,my-H); g.stroke(); }
    // a lit top cap rail so the wall catches the storm-light
    g.beginPath(); g.moveTo(p1.x,p1.y-H); g.lineTo(p2.x,p2.y-H); g.lineTo(p2.x,p2.y-H-5); g.lineTo(p1.x,p1.y-H-5); g.closePath();
    g.fillStyle='#7a5636'; g.fill();
  }
  function drawCoRail(b){
    if(typeof worldToScreen!=='function') return;
    var x=b.x-0.5, y=b.y-0.5;
    var nw=worldToScreen(x,   y  ), ne=worldToScreen(x+1, y  ),
        se=worldToScreen(x+1, y+1), sw=worldToScreen(x,   y+1);
    var H=20;
    if(b.edges&1) railPanel(nw,ne,H);   // up
    if(b.edges&2) railPanel(ne,se,H);   // right
    if(b.edges&4) railPanel(se,sw,H);   // down
    if(b.edges&8) railPanel(sw,nw,H);   // left
  }
  function drawCoMast(s){
    var g=cx, t=(typeof G!=='undefined'?G.time:0)||0, sway=Math.sin(t*1.1)*3;
    // shadow
    g.save(); g.globalAlpha=0.3; g.fillStyle='#000'; g.beginPath(); g.ellipse(s.x,s.y,16,7,0,0,TAU); g.fill(); g.restore();
    // pole
    g.fillStyle='#5a3f28'; g.beginPath(); g.moveTo(s.x-4,s.y); g.lineTo(s.x+4,s.y); g.lineTo(s.x+3+sway,s.y-96); g.lineTo(s.x-3+sway,s.y-96); g.closePath(); g.fill();
    g.strokeStyle='rgba(0,0,0,0.3)'; g.lineWidth=1; g.stroke();
    // yard-arm + torn sail
    g.strokeStyle='#4a3320'; g.lineWidth=4; g.beginPath(); g.moveTo(s.x-34+sway,s.y-70); g.lineTo(s.x+34+sway,s.y-70); g.stroke();
    g.fillStyle='rgba(210,200,180,0.5)'; g.beginPath();
    g.moveTo(s.x-30+sway,s.y-68); g.lineTo(s.x+30+sway,s.y-68);
    g.lineTo(s.x+22+sway,s.y-30); g.quadraticCurveTo(s.x+sway,s.y-40,s.x-24+sway,s.y-32); g.closePath(); g.fill();
  }
  function drawCoCrate(s){
    var g=cx;
    g.save(); g.globalAlpha=0.3; g.fillStyle='#000'; g.beginPath(); g.ellipse(s.x,s.y+2,15,7,0,0,TAU); g.fill(); g.restore();
    g.fillStyle='#5a3f28'; g.fillRect(s.x-12,s.y-18,24,20);
    g.fillStyle='#6e4c2c'; g.fillRect(s.x-12,s.y-22,24,6);
    g.strokeStyle='rgba(30,20,12,0.7)'; g.lineWidth=2; g.strokeRect(s.x-12,s.y-18,24,20);
    g.beginPath(); g.moveTo(s.x-12,s.y-18); g.lineTo(s.x+12,s.y+2); g.moveTo(s.x+12,s.y-18); g.lineTo(s.x-12,s.y+2); g.stroke();
  }

  // Brine-crawler: a hunched, dripping thing of black brine with pale-green eyes.
  function drawCrawler(m,s){
    var g=cx, t=((typeof G!=='undefined'?G.time:0)||0)+(m.anim||0), bob=Math.sin(t*6)*1.5, hurt=(m.hurtT||0)>0;
    g.save(); g.globalAlpha=0.32; g.fillStyle='#000'; g.beginPath(); g.ellipse(s.x,s.y,12,6,0,0,TAU); g.fill(); g.restore();
    var bodyY=s.y-10+bob;
    // body
    g.fillStyle=hurt?'#7fd6c0':'#14322e';
    g.beginPath(); g.ellipse(s.x,bodyY,11,9,0,0,TAU); g.fill();
    g.fillStyle=hurt?'#a7e6d6':'#1d443d'; g.beginPath(); g.ellipse(s.x,bodyY-3,8,6,0,0,TAU); g.fill();
    // clawed arms
    g.strokeStyle=hurt?'#7fd6c0':'#0e2622'; g.lineWidth=3; g.lineCap='round';
    g.beginPath(); g.moveTo(s.x-6,bodyY+2); g.lineTo(s.x-15,s.y-2+bob); g.moveTo(s.x+6,bodyY+2); g.lineTo(s.x+15,s.y-2+bob); g.stroke();
    // eyes
    g.fillStyle='#bff7c8'; g.beginPath(); g.arc(s.x-4,bodyY-2,2.1,0,TAU); g.arc(s.x+4,bodyY-2,2.1,0,TAU); g.fill();
    g.fillStyle='rgba(180,255,190,0.5)'; g.beginPath(); g.arc(s.x-4,bodyY-2,3.6,0,TAU); g.arc(s.x+4,bodyY-2,3.6,0,TAU); g.fill();
    // drips
    g.fillStyle='rgba(30,70,64,0.6)'; g.fillRect(s.x-8,bodyY+6,1.4,4+Math.sin(t*3)*2); g.fillRect(s.x+7,bodyY+5,1.4,4+Math.cos(t*3)*2);
    if(typeof drawMobBars==='function') drawMobBars(m,s);
  }
  // The Deep Maw: a huge dark mass, a vertical maw of teeth, violet-lit eyes, writhing arms.
  function drawDeepMaw(m,s){
    var g=cx, t=((typeof G!=='undefined'?G.time:0)||0), rise=Math.sin(t*1.3)*4, hurt=(m.hurtT||0)>0;
    g.save(); g.globalAlpha=0.35; g.fillStyle='#000'; g.beginPath(); g.ellipse(s.x,s.y,34,12,0,0,TAU); g.fill(); g.restore();
    // violet aura
    var au=g.createRadialGradient(s.x,s.y-40,6,s.x,s.y-40,64); au.addColorStop(0,'rgba(150,60,200,0.35)'); au.addColorStop(1,'rgba(60,16,110,0)');
    g.fillStyle=au; g.beginPath(); g.arc(s.x,s.y-40,64,0,TAU); g.fill();
    // writhing arms
    g.strokeStyle=hurt?'#8f6fc0':'#12100f'; g.lineWidth=7; g.lineCap='round';
    for(var i=-1;i<=1;i+=2){ g.beginPath(); g.moveTo(s.x+i*10,s.y-18);
      g.quadraticCurveTo(s.x+i*40,s.y-40-rise, s.x+i*30+Math.sin(t*2+i)*10, s.y-8); g.stroke(); }
    // body mass
    g.fillStyle=hurt?'#6a5a86':'#161022';
    g.beginPath(); g.moveTo(s.x-30,s.y+2); g.quadraticCurveTo(s.x-34,s.y-70-rise, s.x,s.y-78-rise);
    g.quadraticCurveTo(s.x+34,s.y-70-rise, s.x+30,s.y+2); g.closePath(); g.fill();
    // the maw
    g.fillStyle='#0a0710'; g.beginPath(); g.ellipse(s.x,s.y-42-rise,10,26,0,0,TAU); g.fill();
    g.fillStyle='#e8e0d0';
    for(var j=-3;j<=3;j++){ var ty=s.y-42-rise+j*7; g.beginPath(); g.moveTo(s.x-9,ty); g.lineTo(s.x-3,ty+2); g.lineTo(s.x-9,ty+4); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(s.x+9,ty); g.lineTo(s.x+3,ty+2); g.lineTo(s.x+9,ty+4); g.closePath(); g.fill(); }
    // eyes
    g.fillStyle='#d9a0ff'; g.beginPath(); g.arc(s.x-12,s.y-64-rise,3.4,0,TAU); g.arc(s.x+12,s.y-64-rise,3.4,0,TAU); g.fill();
    g.fillStyle='rgba(201,160,255,0.5)'; g.beginPath(); g.arc(s.x-12,s.y-64-rise,6,0,TAU); g.arc(s.x+12,s.y-64-rise,6,0,TAU); g.fill();
    if(typeof drawMobBars==='function') drawMobBars(m,s);
  }

  /* ========================= wrappers ========================= */
  if(typeof window.startFresh==='function'){
    CO._origStartFresh = window.startFresh;
    window.startFresh = function(){
      if(!ON()) return CO._origStartFresh.apply(this, arguments);
      G.wiping=false; P.story=P.story||{}; P.rod=false;
      try{ for(var k in EXPL) delete EXPL[k]; }catch(e){}
      if(typeof Snd!=='undefined'){ Snd.init(); if(typeof Amb!=='undefined') Amb.ensure(); if(typeof Music!=='undefined') Music.nextT=0; }
      var t=document.getElementById('titleOv'); if(t) t.style.display='none';
      G.state='play';
      if(typeof openingQuests==='function') openingQuests();
      if(typeof updateQuestUI==='function') updateQuestUI();
      var begin=function(){ coldOpenBoard(); };
      if(document.readyState==='loading') window.addEventListener('DOMContentLoaded', begin, {once:true});
      else begin();
    };
  }

  // killMob: count crawlers; when the last falls, raise the Deep Maw.
  if(typeof window.killMob==='function'){
    var _killMob=window.killMob;
    window.killMob=function(m, skill){
      var r=_killMob.apply(this, arguments);
      try{ if(ON() && m && m.coldSmall){ CO.smallsLeft=Math.max(0,(CO.smallsLeft||1)-1);
        if(CO.smallsLeft<=0 && CO.phase==='practice'){ CO.phase='between'; setTimeout(nextWave, 1100); } } }catch(e){}
      return r;
    };
  }

  // damageMob: the Deep Maw is invulnerable - blows land "NO EFFECT" and enough
  // futile hits (after a beat) trip the scripted defeat.
  if(typeof window.damageMob==='function'){
    var _damageMob=window.damageMob;
    window.damageMob=function(m, dmg, knock, skill){
      if(ON() && m && m.coldBoss){
        m.hp=m.maxhp; m.hurtT=Math.max(m.hurtT||0,0.12); CO.bossHits=(CO.bossHits||0)+1;
        if((CO.bossHits%2)===1 && typeof addFloat==='function') addFloat('NO EFFECT', m.x, m.y-2.4, '#b98fe0', 1.0);
        if(CO.phase==='boss' && CO.bossHits>=5 && (CO.bossT||0)>=2.0) triggerDefeat();
        return;
      }
      return _damageMob.apply(this, arguments);
    };
  }

  // hurtPlayer: keep the hero alive through the cold open.
  if(typeof window.hurtPlayer==='function'){
    var _hurtPlayer=window.hurtPlayer;
    window.hurtPlayer=function(dmg, src){
      var r=_hurtPlayer.apply(this, arguments);
      try{ if(ON() && typeof G!=='undefined' && G.worldId==='deck' && P && P.hp>0 && P.hp<P.maxhp) P.hp=P.maxhp; }catch(e){}
      return r;
    };
  }

  // updatePlayer: per-frame tick.
  if(typeof window.updatePlayer==='function'){
    var _updatePlayer=window.updatePlayer;
    window.updatePlayer=function(dt){ var r=_updatePlayer.apply(this, arguments); try{ tick(dt||0); }catch(e){} return r; };
  }

  // drawDecor: render the ship structure.
  if(typeof window.drawDecor==='function'){
    var _drawDecor=window.drawDecor;
    window.drawDecor=function(b, s){
      if(b){ if(b.kind==='coRail'){ drawCoRail(b); return; } if(b.kind==='coMast'){ drawCoMast(s); return; } if(b.kind==='coCrate'){ drawCoCrate(s); return; } }
      return _drawDecor.apply(this, arguments);
    };
  }

  // drawMob: render the new foes.
  if(typeof window.drawMob==='function'){
    var _drawMob=window.drawMob;
    window.drawMob=function(m, s){
      if(m && m.coldFoe==='crawler'){ drawCrawler(m,s); return; }
      if(m && m.coldFoe==='deepmaw'){ drawDeepMaw(m,s); return; }
      return _drawMob.apply(this, arguments);
    };
  }

  // render: rock the ship - a gentle camera sway while on the deck (restored after
  // so the camera-follow logic is untouched).
  if(typeof window.render==='function'){
    var _render=window.render;
    window.render=function(){
      if(ON() && typeof G!=='undefined' && G.worldId==='deck' && G.cam){
        var t=(G.time||0), sx=Math.sin(t*0.9)*8+Math.sin(t*0.33)*4, sy=Math.cos(t*0.75)*5+Math.sin(t*1.7)*2;
        var ox=G.cam.x, oy=G.cam.y; G.cam.x+=sx; G.cam.y+=sy;
        try{ return _render.apply(this, arguments); } finally { G.cam.x=ox; G.cam.y=oy; }
      }
      return _render.apply(this, arguments);
    };
  }

  /* ========================= dev menu ========================= */
  function toggleColdOpen(b){
    CO.on=!CO.on;
    try{ if(typeof SafeStore!=='undefined') SafeStore.set('tf_coldopen', CO.on?'1':'0'); }catch(e){}
    if(b) b.textContent='Cold open: '+(CO.on?'ON':'off');
    if(typeof note==='function') note('Cold open '+(CO.on?'ON (default) - "Start Over" opens on the deck':'off - wake on the shore with Maren'));
  }
  window.toggleColdOpen=toggleColdOpen;
  if(typeof window.devRegisterSection==='function'){
    window.devRegisterSection(['Cold open (the opening)', [
      ['Cold open: '+(CO.on?'ON':'off'), function(b){ toggleColdOpen(b); }],
      ['Play the deck opening now', function(){ CO.on=true; CO.phase=null; coldOpenBoard(); }],
    ]]);
  }
})();
