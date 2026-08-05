/* =====================================================================
   WORLD GENERATION
   ===================================================================== */
let SEED = 20260715;
let ZONES = {
  springs:{x:22, y:34, r:5, name:'Ember Springs'},
  cove:   {x:82, y:24, r:6, name:"Smuggler's Cove"},
  orchard:{x:72, y:74, r:6, name:'Old Orchard'},
  village:{x:48,y:58,r:9,  name:'Emberwick Village'},
  farm:   {x:61,y:69,r:5,  name:'Willa\'s Farm'},
  dock:   {x:31,y:62,r:5,  name:'Driftwood Dock'},
  tower:  {x:57,y:35,r:4,  name:'Orin\'s Tower'},
  ruins:  {x:46,y:20,r:9,  name:'Old Ruins'},
  meadow: {x:69,y:49,r:7,  name:'Slime Meadow'},
  forest: {x:33,y:38,r:9,  name:'Whisperwood'},
  grove:  {x:96,y:50,r:6,  name:"Rask's Grove"}
};
// The Tideward Crypt was moved off the northern Old Ruins to the isle's SOUTHERN shore - a
// founders' ruin at the bottom of Emberwick, past Willa's farm. genWorld carves this clearing
// and a path down to it so the crypt mouth (placeEmberTomb) always lands on reachable ground.
const ISLE_TOMB = {x:52, y:82};

/* The Hollow Spirit's arena, at the isle's cold northern tip. The ruins reach
   far north; a stretch of open grass and a few warning-boards lead up to a
   fire-gate that seals the hero in once the King rises. Computed in
   shapeHollowKingApproach() and read by the fire mechanic in 09-gameplay. */
let HOLLOW_GATE = [];              // walkable tiles across the ruin mouth (the seal)
const HOLLOW_GATEY = 21;           // the gate row - grass approach lies just south
let HOLLOW_MINX = 99, HOLLOW_MAXX = -99;

/* The ward-gate seals the approach a little further in, where the sea pinches
   the ruined causeway to a narrow neck (open water on either flank, so there is
   no way around). A wall of old ruin-stone stands here with a warded gate at its
   heart, holding the Hollow Spirit's spit shut until Elder Maren speaks it open at
   the start of her quest. Computed in shapeHollowKingApproach(); raised and
   lifted by the seal mechanic in 09-gameplay. */
let WARD_GATE = [];                // walkable tiles across the sealed causeway
const WARD_GATEY = 19;             // the causeway-neck row (water on both flanks)
let WARD_MINX = 99, WARD_MAXX = -99;

function carveLine(x0,y0,x1,y1,tile,width){
  const steps = Math.ceil(dist(x0,y0,x1,y1))*2;
  for(let i=0;i<=steps;i++){
    const x = Math.round(lerp(x0,x1,i/steps)), y = Math.round(lerp(y0,y1,i/steps));
    for(let dx=-width;dx<=width;dx++) for(let dy=-width;dy<=width;dy++){
      if(Math.abs(dx)+Math.abs(dy)<=width && inb(x+dx,y+dy) && walkTile(tileAt(x+dx,y+dy)))
        setTile(x+dx,y+dy,tile);
    }
  }
}
function carveDisc(cxx,cyy,r,tile,onlyLand){
  for(let y=cyy-r;y<=cyy+r;y++) for(let x=cxx-r;x<=cxx+r;x++){
    if(inb(x,y) && dist(x,y,cxx,cyy)<=r && (!onlyLand || walkTile(tileAt(x,y)))) setTile(x,y,tile);
  }
}

