"use strict";
/* =====================================================================
   ATMOSPHERE LAYER  -  ground-plane lighting, grounding & terrain break-up
   -----------------------------------------------------------------------
   The world already carries a rich NIGHT lighting rig (drawLighting +
   the warm additive lamp halos in render()), depth-graded sea, cliffs,
   fringe-blended tiles, chimney smoke and idle motion. What it lacked was
   anything cast on the ground BY DAY: hearths burn inside every house
   around the clock, yet in daylight the grass outside read as flat and
   uniformly lit. This layer fills exactly that gap - and only that gap -
   as three cheap ground-plane passes drawn between the tile pass and the
   depth-sorted actors, so pools and stains sit UNDER the buildings and
   people that stand on them:

     1. WARM HEARTH LIGHT  - a soft amber pool (plus a brighter window
        spill toward the camera) cast on the ground around houses/forges/
        towers. Strong by day, then TAPERS as dusk falls - exactly where
        the existing night rig takes over - so night is never doubled.
     2. CONTACT AO         - a tight, dark core right in the crease where a
        wall meets the ground, nestling buildings into the terrain.
     3. TERRAIN BREAK-UP   - deterministic scatter (dirt patches, fallen
        leaves, pebbles, the odd puddle) plus field-wide swaying grass
        blades, so grass reads as ground, not a tilemap.

   Everything is stateless (derived from tile/decor position + G.time) so
   it costs no particle/decal budget, rides the elevation lift, and is
   drawn full-detail only - the LOWFX path bakes the ground into a cache
   and is deliberately left untouched.
   ===================================================================== */

/* buildings that own a hearth/forge fire and should cast warm light + AO */
const ATMO_LIT = { house:1, house2:1, forge:1, tower:1, barn:1, hut:1, stormhut:1, igloo:0 };
/* per-kind warm-pool tuning: [radiusPx, dayIntensity, hotConst] */
const ATMO_GLOW = {
  house:  [46, 0.060, 0.00],
  house2: [46, 0.060, 0.00],
  barn:   [50, 0.045, 0.00],
  hut:    [40, 0.055, 0.00],
  stormhut:[38, 0.048, 0.00],
  tower:  [40, 0.045, 0.00],
  forge:  [58, 0.075, 0.06],   // the forge glows hot even at noon
};

function _atmoHash(x,y){ return (Math.imul(x|0,73856093) ^ Math.imul(y|0,19349663)) >>> 0; }

