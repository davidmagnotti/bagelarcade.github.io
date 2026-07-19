/* =====================================================================
   PROCEDURAL ART - every sprite drawn in code
   ===================================================================== */
function makeCanvas(w,h,fn){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d'); fn(g,w,h); return c;
}
function diamond(g,cxx,cyy,w,h){ g.beginPath();
  g.moveTo(cxx,cyy-h/2); g.lineTo(cxx+w/2,cyy); g.lineTo(cxx,cyy+h/2); g.lineTo(cxx-w/2,cyy); g.closePath(); }

const PAL = {
  deep:'#1e4066', deep2:'#1a3a5e', shallow:'#39708f', shallow2:'#427a99',
  sand:'#c8b482', sand2:'#bda873', grass:'#5b8544', grass2:'#527b3c', grassHi:'#688f4b',
  forest:'#3e6030', forest2:'#38592b', ruin:'#6f6a63', ruin2:'#66615a',
  path:'#9a7d51', path2:'#8f7348', soil:'#61411f', soil2:'#573a1c', plank:'#7d5834', plank2:'#71502e'
};

const TILE_SPR = {}; // [tileType][variant]
const FRINGE={};
function buildFringes(){
  const defs={1:{c:PAL.sand,c2:PAL.sand2}, 2:{c:PAL.path,c2:PAL.path2},
              3:{c:PAL.grass,c2:PAL.grassHi,tuft:true}, 4:{c:PAL.forest,c2:PAL.forest2,tuft:true}};
  // diamond corners in local 64x32 space: T(32,0) R(64,16) B(32,32) L(0,16)
  const edges=[[[32,0],[64,16]], [[64,16],[32,32]], [[32,32],[0,16]], [[0,16],[32,0]]]; // 0:TR 1:RB 2:BL 3:LT
  for(const cls in defs){
    FRINGE[cls]=[];
    const D=defs[cls];
    for(let di=0;di<4;di++){
      FRINGE[cls].push(makeCanvas(TW,TH,(g)=>{
        const r=mulberry32(500+cls*13+di*7);
        g.save(); diamond(g,TW/2,TH/2,TW,TH); g.clip();
        const [p1,p2]=edges[di];
        const cxm=32, cym=16;
        // wavy band polygon along the edge, bleeding inward
        const N=7, outer=[], inner=[];
        for(let i=0;i<=N;i++){
          const t=i/N;
          const ox=p1[0]+(p2[0]-p1[0])*t, oy=p1[1]+(p2[1]-p1[1])*t;
          outer.push([ox,oy]);
          const depth=(3.5+r()*5)/18;
          inner.push([ox+(cxm-ox)*depth, oy+(cym-oy)*depth]);
        }
        g.beginPath(); g.moveTo(outer[0][0],outer[0][1]);
        for(const p of outer) g.lineTo(p[0],p[1]);
        for(let i=N;i>=0;i--) g.lineTo(inner[i][0],inner[i][1]);
        g.closePath();
        g.fillStyle=D.c; g.fill();
        // texture inside the band
        g.save(); g.clip();
        for(let i=0;i<10;i++){
          const t=r(), ox=p1[0]+(p2[0]-p1[0])*t, oy=p1[1]+(p2[1]-p1[1])*t;
          g.fillStyle= r()<0.5? D.c2 : 'rgba(0,0,0,0.08)';
          g.fillRect(ox+(cxm-ox)*r()*0.25, oy+(cym-oy)*r()*0.25, 2+r()*2, 1.4);
        }
        g.restore();
        // grass/forest: blades poking over the seam
        if(D.tuft){
          g.strokeStyle=D.c2; g.lineWidth=1.2;
          for(let i=0;i<6;i++){
            const t=0.1+r()*0.8;
            const ox=p1[0]+(p2[0]-p1[0])*t, oy=p1[1]+(p2[1]-p1[1])*t;
            const ix=ox+(cxm-ox)*0.3, iy=oy+(cym-oy)*0.3;
            g.beginPath(); g.moveTo(ix,iy);
            g.lineTo(ix+(r()-0.5)*3, iy-3-r()*3); g.stroke();
          }
        }
        // soft inner shade for depth
        g.strokeStyle='rgba(0,0,0,0.10)'; g.lineWidth=1;
        g.beginPath(); g.moveTo(inner[0][0],inner[0][1]);
        for(const p of inner) g.lineTo(p[0],p[1]); g.stroke();
        g.restore();
      }));
    }
  }
}
function terrainCls(t){
  return (t===T.DEEP||t===T.SHALLOW)?0 : t===T.SAND?1 : t===T.GRASS?3 : t===T.FOREST?4 : 2;
}
function buildTiles(){
  const specs = {
    [T.DEEP]:[PAL.deep,PAL.deep2], [T.SHALLOW]:[PAL.shallow,PAL.shallow2],
    [T.SAND]:[PAL.sand,PAL.sand2], [T.GRASS]:[PAL.grass,PAL.grass2],
    [T.FOREST]:[PAL.forest,PAL.forest2], [T.RUIN]:[PAL.ruin,PAL.ruin2],
    [T.PATH]:[PAL.path,PAL.path2], [T.SOIL]:[PAL.soil,PAL.soil2], [T.PLANK]:[PAL.plank,PAL.plank2]
  };
  for(const t in specs){
    TILE_SPR[t]=[];
    for(let v=0;v<4;v++){
      TILE_SPR[t].push(makeCanvas(TW,TH+8,(g)=>{
        const [c1,c2]=specs[t];
        diamond(g,TW/2,TH/2,TW,TH); g.fillStyle = (v%2)?c1:c2; g.fill();
        // gritty texture: mottled blotches + dense flecks
        const r=mulberry32(t*97+v*13+5);
        g.save(); diamond(g,TW/2,TH/2,TW,TH); g.clip();
        for(let i=0;i<3;i++){ // uneven mottling
          const px=r()*TW, py=r()*TH, pr=5+r()*9;
          g.fillStyle= r()<0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.04)';
          g.beginPath(); g.ellipse(px,py,pr,pr*0.5,0,0,TAU); g.fill();
        }
        for(let i=0;i<24;i++){
          const px=r()*TW, py=r()*TH;
          g.fillStyle= r()<0.55 ? 'rgba(0,0,0,'+(0.05+r()*0.07)+')' : 'rgba(255,255,255,'+(0.03+r()*0.05)+')';
          g.fillRect(px,py, 1+r()*3, 1+r()*1.5);
        }
        if(+t===T.GRASS||+t===T.FOREST){ // mixed live + dead grass tufts
          g.lineWidth=1;
          for(let i=0;i<6;i++){ const px=8+r()*(TW-16), py=5+r()*(TH-10);
            g.strokeStyle= r()<0.35 ? 'rgba(170,150,90,0.30)' : 'rgba(255,255,255,0.09)';
            g.beginPath(); g.moveTo(px,py); g.lineTo(px+(r()<0.5?1:-1),py-3-r()*3); g.stroke(); }
        }
        if(+t===T.SOIL){ g.strokeStyle='rgba(0,0,0,0.22)';
          for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(14,10+i*5); g.lineTo(TW-14,10+i*5); g.stroke(); } }
        if(+t===T.PLANK){ g.strokeStyle='rgba(40,22,8,0.55)'; g.lineWidth=2;
          g.beginPath(); g.moveTo(TW*0.25,TH*0.25); g.lineTo(TW*0.75,TH*0.75);
          g.moveTo(TW*0.5,TH*0.15); g.lineTo(TW*0.95,TH*0.55); g.stroke();
          g.strokeStyle='rgba(20,10,4,0.35)'; g.lineWidth=1; // nail-worn grain
          for(let i=0;i<3;i++){ const px=10+r()*(TW-20), py=6+r()*(TH-12);
            g.beginPath(); g.moveTo(px,py); g.lineTo(px+6+r()*6,py+3+r()*3); g.stroke(); } }
        if(+t===T.RUIN){ // jagged cracks + old scorch
          g.strokeStyle='rgba(0,0,0,0.30)'; g.lineWidth=1.2;
          for(let c=0;c<2;c++){ let px=8+r()*(TW-16), py=5+r()*(TH-10);
            g.beginPath(); g.moveTo(px,py);
            for(let sgm=0;sgm<3;sgm++){ px+=3+r()*7; py+=(r()-0.5)*8; g.lineTo(px,py); }
            g.stroke(); }
          if(r()<0.5){ g.fillStyle='rgba(20,18,14,0.20)';
            g.beginPath(); g.ellipse(TW*0.3+r()*TW*0.4,TH*0.3+r()*TH*0.4,6+r()*5,3+r()*2,0,0,TAU); g.fill(); }
        }
        if(+t===T.PATH){ // scattered pebbles
          for(let i=0;i<5;i++){ const px=8+r()*(TW-16), py=5+r()*(TH-10);
            g.fillStyle='rgba(70,55,35,0.45)'; g.beginPath(); g.ellipse(px,py,1.6+r()*1.4,1+r(),0,0,TAU); g.fill();
            g.fillStyle='rgba(255,255,255,0.08)'; g.fillRect(px-1,py-1.4,1.4,0.8); }
        }
        g.restore();
        // edge shading (fake depth on south edges)
        g.strokeStyle='rgba(0,0,0,0.16)'; g.lineWidth=1;
        g.beginPath(); g.moveTo(TW/2,TH); g.lineTo(TW,TH/2); g.stroke();
      }));
    }
  }
}