function genWorld(){
  const hN = makeNoise(SEED, 9), mN = makeNoise(SEED+77, 7), vR = mulberry32(SEED+3);
  // base island
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const nx=x/MAPW, ny=y/MAPH;
    const d = dist(x,y,MAPW/2,MAPH/2) / (MAPW*0.52);
    let h = hN(nx,ny)*0.72 + hN(nx*2.3,ny*2.3)*0.28;
    h -= Math.pow(d,2.1)*0.95;
    let t;
    if(h<0.18) t=T.DEEP; else if(h<0.26) t=T.SHALLOW; else if(h<0.31) t=T.SAND;
    else t = (mN(nx,ny)>0.56) ? T.FOREST : T.GRASS;
    G.map[y*MAPW+x]=t;
    G.variant[y*MAPW+x] = Math.floor(vR()*4);
  }
  // guarantee zones are land
  carveDisc(ZONES.village.x,ZONES.village.y,ZONES.village.r,T.GRASS,false);
  carveDisc(ZONES.farm.x,ZONES.farm.y,ZONES.farm.r,T.GRASS,false);
  carveDisc(ZONES.meadow.x,ZONES.meadow.y,ZONES.meadow.r,T.GRASS,false);
  carveDisc(ZONES.tower.x,ZONES.tower.y,ZONES.tower.r,T.GRASS,false);
  carveDisc(ZONES.forest.x,ZONES.forest.y,ZONES.forest.r+2,T.FOREST,false);
  carveDisc(ZONES.ruins.x,ZONES.ruins.y,ZONES.ruins.r,T.RUIN,false);
  // driftwood bay: carve water + beach + dock planks
  carveDisc(26,62,5,T.DEEP,false);
  carveDisc(26,62,6,T.SHALLOW,true); // ring of shallow around new deep? -> handled below
  for(let y=55;y<70;y++) for(let x=19;x<34;x++){
    if(tileAt(x,y)===T.DEEP && (tileAt(x+1,y)>=T.SAND||tileAt(x-1,y)>=T.SAND||tileAt(x,y+1)>=T.SAND||tileAt(x,y-1)>=T.SAND)) setTile(x,y,T.SHALLOW);
  }
  for(let y=58;y<=66;y++) for(let x=29;x<=33;x++) if(!walkTile(tileAt(x,y))) setTile(x,y,T.SHALLOW);
  carveDisc(32,62,2,T.SAND,false);
  // dock planks reaching into bay
  for(let x=27;x<=31;x++){ setTile(x,62,T.PLANK); setTile(x,63,T.PLANK); }
  // new isle zones
  carveDisc(ZONES.springs.x,ZONES.springs.y,ZONES.springs.r,T.GRASS,false);
  carveDisc(ZONES.springs.x,ZONES.springs.y,2,T.SHALLOW,false); // the hot pool
  carveDisc(ZONES.cove.x,ZONES.cove.y,ZONES.cove.r,T.GRASS,false);
  carveDisc(ZONES.cove.x+2,ZONES.cove.y-2,3,T.SAND,false);
  carveDisc(ZONES.orchard.x,ZONES.orchard.y,ZONES.orchard.r,T.GRASS,false);
  // the Tideward Crypt's southern site: a founders' ruin-clearing at the bottom shore, ringed
  // by a thin beach so it reads as the isle's southern point (the crypt mouth is dropped here
  // by placeEmberTomb once all four gifts are in hand).
  carveDisc(ISLE_TOMB.x,ISLE_TOMB.y,7,T.SAND,false);
  carveDisc(ISLE_TOMB.x,ISLE_TOMB.y,5,T.RUIN,false);
  // --- Rask's Grove: the island's FAR-EAST woods, carved out past the Slime Meadow.
  // The coastline is pushed east here (carveDisc lays land straight over open sea) into
  // a little forest with a grass clearing at its heart, where the blade-master Rask
  // drills newcomers. Trees auto-scatter onto the FOREST tiles (see placeObjects). ---
  {
    const GX=ZONES.grove.x, GY=ZONES.grove.y;
    carveDisc(GX,GY,12,T.SHALLOW,false);   // shoals
    carveDisc(GX,GY,11,T.SAND,false);      // a pale beach ringing the new cape
    for(let x=74;x<=GX;x++) for(let y=GY-3;y<=GY+3;y++) if(inb(x,y)) setTile(x,y,T.GRASS);  // a land bridge from the meadow's east edge
    carveDisc(GX,GY,8,T.FOREST,false);     // the woods, thick all the way around
    carveDisc(GX,GY,3.8,T.GRASS,false);    // a broad OPEN training clearing at its heart (kept tree-free by blockedZone)
  }
  // paths
  const V=ZONES.village;
  carveLine(V.x,V.y, ZONES.dock.x+1,62, T.PATH,0);
  carveLine(V.x+2,V.y+1, ZONES.farm.x-1,ZONES.farm.y-1, T.PATH,0);
  carveLine(V.x+3,V.y-2, ZONES.meadow.x-3,ZONES.meadow.y, T.PATH,0);
  carveLine(ZONES.meadow.x+3,ZONES.meadow.y, ZONES.grove.x,ZONES.grove.y, T.PATH,1);   // a broad dirt path east, past the meadow, right into Rask's clearing
  carveLine(V.x,V.y-3, ZONES.tower.x,ZONES.tower.y+2, T.PATH,0);
  carveLine(ZONES.tower.x,ZONES.tower.y-2, ZONES.ruins.x,ZONES.ruins.y+6, T.PATH,0);
  carveLine(ZONES.farm.x,ZONES.farm.y+2, ISLE_TOMB.x,ISLE_TOMB.y-3, T.PATH,0);   // the way down to the southern crypt-ruin
  // farm soil plots (two rows of plots, south of Willa's barn, with walking gaps).
  // Kept aligned under the barn's new southern berth (see placeObjects), so the whole
  // farm reads as one steading well clear of Bram's forge up the lane.
  G.plots = [];
  for(let py=0;py<2;py++) for(let px=0;px<4;px++){
    const x = 59+px, y = 68+py*2;
    setTile(x,y,T.SOIL);
    G.plots.push({x, y, stage:0, t:0}); // stage 0 empty, 1..3 growing, 4 ready
  }
  // shore cleanup: shallow next to deep only where near land
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(tileAt(x,y)===T.SHALLOW){
      let landNear=false;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) if(walkTile(tileAt(x+dx,y+dy))) landNear=true;
      if(!landNear) setTile(x,y,T.DEEP);
    }
  }
  // A shallow (surfable) ford across the strait that separates the driftwood
  // dock from the village: with the wind-sail you can float straight from the
  // boat over to Elder Maren's shore instead of taking the long way round.
  // Light water = you can ride it; laid down AFTER the shore-cleanup pass above
  // so its mid-channel tiles aren't scrubbed back to deep.
  for(let y=61;y<=63;y++) for(let x=34;x<=41;x++){
    if(tileAt(x,y)===T.DEEP) setTile(x,y,T.SHALLOW);
  }
  // A long shallow lane runs far SOUTH off the driftwood beach, out across the
  // open sea to a lonely islet - reachable only by floating it on the wind-sail.
  // A gentle reef-curve (not a dead-straight canal) with a sandbar stepping-
  // stone partway, leading to a cache (the chest is placed in placeObjects).
  for(let y=82;y<=100;y++){
    const cx0 = 26 + Math.round(2.4*Math.sin((y-82)*0.32));   // gentle S-curve
    for(let dx=-1;dx<=1;dx++){ const x=cx0+dx; if(inb(x,y) && tileAt(x,y)===T.DEEP) setTile(x,y,T.SHALLOW); }
  }
  carveDisc(26,101,5,T.SHALLOW,false);  // broad shoals ringing the remote islet
  carveDisc(26,101,3,T.SAND,false);     // its pale beach
  carveDisc(26,101,2,T.GRASS,false);    // a scrap of green to stand on
  shapeHollowKingApproach();
  carveCastawayCove();
}

