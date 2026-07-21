/* =====================================================================
   EXPLORATION - fog of war, zone discovery, fast travel
   ===================================================================== */
const EXPL={}; // worldId -> Uint8Array(MAPW*MAPH), 1 = seen
function explGrid(){
  if(!EXPL[G.worldId] || EXPL[G.worldId].length<MAPW*MAPH) EXPL[G.worldId]=new Uint8Array(MAPW*MAPH);
  return EXPL[G.worldId];
}
let explT=0;
function stampExplore(dt){
  explT-=dt; if(explT>0) return; explT=0.25;
  const g=explGrid(), r=9, px=P.x|0, py=P.y|0;
  for(let y=Math.max(0,py-r); y<=Math.min(MAPH-1,py+r); y++)
    for(let x=Math.max(0,px-r); x<=Math.min(MAPW-1,px+r); x++)
      if((x-px)*(x-px)+(y-py)*(y-py)<=r*r) g[y*MAPW+x]=1;
  checkDiscover();
}
function checkDiscover(){
  P.disc=P.disc||{};
  for(const k in ZONES){
    const z=ZONES[k]; if(!z.name) continue;
    const key=G.worldId+':'+k;
    if(!P.disc[key] && dist(P.x,P.y,z.x,z.y)<(z.r||6)+1){
      P.disc[key]=1;
      banner('DISCOVERED', z.name + (z.lv? ' - Lv '+z.lv[0]+'\u2013'+z.lv[1] : '')); Snd.quest(); giveGold(8);
      const all=Object.keys(ZONES).filter(k2=>ZONES[k2].name).every(k2=>P.disc[G.worldId+':'+k2]);
      if(all) award('wayfarer');
    }
  }
}
function packExpl(){
  const o={};
  for(const id in EXPL){
    const g=EXPL[id], bytes=new Uint8Array(Math.ceil(g.length/8));
    for(let i=0;i<g.length;i++) if(g[i]) bytes[i>>3]|=1<<(i&7);
    let s=''; for(let i=0;i<bytes.length;i++) s+=String.fromCharCode(bytes[i]);
    o[id]=btoa(s);
  }
  return o;
}
function unpackExpl(o){
  for(const id in (o||{})){
    try{
      const bin=atob(o[id]), n=bin.length*8, g=new Uint8Array(n);
      for(let i=0;i<n;i++) if(bin.charCodeAt(i>>3)&(1<<(i&7))) g[i]=1;
      EXPL[id]=g;
    }catch(e){}
  }
}
function tryFastTravel(tx,ty){
  if(G.interior || P.dead || G.state!=='play') return;
  P.disc=P.disc||{};
  let best=null, bd=1e9;
  for(const k in ZONES){
    const z=ZONES[k]; if(!z.name || !P.disc[G.worldId+':'+k]) continue;
    const d2=dist(tx,ty,z.x,z.y);
    if(d2<Math.max(z.r||6,5)+2 && d2<bd){ bd=d2; best=z; }
  }
  if(!best) return false;
  if(dist(P.x,P.y,best.x,best.y)<6){ toast('You are already at <b>'+best.name+'</b>.'); return false; }
  if(G.mobs.some(m=>!m.dead && m.state==='chase' && dist(P.x,P.y,m.x,m.y)<9)){
    toast('<b style="color:#e06a5a">Enemies nearby</b> - you cannot travel now.'); return false;
  }
  const s=findOpenNear(Math.round(best.x),Math.round(best.y),6);
  if(!s){ toast('No safe footing there.'); return false; }
  closeAllPanels(); P.click=null;
  burst(P.x,P.y-0.5,'#ffd76a',14);
  P.x=s[0]+0.5; P.y=s[1]+0.5; G.cam.x=P.x; G.cam.y=P.y;
  burst(P.x,P.y-0.5,'#ffd76a',16); Snd.magic();
  toast('<b style="color:#ffd76a">Travelled</b> to '+best.name+'.');
  autoSave(); return true;
}
document.getElementById('bigMap').onclick=(e)=>{
  const r=e.target.getBoundingClientRect();
  tryFastTravel((e.clientX-r.left)/r.width*MAPW, (e.clientY-r.top)/r.height*MAPH);
};
let lastT=0, uiTick=0;
function frame(ts){
  requestAnimationFrame(frame);
  const raw=Math.min(0.05,(ts-lastT)/1000||0.016); lastT=ts;
  if(document.hidden) return;
  if(typeof updateMountBtn==='function') updateMountBtn();
  pollGamepad();
  let dt=raw;
  if(G.hitStop>0){ G.hitStop-=raw; dt*=0.12; }        // impact freeze
  else if(G.slowmo>0){ G.slowmo-=raw; dt*=0.35; }     // cinematic slow-mo
  if(G.state!=='play'){
    // living title screen - slow drift around the sleeping village
    G.time+=raw*0.5;
    updateNPCs(raw*0.5); updateWorld(raw*0.5); WX.update(raw*0.5);
    const a=G.time*0.05;
    const wx=ZONES.village.x+Math.cos(a)*6, wy=ZONES.village.y+Math.sin(a)*6;
    G.cam.x=lerp(G.cam.x, isoX(wx,wy)-VW/2, 0.02);
    G.cam.y=lerp(G.cam.y, isoY(wx,wy)-VH/2, 0.02);
    render();
    return;
  }
  if(G.paused || G.menuPause){ render(); return; }
  G.time+=dt;
  P.stats.time=(P.stats.time||0)+dt;
  if(!G.interior) stampExplore(dt);
  if(G.interior){
    updateInterior(dt);
    Music.update(); Amb.update(dt);
    G.dayT=(G.dayT+dt/G.dayLen)%1;
    renderInterior();
    return;
  }
  updatePlayer(dt);
  updateNPCs(dt);
  updateMobs(dt);
  updateProjs(dt);
  updateWorld(dt);
  WX.update(dt); Music.update(); Amb.update(dt); updateBossUI(); ambientFX(dt); updateGulls(dt);
  G.flash=Math.max(0,G.flash-raw*1.6);
  // camera with movement look-ahead
  const lead = P.moving? 26 : 0;
  const tx=isoX(P.x,P.y)-VW/2 + (P.dir.x-P.dir.y)*lead*0.8;
  const ty=isoY(P.x,P.y)-VH/2-20 + (P.dir.x+P.dir.y)*lead*0.4;
  G.cam.x=lerp(G.cam.x,tx,Math.min(1,raw*6));
  G.cam.y=lerp(G.cam.y,ty,Math.min(1,raw*6));
  render();
  uiTick+=dt;
  if(uiTick>0.25){ uiTick=0; refreshUI(); }
  autoT+=raw;
  if(autoT>10){ autoT=0; autoSave(); }
}

