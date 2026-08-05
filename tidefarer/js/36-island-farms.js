/* =====================================================================
   ISLAND FARMS  -  a farm and a farmer you can work with on every isle.

   The home isle ships Willa's Farm; Barik ships Hedda's steading. But the
   other overworld isles had a farmer nowhere and no soil to work. This
   plants one small, hand-placed farmstead on each isle that lacked it:

     - a BARN (enterable, like any barn),
     - a FARMER npc flagged `farmer` (offers free seeds - see 06-dialog.js),
     - a field of tilled SOIL plots you plant/harvest exactly like Willa's.

   Placement runs once per fresh world-gen from switchWorld, right after the
   tool-gates - so it snapshots into the per-world cache (WORLDS[id]) and
   persists across visits in a session, the same way Willa's plots and the
   tool-gate caches do. Cached worlds skip it; a reload regenerates the same
   farm deterministically (findOpenNear is deterministic on the baked map).

   Islands already served are left alone:
     - isle  : Willa the Farmer + her plots (02-worldgen.js)
     - main  : Hedda's steading + barn; here we only add a few always-open
               plots so the field is workable without the paid upgrade.
     - crown : Gale's palace kitchen-garden already has tilled beds; here we
               make the bare beds plantable and promote Gale to a farmer.
   Cloudreach (sky) is intentionally left farmless.
   ===================================================================== */