/* The castaway's cove: a small wash-ashore BEACH on the village's WEST shore, just
   left of the well, where Elder Maren draws the masked castaway out of the surf at
   the start of the game (the spawn point - see startFresh / startIntro). The village
   grass otherwise runs straight into the strait with no beach, and the near-shore is
   crowded by the inn and Maren's cottage - so this reaches a little sand SPIT out
   into the water instead, an open crescent of real SAND ringed by a wet SHALLOW
   tideline, clear of the buildings. Kept off the inn (41,57) and cottage (44,54). */
function carveCastawayCove(){
  // integer-safe disc fill (carveDisc iterates in fractional steps when the radius
  // is not a whole number, which silently no-ops - so lay sand over exact tiles here)
  const sand=(cx,cy,r,onlyLand)=>{
    for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)
      for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){
        if(!inb(x,y) || dist(x,y,cx,cy)>r) continue;
        if(onlyLand && !walkTile(tileAt(x,y))) continue;
        setTile(x,y,T.SAND);
      }
  };
  // an on-shore beach: the village's west-shore grass turned to SAND (land only, so the
  // strait itself stays water - we never bridge across to the driftwood dock). A broad
  // pale crescent hugging the waterline, north of the inn and around the well's lane.
  sand(40,53, 3.6, true);
  sand(41,56, 2.6, true);
  sand(39,51, 2.2, true);
  // pull the waterline one tile west right where the castaway wakes, so she lies on
  // open sand with the tideline in front of her (the deep strait channel further west
  // is left untouched, so the crossing to the dock stays a real water gap)
  for(const [x,y] of [[39,52],[39,53],[39,54],[39,55],[39,56]]) if(tileAt(x,y)===T.SHALLOW) setTile(x,y,T.SAND);
  // soften the deep water right at the new beach's edge to a wet SHALLOW tideline, so
  // the sand meets a lapping shore instead of a hard drop into deep sea
  for(let y=48;y<=59;y++) for(let x=36;x<=43;x++){
    if(!inb(x,y) || tileAt(x,y)!==T.DEEP) continue;
    let nearSand=false;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(tileAt(x+dx,y+dy)===T.SAND){ nearSand=true; break; }
    if(nearSand) setTile(x,y,T.SHALLOW);
  }
}

