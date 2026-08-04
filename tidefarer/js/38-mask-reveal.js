/* =====================================================================
   THE MASK COMES OFF - the Act I memory-flood cutscene
   -----------------------------------------------------------------------
   When the Woodworker (the lost prince) begs the masked castaway to show her
   face and you click "Let him see," this animated overlay plays before the
   reunion dialogue. It is built in the exact mold of the Ashwing bookends
   (35-dragon-cutscenes.js) and the throne-hall scene (13-aaa-layer.js): a
   self-contained rAF loop over its own overlay canvas (the world is paused),
   click-to-advance dialogue, and impressionistic, hand-drawn imagery of the
   memories flooding back.

   The beats:
     * the pale mask lifts from her face and shatters, the grey amnesia fog
       tearing loose with it
     * a boat pitching in the black water - the storm, her little
       brother screaming, her arm across him like a bar of iron
     * Vath, robed in violet fire, prising her name out of her and sealing the
       mask over her face
     * the wicked mask itself, his spite worn as her own face
     * the names surfacing at last - JOAN, and her brother LEO

   On its final beat it hands off (onDone) to the reunion in 06-dialog.js,
   which sets the story state, drops the banner, and plays the sibling cards.

   Additive and graceful: if the overlay DOM is missing, it falls straight
   through to onDone, so nothing soft-locks.
   ===================================================================== */