/* ---- 1 & 2: warm hearth light + contact AO, cast on the ground ---- */
function atmoBuildings(minX,maxX,minY,maxY,EL){
  const night = (typeof nightAmount==='function') ? nightAmount() : 0;
  // by day the world outside gets no warm cast; fade OUT as the night rig
  // (drawLighting + additive halos in render) lights up the same emitters.
  const dayFade = 1 - 0.78*Math.min(1,night);
  const g = cx;
  for(const b of G.decor){
    if(!ATMO_LIT[b.kind]) continue;
    if(b.x<minX-6||b.x>maxX+6||b.y<minY-6||b.y>maxY+6) continue;
    const s = worldToScreen(b.x,b.y);
    let by = s.y;
    if(EL && typeof groundLiftAt==='function') by -= groundLiftAt(b.x,b.y);
    if(s.x<-140||s.x>VW+140||by<-160||by>VH+180) continue;

    // -- contact AO: a tight dark core where the wall footings meet the soil
    const aoR = b.kind==='forge'||b.kind==='barn' ? 26 : 22;
    const ao = g.createRadialGradient(s.x, by-1, 2, s.x, by-1, aoR);
    ao.addColorStop(0, 'rgba(18,12,6,0.30)');
    ao.addColorStop(0.6, 'rgba(18,12,6,0.14)');
    ao.addColorStop(1, 'rgba(18,12,6,0)');
    g.save();
    g.translate(s.x, by-1); g.scale(1, 0.42); g.translate(-s.x, -(by-1));
    g.fillStyle = ao; g.beginPath(); g.arc(s.x, by-1, aoR, 0, TAU); g.fill();
    g.restore();

    // -- warm hearth pool cast onto the grass (day-forward; tapers at night)
    const tune = ATMO_GLOW[b.kind] || ATMO_GLOW.house;
    const flick = 0.94 + 0.06*Math.sin(G.time*(b.kind==='forge'?6.5:3.1) + b.x*1.7 + b.y*0.9);
    let amt = (tune[1]*dayFade + tune[2]) * flick;   // hot const (forge) survives full daylight
    if(amt > 0.004){
      const R = tune[0]*flick;
      g.globalCompositeOperation = 'lighter';
      // the broad pool the hearth throws all around the base
      const pg = g.createRadialGradient(s.x, by-4, 3, s.x, by-4, R);
      pg.addColorStop(0, 'rgba(255,196,110,'+(amt).toFixed(3)+')');
      pg.addColorStop(0.5, 'rgba(255,166,84,'+(amt*0.5).toFixed(3)+')');
      pg.addColorStop(1, 'rgba(255,150,60,0)');
      g.save();
      g.translate(s.x, by-4); g.scale(1, 0.5); g.translate(-s.x, -(by-4));
      g.fillStyle = pg; g.beginPath(); g.arc(s.x, by-4, R, 0, TAU); g.fill();
      g.restore();
      // a brighter window/door spill splashing forward onto the ground the
      // camera sees (south / down-screen), so the light reads as CAST, not a halo
      const sr = R*0.62, sy = by + 8;
      const sg = g.createRadialGradient(s.x, sy, 2, s.x, sy, sr);
      sg.addColorStop(0, 'rgba(255,210,130,'+(amt*1.15).toFixed(3)+')');
      sg.addColorStop(1, 'rgba(255,180,90,0)');
      g.save();
      g.translate(s.x, sy); g.scale(1, 0.5); g.translate(-s.x, -sy);
      g.fillStyle = sg; g.beginPath(); g.arc(s.x, sy, sr, 0, TAU); g.fill();
      g.restore();
      g.globalCompositeOperation = 'source-over';
    }
  }
}

