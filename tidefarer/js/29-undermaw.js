/* =====================================================================
   THE UNDERMAW - a compact room-by-room puzzle dungeon.
   Replaces the old single dead-end cave (whose loot chest was, in fact,
   unreachable - it was missing from every interior hotspot/click list).
   Three small chambers, each sealed by a puzzle you solve to open the
   gate onward:
     0  The Cold Mouth   - wake three floor runes by standing on them
     1  The Warden's Locks - pull the levers in the order the wall keeps
     2  The Hoard         - the reward vault (and the way back)
   Reuses the existing interior engine: movement + collision
   (interiorBlocked), the click/E/touch interact plumbing, and the iso
   projection. We only wrap enterCave / updateInterior / renderInterior /
   interiorHotspot / interiorClick / useHotspot / exitHouse so houses and
   other interiors are completely untouched (everything checks
   G.interior.dungeon first and otherwise defers to the original).
   Once cleared, gates stay open on re-entry so you never re-solve them.
   ===================================================================== */
(function(){
if(typeof enterCave!=='function' || typeof renderInterior!=='function') return;

const ROOMS = 3;

function buildRoom(I, idx){
  const cleared = !!(P.prog && P.prog.undermawClear);
  I.room=idx; I.furn=[]; I.click=null; I.puzzle=null;
  I.plates=null; I.levers=null; I.seq=null; I.prog=0; I.stair=null; I.torches=null;
  I.clueCols=null;
  I.w=9; I.h=8; I.exit={x:4.5, y:7.0};
  const F=(o)=>{ I.furn.push(o); return o; };
  if(idx===0){
    I.name='The Cold Mouth'; I.exitTo='world'; I.puzzle='plates';
    I.plates=[[2.6,3.2],[6.4,3.2],[4.5,4.7]].map(p=>
      F({type:'plate', x:p[0], y:p[1], hw:0.5, hh:0.4, solid:false, lit:cleared?1:0}));
    I.stair=F({type:'stairup', x:4.5, y:2.4, hw:0.7, hh:0.4, solid:false});
    I.gateOpen=cleared;
  } else if(idx===1){
    I.name="The Warden's Locks"; I.exitTo=0; I.puzzle='levers';
    const cols=['#e0564b','#57c06a','#6a9cff'];
    I.levers=[0,1,2].map(i=>
      F({type:'lever', x:2.6+i*1.9, y:4.3, hw:0.5, hh:0.5, solid:false, on:cleared?1:0, idx:i, col:cols[i]}));
    I.seq=[2,0,1]; I.prog=cleared?I.seq.length:0;
    I.clueCols=I.seq.map(i=>cols[i]);
    I.stair=F({type:'stairup', x:4.5, y:2.4, hw:0.7, hh:0.4, solid:false});
    I.gateOpen=cleared;
  } else {
    I.name='The Hoard'; I.exitTo=1;
    F({type:'cavechest', x:4.5, y:3.1, hw:0.7, hh:0.5, solid:true});
    I.torches=[[1.7,2.5],[7.3,2.5]];
    I.gateOpen=false;                       // no gate onward from the vault
    if(P.prog) P.prog.undermawClear=1;      // reaching the hoard clears the dungeon
  }
}

function openGate(){
  const I=G.interior; if(!I || I.gateOpen) return;
  I.gateOpen=true;
  if(Snd.magic) Snd.magic();
  if(I.stair) burst(I.stair.x, I.stair.y-0.3, '#ffd76a', 24, 2.2);
  toast('A stone gate grinds open to the north.', 3000);
}

function pullLever(f){
  const I=G.interior; if(!I || I.puzzle!=='levers' || I.gateOpen) return;
  if(f.on) return;                          // already set this round
  if(f.idx===I.seq[I.prog]){
    f.on=1; I.prog++;
    Snd.tone(200+I.prog*90, 0.14, 'square', 0.05, 40);
    burst(f.x, f.y-0.4, f.col, 10, 1.6);
    if(I.prog>=I.seq.length) openGate();
  } else {
    for(const l of I.levers) l.on=0; I.prog=0;
    Snd.tone(90, 0.24, 'sawtooth', 0.06, -20);
    toast('The locks clack back into place.', 2200);
  }
}

function goRoom(idx, fromTop){
  const I=G.interior; if(!I) return;
  buildRoom(I, idx);
  P.x=I.w/2; P.y=fromTop? 3.0 : I.h-1.7;
  P.moving=false; I.click=null;
  Snd.step(8);
  toast('<b>'+I.name+'</b>', 2200);
}

/* ---- plate detection each tick (levers/stairs go through interact) ---- */
function undermawTick(){
  const I=G.interior; if(!I || !I.dungeon) return;
  if(I.puzzle==='plates' && !I.gateOpen){
    let all=true;
    for(const p of I.plates){
      if(!p.lit && Math.abs(P.x-p.x)<0.55 && Math.abs(P.y-p.y)<0.5){
        p.lit=1; Snd.tone(360,0.12,'sine',0.06,0); burst(p.x,p.y-0.2,'#8fe0ff',10,1.6);
      }
      if(!p.lit) all=false;
    }
    if(all) openGate();
  }
}

/* =======================  wrappers  ======================= */
const _enterCave=enterCave;
enterCave=function(){
  if(G.interior) return;
  const I={kind:'cave', dungeon:1, cave:1, ret:{x:P.x, y:P.y+0.4}, t:0, furn:[], room:0};
  G.interior=I;
  buildRoom(I, 0);
  P.click=null; P.x=I.w/2; P.y=I.h-1.7; P.moving=false; P.fishing=null; P.combo=0;
  const cleared=P.prog && P.prog.undermawClear;
  toast(cleared
    ? '<b>The Undermaw</b> - the dark remembers you.'
    : '<b>The Undermaw</b> - the dark breathes, slow and cold.', 3000);
  Snd.step(8);
};

const _updateInterior=updateInterior;
updateInterior=function(dt){
  _updateInterior(dt);                      // movement, collision, click-follow, regen
  undermawTick();
};

const _renderInterior=renderInterior;
renderInterior=function(){
  if(G.interior && G.interior.dungeon){ renderUndermaw(); return; }
  _renderInterior();
};

const _interiorHotspot=interiorHotspot;
interiorHotspot=function(){
  const I=G.interior;
  if(I && I.dungeon){
    let best=null, bd=1.45;
    for(const f of I.furn){
      let lbl=null;
      if(f.type==='lever') lbl='Pull';
      else if(f.type==='cavechest') lbl=(P.prog && P.prog.caveChest)? 'Search' : 'Open';
      else if(f.type==='stairup') lbl=I.gateOpen? 'Enter' : null;
      if(!lbl) continue;
      const d=dist(P.x,P.y,f.x,f.y);
      if(d<bd){ bd=d; best={f, label:lbl}; }
    }
    return best;
  }
  return _interiorHotspot();
};

const _useHotspot=useHotspot;
useHotspot=function(h){
  const I=G.interior;
  if(I && I.dungeon && h && h.f){
    if(h.f.type==='lever'){ pullLever(h.f); return; }
    if(h.f.type==='stairup'){ if(I.gateOpen && I.room<ROOMS-1) goRoom(I.room+1, true); return; }
  }
  _useHotspot(h);                           // cavechest reward + all house hotspots
};

const _interiorClick=interiorClick;
interiorClick=function(sx,sy){
  const I=G.interior;
  if(I && I.dungeon){
    const x=sx-LB.x, y=sy-LB.y;
    const ccx=isoX(I.w/2,I.h/2), ccy=isoY(I.w/2,I.h/2);
    const ox=x-(VW/2-ccx), oy=y-(VH/2+14-ccy);
    const wx=(ox/(TW/2)+oy/(TH/2))/2, wy=(oy/(TH/2)-ox/(TW/2))/2;
    let best=null, bd=1.1;
    for(const f of I.furn){
      if(f.type!=='lever' && f.type!=='cavechest' && f.type!=='stairup') continue;
      if(f.type==='stairup' && !I.gateOpen) continue;
      const d=dist(wx,wy,f.x,f.y);
      if(d<bd){ bd=d; best=f; }
    }
    if(best){ I.click={x:best.x, y:best.y+0.7, f:best}; return; }
    if(dist(wx,wy,I.exit.x,I.exit.y)<1.2){ I.click={x:I.exit.x, y:I.exit.y, exit:true}; return; }
    I.click={x:clamp(wx,0.95,I.w-0.95), y:clamp(wy,2.1,I.h-0.65)};
    return;
  }
  _interiorClick(sx,sy);
};

const _exitHouse=exitHouse;
exitHouse=function(){
  const I=G.interior;
  if(I && I.dungeon && I.room>0){ goRoom(I.room-1, true); return; }
  _exitHouse();                             // room 0 (or a house) -> back outside
};

/* =======================  rendering  ======================= */
const WH=66;                                // wall height (px)

function drawPlate(s,p,t){
  cx.save(); cx.translate(s.x,s.y); cx.scale(1,0.5);
  cx.fillStyle='#0c0a08'; cx.beginPath(); cx.arc(0,0,15,0,TAU); cx.fill();
  if(p.lit){
    const pl=0.6+0.4*Math.sin(t*4+p.x);
    cx.fillStyle='rgba(120,220,255,'+(0.30*pl)+')'; cx.beginPath(); cx.arc(0,0,17,0,TAU); cx.fill();
    cx.strokeStyle='#9fe6ff'; cx.lineWidth=2.4;
  } else { cx.strokeStyle='#3b4650'; cx.lineWidth=2; }
  cx.beginPath(); cx.arc(0,0,11,0,TAU); cx.stroke();
  cx.beginPath(); cx.moveTo(-6,-4); cx.lineTo(6,4); cx.moveTo(-6,4); cx.lineTo(6,-4); cx.stroke();
  cx.restore();
}
function drawLever(s,l){
  // stone base + angled handle; colored knob, brighter when set
  iBox(s, 0.55,0.55, 12, '#4a463f','#333029','#282520');
  const up=!!l.on, hx=up? 0 : 9, hy=up? -20 : -10;
  cx.strokeStyle='#20242b'; cx.lineWidth=4;
  cx.beginPath(); cx.moveTo(s.x, s.y-11); cx.lineTo(s.x+hx, s.y-11+hy); cx.stroke();
  cx.fillStyle=l.col; cx.beginPath(); cx.arc(s.x+hx, s.y-11+hy, 4.5, 0, TAU); cx.fill();
  if(up){ cx.fillStyle='rgba(255,255,255,0.6)'; cx.beginPath(); cx.arc(s.x+hx-1.3, s.y-12+hy, 1.6, 0, TAU); cx.fill(); }
}
function drawCaveChest(s,opened){
  iBox(s, 1.3,1.0, 12, '#5a3d24','#3f2b18','#332212');
  iBox({x:s.x,y:s.y-12}, 1.2,0.9, 8, '#6e4a2b','#4a3120','#3a2618');
  cx.fillStyle='#c9a24e';
  cx.fillRect(s.x-16,s.y-13,32,3);
  cx.fillStyle= opened? '#4a3120' : '#e8c860';
  cx.fillRect(s.x-3,s.y-15,6,7);
  if(!opened){ const g=0.5+0.5*Math.sin(G.time*3);
    cx.fillStyle='rgba(201,176,255,'+(0.35*g)+')'; cx.beginPath(); cx.arc(s.x,s.y-24,16,0,TAU); cx.fill(); }
}
function drawStairGlow(s,open,t){
  cx.save(); cx.translate(s.x,s.y); cx.scale(1,0.5);
  if(open){ const g=0.55+0.45*Math.sin(t*3);
    cx.fillStyle='rgba(255,215,106,'+(0.22*g)+')'; cx.beginPath(); cx.arc(0,0,30,0,TAU); cx.fill(); }
  cx.restore();
  if(open){
    cx.fillStyle='#ffe9a8'; cx.font='bold 15px Georgia'; cx.textAlign='center';
    cx.fillText('△', s.x, s.y-2-Math.abs(Math.sin(t*3))*4);
  }
}

function renderUndermaw(){
  const I=G.interior, t=I.t||0;
  cx.setTransform(DPR,0,0,DPR,0,0);
  cx.fillStyle='#070605'; cx.fillRect(0,0,VW,VH);
  const ccx=isoX(I.w/2,I.h/2), ccy=isoY(I.w/2,I.h/2);
  const w2s=(x,y)=>({x:isoX(x,y)-ccx+VW/2, y:isoY(x,y)-ccy+VH/2+14});

  // ---- floor (stone diamonds, subtle checker) ----
  for(let y=0;y<I.h;y++) for(let x=0;x<I.w;x++){
    const s=w2s(x,y);
    cx.fillStyle= ((x+y)&1)? '#1b1712' : '#161310';
    cx.beginPath();
    cx.moveTo(s.x, s.y-TH/2); cx.lineTo(s.x+TW/2, s.y);
    cx.lineTo(s.x, s.y+TH/2); cx.lineTo(s.x-TW/2, s.y); cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(0,0,0,0.4)'; cx.lineWidth=1; cx.stroke();
  }

  // ---- north wall (y=0) ----
  for(let x=0;x<I.w;x++){
    const a=w2s(x,0), b=w2s(x+1,0);
    cx.fillStyle= x%2? '#2a2620':'#241f1a';
    cx.beginPath(); cx.moveTo(a.x-TW/2,a.y-TH/2); cx.lineTo(b.x-TW/2,b.y-TH/2);
    cx.lineTo(b.x-TW/2,b.y-TH/2-WH); cx.lineTo(a.x-TW/2,a.y-TH/2-WH); cx.closePath(); cx.fill();
  }
  // ---- west wall (x=0) ----
  for(let y=0;y<I.h;y++){
    const a=w2s(0,y), b=w2s(0,y+1);
    cx.fillStyle= y%2? '#1e1a15':'#191510';
    cx.beginPath(); cx.moveTo(a.x-TW/2,a.y-TH/2); cx.lineTo(b.x-TW/2,b.y-TH/2);
    cx.lineTo(b.x-TW/2,b.y-TH/2-WH); cx.lineTo(a.x-TW/2,a.y-TH/2-WH); cx.closePath(); cx.fill();
  }

  // ---- the gate archway in the north wall (above the forward stair) ----
  if(I.stair){
    const g=w2s(I.stair.x, 0);
    const gx=g.x-TW/2, gy=g.y-TH/2;
    // arch recess
    cx.fillStyle= I.gateOpen? '#0a0806' : '#140f0a';
    cx.fillRect(gx-26, gy-WH+6, 52, WH-6);
    cx.beginPath(); cx.arc(gx, gy-WH+6, 26, Math.PI, 0); cx.fill();
    if(I.gateOpen){
      const gl=0.5+0.5*Math.sin(t*3);
      cx.fillStyle='rgba(255,205,120,'+(0.16*gl)+')';
      cx.fillRect(gx-24, gy-WH+8, 48, WH-8);
    } else {
      // portcullis bars
      cx.strokeStyle='#3c3630'; cx.lineWidth=3;
      for(let i=-2;i<=2;i++){ cx.beginPath(); cx.moveTo(gx+i*10, gy-WH+8); cx.lineTo(gx+i*10, gy-2); cx.stroke(); }
      cx.lineWidth=2;
      for(let j=0;j<3;j++){ cx.beginPath(); cx.moveTo(gx-24, gy-WH+14+j*16); cx.lineTo(gx+24, gy-WH+14+j*16); cx.stroke(); }
    }
    cx.strokeStyle='#4a4038'; cx.lineWidth=3;
    cx.beginPath(); cx.arc(gx, gy-WH+6, 26, Math.PI, 0); cx.stroke();
  }

  // ---- wall clue (runes for the lever order / a line of guidance) ----
  if(I.clueCols){
    const c=w2s(2.0, 0); const bx=c.x-TW/2, by=c.y-TH/2-WH+22;
    cx.fillStyle='#0d0a07'; cx.fillRect(bx-4, by-11, 66, 22);
    cx.strokeStyle='#3a332a'; cx.lineWidth=2; cx.strokeRect(bx-4, by-11, 66, 22);
    for(let i=0;i<I.clueCols.length;i++){
      cx.fillStyle=I.clueCols[i]; cx.beginPath(); cx.arc(bx+11+i*20, by, 6, 0, TAU); cx.fill();
      cx.fillStyle='rgba(255,255,255,0.55)'; cx.beginPath(); cx.arc(bx+9+i*20, by-2, 1.8, 0, TAU); cx.fill();
    }
  }

  // ---- wall torches ----
  if(I.torches) for(const tp of I.torches){
    const s=w2s(tp[0], 0.05); const fy=s.y-46;
    cx.fillStyle='#3a2c1c'; cx.fillRect(s.x-2, fy, 4, 14);
    for(let i=0;i<3;i++){ const fl=Math.sin(t*9+i*2)*2;
      cx.fillStyle=['#ff9a3c','#ffce7a','#e05648'][i];
      cx.beginPath(); cx.moveTo(s.x-4+i*4, fy); cx.quadraticCurveTo(s.x-2+i*4+fl, fy-12-i*2, s.x+i*4, fy); cx.closePath(); cx.fill(); }
    cx.fillStyle='rgba(255,170,80,0.12)'; cx.beginPath(); cx.arc(s.x, fy-2, 26, 0, TAU); cx.fill();
  }

  // ---- floor plates (flat, drawn before props/player) ----
  if(I.plates) for(const p of I.plates) drawPlate(w2s(p.x,p.y), p, t);
  // ---- forward stair glow on the floor ----
  if(I.stair) drawStairGlow(w2s(I.stair.x, I.stair.y), I.gateOpen, t);

  // ---- props + player, depth-sorted ----
  const items=[];
  for(const f of I.furn){ if(f.type==='lever'||f.type==='cavechest') items.push({d:f.x+f.y, f}); }
  items.push({d:P.x+P.y, player:true});
  items.sort((a,b)=>a.d-b.d);
  for(const it of items){
    if(it.player){ const s=w2s(P.x,P.y); drawShadowAt(cx,s.x,s.y,11); drawPlayer(s); }
    else if(it.f.type==='lever') drawLever(w2s(it.f.x,it.f.y), it.f);
    else if(it.f.type==='cavechest') drawCaveChest(w2s(it.f.x,it.f.y), !!(P.prog&&P.prog.caveChest));
  }

  // ---- exit affordance (down/out) ----
  { const s=w2s(I.exit.x, I.exit.y+0.5);
    cx.fillStyle='rgba(255,215,106,'+(0.14+0.1*Math.sin(G.time*3))+')';
    cx.save(); cx.translate(s.x,s.y); cx.scale(1,0.5);
    cx.beginPath(); cx.arc(0,0,24,0,TAU); cx.fill(); cx.restore();
    cx.fillStyle='#ffd76a'; cx.font='bold 14px Georgia'; cx.textAlign='center';
    cx.fillText('▼', s.x, s.y+4-Math.abs(Math.sin(G.time*3))*4);
  }

  // ---- interact affordance (ring + E-label / touch button) ----
  const hs=interiorHotspot();
  const nearExit=dist(P.x,P.y,I.exit.x,I.exit.y)<1.6;
  const exitLbl = (I.room>0)? 'Back' : 'Leave';
  const ib=document.getElementById('interactBtn');
  let label=null, at=null;
  if(hs && (!nearExit || dist(P.x,P.y,hs.f.x,hs.f.y)<dist(P.x,P.y,I.exit.x,I.exit.y))){
    label=hs.label; at=w2s(hs.f.x,hs.f.y);
    cx.strokeStyle='rgba(255,215,106,0.8)'; cx.lineWidth=2;
    cx.setLineDash([5,4]); cx.lineDashOffset=-G.time*16;
    cx.beginPath(); cx.ellipse(at.x,at.y,20,9,0,0,TAU); cx.stroke(); cx.setLineDash([]);
  } else if(nearExit){ label=exitLbl; at=w2s(I.exit.x,I.exit.y); }
  if(isTouch){
    ib.style.display= label? 'flex':'none';
    if(label) ib.textContent=label;
  } else if(label){
    cx.font='11px Verdana'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,0.6)'; cx.fillText('E - '+label, at.x+1, at.y-33);
    cx.fillStyle='#ffe9a8'; cx.fillText('E - '+label, at.x, at.y-34);
  }

  // ---- moody grade + vignette ----
  const wg=cx.createRadialGradient(VW/2,VH/2,50,VW/2,VH/2,Math.max(VW,VH)*0.6);
  wg.addColorStop(0,'rgba(60,80,120,0.05)'); wg.addColorStop(1,'rgba(0,0,0,0.66)');
  cx.fillStyle=wg; cx.fillRect(0,0,VW,VH);
  if(typeof drawGritGrade==='function') drawGritGrade();
}

// expose for debugging / potential reuse
window.renderUndermaw=renderUndermaw;
})();
