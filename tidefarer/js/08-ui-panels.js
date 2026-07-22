/* =====================================================================
   UI PANELS
   ===================================================================== */
function togglePanel(id){
  const el=document.getElementById(id);
  const open = el.style.display==='block';
  closeAllPanels();
  if(!open){ el.style.display='block';
    if(id==='invPanel') refreshInvPanel();
    if(id==='skillPanel') refreshSkillsPanel();
    if(id==='questPanel') refreshQuestLog();
    if(id==='mapPanel') drawBigMap();
  }
  syncMenuPause();
}
function closeAllPanels(){ ['invPanel','skillPanel','questPanel','mapPanel'].forEach(id=> document.getElementById(id).style.display='none'); syncMenuPause(); }
/* Opening the bag, map, skills or quest log freezes the world (and unfreezes
   on close) so you can read and swap gear without something gnawing on you. */
function syncMenuPause(){
  const open=['invPanel','skillPanel','questPanel','mapPanel'].some(id=>document.getElementById(id).style.display==='block');
  G.menuPause = open?1:0;
}
document.querySelectorAll('.closeX').forEach(el=> el.onclick=()=>{ document.getElementById(el.dataset.close).style.display='none'; syncMenuPause(); });
document.getElementById('btnInv').onclick=()=>togglePanel('invPanel');
document.getElementById('btnQuests').onclick=()=>togglePanel('questPanel');
document.getElementById('qsearch').oninput=()=>refreshQuestLog();
document.getElementById('btnSkills').onclick=()=>togglePanel('skillPanel');
document.getElementById('btnMap').onclick=()=>togglePanel('mapPanel');
document.getElementById('miniWrap').onclick=()=>togglePanel('mapPanel');
document.getElementById('btnSound').onclick=function(){ Snd.init(); Snd.on=!Snd.on; this.style.opacity=Snd.on?1:0.45; };

