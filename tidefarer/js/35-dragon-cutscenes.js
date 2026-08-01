/* =====================================================================
   ASHWING BOOKENDS - two animated overlay cutscenes for the Sunward dragon
   -----------------------------------------------------------------------
   The Sunward Isle's climax is Ashwing, once a kind old wyrm, seized by
   Vath and turned on you - and then, if you break the chain instead of
   running him through, freed. Those two beats used to be a dialog card + an
   on-canvas violet wash (the 'enthrall' boss-intro) and a storyCard. This
   layer graduates them to full animated cutscenes in the exact mold of the
   Act I throne-hall scene (13-aaa-layer.js): a self-contained rAF loop over
   its own overlay canvas (the world is paused), click-to-advance dialogue,
   and the game's REAL dragon art (drawDragon) with its ensAmt violet wash
   driven by the scene. Two bookends around one boss:

     * dragonEnthrallCutscene()  - the violet takes him, before the fight
     * dragonFreedCutscene(onDone)- the spell shatters, after he is beaten

   Additive and graceful: if the overlay DOM is missing, each falls straight
   through to its continuation (awaken / lift offer), so nothing soft-locks.
   ===================================================================== */
(function(){
'use strict';

/* ---------- scene state (one at a time; the two bookends never overlap) ---------- */
const DG = {
  raf:0, prev:0, t:0, running:false, ended:false, started:false, idx:0,
  cv:null, cx:null, W:0, H:0,
  beats:null, onDone:null, kind:'',
  // eased visual state
  ens:0, violet:0, fire:1, dark:0,
  // one-shots (decay per frame)
  flash:0, shake:0, shatter:0,
  motes:[], _macc:0,
  _autoTO:null, _titleTO:null,
};

/* Each beat carries the line (who/html), the scene-state the visuals ease toward
   while it is on screen (ens = how far Vath's violet has taken the dragon, violet =
   ambient sorcery in the air, fire = the cavern's warm firelight), an optional
   title-card flash, and one-shot punches (flash/shake/shatter). A wordless beat
   auto-advances after `hold` ms so the motion can carry it. */
const DG_ENTHRALL = [
  // the violet pours in from the dark and he rears against it (wordless, auto-advances)
  { who:'', html:'', ens:0.34, violet:0.72, fire:0.68, shake:0.6, hold:1500 },
  { who:'Ashwing',
    html:'“Little flame — <b>run.</b> His hand is in my skull, and I cannot — I cannot hold—”',
    ens:0.56, violet:0.86, fire:0.5 },
  { who:'Vath',
    html:'<b style="color:#c9a0ff">“You never could refuse me, old serpent. Sleep — or kill for me.”</b>',
    ens:0.82, violet:1, fire:0.34 },
  // the change closes over him, an eye snaps open, he turns on you (wordless)
  { who:'', html:'', ens:1, violet:1, fire:0.26, title:'ASHWING, ENTHRALLED',
    flash:1.1, shake:0.95, hold:1900 },
];

const DG_FREED = [
  // beaten to the ash, still wearing Vath's violet - the blade held, not fallen (wordless)
  { who:'', html:'', ens:1, violet:0.78, fire:0.36, hold:1300 },
  { who:'',
    html:'<i>You could have run him through. You break the chain instead — driving your own will down into the violet like a wedge.</i>',
    ens:0.82, violet:0.56, fire:0.52 },
  // the binding shatters and his own green floods back (wordless, the big beat)
  { who:'', html:'', ens:0.16, violet:0.16, fire:0.92, shatter:1, flash:1.15, shake:0.7, hold:1800 },
  { who:'Ashwing',
    html:'“You broke it. <b>My thanks, little flame.</b>” <i>His great eye clears, gold again.</i>',
    ens:0, violet:0.05, fire:1 },
  { who:'Ashwing',
    html:'“The binder’s fire reached for your mind on the climb — and found no hold. That is not luck. He fled into the palm grove. <b>Do not let him bind another.</b>”',
    ens:0, violet:0, fire:1, title:'ASHWING, FREED' },
];

/* ---------- driver (mirrors _thrLoop / _epiLoop) ---------- */
function dgResize(){
  const cv=DG.cv; if(!cv) return;
  const r=cv.getBoundingClientRect();
  const dpr=Math.min(2, window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));
  cv.height=Math.max(1,Math.round(r.height*dpr));
  DG.cx.setTransform(dpr,0,0,dpr,0,0);
  DG.W=r.width; DG.H=r.height;
}
function dgPlay(kind, beats, init, onDone){
  const ov=document.getElementById('dgOv');
  const cv=document.getElementById('dgCv');
  if(!ov||!cv){ if(typeof onDone==='function'){ try{ onDone(); }catch(e){} } return; }  // graceful fallback
  DG.kind=kind; DG.beats=beats; DG.onDone=onDone||null;
  DG.cv=cv; DG.cx=cv.getContext('2d');
  DG.t=0; DG.prev=0; DG.idx=0; DG._macc=0;
  DG.ens=0; DG.violet=0; DG.fire=1; DG.dark=0; DG.flash=0; DG.shake=0; DG.shatter=0;
  if(init) Object.assign(DG, init);
  DG.motes.length=0;
  DG.ended=false; DG.started=false; DG.running=true;
  const title=document.getElementById('dgTitle'), sub=document.getElementById('dgSub');
  if(sub) sub.classList.remove('show'); if(title) title.classList.remove('show');
  ov.style.display='flex';
  if(typeof G!=='undefined'){ G.paused=true; G._credits=1; }
  if(typeof cinematic==='function') cinematic(true);
  dgResize();
  window.addEventListener('resize', dgResize);
  setTimeout(()=>dgShow(0), 500);   // brief fade-in, then the first beat
  ov.onclick=()=>{ if(DG.ended || !DG.started) return; dgNext(); };
  cancelAnimationFrame(DG.raf);
  DG.raf=requestAnimationFrame(dgLoop);
}
function dgShow(i){
  const b=DG.beats[i]; if(!b) return;
  DG.idx=i; DG.started=true;
  clearTimeout(DG._autoTO);
  if(b.flash)   DG.flash=Math.max(DG.flash, b.flash);
  if(b.shake)   DG.shake=Math.max(DG.shake, b.shake);
  if(b.shatter) DG.shatter=1;
  const who=document.getElementById('dgWho'), line=document.getElementById('dgLine');
  if(who) who.textContent=b.who||'';
  if(line) line.innerHTML=b.html||'';
  const sub=document.getElementById('dgSub');
  const wordless=!(b.html||'').replace(/<[^>]*>/g,'').trim();
  if(wordless){
    // a pure-action beat: hide the caption, let the motion play, then carry on by itself
    if(sub) sub.classList.remove('show');
    DG._autoTO=setTimeout(()=>dgNext(), b.hold||1700);
  } else {
    const tap=document.getElementById('dgTap');
    if(tap) tap.textContent=(i>=DG.beats.length-1)?(DG.kind==='freed'?'rest by his fire ›':'stand and fight ›'):'click to continue ›';
    if(sub){ sub.classList.remove('show'); void sub.offsetWidth; sub.classList.add('show'); }
  }
  if(b.title){
    const t=document.getElementById('dgTitle'), tt=document.getElementById('dgTitleT');
    if(t&&tt){ tt.textContent=b.title; t.classList.remove('show'); void t.offsetWidth;
      t.classList.add('show'); clearTimeout(DG._titleTO);
      DG._titleTO=setTimeout(()=>t.classList.remove('show'), 2600); }
  }
}
function dgNext(){
  clearTimeout(DG._autoTO);
  if(DG.idx>=DG.beats.length-1){ dgFinish(); return; }
  const sub=document.getElementById('dgSub'); if(sub) sub.classList.remove('show');
  setTimeout(()=>dgShow(DG.idx+1), 300);
}
function dgFinish(){
  if(DG.ended) return;
  DG.ended=true;
  const sub=document.getElementById('dgSub'); if(sub) sub.classList.remove('show');
  const title=document.getElementById('dgTitle'); if(title) title.classList.remove('show');
  setTimeout(dgEnd, 1100);   // let the scene settle before handing back to the world
}
function dgEnd(){
  DG.running=false; cancelAnimationFrame(DG.raf);
  window.removeEventListener('resize', dgResize);
  const ov=document.getElementById('dgOv'); if(ov){ ov.style.display='none'; ov.onclick=null; }
  if(typeof G!=='undefined'){ G._credits=0; G.paused=false; }
  if(typeof cinematic==='function') cinematic(false);
  const done=DG.onDone; DG.onDone=null;
  if(typeof done==='function'){ try{ done(); }catch(e){} }
}
function dgLoop(ts){
  if(!DG.running) return;
  if(!DG.prev) DG.prev=ts;
  let dt=(ts-DG.prev)/1000; DG.prev=ts;
  if(dt>0.05) dt=0.05;
  DG.t+=dt;
  const b=DG.beats[DG.idx]||DG.beats[0];
  const e=(cur,tgt,k)=>cur+(tgt-cur)*Math.min(1,dt*k);
  DG.ens    = e(DG.ens,    b.ens!=null?b.ens:DG.ens,        2.0);
  DG.violet = e(DG.violet, b.violet!=null?b.violet:DG.violet,2.0);
  DG.fire   = e(DG.fire,   b.fire!=null?b.fire:DG.fire,      2.2);
  DG.dark   = e(DG.dark,   b.dark?1:0,                       0.9);
  DG.flash  = Math.max(0, DG.flash  - dt*2.6);
  DG.shake  = Math.max(0, DG.shake  - dt*1.8);
  DG.shatter= Math.max(0, DG.shatter- dt*1.3);
  dgMotes(dt);
  dgDraw();
  DG.raf=requestAnimationFrame(dgLoop);
}

/* ---------- particles: violet motes spiral IN as he is bound; warm motes burst OUT as he is freed ---- */
function dgMotes(dt){
  const cxm=DG.W*0.5, cy=dragonChestY();
  const rate=DG.kind==='enthrall' ? 42*DG.violet : 34*DG.shatter;
  DG._macc+=dt*rate; let n=Math.floor(DG._macc); DG._macc-=n; if(n>4) n=4;
  for(let i=0;i<n;i++){
    if(DG.kind==='enthrall'){
      const a=Math.random()*TAU, r=Math.max(DG.W,DG.H)*0.42;
      DG.motes.push({x:cxm+Math.cos(a)*r, y:cy+Math.sin(a)*r*0.7, tx:cxm, ty:cy,
        life:1, col:Math.random()<0.5?'160,110,240':'190,140,255', size:rnd(2,4.5)});
    } else {
      const a=Math.random()*TAU, sp=rnd(70,230);
      DG.motes.push({x:cxm, y:cy, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-50,
        life:1, col:Math.random()<0.5?'255,210,120':'120,220,150', size:rnd(2,5)});
    }
  }
  for(const m of DG.motes){
    if(m.tx!=null){ m.x+=(m.tx-m.x)*Math.min(1,dt*2.2); m.y+=(m.ty-m.y)*Math.min(1,dt*2.2); m.life-=dt*1.15; }
    else { m.x+=m.vx*dt; m.y+=m.vy*dt; m.vy+=70*dt; m.life-=dt*0.9; }
  }
  DG.motes=DG.motes.filter(m=>m.life>0);
}

/* ---------- draw ---------- */
function dragonScale(){ return DG.H/360*2.2; }
function dragonBaseY(){ return DG.H*0.82; }
function dragonChestY(){ return dragonBaseY() - 34*dragonScale(); }

function dgDraw(){
  const cx=DG.cx, W=DG.W, H=DG.H, t=DG.t; if(!cx||!W) return;
  const ens=DG.ens, violet=DG.violet, fire=DG.fire;
  const sh=DG.shake, ox=(Math.random()*2-1)*sh*9, oy=(Math.random()*2-1)*sh*9;
  cx.save(); cx.translate(ox,oy);

  // --- cavern: near-black basalt fading to a warm (then violet-poisoned) base ---
  const bg=cx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#07060b');
  bg.addColorStop(0.55,'#0d0a11');
  bg.addColorStop(1, mixHex('#2a1207','#211031', Math.min(1,violet*0.75)));
  cx.fillStyle=bg; cx.fillRect(0,0,W,H);

  const cxm=W*0.5, floorY=dragonBaseY();
  // the fire-shelf glow at the base of the chamber (guttering as the violet smothers it)
  cx.save(); cx.globalCompositeOperation='lighter';
  const fg=cx.createRadialGradient(cxm,floorY+18,8,cxm,floorY+18,Math.max(W,H)*0.62);
  fg.addColorStop(0,'rgba(255,150,60,'+(0.30*fire).toFixed(3)+')');
  fg.addColorStop(0.5,'rgba(255,110,40,'+(0.12*fire).toFixed(3)+')');
  fg.addColorStop(1,'rgba(255,110,40,0)');
  cx.fillStyle=fg; cx.fillRect(0,0,W,H);
  cx.restore();

  // basalt column silhouettes flanking the chamber
  dgColumns(cx,W,H);
  // a dim shaft of daylight down the smoke-hole, high and cold
  dgSmokeHole(cx,W,H,t,fire);

  // --- Vath's presence: tendrils from the dark + a great slit eye opening ---
  if(violet>0.02) dgVath(cx,W,H,t,violet);

  // --- Ashwing himself, the game's own dragon art, colour washing with ens ---
  const dScale=dragonScale();
  cx.save();
  cx.translate(cxm, floorY - Math.sin(t*1.4)*2);
  cx.scale(dScale, dScale);
  cx.save();   // contain any canvas filter the art sets on entry
  try{ if(typeof drawDragon==='function')
    drawDragon(cx,0,0,{face:1, ensAmt:ens, hurtT:(DG.shake>0.4?0.1:0), anim:t}); }catch(e){}
  cx.restore();
  cx.restore();

  // --- the freeing burst: warm rings + a gold bloom off his chest ---
  if(DG.shatter>0.01) dgShatter(cx,cxm,dragonChestY(),DG.shatter,t);

  // --- motes ---
  cx.save(); cx.globalCompositeOperation='lighter';
  for(const m of DG.motes){
    cx.globalAlpha=Math.max(0,Math.min(1,m.life));
    cx.fillStyle='rgba('+m.col+',0.9)';
    cx.beginPath(); cx.arc(m.x,m.y,m.size,0,TAU); cx.fill();
  }
  cx.globalAlpha=1; cx.restore();

  // --- full-frame flash (violet as he is taken, gold as he is freed) ---
  if(DG.flash>0.01){
    cx.fillStyle=(DG.kind==='freed'?'rgba(255,214,140,':'rgba(150,100,235,')+(0.5*DG.flash).toFixed(3)+')';
    cx.fillRect(0,0,W,H);
  }
  cx.restore();  // shake

  // --- vignette + closing dark (unshaken) ---
  const vg=cx.createRadialGradient(W*0.5,H*0.5,H*0.2,W*0.5,H*0.5,H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.64)');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);
  if(DG.dark>0.01){ cx.fillStyle='rgba(2,2,6,'+(0.7*DG.dark).toFixed(3)+')'; cx.fillRect(0,0,W,H); }
}

// jagged basalt pillars either side, warm-rimmed by the fire below
function dgColumns(cx,W,H){
  cx.save();
  for(const s of [-1,1]){
    const bx = s<0 ? W*0.10 : W*0.90, w=W*0.11;
    cx.fillStyle='#0a0810';
    cx.beginPath();
    cx.moveTo(bx-w, H); cx.lineTo(bx-w*0.7, H*0.16);
    cx.lineTo(bx+w*0.5, H*0.10); cx.lineTo(bx+w, H*0.34); cx.lineTo(bx+w*0.6, H);
    cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(255,120,50,0.10)'; cx.lineWidth=2; cx.stroke();
  }
  cx.restore();
}
// a cold shaft of daylight falling from the smoke-hole - the way up, and where the warmth escapes when he is free
function dgSmokeHole(cx,W,H,t,fire){
  const x=W*0.5, w=W*0.14;
  cx.save(); cx.globalCompositeOperation='lighter';
  const g=cx.createLinearGradient(x,0,x,H*0.55);
  g.addColorStop(0,'rgba(150,175,210,'+(0.10+0.05*fire).toFixed(3)+')');
  g.addColorStop(1,'rgba(150,175,210,0)');
  cx.fillStyle=g;
  cx.beginPath(); cx.moveTo(x-w*0.4,0); cx.lineTo(x+w*0.4,0);
  cx.lineTo(x+w,H*0.55); cx.lineTo(x-w,H*0.55); cx.closePath(); cx.fill();
  cx.restore();
}
// Vath is not in the room - his voice pours from the walls. Show it: creeping tendrils
// from the upper corners and a great violet slit-eye opening in the dark above the wyrm.
function dgVath(cx,W,H,t,violet){
  cx.save(); cx.globalCompositeOperation='lighter';
  // ambient violet wash pooling from above
  const g=cx.createRadialGradient(W*0.5,H*0.22,10,W*0.5,H*0.22,Math.max(W,H)*0.72);
  g.addColorStop(0,'rgba(150,90,230,'+(0.20*violet).toFixed(3)+')');
  g.addColorStop(1,'rgba(150,90,230,0)');
  cx.fillStyle=g; cx.fillRect(0,0,W,H);
  // tendrils reaching down from the two upper corners
  cx.lineCap='round'; cx.strokeStyle='rgba(185,135,255,'+(0.5*violet).toFixed(3)+')';
  for(const s of [-1,1]){
    const bx = s<0 ? W*0.05 : W*0.95, by=H*0.02;
    for(let i=0;i<3;i++){
      cx.lineWidth=(3-i)*(0.6+violet);
      cx.beginPath(); cx.moveTo(bx,by);
      let px=bx, py=by; const reach=H*0.42*violet;
      for(let k=1;k<=5;k++){
        px += (-s)*(16+Math.sin(t*1.3+i*2+k)*9);
        py += reach/5 + Math.sin(t*1.7+k)*4;
        cx.lineTo(px,py);
      }
      cx.stroke();
    }
  }
  // the eye
  const eo=Math.max(0, violet*1.1-0.15);
  if(eo>0.02){
    const ex=W*0.5, ey=H*0.19, ew=Math.min(W,H)*0.11*(0.6+eo), eh=ew*(0.34+0.5*eo);
    const eg=cx.createRadialGradient(ex,ey,2,ex,ey,ew*1.7);
    eg.addColorStop(0,'rgba(210,150,255,'+(0.5*eo).toFixed(3)+')'); eg.addColorStop(1,'rgba(150,80,230,0)');
    cx.fillStyle=eg; cx.beginPath(); cx.ellipse(ex,ey,ew*1.5,eh*1.5,0,0,TAU); cx.fill();
    cx.globalCompositeOperation='source-over';
    cx.fillStyle='rgba(38,14,58,'+(0.85*eo).toFixed(3)+')';
    cx.beginPath(); cx.ellipse(ex,ey,ew,eh,0,0,TAU); cx.fill();
    cx.fillStyle='rgba(190,120,255,'+(0.9*eo).toFixed(3)+')';
    cx.beginPath(); cx.ellipse(ex,ey,ew*0.5,eh*0.92,0,0,TAU); cx.fill();
    cx.fillStyle='rgba(18,4,28,'+eo.toFixed(3)+')';
    cx.beginPath(); cx.ellipse(ex,ey,ew*0.11,eh*0.86,0,0,TAU); cx.fill();
  }
  cx.restore();
}
// the chain shattering: expanding warm rings + a gold bloom where the binding breaks
function dgShatter(cx,x,y,s,t){
  cx.save(); cx.globalCompositeOperation='lighter';
  const R=Math.max(DG.W,DG.H)*0.5*(1-s);
  for(let i=0;i<2;i++){
    const r=R*(0.5+i*0.4);
    cx.strokeStyle='rgba(255,'+(200-i*40)+','+(110+i*30)+','+(0.5*s).toFixed(3)+')';
    cx.lineWidth=(4-i*1.4);
    cx.beginPath(); cx.arc(x,y,r,0,TAU); cx.stroke();
  }
  const bg=cx.createRadialGradient(x,y,2,x,y,Math.max(DG.W,DG.H)*0.34*s);
  bg.addColorStop(0,'rgba(255,224,150,'+(0.7*s).toFixed(3)+')'); bg.addColorStop(1,'rgba(255,200,90,0)');
  cx.fillStyle=bg; cx.beginPath(); cx.arc(x,y,Math.max(DG.W,DG.H)*0.34*s,0,TAU); cx.fill();
  cx.restore();
}

/* ---------- public entry points (called from the dragon flow in 09/12) ---------- */
function dragonEnthrallCutscene(){
  dgPlay('enthrall', DG_ENTHRALL, {ens:0, violet:0.12, fire:1}, function(){
    // hand straight to the fight: he wakes already bound, so the on-canvas 'enthrall'
    // entrance doesn't replay the beat we just showed
    if(typeof awakenDragon==='function') awakenDragon(true);
  });
}
function dragonFreedCutscene(onDone){
  dgPlay('freed', DG_FREED, {ens:1, violet:0.8, fire:0.35}, onDone);
}
window.dragonEnthrallCutscene=dragonEnthrallCutscene;
window.dragonFreedCutscene=dragonFreedCutscene;

})();
