/* =====================================================================
   THE CURSE BREAKS - an animated overlay cutscene for the fall of the
   Hollow Spirit, Emberwick's main-story boss (Act I).
   -----------------------------------------------------------------------
   Built in the exact mold of the Leviathan freeing (38-leviathan-cutscene.js)
   and the Ashwing bookends (35-dragon-cutscenes.js): a self-contained rAF loop
   over its own overlay canvas (the world is paused), click-to-advance dialogue,
   a full-frame composed scene, and one big turning beat.

   It slots BETWEEN the boss's fall and the victory card. Where the kill used to
   flash a banner and pop the win overlay two seconds later, now the crowned
   revenant's ghostlight guts out, the jagged crown splits, the violet miasma
   lifts off the northern ruins, and - the load-bearing beat - the strait beyond
   goes glass-calm as the curse that sealed it breaks. The hollow king, whose own
   crown would not let him rest, is finally let go. It names the shadow that woke
   it (a robed thing, violet at the wrist) - a seed of Vath, no more - then sinks
   to bone and dust.

   On its final beat it hands off (onDone) to the victory card (winOv).

   Additive and graceful: if the overlay DOM is missing, it falls straight
   through to onDone, so nothing soft-locks.
   ===================================================================== */
(function(){
'use strict';

/* ---------- scene state ---------- */
const HS = {
  raf:0, prev:0, t:0, running:false, ended:false, started:false, idx:0,
  cv:null, cx:null, W:0, H:0,
  beats:null, onDone:null,
  // eased visual state
  ens:1,      // 1 = the curse still on it (violet ghostlight, miasma), 0 = broken and at rest
  calm:0,     // 0 = the strait heaving under the curse, 1 = glass-flat and open
  crown:1,    // 1 = the jagged crown whole, 0 = split and shed
  rest:0,     // at the very end, the bones sink to dust
  // one-shots (decay per frame)
  flash:0, shake:0, shatter:0,
  motes:[], _macc:0,
  _autoTO:null, _titleTO:null,
};

/* Each beat carries the line, the scene-state the visuals ease toward while it is
   on screen, an optional title-card flash, and one-shot punches. A wordless beat
   auto-advances after `hold` ms so the motion can carry it. */
const HS_BEATS = [
  // still cursed - it reels, the violet ghostlight guttering, the shroud whipping (wordless)
  { who:'', html:'', ens:1, calm:0, crown:1, shake:0.6, hold:1500 },
  // the crown splits and the shroud tears loose: a pale release-light, the violet blows off,
  // the strait beyond falls flat (wordless, the big beat)
  { who:'', html:'', ens:0.12, calm:0.5, crown:0, shatter:1, flash:1.05, shake:0.65, hold:1800 },
  { who:'The Hollow Spirit',
    html:'<b style="color:#a9e0b8">"…quiet. The crown is quiet at last. I kept it, breaker - and it kept me, long past my grave, and would not let me lie."</b>',
    ens:0, calm:0.95 },
  // the seed of Vath: it names the shadow that woke it - no more than that
  { who:'The Hollow Spirit',
    html:'<b style="color:#a9e0b8">"I did not wake of my own will. A shadow came over the strait - a robed thing, </b><b style="color:#c9a0ff">violet at the wrist</b><b style="color:#a9e0b8">, whispering the dead awake to seal your ships beneath the tide. Mark it well. It is not done with your shore."</b>',
    ens:0, calm:1 },
  // the curse lifts off the whole strait; the title card falls (wordless)
  { who:'', html:'', ens:0, calm:1, crown:0, flash:0.5, title:'THE CURSE BREAKS', hold:2100 },
  { who:'The Hollow Spirit',
    html:'<b style="color:#a9e0b8">"The water is yours again. The strait lies open, and the dead lie still. Let a keel cross it and think of me kindly, if you think of me at all. Rest now, breaker - I mean to."</b>',
    ens:0, calm:1 },
];

/* ---------- driver (mirrors the leviathan cutscene's lvLoop) ---------- */
function hsResize(){
  const cv=HS.cv; if(!cv) return;
  const r=cv.getBoundingClientRect();
  const dpr=Math.min(2, window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));
  cv.height=Math.max(1,Math.round(r.height*dpr));
  HS.cx.setTransform(dpr,0,0,dpr,0,0);
  HS.W=r.width; HS.H=r.height;
}
function hsPlay(beats, init, onDone){
  const ov=document.getElementById('hsOv');
  const cv=document.getElementById('hsCv');
  if(!ov||!cv){ if(typeof onDone==='function'){ try{ onDone(); }catch(e){} } return; }  // graceful fallback
  HS.beats=beats; HS.onDone=onDone||null;
  HS.cv=cv; HS.cx=cv.getContext('2d');
  HS.t=0; HS.prev=0; HS.idx=0; HS._macc=0;
  HS.ens=1; HS.calm=0; HS.crown=1; HS.rest=0; HS.flash=0; HS.shake=0; HS.shatter=0;
  if(init) Object.assign(HS, init);
  HS.motes.length=0;
  HS.ended=false; HS.started=false; HS.running=true;
  const title=document.getElementById('hsTitle'), sub=document.getElementById('hsSub');
  if(sub) sub.classList.remove('show'); if(title) title.classList.remove('show');
  ov.style.display='flex';
  if(typeof G!=='undefined'){ G.paused=true; G._credits=1; }
  if(typeof cinematic==='function') cinematic(true);
  hsResize();
  window.addEventListener('resize', hsResize);
  setTimeout(()=>hsShow(0), 500);   // brief fade-in, then the first beat
  ov.onclick=()=>{ if(HS.ended || !HS.started) return; hsNext(); };
  cancelAnimationFrame(HS.raf);
  HS.raf=requestAnimationFrame(hsLoop);
}
function hsShow(i){
  const b=HS.beats[i]; if(!b) return;
  HS.idx=i; HS.started=true;
  clearTimeout(HS._autoTO);
  if(b.flash)   HS.flash=Math.max(HS.flash, b.flash);
  if(b.shake)   HS.shake=Math.max(HS.shake, b.shake);
  if(b.shatter){ HS.shatter=1; if(typeof Snd!=='undefined'&&Snd.magic) Snd.magic(); }
  const who=document.getElementById('hsWho'), line=document.getElementById('hsLine');
  if(who) who.textContent=b.who||'';
  if(line) line.innerHTML=b.html||'';
  const sub=document.getElementById('hsSub');
  const wordless=!(b.html||'').replace(/<[^>]*>/g,'').trim();
  if(wordless){
    if(sub) sub.classList.remove('show');
    HS._autoTO=setTimeout(()=>hsNext(), b.hold||1700);
  } else {
    const tap=document.getElementById('hsTap');
    if(tap) tap.textContent=(i>=HS.beats.length-1)?'let the dead lie still ›':'click to continue ›';
    if(sub){ sub.classList.remove('show'); void sub.offsetWidth; sub.classList.add('show'); }
  }
  if(b.title){
    const t=document.getElementById('hsTitle'), tt=document.getElementById('hsTitleT');
    if(t&&tt){ tt.textContent=b.title; t.classList.remove('show'); void t.offsetWidth;
      t.classList.add('show'); clearTimeout(HS._titleTO);
      if(typeof Snd!=='undefined'&&Snd.levelup) Snd.levelup();
      HS._titleTO=setTimeout(()=>t.classList.remove('show'), 2600); }
  }
}
function hsNext(){
  clearTimeout(HS._autoTO);
  if(HS.idx>=HS.beats.length-1){ hsFinish(); return; }
  const sub=document.getElementById('hsSub'); if(sub) sub.classList.remove('show');
  setTimeout(()=>hsShow(HS.idx+1), 300);
}
function hsFinish(){
  if(HS.ended) return;
  HS.ended=true;   // the driver eases HS.rest toward 1 now, so the bones sink to dust as it settles
  const sub=document.getElementById('hsSub'); if(sub) sub.classList.remove('show');
  const title=document.getElementById('hsTitle'); if(title) title.classList.remove('show');
  setTimeout(hsEnd, 1600);   // let it dissolve before handing back to the victory card
}
function hsEnd(){
  HS.running=false; cancelAnimationFrame(HS.raf);
  window.removeEventListener('resize', hsResize);
  const ov=document.getElementById('hsOv'); if(ov){ ov.style.display='none'; ov.onclick=null; }
  if(typeof G!=='undefined'){ G._credits=0; }   // leave G.paused as the victory card wants it
  if(typeof cinematic==='function') cinematic(false);
  const done=HS.onDone; HS.onDone=null;
  if(typeof done==='function'){ try{ done(); }catch(e){} }
}
function hsLoop(ts){
  if(!HS.running) return;
  if(!HS.prev) HS.prev=ts;
  let dt=(ts-HS.prev)/1000; HS.prev=ts;
  if(dt>0.05) dt=0.05;
  HS.t+=dt;
  const b=HS.beats[HS.idx]||HS.beats[0];
  const e=(cur,tgt,k)=>cur+(tgt-cur)*Math.min(1,dt*k);
  HS.ens   = e(HS.ens,   b.ens!=null?b.ens:HS.ens,     2.0);
  HS.calm  = e(HS.calm,  b.calm!=null?b.calm:HS.calm,   1.5);
  HS.crown = e(HS.crown, b.crown!=null?b.crown:HS.crown,2.4);
  HS.rest  = e(HS.rest,  HS.ended?1:0,                  1.1);
  HS.flash  = Math.max(0, HS.flash  - dt*2.6);
  HS.shake  = Math.max(0, HS.shake*(1-HS.calm*0.5) - dt*1.8);
  HS.shatter= Math.max(0, HS.shatter- dt*1.2);
  hsMotes(dt);
  hsDraw();
  HS.raf=requestAnimationFrame(hsLoop);
}

/* ---------- particles ---------- */
/* While cursed: violet motes cling and swirl at the skull. On the shatter: they blow
   OUTWARD with pale-green release-sparks among them, and then it goes still. As it
   rests, a slow drift of bone-dust rises and fades. */
function hsMotes(dt){
  const cxm=HS.W*0.5, hy=skullY();
  if(HS.shatter>0.02){
    HS._macc+=dt*48*HS.shatter; let n=Math.floor(HS._macc); HS._macc-=n; if(n>4) n=4;
    for(let i=0;i<n;i++){ const a=Math.random()*TAU, sp=rnd(80,270);
      HS.motes.push({x:cxm, y:hy, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-70, life:1,
        col:Math.random()<0.5?'170,235,190':'200,150,255', size:rnd(2,4.6)}); }
  } else if(HS.ens>0.3){
    HS._macc+=dt*20*HS.ens; let n=Math.floor(HS._macc); HS._macc-=n; if(n>3) n=3;
    for(let i=0;i<n;i++){ const a=Math.random()*TAU, r=28+Math.random()*22;
      HS.motes.push({x:cxm+Math.cos(a)*r, y:hy+Math.sin(a)*r*0.7, tx:cxm, ty:hy, life:1,
        col:Math.random()<0.5?'160,110,240':'190,140,255', size:rnd(2,4)}); }
  } else if(HS.rest>0.05){
    HS._macc+=dt*14*HS.rest; let n=Math.floor(HS._macc); HS._macc-=n; if(n>2) n=2;
    for(let i=0;i<n;i++){
      HS.motes.push({x:cxm+rnd(-30,30), y:hy+rnd(-10,60), vx:rnd(-12,12), vy:rnd(-34,-14), life:1,
        col:'214,210,196', size:rnd(1.4,3)}); }
  }
  for(const m of HS.motes){
    if(m.tx!=null){ m.x+=(m.tx-m.x)*Math.min(1,dt*2.0); m.y+=(m.ty-m.y)*Math.min(1,dt*2.0); m.life-=dt*1.1; }
    else { m.x+=m.vx*dt; m.y+=m.vy*dt; m.vy+=52*dt; m.life-=dt*0.9; }
  }
  HS.motes=HS.motes.filter(m=>m.life>0);
}

/* ---------- draw ---------- */
function seaY(){ return HS.H*0.58; }                  // the waterline out past the headland
function groundY(){ return HS.H*0.72; }               // where the graveyard ground begins in front
function spiritBaseY(){ return HS.H*0.90; }           // the revenant's feet, in the near foreground
function spiritScale(){ return HS.H/360*0.92; }
function skullY(){ return spiritBaseY() - 150*spiritScale(); }

function hsDraw(){
  const cx=HS.cx, W=HS.W, H=HS.H, t=HS.t; if(!cx||!W) return;
  const ens=HS.ens, calm=HS.calm, horizon=seaY();
  const sh=HS.shake, ox=(Math.random()*2-1)*sh*8, oy=(Math.random()*2-1)*sh*8;
  cx.save(); cx.translate(ox,oy);

  // --- cold night sky over the strait: deep blue up, a violet bruise while cursed ---
  const sky=cx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0, mixHex('#0a1320','#180f2c', Math.min(1,ens*0.7)));
  sky.addColorStop(0.7, mixHex('#16283a','#241640', Math.min(1,ens*0.6)));
  sky.addColorStop(1, mixHex('#2a4658','#341f4c', Math.min(1,ens*0.5)));
  cx.fillStyle=sky; cx.fillRect(0,0,W,horizon+2);

  // a cold moon, veiled while the curse holds, brightening as it breaks
  const mx=W*0.72, my=horizon*0.40, mr=Math.min(W,H)*0.055;
  cx.save(); cx.globalCompositeOperation='lighter';
  const mg=cx.createRadialGradient(mx,my,2,mx,my,mr*3.4);
  mg.addColorStop(0,'rgba(198,222,240,'+(0.34+0.34*calm).toFixed(3)+')');
  mg.addColorStop(1,'rgba(198,222,240,0)');
  cx.fillStyle=mg; cx.beginPath(); cx.arc(mx,my,mr*3.4,0,TAU); cx.fill();
  cx.globalCompositeOperation='source-over';
  cx.fillStyle='rgba(226,238,250,'+(0.6+0.32*calm).toFixed(3)+')'; cx.beginPath(); cx.arc(mx,my,mr,0,TAU); cx.fill();
  cx.restore();

  // --- the strait: heaving swell while cursed, easing to a glass-flat mirror when calmed ---
  const sea=cx.createLinearGradient(0,horizon,0,groundY()+4);
  sea.addColorStop(0, mixHex('#1a3644','#1c1230', Math.min(1,ens*0.55)));
  sea.addColorStop(1, mixHex('#0a1c26','#0a0818', Math.min(1,ens*0.5)));
  cx.fillStyle=sea; cx.fillRect(0,horizon,W,groundY()-horizon+6);
  hsWater(cx,W,horizon,groundY(),t,ens,calm);
  // the moon's track laid down on the flattening water
  if(calm>0.05){ cx.save(); cx.globalCompositeOperation='lighter';
    cx.fillStyle='rgba(198,222,240,'+(0.10*calm).toFixed(3)+')';
    cx.beginPath(); cx.ellipse(mx,horizon+16,mr*0.7,12+10*calm,0,0,TAU); cx.fill();
    cx.restore(); }

  // --- the northern headland: dark graveyard ground, a cracked crypt arch, tilted headstones ---
  hsGround(cx,W,H,groundY());

  // --- the curse still hanging over the ruins while cursed: a violet miasma that lifts ---
  if(ens>0.03){ cx.save(); cx.globalCompositeOperation='lighter';
    const vg=cx.createRadialGradient(W*0.5,groundY(),10,W*0.5,groundY(),Math.max(W,H)*0.7);
    vg.addColorStop(0,'rgba(150,90,230,'+(0.15*ens).toFixed(3)+')');
    vg.addColorStop(1,'rgba(150,90,230,0)');
    cx.fillStyle=vg; cx.fillRect(0,0,W,H); cx.restore(); }

  // --- the Hollow Spirit itself, crowned and shrouded, colour easing cursed -> at rest ---
  hsSpirit(cx,W,H,t,ens,HS.crown,HS.rest);

  // --- the breaking burst: the crown splitting, the curse blowing off the skull ---
  if(HS.shatter>0.01) hsShatter(cx,W*0.5,skullY(),HS.shatter);

  // --- motes ---
  cx.save(); cx.globalCompositeOperation='lighter';
  for(const m of HS.motes){
    cx.globalAlpha=Math.max(0,Math.min(1,m.life));
    cx.fillStyle='rgba('+m.col+',0.9)';
    cx.beginPath(); cx.arc(m.x,m.y,m.size,0,TAU); cx.fill();
  }
  cx.globalAlpha=1; cx.restore();

  // --- full-frame flash (a pale release-light as the crown breaks) ---
  if(HS.flash>0.01){ cx.fillStyle='rgba(180,235,200,'+(0.42*HS.flash).toFixed(3)+')'; cx.fillRect(0,0,W,H); }
  cx.restore();  // shake

  // --- vignette ---
  const vg=cx.createRadialGradient(W*0.5,H*0.52,H*0.2,W*0.5,H*0.52,H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.62)');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);
}

