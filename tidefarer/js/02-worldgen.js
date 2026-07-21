/* =====================================================================
   WORLD GENERATION
   ===================================================================== */
let SEED = 20260715;
let ZONES = {
  springs:{x:22, y:34, r:5, name:'Ember Springs'},
  cove:   {x:82, y:24, r:6, name:"Smuggler's Cove"},
  orchard:{x:72, y:74, r:6, name:'Old Orchard'},
  village:{x:48,y:58,r:9,  name:'Emberwick Village'},
  farm:   {x:60,y:63,r:5,  name:'Willa\'s Farm'},
  dock:   {x:31,y:62,r:5,  name:'Driftwood Dock'},
  tower:  {x:57,y:35,r:4,  name:'Orin\'s Tower'},
  ruins:  {x:46,y:20,r:9,  name:'Old Ruins'},
  meadow: {x:69,y:49,r:7,  name:'Slime Meadow'},
  forest: {x:33,y:38,r:9,  name:'Whisperwood'}
};

/* The Hollow King's arena, at the isle's cold northern tip. The ruins reach
   far north; a stretch of open grass and a few warning-boards lead up to a
   fire-gate that seals the hero in once the King rises. Computed in
   shapeHollowKingApproach() and read by the fire mechanic in 09-gameplay. */
let HOLLOW_GATE = [];              // walkable tiles across the ruin mouth (the seal)
const HOLLOW_GATEY = 21;           // the gate row - grass approach lies just south
let HOLLOW_MINX = 99, HOLLOW_MAXX = -99;

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
  // paths
  const V=ZONES.village;
  carveLine(V.x,V.y, ZONES.dock.x+1,62, T.PATH,0);
  carveLine(V.x+2,V.y+1, ZONES.farm.x-1,ZONES.farm.y-1, T.PATH,0);
  carveLine(V.x+3,V.y-2, ZONES.meadow.x-3,ZONES.meadow.y, T.PATH,0);
  carveLine(V.x,V.y-3, ZONES.tower.x,ZONES.tower.y+2, T.PATH,0);
  carveLine(ZONES.tower.x,ZONES.tower.y-2, ZONES.ruins.x,ZONES.ruins.y+6, T.PATH,0);
  // farm soil plots (3 x 3 grid of plots with walking gaps)
  G.plots = [];
  for(let py=0;py<2;py++) for(let px=0;px<4;px++){
    const x = 58+px, y = 62+py*2;
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
  shapeHollowKingApproach();
}

