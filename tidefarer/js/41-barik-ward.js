/* =====================================================================
   THE HEDDA-WARD  -  Vath's violet wardstone, cutting Barik off from itself.

   An AUTHORED story gate (the kind 35-toolgate-content.js flags as "the next
   content step"): a ring of bright-violet WARDSTONE walls Farmer Hedda's
   steading off, so you can see her farm but not reach her until you carry a
   dungeon-forged pickaxe. The Undermaw drops that pick (the Delvebreaker), so
   the whole loop stays inside Barik: hear the rumour -> take the Undermaw ->
   shatter the ward -> Hedda thanks you (and a sailor swears a man in violet
   raised the stone - Vath).

   Placement (main/Barik only, deterministic on the fixed seed):
     - box Hedda in with a rectangular ring of vathward stones (all sharing one
       gid, so breaking any one shatters the whole ward - see clearGateNode),
     - clear the small interior to open ground + a couple of soil plots,
     - then VERIFY by flood-fill that the ring truly seals Hedda AND that the
       Undermaw (the pick's source) stays reachable without her. If either
       check fails, the ring is torn back out - it can NEVER soft-lock.

   Persistence: the moment any stone falls, clearGateNode records
   P.story.tg['main:heddaward']=1. On reload the world regen's and this placer
   sees the flag and leaves the ring out for good (the way stays open), exactly
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

function placeBarikWard(id){
  try{
    if(id!=='main') return;
    P.story=P.story||{}; P.story.tg=P.story.tg||{};
    if(P.story.tg[WARD_GID]) return;                 // ward already shattered - way stays open
    if(typeof addGateNode!=='function') return;
    var H=findHedda(); if(!H) return;
    var hx=Math.round(H.x-0.5), hy=Math.round(H.y-0.5);

    // ---- footprint: a compact pen around Hedda (interior IW x IH, ring one tile out) ----
    var IW=5, IH=3;                                   // interior 5 wide x 3 tall, Hedda centred
    var x0=hx-((IW-1)>>1), y0=hy-((IH-1)>>1);
    var ix1=x0+IW-1, iy1=y0+IH-1;                     // interior bounds (inclusive)
    var bx0=x0-1, by0=y0-1, bx1=ix1+1, by1=iy1+1;     // border bounds (inclusive)

    // interior must be sane: in-bounds, no water, no other npc / critical building.
    var interior=[];
    for(var y=y0;y<=iy1;y++) for(var x=x0;x<=ix1;x++){
      if(!inb(x,y)) return;
      if(isWater(tileAt(x,y))) return;               // don't box a pond - bail (fail-safe)
      if((x!==hx||y!==hy) && npcAt(x,y,'hedda')) return;
      if(criticalDecorAt(x,y)) return;
      interior.push([x,y]);
    }

    // ---- carve the interior open + a couple of soil plots (skip Hedda's own tile) ----
    var carved=[];
    for(var ii=0;ii<interior.length;ii++){ var t=interior[ii]; var cx=t[0], cy=t[1];
      var nn=nodeAt(cx,cy); if(nn){ nn.dead=true; nn.gone=true; carved.push(['node',nn]); }
      if(solidAt(cx,cy)){ setSolid(cx,cy,0); carved.push(['solid',cx,cy]); }
    }
    // a small field: the interior row south of Hedda, where it's still bare ground
    var plots=[];
    for(var py=hy+1;py<=iy1;py++) for(var px=x0;px<=ix1;px++){
      if(px===hx && py===hy) continue;
      if(tileAt(px,py)!==T.PATH && tileAt(px,py)!==T.PLANK && !nodeAt(px,py)){
        var already=false; for(var q=0;q<G.plots.length;q++){ if(G.plots[q].x===px && G.plots[q].y===py){ already=true; break; } }
        if(!already && walkableTile(px,py)){ setTile(px,py,T.SOIL); G.plots.push({x:px,y:py,stage:0,t:0}); plots.push([px,py]); }
      }
    }

    // ---- lay the ring: a vathward stone on every walkable border tile (existing
    //      solids / water on the border seal the rest) ----
    var wards=[];
    for(var bx=bx0;bx<=bx1;bx++) for(var by=by0;by<=by1;by++){
      var onBorder=(bx===bx0||bx===bx1||by===by0||by===by1);
      if(!onBorder) continue;
      if(!inb(bx,by)) continue;
      if(!walkableTile(bx,by)) continue;             // already solid/water -> natural wall, leave it
      if(npcAt(bx,by,'hedda')) continue;
      var g=addGateNode('vathward', bx, by);
      if(g){ g.gid=WARD_GID; g.ward=1; wards.push(g); }
    }
    if(!wards.length){ return; }                     // nothing placed - nothing to verify

    // ---- SAFETY VERIFY: from the world spawn, with the ring solid, Hedda must be
    //      SEALED and the Undermaw mouth must stay REACHABLE. Else tear it all back out. ----
    var sp=(WORLD_DEFS.main && WORLD_DEFS.main.spawn) || {x:57.5,y:259.5};
    var spx=Math.round(sp.x-0.5), spy=Math.round(sp.y-0.5);
    // seed the flood from the nearest open tile to spawn (spawn tile itself is walkable)
    var reach=flood(spx,spy,{}, 60000);
    var um=(typeof ZONES!=='undefined' && ZONES.undermaw) ? [Math.round(ZONES.undermaw.x),Math.round(ZONES.undermaw.y)] : [212,196];
    // find an open tile at/near the undermaw mouth to test reachability
    var umReach=false; for(var r=0;r<=4 && !umReach;r++){ for(var oy=-r;oy<=r && !umReach;oy++) for(var ox=-r;ox<=r && !umReach;ox++){
      var ux=um[0]+ox, uy=um[1]+oy; if(reach[ux+','+uy]) umReach=true; } }
    var heddaSealed = !reach[hx+','+hy];

    if(!(heddaSealed && umReach)){
      // undo everything (fail-safe: never soft-lock, never a half-open ward)
      for(var w=0;w<wards.length;w++){ var wd=wards[w]; wd.dead=true; wd.gone=true; setSolid(wd.tx,wd.ty,0);
        var idx=G.nodes.indexOf(wd); if(idx>=0) G.nodes.splice(idx,1); }
      for(var c=0;c<carved.length;c++){ var e=carved[c]; if(e[0]==='solid') setSolid(e[1],e[2],1); }
      for(var pp=0;pp<plots.length;pp++){ for(var pj=G.plots.length-1;pj>=0;pj--){ if(G.plots[pj].x===plots[pp][0] && G.plots[pj].y===plots[pp][1]){ G.plots.splice(pj,1); break; } } }
      try{ console.warn('placeBarikWard: seal/verify failed (sealed='+heddaSealed+' undermaw='+umReach+') - ward not placed'); }catch(_){}
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
  // Warden Kell - the "you can't reach the farmer, the stone cut us off" beat
  addLine('kell', 'And there\'s the other thing - you\'ll not reach Farmer Hedda\'s steading. Some strange <b style="color:#c04bff">violet stone</b> came up in the night and walled the whole farm off, like the isle\'s been cut off from itself. No pick on Barik so much as scratches it. If anything down the Undermaw has an edge for it, bring it back.');
  // Captain Corvo - the sailor who swears a man in violet raised it (Vath breadcrumb)
  addLine('corvo', 'You\'ll think me deep in the rum, but I saw it: a man all in <b style="color:#c04bff">violet</b> standing out on the headland the night that stone came up. He pointed at Hedda\'s fields, and the ground <i>answered</i> him - rose up purple and humming. Vath, the old folk are whispering. I\'ve sailed thirty years and never wanted the horizon more.');
};

// ---- the ward falls: Hedda's thanks (called from clearGateNode when a ward stone breaks) ----
window.onWardBroken=function(n){
  try{
    if(!n || n.gid!==WARD_GID) return;
    if(typeof toast==='function') toast('<b style="color:#c04bff">The ward shatters.</b> The violet stone crumbles to dust, and the way to Hedda\'s steading opens for good.', 5200);
    var hd=findHedda();
    if(hd){ hd.idleLines=[
      'You cut me LOOSE! I woke to that violet stone growing round my steading like frost - humming, cold, right across the lane till I couldn\'t see the road. I\'d have starved in my own field. Bless that pick of yours, love. Take a sack of the first crop, and don\'t you dare argue.',
      'Whoever raised that wall wanted Barik cut off from itself - farm from folk, hand from harvest. And you undid it in a morning. There\'s no thanks big enough, so there\'s hot stew on the hearth whenever you come by.'
    ]; hd.li=0; hd.farmer=1; }
  }catch(e){}
};

window.placeBarikWard=placeBarikWard;

})();
