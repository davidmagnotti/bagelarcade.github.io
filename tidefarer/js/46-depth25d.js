"use strict";
/* =====================================================================
   2.5-D DEPTH LAYER  -  aerial perspective + parallax horizon
   -----------------------------------------------------------------------
   The world is a true isometric ground plane, yet it read FLAT: every tile,
   sprite and character was lit at the same crispness and contrast, so the
   scene looked like a tidy tilemap seen head-on rather than a place with
   real distance in it. The engine already had the *structural* depth cues
   (iso projection, terrain elevation + cliffs, directional cast shadows,
   depth-sorted actors) - what it lacked were the ATMOSPHERIC ones that tell
   an eye "this is far away." Two cheap, fully procedural passes add them:

     1. AERIAL PERSPECTIVE  - the far field (up-screen, where iso distance
        recedes) is veiled toward the sky/atmosphere colour, while the
        foreground stays crisp and saturated. This is the single strongest
        "things get hazier the further off they are" depth cue, and it costs
        two cached gradient fills. The veil colour + strength track the time
        of day and the world (cool by day, warm at dawn/dusk, deep-blue at
        night, bright over cloud worlds).

     2. PARALLAX HORIZON    - over open water, a band of distant, hazy island
        silhouettes sits low on the sea backdrop and slides at a fraction of
        the camera's speed, so the sea reads as opening onto a far
        archipelago instead of a flat blue wall. Cloud worlds get drifting
        cloud banks in its place. Drawn on the backdrop BEFORE the ground, so
        the terrain naturally clips it to the sea/sky gaps.

   Both are stateless (derived from camera + G.time), rebuild only a couple
   of gradients per frame, honour the `depth` effect toggle, and self-skip in
   dungeons and interiors (which have no sky). See the two call sites in
   render() (js/10-rendering.js).
   ===================================================================== */

/* small integer hash for the deterministic island field */
function _d25hash(a,b){ let n=Math.imul(a|0,73856093)^Math.imul(b|0,19349663); n=(n^(n>>>13))>>>0; return n; }
function _d25mix(a,b,k){ return [a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k, a[2]+(b[2]-a[2])*k]; }
function _d25rgba(c,a){ return 'rgba('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+','+(+a).toFixed(3)+')'; }

/* The atmosphere colour + haze strength for the current world & time of day.
   Returns {col:[r,g,b], a:topAlpha}. Kept in one place so the aerial veil and
   the distant silhouettes agree on what "far away" looks like right now. */
function depthAtmo(CLOUD){
  const night = (typeof nightAmount==='function') ? nightAmount() : 0;
  const t = (typeof G!=='undefined') ? G.dayT : 0.25;
  // warmth swells at dawn (t~0) and dusk (t~0.5) - the low-sun golden band
  let warm=0;
  if(t>0.40 && t<0.55) warm=Math.sin((t-0.40)/0.15*Math.PI);
  else if(t<0.10)      warm=Math.sin((0.10-t)/0.10*Math.PI);
  const DAY  =[168,192,214];   // clean daytime steel-blue haze
  const WARM =[233,178,132];   // low-sun amber
  const NIGHT=[ 26, 42, 66];   // deep, cool night distance
  const SKY  =[224,236,248];   // bright cloud-world dome
  let col = DAY;
  col = _d25mix(col, WARM, warm*0.7);
  col = _d25mix(col, NIGHT, Math.min(1,night)*0.85);
  if(CLOUD) col = _d25mix(col, SKY, 0.6);
  let a = 0.32 + Math.min(1,night)*0.16 + warm*0.06;
  if(CLOUD) a = 0.34;
  return {col, a};
}

/* ---- 1: aerial perspective veil (screen-space, drawn near the end of the
   frame under the UI markers) --------------------------------------------
   A vertical gradient weighted to the top of the view - where the isometric
   ground recedes into the distance - so the far field washes toward the sky
   colour while the ground at the player's feet stays clear. A whisper of a
   darker gradient along the very bottom seats the near foreground so it reads
   as the closest, heaviest part of the scene. */
