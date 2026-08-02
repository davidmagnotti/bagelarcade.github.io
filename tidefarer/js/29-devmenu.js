/* =====================================================================
   DEV / DEBUG MENU  -  toggle with the  `  (backtick)  key, or tap the
   small "DEV" tab in the top-left. A scratch panel for testing: teleport
   between islands, mark curses/bosses defeated, drive the story, and buff
   the hero. REMOVE THIS FILE (and its <script> tag) FOR THE FINAL BUILD.
   ===================================================================== */
(function(){
'use strict';

let god=false;

function note(m){ try{ if(typeof toast==='function') toast(m,1500); }catch(e){} }
function ui(){ try{ refreshUI&&refreshUI(); buildHotbar&&buildHotbar(); updateQuestUI&&updateQuestUI(); }catch(e){} }

/* ---- actions ---- */
function tp(id){
  if(typeof switchWorld!=='function') return;
  if(G.interior){ G.interior=null; }
  if(G.state!=='play'){ G.state='play'; }
  P.dead=false; document.getElementById('deadOv').style.display='none';
  switchWorld(id); ui(); note('Teleported: '+id);
}
function setAct(n){
  P.story=P.story||{}; P.story.act=n; P.story.necklace=true;
  if(n>=2) P.story.vathMet=1, P.story.vathNamed=1;
  if(n>=3) P.story.kingTold=1;
  note('Act set to '+n);
}
// Rewind the close of Act I so the climax cutscene (and the epilogue that follows
// it) can be played again - clears the ending flags, drops back to Act I, and
// restores the prerequisites so talking to King Aldous re-triggers the scene.
function resetActOneEnding(){
  P.story=P.story||{};
  ['act1End','vathAscendant','kingFallen','framed','act2','reachArrived'].forEach(f=>{ delete P.story[f]; });
  P.story.act=1;
  P.story.unmasked=1; P.story.remembered=1; P.story.kingTold=1;   // so the Aldous climax branch is reachable
  if(P.quests) P.quests.homecoming='active';                      // re-offer the homecoming so it can complete again
  ui(); note('Act I ending reset - talk to the King, or use the Play entries');
}
// Play any animated overlay cutscene on demand. The freeing/ending scenes take an onDone
// continuation; we pass a harmless toast so a dev preview has no side effects (no dragon
// awoken, no leviathan sunk). The throne/epilogue scenes bake their hand-off into the scene
// itself (they close Act I / make landfall as they end) - previewing them will advance that
// state, so play those on a throwaway save.
function playCutscene(kind){
  const done=label=>()=>{ try{ toast('(dev) '+label+' ended',2500); }catch(e){} };
  switch(kind){
    case 'mask':           if(typeof maskRevealCutscene==='function')     maskRevealCutscene(done('mask reveal')); break;
    case 'throne':         if(typeof throneCutscene==='function')         throneCutscene(); break;
    case 'epilogue':       if(typeof sailEpilogue==='function')           sailEpilogue(); break;
    case 'dragonEnthrall': if(typeof dragonEnthrallCutscene==='function') dragonEnthrallCutscene(done('Ashwing enthralled')); break;
    case 'dragonFreed':    if(typeof dragonFreedCutscene==='function')    dragonFreedCutscene(done('Ashwing freed')); break;
    case 'leviathan':      if(typeof leviathanFreedCutscene==='function') leviathanFreedCutscene(null, done('Leviathan freed')); break;
    case 'warden':         if(typeof wardenFreedCutscene==='function')    wardenFreedCutscene(null, done('Weeping Warden freed')); break;
    case 'rimebound':      if(typeof rimeboundFreedCutscene==='function') rimeboundFreedCutscene(null, done('Rimebound freed')); break;
    case 'stormeye':       if(typeof stormEyeCutscene==='function')       stormEyeCutscene(done('Storm-Eye closes')); break;
    case 'vath':           if(typeof vathBoundCutscene==='function')      vathBoundCutscene(null, done('Vath bound')); break;
    case 'aerie':          if(typeof aerieFreedCutscene==='function')     aerieFreedCutscene(null, done('The tome burns')); break;
    case 'veil':           if(typeof veilCastCutscene==='function')       veilCastCutscene(done('Warding Veil cast')); break;
    default: return;
  }
  note('Playing cutscene: '+kind);
}
function freeCurse(which){
  P.story=P.story||{}; P.story.vathMet=1; P.story.vathNamed=1;
  const done=q=>{ if(QUESTS&&QUESTS[q]) P.quests[q]='done'; };
  if(which==='dragon'||which==='all'){ P.eastDragonFreed=1; P.metDragon=1; done('wyrm'); done('vhunt'); }
  if(which==='tide'  ||which==='all'){ P.story.tideCalm=1;  done('tide');  }
  if(which==='aerie' ||which==='all'){ P.story.aerieFreed=1; done('roost'); }
  if(which==='frost' ||which==='all'){ P.story.frostFreed=1; P.story.deepDone=1; P.story.veilTome=1; done('thaw'); done('rimebound'); if(typeof grantVathVeil==='function') grantVathVeil(true); }
  // clear any of those bosses still standing on the current map
  for(const m of (G.mobs||[])){ if(['leviathan','frostwarden','serpent','dragon','mage'].includes(m.kind) && !m.dead){ m.freed=1; m.dead=true; m.respawnT=-1; } }
  ui(); note('Curse(s) freed: '+which);
}
// The inverse of freeCurse: mark a boss NOT defeated again, re-arm its quest,
// and stand the boss back up (regenerating the isles it lives on).
function resetCurse(which){
  P.story=P.story||{}; P.prog=P.prog||{};
  const arm=q=>{ if(QUESTS&&QUESTS[q]) P.quests[q]='active'; };  // re-offer the fight
  const worlds=new Set();
  if(which==='dragon'||which==='all'){
    P.eastDragonFreed=0; P.eastDragonFought=0; P.metDragon=0; P.mageHuntStarted=0;
    delete P.prog.vhunt; delete P.quests.vhunt;
    arm('wyrm'); P.prog.wyrmReplayed=1;   // keep the load-time migration from re-firing
    worlds.add('east'); worlds.add('eastdeep');
  }
  if(which==='tide' ||which==='all'){ P.story.tideCalm=0; arm('tide'); worlds.add('wind'); }
  if(which==='aerie'||which==='all'){ P.story.aerieFreed=0; arm('roost'); worlds.add('aerie'); worlds.add('aeriedeep'); }
  if(which==='frost'||which==='all'){ P.story.frostFreed=0; P.story.deepDone=0; P.story.veilTome=0; P.story.vathVeil=0; if(P.spells) delete P.spells.veil; if(P.inv) delete P.inv.veilrune; arm('thaw'); worlds.add('frost'); worlds.add('frostdeep'); }
  // drop any lingering freed boss on the current map so a fresh one can stand
  for(const m of (G.mobs||[])){ if(['leviathan','frostwarden','serpent','dragon','icecolossus','mage'].includes(m.kind)){ m.dead=true; m.freed=0; m.respawnT=-1; } }
  // drop the cached isles so bosses respawn on re-entry; rebuild the one you're in now
  for(const id of worlds){ if(typeof WORLDS!=='undefined' && WORLDS[id]) delete WORLDS[id]; regenWorld(id); }
  if(typeof refreshDungeonLabels==='function') refreshDungeonLabels();  // keep #96's toggle labels in sync
  ui(); note('Boss(es) reset to not-defeated: '+which);
}
function clearMobs(){
  let n=0; for(const m of (G.mobs||[])){ if(!m.dead){ m.dead=true; m.respawnT=-1; n++; } }
  note('Cleared '+n+' foes on this map');
}
// One-tap setup for the Act II "return to the old isles" phase: put the story in Act II,
// grant the Warding Veil AND the four returned-isle gifts (so every new dungeon + the
// capstone is reachable and traversable), and drop the cached old isles so they regenerate
// with their Act II curses + dungeon mouths. This is what makes revisiting an old isle via
// the teleport buttons show the correct Act II state.
function enterReturnPhase(){
  P.story=P.story||{}; P.unlocked=P.unlocked||{}; P.spells=P.spells||{};
  P.story.act=Math.max(P.story.act||1,2); P.story.act2=1;
  if(typeof purgeAct1AvailQuests==='function') purgeAct1AvailQuests();   // retire the old isles' Act I quest-board work
  // Act I is closed by the time Act II opens: the mask is off, the prince is remembered,
  // and the throne fell. Set those so the return phase is coherent (Jaist reads as Prince
  // Jaist and holds the boat on Emberwick, not the woodpile).
  P.story.masked=0; P.story.unmasked=1; P.story.remembered=1; P.story.siblingsKnown=1;
  P.story.royalGarb=1; P.story.act1End=1; P.story.vathAscendant=1; P.story.kingFallen=1; P.story.framed=1;
  P.story.vathMet=1; P.story.vathNamed=1; P.story.reachArrived=1;
  P.story.reachBossDown=1; P.story.tombBossDown=1;                 // Stormreach cleared (opens the Frozen Isle)
  P.story.reachProphecy=1; P.story.reachProphecyRead=1;            // the Tidefarer's verse found + read to Jaist
  P.story.frostFreed=1; P.story.deepDone=1; P.story.veilTome=1;    // Frozen Isle done, the rune found
  if(typeof grantVathVeil==='function') grantVathVeil(true); else { P.story.vathVeil=1; P.spells.veil=1; }
  // the four returned-isle gifts, so every Act II dungeon + the capstone is testable
  P.unlocked.dash=true; P.unlocked.dive=true; P.unlocked.swiftstep=true; P.unlocked.dash2=true; P.spells.flamesnare=1;
  // refresh the old isles so their Act II dungeon mouths / flooding appear on arrival
  if(typeof WORLDS!=='undefined'){ ['isle','main','east','wind','sky','frost'].forEach(id=>{ if(WORLDS[id]) delete WORLDS[id]; }); }
  if(G.worldId && typeof WORLD_DEFS!=='undefined' && WORLD_DEFS[G.worldId] && !WORLD_DEFS[G.worldId].dungeon) regenWorld(G.worldId);
  ui(); note('Act II return phase set: Veil + 4 gifts, old isles refreshed');
}
/* ---- dungeons: toggle each dungeon's WON state either way ---- */
const DUNGEONS=[
  ['Rimefissure', 'frostdeep', 'deepDone'],       // frost boss (Rimebound) freed
  ['Underclimb',  'aeriedeep', 'aerieFreed'],     // aerie tome destroyed (+ surface birds calmed)
  ['Emberdeep',   'eastdeep',  'emberDone'],      // Kea gates opened through to Ashwing
  ['Glacier Vault','frostvault','vaultDone'],     // the wave-gauntlet cleared
  ['Drowned Catacomb','reachdeep','tombBossDown'],// the Drowned Minotaur felled
  ['Undermill',   'milldeep',  'millDone'],       // the Cog-Bound felled
  ['Undermaw',    'undermaw',  'undermawDown'],   // the Maw-Stalker felled
];
// The Act II returned-isle dungeons (veil-gated). Same toggle/clear machinery.
const DUNGEONS2=[
  ['Drowned Vault (Barik)',  'barikdeep',   'barikDeepDone'],   // The Tidemaw felled -> DIVE
  ['Gale Spire (Windsurf)',  'winddeep',    'galeDeepDone'],    // The Skirl felled -> Swiftstep (quicker dash)
  ['Ashen Forge (Sunward)',  'sunwarddeep', 'ashenForgeDone'],  // The Cinderwrought felled -> flame snare
  ['Storm Temple (Cloud)',   'skydeep',     'stormTempleDone'], // The Thundercaller felled -> double dash
  ['Tideward Crypt (capstone)','embertomb', 'tidewardDone'],    // The Tideward Guardian felled
];
function dungWon(flag){ return !!(typeof P!=='undefined' && P && P.story && P.story[flag]); }
function dungLabel(name,flag){ return name+': '+(dungWon(flag)?'WON ✓':'not won'); }
function regenWorld(id){   // rebuild the CURRENT world in place so its state matches the flags
  const def=(typeof WORLD_DEFS!=='undefined') && WORLD_DEFS[id];
  if(!def || G.worldId!==id) return;
  G.interior=null; P.slideDir=null; P.click=null;
  G.projs.length=0; G.parts.length=0; G.floats.length=0;
  if(G.fogs) G.fogs.length=0; if(G.fireflies) G.fireflies.length=0;
  G.map=new Uint8Array(MAPW*MAPH); G.solid=new Uint8Array(MAPW*MAPH); G.variant=new Uint8Array(MAPW*MAPH);
  G.nodes=[]; G.decor=[]; G.plots=[]; G.npcs=[]; G.mobs=[]; G.foam=[]; G.crows=[];
  G.decals=[]; G.cat=null; G.critters=[]; G.forgePos=null;
  def.gen();
  P.x=def.spawn.x; P.y=def.spawn.y; P.dir={x:1,y:0};
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  if(typeof invalidateScenery==='function') invalidateScenery();
}
function setDungeon(id,flag,won){
  P.story=P.story||{}; P.story[flag]=won?1:0; if(won) P.story.vathMet=1;
  // keep the Aerie quest + surface birds consistent with the tome's state
  if(flag==='aerieFreed' && typeof QUESTS!=='undefined' && QUESTS.roost){
    if(won) P.quests.roost='done'; else if(P.quests.roost==='done') P.quests.roost='active';
  }
  // drop cached copies so the dungeon (and any coupled surface) regenerates fresh
  if(typeof WORLDS!=='undefined'){ if(WORLDS[id]) delete WORLDS[id];
    if(id==='aeriedeep' && WORLDS['aerie']) delete WORLDS['aerie']; }
  if(G.worldId===id) regenWorld(id);            // if you're standing in it, rebuild now
  ui(); refreshDungeonLabels();
  note((won?'WON: ':'RESET: ')+id+(G.worldId===id?' (rebuilt)':' (on re-entry)'));
}
function toggleDungeon(id,flag){ setDungeon(id,flag,!dungWon(flag)); }
// Full dungeon-state wipe: the one-tap "make every dungeon fresh & replayable again"
// button. Existing saves carry each dungeon's WON flag (vaultDone, millDone, ...) plus a
// one-time "seen" marker and, for the Glacier Vault, live wave/gate runtime - any of which
// can leave a re-entered dungeon standing open and empty. This clears the lot.
function clearDungeonState(){
  P.story=P.story||{}; P.prog=P.prog||{};
  // 1. every dungeon back to NOT-won (setDungeon also drops its cached copy, syncs any
  //    coupled quest/surface, and rebuilds it in place if you happen to be standing in it)
  DUNGEONS.forEach(([n,id,f])=>setDungeon(id,f,false));
  DUNGEONS2.forEach(([n,id,f])=>setDungeon(id,f,false));   // the Act II returned-isle dungeons too
  // 2. wipe the one-time intro markers so each dungeon's how-to banner plays again -
  //    a clear on-entry signal that the fresh challenge is armed
  ['vaultSeen','millSeen','deepSeen','emberSeen','tombSeen','underSeen','mawSeen'].forEach(s=>{ delete P.prog[s]; });
  // 3. drop any live wave/gate runtime (the Glacier Vault) so a re-entry re-arms from zero
  if(typeof G!=='undefined'){ delete G._vaultRooms; delete G._vaultT; }
  // 4. belt-and-braces: clear every cached dungeon world outright
  const DIDS=['frostvault','milldeep','frostdeep','aeriedeep','eastdeep','reachdeep','undermaw','skydungeon',
              'barikdeep','winddeep','sunwarddeep','skydeep','embertomb'];
  if(typeof WORLDS!=='undefined') for(const id of DIDS){ if(WORLDS[id]) delete WORLDS[id]; }
  // 5. standing in a dungeon right now? rebuild it fresh this instant
  if(typeof WORLD_DEFS!=='undefined' && WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].dungeon) regenWorld(G.worldId);
  try{ autoSave&&autoSave(); }catch(e){}   // persist so it survives a reload
  ui(); refreshDungeonLabels();
  note('Dungeon state cleared - all halls unbeaten, gates re-armed, intros reset');
}
function refreshDungeonLabels(){
  const p=panelEl(); if(!p) return;
  p.querySelectorAll('button[data-dflag]').forEach(b=>{
    b.textContent=dungLabel(b.getAttribute('data-dname'), b.getAttribute('data-dflag')); });
}
function completeActive(){
  let n=0; for(const id in P.quests){ if(P.quests[id]==='active' && QUESTS[id]){ try{ completeQuest(id); n++; }catch(e){} } }
  ui(); note('Completed '+n+' active quest(s)');
}
function unlockAll(){
  P.unlocked=P.unlocked||{}; P.unlocked.melee=P.unlocked.bow=P.unlocked.surf=P.unlocked.moa=true;
  P.unlocked.dash=true; P.unlocked.parry=true;   // base footwork + the guard
  // the four returned-isle gifts (Act II)
  P.unlocked.dive=true; P.unlocked.swiftstep=true; P.unlocked.dash2=true; P.spells=P.spells||{}; P.spells.flamesnare=1;
  P.swordTier=Math.max(P.swordTier||0,3); P.armorOwn=Math.max(P.armorOwn||0,2); P.armor=Math.max(P.armor||0,2);
  P.kit=true; if(P.tools){ P.tools.axe=1; P.tools.pick=1; }
  ui(); note('All weapons, board, moa, tools + the 4 gifts (dive/longdash/flamesnare/dbldash) unlocked');
}
function heal(){ P.hp=P.maxhp; P.mp=P.maxmp; P.arrows=P.maxArrows||20; P.poisonT=0; ui(); note('Restored to full'); }
function gold(n){ if(typeof giveGold==='function') giveGold(n); else P.gold=(P.gold||0)+n; ui(); note('+'+n+' gold'); }
function xp(n){ if(typeof gainLXP==='function') gainLXP(n); ui(); note('+'+n+' level XP'); }
function maxSkills(){ for(const s in (P.skills||{})){ if(typeof addXP==='function') addXP(s, 9999); } ui(); note('Skills boosted'); }
function toggleGod(btn){ god=!god; btn.textContent='God mode: '+(god?'ON':'off'); btn.style.color=god?'#9be07f':''; note('God mode '+(god?'on':'off')); }
// FLOAT / noclip: the player drifts through walls, water, land, and pits (see moveEntity /
// updateInterior / the Undermaw pit-fall, all gated on window.DEVFLOAT).
function toggleFloat(btn){
  window.DEVFLOAT=!window.DEVFLOAT;
  // turning it OFF while parked inside a wall would wedge the hero - pop to open ground
  if(!window.DEVFLOAT && typeof unstickEntity==='function'){ try{ unstickEntity(P); }catch(e){} }
  btn.textContent='Float mode: '+(window.DEVFLOAT?'ON':'off'); btn.style.color=window.DEVFLOAT?'#8fd0ff':'';
  note('Float mode '+(window.DEVFLOAT?'on - noclip':'off'));
}
function saveNow(){ try{ autoSave&&autoSave(); note('Saved'); }catch(e){} }
// build + copy a shareable deep-link that drops a tester straight into a dungeon
function copyDungeonLink(id){
  const url=location.origin+location.pathname+'?dungeon='+id;
  let done=false;
  try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url); done=true; } }catch(e){}
  if(!done){ try{ const ta=document.createElement('textarea'); ta.value=url; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done=true; }catch(e){} }
  try{ console.log('Tidefarer test link:', url); }catch(e){}
  note(done?'Link copied ✓':'Copy failed - see console');
}

