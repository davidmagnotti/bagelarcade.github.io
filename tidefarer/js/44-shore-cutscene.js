/* =====================================================================
   WASHED ASHORE - the wash-up-on-shore prologue cutscene.
   -----------------------------------------------------------------------
   Built in the exact mold of the Leviathan freeing (38-leviathan-cutscene.js)
   and the Ashwing bookends (35-dragon-cutscenes.js): a self-contained rAF loop
   over its own overlay canvas (the world is paused), click-to-advance dialogue,
   and a full-frame composed scene.

   It plays BEFORE Elder Maren's first words on the shore (startIntro). Where the
   game used to open cold on those first words - a deliberate "no cinematic" call -
   it now opens on the wreck the dialogue only ever described: the night storm, the
   castaway's ship pitching on the strait, its lanterns swallowed one by one as the
   cursed sea itself reaches up (a violet tell, seeded and unexplained), the dark
   closing over the last light - and then grey dawn, cold sand, a masked figure the
   tide has let go, and a lantern bobbing down the shoreline. On its final beat it
   hands off (onDone) to startIntro, so Maren's "Easy now - easy" lands as it always
   did, now with the wreck behind it.

   Nothing about the castaway's name or face is revealed - Act I seeds only. The one
   bright detail is the pale mask, which the whole journey turns on.

   Additive and graceful: if the overlay DOM is missing, it falls straight through
   to onDone (the first-words intro), so nothing soft-locks.
   ===================================================================== */
