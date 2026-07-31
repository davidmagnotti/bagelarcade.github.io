"use strict";
/* =====================================================================
   ELEVATION LAYER  (fake-3D terrain height, in the existing 2D iso engine)
   -----------------------------------------------------------------------
   Tidefarer's world is a flat tile grid: the "3D" you see is the iso
   projection plus baked shadows. This layer adds a per-tile HEIGHT field so
   land actually rises and falls - rolling inland hills and dramatic coastal
   cliffs - without touching gameplay. It is deliberately a *rendering*
   displacement only:

     * World logic (collision, click-to-walk, pathing) stays on the flat
       grid. Nothing about movement changes.
     * The ground pass draws each land tile raised by its height and paints
       the two front-facing cliff walls where a lower neighbour exposes them.
     * Every actor (player, NPCs, mobs, nodes, decor, pickups, projectiles)
       is lifted by the ground height beneath it, so it stands ON the terrain
       and its shadow rides the raised ground with it.

   Height is DERIVED from the terrain already generated - so none of the ~30
   world generators need editing. It is a distance-to-water ramp (coast=0,
   climbing inland) modulated by low-frequency noise for rolling variation,
   then smoothed so land->land steps stay gentle: the player walks a flat
   grid, so a sudden inland wall would read as teleporting up a cliff. Sharp
   drops survive only at the water's edge - exactly where we want cliffs and
   where you can't walk anyway.

   Gated to surface worlds (WORLD_DEFS: not dungeon, not cloud) so puzzle
   floors and sky-perches stay flat. Toggle at runtime with ELEV.on.
   ===================================================================== */

const ELEV = { on:true, HSTEP:6, MAXLV:4.2, RAMP:6 };

let _hWorld=null;   // which world G.height was built for

function elevActive(){
  if(!ELEV.on) return false;
  const def = (typeof WORLD_DEFS!=='undefined') && WORLD_DEFS[G.worldId];
  if(!def) return false;
  return !def.dungeon && !def.cloud;
}

function _isWater(t){ return t===T.DEEP || t===T.SHALLOW; }

