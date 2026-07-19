/* =====================================================================
   WORLD LAYER - tutorial isle, the mainland, sailing between them
   ===================================================================== */
const ISLE_ZONES = ZONES; // the tutorial isle's zones (initial)
const MAIN_ZONES = { // BARIK - ten times the home shores
  village:  {x:77, y:254, r:15, name:'Greyharbor', lv:[1,3]},
  dock:     {x:55, y:258, r:7,  name:'Harbor Docks', lv:[1,2]},
  forest:   {x:148,y:223, r:28, name:'Blackpine Reach', lv:[2,4]},
  highlands:{x:233,y:162, r:26, name:'Wolfcrag Highlands', lv:[4,7]},
  ruins:    {x:168,y:81,  r:24, name:'Barrowfield', lv:[5,8]},
  meadow:   {x:258,y:254, r:24, name:'The Mirefen', lv:[2,5]},
  tower:    {x:254,y:65,  r:11, name:'Stormwatch Peak', lv:[8,10]},
  farm:     {x:293,y:213, r:16, name:'Barik Farmsteads', lv:[1,3]},
  mines:    {x:91, y:148, r:12, name:'Old Barik Mines', lv:[3,5]},
  castle:   {x:118,y:300, r:14, name:'Barik Keep', lv:[1,1]},
  spire:    {x:196,y:332, r:8,  name:"Aelin's Spire", lv:[2,4]},
  hollow:   {x:162,y:148, r:6,  name:"Thieves' Hollow", lv:[7,7]},
  desert:   {x:300,y:112, r:32, name:'Sunscour Valley', lv:[11,14]},
  undermaw: {x:212,y:196, r:8,  name:'The Undermaw', lv:[10,13]},
  vael:     {x:318,y:40,  r:20, name:'The Vael March', lv:[11,14]}
};
const EAST_ZONES = {
  dock:    {x:44, y:120, r:6,  name:'Palm Cove', lv:[0,0]},
  village: {x:74, y:106, r:10, name:'Kohana Village', lv:[0,0]},
  grove:   {x:116,y:116, r:11, name:'Palmwatch Grove', lv:[4,6]},
  volcano: {x:88, y:52,  r:22, name:'Mount Kea', lv:[6,8]},
  caldera: {x:88, y:50,  r:5,  name:'The Caldera', lv:[7,9]},
  reef:    {x:150,y:84,  r:8,  name:'Windward Reef', lv:[0,0]}
};
const WIND_ZONES = {
  dock:   {x:42, y:122, r:6,  name:'Windsurf Harbor', lv:[0,0]},
  town:   {x:66, y:100, r:12, name:'Windsurf City', lv:[0,0]},
  market: {x:82, y:94,  r:6,  name:'Trade Row', lv:[0,0]},
  resort: {x:44, y:82,  r:8,  name:'The Breakers Resort', lv:[0,0]},
  mill:   {x:100,y:72,  r:6,  name:'Millward Rise', lv:[0,0]},
  wheel:  {x:58, y:68,  r:5,  name:'Waterwheel Row', lv:[0,0]},
  bluffs: {x:114,y:112, r:12, name:'Windward Bluffs', lv:[0,0]}
};
const WORLD_DEFS = {
  isle:{ W:112, H:112, seed:20260715, zones:ISLE_ZONES,
    spawn:{x:32.5,y:61.5}, title:'EMBERWICK ISLE', sub:'HOME SHORES - CHAPTER I',
    gen:()=>genIsleAll() },
  main:{ W:355, H:355, seed:99177, zones:MAIN_ZONES,
    spawn:{x:57.5,y:259.5}, title:'BARIK', sub:'CHAPTER II - THE WILD SHORES',
    gen:()=>genMainAll() },
  east:{ W:176, H:176, seed:44721, zones:EAST_ZONES,
    spawn:{x:44.5,y:120.5}, title:'THE SUNWARD ISLE', sub:'CHAPTER III - PALMS, ASH, AND OPEN WATER',
    gen:()=>genEastAll() },
  wind:{ W:150, H:150, seed:73310, zones:WIND_ZONES,
    spawn:{x:42.5,y:122.5}, title:'WINDSURF ISLE', sub:'AN INDUSTRIOUS CITY BEYOND TREACHEROUS WATER',
    gen:()=>genWindAll() }
};
const WORLDS = {}; // cached generated worlds

function addCrowsFor(){
  G.crows.length=0;
  for(let i=0;i<5;i++) G.crows.push({cx:ZONES.ruins.x,cy:ZONES.ruins.y,r:rnd(2.5,6),h:rnd(90,140),
    ph:Math.random()*TAU,spd:rnd(0.25,0.45)*(Math.random()<0.5?-1:1)});
  for(let i=0;i<2;i++) G.crows.push({cx:ZONES.tower.x,cy:ZONES.tower.y,r:rnd(2,4),h:rnd(110,150),
    ph:Math.random()*TAU,spd:rnd(0.25,0.4)});
}
function genIsleAll(){
  genWorld();
  // the harbor channel: open ocean reaches the boat (no more landlocked ship)
  for(let x=0;x<=27;x++){
    setTile(x,62,T.DEEP); setTile(x,63,T.DEEP);
    if(tileAt(x,61)!==T.DEEP) setTile(x,61,T.SHALLOW);
    if(tileAt(x,64)!==T.DEEP) setTile(x,64,T.SHALLOW);
  }
  for(let dy=-1;dy<=1;dy++) for(let dx=-2;dx<=1;dx++) setTile(25+dx,62+dy,T.DEEP);
  bakeSolids(); placeObjects(); buildFoam();
  if(P.projects && P.projects.lanes) placeLaneLamps();
  ensureGravelord(false);
  spawnNPCs(); spawnMobs();
  // the Woodworker's woodpile - split logs always stacked to the same five-point
  // figure. The very same mark rides on the castaway's necklace. (Clue, hour one.)
  G.decor.push({kind:'woodpile', x:56.3, y:50.6, crest:true});
  setSolid(56,50,1);
  addCrowsFor();
  const fg=G.decor.find(b=>b.kind==='forge'); G.forgePos = fg? {x:fg.x,y:fg.y} : null;
  buildMapBase();
}

