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
      if(dist(P.x,P.y,ZONES.ruins.x,ZONES.ruins.y)<14 || dist(P.x,P.y,ZONES.tower.x,ZONES.tower.y)<10) Snd.caw(); }
  }
};

/* ---------- weather: passing rain, cloud shadows, far thunder ---------- */
const WX={
  rain:0, target:0, timer:45, drops:[], boltT:0,
  update(dt){
    this.timer-=dt;
    if(this.timer<=0){
      if(this.target>0){ this.target=0; this.timer=rnd(70,130); }
      else { this.target=rnd(0.55,1); this.timer=rnd(20,40); }
    }
    this.rain += (this.target-this.rain)*Math.min(1,dt*0.4);
    if(this.rain<0.02&&this.target===0) this.rain=0;
    const want=Math.round(this.rain*130);
    while(this.drops.length<want) this.drops.push({x:Math.random()*(VW+120)-60,y:Math.random()*VH,spd:rnd(620,900),len:rnd(9,16)});
    if(this.drops.length>want) this.drops.length=want;
    for(const d of this.drops){
      d.y+=d.spd*dt; d.x+=d.spd*0.18*dt;
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
    banner(boss.title, boss.boss? 'LORD OF THE OLD RUINS' : 'TERROR OF THE WOLFCRAG');
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
  if((t===T.FOREST||dist(P.x,P.y,ZONES.forest.x,ZONES.forest.y)<9) && Math.random()<0.7){
    G.parts.push({x:P.x+rnd(-8,8), y:P.y+rnd(-8,8), vx:rnd(0.2,0.6), vy:rnd(0.1,0.4),
      life:rnd(2.5,4.5), color:Math.random()<0.5?'#a8bf62':'#7fa050', size:3, leaf:true, ph:Math.random()*TAU});
  }
  if(night<0.3 && dist(P.x,P.y,ZONES.meadow.x,ZONES.meadow.y)<8 && Math.random()<0.8){
    G.parts.push({x:P.x+rnd(-7,7), y:P.y+rnd(-7,7), vx:rnd(-0.15,0.15), vy:rnd(-0.15,0.15),
      life:rnd(2,4), color:'rgba(255,240,180,0.8)', size:2, glow:true});
  }
  if(night<0.35 && dist(P.x,P.y,ZONES.meadow.x,ZONES.meadow.y)<9 && Math.random()<0.35){
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
  if((G.dayT>0.92||G.dayT<0.08) && Math.random()<0.35) spawnFog(P.x+rnd(-10,10),P.y+rnd(-10,10),'rgba(150,165,185,');
  if(WX.rain>0.4 && Math.random()<0.25) spawnFog(P.x+rnd(-10,10),P.y+rnd(-10,10),'rgba(120,135,155,');
  if(ruinD<10 && Math.random()<0.6){
    G.parts.push({x:P.x+rnd(-8,8),y:P.y+rnd(-8,8),vx:rnd(-0.25,-0.05),vy:rnd(-0.25,-0.05),
      life:rnd(2,4),color:'rgba(160,155,145,0.6)',size:1.6});
  }
}

