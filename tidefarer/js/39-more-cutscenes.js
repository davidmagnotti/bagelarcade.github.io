/* =====================================================================
   THREE MORE FREEING CUTSCENES - the Weeping Warden, the Rimebound, and
   the Storm-Eye.
   -----------------------------------------------------------------------
   The same self-contained rAF overlay the Leviathan freeing uses
   (38-leviathan-cutscene.js): one paused-world scene over the shared dgOv
   canvas, click-to-advance dialogue, a full-frame composed picture, and
   graceful fall-through to onDone if the overlay DOM is missing.

   All three were flagged in STORY.md as candidates for the freed-victim
   bookend the Leviathan already got:

     * wardenFreedCutscene(m,onDone)   - the Frozen Isle's surface guardian,
       Vath's violet sloughing off as the cruel cold breaks into a soft
       ordinary winter; a robed figure watches from the glacier road and
       is gone (the Vath reveal).
     * rimeboundFreedCutscene(m,onDone)- the deep ice-whale of the Rimefissure,
       the violet bleeding out as it settles calm into the melt and sinks.
     * stormEyeCutscene(onDone)        - the Rainbow Road's final boss: the
       shielded storm-core guts itself into mist, the high wind falls still,
       and the cloud-vault opens north of the Broken Crown.

   One shared driver (MC) runs whichever scene is asked for; the three never
   overlap (they are boss-freeing beats), so sharing the overlay is safe.
   ===================================================================== */