(function(){
'use strict';

/* ---------- scene state ---------- */
const SH = {
  raf:0, prev:0, t:0, running:false, ended:false, started:false, idx:0,
  cv:null, cx:null, W:0, H:0,
  beats:null, onDone:null,
  // eased visual state
  storm:1,     // 1 = full night storm on the strait, 0 = still grey dawn
  ship:1,      // 1 = the castaway's ship rides the swell, 0 = swallowed and gone
  ashore:0,    // 0 = out on the heaving strait, 1 = close on the figure on the sand
  lantern:0,   // 0 = empty shoreline, 1 = a lantern (Maren) come down to the surf
  // one-shots (decay per frame)
  flash:0, shake:0, reach:0,   // reach = the cursed swell rising to take the ship
  motes:[], rain:[], _macc:0,
  _autoTO:null, _titleTO:null,
};

/* Each beat carries the line, the scene-state the visuals ease toward while it is on
   screen, an optional title-card flash, and one-shot punches. A wordless beat
   auto-advances after `hold` ms so the motion can carry it. */
const SH_BEATS = [
  // the ship pitching in the black water, its lanterns the only light (wordless)
  { who:'', html:'', storm:1, ship:1, ashore:0, shake:0.5, hold:1700 },
  { who:'', html:'<i>A ship on the night strait, and a storm with no mercy in it. You do not remember boarding her. You do not remember your name.</i>',
    storm:1, ship:1, ashore:0 },
  // the cursed sea reaches up and the lanterns go out one by one (wordless, the big beat)
  { who:'', html:'', storm:1, ship:1, ashore:0, reach:1, flash:1.0, shake:0.7, hold:1900 },
  { who:'', html:'<i>It was no reef. The water itself rose to meet you - cold and wrong, lit from beneath - and the last of the lanterns was swallowed whole. The dark closed over.</i>',
    storm:1, ship:0, ashore:0 },
  // dawn on the shore: the tide lets a masked figure go on the cold sand (wordless)
  { who:'', html:'', storm:0.16, ship:0, ashore:1, hold:1900 },
  { who:'', html:'<i>Then - dawn. Cold sand against your cheek, and the tide letting go of you at last. A pale mask lies over your face, and you have already reached for it, before your eyes are even open. You do not know why.</i>',
    storm:0.1, ship:0, ashore:1 },
  // a lantern comes down the shoreline - the isle has a name (wordless)
  { who:'', html:'', storm:0.06, ashore:1, lantern:1, title:'EMBERWICK', flash:0.4, hold:2100 },
  { who:'', html:'<i>A light comes bobbing down the shoreline - a lantern, and someone hurrying through the surf toward you. You have washed up on some strange, dark shore. You are, at least, alive.</i>',
    storm:0.05, ashore:1, lantern:1 },
];

/* ---------- driver (mirrors the leviathan cutscene's lvLoop) ---------- */
function shResize(){
  const cv=SH.cv; if(!cv) return;
  const r=cv.getBoundingClientRect();
  const dpr=Math.min(2, window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));
  cv.height=Math.max(1,Math.round(r.height*dpr));
  SH.cx.setTransform(dpr,0,0,dpr,0,0);
  SH.W=r.width; SH.H=r.height;
}
function shPlay(beats, init, onDone){
  const ov=document.getElementById('shOv');
  const cv=document.getElementById('shCv');
  if(!ov||!cv){ if(typeof onDone==='function'){ try{ onDone(); }catch(e){} } return; }  // graceful fallback
  SH.beats=beats; SH.onDone=onDone||null;
  SH.cv=cv; SH.cx=cv.getContext('2d');
  SH.t=0; SH.prev=0; SH.idx=0; SH._macc=0;
  SH.storm=1; SH.ship=1; SH.ashore=0; SH.lantern=0; SH.flash=0; SH.shake=0; SH.reach=0;
  if(init) Object.assign(SH, init);
  SH.motes.length=0; SH.rain.length=0;
  SH.ended=false; SH.started=false; SH.running=true;
  const title=document.getElementById('shTitle'), sub=document.getElementById('shSub');
  if(sub) sub.classList.remove('show'); if(title) title.classList.remove('show');
  ov.style.display='flex';
  if(typeof G!=='undefined'){ G.paused=true; G._credits=1; }
  if(typeof cinematic==='function') cinematic(true);
  shResize();
  window.addEventListener('resize', shResize);
  setTimeout(()=>shShow(0), 500);   // brief fade-in, then the first beat
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
  if(b.reach){  SH.reach=1; if(typeof Snd!=='undefined'&&Snd.magic) Snd.magic(); }
  const who=document.getElementById('shWho'), line=document.getElementById('shLine');
  if(who) who.textContent=b.who||'';
  if(line) line.innerHTML=b.html||'';
  const sub=document.getElementById('shSub');
  const wordless=!(b.html||'').replace(/<[^>]*>/g,'').trim();
  if(wordless){
    if(sub) sub.classList.remove('show');
    SH._autoTO=setTimeout(()=>shNext(), b.hold||1700);
  } else {
    const tap=document.getElementById('shTap');
    if(tap) tap.textContent=(i>=SH.beats.length-1)?'wake on the shore ›':'click to continue ›';
    if(sub){ sub.classList.remove('show'); void sub.offsetWidth; sub.classList.add('show'); }
  }
  if(b.title){
    const t=document.getElementById('shTitle'), tt=document.getElementById('shTitleT');
    if(t&&tt){ tt.textContent=b.title; t.classList.remove('show'); void t.offsetWidth;
      t.classList.add('show'); clearTimeout(SH._titleTO);
      SH._titleTO=setTimeout(()=>t.classList.remove('show'), 2600); }
  }
}
function shNext(){
  clearTimeout(SH._autoTO);
  if(SH.idx>=SH.beats.length-1){ shFinish(); return; }
  const sub=document.getElementById('shSub'); if(sub) sub.classList.remove('show');
  setTimeout(()=>shShow(SH.idx+1), 300);
}
function shFinish(){
  if(SH.ended) return;
  SH.ended=true;
  const sub=document.getElementById('shSub'); if(sub) sub.classList.remove('show');
  const title=document.getElementById('shTitle'); if(title) title.classList.remove('show');
  setTimeout(shEnd, 700);   // a beat, then hand off to Maren's first words
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
  SH.storm   = e(SH.storm,   b.storm!=null?b.storm:SH.storm,     1.6);
  SH.ship    = e(SH.ship,    b.ship!=null?b.ship:SH.ship,        1.5);
  SH.ashore  = e(SH.ashore,  b.ashore!=null?b.ashore:SH.ashore,  1.7);
  SH.lantern = e(SH.lantern, b.lantern!=null?b.lantern:SH.lantern,1.6);
  SH.flash = Math.max(0, SH.flash - dt*2.4);
  SH.shake = Math.max(0, SH.shake*(1-SH.ashore*0.6) - dt*1.6);
  SH.reach = Math.max(0, SH.reach - dt*0.85);
  shParticles(dt);
  shDraw();
  SH.raf=requestAnimationFrame(shLoop);
}

/* ---------- particles: driving rain while the storm holds; cold spray on the reach ---------- */
function shParticles(dt){
  // rain, thinning as the storm eases
  const want=Math.round(SH.storm*90);
  while(SH.rain.length<want) SH.rain.push({x:Math.random()*(SH.W+80)-40,y:Math.random()*SH.H,spd:520+Math.random()*260,len:9+Math.random()*7});
  if(SH.rain.length>want) SH.rain.length=want;
  for(const d of SH.rain){ d.y+=d.spd*dt; d.x+=d.spd*0.22*dt; if(d.y>SH.H){ d.y=-14-Math.random()*30; d.x=Math.random()*(SH.W+80)-40; } }
  // the cursed swell's cold motes, blowing up where the ship goes under
  if(SH.reach>0.05){
    const rx=SH.W*0.5, ry=seaY()+8;
    SH._macc+=dt*40*SH.reach; let n=Math.floor(SH._macc); SH._macc-=n; if(n>4) n=4;
    for(let i=0;i<n;i++){ const a=-Math.PI*0.5+rnd(-0.9,0.9), sp=rnd(90,260);
      SH.motes.push({x:rx+rnd(-40,40), y:ry, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1,
        col:Math.random()<0.5?'150,110,220':'170,200,230', size:rnd(1.6,4)}); }
  }
  for(const m of SH.motes){ m.x+=m.vx*dt; m.y+=m.vy*dt; m.vy+=70*dt; m.life-=dt*0.9; }
  SH.motes=SH.motes.filter(m=>m.life>0);
}

/* ---------- draw ---------- */
function seaY(){ return SH.H*0.56; }                  // the waterline / horizon
function beachY(){ return SH.H*0.60; }                // where the wet sand meets the surf when ashore

function shDraw(){
  const cx=SH.cx, W=SH.W, H=SH.H, t=SH.t; if(!cx||!W) return;
  const storm=SH.storm, ashore=SH.ashore, horizon=seaY();
  const sh=SH.shake, ox=(Math.random()*2-1)*sh*9, oy=(Math.random()*2-1)*sh*9;
  cx.save(); cx.translate(ox,oy);

  // --- sky: storm-black with a violet bruise over the strait, easing to pale grey dawn ---
  const sky=cx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0, mixHex('#9db2bd','#0a0f1c', storm));                    // dawn pearl <- storm black
  sky.addColorStop(0.6, mixHex('#c7b9a4','#120f24', Math.min(1,storm*0.92))); // warm dawn band <- bruised dark
  sky.addColorStop(1, mixHex('#e6d3ba','#1c1730', Math.min(1,storm*0.85)));   // horizon glow <- violet murk
  cx.fillStyle=sky; cx.fillRect(0,0,W,horizon+2);

  // a low dawn sun rising as the storm clears (hidden while it rages)
  if(storm<0.7){ const dawn=1-storm, sx=W*0.62, sy=horizon*0.66, sr=Math.min(W,H)*0.05;
    cx.save(); cx.globalCompositeOperation='lighter';
    const dg=cx.createRadialGradient(sx,sy,2,sx,sy,sr*4);
    dg.addColorStop(0,'rgba(255,226,180,'+(0.5*dawn).toFixed(3)+')'); dg.addColorStop(1,'rgba(255,226,180,0)');
    cx.fillStyle=dg; cx.beginPath(); cx.arc(sx,sy,sr*4,0,TAU); cx.fill();
    cx.fillStyle='rgba(255,238,208,'+(0.7*dawn).toFixed(3)+')'; cx.beginPath(); cx.arc(sx,sy,sr,0,TAU); cx.fill();
    cx.restore(); }

  // scudding storm cloud, tearing away as it clears
  if(storm>0.1){ cx.save(); cx.globalAlpha=storm;
    cx.fillStyle='rgba(10,12,22,0.5)';
    for(let i=0;i<4;i++){ const cy=horizon*(0.14+i*0.12), off=(t*(14+i*6))% (W+260) -130;
      cx.beginPath(); cx.ellipse(off, cy, 150-i*16, 26-i*3, 0, 0, TAU); cx.fill();
      cx.beginPath(); cx.ellipse(off+W*0.5, cy+8, 130-i*14, 22-i*3, 0, 0, TAU); cx.fill(); }
    cx.restore(); }

  // --- the sea: a heaving, violet-lit swell under the storm, easing to a calm dawn tide ---
  const sea=cx.createLinearGradient(0,horizon,0,H);
  sea.addColorStop(0, mixHex('#5f7f88','#141a2a', storm));
  sea.addColorStop(1, mixHex('#3a5560','#0a1020', Math.min(1,storm*0.9)));
  cx.fillStyle=sea; cx.fillRect(0,horizon,W,H-horizon+2);
  shWater(cx,W,H,horizon,t,storm);

  // --- the castaway's ship, pitching on the swell, its lanterns the only warm light ---
  if(SH.ship>0.02 && ashore<0.85) shShip(cx,W,H,horizon,t,SH.ship,(1-ashore));

  // --- the cursed swell rising to take her: a violet wall of water, on the reach beat ---
  if(SH.reach>0.03){ cx.save(); cx.globalCompositeOperation='lighter';
    const rg=cx.createRadialGradient(W*0.5,horizon+6,8,W*0.5,horizon+6,Math.max(W,H)*0.55);
    rg.addColorStop(0,'rgba(150,90,230,'+(0.34*SH.reach).toFixed(3)+')');
    rg.addColorStop(1,'rgba(150,90,230,0)');
    cx.fillStyle=rg; cx.fillRect(0,0,W,H); cx.restore(); }

  // --- the shore foreground: wet sand, a lace of surf, the masked castaway, a lantern coming ---
  if(ashore>0.02) shShore(cx,W,H,t,ashore,SH.lantern,storm);

  // --- rain, driving across the frame while the storm holds ---
  if(storm>0.03){ cx.strokeStyle='rgba(200,215,235,'+(0.22*storm).toFixed(3)+')'; cx.lineWidth=1.2; cx.beginPath();
    for(const d of SH.rain){ cx.moveTo(d.x,d.y); cx.lineTo(d.x-d.len*0.22,d.y-d.len); }
    cx.stroke(); }

  // --- cold motes off the cursed swell ---
  cx.save(); cx.globalCompositeOperation='lighter';
  for(const m of SH.motes){
    cx.globalAlpha=Math.max(0,Math.min(1,m.life));
    cx.fillStyle='rgba('+m.col+',0.9)';
    cx.beginPath(); cx.arc(m.x,m.y,m.size,0,TAU); cx.fill();
  }
  cx.globalAlpha=1; cx.restore();

  // --- full-frame flash (violet as the sea takes the ship; a soft white as dawn breaks) ---
  if(SH.flash>0.01){ const violet=SH.storm>0.5;
    cx.fillStyle=(violet?'rgba(150,110,220,':'rgba(255,244,225,')+(0.4*SH.flash).toFixed(3)+')'; cx.fillRect(0,0,W,H); }
  cx.restore();  // shake

  // --- vignette ---
  const vg=cx.createRadialGradient(W*0.5,H*0.52,H*0.2,W*0.5,H*0.52,H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,'+(0.4+0.22*storm).toFixed(3)+')');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);
}

