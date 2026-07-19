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
  if(CINE){ updateCine(dt); render(); if(CINE) drawCineOverlay(); return; }
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
let CINE=null;
function startCinematic(){
  CINE={t:0, dur:5.2,
    capts:[[0.2,'The strait took the ship, the cargo, and the crew.'],
           [1.9,'It spat out one soul on the shores of Emberwick Isle.'],
           [3.6,'CHAPTER I - TUTORIAL SHORES']]};
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; // locked on the castaway
  const skip=()=>endCine();
  window.addEventListener('pointerdown',skip,{once:true});
  window.addEventListener('keydown',skip,{once:true});
}
function endCine(){
  if(!CINE) return;
  CINE=null;
  banner('EMBERWICK ISLE','TUTORIAL SHORES - CHAPTER I');
  setTimeout(()=> toast('Find <b style="color:var(--ember)">Elder Maren</b> by the village well - look for the <b style="color:var(--ember)">!</b>',5200),600);
  Snd.quest();
}
function drawCineOverlay(){
  const bh=Math.min(1, CINE.t/0.45, (CINE.dur-CINE.t)/0.6)*Math.min(76, VH*0.115);
  cx.setTransform(DPR,0,0,DPR,0,0);
  cx.fillStyle='#000';
  cx.fillRect(0,0,VW,bh); cx.fillRect(0,VH-bh,VW,bh);
  for(const [st,txt] of CINE.capts){
    const a=Math.min(1,(CINE.t-st)/0.7, (st+2.7-CINE.t)/0.7);
    if(a>0){
      cx.fillStyle='rgba(236,226,204,'+a+')';
      cx.font='italic 20px Georgia'; cx.textAlign='center';
      cx.shadowColor='rgba(0,0,0,1)'; cx.shadowBlur=10;
      cx.fillText(txt, VW/2, VH-bh-30);
      cx.shadowBlur=0;
    }
  }
  const sa=0.55+0.3*Math.sin(G.time*3);
  cx.fillStyle='rgba(220,210,190,'+sa+')';
  cx.font='12px Georgia'; cx.textAlign='center'; cx.letterSpacing='2px';
  cx.fillText('- tap anywhere to skip -', VW/2, bh>24? bh-9 : 20);
  cx.letterSpacing='0px';
}
function updateCine(dt){
  CINE.t+=dt;
  G.cam.x=isoX(P.x,P.y)-VW/2; // no drift, no tricks - just the castaway
  G.cam.y=isoY(P.x,P.y)-VH/2-20;
  if(CINE.t>=CINE.dur) endCine();
}
function startFresh(){
  for(const k in EXPL) delete EXPL[k];
  Snd.init(); Amb.ensure(); Music.nextT=0;
  document.getElementById('titleOv').style.display='none';
  G.state='play';
  if(!SafeStore.persistent) setTimeout(()=>toast('Heads up: this browser view blocks saving - progress lasts <b>this session only</b>. Open the file directly in a browser tab to keep saves.',7000),1200);
  P.quests.welcome='avail';
  updateQuestUI();
  startCinematic();
}
document.getElementById('continueBtn').onclick=()=>{
  const sc=store.get(); if(!sc) return;
  Snd.init(); Amb.ensure(); Music.nextT=0;
  document.getElementById('titleOv').style.display='none';
  G.state='play';
  if(loadCode(sc)===false){
    toast('The old save was unreadable - starting fresh.');
    P.quests.welcome='avail'; updateQuestUI();
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

