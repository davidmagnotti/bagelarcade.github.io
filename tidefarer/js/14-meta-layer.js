/* =====================================================================
   META LAYER - achievements, save codes, gamepad
   ===================================================================== */
P.stats=P.stats||{}; P.ach=P.ach||{}; P.combo=0; P.comboT=0;

const ACH={
  firstblood:{t:'First Blood',d:'Slay your first foe.'},
  slayer:{t:'Slayer',d:'Defeat 25 foes.'},
  woodsman:{t:'Woodsman',d:'Gather wood 15 times.'},
  stonebreaker:{t:'Stonebreaker',d:'Gather stone 15 times.'},
  angler:{t:'Angler',d:'Catch 5 fish.'},
  greenthumb:{t:'Green Thumb',d:'Harvest 5 wheat.'},
  plunderer:{t:'Plunderer',d:'Open 4 treasure chests.'},
  globetrotter:{t:'Across the Strait',d:'Reach the mainland.'},
  kingslayer:{t:'Kingslayer',d:'Fell the Hollow Spirit.'},
  wayfarer:{t:'Wayfarer',d:'Chart every region of an island.'},
  // ---- the other named bosses of the archipelago (awarded on their defeat) ----
  gravebane:{t:'Gravebane',d:'Unmake Gravelord Varek in the Old Ruins.'},
  vaelbreaker:{t:'Vael-Breaker',d:'Fell the Castellan of the Vael.'},
  tidebreaker:{t:'Tidebreaker',d:'Break the curse on the Bound Leviathan.'},
  tomewarden:{t:"Warden's Bane",d:'Slay the serpent guarding the cursed tome.'},
  dragonsworn:{t:'Dragonsworn',d:"Shatter Ashwing's binding atop Mount Kea."},
  thawwarden:{t:'Thawbringer',d:'Free the Weeping Warden from the ice.'},
  rimebreaker:{t:'Rimebreaker',d:'Free the Rimebound in the Glacier Vault.'},
  bearslayer:{t:'Bear-Slayer',d:'Slay the Hoarfrost Bear on the Rimewood.'},
  cogbreaker:{t:'Cog-Breaker',d:"Free the Undermill's seized gear-train."},
  rocslayer:{t:'Roc-Slayer',d:'Down the Storm Roc atop the Cloudreach.'},
  brutebane:{t:'Brute-Bane',d:'Put the Barrow Brute back in its barrow.'},
  deepwarden:{t:'Maze-Breaker',d:'Put down the Drowned Minotaur in the Stormreach catacomb.'},
  stormbreaker:{t:'Storm-Breaker',d:'Close the Storm-Eye and calm the high wind.'},
  enchantersbane:{t:"The Enchanter's Bane",d:'Bind Vath the enchanter for good.'}
};
function award(id){
  if(!ACH[id] || P.ach[id]) return;
  P.ach[id]=true;
  banner('ACHIEVEMENT', ACH[id].t+' - '+ACH[id].d);
  Snd.quest();
}
// Felling (or freeing) a named boss grants its achievement, deduped inside award()
// so a respawn never re-triggers the banner.
function bossReward(m){
  P.ach=P.ach||{};
  const key = m.ach || (m.kind==='boss' ? 'kingslayer' : null);
  if(!key || !ACH[key]) return;
  award(key);
}
function bumpStat(k,n){ P.stats[k]=(P.stats[k]||0)+(n||1); checkStats(); }
function checkStats(){
  const s=P.stats;
  if((s.wood||0)>=15) award('woodsman');
  if((s.stone||0)>=15) award('stonebreaker');
  if((s.fish||0)>=5) award('angler');
  if((s.wheat||0)>=5) award('greenthumb');
  if((s.kills||0)>=1) award('firstblood');
  if((s.kills||0)>=25) award('slayer');
  if((s.chests||0)>=4) award('plunderer');
  if((s.ore||0)>=5) award('prospector');
  if((s.pearl||0)>=1) award('pearldiver');
}

