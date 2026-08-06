/* =====================================================================
   WASHED ASHORE - the wash-up-on-shore prologue cutscene (AAA pass).
   -----------------------------------------------------------------------
   Built on the same self-contained rAF driver as the other overlay cutscenes
   (leviathan / mask / Ashwing bookends): the world is paused, beats advance on
   click, and a full-frame scene is composed to its own overlay canvas. This is
   the game's opening, so the RENDER is pushed hard - a cinematic, layered piece
   rather than the stylised shapes the other cutscenes use:

     * a filmic frame: animated letterbox bars, a slow camera push/drift, a
       per-beat colour grade, vignette, and a fine film grain
     * a live storm sea - parallax swell with foam caps and blown spray, driving
       rain raked by gusting wind, torn scudding cloud in layers, and forked
       lightning that backlights the whole scene and the ship
     * the castaway's ship, a real silhouette - planked hull, a mast with a
       tearing sail that luffs in the wind, rigging, and gimballed lanterns that
       swing with the roll and snuff one by one as the sea takes her
     * the load-bearing beat: a towering CURSED wave, lit from within by violet
       bioluminescence, spectral tendrils reaching from its crest to capsize the
       ship - Vath's hand on the sea, seeded and unexplained
     * a dawn that actually breaks - a banded sky, a rising sun with god-rays and
       bloom, gulls, and a glittering sun-track laid across a calming tide
     * NO drawn people on the shore - the environment and the narration carry the
       castaway. The one figurative anchor is the pale MASK, left half in the wet
       sand where the tide drew back, dawn-lit, the object the whole journey turns
       on (a clean object reads far better here than a hand-drawn body would)
     * whoever is coming for you is never drawn at all - not a figure, not a light -
       the narration alone carries them down the strand

   On its final beat it hands off (onDone) to Maren's first words (startIntro).
   Nothing of the castaway's name or face is revealed - Act I seeds only. There is
   no on-screen title card; the narration names nothing.

   Additive and graceful: if the overlay DOM is missing, it falls straight
   through to onDone, so nothing soft-locks. Everything is plain Canvas2D
   (gradients, paths, one cached grain tile) - no readback, no filters - so it
   stays friendly to the low-end ladder.
   ===================================================================== */