/* Reshape the northern ruins into the Hollow Spirit's approach:
   push the broken headland further north, lay a calm stretch of grass before
   the cursed ground, and record the fire-gate that seals the arena. */
function shapeHollowKingApproach(){
  const R = ZONES.ruins;
  // --- drive the ruined headland north, out to the isle's lonely tip ---
  // a pale sand spit is laid over the sea first, so the stone reads as shore-worn
  for(let y=2;y<=16;y++) for(let x=37;x<=55;x++){
    if(inb(x,y) && dist(x,y,46,9)<=7 && tileAt(x,y)===T.DEEP) setTile(x,y,T.SAND);
  }
  carveDisc(46,10,6,T.RUIN,false);   // the broken spit
  carveDisc(46,7,3,T.RUIN,false);    // its furthest, coldest reach - the King's ground
  // lap shallow water against the new shore so the spit reads as land, not island
  for(let y=2;y<=15;y++) for(let x=36;x<=56;x++){
    if(tileAt(x,y)!==T.DEEP) continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])
      if(inb(x+dx,y+dy) && walkTile(tileAt(x+dx,y+dy))){ setTile(x,y,T.SHALLOW); break; }
  }
  // --- a stretch of open grass leads up to the danger (calm, then cursed) ---
  for(let y=R.y+2;y<=R.y+12;y++) for(let x=R.x-12;x<=R.x+12;x++){
    if(inb(x,y) && tileAt(x,y)===T.RUIN && dist(x,y,R.x,R.y)<=R.r+2) setTile(x,y,T.GRASS);
  }
  // a footpath threads the grass up to the very mouth of the ruins (the fire-gate)
  carveLine(R.x, R.y+11, R.x, HOLLOW_GATEY+1, T.PATH, 0);
  // --- record the fire-gate: every walkable tile across the ruin's mouth ---
  HOLLOW_GATE = []; HOLLOW_MINX = 99; HOLLOW_MAXX = -99;
  for(let x=R.x-13;x<=R.x+13;x++){
    if(inb(x,HOLLOW_GATEY) && walkTile(tileAt(x,HOLLOW_GATEY))){
      HOLLOW_GATE.push([x,HOLLOW_GATEY]);
      if(x<HOLLOW_MINX) HOLLOW_MINX=x;
      if(x>HOLLOW_MAXX) HOLLOW_MAXX=x;
    }
  }
  // --- record the ward-gate: the contiguous walkable neck at WARD_GATEY that
  //     carries the causeway north. The sea walls its flanks, so this run is the
  //     whole way in - seal it and the King's spit is truly shut. ---
  WARD_GATE = []; WARD_MINX = 99; WARD_MAXX = -99;
  if(inb(R.x,WARD_GATEY) && walkTile(tileAt(R.x,WARD_GATEY))){
    let x0=R.x, x1=R.x;
    while(walkTile(tileAt(x0-1,WARD_GATEY))) x0--;
    while(walkTile(tileAt(x1+1,WARD_GATEY))) x1++;
    for(let x=x0;x<=x1;x++){ WARD_GATE.push([x,WARD_GATEY]); }
    WARD_MINX=x0; WARD_MAXX=x1;
  }
  if(typeof HOLLOW_FIRE!=='undefined'){ HOLLOW_FIRE.active=false; HOLLOW_FIRE.t=0; }
}