// rolling swell on the strait; big and violent under the storm, sinking to a gentle tide at dawn
function shWater(cx,W,H,horizon,t,storm){
  cx.save();
  const rows=7, amp=storm*10+0.6;
  for(let i=0;i<rows;i++){
    const p=i/(rows-1), y=horizon + (H-horizon)*p*p*0.9 + 5;
    const a=(0.14+0.10*storm)*(1-p*0.5);
    cx.strokeStyle= 'rgba('+(storm>0.5?'150,120,190':'190,215,225')+','+a.toFixed(3)+')';
    cx.lineWidth=1.5;
    cx.beginPath();
    for(let x=0;x<=W;x+=12){
      const yy=y + Math.sin(x*0.02 + t*(1.4+p) + i)*amp*(0.5+p);
      x===0?cx.moveTo(x,yy):cx.lineTo(x,yy);
    }
    cx.stroke();
  }
  cx.restore();
}

// the small ship, heeled over and pitching on the swell; two warm lanterns snuff out as `alive`->0.
// `pres` is how present the ship is on the water (it sinks as the sea takes it).
function shShip(cx,W,H,horizon,t,pres,onwater){
  const sx=W*0.5, roll=Math.sin(t*1.1)*0.16*pres, pitch=Math.sin(t*1.1)*10*pres;
  const sink=(1-pres)*60;                                   // slips under as it is swallowed
  const scale=Math.min(W,H)/360;
  cx.save();
  cx.globalAlpha=Math.min(1,onwater)*Math.min(1,pres*1.4);
  cx.translate(sx, horizon-14+pitch+sink);
  cx.rotate(roll);
  cx.scale(scale,scale);
  // hull
  cx.fillStyle='#1a140e';
  cx.beginPath();
  cx.moveTo(-46,-6); cx.lineTo(46,-6);
  cx.quadraticCurveTo(40,14, 26,16); cx.lineTo(-30,16);
  cx.quadraticCurveTo(-44,14,-46,-6); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(120,110,95,0.25)'; cx.lineWidth=1.5; cx.stroke();
  // a broken mast, canted, a shred of sail
  cx.strokeStyle='#241a12'; cx.lineWidth=4; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(2,-6); cx.lineTo(-6,-56); cx.stroke();
  cx.fillStyle='rgba(210,200,180,0.5)';
  cx.beginPath(); cx.moveTo(-6,-52); cx.quadraticCurveTo(20,-44,16,-20); cx.quadraticCurveTo(2,-26,-2,-14); cx.closePath(); cx.fill();
  // two warm lanterns, guttering as the ship goes under
  cx.save(); cx.globalCompositeOperation='lighter';
  for(const [lx,ly] of [[-30,-10],[24,-10]]){
    const lg=cx.createRadialGradient(lx,ly,1,lx,ly,20);
    lg.addColorStop(0,'rgba(255,196,110,'+(0.8*pres).toFixed(3)+')'); lg.addColorStop(1,'rgba(255,196,110,0)');
    cx.fillStyle=lg; cx.beginPath(); cx.arc(lx,ly,20,0,TAU); cx.fill();
  }
  cx.restore();
  cx.restore();
}

