/* =====================================================================
   TOOL-GATE CONTENT  -  actually places the tiered-tool gates in the world.

   Two kinds of placement, seeded once per fresh world-gen from switchWorld:

     1. SIDE-CACHES (optional, item rewards). A tiny 2-tile alcove is CARVED
        into terrain that was already solid, dead-ending at a reward chest,
        with its single mouth walled by an ironwood/basalt gate. Because the
        alcove is newly carved and dead-ends, gating it can NEVER block a
        through-route - no soft-lock is possible. This is the "side areas
        with items" the design calls for.

     2. TOOL-CHESTS. The two dungeon-forged tools themselves: a {pickgift}
        chest in the Undermaw (Barik) and a {axegift} chest in the
        Emberdeep (Mount Kea) - the mining/earth dungeons that fit them.
        (Now dead code - the tools are boss prizes; see BOSS_TOOL / awardDungeonTool.)

   Persistence: a felled gate (n.gid) and a looted chest (b.tgid) record
   into P.story.tg, which saves with P.story. On reload the world regen's,
   placeToolgates() runs again and skips anything already felled/looted, so
   opened caches stay open and taken tools stay taken.

   Placement is deterministic per (SEED, gid) so a cache lands in the same
   spot each regeneration.

   NOTE on "hard gates on main routes": the safe, verifiable version ships
   here as carved dead-end caches. A gate that walls a MANDATORY corridor
   needs a per-seed reachability check (the tool must be obtainable without
   passing the gate it unlocks) - authored per-site, not procedurally, and
   left as the next content step.
   ===================================================================== */
