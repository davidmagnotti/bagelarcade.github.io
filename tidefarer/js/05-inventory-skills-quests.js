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
  const sk=P.skills[skill]; if(!sk) return;
  sk.xp+=amt;
  addFloat('+'+amt+' '+SKILLS[skill].name+' XP', P.x, P.y-1.8, '#9be07f');
  while(sk.xp >= xpForLevel(sk.lvl)){
    sk.xp -= xpForLevel(sk.lvl); sk.lvl++;
    addFloat(SKILLS[skill].name+' Lv '+sk.lvl+'!', P.x, P.y-2.3, '#ffd76a', 1.6);
    burst(P.x,P.y-0.5,'#ffd76a',16); Snd.levelup();
    shockwave(P.x,P.y,'rgba(255,215,106,0.9)',40);
    banner(SKILLS[skill].name.toUpperCase()+' - LEVEL '+sk.lvl, SKILLS[skill].perk);
    P.cheerT=3;
  }
  refreshSkillsPanel();
}
function meleeDmg(){ return 6 + P.swordTier*4 + P.skills.melee.lvl*2 + (has('charm',1)?3:0) + (has('warcharm',1)?5:0) + (has('relic',1)?4:0) + (has('fang',1)?8:0); }
function bowDmg(){ return 5 + P.skills.archery.lvl*2 + (has('charm',1)?3:0) + (has('warcharm',1)?5:0) + (has('relic',1)?4:0); }
function magicDmg(){ return 8 + P.skills.magic.lvl*3 + (has('charm',1)?3:0) + (has('warcharm',1)?5:0) + (has('relic',1)?4:0); }

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
  }
  return false;
}
function acceptQuest(id){
  P.quests[id]='active'; P.prog[id]=0;
  if(id==='harvest'){ giveQuiet('seed',6); addFloat('+6 Wheat Seeds', P.x,P.y-1.4,'#ffe9a8'); }
  if(id==='kitchenrun'){ giveQuiet('crate',1); addFloat("+ Victualler's Crate", P.x,P.y-1.4,'#ffe9a8'); }
  if(id==='gravelord') ensureGravelord(true);
  if(id==='tide' && typeof spawnLeviathan==='function'){ // the beast surfaces at the breakwater
    spawnLeviathan();
    setTimeout(()=>toast('Out past the breakwater the water heaves - and something vast breaks the surface, ringed in <b style="color:#c9a0ff">violet light</b>. <b>Windsurf out</b> onto the light water when you are ready - the board rides the shallows, not the deep.',6500),700); }
  if(id==='thaw' && typeof spawnFrostWarden==='function'){ // the warden waits on the glacier
    spawnFrostWarden();
    setTimeout(()=>toast('Up on the Weeping Glacier, something huge and pale grinds to its feet, wrapped in <b style="color:#c9a0ff">violet frost</b>. Climb the ice road when you are ready.',6000),700); }
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
  if(rw.bow){ P.unlocked.bow=true; toast('<b style="color:var(--ember)">Bow unlocked!</b> Press 2 or tap the bow slot.'); }
  if(rw.staff){ P.unlocked.staff=true; toast('<b style="color:var(--ember)">Fire Staff unlocked!</b> Press 3 - bolts cost 8 mana.'); }
  if(rw.surf){ P.unlocked.surf=true;
    toast('<b style="color:var(--ember)">Windsurf board earned!</b> Walk onto the water and ride it - the sea is a road now, at nearly double speed.',6500); }
  if(rw.moa){ P.unlocked.moa=true; P.riding=1; if(typeof updateMountBtn==='function') updateMountBtn();
    toast('<b style="color:var(--ember)">Kiko the Moa is yours!</b> '+(isTouch?'Tap <b>Ride</b> (right side)':'Press <b>M</b>')+' to mount and dismount - the fastest legs on any shore.',6500); }
  if(rw.dash2){ P.unlocked.dash2=true;
    toast('<b style="color:var(--ember)">Double Dash learned!</b> Moss\u2019s quickroot draught lets you chain a <b>second dodge roll</b> right after the first.',6000); }
  if(rw.item && rw.item.crown){ P.maxhp+=25; P.hp=P.maxhp; }
  if(rw.hp){ P.maxhp+=rw.hp; P.hp=P.maxhp; toast('<b style="color:var(--ember)">+'+rw.hp+' max HP</b> - hardened by the deed.'); }
  if(rw.mp){ P.maxmp+=rw.mp; P.mp=P.maxmp; toast('<b style="color:var(--ember)">+'+rw.mp+' max mana</b> - your focus deepens.'); }
  if(rw.xp) for(const s in rw.xp) addXP(s, rw.xp[s]);
  if(id==='ribbon1'){ P.quests.ribbon2='active';
    toast('<b>Quest updated:</b> A Ribbon for Wren - steal back Mira\u2019s silk from the brigand camp north of Blackpine.',5600); }
  if(id==='ribbon2'){ P.quests.ribbon3='active';
    toast('<b>Quest updated:</b> A Ribbon for Wren - bring the Sunset Ribbon to Captain Corvo at the east cove.',5600); }
  if(id==='ribbon3'){ P.prog.eastSail=1;
    banner('NEW HORIZONS','THE EAST STRAIT IS OPEN');
    setTimeout(()=>toast('Corvo readies his sloop. <b>Speak to him to sail east</b> - the Sunward Isle waits past the shoals.',6000),1500); }
  if(id==='board'){ // earning the windsurf opens the Leviathan hunt with Rell
    if(G.worldId==='wind' && qs('tide')!=='done' && !P.quests.tide) P.quests.tide='avail';
    setTimeout(()=>toast('<b>Rell the Harbormaster</b> will send you at the Leviathan now - windsurf out past the breakwater onto the light water when you\'re ready.',6500),2600); }
  const fresh=[];
  (q.unlocks||[]).forEach(u=>{ if(!P.quests[u]){ P.quests[u]='avail'; fresh.push(u); } });
  if(id==='setsail') setTimeout(()=>banner('THE TIDEWALKER SAILS','Board her at the dock - Greyharbor awaits'),1300);
  if(fresh.length){
    const who=[...new Set(fresh.map(u=>npcName(QUESTS[u].giver)))].join(' & ');
    setTimeout(()=>toast('<b style="color:var(--ember)">! New work:</b> speak with <b>'+who+'</b>.',4800),1400);
  }
  if(id==='cat'){ P.petPip=false; G.cat.following=false; G.cat.homebound=true; }
  setTimeout(autoSave,300);
  if(id==='king') setTimeout(()=>toast('The strait is calm at last. <b style="color:var(--ember)">Finn\'s boat</b> at the dock can sail for <b>Greyharbor</b>.',6000),2600);
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
  if(rw.surf) parts.push('<b style="color:var(--ember)">a windsurf board</b>');
  if(rw.moa) parts.push('<b style="color:var(--ember)">Kiko the Moa</b>');
  if(rw.dash2) parts.push('<b style="color:var(--ember)">the Double Dash</b>');
  if(rw.hp) parts.push('<b style="color:#9be07f">+'+rw.hp+' max HP</b>');
  if(rw.mp) parts.push('<b style="color:#9be07f">+'+rw.mp+' max mana</b>');
  if(rw.xp){ const sk=Object.keys(rw.xp).filter(s=>SKILLS[s]); if(sk.length) parts.push(sk.map(s=>SKILLS[s].name).join(' & ')+' experience'); }
  return parts.length? '<div class="rwline">Reward: '+parts.join(' · ')+'</div>' : '';
}
function questTargetPos(id){
  const q=QUESTS[id];
  if(qs(id)==='active' && !questReady(id)){
    if(q.kind==='talk'){ const n=G.npcs.find(n=>n.id===q.talkTo); return n&&{x:n.x,y:n.y}; }
    if(id==='slimes') return {x:ZONES.meadow.x,y:ZONES.meadow.y};
    if(id==='skeletons'||id==='king') return {x:ZONES.ruins.x,y:ZONES.ruins.y};
    if(id==='cat') return (G.cat && !G.cat.found)? {x:ZONES.forest.x,y:ZONES.forest.y} : null;
    if(id==='bounty'||id==='alpha') return ZONES.highlands? {x:ZONES.highlands.x,y:ZONES.highlands.y} : {x:ZONES.ruins.x,y:ZONES.ruins.y};
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
  }
  const n=G.npcs.find(n=>n.id===q.giver); return n&&{x:n.x,y:n.y};
}
function primaryQuest(){
  const order=['welcome','kit','sharpen','slimes','mushrooms','skeletons','king','fish','harvest','cat','shells','pearlq','remember','springs','cove','orchard','wreck','fittings','provisions','masterwork','wolffold','feast','necklace','profit','echoes','gravelord','setsail','bounty','alpha','embers','mossbrew','welcome2','nets','roadclear','hedda1','hedda2','torv1','torv2','ivo1','feud1','feud2','sting1','undermaw1','ribbon1','ribbon2','ribbon3','hunt1','tame1','surf1','board','tide','roost','thaw','audience'];
  for(const id of order) if(qs(id)==='active') return id;
  for(const id of order) if(qs(id)==='avail') return null;
  return null;
}

/* ---------------- toasts & floating text ---------------- */
let toastT=null;
function toast(html,ms=3200){
  const el=document.getElementById('toast');
  el.innerHTML=html; el.style.display='block';
  clearTimeout(toastT); toastT=setTimeout(()=> el.style.display='none', ms);
}
function addFloat(text,x,y,color,scale=1){
  G.floats.push({text,x,y,vy:-0.9,life:1.3,color:color||'#fff',scale});
}
function burst(x,y,color,n=10,spd=2.4){
  for(let i=0;i<n;i++){ const a=Math.random()*TAU, v=rnd(0.4,1)*spd;
    G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*0.6-0.8,life:rnd(0.4,0.8),
      color, size:rnd(2,4), grav:2.4}); }
}
function hintOnce(key,msg){ if(G.hintShown[key]) return; G.hintShown[key]=true; toast(msg,4200); }

