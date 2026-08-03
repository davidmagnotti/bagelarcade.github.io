/* =====================================================================
   INVENTORY / SKILLS / QUEST LOGIC
   ===================================================================== */
function give(item,n){ P.inv[item]=(P.inv[item]||0)+n;
  if(typeof bumpStat==='function') bumpStat(item,n);
  if(typeof questReadySweep==='function' && G.state==='play') questReadySweep();
  addFloat('+'+n+' '+ITEMS[item].name, P.x, P.y-1.4, '#ffe9a8'); Snd.pickup();
  refreshUI(); updateQuestUI(); }
function giveQuiet(item,n){ P.inv[item]=(P.inv[item]||0)+n; refreshUI(); }
function take(item,n){ P.inv[item]=Math.max(0,(P.inv[item]||0)-n); if(!P.inv[item]) delete P.inv[item]; refreshUI(); }
function has(item,n){ return (P.inv[item]||0)>=n; }
function giveGold(n){ n=Math.round(+n)||0; P.gold=(Math.round(+P.gold)||0)+n; P.stats.goldEarned=(P.stats.goldEarned||0)+n;
  addFloat('+'+n+' gold', P.x, P.y-1.4, '#ffd76a'); Snd.coin(); refreshUI(); }

function addXP(skill,amt){
  // SKILLS is the source of truth for what can gain XP. Retired skills (Mining,
  // Woodcutting) may still be named by old quest rewards or legacy saves - no-op them.
  const sk=P.skills[skill]; if(!sk || !SKILLS[skill]) return;
  const cap=(typeof MAX_SKILL_LVL!=='undefined')?MAX_SKILL_LVL:100;
  if(sk.lvl>=cap){ sk.lvl=cap; sk.xp=0; return; }   // already mastered - no more XP to gain
  sk.xp+=amt;
  addFloat('+'+amt+' '+SKILLS[skill].name+' XP', P.x, P.y-1.8, '#9be07f');
  while(sk.lvl<cap && sk.xp >= xpForLevel(sk.lvl)){
    sk.xp -= xpForLevel(sk.lvl); sk.lvl++;
    addFloat(SKILLS[skill].name+' Lv '+sk.lvl+'!', P.x, P.y-2.3, '#ffd76a', 1.6);
    burst(P.x,P.y-0.5,'#ffd76a',16); Snd.levelup();
    shockwave(P.x,P.y,'rgba(255,215,106,0.9)',40);
    banner(SKILLS[skill].name.toUpperCase()+' - LEVEL '+sk.lvl,
      sk.lvl>=cap ? 'Mastered - the highest rank' : SKILLS[skill].perk);
    P.cheerT=3;
  }
  if(sk.lvl>=cap) sk.xp=0;   // clamp any leftover XP once the cap is reached
  if(typeof checkPerkMilestone==='function') checkPerkMilestone(skill);
  refreshSkillsPanel();
}
/* --- Late-game difficulty tuning -----------------------------------------
   Weapon damage scales off skill levels (cap 100). Left purely linear, a maxed
   skill ran away from the *static* enemy HP table and made late bosses melt.
   dmgLvl() keeps the first DMG_SOFT_LVL skill levels at full value - so early
   and mid game are unchanged - then rolls further growth into a square-root
   curve (continuous in both value and slope at the seam). Mastery still bites,
   it just stops outpacing the content. TUNE: raise DMG_SOFT_LVL to push the
   flattening later, lower it to bite sooner. */
const DMG_SOFT_LVL = 15;
function dmgLvl(lvl){
  const s = DMG_SOFT_LVL;
  if(lvl <= s) return lvl;
  return s + 2*Math.sqrt(s)*(Math.sqrt(lvl) - Math.sqrt(s));
}
function meleeDmg(){ return Math.round(6 + P.swordTier*4 + dmgLvl(P.skills.melee.lvl)*2 + (has('charm',1)?3:0) + (has('warcharm',1)?5:0) + (has('relic',1)?4:0)); }
// The bow is now a hard-hitting, rationed weapon (a quiver of 20 that trickles
// back) - so each shaft bites far deeper than the old free-fire bow did.
function bowDmg(){ return Math.round(28 + dmgLvl(P.skills.archery.lvl)*4 + (has('charm',1)?6:0) + (has('warcharm',1)?10:0) + (has('relic',1)?8:0)); }
function magicDmg(){ return Math.round(8 + dmgLvl((P.skills&&P.skills.magic)?P.skills.magic.lvl:1)*3 + (has('charm',1)?3:0) + (has('warcharm',1)?5:0) + (has('relic',1)?4:0)); }

