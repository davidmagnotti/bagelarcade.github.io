/* =====================================================================
   AAA LAYER - adaptive music, ambience, weather, dynamic light, juice
   ===================================================================== */

/* ---------- banners, cinematics, shockwaves ---------- */
function banner(title,sub){
  const b=document.getElementById('banner');
  document.getElementById('bannerT').textContent=title;
  document.getElementById('bannerS').textContent=sub||'';
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
function cinematic(on){ document.body.classList.toggle('cine',on); }
function shockwave(x,y,color,r){ G.parts.push({x,y,vx:0,vy:0,life:0.35,max:0.35,size:r,color,ring:true}); }

/* ---------- in-world boss entrances ------------------------------------------
   A reusable, ON-CANVAS entrance beat (no overlay): for ~2.5s the world holds
   while the boss ARRIVES on the same screen the fight happens on - the dragon
   taken by the violet, the Leviathan breaching, the Hollow King rising - then
   control returns and combat begins with no cut. Modeled on the G.camCine
   scripted-camera beat in 21-exploration.js: the camera eases onto the boss, a
   title banner lands, an impact beat hits, then it hands straight to the fight.
   Damage immunity during the beat rides on m.introKind (NOT m.invuln, which the
   Hurricane Eye's shield and the snatcher's grab-guard already own). */
const BOSS_INTRO_KIND = {
  enthrall:{ col:'199,123,255', dur:2.8 },   // Vath's violet washes over the beast
  surface: { col:'150,220,245', dur:2.7 },   // rises breaching out of the water
  rise:    { col:'120,220,160', dur:2.6 },   // hauls itself up from the ground
  descend: { col:'210,220,255', dur:2.4 },   // drops out of the storm-sky
  loom:    { col:'220,150,90',  dur:2.4 },   // looms up out of the dark and strides in
};
function startBossIntro(m, opts){
  if(!m || G.bossIntro) return;              // one entrance at a time
  opts=opts||{};
  const kind=opts.kind||'rise', def=BOSS_INTRO_KIND[kind]||BOSS_INTRO_KIND.rise;
  G.bossIntro={ m, kind, t:0, dur:opts.dur||def.dur, col:def.col,
    foc:opts.foc||[m.hx!=null?m.hx:m.x, m.hy!=null?m.hy:m.y],
    title:opts.title||m.title||(m.name||'').toUpperCase()||'A CHALLENGER APPROACHES',
    sub:opts.sub||m.subtitle||'', fired:false, impact:false, _acc:0 };
  m.introKind=kind; m.introT=0; m.entranceDone=true;
  m.state='idle'; m.tx=null; m.ty=null; m.windup=0; m.swing=0; m.noAggroT=1e9;
  if(kind==='enthrall' && m.ensAmt==null && !m.enspelled) m.ensAmt=0;   // the violet washes in (dragon)
  if(kind==='surface') m.surf=0;
  P.click=null; if(typeof input!=='undefined') input.attack=false;
  // the generic first-chase banner in updateBossUI would double up - suppress it
  G.flags['intro_'+m.kind]=true;
  if(typeof cinematic==='function') cinematic(true);
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
  G.shake=Math.max(G.shake||0, 0.35);
}
function updateBossIntro(dt){
  const bi=G.bossIntro; if(!bi) return;
  const m=bi.m;
  // the boss can vanish out from under us (world switch, death, a fresh load) - bail clean
  if(!m || m.dead || !G.mobs || G.mobs.indexOf(m)<0){ endBossIntro(true); return; }
  bi.t+=dt; const p=Math.min(1, bi.t/bi.dur);
  m.introT=p; m.anim=(m.anim||0)+dt; m.hurtT=Math.max(0,(m.hurtT||0)-dt);
  if(bi.kind==='enthrall' && m.ensAmt!=null) m.ensAmt=easeInOut(Math.min(1,p*1.15));
  if(bi.kind==='surface') m.surf=easeOut(p);
  // ease the camera onto the boss (mirrors frame()'s follow math)
  if(typeof isoX==='function'){
    G.cam.x=lerp(G.cam.x, isoX(bi.foc[0],bi.foc[1])-VW/2,    Math.min(1,dt*3));
    G.cam.y=lerp(G.cam.y, isoY(bi.foc[0],bi.foc[1])-VH/2-20, Math.min(1,dt*3));
  }
  // the title lands a third of the way in, once the arrival reads
  if(!bi.fired && p>=0.28){ bi.fired=true; if(typeof banner==='function') banner(bi.title, bi.sub); }
  // the impact beat: the breach / landfall / the King finding his feet
  if(!bi.impact && p>=0.66){ bi.impact=true;
    G.shake=Math.max(G.shake||0, 0.7);
    if(typeof shockwave==='function') shockwave(m.x, m.y, 'rgba('+bi.col+',0.9)', bi.kind==='descend'?70:55);
    if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
  }
  bossIntroFX(m, p, dt, bi);
  // the rest of the world is held this frame, so keep its particle/shake systems
  // ticking here or the entrance FX would freeze mid-air
  for(const pt of G.parts){ if(pt.pickup){ pt.life-=dt; continue; }
    pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.vy+=(pt.grav||0)*dt; pt.life-=dt; }
  G.parts=G.parts.filter(pp=>pp.life>0);
  for(const f of G.floats){ f.y+=f.vy*dt; f.life-=dt; } G.floats=G.floats.filter(f=>f.life>0);
  G.shake=Math.max(0,(G.shake||0)-dt*2.5);
  G.flash=Math.max(0,(G.flash||0)-dt*1.6);
  if(p>=1) endBossIntro(false);
}
function endBossIntro(aborted){
  const bi=G.bossIntro; if(!bi) return;
  const m=bi.m;
  if(m){ m.introKind=null; m.introT=1; m.noAggroT=0;
    if(bi.kind==='enthrall'){ m.ensAmt=1; if(m.kind==='dragon'||m.enspelled!==undefined) m.enspelled=true; }
    if(bi.kind==='surface') m.surf=1;
    if(!aborted) m.state='chase'; }
  G.bossIntro=null;
  if(typeof input!=='undefined') input.attack=false;   // don't let a held tap land the instant it ends
  if(typeof cinematic==='function') cinematic(false);
  if(!aborted){ G.slowmo=Math.max(G.slowmo||0,0.9); if(typeof Snd!=='undefined'&&Snd.boss) Snd.boss(); }
}
function bossIntroFX(m,p,dt,bi){
  if(typeof fxOn==='function' && !fxOn('particles')) return;
  const k=bi.kind, x=m.x, y=m.y, col=bi.col;
  bi._acc=(bi._acc||0)+dt*(k==='enthrall'?26:k==='surface'?30:18);
  let n=Math.floor(bi._acc); bi._acc-=n; if(n>4) n=4;
  for(let i=0;i<n;i++){
    if(k==='enthrall'){                       // violet motes spiral inward as the binding takes
      const a=Math.random()*TAU, r=2.4+Math.random()*1.6;
      const sx=x+Math.cos(a)*r, sy=y-0.6+Math.sin(a)*r*0.6;
      G.parts.push({x:sx,y:sy,vx:(x-sx)*1.7,vy:(y-0.6-sy)*1.7,life:rnd(0.4,0.85),
        color:'rgba('+col+',0.9)',size:rnd(2,4),grav:0,glow:true});
    } else if(k==='surface'){                 // spray flung off the breaching beast
      const a=Math.random()*TAU, sp=rnd(0.6,2.6);
      G.parts.push({x:x+rnd(-1.6,1.6),y:y+rnd(-0.4,0.7),vx:Math.cos(a)*sp,vy:-Math.abs(Math.sin(a))*sp-rnd(0.6,1.8),
        life:rnd(0.5,1.1),color:Math.random()<0.5?'#dff2fb':'rgba('+col+',0.85)',size:rnd(1.6,3.4),grav:0.12});
    } else if(k==='rise'){                     // earth and grave-dust shaken loose as it hauls up
      G.parts.push({x:x+rnd(-1.3,1.3),y:y+rnd(-0.2,0.5),vx:rnd(-0.5,0.5),vy:-rnd(0.5,1.6),
        life:rnd(0.5,1.1),color:Math.random()<0.5?'rgba('+col+',0.8)':'#6b5b47',size:rnd(1.8,3.6),grav:-0.05});
    } else if(k==='descend'){                  // wind-torn motes trailing the descent
      G.parts.push({x:x+rnd(-1.7,1.7),y:y-3-rnd(0,3)*(1-p),vx:rnd(-0.4,0.4),vy:rnd(1.2,2.6),
        life:rnd(0.4,0.9),color:'rgba('+col+',0.8)',size:rnd(1.6,3),grav:0.05,glow:true});
    } else {                                   // loom: dust curling up out of the dark
      G.parts.push({x:x+rnd(-1.5,1.5),y:y+rnd(-0.2,0.4),vx:rnd(-0.3,0.3),vy:-rnd(0.3,1.0),
        life:rnd(0.5,1.0),color:'rgba('+col+',0.6)',size:rnd(2,3.4),grav:-0.02});
    }
  }
}
/* ---------- Act I epilogue: "six months later", the two siblings sail into Stormreach ----------
   Replaces the old credit roll. A self-contained animated scene (its own rAF loop, since the
   world is paused) of the prince and princess crossing open water into a gathering tempest,
   with a click-to-advance dialogue between brother and sister, closing on landfall at Stormreach. */
const EPI = {
  // Each beat: who is speaking ('' = narration), the line, and the target sea-state the visuals
  // ease toward while it is on screen. storm 0..1 = rain/lightning; near 0..1 = island approach.
  beats: [
    { who:'', html:'<i>Six months of open water. The charted isles are long behind the wake, and the sea has run out of names.</i>', storm:0.05, near:0.05 },
    { who:'Joan', html:'“There &mdash; off the bow. See it?” <i>She holds the tiller steady into the wind.</i> “That dark line isn\'t weather, Jaist. It\'s land &mdash; the first we\'ve seen in weeks.”', storm:0.24, near:0.26 },
    { who:'Jaist', html:'<i>He doesn\'t look up from the chart in his lap.</i> “…Father would have had its name before we cleared the swell. I keep starting to turn and ask him.”', storm:0.44, near:0.48 },
    { who:'Joan', html:'<i>She sets a hand over his.</i> “It\'s the last name on Orin\'s chart &mdash; <b>Stormreach</b>. One rock under a storm that never breaks, past anywhere Vath\'s reach can follow.” <i>Her voice goes quiet and hard.</i> “Father spent everything to buy us this water. We don\'t waste it grieving where he can\'t see.”', storm:0.66, near:0.68 },
    { who:'Joan', html:'“So we take the rock. We get strong. And one day we come back for him.” <i>She turns the bow into the black swell.</i> “Hold on to something, little brother. We land together.”', storm:0.88, near:0.86 },
    { who:'', html:'<i>The keel comes up out of the dark and grinds onto black shingle. High above the rain, a single light is burning. You have reached the last name on the map.</i>', storm:1, near:1, land:1 },
  ],
  raf:0, t:0, prev:0, cv:null, cx:null, idx:0, storm:0, near:0, land:0, flash:0, flashT:6, drops:[], running:false, ended:false,
};
function rollCredits(){ sailEpilogue(); }   // old call-site name kept as an alias
function sailEpilogue(){
  const ov=document.getElementById('epiOv');
  const cv=document.getElementById('epiCv');
  const title=document.getElementById('epiTitle');
  const sub=document.getElementById('epiSub');
  if(!ov||!cv){ // graceful fallback: land them on Stormreach without the cinematic
    if(typeof _epiLandfall==='function') _epiLandfall();
    else if(typeof toastErr==='function') toastErr('<b style="color:#c9a0ff">Six months on, you and your brother make landfall on storm-locked Stormreach.</b>',9000);
    return;
  }
  EPI.cv=cv; EPI.cx=cv.getContext('2d');
  EPI.t=0; EPI.prev=0; EPI.idx=0; EPI.storm=0.05; EPI.near=0.02; EPI.land=0; EPI.flash=0; EPI.flashT=6;
  EPI.drops.length=0; EPI.ended=false; EPI.running=true;
  sub.classList.remove('show'); title.classList.remove('show');
  ov.style.display='flex';
  G.paused=true; G._credits=1;
  if(typeof cinematic==='function') cinematic(true);
  _epiResize();
  window.addEventListener('resize', _epiResize);
  // title card first, then fade it out and start the dialogue
  setTimeout(()=>title.classList.add('show'), 200);
  setTimeout(()=>{ title.classList.remove('show'); }, 3400);
  setTimeout(()=>_epiShow(0), 3900);
  // advance the dialogue on click anywhere over the scene (once the first line is up)
  EPI.started=false;
  ov.onclick=()=>{ if(EPI.ended || !EPI.started) return; _epiNext(); };
  cancelAnimationFrame(EPI.raf);
  EPI.raf=requestAnimationFrame(_epiLoop);
}
function _epiResize(){
  const cv=EPI.cv; if(!cv) return;
  const r=cv.getBoundingClientRect();
  const dpr=Math.min(2, window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));
  cv.height=Math.max(1,Math.round(r.height*dpr));
  EPI.cx.setTransform(dpr,0,0,dpr,0,0);
  EPI.W=r.width; EPI.H=r.height;
}
function _epiShow(i){
  const b=EPI.beats[i]; if(!b) return;
  EPI.idx=i; EPI.started=true;
  document.getElementById('epiWho').textContent=b.who||'';
  document.getElementById('epiLine').innerHTML=b.html;
  const tap=document.getElementById('epiTap');
  if(tap) tap.textContent=(i>=EPI.beats.length-1)?'step ashore ›':'click to continue ›';
  const sub=document.getElementById('epiSub');
  sub.classList.remove('show'); void sub.offsetWidth; sub.classList.add('show');
}
function _epiNext(){
  if(EPI.idx>=EPI.beats.length-1){ _epiFinish(); return; }
  const sub=document.getElementById('epiSub');
  sub.classList.remove('show');
  setTimeout(()=>_epiShow(EPI.idx+1), 340);
}
function _epiFinish(){
  EPI.ended=true;
  const sub=document.getElementById('epiSub');
  if(sub) sub.classList.remove('show');
  // let the scene settle to black (beat 10 eases land->1), then make landfall for real
  setTimeout(_epiLandfall, 1200);
}
// Hand off from the cutscene straight into the Stormreach world: Act II opens with the
// two siblings ashore together, the prince holding the boat while the princess explores.
function _epiLandfall(){
  EPI.running=false; cancelAnimationFrame(EPI.raf);
  window.removeEventListener('resize', _epiResize);
  P.story=P.story||{};
  P.story.act=Math.max(P.story.act||1,2);
  P.story.act2=1; P.story.reachArrived=1;   // Act II: Stormreach and the far isles open up
  if(G.interior){ G.interior=null; }
  P.dead=false;
  const deadOv=document.getElementById('deadOv'); if(deadOv) deadOv.style.display='none';
  G.state='play';
  if(typeof switchWorld==='function') switchWorld('reach');
  if(typeof placeReachHomecoming==='function') placeReachHomecoming();
  // drop the cutscene overlay and let the storm-coast show through
  const ov=document.getElementById('epiOv'); if(ov){ ov.style.display='none'; ov.onclick=null; }
  G._credits=0; G.paused=false;
  if(typeof cinematic==='function') cinematic(false);
  if(typeof ui==='function') ui(); else if(typeof refreshUI==='function') refreshUI();
  if(typeof banner==='function') banner('STORMREACH','ACT II — THE STORM-COAST');
  // the prince stays with the boat; the princess takes the isle
  setTimeout(()=>{ if(typeof storyCard==='function') storyCard(
    '<i>The keel bites black shingle and holds. You step down into a rain that has never once stopped, and the little sloop settles behind you.</i> '
    + '“This is where I earn my keep,” <i>your brother says, already lashing the bow-line to a spar of old wreck.</i> '
    + '“One of us guards the way home &mdash; and it isn\'t going to be the one who reads maps for a living. I\'ll hold the strand, and the boat.” '
    + '<i>He grips your arm the way he did when you were children, except now his hand is steady.</i> '
    + '“Go on into the isle, sister. Find out what Stormreach is hiding. I\'ll be right here when you need the sea again.”',
    {label:'Take the isle', onOk:()=>{ if(typeof autoSave==='function') autoSave(); }}); }, 600);
}
// The prince and the beached sloop, stationed on Wreckstrand where the cutscene lands.
function placeReachHomecoming(){
  if(G.worldId!=='reach') return;
  const Z=(typeof REACH_ZONES!=='undefined' && REACH_ZONES.strand) ? REACH_ZONES.strand : {x:60,y:98};
  // The beached sloop is placed by placeObjectsReach and the prince by spawnReachFolk (so
  // both persist on every visit, not just this cutscene). This stays as a safety fallback:
  // if the brother somehow isn't on the strand, put him there. Normally it no-ops.
  if(!G.npcs.some(n=>n.id==='brother')){
    const sp=(typeof findOpenNear==='function' && findOpenNear(Math.round(Z.x+2), Math.round(Z.y+1), 5)) || [Z.x+2, Z.y+1];
    const b=makeNPC('brother','Jaist, Your Brother the Prince', sp[0], sp[1],
      {skin:'#d8a97a',hair:'#7a5a3a',shirt:'#3b5a7a',pants:'#33302a',cloak:'#274052',hairstyle:'short'},
      ["Go on - I'll mind the boat. If this rock stoves a hull the way the charts promised, someone has to keep our way home afloat.",
       "I'll keep a fire lit here on the strand. Find what this place is hiding, Joan - nothing I'd have to write a ballad about.",
       "Storm won't let up. Shout if the isle bites back and I'll come running, axe and all."],0.1);
    b.nightOwl=true;
    G.npcs.push(b);
  }
}
function _epiLoop(ts){
  if(!EPI.running) return;
  if(!EPI.prev) EPI.prev=ts;
  let dt=(ts-EPI.prev)/1000; EPI.prev=ts;
  if(dt>0.05) dt=0.05;
  EPI.t+=dt;
  // ease the sea-state toward the current beat's targets so the storm builds as they talk
  const b=EPI.beats[EPI.idx]||EPI.beats[0];
  EPI.storm += (b.storm-EPI.storm)*Math.min(1,dt*0.7);
  EPI.near  += (b.near -EPI.near )*Math.min(1,dt*0.5);
  EPI.land  += ((b.land?1:0)-EPI.land)*Math.min(1,dt*0.6);
  // lightning, more frequent as the storm builds
  EPI.flash=Math.max(0,EPI.flash-dt*3.2);
  EPI.flashT-=dt*(0.3+EPI.storm*1.6);
  if(EPI.flashT<=0 && EPI.storm>0.45){ EPI.flashT=2.2+Math.random()*4; EPI.flash=1; }
  _epiDraw();
  EPI.raf=requestAnimationFrame(_epiLoop);
}
function _epiDraw(){
  const cx=EPI.cx, W=EPI.W, H=EPI.H, t=EPI.t; if(!cx||!W) return;
  const storm=EPI.storm, near=EPI.near;
  const horizon=H*0.52;
  // --- sky: dusk that darkens into tempest as storm rises ---
  const sky=cx.createLinearGradient(0,0,0,horizon);
  const calm=[[36,44,74],[92,86,120],[196,150,120]];   // deep blue -> mauve -> warm haze
  const wild=[[8,10,20],[26,26,44],[52,52,74]];         // near-black storm
  const mix=(a,b,k)=>Math.round(a+(b-a)*k);
  sky.addColorStop(0,   `rgb(${mix(calm[0][0],wild[0][0],storm)},${mix(calm[0][1],wild[0][1],storm)},${mix(calm[0][2],wild[0][2],storm)})`);
  sky.addColorStop(0.6, `rgb(${mix(calm[1][0],wild[1][0],storm)},${mix(calm[1][1],wild[1][1],storm)},${mix(calm[1][2],wild[1][2],storm)})`);
  sky.addColorStop(1,   `rgb(${mix(calm[2][0],wild[2][0],storm)},${mix(calm[2][1],wild[2][1],storm)},${mix(calm[2][2],wild[2][2],storm)})`);
  cx.fillStyle=sky; cx.fillRect(0,0,W,horizon+2);
  // lightning wash over the sky
  if(EPI.flash>0.01){ cx.fillStyle=`rgba(210,220,255,${0.5*EPI.flash})`; cx.fillRect(0,0,W,horizon+2); }
  // --- Stormreach: a dark island that grows on the horizon as `near` rises, with a beacon ---
  if(near>0.05){
    const iw=W*(0.16+near*0.7), ih=H*(0.06+near*0.34);
    const ix=W*0.5, iy=horizon;
    cx.save();
    cx.fillStyle=`rgba(14,16,26,${Math.min(1,0.5+near*0.5)})`;
    cx.beginPath(); cx.moveTo(ix-iw*0.5,iy);
    // a jagged storm-rock silhouette with a central spire
    cx.lineTo(ix-iw*0.30,iy-ih*0.55);
    cx.lineTo(ix-iw*0.12,iy-ih*0.42);
    cx.lineTo(ix,          iy-ih*1.0);   // the spire (lighthouse rock)
    cx.lineTo(ix+iw*0.14,iy-ih*0.40);
    cx.lineTo(ix+iw*0.32,iy-ih*0.58);
    cx.lineTo(ix+iw*0.5, iy);
    cx.closePath(); cx.fill();
    // beacon light at the spire tip
    const bx=ix, by=iy-ih*1.0;
    const pulse=0.6+0.4*Math.sin(t*3);
    const bg=cx.createRadialGradient(bx,by,0,bx,by,26*near+8);
    bg.addColorStop(0,`rgba(255,214,140,${(0.7+0.3*pulse)*Math.min(1,near*1.4)})`);
    bg.addColorStop(1,'rgba(255,214,140,0)');
    cx.fillStyle=bg; cx.beginPath(); cx.arc(bx,by,26*near+8,0,TAU); cx.fill();
    cx.restore();
  }
  // --- sea ---
  cx.fillStyle=`rgb(${mix(30,10,storm)},${mix(58,26,storm)},${mix(86,44,storm)})`;
  cx.fillRect(0,horizon,W,H-horizon);
  // rolling wave lines, choppier as the storm builds
  const amp=2+storm*7;
  for(let r=0;r<10;r++){
    const yy=horizon+ (H-horizon)*(r/10)+ (r*r)*0.4;
    if(yy>H) break;
    cx.strokeStyle=`rgba(${mix(120,60,storm)},${mix(160,90,storm)},${mix(200,130,storm)},${0.18+r*0.015})`;
    cx.lineWidth=1+r*0.25;
    cx.beginPath();
    for(let x=0;x<=W;x+=14){
      const y=yy+Math.sin(x*0.03 + t*(1.2+r*0.15) + r)*amp*(0.4+r*0.09);
      x===0?cx.moveTo(x,y):cx.lineTo(x,y);
    }
    cx.stroke();
  }
  // --- the boat, riding the foreground swell ---
  const bxp=W*0.5, bob=Math.sin(t*1.4)*(3+storm*7), tilt=Math.sin(t*1.4+0.6)*(0.02+storm*0.06);
  const byp=H*0.72+bob;
  cx.save(); cx.translate(bxp,byp); cx.rotate(tilt);
  const S=Math.max(0.7,Math.min(1.4,W/560));
  cx.scale(S,S);
  // hull
  cx.fillStyle='#5a3a22'; cx.strokeStyle='#2c1a10'; cx.lineWidth=2;
  cx.beginPath();
  cx.moveTo(-52,0); cx.quadraticCurveTo(-58,16,-34,20);
  cx.lineTo(34,20); cx.quadraticCurveTo(58,16,52,0);
  cx.closePath(); cx.fill(); cx.stroke();
  cx.fillStyle='#3f2716'; cx.fillRect(-46,0,92,5);
  // mast + sail, bellied by the wind (leans harder in the storm)
  cx.strokeStyle='#2c1a10'; cx.lineWidth=3;
  cx.beginPath(); cx.moveTo(0,0); cx.lineTo(0,-62); cx.stroke();
  const belly=8+storm*16;
  cx.fillStyle='#e7ddc8';
  cx.beginPath(); cx.moveTo(2,-60); cx.quadraticCurveTo(2+belly,-34,2,-6);
  cx.lineTo(2,-6); cx.quadraticCurveTo(2+belly*0.5,-32,2,-60); cx.closePath();
  cx.fill();
  cx.beginPath(); cx.moveTo(-2,-58); cx.quadraticCurveTo(-2-belly*0.7,-32,-2,-8);
  cx.lineTo(-2,-8); cx.quadraticCurveTo(-2-belly*0.35,-32,-2,-58); cx.closePath();
  cx.fillStyle='#d8ccb2'; cx.fill();
  // two figures: the prince at the tiller (stern), the princess at the bow
  // prince
  cx.fillStyle='#3b5a7a';
  cx.beginPath(); cx.arc(-24,-6,4.2,0,TAU); cx.fill();            // head
  cx.fillRect(-28,-4,8,14);                                       // body
  // princess (warrior, at the bow, hand raised toward the isle)
  cx.fillStyle='#7a2f2f';
  cx.beginPath(); cx.arc(26,-8,4.2,0,TAU); cx.fill();
  cx.fillRect(22,-6,8,15);
  cx.strokeStyle='#7a2f2f'; cx.lineWidth=2.4;
  cx.beginPath(); cx.moveTo(30,-4); cx.lineTo(37,-12); cx.stroke(); // reaching arm
  cx.restore();
  // --- rain, thickening with the storm ---
  const want=Math.round(storm*W*0.5);
  while(EPI.drops.length<want) EPI.drops.push({x:Math.random()*W,y:Math.random()*H,s:400+Math.random()*400,l:8+Math.random()*10});
  if(EPI.drops.length>want) EPI.drops.length=want;
  if(EPI.drops.length){
    cx.strokeStyle=`rgba(200,220,250,${0.28*storm})`; cx.lineWidth=1; cx.beginPath();
    for(const d of EPI.drops){ d.y+=d.s*0.016; d.x+=d.s*0.006; if(d.y>H){ d.y=-10; d.x=Math.random()*W; }
      cx.moveTo(d.x,d.y); cx.lineTo(d.x-d.l*0.18,d.y-d.l); }
    cx.stroke();
  }
  // landfall: darken and settle as they step ashore
  if(EPI.land>0.01){ cx.fillStyle=`rgba(4,6,12,${0.55*EPI.land})`; cx.fillRect(0,0,W,H); }
  // vignette
  const vg=cx.createRadialGradient(W*0.5,H*0.5,H*0.2,W*0.5,H*0.5,H*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.55)');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);
}

