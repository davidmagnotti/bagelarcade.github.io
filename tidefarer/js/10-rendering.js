/* =====================================================================
   RENDERING
   ===================================================================== */
function worldToScreen(wx,wy){ return { x: isoX(wx,wy)-G.cam.x, y: isoY(wx,wy)-G.cam.y }; }
function screenToWorld(sx,sy){
  sx-=LB.x; sy-=LB.y;   // undo Performance Mode letterbox offset
  const ox=sx+G.cam.x, oy=sy+G.cam.y;
  return { x:(ox/(TW/2)+oy/(TH/2))/2, y:(oy/(TH/2)-ox/(TW/2))/2 };
}

/* ---- pre-baked ground (low-gfx) ----
   Bake every ground tile + fringe ONCE into an offscreen (half-res, ~27MB, so
   it fits weak GPUs) and blit the whole thing in a SINGLE drawImage per frame,
   instead of thousands of per-tile draws - the measured GPU bottleneck. Only
   used when LOWFX; full-detail devices keep the crisp per-tile pass. */
let groundCache=null, sceneryCache=null, gcOX=0, gcOY=0, gcWorld=null, scnWorld=null;
const GC_S=0.5;
function gcDims(){
  const OX=(MAPH-1)*(TW/2)+TW, OY=TH;
  const W=Math.max(1,Math.ceil(((MAPW+MAPH)*(TW/2)+TW*2)*GC_S));
  const H=Math.max(1,Math.ceil(((MAPW+MAPH)*(TH/2)+TH*3)*GC_S));
  return {OX,OY,W,H};
}
function invalidateGround(){ groundCache=null; }
function invalidateScenery(){ sceneryCache=null; }
function buildGroundCache(){
  const {OX,OY,W,H}=gcDims();
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d');
  g.setTransform(GC_S,0,0,GC_S,0,0);
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const t=G.map[y*MAPW+x], sx=isoX(x,y)+OX, sy=isoY(x,y)+OY;
    const spr=TILE_SPR[t] && TILE_SPR[t][G.variant[y*MAPW+x]];
    if(spr) g.drawImage(spr, sx-TW/2, sy-TH/2);
    if(t!==T.SHALLOW && t!==T.DEEP){
      const mc=terrainCls(t);
      if(mc<4) for(const nb of [[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]]){
        const nc=terrainCls(tileAt(x+nb[0],y+nb[1]));
        if(nc>mc && FRINGE[nc]) g.drawImage(FRINGE[nc][nb[2]], sx-TW/2, sy-TH/2);
      }
    }
  }
  groundCache=c; gcOX=OX; gcOY=OY; gcWorld=G.worldId;
}
/* Scenery (trees/rocks/bushes) is static in position but drawn live with many
   path ops per node. In low-gfx, bake it once here by pointing `cx` at the
   offscreen and offsetting the camera so worldToScreen maps into cache space,
   then reusing the exact live node renderer. Depth-sorted; blitted behind the
   live entities. Rebuilt only when a node is harvested or respawns. */
/* Decor that changes/moves stays drawn live; everything else (houses, lamps,
   walls, fences, pillars, stumps...) is static and gets baked. */
const DYNAMIC_DECOR = {chest:1, chestOpen:1, boat:1, lava:1, lairmouth:1};
let scnDecorN=-1;
function buildSceneryCache(){
  const {OX,OY,W,H}=gcDims();
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d');
  g.setTransform(GC_S,0,0,GC_S,0,0);
  const savedCx=cx, camX=G.cam.x, camY=G.cam.y;
  cx=g; G.cam.x=-OX; G.cam.y=-OY;
  try{
    const items=[];
    for(const n of G.nodes){ if(!n.dead) items.push({o:n, t:'node'}); }
    for(const b of G.decor){ if(!DYNAMIC_DECOR[b.kind]) items.push({o:b, t:'decor'}); }
    items.sort((a,b)=>(a.o.x+a.o.y)-(b.o.x+b.o.y));
    for(const it of items){ const s=worldToScreen(it.o.x,it.o.y);
      if(it.t==='node') drawNode(it.o,s); else drawDecor(it.o,s); }
  }catch(e){}
  cx=savedCx; G.cam.x=camX; G.cam.y=camY;
  sceneryCache=c; scnWorld=G.worldId; scnDecorN=G.decor.length;
}

