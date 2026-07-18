/* =====================================================================
   INPUT - keyboard, mouse, touch
   ===================================================================== */
const keys={};
const input={mx:0,my:0,mouseDown:false,joy:{x:0,y:0,active:false},attack:false};
const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints>0);

window.addEventListener('keydown',e=>{
  if(G.state!=='play') return;
  const k=e.key.toLowerCase();
  keys[k]=true;
  if(k==='e'||k==='enter'){ doInteract(); }
  if(k===' '){ e.preventDefault(); input.attack=true; }
  if(k==='1') selectWeapon('melee');
  if(k==='2') selectWeapon('bow');
  if(k==='3') selectWeapon('staff');
  if(k==='4') useItem(P.quickItem||'potion');
  if(k==='r') cycleQuickItem();
  if(k==='m' && (P.horse||P.unlocked&&P.unlocked.moa) && !G.interior && G.state==='play'){ P.riding=P.riding?0:1; toast(P.riding?'<b>Mounted.</b>':'<b>Dismounted.</b>',1400); }
  if(k==='escape'){
    if(G.paused){ togglePause(false); return; }
    if(dlg.open){ closeDialog(); return; }
    const anyPanel=['invPanel','skillPanel','questPanel','mapPanel'].some(id=>document.getElementById(id).style.display==='block');
    if(anyPanel){ closeAllPanels(); return; }
    togglePause(true);
  }
});
window.addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; if(e.key===' ') input.attack=false; });

cv.addEventListener('mousemove',e=>{ input.mx=e.clientX; input.my=e.clientY;
  if(input.mouseDown && P.click && P.click.type==='pos' && !G.interior){
    const w=screenToWorld(e.clientX,e.clientY); P.click.x=w.x; P.click.y=w.y;
  }
});
cv.addEventListener('mousedown',e=>{ if(G.state!=='play') return;
  Snd.init(); input.mouseDown=true;
  if(dlg.open) return;
  if(G.interior){ interiorClick(e.clientX,e.clientY); return; }
  const w=screenToWorld(e.clientX,e.clientY);
  P.click=pickClickTarget(w.x,w.y);
  P._seek={x:P.x,y:P.y,t:0};
  const fx=P.click.m? P.click.m : P.click.n? P.click.n : P.click;
  P.clickFx={x:fx.x,y:fx.y,t:0.6};
  if(P.click.type==='mob'){
    const m=P.click.m, rng=P.weapon==='melee'?1.5:6.5;
    if(dist(P.x,P.y,m.x,m.y)<=rng){ facePoint(m.x,m.y); tryAttack(true); }
  }
});
window.addEventListener('mouseup',()=> input.mouseDown=false);

function pickClickTarget(wx,wy){
  let best=null, bd=1.1;
  for(const m of G.mobs){
    if(m.dead) continue;
    const r=(m.boss||m.kind==='alpha')?1.8:1.0;
    const d=dist(wx,wy,m.x,m.y-0.3);
    if(d<r && d<bd){ bd=d; best={type:'mob',m}; }
  }
  if(best) return best;
  const cand=[];
  for(const n of G.npcs){ if(n.hidden) continue; cand.push({type:'inter',x:n.x,y:n.y,r:0.95,range:1.7,
    go:()=>{ facePoint(n.x,n.y); openDialog(n); }}); }
  for(const n of G.nodes){
    if(n.dead) continue;
    if(n.kind==='fish') cand.push({type:'inter',x:n.x,y:n.y,r:0.95,range:1.9,go:()=>{ facePoint(n.x,n.y); fishAction(n); }});
    else cand.push({type:'gather',x:n.x,y:n.y,r:0.9,range:1.5,n});
  }
  for(const pl of G.plots) cand.push({type:'inter',x:pl.x+0.5,y:pl.y+0.5,r:0.8,range:1.5,go:()=>doInteract()});
  for(const b of G.decor){
    if(b.kind==='boat') cand.push({type:'inter',x:b.x,y:b.y,r:1.5,range:2.2,go:()=>attemptSail()});
    else if((b.kind==='chest'||b.kind==='chestOpen') && !(b.cache && !qs('ribbon2'))) cand.push({type:'inter',x:b.x,y:b.y,r:1.0,range:1.8,go:()=>beginOpenChest(b)});
    else if(b.kind==='pillar') cand.push({type:'inter',x:b.x,y:b.y,r:0.9,range:1.55,go:()=>readLore(b.loreKey||('stone@'+(G.worldId==='main'?'main':'isle')))});
    else if(b.kind==='cavemouth') cand.push({type:'inter',x:b.x,y:b.y,r:1.2,range:2.0,go:()=>enterCave()});
    else if(b.kind==='crypt') cand.push({type:'inter',x:b.x,y:b.y+1,r:1.4,range:2.1,go:()=>readLore('crypt')});
    else if(b.kind==='well'&&P.projects.well) cand.push({type:'inter',x:b.x,y:b.y,r:1.1,range:1.7,go:()=>doInteract()});
    else if(b.kind==='house'||b.kind==='house2'||b.kind==='forge'||b.kind==='barn'||b.kind==='tower')
      cand.push({type:'inter',x:b.x,y:b.y+0.9,r:1.3,range:1.5,go:()=>enterHouse(b)});
  }
  let bi=null; bd=999;
  for(const c of cand){ const d=dist(wx,wy,c.x,c.y); if(d<c.r && d<bd){ bd=d; bi=c; } }
  if(bi) return bi;
  return {type:'pos',x:wx,y:wy};
}
function interiorClick(sx,sy){
  sx-=LB.x; sy-=LB.y;   // undo Performance Mode letterbox offset
  const I=G.interior;
  const ccx=isoX(I.w/2,I.h/2), ccy=isoY(I.w/2,I.h/2);
  const ox=sx-(VW/2-ccx), oy=sy-(VH/2+14-ccy);
  const wx=(ox/(TW/2)+oy/(TH/2))/2, wy=(oy/(TH/2)-ox/(TW/2))/2;
  let best=null, bd=1.0;
  for(const f of I.furn){
    if(!{bed:1,hearth:1,anvil:1,orb:1,books:1,shelf:1,barrel:1,hay:1,crate:1}[f.type]) continue;
    const d=dist(wx,wy,f.x,f.y);
    if(d<bd){ bd=d; best=f; }
  }
  if(best){ I.click={x:best.x,y:best.y+0.9,f:best}; return; }
  if(dist(wx,wy,I.exit.x,I.exit.y)<1.1){ I.click={x:I.exit.x,y:I.exit.y,exit:true}; return; }
  I.click={x:clamp(wx,0.95,I.w-0.95), y:clamp(wy,2.1,I.h-0.65)};
}