/* ---------- the mainland: bigger, wilder, meaner ---------- */
function genMainland(){
  const hN=makeNoise(SEED,11), mN=makeNoise(SEED+77,8), vR=mulberry32(SEED+3);
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const nx=x/MAPW, ny=y/MAPH;
    const d=dist(x,y,MAPW/2,MAPH/2)/(MAPW*0.52);
    let h=hN(nx,ny)*0.68 + hN(nx*2.6,ny*2.6)*0.32;
    h-=Math.pow(d,2.0)*0.9;
    let t;
    if(h<0.18) t=T.DEEP; else if(h<0.255) t=T.SHALLOW; else if(h<0.30) t=T.SAND;
    else t=(mN(nx,ny)>0.52)?T.FOREST:T.GRASS;
    G.map[y*MAPW+x]=t; G.variant[y*MAPW+x]=Math.floor(vR()*4);
  }
  carveDisc(ZONES.village.x,ZONES.village.y,ZONES.village.r,T.GRASS,false);
  carveDisc(ZONES.dock.x+2,ZONES.dock.y,3,T.SAND,false);
  carveDisc(ZONES.forest.x,ZONES.forest.y,ZONES.forest.r+3,T.FOREST,false);
  carveDisc(ZONES.meadow.x,ZONES.meadow.y,ZONES.meadow.r,T.GRASS,false);
  carveDisc(ZONES.highlands.x,ZONES.highlands.y,ZONES.highlands.r,T.GRASS,false);
  carveDisc(ZONES.ruins.x,ZONES.ruins.y,ZONES.ruins.r,T.RUIN,false);
  carveDisc(ZONES.tower.x,ZONES.tower.y,ZONES.tower.r,T.RUIN,false);
  carveDisc(ZONES.farm.x,ZONES.farm.y,ZONES.farm.r,T.GRASS,false);
  carveDisc(ZONES.mines.x,ZONES.mines.y,ZONES.mines.r,T.RUIN,false);
  carveDisc(ZONES.castle.x,ZONES.castle.y,ZONES.castle.r,T.PATH,false);   // keep courtyard
  carveDisc(ZONES.spire.x,ZONES.spire.y,ZONES.spire.r,T.GRASS,false);
  carveDisc(ZONES.desert.x,ZONES.desert.y,ZONES.desert.r,T.SAND,false);   // Sunscour
  carveDisc(ZONES.desert.x-14,ZONES.desert.y+16,16,T.SAND,false);
  carveDisc(ZONES.desert.x+15,ZONES.desert.y-14,15,T.SAND,false);
  carveDisc(ZONES.undermaw.x,ZONES.undermaw.y,ZONES.undermaw.r,T.RUIN,false); // the scar
  carveDisc(ZONES.vael.x,ZONES.vael.y,ZONES.vael.r,T.RUIN,false);         // burned march
  // farmsteads: tilled soil strips
  for(let i=0;i<7;i++){
    const fx=ZONES.farm.x-8+((i%3)*6), fy=ZONES.farm.y-6+(Math.floor(i/3)*5);
    for(let dy=0;dy<3;dy++) for(let dx=0;dx<4;dx++) setTile(fx+dx,fy+dy,T.SOIL);
  }
  // mirefen: sodden soil blotches
  const mr=mulberry32(SEED+5);
  for(let i=0;i<90;i++){ const a=mr()*TAU, dd=mr()*ZONES.meadow.r;
    const x=Math.round(ZONES.meadow.x+Math.cos(a)*dd), y=Math.round(ZONES.meadow.y+Math.sin(a)*dd);
    carveDisc(x,y,1+Math.floor(mr()*2),T.SOIL,true); }
  // harbor bay + long docks
  const D=ZONES.dock;
  carveDisc(D.x-5,D.y,6,T.DEEP,false);
  for(let y=D.y-7;y<=D.y+7;y++) for(let x=D.x-12;x<=D.x+4;x++){
    if(tileAt(x,y)===T.DEEP&&(walkTile(tileAt(x+1,y))||walkTile(tileAt(x-1,y))||walkTile(tileAt(x,y+1))||walkTile(tileAt(x,y-1)))) setTile(x,y,T.SHALLOW);
  }
  for(let x=D.x-4;x<=D.x+2;x++){ setTile(x,D.y,T.PLANK); setTile(x,D.y+1,T.PLANK); }
  // ---- the King's Causeways ----
  // The road carver only paves existing land, so broken coastline used to snap
  // the network apart (the landing itself was an islet). Every road segment now
  // first lays a sand causeway across any water on its line, then paves it.
  function landBridge(x0,y0,x1,y1){
    const steps=Math.ceil(dist(x0,y0,x1,y1))*2, laid=[];
    for(let i=0;i<=steps;i++){
      const x=Math.round(lerp(x0,x1,i/steps)), y=Math.round(lerp(y0,y1,i/steps));
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
        if(Math.abs(dx)+Math.abs(dy)>1) continue;
        if(inb(x+dx,y+dy) && !walkTile(tileAt(x+dx,y+dy))){ setTile(x+dx,y+dy,T.SAND); laid.push([x+dx,y+dy]); }
      }
    }
    // lap shallow water against new sand so causeways read as natural spits
    for(const [lx,ly] of laid) for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++)
      if(inb(lx+dx,ly+dy) && tileAt(lx+dx,ly+dy)===T.DEEP) setTile(lx+dx,ly+dy,T.SHALLOW);
  }
  // the King's Road (final segment is new: the war-road to the Vael March)
  const V=ZONES.village;
  const ROADS=[
    [D.x+2,D.y, V.x,V.y],
    [V.x,V.y, ZONES.forest.x,ZONES.forest.y+4],
    [ZONES.forest.x,ZONES.forest.y-4, ZONES.highlands.x-4,ZONES.highlands.y+4],
    [ZONES.highlands.x,ZONES.highlands.y-4, ZONES.ruins.x+6,ZONES.ruins.y+4],
    [V.x+3,V.y+2, ZONES.meadow.x-4,ZONES.meadow.y-2],
    [ZONES.ruins.x+4,ZONES.ruins.y-4, ZONES.tower.x-2,ZONES.tower.y+3],
    [ZONES.meadow.x+4,ZONES.meadow.y-6, ZONES.farm.x-4,ZONES.farm.y+4],
    [ZONES.forest.x-8,ZONES.forest.y-10, ZONES.mines.x+4,ZONES.mines.y+4],
    [V.x+4,V.y+6, ZONES.castle.x-6,ZONES.castle.y-4],
    [ZONES.castle.x+6,ZONES.castle.y+4, ZONES.spire.x-3,ZONES.spire.y-2],
    [ZONES.highlands.x+6,ZONES.highlands.y-8, ZONES.desert.x-16,ZONES.desert.y+12],
    [ZONES.meadow.x-4,ZONES.meadow.y-10, ZONES.undermaw.x+2,ZONES.undermaw.y+4],
    [ZONES.desert.x+2,ZONES.desert.y-24, ZONES.vael.x-4,ZONES.vael.y+8]
  ];
  for(const r of ROADS) landBridge(r[0],r[1],r[2],r[3]);
  for(const r of ROADS) carveLine(r[0],r[1],r[2],r[3], T.PATH,0);
  // ambush knolls on the long spire road - guaranteed dry ground for the packs below
  carveDisc(150,316,5,T.GRASS,false); carveDisc(172,325,5,T.GRASS,false);
  // the brigands' pines, north of Blackpine
  carveDisc(162,148,7,T.FOREST,false); carveDisc(162,148,3,T.GRASS,false);
  landBridge(ZONES.forest.x,ZONES.forest.y-4, 162,151);
  carveLine(ZONES.forest.x,ZONES.forest.y-4, 162,151, T.PATH,0);
  // the east cove, so Corvo's shore can be walked
  carveDisc(331,245,4,T.SAND,false);
  landBridge(ZONES.farm.x+4,ZONES.farm.y+3, 331,245);
  carveLine(ZONES.farm.x+4,ZONES.farm.y+3, 331,245, T.PATH,0);
  // shore cleanup
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(tileAt(x,y)===T.SHALLOW){
      let landNear=false;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) if(walkTile(tileAt(x+dx,y+dy))) landNear=true;
      if(!landNear) setTile(x,y,T.DEEP);
    }
  }
}
function placeObjectsMain(){
  const r=mulberry32(SEED+9);
  for(let y=2;y<MAPH-2;y++) for(let x=2;x<MAPW-2;x++){
    const t=tileAt(x,y);
    if(t!==T.GRASS&&t!==T.FOREST) continue;
    if(dist(x,y,ZONES.village.x,ZONES.village.y)<ZONES.village.r) continue;
    if(dist(x,y,ZONES.tower.x,ZONES.tower.y)<ZONES.tower.r) continue;
    const p=(t===T.FOREST)?0.22:0.05;
    if(r()<p) addNode('tree',x,y);
  }
  for(let i=0;i<300;i++){ const x=rndiR(r,4,MAPW-5), y=rndiR(r,4,MAPH-5);
    const t=tileAt(x,y);
    if((t===T.GRASS||t===T.FOREST||t===T.RUIN)&&!solidAt(x,y)&&r()<0.7) addNode('rock',x,y); }
  for(let i=0;i<50;i++){ const x=rndiR(r,4,MAPW-5), y=rndiR(r,4,MAPH-5);
    if(tileAt(x,y)===T.FOREST&&!solidAt(x,y)) addNode('mushroom',x,y); }
  const mnr=mulberry32(SEED+17); // the Old Mines: a rich ring of stone
  for(let i=0;i<16;i++){ const a=mnr()*TAU, dd=2+mnr()*(ZONES.mines.r-3);
    const x=Math.round(ZONES.mines.x+Math.cos(a)*dd), y=Math.round(ZONES.mines.y+Math.sin(a)*dd);
    if(walkTile(tileAt(x,y))&&!solidAt(x,y)) addNode('rock',x,y); }
  let placed=0;
  for(let tries=0;tries<12000&&placed<20;tries++){
    const x=rndiR(r,3,MAPW-4), y=rndiR(r,3,MAPH-4);
    if(tileAt(x,y)===T.SHALLOW){
      let land=false;
      for(const dxy of [[1,0],[-1,0],[0,1],[0,-1]]) if(walkTile(tileAt(x+dxy[0],y+dxy[1]))) land=true;
      if(land&&!G.nodes.some(n=>n.kind==='fish'&&dist(n.tx,n.ty,x,y)<8)){ const n=addNode('fish',x,y); n.bob=Math.random()*TAU; placed++; }
    }
  }
  // living meadow: grass tufts and wildflowers
  const gr2=mulberry32(SEED+83);
  const FLC=['#e0708a','#e8c14d','#c9d6ff','#e8855a'];
  for(let y=2;y<MAPH-2;y++) for(let x=2;x<MAPW-2;x++){
    if(tileAt(x,y)!==T.GRASS || solidAt(x,y)) continue;
    if(dist(x,y,ZONES.village.x,ZONES.village.y)<4) continue;
    const rr=gr2();
    if(rr<0.08) G.decor.push({kind:'tuft',x:x+0.2+gr2()*0.6,y:y+0.2+gr2()*0.6,ph:gr2()*TAU});
    else if(rr<0.102) G.decor.push({kind:'flower',x:x+0.2+gr2()*0.6,y:y+0.2+gr2()*0.6,ph:gr2()*TAU,c:FLC[(gr2()*4)|0]});
  }
  // beach shells on the mainland strand
  const shr=mulberry32(SEED+61);
  let shells=0;
  for(let tries=0; tries<12000 && shells<22; tries++){
    const x=rndiR(shr,3,MAPW-4), y=rndiR(shr,3,MAPH-4);
    if(tileAt(x,y)===T.SAND && !solidAt(x,y) && !G.nodes.some(n=>n.kind==='shell'&&dist(n.tx,n.ty,x,y)<7)){
      addNode('shell',x,y); shells++;
    }
  }
  // barrow stones
  const br=mulberry32(SEED+31);
  for(let i=0;i<22;i++){ const a=br()*TAU, dd=2+br()*(ZONES.ruins.r-3);
    const x=Math.round(ZONES.ruins.x+Math.cos(a)*dd), y=Math.round(ZONES.ruins.y+Math.sin(a)*dd);
    if(walkTile(tileAt(x,y))&&!solidAt(x,y)){ G.decor.push({kind:'pillar',x:x+0.5,y:y+0.5,broken:br()<0.7}); setSolid(x,y,1); } }
  // Greyharbor, port town of Barik
  const V=ZONES.village;
  addBuilding('house', V.x-3,V.y-2,"Harbor house");
  addBuilding('house2',V.x+3,V.y-3,"Warden's post");
  addBuilding('barn',  V.x+4,V.y+3,'Trade hall');
  addBuilding('house', V.x-5,V.y+3,"Sela's Provisions");
  addBuilding('house2',V.x+7,V.y,"Ivo's Herbary");
  addBuilding('house2',V.x-2,V.y+5,'The Gull & Anchor (Inn)');
  addBuilding('lamp',V.x-0.5,V.y+6,'');
  const FZ=ZONES.farm;
  addBuilding('barn', FZ.x+4,FZ.y-4,"Hedda's barn");
  addBuilding('house',FZ.x-6,FZ.y+5,'Farmhouse');
  addBuilding('lamp',FZ.x,FZ.y,'');
  const MZ=ZONES.mines;
  addBuilding('lamp',MZ.x+1,MZ.y-1,'');
  // Barik Keep - the Queen's seat
  const CK=ZONES.castle;
  addBuilding('castle', CK.x,CK.y-3,'Barik Keep - Hall of Queen Maelis');
  addBuilding('house2',CK.x-6,CK.y+2,'Keep barracks');
  addBuilding('house2',CK.x+6,CK.y+2,'Keep granary');
  addBuilding('lamp',CK.x-2,CK.y+1,''); addBuilding('lamp',CK.x+2,CK.y+1,'');
  G.decor.push({kind:'pillar',x:CK.x-4.5,y:CK.y-1.5,broken:false}); setSolid(CK.x-5,CK.y-2,1);
  G.decor.push({kind:'pillar',x:CK.x+4.5,y:CK.y-1.5,broken:false}); setSolid(CK.x+4,CK.y-2,1);
  // Aelin's Spire - the magic tower
  const SP=ZONES.spire;
  addBuilding('tower', SP.x,SP.y,"Aelin's Spire - school of the weave");
  addBuilding('lamp',SP.x-2,SP.y+2,'');
  // the archery range, on Greyharbor's edge
  addBuilding('house', V.x+9,V.y+7,"Rook's Range");
  for(let i=0;i<3;i++){ G.decor.push({kind:'target',x:V.x+12+i*2,y:V.y+9+i*0.5}); setSolid(Math.floor(V.x+12+i*2),Math.floor(V.y+9+i*0.5),1); }
  // the Undermaw mouth - enter if you dare
  const UM=ZONES.undermaw;
  G.decor.push({kind:'cavemouth',x:UM.x+0.5,y:UM.y+0.5});
  addBuilding('lamp',UM.x-2,UM.y+2,'');
  // the homestead, for sale
  const FZ2=ZONES.farm;
  addBuilding('house', FZ2.x+10,FZ2.y+3,'Homestead (FOR SALE)');
  // Vael March raider camp - the war-tent is the Castellan's barred stronghold
  const VM=ZONES.vael;
  addBuilding('house2',VM.x,VM.y,'Vael war-tent').locked=1;
  // war chests in dangerous country - worth the walk, worth the wait
  for(const [wz,wlv] of [[ZONES.highlands,4],[ZONES.ruins,6],[ZONES.desert,12],[ZONES.vael,12],[ZONES.undermaw,11],[ZONES.spire,3]]){
    const wsp=findOpenNear(wz.x+3,wz.y+3,6);
    if(wsp){ G.decor.push({kind:'chest',x:wsp[0]+0.5,y:wsp[1]+0.5,opened:false,rich:wlv}); setSolid(wsp[0],wsp[1],1); }
  }
  // the brigand camp and their stolen-goods cache (it only matters once you know of it)
  addBuilding('lamp',161,147,'');
  G.decor.push({kind:'chest',x:162.5,y:146.5,opened:false,cache:1});
  // Captain Corvo's cove on the far shore; his sloop rides at anchor
  addBuilding('lamp',330,244,'');
  addBuilding('boat',338.5,249.5,'');
  // Thimble & Thread, Greyharbor's clothier
  addBuilding('house',V.x-7,V.y-1,'Thimble & Thread (Clothier)');
  // a hermit hides in the deep pines - chop through the ring to find him
  { const HX=ZONES.forest.x+9, HY=ZONES.forest.y-7;
    carveDisc(HX,HY,4,T.FOREST,false);
    for(let hy=-3;hy<=3;hy++) for(let hx=-3;hx<=3;hx++){
      const hr=Math.hypot(hx,hy);
      if(hr>1.4 && hr<=3.2) addNode('tree',HX+hx,HY+hy);
      else if(hr<=1.4) setSolid(HX+hx,HY+hy,0);
    }
  }
  G.decor.push({kind:'pillar',x:VM.x-3.5,y:VM.y+2.5,broken:true}); setSolid(VM.x-4,VM.y+2,1);
  G.decor.push({kind:'pillar',x:MZ.x-1.5,y:MZ.y+0.5,broken:true}); setSolid(MZ.x-2,MZ.y,1);
  G.decor.push({kind:'pillar',x:MZ.x+2.5,y:MZ.y+1.5,broken:false}); setSolid(MZ.x+2,MZ.y+1,1);
  addBuilding('lamp',V.x-1,V.y-1,''); addBuilding('lamp',V.x+2,V.y+1,'');
  addBuilding('lamp',ZONES.dock.x+3,ZONES.dock.y-1,''); addBuilding('lamp',ZONES.dock.x+3,ZONES.dock.y+2,'');
  addBuilding('boat', ZONES.dock.x-5.5,ZONES.dock.y+0.5,'');
  // the relic chest on Stormwatch Peak
  G.decor.push({kind:'chest',x:ZONES.tower.x+0.5,y:ZONES.tower.y+0.5,opened:false,relic:true});
  setSolid(ZONES.tower.x,ZONES.tower.y,1);
  // scattered loot caches
  const cr=mulberry32(SEED+55);
  for(const zk of ['forest','highlands','ruins','meadow','farm','mines']){
    const z=ZONES[zk], a=cr()*TAU, dd=2+cr()*(z.r-2);
    const sp=findOpenNear(Math.round(z.x+Math.cos(a)*dd),Math.round(z.y+Math.sin(a)*dd),4);
    if(sp){ G.decor.push({kind:'chest',x:sp[0]+0.5,y:sp[1]+0.5,opened:false}); setSolid(sp[0],sp[1],1); }
  }
}
function spawnNPCsMain(){
  const V=ZONES.village;
  G.npcs.push(makeNPC('kell','Warden Kell', V.x+2.5,V.y-1,
    {skin:'#caa27b',hair:'#2e2a28',shirt:'#4a3f52',pants:'#2f2b33',hat:'hood',pauldrons:true,trim:'#8a8f9a',cloak:'#3a3542',armor:1},
    ["Mind the roads, stranger. The wilds here don't forgive.",
     "Elites wear a crimson ring. You'll know them when they charge."],1.5));
  const fz=ZONES.forest;
  const ms=findOpenNear(fz.x,fz.y+2,5);
  if(ms) G.npcs.push(makeNPC('moss','Moss the Hermit', ms[0],ms[1],
    {skin:'#c9b184',hair:'#6e7a5a',shirt:'#4f6032',pants:'#3a4228',robe:'#465a38',trim:'#8a9a6a',
     beard:'#8a9a7a',beardLong:true,hairstyle:'bald'},
    ["The pines talk, you know. Mostly complaints.",
     "I came out here for quiet. The wolves had other ideas.",
     "Bluecaps glow brightest the night after rain."],0.8));
  G.npcs.push(makeNPC('dockhand','Old Piety', ZONES.dock.x+2.5,ZONES.dock.y-0.5,
    {skin:'#b98f68',hair:'#a8a099',shirt:'#5a5348',pants:'#3a352c',hat:'straw',beard:'#a8a099',beardLong:true},
    ["Emberwick? Quaint little training ground, that isle.",
     "They say a storm-relic sits atop the Peak. Guarded, of course."],1.2));
  { const dp=G.npcs.find(n=>n.id==='dockhand'); if(dp) dp.nightOwl=true; } // fishermen keep night hours
}
function spawnBarikFolk(){
  const V=ZONES.village, FZ=ZONES.farm, MZ=ZONES.mines;
  G.npcs.push(makeNPC('sela','Sela the Provisioner', V.x-4.5,V.y+1.5,
    {skin:'#d3a377',hair:'#3c2f22',shirt:'#7a4a36',pants:'#4a3a2c',apron:'#c9b48e',hairstyle:'bun'},
    ["Bread, fish, and no questions - Greyharbor's finest counter.",
     "The farmsteads east keep us fed. Mostly."],1.2));
  G.npcs.push(makeNPC('ivo','Ivo the Herbalist', V.x+6.5,V.y+1.8,
    {skin:'#c9a884',hair:'#5a6a4a',shirt:'#46603c',pants:'#35402c',robe:'#3f5a3a',trim:'#9ab87a'},
    ["Everything on Barik either heals you or bites you. I sell the first kind.",
     "Bluecaps, tonics, tidebalm. The wilds provide - I just bottle it."],1.0));
  G.npcs.push(makeNPC('hedda','Farmer Hedda', FZ.x+1.5,FZ.y+1.5,
    {skin:'#d8ab7d',hair:'#b8863e',shirt:'#8a6a3a',pants:'#5a4630',apron:'#7a5a3a',hairstyle:'bun'},
    ["Soil's good here. It's everything ELSE that's the problem.",
     "Slimes from the Mirefen eat a season's work in a night."],1.4));
  G.npcs.push(makeNPC('torv','Torv the Delver', MZ.x+1.5,MZ.y+2.5,
    {skin:'#b98f68',hair:'#3a3a3c',shirt:'#4a4440',pants:'#332f2c',beard:'#4a4a4c',armor:1},
    ["These shafts fed three generations before the wilds took the road.",
     "Stone's still down there. Just needs hands brave enough."],0.9));
}
function spawnRealmFolk(){
  const CK=ZONES.castle, SP=ZONES.spire, V=ZONES.village, VM=ZONES.vael;
  G.npcs.push(makeNPC('maelis','Queen Maelis of Barik', CK.x+0.5,CK.y+0.8,
    {skin:'#e0b088',hair:'#d8c090',shirt:'#6a3a5e',pants:'#3a2a3c',robe:'#5a2a52',trim:'#e8c860',hat:'crown',hairstyle:'long'},
    ["Barik feeds three duchies and fears one: the Vael March, north-east, where my cousin plays at war.",
     "A queen rules by ledger and by patience. The sword is for those who run out of both."],0.5));
  G.npcs.push(makeNPC('guardc1','Keep Warden', CK.x-2.5,CK.y+2.2,
    {skin:'#caa27b',hair:'#2e2a28',shirt:'#4a4f5e',pants:'#2f333c',armor:2,pauldrons:true},
    ["Her Majesty receives travelers. Mind your manners and your mud."],0.4));
  G.npcs.push(makeNPC('aelin','Aelin the Weaver', SP.x+1.5,SP.y+2.2,
    {skin:'#d0a884',hair:'#8a8aa8',shirt:'#3a3a6a',pants:'#2c2c48',robe:'#40408a',trim:'#9a9ae0',hat:'wizard',hairstyle:'long'},
    ["Magic is grammar for the world's oldest language. I teach conjugation.",
     "The Spire takes students, not worshippers. Bring coin and humility."],0.6));
  G.npcs.push(makeNPC('rook','Fletcher Rook', V.x+10.5,V.y+8.2,
    {skin:'#b98f68',hair:'#4a3a28',shirt:'#5a6a3c',pants:'#3a4228',quiver:true},
    ["Breathe out, loose, and never apologize to the target.",
     "Twenty gold buys a hundred arrows' worth of lessons."],0.8));
  G.npcs.push(makeNPC('mira','Mira the Seamstress', V.x-6.5,V.y+0.2,
    {skin:'#c9a081',hair:'#2c2030',shirt:'#5e3a6a',pants:'#3a2c44',hairstyle:'long'},
    ['Silk holds a memory of every hand that touches it.',
     'My whole shipment, taken on the north road. The pines have thieves in them now.'],0.5));
  G.npcs.push((()=>{ const cv2=makeNPC('corvo','Captain Corvo', 330.5,243.2,
    {skin:'#b98a62',hair:'#3a3634',shirt:'#3c4a5e',pants:'#2a3038',hat:'hood',hatColor:'#2f3a48'},
    ['East past the shoals sits an island the charts pretend not to see.',
     'My girl Wren turns twelve at the next full tide. I promised her something fine.'],0.3); cv2.nightOwl=true; return cv2; })());
  G.npcs.push((()=>{ const hm=makeNPC('hermit','Moss-Brother Fen', ZONES.forest.x+9.5,ZONES.forest.y-6.6,
    {skin:'#c9a27b',hair:'#9aa08a',shirt:'#4a5a3a',pants:'#3a4230',robe:'#54644a'},
    ['Sixty years the pines kept my secret. You brought an axe to a riddle - fair enough.',
     'The forest regrows what you take. Remember that about yourself, too.'],0); hm.nightOwl=true; return hm; })());
  G.npcs.push(makeNPC('bree','Goldwarden Bree', V.x+5.5,V.y+3.8,
    {skin:'#d3a377',hair:'#5a4a3a',shirt:'#4a3a5a',pants:'#332c3c',apron:'#8a7a5a',hairstyle:'bun'},
    ["The vault holds what the grave cannot take. Deposit while you breathe.",
     "Greyharbor's ledger balances daily. Unlike its taverns."],0.5));
  // The Castellan stands at the war-tent until you call him out (feud2); after
  // he's challenged he's a boss on the field, and once beaten he's gone for good.
  if(qs('feud2')!=='done' && !P.prog.vaelFought)
    G.npcs.push(makeNPC('castell','Castellan of the Vael', VM.x-6.5,VM.y+6.5,
      {skin:'#c09070',hair:'#3a3230',shirt:'#5e2a2a',pants:'#3a2020',cloakless:1,armor:1,beard:'#3a3230'},
      ["Turn back, Barik-friend. The March answers to its own crown now.",
       "The Queen's cousin pays iron for iron. You've been warned once."],0.4));
}
function spawnVaelCaptain(x,y){
  const cap=spawnMob('raidcap', x, y);
  if(cap){ cap.boss=true; cap.bigBoss=true; cap.title='CASTELLAN OF THE VAEL';
    cap.hx=x; cap.hy=y; cap.respawnT=-1; }
  return cap;
}
function challengeCastellan(npc){
  if(G.mobs && G.mobs.some(m=>m.kind==='raidcap' && !m.dead)) return;
  P.prog.vaelFought=1;
  const i=G.npcs.findIndex(n=>n.id==='castell'); if(i>=0) G.npcs.splice(i,1);
  const VM=ZONES.vael;
  const ox=Math.round(npc?npc.x:VM.x-6.5), oy=Math.round(npc?npc.y:VM.y+6.5);
  const sp=findOpenNear(ox, oy, 5) || [ox, oy];
  const cap=spawnVaelCaptain(sp[0], sp[1]);
  if(cap){ cap.state='chase'; cap.noAggroT=0; }
  banner('THE VAEL CASTELLAN','BREAK THE MARCH - PULL THE STANDARD DOWN');
  if(Snd.boss) Snd.boss(); G.shake=0.85; autoSave();
}
function spawnBarikInn(){
  const V=ZONES.village;
  const inn=makeNPC('saffi','Saffi of the Gull', V.x-1.5,V.y+6.2,
    {skin:'#caa27b',hair:'#2e2624',shirt:'#5a4a5e',pants:'#3a3340',apron:'#b8a890',hairstyle:'bun'},
    ["Sailors, wardens, wanderers - everyone sleeps under my roof eventually.",
     "Ten gold buys the best bed on Barik. The second-best is the floor."],0.8);
  inn.nightOwl=true; G.npcs.push(inn);
}
function spawnMobsMain(){
  const packs=[
    ['wolf', ZONES.highlands, 9, 0.55],
    ['skeleton', ZONES.ruins, 9, 0.6],
    ['archer', ZONES.ruins, 5, 0.35],
    ['slime', ZONES.meadow, 9, 0.45],
    ['scorpion', ZONES.desert, 10, 0.4],
    ['raider', ZONES.vael, 8, 0.45],
    ['skeleton', ZONES.undermaw, 5, 0.9],
    ['wolf',     {x:150,y:316,r:8}, 5, 0.4],   // the spire road earns its length
    ['skeleton', {x:172,y:325,r:7}, 5, 0.45],
    ['brigand',  {x:162,y:148,r:6}, 5, 0.25]   // they guard what they stole
  ];
  // practice dummies: Rook's yard by his range (dry side - the shore bites), and the Spire range.
  // findOpenNear dodges buildings, trees, and water so a dummy can never spawn wedged.
  carveDisc(Math.round(ZONES.village.x+8), Math.round(ZONES.village.y+5), 2, T.SOIL, false);
  for(const [yx,yy] of [[ZONES.village.x+7,ZONES.village.y+5],[ZONES.village.x+9,ZONES.village.y+4],
                        [ZONES.spire.x+4,ZONES.spire.y+4],[ZONES.spire.x+6,ZONES.spire.y+3]]){
    const yd=findOpenNear(Math.round(yx),Math.round(yy),5);
    if(yd) spawnMob('dummy',yd[0],yd[1]);
  }
  const pr=mulberry32(SEED+41);
  for(const [kind,z,count,eliteP] of packs){
    for(let i=0;i<count;i++){
      const a=pr()*TAU, dd=2+pr()*(z.r-3);
      const s=findOpenNear(Math.round(z.x+Math.cos(a)*dd),Math.round(z.y+Math.sin(a)*dd),4);
      if(s) spawnMob(kind,s[0],s[1], pr()<eliteP);
    }
  }
  // Greymaw dens atop Wolfcrag
  spawnMob('alpha', ZONES.highlands.x, ZONES.highlands.y-2);
  // peak guardians around the chest
  spawnMob('skeleton',ZONES.tower.x-2,ZONES.tower.y+1,true);
  spawnMob('skeleton',ZONES.tower.x+2,ZONES.tower.y+2,true);
  spawnMob('skeleton',ZONES.tower.x,ZONES.tower.y+3,true);
  // the Castellan is loose on the field again if you challenged him and left (reload)
  if(P.prog.vaelFought && qs('feud2')!=='done'){
    const VM=ZONES.vael, sp=findOpenNear(Math.round(VM.x-6.5),Math.round(VM.y+6.5),6)||[VM.x-6,VM.y+6];
    spawnVaelCaptain(sp[0],sp[1]);
  }
}
function spiralPath(cx,cy,rStart,rEnd,turns,tile){
  // an ascending switchback of PATH tiles winding from rStart in to rEnd
  const steps=Math.max(1,Math.ceil((rStart-rEnd)*turns*7));
  for(let i=0;i<=steps;i++){
    const f=i/steps, r=rStart-(rStart-rEnd)*f, a=f*turns*TAU + 1.2;
    const x=Math.round(cx+Math.cos(a)*r), y=Math.round(cy+Math.sin(a)*r*0.92);
    for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++){
      if(inb(x+dx,y+dy) && walkTile(tileAt(x+dx,y+dy))) setTile(x+dx,y+dy,tile);
    }
  }
}
function genEast(){
  const rng=mulberry32(SEED);
  const CX2=88, CY2=88, R0=58;
  const wob=[]; for(let i=0;i<64;i++) wob.push(rng()*10-5);
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const dx=x-CX2, dy=y-CY2, d=Math.hypot(dx,dy), a=Math.atan2(dy,dx);
    const wi=((Math.floor((a+Math.PI)/TAU*64))%64+64)%64;
    const rad=R0+wob[wi]+5*Math.sin(a*5+1.7);
    let t=T.DEEP;
    if(d<rad-7) t=T.GRASS; else if(d<rad-2) t=T.SAND; else if(d<rad+2) t=T.SHALLOW;
    G.map[y*MAPW+x]=t;
  }
  const V=EAST_ZONES.volcano, C=EAST_ZONES.caldera;
  // Mount Kea - a broad walkable massif of ash-rock rising over the north shore
  carveDisc(V.x, V.y, V.r, T.RUIN, true);
  // a scorched-soil apron so the rock blends down into the palms
  for(let y=V.y-V.r-4;y<=V.y+V.r+4;y++) for(let x=V.x-V.r-4;x<=V.x+V.r+4;x++){
    if(inb(x,y)){ const dd=dist(x,y,V.x,V.y);
      if(dd>V.r && dd<=V.r+3 && tileAt(x,y)===T.GRASS) setTile(x,y,T.SOIL); }
  }
  // switchback path climbing to the caldera rim
  spiralPath(V.x, V.y+2, V.r-2, C.r+1, 2.15, T.PATH);
  carveDisc(C.x, C.y, C.r-1, T.RUIN, false); // clean caldera floor (lava sits on top as decor)
  // reef sandbar offshore
  carveDisc(EAST_ZONES.reef.x,EAST_ZONES.reef.y,4,T.SAND,false);
  carveDisc(EAST_ZONES.reef.x,EAST_ZONES.reef.y,7,T.SHALLOW,true);
  // the palm grove
  carveDisc(EAST_ZONES.grove.x,EAST_ZONES.grove.y,EAST_ZONES.grove.r,T.FOREST,false);
  // village clearing & dock cove
  carveDisc(EAST_ZONES.village.x,EAST_ZONES.village.y,9,T.GRASS,false);
  carveDisc(EAST_ZONES.dock.x,EAST_ZONES.dock.y,5,T.SAND,false);
  // roads
  carveLine(EAST_ZONES.dock.x,EAST_ZONES.dock.y, EAST_ZONES.village.x,EAST_ZONES.village.y, T.PATH,0);
  carveLine(EAST_ZONES.village.x,EAST_ZONES.village.y, EAST_ZONES.grove.x,EAST_ZONES.grove.y, T.PATH,0);
  carveLine(EAST_ZONES.village.x,EAST_ZONES.village.y, V.x,V.y+V.r-1, T.PATH,0);
}
function placeObjectsEast(){
  const V=EAST_ZONES.village, D=EAST_ZONES.dock, VO=EAST_ZONES.volcano, C=EAST_ZONES.caldera;
  addBuilding('hut', V.x-4, V.y-3, 'Kohana longhut (Inn)');
  addBuilding('hut', V.x+3, V.y-4, 'Weaver hut');
  addBuilding('hut', V.x+6, V.y+1, 'Hunting hut');
  addBuilding('hut', V.x-6, V.y+2, 'Board shack');
  addBuilding('hut', V.x, V.y+5,  'Drying hut');
  addBuilding('well', V.x, V.y, 'Spring well');
  addBuilding('lamp', D.x, D.y-1, '');
  addBuilding('boat', D.x-5.5, D.y+2.5, '');
  addBuilding('lamp', V.x+9, V.y+6, '');
  // torches flanking the foot of the ash road so the climb up Mount Kea is unmistakable
  addBuilding('lamp', VO.x-3, VO.y+VO.r-1, '');
  addBuilding('lamp', VO.x+3, VO.y+VO.r-1, '');
  const pr2=mulberry32(SEED+7);
  // the grove proper: thick palms
  const GR=EAST_ZONES.grove;
  for(let gy=-GR.r;gy<=GR.r;gy++) for(let gx=-GR.r;gx<=GR.r;gx++){
    const px=GR.x+gx, py=GR.y+gy;
    if(Math.hypot(gx,gy)<=GR.r && inb(px,py) && tileAt(px,py)===T.FOREST && !solidAt(px,py) && pr2()<0.26){
      const n=addNode('tree',px,py); n.palm=1;
    }
  }
  // palms scattered across the whole isle - denser now so the smaller island still feels lush
  for(let i=0;i<360;i++){
    const ax=Math.floor(pr2()*MAPW), ay=Math.floor(pr2()*MAPH);
    const t=tileAt(ax,ay);
    if((t===T.FOREST || (t===T.GRASS&&pr2()<0.26) || (t===T.SAND&&pr2()<0.28)) && !solidAt(ax,ay)
       && dist(ax,ay,V.x,V.y)>6 && dist(ax,ay,D.x,D.y)>4 && dist(ax,ay,VO.x,VO.y)>VO.r-2){
      const n=addNode('tree',ax,ay); n.palm=1;
    }
  }
  // shells on the beaches
  for(let i=0;i<26;i++){
    const ax=Math.floor(pr2()*MAPW), ay=Math.floor(pr2()*MAPH);
    if(tileAt(ax,ay)===T.SAND && !solidAt(ax,ay)) addNode('shell',ax,ay);
  }
  // a lush frame of palms ringing the village clearing so it doesn't feel bare
  for(let i=0;i<80;i++){
    const a=pr2()*TAU, rr=8+pr2()*8;
    const ax=Math.round(V.x+Math.cos(a)*rr), ay=Math.round(V.y+Math.sin(a)*rr);
    if(inb(ax,ay) && (tileAt(ax,ay)===T.GRASS||tileAt(ax,ay)===T.FOREST) && !solidAt(ax,ay)
       && dist(ax,ay,V.x,V.y)>7.5 && dist(ax,ay,D.x,D.y)>4 && pr2()<0.72){
      const n=addNode('tree',ax,ay); n.palm=1;
    }
  }
  // friendly island critters that just wander - hens & cats about the village,
  // crabs scuttling the cove beach
  G.critters=[];
  const critter=(kind,x,y,range,col)=>{ if(!inb(x,y)||solidAt(x,y)) return;
    G.critters.push({kind,x:x+0.5,y:y+0.5,home:{x:x+0.5,y:y+0.5},tx:null,ty:null,
      wt:rnd(0.5,4),face:pr2()<0.5?-1:1,anim:pr2()*6,range:range||2.5,col,moving:false}); };
  const FOWL=['#efe7d6','#b07a44','#8a7a5e','#d8c9a0'], CRAB=['#d8492e','#e0803a','#c23a5a'];
  for(let i=0;i<9;i++){ const a=pr2()*TAU, rr=3+pr2()*6;
    critter('fowl', Math.round(V.x+Math.cos(a)*rr), Math.round(V.y+Math.sin(a)*rr), 3, FOWL[i%FOWL.length]); }
  for(let i=0;i<2;i++){ const a=pr2()*TAU, rr=2+pr2()*5;
    critter('cat', Math.round(V.x+Math.cos(a)*rr), Math.round(V.y+Math.sin(a)*rr), 3.5, '#e8933a'); }
  for(let i=0;i<8;i++){ const a=pr2()*TAU, rr=2+pr2()*6;
    const cx2=Math.round(D.x+Math.cos(a)*rr), cy2=Math.round(D.y+Math.sin(a)*rr);
    if(inb(cx2,cy2) && tileAt(cx2,cy2)===T.SAND) critter('crab', cx2, cy2, 3, CRAB[i%CRAB.length]); }
  // ash-rocks & ember-ore studding the volcano slopes (mining + the ember crystals)
  for(let i=0;i<52;i++){
    const a=pr2()*TAU, rr=6+pr2()*(VO.r-5);
    const ax=Math.round(VO.x+Math.cos(a)*rr), ay=Math.round(VO.y+Math.sin(a)*rr*0.92);
    if(inb(ax,ay) && tileAt(ax,ay)===T.RUIN && !solidAt(ax,ay) && dist(ax,ay,C.x,C.y)>C.r+1) addNode('rock',ax,ay);
  }
  // the caldera: a molten pool at the summit's heart (glowing, impassable)
  G.decor.push({kind:'lava', x:C.x+0.5, y:C.y+0.5, r:C.r-1});
  for(let y=C.y-C.r;y<=C.y+C.r;y++) for(let x=C.x-C.r;x<=C.x+C.r;x++){
    if(inb(x,y) && dist(x,y,C.x,C.y)<=C.r-1.2) setSolid(x,y,1);
  }
  // Ashwing's lair - a fissure in the caldera wall you can step into
  G.decor.push({kind:'lairmouth', x:C.x+0.5, y:C.y+C.r+1.5});
  // reef treasure
  G.decor.push({kind:'chest', x:EAST_ZONES.reef.x+0.5, y:EAST_ZONES.reef.y+0.5, opened:false, rich:8});
}
function spawnEastFolk(){
  const V=EAST_ZONES.village, D=EAST_ZONES.dock;
  G.npcs.push((()=>{ const c2=makeNPC('corvoE','Captain Corvo', D.x+1.5,D.y+1.2,
    {skin:'#b98a62',hair:'#3a3634',shirt:'#3c4a5e',pants:'#2a3038',hat:'hood',hatColor:'#2f3a48'},
    ['Wren has not taken the ribbon off since we landed.',
     'The sloop is provisioned. Say the word and we run for Barik.'],0.2); c2.nightOwl=true; return c2; })());
  G.npcs.push(makeNPC('sable','Sable of the Far Range', V.x+9.5,V.y+6.2,
    {skin:'#a97c58',hair:'#1e1a16',shirt:'#5e4a2a',pants:'#3a3026',hairstyle:'long'},
    ['Rook still owes me twenty gold. Tell him the wind remembers.',
     'A bow is a held breath. Learn to let it go.'],0.4));
  G.npcs.push(makeNPC('huk','Huk the Boarfather', V.x+5.5,V.y+1.8,
    {skin:'#8f6a48',hair:'#26201a',shirt:'#6a3a2a',pants:'#33261c'},
    ['No hurry, eh? A boar you chase today is a boar you chase tomorrow.',
     'The bristlebacks fatten on fallen coconuts. So do I - no shame in a soft life.'],0.5));
  G.npcs.push(makeNPC('kaia','Kaia the Wavewright', V.x-5.5,V.y+2.6,
    {skin:'#c99a6e',hair:'#2c2a3a',shirt:'#3a6a72',pants:'#2c3a40',hairstyle:'long'},
    ['The wind is a road, friend. Ride it easy and it carries you far.',
     'Shaped my first board at nine. The sea shaped me right back - we came out even.'],0.6));
  G.npcs.push(makeNPC('moli','Elder Moli', V.x-0.5,V.y-1.6,
    {skin:'#b58a5e',hair:'#d8d2c4',shirt:'#7a4a5e',pants:'#3a2c33'},
    ['Kea grumbles, the palms bow, the reef sings. Sit a while - let the island talk to you.',
     'Old Ashwing has warmed these waters since my mother\'s mother. Pay that robed woman no mind.'],0.7));
  // Lani keeps the Kohana longhut - rest here to mend and set your waking-place
  { const inn=makeNPC('lani','Lani of the Longhut', V.x-4, V.y-1.1,
      {skin:'#b58a5e',hair:'#241a14',shirt:'#3f7a5e',pants:'#3a3026',apron:'#c9b48a',hairstyle:'bun'},
      ['Eh, down off Kea in one piece? Come in, come in - the mat is soft and the hearth is warm.',
       'Ten gold, a woven mat, and the reef to hum you under. Sleep as long as the tide pleases.'],0.7);
    inn.nightOwl=true; G.npcs.push(inn); }
  // Vashti - a visiting Emberbinder who covets the dragon's fire and will lie to
  // get it. Once the wyrm is freed she's fled to the grove, no longer in the village
  // (quest-state gated so it survives reloads).
  if(qs('wyrm')!=='done')
    G.npcs.push(makeNPC('vashti','Vashti the Emberbinder', V.x-8.5,V.y-4.5,
      {skin:'#c2a892',hair:'#241a2e',robe:'#4a2a5e',rune:true,hairstyle:'long'},
      ['The mountain\'s heat is... wasted, on a sleeping beast.',
       'You have the look of someone the world owes a favor. Climb the mountain; collect it.'],0.3));
}
/* The caldera set-piece: told the wyrm is evil, you climb Mount Kea and step
   INTO his lair, where he turns out kind. Vashti's binding takes him mid-word;
   you're driven out to the caldera to break the spell in a fight. */