// the wet dawn shore: a sweep of sand up into the foreground, a lace of surf at the tideline,
// the masked castaway lying where the sea left her, and (as `lantern`->1) a lantern-light
// coming down the strand - Elder Maren, about to reach her.
function shShore(cx,W,H,t,amt,lantern,storm){
  const by=beachY();
  cx.save(); cx.globalAlpha=Math.min(1,amt);

  // the wet sand, warming from storm-grey to dawn gold as the light comes up
  const g2=cx.createLinearGradient(0,by,0,H);
  const dawn=1-Math.min(1,storm);
  g2.addColorStop(0, mixHex('#6a6360','#b9a27e', dawn));
  g2.addColorStop(1, mixHex('#4a4642','#8f7c5c', dawn));
  cx.fillStyle=g2;
  cx.beginPath();
  cx.moveTo(0,by+10);
  for(let x=0;x<=W;x+=36){ cx.lineTo(x, by + Math.sin(x*0.012+1)*7 + 8); }
  cx.lineTo(W,H); cx.lineTo(0,H); cx.closePath(); cx.fill();

  // the surf: a lace of foam washing up the sand and sliding back
  const foam=by + 6 + Math.sin(t*0.9)*4;
  cx.strokeStyle='rgba(238,244,246,'+(0.5).toFixed(3)+')'; cx.lineWidth=2.2;
  cx.beginPath();
  for(let x=0;x<=W;x+=10){ const yy=foam + Math.sin(x*0.05 + t*1.4)*3 + Math.sin(x*0.13)*2; x===0?cx.moveTo(x,yy):cx.lineTo(x,yy); }
  cx.stroke();
  cx.fillStyle='rgba(224,236,238,0.16)';
  cx.beginPath(); cx.moveTo(0,foam);
  for(let x=0;x<=W;x+=10){ cx.lineTo(x, foam + Math.sin(x*0.05 + t*1.4)*3); }
  cx.lineTo(W,by+14); cx.lineTo(0,by+14); cx.closePath(); cx.fill();

  // --- the masked castaway, lying at the tideline where the sea let her go ---
  // (kept high on the sand, above the caption plate, so the mask - the motif the whole
  //  journey turns on - stays in frame even while a line is on screen)
  const fx=W*0.52, fy=H*0.66, s=Math.min(W,H)/360*0.82;
  cx.save(); cx.translate(fx,fy);
  // a spill of dark hair and a sodden cloak
  cx.fillStyle='#231d18';
  cx.beginPath(); cx.ellipse(0,0, 70*s, 22*s, -0.06, 0, TAU); cx.fill();   // cloak/body low mound
  cx.fillStyle='#15110d';
  cx.beginPath(); cx.ellipse(-52*s,-6*s, 20*s, 12*s, -0.2, 0, TAU); cx.fill();  // hair fanned in the sand
  // an outstretched arm, hand open toward the mask
  cx.strokeStyle='#2a221b'; cx.lineWidth=8*s; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(28*s,-2*s); cx.quadraticCurveTo(48*s,-8*s,62*s,-14*s); cx.stroke();
  // the pale mask, half in the wet sand - the one bright thing, catching the dawn
  cx.save(); cx.translate(-46*s,-12*s); cx.rotate(-0.35);
  cx.fillStyle='#e9e4d6';
  cx.beginPath(); cx.ellipse(0,0, 11*s, 15*s, 0, 0, TAU); cx.fill();
  cx.strokeStyle='rgba(60,52,44,0.5)'; cx.lineWidth=1.2*s; cx.stroke();
  cx.fillStyle='rgba(60,52,44,0.55)';                                        // hollow eye-slits
  cx.beginPath(); cx.ellipse(-4*s,-3*s,2.2*s,3*s,0,0,TAU); cx.ellipse(4*s,-3*s,2.2*s,3*s,0,0,TAU); cx.fill();
  // a faint dawn glint off the mask's brow
  cx.save(); cx.globalCompositeOperation='lighter';
  cx.fillStyle='rgba(255,246,225,'+(0.5*(1-Math.min(1,storm))).toFixed(3)+')';
  cx.beginPath(); cx.ellipse(-2*s,-7*s,5*s,3*s,0,0,TAU); cx.fill(); cx.restore();
  cx.restore();
  cx.restore();

  // --- Maren's lantern, come down the strand from the left ---
  if(lantern>0.02){
    const lx=W*(0.18+0.05*Math.sin(t*0.6)), ly=H*0.66;
    cx.save(); cx.globalAlpha=Math.min(1,lantern)*Math.min(1,amt);
    // the warm pool of lantern-light
    cx.save(); cx.globalCompositeOperation='lighter';
    const lg=cx.createRadialGradient(lx,ly,2,lx,ly,70);
    lg.addColorStop(0,'rgba(255,198,120,0.55)'); lg.addColorStop(1,'rgba(255,198,120,0)');
    cx.fillStyle=lg; cx.beginPath(); cx.arc(lx,ly,70,0,TAU); cx.fill(); cx.restore();
    // a small bent figure with a raised lantern
    const s2=Math.min(W,H)/360;
    cx.fillStyle='#171310';
    cx.beginPath();
    cx.moveTo(lx-10*s2, ly+30*s2);
    cx.quadraticCurveTo(lx-12*s2, ly-6*s2, lx-2*s2, ly-30*s2);   // stooped back
    cx.quadraticCurveTo(lx+4*s2, ly-38*s2, lx+10*s2, ly-30*s2);  // head/hood
    cx.quadraticCurveTo(lx+12*s2, ly-4*s2, lx+12*s2, ly+30*s2);
    cx.closePath(); cx.fill();
    // the lantern itself, held out ahead
    cx.fillStyle='#2a2018'; cx.fillRect(lx+14*s2, ly-20*s2, 6*s2, 8*s2);
    cx.save(); cx.globalCompositeOperation='lighter';
    cx.fillStyle='rgba(255,214,140,0.95)'; cx.beginPath(); cx.arc(lx+17*s2, ly-16*s2, 3.2*s2, 0, TAU); cx.fill();
    cx.restore();
    cx.restore();
  }
  cx.restore();
}

/* ---------- public entry point (called from startFresh in 21-exploration.js) ---------- */
function shoreCutscene(onDone){
  shPlay(SH_BEATS, {storm:1, ship:1, ashore:0, lantern:0}, onDone);
}
window.shoreCutscene=shoreCutscene;

})();