/* hotbar */
const HOT = [
  {id:'melee', icon:'sword', key:'1', wpn:true},
  {id:'bow', icon:'bow', key:'2', wpn:true},
  {id:'staff', icon:'staff', key:'3', wpn:true},
  {id:'potion', icon:'potion', key:'4', wpn:false}
];
function buildHotbar(){
  const hb=document.getElementById('hotbar'); hb.innerHTML='';
  HOT.forEach(h=>{
    // a weapon you don't own yet stays hidden entirely (no grayed placeholder) -
    // the bow/staff slots simply appear the moment you earn them
    if(h.wpn && !P.unlocked[h.id]) return;
    const s=document.createElement('div'); s.className='slot'; s.id='hot_'+h.id;
    if(h.wpn && P.weapon=== (h.id==='melee'?'melee':h.id)) s.classList.add('sel');
    const ic=document.createElement('canvas'); ic.width=ic.height=40;
    ic.getContext('2d').drawImage(ICONS[h.icon],0,0); s.appendChild(ic);
    const key=document.createElement('div'); key.className='key'; key.textContent=h.key; s.appendChild(key);
    if(!h.wpn){
      // the quick slot: whatever consumable is currently attuned to it
      const qi=P.quickItem||'potion';
      ic.getContext('2d').clearRect(0,0,40,40);
      ic.getContext('2d').drawImage(ICONS[qi]||ICONS.potion,0,0);
      const c=document.createElement('div'); c.className='cnt'; c.textContent=P.inv[qi]||0; s.appendChild(c);
      const sw=document.createElement('div'); sw.textContent='\u21c4';
      sw.style.cssText='position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:50%;'+
        'background:#3a2c1c;border:1.5px solid #7a5f43;color:#f0e2c0;font-size:12px;line-height:19px;'+
        'text-align:center;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.6);z-index:2;';
      const cyc=(e)=>{ e.preventDefault(); e.stopPropagation(); Snd.init(); cycleQuickItem(); };
      sw.onclick=cyc;
      if(sw.addEventListener) sw.addEventListener('touchstart',cyc,{passive:false});
      s.appendChild(sw);
    }
    const act=()=>{ Snd.init(); if(h.wpn) selectWeapon(h.id); else useItem(P.quickItem||'potion'); };
    s.onclick=act;
    if(s.addEventListener) s.addEventListener('touchstart',(e)=>{
      e.preventDefault(); e.stopPropagation(); act();
    },{passive:false});
    hb.appendChild(s);
  });
}
const QUICK_ITEMS=['potion','elixir','bread','cookedfish','boarmeat','coconut','apple','fish','wheat'];
function cycleQuickItem(){
  const cur=QUICK_ITEMS.indexOf(P.quickItem||'potion');
  for(let i=1;i<=QUICK_ITEMS.length;i++){
    const k=QUICK_ITEMS[(cur+i)%QUICK_ITEMS.length];
    if((P.inv[k]||0)>0 || k==='potion'){
      P.quickItem=k; buildHotbar();
      toast('Quick slot: <b>'+ITEMS[k].name+'</b> \u00d7'+(P.inv[k]||0)+' <i>(heals '+ITEMS[k].heal+')</i>',2000);
      Snd.pickup();
      hintOnce('quickswap','Tap the <b>\u21c4</b> badge (or press <b>R</b>) any time to swap the quick slot between tonics and food.');
      return;
    }
  }
}
function selectWeapon(w){
  if(w==='melee' && !P.unlocked.melee) return; // grayed slots speak for themselves
  if(w==='bow' && !P.unlocked.bow) return;
  if(w==='staff' && !P.unlocked.staff) return;
  P.weapon=w; buildHotbar();
}
function useItem(item){
  if(!has(item,1)) { toast(item==='potion'? 'No tonics left - Elder Maren sells them for 8 gold.' : 'No '+(ITEMS[item]?ITEMS[item].name.toLowerCase():item)+' left - tap the \u21c4 badge to swap the quick slot.'); return; }
  const def=ITEMS[item];
  if(def.use==='heal'){
    if(P.hp>=P.maxhp){ toast('You\'re already at full health.'); return; }
    take(item,1); P.hp=Math.min(P.maxhp,P.hp+def.heal);
    addFloat('+'+def.heal+' HP',P.x,P.y-1.4,'#7fe07f'); burst(P.x,P.y-0.6,'#e05648',8); Snd.pickup();
    buildHotbar(); refreshInvPanel();
  }
}
function equipArmor(t){
  if(t>(P.armorOwn||0)){
    toast(t===1? 'Bram forges <b>Iron Armor</b> from 3 bars + 2 hardwood.' : 'Bram\'s <b>Steel Plate</b> needs 5 bars + an ember crystal.');
    return;
  }
  if((P.armor||0)===t) return;
  P.armor=t; Snd.pickup();
  toast('<b style="color:#ffd76a">Equipped:</b> '+(t===0?'Traveler\'s Clothes':t===1?'Iron Armor':'Steel Plate'));
  refreshInvPanel();
}
function weaponMeta(id){
  if(id==='melee') return {name:['Rusty Sword','Iron Sword','Steel Sword'][P.swordTier||0], icon:'sword', dmg:meleeDmg()};
  if(id==='bow')   return {name:"Hunter's Bow", icon:'bow', dmg:bowDmg()};
  if(id==='staff') return {name:'Emberwood Staff', icon:'staff', dmg:magicDmg()};
  return {name:'Fists', icon:'sword', dmg:2};
}
function equipWeapon(id){
  if(!P.unlocked[id]){ toast('That weapon isn’t yours yet - see Bram’s forge or Sable’s range.'); return; }
  P.weapon=id; buildHotbar(); Snd.pickup();
  toast('<b style="color:#ffd76a">Wielding:</b> '+weaponMeta(id).name);
  refreshInvPanel();
}
let INV_SEL=null;
function refreshInvPanel(){
  if(document.getElementById('invPanel').style.display!=='block') return;
  const grid=document.getElementById('invGrid'); grid.innerHTML='';
  const own=P.armorOwn||0;
  const AR=[{t:0,n:"Traveler's Clothes",d:'No protection, full freedom.'},
            {t:1,n:'Iron Armor',d:'Turns aside 15% of every blow.'},
            {t:2,n:'Steel Plate',d:'Turns aside 30% of every blow.'}];
  // ---- equipment: worn weapon + armor, each with a tap-to-swap shelf ----
  let eq='<div style="grid-column:1/-1;">'+
    '<div style="font-size:11px;letter-spacing:2px;color:#9a917f;margin-bottom:6px;">EQUIPMENT</div>';
  // -- weapon row --
  const wpns=['melee','bow','staff'].filter(id=>P.unlocked[id]);
  eq+='<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;">';
  if(wpns.length){
    const cur=P.unlocked[P.weapon]?P.weapon:wpns[0];
    const wm=weaponMeta(cur);
    eq+='<div style="text-align:center;">'+
      '<div class="islot" style="border-color:var(--ember);box-shadow:0 0 8px rgba(255,150,60,.25) inset;" title="'+wm.name+' - equipped">'+
        '<canvas width="40" height="40" data-eqicon="'+wm.icon+'"></canvas></div>'+
      '<div style="font-size:10px;color:var(--parch);max-width:64px;margin-top:2px;line-height:1.25;">'+wm.name+
        '<br><span style="color:#9be07f;">'+wm.dmg+' dmg</span></div></div>';
    const others=wpns.filter(id=>id!==cur);
    if(others.length){
      eq+='<div><div style="font-size:10px;color:var(--parch-dim);margin-bottom:3px;">Weapons - tap to wield:</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
      others.forEach(id=>{ const m=weaponMeta(id);
        eq+='<div class="islot gearTile" onclick="equipWeapon(\''+id+'\')" title="'+m.name+' - '+m.dmg+' dmg">'+
          '<canvas width="40" height="40" data-eqicon="'+m.icon+'"></canvas></div>'; });
      eq+='</div></div>';
    }
  } else {
    eq+='<div style="text-align:center;">'+
      '<div class="islot" style="opacity:.45;"><canvas width="40" height="40" data-eqicon="sword"></canvas></div>'+
      '<div style="font-size:10px;color:var(--parch-dim);max-width:64px;margin-top:2px;">Unarmed</div></div>'+
      '<div style="font-size:11px;color:var(--parch-dim);align-self:center;">Bram\u2019s forge will arm you.</div>';
  }
  eq+='</div>';
  // -- armor row --
  const worn=AR[P.armor||0];
  eq+='<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:8px;">';
  eq+='<div id="eqArmor" style="text-align:center;">'+
    '<div class="islot" style="border-color:var(--ember);box-shadow:0 0 8px rgba(255,150,60,.25) inset;" '+
      'onclick="unequipArmor()" title="'+worn.n+' - tap to take off">'+
      '<canvas width="40" height="40" data-eqicon="armor'+(P.armor||0)+'"></canvas></div>'+
    '<div style="font-size:10px;color:var(--parch);max-width:64px;margin-top:2px;line-height:1.25;">'+worn.n+'</div></div>';
  const shelf=AR.filter(a=>a.t<=own && a.t!==(P.armor||0) && a.t>0);
  if(shelf.length){
    eq+='<div><div style="font-size:10px;color:var(--parch-dim);margin-bottom:3px;">Armor - tap to wear:</div>'+
      '<div style="display:flex;gap:6px;">';
    shelf.forEach(a=>{
      eq+='<div class="islot gearTile" data-t="'+a.t+'" onclick="equipArmor('+a.t+')" title="'+a.n+' - '+a.d+'">'+
        '<canvas width="40" height="40" data-eqicon="armor'+a.t+'"></canvas></div>';
    });
    eq+='</div></div>';
  } else if(own===0){
    eq+='<div style="font-size:11px;color:var(--parch-dim);align-self:center;">Bram\u2019s forge sells iron for your ribs.</div>';
  }
  eq+='</div>';
  // -- passive charms / relics (always-on bonuses) --
  const tr=[];
  if(has('charm',1)) tr.push('Ember Charm <span style="color:#9be07f">+3</span>');
  if(has('warcharm',1)) tr.push('Battleworn Charm <span style="color:#9be07f">+5</span>');
  if(has('relic',1)) tr.push('Stormwatch Relic <span style="color:#9be07f">+4</span>');
  if(has('fang',1))  tr.push('Greymaw\u2019s Fang <span style="color:#9be07f">+8 melee</span>');
  if(has('wardstone',1)) tr.push('Warden\u2019s Wardstone <span style="color:#9be07f">-2 dmg taken</span>');
  if(has('boots',1)) tr.push('Trailblazer Boots <span style="color:#9be07f">+14% speed</span>');
  if(has('crown',1)) tr.push('Hollow Crown <span style="color:#9be07f">+25 HP</span>');
  if(tr.length) eq+='<div style="font-size:11px;color:var(--parch-dim);margin-bottom:6px;">'+
    '<b style="color:#9a917f;letter-spacing:1px;">CHARMS </b>'+tr.join(' \u00b7 ')+'</div>';
  eq+='<div style="font-size:11px;color:var(--parch-dim);border-top:1px solid #3a2c1c;padding-top:7px;margin-bottom:2px;">Forge stronger swords, armor &amp; tools at <b>Bram\u2019s forge</b>.</div>';
  eq+='</div>';
  grid.insertAdjacentHTML('beforeend',eq);
  grid.querySelectorAll('canvas[data-eqicon]').forEach(cv2=>{
    cv2.getContext('2d').drawImage(ICONS[cv2.dataset.eqicon]||iconCanvas('stone'),0,0);
  });
  // ---- the satchel: tap selects; the action card below does the doing ----
  const keysList=Object.keys(P.inv).filter(k=>P.inv[k]>0);
  if(!keysList.length){ grid.insertAdjacentHTML('beforeend','<div style="grid-column:1/-1;font-size:12px;color:var(--parch-dim);">Satchel\u2019s empty. The island provides - go poke it.</div>'); return; }
  if(INV_SEL && !(P.inv[INV_SEL]>0)) INV_SEL=null;
  grid.insertAdjacentHTML('beforeend','<div style="grid-column:1/-1;font-size:11px;letter-spacing:2px;color:#9a917f;margin:2px 0 4px;">SATCHEL</div>');
  const row=document.createElement('div'); row.style.cssText='grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;';
  keysList.forEach(k=>{
    const s=document.createElement('div'); s.className='islot'+(INV_SEL===k?' invsel':''); s.title=ITEMS[k].name+' - '+ITEMS[k].desc;
    const ic=document.createElement('canvas'); ic.width=ic.height=40; ic.getContext('2d').drawImage(ICONS[k]||iconCanvas('stone'),0,0);
    s.appendChild(ic);
    const c=document.createElement('div'); c.className='cnt'; c.textContent=P.inv[k]; s.appendChild(c);
    if((P.quickItem||'potion')===k){
      const q=document.createElement('div'); q.textContent='\u21c4';
      q.style.cssText='position:absolute;top:1px;left:3px;font-size:11px;color:var(--ember);text-shadow:0 1px 2px #000;';
      s.appendChild(q);
    }
    s.onclick=()=>{ INV_SEL=(INV_SEL===k?null:k); Snd.step&&Snd.step(6); refreshInvPanel(); };
    row.appendChild(s);
  });
  grid.appendChild(row);
  if(INV_SEL){
    const k=INV_SEL, it=ITEMS[k];
    const canUse=!!it.use, canQuick=QUICK_ITEMS.includes(k);
    let act='<div id="invAct" style="grid-column:1/-1;margin-top:10px;border:2px solid var(--ember);border-radius:10px;padding:10px 12px;background:#241a10;">'+
      '<div style="font-weight:bold;">'+it.name+' \u00d7'+P.inv[k]+'</div>'+
      '<div style="font-size:12px;color:var(--parch-dim);margin:3px 0 8px;">'+it.desc+'</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    if(canUse)  act+='<button class="btn gold" id="invUseBtn" style="padding:8px 14px;" onclick="useItem(INV_SEL);refreshInvPanel();">'+(it.use==='heal'?'Eat / Drink (+'+it.heal+' HP)':'Use')+'</button>';
    if(canQuick) act+='<button class="btn" id="invQuickBtn" style="padding:8px 14px;" onclick="P.quickItem=INV_SEL;buildHotbar();refreshUI();refreshInvPanel();toast(\'Quick slot: <b>\'+ITEMS[INV_SEL].name+\'</b>\');">\u21c4 Set Quick Slot</button>';
    act+='<button class="btn ghost" style="padding:8px 12px;" onclick="INV_SEL=null;refreshInvPanel();">Close</button>';
    act+='</div></div>';
    grid.insertAdjacentHTML('beforeend',act);
  } else {
    grid.insertAdjacentHTML('beforeend','<div style="grid-column:1/-1;font-size:11px;color:var(--parch-dim);margin-top:8px;">Tap an item for options; \u21c4 marks your quick slot.</div>');
  }
}
function unequipArmor(){
  if((P.armor||0)===0){ toast('Just your traveling clothes - nothing to take off.'); return; }
  P.armor=0; Snd.pickup(); toast('Armor packed away. The wind gets a vote again.');
  refreshInvPanel(); refreshUI();
}
function refreshSkillsPanel(){
  if(document.getElementById('skillPanel').style.display!=='block') return;
  const rows=document.getElementById('skillRows'); rows.innerHTML='';
  for(const k in SKILLS){
    const sk=P.skills[k], need=xpForLevel(sk.lvl);
    rows.insertAdjacentHTML('beforeend',
      '<div class="skrow"><div class="skn">'+SKILLS[k].name+'</div><div class="sklv">'+sk.lvl+'</div>'+
      '<div class="skbar"><div class="fill" style="width:'+Math.round(sk.xp/need*100)+'%"></div></div>'+
      '<div class="perk">'+SKILLS[k].perk+'</div></div>');
  }
}
const QLOG_OPEN={};
function refreshQuestLog(){
  if(document.getElementById('questPanel').style.display!=='block') return;
  const box=document.getElementById('qlog'); box.innerHTML='';
  const qf=(document.getElementById('qsearch').value||'').trim().toLowerCase();
  const matches=(t)=>!qf || String(t).toLowerCase().includes(qf);
  const order=['welcome','kit','sharpen','slimes','mushrooms','skeletons','king','fish','harvest','cat','shells','pearlq','remember','springs','cove','orchard','wreck','fittings','provisions','masterwork','wolffold','feast','necklace','profit','echoes','gravelord','setsail','bounty','alpha','embers','mossbrew','welcome2','nets','roadclear','hedda1','hedda2','torv1','torv2','ivo1','feud1','feud2','sting1','undermaw1','ribbon1','ribbon2','ribbon3','hunt1','tame1','surf1','board','tide','roost','thaw','audience','pendant','enchanter','homecoming'];
  let any=false;
  for(const id of order){
    const st=qs(id); if(!st || st==='avail') continue;
    // staged chains show only their current chapter, not every superseded one
    const q=QUESTS[id];
    if(q.stageOf){
      let superseded=false;
      for(const id2 of order){ const q2=QUESTS[id2];
        if(q2 && q2.stageOf===q.stageOf && q2.stage>q.stage && qs(id2)){ superseded=true; break; } }
      if(superseded) continue;
    }
    if(!(matches(q.title)||matches(q.log)||matches(q.brief))) continue;
    any=true;
    const el=document.createElement('div');
    el.className='qlogItem'+(st==='done'?' done':'')+(QLOG_OPEN[id]?' open':'');
    el.innerHTML='<div class="qt">'+q.title+(q.stageOf?' <span style="color:var(--parch-dim);font-weight:normal;">('+q.stage+'/3)</span>':'')+(st==='done'?' ✓':'')+'</div>'+
      '<div class="qd">'+q.log+'</div>'+
      (st==='active'? '<div class="qp'+(questReady(id)?' ready':'')+'">'+questProgressText(id)+'</div>':'')+
      '<div class="qdet"><i>\u201c'+q.brief+'\u201d</i><br><span style="color:var(--parch-dim);">- '+npcName(q.giver)+
      (st==='active'?' \u00b7 Objective: '+(questProgressText(id)||q.log):'')+'</span></div>';
    el.onclick=()=>{ QLOG_OPEN[id]=!QLOG_OPEN[id]; el.classList.toggle('open',!!QLOG_OPEN[id]); Snd.step&&Snd.step(6); };
    box.appendChild(el);
  }
  const avail = order.filter(id=>qs(id)==='avail');
  if(avail.length) box.insertAdjacentHTML('beforeend','<div style="font-size:12px;color:var(--parch-dim);">'+avail.length+' villager'+(avail.length>1?'s have':' has')+' work for you - look for the <b style="color:var(--ember)">!</b> marks.</div>');
  if(!any && !avail.length) box.innerHTML='<div style="font-size:12px;color:var(--parch-dim);">Speak with Elder Maren by the village well.</div>';
  const total=Object.keys(LORE).length, read=Object.keys(P.loreRead||{});
  let lh='<div style="margin-top:12px;border-top:1px solid #3a2c1c;padding-top:8px;">'+
    '<div class="qt" style="color:var(--ember);">Lore Journal - '+read.length+'/'+total+'</div>';
  if(read.length){
    for(const k of read){ if(LORE[k] && (matches(LORE[k].title)||matches(LORE[k].text))) lh+='<div class="qlogItem" style="margin-top:6px;"><div class="qt" style="font-size:12px;">'+LORE[k].title+'</div><div class="qd">'+LORE[k].text+'</div></div>'; }
  } else lh+='<div class="qd" style="font-size:11px;color:var(--parch-dim);">Books wait indoors; old stones wait among the ruins. Read them.</div>';
  lh+='</div>';
  box.insertAdjacentHTML('beforeend',lh);
}
function questProgressText(id){
  const q=QUESTS[id];
  if(questReady(id)) return 'Ready - return to '+npcName(q.giver)+'!';
  if(q.kind==='gather'){ return Object.keys(q.need).map(it=> ITEMS[it].name+' '+Math.min(q.need[it],P.inv[it]||0)+'/'+q.need[it]).join(' · '); }
  if(q.kind==='kill'){ const k=Object.keys(q.kill)[0];
    return ((MOBDEF[k]&&MOBDEF[k].name+'s')||'Elites')+' '+(P.prog[id]||0)+'/'+q.kill[k]; }
  if(q.kind==='visit') return 'Find '+ZONES[q.zone].name;
  if(id==='harvest') return 'Harvested '+(P.prog.harvest||0)+'/'+q.count;
  if(id==='cat') return (G.cat&&G.cat.following)? 'Pip follows you - bring him to Nia!' : 'Search the Whisperwood';
  if(id==='sail') return (P.story&&P.story.haveSail)? 'Stormsail recovered - see Rell' : (P.story&&P.story.millDone)? 'Take the sail from the vault' : 'Throw the 3 gear-locks in the Undermill';
  return '';
}
const ISLE_IDS=['kit','mushrooms','harvest','fish','cat','king','wreck'];
function isleQuestsSettled(){ return ISLE_IDS.every(id=>qs(id)==='done'); }
// Brant's ship repair only opens once the Hollow King is felled and the strait calms.
const UNLOCK_AFTER={ wreck:['king'],
  nets:['welcome2'], roadclear:['welcome2'], hedda2:['hedda1'], torv2:['torv1'],
  ribbon2:['ribbon1'], ribbon3:['ribbon2'], tame1:['hunt1'],
  feud1:['roadclear'], sting1:['feud1'], feud2:['feud1'], undermaw1:['torv2'] };