/* ---- object sprites (pre-rendered) ---- */
const SPR = {};
function buildSprites(){
  // trees x3 variants
  SPR.tree = [];
  const canopies = [['#3e7c47','#4f9457','#2f6338'],['#4c8a3f','#5da24c','#3a6f31'],['#7c9c46','#8fb054','#647f37']];
  for(let v=0;v<3;v++){
    SPR.tree.push(makeCanvas(84,104,(g,w,h)=>{
      const [c1,c2,c3]=canopies[v];
      const r=mulberry32(90+v*7);
      // trunk with root flare and bark
      g.fillStyle='#5c3d22';
      g.beginPath();
      g.moveTo(w/2-7,h-10); g.quadraticCurveTo(w/2-5,h-24,w/2-5,h-38);
      g.lineTo(w/2+5,h-38); g.quadraticCurveTo(w/2+5,h-24,w/2+7,h-10);
      g.quadraticCurveTo(w/2+12,h-8,w/2+13,h-7); g.lineTo(w/2-13,h-7);
      g.quadraticCurveTo(w/2-12,h-8,w/2-7,h-10);
      g.closePath(); g.fill();
      g.fillStyle='#7a5230'; g.fillRect(w/2-5,h-38,4,30);
      g.strokeStyle='rgba(30,18,8,0.5)'; g.lineWidth=1;
      g.beginPath(); g.moveTo(w/2-1,h-12); g.lineTo(w/2-2,h-34);
      g.moveTo(w/2+3,h-12); g.lineTo(w/2+3,h-30); g.stroke();
      // a visible branch or two
      g.strokeStyle='#5c3d22'; g.lineWidth=4; g.lineCap='round';
      g.beginPath(); g.moveTo(w/2,h-36); g.quadraticCurveTo(w/2-12,h-44,w/2-18,h-50);
      g.moveTo(w/2,h-40); g.quadraticCurveTo(w/2+10,h-48,w/2+16,h-54); g.stroke();
      // canopy: gradient-lit clusters, dark to light, dappled leaves
      const blobs = v===2 ? [[0,-52,26],[-16,-40,20],[16,-42,21],[0,-32,24]]
                          : [[0,-58,24],[-18,-44,19],[18,-46,20],[-6,-34,22],[10,-32,20]];
      for(const [bx,by,br] of blobs){ g.fillStyle=c3;
        g.beginPath(); g.arc(w/2+bx,h+by+4,br,0,TAU); g.fill(); }
      for(const [bx,by,br] of blobs){
        const gr=g.createRadialGradient(w/2+bx-br*0.35,h+by-br*0.4,br*0.15,w/2+bx,h+by,br);
        gr.addColorStop(0,c2); gr.addColorStop(0.55,c1); gr.addColorStop(1,c3);
        g.fillStyle=gr; g.beginPath(); g.arc(w/2+bx,h+by,br,0,TAU); g.fill();
      }
      // leaf dapple
      for(let i=0;i<60;i++){
        const b=blobs[(i*7)%blobs.length];
        const a=r()*TAU, d=r()*b[2]*0.92;
        const px=w/2+b[0]+Math.cos(a)*d, py=h+b[1]+Math.sin(a)*d*0.9;
        g.fillStyle= r()<0.55? 'rgba(255,255,235,'+(0.05+r()*0.10)+')' : 'rgba(10,25,10,'+(0.08+r()*0.10)+')';
        g.beginPath(); g.ellipse(px,py,1.6+r()*1.6,1+r(), r()*TAU,0,TAU); g.fill();
      }
      // sky-side crown highlight + soft under-shadow
      g.fillStyle='rgba(255,250,220,0.10)';
      g.beginPath(); g.arc(w/2-8,h-62,18,Math.PI*1.0,Math.PI*1.9); g.fill();
      g.fillStyle='rgba(10,15,8,0.16)';
      g.beginPath(); g.ellipse(w/2,h-30,26,10,0,0,Math.PI); g.fill();
    }));
  }
  SPR.stump = makeCanvas(84,104,(g,w,h)=>{
    g.fillStyle='#6e4a2b'; g.beginPath(); g.ellipse(w/2,h-16,13,7,0,0,TAU); g.fill();
    g.fillStyle='#8a6238'; g.fillRect(w/2-13,h-26,26,10);
    g.fillStyle='#c9a06a'; g.beginPath(); g.ellipse(w/2,h-26,13,7,0,0,TAU); g.fill();
    g.strokeStyle='#a57e4d'; g.lineWidth=1.5;
    g.beginPath(); g.ellipse(w/2,h-26,8,4,0,0,TAU); g.stroke();
    g.beginPath(); g.ellipse(w/2,h-26,4,2,0,0,TAU); g.stroke();
  });
  // rock
  SPR.rock = [];
  for(let v=0;v<3;v++){
    SPR.rock.push(makeCanvas(70,56,(g,w,h)=>{
      const r=mulberry32(40+v);
      const jig=(px,py)=>[px+(r()*4-2),py+(r()*4-2)];
      // silhouette
      const outline=[[10,h-14],[14,h-30],[26,h-42],[44,h-40],[58,h-26],[60,h-14]].map(p=>jig(p[0],p[1]));
      g.beginPath(); g.moveTo(outline[0][0],outline[0][1]);
      for(const p of outline) g.lineTo(p[0],p[1]);
      g.closePath();
      g.fillStyle='#55555c'; g.fill();
      g.strokeStyle='rgba(15,14,16,0.6)'; g.lineWidth=1.4; g.stroke();
      // faceted planes: shadowed, mid, sun-lit
      g.fillStyle='#6b6b72';
      g.beginPath(); g.moveTo(34,h-40); g.lineTo(58,h-26); g.lineTo(60,h-14); g.lineTo(38,h-14); g.closePath(); g.fill();
      const lit=g.createLinearGradient(12,h-42,34,h-16);
      lit.addColorStop(0,'#b6b6bd'); lit.addColorStop(0.6,'#8f8f96'); lit.addColorStop(1,'#77777e');
      g.fillStyle=lit;
      g.beginPath(); g.moveTo(14,h-30); g.lineTo(26,h-42); g.lineTo(38,h-38); g.lineTo(34,h-16); g.lineTo(12,h-15); g.closePath(); g.fill();
      // top sparkle facet
      g.fillStyle='#cfd0d8';
      g.beginPath(); g.moveTo(24,h-38); g.lineTo(32,h-41); g.lineTo(35,h-33); g.lineTo(26,h-31); g.closePath(); g.fill();
      // facet seams + cracks
      g.strokeStyle='rgba(20,18,22,0.5)'; g.lineWidth=1.1;
      g.beginPath(); g.moveTo(34,h-40); g.lineTo(35,h-15);
      g.moveTo(26,h-31); g.lineTo(22,h-16); g.stroke();
      // moss at the base
      g.fillStyle='rgba(78,110,52,0.7)';
      for(let i=0;i<4;i++){ g.beginPath();
        g.ellipse(14+r()*38,h-13-r()*4,3+r()*4,1.6+r()*1.6,0,0,TAU); g.fill(); }
      // ore glints
      g.fillStyle='#e8eef6';
      for(let i=0;i<3;i++){ const px=18+r()*28, py=h-36+r()*14;
        g.fillRect(px,py,2.6,2.6); g.fillStyle='rgba(255,255,255,0.9)'; g.fillRect(px,py,1.2,1.2); g.fillStyle='#e8eef6'; }
    }));
  }
  SPR.rockLow = makeCanvas(70,56,(g,w,h)=>{
    g.fillStyle='#7c7c82'; g.beginPath(); g.ellipse(w/2,h-14,16,8,0,0,TAU); g.fill();
    g.fillStyle='#93939a'; g.beginPath(); g.ellipse(w/2-4,h-16,9,5,0,0,TAU); g.fill();
  });
  // mushroom (bluecap)
  SPR.mushroom = makeCanvas(40,44,(g,w,h)=>{
    g.fillStyle='#e8e2d2'; g.fillRect(w/2-3,h-18,6,12);
    const grad=g.createRadialGradient(w/2,h-22,2,w/2,h-20,14);
    grad.addColorStop(0,'#9fd8ff'); grad.addColorStop(1,'#3f7fd6');
    g.fillStyle=grad; g.beginPath(); g.ellipse(w/2,h-20,13,9,0,Math.PI,0); g.fill();
    g.fillStyle='rgba(255,255,255,0.85)';
    g.beginPath(); g.arc(w/2-5,h-24,2,0,TAU); g.arc(w/2+4,h-22,1.6,0,TAU); g.fill();
  });
  // buildings
  SPR.house = makeCanvas(150,140,(g,w,h)=> drawHouse(g,w,h,'#c9b28a','#a3502f','#7c3d22'));
  SPR.house2= makeCanvas(150,140,(g,w,h)=> drawHouse(g,w,h,'#bcae95','#5d7a97','#48607a'));
  SPR.forge = makeCanvas(150,146,(g,w,h)=>{ drawHouse(g,w,h,'#9c8f7c','#5a5a60','#464650');
    // anvil out front
    g.fillStyle='#43434a'; g.fillRect(w/2-40,h-26,20,7); g.fillRect(w/2-34,h-19,8,7);
    g.fillStyle='#606069'; g.fillRect(w/2-42,h-29,24,5);
  });
  SPR.barn = makeCanvas(180,150,(g,w,h)=> drawHouse(g,w,h,'#b0563a','#8c3f2a','#6d3120',1.25,false));
  SPR.tower = makeCanvas(120,210,(g,w,h)=>{
    g.fillStyle='#8d8296'; g.fillRect(w/2-26,60,52,h-84);
    g.fillStyle='#7a7086'; g.fillRect(w/2-26,60,16,h-84);
    g.fillStyle='#a79cb5'; g.fillRect(w/2+8,60,18,h-84);
    // stones
    g.strokeStyle='rgba(0,0,0,0.14)';
    for(let yy=70; yy<h-30; yy+=16){ g.beginPath(); g.moveTo(w/2-26,yy); g.lineTo(w/2+26,yy); g.stroke(); }
    // windows
    g.fillStyle='#ffd76a'; g.fillRect(w/2-5,92,10,14); g.fillRect(w/2-5,136,10,14);
    // conical roof
    g.fillStyle='#4a5d9c'; g.beginPath(); g.moveTo(w/2-34,64); g.lineTo(w/2,6); g.lineTo(w/2+34,64); g.closePath(); g.fill();
    g.fillStyle='#5a6fb5'; g.beginPath(); g.moveTo(w/2-34,64); g.lineTo(w/2,6); g.lineTo(w/2,64); g.closePath(); g.fill();
    g.fillStyle='#ffd76a'; g.beginPath(); g.arc(w/2,4,4,0,TAU); g.fill();
    // door
    g.fillStyle='#4a3218'; g.beginPath(); g.arc(w/2,h-24,12,Math.PI,0); g.fill(); g.fillRect(w/2-12,h-24,24,14);
  });
  SPR.well = makeCanvas(70,80,(g,w,h)=>{
    g.fillStyle='#7d7d85'; g.beginPath(); g.ellipse(w/2,h-18,22,12,0,0,TAU); g.fill();
    g.fillStyle='#2b4a63'; g.beginPath(); g.ellipse(w/2,h-20,16,8,0,0,TAU); g.fill();
    g.fillStyle='#93939a'; g.beginPath(); g.ellipse(w/2,h-22,22,12,0,Math.PI,0); g.fill();
    g.fillStyle='#6e4a2b'; g.fillRect(w/2-20,h-52,5,32); g.fillRect(w/2+15,h-52,5,32);
    g.fillStyle='#a3502f'; g.beginPath(); g.moveTo(w/2-28,h-48); g.lineTo(w/2,h-68); g.lineTo(w/2+28,h-48); g.closePath(); g.fill();
    g.strokeStyle='#4a3218'; g.lineWidth=2; g.beginPath(); g.moveTo(w/2,h-46); g.lineTo(w/2,h-32); g.stroke();
    g.fillStyle='#8a6238'; g.fillRect(w/2-4,h-34,8,7);
  });
  SPR.boat = makeCanvas(90,60,(g,w,h)=>{
    g.fillStyle='#7c4f2c'; g.beginPath(); g.moveTo(8,h-28); g.quadraticCurveTo(w/2,h-4,w-8,h-28); g.lineTo(w-16,h-38); g.quadraticCurveTo(w/2,h-24,16,h-38); g.closePath(); g.fill();
    g.fillStyle='#95633a'; g.beginPath(); g.moveTo(16,h-38); g.quadraticCurveTo(w/2,h-24,w-16,h-38); g.lineTo(w-20,h-42); g.quadraticCurveTo(w/2,h-30,20,h-42); g.closePath(); g.fill();
    g.strokeStyle='#5c3d22'; g.lineWidth=2; g.beginPath(); g.moveTo(w/2-4,h-40); g.lineTo(w/2+10,h-56); g.stroke();
  });
  SPR.lamp = makeCanvas(30,86,(g,w,h)=>{
    g.fillStyle='#3c2e1d'; g.fillRect(w/2-3,26,6,h-36);
    g.fillStyle='#2b2115'; g.fillRect(w/2-3,26,2,h-36);
    g.fillStyle='#3c2e1d'; g.fillRect(w/2-8,18,16,10);
    g.fillStyle='#ffd76a'; g.fillRect(w/2-5,20,10,7);
    g.fillStyle='#3c2e1d'; g.beginPath(); g.moveTo(w/2-9,18); g.lineTo(w/2,10); g.lineTo(w/2+9,18); g.closePath(); g.fill();
  });
  SPR.pillar = makeCanvas(46,92,(g,w,h)=>{
    g.fillStyle='#9a968e'; g.fillRect(w/2-9,20,18,h-36);
    g.fillStyle='#84807a'; g.fillRect(w/2-9,20,6,h-36);
    g.fillStyle='#aba79f'; g.fillRect(w/2-12,12,24,10); g.fillRect(w/2-12,h-18,24,8);
    g.strokeStyle='rgba(0,0,0,0.15)';
    for(let yy=26; yy<h-22; yy+=12){ g.beginPath(); g.moveTo(w/2-9,yy); g.lineTo(w/2+9,yy); g.stroke(); }
  });
  SPR.pillarBroken = makeCanvas(46,92,(g,w,h)=>{
    g.fillStyle='#9a968e'; g.fillRect(w/2-9,h-52,18,36);
    g.fillStyle='#84807a'; g.fillRect(w/2-9,h-52,6,36);
    g.beginPath(); g.moveTo(w/2-9,h-52); g.lineTo(w/2-2,h-62); g.lineTo(w/2+4,h-50); g.lineTo(w/2+9,h-56); g.lineTo(w/2+9,h-46); g.lineTo(w/2-9,h-46); g.closePath();
    g.fillStyle='#9a968e'; g.fill();
    g.fillStyle='#aba79f'; g.fillRect(w/2-12,h-18,24,8);
  });
  SPR.crypt = makeCanvas(140,120,(g,w,h)=>{
    g.fillStyle='#6f6b64'; g.fillRect(w/2-56,h-64,112,44);
    g.fillStyle='#5d5952'; g.fillRect(w/2-56,h-64,36,44);
    g.fillStyle='#161219'; g.beginPath(); g.arc(w/2,h-30,20,Math.PI,0); g.fill(); g.fillRect(w/2-20,h-30,40,10);
    g.fillStyle='#84807a'; g.fillRect(w/2-64,h-72,128,12);
    g.fillStyle='#9a968e'; g.beginPath(); g.moveTo(w/2-64,h-72); g.lineTo(w/2,h-104); g.lineTo(w/2+64,h-72); g.closePath(); g.fill();
    g.fillStyle='rgba(120,220,160,0.5)'; g.beginPath(); g.arc(w/2,h-88,5,0,TAU); g.fill();
  });
}
function drawHouse(g,w,h,wall,roof,roofDk,scale=1,chim=true){
  const bw=96*scale, bh=52*scale, bx=w/2, byBase=h-10;
  // iso-ish box
  g.fillStyle=wall; g.beginPath();
  g.moveTo(bx-bw/2,byBase-bh); g.lineTo(bx,byBase-bh+18*scale); g.lineTo(bx,byBase); g.lineTo(bx-bw/2,byBase-18*scale); g.closePath(); g.fill();
  const wall2 = shade(wall,-24);
  g.fillStyle=wall2; g.beginPath();
  g.moveTo(bx+bw/2,byBase-bh); g.lineTo(bx,byBase-bh+18*scale); g.lineTo(bx,byBase); g.lineTo(bx+bw/2,byBase-18*scale); g.closePath(); g.fill();
  // door & window sit ON the slanted wall planes, bases on the ground line
  const dk=18/(bw/2); // wall slope
  const gyL=(x)=> byBase-18*scale + (x-(bx-bw/2))*dk;   // left-face ground line
  const gyR=(x)=> byBase - (x-bx)*dk;                    // right-face ground line
  // - door (left face) -
  const dw=18*scale, dh=27*scale, dx0=bx-bw/4-dw/2;
  g.fillStyle='#3c2a14';
  g.beginPath();
  g.moveTo(dx0, gyL(dx0)-dh);
  g.quadraticCurveTo(dx0+dw/2, gyL(dx0+dw/2)-dh-7*scale, dx0+dw, gyL(dx0+dw)-dh);
  g.lineTo(dx0+dw, gyL(dx0+dw));
  g.lineTo(dx0, gyL(dx0));
  g.closePath(); g.fill();
  g.strokeStyle='#241a0e'; g.lineWidth=2; g.stroke();
  g.strokeStyle='rgba(0,0,0,0.28)'; g.lineWidth=1.5;   // plank seams
  g.beginPath();
  g.moveTo(dx0+6*scale, gyL(dx0+6*scale)-dh-2*scale); g.lineTo(dx0+6*scale, gyL(dx0+6*scale));
  g.moveTo(dx0+12*scale, gyL(dx0+12*scale)-dh-4*scale); g.lineTo(dx0+12*scale, gyL(dx0+12*scale));
  g.stroke();
  g.fillStyle='#c9a24e';                                // handle
  g.beginPath(); g.arc(dx0+dw-4*scale, gyL(dx0+dw-4*scale)-dh*0.45, 1.7*scale, 0, TAU); g.fill();
  g.fillStyle='rgba(0,0,0,0.22)';                       // threshold shadow
  g.beginPath();
  g.moveTo(dx0-1, gyL(dx0)); g.lineTo(dx0+dw+1, gyL(dx0+dw));
  g.lineTo(dx0+dw+1, gyL(dx0+dw)+3*scale); g.lineTo(dx0-1, gyL(dx0)+3*scale);
  g.closePath(); g.fill();
  // - window (right face) -
  const ww=16*scale, wh=13*scale, wx0=bx+bw/4-ww/2, wel=14*scale;
  g.fillStyle='#ffd76a';
  g.beginPath();
  g.moveTo(wx0, gyR(wx0)-wel-wh);
  g.lineTo(wx0+ww, gyR(wx0+ww)-wel-wh);
  g.lineTo(wx0+ww, gyR(wx0+ww)-wel);
  g.lineTo(wx0, gyR(wx0)-wel);
  g.closePath(); g.fill();
  g.strokeStyle='#4a3218'; g.lineWidth=2; g.stroke();
  g.strokeStyle='rgba(74,50,24,0.8)'; g.lineWidth=1.5;  // mullion cross
  g.beginPath();
  g.moveTo(wx0+ww/2, gyR(wx0+ww/2)-wel-wh); g.lineTo(wx0+ww/2, gyR(wx0+ww/2)-wel);
  g.moveTo(wx0, gyR(wx0)-wel-wh/2); g.lineTo(wx0+ww, gyR(wx0+ww)-wel-wh/2);
  g.stroke();
  // roof
  g.fillStyle=roof; g.beginPath();
  g.moveTo(bx-bw/2-8*scale, byBase-bh-2); g.lineTo(bx-8*scale, byBase-bh-34*scale); g.lineTo(bx+2, byBase-bh+16*scale); g.lineTo(bx-bw/2-8*scale+ (bw/2), byBase-bh+16*scale);
  g.closePath();
  g.beginPath(); // simpler: two roof planes
  g.moveTo(bx-bw/2-10*scale,byBase-bh); g.lineTo(bx,byBase-bh-30*scale); g.lineTo(bx,byBase-bh+18*scale); g.closePath(); g.fill();
  g.fillStyle=roofDk; g.beginPath();
  g.moveTo(bx+bw/2+10*scale,byBase-bh); g.lineTo(bx,byBase-bh-30*scale); g.lineTo(bx,byBase-bh+18*scale); g.closePath(); g.fill();
  g.strokeStyle=shade(roofDk,-20); g.lineWidth=2;
  g.beginPath(); g.moveTo(bx,byBase-bh-30*scale); g.lineTo(bx,byBase-bh+18*scale); g.stroke();
  // ridge cap catches the light
  g.strokeStyle='rgba(255,240,210,0.28)'; g.lineWidth=1.6;
  g.beginPath(); g.moveTo(bx-1.5,byBase-bh-29*scale); g.lineTo(bx-1.5,byBase-bh+16*scale); g.stroke();
  // shingle courses on both roof planes
  const apX=bx, apY=byBase-bh-30*scale, frX=bx, frY=byBase-bh+18*scale;
  const eL={x:bx-bw/2-10*scale,y:byBase-bh}, eR={x:bx+bw/2+10*scale,y:byBase-bh};
  g.lineWidth=1.3;
  for(const t of [0.3,0.55,0.78]){
    g.strokeStyle='rgba(0,0,0,0.16)';
    g.beginPath();
    g.moveTo(eL.x+(apX-eL.x)*t, eL.y+(apY-eL.y)*t);
    g.lineTo(frX, frY+(apY-frY)*t);
    g.moveTo(eR.x+(apX-eR.x)*t, eR.y+(apY-eR.y)*t);
    g.lineTo(frX, frY+(apY-frY)*t);
    g.stroke();
  }
  // eave shadow grounds the roof onto the walls
  const topL=(x)=> byBase-bh + (x-(bx-bw/2))*dk;
  const topR=(x)=> byBase-bh+18*scale - (x-bx)*dk;
  g.fillStyle='rgba(0,0,0,0.18)';
  g.beginPath();
  g.moveTo(bx-bw/2,byBase-bh); g.lineTo(bx,byBase-bh+18*scale);
  g.lineTo(bx,byBase-bh+24*scale); g.lineTo(bx-bw/2,byBase-bh+6*scale);
  g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(bx+bw/2,byBase-bh); g.lineTo(bx,byBase-bh+18*scale);
  g.lineTo(bx,byBase-bh+24*scale); g.lineTo(bx+bw/2,byBase-bh+6*scale);
  g.closePath(); g.fill();
  // timber frame: studs + mid-rail following the wall shear
  g.strokeStyle='rgba(58,40,22,0.5)'; g.lineWidth=2*scale;
  g.beginPath();
  for(const fx of [0.18,0.78]){
    const x=bx-bw/2+bw/2*fx;
    g.moveTo(x, topL(x)+3*scale); g.lineTo(x, gyL(x)-1);
  }
  for(const fx of [0.5]){
    const x=bx+bw/2*fx;
    g.moveTo(x, topR(x)+3*scale); g.lineTo(x, gyR(x)-1);
  }
  g.moveTo(bx-bw/2, byBase-bh*0.52); g.lineTo(bx, byBase-bh*0.52+18*scale);
  g.stroke();
  // stone foundation course along both wall bases
  g.fillStyle='#7d7368';
  g.beginPath();
  g.moveTo(bx-bw/2, gyL(bx-bw/2)-5*scale); g.lineTo(bx, gyL(bx)-5*scale);
  g.lineTo(bx, gyL(bx)); g.lineTo(bx-bw/2, gyL(bx-bw/2)); g.closePath(); g.fill();
  g.fillStyle='#6b6258';
  g.beginPath();
  g.moveTo(bx, gyR(bx)-5*scale); g.lineTo(bx+bw/2, gyR(bx+bw/2)-5*scale);
  g.lineTo(bx+bw/2, gyR(bx+bw/2)); g.lineTo(bx, gyR(bx)); g.closePath(); g.fill();
  g.strokeStyle='rgba(0,0,0,0.25)'; g.lineWidth=1;
  g.beginPath();
  for(const fx of [0.3,0.62]){
    let x=bx-bw/2+bw/2*fx; g.moveTo(x,gyL(x)-5*scale); g.lineTo(x,gyL(x));
    x=bx+bw/2*fx; g.moveTo(x,gyR(x)-5*scale); g.lineTo(x,gyR(x));
  }
  g.stroke();
  // chimney, seated THROUGH the right roof plane
  if(chim){
    const ct=0.45, chX=bx+(bw/2+10*scale)*ct, roofY=apY+((byBase-bh)-apY)*ct;
    g.fillStyle='#8b8378';
    g.fillRect(chX-6*scale, roofY-24*scale, 12*scale, 30*scale);
    g.fillStyle='#756d63';
    g.fillRect(chX+1*scale, roofY-24*scale, 5*scale, 30*scale);
    g.fillStyle='#9a9287'; // cap
    g.fillRect(chX-8*scale, roofY-27*scale, 16*scale, 4.5*scale);
    g.fillStyle='#241a12';
    g.fillRect(chX-4*scale, roofY-25.5*scale, 8*scale, 2.5*scale);
    g.strokeStyle='rgba(0,0,0,0.4)'; g.lineWidth=1.5; // collar where it meets the shingles
    g.beginPath();
    g.moveTo(chX-6*scale, roofY+3*scale); g.lineTo(chX+6*scale, roofY+7*scale);
    g.stroke();
  }
}
function shade(hex,amt){
  const n=parseInt(hex.slice(1),16);
  let r=(n>>16)+amt, g=((n>>8)&255)+amt, b=(n&255)+amt;
  r=clamp(r,0,255); g=clamp(g,0,255); b=clamp(b,0,255);
  return '#'+((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
}
/* ---- characters: drawn live for animation ---- */
function drawShadowAt(g,sx,sy,r){
  const sg=g.createRadialGradient(sx,sy,r*0.15,sx,sy,r);
  sg.addColorStop(0,'rgba(0,0,0,0.34)'); sg.addColorStop(0.7,'rgba(0,0,0,0.20)'); sg.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=sg;
  g.save(); g.translate(sx,sy); g.scale(1,0.45);
  g.beginPath(); g.arc(0,0,r*1.25,0,TAU); g.fill();
  g.restore();
}

function dirOct(d){
  // screen-space facing octant: 0=E, 1=SE, 2=S(front), 3=SW, ±4=W, -1=NE, -2=N(back), -3=NW
  if(!d) return 1;
  return Math.round(Math.atan2(d.x+d.y, d.x-d.y)/(Math.PI/4));
}
function drawHumanoid(g,sx,sy,o){
  try{ if(typeof g.filter==='string') g.filter='saturate(1.22) brightness(1.04)'; }catch(e){}
  /* =====================================================================
     MASCOT FIGURE - Mario-64 / Wind-Waker inspired redesign.
     Head is half the character. Big eyes, big boots, bouncy gait.
     Same option contract as the old renderer: every caller just works.
     ===================================================================== */
  const s=(o.size||1);
  const step=o.step||0, walking=Math.abs(step)>0.0001 && o.step!==undefined && o.step!==0;
  const ph=o.ph||0;
  const hc=o.hair||'#3a2a1a', skin=o.skin||'#d8a97a';
  const shirt=o.robe? o.robe : (o.shirt||'#7a5f43');
  const pants=o.pants||'#4a3d30';
  const OUT='rgba(24,16,10,0.85)';
  // facing
  const dx=o.dir?o.dir.x:0.7, dy=o.dir?o.dir.y:0.7;
  const scrX=dx-dy, scrY=(dx+dy)*0.5;
  const away=scrY<-0.15;
  const profile=!away && Math.abs(scrX)>1.05 && Math.abs(scrY)<0.42;
  const flip=scrX<0?-1:1;
  // gait
  const sw1=Math.sin(step), sw2=Math.sin(step*2);
  const bounce=walking? Math.abs(sw1)*2.2*s : (Math.sin(G.time*2.1+ph)*0.5+0.5)*0.9*s;
  const lean=walking? sw1*0.03 : 0;
  const hurtF=o.hurt?1:0;

  g.save();
  g.translate(sx,sy);
  if(hurtF){ g.translate(rnd(-1.2,1.2),0); }
  g.rotate(lean);
  g.scale(s,s);
  g.scale(1,0.93); // seen from the isometric camera above - slight vertical foreshorten
  // squash & stretch on the whole body - mascot bounce
  const sq=walking? 1+0.045*sw2 : 1;
  g.scale(1/Math.sqrt(sq), sq);

  const B=-bounce/s; // bounce offset in local units
  const stride=walking? sw1 : 0;
  g.fillStyle='rgba(10,6,3,0.20)'; // tight contact shadow under the boots
  g.beginPath(); g.ellipse(0,0.6,7.8,2.5,0,0,TAU); g.fill();

  if(o.quiver && !away){
    g.save(); g.translate(-7,-24+B); g.rotate(0.5);
    g.fillStyle='#5a3d24'; g.beginPath(); g.roundRect(-2.6,-2,5.2,12,2); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.3; g.stroke();
    g.strokeStyle='#c9b990'; g.lineWidth=1.3;
    g.beginPath(); g.moveTo(-1,-2); g.lineTo(-2.2,-6.5); g.moveTo(1.2,-2); g.lineTo(1.4,-7); g.stroke();
    g.fillStyle='#e05648';
    g.beginPath(); g.moveTo(-2.2,-6.5); g.lineTo(-3.6,-9); g.lineTo(-1,-8); g.closePath(); g.fill();
    g.restore();
  }

  /* ---------------- stubby legs & big boots ---------------- */
  const bootC='#5a3d28', bootD='#3e2a1c';
  if(!o.robe){
    for(const L of [[-4.1,1],[4.1,-1]]){
      const lx=L[0], sg=L[1];
      const la=stride*0.55*sg;
      const lift=Math.max(0, sg*stride)*2.2;
      g.save();
      g.translate(lx,-8.5+B*0.4); g.rotate(flip*la*(away?-1:1));
      g.fillStyle=pants;
      g.beginPath(); g.roundRect(-2.4,0,4.8,6.5,2.1); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1.3; g.stroke();
      // big boot
      const fs=walking? Math.max(0,-sg*stride)*0.12 : 0;
      g.translate(0,6.2-lift*0.3);
      g.scale(1+fs, 1-fs*0.6);
      const btg=g.createLinearGradient(0,-1.2,0,3.4);
      btg.addColorStop(0,shade(bootC,12)); btg.addColorStop(1,shade(bootC,-10));
      g.fillStyle=btg;
      g.lineWidth=1.7;
      g.beginPath(); g.roundRect(-3.6,-1.2,7.2,4.6,2.1); g.fill(); g.stroke();
      g.fillStyle='rgba(255,245,225,0.25)'; // gloss
      g.beginPath(); g.ellipse(-1.2,0,1.5,0.75,-0.3,0,TAU); g.fill();
      g.lineWidth=1.3;
      if(!away){
        g.fillStyle=bootD; // toe cap
        g.beginPath(); g.roundRect(flip>0?1.2:-3.4, -0.6, 2.2, 3.4, 1.2); g.fill(); g.stroke();
      }
      g.restore();
    }
  }

  /* ---------------- sausage arms with mitt hands ----------------
     Defined before the body so the rear view can tuck them BEHIND it:
     from behind you see shoulders and arm slivers, never mitts on the back. */
  const armY=-20.5+B*0.8;
  const drawArm=(side,ang,lift)=>{
    g.save();
    g.translate(side*8.2,armY+(lift||0));
    g.rotate(side*0.28 + ang);
    g.fillStyle=o.robe? o.robe : shirt;
    g.beginPath(); g.roundRect(-2.1,0,4.2,7.4,2.1); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.3; g.stroke();
    g.fillStyle=skin; // big mitt
    g.beginPath(); g.arc(0,8.6,3.0,0,TAU); g.fill(); g.stroke();
    g.beginPath(); g.arc(-side*2.1,7.8,1.15,0,TAU); g.fill(); g.stroke(); // thumb
    g.restore();
  };
  const armSwing=walking? sw1*0.5 : 0.05;
  const stowed = away && o.weapon;
  const claspIdle = away && !walking && !o.weapon && (o.stillT===undefined || o.stillT>0.25);
  if(away && !claspIdle){
    // rear view: draw arms now, under the body and head
    if(walking){
      drawArm(-1, 0.06*sw1, sw1*1.7);
      if(!o.weapon || stowed) drawArm(1, -0.06*sw1, -sw1*1.7);
    } else {
      drawArm(-1, 0.05);
      if(!o.weapon || stowed) drawArm(1, -0.05);
    }
  }

  /* ---------------- tiny round body ---------------- */
  if(o.robe){
    const hem=Math.sin(step||G.time*1.6)*1.2;
    const rg2=g.createLinearGradient(0,-27,0,0);
    rg2.addColorStop(0,shade(o.robe,10)); rg2.addColorStop(0.6,o.robe); rg2.addColorStop(1,shade(o.robe,-12));
    g.fillStyle=rg2;
    g.beginPath();
    g.moveTo(-7.5,-24+B);
    g.quadraticCurveTo(-11,-10, -9.5+hem,-0.5);
    g.lineTo(9.5+hem,-0.5);
    g.quadraticCurveTo(11,-10, 7.5,-24+B);
    g.quadraticCurveTo(0,-27+B, -7.5,-24+B);
    g.closePath(); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.9; g.stroke();
    if(o.trim){ g.strokeStyle=o.trim; g.lineWidth=1.6;
      g.beginPath(); g.moveTo(-9+hem,-2.4); g.lineTo(9+hem,-2.4); g.stroke(); }
    if(o.rune && !away){
      const pl=0.6+0.4*Math.sin(G.time*3+ph);
      g.fillStyle='rgba(127,212,255,'+(0.5*pl)+')';
      g.beginPath(); g.arc(0,-16+B,2.4,0,TAU); g.fill();
    }
  } else {
    const bg2=g.createLinearGradient(0,-26,0,-6);
    bg2.addColorStop(0,shade(shirt,11)); bg2.addColorStop(0.6,shirt); bg2.addColorStop(1,shade(shirt,-11));
    g.fillStyle=bg2;
    g.beginPath();
    g.moveTo(-8.2,-23.5+B);
    g.quadraticCurveTo(-10.4,-15.5, -8.6,-7.5);
    g.quadraticCurveTo(0,-5.2, 8.6,-7.5);
    g.quadraticCurveTo(10.4,-15.5, 8.2,-23.5+B);
    g.quadraticCurveTo(0,-26.5+B, -8.2,-23.5+B);
    g.closePath(); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.9; g.stroke();
    g.strokeStyle='rgba(255,240,208,0.30)'; g.lineWidth=1.5; // modern rim light
    g.beginPath(); g.arc(-2.6,-16.5+B,7.2,Math.PI*0.95,Math.PI*1.4); g.stroke();
    g.fillStyle=shade(shirt,-6); // tunic hem flares over the hips
    g.beginPath();
    g.moveTo(-8.6,-8.2); g.quadraticCurveTo(0,-5.8, 8.6,-8.2);
    g.lineTo(9.7,-4.4); g.quadraticCurveTo(0,-1.8, -9.7,-4.4);
    g.closePath(); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.5; g.stroke();
    if(!away){ // crew collar
      g.strokeStyle=shade(shirt,-24); g.lineWidth=1.6;
      g.beginPath(); g.moveTo(-4.6,-23.4+B); g.quadraticCurveTo(0,-21.6+B, 4.6,-23.4+B); g.stroke();
    }
    if(!away){ // chest lacing
      g.strokeStyle=shade(shirt,-28); g.lineWidth=1;
      g.beginPath();
      g.moveTo(-1.6,-21.2+B); g.lineTo(1.6,-18.8+B);
      g.moveTo(1.6,-21.2+B); g.lineTo(-1.6,-18.8+B);
      g.stroke();
    }
    if(away){ // back seam
      g.strokeStyle=shade(shirt,-22); g.lineWidth=1.1;
      g.beginPath(); g.moveTo(0,-24+B); g.lineTo(0,-9); g.stroke();
    }
    // belt
    g.fillStyle='#2c2118';
    g.beginPath(); g.roundRect(-8.8,-11.5,17.6,3.2,1.5); g.fill();
    if(!away){ g.fillStyle='#e0b45a'; g.fillRect(-2,-11.2,4,2.6);
      g.fillStyle='#8a6d30'; g.fillRect(-1,-10.5,2,1.2); }
    if(o.apron && !away){
      g.fillStyle=o.apron;
      g.beginPath(); g.moveTo(-5,-20+B); g.lineTo(5,-20+B);
      g.lineTo(6,-2); g.lineTo(-6,-2); g.closePath(); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1.2; g.stroke();
    }
    if((o.armor|0)>=1){
      const a2=(o.armor|0)>=2;
      const pg=g.createLinearGradient(-8,-24,8,-8);
      pg.addColorStop(0,'#cdd3dd'); pg.addColorStop(1,'#848b97');
      g.fillStyle=pg;
      g.beginPath();
      g.moveTo(-7.6,-23+B);
      g.quadraticCurveTo(-9.4,-15.5, -7.8,-9.5);
      g.quadraticCurveTo(0,-7.6, 7.8,-9.5);
      g.quadraticCurveTo(9.4,-15.5, 7.6,-23+B);
      g.quadraticCurveTo(0,-25.6+B, -7.6,-23+B);
      g.closePath(); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1.8; g.stroke();
      g.fillStyle='rgba(255,255,255,0.22)'; // plate sheen
      g.beginPath(); g.ellipse(-3.6,-18.5+B,2.6,5,0.35,0,TAU); g.fill();
      if(!away){
        g.strokeStyle='rgba(25,28,34,0.5)'; g.lineWidth=1;
        g.beginPath(); g.moveTo(0,-23+B); g.lineTo(0,-10); g.stroke();
        g.fillStyle='#39404b';
        for(const rx of [-4.5,4.5]){ g.beginPath(); g.arc(rx,-19+B,0.8,0,TAU); g.fill(); }
      } else {
        g.strokeStyle='#4a3a26'; g.lineWidth=1.6;
        g.beginPath();
        g.moveTo(-6,-22.5+B); g.lineTo(5.5,-11.5);
        g.moveTo(6,-22.5+B); g.lineTo(-5.5,-11.5); g.stroke();
      }
      if(a2 || o.pauldrons){
        g.fillStyle='#b9c0cb';
        for(const px of [-8.6,8.6]){
          g.beginPath(); g.ellipse(px,-21.5+B,3.4,2.7,0,0,TAU); g.fill();
          g.strokeStyle=OUT; g.lineWidth=1.2; g.stroke();
        }
      }
    }
  }
  if(o.necklace && !away){
    g.strokeStyle='rgba(0,0,0,0.4)'; g.lineWidth=1;
    g.beginPath(); g.arc(0,-24.5+B,4.2,Math.PI*0.15,Math.PI*0.85); g.stroke();
    g.fillStyle=o.necklace;
    g.beginPath(); g.arc(0,-20+B,1.5,0,TAU); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1; g.stroke();
  }

  /* ---------------- arms, front views (drawn over the body) ---------------- */
  if(claspIdle){
    // idle with back turned: hands clasp at the small of the back
    g.save(); g.translate(0,armY+8.2);
    g.fillStyle=skin; g.strokeStyle=OUT; g.lineWidth=1.3;
    g.beginPath(); g.arc(-2.3,0,2.9,0,TAU); g.fill(); g.stroke();
    g.beginPath(); g.arc(2.3,0.4,2.9,0,TAU); g.fill(); g.stroke();
    g.restore();
  } else if(!away){
    drawArm(-1, flip>0? armSwing : -armSwing);
    if(!o.weapon) drawArm(1, flip>0? -armSwing : armSwing);
  }
  /* ---------------- back layers when walking away ---------------- */
  if(o.quiver && away){
    g.save(); g.translate(5.5,-24+B); g.rotate(-0.5);
    g.fillStyle='#5a3d24'; g.beginPath(); g.roundRect(-2.6,-2,5.2,12,2); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.3; g.stroke();
    g.strokeStyle='#c9b990'; g.lineWidth=1.3;
    g.beginPath(); g.moveTo(-1,-2); g.lineTo(-2.2,-6.5); g.moveTo(1.2,-2); g.lineTo(1.4,-7); g.stroke();
    g.fillStyle='#e05648';
    g.beginPath(); g.moveTo(-2.2,-6.5); g.lineTo(-3.6,-9); g.lineTo(-1,-8); g.closePath(); g.fill();
    g.restore();
  }
  if(stowed){
    g.save(); g.translate(0,-25+B); g.rotate(-0.7);
    if(o.weapon==='bow'){
      g.strokeStyle='#7a5a34'; g.lineWidth=2.2;
      g.beginPath(); g.arc(0,0,8,Math.PI*0.6,Math.PI*1.4); g.stroke();
      g.strokeStyle='rgba(235,230,215,0.85)'; g.lineWidth=1;
      g.beginPath(); g.moveTo(-4.7,-6.4); g.lineTo(-4.7,6.4); g.stroke();
    } else if(o.weapon==='staff'){
      g.strokeStyle='#6e5738'; g.lineWidth=2.4;
      g.beginPath(); g.moveTo(-7,7); g.lineTo(7,-7); g.stroke();
      g.fillStyle='#7fd4ff'; g.beginPath(); g.arc(7,-7,2.2,0,TAU); g.fill();
    } else {
      const wt=o.wtier==null?1:o.wtier;
      g.fillStyle= wt===2? '#dfe5ee' : wt===1? '#cfd4dc' : '#9a9floor'.slice(0,7)||'#9a9689';
      g.fillStyle= wt===2? '#dfe5ee' : wt===1? '#cfd4dc' : '#9a9689';
      g.save(); g.rotate(Math.PI*0.25);
      g.beginPath(); g.roundRect(-1.4,-12,2.8, wt===2?15:13, 1.2); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1; g.stroke();
      g.fillStyle= wt===2? '#e0b45a' : '#6e5738';
      g.fillRect(-3.2,1.5,6.4,1.8);
      g.restore();
    }
    g.restore();
  }

  /* ---------------- THE HEAD: half the hero ---------------- */
  g.save();
  g.translate(0,-34.6+B*1.15);
  if(o.hero){ g.scale(1.12,1.12); } // the hero's head is grander still
  if(walking) g.rotate(sw1*0.035);
  const HR=12.3, HRY=13.9; // oval: taller than wide, even after iso foreshorten
  // ball with soft top-light - round, not flat
  const hg=g.createRadialGradient(-3.5,-5.5,2, 0,-1,15.5);
  hg.addColorStop(0,shade(skin,13)); hg.addColorStop(0.62,skin); hg.addColorStop(1,shade(skin,-9));
  g.fillStyle=hg;
  g.beginPath(); // wide cranium narrowing through the cheeks to a soft chin
  g.ellipse(0,-1.5,HR,HRY*0.92,0,Math.PI,0);
  g.quadraticCurveTo(HR*0.90,6.8, HR*0.42,11.2);
  g.quadraticCurveTo(0,13.8, -HR*0.42,11.2);
  g.quadraticCurveTo(-HR*0.90,6.8, -HR,-1.5);
  g.closePath(); g.fill();
  g.strokeStyle=OUT; g.lineWidth=2.0; g.stroke();

  if(away){
    /* back of the giant head: hair dome */
    if(o.hat!=='hood'){
      if(o.hairstyle==='bald'){
        g.fillStyle='rgba(255,255,255,0.16)';
        g.beginPath(); g.ellipse(-3.5,-4,4.5,3.2,-0.4,0,TAU); g.fill();
      } else {
        const hgb=g.createLinearGradient(0,-13,0,9);
        hgb.addColorStop(0,shade(hc,12)); hgb.addColorStop(1,shade(hc,-6));
        g.fillStyle=hgb;
        g.beginPath();
        g.ellipse(0,-1.2,HR*0.98,HRY*0.95,0,Math.PI,0);
        g.lineTo(HR*0.95,4.5);
        g.quadraticCurveTo(HR*0.6,8.8, HR*0.32,5.8);
        g.quadraticCurveTo(0,9.6, -HR*0.32,5.8);
        g.quadraticCurveTo(-HR*0.6,8.8, -HR*0.95,4.5);
        g.closePath(); g.fill();
        g.strokeStyle=OUT; g.lineWidth=1.8; g.stroke();
        g.fillStyle=hc; // crown tuft breaks the dome
        g.beginPath();
        g.moveTo(-2.5,-11.2); g.quadraticCurveTo(-1.5,-15.4, 2.4,-14.6);
        g.quadraticCurveTo(1.2,-12.6, 2.8,-10.8); g.closePath(); g.fill();
        g.strokeStyle=OUT; g.lineWidth=1.4; g.stroke();
        g.fillStyle='rgba(255,250,235,0.18)';
        g.beginPath(); g.ellipse(-3.5,-7.5,4,1.8,-0.3,0,TAU); g.fill();
        g.fillStyle=shade(hc,-9);
        g.beginPath();
        g.moveTo(HR*0.95,1.5); g.lineTo(HR*0.95,4.5);
        g.quadraticCurveTo(HR*0.6,8.8, HR*0.32,5.8);
        g.quadraticCurveTo(0,9.6, -HR*0.32,5.8);
        g.quadraticCurveTo(-HR*0.6,8.8, -HR*0.95,4.5);
        g.lineTo(-HR*0.95,1.5);
        g.quadraticCurveTo(0,4.6, HR*0.95,1.5);
        g.closePath(); g.fill();
      }
    }
  } else {
    /* the face - where all the charm lives. The iso camera looks DOWN
       at people: the face sits low on the skull, crown above. */
    g.save(); g.translate(0,2.8); g.scale(1.16,1.16); // slim feature scale on the oval
    const fx=profile? flip*3.2 : (o.dir? clamp((dx-dy)*1.6,-2.2,2.2) : 0);
    const fy=clamp(scrY*1.2,-1,1.6);
    const blink=((G.time+ph*1.7)%3.6)<0.24; // slower cycle, longer close - visible at last
    if(profile){
      // nose bump on the silhouette
      g.fillStyle=skin;
      g.beginPath(); g.arc(flip*HR*0.795, 1.9, 1.55, 0, TAU); g.fill(); // a modest nose (cluster-scaled to the head's edge)
      g.strokeStyle=OUT; g.lineWidth=1.3; g.stroke();
      g.fillStyle=skin;
      g.beginPath(); g.arc(flip*HR*0.726, 1.9, 1.85, 0, TAU); g.fill(); // blend seam
      // one huge eye
      if(blink){
        g.strokeStyle='#241a10'; g.lineWidth=2.1; g.lineCap='round';
        g.beginPath(); g.moveTo(flip*2.3,-2.3); g.quadraticCurveTo(flip*4.9,-0.8,flip*7.5,-2.3); g.stroke();
        g.lineWidth=1;
        g.beginPath(); g.moveTo(flip*7.5,-2.3); g.lineTo(flip*8.2,-1.8); g.stroke();
        g.lineCap='butt';
      } else {
        g.fillStyle='#17100a';
        g.beginPath();
        g.moveTo(flip*2.5,-2.15+fy);
        g.quadraticCurveTo(flip*4.9,-4.75+fy, flip*7.3,-2.15+fy);
        g.quadraticCurveTo(flip*4.9,0.75+fy, flip*2.5,-2.15+fy);
        g.closePath(); g.fill();
        g.fillStyle='rgba(255,255,255,0.92)';
        g.beginPath(); g.arc(flip*4.35,-3.1+fy,0.6,0,TAU); g.fill();
      }
      g.strokeStyle='#2e2418'; g.lineWidth=1.6; // brow
      g.beginPath(); g.moveTo(flip*1.8,-7.6); g.quadraticCurveTo(flip*5,-8.8,flip*8,-7.2); g.stroke();
      g.strokeStyle='rgba(90,58,40,0.75)'; g.lineWidth=1.05; g.lineCap='round'; // quiet mouth
      g.beginPath(); g.moveTo(flip*7.9,4.7); g.lineTo(flip*9.7,4.7); g.stroke();
      g.lineCap='butt';
      g.fillStyle='rgba(220,100,70,0.2)';
      g.beginPath(); g.ellipse(flip*3,3.2,2.4,1.7,0,0,TAU); g.fill();
    } else {
      const eSp=3.6, eyeY=-1.4+fy;
      const expr=o.expr||'calm';
      if(expr==='hurt'){
        g.strokeStyle='#241a10'; g.lineWidth=1.7; g.lineCap='round';
        g.beginPath();
        g.moveTo(-eSp+fx-2,eyeY-1.6); g.lineTo(-eSp+fx+1.6,eyeY);
        g.moveTo(-eSp+fx-2,eyeY+1.6); g.lineTo(-eSp+fx+1.6,eyeY);
        g.moveTo( eSp+fx+2,eyeY-1.6); g.lineTo( eSp+fx-1.6,eyeY);
        g.moveTo( eSp+fx+2,eyeY+1.6); g.lineTo( eSp+fx-1.6,eyeY);
        g.stroke(); g.lineCap='butt';
      } else if(expr==='happy'){
        g.strokeStyle='#241a10'; g.lineWidth=1.8; g.lineCap='round';
        g.beginPath();
        g.arc(-eSp+fx,eyeY+0.6,2.3,Math.PI*1.15,Math.PI*1.85);
        g.moveTo(eSp+fx+2.3*Math.cos(Math.PI*1.15),eyeY+0.6+2.3*Math.sin(Math.PI*1.15));
        g.arc( eSp+fx,eyeY+0.6,2.3,Math.PI*1.15,Math.PI*1.85);
        g.stroke(); g.lineCap='butt';
      } else if(blink){
        g.strokeStyle='#241a10'; g.lineWidth=2.1; g.lineCap='round'; // a real, visible blink
        g.beginPath();
        g.moveTo(-eSp+fx-1.9,eyeY-0.2); g.quadraticCurveTo(-eSp+fx,eyeY+1.1,-eSp+fx+1.9,eyeY-0.2);
        g.moveTo( eSp+fx-1.9,eyeY-0.2); g.quadraticCurveTo( eSp+fx,eyeY+1.1, eSp+fx+1.9,eyeY-0.2);
        g.stroke(); g.lineCap='butt';
      } else {
        for(const e of [-1,1]){
          const ex2=e*eSp+fx*0.9;
          g.fillStyle='#17100a'; // round button eyes - level and friendly
          g.beginPath();
          g.arc(ex2,eyeY,2.15,0,TAU);
          g.fill();
          g.fillStyle='rgba(255,255,255,0.92)';
          g.beginPath(); g.arc(ex2-0.6,eyeY-0.9,0.58,0,TAU); g.fill();
          g.fillStyle='rgba(255,255,255,0.35)';
          g.beginPath(); g.arc(ex2+0.55,eyeY+0.8,0.28,0,TAU); g.fill();
        }
      }
      // filled tapered brows, tilted by mood
      g.fillStyle='#2e2418';
      const bT= (o.expr==='battle')? 1.6 : (o.expr==='hurt')? -1.3 : (o.expr==='happy')? -0.7 : 0;
      for(const e of [-1,1]){
        g.beginPath();
        g.moveTo(e*(eSp+2.5)+fx,-6.3-bT*0.4);
        g.quadraticCurveTo(e*eSp+fx,-8.1+bT*0.3, e*(eSp-2.5)+fx,-6.7+bT);
        g.quadraticCurveTo(e*eSp+fx,-7.2+bT*0.3, e*(eSp+2.5)+fx,-5.8-bT*0.4);
        g.closePath(); g.fill();
      }
      // button nose with a light catch
      g.fillStyle=shade(skin,-13);
      g.beginPath(); g.ellipse(fx*0.4,2.6,1.6,1.25,0,0,TAU); g.fill();
      g.fillStyle='rgba(255,240,220,0.5)';
      g.beginPath(); g.arc(fx*0.4-0.45,2.2,0.42,0,TAU); g.fill();
      // the mouth carries the mood
      g.strokeStyle='#5a3a28'; g.lineCap='round';
      if(o.expr==='battle'){
        g.lineWidth=1.4;
        g.beginPath(); g.moveTo(fx*0.4-2.1,4.5); g.lineTo(fx*0.4+2.1,4.5); g.stroke();
      } else if(o.expr==='hurt'){
        g.lineWidth=1.3;
        g.beginPath();
        g.moveTo(fx*0.4-2.2,4.9);
        g.quadraticCurveTo(fx*0.4-1,4.0, fx*0.4,4.9);
        g.quadraticCurveTo(fx*0.4+1,5.8, fx*0.4+2.2,4.9);
        g.stroke();
      } else if(o.expr==='happy'){
        g.fillStyle='#5a3020';
        g.beginPath();
        g.moveTo(fx*0.4-2.8,3.8); g.quadraticCurveTo(fx*0.4,7.2, fx*0.4+2.8,3.8);
        g.quadraticCurveTo(fx*0.4,4.9, fx*0.4-2.8,3.8);
        g.closePath(); g.fill();
        g.lineWidth=1.1; g.strokeStyle='rgba(30,18,12,0.6)'; g.stroke();
      } else {
        g.lineWidth=1.05; g.strokeStyle='rgba(90,58,40,0.75)';
        g.beginPath();
        g.moveTo(fx*0.4-1.6,4.4); g.lineTo(fx*0.4+1.6,4.4); // quiet, neutral
        g.stroke();
      }
      g.lineCap='butt';
}
    /* beard hugs the giant chin */
    if(o.beard){
      const bl=o.beardLong?5:0;
      g.fillStyle=o.beard;
      g.beginPath(); // full beard wrapping the jaw, cheek to cheek
      g.moveTo(-9.4,-0.5);
      g.quadraticCurveTo(-10.4,7+bl*0.5, -5.5,11.5+bl);
      g.quadraticCurveTo(0,14.2+bl*1.2, 5.5,11.5+bl);
      g.quadraticCurveTo(10.4,7+bl*0.5, 9.4,-0.5);
      g.quadraticCurveTo(6.5,3.4, 3.6,3.2);
      g.quadraticCurveTo(0,2.6, -3.6,3.2);
      g.quadraticCurveTo(-6.5,3.4, -9.4,-0.5);
      g.closePath(); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1.3; g.stroke();
      g.fillStyle=shade(o.beard,-10); // depth under the lip
      g.beginPath(); g.ellipse(0,8.5+bl*0.7,4.6,2.2,0,0,TAU); g.fill();
      // mustache over the top edge
      g.fillStyle=shade(o.beard,6);
      g.beginPath();
      g.moveTo(0,2.4);
      g.quadraticCurveTo(-3.4,1.2, -5.4,3.6);
      g.quadraticCurveTo(-3,4.6, -0.6,4);
      g.quadraticCurveTo(0,3.8, 0.6,4);
      g.quadraticCurveTo(3,4.6, 5.4,3.6);
      g.quadraticCurveTo(3.4,1.2, 0,2.4);
      g.closePath(); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1; g.stroke();
      // the mouth survives the beard
      g.strokeStyle='rgba(30,18,12,0.75)'; g.lineWidth=1.2; g.lineCap='round';
      g.beginPath(); g.moveTo(-1.7,5.6); g.quadraticCurveTo(0,6.5, 1.7,5.6); g.stroke();
      g.lineCap='butt';
    }
    g.restore(); // face drop
  }

  /* ---------------- hair & hats on the giant head ---------------- */
  const helm2=(o.armor|0)>=2 && !o.hat && !o.hero; // guards wear helms; heroes wear hair
  if(!o.hat && !helm2 && o.hairstyle!=='bald'){
    if(profile){
      // side view: mass swept back over the crown to a point at the nape
      const hgp=g.createLinearGradient(0,-16,0,4);
      hgp.addColorStop(0,shade(hc,12)); hgp.addColorStop(1,shade(hc,-6));
      g.fillStyle=hgp;
      g.beginPath(); // hair blankets the whole back & top of the skull; only the face is carved out
      g.moveTo(flip*HR*0.66,-3.2);
      g.quadraticCurveTo(flip*HR*0.92,-9.5, flip*2,-14.6);
      g.quadraticCurveTo(flip*-8,-15.4, flip*-HR*1.02,-6.5);
      g.quadraticCurveTo(flip*-HR*1.24,1.5, flip*-HR*0.8,7.8);
      g.lineTo(flip*-HR*0.55,4.8);
      g.quadraticCurveTo(flip*-HR*0.2,6.2, flip*1.6,3.4);
      g.quadraticCurveTo(flip*HR*0.4,0.2, flip*HR*0.44,-2.4);
      g.lineTo(flip*HR*0.58,-5.2);
      g.closePath(); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1.8; g.stroke();
      g.fillStyle='rgba(255,250,235,0.20)';
      g.beginPath(); g.ellipse(flip*-2,-11.5,3.8,1.7,flip*0.25,0,TAU); g.fill();
      g.fillStyle=shade(hc,-9); // nape tone
      g.beginPath();
      g.moveTo(flip*-HR*1.02,-6.5);
      g.quadraticCurveTo(flip*-HR*1.24,1.5, flip*-HR*0.8,7.8);
      g.lineTo(flip*-HR*0.55,4.8);
      g.quadraticCurveTo(flip*-HR*0.78,-1.5, flip*-HR*0.68,-7.2);
      g.closePath(); g.fill();
    }
    else if(!away){
      const hgr=g.createLinearGradient(0,-13,0,-2);
      hgr.addColorStop(0,shade(hc,12)); hgr.addColorStop(1,shade(hc,-4));
      g.fillStyle=hgr;
      g.beginPath();
      g.moveTo(-HR*0.98,0.8);
      g.quadraticCurveTo(-HR*1.14,-6.5, -HR*0.6,-11.6);
      g.quadraticCurveTo(-4.8,-16.2, 0.6,-14.0);
      g.lineTo(-0.6,-11.4);
      g.quadraticCurveTo(4.4,-15.6, 8.0,-12.0);
      g.quadraticCurveTo(HR*1.1,-8.0, HR*0.94,0.6);
      g.quadraticCurveTo(6.4,-3.2, 5.2,-4.6);
      g.quadraticCurveTo(3.4,-6.4, 1.9,-4.1);
      g.quadraticCurveTo(0.2,-6.8, -1.7,-4.3);
      g.quadraticCurveTo(-3.5,-6.5, -5.3,-4.1);
      g.quadraticCurveTo(-6.7,-3.1, -HR*0.98,0.8);
      g.closePath(); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1.8; g.stroke();
      g.fillStyle='rgba(255,250,235,0.20)'; // dome gloss
      g.beginPath(); g.ellipse(-3.8,-10.4,3.8,1.7,-0.3,0,TAU); g.fill();
      g.fillStyle=shade(hc,-9);
      g.beginPath();
      g.moveTo(-HR*0.98,0.8);
      g.quadraticCurveTo(-HR*1.14,-6.5, -HR*0.6,-11.6);
      g.quadraticCurveTo(-6.4,-8.5, -5.3,-4.1);
      g.quadraticCurveTo(-6.7,-3.1, -HR*0.98,0.8);
      g.closePath(); g.fill();
    }
    if(o.hairstyle==='long'){
      for(const e of (away?[-1,1]:[-1,1])){
        g.fillStyle=hc;
        g.beginPath();
        g.moveTo(e*HR*0.9,-2);
        g.quadraticCurveTo(e*HR*1.25,6, e*HR*0.95,13);
        g.lineTo(e*HR*0.62,11.5);
        g.quadraticCurveTo(e*HR*0.85,4, e*HR*0.72,-3);
        g.closePath(); g.fill();
        g.strokeStyle=OUT; g.lineWidth=1.2; g.stroke();
      }
    }
    if(o.hairstyle==='bun'){
      g.fillStyle=hc;
      g.beginPath(); g.arc(away?0:-8.5, away?-11.5:-10.5, 3.4, 0, TAU); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1.2; g.stroke();
    }
  }
  if(o.hairstyle==='bald' && !o.hat && !helm2 && !away){
    g.fillStyle='rgba(255,255,255,0.16)';
    g.beginPath(); g.ellipse(-3.5,-7,4.2,2.8,-0.35,0,TAU); g.fill();
  }
  if(o.hat==='hood'){
    g.fillStyle=o.hatColor||'#4a3a5a';
    g.beginPath();
    g.ellipse(0,-1.5,HR*1.12,HRY*1.1,0,Math.PI*0.98,Math.PI*2.02);
    g.quadraticCurveTo(HR*1.1,6, HR*0.8,8.5);
    g.lineTo(-HR*0.8,8.5);
    g.quadraticCurveTo(-HR*1.1,6, -HR*1.12,-1.8);
    g.closePath(); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.4; g.stroke();
    if(!away){ g.fillStyle='rgba(10,6,4,0.5)';
      g.beginPath(); g.ellipse(0,-1,HR*0.78,HRY*0.72,0,Math.PI*1.05,Math.PI*1.95); g.fill(); }
  } else if(o.hat==='straw'){
    g.fillStyle='#d9b96a';
    g.beginPath(); g.ellipse(0,-8.5,HR*1.35,4.6,0,0,TAU); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.3; g.stroke();
    g.fillStyle='#c9a955';
    g.beginPath(); g.ellipse(0,-11,HR*0.62,4.4,0,Math.PI,0); g.fill(); g.stroke();
  } else if(o.hat==='wizard'){
    g.fillStyle=o.hatColor||'#3a4a6f';
    g.beginPath(); g.ellipse(0,-8,HR*1.2,3.8,0,0,TAU); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.3; g.stroke();
    g.beginPath();
    g.moveTo(-HR*0.72,-8.5);
    g.quadraticCurveTo(-2,-24, 4.5,-27);
    g.quadraticCurveTo(3.5,-20, HR*0.72,-8.5);
    g.closePath(); g.fill(); g.stroke();
    if(o.trim){ g.fillStyle=o.trim; g.beginPath(); g.arc(4.5,-27,1.5,0,TAU); g.fill(); }
  } else if(o.hat==='crown'){
    g.fillStyle='#e0b45a';
    g.beginPath();
    g.moveTo(-7.5,-9);
    g.lineTo(-7.5,-14); g.lineTo(-4.5,-11.2); g.lineTo(-1.5,-15);
    g.lineTo(1.5,-11.2); g.lineTo(4.5,-15); g.lineTo(7.5,-14);
    g.lineTo(7.5,-9);
    g.quadraticCurveTo(0,-11.5, -7.5,-9);
    g.closePath(); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.2; g.stroke();
    g.fillStyle='#e05648'; g.beginPath(); g.arc(0,-11.6,1.1,0,TAU); g.fill();
  } else if(o.hat==='circlet'){
    g.strokeStyle='#e0b45a'; g.lineWidth=1.8;
    g.beginPath(); g.ellipse(0,-7.5,HR*0.86,4,0,Math.PI*1.05,Math.PI*1.95); g.stroke();
    if(!away){ g.fillStyle='#7fd4ff'; g.beginPath(); g.arc(0,-10.6,1.3,0,TAU); g.fill(); }
  } else if(helm2){
    g.fillStyle='#b9c0cb';
    g.beginPath(); g.ellipse(0,-3.5,HR*1.02,HRY*0.85,0,Math.PI*0.98,Math.PI*2.02); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.4; g.stroke();
    if(!away){ g.fillStyle='#8f96a2'; g.fillRect(-1.1,-4,2.2,6.5); }
    g.strokeStyle='rgba(25,28,34,0.5)'; g.lineWidth=1;
    g.beginPath(); g.ellipse(0,-3.5,HR*1.02,HRY*0.85,0,Math.PI*1.25,Math.PI*1.75); g.stroke();
  }
  g.restore(); // head

  /* ---------------- weapon arm ---------------- */
  if(o.weapon && !stowed){
    const swv=o.swing||0;
    g.save();
    const isSword=o.weapon==='sword';
    g.translate(flip*8.2, armY);
    g.scale(flip,1);
    // Sword rests out to the side (blade angled up & away from the body) so it
    // reads as held in the hand instead of floating over the chest; its swing
    // sweeps up into that rest. Bow/staff/tools keep the original arm pose.
    g.rotate((isSword? -0.5 : 0.35) + swv*(isSword? -1.6 : 1.9) + (walking? -sw1*0.18:0));
    g.fillStyle=o.robe? o.robe : shirt;
    g.beginPath(); g.roundRect(-2.1,0,4.2,7.6,2.1); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.3; g.stroke();
    // fist
    g.translate(0,8.6);
    g.fillStyle=skin;
    g.beginPath(); g.roundRect(-2.8,-2.6,5.6,5.2,2.1); g.fill(); g.stroke();
    g.strokeStyle='rgba(30,20,12,0.35)'; g.lineWidth=1;
    g.beginPath(); g.moveTo(-2.1,-0.2); g.lineTo(2.1,-0.2); g.stroke();
    // weapon
    g.rotate((isSword? 0.0 : -0.5) + swv*(isSword? -0.6 : 0.2));
    if(o.weapon==='sword'){
      const wt=o.wtier==null?1:o.wtier;
      const bl= wt===2? 19 : wt===1? 16 : 13;
      g.fillStyle= wt===2? '#e8edf4' : wt===1? '#cfd4dc' : '#9a9689';
      g.beginPath();
      g.moveTo(-1.6,-3); g.lineTo(-1.6,-3-bl+3); g.lineTo(0,-3-bl); g.lineTo(1.6,-3-bl+3); g.lineTo(1.6,-3);
      g.closePath(); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1.1; g.stroke();
      if(wt===2){ g.strokeStyle='rgba(255,154,60,0.75)'; g.lineWidth=1;
        g.beginPath(); g.moveTo(0,-4.5); g.lineTo(0,-3-bl+4); g.stroke(); }
      g.fillStyle= wt===2? '#e0b45a' : '#6e5738';
      g.fillRect(-3.6,-3.4,7.2,1.9);
      g.fillStyle= wt===2? '#e0b45a' : '#4a3a26';
      g.beginPath(); g.arc(0,1.6,1.5,0,TAU); g.fill();
      if(wt===2){ g.fillStyle='#ff9a3c'; g.beginPath(); g.arc(0,1.6,0.8,0,TAU); g.fill(); }
    } else if(o.weapon==='bow'){
      g.strokeStyle='#7a5a34'; g.lineWidth=2.4;
      g.beginPath(); g.arc(0,-1,9,Math.PI*0.62,Math.PI*1.38); g.stroke();
      g.strokeStyle='rgba(235,230,215,0.85)'; g.lineWidth=1;
      g.beginPath(); g.moveTo(-3.3,-8.3); g.lineTo(-3.3,6.3); g.stroke();
    } else if(o.weapon==='staff'){
      g.strokeStyle='#6e5738'; g.lineWidth=2.6;
      g.beginPath(); g.moveTo(0,5); g.lineTo(0,-13); g.stroke();
      g.fillStyle='#7fd4ff';
      const pl=0.6+0.4*Math.sin(G.time*4);
      g.beginPath(); g.arc(0,-14.5,2.3,0,TAU); g.fill();
      g.fillStyle='rgba(127,212,255,'+(0.35*pl)+')';
      g.beginPath(); g.arc(0,-14.5,3.8,0,TAU); g.fill();
    } else if(o.weapon==='axe'){
      g.strokeStyle='#6e5738'; g.lineWidth=2.4;
      g.beginPath(); g.moveTo(0,3); g.lineTo(0,-10); g.stroke();
      g.fillStyle='#9a9689';
      g.beginPath();
      g.moveTo(0,-10); g.quadraticCurveTo(6.5,-9.5, 5.5,-4);
      g.quadraticCurveTo(2.5,-6, 0,-6); g.closePath(); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1.1; g.stroke();
    } else if(o.weapon==='pick'){
      g.strokeStyle='#6e5738'; g.lineWidth=2.4;
      g.beginPath(); g.moveTo(0,3); g.lineTo(0,-10); g.stroke();
      g.fillStyle='#8f8a7d';
      g.beginPath();
      g.moveTo(-6.5,-8.5); g.quadraticCurveTo(0,-13.5, 6.5,-8.5);
      g.quadraticCurveTo(0,-10.5, -6.5,-8.5); g.closePath(); g.fill();
      g.strokeStyle=OUT; g.lineWidth=1.1; g.stroke();
    } else if(o.weapon==='rod'){
      g.strokeStyle='#6e5738'; g.lineWidth=1.8;
      g.beginPath(); g.moveTo(0,3); g.lineTo(0,-12); g.stroke();
      g.strokeStyle='rgba(220,220,225,0.6)'; g.lineWidth=1;
      g.beginPath(); g.moveTo(0,-12); g.quadraticCurveTo(4,-10, 4.5,-5); g.stroke();
    }
    g.restore();
  }

  /* ---------------- shield on the off-hand ---------------- */
  if(o.shield && !away){
    g.save(); g.translate(-flip*10.5,-14+B*0.6);
    g.fillStyle='#7a5a34';
    g.beginPath(); g.ellipse(0,0,4.6,5.4,0,0,TAU); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.4; g.stroke();
    g.fillStyle='#e0b45a'; g.beginPath(); g.arc(0,0,1.6,0,TAU); g.fill();
    g.restore();
  }

  /* ---------------- name tag hook (unchanged contract) ---------------- */
  g.restore();
}

function drawSlime(g,sx,sy,m){
  const sq = 1 + Math.sin(m.anim*6)*0.12;
  const w = 15*sq, h=12/sq;
  g.save(); g.translate(sx,sy);
  if(m.hurtT>0) g.globalAlpha=0.6;
  const col = m.boss? '#7ec4a0' : '#7fca6a';
  g.fillStyle=shade(col,-30); g.beginPath(); g.ellipse(0,-h*0.8+2,w,h,0,0,TAU); g.fill();
  g.fillStyle=col; g.beginPath(); g.ellipse(0,-h*0.9,w,h,0,0,TAU); g.fill();
  g.fillStyle='rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-w*0.35,-h*1.25,w*0.25,h*0.3,-.5,0,TAU); g.fill();
  g.fillStyle='#203018';
  g.beginPath(); g.arc(-4,-h*0.95,1.8,0,TAU); g.arc(4,-h*0.95,1.8,0,TAU); g.fill();
  g.restore();
}
function drawWolf(g,sx,sy,m){
  const flip = m.face<0?-1:1, trot=Math.sin(m.anim*10)*2;
  g.save(); g.translate(sx,sy); g.scale(flip,1);
  if(m.hurtT>0) g.globalAlpha=0.6;
  g.fillStyle='#5d6068';
  g.fillRect(-14,-20+Math.max(0,trot)*0.4,4,10); g.fillRect(8,-20+Math.max(0,-trot)*0.4,4,10);
  g.beginPath(); g.roundRect(-16,-28,30,14,6); g.fill();
  g.fillStyle='#6e727b'; g.beginPath(); g.roundRect(-16,-28,30,7,4); g.fill();
  // head
  g.fillStyle='#5d6068'; g.beginPath(); g.roundRect(8,-36,16,13,5); g.fill();
  g.fillStyle='#4a4d54'; g.beginPath(); g.moveTo(10,-36); g.lineTo(13,-42); g.lineTo(16,-36); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(17,-36); g.lineTo(20,-42); g.lineTo(23,-36); g.closePath(); g.fill();
  g.fillStyle='#3a3d43'; g.fillRect(22,-31,4,4);
  g.fillStyle='#ffd0d0'; g.beginPath(); g.arc(17,-31,1.7,0,TAU); g.fill();
  // tail
  g.strokeStyle='#5d6068'; g.lineWidth=4; g.beginPath();
  g.moveTo(-16,-24); g.quadraticCurveTo(-24,-28,-22,-34+trot); g.stroke();
  g.restore();
}
function drawSkeleton(g,sx,sy,m){
  const s = m.boss?1.7:1, step=Math.sin(m.anim*8)*2.2*s;
  g.save(); g.translate(sx,sy);
  if(m.hurtT>0) g.globalAlpha=0.6;
  if(m.boss){ g.fillStyle='rgba(120,220,160,0.16)'; g.beginPath(); g.ellipse(0,-24*s,26*s,32*s,0,0,TAU); g.fill(); }
  g.fillStyle='#dfe0d8';
  g.fillRect(-5*s,-13*s+Math.max(0,step),3.4*s,11*s-Math.max(0,step));
  g.fillRect(2*s,-13*s+Math.max(0,-step),3.4*s,11*s-Math.max(0,-step));
  // ribcage
  g.fillStyle='#eceee6'; g.beginPath(); g.roundRect(-7*s,-28*s,14*s,16*s,4*s); g.fill();
  g.strokeStyle='#b9bab1'; g.lineWidth=1.5*s;
  for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(-6*s,-24*s+i*4*s); g.lineTo(6*s,-24*s+i*4*s); g.stroke(); }
  if(m.boss){ // tattered cape
    g.fillStyle='#3a4a3f'; g.beginPath(); g.moveTo(-8*s,-30*s); g.lineTo(8*s,-30*s);
    g.lineTo(10*s,-6*s); g.lineTo(4*s,-12*s); g.lineTo(0,-5*s); g.lineTo(-5*s,-12*s); g.lineTo(-10*s,-7*s); g.closePath(); g.fill();
  }
  // skull
  g.fillStyle='#f2f3ec'; g.beginPath(); g.arc(0,-36*s,7.6*s,0,TAU); g.fill();
  g.fillRect(-4*s,-33*s,8*s,5*s);
  g.fillStyle='#1c2418';
  g.beginPath(); g.arc(-2.8*s,-36*s,1.9*s,0,TAU); g.arc(2.8*s,-36*s,1.9*s,0,TAU); g.fill();
  if(m.boss){ g.fillStyle='#78dca0'; g.beginPath(); g.arc(-2.8*s,-36*s,1*s,0,TAU); g.arc(2.8*s,-36*s,1*s,0,TAU); g.fill();
    g.fillStyle='#ffd76a'; g.fillRect(-6*s,-45*s,12*s,3.4*s);
    g.beginPath(); g.moveTo(-6*s,-45*s); g.lineTo(-3.5*s,-50*s); g.lineTo(-1*s,-45*s); g.lineTo(1*s,-50*s); g.lineTo(3*s,-45*s); g.lineTo(5*s,-50*s); g.lineTo(6*s,-45*s); g.closePath(); g.fill(); }
  // rusty sword
  const flip=m.face<0?-1:1;
  g.save(); g.translate(9*s*flip,-20*s); g.scale(flip,1); g.rotate(-0.5+(m.swing||0)*2);
  g.fillStyle= m.boss?'#8fd4ae':'#a8a094'; g.fillRect(-1.4*s,-16*s,2.8*s,15*s);
  g.fillStyle='#6b5b43'; g.fillRect(-3.5*s,-2*s,7*s,2.6*s);
  g.restore();
  g.restore();
}
function drawCat(g,sx,sy,c){
  const flip=c.face<0?-1:1;
  g.save(); g.translate(sx,sy); g.scale(flip,1);
  g.fillStyle='#e8933a';
  g.beginPath(); g.roundRect(-10,-14,18,10,5); g.fill();
  g.beginPath(); g.arc(9,-14,6,0,TAU); g.fill();
  g.beginPath(); g.moveTo(5,-18); g.lineTo(7,-24); g.lineTo(10,-18); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(10,-18); g.lineTo(13,-23); g.lineTo(14,-17); g.closePath(); g.fill();
  g.strokeStyle='#e8933a'; g.lineWidth=3;
  g.beginPath(); g.moveTo(-10,-10); g.quadraticCurveTo(-17,-12,-15,-20+Math.sin(G.time*3)*2); g.stroke();
  g.fillStyle='#fff'; g.beginPath(); g.arc(9,-9,3.4,0,TAU); g.fill();
  g.fillStyle='#203018'; g.beginPath(); g.arc(10.5,-14.5,1.2,0,TAU); g.arc(7,-14.5,1.2,0,TAU); g.fill();
  g.restore();
}
/* crops */
function drawCrop(g,sx,sy,stage,t){
  const sway = Math.sin(t*2+sx)*1.5;
  if(stage===1){ g.strokeStyle='#7fca6a'; g.lineWidth=2;
    g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+sway*0.4,sy-7); g.stroke(); }
  else if(stage===2){ g.strokeStyle='#6db058'; g.lineWidth=2.4;
    for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(sx+i*5,sy); g.lineTo(sx+i*5+sway*0.6,sy-13); g.stroke(); } }
  else if(stage>=3){ const gold = stage===4;
    g.strokeStyle= gold?'#d9b45f':'#9db058'; g.lineWidth=2.6;
    for(let i=-1;i<=1;i++){ const tx=sx+i*5+sway, ty=sy-18;
      g.beginPath(); g.moveTo(sx+i*5,sy); g.quadraticCurveTo(sx+i*5,sy-10,tx,ty); g.stroke();
      g.fillStyle= gold?'#ffd76a':'#b9c66a';
      g.beginPath(); g.ellipse(tx,ty-2,3,6,sway*0.05,0,TAU); g.fill(); } }
}