/* quest state: undefined=locked, 'avail','active','done' */
function qs(id){ return P.quests[id]; }
function questReady(id){
  const q=QUESTS[id];
  if(!q || qs(id)!=='active') return false;
  if(q.kind==='gather'){ for(const it in q.need) if(!has(it,q.need[it])) return false; return true; }
  if(q.kind==='kill'){ for(const k in q.kill) if((P.prog[id]||0) < q.kill[k]) return false; return true; }
  if(q.kind==='visit') return (P.prog[id]||0)>=1;
  if(q.kind==='special'){
    if(id==='harvest') return (P.prog.harvest||0) >= q.count;
    if(id==='cat') return P.petPip;
    if(id==='echoes') return Object.keys(P.loreRead||{}).length>=7;
    if(id==='profit') return (P.prog.profit||0)>=12;
    if(id==='setsail') return isleQuestsSettled();
    if(id==='bladeoath') return !!(P.unlocked&&P.unlocked.parry);   // ready the moment Rask's turning is learned
    if(id==='sail') return !!(P.story&&P.story.haveSail);            // ready once you carry Nessa's sail up out of the Undermill
    // regional boss-hunts complete off the flag the boss sets when it falls
    if(id==='hoarfrost') return !!(P.story&&P.story.iceBearDown);
    if(id==='rimebound') return !!(P.story&&P.story.deepDone);
    if(id==='stormroc') return !!(P.story&&P.story.rocDown);
    if(id==='barrowbrute') return !!(P.story&&P.story.reachBossDown);
    if(id==='drownedwarden') return !!(P.story&&P.story.tombBossDown);
    // Act II returned-isle restorations complete off each spirit-dungeon's clear flag
    if(id==='windRestore') return !!(P.story&&P.story.galeDeepDone);
    if(id==='sunRestore')  return !!(P.story&&P.story.ashenForgeDone);
    if(id==='barikRestore')return !!(P.story&&P.story.barikDeepDone);
    if(id==='skyRestore')  return !!(P.story&&P.story.stormTempleDone);
    if(id==='reachRestore')return !!(P.story&&P.story.tombBossDown);
  }
  return false;
}
// Does this NPC have a quest that's completed and waiting to be reported to them right
// now? Used by the night-hide pass (updateNPCs) so a quest-giver stays reachable past
// dusk while you owe them a turn-in - a finished quest never has to wait for dawn. Cheap:
// only called for NPCs the night would otherwise hide.
function npcHasReadyTurnIn(npc){
  if(!npc || !npc.id) return false;
  for(const id in P.quests){
    const q=QUESTS[id];
    if(q && q.giver===npc.id && qs(id)==='active' && questReady(id)) return true;
  }
  return false;
}
function acceptQuest(id){
  P.quests[id]='active'; P.prog[id]=0;
  if(id==='kit'){ // Bram hands over the tools on the spot; the sword is the reward for finishing
    P.kit=true; if(typeof buildHotbar==='function') buildHotbar();
    addFloat('+ Woodsman\'s Axe & Pick', P.x,P.y-1.4,'#ffe9a8');
    setTimeout(()=>toast('<b style="color:var(--ember)">Axe &amp; pick in hand!</b> You can <b>chop trees</b> and <b>mine stone</b> now. Bring Bram <b>1 wood</b> and <b>1 stone</b> and he\'ll forge your iron sword.',5600),400); }
  if(id==='harvest'){ giveQuiet('seed',6); addFloat('+6 Wheat Seeds', P.x,P.y-1.4,'#ffe9a8'); }
  if(id==='kitchenrun'){ giveQuiet('crate',1); addFloat("+ Victualler's Crate", P.x,P.y-1.4,'#ffe9a8'); }
  if(id==='gravelord') ensureGravelord(true);
  if(id==='king'){ // Maren speaks the ward open - the causeway to the King is unsealed
    // unseal now (silently); the reveal is a camera pan up to the open gate and back,
    // fired once the accept-dialog is dismissed (see frame() in 21-exploration.js)
    if(typeof openHollowGate==='function') openHollowGate(false);
    G.wardPan=1; }
  if(id==='tide'){ // the beast only surfaces once you windsurf OUT past the breakwater
    setTimeout(()=>toast('Rell points past his jetty. <b>Windsurf out onto the light water</b> when you\'re ready - ride out past the breakwater and the thing in the deep will find you soon enough. The board rides the shallows, not the deep.',6500),700); }
  if(id==='thaw' && typeof spawnFrostWarden==='function'){ // the warden waits on the glacier
    spawnFrostWarden();
    setTimeout(()=>toast('Up on the Weeping Glacier, something huge and pale grinds to its feet, wrapped in <b style="color:#c9a0ff">violet frost</b>. Climb the ice road when you are ready.',6000),700); }
  if(id==='wyrm'){ // Vath presses the ember-key on you - the Emberthroat is locked; without his errand you cannot even enter
    P.story=P.story||{}; P.story.emberKey=1;
    addFloat('+ Ember-Key', P.x,P.y-1.4,'#ffb060');
    setTimeout(()=>toast('<i>Vath turns a heavy, heat-warm key into your palm.</i> <b style="color:var(--ember)">You take the Ember-Key.</b> The Emberthroat at the caldera\'s foot is barred to all but its bearer - climb Mount Kea and let yourself in.',6400),700); }
  Snd.quest(); toast('<b style="color:var(--ember)">Quest accepted:</b> '+QUESTS[id].title);
  updateQuestUI();
}
function completeQuest(id){
  P.cheerT=3; // wear the win on your face
  gainLXP(QUESTS[id].xpL || 70); // quests carry the climb
  const q=QUESTS[id];
  if(q.kind==='gather') for(const it in q.need) take(it,q.need[it]);
  P.quests[id]='done';
  const rw=q.rw||{};
  if(rw.gold) giveGold(rw.gold);
  if(rw.item) for(const it in rw.item) give(it,rw.item[it]);
  if(rw.sword){ P.swordTier=Math.max(P.swordTier,1); P.unlocked.melee=true; buildHotbar();
    toast('<b style="color:var(--ember)">Iron Sword forged!</b> Your first true weapon - tap the sword slot to wield it.'); }
  if(rw.kit){ P.kit=true;
    setTimeout(()=>toast('<b style="color:var(--ember)">Woodsman\'s kit received!</b> You can now <b>chop trees</b> and <b>mine stone</b>.',4800),1200); }
  if(rw.bow){ P.unlocked.bow=true; P.maxArrows=P.maxArrows||20; P.arrows=P.maxArrows; buildHotbar(); refreshUI();
    if(typeof storyCard==='function') storyCard('<b style="color:var(--ember)">Bow unlocked!</b><br><br>'+((typeof isTouch!=='undefined'&&isTouch)?'Tap the bow slot':'Press 2')+' to draw it, and loose arrows at range. Each shaft hits <b>hard</b> - but your <b>quiver holds 20</b> and does <b>not</b> refill on its own, so pick your shots. Gather dropped shafts and quiver bundles to restock.', {label:'OK'});
    else toast('<b style="color:var(--ember)">Bow unlocked!</b> 20 hard-hitting arrows - press 2 or tap the bow slot.'); }
  if(rw.staff){ P.unlocked.staff=true; buildHotbar(); toast('<b style="color:var(--ember)">Fire Staff unlocked!</b> Press 3 to loose fire-bolts at range.');
    // the dash is NOT taught here: earning the staff opens Orin's tower, and the
    // scrying orb inside is what teaches the dash (see enterHouse + the orb boon).
  }
  if(rw.dash){ if(typeof unlockDash==='function') unlockDash(); }
  if(rw.parry){ if(typeof unlockParry==='function') unlockParry(); }
  if(rw.surf){ P.unlocked.surf=true;
    toast('<b style="color:var(--ember)">Windsurf board earned!</b> Walk onto the water and ride it - the sea is a road now, at nearly double speed.',6500); }
  if(rw.moa){ P.unlocked.moa=true; P.riding=1; if(typeof updateMountBtn==='function') updateMountBtn();
    toast('<b style="color:var(--ember)">Kiko the Moa is yours!</b> '+(isTouch?'Tap <b>Ride</b> (right side)':'Press <b>M</b>')+' to mount and dismount - the fastest legs on any shore.',6500); }
  if(rw.horse){ P.horse=1; if(typeof updateMountBtn==='function') updateMountBtn();
    toast('<b style="color:var(--ember)">Chestnut is yours!</b> '+(isTouch?'Tap <b>Ride</b> (right side)':'Press <b>M</b>')+' to mount and dismount - or whistle him up any time from the pause menu.',6500); }
  if(rw.dash2){ P.unlocked.dash2=true;
    toast('<b style="color:var(--ember)">Double Dash learned!</b> Moss\u2019s quickroot draught lets you chain a <b>second dodge roll</b> right after the first.',6000); }
  if(rw.room){ P.resortRoom=1;
    toast('<b style="color:var(--ember)">The Breakers suite is yours!</b> Coralie hands you the brass key - sleep in the canopy bed by the sea-window any time, no charge.',6000); }
  if(rw.hp){ P.maxhp+=rw.hp; P.hp=P.maxhp; toast('<b style="color:var(--ember)">+'+rw.hp+' max HP</b> - hardened by the deed.'); }
  if(rw.xp) for(const s in rw.xp) addXP(s, rw.xp[s]);
  if(id==='ribbon1'){ P.quests.ribbon2='active';
    toast('<b>Quest updated:</b> A Ribbon for Wren - steal back Mira\u2019s silk from the brigand camp north of Blackpine.',5600); }
  if(id==='ribbon2'){ P.quests.ribbon3='active';
    toast('<b>Quest updated:</b> A Ribbon for Wren - bring the Sunset Ribbon to Captain Corvo at the east cove.',5600); }
  if(id==='ribbon3'){ P.prog.eastSail=1;
    banner('NEW HORIZONS','THE EAST STRAIT IS OPEN');
    setTimeout(()=>toast('Corvo readies his sloop. <b>Speak to him to sail east</b> - the Sunward Isle waits past the shoals.',6000),1500); }
  if(id==='sail'){ // Nessa has stepped the sail - the board flies now, so the Leviathan hunt opens.
    // (This used to fire off the sail-chest; now it fires when Nessa actually steps the sail, so
    // Rell only has a beast to point you at once you're truly good to go on the water.)
    if(qs('tide')!=='done' && !P.quests.tide) P.quests.tide='avail';
    setTimeout(()=>toast('You\'re good to go - the board rides the <b>shallows</b> now, so the light water is yours. See <b>Rell the Harbormaster</b> at the docks; he\'ll point you at the thing past the breakwater.',6800),1600); }
  if(id==='board'){ // the board is shaped, but bare - fetch Nessa's sail from the Undermill next.
    // Tolen shapes the board AND hands over Burl's spare key: the windmill stays locked
    // to everyone until you hold that key, so grant millKey here to open the Undermill.
    P.story=P.story||{}; P.story.boardMade=1; P.story.millKey=1;
    if(!P.quests.sail) { P.quests.sail='active'; P.prog.sail=0; }
    setTimeout(()=>toast('Tolen presses a heavy iron <b style="color:var(--ember)">windmill key</b> into your hand - Burl\'s padlock is yours to open now. Nessa\'s stormsail waits below.',6000),1400); }
  if(id==='pendant'){ // Orin has read the ward - now he sends you to the Woodworker
    P.story=P.story||{}; P.story.wardRead=1;
    // Launch the Woodworker leg directly as ACTIVE (not 'avail'): Orin's own words in
    // the pendant doneText send you straight to the green, and the quest marker must
    // follow to the Woodworker. Leaving it 'avail' meant it had to be re-offered at
    // Orin - where any lingering 'avail' Orin side-quest (e.g. the bluecap draught)
    // hijacked the single offer slot, burying the main-story hand-off and dead-ending
    // the trail between Orin and the woodpile.
    if(!P.quests.enchanter){ P.quests.enchanter='active'; P.prog.enchanter=0; } }
  const fresh=[];
  (q.unlocks||[]).forEach(u=>{ if(!P.quests[u]){ P.quests[u]='avail'; fresh.push(u); } });
  if(id==='setsail') setTimeout(()=>banner('THE TIDEWALKER SAILS','Board her at the dock - Greyharbor awaits'),1300);
  if(fresh.length){
    const who=[...new Set(fresh.map(u=>npcName(QUESTS[u].giver)))].join(' & ');
    setTimeout(()=>toast('<b style="color:var(--ember)">! New work:</b> speak with <b>'+who+'</b>.',4800),1400);
  }
  if(id==='torv1'){ // shafts reopened - Torv finally agrees to come down to his worrying sister
    P.story=P.story||{}; P.story.torvHome=1;
    // Move him down to the harbor beside Brenna. Delayed a beat so it plays as him setting
    // off after the QUEST COMPLETE banner, not a mid-sentence pop. The live move keeps the
    // cached Barik world consistent; spawnBarikFolk places him there on any fresh regen/reload.
    setTimeout(()=>{
      toast('<b style="color:var(--ember)">Torv shoulders his pick</b> and heads down the road for the harbor - Brenna\'s fretted long enough. You\'ll find the two of them together by the boats.',6200);
      if(typeof relocateTorvHome==='function') relocateTorvHome();
    },2200);
  }
  if(id==='cat'){ P.petPip=false; G.cat.following=false; G.cat.homebound=true; }
  setTimeout(autoSave,300);
  if(id==='king') setTimeout(()=>toast('The strait is calm at last. The <b>Tidewalker</b> still needs patching - see <b style="color:var(--ember)">Captain Brant</b> at the dock; a little timber and she sails for <b>Greyharbor</b>.',6800),2600);
  banner('QUEST COMPLETE', q.title);
  Snd.quest(); updateQuestUI(); buildHotbar();
}
function killCredit(kind){
  for(const id in P.quests){
    if(P.quests[id]!=='active') continue;
    const q=QUESTS[id];
    if(!q) continue;
    if(q.kind==='kill' && q.kill[kind]!=null){
      P.prog[id]=Math.min(q.kill[kind],(P.prog[id]||0)+1);
      const left=q.kill[kind]-P.prog[id];
      if(kind!=='dragon') // the wyrm fight resolves itself at the caldera - no "return to Vath"
        toast(((MOBDEF[kind]&&MOBDEF[kind].name)||'Elite foe')+' defeated - '+(left>0? left+' to go' : '<b style="color:#9be07f">objective complete! Return to '+npcName(q.giver)+'</b>'));
    }
  }
  updateQuestUI();
}
function npcName(id){ const n=G.npcs.find(n=>n.id===id); return n?n.name:id; }
function rewardText(q){
  const rw=q.rw||{}, parts=[];
  if(rw.gold) parts.push('<b style="color:#ffd76a">'+rw.gold+' gold</b>');
  if(rw.item) for(const it in rw.item){ if(ITEMS[it]) parts.push(rw.item[it]+'× '+ITEMS[it].name); }
  if(rw.sword) parts.push('<b style="color:var(--ember)">the Iron Sword</b>');
  if(rw.kit) parts.push('a woodsman\'s <b>axe &amp; pick</b>');
  if(rw.bow) parts.push('<b style="color:var(--ember)">the Hunting Bow</b>');
  if(rw.staff) parts.push('<b style="color:var(--ember)">the Fire Staff</b>');
  if(rw.dash) parts.push('<b style="color:#c9b0ff">the Dash</b>');
  if(rw.parry) parts.push('<b style="color:#ffe08a">the Parry</b>');
  if(rw.surf) parts.push('<b style="color:var(--ember)">a windsurf board</b>');
  if(rw.moa) parts.push('<b style="color:var(--ember)">Kiko the Moa</b>');
  if(rw.dash2) parts.push('<b style="color:var(--ember)">the Double Dash</b>');
  if(rw.hp) parts.push('<b style="color:#9be07f">+'+rw.hp+' max HP</b>');
  if(rw.xp){ const sk=Object.keys(rw.xp).filter(s=>SKILLS[s]); if(sk.length) parts.push(sk.map(s=>SKILLS[s].name).join(' & ')+' experience'); }
  return parts.length? '<div class="rwline">Reward: '+parts.join(' · ')+'</div>' : '';
}
function questTargetPos(id){
  const q=QUESTS[id];
  if(qs(id)==='active' && !questReady(id)){
    if(id==='lettuce'){ const h=G.mobs&&G.mobs.find(m=>m.kind==='hare'&&!m.dead); if(h) return {x:h.x,y:h.y};
      return (typeof crownLettucePlot==='function' && G.worldId==='crown')? crownLettucePlot() : null; }
    if(q.kind==='talk'){ const n=G.npcs.find(n=>n.id===q.talkTo); return n&&{x:n.x,y:n.y}; }
    if(id==='slimes') return {x:ZONES.meadow.x,y:ZONES.meadow.y};
    if(id==='skeletons'||id==='king') return {x:ZONES.ruins.x,y:ZONES.ruins.y};
    if(id==='cat') return (G.cat && !G.cat.found)? {x:ZONES.forest.x,y:ZONES.forest.y} : null;
    if(id==='bounty') return ZONES.highlands? {x:ZONES.highlands.x,y:ZONES.highlands.y} : {x:ZONES.ruins.x,y:ZONES.ruins.y};
    if(id==='shells'||id==='pearlq') return {x:ZONES.dock.x,y:ZONES.dock.y-2};
    if(id==='springs') return {x:ZONES.springs.x,y:ZONES.springs.y};
    if(id==='cove') return {x:ZONES.cove.x,y:ZONES.cove.y};
    if(id==='orchard') return {x:ZONES.orchard.x,y:ZONES.orchard.y};
    if(id==='remember') return {x:ZONES.tower.x,y:ZONES.tower.y};
    if(id==='embers') return {x:ZONES.ruins.x,y:ZONES.ruins.y};
    if(id==='mossbrew') return {x:ZONES.forest.x,y:ZONES.forest.y};
    if(id==='roadclear') return {x:ZONES.highlands.x,y:ZONES.highlands.y};
    if(id==='hedda2') return {x:ZONES.meadow.x,y:ZONES.meadow.y};
    if(id==='nets') return {x:ZONES.dock.x-2,y:ZONES.dock.y};
    if(id==='feud1') return {x:ZONES.vael.x,y:ZONES.vael.y};
    if(id==='feud2') return {x:ZONES.vael.x-6.5,y:ZONES.vael.y+6.5};
    if(id==='sting1') return {x:ZONES.desert.x,y:ZONES.desert.y};
    if(id==='undermaw1') return {x:ZONES.undermaw.x,y:ZONES.undermaw.y};
    if(id==='wyrm') return ZONES.caldera? {x:ZONES.caldera.x,y:ZONES.caldera.y} : null; // guide up Mount Kea to the caldera
    if(id==='hunt1') return ZONES.grove? {x:ZONES.grove.x,y:ZONES.grove.y} : null;
    if(id==='vhunt'){ const mg=G.mobs.find(m=>m.kind==='mage'&&!m.dead); // track Vath as he flees
      return mg? {x:mg.x,y:mg.y} : (ZONES.grove? {x:ZONES.grove.x,y:ZONES.grove.y} : null); }
    if(id==='enchanter'){ // Act IV: to the Woodworker on Emberwick, then to Vath when he comes
      const vm=G.mobs && G.mobs.find(m=>m.kind==='mage' && m.finalVath && !m.dead);
      if(vm) return {x:vm.x,y:vm.y};
      const w=G.npcs && G.npcs.find(n=>n.id==='woody'); if(w) return {x:w.x,y:w.y};
      return ZONES.village? {x:ZONES.village.x,y:ZONES.village.y} : null; }
    if(id==='tide') return (typeof leviathanHome==='function') ? leviathanHome() : (ZONES.dock? {x:ZONES.dock.x,y:ZONES.dock.y} : null);
    if(id==='roost'){ // guide to the tome if you're inside the sealed roost, else to the tunnel mouth
      const tome=G.decor && G.decor.find(b=>b.kind==='tome' && !b.destroyed);
      if(tome && ZONES.sanctum && dist(P.x,P.y,ZONES.sanctum.x,ZONES.sanctum.y)<8) return {x:tome.x,y:tome.y};
      return ZONES.tunnel? {x:ZONES.tunnel.x,y:ZONES.tunnel.y} : null; }
    if(id==='thaw'){ const w=G.mobs && G.mobs.find(m=>m.kind==='frostwarden'&&!m.dead);
      return w? {x:w.x,y:w.y} : (ZONES.glacier? {x:ZONES.glacier.x,y:ZONES.glacier.y} : null); }
    if(id==='ribbon2' && !has('silk',1)) return {x:162.5,y:146.5}; // the brigands' silk cache, north of Blackpine
    if(id==='mushrooms') return {x:ZONES.forest.x,y:ZONES.forest.y};
    if(id==='fish') return {x:ZONES.dock.x-3,y:ZONES.dock.y};
    if(id==='harvest') return {x:59.5,y:63};
    if(id==='sharpen') return {x:52,y:47};
    if(id==='bladeoath'){ const r=G.npcs&&G.npcs.find(n=>n.id==='rask'); return r? {x:r.x,y:r.y} : (ZONES.grove? {x:ZONES.grove.x,y:ZONES.grove.y} : {x:ZONES.meadow.x,y:ZONES.meadow.y}); }
  }
  const n=G.npcs.find(n=>n.id===q.giver); return n&&{x:n.x,y:n.y};
}
function primaryQuest(){
  const order=['welcome','kit','bladeoath','sharpen','slimes','mushrooms','skeletons','king','fish','harvest','cat','shells','pearlq','remember','springs','cove','orchard','wreck','fittings','provisions','masterwork','wolffold','feast','necklace','profit','echoes','gravelord','setsail','bounty','embers','mossbrew','welcome2','nets','roadclear','hedda1','hedda2','torv1','torv2','ivo1','feud1','feud2','sting1','duchesslove','duchessreply','undermaw1','ribbon1','ribbon2','ribbon3','hunt1','tame1','surf1','board','tide','roost','thaw','audience','pendant','enchanter','homecoming'];
  for(const id of order) if(qs(id)==='active') return id;
  for(const id of order) if(qs(id)==='avail') return null;
  return null;
}

