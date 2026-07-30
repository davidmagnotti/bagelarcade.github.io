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
    if(t===T.SAND) h*=0.35;                          // beaches stay low
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
   shade - a single consistent sun direction that matches the cast shadows. */
function _cliffCols(t){
  switch(t){
    case T.SAND:  return ['#b8996a','#8f744a'];
    case T.SNOW:  return ['#aec4d4','#8098ab'];
    case T.ICE:   return ['#9fc6d8','#749eb4'];
    case T.RUIN:  return ['#7d7466','#575046'];
    case T.PATH:  return ['#8a7350','#63523a'];
    case T.SOIL:  return ['#7a5b3c','#573f28'];
    case T.PLANK: return ['#8a6a44','#5f472c'];
    case T.FOREST:return ['#4c5a30','#333f1e'];
    default:      return ['#5f6a3a','#414a26'];   // grass & fallback
  }
}

/* paint the two front cliff faces of tile (x,y) whose diamond centre (unraised)
   is at screen (sx,sy). Only faces exposed by a LOWER front neighbour show. */
function elevDrawCliff(g,x,y,sx,sy){
  const L=heightLv(x,y); if(L<=0.02) return;
  const Lpx=L*ELEV.HSTEP, HW=TW/2, HH=TH/2, t=G.map[y*MAPW+x];
  const col=_cliffCols(t);
  const nR=heightLv(x+1,y);           // front-right neighbour (down-right in iso)
  if(nR < L-0.02){
    const npx=nR*ELEV.HSTEP;
    g.fillStyle=col[0];
    g.beginPath();
    g.moveTo(sx+HW, sy - Lpx);
    g.lineTo(sx,    sy+HH - Lpx);
    g.lineTo(sx,    sy+HH - npx);
    g.lineTo(sx+HW, sy - npx);
    g.closePath(); g.fill();
  }
  const nL=heightLv(x,y+1);           // front-left neighbour (down-left in iso)
  if(nL < L-0.02){
    const npx=nL*ELEV.HSTEP;
    g.fillStyle=col[1];
    g.beginPath();
    g.moveTo(sx,    sy+HH - Lpx);
    g.lineTo(sx-HW, sy - Lpx);
    g.lineTo(sx-HW, sy - npx);
    g.lineTo(sx,    sy+HH - npx);
    g.closePath(); g.fill();
  }
}

// expose for other modules / the console
window.ELEV=ELEV;
window.elevActive=elevActive;
window.ensureHeight=ensureHeight;
window.groundLiftAt=groundLiftAt;
window.elevTileLift=elevTileLift;
window.elevDrawCliff=elevDrawCliff;
window.heightLv=heightLv;
