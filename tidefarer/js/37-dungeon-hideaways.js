/* =====================================================================
   HIDEAWAYS  -  gated-nook loot rooms on the isles, each opened by one of
   the tiered gathering picks (the classic loop: earn the pick in a dungeon,
   use it out in the world).

     1. EMBERSTONE GATE ROOMS (on the isles). A small natural nook - a
        dead-end a flood-fill proves seals a tiny, content-free area - has
        its neck sealed by a molten emberstone block, an ordinary gated rock
        the tier-4 Emberbreaker Pick mines through (chop/mine prompt, exactly
        like a tree or basalt); a loot chest inside.

     2. SLAGIRON GATE ROOMS (on the isles). Same nook, neck sealed by a
        rust-red slagiron block - an ordinary gated rock the tier-3 Cograzor
        Pick mines through, opening the neck to the loot.

   Both reuse the proven "gate a flood-fill-verified pocket" method from the
   tool-gate side-caches, so they land wherever an isle has a nook and never
   block a route.

   Persistence: each loot chest carries a tgid; once looted the hideaway is
   skipped on regen. A felled gate (n.gid) records under P.story.tg so an
   opened nook stays open.
   ===================================================================== */
(function(){
'use strict';

var DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
// isle world id -> loot the hidden area holds
var EMBER_ROOMS={ east:'materials', reach:'trove', wind:'elixirs' };
var SLAG_ROOMS ={ main:'elixirs', wind:'trove', frost:'materials', east:'trove' };

function strHash(s){ var h=2166136261>>>0; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function tg(){ P.story=P.story||{}; P.story.tg=P.story.tg||{}; return P.story.tg; }
function walkable(x,y){ return inb(x,y) && !solidAt(x,y) && walkTile(tileAt(x,y)); }
function occ(x,y){
  for(var i=0;i<G.nodes.length;i++){ if(G.nodes[i].tx===x&&G.nodes[i].ty===y) return true; }
  for(var j=0;j<G.decor.length;j++){ var b=G.decor[j]; if(Math.round(b.x-0.5)===x&&Math.round(b.y-0.5)===y) return true; }
  return false;
}
function spawnOf(id){ var d=WORLD_DEFS[id]; return d&&d.spawn ? [Math.round(d.spawn.x),Math.round(d.spawn.y)] : null; }
function nearChest(x,y,r){
  for(var i=0;i<G.decor.length;i++){ var b=G.decor[i];
    if((b.kind==='chest'||b.kind==='chestOpen') && Math.abs(Math.round(b.x-0.5)-x)+Math.abs(Math.round(b.y-0.5)-y)<=r) return true; }
  return false;
}
// A reward tile DEEP in the dungeon - never at the entrance. BFS from the spawn, then
// pick (seeded by salt, so multiple chests spread out) among the far half of the floor,
// avoiding tiles that already hold a chest so two prizes never stack at the door.
function deepDungeonSpot(spawn, salt){
  if(!spawn) return null;
  var sx=spawn[0], sy=spawn[1];
  if(!walkable(sx,sy)){ var op=(typeof findOpenNear==='function') && findOpenNear(sx,sy,10); if(op){ sx=op[0]; sy=op[1]; } else return null; }
  var seen={}, q=[[sx,sy,0]], head=0, tiles=[], maxD=0;
  seen[sx+','+sy]=1;
  while(head<q.length){ var cur=q[head++]; tiles.push(cur); if(cur[2]>maxD) maxD=cur[2];
    for(var k=0;k<4;k++){ var nx=cur[0]+DIRS[k][0], ny=cur[1]+DIRS[k][1], key=nx+','+ny;
      if(seen[key] || !walkable(nx,ny)) continue; seen[key]=1; q.push([nx,ny,cur[2]+1]); } }
  function pool(minFrac, chestGap){
    var out=[], thr=Math.max(6, maxD*minFrac);
    for(var i=0;i<tiles.length;i++){ var t=tiles[i];
      if(t[2]>=thr && !occ(t[0],t[1]) && !nearChest(t[0],t[1],chestGap)) out.push(t); }
    return out;
  }
  var deep=pool(0.55,5); if(!deep.length) deep=pool(0.35,4); if(!deep.length) deep=pool(0.2,2);
  if(!deep.length) return null;
  var rng=mulberry32((SEED ^ strHash(salt||'d'))>>>0);
  var pick=deep[(rng()*deep.length)|0];
  return [pick[0], pick[1]];
}

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
/* ---- a gated-nook loot room: seal the pocket's neck with an ordinary gated
   rock (mat) that the matching pick mines through, exactly like any tree/basalt
   (chop/mine prompt). Same pocket + P.story.tg persistence as the tool-gate
   side-caches (a felled gate records under its gid; a looted chest under
   gid+':loot'), so opened rooms stay open across save/reload. ---- */
function placeGateRoom(mat, gid, loot, spawn, used){
  var t=tg();
  if(t[gid+':loot']) return;                  // already looted - nothing to place
  var felled=!!t[gid];                         // gate already mined - leave the neck open
  var rng=mulberry32((SEED ^ strHash(gid))>>>0);
  var pk=findPocket(rng, spawn, used); if(!pk) return;
  used.push(pk.neck);
  G.decor.push({kind:'chest', x:pk.chest[0]+0.5, y:pk.chest[1]+0.5, tgcache:loot, tgid:gid+':loot'});
  if(!felled && typeof addGateNode==='function'){
    var g=addGateNode(mat, pk.neck[0], pk.neck[1]); if(g){ g.gid=gid; g.ward=1; }
    // widen the seal so a 1-tile gate can't be walked around: wall the walkable tiles flanking
    // the neck (perpendicular to the pocket passage) with the same gate. They share the gid and
    // ward flag, so mining ANY one shatters the whole barrier - up to 3 tiles wide.
    var ddx=pk.chest[0]-pk.neck[0], ddy=pk.chest[1]-pk.neck[1];
    var perp = (Math.abs(ddx)>=Math.abs(ddy)) ? [[0,1],[0,-1]] : [[1,0],[-1,0]];
    for(var pf=0; pf<perp.length; pf++){ var fx=pk.neck[0]+perp[pf][0], fy=pk.neck[1]+perp[pf][1];
      if(walkable(fx,fy) && !occ(fx,fy)){ var gf=addGateNode(mat, fx, fy); if(gf){ gf.gid=gid; gf.ward=1; } } }
  }
}

function placeDungeonHideaways(id){
  try{
    var sp=spawnOf(id); var used=[];
    // gid kept as ':crack' so nooks a returning player already opened (with the
    // old Blast Charge, before it became the Emberbreaker Pick) stay looted.
    if(EMBER_ROOMS[id]) placeGateRoom('emberstone', id+':crack', EMBER_ROOMS[id], sp, used);
    if(SLAG_ROOMS[id])  placeGateRoom('slagiron',   id+':slag',  SLAG_ROOMS[id],  sp, used);
    if(typeof invalidateScenery==='function') invalidateScenery();
  }catch(e){ try{ console.warn('placeDungeonHideaways failed', e); }catch(_){ } }
}

/* ---- the four dungeon tools are BOSS PRIZES: one per dungeon, dropped when the
        dungeon's marquee boss falls (hooked from killMob in 09-gameplay.js).
        Each has its "use it here" example already in the world:
          Cragbreaker Pick (Undermaw / Maw-Stalker)     -> basalt gates (isles; the Barik farm)
          Rivenedge Axe    (Emberdeep / Ashwing)         -> ironwood gates (isles)
          Cograzor Pick    (Undermill / Cog-Bound)      -> slagiron gate rooms (isles)
          Emberbreaker Pick(Ashen Forge / Cinderwrought)-> emberstone gate rooms (isles)
   (Undermaw and Emberdeep swapped prizes: the Undermaw now forges the purple-basalt PICK.)
---- */
var BOSS_TOOL={
  undermaw:    {flag:'pickgift',  spot:[22,4], have:function(){return (P.tools&&P.tools.pick||0)>=2;},  is:function(m){return !!m.undermawBeast;}},
  eastdeep:    {flag:'axegift',   have:function(){return (P.tools&&P.tools.axe||0)>=2;},   is:function(m){return m.kind==='dragon';}},
  sunwarddeep: {flag:'embergift', have:function(){return (P.tools&&P.tools.pick||0)>=4;}, is:function(m){return !!(m.gateboss && m.gateDone==='ashenForgeDone');}},
  milldeep:    {flag:'slaggift',  have:function(){return (P.tools&&P.tools.pick||0)>=3;}, is:function(m){return !!m.millboss;}}
};
// The boss drops its prize as a CHEST where it falls - you go to it, open it (get the
// prize), then climb out. (Not a silent grant; the "get prize, then climb out" flow.)
function awardDungeonTool(m){
  try{
    var t=BOSS_TOOL[G.worldId]; if(!t || !m || !t.is(m) || t.have()) return;
    if(G.decor.some(function(d){return d[t.flag];})) return;   // already dropped
    // most dungeons drop the prize where the boss falls; a dungeon with a fixed reward-room `spot`
    // (the Undermaw's Deep Hoard) drops it there instead, so the chest lands in the hoard, not the den.
    var pos=t.spot || ((typeof findOpenNear==='function' && findOpenNear(Math.round(m.x),Math.round(m.y),6)) || [Math.round(m.x),Math.round(m.y)]);
    var o={kind:'chest', x:pos[0]+0.5, y:pos[1]+0.5}; o[t.flag]=1;
    G.decor.push(o);
    // The Undermaw's single prize is the Cragbreaker Pick (pickgift): it splits the violet
    // basalt AND shatters Vath's Hedda-ward (any pick tier >= 2 does), so the whole
    // Barik loop - rumour -> Undermaw -> break the ward -> Hedda - stays inside Barik.
    if(typeof invalidateScenery==='function') invalidateScenery();
  }catch(e){}
}

window.placeDungeonHideaways=placeDungeonHideaways;
window.deepDungeonSpot=deepDungeonSpot;
window.awardDungeonTool=awardDungeonTool;

})();