/* Derive the height field for the current world from its terrain. */
function buildHeight(){
  const W=MAPW, H=MAPH, n=W*H;
  const lv=new Float32Array(n);
  const dist=new Int16Array(n); dist.fill(-1);
  const q=new Int32Array(n); let qh=0, qt=0;
  for(let i=0;i<n;i++){ if(_isWater(G.map[i])){ dist[i]=0; q[qt++]=i; } }
  // no water anywhere (some interiors slip the gate) -> leave flat
  if(qt===0){ G.height=lv; _hWorld=G.worldId; return lv; }
  // multi-source BFS: distance (in tiles) from every land cell to the sea
  while(qh<qt){
    const i=q[qh++], x=i%W, y=(i/W)|0, d=dist[i];
    if(x+1<W){ const j=i+1; if(dist[j]<0){ dist[j]=d+1; q[qt++]=j; } }
    if(x-1>=0){ const j=i-1; if(dist[j]<0){ dist[j]=d+1; q[qt++]=j; } }
    if(y+1<H){ const j=i+W; if(dist[j]<0){ dist[j]=d+1; q[qt++]=j; } }
    if(y-1>=0){ const j=i-W; if(dist[j]<0){ dist[j]=d+1; q[qt++]=j; } }
  }
  const hN = (typeof makeNoise==='function') ? makeNoise((SEED^0x9e3d)>>>0, 8) : null;
  const RAMP=ELEV.RAMP, MAX=ELEV.MAXLV;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i=y*W+x, t=G.map[i];
    if(_isWater(t)){ lv[i]=0; continue; }
    let d=dist[i]; if(d<0) d=RAMP;
    let base=Math.min(1, d/RAMP);
    base=base*base*(3-2*base);                       // smoothstep ramp from the coast
    const nz = hN ? (0.5 + 0.7*hN(x/W, y/H)) : 1;    // ~0.5..1.2 rolling hills
    let h = base*MAX*nz;
    if(t===T.SAND) h*=0.05;                          // beaches lie ~flush with the sea
                                                     // (a lifted beach put a little
                                                     // cliff at every shore tile - the
                                                     // stair-stepped coastline)
    else if(t===T.PLANK) h*=0.2;                     // docks/boards barely rise
    lv[i]=Math.max(0, Math.min(MAX, h));
  }
  // smoothing: average with land neighbours so inland gradients stay walkable-gentle
  for(let pass=0; pass<2; pass++){
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      const i=y*W+x; if(_isWater(G.map[i])) continue;
      let s=lv[i], c=1;
      if(x+1<W && !_isWater(G.map[i+1])){ s+=lv[i+1]; c++; }
      if(x-1>=0 && !_isWater(G.map[i-1])){ s+=lv[i-1]; c++; }
      if(y+1<H && !_isWater(G.map[i+W])){ s+=lv[i+W]; c++; }
      if(y-1>=0 && !_isWater(G.map[i-W])){ s+=lv[i-W]; c++; }
      lv[i]=s/c;
    }
  }
  // ---- water DEPTH field ----
  // The mirror of the land ramp: distance from land INTO the sea, for the
  // depth-graded water (bright shoals falling off into abyss) and the
  // shore-lap wave bands. Reuses the same BFS scratch arrays.
  const wd=new Float32Array(n);
  dist.fill(-1); qh=0; qt=0;
  for(let i=0;i<n;i++){ if(!_isWater(G.map[i])){ dist[i]=0; q[qt++]=i; } }
  if(qt>0 && qt<n){
    while(qh<qt){
      const i=q[qh++], x=i%W, y=(i/W)|0, d=dist[i];
      if(x+1<W){ const j=i+1; if(dist[j]<0){ dist[j]=d+1; q[qt++]=j; } }
      if(x-1>=0){ const j=i-1; if(dist[j]<0){ dist[j]=d+1; q[qt++]=j; } }
      if(y+1<H){ const j=i+W; if(dist[j]<0){ dist[j]=d+1; q[qt++]=j; } }
      if(y-1>=0){ const j=i-W; if(dist[j]<0){ dist[j]=d+1; q[qt++]=j; } }
    }
    for(let i=0;i<n;i++) wd[i]=_isWater(G.map[i]) ? Math.min(8, dist[i]<0?8:dist[i]) : 0;
    // Several smoothing passes over water so the depth ramp rolls out across
    // many tiles instead of stepping tile-to-tile. The depth colour is opaque
    // per tile, so a gentle field = a smooth shore->abyss gradient with no
    // visible diamond banding in the transition.
    for(let pass=0; pass<10; pass++)
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      const i=y*W+x; if(!_isWater(G.map[i])) continue;
      let s=wd[i], c=1;
      if(x+1<W && _isWater(G.map[i+1])){ s+=wd[i+1]; c++; }
      if(x-1>=0 && _isWater(G.map[i-1])){ s+=wd[i-1]; c++; }
      if(y+1<H && _isWater(G.map[i+W])){ s+=wd[i+W]; c++; }
      if(y-1>=0 && _isWater(G.map[i-W])){ s+=wd[i-W]; c++; }
      // diagonals too, so the field blurs isotropically (the sea grades in every
      // direction, not just along the axes) - a wider, gentler shore->abyss ramp
      if(x+1<W&&y+1<H && _isWater(G.map[i+W+1])){ s+=wd[i+W+1]; c++; }
      if(x-1>=0&&y+1<H && _isWater(G.map[i+W-1])){ s+=wd[i+W-1]; c++; }
      if(x+1<W&&y-1>=0 && _isWater(G.map[i-W+1])){ s+=wd[i-W+1]; c++; }
      if(x-1>=0&&y-1>=0 && _isWater(G.map[i-W-1])){ s+=wd[i-W-1]; c++; }
      wd[i]=s/c;
    }
  }
  G.wdepth=wd;
  G.height=lv; _hWorld=G.worldId; return lv;
}

function ensureHeight(){
  if(G.height && G.height.length===MAPW*MAPH && _hWorld===G.worldId) return G.height;
  return buildHeight();
}

/* height LEVEL at an integer tile (0 if out of bounds / no field) */
function heightLv(x,y){
  x|=0; y|=0;
  if(x<0||y<0||x>=MAPW||y>=MAPH||!G.height) return 0;
  return G.height[y*MAPW+x];
}

