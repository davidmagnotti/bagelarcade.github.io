/* =====================================================================
   THE LEVIATHAN, UNBOUND - an animated overlay cutscene for the freeing
   of the Bound Leviathan out past the Windsurf breakwater.
   -----------------------------------------------------------------------
   This is the sea-mirror of the Ashwing FREED bookend (35-dragon-cutscenes.js):
   the same self-contained rAF loop over the shared overlay canvas (the world
   is paused), click-to-advance dialogue, a full-frame composed scene, and the
   freed-victim shape STORY.md always earmarked the Leviathan for - the natural
   upgrade from its old on-canvas wash + story-card into a real cutscene.

   It replaces two old beats at once:
     * leviathanFarewell()  - a plain dialog card of the beast's thanks
     * the "Where it sank..." storyCard - which is where Vath used to be
       revealed, second-hand, through Rell on the pier.

   Now the thanks AND the reveal are one scene. The binding shatters, the
   violet drains from the serpent's hide, and - the load-bearing beat - the
   Leviathan names the hand that bound it and we SEE him: a robed man on the
   breakwater, violet at his wrists, who turns and is gone. Vath was here.

   Additive and graceful: if the overlay DOM is missing, it falls straight
   through to onDone (the sink + hand-off), so nothing soft-locks.
   ===================================================================== */