function unlockSweep(){
  for(const id in UNLOCK_AFTER){
    if(!P.quests[id] && UNLOCK_AFTER[id].every(p=>qs(p)==='done')){
      P.quests[id]='avail';
      if(G.state==='play') toast('<b style="color:var(--ember)">! New work:</b> speak with <b>'+npcName(QUESTS[id].giver)+'</b>.',4200);
    }
  }
}
function questReadySweep(){
  unlockSweep();
  P._rn=P._rn||{};
  for(const id in P.quests){
    if(P.quests[id]!=='active' || !QUESTS[id]){ delete P._rn[id]; continue; }
    const r=questReady(id);
    if(r && !P._rn[id]){
      P._rn[id]=1;
      const q=QUESTS[id];
      toast('<b style="color:#ffd76a">✓ Quest ready:</b> '+q.title+' - return to <b>'+npcName(q.giver)+'</b>!',4800);
      Snd.quest();
    } else if(!r) delete P._rn[id];
  }
}
function updateQuestUI(){
  questReadySweep();
  const tc=document.getElementById('trackerCards'); tc.innerHTML='';
  const order=['welcome','kit','sharpen','slimes','mushrooms','skeletons','king','fish','harvest','cat','shells','pearlq','remember','springs','cove','orchard','wreck','fittings','provisions','masterwork','wolffold','feast','necklace','profit','echoes','gravelord','setsail','bounty','alpha','embers','mossbrew','welcome2','nets','roadclear','hedda1','hedda2','torv1','torv2','ivo1','feud1','feud2','sting1','undermaw1','ribbon1','ribbon2','ribbon3','hunt1','tame1','surf1','board','tide','roost','thaw','audience','pendant','enchanter','homecoming'];
  const act=order.filter(id=>QUESTS[id] && qs(id)==='active');
  const rdy=act.some(id=>questReady(id));
  G._qbtn={act:act.length, ready:rdy};
  const qb=document.getElementById('btnQuests');
  if(qb){
    qb.innerHTML='📜<span class="tx">Quests</span>'
      +(act.length? '<span class="qdot'+(rdy?' rdy':'')+'"></span>':'');
    if(qb.classList) qb.classList.toggle('qready', rdy);
  }
  refreshQuestLog();
}
/* HUD */
function refreshUI(){
  document.getElementById('hpFill').style.width=(P.hp/P.maxhp*100)+'%';
  document.getElementById('hpLbl').textContent=Math.ceil(P.hp)+' / '+P.maxhp;
  document.getElementById('mpFill').style.width=(P.mp/P.maxmp*100)+'%';
  document.getElementById('mpLbl').textContent=Math.ceil(P.mp)+' mana';
  document.getElementById('goldTxt').textContent=P.gold;
  const pl=document.getElementById('plvlTxt'); if(pl) pl.textContent='Lv '+(P.level||1);
  const hp=document.getElementById('hot_potion'); if(hp) hp.querySelector('.cnt').textContent=P.inv[P.quickItem||'potion']||0;
  updateMountBtn();
}
/* Touch mount/dismount button - only shows once you own a mount and are
   out in the world. Cheap-guarded so it can be pinged every frame. */