// rolling swell lines on the strait; their amplitude falls to near-zero as `calm` rises
function hsWater(cx,W,horizon,gy,t,ens,calm){
  cx.save();
  const rows=6, amp=(1-calm)*6+0.5, span=gy-horizon;
  for(let i=0;i<rows;i++){
    const p=i/(rows-1), y=horizon + span*p*p*0.95 + 4;
    const a=(0.12+0.10*ens)*(1-p*0.55);
    cx.strokeStyle= 'rgba('+(ens>0.4?'150,110,200':'150,195,215')+','+a.toFixed(3)+')';
    cx.lineWidth=1.4;
    cx.beginPath();
    for(let x=0;x<=W;x+=14){
      const yy=y + Math.sin(x*0.02 + t*(1.0+p) + i)*amp*(0.5+p);
      x===0?cx.moveTo(x,yy):cx.lineTo(x,yy);
    }
    cx.stroke();
  }
  cx.restore();
}

// the dark headland the graveyard stands on: a cracked crypt arch back-left, a scatter of
// tilted, broken headstones, and a low ground plane that the revenant stands upon
function hsGround(cx,W,H,gy){
  cx.save();
  // the ground plane
  const gr=cx.createLinearGradient(0,gy-8,0,H);
  gr.addColorStop(0,'#14161a'); gr.addColorStop(1,'#080a0c');
  cx.fillStyle=gr;
  cx.beginPath();
  cx.moveTo(0,gy+6);
  for(let x=0;x<=W;x+=40){ cx.lineTo(x, gy + Math.sin(x*0.01)*4 + 2); }
  cx.lineTo(W,H); cx.lineTo(0,H); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(120,140,150,0.06)'; cx.lineWidth=2; cx.stroke();

  // the cracked crypt arch, back-left - the defaced royal cipher over the threshold
  const ax=W*0.17, ay=gy-2, aw=W*0.12, ah=H*0.20;
  cx.fillStyle='#0c0e12';
  cx.beginPath();
  cx.moveTo(ax-aw*0.5, ay);
  cx.lineTo(ax-aw*0.5, ay-ah*0.7);
  cx.quadraticCurveTo(ax-aw*0.5, ay-ah, ax-aw*0.16, ay-ah);   // left jamb into the broken crown of the arch
  cx.lineTo(ax-aw*0.02, ay-ah*0.86);                          // a jagged bite out of the keystone
  cx.lineTo(ax+aw*0.16, ay-ah);
  cx.quadraticCurveTo(ax+aw*0.5, ay-ah, ax+aw*0.5, ay-ah*0.7);
  cx.lineTo(ax+aw*0.5, ay);
  cx.lineTo(ax+aw*0.32, ay);
  cx.lineTo(ax+aw*0.32, ay-ah*0.6);                           // the dark doorway
  cx.lineTo(ax-aw*0.32, ay-ah*0.6);
  cx.lineTo(ax-aw*0.32, ay);
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(120,140,150,0.10)'; cx.lineWidth=2; cx.stroke();

  // tilted, broken headstones scattered across the plot (steady placement, no RNG per frame)
  const stones=[[0.30,0.10,-0.16],[0.40,0.16,0.10],[0.63,0.13,0.20],[0.74,0.18,-0.12],[0.86,0.11,0.16],[0.55,0.20,-0.06]];
  for(const [fx,fh,tilt] of stones){
    const bx=W*fx, by=gy + H*0.02, w=W*0.028, h=H*fh;
    cx.save(); cx.translate(bx,by); cx.rotate(tilt);
    cx.fillStyle='#0e1013';
    cx.beginPath(); cx.moveTo(-w,0); cx.lineTo(-w,-h*0.78);
    cx.quadraticCurveTo(-w,-h, 0,-h); cx.quadraticCurveTo(w,-h, w,-h*0.78);
    cx.lineTo(w,0); cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(120,140,150,0.08)'; cx.lineWidth=1.5; cx.stroke();
    cx.restore();
  }
  cx.restore();
}