(function(){
'use strict';

/* ---------- scene state ---------- */
const MC = {
  raf:0, prev:0, t:0, running:false, ended:false, started:false, idx:0,
  cv:null, cx:null, W:0, H:0,
  beats:null, onDone:null, kind:'', m:null,
  // eased visual state
  ens:1,     // 1 = still bound in Vath's violet, 0 = free
  calm:0,    // 0 = the scene at its worst, 1 = settled and quiet
  vath:0,    // the robed figure resolving on the ridge/wall
  snow:0,    // gentle fall (warden) / brightening (others)
  dive:0,    // the freed thing sinking / dissipating as the scene ends
  // one-shots (decay per frame)
  flash:0, shake:0, shatter:0,
  motes:[], _macc:0,
  _autoTO:null, _titleTO:null,
};

/* ---------- beat tables ---------- */
const MC_WARDEN = [
  { who:'', html:'', ens:1, calm:0, snow:0, vath:0, shake:0.55, hold:1500 },
  { who:'', html:'', ens:0.12, calm:0.5, snow:0.5, shatter:1, flash:1.05, shake:0.6, hold:1700 },
  { who:'', html:'<i>The violet sloughs away like rotten ice. The Warden lifts its great head — itself again — and weeps, clean meltwater running down the old blue ice. The killing cold breaks.</i>',
    ens:0, calm:0.9, snow:0.8 },
  { who:'', html:'<i>A soft, ordinary winter settles back over Hearthhold: deep kind snow, and the life creeping back into the strait — seals on the floes, fish beneath them.</i>',
    ens:0, calm:1, snow:1 },
  { who:'', html:'', vath:1, calm:1, snow:1, title:'THE WEEPING WARDEN, FREED', hold:2100 },
  { who:'', html:'<i>High on the glacier road a robed figure watches — </i><b style="color:#c9a0ff">violet at the cuffs</b><i> — the hand that twisted the cold. It turns, and the snow closes over where it stood. He was here.</i>',
    vath:0.55, calm:1, snow:1 },
];

const MC_RIME = [
  { who:'', html:'', ens:1, calm:0, shake:0.5, hold:1500 },
  { who:'', html:'', ens:0.12, calm:0.55, shatter:1, flash:1.0, shake:0.6, hold:1700 },
  { who:'The Rimebound, Unbound',
    html:'<b style="color:#8fd8ff">"…cold. So long in the cold."</b> <i>The violet bleeds out of the great ice-thing — a whale of the deep, once, that swam too near the killing frost and never found the warm dark again.</i>',
    ens:0, calm:0.9 },
  { who:'',
    html:'<i>Unbound, it settles calm into the melt. Whoever bound it — the robed man the whole strait speaks of — is always one island ahead. But the trail is warming.</i>',
    ens:0, calm:1 },
  { who:'', html:'', calm:1, title:'THE RIMEBOUND, FREED', hold:2100 },
];

const MC_STORM = [
  { who:'', html:'', ens:1, calm:0, shake:0.6, flash:0.5, hold:1400 },
  { who:'', html:'<i>The storm-eye guts itself into harmless mist. The shrieking wind that soured the whole rainbow road falls — all at once — to nothing.</i>',
    ens:0.1, calm:0.7 },
  { who:'', html:'', calm:1, title:'THE STORM-EYE CLOSES', hold:1900 },
  { who:'',
    html:'<i>The high wind lies still and the rainbow runs quiet at last. North of the Broken Crown a ward of light unknots — and a small vault opens onto the cloud, something the crown kept, waiting there for you.</i>',
    calm:1 },
];

// Vath, beaten on the Emberwick green, bound by his own compulsion into the old
// standing stone - sealed, not slain, vowing return. `dive` = how far he is folded
// into the stone (0 standing, 1 gone).
const MC_VATH = [
  { who:'', html:'', ens:1, calm:0, dive:0, shake:0.55, hold:1400 },
  { who:'', html:'<i>You cut the violet cords one by one — and the last, freed, whips back and takes HIM, his own leash closing on his own throat.</i>',
    ens:1, dive:0, shatter:1, flash:0.7, shake:0.6 },
  { who:'Vath', html:'<b style="color:#c9a0ff">“Clever. Cruel. You’d have woven a fine binding yourself.”</b>',
    ens:0.9, dive:0.25 },
  { who:'', html:'', ens:0.7, dive:0.7, flash:0.95, shake:0.5, hold:1500 },
  { who:'Vath', html:'<b style="color:#c9a0ff">“No stone holds forever, first mate. Your blood has caged me before — a lifetime ago, and lifetimes before that. Every seal your line ever set, I have outwaited. I will thaw. I will come back.”</b>',
    ens:0.4, dive:0.9, title:'VATH IS BOUND' },
  { who:'', html:'<i>Then quiet — the violet light dying in the grass, and the old stone standing as it has always stood.</i>',
    ens:0.08, dive:1, calm:1 },
];

// The cursed tome of the Underclimb, burning at last - the maddened sky remembers
// itself and the raptors' minds return. Same enthrall/freed family, but the victim
// (the whole aerie) is off-screen above; a robed after-image gives the Vath reveal.
const MC_AERIE = [
  { who:'', html:'', ens:1, calm:0, shake:0.4, hold:1400 },
  { who:'', html:'', ens:0.3, calm:0.4, shatter:1, flash:1.0, shake:0.5, hold:1600 },
  { who:'', html:'<i>The cursed tome curls to violet ash. Far above — all at once, and mid-cry — the screaming stops. The raptors’ minds are their own again.</i>',
    ens:0.1, calm:0.85 },
  { who:'', html:'', calm:1, title:'THE TOME BURNS', hold:1800 },
  { who:'', html:'<i>A </i><b style="color:#c9a0ff">robed man</b><i> climbed the Underclimb quiet as smoke, they will tell you — </i><b style="color:#c9a0ff">violet at his sleeves</b><i> — worked this ruin on the sky, and never came down the same. He was here.</i>',
    vath:0.5, calm:1 },
];

/* ---------- driver ---------- */
function mcResize(){
  const cv=MC.cv; if(!cv) return;
  const r=cv.getBoundingClientRect();
  const dpr=Math.min(2, window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));
  cv.height=Math.max(1,Math.round(r.height*dpr));
  MC.cx.setTransform(dpr,0,0,dpr,0,0);
  MC.W=r.width; MC.H=r.height;
}
function mcPlay(kind, beats, init, onDone, m){
  const ov=document.getElementById('dgOv');
  const cv=document.getElementById('dgCv');
  if(!ov||!cv){ if(typeof onDone==='function'){ try{ onDone(); }catch(e){} } return; }  // graceful fallback
  MC.kind=kind; MC.beats=beats; MC.onDone=onDone||null; MC.m=m||null;
  MC.cv=cv; MC.cx=cv.getContext('2d');
  MC.t=0; MC.prev=0; MC.idx=0; MC._macc=0;
  MC.ens=1; MC.calm=0; MC.vath=0; MC.snow=0; MC.dive=0; MC.flash=0; MC.shake=0; MC.shatter=0;
  if(init) Object.assign(MC, init);
  MC.motes.length=0;
  MC.ended=false; MC.started=false; MC.running=true;
  const title=document.getElementById('dgTitle'), sub=document.getElementById('dgSub');
  if(sub) sub.classList.remove('show'); if(title) title.classList.remove('show');
  ov.style.display='flex';
  if(typeof G!=='undefined'){ G.paused=true; G._credits=1; }
  if(typeof cinematic==='function') cinematic(true);
  mcResize();
  window.addEventListener('resize', mcResize);
  setTimeout(()=>mcShow(0), 500);
  ov.onclick=()=>{ if(MC.ended || !MC.started) return; mcNext(); };
  cancelAnimationFrame(MC.raf);
  MC.raf=requestAnimationFrame(mcLoop);
}
function mcShow(i){
  const b=MC.beats[i]; if(!b) return;
  MC.idx=i; MC.started=true;
  clearTimeout(MC._autoTO);
  if(b.flash)   MC.flash=Math.max(MC.flash, b.flash);
  if(b.shake)   MC.shake=Math.max(MC.shake, b.shake);
  if(b.shatter){ MC.shatter=1; if(typeof Snd!=='undefined'&&Snd.magic) Snd.magic(); }
  const who=document.getElementById('dgWho'), line=document.getElementById('dgLine');
  if(who) who.textContent=b.who||'';
  if(line) line.innerHTML=b.html||'';
  const sub=document.getElementById('dgSub');
  const wordless=!(b.html||'').replace(/<[^>]*>/g,'').trim();
  if(wordless){
    if(sub) sub.classList.remove('show');
    MC._autoTO=setTimeout(()=>mcNext(), b.hold||1700);
  } else {
    const tap=document.getElementById('dgTap');
    if(tap){
      const last=(i>=MC.beats.length-1);
      tap.textContent = last
        ? (MC.kind==='storm'?'take the high road ›' : MC.kind==='rime'?'let it rest in the deep ›'
           : MC.kind==='vath'?'turn to your brother ›' : MC.kind==='aerie'?'climb to the light ›' : 'walk back down ›')
        : 'click to continue ›';
    }
    if(sub){ sub.classList.remove('show'); void sub.offsetWidth; sub.classList.add('show'); }
  }
  if(b.title){
    const t=document.getElementById('dgTitle'), tt=document.getElementById('dgTitleT');
    if(t&&tt){ tt.textContent=b.title; t.classList.remove('show'); void t.offsetWidth;
      t.classList.add('show'); clearTimeout(MC._titleTO);
      MC._titleTO=setTimeout(()=>t.classList.remove('show'), 2600); }
  }
}
function mcNext(){
  clearTimeout(MC._autoTO);
  if(MC.idx>=MC.beats.length-1){ mcFinish(); return; }
  const sub=document.getElementById('dgSub'); if(sub) sub.classList.remove('show');
  setTimeout(()=>mcShow(MC.idx+1), 300);
}
function mcFinish(){
  if(MC.ended) return;
  MC.ended=true;   // the driver eases MC.dive toward 1 now, so the freed thing settles/sinks
  const sub=document.getElementById('dgSub'); if(sub) sub.classList.remove('show');
  const title=document.getElementById('dgTitle'); if(title) title.classList.remove('show');
  setTimeout(mcEnd, 1400);
}
function mcEnd(){
  MC.running=false; cancelAnimationFrame(MC.raf);
  window.removeEventListener('resize', mcResize);
  const ov=document.getElementById('dgOv'); if(ov){ ov.style.display='none'; ov.onclick=null; }
  if(typeof G!=='undefined'){ G._credits=0; G.paused=false; }
  if(typeof cinematic==='function') cinematic(false);
  const done=MC.onDone; MC.onDone=null;
  if(typeof done==='function'){ try{ done(); }catch(e){} }
}
function mcLoop(ts){
  if(!MC.running) return;
  if(!MC.prev) MC.prev=ts;
  let dt=(ts-MC.prev)/1000; MC.prev=ts;
  if(dt>0.05) dt=0.05;
  MC.t+=dt;
  const b=MC.beats[MC.idx]||MC.beats[0];
  const e=(cur,tgt,k)=>cur+(tgt-cur)*Math.min(1,dt*k);
  MC.ens  = e(MC.ens,  b.ens!=null?b.ens:MC.ens,   2.0);
  MC.calm = e(MC.calm, b.calm!=null?b.calm:MC.calm, 1.6);
  MC.vath = e(MC.vath, b.vath!=null?b.vath:MC.vath, 1.8);
  MC.snow = e(MC.snow, b.snow!=null?b.snow:MC.snow, 1.4);
  MC.dive = e(MC.dive, (b.dive!=null?b.dive:(MC.ended?1:0)), 1.1);
  MC.flash  = Math.max(0, MC.flash  - dt*2.6);
  MC.shake  = Math.max(0, MC.shake*(1-MC.calm*0.5) - dt*1.8);
  MC.shatter= Math.max(0, MC.shatter- dt*1.2);
  mcMotes(dt);
  mcDraw();
  MC.raf=requestAnimationFrame(mcLoop);
}

/* ---------- particles: violet clings while bound; cold/bright spray blows out on the break ---- */
function mcMotes(dt){
  const cxm=MC.W*0.5, cy=MC.H*(MC.kind==='storm'?0.40:MC.kind==='aerie'?0.52:0.5);
  const cold = (MC.kind==='warden'||MC.kind==='rime');
  if(MC.kind==='vath'){
    // Vath's violet does not blow free - it collapses INWARD, dragging him into the stone.
    // A steady inward rain of violet motes, thicker as he is folded in (dive) or on the snap.
    const rate = 22*MC.ens + 40*MC.shatter + 30*(MC.dive*(1-MC.dive)*4);
    MC._macc+=dt*rate; let n=Math.floor(MC._macc); MC._macc-=n; if(n>4) n=4;
    for(let i=0;i<n;i++){ const a=Math.random()*TAU, r=Math.max(MC.W,MC.H)*(0.18+Math.random()*0.22);
      MC.motes.push({x:cxm+Math.cos(a)*r, y:cy+Math.sin(a)*r*0.7, tx:cxm, ty:cy, life:1,
        col:Math.random()<0.5?'160,110,240':'199,123,255', size:rnd(2,4.4)}); }
  } else if(MC.kind==='aerie' && MC.shatter>0.02){
    // the tome burns: violet-and-ember embers stream UP off the pyre
    MC._macc+=dt*54*MC.shatter; let n=Math.floor(MC._macc); MC._macc-=n; if(n>5) n=5;
    for(let i=0;i<n;i++){ const a=Math.random()*TAU, sp=rnd(40,150);
      MC.motes.push({x:cxm+rnd(-18,18), y:cy, vx:Math.cos(a)*sp*0.5, vy:-rnd(60,180), life:1,
        col:Math.random()<0.5?'199,123,255':'255,150,70', size:rnd(2,4.6)}); }
  } else if(MC.shatter>0.02){
    MC._macc+=dt*46*MC.shatter; let n=Math.floor(MC._macc); MC._macc-=n; if(n>4) n=4;
    for(let i=0;i<n;i++){ const a=Math.random()*TAU, sp=rnd(80,260);
      MC.motes.push({x:cxm, y:cy, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-60, life:1,
        col: cold ? (Math.random()<0.5?'190,230,255':'230,245,255') : (Math.random()<0.5?'210,225,245':'180,205,235'),
        size:rnd(2,4.6)}); }
  } else if(MC.ens>0.3){
    MC._macc+=dt*20*MC.ens; let n=Math.floor(MC._macc); MC._macc-=n; if(n>3) n=3;
    for(let i=0;i<n;i++){ const a=Math.random()*TAU, r=30+Math.random()*24;
      MC.motes.push({x:cxm+Math.cos(a)*r, y:cy+Math.sin(a)*r*0.6, tx:cxm, ty:cy, life:1,
        col:Math.random()<0.5?'160,110,240':'190,140,255', size:rnd(2,4)}); }
  }
  for(const m of MC.motes){
    if(m.tx!=null){ m.x+=(m.tx-m.x)*Math.min(1,dt*2.0); m.y+=(m.ty-m.y)*Math.min(1,dt*2.0); m.life-=dt*1.1; }
    else { m.x+=m.vx*dt; m.y+=m.vy*dt; m.vy+=(cold?64:MC.kind==='aerie'?-6:30)*dt; m.life-=dt*0.85; }
  }
  MC.motes=MC.motes.filter(m=>m.life>0);
}

/* ---------- draw dispatch ---------- */
function mcDraw(){
  const cx=MC.cx, W=MC.W, H=MC.H, t=MC.t; if(!cx||!W) return;
  const sh=MC.shake, ox=(Math.random()*2-1)*sh*8, oy=(Math.random()*2-1)*sh*8;
  cx.save(); cx.translate(ox,oy);

  if(MC.kind==='warden')      drawWardenScene(cx,W,H,t);
  else if(MC.kind==='rime')   drawRimeScene(cx,W,H,t);
  else if(MC.kind==='storm')  drawStormScene(cx,W,H,t);
  else if(MC.kind==='vath')   drawVathScene(cx,W,H,t);
  else if(MC.kind==='aerie')  drawAerieScene(cx,W,H,t);

  // motes
  cx.save(); cx.globalCompositeOperation='lighter';
  for(const m of MC.motes){
    cx.globalAlpha=Math.max(0,Math.min(1,m.life));
    cx.fillStyle='rgba('+m.col+',0.9)';
    cx.beginPath(); cx.arc(m.x,m.y,m.size,0,TAU); cx.fill();
  }
  cx.globalAlpha=1; cx.restore();

  // the break flash - tinted to the scene (cold for frost/sky, violet for Vath, warm for the pyre)
  if(MC.flash>0.01){
    const fc = MC.kind==='vath' ? '199,140,255' : MC.kind==='aerie' ? '255,196,120' : '226,244,255';
    cx.fillStyle='rgba('+fc+','+(0.5*MC.flash).toFixed(3)+')'; cx.fillRect(0,0,W,H);
  }
  cx.restore();  // shake

  // vignette
  const vg=cx.createRadialGradient(W*0.5,H*0.5,H*0.2,W*0.5,H*0.5,H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.6)');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);
}

/* ===================== WARDEN ===================== */
function drawWardenScene(cx,W,H,t){
  const ens=MC.ens, calm=MC.calm, snow=MC.snow, horizon=H*0.66;
  // sky: violet bruise while bound, clearing to cold blue
  const sky=cx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0, mixHex('#0a1420','#170e28', Math.min(1,ens*0.7)));
  sky.addColorStop(1, mixHex('#28414f','#2a1a3e', Math.min(1,ens*0.5)));
  cx.fillStyle=sky; cx.fillRect(0,0,W,horizon+2);
  // a cold aurora glow that steadies as the cruelty lifts
  cx.save(); cx.globalCompositeOperation='lighter';
  const ag=cx.createLinearGradient(0,0,0,horizon);
  ag.addColorStop(0,'rgba(120,200,190,0)');
  ag.addColorStop(0.5,'rgba(120,210,200,'+(0.10*calm).toFixed(3)+')');
  ag.addColorStop(1,'rgba(120,210,200,0)');
  cx.fillStyle=ag; cx.fillRect(0,0,W,horizon);
  cx.restore();
  // glacier ground
  const gr=cx.createLinearGradient(0,horizon,0,H);
  gr.addColorStop(0, mixHex('#42607a','#2a1c40', Math.min(1,ens*0.5)));
  gr.addColorStop(1, '#0c1622');
  cx.fillStyle=gr; cx.fillRect(0,horizon,W,H-horizon);
  // a ridge line across the upper glacier, where Vath will stand
  cx.fillStyle=mixHex('#33506a','#241a38',Math.min(1,ens*0.5));
  cx.beginPath(); cx.moveTo(0,horizon);
  cx.lineTo(W*0.30,horizon-18); cx.lineTo(W*0.55,horizon-6);
  cx.lineTo(W*0.80,horizon-22); cx.lineTo(W,horizon-8); cx.lineTo(W,horizon); cx.closePath(); cx.fill();

  // the Warden - a great crystalline ice-guardian at center
  drawWardenFigure(cx, W*0.5, horizon+6, Math.min(W,H)*0.24, ens, calm, t);

  // Vath watching from the ridge
  if(MC.vath>0.02) drawVathFigure(cx, W*0.78, horizon-20, Math.min(W,H)*0.085, MC.vath);

  // gentle snow as the kind winter returns
  if(snow>0.02) drawGentleSnow(cx,W,H,t,snow);
}
function drawWardenFigure(cx,x,footY,s,ens,calm,t){
  const bob=Math.sin(t*0.9)*s*0.02;
  const bodyCol = mixHex('#8fbfd6', '#5a3a86', Math.min(1,ens*0.8));   // blue when free, violet when bound
  const edge    = mixHex('#dff0fb', '#c9a0ff', Math.min(1,ens*0.8));
  cx.save(); cx.translate(x, footY+bob);
  // aura
  cx.save(); cx.globalCompositeOperation='lighter';
  const au=cx.createRadialGradient(0,-s*0.7,4,0,-s*0.7,s*1.3);
  au.addColorStop(0, (ens>0.4?'rgba(170,110,240,':'rgba(150,215,240,')+(0.28+0.2*calm).toFixed(3)+')');
  au.addColorStop(1, (ens>0.4?'rgba(170,110,240,0)':'rgba(150,215,240,0)'));
  cx.fillStyle=au; cx.beginPath(); cx.arc(0,-s*0.7,s*1.3,0,TAU); cx.fill();
  cx.restore();
  // body: a broad faceted ice torso
  cx.fillStyle=bodyCol; cx.strokeStyle=edge; cx.lineWidth=Math.max(1,s*0.02);
  cx.beginPath();
  cx.moveTo(0,-s*1.35);                       // crown
  cx.lineTo(s*0.42,-s*0.95);
  cx.lineTo(s*0.6,-s*0.1);
  cx.lineTo(s*0.34, s*0.02);
  cx.lineTo(-s*0.34, s*0.02);
  cx.lineTo(-s*0.6,-s*0.1);
  cx.lineTo(-s*0.42,-s*0.95);
  cx.closePath(); cx.fill(); cx.stroke();
  // faceting
  cx.strokeStyle='rgba(255,255,255,'+(0.18+0.12*calm).toFixed(3)+')'; cx.lineWidth=Math.max(1,s*0.012);
  cx.beginPath(); cx.moveTo(0,-s*1.35); cx.lineTo(0,-s*0.1);
  cx.moveTo(-s*0.42,-s*0.6); cx.lineTo(s*0.42,-s*0.6);
  cx.moveTo(-s*0.28,-s*0.95); cx.lineTo(s*0.28,-s*0.3); cx.stroke();
  // head node + two eyes
  cx.fillStyle=mixHex('#bfe4f4','#7a52a8',Math.min(1,ens*0.8));
  cx.beginPath(); cx.ellipse(0,-s*1.05,s*0.2,s*0.24,0,0,TAU); cx.fill();
  cx.save(); cx.globalCompositeOperation='lighter';
  const eyeC = ens>0.4?'rgba(210,150,255,':'rgba(150,225,255,';
  for(const sgn of [-1,1]){ const ex=sgn*s*0.09, ey=-s*1.06;
    const eg=cx.createRadialGradient(ex,ey,0,ex,ey,s*0.1); eg.addColorStop(0,eyeC+'0.95)'); eg.addColorStop(1,eyeC+'0)');
    cx.fillStyle=eg; cx.beginPath(); cx.arc(ex,ey,s*0.1,0,TAU); cx.fill(); }
  cx.restore();
  // violet binding cracks while bound
  if(ens>0.06){ cx.strokeStyle='rgba(199,123,255,'+(0.5*ens).toFixed(3)+')'; cx.lineWidth=Math.max(1,s*0.02);
    cx.beginPath(); cx.moveTo(-s*0.2,-s*1.0); cx.lineTo(-s*0.05,-s*0.55); cx.lineTo(-s*0.22,-s*0.15);
    cx.moveTo(s*0.24,-s*0.8); cx.lineTo(s*0.08,-s*0.4); cx.stroke(); }
  // it weeps: clean meltwater tears streak down as the cold breaks
  if(calm>0.2){ cx.strokeStyle='rgba(190,230,250,'+(0.5*calm).toFixed(3)+')'; cx.lineWidth=Math.max(1,s*0.014);
    for(const sgn of [-1,1]){ const ex=sgn*s*0.09;
      const drip=(t*0.5+ (sgn>0?0.3:0))%1;
      cx.beginPath(); cx.moveTo(ex,-s*1.0); cx.lineTo(ex, -s*1.0 + drip*s*0.9); cx.stroke(); } }
  cx.restore();
}

