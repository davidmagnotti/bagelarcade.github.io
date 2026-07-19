/* =====================================================================
   INTERIORS - step inside the buildings
   ===================================================================== */
function enterHouse(b){
  if(G.interior) return;
  if(b.locked){ toast('The <b>Vael war-tent</b> is barred from within - the Castellan’s ground, and no friend of Barik walks in unbidden.',3400); Snd.step(5); return; }
  const nightL=nightAmount(); const lblL=String(b.label||'').toLowerCase();
  const alwaysOpen = lblL.includes('(inn)') || b.kind==='tower' || lblL.includes('your homestead');
  if(nightL>0.5 && !alwaysOpen){
    let minD=1e9; for(const zk of ['village','dock','farm','castle','spire']){ const zz=ZONES[zk]; if(zz) minD=Math.min(minD,dist(b.x,b.y,zz.x,zz.y)); }
    if((b.kind==='house'||b.kind==='house2') && minD>24){
      // remote hospitality: far from any town, folk take a knocker in
      give('bread',1);
      const fadeH=document.getElementById('fadeOv'); fadeH.style.opacity=1; Snd.tone(200,0.5,'sine',0.04,-60);
      setTimeout(()=>{ G.dayT=0.09; P.hp=P.maxhp; P.mp=P.maxmp; G.fireflies.length=0; refreshUI(); autoSave();
        toast('You knock. \u201cStorm-late, are you? Come in, the hearth is yours till dawn.\u201d They wake you with <b>bread</b> at first light.',5200);
        setTimeout(()=>{ fadeH.style.opacity=0; },120); },750);
      return;
    }
    toast(['Latched for the night. '+(G.worldId==='main'?'Greyharbor':'Emberwick')+' keeps honest hours.',
      '\u201cWe are abed!\u201d calls a voice inside. The door stays shut till dawn.',
      'No light under the door, and the latch will not lift. Locked.'][rndi(0,2)],3600);
    Snd.step(5); return;
  }
  const kinds={
    house:{line:'Dried herbs hang from every beam. It smells of thyme and woodsmoke.'},
    house2:{line:'Nets, floats, and the good honest stink of the sea.'},
    forge:{line:'The coals never quite sleep. Tools line every wall.'},
    barn:{line:'Hay, harness, and something purring out of sight.'},
    tower:{line:'Star charts, humming glass, and a faint smell of ozone.'},
    castle:{line:'Banners, cold stone, and a hearth that has heard a hundred oaths.'},
    hut:{line:'Woven mats, hanging nets, and the sweet smell of dried palm.'}
  };
  const dims = b.kind==='castle'? [15,9] : (String(b.label||'').toLowerCase().includes('trade hall')? [12,7] : [9,7]);
  const I={kind:b.kind, w:dims[0], h:dims[1], ret:{x:P.x,y:P.y+0.3}, exit:{x:dims[0]/2,y:dims[1]-0.9}, t:0, furn:[]};
  if(String(b.label||'').toLowerCase().includes('trade hall')) I.vault=1;
  if(String(b.label||'').toLowerCase().includes('homestead')) I.home=1;
  if(String(b.label||'').toLowerCase().includes('(inn)')) I.inn=1;
  const F=(type,x,y,hw,hh,solid)=>I.furn.push({type,x,y,hw:hw||0.6,hh:hh||0.5,solid:solid!==false});
  if(b.kind==='house'){ F('bed',1.9,2.8,1.0,0.7); F('table',6.4,3.4,0.9,0.6); F('stool',5.2,4.2,0.35,0.3); F('stool',7.4,4.4,0.35,0.3); F('rug',4.5,4.4,0,0,false); F('hearth',2.4,1.35,0.9,0.35); F('shelf',6.4,1.3,1.0,0.3); }
  if(b.kind==='house2'){ F('bed',7.1,2.8,1.0,0.7); F('barrel',1.8,3.0,0.45,0.4); F('barrel',2.6,3.5,0.45,0.4); F('crate',1.9,4.6,0.55,0.45); F('net',4.4,1.3,1.2,0.3); F('shelf',6.2,1.3,1.0,0.3); F('rug',4.6,4.3,0,0,false); }
  if(b.kind==='forge'){ F('anvil',4.5,3.3,0.6,0.4); F('barrel',6.8,3.2,0.45,0.4); F('crate',7.2,4.4,0.55,0.45); F('hearth',2.2,1.35,1.1,0.35); F('tools',6.0,1.3,1.4,0.3); }
  if(b.kind==='barn'){ F('hay',2.0,2.6,0.9,0.7); F('hay',3.4,2.2,0.9,0.7); F('hay',2.4,4.0,0.9,0.7); F('crate',6.8,2.6,0.55,0.45); F('crate',7.3,3.6,0.55,0.45); F('cartwheel',6.5,1.3,0.8,0.25); F('books',4.2,1.4,1.0,0.3); }
  if(b.kind==='tower'){ F('desk',6.3,3.1,1.0,0.6); F('stool',6.3,4.2,0.35,0.3); F('orb',2.6,3.1,0.5,0.4); F('books',4.6,1.3,1.6,0.3); F('rug',4.5,4.4,0,0,false); }
  if(b.kind==='hut'){ F('rug',4.5,3.6,0,0,false); F('hearth',6.8,1.35,1.0,0.35); F('bed',2.2,1.6,1.05,0.65); F('crate',6.9,5.0,0.55,0.45); F('stool',3.4,4.2,0.35,0.3); }
  if(b.kind==='castle'){
    F('rug',7.5,5.0,0,0,false);
    F('throne',7.5,1.7,1.0,0.6);
    F('banner',3.4,1.25,0.9,0.25); F('banner',11.6,1.25,0.9,0.25);
    F('column',4.6,3.0,0.5,0.45); F('column',10.4,3.0,0.5,0.45);
    F('column',4.6,6.0,0.5,0.45); F('column',10.4,6.0,0.5,0.45);
    F('hearth',1.9,1.35,1.1,0.35); F('hearth',13.1,1.35,1.1,0.35);
    F('books',5.7,1.3,1.3,0.3); F('books',9.3,1.3,1.3,0.3);
    F('table',7.5,3.6,1.5,0.6);
    F('stool',5.6,4.4,0.35,0.3); F('stool',9.4,4.4,0.35,0.3);
  }
  // per-house variation: no two homes furnished quite alike
  if(b.kind==='house'||b.kind==='house2'){
    const hv=(Math.floor(b.x)*7+Math.floor(b.y)*13)%3;
    if(hv===1){ F('crate',I.w-1.6,I.h-1.9,0.55,0.45); F('stool',2.6,I.h-2.1,0.35,0.3); }
    if(hv===2){ F('barrel',I.w-1.7,2.6,0.45,0.4); F('rug',I.w/2+1.4,I.h-2.5,0,0,false); }
  }
  // the Trade hall is Bree's vault inside: strongbox rows behind the counter
  if(I.vault){ I.furn.length=0;
    F('strongbox',2.0,2.4,0.7,0.5); F('strongbox',2.0,3.6,0.7,0.5); F('strongbox',2.0,4.8,0.7,0.5);
    F('strongbox',10.0,2.4,0.7,0.5); F('strongbox',10.0,3.6,0.7,0.5); F('strongbox',10.0,4.8,0.7,0.5);
    F('table',6.0,2.6,1.3,0.6); F('books',6.0,1.3,1.4,0.3);
    F('crate',4.0,5.2,0.55,0.45); F('crate',8.2,5.2,0.55,0.45); F('rug',6.0,4.2,0,0,false);
  }
  G.interior=I;
  P.click=null;
  P.x=I.w/2; P.y=I.h-1.6; P.moving=false; P.fishing=null; P.combo=0;
  toast('<b>'+(b.label||'Inside')+'</b>', 2400);
  Snd.step(8);
}
function enterCave(){
  if(G.interior) return;
  const I={kind:'cave', w:9, h:7, ret:{x:P.x,y:P.y+0.4}, exit:{x:4.5,y:6.1}, t:0, furn:[], cave:1};
  const F=(type,x,y,hw,hh,solid)=>I.furn.push({type,x,y,hw:hw||0.6,hh:hh||0.5,solid:solid!==false});
  F('orb',2.2,2.6,0.5,0.4);
  F('crate',7.0,4.4,0.55,0.45);
  F('cavechest',4.6,2.2,0.7,0.5);
  F('books',6.6,1.5,1.2,0.3);
  G.interior=I; P.click=null;
  P.x=4.5; P.y=5.4; P.moving=false; P.fishing=null; P.combo=0;
  toast('<b>The Undermaw</b> - the dark breathes here, slow and cold. Something glitters at the heart of it.',4600);
  Snd.step(8);
}
function enterLair(){
  if(G.interior) return;
  // a vast basalt cathedral inside Mount Kea, not a cottage
  const I={kind:'cave', w:15, h:12, ret:{x:P.x,y:P.y+0.4}, exit:{x:7.5,y:11.0}, t:0, furn:[], cave:1, lair:1};
  const F=(type,x,y,hw,hh,solid)=>I.furn.push({type,x,y,hw:hw||0.6,hh:hh||0.5,solid:solid!==false});
  const dragonOut = G.mobs && G.mobs.some(m=>m.kind==='dragon' && !m.dead); // he's raging at the caldera
  if(!dragonOut) F('dragon',7.5,3.4,3.0,1.9,true);   // Ashwing, huge on his fire-shelf
  // molten seams the lair renderer glows; the back pool sits behind the wyrm
  I.lava=[{x:7.5,y:1.9,rx:6.2,ry:1.2},{x:2.4,y:8.4,rx:1.6,ry:0.9},{x:12.6,y:8.4,rx:1.6,ry:0.9}];
  F('lavavent',2.6,2.8,0.5,0.4,false);
  F('lavavent',12.4,2.9,0.5,0.4,false);
  F('rockcol',1.9,6.2,0.7,0.8,true); F('rockcol',13.1,6.2,0.7,0.8,true);
  G.interior=I; P.click=null;
  P.x=7.5; P.y=9.6; P.moving=false; P.fishing=null; P.combo=0;
  toast(dragonOut ? '<b>Ashwing’s Lair</b> - empty, and shaking. He rages on the caldera above.'
    : qs('wyrm')==='done' ? '<b>Ashwing’s Lair</b> - warm and still. The old dragon dozes, safe now.'
    : '<b>Ashwing’s Lair</b> - heat shimmers off the stone. Something vast turns to regard you.',4600);
  Snd.step(8);
}
function exitHouse(){
  const r=G.interior.ret;
  G.interior=null;
  P.x=r.x; P.y=r.y;
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  Snd.step(8);
}
function interiorBlocked(x,y,r){
  const I=G.interior;
  if(x-r<0.75||x+r>I.w-0.75||y-r<1.9||y+r>I.h-0.45) return true;
  for(const f of I.furn) if(f.solid && Math.abs(x-f.x)<f.hw+r && Math.abs(y-f.y)<f.hh+r) return true;
  if(I.lava) for(const L of I.lava){ const dx=(x-L.x)/(L.rx+r), dy=(y-L.y)/(L.ry+r); if(dx*dx+dy*dy<1) return true; }
  return false;
}
function updateInterior(dt){
  const I=G.interior; I.t+=dt;
  let mx=0,my=0;
  if(keys['w']||keys['arrowup']) { mx-=1; my-=1; }
  if(keys['s']||keys['arrowdown']) { mx+=1; my+=1; }
  if(keys['a']||keys['arrowleft']) { mx-=1; my+=1; }
  if(keys['d']||keys['arrowright']){ mx+=1; my-=1; }
  if(input.joy.active){ mx=input.joy.x; my=input.joy.y; }
  else if(input.gpDir){ mx=input.gpDir.x; my=input.gpDir.y; }
  if(Math.hypot(mx,my)>0.05){ I.click=null; }
  else if(I.click && !dlg.open){
    const C=I.click, d=dist(P.x,P.y,C.x,C.y);
    const range=C.f? 1.15 : C.exit? 1.2 : 0.14;
    if(d>range){ mx=(C.x-P.x)/d; my=(C.y-P.y)/d;
      if(!I._sp || dist(P.x,P.y,I._sp.x,I._sp.y)>0.05){ I._sp={x:P.x,y:P.y}; I._st=0; }
      I._st=(I._st||0)+dt;
      if(I._st>0.8){ I.click=null; mx=0; my=0; }
    } else {
      const f=C.f, ex=C.exit; I.click=null;
      if(f) useHotspot({f,label:''});
      else if(ex) exitHouse();
    }
  }
  const ml=Math.hypot(mx,my);
  P.moving = ml>0.05 && !dlg.open;
  if(P.moving){
    mx/=ml; my/=ml;
    const sp=3.8;
    let nx=P.x+mx*sp*dt; if(!interiorBlocked(nx,P.y,0.28)) P.x=nx;
    let ny=P.y+my*sp*dt; if(!interiorBlocked(P.x,ny,0.28)) P.y=ny;
    P.dir={x:mx,y:my}; P.anim+=dt*9;
  }
  P.swing=Math.max(0,P.swing-dt);
  P.hurtT=Math.max(0,P.hurtT-dt);
  P.mp=Math.min(P.maxmp,P.mp+dt*2.6);
  if(G.time-P.lastCombat>5) P.hp=Math.min(P.maxhp,P.hp+dt*2.2);
}
function iBox(s,w,d,h,top,lft,rgt){
  // iso box at screen point s: footprint w×d tiles, height h px
  const gx=(dxw,dyd)=>({x:s.x+(dxw-dyd)*(TW/2), y:s.y+(dxw+dyd)*(TH/2)});
  const c1=gx(-w/2,-d/2), c2=gx(w/2,-d/2), c3=gx(w/2,d/2), c4=gx(-w/2,d/2);
  // left face (c4-c3)
  cx.fillStyle=lft; cx.beginPath();
  cx.moveTo(c4.x,c4.y-h); cx.lineTo(c3.x,c3.y-h); cx.lineTo(c3.x,c3.y); cx.lineTo(c4.x,c4.y); cx.closePath(); cx.fill();
  // right face (c3-c2)
  cx.fillStyle=rgt; cx.beginPath();
  cx.moveTo(c3.x,c3.y-h); cx.lineTo(c2.x,c2.y-h); cx.lineTo(c2.x,c2.y); cx.lineTo(c3.x,c3.y); cx.closePath(); cx.fill();
  // top
  cx.fillStyle=top; cx.beginPath();
  cx.moveTo(c1.x,c1.y-h); cx.lineTo(c2.x,c2.y-h); cx.lineTo(c3.x,c3.y-h); cx.lineTo(c4.x,c4.y-h); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(15,9,4,0.5)'; cx.lineWidth=1; cx.stroke();
}
function drawLairScene(w2s,I){
  const t=I.t;
  // a hellish shaft of daylight-and-ember down from the caldera mouth, center-back
  const top=w2s(I.w/2,0.2);
  const sg=cx.createRadialGradient(top.x,top.y-30,8,top.x,top.y-30,200);
  sg.addColorStop(0,'rgba(255,150,70,0.20)'); sg.addColorStop(1,'rgba(255,70,20,0)');
  cx.fillStyle=sg; cx.fillRect(0,0,VW,VH);
  // molten pools on the floor (drawn before furniture so the wyrm sits over them)
  for(const L of (I.lava||[])){
    const s=w2s(L.x,L.y), rx=L.rx*TW/2, ry=L.ry*TH/2, gl=0.6+0.4*Math.sin(t*2+L.x);
    cx.save(); cx.translate(s.x,s.y);
    cx.fillStyle='rgba(255,120,40,'+(0.22*gl).toFixed(2)+')';
    cx.beginPath(); cx.ellipse(0,0,rx+18,ry+12,0,0,TAU); cx.fill();
    const g=cx.createRadialGradient(0,0,4,0,0,rx);
    g.addColorStop(0,'#ffd858'); g.addColorStop(0.5,'#ff7a1e'); g.addColorStop(1,'#8f2a10');
    cx.fillStyle=g; cx.beginPath(); cx.ellipse(0,0,rx,ry,0,0,TAU); cx.fill();
    cx.fillStyle='rgba(28,14,10,0.55)';
    for(let i=0;i<5;i++){ const a=i*1.5+t*0.4;
      cx.beginPath(); cx.ellipse(Math.cos(a)*rx*0.55, Math.sin(a)*ry*0.55, 5,2.6,0,0,TAU); cx.fill(); }
    cx.restore();
    if(Math.random()<0.3) G.parts.push({x:L.x+rnd(-L.rx,L.rx), y:L.y, vx:rnd(-0.2,0.2), vy:-rnd(0.6,1.7), life:rnd(0.8,1.9), color:Math.random()<0.6?'#ff9a44':'#ffd858', size:rnd(1.5,3), grav:-0.12});
  }
}
function drawFurniture(f,s){
  switch(f.type){
    case 'bed':
      iBox(s,2.0,1.3,10,'#6e5738','#4a3322','#3e2b1c');
      iBox({x:s.x,y:s.y-10},1.9,1.2,8,'#8f4a3a','#6e3a2c','#5e3226');
      iBox({x:s.x-(0.55)*(TW/2),y:s.y-(0.55)*(TH/2)-18},0.7,0.9,5,'#e8dcbd','#c9b990','#b0a078');
      break;
    case 'table':
      iBox(s,1.7,1.1,16,'#6e5030','#4a3322','#3e2b1c');
      cx.fillStyle='#ffd76a'; cx.beginPath(); cx.arc(s.x+6,s.y-19,3,0,TAU); cx.fill(); // candle glow base
      cx.fillStyle='#ff9a3c'; cx.beginPath(); cx.arc(s.x+6,s.y-22,1.6+Math.sin(G.interior.t*9)*0.5,0,TAU); cx.fill();
      break;
    case 'desk':
      iBox(s,1.9,1.1,16,'#5a4630','#3e2f1e','#332618');
      cx.fillStyle='#e8dcbd'; cx.fillRect(s.x-14,s.y-22,12,7);
      cx.fillStyle='#7fd4ff'; cx.beginPath(); cx.arc(s.x+10,s.y-21,3,0,TAU); cx.fill();
      break;
    case 'stool': iBox(s,0.6,0.6,9,'#6e5030','#4a3322','#3e2b1c'); break;
    case 'throne':
      iBox(s,1.5,1.0,10,'#5a4630','#3e2f1e','#332618');
      iBox({x:s.x,y:s.y-10},1.2,0.8,24,'#7a2a3a','#5a1f2c','#4a1a24');
      cx.fillStyle='#e8c860';
      cx.beginPath(); cx.arc(s.x-15,s.y-36,3,0,TAU); cx.arc(s.x+15,s.y-36,3,0,TAU); cx.fill();
      cx.beginPath(); cx.arc(s.x,s.y-42,4.5,0,TAU); cx.fill();
      break;
    case 'column':
      iBox(s,0.8,0.8,46,'#a8a49b','#8f8b83','#6e6a63');
      cx.fillStyle='#b8b4ab'; cx.fillRect(s.x-15,s.y-54,30,5);
      break;
    case 'banner':
      cx.fillStyle='#6a3a5e'; cx.fillRect(s.x-9,s.y-48,18,30);
      cx.beginPath(); cx.moveTo(s.x-9,s.y-18); cx.lineTo(s.x,s.y-10); cx.lineTo(s.x+9,s.y-18); cx.closePath(); cx.fill();
      cx.fillStyle='#e8c860'; cx.beginPath(); cx.arc(s.x,s.y-36,5,0,TAU); cx.fill();
      cx.strokeStyle='#3a2a1a'; cx.lineWidth=2; cx.beginPath(); cx.moveTo(s.x-11,s.y-48); cx.lineTo(s.x+11,s.y-48); cx.stroke();
      break;
    case 'strongbox':
      iBox(s,1.1,0.9,13,'#4a4f5e','#33363f','#2a2c33');
      cx.strokeStyle='#8f97a8'; cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(s.x-13,s.y-13); cx.lineTo(s.x+13,s.y-13); cx.stroke();
      cx.fillStyle='#e8c860'; cx.fillRect(s.x-2.5,s.y-11,5,6);
      break;
    case 'crate': iBox(s,1.0,0.9,14,'#7d5834','#5a3d24','#4a3322'); break;
    case 'hay':
      iBox(s,1.7,1.3,13,'#c9a24e','#a8843c','#8f6f30');
      cx.strokeStyle='rgba(120,90,30,0.6)'; cx.lineWidth=1;
      for(let i=0;i<4;i++){ cx.beginPath(); cx.moveTo(s.x-14+i*8,s.y-12); cx.lineTo(s.x-10+i*8,s.y-4); cx.stroke(); }
      break;
    case 'barrel':
      cx.fillStyle='#5a3d24'; cx.beginPath(); cx.ellipse(s.x,s.y-2,10,5,0,0,TAU); cx.fill();
      cx.fillRect(s.x-10,s.y-20,20,18);
      cx.fillStyle='#6e4a2b'; cx.beginPath(); cx.ellipse(s.x,s.y-20,10,5,0,0,TAU); cx.fill();
      cx.strokeStyle='rgba(15,9,4,0.6)'; cx.strokeRect(s.x-10,s.y-20,20,18);
      cx.strokeStyle='#3a2818'; cx.beginPath(); cx.moveTo(s.x-10,s.y-14); cx.lineTo(s.x+10,s.y-14);
      cx.moveTo(s.x-10,s.y-7); cx.lineTo(s.x+10,s.y-7); cx.stroke();
      break;
    case 'anvil':
      iBox(s,0.9,0.7,7,'#4a4d54','#3a3d43','#33363b');
      iBox({x:s.x,y:s.y-7},1.3,0.6,7,'#8a919d','#5c626d','#4c525c');
      break;
    case 'orb':
      iBox(s,0.8,0.8,14,'#6f6a63','#4c4842','#403c37');
      { const pl=0.7+0.3*Math.sin(G.interior.t*3);
        cx.fillStyle='rgba(127,212,255,'+(0.25*pl)+')'; cx.beginPath(); cx.arc(s.x,s.y-24,12*pl,0,TAU); cx.fill();
        cx.fillStyle='#7fd4ff'; cx.beginPath(); cx.arc(s.x,s.y-24,6,0,TAU); cx.fill();
        cx.fillStyle='#dff4ff'; cx.beginPath(); cx.arc(s.x-2,s.y-26,2,0,TAU); cx.fill(); }
      break;
    case 'books': case 'shelf':
      iBox(s,1.6,0.55,22,'#4a3322','#3a2818','#332214');
      for(let i=0;i<5;i++){ cx.fillStyle=['#8f4a3a','#3e6f8f','#5a4472','#4f6032','#8a6d30'][i];
        cx.fillRect(s.x-16+i*7,s.y-20,5,12); }
      break;
    case 'rug':
      cx.save(); cx.translate(s.x,s.y); cx.scale(1,0.5); cx.rotate(0);
      cx.fillStyle='rgba(143,74,58,0.85)'; cx.beginPath(); cx.arc(0,0,34,0,TAU); cx.fill();
      cx.strokeStyle='#c9a24e'; cx.lineWidth=2; cx.beginPath(); cx.arc(0,0,26,0,TAU); cx.stroke();
      cx.restore();
      break;
    case 'lavavent':
      { const gl=0.55+0.45*Math.sin(G.interior.t*2.3+s.x);
        cx.save(); cx.translate(s.x,s.y); cx.scale(1,0.5);
        cx.fillStyle='rgba(255,120,40,'+(0.28*gl).toFixed(2)+')'; cx.beginPath(); cx.arc(0,0,22,0,TAU); cx.fill();
        cx.fillStyle='#2a1610'; cx.beginPath(); cx.arc(0,0,13,0,TAU); cx.fill();
        cx.fillStyle='#ff8a1e'; cx.beginPath(); cx.arc(0,0,9,0,TAU); cx.fill();
        cx.fillStyle='rgba(255,225,150,'+(0.7*gl).toFixed(2)+')'; cx.beginPath(); cx.arc(-2,-2,4,0,TAU); cx.fill();
        cx.restore();
        if(Math.random()<0.2) G.parts.push({x:f.x,y:f.y,vx:rnd(-0.2,0.2),vy:-rnd(0.4,1),life:rnd(0.6,1.2),color:Math.random()<0.5?'#ff8a44':'rgba(90,84,80,0.5)',size:rnd(1.5,3),grav:-0.1});
      }
      break;
    case 'dragon':
      cx.save(); cx.translate(s.x,s.y); cx.scale(2.4,2.4);
      drawDragon(cx,0,0,{face:1, enspelled:false, anim:1, hurtT:0});
      cx.restore();
      break;
    case 'rockcol':
      { // a basalt column reaching up out of frame, ember-lit on one face
        cx.fillStyle='#1a100c'; cx.fillRect(s.x-11,s.y-84,22,86);
        cx.fillStyle='#0f0908'; cx.fillRect(s.x-11,s.y-84,7,86);
        cx.fillStyle='rgba(255,120,50,0.14)'; cx.fillRect(s.x+4,s.y-84,5,86);
        cx.strokeStyle='rgba(0,0,0,0.4)'; cx.lineWidth=1;
        for(let yy=s.y-76; yy<s.y; yy+=14){ cx.beginPath(); cx.moveTo(s.x-11,yy); cx.lineTo(s.x+11,yy); cx.stroke(); }
      }
      break;
  }
}
function drawWallDecor(kind,w2s,I){
  // hanging items along the north wall
  const at=(x,fn)=>{ const s=w2s(x,0.05); fn(s.x,s.y-42); };
  if(kind==='house'||kind==='tower'){
    at(6.4,(x,y)=>{ if(kind!=='house') return; cx.fillStyle='#5a3d24'; cx.fillRect(x-22,y+6,44,4);
      for(let i=0;i<3;i++){ cx.fillStyle=['#7fb05b','#c96f8a','#7fd4ff'][i]; cx.fillRect(x-16+i*14,y-2,8,8); } });
  }
  if(kind==='tower'){
    at(4.6,(x,y)=>{ cx.fillStyle='#5a3d24'; cx.fillRect(x-30,y+6,60,4);
      for(let i=0;i<6;i++){ cx.fillStyle=['#8f4a3a','#3e6f8f','#6e5030','#5a4472','#4f6032','#8a6d30'][i]; cx.fillRect(x-27+i*9,y-8,7,14); } });
    at(2.2,(x,y)=>{ cx.fillStyle='#e8dcbd'; cx.fillRect(x-14,y-10,28,22);
      cx.strokeStyle='#3a4a6f'; cx.beginPath(); cx.arc(x,y+1,7,0,TAU); cx.stroke();
      cx.fillStyle='#ffd76a'; for(const p of [[-8,-5],[6,-3],[9,6],[-5,8]]){ cx.fillRect(x+p[0],y+p[1],2,2); } });
  }
  if(kind==='forge'){
    at(6.0,(x,y)=>{ cx.fillStyle='#5a3d24'; cx.fillRect(x-30,y+6,60,4);
      cx.strokeStyle='#8a919d'; cx.lineWidth=3;
      cx.beginPath(); cx.moveTo(x-20,y+4); cx.lineTo(x-20,y-10); cx.moveTo(x-24,y-8); cx.lineTo(x-16,y-8);
      cx.moveTo(x,y+4); cx.lineTo(x,y-10); cx.moveTo(x-4,y-10); cx.lineTo(x+4,y-10);
      cx.moveTo(x+18,y+4); cx.lineTo(x+18,y-8); cx.stroke(); });
  }
  if(kind==='house2'){
    at(4.4,(x,y)=>{ cx.strokeStyle='rgba(201,185,144,0.75)'; cx.lineWidth=1;
      for(let i=0;i<5;i++){ cx.beginPath(); cx.moveTo(x-26+i*13,y-12); cx.quadraticCurveTo(x-20+i*13,y+8,x-26+i*13,y+16); cx.stroke(); }
      for(let i=0;i<4;i++){ cx.beginPath(); cx.moveTo(x-28,y-8+i*7); cx.quadraticCurveTo(x,y-4+i*7,x+28,y-8+i*7); cx.stroke(); } });
  }
  if(kind==='barn'){
    at(6.5,(x,y)=>{ cx.strokeStyle='#5a3d24'; cx.lineWidth=4; cx.beginPath(); cx.arc(x,y+2,14,0,TAU); cx.stroke();
      cx.beginPath(); for(let i=0;i<6;i++){ const a=i*TAU/6; cx.moveTo(x,y+2); cx.lineTo(x+Math.cos(a)*13,y+2+Math.sin(a)*13); } cx.lineWidth=2; cx.stroke(); });
  }
}
function renderInterior(){
  cx.setTransform(DPR,0,0,DPR,0,0);
  cx.fillStyle='#0b0906'; cx.fillRect(0,0,VW,VH);
  const I=G.interior;
  const ccx=isoX(I.w/2,I.h/2), ccy=isoY(I.w/2,I.h/2);
  const w2s=(x,y)=>({x:isoX(x,y)-ccx+VW/2, y:isoY(x,y)-ccy+VH/2+14});
  // floor
  for(let y=0;y<I.h;y++) for(let x=0;x<I.w;x++){
    const s=w2s(x,y);
    if(I.lair){
      cx.fillStyle=['#241713','#1c110e','#2a1a15','#180f0c'][(x*7+y*13)%4];
      cx.beginPath(); cx.moveTo(s.x,s.y-TH/2); cx.lineTo(s.x+TW/2,s.y); cx.lineTo(s.x,s.y+TH/2); cx.lineTo(s.x-TW/2,s.y); cx.closePath(); cx.fill();
      if((x*5+y*3)%7===0){ cx.fillStyle='rgba(255,110,40,0.10)'; // faint ember cracks in the rock
        cx.beginPath(); cx.moveTo(s.x-6,s.y); cx.lineTo(s.x,s.y-3); cx.lineTo(s.x+6,s.y+1); cx.stroke&&cx.stroke(); cx.strokeStyle='rgba(255,120,50,0.16)'; cx.lineWidth=1; cx.stroke(); }
    } else {
      cx.drawImage(TILE_SPR[T.PLANK][(x*7+y*13)%4], s.x-TW/2, s.y-TH/2);
    }
  }
  // walls: north (y=0) and west (x=0)
  const WH= I.lair? 96 : 62;   // the lair is a cathedral-tall cavern
  for(let x=0;x<I.w;x++){
    const a=w2s(x,0), b=w2s(x+1,0);
    cx.fillStyle= I.lair? (x%2?'#231510':'#1a0f0b') : (x%2? '#4a3626':'#443122');
    cx.beginPath(); cx.moveTo(a.x-TW/2,a.y-TH/2); cx.lineTo(b.x-TW/2,b.y-TH/2);
    cx.lineTo(b.x-TW/2,b.y-TH/2-WH); cx.lineTo(a.x-TW/2,a.y-TH/2-WH); cx.closePath(); cx.fill();
  }
  for(let y=0;y<I.h;y++){
    const a=w2s(0,y), b=w2s(0,y+1);
    cx.fillStyle= I.lair? (y%2?'#1d110d':'#150c09') : (y%2? '#3a2a1c':'#352718');
    cx.beginPath(); cx.moveTo(a.x-TW/2,a.y-TH/2); cx.lineTo(b.x-TW/2,b.y-TH/2);
    cx.lineTo(b.x-TW/2,b.y-TH/2-WH); cx.lineTo(a.x-TW/2,a.y-TH/2-WH); cx.closePath(); cx.fill();
  }
  if(I.lair) drawLairScene(w2s,I);
  // window with moody light on the north wall
  if(!I.lair){ const s=w2s(7.0,0.05);
    const night=nightAmount();
    cx.fillStyle= night>0.4? '#1c2a4a' : '#c9d8e8';
    cx.fillRect(s.x-12,s.y-52,24,20);
    cx.strokeStyle='#241b12'; cx.lineWidth=3; cx.strokeRect(s.x-12,s.y-52,24,20);
    cx.beginPath(); cx.moveTo(s.x,s.y-52); cx.lineTo(s.x,s.y-32); cx.moveTo(s.x-12,s.y-42); cx.lineTo(s.x+12,s.y-42); cx.stroke();
  }
  // hearth fire (house & forge)
  if(I.kind==='house'||I.kind==='forge'){
    const hf=I.furn.find(f=>f.type==='hearth');
    const s=w2s(hf.x,0.1);
    cx.fillStyle='#57534c'; cx.fillRect(s.x-26,s.y-56,52,40);
    cx.fillStyle='#1c1712'; cx.fillRect(s.x-16,s.y-42,32,26);
    for(let i=0;i<3;i++){
      const fl=Math.sin(I.t*8+i*2.1)*3;
      cx.fillStyle=['#ff9a3c','#ffce7a','#e05648'][i];
      cx.beginPath();
      cx.moveTo(s.x-10+i*8,s.y-18);
      cx.quadraticCurveTo(s.x-8+i*8+fl,s.y-32-i*3, s.x-6+i*8,s.y-18);
      cx.closePath(); cx.fill();
    }
  }
  drawWallDecor(I.kind,w2s,I);
  // door mat + glow at the exit
  { const s=w2s(I.exit.x,I.exit.y+0.5);
    cx.fillStyle='rgba(255,215,106,'+(0.15+0.1*Math.sin(G.time*3))+')';
    cx.save(); cx.translate(s.x,s.y); cx.scale(1,0.5);
    cx.beginPath(); cx.arc(0,0,26,0,TAU); cx.fill(); cx.restore();
    cx.fillStyle='#ffd76a'; cx.font='bold 14px Georgia'; cx.textAlign='center';
    cx.fillText('▼', s.x, s.y+4-Math.abs(Math.sin(G.time*3))*4);
  }
  // furniture & player, depth-sorted
  const items=I.furn.map(f=>({d:f.x+f.y,f}));
  items.push({d:P.x+P.y,player:true});
  items.sort((a,b)=>a.d-b.d);
  for(const it of items){
    if(it.player){ const s=w2s(P.x,P.y); drawShadowAt(cx,s.x,s.y,11); drawPlayer(s); }
    else drawFurniture(it.f, w2s(it.f.x,it.f.y));
  }
  // ambient grade: volcanic red-orange for the lair, cozy warm elsewhere
  const wg=cx.createRadialGradient(VW/2,VH/2,60,VW/2,VH/2,Math.max(VW,VH)*0.62);
  if(I.lair){ wg.addColorStop(0,'rgba(255,90,30,0.10)'); wg.addColorStop(1,'rgba(20,0,0,0.66)'); }
  else { wg.addColorStop(0,'rgba(255,170,90,0.06)'); wg.addColorStop(1,'rgba(0,0,0,0.55)'); }
  cx.fillStyle=wg; cx.fillRect(0,0,VW,VH);
  drawGritGrade();
  // interact affordance: hotspots beat the door when closer
  const hs=interiorHotspot();
  const nearExit=dist(P.x,P.y,I.exit.x,I.exit.y)<1.5;
  const ib=document.getElementById('interactBtn');
  let label=null, at=null;
  if(hs && (!nearExit || dist(P.x,P.y,hs.f.x,hs.f.y)<dist(P.x,P.y,I.exit.x,I.exit.y))){
    label=hs.label; at=w2s(hs.f.x,hs.f.y);
    cx.strokeStyle='rgba(255,215,106,0.8)'; cx.lineWidth=2;
    cx.setLineDash([5,4]); cx.lineDashOffset=-G.time*16;
    cx.beginPath(); cx.ellipse(at.x,at.y,20,9,0,0,TAU); cx.stroke(); cx.setLineDash([]);
  } else if(nearExit){ label='Leave'; at=w2s(I.exit.x,I.exit.y); }
  if(isTouch){
    ib.style.display= label? 'flex':'none';
    if(label) ib.textContent=label;
  } else if(label){
    cx.font='11px Verdana'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,0.6)'; cx.fillText('E - '+label, at.x+1, at.y-33);
    cx.fillStyle='#ffe9a8'; cx.fillText('E - '+label, at.x, at.y-34);
  }
}

