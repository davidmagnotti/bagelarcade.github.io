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
    { who:'', html:'<i>The keel grinds onto black shingle beneath a sky that has forgotten the sun. High above the rain, a single light is burning. Side by side, they step ashore &mdash; into Act II.</i>', storm:1, near:1, land:1 },
  ],
  raf:0, t:0, prev:0, cv:null, cx:null, idx:0, storm:0, near:0, land:0, flash:0, flashT:6, drops:[], running:false, ended:false,
};
function rollCredits(){ sailEpilogue(); }   // old call-site name kept as an alias
function sailEpilogue(){
  const ov=document.getElementById('epiOv');
  const cv=document.getElementById('epiCv');
  const end=document.getElementById('epiEnd');
  const title=document.getElementById('epiTitle');
  const sub=document.getElementById('epiSub');
  if(!ov||!cv||!end){ // graceful fallback: the old teaser toast
    if(typeof toastErr==='function') toastErr('<b style="color:#c9a0ff">Vath holds the Tideglass magic now.</b> Six months on, you and your brother make landfall at storm-locked Stormreach. <b style="color:var(--ember)">Act II - coming soon.</b>',9000);
    return;
  }
  EPI.cv=cv; EPI.cx=cv.getContext('2d');
  EPI.t=0; EPI.prev=0; EPI.idx=0; EPI.storm=0.05; EPI.near=0.02; EPI.land=0; EPI.flash=0; EPI.flashT=6;
  EPI.drops.length=0; EPI.ended=false; EPI.running=true;
  end.classList.remove('show'); sub.classList.remove('show'); title.classList.remove('show');
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
  ov.onclick=(e)=>{ if(EPI.ended || !EPI.started) return;
    if(e && e.target && e.target.id==='epiBtn') return;   // the return button handles itself
    _epiNext();
  };
  const btn=document.getElementById('epiBtn');
  if(btn) btn.onclick=(e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); _epiClose(); };
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
  if(tap) tap.textContent=(i>=EPI.beats.length-1)?'':'click to continue ›';
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
  const end=document.getElementById('epiEnd');
  sub.classList.remove('show');
  setTimeout(()=>{ if(end) end.classList.add('show'); }, 700);
}
function _epiClose(){
  EPI.running=false; cancelAnimationFrame(EPI.raf);
  window.removeEventListener('resize', _epiResize);
  const ov=document.getElementById('epiOv');
  if(ov) ov.style.display='none';
  G._credits=0;
  if(G.state==='play') G.paused=false;
  if(typeof cinematic==='function') cinematic(false);
  if(typeof autoSave==='function') autoSave();
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