/* ---- item icons ---- */
function iconCanvas(kind,sz=40){
  return makeCanvas(sz,sz,(g,w,h)=>{
    g.translate(w/2,h/2); const s=w/40;
    g.scale(s,s);
    switch(kind){
      case 'silk': g.fillStyle='#ffb0c8'; g.beginPath(); g.roundRect(-12,-8,24,16,4); g.fill();
        g.fillStyle='#ff8fb0'; g.fillRect(-12,-2,24,4);
        g.strokeStyle='#a85878'; g.lineWidth=1.5; g.beginPath(); g.roundRect(-12,-8,24,16,4); g.stroke();
        g.beginPath(); g.moveTo(-6,-8); g.lineTo(-6,8); g.moveTo(2,-8); g.lineTo(2,8); g.stroke(); break;
      case 'ribbon': g.strokeStyle='#e05a7a'; g.lineWidth=4; g.lineCap='round';
        g.beginPath(); g.arc(-6,-3,5.5,0.6,5.2); g.stroke();
        g.beginPath(); g.arc(6,-3,5.5,4.2,3.0); g.stroke();
        g.beginPath(); g.moveTo(-2,1); g.lineTo(-8,11); g.moveTo(2,1); g.lineTo(8,11); g.stroke();
        g.fillStyle='#ffce7a'; g.beginPath(); g.arc(0,-1,2.6,0,TAU); g.fill(); break;
      case 'coconut': g.fillStyle='#6a4c2e'; g.beginPath(); g.arc(0,1,9,0,TAU); g.fill();
        g.strokeStyle='#3e2c18'; g.lineWidth=1.6; g.stroke();
        g.fillStyle='#3e2c18'; g.beginPath(); g.arc(-3,-3,1.4,0,TAU); g.arc(2,-4,1.4,0,TAU); g.arc(0,0,1.4,0,TAU); g.fill();
        g.fillStyle='#8a6a42'; g.beginPath(); g.ellipse(-4,4,3,2,0.5,0,TAU); g.fill(); break;
      case 'boarmeat': g.fillStyle='#c96a52'; g.beginPath(); g.ellipse(-2,0,9,7,0.4,0,TAU); g.fill();
        g.strokeStyle='#7a3626'; g.lineWidth=1.6; g.stroke();
        g.strokeStyle='#e8e0d0'; g.lineWidth=3.5; g.lineCap='round';
        g.beginPath(); g.moveTo(6,4); g.lineTo(12,9); g.stroke(); g.lineCap='butt';
        g.fillStyle='#e8b0a0'; g.beginPath(); g.ellipse(-3,-2,4,2.6,0.4,0,TAU); g.fill(); break;
      case 'armor0': g.fillStyle='#8a6a4a'; g.beginPath(); g.roundRect(-9,-10,18,20,4); g.fill();
        g.strokeStyle='#5a4028'; g.lineWidth=1.6; g.beginPath(); g.roundRect(-9,-10,18,20,4); g.stroke();
        g.beginPath(); g.moveTo(0,-10); g.lineTo(0,10); g.stroke();
        g.fillStyle='#6a4a2c'; g.fillRect(-9,-12,6,5); g.fillRect(3,-12,6,5); break;
      case 'armor1': g.fillStyle='#9aa3ae'; g.beginPath(); g.roundRect(-10,-11,20,22,5); g.fill();
        g.strokeStyle='#4a525c'; g.lineWidth=2; g.beginPath(); g.roundRect(-10,-11,20,22,5); g.stroke();
        g.beginPath(); g.moveTo(-10,-3); g.lineTo(10,-3); g.stroke();
        g.fillStyle='#7a838e'; g.fillRect(-12,-12,6,7); g.fillRect(6,-12,6,7); break;
      case 'armor2': g.fillStyle='#c8d0da'; g.beginPath(); g.roundRect(-10,-11,20,22,5); g.fill();
        g.strokeStyle='#3c4650'; g.lineWidth=2; g.beginPath(); g.roundRect(-10,-11,20,22,5); g.stroke();
        g.beginPath(); g.moveTo(0,-11); g.lineTo(0,11); g.moveTo(-10,-2); g.lineTo(10,-2); g.stroke();
        g.fillStyle='#e8c860'; g.beginPath(); g.arc(0,-6,2.2,0,TAU); g.fill();
        g.fillStyle='#a8b2be'; g.fillRect(-13,-12,7,8); g.fillRect(6,-12,7,8); break;
      case 'bread': g.fillStyle='#d8a45c'; g.beginPath(); g.ellipse(0,1,11,7.5,0,0,TAU); g.fill();
        g.fillStyle='#eec27e'; g.beginPath(); g.ellipse(-1,-1.5,9,5,0,0,TAU); g.fill();
        g.strokeStyle='#9a6a34'; g.lineWidth=1.6; g.lineCap='round';
        g.beginPath(); g.moveTo(-6,-3); g.lineTo(-3,1); g.moveTo(-1,-4); g.lineTo(2,0); g.moveTo(4,-3); g.lineTo(7,1); g.stroke(); g.lineCap='butt'; break;
      case 'cookedfish': g.fillStyle='#b97f46'; g.beginPath(); g.ellipse(-2,0,10,6,0,0,TAU); g.fill();
        g.beginPath(); g.moveTo(7,0); g.lineTo(14,-6); g.lineTo(14,6); g.closePath(); g.fill();
        g.strokeStyle='#7a4a1e'; g.lineWidth=1.6;
        g.beginPath(); g.moveTo(-8,-4); g.lineTo(-5,4); g.moveTo(-3,-5); g.lineTo(0,4); g.moveTo(2,-4); g.lineTo(4,3); g.stroke();
        g.fillStyle='#4a2c10'; g.beginPath(); g.arc(-8,-1,1.3,0,TAU); g.fill(); break;
      case 'apple': g.fillStyle='#d84a4a'; g.beginPath(); g.arc(-3,2,7.5,0,TAU); g.arc(3,2,7.5,0,TAU); g.fill();
        g.fillStyle='#f08a8a'; g.beginPath(); g.ellipse(-4,-1,3,4,0.4,0,TAU); g.fill();
        g.strokeStyle='#5a3a1a'; g.lineWidth=2; g.beginPath(); g.moveTo(0,-5); g.quadraticCurveTo(1,-9,3,-10); g.stroke();
        g.fillStyle='#5a9a3a'; g.beginPath(); g.ellipse(6,-9,4,2.2,-0.5,0,TAU); g.fill(); break;
      case 'wood': g.rotate(0.5); g.fillStyle='#8a6238'; g.beginPath(); g.roundRect(-13,-6,26,12,5); g.fill();
        g.fillStyle='#c9a06a'; g.beginPath(); g.ellipse(-13,0,4,6,0,0,TAU); g.fill();
        g.strokeStyle='#a57e4d'; g.beginPath(); g.ellipse(-13,0,2,3,0,0,TAU); g.stroke();
        g.strokeStyle='#6e4a2b'; g.lineWidth=1.5; g.beginPath(); g.moveTo(-6,-6); g.lineTo(-6,6); g.moveTo(2,-6); g.lineTo(2,6); g.stroke(); break;
      case 'stone': g.fillStyle='#8d8d93'; g.beginPath(); g.moveTo(-12,8); g.lineTo(-8,-8); g.lineTo(4,-11); g.lineTo(12,-1); g.lineTo(10,8); g.closePath(); g.fill();
        g.fillStyle='#a9a9b0'; g.beginPath(); g.moveTo(-8,-8); g.lineTo(4,-11); g.lineTo(2,-2); g.lineTo(-6,0); g.closePath(); g.fill(); break;
      case 'fish': g.fillStyle='#6aa7cf'; g.beginPath(); g.ellipse(-2,0,10,6,0,0,TAU); g.fill();
        g.beginPath(); g.moveTo(7,0); g.lineTo(14,-6); g.lineTo(14,6); g.closePath(); g.fill();
        g.fillStyle='#9ecbe8'; g.beginPath(); g.ellipse(-3,-2,7,3,0,0,TAU); g.fill();
        g.fillStyle='#203018'; g.beginPath(); g.arc(-8,-1,1.4,0,TAU); g.fill(); break;
      case 'wheat': g.strokeStyle='#d9b45f'; g.lineWidth=2;
        for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(i*5,14); g.quadraticCurveTo(i*5,2,i*7,-6); g.stroke();
          g.fillStyle='#ffd76a'; g.beginPath(); g.ellipse(i*7,-8,3,6,i*0.2,0,TAU); g.fill(); } break;
      case 'seed': g.fillStyle='#c9a06a'; g.beginPath(); g.roundRect(-9,-11,18,20,4); g.fill();
        g.fillStyle='#a57e4d'; g.fillRect(-9,-11,18,5);
        g.fillStyle='#7a5230'; for(const [px,py] of [[-4,-1],[3,2],[-1,6],[4,-3]]) { g.beginPath(); g.ellipse(px,py,2,2.8,0.4,0,TAU); g.fill(); } break;
      case 'mushroom': g.fillStyle='#e8e2d2'; g.fillRect(-3,0,6,12);
        g.fillStyle='#4f8fdb'; g.beginPath(); g.ellipse(0,0,12,8,0,Math.PI,0); g.fill();
        g.fillStyle='#9fd8ff'; g.beginPath(); g.arc(-4,-4,2,0,TAU); g.arc(4,-3,1.6,0,TAU); g.fill(); break;
      case 'potion': g.fillStyle='rgba(230,240,255,0.5)'; g.beginPath(); g.arc(0,3,9,0,TAU); g.fill(); g.fillRect(-3,-12,6,10);
        g.fillStyle='#e05648'; g.beginPath(); g.arc(0,4,7.4,0,TAU); g.fill();
        g.fillStyle='#8a6238'; g.fillRect(-4,-14,8,4);
        g.fillStyle='rgba(255,255,255,0.7)'; g.beginPath(); g.arc(-3,0,2,0,TAU); g.fill(); break;
      case 'gold': g.fillStyle='#c98f1e'; g.beginPath(); g.arc(0,1.5,10,0,TAU); g.fill();
        g.fillStyle='#ffd76a'; g.beginPath(); g.arc(0,0,10,0,TAU); g.fill();
        g.fillStyle='#c98f1e'; g.font='bold 12px Georgia'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('E',0,1); break;
      case 'charm': g.strokeStyle='#c9a06a'; g.lineWidth=2; g.beginPath(); g.arc(0,-6,7,Math.PI*0.15,Math.PI*0.85,true); g.stroke();
        g.fillStyle='#ff9a3c'; g.beginPath(); g.moveTo(0,-4); g.quadraticCurveTo(8,2,0,12); g.quadraticCurveTo(-8,2,0,-4); g.fill();
        g.fillStyle='#ffd76a'; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(4,4,0,9); g.quadraticCurveTo(-4,4,0,0); g.fill(); break;
      case 'crown': g.fillStyle='#ffd76a'; g.beginPath(); g.moveTo(-11,8); g.lineTo(-11,-4); g.lineTo(-5,2); g.lineTo(0,-9); g.lineTo(5,2); g.lineTo(11,-4); g.lineTo(11,8); g.closePath(); g.fill();
        g.fillStyle='#e05648'; g.beginPath(); g.arc(0,3,2.4,0,TAU); g.fill();
        g.fillStyle='#c98f1e'; g.fillRect(-11,6,22,3); break;
      case 'sword': g.rotate(-0.7); g.fillStyle='#c9ced6'; g.fillRect(-2,-14,4,20);
        g.beginPath(); g.moveTo(-2,-14); g.lineTo(0,-18); g.lineTo(2,-14); g.closePath(); g.fill();
        g.fillStyle='#8a6238'; g.fillRect(-6,6,12,3); g.fillRect(-2,9,4,6); break;
      case 'bow': g.strokeStyle='#8a6238'; g.lineWidth=3; g.beginPath(); g.arc(-3,0,12,-Math.PI*0.42,Math.PI*0.42); g.stroke();
        g.strokeStyle='#e8e2d2'; g.lineWidth=1; g.beginPath(); g.moveTo(-3+12*Math.cos(-Math.PI*0.42),12*Math.sin(-Math.PI*0.42)); g.lineTo(-3+12*Math.cos(Math.PI*0.42),12*Math.sin(Math.PI*0.42)); g.stroke();
        g.strokeStyle='#c9a06a'; g.lineWidth=2; g.beginPath(); g.moveTo(-8,0); g.lineTo(10,0); g.stroke();
        g.fillStyle='#c9ced6'; g.beginPath(); g.moveTo(10,0); g.lineTo(5,-3); g.lineTo(5,3); g.closePath(); g.fill(); break;
      case 'staff': g.rotate(0.5); g.fillStyle='#6e4a2b'; g.fillRect(-2,-10,4,26);
        g.fillStyle='rgba(127,212,255,0.4)'; g.beginPath(); g.arc(0,-12,8,0,TAU); g.fill();
        g.fillStyle='#7fd4ff'; g.beginPath(); g.arc(0,-12,4.6,0,TAU); g.fill(); break;
      case 'heart': g.fillStyle='#e05648'; g.beginPath();
        g.moveTo(0,10); g.bezierCurveTo(-14,-2,-6,-12,0,-4); g.bezierCurveTo(6,-12,14,-2,0,10); g.fill();
        g.fillStyle='rgba(255,255,255,0.5)'; g.beginPath(); g.arc(-4,-4,2.4,0,TAU); g.fill(); break;
    }
  });
}
const ICONS = {};
function buildIcons(){
  ['wood','stone','fish','wheat','seed','mushroom','potion','gold','charm','crown','sword','bow','staff','heart','silk','ribbon','bread','cookedfish','apple','armor0','armor1','armor2','coconut','boarmeat'].forEach(k=> ICONS[k]=iconCanvas(k));
  const gi=document.getElementById('goldIcon').getContext('2d');
  gi.drawImage(iconCanvas('gold',18),0,0);
}