function dragonLairSpeak(){
  if(G.mobs && G.mobs.some(m=>m.kind==='dragon' && !m.dead)){ // he's already raging at the caldera
    lairDialog('Ashwing’s Lair','The lair is empty and shaking. Above you, the mountain roars - Ashwing is loose on the caldera. Go and break the spell.',
      [{label:'Go up', fn:()=>{ closeDialog(); if(G.interior) exitHouse(); }}]);
    return;
  }
  if(qs('wyrm')==='done'){
    lairDialog('Ashwing','“Rest by my fire as long as you like, little flame. A mountain remembers a kindness.” <i>His great eye turns to the smoke-hole above.</i> “And when horizons itch at you - there is a city out past the wild water. <b>Windsurf</b>. No keel can cross to it now; the straits have turned cruel. My wings do not care what the sea thinks. Say the word and I will carry you.”',
      [{label:'Fly me to Windsurf Isle', cls:'gold', fn:()=>{ askDragonFlight(); }},
       {label:'Rest a while', ghost:true, fn:closeDialog}]);
    return;
  }
  if(qs('wyrm')!=='active'){
    lairDialog('Ashwing','“You wear no binder’s violet - then we have no quarrel, traveller. Mind the heat on your way down.”',
      [{label:'Leave him be', fn:closeDialog}]);
    return;
  }
  lairDialog('Ashwing',
    '“You climbed my mountain with a blade. Vashti’s errand, I would wager - she covets my fire, bottled.”',
    [{label:'Continue', fn:()=> lairDialog('Ashwing',
      '“I have warmed these waters since your grandmothers were girls. I am no monster, child - only old, and kind, and very tired. Go home, and tell her I said—”',
      [{label:'Continue', fn:()=> lairDialog('Vashti',
        '<b style="color:#c77bff">Violet fire floods the lair.</b> A voice pours from the walls: “Sentiment. Sleep, wyrm - or kill for me.” Ashwing’s eyes kindle red; his wings crack against the stone. There is no room to face him here.',
        [{label:'Steel yourself, get out', cls:'gold', fn:()=>{ closeDialog(); if(G.interior) exitHouse(); awakenDragon(); }}])}])}]);
}
function lairDialog(name,text,btns){
  dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent=name;
  const pc=document.getElementById('dportrait');
  if(pc){ const pg=pc.getContext('2d'); pg.clearRect(0,0,pc.width,pc.height);
    pg.fillStyle='#241a10'; pg.fillRect(0,0,pc.width,pc.height);
    pg.save(); pg.translate(pc.width/2, pc.height-4); pg.scale(0.6,0.6);
    try{ drawDragon(pg,0,0,{face:1,enspelled:false,anim:1,hurtT:0}); }catch(e){} pg.restore(); }
  setDialog(text,btns);
}
function awakenDragon(){
  if(G.mobs && G.mobs.some(m=>m.kind==='dragon' && !m.dead)) return; // one Ashwing at a time
  const C=ZONES.caldera||EAST_ZONES.caldera;
  const sp=findOpenNear(Math.round(P.x), Math.round(P.y+3), 7)
        || findOpenNear(Math.round(C.x), Math.round(C.y+7), 8) || [C.x, C.y+7];
  const dr=spawnMob('dragon', sp[0], sp[1]);
  if(dr){ dr.bigBoss=true; dr.enspelled=true; dr.state='chase'; dr.noAggroT=0;
    dr.respawnT=-1; dr.hx=sp[0]; dr.hy=sp[1]; G.dragonMob=dr; }
  P.metDragon=1;
  banner('ASHWING, ENTHRALLED','BREAK THE SPELL - DO NOT LET HIM FALL TO IT');
  if(Snd.boss) Snd.boss(); G.shake=0.9;
}
function startMageHunt(){
  if(P.mageHuntStarted) return;
  P.mageHuntStarted=1;
  const vi=G.npcs.findIndex(n=>n.id==='vashti'); if(vi>=0) G.npcs.splice(vi,1); // she flees the village
  P.quests.vhunt='active'; P.prog.vhunt=0;
  const GR=EAST_ZONES.grove;
  if(!G.mobs.some(m=>m.kind==='mage' && !m.dead)){
    const sp=findOpenNear(Math.round(GR.x), Math.round(GR.y), 8) || [GR.x, GR.y];
    const mg=spawnMob('mage', sp[0], sp[1]);
    if(mg){ mg.state='idle'; mg.hx=sp[0]; mg.hy=sp[1]; mg.respawnT=-1; }
  }
}
function freeDragon(x,y){
  // he dissolves into warm light and beats back to his mountain, himself again
  for(let i=0;i<32;i++){ const a=Math.random()*TAU, sp=rnd(1,4.5);
    G.parts.push({x:x, y:y-0.6, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.2, life:rnd(0.8,1.7),
      color:Math.random()<0.5?'#ffd24a':'#ff8a44', size:rnd(2,5), grav:-0.22}); }
}
function spawnMobsEast(){
  const packs=[
    ['boar', EAST_ZONES.grove, 8, 0.2],
    // bristlebacks forage the ash slopes - some elite, but no desert scorpions
    // walling off the climb (they were Lv 13, brutal for a Chapter III isle)
    ['boar', {x:EAST_ZONES.volcano.x, y:EAST_ZONES.volcano.y+13, r:10}, 6, 0.35]
  ];
  for(const [kind,z,count,el] of packs){
    for(let i=0;i<count;i++){
      const a=Math.random()*TAU, r2=Math.random()*z.r*0.8;
      const sp2=findOpenNear(Math.round(z.x+Math.cos(a)*r2), Math.round(z.y+Math.sin(a)*r2), 4);
      if(sp2) spawnMob(kind, sp2[0], sp2[1], Math.random()<el);
    }
  }
  const yd1=findOpenNear(Math.round(EAST_ZONES.village.x+10), Math.round(EAST_ZONES.village.y+8), 5);
  const yd2=findOpenNear(Math.round(EAST_ZONES.village.x+12), Math.round(EAST_ZONES.village.y+7), 5);
  if(yd1) spawnMob('dummy',yd1[0],yd1[1]);
  if(yd2) spawnMob('dummy',yd2[0],yd2[1]);
  // if the hunt is underway (e.g. after a reload), Vashti waits in the grove
  if(qs('vhunt')==='active'){
    const GR=EAST_ZONES.grove, sp=findOpenNear(Math.round(GR.x), Math.round(GR.y), 8) || [GR.x,GR.y];
    const mg=spawnMob('mage', sp[0], sp[1]); if(mg){ mg.hx=sp[0]; mg.hy=sp[1]; mg.respawnT=-1; }
  }
}
function genEastAll(){
  genEast(); bakeSolids(); placeObjectsEast(); buildFoam();
  spawnEastFolk(); spawnMobsEast();
  buildMapBase(); // without this the map keeps the previous world's base image
}
/* =====================================================================
   WINDSURF ISLE - an industrious city reachable only by Ashwing's wing
   (the straits are too treacherous for boats until the sea-beast falls)
   ===================================================================== */