/* water DEPTH level at an integer tile (0 on land / out of bounds) */
function waterDepthLv(x,y){
  x|=0; y|=0;
  if(x<0||y<0||x>=MAPW||y>=MAPH||!G.wdepth) return 0;
  return G.wdepth[y*MAPW+x];
}

/* pixels a whole tile (x,y) is raised in the ground pass */
function elevTileLift(x,y){ return heightLv(x,y)*ELEV.HSTEP; }

/* pixels an actor at fractional world (wx,wy) rides up - bilinear so it glides */
function groundLiftAt(wx,wy){
  if(!G.height) return 0;
  const fx=Math.floor(wx), fy=Math.floor(wy), tx=wx-fx, ty=wy-fy;
  const h00=heightLv(fx,fy),   h10=heightLv(fx+1,fy),
        h01=heightLv(fx,fy+1), h11=heightLv(fx+1,fy+1);
  const h=(h00*(1-tx)+h10*tx)*(1-ty)+(h01*(1-tx)+h11*tx)*ty;
  return h*ELEV.HSTEP;
}

/* cliff-wall colours by terrain: [sunlit front-right, shaded front-left].
   The right (SE) face catches the low key light; the left (SW) face is in
   shade - a single consistent sun direction that matches the cast shadows.
   Grass/forest tops sit on earthen rock (the classic "green turf over brown
   cliff" read), not green walls. */
function _cliffCols(t){
  switch(t){
    case T.SAND:  return ['#c4a476','#96794f'];
    case T.SNOW:  return ['#b9cddd','#8ba3b6'];
    case T.ICE:   return ['#a8cede','#7aa6bc'];
    case T.RUIN:  return ['#847b6c','#5c554a'];
    case T.PATH:  return ['#907956','#66553d'];
    case T.SOIL:  return ['#7f5f40','#59422b'];
    case T.PLANK: return ['#8a6a44','#5f472c'];
    case T.FOREST:return ['#7c6750','#544437'];
    default:      return ['#8a7258','#5e4c3a'];   // grass & fallback: earthen rock
  }
}
/* turf-lip colour hanging over the cliff edge, per terrain top */
function _lipCol(t){
  if(t===T.GRASS) return '#4b6330';
  if(t===T.FOREST) return '#3f5629';
  if(t===T.SNOW||t===T.ICE) return '#dfeaf2';
  return null;   // sand/stone tops need no turf lip
}
/* crease colour for HAIRLINE steps (a slightly darker take on the tile top).
   Sub-pixel lift differences between smooth tiles leave a 1-3px seam that must
   be filled opaquely (the sea backdrop would show through) - but filling it
   with rock brown etched a grid over rolling grass. Match the turf instead. */
function _creaseCol(t){
  switch(t){
    case T.SAND:  return '#b3925e';
    case T.SNOW:  return '#a9bfd0';
    case T.ICE:   return '#8fb6c8';
    case T.RUIN:  return '#6d675c';
    case T.PATH:  return '#7c6647';
    case T.SOIL:  return '#6b4f34';
    case T.PLANK: return '#77593a';
    case T.FOREST:return '#39491f';
    default:      return '#42582b';   // grass
  }
}
/* darken a '#rrggbb' colour by factor f (0..1) */
function _shade(hex,f){
  const n=parseInt(hex.slice(1),16);
  return 'rgb('+(((n>>16)&255)*f|0)+','+(((n>>8)&255)*f|0)+','+((n&255)*f|0)+')';
}
/* the tile TOP tone (matches PAL in js/03-art.js) - used to fold gentle inland
   steps in the ground's own colour instead of exposing a rock cliff face */
function _topCol(t){
  switch(t){
    case T.SAND:  return '#c8b482';
    case T.SNOW:  return '#e9eef6';
    case T.ICE:   return '#b7d6e8';
    case T.RUIN:  return '#6f6a63';
    case T.PATH:  return '#9a7d51';
    case T.SOIL:  return '#61411f';
    case T.PLANK: return '#7d5834';
    case T.FOREST:return '#3e6030';
    default:      return '#5b8544';   // grass
  }
}
/* Fill a gentle inland step as a soft fold in the ground's own tone (no rock,
   no turf lip, no cast shadow) so a rolling slope reads as rolling ground - not
   a stack of little terraces. Only the coast (a WATER neighbour) still gets the
   dramatic textured cliff from _cliffFace. */
