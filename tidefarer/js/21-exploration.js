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
// A falconer's rook maps the whole current isle: lift the fog everywhere, but
// leave the named zones to be DISCOVERED on foot (you still earn those banners).
function scoutReveal(){ explGrid().fill(1); }
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
  // once the accept-dialog is dismissed, launch the deferred ward-gate reveal pan
  if(G.wardPan && !dlg.open && !G.camCine && G.worldId==='isle' && typeof WARD_GATEY!=='undefined'){
    const gx=((typeof WARD_MINX!=='undefined')?(WARD_MINX+WARD_MAXX)/2:Math.round(ZONES.ruins.x))+0.5;
    G.camCine={ wx:gx, wy:WARD_GATEY+0.5, t:0, outDur:0.95, holdDur:1.4, backDur:0.95, fired:false };
    if(typeof cinematic==='function') cinematic(true);   // letterbox for the beat
    G.wardPan=0;
  }
  if(G.camCine){
    // a scripted reveal pan: sweep up to the gate, hold, and sweep back to the hero.
    // The normal player-follow is suspended for its duration.
    const c=G.camCine; c.t+=raw;
    if(!c.fired && c.t>=c.outDur){ c.fired=true;   // punctuate the reveal as the camera arrives
      if(typeof banner==='function') banner('THE WARD-GATE OPENS','THE CAUSEWAY LIES OPEN - THE HOLLOW KING STIRS');
      if(typeof shockwave==='function') shockwave(c.wx,c.wy,'rgba(155,224,160,0.85)',60);
      G.shake=Math.max(G.shake||0,0.5); if(Snd.quest) Snd.quest();
    }
    const onGate = c.t < c.outDur + c.holdDur;
    const fx = onGate? c.wx : P.x, fy = onGate? c.wy : P.y;
    G.cam.x=lerp(G.cam.x, isoX(fx,fy)-VW/2,    Math.min(1,raw*3));
    G.cam.y=lerp(G.cam.y, isoY(fx,fy)-VH/2-20, Math.min(1,raw*3));
    if(c.t>=c.outDur+c.holdDur+c.backDur){ G.camCine=null; if(typeof cinematic==='function') cinematic(false); }
  } else {
    // camera with movement look-ahead
    const lead = P.moving? 26 : 0;
    const tx=isoX(P.x,P.y)-VW/2 + (P.dir.x-P.dir.y)*lead*0.8;
    const ty=isoY(P.x,P.y)-VH/2-20 + (P.dir.x+P.dir.y)*lead*0.4;
    G.cam.x=lerp(G.cam.x,tx,Math.min(1,raw*6));
    G.cam.y=lerp(G.cam.y,ty,Math.min(1,raw*6));
  }
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
  // snap camera
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  requestAnimationFrame(frame);
  enterGame();   // no title menu - drop straight into the saved adventure, or a fresh one
}
/* No title screen: on load, continue the saved adventure, or begin a new one
   (the shipwreck opening). A reset lives in the pause menu ("Start Over"). */