(function(){
'use strict';

/* ---------- scene state ---------- */
const SH = {
  raf:0, prev:0, t:0, running:false, ended:false, started:false, idx:0,
  cv:null, cx:null, W:0, H:0,
  beats:null, onDone:null,
  // eased visual state
  storm:1,     // 1 = full night storm on the strait, 0 = still grey-gold dawn
  ship:1,      // 1 = the castaway's ship rides the swell, 0 = swallowed and gone
  ashore:0,    // 0 = out on the heaving strait, 1 = close on the figure on the sand
  lantern:0,   // 0 = empty shoreline, 1 = a lantern (Maren) come down to the surf
  push:1,      // camera zoom (slow cinematic push-in)
  bars:0,      // letterbox bars, 0 = none, 1 = full cinematic frame
  swell:0,     // 0 = flat sea, 1 = the cursed swell RISEN to full height, taking the ship
  fx:0.5, fy:0.5,  // camera focus point (fraction of frame) the push zooms toward
  // one-shots (decay per frame)
  flash:0, shake:0,
  // lightning
  bolt:null, boltT:0, boltNext:0.8, lit:0,
  // particles
  rain:[], spray:[], motes:[], gulls:[], _macc:0, _sacc:0,
  grain:null,
  _autoTO:null, _titleTO:null,
};

/* Each beat carries the line, the scene-state the visuals ease toward while it is on
   screen, an optional title-card flash, and one-shot punches. A wordless beat
   auto-advances after `hold` ms so the motion can carry it. `bolt:1` forces a
   lightning strike on entry; `focus:[x,y]` re-aims the camera push. `swell:1`
   eases the cursed wave UP to full height (it rises to meet the ship); the next
   beat's `swell:0` lets it recede as the dark closes over. */
const SH_BEATS = [
  // the ship cresting a black swell, the frame closing to letterbox (wordless)
  { who:'', html:'', storm:1, ship:1, ashore:0, bars:1, push:1.04, shake:0.5, bolt:1, hold:950 },
  { who:'', html:'<i>A ship on the night strait, and a storm with no mercy in it. You do not remember boarding her. You do not remember your name.</i>',
    storm:1, ship:1, ashore:0, push:1.06 },
  // a strike splits the dark - the ship heeled hard over, her sail tearing (wordless)
  { who:'', html:'', storm:1, ship:1, ashore:0, push:1.09, bolt:1, shake:0.55, hold:750 },
  // the cursed sea rises and takes her, lanterns snuffed one by one (wordless, the big beat)
  { who:'', html:'', storm:1, ship:0, ashore:0, push:1.13, swell:1, flash:1.0, shake:0.8, hold:1150 },
  { who:'', html:'<i>It was no reef. The water itself rose to meet you - cold and wrong, lit from beneath - and the last of the lanterns was swallowed whole. The dark closed over.</i>',
    storm:1, ship:0, ashore:0, swell:0, push:1.05 },
  // the dark gives way to a breaking dawn on the shore (wordless dissolve)
  { who:'', html:'', storm:0.14, ship:0, ashore:1, push:1.0, fx:0.5, fy:0.5, hold:900 },
  // dawn on the empty strand: the tide has drawn back, the mask left in the sand (wordless)
  { who:'', html:'', storm:0.08, ship:0, ashore:1, push:1.03, hold:750 },
  { who:'', html:'<i>Then - dawn. Warm sand against your cheek, the tide drawing back off you at last. A pale mask lies half in the wet sand within reach - and your hand has already closed on it, before your eyes are even open. You do not know why.</i>',
    storm:0.06, ashore:1, push:1.05 },
  // a slow push onto the mask, catching the first light (wordless)
  { who:'', html:'', storm:0.05, ashore:1, push:1.16, focus:[0.5,0.62], hold:750 },
  { who:'', html:'<i>A light comes bobbing down the shoreline - a lantern, and someone hurrying through the surf toward you. You have washed up on some strange, dark shore.</i>',
    storm:0.05, ashore:1, push:1.04 },
];

/* ---------- driver ---------- */
function shResize(){
  const cv=SH.cv; if(!cv) return;
  const r=cv.getBoundingClientRect();
  const dpr=Math.min(2, window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));
  cv.height=Math.max(1,Math.round(r.height*dpr));
  SH.cx.setTransform(dpr,0,0,dpr,0,0);
  SH.W=r.width; SH.H=r.height;
}
function shMakeGrain(){
  // one small tiled grain patch, stamped with a random offset each frame - a cheap
  // filmic texture with no per-frame noise generation
  try{
    const g=document.createElement('canvas'); g.width=g.height=96;
    const gc=g.getContext('2d'); const id=gc.createImageData(96,96); const d=id.data;
    for(let i=0;i<d.length;i+=4){ const v=(Math.random()*255)|0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=255; }
    gc.putImageData(id,0,0); SH.grain=g;
  }catch(e){ SH.grain=null; }
}
function shPlay(beats, init, onDone){
  const ov=document.getElementById('shOv');
  const cv=document.getElementById('shCv');
  if(!ov||!cv){ if(typeof onDone==='function'){ try{ onDone(); }catch(e){} } return; }  // graceful fallback
  SH.beats=beats; SH.onDone=onDone||null;
  SH.cv=cv; SH.cx=cv.getContext('2d');
  SH.t=0; SH.prev=0; SH.idx=0; SH._macc=0; SH._sacc=0;
  SH.storm=1; SH.ship=1; SH.ashore=0; SH.lantern=0; SH.push=1; SH.bars=0; SH.swell=0; SH.fx=0.5; SH.fy=0.5;
  SH.flash=0; SH.shake=0; SH.bolt=null; SH.boltT=0; SH.boltNext=0.8; SH.lit=0;
  if(init) Object.assign(SH, init);
  SH.rain.length=0; SH.spray.length=0; SH.motes.length=0; SH.gulls.length=0;
  if(!SH.grain) shMakeGrain();
  SH.ended=false; SH.started=false; SH.running=true;
  const title=document.getElementById('shTitle'), sub=document.getElementById('shSub');
  if(sub) sub.classList.remove('show'); if(title) title.classList.remove('show');
  ov.style.display='flex';
  if(typeof G!=='undefined'){ G.paused=true; G._credits=1; }
  if(typeof cinematic==='function') cinematic(true);
  shResize();
  window.addEventListener('resize', shResize);
  setTimeout(()=>shShow(0), 350);   // brief fade-in, then the first beat
  ov.onclick=()=>{ if(SH.ended || !SH.started) return; shNext(); };
  cancelAnimationFrame(SH.raf);
  SH.raf=requestAnimationFrame(shLoop);
}
function shShow(i){
  const b=SH.beats[i]; if(!b) return;
  SH.idx=i; SH.started=true;
  clearTimeout(SH._autoTO);
  if(b.flash)   SH.flash=Math.max(SH.flash, b.flash);
  if(b.shake)   SH.shake=Math.max(SH.shake, b.shake);
  if(b.bolt)    shSpawnBolt(true);
  if(b.swell){  if(typeof Snd!=='undefined'&&Snd.magic) Snd.magic(); }   // the curse takes the sea
  if(b.focus){  SH._fxT=b.focus[0]; SH._fyT=b.focus[1]; } else { SH._fxT=(b.fx!=null?b.fx:0.5); SH._fyT=(b.fy!=null?b.fy:0.5); }
  const who=document.getElementById('shWho'), line=document.getElementById('shLine');
  if(who) who.textContent=b.who||'';
  if(line) line.innerHTML=b.html||'';
  const sub=document.getElementById('shSub');
  const wordless=!(b.html||'').replace(/<[^>]*>/g,'').trim();
  if(wordless){
    if(sub) sub.classList.remove('show');
    SH._autoTO=setTimeout(()=>shNext(), b.hold||800);
  } else {
    const tap=document.getElementById('shTap');
    if(tap) tap.textContent=(i>=SH.beats.length-1)?'wake on the shore ›':'click to continue ›';
    if(sub){ sub.classList.remove('show'); void sub.offsetWidth; sub.classList.add('show'); }
  }
  if(b.title){
    const t=document.getElementById('shTitle'), tt=document.getElementById('shTitleT');
    if(t&&tt){ tt.textContent=b.title; t.classList.remove('show'); void t.offsetWidth;
      t.classList.add('show'); clearTimeout(SH._titleTO);
      SH._titleTO=setTimeout(()=>t.classList.remove('show'), 2800); }
  }
}
function shNext(){
  clearTimeout(SH._autoTO);
  if(SH.idx>=SH.beats.length-1){ shFinish(); return; }
  const sub=document.getElementById('shSub'); if(sub) sub.classList.remove('show');
  setTimeout(()=>shShow(SH.idx+1), 200);
}
function shFinish(){
  if(SH.ended) return;
  SH.ended=true;
  const sub=document.getElementById('shSub'); if(sub) sub.classList.remove('show');
  const title=document.getElementById('shTitle'); if(title) title.classList.remove('show');
  setTimeout(shEnd, 500);   // a beat, then hand off to Maren's first words
}
function shEnd(){
  SH.running=false; cancelAnimationFrame(SH.raf);
  window.removeEventListener('resize', shResize);
  const ov=document.getElementById('shOv'); if(ov){ ov.style.display='none'; ov.onclick=null; }
  if(typeof G!=='undefined'){ G._credits=0; G.paused=false; }   // hand back a live world for the intro dialogue
  if(typeof cinematic==='function') cinematic(false);
  const done=SH.onDone; SH.onDone=null;
  if(typeof done==='function'){ try{ done(); }catch(e){} }
}
function shLoop(ts){
  if(!SH.running) return;
  if(!SH.prev) SH.prev=ts;
  let dt=(ts-SH.prev)/1000; SH.prev=ts;
  if(dt>0.05) dt=0.05;
  SH.t+=dt;
  const b=SH.beats[SH.idx]||SH.beats[0];
  const e=(cur,tgt,k)=>cur+(tgt-cur)*Math.min(1,dt*k);
  SH.storm   = e(SH.storm,   b.storm!=null?b.storm:SH.storm,     1.5);
  SH.ship    = e(SH.ship,    b.ship!=null?b.ship:SH.ship,        1.5);
  SH.ashore  = e(SH.ashore,  b.ashore!=null?b.ashore:SH.ashore,  1.7);
  SH.lantern = e(SH.lantern, b.lantern!=null?b.lantern:SH.lantern,1.6);
  SH.push    = e(SH.push,    b.push!=null?b.push:SH.push,         1.2);
  SH.bars    = e(SH.bars,    b.bars!=null?b.bars:SH.bars,         2.2);
  // the cursed swell eases UP toward its target (it RISES to take the ship), and
  // eases back down on the following beat as the dark closes over
  SH.swell   = e(SH.swell,   b.swell!=null?b.swell:SH.swell,      1.5);
  SH.fx      = e(SH.fx,      SH._fxT!=null?SH._fxT:0.5,           1.4);
  SH.fy      = e(SH.fy,      SH._fyT!=null?SH._fyT:0.5,           1.4);
  SH.flash = Math.max(0, SH.flash - dt*2.4);
  SH.shake = Math.max(0, SH.shake*(1-SH.ashore*0.6) - dt*1.6);
  shLightning(dt);
  shParticles(dt);
  shDraw();
  SH.raf=requestAnimationFrame(shLoop);
}

/* ---------- lightning ---------- */
function shSpawnBolt(force){
  const W=SH.W||960, H=SH.H||600, horizon=seaY();
  const x0=W*(0.2+Math.random()*0.6);
  const pts=[[x0,-10]]; let x=x0,y=-10;
  const reach=horizon*(0.7+Math.random()*0.3);
  const segs=7+((Math.random()*4)|0), step=(reach+10)/segs;
  for(let i=0;i<segs;i++){ y+=step*(0.7+Math.random()*0.6); x+=(Math.random()-0.5)*W*0.12; pts.push([x,y]); }
  const branches=[];
  for(let bcount=0;bcount<2;bcount++){ if(Math.random()<0.6){
    const i=2+((Math.random()*(pts.length-3))|0); const br=[pts[i].slice()];
    let bx=pts[i][0], by=pts[i][1];
    for(let k=0;k<3;k++){ bx+=(Math.random()-0.3)*W*0.1; by+=step*(0.5+Math.random()*0.5); br.push([bx,by]); }
    branches.push(br);
  }}
  SH.bolt={pts, branches, life:1};
  SH.lit=Math.max(SH.lit, force?1:0.8);
  if(typeof Snd!=='undefined' && Snd.boom) try{ Snd.boom(); }catch(e){}
}
function shLightning(dt){
  SH.lit=Math.max(0, SH.lit - dt*3.2);
  if(SH.bolt){ SH.bolt.life-=dt*3.6; if(SH.bolt.life<=0) SH.bolt=null; }
  if(SH.storm>0.45 && SH.ashore<0.4){
    SH.boltT+=dt;
    if(SH.boltT>SH.boltNext){ SH.boltT=0; SH.boltNext=rnd(1.8,4.0)/Math.max(0.4,SH.storm); shSpawnBolt(false); }
  }
}
function shDrawBolt(cx){
  if(!SH.bolt) return;
  const a=Math.max(0,Math.min(1,SH.bolt.life));
  cx.save(); cx.globalCompositeOperation='lighter'; cx.lineCap='round'; cx.lineJoin='round';
  const strokePoly=(pl,w,col)=>{ cx.strokeStyle=col; cx.lineWidth=w; cx.beginPath();
    cx.moveTo(pl[0][0],pl[0][1]); for(let i=1;i<pl.length;i++) cx.lineTo(pl[i][0],pl[i][1]); cx.stroke(); };
  strokePoly(SH.bolt.pts,7,'rgba(150,180,255,'+(0.28*a)+')');
  for(const br of SH.bolt.branches) strokePoly(br,4,'rgba(140,170,250,'+(0.20*a)+')');
  strokePoly(SH.bolt.pts,2,'rgba(240,246,255,'+(0.9*a)+')');
  for(const br of SH.bolt.branches) strokePoly(br,1.2,'rgba(230,240,255,'+(0.65*a)+')');
  cx.restore();
}

/* ---------- particles ---------- */
function shParticles(dt){
  const W=SH.W, H=SH.H, horizon=seaY();
  // driving rain, thinning as the storm eases; raked by a gusting wind
  const gust=0.28+0.14*Math.sin(SH.t*0.7);
  const want=Math.round(SH.storm*110);
  while(SH.rain.length<want) SH.rain.push({x:Math.random()*(W+120)-60,y:Math.random()*H,spd:560+Math.random()*300,len:10+Math.random()*8});
  if(SH.rain.length>want) SH.rain.length=want;
  for(const d of SH.rain){ d.y+=d.spd*dt; d.x+=d.spd*gust*dt; if(d.y>H){ d.y=-14-Math.random()*30; d.x=Math.random()*(W+120)-60; } }
  // blown spray off the wave crests near the ship in the storm
  if(SH.storm>0.4 && SH.ashore<0.5){
    SH._sacc+=dt*26*SH.storm; let n=Math.floor(SH._sacc); SH._sacc-=n; if(n>3) n=3;
    for(let i=0;i<n;i++){ SH.spray.push({x:W*(0.32+Math.random()*0.36), y:horizon+rnd(-6,10),
      vx:rnd(30,120), vy:rnd(-120,-40), life:1, size:rnd(1.2,3)}); }
  }
  for(const s of SH.spray){ s.x+=s.vx*dt; s.y+=s.vy*dt; s.vy+=180*dt; s.life-=dt*0.9; }
  SH.spray=SH.spray.filter(s=>s.life>0);
  // the cursed swell's cold violet motes, boiling UP off the wave face as it rises
  if(SH.swell>0.05){
    const rx=W*0.5, ry=horizon+8;
    SH._macc+=dt*46*SH.swell; let n=Math.floor(SH._macc); SH._macc-=n; if(n>5) n=5;
    for(let i=0;i<n;i++){ const a=-Math.PI*0.5+rnd(-1.0,1.0), sp=rnd(90,300);
      SH.motes.push({x:rx+rnd(-60,60), y:ry, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1,
        col:Math.random()<0.5?'150,110,225':'175,205,235', size:rnd(1.6,4.4)}); }
  }
  for(const m of SH.motes){ m.x+=m.vx*dt; m.y+=m.vy*dt; m.vy+=64*dt; m.life-=dt*0.85; }
  SH.motes=SH.motes.filter(m=>m.life>0);
  // gulls wheeling once the dawn is up
  if(SH.storm<0.35 && SH.ashore>0.5 && SH.gulls.length<4 && Math.random()<0.02*dt*60){
    SH.gulls.push({x:W*rnd(0.2,0.8), y:seaY()*rnd(0.25,0.6), vx:rnd(8,20)*(Math.random()<0.5?-1:1), ph:Math.random()*TAU});
  }
  for(const g of SH.gulls){ g.x+=g.vx*dt; g.ph+=dt*6; if(g.x<-20) g.x=W+20; if(g.x>W+20) g.x=-20; }
}

/* ---------- draw ---------- */
function seaY(){ return SH.H*0.56; }                  // the waterline / horizon
function beachY(){ return SH.H*0.60; }                // where the wet sand meets the surf when ashore

function shDraw(){
  const cx=SH.cx, W=SH.W, H=SH.H, t=SH.t; if(!cx||!W) return;
  const storm=SH.storm, ashore=SH.ashore, horizon=seaY();

  cx.clearRect(0,0,W,H);
  cx.save();

  // --- camera: slow push toward the focus point, plus a gentle drift and shake ---
  const sh=SH.shake, ox=(Math.random()*2-1)*sh*9, oy=(Math.random()*2-1)*sh*9;
  const drift=Math.sin(t*0.25)*4*(0.4+storm*0.6);
  const z=SH.push, cxp=SH.fx*W, cyp=SH.fy*H;
  cx.translate(ox+drift, oy);
  cx.translate(cxp,cyp); cx.scale(z,z); cx.translate(-cxp,-cyp);

  // --- SKY ---
  shSky(cx,W,H,horizon,t,storm,ashore);
  // lightning backlight wash over the whole sky
  if(SH.lit>0.02){ cx.save(); cx.globalCompositeOperation='lighter';
    cx.fillStyle='rgba(150,175,225,'+(0.22*SH.lit).toFixed(3)+')'; cx.fillRect(-40,-40,W+80,horizon+60); cx.restore(); }
  shDrawBolt(cx);

  // --- SEA ---
  shOcean(cx,W,H,horizon,t,storm,ashore);

  // --- the castaway's ship, pitching on the swell (fades as we come ashore) ---
  if(SH.ship>0.02 && ashore<0.9) shShip(cx,W,H,horizon,t,SH.ship,(1-ashore),storm);

  // --- the cursed wave rising to take her ---
  if(SH.swell>0.03) shCursedWave(cx,W,H,horizon,t,SH.swell);

  // --- the shore foreground: wet sand, surf, debris, and the pale mask in the sand ---
  if(ashore>0.02) shShore(cx,W,H,t,ashore,SH.lantern,storm);

  // --- weather: rain over everything while the storm holds ---
  if(storm>0.03){ cx.strokeStyle='rgba(205,218,238,'+(0.24*storm).toFixed(3)+')'; cx.lineWidth=1.2; cx.beginPath();
    const gust=0.28+0.14*Math.sin(t*0.7);
    for(const d of SH.rain){ cx.moveTo(d.x,d.y); cx.lineTo(d.x-d.len*gust,d.y-d.len); }
    cx.stroke(); }
  // blown spray
  if(SH.spray.length){ cx.save(); cx.globalCompositeOperation='lighter';
    for(const s of SH.spray){ cx.globalAlpha=Math.max(0,s.life)*0.8; cx.fillStyle='rgba(220,235,250,0.9)';
      cx.beginPath(); cx.arc(s.x,s.y,s.size,0,TAU); cx.fill(); }
    cx.globalAlpha=1; cx.restore(); }
  // violet cursed motes
  if(SH.motes.length){ cx.save(); cx.globalCompositeOperation='lighter';
    for(const m of SH.motes){ cx.globalAlpha=Math.max(0,Math.min(1,m.life)); cx.fillStyle='rgba('+m.col+',0.9)';
      cx.beginPath(); cx.arc(m.x,m.y,m.size,0,TAU); cx.fill(); }
    cx.globalAlpha=1; cx.restore(); }

  // --- full-frame flash (violet as the sea takes the ship; warm as dawn breaks) ---
  if(SH.flash>0.01){ const violet=storm>0.5;
    cx.fillStyle=(violet?'rgba(150,110,220,':'rgba(255,244,225,')+(0.42*SH.flash).toFixed(3)+')'; cx.fillRect(-40,-40,W+80,H+80); }

  cx.restore();  // camera

  // --- post: colour grade, vignette, grain, letterbox (screen-space, no camera) ---
  shGrade(cx,W,H,storm,ashore);
  shVignette(cx,W,H,storm);
  shGrain(cx,W,H,storm);
  shLetterbox(cx,W,H,SH.bars);
}

/* ---- sky: banded storm bruise easing to a god-rayed dawn ---- */
function shSky(cx,W,H,horizon,t,storm,ashore){
  const sky=cx.createLinearGradient(0,-40,0,horizon);
  sky.addColorStop(0,   mixHex('#8fb0c4','#070b16', storm));                     // dawn zenith <- storm black
  sky.addColorStop(0.45,mixHex('#ccb9a6','#0e0c22', Math.min(1,storm*0.95)));    // pale band <- bruised dark
  sky.addColorStop(0.78,mixHex('#f4c59a','#1a1330', Math.min(1,storm*0.88)));    // warm dawn <- violet murk
  sky.addColorStop(1,   mixHex('#ffd9a6','#241a38', Math.min(1,storm*0.8)));     // horizon glow
  cx.fillStyle=sky; cx.fillRect(-40,-40,W+80,horizon+60);

  const dawn=1-Math.min(1,storm);
  // the rising sun with bloom + long god-rays, once the storm clears
  if(dawn>0.05){
    const sx=W*0.63, sy=horizon*0.60, sr=Math.min(W,H)*0.052;
    cx.save(); cx.globalCompositeOperation='lighter';
    // god-rays
    cx.save(); cx.translate(sx,sy);
    for(let i=0;i<10;i++){ const a=i/10*TAU + t*0.03, len=Math.min(W,H)*0.6*(0.6+0.4*Math.sin(i*1.7));
      const rg=cx.createLinearGradient(0,0,Math.cos(a)*len,Math.sin(a)*len);
      rg.addColorStop(0,'rgba(255,232,190,'+(0.10*dawn).toFixed(3)+')'); rg.addColorStop(1,'rgba(255,232,190,0)');
      cx.strokeStyle=rg; cx.lineWidth=10+8*Math.sin(i*2.1+t*0.5); cx.beginPath(); cx.moveTo(0,0); cx.lineTo(Math.cos(a)*len,Math.sin(a)*len); cx.stroke(); }
    cx.restore();
    // bloom
    const bg=cx.createRadialGradient(sx,sy,2,sx,sy,sr*5.5);
    bg.addColorStop(0,'rgba(255,236,200,'+(0.7*dawn).toFixed(3)+')'); bg.addColorStop(1,'rgba(255,236,200,0)');
    cx.fillStyle=bg; cx.beginPath(); cx.arc(sx,sy,sr*5.5,0,TAU); cx.fill();
    // disc
    cx.globalCompositeOperation='source-over';
    cx.fillStyle='rgba(255,244,222,'+(0.85*dawn).toFixed(3)+')'; cx.beginPath(); cx.arc(sx,sy,sr,0,TAU); cx.fill();
    cx.restore();
  }

  // layered scudding cloud - two parallax bands, torn and blowing across
  const cloudA = storm>0.06 ? storm : dawn*0.5;   // storm cloud, or a few dawn clouds catching light
  const warm = dawn>0.4;
  for(let layer=0;layer<2;layer++){
    const cy=horizon*(0.16+layer*0.16), spd=(16+layer*10), h=(26-layer*6);
    const off=((t*spd)%(W+320))-160;
    cx.save(); cx.globalAlpha=cloudA*(0.55-layer*0.12);
    cx.fillStyle = warm ? (layer? 'rgba(255,200,160,0.5)':'rgba(255,180,150,0.55)') : 'rgba(10,12,24,0.6)';
    for(let k=-1;k<3;k++){ const bx=off + k*(W*0.6);
      cx.beginPath(); cx.ellipse(bx, cy, 150-layer*24, h, 0, 0, TAU);
      cx.ellipse(bx+W*0.22, cy+7, 120-layer*20, h*0.8, 0, 0, TAU);
      cx.ellipse(bx-W*0.2, cy+4, 100-layer*18, h*0.7, 0, 0, TAU); cx.fill(); }
    cx.restore();
  }

  // gulls (dawn)
  if(SH.gulls.length){ cx.save(); cx.strokeStyle='rgba(40,44,54,'+(0.5*dawn).toFixed(3)+')'; cx.lineWidth=2; cx.lineCap='round';
    for(const g of SH.gulls){ const w=6+2*Math.sin(g.ph), dir=g.vx<0?-1:1;
      cx.beginPath(); cx.moveTo(g.x-8*dir, g.y); cx.quadraticCurveTo(g.x-2*dir, g.y-w, g.x, g.y);
      cx.quadraticCurveTo(g.x+2*dir, g.y-w, g.x+8*dir, g.y); cx.stroke(); }
    cx.restore(); }
}

/* ---- ocean: parallax swell with foam caps in the storm; a glittering calm at dawn ---- */
function shOcean(cx,W,H,horizon,t,storm,ashore){
  const bottom = ashore>0.02 ? beachY()+6 : H+4;   // when ashore, the sea only reaches the surf line
  const sea=cx.createLinearGradient(0,horizon,0,bottom);
  sea.addColorStop(0, mixHex('#6a8a94','#121a2c', storm));
  sea.addColorStop(0.5, mixHex('#4d6f79','#0d1626', storm));
  sea.addColorStop(1, mixHex('#33525d','#080f1e', Math.min(1,storm*0.9)));
  cx.fillStyle=sea; cx.fillRect(-40,horizon,W+80,bottom-horizon+2);

  const dawn=1-Math.min(1,storm);
  // the sun's glitter track laid on the calming water
  if(dawn>0.1 && ashore<0.9){
    const sx=W*0.63; cx.save(); cx.globalCompositeOperation='lighter';
    for(let i=0;i<26;i++){ const p=i/26, y=horizon+ (bottom-horizon)*p*p + 4;
      const w=(6+p*70), a=0.16*dawn*(1-p*0.5)*(0.5+0.5*Math.sin(i*3+t*2));
      cx.fillStyle='rgba(255,236,200,'+a.toFixed(3)+')';
      cx.beginPath(); cx.ellipse(sx+Math.sin(i*1.3+t)*10, y, w, 1.6+p*2, 0, 0, TAU); cx.fill(); }
    cx.restore();
  }

  // rolling swell lines with foam caps; big and violent in the storm, gentle at dawn
  const rows=9, amp=storm*12+0.8;
  for(let i=0;i<rows;i++){
    const p=i/(rows-1), y=horizon + (bottom-horizon)*p*p*0.96 + 4;
    const a=(0.14+0.10*storm)*(1-p*0.45);
    // the swell line
    cx.strokeStyle='rgba('+(storm>0.5?'150,120,190':'200,222,230')+','+a.toFixed(3)+')';
    cx.lineWidth=1.4+p*1.2; cx.beginPath();
    let prevY=y;
    for(let x=-20;x<=W+20;x+=12){
      const yy=y + Math.sin(x*0.02 + t*(1.3+p) + i)*amp*(0.4+p) + Math.sin(x*0.05 - t*0.8)*amp*0.3*p;
      x===-20?cx.moveTo(x,yy):cx.lineTo(x,yy); prevY=yy;
    }
    cx.stroke();
    // foam caps on the nearer, bigger swell in the storm
    if(storm>0.35 && p>0.4){ cx.fillStyle='rgba(226,238,244,'+(0.5*storm*p).toFixed(3)+')';
      for(let x=-20+((i*37)%40);x<=W+20;x+=64){
        const yy=y + Math.sin(x*0.02 + t*(1.3+p) + i)*amp*(0.4+p);
        cx.beginPath(); cx.ellipse(x,yy,3.5+p*3,1.4+p,0,0,TAU); cx.fill(); }
    }
  }
}

/* ---- the castaway's ship: a real silhouette, pitching and heeling; taken by the sea ---- */
function shShip(cx,W,H,horizon,t,pres,onwater,storm){
  const sx=W*0.5;
  const swell=Math.sin(t*1.1);
  // heels harder as the storm peaks and as she is taken (pres -> 0 tips her right over)
  const heel = swell*0.10*storm + (1-pres)*1.15;
  const pitch = swell*10*storm;
  const sink=(1-pres)*70;
  const scale=Math.min(W,H)/360*1.15;
  cx.save();
  cx.globalAlpha=Math.min(1,onwater)*Math.min(1,pres*1.5);
  cx.translate(sx, horizon-10+pitch+sink);
  cx.rotate(heel);
  cx.scale(scale,scale);

  const OUT='rgba(8,10,16,0.9)';
  // --- hull: planked, with a lighter upper strake ---
  cx.fillStyle='#1c1610';
  cx.beginPath();
  cx.moveTo(-52,-8);
  cx.lineTo(52,-8);
  cx.quadraticCurveTo(58,-2, 46,10);         // raked stern
  cx.quadraticCurveTo(18,20,-6,20);
  cx.quadraticCurveTo(-34,20,-52,4);         // curved bow
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
  // upper strake highlight
  cx.strokeStyle='rgba(120,104,80,0.35)'; cx.lineWidth=2;
  cx.beginPath(); cx.moveTo(-50,-6); cx.lineTo(50,-6); cx.stroke();
  // planking
  cx.strokeStyle='rgba(60,50,36,0.5)'; cx.lineWidth=1;
  for(const py of [0,6,12]){ cx.beginPath(); cx.moveTo(-46,py); cx.quadraticCurveTo(0,py+3,44,py-1); cx.stroke(); }
  // a small stern castle
  cx.fillStyle='#241c14'; cx.beginPath(); cx.moveTo(30,-8); cx.lineTo(50,-8); cx.lineTo(48,-20); cx.lineTo(34,-20); cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
  // bowsprit
  cx.strokeStyle='#241c14'; cx.lineWidth=2.4; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(-48,-2); cx.lineTo(-72,-12); cx.stroke();

  // --- mast, yard, torn sail luffing in the wind ---
  cx.strokeStyle='#2a2016'; cx.lineWidth=3.4;
  cx.beginPath(); cx.moveTo(-2,-8); cx.lineTo(2,-78); cx.stroke();      // mast
  cx.lineWidth=2.2; cx.beginPath(); cx.moveTo(-22,-58); cx.lineTo(26,-62); cx.stroke();  // yard
  // rigging stays
  cx.strokeStyle='rgba(40,32,22,0.7)'; cx.lineWidth=1;
  cx.beginPath(); cx.moveTo(2,-78); cx.lineTo(-48,-4); cx.moveTo(2,-78); cx.lineTo(48,-6); cx.stroke();
  // the sail - a quad whose free leech flaps; a torn corner
  const luff=Math.sin(t*6)*4 + Math.sin(t*11)*2;
  cx.fillStyle='rgba(206,196,176,0.62)';
  cx.beginPath();
  cx.moveTo(-20,-58);
  cx.quadraticCurveTo(-30+luff,-40, -24+luff*0.6,-20);              // free leech, luffing
  cx.lineTo(-2,-24);
  cx.quadraticCurveTo(6,-42, 24,-60);                              // attached to yard
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(150,142,124,0.5)'; cx.lineWidth=1; cx.stroke();
  // a ragged tear flapping off the foot
  cx.fillStyle='rgba(196,186,166,0.5)';
  cx.beginPath(); cx.moveTo(-24+luff*0.6,-20); cx.lineTo(-30+luff,-8); cx.lineTo(-18,-16); cx.closePath(); cx.fill();

  // --- gimballed lanterns, swinging with the roll, snuffing as she goes under ---
  cx.save(); cx.rotate(-heel*0.8);   // gimbals keep them near-plumb
  const lit = Math.max(0, pres*1.2-0.1);
  for(const [lx,ly,ph] of [[-34,-6,0],[40,-10,1.4],[6,-70,2.6]]){
    const g = Math.max(0, lit - (ph>2?0.35:0) - (ph>1?0.15:0)) * (0.7+0.3*Math.sin(t*4+ph));
    if(g<=0.02) continue;
    cx.save(); cx.globalCompositeOperation='lighter';
    const lg=cx.createRadialGradient(lx,ly,1,lx,ly,22);
    lg.addColorStop(0,'rgba(255,198,112,'+(0.85*g).toFixed(3)+')'); lg.addColorStop(1,'rgba(255,198,112,0)');
    cx.fillStyle=lg; cx.beginPath(); cx.arc(lx,ly,22,0,TAU); cx.fill(); cx.restore();
    cx.fillStyle='rgba(255,226,150,'+g.toFixed(3)+')'; cx.beginPath(); cx.arc(lx,ly,1.8,0,TAU); cx.fill();
  }
  cx.restore();

  cx.restore();
  cx.lineCap='butt';
}

/* ---- the cursed wave: a towering wall lit from within, spectral tendrils reaching ---- */
function shCursedWave(cx,W,H,horizon,t,r){
  const rise=easeOut(r);                  // 0 = flat sea, 1 = the wall at full height (r is the rising swell)
  const cxm=W*0.5, baseY=horizon+10, topY=horizon - H*0.5*rise;
  cx.save();
  // the dark wall of water
  cx.beginPath();
  cx.moveTo(cxm-W*0.5, baseY);
  cx.quadraticCurveTo(cxm-W*0.28, topY+40*rise, cxm-W*0.1, topY+10);
  cx.quadraticCurveTo(cxm, topY-24*rise, cxm+W*0.12, topY+14);      // the curling crest
  cx.quadraticCurveTo(cxm+W*0.3, topY+50*rise, cxm+W*0.5, baseY);
  cx.closePath();
  const wg=cx.createLinearGradient(0,topY,0,baseY);
  wg.addColorStop(0,'#20304a'); wg.addColorStop(0.5,'#101a30'); wg.addColorStop(1,'#0a1120');
  cx.fillStyle=wg; cx.fill();
  // violet bioluminescence glowing up through the water
  cx.save(); cx.clip(); cx.globalCompositeOperation='lighter';
  const bg=cx.createRadialGradient(cxm,baseY,10,cxm,baseY,H*0.7*rise+40);
  bg.addColorStop(0,'rgba(150,90,235,'+(0.5*rise).toFixed(3)+')');
  bg.addColorStop(0.5,'rgba(120,70,210,'+(0.25*rise).toFixed(3)+')');
  bg.addColorStop(1,'rgba(120,70,210,0)');
  cx.fillStyle=bg; cx.fillRect(0,topY-20,W,baseY-topY+40);
  // veins of light climbing the wave face
  cx.strokeStyle='rgba(190,140,255,'+(0.4*rise).toFixed(3)+')'; cx.lineWidth=2;
  for(let i=0;i<5;i++){ const x=cxm+(i-2)*W*0.09; cx.beginPath(); cx.moveTo(x,baseY);
    cx.quadraticCurveTo(x+Math.sin(i+t*2)*24, (baseY+topY)/2, x+Math.sin(i*2+t)*16, topY+30); cx.stroke(); }
  cx.restore();
  // foam exploding along the curling crest
  cx.fillStyle='rgba(224,236,246,'+(0.7*rise).toFixed(3)+')';
  for(let x=cxm-W*0.16;x<cxm+W*0.16;x+=14){ const yy=topY+8+Math.sin(x*0.05+t*3)*8;
    cx.beginPath(); cx.arc(x,yy,rnd(2,5),0,TAU); cx.fill(); }
  // spectral tendrils / reaching hands of light rising from the crest
  cx.save(); cx.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){ const bx=cxm+(i-1.5)*W*0.11, sway=Math.sin(t*2+i)*20;
    const h=H*0.3*rise*(0.7+0.3*Math.sin(i*1.7));
    const tg=cx.createLinearGradient(bx,topY,bx+sway,topY-h);
    tg.addColorStop(0,'rgba(180,130,255,'+(0.5*rise).toFixed(3)+')'); tg.addColorStop(1,'rgba(180,130,255,0)');
    cx.strokeStyle=tg; cx.lineWidth=6; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(bx,topY+16); cx.quadraticCurveTo(bx+sway*0.5,topY-h*0.5, bx+sway,topY-h); cx.stroke();
    // three finger-splits at the tip
    for(const d of [-6,0,6]){ cx.beginPath(); cx.moveTo(bx+sway,topY-h);
      cx.lineTo(bx+sway+d,topY-h-14*rise); cx.stroke(); }
  }
  cx.restore();
  cx.restore();
}