/* ---- incremental unlocks: grant ONE thing at a time so a tester can walk the
        gates in order instead of the all-at-once "Unlock all abilities" ---- */
function unlockSword(){ P.unlocked=P.unlocked||{}; P.unlocked.melee=true; P.swordTier=Math.max(P.swordTier||0,1); P.kit=true; ui(); note('Sword unlocked (iron)'); }
function unlockBowDev(){ P.unlocked=P.unlocked||{}; P.unlocked.bow=true; P.maxArrows=P.maxArrows||20; P.arrows=P.maxArrows; ui(); note('Bow unlocked'); }
function unlockDashDev(){ if(typeof unlockDash==='function') unlockDash(); else { P.unlocked=P.unlocked||{}; P.unlocked.dash=true; } ui(); note('Dash unlocked'); }
function unlockParryDev(){ if(typeof unlockParry==='function') unlockParry(); else { P.unlocked=P.unlocked||{}; P.unlocked.parry=true; } ui(); note('Parry unlocked'); }
function grantIronAxe(){ P.tools=P.tools||{axe:0,pick:0}; P.tools.axe=Math.max(P.tools.axe||0,1); P.kit=true; ui(); note('Iron axe granted (tier 1)'); }
function grantIronPick(){ P.tools=P.tools||{axe:0,pick:0}; P.tools.pick=Math.max(P.tools.pick||0,1); P.kit=true; ui(); note('Iron pickaxe granted (tier 1)'); }