/* Reshape the northern ruins into the Hollow King's approach:
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
  if(typeof HOLLOW_FIRE!=='undefined'){ HOLLOW_FIRE.active=false; HOLLOW_FIRE.t=0; }
}

/* ---- object placement ---- */
function blockedZone(x,y){
  for(const k in ZONES){ const z=ZONES[k];
    if((k==='village'||k==='farm'||k==='dock'||k==='tower'||k==='meadow'||k==='ruins') && dist(x,y,z.x,z.y)<z.r) return true; }
  return false;
}
function addNode(kind,x,y){
  // trees & rocks start at 5 hp (was 3) so a green woodcutter/miner needs an
  // extra swing or two; the per-hit power still climbs with skill, so mastery
  // brings them back down to one or two hits.
  const n = {kind,x:x+0.5,y:y+0.5,tx:x,ty:y,hp:5,maxhp:5,dead:false,respawn:0,
             variant:rndi(0,2), sway:Math.random()*TAU};
  if(kind==='tree' && tileAt(x,y)===T.FOREST && Math.random()<0.35){ n.big=true; n.hp=n.maxhp=6; }
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
    const p = (t===T.FOREST)?0.20:0.045;
    if(r()<p) addNode('tree',x,y);
  }
  // rock outcrops: cluster along ruins road + scattered
  const rockSpots = [[52,47],[53,48],[51,49],[54,46],[52,45],[44,30],[47,31],[58,42],[40,50],[63,55],[70,42],[38,28]];
  for(const [x,y] of rockSpots){ if(walkTile(tileAt(x,y)) && !solidAt(x,y)){ if(tileAt(x,y)===T.PATH) continue; addNode('rock',x,y);} }
  const rr = mulberry32(SEED+13);
  for(let i=0;i<26;i++){ const x=rndiR(rr,4,MAPW-5), y=rndiR(rr,4,MAPH-5);
    if((tileAt(x,y)===T.GRASS||tileAt(x,y)===T.FOREST) && !blockedZone(x,y) && !solidAt(x,y) && rr()<0.7) addNode('rock',x,y); }
  // bluecap mushrooms in the Whisperwood
  const shroomSpots = [[30,36],[35,41],[28,40],[36,34],[31,44],[38,39],[26,35]];
  for(const [x,y] of shroomSpots){ const s=findOpenNear(x,y,3); if(s) addNode('mushroom',s[0],s[1]); }
  // old orchard: apple trees in a loose ring
  const orr=mulberry32(SEED+71);
  for(let i=0;i<9;i++){
    const a=i*TAU/9+orr()*0.4, dd=2+orr()*(ZONES.orchard.r-2.5);
    const ax=Math.round(ZONES.orchard.x+Math.cos(a)*dd), ay=Math.round(ZONES.orchard.y+Math.sin(a)*dd);
    if(walkTile(tileAt(ax,ay)) && !solidAt(ax,ay)){ const n=addNode('apple',ax,ay); n.hp=n.maxhp=2; }
  }
  // smuggler's cove: an abandoned camp - wolves keep it now
  const cv2=ZONES.cove;
  G.decor.push({kind:'stump',x:cv2.x-1.5,y:cv2.y+1.5});
  G.decor.push({kind:'stump',x:cv2.x+2.5,y:cv2.y+2});
  addBuilding('lamp', Math.floor(cv2.x), Math.floor(cv2.y+1),'');
  G.decor.push({kind:'chest',x:cv2.x+1.5,y:cv2.y-0.5,opened:false});
  setSolid(Math.floor(cv2.x+1),Math.floor(cv2.y-1),1);
  spawnMob('wolf',Math.floor(cv2.x-2),Math.floor(cv2.y-1));
  spawnMob('wolf',Math.floor(cv2.x+3),Math.floor(cv2.y+3));
  spawnMob('wolf',Math.floor(cv2.x-1),Math.floor(cv2.y+4));
  // springs: an old marker stone with its own story
  G.decor.push({kind:'pillar',x:ZONES.springs.x+2.8,y:ZONES.springs.y+0.5,broken:false,loreKey:'springs'});
  setSolid(Math.floor(ZONES.springs.x+2.3),Math.floor(ZONES.springs.y),1);
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
  // fishing spots: shallow tiles adjacent to land
  const fishSpots=[[28,60],[27,64],[30,65],[24,61]];
  for(const [x,y] of fishSpots){ if(tileAt(x,y)<=T.SHALLOW){ const n=addNode('fish',x,y); n.bob=Math.random()*TAU; } }
  let placed=0; const fr=mulberry32(SEED+21);
  for(let tries=0; tries<4000 && placed<7; tries++){
    const x=rndiR(fr,3,MAPW-4), y=rndiR(fr,3,MAPH-4);
    if(tileAt(x,y)===T.SHALLOW){
      let land=false; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(walkTile(tileAt(x+dx,y+dy))) land=true;
      if(land && !G.nodes.some(n=>n.kind==='fish'&&dist(n.tx,n.ty,x,y)<7)){ const n=addNode('fish',x,y); n.bob=Math.random()*TAU; placed++; }
    }
  }
  // ruin pillars & crypt platform - clustered around the King's northern spit,
  // with a pair framing the fire-gate at the ruin's mouth
  const pillars=[[43,9],[49,9],[41,13],[51,13],[43,17],[49,17],[39,20],[53,20]];
  for(const [x,y] of pillars){ G.decor.push({kind:'pillar',x:x+0.5,y:y+0.5,broken:r()<0.5}); setSolid(x,y,1); }
  G.decor.push({kind:'crypt',x:46.5,y:8.5}); // visual arch behind the King, at the isle's tip
  // warning-boards hammered into the grass before the cursed ground
  for(const [wx,wy] of [[43,27],[49,28],[46,24]]){
    const sp=findOpenNear(wx,wy,2);
    if(sp) G.decor.push({kind:'warnsign',x:sp[0]+0.5,y:sp[1]+0.5});
  }
  // buildings
  addBuilding('house', 44,54, 'Maren\'s cottage').closedMsg='<b>Maren\'s cottage</b> is dark, but for one candle. “Come back at a decent hour, castaway,” the Elder calls, not unkindly.';
  addBuilding('forge', 58,55, 'The forge').closedMsg='The <b>forge</b> is banked for the night - coals glowing low. “Iron\'s cold till dawn,” Bram grunts from his cot.';
  addBuilding('house2',44,61, 'Fisher row');
  addBuilding('barn',  62,60, 'Willa\'s barn').closedMsg='<b>Willa\'s barn</b> is shut and the cows are asleep. Something inside purrs, then goes quiet.';
  addBuilding('tower', 56,33, 'Orin\'s tower').tall=true;   // Orin's tower stands twice as tall on Emberwick
  addBuilding('well',  48,58, 'Village well');
  addBuilding('boat',  25.5,62.5,'');
  addBuilding('house2', 39,57, 'The Ember Hearth (Inn)');
  addBuilding('lamp', 41,58.5,'');
  addBuilding('lamp', 46,57,''); addBuilding('lamp', 50,59,''); addBuilding('lamp',51,56,'');
  addBuilding('lamp', 54,56,''); addBuilding('lamp', 56,54,'');   // the lantern trail on out to Bram's forge
  addBuilding('lamp', 30,62,''); addBuilding('lamp', 59,62,'');
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
  const fp = {house:[2,2],house2:[2,2],igloo:[2,2],forge:[2,2],barn:[3,2],tower:[2,2],castle:[6,3],hut:[2,2],volcano:[6,3],well:[1,1],boat:[0,0],lamp:[0,0],crypt:[0,0],resort:[6,4],windmill:[3,3],waterwheel:[4,3],fruitstand:[1,1],stall:[1,1],bazaar:[1,1]}[kind]||[0,0];
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