function boot(){
  buildTiles(); buildFringes(); buildSprites(); buildIcons(); buildExtraSprites();
  weatherAll();
  G.worldId='isle';
  genIsleAll();
  for(let i=0;i<6;i++) G.clouds.push({x:Math.random()*MAPW, y:Math.random()*MAPH,
    vx:rnd(0.25,0.5), vy:rnd(-0.12,0.12), r:rnd(48,90)});
  pressable(document.getElementById('dodgeBtn'), ()=>{ tryRoll(); });
  buildHotbar(); refreshUI();
  // controls blurb on title
  document.getElementById('ovControls').innerHTML = isTouch
    ? '<b>Left thumb</b> - joystick to move · <b>⚔</b> - attack / gather · <b>⤸</b> - dodge roll · <b>green button</b> - talk, fish, harvest'
    : '<b>Click</b> to walk, gather, talk, fight - or <b>WASD</b> + <b>Space</b> · <b>Shift</b> dodge · <b>E</b> interact · <b>1-4</b> hotbar · <b>gamepad supported</b>';
  if(isTouch) document.getElementById('touchUI').style.display='block';
  // Continue is the hero when a save exists; New Game demands typed confirmation
  const startBtn=document.getElementById('startBtn'), contBtn=document.getElementById('continueBtn');
  if(store.get()){
    contBtn.style.display='inline-block';
    contBtn.classList.add('pulse');
    startBtn.textContent='New Game';
    startBtn.classList.add('ghostly');
  } else {
    startBtn.classList.add('pulse');
  }
  // snap camera
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  requestAnimationFrame(frame);
}
let CINE=null;   // retired opening cinematic - kept null so old "not during CINE" guards still read
// The game opens on a shipwreck: Captain Brant hauls the amnesiac castaway out
// of the surf. No letterbox cinematic - just first words on a strange shore.
function startIntro(){
  const brant = (G.npcs||[]).find(n=>n.id==='brant');
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; // hold on the castaway
  if(!brant){ afterIntro(); return; }
  P.click=null;
  dlg.open=true; dlg.npc=brant;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent=brant.name;
  drawPortrait(brant);
  const p4=()=>{
    setDialog('“Here\'s what I know: you\'re on <b>Emberwick</b>, and you\'re breathing - which beats the alternative. Get your legs under you. See <b>Bram the smith</b>, up by the forge - he\'ll put a blade in your hand. This isle has need of one.”',
      [{label:'Steady myself', cls:'gold', fn:()=>{ closeDialog(); afterIntro(); }}]);
  };
  const p3=()=>{
    setDialog('<i>He waits for a name, a heading - anything - and reads the blank on your face.</i> “...Nothing. Not even your own name.” <i>He nods slowly.</i> “Aye. The strait does that - takes the ship, the crew, and sometimes the memory along with them. Don\'t claw at it. A name washes back, or you earn a new one.”',
      [{label:'Continue', fn:p4}]);
  };
  const p2=()=>{
    setDialog('“Your ship went down on the strait - I watched the mast go under. Same reef that gutted my own <b>Tidewalker</b>, yonder at the dock.” <i>The old captain squints at you.</i> “You\'re the only soul the sea gave back. Do you know it - your ship? Your name? Where you were bound?”',
      [{label:'…I- I don\'t remember.', fn:p3}]);
  };
  setDialog('<i>You come to face-down in the surf, salt raw in your throat. A weathered hand closes on your collar and hauls you up onto the sand.</i> “Easy - easy. You\'re alive. Thought the reef had kept you for good.” <i>He sets you on your feet and steadies you.</i>',
    [{label:'…Where am I?', fn:p2}]);
}
function afterIntro(){
  setTimeout(()=> toast('Emberwick\'s folk each need a hand - seek the <b style="color:var(--ember)">!</b> markers. Start with <b style="color:var(--ember)">Bram the Smith</b> at the forge; he\'ll arm you for what\'s coming.',6000),700);
  if(Snd.quest) Snd.quest();
}
function startFresh(){
  for(const k in EXPL) delete EXPL[k];
  Snd.init(); Amb.ensure(); Music.nextT=0;
  document.getElementById('titleOv').style.display='none';
  G.state='play';
  // wake washed-up on the driftwood shore, by the dock and Captain Brant's wreck
  const sp=(WORLD_DEFS&&WORLD_DEFS.isle&&WORLD_DEFS.isle.spawn)||{x:32.5,y:61.5};
  P.x=sp.x; P.y=sp.y; P.dir={x:0,y:1};
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  if(!SafeStore.persistent) setTimeout(()=>toast('Heads up: this browser view blocks saving - progress lasts <b>this session only</b>. Open the file directly in a browser tab to keep saves.',7000),1200);
  openingQuests();
  updateQuestUI();
  startIntro();
}
// Each villager offers a single task from the start; Bram's is the way in
// (tools + a sword), which then opens Maren's charge against the Hollow King.
function openingQuests(){ ['kit','mushrooms','harvest','fish','cat'].forEach(q=>{ if(!P.quests[q]) P.quests[q]='avail'; }); }
document.getElementById('continueBtn').onclick=()=>{
  const sc=store.get(); if(!sc) return;
  Snd.init(); Amb.ensure(); Music.nextT=0;
  document.getElementById('titleOv').style.display='none';
  G.state='play';
  if(loadCode(sc)===false){
    toast('The old save was unreadable - starting fresh.');
    openingQuests(); updateQuestUI();
  }
};
document.getElementById('startBtn').onclick=()=>{
  if(!store.get()){ startFresh(); return; }
  // a save exists: never wipe on a stray tap
  document.getElementById('confirmWipe').style.display='block';
  const inp=document.getElementById('wipeInput');
  inp.value=''; document.getElementById('wipeConfirm').disabled=true;
  if(!isTouch){ try{ inp.focus(); }catch(e){} } // no auto-focus on touch: keeps the keyboard (and any zoom) away until tapped
};
document.getElementById('wipeInput').addEventListener('input',function(){
  document.getElementById('wipeConfirm').disabled = this.value.trim().toLowerCase()!=='start over';
});
document.getElementById('wipeInput').addEventListener('keydown',e=> e.stopPropagation());
document.getElementById('wipeConfirm').onclick=()=>{
  if(document.getElementById('wipeInput').value.trim().toLowerCase()!=='start over') return;
  store.clear();
  document.getElementById('confirmWipe').style.display='none';
  startFresh();
};
document.getElementById('wipeCancel').onclick=()=>{
  document.getElementById('confirmWipe').style.display='none';
};
window.addEventListener('keydown',e=>{ if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault(); });
document.addEventListener('touchmove',e=>{ if(e.target===cv) e.preventDefault(); },{passive:false});
document.addEventListener('gesturestart',e=> e.preventDefault());
document.addEventListener('dblclick',e=> e.preventDefault(),{passive:false});
let lastTapEnd=0;
document.addEventListener('touchend',e=>{
  const now=Date.now();
  const onGame = e.target===cv || e.target.id==='joyZone' || (e.target.closest && e.target.closest('#touchUI'));
  if(now-lastTapEnd<330 && onGame) e.preventDefault();
  lastTapEnd=now;
},{passive:false});

boot();