/* ---- bosses: mark a named boss "defeated" without grinding the fight ---- */
// Run the REAL death sequence on any boss standing on the current map (Hollow Spirit
// on Emberwick, a dungeon boss while you're in its hall, a regional foe, ...). killMob
// fires every side effect: kill-credit completes its quest, banners play, flags set.
function defeatBossesHere(){
  let n=0;
  for(const m of (G.mobs||[])){
    if(!m.dead && typeof isBossMob==='function' && isBossMob(m)){
      try{ killMob(m); }catch(e){ m.dead=true; m.respawnT=-1; }
      n++;
    }
  }
  ui(); note(n? 'Defeated '+n+' boss(es) on this map (real fall)' : 'No boss on this map');
}
// Hollow Spirit (Emberwick's main-story boss) from ANYWHERE. On the isle with the boss
// still up, kill it for real; off-isle, set the flags a true kill would leave so the
// quest reads done, the isle is cleared, and its warded fire lifts.
function markHollowDefeated(){
  P.story=P.story||{}; P.prog=P.prog||{};
  P.story.bossCleared=P.story.bossCleared||{}; P.story.bossCleared.isle=1;
  let killed=false;
  for(const m of (G.mobs||[])){ if(!m.dead && m.kind==='boss'){ try{ killMob(m); killed=true; }catch(e){ m.dead=true; m.respawnT=-1; } } }
  if(!killed){
    if(QUESTS && QUESTS.king) P.quests.king='done';
    P.prog.king=1;
    if(typeof dropHollowFire==='function') dropHollowFire();
  }
  ui(); note(killed? 'Hollow Spirit slain (real fall)' : 'Hollow Spirit marked defeated');
}