let _mountBtnKey=null;
function ownsMount(){ return !!(P.horse || (P.unlocked && P.unlocked.moa)); }
function updateMountBtn(){
  // indoors there's nothing to fight - hide the touch attack (sword) & dodge
  // (dash) buttons so the room reads calm
  if(isTouch){
    const hide = !!G.interior;
    const ab=document.getElementById('attackBtn'), db=document.getElementById('dodgeBtn');
    if(ab) ab.style.display = hide?'none':'';
    if(db) db.style.display = (hide || !(P.unlocked && P.unlocked.dash))?'none':'';
  }
  const btn=document.getElementById('mountBtn'); if(!btn) return;
  const show = isTouch && ownsMount() && !G.interior && !(typeof inDungeon==='function' && inDungeon()) && G.state==='play' && !P.dead;
  const label = P.riding? 'Walk' : 'Ride';
  const key = (show?1:0)+label;
  if(key===_mountBtnKey) return;
  _mountBtnKey=key;
  btn.style.display = show? 'flex':'none';
  btn.textContent = label;
  btn.title = P.riding? 'Dismount' : 'Mount';
}
function toggleRide(){
  if(G.state!=='play') return;
  if(!ownsMount()){ return; }
  if(G.interior || (typeof inDungeon==='function' && inDungeon())){ toast('No room to ride in here.',1500); return; }
  P.riding = P.riding? 0 : 1;
  Snd.pickup && Snd.pickup();
  updateMountBtn();
}