/* ===================== RIMEBOUND ===================== */
function drawRimeScene(cx,W,H,t){
  const ens=MC.ens, calm=MC.calm, dive=MC.dive, waterY=H*0.66;
  // ice cavern: near-black walls, a violet-poisoned blue easing to clean blue
  const bg=cx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#060a12');
  bg.addColorStop(0.55, mixHex('#0d1826','#160e28', Math.min(1,ens*0.7)));
  bg.addColorStop(1, mixHex('#12293a','#12102a', Math.min(1,ens*0.5)));
  cx.fillStyle=bg; cx.fillRect(0,0,W,H);
  // jagged ice pillars flanking
  cx.fillStyle='#0a1420';
  for(const sgn of [-1,1]){ const bx=sgn<0?W*0.1:W*0.9, w=W*0.1;
    cx.beginPath(); cx.moveTo(bx-w,H); cx.lineTo(bx-w*0.6,H*0.12); cx.lineTo(bx+w*0.5,H*0.06);
    cx.lineTo(bx+w,H*0.3); cx.lineTo(bx+w*0.6,H); cx.closePath(); cx.fill(); }
  // the frozen pool
  const pool=cx.createLinearGradient(0,waterY,0,H);
  pool.addColorStop(0, mixHex('#1c3a4c','#1a1030', Math.min(1,ens*0.5)));
  pool.addColorStop(1, '#081420');
  cx.fillStyle=pool; cx.fillRect(0,waterY,W,H-waterY);
  // ripples
  cx.strokeStyle='rgba(150,210,235,'+(0.14+0.12*calm).toFixed(3)+')'; cx.lineWidth=1.2;
  for(let r=0;r<5;r++){ const yy=waterY+ (H-waterY)*(r/5)+6;
    cx.beginPath(); for(let xx=0;xx<=W;xx+=16){ const py=yy+Math.sin(xx*0.03+t*1.4+r)*(2+2*(1-calm)); xx===0?cx.moveTo(xx,py):cx.lineTo(xx,py); } cx.stroke(); }

  // the great ice-whale, breaching the pool, sinking as dive rises
  drawRimeWhale(cx, W*0.5, waterY - Math.min(W,H)*0.02 + dive*Math.min(W,H)*0.16, Math.min(W,H)*0.30, ens, calm, dive, t);

  // the binding shatter rings
  if(MC.shatter>0.02) shatterRings(cx, W*0.5, waterY-Math.min(W,H)*0.1, MC.shatter);
}
function drawRimeWhale(cx,x,y,s,ens,calm,dive,t){
  const bob=Math.sin(t*1.0)*s*0.02;
  const body=mixHex('#6fa6c4','#4a2f78',Math.min(1,ens*0.8));
  const belly=mixHex('#cfeaf6','#7a5aa0',Math.min(1,ens*0.7));
  cx.save(); cx.translate(x,y+bob); cx.globalAlpha=Math.max(0,1-dive*0.85);
  // aura
  cx.save(); cx.globalCompositeOperation='lighter';
  const au=cx.createRadialGradient(0,-s*0.3,4,0,-s*0.3,s*1.1);
  au.addColorStop(0,(ens>0.4?'rgba(170,110,240,':'rgba(150,215,240,')+(0.26+0.16*calm).toFixed(3)+')');
  au.addColorStop(1,(ens>0.4?'rgba(170,110,240,0)':'rgba(150,215,240,0)'));
  cx.fillStyle=au; cx.beginPath(); cx.arc(0,-s*0.3,s*1.1,0,TAU); cx.fill(); cx.restore();
  // body: a broad rounded back breaching, big head to the left
  cx.fillStyle=body; cx.strokeStyle=mixHex('#bfe4f4','#c9a0ff',Math.min(1,ens*0.7)); cx.lineWidth=Math.max(1,s*0.015);
  cx.beginPath();
  cx.moveTo(-s*0.95,-s*0.05);
  cx.bezierCurveTo(-s*0.8,-s*0.55, s*0.2,-s*0.62, s*0.7,-s*0.28);   // arched back
  cx.bezierCurveTo(s*0.95,-s*0.12, s*0.95, s*0.05, s*0.8, s*0.06);
  cx.lineTo(-s*0.9, s*0.06);
  cx.closePath(); cx.fill(); cx.stroke();
  // belly sheen
  cx.fillStyle=belly; cx.globalAlpha*=0.5;
  cx.beginPath(); cx.moveTo(-s*0.85,0); cx.bezierCurveTo(-s*0.5,-s*0.12,s*0.4,-s*0.12,s*0.7,-s*0.04); cx.lineTo(s*0.7,s*0.05); cx.lineTo(-s*0.85,s*0.05); cx.closePath(); cx.fill();
  cx.globalAlpha=Math.max(0,1-dive*0.85);
  // eye
  cx.save(); cx.globalCompositeOperation='lighter';
  const ec=ens>0.4?'rgba(210,150,255,':'rgba(150,225,255,';
  const eg=cx.createRadialGradient(-s*0.6,-s*0.28,0,-s*0.6,-s*0.28,s*0.14); eg.addColorStop(0,ec+'0.9)'); eg.addColorStop(1,ec+'0)');
  cx.fillStyle=eg; cx.beginPath(); cx.arc(-s*0.6,-s*0.28,s*0.14,0,TAU); cx.fill(); cx.restore();
  cx.fillStyle='#0a1418'; cx.beginPath(); cx.arc(-s*0.6,-s*0.28,s*0.05,0,TAU); cx.fill();
  // ice-crust facets on the back
  cx.strokeStyle='rgba(220,240,255,'+(0.2+0.14*calm).toFixed(3)+')'; cx.lineWidth=Math.max(1,s*0.01);
  cx.beginPath(); cx.moveTo(-s*0.3,-s*0.55); cx.lineTo(-s*0.2,-s*0.2); cx.moveTo(s*0.1,-s*0.55); cx.lineTo(s*0.2,-s*0.2); cx.stroke();
  // violet binding rings while bound
  if(ens>0.06){ const gl=(0.35+0.3*Math.sin(t*3))*ens;
    cx.strokeStyle='rgba(199,123,255,'+gl.toFixed(3)+')'; cx.lineWidth=Math.max(2,s*0.03);
    cx.beginPath(); cx.ellipse(-s*0.1,-s*0.2,s*0.7,s*0.34,0,0,TAU); cx.stroke(); }
  cx.restore();
}