function _softFace(g,x0,y0,x1,y1,Lpx,npx,fill){
  const drop=Lpx-npx; if(drop<=0.4) return;
  const yb0=y0+drop, yb1=y1+drop;
  g.fillStyle=fill;
  g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.lineTo(x1,yb1); g.lineTo(x0,yb0);
  g.closePath(); g.fill();
}
/* deterministic per-tile jitter so strata don't swim frame to frame */
function _tHash(x,y){ return (((x*73856093)^(y*19349663))>>>0); }

/* paint ONE textured cliff face: a parallelogram from top edge (x0,y0)-(x1,y1)
   dropping (Lpx-npx) px. Gradient-lit rock, sediment strata, a turf lip with
   its under-shadow, and a bright rim on the sunlit edge. */
function _cliffFace(g,x,y,x0,y0,x1,y1,Lpx,npx,base,lip,rimA,crease){
  const drop=Lpx-npx;
  const yb0=y0+drop, yb1=y1+drop;
  // hairline step: just seal the seam in the terrain's own tone - no rock,
  // no texture. Real cliff treatment starts once the face is tall enough.
  if(drop<=3){
    g.fillStyle=crease;
    g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.lineTo(x1,yb1); g.lineTo(x0,yb0);
    g.closePath(); g.fill();
    return;
  }
  // rock body: lit at the brow, falling into shadow at the foot
  const gr=g.createLinearGradient(0, Math.min(y0,y1), 0, Math.max(yb0,yb1));
  gr.addColorStop(0, base); gr.addColorStop(1, _shade(base,0.58));
  g.fillStyle=gr;
  g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.lineTo(x1,yb1); g.lineTo(x0,yb0);
  g.closePath(); g.fill();
  if(drop>9){
    // sediment strata: faint dark bands (with a chiselled light edge) that
    // follow the iso slope, jittered per tile so the coast doesn't stripe
    const n=Math.min(3,(drop/9)|0);
    for(let k=1;k<=n;k++){
      let off=drop*k/(n+1)+((_tHash(x*7+k,y)%5)-2);
      off=Math.max(2,Math.min(drop-2,off));
      g.strokeStyle='rgba(0,0,0,0.13)'; g.lineWidth=1;
      g.beginPath(); g.moveTo(x0,y0+off); g.lineTo(x1,y1+off); g.stroke();
      g.strokeStyle='rgba(255,255,255,0.05)';
      g.beginPath(); g.moveTo(x0,y0+off+1); g.lineTo(x1,y1+off+1); g.stroke();
    }
  }
  // turf lip drooping over the brow, and the shadow it casts on the rock
  if(lip && drop>4){
    g.fillStyle=lip;
    g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1);
    g.lineTo(x1,y1+2.6); g.lineTo(x0,y0+2.6); g.closePath(); g.fill();
    g.fillStyle='rgba(0,0,0,0.20)';
    g.beginPath(); g.moveTo(x0,y0+2.6); g.lineTo(x1,y1+2.6);
    g.lineTo(x1,y1+4.4); g.lineTo(x0,y0+4.4); g.closePath(); g.fill();
  }
  // rim light along the very edge - the sun catching the cliff brow.
  // Only on REAL faces: hairline steps from the smoothed inland gradients
  // would otherwise etch a bright grid across gently rolling ground.
  if(drop>5){
    g.strokeStyle='rgba(255,243,207,'+rimA+')'; g.lineWidth=1;
    g.beginPath(); g.moveTo(x0,y0+0.5); g.lineTo(x1,y1+0.5); g.stroke();
  }
}

/* paint the two front cliff faces of tile (x,y) whose diamond centre (unraised)
   is at screen (sx,sy). Only faces exposed by a LOWER front neighbour show. */