(function(){
'use strict';

// per-isle farmstead: an anchor near open ground, a barn, and a farmer.
var FARMS={
  east:{ anchor:[116,118], barn:'Grove Barn',
    farmer:{ id:'mahina', name:'Mahina the Planter',
      look:{skin:'#a9744f',hair:'#241a12',shirt:'#3f8a5a',pants:'#5a4632',hat:'straw',hairstyle:'long',apron:'#7a6242'},
      lines:["Ash makes the sweetest soil - Kea's gift, if you can stand the smoke.",
             "Taro, yam, and good island wheat. All of it loves this sun.",
             "Plant at the grove's edge - the palms keep the wind off the rows."] } },
  wind:{ anchor:[98,80], barn:'Millward Grange',
    farmer:{ id:'gethin', name:'Gethin the Grange-Keeper',
      look:{skin:'#c98d5f',hair:'#4a3722',shirt:'#8a6f3a',pants:'#4a3f2c',hat:'straw',hairstyle:'short',beard:'#4a3722'},
      lines:["The mill up the rise wants grain, and grain wants working. Care to?",
             "City folk forget bread starts in the dirt. Not me.",
             "Wind's good for the sails and good for the wheat. Lucky isle."] } },
  aerie:{ anchor:[120,100], barn:'Ridge Barn',
    farmer:{ id:'corin', name:'Corin the Terrace-Farmer',
      look:{skin:'#b58a5e',hair:'#5a4a34',shirt:'#4a6a7a',pants:'#3a3a2c',hat:'straw',hairstyle:'short',apron:'#6e5a3e'},
      lines:["I farm the ridge in terraces - flat ground's for the birds up here.",
             "The rooks steal a share, but they earn it keeping the grubs down.",
             "Sow high, harvest higher. Best view of any field in the isles."] } },
  frost:{ anchor:[62,110], barn:'The Hearthhold Glasshouse',
    farmer:{ id:'halla', name:'Halla the Root-Keeper',
      look:{skin:'#d8b28a',hair:'#b8a68a',shirt:'#5a6a8a',pants:'#3a3f4a',hairstyle:'long',apron:'#7a6a54'},
      lines:["Nothing grows on the ice - so we grow it under glass, warm as a hearth.",
             "Turnip, beet, hardy things. They don't mind the cold, and neither do I.",
             "Seed in the warm beds and they'll come up green for you. Try it."] } },
  reach:{ anchor:[56,66], barn:'Castaway Croft', stone:1,   // sea-stone barn to match the storm-houses
    farmer:{ id:'nella', name:'Nella the Castaway-Grower',
      look:{skin:'#c08850',hair:'#3a2a1c',shirt:'#6a5a44',pants:'#4a3f30',hat:'straw',hairstyle:'bun',apron:'#5a4a34'},
      lines:["Storm wrecked us here, so we planted. A camp with a field is a home.",
             "Salt spray and all, the beds still take. The sea gives more than it takes.",
             "Take some seed. On this coast, a full row is worth more than gold."] } },
  // Barik: Hedda's steading (barn + Farmer Hedda) already stands. Just add a small
  // always-open field so it's workable before the paid acre, and let Hedda - who is
  // literally the farmer - hand out seed like every other island grower.
  main:{ anchor:[292,216], promote:'hedda' }
};

// flag an existing npc as a farmer so its dialog offers free seed (06-dialog.js).
function promoteFarmer(id){
  for(var i=0;i<G.npcs.length;i++){ if(G.npcs[i].id===id){ G.npcs[i].farmer=1; return; } }
}

// a tile already claimed by a tree/rock, a building/decor, an npc, or a plot.
function farmBusy(x,y){
  var i;
  for(i=0;i<G.nodes.length;i++){ if(G.nodes[i].tx===x && G.nodes[i].ty===y) return true; }
  for(i=0;i<G.decor.length;i++){ var b=G.decor[i]; if(Math.round(b.x-0.5)===x && Math.round(b.y-0.5)===y) return true; }
  for(i=0;i<G.npcs.length;i++){ var p=G.npcs[i]; if(Math.round(p.x-0.5)===x && Math.round(p.y-0.5)===y) return true; }
  for(i=0;i<G.plots.length;i++){ if(G.plots[i].x===x && G.plots[i].y===y) return true; }
  return false;
}
// walkable open land we may till into a plot (never a path, plank, water, or a claimed tile).
function tillable(x,y){
  if(!inb(x,y)) return false;
  var t=tileAt(x,y);
  if(!walkTile(t) || solidAt(x,y) || t===T.PATH || t===T.PLANK) return false;
  return !farmBusy(x,y);
}
// lay a compact field (two rows of four, a walking gap between) from (cx,cy).
// Blocked tiles are simply skipped, so a few obstacles just make a smaller field.
function layField(cx,cy,max){
  var placed=0;
  for(var gy=0; gy<2 && placed<max; gy++){
    for(var gx=0; gx<4 && placed<max; gx++){
      var x=cx-1+gx, y=cy+gy*2;
      if(!tillable(x,y)) continue;
      setTile(x,y,T.SOIL);
      G.plots.push({x:x, y:y, stage:0, t:0});
      placed++;
    }
  }
  return placed;
}

function plantFarm(cfg){
  var a=cfg.anchor;
  var spot=findOpenNear(a[0],a[1],20); if(!spot) return;
  var bx=spot[0], by=spot[1];
  if(cfg.barn && typeof addBuilding==='function'){ var bb=addBuilding('barn',bx,by,cfg.barn); if(bb && cfg.stone) bb.stone=1; }
  // spawn the farmer BEFORE tilling, so a plot never lands on their feet.
  if(cfg.farmer && typeof makeNPC==='function'){
    var fp=findOpenNear(bx-3,by,6) || findOpenNear(bx+3,by,6) || findOpenNear(bx,by-3,6);
    if(fp && !farmBusy(fp[0],fp[1])){
      var f=makeNPC(cfg.farmer.id, cfg.farmer.name, fp[0], fp[1], cfg.farmer.look, cfg.farmer.lines, 0.5);
      f.farmer=1; G.npcs.push(f);
    }
  }
  // the field sits south of the barn; its front (south) row stays a walking gap.
  var fy = cfg.barn ? by+2 : by;
  var n=layField(bx, fy, 8);
  if(n<4){ var alt=findOpenNear(bx, fy+3, 10); if(alt) layField(alt[0], alt[1], 8-n); }
}

// Aldermere: Gale's kitchen-garden already lays tilled SOIL beds (some holding a
// lettuce head). Make the BARE beds plantable and let Gale hand out seed.
function plantCrownBeds(){
  if(typeof crownLettucePlot!=='function') return;
  var LG=crownLettucePlot(), placed=0;
  for(var ly=-2; ly<=2 && placed<8; ly++) for(var lx=-3; lx<=3 && placed<8; lx++){
    var x=LG.x+lx, y=LG.y+ly;
    if(tileAt(x,y)!==T.SOIL) continue;   // only the tilled beds
    if(farmBusy(x,y)) continue;          // skip a bed already holding a lettuce head / decor
    G.plots.push({x:x, y:y, stage:0, t:0});
    placed++;
  }
  promoteFarmer('gale');
}

function placeIslandFarms(id){
  try{
    if(id==='crown'){ plantCrownBeds(); }
    else { var cfg=FARMS[id]; if(cfg){ plantFarm(cfg); if(cfg.promote) promoteFarmer(cfg.promote); } }
    if(typeof invalidateScenery==='function') invalidateScenery();
  }catch(e){ try{ console.warn('placeIslandFarms failed', e); }catch(_){ } }
}

window.placeIslandFarms=placeIslandFarms;

})();
