/* =====================================================================
   THE HEDDA-WARD  -  Vath's violet wardstone, cutting Barik off from itself.

   An AUTHORED story gate (the kind 35-toolgate-content.js flags as "the next
   content step"): a WALL of bright-violet WARDSTONE seals off the whole
   southeast shoulder of Barik - Farmer Hedda's steading, the causeway, AND
   Captain Corvo's cove with his sloop - so you can see it all but reach none
   of it until you carry a dungeon-forged pickaxe. The Undermaw drops that pick
   (the Cragbreaker), so the whole loop stays inside Barik: hear the rumour ->
   take the Undermaw -> shatter the ward -> reach Hedda and Corvo. Because the
   only way to sail east (Corvo's sloop -> the Sunward Isle) runs through this
   walled corner, Chapter III itself is gated behind clearing the Undermaw.
   (Sailing home from Sunward is always safe: you must break the ward to reach
   Corvo in the first place, so it is already down before any return.)

   Placement (main/Barik only, deterministic on the fixed seed):
     - flood the SE corner from Hedda + Corvo, kept inside cut lines (x>=XCUT,
       y>=YCUT) so it grabs the farm+causeway+cove but never the Undermaw or the
       northern roads (Sunscour, the Vael March),
     - lay a vathward stone on every walkable tile bordering that region (all
       sharing one gid, so breaking any one shatters the whole wall - see
       clearGateNode); water and cliffs seal the rest of the perimeter,
     - then VERIFY by flood-fill that the wall truly seals Hedda AND Corvo AND
       that the Undermaw (the pick's source) and the northern roads stay
       reachable. If any check fails, the wall is torn back out - it can NEVER
       soft-lock.

   Persistence: the moment any stone falls, clearGateNode records
   P.story.tg['main:heddaward']=1. On reload the world regen's and this placer
   sees the flag and leaves the wall out for good (the way stays open), exactly
   like every other felled tool-gate.
   ===================================================================== */