function genWind(){
  const rng=mulberry32(SEED);
  const CX2=74, CY2=90, R0=54;
  const wob=[]; for(let i=0;i<64;i++) wob.push(rng()*9-4);
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const dx=x-CX2, dy=y-CY2, d=Math.hypot(dx,dy), a=Math.atan2(dy,dx);
    const wi=((Math.floor((a+Math.PI)/TAU*64))%64+64)%64;
    const rad=R0+wob[wi]+5*Math.sin(a*5+0.7);
    let t=T.DEEP;
    if(d<rad-7) t=T.GRASS; else if(d<rad-2) t=T.SAND; else if(d<rad+2) t=T.SHALLOW;
    G.map[y*MAPW+x]=t;
  }
  const Z=WIND_ZONES;
  carveDisc(Z.town.x,Z.town.y,Z.town.r,T.GRASS,false);
  carveDisc(Z.market.x,Z.market.y,Z.market.r,T.GRASS,false);
  carveDisc(Z.resort.x,Z.resort.y,Z.resort.r,T.GRASS,false);
  carveDisc(Z.mill.x,Z.mill.y,Z.mill.r,T.GRASS,false);
  carveDisc(Z.bluffs.x,Z.bluffs.y,Z.bluffs.r,T.GRASS,false);
  carveDisc(Z.dock.x,Z.dock.y,5,T.SAND,false);
  // the millstream: a thin freshwater channel the waterwheel turns on, running to the sea
  for(let i=0;i<=26;i++){ const f=i/26;
    const x=Math.round(Z.wheel.x + (Z.dock.x-Z.wheel.x)*f), y=Math.round(Z.wheel.y + (Z.dock.y-Z.wheel.y)*f);
    for(let o=-1;o<=1;o++) if(inb(x+o,y)) setTile(x+o,y, o===0?T.SHALLOW:T.SAND);
  }
  // a cobbled plaza in the market and resort forecourt
  carveDisc(Z.market.x,Z.market.y,3,T.PATH,false);
  carveDisc(Z.resort.x,Z.resort.y+3,2,T.PATH,false);
  // roads knitting the city together
  carveLine(Z.dock.x,Z.dock.y, Z.town.x,Z.town.y, T.PATH,0);
  carveLine(Z.town.x,Z.town.y, Z.market.x,Z.market.y, T.PATH,0);
  carveLine(Z.market.x,Z.market.y, Z.mill.x,Z.mill.y, T.PATH,0);
  carveLine(Z.town.x,Z.town.y, Z.resort.x,Z.resort.y, T.PATH,0);
  carveLine(Z.town.x,Z.town.y, Z.wheel.x,Z.wheel.y, T.PATH,0);
  carveLine(Z.market.x,Z.market.y, Z.bluffs.x,Z.bluffs.y, T.PATH,0);
}
function placeObjectsWind(){
  const Z=WIND_ZONES, T2=Z.town, M=Z.market, R=Z.resort, MI=Z.mill, WH=Z.wheel, D=Z.dock, B=Z.bluffs;
  // landmarks
  addBuilding('resort', R.x, R.y, 'The Breakers Resort');
  addBuilding('windmill', MI.x, MI.y, 'Millward Windmill');
  addBuilding('waterwheel', WH.x, WH.y, 'The Old Waterwheel');
  // the working town
  addBuilding('house', T2.x+4, T2.y-3, 'The Trade Winds Inn');   // "(Inn)"? no - keep a real inn below
  addBuilding('house2',T2.x-4, T2.y-2, 'Harbor Guildhall');
  addBuilding('house', T2.x-1, T2.y+4, 'Windsurf Inn (Inn)');
  addBuilding('house2',T2.x+6, T2.y+3, 'Sailmaker\'s loft');
  addBuilding('well',  T2.x, T2.y, 'Town well');
  // Trade Row: fruit stands + knick-knack stalls around the plaza
  addBuilding('fruitstand', M.x-3, M.y-1, 'Fruit stand');
  addBuilding('fruitstand', M.x+3, M.y-2, 'Grocer\'s cart');
  addBuilding('stall', M.x-2, M.y+3, 'Curios & knick-knacks');
  addBuilding('stall', M.x+3, M.y+2, 'Shell trinkets');
  addBuilding('stall', M.x, M.y+4,  'Windvane whittler');
  // harbor
  addBuilding('boat', D.x-4, D.y+2, '');
  addBuilding('lamp', D.x, D.y-1, '');
  addBuilding('lamp', D.x+3, D.y+1, '');
  addBuilding('lamp', M.x-4, M.y+1, ''); addBuilding('lamp', M.x+4, M.y-1, '');
  addBuilding('lamp', R.x-4, R.y+3, ''); addBuilding('lamp', R.x+4, R.y+3, '');
  // greenery - leafy town trees & bluff palms so the city feels lived-in
  const pr=mulberry32(SEED+11);
  for(let i=0;i<200;i++){
    const ax=Math.floor(pr()*MAPW), ay=Math.floor(pr()*MAPH), t=tileAt(ax,ay);
    if((t===T.GRASS&&pr()<0.24)||(t===T.SAND&&pr()<0.16)){
      if(solidAt(ax,ay)) continue;
      if(dist(ax,ay,T2.x,T2.y)<4||dist(ax,ay,M.x,M.y)<4||dist(ax,ay,D.x,D.y)<4) continue;
      const n=addNode('tree',ax,ay); if(t===T.SAND||dist(ax,ay,B.x,B.y)<B.r) n.palm=1;
    }
  }
  // shells & a few beach flowers
  for(let i=0;i<22;i++){ const ax=Math.floor(pr()*MAPW), ay=Math.floor(pr()*MAPH);
    if(tileAt(ax,ay)===T.SAND && !solidAt(ax,ay)) addNode('shell',ax,ay); }
  // friendly town critters: hens & cats about the plaza, crabs on the sand, gulls handled globally
  G.critters=[];
  const critter=(kind,x,y,range,col)=>{ if(!inb(x,y)||solidAt(x,y)) return;
    G.critters.push({kind,x:x+0.5,y:y+0.5,home:{x:x+0.5,y:y+0.5},tx:null,ty:null,
      wt:rnd(0.5,4),face:pr()<0.5?-1:1,anim:pr()*6,range:range||2.5,col,moving:false}); };
  const FOWL=['#efe7d6','#b07a44','#8a7a5e'], CRAB=['#d8492e','#e0803a'];
  for(let i=0;i<7;i++){ const a=pr()*TAU, rr=3+pr()*6;
    critter('fowl', Math.round(T2.x+Math.cos(a)*rr), Math.round(T2.y+Math.sin(a)*rr), 3, FOWL[i%FOWL.length]); }
  for(let i=0;i<2;i++){ critter('cat', Math.round(M.x+pr()*3-1), Math.round(M.y+pr()*3-1), 3.5, '#c9c2b6'); }
  for(let i=0;i<7;i++){ const a=pr()*TAU, rr=2+pr()*5;
    const cx2=Math.round(D.x+Math.cos(a)*rr), cy2=Math.round(D.y+Math.sin(a)*rr);
    if(inb(cx2,cy2)&&tileAt(cx2,cy2)===T.SAND) critter('crab', cx2, cy2, 3, CRAB[i%CRAB.length]); }
}
function spawnWindFolk(){
  const Z=WIND_ZONES, T2=Z.town, M=Z.market, R=Z.resort, D=Z.dock, MI=Z.mill, WH=Z.wheel;
  // Rell - harbormaster at the docks: explains the treacherous waters (the PR-B hook)
  G.npcs.push(makeNPC('rell','Rell the Harbormaster', D.x+1.5, D.y+0.5,
    {skin:'#a9784e',hair:'#2a2622',shirt:'#33566e',pants:'#2c3540',beard:'#2a2622'},
    ['Off Ashwing\'s back? Then you\'re one of a lucky few - no hull\'s crossed our straits in a season.',
     'Something churns the deep water out past the reef. It eats boats, and it\'s eating this town.'],0.4));
  // Mayor / concierge of the resort
  G.npcs.push(makeNPC('coralie','Coralie of the Breakers', R.x+1.5, R.y+2.5,
    {skin:'#caa27b',hair:'#3a2e26',shirt:'#5a7a6a',pants:'#3a3a44',apron:'#e0d4bc',hairstyle:'bun'},
    ['Welcome to the Breakers! Sea view, salt baths, and not a single guest all month, alas.',
     'Windsurf lives on visitors. No boats, no visitors - and the awnings gather dust.'],0.5));
  // Millwright at the windmill
  G.npcs.push(makeNPC('burl','Burl the Millwright', MI.x-1.5, MI.y+2.2,
    {skin:'#b0855f',hair:'#6a5a44',shirt:'#7a6a4a',pants:'#4a3f30'},
    ['Grain still grinds and the wind still blows - that much the sea can\'t spoil.',
     'The wheel and the mill kept this city fed for a hundred years. We\'ll not stop now.'],0.5));
  // Market vendors
  G.npcs.push(makeNPC('pia','Pia of Trade Row', M.x-3, M.y-2.2,
    {skin:'#c99a6e',hair:'#241c16',shirt:'#c85a3a',pants:'#3a2c26',hairstyle:'long'},
    ['Mangoes, sugar-melon, spice-plums - all island-grown, none of it shipped, so it\'s cheap and it\'s fresh.',
     'Buy something, friend? A stall with no customers is just a sad little roof.'],0.4));
  G.npcs.push(makeNPC('tolen','Tolen the Whittler', M.x+3, M.y+2.2,
    {skin:'#a9784e',hair:'#3a352c',shirt:'#4a6a8a',pants:'#33302a'},
    ['Windvanes, whistles, little carved gulls - knick-knacks to remember Windsurf by.',
     'Made all these by hand. Wind gives me the wood off the bluffs, I give it back a shape.'],0.5));
  // a townsperson on the green
  G.npcs.push(makeNPC('nessa','Nessa the Sailmaker', T2.x+5.5, T2.y+3.5,
    {skin:'#8f6a48',hair:'#2a241e',shirt:'#5a4472',pants:'#332c3c',hairstyle:'bun'},
    ['I stitch the finest sails on any shore - and every one of them hangs idle in my loft.',
     'The day a boat can cross again, I\'ll have this town in canvas by nightfall.'],0.5));
}
function spawnMobsWind(){
  // a peaceful city - only harmless yard critters and practice targets for now.
  // (The sea-beast that haunts the straits arrives with the next chapter.)
  const D=WIND_ZONES.dock;
  const yd=findOpenNear(Math.round(D.x+4),Math.round(D.y-3),5);
  if(yd) spawnMob('dummy',yd[0],yd[1]);
}
function genWindAll(){
  genWind(); bakeSolids(); placeObjectsWind(); buildFoam();
  spawnWindFolk(); spawnMobsWind();
  buildMapBase();
}
/* Ashwing's wing is the only road to Windsurf until the straits are cleared. */
function flyToWorld(id, msg){
  if(G._flying) return; G._flying=1;
  closeDialog(); if(G.interior) exitHouse();
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1;
  if(msg) toast(msg,4200);
  if(Snd.boss) Snd.boss();
  setTimeout(()=>{ switchWorld(id); autoSave(); setTimeout(()=>{ if(fd) fd.style.opacity=0; G._flying=0; },220); },900);
}
function askDragonFlight(){
  P.prog.windKnown=1;
  flyToWorld('wind','Ashwing lowers a wing. You climb his warm shoulder and he beats up through the caldera smoke, out over water too wild for any keel.');
}
function genMainAll(){
  genMainland(); bakeSolids(); placeObjectsMain(); buildFoam();
  if(P.projects && P.projects.beacon) placeBeacon();
  spawnNPCsMain(); spawnBarikFolk(); spawnBarikInn(); spawnRealmFolk(); spawnMobsMain();
  addCrowsFor();
  G.forgePos=null;
  buildMapBase();
}

