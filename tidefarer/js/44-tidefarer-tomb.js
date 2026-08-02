/* =====================================================================
   ACT II CLIMAX — THE TIDEFARER'S REST
   -----------------------------------------------------------------------
   The payoff the Tideward Crypt's "(to be continued)" card promised. The
   prophecy (Stormreach catacombs) named the weapon the great queen forged;
   the Tideward slab named the hidden waters. This is that grave-isle off
   Emberwick — reached from a tide-cut stair by Driftwood Dock, opened once
   the Tideward Crypt is cleared (P.story.tidewardDone).

   The sequence (STORY.md, "The weapon" + "The two gifts"):
     · reach the headstone → the Tidefarer's SPIRIT WAKES and tells the
       deepest history — Vath's many names, and how he turned her own sealing
       spell back on her (the reveal cadence's final, weightiest beat).
     · she begs you to STRIKE THE STONE and free her and the book it guards.
     · at the strike the ROYAL-FAMILY GUARDIANS awaken and attack — set to
       test whoever would claim the weapon. Winning proves the warrior worthy.
     · the BOOK grants the two gifts: the warrior's SLOW-TIME (js/43), and,
       for the scholar, the SEAL — carried to the capital for the finale.
     · the sea to Aldermere opens (P.story.finaleOpen) — Act III.

   Built on the engine's own dungeon primitives (_dungReset/_dungCarve/
   _dungWalls, spawnMob, storyCard, banner) and reached by the same
   dungeon-mouth → switchWorld path every isle dungeon uses.
   ===================================================================== */