/* ---------------- toasts & floating text ---------------- */
let toastT=null;
// Toasts are silenced by request: toast() is now a no-op, so the ~180 flavor,
// reward and guidance pop-ups never appear. Only genuine "you can't do that right
// now" blockers are still surfaced, via toastErr() (see its call sites).
function _renderToast(html,ms=3200){
  const el=document.getElementById('toast');
  el.innerHTML=html; el.style.display='block';
  clearTimeout(toastT); toastT=setTimeout(()=> el.style.display='none', ms);
}
function toast(html,ms){ /* intentionally silent */ }
function toastErr(html,ms=3200){ _renderToast(html,ms); }
// An important story beat - a boss-defeat or reveal - shown on a card that waits
// for an explicit press instead of fading on a timer, so it is never missed. The
// world pauses while it is up so the moment can be read in peace.
function storyCard(html, opts){
  opts=opts||{};
  const ov=document.getElementById('storyOv'); if(!ov) return;
  // Present speech plainly here too: the rest of the game strips the “ ” speech-quotes
  // via cleanSpeech, but story cards set innerHTML directly - so drop the curly quotes
  // here as well (the italic narration stays). No more quote marks anywhere.
  if(typeof html==='string') html=html.replace(/[“”]/g,'').replace(/ {2,}/g,' ');
  document.getElementById('storyText').innerHTML=html;
  const bt=document.getElementById('storyBtn');
  bt.textContent=opts.label||'Continue';
  ov.style.display='flex';
  G._storyPaused = (G.state==='play' && !G.paused);
  if(G._storyPaused) G.paused=true;
  bt.onclick=()=>{
    ov.style.display='none';
    if(G._storyPaused){ G.paused=false; G._storyPaused=false; }
    if(opts.onOk) opts.onOk();
  };
}
// A "you can't do that / nothing happened" blocker the player must dismiss with a
// click, so no action on the interact or attack button ever fails silently (a
// locked door, an empty patch of ground, no weapon in hand...). Reuses the
// story-card overlay - it dims the scene, pauses the world and waits for a press -
// but with a plain OK button. If a card is already up, the blocker is dropped so
// we never stack two overlays or clobber a genuine story beat.
function blockMsg(html){
  const ov=document.getElementById('storyOv');
  if(ov && ov.style.display!=='none') return;
  storyCard(html,{label:'OK'});
}
function addFloat(text,x,y,color,scale=1){
  G.floats.push({text,x,y,vy:-0.9,life:1.3,color:color||'#fff',scale});
}
function burst(x,y,color,n=10,spd=2.4){
  for(let i=0;i<n;i++){ const a=Math.random()*TAU, v=rnd(0.4,1)*spd;
    G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*0.6-0.8,life:rnd(0.4,0.8),
      color, size:rnd(2,4), grav:2.4}); }
}
// Ambient exploration hints are silenced by request - walking around should not
// spam toasts. Kept as a no-op so every call site stays harmless.
function hintOnce(key,msg){ G.hintShown[key]=true; }