function enterGame(){
  const sc = store.get();
  const t=document.getElementById('titleOv'); if(t) t.style.display='none';
  if(sc){
    Snd.init(); Amb.ensure(); Music.nextT=0;
    G.state='play';
    if(loadCode(sc)===false){ toast('The old save was unreadable - starting fresh.'); startFresh(); }
  } else {
    startFresh();
  }
}
let CINE=null;   // retired opening cinematic - kept null so old "not during CINE" guards still read
// The game opens on a shipwreck: Elder Maren, the island's old wise-woman, finds
// the amnesiac castaway washed up on the shore and draws them out of the surf.
// No letterbox cinematic - just first words on a strange shore. (The castaway
// wakes beside Bram's forge, so the greeter is seated right there at your side;
// Captain Brant stays with his wrecked ship at the dock for the crossing later.)
function startIntro(){
  const greeter = (G.npcs||[]).find(n=>n.id==='maren');
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; // hold on the castaway
  if(!greeter){ afterIntro(); return; }
  // seat the elder on an open tile RIGHT beside you and turn her to face you, so
  // the one who speaks is actually there. Remember her village spot to restore it.
  if(greeter._home===undefined) greeter._home={x:greeter.x, y:greeter.y, wander:greeter.wander};
  if(typeof findOpenNear==='function'){
    const px=Math.round(P.x), py=Math.round(P.y);
    let sp=null;
    for(const off of [[1,1],[0,1],[1,0],[-1,1],[1,-1],[-1,0],[0,-1],[-1,-1]]){
      const c=findOpenNear(px+off[0], py+off[1], 2);
      if(c && !(c[0]===px && c[1]===py)){ sp=c; break; }
    }
    if(sp){ greeter.x=sp[0]+0.5; greeter.y=sp[1]+0.5; }
  }
  greeter.wander=0;
  greeter.face={x:(P.x>=greeter.x?1:-1), y:(P.y>=greeter.y?1:-1)};
  P.click=null;
  dlg.open=true; dlg.npc=greeter;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent=greeter.name;
  drawPortrait(greeter);
  const p4=()=>{
    setDialog('“Here\'s what I know: you\'re on <b>Emberwick</b>, and you\'re breathing - which is more than the reef usually allows. Get your legs under you. See <b>Bram the smith</b>, at the forge just here - he\'ll put a blade in your hand. This isle has need of one.”',
      [{label:'Steady myself', cls:'gold', fn:()=>{ closeDialog(); afterIntro(); }}]);
  };
  const p3=()=>{
    setDialog('<i>She waits for a name, a heading - anything - and reads the blank on your face.</i> “...Nothing. Not even your own name.” <i>The old woman nods slowly.</i> “The strait does that - takes the ship, the crew, and sometimes the memory along with them. Don\'t claw at it. A name washes back, child, or you earn a new one.”',
      [{label:'Continue', fn:p4}]);
  };
  const p2=()=>{
    setDialog('“Your ship went down on the strait in the night - I saw its lanterns swallowed from the headland. That reef has fed on hulls longer than I\'ve been grey.” <i>The old woman studies your face.</i> “You\'re the only soul the sea gave back. Do you know it - your ship? Your name? Where you were bound?”',
      [{label:'…I- I don\'t remember.', fn:p3}]);
  };
  setDialog('<i>You come to face-down in the surf, salt raw in your throat. A pair of old, steady hands takes you under the arms and draws you up onto the sand.</i> “Easy now - easy. You\'re alive. I felt the tide turn in the night and knew it had given something back.” <i>She sets you on your feet and steadies you.</i>',
    [{label:'…Where am I?', fn:p2}]);
}
function afterIntro(){
  // the elder rises and heads back to her place in the village
  const greeter=(G.npcs||[]).find(n=>n.id==='maren');
  if(greeter && greeter._home){ greeter.x=greeter._home.x; greeter.y=greeter._home.y; greeter.hx=greeter._home.x; greeter.hy=greeter._home.y; greeter.wander=greeter._home.wander; greeter.face={x:0,y:1}; delete greeter._home; }
  setTimeout(()=> toast('Emberwick\'s folk each need a hand - seek the <b style="color:var(--ember)">!</b> markers. Start with <b style="color:var(--ember)">Bram the Smith</b> at the forge; he\'ll arm you for what\'s coming.',6000),700);
  if(Snd.quest) Snd.quest();
}
function startFresh(){
  G.wiping=false;   // saving is fine again for the new game (matters on the no-reload fallback path)
  for(const k in EXPL) delete EXPL[k];
  Snd.init(); Amb.ensure(); Music.nextT=0;
  document.getElementById('titleOv').style.display='none';
  G.state='play';
  // start beside Bram at the forge - your first stop for tools and a blade
  const bram=(G.npcs||[]).find(n=>n.id==='bram');
  if(bram){ P.x=bram.x-3; P.y=bram.y+1; } else { P.x=56.5; P.y=58.5; }
  P.dir={x:1,y:0};
  if(typeof unstickEntity==='function') unstickEntity(P);   // never wake wedged in a wall
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
  // Block any save from firing during teardown. location.reload() hides the page,
  // which triggers the visibilitychange auto-save - that would rewrite the save we
  // just cleared, and enterGame() would load it back (skipping the intro).
  G.wiping=true;
  store.clear();
  document.getElementById('confirmWipe').style.display='none';
  // Full reset: reload so boot() rebuilds a pristine world and player from
  // scratch, then enterGame() begins the new-game intro - no stale in-memory
  // progress (level, inventory, harvested world) can survive.
  try{ location.reload(); }catch(e){ startFresh(); }
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