/* ---------- Act I climax: the throne-hall cutscene ----------
   Replaces the old chain of story-cards. A self-contained animated scene (its own rAF
   loop, since the world is paused) of the last stand in the Tideglass hall: Vath crashes
   in, King Aldous throws his golden Tideglass fire against the enchanter's violet to buy
   his children's escape, spends himself doing it, and Vath takes the magic and rewrites
   the guards' memory to frame the prince and princess. On its final beat it hands off to
   sailEpilogue() - the "six months later" sea crossing - so Act I closes straight into
   the Act II opener. Built to mirror the EPI epilogue above. */
const THR = {
  // Each beat: who is speaking ('' = narration), the line, an optional title-card flash,
  // and the scene-state the visuals ease toward while the beat is on screen.
  //   vath   0..1  Vath's presence / advance from the shattered doors toward the throne
  //   gold   0..1  King Aldous's Tideglass fire
  //   violet 0..1  Vath's sorcery
  //   clash  0..1  the two magics meeting in the middle of the hall
  //   flee   0..1  the siblings' run from the dais (0) out the east doors (1, then gone)
  //   guards 0..1  the King's guard flooding the hall
  //   takeFlash/pulse/dark: one-shot flags for the beat they fire on
  beats: [
    // The homecoming, before the storm: the King on his feet at the throne, turned to face
    // his children - joy and disbelief - a quiet beat with no enemy in the room yet.
    { who:'King Aldous', kingFace:'kids',
      html:'“You’re home. Joan — Jaist — I can’t believe it. Both of you, home at last.”',
      vath:0, gold:0.14, violet:0, clash:0, flee:0, guards:0 },
    { who:'Vath', title:'THE ENCHANTER COMES',
      html:'“Forgive me — I do hate to interrupt so loving a family reunion. But how good of you all to gather in a single room.”',
      vath:0.55, gold:0.16, violet:0.32, clash:0, flee:0, guards:0 },
    // the King speaks and moves FIRST — plants himself between, gold only just waking,
    // Vath's hand rising. No beams yet: the defiance lands before the violence.
    { who:'King Aldous', title:'THE KING RISES',
      html:'“You won’t have them, Vath. Not again — I will not let you take them from me a second time.”',
      vath:0.85, gold:0.5, violet:0.55, clash:0, flee:0, guards:0 },
    // Vath answers with a wicked flourish and lifts his hands — the violet gathering, no beam
    // loosed yet: the threat lands, THEN the strike on the next beat.
    { who:'Vath',
      html:'“Then it’s time for all of you to meet the end.”',
      vath:1, gold:0.5, violet:0.85, clash:0, flee:0, guards:0 },
    // NOW Vath strikes — a wordless beat: the animation carries it (auto-advances).
    { who:'', html:'',
      vath:1, gold:0.85, violet:0.8, clash:0.6, flee:0, guards:0, strike:1 },
    { who:'King Aldous',
      html:'“RUN! Both of you — out the east doors, to the water — GO, and do not look back!”',
      vath:0.78, gold:1, violet:0.5, clash:1, flee:0.08, guards:0 },
    // the prince digs in - he won't abandon the father he only just found. The King, still
    // holding Vath off, cuts him down: they can't win this, not yet. The siblings stay put
    // (flee held low) through the argument; only the princess's resolve breaks it.
    { who:'Jaist',
      html:'“No, Father — we won’t leave you to face Vath alone!”',
      vath:0.78, gold:0.98, violet:0.5, clash:0.98, flee:0.06, guards:0 },
    { who:'King Aldous',
      html:'“You don’t stand a chance against him, not as you are.”',
      vath:0.8, gold:0.95, violet:0.55, clash:0.92, flee:0.06, guards:0 },
    // Joan makes the call - she crosses the hall and SEIZES her brother by the arm.
    { who:'Joan',
      html:'“Then we live to come back for him! Jaist — with me, NOW.”',
      vath:0.78, gold:0.95, violet:0.55, clash:0.9, flee:0.4, guards:0 },
    // wordless: she HAULS him up the nave toward the east doors, the camera tracking the drag.
    { who:'', html:'',
      vath:0.8, gold:0.92, violet:0.55, clash:0.85, flee:0.74, guards:0 },
    { who:'King Aldous',
      html:'“…Gone. They’re gone, Vath. Whatever else you take from me today — you did not take them. You never will.”',
      vath:0.82, gold:0.9, violet:0.55, clash:0.82, flee:1, guards:0 },
    // the bait revealed - and Vath looses ONE massive beam that hurls the spent King to the floor.
    { who:'Vath',
      html:'“Take them? Old man — I never wanted the children. They were bait. I needed you off that throne and spending thirty years of hoarded strength in one reckless breath.”',
      vath:1, gold:0.3, violet:0.85, clash:0, flee:1, guards:0, bigStrike:1 },
    { who:'Vath', title:'THE TIDEGLASS TAKEN',
      html:'“You have just tired yourself out enough for me to TAKE it.”',
      vath:1, gold:0.1, violet:0.95, clash:0, flee:1, guards:0, takeFlash:1 },
    { who:'The Captain',
      html:'“STAND DOWN! On the ground, hands from your sides — you are under arrest for—”',
      vath:1, gold:0.07, violet:0.58, clash:0, flee:1, guards:1 },
    { who:'The Captain',
      html:'“…what… happened…?”',
      vath:1, gold:0.05, violet:0.7, clash:0, flee:1, guards:1, pulse:1 },
    { who:'Vath',
      html:'“What happened is that the old King’s own son and daughter came home to seize his throne — and struck him down with sorcery when he refused them. They fled east across the water as I arrived. …Would that I had been sooner.”',
      vath:1, gold:0.05, violet:0.55, clash:0, flee:1, guards:1 },
    { who:'The Captain', title:'END OF ACT I',
      html:'“The prince… and the princess… did this. We’ll put every hull on the water after them.”',
      vath:1, gold:0.04, violet:0.5, clash:0, flee:1, guards:1, dark:1 },
  ],
  raf:0, t:0, prev:0, cv:null, cx:null, idx:0,
  vAdv:0, kAdv:0, flee:0, pflee:0, gold:0.12, violet:0, clash:0, guards:0, kingDown:0, dark:0,
  kHand:0, vHand:0,   // casting gesture: how far the King's / Vath's hands are raised (0..1)
  fx:1.3, fy:0.9, zoom:1.18, stepH:0, stepP:0, stepK:0, stepV:0,
  hero:null, prince:null, king:null, vath:null, _ph:null, _pp:null, _pk:null, _pv:null,
  flash:0, flashT:5, pulseR:0, take:0, strike:0, bigStrike:0, sparks:[],
  running:false, ended:false, started:false,
};
/* Per-beat staging the beats table doesn't carry: how far the King has stepped down
   (kAdv), where the camera centres (foc, world tiles), the scene zoom, and whether the
   King has dropped (kingDown). Indexed 1:1 with THR.beats. */
