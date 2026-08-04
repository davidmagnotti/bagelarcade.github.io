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