// the crowned royal revenant, rearing from the plot: bone skull and ribcage, a tattered
// shroud, and a jagged gold crown - violet ghostlight while cursed, guttering out as it
// is freed. `crown` splits it away; `rest` sinks the bones to dust at the end.
function hsSpirit(cx,W,H,t,ens,crown,rest){
  const cxm=W*0.5, base=spiritBaseY(), sc=spiritScale();
  const boneC = mixHex('#e9e6d6','#8f9a92', ens*0.5);         // pale bone -> cold cursed grey
  const shroudC = mixHex('#2c2436','#3a2a52', ens);           // dead grey -> Vath's violet weave
  const glowC = ens>0.5?'199,123,255':'170,224,184';          // violet ghostlight -> pale-green release
  const sink = easeOut(rest)*120*sc;                           // how far it has settled into the ground
  const sway = Math.sin(t*1.3)*3*sc*(0.4+ens*0.6);
  cx.save();
  cx.translate(cxm, base + sink);
  cx.globalAlpha=1-rest*0.9;

  // the ghost-nimbus around it, brightening while cursed
  cx.save(); cx.globalCompositeOperation='lighter';
  const ng=cx.createRadialGradient(0,-90*sc,4,0,-90*sc,120*sc);
  ng.addColorStop(0,'rgba('+glowC+','+(0.10+0.24*ens).toFixed(3)+')');
  ng.addColorStop(1,'rgba('+glowC+',0)');
  cx.fillStyle=ng; cx.beginPath(); cx.arc(0,-90*sc,120*sc,0,TAU); cx.fill(); cx.restore();

  // a spectral lower trail instead of legs - it hovers, tapering into ground-mist
  cx.save();
  const tg=cx.createLinearGradient(0,-40*sc,0,10*sc);
  tg.addColorStop(0, shroudC); tg.addColorStop(1,'rgba(20,16,28,0)');
  cx.fillStyle=tg;
  cx.beginPath();
  cx.moveTo(-26*sc,-46*sc);
  cx.quadraticCurveTo(-34*sc+sway,-6*sc, -14*sc+sway*1.4, 8*sc);
  cx.quadraticCurveTo(0, 2*sc, 14*sc+sway*1.4, 8*sc);
  cx.quadraticCurveTo(34*sc+sway,-6*sc, 26*sc,-46*sc);
  cx.closePath(); cx.fill();
  cx.restore();

  // the tattered shroud/cape over the shoulders
  cx.fillStyle=shroudC;
  cx.beginPath();
  cx.moveTo(-30*sc,-118*sc);
  cx.lineTo(30*sc,-118*sc);
  cx.lineTo(38*sc+sway,-44*sc);
  cx.lineTo(20*sc,-58*sc); cx.lineTo(8*sc,-40*sc); cx.lineTo(0,-56*sc);
  cx.lineTo(-8*sc,-40*sc); cx.lineTo(-20*sc,-58*sc); cx.lineTo(-38*sc+sway,-44*sc);
  cx.closePath(); cx.fill();

  // the ribcage
  cx.fillStyle=boneC;
  cx.beginPath(); cx.roundRect(-22*sc,-116*sc,44*sc,52*sc,12*sc); cx.fill();
  cx.strokeStyle='rgba(30,28,22,0.5)'; cx.lineWidth=3*sc;
  for(let i=0;i<4;i++){ cx.beginPath(); cx.moveTo(-18*sc,-104*sc+i*11*sc); cx.lineTo(18*sc,-104*sc+i*11*sc); cx.stroke(); }
  cx.beginPath(); cx.moveTo(0,-116*sc); cx.lineTo(0,-64*sc); cx.stroke();   // sternum

  // gaunt arms hanging at the sides, one hand open where a blade used to be
  cx.strokeStyle=boneC; cx.lineWidth=8*sc; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(-22*sc,-112*sc); cx.quadraticCurveTo(-40*sc,-92*sc, -34*sc,-62*sc); cx.stroke();
  cx.beginPath(); cx.moveTo( 22*sc,-112*sc); cx.quadraticCurveTo( 40*sc,-92*sc,  34*sc,-62*sc); cx.stroke();

  // the neck and skull
  cx.strokeStyle=boneC; cx.lineWidth=10*sc;
  cx.beginPath(); cx.moveTo(0,-116*sc); cx.lineTo(0,-134*sc); cx.stroke();
  cx.save(); cx.translate(0,-150*sc);
  cx.fillStyle=boneC;
  cx.beginPath(); cx.arc(0,0,18*sc,0,TAU); cx.fill();          // cranium
  cx.fillRect(-10*sc,4*sc,20*sc,12*sc);                        // jaw block
  // brow shadow + cheek hollows
  cx.fillStyle='rgba(30,28,22,0.35)';
  cx.beginPath(); cx.ellipse(0,10*sc,11*sc,6*sc,0,0,TAU); cx.fill();
  // the eye-lights: violet ghostfire while cursed, guttering to nothing as freed
  cx.save(); cx.globalCompositeOperation='lighter';
  const ea=(0.5+0.5*Math.sin(t*3))*Math.max(ens,0.12);
  for(const ex of [-7,7]){
    const eg=cx.createRadialGradient(ex*sc,-2*sc,0.5,ex*sc,-2*sc,10*sc);
    eg.addColorStop(0,'rgba('+glowC+','+(0.9*Math.max(ens,0.15)).toFixed(3)+')');
    eg.addColorStop(1,'rgba('+glowC+',0)');
    cx.fillStyle=eg; cx.beginPath(); cx.arc(ex*sc,-2*sc,10*sc,0,TAU); cx.fill();
  }
  cx.restore();
  cx.fillStyle='rgba('+glowC+','+(0.5+0.4*ens).toFixed(3)+')';
  for(const ex of [-7,7]){ cx.beginPath(); cx.arc(ex*sc,-2*sc,3*sc,0,TAU); cx.fill(); }
  // teeth
  cx.strokeStyle='rgba(30,28,22,0.4)'; cx.lineWidth=1.4*sc;
  for(let k=-3;k<=3;k++){ cx.beginPath(); cx.moveTo(k*3*sc,6*sc); cx.lineTo(k*3*sc,14*sc); cx.stroke(); }

  // --- the jagged gold crown, riding the skull while whole; tipping and shedding as it splits ---
  if(crown>0.02){
    cx.save();
    // as `crown`->0 it tips off and falls forward-left, fading
    const fall=(1-crown);
    cx.translate(-fall*26*sc, fall*30*sc);
    cx.rotate(-fall*0.9);
    cx.globalAlpha=Math.min(1,crown);
    cx.fillStyle='#ffd76a';
    const cy=-20*sc;
    cx.fillRect(-16*sc,cy,32*sc,6*sc);                         // the band
    cx.beginPath();                                           // the jagged points
    cx.moveTo(-16*sc,cy);
    cx.lineTo(-12*sc,cy-11*sc); cx.lineTo(-8*sc,cy);
    cx.lineTo(-3*sc,cy-13*sc);  cx.lineTo(2*sc,cy);
    cx.lineTo(7*sc,cy-11*sc);   cx.lineTo(12*sc,cy);
    cx.lineTo(16*sc,cy-9*sc);   cx.lineTo(16*sc,cy);
    cx.closePath(); cx.fill();
    // a couple of dark gem-sockets on the band
    cx.fillStyle='#8a5a12';
    cx.beginPath(); cx.arc(-6*sc,cy+3*sc,1.6*sc,0,TAU); cx.arc(6*sc,cy+3*sc,1.6*sc,0,TAU); cx.fill();
    cx.restore();
  }
  cx.restore();   // skull

  cx.lineCap='butt';
  cx.restore();
}