const THR_STAGE=[
  {kAdv:0,    foc:[2.6,2.3], zoom:1.10, kingDown:0},  // 0  the homecoming - King faces his children
  {kAdv:0,    foc:[1.3,0.9], zoom:1.18, kingDown:0},  // 1  Vath comes - King still on the throne
  {kAdv:0.8,  foc:[1.6,1.2], zoom:1.23, kingDown:0},  // 2  King declares - steps between, no beams yet
  {kAdv:0.9,  foc:[1.7,1.3], zoom:1.25, kingDown:0},  // 3  Vath: 'meet the end' - hands raised, violet gathering
  {kAdv:0.95, foc:[1.8,1.4], zoom:1.26, kingDown:0},  // 4  Vath strikes, King in its path
  {kAdv:1,    foc:[1.9,1.5], zoom:1.26, kingDown:0},  // 5  the surge / RUN
  {kAdv:0.98, foc:[3.2,2.7], zoom:1.14, kingDown:0},  // 6  the Prince refuses to leave
  {kAdv:0.95, foc:[2.4,2.0], zoom:1.18, kingDown:0},  // 7  the King's warning
  {kAdv:0.95, foc:[3.1,2.9], zoom:1.16, kingDown:0},  // 8  Joan seizes her brother
  {kAdv:0.92, foc:[5.0,4.7], zoom:1.10, kingDown:0},  // 9  she hauls him up the nave to the doors
  {kAdv:0.9,  foc:[2.2,1.6], zoom:1.18, kingDown:0},  // 10 the King watches them go (still on his feet)
  {kAdv:0.6,  foc:[1.9,1.4], zoom:1.27, kingDown:1},  // 11 the bait - one great beam fells the King
  {kAdv:0.55, foc:[1.9,1.4], zoom:1.28, kingDown:1},  // 12 the Tideglass taken
  {kAdv:0.5,  foc:[2.6,2.1], zoom:1.12, kingDown:1},  // 13 guards flood in
  {kAdv:0.5,  foc:[2.4,1.9], zoom:1.14, kingDown:1},  // 14 the memory pulse
  {kAdv:0.5,  foc:[2.4,1.9], zoom:1.16, kingDown:1},  // 15 Vath's lie
  {kAdv:0.5,  foc:[2.2,1.7], zoom:1.22, kingDown:1},  // 16 END OF ACT I
];
/* --- staging: the throne hall laid out on the iso grid (world tiles) ---------
   The nave runs down the line x==y (which projects straight down the screen);
   _beside(k,o) steps o tiles to one side of the centreline at depth k. */