/* ---- object placement ---- */
function blockedZone(x,y){
  for(const k in ZONES){ const z=ZONES[k];
    if((k==='village'||k==='farm'||k==='dock'||k==='tower'||k==='meadow'||k==='ruins') && dist(x,y,z.x,z.y)<z.r) return true; }
  // keep Rask's training clearing OPEN - no trees inside it, though the woods ring it
  if(ZONES.grove && dist(x,y,ZONES.grove.x,ZONES.grove.y) < 4.4) return true;
  return false;
}
function addNode(kind,x,y){
  // trees & rocks start at 9 hp so a green woodcutter/miner has to work for a log
  // or a stone - roughly nine swings at level 1, which felt far too quick before.
  // The per-hit power still climbs steeply with skill and better tools, so a
  // master fells the same tree in a hit or two.
  const n = {kind,x:x+0.5,y:y+0.5,tx:x,ty:y,hp:9,maxhp:9,dead:false,respawn:0,
             variant:rndi(0,2), sway:Math.random()*TAU};
  // trees fell quicker than stone splits - a normal pine drops in ~3 swings of a tier-1 axe
  // (stone keeps its 9 hp). Big forest heartwoods still take noticeably longer.
  if(kind==='tree'){ n.hp=n.maxhp=6; }
  if(kind==='tree' && tileAt(x,y)===T.FOREST && Math.random()<0.35){ n.big=true; n.hp=n.maxhp=9; }
  G.nodes.push(n);
  if(kind==='tree'||kind==='rock') setSolid(x,y,1);
  return n;
}