/* ---------- Barik's quest wave ---------- */
QUESTS.welcome2={ giver:'kell', title:'The Warden\'s Ledger', kind:'talk', talkTo:'sela',
  brief:'New boots off the Emberwick ferry - I can smell the tutorial on you. Barik\'s bigger, hungrier, and less forgiving. Get provisioned before you get ambitious: Sela runs the counter south of the well. Tell her the Warden sent you.',
  log:'Introduce yourself to Sela the Provisioner in Greyharbor.',
  doneText:'Kell sent you? Then you\'re either useful or doomed. Let\'s find out which - Barik has work for both kinds.',
  rw:{gold:15, xp:{melee:40}}, unlocks:['nets','roadclear'] };
QUESTS.nets={ giver:'sela', title:'Nets of Barik', kind:'gather', need:{fish:6},
  brief:'The trawlers won\'t round the point while wolves haunt the cliff road, so my counter\'s bare. Six fresh fish from any Barik shallows keeps Greyharbor fed a week.',
  log:'Catch 6 fish in Barik\'s shallows for Sela.',
  doneText:'Fat ones, too. The harbor eats tonight - and pays this morning.',
  rw:{gold:45, item:{bread:2}, xp:{fishing:160}} };
QUESTS.roadclear={ giver:'kell', title:'Clear the King\'s Road', kind:'kill', kill:{wolf:8},
  brief:'The road from Greyharbor to Blackpine belongs to the wolves after dusk. Eight pelts thins the packs enough for the carts to run. Mind the crimson-ringed ones.',
  log:'Slay 8 wolves along Barik\'s roads and highlands.',
  doneText:'The carters are already singing about it. Off-key. Greyharbor thanks you properly: in coin.',
  rw:{gold:80, xp:{melee:200, archery:120}} };
QUESTS.hedda1={ giver:'hedda', title:'Bluecap Stew', kind:'gather', need:{mushroom:6},
  brief:'Harvest crew works dawn to dark and eats like it. Bluecaps from Blackpine make the only stew worth the name. Six caps and you\'ll eat with us besides.',
  log:'Gather 6 bluecap mushrooms from Blackpine Reach for Hedda.',
  doneText:'Smell that? That\'s Barik in a pot. Take your share and your coin.',
  rw:{gold:40, item:{bread:2}, xp:{farming:180}}, unlocks:['hedda2'] };