function depthAerial(CLOUD){
  if(typeof inDungeon==='function' && inDungeon()) return;   // no sky underground
  if(typeof VW==='undefined') return;
  const {col,a} = depthAtmo(CLOUD);
  // far-field haze, strongest at the top edge, gone by mid-screen
  const g = cx.createLinearGradient(0,0,0,VH);
  g.addColorStop(0.00, _d25rgba(col, a));
  g.addColorStop(0.30, _d25rgba(col, a*0.52));
  g.addColorStop(0.52, _d25rgba(col, a*0.18));
  g.addColorStop(0.74, _d25rgba(col, 0));
  cx.fillStyle=g; cx.fillRect(0,0,VW,VH);
  // near-field seat: a faint shadowed weight along the bottom pushes the
  // foreground forward (kept low so it layers with, not fights, the vignette)
  const dk = _d25mix(col,[8,10,16],0.7);
  const gf = cx.createLinearGradient(0,VH*0.78,0,VH);
  gf.addColorStop(0, _d25rgba(dk,0));
  gf.addColorStop(1, _d25rgba(dk,0.13));
  cx.fillStyle=gf; cx.fillRect(0,VH*0.78,VW,VH*0.22+1);
}

/* height of the deterministic distant ridge at world-anchored x `wx`, as a sum
   of a few gaussian island humps spaced ~`period` apart. Mostly zero (open
   water) with the odd hump (an island) rising out of it. */
function _d25ridge(wx, period, amp, seed){
  let h=0;
  const i0=Math.floor(wx/period)-1;
  for(let i=i0;i<=i0+2;i++){
    const r=_d25hash(i,seed);
    const cxp=i*period + ((r&1023)/1023)*period*0.55;
    const w  =period*(0.14 + ((r>>>10)&1023)/1023*0.16);
    const pk =amp*(0.35 + ((r>>>20)&1023)/1023*0.65);
    const dx=(wx-cxp)/w;
    h += pk*Math.exp(-dx*dx);
  }
  return h;
}

/* one silhouette layer: a wavy island band above a flat waterline, slid by the
   camera at `parX`/`parY` of world speed so nearer layers travel faster. */
function _d25band(baseY, amp, period, parX, parY, seed, col, alpha){
  const offX = (G.cam.x||0)*parX, offY = (G.cam.y||0)*parY;
  const y0 = baseY + offY*0.25;   // gentle vertical parallax, so it never pins
  const step = 22;
  cx.fillStyle=_d25rgba(col, alpha);
  cx.beginPath();
  cx.moveTo(-40, y0);
  for(let sx=-40; sx<=VW+40; sx+=step){
    const wx = sx + offX;                 // world-anchored so the shape scrolls
    cx.lineTo(sx, y0 - _d25ridge(wx, period, amp, seed));
  }
  cx.lineTo(VW+40, y0);
  cx.closePath(); cx.fill();
}

/* soft drifting cloud bank for the sky (cloud) worlds - the same hump field,
   stacked translucent and offset for a blurred, weightless look. */
function _d25cloudBank(baseY, amp, period, parX, seed, tint, alpha){
  const offX=(G.cam.x||0)*parX + G.time*(6+parX*40);   // clouds also drift on their own
  const step=20;
  for(let pass=0;pass<3;pass++){
    const dy=pass*3;
    cx.fillStyle=_d25rgba(tint, alpha*(pass===1?1:0.6));
    cx.beginPath();
    cx.moveTo(-40, baseY+dy);
    for(let sx=-40; sx<=VW+40; sx+=step){
      const wx=sx+offX;
      cx.lineTo(sx, baseY+dy - _d25ridge(wx, period, amp, seed)*(1-pass*0.12));
    }
    cx.lineTo(VW+40, baseY+dy); cx.closePath(); cx.fill();
  }
}

/* =====================================================================
   BUILDING CAST SHADOWS
   -----------------------------------------------------------------------
   Buildings used to drop a single wide contact OVAL on the ground. The
   directional-cast logic then stretched and shoved that oval sideways, so
   on a house it pooled out in FRONT of the door and read as a detached
   round blob sitting on the grass. Replace it, for standing buildings, with
   a real planar cast shadow: the sprite's own black silhouette, hinged at
   its foot, flattened onto the ground and sheared toward the sun's away-side
   so it lies BEHIND-and-to-one-side of the building - the shape you'd expect
   the walls and roof to throw. Runs in every quality tier (it's a single
   extra drawImage per building) so the round blob is gone on phones too,
   which sit in the low-gfx tier where the artefact was most obvious.
   ===================================================================== */

/* which decor kinds get the silhouette cast (standing walls with a footprint) */
const _D25_CAST = {house:1,house2:1,barn:1,forge:1,hut:1,stormhut:1,igloo:1,tower:1,bazaar:1};
function buildingCasts(kind){ return !!_D25_CAST[kind]; }

/* Black silhouette of a sprite, cached on the sprite canvas itself (baked once
   per sprite, so it costs a single extra drawImage per building per frame). */