/* ===================== STORM-EYE ===================== */
function drawStormScene(cx,W,H,t){
  const ens=MC.ens, calm=MC.calm, dive=MC.dive;
  // high sky over the cloud isles: storm-dark clearing to a soft dawn as the wind dies
  const sky=cx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0, mixHex('#131a2c','#3a4a6a', calm*0.7));
  sky.addColorStop(0.6, mixHex('#20304a','#6a7ea0', calm*0.6));
  sky.addColorStop(1, mixHex('#2a3c56','#c9b48a', calm*0.5));
  cx.fillStyle=sky; cx.fillRect(0,0,W,H);
  // the rainbow band arcing behind, brightening as it runs quiet
  cx.save(); cx.globalCompositeOperation='lighter';
  const cols=['255,120,120','255,190,110','245,230,120','130,220,140','120,190,255','170,140,240'];
  for(let i=0;i<cols.length;i++){
    cx.strokeStyle='rgba('+cols[i]+','+(0.10+0.16*calm).toFixed(3)+')'; cx.lineWidth=Math.max(2,H*0.012);
    cx.beginPath(); cx.arc(W*0.5, H*1.15, H*0.62 - i*H*0.014, Math.PI*1.15, Math.PI*1.85); cx.stroke();
  }
  cx.restore();
  // wind streaks that fall still as calm rises (fewer, slower)
  const gust=1-calm;
  if(gust>0.05){ cx.strokeStyle='rgba(210,228,248,'+(0.18*gust).toFixed(3)+')'; cx.lineWidth=1.4;
    for(let i=0;i<26;i++){ const fx=((i*61)%100)/100, fy=((i*97)%100)/100;
      const sx=((fx*1.2 - t*0.5*gust)%1+1)%1*W; const sy=fy*H*0.8;
      cx.beginPath(); cx.moveTo(sx,sy); cx.lineTo(sx- (30+40*gust), sy+4); cx.stroke(); } }
  // cloud isles silhouettes low
  cx.fillStyle=mixHex('#1a2740','#8a94ac',calm*0.5);
  for(const [cxr,cw] of [[0.2,0.16],[0.5,0.22],[0.82,0.15]]){
    const bx=W*cxr, y=H*0.82;
    cx.beginPath(); cx.ellipse(bx,y,W*cw,H*0.05,0,0,TAU); cx.fill(); }
  // the vault of light opening north as the scene settles
  if(calm>0.6){ cx.save(); cx.globalCompositeOperation='lighter';
    const vx=W*0.5, vy=H*0.30, vr=Math.min(W,H)*0.12*(calm-0.6)/0.4;
    const vg=cx.createRadialGradient(vx,vy,1,vx,vy,vr*2.4);
    vg.addColorStop(0,'rgba(255,240,190,'+(0.5*(calm-0.6)/0.4).toFixed(3)+')'); vg.addColorStop(1,'rgba(255,240,190,0)');
    cx.fillStyle=vg; cx.beginPath(); cx.arc(vx,vy,vr*2.4,0,TAU); cx.fill(); cx.restore(); }

  // the Storm-Eye core, guttering into mist as dive rises
  drawStormEye(cx, W*0.5, H*0.40, Math.min(W,H)*0.16, ens, dive, t);
}
function drawStormEye(cx,x,y,s,ens,dive,t){
  const a=Math.max(0,1-dive);
  cx.save(); cx.translate(x,y); cx.globalAlpha=a;
  // swirling storm disc
  cx.save(); cx.globalCompositeOperation='lighter';
  const dg=cx.createRadialGradient(0,0,2,0,0,s*1.5);
  dg.addColorStop(0,'rgba(120,170,230,0.5)'); dg.addColorStop(0.6,'rgba(80,120,190,0.25)'); dg.addColorStop(1,'rgba(80,120,190,0)');
  cx.fillStyle=dg; cx.beginPath(); cx.arc(0,0,s*1.5,0,TAU); cx.fill();
  cx.restore();
  // dark cloud body with spiral arms
  cx.fillStyle='rgba(24,32,52,'+(0.85*a).toFixed(3)+')';
  cx.beginPath(); cx.arc(0,0,s*0.9,0,TAU); cx.fill();
  cx.strokeStyle='rgba(150,180,230,'+(0.35*a).toFixed(3)+')'; cx.lineWidth=Math.max(1,s*0.05);
  for(let k=0;k<3;k++){ cx.beginPath();
    for(let r=0.2;r<=1;r+=0.12){ const ang=t*0.6 + k*TAU/3 + r*4; const px=Math.cos(ang)*s*0.9*r, py=Math.sin(ang)*s*0.9*r;
      r===0.2?cx.moveTo(px,py):cx.lineTo(px,py); } cx.stroke(); }
  // the shielded slit eye (shield cracks as it dies)
  cx.save(); cx.globalCompositeOperation='lighter';
  const eg=cx.createRadialGradient(0,0,1,0,0,s*0.5);
  eg.addColorStop(0,'rgba(200,235,255,'+(0.9*a).toFixed(3)+')'); eg.addColorStop(1,'rgba(150,210,255,0)');
  cx.fillStyle=eg; cx.beginPath(); cx.arc(0,0,s*0.5,0,TAU); cx.fill(); cx.restore();
  cx.fillStyle='rgba(20,30,48,'+(0.9*a).toFixed(3)+')';
  cx.beginPath(); cx.ellipse(0,0,s*0.16,s*0.42,0,0,TAU); cx.fill();   // slit pupil
  // crackling arcs
  if(ens>0.2){ cx.strokeStyle='rgba(190,225,255,'+(0.5*ens*a).toFixed(3)+')'; cx.lineWidth=Math.max(1,s*0.03);
    for(let b=0;b<3;b++){ const a0=t*2 + b*TAU/3; cx.beginPath(); cx.moveTo(0,0);
      let px=0,py=0; for(let k=0;k<4;k++){ px+=Math.cos(a0+k)*(s*0.3)+rndSteady(b,k)*s*0.1; py+=Math.sin(a0+k)*(s*0.3); cx.lineTo(px,py); } cx.stroke(); } }
  cx.restore();
}

