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
/* ---------- Act I epilogue: "six months later", the two siblings sail into Stormreach ----------
   Replaces the old credit roll. A self-contained animated scene (its own rAF loop, since the
   world is paused) of the prince and princess crossing open water into a gathering tempest,
   with a click-to-advance dialogue between brother and sister, closing on landfall at Stormreach. */
const EPI = {
  // Each beat: who is speaking ('' = narration), the line, and the target sea-state the visuals
  // ease toward while it is on screen. storm 0..1 = rain/lightning; near 0..1 = island approach.
  beats: [
    { who:'', html:'<i>Six months of open water. The charted isles are long gone behind the wake, and the sea has run out of names.</i>', storm:0.05, near:0.02 },
    { who:'The Prince', html:'“There.” <i>He steadies the chart against the wind and points past the bow.</i> “The stars finally agree with the old maps. That smudge on the horizon isn\'t cloud, sister &mdash; it\'s land.”', storm:0.1, near:0.12 },
    { who:'The Princess', html:'“It\'s been cloud for a week, little brother. Every wave looks like an island when you want one badly enough.”', storm:0.14, near:0.2 },
    { who:'The Prince', html:'“Not this one. Listen &mdash; no gulls. No gulls means no safe harbour, means sailors gave it a name and a wide berth.” <i>He taps the chart\'s far edge.</i> “The charts call it <b>Stormreach</b>. A tempest that never breaks, sitting over a single rock.”', storm:0.3, near:0.32 },
    { who:'The Princess', html:'“A tempest that never breaks.” <i>She half-smiles into the wind.</i> “The kind of place a man hides a thing he doesn\'t want found. Or a person.”', storm:0.45, near:0.44 },
    { who:'The Prince', html:'“You think Vath\'s reach runs this far out?”', storm:0.55, near:0.55 },
    { who:'The Princess', html:'“I think six months ago Father told us to go where he couldn\'t reach us yet. This is as far as the sea goes. If the strength to come back for him is anywhere, it\'s here &mdash; past the last name on the map.”', storm:0.68, near:0.66 },
    { who:'', html:'<i>The wind turns cold and certain. The first grey line of rain walks across the water toward them, and the little boat lifts its bow to meet it.</i>', storm:0.85, near:0.78 },
    { who:'The Prince', html:'<i>He hauls on the sheet as the sail cracks taut.</i> “Then we\'d best not drown on the doorstep! Trim her &mdash; she wants to run before this wind, not fight it!”', storm:0.95, near:0.9 },
    { who:'The Princess', html:'<i>She laughs, full-throated, into the breaking storm.</i> “Now you sound like a sailor! Hold her steady, brother. Whatever\'s waiting on that rock &mdash; we make landfall together.”', storm:1, near:1 },
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
  // the sloop they crossed on, hauled up on the shingle beside the landing
  if(!G.decor.some(d=>d.arrivalBoat)){
    const bt=addBuilding('boat', Math.round(Z.x-2), Math.round(Z.y+2), '');
    if(bt) bt.arrivalBoat=1;
  }
  // the prince holds the strand while the princess explores - findable at any hour
  if(!G.npcs.some(n=>n.id==='brother')){
    const sp=(typeof findOpenNear==='function' && findOpenNear(Math.round(Z.x+2), Math.round(Z.y+1), 5)) || [Z.x+2, Z.y+1];
    const b=makeNPC('brother','Your Brother, the Prince', sp[0], sp[1],
      {skin:'#d8a97a',hair:'#7a5a3a',shirt:'#3b5a7a',pants:'#33302a',cloak:'#274052',hairstyle:'short'},
      ["Go on - I'll mind the boat. If this rock stoves a hull the way the charts promised, someone has to keep our way home afloat.",
       "I'll keep a fire lit here on the strand. Find what this place is hiding, sister - nothing I'd have to write a ballad about.",
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
    { who:'Vath', title:'THE ENCHANTER COMES',
      html:'<i>The tall doors at the hall’s end blow inward on a wind that stinks of storm and violet. Vath strides in through the wreck of them, one hand already rising.</i> <b style="color:#c9a0ff">“Thirty years I waited for your whole line to stand in a single room. How good of you to gather.”</b>',
      vath:0.55, gold:0.18, violet:0.4, clash:0, flee:0, guards:0 },
    { who:'',
      html:'<i>Vath’s hand comes down and the violet light leaps for the two of you like a striking snake — but the old King is already moving.</i> <b>“You WON’T take them from me — not again, Vath!”</b> <i>King Aldous throws himself between the light and his children, and the Tideglass fire answers in his blood: gold against violet.</i>',
      vath:1, gold:0.85, violet:0.7, clash:0.72, flee:0, guards:0 },
    { who:'King Aldous', title:'THE KING RISES',
      html:'<i>Gold light roars up the old King’s arms and slams into Vath, driving the enchanter back a step — then two.</i> “RUN! Both of you — out the east doors, to the water — GO, and do not look back!”',
      vath:0.78, gold:1, violet:0.5, clash:1, flee:0.08, guards:0 },
    { who:'',
      html:'<i>Your brother stands rooted, staring at the father he only just remembered. So you decide for the both of you.</i> <b style="color:var(--ember)">“We need to go — NOW!”</b> <i>You lock your fist in his collar and haul him toward the east doors, and at last his legs remember how to run.</i>',
      vath:0.78, gold:0.95, violet:0.55, clash:0.9, flee:0.42, guards:0 },
    { who:'King Aldous',
      html:'<i>You burst through the east doors into the rain — and behind you the golden light does not fail. On the dais the old King bares his teeth in something almost like triumph.</i> “…Gone. They’re gone, Vath. Whatever else you take from me today — you did not take them. You never will.”',
      vath:0.82, gold:0.9, violet:0.55, clash:0.82, flee:0.82, guards:0 },
    { who:'Vath',
      html:'<i>And Vath begins to laugh.</i> <b style="color:#c9a0ff">“Take them? Old man — I never wanted the children. They were bait. I needed you off that throne and spending thirty years of hoarded strength in one reckless breath.”</b>',
      vath:1, gold:0.68, violet:0.6, clash:0.18, flee:1, guards:0 },
    { who:'Vath', title:'THE TIDEGLASS TAKEN',
      html:'<i>The King’s golden fire gutters — thinning, starving, poured out with nothing left to feed it.</i> <b style="color:#c9a0ff">“You have just tired yourself out enough for me to TAKE it.”</b> <i>Vath closes his hand, and the violet folds over Aldous like a tide coming in. The old King drops to one knee, hollow and grey, the light gone out of him.</i>',
      vath:1, gold:0.1, violet:0.95, clash:0, flee:1, guards:0, takeFlash:1 },
    { who:'',
      html:'<i>Boots thunder in the corridors. The King’s guard floods the hall, blades bared, and their captain levels a sword at the stranger standing over their fallen lord.</i> “STAND DOWN! On the ground, hands from your sides — you are under arrest for—”',
      vath:1, gold:0.07, violet:0.58, clash:0, flee:1, guards:1 },
    { who:'',
      html:'<i>Vath only lifts two fingers, and a soft violet pulse rolls out across the hall like a held breath let go. The guards’ swords drift down; their eyes go glassy and far.</i> “…what… happened…?” <i>the captain murmurs, blinking at the blade in his own hand.</i>',
      vath:1, gold:0.05, violet:0.7, clash:0, flee:1, guards:1, pulse:1 },
    { who:'Vath',
      html:'<b style="color:#c9a0ff">“What happened is that the old King’s own son and daughter came home to seize his throne — and struck him down with sorcery when he refused them. They fled east across the water as I arrived.”</b> <i>He lets his voice fall.</i> <b style="color:#c9a0ff">“Would that I had been sooner.”</b>',
      vath:1, gold:0.05, violet:0.55, clash:0, flee:1, guards:1 },
    { who:'', title:'END OF ACT I',
      html:'<i>The lie pours into the hollow where the captain’s memory was and sets like stone.</i> “The prince… and the princess… did this. We’ll put every hull on the water after them.” <i>Vath smiles, and does not correct him.</i>',
      vath:1, gold:0.04, violet:0.5, clash:0, flee:1, guards:1, dark:1 },
  ],
  raf:0, t:0, prev:0, cv:null, cx:null, idx:0,
  vath:0, gold:0.12, violet:0, clash:0, flee:0, guards:0, dark:0,
  flash:0, flashT:5, pulseR:0, take:0, sparks:[], drops:[],
  running:false, ended:false, started:false,
};
function throneCutscene(){
  const ov=document.getElementById('thrOv');
  const cv=document.getElementById('thrCv');
  const title=document.getElementById('thrTitle');
  const sub=document.getElementById('thrSub');
  if(!ov||!cv){ _thrEndAct(); return; }   // graceful fallback: resolve Act I and sail on
  THR.cv=cv; THR.cx=cv.getContext('2d');
  THR.t=0; THR.prev=0; THR.idx=0;
  THR.vath=0; THR.gold=0.12; THR.violet=0; THR.clash=0; THR.flee=0; THR.guards=0; THR.dark=0;
  THR.flash=0; THR.flashT=5; THR.pulseR=0; THR.take=0; THR.sparks.length=0; THR.drops.length=0;
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
  if(b.takeFlash){ THR.flash=1.2; THR.take=1; }
  if(b.pulse){ THR.pulseR=0.001; }   // kick off the memory-rewrite ring
  document.getElementById('thrWho').textContent=b.who||'';
  document.getElementById('thrLine').innerHTML=b.html;
  const tap=document.getElementById('thrTap');
  if(tap) tap.textContent=(i>=THR.beats.length-1)?'the sea waits ›':'click to continue ›';
  const sub=document.getElementById('thrSub');
  sub.classList.remove('show'); void sub.offsetWidth; sub.classList.add('show');
  // title-card flash for the marquee beats
  if(b.title){
    const t=document.getElementById('thrTitle'), tt=document.getElementById('thrTitleT');
    if(t&&tt){ tt.textContent=b.title; t.classList.remove('show'); void t.offsetWidth;
      t.classList.add('show'); clearTimeout(THR._titleTO);
      THR._titleTO=setTimeout(()=>t.classList.remove('show'), 2600); }
  }
}
function _thrNext(){
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
  const ease=(cur,tgt,k)=>cur+(tgt-cur)*Math.min(1,dt*k);
  THR.vath   = ease(THR.vath,   b.vath||0,   1.6);
  THR.gold   = ease(THR.gold,   b.gold||0,   b.gold<THR.gold?4.5:2.2);  // guttering falls fast
  THR.violet = ease(THR.violet, b.violet||0, 2.0);
  THR.clash  = ease(THR.clash,  b.clash||0,  3.0);
  THR.flee   = ease(THR.flee,   b.flee||0,   1.3);
  THR.guards = ease(THR.guards, b.guards||0, 2.2);
  THR.dark   = ease(THR.dark,   b.dark?1:0,  0.8);
  THR.take   = Math.max(0,THR.take-dt*0.5);
  // storm-lightning through the east doors, keener as the violet rises
  THR.flash=Math.max(0,THR.flash-dt*3.0);
  THR.flashT-=dt*(0.35+THR.violet*1.4);
  if(THR.flashT<=0){ THR.flashT=2.4+Math.random()*4; THR.flash=Math.max(THR.flash,0.85); }
  // the memory-rewrite ring, once kicked off, sweeps out and fades
  if(THR.pulseR>0){ THR.pulseR+=dt*1.9; if(THR.pulseR>1.8) THR.pulseR=0; }
  // clash sparks at the meeting point of the two magics
  if(THR.clash>0.35 && Math.random()<THR.clash*0.9){
    THR.sparks.push({x:0,y:0,vx:(Math.random()*2-1)*70,vy:(Math.random()*2-1)*70-10,life:0.5,max:0.5,
      col:Math.random()<0.5?'#ffd27a':'#c9a0ff'});
  }
  for(const s of THR.sparks){ s.x+=s.vx*dt; s.y+=s.vy*dt; s.vy+=90*dt; s.life-=dt; }
  THR.sparks=THR.sparks.filter(s=>s.life>0);
  _thrDraw();
  THR.raf=requestAnimationFrame(_thrLoop);
}
function _thrDraw(){
  const cx=THR.cx, W=THR.W, H=THR.H, t=THR.t; if(!cx||!W) return;
  const gold=THR.gold, violet=THR.violet, clash=THR.clash;
  const floorY=H*0.72;
  const S=Math.max(0.72,Math.min(1.5,H/560));
  // --- back wall: cold stone, faintly lit by torches, storm-dark up top ---
  const wall=cx.createLinearGradient(0,0,0,floorY);
  wall.addColorStop(0,'#0b0e18'); wall.addColorStop(0.55,'#171b28'); wall.addColorStop(1,'#20242f');
  cx.fillStyle=wall; cx.fillRect(0,0,W,floorY+2);
  // faint stone courses
  cx.strokeStyle='rgba(255,255,255,0.03)'; cx.lineWidth=1;
  for(let y=H*0.14;y<floorY;y+=26){ cx.beginPath(); cx.moveTo(0,y); cx.lineTo(W,y); cx.stroke(); }
  // --- east doorway on the right: the storm and the sea the siblings run for ---
  const dwX=W*0.80, dwW=W*0.17, dwTop=H*0.16, dwBot=floorY;
  cx.save();
  cx.beginPath();
  cx.moveTo(dwX,dwBot); cx.lineTo(dwX,dwTop+dwW*0.5);
  cx.quadraticCurveTo(dwX,dwTop, dwX+dwW*0.5,dwTop);
  cx.quadraticCurveTo(dwX+dwW,dwTop, dwX+dwW,dwTop+dwW*0.5);
  cx.lineTo(dwX+dwW,dwBot); cx.closePath();
  cx.clip();
  const sky=cx.createLinearGradient(0,dwTop,0,dwBot);
  sky.addColorStop(0,'#20283c'); sky.addColorStop(0.6,'#2b3346'); sky.addColorStop(1,'#3a4152');
  cx.fillStyle=sky; cx.fillRect(dwX,dwTop,dwW,dwBot-dwTop);
  if(THR.flash>0.01){ cx.fillStyle=`rgba(200,214,255,${0.6*THR.flash})`; cx.fillRect(dwX,dwTop,dwW,dwBot-dwTop); }
  // rain through the doorway
  cx.strokeStyle='rgba(200,220,250,0.32)'; cx.lineWidth=1; cx.beginPath();
  for(let i=0;i<40;i++){
    const rx=dwX+((i*53+ (t*260))% (dwW)); const ry=dwTop+((i*97+ t*520)%(dwBot-dwTop));
    cx.moveTo(rx,ry); cx.lineTo(rx-3,ry+11);
  }
  cx.stroke();
  cx.restore();
  // doorway arch stone frame
  cx.strokeStyle='#0a0d15'; cx.lineWidth=6*S;
  cx.beginPath();
  cx.moveTo(dwX,dwBot); cx.lineTo(dwX,dwTop+dwW*0.5);
  cx.quadraticCurveTo(dwX,dwTop, dwX+dwW*0.5,dwTop);
  cx.quadraticCurveTo(dwX+dwW,dwTop, dwX+dwW,dwTop+dwW*0.5);
  cx.lineTo(dwX+dwW,dwBot); cx.stroke();
  // --- shattered entry doors on the left, where Vath came in, spilling violet ---
  const inX=W*0.03, inW=W*0.14, inTop=H*0.18;
  const ing=cx.createLinearGradient(inX,0,inX+inW,0);
  ing.addColorStop(0,`rgba(70,30,110,${0.25+0.45*violet})`); ing.addColorStop(1,'rgba(10,10,18,0)');
  cx.fillStyle=ing; cx.fillRect(inX,inTop,inW,floorY-inTop);
  // --- floor ---
  const fl=cx.createLinearGradient(0,floorY,0,H);
  fl.addColorStop(0,'#1a1e28'); fl.addColorStop(1,'#0c0e15');
  cx.fillStyle=fl; cx.fillRect(0,floorY,W,H-floorY);
  cx.strokeStyle='rgba(0,0,0,0.4)'; cx.lineWidth=1;
  for(let i=1;i<7;i++){ const y=floorY+(H-floorY)*(i/7); cx.beginPath(); cx.moveTo(0,y); cx.lineTo(W,y); cx.stroke(); }
  // magic-light spill on the floor
  if(gold>0.05||violet>0.05){
    const gspill=cx.createRadialGradient(W*0.46,floorY,4,W*0.46,floorY,W*0.4);
    gspill.addColorStop(0,`rgba(255,196,90,${0.16*gold})`); gspill.addColorStop(1,'rgba(255,196,90,0)');
    cx.fillStyle=gspill; cx.fillRect(0,floorY-4,W,H-floorY+4);
    const vspill=cx.createRadialGradient(W*0.24,floorY,4,W*0.24,floorY,W*0.4);
    vspill.addColorStop(0,`rgba(160,110,240,${0.16*violet})`); vspill.addColorStop(1,'rgba(160,110,240,0)');
    cx.fillStyle=vspill; cx.fillRect(0,floorY-4,W,H-floorY+4);
  }
  // --- wall torches (warm flicker) ---
  const torch=(tx)=>{
    const ty=H*0.30, fl=0.8+0.2*Math.sin(t*9+tx);
    const g=cx.createRadialGradient(tx,ty,2,tx,ty,60*S);
    g.addColorStop(0,`rgba(255,180,90,${0.5*fl})`); g.addColorStop(1,'rgba(255,180,90,0)');
    cx.fillStyle=g; cx.beginPath(); cx.arc(tx,ty,60*S,0,TAU); cx.fill();
    cx.fillStyle='#ffcf8a'; cx.beginPath(); cx.ellipse(tx,ty,3.5*S,7*S*fl,0,0,TAU); cx.fill();
  };
  torch(W*0.16); torch(W*0.66);
  // --- the Tideglass Throne on its dais, centre ---
  const thX=W*0.46, thBase=floorY;
  cx.save();
  // dais steps
  cx.fillStyle='#232733';
  cx.fillRect(thX-70*S, thBase-6*S, 140*S, 8*S);
  cx.fillStyle='#1b1f29';
  cx.fillRect(thX-54*S, thBase-14*S, 108*S, 8*S);
  // throne body: dark seat with a glassy tideglass back
  cx.fillStyle='#161a24';
  cx.fillRect(thX-26*S, thBase-58*S, 52*S, 46*S);
  const tg=cx.createLinearGradient(thX,thBase-104*S,thX,thBase-40*S);
  const tglow=0.4+0.3*Math.sin(t*1.4);
  tg.addColorStop(0,`rgba(120,210,220,${0.5+0.2*tglow})`);
  tg.addColorStop(1,'rgba(30,70,90,0.75)');
  cx.fillStyle=tg;
  cx.beginPath();
  cx.moveTo(thX-24*S,thBase-58*S);
  cx.lineTo(thX-24*S,thBase-98*S);
  cx.quadraticCurveTo(thX,thBase-116*S, thX+24*S,thBase-98*S);
  cx.lineTo(thX+24*S,thBase-58*S); cx.closePath(); cx.fill();
  cx.restore();
  // --- figures ---
  const fig=(x,body,head,opt)=>{
    opt=opt||{}; const s=(opt.s||1)*S, a=(opt.a==null?1:opt.a);
    if(a<=0.02) return;
    cx.save(); cx.translate(x,floorY); cx.globalAlpha=a; cx.scale(s,s);
    if(opt.aura){ const g=cx.createRadialGradient(0,-24,2,0,-24,42);
      g.addColorStop(0,opt.aura); g.addColorStop(1,'rgba(0,0,0,0)');
      cx.fillStyle=g; cx.beginPath(); cx.arc(0,-24,42,0,TAU); cx.fill(); }
    cx.fillStyle='rgba(0,0,0,0.35)'; cx.beginPath(); cx.ellipse(0,1,11,3.2,0,0,TAU); cx.fill();
    cx.fillStyle=body;   // robe / body
    cx.beginPath(); cx.moveTo(-8,-38);
    cx.quadraticCurveTo(-12,-6,-9,0); cx.lineTo(9,0);
    cx.quadraticCurveTo(12,-6,8,-38);
    cx.quadraticCurveTo(0,-46,-8,-38); cx.closePath(); cx.fill();
    if(opt.arm){ cx.strokeStyle=body; cx.lineWidth=3.4; cx.beginPath();
      cx.moveTo(opt.arm<0?-7:7,-30); cx.lineTo(opt.arm<0?-20:20,-38); cx.stroke(); }
    cx.fillStyle=head; cx.beginPath(); cx.arc(0,-44,5.4,0,TAU); cx.fill();
    cx.restore();
  };
  // Vath: advances from the shattered doors toward the throne as `vath` rises
  const vX=W*0.10+(W*0.22)*THR.vath;
  fig(vX, '#3a2455', '#d8c6ec', {s:1.12, a:Math.min(1,THR.vath*1.6), arm:1,
    aura:`rgba(160,110,240,${0.5*violet+0.15})`});
  // King Aldous before the throne (kneels grey once the fire guts out)
  const spent=1-Math.min(1,gold*3);   // 0 while burning, ->1 when the light is gone
  const kX=thX-2*S;
  fig(kX, spent>0.6?'#6a5a44':'#8a6a2a', spent>0.6?'#b8a382':'#e9d59a',
      {s:1.06-0.14*spent, a:1, arm:-1, aura:`rgba(255,196,90,${0.55*gold})`});
  // the two siblings: run right, out the east doors, then gone
  const sib=(x,body,head,off)=>{
    const run=THR.flee, sx=W*(0.55)+(W*0.30)*run + off;
    const a=run>0.9? Math.max(0,1-(run-0.9)*10) : 1;
    const bob=Math.sin(t*10+off)* (run>0.05?3:0);
    fig(sx, body, head, {s:0.9, a:a*Math.min(1,1.1-THR.guards*0.0)});
    void x; void bob;
  };
  sib(0,'#7a2f2f','#e7c49a', 0);      // the princess (blood-red)
  sib(0,'#2f4a7a','#e0b98a', 16*S);   // the prince (blue)
  // --- the clash: gold and violet meeting mid-hall ---
  if(clash>0.03){
    const y=floorY-46*S, x0=vX+14*S, x1=kX-14*S, mid=(x0+x1)/2;
    const beam=cx.createLinearGradient(x0,0,x1,0);
    beam.addColorStop(0,`rgba(160,110,240,${0.85*clash})`);
    beam.addColorStop(0.5,`rgba(255,255,255,${0.9*clash})`);
    beam.addColorStop(1,`rgba(255,196,90,${0.85*clash})`);
    cx.save(); cx.globalCompositeOperation='lighter';
    cx.strokeStyle=beam; cx.lineWidth=(4+8*clash)*S+2*Math.sin(t*40)*clash;
    cx.beginPath(); cx.moveTo(x0,y); cx.lineTo(x1,y); cx.stroke();
    // bright collision node
    const nr=(10+14*clash)*S*(0.85+0.15*Math.sin(t*30));
    const ng=cx.createRadialGradient(mid,y,1,mid,y,nr);
    ng.addColorStop(0,`rgba(255,255,255,${clash})`); ng.addColorStop(1,'rgba(255,255,255,0)');
    cx.fillStyle=ng; cx.beginPath(); cx.arc(mid,y,nr,0,TAU); cx.fill();
    // sparks fly from the node
    for(const s of THR.sparks){ cx.globalAlpha=Math.max(0,s.life/s.max);
      cx.fillStyle=s.col; cx.fillRect(mid+s.x,y+s.y,2.2,2.2); }
    cx.globalAlpha=1; cx.restore();
  }
  // --- guards flooding in along the foreground ---
  if(THR.guards>0.02){
    const n=6;
    for(let i=0;i<n;i++){
      const gp=(i+0.5)/n;
      const gx=W*(0.12+0.72*gp);
      const rise=Math.min(1,THR.guards*1.4-gp*0.3);
      if(rise<=0.02) continue;
      const gy=H*0.995 - (H*0.20)*rise;
      cx.save(); cx.globalAlpha=Math.min(1,rise); cx.translate(gx,gy); const gs=S*1.25;
      cx.scale(gs,gs);
      cx.fillStyle='#0c0f16';
      cx.beginPath(); cx.moveTo(-9,0); cx.quadraticCurveTo(-12,-30,-6,-40);
      cx.lineTo(6,-40); cx.quadraticCurveTo(12,-30,9,0); cx.closePath(); cx.fill();
      cx.beginPath(); cx.arc(0,-46,6,0,TAU); cx.fill();   // helm
      cx.strokeStyle='#0c0f16'; cx.lineWidth=2.6;         // spear
      cx.beginPath(); cx.moveTo(8,-8); cx.lineTo(8,-64); cx.stroke();
      cx.restore();
    }
  }
  // --- the memory-rewrite pulse: a violet ring washing over the hall ---
  if(THR.pulseR>0){
    const pr=THR.pulseR, R=W*0.75*pr, a=Math.max(0,1-pr/1.8);
    cx.save(); cx.globalCompositeOperation='lighter';
    const rg=cx.createRadialGradient(vX,floorY-40*S,R*0.7,vX,floorY-40*S,R);
    rg.addColorStop(0,'rgba(160,110,240,0)');
    rg.addColorStop(0.85,`rgba(180,140,255,${0.45*a})`);
    rg.addColorStop(1,'rgba(160,110,240,0)');
    cx.fillStyle=rg; cx.fillRect(0,0,W,H);
    cx.restore();
  }
  // --- full-hall violet flash when the Tideglass is torn away ---
  if(THR.take>0.01){ cx.fillStyle=`rgba(150,100,235,${0.5*THR.take})`; cx.fillRect(0,0,W,H); }
  if(THR.flash>0.01){ cx.fillStyle=`rgba(190,205,255,${0.12*THR.flash})`; cx.fillRect(0,0,W,H); }
  // landfall of the act: darken as the lie sets like stone
  if(THR.dark>0.01){ cx.fillStyle=`rgba(3,4,9,${0.62*THR.dark})`; cx.fillRect(0,0,W,H); }
  // vignette
  const vg=cx.createRadialGradient(W*0.5,H*0.5,H*0.18,W*0.5,H*0.5,H*0.78);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.6)');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);
}

/* ---------- adaptive music (procedural, three moods) ---------- */
const Music={
  nextT:0, beat:0, mode:'day',
  chords:[[220,277.2,329.6],[174.6,220,261.6],[196,246.9,293.7],[164.8,207.7,246.9]],
  scale:[440,493.9,523.3,587.3,659.3,784,880],
  update(){
    if(!Snd.on||!Snd.ctx||G.state!=='play') return;
    const now=Snd.ctx.currentTime;
    if(this.nextT<now-1) this.nextT=now+0.1;
    const boss=G.mobs.some(m=>m.bigBoss&&!m.dead&&m.state==='chase'&&dist(P.x,P.y,m.x,m.y)<14);
    this.mode= boss?'boss' : nightAmount()>0.5?'night':'day';
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
    if(this.mode==='boss'){
      if(inBar%2===0) this.ping(t,55*(inBar%4===0?1:1.5),spb*0.9,0.05,'sawtooth');
      if(inBar===0) this.pad(t,110*[1,0.94,1.12,0.89][bar],spb*8,0.026);
      if(Math.random()<0.3) this.ping(t,this.scale[(beat*3)%7]/2,spb*0.6,0.02,'square');
      return;
    }
    const ch=this.chords[bar], nv=this.mode==='night'?0.55:1;
    if(inBar===0) this.pad(t,ch[0]/2,spb*8,0.028*nv);
    if(inBar===4) this.pad(t,ch[1],spb*4,0.015*nv);
    if(Math.random()<(this.mode==='night'?0.22:0.4)){
      const f=this.scale[Math.floor(Math.random()*7)]*(Math.random()<0.25?0.5:1);
      this.ping(t,f,spb*1.8,0.026*nv,'sine');
    }
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
        if(Math.random()<0.4&&G.state==='play')
          G.parts.push({x:P.x+rnd(-7,7),y:P.y+rnd(-5,5),vx:0,vy:0,life:0.22,color:'rgba(205,228,255,0.55)',size:2});
      }
    }
    if(this.rain>0.65){
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
    if(this.rain<=0.02) return;
    cx.strokeStyle='rgba(200,220,250,'+(0.28*this.rain)+')'; cx.lineWidth=1;
    cx.beginPath();
    for(const d of this.drops){ cx.moveTo(d.x,d.y); cx.lineTo(d.x-d.len*0.18,d.y-d.len); }
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
  g.fillStyle='rgba(10,15,44,'+(night*0.58)+')';
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