/* touch joystick */
const joyZone=document.getElementById('joyZone'), joyBase=document.getElementById('joyBase'), joyKnob=document.getElementById('joyKnob');
const joyRest=document.getElementById('joyRest');
let joyId=null, joyCX=0, joyCY=0;
const JOY_MAX=48;
function joyPlace(cxp,cyp){
  joyCX=cxp; joyCY=cyp;
  if(joyRest) joyRest.style.display='none';
  joyBase.style.display=joyKnob.style.display='block';
  joyBase.style.left=(cxp-55)+'px'; joyBase.style.top=(cyp-55)+'px';
  joyKnob.style.left=(cxp-25)+'px'; joyKnob.style.top=(cyp-25)+'px';
  input.joy.active=true;
}
function joyDrag(cxp,cyp){
  let dx=cxp-joyCX, dy=cyp-joyCY;
  const d=Math.hypot(dx,dy);
  if(d>JOY_MAX){ dx=dx/d*JOY_MAX; dy=dy/d*JOY_MAX; }
  joyKnob.style.left=(joyCX+dx-25)+'px'; joyKnob.style.top=(joyCY+dy-25)+'px';
  // screen dir -> iso world dir
  const wx=(dx/(TW/2)+dy/(TH/2))/2, wy=(dy/(TH/2)-dx/(TW/2))/2;
  const wl=Math.hypot(wx,wy)||1, mag=Math.min(1,d/JOY_MAX);
  input.joy.x=wx/wl*mag; input.joy.y=wy/wl*mag;
}
function joyRelease(){
  joyId=null; input.joy.active=false; input.joy.x=input.joy.y=0;
  joyBase.style.display=joyKnob.style.display='none';
  if(joyRest) joyRest.style.display='flex';
}
if(window.PointerEvent){
  joyZone.addEventListener('pointerdown',e=>{
    if(joyId!==null) return;
    Snd.init(); joyId=e.pointerId;
    try{ joyZone.setPointerCapture(e.pointerId); }catch(err){}
    joyPlace(e.clientX,e.clientY); e.preventDefault();
  });
  joyZone.addEventListener('pointermove',e=>{
    if(e.pointerId!==joyId) return;
    joyDrag(e.clientX,e.clientY); e.preventDefault();
  });
  const joyUp=e=>{ if(e.pointerId!==joyId) return; joyRelease(); };
  joyZone.addEventListener('pointerup',joyUp);
  joyZone.addEventListener('pointercancel',joyUp);
} else {
  joyZone.addEventListener('touchstart',e=>{
    if(joyId!==null) return;
    Snd.init();
    const t=e.changedTouches[0]; joyId=t.identifier;
    joyPlace(t.clientX,t.clientY); e.preventDefault();
  },{passive:false});
  joyZone.addEventListener('touchmove',e=>{
    for(const t of e.changedTouches){ if(t.identifier!==joyId) continue;
      joyDrag(t.clientX,t.clientY); }
    e.preventDefault();
  },{passive:false});
  const joyEnd=e=>{ for(const t of e.changedTouches){ if(t.identifier!==joyId) continue; joyRelease(); } };
  joyZone.addEventListener('touchend',joyEnd); joyZone.addEventListener('touchcancel',joyEnd);
}

const attackBtn=document.getElementById('attackBtn'), interactBtn=document.getElementById('interactBtn');
function pressable(el,down,up){
  if(window.PointerEvent){
    el.addEventListener('pointerdown',e=>{ Snd.init(); down(); e.preventDefault(); });
    if(up){ el.addEventListener('pointerup',e=>{ up(); e.preventDefault(); });
      el.addEventListener('pointercancel',()=>up()); }
  } else {
    el.addEventListener('touchstart',e=>{ Snd.init(); down(); e.preventDefault(); },{passive:false});
    if(up) el.addEventListener('touchend',e=>{ up(); e.preventDefault(); },{passive:false});
  }
}
pressable(attackBtn, ()=>{ input.attack=true; }, ()=>{ input.attack=false; });
pressable(interactBtn, ()=>{ doInteract(); });