(function(){
'use strict';

/* ---------- scene state ---------- */
const MR = {
  raf:0, prev:0, t:0, running:false, ended:false, started:false, idx:0,
  cv:null, cx:null, W:0, H:0,
  beats:null, onDone:null,
  // eased visual state
  fog:0.95, gold:0.1, mask:1, violet:0, dark:0, memAmt:0,
  // the memory vignette currently in the porthole ('', 'boat', 'curse', 'maskvis')
  mem:'',
  // one-shots (decay per frame)
  flash:0, shake:0, shatter:0, burst:0,
  motes:[], shards:[], _macc:0,
  _autoTO:null, _titleTO:null,
};

/* Each beat carries the line (who/html), the scene-state the visuals ease toward
   while it is on screen, which memory vignette to feature (mem), an optional
   title-card flash, and one-shot punches (flash/shake/shatter/burst). A wordless
   beat auto-advances after `hold` ms so the motion can carry it. */
const MR_BEATS = [
  // the mask begins to lift; the first light bleeds through the grey (wordless)
  { who:'', html:'', mask:0.55, fog:0.92, gold:0.14, shake:0.45, hold:1500 },
  // it comes away and shatters, long years of fog tearing loose with it
  { who:'', html:'<i>The mask comes away — and long years of fog tears loose with it.</i>',
    mask:0, fog:0.4, gold:0.5, shatter:1, flash:1.1, shake:0.6 },
  // the boat memory surfaces (wordless)
  { who:'', html:'', mem:'boat', fog:0.3, gold:0.55, hold:1600 },
  { who:'', html:'<i>A deck pitching in the black water. Cold rain, and the mast groaning overhead. Your little brother — small, screaming — and your arm thrown across him like a bar of iron.</i>',
    mem:'boat', gold:0.6 },
  // Vath and the curse (wordless punch)
  { who:'', html:'', mem:'curse', fog:0.32, gold:0.4, violet:0.9, flash:0.9, shake:0.7, hold:1700 },
  { who:'Vath', html:'<b style="color:#c9a0ff">“Forget who you were, little tide. Wear my work as your own face.”</b>',
    mem:'curse', gold:0.38, violet:1 },
  { who:'', html:'<i>Robed in violet fire, he prised your name out of you like a splinter — and sealed the pale mask over your face so you could never lift it.</i>',
    mem:'curse', gold:0.42, violet:0.72 },
  // the wicked mask itself (wordless)
  { who:'', html:'', mem:'maskvis', gold:0.46, violet:0.5, hold:1500 },
  { who:'', html:'<i>His spite, given a face and made your own. You wore it isle to isle and never once knew whose it was.</i>',
    mem:'maskvis', gold:0.5, violet:0.4 },
  // the name surfaces - JOAN
  { who:'', html:'<i>And then — under all of it, the thing he buried deepest. The name the sea kept from you.</i>',
    title:'JOAN', fog:0.08, gold:1, violet:0, burst:1, flash:1.2, shake:0.5 },
  // and her brother's - LEO
  { who:'', html:'<i>And his, surfacing beside it — the brother who read the books and named the stars while you ran at every storm.</i>',
    title:'LEO', gold:1, fog:0.05, burst:0.6 },
  // the warm landing (clickable close)
  { who:'', html:'<i>You are not the sea’s nameless castaway. You are Joan of Aldermere — and at last, you remember.</i>',
    gold:0.92, fog:0.04 },
];

/* ---------- driver (mirrors dgPlay / dgLoop) ---------- */
function mrResize(){
  const cv=MR.cv; if(!cv) return;
  const r=cv.getBoundingClientRect();
  const dpr=Math.min(2, window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));
  cv.height=Math.max(1,Math.round(r.height*dpr));
  MR.cx.setTransform(dpr,0,0,dpr,0,0);
  MR.W=r.width; MR.H=r.height;
}
function maskRevealCutscene(onDone){
  const ov=document.getElementById('mrOv');
  const cv=document.getElementById('mrCv');
  if(!ov||!cv){ if(typeof onDone==='function'){ try{ onDone(); }catch(e){} } return; }  // graceful fallback
  MR.beats=MR_BEATS; MR.onDone=onDone||null;
  MR.cv=cv; MR.cx=cv.getContext('2d');
  MR.t=0; MR.prev=0; MR.idx=0; MR._macc=0;
  MR.fog=0.95; MR.gold=0.1; MR.mask=1; MR.violet=0; MR.dark=0; MR.memAmt=0; MR.mem='';
  MR.flash=0; MR.shake=0; MR.shatter=0; MR.burst=0;
  MR.motes.length=0; MR.shards.length=0;
  MR.ended=false; MR.started=false; MR.running=true;
  const title=document.getElementById('mrTitle'), sub=document.getElementById('mrSub');
  if(sub) sub.classList.remove('show'); if(title) title.classList.remove('show');
  ov.style.display='flex';
  if(typeof G!=='undefined'){ G.paused=true; G._credits=1; }
  if(typeof cinematic==='function') cinematic(true);
  mrResize();
  window.addEventListener('resize', mrResize);
  setTimeout(()=>mrShow(0), 550);   // brief fade-in, then the mask lifts
  ov.onclick=()=>{ if(MR.ended || !MR.started) return; mrNext(); };
  cancelAnimationFrame(MR.raf);
  MR.raf=requestAnimationFrame(mrLoop);
}
function mrShow(i){
  const b=MR.beats[i]; if(!b) return;
  MR.idx=i; MR.started=true;
  clearTimeout(MR._autoTO);
  if(b.flash)   MR.flash=Math.max(MR.flash, b.flash);
  if(b.shake)   MR.shake=Math.max(MR.shake, b.shake);
  if(b.burst)   MR.burst=Math.max(MR.burst, b.burst);
  if(b.shatter){ MR.shatter=1; mrSpawnShards(); if(typeof Snd!=='undefined'&&Snd.magic) Snd.magic(); }
  // a new memory image surfaces: reset its fade so it eases in fresh
  const nextMem=b.mem||'';
  if(nextMem!==MR.mem){ MR.mem=nextMem; MR.memAmt=0; }
  if(b.title==='JOAN' && typeof Snd!=='undefined' && Snd.levelup) Snd.levelup();
  const who=document.getElementById('mrWho'), line=document.getElementById('mrLine');
  if(who) who.textContent=b.who||'';
  if(line) line.innerHTML=b.html||'';
  const sub=document.getElementById('mrSub');
  const wordless=!(b.html||'').replace(/<[^>]*>/g,'').trim();
  if(wordless){
    // a pure-action beat: hide the caption, let the motion play, then carry on by itself
    if(sub) sub.classList.remove('show');
    MR._autoTO=setTimeout(()=>mrNext(), b.hold||1700);
  } else {
    const tap=document.getElementById('mrTap');
    if(tap) tap.textContent=(i>=MR.beats.length-1)?'return ›':'click to continue ›';
    if(sub){ sub.classList.remove('show'); void sub.offsetWidth; sub.classList.add('show'); }
  }
  if(b.title){
    const t=document.getElementById('mrTitle'), tt=document.getElementById('mrTitleT');
    if(t&&tt){ tt.textContent=b.title; t.classList.remove('show'); void t.offsetWidth;
      t.classList.add('show'); clearTimeout(MR._titleTO);
      MR._titleTO=setTimeout(()=>t.classList.remove('show'), 2600); }
  }
}
function mrNext(){
  clearTimeout(MR._autoTO);
  if(MR.idx>=MR.beats.length-1){ mrFinish(); return; }
  const sub=document.getElementById('mrSub'); if(sub) sub.classList.remove('show');
  setTimeout(()=>mrShow(MR.idx+1), 300);
}
function mrFinish(){
  if(MR.ended) return;
  MR.ended=true;
  const sub=document.getElementById('mrSub'); if(sub) sub.classList.remove('show');
  const title=document.getElementById('mrTitle'); if(title) title.classList.remove('show');
  setTimeout(mrEnd, 1000);   // let the scene settle before handing back to the world
}
function mrEnd(){
  MR.running=false; cancelAnimationFrame(MR.raf);
  window.removeEventListener('resize', mrResize);
  const ov=document.getElementById('mrOv'); if(ov){ ov.style.display='none'; ov.onclick=null; }
  if(typeof G!=='undefined'){ G._credits=0; G.paused=false; }
  if(typeof cinematic==='function') cinematic(false);
  const done=MR.onDone; MR.onDone=null;
  if(typeof done==='function'){ try{ done(); }catch(e){} }
}
function mrLoop(ts){
  if(!MR.running) return;
  if(!MR.prev) MR.prev=ts;
  let dt=(ts-MR.prev)/1000; MR.prev=ts;
  if(dt>0.05) dt=0.05;
  MR.t+=dt;
  const b=MR.beats[MR.idx]||MR.beats[0];
  const e=(cur,tgt,k)=>cur+(tgt-cur)*Math.min(1,dt*k);
  MR.fog    = e(MR.fog,    b.fog!=null?b.fog:MR.fog,       2.0);
  MR.gold   = e(MR.gold,   b.gold!=null?b.gold:MR.gold,    2.0);
  MR.mask   = e(MR.mask,   b.mask!=null?b.mask:MR.mask,    2.4);
  MR.violet = e(MR.violet, b.violet!=null?b.violet:MR.violet, 2.2);
  MR.dark   = e(MR.dark,   b.dark?1:0,                     0.9);
  MR.memAmt = e(MR.memAmt, MR.mem?1:0,                     2.2);
  MR.flash  = Math.max(0, MR.flash  - dt*2.6);
  MR.shake  = Math.max(0, MR.shake  - dt*1.8);
  MR.shatter= Math.max(0, MR.shatter- dt*0.9);
  MR.burst  = Math.max(0, MR.burst  - dt*1.4);
  mrMotes(dt);
  mrStepShards(dt);
  mrDraw();
  MR.raf=requestAnimationFrame(mrLoop);
}

/* ---------- particles ---------- */
// memory motes: warm gold specks that spiral IN as the memories flood back,
// and burst OUT when a name surfaces.
function mrMotes(dt){
  const cxm=MR.W*0.5, cy=MR.H*0.46;
  const inRate  = (MR.gold>0.15 && MR.burst<=0.01) ? 28*MR.gold : 0;
  const outRate = MR.burst>0.01 ? 60*MR.burst : 0;
  MR._macc += dt*(inRate+outRate);
  let n=Math.floor(MR._macc); MR._macc-=n; if(n>5) n=5;
  for(let i=0;i<n;i++){
    if(outRate>inRate){
      const a=Math.random()*TAU, sp=rnd(90,260);
      MR.motes.push({x:cxm,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-40,
        life:1, col:Math.random()<0.5?'255,214,140':'255,182,96', size:rnd(2,5)});
    } else {
      const a=Math.random()*TAU, r=Math.max(MR.W,MR.H)*0.45;
      MR.motes.push({x:cxm+Math.cos(a)*r, y:cy+Math.sin(a)*r*0.7, tx:cxm, ty:cy,
        life:1, col:Math.random()<0.5?'255,206,120':'255,230,170', size:rnd(2,4.5)});
    }
  }
  for(const m of MR.motes){
    if(m.tx!=null){ m.x+=(m.tx-m.x)*Math.min(1,dt*2.4); m.y+=(m.ty-m.y)*Math.min(1,dt*2.4); m.life-=dt*1.2; }
    else { m.x+=m.vx*dt; m.y+=m.vy*dt; m.vy+=60*dt; m.life-=dt*0.9; }
  }
  MR.motes=MR.motes.filter(m=>m.life>0);
}
// pale shards flung off when the mask shatters
function mrSpawnShards(){
  MR.shards.length=0;
  const cx0=MR.W*0.5, cy0=MR.H*0.46;
  for(let i=0;i<11;i++){
    const a=Math.random()*TAU, sp=rnd(70,240);
    MR.shards.push({x:cx0, y:cy0, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-70,
      rot:Math.random()*TAU, vr:rnd(-5,5),
      a:rnd(-9,9), b:rnd(-16,-4), c:rnd(4,11), d:rnd(2,13), life:1});
  }
}
function mrStepShards(dt){
  for(const s of MR.shards){ s.x+=s.vx*dt; s.y+=s.vy*dt; s.vy+=150*dt; s.rot+=s.vr*dt; s.life-=dt*0.7; }
  MR.shards=MR.shards.filter(s=>s.life>0);
}

/* ---------- draw ---------- */
function mrDraw(){
  const cx=MR.cx, W=MR.W, H=MR.H, t=MR.t; if(!cx||!W) return;
  const fog=MR.fog, gold=MR.gold, mask=MR.mask, violet=MR.violet;
  const sh=MR.shake, ox=(Math.random()*2-1)*sh*9, oy=(Math.random()*2-1)*sh*9;
  cx.save(); cx.translate(ox,oy);

  // base: deep dark, warming toward the center as the memory-light rises
  const bg=cx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#070610');
  bg.addColorStop(0.6,'#0c0a14');
  bg.addColorStop(1, mixHex('#0e0b16','#2a1d0c', Math.min(1,gold*0.6)));
  cx.fillStyle=bg; cx.fillRect(0,0,W,H);

  const cxm=W*0.5, cym=H*0.46;

  // the warm memory-glow gathering at the center
  cx.save(); cx.globalCompositeOperation='lighter';
  const wr=Math.max(W,H)*(0.26+0.34*gold);
  const wg=cx.createRadialGradient(cxm,cym,8,cxm,cym,wr);
  wg.addColorStop(0,'rgba(255,206,120,'+(0.34*gold).toFixed(3)+')');
  wg.addColorStop(0.5,'rgba(255,170,80,'+(0.13*gold).toFixed(3)+')');
  wg.addColorStop(1,'rgba(255,170,80,0)');
  cx.fillStyle=wg; cx.beginPath(); cx.arc(cxm,cym,wr,0,TAU); cx.fill();
  cx.restore();

  // the memory vignette in a soft porthole at center (boat / curse / mask)
  if(MR.memAmt>0.01 && MR.mem){
    mrPorthole(cxm, cym, W*0.30, H*0.26, MR.memAmt, (ix,iy,s)=>{
      if(MR.mem==='boat')         mrBoat(ix,iy,s,t);
      else if(MR.mem==='curse')   mrCurse(ix,iy,s,t,violet);
      else if(MR.mem==='maskvis') mrWickedMask(ix,iy,s,t,violet);
    });
  }

  // grey amnesia fog drifting over everything
  if(fog>0.01) mrFog(t,fog);

  // the pale mask over her face, lifting and shattering away
  mrLiftMask(cxm, cym, mask, t);

  // memory motes
  cx.save(); cx.globalCompositeOperation='lighter';
  for(const m of MR.motes){
    cx.globalAlpha=Math.max(0,Math.min(1,m.life));
    cx.fillStyle='rgba('+m.col+',0.9)';
    cx.beginPath(); cx.arc(m.x,m.y,m.size,0,TAU); cx.fill();
  }
  cx.globalAlpha=1; cx.restore();

  // full-frame flash (gold as a memory lands)
  if(MR.flash>0.01){ cx.fillStyle='rgba(255,226,150,'+(0.48*MR.flash).toFixed(3)+')'; cx.fillRect(0,0,W,H); }
  cx.restore();  // shake

  // vignette + closing dark (unshaken)
  const vg=cx.createRadialGradient(W*0.5,H*0.5,H*0.18,W*0.5,H*0.5,H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.66)');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);
  if(MR.dark>0.01){ cx.fillStyle='rgba(2,2,6,'+(0.72*MR.dark).toFixed(3)+')'; cx.fillRect(0,0,W,H); }
}

// draw a memory inside a soft-edged oval porthole at (x,y), radii (rw,rh)
function mrPorthole(x,y,rw,rh,alpha,inner){
  const cx=MR.cx;
  alpha=Math.max(0,Math.min(1,alpha));
  cx.save();
  cx.globalAlpha=alpha;
  cx.beginPath(); cx.ellipse(x,y,rw,rh,0,0,TAU); cx.clip();
  cx.fillStyle='#05060c'; cx.fillRect(x-rw,y-rh,rw*2,rh*2);   // dark backing
  inner(x, y, rh);
  cx.restore();
  // soft dark rim so the porthole edge feathers into the scene
  cx.save(); cx.globalAlpha=alpha;
  const rg=cx.createRadialGradient(x,y,Math.min(rw,rh)*0.68,x,y,Math.max(rw,rh)*1.06);
  rg.addColorStop(0,'rgba(0,0,0,0)'); rg.addColorStop(1,'rgba(6,6,12,0.92)');
  cx.fillStyle=rg; cx.beginPath(); cx.ellipse(x,y,rw*1.14,rh*1.14,0,0,TAU); cx.fill();
  cx.restore();
}

// the boat pitching in the black water: the storm, brother's scream
function mrBoat(x,y,s,t){
  const cx=MR.cx;
  const hy=y+s*0.18;
  // heaving sea
  cx.fillStyle='#0a1526'; cx.fillRect(x-s*1.7,hy,s*3.4,s*1.7);
  cx.strokeStyle='rgba(90,120,160,0.35)'; cx.lineWidth=1.4;
  for(let r=0;r<4;r++){
    const yy=hy+s*0.18*r+s*0.12;
    cx.beginPath();
    for(let xx=-1.7;xx<=1.7;xx+=0.12){
      const px=x+xx*s, py=yy+Math.sin(xx*6+t*2+r)*s*0.03;
      xx<=-1.7?cx.moveTo(px,py):cx.lineTo(px,py);
    }
    cx.stroke();
  }
  // rain
  cx.strokeStyle='rgba(150,170,200,0.22)'; cx.lineWidth=1;
  for(let i=0;i<22;i++){
    const fx=((i*73)%100)/100, fy=((i*151)%100)/100;
    const rx=x-s*1.5+fx*s*3, ry=y-s*0.85+((fy+t*0.5)%1)*s*1.9;
    cx.beginPath(); cx.moveTo(rx,ry); cx.lineTo(rx-3,ry+9); cx.stroke();
  }
  // the boat, a dark silhouette riding the swell
  const bob=Math.sin(t*1.6)*s*0.05, tilt=Math.sin(t*1.6+0.5)*0.12;
  cx.save(); cx.translate(x, hy-s*0.02+bob); cx.rotate(tilt);
  const S=s*0.011; cx.scale(S,S);
  cx.fillStyle='#20140c'; cx.strokeStyle='#0d0805'; cx.lineWidth=2;
  cx.beginPath();
  cx.moveTo(-52,0); cx.quadraticCurveTo(-58,16,-34,20);
  cx.lineTo(34,20); cx.quadraticCurveTo(58,16,52,0);
  cx.closePath(); cx.fill(); cx.stroke();
  cx.strokeStyle='#0d0805'; cx.lineWidth=3;
  cx.beginPath(); cx.moveTo(0,0); cx.lineTo(0,-58); cx.stroke();   // mast
  cx.fillStyle='#12100c';
  cx.beginPath(); cx.moveTo(2,-56); cx.quadraticCurveTo(18,-30,2,-6); cx.closePath(); cx.fill();  // sail
  cx.restore();
  // a warm cabin light, the last human thing in the dark
  cx.save(); cx.globalCompositeOperation='lighter';
  const lx=x, ly=hy-s*0.05;
  const lg=cx.createRadialGradient(lx,ly,0,lx,ly,s*0.24);
  lg.addColorStop(0,'rgba(255,200,120,0.8)'); lg.addColorStop(1,'rgba(255,200,120,0)');
  cx.fillStyle=lg; cx.beginPath(); cx.arc(lx,ly,s*0.24,0,TAU); cx.fill();
  cx.restore();
}

// Vath, robed in violet fire, sealing the mask over her face
function mrCurse(x,y,s,t,violet){
  const cx=MR.cx;
  // violet pool
  cx.save(); cx.globalCompositeOperation='lighter';
  const vg=cx.createRadialGradient(x,y,4,x,y,s*1.6);
  vg.addColorStop(0,'rgba(150,90,230,'+(0.4*violet).toFixed(3)+')');
  vg.addColorStop(1,'rgba(150,90,230,0)');
  cx.fillStyle=vg; cx.beginPath(); cx.arc(x,y,s*1.6,0,TAU); cx.fill(); cx.restore();
  // the robed figure, a tall dark silhouette
  cx.fillStyle='#160e22';
  cx.beginPath();
  cx.moveTo(x, y-s*0.92);
  cx.quadraticCurveTo(x-s*0.44, y-s*0.5, x-s*0.5, y+s*0.72);
  cx.lineTo(x+s*0.5, y+s*0.72);
  cx.quadraticCurveTo(x+s*0.44, y-s*0.5, x, y-s*0.92);
  cx.closePath(); cx.fill();
  cx.fillStyle='#0d0716';
  cx.beginPath(); cx.ellipse(x, y-s*0.72, s*0.17, s*0.21, 0,0,TAU); cx.fill();  // hooded head
  // raised, glowing hands
  cx.save(); cx.globalCompositeOperation='lighter';
  for(const sgn of [-1,1]){
    const hx=x+sgn*s*0.44, hy=y-s*0.08;
    const hg=cx.createRadialGradient(hx,hy,0,hx,hy,s*0.3);
    hg.addColorStop(0,'rgba(200,150,255,'+(0.7*violet).toFixed(3)+')');
    hg.addColorStop(1,'rgba(200,150,255,0)');
    cx.fillStyle=hg; cx.beginPath(); cx.arc(hx,hy,s*0.3,0,TAU); cx.fill();
  }
  cx.restore();
  // the pale mask descending toward the viewer on violet rays
  const my=y+s*0.4 - Math.sin(t*1.5)*s*0.02;
  cx.save(); cx.globalCompositeOperation='lighter';
  cx.strokeStyle='rgba(180,120,255,'+(0.5*violet).toFixed(3)+')'; cx.lineWidth=2;
  for(const sgn of [-1,1]){ cx.beginPath(); cx.moveTo(x+sgn*s*0.44, y-s*0.05); cx.lineTo(x, my); cx.stroke(); }
  cx.restore();
  mrMaskGlyph(x, my, s*0.5, {pale:'#d9d3c4', rim:'rgba(170,110,240,'+(0.6*violet).toFixed(3)+')'});
}

// the wicked mask itself, large and close: cracked, hollow-eyed, violet-rimmed
function mrWickedMask(x,y,s,t,violet){
  const drift=Math.sin(t*1.1)*s*0.02;
  mrMaskGlyph(x, y+drift, s*1.15, {pale:'#e2dccb', rim:'rgba(170,110,240,'+(0.5+0.3*violet).toFixed(3)+')', crack:true, hollow:true});
}

// the pale face-mask glyph, sized to `s`
function mrMaskGlyph(x,y,s,opt){
  opt=opt||{}; const cx=MR.cx;
  if(opt.rim){
    cx.save(); cx.globalCompositeOperation='lighter';
    const g=cx.createRadialGradient(x,y,s*0.3,x,y,s*0.92);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,opt.rim);
    cx.fillStyle=g; cx.beginPath(); cx.ellipse(x,y,s*0.72,s*0.88,0,0,TAU); cx.fill(); cx.restore();
  }
  cx.save();
  const pale=opt.pale||'#ded8c8';
  const fg=cx.createLinearGradient(x,y-s*0.8,x,y+s*0.85);
  fg.addColorStop(0, pale); fg.addColorStop(1, mixHex(pale,'#8c8576',0.5));
  cx.fillStyle=fg;
  cx.beginPath();
  cx.moveTo(x, y-s*0.82);
  cx.bezierCurveTo(x+s*0.52,y-s*0.7, x+s*0.5,y+s*0.45, x, y+s*0.85);
  cx.bezierCurveTo(x-s*0.5,y+s*0.45, x-s*0.52,y-s*0.7, x, y-s*0.82);
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(60,54,44,0.6)'; cx.lineWidth=Math.max(1,s*0.02); cx.stroke();
  // eye hollows
  cx.fillStyle= opt.hollow?'#05040a':'rgba(20,16,26,0.85)';
  for(const sgn of [-1,1]){ cx.beginPath(); cx.ellipse(x+sgn*s*0.24, y-s*0.08, s*0.12, s*0.16, sgn*0.15, 0,TAU); cx.fill(); }
  // mouth line
  cx.strokeStyle='rgba(40,34,28,0.7)'; cx.lineWidth=Math.max(1,s*0.02);
  cx.beginPath(); cx.moveTo(x-s*0.18, y+s*0.4); cx.quadraticCurveTo(x, y+s*0.47, x+s*0.18, y+s*0.4); cx.stroke();
  // cracks
  if(opt.crack){
    cx.strokeStyle='rgba(30,24,20,0.8)'; cx.lineWidth=Math.max(1,s*0.015);
    cx.beginPath(); cx.moveTo(x-s*0.1,y-s*0.7); cx.lineTo(x-s*0.02,y-s*0.2);
    cx.lineTo(x-s*0.16,y+s*0.1); cx.lineTo(x-s*0.06,y+s*0.55); cx.stroke();
    cx.beginPath(); cx.moveTo(x+s*0.2,y-s*0.5); cx.lineTo(x+s*0.1,y-s*0.05); cx.stroke();
  }
  cx.restore();
}