QUESTS.hedda2={ giver:'hedda', title:'Mire in the Fields', kind:'kill', kill:{slime:6},
  brief:'Every wet season the Mirefen leaks its muck-things into my east rows. They eat seed, root, and hope, in that order. Six burst slimes buys my fields a season.',
  log:'Destroy 6 slimes around the Mirefen and Farmsteads.',
  doneText:'Rows are clean, seed\'s safe, and I owe you a harvest\'s gratitude. Coin will have to stand in for it.',
  rw:{gold:60, item:{potion:1}, xp:{melee:160, magic:120}} };
QUESTS.torv1={ giver:'torv', title:'Reopen the Shafts', kind:'gather', need:{stone:10},
  brief:'Three generations of Barik built with stone from these shafts - then the wilds took the road and the pit went quiet. Help me clear the mouth: ten good stone proves the vein still gives.',
  log:'Mine 10 stone around the Old Barik Mines for Torv.',
  doneText:'Listen to that ring. The old girl\'s awake. Barik builds again - starting with your pay.',
  rw:{gold:55, xp:{mining:220}}, unlocks:['torv2'] };
QUESTS.torv2={ giver:'torv', title:'The Old Vein', kind:'gather', need:{ore:4},
  brief:'Stone keeps walls up; ore keeps forges lit. The deep rock here still carries iron if you\'ve the arm for it. Four ore and Greyharbor\'s smith stays in business.',
  log:'Break 4 iron ore from Barik\'s stone for Torv.',
  doneText:'Good iron. Honest iron. The kind that remembers being a mountain.',
  rw:{gold:75, xp:{mining:260}} };
QUESTS.ivo1={ giver:'ivo', title:'Tidebalm', kind:'gather', need:{shell:5},
  brief:'Ground shell, kelp ash, and patience - tidebalm knits cuts the sea gives. The strand west of the docks throws up shells after every tide. Five whole ones, unbroken.',
  log:'Collect 5 shells from Barik\'s beaches for Ivo.',
  doneText:'Unbroken, every one. You\'d make a fair herbalist if the sword ever bores you. Balm\'s share is yours.',
  rw:{gold:35, item:{potion:2}, xp:{fishing:140}} };
QUESTS.ribbon1={ giver:'corvo', title:'A Ribbon for Wren', kind:'talk', talkTo:'mira', xpL:90, stageOf:'ribbon', stage:1,
  brief:'East past the shoals sits an island the charts pretend not to see. Bring my girl Wren a fine ribbon for her birthday and I will sail you there myself. Mira at Thimble and Thread in Greyharbor weaves the best on Barik.',
  log:'(1/3) Ask Mira the Seamstress in Greyharbor about a ribbon.',
  doneText:'A ribbon? I would love nothing more, truly. But my whole silk shipment was taken on the north road. Brigands nest in the pines north of Blackpine now, and my silk sits in their camp. I cannot say when more will come.',
  rw:{} };
QUESTS.ribbon2={ giver:'mira', title:'A Ribbon for Wren', kind:'gather', need:{silk:1}, xpL:200, stageOf:'ribbon', stage:2,
  brief:'If you can walk into that camp and walk out again: my silk sits in a chest they guard, north of the deep pines. Bring me one bolt and I will weave the finest ribbon Barik has seen.',
  log:'(2/3) Steal back a bolt of silk from Thieves\' Hollow, north of Blackpine.',
  doneText:'Dawn-colored, and not a thread pulled. Give me a moment... there. A Sunset Ribbon, and my thanks stitched into it.',
  rw:{item:{ribbon:1}, gold:40} };
QUESTS.ribbon3={ giver:'corvo', title:'A Ribbon for Wren', kind:'gather', need:{ribbon:1}, xpL:260, stageOf:'ribbon', stage:3,
  brief:'You have it? Wren will be over the moon and halfway back.',
  log:'(3/3) Bring the Sunset Ribbon to Captain Corvo at the east cove.',
  doneText:'She will wear it till the color goes. A bargain is a bargain - and the tide is with us NOW. Say the word, any time, and we run east for the Sunward Isle.',
  rw:{gold:150} };
QUESTS.hunt1={ giver:'huk', title:'Bristleback Cull', kind:'kill', kill:{boar:6}, xpL:170,
  brief:'The bristlebacks breed quicker than the palms can feed them, eh, and now they are into our gardens. Thin the sounder for me - six boars - and Kohana eats easy either way. No rush about it.',
  log:'Hunt 6 bristleback boars in Palmwatch Grove or on the ash slopes.',
  doneText:'Six, clean - you hunt like you mean it, friend. Come see me when you are ready to meet Kiko. She only takes to folk who can keep her pace.',
  rw:{gold:90, item:{boarmeat:3}, xp:{archery:160}} };
QUESTS.tame1={ giver:'huk', title:'The Long-Legged Friend', kind:'gather', need:{apple:3}, xpL:200,
  brief:'Kiko is a moa - tall as a door, quicker than gossip. She will carry a friend, and friendship with Kiko runs exactly three crisp apples. Barik orchards grow them; so does a lucky axe swing. Take your time.',
  log:'Bring Huk 3 orchard apples to win over Kiko the Moa.',
  doneText:'Ha - she likes you. That is settled, then. Kiko is yours to whistle for - press M, or just ask me, and hold on with your knees.',
  rw:{moa:true} };
QUESTS.surf1={ giver:'kaia', title:'The Wind Is a Road', kind:'gather', need:{wood:8, crystal:1}, xpL:220,
  brief:'Bring me eight good lengths of timber and one ember crystal to cure the resin, yeah, and I will shape you a board that treats the sea like a shady lane. The Windward Reef is only the first place it carries you.',
  log:'Bring Kaia 8 wood and 1 ember crystal for a windsurf board.',
  doneText:'There she is - Kaia-work, signed in the grain. Step onto the water and the board finds your feet. The reef is yours now, friend, and every shore you can squint at.',
  rw:{surf:true, gold:30} };
QUESTS.wyrm={ giver:'vashti', title:'The Wyrm of Mount Kea', kind:'kill', kill:{dragon:1}, xpL:320,
  brief:'You feel the heat off the mountain? A wyrm nests in the caldera - old, and lately black of heart. It will render Kohana to ash by the next storm, mark me. Climb the ash road and put the beast down. An Emberbinder pays well for a dead dragon.',
  log:'Climb Mount Kea and confront the wyrm at the caldera. (Lv 8+ recommended.)',
  doneText:'Ashwing sleeps easy now, and so does Kohana.',
  rw:{gold:220, item:{potion:3}, xp:{melee:420, archery:420, magic:420}} };
QUESTS.vhunt={ giver:'moli', title:'Hunt the Emberbinder', kind:'kill', kill:{mage:1}, xpL:300,
  brief:'That robed one was never a friend to Kohana, eh. Run her down in the grove before she binds another soul - then come and sit, and we will call it square.',
  log:'Run down Vashti the Emberbinder in the palm grove.',
  doneText:'Her binding goes quiet with her, and the isle breathes easy again. Ashwing owes you dragonfire; Kohana owes you this. Take it, friend, with all our thanks.',
  rw:{gold:180, item:{potion:2}, xp:{melee:300, archery:300, magic:300}} };
QUESTS.feud1={ giver:'maelis', title:'The Vael Feud', kind:'kill', kill:{raider:6}, xpL:200,
  brief:'My cousin of the Vael March styles himself a king and pays raiders in my own minted coin. Six of his red hoods driven from my roads will remind him whose realm feeds his. Go armed, traveler - they are Lv 12 men and proud of it.',
  log:'Drive off 6 Vael Raiders in the north-east March.',
  doneText:'Six hoods emptied. My cousin will sulk for a season - Barik thanks you in gold and in standing. But the March still has a spine: the man who holds his war-tent. Come back when you have the stomach for him.',
  rw:{gold:220, item:{potion:2}, xp:{melee:300, archery:300, magic:300}}, unlocks:['sting1','feud2'] };
QUESTS.feud2={ giver:'maelis', title:'Break the March', kind:'kill', kill:{raidcap:1}, xpL:300,
  brief:'Driving off his hirelings only bloodied my cousin\'s nose. The March will not kneel while his <b>Castellan</b> holds the war-tent - a captain worth ten raiders, and he knows it. Go to the north-east March, call the man out, and put his standard in the dirt. Come ready, and come armored.',
  log:'Confront and defeat the Castellan of the Vael at the war-tent in the north-east March. (Lv 14 - come ready.)',
  doneText:'The Castellan down and the standard fallen? Then the March is mine in all but name, and my cousin has no sword left to hide behind. Barik will remember this - and so will I. Take a captain\'s due.',
  rw:{gold:340, item:{potion:3}, xp:{melee:420, archery:420, magic:420}} };
QUESTS.sting1={ giver:'maelis', title:'Sunscour Cull', kind:'kill', kill:{scorpion:5}, xpL:220,
  brief:'The Sunscour breeds armored horrors that drag off goats, carts, and the occasional tax collector. Cull five. I am told their shells turn all but the truest blows - Lv 13, my wardens reckon.',
  log:'Slay 5 Sunscour Scorpions in the desert valley.',
  doneText:'Five stingers for the trophy wall. The caravans will run the valley road again - carefully.',
  rw:{gold:260, item:{potion:2}, xp:{melee:340, archery:340, magic:340}} };
QUESTS.undermaw1={ giver:'torv', title:'What the Deep Keeps', kind:'visit', zone:'undermaw', xpL:150,
  brief:'East of the Mirefen the ground splits - the Undermaw, we call it. Miners\' tales say a hoard sleeps inside, guarded by bone-kin who never liked daylight. Find the mouth. What you do after is between you and the dark.',
  log:'Find the Undermaw, east of the Mirefen. (Lv 10+ recommended.)',
  doneText:'You found it and kept your skin - that\'s rarer than the gold. Whatever you carried out, you earned.',
  rw:{gold:90, xp:{mining:200}} };
/* ---------- the bounty quest & relic ---------- */
QUESTS.bounty = { giver:'kell', title:'Blood for Greyharbor', kind:'kill', kill:{elite:8},
  brief:"The wilds have turned. Crimson-ringed beasts - elites, we call them - press on the road every season. Cull eight of them: wolves on Wolfcrag, bones in Barrowfield, muck-things in the Mirefen. Greyharbor pays well.",
  log:'Slay 8 elite beasts anywhere on the mainland.',
  doneText:"Eight heads' worth of quiet. The road breathes easier - and so do I. Greyharbor's coin, as promised. If you're still hungry, the Peak keeps its own secret.",
  rw:{gold:150, item:{potion:3}, xp:{melee:260, archery:260, magic:260}}, unlocks:['alpha','embers'] };
QUESTS.springs={ giver:'maren', title:'Waters of Old', kind:'visit', zone:'springs',
  brief:"My grandmother swore there were warm springs in the western hills - water that closes wounds. I'm too old for the walk and too stubborn to admit it. Find them for me. Just… find them.",
  log:'Discover the Ember Springs in the isle\'s western hills.',
  doneText:"You FOUND them. Warm as a kettle, she used to say. Go soak whenever the island bites you - and take this for an old woman's peace of mind.",
  rw:{gold:30, item:{potion:1}, xp:{farming:80, fishing:80}} };
QUESTS.cove={ giver:'bram', title:"Smuggler's Rest", kind:'kill', kill:{wolf:3},
  brief:"There's an old smuggler camp on the northeast point - good iron in that chest, if the tales hold. Trouble is, a wolf pack dens there now. Put down three of the brutes and the cove's yours to pick clean.",
  log:'Slay 3 wolves at Smuggler\'s Cove and claim the camp.',
  doneText:"Three pelts' worth of quiet. The cove's yours, friend - crack that chest open and think of me.",
  rw:{gold:35, xp:{melee:120, archery:120}} };
QUESTS.orchard={ giver:'willa', title:'Applewood', kind:'gather', need:{apple:5},
  brief:"The old orchard south-east still fruits - nobody's picked it since the king went hollow. Five good apples and I'll bake you something worth the walk. Mind the branches; they drop hard.",
  log:'Pick 5 apples in the Old Orchard.',
  doneText:"Look at the color on these! The oven's already hot. Here - first loaves are yours, and the orchard knows your hands now.",
  rw:{item:{bread:2}, gold:12, xp:{farming:150}} };
QUESTS.shells={ giver:'nia', title:'Seven Spirals (well, four)', kind:'gather', need:{shell:4},
  brief:"Pip found a SHELL and it's the best thing I own. I need more! The beach hides spiral ones - bring me four and I'll trade you my second-best treasure. It's gold. Don't tell Maren where I got it.",
  log:'Gather 4 spiral shells from the beaches.',
  doneText:"FOUR! Look how they curl! Here - treasure for treasure. That's the rule of the beach.",
  rw:{gold:15, xp:{fishing:80}} };
QUESTS.pearlq={ giver:'finn', title:'The One That Got Away', kind:'gather', need:{pearl:1},
  brief:"Thirty years I've fished this bay, and once - ONCE - I pulled up a pearl the size of a thumbnail. Dropped it in the drink showing off to Willa. Bring me one and I'll pay like a man buying back his youth.",
  log:'Catch a pearl while fishing (fishing skill improves the odds).',
  doneText:"There she is… no, keep your coin ready - HERE'S yours. Worth every piece to hold one again.",
  rw:{gold:45, xp:{fishing:200}} };
QUESTS.remember={ giver:'orin', title:'The Island Remembers', kind:'gather', need:{page:3},
  brief:"Three texts survive on this isle: my tower's Ember Wars, Maren's Songs of the Well, and a farmer's almanac gathering dust in the barn. Read them, copy a page from each, and I'll pay you in something better than gold - understanding. Also crystals.",
  log:'Read the books inside the tower, Maren\'s cottage, and the barn (step inside and Read).',
  doneText:"The Ember Wars… the Well… the Almanac's warning. It all points to the same truth: this island forgives, but it never forgets. Take these - they remember being warm.",
  rw:{item:{crystal:2}, gold:25, xp:{magic:220}} };