/* ===================== VATH BOUND ===================== */
function drawVathScene(cx,W,H,t){
  const ens=MC.ens, dive=MC.dive, calm=MC.calm, horizon=H*0.72;
  // Emberwick green at dusk: a warm-dark sky bruised violet while he still burns
  const sky=cx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0, mixHex('#141020','#241236', Math.min(1,ens*0.6)));
  sky.addColorStop(1, mixHex('#3a2a34','#3a1c44', Math.min(1,ens*0.5)));
  cx.fillStyle=sky; cx.fillRect(0,0,W,horizon+2);
  // the grass green
  const gr=cx.createLinearGradient(0,horizon,0,H);
  gr.addColorStop(0, mixHex('#243a24','#241832', Math.min(1,ens*0.5)));
  gr.addColorStop(1, '#0d150c');
  cx.fillStyle=gr; cx.fillRect(0,horizon,W,H-horizon);

  const sx=W*0.5, baseY=horizon+10, sh=Math.min(W,H)*0.34;
  // the old standing stone - a tall weathered monolith, glowing violet as he is folded in
  drawStandingStone(cx, sx, baseY, sh, dive, ens, t);
  // Vath before the stone, dissolving into it as dive rises
  const va=Math.max(0,(1-dive)*0.9 + 0.1*(1-calm));
  if(va>0.02){
    // violet cords whipping around him while he still stands
    if(ens>0.1) drawVathCords(cx, sx, baseY - sh*0.42, sh*0.4, ens, t);
    drawVathFigure(cx, sx, baseY - sh*0.42, sh*0.30, va);
  }
}
function drawStandingStone(cx,x,footY,s,dive,ens,t){
  const w=s*0.34, h=s*0.95;
  // the stone body
  cx.save();
  const g=cx.createLinearGradient(x-w,footY-h,x+w,footY);
  g.addColorStop(0,'#3b3a42'); g.addColorStop(0.5, mixHex('#4a4852','#3a2456',Math.min(1,dive))); g.addColorStop(1,'#26252c');
  cx.fillStyle=g;
  cx.beginPath();
  cx.moveTo(x-w*0.8, footY);
  cx.lineTo(x-w*0.66, footY-h*0.9);
  cx.lineTo(x-w*0.1, footY-h);
  cx.lineTo(x+w*0.7, footY-h*0.82);
  cx.lineTo(x+w*0.82, footY);
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(20,18,26,0.7)'; cx.lineWidth=Math.max(1,s*0.01); cx.stroke();
  // carved violet sigils that light as he is sealed in
  cx.strokeStyle='rgba(199,123,255,'+(0.25+0.55*dive)*(0.7+0.3*Math.sin(t*3)).toFixed(3)+')';
  cx.lineWidth=Math.max(1,s*0.016);
  cx.beginPath();
  cx.moveTo(x-w*0.2, footY-h*0.8); cx.lineTo(x-w*0.05, footY-h*0.55); cx.lineTo(x-w*0.22, footY-h*0.35);
  cx.moveTo(x+w*0.2, footY-h*0.7); cx.lineTo(x+w*0.05, footY-h*0.45);
  cx.stroke();
  // inner violet glow as he is folded in
  if(dive>0.05){ cx.save(); cx.globalCompositeOperation='lighter';
    const vg=cx.createRadialGradient(x,footY-h*0.5,2,x,footY-h*0.5,s*0.5);
    vg.addColorStop(0,'rgba(180,120,255,'+(0.5*dive*(1-0.4*(dive>0.9?(dive-0.9)*10:0))).toFixed(3)+')'); vg.addColorStop(1,'rgba(180,120,255,0)');
    cx.fillStyle=vg; cx.beginPath(); cx.arc(x,footY-h*0.5,s*0.5,0,TAU); cx.fill(); cx.restore(); }
  cx.restore();
}
// violet leash-cords whipping around Vath - his own binding, turned on him
function drawVathCords(cx,x,y,s,ens,t){
  cx.save(); cx.globalCompositeOperation='lighter'; cx.lineCap='round';
  for(let k=0;k<4;k++){
    cx.strokeStyle='rgba(199,123,255,'+(0.4*ens).toFixed(3)+')'; cx.lineWidth=Math.max(1,s*0.05);
    cx.beginPath();
    const a0=t*2 + k*TAU/4;
    let px=x+Math.cos(a0)*s*1.1, py=y+Math.sin(a0)*s*0.7;
    cx.moveTo(px,py);
    for(let seg=1;seg<=5;seg++){ const f=seg/5; const ang=a0 + f*3.4;
      px = x + Math.cos(ang)*s*1.1*(1-f*0.9); py = y + Math.sin(ang)*s*0.7*(1-f*0.9) + Math.sin(t*3+seg)*s*0.05;
      cx.lineTo(px,py); }
    cx.stroke();
  }
  cx.restore();
}