(function(){
'use strict';

var WARD_GID='main:heddaward';
var DIRS=[[1,0],[-1,0],[0,1],[0,-1]];

function isWater(t){ return (typeof T!=='undefined') && (t===T.DEEP || t===T.SHALLOW); }
function walkableTile(x,y){ return inb(x,y) && !solidAt(x,y) && walkTile(tileAt(x,y)) && !isWater(tileAt(x,y)); }

function findHedda(){
  for(var i=0;i<G.npcs.length;i++){ if(G.npcs[i].id==='hedda') return G.npcs[i]; }
  return null;
}
function nodeAt(x,y){ for(var i=0;i<G.nodes.length;i++){ if(G.nodes[i].tx===x && G.nodes[i].ty===y) return G.nodes[i]; } return null; }
function npcAt(x,y,exceptId){ for(var i=0;i<G.npcs.length;i++){ var n=G.npcs[i]; if(n.id!==exceptId && Math.round(n.x-0.5)===x && Math.round(n.y-0.5)===y) return true; } return false; }
// a building/critical decor tile inside the footprint would be wrong to seal
function criticalDecorAt(x,y){
  var CRIT={house:1,house2:1,barn:1,forge:1,tower:1,castle:1,windmill:1,waterwheel:1,boat:1,well:1,
            dungeonmouth:1,cavemouth:1,lairmouth:1,tombmouth:1,tunnelmouth:1,leappoint:1,fastexit:1,bazaar:1,chest:1};
  for(var i=0;i<G.decor.length;i++){ var b=G.decor[i]; if(CRIT[b.kind] && Math.round(b.x-0.5)===x && Math.round(b.y-0.5)===y) return true; }
  return false;
}

// flood from (sx,sy) across walkable tiles, treating `blocked` (a {'x,y':1} set) as walls.
// returns a reached-set; stops early past `cap`.
function flood(sx,sy,blocked,cap){
  var seen={}, st=[[sx,sy]], out={}; seen[sx+','+sy]=1; var count=0;
  while(st.length){ var p=st.pop(); out[p[0]+','+p[1]]=1; count++;
    if(count>cap) return out;
    for(var k=0;k<4;k++){ var nx=p[0]+DIRS[k][0], ny=p[1]+DIRS[k][1], key=nx+','+ny;
      if(seen[key] || blocked[key]) continue;
      if(!walkableTile(nx,ny)) continue;
      seen[key]=1; st.push([nx,ny]); } }
  return out;
}

// the two cut lines that pen the seal into Barik's SE corner. Chosen (and
// verified, below) so the flood grabs the farm + causeway + Corvo's cove but
// never the Undermaw (x<XCUT) or the northern roads to Sunscour / the Vael
// March (y<YCUT). Deterministic: the main map is a fixed seed.
var WARD_XCUT=284, WARD_YCUT=201;

function findNpcById(id){ for(var i=0;i<G.npcs.length;i++){ if(G.npcs[i].id===id) return G.npcs[i]; } return null; }
// nearest walkable tile to (px,py) - so a seed / probe point that lands on a
// building or the water's edge still resolves to open ground.
function nearOpen(px,py){ if(walkableTile(px,py)) return [px,py];
  for(var r=1;r<=6;r++) for(var oy=-r;oy<=r;oy++) for(var ox=-r;ox<=r;ox++){ var x=px+ox,y=py+oy; if(walkableTile(x,y)) return [x,y]; }
  return [px,py]; }

function placeBarikWard(id){
  try{
    if(id!=='main') return;
    P.story=P.story||{}; P.story.tg=P.story.tg||{};
    if(P.story.tg[WARD_GID]) return;                 // ward already shattered - way stays open
    if(typeof addGateNode!=='function') return;
    var H=findHedda(); if(!H) return;
    var hx=Math.round(H.x-0.5), hy=Math.round(H.y-0.5);
    var C=findNpcById('corvo');
    var cx=C?Math.round(C.x-0.5):null, cy=C?Math.round(C.y-0.5):null;

    // ---- flood the SE corner from Hedda (+ Corvo), staying inside the cut lines ----
    var IN={}, st=[], seeds=[[hx,hy]]; if(cx!=null) seeds.push([cx,cy]);
    for(var si=0; si<seeds.length; si++){ var s0=nearOpen(seeds[si][0],seeds[si][1]);
      if(s0[0]>=WARD_XCUT && s0[1]>=WARD_YCUT && walkableTile(s0[0],s0[1])){ IN[s0[0]+','+s0[1]]=1; st.push(s0); } }
    var guard=40000;
    while(st.length){ var q=st.pop(); if(--guard<0) break;
      for(var k=0;k<4;k++){ var nx=q[0]+DIRS[k][0], ny=q[1]+DIRS[k][1], key=nx+','+ny;
        if(IN[key]) continue; if(nx<WARD_XCUT||ny<WARD_YCUT) continue; if(!walkableTile(nx,ny)) continue;
        IN[key]=1; st.push([nx,ny]); } }
    if(!Object.keys(IN).length) return;

    // ---- the wall: a vathward on every walkable tile bordering that region
    //      (water / cliffs on the border need no stone - they seal on their own) ----
    var wards=[], seenRing={};
    for(var kk in IN){ var pr=kk.split(','), x=+pr[0], y=+pr[1];
      for(var d=0; d<4; d++){ var bx=x+DIRS[d][0], by=y+DIRS[d][1], bk=bx+','+by;
        if(IN[bk] || seenRing[bk]) continue; seenRing[bk]=1;
        if(!walkableTile(bx,by)) continue;           // already solid/water -> natural wall
        if(npcAt(bx,by,null)) continue;              // never wall an npc's tile
        var g=addGateNode('vathward', bx, by);
        if(g){ g.gid=WARD_GID; g.ward=1; wards.push(g); } } }
    if(!wards.length) return;

    // ---- SAFETY VERIFY: from the world spawn, with the wall solid, Hedda AND Corvo
    //      must be SEALED, and the Undermaw + the northern roads must stay REACHABLE.
    //      Else tear it all back out (never a soft-lock, never a half-open wall). ----
    var sp=(WORLD_DEFS.main && WORLD_DEFS.main.spawn) || {x:57.5,y:259.5};
    var spx=Math.round(sp.x-0.5), spy=Math.round(sp.y-0.5);
    var reach=flood(spx,spy,{}, 300000);             // wards are already solid, so flood routes around them
    function reachNear(px,py){ if(px==null) return true; var n=nearOpen(px,py);
      for(var r=0;r<=4;r++) for(var oy=-r;oy<=r;oy++) for(var ox=-r;ox<=r;ox++){ if(reach[(n[0]+ox)+','+(n[1]+oy)]) return true; } return false; }
    function zone(z,dx,dy){ return (typeof ZONES!=='undefined' && ZONES[z]) ? [Math.round(ZONES[z].x),Math.round(ZONES[z].y)] : [dx,dy]; }
    var um=zone('undermaw',212,196), des=zone('desert',300,112), vl=zone('vael',318,40);
    var heddaSealed=!reachNear(hx,hy);
    var corvoSealed=(cx==null)?true:!reachNear(cx,cy);
    var umReach=reachNear(um[0],um[1]), desReach=reachNear(des[0],des[1]), vaelReach=reachNear(vl[0],vl[1]);

    if(!(heddaSealed && corvoSealed && umReach && desReach && vaelReach)){
      for(var w=0;w<wards.length;w++){ var wd=wards[w]; wd.dead=true; wd.gone=true; setSolid(wd.tx,wd.ty,0);
        var idx=G.nodes.indexOf(wd); if(idx>=0) G.nodes.splice(idx,1); }
      try{ console.warn('placeBarikWard: SE-corner verify failed (hedda='+heddaSealed+' corvo='+corvoSealed+' um='+umReach+' des='+desReach+' vael='+vaelReach+') - wall not placed'); }catch(_){}
      if(typeof invalidateScenery==='function') invalidateScenery();
      return;
    }
    // (rumours are (re)attached by applyIdleDialogue on every Barik entry - see 00-dialogue.js)
    if(typeof invalidateScenery==='function') invalidateScenery();
  }catch(e){ try{ console.warn('placeBarikWard failed', e); }catch(_){ } }
}

// ---- rumours: while the ward stands, two Barik voices point you at it ----
function addLine(id, line){
  var n=null; for(var i=0;i<G.npcs.length;i++){ if(G.npcs[i].id===id){ n=G.npcs[i]; break; } }
  if(!n) return;
  n.idleLines=n.idleLines||[];
  for(var j=0;j<n.idleLines.length;j++){ if(n.idleLines[j]===line) return; }   // no dupes on re-gen
  n.idleLines.push(line); if(n.li==null) n.li=0;
}
// Public: re-applied on every Barik entry from applyIdleDialogue (which resets idle
// lines), and only while the ward still stands.
window.attachBarikWardRumours=function(){
  if(P.story && P.story.tg && P.story.tg[WARD_GID]) return;   // ward already down - no rumours
  // Warden Kell - the "you can't reach the farmer OR the cove, the stone cut us off" beat
  addLine('kell', 'And there\'s the other thing - the whole east shoulder\'s sealed off. Some strange <b style="color:#c04bff">violet stone</b> came up in the night and walled it all in: Farmer Hedda\'s steading, the causeway, Captain Corvo\'s cove and his sloop with it. There\'s no reaching the farm and no sailing east till it\'s down - and no pick on Barik so much as scratches it. If anything down the Undermaw has an edge for it, bring it back.');
  // Captain Corvo - the sailor who swears a man in violet raised it (Vath breadcrumb)
  addLine('corvo', 'You\'ll think me deep in the rum, but I saw it: a man all in <b style="color:#c04bff">violet</b> standing out on the headland the night that stone came up. He pointed at Hedda\'s fields, and the ground <i>answered</i> him - rose up purple and humming. Vath, the old folk are whispering. I\'ve sailed thirty years and never wanted the horizon more.');
};

// ---- the ward falls: Hedda's thanks (called from clearGateNode when a ward stone breaks) ----
window.onWardBroken=function(n){
  try{
    if(!n || n.gid!==WARD_GID) return;
    if(typeof toast==='function') toast('<b style="color:#c04bff">The ward shatters.</b> The violet stone crumbles to dust the length of the wall, and the whole east shoulder opens for good - Hedda\'s steading, and the cove where Corvo\'s sloop can carry you east.', 5600);
    var hd=findHedda();
    if(hd){ hd.idleLines=[
      'You cut me LOOSE! I woke to that violet stone growing round my steading like frost - humming, cold, right across the lane till I couldn\'t see the road. I\'d have starved in my own field. Bless that pick of yours, love. Take a sack of the first crop, and don\'t you dare argue.',
      'Whoever raised that wall wanted Barik cut off from itself - farm from folk, hand from harvest. And you undid it in a morning. There\'s no thanks big enough, so there\'s hot stew on the hearth whenever you come by.'
    ]; hd.li=0; hd.farmer=1; }
  }catch(e){}
};

window.placeBarikWard=placeBarikWard;

})();