/* ---------- save codes (copy/paste - survives page reloads) ---------- */
function worldFlagsFrom(mobs,decor){
  return {
    bossDead: mobs.some(m=>m.boss&&m.dead),
    chests: decor.filter(b=>b.kind==='chestOpen').map(b=>[Math.round(b.x*2),Math.round(b.y*2)])
  };
}
function saveCode(){
  const flags={};
  flags[G.worldId]=worldFlagsFrom(G.mobs,G.decor);
  for(const id in WORLDS){ if(id!==G.worldId) flags[id]=worldFlagsFrom(WORLDS[id].mobs,WORLDS[id].decor); }
  const d={v:2,world:G.worldId,x:+P.x.toFixed(2),y:+P.y.toFixed(2),
    gold:P.gold,hp:Math.round(P.hp),maxhp:P.maxhp,arrows:Math.floor(P.arrows||0),maxArrows:P.maxArrows||20,
    inv:P.inv,skills:P.skills,quests:P.quests,prog:P.prog,
    unlocked:P.unlocked,swordTier:P.swordTier,armor:P.armor,armorOwn:P.armorOwn||0,kit:!!P.kit,rod:!!P.rod,es:P.earlySail?1:0,ek:P.earlyKit?1:0,dyt:+(G.dayT||0).toFixed(3),lv:P.level,xl:P.xpL,bk:P.bank,vault:P.vault||{},gritLv:P.gritLv||0,gritN:P.gritN||0,spell:P.spell||'bolt',spells:P.spells||{},qi:P.quickItem||'potion',bind:P.bind,hs:P.horse?1:0,hm:P.home?1:0,hu:P.homeUp,tools:P.tools,rr:P.resortRoom?1:0,
    projects:P.projects,contract:P.contract,lore:P.loreRead,stats:P.stats,ach:P.ach,
    perks:P.perks||{},perkAvail:P.perkAvail||{},
    story:P.story||{act:1,necklace:true},
    disc:P.disc||{},met:P.met||{},expl:packExpl(),flags};
  // Remember an open conversation so exiting mid-dialogue resumes it on return
  // (only a real NPC talk - transient stalls/shop sub-menus are not restored).
  if(typeof dlg!=='undefined' && dlg.open && dlg.npc && dlg.npc.id) d.dnpc=dlg.npc.id;
  return btoa(unescape(encodeURIComponent(JSON.stringify(d))));
}
function applyWorldFlags(f){
  if(!f) return;
  if(f.bossDead){ const b=G.mobs.find(m=>m.boss); if(b){b.dead=true;b.respawnT=-1;} G.flags.intro_boss=true;
    // the King's bone-guard fell with him - never respawn the northern-spit skeletons on reload
    for(const o of G.mobs){ if(o.kind==='skeleton'){ o.dead=true; o.respawnT=-1; } } }
  for(const c of (f.chests||[])){
    const ch=G.decor.find(b=>b.kind==='chest'&&Math.round(b.x*2)===c[0]&&Math.round(b.y*2)===c[1]);
    if(ch){ ch.opened=true; ch.kind='chestOpen'; }
  }
}
function loadCode(str){
  let d;
  try{ d=JSON.parse(decodeURIComponent(escape(atob((str||'').trim())))); if(!d||!d.v) throw 0; }
  catch(e){ return false; }
  // rebuild the isle fresh
  for(const k in WORLDS) delete WORLDS[k];
  const iso=WORLD_DEFS.isle;
  MAPW=iso.W; MAPH=iso.H; SEED=iso.seed; ZONES=iso.zones;
  G.map=new Uint8Array(MAPW*MAPH); G.solid=new Uint8Array(MAPW*MAPH); G.variant=new Uint8Array(MAPW*MAPH);
  G.nodes=[]; G.decor=[]; G.plots=[]; G.npcs=[]; G.mobs=[]; G.foam=[]; G.crows=[];
  G.decals=[]; G.cat=null; G.forgePos=null;
  G.projs.length=0; G.parts.length=0; G.floats.length=0; G.fogs.length=0; G.fireflies.length=0;
  G.worldId='isle';
  P.projects={}; // cleared before regen; restored (and re-placed) below
  iso.gen();
  // restore hero first (switchWorld reads quest state)
  P.gold=Math.round(+d.gold)||0; // saves from the string-gold era heal on load
  P.maxhp=d.maxhp||100; P.hp=Math.min(d.hp||d.maxhp||100,P.maxhp);
  P.inv=d.inv||{}; if(d.skills) P.skills=d.skills;
  // Clamp skills to the 100 mastery cap (older saves / dev boosts could exceed it).
  {const cap=(typeof MAX_SKILL_LVL!=='undefined')?MAX_SKILL_LVL:100;
   for(const k in P.skills){ const sk=P.skills[k]; if(sk && sk.lvl>=cap){ sk.lvl=cap; sk.xp=0; } }}
  P.quests=d.quests||{}; P.prog=d.prog||{};
  // One-time migration: anyone who felled the wyrm under the PRE-rework version
  // never saw the inside-the-volcano scene or the faint-not-die twist. The new
  // freeing path always sets `eastDragonFreed`; an old completion never did - so
  // wyrm-done-but-not-eastDragonFreed uniquely marks an old save. Roll the whole
  // Ashwing chain back so it can be replayed fresh. Guarded to fire only once.
  if(qs('wyrm')==='done' && !P.eastDragonFreed && !P.prog.wyrmReplayed){
    P.prog.wyrmReplayed=1;
    delete P.quests.wyrm;   // re-offered as 'avail' on entering the east isle
    delete P.quests.vhunt; delete P.prog.vhunt;   // scrub any stale hunt from an in-between build
    P.metDragon=0; P.mageHuntStarted=0; P.eastDragonFought=0; P.eastDragonFreed=0;
  }
  // A save from the in-between build may carry an ACTIVE grove hunt that can no longer
  // be finished (the mage no longer spawns). If Ashwing is already freed, retire it so
  // it isn't stuck forever in the quest log with a marker on an empty grove.
  if(P.eastDragonFreed && P.quests && P.quests.vhunt && P.quests.vhunt!=='done'){
    delete P.quests.vhunt; delete P.prog.vhunt;
  }
  P.unlocked=d.unlocked||{}; P.swordTier=d.swordTier||0;
  // Safety net: the timed parry is Rask's learned guard, and it's the only defence
  // against the enemies' white-! blows. Normally you can't leave Emberwick without it
  // (Maren gates the crossing behind it), but a dev-jumped or otherwise skipped-ahead
  // save can land on the far isles unable to parry at all. If you're past the tutorial
  // (the King's audience is done, or you've crossed into Act II) grant the guard back.
  if((P.story && (P.story.kingTold || (P.story.act||1)>=2)) && !P.unlocked.parry) P.unlocked.parry=true;
  P.tools=d.tools||{axe:0,pick:0}; P.armor=d.armor||0;
  // The relic verbs (Lodestone, Blast Charge) were folded into the tiered picks:
  // their gated nooks are now slagiron / emberstone gate rooms. Grant returning
  // players the pick that replaced each relic they'd earned (never downgrade), then
  // strip the dead items + unlock flags so the inventory panel never reads a missing
  // ITEMS entry and the earned nooks stay openable.
  if(P.inv){
    if(P.unlocked.lodestone){ P.tools.pick=Math.max(P.tools.pick||0,3); P.inv.cograzor=P.inv.cograzor||1; }
    if(P.unlocked.bomb){      P.tools.pick=Math.max(P.tools.pick||0,4); P.inv.emberbreaker=P.inv.emberbreaker||1; }
    delete P.inv.lodestone; delete P.inv.blastcharge;
  }
  delete P.unlocked.lodestone; delete P.unlocked.bomb;
  P.armorOwn=Math.max(d.armorOwn||0, P.armor||0);
  if(P.swordTier>0 || qs('sharpen')==='done') P.unlocked.melee=true; // migrate older saves
  // dash is now a taught ability (mage-tower orb). Grandfather any save past the
  // opening minutes so no returning player ever loses their footwork.
  // Grandfather the dash onto OLD saves only - ones that have already left the
  // tutorial isle (so pre-rework players aren't stranded without it). On Emberwick
  // itself the dash is properly taught by Orin, and having a sword or a level is NOT
  // enough to grant it - otherwise every new player gets it the moment they're armed.
  if(!P.unlocked.dash && d.world && d.world!=='isle') P.unlocked.dash=true;
  // the quiver: give the bow its 20-shaft ammo on any save that predates it
  P.maxArrows = d.maxArrows || P.maxArrows || 20;
  P.arrows = (typeof d.arrows==='number') ? d.arrows : P.maxArrows;
  P.kit = !!d.kit || P.swordTier>0 || qs('kit')==='done' || qs('sharpen')==='done';
  // Fishing now takes a rod (Finn's gift on the SE shore). Grandfather every prior save -
  // they could already fish, so a rod is missing only because it predates this change.
  P.rod = ('rod' in d) ? !!d.rod : true;
  P.earlySail=!!d.es; P.earlyKit=!!d.ek;
  if(typeof d.dyt==='number') G.dayT=d.dyt;
  P.level=d.lv||1; P.xpL=d.xl||0; P.bank=d.bk||0; P.vault=d.vault||{}; P.gritLv=d.gritLv||0; P.gritN=d.gritN||0; P.spell=d.spell||'bolt'; P.spells=d.spells||{}; P.quickItem=d.qi||'potion'; P.bind=d.bind||null;
  P.horse=d.hs?1:0; P.home=d.hm?1:0; P.homeUp=d.hu||{}; P.resortRoom=d.rr?1:0;
  P.perks=d.perks||{}; P.perkAvail=d.perkAvail||{};
  if(typeof syncPerkAvailability==='function') syncPerkAvailability();

  P.projects=d.projects||{}; P.contract=d.contract||0; P.loreRead=d.lore||{};
  P.stats=d.stats||{}; P.ach=d.ach||{};
  P.story=d.story||{act:1,necklace:true}; if(P.story.necklace===undefined) P.story.necklace=true;
  // Backfill the isle-cleared record from older saves: anyone who already felled a
  // region's boss should find its nights already quiet on return.
  P.story.bossCleared=P.story.bossCleared||{};
  if(P.story.reachBossDown) P.story.bossCleared.reach=1;
  if(P.story.tombBossDown) P.story.bossCleared.reach=1;
  if(P.story.iceBearDown) P.story.bossCleared.frost=1;
  if(P.story.frostFreed) P.story.bossCleared.frost=1;
  if(P.story.rocDown||P.story.skyDungeonDone) P.story.bossCleared.sky=1;
  // The half-again dash was retired. Any save that beat the Gale Spire keeps its Swiftstep
  // charm as the QUICKER-dash boon now (and old saves carrying the dead dashfar flag lose it).
  if(P.story.galeDeepDone){ P.unlocked=P.unlocked||{}; P.unlocked.swiftstep=true; }
  if(P.unlocked && P.unlocked.dashfar) delete P.unlocked.dashfar;
  if(P.story.aerieFreed) P.story.bossCleared.aerie=1;
  if(P.story.deepDone||P.story.tideCalm) P.story.bossCleared.east=1;
  if(P.story.undermawDown||P.story.millDone) P.story.bossCleared.main=1;
  // Warding Veil catch-up: the Veil now comes from the Rimefissure's reward chest (the
  // Hush-Frost Spellbook), read into a spell by your brother. Credit the book to any Act II
  // save that already cleared the Rimefissure (deepDone) but predates this flow, so they can
  // complete the casting with Leo on the Frozen Isle and reopen the old islands. Saves that
  // already earned the Veil under the old rules keep it (guarded by !vathVeil).
  if(P.story.deepDone && P.story.act2 && !P.story.vathVeil && !P.story.veilTome){
    P.story.veilTome=1; P.inv=P.inv||{}; P.inv.veilrune=(P.inv.veilrune||0)+1;
  }
  // Act II returned-isle catch-up: retire the old isles' Act I quest-board work on existing Act II
  // saves (one-time). The isle worlds themselves are dropped from the cache on every load below, so
  // they already regenerate into their damaged/restored state - only the stale 'avail' Act I quests
  // need clearing (accepted/finished quests and the Duchess chain are preserved).
  if(P.story.act2 && !P.story.mig104){ P.story.mig104=1;
    if(typeof purgeAct1AvailQuests==='function') purgeAct1AvailQuests(); }
  // The Emberwick mask rides the whole journey. Restore it for saves made before it
  // existed - unless the player has already reached the unmasking (or the old finale).
  if(P.story.masked===undefined){
    P.story.masked = (P.story.unmasked||P.story.remembered||P.story.princeWoke||P.story.finale||P.story.act1End) ? 0 : 1;
  }
  // Act catch-up: a save made before the finale existed can have the King's audience
  // done (kingTold) yet no way onward, since the pendant trail only launches on the
  // audience-completion click. Re-open it so returning players can finish. Guarded to
  // never fire once the unmasking / capital finale is underway or done.
  if(P.story.kingTold && !P.story.vathBound && !P.story.princeWoke && !P.story.unmasked && !P.story.act1End
     && !P.quests.pendant && !P.quests.enchanter && !P.quests.homecoming){
    P.quests.pendant='active'; P.prog.pendant=P.prog.pendant||0;
    setTimeout(()=>{ try{ toast('<b style="color:var(--ember)">The pendant still burns to be understood.</b> Sail to <b>Emberwick</b> and show it to <b>Sage Orin</b> at his tower.',7000); }catch(e){} }, 2600);
  }
  // Unstick the Orin -> Woodworker hand-off for saves made while it shipped as an
  // 'avail' offer: Orin has read the ward (pendant done) but the Woodworker leg was
  // left waiting to be re-accepted at Orin, where a lingering 'avail' side-quest could
  // bury it and dead-end the trail. Promote it to an active quest so the marker leads
  // straight to the woodpile, matching Orin's own words. Guarded past the reveal.
  // The ward has been read (Orin's leg done) but the Woodworker leg isn't running:
  // either it shipped as an 'avail' offer that could be buried at Orin, or - on
  // older saves - the ward-reading was recorded before the pendant quest ever
  // launched 'enchanter', so no quest exists at all. Either way the trail dead-ends
  // between Orin and the woodpile. Key off wardRead (not just the 'avail' state) so
  // both cases self-heal on load: promote/create the leg as active so the marker
  // leads straight to the green. Guarded past the reveal so it never re-fires.
  if(P.story.wardRead && qs('enchanter')!=='active' && !P.story.unmasked && !P.story.act1End){
    P.quests.enchanter='active'; P.prog.enchanter=P.prog.enchanter||0;
    setTimeout(()=>{ try{ toast('<b style="color:var(--ember)">Show the pendant to the Woodworker</b> down by the green on <b>Emberwick</b>, as Sage Orin bid you.',7000); }catch(e){} }, 2600);
  }
  // Repair the over-aggressive Windsurf re-gate that briefly shipped: it could
  // strip surf from a save that had legitimately earned a board. Anyone who
  // completed Tolen's board quest under the old rules got a windsurf outright
  // (there was no sail dungeon then), so board-done + no sail quest = a real board
  // that must not be lost. Restore it. New-flow saves mid-dungeon carry a `sail`
  // quest, so they are left to finish the Undermill. Idempotent + harmless.
  if(qs('board')==='done' && !P.quests.sail && !(P.unlocked && P.unlocked.surf)){
    P.unlocked=P.unlocked||{}; P.unlocked.surf=true;
  }
  P.disc=d.disc||{}; P.met=d.met||{}; unpackExpl(d.expl);
  P.dead=false; P.fishing=null; P.combo=0; P.rollT=0;
  applyWorldFlags(d.flags&&d.flags.isle);
  if(P.projects.lanes) placeLaneLamps();
  ensureGravelord(false);
  if(d.world==='main'){
    switchWorld('main');
    applyWorldFlags(d.flags&&d.flags.main);
  } else if(d.world==='east'){
    // the Sunward Isle was never restored on load - the loader stayed on the
    // tutorial isle while applying the saved east coordinates, dropping the
    // hero into open water. Rebuild the east world so its coords are valid.
    switchWorld('east');
    applyWorldFlags(d.flags&&d.flags.east);
  } else if(d.world==='wind'){
    switchWorld('wind');
    applyWorldFlags(d.flags&&d.flags.wind);
  } else if(d.world==='aerie'){
    switchWorld('aerie');
    applyWorldFlags(d.flags&&d.flags.aerie);
  } else if(d.world==='frost'){
    switchWorld('frost');
    applyWorldFlags(d.flags&&d.flags.frost);
  } else if(d.world==='crown'){
    switchWorld('crown');
    applyWorldFlags(d.flags&&d.flags.crown);
  } else if(d.world==='sky'){       // the Cloudreach (Ashwing is there to fly you back)
    switchWorld('sky');
  } else if(d.world==='reach'){     // Stormreach (boss respawn gated by P.story flags)
    switchWorld('reach');
  }
  // Dungeons regenerate from a fixed seed (so the layout comes back identical) but
  // hold only transient puzzle state - so a save made inside one can be restored right
  // back into the dungeon at the same spot, not dumped at the parent isle's landing.
  // First rebuild the parent isle with its saved flags: switchWorld then caches that
  // correct parent state, so the dungeon's "way up" exit returns there properly. Then
  // descend into the dungeon itself and let the saved coordinates below resume the hero.
  const DUNGEON_PARENT={eastdeep:'east', frostdeep:'frost', frostvault:'frost', aeriedeep:'aerie', reachdeep:'reach', milldeep:'wind', undermaw:'main', skydungeon:'sky',
    // Act II return dungeons: without these, a save made inside one falls through to the default
    // tutorial isle and drops the hero at their dungeon coords - straight into the Hollow Spirit's
    // court. Restore each into its own dungeon, over its correct parent isle instead.
    barikdeep:'main', winddeep:'wind', sunwarddeep:'east', skydeep:'sky', embertomb:'isle'};
  if(DUNGEON_PARENT[d.world]){
    const par=DUNGEON_PARENT[d.world];
    switchWorld(par);
    applyWorldFlags(d.flags&&d.flags[par]);
    switchWorld(d.world);
    applyWorldFlags(d.flags&&d.flags[d.world]);
  }
  P.x=d.x; P.y=d.y;
  // The Rainbow Road is a chain of tiny cloud-isles separated by open-sky GAPS you dash
  // across - so the whole floor between isles is "fall" tiles, not solid ground. A periodic
  // autosave easily catches the hero mid-dash over a gap; resuming at that exact tile would
  // drop them, and the generic safety net below would fling them all the way to the far
  // start. Snap instead to the NEAREST sky-isle to where they saved - safe footing that
  // keeps their progress, exactly how the road's own fall-respawn bears you to an isle.
  if(G.worldId==='skydungeon' && typeof SKY_ISLES!=='undefined'){
    let best=null,bd=1e9;
    for(const is of SKY_ISLES){ const dd=dist(d.x,d.y,is.x,is.y); if(dd<bd){ bd=dd; best=is; } }
    if(best){ P.x=best.x+0.5; P.y=best.y+2.0; }
  }
  // Safety net: whatever the world, never wake up in water or inside a wall.
  if(!inb(P.x|0,P.y|0) || !walkTile(tileAt(P.x|0,P.y|0)) || solidAt(P.x|0,P.y|0)){
    const dsp=(WORLD_DEFS[G.worldId]&&WORLD_DEFS[G.worldId].spawn)||{x:P.x,y:P.y};
    const sp=findOpenNear(Math.round(P.x)||Math.round(dsp.x), Math.round(P.y)||Math.round(dsp.y), 14)
           || findOpenNear(Math.round(dsp.x), Math.round(dsp.y), 20)
           || [dsp.x, dsp.y];
    P.x=sp[0]+0.5; P.y=sp[1]+0.5;
  }
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  updateQuestUI(); buildHotbar(); refreshUI(); refreshSkillsPanel();
  closeAllPanels();
  banner('SAVE LOADED','WELCOME BACK, HERO');
  Snd.quest();
  // Resume a conversation left open when the app was exited: re-open the same NPC's
  // dialogue so the player lands back in the scene they were reading, not the world.
  if(d.dnpc && typeof openDialog==='function'){
    const dn=(G.npcs||[]).find(n=>n.id===d.dnpc && !n.dead);
    if(dn) setTimeout(()=>{ try{ openDialog(dn); }catch(e){} }, 60);
  }
  return true;
}