(function(){
'use strict';

/* ---------- scene state ---------- */
const LV = {
  raf:0, prev:0, t:0, running:false, ended:false, started:false, idx:0,
  cv:null, cx:null, W:0, H:0,
  beats:null, onDone:null, m:null,
  // eased visual state
  ens:1,      // 1 = still bound in Vath's violet, 0 = calm and freed
  calm:0,     // 0 = the strait heaving, 1 = glass-flat mirror
  vath:0,     // how present the robed figure on the breakwater is
  dive:0,     // at the very end, the serpent sinks back into the deep
  // one-shots (decay per frame)
  flash:0, shake:0, shatter:0,
  motes:[], _macc:0,
  _autoTO:null, _titleTO:null,
};

/* Each beat carries the line, the scene-state the visuals ease toward while it is
   on screen, an optional title-card flash, and one-shot punches. A wordless beat
   auto-advances after `hold` ms so the motion can carry it. */
const LV_FREED = [
  // still bound - the strait heaves, the violet rings pulse round its throat (wordless)
  { who:'', html:'', ens:1, calm:0, vath:0, shake:0.55, hold:1500 },
  // the chain shatters: the violet blows off its hide and the water falls flat (wordless, the big beat)
  { who:'', html:'', ens:0.14, calm:0.55, shatter:1, flash:1.05, shake:0.6, hold:1800 },
  { who:'The Leviathan, Unbound',
    html:'<i>The violet drains from its hide and its vast eye clears to a deep, calm blue - no monster now, only something impossibly old, made to kill and glad to be done with it. The water goes glass-flat around it.</i>',
    ens:0, calm:0.9 },
  { who:'The Leviathan, Unbound',
    html:'<b style="color:#8fd8ff">"…unbound. The little land-thing broke the cold hand. But mark whose hand it was, breaker - I would not have you think the sea did this to itself."</b>',
    ens:0, calm:1 },
  // the reveal: a robed figure resolves on the breakwater, violet at the wrists
  { who:'The Leviathan, Unbound',
    html:'<b style="color:#8fd8ff">"He stood upon your stone wall as the cold words took me - a landman, robed, </b><b style="color:#c9a0ff">violet at his wrists</b><b style="color:#8fd8ff">, whispering the old deep-magic into my blood. There. He watches yet."</b>',
    ens:0, calm:1, vath:1 },
  // Vath turns and is gone; the shard of his binding tears loose to your hand (wordless)
  { who:'', html:'', ens:0, calm:1, vath:0, flash:0.5, title:'THE LEVIATHAN, UNBOUND', hold:2000 },
  { who:'The Leviathan, Unbound',
    html:'<b style="color:#8fd8ff">"A cold shard of his working sheds into your keeping - proof of his hand, cold as deep water. Carry it to your crown. The deep will know your keel now, and let it pass. Go well, breaker."</b>',
    ens:0, calm:1, vath:0 },
];

/* ---------- driver (mirrors the dragon cutscene's _thrLoop) ---------- */
function lvResize(){
  const cv=LV.cv; if(!cv) return;
  const r=cv.getBoundingClientRect();
  const dpr=Math.min(2, window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));
  cv.height=Math.max(1,Math.round(r.height*dpr));
  LV.cx.setTransform(dpr,0,0,dpr,0,0);
  LV.W=r.width; LV.H=r.height;
}
function lvPlay(beats, init, onDone, m){
  const ov=document.getElementById('dgOv');
  const cv=document.getElementById('dgCv');
  if(!ov||!cv){ if(typeof onDone==='function'){ try{ onDone(); }catch(e){} } return; }  // graceful fallback
  LV.beats=beats; LV.onDone=onDone||null; LV.m=m||null;
  LV.cv=cv; LV.cx=cv.getContext('2d');
  LV.t=0; LV.prev=0; LV.idx=0; LV._macc=0;
  LV.ens=1; LV.calm=0; LV.vath=0; LV.dive=0; LV.flash=0; LV.shake=0; LV.shatter=0;
  if(init) Object.assign(LV, init);
  LV.motes.length=0;
  LV.ended=false; LV.started=false; LV.running=true;
  const title=document.getElementById('dgTitle'), sub=document.getElementById('dgSub');
  if(sub) sub.classList.remove('show'); if(title) title.classList.remove('show');
  ov.style.display='flex';
  if(typeof G!=='undefined'){ G.paused=true; G._credits=1; }
  if(typeof cinematic==='function') cinematic(true);
  lvResize();
  window.addEventListener('resize', lvResize);
  setTimeout(()=>lvShow(0), 500);   // brief fade-in, then the first beat
  ov.onclick=()=>{ if(LV.ended || !LV.started) return; lvNext(); };
  cancelAnimationFrame(LV.raf);
  LV.raf=requestAnimationFrame(lvLoop);
}
function lvShow(i){
  const b=LV.beats[i]; if(!b) return;
  LV.idx=i; LV.started=true;
  clearTimeout(LV._autoTO);
  if(b.flash)   LV.flash=Math.max(LV.flash, b.flash);
  if(b.shake)   LV.shake=Math.max(LV.shake, b.shake);
  if(b.shatter) LV.shatter=1;
  const who=document.getElementById('dgWho'), line=document.getElementById('dgLine');
  if(who) who.textContent=b.who||'';
  if(line) line.innerHTML=b.html||'';
  const sub=document.getElementById('dgSub');
  const wordless=!(b.html||'').replace(/<[^>]*>/g,'').trim();
  if(wordless){
    if(sub) sub.classList.remove('show');
    LV._autoTO=setTimeout(()=>lvNext(), b.hold||1700);
  } else {
    const tap=document.getElementById('dgTap');
    if(tap) tap.textContent=(i>=LV.beats.length-1)?'let it return to the deep ›':'click to continue ›';
    if(sub){ sub.classList.remove('show'); void sub.offsetWidth; sub.classList.add('show'); }
  }
  if(b.title){
    const t=document.getElementById('dgTitle'), tt=document.getElementById('dgTitleT');
    if(t&&tt){ tt.textContent=b.title; t.classList.remove('show'); void t.offsetWidth;
      t.classList.add('show'); clearTimeout(LV._titleTO);
      LV._titleTO=setTimeout(()=>t.classList.remove('show'), 2600); }
  }
}
function lvNext(){
  clearTimeout(LV._autoTO);
  if(LV.idx>=LV.beats.length-1){ lvFinish(); return; }
  const sub=document.getElementById('dgSub'); if(sub) sub.classList.remove('show');
  setTimeout(()=>lvShow(LV.idx+1), 300);
}
function lvFinish(){
  if(LV.ended) return;
  LV.ended=true;   // the driver eases LV.dive toward 1 now, so the beast sinks as the scene settles
  const sub=document.getElementById('dgSub'); if(sub) sub.classList.remove('show');
  const title=document.getElementById('dgTitle'); if(title) title.classList.remove('show');
  setTimeout(lvEnd, 1500);   // let it dive and the water close over before handing back
}
function lvEnd(){
  LV.running=false; cancelAnimationFrame(LV.raf);
  window.removeEventListener('resize', lvResize);
  const ov=document.getElementById('dgOv'); if(ov){ ov.style.display='none'; ov.onclick=null; }
  if(typeof G!=='undefined'){ G._credits=0; G.paused=false; }
  if(typeof cinematic==='function') cinematic(false);
  const done=LV.onDone; LV.onDone=null;
  if(typeof done==='function'){ try{ done(); }catch(e){} }
}
function lvLoop(ts){
  if(!LV.running) return;
  if(!LV.prev) LV.prev=ts;
  let dt=(ts-LV.prev)/1000; LV.prev=ts;
  if(dt>0.05) dt=0.05;
  LV.t+=dt;
  const b=LV.beats[LV.idx]||LV.beats[0];
  const e=(cur,tgt,k)=>cur+(tgt-cur)*Math.min(1,dt*k);
  LV.ens  = e(LV.ens,  b.ens!=null?b.ens:LV.ens,   2.0);
  LV.calm = e(LV.calm, b.calm!=null?b.calm:LV.calm, 1.6);
  LV.vath = e(LV.vath, b.vath!=null?b.vath:LV.vath, 1.8);
  LV.dive = e(LV.dive, LV.ended?1:0,                1.2);
  LV.flash  = Math.max(0, LV.flash  - dt*2.6);
  LV.shake  = Math.max(0, LV.shake*(1-LV.calm*0.5) - dt*1.8);
  LV.shatter= Math.max(0, LV.shatter- dt*1.2);
  lvMotes(dt);
  lvDraw();
  LV.raf=requestAnimationFrame(lvLoop);
}

/* ---------- particles ---------- */
/* While bound: violet motes cling and swirl at the throat. On the shatter: they
   blow OUTWARD and up, cold spray glints among them, and then it goes still. */
function lvMotes(dt){
  const cxm=LV.W*0.5, hy=serpentHeadY();
  if(LV.shatter>0.02){
    LV._macc+=dt*46*LV.shatter; let n=Math.floor(LV._macc); LV._macc-=n; if(n>4) n=4;
    for(let i=0;i<n;i++){ const a=Math.random()*TAU, sp=rnd(80,260);
      LV.motes.push({x:cxm, y:hy, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-60, life:1,
        col:Math.random()<0.5?'190,140,255':'160,110,240', size:rnd(2,4.6)}); }
  } else if(LV.ens>0.3){
    LV._macc+=dt*20*LV.ens; let n=Math.floor(LV._macc); LV._macc-=n; if(n>3) n=3;
    for(let i=0;i<n;i++){ const a=Math.random()*TAU, r=32+Math.random()*22;
      LV.motes.push({x:cxm+Math.cos(a)*r, y:hy+Math.sin(a)*r*0.6, tx:cxm, ty:hy, life:1,
        col:Math.random()<0.5?'160,110,240':'190,140,255', size:rnd(2,4)}); }
  }
  for(const m of LV.motes){
    if(m.tx!=null){ m.x+=(m.tx-m.x)*Math.min(1,dt*2.0); m.y+=(m.ty-m.y)*Math.min(1,dt*2.0); m.life-=dt*1.1; }
    else { m.x+=m.vx*dt; m.y+=m.vy*dt; m.vy+=64*dt; m.life-=dt*0.85; }
  }
  LV.motes=LV.motes.filter(m=>m.life>0);
}

/* ---------- draw ---------- */
function seaY(){ return LV.H*0.60; }                 // the waterline
function serpentBaseY(){ return seaY() + 6; }        // where the coils break the surface
function serpentHeadY(){ return serpentBaseY() - 150*serpentScale(); }
function serpentScale(){ return LV.H/360*0.9; }

function lvDraw(){
  const cx=LV.cx, W=LV.W, H=LV.H, t=LV.t; if(!cx||!W) return;
  const ens=LV.ens, calm=LV.calm, horizon=seaY();
  const sh=LV.shake, ox=(Math.random()*2-1)*sh*8, oy=(Math.random()*2-1)*sh*8;
  cx.save(); cx.translate(ox,oy);

  // --- dusk sky over the strait: cold blue deepening up, a violet bruise while bound ---
  const sky=cx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0, mixHex('#0b1622','#1a1030', Math.min(1,ens*0.7)));
  sky.addColorStop(0.7, mixHex('#1c3242','#2a1740', Math.min(1,ens*0.6)));
  sky.addColorStop(1, mixHex('#385a68','#3a2350', Math.min(1,ens*0.5)));
  cx.fillStyle=sky; cx.fillRect(0,0,W,horizon+2);

  // a low afterglow moon, cold; brightens as the violet lifts
  const mx=W*0.78, my=horizon*0.42, mr=Math.min(W,H)*0.06;
  cx.save(); cx.globalCompositeOperation='lighter';
  const mg=cx.createRadialGradient(mx,my,2,mx,my,mr*3.2);
  mg.addColorStop(0,'rgba(200,224,240,'+(0.5+0.25*calm).toFixed(3)+')');
  mg.addColorStop(1,'rgba(200,224,240,0)');
  cx.fillStyle=mg; cx.beginPath(); cx.arc(mx,my,mr*3.2,0,TAU); cx.fill();
  cx.globalCompositeOperation='source-over';
  cx.fillStyle='rgba(228,240,250,0.92)'; cx.beginPath(); cx.arc(mx,my,mr,0,TAU); cx.fill();
  cx.restore();

  // --- the sea: heaving swell while bound, easing to a glass-flat mirror when calmed ---
  const sea=cx.createLinearGradient(0,horizon,0,H);
  sea.addColorStop(0, mixHex('#20404e','#221636', Math.min(1,ens*0.55)));
  sea.addColorStop(1, mixHex('#0a1a24','#0c0a1a', Math.min(1,ens*0.5)));
  cx.fillStyle=sea; cx.fillRect(0,horizon,W,H-horizon+2);
  lvWater(cx,W,H,horizon,t,ens,calm);
  // the moon's track laid down on flattening water
  if(calm>0.05){ cx.save(); cx.globalCompositeOperation='lighter';
    cx.fillStyle='rgba(200,224,240,'+(0.10*calm).toFixed(3)+')';
    cx.beginPath(); cx.ellipse(mx,horizon+18,mr*0.7,14+10*calm,0,0,TAU); cx.fill();
    cx.restore(); }

  // --- the breakwater: a dark rock jetty running out from the left, where Vath stands ---
  lvBreakwater(cx,W,H,horizon,LV.vath,t);

  // --- Vath's binding still in the air while bound: a violet wash pooling over the water ---
  if(ens>0.03){ cx.save(); cx.globalCompositeOperation='lighter';
    const vg=cx.createRadialGradient(W*0.5,horizon,10,W*0.5,horizon,Math.max(W,H)*0.7);
    vg.addColorStop(0,'rgba(150,90,230,'+(0.16*ens).toFixed(3)+')');
    vg.addColorStop(1,'rgba(150,90,230,0)');
    cx.fillStyle=vg; cx.fillRect(0,0,W,H); cx.restore(); }

  // --- the Leviathan, rearing from the strait, colour easing bound -> calm ---
  lvSerpent(cx,W,H,t,ens,LV.dive);

  // --- the freeing burst: violet rings blowing off its throat ---
  if(LV.shatter>0.01) lvShatter(cx,W*0.5,serpentHeadY(),LV.shatter);

  // --- motes ---
  cx.save(); cx.globalCompositeOperation='lighter';
  for(const m of LV.motes){
    cx.globalAlpha=Math.max(0,Math.min(1,m.life));
    cx.fillStyle='rgba('+m.col+',0.9)';
    cx.beginPath(); cx.arc(m.x,m.y,m.size,0,TAU); cx.fill();
  }
  cx.globalAlpha=1; cx.restore();

  // --- full-frame flash (violet as the chain breaks) ---
  if(LV.flash>0.01){ cx.fillStyle='rgba(170,120,240,'+(0.5*LV.flash).toFixed(3)+')'; cx.fillRect(0,0,W,H); }
  cx.restore();  // shake

  // --- vignette ---
  const vg=cx.createRadialGradient(W*0.5,H*0.52,H*0.2,W*0.5,H*0.52,H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.6)');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);
}