// the mask over her face at center - lifting up and fading as `mask`->0, then
// the shards flying off when it shatters
function mrLiftMask(x,y,mask,t){
  const cx=MR.cx, s=Math.min(MR.W,MR.H)*0.16;
  const lift=(1-mask)*Math.min(MR.W,MR.H)*0.11;   // rises as it comes away
  if(mask>0.02){
    cx.save(); cx.globalAlpha=Math.max(0,Math.min(1,mask));
    mrMaskGlyph(x, y-lift, s, {pale:'#e6e0d0', rim:'rgba(170,110,240,0.22)'});
    cx.restore();
  }
  if(MR.shards.length){
    cx.save();
    for(const sh of MR.shards){
      cx.save(); cx.globalAlpha=Math.max(0,Math.min(1,sh.life));
      cx.translate(sh.x, sh.y); cx.rotate(sh.rot);
      cx.fillStyle='#e6e0d0';
      cx.beginPath(); cx.moveTo(0,0); cx.lineTo(sh.a,sh.b); cx.lineTo(sh.c,sh.d); cx.closePath(); cx.fill();
      cx.restore();
    }
    cx.restore();
  }
}

// the grey amnesia fog: a flat veil plus a few soft drifting banks
function mrFog(t,fog){
  const cx=MR.cx, W=MR.W, H=MR.H;
  cx.save();
  cx.fillStyle='rgba(120,124,134,'+(0.26*fog).toFixed(3)+')'; cx.fillRect(0,0,W,H);
  for(let i=0;i<5;i++){
    const span=W+220;
    const px=((W*0.2*i+0.1*W + t*14*(i%2?1:-1))%span+span)%span - 110;
    const py=H*(0.2+0.14*i)+Math.sin(t*0.5+i)*20;
    const r=90+i*24;
    const g=cx.createRadialGradient(px,py,4,px,py,r);
    g.addColorStop(0,'rgba(150,154,164,'+(0.13*fog).toFixed(3)+')'); g.addColorStop(1,'rgba(150,154,164,0)');
    cx.fillStyle=g; cx.beginPath(); cx.arc(px,py,r,0,TAU); cx.fill();
  }
  cx.restore();
}

/* ---------- public entry point (called from 06-dialog.js) ---------- */
window.maskRevealCutscene=maskRevealCutscene;

})();
