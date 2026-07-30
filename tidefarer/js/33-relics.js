/* =====================================================================
   RELICS - four whole-game "verb" tools, in the spirit of the dash.

   Each is a permanent, actively-triggered ability (not a stat-stick),
   meant to recontextualise the whole map the way the dash does. They
   hang off P.unlocked.* exactly like dash/dive/surf, so they persist
   through the ordinary save (unlocked:P.unlocked in saveCode) with no
   migration needed, and slot into the dungeon-gift reward path.

     - Tideglass Hook  (hook)      F  - haul yourself to an anchor-ring
     - Blast Charge    (bomb)      Q  - crack sealed walls, stagger foes
     - Lodestone       (lodestone) G  - drag heart-iron blocks about
     - Slow-Time       (slowtime)  C  - the world crawls; you move free

   New world objects these act on (drawn by drawRelicDecor, below):
     anchor    - a founder's-glass ring the Hook can catch
     crackwall - a fissured wall a Blast Charge opens ({tiles:[[x,y]..]})
     ironblock - a lodeblock the Lodestone slides ({bx,by})
     plate     - a pressure plate; pressing it clears {gate:[[x,y]..]}
     bomb      - a live charge counting down its fuse
   ===================================================================== */
(function(){
'use strict';

/* ---- tuning ---- */
var HOOK_RANGE=8.0, HOOK_CD=0.9, HOOK_SPEED=26;       // tiles, seconds, tiles/sec
var BOMB_FUSE=1.05, BOMB_RADIUS=2.6, BOMB_DMG=44, BOMB_CD=1.6;
var LODE_RANGE=6.0, LODE_CD=0.45, LODE_MAXSTEP=6;
var SLOW_FACTOR=0.30, SLOW_MP_PER_SEC=9, SLOW_MIN_MP=6, SLOW_CD=0.5;

function ok(){ return !(P.dead || G.state!=='play' || dlg.open || G.interior || (P.stunT||0)>0 || G.bossIntro || G.paused); }
function nag(key,msg){ if(!P['_'+key+'Nag'] || G.time>P['_'+key+'Nag']){ P['_'+key+'Nag']=G.time+4; toastErr(msg,3400); } }
function has_(f){ return !!(P.unlocked && P.unlocked[f]); }

/* =====================================================================
   1) TIDEGLASS HOOK  -  haul yourself to an anchor-ring across any gap
   ===================================================================== */
function findAnchor(){
  var best=null, bestScore=1e9;
  for(var i=0;i<G.decor.length;i++){
    var b=G.decor[i]; if(b.kind!=='anchor') continue;
    var dx=b.x-P.x, dy=b.y-P.y, d=Math.hypot(dx,dy);
    if(d<1.1 || d>HOOK_RANGE) continue;
    var ahead=(dx*P.dir.x+dy*P.dir.y)/(d||1);   // >0 means roughly in front
    if(ahead<-0.25) continue;                    // don't fling backward
    var score=d-ahead*2.2;                       // nearest, favouring what you face
    if(score<bestScore){ bestScore=score; best=b; }
  }
  return best;
}
function hookLanding(t){
  var dx=P.x-t.x, dy=P.y-t.y, d=Math.hypot(dx,dy)||1;
  for(var s=1.0;s<d;s+=0.5){
    var lx=t.x+dx/d*s, ly=t.y+dy/d*s;
    if(walkTile(tileAt(lx|0,ly|0)) && !circleBlocked(lx,ly,0.28)) return {x:lx,y:ly};
  }
  return {x:P.x,y:P.y};
}
function tryHook(){
  if(!ok()) return;
  if(!has_('hook')){ nag('hook','You carry no <b>Tideglass Hook</b> yet.'); return; }
  if((P.hookT||0)>0 || (P.hookCd||0)>0) return;
  var t=findAnchor();
  if(!t){ nag('hookaim','No <b>anchor-ring</b> ahead for the Hook to catch.'); return; }
  var land=hookLanding(t);
  P._hookFrom={x:P.x,y:P.y}; P._hookTo=land; P._hookTgt=t; P.hookP=0; P.hookT=1;
  P.hookCd=HOOK_CD; P.click=null;
  P.dir={x:(t.x-P.x)/(Math.hypot(t.x-P.x,t.y-P.y)||1), y:(t.y-P.y)/(Math.hypot(t.x-P.x,t.y-P.y)||1)};
  if(Snd.noise) Snd.noise(0.10,0.03,320,0.6); buzz(9);
  burst(t.x,t.y-0.2,'#9fe0ff',8,2.2);
}
/* called from the top of updatePlayer; returns true while it owns the hero */
function updateHookTravel(dt){
  if(!((P.hookT||0)>0)) return false;
  var f=P._hookFrom, to=P._hookTo;
  var total=Math.hypot(to.x-f.x,to.y-f.y)||0.001;
  P.hookP=(P.hookP||0)+(dt*HOOK_SPEED)/total;
  if(P.hookP>=1){
    P.hookP=1; P.hookT=0; P.x=to.x; P.y=to.y; P.moving=false;
    if(Snd.hit) Snd.hit(); buzz(12); burst(P.x,P.y-0.4,'#cdeeff',10,2.4);
    return false;
  }
  P.x=f.x+(to.x-f.x)*P.hookP; P.y=f.y+(to.y-f.y)*P.hookP;
  P.moving=true; P.anim+=dt*11;
  if(Math.random()<0.7) G.parts.push({x:P.x,y:P.y,vx:rnd(-0.4,0.4),vy:rnd(-0.4,0.4),life:0.28,color:'rgba(160,220,255,0.6)',size:2.4});
  return true;
}

/* =====================================================================
   2) BLAST CHARGE  -  crack sealed walls, stagger nearby foes
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
  // foes in the blast
  for(var m=0;m<G.mobs.length;m++){ var mb=G.mobs[m]; if(mb.dead||mb.sealed) continue;
    var d=dist(x,y,mb.x,mb.y); if(d<=BOMB_RADIUS){
      var kx=(mb.x-x)/(d||1), ky=(mb.y-y)/(d||1);
      damageMob(mb, BOMB_DMG, {x:kx*0.9,y:ky*0.9}, 'bomb');
      if(mb.stunT!==undefined) mb.stunT=Math.max(mb.stunT||0,0.6);
    } }
  // fissured walls it opens, and plates it trips
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
   3) LODESTONE  -  drag a heart-iron block toward you
   ===================================================================== */
function findIronblock(){
  var best=null, bestScore=1e9;
  for(var i=0;i<G.decor.length;i++){
    var b=G.decor[i]; if(b.kind!=='ironblock') continue;
    var dx=b.x-P.x, dy=b.y-P.y, d=Math.hypot(dx,dy);
    if(d<0.6 || d>LODE_RANGE) continue;
    var ahead=(dx*P.dir.x+dy*P.dir.y)/(d||1);
    if(ahead<0.1) continue;                      // must be ahead of you
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
  // step the block one tile toward you along the dominant axis, if the way is clear
  var dx=P.x-b.x, dy=P.y-b.y;
  var sx=Math.abs(dx)>=Math.abs(dy)? (dx>0?1:-1):0;
  var sy=Math.abs(dy)>Math.abs(dx)? (dy>0?1:-1):0;
  var moved=false;
  for(var step=0; step<1; step++){
    var nx=b.bx+sx, ny=b.by+sy;
    // stop before landing on the player's own tile
    if(nx===Math.round(P.x) && ny===Math.round(P.y)) break;
    if(!inb(nx,ny) || solidAt(nx,ny) || !walkTile(tileAt(nx,ny))) break;
    setSolid(b.bx,b.by,0);
    b.bx=nx; b.by=ny; b.x=nx+0.5; b.y=ny+0.5;
    setSolid(b.bx,b.by,1);
    moved=true;
  }
  if(moved){
    if(Snd.step) Snd.step(5); buzz(6); G.shake=Math.max(G.shake||0,0.12);
    for(var i=0;i<5;i++) G.parts.push({x:b.x,y:b.y,vx:rnd(-0.5,0.5),vy:rnd(-0.6,0),life:0.3,color:'rgba(150,170,200,0.6)',size:2.4});
    // a block coming to rest on a plate trips it
    for(var k=0;k<G.decor.length;k++){ var pl=G.decor[k];
      if(pl.kind==='plate' && !pl.on && Math.round(pl.x)===b.bx && Math.round(pl.y)===b.by) pressPlate(pl); }
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
   4) SLOW-TIME  -  the world crawls to a slog while you move at speed
   The frame loop scales mob/proj/world dt by SLOW_FACTOR while P.slowT>0
   (see 21-exploration.js). The player keeps full dt, so you act freely.
   ===================================================================== */
function trySlowTime(){
  if(!ok()) return;
  if(!has_('slowtime')){ nag('slow','You carry no <b>Slow-Time</b> yet.'); return; }
  if((P.slowT||0)>0){ P.slowT=0; return; }        // press again to release early
  if((P.slowCd||0)>0) return;
  if((P.mp||0)<SLOW_MIN_MP){ nag('slowmp','Not focus enough to still the tide - your mana is spent.'); return; }
  P.slowT=1;   // active flag; MP drain in updateRelics ends it when spent
  if(Snd.magic) Snd.magic(); buzz(14);
  shockwave(P.x,P.y,'rgba(140,200,255,0.7)',52);
  setSlowOverlay(true);
}
function endSlowTime(){ if((P.slowT||0)>0){ P.slowT=0; P.slowCd=SLOW_CD; setSlowOverlay(false); if(typeof refreshUI==='function') refreshUI(); } }
function setSlowOverlay(on){
  var ov=document.getElementById('slowOv'); if(!ov) return;
  ov.style.opacity=on?'1':'0';
}

/* =====================================================================
   PER-FRAME  -  cooldowns, fuses, the slow-time MP burn
   ===================================================================== */
function updateRelics(dt){
  P.hookCd=Math.max(0,(P.hookCd||0)-dt);
  P.bombCd=Math.max(0,(P.bombCd||0)-dt);
  P.lodeCd=Math.max(0,(P.lodeCd||0)-dt);
  P.slowCd=Math.max(0,(P.slowCd||0)-dt);
  // live blast charges
  for(var i=G.decor.length-1;i>=0;i--){ var b=G.decor[i]; if(b.kind!=='bomb') continue;
    b.fuse-=dt;
    if(b.fuse<=0){ bombBlast(b.x,b.y); G.decor.splice(i,1); }
    else if(Math.random()<dt*6) G.parts.push({x:b.x+rnd(-0.1,0.1),y:b.y-0.5,vx:rnd(-0.2,0.2),vy:-rnd(0.6,1.1),life:0.4,color:'#ffce7a',size:2,grav:0});
  }
  // slow-time: burn focus while held; end when spent
  if((P.slowT||0)>0){
    P.mp=(P.mp||0)-SLOW_MP_PER_SEC*dt;
    if(P.mp<=0){ P.mp=0; endSlowTime(); }
    if(Math.random()<dt*10) G.parts.push({x:P.x+rnd(-0.6,0.6),y:P.y+rnd(-0.6,0.2),vx:0,vy:-rnd(0.2,0.5),life:0.6,color:'rgba(160,210,255,0.55)',size:2.2,grav:0});
  } else { setSlowOverlay(false); }
  updateRelicButtons();
}

/* =====================================================================
   DRAW  -  the new world objects (hooked from drawDecor in 10-rendering)
   ===================================================================== */
function drawRelicDecor(b,s){
  var t=G.time;
  if(b.kind==='anchor'){
    var lit=(P.hooking||((P.hookT||0)>0 && P._hookTgt===b));
    // rope from the ring to the hero while hauling
    if((P.hookT||0)>0 && P._hookTgt===b){
      var ps=worldToScreen(P.x,P.y);
      cx.strokeStyle='rgba(200,235,255,0.8)'; cx.lineWidth=2; cx.beginPath();
      cx.moveTo(s.x,s.y-14); cx.lineTo(ps.x,ps.y-16); cx.stroke();
    }
    var pulse=0.5+0.5*Math.sin(t*2.4+(b.ph||0));
    cx.save();
    // post
    cx.strokeStyle='#6b5638'; cx.lineWidth=3.4; cx.beginPath(); cx.moveTo(s.x,s.y); cx.lineTo(s.x,s.y-14); cx.stroke();
    // glass ring
    cx.strokeStyle='rgba(120,200,255,'+(0.7+0.3*pulse)+')'; cx.lineWidth=3;
    cx.beginPath(); cx.arc(s.x,s.y-20,6.5,0,TAU); cx.stroke();
    cx.strokeStyle='rgba(230,248,255,0.9)'; cx.lineWidth=1.2;
    cx.beginPath(); cx.arc(s.x,s.y-20,6.5,0,TAU); cx.stroke();
    if(dist(P.x,P.y,b.x,b.y)<=HOOK_RANGE){ cx.globalAlpha=0.25+0.25*pulse; cx.fillStyle='#9fe0ff';
      cx.beginPath(); cx.arc(s.x,s.y-20,9,0,TAU); cx.fill(); cx.globalAlpha=1; }
    cx.restore();
    return true;
  }
  if(b.kind==='crackwall'){
    if(b.broken) return true;
    cx.save();
    cx.fillStyle='#5a5048'; cx.strokeStyle='#2e2822'; cx.lineWidth=1.4;
    cx.beginPath(); cx.moveTo(s.x-11,s.y); cx.lineTo(s.x-11,s.y-22); cx.lineTo(s.x+11,s.y-22); cx.lineTo(s.x+11,s.y); cx.closePath();
    cx.fill(); cx.stroke();
    // fissure
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
    // rivets
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
    var fl=Math.max(0,Math.min(1,b.fuse/BOMB_FUSE));
    var blink=(b.fuse<0.5 && Math.sin(t*24)>0);
    cx.save();
    cx.fillStyle=blink?'#c05038':'#3a2f28'; cx.strokeStyle='#1a1410'; cx.lineWidth=1.4;
    cx.beginPath(); cx.arc(s.x,s.y-5,7,0,TAU); cx.fill(); cx.stroke();
    // fuse spark
    cx.strokeStyle='#6b5a44'; cx.lineWidth=1.4; cx.beginPath(); cx.moveTo(s.x+2,s.y-11); cx.lineTo(s.x+5,s.y-16); cx.stroke();
    cx.fillStyle='#ffd070'; cx.beginPath(); cx.arc(s.x+5,s.y-16,1.8+Math.random(),0,TAU); cx.fill();
    cx.restore();
    return true;
  }
  return false;
}

/* =====================================================================
   TOUCH BUTTONS  -  four small buttons, each shown only once unlocked
   ===================================================================== */
var RBTN=[
  {id:'hookBtn',  flag:'hook',      fn:tryHook,      cd:function(){return P.hookCd;}, label:'⚓'},
  {id:'bombBtn',  flag:'bomb',      fn:tryBomb,      cd:function(){return P.bombCd;}, label:'✸'},
  {id:'lodeBtn',  flag:'lodestone', fn:tryLodestone, cd:function(){return P.lodeCd;}, label:'❖'},
  {id:'slowBtn',  flag:'slowtime',  fn:trySlowTime,  cd:function(){return P.slowCd;}, label:'⧗'}
];
function updateRelicButtons(){
  if(!isTouch) return;
  var hide=!!G.interior;
  for(var i=0;i<RBTN.length;i++){ var r=RBTN[i]; var el=document.getElementById(r.id); if(!el) continue;
    var show=!hide && has_(r.flag);
    el.style.display=show?'':'none';
    if(show){
      var busy = r.flag==='slowtime' ? false : (r.cd()>0);
      el.classList.toggle('cooldown', busy);
      if(r.flag==='slowtime') el.classList.toggle('active', (P.slowT||0)>0);
    }
  }
}
function wireRelicButtons(){
  if(typeof pressable!=='function') return;
  for(var i=0;i<RBTN.length;i++){ (function(r){ var el=document.getElementById(r.id); if(el) pressable(el,function(){ r.fn(); }); })(RBTN[i]); }
}

/* =====================================================================
   GRANTS  -  reward path (called from openChest gift branches or dev menu)
   ===================================================================== */
function grantHook(){ P.unlocked=P.unlocked||{}; if(P.unlocked.hook){ return; } P.unlocked.hook=true;
  give('tideglasshook',1);
  banner('THE TIDEGLASS HOOK','HAUL YOURSELF ACROSS ANY GAP');
  storyCard('<i>A ring of blue founder\'s-glass on a whip of woven kelp settles into your hand.</i> <b style="color:#9fe0ff">You carry the Tideglass Hook.</b> <i>Loose it at an <b>anchor-ring</b> ('+(isTouch?'the ⚓ button':'press <b>F</b>')+') and it hauls you across in a heartbeat - over water, over any gap. Chasms that stopped you before are only distances now.</i>');
  if(typeof refreshUI==='function') refreshUI();
}
function grantBomb(){ P.unlocked=P.unlocked||{}; if(P.unlocked.bomb){ return; } P.unlocked.bomb=true;
  give('blastcharge',1);
  banner('THE BLAST CHARGE','OPEN WHAT WAS SEALED');
  storyCard('<i>A satchel of clay pots packed with ground fire-salt - and the trick of setting them, which no wall keeps out.</i> <b style="color:#ffb060">You carry Blast Charges.</b> <i>Set one down ('+(isTouch?'the ✸ button':'press <b>Q</b>')+') and stand clear: it cracks open <b>fissured walls</b>, trips distant plates, and staggers whatever stands too near. Every sealed hoard on the isles just grew a door.</i>');
  if(typeof refreshUI==='function') refreshUI();
}
function grantLodestone(){ P.unlocked=P.unlocked||{}; if(P.unlocked.lodestone){ return; } P.unlocked.lodestone=true;
  give('lodestone',1);
  banner('THE LODESTONE','CALL THE HEART-IRON');
  storyCard('<i>A lump of the quake-spirit\'s own heart-iron, still humming. It pulls at every iron thing near it.</i> <b style="color:#a9c4ff">You carry the Lodestone.</b> <i>Face a <b>lodeblock</b> and call it ('+(isTouch?'the ❖ button':'press <b>G</b>')+') to drag it toward you - onto a pressure plate, off a ledge, out of your road. The old blocked ways will move for you now.</i>');
  if(typeof refreshUI==='function') refreshUI();
}
function grantSlowTime(){ P.unlocked=P.unlocked||{}; if(P.unlocked.slowtime){ return; } P.unlocked.slowtime=true;
  give('tidewatch',1);
  banner('THE TIDEFARER\'S SLOW-TIME','THE WORLD CRAWLS; YOU RUN FREE');
  storyCard('<i>The gift wound into your blood: a stillness you can spend. Draw on your focus and the whole world drags to a crawl while you move on, untouched by the slog.</i> <b style="color:#9bd0ff">You learn Slow-Time.</b> <i>Hold it ('+(isTouch?'the ⧗ button':'press <b>C</b>')+') to still the tide - it drains your mana while it lasts. Strike a dozen times before a foe can answer; walk between gusts, quakes and falling stone as if they hung in the air.</i>');
  if(typeof refreshUI==='function') refreshUI();
}
function grantAllRelics(){ grantHook(); grantBomb(); grantLodestone(); grantSlowTime(); }

/* =====================================================================
   SANDBOX  -  grant all four and lay out one puzzle for each, right here.
   For testing (dev menu). Best-effort placement on nearby walkable tiles.
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
  P.unlocked.hook=P.unlocked.bomb=P.unlocked.lodestone=P.unlocked.slowtime=true;
  give('tideglasshook',1); give('blastcharge',1); give('lodestone',1); give('tidewatch',1);
  // 1) an anchor-ring a hook's reach to the east
  var a=walkNear(6,0); G.decor.push({kind:'anchor', x:a[0]+0.5, y:a[1]+0.5, ph:Math.random()*TAU});
  // 2) a fissured wall to the north, a chest of coin behind it
  var w=walkNear(0,-5); setSolid(w[0],w[1],1);
  G.decor.push({kind:'crackwall', x:w[0]+0.5, y:w[1]+0.5, tiles:[[w[0],w[1]]]});
  var c=walkNear(0,-7); G.decor.push({kind:'chest', x:c[0]+0.5, y:c[1]+0.5, rich:1});
  // 3) a lodeblock, a plate beyond it, a gate the plate opens
  var ib=walkNear(3,3); setSolid(ib[0],ib[1],1);
  G.decor.push({kind:'ironblock', x:ib[0]+0.5, y:ib[1]+0.5, bx:ib[0], by:ib[1]});
  var pl=walkNear(5,3); var gt1=walkNear(5,5), gt2=walkNear(6,5);
  setSolid(gt1[0],gt1[1],1); setSolid(gt2[0],gt2[1],1);
  G.decor.push({kind:'plate', x:pl[0]+0.5, y:pl[1]+0.5, gate:[[gt1[0],gt1[1]],[gt2[0],gt2[1]]]});
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(typeof toast==='function') toast('<b>Relic sandbox:</b> all four granted. ⚓ anchor east · ✸ cracked wall north · ❖ lodeblock+plate south. '+(isTouch?'Use the new buttons.':'Keys F / Q / G / C.'),7000);
}

/* ---- boot: build the slow-time vignette + wire touch buttons ---- */
function ensureSlowOverlay(){
  if(document.getElementById('slowOv')) return;
  var ov=document.createElement('div'); ov.id='slowOv';
  ov.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:40;opacity:0;transition:opacity .18s;'+
    'background:radial-gradient(ellipse at center, rgba(80,140,220,0.0) 42%, rgba(40,90,170,0.28) 100%);'+
    'mix-blend-mode:screen;';
  document.body.appendChild(ov);
}
ensureSlowOverlay();
wireRelicButtons();

/* ---- exports (globals, matching the rest of the codebase's style) ---- */
window.tryHook=tryHook; window.tryBomb=tryBomb; window.tryLodestone=tryLodestone; window.trySlowTime=trySlowTime;
window.updateHookTravel=updateHookTravel; window.updateRelics=updateRelics; window.drawRelicDecor=drawRelicDecor;
window.grantHook=grantHook; window.grantBomb=grantBomb; window.grantLodestone=grantLodestone; window.grantSlowTime=grantSlowTime;
window.grantAllRelics=grantAllRelics; window.spawnRelicSandbox=spawnRelicSandbox;

})();
