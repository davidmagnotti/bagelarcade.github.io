/* =====================================================================
   MAIN LOOP & BOOT
   ===================================================================== */
/* =====================================================================
   GRIT LAYER - weathering, gore decals, ground fog, crows, film grade
   ===================================================================== */

/* ---------- weather every pre-rendered sprite: grime, moss, streaks ---------- */
function weatherAll(){
  const r=mulberry32(777);
  for(const key in SPR){
    const c=SPR[key]; if(!c||!c.getContext) continue;
    const g=c.getContext('2d');
    g.save();
    g.globalCompositeOperation='source-atop';
    // grime speckle
    for(let i=0;i<Math.round(c.width*c.height/260);i++){
      const px=r()*c.width, py=r()*c.height;
      g.fillStyle= r()<0.6 ? 'rgba(20,14,8,'+(0.05+r()*0.09)+')' : 'rgba(230,225,210,'+(0.03+r()*0.05)+')';
      g.fillRect(px,py,1+r()*2.4,1+r()*1.6);
    }
    // vertical weather streaks (rain-stained walls)
    for(let i=0;i<4;i++){
      const px=r()*c.width, py=r()*c.height*0.5, ln=8+r()*c.height*0.35;
      g.fillStyle='rgba(15,10,6,'+(0.05+r()*0.05)+')';
      g.fillRect(px,py,1.4,ln);
    }
    // moss creeping up from the base
    for(let i=0;i<6;i++){
      const px=r()*c.width, py=c.height*(0.72+r()*0.24);
      g.fillStyle='rgba(70,95,45,'+(0.10+r()*0.12)+')';
      g.beginPath(); g.ellipse(px,py,2+r()*4,1.4+r()*2,0,0,TAU); g.fill();
    }
    // grounded shadow gradient (fake AO)
    const ao=g.createLinearGradient(0,c.height*0.62,0,c.height);
    ao.addColorStop(0,'rgba(0,0,0,0)'); ao.addColorStop(1,'rgba(10,6,2,0.22)');
    g.fillStyle=ao; g.fillRect(0,0,c.width,c.height);
    g.restore();
  }
}

/* ---------- gore & goo decals that stain the ground ---------- */
function splat(x,y,color,big){
  const n= big? 7 : 4;
  for(let i=0;i<n;i++){
    if(G.decals.length>90) G.decals.shift();
    const a=Math.random()*TAU, d=Math.random()*(big?0.9:0.5);
    G.decals.push({x:x+Math.cos(a)*d, y:y+Math.sin(a)*d,
      rx:(big?5:3)+Math.random()*(big?9:5), color,
      life:rnd(18,30), max:1, rot:Math.random()*TAU});
  }
}
function drawDecals(minX,maxX,minY,maxY){
  for(const d of G.decals){
    if(d.x<minX||d.x>maxX||d.y<minY||d.y>maxY) continue;
    const s=worldToScreen(d.x,d.y);
    cx.globalAlpha=Math.min(0.55, d.life*0.12);
    cx.fillStyle=d.color;
    cx.save(); cx.translate(s.x,s.y); cx.rotate(d.rot); cx.scale(1,0.5);
    cx.beginPath(); cx.arc(0,0,d.rx,0,TAU); cx.fill();
    cx.restore();
  }
  cx.globalAlpha=1;
}
const GORE={ slime:'#3f6b2a', wolf:'#4d100c', skeleton:'#8f8a7a', boss:'#274435', player:'#55100c' };

/* ---------- rolling ground fog & ruin miasma ---------- */
function spawnFog(x,y,color){
  if(G.fogs.length>26) return;
  G.fogs.push({x,y,vx:rnd(0.15,0.4),vy:rnd(-0.08,0.08),
    r:rnd(38,80), life:0, max:rnd(5,9), ph:Math.random()*TAU, color});
}
function drawFog(){
  for(const f of G.fogs){
    const s=worldToScreen(f.x,f.y);
    if(s.x<-200||s.x>VW+200||s.y<-160||s.y>VH+160) continue;
    const env=Math.sin(clamp(f.life/f.max,0,1)*Math.PI); // fade in/out
    const gg=cx.createRadialGradient(s.x,s.y,f.r*0.15,s.x,s.y,f.r);
    gg.addColorStop(0,f.color+(0.11*env)+')');
    gg.addColorStop(1,f.color+'0)');
    cx.fillStyle=gg;
    cx.save(); cx.translate(s.x,s.y); cx.scale(1,0.45); cx.translate(-s.x,-s.y);
    cx.beginPath(); cx.arc(s.x,s.y,f.r,0,TAU); cx.fill();
    cx.restore();
  }
}

