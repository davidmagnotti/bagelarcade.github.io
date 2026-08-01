/* =====================================================================
   HIDEAWAYS  -  the relic verbs, earnable, plus hidden areas that use them.

     1. RELIC REWARD CHESTS (in dungeons). {bombgift} in the Ashen Forge,
        {lodegift} in the Undermaw - so Blast Charge and Lodestone are
        actually earnable in play, not just from the dev menu.

     2. CRACKWALL VAULTS (on the isles). A small natural nook - a dead-end a
        flood-fill proves seals a tiny, content-free area - has its neck
        walled by a fissured wall a Blast Charge opens; a loot chest inside.

     3. LODESTONE PLATE ROOMS (on the isles). Same nook, neck sealed by a
        plate-gate; out in the open sit a pressure plate and, one tile past
        it, an iron block, so a single Lodestone pull drags the block onto
        the plate and opens the neck to the loot.

   The hidden areas live on the isles (not in the tight, densely-connected
   dungeon interiors, which rarely have a sealable nook) - the classic loop:
   earn the tool in a dungeon, use it out in the world. Both reuse the proven
   "gate a flood-fill-verified pocket" method from the tool-gate side-caches,
   so they land wherever an isle has a nook and never block a route.

   Persistence: each loot chest carries a tgid; once looted the hideaway is
   skipped on regen. Relic chests skip once the verb is unlocked.
   ===================================================================== */
