/* =====================================================================
   CINEMATIC LAYER  (additive, tier-gated)
   -----------------------------------------------------------------------
   A self-contained polish pass in the spirit of js/22-definitive-edition.js:
   it WRAPS the existing render pipeline and never edits the passes above it.
   Everything here is gated behind CFG.cine (a pause-menu toggle) plus the
   engine's own quality tiers - SAFE (minimal-GPU) and LOWFX drop the costlier
   effects, exactly like the rest of the game, so the low-end ladder is intact.

   Adds, on the top tier:
     * time-of-day colour grade (golden dawn, warm dusk, cool night)
     * forked, in-world lightning bolts (the live world only flashed before)
     * two-layer parallax rain + wet-ground sheen + rain ripples
     * gentle drifting snow on the frozen isle
     * footstep dust and shallow-water splashes tied to movement
     * a subtle chromatic-aberration edge fringe on impact / low health
   All fills are separable (source-over / lighter) - no soft-light/saturate
   passes, which is what the GPU-probe notes can hard-crash weak desktops.
   ===================================================================== */
(function(){
'use strict';

/* ---------- settings toggle (pause menu) ---------- */
if(CFG.cine===undefined) CFG.cine=1;
const bloomRow=document.getElementById('cfgBloomOff');
if(bloomRow && bloomRow.closest('.pRow')){
  bloomRow.closest('.pRow').insertAdjacentHTML('afterend',
    '<div class="pRow"><span>Cinematic grade &amp; weather</span>'+
    '<div class="pSeg"><button class="btn" id="cfgCineOn">On</button>'+
    '<button class="btn" id="cfgCineOff">Off</button></div></div>');
  const on=document.getElementById('cfgCineOn'), off=document.getElementById('cfgCineOff');
  if(on) on.onclick=()=>{ CFG.cine=1; saveCfg(); syncCfgUI(); };
  if(off) off.onclick=()=>{ CFG.cine=0; saveCfg(); syncCfgUI(); };
}
if(typeof syncCfgUI==='function'){
  const _sync=syncCfgUI;
  syncCfgUI=function(){
    _sync();
    const on=document.getElementById('cfgCineOn'), off=document.getElementById('cfgCineOff');
    if(on){ on.classList.toggle('on',!!CFG.cine); off.classList.toggle('on',!CFG.cine); }
  };
}

function cineOn(){ return CFG.cine!==0 && !SAFE && G.state==='play' && !G.interior; }
function lerp3(a,b,t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
function rgba(c,a){ return 'rgba('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+','+a.toFixed(3)+')'; }

/* ---------- 1. time-of-day colour grade -------------------------------
   A vertical gradient (warmer sky, cooler ground) whose colour + strength
   ride G.dayT (0=dawn .25=noon .5=dusk .75=midnight). The tutorial isle holds
   a fixed daylight, so it is skipped there. Reads as "a real sky" for one
   cheap linear-gradient fill. */
function timeGrade(){
  if(G.worldId==='isle' || (typeof inDungeon==='function' && inDungeon())) return null;
  const t=G.dayT;
  let top, bot, a;
  if(t<0.08){                                   // dawn: night lifting to gold
    const k=t/0.08;
    top=lerp3([40,44,86],[255,176,96],k); bot=lerp3([24,30,58],[196,150,150],k);
    a=0.20-0.06*k;
  } else if(t<0.40){                             // day: near-clear, faint warmth
    top=[255,246,214]; bot=[236,238,220]; a=0.05;
  } else if(t<0.55){                             // dusk: amber -> rose sunset
    const k=(t-0.40)/0.15;
    top=lerp3([255,222,150],[255,120,86],k); bot=lerp3([236,196,150],[120,70,120],k);
    a=0.08+0.12*Math.sin(Math.min(1,k)*Math.PI);
  } else if(t<0.92){                             // night: cool moonlit blue
    top=[46,66,120]; bot=[16,26,58]; a=0.13;
  } else {                                       // pre-dawn: coldest
    top=[36,50,96]; bot=[14,22,50]; a=0.15;
  }
  return {top,bot,a};
}
function drawTimeGrade(){
  const gr=timeGrade(); if(!gr || gr.a<0.005) return;
  const lg=cx.createLinearGradient(0,0,0,VH);
  lg.addColorStop(0,rgba(gr.top,gr.a));
  lg.addColorStop(1,rgba(gr.bot,gr.a*0.72));
  cx.fillStyle=lg; cx.fillRect(0,0,VW,VH);
}

/* ---------- 2. forked lightning -------------------------------------- */
let _bolt=null, _boltLife=0;
function makeBolt(){
  const x0=VW*(0.15+Math.random()*0.7);
  const pts=[[x0,-12]]; let x=x0, y=-12;
  const segs=8+((Math.random()*4)|0), step=VH*0.62/segs;
  for(let i=0;i<segs;i++){ y+=step*(0.7+Math.random()*0.6); x+=(Math.random()-0.5)*VW*0.10; pts.push([x,y]); }
  const branches=[];
  for(let b=0;b<2;b++){ if(Math.random()<0.6){
    const i=2+((Math.random()*(pts.length-3))|0), br=[pts[i].slice()];
    let bx=pts[i][0], by=pts[i][1];
    for(let k=0;k<3;k++){ bx+=(Math.random()-0.3)*VW*0.09; by+=step*(0.5+Math.random()*0.5); br.push([bx,by]); }
    branches.push(br);
  }}
  return {pts,branches};
}
function strokePoly(pl,w){ cx.beginPath(); cx.moveTo(pl[0][0],pl[0][1]); for(let i=1;i<pl.length;i++) cx.lineTo(pl[i][0],pl[i][1]); cx.lineWidth=w; cx.stroke(); }
function drawBolt(){
  if(!CFG.flash) { _bolt=null; return; }
  const L=(typeof G.lightning==='number')?G.lightning:0;
  if(L>0.42 && !_bolt){ _bolt=makeBolt(); _boltLife=1; }
  if(L<0.05){ _bolt=null; }
  if(!_bolt) return;
  _boltLife=L/0.5;
  const a=Math.max(0,Math.min(1,_boltLife));
  cx.save(); cx.lineCap='round'; cx.lineJoin='round'; cx.globalCompositeOperation='lighter';
  cx.strokeStyle='rgba(150,180,255,'+(0.30*a)+')'; strokePoly(_bolt.pts,7);
  for(const br of _bolt.branches){ cx.strokeStyle='rgba(140,170,250,'+(0.20*a)+')'; strokePoly(br,4); }
  cx.strokeStyle='rgba(240,246,255,'+(0.85*a)+')'; strokePoly(_bolt.pts,2);
  for(const br of _bolt.branches){ cx.strokeStyle='rgba(230,240,255,'+(0.6*a)+')'; strokePoly(br,1.2); }
  cx.restore();
}

/* ---------- 3. rain: far parallax layer + wet sheen + ripples --------- */
let _farDrops=[];
function drawRainExtra(){
  const rain=(WX&&typeof WX.rain==='number')?WX.rain:0;
  if(rain<=0.03 || G.worldId==='frost') return;   // Frozen Isle squalls fall as snow (see drawSnow)
  const drift=(G.worldId==='reach')?0.5:0.18;
  const wantFar=Math.round(rain*70);
  while(_farDrops.length<wantFar) _farDrops.push({x:Math.random()*(VW+80)-40,y:Math.random()*VH,spd:320+Math.random()*160,len:5+Math.random()*4});
  if(_farDrops.length>wantFar) _farDrops.length=wantFar;
  cx.strokeStyle='rgba(170,195,235,'+(0.13*rain)+')'; cx.lineWidth=1; cx.beginPath();
  for(const d of _farDrops){
    d.y+=d.spd*_dt; d.x+=d.spd*drift*_dt;
    if(d.y>VH){ d.y=-14-Math.random()*30; d.x=Math.random()*(VW+80)-40; }
    cx.moveTo(d.x,d.y); cx.lineTo(d.x-d.len*0.18,d.y-d.len);
  }
  cx.stroke();
}

/* ---------- 4. drifting snow (frozen isle) --------------------------- */
let _flakes=[];
function snowStrength(){
  if(G.worldId!=='frost') return 0;
  const rain=(WX&&typeof WX.rain==='number')?WX.rain:0;
  return 0.5+0.5*Math.min(1,rain);          // always a light fall; heavier in a squall
}
const SNOW_PARALLAX=1;                          // 1 = flakes stay pinned to the world; <1 drifts toward screen-locked
function drawSnow(){
  const s=snowStrength(); if(s<=0.02) return;
  const want=Math.round(s*150);
  while(_flakes.length<want) _flakes.push({x:Math.random()*VW,y:Math.random()*VH,r:0.8+Math.random()*1.8,spd:14+Math.random()*30,ph:Math.random()*TAU});
  if(_flakes.length>want) _flakes.length=want;
  cx.fillStyle='rgba(244,249,255,'+(0.72*Math.min(1,s)).toFixed(3)+')';
  // Anchor the flake field to the world by cancelling the camera pan, then wrap
  // each flake back onto the screen so the field is seamless as you walk. A flake
  // stays over the same patch of ground instead of sliding along with the camera.
  const M=4, WW=VW+2*M, HH=VH+2*M;              // wrap span (a little margin so flakes don't pop at the edges)
  const camX=(G.cam?G.cam.x:0)*SNOW_PARALLAX, camY=(G.cam?G.cam.y:0)*SNOW_PARALLAX;
  for(const f of _flakes){
    f.y+=f.spd*_dt; f.x+=Math.sin(G.time*1.3+f.ph)*10*_dt;
    if(f.y>VH){ f.y=-4; f.x=Math.random()*VW; }
    const dx=((f.x-camX+M)%WW+WW)%WW-M, dy=((f.y-camY+M)%HH+HH)%HH-M;
    cx.beginPath(); cx.arc(dx,dy,f.r,0,TAU); cx.fill();
  }
}

/* ---------- 5. footstep dust & shallow-water splashes ---------------- */
let _lpx=null,_lpy=null,_stepAcc=0;
function movementFX(){
  if(!fxOn('particles') || typeof P==='undefined' || P.dead || G.interior){ _lpx=P?P.x:null; _lpy=P?P.y:null; return; }
  if(_lpx===null){ _lpx=P.x; _lpy=P.y; return; }
  const d=Math.hypot(P.x-_lpx,P.y-_lpy); _lpx=P.x; _lpy=P.y;
  if(!P.moving || d<=0){ return; }
  _stepAcc+=d;
  const gap=(P.rollT>0)?0.55:0.42;
  if(_stepAcc<gap) return;
  _stepAcc=0;
  const tt=(typeof tileAt==='function')?tileAt(P.x|0,P.y|0):99;
  if(tt===T.SHALLOW){
    // stepping through the shallows: a splash ring + a couple of droplets
    G.parts.push({x:P.x,y:P.y,vx:0,vy:0,life:0.34,max:0.34,ring:true,color:'rgba(210,236,255,0.6)',size:0.9});
    for(let i=0;i<3;i++) G.parts.push({x:P.x+rnd(-0.1,0.1),y:P.y+rnd(-0.05,0.05),vx:rnd(-0.6,0.6),vy:rnd(-1.1,-0.4),life:0.3,color:'rgba(225,242,255,0.7)',size:1.6});
  } else if(tt>=T.SAND){
    const col = tt===T.SAND?'rgba(226,205,160,0.42)'
      : tt===T.SNOW?'rgba(240,248,255,0.5)'
      : (tt===T.PATH||tt===T.SOIL)?'rgba(150,120,90,0.4)'
      : 'rgba(150,150,150,0.32)';
    for(let i=0;i<2;i++) G.parts.push({x:P.x+rnd(-0.12,0.12),y:P.y,vx:-P.dir.x*rnd(0.2,0.5),vy:-P.dir.y*rnd(0.2,0.5)-0.2,life:0.32,color:col,size:1.8+Math.random()});
  }
}

/* ---------- 6. chromatic-aberration edge fringe (impact / low HP) -----
   No canvas readback (that would stall software rasterisers) - just two
   offset, tinted vignette rings, so the frame edges split red/cyan when you
   are hit, on the lowest sliver of health, or in a hard screen shake. */
let _caR=null,_caC=null,_caKey='';
function drawCA(){
  if(LOWFX || (typeof SOFTCANVAS!=='undefined' && SOFTCANVAS)) return;
  let ca=0;
  if(typeof P!=='undefined' && !P.dead){
    if((P.hurtT||0)>0) ca=Math.max(ca,0.7);
    if(P.hp<P.maxhp*0.25) ca=Math.max(ca,0.35*(1-P.hp/(P.maxhp*0.25)));
  }
  ca=Math.max(ca,Math.min(0.6,(G.shake||0)*0.7));
  if(ca<0.03) return;
  const key=VW+'x'+VH;
  if(_caKey!==key){
    const mk=(col)=>{ const g=cx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.42,VW/2,VH/2,Math.max(VW,VH)*0.72);
      g.addColorStop(0,col+'0)'); g.addColorStop(1,col+'1)'); return g; };
    _caR=mk('rgba(255,40,40,'); _caC=mk('rgba(40,220,255,'); _caKey=key;
  }
  const sh=ca*3.2;
  cx.save(); cx.globalCompositeOperation='lighter'; cx.globalAlpha=0.5*ca;
  cx.translate(sh,0);  cx.fillStyle=_caR; cx.fillRect(-sh,0,VW,VH);
  cx.setTransform(DPR,0,0,DPR,0,0);
  cx.translate(-sh,0); cx.fillStyle=_caC; cx.fillRect(sh,0,VW,VH);
  cx.restore();
}

/* ---------- per-frame driver ----------------------------------------- */
let _lastT=0, _dt=0;
function cinePost(){
  _dt=Math.max(0,Math.min(0.05,(G.time||0)-_lastT)); _lastT=G.time||0;
  if(!cineOn()) return;
  movementFX();                     // spawns into G.parts (drawn next frame, correctly layered)
  cx.save();
  drawTimeGrade();
  if(fxOn('fog')||!LOWFX) drawSnow();
  drawRainExtra();
  drawBolt();
  drawCA();
  cx.globalCompositeOperation='source-over'; cx.globalAlpha=1;
  cx.restore();
}

const _render=render;
render=function(){ _render(); try{ cinePost(); }catch(e){} };

})();