/* ===================== AERIE / THE TOME BURNS ===================== */
function drawAerieScene(cx,W,H,t){
  const ens=MC.ens, calm=MC.calm, floorY=H*0.74;
  // the Underclimb crypt: near-black bone-and-stone, a violet cast while the tome holds
  const bg=cx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#070609');
  bg.addColorStop(0.55, mixHex('#12100f','#170e24', Math.min(1,ens*0.7)));
  bg.addColorStop(1, mixHex('#1a1512','#140b1e', Math.min(1,ens*0.5)));
  cx.fillStyle=bg; cx.fillRect(0,0,W,H);
  // a cold shaft of daylight down from the Underclimb mouth, brightening as the sky clears
  cx.save(); cx.globalCompositeOperation='lighter';
  const shX=W*0.5, shW=W*0.16;
  const sg=cx.createLinearGradient(shX,0,shX,floorY);
  sg.addColorStop(0,'rgba(200,215,240,'+(0.06+0.16*calm).toFixed(3)+')'); sg.addColorStop(1,'rgba(200,215,240,0)');
  cx.fillStyle=sg;
  cx.beginPath(); cx.moveTo(shX-shW*0.35,0); cx.lineTo(shX+shW*0.35,0); cx.lineTo(shX+shW,floorY); cx.lineTo(shX-shW,floorY); cx.closePath(); cx.fill();
  cx.restore();
  // wheeling fowl silhouettes up in the light as the sky remembers itself
  if(calm>0.4){ cx.save(); cx.globalAlpha=Math.min(1,(calm-0.4)/0.6)*0.8; cx.strokeStyle='rgba(40,44,54,0.9)'; cx.lineWidth=2;
    for(let i=0;i<4;i++){ const bx=shX+Math.sin(t*0.6+i*1.7)*W*0.09, by=H*0.14+i*H*0.05+Math.sin(t*1.1+i)*6;
      cx.beginPath(); cx.moveTo(bx-8,by); cx.quadraticCurveTo(bx,by-5,bx+0,by); cx.quadraticCurveTo(bx,by-5,bx+8,by); cx.stroke(); }
    cx.restore(); }
  // bone-and-stone pillars flanking
  cx.fillStyle='#0b0a0d';
  for(const sgn of [-1,1]){ const bx=sgn<0?W*0.12:W*0.88, w=W*0.09;
    cx.beginPath(); cx.moveTo(bx-w,H); cx.lineTo(bx-w*0.6,H*0.1); cx.lineTo(bx+w*0.5,H*0.06);
    cx.lineTo(bx+w,H*0.28); cx.lineTo(bx+w*0.6,H); cx.closePath(); cx.fill(); }
  // the pedestal
  cx.fillStyle='#1a1720';
  cx.fillRect(W*0.5-W*0.05, floorY-8, W*0.1, H-floorY+8);
  cx.fillStyle='#241f2c'; cx.fillRect(W*0.5-W*0.07, floorY-14, W*0.14, 10);

  // the tome, burning
  drawBurningTome(cx, W*0.5, floorY-14, Math.min(W,H)*0.13, ens, calm, t);

  // a robed after-image resolving in the smoke (the Vath reveal)
  if(MC.vath>0.02) drawVathFigure(cx, W*0.68, floorY-6, Math.min(W,H)*0.085, MC.vath*0.85);
}
function drawBurningTome(cx,x,y,s,ens,calm,t){
  const consumed=calm;   // 0 = whole book, 1 = ash
  // fire plume (violet at first, ember as it roars up, guttering to nothing as it becomes ash)
  const fire=Math.max(0, 1-Math.abs(consumed-0.45)*2.0);   // peaks mid-burn
  if(fire>0.02){ cx.save(); cx.globalCompositeOperation='lighter';
    for(let i=0;i<3;i++){ const fw=s*(0.5-i*0.1), fh=s*(1.4-i*0.3)*(0.6+0.4*Math.sin(t*6+i));
      const fg=cx.createLinearGradient(x,y,x,y-fh);
      fg.addColorStop(0,'rgba(255,150,70,'+(0.5*fire).toFixed(3)+')');
      fg.addColorStop(0.5,'rgba(199,123,255,'+(0.4*fire).toFixed(3)+')');
      fg.addColorStop(1,'rgba(199,123,255,0)');
      cx.fillStyle=fg; cx.beginPath();
      cx.moveTo(x-fw,y); cx.quadraticCurveTo(x-fw*0.4,y-fh*0.6, x+Math.sin(t*5+i)*s*0.1, y-fh);
      cx.quadraticCurveTo(x+fw*0.4,y-fh*0.6, x+fw,y); cx.closePath(); cx.fill(); }
    cx.restore(); }
  // the book itself, blackening to ash
  const bookA=Math.max(0,1-consumed*1.1);
  if(bookA>0.02){ cx.save(); cx.globalAlpha=bookA;
    cx.fillStyle=mixHex('#5a3a2a','#2a1a1a',consumed); cx.strokeStyle='#1a1010'; cx.lineWidth=Math.max(1,s*0.02);
    cx.beginPath(); cx.moveTo(x-s*0.5,y); cx.lineTo(x-s*0.42,y-s*0.14); cx.lineTo(x+s*0.42,y-s*0.14); cx.lineTo(x+s*0.5,y); cx.closePath(); cx.fill(); cx.stroke();
    // pages / a violet sigil on the cover while it still holds
    if(consumed<0.5){ cx.strokeStyle='rgba(199,123,255,'+(0.6*ens).toFixed(3)+')'; cx.lineWidth=Math.max(1,s*0.02);
      cx.beginPath(); cx.arc(x,y-s*0.07,s*0.08,0,TAU); cx.moveTo(x,y-s*0.15); cx.lineTo(x,y+s*0.01); cx.stroke(); }
    cx.restore(); }
  // a heap of embered ash once it's gone
  if(consumed>0.4){ cx.save(); cx.globalAlpha=Math.min(1,(consumed-0.4)/0.6);
    cx.fillStyle='#1a1414'; cx.beginPath(); cx.ellipse(x,y+s*0.02,s*0.5,s*0.08,0,0,TAU); cx.fill();
    cx.save(); cx.globalCompositeOperation='lighter';
    for(let i=0;i<6;i++){ const ex=x+rndSteady(i,3)*s*0.4; const gg=cx.createRadialGradient(ex,y,0,ex,y,s*0.06);
      gg.addColorStop(0,'rgba(255,140,60,'+(0.4*Math.max(0,1-consumed)).toFixed(3)+')'); gg.addColorStop(1,'rgba(255,140,60,0)');
      cx.fillStyle=gg; cx.beginPath(); cx.arc(ex,y,s*0.06,0,TAU); cx.fill(); }
    cx.restore(); cx.restore(); }
}