function elevDrawCliff(g,x,y,sx,sy){
  const L=heightLv(x,y); if(L<=0.02) return;
  const Lpx=L*ELEV.HSTEP, HW=TW/2, HH=TH/2, t=G.map[y*MAPW+x];
  const col=_cliffCols(t), lip=_lipCol(t), crease=_creaseCol(t), top=_topCol(t);
  const nR=heightLv(x+1,y);           // front-right neighbour (down-right in iso)
  if(nR < L-0.02){
    const npx=nR*ELEV.HSTEP;
    const nt=tileAt(x+1,y), wet=(nt===T.DEEP||nt===T.SHALLOW);
    if(wet){
      // the coast: a real, textured cliff dropping into the sea
      _cliffFace(g,x,y, sx+HW,sy-Lpx, sx,sy+HH-Lpx, Lpx,npx, col[0], lip, 0.30, crease);
      if(Lpx-npx>4){   // wet stain where the sunlit face steps into the water
        g.fillStyle='rgba(18,30,42,0.35)';
        g.beginPath(); g.moveTo(sx+HW,sy-npx); g.lineTo(sx,sy+HH-npx);
        g.lineTo(sx,sy+HH-npx-3.5); g.lineTo(sx+HW,sy-npx-3.5); g.closePath(); g.fill();
      }
    } else {
      // inland: a gentle fold in the ground's own tone (sunlit SE face). Shade
      // scales with the DROP so the tiny sub-tile steps of a rolling slope stay
      // near-invisible (no terrace lines) and only a real inland roll picks up a
      // whisper of volume.
      _softFace(g, sx+HW,sy-Lpx, sx,sy+HH-Lpx, Lpx,npx, _shade(top, 1-Math.min(0.012,(Lpx-npx)*0.004)));
    }
  }
  const nL=heightLv(x,y+1);           // front-left neighbour (down-left in iso)
  if(nL < L-0.02){
    const npx=nL*ELEV.HSTEP;
    const nt=tileAt(x,y+1), wet=(nt===T.DEEP||nt===T.SHALLOW);
    if(wet){
      _cliffFace(g,x,y, sx,sy+HH-Lpx, sx-HW,sy-Lpx, Lpx,npx, col[1], lip, 0.10, crease);
      if(Lpx-npx>4){
        g.fillStyle='rgba(18,30,42,0.35)';
        g.beginPath(); g.moveTo(sx,sy+HH-npx); g.lineTo(sx-HW,sy-npx);
        g.lineTo(sx-HW,sy-npx-3.5); g.lineTo(sx,sy+HH-npx-3.5); g.closePath(); g.fill();
      }
    } else {
      // inland: the shaded SW face - a touch darker than the SE for soft volume,
      // but likewise drop-scaled so gentle steps don't etch a diagonal line.
      _softFace(g, sx,sy+HH-Lpx, sx-HW,sy-Lpx, Lpx,npx, _shade(top, 1-Math.min(0.045,(Lpx-npx)*0.009)));
    }
  }
}

/* ---- per-tile grade pass: sun wash + contact shadows (AO) ----
   Static per world, drawn with the ground: in full quality it rides the live
   tile pass; in LOWFX it is baked once into the ground cache for free. */
let _sunDia=null;
function _mkDia(col){
  const c=document.createElement('canvas'); c.width=TW; c.height=TH;
  const g=c.getContext('2d'); g.fillStyle=col;
  g.beginPath(); g.moveTo(TW/2,0); g.lineTo(TW,TH/2); g.lineTo(TW/2,TH); g.lineTo(0,TH/2);
  g.closePath(); g.fill(); return c;
}
/* this water tile's depth averaged with its water neighbours - a continuous
   ramp for the depth colour, instead of the raw per-tile step */
function _waterDepthSmooth(x,y){
  let s=waterDepthLv(x,y), c=1;
  const add=(nx,ny)=>{ const d=waterDepthLv(nx,ny); if(d>0){ s+=d; c++; } };
  add(x+1,y); add(x-1,y); add(x,y+1); add(x,y-1);
  return s/c;
}
/* Paint a water tile a SOLID depth-driven colour: bright turquoise in the
   shoals grading to a dark abyss offshore. Because the depth is neighbour-
   smoothed and the fill is OPAQUE (not a translucent stamp), adjacent tiles
   differ only slightly and abut cleanly - the sea grades smoothly with no
   per-tile quilt and no diamond seams (the over-cover stroke seals the AA rim,
   exactly as the land tiles do). Drawn UNDER the animated sheen/waves, so those
   still read on top. Shared by the live tile pass and the LOWFX ground bake. */