/* ---- 3: terrain break-up - scatter decals + swaying grass blades ---- */
const _ATMO_LAND = { 2:1, 3:1, 4:1, 6:1, 7:1 };   // SAND, GRASS, FOREST, PATH, SOIL
function atmoTerrain(minX,maxX,minY,maxY,EL){
  const g = cx;
  const y0 = Math.max(0, minY), y1 = Math.min(MAPH-1, maxY);
  const x0 = Math.max(0, minX), x1 = Math.min(MAPW-1, maxX);
  const lift = EL && typeof groundLiftAt==='function';
  for(let y=y0; y<=y1; y++){
    for(let x=x0; x<=x1; x++){
      const t = tileAt(x,y);
      if(!_ATMO_LAND[t]) continue;
      const h = _atmoHash(x,y);
      if((h % 1000) >= 300) continue;                 // ~30% of land tiles carry something
      // where on the tile the scatter sits (kept off the diamond's very edge)
      const fx = x + 0.22 + ((h>>>3)&7)/9.5;
      const fy = y + 0.22 + ((h>>>7)&7)/9.5;
      const sc = worldToScreen(fx,fy);
      let py = sc.y; if(lift) py -= groundLiftAt(fx,fy);
      const px = sc.x;
      const kind = (h>>>11) % 12;
      const rot = ((h>>>17)&15)/15 * TAU;
      const sz  = 2.4 + ((h>>>21)&7)*0.55;

      if((t===T.GRASS||t===T.FOREST) && kind < 3){
        // swaying grass blades - field-wide ground motion, not just placed tufts
        const sway = Math.sin(G.time*1.6 + (h&255)*0.049) * 2.0;
        g.strokeStyle = t===T.FOREST ? 'rgba(74,104,58,0.5)' : 'rgba(96,132,64,0.5)';
        g.lineWidth = 1.1; g.lineCap='round';
        g.beginPath();
        for(let i=-1;i<=1;i++){
          const bx = px + i*2.3;
          g.moveTo(bx, py);
          g.quadraticCurveTo(bx+sway*0.5, py-4, bx+sway, py-7.5-Math.abs(i));
        }
        g.stroke(); g.lineCap='butt';
      } else if(kind < 6){
        // a scuff of bare earth showing through the turf
        const dc = t===T.SAND ? 'rgba(150,124,80,'  :
                   t===T.FOREST? 'rgba(58,44,28,'    :
                   t===T.SOIL  ? 'rgba(74,54,34,'    :
                   t===T.PATH  ? 'rgba(96,80,56,'    : 'rgba(78,60,38,';
        g.fillStyle = dc + (t===T.SAND?0.16:0.20) + ')';
        g.save(); g.translate(px,py); g.rotate(rot); g.scale(1,0.5);
        g.beginPath(); g.ellipse(0,0, sz+1.4, sz, 0, 0, TAU); g.fill();
        g.restore();
      } else if(kind < 9){
        // fallen leaves / dry litter - a few small specks
        const cols = t===T.SAND ? ['rgba(196,170,120,0.6)','rgba(170,142,92,0.55)']
                                 : ['rgba(150,120,60,0.6)','rgba(110,140,66,0.55)','rgba(176,96,52,0.5)'];
        for(let i=0;i<3;i++){
          const a = rot + i*2.2, r = 1.6+i*1.4;
          g.fillStyle = cols[(h>>>(i+2))%cols.length];
          g.save(); g.translate(px+Math.cos(a)*r, py+Math.sin(a)*r*0.5); g.rotate(a);
          g.fillRect(-1.5,-0.9,3,1.8);
          g.restore();
        }
      } else if(kind < 11){
        // a pebble catching a touch of skylight
        g.fillStyle='rgba(112,108,100,0.45)';
        g.save(); g.translate(px,py); g.scale(1,0.55);
        g.beginPath(); g.arc(0,0, sz*0.6, 0, TAU); g.fill();
        g.fillStyle='rgba(226,224,214,0.35)';
        g.beginPath(); g.arc(-sz*0.18,-sz*0.16, sz*0.24, 0, TAU); g.fill();
        g.restore();
      } else if(t!==T.SAND){
        // a shallow puddle - cool, low, with a bright wind-riffled rim and a
        // faint sky reflection. Rare (kind===11) so it stays a treat.
        const rr = sz+2;
        g.save(); g.translate(px,py); g.scale(1,0.42);
        const pud = g.createRadialGradient(0,0,1,0,0,rr);
        pud.addColorStop(0,'rgba(66,92,116,0.30)');
        pud.addColorStop(0.7,'rgba(74,98,120,0.20)');
        pud.addColorStop(1,'rgba(74,98,120,0)');
        g.fillStyle=pud; g.beginPath(); g.arc(0,0,rr,0,TAU); g.fill();
        // sky glint riffling in the breeze
        g.fillStyle='rgba(206,224,238,'+(0.16+0.06*Math.sin(G.time*2.2+h)).toFixed(3)+')';
        g.beginPath(); g.ellipse(-rr*0.18,-rr*0.2, rr*0.5, rr*0.16, 0, 0, TAU); g.fill();
        g.restore();
      }
    }
  }
}

/* ground-plane atmosphere pass, called from render() between the tile pass
   and the depth-sorted actors. Full-detail surface worlds only. */
function atmoGround(minX,maxX,minY,maxY,EL){
  if(LOWFX) return;                                   // LOWFX bakes the ground - leave it be
  if(typeof inDungeon==='function' && inDungeon()) return;
  if(G.interior) return;
  const cloud = !!(typeof WORLD_DEFS!=='undefined' && WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].cloud);
  if(!cloud && fxOn('decals')) atmoTerrain(minX,maxX,minY,maxY,EL);   // scatter rides the decals toggle
  atmoBuildings(minX,maxX,minY,maxY,EL);
}

window.atmoGround = atmoGround;