/* ---------- shared helpers ---------- */
// a robed figure with violet cuffs, resolving and fading (the Vath reveal)
function drawVathFigure(cx,x,y,s,amt){
  cx.save(); cx.globalAlpha=Math.max(0,Math.min(1,amt));
  cx.fillStyle='#160e22';
  cx.beginPath();
  cx.moveTo(x, y-s*1.1);
  cx.quadraticCurveTo(x-s*0.5, y-s*0.5, x-s*0.55, y+s*0.7);
  cx.lineTo(x+s*0.55, y+s*0.7);
  cx.quadraticCurveTo(x+s*0.5, y-s*0.5, x, y-s*1.1);
  cx.closePath(); cx.fill();
  cx.fillStyle='#0d0716'; cx.beginPath(); cx.ellipse(x, y-s*0.8, s*0.2, s*0.26, 0,0,TAU); cx.fill();
  cx.save(); cx.globalCompositeOperation='lighter';
  for(const sgn of [-1,1]){ const hx=x+sgn*s*0.4, hy=y+s*0.1;
    const hg=cx.createRadialGradient(hx,hy,0,hx,hy,s*0.32);
    hg.addColorStop(0,'rgba(200,150,255,0.75)'); hg.addColorStop(1,'rgba(200,150,255,0)');
    cx.fillStyle=hg; cx.beginPath(); cx.arc(hx,hy,s*0.32,0,TAU); cx.fill(); }
  cx.restore();
  cx.restore();
}
// expanding cold rings where a binding breaks
function shatterRings(cx,x,y,st){
  cx.save(); cx.globalCompositeOperation='lighter';
  const R=Math.max(MC.W,MC.H)*0.5*(1-st);
  for(let i=0;i<3;i++){ const r=R*(0.4+i*0.32);
    cx.strokeStyle='rgba('+(190-i*10)+','+(230-i*10)+',255,'+(0.5*st).toFixed(3)+')';
    cx.lineWidth=(5-i*1.4); cx.beginPath(); cx.arc(x,y,r,0,TAU); cx.stroke(); }
  cx.restore();
}
// gentle snow (warden): a soft, slow fall that thickens as the kind winter returns
function drawGentleSnow(cx,W,H,t,amt){
  cx.save(); cx.fillStyle='rgba(240,249,255,'+(0.7*Math.min(1,amt)).toFixed(3)+')';
  const n=Math.round(amt*90);
  for(let i=0;i<n;i++){
    const seed=i*127.1;
    const x=((seed%W) + Math.sin(t*0.4+i)*10 + i*0.3) % W;
    const y=((i*53.7 + t*22*(0.6+ (i%3)*0.2)) % (H+20)) - 10;
    const r=0.8+ (i%3)*0.7;
    cx.beginPath(); cx.arc((x+W)%W, y, r, 0, TAU); cx.fill();
  }
  cx.restore();
}
// a steady pseudo-random in [-1,1] from two ints (no per-frame flicker)
function rndSteady(a,b){ const s=Math.sin(a*12.9898+b*78.233)*43758.5453; return (s-Math.floor(s))*2-1; }

/* ---------- public entry points ---------- */
function wardenFreedCutscene(m, onDone){ mcPlay('warden', MC_WARDEN, {ens:1, calm:0, snow:0}, onDone, m); }
function rimeboundFreedCutscene(m, onDone){ mcPlay('rime', MC_RIME, {ens:1, calm:0}, onDone, m); }
function stormEyeCutscene(onDone){ mcPlay('storm', MC_STORM, {ens:1, calm:0}, onDone, null); }
function vathBoundCutscene(m, onDone){ mcPlay('vath', MC_VATH, {ens:1, calm:0, dive:0}, onDone, m); }
function aerieFreedCutscene(m, onDone){ mcPlay('aerie', MC_AERIE, {ens:1, calm:0}, onDone, m); }
window.wardenFreedCutscene=wardenFreedCutscene;
window.rimeboundFreedCutscene=rimeboundFreedCutscene;
window.stormEyeCutscene=stormEyeCutscene;
window.vathBoundCutscene=vathBoundCutscene;
window.aerieFreedCutscene=aerieFreedCutscene;

})();