function render(){
  cx.setTransform(DPR,0,0,DPR,0,0);
  // sky/ocean backdrop
  cx.fillStyle='#16283e'; cx.fillRect(0,0,VW,VH);
  if(G.shake>0 && CFG.shake){ cx.translate(rnd(-1,1)*G.shake*10, rnd(-1,1)*G.shake*10); }

  // visible tile range
  const corners=[screenToWorld(0,0),screenToWorld(VW,0),screenToWorld(0,VH),screenToWorld(VW,VH)];
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const c of corners){ minX=Math.min(minX,c.x); maxX=Math.max(maxX,c.x);
    minY=Math.min(minY,c.y); maxY=Math.max(maxY,c.y); }
  minX=Math.floor(minX)-2; maxX=Math.ceil(maxX)+2; minY=Math.floor(minY)-2; maxY=Math.ceil(maxY)+4;

  // ---- ground pass ----
  if(DBG.ground){
   if(LOWFX){
    // one blit of the whole pre-baked ground instead of thousands of tile draws
    if(!groundCache || gcWorld!==G.worldId) buildGroundCache();
    if(groundCache) cx.drawImage(groundCache, -G.cam.x-gcOX, -G.cam.y-gcOY,
      groundCache.width/GC_S, groundCache.height/GC_S);
    // baked scenery (trees/rocks/bushes + static decor) behind the live entities
    if(!sceneryCache || scnWorld!==G.worldId || scnDecorN!==G.decor.length) buildSceneryCache();
    if(sceneryCache) cx.drawImage(sceneryCache, -G.cam.x-gcOX, -G.cam.y-gcOY,
      sceneryCache.width/GC_S, sceneryCache.height/GC_S);
   } else for(let y=Math.max(0,minY); y<=Math.min(MAPH-1,maxY); y++){
    for(let x=Math.max(0,minX); x<=Math.min(MAPW-1,maxX); x++){
      const t=G.map[y*MAPW+x];
      const s=worldToScreen(x,y); // top corner of diamond at tile origin
      const sx=s.x - 0, sy=s.y;
      // sprite drawn with its diamond centered at (TW/2, TH/2): blit so tile (x,y) top corner maps
      cx.drawImage(TILE_SPR[t][G.variant[y*MAPW+x]], sx-TW/2, sy-TH/2);
      if(t===T.SHALLOW || t===T.DEEP){
        // gentle animated sheen + drifting sparkles (per-water-tile path ops -
        // one of the biggest costs on a software-rendered canvas; drop at LOWFX)
        if(!LOWFX){
          const ph=Math.sin(G.time*1.6 + x*0.9 + y*1.3);
          if(ph>0.86){ cx.fillStyle='rgba(255,255,255,0.10)';
            cx.beginPath(); cx.ellipse(sx, sy+2, 10, 3, 0, 0, TAU); cx.fill(); }
          if(((x*13+y*29+((G.time*2.2)|0))%41)===0){
            const sa=0.35+0.35*Math.sin(G.time*6+x);
            cx.strokeStyle='rgba(255,255,255,'+sa+')'; cx.lineWidth=1;
            cx.beginPath(); cx.moveTo(sx-3,sy); cx.lineTo(sx+3,sy);
            cx.moveTo(sx,sy-2); cx.lineTo(sx,sy+2); cx.stroke();
          }
        }
      } else if(!LOWFX){
        // soft terrain transitions: higher terrain bleeds over lower
        // (up to 4 extra drawImage per land tile - a big draw-call cost)
        const mc=terrainCls(t);
        if(mc<4){
          const nbs=[[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]];
          for(const nb of nbs){
            const nt=tileAt(x+nb[0],y+nb[1]);
            const nc=terrainCls(nt);
            if(nc>mc && FRINGE[nc]) cx.drawImage(FRINGE[nc][nb[2]], sx-TW/2, sy-TH/2);
          }
        }
      }
    }
  }
  }
  if(fxOn('foam')) drawFoam(minX,maxX,minY,maxY);
  if(fxOn('decals')) drawDecals(minX,maxX,minY,maxY);
  // farm crops (flat, above ground below objects)
  for(const pl of G.plots){
    if(pl.stage>0){ const s=worldToScreen(pl.x+0.5,pl.y+0.5); drawCrop(cx,s.x,s.y+4,pl.stage,G.time); }
  }

  // ---- object/entity pass (depth sorted) ----
  const items=[];
  // In low-gfx the static nodes are pre-baked into the scenery cache; skip them here.
  if(!LOWFX) for(const n of G.nodes){
    if(n.tx<minX-1||n.tx>maxX+1||n.ty<minY-1||n.ty>maxY+1) continue;
    items.push({d:n.x+n.y, kind:'node', o:n});
  }
  for(const b of G.decor){ if(b.x<minX-2||b.x>maxX+2||b.y<minY-2||b.y>maxY+2) continue;
    if(LOWFX && !DYNAMIC_DECOR[b.kind]) continue;   // static decor is baked into the scenery cache
    items.push({d:b.x+b.y, kind:b.kind==='lamp'?'lamp':'decor', o:b}); }
  for(const n of G.npcs) items.push({d:n.x+n.y, kind:'npc', o:n});
  for(const m of G.mobs){ if(!m.dead) items.push({d:m.x+m.y, kind:'mob', o:m}); }
  if(G.cat) items.push({d:G.cat.x+G.cat.y, kind:'cat', o:G.cat});
  if(G.critters) for(const c of G.critters) items.push({d:c.x+c.y, kind:'critter', o:c});
  if(!P.dead) items.push({d:P.x+P.y, kind:'player', o:P});
  for(const p of G.projs) items.push({d:p.x+p.y, kind:'proj', o:p});
  for(const pt of G.parts){ if(pt.pickup) items.push({d:pt.x+pt.y, kind:'pickup', o:pt}); }
  items.sort((a,b)=>a.d-b.d);

  if(DBG.entities) for(const it of items){
    const o=it.o, s=worldToScreen(o.x,o.y);
    switch(it.kind){
      case 'node': drawNode(o,s); break;
      case 'decor': case 'lamp': drawDecor(o,s); break;
      case 'npc': drawNPC(o,s); break;
      case 'mob': drawMob(o,s); break;
      case 'cat': drawShadowAt(cx,s.x,s.y,9); drawCat(cx,s.x,s.y,o); break;
      case 'critter': drawShadowAt(cx,s.x,s.y, o.kind==='crab'?7:8); drawCritter(cx,s.x,s.y,o); break;
      case 'player': drawPlayer(s); break;
      case 'proj': drawProj(o,s); break;
      case 'pickup': drawPickup(o,s); break;
    }
  }

  // ---- particles & floats ----
  if(DBG.particles && fxOn('particles')) for(const pt of G.parts){
    if(pt.pickup) continue;
    const s=worldToScreen(pt.x,pt.y);
    cx.globalAlpha=clamp(pt.life*2.2,0,1);
    if(pt.ring){
      const pr=1-pt.life/pt.max, r=pr*pt.size;
      cx.strokeStyle=pt.color; cx.lineWidth=2.5*(1-pr)+0.5;
      cx.beginPath(); cx.ellipse(s.x,s.y-8,r,r*0.55,0,0,TAU); cx.stroke();
    } else if(pt.leaf){
      cx.save(); cx.translate(s.x,s.y-6+Math.sin(G.time*2+pt.ph)*3); cx.rotate(G.time*1.5+pt.ph);
      cx.fillStyle=pt.color; cx.fillRect(-2.6,-1.6,5.2,3.2); cx.restore();
    } else if(pt.bfly){
      const fl=Math.sin(G.time*15+pt.ph);
      const bx=s.x+Math.sin(G.time*2.3+pt.ph)*8, by=s.y-9+Math.sin(G.time*3.1+pt.ph)*4;
      cx.fillStyle=pt.color;
      cx.save(); cx.translate(bx,by);
      cx.beginPath(); cx.ellipse(-2.4*Math.abs(fl)-0.6,0,2.6*Math.abs(fl)+0.4,1.9,-0.4,0,TAU);
      cx.ellipse( 2.4*Math.abs(fl)+0.6,0,2.6*Math.abs(fl)+0.4,1.9,0.4,0,TAU); cx.fill();
      cx.fillStyle='rgba(40,30,20,0.9)'; cx.fillRect(-0.7,-2,1.4,4);
      cx.restore();
    } else if(pt.glow){
      cx.fillStyle=pt.color; cx.beginPath(); cx.arc(s.x,s.y-6,pt.size,0,TAU); cx.fill();
      cx.globalAlpha*=0.35; cx.beginPath(); cx.arc(s.x,s.y-6,pt.size*2.6,0,TAU); cx.fill();
    } else {
      cx.fillStyle=pt.color; cx.fillRect(s.x-pt.size/2, s.y-pt.size/2, pt.size, pt.size);
    }
    cx.globalAlpha=1;
  }
  // fireflies
  const night=nightAmount();
  if(fxOn('fireflies') && night>0.1){
    for(const f of G.fireflies){
      const s=worldToScreen(f.x,f.y);
      const a=(0.4+0.6*Math.abs(Math.sin(f.ph)))*Math.min(1,f.life);
      cx.globalAlpha=a*night;
      cx.fillStyle='#d8ffa0';
      cx.beginPath(); cx.arc(s.x,s.y-14,1.8,0,TAU); cx.fill();
      cx.globalAlpha=a*night*0.3;
      cx.beginPath(); cx.arc(s.x,s.y-14,5,0,TAU); cx.fill();
      cx.globalAlpha=1;
    }
  }
  if(DBG.floats) for(const f of G.floats){
    const s=worldToScreen(f.x,f.y);
    cx.globalAlpha=clamp(f.life,0,1);
    cx.font='bold '+Math.round(13*(f.scale||1))+'px Verdana';
    cx.textAlign='center';
    cx.strokeStyle='rgba(0,0,0,0.7)'; cx.lineWidth=3; cx.strokeText(f.text,s.x,s.y);
    cx.fillStyle=f.color; cx.fillText(f.text,s.x,s.y);
    cx.globalAlpha=1;
  }

  // point-and-click destination marker
  if(P.clickFx && P.clickFx.t>0){
    const s=worldToScreen(P.clickFx.x,P.clickFx.y);
    const pr=1-P.clickFx.t/0.6;
    cx.globalAlpha=P.clickFx.t/0.6;
    cx.strokeStyle='#ffd76a'; cx.lineWidth=2;
    cx.beginPath(); cx.ellipse(s.x,s.y,10+pr*14,(10+pr*14)*0.5,0,0,TAU); cx.stroke();
    cx.globalAlpha=1;
  }
  if(P.click && P.click.type==='pos'){
    const s=worldToScreen(P.click.x,P.click.y);
    cx.globalAlpha=0.5+0.3*Math.sin(G.time*6);
    cx.strokeStyle='#ffd76a'; cx.lineWidth=1.6;
    cx.beginPath(); cx.ellipse(s.x,s.y,7,3.5,0,0,TAU); cx.stroke();
    cx.globalAlpha=1;
  }

  // ---- carrion crows & coastal gulls (cheap: a few line strokes) - kept in low-gfx
  if(fxOn('birds')){ drawCrows(); drawGulls(); }
  if(fxOn('fog')) drawFog();
  if(fxOn('cloudShadows')) WX.drawCloudShadows();

  // ---- dynamic darkness with carved light pools ----
  if(fxOn('lighting') && night>0.02){
    drawLighting(night);
    // warm additive glow around flames
    cx.globalCompositeOperation='lighter';
    let li=0;
    for(const b of G.decor){
      li++;
      if(b.kind!=='lamp' && b.kind!=='house' && b.kind!=='forge' && b.kind!=='tower') continue;
      const s=worldToScreen(b.x,b.y);
      if(s.x<-100||s.x>VW+100||s.y<-120||s.y>VH+120) continue;
      const fl=0.9+0.1*Math.sin(G.time*7+li*2.1);
      const r=(b.kind==='lamp'?74:56)*fl;
      const gg=cx.createRadialGradient(s.x,s.y-40,4,s.x,s.y-40,r);
      gg.addColorStop(0,'rgba(255,180,80,'+(0.26*night)+')');
      gg.addColorStop(1,'rgba(255,180,80,0)');
      cx.fillStyle=gg; cx.beginPath(); cx.arc(s.x,s.y-40,r,0,TAU); cx.fill();
    }
    cx.globalCompositeOperation='source-over';
  }
  // dawn/dusk warmth
  const t=G.dayT;
  let warm=0;
  if(t>0.40&&t<0.52) warm=Math.sin((t-0.40)/0.12*Math.PI)*0.16;
  if(t<0.10) warm=Math.sin((0.10-t)/0.10*Math.PI)*0.10;
  if(warm>0.01){ cx.fillStyle='rgba(255,140,60,'+warm+')'; cx.fillRect(-20,-20,VW+40,VH+40); }

  // ---- weather & screen feedback ----
  WX.drawRain();
  if(CFG.flash && G.lightning>0.01){ cx.fillStyle='rgba(235,240,255,'+(G.lightning*0.55)+')'; cx.fillRect(-20,-20,VW+40,VH+40); }
  if(CFG.flash && G.flash>0.01){ cx.fillStyle='rgba(200,30,20,'+(G.flash*0.30)+')'; cx.fillRect(-20,-20,VW+40,VH+40); }

  // sickly miasma near the Old Ruins
  const ruinD=ZONES.ruins? dist(P.x,P.y,ZONES.ruins.x,ZONES.ruins.y) : 999;
  if(ruinD<14){ cx.fillStyle='rgba(70,100,70,'+(0.10*(1-ruinD/14)).toFixed(3)+')'; cx.fillRect(-20,-20,VW+40,VH+40); }
  // venom haze
  if((P.poisonT||0)>0){ const va2=0.05+0.05*Math.sin(G.time*5);
    cx.fillStyle='rgba(110,190,70,'+va2.toFixed(3)+')'; cx.fillRect(-20,-20,VW+40,VH+40); }

  // low-health warning pulse
  if(!P.dead && P.hp<P.maxhp*0.3){
    const sev=1-P.hp/(P.maxhp*0.3);
    const a=(0.14+0.10*Math.sin(G.time*5))*(0.4+0.6*sev);
    const rg=cx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.30,VW/2,VH/2,Math.max(VW,VH)*0.68);
    rg.addColorStop(0,'rgba(120,10,10,0)'); rg.addColorStop(1,'rgba(150,8,8,'+a.toFixed(3)+')');
    cx.fillStyle=rg; cx.fillRect(0,0,VW,VH);
  }
  // chest-opening progress ring
  if(P.openCh){
    const csn=worldToScreen(P.openCh.b.x,P.openCh.b.y), cpr=P.openCh.t/P.openCh.dur;
    cx.strokeStyle='rgba(20,14,8,0.75)'; cx.lineWidth=5;
    cx.beginPath(); cx.arc(csn.x,csn.y-24,13,0,TAU); cx.stroke();
    cx.strokeStyle='#ffd76a'; cx.lineWidth=3.4;
    cx.beginPath(); cx.arc(csn.x,csn.y-24,13,-Math.PI/2,-Math.PI/2+cpr*TAU); cx.stroke();
  }
  // interaction marker + quest arrow
  drawMarkers();
  // cinematic grade: cool shadows, film grain (full-screen blend passes -
  // costly on weak desktop GPUs). Skip on the title/menu so the loading
  // screen stays light, and skip entirely at the lowest quality tier.
  if(fxOn('grade') && G.state==='play') drawGritGrade();
  // vignette
  const vg=cx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.36,VW/2,VH/2,Math.max(VW,VH)*0.72);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.45)');
  if(DBG.vignette && fxOn('vignette')){ cx.fillStyle=vg; cx.fillRect(0,0,VW,VH); }

  // The minimap is a second on-screen canvas; redrawing it every frame forces
  // its own compositor layer to update. In low-gfx mode, refresh it ~6x/sec.
  if(!LOWFX) drawMinimap();
  else if(((G._mmT=(G._mmT|0)+1) % 10) === 0) drawMinimap();
}

