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
  kingslayer:{t:'Kingslayer',d:'Fell the Hollow King.'},
  wolfsbane:{t:'Wolfsbane',d:'Slay Greymaw, the Alpha.'},
  wayfarer:{t:'Wayfarer',d:'Chart every region of an island.'}
};
function award(id){
  if(!ACH[id] || P.ach[id]) return;
  P.ach[id]=true;
  banner('ACHIEVEMENT', ACH[id].t+' - '+ACH[id].d);
  Snd.quest();
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
    alphaDead: mobs.some(m=>m.kind==='alpha'&&m.dead),
    chests: decor.filter(b=>b.kind==='chestOpen').map(b=>[Math.round(b.x*2),Math.round(b.y*2)])
  };
}
function saveCode(){
  const flags={};
  flags[G.worldId]=worldFlagsFrom(G.mobs,G.decor);
  for(const id in WORLDS){ if(id!==G.worldId) flags[id]=worldFlagsFrom(WORLDS[id].mobs,WORLDS[id].decor); }
  const d={v:2,world:G.worldId,x:+P.x.toFixed(2),y:+P.y.toFixed(2),
    gold:P.gold,hp:Math.round(P.hp),maxhp:P.maxhp,mp:Math.round(P.mp),
    inv:P.inv,skills:P.skills,quests:P.quests,prog:P.prog,
    unlocked:P.unlocked,swordTier:P.swordTier,armor:P.armor,armorOwn:P.armorOwn||0,kit:!!P.kit,es:P.earlySail?1:0,ek:P.earlyKit?1:0,dyt:+(G.dayT||0).toFixed(3),lv:P.level,xl:P.xpL,bk:P.bank,vault:P.vault||{},gritLv:P.gritLv||0,gritN:P.gritN||0,spell:P.spell||'bolt',spells:P.spells||{},qi:P.quickItem||'potion',bind:P.bind,hs:P.horse?1:0,hm:P.home?1:0,hu:P.homeUp,tools:P.tools,rr:P.resortRoom?1:0,
    projects:P.projects,contract:P.contract,lore:P.loreRead,stats:P.stats,ach:P.ach,
    story:P.story||{act:1,necklace:true},
    disc:P.disc||{},expl:packExpl(),flags};
  return btoa(unescape(encodeURIComponent(JSON.stringify(d))));
}
function applyWorldFlags(f){
  if(!f) return;
  if(f.bossDead){ const b=G.mobs.find(m=>m.boss); if(b){b.dead=true;b.respawnT=-1;} G.flags.intro_boss=true; }
  if(f.alphaDead){ const a=G.mobs.find(m=>m.kind==='alpha'); if(a){a.dead=true;a.respawnT=-1;} G.flags.intro_alpha=true; }
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
  P.maxhp=d.maxhp||100; P.hp=Math.min(d.hp||d.maxhp||100,P.maxhp); P.mp=d.mp||30;
  P.inv=d.inv||{}; if(d.skills) P.skills=d.skills;
  P.quests=d.quests||{}; P.prog=d.prog||{};
  // One-time migration: anyone who felled the wyrm under the PRE-rework version
  // never saw the inside-the-volcano scene, the faint-not-die twist, or the
  // mage-hunt follow-up. A new-version completion always leaves a `vhunt` quest
  // behind; an old one never does - so wyrm-done-but-no-vhunt uniquely marks an
  // old save. Roll the whole Ashwing chain back so Vath returns to Kohana and
  // it can be replayed fresh. Guarded so it only ever fires once.
  if(qs('wyrm')==='done' && !P.quests.vhunt && !P.prog.wyrmReplayed){
    P.prog.wyrmReplayed=1;
    delete P.quests.wyrm;   // re-offered as 'avail' on entering the east isle
    delete P.prog.vhunt;
    P.metDragon=0; P.mageHuntStarted=0; P.eastDragonFought=0; P.eastDragonFreed=0;
  }
  P.unlocked=d.unlocked||{}; P.swordTier=d.swordTier||0;
  P.tools=d.tools||{axe:0,pick:0}; P.armor=d.armor||0;
  P.armorOwn=Math.max(d.armorOwn||0, P.armor||0);
  if(P.swordTier>0 || qs('sharpen')==='done') P.unlocked.melee=true; // migrate older saves
  P.kit = !!d.kit || P.swordTier>0 || qs('kit')==='done' || qs('sharpen')==='done';
  P.earlySail=!!d.es; P.earlyKit=!!d.ek;
  if(typeof d.dyt==='number') G.dayT=d.dyt;
  P.level=d.lv||1; P.xpL=d.xl||0; P.bank=d.bk||0; P.vault=d.vault||{}; P.gritLv=d.gritLv||0; P.gritN=d.gritN||0; P.spell=d.spell||'bolt'; P.spells=d.spells||{}; P.quickItem=d.qi||'potion'; P.bind=d.bind||null;
  P.horse=d.hs?1:0; P.home=d.hm?1:0; P.homeUp=d.hu||{}; P.resortRoom=d.rr?1:0;

  P.projects=d.projects||{}; P.contract=d.contract||0; P.loreRead=d.lore||{};
  P.stats=d.stats||{}; P.ach=d.ach||{};
  P.story=d.story||{act:1,necklace:true}; if(P.story.necklace===undefined) P.story.necklace=true;
  P.disc=d.disc||{}; unpackExpl(d.expl);
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
  }
  P.x=d.x; P.y=d.y;
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  updateQuestUI(); buildHotbar(); refreshUI(); refreshSkillsPanel();
  closeAllPanels();
  banner('SAVE LOADED','WELCOME BACK, HERO');
  Snd.quest();
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
      const order=['melee','bow','staff'].filter(w=> w==='melee'||P.unlocked[w]);
      let i=order.indexOf(P.weapon); if(i<0) i=0;
      i=(i+(edge(5)?1:order.length-1))%order.length;
      selectWeapon(order[i]);
    }
    if(edge(9)) togglePause();
  } else if(G.state==='play' && dlg.open && edge(0)){ doInteract(); }
  gpPrev=gp.buttons.map(x=>!!x.pressed);
}