// the curse shattering: a pale-green release-ring and violet fragments blowing off the skull
function hsShatter(cx,x,y,s){
  cx.save(); cx.globalCompositeOperation='lighter';
  const R=Math.max(HS.W,HS.H)*0.5*(1-s);
  for(let i=0;i<3;i++){ const r=R*(0.4+i*0.34);
    cx.strokeStyle='rgba('+(150+i*20)+','+(220-i*20)+','+(180+i*10)+','+(0.5*s).toFixed(3)+')';
    cx.lineWidth=(5-i*1.4); cx.beginPath(); cx.arc(x,y,r,0,TAU); cx.stroke(); }
  const bg=cx.createRadialGradient(x,y,2,x,y,Math.max(HS.W,HS.H)*0.3*s);
  bg.addColorStop(0,'rgba(190,240,205,'+(0.6*s).toFixed(3)+')'); bg.addColorStop(1,'rgba(170,225,190,0)');
  cx.fillStyle=bg; cx.beginPath(); cx.arc(x,y,Math.max(HS.W,HS.H)*0.3*s,0,TAU); cx.fill();
  cx.restore();
}

/* ---------- public entry point (called from killMob's boss branch in 09-gameplay.js) ---------- */
function hollowSpiritCutscene(onDone){
  hsPlay(HS_BEATS, {ens:1, calm:0, crown:1, rest:0}, onDone);
}
window.hollowSpiritCutscene=hollowSpiritCutscene;

})();