function drawNode(n,s){
  if(n.kind==='tree' && n.palm){
    if(n.dead){ cx.drawImage(SPR.stump, s.x-42, s.y-96); return; }
    drawShadowAt(cx,s.x,s.y,15);
    const sh = n.shake? Math.sin(G.time*40)*3*n.shake*4 : Math.sin(G.time*0.7+n.sway)*1.1;
    const dmg = n.maxhp? 1-n.hp/n.maxhp : 0;
    cx.save(); cx.translate(s.x+sh*0.3, s.y);
    cx.rotate(sh*0.004 + dmg*0.06*(n.sway>Math.PI?-1:1));
    cx.drawImage(SPR.palm[n.variant%3], -52, -104);
    if(dmg>0){ // axe notch in the trunk
      cx.fillStyle='#e8dcbd';
      cx.beginPath(); cx.moveTo(-5,-16); cx.lineTo(-5+8*dmg,-13); cx.lineTo(-5,-10); cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(40,25,12,0.7)'; cx.lineWidth=1; cx.stroke();
    }
    cx.restore();
    if(n.hp<n.maxhp){ drawNodeHp&&drawNodeHp(n,s); }
    return;
  }
  if(n.kind==='tree'){
    if(n.dead){ cx.drawImage(SPR.stump, s.x-42, s.y-96); return; }
    drawShadowAt(cx,s.x,s.y,16);
    const sh = n.shake? Math.sin(G.time*40)*3*n.shake*4 : Math.sin(G.time*0.8+n.sway)*1.2;
    const dmg = 1 - n.hp/n.maxhp;
    cx.save(); cx.translate(s.x+sh*0.3,s.y);
    cx.rotate(sh*0.004 + dmg*0.07*(n.sway>Math.PI?-1:1));
    if(n.big) cx.scale(1.15,1.15);
    cx.drawImage(SPR.tree[n.variant], -42, -96);
    if(dmg>0){ // axe notch in the trunk
      cx.fillStyle='#e8dcbd';
      cx.beginPath(); cx.moveTo(-5,-16); cx.lineTo(-5+8*dmg,-13); cx.lineTo(-5,-10); cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(40,25,12,0.7)'; cx.lineWidth=1; cx.stroke();
    }
    cx.restore();
  } else if(n.kind==='rock'){
    if(n.dead){ cx.drawImage(SPR.rockLow, s.x-35, s.y-44); return; }
    drawShadowAt(cx,s.x,s.y,15);
    const sh=n.shake? Math.sin(G.time*45)*2.4*n.shake*4:0;
    cx.drawImage(SPR.rock[n.variant], s.x-35+sh, s.y-44);
    const cracks=n.maxhp-n.hp;
    if(cracks>0){
      cx.strokeStyle='rgba(15,12,8,0.65)'; cx.lineWidth=1.4;
      const cr=mulberry32(n.tx*31+n.ty*7);
      for(let i=0;i<cracks;i++){
        let px=s.x-14+cr()*28+sh, py=s.y-30+cr()*16;
        cx.beginPath(); cx.moveTo(px,py);
        for(let sg=0;sg<3;sg++){ px+=3+cr()*6; py+=(cr()-0.5)*9; cx.lineTo(px,py); }
        cx.stroke();
      }
    }
  } else if(n.kind==='apple'){
    if(n.dead){ cx.drawImage(SPR.stump, s.x-42, s.y-96); return; }
    const sh = n.shake? Math.sin(G.time*40)*3*n.shake*4 : Math.sin(G.time*0.8+n.sway)*1.2;
    cx.save(); cx.translate(s.x+sh*0.3,s.y); cx.rotate(sh*0.004);
    cx.drawImage(SPR.tree[2], -42, -96);
    const fr=mulberry32(n.tx*17+n.ty*5);
    cx.fillStyle='#c9385a';
    const spots=[]; for(let i=0;i<6;i++) spots.push([-20+fr()*40,-70+fr()*30]);
    for(const sp of spots){ cx.beginPath(); cx.arc(sp[0],sp[1],2.6,0,TAU); cx.fill(); }
    cx.fillStyle='rgba(255,255,255,0.5)';
    for(const sp of spots) cx.fillRect(sp[0]-1,sp[1]-1.6,1,1);
    cx.restore();
  } else if(n.kind==='shell'){
    if(n.dead) return;
    const gl=0.6+0.4*Math.sin(G.time*2.4+n.sway);
    cx.save(); cx.translate(s.x,s.y-3); cx.rotate(n.sway);
    cx.fillStyle='#e8e2d2'; cx.beginPath(); cx.ellipse(0,0,7,5,0,0,TAU); cx.fill();
    cx.strokeStyle='#b9a88a'; cx.lineWidth=1.4;
    cx.beginPath(); cx.arc(1,-0.5,4.2,0,TAU*0.8); cx.arc(1,-0.5,2.2,0,TAU*0.7); cx.stroke();
    cx.restore();
    cx.globalAlpha=0.25*gl; cx.fillStyle='#eaf4f8';
    cx.beginPath(); cx.arc(s.x,s.y-4,9,0,TAU); cx.fill(); cx.globalAlpha=1;
  } else if(n.kind==='mushroom'){
    if(n.dead) return;
    const glow=0.5+0.5*Math.sin(G.time*2+n.sway);
    cx.globalAlpha=0.25+glow*0.2; cx.fillStyle='#7fb4e8';
    cx.beginPath(); cx.arc(s.x,s.y-18,16+glow*4,0,TAU); cx.fill(); cx.globalAlpha=1;
    cx.drawImage(SPR.mushroom, s.x-20, s.y-38);
  } else if(n.kind==='fish'){
    const ph=G.time*1.4+n.bob;
    cx.strokeStyle='rgba(255,255,255,0.5)'; cx.lineWidth=1.5;
    for(let i=0;i<3;i++){
      const rp=((ph+i*0.7)%2)/2;
      cx.globalAlpha=(1-rp)*0.7;
      cx.beginPath(); cx.ellipse(s.x,s.y,6+rp*16,(6+rp*16)*0.45,0,0,TAU); cx.stroke();
    }
    cx.globalAlpha=1;
    // fish shadow flick
    if(Math.sin(ph*2)>0.7){ cx.fillStyle='rgba(20,40,60,0.5)';
      cx.beginPath(); cx.ellipse(s.x+Math.cos(ph)*6,s.y+2,6,2.4,Math.cos(ph),0,TAU); cx.fill(); }
  }
}
const SIGNS={};
function signGlyph(label){
  const sl=String(label).toLowerCase();
  if(sl.includes('inn')) return 'mug';
  if(sl.includes('provision')||sl.includes('trade')) return 'coin';
  if(sl.includes('herbary')) return 'leaf';
  if(sl.includes('warden')) return 'shield';
  if(sl.includes('clothier')||sl.includes('thread')) return 'spool';
  if(sl.includes('your homestead')) return 'key';
  return null; // homes and farms hang no shingle
}
function signCanvas(kind){
  if(SIGNS[kind]) return SIGNS[kind];
  SIGNS[kind]=makeCanvas(26,26,(g)=>{
    g.strokeStyle='#3a2a16'; g.lineWidth=2;
    g.beginPath(); g.moveTo(13,0); g.lineTo(13,4); g.stroke();
    g.fillStyle='#5a3d22'; g.beginPath(); g.roundRect(2,4,22,18,3); g.fill();
    g.strokeStyle='rgba(15,9,4,0.85)'; g.lineWidth=1.6; g.stroke();
    g.lineWidth=1.4;
    if(kind==='mug'){ g.fillStyle='#d8b060'; g.fillRect(8,10,8,9);
      g.strokeStyle='#f0e2c0'; g.strokeRect(8,10,8,9);
      g.beginPath(); g.arc(18,14.5,2.6,-1.2,1.2); g.stroke();
      g.fillStyle='#fff4d8'; g.fillRect(8,8.6,8,2.4); }
    if(kind==='coin'){ g.fillStyle='#e8c860'; g.beginPath(); g.arc(13,13,5.6,0,TAU); g.fill();
      g.strokeStyle='#7a5a18'; g.stroke();
      g.beginPath(); g.moveTo(13,9.6); g.lineTo(13,16.4); g.moveTo(10.4,12); g.lineTo(15.6,12); g.stroke(); }
    if(kind==='leaf'){ g.fillStyle='#7fb05b';
      g.beginPath(); g.moveTo(13,7); g.quadraticCurveTo(20,10,13,19); g.quadraticCurveTo(6,10,13,7); g.closePath(); g.fill();
      g.strokeStyle='#2e4a1e'; g.stroke();
      g.beginPath(); g.moveTo(13,8.5); g.lineTo(13,18); g.stroke(); }
    if(kind==='shield'){ g.fillStyle='#8fa3b8';
      g.beginPath(); g.moveTo(13,6.5); g.lineTo(19,9); g.quadraticCurveTo(19,17,13,20); g.quadraticCurveTo(7,17,7,9); g.closePath(); g.fill();
      g.strokeStyle='#26313c'; g.stroke(); }
    if(kind==='spool'){ g.fillStyle='#c9a06a';
      g.fillRect(7,7,12,3); g.fillRect(7,16,12,3);
      g.fillStyle='#e05a7a'; g.fillRect(8,10,10,6);
      g.strokeStyle='#8a3048'; g.lineWidth=1;
      g.beginPath(); g.moveTo(8,12); g.lineTo(18,12); g.moveTo(8,14); g.lineTo(18,14); g.stroke();
      g.strokeStyle='#e8e0d0'; g.lineWidth=1.4;
      g.beginPath(); g.moveTo(18,13); g.lineTo(22,9); g.stroke(); }
    if(kind==='key'){ g.strokeStyle='#e8c860'; g.lineWidth=2;
      g.beginPath(); g.arc(10,11,3,0,TAU); g.stroke();
      g.beginPath(); g.moveTo(12.6,12.6); g.lineTo(18,18); g.moveTo(16,18.5); g.lineTo(17.6,16.9); g.stroke(); }
  });
  return SIGNS[kind];
}
function drawSign(b,s,BS){
  const sg=signGlyph(b.label); if(!sg) return;
  const SS=SPR[b.kind]; if(!SS) return;
  const swy=Math.sin(G.time*1.4+(b.x+b.y))*0.06;
  cx.save(); cx.translate(s.x+SS.width*BS*0.30, s.y-SS.height*BS*0.44); cx.rotate(swy);
  cx.drawImage(signCanvas(sg),-13,0);
  cx.restore();
}
function drawDecor(b,s){
  if(b.cache && !qs('ribbon2')) return; // unseen until Mira tells you of it
  if(b.cache && !b.opened && Math.random()<0.06){
    // a wink of dawn-colored silk between the boards - hard to miss once you know
    G.parts.push({x:b.x+rnd(-0.4,0.4), y:b.y-rnd(0.6,1.3), vx:rnd(-0.2,0.2), vy:-rnd(0.3,0.7),
      life:0.8, color:Math.random()<0.5?'#ffb0c8':'#ffe2ec', size:2.5, grav:0});
  }
  if(b.kind==='tuft'){
    const sw=Math.sin(G.time*1.7+b.ph)*2.2;
    cx.strokeStyle='#688f4b'; cx.lineWidth=1.5; cx.lineCap='round';
    cx.beginPath();
    for(let i=-2;i<=2;i++){
      cx.moveTo(s.x+i*2.4,s.y);
      cx.quadraticCurveTo(s.x+i*2.4+sw*0.5, s.y-5, s.x+i*3+sw, s.y-8-Math.abs(i));
    }
    cx.stroke();
    cx.strokeStyle='rgba(170,150,90,0.55)'; cx.lineWidth=1.1;
    cx.beginPath(); cx.moveTo(s.x+1,s.y);
    cx.quadraticCurveTo(s.x+1+sw*0.5,s.y-4,s.x+2+sw,s.y-7); cx.stroke();
    return;
  }
  if(b.kind==='flower'){
    const sw=Math.sin(G.time*1.9+b.ph)*1.8;
    cx.strokeStyle='#4f7a3a'; cx.lineWidth=1.4;
    cx.beginPath(); cx.moveTo(s.x,s.y); cx.quadraticCurveTo(s.x+sw*0.4,s.y-5,s.x+sw,s.y-9); cx.stroke();
    cx.fillStyle=b.c;
    for(let i=0;i<5;i++){ const a=i*TAU/5+b.ph;
      cx.beginPath(); cx.ellipse(s.x+sw+Math.cos(a)*2.6, s.y-9+Math.sin(a)*2.6, 2, 1.4, a, 0, TAU); cx.fill(); }
    cx.fillStyle='#ffd76a'; cx.beginPath(); cx.arc(s.x+sw,s.y-9,1.5,0,TAU); cx.fill();
    return;
  }
  if(b.kind==='target'){
    const g=cx; g.save(); g.translate(s.x,s.y);
    g.strokeStyle='#5a4630'; g.lineWidth=3;
    g.beginPath(); g.moveTo(0,0); g.lineTo(0,-22); g.stroke();
    for(const [r,c] of [[10,'#e8e0d0'],[7,'#c04038'],[4,'#e8e0d0'],[1.8,'#c04038']]){
      g.fillStyle=c; g.beginPath(); g.ellipse(0,-26,r,r*1.15,0,0,TAU); g.fill(); }
    g.strokeStyle='#241a10'; g.lineWidth=1.6;
    g.beginPath(); g.ellipse(0,-26,10,11.5,0,0,TAU); g.stroke();
    g.restore(); return;
  }
  if(b.kind==='lava'){
    const g=cx, r=b.r||3, rx=r*TW/2, ry=r*TH/2, gl=0.6+0.4*Math.sin(G.time*2.1+b.x);
    g.save(); g.translate(s.x,s.y);
    g.fillStyle='rgba(255,120,40,'+(0.16*gl).toFixed(3)+')';     // heat glow
    g.beginPath(); g.ellipse(0,0,rx*1.3,ry*1.3,0,0,TAU); g.fill();
    g.fillStyle='#241610';                                        // charred rock rim
    g.beginPath(); g.ellipse(0,0,rx,ry,0,0,TAU); g.fill();
    const grd=g.createRadialGradient(0,-ry*0.15,rx*0.12,0,0,rx);  // molten body
    grd.addColorStop(0,'#ffe07a'); grd.addColorStop(0.35,'#ff8a1e');
    grd.addColorStop(0.75,'#c62a10'); grd.addColorStop(1,'#5a1606');
    g.fillStyle=grd;
    g.beginPath(); g.ellipse(0,0,rx*0.86,ry*0.86,0,0,TAU); g.fill();
    // drifting crust islands
    const cr=mulberry32((b.x*53+b.y*29)>>>0);
    for(let i=0;i<5;i++){
      const a=cr()*TAU+G.time*0.25*(cr()<0.5?1:-1), rr=cr()*rx*0.5;
      const px=Math.cos(a)*rr, py=Math.sin(a)*rr*0.55;
      g.fillStyle='rgba(30,18,12,0.9)';
      g.beginPath(); g.ellipse(px,py,2.6+cr()*3,1.6+cr()*1.6,a,0,TAU); g.fill();
      g.strokeStyle='rgba(255,150,60,'+(0.5*gl).toFixed(2)+')'; g.lineWidth=1;
      g.beginPath(); g.ellipse(px,py,2.6+cr()*3,1.6+cr()*1.6,a,0,TAU); g.stroke();
    }
    // bright bloom at the center
    g.fillStyle='rgba(255,230,150,'+(0.35*gl).toFixed(2)+')';
    g.beginPath(); g.ellipse(0,-ry*0.1,rx*0.3,ry*0.3,0,0,TAU); g.fill();
    g.restore(); return;
  }
  if(b.kind==='lairmouth'){
    const g=cx; g.save(); g.translate(s.x,s.y);
    const pulse=0.5+0.5*Math.sin(G.time*2.4);
    g.fillStyle='rgba(255,120,40,'+(0.14+0.12*pulse)+')'; // heat haze
    g.beginPath(); g.ellipse(0,-8,34,20,0,0,TAU); g.fill();
    g.fillStyle='#2e241d'; // charred rock brow
    g.beginPath();
    g.moveTo(-28,4); g.quadraticCurveTo(-26,-28, 0,-32);
    g.quadraticCurveTo(26,-28, 28,4); g.closePath(); g.fill();
    g.strokeStyle='#140f0b'; g.lineWidth=2.6; g.stroke();
    g.fillStyle='#160a06'; // the maw
    g.beginPath(); g.moveTo(-14,4); g.quadraticCurveTo(0,-22,14,4); g.closePath(); g.fill();
    g.fillStyle='rgba(255,140,50,'+(0.35+0.3*pulse)+')'; // fire-glow within
    g.beginPath(); g.moveTo(-10,4); g.quadraticCurveTo(0,-15,10,4); g.closePath(); g.fill();
    g.fillStyle='rgba(255,220,140,'+(0.5*pulse)+')';
    g.beginPath(); g.moveTo(-5,4); g.quadraticCurveTo(0,-8,5,4); g.closePath(); g.fill();
    if(Math.random()<0.25) G.parts.push({x:b.x,y:b.y-0.6,vx:rnd(-0.2,0.2),vy:-rnd(0.4,1),life:rnd(0.7,1.3),color:Math.random()<0.5?'#ff8a44':'rgba(90,84,80,0.5)',size:rnd(1.5,3),grav:-0.1});
    g.restore(); return;
  }
  if(b.kind==='cavemouth'){
    const g=cx; g.save(); g.translate(s.x,s.y);
    g.fillStyle='#3a3f47'; // rock brow
    g.beginPath();
    g.moveTo(-26,4); g.quadraticCurveTo(-24,-26, 0,-30);
    g.quadraticCurveTo(24,-26, 26,4); g.closePath(); g.fill();
    g.strokeStyle='#171a1f'; g.lineWidth=2.4; g.stroke();
    g.fillStyle='#0b0d10'; // the maw
    g.beginPath(); g.moveTo(-13,4); g.quadraticCurveTo(0,-20,13,4); g.closePath(); g.fill();
    const pulse=0.5+0.5*Math.sin(G.time*2.2);
    g.fillStyle='rgba(120,60,180,'+(0.10+0.12*pulse)+')'; // a wrong light inside
    g.beginPath(); g.moveTo(-10,4); g.quadraticCurveTo(0,-15,10,4); g.closePath(); g.fill();
    g.restore(); return;
  }
  const S=SPR[b.kind==='pillar'? (b.broken?'pillarBroken':'pillar') : b.kind];
  if(!S) return;
  if(b.kind!=='boat') drawShadowAt(cx,s.x,s.y, b.kind==='pillar'?12: b.kind==='lamp'?8 : b.kind==='castle'?58 : b.kind==='volcano'?66 : 30);
  const BS=(b.kind==='house'||b.kind==='house2'||b.kind==='forge'||b.kind==='barn'||b.kind==='tower')?1.16:1;
  cx.drawImage(S, s.x-S.width*BS/2, s.y-S.height*BS+ (b.kind==='boat'?18:10), S.width*BS, S.height*BS);
  if((b.kind==='house'||b.kind==='house2'||b.kind==='barn') && b.label) drawSign(b,s,BS);
  if(b.kind==='boat' && G.worldId==='isle' && qs('fittings')==='done'){
    const mx=s.x+2, mb=s.y-6;
    cx.strokeStyle='#4f3a24'; cx.lineWidth=3;
    cx.beginPath(); cx.moveTo(mx,mb); cx.lineTo(mx,mb-52); cx.stroke();
    cx.strokeStyle='#3a2c1c'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(mx-16,mb-46); cx.lineTo(mx+16,mb-46); cx.stroke();
    if(qs('setsail')==='done'){
      const bil=Math.sin(G.time*1.6)*2.5;
      cx.fillStyle='rgba(236,230,214,0.96)';
      cx.beginPath();
      cx.moveTo(mx-15,mb-45);
      cx.quadraticCurveTo(mx-19-bil,mb-28, mx-13-bil,mb-12);
      cx.lineTo(mx+14+bil*0.6,mb-14);
      cx.quadraticCurveTo(mx+18,mb-30, mx+15,mb-45);
      cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(60,45,25,0.5)'; cx.lineWidth=1.5; cx.stroke();
      cx.strokeStyle='rgba(180,60,40,0.8)'; cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(mx-8,mb-44); cx.lineTo(mx-8-bil*0.4,mb-14); cx.stroke();
    } else {
      cx.fillStyle='#d8d2c0';
      cx.beginPath(); cx.roundRect(s.x-14,mb-45,32,7,3); cx.fill();
      cx.strokeStyle='rgba(60,45,25,0.5)'; cx.lineWidth=1; cx.stroke();
    }
  }
  if(b.kind==='forge' || b.kind==='house' || b.kind==='house2'){
    // procedural chimney smoke, anchored to the seated chimney tip
    const tipX=s.x-S.width*BS/2+101*BS, tipY=s.y-S.height*BS+10+36*BS;
    const rate=b.kind==='forge'?0.45:0.28, hs=(b.x*7+b.y*13)%10;
    for(let i=0;i<3;i++){
      const ph=((G.time*rate)+(i/3)+hs*0.137)%1;
      const a=(1-ph)*(b.kind==='forge'?0.30:0.20)*(0.4+0.6*Math.min(1,ph*5));
      if(a<=0.01) continue;
      cx.fillStyle=(b.kind==='forge'?'rgba(120,120,128,':'rgba(205,200,192,')+a+')';
      cx.beginPath();
      cx.arc(tipX+Math.sin(ph*6+hs)*5*ph, tipY-ph*36, 3+ph*7, 0, TAU);
      cx.fill();
    }
  }
  if(b.kind==='lamp' && nightAmount()>0.15){
    cx.fillStyle='rgba(255,215,106,0.9)'; cx.fillRect(s.x-5,s.y-64,10,7);
  }
}
function drawNPC(n,s){
  if(n.hidden) return;
  drawShadowAt(cx,s.x,s.y,14);
  drawHumanoid(cx,s.x,s.y,{...n.look, size:(n.look.size||1)*1.28, dir:n.face, step:n.anim, name:n.name, ph:n.hx*0.7+n.hy*1.3});
  // name
  cx.font='10px Verdana'; cx.textAlign='center';
  cx.fillStyle='rgba(0,0,0,0.55)'; cx.fillText(n.name, s.x+1, s.y-52*(n.look.size||1)+1);
  cx.fillStyle='#ffe9a8'; cx.fillText(n.name, s.x, s.y-52*(n.look.size||1));
  // ambient speech bubble
  if(n.bubbleT>0 && n.bubble){
    let txt=n.bubble; if(txt.length>42) txt=txt.slice(0,40)+'…';
    cx.font='9px Verdana';
    const w=Math.min(cx.measureText(txt).width+14, 200);
    const by=s.y-66*(n.look.size||1);
    cx.globalAlpha=Math.min(1,n.bubbleT*2);
    cx.fillStyle='rgba(20,14,8,0.88)';
    cx.strokeStyle='rgba(201,162,78,0.5)'; cx.lineWidth=1;
    cx.beginPath(); cx.roundRect(s.x-w/2,by-15,w,17,6); cx.fill(); cx.stroke();
    cx.beginPath(); cx.moveTo(s.x-3,by+2); cx.lineTo(s.x+3,by+2); cx.lineTo(s.x,by+6); cx.closePath(); cx.fill();
    cx.fillStyle='#e8dcbd'; cx.textAlign='center';
    cx.fillText(txt, s.x, by-3);
    cx.globalAlpha=1;
  }
  // quest marks
  let mark=null;
  for(const id in QUESTS){
    if(QUESTS[id].giver===n.id){
      if(qs(id)==='active'&&questReady(id)) { mark='?'; break; }
      if(qs(id)==='avail') mark='!';
    }
    if(QUESTS[id].kind==='talk'&&QUESTS[id].talkTo===n.id&&qs(id)==='active'){ mark='?'; break; }
  }
  if(mark){
    const bob=Math.sin(G.time*3)*3;
    cx.font='bold 18px Georgia'; cx.strokeStyle='rgba(0,0,0,0.7)'; cx.lineWidth=3;
    cx.strokeText(mark,s.x,s.y-66+bob);
    cx.fillStyle= mark==='!'? '#ffd76a':'#9be07f';
    cx.fillText(mark,s.x,s.y-66+bob);
  }
}
function drawScorpion(m,s){
  const g=cx; g.save(); g.translate(s.x,s.y);
  const fl=m.face||1, an=Math.sin(m.anim*6)*0.5;
  g.scale(1.25,1.25);
  g.fillStyle='rgba(0,0,0,0.25)';
  g.beginPath(); g.ellipse(0,2,16,6,0,0,TAU); g.fill();
  const bd='#c08a3c', sh='#8a5f24', dk='#5f3f16';
  for(const [lx,ph] of [[-11,0],[-6,2],[6,4],[11,1]]){ // legs
    g.strokeStyle=dk; g.lineWidth=2;
    g.beginPath(); g.moveTo(lx*0.5,-3); g.lineTo(lx,Math.sin(m.anim*8+ph)*1.5+1); g.stroke();
    g.beginPath(); g.moveTo(-lx*0.5,-3); g.lineTo(-lx,Math.sin(m.anim*8+ph+3)*1.5+1); g.stroke();
  }
  g.fillStyle=bd; // segmented body
  for(let i=0;i<3;i++){ g.beginPath(); g.ellipse(-fl*i*4,-4+i*0.4,7-i*1.2,4.5-i*0.6,0,0,TAU); g.fill();
    g.strokeStyle='#3a2810'; g.lineWidth=1.4; g.stroke(); }
  g.fillStyle=sh; // claws
  for(const e of [-1,1]){
    g.beginPath(); g.ellipse(fl*10,e*4-4,4.5,3,e*0.4,0,TAU); g.fill();
    g.strokeStyle='#3a2810'; g.lineWidth=1.4; g.stroke(); }
  g.strokeStyle=sh; g.lineWidth=3.4; // the tail
  g.beginPath(); g.moveTo(-fl*9,-5);
  g.quadraticCurveTo(-fl*15,-12+an, -fl*11,-17+an);
  g.quadraticCurveTo(-fl*8,-20+an, -fl*6,-18+an); g.stroke();
  g.fillStyle='#2c1c0c'; // stinger
  g.beginPath(); g.moveTo(-fl*6,-18+an); g.lineTo(-fl*3.4,-16+an); g.lineTo(-fl*6.4,-15+an);
  g.closePath(); g.fill();
  g.fillStyle='#1a1210';
  g.beginPath(); g.arc(fl*6,-6,1.1,0,TAU); g.arc(fl*8.5,-6,1.1,0,TAU); g.fill();
  g.restore();
}
function drawMob(m,s){
  if((m.snareT||0)>0){
    const ra=0.6+0.4*Math.sin(G.time*6);
    cx.strokeStyle='rgba(111,224,200,'+ra.toFixed(2)+')'; cx.lineWidth=2.5;
    cx.beginPath(); cx.ellipse(s.x,s.y,15,7,0,0,TAU); cx.stroke();
    cx.strokeStyle='rgba(60,150,130,0.7)'; cx.lineWidth=1.6;
    for(let k=0;k<5;k++){ const aa=k/5*TAU+G.time*0.8;
      cx.beginPath(); cx.moveTo(s.x+Math.cos(aa)*13,s.y+Math.sin(aa)*6);
      cx.quadraticCurveTo(s.x+Math.cos(aa)*10,s.y+Math.sin(aa)*4-7, s.x+Math.cos(aa)*8,s.y+Math.sin(aa)*3-3);
      cx.stroke(); }
  }
  if(m.kind==='scorpion'){ drawScorpion(m,s); drawMobBars&&drawMobBars(m,s); return; }
  if(m.kind==='dragon'){
    cx.save(); cx.translate(s.x,s.y); cx.scale(1.5,1.5); drawDragon(cx,0,0,m); cx.restore();
    const nm=m.name||MOBDEF[m.kind].name;
    cx.font='bold 12px Georgia'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,0.65)'; cx.fillText(nm,s.x+1,s.y-114);
    cx.fillStyle= m.enspelled? '#ff9a7a' : '#9fe8c0'; cx.fillText(nm,s.x,s.y-115);
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='wraith'){
    const bobW=Math.sin(m.anim*3.2)*2.5;
    drawShadowAt(cx,s.x,s.y,9);
    cx.save(); cx.translate(s.x,s.y-14+bobW);
    cx.globalAlpha=0.82;
    // tattered shade body, wisping to nothing at the hem
    cx.fillStyle='#1c2233';
    cx.beginPath();
    cx.moveTo(-9,-14);
    cx.quadraticCurveTo(0,-24,9,-14);
    cx.quadraticCurveTo(11,-2,7,8);
    cx.quadraticCurveTo(4,12,2,7);
    cx.quadraticCurveTo(0,13,-2,7);
    cx.quadraticCurveTo(-4,12,-7,8);
    cx.quadraticCurveTo(-11,-2,-9,-14);
    cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(140,170,220,0.35)'; cx.lineWidth=1.4; cx.stroke();
    // deep hood - a shallow brow-cap sitting just over the eyes. A taller ellipse
    // left a dark rounded void below the eyes that read as a gaping mouth.
    cx.fillStyle='#0e1220';
    cx.beginPath(); cx.ellipse(0,-16.6,7,3.5,0,0,TAU); cx.fill();
    // ember eyes - narrowed and angled inward into a hostile scowl; round dots
    // read as a friendly wide-eyed stare, which a wraith should never have.
    const gl=0.7+0.3*Math.sin(m.anim*7), fl=m.face||1;
    for(const [ex,ang,rx] of [[-3,0.55,2.5],[3,-0.55,2.2]]){
      cx.save(); cx.translate(ex*fl,-14.6); cx.rotate(fl*ang);
      cx.fillStyle='rgba(120,190,255,'+(0.25*gl).toFixed(2)+')';   // outer glow
      cx.beginPath(); cx.ellipse(0,0,rx+1.4,1.9,0,0,TAU); cx.fill();
      cx.fillStyle='rgba(150,205,255,'+gl.toFixed(2)+')';          // bright slit
      cx.beginPath(); cx.ellipse(0,0,rx,0.95,0,0,TAU); cx.fill();
      cx.restore();
    }
    // reaching claw when mid-strike
    if(m.swing>0){
      cx.strokeStyle='rgba(140,200,255,0.8)'; cx.lineWidth=2; cx.lineCap='round';
      const fl2=m.face||1;
      cx.beginPath();
      cx.moveTo(fl2*8,-8); cx.lineTo(fl2*14,-4);
      cx.moveTo(fl2*8,-6); cx.lineTo(fl2*13,-1);
      cx.stroke(); cx.lineCap='butt';
    }
    cx.restore();
    // trailing wisps
    if(Math.random()<0.25) burst(m.x+rnd(-0.3,0.3), m.y-rnd(0.2,0.8), 'rgba(140,170,220,0.5)', 1, 1.0);
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='dummy'){
    drawShadowAt(cx,s.x,s.y,10);
    cx.strokeStyle='#5a4326'; cx.lineWidth=5;
    cx.beginPath(); cx.moveTo(s.x,s.y); cx.lineTo(s.x,s.y-34); cx.stroke();
    cx.lineWidth=4; cx.beginPath(); cx.moveTo(s.x-13,s.y-26); cx.lineTo(s.x+13,s.y-26); cx.stroke();
    cx.fillStyle='#c9b070';
    cx.beginPath(); cx.ellipse(s.x,s.y-20,8,11,0,0,TAU); cx.fill();
    cx.strokeStyle='rgba(24,16,10,0.8)'; cx.lineWidth=1.5; cx.stroke();
    cx.beginPath(); cx.arc(s.x,s.y-37,6,0,TAU); cx.fill(); cx.stroke();
    if(m.hurtT>0){ cx.strokeStyle='#ffd76a'; cx.lineWidth=2; cx.beginPath(); cx.arc(s.x,s.y-24,15,0,TAU); cx.stroke(); }
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='boar'){
    drawShadowAt(cx,s.x,s.y,13);
    const trot=Math.sin(m.anim*9)*2, fl4=m.face||1;
    cx.save(); cx.translate(s.x,s.y);
    cx.strokeStyle='#4a3520'; cx.lineWidth=3; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(-7,-8); cx.lineTo(-7+trot,0); cx.moveTo(7,-8); cx.lineTo(7-trot,0); cx.stroke();
    cx.fillStyle='#6a4c2e';
    cx.beginPath(); cx.ellipse(0,-12,14,9,0,0,TAU); cx.fill();
    cx.strokeStyle='rgba(20,14,8,0.9)'; cx.lineWidth=1.8; cx.stroke();
    cx.fillStyle='#4e3820';
    cx.beginPath(); cx.moveTo(-12,-19); cx.quadraticCurveTo(0,-24,12,-19); cx.quadraticCurveTo(0,-20,-12,-19); cx.closePath(); cx.fill();
    cx.fillStyle='#7a5a38';
    cx.beginPath(); cx.ellipse(fl4*13,-11,6.5,5.5,0,0,TAU); cx.fill();
    cx.strokeStyle='rgba(20,14,8,0.9)'; cx.lineWidth=1.6; cx.stroke();
    cx.fillStyle='#9a7a52'; cx.beginPath(); cx.ellipse(fl4*17.5,-10,2.6,2.2,0,0,TAU); cx.fill(); cx.stroke();
    cx.fillStyle='#f0e8d8';
    cx.beginPath(); cx.moveTo(fl4*16,-8); cx.quadraticCurveTo(fl4*20,-10,fl4*19,-13); cx.lineTo(fl4*17,-10); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle='#17100a'; cx.beginPath(); cx.arc(fl4*12,-13,1.3,0,TAU); cx.fill();
    if(m.hurtT>0){ cx.strokeStyle='#ffb26b'; cx.lineWidth=2; cx.beginPath(); cx.arc(0,-12,17,0,TAU); cx.stroke(); }
    cx.restore(); cx.lineCap='butt';
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='brigand'){
    drawShadowAt(cx,s.x,s.y,13);
    drawHumanoid(cx,s.x,s.y,{skin:'#c39a72',hair:'#3a3026',shirt:'#3f5230',pants:'#2c3322',
      hat:'hood',hatColor:'#2f3d24',weapon:'sword',wtier:1,
      swing:m.swing||0, hurt:m.hurtT>0, size:1.18,
      dir:{x:m.face||1,y:0.3}, step:Math.sin(m.anim*7)});
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='raider'){
    drawShadowAt(cx,s.x,s.y,13);
    drawHumanoid(cx,s.x,s.y,{skin:'#b58a66',hair:'#2c2624',shirt:'#5e2a2a',pants:'#332020',
      hat:'hood',hatColor:'#4a1f1f',armor:1,pauldrons:true,weapon:'sword',wtier:1,
      swing:m.swing||0, hurt:m.hurtT>0, size:1.24,
      dir:{x:m.face||1,y:0.3}, step:Math.sin(m.anim*7)});
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='mage'){
    drawShadowAt(cx,s.x,s.y,13);
    drawHumanoid(cx,s.x,s.y,{skin:'#c2a892',hair:'#241a2e',hairstyle:'long',robe:'#4a2a5e',rune:true,
      weapon:'staff', swing:m.swing||0, hurt:m.hurtT>0, size:1.18,
      dir:{x:m.face||1,y:0.3}, step:Math.sin(m.anim*7)*0.5});
    if((m.swing||0)>0.05){ const gl=0.6+0.4*Math.sin(G.time*10); // a hex charge in her hand
      cx.fillStyle='rgba(199,123,255,'+(0.75*gl).toFixed(2)+')';
      cx.beginPath(); cx.arc(s.x+(m.face||1)*9, s.y-26, 4.2, 0,TAU); cx.fill(); }
    drawMobBars&&drawMobBars(m,s); return;
  }
  drawShadowAt(cx,s.x,s.y, m.boss?20: m.kind==='slime'?11:13);
  if(m.windup>0){
    // danger ring + rising crouch: your cue to dodge
    const wp=1-(m.windup/0.42);
    cx.strokeStyle='rgba(230,60,45,'+(0.5+0.35*Math.sin(G.time*24))+')';
    cx.lineWidth=2.5;
    cx.beginPath(); cx.ellipse(s.x,s.y,26+wp*10,(26+wp*10)*0.5,0,0,TAU); cx.stroke();
    cx.fillStyle='rgba(230,60,45,0.95)';
    cx.font='bold 15px Georgia'; cx.textAlign='center';
    cx.fillText('!', s.x, s.y-(m.boss?66:46)-Math.sin(G.time*20)*2);
  }
  cx.save(); cx.translate(s.x,s.y); cx.scale(1.15,1.15); cx.translate(-s.x,-s.y);
  if(m.elite){
    const pl=0.7+0.3*Math.sin(G.time*4+m.hx);
    cx.strokeStyle='rgba(190,30,30,'+(0.55*pl)+')'; cx.lineWidth=2.2;
    cx.beginPath(); cx.ellipse(s.x,s.y,15,7,0,0,TAU); cx.stroke();
    cx.strokeStyle='rgba(255,80,60,'+(0.25*pl)+')'; cx.lineWidth=5;
    cx.beginPath(); cx.ellipse(s.x,s.y,15,7,0,0,TAU); cx.stroke();
    cx.save(); cx.translate(s.x,s.y); cx.scale(1.16,1.16); cx.translate(-s.x,-s.y);
  }
  if(m.kind==='alpha'){
    cx.save(); cx.translate(s.x,s.y); cx.scale(1.9,1.9); cx.translate(-s.x,-s.y);
    drawWolf(cx,s.x,s.y,m);
    cx.restore();
    const gl=0.6+0.4*Math.sin(G.time*6);
    cx.fillStyle='rgba(255,60,40,'+(0.7*gl)+')';
    cx.beginPath(); cx.arc(s.x+m.face*31,s.y-58,2.6,0,TAU); cx.fill();
  }
  else if(m.kind==='slime') drawSlime(cx,s.x,s.y,m);
  else if(m.kind==='wolf') drawWolf(cx,s.x,s.y,m);
  else drawSkeleton(cx,s.x,s.y,m);
  if(m.elite) cx.restore();
  cx.restore(); // character scale
  // hp bar
  if(m.hp<m.maxhp){
  if(m.kind==='archer'){
    cx.strokeStyle='#7a5a34'; cx.lineWidth=2.5;
    cx.beginPath();
    cx.arc(s.x+m.face*9, s.y-27, 10, Math.PI/2, -Math.PI/2, m.face>0);
    cx.stroke();
    cx.strokeStyle='rgba(230,225,210,0.8)'; cx.lineWidth=1;
    cx.beginPath(); cx.moveTo(s.x+m.face*9, s.y-37); cx.lineTo(s.x+m.face*9, s.y-17); cx.stroke();
  }
    const w=m.bigBoss?54:26, top= m.boss?-96: m.kind==='alpha'?-88: m.kind==='slime'?-30:-48;
    cx.fillStyle='rgba(0,0,0,0.6)'; cx.fillRect(s.x-w/2,s.y+top,w,4);
    cx.fillStyle= m.boss?'#78dca0':'#e05648'; cx.fillRect(s.x-w/2,s.y+top,w*clamp(m.hp/m.maxhp,0,1),4);
  }
  if(m.bigBoss){
    const nm=MOBDEF[m.kind].name, ny= m.boss? -102 : -94;
    cx.font='bold 11px Georgia'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,0.6)'; cx.fillText(nm,s.x+1,s.y+ny+1);
    cx.fillStyle= m.boss? '#9fe8c0' : '#ffb0a0'; cx.fillText(nm,s.x,s.y+ny);
  }
}
function drawMoa(s){
  drawShadowAt(cx,s.x,s.y,15);
  const run=Math.sin(P.anim*8);
  cx.save(); cx.translate(s.x,s.y);
  cx.strokeStyle='rgba(20,14,8,0.9)'; cx.lineWidth=3.4; cx.lineCap='round';
  // long runner legs, scissoring
  cx.strokeStyle='#8a6a3a';
  cx.beginPath(); cx.moveTo(-4,-14); cx.lineTo(-6+run*4,-6); cx.lineTo(-7+run*5,0); cx.stroke();
  cx.beginPath(); cx.moveTo(4,-14); cx.lineTo(6-run*4,-6); cx.lineTo(7-run*5,0); cx.stroke();
  // round feathered body
  cx.fillStyle='#7a6242';
  cx.beginPath(); cx.ellipse(0,-19,13,9.5,0,0,TAU); cx.fill();
  cx.strokeStyle='rgba(20,14,8,0.9)'; cx.lineWidth=1.8; cx.stroke();
  cx.fillStyle='#8f7550';
  cx.beginPath(); cx.ellipse(-3,-21,8,5.5,0,0,TAU); cx.fill();
  // tail plume
  cx.fillStyle='#5e4a30';
  cx.beginPath(); cx.moveTo(-12,-22); cx.quadraticCurveTo(-20,-26,-18,-16); cx.quadraticCurveTo(-14,-14,-11,-16); cx.closePath(); cx.fill(); cx.stroke();
  // neck + head, leaning into the run
  const fl3=(P.dir&&P.dir.x<0)?-1:1;
  cx.strokeStyle='#7a6242'; cx.lineWidth=4.5;
  cx.beginPath(); cx.moveTo(fl3*8,-22); cx.quadraticCurveTo(fl3*15,-30,fl3*16,-36); cx.stroke();
  cx.fillStyle='#8f7550';
  cx.beginPath(); cx.arc(fl3*16,-38,4.2,0,TAU); cx.fill();
  cx.strokeStyle='rgba(20,14,8,0.9)'; cx.lineWidth=1.6; cx.stroke();
  cx.fillStyle='#e8b23c';
  cx.beginPath(); cx.moveTo(fl3*19,-38); cx.lineTo(fl3*25,-36.5); cx.lineTo(fl3*19,-35.5); cx.closePath(); cx.fill(); cx.stroke();
  cx.fillStyle='#17100a'; cx.beginPath(); cx.arc(fl3*17,-39,1.2,0,TAU); cx.fill();
  cx.restore(); cx.lineCap='butt';
}
function drawHorse(s){
  const g=cx; g.save(); g.translate(s.x,s.y);
  const fl=(P.dir.x<0)?-1:1, tr=Math.sin(P.anim*7);
  g.scale(1.3,1.3);
  g.fillStyle='rgba(0,0,0,0.28)';
  g.beginPath(); g.ellipse(0,1.5,17,6,0,0,TAU); g.fill();
  const c1='#8a5a34', c2='#6e4426', mane='#3a2614';
  for(const [lx,ph] of [[-9,0],[-4,2.4],[5,1.2],[10,3.6]]){ // legs
    g.strokeStyle=c2; g.lineWidth=3.4; g.lineCap='round';
    g.beginPath(); g.moveTo(lx,-12);
    g.lineTo(lx+(P.moving?Math.sin(P.anim*9+ph)*3.4:0), 0.5); g.stroke();
  }
  const bg=g.createLinearGradient(0,-24,0,-8);
  bg.addColorStop(0,'#9a6a3e'); bg.addColorStop(1,c1);
  g.fillStyle=bg; // barrel body
  g.beginPath(); g.ellipse(0,-15,14.5,7.2,0,0,TAU); g.fill();
  g.strokeStyle='#241608'; g.lineWidth=1.8; g.stroke();
  g.fillStyle=c1; // neck & head
  g.beginPath();
  g.moveTo(fl*10,-19);
  g.quadraticCurveTo(fl*16,-26+tr*0.6, fl*17.5,-29+tr*0.6);
  g.lineTo(fl*22,-27+tr*0.6);
  g.quadraticCurveTo(fl*23,-24+tr*0.6, fl*20,-22.5+tr*0.6);
  g.quadraticCurveTo(fl*15,-20, fl*11,-14);
  g.closePath(); g.fill();
  g.strokeStyle='#241608'; g.lineWidth=1.7; g.stroke();
  g.fillStyle=mane; // mane
  g.beginPath();
  g.moveTo(fl*9.5,-20.5); g.quadraticCurveTo(fl*14,-27, fl*16.5,-30+tr*0.6);
  g.lineTo(fl*14.5,-30+tr*0.6); g.quadraticCurveTo(fl*11,-25, fl*8,-19.5);
  g.closePath(); g.fill();
  g.fillStyle='#1a1210';
  g.beginPath(); g.arc(fl*18.6,-27.5+tr*0.6,0.9,0,TAU); g.fill(); // eye
  g.strokeStyle=mane; g.lineWidth=2.6; // tail
  g.beginPath(); g.moveTo(-fl*13.5,-17);
  g.quadraticCurveTo(-fl*18,-12+tr, -fl*16.5,-5+tr); g.stroke();
  g.fillStyle='#5a3a5e'; // saddle
  g.beginPath(); g.ellipse(-fl*1,-20.5,5.5,2.6,0,0,TAU); g.fill();
  g.strokeStyle='#2c1830'; g.lineWidth=1.4; g.stroke();
  g.restore();
}
function drawPlayer(s){
  if(P.riding){
    if(P.unlocked&&P.unlocked.moa) drawMoa(s); else drawHorse(s);
    const s2={x:s.x, y:s.y-21};
    drawPlayerFigure(s2);
    return;
  }
  if(P.unlocked&&P.unlocked.surf&&!G.interior&&tileAt(Math.floor(P.x),Math.floor(P.y))<=T.SHALLOW){
    // the board: pale wood with a dark stripe, riding its own bow-wave
    const bobS=Math.sin(G.time*5)*1.4;
    cx.save(); cx.translate(s.x,s.y+bobS*0.4);
    cx.fillStyle='rgba(234,246,255,0.5)';
    cx.beginPath(); cx.ellipse(0,3,20,8,0,0,TAU); cx.fill();
    cx.fillStyle='#e0c894';
    cx.beginPath(); cx.ellipse(0,0,16,6,0,0,TAU); cx.fill();
    cx.strokeStyle='rgba(20,14,8,0.85)'; cx.lineWidth=1.6; cx.stroke();
    cx.strokeStyle='#8a6a3a'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(-13,0); cx.lineTo(13,0); cx.stroke();
    cx.restore();
    drawPlayerFigure({x:s.x, y:s.y-3+bobS*0.4});
    return;
  }
  drawShadowAt(cx,s.x,s.y,14);
  drawPlayerFigure(s);
}
function drawPlayerFigure(s){
  const tool = P.weapon==='bow' ? 'bow' : P.weapon==='staff' ? 'staff' :
    ((P.gatherT||0)>0? P.gatherKind :
     P.fishing? 'rod' : (P.unlocked.melee? 'sword' : null)); // kit in hand while gathering; no phantom blade before the forge
  // one adventurer, one outfit - weapons only change what's in your hands
  const expr = P.hurtT>0? 'hurt'
    : (P.cheerT||0)>0? 'happy'
    : G.mobs.some(m=>!m.dead&&m.state==='chase'&&dist(P.x,P.y,m.x,m.y)<9)? 'battle' : 'calm';
  const look={hero:true, expr, skin:'#d8a97a',hair:'#7a4526',shirt:'#3f6e56',pants:'#3c3833',
    pauldrons:P.swordTier>0, trim:P.swordTier>0?'#8a6d30':null,
    hat: has('crown',1)?'crown':null};
  if(P.weapon==='bow') look.quiver=true;   // the quiver joins the kit
  if(P.weapon==='staff') look.rune=true;   // a faint charm-glow, nothing more
  look.armor=P.armor||0;
  drawHumanoid(cx,s.x,s.y,{...look, size:1.32,
    dir:P.dir, step:P.moving?P.anim:0, stillT:P.stillT||0, weapon:tool, swing:P.swing, hurt:P.hurtT>0,
    wtier: tool==='sword'? (P.swordTier||0) : 1});
  // slash arc trail
  if(P.swing>0 && P.weapon==='melee' && !P.fishing){
    const a0=Math.atan2((P.dir.x+P.dir.y)*(TH/2),(P.dir.x-P.dir.y)*(TW/2));
    const pr=1-(P.swing/0.3);
    cx.save(); cx.translate(s.x,s.y-16); cx.rotate(a0); cx.scale(1,0.6);
    cx.globalAlpha=0.6*(P.swing/0.3);
    const grd=cx.createRadialGradient(0,0,12,0,0,44);
    grd.addColorStop(0,'rgba(255,220,160,0)');
    grd.addColorStop(0.7,'rgba(255,220,160,0.06)');
    grd.addColorStop(1,'rgba(255,236,200,0.85)');
    cx.fillStyle=grd;
    cx.beginPath();
    cx.arc(0,0,44,-0.95+pr*0.8,0.95+pr*0.8);
    cx.arc(0,0,17,0.95+pr*0.8,-0.95+pr*0.8,true);
    cx.closePath(); cx.fill();
    cx.restore(); cx.globalAlpha=1;
  }
  if(P.fishing){
    const n=P.fishing.node, ns=worldToScreen(n.x,n.y);
    cx.strokeStyle='rgba(240,235,220,0.7)'; cx.lineWidth=1;
    cx.beginPath(); cx.moveTo(s.x+8,s.y-38); cx.quadraticCurveTo((s.x+ns.x)/2,(s.y+ns.y)/2-18,ns.x,ns.y); cx.stroke();
    if(P.fishing.bit){
      cx.font='bold 22px Georgia'; cx.textAlign='center';
      cx.strokeStyle='rgba(0,0,0,0.8)'; cx.lineWidth=4; cx.strokeText('!',s.x,s.y-64);
      cx.fillStyle='#ffd76a'; cx.fillText('!',s.x,s.y-64);
    }
  }
}
function drawProj(p,s){
  if(p.kind==='arrow'){
    const a=Math.atan2(p.vy*TH/2,p.vx*TW/2);
    cx.save(); cx.translate(s.x,s.y-12); cx.rotate(a);
    cx.strokeStyle='#c9a06a'; cx.lineWidth=2; cx.beginPath(); cx.moveTo(-9,0); cx.lineTo(7,0); cx.stroke();
    cx.fillStyle='#dfe0d8'; cx.beginPath(); cx.moveTo(10,0); cx.lineTo(5,-3); cx.lineTo(5,3); cx.closePath(); cx.fill();
    cx.restore();
  } else if(p.kind==='snarebolt'){
    cx.fillStyle='rgba(111,224,200,0.35)'; cx.beginPath(); cx.arc(s.x,s.y-12,10,0,TAU); cx.fill();
    cx.fillStyle='#8ff0dc'; cx.beginPath(); cx.arc(s.x,s.y-12,5,0,TAU); cx.fill();
    cx.fillStyle='#e8fff8'; cx.beginPath(); cx.arc(s.x,s.y-12,2.2,0,TAU); cx.fill();
  } else if(p.kind==='bolt'){
    cx.fillStyle='rgba(255,154,60,0.35)'; cx.beginPath(); cx.arc(s.x,s.y-12,10,0,TAU); cx.fill();
    cx.fillStyle='#ffce7a'; cx.beginPath(); cx.arc(s.x,s.y-12,5,0,TAU); cx.fill();
    cx.fillStyle='#fff3d0'; cx.beginPath(); cx.arc(s.x,s.y-12,2.4,0,TAU); cx.fill();
  } else if(p.kind==='hex'){
    cx.fillStyle='rgba(150,60,210,0.35)'; cx.beginPath(); cx.arc(s.x,s.y-12,10,0,TAU); cx.fill();
    cx.fillStyle='#c77bff'; cx.beginPath(); cx.arc(s.x,s.y-12,5,0,TAU); cx.fill();
    cx.fillStyle='#f0e0ff'; cx.beginPath(); cx.arc(s.x,s.y-12,2.3,0,TAU); cx.fill();
  } else { // bone
    cx.save(); cx.translate(s.x,s.y-12); cx.rotate(G.time*10);
    cx.fillStyle='#eceee6'; cx.fillRect(-6,-1.6,12,3.2);
    cx.beginPath(); cx.arc(-6,-2,2,0,TAU); cx.arc(-6,2,2,0,TAU); cx.arc(6,-2,2,0,TAU); cx.arc(6,2,2,0,TAU); cx.fill();
    cx.restore();
  }
}
function drawPickup(pt,s){
  const bob=Math.sin(G.time*4+pt.x)*3;
  const ic= pt.pickup==='gold'? ICONS.gold : ICONS.heart;
  cx.drawImage(ic, s.x-10, s.y-14+bob, 20,20);
  if(pt.life<4) { cx.globalAlpha=1; if(Math.sin(G.time*10)>0) cx.globalAlpha=0.4; cx.globalAlpha=1; }
}