(function(){
'use strict';

var DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
var RELIC_CHESTS={ sunwarddeep:{flag:'bombgift', unlock:'bomb'}, undermaw:{flag:'lodegift', unlock:'lodestone'} };
// isle world id -> loot the hidden area holds
var CRACK_VAULTS={ main:'trove', east:'materials', reach:'trove', wind:'elixirs' };
var IRON_ROOMS ={ main:'elixirs', wind:'trove', frost:'materials', east:'trove' };

function strHash(s){ var h=2166136261>>>0; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function tg(){ P.story=P.story||{}; P.story.tg=P.story.tg||{}; return P.story.tg; }
function walkable(x,y){ return inb(x,y) && !solidAt(x,y) && walkTile(tileAt(x,y)); }
function occ(x,y){
  for(var i=0;i<G.nodes.length;i++){ if(G.nodes[i].tx===x&&G.nodes[i].ty===y) return true; }
  for(var j=0;j<G.decor.length;j++){ var b=G.decor[j]; if(Math.round(b.x-0.5)===x&&Math.round(b.y-0.5)===y) return true; }
  return false;
}
function spawnOf(id){ var d=WORLD_DEFS[id]; return d&&d.spawn ? [Math.round(d.spawn.x),Math.round(d.spawn.y)] : null; }

function floodSide(sx,sy,bx,by,cap){
  var seen={}, st=[[sx,sy]], out=[]; seen[sx+','+sy]=1;
  while(st.length){ var p=st.pop(); out.push(p);
    if(out.length>cap) return null;
    for(var k=0;k<4;k++){ var nx=p[0]+DIRS[k][0], ny=p[1]+DIRS[k][1];
      if(nx===bx&&ny===by) continue; if(!walkable(nx,ny)) continue;
      var key=nx+','+ny; if(seen[key]) continue; seen[key]=1; st.push([nx,ny]); } }
  return out;
}
function pocketClean(cells, spawn){
  var CRIT={house:1,house2:1,igloo:1,forge:1,barn:1,tower:1,resort:1,castle:1,windmill:1,waterwheel:1,
            boat:1,dungeonmouth:1,cavemouth:1,lairmouth:1,tombmouth:1,tunnelmouth:1,leappoint:1,ashwing:1,
            bazaar:1,well:1,chest:1,chestOpen:1,fastexit:1,crypt:1,signalbeacon:1};
  for(var i=0;i<cells.length;i++){ var x=cells[i][0], y=cells[i][1];
    if(spawn && x===spawn[0] && y===spawn[1]) return false;
    for(var n=0;n<G.npcs.length;n++){ if(Math.round(G.npcs[n].x)===x && Math.round(G.npcs[n].y)===y) return false; }
    for(var d=0;d<G.decor.length;d++){ var b=G.decor[d]; if(CRIT[b.kind] && Math.round(b.x-0.5)===x && Math.round(b.y-0.5)===y) return false; }
  }
  return true;
}
// scan near the isle's zones (and rock clusters) for a small enclosed nook
function findPocket(rng, spawn, used){
  var CAP=9, R=14;
  var zones=Object.keys(ZONES).map(function(k){return ZONES[k];}).filter(function(z){return z&&typeof z.x==='number';});
  var centers=[]; for(var zi=0;zi<zones.length;zi++) centers.push([Math.round(zones[zi].x),Math.round(zones[zi].y)]);
  for(var ni=0;ni<G.nodes.length;ni++){ if(G.nodes[ni].kind==='rock') centers.push([G.nodes[ni].tx,G.nodes[ni].ty]); }
  for(var s=centers.length-1;s>0;s--){ var jj=(rng()*(s+1))|0; var t=centers[s]; centers[s]=centers[jj]; centers[jj]=t; }
  for(var ci=0;ci<centers.length;ci++){ var C=centers[ci];
    for(var ry=-R;ry<=R;ry++) for(var rx=-R;rx<=R;rx++){
      var mx=C[0]+rx, my=C[1]+ry;
      if(!walkable(mx,my) || occ(mx,my)) continue;
      var tooClose=false; for(var u=0;u<used.length;u++){ if(Math.abs(used[u][0]-mx)+Math.abs(used[u][1]-my)<9){ tooClose=true; break; } }
      if(tooClose) continue;
      var wn=[]; for(var k=0;k<4;k++){ var ax=mx+DIRS[k][0], ay=my+DIRS[k][1]; if(walkable(ax,ay)) wn.push([ax,ay]); }
      if(wn.length<2) continue;
      for(var wi=0;wi<wn.length;wi++){
        var pocket=floodSide(wn[wi][0], wn[wi][1], mx, my, CAP);
        if(!pocket || pocket.length<1) continue;
        var inPk={}; for(var p=0;p<pocket.length;p++) inPk[pocket[p][0]+','+pocket[p][1]]=1;
        var hasOuter=false; for(var k2=0;k2<4;k2++){ var ox=mx+DIRS[k2][0], oy=my+DIRS[k2][1];
          if(walkable(ox,oy) && !inPk[ox+','+oy]){ hasOuter=true; break; } }
        if(!hasOuter) continue;
        if(!pocketClean(pocket, spawn)) continue;
        var best=null, bd=-1;
        for(var pp=0;pp<pocket.length;pp++){ var c=pocket[pp]; if(occ(c[0],c[1])) continue;
          var dd=Math.abs(c[0]-mx)+Math.abs(c[1]-my); if(dd>bd){ bd=dd; best=c; } }
        if(best) return { neck:[mx,my], cells:pocket, chest:best };
      }
    }
  }
  return null;
}
// A - Pl - B collinear open floor near the neck, for a one-pull block->plate.
// B (the block) must sit in open floor (>=3 walkable neighbours) so solidifying it is safe.
function findTrack(rng, neck, used, forbid){
  var R=9;
  for(var ry=-R;ry<=R;ry++) for(var rx=-R;rx<=R;rx++){
    var px=neck[0]+rx, py=neck[1]+ry;
    if(!walkable(px,py) || occ(px,py) || forbid[px+','+py]) continue;
    for(var k=0;k<2;k++){ var d=DIRS[k*2];
      var ax=px-d[0], ay=py-d[1], bx=px+d[0], by=py+d[1];
      if(!walkable(ax,ay) || !walkable(bx,by)) continue;
      if(occ(ax,ay)||occ(bx,by)||forbid[ax+','+ay]||forbid[bx+','+by]) continue;
      var open=0; for(var q=0;q<4;q++){ if(walkable(bx+DIRS[q][0],by+DIRS[q][1])) open++; }
      if(open<3) continue;
      return { A:[ax,ay], plate:[px,py], block:[bx,by] };
    }
  }
  return null;
}

/* ---- 1. relic reward chests (dungeons) ---- */
function placeRelicChest(id){
  var rc=RELIC_CHESTS[id]; if(!rc) return;
  if(P.unlocked && P.unlocked[rc.unlock]) return;
  if(tg()[id+':relic']) return;
  var sp=spawnOf(id); if(!sp) return;
  var pos=(typeof findOpenNear==='function' && (findOpenNear(sp[0]+4,sp[1]+4,10)||findOpenNear(sp[0]-4,sp[1]+3,10)||findOpenNear(sp[0],sp[1]+6,14)))||null;
  if(!pos) return;
  var o={kind:'chest', x:pos[0]+0.5, y:pos[1]+0.5, tgid:id+':relic'}; o[rc.flag]=1;
  G.decor.push(o);
}

/* ---- 2. crackwall vault ---- */
function placeCrackVault(id, loot, spawn, used){
  var gid=id+':crack'; if(tg()[gid+':loot']) return;
  var rng=mulberry32((SEED ^ strHash(gid))>>>0);
  var pk=findPocket(rng, spawn, used); if(!pk) return;
  used.push(pk.neck);
  setTile(pk.neck[0],pk.neck[1],T.RUIN); setSolid(pk.neck[0],pk.neck[1],1);
  G.decor.push({kind:'crackwall', x:pk.neck[0]+0.5, y:pk.neck[1]+0.5, tiles:[[pk.neck[0],pk.neck[1]]]});
  G.decor.push({kind:'chest', x:pk.chest[0]+0.5, y:pk.chest[1]+0.5, tgcache:loot, tgid:gid+':loot'});
}

/* ---- 3. lodestone plate room ---- */
function placeIronRoom(id, loot, spawn, used){
  var gid=id+':iron'; if(tg()[gid+':loot']) return;
  var rng=mulberry32((SEED ^ strHash(gid))>>>0);
  var pk=findPocket(rng, spawn, used); if(!pk) return;
  var forbid={}; forbid[pk.neck[0]+','+pk.neck[1]]=1; for(var i=0;i<pk.cells.length;i++) forbid[pk.cells[i][0]+','+pk.cells[i][1]]=1;
  var tr=findTrack(rng, pk.neck, used, forbid); if(!tr) return;
  used.push(pk.neck); used.push(tr.plate);
  setTile(pk.neck[0],pk.neck[1],T.RUIN); setSolid(pk.neck[0],pk.neck[1],1);
  G.decor.push({kind:'plate', x:tr.plate[0]+0.5, y:tr.plate[1]+0.5, gate:[[pk.neck[0],pk.neck[1]]]});
  G.decor.push({kind:'ironblock', x:tr.block[0]+0.5, y:tr.block[1]+0.5, bx:tr.block[0], by:tr.block[1]});
  setSolid(tr.block[0],tr.block[1],1);
  G.decor.push({kind:'chest', x:pk.chest[0]+0.5, y:pk.chest[1]+0.5, tgcache:loot, tgid:gid+':loot'});
}

function placeDungeonHideaways(id){
  try{
    placeRelicChest(id);
    var sp=spawnOf(id); var used=[];
    if(CRACK_VAULTS[id]) placeCrackVault(id, CRACK_VAULTS[id], sp, used);
    if(IRON_ROOMS[id])  placeIronRoom(id, IRON_ROOMS[id], sp, used);
    if(typeof invalidateScenery==='function') invalidateScenery();
  }catch(e){ try{ console.warn('placeDungeonHideaways failed', e); }catch(_){ } }
}

window.placeDungeonHideaways=placeDungeonHideaways;

})();