/* ---- the wet dawn shore: sand, surf, wreck debris, the mask, an approaching light ---- */
function shShore(cx,W,H,t,amt,lantern,storm){
  const by=beachY();
  cx.save(); cx.globalAlpha=Math.min(1,amt);
  const dawn=1-Math.min(1,storm);

  // wet sand, warming from storm-grey to dawn gold, with a reflective sheen up top
  const g2=cx.createLinearGradient(0,by,0,H);
  g2.addColorStop(0, mixHex('#6a6360','#c3aa82', dawn));
  g2.addColorStop(0.35, mixHex('#5a544f','#b39a72', dawn));
  g2.addColorStop(1, mixHex('#413d39','#8a7656', dawn));
  cx.fillStyle=g2;
  cx.beginPath(); cx.moveTo(-20,by+10);
  for(let x=-20;x<=W+20;x+=34){ cx.lineTo(x, by + Math.sin(x*0.012+1)*7 + 8); }
  cx.lineTo(W+20,H); cx.lineTo(-20,H); cx.closePath(); cx.fill();

  // a mirror-sheen band of wet sand just below the surf reflecting the sky
  cx.save(); cx.globalCompositeOperation='lighter';
  const sheen=cx.createLinearGradient(0,by+8,0,by+52);
  sheen.addColorStop(0,'rgba(255,226,190,'+(0.16*dawn).toFixed(3)+')'); sheen.addColorStop(1,'rgba(255,226,190,0)');
  cx.fillStyle=sheen; cx.fillRect(-20,by+8,W+40,46); cx.restore();

  // the surf: layered foam edges washing up and sliding back
  for(let l=0;l<2;l++){
    const foam=by + 4 + l*10 + Math.sin(t*0.9 + l)*4;
    cx.fillStyle='rgba(230,240,244,'+((l?0.10:0.2)).toFixed(3)+')';
    cx.beginPath(); cx.moveTo(-20,foam);
    for(let x=-20;x<=W+20;x+=10){ cx.lineTo(x, foam + Math.sin(x*0.05 + t*1.4 + l)*3 + Math.sin(x*0.13)*2); }
    cx.lineTo(W+20,by+30); cx.lineTo(-20,by+30); cx.closePath(); cx.fill();
    // the lacy leading foam line
    cx.strokeStyle='rgba(244,249,250,'+((l?0.35:0.6)).toFixed(3)+')'; cx.lineWidth=2;
    cx.beginPath();
    for(let x=-20;x<=W+20;x+=8){ const yy=foam + Math.sin(x*0.05 + t*1.4 + l)*3 + Math.sin(x*0.13)*2; x===-20?cx.moveTo(x,yy):cx.lineTo(x,yy); }
    cx.stroke();
  }

  // a piece of wreck washed up - a broken plank half in the sand (a little depth + story)
  cx.save(); cx.translate(W*0.80, by+58); cx.rotate(-0.22);
  cx.fillStyle=mixHex('#2a231a','#4a3c28',dawn);
  cx.fillRect(-46,-5,92,10);
  cx.strokeStyle='rgba(20,16,10,0.5)'; cx.lineWidth=1; cx.strokeRect(-46,-5,92,10);
  cx.fillStyle='rgba(20,16,10,0.4)'; cx.fillRect(-46,3,92,3);   // wet shadow line
  cx.restore();

  // --- the pale mask, left half in the wet sand where the tide drew back ---
  // (no figure: the environment and the narration carry the castaway. An object
  //  reads far cleaner than a hand-drawn body here, and the mask is the one bright
  //  anchor - the thing the whole journey turns on.)
  shMaskInSand(cx,W,H,t,dawn);

  // --- someone coming for you is carried by the narration alone: no drawn light, no body ---

  cx.restore();
}

