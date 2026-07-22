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
/* The vignette's radial gradient never changes except when the viewport
   resizes, yet it was rebuilt every single frame. Cache it, keyed by size. */
let _vgCache=null, _vgKey='';
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
  const CLOUD = !!(WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].cloud);
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const t=G.map[y*MAPW+x], sx=isoX(x,y)+OX, sy=isoY(x,y)+OY;
    if(CLOUD && (t===T.DEEP||t===T.SHALLOW)) continue;   // open sky - stays transparent so the backdrop shows
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
const DYNAMIC_DECOR = {chest:1, chestOpen:1, boat:1, lava:1, lairmouth:1, dungeonmouth:1, icelever:1, boneplate:1, catgate:1, tunnelmouth:1, ashwing:1, kingfire:1,
  cratersmoke:1, lavacrack:1, emberplate:1, firegate:1, emberlever:1, dragonrest:1, icespire:1, emberbutton:1, staffgate:1, leappoint:1};
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
  // sky/ocean backdrop (cloud worlds get open sky instead of dark ocean)
  const CLOUD = !!(WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].cloud);
  cx.fillStyle = CLOUD ? '#bcd6ee' : '#16283e'; cx.fillRect(0,0,VW,VH);
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
      if(CLOUD && (t===T.DEEP||t===T.SHALLOW)) continue;   // open sky - let the backdrop show
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
  for(const b of G.decor){ const cm=b.grand?28:(b.kind==='tower'&&b.tall)?12:2; if(b.x<minX-cm||b.x>maxX+cm||b.y<minY-cm||b.y>maxY+cm) continue;
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
  // dawn/dusk warmth (the tutorial isle holds a fixed daylight, so it skips this)
  const t=G.dayT;
  let warm=0;
  if(G.worldId!=='isle'){
    if(t>0.40&&t<0.52) warm=Math.sin((t-0.40)/0.12*Math.PI)*0.16;
    if(t<0.10) warm=Math.sin((0.10-t)/0.10*Math.PI)*0.10;
  }
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
  // vignette (gradient geometry only depends on VW/VH - build once, reuse)
  if(DBG.vignette && fxOn('vignette')){
    const vk=VW+'x'+VH;
    if(_vgKey!==vk){
      _vgCache=cx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.36,VW/2,VH/2,Math.max(VW,VH)*0.72);
      _vgCache.addColorStop(0,'rgba(0,0,0,0)'); _vgCache.addColorStop(1,'rgba(0,0,0,0.45)');
      _vgKey=vk;
    }
    cx.fillStyle=_vgCache; cx.fillRect(0,0,VW,VH);
  }

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
  // a floating name over a landmark (dungeon mouths etc.) that fades in as you near it
  if(b.name){ const pd=dist(P.x,P.y,b.x,b.y);
    if(pd<12){ const g=cx; g.save(); g.globalAlpha=Math.max(0,Math.min(1,(12-pd)/3.5));
      const ly=s.y+(b.labelY||-46);
      g.font='bold 12px Georgia'; g.textAlign='center';
      g.lineWidth=3.4; g.strokeStyle='rgba(0,0,0,0.8)'; g.strokeText(b.name, s.x, ly);
      g.fillStyle='#ffe9b0'; g.fillText(b.name, s.x, ly);
      g.restore(); } }
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
  if(b.kind==='lettuce'){
    // a leafy head of lettuce - a rosette of blue-green leaves, some nibbled
    cx.fillStyle='rgba(0,0,0,0.14)'; cx.beginPath(); cx.ellipse(s.x,s.y+1,7,3,0,0,TAU); cx.fill();
    const nibbled=b.nibbled;
    for(let i=0;i<7;i++){ const a=i*TAU/7 + (b.ph||0);
      cx.fillStyle= i%2? '#6fa04a':'#7fb35a';
      cx.beginPath(); cx.ellipse(s.x+Math.cos(a)*4, s.y-3+Math.sin(a)*2.4, 4, 3.2, a, 0, TAU); cx.fill(); }
    cx.fillStyle= nibbled? '#8a9a52':'#a8d078'; cx.beginPath(); cx.ellipse(s.x, s.y-4, 3.4, 2.6, 0, 0, TAU); cx.fill();
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
  if(b.kind==='kingfire'){
    const g=cx; g.save(); g.translate(s.x,s.y);
    const t=G.time*9 + (b.ph||0);
    g.fillStyle='rgba(255,120,40,0.22)';                       // heat glow on the ground
    g.beginPath(); g.ellipse(0,0,20,10,0,0,TAU); g.fill();
    for(let i=-1;i<=1;i++){                                     // three licking tongues of flame
      const fx=i*7, sway=Math.sin(t*0.6+i)*3, hh=26+Math.sin(t+i*2)*7;
      const grd=g.createLinearGradient(fx,4,fx,-hh);
      grd.addColorStop(0,'#7a1606'); grd.addColorStop(0.3,'#e23a10');
      grd.addColorStop(0.7,'#ff8a1e'); grd.addColorStop(1,'#ffe07a');
      g.fillStyle=grd;
      g.beginPath();
      g.moveTo(fx-6,4);
      g.quadraticCurveTo(fx-5+sway,-hh*0.4, fx+sway,-hh);
      g.quadraticCurveTo(fx+5+sway,-hh*0.4, fx+6,4);
      g.closePath(); g.fill();
    }
    g.fillStyle='rgba(255,230,150,0.5)';                        // bright core
    g.beginPath(); g.ellipse(0,-6,5,10,0,0,TAU); g.fill();
    g.restore();
    if(fxOn('particles') && Math.random()<0.22) G.parts.push({x:b.x+rnd(-0.3,0.3),y:b.y,
      vx:rnd(-0.2,0.2),vy:-rnd(1,2),life:rnd(0.4,0.9),
      color:Math.random()<0.5?'#ff8a44':'#ffd76a',size:rnd(1.5,3),grav:-0.2});
    return;
  }
  if(b.kind==='warnsign'){
    const g=cx; g.save(); g.translate(s.x,s.y);
    if(typeof drawShadowAt==='function') drawShadowAt(g,0,2,7);
    g.strokeStyle='#5a4026'; g.lineWidth=3.2; g.lineCap='round';   // leaning post
    g.beginPath(); g.moveTo(-2,2); g.lineTo(-4,-22); g.stroke();
    g.save(); g.translate(-4,-20); g.rotate(-0.12);                 // the danger board
    g.fillStyle='#6b4a2a'; g.fillRect(-13,-9,26,15);
    g.strokeStyle='#3a2716'; g.lineWidth=1.5; g.strokeRect(-13,-9,26,15);
    g.fillStyle='#e9e0cf';                                          // a skull, crudely daubed
    g.beginPath(); g.ellipse(0,-2,5,4.5,0,0,TAU); g.fill();
    g.fillRect(-2.5,1,5,3);
    g.fillStyle='#20140b';
    g.beginPath(); g.arc(-2,-2.5,1.3,0,TAU); g.arc(2,-2.5,1.3,0,TAU); g.fill();
    g.restore(); g.restore();
    return;
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
  if(b.kind==='dungeonmouth' && b.ember){
    const g=cx; drawShadowAt(g,s.x,s.y,16); g.save(); g.translate(s.x,s.y);
    const pulse=0.5+0.5*Math.sin(G.time*2.3);
    g.fillStyle='rgba(255,120,40,'+(0.14+0.12*pulse)+')'; // heat haze
    g.beginPath(); g.ellipse(0,-8,32,20,0,0,TAU); g.fill();
    g.fillStyle='#2e241d'; // charred basalt brow
    g.beginPath(); g.moveTo(-27,5); g.quadraticCurveTo(-25,-27,0,-31); g.quadraticCurveTo(25,-27,27,5); g.closePath(); g.fill();
    g.strokeStyle='#120d09'; g.lineWidth=2.6; g.stroke();
    g.fillStyle='#160a06'; // the throat
    g.beginPath(); g.moveTo(-14,5); g.quadraticCurveTo(0,-23,14,5); g.closePath(); g.fill();
    g.fillStyle='rgba(255,140,50,'+(0.36+0.3*pulse)+')'; // fire deep within
    g.beginPath(); g.moveTo(-10,5); g.quadraticCurveTo(0,-16,10,5); g.closePath(); g.fill();
    g.fillStyle='rgba(255,224,140,'+(0.5*pulse)+')';
    g.beginPath(); g.moveTo(-5,5); g.quadraticCurveTo(0,-9,5,5); g.closePath(); g.fill();
    if(Math.random()<0.28) G.parts.push({x:b.x,y:b.y-0.6,vx:rnd(-0.2,0.2),vy:-rnd(0.4,1.1),life:rnd(0.7,1.4),color:Math.random()<0.5?'#ff8a44':'rgba(90,84,80,0.5)',size:rnd(1.5,3),grav:-0.1});
    g.restore(); return;
  }
  if(b.kind==='dungeonmouth'){
    const g=cx; drawShadowAt(g,s.x,s.y,16); g.save(); g.translate(s.x,s.y);
    const pulse=0.5+0.5*Math.sin(G.time*2.0);
    // a jagged ice-fissure ringed in blue rime
    g.fillStyle='rgba(150,210,235,'+(0.14+0.10*pulse)+')'; g.beginPath(); g.ellipse(0,-6,30,18,0,0,TAU); g.fill();
    g.fillStyle='#cfe6f0';   // ice brow / shards
    g.beginPath(); g.moveTo(-26,6); g.lineTo(-20,-24); g.lineTo(-8,-14); g.lineTo(0,-32); g.lineTo(9,-13); g.lineTo(20,-24); g.lineTo(26,6); g.closePath(); g.fill();
    g.strokeStyle='#6f9fb5'; g.lineWidth=2.2; g.stroke();
    g.fillStyle='#0c1a24'; g.beginPath(); g.moveTo(-13,6); g.quadraticCurveTo(0,-18,13,6); g.closePath(); g.fill();  // the dark maw
    g.fillStyle='rgba(150,90,220,'+(0.12+0.14*pulse)+')'; g.beginPath(); g.moveTo(-9,6); g.quadraticCurveTo(0,-12,9,6); g.closePath(); g.fill();  // a wrong violet glow within
    g.restore(); return;
  }
  if(b.kind==='icelever'){
    const g=cx; drawShadowAt(g,s.x,s.y,7); g.save(); g.translate(s.x,s.y);
    g.fillStyle='#7f8a92'; g.beginPath(); g.ellipse(0,-1,6,3,0,0,TAU); g.fill();   // stone base
    g.strokeStyle='#c9d6de'; g.lineWidth=3; g.lineCap='round';
    const ang=b.on? 0.7 : -0.7;                                                     // the throw
    g.beginPath(); g.moveTo(0,-2); g.lineTo(Math.sin(ang)*11,-2-Math.cos(ang)*13); g.stroke();
    g.fillStyle= b.on? '#8fe0b0':'#7fd4ff'; g.beginPath(); g.arc(Math.sin(ang)*11,-2-Math.cos(ang)*13,3.4,0,TAU); g.fill();
    if(!b.on){ g.fillStyle='rgba(127,212,255,'+(0.4+0.3*Math.sin(G.time*3)).toFixed(2)+')'; g.font='bold 14px Georgia'; g.textAlign='center'; g.fillText('!',0,-30); }
    g.restore(); return;
  }
  if(b.kind==='boneplate'){
    const g=cx; g.save(); g.translate(s.x,s.y);
    const lit=b.set, gl=0.4+0.5*Math.sin(G.time*3+b.x);
    // a sunken flagstone plate ringed in bone
    g.fillStyle= lit? '#3a2c4a' : '#2a2622'; g.beginPath(); g.moveTo(0,-11); g.lineTo(15,-2); g.lineTo(0,7); g.lineTo(-15,-2); g.closePath(); g.fill();
    g.strokeStyle= lit? '#c77bff' : '#6a5c4c'; g.lineWidth= lit?2.2:1.6; g.stroke();
    g.fillStyle= lit? 'rgba(199,123,255,'+(0.20+0.20*gl).toFixed(2)+')' : 'rgba(20,16,14,0.5)';
    g.beginPath(); g.moveTo(0,-7); g.lineTo(10,-2); g.lineTo(0,4); g.lineTo(-10,-2); g.closePath(); g.fill();
    if(b.ord){ // ordered sigil-plates show a roman numeral
      g.fillStyle= lit? '#f0d8ff' : '#8a7c6c'; g.font='bold 11px Georgia'; g.textAlign='center'; g.textBaseline='middle';
      g.fillText(['','I','II','III','IV','V'][b.ord]||'', 0, -2); g.textBaseline='alphabetic';
    } else if(lit){ g.fillStyle='#e8d0ff'; g.beginPath(); g.arc(0,-2,2.2,0,TAU); g.fill(); }
    g.restore(); return;
  }
  if(b.kind==='catgate'){
    const g=cx; g.save(); g.translate(s.x,s.y);
    if(b.open){ // raised into the ceiling - just the top lintel and stubs remain
      g.fillStyle='#3a332c'; g.fillRect(-30,-44,60,7);
      g.strokeStyle='#1c1814'; g.lineWidth=1.4; g.strokeRect(-30,-44,60,7);
      g.fillStyle='#2a241e'; for(let i=-2;i<=2;i++){ g.fillRect(i*11-2,-44,4,7); }
      g.restore(); return;
    }
    drawShadowAt(g,s.x,s.y,30);
    // an iron portcullis dropped across the corridor
    g.fillStyle='#3a332c'; g.fillRect(-30,-40,60,6);           // top lintel
    g.strokeStyle='#1c1814'; g.lineWidth=1.6;
    g.fillStyle='#4a423a';
    for(let i=-2;i<=2;i++){ g.fillRect(i*11-2.5,-38,5,38); g.strokeRect(i*11-2.5,-38,5,38); }  // vertical bars
    g.fillStyle='#3f382f'; for(let yy=-30;yy<=-4;yy+=13){ g.fillRect(-27,yy,54,3.5); }          // cross-bars
    g.fillStyle='#5a5048'; for(let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(i*11,-38); g.lineTo(i*11-4,-32); g.lineTo(i*11+4,-32); g.closePath(); g.fill(); } // spiked feet up top
    g.restore(); return;
  }
  if(b.kind==='ashwing'){
    cx.save(); cx.translate(s.x,s.y); cx.scale(1.4,1.4);
    drawDragon(cx,0,0,{face:b.face||-1, enspelled:false, hurtT:0});
    cx.restore(); return;
  }
  if(b.kind==='icespire'){
    const g=cx; drawShadowAt(g,s.x,s.y,10); g.save(); g.translate(s.x,s.y);
    const gl=0.5+0.5*Math.sin(G.time*1.6+b.x);
    // a cluster of faceted ice crystals, blue-white with a cold inner glow
    const spire=(dx,h,w,c1,c2)=>{ g.fillStyle=c1;
      g.beginPath(); g.moveTo(dx-w,2); g.lineTo(dx,2-h); g.lineTo(dx+w,2); g.closePath(); g.fill();
      g.fillStyle=c2; g.beginPath(); g.moveTo(dx,2-h); g.lineTo(dx+w,2); g.lineTo(dx+w*0.2,2); g.closePath(); g.fill(); };
    spire(-5,14,4.5,'#bfe6f4','#8fc4dd');
    spire(6,11,4,'#bfe6f4','#8fc4dd');
    spire(0,24,5.5,'#d6f2fb','#a6d6ea');                       // the tall central shard
    g.strokeStyle='rgba(90,150,180,0.7)'; g.lineWidth=1;
    g.beginPath(); g.moveTo(0,2); g.lineTo(0,2-22); g.stroke();
    g.fillStyle='rgba(200,240,255,'+(0.25+0.25*gl).toFixed(2)+')'; // cold glow
    g.beginPath(); g.ellipse(0,-6,9,12,0,0,TAU); g.fill();
    g.restore(); return;
  }
  if(b.kind==='cratersmoke'){
    const g=cx, t=G.time; g.save(); g.translate(s.x,s.y);
    // a red heat-glow boiling over the caldera
    const gg=g.createRadialGradient(0,-16,4,0,-16,72);
    gg.addColorStop(0,'rgba(255,120,40,0.22)'); gg.addColorStop(1,'rgba(255,60,20,0)');
    g.fillStyle=gg; g.beginPath(); g.ellipse(0,-12,66,46,0,0,TAU); g.fill();
    // a lazy rising smoke column - stacked, drifting puffs
    for(let i=0;i<8;i++){ const yy=-18 - i*15 - ((t*10)%15);
      const xx=Math.sin(t*0.5+i*0.8)*7*(1+i*0.12), rr=9+i*2.8, k=70-i*5;
      g.fillStyle='rgba('+k+','+(k-4)+','+(k-8)+','+(0.28-i*0.03).toFixed(3)+')';
      g.beginPath(); g.ellipse(xx,yy,rr,rr*0.8,0,0,TAU); g.fill(); }
    if(Math.random()<0.5) G.parts.push({x:b.x,y:b.y,vx:rnd(-0.4,0.4),vy:-rnd(1.2,2.6),life:rnd(0.8,1.8),color:Math.random()<0.6?'#ff8a44':'#ffd050',size:rnd(1.2,2.8),grav:-0.12});
    g.restore(); return;
  }
  if(b.kind==='lavacrack'){
    const g=cx, gl=0.45+0.4*Math.sin(G.time*2.2+b.seed*1.3);
    g.save(); g.translate(s.x,s.y);
    const cr=mulberry32((b.seed*131+7)>>>0);
    const n=b.big?3:2, len=b.big?9:6;
    g.strokeStyle='rgba(255,140,50,'+(0.5*gl+0.18).toFixed(3)+')'; g.lineWidth=b.big?2.4:1.5; g.lineCap='round';
    for(let k=0;k<n;k++){ const a=cr()*TAU; let px=0,py=0;
      g.beginPath(); g.moveTo(0,0);
      for(let seg=0;seg<3;seg++){ px+=Math.cos(a)*len*(0.5+cr()*0.6); py+=Math.sin(a)*len*0.5*(0.5+cr()*0.6); g.lineTo(px,py); }
      g.stroke(); }
    g.fillStyle='rgba(255,220,120,'+(0.5*gl+0.28).toFixed(3)+')';
    g.beginPath(); g.ellipse(0,0,b.big?2.6:1.6,b.big?1.5:1,0,0,TAU); g.fill();
    if(b.big && Math.random()<0.04) G.parts.push({x:b.x,y:b.y-0.1,vx:rnd(-0.2,0.2),vy:-rnd(0.5,1.4),life:rnd(0.6,1.2),color:'#ff8a44',size:rnd(1,2.2),grav:-0.05});
    g.restore(); return;
  }
  if(b.kind==='ewall'){
    // a chunky raised block of basalt - the dungeon's real walls
    const g=cx, H=16, v=b.s||0;
    g.save(); g.translate(s.x,s.y);
    g.fillStyle='#2f2823';   // left face (bottom-left, toward camera)
    g.beginPath(); g.moveTo(-32,0); g.lineTo(0,16); g.lineTo(0,16-H); g.lineTo(-32,-H); g.closePath(); g.fill();
    g.fillStyle='#241e19';   // right face (bottom-right)
    g.beginPath(); g.moveTo(32,0); g.lineTo(0,16); g.lineTo(0,16-H); g.lineTo(32,-H); g.closePath(); g.fill();
    g.fillStyle='#48403a';   // top face (raised diamond)
    g.beginPath(); g.moveTo(0,-16-H); g.lineTo(32,-H); g.lineTo(0,16-H); g.lineTo(-32,-H); g.closePath(); g.fill();
    g.fillStyle='rgba(0,0,0,0.16)';   // basalt speckle
    g.beginPath(); g.ellipse(-7+v*3,-H-2,4,2,0,0,TAU); g.fill();
    g.beginPath(); g.ellipse(8-v*2,-H+3,3,1.6,0,0,TAU); g.fill();
    g.strokeStyle='rgba(122,106,92,0.5)'; g.lineWidth=1;   // top ridge highlight
    g.beginPath(); g.moveTo(-32,-H); g.lineTo(0,-16-H); g.lineTo(32,-H); g.stroke();
    g.restore(); return;
  }
  if(b.kind==='emberbutton'){
    const g=cx; const lit=b.set, gl=0.4+0.5*Math.sin(G.time*3+b.x);
    g.save(); g.translate(s.x,s.y);
    drawShadowAt(g,0,2,7);
    g.fillStyle='#2a231d';   // stubby basalt pedestal
    g.beginPath(); g.moveTo(-7,-2); g.lineTo(0,2); g.lineTo(7,-2); g.lineTo(7,-12); g.lineTo(0,-16); g.lineTo(-7,-12); g.closePath(); g.fill();
    g.strokeStyle='#140f0b'; g.lineWidth=1.4; g.stroke();
    g.fillStyle= lit? '#5a2c14' : '#241d18';   // the rune face on top
    g.beginPath(); g.moveTo(0,-20); g.lineTo(9,-15); g.lineTo(0,-10); g.lineTo(-9,-15); g.closePath(); g.fill();
    g.strokeStyle= lit? '#ff9a3c':'#5c4a38'; g.lineWidth= lit?2.2:1.5; g.stroke();
    if(lit){ g.fillStyle='rgba(255,150,60,'+(0.25+0.25*gl).toFixed(2)+')';
      g.beginPath(); g.moveTo(0,-18); g.lineTo(6,-15); g.lineTo(0,-12); g.lineTo(-6,-15); g.closePath(); g.fill(); }
    g.fillStyle= lit? '#ffe0b0':'#8a7160'; g.font='bold 10px Georgia'; g.textAlign='center'; g.textBaseline='middle';
    g.fillText(['','I','II','III','IV','V'][b.ord]||'', 0,-15); g.textBaseline='alphabetic';
    if(!lit){ g.fillStyle='rgba(255,154,60,'+(0.35+0.3*Math.sin(G.time*3+b.x)).toFixed(2)+')'; g.font='bold 13px Georgia'; g.textAlign='center'; g.fillText('!',0,-30); }
    if(lit && Math.random()<0.05) G.parts.push({x:b.x,y:b.y-0.4,vx:rnd(-0.15,0.15),vy:-rnd(0.4,1),life:rnd(0.5,1),color:'#ffb04a',size:rnd(1,2),grav:-0.05});
    g.restore(); return;
  }
  if(b.kind==='emberplate'){
    const g=cx; g.save(); g.translate(s.x,s.y);
    const lit=b.set, gl=0.4+0.5*Math.sin(G.time*3+b.x);
    // a sunken basalt plate rimmed in iron; a font-bowl that kindles when trodden
    g.fillStyle= lit? '#4a2a18' : '#241f1b'; g.beginPath(); g.moveTo(0,-11); g.lineTo(15,-2); g.lineTo(0,7); g.lineTo(-15,-2); g.closePath(); g.fill();
    g.strokeStyle= lit? '#ff9a3c' : '#5c4a38'; g.lineWidth= lit?2.2:1.6; g.stroke();
    g.fillStyle= lit? 'rgba(255,150,60,'+(0.24+0.22*gl).toFixed(2)+')' : 'rgba(20,14,10,0.5)';
    g.beginPath(); g.moveTo(0,-7); g.lineTo(10,-2); g.lineTo(0,4); g.lineTo(-10,-2); g.closePath(); g.fill();
    if(b.ord){ g.fillStyle= lit? '#ffe0b0' : '#8a7160'; g.font='bold 11px Georgia'; g.textAlign='center'; g.textBaseline='middle';
      g.fillText(['','I','II','III','IV','V'][b.ord]||'', 0, -2); g.textBaseline='alphabetic';
    } else if(lit){ g.fillStyle='#ffe6c0'; g.beginPath(); g.arc(0,-2,2.2,0,TAU); g.fill(); }
    if(lit && Math.random()<0.06) G.parts.push({x:b.x,y:b.y-0.1,vx:rnd(-0.2,0.2),vy:-rnd(0.4,1.1),life:rnd(0.5,1.1),color:'#ffb04a',size:rnd(1,2.2),grav:-0.06});
    g.restore(); return;
  }
  if(b.kind==='firegate'){
    const g=cx; g.save(); g.translate(s.x,s.y);
    // the gate spans x0..x1 - a whole 3-tile corridor that renders as a down-right
    // diagonal of diamonds. Draw ONE portcullis panel per tile so the entire wall
    // is plugged; a single centred billboard used to leave the flanking tiles bare.
    const c0=(b.x0+b.x1)/2, tiles=[]; for(let tx=b.x0; tx<=b.x1; tx++) tiles.push(tx);
    if(b.open){ // hauled up into the rock - only the lintel and stubs remain
      for(const tx of tiles){ const ox=(tx-c0)*32, oy=(tx-c0)*16;
        g.fillStyle='#3a2820'; g.fillRect(ox-18,oy-44,36,7); g.strokeStyle='#160d08'; g.lineWidth=1.4; g.strokeRect(ox-18,oy-44,36,7);
        g.fillStyle='#2a1c14'; for(let i=-1;i<=1;i++){ g.fillRect(ox+i*11-2,oy-44,4,7); } }
      g.restore(); return;
    }
    drawShadowAt(g,s.x,s.y,44);
    for(const tx of tiles){ const ox=(tx-c0)*32, oy=(tx-c0)*16;
      // an iron portcullis with a molten underglow seeping through the bars
      g.fillStyle='rgba(255,120,40,'+(0.10+0.10*Math.sin(G.time*2.4+tx)).toFixed(3)+')';
      g.beginPath(); g.ellipse(ox,oy-6,20,13,0,0,TAU); g.fill();
      g.fillStyle='#33261c'; g.fillRect(ox-18,oy-40,36,6);
      g.strokeStyle='#140c06'; g.lineWidth=1.5;
      g.fillStyle='#4a382a';
      for(let i=-1;i<=1;i++){ g.fillRect(ox+i*11-2.5,oy-38,5,38); g.strokeRect(ox+i*11-2.5,oy-38,5,38); }
      g.fillStyle='#3a2c20'; for(let yy=-30;yy<=-4;yy+=13){ g.fillRect(ox-16,oy+yy,32,3.5); }
      g.fillStyle='#5a4436'; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(ox+i*11,oy-38); g.lineTo(ox+i*11-4,oy-32); g.lineTo(ox+i*11+4,oy-32); g.closePath(); g.fill(); }
    }
    g.restore(); return;
  }
  if(b.kind==='leappoint'){
    // a jutting stone launch-shelf over the cloud-drop, with a windsock cairn
    const g=cx; drawShadowAt(g,s.x,s.y,20); g.save(); g.translate(s.x,s.y);
    g.fillStyle='#6a6270'; g.beginPath(); g.moveTo(-26,2); g.lineTo(0,14); g.lineTo(26,2); g.lineTo(20,-6); g.lineTo(0,2); g.lineTo(-20,-6); g.closePath(); g.fill();
    g.fillStyle='#4a4450'; g.beginPath(); g.moveTo(-26,2); g.lineTo(0,14); g.lineTo(0,10); g.lineTo(-24,0); g.closePath(); g.fill();
    // a cairn post with a fluttering wind-streamer
    g.strokeStyle='#5a4a38'; g.lineWidth=3; g.beginPath(); g.moveTo(-2,0); g.lineTo(-4,-26); g.stroke();
    const t=G.time, sway=Math.sin(t*3)*4;
    g.fillStyle='rgba(201,176,255,0.85)'; g.beginPath(); g.moveTo(-4,-26); g.lineTo(-4+14+sway,-22); g.lineTo(-4+13+sway,-18); g.lineTo(-4,-20); g.closePath(); g.fill();
    // a couple of drifting cloud-wisps at the lip
    g.fillStyle='rgba(230,235,245,0.5)';
    g.beginPath(); g.ellipse(14+Math.sin(t*1.3)*3, 8, 12, 4, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(-16+Math.cos(t*1.1)*3, 10, 10, 3.5, 0, 0, TAU); g.fill();
    g.restore(); return;
  }
  if(b.kind==='staffgate'){
    if(b.open) return;   // the ward is broken - nothing to draw
    const g=cx; g.save(); g.translate(s.x,s.y);
    const cxT=Math.floor(b.x), cyT=Math.floor(b.y), t=G.time;
    // one shimmering ember-fence panel per doorway tile, so the whole gap is warded
    for(const [tx,ty] of (b.tiles||[[cxT,cyT]])){
      const dxw=tx-cxT, dyw=ty-cyT, ox=(dxw-dyw)*32, oy=(dxw+dyw)*16;
      g.save(); g.translate(ox,oy);
      // a soft heat-haze glow behind the bars
      g.fillStyle='rgba(255,130,50,'+(0.12+0.07*Math.sin(t*3+tx+ty)).toFixed(3)+')';
      g.beginPath(); g.ellipse(0,-15,20,24,0,0,TAU); g.fill();
      // the runic lintel + sill the ward hangs between
      g.fillStyle='#3a281c'; g.fillRect(-15,-36,30,4); g.fillRect(-15,0,30,4);
      g.fillStyle='#c9a24e'; g.fillRect(-15,-33,30,1.2); g.fillRect(-15,1,30,1.2);
      // shimmering vertical ember-bars, swaying like flame
      for(let i=-2;i<=2;i++){ const bx=i*6.5, sway=Math.sin(t*4+i*1.3+tx)*1.6;
        g.strokeStyle='rgba(255,120,40,0.6)'; g.lineWidth=2.8; g.lineCap='round';
        g.beginPath(); g.moveTo(bx+sway,-33); g.lineTo(bx-sway,1); g.stroke();
        g.strokeStyle='rgba(255,225,150,0.85)'; g.lineWidth=1.1;
        g.beginPath(); g.moveTo(bx+sway,-33); g.lineTo(bx-sway,1); g.stroke(); }
      g.lineCap='butt';
      // glyph anchors top & bottom
      g.fillStyle='rgba(255,190,100,0.95)'; g.beginPath(); g.arc(0,-34,2.2,0,TAU); g.arc(0,2,2.2,0,TAU); g.fill();
      g.restore();
      if(Math.random()<0.14) G.parts.push({x:tx+0.5,y:ty+0.5,vx:rnd(-0.1,0.1),vy:-rnd(0.3,0.9),life:rnd(0.5,1.1),color:'#ffb04a',size:rnd(1,2),grav:-0.05});
    }
    g.restore(); return;
  }
  if(b.kind==='emberlever'){
    const g=cx; drawShadowAt(g,s.x,s.y,7); g.save(); g.translate(s.x,s.y);
    g.fillStyle='#5c4a38'; g.beginPath(); g.ellipse(0,-1,6,3,0,0,TAU); g.fill();
    g.strokeStyle='#c9b090'; g.lineWidth=3; g.lineCap='round';
    const ang=b.on? 0.7 : -0.7;
    g.beginPath(); g.moveTo(0,-2); g.lineTo(Math.sin(ang)*11,-2-Math.cos(ang)*13); g.stroke();
    g.fillStyle= b.on? '#ff9a3c':'#ffcf6a'; g.beginPath(); g.arc(Math.sin(ang)*11,-2-Math.cos(ang)*13,3.4,0,TAU); g.fill();
    if(!b.on){ g.fillStyle='rgba(255,180,80,'+(0.4+0.3*Math.sin(G.time*3)).toFixed(2)+')'; g.font='bold 14px Georgia'; g.textAlign='center'; g.fillText('!',0,-30); }
    g.restore(); return;
  }
  if(b.kind==='dragonrest'){
    // the old dragon dozing on his fire-shelf; hidden while his enthralled self rages
    const out = G.mobs && G.mobs.some(m=>m.kind==='dragon' && !m.dead);
    if(out) return;
    const g=cx;
    g.save(); g.translate(s.x,s.y); g.scale(1.4,1.4);
    try{ drawDragon(g,0,0,{face:1, enspelled:false, hurtT:0}); }catch(e){}
    g.restore();
    // his name floats over the fire-shelf
    g.font='bold 12px Georgia'; g.textAlign='center';
    g.fillStyle='rgba(0,0,0,0.6)'; g.fillText('Ashwing',s.x+1,s.y-64);
    g.fillStyle='#9fe8c0'; g.fillText('Ashwing',s.x,s.y-65);
    return;
  }
  if(b.kind==='tunnelmouth'){
    const g=cx; drawShadowAt(g,s.x,s.y,14);
    g.save(); g.translate(s.x,s.y);
    g.fillStyle='#4a4038'; g.beginPath(); // stacked-stone arch
    g.moveTo(-22,4); g.quadraticCurveTo(-20,-26,0,-30); g.quadraticCurveTo(20,-26,22,4); g.closePath(); g.fill();
    g.strokeStyle='#231d18'; g.lineWidth=2.4; g.stroke();
    g.fillStyle='#0c0a08'; g.beginPath(); g.moveTo(-12,4); g.quadraticCurveTo(0,-22,12,4); g.closePath(); g.fill();
    g.strokeStyle='#6a5c4c'; g.lineWidth=1.4; // shoring timbers
    g.beginPath(); g.moveTo(-13,4); g.lineTo(-13,-14); g.moveTo(13,4); g.lineTo(13,-14); g.moveTo(-14,-14); g.lineTo(14,-14); g.stroke();
    g.restore(); return;
  }
  if(b.kind==='tome'){
    const g=cx; drawShadowAt(g,s.x,s.y,10);
    g.save(); g.translate(s.x,s.y);
    if(b.destroyed){ // a scorch of ash where it burned
      g.fillStyle='rgba(40,30,44,0.7)'; g.beginPath(); g.ellipse(0,-2,10,5,0,0,TAU); g.fill();
      g.restore(); return;
    }
    // stone lectern
    g.fillStyle='#5a5048'; g.beginPath(); g.moveTo(-6,0); g.lineTo(6,0); g.lineTo(4,-14); g.lineTo(-4,-14); g.closePath(); g.fill();
    g.strokeStyle='#2c261f'; g.lineWidth=1.6; g.stroke();
    // the book, hovering, breathing violet light
    const bob=Math.sin(G.time*2)*2, gl=0.5+0.5*Math.sin(G.time*3);
    g.fillStyle='rgba(199,123,255,'+(0.22*gl).toFixed(2)+')'; g.beginPath(); g.arc(0,-26+bob,20,0,TAU); g.fill();
    g.save(); g.translate(0,-26+bob);
    g.fillStyle='#3a2050'; g.beginPath(); g.moveTo(-11,-7); g.lineTo(0,-9); g.lineTo(11,-7); g.lineTo(11,7); g.lineTo(0,9); g.lineTo(-11,7); g.closePath(); g.fill();
    g.strokeStyle='#8a5ac0'; g.lineWidth=1.4; g.stroke();
    g.fillStyle='#e8d8ff'; g.beginPath(); g.moveTo(-10,-6); g.lineTo(0,-8); g.lineTo(0,8); g.lineTo(-10,6); g.closePath(); g.fill(); // left page
    g.fillStyle='#d8c4f0'; g.beginPath(); g.moveTo(10,-6); g.lineTo(0,-8); g.lineTo(0,8); g.lineTo(10,6); g.closePath(); g.fill();
    g.strokeStyle='rgba(120,60,180,'+gl.toFixed(2)+')'; g.lineWidth=1; // glyphs crawling on the pages
    for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(-8,-3+i*3); g.lineTo(-2,-3.5+i*3); g.moveTo(3,-3+i*3); g.lineTo(9,-3.5+i*3); g.stroke(); }
    g.fillStyle='#c77bff'; g.beginPath(); g.arc(0,0,2.2+Math.sin(G.time*5)*0.6,0,TAU); g.fill(); // a violet eye at the spine
    g.restore();
    if(Math.random()<0.12) G.parts.push({x:b.x,y:b.y-1.6,vx:rnd(-0.15,0.15),vy:-rnd(0.2,0.6),life:rnd(0.8,1.6),color:'#c77bff',size:rnd(1.5,3),grav:-0.03});
    g.restore(); return;
  }
  if(b.kind==='woodpile'){
    const g=cx; drawShadowAt(g,s.x,s.y,16);
    g.save(); g.translate(s.x,s.y);
    const drawLog=(x,y)=>{ g.fillStyle='#b08a52'; g.beginPath(); g.arc(x,y,4.4,0,TAU); g.fill();
      g.strokeStyle='#6a4a2c'; g.lineWidth=1; g.stroke();
      g.strokeStyle='rgba(90,60,30,0.5)'; g.beginPath(); g.arc(x,y,2.5,0,TAU); g.stroke();
      g.beginPath(); g.arc(x,y,1,0,TAU); g.stroke(); };
    for(let r=0;r<3;r++){ const n=5-r; for(let i=0;i<n;i++) drawLog(-((n-1)*4.5)+i*9, -4 - r*7); }
    // the top course radiates in the royal five-point mark
    g.save(); g.translate(0,-26);
    g.strokeStyle='#9a7440'; g.lineWidth=3.2; g.lineCap='round';
    for(let i=0;i<5;i++){ const a=-Math.PI/2+i*TAU/5; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*9,Math.sin(a)*9*0.6); g.stroke(); }
    g.fillStyle='#c8a25a'; g.beginPath(); g.arc(0,0,2.4,0,TAU); g.fill();
    g.strokeStyle='#6a4a2c'; g.lineWidth=1; g.stroke();
    g.restore(); g.restore(); cx.lineCap='butt'; return;
  }
  if(b.kind==='windmill'){
    const g=cx; drawShadowAt(g,s.x,s.y,150);
    g.save(); g.translate(s.x,s.y); g.scale(5.4,5.4); // a colossal landmark mill
    const th=90;
    g.beginPath(); g.moveTo(-21,0); g.lineTo(-13,-th); g.lineTo(13,-th); g.lineTo(21,0); g.closePath();
    g.fillStyle='#dccdb0'; g.fill();
    g.fillStyle='rgba(0,0,0,0.13)'; g.beginPath(); g.moveTo(-21,0); g.lineTo(-13,-th); g.lineTo(-5,-th); g.lineTo(-10,0); g.closePath(); g.fill();
    g.strokeStyle='rgba(120,105,78,0.5)'; g.lineWidth=1; for(let yy=-th+12; yy<-6; yy+=15){ const wd=13+(21-13)*(-yy/th); g.beginPath(); g.moveTo(-wd,yy); g.lineTo(wd,yy); g.stroke(); }
    // a proper full-height arched door at the mill's foot (the old one was a tiny
    // mouse-hole against this colossus - this reads as a real entrance)
    g.fillStyle='#4a3120';
    g.beginPath(); g.moveTo(-5,0); g.lineTo(-5,-9); g.quadraticCurveTo(0,-15,5,-9); g.lineTo(5,0); g.closePath(); g.fill();
    g.strokeStyle='#281a0e'; g.lineWidth=1; g.stroke();
    g.strokeStyle='#2c1c10'; g.lineWidth=0.7; g.beginPath(); g.moveTo(0,-13); g.lineTo(0,0); g.stroke();  // door split
    // planked timber grain + a stone lintel arch so it reads as a doorway, not a hole
    g.strokeStyle='rgba(40,26,14,0.5)'; g.lineWidth=0.5;
    for(let yy=-3;yy>-9;yy-=3){ g.beginPath(); g.moveTo(-5,yy); g.lineTo(5,yy); g.stroke(); }
    g.fillStyle='#c9a24e'; g.beginPath(); g.arc(2.5,-4.5,0.9,0,TAU); g.arc(-2.5,-4.5,0.9,0,TAU); g.fill();  // handles
    g.fillStyle='#8fc0dd'; g.fillRect(-5,-54,10,10); g.strokeStyle='#5c3d22'; g.lineWidth=1.4; g.strokeRect(-5,-54,10,10);
    g.fillStyle='#7a4a3a'; g.beginPath(); g.moveTo(-16,-th); g.lineTo(0,-th-22); g.lineTo(16,-th); g.closePath(); g.fill();
    const rot=G.time*0.8 + b.x*0.7; g.translate(0,-th-3);
    for(let i=0;i<4;i++){ const a=rot+i*Math.PI/2, ex=Math.cos(a)*36, ey=Math.sin(a)*36;
      g.strokeStyle='#5c3d22'; g.lineWidth=3.2; g.beginPath(); g.moveTo(0,0); g.lineTo(ex,ey); g.stroke();
      g.fillStyle='rgba(238,232,216,0.94)'; const px=Math.cos(a+0.32)*31, py=Math.sin(a+0.32)*31;
      g.beginPath(); g.moveTo(ex*0.18,ey*0.18); g.lineTo(ex,ey); g.lineTo(px,py); g.closePath(); g.fill(); }
    g.fillStyle='#3a2c1c'; g.beginPath(); g.arc(0,0,4,0,TAU); g.fill();
    g.restore(); return;
  }
  if(b.kind==='waterwheel'){
    const g=cx; drawShadowAt(g,s.x,s.y,140);
    g.save(); g.translate(s.x,s.y); g.scale(5.2,5.2); // a colossal turning wheel
    g.fillStyle='#c9b48a'; g.fillRect(-24,-48,42,48);
    g.fillStyle='#8f5a44'; g.beginPath(); g.moveTo(-28,-48); g.lineTo(-3,-66); g.lineTo(22,-48); g.closePath(); g.fill();
    g.fillStyle='#5c3d22'; g.fillRect(-16,-20,12,20);
    g.fillStyle='#8fc0dd'; g.fillRect(0,-40,10,10); g.strokeStyle='#5c3d22'; g.lineWidth=1.4; g.strokeRect(0,-40,10,10);
    const rot=G.time*1.0, wcx=26, wcy=-14, rr=21;
    g.save(); g.translate(wcx,wcy);
    g.fillStyle='rgba(140,205,225,0.45)'; g.beginPath(); g.ellipse(0,rr-2,18,5,0,0,TAU); g.fill();
    g.strokeStyle='#6a4a2c'; g.lineWidth=3; g.beginPath(); g.arc(0,0,rr,0,TAU); g.stroke(); g.beginPath(); g.arc(0,0,rr*0.5,0,TAU); g.stroke();
    for(let i=0;i<8;i++){ const a=rot+i*Math.PI/4;
      g.strokeStyle='#6a4a2c'; g.lineWidth=2.4; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); g.stroke();
      g.save(); g.translate(Math.cos(a)*rr,Math.sin(a)*rr); g.rotate(a); g.fillStyle='#7a5432'; g.fillRect(-5,-2.5,10,5); g.restore(); }
    g.fillStyle='#3a2c1c'; g.beginPath(); g.arc(0,0,3,0,TAU); g.fill();
    g.restore(); g.restore(); return;
  }
  const S= b.kind==='bazaar' ? SPR.bazaar[(b.variant||0)%SPR.bazaar.length]
         : (b.kind==='tower' && b.tall) ? SPR.towerTall
         : SPR[b.kind==='pillar'? (b.broken?'pillarBroken':'pillar') : b.kind];
  if(!S) return;
  if(b.kind!=='boat') drawShadowAt(cx,s.x,s.y, b.kind==='pillar'?12: b.kind==='lamp'?8 : b.kind==='castle'?(b.grand?150:92) : b.kind==='volcano'?66 : b.kind==='resort'?86 : 30);
  // castle sprite is 5x native (1500px); the grand palace draws it at ~0.9 for a
  // big-but-crisp, well-seated keep. Barik's keep draws at 0.4 - twice its old
  // 0.2, scaled uniformly (no stretch) so it reads as a proper keep.
  const BS=b.kind==='castle'?(b.grand?0.9:0.4) : (b.kind==='house'||b.kind==='house2'||b.kind==='igloo'||b.kind==='forge'||b.kind==='barn'||b.kind==='tower')?1.16 : b.kind==='resort'?1.28 : 1;
  cx.drawImage(S, s.x-S.width*BS/2, s.y-S.height*BS+ (b.kind==='boat'?18:10), S.width*BS, S.height*BS);
  if((b.kind==='house'||b.kind==='house2'||b.kind==='barn') && b.label) drawSign(b,s,BS);
  if(b.shop){ // a bobbing gold coin marks a stall you can buy from
    const iy=s.y - S.height*BS + 10 - 12 + Math.sin(G.time*2.4 + b.x)*3;
    cx.fillStyle='rgba(0,0,0,0.22)'; cx.beginPath(); cx.ellipse(s.x,iy+13,8,3,0,0,TAU); cx.fill();
    cx.fillStyle='#c98f1e'; cx.beginPath(); cx.arc(s.x,iy,8,0,TAU); cx.fill();
    cx.fillStyle='#ffd76a'; cx.beginPath(); cx.arc(s.x,iy,6.4,0,TAU); cx.fill();
    cx.fillStyle='#c98f1e'; cx.font='bold 10px Georgia'; cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText('E',s.x,iy+0.5);
    cx.fillStyle='rgba(255,255,255,0.7)'; cx.beginPath(); cx.arc(s.x-2.4,iy-2.4,1.6,0,TAU); cx.fill();
  }
  if(b.kind==='boat' && G.worldId==='isle' && qs('wreck')==='done'){
    const mx=s.x+2, mb=s.y-10;
    cx.strokeStyle='#4f3a24'; cx.lineWidth=3;
    cx.beginPath(); cx.moveTo(mx,mb); cx.lineTo(mx,mb-52); cx.stroke();
    cx.strokeStyle='#3a2c1c'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(mx-16,mb-46); cx.lineTo(mx+16,mb-46); cx.stroke();
    if(qs('wreck')==='done'){
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
  } else if(b.kind==='boat' && G.worldId!=='isle'){
    // Barik & the Sunward Isle: a proper moored sloop, always rigged
    const mx=s.x+1, mb=s.y-16, bil=Math.sin(G.time*1.5+b.x)*2.2;
    cx.strokeStyle='#4f3a24'; cx.lineWidth=3.4;
    cx.beginPath(); cx.moveTo(mx,mb); cx.lineTo(mx,mb-62); cx.stroke();          // mast
    cx.strokeStyle='#3a2c1c'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(mx-18,mb-54); cx.lineTo(mx+18,mb-54); cx.stroke(); // yard
    cx.fillStyle='rgba(238,232,216,0.97)';                                       // billowing sail
    cx.beginPath();
    cx.moveTo(mx-17,mb-53);
    cx.quadraticCurveTo(mx-24-bil,mb-31, mx-15-bil,mb-10);
    cx.lineTo(mx+16+bil*0.6,mb-12);
    cx.quadraticCurveTo(mx+22,mb-33, mx+17,mb-53);
    cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(60,45,25,0.5)'; cx.lineWidth=1.5; cx.stroke();
    cx.strokeStyle='rgba(150,60,45,0.7)'; cx.lineWidth=2;                        // a red seam
    cx.beginPath(); cx.moveTo(mx-9,mb-52); cx.lineTo(mx-9-bil*0.4,mb-11); cx.stroke();
    cx.fillStyle='#b23a2a';                                                      // masthead pennant
    cx.beginPath(); cx.moveTo(mx,mb-62); cx.lineTo(mx+15+bil,mb-59); cx.lineTo(mx,mb-56); cx.closePath(); cx.fill();
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
  if(m.kind==='hare'){
    const hop=Math.abs(Math.sin(m.anim*6))* (m.state==='idle'&&m.tx==null?1.5:4);
    drawShadowAt(cx,s.x,s.y,7);
    const fl=m.face||1;
    cx.save(); cx.translate(s.x, s.y-hop);
    cx.fillStyle='#b8a894';                                   // body
    cx.beginPath(); cx.ellipse(0,-6,8,7,0,0,TAU); cx.fill();
    cx.beginPath(); cx.ellipse(fl*6,-9,5,4,0,0,TAU); cx.fill(); // head
    cx.fillStyle='#cfc2b0'; cx.beginPath(); cx.ellipse(0,-3,6,5,0,0,TAU); cx.fill(); // belly
    cx.fillStyle='#b8a894';                                   // ears
    cx.beginPath(); cx.ellipse(fl*5,-16,1.8,5,fl*0.25,0,TAU); cx.fill();
    cx.beginPath(); cx.ellipse(fl*8,-15,1.8,5,fl*0.35,0,TAU); cx.fill();
    cx.fillStyle='#e8dcc8'; cx.beginPath(); cx.arc(-fl*5,-2,2.4,0,TAU); cx.fill(); // tail
    cx.fillStyle='#2a2018'; cx.beginPath(); cx.arc(fl*7.5,-10,1,0,TAU); cx.fill(); // eye
    if(m.hurtT>0){ cx.fillStyle='rgba(255,255,255,0.5)'; cx.beginPath(); cx.ellipse(0,-6,9,8,0,0,TAU); cx.fill(); }
    cx.restore();
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='polarbear'){
    const fl=m.face||1, gait=m.state==='chase'? Math.sin(m.anim*7)*2 : Math.sin(m.anim*2)*0.8;
    const wnd=(m.windup>0);
    drawShadowAt(cx,s.x,s.y,20);
    cx.save(); cx.translate(s.x,s.y); cx.scale(fl,1);
    const fur='#eef3f6', furD='#cdd8de';
    // legs
    cx.fillStyle=furD;
    cx.beginPath(); cx.ellipse(-11,-3+gait,4,6,0,0,TAU); cx.fill();
    cx.beginPath(); cx.ellipse(13,-3-gait,4,6,0,0,TAU); cx.fill();
    cx.beginPath(); cx.ellipse(-6,-2-gait,4.5,6.5,0,0,TAU); cx.fill();
    cx.beginPath(); cx.ellipse(8,-2+gait,4.5,6.5,0,0,TAU); cx.fill();
    // big low body
    cx.fillStyle=fur; cx.strokeStyle='rgba(120,140,150,0.5)'; cx.lineWidth=1.5;
    cx.beginPath(); cx.ellipse(0,-14,18,11,0,0,TAU); cx.fill(); cx.stroke();
    cx.fillStyle=furD; cx.beginPath(); cx.ellipse(-4,-18,10,5,0,0,TAU); cx.fill(); // shoulder hump
    // head, low and forward
    cx.fillStyle=fur; cx.beginPath(); cx.ellipse(17,-11,8,7,0,0,TAU); cx.fill(); cx.stroke();
    cx.fillStyle='#e6eef2'; cx.beginPath(); cx.ellipse(23,-9,5,4,0,0,TAU); cx.fill(); // snout
    cx.fillStyle='#3a4048'; cx.beginPath(); cx.arc(27,-9,1.6,0,TAU); cx.fill();       // nose
    cx.fillStyle=furD; cx.beginPath(); cx.arc(13,-17,2.4,0,TAU); cx.fill();           // ear
    cx.fillStyle= wnd? '#e0483a':'#7a2a2a'; cx.beginPath(); cx.arc(20,-12,1.3,0,TAU); cx.fill(); // eye - reddens when it rears
    if((m.swing||0)>0.05 || wnd){ // a raking claw
      cx.strokeStyle='#eef3f6'; cx.lineWidth=2.2;
      for(let i=-1;i<=1;i++){ cx.beginPath(); cx.moveTo(26,-14+i*2); cx.lineTo(33,-16+i*3); cx.stroke(); } }
    if(m.hurtT>0){ cx.fillStyle='rgba(255,120,110,0.4)'; cx.beginPath(); cx.ellipse(2,-14,20,13,0,0,TAU); cx.fill(); }
    cx.restore();
    const nm=m.name||MOBDEF[m.kind].name;
    cx.font='bold 11px Georgia'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,0.6)'; cx.fillText(nm,s.x+1,s.y-40);
    cx.fillStyle='#e6748a'; cx.fillText(nm,s.x,s.y-41);
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='icecolossus'){
    const sway=Math.sin(m.anim*1.6)*2, fl=m.face||1, wnd=(m.windup>0);
    drawShadowAt(cx,s.x,s.y,30);
    cx.save(); cx.translate(s.x,s.y+sway*0.3); cx.scale(fl,1);
    const ice='#bfe4f2', iceD='#8fbcd0', iceL='#e6f6ff', vio='rgba(150,90,220,';
    // enspelled aura
    if(m.enspelled){ const gl=0.25+0.15*Math.sin(G.time*4);
      cx.fillStyle=vio+gl.toFixed(2)+')'; cx.beginPath(); cx.ellipse(0,-30,34,40,0,0,TAU); cx.fill(); }
    // legs
    cx.fillStyle=iceD; cx.beginPath(); cx.ellipse(-12,-6,8,10,0,0,TAU); cx.fill(); cx.beginPath(); cx.ellipse(12,-6,8,10,0,0,TAU); cx.fill();
    // huge crystalline torso
    cx.fillStyle=ice; cx.strokeStyle='rgba(60,110,140,0.6)'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(-22,-14); cx.lineTo(-16,-52); cx.lineTo(0,-64); cx.lineTo(16,-52); cx.lineTo(22,-14); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle=iceL; cx.beginPath(); cx.moveTo(-8,-52); cx.lineTo(0,-62); cx.lineTo(6,-40); cx.lineTo(-4,-30); cx.closePath(); cx.fill();
    // jagged ice shards off the back
    cx.fillStyle=iceD;
    for(const [ox,oy,h2] of [[-20,-40,18],[-24,-24,14],[18,-44,16],[22,-26,12]]){ cx.beginPath(); cx.moveTo(ox,oy); cx.lineTo(ox-4,oy-h2); cx.lineTo(ox+4,oy-h2*0.6); cx.closePath(); cx.fill(); }
    // arms - big frozen fists
    cx.fillStyle=ice; cx.strokeStyle='rgba(60,110,140,0.6)';
    cx.beginPath(); cx.ellipse(-24,-28+(wnd?-8:0),7,11,0.2,0,TAU); cx.fill(); cx.stroke();
    cx.beginPath(); cx.ellipse(24,-28+(wnd?-8:0),7,11,-0.2,0,TAU); cx.fill(); cx.stroke();
    // head + violet eyes
    cx.fillStyle=iceL; cx.beginPath(); cx.ellipse(0,-58,10,9,0,0,TAU); cx.fill(); cx.stroke();
    cx.fillStyle= m.freed? '#bfe8ff' : (wnd?'#ff6a5a':'#c77bff');
    cx.beginPath(); cx.arc(-4,-59,2,0,TAU); cx.arc(4,-59,2,0,TAU); cx.fill();
    if(m.hurtT>0){ cx.fillStyle='rgba(255,150,140,0.4)'; cx.beginPath(); cx.ellipse(0,-34,24,32,0,0,TAU); cx.fill(); }
    cx.restore();
    const nm=m.title||m.name||MOBDEF[m.kind].name;
    cx.font='bold 13px Georgia'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,0.65)'; cx.fillText(nm,s.x+1,s.y-78);
    cx.fillStyle= m.enspelled? '#c77bff':'#bfe8ff'; cx.fillText(nm,s.x,s.y-79);
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='scorpion'){ drawScorpion(m,s); drawMobBars&&drawMobBars(m,s); return; }
  if(m.kind==='dragon'){
    cx.save(); cx.translate(s.x,s.y); cx.scale(2.6,2.6); drawDragon(cx,0,0,m); cx.restore();   // a proper wyrm - ~1.7x bigger
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
  if(m.kind==='leviathan'){
    const g=cx, fl=(m.face||1), t=G.time, hurt=m.hurtT>0, freed=m.freed;
    const bodyC = freed? '#3a7a8a' : '#1d3b46';            // darker, colder, meaner
    const spine = freed? '#7fd0e0' : '#2c5866';
    g.save(); g.translate(s.x,s.y); g.scale(3.4,3.4);      // twice the beast it was
    g.fillStyle='rgba(180,225,245,0.20)'; g.beginPath(); g.ellipse(0,5,52,17,0,0,TAU); g.fill(); // churned water
    for(let i=2;i>=0;i--){ const bx=fl*(-15 - i*17), by=3 - Math.sin(t*2+i)*3 - i*1.5; // breaching coils
      g.fillStyle= i%2? bodyC : shade(bodyC,10);
      g.beginPath(); g.ellipse(bx,by,14-i*1.5,8-i,0,Math.PI,TAU); g.fill();
      g.strokeStyle='rgba(6,20,26,0.7)'; g.lineWidth=2; g.stroke();
      g.fillStyle=spine; // a crest of jagged dorsal spines on every coil
      for(const sx of [-6,0,6]){ g.beginPath(); g.moveTo(bx+sx-3,by-3); g.lineTo(bx+sx,by-15); g.lineTo(bx+sx+3,by-3); g.closePath(); g.fill(); }
    }
    const hy=-46 - Math.sin(t*1.6)*4; // rearing neck
    g.strokeStyle=bodyC; g.lineWidth=17; g.lineCap='round';
    g.beginPath(); g.moveTo(fl*2,2); g.quadraticCurveTo(fl*11,-26, fl*6,hy+12); g.stroke();
    g.fillStyle=spine; // spines climbing the throat
    for(let k=0;k<4;k++){ const nt=k/4, npx=fl*(2+9*nt), npy=2+(hy+10)*nt;
      g.beginPath(); g.moveTo(npx-fl*4,npy); g.lineTo(npx-fl*11,npy-8); g.lineTo(npx+fl*1,npy-4); g.closePath(); g.fill(); }
    g.save(); g.translate(fl*6, hy);
    g.fillStyle=shade(bodyC,8); g.beginPath(); g.ellipse(fl*3,0,18,12,0,0,TAU); g.fill(); // heavy skull
    g.strokeStyle='rgba(6,20,26,0.8)'; g.lineWidth=2.6; g.stroke();
    g.fillStyle=shade(bodyC,-18); g.beginPath(); g.moveTo(fl*15,3); g.quadraticCurveTo(fl*30,6,fl*27,14); g.quadraticCurveTo(fl*13,13,fl*11,5); g.closePath(); g.fill(); // gaping jaw
    g.fillStyle='#eaf3f2'; // rows of jagged fangs, upper and lower
    for(let ti=0;ti<6;ti++){ const txp=fl*(12+ti*2.6);
      g.beginPath(); g.moveTo(txp,2); g.lineTo(txp+fl*1.1,6.5); g.lineTo(txp+fl*2.2,2); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(txp,11); g.lineTo(txp+fl*1.1,6.5); g.lineTo(txp+fl*2.2,11); g.closePath(); g.fill(); }
    g.fillStyle=spine; // swept-back horns
    g.beginPath(); g.moveTo(-fl*2,-8); g.lineTo(-fl*11,-24); g.lineTo(fl*2,-10); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(fl*6,-9); g.lineTo(fl*4,-26); g.lineTo(fl*14,-9); g.closePath(); g.fill();
    g.fillStyle=shade(bodyC,-10); g.beginPath(); g.moveTo(fl*3,-6); g.lineTo(fl*13,-8); g.lineTo(fl*12,-1); g.closePath(); g.fill(); // heavy brow
    g.fillStyle= freed? '#bfe8ff' : (hurt?'#ffd0d0':'#c77bff');
    g.beginPath(); g.arc(fl*9,-1,3.4,0,TAU); g.fill();
    g.fillStyle='#0a1418'; g.beginPath(); g.ellipse(fl*10,-1,1.1,2.1,0,0,TAU); g.fill(); // slit pupil
    g.restore();
    if(!freed){ const gl=0.35+0.3*Math.sin(t*3); // Vath's violet binding
      g.strokeStyle='rgba(199,123,255,'+gl.toFixed(2)+')'; g.lineWidth=2.4;
      g.beginPath(); g.arc(fl*6,hy,26,0,TAU); g.stroke(); }
    g.restore(); g.lineCap='butt';
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='raptor'){
    const g=cx, fl=(m.face||1), t=G.time+m.anim, flap=Math.sin(t*11);
    drawShadowAt(g,s.x,s.y,8);
    g.save(); g.translate(s.x,s.y-16+Math.sin(t*3)*3); // wheels and swoops
    g.fillStyle= m.hurtT>0?'#e0a0a0':'#4a4038';
    g.beginPath(); g.moveTo(0,-2); g.quadraticCurveTo(-fl*16,-8-flap*8,-fl*23,2+flap*4); g.quadraticCurveTo(-fl*12,2,0,4); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0,-2); g.quadraticCurveTo(fl*16,-8+flap*8,fl*23,2-flap*4); g.quadraticCurveTo(fl*12,2,0,4); g.closePath(); g.fill();
    g.fillStyle='#5a4a3a'; g.beginPath(); g.ellipse(0,0,6,8,0,0,TAU); g.fill();
    g.strokeStyle='rgba(20,14,8,0.7)'; g.lineWidth=1.4; g.stroke();
    g.fillStyle='#6a5844'; g.beginPath(); g.arc(fl*3,-7,4,0,TAU); g.fill();
    g.fillStyle='#e8b23c'; g.beginPath(); g.moveTo(fl*6,-7); g.lineTo(fl*11,-5); g.lineTo(fl*6,-4); g.closePath(); g.fill();
    g.fillStyle='#c77bff'; g.beginPath(); g.arc(fl*4,-8,1.5,0,TAU); g.fill(); // maddened violet eye
    g.strokeStyle='#3a2c1c'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-2,6); g.lineTo(-3,10); g.moveTo(2,6); g.lineTo(3,10); g.stroke();
    g.restore();
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='serpent'){
    const g=cx, fl=(m.face||1), t=G.time, hurt=m.hurtT>0, bodyC='#3a6a3a';
    drawShadowAt(g,s.x,s.y,20);
    g.save(); g.translate(s.x,s.y); g.scale(1.5,1.5);
    for(let i=2;i>=0;i--){ const bx=fl*(-13-i*15), by=2-i*2-Math.sin(t*2+i)*2;
      g.fillStyle= i%2?bodyC:shade(bodyC,10);
      g.beginPath(); g.ellipse(bx,by,13-i*1.5,7-i,0,0,TAU); g.fill();
      g.strokeStyle='rgba(10,26,10,0.6)'; g.lineWidth=2; g.stroke();
      g.fillStyle='#c9c060'; g.beginPath(); g.ellipse(bx,by+3,7-i,2.4,0,0,TAU); g.fill(); }
    const hy=-40-Math.sin(t*1.7)*4;
    g.strokeStyle=bodyC; g.lineWidth=13; g.lineCap='round';
    g.beginPath(); g.moveTo(fl*2,2); g.quadraticCurveTo(fl*10,-24,fl*6,hy+10); g.stroke();
    g.save(); g.translate(fl*6,hy);
    g.fillStyle=shade(bodyC,8); g.beginPath(); g.ellipse(fl*4,0,13,9,0,0,TAU); g.fill();
    g.strokeStyle='rgba(10,26,10,0.7)'; g.lineWidth=2.2; g.stroke();
    g.fillStyle='#fff'; g.beginPath(); g.moveTo(fl*12,4); g.lineTo(fl*14,9); g.lineTo(fl*10,5); g.closePath(); g.fill();
    g.strokeStyle='#d0405a'; g.lineWidth=1.4; g.beginPath(); g.moveTo(fl*13,2); g.lineTo(fl*21,2); g.lineTo(fl*24,0); g.moveTo(fl*21,2); g.lineTo(fl*24,4); g.stroke();
    g.fillStyle= hurt?'#ffd0d0':'#e8c040'; g.beginPath(); g.arc(fl*7,-2,3,0,TAU); g.fill();
    g.fillStyle='#0a1408'; g.fillRect(fl*6.2-0.8,-4,1.6,4);
    g.restore(); g.restore(); g.lineCap='butt';
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='frostwarden'){
    const g=cx, fl=(m.face||1), t=G.time, hurt=m.hurtT>0, freed=m.freed;
    drawShadowAt(g,s.x,s.y,36);
    g.save(); g.translate(s.x,s.y); g.scale(2.6,2.6);
    const ice='#bcd8e8', iceDk='#8fb8cf';
    g.fillStyle=iceDk; g.fillRect(-9,-14,7,14); g.fillRect(3,-14,7,14); // legs
    g.fillStyle=ice; g.beginPath(); g.moveTo(-13,-40); g.lineTo(13,-40); g.lineTo(11,-12); g.lineTo(-11,-12); g.closePath(); g.fill();
    g.strokeStyle='rgba(40,70,90,0.6)'; g.lineWidth=1.6; g.stroke();
    g.fillStyle='#d8eef8'; // jagged ice shoulders
    g.beginPath(); g.moveTo(-13,-40); g.lineTo(-20,-47); g.lineTo(-10,-34); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(13,-40); g.lineTo(20,-47); g.lineTo(10,-34); g.closePath(); g.fill();
    g.strokeStyle=iceDk; g.lineWidth=6; g.lineCap='round'; // arms
    g.beginPath(); g.moveTo(-12,-36); g.lineTo(-17,-16); g.stroke();
    g.beginPath(); g.moveTo(12,-36); g.lineTo(17,-16); g.stroke();
    g.fillStyle=ice; g.beginPath(); g.arc(-17,-14,5,0,TAU); g.arc(17,-14,5,0,TAU); g.fill();
    g.fillStyle='#cfe6f2'; g.beginPath(); g.moveTo(-7,-52); g.lineTo(7,-52); g.lineTo(5,-40); g.lineTo(-5,-40); g.closePath(); g.fill();
    g.strokeStyle='rgba(40,70,90,0.6)'; g.lineWidth=1.4; g.stroke();
    g.fillStyle= freed? '#8fd0e0' : (hurt?'#ffd0d0':'#c77bff'); // eyes
    g.fillRect(-4,-49,3,3); g.fillRect(1,-49,3,3);
    if(!freed){ const gl=0.5+0.4*Math.sin(t*3); // the violet binding core
      g.fillStyle='rgba(199,123,255,'+gl.toFixed(2)+')'; g.beginPath(); g.arc(0,-26,6,0,TAU); g.fill();
      g.fillStyle='#c77bff'; g.beginPath(); g.moveTo(0,-31); g.lineTo(4,-26); g.lineTo(0,-21); g.lineTo(-4,-26); g.closePath(); g.fill();
    } else { g.strokeStyle='rgba(160,220,240,0.7)'; g.lineWidth=1.4; // meltwater
      g.beginPath(); g.moveTo(-4,-38); g.lineTo(-4,-20); g.moveTo(4,-36); g.lineTo(4,-18); g.stroke(); }
    g.restore(); g.lineCap='butt';
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
    const fl=m.face||1;
    drawShadowAt(cx,s.x,s.y,15);
    // infer trot speed from real motion (smoothed) so the gait moves only when the boar does
    if(m._lx==null){ m._lx=m.x; m._ly=m.y; }
    const moved=Math.hypot(m.x-m._lx, m.y-m._ly); m._lx=m.x; m._ly=m.y;
    m._gait=(m._gait||0) + ((moved>0.003?1:0) - (m._gait||0))*0.18;
    const gait=m._gait;
    const aggro = m.state==='chase' || (m.windup||0)>0 || (m.lunge||0)>0;
    const charge= (m.windup||0)>0 || (m.lunge||0)>0;
    const ph=m.anim*10;                      // stride phase
    const bob=Math.sin(ph*0.5)*1.1*gait;     // body rises and falls with the stride
    const headDown= charge?5 : aggro?2 : 0;  // head drops to gore
    cx.save(); cx.translate(s.x,s.y); cx.lineCap='round'; cx.lineJoin='round';
    // a two-jointed leg: hip -> knee -> hoof, swung by 'sw'
    const leg=(bx,sw,col,hoof)=>{
      const kx=bx+sw*0.9, hx=bx+sw*1.7;
      cx.strokeStyle=col; cx.lineWidth=4;
      cx.beginPath(); cx.moveTo(bx,-12+bob); cx.lineTo(kx,-6); cx.lineTo(hx,0.5); cx.stroke();
      cx.strokeStyle=hoof; cx.lineWidth=4.6; cx.beginPath(); cx.moveTo(hx,-1.4); cx.lineTo(hx,0.8); cx.stroke();
    };
    // diagonal trot: the two diagonal pairs swing in opposition. Far pair first (behind body).
    const A=Math.sin(ph)*3.4*gait, B=Math.sin(ph+Math.PI)*3.4*gait;
    leg(-fl*7, A, '#382717', '#1b1109');   // far hind
    leg(fl*9,  B, '#3d2a19', '#1b1109');    // far fore
    // ---- body: barrel + high shoulder hump, shaded for volume ----
    cx.fillStyle='#4f3622';
    cx.beginPath(); cx.ellipse(0,-13+bob,15.5,10.5,0,0,TAU); cx.fill();        // barrel
    cx.beginPath(); cx.ellipse(fl*7,-16+bob,9.5,8.5,0,0,TAU); cx.fill();       // shoulder hump toward the head
    cx.fillStyle='#654627';                                                     // lit belly
    cx.beginPath(); cx.ellipse(fl*1,-10+bob,13,6.8,0,0,TAU); cx.fill();
    cx.fillStyle='rgba(26,17,9,0.38)';                                          // dark topline
    cx.beginPath(); cx.ellipse(0,-18+bob,13.5,4.6,0,0,TAU); cx.fill();
    cx.strokeStyle='rgba(20,14,8,0.8)'; cx.lineWidth=2;
    cx.beginPath(); cx.ellipse(0,-13+bob,15.5,10.5,0,0,TAU); cx.stroke();
    // ---- tail (rear), flicking ----
    const tw=Math.sin(m.anim*6)*3;
    cx.strokeStyle='#2e2013'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(-fl*14,-15+bob); cx.quadraticCurveTo(-fl*20,-15, -fl*18+tw*0.4,-9); cx.stroke();
    cx.fillStyle='#241a10'; cx.beginPath(); cx.arc(-fl*18+tw*0.4,-9,1.9,0,TAU); cx.fill();
    // ---- the bristleback ridge: a mane of spines, taller at the shoulder, that shivers when roused ----
    const N=10;
    for(let i=0;i<=N;i++){ const t=i/N;
      const bx=(-fl*13)+(fl*26)*t;
      const arch=Math.sin(t*Math.PI);
      const baseY=-19 - arch*3 + bob;
      const sh = aggro? Math.sin(m.anim*30 + i*1.3)*1.3 : 0;   // angry bristles quiver
      const hgt=4 + arch*3.2 + (aggro?2.2:0);
      cx.strokeStyle='#241a10'; cx.lineWidth=2.2;
      cx.beginPath(); cx.moveTo(bx,baseY+2); cx.lineTo(bx+sh*0.35, baseY-hgt+sh); cx.stroke();
      cx.fillStyle='#7a5a38'; cx.beginPath(); cx.arc(bx+sh*0.35, baseY-hgt+sh, 0.9,0,TAU); cx.fill();
    }
    // ---- head ----
    cx.save(); cx.translate(fl*13, -12+bob+headDown);
    cx.fillStyle='#3d2a19'; cx.beginPath(); cx.moveTo(-fl*2,-6); cx.lineTo(fl*1.5,-12); cx.lineTo(fl*4.5,-4.5); cx.closePath(); cx.fill(); // ear
    cx.fillStyle='#523822'; cx.beginPath(); cx.ellipse(fl*2,-1,7.6,6.6,0,0,TAU); cx.fill();      // skull/cheek
    cx.fillStyle='#654627'; cx.beginPath(); cx.ellipse(fl*3,1.5,5.6,4.4,0,0,TAU); cx.fill();      // lit jowl
    cx.fillStyle='#7a5a3c'; cx.beginPath(); cx.ellipse(fl*8.4,1.2,3.8,3.1,0,0,TAU); cx.fill();     // snout
    cx.strokeStyle='rgba(20,14,8,0.7)'; cx.lineWidth=1.3; cx.stroke();
    cx.fillStyle='#2a1d12'; cx.beginPath(); cx.arc(fl*9.4,0.4,0.85,0,TAU); cx.arc(fl*9.4,2.2,0.85,0,TAU); cx.fill(); // nostrils
    cx.strokeStyle='#efe4cf'; cx.lineWidth=2.3;                                                    // tusk, curving up
    cx.beginPath(); cx.moveTo(fl*6,3); cx.quadraticCurveTo(fl*9.4,2.6, fl*8.8,-1.6); cx.stroke();
    cx.fillStyle='#140d07'; cx.beginPath(); cx.arc(fl*3,-2.6,1.6,0,TAU); cx.fill();                // eye
    if(aggro){ cx.fillStyle='#ff7a3a'; cx.beginPath(); cx.arc(fl*3,-2.6,0.85,0,TAU); cx.fill(); }  // it sees red
    cx.fillStyle='#fff'; cx.beginPath(); cx.arc(fl*3.6,-3.2,0.5,0,TAU); cx.fill();                 // glint
    cx.restore();
    // ---- near legs, on top of the body ----
    leg(-fl*6, B, '#4c341f', '#241812');   // near hind
    leg(fl*10, A, '#573c24', '#241812');    // near fore
    // hoof dust when charging past, kept near the player so we never spawn it off-screen
    if(gait>0.55 && dist(m.x,m.y,P.x,P.y)<16 && Math.random()<0.06)
      G.parts.push({x:m.x-fl*0.3, y:m.y, vx:-fl*rnd(0.1,0.4), vy:-rnd(0.1,0.4), life:rnd(0.3,0.6), color:'rgba(122,96,62,0.7)', size:rnd(1.5,3), grav:0.02});
    if(m.hurtT>0){ cx.globalAlpha=0.5; cx.fillStyle='#ffd9a8';
      cx.beginPath(); cx.ellipse(0,-13+bob,17,12,0,0,TAU); cx.fill(); cx.globalAlpha=1; }
    cx.restore(); cx.lineCap='butt'; cx.lineJoin='miter';
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
  if(m.kind==='raidcap'){
    drawShadowAt(cx,s.x,s.y,18);
    // a red horsehair crest above the captain's helm, streaming as he moves
    const fl=(m.face||1), cr=Math.sin(m.anim*7);
    drawHumanoid(cx,s.x,s.y,{skin:'#b0855f',hair:'#241d1a',shirt:'#7a2320',pants:'#2c1c1c',
      hat:'hood',hatColor:'#3a1616',armor:2,pauldrons:true,trim:'#c8a24a',weapon:'sword',wtier:2,
      swing:m.swing||0, hurt:m.hurtT>0, size:1.5,
      dir:{x:fl,y:0.3}, step:Math.sin(m.anim*7)});
    cx.save(); cx.translate(s.x, s.y-46);
    cx.strokeStyle='#b23a2a'; cx.lineWidth=3.4; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(-2,0);
    cx.quadraticCurveTo(-fl*6+cr*2,-9, -fl*12+cr*4,-6);
    cx.stroke();
    cx.strokeStyle='#8f2a20'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(-2,1); cx.quadraticCurveTo(-fl*5+cr*2,-5,-fl*10+cr*3,-1); cx.stroke();
    cx.restore(); cx.lineCap='butt';
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='mage'){
    drawShadowAt(cx,s.x,s.y,13);
    drawHumanoid(cx,s.x,s.y,{skin:'#c2a892',hair:'#241a2e',beard:'#2a2038',robe:'#4a2a5e',rune:true,
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
  // Kiko is a MOA - a giant flightless ratite, tall as a door: heavy runner's
  // legs, a deep shaggy-feathered body, a long S-curved neck and a small beaked
  // head. Not a pig. Runs with a real two-leg gait; breathes and bobs when idle.
  const g=cx, fl=(P.dir&&P.dir.x<0)?-1:1, moving=!!P.moving, t=G.time;
  // P.anim tracks ground covered and races at the moa's ride speed; a *8 stride
  // multiplier jumped the leg phase ~4 rad/frame, aliasing the gait into a strobe.
  // Keep it low (~0.75 rad/frame) so the run stays smooth at speed.
  const ph=P.anim*1.5, gait=moving?1:0;
  const bob = moving? Math.sin(ph*0.5)*1.7 : Math.sin(t*2)*0.7;   // body rise/fall
  const OUT='rgba(22,15,8,0.85)';
  const body='#6b5334', belly='#9a8054', dark='#48371f', bodyHi='#8a6f48';
  const legc='#79684a', shank='#9a8768', horn='#c59a44', hornSh='#96742f';
  const CY=-24+bob;                                                  // body centre - high, so it stands TALL
  drawShadowAt(g,s.x,s.y,18);
  g.save(); g.translate(s.x,s.y); g.lineCap='round'; g.lineJoin='round';
  // a long ratite leg: shaggy thigh -> back-bending hock -> scaly shank -> 3 toes,
  // running all the way to the ground so the bird reads tall as a door.
  const leg=(hipx, sw, back)=>{
    const hipY=CY+8;
    const kneeX=hipx - fl*2 + sw*2.2, kneeY=CY+18;
    const ankX = hipx + fl*3.5 + sw*3.6, ankY=-2;
    g.strokeStyle= back? dark:legc; g.lineWidth=7.5;                 // shaggy thigh
    g.beginPath(); g.moveTo(hipx,hipY); g.lineTo(kneeX,kneeY); g.stroke();
    g.strokeStyle= back? '#5f5038':shank; g.lineWidth=3.4;            // scaly shank
    g.beginPath(); g.moveTo(kneeX,kneeY); g.lineTo(ankX,ankY); g.stroke();
    g.strokeStyle= back? hornSh:horn; g.lineWidth=2.6;                // three forward toes
    g.beginPath();
    g.moveTo(ankX,ankY); g.lineTo(ankX+fl*6,1.6);
    g.moveTo(ankX,ankY); g.lineTo(ankX+fl*8,0.4);
    g.moveTo(ankX,ankY); g.lineTo(ankX+fl*3.5,2.4); g.stroke();
  };
  const A=Math.sin(ph)*1.1*gait, B=Math.sin(ph+Math.PI)*1.1*gait;
  leg(-fl*4, B, true);                                                // far leg (behind body)
  // ---- deep feathered body: rump bulges behind the rider, breast in front ----
  g.fillStyle=body; g.beginPath(); g.ellipse(-fl*3,CY,15.5,11.5,0,0,TAU); g.fill();
  g.fillStyle=belly; g.beginPath(); g.ellipse(-fl*3,CY+4,12,7,0,0,TAU); g.fill();             // lit underside
  g.fillStyle='rgba(28,19,10,0.32)'; g.beginPath(); g.ellipse(-fl*4,CY-5,12,5,0,0,TAU); g.fill(); // shaded back
  g.strokeStyle=OUT; g.lineWidth=2; g.beginPath(); g.ellipse(-fl*3,CY,15.5,11.5,0,0,TAU); g.stroke();
  g.strokeStyle='rgba(40,28,14,0.45)'; g.lineWidth=1;                 // shaggy feather ticks
  for(let i=-3;i<=3;i++){ g.beginPath(); g.moveTo(-fl*3+i*3.3,CY-4); g.lineTo(-fl*3+i*3.3-fl*2.4,CY+4); g.stroke(); }
  // tail plume at the rump
  g.fillStyle=dark;
  g.beginPath(); g.moveTo(-fl*15,CY-3); g.quadraticCurveTo(-fl*27,CY-9,-fl*24,CY+6);
  g.quadraticCurveTo(-fl*19,CY+8,-fl*13,CY+4); g.closePath(); g.fill();
  g.strokeStyle=OUT; g.lineWidth=1.4; g.stroke();
  // ---- long S-curved neck + small beaked head, rising in front, swaying ----
  const sway=(moving? Math.sin(ph*0.5) : Math.sin(t*1.6))*1.8;
  const nbX=fl*11, nbY=CY-5, hX=fl*21+sway, hY=CY-22;
  g.strokeStyle=body; g.lineWidth=6.4;
  g.beginPath(); g.moveTo(nbX,nbY); g.quadraticCurveTo(fl*15,CY-15, hX,hY); g.stroke();       // neck
  g.strokeStyle=belly; g.lineWidth=2.4;                                                        // pale throat line
  g.beginPath(); g.moveTo(nbX+fl*1.5,nbY); g.quadraticCurveTo(fl*16.5,CY-15, hX,hY+1); g.stroke();
  g.fillStyle=bodyHi; g.save(); g.translate(hX,hY); g.scale(fl,1);                              // small head, set forward
  g.beginPath(); g.ellipse(0.8,0,4.6,4.0,0,0,TAU); g.fill();
  g.strokeStyle=OUT; g.lineWidth=1.4; g.stroke();
  g.fillStyle=horn; g.beginPath(); g.moveTo(3.2,-0.6); g.lineTo(10,0.7); g.lineTo(3.2,2.1); g.closePath(); g.fill(); // short conical beak
  g.strokeStyle=hornSh; g.lineWidth=0.9; g.stroke();
  g.beginPath(); g.moveTo(3.4,0.7); g.lineTo(9.4,0.9); g.stroke();                              // beak seam
  g.fillStyle='#140d07'; g.beginPath(); g.arc(1.4,-0.9,1.3,0,TAU); g.fill();                    // eye
  g.fillStyle='#fff'; g.beginPath(); g.arc(1.9,-1.4,0.45,0,TAU); g.fill();
  g.restore();
  // ---- saddle blanket at the top of the back where the rider sits ----
  g.fillStyle='#5a3a5e'; g.beginPath(); g.ellipse(-fl*3,CY-8,8,3.2,0,0,TAU); g.fill();
  g.strokeStyle='#2c1830'; g.lineWidth=1.3; g.stroke();
  leg(fl*4, A, false);                                                // near leg (over body)
  g.restore(); g.lineCap='butt'; g.lineJoin='miter';
}
function drawHorse(s){
  const g=cx; g.save(); g.translate(s.x,s.y);
  const fl=(P.dir.x<0)?-1:1, tr=Math.sin(P.anim*1.35);   // slow bob - see drawMoa note on P.anim aliasing
  g.scale(1.3,1.3);
  g.fillStyle='rgba(0,0,0,0.28)';
  g.beginPath(); g.ellipse(0,1.5,17,6,0,0,TAU); g.fill();
  const c1='#8a5a34', c2='#6e4426', mane='#3a2614';
  for(const [lx,ph] of [[-9,0],[-4,2.4],[5,1.2],[10,3.6]]){ // legs
    g.strokeStyle=c2; g.lineWidth=3.4; g.lineCap='round';
    g.beginPath(); g.moveTo(lx,-12);
    g.lineTo(lx+(P.moving?Math.sin(P.anim*1.8+ph)*3.4:0), 0.5); g.stroke();
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
    const onMoa=P.unlocked&&P.unlocked.moa;
    if(onMoa) drawMoa(s); else drawHorse(s);
    const s2={x:s.x, y:s.y-(onMoa?32:21)};   // you sit high on the tall moa
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
    crest:!!(P.story && P.story.necklace),  // the crest necklace, worn from wake-up
    hat: has('crown',1)?'crown':null};
  if(P.weapon==='bow') look.quiver=true;   // the quiver joins the kit
  if(P.weapon==='staff') look.rune=true;   // a faint charm-glow, nothing more
  look.armor=P.armor||0;
  drawHumanoid(cx,s.x,s.y,{...look, size:1.32,
    dir:P.dir, step:P.riding?0:(P.moving?P.anim:0), ride:!!P.riding, stillT:P.stillT||0, weapon:tool, swing:P.swing, hurt:P.hurtT>0,
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
  } else if(p.kind==='shard'){
    const a=Math.atan2(p.vy,p.vx);
    cx.save(); cx.translate(s.x,s.y-12); cx.rotate(a);
    cx.fillStyle='rgba(150,210,235,0.35)'; cx.beginPath(); cx.arc(0,0,9,0,TAU); cx.fill();
    cx.fillStyle='#bfe8ff'; cx.beginPath(); cx.moveTo(9,0); cx.lineTo(-4,-4); cx.lineTo(-1,0); cx.lineTo(-4,4); cx.closePath(); cx.fill();
    cx.fillStyle='#e6f6ff'; cx.beginPath(); cx.moveTo(7,0); cx.lineTo(-1,-2); cx.lineTo(-1,2); cx.closePath(); cx.fill();
    cx.restore();
  } else if(p.kind==='spout'){
    // a hurled gout of seawater, trailing droplets
    cx.fillStyle='rgba(120,190,220,0.32)'; cx.beginPath(); cx.arc(s.x,s.y-12,11,0,TAU); cx.fill();
    cx.fillStyle='#6fb6d8'; cx.beginPath(); cx.ellipse(s.x,s.y-12,6,4.4,Math.atan2(p.vy,p.vx),0,TAU); cx.fill();
    cx.fillStyle='#e6f6ff'; cx.beginPath(); cx.arc(s.x-1.5,s.y-13.5,2.2,0,TAU); cx.fill();
    for(let i=0;i<3;i++){ cx.fillStyle='rgba(190,232,255,0.7)';
      cx.beginPath(); cx.arc(s.x-p.vx*i*0.7, s.y-12-p.vy*i*0.7, 1.5,0,TAU); cx.fill(); }
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
  [T.FOREST]:'#527f3c',[T.RUIN]:'#8f8b83',[T.PATH]:'#b7965f',[T.SOIL]:'#7a5230',[T.PLANK]:'#9c6f42',
  [T.SNOW]:'#e9eef6',[T.ICE]:'#b7d6e8'};
let mapBase=null;
// cloud worlds recolour the minimap: white cloud land, pale-sky "void" (no blue sea)
const CLOUDCOL={[T.DEEP]:'#bcd6ee',[T.SHALLOW]:'#cfe2f2',[T.SNOW]:'#f4f8ff',[T.ICE]:'#dbe9f5',
  [T.RUIN]:'#c7cdd6',[T.PATH]:'#e6eef7'};
function buildMapBase(){
  // buildMapBase runs DURING world gen, before switchWorld sets G.worldId - so detect
  // a cloud world by its SEED (set before gen), which is reliable at this point.
  const CLOUD = Object.keys(WORLD_DEFS).some(k=>WORLD_DEFS[k].cloud && WORLD_DEFS[k].seed===SEED);
  mapBase=makeCanvas(MAPW,MAPH,(g)=>{
    for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
      const t=G.map[y*MAPW+x];
      g.fillStyle=(CLOUD && CLOUDCOL[t]) || MAPCOL[t]; g.fillRect(x,y,1,1);
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
  // landmark dots for the world's named zones - fixed points that slide past as you
  // move, so movement reads even on featureless terrain (open cloud, open sea)
  P.disc=P.disc||{};
  for(const k in ZONES){ const z=ZONES[k]; if(!z.name) continue;
    const zx=(z.x-sx)/vw*120, zy=(z.y-sy)/vw*120;
    if(zx<-3||zx>123||zy<-3||zy>123) continue;
    g.fillStyle= P.disc[G.worldId+':'+k] ? 'rgba(255,213,120,0.95)' : 'rgba(235,235,235,0.5)';
    g.beginPath(); g.arc(zx,zy,2,0,TAU); g.fill();
    g.strokeStyle='rgba(0,0,0,0.45)'; g.lineWidth=1; g.stroke();
  }
  // the player: a bright dot with a dark halo + white ring, so it reads on ANY
  // terrain - including the all-white Cloudreach where a plain white dot vanished
  const px=(P.x-sx)/vw*120, py=(P.y-sy)/vw*120;
  g.beginPath(); g.arc(px,py,5,0,TAU); g.fillStyle='rgba(0,0,0,0.5)'; g.fill();
  g.beginPath(); g.arc(px,py,3.2,0,TAU); g.fillStyle='#ff4d3d'; g.fill();
  g.lineWidth=1.4; g.strokeStyle='#fff'; g.stroke();
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