(function(){
'use strict';

// which caches live on which overworld isle. loot -> the openChest tgcache branch.
var TG_WORLDS={
  isle: [ {mat:'ironwood', gid:'isle:c0', loot:'charm'},
          {mat:'basalt',   gid:'isle:c1', loot:'trove'} ],
  main: [ {mat:'ironwood', gid:'main:c0', loot:'materials'},
          {mat:'basalt',   gid:'main:c1', loot:'elixirs'},
          {mat:'ironwood', gid:'main:c2', loot:'default'} ],
  east: [ {mat:'basalt',   gid:'east:c0', loot:'trove'},
          {mat:'ironwood', gid:'east:c1', loot:'default'} ],
  wind: [ {mat:'ironwood', gid:'wind:c0', loot:'elixirs'},
          {mat:'basalt',   gid:'wind:c1', loot:'materials'} ],
  reach:[ {mat:'basalt',   gid:'reach:c0', loot:'trove'},
          {mat:'ironwood', gid:'reach:c1', loot:'default'} ],
  frost:[ {mat:'basalt',   gid:'frost:c0', loot:'materials'},
          {mat:'ironwood', gid:'frost:c1', loot:'elixirs'} ],
  aerie:[ {mat:'basalt',   gid:'aerie:c0', loot:'trove'},
          {mat:'ironwood', gid:'aerie:c1', loot:'default'} ],
  crown:[ {mat:'basalt',   gid:'crown:c0', loot:'elixirs'},
          {mat:'ironwood', gid:'crown:c1', loot:'materials'} ]
};
// the two tools themselves, each in a fitting dungeon
var TG_TOOLCHEST={ undermaw:{flag:'pickgift', tier:'pick'}, eastdeep:{flag:'axegift', tier:'axe'} };

function strHash(s){ var h=2166136261>>>0; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function tg(){ P.story=P.story||{}; P.story.tg=P.story.tg||{}; return P.story.tg; }

var DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
// currently impassable, and not water (so we carve into a hill/wall/forest/ruin, never the
// sea - a diver could slip in from water, so water never counts as a sealing wall).
function blockedLand(x,y){
  if(!inb(x,y)) return true;                 // the map edge is as good as a wall
  var t=tileAt(x,y);
  if(t===T.DEEP || t===T.SHALLOW) return false;
  return solidAt(x,y) || !walkTile(t);
}
// a walker cannot pass this tile - solid, water, non-walk land, or the map edge. Used to
// confirm the back of the alcove is sealed so the gate is the only way in. (Water counts:
// a walker can't cross it. A late-game diver slipping into an optional cache is acceptable.)
function sealWall(x,y){
  if(!inb(x,y)) return true;
  if(solidAt(x,y)) return true;
  var t=tileAt(x,y);
  return t===T.DEEP || t===T.SHALLOW || !walkTile(t);
}
function occupied(x,y){
  for(var i=0;i<G.nodes.length;i++){ if(G.nodes[i].tx===x && G.nodes[i].ty===y) return true; }
  for(var j=0;j<G.decor.length;j++){ var b=G.decor[j]; if(Math.round(b.x-0.5)===x && Math.round(b.y-0.5)===y) return true; }
  return false;
}
// A place to carve a 2-tile dead-end alcove into solid land, sealed on all sides but the
// mouth. Thorough deterministic scan of each zone's neighbourhood (row-major), zone order
// shuffled by the per-cache rng so different caches pick different corners. `used` avoids
// clustering two caches together. Returns {c:[x,y] approach, d:[dx,dy] into the alcove}.
function findCarveSpot(rng, zones, used){
  var centers=[];
  for(var zi=0;zi<zones.length;zi++){ var z=zones[zi]; centers.push([Math.round(z.x),Math.round(z.y)]); }
  // rock/stone nodes cluster against the solid masses (ruins, highlands, volcano) - exactly
  // where 2-deep carveable land lives, so they make good extra scan anchors.
  for(var ni=0;ni<G.nodes.length;ni++){ var nn=G.nodes[ni]; if(nn.kind==='rock'){ centers.push([nn.tx,nn.ty]); } }
  for(var s=centers.length-1;s>0;s--){ var jj=(rng()*(s+1))|0; var tmp=centers[s]; centers[s]=centers[jj]; centers[jj]=tmp; }
  var R=13;
  for(var ci=0;ci<centers.length;ci++){ var C=centers[ci];
    for(var ry=-R;ry<=R;ry++) for(var rx=-R;rx<=R;rx++){
      var cx=C[0]+rx, cy=C[1]+ry;
      if(!inb(cx,cy) || !walkTile(tileAt(cx,cy)) || solidAt(cx,cy) || occupied(cx,cy)) continue;
      var tooClose=false;
      for(var u=0;u<used.length;u++){ if(Math.abs(used[u][0]-cx)+Math.abs(used[u][1]-cy)<6){ tooClose=true; break; } }
      if(tooClose) continue;
      for(var k=0;k<4;k++){ var d=DIRS[k];
        var mx=cx+d[0], my=cy+d[1], ex=cx+2*d[0], ey=cy+2*d[1];
        if(!inb(mx,my)||!inb(ex,ey)) continue;
        if(!(blockedLand(mx,my) && blockedLand(ex,ey))) continue;
        if(occupied(mx,my) || occupied(ex,ey)) continue;
        var sealed=true;
        for(var q=0;q<4;q++){ var nd=DIRS[q];
          if(nd[0]===-d[0] && nd[1]===-d[1]) continue;      // faces the mouth
          if(!sealWall(ex+nd[0], ey+nd[1])){ sealed=false; break; }
        }
        if(sealed) return {c:[cx,cy], d:d};
      }
    }
  }
  return null;
}

// ---- natural-pocket gating (primary strategy) ----
function walkable(x,y){ return inb(x,y) && !solidAt(x,y) && walkTile(tileAt(x,y)); }
// flood the component reachable from (sx,sy) WITHOUT crossing (bx,by), stopping early once
// it exceeds `cap`. A small result means (bx,by) is the component's only link outward.
function floodSide(sx,sy,bx,by,cap){
  var seen={}, stack=[[sx,sy]], out=[]; seen[sx+','+sy]=1;
  while(stack.length){
    var p=stack.pop(); out.push(p);
    if(out.length>cap) return null;                 // too big - not an enclosed pocket
    for(var k=0;k<4;k++){ var nx=p[0]+DIRS[k][0], ny=p[1]+DIRS[k][1];
      if(nx===bx && ny===by) continue;
      if(!walkable(nx,ny)) continue;
      var key=nx+','+ny; if(seen[key]) continue; seen[key]=1; stack.push([nx,ny]);
    }
  }
  return out;
}
// nothing story-critical may be sealed inside a pocket: no spawn tile, NPC, or building/portal.
function pocketClean(cells, spawn){
  var CRIT={house:1,house2:1,igloo:1,forge:1,barn:1,tower:1,resort:1,castle:1,windmill:1,waterwheel:1,
            boat:1,dungeonmouth:1,cavemouth:1,lairmouth:1,tombmouth:1,tunnelmouth:1,leappoint:1,ashwing:1,
            bazaar:1,well:1,chest:1,chestOpen:1,fastexit:1,crypt:1,signalbeacon:1};
  for(var i=0;i<cells.length;i++){ var x=cells[i][0], y=cells[i][1];
    if(spawn && x===Math.round(spawn.x) && y===Math.round(spawn.y)) return false;
    for(var n=0;n<G.npcs.length;n++){ if(Math.round(G.npcs[n].x)===x && Math.round(G.npcs[n].y)===y) return false; }
    for(var d=0;d<G.decor.length;d++){ var b=G.decor[d]; if(CRIT[b.kind] && Math.round(b.x-0.5)===x && Math.round(b.y-0.5)===y) return false; }
  }
  return true;
}
// find a neck tile whose inner side is a small, clean, enclosed pocket. Returns
// {gate:[x,y] the neck, chest:[x,y] deepest pocket tile}.
function findPocketGate(rng, zones, used, spawn){
  var CAP=10;
  var centers=[];
  for(var zi=0;zi<zones.length;zi++) centers.push([Math.round(zones[zi].x),Math.round(zones[zi].y)]);
  for(var ni=0;ni<G.nodes.length;ni++){ if(G.nodes[ni].kind==='rock') centers.push([G.nodes[ni].tx,G.nodes[ni].ty]); }
  for(var s=centers.length-1;s>0;s--){ var jj=(rng()*(s+1))|0; var tmp=centers[s]; centers[s]=centers[jj]; centers[jj]=tmp; }
  var R=14;
  for(var ci=0;ci<centers.length;ci++){ var C=centers[ci];
    for(var ry=-R;ry<=R;ry++) for(var rx=-R;rx<=R;rx++){
      var mx=C[0]+rx, my=C[1]+ry;
      if(!walkable(mx,my) || occupied(mx,my)) continue;
      var tooClose=false; for(var u=0;u<used.length;u++){ if(Math.abs(used[u][0]-mx)+Math.abs(used[u][1]-my)<7){ tooClose=true; break; } }
      if(tooClose) continue;
      // the neck needs an inner (pocket) side and an outer (world) side
      var wn=[]; for(var k=0;k<4;k++){ var ax=mx+DIRS[k][0], ay=my+DIRS[k][1]; if(walkable(ax,ay)) wn.push([ax,ay]); }
      if(wn.length<2) continue;
      for(var wi=0;wi<wn.length;wi++){
        var pocket=floodSide(wn[wi][0], wn[wi][1], mx, my, CAP);
        if(!pocket || pocket.length<2) continue;                 // too big, or too tiny
        // there must be a genuine OUTER side too (a walkable neighbour not in the pocket)
        var hasOuter=false, inPk={}; for(var pc=0;pc<pocket.length;pc++) inPk[pocket[pc][0]+','+pocket[pc][1]]=1;
        for(var k2=0;k2<4;k2++){ var ox=mx+DIRS[k2][0], oy=my+DIRS[k2][1];
          if(walkable(ox,oy) && !inPk[ox+','+oy]){ hasOuter=true; break; } }
        if(!hasOuter) continue;
        if(!pocketClean(pocket, spawn)) continue;
        // deepest clean, empty pocket tile for the chest
        var best=null, bestd=-1;
        for(var pc2=0;pc2<pocket.length;pc2++){ var t=pocket[pc2];
          if(occupied(t[0],t[1])) continue;
          var dd=Math.abs(t[0]-mx)+Math.abs(t[1]-my);
          if(dd>bestd){ bestd=dd; best=t; }
        }
        if(best) return { gate:[mx,my], chest:best };
      }
    }
  }
  return null;
}

function placeCache(ca, zones, used){
  var t=tg();
  if(t[ca.gid+':loot']) return;                       // fully done (looted) - nothing to place
  var felled=!!t[ca.gid];                             // gate already cut - leave the way open
  var rng=mulberry32((SEED ^ strHash(ca.gid))>>>0);
  if(!zones.length) return;
  var spawn=(WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].spawn) || null;
  // PRIMARY: gate a natural enclosed pocket (a peninsula/nook) - a real side area.
  var pk=findPocketGate(rng, zones, used, spawn);
  if(pk){
    used.push(pk.gate);
    G.decor.push({kind:'chest', x:pk.chest[0]+0.5, y:pk.chest[1]+0.5, tgcache:ca.loot, tgid:ca.gid+':loot'});
    if(!felled && typeof addGateNode==='function'){ var g=addGateNode(ca.mat, pk.gate[0], pk.gate[1]); if(g) g.gid=ca.gid; }
    return;
  }
  // FALLBACK: carve a 2-tile dead-end alcove into a solid mass.
  var spot=findCarveSpot(rng, zones, used); if(!spot) return;
  used.push(spot.c);
  var c=spot.c, d=spot.d;
  var m=[c[0]+d[0], c[1]+d[1]], e=[c[0]+2*d[0], c[1]+2*d[1]];
  setTile(m[0],m[1],T.RUIN); setSolid(m[0],m[1],0);
  setTile(e[0],e[1],T.RUIN); setSolid(e[0],e[1],0);
  G.decor.push({kind:'chest', x:e[0]+0.5, y:e[1]+0.5, tgcache:ca.loot, tgid:ca.gid+':loot'});
  if(!felled && typeof addGateNode==='function'){
    var g2=addGateNode(ca.mat, m[0], m[1]); if(g2) g2.gid=ca.gid;
  }
}

function placeToolChest(id, tc){
  var t=tg();
  if(t[id+':toolchest']) return;                      // already taken
  if((P.tools && P.tools[tc.tier] || 0) >= 2) return; // already own the tier-2 tool
  var def=WORLD_DEFS[id]; if(!def || !def.spawn) return;
  var sx=Math.round(def.spawn.x), sy=Math.round(def.spawn.y);
  // deep in the dungeon, never at the entrance (see deepDungeonSpot in 37-dungeon-hideaways.js)
  var pos=(typeof deepDungeonSpot==='function' && deepDungeonSpot([sx,sy], id+':tool'))
        || (typeof findOpenNear==='function' && findOpenNear(sx,sy+8,14)) || null;
  if(!pos) return;
  var o={kind:'chest', x:pos[0]+0.5, y:pos[1]+0.5, tgid:id+':toolchest'};
  o[tc.flag]=1;
  G.decor.push(o);
}

function placeToolgates(id){
  try{
    var caches=TG_WORLDS[id];
    if(caches){
      var zones=Object.keys(ZONES).map(function(k){return ZONES[k];}).filter(function(z){return z&&typeof z.x==='number';});
      var used=[];
      for(var i=0;i<caches.length;i++) placeCache(caches[i], zones, used);
    }
    // (the tier-2 tools are now BOSS PRIZES - see awardDungeonTool in 37-dungeon-hideaways.js)
    if(typeof invalidateScenery==='function') invalidateScenery();
  }catch(e){ try{ console.warn('placeToolgates failed', e); }catch(_){ } }
}

window.placeToolgates=placeToolgates;

})();