/* ---- quests: mark every quest for a whole island done at once ---- */
// Island -> the quest-givers who live on it (derived from each isle's NPC spawns in
// 04-data.js / 12-world-layer.js). "Complete <island>" finishes every quest whose
// giver is on that isle, whatever file defines the quest.
const ISLAND_GIVERS={
  isle: ['maren','bram','brant','finn','willa','rask','orin','nia','woody'],   // Emberwick
  main: ['kell','moss','sela','ivo','hedda','torv','maelis','mira','corvo'],   // Barik
  east: ['huk','kaia','moli','elias','vath'],                                  // Sunward
  wind: ['rell','coralie','tolen','nessa'],                                    // Windsurf
  sky:  ['aeron'],                                                             // Cloudreach
  reach:['mora','tibb'],                                                       // Stormreach
  aerie:['wrenna'],                                                            // Aerie
  frost:['bryn','sigrid'],                                                     // Frozen
  crown:['aldous','halvard','brea','isolde','doran','gale','odo'],             // Aldermere
};
function completeIslandQuests(island){
  const givers=ISLAND_GIVERS[island]||[]; let n=0;
  // Two passes: completing a quest can OFFER its follow-up (also on this isle), so a
  // second sweep catches anything the first turned 'avail'. completeQuest runs the full
  // turn-in (rewards + unlocks); if state won't allow it, fall back to a plain "done".
  for(let pass=0; pass<2; pass++){
    for(const id in QUESTS){ const q=QUESTS[id];
      if(!q || givers.indexOf(q.giver)<0 || P.quests[id]==='done') continue;
      try{ completeQuest(id); }catch(e){ P.quests[id]='done'; }
      n++;
    }
  }
  ui(); note('Completed '+n+' quest(s) on '+island);
}