const _along =k=>({x:k,y:k});
const _beside=(k,o)=>({x:k+o,y:k-o});
const THRONE = _along(0.6);
const KING0  = _along(1.5),  KINGF = _along(2.55);            // King: throne-front -> stepped down to shield
const VATH0  = _beside(-0.6,2.0), VATHF = _beside(1.5,1.15);  // Vath: side door -> at the King's right hand
const HERO0  = _beside(3.7,-0.5), HEROF = _beside(9.4,-0.5);  // princess: mid-nave -> out the doors
const PRIN0  = _beside(3.7, 0.5), PRINF = _beside(9.4, 0.5);  // prince: beside her
const COLUMNS=[]; for(const k of [0.6,2.6,4.6,6.6]) for(const o of [-2.6,2.6]) COLUMNS.push(_beside(k,o));
const GUARDPOS=[-2,-1,0,1,2].map(o=>_beside(6.1,o));
/* Real in-game appearance objects (fed to drawHumanoid, exactly as the live world does) */
const LOOK_HERO ={hero:true,fem:true,skin:'#d8a97a',hair:'#7a4526',shirt:'#a2286a',pants:'#5a1a3e',trim:'#e6c25a',hairstyle:'ponytail',crest:true};   // her royal colours - deep magenta-red, not the castaway green
const LOOK_KING ={skin:'#d8b48c',hair:'#d6d0c4',shirt:'#3a2f5e',pants:'#2a2340',robe:'#402a68',trim:'#c9a24e',beard:'#d6d0c4',beardLong:true,hat:'crown',necklace:'#c9a24e'};
const LOOK_KSPENT={skin:'#9a9488',hair:'#c8c4ba',shirt:'#2c2836',pants:'#232030',robe:'#332b3e',trim:'#7a6a4a',beard:'#c8c4ba',beardLong:true,hat:'crown',necklace:'#6a5f45'};
const LOOK_VATH ={skin:'#c2a892',hair:'#241a2e',robe:'#4a2a5e',rune:true,beard:'#2a2038'};
const LOOK_PRINCE={skin:'#d8a97a',hair:'#7a5a3a',shirt:'#3b5a7a',pants:'#33302a',cloak:'#274052',hairstyle:'short'};
const LOOK_GUARD={skin:'#c9a37a',hair:'#3a2f26',shirt:'#46525f',pants:'#33302a',armor:2,pauldrons:true,hat:'hood',hatColor:'#556170'};
function throneCutscene(){
  const ov=document.getElementById('thrOv');
  const cv=document.getElementById('thrCv');
  const title=document.getElementById('thrTitle');
  const sub=document.getElementById('thrSub');
  if(!ov||!cv){ _thrEndAct(); return; }   // graceful fallback: resolve Act I and sail on
  THR.cv=cv; THR.cx=cv.getContext('2d');
  THR.t=0; THR.prev=0; THR.idx=0;
  THR.vAdv=0; THR.kAdv=0; THR.flee=0; THR.pflee=0; THR.gold=0.12; THR.violet=0; THR.clash=0; THR.guards=0; THR.kingDown=0; THR.dark=0;
  THR.kHand=0; THR.vHand=0; clearTimeout(THR._autoTO);
  THR.fx=THR_STAGE[0].foc[0]; THR.fy=THR_STAGE[0].foc[1]; THR.zoom=THR_STAGE[0].zoom;
  THR.stepH=0; THR.stepP=0; THR.stepK=0; THR.stepV=0;
  THR.hero={...HERO0}; THR.prince={...PRIN0}; THR.king={...KING0}; THR.vath={...VATH0};
  THR._ph={...HERO0}; THR._pp={...PRIN0}; THR._pk={...KING0}; THR._pv={...VATH0};
  THR.flash=0; THR.flashT=5; THR.pulseR=0; THR.take=0; THR.strike=0; THR.bigStrike=0; THR.sparks.length=0;
  THR.ended=false; THR.started=false; THR.running=true;
  sub.classList.remove('show'); title.classList.remove('show');
  ov.style.display='flex';
  G.paused=true; G._credits=1;
  if(typeof cinematic==='function') cinematic(true);
  _thrResize();
  window.addEventListener('resize', _thrResize);
  setTimeout(()=>_thrShow(0), 650);   // brief fade-in, then Vath crashes the hall
  ov.onclick=()=>{ if(THR.ended || !THR.started) return; _thrNext(); };
  cancelAnimationFrame(THR.raf);
  THR.raf=requestAnimationFrame(_thrLoop);
}
function _thrResize(){
  const cv=THR.cv; if(!cv) return;
  const r=cv.getBoundingClientRect();
  const dpr=Math.min(2, window.devicePixelRatio||1);
  cv.width=Math.max(1,Math.round(r.width*dpr));
  cv.height=Math.max(1,Math.round(r.height*dpr));
  THR.cx.setTransform(dpr,0,0,dpr,0,0);
  THR.W=r.width; THR.H=r.height;
}
function _thrShow(i){
  const b=THR.beats[i]; if(!b) return;
  THR.idx=i; THR.started=true;
  clearTimeout(THR._autoTO);
  if(b.takeFlash){ THR.flash=1.2; THR.take=1; }
  if(b.strike){ THR.strike=1; }      // Vath's violet lash, aimed past the King at the children
  if(b.bigStrike){ THR.bigStrike=1; THR.flash=Math.max(THR.flash,0.7); if(Snd&&Snd.magic)try{Snd.magic();}catch(e){} }  // the killing bolt that fells the King
  if(b.pulse){ THR.pulseR=0.001; }   // kick off the memory-rewrite ring
  document.getElementById('thrWho').textContent=b.who||'';
  document.getElementById('thrLine').innerHTML=b.html||'';
  const sub=document.getElementById('thrSub');
  const wordless=!(b.html||'').replace(/<[^>]*>/g,'').trim();
  if(wordless){
    // no line to read (a pure-action beat) - hide the box and let the motion play,
    // then carry on by itself. A click still advances early.
    sub.classList.remove('show');
    THR._autoTO=setTimeout(()=>_thrNext(), 1800);
  } else {
    const tap=document.getElementById('thrTap');
    if(tap) tap.textContent=(i>=THR.beats.length-1)?'the sea waits ›':'click to continue ›';
    sub.classList.remove('show'); void sub.offsetWidth; sub.classList.add('show');
  }
  // title-card flash for the marquee beats
  if(b.title){
    const t=document.getElementById('thrTitle'), tt=document.getElementById('thrTitleT');
    if(t&&tt){ tt.textContent=b.title; t.classList.remove('show'); void t.offsetWidth;
      t.classList.add('show'); clearTimeout(THR._titleTO);
      THR._titleTO=setTimeout(()=>t.classList.remove('show'), 2600); }
  }
}
function _thrNext(){
  clearTimeout(THR._autoTO);
  if(THR.idx>=THR.beats.length-1){ _thrFinish(); return; }
  const sub=document.getElementById('thrSub');
  sub.classList.remove('show');
  setTimeout(()=>_thrShow(THR.idx+1), 320);
}
function _thrFinish(){
  THR.ended=true;
  const sub=document.getElementById('thrSub'); if(sub) sub.classList.remove('show');
  const title=document.getElementById('thrTitle'); if(title) title.classList.remove('show');
  // let the hall settle to black (last beat eases dark->1), then hand to the sea crossing
  setTimeout(_thrEndAct, 1400);
}
// Close Act I for good and roll straight into the "six months later" sailing epilogue.
function _thrEndAct(){
  THR.running=false; cancelAnimationFrame(THR.raf);
  window.removeEventListener('resize', _thrResize);
  const ov=document.getElementById('thrOv'); if(ov){ ov.style.display='none'; ov.onclick=null; }
  P.story=P.story||{};
  P.story.act1End=1; P.story.vathAscendant=1; P.story.kingFallen=1; P.story.framed=1;
  if(typeof qs==='function' && qs('homecoming')==='active' && typeof completeQuest==='function') completeQuest('homecoming');
  if(typeof updateCrownFolkMood==='function') updateCrownFolkMood();
  if(typeof autoSave==='function') autoSave();
  if(typeof sailEpilogue==='function') sailEpilogue();
}
function _thrLoop(ts){
  if(!THR.running) return;
  if(!THR.prev) THR.prev=ts;
  let dt=(ts-THR.prev)/1000; THR.prev=ts;
  if(dt>0.05) dt=0.05;
  THR.t+=dt;
  const b=THR.beats[THR.idx]||THR.beats[0];
  const st=THR_STAGE[THR.idx]||THR_STAGE[0];
  const e=(cur,tgt,k)=>cur+(tgt-cur)*Math.min(1,dt*k);
  THR.vAdv    = e(THR.vAdv,    b.vath||0,     1.4);
  THR.kAdv    = e(THR.kAdv,    st.kAdv||0,    1.8);
  THR.flee    = e(THR.flee,    b.flee||0,     1.1);
  THR.gold    = e(THR.gold,    b.gold||0,     (b.gold||0)<THR.gold?4.5:2.2); // guttering falls fast
  THR.violet  = e(THR.violet,  b.violet||0,   2.0);
  THR.clash   = e(THR.clash,   b.clash||0,    3.0);
  THR.guards  = e(THR.guards,  b.guards||0,   2.0);
  THR.kingDown= e(THR.kingDown,st.kingDown||0,1.6);
  THR.dark    = e(THR.dark,    b.dark?1:0,    0.8);
  // Vath's hand pose across the beats: absent at the homecoming (0), rising as he enters (1),
  // fully raised on his gathering (2), then thrust down to loose the strike (3+), and closing
  // to a grasp as he takes the Tideglass (10), lowered once it is done (11+). (The King's own
  // hand-raise is computed but only ever drawn when he faces the camera - see _thrDraw.)
  const _i=THR.idx;
  // The King faces Vath for the whole confrontation (back-to-camera), so his cast-hands would
  // only ever render as a mis-placed pair behind him - keep them down for good once Vath is here.
  const kHandT = 0;
  // Vath lifts his hands to LOOSE the beam: fully raised from his threat through the clash and
  // the great bait-beam (beats 2-11), high again as he seizes the Tideglass (12), lowered after (13+).
  const vHandT = _i<=0 ? 0 : _i===1 ? 0.6 : (_i>=2 && _i<=11) ? 1 : _i===12 ? 0.85 : 0;
  THR.kHand = e(THR.kHand, kHandT, 3.2);
  THR.vHand = e(THR.vHand, vHandT, 3.2);
  THR.fx=e(THR.fx,st.foc[0],1.6); THR.fy=e(THR.fy,st.foc[1],1.6);
  THR.zoom=e(THR.zoom,st.zoom||1.15,1.4);
  THR.take=Math.max(0,THR.take-dt*0.5);
  THR.strike=Math.max(0,THR.strike-dt*0.9);  // the lash retracts to the King as he catches it
  THR.bigStrike=Math.max(0,THR.bigStrike-dt*0.6);  // the great bait-beam lingers, then fades
  // storm-lightning through the high windows, keener as the violet rises
  THR.flash=Math.max(0,THR.flash-dt*3.0);
  THR.flashT-=dt*(0.35+THR.violet*1.4);
  if(THR.flashT<=0){ THR.flashT=2.6+Math.random()*4.5; THR.flash=Math.max(THR.flash,0.8); }
  if(THR.pulseR>0){ THR.pulseR+=dt*1.7; if(THR.pulseR>1.8) THR.pulseR=0; }
  // world positions along the fixed staging paths
  const lp=(a,c,k)=>({x:a.x+(c.x-a.x)*k, y:a.y+(c.y-a.y)*k});
  THR.hero  = lp(HERO0,HEROF,THR.flee);
  // the prince stands rooted (staring at his father) until the princess seizes his
  // collar mid-flee. Then she YANKS him off his spot and onto her own lane, and drags
  // him out single-file just behind her - a real pull, not a stroll down a parallel
  // track. `grab` is the seize (a quick swing across); `trail` is where he's held,
  // a short step back along her path so he always reads as being towed.
  const GRAB=0.2;
  THR.pflee = THR.flee<=GRAB ? 0 : (THR.flee-GRAB)/(1-GRAB);
  { const g=Math.min(1,Math.max(0,(THR.flee-GRAB)/0.16)), grab=g*g*(3-2*g);
    // towed a short step BEHIND her and off to one side, so the gripping arm bridges a
    // clear gap between them (not hidden single-file behind the big sprites).
    const hk=3.7+THR.flee*5.7;                 // the princess's depth down the nave
    const tgt=_beside(hk-0.32, 0.12);          // tucked in close behind her, at her shoulder
    THR.prince={ x:PRIN0.x+(tgt.x-PRIN0.x)*grab, y:PRIN0.y+(tgt.y-PRIN0.y)*grab }; }
  THR.king  = lp(KING0,KINGF,THR.kAdv);
  THR.vath  = lp(VATH0,VATHF,THR.vAdv);
  // gait: advance a walk-cycle while an actor is actually moving, decay to idle otherwise
  const gait=(p,prev,key)=>{ const d=Math.hypot(p.x-prev.x,p.y-prev.y);
    if(d>0.0022) THR[key]+=dt*11; else { THR[key]*=(1-Math.min(1,dt*6)); if(Math.abs(THR[key])<0.01) THR[key]=0; } };
  gait(THR.hero,THR._ph,'stepH');   THR._ph={x:THR.hero.x,y:THR.hero.y};
  gait(THR.prince,THR._pp,'stepP'); THR._pp={x:THR.prince.x,y:THR.prince.y};
  gait(THR.king,THR._pk,'stepK');   THR._pk={x:THR.king.x,y:THR.king.y};
  gait(THR.vath,THR._pv,'stepV');   THR._pv={x:THR.vath.x,y:THR.vath.y};
  // clash sparks at the meeting point of the two magics (screen-space, drawn at the node)
  if(THR.clash>0.35 && Math.random()<THR.clash){
    THR.sparks.push({x:(Math.random()*2-1)*10,y:(Math.random()*2-1)*10,
      vx:(Math.random()*2-1)*70,vy:(Math.random()*2-1)*70-10,life:0.5,max:0.5,
      col:Math.random()<0.5?'#ffbf3a':'#b45cff'});
  }
  for(const s of THR.sparks){ s.x+=s.vx*dt; s.y+=s.vy*dt; s.vy+=90*dt; s.life-=dt; }
  THR.sparks=THR.sparks.filter(s=>s.life>0);
  _thrDraw();
  THR.raf=requestAnimationFrame(_thrLoop);
}
function _thrDraw(){
  const cx=THR.cx, W=THR.W, H=THR.H, t=THR.t; if(!cx||!W) return;
  const Z=THR.zoom, HW=TW/2, HH=TH/2;
  // camera: centre the eased focus point, at ~46% down the screen
  const camx=(THR.fx-THR.fy)*HW*Z - W*0.5;
  const camy=(THR.fx+THR.fy)*HH*Z - H*0.46;
  const SC=(x,y)=>({ x:(x-y)*HW*Z - camx, y:(x+y)*HH*Z - camy });   // iso world -> screen
  const gold=THR.gold, violet=THR.violet, clash=THR.clash;
  // base darkness
  cx.fillStyle='#090b12'; cx.fillRect(0,0,W,H);
  // far wall + the high storm windows behind the throne (far edge at nave depth k=-1.6)
  const farY=SC(-1.6,-1.6).y;
  if(farY>0){
    const wg=cx.createLinearGradient(0,0,0,farY);
    wg.addColorStop(0,'#0c0f18'); wg.addColorStop(1,'#191d29');
    cx.fillStyle=wg; cx.fillRect(0,0,W,farY);
    const thrS=SC(THRONE.x,THRONE.y);
    for(const off of [-165,165]) _thrWindow(cx, thrS.x+off*Z, Math.max(6,farY-150*Z), 52*Z, 150*Z, THR.flash);
    // the house colours of Aldermere: purple banners with a gold roundel, inboard of
    // the windows - matches the real great hall's 'banner' furniture (#6a3a5e / #e8c860)
    for(const off of [-88,88]) _thrBanner(cx, thrS.x+off*Z, Math.max(4,farY-132*Z), 26*Z, 96*Z);
    if(THR.flash>0.01){ cx.fillStyle=`rgba(190,205,255,${0.16*THR.flash})`; cx.fillRect(0,0,W,farY); }
  }
  // the iso stone floor + carpet runner, with magic light spilling across it
  _thrFloor(SC,Z,t,gold,violet);
  // depth-sorted set pieces and the REAL character sprites (drawHumanoid), back-to-front
  const items=[];
  items.push({d:THRONE.x+THRONE.y-0.2, fn:()=>_thrThrone(SC,Z,t)});
  for(const c of COLUMNS) items.push({d:c.x+c.y, fn:()=>_thrColumn(SC,Z,c,t)});
  const down=THR.kingDown;
  // the King greets his children first (facing them, toward camera); once Vath is in the
  // room he turns to face the enchanter (which is a back-to-camera view).
  const _cb=THR.beats[THR.idx]||THR.beats[0];
  const kMid={x:(THR.hero.x+THR.prince.x)/2, y:(THR.hero.y+THR.prince.y)/2};
  const kingDir=_cb.kingFace==='kids'?_thrFace(THR.king,kMid):_thrFace(THR.king,THR.vath);
  const kingAway=(kingDir.x+kingDir.y)*0.5 < -0.15;   // matches drawHumanoid's own `away`
  { const look=down>0.5?LOOK_KSPENT:LOOK_KING;
    const ds=down*down*(3-2*down);        // smooth collapse
    items.push({d:THR.king.x+THR.king.y, fn:()=>_thrActor(SC,Z,THR.king,look,kingDir,THR.stepK*(1-ds),
      {aura:gold*0.95, auraCol:'255,170,46', lift:12*Z*(1-THR.kAdv), drop:5*Z*down,
       scale:1-0.12*down, hurt:down>0.15&&down<0.6, tip: ds*1.5})}); }   // topples over, lies dead on the floor
  if(THR.vAdv>0.03){   // Vath is absent for the homecoming, then strides in
    const dir=THR.idx>=13?_thrFace(THR.vath,{x:6.5,y:6.5}):_thrFace(THR.vath,THR.king);
    items.push({d:THR.vath.x+THR.vath.y, fn:()=>_thrActor(SC,Z,THR.vath,LOOK_VATH,dir,THR.stepV,
      {aura:0.3+violet*0.6, auraCol:'150,66,238'})}); }
  const sibA=THR.flee>0.68?Math.max(0,1-(THR.flee-0.68)*4.8):1;  // clear the doors and be GONE by ~0.9
  if(sibA>0.02){
    const hdir=THR.flee>0.2?_thrFace(THR.hero,HEROF):_thrFace(THR.hero,THRONE);
    // rooted -> still staring back at his father; once seized -> turned to follow the
    // sister towing him (she's ahead toward the doors, so this also faces him out)
    const pdir=THR.pflee>0.001?_thrFace(THR.prince,THR.hero):_thrFace(THR.prince,THRONE);
    items.push({d:THR.hero.x+THR.hero.y,    fn:()=>_thrActor(SC,Z,THR.hero,LOOK_HERO,hdir,THR.stepH,{alpha:sibA})});
    items.push({d:THR.prince.x+THR.prince.y,fn:()=>_thrActor(SC,Z,THR.prince,LOOK_PRINCE,pdir,THR.stepP,{alpha:sibA})});
  }
  if(THR.guards>0.02){
    for(let i=0;i<GUARDPOS.length;i++){
      const gp=GUARDPOS[i], appear=Math.min(1,THR.guards*1.35-Math.abs(i-2)*0.12);
      if(appear<=0.02) continue;
      const dir=_thrFace(gp,THR.vath);
      items.push({d:gp.x+gp.y, fn:()=>_thrActor(SC,Z,gp,LOOK_GUARD,dir,0,{alpha:appear, weapon:'sword'})});
    }
  }
  items.sort((a,b)=>a.d-b.d);
  for(const it of items) it.fn();
  // hands raised in front: the casting gesture that precedes and then looses the beams. Drawn
  // ONLY for a figure that faces the camera - a back-to-camera figure's "front" hands would
  // land on the wrong side of him (behind his head), so we skip them. The King turns to Vath
  // (away) for the whole confrontation, so in practice only Vath's hand shows. Anchored to the
  // figure's ACTUALLY-DRAWN chest - drawHumanoid's own bob plus the King's lift/drop/scale.
  const _bob=(step,size)=>{ const w=Math.abs(step||0)>0.0001;
    return w ? Math.abs(Math.sin(step))*2.2*size : (Math.sin(G.time*2.1)*0.5+0.5)*0.9*size; };
  if(THR.vHand>0.02 && THR.vAdv>0.03){
    const vGY=SC(THR.vath.x,THR.vath.y).y - _bob(THR.stepV,1.34*Z);
    _thrHands(SC,Z,THR.vath,THR.vHand,LOOK_VATH.skin,LOOK_VATH.robe,'150,66,238',true,vGY,1);
  }
  if(THR.kHand>0.02 && !kingAway){
    const kSc=1-0.17*down;
    const kGY=SC(THR.king.x,THR.king.y).y - 12*Z*(1-THR.kAdv) + 11*Z*down - _bob(THR.stepK,1.34*Z*kSc);
    _thrHands(SC,Z,THR.king,THR.kHand,LOOK_KING.skin,LOOK_KING.robe,'255,170,46',false,kGY,kSc);
  }
  // Vath's opening lash, thrown past the King toward the children and caught on his gold
  if(THR.strike>0.01) _thrStrike(SC,Z,THR.strike,t);
  // the killing bolt: one great beam from Vath that hurls the spent King to the floor
  if(THR.bigStrike>0.01) _thrBigStrike(SC,Z,THR.bigStrike,t);
  // the clash of the two magics, drawn between the King and Vath
  if(clash>0.03) _thrClash(SC,Z,clash,t);
  // the memory-rewrite pulse sweeping out from Vath
  if(THR.pulseR>0){ const s=SC(THR.vath.x,THR.vath.y); _thrPulse(cx,s.x,s.y-26*Z,THR.pulseR,W,H); }
  // full-hall violet flash as the Tideglass is torn away, storm-flash, closing dark, vignette
  if(THR.take>0.01){ cx.fillStyle=`rgba(150,100,235,${0.5*THR.take})`; cx.fillRect(0,0,W,H); }
  if(THR.flash>0.01){ cx.fillStyle=`rgba(190,205,255,${0.07*THR.flash})`; cx.fillRect(0,0,W,H); }
  if(THR.dark>0.01){ cx.fillStyle=`rgba(3,4,9,${0.62*THR.dark})`; cx.fillRect(0,0,W,H); }
  const vg=cx.createRadialGradient(W*0.5,H*0.5,H*0.2,W*0.5,H*0.5,H*0.8);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.6)');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);
}
// facing vector from one world point toward another (for drawHumanoid's `dir`)
function _thrFace(from,to){ const dx=to.x-from.x, dy=to.y-from.y, l=Math.hypot(dx,dy);
  return l>0.001?{x:dx/l,y:dy/l}:{x:0,y:1}; }