/* ---------- gamepad: stick to move, A attack, B roll, X interact,
   Y potion, bumpers swap weapon, Start quest log ---------- */
let gpPrev=[];
function pollGamepad(){
  if(pollGamepad._blocked) return;
  let pads=null;
  try{ pads = navigator.getGamepads? navigator.getGamepads() : null; }
  catch(e){ pollGamepad._blocked=true; input.gpDir=null; return; } // permissions policy denies gamepad here - stop asking
  const gp = pads && pads[0];
  input.gpDir=null;
  if(!gp) return;
  const ax=gp.axes[0]||0, ay=gp.axes[1]||0, mag=Math.hypot(ax,ay);
  if(mag>0.22){
    const wx=(ax/(TW/2)+ay/(TH/2))/2, wy=(ay/(TH/2)-ax/(TW/2))/2;
    const wl=Math.hypot(wx,wy)||1;
    input.gpDir={x:wx/wl*Math.min(1,mag), y:wy/wl*Math.min(1,mag)};
  }
  const b=i=> !!(gp.buttons[i]&&gp.buttons[i].pressed);
  const edge=i=> b(i)&&!gpPrev[i];
  if(G.state==='title' && (edge(0)||edge(9))){
    const c=document.getElementById('continueBtn');
    const s=document.getElementById('startBtn');
    if(c.style.display!=='none' && c.style.display!=='') { if(c.onclick) c.onclick(); }
    else if(store.get()){ if(c.onclick) c.onclick(); }
    else if(s.onclick) s.onclick();
  }
  if(G.state==='play' && !dlg.open){
    if(b(0)) tryAttack(false);
    if(edge(1)) tryRoll();
    if(edge(2)) doInteract();
    if(edge(3)) useItem(P.quickItem||'potion');
    if(edge(4)||edge(5)){
      const order=['melee','bow'].filter(w=> w==='melee'||P.unlocked[w]);
      let i=order.indexOf(P.weapon); if(i<0) i=0;
      i=(i+(edge(5)?1:order.length-1))%order.length;
      selectWeapon(order[i]);
    }
    if(edge(9)) togglePause();
  } else if(G.state==='play' && dlg.open && edge(0)){ doInteract(); }
  gpPrev=gp.buttons.map(x=>!!x.pressed);
}