function elevWaterTint(g,x,y,sx,sy){
  if(!G.wdepth) return;
  const wd=_waterDepthSmooth(x,y);
  const f=Math.min(1, wd/6.5), s=f*f*(3-2*f);         // smoothstep shore->abyss
  const r=(112-94*s)|0, gg=(196-150*s)|0, bb=(206-126*s)|0;   // (112,196,206) -> (18,46,80)
  const HW=TW/2, HH=TH/2, col='rgb('+r+','+gg+','+bb+')';
  g.fillStyle=col;
  g.beginPath(); g.moveTo(sx,sy-HH); g.lineTo(sx+HW,sy); g.lineTo(sx,sy+HH); g.lineTo(sx-HW,sy); g.closePath();
  g.fill();
  g.strokeStyle=col; g.lineWidth=1.3; g.lineJoin='round'; g.stroke();
}
function _aoBand(g,x0,y0,x1,y1,nx,ny,a){
  // two nested translucent bands fake a soft gradient without one
  g.fillStyle='rgba(0,0,0,'+(a*0.45).toFixed(3)+')';
  g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1);
  g.lineTo(x1+nx*8,y1+ny*8); g.lineTo(x0+nx*8,y0+ny*8); g.closePath(); g.fill();
  g.fillStyle='rgba(0,0,0,'+(a*0.55).toFixed(3)+')';
  g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1);
  g.lineTo(x1+nx*4,y1+ny*4); g.lineTo(x0+nx*4,y0+ny*4); g.closePath(); g.fill();
}
function elevTileFX(g,x,y,sx,sy){
  if(!G.height) return;
  const t=G.map[y*MAPW+x], water=(t===T.DEEP||t===T.SHALLOW);
  const L=water?0:heightLv(x,y), cy=sy-L*ELEV.HSTEP, HW=TW/2, HH=TH/2;
  // (the depth-graded sea now lives in elevWaterTint, drawn earlier so the
  //  animated sheen/waves sit on top of it.)
  // warm sun wash on high ground - hills catch the light, fading with dusk
  if(!water && L>0.6){
    if(!_sunDia) _sunDia=_mkDia('#ffe9b8');
    let a=Math.min(0.12,(L-0.6)*0.03);
    const dT=(typeof G.dayT==='number')?G.dayT:0.25;
    a*=(dT>=0.06&&dT<=0.44) ? (1-Math.min(1,Math.abs((dT-0.25)/0.19))*0.65) : 0.25;
    if(a>0.01){ g.globalAlpha=a; g.drawImage(_sunDia, sx-TW/2, cy-TH/2); g.globalAlpha=1; }
  }
  // contact shadow where a higher back-tile's cliff wall meets this ground
  // (works on water too - the cliff's shade pooling at its foot in the sea).
  // Threshold at a REAL step (>0.5 level): the smoothed inland gradients sit
  // below it, so rolling ground stays clean and only true cliffs ground-shadow.
  // Threshold at a REAL cliff step (>1.3 level): gentle inland slopes (which now
  // fold in the ground's own tone) must NOT ground-shadow, or the contact bands
  // stack back into terrace lines. Only true cliffs pool shade at their foot.
  const dL=heightLv(x-1,y)-L, dR=heightLv(x,y-1)-L;
  if(dL>1.3) _aoBand(g, sx-HW,cy, sx,cy-HH, 0.894,0.447, Math.min(0.22,(dL-1.3)*0.16));
  if(dR>1.3) _aoBand(g, sx,cy-HH, sx+HW,cy, -0.894,0.447, Math.min(0.22,(dR-1.3)*0.16));
}

// expose for other modules / the console
window.ELEV=ELEV;
window.elevActive=elevActive;
window.ensureHeight=ensureHeight;
window.groundLiftAt=groundLiftAt;
window.elevTileLift=elevTileLift;
window.elevDrawCliff=elevDrawCliff;
window.elevTileFX=elevTileFX;
window.elevWaterTint=elevWaterTint;
window.heightLv=heightLv;
window.waterDepthLv=waterDepthLv;