/* ---- the pale mask, left half in the wet sand where the tide drew back ----
   No figure - just the object. It sits high on the sand (above the caption plate),
   sunk a little into the tideline, dawn-lit, with a wet-sheen reflection and a long
   soft shadow. This is the one bright anchor of the shore. */
function shMaskInSand(cx,W,H,t,dawn){
  const cxm=W*0.5, cym=H*0.63, s=Math.min(W,H)/360*1.7;
  cx.save(); cx.translate(cxm,cym); cx.rotate(-0.16);

  // the wet-dark patch of sand the tide left around it
  cx.fillStyle='rgba(28,24,18,0.30)';
  cx.beginPath(); cx.ellipse(0, 8*s, 26*s, 9*s, 0, 0, TAU); cx.fill();
  // a long, soft dawn shadow thrown up the beach
  if(dawn>0.08){ cx.save(); cx.fillStyle='rgba(20,16,12,'+(0.20*dawn).toFixed(3)+')';
    cx.transform(1,0,-1.4,0.5,0,0);
    cx.beginPath(); cx.ellipse(20*s, 12*s, 15*s, 5*s, 0, 0, TAU); cx.fill(); cx.restore(); }

  // a faint mirror of the mask in the wet sand just below it (the sheen)
  cx.save(); cx.globalAlpha=0.16*dawn; cx.scale(1,-0.5); cx.translate(0,-20*s);
  cx.fillStyle=mixHex('#c9c3b2','#efe7d4',dawn);
  cx.beginPath(); cx.ellipse(0,0,11*s,15*s,0,0,TAU); cx.fill(); cx.restore();

  // --- the mask body, lit warm on one side, cool on the other ---
  const mg=cx.createLinearGradient(-11*s,0,11*s,0);
  mg.addColorStop(0, mixHex('#cdc7b6','#f2ead7',dawn));
  mg.addColorStop(1, mixHex('#948f83','#c2b9a2',dawn));
  cx.fillStyle=mg;
  cx.beginPath(); cx.ellipse(0,0,11*s,15*s,0,0,TAU); cx.fill();
  cx.strokeStyle='rgba(60,52,44,0.55)'; cx.lineWidth=1.1*s; cx.stroke();
  // a subtle nose ridge
  cx.strokeStyle='rgba(90,82,70,0.4)'; cx.lineWidth=1*s;
  cx.beginPath(); cx.moveTo(0,-4*s); cx.lineTo(0,5*s); cx.stroke();
  // hollow eye-slits, catching a shadow
  cx.fillStyle='rgba(44,38,32,0.72)';
  cx.beginPath(); cx.ellipse(-4.2*s,-3*s,2.3*s,3.1*s,0.1,0,TAU); cx.ellipse(4.2*s,-3*s,2.3*s,3.1*s,-0.1,0,TAU); cx.fill();
  // a lip of wet sand drifted over the lower edge - it is HALF in the sand
  cx.fillStyle=mixHex('#4a453e','#8a7656',dawn);
  cx.beginPath();
  cx.moveTo(-11*s, 6*s);
  cx.quadraticCurveTo(0, 12*s, 11*s, 5*s);
  cx.quadraticCurveTo(6*s, 18*s, 0, 17*s);
  cx.quadraticCurveTo(-7*s, 17*s, -11*s, 6*s);
  cx.closePath(); cx.fill();
  // a grain or two of sand across the brow
  cx.fillStyle='rgba(120,104,78,0.5)';
  cx.beginPath(); cx.arc(-3*s,-6*s,0.9*s,0,TAU); cx.arc(4*s,-8*s,0.7*s,0,TAU); cx.fill();
  // the dawn glint along the brow - the first light finding the mask
  if(dawn>0.03){ cx.save(); cx.globalCompositeOperation='lighter';
    cx.fillStyle='rgba(255,246,224,'+(0.65*dawn).toFixed(3)+')';
    cx.beginPath(); cx.ellipse(-2.5*s,-8*s,5.5*s,2.6*s,0.2,0,TAU); cx.fill(); cx.restore(); }

  cx.restore();
}