QUESTS.embers={ giver:'kell', title:'Embers for the Watch', kind:'gather', need:{crystal:3},
  brief:"Winter watches are long and the braziers burn cold. Ember crystals hold heat like a grudge - three of them would warm the watchtower till spring. Mine the ruin-stone at Barrowfield or the Wolfcrag.",
  log:'Mine 3 ember crystals from stone near Barrowfield or Wolfcrag.',
  doneText:"Warm at last. The night watch drinks to you tonight - and Greyharbor pays its debts.",
  rw:{gold:60, xp:{magic:200, mining:150}} };
QUESTS.mossbrew={ giver:'moss', title:'A Hermit\'s Kindness', kind:'gather', need:{mushroom:4},
  brief:"Visitors! Rare as dry socks out here. The blackpine bluecaps glow kinder than the isle's - four of them and I'll share the batch I'm brewing. A hermit's word is oak.",
  log:'Gather 4 bluecap mushrooms in the Blackpine Reach for Moss.',
  doneText:"Kind hands, kind harvest. Here - three bottles, brewed slow. And drink this thimble now: my quickroot draught. Your legs will remember it when one dodge is not enough.",
  rw:{item:{potion:3}, gold:20, xp:{farming:160}, dash2:true} };
ITEMS.relic = {name:'Stormwatch Relic', desc:'+4 damage to every attack. Torn from the Peak.'};
ITEMS.fang = {name:"Greymaw's Fang", desc:'+8 melee damage. Pried from the Alpha\'s jaw.'};
QUESTS.alpha = { giver:'kell', title:'The Alpha of Wolfcrag', kind:'kill', kill:{alpha:1},
  brief:"The elites answer to something. Greymaw - a wolf the size of a cart, eyes like coals. It dens high on Wolfcrag. Kill it, and the packs scatter for a generation. This is no bounty, adventurer. This is a hunt.",
  log:'Slay Greymaw, the Alpha, atop Wolfcrag Highlands.',
  doneText:"By the tides... you actually did it. The howling stopped last night - now I know why. Greyharbor will sing of this. Take the purse, hero. You've earned the name.",
  rw:{gold:250, item:{potion:4}, xp:{melee:400, archery:400, magic:400}} };

function buildExtraSprites(){
  // Kohana huts: bamboo walls under a deep straw cone
  SPR.hut=makeCanvas(96,86,(g)=>{
    const OUT='rgba(20,14,8,0.9)';
    g.lineWidth=2; g.strokeStyle=OUT;
    g.fillStyle='#a8845c';
    g.fillRect(22,48,52,32); g.strokeRect(22,48,52,32);
    g.strokeStyle='rgba(60,42,24,0.7)'; g.lineWidth=1.4;
    for(let x=28;x<74;x+=7){ g.beginPath(); g.moveTo(x,48); g.lineTo(x,80); g.stroke(); }
    g.strokeStyle=OUT; g.lineWidth=2;
    g.fillStyle='#c9a75a';
    g.beginPath(); g.moveTo(48,6); g.lineTo(90,54); g.lineTo(6,54); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#b3924a';
    g.beginPath(); g.moveTo(48,6); g.lineTo(90,54); g.lineTo(64,54); g.closePath(); g.fill();
    g.strokeStyle='rgba(90,66,30,0.75)'; g.lineWidth=1.3;
    for(let i=1;i<6;i++){ const yy=6+i*8;
      g.beginPath(); g.moveTo(48-(yy-6)*0.87,yy); g.lineTo(48+(yy-6)*0.87,yy); g.stroke(); }
    g.strokeStyle=OUT; g.lineWidth=2;
    g.fillStyle='#3a2a18';
    g.beginPath(); g.moveTo(40,80); g.lineTo(40,60); g.quadraticCurveTo(48,52,56,60); g.lineTo(56,80); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#e8d8a8'; g.fillRect(44,2,8,6); g.strokeRect(44,2,8,6);
  });
  // Mount Kea: an ash cone with a living caldera
  SPR.volcano=makeCanvas(260,200,(g)=>{
    const OUT='rgba(20,14,8,0.9)';
    g.lineWidth=2.5; g.strokeStyle=OUT;
    g.fillStyle='#3c3a3e';
    g.beginPath(); g.moveTo(96,26); g.lineTo(164,26);
    g.lineTo(238,178); g.lineTo(22,178); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#4c4a50';
    g.beginPath(); g.moveTo(96,26); g.lineTo(130,26); g.lineTo(96,178); g.lineTo(22,178); g.closePath(); g.fill();
    g.fillStyle='#2a282c';
    g.beginPath(); g.ellipse(130,26,36,11,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#ff7a34';
    g.beginPath(); g.ellipse(130,26,26,7,0,0,TAU); g.fill();
    g.fillStyle='#ffd050';
    g.beginPath(); g.ellipse(130,26,13,4,0,0,TAU); g.fill();
    g.strokeStyle='#ff8a44'; g.lineWidth=3; g.lineCap='round';
    g.beginPath(); g.moveTo(112,34); g.quadraticCurveTo(102,90,86,150); g.stroke();
    g.beginPath(); g.moveTo(150,36); g.quadraticCurveTo(162,100,178,166); g.stroke();
    g.lineCap='butt';
    g.strokeStyle='rgba(24,20,18,0.6)'; g.lineWidth=1.5;
    for(let i=0;i<36;i++){ const rx=40+((i*61)%180), ry=60+((i*37)%110);
      g.beginPath(); g.moveTo(rx,ry); g.lineTo(rx+9,ry+3); g.stroke(); }
  });
  // Barik Keep, drawn as an honest castle: curtain wall, flanking towers,
  // crenellated keep, royal banner, and a portcullis gate
  SPR.castle=makeCanvas(300,224,(g)=>{
    const OUT='rgba(20,14,8,0.9)', stone='#8f8b83', stoneD='#6e6a63', stoneL='#a8a49b';
    const cren=(x0,x1,y,wd)=>{ for(let x=x0;x<x1;x+=wd*1.7){ g.fillRect(x,y,wd,wd); g.strokeRect(x,y,wd,wd); } };
    g.lineWidth=2; g.strokeStyle=OUT;
    // long curtain wall
    g.fillStyle=stoneD; g.fillRect(20,140,260,60); g.strokeRect(20,140,260,60);
    g.fillStyle=stoneD; cren(20,280,130,11);
    // four towers: two outer squat, two inner tall
    const tower=(tx,ty,tw2,th2)=>{
      g.fillStyle=stone; g.fillRect(tx,ty,tw2,th2); g.strokeRect(tx,ty,tw2,th2);
      g.fillStyle=stoneL; cren(tx-1,tx+tw2+1,ty-12,9);
      g.fillStyle='#241a10'; g.fillRect(tx+tw2/2-4,ty+18,8,14); g.strokeRect(tx+tw2/2-4,ty+18,8,14);
    };
    tower(8,86,42,114); tower(250,86,42,114);
    tower(62,56,40,144); tower(198,56,40,144);
    // grand central keep
    g.fillStyle=stone; g.fillRect(100,34,100,166); g.strokeRect(100,34,100,166);
    g.fillStyle=stoneL; cren(99,201,22,11);
    // keep windows, two storeys
    g.fillStyle='#241a10';
    for(const wy of [56,92]){ g.fillRect(116,wy,12,18); g.strokeRect(116,wy,12,18);
      g.fillRect(144,wy,12,18); g.strokeRect(144,wy,12,18);
      g.fillRect(172,wy,12,18); g.strokeRect(172,wy,12,18); }
    // warm lit window
    g.fillStyle='#ffce7a'; g.fillRect(145,93,10,16);
    // the Queen's banner on the keep
    g.strokeStyle='#3a2a1a'; g.lineWidth=4;
    g.beginPath(); g.moveTo(150,22); g.lineTo(150,2); g.stroke();
    g.strokeStyle=OUT; g.lineWidth=2;
    g.fillStyle='#6a3a5e';
    g.beginPath(); g.moveTo(150,3); g.lineTo(184,9); g.lineTo(150,17); g.closePath(); g.fill(); g.stroke();
    // tower pennants
    g.fillStyle='#e8c860';
    g.beginPath(); g.moveTo(82,44); g.lineTo(100,48); g.lineTo(82,53); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(218,44); g.lineTo(236,48); g.lineTo(218,53); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='#3a2a1a'; g.lineWidth=3;
    g.beginPath(); g.moveTo(82,56); g.lineTo(82,40); g.moveTo(218,56); g.lineTo(218,40); g.stroke();
    g.strokeStyle=OUT; g.lineWidth=2;
    // grand gatehouse with portcullis
    g.fillStyle='#4d3418';
    g.beginPath(); g.moveTo(128,200); g.lineTo(128,164); g.quadraticCurveTo(150,146,172,164); g.lineTo(172,200); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='rgba(30,20,10,0.6)'; g.lineWidth=1.6;
    for(let x=133;x<172;x+=6){ g.beginPath(); g.moveTo(x,158); g.lineTo(x,200); g.stroke(); }
    for(let y=166;y<200;y+=7){ g.beginPath(); g.moveTo(129,y); g.lineTo(171,y); g.stroke(); }
    // stonework texture
    g.strokeStyle='rgba(40,36,30,0.5)'; g.lineWidth=1;
    for(let n=0;n<90;n++){ const rx=24+((n*67)%252), ry=60+((n*41)%130);
      g.beginPath(); g.moveTo(rx,ry); g.lineTo(rx+8,ry); g.stroke(); }
  });
  const mk=(open)=>makeCanvas(40,34,(g)=>{
    g.fillStyle='#4d3418'; g.beginPath(); g.roundRect(4,14,32,16,3); g.fill();
    g.strokeStyle='rgba(15,9,4,0.8)'; g.lineWidth=1.5; g.stroke();
    g.fillStyle='#5f4120';
    if(open){ g.beginPath(); g.roundRect(3,2,34,8,3); g.fill(); g.stroke();
      g.fillStyle='#8fd8ff'; g.fillRect(8,12,24,4);
      g.fillStyle='rgba(160,225,255,0.5)'; g.fillRect(6,8,28,5); }
    else { g.beginPath(); g.roundRect(3,8,34,9,3); g.fill(); g.stroke(); }
    g.fillStyle='#c9a24e'; g.fillRect(17,12,6,10);
    g.fillStyle='#8a6d30'; g.fillRect(18.5,16,3,4);
    g.fillStyle='#c9a24e'; g.fillRect(4,20,32,2);
  });
  SPR.chest=mk(false); SPR.chestOpen=mk(true);
  ICONS.apple=makeCanvas(40,40,(g)=>{
    const gr=g.createRadialGradient(16,16,3,20,21,13);
    gr.addColorStop(0,'#e86a80'); gr.addColorStop(1,'#a81f3c');
    g.fillStyle=gr; g.beginPath();
    g.arc(15,22,9,Math.PI*0.5,Math.PI*1.6); g.arc(25,22,9,Math.PI*1.4,Math.PI*0.5); g.fill();
    g.strokeStyle='#5a3d24'; g.lineWidth=2;
    g.beginPath(); g.moveTo(20,14); g.quadraticCurveTo(21,9,24,7); g.stroke();
    g.fillStyle='#4f7a3a'; g.beginPath(); g.ellipse(25,10,4,2.4,0.6,0,TAU); g.fill();
    g.fillStyle='rgba(255,255,255,0.6)'; g.beginPath(); g.arc(15,17,2,0,TAU); g.fill(); });
  ICONS.shell=makeCanvas(40,40,(g)=>{
    g.fillStyle='#e8e2d2'; g.beginPath(); g.ellipse(20,22,13,10,0.3,0,TAU); g.fill();
    g.strokeStyle='#b9a88a'; g.lineWidth=2;
    g.beginPath(); g.arc(22,20,8,0,TAU*0.8); g.arc(22,20,4.5,0,TAU*0.75); g.arc(22,20,1.8,0,TAU*0.7); g.stroke();
    g.strokeStyle='rgba(90,80,60,0.7)'; g.lineWidth=1.3;
    g.beginPath(); g.ellipse(20,22,13,10,0.3,0,TAU); g.stroke(); });
  ICONS.page=makeCanvas(40,40,(g)=>{
    g.fillStyle='#e8dcbd'; g.beginPath();
    g.moveTo(11,6); g.lineTo(26,6); g.lineTo(31,12); g.lineTo(31,34); g.lineTo(11,34); g.closePath(); g.fill();
    g.fillStyle='#c9b990'; g.beginPath(); g.moveTo(26,6); g.lineTo(26,12); g.lineTo(31,12); g.closePath(); g.fill();
    g.strokeStyle='rgba(90,70,40,0.85)'; g.lineWidth=1.3;
    g.beginPath(); g.moveTo(11,6); g.lineTo(26,6); g.lineTo(31,12); g.lineTo(31,34); g.lineTo(11,34); g.closePath(); g.stroke();
    g.lineWidth=1;
    for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(14,15+i*4); g.lineTo(28,15+i*4); g.stroke(); } });
  ICONS.hardwood=makeCanvas(40,40,(g)=>{
    g.fillStyle='#4a3322'; g.beginPath(); g.roundRect(6,14,28,12,5); g.fill();
    g.fillStyle='#5f4128'; g.beginPath(); g.ellipse(34,20,4,6,0,0,TAU); g.fill();
    g.strokeStyle='#2c1f14'; g.lineWidth=1.4;
    g.beginPath(); g.ellipse(34,20,4,6,0,0,TAU); g.stroke();
    g.beginPath(); g.ellipse(34,20,1.8,3,0,0,TAU); g.stroke();
    g.strokeStyle='rgba(20,12,6,0.6)';
    g.beginPath(); g.moveTo(8,18); g.lineTo(30,18); g.moveTo(8,22); g.lineTo(30,22); g.stroke(); });
  ICONS.ore=makeCanvas(40,40,(g)=>{
    g.fillStyle='#6f6a63'; g.beginPath();
    g.moveTo(8,28); g.lineTo(14,12); g.lineTo(26,10); g.lineTo(33,22); g.lineTo(28,30); g.closePath(); g.fill();
    g.strokeStyle='rgba(20,16,10,0.7)'; g.lineWidth=1.5; g.stroke();
    g.fillStyle='#a8562e'; for(const p of [[16,18],[24,15],[22,24],[14,25]]) g.fillRect(p[0],p[1],3.4,3.4); });
  ICONS.bar=makeCanvas(40,40,(g)=>{
    g.fillStyle='#8a919d'; g.beginPath();
    g.moveTo(7,24); g.lineTo(13,15); g.lineTo(33,15); g.lineTo(27,24); g.closePath(); g.fill();
    g.fillStyle='#c2c8d2'; g.fillRect(7,24,20,6);
    g.fillStyle='#5c626d'; g.beginPath(); g.moveTo(27,24); g.lineTo(33,15); g.lineTo(33,21); g.lineTo(27,30); g.closePath(); g.fill();
    g.strokeStyle='rgba(20,20,26,0.7)'; g.lineWidth=1.3;
    g.strokeRect(7,24,20,6); });
  ICONS.crystal=makeCanvas(40,40,(g)=>{
    g.fillStyle='#c96f1e'; g.beginPath();
    g.moveTo(20,5); g.lineTo(29,17); g.lineTo(24,34); g.lineTo(16,34); g.lineTo(11,17); g.closePath(); g.fill();
    g.fillStyle='#ff9a3c'; g.beginPath(); g.moveTo(20,9); g.lineTo(26,18); g.lineTo(20,31); g.lineTo(15,18); g.closePath(); g.fill();
    g.fillStyle='#ffe0b0'; g.fillRect(18,13,3,7);
    g.strokeStyle='rgba(60,25,5,0.8)'; g.lineWidth=1.4;
    g.beginPath(); g.moveTo(20,5); g.lineTo(29,17); g.lineTo(24,34); g.lineTo(16,34); g.lineTo(11,17); g.closePath(); g.stroke(); });
  ICONS.pearl=makeCanvas(40,40,(g)=>{
    g.fillStyle='#b9b4a4'; g.beginPath(); g.ellipse(20,27,14,8,0,0,Math.PI); g.fill();
    g.fillStyle='#e8e2d2'; g.beginPath(); g.arc(20,20,8,0,TAU); g.fill();
    g.fillStyle='#ffffff'; g.beginPath(); g.arc(17,17,2.6,0,TAU); g.fill();
    g.strokeStyle='rgba(90,85,70,0.7)'; g.beginPath(); g.arc(20,20,8,0,TAU); g.stroke(); });
  ICONS.bread=makeCanvas(40,40,(g)=>{
    g.fillStyle='#c9a24e'; g.beginPath(); g.roundRect(7,15,26,14,7); g.fill();
    g.fillStyle='#e0c070'; g.beginPath(); g.roundRect(7,15,26,7,7); g.fill();
    g.strokeStyle='rgba(90,60,20,0.8)'; g.lineWidth=1.4;
    g.beginPath(); g.roundRect(7,15,26,14,7); g.stroke();
    g.beginPath(); g.moveTo(13,17); g.lineTo(16,22); g.moveTo(19,16); g.lineTo(22,21); g.moveTo(25,17); g.lineTo(28,22); g.stroke(); });
  ICONS.cookedfish=makeCanvas(40,40,(g)=>{
    g.fillStyle='#c98d5f'; g.beginPath(); g.ellipse(18,20,12,6,0,0,TAU); g.fill();
    g.beginPath(); g.moveTo(28,20); g.lineTo(36,14); g.lineTo(36,26); g.closePath(); g.fill();
    g.strokeStyle='rgba(70,40,15,0.8)'; g.lineWidth=1.6;
    g.beginPath(); g.moveTo(10,15); g.lineTo(14,25); g.moveTo(16,14); g.lineTo(20,26); g.moveTo(22,15); g.lineTo(26,25); g.stroke();
    g.fillStyle='#3a2a1a'; g.beginPath(); g.arc(11,19,1.4,0,TAU); g.fill(); });
  ICONS.fang=makeCanvas(40,40,(g)=>{
    g.fillStyle='#eee7d8';
    g.beginPath(); g.moveTo(12,8); g.quadraticCurveTo(26,10,28,32);
    g.quadraticCurveTo(16,26,12,8); g.closePath(); g.fill();
    g.strokeStyle='rgba(60,45,25,0.8)'; g.lineWidth=1.5; g.stroke();
    g.fillStyle='#c9a24e'; g.fillRect(9,5,10,5);
  });
  // relic icon
  ICONS.relic=makeCanvas(40,40,(g)=>{
    g.fillStyle='#3a5a80'; g.beginPath();
    g.moveTo(20,4); g.lineTo(32,16); g.lineTo(20,36); g.lineTo(8,16); g.closePath(); g.fill();
    g.fillStyle='#8fd8ff'; g.beginPath();
    g.moveTo(20,8); g.lineTo(27,16); g.lineTo(20,30); g.lineTo(13,16); g.closePath(); g.fill();
    g.fillStyle='#e6f6ff'; g.fillRect(17,12,3,6);
    g.strokeStyle='rgba(10,20,35,0.8)'; g.lineWidth=1.5;
    g.beginPath(); g.moveTo(20,4); g.lineTo(32,16); g.lineTo(20,36); g.lineTo(8,16); g.closePath(); g.stroke();
  });
}
let TRAIN=null; // active training drill, if any
function beginOpenChest(b){
  if(b.opened){ openChest(b); return; }
  if(P.openCh && P.openCh.b===b) return;
  P.openCh={b, t:0, dur:1.5};
  P.click=null; Snd.step(6);
}
function openChest(b){
  if(b.opened){ toast('Empty - already plundered.'); return; }
  b.opened=true; b.kind='chestOpen';
  if(b.relic){
    bumpStat('chests');
    give('relic',1); giveGold(150);
    banner('THE STORMWATCH RELIC','+4 DAMAGE TO EVERY ATTACK');
    shockwave(b.x,b.y,'rgba(140,220,255,0.9)',60);
    burst(b.x,b.y-0.5,'#8fd8ff',20,3);
    Snd.levelup();
    return;
  }
  bumpStat('chests');
  if(b.cache){
    give('silk',1);
    toast('Beneath raider trinkets: <b>Mira\u2019s dawn-colored silk</b>, unspoiled. Now walk out alive.',5200);
    shockwave(b.x,b.y,'rgba(255,170,200,0.85)',44);
    burst(b.x,b.y-0.5,'#ffb0c8',14,2.2);
    Snd.quest();
    return;
  }
  if(b.rich){
    giveGold(rndi(b.rich*9,b.rich*16));
    if(Math.random()<0.6) give('potion',1);
    if(Math.random()<0.4){ give('crystal',1); toast('An <b>ember crystal</b> glows among the war-spoils!'); }
    if(Math.random()<0.15){ give('pearl',1); toast('A <b>pearl</b> among the spoils. Rare as mercy out here.'); }
    shockwave(b.x,b.y,'rgba(255,150,80,0.85)',48);
    burst(b.x,b.y-0.5,'#ffb060',16,2.4);
    Snd.levelup();
    return;
  }
  const roll=Math.random();
  giveGold(rndi(18,45));
  const rare=Math.random();
  if(rare<0.04){ give('pearl',1); toast('A <b>pearl</b> wrapped in oilcloth. A rare find!'); }
  else if(rare<0.07){ give('bar',1); toast('An <b>iron bar</b> stamped with an old mint mark.'); }
  if(roll<0.45){ give('potion',1); toast('An <b>Ember Tonic</b> among the coin!'); }
  else if(roll<0.6){ give('seed',2); }
  shockwave(b.x,b.y,'rgba(255,215,106,0.8)',36);
  burst(b.x,b.y-0.4,'#ffd76a',12,2.4);
  Snd.coin();
  setTimeout(autoSave,300);
}