// draw a real game character (drawHumanoid) at a world tile, with an optional magic aura
function _thrActor(SC,Z,pos,look,dir,step,opt){
  opt=opt||{}; const cx=THR.cx;
  const s=SC(pos.x,pos.y);
  const gy=s.y - (opt.lift||0) + (opt.drop||0);
  const size=1.34*Z*(opt.scale||1);
  cx.save();
  if(opt.alpha!=null) cx.globalAlpha=Math.max(0,Math.min(1,opt.alpha));
  if(opt.aura>0.02){
    const ax=s.x, ay=gy-24*Z, r=50*Z;
    const g=cx.createRadialGradient(ax,ay,2,ax,ay,r);
    g.addColorStop(0,`rgba(${opt.auraCol},${Math.min(0.85,opt.aura*0.7)})`);
    g.addColorStop(1,`rgba(${opt.auraCol},0)`);
    cx.save(); cx.globalCompositeOperation='lighter'; cx.fillStyle=g;
    cx.beginPath(); cx.arc(ax,ay,r,0,TAU); cx.fill(); cx.restore();
  }
  drawShadowAt && drawShadowAt(cx, s.x, s.y, (14+ (opt.tip? 12*Math.sin(opt.tip):0))*Z);  // shadow spreads as he falls
  cx.save();  // contain the canvas filter drawHumanoid sets on entry
  // opt.tip (radians) topples the figure over its feet - a body falling and lying on the floor
  if(opt.tip) { cx.translate(s.x, gy); cx.rotate(opt.tip); cx.translate(-s.x, -gy); }
  try{ if(typeof drawHumanoid==='function')
    drawHumanoid(cx,s.x,gy,Object.assign({},look,{size,dir,step:step||0,hurt:!!opt.hurt,weapon:opt.weapon})); }catch(err){}
  cx.restore();
  cx.restore();
}
// Raised hands in front of a figure - the casting gesture. `amt` 0..1 lifts the forearms;
// the palms glow in the figure's magic colour as the power gathers, so the beams read as
// loosed FROM the hands. `single` draws one arm (Vath), else two (the King), framing his chest.
// `baseY`/`sc` lock the hands to the figure's ACTUALLY-DRAWN body (its lift/drop/scale), so
// they ride his chest as he steps down off the dais instead of floating off at a fixed height.
function _thrHands(SC,Z,pos,amt,skin,sleeve,col,single,baseY,sc){
  const cx=THR.cx, s=SC(pos.x,pos.y);
  const by=(baseY!=null?baseY:s.y);            // the sprite's drawn base (feet), incl. lift/drop
  sc=sc||1;
  const shY=by-25*Z*sc;                        // where the arms leave the body
  const hY =by-(28+12*amt)*Z*sc;               // the raised hands, higher as the gesture peaks
  const sp=7*Z*sc;
  const arms = single ? [ {hx:s.x+7*Z*sc, ox:s.x+3.5*Z*sc} ]
                      : [ {hx:s.x-sp, ox:s.x-3.5*Z*sc}, {hx:s.x+sp, ox:s.x+3.5*Z*sc} ];
  for(const a of arms){
    // the raised forearm (sleeve), body -> hand
    cx.save(); cx.lineCap='round'; cx.strokeStyle=sleeve; cx.lineWidth=4.6*Z*sc;
    cx.beginPath(); cx.moveTo(a.ox,shY); cx.lineTo(a.hx,hY); cx.stroke();
    cx.strokeStyle='rgba(24,16,10,0.5)'; cx.lineWidth=1; cx.stroke(); cx.restore();
    // the palm glow (magic gathering)
    cx.save(); cx.globalCompositeOperation='lighter';
    const r=13*Z*sc*Math.max(0.4,amt);
    const g=cx.createRadialGradient(a.hx,hY,1,a.hx,hY,r);
    g.addColorStop(0,`rgba(${col},${0.75*amt})`); g.addColorStop(1,`rgba(${col},0)`);
    cx.fillStyle=g; cx.beginPath(); cx.arc(a.hx,hY,r,0,TAU); cx.fill(); cx.restore();
    // the mitt
    cx.fillStyle=skin; cx.beginPath(); cx.arc(a.hx,hY,3.3*Z*sc,0,TAU); cx.fill();
    cx.strokeStyle='rgba(24,16,10,0.85)'; cx.lineWidth=1.3*Z; cx.stroke();
  }
}
// the tiled iso floor of the nave: cool stone, a royal carpet up the centre, a raised dais
function _thrFloor(SC,Z,t,gold,violet){
  const cx=THR.cx, W=THR.W, H=THR.H;
  for(let x=-4;x<=12;x++) for(let y=-4;y<=12;y++){
    const kk=(x+y)/2, oo=(x-y)/2;
    if(kk<-1.5||kk>10.5||oo<-3.2||oo>3.2) continue;
    const a=SC(x-0.5,y-0.5), b=SC(x+0.5,y-0.5), c=SC(x+0.5,y+0.5), d=SC(x-0.5,y+0.5);
    const chk=(x+y)&1, carpet=Math.abs(oo)<=0.75, dais=kk<=1.6;
    let fill;
    // rust-red runner with gold-warm dais, matching the real hall's carpet (the 'rug'
    // furniture: rgba(143,74,58) cloth, #c9a24e gold trim)
    if(carpet) fill= dais? '#6a4038' : (chk?'#5c352d':'#54302a');
    else fill= dais? (chk?'#333849':'#2c3140') : (chk?'#262b37':'#20242f');
    cx.beginPath(); cx.moveTo(a.x,a.y); cx.lineTo(b.x,b.y); cx.lineTo(c.x,c.y); cx.lineTo(d.x,d.y); cx.closePath();
    cx.fillStyle=fill; cx.fill();
    cx.strokeStyle='rgba(0,0,0,0.16)'; cx.lineWidth=1; cx.stroke();
  }
  // gold trim running down both edges of the carpet (the real rug's #c9a24e ring)
  cx.save(); cx.strokeStyle='rgba(201,162,78,0.45)'; cx.lineWidth=2*Z;
  for(const oo of [0.78,-0.78]){
    const a=SC(-1+oo,-1-oo), b=SC(10+oo,10-oo);
    cx.beginPath(); cx.moveTo(a.x,a.y); cx.lineTo(b.x,b.y); cx.stroke();
  }
  cx.restore();
  const ks=SC(THR.king.x,THR.king.y), vs=SC(THR.vath.x,THR.vath.y);
  cx.save(); cx.globalCompositeOperation='lighter';
  if(gold>0.05){ const g=cx.createRadialGradient(ks.x,ks.y,4,ks.x,ks.y,150*Z);
    g.addColorStop(0,`rgba(255,170,46,${0.16*gold})`); g.addColorStop(1,'rgba(255,170,46,0)');
    cx.fillStyle=g; cx.fillRect(0,0,W,H); }
  if(violet>0.05){ const g=cx.createRadialGradient(vs.x,vs.y,4,vs.x,vs.y,150*Z);
    g.addColorStop(0,`rgba(150,66,238,${0.16*violet})`); g.addColorStop(1,'rgba(150,66,238,0)');
    cx.fillStyle=g; cx.fillRect(0,0,W,H); }
  cx.restore();
}
// a colonnade pillar with a wall torch throwing warm light into the hall
function _thrColumn(SC,Z,c,t){
  const cx=THR.cx, base=SC(c.x,c.y), h=82*Z, w=15*Z;
  const fl=0.75+0.25*Math.sin(t*7+c.x*2.3);
  cx.save(); cx.globalCompositeOperation='lighter';
  const tg=cx.createRadialGradient(base.x,base.y-h*0.72,2,base.x,base.y-h*0.72,56*Z*fl);
  tg.addColorStop(0,`rgba(255,178,90,${0.38*fl})`); tg.addColorStop(1,'rgba(255,178,90,0)');
  cx.fillStyle=tg; cx.beginPath(); cx.arc(base.x,base.y-h*0.72,56*Z*fl,0,TAU); cx.fill();
  cx.restore();
  // pale grey stone shaft (matches the real hall's #a8a49b/#8f8b83 columns), warm-lit face
  cx.fillStyle='#8f8b83';
  cx.beginPath(); cx.moveTo(base.x-w*0.5,base.y); cx.lineTo(base.x-w*0.42,base.y-h);
  cx.lineTo(base.x+w*0.42,base.y-h); cx.lineTo(base.x+w*0.5,base.y); cx.closePath(); cx.fill();
  cx.fillStyle='#a8a49b'; cx.fillRect(base.x-w*0.5,base.y-h,w*0.32,h);
  cx.fillStyle='#6e6a63'; cx.fillRect(base.x+w*0.30,base.y-h,w*0.12,h);
  cx.fillStyle='rgba(255,190,120,0.12)'; cx.fillRect(base.x-w*0.5,base.y-h,w*0.3,h);
  cx.fillStyle='#b8b4ab'; cx.fillRect(base.x-w*0.62,base.y-h-6*Z,w*1.24,7*Z);
  cx.fillStyle='#9a968d'; cx.fillRect(base.x-w*0.6,base.y-6*Z,w*1.2,7*Z);
  cx.save(); cx.globalCompositeOperation='lighter'; cx.fillStyle='rgba(255,190,110,0.9)';
  cx.beginPath(); cx.ellipse(base.x,base.y-h*0.72,3.4*Z,7*Z*fl,0,0,TAU); cx.fill(); cx.restore();
}
// the Tideglass Throne at the head of the nave - dark wood, a deep crimson high back
// and gold finials, matching the real great-hall throne sprite (drawFurniture 'throne')
function _thrThrone(SC,Z,t){
  const cx=THR.cx, s=SC(THRONE.x,THRONE.y), y=s.y-12*Z;
  const w=26*Z, seatH=20*Z, backH=46*Z;
  const glow=0.5+0.3*Math.sin(t*1.4);
  // dark-wood seat block with a lit near face
  cx.fillStyle='#3e2f1e'; cx.fillRect(s.x-w*0.5,y-seatH,w,seatH);
  cx.fillStyle='#5a4630'; cx.fillRect(s.x-w*0.5,y-seatH,w*0.30,seatH);
  // crimson high back
  const bg=cx.createLinearGradient(s.x,y-seatH-backH,s.x,y-seatH);
  bg.addColorStop(0,'#7a2a3a'); bg.addColorStop(1,'#4a1a24');
  cx.fillStyle=bg;
  cx.beginPath(); cx.moveTo(s.x-w*0.46,y-seatH); cx.lineTo(s.x-w*0.46,y-seatH-backH*0.8);
  cx.quadraticCurveTo(s.x,y-seatH-backH, s.x+w*0.46,y-seatH-backH*0.8);
  cx.lineTo(s.x+w*0.46,y-seatH); cx.closePath(); cx.fill();
  // gold finials: two on the shoulders, a larger crown at the peak
  cx.fillStyle='#e8c860';
  cx.beginPath();
  cx.arc(s.x-w*0.44,y-seatH-backH*0.72,3.6*Z,0,TAU);
  cx.arc(s.x+w*0.44,y-seatH-backH*0.72,3.6*Z,0,TAU); cx.fill();
  cx.beginPath(); cx.arc(s.x,y-seatH-backH*0.94,5.2*Z,0,TAU); cx.fill();
  // a soft warm nimbus - the seat of the Tideglass, not cold cyan glass
  cx.save(); cx.globalCompositeOperation='lighter';
  const g=cx.createRadialGradient(s.x,y-seatH-backH*0.5,2,s.x,y-seatH-backH*0.5,42*Z);
  g.addColorStop(0,`rgba(255,206,120,${0.12+0.08*glow})`); g.addColorStop(1,'rgba(255,206,120,0)');
  cx.fillStyle=g; cx.beginPath(); cx.arc(s.x,y-seatH-backH*0.5,42*Z,0,TAU); cx.fill(); cx.restore();
}
// gold-vs-violet beam between the King and Vath, with a bright collision node + sparks
function _thrClash(SC,Z,clash,t){
  const cx=THR.cx, a=SC(THR.vath.x,THR.vath.y), b=SC(THR.king.x,THR.king.y);
  const ax=a.x, ay=a.y-30*Z, bx=b.x, by=b.y-30*Z, mx=(ax+bx)/2, my=(ay+by)/2;
  cx.save(); cx.globalCompositeOperation='lighter'; cx.lineCap='round';
  const beam=cx.createLinearGradient(ax,ay,bx,by);
  // keep each half its own colour - Vath's violet, the King's gold - with only a thin
  // white seam where the two magics actually collide, so the sides stay clearly told apart
  beam.addColorStop(0,`rgba(150,66,238,${0.9*clash})`);
  beam.addColorStop(0.42,`rgba(150,66,238,${0.9*clash})`);
  beam.addColorStop(0.5,`rgba(255,255,255,${0.95*clash})`);
  beam.addColorStop(0.58,`rgba(255,170,46,${0.9*clash})`);
  beam.addColorStop(1,`rgba(255,170,46,${0.9*clash})`);
  cx.strokeStyle=beam; cx.lineWidth=(3+7*clash)*Z+2*Math.sin(t*40)*clash;
  cx.beginPath(); cx.moveTo(ax,ay); cx.lineTo(bx,by); cx.stroke();
  const nr=(9+13*clash)*Z*(0.85+0.15*Math.sin(t*30));
  const ng=cx.createRadialGradient(mx,my,1,mx,my,nr);
  ng.addColorStop(0,`rgba(255,255,255,${clash})`); ng.addColorStop(1,'rgba(255,255,255,0)');
  cx.fillStyle=ng; cx.beginPath(); cx.arc(mx,my,nr,0,TAU); cx.fill();
  for(const s of THR.sparks){ cx.globalAlpha=Math.max(0,s.life/s.max); cx.fillStyle=s.col; cx.fillRect(mx+s.x,my+s.y,2.4*Z,2.4*Z); }
  cx.globalAlpha=1; cx.restore();
}
// Vath's opening strike: a violet lash that leaps from his hand PAST the King, reaching
// for the two children - then retracts to the King (`strike` 1->0) as he throws himself
// into its path. Sells the beat's line: the light "leaps for the two of you... King Aldous
// throws himself between the light and his children."
function _thrStrike(SC,Z,strike,t){
  const cx=THR.cx;
  const v=SC(THR.vath.x,THR.vath.y);
  const k=SC(THR.king.x,THR.king.y);
  const mid={x:(THR.hero.x+THR.prince.x)/2, y:(THR.hero.y+THR.prince.y)/2};
  const m=SC(mid.x,mid.y);
  const vx=v.x, vy=v.y-30*Z, kx=k.x, ky=k.y-30*Z, tx=m.x, ty=m.y-24*Z;
  cx.save(); cx.globalCompositeOperation='lighter'; cx.lineCap='round';
  // the lash from Vath's hand to where the King now stands (the interception point)
  const g1=cx.createLinearGradient(vx,vy,kx,ky);
  g1.addColorStop(0,`rgba(150,66,238,${0.85*strike})`);
  g1.addColorStop(1,`rgba(176,102,246,${0.85*strike})`);
  cx.strokeStyle=g1; cx.lineWidth=(3+4*strike)*Z + Math.sin(t*38)*strike;
  cx.beginPath(); cx.moveTo(vx,vy); cx.lineTo(kx,ky); cx.stroke();
  // ...and the tail still straining PAST him toward the children, retracting as he catches it
  const g2=cx.createLinearGradient(kx,ky,tx,ty);
  g2.addColorStop(0,`rgba(165,84,244,${0.55*strike})`);
  g2.addColorStop(1,'rgba(165,84,244,0)');
  cx.strokeStyle=g2; cx.lineWidth=(1.5+2.5*strike)*Z;
  cx.beginPath(); cx.moveTo(kx,ky);
  cx.lineTo(kx+(tx-kx)*strike, ky+(ty-ky)*strike); cx.stroke();
  cx.restore();
}
// The killing bolt: where the opening lash was thrown PAST the King at the children, this is
// one massive beam aimed squarely AT the spent King. It lands full on his chest and hurls him
// down. `amt` 1->0 flares white on impact, then fades as he falls.
function _thrBigStrike(SC,Z,amt,t){
  const cx=THR.cx;
  const v=SC(THR.vath.x,THR.vath.y), k=SC(THR.king.x,THR.king.y);
  const vx=v.x, vy=v.y-30*Z, kx=k.x, ky=k.y-26*Z;
  const jitter=Math.sin(t*46)*2.2*amt;
  cx.save(); cx.globalCompositeOperation='lighter'; cx.lineCap='round';
  // the wide violet outer wash - a beam far heavier than the opening lash
  const g0=cx.createLinearGradient(vx,vy,kx,ky);
  g0.addColorStop(0,`rgba(150,66,238,${0.5*amt})`);
  g0.addColorStop(1,`rgba(120,40,220,${0.5*amt})`);
  cx.strokeStyle=g0; cx.lineWidth=(10+18*amt)*Z;
  cx.beginPath(); cx.moveTo(vx,vy); cx.lineTo(kx,ky+jitter); cx.stroke();
  // the searing inner core
  const g1=cx.createLinearGradient(vx,vy,kx,ky);
  g1.addColorStop(0,`rgba(205,160,255,${0.95*amt})`);
  g1.addColorStop(0.6,`rgba(178,108,250,${0.95*amt})`);
  g1.addColorStop(1,`rgba(255,255,255,${0.95*amt})`);
  cx.strokeStyle=g1; cx.lineWidth=(3+7*amt)*Z + jitter*0.5;
  cx.beginPath(); cx.moveTo(vx,vy); cx.lineTo(kx,ky+jitter); cx.stroke();
  // the impact flare bursting on the King's chest as it drives him to the floor
  const ir=(16+30*amt)*Z*(0.9+0.1*Math.sin(t*30));
  const ig=cx.createRadialGradient(kx,ky,1,kx,ky,ir);
  ig.addColorStop(0,`rgba(255,255,255,${amt})`);
  ig.addColorStop(0.4,`rgba(190,130,250,${0.8*amt})`);
  ig.addColorStop(1,'rgba(150,66,238,0)');
  cx.fillStyle=ig; cx.beginPath(); cx.arc(kx,ky,ir,0,TAU); cx.fill();
  cx.restore();
}
// the violet memory-rewrite ring washing across the whole hall
function _thrPulse(cx,cxp,cyp,pr,W,H){
  const R=Math.max(W,H)*0.75*pr, a=Math.max(0,1-pr/1.8);
  cx.save(); cx.globalCompositeOperation='lighter';
  const rg=cx.createRadialGradient(cxp,cyp,R*0.7,cxp,cyp,R);
  rg.addColorStop(0,'rgba(150,66,238,0)'); rg.addColorStop(0.85,`rgba(170,96,246,${0.4*a})`); rg.addColorStop(1,'rgba(150,66,238,0)');
  cx.fillStyle=rg; cx.fillRect(0,0,W,H); cx.restore();
}
// a tall arched window high on the back wall, storm-dark, flaring white with the lightning
function _thrWindow(cx,x0,top,w,h,flash){
  const path=()=>{ cx.beginPath(); cx.moveTo(x0-w/2,top+h); cx.lineTo(x0-w/2,top+w/2);
    cx.quadraticCurveTo(x0-w/2,top, x0,top); cx.quadraticCurveTo(x0+w/2,top, x0+w/2,top+w/2);
    cx.lineTo(x0+w/2,top+h); cx.closePath(); };
  cx.save(); path(); cx.clip();
  const sky=cx.createLinearGradient(0,top,0,top+h); sky.addColorStop(0,'#243049'); sky.addColorStop(1,'#161c2b');
  cx.fillStyle=sky; cx.fillRect(x0-w/2,top,w,h);
  if(flash>0.01){ cx.fillStyle=`rgba(200,214,255,${0.7*flash})`; cx.fillRect(x0-w/2,top,w,h); }
  cx.restore();
  cx.strokeStyle='#0b0e16'; cx.lineWidth=4; path(); cx.stroke();
  cx.beginPath(); cx.moveTo(x0,top+4); cx.lineTo(x0,top+h); cx.stroke();
}
// a hanging house-banner: purple cloth with a swallowtail hem and a gold roundel,
// matching the great hall's 'banner' furniture (#6a3a5e cloth, #e8c860 emblem)
function _thrBanner(cx,x0,top,w,h){
  cx.fillStyle='#3a2a1a'; cx.fillRect(x0-w*0.62,top-3,w*1.24,3);   // the rail it hangs from
  cx.fillStyle='#6a3a5e';
  cx.beginPath(); cx.moveTo(x0-w/2,top); cx.lineTo(x0+w/2,top); cx.lineTo(x0+w/2,top+h);
  cx.lineTo(x0,top+h-w*0.42); cx.lineTo(x0-w/2,top+h); cx.closePath(); cx.fill();
  cx.fillStyle='rgba(255,255,255,0.06)'; cx.fillRect(x0-w/2,top,w*0.28,h*0.9);  // sheen
  cx.fillStyle='#e8c860'; cx.beginPath(); cx.arc(x0,top+h*0.42,w*0.24,0,TAU); cx.fill();
}