/* ---- map: reveal the whole current isle AND flag every named zone discovered, so the
        big-map's fast travel can hop to any of them (normally each must be found on foot) ---- */
function revealMap(){
  if(typeof scoutReveal==='function') scoutReveal();                 // lift the fog on this isle
  else if(typeof explGrid==='function'){ try{ explGrid().fill(1); }catch(e){} }
  P.disc=P.disc||{}; let n=0;
  if(typeof ZONES!=='undefined') for(const k in ZONES){
    const z=ZONES[k]; if(!z || !z.name) continue;
    const key=G.worldId+':'+k;
    if(!P.disc[key]){ P.disc[key]=1; n++; }
  }
  // grant the "found every zone" award if this isle is now fully discovered
  try{ if(typeof award==='function' && typeof ZONES!=='undefined'){
    const all=Object.keys(ZONES).filter(k=>ZONES[k].name).every(k=>P.disc[G.worldId+':'+k]);
    if(all) award('wayfarer');
  } }catch(e){}
  ui(); note('Map revealed - '+n+' new fast-travel point(s) on this isle');
}

setInterval(()=>{ try{ if(god && typeof P!=='undefined' && P && !P.dead){ P.hp=P.maxhp; P.mp=P.maxmp; } }catch(e){} }, 400);

/* ---- panel ---- */
const SECTIONS=[
  ['Teleport island', [
    ['★ Unlock entire map (this isle · fast travel)',()=>revealMap()],
    ['Emberwick (start)',()=>tp('isle')], ['Barik',()=>tp('main')], ['Sunward',()=>tp('east')],
    ['Cloudreach (sky)',()=>tp('sky')], ['Windsurf',()=>tp('wind')], ['Stormreach',()=>tp('reach')],
    ['Aerie',()=>tp('aerie')], ['Frozen',()=>tp('frost')], ['Aldermere (Capital)',()=>tp('crown')],
  ]],
  ['Teleport dungeon (Act I)', [
    ['Emberdeep',()=>tp('eastdeep')], ['Underclimb',()=>tp('aeriedeep')],
    ['Rimefissure (frozen)',()=>tp('frostdeep')], ['Glacier Vault',()=>tp('frostvault')],
    ['Drowned Catacomb',()=>tp('reachdeep')], ['Undermill (Windsurf)',()=>tp('milldeep')],
    ['Undermaw (Barik)',()=>tp('undermaw')], ['Rainbow Road (sky)',()=>tp('skydungeon')],
  ]],
  ['Teleport dungeon (Act II · returned isles)', [
    ['Drowned Vault (Barik)',()=>tp('barikdeep')], ['Gale Spire (Windsurf)',()=>tp('winddeep')],
    ['Ashen Forge (Sunward)',()=>tp('sunwarddeep')], ['Storm Temple (Cloudreach)',()=>tp('skydeep')],
    ['Tideward Crypt (capstone)',()=>tp('embertomb')],
    ['★ Set Act II return phase (Veil + 4 gifts)',()=>enterReturnPhase()],
  ]],
  ['Copy test link (share)', [
    ['Emberdeep',()=>copyDungeonLink('eastdeep')], ['Underclimb',()=>copyDungeonLink('aeriedeep')],
    ['Rimefissure',()=>copyDungeonLink('frostdeep')], ['Glacier Vault',()=>copyDungeonLink('frostvault')],
    ['Drowned Catacomb',()=>copyDungeonLink('reachdeep')], ['Undermill',()=>copyDungeonLink('milldeep')],
    ['Undermaw',()=>copyDungeonLink('undermaw')], ['Rainbow Road',()=>copyDungeonLink('skydungeon')],
  ]],
  ['Story / Act', [
    ['Act I',()=>setAct(1)], ['Act II',()=>setAct(2)], ['Act III',()=>setAct(3)],
    ['★ Act II return phase (Veil + 4 gifts + refresh isles)',()=>enterReturnPhase()],
    ['Reset Act I ending (replay)',()=>resetActOneEnding()],
  ]],
  // Every animated overlay cutscene, playable on demand from anywhere - they pause the
  // world, draw their own full-frame scene, and hand back when done. The freeing/ending
  // scenes are given a harmless no-op continuation here so previewing them has no side
  // effects (no dragon awoken, no leviathan sunk, no act advanced).
  ['Cutscenes (play any)', [
    ['Mask reveal - memory flood (Act I)',()=>playCutscene('mask')],
    ['Act I climax - throne hall',()=>playCutscene('throne')],
    ['Act I epilogue - the sea crossing',()=>playCutscene('epilogue')],
    ['Ashwing ENTHRALLED (dragon bound)',()=>playCutscene('dragonEnthrall')],
    ['Ashwing FREED (dragon)',()=>playCutscene('dragonFreed')],
    ['Leviathan UNBOUND (freed)',()=>playCutscene('leviathan')],
    ['Weeping Warden FREED (frost)',()=>playCutscene('warden')],
    ['Rimebound FREED (deep ice)',()=>playCutscene('rimebound')],
    ['Storm-Eye CLOSES (sky finale)',()=>playCutscene('stormeye')],
    ['Vath BOUND (Act I villain sealed)',()=>playCutscene('vath')],
    ['The TOME BURNS (aerie freed)',()=>playCutscene('aerie')],
    ['The WARDING VEIL (Jaist casts)',()=>playCutscene('veil')],
  ]],
  // Free = mark defeated; Reset = un-defeat (stand the boss back up). One tidy
  // section instead of two. (The deep-dungeon bosses have their own toggles below.)
  ['Bosses & curses', [
    ['Free Dragon',()=>freeCurse('dragon')], ['Free Leviathan',()=>freeCurse('tide')],
    ['Free Aerie',()=>freeCurse('aerie')], ['Free Frozen',()=>freeCurse('frost')],
    ['Free ALL',()=>freeCurse('all')],
    ['Reset Dragon',()=>resetCurse('dragon')], ['Reset Leviathan',()=>resetCurse('tide')],
    ['Reset Aerie',()=>resetCurse('aerie')], ['Reset Frozen',()=>resetCurse('frost')],
    ['Reset ALL',()=>resetCurse('all')], ['Clear foes here',()=>clearMobs()],
    // named bosses (Hollow Spirit & co.): fell whatever boss stands on THIS map for
    // real, or mark the Hollow Spirit down from anywhere.
    ['★ Defeat boss(es) on THIS map',()=>defeatBossesHere()],
    ['Mark Hollow Spirit defeated',()=>markHollowDefeated()],
  ]],
  ['Dungeons Act I (tap to toggle won / not)',
    DUNGEONS.map(([name,id,flag])=> [name, ()=>toggleDungeon(id,flag), {dflag:flag,dname:name}])
      .concat([ ['★ Clear ALL dungeon state', ()=>clearDungeonState()],
                ['Reset ALL dungeons', ()=>{ DUNGEONS.concat(DUNGEONS2).forEach(([n,i,f])=>setDungeon(i,f,false)); note('All dungeons reset'); }],
                ['Win ALL dungeons',   ()=>{ DUNGEONS.concat(DUNGEONS2).forEach(([n,i,f])=>setDungeon(i,f,true));  note('All dungeons won'); }] ])
  ],
  ['Dungeons Act II · returned isles (toggle won / not)',
    DUNGEONS2.map(([name,id,flag])=> [name, ()=>toggleDungeon(id,flag), {dflag:flag,dname:name}])
  ],
  // Grant one ability at a time - so a tester can step through the gates in order
  // instead of the all-at-once "Unlock all abilities" in the Hero section.
  ['Unlock (one at a time)', [
    ['Sword (iron)',()=>unlockSword()], ['Axe (iron · t1)',()=>grantIronAxe()],
    ['Pickaxe (iron · t1)',()=>grantIronPick()], ['Dash',()=>unlockDashDev()],
    ['Bow',()=>unlockBowDev()], ['Parry',()=>unlockParryDev()],
  ]],
  ['Quests', [
    ['Complete active quests',()=>completeActive()],
    // mark every quest for a whole island done (see ISLAND_GIVERS)
    ['✓ Emberwick',()=>completeIslandQuests('isle')], ['✓ Barik',()=>completeIslandQuests('main')],
    ['✓ Sunward',()=>completeIslandQuests('east')], ['✓ Windsurf',()=>completeIslandQuests('wind')],
    ['✓ Cloudreach',()=>completeIslandQuests('sky')], ['✓ Stormreach',()=>completeIslandQuests('reach')],
    ['✓ Aerie',()=>completeIslandQuests('aerie')], ['✓ Frozen',()=>completeIslandQuests('frost')],
    ['✓ Aldermere',()=>completeIslandQuests('crown')],
  ]],
  ['Hero', [
    ['+1000 gold',()=>gold(1000)], ['+2000 XP',()=>xp(2000)], ['Full heal',()=>heal()],
    ['Unlock all abilities',()=>unlockAll()], ['Boost skills',()=>maxSkills()],
    ['God mode: off',(b)=>toggleGod(b)], ['Float mode: off',(b)=>toggleFloat(b)],
  ]],
  ['Gathering tools & gates', [
    ['★ Sandbox: spawn gated walls here (no tools yet)',()=>{ if(typeof spawnToolgateSandbox==='function') spawnToolgateSandbox(); ui(); }],
    ['Grant Rivenedge Axe (tier 2)',()=>{ if(typeof grantRivenedge==='function') grantRivenedge(); ui(); }],
    ['Grant Cragbreaker Pick (tier 2)',()=>{ if(typeof grantCragbreaker==='function') grantCragbreaker(); ui(); }],
    ['Grant Cograzor Pick (tier 3)',()=>{ if(typeof grantCograzor==='function') grantCograzor(); ui(); }],
    ['Grant Emberbreaker Pick (tier 4)',()=>{ if(typeof grantEmberbreaker==='function') grantEmberbreaker(); ui(); }],
    ['Reset tools to iron (tier 1)',()=>{ P.tools=P.tools||{}; P.tools.axe=Math.min(P.tools.axe||0,1); P.tools.pick=Math.min(P.tools.pick||0,1); ui(); note('Tools reset to iron'); }],
    ['Reset Barik ward (re-wall the farm + Corvo)',()=>{ P.story=P.story||{}; P.story.tg=P.story.tg||{}; delete P.story.tg['main:heddaward'];
      // force a true fresh regen of Barik so the full placer sequence (incl. placeBarikWard) runs.
      // if we're standing on main, leave first (that snapshots the ward-less copy), THEN drop the
      // cache so the return trip regenerates from scratch.
      if(G.worldId==='main'){ switchWorld('isle'); }
      if(typeof WORLDS!=='undefined') delete WORLDS.main;
      switchWorld('main');
      ui(); note('Barik ward reset - the violet wall is back up (needs a tier-2 pick again)'); }],
  ]],
  ['System', [
    ['Save now',()=>saveNow()], ['Reload page',()=>location.reload()],
  ]],
];