function placeObjects(){
  const r = mulberry32(SEED+9);
  // trees
  for(let y=2;y<MAPH-2;y++) for(let x=2;x<MAPW-2;x++){
    const t = tileAt(x,y);
    if(t!==T.GRASS && t!==T.FOREST) continue;
    if(blockedZone(x,y)) continue;
    // never wall a dirt path: keep trees off any tile touching a PATH tile, so a
    // path threading the woods (e.g. into Rask's grove) always reads as a clear lane
    if(tileAt(x+1,y)===T.PATH||tileAt(x-1,y)===T.PATH||tileAt(x,y+1)===T.PATH||tileAt(x,y-1)===T.PATH||
       tileAt(x+1,y+1)===T.PATH||tileAt(x-1,y-1)===T.PATH||tileAt(x+1,y-1)===T.PATH||tileAt(x-1,y+1)===T.PATH) continue;
    const p = (t===T.FOREST)?0.20:0.045;
    if(r()<p) addNode('tree',x,y);
  }
  // rock outcrops: cluster along ruins road + scattered
  const rockSpots = [[52,47],[53,48],[51,49],[54,46],[52,45],[44,30],[47,31],[58,42],[40,50],[63,55],[70,42],[38,28]];
  for(const [x,y] of rockSpots){ if(walkTile(tileAt(x,y)) && !solidAt(x,y)){ if(tileAt(x,y)===T.PATH) continue; addNode('rock',x,y);} }
  const rr = mulberry32(SEED+13);
  for(let i=0;i<26;i++){ const x=rndiR(rr,4,MAPW-5), y=rndiR(rr,4,MAPH-5);
    if((tileAt(x,y)===T.GRASS||tileAt(x,y)===T.FOREST) && !blockedZone(x,y) && !solidAt(x,y) && rr()<0.7) addNode('rock',x,y); }
  // bluecap mushrooms in the Whisperwood - each cleared into its own little glade so the
  // glow always reads plainly and never hides behind a trunk (they only glow where the shade
  // thins, anyway). Trees are already placed above, so we just open a gap around each cap.
  const shroomSpots = [[30,36],[35,41],[28,40],[36,34],[31,44],[38,39],[26,35]];
  for(const [x,y] of shroomSpots){
    const s=findOpenNear(x,y,3); if(!s) continue;
    const m=addNode('mushroom',s[0],s[1]);
    // fell any trees crowding the cap (including the ones in FRONT that would draw over its
    // sprite) so the bluecap stands clear in a small clearing - freeing their solid tiles too.
    G.nodes=G.nodes.filter(n=>{
      if(n.kind==='tree' && dist(n.tx,n.ty,m.tx,m.ty)<2.4){ setSolid(n.tx,n.ty,0); return false; }
      return true;
    });
  }
  // old orchard: apple trees in a loose ring
  const orr=mulberry32(SEED+71);
  for(let i=0;i<9;i++){
    const a=i*TAU/9+orr()*0.4, dd=2+orr()*(ZONES.orchard.r-2.5);
    const ax=Math.round(ZONES.orchard.x+Math.cos(a)*dd), ay=Math.round(ZONES.orchard.y+Math.sin(a)*dd);
    if(walkTile(tileAt(ax,ay)) && !solidAt(ax,ay)){ const n=addNode('apple',ax,ay); n.hp=n.maxhp=2; }
  }
  // The Castaway's Cache: a lonely islet due south, out past the driftwood
  // beach, that you can only reach by floating the shallow lane to it on the
  // wind-sail. A prize for the player who spots the light water and follows it.
  {
    const ix=26, iy=101;
    G.nodes = G.nodes.filter(n=>dist(n.x,n.y,ix,iy)>2.4);   // keep the tiny islet clear
    G.decor.push({kind:'chest', x:ix+0.5, y:iy+0.3, opened:false, rich:28});
    setSolid(ix, iy, 1);
    G.decor.push({kind:'stump',  x:ix-1.3, y:iy-1.0});
    G.decor.push({kind:'tuft',   x:ix-1.1, y:iy+1.0, ph:0.7});
    G.decor.push({kind:'flower', x:ix+1.3, y:iy-0.6, ph:2.1, c:'#ffd76a'});
  }
  // smuggler's cove: an abandoned camp - a nest of slimes has oozed in where the
  // old wolf pack used to den (the isle's wolves were cleared out)
  const cv2=ZONES.cove;
  G.decor.push({kind:'stump',x:cv2.x-1.5,y:cv2.y+1.5});
  G.decor.push({kind:'stump',x:cv2.x+2.5,y:cv2.y+2});
  addBuilding('lamp', Math.floor(cv2.x), Math.floor(cv2.y+1),'');
  G.decor.push({kind:'chest',x:cv2.x+1.5,y:cv2.y-0.5,opened:false});
  setSolid(Math.floor(cv2.x+1),Math.floor(cv2.y-1),1);
  spawnMob('slime',Math.floor(cv2.x-2),Math.floor(cv2.y-1));
  spawnMob('slime',Math.floor(cv2.x+3),Math.floor(cv2.y+3));
  spawnMob('slime',Math.floor(cv2.x-1),Math.floor(cv2.y+4));
  // (the old readable marker-stone by the springs is gone - the hot spring itself
  // is now a place to REST: fully heal and take on a warm +10 buffer. See the
  // 'springrest' interact in 09-gameplay.js / 07-input.js.)
  // living meadow: grass tufts and wildflowers
  const gr2=mulberry32(SEED+83);
  const FLC=['#e0708a','#e8c14d','#c9d6ff','#e8855a'];
  for(let y=2;y<MAPH-2;y++) for(let x=2;x<MAPW-2;x++){
    if(tileAt(x,y)!==T.GRASS || solidAt(x,y)) continue;
    if(dist(x,y,ZONES.village.x,ZONES.village.y)<4) continue;
    const rr=gr2();
    if(rr<0.09) G.decor.push({kind:'tuft',x:x+0.2+gr2()*0.6,y:y+0.2+gr2()*0.6,ph:gr2()*TAU});
    else if(rr<0.115) G.decor.push({kind:'flower',x:x+0.2+gr2()*0.6,y:y+0.2+gr2()*0.6,ph:gr2()*TAU,c:FLC[(gr2()*4)|0]});
  }
  // beach shells along the sand
  const shr=mulberry32(SEED+61);
  let shells=0;
  for(let tries=0; tries<4000 && shells<8; tries++){
    const x=rndiR(shr,3,MAPW-4), y=rndiR(shr,3,MAPH-4);
    if(tileAt(x,y)===T.SAND && !solidAt(x,y) && !G.nodes.some(n=>n.kind==='shell'&&dist(n.tx,n.ty,x,y)<6)){
      addNode('shell',x,y); shells++;
    }
  }
  // fishing spots: shallow tiles adjacent to land. A generous cluster right off the
  // dock and south shore so the first spots are easy to find, then more scattered
  // around the whole isle (denser than before - they were too sparse to stumble on).
  const fishSpots=[[28,60],[27,64],[30,65],[24,61],[26,62],[29,63],[25,63],[32,63],[23,59],[31,66],[26,59],[33,64],[22,62]];
  for(const [x,y] of fishSpots){ if(tileAt(x,y)<=T.SHALLOW){ const n=addNode('fish',x,y); n.bob=Math.random()*TAU; } }
  let placed=0; const fr=mulberry32(SEED+21);
  for(let tries=0; tries<6000 && placed<14; tries++){
    const x=rndiR(fr,3,MAPW-4), y=rndiR(fr,3,MAPH-4);
    if(tileAt(x,y)===T.SHALLOW){
      let land=false; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(walkTile(tileAt(x+dx,y+dy))) land=true;
      if(land && !G.nodes.some(n=>n.kind==='fish'&&dist(n.tx,n.ty,x,y)<5)){ const n=addNode('fish',x,y); n.bob=Math.random()*TAU; placed++; }
    }
  }
  // A quiet fishing cove on the isle's SOUTH-EAST shore, down past the orchard - a tight
  // cluster of spots so Finn the Fisher's new haunt reads as a proper fishing hole, with
  // water right at hand for the rod he gives you. ZONES.sefish marks the shore tile he
  // stands on, so spawnNPCs can seat Finn right by his lines (see js/04-data.js).
  let seLand=null, sePlaced=0; const sef=mulberry32(SEED+55);
  for(let tries=0; tries<9000 && sePlaced<5; tries++){
    const x=rndiR(sef,68,MAPW-4), y=rndiR(sef,68,MAPH-4);   // SE quadrant only
    if(tileAt(x,y)===T.SHALLOW){
      let land=null; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(walkTile(tileAt(x+dx,y+dy))) land=[x+dx,y+dy];
      if(land && !G.nodes.some(n=>n.kind==='fish'&&dist(n.tx,n.ty,x,y)<4)){
        const n=addNode('fish',x,y); n.bob=Math.random()*TAU; sePlaced++;
        if(!seLand) seLand=land;
      }
    }
  }
  ZONES.sefish = seLand ? {x:seLand[0], y:seLand[1]} : {x:ZONES.orchard.x+6, y:ZONES.orchard.y+4};
  // ruin pillars & crypt platform - just a single pair framing the King's ground
  // at the northern spit (kept sparse so the ruin reads clean, not cluttered)
  const pillars=[[43,9],[49,9]];
  for(const [x,y] of pillars){ G.decor.push({kind:'pillar',x:x+0.5,y:y+0.5,broken:r()<0.5}); setSolid(x,y,1); }
  // a ruined stone arch framing the King's ground - scenery only (noRead), so no
  // "Read" prompt competes for your attention mid-boss-fight
  G.decor.push({kind:'crypt',x:46.5,y:8.5,noRead:true});
  // the crypt is solid stone, not a doorway - wall off its base so you can't walk
  // through the arch. A tight block seated at the northern tip, behind where the
  // King rises (46,10), so it blocks the mausoleum without fencing off the arena floor.
  for(let dy=7;dy<=8;dy++) for(let dx=45;dx<=47;dx++) setSolid(dx,dy,1);
  // warning-boards hammered into the grass before the cursed ground
  for(const [wx,wy] of [[43,27],[49,28],[46,24]]){
    const sp=findOpenNear(wx,wy,2);
    if(sp) G.decor.push({kind:'warnsign',x:sp[0]+0.5,y:sp[1]+0.5});
  }
  // buildings
  addBuilding('house', 44,54, 'Maren\'s cottage').closedMsg='<b>Maren\'s cottage</b> is dark, but for one candle. “Come back at a decent hour, castaway,” the Elder calls, not unkindly.';
  addBuilding('forge', 58,55, 'The forge').closedMsg='The <b>forge</b> is banked for the night - coals glowing low. “Iron\'s cold till dawn,” Bram grunts from his cot.';
  addBuilding('barn',  63,66, 'Willa\'s barn').closedMsg='<b>Willa\'s barn</b> is shut and the cows are asleep. Something inside purrs, then goes quiet.';
  addBuilding('tower', 56,33, 'Orin\'s tower').tall=true;   // Orin's tower stands twice as tall on Emberwick
  addBuilding('well',  48,58, 'Village well');
  addBuilding('boat',  25.5,62.5,'');
  addBuilding('lamp', 46,57,''); addBuilding('lamp', 50,59,''); addBuilding('lamp',51,56,'');
  addBuilding('lamp', 54,56,''); addBuilding('lamp', 56,54,'');   // the lantern trail on out to Bram's forge
  addBuilding('lamp', 30,62,''); addBuilding('lamp', 60,64,'');   // the second lamp lights the lane down to Willa's farm
  // hidden loot caches for explorers
  for(const spot of [[72,38],[26,44],[57,72]]){
    const sp=findOpenNear(spot[0],spot[1],4);
    if(sp){ G.decor.push({kind:'chest',x:sp[0]+0.5,y:sp[1]+0.5,opened:false}); setSolid(sp[0],sp[1],1); }
  }
}
function rndiR(r,a,b){ return a+Math.floor(r()*(b-a+1)); }
function findOpenNear(x,y,rad){
  for(let d=0;d<=rad;d++) for(let dy=-d;dy<=d;dy++) for(let dx=-d;dx<=d;dx++){
    const xx=x+dx, yy=y+dy;
    if(inb(xx,yy) && walkTile(tileAt(xx,yy)) && !solidAt(xx,yy) && tileAt(xx,yy)!==T.PATH) return [xx,yy];
  }
  return null;
}
function addBuilding(kind,x,y,label){
  const b={kind,x:x+0.5,y:y+0.5,label};
  G.decor.push(b);
  // Footprints are [width,depth]. The sprites are ~2.7 tiles wide and centred on
  // the base tile, but a [2,2] block only covered the west + base columns, leaving
  // the EAST half of the house with no collision (you could walk in through that
  // side). Widen the broad residential sprites to a symmetric 3-wide base so the
  // whole visible base is solid; the front (south) row stays open so the door is
  // still reachable.
  // castle widened to [8,4]: the keep sprite's stone base is far broader than the old
  // [6,3] block, which left the towers and curtain wall as thin air you could stroll through.
  const fp = {house:[3,2],house2:[3,2],igloo:[3,2],forge:[3,2],barn:[3,2],tower:[2,2],castle:[8,4],hut:[2,2],stormhut:[2,2],volcano:[6,3],well:[1,1],boat:[0,0],lamp:[0,0],crypt:[0,0],resort:[6,4],windmill:[3,3],waterwheel:[4,3],fruitstand:[1,1],stall:[1,1],bazaar:[1,1]}[kind]||[0,0];
  for(let dy=0;dy<fp[1];dy++) for(let dx=0;dx<fp[0];dx++) setSolid(Math.floor(x)+dx-Math.floor(fp[0]/2), Math.floor(y)+dy-Math.floor(fp[1]/2), 1);
  return b;
}
function bakeSolids(){
  // water & map edge solid
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const t=tileAt(x,y);
    if(t===T.DEEP || t===T.SHALLOW) setSolid(x,y,1);
  }
  // planks walkable
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++) if(tileAt(x,y)===T.PLANK) setSolid(x,y,0);
}