// rolling swell lines on the water; their amplitude falls to near-zero as `calm` rises
function lvWater(cx,W,H,horizon,t,ens,calm){
  cx.save();
  const rows=7, amp=(1-calm)*7+0.5;
  for(let i=0;i<rows;i++){
    const p=i/(rows-1), y=horizon+ (H-horizon)*p*p*0.9 + 6;
    const a=(0.12+0.10*ens)*(1-p*0.6);
    cx.strokeStyle= 'rgba('+(ens>0.4?'150,110,200':'150,195,215')+','+a.toFixed(3)+')';
    cx.lineWidth=1.4;
    cx.beginPath();
    for(let x=0;x<=W;x+=14){
      const yy=y + Math.sin(x*0.02 + t*(1.1+p) + i)*amp*(0.5+p);
      x===0?cx.moveTo(x,yy):cx.lineTo(x,yy);
    }
    cx.stroke();
  }
  cx.restore();
}

// a jagged rock breakwater from the left edge; when `vath`>0 a robed figure stands at its tip,
// violet at the cuffs, watching - and fades as he turns away
function lvBreakwater(cx,W,H,horizon,vath,t){
  const tipX=W*0.30, baseY=horizon+4;
  cx.save();
  // the rocks
  cx.fillStyle='#0c141a';
  cx.beginPath();
  cx.moveTo(0,horizon-10); cx.lineTo(0,H); cx.lineTo(tipX-30,H);
  cx.lineTo(tipX,baseY+2); cx.lineTo(tipX-14,horizon-14);
  cx.lineTo(W*0.14,horizon-20); cx.lineTo(W*0.06,horizon-8); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(120,150,170,0.10)'; cx.lineWidth=2; cx.stroke();
  // a warm lantern on the sea-wall, the town's one light
  cx.save(); cx.globalCompositeOperation='lighter';
  const lx=W*0.10, ly=horizon-22;
  const lg=cx.createRadialGradient(lx,ly,1,lx,ly,26);
  lg.addColorStop(0,'rgba(255,190,110,0.6)'); lg.addColorStop(1,'rgba(255,190,110,0)');
  cx.fillStyle=lg; cx.beginPath(); cx.arc(lx,ly,26,0,TAU); cx.fill(); cx.restore();

  // --- Vath, on the tip of the wall ---
  if(vath>0.02){
    const fx=tipX-16, fy=baseY-2, hgt=44, sway=Math.sin(t*1.2)*1.5;
    cx.save(); cx.globalAlpha=Math.min(1,vath);
    // a violet nimbus around him - the tell
    cx.save(); cx.globalCompositeOperation='lighter';
    const ng=cx.createRadialGradient(fx,fy-hgt*0.55,2,fx,fy-hgt*0.55,hgt*1.2);
    ng.addColorStop(0,'rgba(180,120,255,'+(0.5*vath).toFixed(3)+')');
    ng.addColorStop(1,'rgba(180,120,255,0)');
    cx.fillStyle=ng; cx.beginPath(); cx.arc(fx,fy-hgt*0.55,hgt*1.2,0,TAU); cx.fill(); cx.restore();
    // the robed silhouette
    cx.fillStyle='#0a0812';
    cx.beginPath();
    cx.moveTo(fx-9, fy);
    cx.quadraticCurveTo(fx-7, fy-hgt*0.6, fx-4+sway, fy-hgt*0.9);   // hem to shoulder
    cx.quadraticCurveTo(fx, fy-hgt*1.06, fx+4+sway, fy-hgt*0.9);    // hooded crown
    cx.quadraticCurveTo(fx+7, fy-hgt*0.6, fx+9, fy);                // shoulder to hem
    cx.closePath(); cx.fill();
    // violet at the wrists - hands folded before him
    cx.fillStyle='rgba(200,140,255,'+(0.85*vath).toFixed(3)+')';
    cx.beginPath(); cx.arc(fx-2, fy-hgt*0.44, 2.4, 0, TAU); cx.fill();
    cx.beginPath(); cx.arc(fx+3, fy-hgt*0.44, 2.4, 0, TAU); cx.fill();
    // a cold gleam where the face would be under the hood
    cx.fillStyle='rgba(190,150,255,'+(0.7*vath).toFixed(3)+')';
    cx.beginPath(); cx.arc(fx+1, fy-hgt*0.8, 1.5, 0, TAU); cx.fill();
    cx.restore();
  }
  cx.restore();
}