function ensureGravelord(announce){
  if(G.worldId!=='isle' || qs('gravelord')!=='active') return;
  if(G.mobs.some(m=>m.kind==='gravelord' && !m.dead)) return;
  const m=spawnMob('gravelord', Math.round(ZONES.ruins.x), Math.round(ZONES.ruins.y));
  m.elite=true;
  if(announce) toast('A grave chill rises from the <b>Old Ruins</b> to the north...',5000);
}
/* ---------- sailing ---------- */
let sailing=false;
function departEarly(){
  if(sailing) return;
  sailing=true;
  toast('“Cast off! Barik, then - and luck to the bold.”',3000);
  const fade=document.getElementById('fadeOv');
  fade.style.opacity=1; Snd.splash();
  setTimeout(()=>{ switchWorld('main'); fade.style.opacity=0; sailing=false; }, 900);
}
function attemptSail(){
  if(sailing) return;
  if(G.worldId==='isle' && qs('setsail')!=='done'){
    if(qs('king')!=='done'){
      toast('Captain Brant eyes the tower. <b>"Strait\'s cursed while the Hollow King stands. Fell him first."</b>',4600);
    } else {
      const left=ISLE_IDS.filter(id=>qs(id)!=='done').length;
      if(left>0) toast('Captain Brant shakes his head. <b>"Not till every task ashore is settled."</b> '+left+' quest'+(left===1?'':'s')+' remain - check the log (📜).',5400);
      else toast('The hold is packed. <b>Speak with Captain Brant</b> to complete <b>Set Sail</b> first.',4800);
    }
    return;
  }
  sailing=true;
  const fade=document.getElementById('fadeOv');
  fade.style.opacity=1; Snd.splash();
  // isle -> Barik; the Sunward Isle sails home to Barik; Barik's dock returns
  // to the tutorial isle. (East never routed to 'main', so it fell through to
  // 'isle' and dumped you on the tutorial shore - fixed.)
  const dest = G.worldId==='east' ? 'main' : G.worldId==='isle' ? 'main' : 'isle';
  setTimeout(()=>{
    switchWorld(dest);
    setTimeout(()=>{ fade.style.opacity=0; sailing=false; },100);
  },780);
}
function snapshotWorld(){
  WORLDS[G.worldId]={map:G.map,solid:G.solid,variant:G.variant,nodes:G.nodes,decor:G.decor,
    plots:G.plots,npcs:G.npcs,mobs:G.mobs,foam:G.foam,crows:G.crows,forgePos:G.forgePos,
    decals:G.decals,cat:G.cat,critters:G.critters,base:mapBase};
}
function switchWorld(id){
  snapshotWorld();
  G.projs.length=0; G.parts.length=0; G.floats.length=0; G.fogs.length=0; G.fireflies.length=0;
  const def=WORLD_DEFS[id];
  MAPW=def.W; MAPH=def.H; SEED=def.seed; ZONES=def.zones;
  if(WORLDS[id]){
    const w=WORLDS[id];
    G.map=w.map; G.solid=w.solid; G.variant=w.variant; G.nodes=w.nodes; G.decor=w.decor;
    G.plots=w.plots; G.npcs=w.npcs; G.mobs=w.mobs; G.foam=w.foam; G.crows=w.crows;
    G.forgePos=w.forgePos; G.decals=w.decals; G.cat=w.cat; G.critters=w.critters||[]; mapBase=w.base;
  } else {
    G.map=new Uint8Array(MAPW*MAPH); G.solid=new Uint8Array(MAPW*MAPH); G.variant=new Uint8Array(MAPW*MAPH);
    G.nodes=[]; G.decor=[]; G.plots=[]; G.npcs=[]; G.mobs=[]; G.foam=[]; G.crows=[];
    G.decals=[]; G.cat=null; G.critters=[]; G.forgePos=null;
    def.gen();
  }
  G.worldId=id;
  P.x=def.spawn.x; P.y=def.spawn.y; P.dir={x:1,y:0}; P.fishing=null;
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  if(id==='main') award('globetrotter');
  if(id==='main' && !P.quests.mossbrew) P.quests.mossbrew='avail';
  if(id==='main' && !P.quests.pearlq && qs('fish')==='done') P.quests.pearlq='avail';
  if(id==='main'){
    for(const q2 of ['welcome2','hedda1','torv1','ivo1','ribbon1']) if(!P.quests[q2] && QUESTS[q2]) P.quests[q2]='avail';
    if(P.earlySail && !P.earlyKit){
      P.earlyKit=1;
      P.kit=true;
      P.unlocked.melee=true; P.unlocked.bow=true; P.unlocked.staff=true;
      P.swordTier=Math.max(P.swordTier||0,2);
      P.armorOwn=Math.max(P.armorOwn||0,2); P.armor=Math.max(P.armor||0,2);
      giveQuiet('potion',3); giveQuiet('bread',2); P.gold+=50;
      buildHotbar(); refreshUI();
      setTimeout(()=>{
        toast('Brant claps your shoulder on the gangway. <b>“I can\'t have you walking around unprepared, so here”</b> - steel sword, yew bow, oak staff, plate, tools, tonics, and fifty gold press into your arms. <b>“The isle\'s lessons, minus the homework. Don\'t make me regret the shortcut.”</b>',9000);
        Snd.quest(); autoSave();
      }, 1400);
    }
  }
  if(id==='main' && !P.quests.bounty){ P.quests.bounty='avail';
    setTimeout(()=>toast('A hooded figure watches from the Warden\'s post. <b style="color:var(--ember)">Warden Kell</b> has work.',5200),1500); }
  if(id==='east') for(const q3 of ['hunt1','surf1','wyrm']) if(!P.quests[q3] && QUESTS[q3]) P.quests[q3]='avail';
  if(id==='wind' && !P.prog.windSeen){ P.prog.windSeen=1;
    setTimeout(()=>toast('<b>Windsurf Isle</b> - awnings snap in the wind, the great wheel turns, and yet the harbor sits empty. Something has scared every boat from the water. <b>Rell the Harbormaster</b> waits at the docks.',7000),1400); }
  banner(def.title,def.sub); Snd.quest();
  updateQuestUI(); refreshUI();
  setTimeout(autoSave,400);
}

/* ---------- dodge roll ---------- */
function tryRoll(){
  if(P.dead || G.state!=='play' || dlg.open || G.interior) return;
  if((P.rollT||0)>0) return;
  if((P.rollCd||0)>0){
    // double dash (Moss's quickroot): one chained roll inside the cooldown window
    if(!(P.unlocked&&P.unlocked.dash2) || P.dashChain) return;
    P.dashChain=1;
  } else P.dashChain=0;
  P.rollT=0.26; P.rollCd=1.0; buzz(9);
  Snd.noise(0.16,0.05,600,0.7);
  for(let i=0;i<6;i++) G.parts.push({x:P.x+rnd(-0.3,0.3),y:P.y+rnd(-0.3,0.3),
    vx:-P.dir.x*rnd(0.5,1.2),vy:-P.dir.y*rnd(0.5,1.2),life:0.35,color:'rgba(200,190,160,0.6)',size:2.6});
}