/* ---------- adaptive music (procedural, three moods) ---------- */
const Music={
  nextT:0, beat:0, mode:'day', vol:1, intensity:0,
  chords:[[220,277.2,329.6],[174.6,220,261.6],[196,246.9,293.7],[164.8,207.7,246.9]],
  scale:[440,493.9,523.3,587.3,659.3,784,880],
  update(){
    if(!Snd.on||!Snd.ctx||G.state!=='play') return;
    const now=Snd.ctx.currentTime;
    if(this.nextT<now-1) this.nextT=now+0.1;
    const boss=G.mobs.some(m=>m.bigBoss&&!m.dead&&m.state==='chase'&&dist(P.x,P.y,m.x,m.y)<14);
    const newMode= boss?'boss' : nightAmount()>0.5?'night':'day';
    // crossfade "breath": dip the mix on a mood change and ease it back so moods
    // slide into each other instead of hard-switching mid-phrase.
    if(newMode!==this.mode){ this.mode=newMode; this.vol=0.34; }
    this.vol += (1-this.vol)*0.05;
    // combat intensity: nearby chasing (non-boss) foes drive the bed harder
    let threat=0;
    if(!boss) for(const m of G.mobs){ if(!m.dead&&m.state==='chase'){ const d=dist(P.x,P.y,m.x,m.y); if(d<11) threat=Math.max(threat,1-d/11); } }
    this.intensity += (threat-this.intensity)*0.04;
    const spb=this.mode==='boss'?0.30 : this.mode==='night'?0.62 : 0.5;
    while(this.nextT<now+0.35){ this.note(this.nextT,this.beat,spb); this.nextT+=spb; this.beat++; }
  },
  ping(t,f,dur,vol,type){
    vol*=CFG.mus; if(vol<=0.0004) return;
    const ctx=Snd.ctx,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type||'sine'; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002,vol),t+0.03);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+dur+0.05);
  },
  pad(t,f,dur,vol){
    vol*=CFG.mus; if(vol<=0.0004) return;
    const ctx=Snd.ctx;
    for(const det of [0,5]){
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='triangle'; o.frequency.value=f; o.detune.value=det;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(vol,t+dur*0.4);
      g.gain.linearRampToValueAtTime(0.0001,t+dur);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+dur+0.05);
    }
  },
  note(t,beat,spb){
    const bar=Math.floor(beat/8)%4, inBar=beat%8;
    const vs=this.vol==null?1:this.vol;                 // crossfade gain
    if(this.mode==='boss'){
      if(inBar%2===0) this.ping(t,55*(inBar%4===0?1:1.5),spb*0.9,0.05*vs,'sawtooth');
      if(inBar===0) this.pad(t,110*[1,0.94,1.12,0.89][bar],spb*8,0.026*vs);
      if(Math.random()<0.3) this.ping(t,this.scale[(beat*3)%7]/2,spb*0.6,0.02*vs,'square');
      return;
    }
    const ch=this.chords[bar], nv=(this.mode==='night'?0.55:1)*vs;
    const inten=this.intensity||0;
    if(inBar===0) this.pad(t,ch[0]/2,spb*8,0.028*nv);
    if(inBar===4) this.pad(t,ch[1],spb*4,0.015*nv);
    // melody: denser and a shade louder as danger closes in
    if(Math.random()<(this.mode==='night'?0.22:0.4)+inten*0.3){
      const f=this.scale[Math.floor(Math.random()*7)]*(Math.random()<0.25?0.5:1);
      this.ping(t,f,spb*1.8,0.026*nv*(1+inten*0.5),'sine');
    }
    // a low pulse that only surfaces under threat - a combat bed rising beneath
    if(inten>0.15 && inBar%2===0) this.ping(t,110*[1,0.94,1.12,0.89][bar],spb*0.9,0.02*inten*vs,'triangle');
  }
};