/* interact prompt + quest direction */
function drawMarkers(){
  const it=nearestInteract();
  const ib=document.getElementById('interactBtn');
  if(it){
    const px = it.type==='plot'? it.o.x+0.5 : it.o.x;
    const py = it.type==='plot'? it.o.y+0.5 : it.o.y;
    const s=worldToScreen(px,py);
    // ring
    cx.strokeStyle='rgba(255,215,106,0.8)'; cx.lineWidth=2;
    cx.setLineDash([5,4]); cx.lineDashOffset=-G.time*16;
    cx.beginPath(); cx.ellipse(s.x, s.y+2, 20, 9, 0, 0, TAU); cx.stroke();
    cx.setLineDash([]);
    if(!isTouch){
      cx.font='bold 11px Verdana'; cx.textAlign='center';
      const label='[E] '+it.label;
      cx.strokeStyle='rgba(0,0,0,0.75)'; cx.lineWidth=3; cx.strokeText(label,s.x,s.y+24);
      cx.fillStyle='#ffe9a8'; cx.fillText(label,s.x,s.y+24);
    } else { ib.style.display='flex'; ib.textContent=it.label; }
  } else if(isTouch) ib.style.display='none';
  // quest direction arrow (edge of screen)
  const pq=primaryQuest();
  if(pq){
    const tp=questTargetPos(pq);
    if(tp){
      const s=worldToScreen(tp.x,tp.y);
      if(s.x<-30||s.x>VW+30||s.y<-30||s.y>VH+30){
        const cxs=VW/2, cys=VH/2;
        let dx=s.x-cxs, dy=s.y-cys;
        const m=Math.max(Math.abs(dx)/(VW/2-46),Math.abs(dy)/(VH/2-46));
        dx/=m; dy/=m;
        const ax=cxs+dx, ay=cys+dy, ang=Math.atan2(s.y-cys,s.x-cxs);
        cx.save(); cx.translate(ax,ay); cx.rotate(ang);
        cx.fillStyle='rgba(255,154,60,0.9)';
        cx.beginPath(); cx.moveTo(12,0); cx.lineTo(-7,-8); cx.lineTo(-3,0); cx.lineTo(-7,8); cx.closePath(); cx.fill();
        cx.restore();
      } else if(dist(tp.x,tp.y,P.x,P.y)>3){
        const bob=Math.sin(G.time*3)*4;
        cx.fillStyle='rgba(255,154,60,0.9)';
        cx.beginPath(); cx.moveTo(s.x,s.y-38+bob); cx.lineTo(s.x-7,s.y-50+bob); cx.lineTo(s.x+7,s.y-50+bob); cx.closePath(); cx.fill();
      }
    }
  }
}

