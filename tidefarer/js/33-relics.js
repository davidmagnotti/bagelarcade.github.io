/* =====================================================================
   RELICS - actively-triggered "verb" tools that recontextualise the map.

   Kept deliberately to the two that are genuinely distinct verbs (an
   earlier draft also had a grapple and a slow-time, but those read as
   just more dashes and were cut):

     - Blast Charge (bomb)      Q  - crack sealed walls, stagger foes
     - Lodestone    (lodestone) G  - drag heart-iron blocks about

   Each hangs off P.unlocked.* (so it saves with no migration) and has a
   reward-chest flag wired into openChest, so a dungeon drop is one line.

   World objects these act on (drawn by drawRelicDecor, below):
     crackwall - a fissured wall a Blast Charge opens ({tiles:[[x,y]..]})
     ironblock - a lodeblock the Lodestone slides ({bx,by})
     plate     - a pressure plate; pressing it clears {gate:[[x,y]..]}
     bomb      - a live charge counting down its fuse
   ===================================================================== */
(function(){
'use strict';

/* ---- tuning ---- */
var BOMB_FUSE=1.05, BOMB_RADIUS=2.6, BOMB_DMG=44, BOMB_CD=1.6;
var LODE_RANGE=6.0, LODE_CD=0.45;

function ok(){ return !(P.dead || G.state!=='play' || dlg.open || G.interior || (P.stunT||0)>0 || G.bossIntro || G.paused); }
function nag(key,msg){ if(!P['_'+key+'Nag'] || G.time>P['_'+key+'Nag']){ P['_'+key+'Nag']=G.time+4; toastErr(msg,3400); } }
function has_(f){ return !!(P.unlocked && P.unlocked[f]); }

/* =====================================================================
   BLAST CHARGE  -  crack sealed walls, stagger nearby foes
   ===================================================================== */
function tryBomb(){
  if(!ok()) return;
  if(!has_('bomb')){ nag('bomb','You carry no <b>Blast Charges</b> yet.'); return; }
  if((P.bombCd||0)>0) return;
  P.bombCd=BOMB_CD;
  G.decor.push({kind:'bomb', x:P.x+P.dir.x*0.55, y:P.y+P.dir.y*0.55, fuse:BOMB_FUSE, ph:Math.random()*TAU});
  if(Snd.step) Snd.step(6); buzz(8);
}
function bombBlast(x,y){
  if(Snd.boss) Snd.boss(); G.shake=Math.max(G.shake||0,0.55);
  shockwave(x,y,'rgba(255,150,70,0.9)',48); burst(x,y-0.3,'#ffb060',22,3.0);
  for(var i=0;i<10;i++) G.parts.push({x:x,y:y,vx:rnd(-2,2),vy:rnd(-2.4,-0.4),life:rnd(0.4,0.8),color:i<5?'#ffd27a':'#7a6a58',size:rnd(2.4,4),grav:0.06});
  for(var m=0;m<G.mobs.length;m++){ var mb=G.mobs[m]; if(mb.dead||mb.sealed) continue;
    var d=dist(x,y,mb.x,mb.y); if(d<=BOMB_RADIUS){
      var kx=(mb.x-x)/(d||1), ky=(mb.y-y)/(d||1);
      damageMob(mb, BOMB_DMG, {x:kx*0.9,y:ky*0.9}, 'bomb');
      if(mb.stunT!==undefined) mb.stunT=Math.max(mb.stunT||0,0.6);
    } }
  var opened=false;
  for(var k=0;k<G.decor.length;k++){ var b=G.decor[k];
    if(b.kind==='crackwall' && !b.broken && dist(x,y,b.x,b.y)<=BOMB_RADIUS+0.6){ breakCrackwall(b); opened=true; }
    else if(b.kind==='plate' && !b.on && dist(x,y,b.x,b.y)<=BOMB_RADIUS){ pressPlate(b); }
  }
  if(opened && typeof invalidateScenery==='function') invalidateScenery();
}
function breakCrackwall(b){
  b.broken=true;
  var tiles=b.tiles||[[Math.round(b.x),Math.round(b.y)]];
  for(var i=0;i<tiles.length;i++){ setSolid(tiles[i][0],tiles[i][1],0); setTile(tiles[i][0],tiles[i][1],T.RUIN); }
  burst(b.x,b.y-0.3,'#8a7a66',18,2.6); if(Snd.magic) Snd.magic();
  if(typeof invalidateScenery==='function') invalidateScenery();
}

/* =====================================================================
   LODESTONE  -  drag a heart-iron block toward you
   ===================================================================== */
function findIronblock(){
  var best=null, bestScore=1e9;
  for(var i=0;i<G.decor.length;i++){
    var b=G.decor[i]; if(b.kind!=='ironblock') continue;
    var dx=b.x-P.x, dy=b.y-P.y, d=Math.hypot(dx,dy);
    if(d<0.6 || d>LODE_RANGE) continue;
    var ahead=(dx*P.dir.x+dy*P.dir.y)/(d||1);
    if(ahead<0.1) continue;
    var score=d-ahead*1.5;
    if(score<bestScore){ bestScore=score; best=b; }
  }
  return best;
}
function tryLodestone(){
  if(!ok()) return;
  if(!has_('lodestone')){ nag('lode','You carry no <b>Lodestone</b> yet.'); return; }
  if((P.lodeCd||0)>0) return;
  var b=findIronblock();
  if(!b){ nag('lodeaim','No <b>lodeblock</b> of heart-iron ahead to call.'); return; }
  P.lodeCd=LODE_CD;
  var dx=P.x-b.x, dy=P.y-b.y;
  var sx=Math.abs(dx)>=Math.abs(dy)? (dx>0?1:-1):0;
  var sy=Math.abs(dy)>Math.abs(dx)? (dy>0?1:-1):0;
  var moved=false;
  var nx=b.bx+sx, ny=b.by+sy;
  // tile coords: decor/player x is tile+0.5, so use Math.floor (Math.round would land a tile off).
  if(!(nx===Math.floor(P.x) && ny===Math.floor(P.y)) && inb(nx,ny) && !solidAt(nx,ny) && walkTile(tileAt(nx,ny))){
    setSolid(b.bx,b.by,0);
    b.bx=nx; b.by=ny; b.x=nx+0.5; b.y=ny+0.5;
    setSolid(b.bx,b.by,1);
    moved=true;
  }
  if(moved){
    if(Snd.step) Snd.step(5); buzz(6); G.shake=Math.max(G.shake||0,0.12);
    for(var i=0;i<5;i++) G.parts.push({x:b.x,y:b.y,vx:rnd(-0.5,0.5),vy:rnd(-0.6,0),life:0.3,color:'rgba(150,170,200,0.6)',size:2.4});
    for(var k=0;k<G.decor.length;k++){ var pl=G.decor[k];
      if(pl.kind==='plate' && !pl.on && Math.floor(pl.x)===b.bx && Math.floor(pl.y)===b.by) pressPlate(pl); }
    if(typeof invalidateScenery==='function') invalidateScenery();
  } else { nag('lodeblock','The lodeblock will not budge - the way behind it is blocked.'); }
}
function pressPlate(pl){
  pl.on=true;
  var gate=pl.gate||[];
  for(var i=0;i<gate.length;i++){ setSolid(gate[i][0],gate[i][1],0); setTile(gate[i][0],gate[i][1],T.RUIN); }
  burst(pl.x,pl.y-0.2,'#9be07f',14,2.2); if(Snd.quest) Snd.quest(); G.shake=Math.max(G.shake||0,0.25);
  if(gate.length){ banner('A GATE GRINDS OPEN','THE PLATE HOLDS FAST'); if(typeof invalidateScenery==='function') invalidateScenery(); }
}

/* =====================================================================
   PER-FRAME  -  cooldowns, live-charge fuses
   ===================================================================== */
function updateRelics(dt){
  P.bombCd=Math.max(0,(P.bombCd||0)-dt);
  P.lodeCd=Math.max(0,(P.lodeCd||0)-dt);
  for(var i=G.decor.length-1;i>=0;i--){ var b=G.decor[i]; if(b.kind!=='bomb') continue;
    b.fuse-=dt;
    if(b.fuse<=0){ bombBlast(b.x,b.y); G.decor.splice(i,1); }
    else if(Math.random()<dt*6) G.parts.push({x:b.x+rnd(-0.1,0.1),y:b.y-0.5,vx:rnd(-0.2,0.2),vy:-rnd(0.6,1.1),life:0.4,color:'#ffce7a',size:2,grav:0});
  }
  updateRelicButtons();
}

/* =====================================================================
   DRAW  -  the new world objects (hooked from drawDecor in 10-rendering)
   ===================================================================== */
function drawRelicDecor(b,s){
  var t=G.time;
  if(b.kind==='crackwall'){
    if(b.broken) return true;
    cx.save();
    cx.fillStyle='#5a5048'; cx.strokeStyle='#2e2822'; cx.lineWidth=1.4;
    cx.beginPath(); cx.moveTo(s.x-11,s.y); cx.lineTo(s.x-11,s.y-22); cx.lineTo(s.x+11,s.y-22); cx.lineTo(s.x+11,s.y); cx.closePath();
    cx.fill(); cx.stroke();
    cx.strokeStyle='#1c1712'; cx.lineWidth=1.6; cx.beginPath();
    cx.moveTo(s.x-1,s.y-22); cx.lineTo(s.x+2,s.y-15); cx.lineTo(s.x-2,s.y-9); cx.lineTo(s.x+1,s.y-1); cx.stroke();
    cx.fillStyle='#c9b089'; cx.font='9px Georgia'; cx.textAlign='center';
    if(dist(P.x,P.y,b.x,b.y)<3.2) cx.fillText('cracked', s.x, s.y-26);
    cx.restore();
    return true;
  }
  if(b.kind==='ironblock'){
    cx.save();
    var g=cx.createLinearGradient(s.x-10,s.y-24,s.x+10,s.y);
    g.addColorStop(0,'#8b93a0'); g.addColorStop(0.5,'#5a616c'); g.addColorStop(1,'#3a3f47');
    cx.fillStyle=g; cx.strokeStyle='#23262b'; cx.lineWidth=1.6;
    cx.beginPath(); cx.moveTo(s.x-10,s.y-3); cx.lineTo(s.x-10,s.y-20); cx.lineTo(s.x,s.y-25); cx.lineTo(s.x+10,s.y-20); cx.lineTo(s.x+10,s.y-3); cx.lineTo(s.x,s.y+2); cx.closePath();
    cx.fill(); cx.stroke();
    cx.fillStyle='#2a2d33'; [[-6,-16],[6,-16],[-6,-6],[6,-6]].forEach(function(p){ cx.beginPath(); cx.arc(s.x+p[0],s.y+p[1],1.3,0,TAU); cx.fill(); });
    if((P.lodeCd||0)<=0 && has_('lodestone') && dist(P.x,P.y,b.x,b.y)<=LODE_RANGE){
      cx.globalAlpha=0.4+0.3*Math.sin(t*4); cx.strokeStyle='#a9c4ff'; cx.lineWidth=1.4;
      cx.beginPath(); cx.arc(s.x,s.y-11,14,0,TAU); cx.stroke(); cx.globalAlpha=1;
    }
    cx.restore();
    return true;
  }
  if(b.kind==='plate'){
    cx.save();
    var pressed=b.on;
    cx.fillStyle=pressed?'rgba(90,150,80,0.5)':'rgba(120,120,130,0.45)';
    cx.strokeStyle=pressed?'#7fd06a':'#8a8a96'; cx.lineWidth=1.6;
    cx.beginPath(); cx.ellipse(s.x,s.y,13,7,0,0,TAU); cx.fill(); cx.stroke();
    if(!pressed){ cx.strokeStyle='rgba(255,255,255,0.3)'; cx.lineWidth=1;
      cx.beginPath(); cx.ellipse(s.x,s.y,8,4,0,0,TAU); cx.stroke(); }
    cx.restore();
    return true;
  }
  if(b.kind==='bomb'){
    var blink=(b.fuse<0.5 && Math.sin(t*24)>0);
    cx.save();
    cx.fillStyle=blink?'#c05038':'#3a2f28'; cx.strokeStyle='#1a1410'; cx.lineWidth=1.4;
    cx.beginPath(); cx.arc(s.x,s.y-5,7,0,TAU); cx.fill(); cx.stroke();
    cx.strokeStyle='#6b5a44'; cx.lineWidth=1.4; cx.beginPath(); cx.moveTo(s.x+2,s.y-11); cx.lineTo(s.x+5,s.y-16); cx.stroke();
    cx.fillStyle='#ffd070'; cx.beginPath(); cx.arc(s.x+5,s.y-16,1.8+Math.random(),0,TAU); cx.fill();
    cx.restore();
    return true;
  }
  return false;
}

/* =====================================================================
   TOUCH BUTTONS  -  shown only once the relic is earned
   ===================================================================== */
var RBTN=[
  {id:'bombBtn', flag:'bomb',      fn:tryBomb,      cd:function(){return P.bombCd;}},
  {id:'lodeBtn', flag:'lodestone', fn:tryLodestone, cd:function(){return P.lodeCd;}}
];
function updateRelicButtons(){
  if(!isTouch) return;
  var hide=!!G.interior;
  for(var i=0;i<RBTN.length;i++){ var r=RBTN[i]; var el=document.getElementById(r.id); if(!el) continue;
    var show=!hide && has_(r.flag);
    el.style.display=show?'':'none';
    if(show) el.classList.toggle('cooldown', r.cd()>0);
  }
}
function wireRelicButtons(){
  if(typeof pressable!=='function') return;
  for(var i=0;i<RBTN.length;i++){ (function(r){ var el=document.getElementById(r.id); if(el) pressable(el,function(){ r.fn(); }); })(RBTN[i]); }
}

/* =====================================================================
   GRANTS  -  reward path (openChest gift branches or dev menu)
   ===================================================================== */
function grantBomb(){ P.unlocked=P.unlocked||{}; if(P.unlocked.bomb){ return; } P.unlocked.bomb=true;
  give('blastcharge',1);
  banner('THE BLAST CHARGE','OPEN WHAT WAS SEALED');
  storyCard('<i>A satchel of clay pots packed with ground fire-salt - and the trick of setting them, which no wall keeps out.</i> <b style="color:#ffb060">You carry Blast Charges.</b> <i>Set one down ('+(isTouch?'the ✸ button':'press <b>Q</b>')+') and stand clear: it cracks open <b>fissured walls</b>, trips distant plates, and staggers whatever stands too near.</i>');
  if(typeof refreshUI==='function') refreshUI();
}
function grantLodestone(){ P.unlocked=P.unlocked||{}; if(P.unlocked.lodestone){ return; } P.unlocked.lodestone=true;
  give('lodestone',1);
  banner('THE LODESTONE','CALL THE HEART-IRON');
  storyCard('<i>A lump of the quake-spirit\'s own heart-iron, still humming. It pulls at every iron thing near it.</i> <b style="color:#a9c4ff">You carry the Lodestone.</b> <i>Face a <b>lodeblock</b> and call it ('+(isTouch?'the ❖ button':'press <b>G</b>')+') to drag it toward you - onto a pressure plate, off a ledge, out of your road.</i>');
  if(typeof refreshUI==='function') refreshUI();
}
function grantAllRelics(){ grantBomb(); grantLodestone(); }

/* =====================================================================
   SANDBOX  -  grant both and lay out a puzzle for each, right here (dev)
   ===================================================================== */
function walkNear(dx,dy){
  var tx=Math.round(P.x)+dx, ty=Math.round(P.y)+dy;
  if(inb(tx,ty) && walkTile(tileAt(tx,ty))) return [tx,ty];
  for(var r=1;r<=4;r++) for(var oy=-r;oy<=r;oy++) for(var ox=-r;ox<=r;ox++){
    var x=tx+ox,y=ty+oy; if(inb(x,y) && walkTile(tileAt(x,y)) && !solidAt(x,y)) return [x,y];
  }
  return [tx,ty];
}
function spawnRelicSandbox(){
  P.unlocked=P.unlocked||{};
  P.unlocked.bomb=P.unlocked.lodestone=true;
  give('blastcharge',1); give('lodestone',1);
  var w=walkNear(0,-5); setSolid(w[0],w[1],1);
  G.decor.push({kind:'crackwall', x:w[0]+0.5, y:w[1]+0.5, tiles:[[w[0],w[1]]]});
  var c=walkNear(0,-7); G.decor.push({kind:'chest', x:c[0]+0.5, y:c[1]+0.5, rich:1});
  var ib=walkNear(3,3); setSolid(ib[0],ib[1],1);
  G.decor.push({kind:'ironblock', x:ib[0]+0.5, y:ib[1]+0.5, bx:ib[0], by:ib[1]});
  var pl=walkNear(5,3); var gt1=walkNear(5,5), gt2=walkNear(6,5);
  setSolid(gt1[0],gt1[1],1); setSolid(gt2[0],gt2[1],1);
  G.decor.push({kind:'plate', x:pl[0]+0.5, y:pl[1]+0.5, gate:[[gt1[0],gt1[1]],[gt2[0],gt2[1]]]});
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(typeof toast==='function') toast('<b>Relic sandbox:</b> Blast Charge + Lodestone granted. ✸ cracked wall north · ❖ lodeblock+plate south. '+(isTouch?'Use the new buttons.':'Keys Q / G.'),7000);
}

/* ---- boot: wire touch buttons ---- */
wireRelicButtons();

/* ---- exports (globals, matching the codebase's style) ---- */
window.tryBomb=tryBomb; window.tryLodestone=tryLodestone;
window.updateRelics=updateRelics; window.drawRelicDecor=drawRelicDecor;
window.grantBomb=grantBomb; window.grantLodestone=grantLodestone;
window.grantAllRelics=grantAllRelics; window.spawnRelicSandbox=spawnRelicSandbox;

})();