/* ---------- ambient sound bed: rain, surf, birds, crickets ---------- */
const Amb={
  t:0, birdT:3, cricketT:4, rainSrc:null, rainGain:null, waveGain:null, waveLFO:0, _coast:0,
  ensure(){
    if(this.rainSrc||!Snd.ctx) return;
    const ctx=Snd.ctx;
    const rs=ctx.createBufferSource(); rs.buffer=Snd.noiseBuf(); rs.loop=true;
    const rf=ctx.createBiquadFilter(); rf.type='lowpass'; rf.frequency.value=1400;
    this.rainGain=ctx.createGain(); this.rainGain.gain.value=0;
    rs.connect(rf); rf.connect(this.rainGain); this.rainGain.connect(ctx.destination); rs.start();
    this.rainSrc=rs;
    const ws=ctx.createBufferSource(); ws.buffer=Snd.noiseBuf(); ws.loop=true; ws.playbackRate.value=0.6;
    const wf=ctx.createBiquadFilter(); wf.type='bandpass'; wf.frequency.value=420; wf.Q.value=0.6;
    this.waveGain=ctx.createGain(); this.waveGain.gain.value=0;
    ws.connect(wf); wf.connect(this.waveGain); this.waveGain.connect(ctx.destination); ws.start();
  },
  update(dt){
    if(!Snd.ctx||G.state!=='play') return;
    this.ensure();
    const mute=!Snd.on;
    if(this.rainGain) this.rainGain.gain.value = mute?0 : CFG.sfx*(G.interior?0.3:1)*WX.rain*0.05;
    if(G.interior) this._coast=0;
    if(this.waveGain){
      this.t+=dt;
      if(this.t>0.4){ this.t=0; this._coast=0;
        for(let a=0;a<8;a++){
          const tt=tileAt(Math.floor(P.x+Math.cos(a*TAU/8)*3),Math.floor(P.y+Math.sin(a*TAU/8)*3));
          if(tt===T.SHALLOW||tt===T.DEEP){ this._coast=1; break; }
        }
      }
      this.waveLFO+=dt*0.9;
      const target= mute?0 : CFG.sfx*(this._coast? (0.028+0.018*Math.sin(this.waveLFO)) : 0);
      this.waveGain.gain.value += (target-this.waveGain.gain.value)*Math.min(1,dt*2);
    }
    if(mute) return;
    const night=nightAmount();
    this.birdT-=dt;
    if(this.birdT<=0){ this.birdT=rnd(3.5,9); if(night<0.25&&WX.rain<0.3) Snd.chirp(); }
    this.cricketT-=dt;
    if(this.cricketT<=0){ this.cricketT=rnd(2.5,6); if(night>0.5) Snd.cricket(); }
    if(P.hp<P.maxhp*0.3 && !P.dead){
      this.beatT=(this.beatT||0)-dt;
      if(this.beatT<=0){ this.beatT=0.9;
        Snd.tone(58,0.12,'sine',0.07,-8);
        setTimeout(()=>Snd.tone(52,0.1,'sine',0.055,-8),160); }
    }
    this.cawT=(this.cawT||rnd(4,10))-dt;
    if(this.cawT<=0){ this.cawT=rnd(5,14);
      if((ZONES.ruins && dist(P.x,P.y,ZONES.ruins.x,ZONES.ruins.y)<14) || (ZONES.tower && dist(P.x,P.y,ZONES.tower.x,ZONES.tower.y)<10)) Snd.caw(); }
  }
};