/* ---- minimap & big map ---- */
const MAPCOL={[T.DEEP]:'#2b5c8f',[T.SHALLOW]:'#4d8fc0',[T.SAND]:'#e2cf93',[T.GRASS]:'#6da34d',
  [T.FOREST]:'#527f3c',[T.RUIN]:'#8f8b83',[T.PATH]:'#b7965f',[T.SOIL]:'#7a5230',[T.PLANK]:'#9c6f42'};
let mapBase=null;
function buildMapBase(){
  mapBase=makeCanvas(MAPW,MAPH,(g)=>{
    for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
      g.fillStyle=MAPCOL[G.map[y*MAPW+x]]; g.fillRect(x,y,1,1);
    }
  });
}
let miniT=0;
function drawMinimap(){
  const c=document.getElementById('minimap'), g=c.getContext('2d');
  g.imageSmoothingEnabled=false;
  g.clearRect(0,0,120,120);
  // window: 48x48 tiles around player
  const vw=48, sx=clamp(P.x-vw/2,0,MAPW-vw), sy=clamp(P.y-vw/2,0,MAPH-vw);
  g.drawImage(mapBase, sx,sy,vw,vw, 0,0,120,120);
  const px=(P.x-sx)/vw*120, py=(P.y-sy)/vw*120;
  g.fillStyle='#fff'; g.beginPath(); g.arc(px,py,3,0,TAU); g.fill();
  g.strokeStyle='#2a1608'; g.stroke();
  const pq=primaryQuest();
  if(pq){ const tp=questTargetPos(pq);
    if(tp){ const qx=clamp((tp.x-sx)/vw*120,4,116), qy=clamp((tp.y-sy)/vw*120,4,116);
      g.fillStyle='#ff9a3c'; g.beginPath(); g.arc(qx,qy,3.4,0,TAU); g.fill(); } }
}
function drawBigMap(){
  const c=document.getElementById('bigMap'), g=c.getContext('2d');
  g.imageSmoothingEnabled=false;
  g.drawImage(mapBase,0,0,384,384);
  const eg=EXPL[G.worldId];
  if(eg){
    g.fillStyle='rgba(22,17,11,0.94)';
    const sc=384/MAPW;
    for(let y=0;y<MAPH;y++){
      let run=-1;
      for(let x=0;x<=MAPW;x++){
        const dark = x<MAPW && !eg[y*MAPW+x];
        if(dark && run<0) run=x;
        else if(!dark && run>=0){ g.fillRect(run*sc, y*sc, (x-run)*sc+0.5, sc+0.5); run=-1; }
      }
    }
  }
  const dot=(x,y,col,r)=>{ g.fillStyle=col; g.beginPath(); g.arc(x/MAPW*384,y/MAPH*384,r||4,0,TAU); g.fill();
    g.strokeStyle='rgba(0,0,0,0.6)'; g.stroke(); };
  g.font='bold 11px Georgia'; g.textAlign='center';
  const pqM=primaryQuest();
  if(pqM){
    const tp=questTargetPos(pqM);
    if(tp){
      const qx=tp.x/MAPW*384, qy=tp.y/MAPH*384;
      g.save(); g.translate(qx,qy); g.rotate(Math.PI/4);
      g.fillStyle='#ffd76a'; g.fillRect(-6,-6,12,12);
      g.strokeStyle='rgba(60,40,0,0.9)'; g.lineWidth=2; g.strokeRect(-6,-6,12,12);
      g.restore();
      g.fillStyle='#ffd76a'; g.fillText('objective', qx, qy+20);
    }
  }
  const lbl=(x,y,text)=>{ const px=x/MAPW*384, py=y/MAPH*384-8;
    g.fillStyle='rgba(0,0,0,0.65)'; g.fillText(text,px+1,py+1); g.fillStyle='#f0e2c0'; g.fillText(text,px,py); };
  P.disc=P.disc||{};
  for(const k in ZONES){ const z=ZONES[k]; if(P.disc[G.worldId+':'+k]) lbl(z.x, z.y-3, z.name); }
  dot(P.x,P.y,'#fff',4);
  const pq=primaryQuest();
  if(pq){ const tp=questTargetPos(pq); if(tp) dot(tp.x,tp.y,'#ff9a3c',5); }
  document.getElementById('mapLegend').innerHTML=
    '<span><b style="color:#fff">●</b> You</span><span><b style="color:#ff9a3c">●</b> Quest</span>'+
    '<span style="color:#ffd76a">Tap a discovered region to travel there.</span>';
}