let _openSec=-1;   // which section is expanded (accordion: one at a time). -1 = all collapsed.
function build(){
  if(panelEl()) return;
  const p=document.createElement('div'); p.id='devMenu';
  // Clamp to the VISIBLE viewport (dvh) so an expanded section can always be
  // scrolled to its end - plain 86vh uses the layout viewport, which on mobile
  // hides behind the browser toolbar. 86vh stays as a fallback for old browsers.
  p.style.cssText='position:fixed;top:34px;left:8px;z-index:99999;width:206px;'+
    'max-height:86vh;max-height:calc(100dvh - 44px);'+
    'overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;'+
    'display:none;padding:8px 9px 10px;border-radius:10px;background:rgba(14,10,6,.95);'+
    'border:1px solid #4a3826;box-shadow:0 6px 24px rgba(0,0,0,.55);font-family:Verdana,sans-serif;color:#e8dcc4;';
  const head=document.createElement('div');
  head.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;';
  head.innerHTML='<b style="font-size:12px;letter-spacing:.5px;color:#ffb26b;">DEV MENU</b>'+
    '<span id="devClose" style="cursor:pointer;font-size:14px;color:#c9a24e;padding:0 4px;">✕</span>';
  p.appendChild(head);
  const hint=document.createElement('div');
  hint.style.cssText='font-size:9px;color:#9a8a70;margin-bottom:5px;';
  hint.innerHTML='Press <b>`</b> to toggle · tap a heading to open';
  p.appendChild(hint);

  const boxes=[];
  SECTIONS.forEach((sec,si)=>{
    const hdr=document.createElement('div');
    hdr.style.cssText='font-size:9.5px;letter-spacing:.4px;color:#c98a4a;text-transform:uppercase;'+
      'margin-top:3px;padding:4px 2px;cursor:pointer;user-select:none;border-top:1px solid #33281a;'+
      'display:flex;justify-content:space-between;align-items:center;';
    hdr.innerHTML='<span>'+sec[0]+'</span><span class="dv-car" style="color:#7a6244;">▸</span>';
    const box=document.createElement('div');
    box.style.cssText='display:none;flex-wrap:wrap;gap:4px;padding:3px 0 4px;';
    boxes.push(box);
    hdr.onclick=(ev)=>{ ev.stopPropagation();
      const wasOpen = box.style.display!=='none';
      boxes.forEach((bx,i)=>{ bx.style.display='none';                      // accordion: close others
        const c=bx.previousSibling && bx.previousSibling.querySelector('.dv-car'); if(c) c.textContent='▸'; });
      if(!wasOpen){ box.style.display='flex'; hdr.querySelector('.dv-car').textContent='▾'; _openSec=si;
        try{ refreshDungeonLabels(); }catch(e){} } else { _openSec=-1; }
    };
    sec[1].forEach(([label,fn,meta])=>{
      const b=document.createElement('button');
      b.textContent=label;
      if(meta && meta.dflag){ b.setAttribute('data-dflag',meta.dflag); b.setAttribute('data-dname',meta.dname);
        try{ b.textContent=dungLabel(meta.dname,meta.dflag); }catch(e){} }
      b.style.cssText='flex:1 1 auto;min-width:60px;font-size:10px;padding:4px 5px;cursor:pointer;'+
        'background:#2b2013;color:#e8dcc4;border:1px solid #4a3826;border-radius:5px;';
      b.onmouseover=()=>b.style.background='#3a2c1a'; b.onmouseout=()=>b.style.background='#2b2013';
      b.onclick=(ev)=>{ ev.stopPropagation(); try{ fn(b); }catch(e){ note('err: '+e.message); } };
      box.appendChild(b);
    });
    p.appendChild(hdr); p.appendChild(box);
  });
  head.querySelector('#devClose').onclick=()=>toggle(false);
  document.body.appendChild(p);

  // a tiny always-visible tab to open it on touch devices
  const tab=document.createElement('div'); tab.id='devTab';
  tab.textContent='DEV';
  tab.style.cssText='position:fixed;top:8px;left:8px;z-index:99998;font:bold 10px Verdana;color:#ffb26b;'+
    'background:rgba(14,10,6,.8);border:1px solid #4a3826;border-radius:6px;padding:3px 7px;cursor:pointer;opacity:.6;';
  tab.onclick=()=>toggle();
  document.body.appendChild(tab);
}
function panelEl(){ return document.getElementById('devMenu'); }
function toggle(force){
  build(); const p=panelEl(); if(!p) return;
  const show = (force===undefined)? (p.style.display==='none') : force;
  p.style.display= show? 'block':'none';
  if(show) try{ refreshDungeonLabels(); }catch(e){}
}

window.addEventListener('keydown',(e)=>{
  if(e.key==='`'||e.key==='~'){
    const t=e.target; if(t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA')) return;
    e.preventDefault(); toggle();
  }
});
// build the tab once the DOM/game is ready
if(document.body) build(); else window.addEventListener('DOMContentLoaded',build);
})();