function _d25silhouette(S){
  if(S._sil) return S._sil;
  const c=document.createElement('canvas'); c.width=S.width; c.height=S.height;
  const g=c.getContext('2d');
  g.drawImage(S,0,0);
  g.globalCompositeOperation='source-in';   // keep the sprite's alpha, paint it solid black
  g.fillStyle='#000'; g.fillRect(0,0,c.width,c.height);
  S._sil=c; return c;
}

/* Sun placement for the cast: how LOW it sits (0 at noon -> a tight shadow, 1
   near the horizon -> a long one) and which side it throws to. Fixed to a gentle
   afternoon on the always-daylight tutorial isle and underground. Shared so every
   caster - buildings, trees - agrees on where the light is. */
function _d25sun(){
  const night=(typeof nightAmount==='function')?nightAmount():0;
  const fixed=(G.worldId==='isle') || (typeof inDungeon==='function' && inDungeon());
  let low=0.45, dir=1;
  if(!fixed){
    const t=G.dayT;
    if(t>=0.06 && t<=0.44){ low=Math.min(1,Math.abs((t-0.25)/0.19)); dir=(t<0.25)?1:-1; }
    else { low=0.92; dir=(t<0.25||t>0.9)?1:-1; }
  }
  return {low, dir, night};
}

/* Core planar cast: the sprite's silhouette, hinged at (cx0,footY), folded back
   onto the ground. `flat` is the cast length as a MULTIPLE of sprite height (>1
   rises past the top of the sprite, so it emerges BEHIND it up-screen rather than
   being hidden by the sprite drawn on top); `shear` leans it to the back-side. */
function _d25fold(S, cx0, footY, w, h, flat, shear, alpha){
  if(alpha<0.03) return;
  const g=cx;
  g.save();
  g.globalAlpha=alpha;
  g.translate(cx0, footY);
  g.transform(1, 0, shear, flat, 0, 0);   // (x,y) -> (x + shear*y, flat*y); y<=0 above the hinge
  g.drawImage(_d25silhouette(S), -w/2, -h, w, h);
  g.restore();
}

/* Draw the planar cast shadow for one building. `s` is the tile-origin screen
   point; the sprite is drawn with its foot at s.y+~10, spanning S.height*BS up. */
function drawBuildingShadow(b,S,s,BS){
  const {low,dir,night}=_d25sun();
  const flat  = 0.78 + low*0.5;            // cast length as a multiple of sprite height (~>1 => past the roof)
  const shear = dir*(0.55 + low*0.35);     // lateral lean, so it emerges to the back-SIDE, not straight up over the roof
  _d25fold(S, s.x, s.y+6, S.width*BS, S.height*BS, flat, shear, 0.28*(1-0.5*Math.min(1,night)));
}

/* Draw the cast shadow for a tree/foliage node. Same fold, tuned a touch shorter
   and fainter than a building's - a canopy shadow gets long and heavy fast, and
   forests overlap. `cx0`,`footY` are the trunk foot; `scale` matches the (slightly
   taller) sprite scale so the shadow tracks the canopy. */
function drawTreeCast(S, cx0, footY, scale){
  if(!S) return;
  const {low,dir,night}=_d25sun();
  const flat  = 0.60 + low*0.42;
  const shear = dir*(0.50 + low*0.34);
  _d25fold(S, cx0, footY, S.width*scale, S.height*scale, flat, shear, 0.20*(1-0.5*Math.min(1,night)));
}

/* ---- 2: parallax horizon, drawn on the backdrop before the ground ---- */
function depthHorizon(CLOUD){
  if(typeof inDungeon==='function' && inDungeon()) return;
  if(typeof G==='undefined' || G.interior) return;
  if(typeof VW==='undefined') return;
  const {col} = depthAtmo(CLOUD);
  if(CLOUD){
    // above the clouds: two banks of soft cirrus, far ones fainter & higher
    const white=[248,252,255];
    _d25cloudBank(VH*0.30, VH*0.045, 460, 0.05, 8101, _d25mix(white,col,0.35), 0.14);
    _d25cloudBank(VH*0.40, VH*0.070, 360, 0.11, 8102, white, 0.18);
    return;
  }
  // over the sea: distant hazy land. Aerial perspective makes far land LIGHTER
  // and bluer than near, so the silhouettes lean toward the sky colour, not to
  // black - they read as haze-washed coast, never as a hard cardboard cut-out.
  const land = _d25mix(col, [58,74,96], 0.42);   // muted blue-grey coast
  _d25band(VH*0.365, VH*0.050, 520, 0.05, 0.05, 4201, _d25mix(land,col,0.35), 0.42); // far range
  _d25band(VH*0.420, VH*0.078, 380, 0.11, 0.09, 4202, land,                  0.52); // nearer range
}
