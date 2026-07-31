/* =====================================================================
   RENDERING
   ===================================================================== */
function worldToScreen(wx,wy){ return { x: isoX(wx,wy)-G.cam.x, y: isoY(wx,wy)-G.cam.y }; }
function screenToWorld(sx,sy){
  sx-=LB.x; sy-=LB.y;   // undo Performance Mode letterbox offset
  const inv=(yy)=>{ const ox=sx+G.cam.x, oy=yy+G.cam.y;
    return { x:(ox/(TW/2)+oy/(TH/2))/2, y:(oy/(TH/2)-ox/(TW/2))/2 }; };
  let w=inv(sy);
  // Height-aware refinement: raised terrain is DRAWN shifted up by its lift,
  // so a click on tall ground under the flat inverse lands short. Re-invert
  // against the lift at the current guess; converges in a few steps because
  // the height field is smooth. (Also widens the top-edge cull correctly -
  // without it, tall tiles lifted into view at the screen top could pop in.)
  if(typeof elevActive==='function' && elevActive() && G.height){
    for(let k=0;k<3;k++) w=inv(sy + groundLiftAt(w.x,w.y));
  }
  return w;
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
/* backdrop sea/sky gradient - same idea: rebuilt only when the viewport resizes */
let _bgGrad=null, _bgKey='';
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
  const EL = (typeof elevActive==='function') && elevActive();
  if(EL) ensureHeight();
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const t=G.map[y*MAPW+x], sx=isoX(x,y)+OX, sy=isoY(x,y)+OY;
    if(CLOUD && (t===T.DEEP||t===T.SHALLOW)) continue;   // open sky - stays transparent so the backdrop shows
    const L = EL ? elevTileLift(x,y) : 0;
    if(EL && L>0.02) elevDrawCliff(g,x,y,sx,sy);
    const spr=TILE_SPR[t] && TILE_SPR[t][G.variant[y*MAPW+x]];
    if(spr) g.drawImage(spr, sx-TW/2, sy-TH/2-L);
    if(t!==T.SHALLOW && t!==T.DEEP){
      const mc=terrainCls(t);
      if(mc<4) for(const nb of [[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]]){
        const nc=terrainCls(tileAt(x+nb[0],y+nb[1]));
        if(nc>mc && FRINGE[nc]) g.drawImage(FRINGE[nc][nb[2]], sx-TW/2, sy-TH/2-L);
      }
    }
    if(EL) elevTileFX(g,x,y,sx,sy);   // baked once: sun wash + contact shadows are free here
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
const DYNAMIC_DECOR = {chest:1, chestOpen:1, boat:1, lava:1, lairmouth:1, dungeonmouth:1, icelever:1, boneplate:1, bonelever:1, bonebars:1, catgate:1, tunnelmouth:1, ashwing:1, kingfire:1, wardgate:1,
  cratersmoke:1, lavacrack:1, emberplate:1, firegate:1, emberlever:1, dragonrest:1, icespire:1, emberbutton:1, staffgate:1, leappoint:1, tombmouth:1,
  skygate:1, skytile:1, skybird:1, stormbead:1, vathghost:1,
  coggate:1, millgear:1, millwheel:1, sluicelever:1, signalbeacon:1, fastexit:1,
  icebrazier:1, icewall:1, thinice:1,
  beamgate:1, bonepan:1, windzone:1,
  lavaseg:1, lavasluice:1, firewheel:1,
  axetrap:1, arrowtrap:1, traparrow:1, spiketile:1, skybeam:1,
  firepit:1, firelever:1, spinwheel:1, froststream:1, icefloe:1, driftslab:1, conveytile:1, shoottarget:1, bonepit:1, fadetile:1,
  dancebtn:1, danceghost:1,
  skyemitter:1, skyprism:1, skyward:1};
let scnDecorN=-1;
function buildSceneryCache(){
  const {OX,OY,W,H}=gcDims();
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d');
  g.setTransform(GC_S,0,0,GC_S,0,0);
  const savedCx=cx, camX=G.cam.x, camY=G.cam.y;
  cx=g; G.cam.x=-OX; G.cam.y=-OY;
  const EL = (typeof elevActive==='function') && elevActive();
  if(EL) ensureHeight();
  try{
    const items=[];
    for(const n of G.nodes){ if(!n.dead) items.push({o:n, t:'node'}); }
    for(const b of G.decor){ if(!DYNAMIC_DECOR[b.kind]) items.push({o:b, t:'decor'}); }
    items.sort((a,b)=>(a.o.x+a.o.y)-(b.o.x+b.o.y));
    for(const it of items){ const s=worldToScreen(it.o.x,it.o.y);
      if(EL) s.y -= groundLiftAt(it.o.x,it.o.y);
      if(it.t==='node') drawNode(it.o,s); else drawDecor(it.o,s); }
  }catch(e){}
  cx=savedCx; G.cam.x=camX; G.cam.y=camY;
  sceneryCache=c; scnWorld=G.worldId; scnDecorN=G.decor.length;
}

function render(){
  cx.setTransform(DPR,0,0,DPR,0,0);
  // sky/ocean backdrop (cloud worlds get open sky instead of dark ocean)
  const CLOUD = !!(WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].cloud);
  // the Rainbow Road's little stepping-isles gently sway (skyIsleSwingAt); skipped in
  // low-gfx, where the ground is a static blit and a sway would slide actors off it.
  const SKYSWING = !LOWFX && G.worldId==='skydungeon' && typeof skyIsleSwingAt==='function';
  // graded backdrop: open sea falls off into deep abyss (cloud worlds get a
  // bright sky dome). Gradient cached by viewport size - built once, not per frame.
  {const bgKey=VW+'x'+VH+(CLOUD?'c':'o');
   if(_bgKey!==bgKey){ const bg=cx.createLinearGradient(0,0,0,VH);
     if(CLOUD){ bg.addColorStop(0,'#e2f0fa'); bg.addColorStop(0.6,'#bcd6ee'); bg.addColorStop(1,'#9dc0dc'); }
     else { bg.addColorStop(0,'#1e4467'); bg.addColorStop(0.55,'#16283e'); bg.addColorStop(1,'#0c1727'); }
     _bgGrad=bg; _bgKey=bgKey; }
   cx.fillStyle=_bgGrad;} cx.fillRect(0,0,VW,VH);
  // Trauma-style shake: squared falloff (a punchier decay than linear), a small
  // directional kick set on impacts (G.kickX/Y), and a hair of rotation so a hit
  // reads as a jolt rather than a uniform wobble. setTransform() resets fully each
  // frame (line above), so the rotate is safe and self-clearing.
  if(G.shake>0 && CFG.shake){
    const tr=Math.min(1,G.shake), m=tr*tr;
    cx.translate(rnd(-1,1)*m*13 + (G.kickX||0)*tr, rnd(-1,1)*m*10 + (G.kickY||0)*tr);
    cx.rotate(rnd(-1,1)*m*0.010);
  }
  if(G.kickX){ G.kickX*=0.86; if(Math.abs(G.kickX)<0.1) G.kickX=0; }
  if(G.kickY){ G.kickY*=0.86; if(Math.abs(G.kickY)<0.1) G.kickY=0; }

  // visible tile range
  const corners=[screenToWorld(0,0),screenToWorld(VW,0),screenToWorld(0,VH),screenToWorld(VW,VH)];
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const c of corners){ minX=Math.min(minX,c.x); maxX=Math.max(maxX,c.x);
    minY=Math.min(minY,c.y); maxY=Math.max(maxY,c.y); }
  minX=Math.floor(minX)-2; maxX=Math.ceil(maxX)+2; minY=Math.floor(minY)-2; maxY=Math.ceil(maxY)+4;

  // Elevation: fake-3D terrain height (surface worlds only). Lifts ground tiles,
  // paints cliff faces, and rides actors up on the raised ground beneath them.
  const EL = (typeof elevActive==='function') && elevActive();
  if(EL) ensureHeight();

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
      let sx=s.x - 0; const sy=s.y;
      if(SKYSWING && t===T.SNOW){ const sw=skyIsleSwingAt(x,y); if(sw) sx+=sw; }   // sway the isle tiles
      const L = EL ? elevTileLift(x,y) : 0;
      if(EL && L>0.02) elevDrawCliff(cx,x,y,sx,sy);
      // sprite drawn with its diamond centered at (TW/2, TH/2): blit so tile (x,y) top corner maps
      cx.drawImage(TILE_SPR[t][G.variant[y*MAPW+x]], sx-TW/2, sy-TH/2-L);
      if(t===T.SHALLOW || t===T.DEEP){
        // gentle animated sheen + drifting sparkles (per-water-tile path ops -
        // one of the biggest costs on a software-rendered canvas; drop at LOWFX)
        if(!LOWFX){
          const ph=Math.sin(G.time*1.6 + x*0.9 + y*1.3);
          if(ph>0.86){ cx.fillStyle='rgba(255,255,255,0.10)';
            cx.beginPath(); cx.ellipse(sx, sy+2, 10, 3, 0, 0, TAU); cx.fill(); }
          // (the old per-DEEP-tile dark ellipse was removed: it stamped one blob
          //  on every tile = a regular grid. Depth darkening is now the smooth
          //  overlapping blobs in elevTileFX/js-33.)
          const cph=Math.sin(G.time*1.1 + x*0.7 - y*0.5);
          if(cph>0.45){ cx.strokeStyle='rgba(180,230,255,'+(0.05+0.06*cph).toFixed(3)+')'; cx.lineWidth=1.4;
            cx.beginPath(); cx.moveTo(sx-9,sy+1); cx.quadraticCurveTo(sx,sy-3,sx+9,sy+1); cx.stroke(); }
          // shore-lap: a crest rolls in from open water (phase rides the depth
          // field, so it travels shoreward) and breaks into white foam flecks
          // as it arrives on the shallows
          if(EL && G.wdepth){
            const wdp=waterDepthLv(x,y);
            if(wdp>0 && wdp<2.2){
              const w=Math.sin(wdp*2.0 - G.time*1.5 + ((x*31+y*17)%7)*0.09);
              if(w>0.55){
                const aa=(w-0.55)/0.45;
                cx.strokeStyle='rgba(238,250,252,'+(0.30*aa).toFixed(3)+')'; cx.lineWidth=1.6;
                cx.beginPath(); cx.moveTo(sx-11,sy+1); cx.quadraticCurveTo(sx,sy-2.5,sx+11,sy+1); cx.stroke();
                if(aa>0.75 && wdp<1.2){
                  cx.fillStyle='rgba(255,255,255,'+(0.5*(aa-0.75)*4).toFixed(3)+')';
                  cx.beginPath();
                  cx.arc(sx-6,sy+1,1.3,0,TAU); cx.arc(sx+2,sy-0.5,1.1,0,TAU); cx.arc(sx+8,sy+1.4,1.2,0,TAU);
                  cx.fill();
                }
              }
            }
          }
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
            if(nc>mc && FRINGE[nc]) cx.drawImage(FRINGE[nc][nb[2]], sx-TW/2, sy-TH/2-L);
          }
        }
      }
      if(EL) elevTileFX(cx,x,y,sx,sy);   // sun wash on hills + cliff-foot contact shadows
    }
  }
  }
  if(fxOn('foam')) drawFoam(minX,maxX,minY,maxY);
  if(fxOn('decals')) drawDecals(minX,maxX,minY,maxY);
  // ground-plane atmosphere: daytime hearth light cast on the grass, building
  // contact AO, and terrain break-up scatter - drawn UNDER the actors that
  // stand on them. (Defined in js/34-atmosphere.js; full-detail worlds only.)
  if(typeof atmoGround==='function') atmoGround(minX,maxX,minY,maxY,EL);
  // farm crops (flat, above ground below objects)
  for(const pl of G.plots){
    if(pl.stage>0){ const s=worldToScreen(pl.x+0.5,pl.y+0.5); drawCrop(cx,s.x,s.y+4,pl.stage,G.time); }
  }
  // training-arena ring: the chalk circle you're sealed inside during a drill
  if(typeof TRAIN!=='undefined' && TRAIN){
    const R=6.2, seg=44;
    cx.strokeStyle='rgba(255,206,122,0.6)'; cx.lineWidth=2.5; cx.setLineDash([7,7]);
    cx.beginPath();
    for(let i=0;i<=seg;i++){ const a=i/seg*TAU, s=worldToScreen(TRAIN.x+Math.cos(a)*R, TRAIN.y+Math.sin(a)*R);
      if(i===0) cx.moveTo(s.x,s.y); else cx.lineTo(s.x,s.y); }
    cx.stroke(); cx.setLineDash([]);
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
    const dd=(b.kind==='firepit'||b.kind==='spinwheel'||b.kind==='froststream'||b.kind==='icefloe'||b.kind==='driftslab'||b.kind==='conveytile'||b.kind==='bonepit'||b.kind==='windpit'||b.kind==='fadetile'||b.kind==='spiketile'||b.kind==='dancebtn'||b.kind==='dplate')? -9990 : b.x+b.y;   // flat lava/water/pit/road & floor-plates are floor-level: always beneath the actors that stand on them
    items.push({d:dd, kind:b.kind==='lamp'?'lamp':'decor', o:b}); }
  for(const n of G.npcs) items.push({d:n.x+n.y, kind:'npc', o:n});
  for(const m of G.mobs){ if(!m.dead && !m.sealed) items.push({d:m.x+m.y, kind:'mob', o:m}); }
  if(G.cat) items.push({d:G.cat.x+G.cat.y, kind:'cat', o:G.cat});
  if(G.critters) for(const c of G.critters) items.push({d:c.x+c.y, kind:'critter', o:c});
  if(!P.dead) items.push({d:P.x+P.y, kind:'player', o:P});
  for(const p of G.projs) items.push({d:p.x+p.y, kind:'proj', o:p});
  for(const pt of G.parts){ if(pt.pickup) items.push({d:pt.x+pt.y, kind:'pickup', o:pt}); }
  items.sort((a,b)=>a.d-b.d);

  if(DBG.entities) for(const it of items){
    const o=it.o, s=worldToScreen(o.x,o.y);
    if(EL) s.y -= groundLiftAt(o.x,o.y);   // stand on the raised terrain
    if(SKYSWING){ const sw=skyIsleSwingAt(o.x,o.y); if(sw) s.x+=sw; }   // ride the isle's sway
    switch(it.kind){
      case 'node': drawNode(o,s); break;
      case 'decor': case 'lamp': drawDecor(o,s); break;
      case 'npc': drawNPC(o,s); break;
      case 'mob': drawMobEntity(o,s); break;
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
  // drifting pollen motes & tumbling leaves over grass and forest by day -
  // stateless (position derived from time), so they cost no particle budget.
  // Fireflies own the night; these fade out as dusk falls.
  if(!LOWFX && fxOn('particles') && night<0.6){
    const spanX=(maxX-minX)||1, spanY=(maxY-minY)||1;
    for(let i=0;i<14;i++){
      const hs=((i*2654435761)>>>0)%100000/100000;
      const wob=Math.sin(G.time*(0.8+hs)+i*2.1);
      const wx=minX+(((hs*977+G.time*(0.18+hs*0.2))%1)+1)%1*spanX;
      const wy=minY+(((hs*541+G.time*(0.13+hs*0.14)+0.37)%1)+1)%1*spanY;
      const t=tileAt(wx|0,wy|0);
      if(t!==T.GRASS && t!==T.FOREST) continue;
      const s=worldToScreen(wx,wy);
      if(EL) s.y-=groundLiftAt(wx,wy);
      const sy=s.y-12-wob*4;
      cx.globalAlpha=(0.3+0.3*Math.abs(wob))*(1-night/0.6);
      if(i%3===0){
        cx.fillStyle='rgba(150,180,90,0.9)';
        cx.save(); cx.translate(s.x,sy); cx.rotate(G.time*1.2+i);
        cx.fillRect(-2.4,-1.4,4.8,2.8); cx.restore();
      } else {
        cx.fillStyle='#f4eebc';
        cx.beginPath(); cx.arc(s.x,sy,1.5,0,TAU); cx.fill();
      }
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
      gg.addColorStop(0,'rgba(255,184,86,'+(0.26*night)+')');
      gg.addColorStop(0.5,'rgba(255,150,66,'+(0.12*night)+')');
      gg.addColorStop(1,'rgba(255,150,60,0)');
      cx.fillStyle=gg; cx.beginPath(); cx.arc(s.x,s.y-40,r,0,TAU); cx.fill();
      // warm pool spilling onto the floor beneath the flame (flattened to the
      // ground plane) so lamplight reads as cast illumination, not just a halo
      const pr=r*0.7;
      const pg=cx.createRadialGradient(s.x,s.y-6,3,s.x,s.y-6,pr);
      pg.addColorStop(0,'rgba(255,166,74,'+(0.22*night*fl)+')');
      pg.addColorStop(1,'rgba(255,150,60,0)');
      cx.save(); cx.translate(s.x,s.y-6); cx.scale(1,0.5); cx.translate(-s.x,-(s.y-6));
      cx.fillStyle=pg; cx.beginPath(); cx.arc(s.x,s.y-6,pr,0,TAU); cx.fill(); cx.restore();
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

// resource nodes show the same style of health bar as enemies while they're
// being harvested - a dark backing with a colored fill that drains as the tree
// or rock loses hp. Only drawn once a node has taken a hit (hp<maxhp).
function drawNodeHp(n,s){
  const w=24;
  const top = n.kind==='rock' ? -50 : n.palm ? -112 : (n.big ? -114 : -102);
  const frac=clamp(n.hp/n.maxhp,0,1);
  cx.fillStyle='rgba(0,0,0,0.6)'; cx.fillRect(s.x-w/2, s.y+top, w, 4);
  cx.fillStyle = n.kind==='rock' ? '#b9c2cf' : '#6fbf73';
  cx.fillRect(s.x-w/2, s.y+top, w*frac, 4);
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
    if(n.hp<n.maxhp) drawNodeHp(n,s);
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
    if(n.hp<n.maxhp) drawNodeHp(n,s);
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
    // brighter, larger cyan ripples so a fishing spot reads clearly from a distance
    cx.strokeStyle='rgba(150,225,255,0.8)'; cx.lineWidth=2;
    for(let i=0;i<3;i++){
      const rp=((ph+i*0.7)%2)/2;
      cx.globalAlpha=(1-rp)*0.9;
      cx.beginPath(); cx.ellipse(s.x,s.y,6+rp*18,(6+rp*18)*0.45,0,0,TAU); cx.stroke();
    }
    cx.globalAlpha=1;
    // an always-visible bobbing fish breaking the surface, so the spot never vanishes
    // between ripple pulses (the old version only flickered a shadow now and then)
    const by=Math.sin(ph*1.2)*1.4;
    cx.fillStyle='rgba(96,158,205,0.9)';
    cx.beginPath(); cx.ellipse(s.x, s.y-2+by, 4.6, 2.4, Math.sin(ph)*0.18, 0, TAU); cx.fill();   // body
    cx.beginPath(); cx.moveTo(s.x-4.4,s.y-2+by); cx.lineTo(s.x-8,s.y-4+by); cx.lineTo(s.x-8,s.y+by); cx.closePath(); cx.fill();  // tail
    cx.fillStyle='rgba(255,255,255,0.95)'; cx.beginPath(); cx.arc(s.x+2.6,s.y-2.8+by,0.9,0,TAU); cx.fill();  // eye glint
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
  if(b.kind==='snag'){
    // a drowned tree - a dead, leaning trunk poking from the flood, bare branches, a ring
    // of ripples where it breaks the water. Barik's flood made these everywhere.
    const g=cx; g.save(); g.translate(s.x,s.y);
    const sw=Math.sin(G.time*0.9+(b.ph||0))*0.9, h=b.h||18, lean=b.lean||0.5;
    // water-ring at the base
    g.strokeStyle='rgba(150,180,190,0.35)'; g.lineWidth=1;
    const rp=(G.time*0.6+(b.ph||0))%1;
    g.beginPath(); g.ellipse(0,0,3+rp*5,(3+rp*5)*0.5,0,0,TAU); g.globalAlpha=(1-rp)*0.5; g.stroke(); g.globalAlpha=1;
    g.strokeStyle='#3a2c22'; g.lineCap='round';
    // trunk
    g.lineWidth=3.2; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(lean*3+sw, -h*0.55, lean*5+sw*1.4, -h); g.stroke();
    // a few bare branches
    g.lineWidth=1.7;
    const bx=lean*4+sw*1.2, by=-h*0.85;
    g.beginPath(); g.moveTo(bx*0.55,by*0.62); g.lineTo(bx*0.55-5,by*0.62-4); g.stroke();
    g.beginPath(); g.moveTo(bx*0.75,by*0.8); g.lineTo(bx*0.75+6,by*0.8-3); g.stroke();
    g.beginPath(); g.moveTo(bx,by); g.lineTo(bx+3,by-6); g.stroke();
    g.restore(); return;
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
  if(b.kind==='wardgate'){
    // a rampart of old ruin-stone across the causeway neck. Segments are a full
    // tile wide so they overlap into one continuous wall; the centre tile carries
    // a warded, barred gatehouse whose rune glows the same green as the King's fire.
    const g=cx, H=b.mid?34:26; g.save(); g.translate(s.x,s.y);
    if(typeof drawShadowAt==='function') drawShadowAt(g,0,4,30);
    // the raised iso block (mossy grey stone)
    g.fillStyle='#2b322b';   // left face, toward camera
    g.beginPath(); g.moveTo(-32,2); g.lineTo(0,18); g.lineTo(0,18-H); g.lineTo(-32,2-H); g.closePath(); g.fill();
    g.fillStyle='#232922';   // right face
    g.beginPath(); g.moveTo(32,2); g.lineTo(0,18); g.lineTo(0,18-H); g.lineTo(32,2-H); g.closePath(); g.fill();
    g.fillStyle='#4a5443'; // top face (raised diamond)
    g.beginPath(); g.moveTo(0,2-16-H); g.lineTo(32,2-H); g.lineTo(0,18-H); g.lineTo(-32,2-H); g.closePath(); g.fill();
    g.fillStyle='rgba(120,140,90,0.35)';   // moss speckle on the crown
    g.beginPath(); g.ellipse(-8+(b.gx%3)*3,2-H-2,5,2.4,0,0,TAU); g.fill();
    g.beginPath(); g.ellipse(9-(b.gy%2)*2,2-H+3,3.5,1.8,0,0,TAU); g.fill();
    g.strokeStyle='rgba(150,168,120,0.45)'; g.lineWidth=1;   // crown ridge highlight
    g.beginPath(); g.moveTo(-32,2-H); g.lineTo(0,2-16-H); g.lineTo(32,2-H); g.stroke();
    // weathered courses down the near face
    g.strokeStyle='rgba(0,0,0,0.22)'; g.lineWidth=1;
    for(let yy=2-H+9; yy<2; yy+=9){ g.beginPath(); g.moveTo(-30,yy); g.lineTo(0,yy+15); g.stroke(); }
    if(b.mid){
      // a dark arched gateway sunk into the wall, barred with black iron
      g.fillStyle='#10130f';
      g.beginPath(); g.moveTo(-13,16); g.lineTo(-13,-8-H*0.4); g.quadraticCurveTo(0,-20-H*0.4,13,-8-H*0.4); g.lineTo(13,16); g.closePath(); g.fill();
      g.strokeStyle='#3f4838'; g.lineWidth=2; g.stroke();
      g.strokeStyle='#1c1f18'; g.lineWidth=3; g.lineCap='round';   // the portcullis bars
      for(let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(i*5.5,15); g.lineTo(i*5.5,-9-H*0.4); g.stroke(); }
      g.strokeStyle='#2a2f24'; g.lineWidth=2.4;
      for(const yy of [8,-2,-12]){ g.beginPath(); g.moveTo(-12,yy); g.lineTo(12,yy); g.stroke(); }
      // the ward-rune set in the lintel, breathing a cold green light
      const gl=0.45+0.4*Math.sin(G.time*1.8+(b.ph||0));
      g.fillStyle='rgba(120,220,160,'+(0.16*gl).toFixed(3)+')';   // halo
      g.beginPath(); g.ellipse(0,-16-H*0.4,15,15,0,0,TAU); g.fill();
      g.save(); g.translate(0,-16-H*0.4); g.rotate(Math.PI/4);
      g.strokeStyle='rgba(150,236,180,'+(0.55+0.35*gl).toFixed(2)+')'; g.lineWidth=2.2;
      g.strokeRect(-5,-5,10,10); g.beginPath(); g.moveTo(-5,0); g.lineTo(5,0); g.moveTo(0,-5); g.lineTo(0,5); g.stroke();
      g.restore();
      if(fxOn('particles') && Math.random()<0.14) G.parts.push({x:b.x, y:b.y-1.2, vx:rnd(-0.12,0.12), vy:-rnd(0.3,0.8),
        life:rnd(0.6,1.2), color:'rgba(150,230,180,0.7)', size:rnd(1.2,2.4), grav:-0.05});
    }
    g.restore(); return;
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
  if(b.kind==='dungeonmouth' && b.mill){
    const g=cx; drawShadowAt(g,s.x,s.y,16); g.save(); g.translate(s.x,s.y);
    const pulse=0.5+0.5*Math.sin(G.time*1.7);
    // a stone-rimmed cellar stair with a timber hatch flung open
    g.fillStyle='#6b5c46'; // dressed-stone rim
    g.beginPath(); g.moveTo(-24,7); g.lineTo(-20,-9); g.lineTo(20,-9); g.lineTo(24,7); g.closePath(); g.fill();
    g.strokeStyle='#3a3024'; g.lineWidth=2.2; g.stroke();
    g.fillStyle='#120d09'; // the dark stair-throat
    g.beginPath(); g.moveTo(-15,6); g.lineTo(-12,-6); g.lineTo(12,-6); g.lineTo(15,6); g.closePath(); g.fill();
    g.fillStyle='#2a2018'; // two worn steps catching the surface light
    g.fillRect(-13,3,26,2.2); g.fillRect(-11,-1,22,2.0);
    g.fillStyle='rgba(255,196,110,'+(0.10+0.10*pulse)+')'; // a faint warm lamp far below
    g.beginPath(); g.moveTo(-9,6); g.quadraticCurveTo(0,-4,9,6); g.closePath(); g.fill();
    // the thrown-open hatch leaf, timber planks banded in iron
    g.save(); g.translate(-18,-6); g.rotate(-0.5);
    g.fillStyle='#7a5c38'; g.fillRect(-3,-16,10,20);
    g.strokeStyle='#4a3722'; g.lineWidth=1.4; g.strokeRect(-3,-16,10,20);
    g.fillStyle='#3a3026'; g.fillRect(-3,-12,10,1.6); g.fillRect(-3,-1,10,1.6);
    g.restore();
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
  if(b.kind==='dungeonmouth' && b.undermaw){
    const g=cx; drawShadowAt(g,s.x,s.y,16); g.save(); g.translate(s.x,s.y);
    const pulse=0.5+0.5*Math.sin(G.time*1.9);
    // a rough stone stair cut down into the barrow-rock - earth and old stone, no ice
    g.fillStyle='#4a4038';   // rough rock rim
    g.beginPath(); g.moveTo(-24,7); g.lineTo(-19,-10); g.lineTo(19,-10); g.lineTo(24,7); g.closePath(); g.fill();
    g.strokeStyle='#241d17'; g.lineWidth=2.4; g.stroke();
    g.fillStyle='#0c0a08';   // the dark stair-throat
    g.beginPath(); g.moveTo(-15,6); g.lineTo(-12,-7); g.lineTo(12,-7); g.lineTo(15,6); g.closePath(); g.fill();
    g.fillStyle='#33291f';   // worn steps catching the torchlight
    g.fillRect(-13,3,26,2.2); g.fillRect(-11,-1,22,2.0); g.fillRect(-9,-5,18,1.8);
    g.fillStyle='rgba(120,60,180,'+(0.08+0.10*pulse)+')';   // a faint wrong glow far below, like the maw above
    g.beginPath(); g.moveTo(-9,6); g.quadraticCurveTo(0,-4,9,6); g.closePath(); g.fill();
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
  if(b.kind==='bonelever'){
    // a catacomb bone-lever: a skull-capped handle on a stone socket, throwing it grinds a bone-gate up
    const g=cx; drawShadowAt(g,s.x,s.y,7); g.save(); g.translate(s.x,s.y);
    g.fillStyle='#5a5048'; g.beginPath(); g.ellipse(0,-1,6,3,0,0,TAU); g.fill();   // stone socket
    g.strokeStyle='#2c261f'; g.lineWidth=1.2; g.stroke();
    g.strokeStyle='#cabfa6'; g.lineWidth=3; g.lineCap='round';                      // bone haft
    const ang=b.on? 0.75 : -0.75;
    const hx=Math.sin(ang)*11, hy=-2-Math.cos(ang)*13;
    g.beginPath(); g.moveTo(0,-2); g.lineTo(hx,hy); g.stroke();
    g.fillStyle= b.on? '#8a7c6c':'#e8ddc4'; g.beginPath(); g.arc(hx,hy,3.6,0,TAU); g.fill();   // skull knob
    g.strokeStyle='#7a6f58'; g.lineWidth=1; g.stroke();
    if(!b.on){ g.fillStyle='rgba(232,221,196,'+(0.4+0.3*Math.sin(G.time*3)).toFixed(2)+')'; g.font='bold 14px Georgia'; g.textAlign='center'; g.fillText('!',0,-30); }
    g.restore(); return;
  }
  if(b.kind==='bonebars'){
    // one tile of a bone portcullis sealing a maze corridor - pale bone bars on a dark socket
    const g=cx; g.save(); g.translate(s.x,s.y); drawShadowAt(g,0,0,16);
    g.fillStyle='#2c2622'; g.fillRect(-17,-40,34,5); g.strokeStyle='#120f0c'; g.lineWidth=1.2; g.strokeRect(-17,-40,34,5);   // lintel
    g.fillStyle='rgba(20,16,14,0.72)'; g.fillRect(-16,-35,32,40);   // dark backing so no gaps show
    g.fillStyle='#cabfa6'; g.strokeStyle='#7a6f58'; g.lineWidth=1;
    for(let i=-1;i<=1;i++){ g.fillRect(i*11-2.4,-35,4.8,40); g.strokeRect(i*11-2.4,-35,4.8,40); }   // vertical bars
    g.fillStyle='#b3a888'; for(let yy=-30;yy<=-4;yy+=12){ g.fillRect(-16,yy,32,3.2); }               // rib cross-bars
    g.restore(); return;
  }
  if(b.kind==='dancebtn'){
    // an Ossuary floor-stone: a sunken bone-ringed flagstone that blazes ghost-green when trodden
    const g=cx, lit=b.lit, gl=0.45+0.45*Math.sin(G.time*4 + b.x*1.3);
    g.save(); g.translate(s.x,s.y);
    g.fillStyle= lit? '#1e3a2c' : '#241f1b';
    g.beginPath(); g.moveTo(0,-11); g.lineTo(16,-1); g.lineTo(0,9); g.lineTo(-16,-1); g.closePath(); g.fill();
    g.strokeStyle= lit? '#9fe8c0' : '#5f5346'; g.lineWidth= lit?2.4:1.6; g.stroke();
    g.fillStyle= lit? 'rgba(120,220,160,'+(0.30+0.35*gl).toFixed(2)+')' : 'rgba(15,12,10,0.55)';
    g.beginPath(); g.moveTo(0,-6); g.lineTo(10,-1); g.lineTo(0,5); g.lineTo(-10,-1); g.closePath(); g.fill();
    if(lit){ g.fillStyle='rgba(220,255,235,'+(0.55+0.4*gl).toFixed(2)+')'; g.beginPath(); g.arc(0,-1,2.4,0,TAU); g.fill(); }
    else { g.fillStyle='rgba(150,140,120,0.5)'; g.font='bold 10px Georgia'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('✦',0,-1); g.textBaseline='alphabetic'; }
    g.restore(); return;
  }
  if(b.kind==='danceghost'){
    // the spectral bonewright who treads the pattern during a chamber's cut scene
    if(b.hidden) return;
    const g=cx, a=(b.fadeA!=null?b.fadeA:1);
    g.save(); g.translate(s.x,s.y);
    g.globalAlpha=0.30*a; g.fillStyle='rgba(120,220,160,1)';
    g.beginPath(); g.ellipse(0,-20,19,26,0,0,TAU); g.fill();
    g.globalAlpha=0.82*a;
    try{ drawSkeleton(g,0,0,{anim:b.anim||0, face:b.face||1, hurtT:0}); }catch(e){}
    g.restore(); return;
  }
  if(b.kind==='boneplate'){
    const g=cx; g.save(); g.translate(s.x,s.y);
    const lit=b.set||b.pressed, gl=0.4+0.5*Math.sin(G.time*3+b.x);
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
    // an iron portcullis dropped across the corridor. The sealed tiles run along the iso
    // diagonal (a constant-y tile row => +1 tile is +32 screen-x, +16 screen-y), so the gate
    // is drawn WALL-TO-WALL down that diagonal - one bar-set per corridor tile - rather than as
    // a flat screen-aligned fence that left the mouth uncovered and faced the wrong way.
    const g=cx, H=38;
    const txs=(b.tiles&&b.tiles.length)? b.tiles.map(t=>t[0]) : [b.x];
    const x0=Math.min(...txs), x1=Math.max(...txs), c0=(x0+x1)/2;
    const oxL=(x0-c0)*32, oyL=(x0-c0)*16;   // leftmost (north-west) tile face
    const oxR=(x1-c0)*32, oyR=(x1-c0)*16;   // rightmost (south-east) tile face
    const tiles=[]; for(let tx=x0;tx<=x1;tx++) tiles.push(tx);
    if(b.open){ // raised into the ceiling - just the lintel beam and stub teeth remain
      g.save(); g.translate(s.x,s.y);
      g.fillStyle='#3a332c'; g.strokeStyle='#1c1814'; g.lineWidth=1.4;
      g.beginPath(); g.moveTo(oxL-19,-44+oyL); g.lineTo(oxR+19,-44+oyR); g.lineTo(oxR+19,-37+oyR); g.lineTo(oxL-19,-37+oyL); g.closePath();
      g.fill(); g.stroke();
      g.fillStyle='#2a241e'; for(const tx of tiles){ const ox=(tx-c0)*32, oy=(tx-c0)*16; g.fillRect(ox-2,-44+oy,4,7); }
      g.restore(); return;
    }
    drawShadowAt(g,s.x,s.y,(x1-x0)*16+18);
    g.save(); g.translate(s.x,s.y);
    // top lintel: one continuous beam across the whole corridor mouth, down the diagonal
    g.fillStyle='#3a332c'; g.strokeStyle='#1c1814'; g.lineWidth=1.6;
    g.beginPath(); g.moveTo(oxL-19,-40+oyL); g.lineTo(oxR+19,-40+oyR); g.lineTo(oxR+19,-34+oyR); g.lineTo(oxL-19,-34+oyL); g.closePath();
    g.fill(); g.stroke();
    // dark backing slab filling the mouth wall-to-wall (a parallelogram down the diagonal)
    g.beginPath(); g.moveTo(oxL-19,-34+oyL); g.lineTo(oxR+19,-34+oyR); g.lineTo(oxR+19,-34+oyR+H); g.lineTo(oxL-19,-34+oyL+H); g.closePath();
    g.save(); g.clip(); g.fillStyle='#171310'; g.fill(); g.restore();
    // iron vertical bars, one set per corridor tile, riding along the diagonal
    for(const tx of tiles){ const ox=(tx-c0)*32, oy=(tx-c0)*16;
      g.save(); g.translate(ox,oy);
      g.fillStyle='#4a423a'; g.strokeStyle='#1c1814'; g.lineWidth=1.2;
      for(let i=-1;i<=1;i++){ g.fillRect(i*11-2.5,-38,5,38); g.strokeRect(i*11-2.5,-38,5,38); }   // 3 bars per tile
      g.fillStyle='#5a5048'; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(i*11,-38); g.lineTo(i*11-4,-32); g.lineTo(i*11+4,-32); g.closePath(); g.fill(); } // spiked feet
      g.restore();
    }
    // cross-bars following the diagonal, tying the bar-sets together
    g.strokeStyle='#3f382f'; g.lineWidth=3.2;
    for(let yy=-30;yy<=-4;yy+=13){ g.beginPath(); g.moveTo(oxL-17,yy+oyL); g.lineTo(oxR+17,yy+oyR); g.stroke(); }
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
    // a chunky raised wall block - the dungeon's real walls. Palette varies by b.theme so each
    // Act II dungeon reads distinctly (brine sea-stone, wind-scoured pale, forge basalt, storm
    // slate, tideglass). Default = the original basalt (the older shipped dungeons).
    const WT={
      brine:{l:'#173036', r:'#0f2429', t:'#2b5560', sp:'rgba(10,40,44,0.5)', ridge:'rgba(130,200,205,0.45)'},
      gale: {l:'#3b4048', r:'#2f343c', t:'#5c636e', sp:'rgba(255,255,255,0.14)', ridge:'rgba(215,228,240,0.55)'},
      forge:{l:'#2a1a12', r:'#1e120c', t:'#43291b', sp:'rgba(0,0,0,0.2)', ridge:'rgba(255,138,60,0.5)'},
      storm:{l:'#20263a', r:'#161b2c', t:'#39426a', sp:'rgba(10,14,30,0.5)', ridge:'rgba(150,192,255,0.5)'},
      tide: {l:'#2f4a5e', r:'#213847', t:'#6f9db0', sp:'rgba(255,255,255,0.14)', ridge:'rgba(232,202,120,0.6)'}
    };
    const th=WT[b.theme]||{l:'#2f2823', r:'#241e19', t:'#48403a', sp:'rgba(0,0,0,0.16)', ridge:'rgba(122,106,92,0.5)'};
    const g=cx, H=16, v=b.s||0;
    g.save(); g.translate(s.x,s.y);
    g.fillStyle=th.l;   // left face (bottom-left, toward camera)
    g.beginPath(); g.moveTo(-32,0); g.lineTo(0,16); g.lineTo(0,16-H); g.lineTo(-32,-H); g.closePath(); g.fill();
    g.fillStyle=th.r;   // right face (bottom-right)
    g.beginPath(); g.moveTo(32,0); g.lineTo(0,16); g.lineTo(0,16-H); g.lineTo(32,-H); g.closePath(); g.fill();
    g.fillStyle=th.t;   // top face (raised diamond)
    g.beginPath(); g.moveTo(0,-16-H); g.lineTo(32,-H); g.lineTo(0,16-H); g.lineTo(-32,-H); g.closePath(); g.fill();
    g.fillStyle=th.sp;   // speckle / sheen
    g.beginPath(); g.ellipse(-7+v*3,-H-2,4,2,0,0,TAU); g.fill();
    g.beginPath(); g.ellipse(8-v*2,-H+3,3,1.6,0,0,TAU); g.fill();
    g.strokeStyle=th.ridge; g.lineWidth=1;   // top ridge highlight
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
  if(b.kind==='dgate'){
    // a stone-and-iron portcullis plugging a corridor (x0..x1). Closed = barred; open = hauled up.
    const g=cx; g.save(); g.translate(s.x,s.y);
    const c0=(b.x0+b.x1)/2, tiles=[]; for(let tx=b.x0;tx<=b.x1;tx++) tiles.push(tx);
    if(b.open){
      for(const tx of tiles){ const ox=(tx-c0)*32, oy=(tx-c0)*16;
        g.fillStyle='#3a3630'; g.fillRect(ox-18,oy-44,36,7); g.strokeStyle='#181510'; g.lineWidth=1.4; g.strokeRect(ox-18,oy-44,36,7);
        g.fillStyle='#26221c'; for(let i=-1;i<=1;i++) g.fillRect(ox+i*11-2,oy-44,4,7); }
      g.restore(); return;
    }
    drawShadowAt(g,s.x,s.y,44);
    for(const tx of tiles){ const ox=(tx-c0)*32, oy=(tx-c0)*16;
      g.fillStyle='#34302a'; g.fillRect(ox-18,oy-40,36,6);
      g.strokeStyle='#151109'; g.lineWidth=1.5; g.fillStyle='#544636';
      for(let i=-1;i<=1;i++){ g.fillRect(ox+i*11-2.5,oy-38,5,38); g.strokeRect(ox+i*11-2.5,oy-38,5,38); }
      g.fillStyle='#3c342a'; for(let yy=-30;yy<=-4;yy+=13) g.fillRect(ox-16,oy+yy,32,3.5);
      g.fillStyle='#6a5a48'; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(ox+i*11,oy-38); g.lineTo(ox+i*11-4,oy-32); g.lineTo(ox+i*11+4,oy-32); g.closePath(); g.fill(); }
    }
    g.restore(); return;
  }
  if(b.kind==='dlever'){
    // a floor lever: iron post on a stone base; the handle throws right (lit) when pulled
    const g=cx; drawShadowAt(g,s.x,s.y,10); g.save(); g.translate(s.x,s.y);
    g.fillStyle='#3a352c'; g.beginPath(); g.moveTo(0,3); g.lineTo(9,-1); g.lineTo(0,-5); g.lineTo(-9,-1); g.closePath(); g.fill();
    g.strokeStyle='#241f18'; g.lineWidth=2; g.beginPath(); g.moveTo(0,-3); g.lineTo(0,-15); g.stroke();
    const on=b.on, a=on?0.7:-0.7;
    g.save(); g.translate(0,-15); g.rotate(a);
    g.strokeStyle='#8a7358'; g.lineWidth=3; g.lineCap='round'; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-12); g.stroke();
    g.fillStyle= on?'#d8c46a':'#b04030'; g.beginPath(); g.arc(0,-13,3,0,TAU); g.fill();
    g.restore();
    if(!on){ g.fillStyle='rgba(255,236,150,'+(0.4+0.3*Math.sin(G.time*3+b.x)).toFixed(2)+')'; g.font='bold 13px Georgia'; g.textAlign='center'; g.fillText('!',0,-34); }
    g.restore(); return;
  }
  if(b.kind==='dplate'){
    // a floor pressure-plate: raised iron-rimmed stone; sinks and lights green when trodden
    const g=cx; g.save(); g.translate(s.x,s.y);
    const p=b.pressed, off=p?0:2;
    g.fillStyle= p?'#2a2c24':'#3c3e32'; g.beginPath(); g.moveTo(0,-11-off); g.lineTo(15,-2-off); g.lineTo(0,7-off); g.lineTo(-15,-2-off); g.closePath(); g.fill();
    g.strokeStyle= p?'#c8d0a0':'#5c5e48'; g.lineWidth= p?2.2:1.6; g.stroke();
    g.fillStyle= p?'rgba(200,215,150,0.5)':'rgba(20,22,16,0.5)';
    g.beginPath(); g.moveTo(0,-6-off); g.lineTo(10,-2-off); g.lineTo(0,2-off); g.lineTo(-10,-2-off); g.closePath(); g.fill();
    if(!p && Math.random()<0.02) G.parts.push({x:b.x,y:b.y-0.2,vx:0,vy:-0.3,life:0.6,color:'rgba(220,230,180,0.5)',size:1.5,grav:0});
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
  if(b.kind==='grave'){
    // a leaning weathered headstone
    const g=cx; drawShadowAt(g,s.x,s.y,9); g.save(); g.translate(s.x,s.y);
    const lean=(b.s-1)*0.12;
    g.rotate(lean);
    g.fillStyle='#8b8f92'; g.strokeStyle='#5a5e60'; g.lineWidth=1;
    if(b.s===0){ // rounded headstone
      g.beginPath(); g.moveTo(-6,2); g.lineTo(-6,-10); g.quadraticCurveTo(0,-18,6,-10); g.lineTo(6,2); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle='rgba(40,44,46,0.5)'; g.beginPath(); g.moveTo(-3,-6); g.lineTo(3,-6); g.moveTo(-3,-3); g.lineTo(3,-3); g.stroke();
    } else if(b.s===1){ // cross
      g.fillRect(-2,-16,4,18); g.fillRect(-7,-11,14,4); g.strokeRect(-2,-16,4,18);
    } else { // flat slab
      g.beginPath(); g.moveTo(-6,2); g.lineTo(-5,-9); g.lineTo(5,-9); g.lineTo(6,2); g.closePath(); g.fill(); g.stroke();
    }
    g.restore(); return;
  }
  if(b.kind==='tombmouth'){
    // a sunken stone tomb - the mouth of the catacomb (a dark arched doorway)
    const g=cx; drawShadowAt(g,s.x,s.y,30); g.save(); g.translate(s.x,s.y);
    g.fillStyle='#6b6f72'; g.beginPath(); g.moveTo(-22,4); g.lineTo(-18,-20); g.lineTo(18,-20); g.lineTo(22,4); g.closePath(); g.fill();
    g.fillStyle='#565a5d'; g.beginPath(); g.moveTo(-18,-20); g.lineTo(0,-30); g.lineTo(18,-20); g.closePath(); g.fill();  // pediment
    g.strokeStyle='#3c4042'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-18,-20); g.lineTo(0,-30); g.lineTo(18,-20); g.stroke();
    // the dark doorway
    const gl=0.3+0.2*Math.sin(G.time*1.6+b.x);
    g.fillStyle='rgba(80,120,150,'+(0.12+0.08*gl).toFixed(2)+')'; g.beginPath(); g.ellipse(0,-6,12,14,0,0,TAU); g.fill();
    g.fillStyle='#141a1e'; g.beginPath(); g.moveTo(-8,4); g.lineTo(-8,-10); g.quadraticCurveTo(0,-18,8,-10); g.lineTo(8,4); g.closePath(); g.fill();
    g.strokeStyle='#2a2e30'; g.lineWidth=1.6; g.stroke();
    // a carved skull keystone
    g.fillStyle='#c9cdd0'; g.beginPath(); g.arc(0,-19,2.6,0,TAU); g.fill();
    g.fillStyle='#3c4042'; g.beginPath(); g.arc(-1,-19.5,0.7,0,TAU); g.arc(1,-19.5,0.7,0,TAU); g.fill();
    if(Math.random()<0.08) G.parts.push({x:b.x,y:b.y-0.3,vx:rnd(-0.1,0.1),vy:-rnd(0.2,0.6),life:rnd(0.6,1.2),color:'rgba(150,180,200,0.5)',size:rnd(1,2),grav:-0.02});
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
  if(b.kind==='fastexit'){
    // THE WAY UP - the identical fast-exit portal in every dungeon: a column of violet light
    // with rising motes and a bobbing up-arrow, so it always reads the same way.
    const g=cx, t=G.time; g.save(); g.translate(s.x,s.y);
    const glow=g.createRadialGradient(0,-16,2,0,-16,36); glow.addColorStop(0,'rgba(201,176,255,0.55)'); glow.addColorStop(1,'rgba(150,120,235,0)');
    g.fillStyle=glow; g.beginPath(); g.ellipse(0,-16,20,32,0,0,TAU); g.fill();
    // a bright swirling base ring on the floor
    g.strokeStyle='rgba(230,220,255,0.9)'; g.lineWidth=2.4; g.beginPath(); g.ellipse(0,-1,13,5,0,0,TAU); g.stroke();
    g.strokeStyle='rgba(180,150,240,0.7)'; g.lineWidth=1.6; g.beginPath(); g.ellipse(0,-1,8,3.2,0,0,TAU); g.stroke();
    // rising motes
    for(let i=0;i<6;i++){ const ph=((t*0.8)+i/6)%1, yy=-2-ph*34, xx=Math.sin((t*2+i)*1.3)*6*(1-ph*0.5);
      g.globalAlpha=0.85*(1-ph); g.fillStyle=i%2?'#e8dcff':'#c9b0ff'; g.beginPath(); g.arc(xx,yy,2.3*(1-ph*0.4),0,TAU); g.fill(); }
    g.globalAlpha=1;
    // a bobbing up-arrow chevron so it clearly reads as the WAY UP
    const ay=-24+Math.sin(t*3)*1.6; g.fillStyle='#efe6ff';
    g.beginPath(); g.moveTo(0,ay-6); g.lineTo(-6,ay+2); g.lineTo(-2.2,ay+2); g.lineTo(-2.2,ay+8); g.lineTo(2.2,ay+8); g.lineTo(2.2,ay+2); g.lineTo(6,ay+2); g.closePath(); g.fill();
    g.restore(); return;
  }
  if(b.kind==='signalbeacon'){
    // a tall iron signal-brazier on the Windward Bluffs. Cold until the strait is calmed;
    // light it and it blazes gold, calling Ashwing down out of the cloud-sea.
    const g=cx, t=G.time, lit=!!b.lit; drawShadowAt(g,s.x,s.y,14); g.save(); g.translate(s.x,s.y);
    // stacked-stone plinth
    g.fillStyle='#6b655c'; g.beginPath(); g.moveTo(-12,4); g.lineTo(0,10); g.lineTo(12,4); g.lineTo(12,-2); g.lineTo(0,4); g.lineTo(-12,-2); g.closePath(); g.fill();
    g.fillStyle='#4f4a43'; g.beginPath(); g.moveTo(-12,-2); g.lineTo(0,4); g.lineTo(0,1); g.lineTo(-12,-5); g.closePath(); g.fill();
    // three iron legs up to the bowl
    g.strokeStyle='#2a2620'; g.lineWidth=3; g.lineCap='round';
    g.beginPath(); g.moveTo(-7,-2); g.lineTo(-4,-24); g.moveTo(7,-2); g.lineTo(4,-24); g.moveTo(0,0); g.lineTo(0,-24); g.stroke();
    // the fire-bowl
    g.fillStyle='#3a352d'; g.beginPath(); g.ellipse(0,-24,11,4.5,0,0,TAU); g.fill();
    g.fillStyle='#241f19'; g.beginPath(); g.ellipse(0,-25,8.5,3,0,0,TAU); g.fill();
    if(lit){
      const fl=0.6+0.4*Math.sin(t*9);
      const gr=g.createRadialGradient(0,-30,2,0,-30,42); gr.addColorStop(0,'rgba(255,200,110,'+(0.5+0.2*fl).toFixed(2)+')'); gr.addColorStop(1,'rgba(255,150,60,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(0,-30,42,0,TAU); g.fill();
      for(let i=0;i<3;i++){ const ph=t*7+i*2.1, h=18+6*Math.sin(ph);
        g.fillStyle=i%2?'#ffce6a':'#ff8a3c'; g.beginPath();
        g.moveTo(-6+i*4,-26); g.quadraticCurveTo(-3+i*4+Math.sin(ph)*3,-26-h*0.6, -4+i*4,-26-h);
        g.quadraticCurveTo(-6+i*4,-26-h*0.5,-6+i*4,-26); g.closePath(); g.fill(); }
    } else {
      g.fillStyle='#5a4a34'; for(const dx of [-3,0,3]) g.fillRect(dx-1,-27,2,4);   // cold kindling
      const pulse=0.3+0.25*Math.sin(t*2);
      g.fillStyle='rgba(150,205,235,'+pulse.toFixed(2)+')'; g.font='bold 13px Georgia'; g.textAlign='center'; g.fillText('!',0,-40);
    }
    g.restore(); return;
  }
  if(b.kind==='rainbow'){
    // a band of the rainbow road laid over one cloud tile - a soft glowing diamond
    const g=cx, hue=b.hue||0, sh=0.5+0.5*Math.sin(G.time*1.4+(b.sh||0));
    g.save(); g.translate(s.x,s.y);
    g.globalAlpha=0.9;
    g.fillStyle='hsl('+hue+',85%,'+(60+sh*8)+'%)';
    g.beginPath(); g.moveTo(0,-TH/2); g.lineTo(TW/2,0); g.lineTo(0,TH/2); g.lineTo(-TW/2,0); g.closePath(); g.fill();
    // an inner brighter core band
    g.fillStyle='hsl('+((hue+40)%360)+',95%,'+(74+sh*8)+'%)';
    g.beginPath(); g.moveTo(0,-TH/2+6); g.lineTo(TW/2-12,0); g.lineTo(0,TH/2-6); g.lineTo(-TW/2+12,0); g.closePath(); g.fill();
    g.globalAlpha=1;
    g.restore(); return;
  }
  if(b.kind==='skytile'){
    // a floating rune-plate; lights when trodden in order
    const g=cx, lit=b.set, gl=0.4+0.5*Math.sin(G.time*3+b.x), hue=((b.ord||1)*60)%360;
    g.save(); g.translate(s.x,s.y);
    g.fillStyle= lit? 'hsl('+hue+',80%,40%)' : '#2a2f42';
    g.beginPath(); g.moveTo(0,-11); g.lineTo(15,-2); g.lineTo(0,7); g.lineTo(-15,-2); g.closePath(); g.fill();
    g.strokeStyle= lit? 'hsl('+hue+',95%,72%)' : '#5a6482'; g.lineWidth= lit?2.4:1.6; g.stroke();
    if(lit){ g.fillStyle='hsla('+hue+',95%,80%,'+(0.25+0.25*gl).toFixed(2)+')';
      g.beginPath(); g.moveTo(0,-7); g.lineTo(10,-2); g.lineTo(0,4); g.lineTo(-10,-2); g.closePath(); g.fill(); }
    // NO number label - the order is a secret you have to guess (a wrong tread fights back)
    if(!lit){ g.fillStyle='rgba(190,210,255,'+(0.35+0.3*Math.sin(G.time*3+b.x)).toFixed(2)+')'; g.font='bold 13px Georgia'; g.textAlign='center'; g.fillText('?',0,-23); }
    g.restore(); return;
  }
  if(b.kind==='skygate'){
    if(b.open) return;   // the wind-ward is parted - nothing to draw
    const g=cx, t=G.time; g.save(); g.translate(s.x,s.y);
    // a shimmering vertical wind-ward across the rainbow bridge, faint rainbow sheen
    for(let i=-2;i<=2;i++){ const bx=i*7, sway=Math.sin(t*3+i*1.1)*2.2;
      const hue=((i+2)/4*300 + t*30)%360;
      g.strokeStyle='hsla('+hue+',90%,72%,0.55)'; g.lineWidth=3.2; g.lineCap='round';
      g.beginPath(); g.moveTo(bx+sway,-34); g.lineTo(bx-sway,6); g.stroke();
      g.strokeStyle='rgba(255,255,255,0.6)'; g.lineWidth=1.1;
      g.beginPath(); g.moveTo(bx+sway,-34); g.lineTo(bx-sway,6); g.stroke(); }
    g.lineCap='butt';
    // a soft glow lock at the centre
    g.fillStyle='rgba(230,240,255,'+(0.35+0.25*Math.sin(t*2.5)).toFixed(2)+')';
    g.beginPath(); g.ellipse(0,-14,10,16,0,0,TAU); g.fill();
    if(Math.random()<0.12) G.parts.push({x:b.x,y:b.y,vx:rnd(-0.15,0.15),vy:-rnd(0.2,0.7),life:rnd(0.5,1.1),color:'rgba(220,235,255,0.6)',size:rnd(1,2),grav:-0.03});
    g.restore(); return;
  }
  if(b.kind==='stormbead'){
    // a hovering bead of white stormlight, dropped by the Storm-Wraith - walk over it
    const g=cx, t=G.time, bob=Math.sin(t*3)*2.4;
    g.save(); g.translate(s.x, s.y-14+bob);
    const gl=0.55+0.35*Math.sin(t*5);
    g.fillStyle='rgba(200,176,255,'+(0.30*gl).toFixed(2)+')'; g.beginPath(); g.arc(0,0,13,0,TAU); g.fill();
    g.fillStyle='rgba(230,215,255,0.95)'; g.beginPath(); g.arc(0,0,5.5,0,TAU); g.fill();
    g.fillStyle='#fff'; g.beginPath(); g.arc(-1.4,-1.4,2.2,0,TAU); g.fill();
    // a couple of crackle-sparks
    for(let i=0;i<3;i++){ const a=t*4+i*2.1; g.strokeStyle='rgba(200,176,255,'+(0.6*gl).toFixed(2)+')'; g.lineWidth=1;
      g.beginPath(); g.moveTo(Math.cos(a)*6,Math.sin(a)*6); g.lineTo(Math.cos(a)*11,Math.sin(a)*11); g.stroke(); }
    g.restore();
    if(Math.random()<0.3) G.parts.push({x:b.x,y:b.y,vx:rnd(-0.1,0.1),vy:-rnd(0.2,0.5),life:rnd(0.4,0.9),color:'rgba(210,190,255,0.7)',size:rnd(1,2),grav:-0.02});
    return;
  }
  if(b.kind==='skybird'){
    // a small bright bird perched on a cloud-post, wings shifting
    const g=cx, t=G.time, flap=Math.sin(t*3)*3, hop=Math.sin(t*1.4)*1.5;
    drawShadowAt(g,s.x,s.y,9); g.save(); g.translate(s.x,s.y-6+hop);
    // little cloud-perch
    g.fillStyle='rgba(235,240,250,0.85)'; g.beginPath(); g.ellipse(0,6,12,4,0,0,TAU); g.fill();
    // body
    g.fillStyle='#4aa0e0'; g.beginPath(); g.ellipse(0,-6,8,6,0,0,TAU); g.fill();
    g.fillStyle='#7fd0ff'; g.beginPath(); g.ellipse(-2,-5,5,4,0,0,TAU); g.fill();
    // head + beak
    g.fillStyle='#3a86c8'; g.beginPath(); g.arc(-6,-11,4,0,TAU); g.fill();
    g.fillStyle='#ffcf5a'; g.beginPath(); g.moveTo(-10,-11); g.lineTo(-14,-10); g.lineTo(-10,-9); g.closePath(); g.fill();
    g.fillStyle='#0a1420'; g.beginPath(); g.arc(-7,-12,1.1,0,TAU); g.fill();
    // wing (flaps)
    g.fillStyle='#2f6fae'; g.save(); g.translate(2,-6); g.rotate(-0.2+flap*0.06);
    g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(12,-6+flap,9,4); g.quadraticCurveTo(5,2,0,1); g.closePath(); g.fill(); g.restore();
    // tail
    g.fillStyle='#3a86c8'; g.beginPath(); g.moveTo(6,-5); g.lineTo(13,-3); g.lineTo(6,-1); g.closePath(); g.fill();
    g.restore();
    // NOTE: the floating name is drawn by the generic b.name block at the top of drawDecor.
    // Do not draw it again here, or the label stacks on itself into an unreadable double.
    return;
  }
  if(b.kind==='vathghost'){
    // Vath's violet apparition on the rainbow road - a floating spirit you trade words with,
    // hanging in the air and shimmering, robe fraying to wisps at its base. Not a fight.
    const g=cx, t=G.time, bob=Math.sin(t*1.6+b.x)*3;
    g.save(); g.translate(s.x, s.y-30+bob); g.globalAlpha=0.85;
    g.fillStyle='rgba(160,110,230,0.18)'; g.beginPath(); g.ellipse(0,-6,20,27,0,0,TAU); g.fill();   // spectral glow
    g.fillStyle='rgba(90,54,120,0.92)';                                                             // robe, tapering to wisps
    g.beginPath(); g.moveTo(0,-30); g.quadraticCurveTo(-14,-22,-11,6);
    g.quadraticCurveTo(-6,14,-3,6+Math.sin(t*6)*2); g.quadraticCurveTo(0,16,3,6+Math.sin(t*6+1)*2);
    g.quadraticCurveTo(6,14,11,6); g.quadraticCurveTo(14,-22,0,-30); g.closePath(); g.fill();
    g.fillStyle='rgba(40,26,58,0.95)'; g.beginPath(); g.ellipse(0,-22,7,9,0,0,TAU); g.fill();        // hood shadow
    const eg=0.6+0.4*Math.sin(t*3);
    g.fillStyle='rgba(224,176,255,'+eg.toFixed(2)+')'; g.beginPath(); g.arc(-3,-23,1.5,0,TAU); g.arc(3,-23,1.5,0,TAU); g.fill();
    g.restore();
    if(Math.random()<0.3) G.parts.push({x:b.x+rnd(-0.4,0.4), y:b.y-1.4, vx:rnd(-0.15,0.15), vy:-rnd(0.3,0.7), life:rnd(0.6,1.2), color:'#c77bff', size:rnd(1.5,3), grav:-0.03});
    return;
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
  if(b.kind==='millgear'){
    // a spinning iron cog of the gear-train - turns only while the works are powered
    const g=cx, R=b.r||6, N=Math.max(7,Math.round(R)+2);
    const rot=(G._millPower? (G._millT||0):0)*(b.spin||1);
    g.save(); g.translate(s.x,s.y-R*0.5); g.rotate(rot);
    // teeth
    g.fillStyle='#4a423a';
    for(let i=0;i<N;i++){ const a=i/N*TAU, cx2=Math.cos(a)*R, cy2=Math.sin(a)*R*0.55;
      g.save(); g.translate(cx2,cy2); g.rotate(a); g.fillRect(-R*0.16,-R*0.16,R*0.34,R*0.34); g.restore(); }
    // rim + hub (squashed for the iso tilt)
    g.fillStyle='#5a5048'; g.beginPath(); g.ellipse(0,0,R,R*0.6,0,0,TAU); g.fill();
    g.strokeStyle='#2a241e'; g.lineWidth=1.6; g.stroke();
    g.fillStyle='#3a332c'; g.beginPath(); g.ellipse(0,0,R*0.62,R*0.37,0,0,TAU); g.fill();
    // spokes
    g.strokeStyle='#6a5f54'; g.lineWidth=Math.max(1.4,R*0.14);
    for(let i=0;i<4;i++){ const a=i/4*TAU; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*R*0.6,Math.sin(a)*R*0.36); g.stroke(); }
    g.fillStyle='#7a6f62'; g.beginPath(); g.ellipse(0,0,R*0.2,R*0.13,0,0,TAU); g.fill();
    g.restore(); return;
  }
  if(b.kind==='millwheel'){
    // the great mill-wheel standing in its race - dark and still until the water runs,
    // then it turns steadily with a churn of spray at its foot
    const g=cx, R=b.r||11, powered=!!G._millPower;
    const rot=(powered? (G._millT||0):0)*0.7;
    drawShadowAt(g,s.x,s.y,R*0.9);
    g.save(); g.translate(s.x,s.y-R);
    // a stone axle-block behind the wheel
    g.fillStyle='#2c2620'; g.fillRect(-R*0.28,-R*0.2,R*0.56,R+8);
    // the flooded race glinting at the wheel's foot
    if(powered){ g.fillStyle='rgba(120,180,220,0.4)'; g.beginPath(); g.ellipse(0,R*0.92,R*1.1,R*0.4,0,0,TAU); g.fill(); }
    g.save(); g.rotate(rot);
    // outer + inner timber rims (an upright wheel - barely squashed)
    g.strokeStyle='#6a5540'; g.lineWidth=R*0.15; g.beginPath(); g.ellipse(0,0,R,R*0.95,0,0,TAU); g.stroke();
    g.strokeStyle='#7d6449'; g.lineWidth=R*0.08; g.beginPath(); g.ellipse(0,0,R*0.66,R*0.62,0,0,TAU); g.stroke();
    // spokes + paddle-boards around the rim
    const N=8; for(let i=0;i<N;i++){ const a=i/N*TAU, ox=Math.cos(a), oy=Math.sin(a)*0.95;
      g.strokeStyle='#5a4835'; g.lineWidth=R*0.09; g.beginPath(); g.moveTo(0,0); g.lineTo(ox*R,oy*R); g.stroke();
      g.save(); g.translate(ox*R*0.86,oy*R*0.86); g.rotate(a); g.fillStyle=(i%2)?'#8a7052':'#755d43'; g.fillRect(-R*0.07,-R*0.2,R*0.14,R*0.4);
      g.strokeStyle='#4a3a2a'; g.lineWidth=1; g.strokeRect(-R*0.07,-R*0.2,R*0.14,R*0.4); g.restore(); }
    // hub
    g.fillStyle='#3a2f24'; g.beginPath(); g.ellipse(0,0,R*0.2,R*0.19,0,0,TAU); g.fill();
    g.fillStyle='#8a7052'; g.beginPath(); g.ellipse(0,0,R*0.09,R*0.085,0,0,TAU); g.fill();
    g.restore(); g.restore();
    // a lazy churn of spray at the wheel's foot while it turns
    if(powered && Math.random()<0.3) G.parts.push({x:b.x+rnd(-0.6,0.6),y:b.y+0.5,vx:rnd(-0.6,0.6),vy:-rnd(0.5,1.4),life:rnd(0.4,1.1),color:Math.random()<0.5?'#cfeaf8':'#9ecbe8',size:rnd(1.4,3),grav:0.08});
    return;
  }
  if(b.kind==='sluicelever'){
    // an iron sluice wheel on a post - turn it (with the crank) to open the headrace
    const g=cx; drawShadowAt(g,s.x,s.y,7); g.save(); g.translate(s.x,s.y);
    g.fillStyle='#3a332c'; g.fillRect(-2.4,-16,4.8,16);                 // the post
    g.strokeStyle='#1c1814'; g.lineWidth=1.2; g.strokeRect(-2.4,-16,4.8,16);
    g.save(); g.translate(0,-17); g.rotate(b.on? 1.1 : 0);              // the hand-wheel, turned when thrown
    g.strokeStyle= b.on? '#7fc4e8':'#8a7f70'; g.lineWidth=2.6;
    g.beginPath(); g.arc(0,0,7,0,TAU); g.stroke();
    for(let i=0;i<4;i++){ const a=i/4*TAU; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*7,Math.sin(a)*7); g.stroke(); }
    for(let i=0;i<4;i++){ const a=i/4*TAU+0.3; g.fillStyle=b.on?'#9ed6f0':'#a89a88'; g.beginPath(); g.arc(Math.cos(a)*7,Math.sin(a)*7,1.8,0,TAU); g.fill(); }   // spoke handles
    g.restore();
    // a tide-lock valve is carved with a NUMBER (pips) matching the plaque's order
    if(b.pips){ const n=b.pips, perRow=Math.min(n,3), rows=Math.ceil(n/3), pw=Math.max(11,perRow*4.2+5), ph=rows*4.2+4, top=-10.5;
      g.fillStyle='#241c13'; g.fillRect(-pw/2,top,pw,ph); g.strokeStyle='#0c0805'; g.lineWidth=1; g.strokeRect(-pw/2,top,pw,ph);
      g.fillStyle=b.on?'#9ed6f0':'#e7d6ac';
      for(let i=0;i<n;i++){ const r=Math.floor(i/3), cn=(r===rows-1)?(n-r*3):3, c=i%3;
        g.beginPath(); g.arc((c-(cn-1)/2)*4.2, top+3+r*4.2, 1.35, 0, TAU); g.fill(); } }
    if(!b.on){ g.fillStyle='rgba(150,205,235,'+(0.4+0.3*Math.sin(G.time*3)).toFixed(2)+')'; g.font='bold 14px Georgia'; g.textAlign='center'; g.fillText('!',0,-32); }
    g.restore(); return;
  }
  if(b.kind==='millplaque'){
    // a standing stone stele at a tide-lock's mouth, carved top-to-bottom with the ORDER the
    // numbered valves must be thrown (each row's pips = that step's valve-number)
    const g=cx, seq=b.seq||[], maxP=seq.reduce((m,v)=>Math.max(m,v),1);
    const rowH=12, W=Math.max(34, 20+maxP*4.6), H=seq.length*rowH+18;
    drawShadowAt(g,s.x,s.y,W*0.4); g.save(); g.translate(s.x,s.y);
    g.fillStyle='#3b332a'; g.fillRect(-W/2,-H,W,H);                       // the slab
    g.fillStyle='#2a231b'; g.fillRect(-W/2,-H,W,6);                        // a darker cap
    g.strokeStyle='#120d08'; g.lineWidth=1.6; g.strokeRect(-W/2,-H,W,H);
    g.fillStyle='#9a8f79'; g.font='bold 8px Georgia'; g.textAlign='center'; g.textBaseline='middle';
    g.fillText('THE ORDER', 0, -H+9);
    g.strokeStyle='#221b12'; g.lineWidth=1; g.beginPath(); g.moveTo(-W/2+3,-H+15); g.lineTo(W/2-3,-H+15); g.stroke();
    for(let i=0;i<seq.length;i++){ const y=-H+18+i*rowH+rowH/2, n=seq[i];
      g.fillStyle='#6f6555'; g.font='bold 8px Georgia'; g.textAlign='left'; g.fillText((i+1)+'', -W/2+4, y);
      g.fillStyle='#d9c59b'; for(let k=0;k<n;k++){ g.beginPath(); g.arc(-W/2+14+k*4.6, y, 1.7, 0, TAU); g.fill(); }
      if(i<seq.length-1){ g.strokeStyle='#4a4234'; g.lineWidth=0.8; g.beginPath(); g.moveTo(-W/2+4,y+rowH/2); g.lineTo(W/2-4,y+rowH/2); g.stroke(); } }
    g.restore(); return;
  }
  if(b.kind==='coggate'){
    // a gear-driven portcullis that rises and falls with the works. openAmt: 0=dropped,
    // 1=hauled up into the lintel. Drawn one panel per corridor tile (a down-right iso
    // diagonal), mirroring the firegate so the whole span is plugged.
    const g=cx, c0=(b.x0+b.x1)/2, amt=b.openAmt||0, H=38;
    const tiles=[]; for(let tx=b.x0; tx<=b.x1; tx++) tiles.push(tx);
    if(amt<0.98) drawShadowAt(g,s.x,s.y,30);
    for(const tx of tiles){ const ox=(tx-c0)*32, oy=(tx-c0)*16;
      g.save(); g.translate(s.x+ox, s.y+oy);
      // top lintel + gear housing (always shown)
      g.fillStyle='#33261c'; g.fillRect(-18,-40,36,6);
      g.strokeStyle='#140c06'; g.lineWidth=1.5; g.strokeRect(-18,-40,36,6);
      // the sliding bar-panel: full height H, hauled up by amt (clipped at the lintel)
      const drop=H*(1-amt);                    // how far the bars hang below the lintel
      if(drop>0.5){
        g.save();
        g.beginPath(); g.rect(-18,-34,36,drop); g.clip();
        g.fillStyle='#4a423a';
        for(let i=-1;i<=1;i++){ g.fillRect(i*11-2.5,-34,5,H); g.strokeStyle='#1c1814'; g.lineWidth=1.4; g.strokeRect(i*11-2.5,-34,5,H); }
        g.fillStyle='#3f382f'; for(let yy=-30;yy<=-4;yy+=13){ g.fillRect(-16,yy,32,3.4); }
        g.fillStyle='#5a5048'; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(i*11,-34+drop); g.lineTo(i*11-4,-34+drop-6); g.lineTo(i*11+4,-34+drop-6); g.closePath(); g.fill(); }   // spiked feet
        g.restore();
      }
      g.restore();
    }
    return;
  }
  if(b.kind==='icebrazier'){
    // a stone fire-bowl on a plinth. Lit: warm flame + glow. Frozen: crusted in blue ice.
    const g=cx, t=G.time; drawShadowAt(g,s.x,s.y,8); g.save(); g.translate(s.x,s.y);
    // plinth + bowl
    g.fillStyle='#3a352e'; g.beginPath(); g.moveTo(-6,-2); g.lineTo(0,1); g.lineTo(6,-2); g.lineTo(5,-14); g.lineTo(-5,-14); g.closePath(); g.fill();
    g.fillStyle='#4a443c'; g.beginPath(); g.ellipse(0,-14,8,3.2,0,0,TAU); g.fill();
    g.strokeStyle='#221e19'; g.lineWidth=1.2; g.stroke();
    if(b.lit){
      const fl=0.8+0.2*Math.sin(t*20)+0.1*Math.sin(t*6.3);
      const gg=g.createRadialGradient(0,-20,1,0,-18,26); gg.addColorStop(0,'rgba(255,240,180,0.5)'); gg.addColorStop(1,'rgba(255,120,40,0)');
      g.fillStyle=gg; g.beginPath(); g.ellipse(0,-18,20,20,0,0,TAU); g.fill();
      const h=(13+3*Math.sin(t*9))*fl;
      g.fillStyle='#ff8a2c'; g.beginPath(); g.moveTo(-5,-14); g.quadraticCurveTo(-3,-14-h*0.6,0,-14-h); g.quadraticCurveTo(3,-14-h*0.6,5,-14); g.closePath(); g.fill();
      g.fillStyle='#ffd45a'; g.beginPath(); g.moveTo(-2.6,-14); g.quadraticCurveTo(-1.4,-14-h*0.5,0,-14-h*0.72); g.quadraticCurveTo(1.4,-14-h*0.5,2.6,-14); g.closePath(); g.fill();
      if(Math.random()<0.3) G.parts.push({x:b.x+rnd(-0.2,0.2),y:b.y-1.4,vx:rnd(-0.15,0.15),vy:-rnd(0.5,1.2),life:rnd(0.4,0.9),color:Math.random()<0.5?'#ffd07a':'#ff9a3c',size:rnd(1,2),grav:-0.05});
    } else if(b.frozen){
      // ice crust over the bowl, with a thaw-shimmer as it melts
      const p=Math.max(0,Math.min(1,(b._thaw||0)/(b.need||1)));
      g.fillStyle='#bfe6f4'; g.beginPath(); g.moveTo(-7,-13); g.lineTo(-3,-13-8*(1-p)); g.lineTo(2,-13-11*(1-p)); g.lineTo(6,-13-6*(1-p)); g.lineTo(7,-13); g.closePath(); g.fill();
      g.strokeStyle='rgba(120,175,205,0.8)'; g.lineWidth=1; g.stroke();
      if(p>0){ g.fillStyle='rgba(255,170,70,'+(0.15+0.3*p).toFixed(2)+')'; g.beginPath(); g.ellipse(0,-14,6*p,3*p,0,0,TAU); g.fill(); }
    }
    g.restore(); return;
  }
  if(b.kind==='icewall'){
    // a wall of living ice across a corridor; drawn one jagged pane per tile (the tiles
    // share a row, so they step down-right in iso). Thaws down as _thaw fills; the seal
    // is taller and bluer. Per-tile offset from s follows the firegate/coggate pattern.
    const g=cx, prog=Math.max(0,Math.min(1,(b._thaw||0)/(b.need||1)));
    const c0=b.tiles.reduce((a,t)=>a+t[0],0)/b.tiles.length;   // centre x of the row
    const H=b.seal?46:36, h=H*(1-prog*0.8);                    // melts down as it thaws
    if(prog<0.99) drawShadowAt(g,s.x,s.y,20);
    for(const [tx,ty] of b.tiles){ const ox=(tx-c0)*32, oy=(tx-c0)*16;
      g.save(); g.translate(s.x+ox, s.y+oy);
      if(prog>0){ g.fillStyle='rgba(150,200,225,'+(0.2*prog).toFixed(2)+')'; g.beginPath(); g.ellipse(0,2,15,6,0,0,TAU); g.fill(); }
      const g1=g.createLinearGradient(0,-h,0,4);
      g1.addColorStop(0, b.seal?'#dff2fb':'#cfe9f6'); g1.addColorStop(1, b.seal?'#8fc0dd':'#a6cfe2');
      g.fillStyle=g1;
      g.beginPath(); g.moveTo(-15,2); g.lineTo(-11,-h*0.8); g.lineTo(-4,-h); g.lineTo(3,-h*0.85); g.lineTo(11,-h*0.7); g.lineTo(15,2); g.closePath(); g.fill();
      g.strokeStyle='rgba(110,165,195,0.7)'; g.lineWidth=1.2; g.stroke();
      g.strokeStyle='rgba(255,255,255,0.35)'; g.lineWidth=1;   // internal facets
      g.beginPath(); g.moveTo(-4,-h); g.lineTo(-1,2); g.moveTo(6,-h*0.75); g.lineTo(2,2); g.stroke();
      if(prog>0){ g.fillStyle='rgba(255,160,70,'+(0.10+0.22*prog).toFixed(2)+')'; g.beginPath(); g.ellipse(0,-h*0.4,10,h*0.5,0,0,TAU); g.fill(); }   // torch-bite glow
      g.restore();
    }
    return;
  }
  if(b.kind==='thinice'){
    // a pane of thin ice set into the floor; stress-cracks spread as you linger on it
    const g=cx, c=Math.max(0,Math.min(1,(b._crack||0)/1.6));
    g.save(); g.translate(s.x,s.y);
    g.fillStyle='rgba(200,232,244,0.5)'; g.beginPath(); g.moveTo(0,-9); g.lineTo(15,0); g.lineTo(0,9); g.lineTo(-15,0); g.closePath(); g.fill();
    g.strokeStyle='rgba(120,170,200,0.65)'; g.lineWidth=1; g.stroke();
    // crack lines - faint by default, vivid as it's about to break
    g.strokeStyle='rgba(90,120,150,'+(0.35+0.5*c).toFixed(2)+')'; g.lineWidth=0.8+c;
    g.beginPath(); g.moveTo(-9,-2); g.lineTo(-2,2); g.lineTo(4,-3); g.lineTo(11,1);
    g.moveTo(0,-7); g.lineTo(-3,1); g.lineTo(2,7); g.stroke();
    g.restore(); return;
  }
  if(b.kind==='lavaseg'){
    // one cell of a lava channel: molten (hot, blocking) or cooled crust (dark, walkable)
    const g=cx; g.save(); g.translate(s.x,s.y);
    if(b.hot){
      const gl=0.5+0.4*Math.sin(G.time*2.4+b.x*1.3+b.y);
      g.fillStyle='rgba(120,40,20,0.75)'; g.beginPath(); g.moveTo(0,-9); g.lineTo(16,-1); g.lineTo(0,7); g.lineTo(-16,-1); g.closePath(); g.fill();
      g.fillStyle='rgba(255,110,30,'+(0.45+0.3*gl).toFixed(2)+')'; g.beginPath(); g.moveTo(0,-6); g.lineTo(11,-1); g.lineTo(0,4); g.lineTo(-11,-1); g.closePath(); g.fill();
      g.fillStyle='rgba(255,214,120,'+(0.35+0.4*gl).toFixed(2)+')'; g.beginPath(); g.ellipse(0,-1,6,3,0,0,TAU); g.fill();
      if(Math.random()<0.02) G.parts.push({x:b.x,y:b.y-0.1,vx:rnd(-0.2,0.2),vy:-rnd(0.4,1.1),life:rnd(0.5,1.1),color:'#ff9a3c',size:rnd(1,2.2),grav:-0.05});
    } else {
      g.fillStyle='rgba(26,18,16,0.55)'; g.beginPath(); g.moveTo(0,-9); g.lineTo(16,-1); g.lineTo(0,7); g.lineTo(-16,-1); g.closePath(); g.fill();
      g.strokeStyle='rgba(180,80,40,0.22)'; g.lineWidth=1; g.beginPath(); g.moveTo(-8,-2); g.lineTo(0,1); g.lineTo(7,-3); g.stroke();
    }
    g.restore(); return;
  }
  if(b.kind==='lavasluice'){
    // a diverter stone with a paddle that swings to the flowing side, glowing when open
    const g=cx; drawShadowAt(g,s.x,s.y,7); g.save(); g.translate(s.x,s.y);
    g.fillStyle='#3a2a20'; g.beginPath(); g.ellipse(0,-1,7,3.2,0,0,TAU); g.fill();
    const ang=b.on? 0.9 : -0.9;
    g.strokeStyle= b.on?'#ff9a3c':'#c9a890'; g.lineWidth=3.4; g.lineCap='round';
    g.beginPath(); g.moveTo(0,-2); g.lineTo(Math.sin(ang)*12,-2-Math.cos(ang)*11); g.stroke();
    g.fillStyle= b.on?'#ffd45a':'#8a6a50'; g.beginPath(); g.arc(Math.sin(ang)*12,-2-Math.cos(ang)*11,3.2,0,TAU); g.fill();
    if(b.on){ g.fillStyle='rgba(255,150,60,0.22)'; g.beginPath(); g.ellipse(0,-3,10,6,0,0,TAU); g.fill(); }
    else { g.fillStyle='rgba(255,154,60,'+(0.35+0.3*Math.sin(G.time*3+b.x)).toFixed(2)+')'; g.font='bold 13px Georgia'; g.textAlign='center'; g.fillText('!',0,-26); }
    g.restore(); return;
  }
  if(b.kind==='firewheel'){
    // a fire-wheel in its trough; turns and glows molten once the flow reaches it
    const g=cx, R=6, spin=b.charged; drawShadowAt(g,s.x,s.y,7);
    g.save(); g.translate(s.x,s.y-6);
    if(spin){ g.fillStyle='rgba(255,140,50,0.28)'; g.beginPath(); g.ellipse(0,0,R+6,R+4,0,0,TAU); g.fill(); }
    g.rotate(spin? G.time*2.2 : 0);
    g.strokeStyle= spin?'#c26a2a':'#4a3d32'; g.lineWidth=2.4; g.beginPath(); g.ellipse(0,0,R,R*0.9,0,0,TAU); g.stroke();
    g.strokeStyle= spin?'#ffb04a':'#5a4d40'; g.lineWidth=1.8;
    for(let i=0;i<6;i++){ const a=i/6*TAU; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*R,Math.sin(a)*R*0.9); g.stroke(); }
    g.fillStyle= spin?'#ffd45a':'#3a332c'; g.beginPath(); g.arc(0,0,2,0,TAU); g.fill();
    g.restore(); return;
  }
  if(b.kind==='spiketile'){
    // a floor spike-plate: a stone grate that rumbles (cracks flash) then stabs iron spikes up
    const g=cx, warn=b.warnP||0, up=!!b.up; g.save(); g.translate(s.x,s.y);
    g.fillStyle='#2a2620'; g.beginPath(); g.moveTo(0,-9); g.lineTo(16,-1); g.lineTo(0,7); g.lineTo(-16,-1); g.closePath(); g.fill();   // the plate
    g.strokeStyle='#4a443a'; g.lineWidth=1; g.stroke();
    // the four spike-slots
    g.fillStyle='#15120e'; for(const [ox,oy] of [[-6,-1],[6,-1],[0,-4],[0,2]]){ g.beginPath(); g.ellipse(ox,oy,2,1.1,0,0,TAU); g.fill(); }
    if(warn>0){ g.strokeStyle='rgba(255,120,60,'+(0.4+0.5*warn).toFixed(2)+')'; g.lineWidth=1.3;   // telegraph: hot cracks
      g.beginPath(); g.moveTo(-6,0); g.lineTo(-2,-2); g.lineTo(2,1); g.lineTo(6,-1); g.stroke(); }
    if(up){ g.fillStyle='#b9c0c8'; g.strokeStyle='#e8eef4'; g.lineWidth=1;   // iron spikes stabbed up
      for(const [ox,oy] of [[-6,-1],[6,-1],[0,-4],[0,2]]){ g.beginPath(); g.moveTo(ox-2.4,oy); g.lineTo(ox,oy-9); g.lineTo(ox+2.4,oy); g.closePath(); g.fill(); g.stroke(); } }
    g.restore(); return;
  }
  if(b.kind==='arrowtrap'){
    // an arrow-slit in the wall: a dark socket that flares just before it looses a bolt
    const g=cx, warn=b.warn||0; g.save(); g.translate(s.x,s.y-6);
    g.fillStyle='#1c1814'; g.beginPath(); g.ellipse(0,0,5,6,0,0,TAU); g.fill();
    g.strokeStyle='#3e372e'; g.lineWidth=1.4; g.stroke();
    g.fillStyle='rgba(255,120,50,'+(0.2+0.7*warn).toFixed(2)+')'; g.beginPath(); g.ellipse(0,0,2.4,3.2,0,0,TAU); g.fill();   // the ember glow before firing
    g.restore(); return;
  }
  if(b.kind==='traparrow'){
    // a bolt in flight - a thin dart pointing the way it travels
    const g=cx, ang=Math.atan2((b.dx+b.dy)*0.5, (b.dx-b.dy)); g.save(); g.translate(s.x,s.y-8); g.rotate(ang);
    g.strokeStyle='#d8c9a8'; g.lineWidth=2; g.beginPath(); g.moveTo(-7,0); g.lineTo(6,0); g.stroke();   // shaft
    g.fillStyle='#eef0f2'; g.beginPath(); g.moveTo(10,0); g.lineTo(5,-2.6); g.lineTo(5,2.6); g.closePath(); g.fill();   // steel head
    g.strokeStyle='#c9b48a'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-7,0); g.lineTo(-9,-2.4); g.moveTo(-7,0); g.lineTo(-9,2.4); g.stroke();   // fletching
    g.restore(); return;
  }
  if(b.kind==='skybeam'){
    // a ward-lance: a violet emitter at each end, and the beam itself when it telegraphs / fires
    const g=cx;
    const a=worldToScreen(b.x-b.dx*b.len, b.y-b.dy*b.len), c=worldToScreen(b.x+b.dx*b.len, b.y+b.dy*b.len);
    const ay=a.y-7, cy=c.y-7;
    g.fillStyle='#2a2038'; g.beginPath(); g.arc(a.x,ay,4.5,0,TAU); g.arc(c.x,cy,4.5,0,TAU); g.fill();   // emitter nubs
    g.fillStyle='rgba(199,123,255,'+(0.4+0.5*(b.on?1:b.warn)).toFixed(2)+')'; g.beginPath(); g.arc(a.x,ay,2.4,0,TAU); g.arc(c.x,cy,2.4,0,TAU); g.fill();
    if(b.on){
      g.strokeStyle='rgba(199,123,255,0.9)'; g.lineWidth=5; g.lineCap='round';
      g.beginPath(); g.moveTo(a.x,ay); g.lineTo(c.x,cy); g.stroke();
      g.strokeStyle='rgba(244,228,255,0.95)'; g.lineWidth=2; g.beginPath(); g.moveTo(a.x,ay); g.lineTo(c.x,cy); g.stroke();
    } else if(b.warn>0){
      g.strokeStyle='rgba(199,123,255,'+(0.15+0.4*b.warn).toFixed(2)+')'; g.lineWidth=1.5; g.setLineDash([4,6]);
      g.beginPath(); g.moveTo(a.x,ay); g.lineTo(c.x,cy); g.stroke(); g.setLineDash([]);
    }
    return;
  }
  if(b.kind==='axetrap'){
    // a pendulum bone-axe: a haft hung from a high pivot, a broad blade at its swinging foot.
    // The pivot sits above the sweep centre; the blade rides the live head position (b.hx/b.hy).
    const g=cx;
    const piv=worldToScreen(b.x, b.y); piv.y-=54;               // pivot up near the ceiling
    const head=worldToScreen(b.hx!=null?b.hx:b.x, b.hy!=null?b.hy:b.y);
    // floor shadow under the blade
    g.fillStyle='rgba(0,0,0,0.32)'; g.beginPath(); g.ellipse(head.x, head.y+4, 9, 3.4, 0, 0, TAU); g.fill();
    // the haft
    g.strokeStyle='#4a3d2c'; g.lineWidth=3.2; g.beginPath(); g.moveTo(piv.x, piv.y); g.lineTo(head.x, head.y-6); g.stroke();
    g.fillStyle='#2a231a'; g.beginPath(); g.arc(piv.x, piv.y, 3.2, 0, TAU); g.fill();   // pivot boss
    // the blade - a steel crescent about the head
    g.save(); g.translate(head.x, head.y-6);
    g.fillStyle='#c9ced4'; g.strokeStyle='#eef2f6'; g.lineWidth=1.2;
    g.beginPath(); g.moveTo(-13,2); g.quadraticCurveTo(0,-14,13,2); g.quadraticCurveTo(0,10,-13,2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='rgba(255,255,255,0.5)'; g.beginPath(); g.moveTo(-11,2); g.quadraticCurveTo(0,-9,11,2); g.quadraticCurveTo(0,4,-11,2); g.closePath(); g.fill();   // edge glint
    g.restore(); return;
  }
  if(b.kind==='skyemitter'){
    // the prism-ward emitter crystal, plus the traced rainbow beam (screen-projected dots)
    const g=cx; g.save(); g.translate(s.x,s.y-4);
    g.fillStyle='#eaf2ff'; g.beginPath(); g.moveTo(0,-8); g.lineTo(6,0); g.lineTo(0,8); g.lineTo(-6,0); g.closePath(); g.fill();
    g.strokeStyle='#8aa0c0'; g.lineWidth=1.4; g.stroke();
    g.restore();
    const path=(typeof G!=='undefined'&&G._skyBeamPath)||[];
    if(path.length && typeof worldToScreen==='function'){ const g2=cx;
      for(let i=0;i<path.length;i++){ const ss=worldToScreen(path[i][0],path[i][1]); const hue=(i*24+G.time*140)%360;
        g2.fillStyle='hsla('+(hue|0)+',95%,70%,0.9)'; g2.beginPath(); g2.arc(ss.x, ss.y-8, 3.2, 0, TAU); g2.fill(); } }
    return;
  }
  if(b.kind==='skyprism'){
    // a rotatable prism; the coloured bar shows its mirror orientation ('/' or '\')
    const g=cx; drawShadowAt(g,s.x,s.y,6); g.save(); g.translate(s.x,s.y-4);
    g.fillStyle='rgba(222,236,255,0.92)'; g.beginPath(); g.moveTo(0,-9); g.lineTo(7,0); g.lineTo(0,9); g.lineTo(-7,0); g.closePath(); g.fill();
    g.strokeStyle='#7f9ec0'; g.lineWidth=1.4; g.stroke();
    g.strokeStyle='hsl('+((G.time*60)%360|0)+',90%,72%)'; g.lineWidth=2.6; g.lineCap='round';
    if(b.mirror==='/'){ g.beginPath(); g.moveTo(-4,4); g.lineTo(4,-4); g.stroke(); }
    else { g.beginPath(); g.moveTo(-4,-4); g.lineTo(4,4); g.stroke(); }
    g.restore(); return;
  }
  if(b.kind==='skyward'){
    // the ward-crystal target: dark until the beam lands, then blazing white-gold
    const g=cx, lit=b.lit; drawShadowAt(g,s.x,s.y,6); g.save(); g.translate(s.x,s.y-6);
    if(lit){ const gl=0.5+0.4*Math.sin(G.time*4); g.fillStyle='rgba(255,255,255,'+(0.3+0.2*gl).toFixed(2)+')'; g.beginPath(); g.arc(0,0,13,0,TAU); g.fill(); }
    g.fillStyle= lit? '#fff6c0':'#3a4a5a'; g.beginPath(); g.moveTo(0,-11); g.lineTo(7,0); g.lineTo(0,11); g.lineTo(-7,0); g.closePath(); g.fill();
    g.strokeStyle= lit? '#ffe27a':'#6a7a8a'; g.lineWidth=1.8; g.stroke();
    if(!lit){ g.fillStyle='rgba(150,180,210,'+(0.3+0.3*Math.sin(G.time*3+b.y)).toFixed(2)+')'; g.font='bold 12px Georgia'; g.textAlign='center'; g.fillText('!',0,-16); }
    g.restore(); return;
  }
  if(b.kind==='firepit'){
    // a cell of the bottomless pit you must dash across on the turning slabs. Pure opaque black,
    // drawn as a FULL tile diamond (half-tile is 32x16) plus a little overlap so the cells fuse
    // into one seamless void with no floor showing through between them.
    const g=cx; g.save(); g.translate(s.x,s.y);
    g.fillStyle='#000'; g.beginPath(); g.moveTo(0,-18); g.lineTo(34,0); g.lineTo(0,18); g.lineTo(-34,0); g.closePath(); g.fill();
    g.restore(); return;
  }
  if(b.kind==='firelever'){
    // the fire-lever on CH2's side pad: pull it to haul the Causeway Gate up for a few seconds.
    // Glows hot amber when armed (ready to pull), dim once thrown.
    const g=cx, on=b.on, pulse=0.5+0.5*Math.sin(G.time*4+b.x); g.save(); g.translate(s.x,s.y); drawShadowAt(g,0,3,7);
    g.strokeStyle='#3a2a1e'; g.lineWidth=3.5; g.beginPath(); g.moveTo(0,2); g.lineTo(0,-6); g.stroke();   // the iron post
    g.save(); g.translate(0,-6); g.rotate(on? 0.7 : -0.5);   // the throw-arm
    g.strokeStyle='#5a4634'; g.lineWidth=3; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-9); g.stroke();
    g.fillStyle= on? '#7a3a1a' : 'hsl('+(24+8*pulse).toFixed(0)+',95%,'+(52+10*pulse).toFixed(0)+'%)';
    g.beginPath(); g.arc(0,-10,3.2,0,TAU); g.fill();
    if(!on){ g.fillStyle='rgba(255,180,90,'+(0.3+0.35*pulse).toFixed(2)+')'; g.beginPath(); g.arc(0,-10,5.2,0,TAU); g.fill(); }
    g.restore();
    g.fillStyle='#2a2018'; g.beginPath(); g.ellipse(0,2,4,2,0,0,TAU); g.fill();   // the base plate
    g.restore(); return;
  }
  if(b.kind==='spinwheel'){
    // a basalt slab that turns on a central spindle over the lava. Drawn as a flat iso
    // parallelogram from hub to tip, projected via worldToScreen so its swing reads true.
    const g=cx, ang=b.ang, cA=Math.cos(ang), sA=Math.sin(ang), pA=b.armw, px=-sA, py=cA;
    const c1=worldToScreen(b.hx - px*pA, b.hy - py*pA);
    const c2=worldToScreen(b.hx + cA*b.r - px*pA, b.hy + sA*b.r - py*pA);
    const c3=worldToScreen(b.hx + cA*b.r + px*pA, b.hy + sA*b.r + py*pA);
    const c4=worldToScreen(b.hx + px*pA, b.hy + py*pA);
    g.fillStyle='rgba(0,0,0,0.28)'; g.beginPath(); g.moveTo(c1.x,c1.y+5); g.lineTo(c2.x,c2.y+5); g.lineTo(c3.x,c3.y+5); g.lineTo(c4.x,c4.y+5); g.closePath(); g.fill();
    g.fillStyle='#6a5f52'; g.beginPath(); g.moveTo(c1.x,c1.y); g.lineTo(c2.x,c2.y); g.lineTo(c3.x,c3.y); g.lineTo(c4.x,c4.y); g.closePath(); g.fill();
    g.strokeStyle='#2a241e'; g.lineWidth=1.4; g.stroke();
    g.strokeStyle='#8a7f6e'; g.lineWidth=1; g.beginPath(); g.moveTo((c1.x+c4.x)/2,(c1.y+c4.y)/2); g.lineTo((c2.x+c3.x)/2,(c2.y+c3.y)/2); g.stroke();   // seam down the slab
    const hs=worldToScreen(b.hx,b.hy);   // the spindle hub
    g.fillStyle='#3a332c'; g.beginPath(); g.ellipse(hs.x,hs.y-1,5.5,3,0,0,TAU); g.fill();
    g.fillStyle='rgba(255,150,60,'+(0.4+0.3*Math.sin(G.time*3+b.hx)).toFixed(2)+')'; g.beginPath(); g.arc(hs.x,hs.y-2,2,0,TAU); g.fill();
    return;
  }
  if(b.kind==='froststream'){
    // a cell of black freezing water bristling with jagged rime-shards - a clear "do not tread"
    // hazard. Fall in and the cold drags you under and flings you back.
    const g=cx, gl=0.5+0.3*Math.sin(G.time*1.4+b.seed*1.6); g.save(); g.translate(s.x,s.y);
    g.fillStyle='rgba(16,32,44,0.9)'; g.beginPath(); g.moveTo(0,-9); g.lineTo(16,-1); g.lineTo(0,7); g.lineTo(-16,-1); g.closePath(); g.fill();
    g.fillStyle='rgba(120,175,205,'+(0.1+0.12*gl).toFixed(2)+')'; g.beginPath(); g.ellipse(0,-1,8,3.6,0,0,TAU); g.fill();
    // upthrust ice-shards: sharp pale spikes so the cell clearly reads as spiked, deadly water
    const sway=Math.sin(G.time*1.3+b.seed)*0.6;
    const shards=[[-9,-1,7],[0,-4,10],[8,-1,7],[-3,2,5],[4,2,5]];
    for(const [ox,oy,h] of shards){
      g.fillStyle='rgba(206,230,246,0.92)';
      g.beginPath(); g.moveTo(ox-2.3,oy); g.lineTo(ox+sway,oy-h); g.lineTo(ox+2.3,oy); g.closePath(); g.fill();
      g.strokeStyle='rgba(240,250,255,0.85)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(ox+sway,oy-h); g.lineTo(ox-0.4,oy-1); g.stroke();
    }
    g.restore(); return;
  }
  if(b.kind==='icefloe'){
    // a slab of drift-ice sliding across the channel. Drawn as a raised iso block (w x h)
    // centred on its current position; carries whoever stands on it.
    const g=cx, hw=(b.w||5)/2, hh=(b.h||3)/2;
    const c1=worldToScreen(b.x-hw, b.y-hh), c2=worldToScreen(b.x+hw, b.y-hh), c3=worldToScreen(b.x+hw, b.y+hh), c4=worldToScreen(b.x-hw, b.y+hh);
    g.fillStyle='rgba(60,110,140,0.5)';   // the wet shadow it casts on the water
    g.beginPath(); g.moveTo(c1.x,c1.y+5); g.lineTo(c2.x,c2.y+5); g.lineTo(c3.x,c3.y+5); g.lineTo(c4.x,c4.y+5); g.closePath(); g.fill();
    const gr=g.createLinearGradient(c1.x,c1.y,c3.x,c3.y); gr.addColorStop(0,'#eaf6ff'); gr.addColorStop(1,'#b6d8ea');
    g.fillStyle=gr; g.beginPath(); g.moveTo(c1.x,c1.y); g.lineTo(c2.x,c2.y); g.lineTo(c3.x,c3.y); g.lineTo(c4.x,c4.y); g.closePath(); g.fill();
    g.strokeStyle='#7fa8c0'; g.lineWidth=1.4; g.stroke();
    g.strokeStyle='rgba(255,255,255,0.5)'; g.lineWidth=1;   // a cracked facet across the ice
    g.beginPath(); g.moveTo((c1.x+c4.x)/2,(c1.y+c4.y)/2); g.lineTo((c2.x+c3.x)/2-6,(c2.y+c3.y)/2); g.stroke();
    return;
  }
  if(b.kind==='driftslab'){
    // a floating stone platform that drifts back and forth across a pit; carries whoever rides it.
    // Drawn as a raised iso block (w x h) centred on its current position.
    const g=cx, hw=(b.w||3)/2, hh=(b.h||3)/2;
    const c1=worldToScreen(b.x-hw, b.y-hh), c2=worldToScreen(b.x+hw, b.y-hh), c3=worldToScreen(b.x+hw, b.y+hh), c4=worldToScreen(b.x-hw, b.y+hh);
    g.fillStyle='rgba(0,0,0,0.4)';    // shadow cast down into the pit
    g.beginPath(); g.moveTo(c1.x,c1.y+7); g.lineTo(c2.x,c2.y+7); g.lineTo(c3.x,c3.y+7); g.lineTo(c4.x,c4.y+7); g.closePath(); g.fill();
    const gr=g.createLinearGradient(c1.x,c1.y,c3.x,c3.y); gr.addColorStop(0,'#6a6058'); gr.addColorStop(1,'#3a332d');
    g.fillStyle=gr; g.beginPath(); g.moveTo(c1.x,c1.y); g.lineTo(c2.x,c2.y); g.lineTo(c3.x,c3.y); g.lineTo(c4.x,c4.y); g.closePath(); g.fill();
    g.strokeStyle='#8a7f70'; g.lineWidth=1.6; g.stroke();   // pale carved rim
    g.strokeStyle='rgba(20,16,12,0.5)'; g.lineWidth=1;      // a seam across the slab
    g.beginPath(); g.moveTo((c1.x+c4.x)/2,(c1.y+c4.y)/2); g.lineTo((c2.x+c3.x)/2,(c2.y+c3.y)/2); g.stroke();
    // a faint rune glimmer so it reads as an enchanted, floating slab
    const cc=worldToScreen(b.x,b.y); g.fillStyle='rgba(150,200,235,'+(0.25+0.2*Math.sin(G.time*3+b.x)).toFixed(2)+')';
    g.beginPath(); g.arc(cc.x, cc.y-2, 2.2, 0, TAU); g.fill();
    return;
  }
  if(b.kind==='conveytile'){
    // a slab of the grinding conveyor: a raised stone tile streaming rightward across the
    // pit. When it tips off the right edge it drops and fades (falling state) before it
    // resurfaces at the left. Drawn a warmer grey than the drift-slabs so the belt reads
    // as machinery, not enchanted stone.
    const g=cx, hw=(b.w||2)/2, hh=(b.h||2)/2;
    let yoff=0, alpha=1;
    if(b.falling){ const p=Math.min(1,(b.fallT||0)/0.55); yoff=p*p*30; alpha=1-p*0.9; }   // accelerating drop + fade
    const c1=worldToScreen(b.x-hw,b.y-hh), c2=worldToScreen(b.x+hw,b.y-hh), c3=worldToScreen(b.x+hw,b.y+hh), c4=worldToScreen(b.x-hw,b.y+hh);
    for(const c of [c1,c2,c3,c4]) c.y+=yoff;
    g.save(); g.globalAlpha=alpha;
    if(!b.falling){ g.fillStyle='rgba(0,0,0,0.4)';   // shadow down into the pit (none once it's tipped away)
      g.beginPath(); g.moveTo(c1.x,c1.y+7); g.lineTo(c2.x,c2.y+7); g.lineTo(c3.x,c3.y+7); g.lineTo(c4.x,c4.y+7); g.closePath(); g.fill(); }
    const gr=g.createLinearGradient(c1.x,c1.y,c3.x,c3.y); gr.addColorStop(0,'#7a6f60'); gr.addColorStop(1,'#403830');
    g.fillStyle=gr; g.beginPath(); g.moveTo(c1.x,c1.y); g.lineTo(c2.x,c2.y); g.lineTo(c3.x,c3.y); g.lineTo(c4.x,c4.y); g.closePath(); g.fill();
    g.strokeStyle='#9a8d78'; g.lineWidth=1.6; g.stroke();   // pale carved rim
    // two grooves running along the direction of travel, so the tile reads as a moving belt-plate
    g.strokeStyle='rgba(24,18,12,0.5)'; g.lineWidth=1;
    g.beginPath(); g.moveTo((c1.x*3+c4.x)/4,(c1.y*3+c4.y)/4); g.lineTo((c2.x*3+c3.x)/4,(c2.y*3+c3.y)/4);
    g.moveTo((c1.x+c4.x*3)/4,(c1.y+c4.y*3)/4); g.lineTo((c2.x+c3.x*3)/4,(c2.y+c3.y*3)/4); g.stroke();
    g.restore(); return;
  }
  if(b.kind==='shoottarget'){
    // a wall-mounted mechanism you must strike with an arrow or bolt to work its gate. Glows warm
    // while armed; goes dark and cracked once struck.
    const g=cx, hit=!!b.hit; g.save(); g.translate(s.x,s.y-8);
    g.fillStyle= hit? '#2a2620':'#3a332a'; g.beginPath(); g.arc(0,0,7,0,TAU); g.fill();   // iron housing
    g.strokeStyle='#1c1814'; g.lineWidth=1.6; g.stroke();
    if(hit){ g.strokeStyle='#4a443a'; g.lineWidth=1.3;   // cracked, spent
      g.beginPath(); g.moveTo(-4,-3); g.lineTo(1,0); g.lineTo(-2,4); g.moveTo(4,-2); g.lineTo(0,1); g.stroke();
    } else {   // armed: a bright ringed eye, pulsing, with concentric target rings
      const gl=0.5+0.5*Math.sin(G.time*4+b.y);
      g.strokeStyle='rgba(255,150,60,'+(0.5+0.4*gl).toFixed(2)+')'; g.lineWidth=1.6; g.beginPath(); g.arc(0,0,5,0,TAU); g.stroke();
      g.fillStyle='rgba(255,180,80,'+(0.55+0.4*gl).toFixed(2)+')'; g.beginPath(); g.arc(0,0,2.6,0,TAU); g.fill();
      g.fillStyle='#ffe6b0'; g.beginPath(); g.arc(0,0,1.1,0,TAU); g.fill();
    }
    g.restore(); return;
  }
  if(b.kind==='bonepit'){
    // a cell of the bottomless black pit you fall into. Pure opaque black, drawn as a FULL tile
    // diamond (half-tile is 32x16) plus a little overlap so the cells fuse into one seamless void.
    const g=cx; g.save(); g.translate(s.x,s.y);
    g.fillStyle='#000'; g.beginPath(); g.moveTo(0,-18); g.lineTo(34,0); g.lineTo(0,18); g.lineTo(-34,0); g.closePath(); g.fill();
    g.restore(); return;
  }
  if(b.kind==='windpit'){
    // a cell of the bottomless wind-shaft you're blown down. A cold near-black diamond (fused
    // seamless like the bonepit) with a faint blue-grey sheen catching the updraft near the top.
    const g=cx; g.save(); g.translate(s.x,s.y);
    g.fillStyle='#080b12'; g.beginPath(); g.moveTo(0,-18); g.lineTo(34,0); g.lineTo(0,18); g.lineTo(-34,0); g.closePath(); g.fill();
    g.fillStyle='rgba(150,180,205,0.06)'; g.beginPath(); g.moveTo(0,-18); g.lineTo(20,-8); g.lineTo(0,2); g.lineTo(-20,-8); g.closePath(); g.fill();
    g.restore(); return;
  }
  if(b.kind==='fadetile'){
    // a tile of the fading rainbow bridge. Three clear states so a bright tile can never
    // drop you by surprise: SOLID (safe, bright colour), WARN (still solid footing, but
    // flickering amber - it is about to fade, so move), and GAP (faint ghost, a fall).
    // The SOLID/GAP split matches skyFadeSolid exactly (same phase math), so the picture
    // and the collision never disagree.
    const g=cx, F=(typeof G!=='undefined')?G._skyFade:null;
    const ph = F ? ((((G._skyFadeT||0)*F.speed - b.phase)%1)+1)%1 : 0;
    const onFrac = F ? F.onFrac : 1;
    const solid = ph < onFrac;
    const warn = solid && ph > onFrac-0.22;   // the last stretch of the solid window: a tell
    g.save(); g.translate(s.x,s.y);
    if(solid && !warn){ const hue=((b.band*40)+G.time*90)%360;
      g.fillStyle='hsla('+(hue|0)+',90%,62%,0.92)'; g.beginPath(); g.moveTo(0,-9); g.lineTo(16,-1); g.lineTo(0,7); g.lineTo(-16,-1); g.closePath(); g.fill();
      g.fillStyle='rgba(255,255,255,0.28)'; g.beginPath(); g.moveTo(0,-7); g.lineTo(11,-1); g.lineTo(0,5); g.lineTo(-11,-1); g.closePath(); g.fill();
    } else if(warn){ const fl=0.4+0.35*Math.abs(Math.sin(G.time*16+b.x)), hue=((b.band*40)+G.time*90)%360;
      g.fillStyle='hsla('+(hue|0)+',65%,58%,'+(0.28*fl).toFixed(2)+')'; g.beginPath(); g.moveTo(0,-9); g.lineTo(16,-1); g.lineTo(0,7); g.lineTo(-16,-1); g.closePath(); g.fill();
      g.strokeStyle='rgba(255,236,170,'+(0.55*fl).toFixed(2)+')'; g.lineWidth=1.5; g.beginPath(); g.moveTo(0,-9); g.lineTo(16,-1); g.lineTo(0,7); g.lineTo(-16,-1); g.closePath(); g.stroke();
    } else {
      g.strokeStyle='rgba(200,210,235,0.32)'; g.lineWidth=1; g.beginPath(); g.moveTo(0,-9); g.lineTo(16,-1); g.lineTo(0,7); g.lineTo(-16,-1); g.closePath(); g.stroke();
    }
    g.restore(); return;
  }
  if(b.kind==='windzone') return;   // the wind is drawn as streaming particles (see updateAerieDeep), not a sprite
  if(b.kind==='bonepan'){
    // a low bone counterweight-plate; sinks and glows violet when weighted
    const g=cx, pr=b.pressed?1:0; g.save(); g.translate(s.x,s.y); drawShadowAt(g,0,2,8);
    g.fillStyle= pr? '#3a2c4a':'#2a2622';
    g.beginPath(); g.moveTo(0,-9+pr*2); g.lineTo(14,-2+pr*2); g.lineTo(0,5+pr*2); g.lineTo(-14,-2+pr*2); g.closePath(); g.fill();
    g.strokeStyle= pr? '#c77bff':'#6a5c4c'; g.lineWidth= pr?2.2:1.5; g.stroke();
    g.fillStyle= pr? 'rgba(199,123,255,0.35)':'rgba(20,16,14,0.4)';
    g.beginPath(); g.moveTo(0,-5+pr*2); g.lineTo(9,-1+pr*2); g.lineTo(0,3+pr*2); g.lineTo(-9,-1+pr*2); g.closePath(); g.fill();
    if(!pr){ g.fillStyle='rgba(199,123,255,'+(0.35+0.3*Math.sin(G.time*3+b.x)).toFixed(2)+')'; g.font='bold 11px Georgia'; g.textAlign='center'; g.fillText('✦',0,-1); }
    g.restore(); return;
  }
  if(b.kind==='beamgate'){
    // a bone portcullis hauled up by a counterweight beam. openAmt: 0=dropped, 1=up.
    // The corridor runs down the iso diagonal, so the closed gate is a continuous slab of
    // dark stone (no see-through gaps) filling wall-to-wall, with pale bone bars ribbed over it.
    const g=cx, c0=(b.x0+b.x1)/2, amt=b.openAmt||0, H=42;
    const tiles=[]; for(let tx=b.x0; tx<=b.x1; tx++) tiles.push(tx);
    const oxL=(b.x0-c0)*32, oyL=(b.x0-c0)*16;   // leftmost (north-west) tile face
    const oxR=(b.x1-c0)*32, oyR=(b.x1-c0)*16;    // rightmost (south-east) tile face
    const drop=H*(1-amt);
    if(amt<0.98) drawShadowAt(g,s.x,s.y,34);
    // --- the lintel: one continuous beam across the whole corridor mouth ---
    g.save(); g.translate(s.x,s.y);
    g.fillStyle='#2c2622'; g.strokeStyle='#120f0c'; g.lineWidth=1.4;
    g.beginPath();
    g.moveTo(oxL-19,-42+oyL); g.lineTo(oxR+19,-42+oyR); g.lineTo(oxR+19,-36+oyR); g.lineTo(oxL-19,-36+oyL); g.closePath();
    g.fill(); g.stroke();
    g.restore();
    if(drop>0.5){
      // --- solid dark stone backing filling the gap wall-to-wall (a parallelogram down the diagonal) ---
      g.save(); g.translate(s.x,s.y);
      g.beginPath();
      g.moveTo(oxL-19,-36+oyL); g.lineTo(oxR+19,-36+oyR);
      g.lineTo(oxR+19,-36+oyR+drop); g.lineTo(oxL-19,-36+oyL+drop); g.closePath();
      g.save(); g.clip();
      g.fillStyle='#1a1512'; g.fill();
      // faint vertical grain so the slab reads as stone, not a void
      g.strokeStyle='rgba(70,58,50,0.5)'; g.lineWidth=1;
      for(const tx of tiles){ const ox=(tx-c0)*32, oy=(tx-c0)*16; g.beginPath(); g.moveTo(ox,-36+oy); g.lineTo(ox,-36+oy+drop); g.stroke(); }
      g.restore();
      g.restore();
      // --- the pale bone bars, one set per corridor tile, riding on the slab ---
      for(const tx of tiles){ const ox=(tx-c0)*32, oy=(tx-c0)*16;
        g.save(); g.translate(s.x+ox, s.y+oy);
        g.beginPath(); g.rect(-18,-36,36,drop); g.clip();
        g.fillStyle='#cabfa6';                                             // pale bone bars
        for(let i=-1;i<=1;i++){ g.fillRect(i*11-2.6,-36,5.2,H); g.strokeStyle='#7a6f58'; g.lineWidth=1; g.strokeRect(i*11-2.6,-36,5.2,H); }
        g.fillStyle='#b3a888'; for(let yy=-30;yy<=-6;yy+=12){ g.fillRect(-17,yy,34,3.4); }   // rib cross-bars
        g.fillStyle='#ddd3bd'; for(let i=-1;i<=1;i++){ g.beginPath(); g.arc(i*11,-36+drop-3,3.2,0,TAU); g.fill(); }   // skull knobs at the feet
        g.restore();
      }
    }
    // the counterweight beam over the centre, tipping as the gate rises
    g.save(); g.translate(s.x, s.y-49); g.rotate((amt-0.5)*0.5);
    g.strokeStyle='#6a5c48'; g.lineWidth=3; g.lineCap='round'; g.beginPath(); g.moveTo(-20,0); g.lineTo(20,0); g.stroke();
    g.fillStyle='#4a4038'; g.beginPath(); g.arc(-20,0,4,0,TAU); g.fill(); g.beginPath(); g.arc(20,0,4.5,0,TAU); g.fill();
    g.restore();
    return;
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
  // The Woodworker is the lost prince: once memory returns he sheds the woodpile
  // rags for his own bright-blue royal wear, and his name with it.
  let nlook=n.look, nname=n.name;
  if(n.id==='woody' && P.story && P.story.royalGarb){
    nlook={...n.look, shirt:'#2f6ad6', pants:'#26407a', trim:'#e6c25a'};
    nname='Prince Jaist';
  }
  drawHumanoid(cx,s.x,s.y,{...nlook, size:(nlook.size||1)*1.28, dir:n.face, step:n.anim, name:nname, ph:n.hx*0.7+n.hy*1.3});
  // name
  cx.font='10px Verdana'; cx.textAlign='center';
  cx.fillStyle='rgba(0,0,0,0.55)'; cx.fillText(nname, s.x+1, s.y-52*(nlook.size||1)+1);
  cx.fillStyle='#ffe9a8'; cx.fillText(nname, s.x, s.y-52*(nlook.size||1));
  // (ambient overhead speech bubbles removed - NPC lines show only in the dialog panel)
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
/* Boss-entrance wrapper: while m.introKind is running, transform the whole sprite for
   its arrival (rise from the ground, drop from the sky, loom up out of the dark) or add
   the swelling violet halo of an enthralling. Bespoke motion for the dragon (colour lerp)
   and the Leviathan (breach) lives inside their own draw fns via m.ensAmt / m.surf. */
function drawMobEntity(m,s){
  const k=m.introKind;
  if(!k || (m.introT||0)>=1){ drawMob(m,s); return; }
  const p=m.introT||0;
  if(k==='enthrall'){
    const r=(m.bigBoss?62:46)*(0.5+0.7*p);
    cx.save(); cx.globalCompositeOperation='lighter';
    const g=cx.createRadialGradient(s.x,s.y-26,2,s.x,s.y-26,r);
    g.addColorStop(0,'rgba(199,123,255,'+(0.45*p).toFixed(2)+')'); g.addColorStop(1,'rgba(199,123,255,0)');
    cx.fillStyle=g; cx.beginPath(); cx.arc(s.x,s.y-26,r,0,TAU); cx.fill(); cx.restore();
    drawMob(m,s); return;
  }
  if(k==='surface'){ drawMob(m,s); return; }        // breach handled inside drawLeviathan via m.surf
  if(k==='rise'){
    // clip to the feet-line so the boss appears to HEAVE up out of the ground
    const dy=48*(1-easeOut(p));
    cx.save();
    cx.beginPath(); cx.rect(-1000,-1000, (VW||2000)+2000, (s.y+6)+1000); cx.clip();
    cx.globalAlpha*=clamp(0.3+p*1.4,0,1);
    drawMob(m,{x:s.x,y:s.y+dy});
    cx.restore(); return;
  }
  // descend (drop from the storm-sky) and loom (rise faded out of the dark, striding in)
  let dy=0, sc=1;
  if(k==='descend'){ dy=-105*(1-easeOut(p)); }
  else if(k==='loom'){ sc=0.7+0.3*easeOut(p); }
  cx.save(); cx.globalAlpha*=clamp(p*2.2,0,1);
  if(sc!==1){ cx.translate(s.x,s.y); cx.scale(sc,sc); cx.translate(-s.x,-s.y); }
  drawMob(m,{x:s.x,y:s.y+dy});
  cx.restore();
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
  if((m.stunT||0)>0){
    // stormlight-stunned: a ring of little stars spins over the head
    const top=(m.bigBoss?-64:-46)*(m.bscale||1);
    for(let k=0;k<4;k++){ const aa=k/4*TAU+G.time*5, rr=9;
      const sx2=s.x+Math.cos(aa)*rr, sy2=s.y+top+Math.sin(aa)*rr*0.4;
      cx.fillStyle='rgba(234,224,255,'+(0.55+0.35*Math.sin(G.time*8+k)).toFixed(2)+')';
      cx.beginPath(); cx.arc(sx2,sy2,1.7,0,TAU); cx.fill(); }
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
  if(m.kind==='minotaur'){
    // a hulking bull-headed brute: hoofed digitigrade legs, a barrel chest, and a
    // great cleaver it heaves overhead on the wind-up (m.windup) before it swings.
    const fl=m.face||1, wnd=(m.windup>0);
    const gait=m.state==='chase'? Math.sin(m.anim*6)*2 : Math.sin(m.anim*1.8)*0.7;
    const breath=Math.sin(m.anim*1.4)*1.2;
    drawShadowAt(cx,s.x,s.y,20);
    cx.save(); cx.translate(s.x,s.y); cx.scale(fl,1); cx.lineJoin='round';
    const fur='#5a3f2a', furD='#3d2a1a', furL='#7a583a', horn='#ece0c6', hornD='#b9a67e', hoof='#241a12', OUT='rgba(18,12,6,0.9)';
    cx.lineWidth=2; cx.strokeStyle=OUT;
    // legs - digitigrade, hoofed
    cx.fillStyle=furD;
    cx.beginPath(); cx.moveTo(-10,-2+gait); cx.lineTo(-8,-20); cx.lineTo(-3,-20); cx.lineTo(-4,-2+gait); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle=hoof; cx.beginPath(); cx.ellipse(-7,-1+gait,3.4,2.4,0,0,TAU); cx.fill(); cx.stroke();
    cx.fillStyle=fur;
    cx.beginPath(); cx.moveTo(9,-2-gait); cx.lineTo(7,-22); cx.lineTo(2,-22); cx.lineTo(3,-2-gait); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle=hoof; cx.beginPath(); cx.ellipse(6,-1-gait,3.6,2.6,0,0,TAU); cx.fill(); cx.stroke();
    // torso - broad barrel chest tapering to the waist
    cx.fillStyle=fur;
    cx.beginPath(); cx.moveTo(-11,-20); cx.lineTo(-13,-46+breath); cx.quadraticCurveTo(0,-54+breath,13,-46+breath); cx.lineTo(11,-20); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle=furL; cx.beginPath(); cx.moveTo(-5,-22); cx.lineTo(-7,-44+breath); cx.quadraticCurveTo(0,-40,6,-44+breath); cx.lineTo(4,-22); cx.closePath(); cx.fill();
    // far arm braced behind the torso
    cx.strokeStyle=furD; cx.lineWidth=6.5; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(-9,-44+breath); cx.lineTo(-16,-30); cx.lineTo(-14,-18); cx.stroke();
    // near arm + great cleaver, heaved overhead on the wind-up
    const ay = wnd? -58 : -30;
    cx.strokeStyle=fur; cx.lineWidth=7; cx.beginPath(); cx.moveTo(9,-44+breath); cx.lineTo(16,ay+8); cx.lineTo(18,ay); cx.stroke();
    cx.lineCap='butt';
    cx.save(); cx.translate(18,ay); cx.rotate(wnd? -0.6 : 0.5);
    cx.strokeStyle='#3a2a1a'; cx.lineWidth=3; cx.beginPath(); cx.moveTo(0,0); cx.lineTo(0,-18); cx.stroke();
    cx.fillStyle='#9aa2ac'; cx.strokeStyle=OUT; cx.lineWidth=1.6;
    cx.beginPath(); cx.moveTo(-1,-18); cx.lineTo(12,-22); cx.lineTo(12,-8); cx.lineTo(-1,-6); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle='#cfd6dd'; cx.beginPath(); cx.moveTo(-1,-18); cx.lineTo(12,-22); cx.lineTo(12,-18); cx.lineTo(-1,-15); cx.closePath(); cx.fill();
    cx.restore();
    // shoulder/traps hump
    cx.fillStyle=fur; cx.strokeStyle=OUT; cx.lineWidth=2;
    cx.beginPath(); cx.ellipse(0,-46+breath,13,6,0,0,TAU); cx.fill(); cx.stroke();
    // BULL HEAD, lowered forward
    cx.save(); cx.translate(6,-49+breath);
    cx.fillStyle=horn; cx.strokeStyle=hornD; cx.lineWidth=1.4;   // horns behind the skull
    cx.beginPath(); cx.moveTo(-3,-8); cx.quadraticCurveTo(-14,-14,-13,-3); cx.quadraticCurveTo(-9,-8,-3,-5); cx.closePath(); cx.fill(); cx.stroke();
    cx.beginPath(); cx.moveTo(6,-8); cx.quadraticCurveTo(17,-15,17,-3); cx.quadraticCurveTo(12,-8,6,-5); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle=furL; cx.strokeStyle=OUT; cx.lineWidth=2;       // skull
    cx.beginPath(); cx.moveTo(-4,-8); cx.quadraticCurveTo(2,-12,8,-8); cx.lineTo(13,4); cx.quadraticCurveTo(8,9,1,7); cx.quadraticCurveTo(-5,4,-4,-8); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle=fur; cx.beginPath(); cx.ellipse(9,3,5,4,0,0,TAU); cx.fill(); cx.stroke();   // muzzle
    cx.fillStyle='#1a120c'; cx.beginPath(); cx.arc(11,2,1.1,0,TAU); cx.arc(11,5,1.1,0,TAU); cx.fill();   // nostrils
    cx.fillStyle=furD; cx.beginPath(); cx.ellipse(-3,-2,3,1.8,-0.5,0,TAU); cx.fill(); cx.stroke();       // ear
    cx.fillStyle= wnd? '#ff5a3a' : '#ffd23a';                    // eye - glows, reddens on the wind-up
    cx.beginPath(); cx.arc(4,-2,1.7,0,TAU); cx.fill();
    cx.strokeStyle='#c9a24e'; cx.lineWidth=1.4; cx.beginPath(); cx.arc(10,7,2.4,-0.3,Math.PI+0.3); cx.stroke();  // nose ring
    cx.restore();
    if(m.hurtT>0){ cx.fillStyle='rgba(255,150,120,0.4)'; cx.beginPath(); cx.ellipse(0,-34,20,26,0,0,TAU); cx.fill(); }
    cx.restore();
    const nm=m.title||m.name||MOBDEF[m.kind].name;
    cx.font='bold 13px Georgia'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,0.65)'; cx.fillText(nm,s.x+1,s.y-72);
    cx.fillStyle='#e0a15a'; cx.fillText(nm,s.x,s.y-73);
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
  if(m.kind==='stormeye'){
    // a great floating storm-core: a churning dark cloud-ball wound round a single eye.
    // A pale shield-shimmer means it's guarded (can't be cut); when it DISCHARGES the
    // shield drops and the eye splits wide - that's the moment to strike.
    const g=cx, t=G.time, sc=m.bscale||2.4;
    const cy=s.y-40-Math.sin(m.float*1.6||t*1.6)*4;          // hovers
    const open = !m.invuln;                                   // shield down => vulnerable
    const charging = m.eyeState==='charge';
    drawShadowAt(g,s.x,s.y,26);
    g.save(); g.translate(s.x,cy); g.scale(sc,sc);
    // churning storm body (layered dark clouds)
    for(let i=0;i<7;i++){ const a=t*0.6+i/7*TAU, rr=13+Math.sin(t*1.2+i)*2;
      g.fillStyle= i%2? 'rgba(30,26,54,0.9)':'rgba(46,40,78,0.9)';
      g.beginPath(); g.ellipse(Math.cos(a)*7, Math.sin(a)*5, rr, rr*0.7, 0, 0, TAU); g.fill(); }
    // lightning crackle around it (more violent while charging)
    const bolts= charging? 6 : 3;
    g.strokeStyle= open? 'rgba(180,235,255,0.95)' : 'rgba(150,190,255,0.6)'; g.lineWidth=1.2;
    for(let i=0;i<bolts;i++){ const a=t*3+i/bolts*TAU, r0=15, r1=r0+ (charging?9:5);
      g.beginPath(); g.moveTo(Math.cos(a)*r0,Math.sin(a)*r0*0.7);
      g.lineTo(Math.cos(a+0.2)*(r0+3),Math.sin(a+0.2)*(r0+3)*0.7);
      g.lineTo(Math.cos(a)*r1,Math.sin(a)*r1*0.7); g.stroke(); }
    // the eye
    const eyeR= open? 9 : (charging? 7+Math.sin(t*18)*1.5 : 6);
    g.fillStyle='#0a0a14'; g.beginPath(); g.ellipse(0,0,12,eyeR+2,0,0,TAU); g.fill();
    const eg=g.createRadialGradient(0,0,1,0,0,eyeR+2);
    eg.addColorStop(0, open? '#ffffff' : '#8fd0ff');
    eg.addColorStop(0.5, open? '#7fe0ff' : '#3a6bd0');
    eg.addColorStop(1,'rgba(20,20,40,0)');
    g.fillStyle=eg; g.beginPath(); g.ellipse(0,0,11,eyeR,0,0,TAU); g.fill();
    // pupil (a violet slit; blazes open when vulnerable)
    g.fillStyle= open? '#ff5cc8' : '#c77bff';
    g.beginPath(); g.ellipse(0,0, open?3.4:1.6, eyeR*0.9, 0,0,TAU); g.fill();
    // guarded shield-shimmer
    if(!open){ const gl=0.18+0.12*Math.sin(t*4);
      g.strokeStyle='rgba(160,210,255,'+gl.toFixed(2)+')'; g.lineWidth=2;
      g.beginPath(); g.ellipse(0,0,20,17,0,0,TAU); g.stroke(); }
    if(m.hurtT>0){ g.fillStyle='rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(0,0,18,15,0,0,TAU); g.fill(); }
    g.restore();
    const nm=m.title||m.name||MOBDEF[m.kind].name;
    g.font='bold 13px Georgia'; g.textAlign='center';
    g.fillStyle='rgba(0,0,0,0.65)'; g.fillText(nm,s.x+1,cy-40*sc*0.5-6);
    g.fillStyle= open? '#ff9adf' : '#bfe8ff'; g.fillText(nm,s.x,cy-40*sc*0.5-7);
    if(open){ g.font='bold 10px Georgia'; g.fillStyle='#ffd76a'; g.fillText('VULNERABLE!',s.x,cy-40*sc*0.5+8); }
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='wraith'||m.kind==='skywraith'||m.kind==='skygrabber'||m.kind==='stormwraith'||m.kind==='skyspirit'){
    // the same tattered cloud-shade, recoloured for the Rainbow Road's shades
    const PAL={
      wraith:     {body:'#1c2233', hem:'rgba(140,170,220,0.35)', hood:'#0e1220', eye:'150,205,255', glow:'120,190,255', wisp:'rgba(140,170,220,0.5)'},
      skywraith:  {body:'#233150', hem:'rgba(170,210,255,0.42)', hood:'#101a2e', eye:'160,220,255', glow:'150,210,255', wisp:'rgba(170,205,255,0.55)'},
      skygrabber: {body:'#1e3a34', hem:'rgba(120,235,205,0.5)',  hood:'#0c211d', eye:'150,255,215', glow:'120,255,205', wisp:'rgba(150,240,210,0.55)'},
      stormwraith:{body:'#2a2444', hem:'rgba(185,165,255,0.5)',  hood:'#160f28', eye:'205,185,255', glow:'180,150,255', wisp:'rgba(190,170,255,0.55)'},
      skyspirit:  {body:'#341f48', hem:'rgba(215,140,255,0.55)', hood:'#1a0f24', eye:'230,150,255', glow:'210,120,255', wisp:'rgba(220,150,255,0.6)'}
    }[m.kind];
    const sc=m.bscale||1;
    const bobW=Math.sin(m.anim*3.2)*2.5;
    drawShadowAt(cx,s.x,s.y,9*sc);
    cx.save(); cx.translate(s.x,s.y-14*sc+bobW); if(sc!==1) cx.scale(sc,sc);
    cx.globalAlpha=0.82;
    // tattered shade body, wisping to nothing at the hem
    cx.fillStyle=PAL.body;
    cx.beginPath();
    cx.moveTo(-9,-14);
    cx.quadraticCurveTo(0,-24,9,-14);
    cx.quadraticCurveTo(11,-2,7,8);
    cx.quadraticCurveTo(4,12,2,7);
    cx.quadraticCurveTo(0,13,-2,7);
    cx.quadraticCurveTo(-4,12,-7,8);
    cx.quadraticCurveTo(-11,-2,-9,-14);
    cx.closePath(); cx.fill();
    cx.strokeStyle=PAL.hem; cx.lineWidth=1.4; cx.stroke();
    // deep hood - a shallow brow-cap sitting just over the eyes.
    cx.fillStyle=PAL.hood;
    cx.beginPath(); cx.ellipse(0,-16.6,7,3.5,0,0,TAU); cx.fill();
    // narrowed, angled ember eyes - a hostile scowl
    const gl=0.7+0.3*Math.sin(m.anim*7), fl=m.face||1;
    for(const [ex,ang,rx] of [[-3,0.55,2.5],[3,-0.55,2.2]]){
      cx.save(); cx.translate(ex*fl,-14.6); cx.rotate(fl*ang);
      cx.fillStyle='rgba('+PAL.glow+','+(0.25*gl).toFixed(2)+')';   // outer glow
      cx.beginPath(); cx.ellipse(0,0,rx+1.4,1.9,0,0,TAU); cx.fill();
      cx.fillStyle='rgba('+PAL.eye+','+gl.toFixed(2)+')';          // bright slit
      cx.beginPath(); cx.ellipse(0,0,rx,0.95,0,0,TAU); cx.fill();
      cx.restore();
    }
    // the cloud-snatcher keeps long grasping arms out at all times
    if(m.grabber){
      const fl3=m.face||1, reach=1+0.35*Math.sin(m.anim*5);
      cx.strokeStyle='rgba('+PAL.eye+',0.7)'; cx.lineWidth=2.2; cx.lineCap='round';
      for(const sgn of [1,-1]){
        cx.beginPath(); cx.moveTo(fl3*4*sgn,-6);
        cx.quadraticCurveTo(fl3*14*sgn,-2, fl3*(16+3*reach)*sgn, 2+2*sgn);
        cx.stroke();
      }
      cx.lineCap='butt';
    }
    // reaching claw when mid-strike
    if(m.swing>0){
      cx.strokeStyle='rgba('+PAL.eye+',0.8)'; cx.lineWidth=2; cx.lineCap='round';
      const fl2=m.face||1;
      cx.beginPath();
      cx.moveTo(fl2*8,-8); cx.lineTo(fl2*14,-4);
      cx.moveTo(fl2*8,-6); cx.lineTo(fl2*13,-1);
      cx.stroke(); cx.lineCap='butt';
    }
    cx.restore();
    // trailing wisps
    if(Math.random()<0.25) burst(m.x+rnd(-0.3,0.3), m.y-rnd(0.2,0.8), PAL.wisp, 1, 1.0);
    drawMobBars&&drawMobBars(m,s); return;
  }
  if(m.kind==='leviathan'){
    const g=cx, fl=(m.face||1), t=G.time, hurt=m.hurtT>0, freed=m.freed;
    const bodyC = freed? '#3a7a8a' : '#1d3b46';            // darker, colder, meaner
    const spine = freed? '#7fd0e0' : '#2c5866';
    const surf=(m.surf!=null)?m.surf:1;                    // 0 = still under, 1 = fully breached
    g.save();
    if(surf<1){                                            // heave up through the waterline as it surfaces
      g.beginPath(); g.rect(-1000,-1000,(VW||2000)+2000,(s.y+16)+1000); g.clip();
      g.translate(s.x, s.y+(1-easeOut(surf))*72); g.scale(3.4,3.4);
    } else { g.translate(s.x,s.y); g.scale(3.4,3.4); }     // twice the beast it was
    g.fillStyle='rgba(180,225,245,'+(0.20+0.16*(1-surf)).toFixed(2)+')'; g.beginPath(); g.ellipse(0,5,52*(0.8+0.4*surf),17,0,0,TAU); g.fill(); // churned water
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
  if(m.kind==='bat'){
    const g=cx, fl=(m.face||1), t=G.time+(m.anim||0), flap=Math.sin((m.bob||0)+t*4);
    drawShadowAt(g,s.x,s.y,5);
    g.save(); g.translate(s.x, s.y-18+Math.sin((m.bob||0))*2);   // hovers well off the floor
    const bc = m.hurtT>0? '#e0a0a0' : '#2a2230';
    // wings, flapping
    g.fillStyle=bc;
    g.beginPath(); g.moveTo(0,-1); g.quadraticCurveTo(-11,-6-flap*7,-16,-1+flap*3); g.quadraticCurveTo(-9,0,-3,2); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0,-1); g.quadraticCurveTo(11,-6+flap*7,16,-1-flap*3); g.quadraticCurveTo(9,0,3,2); g.closePath(); g.fill();
    // body + ears
    g.fillStyle= m.hurtT>0? '#e8b0b0':'#3a3040'; g.beginPath(); g.ellipse(0,0,4,5,0,0,TAU); g.fill();
    g.beginPath(); g.moveTo(-2.5,-4); g.lineTo(-3.5,-8); g.lineTo(-0.5,-5); g.closePath();
    g.moveTo(2.5,-4); g.lineTo(3.5,-8); g.lineTo(0.5,-5); g.closePath(); g.fill();
    // eyes
    g.fillStyle='#ffcf4a'; g.beginPath(); g.arc(-1.6,-1,0.9,0,TAU); g.arc(1.6,-1,0.9,0,TAU); g.fill();
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
  // THE TIDEMAW - Barik's Drowned Vault guardian: a pallid anglerfish leviathan with a
  // luring light and a maw that gapes wide on its telegraphed bite. Goes translucent while
  // it submerges (m.invuln).
  if(m.kind==='tidemaw'){
    const g=cx, fl=(m.face||1), t=G.time, hurt=m.hurtT>0;
    const open=Math.min(1,(m.windup>0?1:(m.swing>0?m.swing/0.3:0))+0.12+0.08*Math.sin(t*2)); // maw gape
    const bob=Math.sin(m.anim*1.4)*1.6, sub=(m.invuln?0.42:1);
    drawShadowAt(g,s.x,s.y,32);
    g.save(); g.translate(s.x,s.y+bob*0.3); g.scale(fl,1); g.scale(2.3,2.3);
    g.globalAlpha=sub; g.lineJoin='round';
    const body='#255a63', bodyD='#173e46', bodyL='#3f7e86', teeth='#e9f4ee', lure='#bdf0ff', OUT='rgba(8,26,30,0.7)';
    g.fillStyle=bodyD; g.beginPath(); g.moveTo(-18,-14); g.lineTo(-31,-25); g.lineTo(-27,-14); g.lineTo(-31,-3); g.closePath(); g.fill();  // tail fin
    g.beginPath(); g.moveTo(-6,-30); g.lineTo(2,-43); g.lineTo(9,-28); g.closePath(); g.fill();  // dorsal fin
    g.fillStyle=body; g.strokeStyle=OUT; g.lineWidth=2; g.beginPath(); g.ellipse(-2,-15,22,15,0,0,TAU); g.fill(); g.stroke();  // body
    g.fillStyle=bodyL; g.beginPath(); g.ellipse(-2,-9,17,7,0,0,TAU); g.fill();  // belly
    g.fillStyle=bodyD; g.beginPath(); g.moveTo(0,-6); g.lineTo(-6,3); g.lineTo(6,-2); g.closePath(); g.fill();  // pectoral fin
    const jx=15, lj=open*9;   // ---- the MAW ----
    g.fillStyle=body; g.strokeStyle=OUT; g.lineWidth=2;
    g.beginPath(); g.moveTo(jx-8,-22); g.lineTo(jx+16,-20-open*3); g.lineTo(jx+15,-14); g.lineTo(jx-6,-14); g.closePath(); g.fill(); g.stroke();  // upper jaw
    g.beginPath(); g.moveTo(jx-8,-14); g.lineTo(jx+15,-14); g.lineTo(jx+14,-8+lj); g.lineTo(jx-6,-8+lj*0.6); g.closePath(); g.fill(); g.stroke();  // lower jaw
    if(open>0.25){ g.fillStyle='#0a2226'; g.beginPath(); g.moveTo(jx-6,-14); g.lineTo(jx+14,-14); g.lineTo(jx+13,-9+lj*0.8); g.lineTo(jx-5,-11+lj*0.5); g.closePath(); g.fill(); }  // dark gullet
    g.fillStyle=teeth;
    for(let i=0;i<5;i++){ const tx=jx-4+i*4;
      g.beginPath(); g.moveTo(tx,-14); g.lineTo(tx+1.6,-14); g.lineTo(tx+0.8,-11.5+open*2); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(tx,-8+lj*0.7); g.lineTo(tx+1.6,-8+lj*0.7); g.lineTo(tx+0.8,-10.5+lj*0.7-open*2); g.closePath(); g.fill(); }
    g.fillStyle='#0a1c20'; g.beginPath(); g.arc(8,-22,3.2,0,TAU); g.fill();   // eye
    g.fillStyle=hurt?'#ffd0d0':lure; g.beginPath(); g.arc(8.6,-22.6,1.5,0,TAU); g.fill();
    const lb=-34+Math.sin(t*2.2)*1.5;   // ---- the LURE ----
    g.strokeStyle=bodyD; g.lineWidth=2; g.beginPath(); g.moveTo(2,-28); g.quadraticCurveTo(16,-40,20,lb); g.stroke();
    const glow=0.55+0.35*Math.sin(t*3.4);
    g.fillStyle='rgba(160,235,255,'+(0.35*glow*sub).toFixed(2)+')'; g.beginPath(); g.arc(20,lb,7,0,TAU); g.fill();
    g.fillStyle=lure; g.beginPath(); g.arc(20,lb,2.6,0,TAU); g.fill();
    g.globalAlpha=1;
    if(hurt){ g.fillStyle='rgba(255,150,140,0.4)'; g.beginPath(); g.ellipse(-2,-15,24,17,0,0,TAU); g.fill(); }
    g.restore(); g.lineJoin='miter';
    const nm=m.title||m.name||MOBDEF[m.kind].name;
    g.font='bold 13px Georgia'; g.textAlign='center';
    g.fillStyle='rgba(0,0,0,0.65)'; g.fillText(nm,s.x+1,s.y-70);
    g.fillStyle='#bdf0ff'; g.fillText(nm,s.x,s.y-71);
    drawMobBars&&drawMobBars(m,s); return;
  }
  // THE SKIRL - Windsurf's Gale Spire guardian: the maddened wind given a shape, a
  // spinning funnel of stacked wind-rings with a pair of pale eyes near its crown.
  if(m.kind==='skirl'){
    const g=cx, fl=(m.face||1), t=G.time, hurt=m.hurtT>0;
    const spin=t*3.5, wob=Math.sin(m.anim*1.6)*2, sub=(m.invuln?0.4:0.9);
    drawShadowAt(g,s.x,s.y,26);
    g.save(); g.translate(s.x,s.y+wob*0.2); g.scale(fl,1); g.scale(2.2,2.2);
    g.globalAlpha=sub;
    for(let i=0;i<6;i++){ const yy=-6-i*7, rw=6+i*3.2, rot=spin*(1+i*0.15)+i;   // stacked funnel rings
      g.fillStyle= i%2? 'rgba(169,196,214,0.5)' : 'rgba(223,234,242,0.55)';
      g.beginPath(); g.ellipse(Math.cos(rot)*rw*0.25, yy, rw, rw*0.42, 0, 0, TAU); g.fill(); }
    g.strokeStyle='rgba(255,255,255,0.5)'; g.lineWidth=1.4;   // swirling wisp streaks
    for(let i=0;i<3;i++){ const a=spin+i/3*TAU; g.beginPath();
      for(let k=0;k<10;k++){ const yy=-6-k*4.2, rr=(6+k*2)*0.9, xx=Math.cos(a+k*0.5)*rr; k?g.lineTo(xx,yy):g.moveTo(xx,yy); } g.stroke(); }
    g.globalAlpha=1;
    g.fillStyle= hurt?'#ffd0d0':'#eaffff'; g.beginPath(); g.arc(-4,-40,2.4,0,TAU); g.arc(4,-40,2.4,0,TAU); g.fill();   // eyes
    g.fillStyle='rgba(120,200,235,0.9)'; g.beginPath(); g.arc(-4,-40,1.1,0,TAU); g.arc(4,-40,1.1,0,TAU); g.fill();
    if(hurt){ g.fillStyle='rgba(255,150,140,0.35)'; g.beginPath(); g.ellipse(0,-24,16,26,0,0,TAU); g.fill(); }
    g.restore();
    const nm=m.title||m.name||MOBDEF[m.kind].name;
    g.font='bold 13px Georgia'; g.textAlign='center';
    g.fillStyle='rgba(0,0,0,0.6)'; g.fillText(nm,s.x+1,s.y-72);
    g.fillStyle='#dfeaf2'; g.fillText(nm,s.x,s.y-73);
    drawMobBars&&drawMobBars(m,s); return;
  }
  // THE CINDERWROUGHT - Sunward's Ashen Forge guardian: a hulking basalt golem laced with
  // molten cracks, a glowing core, and heavy fists that rear on its telegraphed slam.
  if(m.kind==='cinderwrought'){
    const g=cx, fl=(m.face||1), t=G.time, hurt=m.hurtT>0, wnd=(m.windup>0);
    const glow=0.55+0.35*Math.sin(t*3)+(m.enraged?0.2:0);
    drawShadowAt(g,s.x,s.y,34);
    g.save(); g.translate(s.x,s.y); g.scale(fl,1); g.scale(2.5,2.5);
    const rock='#33302f', rockD='#211f1e', rockL='#4a4644', mol='rgba(255,'+(120+Math.round(60*glow))+',40,', OUT='rgba(10,6,4,0.75)';
    g.lineJoin='round';
    g.fillStyle=rockD; g.fillRect(-11,-15,8,15); g.fillRect(3,-15,8,15);   // legs
    g.fillStyle=mol+'0.9)'; g.fillRect(-10,-4,6,3); g.fillRect(4,-4,6,3);   // molten feet-cracks
    // torso (chunky basalt)
    g.fillStyle=rock; g.strokeStyle=OUT; g.lineWidth=2;
    g.beginPath(); g.moveTo(-15,-16); g.lineTo(-13,-46); g.lineTo(13,-46); g.lineTo(15,-16); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=rockL; g.beginPath(); g.moveTo(-13,-44); g.lineTo(-4,-44); g.lineTo(-6,-20); g.lineTo(-13,-20); g.closePath(); g.fill();
    // molten cracks + core
    g.strokeStyle=mol+'0.85)'; g.lineWidth=2.2;
    g.beginPath(); g.moveTo(-8,-40); g.lineTo(-3,-30); g.lineTo(-7,-22); g.moveTo(9,-42); g.lineTo(4,-32); g.lineTo(8,-24); g.stroke();
    const cg=g.createRadialGradient(0,-30,1,0,-30,9); cg.addColorStop(0,mol+'1)'); cg.addColorStop(1,mol+'0)');
    g.fillStyle=cg; g.beginPath(); g.arc(0,-30,9,0,TAU); g.fill();
    g.fillStyle=mol+'1)'; g.beginPath(); g.arc(0,-30,3.4,0,TAU); g.fill();
    // arms/fists (rear overhead on wind-up)
    const ay=wnd?-52:-30;
    g.strokeStyle=rockD; g.lineWidth=7; g.lineCap='round';
    g.beginPath(); g.moveTo(-13,-40); g.lineTo(-20,ay); g.stroke();
    g.beginPath(); g.moveTo(13,-40); g.lineTo(20,ay); g.stroke();
    g.fillStyle=rock; g.strokeStyle=OUT; g.lineWidth=1.6;
    g.beginPath(); g.arc(-20,ay,6,0,TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(20,ay,6,0,TAU); g.fill(); g.stroke();
    if(wnd){ g.fillStyle=mol+'0.9)'; g.beginPath(); g.arc(-20,ay,3,0,TAU); g.arc(20,ay,3,0,TAU); g.fill(); }
    // head (blocky, glowing eyes)
    g.fillStyle=rock; g.strokeStyle=OUT; g.lineWidth=2; g.beginPath(); g.moveTo(-8,-46); g.lineTo(8,-46); g.lineTo(6,-58); g.lineTo(-6,-58); g.closePath(); g.fill(); g.stroke();
    g.fillStyle= hurt?'#ffd0d0':(mol+'1)'); g.fillRect(-5,-54,3.5,3); g.fillRect(1.5,-54,3.5,3);
    g.lineCap='butt';
    if(hurt){ g.fillStyle='rgba(255,150,140,0.4)'; g.beginPath(); g.ellipse(0,-30,18,30,0,0,TAU); g.fill(); }
    g.restore(); g.lineJoin='miter';
    const nm=m.title||m.name||MOBDEF[m.kind].name;
    g.font='bold 13px Georgia'; g.textAlign='center';
    g.fillStyle='rgba(0,0,0,0.7)'; g.fillText(nm,s.x+1,s.y-74);
    g.fillStyle='#ff9a5a'; g.fillText(nm,s.x,s.y-75);
    drawMobBars&&drawMobBars(m,s); return;
  }
  // THE THUNDERCALLER - Cloudreach's Storm Temple herald: a robed storm-figure wreathed in a
  // crackling cloud-mantle, forking little bolts, its shield-ring shimmering while it charges.
  if(m.kind==='thundercaller'){
    const g=cx, fl=(m.face||1), t=G.time, hurt=m.hurtT>0, charge=(m.phase==='charge');
    const bob=-40-Math.sin(m.anim*1.5)*3;   // hovers
    drawShadowAt(g,s.x,s.y,24);
    g.save(); g.translate(s.x,s.y); g.scale(fl,1); g.scale(2.3,2.3);
    const robe='#2b3350', robeL='#454f78', mantle='rgba(180,200,240,', bolt='#eaf2ff';
    g.globalAlpha=(m.invuln?0.9:1);
    // storm-mantle (churning cloud ring around the shoulders)
    for(let i=0;i<5;i++){ const a=t*0.8+i/5*TAU; g.fillStyle=mantle+(0.28+0.12*Math.sin(t*2+i)).toFixed(2)+')';
      g.beginPath(); g.ellipse(Math.cos(a)*9,-34+Math.sin(a)*3,6,4,0,0,TAU); g.fill(); }
    // robed body (tapering to mist)
    g.fillStyle=robe; g.strokeStyle='rgba(10,14,28,0.7)'; g.lineWidth=1.8;
    g.beginPath(); g.moveTo(-9,-34); g.quadraticCurveTo(-12,-6,-5,-2+bob*0+0); g.lineTo(5,-2); g.quadraticCurveTo(12,-6,9,-34); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=robeL; g.beginPath(); g.moveTo(-6,-34); g.lineTo(-2,-34); g.lineTo(-3,-8); g.lineTo(-7,-8); g.closePath(); g.fill();
    // hood + face
    g.fillStyle=robe; g.beginPath(); g.arc(0,-42,7,Math.PI,0); g.lineTo(6,-38); g.lineTo(-6,-38); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#0a0e1a'; g.beginPath(); g.ellipse(0,-40,4.5,5,0,0,TAU); g.fill();
    g.fillStyle= hurt?'#ffd0d0':bolt; g.beginPath(); g.arc(-2,-41,1.3,0,TAU); g.arc(2,-41,1.3,0,TAU); g.fill();
    // forking bolts crackling off the mantle
    g.strokeStyle='rgba(200,225,255,'+(0.6+0.3*Math.sin(t*11)).toFixed(2)+')'; g.lineWidth=1.3; g.lineCap='round';
    for(let i=0;i<3;i++){ const a=t*5+i*2.1; let x=Math.cos(a)*8, y=-34+Math.sin(a)*5; g.beginPath(); g.moveTo(x,y);
      for(let k=0;k<3;k++){ x+=Math.cos(a)*3+rnd(-2,2); y+=Math.sin(a)*3+rnd(-2,2); g.lineTo(x,y);} g.stroke(); }
    g.lineCap='butt';
    if(charge){ const sr=0.5+0.4*Math.sin(t*9); g.strokeStyle='rgba(150,200,255,'+sr.toFixed(2)+')'; g.lineWidth=2.4;
      g.beginPath(); g.arc(0,-30,18,0,TAU); g.stroke(); }
    g.globalAlpha=1;
    if(hurt){ g.fillStyle='rgba(255,150,140,0.35)'; g.beginPath(); g.ellipse(0,-26,14,24,0,0,TAU); g.fill(); }
    g.restore();
    const nm=m.title||m.name||MOBDEF[m.kind].name;
    g.font='bold 13px Georgia'; g.textAlign='center';
    g.fillStyle='rgba(0,0,0,0.7)'; g.fillText(nm,s.x+1,s.y-72);
    g.fillStyle='#dfeaff'; g.fillText(nm,s.x,s.y-73);
    if(m.invuln && !charge){ g.fillStyle='#8fd0ff'; g.font='bold 10px Georgia'; g.fillText('SHIELDED',s.x,s.y-84); }
    else if(!m.invuln){ g.fillStyle='#ffe27a'; g.font='bold 10px Georgia'; g.fillText('VULNERABLE',s.x,s.y-84); }
    drawMobBars&&drawMobBars(m,s); return;
  }
  // THE TIDEWARD GUARDIAN - the Emberwick capstone's founders' sentinel: a tall knight of
  // tideglass in crowned armour, a greatsword it heaves overhead on its telegraphed sweep.
  // Its glass brightens by phase (m.wphase 1..3).
  if(m.kind==='wardking'){
    const g=cx, fl=(m.face||1), t=G.time, hurt=m.hurtT>0, wnd=(m.windup>0);
    const ph=m.wphase||1, glow=0.4+0.15*ph+0.15*Math.sin(t*3);
    drawShadowAt(g,s.x,s.y,34);
    g.save(); g.translate(s.x,s.y); g.scale(fl,1); g.scale(2.6,2.6);
    const glass='#7fb8d8', glassD='#4d7fa0', glassL='#cfeeff', gold='#e6c878', OUT='rgba(12,28,40,0.75)';
    g.lineJoin='round';
    // cloak behind
    g.fillStyle='rgba(40,70,100,0.85)'; g.beginPath(); g.moveTo(-10,-42); g.quadraticCurveTo(-20,-16,-10,-2); g.lineTo(10,-2); g.quadraticCurveTo(20,-16,10,-42); g.closePath(); g.fill();
    g.fillStyle=glassD; g.fillRect(-10,-15,7,15); g.fillRect(3,-15,7,15);   // greaves
    // torso (armoured, faceted)
    g.fillStyle=glass; g.strokeStyle=OUT; g.lineWidth=2;
    g.beginPath(); g.moveTo(-13,-16); g.lineTo(-11,-44); g.lineTo(11,-44); g.lineTo(13,-16); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=glassL; g.beginPath(); g.moveTo(-11,-44); g.lineTo(-2,-44); g.lineTo(-4,-18); g.lineTo(-11,-18); g.closePath(); g.fill();
    // a glowing tideglass heart on the breastplate
    const hg=g.createRadialGradient(0,-30,1,0,-30,8); hg.addColorStop(0,'rgba(200,240,255,'+glow.toFixed(2)+')'); hg.addColorStop(1,'rgba(120,200,235,0)');
    g.fillStyle=hg; g.beginPath(); g.arc(0,-30,8,0,TAU); g.fill();
    g.fillStyle=gold; g.beginPath(); g.moveTo(0,-34); g.lineTo(3,-30); g.lineTo(0,-26); g.lineTo(-3,-30); g.closePath(); g.fill();
    // pauldrons
    g.fillStyle=glassD; g.beginPath(); g.arc(-13,-42,5,0,TAU); g.arc(13,-42,5,0,TAU); g.fill();
    // far arm + sword arm (heaves the greatsword overhead on wind-up)
    g.strokeStyle=glassD; g.lineWidth=5.5; g.lineCap='round';
    g.beginPath(); g.moveTo(-12,-40); g.lineTo(-16,-20); g.stroke();
    const sxp=wnd?-2:16, syp=wnd?-64:-30, hxp=12, hyp=-40;   // sword hand
    g.beginPath(); g.moveTo(hxp,hyp); g.lineTo(sxp,syp); g.stroke();
    // the greatsword
    g.save(); g.translate(sxp,syp); g.rotate(wnd? -0.5 : 0.9);
    g.fillStyle=gold; g.fillRect(-2,-2,4,6); g.strokeStyle=OUT; g.lineWidth=1.4; g.strokeRect(-2,-2,4,6);   // hilt
    g.fillStyle=gold; g.fillRect(-6,-2,12,2.4);   // crossguard
    g.fillStyle=glassL; g.strokeStyle='rgba(90,140,170,0.8)'; g.lineWidth=1.2;   // blade
    g.beginPath(); g.moveTo(-2.4,-2); g.lineTo(2.4,-2); g.lineTo(1.2,-30); g.lineTo(0,-34); g.lineTo(-1.2,-30); g.closePath(); g.fill(); g.stroke();
    g.restore();
    // head + crown
    g.fillStyle=glass; g.strokeStyle=OUT; g.lineWidth=2; g.beginPath(); g.arc(0,-50,6,0,TAU); g.fill(); g.stroke();
    g.fillStyle= hurt?'#ffd0d0':'#eaffff'; g.fillRect(-3.5,-52,2.6,2.4); g.fillRect(1,-52,2.6,2.4);   // eyes
    g.fillStyle=gold; g.beginPath(); g.moveTo(-6,-55); g.lineTo(-6,-60); g.lineTo(-3,-57); g.lineTo(0,-61); g.lineTo(3,-57); g.lineTo(6,-60); g.lineTo(6,-55); g.closePath(); g.fill();   // crown
    g.lineCap='butt';
    if(hurt){ g.fillStyle='rgba(255,150,140,0.4)'; g.beginPath(); g.ellipse(0,-30,18,32,0,0,TAU); g.fill(); }
    g.restore(); g.lineJoin='miter';
    const nm=m.title||m.name||MOBDEF[m.kind].name;
    g.font='bold 14px Georgia'; g.textAlign='center';
    g.fillStyle='rgba(0,0,0,0.7)'; g.fillText(nm,s.x+1,s.y-80);
    g.fillStyle='#cfeeff'; g.fillText(nm,s.x,s.y-81);
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
// The mount publishes its vertical bob + gait phase here each frame, so the
// rider drawn on top can ride the bounce instead of floating at a fixed height.
// The dangling legs hang plumb and just bounce with this bob - they don't swing.
let MOUNT_BOB=0, MOUNT_PH=0, MOUNT_RUN=false;
function drawMoa(s){
  // Kiko is a MOA - a giant flightless ratite, tall as a door: heavy runner's
  // legs, a deep shaggy-feathered body, a long S-curved neck and a small beaked
  // head. Not a pig. Runs with a real two-leg gait; breathes and bobs when idle.
  const g=cx, fl=(P.dir&&P.dir.x<0)?-1:1, moving=!!P.moving, t=G.time;
  // heading up-screen (away from the camera) -> draw Kiko from BEHIND, not side-on
  const dx0=P.dir?P.dir.x:0.7, dy0=P.dir?P.dir.y:0.7;
  const away=(dx0+dy0)*0.5 < -0.15;
  // P.anim tracks ground covered and races at the moa's ride speed; a *8 stride
  // multiplier jumped the leg phase ~4 rad/frame, aliasing the gait into a strobe.
  // Keep it low (~0.75 rad/frame) so the run stays smooth at speed.
  const ph=P.anim*1.5, gait=moving?1:0;
  const bob = moving? Math.sin(ph*0.5)*1.7 : Math.sin(t*2)*0.7;   // body rise/fall
  MOUNT_BOB=bob; MOUNT_PH=ph; MOUNT_RUN=moving;                   // let the rider ride the bounce
  const OUT='rgba(22,15,8,0.85)';
  const body='#6b5334', belly='#9a8054', dark='#48371f', bodyHi='#8a6f48';
  const legc='#79684a', shank='#9a8768', horn='#c59a44', hornSh='#96742f';
  const CY=-24+bob;                                                  // body centre - high, so it stands TALL
  drawShadowAt(g,s.x,s.y,18);
  g.save(); g.translate(s.x,s.y); g.lineCap='round'; g.lineJoin='round';

  if(away){
    // ---- REAR VIEW: Kiko running away, seen from behind. Symmetric striding
    // legs, a rounded feathered rump, and the long neck rising up-screen to a
    // small back-of-head - that rising neck is the cue that reads as "going away"
    // instead of a side profile. A slight turn toward the heading (hd=fl) keeps
    // it a lively 3/4-rear rather than a flat back. ----
    const A=Math.sin(ph)*1.1*gait, B=Math.sin(ph+Math.PI)*1.1*gait, hd=fl;
    const rleg=(side, sw, shad)=>{                 // a ratite leg seen from behind
      const hipX=side*4.6, hipY=CY+7;
      const kneeX=side*6.0+sw*1.3, kneeY=CY+17;
      const ankX=side*6.6+sw*2.8, ankY=-2;
      g.strokeStyle= shad?dark:legc; g.lineWidth=7.0;               // shaggy thigh
      g.beginPath(); g.moveTo(hipX,hipY); g.lineTo(kneeX,kneeY); g.stroke();
      g.strokeStyle= shad?'#5f5038':shank; g.lineWidth=3.2;         // scaly shank
      g.beginPath(); g.moveTo(kneeX,kneeY); g.lineTo(ankX,ankY); g.stroke();
      g.strokeStyle= shad?hornSh:horn; g.lineWidth=2.4;             // toes splay from the ankle
      g.beginPath();
      g.moveTo(ankX,ankY); g.lineTo(ankX+side*4,1.4);
      g.moveTo(ankX,ankY); g.lineTo(ankX+side*1.4,2.4);
      g.moveTo(ankX,ankY); g.lineTo(ankX-side*1.6,1.6); g.stroke();
    };
    rleg(-1, B, true);                                              // far leg (behind body)
    // neck rising up-screen to a small head; drawn first so the rump overlaps its base
    const sway=(moving? Math.sin(ph*0.5):Math.sin(t*1.6))*1.2;
    const hX=hd*3.5+sway, hY=CY-26;
    g.strokeStyle=body; g.lineWidth=6.0;
    g.beginPath(); g.moveTo(hd*1.2,CY-7); g.quadraticCurveTo(hd*2.4,CY-18, hX,hY); g.stroke();
    g.fillStyle=bodyHi; g.beginPath(); g.ellipse(hX,hY,4.4,4.0,0,0,TAU); g.fill();  // back of head
    g.strokeStyle=OUT; g.lineWidth=1.4; g.stroke();
    g.fillStyle=horn; g.beginPath();                               // beak tip peeking past on the heading side
    g.moveTo(hX+hd*3,hY-0.4); g.lineTo(hX+hd*5.2,hY+0.7); g.lineTo(hX+hd*3,hY+1.7); g.closePath(); g.fill();
    // ---- rounded rump seen from behind ----
    const bg=g.createLinearGradient(0,CY-12,0,CY+11);
    bg.addColorStop(0,bodyHi); bg.addColorStop(0.6,body); bg.addColorStop(1,belly);
    g.fillStyle=bg; g.beginPath(); g.ellipse(0,CY,12,12,0,0,TAU); g.fill();
    g.strokeStyle=OUT; g.lineWidth=2; g.beginPath(); g.ellipse(0,CY,12,12,0,0,TAU); g.stroke();
    g.strokeStyle='rgba(28,19,10,0.30)'; g.lineWidth=3;            // spine shadow down the back
    g.beginPath(); g.moveTo(0,CY-9); g.lineTo(0,CY+6); g.stroke();
    g.strokeStyle='rgba(40,28,14,0.42)'; g.lineWidth=1;            // shaggy feather ticks, fanning out
    for(let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(i*3.4,CY-1); g.lineTo(i*3.4+(i<0?-1.7:1.7),CY+6); g.stroke(); }
    // tail tuft at the top of the rump
    g.fillStyle=dark;
    g.beginPath(); g.moveTo(-3,CY-7); g.quadraticCurveTo(hd*1,CY-15, hd*4,CY-12);
    g.quadraticCurveTo(hd*2,CY-6, 3,CY-6); g.closePath(); g.fill();
    g.strokeStyle=OUT; g.lineWidth=1.2; g.stroke();
    // saddle blanket on the back
    g.fillStyle='#5a3a5e'; g.beginPath(); g.ellipse(0,CY-5,7,3,0,0,TAU); g.fill();
    g.strokeStyle='#2c1830'; g.lineWidth=1.3; g.stroke();
    rleg(1, A, false);                                             // near leg (over the body)
    g.restore(); g.lineCap='butt'; g.lineJoin='miter';
    return;
  }
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
  MOUNT_PH=P.anim*1.8; MOUNT_RUN=!!P.moving;              // let the rider ride the bounce
  MOUNT_BOB=P.moving? Math.sin(MOUNT_PH)*1.0 : Math.sin(G.time*2)*0.5;
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
  // plunging into the Emberdeep pit: the hero tumbles down, shrinking and fading into the dark,
  // then respawns (see eastFall / emberRespawn). Drawn in place of the normal figure.
  {const _drop = (typeof G!=='undefined') && (G._emberDrop||G._mawDrop||G._windDrop||G._forgePlunge);
  if(_drop){
    const p=Math.min(1, _drop.t/_drop.dur), g=cx;
    g.save();
    g.globalAlpha=Math.max(0, 1-p*0.9);
    const fy=s.y + p*p*46;            // accelerating fall
    g.translate(s.x, fy); g.rotate(p*0.8); const sc=1-p*0.55; g.scale(sc,sc); g.translate(-s.x, -fy);
    drawPlayerFigure({x:s.x, y:fy});
    g.restore();
    return;
  }}
  // FALLING INTO THE TIDE RACE (Drowned Vault): touch the water off a dash and the hero drops
  // through it, sinking and fading as a ring of spray closes over the spot, then respawns on the
  // near shore (see barikPlungeStart / barikRespawn). Drawn in place of the figure - never the sail.
  if(typeof G!=='undefined' && G._barikPlunge){
    const p=Math.min(1, G._barikPlunge.t/G._barikPlunge.dur), g=cx;
    g.save(); g.strokeStyle='rgba(190,224,242,'+(0.7*(1-p)).toFixed(2)+')'; g.lineWidth=2;   // spray ring closing over
    g.beginPath(); g.ellipse(s.x, s.y+2, 6+p*16, (6+p*16)*0.5, 0, 0, TAU); g.stroke(); g.restore();
    g.save();
    g.globalAlpha=Math.max(0, 1-p*1.1);
    const fy=s.y + p*p*30;                                    // sinks under the surface
    g.translate(s.x, fy); const sc=1-p*0.5; g.scale(sc, sc*0.9); g.translate(-s.x, -fy);
    drawPlayerFigure({x:s.x, y:fy});
    g.restore();
    return;
  }
  // ZAPPED by an Underclimb ward-lance: the hero convulses in a cage of violet arcs, flashing
  // white, then respawns at the hall's mouth (see aerieZapStart / aerieRespawn).
  if(typeof G!=='undefined' && G._aerieZap){
    const p=Math.min(1, G._aerieZap.t/G._aerieZap.dur), g=cx;
    const jx=Math.sin(G.time*90)*3.2*(1-p), jy=Math.cos(G.time*77)*2.2*(1-p);   // electric jitter
    g.save();
    g.translate(s.x+jx, s.y+jy); g.translate(-s.x, -s.y);
    // the figure, tinted violet-white and flickering
    g.save(); g.globalAlpha=0.9;
    drawPlayerFigure({x:s.x, y:s.y});
    g.restore();
    // a white over-flash on the beat
    if(Math.sin(G.time*60)>0){ g.save(); g.globalAlpha=0.32*(1-p*0.5); g.globalCompositeOperation='lighter';
      drawPlayerFigure({x:s.x, y:s.y}); g.restore(); }
    // jagged arcs of violet lightning crackling over the body
    g.strokeStyle='rgba(216,176,255,0.95)'; g.lineWidth=1.6; g.lineCap='round';
    const arcs=5;
    for(let a=0;a<arcs;a++){
      const ang=G.time*13 + a/arcs*TAU;
      let ax=s.x+Math.cos(ang)*4, ay=s.y-22+Math.sin(ang)*3;
      g.beginPath(); g.moveTo(ax,ay);
      for(let k=0;k<4;k++){ ax+=Math.cos(ang)*5 + Math.sin(G.time*50+a*3+k)*4; ay+=Math.sin(ang)*6 + Math.cos(G.time*44+a*2+k)*4; g.lineTo(ax,ay); }
      g.stroke();
    }
    g.restore();
    return;
  }
  // PLUNGING into the Rimefissure's freezing water: the hero sinks into a ring of cracking ice,
  // shivering and paling with frost, then is flung back to the landing (see frostPlungeStart).
  if(typeof G!=='undefined' && G._frostPlunge){
    const p=Math.min(1, G._frostPlunge.t/G._frostPlunge.dur), g=cx;
    const sh=Math.sin(G.time*70)*2.6*(1-p);   // shiver
    // dark water welling up around the hole
    g.save(); g.globalAlpha=0.85; g.fillStyle='rgba(16,32,44,0.9)';
    g.beginPath(); g.ellipse(s.x, s.y+2, 20, 9, 0, 0, TAU); g.fill(); g.restore();
    // the hero, sinking and frosting over
    g.save();
    const fy=s.y + p*p*20;             // sinking
    g.globalAlpha=Math.max(0,1-p*0.7);
    g.translate(s.x+sh, fy); g.translate(-s.x, -fy);
    drawPlayerFigure({x:s.x, y:fy});
    // a pale rime glaze washing over the figure
    g.globalAlpha=0.30*p; g.globalCompositeOperation='lighter'; g.fillStyle='#dff0ff';
    g.beginPath(); g.ellipse(s.x, fy-11, 8, 13, 0, 0, TAU); g.fill();
    g.restore();
    // jagged shards of broken ice jutting up around the hole
    g.save(); g.strokeStyle='rgba(223,240,255,0.9)'; g.fillStyle='rgba(198,225,245,0.75)'; g.lineWidth=1.2;
    for(let i=0;i<7;i++){ const a=i/7*TAU + 0.3; const rx=Math.cos(a)*15, ry=Math.sin(a)*7;
      const hgt=5+((i*3)%4); g.beginPath(); g.moveTo(s.x+rx-2.4, s.y+2+ry); g.lineTo(s.x+rx, s.y+2+ry-hgt); g.lineTo(s.x+rx+2.4, s.y+2+ry); g.closePath(); g.fill(); g.stroke(); }
    g.restore();
    return;
  }
  // FALLING through the cloud between the Rainbow Road's floating platforms: the hero drops
  // away below the road, tumbling and shrinking into the blue, then the wind bears them back
  // to the isle (see skyFallStart / skyFallRespawn). A wisp of torn cloud lingers where they fell.
  if(typeof G!=='undefined' && G._skyFall){
    const z=G._skyFall, p=Math.min(1, z.t/z.dur), g=cx;
    // a torn scrap of cloud left hanging at the gap's edge, thinning as you drop
    g.save(); g.globalAlpha=0.5*(1-p); g.fillStyle='rgba(236,246,255,0.9)';
    for(let i=0;i<4;i++){ const a=i/4*TAU; g.beginPath(); g.ellipse(s.x+Math.cos(a)*7, s.y+2+Math.sin(a)*3, 5, 3, 0, 0, TAU); g.fill(); }
    g.restore();
    // the hero, falling: accelerating downward, spinning, shrinking and fading into the blue
    g.save();
    const fy=s.y + p*p*90;                 // accelerating plunge
    const sc=Math.max(0.15, 1-p*0.85);     // dwindling with distance
    g.globalAlpha=Math.max(0, 1-p*0.9);
    g.translate(s.x, fy); g.rotate(p*4.2); g.scale(sc,sc); g.translate(-s.x, -fy);
    drawPlayerFigure({x:s.x, y:fy});
    g.restore();
    return;
  }
  // dazed: little stars circle overhead while a stun holds you (see stunPlayer)
  if((P.stunT||0)>0){
    const g=cx, n=3, base=-46;
    for(let i=0;i<n;i++){ const a=G.time*6 + i/n*TAU; const sx=s.x+Math.cos(a)*11, sy=s.y+base+Math.sin(a)*4;
      g.fillStyle='#ffe27a'; g.font='bold 12px Georgia'; g.textAlign='center'; g.fillText('✦', sx, sy); }
  }
  // ---- water reflection + wake ----
  // When wading, surfing or sailing over water, cast a wobbling, flipped mirror of
  // the figure and open a V-wake behind the stride. Water only, top tier only.
  if(!LOWFX && !G.interior && !P.dead && G.worldId!=='skydungeon' && tileAt(P.x|0,P.y|0)<=T.SHALLOW){
    cx.save();
    cx.globalAlpha=0.20;
    const wob=Math.sin(G.time*3)*1.3;
    cx.translate(s.x+wob, s.y+7); cx.scale(1,-0.7); cx.translate(-(s.x+wob), -(s.y+7));
    drawPlayerFigure({x:s.x+wob, y:s.y+7});
    cx.restore();
    if(P.moving && tileAt(P.x|0,P.y|0)===T.SHALLOW){
      const b=(P.dir.x-P.dir.y), d=(P.dir.x+P.dir.y)*0.5;   // screen-space heading
      cx.save(); cx.globalAlpha=0.5; cx.strokeStyle='rgba(210,236,255,0.65)'; cx.lineWidth=1.6;
      for(const sgn of [-1,1]){ cx.beginPath(); cx.moveTo(s.x,s.y+2);
        cx.lineTo(s.x-b*11+sgn*9, s.y-d*11+4+sgn*2.2); cx.stroke(); }
      cx.restore();
    }
  }
  if(P.riding){
    const onMoa=P.unlocked&&P.unlocked.moa;
    if(onMoa) drawMoa(s); else drawHorse(s);
    // hips settle onto the mount's back and ride its bounce, so the whole rider
    // (and the legs hanging down its flanks) bobs with the gait instead of floating
    const s2={x:s.x, y:s.y-(onMoa?24:18)+MOUNT_BOB};
    drawPlayerFigure(s2);
    return;
  }
  if(P.unlocked&&P.unlocked.surf&&!G.interior&&G.worldId!=='skydungeon'&&G.worldId!=='barikdeep'&&tileAt(Math.floor(P.x),Math.floor(P.y))<=T.SHALLOW){
    // a WINDSURF: pale-wood board on its bow-wave, and a tall stormcloth sail
    // (Nessa's) that billows out to the heading side - drawn IN FRONT of the sailor,
    // who grips the boom. The sail dwarfs the rider, as a real windsurf rig does.
    const bobS=Math.sin(G.time*5)*1.4;
    const fl=(P.dir&&P.dir.x<0)?-1:1;
    const luff=Math.sin(G.time*3.2)*1.4;   // the sail breathes/luffs in the wind
    // ---- board + bow-wave, under the sailor ----
    cx.save(); cx.translate(s.x,s.y+bobS*0.4);
    cx.fillStyle='rgba(234,246,255,0.5)';
    cx.beginPath(); cx.ellipse(0,3,20,8,0,0,TAU); cx.fill();
    cx.fillStyle='#e0c894';
    cx.beginPath(); cx.ellipse(0,0,16,6,0,0,TAU); cx.fill();
    cx.strokeStyle='rgba(20,14,8,0.85)'; cx.lineWidth=1.6; cx.stroke();
    cx.strokeStyle='#8a6a3a'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(-13,0); cx.lineTo(13,0); cx.stroke();
    cx.restore();
    // ---- the sailor ----
    drawPlayerFigure({x:s.x, y:s.y-3+bobS*0.4});
    // ---- the rig, IN FRONT, billowing to the heading side ----
    cx.save(); cx.translate(s.x,s.y+bobS*0.4);
    const footX=fl*3, footY=-6;                  // mast foot on the board, front-centre
    const headX=fl*(11+luff), headY=-98;         // mast head - tall, well above the sailor
    const clewX=fl*(31+luff*2), clewY=-50;       // clew billowed far out to the heading side
    // sail body (cream stormcloth fading to a storm-violet leech), with a curved foot
    const grad=cx.createLinearGradient(footX,footY,clewX,clewY);
    grad.addColorStop(0,'#f2ecdc'); grad.addColorStop(1,'#d3c8e6');
    cx.fillStyle=grad; cx.lineJoin='round';
    cx.beginPath(); cx.moveTo(footX,footY); cx.lineTo(headX,headY);
    cx.quadraticCurveTo(clewX+fl*7,(headY+clewY)/2,clewX,clewY);
    cx.quadraticCurveTo((clewX+footX)/2,clewY+12,footX,footY); cx.closePath(); cx.fill();
    // a storm-violet panel across the upper sail + a batten seam
    cx.fillStyle='rgba(150,120,210,0.26)';
    cx.beginPath(); cx.moveTo(headX,headY); cx.lineTo(clewX,clewY); cx.lineTo((headX+footX)/2,(headY+footY)/2); cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(90,70,140,0.38)'; cx.lineWidth=1;
    cx.beginPath(); cx.moveTo(footX,footY-2); cx.lineTo((headX+clewX)/2,(headY+clewY)/2); cx.stroke();
    // sail outline
    cx.strokeStyle='rgba(40,30,20,0.5)'; cx.lineWidth=1.6;
    cx.beginPath(); cx.moveTo(footX,footY); cx.lineTo(headX,headY);
    cx.quadraticCurveTo(clewX+fl*7,(headY+clewY)/2,clewX,clewY);
    cx.quadraticCurveTo((clewX+footX)/2,clewY+12,footX,footY); cx.closePath(); cx.stroke();
    // mast (leading edge) + boom (the curved handle the sailor grips)
    cx.strokeStyle='#4a3826'; cx.lineWidth=2.4; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(footX,footY); cx.lineTo(headX,headY); cx.stroke();
    cx.strokeStyle='#6a5238'; cx.lineWidth=1.8;
    cx.beginPath(); cx.moveTo(footX,-42); cx.quadraticCurveTo((footX+clewX)/2,-52,clewX,clewY); cx.stroke();
    cx.restore();
    return;
  }
  if((P.rollT||0)>0 && !P.riding) drawRollFX(s);
  // hop (item 3): shadow stays on the ground and shrinks a touch while the
  // dash-roll is airborne; the figure lifts by P.z above it.
  const _pz=P.z||0;
  drawShadowAt(cx,s.x,s.y, _pz>0 ? 14*Math.max(0.55,1-_pz/26) : 14);
  if(_pz>0) s={x:s.x, y:s.y-_pz};
  drawPlayerFigure(s);
  drawCarriedFlame(s);
}
// THE GUTTERING FLAME (Rimefissure): a torch you carry to thaw the ice. It burns down
// in the cold - relight at a brazier before it gutters. Shown as a held torch + a life pip.
function drawCarriedFlame(s){
  if(G.worldId!=='frostdeep' || (G._flameT||0)<=0) return;
  const g=cx, t=G.time, life=Math.max(0,Math.min(1,(G._flameT||0)/(typeof FLAME_MAX!=='undefined'?FLAME_MAX:8)));
  const fx=s.x+11, fy=s.y-26;
  // the torch haft
  g.strokeStyle='#5a4838'; g.lineWidth=2.4; g.lineCap='round'; g.beginPath(); g.moveTo(fx-3,fy+9); g.lineTo(fx,fy); g.stroke();
  // the flame - bright and tall when full, guttering low when near dead
  const flick=0.82+0.18*Math.sin(t*22)+0.1*Math.sin(t*7.3), h=(5+11*life)*flick;
  const grad=g.createRadialGradient(fx,fy-h*0.3,1,fx,fy-h*0.3,h*1.7);
  grad.addColorStop(0,'rgba(255,244,190,0.95)'); grad.addColorStop(0.5,'rgba(255,150,50,'+(0.55*life+0.25).toFixed(2)+')'); grad.addColorStop(1,'rgba(255,80,20,0)');
  g.fillStyle=grad; g.beginPath(); g.ellipse(fx,fy-h*0.3,h*0.85,h*1.4,0,0,TAU); g.fill();
  // life pip above the head
  g.fillStyle='rgba(0,0,0,0.5)'; g.fillRect(s.x-11,s.y-52,22,4);
  g.fillStyle= life>0.33? '#ffb04a' : '#ff5a3a'; g.fillRect(s.x-10,s.y-51, 20*life, 2);
  if(Math.random()<0.4) G.parts.push({x:P.x+0.25,y:P.y-1.1,vx:rnd(-0.2,0.2),vy:-rnd(0.6,1.4),life:rnd(0.4,0.9),color:Math.random()<0.5?'#ffd07a':'#ff9a3c',size:rnd(1,2.2),grav:-0.05});
}
/* The dodge roll used to reuse a sped-up walk with a puff of dust. Give it real
   presence: a couple of fading afterimages streaking behind the dash line and a
   bright i-frame shimmer hugging the ground, peaking mid-roll. */
function drawRollFX(s){
  const p=1-(P.rollT||0)/0.26;
  const dxs=(P.dir.x-P.dir.y), dys=(P.dir.x+P.dir.y)*0.5;
  if(!LOWFX){
    for(let i=1;i<=2;i++){
      const k=i*8*(1-p*0.4);
      cx.save(); cx.globalAlpha=0.16*(1-p)*(1-i*0.28);
      drawPlayerFigure({x:s.x-dxs*k, y:s.y-dys*k});
      cx.restore();
    }
  }
  const sh=Math.sin(Math.max(0,Math.min(1,p))*Math.PI);
  cx.save(); cx.globalCompositeOperation='lighter'; cx.globalAlpha=0.5*sh;
  cx.strokeStyle='rgba(150,210,255,0.9)'; cx.lineWidth=2;
  cx.beginPath(); cx.ellipse(s.x,s.y-2,15,7,0,0,TAU); cx.stroke();
  cx.restore();
}
function drawPlayerFigure(s){
  const tool = P.weapon==='bow' ? 'bow' : P.weapon==='staff' ? 'staff' :
    ((P.gatherT||0)>0? P.gatherKind :
     P.fishing? 'rod' : (P.unlocked.melee? 'sword' : null)); // kit in hand while gathering; no phantom blade before the forge
  // one adventurer, one outfit - weapons only change what's in your hands
  const expr = P.hurtT>0? 'hurt'
    : (P.cheerT||0)>0? 'happy'
    : G.mobs.some(m=>!m.dead&&m.state==='chase'&&dist(P.x,P.y,m.x,m.y)<9)? 'battle' : 'calm';
  const look={hero:true, fem:true, expr, skin:'#d8a97a',hair:'#7a4526',shirt:'#3f6e56',pants:'#3c3833',
    trim:P.swordTier>0?'#8a6d30':null,   // no pauldrons: they broadened her shoulders into a triangular silhouette
    crest:!!(P.story && P.story.necklace),  // the crest necklace, worn from wake-up
    mask: !!(P.story && P.story.masked),     // the Emberwick mask - worn until the woodworker draws it off
    hat: has('crown',1)?'crown':null};
  // Once memory returns, the castaway becomes the princess again: her true royal
  // wear - a deep magenta - and her hair bound up in her traditional ponytail.
  if(P.story && P.story.royalGarb){
    look.shirt='#a2286a'; look.pants='#5a1a3e'; look.trim='#e6c25a'; look.hairstyle='ponytail';
  }
  if(P.weapon==='bow') look.quiver=true;   // the quiver joins the kit
  if(P.weapon==='staff') look.rune=true;   // a faint charm-glow, nothing more
  look.armor=P.armor||0;
  drawHumanoid(cx,s.x,s.y,{...look, size:1.32,
    dir:P.dir, step:P.riding?0:(P.moving?P.anim:0), ride:!!P.riding, stillT:P.stillT||0, weapon:tool, swing:P.swing, hurt:P.hurtT>0,
    ridePh:MOUNT_PH, rideRun:MOUNT_RUN,   // gait phase, published for the mount; seated legs hang plumb
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
  // airborne arc (item 3): thrown/loosed shots ride a parabola in p.z; keep a
  // shadow on the ground that separates from the shot as it climbs.
  if(p.z){
    drawShadowAt(cx, s.x, s.y-2, Math.max(3, 6-p.z*0.10));
    s={x:s.x, y:s.y - p.z};
  }
  if(p.kind==='galewisp'){
    // a little dodge-only flier the Storm-Eye spits: a comet-wisp with flitting wings
    const g=cx, t=G.time, a=Math.atan2(p.vy, p.vx), flap=Math.sin(t*22+(p.ph||0))*3;
    g.save(); g.translate(s.x, s.y-12);
    // glow + tail
    g.fillStyle='rgba(150,210,255,0.30)'; g.beginPath(); g.arc(0,0,9,0,TAU); g.fill();
    g.strokeStyle='rgba(180,225,255,0.5)'; g.lineWidth=3; g.lineCap='round';
    g.beginPath(); g.moveTo(-Math.cos(a)*12,-Math.sin(a)*12); g.lineTo(0,0); g.stroke();
    // wings
    g.fillStyle='rgba(210,235,255,0.85)';
    g.beginPath(); g.ellipse(-2,-3-Math.abs(flap),5,2.4,-0.6,0,TAU); g.fill();
    g.beginPath(); g.ellipse(-2, 3+Math.abs(flap),5,2.4, 0.6,0,TAU); g.fill();
    // body + eye
    g.fillStyle='#6fb6e8'; g.beginPath(); g.arc(0,0,3.4,0,TAU); g.fill();
    g.fillStyle='#eaf6ff'; g.beginPath(); g.arc(1,-0.6,1.4,0,TAU); g.fill();
    g.restore();
    return;
  }
  if(p.kind==='arrow'){
    // rotate to the arrow's actual on-SCREEN travel: a world velocity (vx,vy) maps to
    // screen ((vx-vy)*TW/2, (vx+vy)*TH/2) under the iso transform, so the angle must mix
    // both axes - not just atan2(vy,vx), which left the arrow pointing the wrong way.
    const a=Math.atan2((p.vx+p.vy)*TH/2,(p.vx-p.vy)*TW/2);
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
let mapBase=null, mapBaseWorld=null;
// cloud worlds recolour the minimap: PURE WHITE cloud land on a clear soft SKY-BLUE
// void (a sky, not a sea) - enough contrast that the island shape reads, so a window
// zoomed into the cloud never looks blank.
const CLOUDCOL={[T.DEEP]:'#5c9bd6',[T.SHALLOW]:'#93c0e8',[T.SNOW]:'#ffffff',[T.ICE]:'#cfe4f6',
  [T.RUIN]:'#d6dde6',[T.PATH]:'#eef4fb'};
function buildMapBase(){
  // REUSE one persistent canvas instead of allocating a fresh one per world. iOS Safari
  // caps total canvas memory; late in the game (many worlds cached) a NEW canvas here
  // could silently fail, leaving mapBase stale/null - which showed as a dark/stale
  // minimap on the Cloudreach. One reused, resized canvas can't exhaust that budget.
  // Cloud worlds are detected by SEED (set before switchWorld assigns G.worldId).
  const CLOUD = Object.keys(WORLD_DEFS).some(k=>WORLD_DEFS[k].cloud && WORLD_DEFS[k].seed===SEED);
  try{
    if(!mapBase) mapBase=document.createElement('canvas');
    if(mapBase.width!==MAPW) mapBase.width=MAPW;
    if(mapBase.height!==MAPH) mapBase.height=MAPH;
    const g=mapBase.getContext('2d'); if(!g) return;
    g.clearRect(0,0,MAPW,MAPH);
    for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
      const t=G.map[y*MAPW+x];
      g.fillStyle=(CLOUD && CLOUDCOL[t]) || MAPCOL[t]; g.fillRect(x,y,1,1);
    }
    mapBaseWorld=G.worldId;   // record which world this shared canvas now holds
  }catch(e){/* keep the previous image rather than blanking */}
}
let miniT=0;
function drawMinimap(){
  // Cloud worlds (no chartable ground) and dungeons (walls and floor are the same stone,
  // so the map is just a gray box) have their minimap sealed by design; #miniWrap is hidden
  // too (see syncMapUI/mapSealed), so just skip the draw.
  if(typeof mapSealed==='function' ? mapSealed() : (WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].cloud)) return;
  const c=document.getElementById('minimap'); if(!c) return;
  const g=c.getContext('2d'); if(!g) return;
  try{
    g.imageSmoothingEnabled=false;
    // OPAQUE base fill first, so the minimap is NEVER a blank/transparent box even if
    // a frame draws nothing (a dark parchment matches the HUD frame)
    g.fillStyle='#16110a'; g.fillRect(0,0,120,120);
    // Draw the visible window DIRECTLY from G.map, cell by cell - do NOT blit from an
    // offscreen mapBase canvas. iOS Safari caps total canvas memory, and the 9-arg
    // sub-rectangle drawImage(mapBase, sx,sy,w,h, ...) it used before silently drew
    // nothing on the Cloudreach (blank dark box, no dot) once that budget was spent -
    // even though the full-screen map, which blits the WHOLE image, still worked.
    // Painting ~48x48 fillRects straight onto the visible 120px canvas needs no
    // offscreen surface at all, so it can never go blank.
    const CLOUD = !!(WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].cloud);
    const vwWant=48, vw=Math.min(vwWant, MAPW, MAPH);
    const sx=clamp(P.x-vw/2,0,Math.max(0,MAPW-vw)), sy=clamp(P.y-vw/2,0,Math.max(0,MAPH-vw));
    const cell=120/vw, x0=Math.floor(sx), y0=Math.floor(sy);
    for(let ty=y0; ty<sy+vw; ty++){
      if(ty<0||ty>=MAPH) continue;
      const dy=(ty-sy)*cell;
      for(let tx=x0; tx<sx+vw; tx++){
        if(tx<0||tx>=MAPW) continue;
        const t=G.map[ty*MAPW+tx];
        g.fillStyle=(CLOUD && CLOUDCOL[t]) || MAPCOL[t] || '#16110a';
        g.fillRect((tx-sx)*cell, dy, cell+0.6, cell+0.6);
      }
    }
    // a grid pinned to world tiles - it scrolls as you move, so orientation and motion
    // read even on featureless terrain (open cloud, open sea) instead of a blank box
    g.strokeStyle='rgba(90,90,90,0.28)'; g.lineWidth=1;
    const gs=8;
    for(let wx=Math.ceil(sx/gs)*gs; wx<sx+vw; wx+=gs){ const gx=(wx-sx)/vw*120; g.beginPath(); g.moveTo(gx,0); g.lineTo(gx,120); g.stroke(); }
    for(let wy=Math.ceil(sy/gs)*gs; wy<sy+vw; wy+=gs){ const gy=(wy-sy)/vw*120; g.beginPath(); g.moveTo(0,gy); g.lineTo(120,gy); g.stroke(); }
    // landmark dots for the world's named zones - fixed points that slide past as you move
    P.disc=P.disc||{};
    for(const k in ZONES){ const z=ZONES[k]; if(!z.name) continue;
      const zx=(z.x-sx)/vw*120, zy=(z.y-sy)/vw*120;
      if(zx<-3||zx>123||zy<-3||zy>123) continue;
      g.fillStyle= P.disc[G.worldId+':'+k] ? 'rgba(255,213,120,0.95)' : 'rgba(235,235,235,0.6)';
      g.beginPath(); g.arc(zx,zy,2.4,0,TAU); g.fill();
      g.strokeStyle='rgba(0,0,0,0.5)'; g.lineWidth=1; g.stroke();
    }
    // the player: a bright red dot with a dark halo + white ring, so it reads on ANY terrain
    const px=(P.x-sx)/vw*120, py=(P.y-sy)/vw*120;
    g.beginPath(); g.arc(px,py,5.5,0,TAU); g.fillStyle='rgba(0,0,0,0.55)'; g.fill();
    g.beginPath(); g.arc(px,py,3.4,0,TAU); g.fillStyle='#ff3b30'; g.fill();
    g.lineWidth=1.5; g.strokeStyle='#fff'; g.stroke();
    const pq=primaryQuest();
    if(pq){ const tp=questTargetPos(pq);
      if(tp){ const qx=clamp((tp.x-sx)/vw*120,4,116), qy=clamp((tp.y-sy)/vw*120,4,116);
        g.fillStyle='#ff9a3c'; g.beginPath(); g.arc(qx,qy,3.4,0,TAU); g.fill(); } }
  }catch(e){ /* never let the minimap break the frame */ }
}
function drawBigMap(){
  // the panel heading follows the world you are actually on (was hard-coded to
  // Emberwick). Title-case the world's banner title so "ALDERMERE" reads "Aldermere".
  const mt=document.getElementById('mapTitle');
  if(mt){ const d=(typeof WORLD_DEFS!=='undefined') && WORLD_DEFS[G.worldId];
    mt.textContent = d ? d.title.toLowerCase().replace(/\b\w/g,ch=>ch.toUpperCase()) : 'Map'; }
  const c=document.getElementById('bigMap'), g=c.getContext('2d');
  g.imageSmoothingEnabled=false;
  // mapBase is ONE shared canvas aliased across every world and only redrawn on fresh
  // generation, so returning to a cached world (e.g. Emberwick after a gray, RUIN-heavy
  // dungeon) leaves it holding the previous world's terrain - the seen tiles then read
  // as a stale/gray image. Rebuild it here whenever it doesn't match the world we're
  // drawing, so the map always shows the isle you are actually standing on.
  if(!mapBase || mapBaseWorld!==G.worldId) buildMapBase();
  if(mapBase) g.drawImage(mapBase,0,0,384,384);
  const eg=EXPL[G.worldId];
  if(eg){
    // Dim (don't black out) the unexplored ground. At near-opaque this read as a solid
    // gray sheet on the huge Barik map, which you can never reveal enough of on foot -
    // the whole chart looked broken. A lighter veil lets the coastline and land show
    // through as a darkened map you fill in, while explored ground still reads brighter.
    g.fillStyle='rgba(22,17,11,0.62)';
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