(function(){
'use strict';

const GRAVE_ZONES = {
  rest:    {x:22, y:9,  r:6, name:"The Tidefarer's Rest"},
  landing: {x:22, y:50, r:5, name:'The Skiff Landing'},
};
// expose for switchWorld's zone-read
if(typeof window!=='undefined') window.GRAVE_ZONES = GRAVE_ZONES;

// ---- world registration (44 loads after 12, so WORLD_DEFS exists) ------------
if(typeof WORLD_DEFS!=='undefined'){
  WORLD_DEFS.graveisle = {
    W:44, H:58, seed:73129, zones:GRAVE_ZONES, dungeon:1, dark:0.16,
    spawn:{x:22.5, y:50.5},
    title:"THE TIDEFARER'S REST",
    sub:'A GRAVE-ISLE OFF EMBERWICK — WHERE THE GREAT QUEEN TRULY LIES',
    gen:()=>genGraveIsleAll(),
  };
}

// ---- generation --------------------------------------------------------------
function genGraveIsle(){
  _dungReset();
  _dungCarve(8, 4, 36, 53, T.RUIN);                 // the walled barrow-court
  // soften the floor: a grave-ISLE, not a crypt — grass and old soil break the stone
  for(let y=5;y<=52;y++) for(let x=9;x<=35;x++){ if(!inb(x,y)) continue;
    const n=(x*7+y*13)%17; if(n<5) setTile(x,y,T.GRASS); else if(n<7) setTile(x,y,T.SOIL); }
  _dungCarve(20, 4, 24, 53, T.PATH);                // the central approach, dock to grave
}
function placeGraveObjects(){
  G.decor=G.decor||[];
  const freed = !!(P.story && P.story.tidefarerFreed);
  // the way back to Emberwick, at the south landing
  G.decor.push({kind:'dungeonmouth', x:22.5, y:53.5, deepworld:'isle', exit:1, label:'the way back', name:'BACK TO EMBERWICK ▲'});
  setSolid(22,53,0); setTile(22,53,T.PATH);
  // the monument — the great queen's true grave (reusing the tomb + headstone art)
  G.decor.push({kind:'tombmouth', x:22.5, y:6.5, tidegrave:1});
  G.decor.push({kind:'grave',    x:22.5, y:9.5, s:0, tidegrave:1});
  G.decor.push({kind:'lamp', x:18.5, y:8.5}); G.decor.push({kind:'lamp', x:26.5, y:8.5});
  // the line's honour-guard: old standing stones flanking the approach (dormant statues)
  for(const gy of [17,25,33,41]){
    G.decor.push({kind:'pillar', x:15.5, y:gy+0.5, broken:false});
    G.decor.push({kind:'pillar', x:29.5, y:gy+0.5, broken:false});
  }
  // a couple of lamps to light the long walk up
  G.decor.push({kind:'lamp', x:22.5, y:46.5}); G.decor.push({kind:'lamp', x:22.5, y:30.5});
  if(freed){
    // the book is taken and the queen is at rest — a quiet cairn of light where she lay
    G.decor.push({kind:'lamp', x:22.5, y:11.5});
  }
  G._graveMon={x:22.5, y:11.0};
}
function spawnGraveMobs(){
  // the court stands empty and still until the strike wakes the line (see startGraveGuardians)
  G.critters = G.critters || [];
}
function genGraveIsleAll(){
  genGraveIsle();
  placeGraveObjects();
  if(typeof _dungWalls==='function') _dungWalls('tide');
  spawnGraveMobs();
  if(typeof buildMapBase==='function') buildMapBase();
}
window.genGraveIsleAll = genGraveIsleAll;

// ---- the Emberwick approach: a tide-cut stair by the dock ---------------------
// Placed from genIsleAll (after placeEmberTomb) once the Tideward Crypt is cleared.
function placeGraveMouth(){
  if(!(P.story && P.story.tidewardDone)) return;
  if(G.decor.some(d=>d.kind==='dungeonmouth' && d.deepworld==='graveisle')) return;
  const Z=(typeof ZONES!=='undefined' && ZONES.dock) ? ZONES.dock : {x:31,y:62};
  const sp=(typeof findOpenNear==='function' && findOpenNear(Math.round(Z.x)-2, Math.round(Z.y)-3, 8)) || null;
  if(sp && inb(sp[0],sp[1])){
    for(let y=sp[1]-1;y<=sp[1]+1;y++) for(let x=sp[0]-1;x<=sp[0]+1;x++)
      if(inb(x,y) && walkTile(tileAt(x,y))) setTile(x,y,T.PATH);
    G.decor.push({kind:'dungeonmouth', x:sp[0]+0.5, y:sp[1]+0.5, deepworld:'graveisle',
      label:"the Tidefarer's rest", name:"THE TIDEFARER'S REST ▼"});
    G.decor.push({kind:'lamp', x:sp[0]-1.5, y:sp[1]+0.5});
    G.decor.push({kind:'lamp', x:sp[0]+1.5, y:sp[1]+0.5});
    P.story.graveStairSeen = P.story.graveStairSeen || 0;
    if(!P.story.graveStairSeen){ P.story.graveStairSeen=1;
      if(typeof toast==='function') setTimeout(()=>{ try{ toast('A tide-cut <b>stair</b> has opened in the rock by <b>Driftwood Dock</b> — the chart\'s hidden waters, laid bare at last. <b style="color:#ffe9a8">Put out to the Tidefarer\'s Rest.</b>', 8500); }catch(e){} }, 1400); }
  }
}
window.placeGraveMouth = placeGraveMouth;

// ---- per-frame driver (called from the main loop, world dt-independent) -------
function graveIsleTick(dt){
  if(typeof G==='undefined' || G.worldId!=='graveisle') return;
  P.story = P.story || {};
  if(!G._graveHi){ G._graveHi=1;
    if(typeof banner==='function') setTimeout(()=>banner("THE TIDEFARER'S REST","THE GREAT QUEEN DOES NOT LIE WHERE THE HISTORIES LAID HER"), 700); }
  const busy = (typeof dlg!=='undefined' && dlg.open) || G.paused || G.menuPause || G.bossIntro;
  // the spirit wakes the first time you reach the headstone
  if(!P.story.tidefarerWoke && !busy && G._graveMon && !P.dead){
    if(dist(P.x,P.y,G._graveMon.x,G._graveMon.y) < 3.2) tidefarerWake();
  }
  // the guardian wave: won when the last of the line falls
  if(G._graveWave && !P.story.tidefarerFreed){
    let live=0; for(const m of G.mobs) if(m.graveGuardian && !m.dead) live++;
    if(live===0){ G._graveWave=0; graveVictory(); }
  }
}
window.graveIsleTick = graveIsleTick;

// ---- the spirit's telling (the deepest history) ------------------------------
function tidefarerWake(){
  P.story.tidefarerWoke = 1;
  if(typeof Snd!=='undefined' && Snd.magic) Snd.magic();
  if(typeof shockwave==='function') shockwave(G._graveMon.x, G._graveMon.y, 'rgba(150,215,255,0.85)', 90);
  G.shake=Math.max(G.shake||0, 0.4);
  const C='#bfe8ff';
  const card=(html,label,next)=>storyCard(html,{label:label||'Go on', onOk:next});
  card('<i>The headstone is tide-worn past reading, but the sea-glass set in its face still holds a light — and as your shadow falls across it, the light stands up.</i> <b style="color:'+C+'">A woman of pale water takes shape above the grave: crowned, armoured, old as the isles.</b> <i>She looks at you the way you have caught yourself looking in still pools — as at her own face.</i>',
    'Speak with her', ()=>
  card('<b style="color:'+C+'">"Blood of my blood. So the line held, and the tide sent one of you back to me at last. Then you have found the curses, and felt his hand under them. Let me give you the rest — you have earned the whole of it."</b>',
    'Listen', ()=>
  card('<b style="color:'+C+'">"He has worn a hundred names. Emberbinder. The drowned advisor. The beggar-child a King took for a prodigy. I knew him first only as the thing I beat down to a broken spirit, generations gone — and meant to seal forever."</b>',
    'Go on', ()=>
  card('<b style="color:'+C+'">"I had the sealing-spell on my lips. He could not touch me — your blood he never could — so he did the only thing left him: he made me DO it wrong. He talked. He walked our duel, step by patient step, to the one ground where a turned spell would rebound — and in the last breath he threw my own sealing back upon ME."</b> <i>Her light dims, remembering.</i> <b style="color:'+C+'">"It took me instead of him. So learn the lesson that cost me everything: in the end — do not let Vath talk."</b>',
    'And the weapon?', ()=>
  card('<b style="color:'+C+'">"There is no sword here, child. I forged no blade. What I forged is a BOOK — the sealing done RIGHT, so it can never be turned again. It takes two: a warrior to make the openings and a mind to close the seal. It lies under this stone, and I with it, and I am so very tired."</b> <i>She lifts a hand of water toward you.</i> <b style="color:'+C+'">"Strike the stone. Free the book, and free me. But my kin set a guard over this grave — they will rise, and they will test you. Prove the line is not spent. Take up your steel."</b>',
    'Strike the stone', ()=> startGraveGuardians() )))));
}

// ---- the royal-family guardians ----------------------------------------------
function startGraveGuardians(){
  if(G._graveWave || (P.story && P.story.tidefarerFreed)) return;
  G._graveWave = 1;
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
  if(typeof shockwave==='function') shockwave(G._graveMon.x, G._graveMon.y, 'rgba(220,230,255,0.95)', 130);
  G.shake=Math.max(G.shake||0, 0.8); G.slowmo=Math.max(G.slowmo||0, 0.7);
  if(typeof banner==='function') banner('THE LINE AWAKENS','THE ROYAL DEAD RISE TO TEST THE CLAIMANT');
  // shatter the headstone visually — swap the intact grave for a broken slab
  for(const d of G.decor){ if(d.kind==='grave' && d.tidegrave){ d.s=2; } }
  // the honour-guard: wraith-spirits of the royal dead around the court
  const pts=[[16,18],[28,18],[16,26],[28,26],[19,22],[25,22]];
  for(const [x,y] of pts){
    const sp=(typeof findOpenNear==='function' && findOpenNear(x,y,4)) || [x,y];
    const m=spawnMob('wraith', sp[0], sp[1]);
    if(m){ m.graveGuardian=1; m.aggro=20; m.noAggroT=0; m.state='chase'; m.hx=sp[0]; m.hy=sp[1]; m.respawnT=-1; }
  }
  // the captain of the guard — the First of the Line, a proper boss with a bar
  const csp=(typeof findOpenNear==='function' && findOpenNear(22,15,4)) || [22,15];
  const c=spawnMob('wraith', csp[0], csp[1]);
  if(c){
    c.graveGuardian=1; c.boss=true; c.bigBoss=true;
    c.title='THE FIRST OF THE LINE'; c.subtitle="GUARDIAN OF THE TIDEFARER'S REST";
    c.maxhp=Math.round((c.maxhp||120)*3.4)+260; c.hp=c.maxhp;
    c.dmg=Math.round((c.dmg||14)*1.35); c.speed=(c.speed||2.4)*1.05; c.aggro=22; c.lvl=15;
    c.hx=csp[0]; c.hy=csp[1]; c.respawnT=-1; c.state='chase';
  }
  if(typeof cinematic==='function'){ cinematic(true); setTimeout(()=>cinematic(false), 2600); }
  if(typeof autoSave==='function') autoSave();
}

// ---- the book and the two gifts ----------------------------------------------
function graveVictory(){
  P.story=P.story||{};
  P.story.tidefarerFreed = 1;
  P.story.finaleOpen = 1;                 // the sea to Aldermere opens (Act III)
  if(typeof Snd!=='undefined' && Snd.quest) Snd.quest();
  if(typeof giveGold==='function') giveGold(400);
  if(typeof addXP==='function'){ addXP('melee',700); addXP('magic',500); }
  if(typeof gainLXP==='function') gainLXP(600);
  if(typeof banner==='function') banner('THE LINE IS SATISFIED','THE GRAVE GIVES UP ITS KEEPING');
  const C='#bfe8ff', A='#ffe9a8';
  const card=(html,label,next)=>storyCard(html,{label:label||'Continue', onOk:next});
  setTimeout(()=>{
  card('<i>The last guardian sinks back into the water it rose from, and the broken stone gives up what it guarded: a </i><b style="color:'+A+'">book bound in tide-glass</b><i>, cold and bright and whole. The Tidefarer\'s light kneels beside it, lighter now, unburdening.</i> <b style="color:'+C+'">"There. The seal done right — and a gift for each of you, that the doing may go quicker than the writing."</b>',
    'Open the book', ()=>
  card('<b style="color:'+C+'">"For your brother, the scholar: the SEAL itself — the binding word, to close on Vath what I could not. His is the hand that ends it. Carry it to him."</b> <i>The page turns of its own accord.</i> <b style="color:'+C+'">"And for you, the warrior — this."</b>',
    'Read the warrior\'s page', ()=>{
      if(typeof grantSlowTime==='function') grantSlowTime();
      card('<b style="color:'+C+'">"To STILL THE TIDE. Let the world crawl while you do not — strike a dozen times in the space a foe takes to lift his guard. It is how a lone blade outlasts an army. And an army is exactly what he will throw at you, for he cannot touch your blood himself."</b> <i>The light gathers itself small and warm.</i> <b style="color:'+C+'">"Go now. He has the throne, and your father, and every soul in the capital to spend against you. End it. And this time — do not let him talk."</b>',
        'The Tidefarer rests', ()=>{
          if(typeof banner==='function') banner('THE SEA TO ALDERMERE OPENS','SET SAIL FOR THE CAPITAL — AND VATH');
          card('<i>The pale light lies down into the grave and does not rise again. Above the isle the sky finally moves — a first true dawn in an age — and away south the great strait to </i><b style="color:'+A+'">Aldermere</b><i> lies open, its storm-wall gone. The book is warm in your hands. It is time to go home, and finish it.</i>',
            'Set sail for Aldermere', ()=>{ if(typeof autoSave==='function') autoSave(); });
        });
    }));
  }, 900);
}

// keep the disc/HUD honest if the gift is already earned on a restored save
if(typeof window!=='undefined'){
  window.tidefarerWake = tidefarerWake;
  window.startGraveGuardians = startGraveGuardians;
  window.graveVictory = graveVictory;
}
})();