/* ---------- coastal gulls ---------- */
function updateGulls(dt){
  G.gulls=G.gulls||[];
  G.gullT=(G.gullT===undefined? 8 : G.gullT)-dt;
  if(G.gullT<=0){
    G.gullT=rnd(16,32);
    if(Amb._coast){
      const side=Math.random()<0.5?-1:1;
      for(let i=0;i<2+((Math.random()*2)|0);i++){
        G.gulls.push({x:P.x-side*16+rnd(-3,3), y:P.y+rnd(-8,8),
          vx:side*rnd(1.6,2.4), vy:rnd(-0.5,0.5), h:rnd(70,120), ph:Math.random()*TAU});
      }
    }
  }
  for(let i=G.gulls.length-1;i>=0;i--){
    const g0=G.gulls[i];
    g0.x+=g0.vx*dt; g0.y+=g0.vy*dt;
    if(dist(g0.x,g0.y,P.x,P.y)>34) G.gulls.splice(i,1);
  }
}
function drawGulls(){
  if(!G.gulls) return;
  for(const b of G.gulls){
    const s=worldToScreen(b.x,b.y);
    if(s.x<-40||s.x>VW+40) continue;
    const sy=s.y-b.h+Math.sin(G.time*1.2+b.ph)*5;
    const flap=Math.sin(G.time*8+b.ph*3);
    cx.strokeStyle='rgba(238,240,244,0.9)'; cx.lineWidth=1.8; cx.lineCap='round';
    cx.beginPath();
    cx.moveTo(s.x-6,sy-flap*3.5); cx.quadraticCurveTo(s.x-2,sy+1.5,s.x,sy);
    cx.quadraticCurveTo(s.x+2,sy+1.5,s.x+6,sy-flap*3.5);
    cx.stroke();
    cx.strokeStyle='rgba(60,60,64,0.5)'; cx.lineWidth=0.8;
    cx.beginPath(); cx.moveTo(s.x-5,sy-flap*3); cx.lineTo(s.x-6,sy-flap*3.5); cx.stroke();
  }
}

/* ---------- carrion crows circling the ruins & tower ---------- */
function drawCrows(){
  for(const c of G.crows){
    const a=G.time*c.spd+c.ph;
    const wx=c.cx+Math.cos(a)*c.r, wy=c.cy+Math.sin(a)*c.r;
    const s=worldToScreen(wx,wy);
    if(s.x<-40||s.x>VW+40||s.y<-40||s.y>VH+40) continue;
    const sy=s.y-c.h+Math.sin(G.time*0.9+c.ph)*6;
    const flap=Math.sin(G.time*7+c.ph*3);
    cx.strokeStyle='rgba(12,10,10,0.85)'; cx.lineWidth=1.8; cx.lineCap='round';
    cx.beginPath();
    cx.moveTo(s.x-6,sy-flap*3.5); cx.quadraticCurveTo(s.x-2,sy+1.5,s.x,sy);
    cx.quadraticCurveTo(s.x+2,sy+1.5,s.x+6,sy-flap*3.5);
    cx.stroke();
  }
}

/* ---------- film grain + cinematic grade ---------- */
let grainCv=null;
function drawGritGrade(){
  // NOTE: the old 'saturation' desaturate pass was removed - that non-separable
  // blend mode is extremely slow and can hard-crash integrated GPUs on Windows
  // (Surface). The cool-shadow + grain passes below give most of the look.
  // cool the shadows
  cx.globalCompositeOperation='soft-light';
  cx.globalAlpha=0.35; cx.fillStyle='#243642'; cx.fillRect(-20,-20,VW+40,VH+40);
  // film grain
  if(!grainCv){
    grainCv=document.createElement('canvas'); grainCv.width=192; grainCv.height=192;
    const g=grainCv.getContext('2d'), im=g.createImageData(192,192);
    for(let i=0;i<im.data.length;i+=4){ const v=110+Math.random()*90;
      im.data[i]=v; im.data[i+1]=v; im.data[i+2]=v; im.data[i+3]=255; }
    g.putImageData(im,0,0);
  }
  cx.globalCompositeOperation='overlay';
  cx.globalAlpha=0.07;
  const jx=(Math.floor(G.time*24)*53)%192, jy=(Math.floor(G.time*24)*97)%192;
  const pat=cx.createPattern(grainCv,'repeat');
  cx.save(); cx.translate(-jx,-jy);
  cx.fillStyle=pat; cx.fillRect(0,0,VW+192,VH+192);
  cx.restore();
  cx.globalCompositeOperation='source-over'; cx.globalAlpha=1;
}