/* ---- post-process ---- */
function shGrade(cx,W,H,storm,ashore){
  // a soft colour grade: cool blue over the storm, warm amber over the dawn
  const dawn=1-Math.min(1,storm);
  cx.save(); cx.globalCompositeOperation='lighter';
  if(storm>0.05){ cx.fillStyle='rgba(40,70,120,'+(0.10*storm).toFixed(3)+')'; cx.fillRect(0,0,W,H); }
  if(dawn>0.2){ const g=cx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'rgba(255,200,150,'+(0.05*dawn).toFixed(3)+')'); g.addColorStop(1,'rgba(255,170,120,'+(0.09*dawn).toFixed(3)+')');
    cx.fillStyle=g; cx.fillRect(0,0,W,H); }
  cx.restore();
}
function shVignette(cx,W,H,storm){
  const vg=cx.createRadialGradient(W*0.5,H*0.52,H*0.28,W*0.5,H*0.52,H*0.92);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,'+(0.46+0.2*storm).toFixed(3)+')');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);
}
function shGrain(cx,W,H,storm){
  if(!SH.grain) return;
  cx.save(); cx.globalAlpha=0.045+0.03*storm; cx.globalCompositeOperation='overlay';
  const ox=(Math.random()*96)|0, oy=(Math.random()*96)|0;
  const p=cx.createPattern(SH.grain,'repeat');
  if(p){ cx.translate(-ox,-oy); cx.fillStyle=p; cx.fillRect(ox,oy,W+96,H+96); }
  cx.restore();
}
function shLetterbox(cx,W,H,bars){
  const bh=Math.round(H*0.11*Math.min(1,bars));
  if(bh<=0) return;
  cx.fillStyle='#000'; cx.fillRect(0,0,W,bh); cx.fillRect(0,H-bh,W,bh);
  // a thin inner sheen line on the bars for that projected-frame feel
  cx.fillStyle='rgba(255,255,255,0.04)';
  cx.fillRect(0,bh-1,W,1); cx.fillRect(0,H-bh,W,1);
}

/* ---------- public entry point (called from startFresh in 21-exploration.js) ---------- */
function shoreCutscene(onDone){
  shPlay(SH_BEATS, {storm:1, ship:1, ashore:0, lantern:0, push:1, bars:0}, onDone);
}
window.shoreCutscene=shoreCutscene;

})();