// the serpent itself: three breaching coils, a rearing neck and a heavy horned skull with a
// single great eye - violet-bound when `ens`=1, deep calm blue when freed. `dive` sinks it.
function lvSerpent(cx,W,H,t,ens,dive){
  const cxm=W*0.5, base=serpentBaseY(), sc=serpentScale();
  const bodyC = mixHex('#3a7a8a','#243a52', ens*0.7);        // freed teal -> bound cold slate
  const spine = mixHex('#7fd0e0','#4a3a7a', ens*0.7);
  const eyeC  = mixHex('#bfe8ff','#c77bff', ens);            // calm blue -> Vath's violet
  const sink = easeOut(dive)*160*sc;                          // how far it has settled back under
  cx.save();
  cx.translate(cxm, base + sink);
  cx.globalAlpha=1-dive*0.85;
  // clip below the waterline so the coils read as breaking the surface
  cx.save();
  cx.beginPath(); cx.rect(-W, -H*2, W*2, (H*2)+ (6 - sink)); cx.clip();

  // churned water / glassy ring where the body meets the sea
  cx.fillStyle='rgba(180,225,245,'+(0.16*(1-dive)).toFixed(3)+')';
  cx.beginPath(); cx.ellipse(0, 4, 150*sc*(0.8+0.3*(1-ens)), 22*sc, 0, 0, TAU); cx.fill();

  // three breaching coils to the right of the neck
  for(let i=2;i>=0;i--){
    const bx=(48 + i*52)*sc, by=(6 - Math.sin(t*1.8+i)*6 - i*4)*sc;
    cx.fillStyle= i%2? bodyC : shade(bodyC,10);
    cx.beginPath(); cx.ellipse(bx,by, (44-i*5)*sc, (24-i*3)*sc, 0, Math.PI, TAU); cx.fill();
    cx.strokeStyle='rgba(6,20,26,0.7)'; cx.lineWidth=2.4; cx.stroke();
    cx.fillStyle=spine;   // dorsal spines on each coil
    for(const s of [-18,0,18]){ cx.beginPath();
      cx.moveTo(bx+s*sc-8*sc,by-8*sc); cx.lineTo(bx+s*sc,by-42*sc); cx.lineTo(bx+s*sc+8*sc,by-8*sc);
      cx.closePath(); cx.fill(); }
  }

  // rearing neck
  const hy=(-150 - Math.sin(t*1.5)*8)*sc;
  cx.strokeStyle=bodyC; cx.lineWidth=48*sc; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(6*sc,4*sc); cx.quadraticCurveTo(34*sc,-78*sc, 18*sc, hy+36*sc); cx.stroke();
  cx.fillStyle=spine;   // spines up the throat
  for(let k=0;k<5;k++){ const nt=k/5, npx=(6+30*nt)*sc, npy=4*sc+(hy+30*sc)*nt;
    cx.beginPath(); cx.moveTo(npx-12*sc,npy); cx.lineTo(npx-32*sc,npy-22*sc); cx.lineTo(npx+3*sc,npy-10*sc);
    cx.closePath(); cx.fill(); }

  // the head
  cx.save(); cx.translate(18*sc, hy);
  cx.fillStyle=shade(bodyC,8);
  cx.beginPath(); cx.ellipse(8*sc,0, 52*sc, 34*sc, 0, 0, TAU); cx.fill();
  cx.strokeStyle='rgba(6,20,26,0.8)'; cx.lineWidth=3; cx.stroke();
  // heavy lower jaw, parted
  cx.fillStyle=shade(bodyC,-18);
  cx.beginPath(); cx.moveTo(42*sc,8*sc); cx.quadraticCurveTo(86*sc,16*sc,78*sc,40*sc);
  cx.quadraticCurveTo(36*sc,38*sc,30*sc,14*sc); cx.closePath(); cx.fill();
  // fangs - slim and sharp, the two rows offset half a tooth so they interlock like real teeth
  // (they used to be squat, evenly-stacked triangles that read as a blocky bar)
  cx.fillStyle='#eaf3f2';
  for(let ti=0;ti<7;ti++){ const txp=(33+ti*7)*sc;   // upper row: long fangs stabbing DOWN
    cx.beginPath(); cx.moveTo(txp,4*sc); cx.lineTo(txp+1.8*sc,21*sc); cx.lineTo(txp+3.6*sc,4*sc); cx.closePath(); cx.fill(); }
  for(let ti=0;ti<6;ti++){ const txp=(36.5+ti*7)*sc; // lower row: shorter fangs stabbing UP, offset between the uppers
    cx.beginPath(); cx.moveTo(txp,32*sc); cx.lineTo(txp+1.8*sc,16*sc); cx.lineTo(txp+3.6*sc,32*sc); cx.closePath(); cx.fill(); }
  // swept-back horns
  cx.fillStyle=spine;
  cx.beginPath(); cx.moveTo(-6*sc,-22*sc); cx.lineTo(-30*sc,-66*sc); cx.lineTo(6*sc,-28*sc); cx.closePath(); cx.fill();
  cx.beginPath(); cx.moveTo(16*sc,-24*sc); cx.lineTo(12*sc,-72*sc); cx.lineTo(38*sc,-24*sc); cx.closePath(); cx.fill();
  // heavy brow
  cx.fillStyle=shade(bodyC,-10);
  cx.beginPath(); cx.moveTo(8*sc,-16*sc); cx.lineTo(36*sc,-22*sc); cx.lineTo(33*sc,-2*sc); cx.closePath(); cx.fill();
  // the great eye - the beat that turns from violet to calm blue
  cx.save(); cx.globalCompositeOperation='lighter';
  const eg=cx.createRadialGradient(26*sc,-2*sc,1,26*sc,-2*sc,16*sc);
  eg.addColorStop(0, (ens>0.5?'rgba(199,123,255,0.8)':'rgba(150,220,245,0.8)')); eg.addColorStop(1,'rgba(0,0,0,0)');
  cx.fillStyle=eg; cx.beginPath(); cx.arc(26*sc,-2*sc,16*sc,0,TAU); cx.fill(); cx.restore();
  cx.fillStyle=eyeC; cx.beginPath(); cx.arc(26*sc,-2*sc,9*sc,0,TAU); cx.fill();
  cx.fillStyle='#0a1418'; cx.beginPath(); cx.ellipse(28*sc,-2*sc,3*sc,6*sc,0,0,TAU); cx.fill();  // slit pupil
  cx.restore();

  // the violet binding rings round the throat, while it is still bound
  if(ens>0.05){ const gl=(0.35+0.3*Math.sin(t*3))*ens;
    cx.strokeStyle='rgba(199,123,255,'+gl.toFixed(3)+')'; cx.lineWidth=6*sc;
    cx.beginPath(); cx.arc(18*sc,hy,74*sc,0,TAU); cx.stroke(); }

  cx.restore();   // clip
  cx.lineCap='butt';
  cx.restore();
}