/* ---------- weather: passing rain, cloud shadows, far thunder ---------- */
const RAIN_PARALLAX=1;   // 1 = rain stays pinned to the world as you walk; <1 lets it drift toward screen-locked
const WX={
  rain:0, target:0, timer:45, drops:[], boltT:0,
  update(dt){
    // no weather underground - dungeons have their own sealed sky
    if(typeof inDungeon==='function' && inDungeon()){
      this.rain=0; this.target=0; this.timer=rnd(20,40); this.drops.length=0;
      G.lightning=0; return;
    }
    this.timer-=dt;
    if(this.timer<=0){
      if(this.target>0){ this.target=0; this.timer=rnd(70,130); }
      else { this.target=rnd(0.55,1); this.timer=rnd(20,40); }
    }
    // Stormreach is locked in a permanent tempest - always raining, always thundering
    const STORM = (G.worldId==='reach');
    if(STORM) this.target=1;
    this.rain += (this.target-this.rain)*Math.min(1,dt*(STORM?0.7:0.4));
    if(this.rain<0.02&&this.target===0) this.rain=0;
    const want=Math.round(this.rain*130);
    while(this.drops.length<want) this.drops.push({x:Math.random()*(VW+120)-60,y:Math.random()*VH,spd:rnd(620,900),len:rnd(9,16)});
    if(this.drops.length>want) this.drops.length=want;
    const windDrift = (G.worldId==='reach') ? 0.5 : 0.18;   // Stormreach rain drives sideways
    for(const d of this.drops){
      d.y+=d.spd*dt; d.x+=d.spd*windDrift*dt;
      if(d.y>VH){ d.y=-20-Math.random()*40; d.x=Math.random()*(VW+120)-60;
        if(Math.random()<0.4&&G.state==='play'&&G.worldId!=='frost')   // no rain-splash puffs on the snowy isle
          G.parts.push({x:P.x+rnd(-7,7),y:P.y+rnd(-5,5),vx:0,vy:0,life:0.22,color:'rgba(205,228,255,0.55)',size:2});
      }
    }
    // the Frozen Isle gets snow, never a thunderstorm - its squalls are silent, lightning-free
    if(this.rain>0.65 && G.worldId!=='frost'){
      this.boltT-=dt;
      if(this.boltT<=0){ this.boltT=rnd(9,22); G.lightning=0.5; Snd.thunder(); }
    }
    G.lightning=Math.max(0,G.lightning-dt*1.4);
    for(const c of G.clouds){
      c.x+=c.vx*dt; c.y+=c.vy*dt;
      if(c.x>MAPW+18) c.x=-18;
      if(c.y>MAPH+18) c.y=-18; else if(c.y<-18) c.y=MAPH+18;
    }
  },
  drawRain(){
    if(this.rain<=0.02 || G.worldId==='frost') return;   // the Frozen Isle falls as snow, not rain (see drawSnow)
    // Anchor the squall to the world: cancel the camera pan, then wrap each streak back onto
    // the screen so the rain stays put over the ground as you walk instead of sliding with the
    // screen - the same treatment as the frozen-isle snow. Wind drift (d.x above) is untouched.
    const M=26, WW=VW+2*M, HH=VH+2*M;
    const camX=(G.cam?G.cam.x:0)*RAIN_PARALLAX, camY=(G.cam?G.cam.y:0)*RAIN_PARALLAX;
    cx.strokeStyle='rgba(200,220,250,'+(0.28*this.rain)+')'; cx.lineWidth=1;
    cx.beginPath();
    for(const d of this.drops){
      const dx=((d.x-camX+M)%WW+WW)%WW-M, dy=((d.y-camY+M)%HH+HH)%HH-M;
      cx.moveTo(dx,dy); cx.lineTo(dx-d.len*0.18,dy-d.len);
    }
    cx.stroke();
    cx.fillStyle='rgba(58,80,112,'+(0.13*this.rain)+')'; cx.fillRect(-20,-20,VW+40,VH+40);
  },
  drawCloudShadows(){
    const day=1-nightAmount();
    if(day<0.3) return;
    cx.fillStyle='rgba(10,18,30,'+(0.10*day)+')';
    for(const c of G.clouds){
      const s=worldToScreen(c.x,c.y);
      if(s.x<-340||s.x>VW+340||s.y<-240||s.y>VH+240) continue;
      cx.beginPath(); cx.ellipse(s.x,s.y,c.r*1.9,c.r*0.9,0,0,TAU); cx.fill();
      cx.beginPath(); cx.ellipse(s.x+c.r*1.1,s.y+c.r*0.35,c.r*1.2,c.r*0.6,0,0,TAU); cx.fill();
    }
  }
};

/* ---------- dynamic lighting: darkness with carved light pools ---------- */
let lightCv=null, lightCx=null;
function drawLighting(night){
  if(SAFE) return; // minimal-GPU mode: skip the full-screen light buffer
  if(!lightCv||lightCv.width!==cv.width||lightCv.height!==cv.height){
    lightCv=document.createElement('canvas'); lightCv.width=cv.width; lightCv.height=cv.height;
    lightCx=lightCv.getContext('2d');
  }
  const g=lightCx;
  g.setTransform(DPR,0,0,DPR,0,0);
  g.globalCompositeOperation='source-over';
  g.clearRect(0,0,VW,VH);
  // per-dungeon ambient colour: each new Act II dungeon gets its own mood-wash so they no
  // longer all read as the same navy dark. (Falls back to the default night navy elsewhere.)
  const DUNG_TINT={ barikdeep:[8,30,44], winddeep:[28,34,48], sunwarddeep:[42,16,9], skydeep:[14,17,42], embertomb:[16,26,44] };
  const tc=DUNG_TINT[G.worldId]||[10,15,44];
  g.fillStyle='rgba('+tc[0]+','+tc[1]+','+tc[2]+','+(night*0.58)+')';
  g.fillRect(0,0,VW,VH);
  g.globalCompositeOperation='destination-out';
  const punch=(x,y,r,a)=>{
    const gr=g.createRadialGradient(x,y,r*0.12,x,y,r);
    gr.addColorStop(0,'rgba(0,0,0,'+a+')'); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill();
  };
  let i=0;
  for(const b of G.decor){
    i++;
    if(b.kind!=='lamp'&&b.kind!=='house'&&b.kind!=='forge'&&b.kind!=='tower') continue;
    const s=worldToScreen(b.x,b.y);
    if(s.x<-170||s.x>VW+170||s.y<-210||s.y>VH+210) continue;
    const fl=0.92+0.08*Math.sin(G.time*7+i*2.1);
    punch(s.x,s.y-40,(b.kind==='lamp'?105:78)*fl,0.95);
  }
  { const s=worldToScreen(P.x,P.y); punch(s.x,s.y-18,88,0.8); }
  for(const p of G.projs){ if(p.kind==='bolt'){ const s=worldToScreen(p.x,p.y); punch(s.x,s.y-12,64,0.95); } }
  for(const f of G.fireflies){ const s=worldToScreen(f.x,f.y); punch(s.x,s.y-14,16,0.5); }
  cx.setTransform(DPR,0,0,DPR,0,0);
  cx.drawImage(lightCv,0,0,VW,VH);
}

/* ---------- shoreline foam ---------- */
function buildFoam(){
  G.foam.length=0;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let y=1;y<MAPH-1;y++) for(let x=1;x<MAPW-1;x++){
    if(tileAt(x,y)!==T.SHALLOW) continue;
    for(const d of dirs){
      if(tileAt(x+d[0],y+d[1])>=T.SAND){
        const ex=-d[1], ey=d[0];
        const ang=Math.atan2((ex+ey)*(TH/2),(ex-ey)*(TW/2));
        G.foam.push({x:x+d[0]*0.5, y:y+d[1]*0.5, ang, ph:Math.random()*TAU});
      }
    }
  }
}
function drawFoam(minX,maxX,minY,maxY){
  cx.fillStyle='#eaf4f8';
  for(const f of G.foam){
    if(f.x<minX||f.x>maxX||f.y<minY||f.y>maxY) continue;
    const s=worldToScreen(f.x,f.y);
    const w=Math.sin(G.time*1.7+f.ph);
    cx.globalAlpha=0.10+0.13*Math.max(0,w);
    cx.save(); cx.translate(s.x,s.y); cx.rotate(f.ang);
    cx.beginPath(); cx.ellipse(0,0,15+3*w,3.6,0,0,TAU); cx.fill();
    cx.restore();
  }
  cx.globalAlpha=1;
}

/* ---------- boss presentation: HP bar + letterboxed intro ---------- */
function updateBossUI(){
  const bar=document.getElementById('bossBar');
  let boss=null, bd=12;
  for(const m of G.mobs){
    if(!m.bigBoss||m.dead||m.state!=='chase') continue;
    const d=dist(P.x,P.y,m.x,m.y);
    if(d<bd){ bd=d; boss=m; }
  }
  if(!boss){ bar.style.display='none'; return; }
  bar.style.display='block';
  document.getElementById('bossName').textContent=boss.title;
  document.getElementById('bossFill').style.width=Math.max(0,boss.hp/boss.maxhp*100)+'%';
  const fl='intro_'+boss.kind;
  if(!G.flags[fl]){
    G.flags[fl]=true;
    cinematic(true);
    banner(boss.title, boss.subtitle || (boss.boss? 'LORD OF THE OLD RUINS' : 'TERROR OF THE WOLFCRAG'));
    G.shake=Math.max(G.shake,0.3);
    setTimeout(()=>cinematic(false),2600);
  }
}

/* ---------- ambient world particles: leaves, pollen, forge embers ---------- */
let ambT=0;
function ambientFX(dt){
  ambT-=dt; if(ambT>0) return; ambT=0.28;
  const t=tileAt(Math.floor(P.x),Math.floor(P.y));
  const night=nightAmount();
  if((t===T.FOREST||(ZONES.forest&&dist(P.x,P.y,ZONES.forest.x,ZONES.forest.y)<9)) && Math.random()<0.7){
    G.parts.push({x:P.x+rnd(-8,8), y:P.y+rnd(-8,8), vx:rnd(0.2,0.6), vy:rnd(0.1,0.4),
      life:rnd(2.5,4.5), color:Math.random()<0.5?'#a8bf62':'#7fa050', size:3, leaf:true, ph:Math.random()*TAU});
  }
  if(night<0.3 && ZONES.meadow && dist(P.x,P.y,ZONES.meadow.x,ZONES.meadow.y)<8 && Math.random()<0.8){
    G.parts.push({x:P.x+rnd(-7,7), y:P.y+rnd(-7,7), vx:rnd(-0.15,0.15), vy:rnd(-0.15,0.15),
      life:rnd(2,4), color:'rgba(255,240,180,0.8)', size:2, glow:true});
  }
  if(night<0.35 && ZONES.meadow && dist(P.x,P.y,ZONES.meadow.x,ZONES.meadow.y)<9 && Math.random()<0.35){
    G.parts.push({x:P.x+rnd(-8,8), y:P.y+rnd(-8,8), vx:rnd(-0.4,0.4), vy:rnd(-0.4,0.4),
      life:rnd(4,7), bfly:true, ph:Math.random()*TAU,
      color: Math.random()<0.5? '#e8c14d' : '#c9d6ff', size:3});
  }
  if(G.forgePos && dist(P.x,P.y,G.forgePos.x,G.forgePos.y)<9 && Math.random()<0.8){
    G.parts.push({x:G.forgePos.x+rnd(-0.4,0.4), y:G.forgePos.y+rnd(-0.4,0.4),
      vx:rnd(-0.35,-0.12), vy:rnd(-0.35,-0.12),
      life:rnd(0.8,1.6), color:'#ffab4d', size:2.4, glow:true});
  }
  // grit: fog banks + ash
  const ruinD=ZONES.ruins? dist(P.x,P.y,ZONES.ruins.x,ZONES.ruins.y) : 999;
  if(ruinD<12 && Math.random()<0.5) spawnFog(P.x+rnd(-9,9),P.y+rnd(-9,9),'rgba(96,116,98,');
  if(G.worldId!=='isle' && (G.dayT>0.92||G.dayT<0.08) && Math.random()<0.35) spawnFog(P.x+rnd(-10,10),P.y+rnd(-10,10),'rgba(150,165,185,');
  if(WX.rain>0.4 && Math.random()<0.25) spawnFog(P.x+rnd(-10,10),P.y+rnd(-10,10),'rgba(120,135,155,');
  if(ruinD<10 && Math.random()<0.6){
    G.parts.push({x:P.x+rnd(-8,8),y:P.y+rnd(-8,8),vx:rnd(-0.25,-0.05),vy:rnd(-0.25,-0.05),
      life:rnd(2,4),color:'rgba(160,155,145,0.6)',size:1.6});
  }
}

