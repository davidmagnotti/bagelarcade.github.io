/* =====================================================================
   RELICS - actively-triggered "verb" tools that recontextualise the map.

   Kept to the one genuinely distinct verb (an earlier draft also had a
   grapple, a slow-time and a heart-iron Lodestone, but those read as
   just more dashes / a fiddly block-shove and were cut - gated progression
   now lives entirely in the tiered gathering tools, 34-toolgates.js):

     - Blast Charge (bomb)      Q  - crack sealed walls, stagger foes

   It hangs off P.unlocked.* (so it saves with no migration) and has a
   reward-chest flag wired into openChest, so a dungeon drop is one line.

   World objects it acts on (drawn by drawRelicDecor, below):
     crackwall - a fissured wall a Blast Charge opens ({tiles:[[x,y]..]})
     bomb      - a live charge counting down its fuse
   ===================================================================== */
(function(){
'use strict';

/* ---- tuning ---- */
var BOMB_FUSE=1.05, BOMB_RADIUS=2.6, BOMB_DMG=44, BOMB_CD=1.6;

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
   PER-FRAME  -  cooldowns, live-charge fuses
   ===================================================================== */
function updateRelics(dt){
  P.bombCd=Math.max(0,(P.bombCd||0)-dt);
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
  {id:'bombBtn', flag:'bomb', fn:tryBomb, cd:function(){return P.bombCd;}}
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
  storyCard('<i>A satchel of clay pots packed with ground fire-salt - and the trick of setting them, which no wall keeps out.</i> <b style="color:#ffb060">You carry Blast Charges.</b> <i>Set one down ('+(isTouch?'the ✸ button':'press <b>Q</b>')+') and stand clear: it cracks open <b>fissured walls</b> and staggers whatever stands too near.</i>');
  if(typeof refreshUI==='function') refreshUI();
}
function grantAllRelics(){ grantBomb(); }

/* =====================================================================
   SANDBOX  -  grant the Blast Charge and lay out a crackwall, right here (dev)
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
  P.unlocked.bomb=true;
  give('blastcharge',1);
  var w=walkNear(0,-5); setSolid(w[0],w[1],1);
  G.decor.push({kind:'crackwall', x:w[0]+0.5, y:w[1]+0.5, tiles:[[w[0],w[1]]]});
  var c=walkNear(0,-7); G.decor.push({kind:'chest', x:c[0]+0.5, y:c[1]+0.5, rich:1});
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(typeof toast==='function') toast('<b>Relic sandbox:</b> Blast Charge granted. ✸ cracked wall + chest to the north. '+(isTouch?'Use the ✸ button.':'Press Q.'),7000);
}

/* ---- boot: wire touch buttons ---- */
wireRelicButtons();

/* ---- exports (globals, matching the codebase's style) ---- */
window.tryBomb=tryBomb;
window.updateRelics=updateRelics; window.drawRelicDecor=drawRelicDecor;
window.grantBomb=grantBomb;
window.grantAllRelics=grantAllRelics; window.spawnRelicSandbox=spawnRelicSandbox;

})();