// the binding shattering: violet rings blowing outward off the throat
function lvShatter(cx,x,y,s){
  cx.save(); cx.globalCompositeOperation='lighter';
  const R=Math.max(LV.W,LV.H)*0.5*(1-s);
  for(let i=0;i<3;i++){ const r=R*(0.4+i*0.34);
    cx.strokeStyle='rgba('+(180-i*20)+','+(120+i*20)+',255,'+(0.5*s).toFixed(3)+')';
    cx.lineWidth=(5-i*1.4); cx.beginPath(); cx.arc(x,y,r,0,TAU); cx.stroke(); }
  const bg=cx.createRadialGradient(x,y,2,x,y,Math.max(LV.W,LV.H)*0.3*s);
  bg.addColorStop(0,'rgba(200,150,255,'+(0.6*s).toFixed(3)+')'); bg.addColorStop(1,'rgba(180,120,255,0)');
  cx.fillStyle=bg; cx.beginPath(); cx.arc(x,y,Math.max(LV.W,LV.H)*0.3*s,0,TAU); cx.fill();
  cx.restore();
}

/* ---------- public entry point (called from freeLeviathan in 12-world-layer.js) ---------- */
function leviathanFreedCutscene(m, onDone){
  lvPlay(LV_FREED, {ens:1, calm:0, vath:0}, onDone, m);
}
window.leviathanFreedCutscene=leviathanFreedCutscene;

})();
