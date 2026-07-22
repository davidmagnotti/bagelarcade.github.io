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
const AERIE_ZONES = {
  dock:    {x:38, y:120, r:6,  name:'Skyfoot Landing', lv:[0,0]},
  village: {x:58, y:104, r:10, name:'Rookhaven', lv:[0,0]},
  aerie:   {x:102,y:56,  r:17, name:'The Screaming Aerie', lv:[11,13]}, // bird-walled plateau
  sanctum: {x:102,y:52,  r:5,  name:'The Roost Heart', lv:[12,13]},      // tome + serpent, tunnel-only
  tunnel:  {x:84, y:78,  r:3,  name:'The Underclimb', lv:[0,0]},         // tunnel entrance
  ridge:   {x:120,y:98,  r:11, name:'Windbite Ridge', lv:[0,0]}
};
const AERIEDEEP_ZONES = { // the catacomb beneath the Roost Heart, reached by the Underclimb
  entry:   {x:75, y:116, r:8,  name:'The Underclimb Landing', lv:[12,14]},
  ossuary: {x:75, y:86,  r:16, name:'The Ossuary',            lv:[12,14]},
  gallery: {x:75, y:54,  r:16, name:'The Gallery of Sigils',  lv:[13,14]},
  crypt:   {x:75, y:22,  r:14, name:"The Warden's Crypt",     lv:[14,14]}
};
const FROST_ZONES = {
  dock:     {x:40, y:120, r:6,  name:'Frostferry Landing', lv:[0,0]},
  village:  {x:62, y:106, r:10, name:'Hearthhold', lv:[0,0]},
  glacier:  {x:96, y:58,  r:16, name:'The Weeping Glacier', lv:[12,14]}, // guardian, at the frozen heart
  strait:   {x:114,y:112, r:13, name:'The Frozen Strait', lv:[0,0]},     // iced-over sea
  rimewood: {x:44, y:72,  r:12, name:'Rimewood', lv:[0,0]}
};
const FROSTDEEP_ZONES = { // the compact ice-dungeon beneath the Frozen Isle
  entry: {x:44, y:64, r:6,  name:'The Frostgate',     lv:[13,15]},
  ice:   {x:42, y:46, r:12, name:'The Frost-Lock Warren', lv:[13,15]},
  boss:  {x:44, y:22, r:11, name:'The Frozen Heart',  lv:[15,15]}
};
const FROSTVAULT_ZONES = { // THE GLACIER VAULT - a 5-room ice-puzzle dungeon under
  entry:  {x:40, y:84, r:8,  name:'The Icefall Landing', lv:[14,16]}, // the bear's old den
  slide1: {x:40, y:66, r:11, name:'The Frostgate Hall',  lv:[14,16]}, // lever -> gate
  glide:  {x:41, y:47, r:12, name:'The Pillar Hall',     lv:[15,17]}, // weave the pillars to the lever
  wards:  {x:40, y:28, r:11, name:'The Three Wards',     lv:[15,17]}, // pull-all-three lever puzzle
  hoard:  {x:44, y:10, r:12, name:'The Hoarfrost Hoard', lv:[16,16]}  // the reward chamber
};
const SKY_ZONES = { // THE CLOUDREACH - a rock adrift in the cloud-sea; Ashwing flies you up
  landing: {x:60, y:98, r:8,  name:'Cloudfall Landing', lv:[9,10]},  // where the dragon sets you down
  shrine:  {x:60, y:62, r:11, name:'The Windshrine',    lv:[9,10]},
  eyrie:   {x:60, y:30, r:13, name:"The Roc's Eyrie",   lv:[10,11]}, // the Storm Roc (gates Windsurf)
  leap:    {x:34, y:74, r:6,  name:'The Leap',          lv:[9,10]}   // parachute jump-off point -> Windsurf
};
const REACH_ZONES = { // STORMREACH - a storm-coast sea stop between Windsurf and the Frozen Isle
  strand: {x:60, y:98, r:8,  name:'Wreckstrand',         lv:[11,12]}, // the ferry lands here
  camp:   {x:58, y:64, r:11, name:'The Castaway Camp',   lv:[11,12]},
  graves: {x:34, y:74, r:8,  name:'The Drowned Graveyard',lv:[12,13]},// tomb-mouth into the catacomb
  barrow: {x:62, y:30, r:13, name:"The Brute's Barrow",  lv:[12,13]}, // the island monster
  dock:   {x:98, y:82, r:6,  name:'Stormreach Dock',     lv:[0,0]}    // the ferry berth (always open)
};
const REACHDEEP_ZONES = { // THE DROWNED CATACOMB - beneath the Stormreach graveyard
  entry:  {x:40, y:82, r:7,  name:'The Sunken Stair',  lv:[12,13]},
  ossuary:{x:40, y:52, r:12, name:'The Ossuary',       lv:[12,14]}, // three bone-locks bar the deep
  heart:  {x:40, y:18, r:12, name:'The Drowned Vault', lv:[13,14]}  // the warden + the hoard
};
const EASTDEEP_ZONES = { // THE EMBERDEEP - a small warded dungeon inside Mount Kea
  entry:   {x:40, y:84, r:8,  name:'The Emberthroat',     lv:[6,8]},
  font:    {x:40, y:66, r:11, name:'The Ember Font',      lv:[6,8]},   // visit-all plate puzzle
  causeway:{x:40, y:47, r:11, name:'The Sunken Causeway', lv:[7,9]},   // lever / lava-drain puzzle
  glyph:   {x:40, y:28, r:11, name:'The Warding Locks',   lv:[7,9]},   // button-order puzzle
  rest:    {x:40, y:10, r:14, name:"Ashwing's Rest",      lv:[9,9]}    // the dragon, at the very end
};
const MILLDEEP_ZONES = { // THE UNDERMILL - the grinding works beneath the Windsurf windmill
  entry: {x:19, y:43, r:6,  name:'The Millstair',         lv:[0,0]},
  works: {x:19, y:26, r:10, name:'The Grinding Floor',    lv:[0,0]}, // the three gear-locks
  vault: {x:19, y:8,  r:7,  name:"The Sailwright's Vault", lv:[0,0]}  // Nessa's sealed stormsail
};
var PALACE_BAR=null;   // continuous screen-space collision line for the palace wall (set in placeObjectsCrown)
const CROWN_ZONES = { // ALDERMERE - the royal capital, grandest of the realms
  dock:    {x:36, y:150, r:7,  name:'Kingsferry Quay', lv:[0,0]},
  harbor:  {x:52, y:140, r:11, name:'The Salt Quarter', lv:[0,0]},
  market:  {x:74, y:126, r:15, name:'The Grand Bazaar', lv:[0,0]},
  plaza:   {x:96, y:102, r:13, name:'Crown Plaza', lv:[0,0]},
  temple:  {x:118,y:112, r:8,  name:'The Cathedral of the Tide', lv:[0,0]},
  palace:  {x:100,y:64,  r:16, name:'The Tideglass Palace', lv:[0,0]},
  garden:  {x:130,y:78,  r:11, name:"The Drowned Queen's Garden", lv:[0,0]},
  barracks:{x:70, y:80,  r:9,  name:'The Garrison', lv:[0,0]},
  highrow: {x:126,y:140, r:11, name:'Highrow', lv:[0,0]}
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
    gen:()=>genWindAll() },
  aerie:{ W:150, H:150, seed:51789, zones:AERIE_ZONES,
    spawn:{x:38.5,y:120.5}, title:'THE AERIE ISLE', sub:'WHERE THE SKY ITSELF WAS TURNED AGAINST YOU',
    gen:()=>genAerieAll() },
  frost:{ W:150, H:150, seed:88243, zones:FROST_ZONES,
    spawn:{x:40.5,y:120.5}, title:'THE FROZEN ISLE', sub:'A STRAIT LOCKED IN CURSED WINTER',
    gen:()=>genFrostAll() },
  crown:{ W:180, H:180, seed:61137, zones:CROWN_ZONES,
    spawn:{x:33.5,y:150.5}, title:'ALDERMERE', sub:'THE ROYAL CAPITAL - SEAT OF THE TIDEGLASS THRONE',
    gen:()=>genCrownAll() },
  frostdeep:{ W:88, H:80, seed:33377, zones:FROSTDEEP_ZONES, dungeon:1, dark:0.18,
    spawn:{x:44.5,y:69.5}, title:'THE RIMEFISSURE', sub:'BENEATH THE FROZEN ISLE - A WARREN OF FROZEN STONE',
    gen:()=>genFrostDeepAll() },
  aeriedeep:{ W:150, H:130, seed:52411, zones:AERIEDEEP_ZONES, dungeon:1, dark:0.5,
    spawn:{x:75.5,y:119.5}, title:'THE UNDERCLIMB', sub:'A CATACOMB BENEATH THE ROOST - GRIT, BONE, AND OLD SIGILS',
    gen:()=>genAerieDeepAll() },
  eastdeep:{ W:80, H:96, seed:55219, zones:EASTDEEP_ZONES, dungeon:1, dark:0.34,
    spawn:{x:40.5,y:85.5}, title:'THE EMBERDEEP', sub:'THE FIRE-HEART OF MOUNT KEA - WALLED, WARDED, AND OLD',
    gen:()=>genEastDeepAll() },
  frostvault:{ W:80, H:96, seed:41983, zones:FROSTVAULT_ZONES, dungeon:1, dark:0.16,
    spawn:{x:40.5,y:86.5}, title:'THE GLACIER VAULT', sub:'THE ICE-BEAR’S DEN - FROZEN HALLS AND OLD FROST-WARDS',
    gen:()=>genFrostVaultAll() },
  sky:{ W:120, H:120, seed:70123, zones:SKY_ZONES, cloud:1,
    spawn:{x:60.5,y:98.5}, title:'THE CLOUDREACH', sub:'A ROCK ADRIFT IN THE CLOUD-SEA - WHERE THE STORM ROC ROOSTS',
    gen:()=>genSkyAll() },
  reach:{ W:120, H:120, seed:60947, zones:REACH_ZONES,
    spawn:{x:60.5,y:98.5}, title:'STORMREACH', sub:'A STORM-COAST OF BROKEN KEELS - AND THE BRUTE THAT MADE THEM',
    gen:()=>genReachAll() },
  reachdeep:{ W:80, H:96, seed:48311, zones:REACHDEEP_ZONES, dungeon:1, dark:0.42,
    spawn:{x:40.5,y:86.5}, title:'THE DROWNED CATACOMB', sub:'BENEATH THE STORMREACH GRAVES - BONE, BRINE, AND OLD LOCKS',
    gen:()=>genReachDeepAll() },
  milldeep:{ W:40, H:52, seed:39218, zones:MILLDEEP_ZONES, dungeon:1, dark:0.30,
    spawn:{x:19.5,y:46.5}, title:'THE UNDERMILL', sub:'THE OLD GRINDING WORKS - COG, SHAFT, AND STONE',
    gen:()=>genMillDeepAll() }
};
const WORLDS = {}; // cached generated worlds
// a dungeon is an underground world: no day/night cycle, no night-wraiths, its own
// fixed ambient darkness. Marked with `dungeon:1` on its WORLD_DEF.
function inDungeon(id){ const d=WORLD_DEFS[id||G.worldId]; return !!(d && d.dungeon); }

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
  addBuilding('house',FZ.x-6,FZ.y+5,'Farmhouse').closedMsg='The <b>Farmhouse</b> is dark - early to bed, early to the fields. A dog barks once, then thinks better of it.';
  addBuilding('lamp',FZ.x,FZ.y,'');
  const MZ=ZONES.mines;
  addBuilding('lamp',MZ.x+1,MZ.y-1,'');
  // Barik Keep - the Duchess's seat
  const CK=ZONES.castle;
  addBuilding('castle', CK.x,CK.y-3,'Barik Keep - Hall of Duchess Maelis');
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
  addBuilding('house',V.x-7,V.y-1,'Thimble & Thread (Clothier)').closedMsg='<b>Thimble &amp; Thread</b> has its shutters down and its needles away. “Mira sews by daylight, dear - come back then.”';
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
  G.npcs.push(makeNPC('maelis','Duchess Maelis of Barik', CK.x+0.5,CK.y+0.8,
    {skin:'#e0b088',hair:'#d8c090',shirt:'#6a3a5e',pants:'#3a2a3c',robe:'#5a2a52',trim:'#e8c860',hat:'crown',hairstyle:'long'},
    ["Barik feeds three baronies and fears one: the Vael March, north-east, where my cousin plays at war.",
     "A duchess rules by ledger and by patience. The sword is for those who run out of both."],0.5));
  { const kw=makeNPC('guardc1','Keep Warden', CK.x-2.5,CK.y+2.2,
    {skin:'#caa27b',hair:'#2e2a28',shirt:'#4a4f5e',pants:'#2f333c',armor:2,pauldrons:true},
    ["Her Majesty receives travelers. Mind your manners and your mud."],0.4);
    kw.nightOwl=true; G.npcs.push(kw); }   // the keep is guarded round the clock
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
     'My girl Wren turns twelve at the next full tide. I promised her something fine.',
     'Think on it: first my ribbons go missing, so my ferry sits idle. Then they say a dragon shut the eastern sky. Now word is Windsurf\'s own harbor has turned deadly. One door after another, latched between the isles - and always, they say, by some soft-spoken fellow who never raises his voice.'],0.3); cv2.nightOwl=true; return cv2; })());
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
       "The Duchess's cousin pays iron for iron. You've been warned once."],0.4));
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
  // the boat rides at anchor just off the landing - walk OUT toward open water and
  // drop it on the first sea tile, so YOU can climb aboard and set sail for home
  { const cx2=88, cy2=88, ddx=D.x-cx2, ddy=D.y-cy2, dl=Math.hypot(ddx,ddy)||1;
    for(let step=3; step<=16; step++){ const tx=Math.round(D.x+ddx/dl*step), ty=Math.round(D.y+ddy/dl*step);
      if(inb(tx,ty)){ const t=tileAt(tx,ty); if(t===T.SHALLOW||t===T.DEEP){ addBuilding('boat', tx, ty, ''); break; } } } }
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
  // the caldera: a broad molten pool at the summit's heart (glowing, impassable)
  G.decor.push({kind:'lava', x:C.x+0.5, y:C.y+0.5, r:C.r-0.3});
  for(let y=C.y-C.r;y<=C.y+C.r;y++) for(let x=C.x-C.r;x<=C.x+C.r;x++){
    if(inb(x,y) && dist(x,y,C.x,C.y)<=C.r-1.2) setSolid(x,y,1);
  }
  // Mount Kea reads as a LIVE volcano: a smoke-and-ember plume boiling off the
  // caldera, and glowing lava veins bleeding down the ash slopes
  G.decor.push({kind:'cratersmoke', x:C.x+0.5, y:C.y-0.3});
  { const pv=mulberry32(SEED+31);
    for(let i=0;i<48;i++){ const a=pv()*TAU, rr=1.4+pv()*(VO.r-2);
      const ax=Math.round(VO.x+Math.cos(a)*rr), ay=Math.round(VO.y+Math.sin(a)*rr*0.92);
      if(inb(ax,ay) && tileAt(ax,ay)===T.RUIN && !solidAt(ax,ay) && dist(ax,ay,C.x,C.y)>C.r-0.5)
        G.decor.push({kind:'lavacrack', x:ax+0.5, y:ay+0.5, seed:i, big: dist(ax,ay,C.x,C.y)<VO.r*0.5}); } }
  // the fissure at the caldera's foot is now the throat of a dungeon - the
  // fire-heart of Mount Kea, where old Ashwing rests at the very end
  G.decor.push({kind:'dungeonmouth', ember:1, x:C.x+0.5, y:C.y+C.r+1.5, label:'the Emberthroat'});
  addBuilding('lamp', C.x-2.5, C.y+C.r+1, ''); addBuilding('lamp', C.x+3.5, C.y+C.r+1, '');
  // reef treasure
  G.decor.push({kind:'chest', x:EAST_ZONES.reef.x+0.5, y:EAST_ZONES.reef.y+0.5, opened:false, rich:8});
}
function spawnEastFolk(){
  const V=EAST_ZONES.village, D=EAST_ZONES.dock;
  G.npcs.push((()=>{ const c2=makeNPC('corvoE','Captain Corvo', D.x+1.5,D.y+1.2,
    {skin:'#b98a62',hair:'#3a3634',shirt:'#3c4a5e',pants:'#2a3038',hat:'hood',hatColor:'#2f3a48'},
    ['Wren has not taken the ribbon off since we landed.',
     'The sloop\'s provisioned and riding at anchor off the landing. Whenever the island\'s done with you, just step aboard and cast off - she knows the way back to Barik.'],0.2); c2.nightOwl=true; return c2; })());
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
    ['The wind is a road, friend - but you\'d need a windsurf to ride it, and I\'ve no stormcloth to step a sail. That\'s Windsurf Isle\'s trade, out past the cloud-sea.',
     'I shaped boards once. Now the reef sits idle - no proper sail this side of Windsurf, and no board worth the name without one. Seek the whittler there, when the wind takes you.'],0.6));
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
  // Vath - a visiting Emberbinder who covets the dragon's fire and will lie to
  // get it. Once the wyrm is freed he's fled to the grove, no longer in the village
  // (quest-state gated so it survives reloads).
  if(qs('wyrm')!=='done')
    G.npcs.push(makeNPC('vath','Vath the Emberbinder', V.x-8.5,V.y-4.5,
      {skin:'#c2a892',hair:'#241a2e',robe:'#4a2a5e',rune:true,beard:'#2a2038'},
      ['The mountain\'s heat is... wasted, on a sleeping beast.',
       'You have the look of someone the world owes a favor. Climb the mountain; collect it.'],0.3));
}
/* The caldera set-piece: told the wyrm is evil, you climb Mount Kea and step
   INTO his lair, where he turns out kind. Vath's binding takes him mid-word;
   you're driven out to the caldera to break the spell in a fight. */
function dragonLairSpeak(){
  if(G.mobs && G.mobs.some(m=>m.kind==='dragon' && !m.dead)){ // he's enthralled, right here in the chamber
    lairDialog('Ashwing’s Rest','The violet has him. Ashwing rears over the fire-shelf, wings cracking the basalt - no more words to give. There is nowhere left to go but through him. <b>Break the spell.</b>',
      [{label:'Face him', cls:'gold', fn:()=>{ closeDialog(); if(G.interior) exitHouse(); }}]);
    return;
  }
  if(qs('wyrm')==='done'){
    lairDialog('Ashwing','“Rest by my fire as long as you like, little flame. A mountain remembers a kindness.” <i>His great eye turns up, past the smoke-hole, to the weather.</i> “And when horizons itch at you - there is a place above the clouds. A rock that floats in the cloud-sea, where the <b>Storm Roc</b> roosts and the whole archipelago lies spread out below like a map. My wings do not fear the height. Say the word and I will carry you up.”',
      [{label:'Fly me up to the Cloudreach', cls:'gold', fn:()=>{ askDragonFlight(); }},
       {label:'Rest a while', ghost:true, fn:closeDialog}]);
    return;
  }
  if(qs('wyrm')!=='active'){
    lairDialog('Ashwing','“You wear no binder’s violet - then we have no quarrel, traveller. You came a long way down for an old lizard’s hello. Mind the heat on your way back up.”',
      [{label:'Leave him be', fn:closeDialog}]);
    return;
  }
  lairDialog('Ashwing',
    '“You crossed my whole burning house with a blade in your fist. Vath’s errand, I would wager - he covets my fire, bottled.”',
    [{label:'Continue', fn:()=> lairDialog('Ashwing',
      '“I have warmed these waters since your grandmothers were girls. I am no monster, child - only old, and kind, and very tired. Go home, and tell her I said—”',
      [{label:'Continue', fn:()=> lairDialog('Vath',
        '<b style="color:#c77bff">Violet fire floods the chamber.</b> A voice pours from the walls: “Sentiment. Sleep, wyrm - or kill for me.” Ashwing’s eyes kindle red; his wings crack against the stone. He is between you and the only way out.',
        [{label:'Stand and fight', cls:'gold', fn:()=>{ closeDialog(); if(G.interior) exitHouse(); awakenDragon(); }}])}])}]);
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
  const C = G.worldId==='eastdeep' ? EASTDEEP_ZONES.rest : (ZONES.caldera||EAST_ZONES.caldera);
  const sp=findOpenNear(Math.round(P.x), Math.round(P.y+3), 7)
        || findOpenNear(Math.round(C.x), Math.round(C.y+ (G.worldId==='eastdeep'?4:7)), 8) || [C.x, C.y+4];
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
  const vi=G.npcs.findIndex(n=>n.id==='vath'); if(vi>=0) G.npcs.splice(vi,1); // he flees the village
  P.quests.vhunt='active'; P.prog.vhunt=0;
  // Vath fled up into the palm grove on the SURFACE - only spawn him there when we
  // are actually on the Sunward Isle (the fight is freed deep inside Mount Kea);
  // spawnMobsEast re-places him when you climb back out.
  if(G.worldId==='east'){
    const GR=EAST_ZONES.grove;
    if(!G.mobs.some(m=>m.kind==='mage' && !m.dead)){
      const sp=findOpenNear(Math.round(GR.x), Math.round(GR.y), 8) || [GR.x, GR.y];
      const mg=spawnMob('mage', sp[0], sp[1]);
      if(mg){ mg.state='idle'; mg.hx=sp[0]; mg.hy=sp[1]; mg.respawnT=-1; }
    }
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
  // if the hunt is underway and Vath hasn't yet been driven off (reload case),
  // he waits in the grove. Once bested (prog>=1) he's fled for good - no respawn.
  if(qs('vhunt')==='active' && (P.prog.vhunt||0)<1){
    const GR=EAST_ZONES.grove, sp=findOpenNear(Math.round(GR.x), Math.round(GR.y), 8) || [GR.x,GR.y];
    const mg=spawnMob('mage', sp[0], sp[1]); if(mg){ mg.hx=sp[0]; mg.hy=sp[1]; mg.respawnT=-1; }
  }
}
function genEastAll(){
  genEast(); bakeSolids(); placeObjectsEast(); buildFoam();
  spawnEastFolk(); spawnMobsEast();
  buildMapBase(); // without this the map keeps the previous world's base image
}

/* ---------- THE EMBERDEEP: a small warded dungeon inside Mount Kea ----------
   You descend the caldera fissure into a compact basalt dungeon of real walls and
   linked rooms, and CLIMB it chamber by chamber through narrow doorways:
     1. THE EMBER FONT  - light all three ember-fonts (tread every plate) to raise
        the first gate.
     2. THE SUNKEN CAUSEWAY - throw the old floodgate lever to drain the lava
        channel and raise the second gate.
     3. THE WARDING LOCKS - PRESS the four ember-runes in order I->IV. A wrong
        press wakes a barrow archer and darkens the runes; begin again from I.
   Only past all three does the last gate open onto Ashwing's Rest - the dragon
   conversation is the END of the dungeon, exactly as the fire-heart should be. */
const EDEEP = { // the tiles each sealed gate occupies (the 3-wide central corridors)
  gate1:{y:57, x0:39, x1:41}, gate2:{y:38, x0:39, x1:41}, gate3:{y:19, x0:39, x1:41}
};
let EDEEP_WALLS = [];   // basalt tiles that read as visible walls (bordering the floor)
function genEastDeep(){
  // the whole map begins as solid basalt; we cut the chambers out of it
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  carve(30,78,50,90);   // R0 THE EMBERTHROAT - entry landing (the way up sits here)
  carve(39,73,41,79);   // doorway A -> the Ember Font
  carve(28,59,52,74);   // R1 THE EMBER FONT - visit-all plate chamber
  carve(39,54,41,60);   // doorway B (Gate 1 seals it at y=57)
  carve(28,40,52,55);   // R2 THE SUNKEN CAUSEWAY - lever chamber
  carve(39,35,41,41);   // doorway C (Gate 2 seals it at y=38)
  carve(28,21,52,36);   // R3 THE WARDING LOCKS - button-order chamber
  carve(39,16,41,22);   // doorway D (Gate 3 seals it at y=19)
  carve(20,2,60,18);    // R4 ASHWING'S REST - the end chamber (room to break the spell)
  // R5 THE EMBER KING'S HOARD - an OPTIONAL walled vault off the Warding Locks,
  // sealed by an arcane ember-fence only the fire staff can break. Carved here (as
  // floor, before the wall-face pass) so its basalt walls render as real walls and
  // the fence doorway does NOT get recorded as basalt (it becomes the ember-gate).
  carve(54,24,61,34);   // the vault chamber, east of R3
  carve(52,28,54,30);   // the short approach corridor + the fence doorway
  // record the visible wall faces (basalt bordering the carved floor) BEFORE the
  // gates go solid, so an opened gate never leaves a phantom wall behind
  EDEEP_WALLS=[];
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(!solidAt(x,y)) continue;
    let border=false;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])
      if(inb(x+dx,y+dy) && !solidAt(x+dx,y+dy)){ border=true; break; }
    if(border) EDEEP_WALLS.push([x,y]);
  }
  // the three sealed gates start as solid basalt across their corridors
  for(const G2 of [EDEEP.gate1,EDEEP.gate2,EDEEP.gate3])
    for(let x=G2.x0;x<=G2.x1;x++){ setTile(x,G2.y,T.RUIN); setSolid(x,G2.y,1); }
}
function edeepLava(x,y,r){ // a molten pool that both glows and blocks the floor
  G.decor.push({kind:'lava', x:x+0.5, y:y+0.5, r});
  for(let yy=Math.round(y-r);yy<=Math.round(y+r);yy++) for(let xx=Math.round(x-r);xx<=Math.round(x+r);xx++)
    if(inb(xx,yy) && dist(xx,yy,x,y)<=r-0.2){ setSolid(xx,yy,1); }
}
function placeObjectsEastDeep(){
  G.decor=G.decor||[];
  const Z=EASTDEEP_ZONES;
  // the basalt walls that give the rooms their shape (baked static scenery)
  for(const [x,y] of EDEEP_WALLS) G.decor.push({kind:'ewall', x:x+0.5, y:y+0.5, s:((x*7+y*13)%5)});
  // the way back up the Emberthroat, in the landing chamber
  G.decor.push({kind:'dungeonmouth', ember:1, exit:1, x:40.5, y:88.5, label:'the way up'});
  setSolid(40,88,0); setTile(40,88,T.RUIN);
  // torches bracketed along the chamber walls
  for(const [tx,ty] of [[31,79],[49,79],[29,60],[51,60],[29,41],[51,41],[29,22],[51,22],[24,4],[56,4],[40,3]])
    if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // ---- PUZZLE 1 - THE EMBER FONT: tread all three fonts to raise Gate 1 ----
  edeepLava(40,68,2.2);                                    // a central molten font to route around
  edeepLava(31,63,1.2); edeepLava(49,63,1.2);
  for(const [tx,ty] of [[33,71],[40,61],[47,71]])
    G.decor.push({kind:'emberplate', x:tx+0.5, y:ty+0.5, group:'font', set:false});
  G.decor.push({kind:'firegate', gate:'g1', x:40.5, y:EDEEP.gate1.y+0.5, gy:EDEEP.gate1.y, x0:EDEEP.gate1.x0, x1:EDEEP.gate1.x1, open:false, label:'the Emberfont Gate'});
  // ---- PUZZLE 2 - THE SUNKEN CAUSEWAY: throw the floodgate lever ----
  // a lava channel bars the room; the lever waits past the notch, to the north-west
  for(let x=30;x<=50;x++){ if(x<38||x>42) edeepLava(x,48,1.0); }   // the channel (a walkable notch at x38..42)
  G.decor.push({kind:'emberlever', x:30.5, y:44.5, on:false, gate:'g2', label:'the floodgate lever'});
  G.decor.push({kind:'firegate', gate:'g2', x:40.5, y:EDEEP.gate2.y+0.5, gy:EDEEP.gate2.y, x0:EDEEP.gate2.x0, x1:EDEEP.gate2.x1, open:false, label:'the Causeway Gate'});
  // ---- PUZZLE 3 - THE WARDING LOCKS: press the four runes in order I->IV ----
  // a wrong press wakes a barrow archer and darkens every rune
  for(const [tx,ty,ord] of [[32,33,1],[48,33,2],[48,24,3],[32,24,4]])
    G.decor.push({kind:'emberbutton', x:tx+0.5, y:ty+0.5, group:'lock', ord, set:false});
  G.decor.push({kind:'firegate', gate:'g3', x:40.5, y:EDEEP.gate3.y+0.5, gy:EDEEP.gate3.y, x0:EDEEP.gate3.x0, x1:EDEEP.gate3.x1, open:false, label:'the Dragon Gate'});
  // ---- THE EMBER KING'S HOARD (optional): an arcane ember-fence across the vault
  // doorway, solid until the FIRE STAFF unmakes it. Inside waits the Double Dash. ----
  const FENCE=[[53,28],[53,29],[53,30]];
  for(const [x,y] of FENCE) setSolid(x,y,1);
  const ward={kind:'staffgate', x:53.5, y:29.5, tiles:FENCE, open:false, label:'the Ember Ward'};
  G.decor.push(ward);
  G.decor.push({kind:'chest', x:58.5, y:29.5, deep:1, emberking:1});
  G.decor.push({kind:'lamp', x:55.5, y:25.5}); G.decor.push({kind:'lamp', x:60.5, y:25.5});
  if(P.story && (P.story.emberWard || P.story.emberDone)){   // already broken - keep it open
    ward.open=true; for(const [x,y] of FENCE){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
  }
  // ---- ASHWING'S REST: the dragon dozes here; talking to him IS the finale ----
  edeepLava(24,6,1.6); edeepLava(56,6,1.6);
  G.decor.push({kind:'dragonrest', x:40.5, y:9.5});
  G.decor.push({kind:'chest', x:26.5, y:15.5, deep:1, rich:9});
  G.critters=[];
  G._emberPlate=null;   // reset the plate-tread tracker for this world
  // an already-won run (story-complete, or dev-toggled) opens straight to Ashwing
  if(P.story && P.story.emberDone){
    for(const b of G.decor){ if(b.kind==='firegate'){ b.open=true;
      for(let x=b.x0;x<=b.x1;x++){ setSolid(x,b.gy,0); setTile(x,b.gy,T.RUIN); } } }
  }
}
function spawnMobsEastDeep(){
  // bristlebacks have denned in the warm dark of the chambers - a little
  // resistance, but the LOCKS are the real challenge
  const packs=[ [EASTDEEP_ZONES.font,2], [EASTDEEP_ZONES.causeway,2], [EASTDEEP_ZONES.glyph,1] ];
  for(const [z,n] of packs){
    for(let i=0;i<n;i++){ const a=Math.random()*TAU, r2=Math.random()*z.r*0.55;
      const sp=findOpenNear(Math.round(z.x+Math.cos(a)*r2), Math.round(z.y+Math.sin(a)*r2), 5);
      if(sp) spawnMob('boar', sp[0], sp[1]); }
  }
}
function genEastDeepAll(){
  genEastDeep(); placeObjectsEastDeep(); spawnMobsEastDeep(); buildMapBase();
}
function enterEmberDungeon(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P._emberReturn={x:P.x, y:P.y+1.3}; P.click=null;
  setTimeout(()=>{ switchWorld('eastdeep'); if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function exitEmberDungeon(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.click=null;
  setTimeout(()=>{ switchWorld('east');
    const r=P._emberReturn; if(r){ P.x=r.x; P.y=r.y; G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function openFireGate(gate){
  const b=G.decor.find(d=>d.kind==='firegate' && d.gate===gate);
  if(!b || b.open) return;
  b.open=true; if(Snd.quest) Snd.quest();
  for(let x=b.x0;x<=b.x1;x++){ setSolid(x,b.gy,0); setTile(x,b.gy,T.RUIN); }
  shockwave(b.x0+2.5, b.gy+0.5, 'rgba(255,150,60,0.9)', 55); G.shake=0.5;
  invalidateScenery();
  const msg={ g1:['THE EMBERFONT GATE RISES','THE FONTS BURN AS ONE'],
              g2:['THE CAUSEWAY GATE GRINDS UP','THE LAVA SINKS AWAY'],
              g3:['THE DRAGON GATE OPENS','SOMETHING VAST STIRS BEYOND'] }[gate];
  if(msg) banner(msg[0],msg[1]);
  if(gate==='g1') toast('All three fonts flare gold at once and, deep in the wall, a counterweight lets go - the Emberfont Gate grinds up into the rock.',5000);
  else if(gate==='g2') toast('Old iron shrieks and the floodgate hauls open - the lava channel drains hissing into the dark, and the Causeway Gate lifts.',5200);
  else toast('The four runes blaze in sequence, the seal breaks, and the last gate swings inward on a wash of heat. Ashwing rests just beyond.',5400);
}
function pullEmberLever(b){
  if(b.on){ toast('The floodgate is already thrown - the lava has drained north.',3200); return; }
  b.on=true; if(Snd.quest) Snd.quest();
  // drain the causeway channel: clear the lava decor + its solids across the room
  G.decor=G.decor.filter(d=>!(d.kind==='lava' && d.y>60 && d.y<80));
  for(let y=68;y<=74;y++) for(let x=46;x<=84;x++) if(inb(x,y)) setSolid(x,y,0);
  invalidateScenery();
  openFireGate('g2');
}
function stepEmberPlate(b){
  if(b.set) return;
  if(b.group==='font'){ // visit-all: tread each font once
    b.set=true; Snd.pickup&&Snd.pickup(); burst(b.x,b.y-0.2,'#ffb04a',10,1.6);
    const grp=G.decor.filter(d=>d.kind==='emberplate' && d.group==='font');
    if(grp.every(d=>d.set)) openFireGate('g1');
    else addFloat((grp.filter(d=>d.set).length)+' / '+grp.length,b.x,b.y-1.4,'#ffd8a0',1.1);
    return;
  }
}
/* THE WARDING LOCKS: press the four ember-runes in order I->IV. A wrong press
   darkens every rune and wakes a barrow archer out of the ash. */
function pressEmberButton(b){
  const grp=G.decor.filter(d=>d.kind==='emberbutton' && d.group===(b.group||'lock'));
  if(b.set){ toast('That rune already burns. The order runs <b>I - II - III - IV</b>.',2600); return; }
  const nextNeeded=grp.filter(d=>d.set).length+1;
  if(b.ord===nextNeeded){
    b.set=true; Snd.pickup&&Snd.pickup(); burst(b.x,b.y-0.4,'#ffb04a',12,1.8);
    addFloat(['','I','II','III','IV','V'][b.ord]||'', b.x,b.y-1.5,'#ffe0b0',1.0);
    if(typeof invalidateScenery==='function') invalidateScenery();
    if(grp.every(d=>d.set)){ openFireGate('g3'); }
  } else {
    for(const d of grp) d.set=false;             // the whole ward resets
    if(typeof invalidateScenery==='function') invalidateScenery();
    Snd.hit&&Snd.hit(); if(Snd.boss) Snd.boss(); G.shake=0.4;
    burst(b.x,b.y-0.4,'#5a3020',14,2);
    const sp=findOpenNear(Math.round(b.x), Math.round(b.y)-1, 4) || [Math.round(b.x), Math.round(b.y)];
    const m=spawnMob('archer', sp[0], sp[1]);
    if(m){ m.state='chase'; m.respawnT=-1; m.noAggroT=0; shockwave(m.x,m.y,'rgba(120,150,180,0.7)',24); burst(m.x,m.y-0.4,'#c8d8e8',14,1.8); }
    toast('Wrong rune! The ward flares and a <b>barrow archer</b> claws up out of the ash. The runes go dark - begin again from <b>I</b>.',4200);
  }
}
/* THE EMBER WARD: an arcane fence across the hoard's doorway. Blades and arrows
   pass through it uselessly - ONLY a fire staff unmakes it. */
function dispelStaffGate(b){
  if(!b || b.open) return;
  if(!(P.unlocked && P.unlocked.staff)){
    toast('An <b>arcane ember-ward</b> hums across the way - no blade or arrow so much as marks it. Only a <b style="color:var(--ember)">fire staff</b> could unmake a working like this.',4800);
    Snd.step&&Snd.step(5); return;
  }
  b.open=true;
  for(const [x,y] of (b.tiles||[])){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
  P.story=P.story||{}; P.story.emberWard=1;
  if(typeof invalidateScenery==='function') invalidateScenery();
  Snd.magic&&Snd.magic(); G.shake=0.45;
  shockwave(b.x,b.y,'rgba(255,150,80,0.9)',44); burst(b.x,b.y-0.4,'#ffb060',20,2.6);
  banner('THE EMBER WARD BREAKS','THE HOARD LIES OPEN');
  toast('You level the fire staff and speak the counter-word. The ember-fence gutters, flares white, and blows out like a struck lantern. <b>The way is open.</b>',5200);
  autoSave&&autoSave();
}
function updateEastDeep(dt){
  const gx=Math.floor(P.x), gy=Math.floor(P.y);
  let onPlate=null;
  for(const b of G.decor){ if(b.kind==='emberplate' && Math.floor(b.x)===gx && Math.floor(b.y)===gy){ onPlate=b; break; } }
  const id = onPlate? (onPlate.group+':'+(onPlate.ord||0)) : null;
  if(id===G._emberPlate) return;   // still on the same plate (or none) - nothing new
  G._emberPlate=id;
  if(onPlate) stepEmberPlate(onPlate);
}
/* =====================================================================
   WINDSURF ISLE - an industrious city you drop onto from the Cloudreach by parachute
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
    // a broad ring of light shallows (~7 tiles) hems the island, so the windsurf
    // board has real water to range across before the dark deep begins
    if(d<rad-7) t=T.GRASS; else if(d<rad-2) t=T.SAND; else if(d<rad+7) t=T.SHALLOW;
    G.map[y*MAPW+x]=t;
  }
  const Z=WIND_ZONES;
  carveDisc(Z.town.x,Z.town.y,Z.town.r,T.GRASS,false);
  carveDisc(Z.market.x,Z.market.y,Z.market.r,T.GRASS,false);
  carveDisc(Z.resort.x,Z.resort.y,Z.resort.r,T.GRASS,false);
  carveDisc(Z.mill.x,Z.mill.y,Z.mill.r,T.GRASS,false);
  carveDisc(Z.bluffs.x,Z.bluffs.y,Z.bluffs.r,T.GRASS,false);
  carveDisc(Z.dock.x,Z.dock.y,5,T.SAND,false);
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
  // the harbor breakwater: a plank jetty reaching out over the water, where the
  // bound leviathan haunts the strait (the treacherous-tide quest happens here)
  const D=Z.dock;
  // the Leviathan's arena: a broad patch of LIGHT water out past the breakwater,
  // so once you have the board you windsurf off the jetty and range around the
  // beast to fight it, instead of poking it from a plank
  carveDisc(D.x, D.y+2+WIND_JETTY+1, 8, T.SHALLOW, false);
  for(let k=1;k<=WIND_JETTY;k++){ const jy=Math.round(D.y+2+k);
    for(let o=-1;o<=1;o++){ if(inb(D.x+o,jy)){ setTile(D.x+o,jy,T.PLANK); setSolid(D.x+o,jy,0); } } }
  // a moorage of open water alongside the pier, so the ferry floats on the sea
  for(let by=D.y+4;by<=D.y+8;by++) for(let bx=D.x+2;bx<=D.x+3;bx++)
    if(inb(bx,by) && tileAt(bx,by)!==T.PLANK) setTile(bx,by,T.SHALLOW);
}
const WIND_JETTY=16;
function leviathanHome(){ const D=WIND_ZONES.dock; return {x:D.x+0.5, y:D.y+2+WIND_JETTY+1.5}; }
function placeObjectsWind(){
  const Z=WIND_ZONES, T2=Z.town, M=Z.market, R=Z.resort, MI=Z.mill, WH=Z.wheel, D=Z.dock, B=Z.bluffs;
  // landmarks
  // Collision now matches each landmark's VISIBLE base instead of a big square that
  // read as invisible walls sprawling north of the sprite. For each: wipe the auto
  // footprint region, lay a solid block under the facade, then punch a doorway in
  // the south (front) face and seat the door hotspot right in front of it.
  const resort=addBuilding('resort', R.x, R.y, 'The Breakers Resort');
  for(let dy=-2;dy<=2;dy++) for(let dx=-4;dx<=4;dx++) setSolid(R.x+dx, R.y+dy, 0);
  for(let dy=-2;dy<=0;dy++) for(let dx=-4;dx<=4;dx++) setSolid(R.x+dx, R.y+dy, 1);  // solid facade you can't slip behind
  for(let dx=-1;dx<=1;dx++) setSolid(R.x+dx, R.y, 0);                                // grand doors, front-centre
  resort.door={x:R.x+0.5, y:R.y+1.4};
  const mill=addBuilding('windmill', MI.x, MI.y, 'Millward Windmill');
  for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) setSolid(MI.x+dx, MI.y+dy, 0);
  for(let dy=-1;dy<=1;dy++) for(let dx=-2;dx<=2;dx++) setSolid(MI.x+dx, MI.y+dy, 1);  // tight round base, no walls up-screen
  for(let dx=-1;dx<=1;dx++) setSolid(MI.x+dx, MI.y+1, 0);                             // doorway, south face
  mill.door={x:MI.x+0.5, y:MI.y+1.6};
  // THE UNDERMILL: a stone stair-hatch just east of the windmill drops into the old
  // grinding works, where Nessa's lost stormsail lies sealed behind the gear-locks
  const mouth=findOpenNear(Math.round(MI.x+4), Math.round(MI.y+1), 4) || [Math.round(MI.x+4), Math.round(MI.y+1)];
  setSolid(mouth[0], mouth[1], 0);
  G.decor.push({kind:'dungeonmouth', mill:1, x:mouth[0]+0.5, y:mouth[1]+0.5, label:'the Undermill', name:'THE UNDERMILL'});
  const wheel=addBuilding('waterwheel', WH.x, WH.y, 'The Old Waterwheel');
  for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=4;dx++) setSolid(WH.x+dx, WH.y+dy, 0);
  for(let dy=-1;dy<=1;dy++) for(let dx=-2;dx<=3;dx++) setSolid(WH.x+dx, WH.y+dy, 1);  // mill-house AND the wheel to its east
  for(let dx=-2;dx<=0;dx++) setSolid(WH.x+dx, WH.y+1, 0);                             // doorway on the mill-house side
  wheel.door={x:WH.x-0.5, y:WH.y+1.6};
  // ---- the working town: two tidy terraces facing the green, well at centre ----
  addBuilding('house2', T2.x-4, T2.y-6, 'Harbor Guildhall');
  addBuilding('house',  T2.x+2, T2.y-6, 'The Trade Winds Inn');
  addBuilding('house2', T2.x-8, T2.y-1, 'The Chandlery');
  addBuilding('house',  T2.x+7, T2.y-1, 'Breezy Cottage');
  addBuilding('house',  T2.x-5, T2.y+5, 'Windsurf Inn (Inn)');
  addBuilding('house2', T2.x+3, T2.y+5, 'Sailmaker\'s Loft');
  addBuilding('well',   T2.x, T2.y, 'Town well');
  // ---- Trade Row: a proper market, stalls lined in two neat rows either side
  // of the plaza aisle, east and west kept open for the roads ----
  const NORTH=[['fruitstand','Fruit stand'],['stall','Shell trinkets'],['fruitstand','Grocer\'s cart'],['stall','Rope & tackle'],['fruitstand','Spice-plum stall']];
  const SOUTH=[['stall','Curios & knick-knacks'],['fruitstand','Baker\'s cart'],['stall','Windvane whittler'],['fruitstand','Fishmonger'],['stall','Sailcloth remnants']];
  NORTH.forEach(([k,l],i)=> addBuilding(k, M.x-4+i*2, M.y-3, l));
  SOUTH.forEach(([k,l],i)=> addBuilding(k, M.x-4+i*2, M.y+3, l));
  // You came DOWN onto Windsurf on the Roc's stormsail - there is no dragon here, and
  // no keel crosses the cursed strait until you calm it. So until the tide is calmed
  // you are meant to be stranded: fix the strait and the ferry opens, your way out.
  if(P.story && P.story.tideCalm) addBuilding('boat', D.x+2, D.y+6, '');
  addBuilding('lamp', D.x, D.y-1, '');
  addBuilding('lamp', D.x+3, D.y+1, '');
  addBuilding('lamp', M.x-6, M.y, ''); addBuilding('lamp', M.x+6, M.y, '');
  addBuilding('lamp', R.x-4, R.y+3, ''); addBuilding('lamp', R.x+4, R.y+3, '');
  // town-green lamps at the terrace corners
  addBuilding('lamp', T2.x-6, T2.y-4, ''); addBuilding('lamp', T2.x+5, T2.y-4, '');
  addBuilding('lamp', T2.x-6, T2.y+4, ''); addBuilding('lamp', T2.x+5, T2.y+4, '');
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
  G.npcs.push(makeNPC('pia','Pia of Trade Row', M.x-2.5, M.y-1.5,
    {skin:'#c99a6e',hair:'#241c16',shirt:'#c85a3a',pants:'#3a2c26',hairstyle:'long'},
    ['Mangoes, sugar-melon, spice-plums - all island-grown, none of it shipped, so it\'s cheap and it\'s fresh.',
     'Buy something, friend? A stall with no customers is just a sad little roof.'],0.4));
  G.npcs.push(makeNPC('tolen','Tolen the Whittler', M.x+2.5, M.y+1.5,
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
  const D=WIND_ZONES.dock;
  const yd=findOpenNear(Math.round(D.x+4),Math.round(D.y-3),5);
  if(yd) spawnMob('dummy',yd[0],yd[1]);
  // The Bound Leviathan is NOT placed on load - it only surfaces once you windsurf
  // out onto the open water past the breakwater (see updateWind). This keeps the
  // beast out of the harbor until you actually go out to meet it.
}
// While the tide hunt is active, surface the Leviathan the moment the hero
// windsurfs OUT past the jetty onto the open light water - not while still ashore.
function updateWind(dt){
  if(G.worldId!=='wind') return;
  if(!(qs('tide')==='active') || (P.story && P.story.tideCalm)) return;
  if(!(P.unlocked && P.unlocked.surf)) return;
  if(G.mobs && G.mobs.some(m=>m.kind==='leviathan' && !m.dead)) return;
  const D=WIND_ZONES.dock;
  const onWater = tileAt(Math.floor(P.x),Math.floor(P.y))<=T.SHALLOW;
  const pastJetty = P.y > D.y+2+WIND_JETTY-1;   // out beyond the pier's end
  if(onWater && pastJetty){
    const lv=spawnLeviathan();
    if(lv){ G.shake=0.7; Snd.boss&&Snd.boss();
      banner('THE BOUND LEVIATHAN','IT RISES FROM THE DEEP');
      setTimeout(()=>toast('The water heaves and something vast breaks the surface off the breakwater, ringed in <b style="color:#c9a0ff">violet light</b>. The <b>Bound Leviathan</b> has you now - stay on the light water and end it.',6000),300);
    }
  }
}
function spawnLeviathan(){
  if(G.mobs && G.mobs.some(m=>m.kind==='leviathan' && !m.dead)) return null;
  const h=leviathanHome();
  const lv=spawnMob('leviathan', h.x-0.5, h.y-0.5);
  if(lv){ lv.boss=true; lv.bigBoss=true; lv.rooted=1; lv.title='THE BOUND LEVIATHAN';
    lv.hx=h.x; lv.hy=h.y; lv.x=h.x; lv.y=h.y; lv.state='chase'; lv.noAggroT=0; lv.respawnT=-1; }
  return lv;
}
function freeLeviathan(m){
  // Beaten, the binding shatters - the beast is a victim, not a foe. It sinks
  // calm, the strait goes glassy, and Vath's violet mark is left behind on the water.
  m.freed=1; m.dead=true; m.respawnT=-1; m.state='idle';
  Snd.boss&&Snd.boss(); G.shake=0.9; G.slowmo=1.15;
  shockwave(m.x,m.y,'rgba(150,220,245,0.95)',95);
  for(let i=0;i<30;i++){ const a=Math.random()*TAU, sp=rnd(1,4);
    G.parts.push({x:m.x,y:m.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-0.8,life:rnd(0.8,1.7),color:Math.random()<0.5?'#bfe8ff':'#8fd0e0',size:rnd(2,5),grav:0.05}); }
  P.story.tideCalm=1; P.story.vathMet=1;
  // the strait is safe: the ferry can finally moor at the pier (it was hidden while
  // no hull could live in the water). Add it now so it's there without a reload.
  if(G.worldId==='wind' && !G.decor.some(d=>d.kind==='boat')){
    const D=WIND_ZONES.dock; addBuilding('boat', D.x+2, D.y+6, ''); invalidateScenery&&invalidateScenery();
  }
  banner('THE TIDE GOES CALM','THE STRAIT IS OPEN - BOATS MAY CROSS AGAIN');
  if(qs('tide')==='active') completeQuest('tide');
  updateWindFolkMood();
  setTimeout(()=>toast('The leviathan sinks - not slain, but <b>unbound</b> - and the killing water goes glass-flat. Where it dove, a slick of <b style="color:#c9a0ff">violet light</b> curls and fades. Back on the pier <b>Rell</b> grips your arm, half-laughing: “First calm water in a season - you\'ll never pay for a bed in Windsurf again.” Then, quieter: “There was a <b>robed man</b> here before the beast came. Soft-spoken. Violet thread at his cuffs. Asking after the old deep-magics. You know the sort?”',10000),1400);
}
function updateWindFolkMood(){
  // once the strait reopens, the town's talk turns from despair to bustle
  if(!(P.story && P.story.tideCalm)) return;
  const set=(id,lines)=>{ const n=G.npcs.find(x=>x.id===id); if(n){ n.idleLines=lines; n.li=0; } };
  set('rell',['Boats in the harbor again! First hull to cross in a season put in this morning.','Whatever you did out past the breakwater - the water\'s a mill-pond now. Windsurf owes you its livelihood.']);
  set('coralie',['We have GUESTS! Three rooms let by noon. The Breakers is alive again - come, the salt baths are hot.','Bless you, traveller. The awnings are down and the sea view is open for trade.']);
  set('pia',['Sold clean out of sugar-melon by midday - sailors buy like it\'s a festival!','Trade Row hums again. Take a spice-plum, on the house, for what you did.']);
  set('nessa',['Every loom in my loft is running - the fleet wants canvas and they want it yesterday!','Told you: the day a boat could cross, I\'d have this town in sail by nightfall. And so I have.']);
}
function genWindAll(){
  genWind(); bakeSolids(); placeObjectsWind(); buildFoam();
  spawnWindFolk(); spawnMobsWind();
  buildMapBase();
}
/* A short, SELF-EXPIRING lock so a double-tap can't launch two flights, but a flight
   that never completes (a throw, a stale build) can never permanently wedge the next
   one. Returns true if the caller may proceed. */
function flightLockOK(){
  const now=(typeof performance!=='undefined'&&performance.now)?performance.now():(G.time*1000||0);
  if(G._flyUntil && now < G._flyUntil) return false;
  G._flyUntil = now + 1800; G._flying=1; return true;
}
/* Ashwing's wing carries you between the isles and up into the cloud-sea. */
function flyToWorld(id, msg){
  if(!flightLockOK()) return;
  closeDialog(); if(G.interior) exitHouse();
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1;
  if(msg) toast(msg,4200);
  if(Snd.boss) Snd.boss();
  setTimeout(()=>{ try{ switchWorld(id); autoSave(); } finally { setTimeout(()=>{ if(fd) fd.style.opacity=0; G._flying=0; G._flyUntil=0; },220); } },900);
}
function askDragonFlight(){
  P.prog.windKnown=1; P.story=P.story||{}; P.story.skyKnown=1;
  flyToWorld('sky','Ashwing lowers a wing. You climb his warm shoulder and he beats up through the caldera smoke - up and up, past the last ragged cloud, to a rock that floats where no rock should.');
}
function askAshwingHome(){
  const btns=[ {label:'Fly to the Sunward Isle', cls:'gold', fn:()=>{ closeDialog();
        flyToWorld('east','You climb Ashwing\'s warm shoulder and he springs from the shore - the wind slams past and Windsurf falls away behind you, small and bright on the sea.'); }} ];
  // once the Windsurf strait is calmed, Ashwing will bear you UP into the cloud-sea
  if(P.story && P.story.tideCalm){
    btns.push({label:'Fly up into the Cloudreach', fn:()=>{ closeDialog(); flyToCloudreach(); }});
  }
  btns.push({label:'Not just yet', ghost:true, fn:closeDialog});
  setDialog('<i>Ashwing swings his great head round and rumbles low - warm, patient, ready. He will carry you across the strait, or up past the last cloud, whenever you say the word.</i>', btns);
}
/* =====================================================================
   THE AERIE ISLE - Vath turned the sky against the island. Screaming
   raptors wall off the plateau; the only way in is the old Underclimb
   tunnel, to a sealed roost-heart where a cursed tome (and its serpent
   warden) must be destroyed to give the birds their minds back.
   ===================================================================== */
function aerieTunnelExit(){ const S=AERIE_ZONES.sanctum; return {x:S.x+0.5, y:S.y+2.5}; }
function aerieTunnelEntry(){ const T2=AERIE_ZONES.tunnel; return {x:T2.x+0.5, y:T2.y+0.5}; }
function genAerie(){
  const rng=mulberry32(SEED);
  const CX2=75, CY2=90, R0=54;
  const wob=[]; for(let i=0;i<64;i++) wob.push(rng()*10-5);
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const dx=x-CX2, dy=y-CY2, d=Math.hypot(dx,dy), a=Math.atan2(dy,dx);
    const wi=((Math.floor((a+Math.PI)/TAU*64))%64+64)%64;
    const rad=R0+wob[wi]+5*Math.sin(a*5+2.1);
    let t=T.DEEP;
    if(d<rad-7) t=T.GRASS; else if(d<rad-2) t=T.SAND; else if(d<rad+2) t=T.SHALLOW;
    G.map[y*MAPW+x]=t;
  }
  const Z=AERIE_ZONES;
  // the aerie: a broad walkable rock plateau the raptors patrol
  carveDisc(Z.aerie.x, Z.aerie.y, Z.aerie.r, T.RUIN, true);
  for(let y=Z.aerie.y-Z.aerie.r-4;y<=Z.aerie.y+Z.aerie.r+4;y++) for(let x=Z.aerie.x-Z.aerie.r-4;x<=Z.aerie.x+Z.aerie.r+4;x++){
    if(inb(x,y)){ const dd=dist(x,y,Z.aerie.x,Z.aerie.y);
      if(dd>Z.aerie.r && dd<=Z.aerie.r+3 && tileAt(x,y)===T.GRASS) setTile(x,y,T.SOIL); }
  }
  // the sealed Roost Heart: a ruined stone dungeon at the plateau's crown,
  // ringed by cliff and reachable only through the Underclimb tunnel warp
  carveDisc(Z.sanctum.x, Z.sanctum.y, Z.sanctum.r-1, T.RUIN, false);
  // the roost above is a hollow, empty ruin now (the warden moved to the catacomb
  // below), so its old seal-ring is purely decorative - keep the ruin stones but
  // drop the invisible wall, so the northern plateau roams free
  for(let a=0;a<TAU;a+=0.10){ for(let rr=Z.sanctum.r; rr<=Z.sanctum.r+1; rr++){
    const rx=Math.round(Z.sanctum.x+Math.cos(a)*rr), ry=Math.round(Z.sanctum.y+Math.sin(a)*rr);
    if(inb(rx,ry)) setTile(rx,ry,T.RUIN); } }
  // village clearing + dock cove
  carveDisc(Z.village.x,Z.village.y,9,T.GRASS,false);
  carveDisc(Z.dock.x,Z.dock.y,5,T.SAND,false);
  // the tunnel-mouth clearing at the plateau's foot
  carveDisc(Z.tunnel.x,Z.tunnel.y,2,T.RUIN,false);
  // roads: dock -> village -> the underclimb
  carveLine(Z.dock.x,Z.dock.y, Z.village.x,Z.village.y, T.PATH,0);
  carveLine(Z.village.x,Z.village.y, Z.tunnel.x,Z.tunnel.y, T.PATH,0);
}
function placeObjectsAerie(){
  const Z=AERIE_ZONES, V=Z.village, D=Z.dock, T2=Z.tunnel, S=Z.sanctum;
  addBuilding('house2', V.x-4, V.y-3, 'Rookhaven roundhouse');
  addBuilding('house', V.x+3, V.y-2, 'The Windward Rest (Inn)');
  addBuilding('house2', V.x+5, V.y+3, 'Falconer\'s mews');
  addBuilding('well', V.x, V.y, 'Cliffspring well');
  addBuilding('lamp', D.x, D.y-1, '');
  // the ferry boat floats just off the landing on open water (never on the beach)
  { const cx2=75, cy2=90, ddx=D.x-cx2, ddy=D.y-cy2, dl=Math.hypot(ddx,ddy)||1;
    for(let step=3; step<=16; step++){ const tx=Math.round(D.x+ddx/dl*step), ty=Math.round(D.y+ddy/dl*step);
      if(inb(tx,ty)){ const t=tileAt(tx,ty); if(t===T.SHALLOW||t===T.DEEP){ addBuilding('boat', tx, ty, ''); break; } } } }
  addBuilding('lamp', V.x-6, V.y+4, ''); addBuilding('lamp', V.x+7, V.y-4, '');
  // the Underclimb tunnel-mouth at the plateau's foot now bores straight down into
  // the catacomb beneath the Roost Heart. Interacting descends into the dungeon world.
  const en=aerieTunnelEntry();
  G.decor.push({kind:'tunnelmouth', x:en.x, y:en.y, deep:1, label:'the Underclimb', name:'THE UNDERCLIMB ▼'});
  // a cairn signpost beside the mouth so nobody mistakes it for a dead-end warp
  G.decor.push({kind:'pillar', x:en.x-2.4, y:en.y+0.6, broken:false, loreKey:'underclimb'});
  addBuilding('lamp', Math.round(en.x)-2, Math.round(en.y)+1, ''); addBuilding('lamp', Math.round(en.x)+2, Math.round(en.y)+1, '');
  // a TON of tumbled stone barricading the Underclimb - solid boulders scattered
  // thick around the mouth so you must weave through them (a narrow way stays open)
  { const tb=mulberry32(SEED+61);
    for(let i=0;i<52;i++){ const a=tb()*TAU, rr=2.2+tb()*6;
      const bx=Math.round(T2.x+Math.cos(a)*rr), by=Math.round(T2.y+Math.sin(a)*rr);
      if(inb(bx,by) && walkTile(tileAt(bx,by)) && !solidAt(bx,by)
         && dist(bx,by,T2.x,T2.y)>1.6 && dist(bx,by,en.x,en.y)>1.6 && tb()<0.55){
        G.decor.push({kind:tb()<0.5?'pillarBroken':'pillar', x:bx+0.5, y:by+0.5, broken:tb()<0.5, boulder:1});
        setSolid(bx,by,1); } } }
  // the cursed tome and its warden no longer sit here in the open - they lie deep in
  // the catacomb below now, past two sealed gates. The roost heart above is a hollow,
  // wind-scoured ruin, the Underclimb its only throat.
  // dungeon dressing: a ruined colonnade ringing the roost heart (decorative -
  // they frame the arena without blocking the fight)
  for(let i=0;i<6;i++){ const a=i/6*TAU + 0.5, px=S.x+Math.cos(a)*(S.r-1.3), py=S.y+Math.sin(a)*(S.r-1.3);
    if(inb(Math.round(px),Math.round(py))) G.decor.push({kind:i%2?'pillarBroken':'pillar', x:px+0.5, y:py+0.5, broken:i%2===1, loreKey:'roost'}); }
  // greenery on the lower slopes; wind-bent trees
  const pr=mulberry32(SEED+13);
  for(let i=0;i<170;i++){ const ax=Math.floor(pr()*MAPW), ay=Math.floor(pr()*MAPH), t=tileAt(ax,ay);
    if((t===T.GRASS&&pr()<0.22)||(t===T.SAND&&pr()<0.12)){ if(solidAt(ax,ay)) continue;
      if(dist(ax,ay,V.x,V.y)<4||dist(ax,ay,D.x,D.y)<4) continue; addNode('tree',ax,ay); } }
  for(let i=0;i<20;i++){ const ax=Math.floor(pr()*MAPW), ay=Math.floor(pr()*MAPH);
    if(tileAt(ax,ay)===T.SAND && !solidAt(ax,ay)) addNode('shell',ax,ay); }
  for(let i=0;i<30;i++){ const a=pr()*TAU, rr=6+pr()*(Z.aerie.r-6); // ore on the crags
    const ax=Math.round(Z.aerie.x+Math.cos(a)*rr), ay=Math.round(Z.aerie.y+Math.sin(a)*rr*0.92);
    if(inb(ax,ay) && tileAt(ax,ay)===T.RUIN && !solidAt(ax,ay) && dist(ax,ay,S.x,S.y)>S.r+1) addNode('rock',ax,ay); }
  G.critters=[];
}
function spawnAerieFolk(){
  const Z=AERIE_ZONES, V=Z.village;
  G.npcs.push(makeNPC('wrenna','Wrenna the Rookmother', V.x+0.5, V.y+2.5,
    {skin:'#b58a5e',hair:'#cfc7b8',shirt:'#5a6a4a',pants:'#3a3a2c',hairstyle:'bun'},
    ['My birds raised me and I raised them, and now they\'d take my eyes if I climbed the plateau. Something up there has turned their hearts.',
     'They were gentle a season ago. Then a robed man walked up the Underclimb and never walked down. The screaming started that night.'],0.4));
  G.npcs.push(makeNPC('cade','Cade the Falconer', V.x+4.5, V.y+3.5,
    {skin:'#a9784e',hair:'#3a2e26',shirt:'#4a5a6a',pants:'#33302a',beard:'#3a2e26'},
    ['Don\'t go up the open slope, friend - you\'ll be ribbons before the first ledge.',
     'There\'s an old miners\' tunnel down by the plateau\'s foot - the Underclimb. It doesn\'t climb, whatever the old songs say; it drops into a catacomb under the roost. That\'s where the curse is anchored. Beat your way to the bottom, put down the warden, and burn the tome it guards - THEN the birds get their minds back.'],0.4));
}
function spawnMobsAerie(){
  const Z=AERIE_ZONES;
  // the raptors that WALL OFF the plateau - a dense, aggressive guard ring so
  // you truly can't cross the big section on foot, plus patrols wheeling across
  // it, until the tome that maddened them is destroyed. They leash back to their
  // posts, so the plateau stays guarded.
  if(!(P.story && P.story.aerieFreed)){
    const pr=mulberry32(SEED+29), A=Z.aerie, S=Z.sanctum, T2=Z.tunnel;
    const guardOK=(sp)=> sp && dist(sp[0],sp[1],S.x,S.y) > S.r+2;
    // a dense double ring around the plateau rim - no gap to slip through
    for(let i=0;i<26;i++){ const a=(i/26)*TAU + pr()*0.14, rr=A.r-3+pr()*3;
      const sp=findOpenNear(Math.round(A.x+Math.cos(a)*rr), Math.round(A.y+Math.sin(a)*rr*0.95), 6);
      if(guardOK(sp)){ const rp=spawnMob('raptor', sp[0], sp[1]); if(rp) rp.aggro=14; } }
    // interior patrols
    for(let i=0;i<10;i++){ const a=pr()*TAU, rr=3+pr()*(A.r-6);
      const sp=findOpenNear(Math.round(A.x+Math.cos(a)*rr), Math.round(A.y+Math.sin(a)*rr), 5);
      if(guardOK(sp)){ const rp=spawnMob('raptor', sp[0], sp[1]); if(rp) rp.aggro=14; } }
    // a screaming flock hemming the Underclimb itself - the true gate is guarded
    for(let i=0;i<8;i++){ const a=pr()*TAU, rr=2+pr()*4;
      const sp=findOpenNear(Math.round(T2.x+Math.cos(a)*rr), Math.round(T2.y+Math.sin(a)*rr), 4);
      if(sp && dist(sp[0],sp[1],T2.x,T2.y)>1.6){ const rp=spawnMob('raptor', sp[0], sp[1]); if(rp) rp.aggro=13; } }
  } else { // freed: gentle birds wheel the crags again
    G.critters=G.critters||[];
    const pr=mulberry32(SEED+31);
    for(let i=0;i<8;i++){ const a=pr()*TAU, rr=4+pr()*(Z.aerie.r-3);
      const ax=Math.round(Z.aerie.x+Math.cos(a)*rr), ay=Math.round(Z.aerie.y+Math.sin(a)*rr);
      if(inb(ax,ay)&&!solidAt(ax,ay)) G.critters.push({kind:'fowl',x:ax+0.5,y:ay+0.5,home:{x:ax+0.5,y:ay+0.5},tx:null,ty:null,wt:rnd(0.5,4),face:pr()<0.5?-1:1,anim:pr()*6,range:4,col:'#d8d2c4',moving:false}); }
  }
  // the serpent warden no longer coils here - it guards the tome deep in the
  // catacomb below (see spawnMobsAerieDeep). The plateau is walled by birds alone.
  const yd=findOpenNear(Math.round(Z.village.x+7),Math.round(Z.village.y+5),5);
  if(yd) spawnMob('dummy',yd[0],yd[1]);
}
function spawnSerpent(){
  if(G.mobs && G.mobs.some(m=>m.kind==='serpent' && !m.dead)) return null;
  const S=AERIE_ZONES.sanctum, sp=findOpenNear(Math.round(S.x), Math.round(S.y+2), 3) || [S.x, S.y+2];
  const sn=spawnMob('serpent', sp[0], sp[1]);
  if(sn){ sn.boss=true; sn.bigBoss=true; sn.title='THE TOME-WARDEN'; sn.hx=sp[0]; sn.hy=sp[1]; sn.state='idle'; sn.respawnT=-1; }
  return sn;
}
function destroyTome(b){
  if(b.destroyed) return;
  if(G.mobs && G.mobs.some(m=>m.kind==='serpent' && !m.dead)){
    toast('The tome will not so much as singe while the <b>serpent warden</b> lives. Put the warden down first.',4600); return;
  }
  b.destroyed=true;
  P.story.aerieFreed=1; P.story.vathMet=1;
  Snd.boss&&Snd.boss(); G.shake=0.9; G.slowmo=1.1;
  shockwave(b.x,b.y,'rgba(199,123,255,0.9)',80);
  for(let i=0;i<30;i++){ const a=Math.random()*TAU, sp=rnd(1,4);
    G.parts.push({x:b.x,y:b.y-0.4,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:rnd(0.7,1.6),color:Math.random()<0.5?'#c77bff':'#ff9a44',size:rnd(2,4.5),grav:-0.05}); }
  // the raptors' minds return - the screaming stops mid-cry. The tome now burns in
  // the catacomb below, so calm both the current world AND the cached surface aerie
  // (its raptors won't respawn, and gentle fowl will wheel the crags once you climb out).
  for(const m of G.mobs){ if(m.kind==='raptor'){ m.dead=true; m.respawnT=-1; } }
  const aw=WORLDS['aerie'];
  if(aw && aw.mobs){
    for(const m of aw.mobs){ if(m.kind==='raptor'){ m.dead=true; m.respawnT=-1; } }
    aw.critters=aw.critters||[];
    const A=AERIE_ZONES.aerie, pr=mulberry32(51789+31);
    for(let i=0;i<8;i++){ const a=pr()*TAU, rr=4+pr()*(A.r-3);
      const ax=Math.round(A.x+Math.cos(a)*rr), ay=Math.round(A.y+Math.sin(a)*rr);
      aw.critters.push({kind:'fowl',x:ax+0.5,y:ay+0.5,home:{x:ax+0.5,y:ay+0.5},tx:null,ty:null,wt:rnd(0.5,4),face:pr()<0.5?-1:1,anim:pr()*6,range:4,col:'#d8d2c4',moving:false}); }
  }
  banner('THE TOME BURNS','THE SKY REMEMBERS ITSELF - THE AERIE IS QUIET');
  if(qs('roost')==='active') completeQuest('roost');
  setTimeout(()=>toast('The cursed tome curls to violet ash, and outside the screaming <b>stops</b> - all at once, mid-cry. When you climb back into daylight the falconers of Rookhaven crowd round, near weeping as their birds settle to the glove: “Our sky is ours again - <b>thank you</b>. It was a <b>robed man</b> did this to us, they say. Climbed the Underclimb quiet as smoke, violet at his sleeves, and never came down the same. If you cross him, friend - give him nothing.”',10000),1500);
}
function genAerieAll(){
  genAerie(); bakeSolids(); placeObjectsAerie(); buildFoam();
  spawnAerieFolk(); spawnMobsAerie();
  buildMapBase();
}

/* ---------- THE UNDERCLIMB: the catacomb beneath the Roost Heart ----------
   A gritty bone-and-stone dungeon roughly twice the island's span. You descend
   the Underclimb, cross the Ossuary (a latch-plate puzzle), light the Gallery
   of Sigils in the right order, then face the Tome-Warden serpent in its crypt.
   Put the warden down, and the cursed tome behind it can finally be destroyed. */
function genAerieDeep(){
  // the whole map begins as solid catacomb rock; we cut the chambers out of it
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  const wall=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,1); } };
  carve(66,108,84,124);   // the Underclimb Landing (entry hall)
  carve(73,96,77,110);    // corridor A -> the Ossuary
  carve(58,76,92,96);     // THE OSSUARY - plate puzzle chamber
  carve(73,64,77,78);     // corridor B (the Bone Gate sits at y=70)
  carve(58,42,92,64);     // THE GALLERY OF SIGILS - ordered-plate chamber
  carve(73,32,77,44);     // corridor C (the Sepulchre Gate sits at y=38)
  carve(52,10,98,32);     // THE WARDEN'S CRYPT - boss chamber
  // the two sealed gates begin as solid stone across their corridors
  for(let x=73;x<=77;x++){ setTile(x,70,T.RUIN); setSolid(x,70,1); }  // BONE GATE
  for(let x=73;x<=77;x++){ setTile(x,38,T.RUIN); setSolid(x,38,1); }  // SEPULCHRE GATE
  // decorative bone-pits flanking the crypt (non-blocking floor detail via tiles)
}
function placeObjectsAerieDeep(){
  G.decor=G.decor||[];
  // the way back up the Underclimb, in the landing hall
  G.decor.push({kind:'tunnelmouth', x:75.5, y:122.5, deep:1, up:1, label:'the way up'});
  setSolid(75,122,0); setTile(75,122,T.RUIN);
  // torches lighting the long dark
  for(const [tx,ty] of [[68,110],[82,110],[60,78],[90,78],[60,44],[90,44],[56,12],[94,12],[70,14],[80,14]])
    if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // catacomb dressing: broken columns and a few readable crypts
  for(const [px,py,br] of [[62,90,1],[88,90,0],[62,50,0],[88,50,1],[58,20,1],[92,20,0]])
    G.decor.push({kind:'pillarBroken', x:px+0.5, y:py+0.5, broken:!!br});
  for(const [cx2,cy2] of [[66,80],[84,80],[66,48],[84,48]])
    G.decor.push({kind:'crypt', x:cx2+0.5, y:cy2+0.5});
  // PUZZLE 1 - THE OSSUARY: three bone-plates; stand on all three to raise the Bone Gate
  for(const [tx,ty] of [[63,90],[75,80],[87,90]])
    G.decor.push({kind:'boneplate', x:tx+0.5, y:ty+0.5, group:'oss', set:false});
  G.decor.push({kind:'catgate', x:75, y:70, open:false, gate:'bone', tiles:[[73,70],[74,70],[75,70],[76,70],[77,70]], label:'the Bone Gate'});
  // PUZZLE 2 - THE GALLERY OF SIGILS: four numbered plates; tread them I,II,III,IV in
  // order to open the Sepulchre Gate. Step out of order and the sigils darken and reset.
  for(const [tx,ty,ord] of [[62,58,1],[88,58,2],[88,48,3],[62,48,4]])
    G.decor.push({kind:'boneplate', x:tx+0.5, y:ty+0.5, group:'seq', ord:ord, set:false});
  G.decor.push({kind:'catgate', x:75, y:38, open:false, gate:'sep', tiles:[[73,38],[74,38],[75,38],[76,38],[77,38]], label:'the Sepulchre Gate'});
  // the cursed tome, on its lectern at the crypt's far wall behind the warden.
  // a already-won run (story-complete, or dev-toggled) shows it already burnt.
  G.decor.push({kind:'tome', x:75.5, y:14.5, destroyed:!!(P.story&&P.story.aerieFreed), deep:1});
  setSolid(75,14,1);
  // a warden's hoard, once the deed is done
  G.decor.push({kind:'chest', x:58.5, y:14.5, deep:1});
  G.critters=[];
  G._plateOn=null;   // reset the plate-tread tracker for this world
}
function spawnMobsAerieDeep(){
  const Z=AERIEDEEP_ZONES;
  if(!(P.story && P.story.aerieFreed)){
    const sp=findOpenNear(Z.crypt.x, Z.crypt.y, 6) || [Z.crypt.x, Z.crypt.y];
    const sn=spawnMob('serpent', sp[0], sp[1]);
    if(sn){ sn.boss=true; sn.bigBoss=true; sn.title='THE TOME-WARDEN'; sn.hx=sp[0]; sn.hy=sp[1]; sn.state='idle'; sn.respawnT=-1; }
  }
}
function genAerieDeepAll(){
  genAerieDeep(); placeObjectsAerieDeep(); spawnMobsAerieDeep(); buildMapBase();
}
function enterAerieDungeon(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P._aerieReturn={x:P.x, y:P.y+1.3}; P.click=null;
  setTimeout(()=>{ switchWorld('aeriedeep'); if(fd) setTimeout(()=>{ fd.style.opacity=0; },200);
    if(!(P.story && P.story.aerieFreed)){
      banner('THE UNDERCLIMB','A CATACOMB, NOT A ROOST - BEAT IT TO REACH THE TOME');
      setTimeout(()=>toast('The tunnel does not climb - it <b>descends</b>, into cold bone-and-stone dark. The cursed tome lies at the very bottom, past two sealed gates and the thing that wardens it. <b>Clear the catacomb first;</b> the tome cannot be touched until its warden falls.',7000),1200);
    } }, 300);
}
function exitAerieDungeon(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.click=null;
  setTimeout(()=>{ switchWorld('aerie');
    const r=P._aerieReturn; if(r){ P.x=r.x; P.y=r.y; G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function openCatGate(gate){
  const b=G.decor.find(d=>d.kind==='catgate' && d.gate===gate);
  if(!b || b.open) return;
  b.open=true; if(Snd.quest) Snd.quest();
  for(const [tx,ty] of b.tiles){ setSolid(tx,ty,0); setTile(tx,ty,T.RUIN); }
  shockwave(b.x,b.y,'rgba(199,123,255,0.85)',55); G.shake=0.5;
  invalidateScenery();
  if(gate==='bone'){ banner('THE BONE GATE GRINDS UP','THE WAY NORTH IS OPEN'); toast('Old counterweights of stacked skulls shudder and the Bone Gate grinds up into the ceiling. The Gallery lies beyond.',5000); }
  else { banner('THE SEPULCHRE GATE OPENS','THE WARDEN AWAITS BELOW'); toast('The sigils flare once, all four alight, and the Sepulchre Gate swings inward on the dark. Something vast uncoils in the crypt ahead.',5200); }
}
function updateAerieDeep(dt){
  const gx=Math.floor(P.x), gy=Math.floor(P.y);
  let onPlate=null;
  for(const b of G.decor){ if(b.kind==='boneplate' && Math.floor(b.x)===gx && Math.floor(b.y)===gy){ onPlate=b; break; } }
  const id = onPlate? (onPlate.group+':'+(onPlate.ord||0)) : null;
  if(id===G._plateOn) return;   // still on the same plate (or still on none) - nothing new
  G._plateOn=id;
  if(onPlate) stepPlate(onPlate);
}
function stepPlate(b){
  if(b.set) return;   // treading an already-lit plate does nothing
  if(b.group==='oss'){
    b.set=true; Snd.pickup&&Snd.pickup(); burst(b.x,b.y-0.2,'#c77bff',10,1.6);
    const grp=G.decor.filter(d=>d.kind==='boneplate' && d.group==='oss');
    if(grp.every(d=>d.set)) openCatGate('bone');
    else addFloat((grp.filter(d=>d.set).length)+' / '+grp.length,b.x,b.y-1.4,'#e0c0ff',1.1);
    return;
  }
  if(b.group==='seq'){
    const grp=G.decor.filter(d=>d.kind==='boneplate' && d.group==='seq');
    const nextNeeded=grp.filter(d=>d.set).length+1;
    if(b.ord===nextNeeded){
      b.set=true; Snd.pickup&&Snd.pickup(); burst(b.x,b.y-0.2,'#c77bff',10,1.6);
      if(grp.every(d=>d.set)) openCatGate('sep');
    } else {
      // wrong order - the whole sequence darkens and resets
      for(const d of grp) d.set=false;
      Snd.hit&&Snd.hit(); G.shake=0.35; burst(b.x,b.y-0.2,'#5a4466',12,1.8);
      toast('The sigils darken and go cold - trodden out of order. Begin again from <b>I</b>.',3600);
    }
    return;
  }
}
/* =====================================================================
   THE FROZEN ISLE - Vath locked the strait in an unnatural winter by
   binding the island's old guardian, a warden of living ice. Free it
   (it is a victim, not a foe) and the cold lets go.
   ===================================================================== */
function genFrost(){
  const rng=mulberry32(SEED);
  const CX2=75, CY2=90, R0=54;
  const wob=[]; for(let i=0;i<64;i++) wob.push(rng()*10-5);
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const dx=x-CX2, dy=y-CY2, d=Math.hypot(dx,dy), a=Math.atan2(dy,dx);
    const wi=((Math.floor((a+Math.PI)/TAU*64))%64+64)%64;
    const rad=R0+wob[wi]+5*Math.sin(a*5+3.3);
    let t=T.DEEP;
    if(d<rad-6) t=T.SNOW; else if(d<rad-1) t=T.SAND; else if(d<rad+2) t=T.SHALLOW; // snowy shore
    G.map[y*MAPW+x]=t;
  }
  const Z=FROST_ZONES;
  // the Rimewood is a bare, wind-scoured snowfield now - nothing grows on this ice
  carveDisc(Z.rimewood.x,Z.rimewood.y,Z.rimewood.r,T.SNOW,false);
  // the Weeping Glacier: a broad walkable sheet of ice at the frozen heart
  carveDisc(Z.glacier.x,Z.glacier.y,Z.glacier.r,T.ICE,true);
  // the Frozen Strait: the sea itself locked to ice off the east shore
  for(let y=Z.strait.y-Z.strait.r;y<=Z.strait.y+Z.strait.r;y++) for(let x=Z.strait.x-Z.strait.r;x<=Z.strait.x+Z.strait.r;x++){
    if(inb(x,y) && dist(x,y,Z.strait.x,Z.strait.y)<=Z.strait.r){ const tt=tileAt(x,y);
      if(tt===T.DEEP||tt===T.SHALLOW) setTile(x,y,T.ICE); } }
  // village + dock clearings (packed snow)
  carveDisc(Z.village.x,Z.village.y,9,T.SNOW,false);
  carveDisc(Z.dock.x,Z.dock.y,5,T.SAND,false);
  // roads of trodden snow (paths)
  carveLine(Z.dock.x,Z.dock.y, Z.village.x,Z.village.y, T.PATH,0);
  carveLine(Z.village.x,Z.village.y, Z.glacier.x,Z.glacier.y-Z.glacier.r+2, T.PATH,0);
}
function placeObjectsFrost(){
  const Z=FROST_ZONES, V=Z.village, D=Z.dock, GL=Z.glacier, RW=Z.rimewood;
  // Hearthhold is a huddle of snow-block igloos against the cold
  addBuilding('igloo', V.x-4, V.y-3, 'Hearthhold igloo');
  addBuilding('igloo', V.x+3, V.y-2, 'The Kettle & Hearth (Inn)');
  addBuilding('igloo', V.x+5, V.y+3, 'The Icewright\'s igloo');
  addBuilding('igloo', V.x-6, V.y+2, 'Frostferry lodge');
  addBuilding('well', V.x, V.y, 'Frostspring well');
  addBuilding('lamp', D.x, D.y-1, '');
  // the ferry boat floats just off the landing - walk OUT from the island centre
  // toward open water and drop it on the first sea/ice tile (never on the beach)
  { const cx2=75, cy2=90, ddx=D.x-cx2, ddy=D.y-cy2, dl=Math.hypot(ddx,ddy)||1;
    for(let step=3; step<=16; step++){ const tx=Math.round(D.x+ddx/dl*step), ty=Math.round(D.y+ddy/dl*step);
      if(inb(tx,ty)){ const t=tileAt(tx,ty); if(t===T.SHALLOW||t===T.DEEP||t===T.ICE){ addBuilding('boat', tx, ty, ''); break; } } } }
  addBuilding('lamp', V.x-6, V.y+4, ''); addBuilding('lamp', V.x+7, V.y-4, '');
  addBuilding('lamp', GL.x-3, GL.y+GL.r-1, ''); addBuilding('lamp', GL.x+3, GL.y+GL.r-1, '');
  // NO TREES on the frozen isle - nothing grows on this ice. The Rimewood is a
  // bare snowfield; a few extra ice-crags give the flats something to mine.
  const pr=mulberry32(SEED+17);
  for(let i=0;i<10;i++){ const a=pr()*TAU, rr=2+pr()*(RW.r-2);
    const ax=Math.round(RW.x+Math.cos(a)*rr), ay=Math.round(RW.y+Math.sin(a)*rr);
    if(inb(ax,ay) && tileAt(ax,ay)===T.SNOW && !solidAt(ax,ay) && dist(ax,ay,V.x,V.y)>5) addNode('rock',ax,ay); }
  // THE RIMEFISSURE: the way down into the ice dungeon. It used to hide off in a far
  // corner of the Rimewood where nobody found it; now it yawns open right beside the
  // glacier road, a short signposted spur of trodden snow leading to its lamplit mouth.
  { const jx=Math.round(V.x + (GL.x-V.x)*0.44), jy=Math.round(V.y + (GL.y-V.y)*0.44); // a junction on the road up
    const spot=findOpenNear(jx-5, jy+2, 8) || [jx-5, jy+2];
    carveLine(jx, jy, spot[0], spot[1], T.PATH, 0);   // a spur peeling off the main road
    for(let y=spot[1]-1;y<=spot[1]+1;y++) for(let x=spot[0]-1;x<=spot[0]+1;x++) if(inb(x,y) && !solidAt(x,y)) setTile(x,y,T.PATH); // a trodden clearing at the mouth
    G.decor.push({kind:'dungeonmouth', x:spot[0]+0.5, y:spot[1]+0.5, label:'the Rimefissure', name:'THE RIMEFISSURE'});
    addBuilding('lamp', spot[0]-2, spot[1]+1, ''); addBuilding('lamp', spot[0]+2, spot[1]+1, '');
    addBuilding('lamp', jx, jy, '');                  // a lamp marks the turn off the road
    G.decor.push({kind:'pillar', x:jx+0.5, y:jy+0.9, broken:false, loreKey:'rimefissure'}); } // a cairn signpost at the junction
  // THE HOARFROST BEAR'S DEN: a cave mouth in the Rimewood flats, mid-way between
  // the village and the glacier. A great ice-bear dens across its mouth - the way
  // down into the Glacier Vault only opens once the beast is driven off.
  { const dx=Math.round(RW.x-6), dy=Math.round(RW.y-6);
    const spot=findOpenNear(dx, dy, 9) || [dx, dy];
    for(let y=spot[1]-1;y<=spot[1]+1;y++) for(let x=spot[0]-1;x<=spot[0]+1;x++) if(inb(x,y) && !solidAt(x,y)) setTile(x,y,T.SNOW);
    G.frostVaultMouth={x:spot[0], y:spot[1]};
    G.decor.push({kind:'dungeonmouth', x:spot[0]+0.5, y:spot[1]+0.5, vault:1, label:'the Hoarfrost Den', name:'THE GLACIER VAULT'});
    addBuilding('lamp', spot[0]-2, spot[1]+1, ''); addBuilding('lamp', spot[0]+2, spot[1]+1, '');
    for(const [ix,iy] of [[spot[0]-2,spot[1]-1],[spot[0]+2,spot[1]-1]]) if(inb(ix,iy)&&!solidAt(ix,iy)){ G.decor.push({kind:'icespire',x:ix+0.5,y:iy+0.5}); setSolid(ix,iy,1); } }
  // ice-crags to mine on the glacier margins
  for(let i=0;i<28;i++){ const a=pr()*TAU, rr=6+pr()*(GL.r-4);
    const ax=Math.round(GL.x+Math.cos(a)*rr), ay=Math.round(GL.y+Math.sin(a)*rr*0.92);
    if(inb(ax,ay) && tileAt(ax,ay)===T.ICE && !solidAt(ax,ay) && dist(ax,ay,GL.x,GL.y)>4) addNode('rock',ax,ay); }
  G.critters=[];
  // a friendly colony of penguins waddling the Frozen Strait and the snowy shore
  const ST=Z.strait, pn=mulberry32(SEED+91); let pc=0;
  for(let tries=0; tries<400 && pc<11; tries++){
    const a=pn()*TAU, rr=pn()*(ST.r+5);
    const ax=Math.round(ST.x+Math.cos(a)*rr), ay=Math.round(ST.y+Math.sin(a)*rr);
    const t=inb(ax,ay)?tileAt(ax,ay):T.DEEP;
    if((t===T.ICE||t===T.SNOW||t===T.SAND) && !solidAt(ax,ay)){
      G.critters.push({kind:'penguin',x:ax+0.5,y:ay+0.5,home:{x:ax+0.5,y:ay+0.5},tx:null,ty:null,
        wt:rnd(0.5,4),face:pn()<0.5?-1:1,anim:pn()*6,range:5,col:'#2b2f36',moving:false}); pc++; }
  }
}
function spawnFrostFolk(){
  const Z=FROST_ZONES, V=Z.village;
  G.npcs.push(makeNPC('bryn','Bryn the Kettlewarden', V.x+0.5, V.y+2.5,
    {skin:'#c2a488',hair:'#cfc7b8',shirt:'#4a5a72',pants:'#33384a',beard:'#cfc7b8'},
    ['Two moons of this, and the strait still hard as a smith\'s anvil. No boat in, no fish out. Hearthhold is eating its own boots.',
     'The Warden used to keep our winters kind - it wept meltwater every spring and the strait ran free. Then a robed man walked onto the glacier, and the ice stopped weeping.',
     'You\'ll want the Rimefissure if you mean to fix this at the root - a crack in the ice that opened the night the cold came, right off the glacier road. We put a cairn and lamps at the turn so none of ours wanders past it. Mind the warren down there; three old frost-locks bar the deep gate, and you must throw them all.'],0.4));
  G.npcs.push(makeNPC('sigrid','Sigrid the Icewright', V.x+4.5, V.y+3.5,
    {skin:'#b58a5e',hair:'#8a7a5e',shirt:'#5a6a5a',pants:'#3a3a2c',hairstyle:'bun'},
    ['Wrap up warm and mind the glacier - the Warden is up there, and it is not itself.',
     'It was never a monster, friend. It is the kindest thing on this rock. Whatever holds it now is not.',
     'And keep off the Rimewood flats unless you mean to fight - a great white bear has denned in the old ice-cave out there. Hoarfrost, the hunters call it. Whatever it guards down that hole, it guards it jealously.'],0.4));
}
function spawnFrostWarden(){
  if(G.mobs && G.mobs.some(m=>m.kind==='frostwarden' && !m.dead)) return null;
  const GL=FROST_ZONES.glacier, sp=findOpenNear(Math.round(GL.x), Math.round(GL.y), 5) || [GL.x, GL.y];
  const w=spawnMob('frostwarden', sp[0], sp[1]);
  if(w){ w.boss=true; w.bigBoss=true; w.enspelled=true; w.title='THE WEEPING WARDEN'; w.hx=sp[0]; w.hy=sp[1]; w.state='idle'; w.respawnT=-1; }
  return w;
}
function spawnMobsFrost(){
  const Z=FROST_ZONES;
  if(qs('thaw')==='active' && !(P.story && P.story.frostFreed)) spawnFrostWarden();
  const yd=findOpenNear(Math.round(Z.village.x+7),Math.round(Z.village.y+5),5);
  if(yd) spawnMob('dummy',yd[0],yd[1]);
  // two vicious, high-level ice-maddened bears prowl the glacier margins and the
  // Rimewood flats - a real threat, well away from the safe village
  for(const [zx,zy] of [[Z.glacier.x-7, Z.glacier.y+6],[Z.rimewood.x+3, Z.rimewood.y-4]]){
    const sp=findOpenNear(Math.round(zx), Math.round(zy), 7);
    if(sp && dist(sp[0],sp[1],Z.village.x,Z.village.y)>16){ const b=spawnMob('polarbear', sp[0], sp[1]); if(b){ b.hx=sp[0]; b.hy=sp[1]; } }
  }
  // THE HOARFROST BEAR - a named ice-bear denning across the Glacier Vault mouth.
  // Drive it off to open the way down. (Stays gone once the vault is unsealed.)
  if(G.frostVaultMouth && !(P.story && P.story.iceBearDown)){
    const M=G.frostVaultMouth, sp=findOpenNear(M.x, M.y+2, 5) || [M.x, M.y+2];
    const bear=spawnMob('polarbear', sp[0], sp[1], true);   // elite
    if(bear){ bear.boss=true; bear.bigBoss=true; bear.title='THE HOARFROST BEAR'; bear.subtitle='TERROR OF THE RIMEWOOD'; bear.vaultbear=1; bear.hx=sp[0]; bear.hy=sp[1]; bear.respawnT=-1; }
  }
}
function freeWarden(m){
  m.freed=1; m.enspelled=false; m.dead=true; m.respawnT=-1; m.state='idle';
  Snd.boss&&Snd.boss(); G.shake=0.9; G.slowmo=1.15;
  shockwave(m.x,m.y,'rgba(180,225,245,0.95)',95);
  for(let i=0;i<32;i++){ const a=Math.random()*TAU, sp=rnd(1,4);
    G.parts.push({x:m.x,y:m.y-0.4,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:rnd(0.8,1.8),color:Math.random()<0.5?'#bfe8ff':'#e6f6ff',size:rnd(2,4.5),grav:0.05}); }
  P.story.frostFreed=1; P.story.vathMet=1;
  banner('THE ICE WEEPS AGAIN','THE WARDEN IS FREE - THE STRAIT WILL THAW');
  if(qs('thaw')==='active') completeQuest('thaw');
  updateFrostFolkMood();
  setTimeout(()=>toast('The violet cracks and sloughs away like spring ice, and the Warden bows its great head and <b>weeps</b> - real meltwater, running warm down the glacier toward the strait. On the road down <b>Sigrid</b> catches your hands, too glad to mind the cold: “You gave us back our guardian AND our sea - bless you, bless you. That <b>robed man</b> who walked up the glacier and stopped its tears - soft voice, violet at the cuffs - did you cross him? He is not finished, I think.”',10000),1400);
}
function updateFrostFolkMood(){
  if(!(P.story && P.story.frostFreed)) return;
  const set=(id,lines)=>{ const n=G.npcs.find(x=>x.id===id); if(n){ n.idleLines=lines; n.li=0; } };
  set('bryn',['You hear it? Water. Running water! The strait\'s breaking up floe by floe - there\'ll be a fishing boat out by morning.','The Warden weeps again and Hearthhold with it, from joy. We owe you our whole winter, friend.']);
  set('sigrid',['The glacier drips like a spring morning. I could kiss you, but my lips would freeze - so take my thanks instead.','It is itself again, up there. Gentle as ever. You gave us back our guardian AND our sea.']);
}
function genFrostAll(){
  genFrost(); bakeSolids(); placeObjectsFrost(); buildFoam();
  spawnFrostFolk(); spawnMobsFrost();
  buildMapBase();
}

/* ---------- THE RIMEFISSURE: the frozen dungeon beneath the Frozen Isle ---------- */
function genFrostDeep(){
  // a compact warren of THREE ice-themed chambers, carved from solid frozen rock.
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1,tile)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,tile); setSolid(x,y,0); } };
  carve(36,58,52,72,T.ICE);               // THE FROSTGATE - the ice-cavern landing
  carve(42,54,46,60,T.ICE);               // corridor A -> the Frost-Lock Warren
  carve(30,38,54,54,T.ICE);               // THE FROST-LOCK WARREN - three frost-locks to find & throw
  carve(42,30,46,40,T.ICE);               // corridor B -> the boss chamber
  for(let x=42;x<=46;x++){ setTile(x,37,T.RUIN); setSolid(x,37,1); }  // the DEEP GATE - solid until all three locks
  carve(32,14,56,32,T.ICE);               // THE FROZEN HEART - boss chamber
}
function placeObjectsFrostDeep(){
  G.decor=G.decor||[];
  G.decor.push({kind:'dungeonmouth', x:44.5, y:70.5, exit:1, label:'the way up'});  // back to the surface
  setSolid(44,70,0); setTile(44,70,T.RUIN);
  for(const [tx,ty] of [[38,60],[50,60],[32,52],[52,40],[34,16],[54,16],[44,15]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // THE FROST-LOCK WARREN: three frost-lock levers hidden among a thicket of frozen
  // spires - find and throw all three (in any order) to raise the deep gate. No
  // sliding: you simply weave the pillar-maze to reach each lock.
  const DEEP=[[42,37],[43,37],[44,37],[45,37],[46,37]];
  const spire=(x,y)=>{ if(inb(x,y)&&!solidAt(x,y)){ G.decor.push({kind:'icespire', x:x+0.5, y:y+0.5}); setSolid(x,y,1); } };
  // pillar maze through the warren (kept clear of the three lock tiles below)
  for(const [px,py] of [[38,66],[50,66],[34,42],[40,46],[46,44],[50,48],[36,50],[44,41],[36,18],[52,18],[44,17]]) spire(px,py);
  for(const [lx,ly] of [[32,52],[52,52],[42,40]])
    G.decor.push({kind:'icelever', x:lx+0.5, y:ly+0.5, on:false, wardGroup:'rime', gateTiles:DEEP, label:'a frost-lock lever',
      openBanner:'THE FROST-LOCKS YIELD', openSub:'THE DEEP GATE GRINDS OPEN',
      openMsg:'The last frost-lock turns and the deep gate hauls up into the ceiling on a shriek of old iron. The way north - to the Frozen Heart - lies open.'});
  G.decor.push({kind:'chest', x:44.5, y:16.5, deep:1});
  // an already-cleared run keeps the deep gate open
  if(P.story && P.story.deepDone){ for(const [x,y] of DEEP){ setTile(x,y,T.ICE); setSolid(x,y,0); }
    for(const d of G.decor){ if(d.kind==='icelever' && d.wardGroup==='rime') d.on=true; } }
  G.critters=[];
}
function spawnMobsFrostDeep(){
  const Z=FROSTDEEP_ZONES;
  if(!(P.story && P.story.deepDone)){
    const sp=findOpenNear(Z.boss.x, Z.boss.y, 6) || [Z.boss.x, Z.boss.y];
    const b=spawnMob('icecolossus', sp[0], sp[1]);
    if(b){ b.boss=true; b.bigBoss=true; b.enspelled=true; b.title='THE RIMEBOUND'; b.hx=sp[0]; b.hy=sp[1]; b.respawnT=-1; }
  }
}
function genFrostDeepAll(){
  genFrostDeep(); placeObjectsFrostDeep(); spawnMobsFrostDeep(); buildMapBase();
}
function enterFrostDungeon(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P._deepReturn={x:P.x, y:P.y+1.3}; P.slideDir=null; P.click=null;
  setTimeout(()=>{ switchWorld('frostdeep'); if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function exitFrostDungeon(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.slideDir=null; P.click=null;
  setTimeout(()=>{ switchWorld('frost');
    const r=P._deepReturn; if(r){ P.x=r.x; P.y=r.y; G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function pullIceLever(b){
  if(b.gateTiles || b.wardGroup || b.gate) return pullVaultLever(b);   // Glacier Vault + Undermill levers open their own gates
  if(b.on){ toast('The lever is already thrown - the deep gate stands open to the north.',3200); return; }
  b.on=true; if(Snd.quest) Snd.quest();
  for(let x=42;x<=46;x++){ setTile(x,37,T.RUIN); setSolid(x,37,0); }   // grind the gate open
  invalidateScenery&&invalidateScenery();
  shockwave(b.x,b.y,'rgba(180,225,245,0.9)',55);
  banner('THE DEEP GATE GRINDS OPEN','THE WAY NORTH IS CLEAR');
  toast('Frost cracks off the old mechanism and a slab of ice grinds up into the ceiling. The way deeper - north to the Frozen Heart - lies open.',5200);
}
function freeColossus(m){
  m.freed=1; m.enspelled=false; m.dead=true; m.respawnT=-1; m.state='idle';
  Snd.boss&&Snd.boss(); G.shake=0.9; G.slowmo=1.15;
  shockwave(m.x,m.y,'rgba(190,230,250,0.95)',100);
  for(let i=0;i<36;i++){ const a=Math.random()*TAU, sp=rnd(1,4);
    G.parts.push({x:m.x,y:m.y-0.5,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:rnd(0.8,1.9),color:Math.random()<0.5?'#bfe8ff':'#e6f6ff',size:rnd(2,5),grav:0.05}); }
  if(P.story){ P.story.deepDone=1; P.story.vathMet=1; }
  giveGold(150); give('elixir',2);
  banner('THE RIMEBOUND IS FREED','THE CURSE SLOUGHS AWAY LIKE SPRING ICE');
  setTimeout(()=>toast('The great ice-thing shudders and the violet light bleeds out of it - it was a beast once, a whale-of-the-deep that wandered too near the cold and never left. It sinks calm into the melt. <i>Whoever bound it - the quiet <b>robed man</b> the whole strait speaks of, violet at his sleeves - is always one island ahead of you. But the trail is warming.</i>',10000),1400);
}

/* =====================================================================
   THE GLACIER VAULT - a 5-room ice-puzzle dungeon sealed behind the
   Hoarfrost Bear's den on the Frozen Isle. Opened only once the bear is
   driven off. Two slick sliding rooms, a three-ward lever lock, and a
   reward hoard - no boss, pure puzzle. Reuses the ice-slide + icelever.
   ===================================================================== */
function genFrostVault(){
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.ICE); setSolid(x,y,0); } };
  const foot=(x,y)=>{ if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };  // non-ice footing (stops a slide)
  carve(30,78,50,90);   // R1 THE ICEFALL LANDING - entry (footing, not slick)
  carve(38,73,42,79);   // corridor A -> R2
  carve(28,58,52,74);   // R2 THE FIRST SLIDE (slick)
  carve(38,54,42,60);   // corridor B (Gate 1 seals it at y57)
  carve(28,40,54,55);   // R3 THE PILLAR GLIDE (slick)
  carve(38,35,42,41);   // corridor C (Gate 2 seals it at y38)
  carve(28,21,52,36);   // R4 THE THREE WARDS (footing)
  carve(38,16,42,22);   // corridor D (Gate 3 seals it at y19)
  carve(28,2,60,18);    // R5 THE HOARFROST HOARD (footing)
  // ONLY R2 and R3 are slippery; everything else keeps your footing
  G.slideZones=[{x0:28,y0:58,x1:52,y1:74},{x0:28,y0:40,x1:54,y1:55}];
  G.slideZone=null;
  // footing islands that stop a slide (lever landings + gate approaches)
  foot(30,72); foot(31,72);           // R2 lever landing (bottom-left)
  foot(40,59); foot(41,59);           // R2 gate-1 approach
  foot(30,53); foot(31,53);           // R3 lever landing (bottom-left)
  foot(40,41); foot(41,41);           // R3 gate-2 approach
  // the sealed gates start as solid ice across their corridors
  for(let x=38;x<=42;x++){ setTile(x,57,T.RUIN); setSolid(x,57,1); }  // Gate 1
  for(let x=38;x<=42;x++){ setTile(x,38,T.RUIN); setSolid(x,38,1); }  // Gate 2
  for(let x=38;x<=42;x++){ setTile(x,19,T.RUIN); setSolid(x,19,1); }  // Gate 3 (the three wards)
}
function placeObjectsFrostVault(){
  G.decor=G.decor||[];
  const Z=FROSTVAULT_ZONES;
  // the way back up (out through the bear's den)
  G.decor.push({kind:'dungeonmouth', x:40.5, y:88.5, vault:1, exit:1, label:'the way up'});
  setSolid(40,88,0); setTile(40,88,T.RUIN);
  // lamps + frozen spires so each chamber reads unmistakably as ICE
  for(const [tx,ty] of [[31,79],[49,79],[29,60],[51,60],[29,42],[53,42],[29,22],[51,22],[32,4],[56,4],[44,3]])
    if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  const spire=(x,y)=>{ if(inb(x,y)&&!solidAt(x,y)){ G.decor.push({kind:'icespire',x:x+0.5,y:y+0.5}); setSolid(x,y,1); } };
  // ---- R2: one lever opens Gate 1 ----
  G.decor.push({kind:'icelever', x:30.5, y:72.5, on:false, gateTiles:[[38,57],[39,57],[40,57],[41,57],[42,57]], label:'a frost-locked lever'});
  spire(34,62); spire(46,68);   // a couple of pillars to slide around
  // ---- R3: pillars to weave through on the slide, one lever opens Gate 2 ----
  G.decor.push({kind:'icelever', x:30.5, y:53.5, on:false, gateTiles:[[38,38],[39,38],[40,38],[41,38],[42,38]], label:'a frost-locked lever'});
  for(const [px,py] of [[36,46],[44,44],[48,50],[40,52],[34,50]]) spire(px,py);
  // ---- R4: THREE wards; all must be thrown before Gate 3 opens ----
  const G3=[[38,19],[39,19],[40,19],[41,19],[42,19]];
  for(const [lx,ly] of [[31,33],[44,24],[49,32]])
    G.decor.push({kind:'icelever', x:lx+0.5, y:ly+0.5, on:false, wardGroup:'vault', gateTiles:G3, label:'a frost-ward lever',
      doneFlag:'vaultDone', openBanner:'THE THREE WARDS YIELD', openSub:'THE HOARD GATE GRINDS OPEN',
      openMsg:'The last frost-ward turns and, with a groan of ancient ice, the final gate hauls up into the ceiling. <b>The Hoarfrost Hoard lies open.</b>'});
  spire(36,28); spire(46,28);
  // ---- R5: the hoard ----
  G.decor.push({kind:'chest', x:44.5, y:9.5, deep:1, rich:14});
  G.decor.push({kind:'chest', x:34.5, y:12.5, deep:1, rich:8});
  spire(30,5); spire(58,5); spire(30,15); spire(58,15);
  G.critters=[];
  // an already-cleared run keeps every gate open
  if(P.story && P.story.vaultDone){
    for(const b of G.decor){ if(b.kind==='icelever' && b.gateTiles){ b.on=true;
      for(const [x,y] of b.gateTiles){ setTile(x,y,T.ICE); setSolid(x,y,0); } } }
  }
}
function spawnMobsFrostVault(){
  // a few ice-maddened bears and wolves den in the warm dark of the hoard chambers
  const packs=[ [FROSTVAULT_ZONES.glide,'wolf',2], [FROSTVAULT_ZONES.wards,'wolf',2], [FROSTVAULT_ZONES.hoard,'polarbear',1] ];
  for(const [z,kind,n] of packs){
    for(let i=0;i<n;i++){ const a=Math.random()*TAU, r2=Math.random()*z.r*0.5;
      const sp=findOpenNear(Math.round(z.x+Math.cos(a)*r2), Math.round(z.y+Math.sin(a)*r2), 5);
      if(sp) spawnMob(kind, sp[0], sp[1]); }
  }
}
function genFrostVaultAll(){
  genFrostVault(); placeObjectsFrostVault(); spawnMobsFrostVault(); buildMapBase();
}
function pullVaultLever(b){
  if(b.on){ toast('This lever is already thrown - it will not turn back.',2800); return; }
  b.on=true; Snd.quest&&Snd.quest(); buzz&&buzz(8);
  shockwave(b.x,b.y,'rgba(180,225,245,0.9)',48); burst(b.x,b.y-0.4,'#bfe8ff',12,1.6);
  if(b.wardGroup){
    const grp=G.decor.filter(d=>d.kind==='icelever' && d.wardGroup===b.wardGroup);
    const done=grp.filter(d=>d.on).length;
    if(grp.every(d=>d.on)){
      for(const [x,y] of (b.gateTiles||[])){ setTile(x,y,T.ICE); setSolid(x,y,0); }
      // a linked portcullis gate (the Undermill's millstone gate) raises into the ceiling
      if(b.gate){ const cg=G.decor.find(d=>d.kind==='catgate' && d.gate===b.gate);
        if(cg && !cg.open){ cg.open=true; for(const [gx,gy] of (cg.tiles||[])){ setSolid(gx,gy,0); setTile(gx,gy,T.RUIN); } } }
      invalidateScenery&&invalidateScenery();
      if(b.doneFlag){ P.story=P.story||{}; P.story[b.doneFlag]=1; autoSave&&autoSave(); }
      banner(b.openBanner||'THE FROST-LOCKS YIELD', b.openSub||'THE SEALED GATE GRINDS OPEN');
      toast(b.openMsg||'The last frost-lock turns and, with a groan of ancient ice, the gate hauls up into the ceiling. The way deeper lies open.',5200);
    } else {
      const remain=grp.length-done;
      addFloat(done+' / '+grp.length, b.x, b.y-1.4, '#bfe8ff', 1.1);
      if(b.tickMsg) toast(b.tickMsg.replace('{n}', remain), 3600);
      else toast('The lock turns with a deep crack of ice. <b>'+remain+' more</b> still hold the gate shut.',3600);
    }
    return;
  }
  for(const [x,y] of (b.gateTiles||[])){ setTile(x,y,T.ICE); setSolid(x,y,0); }
  invalidateScenery&&invalidateScenery();
  banner('THE ICE GATE GRINDS OPEN','THE WAY NORTH IS CLEAR');
  toast('Frost cracks off the old mechanism and a slab of ice grinds up into the ceiling. The way deeper lies open.',4600);
}
function enterFrostVault(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P._vaultReturn={x:P.x, y:P.y+1.3}; P.slideDir=null; P.click=null;
  setTimeout(()=>{ switchWorld('frostvault'); if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function exitFrostVault(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.slideDir=null; P.click=null;
  setTimeout(()=>{ switchWorld('frost');
    const r=P._vaultReturn; if(r){ P.x=r.x; P.y=r.y; G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}

/* =====================================================================
   THE UNDERMILL - a short mini-boss dungeon beneath the Windsurf windmill.
   Tolen shapes the board but has no sail fit for the killing strait; the
   last stormsail on the isle - Nessa's - lies sealed in the old grinding
   works below, shut when the gear-train seized. A guardian (THE COG-BOUND)
   fouls the works; fell it and the freed gear-train grinds the millstone
   gate up, opening the vault. Carry the sail back to earn the windsurf.
   Reuses ewall walls, the catgate portcullis, and a scaled skeleton boss.
   ===================================================================== */
let MILL_WALLS = [];               // stone tiles that read as visible walls (bordering the floor)
const MILL_GATE = [[17,15],[18,15],[19,15],[20,15],[21,15]];   // the millstone-gate corridor tiles
function genMillDeep(){
  // a compact undercroft: three small stone chambers cut out of solid rock. Every
  // solid tile bordering the carved floor is recorded as a WALL (ewall decor) so the
  // rooms read clearly - no invisible collision. Kept small on purpose.
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  carve(11,38,27,48);   // THE MILLSTAIR - entry landing (the way up sits here)
  carve(17,33,21,39);   // corridor A -> the grinding floor
  carve(9,18,29,34);    // THE GRINDING FLOOR - the guardian's chamber
  carve(17,12,21,19);   // corridor B -> the vault (the millstone gate sits at y=15)
  carve(11,3,27,13);    // THE SAILWRIGHT'S VAULT - the reward chamber
  // record the visible wall faces (stone bordering the carved floor) BEFORE the gate
  // goes solid, so the raised gate never leaves a phantom wall behind
  MILL_WALLS=[];
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(!solidAt(x,y)) continue;
    let border=false;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])
      if(inb(x+dx,y+dy) && !solidAt(x+dx,y+dy)){ border=true; break; }
    if(border) MILL_WALLS.push([x,y]);
  }
  // the millstone gate starts as solid stone across corridor B (rendered by the catgate)
  for(const [x,y] of MILL_GATE){ setTile(x,y,T.RUIN); setSolid(x,y,1); }
}
function placeObjectsMillDeep(){
  G.decor=G.decor||[];
  // the stone walls that give the rooms their shape (static baked scenery)
  for(const [x,y] of MILL_WALLS) G.decor.push({kind:'ewall', x:x+0.5, y:y+0.5, s:((x*7+y*13)%5)});
  G.decor.push({kind:'dungeonmouth', mill:1, exit:1, x:19.5, y:46.5, label:'the way up'});  // back to the surface
  setSolid(19,46,0); setTile(19,46,T.RUIN);
  for(const [tx,ty] of [[12,40],[26,40],[11,20],[27,20],[11,32],[27,32],[13,5],[25,5]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // THE MILLSTONE GATE - an iron portcullis jammed shut by the seized gear-train.
  // It grinds up once the guardian fouling the works is put down.
  G.decor.push({kind:'catgate', x:19, y:15, open:false, gate:'mill', tiles:MILL_GATE.slice(), label:'the Millstone Gate'});
  // THE VAULT: Nessa's lost stormsail, sealed here the season the works jammed
  if(!(P.story && P.story.haveSail)) G.decor.push({kind:'chest', x:19.5, y:7.5, sail:1});
  // an already-cleared run keeps the millstone gate open (the guardian is gone)
  if(P.story && P.story.millDone){
    for(const [x,y] of MILL_GATE){ setTile(x,y,T.RUIN); setSolid(x,y,0); }
    for(const d of G.decor){ if(d.kind==='catgate' && d.gate==='mill') d.open=true; }
  }
  G.critters=[];
}
// THE COG-BOUND: the miller who was caught in the gear-train when it seized, risen
// fused to the works and guarding them. Fell it and the freed shaft grinds the
// millstone gate up. A single mini-boss - the whole reason the dungeon exists.
function spawnMobsMillDeep(){
  if(P.story && P.story.millDone) return;   // already felled - the works turn free
  const Z=MILLDEEP_ZONES.works;
  const sp=findOpenNear(Math.round(Z.x), Math.round(Z.y), 6) || [Z.x, Z.y];
  const b=spawnMob('skeleton', sp[0], sp[1]);
  if(b){ b.boss=true; b.bigBoss=true; b.millboss=1; b.bscale=1.85; b.title='THE COG-BOUND';
    b.hp=b.maxhp=480; b.dmg=27; b.lvl=12; b.xp=520; b.gold=[40,70];
    b.hx=sp[0]; b.hy=sp[1]; b.state='idle'; b.noAggroT=0; b.respawnT=-1; }
}
function genMillDeepAll(){ genMillDeep(); placeObjectsMillDeep(); spawnMobsMillDeep(); buildMapBase(); }
function enterMillDungeon(){
  // the hatch stays chained until Tolen has shaped the board and sent you for the
  // sail (boardMade), or the sail quest is already underway, or you've been here
  // before (haveSail / surf). The sail-quest check guarantees you can never be
  // locked out of a dungeon you've been sent to.
  const maySeek = (P.story && (P.story.boardMade || P.story.haveSail)) || (P.unlocked && P.unlocked.surf) || qs('sail')==='active';
  if(!maySeek){
    toast('A chained cellar-hatch beside the windmill, padlocked over a stair going down into the old works. <b>Burl</b> keeps it shut - you\'ve no reason to go down there yet.',4800); Snd.step&&Snd.step(5); return;
  }
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P._millReturn={x:P.x, y:P.y+1.3}; P.click=null;
  setTimeout(()=>{ switchWorld('milldeep'); if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function exitMillDungeon(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.click=null;
  setTimeout(()=>{ switchWorld('wind');
    const r=P._millReturn; if(r){ P.x=r.x; P.y=r.y; G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}

/* =====================================================================
   THE CLOUDREACH (sky) + STORMREACH (reach) - a two-island arc:
   Ashwing flies you UP into the cloud-sea to the Cloudreach. Fell the
   Storm Roc that rules it and you win a great kite-sail - a PARACHUTE -
   and may leap from the Cloudreach DOWN through the cloud onto Stormreach,
   a storm-battered shore. No keel has reached it in memory, so you are
   stranded there until you put down its brute-lord; do that and the
   castaways mend a hull, and Stormreach joins the ferry roads.
   ===================================================================== */
function genRadialIsle(cx0, cy0, r0){
  const rng=mulberry32(SEED);
  const wob=[]; for(let i=0;i<64;i++) wob.push(rng()*10-5);
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const dx=x-cx0, dy=y-cy0, d=Math.hypot(dx,dy), a=Math.atan2(dy,dx);
    const wi=((Math.floor((a+Math.PI)/TAU*64))%64+64)%64;
    const rad=r0+wob[wi]+5*Math.sin(a*5+0.7);
    let t=T.DEEP;
    if(d<rad-6) t=T.GRASS; else if(d<rad-2) t=T.SAND; else if(d<rad+6) t=T.SHALLOW;
    G.map[y*MAPW+x]=t;
  }
}
// ---------- THE CLOUDREACH ----------
function genSky(){
  genRadialIsle(60,60,46);
  // The Cloudreach is CLOUD, not earth: the "land" is white foamy cloud (SNOW), and
  // the ring beyond it is open sky (the water tiles are kept only for the island's
  // shape, its foamy rim, and its solid edge - the renderer draws them as sky, not
  // sea, whenever the world def is flagged cloud:1).
  for(let i=0;i<MAPW*MAPH;i++){ const t=G.map[i]; if(t===T.GRASS||t===T.SAND) G.map[i]=T.SNOW; }
  const Z=SKY_ZONES;
  carveDisc(Z.landing.x,Z.landing.y,Z.landing.r,T.SNOW,false);
  carveDisc(Z.shrine.x,Z.shrine.y,Z.shrine.r,T.SNOW,false);
  carveDisc(Z.eyrie.x,Z.eyrie.y,Z.eyrie.r,T.SNOW,false);
  carveDisc(Z.leap.x,Z.leap.y,Z.leap.r,T.SNOW,false);
}
function placeObjectsSky(){
  const Z=SKY_ZONES;
  // Ashwing waits at the landing - your ride back down to Windsurf at any time
  { const sp=findOpenNear(Z.landing.x, Z.landing.y+3, 6) || [Z.landing.x, Z.landing.y+3];
    G.decor.push({kind:'ashwing', x:sp[0]+0.5, y:sp[1]+0.5, face:-1, name:'ASHWING', labelY:-82, sky:1});
    setSolid(sp[0],sp[1],1); setSolid(sp[0]+1,sp[1],1); }
  // the Windshrine: a broken ring of standing stones
  for(let i=0;i<7;i++){ const a=i/7*TAU, px=Math.round(Z.shrine.x+Math.cos(a)*4), py=Math.round(Z.shrine.y+Math.sin(a)*4);
    if(inb(px,py)&&!solidAt(px,py)){ G.decor.push({kind:'pillar', x:px+0.5, y:py+0.5, broken:i%3===0, loreKey:'cloudreach'}); setSolid(px,py,1); } }
  G.decor.push({kind:'lamp', x:Z.landing.x-3+0.5, y:Z.landing.y+0.5}); G.decor.push({kind:'lamp', x:Z.landing.x+3+0.5, y:Z.landing.y+0.5});
  // THE LEAP: a jutting stone shelf over the cloud-drop. Usable once the Roc is down
  // (and you've the parachute) - it carries you to Stormreach far below.
  G.decor.push({kind:'leappoint', x:Z.leap.x+0.5, y:Z.leap.y+0.5, name:'THE LEAP', labelY:-40});
  G.decor.push({kind:'lamp', x:Z.leap.x-2+0.5, y:Z.leap.y+0.5}); G.decor.push({kind:'lamp', x:Z.leap.x+2+0.5, y:Z.leap.y+0.5});
  // wind-blown grass & a couple of chests for the climb
  const pr=mulberry32(SEED+13);
  for(let i=0;i<60;i++){ const ax=Math.floor(pr()*MAPW), ay=Math.floor(pr()*MAPH);
    if(tileAt(ax,ay)===T.GRASS && !solidAt(ax,ay) && dist(ax,ay,Z.landing.x,Z.landing.y)>5) addNode('tree',ax,ay); }
  G.decor.push({kind:'chest', x:Z.eyrie.x+0.5, y:Z.eyrie.y-6+0.5, rich:9});
  // THE WIND-LOST BIRD - her plea opens the Rainbow Road (a "sky dungeon"). She lands
  // near the Cloudfall Landing, a little apart from Ashwing and the Cloud-Tender.
  { const sp=findOpenNear(Z.landing.x-4, Z.landing.y-3, 5) || [Z.landing.x-4, Z.landing.y-3];
    G.decor.push({kind:'skybird', x:sp[0]+0.5, y:sp[1]+0.5, name:'A WIND-LOST BIRD', labelY:-40}); }
  G.critters=[];
}
function spawnSkyFolk(){
  const Z=SKY_ZONES;
  G.npcs.push(makeNPC('aeron','Aeron the Skyward', Z.shrine.x-1.5, Z.shrine.y+2.5,
    {skin:'#c2a488',hair:'#d8d0c0',shirt:'#5a6a8a',pants:'#33384a',hairstyle:'long'},
    ['Few climb Ashwing’s wing this high. Fewer still leave - the Storm Roc suffers no guests in her sky.',
     'There is a shelf on the west edge, past the shrine - The Leap. Step off it and you fall forever… unless you carry a sail. The Roc keeps one, folded in her eyrie.',
     'Put the Roc down and her stormsail is yours. Then you may leap from the west shelf and ride the cloud DOWN to <b>Windsurf</b>, bright on the water below. Aim well - there is no climbing back up on foot.'],0.4));
  G.npcs.push(makeNPC('wisp','A Cloud-Tender', Z.landing.x+2.5, Z.landing.y-1.5,
    {skin:'#b8a0c8',hair:'#e8e0f0',shirt:'#6a5a8a',pants:'#3a3350',hairstyle:'bun'},
    ['Mind your footing near the edges - the cloud looks solid and is not.',
     'Not ready to face the Roc? Ashwing will carry you back down to the Sunward shore whenever the height gets into your knees.'],0.5));
}
function spawnMobsSky(){
  const Z=SKY_ZONES;
  if(!(P.story && P.story.rocDown)){
    const sp=findOpenNear(Z.eyrie.x, Z.eyrie.y, 6) || [Z.eyrie.x, Z.eyrie.y];
    const roc=spawnMob('raptor', sp[0], sp[1], true);
    if(roc){ roc.boss=true; roc.bigBoss=true; roc.title='THE STORM ROC'; roc.subtitle='TERROR OF THE CLOUD-SEA'; roc.skyboss=1;
      roc.hp=roc.maxhp=720; roc.dmg=30; roc.lvl=10; roc.hx=sp[0]; roc.hy=sp[1]; roc.respawnT=-1; }
  }
  // a scatter of lesser screaming raptors ride the updrafts
  if(!(P.story && P.story.rocDown)) for(let i=0;i<3;i++){ const a=Math.random()*TAU, r2=6+Math.random()*10;
    const sp=findOpenNear(Math.round(Z.eyrie.x+Math.cos(a)*r2), Math.round(Z.eyrie.y+Math.sin(a)*r2), 5);
    if(sp) spawnMob('raptor', sp[0], sp[1]); }
}
function genSkyAll(){ genSky(); bakeSolids(); placeObjectsSky(); buildFoam(); spawnSkyFolk(); spawnMobsSky(); buildMapBase(); }
// ---------- STORMREACH ----------
function genReach(){
  genRadialIsle(60,60,48);
  const Z=REACH_ZONES;
  carveDisc(Z.strand.x,Z.strand.y,Z.strand.r,T.SAND,false);
  carveDisc(Z.camp.x,Z.camp.y,Z.camp.r,T.GRASS,false);
  carveDisc(Z.barrow.x,Z.barrow.y,Z.barrow.r,T.GRASS,false);
  carveDisc(Z.dock.x,Z.dock.y,4,T.SAND,false);
  carveDisc(Z.camp.x,Z.camp.y,3,T.PATH,false);
  carveLine(Z.strand.x,Z.strand.y, Z.camp.x,Z.camp.y, T.PATH,0);
  carveLine(Z.camp.x,Z.camp.y, Z.barrow.x,Z.barrow.y, T.PATH,0);
  carveLine(Z.camp.x,Z.camp.y, Z.dock.x,Z.dock.y, T.PATH,0);
}
function placeObjectsReach(){
  const Z=REACH_ZONES;
  // the castaway camp: a couple of lean-to huts and a well
  addBuilding('hut', Z.camp.x-3, Z.camp.y-2, 'Castaway lean-to');
  addBuilding('hut', Z.camp.x+3, Z.camp.y+1, 'Driftwood shelter');
  addBuilding('well', Z.camp.x, Z.camp.y, 'Rain-catch');
  addBuilding('lamp', Z.camp.x-4, Z.camp.y+3, ''); addBuilding('lamp', Z.camp.x+4, Z.camp.y-3, '');
  // the Brute's Barrow: a ring of raised stones round the monster's ground
  for(let i=0;i<6;i++){ const a=i/6*TAU, px=Math.round(Z.barrow.x+Math.cos(a)*5), py=Math.round(Z.barrow.y+Math.sin(a)*5);
    if(inb(px,py)&&!solidAt(px,py)){ G.decor.push({kind:'pillar', x:px+0.5, y:py+0.5, broken:i%2===0, loreKey:'stormreach'}); setSolid(px,py,1); } }
  // THE DROWNED GRAVEYARD: a field of leaning headstones round a sunken tomb - the
  // mouth of the catacomb below. (Replaces the old lone crypt on the strand.)
  { const GV=Z.graves;
    const gr=mulberry32(SEED+31);
    for(let i=0;i<16;i++){ const a=gr()*TAU, rr=2+gr()*(GV.r-1);
      const gx=Math.round(GV.x+Math.cos(a)*rr), gy=Math.round(GV.y+Math.sin(a)*rr*0.85);
      if(inb(gx,gy) && !solidAt(gx,gy) && dist(gx,gy,GV.x,GV.y)>1.4){ G.decor.push({kind:'grave', x:gx+0.5, y:gy+0.5, s:(gx*5+gy)%3}); setSolid(gx,gy,1); } }
    G.decor.push({kind:'tombmouth', x:GV.x+0.5, y:GV.y+0.5, name:'THE DROWNED CATACOMB', labelY:-46});
    addBuilding('lamp', GV.x-3, GV.y+2, ''); addBuilding('lamp', GV.x+3, GV.y+2, '');
    // a low rusted fence-gate framing the graveyard path
    G.decor.push({kind:'pillar', x:GV.x-2+0.5, y:GV.y+4+0.5, broken:true, loreKey:'stormreach'});
    G.decor.push({kind:'pillar', x:GV.x+2+0.5, y:GV.y+4+0.5, broken:true, loreKey:'stormreach'}); }
  carveLine(Z.camp.x,Z.camp.y, Z.graves.x,Z.graves.y, T.PATH,0);
  // the ferry berth: Stormreach is a sea stop, so a hull always rides here
  addBuilding('boat', Z.dock.x, Z.dock.y+2, '');
  addBuilding('lamp', Z.dock.x-2, Z.dock.y+1, ''); addBuilding('lamp', Z.dock.x+2, Z.dock.y+1, '');
  // greenery + a couple of chests
  const pr=mulberry32(SEED+19);
  for(let i=0;i<120;i++){ const ax=Math.floor(pr()*MAPW), ay=Math.floor(pr()*MAPH), t=tileAt(ax,ay);
    if(((t===T.GRASS&&pr()<0.22)||(t===T.SAND&&pr()<0.12)) && !solidAt(ax,ay) && dist(ax,ay,Z.camp.x,Z.camp.y)>5){
      const n=addNode(pr()<0.5?'tree':'rock',ax,ay); if(n&&t===T.SAND) n.palm=1; } }
  G.decor.push({kind:'chest', x:Z.barrow.x+0.5, y:Z.barrow.y-7+0.5, rich:10});
  G.critters=[];
}
function spawnReachFolk(){
  const Z=REACH_ZONES;
  G.npcs.push(makeNPC('mora','Mora, Storm-Coast Elder', Z.camp.x-1.5, Z.camp.y+2.5,
    {skin:'#a9784e',hair:'#cfc7b8',shirt:'#4a5a4a',pants:'#3a3a2c',hairstyle:'bun'},
    ['Stormreach! Not many keels chance our reef-storms - fewer still on purpose. Welcome, then, to the edge of the map.',
     'A thing dens up at the Barrow, north - big as a boat and twice as mean. It stove in the last three hulls that put in, and it walks the coast at night. Put it down and we could trade like honest folk again.',
     'Do the coast that kindness and you will always have a berth here, a hot meal, and the truth about what the storms wash up.'],0.4));
  G.npcs.push(makeNPC('tibb','Tibb the Raftwright', Z.strand.x+2.5, Z.strand.y-1.5,
    {skin:'#8f6a48',hair:'#3a352c',shirt:'#6a5a3a',pants:'#33302a'},
    ['Every hull I mend by the water, that Barrow-brute wanders down and stamps to kindling for the joy of it.',
     'Silence the brute and I’ll keep this berth sound for any ship that dares the reefs. My word on it.'],0.5));
}
function spawnMobsReach(){
  const Z=REACH_ZONES;
  if(!(P.story && P.story.reachBossDown)){
    const sp=findOpenNear(Z.barrow.x, Z.barrow.y, 6) || [Z.barrow.x, Z.barrow.y];
    const brute=spawnMob('raidcap', sp[0], sp[1]);
    if(brute){ brute.boss=true; brute.bigBoss=true; brute.title='THE BARROW BRUTE'; brute.subtitle='WRECKER OF STORMREACH'; brute.reachboss=1;
      brute.hp=brute.maxhp=1000; brute.dmg=34; brute.lvl=13; brute.hx=sp[0]; brute.hy=sp[1]; brute.respawnT=-1; }
  }
  // storm-driven raiders wash up around the barrow
  if(!(P.story && P.story.reachBossDown)) for(let i=0;i<4;i++){ const a=Math.random()*TAU, r2=6+Math.random()*12;
    const sp=findOpenNear(Math.round(Z.barrow.x+Math.cos(a)*r2), Math.round(Z.barrow.y+Math.sin(a)*r2), 5);
    if(sp) spawnMob('raider', sp[0], sp[1]); }
}
function genReachAll(){ genReach(); bakeSolids(); placeObjectsReach(); buildFoam(); spawnReachFolk(); spawnMobsReach(); buildMapBase(); }
// ---------- THE DROWNED CATACOMB (reachdeep) - a modest bone-lock dungeon ----------
function genReachDeep(){
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  carve(30,76,50,90);   // R1 THE SUNKEN STAIR - entry landing
  carve(38,60,42,78);   // corridor A
  carve(26,40,54,62,T.RUIN);   // R2 THE OSSUARY - three bone-locks
  carve(38,34,42,42);   // corridor B (the sealed gate at y37)
  for(let x=38;x<=42;x++){ setTile(x,37,T.RUIN); setSolid(x,37,1); }   // BONE GATE - solid until all three locks
  carve(28,6,52,34);    // R3 THE DROWNED VAULT - warden + hoard
}
function placeObjectsReachDeep(){
  G.decor=G.decor||[];
  G.decor.push({kind:'tombmouth', x:40.5, y:88.5, up:1, label:'the way up'});   // back to the graveyard
  setSolid(40,88,0); setTile(40,88,T.RUIN);
  for(const [tx,ty] of [[32,80],[48,80],[28,50],[52,50],[30,10],[50,10],[40,8]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  const grave=(x,y)=>{ if(inb(x,y)&&!solidAt(x,y)){ G.decor.push({kind:'grave',x:x+0.5,y:y+0.5,s:(x+y)%3}); setSolid(x,y,1); } };
  // R2: three bone-locks, all must be thrown to raise the Bone Gate (reuses the ward mechanic)
  const GATE=[[38,37],[39,37],[40,37],[41,37],[42,37]];
  for(const [lx,ly] of [[29,44],[51,44],[40,58]])
    G.decor.push({kind:'icelever', x:lx+0.5, y:ly+0.5, on:false, wardGroup:'tomb', gateTiles:GATE, label:'a bone-lock',
      openBanner:'THE BONE-LOCKS YIELD', openSub:'THE BONE GATE GRINDS OPEN',
      openMsg:'The last bone-lock drops with a wet crack and the Bone Gate hauls up, weeping brine. The Drowned Vault lies open to the north.'});
  for(const [gx,gy] of [[34,48],[46,48],[30,56],[50,56]]) grave(gx,gy);
  // R3: the warden's hoard
  G.decor.push({kind:'chest', x:40.5, y:11.5, deep:1, rich:12});
  G.decor.push({kind:'chest', x:31.5, y:14.5, deep:1, rich:7});
  for(const [gx,gy] of [[30,26],[50,26],[34,12],[46,12]]) grave(gx,gy);
  G.critters=[];
  if(P.story && P.story.tombDone){ for(const [x,y] of GATE){ setTile(x,y,T.RUIN); setSolid(x,y,0); }
    for(const d of G.decor){ if(d.kind==='icelever' && d.wardGroup==='tomb') d.on=true; } }
}
function spawnMobsReachDeep(){
  const Z=REACHDEEP_ZONES;
  // the Drowned Warden guards the vault; skeletons haunt the ossuary
  if(!(P.story && P.story.tombBossDown)){
    const sp=findOpenNear(Z.heart.x, Z.heart.y, 6) || [Z.heart.x, Z.heart.y];
    const w=spawnMob('gravelord', sp[0], sp[1]);
    if(w){ w.boss=true; w.bigBoss=true; w.title='THE DROWNED WARDEN'; w.subtitle='KEEPER OF THE CATACOMB'; w.tombboss=1;
      w.hp=w.maxhp=900; w.dmg=34; w.lvl=14; w.hx=sp[0]; w.hy=sp[1]; w.respawnT=-1; }
  }
  for(const z of [Z.ossuary, Z.heart]) for(let i=0;i<2;i++){ const a=Math.random()*TAU, r2=Math.random()*z.r*0.5;
    const sp=findOpenNear(Math.round(z.x+Math.cos(a)*r2), Math.round(z.y+Math.sin(a)*r2), 5);
    if(sp) spawnMob('skeleton', sp[0], sp[1]); }
}
function genReachDeepAll(){ genReachDeep(); placeObjectsReachDeep(); spawnMobsReachDeep(); buildMapBase(); }
function enterReachDeep(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P._tombReturn={x:P.x, y:P.y+1.3}; P.click=null;
  setTimeout(()=>{ switchWorld('reachdeep'); if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function exitReachDeep(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.click=null;
  setTimeout(()=>{ switchWorld('reach');
    const r=P._tombReturn; if(r){ P.x=r.x; P.y=r.y; G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
// ---------- transitions ----------
function flyToCloudreach(){
  P.story=P.story||{}; P.story.skyKnown=1;
  flyToWorld('sky','Ashwing gathers himself and springs from the Windsurf shore - down becomes a memory as he beats up and up, through the last ragged cloud, to a rock that floats where no rock should.');
}
function askSkyDragon(){
  // Ashwing on the Cloudreach - the ride back DOWN the way you came, to the Sunward
  // shore. (Going FORWARD to Windsurf is the parachute's job - and needs the Roc down.)
  setDialog('<i>Ashwing folds a wing against the wind and rumbles - he will carry you back down the way you came, to the Sunward shore, whenever the height gets into your knees.</i>',
    [ {label:'Fly back to the Sunward Isle', cls:'gold', fn:()=>{ closeDialog();
        flyToWorld('east','Ashwing tips off the cloud-shelf and pours downward - the Sunward Isle swelling up green out of the sea to meet you.'); }},
      {label:'Not just yet', ghost:true, fn:closeDialog} ]);
}
function useLeapPoint(){
  if(!(P.story && P.story.parachute)){
    toast('The stone shelf juts out over a drop of pure cloud - no bottom, only the far grey shine of the sea. You would need <b>a sail to fall by</b>. They say the <b>Storm Roc</b> keeps one.',5200);
    Snd.step&&Snd.step(5); return;
  }
  if(!flightLockOK()) return; closeDialog();
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1;
  toast('You shake out the Roc’s stormsail, run three steps, and <b>step off the world</b>. The sail cracks open - and you drift down through the cold cloud, an industrious city rising bright out of the water to meet you: <b>Windsurf</b>.',6500);
  if(Snd.boss) Snd.boss();
  setTimeout(()=>{ try{ switchWorld('wind'); autoSave&&autoSave();
      banner('WINDSURF ISLE','YOU COME DOWN OUT OF THE CLOUD');
    } finally { setTimeout(()=>{ if(fd) fd.style.opacity=0; G._flying=0; G._flyUntil=0; },260); } }, 1100);
}

/* =====================================================================
   ALDERMERE - the royal capital. A great walled city climbing from the
   harbor to the Tideglass Palace, where a grieving king has ruled alone
   since the sea took his queen and their infant heir a lifetime ago.
   The grandest, most populous world in the game - a whole kingdom to
   walk. (The reveal that binds it to Emberwick waits behind Act 3.)
   ===================================================================== */
function genCrown(){
  const hN=makeNoise(SEED,10), mN=makeNoise(SEED+41,7), vR=mulberry32(SEED+9);
  const CX2=96, CY2=96;
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    const nx=x/MAPW, ny=y/MAPH;
    const d=dist(x,y,CX2,CY2)/(MAPW*0.50);
    let h=hN(nx,ny)*0.66 + hN(nx*2.4,ny*2.4)*0.34;
    h-=Math.pow(d,2.1)*0.92;
    let t;
    if(h<0.17) t=T.DEEP; else if(h<0.245) t=T.SHALLOW; else if(h<0.29) t=T.SAND;
    else t=(mN(nx,ny)>0.60)?T.FOREST:T.GRASS;
    G.map[y*MAPW+x]=t; G.variant[y*MAPW+x]=Math.floor(vR()*4);
  }
  const Z=CROWN_ZONES;
  // district clearings - packed civic ground (paths) for the built-up wards,
  // green for the palace lawns and the memorial garden
  carveDisc(Z.harbor.x,Z.harbor.y,Z.harbor.r,T.PATH,false);
  carveDisc(Z.market.x,Z.market.y,Z.market.r,T.PATH,false);
  carveDisc(Z.plaza.x,Z.plaza.y,Z.plaza.r,T.PATH,false);
  carveDisc(Z.temple.x,Z.temple.y,Z.temple.r,T.PATH,false);
  carveDisc(Z.barracks.x,Z.barracks.y,Z.barracks.r,T.PATH,false);
  carveDisc(Z.highrow.x,Z.highrow.y,Z.highrow.r,T.PATH,false);
  // broad palace grounds - carved wide (r+6) so the colossal keep has a walkable
  // green ring on every side, with a grand paved forecourt sweeping to the gate
  carveDisc(Z.palace.x,Z.palace.y-2,Z.palace.r+6,T.GRASS,false);  // palace lawns
  carveDisc(Z.palace.x,Z.palace.y+7,10,T.PATH,false);             // the grand forecourt
  carveDisc(Z.garden.x,Z.garden.y,Z.garden.r,T.GRASS,false);      // the queen's garden
  // harbor bay + the king's quay
  const D=Z.dock;
  carveDisc(D.x-5,D.y,6,T.DEEP,false);
  for(let y=D.y-8;y<=D.y+8;y++) for(let x=D.x-12;x<=D.x+5;x++){
    if(inb(x,y)&&tileAt(x,y)===T.DEEP&&(walkTile(tileAt(x+1,y))||walkTile(tileAt(x-1,y))||walkTile(tileAt(x,y+1))||walkTile(tileAt(x,y-1)))) setTile(x,y,T.SHALLOW);
  }
  for(let x=D.x-4;x<=D.x+3;x++){ setTile(x,D.y,T.PLANK); setTile(x,D.y+1,T.PLANK); }
  // the Processional - one grand paved avenue from the quay up to the palace
  // gate, threading every ward, plus feeder streets. landBridge first so no
  // stretch of coast can sever the road.
  function landBridge(x0,y0,x1,y1){
    const steps=Math.ceil(dist(x0,y0,x1,y1))*2, laid=[];
    for(let i=0;i<=steps;i++){
      const x=Math.round(lerp(x0,x1,i/steps)), y=Math.round(lerp(y0,y1,i/steps));
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
        if(Math.abs(dx)+Math.abs(dy)>1) continue;
        if(inb(x+dx,y+dy) && !walkTile(tileAt(x+dx,y+dy))){ setTile(x+dx,y+dy,T.SAND); laid.push([x+dx,y+dy]); }
      }
    }
    for(const [lx,ly] of laid) for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++)
      if(inb(lx+dx,ly+dy) && tileAt(lx+dx,ly+dy)===T.DEEP) setTile(lx+dx,ly+dy,T.SHALLOW);
  }
  const AVE=[
    [D.x+3,D.y, Z.harbor.x,Z.harbor.y],
    [Z.harbor.x,Z.harbor.y, Z.market.x,Z.market.y],
    [Z.market.x,Z.market.y, Z.plaza.x,Z.plaza.y],
    [Z.plaza.x,Z.plaza.y, Z.palace.x,Z.palace.y+6],
    [Z.plaza.x+4,Z.plaza.y, Z.temple.x,Z.temple.y],
    [Z.market.x+6,Z.market.y-2, Z.highrow.x,Z.highrow.y],
    [Z.plaza.x,Z.plaza.y-4, Z.barracks.x+4,Z.barracks.y+2],
    [Z.palace.x+6,Z.palace.y, Z.garden.x,Z.garden.y],
    [Z.highrow.x,Z.highrow.y-4, Z.garden.x,Z.garden.y+4]
  ];
  for(const r of AVE) landBridge(r[0],r[1],r[2],r[3]);
  for(const r of AVE) carveLine(r[0],r[1],r[2],r[3], T.PATH,1);   // broad avenue
  // a low green belt of royal parkland ringing the palace hill
  carveDisc(Z.palace.x-10,Z.palace.y+10,6,T.FOREST,true);
  carveDisc(Z.palace.x+12,Z.palace.y+8,5,T.FOREST,true);
  // shore cleanup - drop orphaned shallow tiles back to deep
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(tileAt(x,y)===T.SHALLOW){
      let landNear=false;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) if(walkTile(tileAt(x+dx,y+dy))) landNear=true;
      if(!landNear) setTile(x,y,T.DEEP);
    }
  }
}
function placeObjectsCrown(){
  const Z=CROWN_ZONES, D=Z.dock, H=Z.harbor, M=Z.market, PL=Z.plaza, T2=Z.temple,
        PA=Z.palace, GA=Z.garden, BA=Z.barracks, HR=Z.highrow;
  // ---- the Tideglass Palace: the crown of the city, and the single largest
  // structure in the game. A colossal keep you can walk the whole way around. ----
  const pal=addBuilding('castle', PA.x, PA.y-3, 'The Tideglass Palace');
  pal.grand=true;
  // The palace is one flat, screen-centred billboard, so a tile-rectangle
  // footprint projects to a skewed diamond - it blocks too early on one side and
  // lets you walk under the wall on the other. Instead we solidify in SCREEN
  // space: a tile is part of the keep when its on-screen centre falls under the
  // opaque curtain wall (bottom band of the sprite) and at/behind the wall base
  // line. This is left-right symmetric, matching what you see. rx/ry are the
  // tile centre's pixel offset from the building anchor (isoX=(x-y)*32, isoY=(x+y)*16).
  const axm=PA.x+0.5-(PA.y-2.5), aym=PA.x+0.5+(PA.y-2.5);   // anchor (x-y) and (x+y)
  // Seal the WHOLE billboard footprint - from the base line back to the sprite top
  // (ry=-895) across its width (|rx|<=640). The lawn behind the palace is open, so
  // if we only blocked the near band you could walk around a tower and tuck in
  // behind the wall (occluded). This slant spans ~Y[PA.y-40 .. PA.y+8] in tile
  // space, so the scan region must be generous to contain it.
  //   The crisp wall you actually bump is the continuous screen-space barrier
  // below. The tile solids exist only so solidAt-based systems (pathing, spawns)
  // treat the keep as occupied - so they are RECEDED a whole tile INSIDE the
  // barrier on every side (|rx|<=600, ry<=-24, i.e. each diamond's corners stay
  // within the barrier's |rx|<=640 / ry<=10). Any land tile between that inset
  // and the barrier - including addBuilding's default footprint - is cleared, so
  // no stray diamond corner pokes past the smooth wall on the front OR the sides.
  for(let Y=PA.y-44;Y<=PA.y+10;Y++) for(let X=PA.x-42;X<=PA.x+34;X++){
    const rx=((X-Y)-axm)*32, ry=((X+Y)-aym)*16;
    if(Math.abs(rx)>700 || ry<-900 || ry>30) continue;
    if(ry<=-24 && ry>=-880 && Math.abs(rx)<=600) setSolid(X,Y,1);   // keep mass, kept a tile inside the barrier
    else if(walkTile(tileAt(X,Y))) setSolid(X,Y,0);                 // clear the margin so only the barrier bites
  }
  // The straight, sub-tile wall the player collides with (see palaceBarrier in
  // circleBlocked). rx/ry as above; ry<=BASE is the wall's front face.
  PALACE_BAR={axm, aym, base:10, back:-895, span:640};
  // The gate sits screen-centred (rx=0); the door trigger is a couple of tiles
  // out into the open forecourt so you can walk right up to the wall and enter.
  pal.door={x:PA.x+2, y:PA.y-1};
  // grand forecourt lamps, set well out from the gate so they don't vanish
  // under the towering facade
  addBuilding('lamp', PA.x-7, PA.y+9, ''); addBuilding('lamp', PA.x+7, PA.y+9, '');
  addBuilding('lamp', PA.x-11, PA.y+2, ''); addBuilding('lamp', PA.x+11, PA.y+2, '');
  // ---- the Palace Kitchens: a separate tradesman's door round the west side,
  // clear of the gate. Delivering Odo's crate to Nan here earns the run of the palace.
  const kit=addBuilding('house2', PA.x-14, PA.y+8, 'The Palace Kitchens');
  if(kit) kit.kitchen=1;
  addBuilding('lamp', PA.x-14, PA.y+11, ''); addBuilding('lamp', PA.x-17, PA.y+7, '');
  // ---- the Cathedral of the Tide ----
  addBuilding('tower', T2.x, T2.y, 'The Cathedral of the Tide');
  addBuilding('lamp', T2.x-3, T2.y+3, ''); addBuilding('lamp', T2.x+3, T2.y+3, '');
  // ---- Crown Plaza: the civic heart ----
  addBuilding('well', PL.x, PL.y, 'The Kings\' Fountain');
  const hallCharts=addBuilding('house2', PL.x-6, PL.y-4, 'The Hall of Charts');
  hallCharts.lockMsg='The <b>Hall of Charts</b> is crown business - cartographers and captains only. The clerk does not look up.';
  const mint=addBuilding('house2', PL.x+6, PL.y-3, 'The Mint');
  mint.lockMsg='The <b>Royal Mint</b>. Two guards, one very serious door, and no reason on earth to let you in.';
  addBuilding('stall', PL.x-3, PL.y+4, ''); addBuilding('stall', PL.x+3, PL.y+4, '');
  for(const [lx,ly] of [[-7,0],[7,0],[0,-7],[-5,6],[5,6]]) addBuilding('lamp', PL.x+lx, PL.y+ly, '');
  // ---- the Grand Bazaar: two tidy rows of fine, named stalls around the
  // fountain - each a real shop you can buy from (a gold coin floats over it) ----
  addBuilding('well', M.x, M.y, 'The Merchants\' Fountain');            // grand central fountain
  const STALLS=[
    {dx:-8,dy:-6, v:0, name:'The Tonic Cart',      line:'Tonics fresh-drawn - a swallow of courage for the road.',       wares:[['potion',8],['elixir',24]]},
    {dx:0, dy:-6, v:1, name:"The King's Bakehouse", line:'Bread still warm and orchard apples, by royal license.',         wares:[['bread',5],['apple',3]]},
    {dx:8, dy:-6, v:2, name:'The Fishmonger',       line:'Off the Kingsferry boats this morning - still arguing.',        wares:[['fish',3],['cookedfish',7]]},
    {dx:-8,dy:6,  v:1, name:'The Emberwright',      line:'Ember crystals, warm as a grudge - good against cold nights.',  wares:[['crystal',18]]},
    {dx:0, dy:6,  v:2, name:'The Greengrocer',      line:'Grain and greens off the palace fields, crisp this morning.',   wares:[['wheat',3],['coconut',6]]},
    {dx:8, dy:6,  v:0, name:'The Chandlery',        line:'Salt-meat and sundries for a long walk inland.',               wares:[['boarmeat',10],['potion',8]]},
  ];
  for(const st of STALLS){ const s=addBuilding('bazaar', M.x+st.dx, M.y+st.dy, st.name);
    if(s){ s.variant=st.v; s.shop={name:st.name, line:st.line, wares:st.wares.map(w=>({item:w[0],price:w[1]}))}; } }
  addBuilding('fruitstand', M.x-12, M.y, ''); addBuilding('fruitstand', M.x+12, M.y, '');
  // a colonnade of tall pillars framing the bazaar
  for(let i=0;i<10;i++){ const a=i/10*TAU, px=Math.round(M.x+Math.cos(a)*(M.r-1)), py=Math.round(M.y+Math.sin(a)*(M.r-1)*0.9);
    if(inb(px,py)&&walkTile(tileAt(px,py))&&!solidAt(px,py)) G.decor.push({kind:'pillar',x:px+0.5,y:py+0.5}); }
  // grand guild halls at the market's ends (members only); the inn stays open
  const spiceHall=addBuilding('house2', M.x-7, M.y-12, 'The Spice Hall');
  spiceHall.lockMsg='The <b>Spice Guild</b> admits members and coin, not sightseers. The door smells of cinnamon and closes in your face.';
  const clothHall=addBuilding('house2', M.x+7, M.y-12, 'The Cloth Hall');
  clothHall.lockMsg='The <b>Cloth Guild</b> hall. “Wholesale only, love,” calls a voice - and the latch does not lift.';
  addBuilding('house',  M.x, M.y+12, 'The Coin & Cup (Inn)');
  for(const [lx,ly] of [[-12,-10],[12,-10],[-12,10],[12,10],[0,-11],[0,11]]) addBuilding('lamp', M.x+lx, M.y+ly, '');
  // ---- Kingsferry Quay: an open, uncluttered arrival - boats, lamps, a
  // dockside cart and a colonnade, but no houses crowding the first thing you see ----
  // ONE ferry, moored on open water off the quay. (It used to place two - and one
  // of them beached itself on the grass.) Walk out from the city centre toward the
  // dock and drop the boat on the first sea tile, never on land.
  { const cx2=96, cy2=96, ddx=D.x-cx2, ddy=D.y-cy2, dl=Math.hypot(ddx,ddy)||1;
    let placed=false;
    for(let step=2; step<=18 && !placed; step++){ const tx=Math.round(D.x+ddx/dl*step), ty=Math.round(D.y+ddy/dl*step);
      if(inb(tx,ty)){ const t=tileAt(tx,ty); if(t===T.SHALLOW||t===T.DEEP){ addBuilding('boat', tx, ty, ''); placed=true; } } } }
  addBuilding('fruitstand', H.x-3, H.y+2, '');   // a dockside cart working the arriving crowds
  addBuilding('lamp', D.x, D.y-2, ''); addBuilding('lamp', H.x-6, H.y+4, ''); addBuilding('lamp', H.x+6, H.y+4, '');
  // a short colonnade framing the quay so the arrival still reads as grand
  for(const [px3,py3] of [[H.x-5,H.y-3],[H.x-1,H.y-4],[H.x+3,H.y-4]])
    if(inb(px3,py3)&&walkTile(tileAt(px3,py3))&&!solidAt(px3,py3)) G.decor.push({kind:'pillar',x:px3+0.5,y:py3+0.5});
  // ---- the Garrison (barred to civilians) ----
  const garr=addBuilding('house2', BA.x, BA.y-2, 'The Garrison');
  garr.lockMsg='The <b>Garrison</b> door is barred to civilians - Captain Halvard’s standing order.';
  const armory=addBuilding('barn', BA.x-5, BA.y+3, 'Armory');
  armory.lockMsg='The <b>Armory</b> is under lock and seal. Steel for soldiers, not strangers.';
  addBuilding('lamp', BA.x-4, BA.y-4, ''); addBuilding('lamp', BA.x+4, BA.y-4, '');
  // ---- Highrow: noble townhouses (private - no wandering in off the street) ----
  const highLines=['A <b>Highrow townhouse</b>. A footman cracks the door, takes in your salt-stained boots, and shuts it again - coolly.',
    'A noble’s door, lacquered and unamused. “The family is not receiving,” a servant informs the air near your head.',
    'A <b>Highrow residence</b>. The knocker is a gold gull; the answer is a very quiet, very final click.'];
  for(let i=0;i<6;i++){ const hx=HR.x-8+((i%3)*7), hy=HR.y-5+(Math.floor(i/3)*8);
    if(inb(hx,hy)&&walkTile(tileAt(hx,hy))){ const nh=addBuilding(i%2?'house2':'house', hx, hy, '');
      if(nh) nh.lockMsg=highLines[i%3]; } }
  addBuilding('well', HR.x, HR.y+1, '');
  for(const [lx,ly] of [[-9,0],[9,0],[0,7]]) addBuilding('lamp', HR.x+lx, HR.y+ly, '');
  // ---- the Drowned Queen's Garden: a place of quiet mourning ----
  addBuilding('well', GA.x, GA.y, "The Weeping Font");   // a memorial fountain
  const gr=mulberry32(SEED+33);
  for(let gy=-GA.r;gy<=GA.r;gy++) for(let gx=-GA.r;gx<=GA.r;gx++){ const px=GA.x+gx, py=GA.y+gy;
    if(Math.hypot(gx,gy)<=GA.r && inb(px,py) && tileAt(px,py)===T.GRASS && !solidAt(px,py)){
      if(gr()<0.10) addNode('tree',px,py);
      else if(gr()<0.22) G.decor.push({kind:'flower',x:px+0.5,y:py+0.5,c:gr()<0.5?'#cfe0ff':'#e6d0ff',ph:gr()*TAU}); } }
  // parkland trees ringing the palace lawns
  const pr=mulberry32(SEED+52);
  for(let i=0;i<70;i++){ const ax=Math.floor(pr()*MAPW), ay=Math.floor(pr()*MAPH);
    if(tileAt(ax,ay)===T.FOREST && !solidAt(ax,ay) && pr()<0.5){
      if(dist(ax,ay,PA.x,PA.y)<PA.r-2) continue; addNode('tree',ax,ay); } }
  // grass tufts + wildflowers softening the avenues
  for(let i=0;i<120;i++){ const ax=Math.floor(pr()*MAPW), ay=Math.floor(pr()*MAPH);
    if(tileAt(ax,ay)===T.GRASS && !solidAt(ax,ay)){
      if(pr()<0.5) G.decor.push({kind:'tuft',x:ax+0.5,y:ay+0.5,ph:pr()*TAU}); } }
  // ---- the Palace Kitchen Garden: tilled lettuce beds, raided by hares ----
  const LG=crownLettucePlot();
  for(let ly=-2;ly<=2;ly++) for(let lx=-3;lx<=3;lx++){ const px=LG.x+lx, py=LG.y+ly;
    if(inb(px,py)&&walkTile(tileAt(px,py))&&!solidAt(px,py)){
      if(tileAt(px,py)!==T.SOIL) setTile(px,py,T.SOIL);
      if((lx+ly)%2===0) G.decor.push({kind:'lettuce',x:px+0.5,y:py+0.5,ph:(px*7+py*13)%6,nibbled:((px+py)%3===0)}); } }
  G.critters=[];
}
// the lettuce beds sit just southwest of the Drowned Queen's Garden
function crownLettucePlot(){ const GA=CROWN_ZONES.garden; return {x:Math.round(GA.x-12), y:Math.round(GA.y+8)}; }
function spawnCrownFolk(){
  const Z=CROWN_ZONES, PA=Z.palace, PL=Z.plaza, M=Z.market, H=Z.harbor, GA=Z.garden, BA=Z.barracks, D=Z.dock;
  // ---- King Aldous: he holds court INSIDE the Tideglass Palace only, never out
  // in the plaza. He still lives in G.npcs (the palace throne figure opens his
  // dialogue), but `throne` keeps him permanently hidden from the open city. ----
  G.npcs.push((()=>{ const k=makeNPC('aldous','King Aldous', PA.x+0.5, PA.y+5.5,
    {skin:'#d8b48c',hair:'#d6d0c4',shirt:'#3a2f5e',pants:'#2a2340',robe:'#402a68',trim:'#c9a24e',beard:'#d6d0c4',beardLong:true,hat:'crown',necklace:'#c9a24e'},
    ['A stranger, and from the isles by your salt. Be welcome in Aldermere. We have grandeur enough - it is gladness we run short of.',
     'This whole city was built for a family of three. I am the one left rattling in it.',
     'They tell me to remarry, to name an heir from the cousins. I tell them the sea still owes me an answer first.',
     'You have the look of someone the tide keeps throwing back. I know that look. I wear it.'],0.15);
    k.throne=1; return k; })());
  // ---- Lord Steward Perrin: runs the kingdom day to day ----
  G.npcs.push(makeNPC('perrin','Lord Steward Perrin', PA.x-4.5, PA.y+6.5,
    {skin:'#c79a6a',hair:'#5a4a38',shirt:'#4a4a5a',pants:'#33303c',robe:'#3a3a4c',trim:'#9a9aa8',hairstyle:'short'},
    ['His Majesty grieves in public now, which is new. For thirty years he did it behind a shut door.',
     'Do not speak of the lost prince within the King\'s hearing unless you mean to ruin his week. The whole court steps around it.',
     'Aldermere runs on ledgers and patience. I supply both.'],0.2));
  // ---- Captain of the Guard ----
  { const halvard=makeNPC('halvard','Captain Halvard', BA.x+0.5, BA.y+2.5,
    {skin:'#b5825a',hair:'#3a2f26',shirt:'#5a2f2f',pants:'#33282a',beard:'#3a2f26',hairstyle:'short'},
    ['The Garrison drills dawn to dark. A soft capital is a short one.',
     'You carry yourself like you\'ve put down worse than street thieves. Good. The realm can always use another arm.',
     'Trouble on the isles? We hear things. Robed men, curses lifting. Someone out there is doing the crown\'s work for it.'],0.2);
    halvard.nightOwl=true; G.npcs.push(halvard); }   // a captain holds his post round the clock
  // ---- soldiers posted through the city: a walled, patrolled, SAFE capital.
  // The watch stands its posts DAY AND NIGHT (nightOwl) - troops don't troop indoors at dusk. ----
  { const gLook={skin:'#bd8f60',hair:'#3a2f26',shirt:'#42506a',pants:'#2e3340',trim:'#c9a24e',armor:1,hairstyle:'short'};
    const gLines=['Move along, citizen. The peace holds while we hold it.',
                  'Aldermere sleeps easy because we do not.',
                  'Nothing gets past the wall on my watch - not thief, not wraith, not worse.',
                  'The night shift is the long one. Keep your lantern lit and your business honest.'];
    [[PA.x-3,PA.y+6],[PA.x+4,PA.y+6],[PL.x-5,PL.y+1],[PL.x+6,PL.y-1],[H.x+2,H.y+2],[M.x-4,M.y+2]].forEach((p,i)=>{
      const g=makeNPC('cguard'+i,'City Guard', p[0]+0.5, p[1]+0.5, {...gLook}, gLines, 0.05);
      g.nightOwl=true; G.npcs.push(g);
    }); }
  // ---- the Herald: town crier in the plaza ----
  G.npcs.push(makeNPC('brea','Brea the Herald', PL.x+0.5, PL.y+2.5,
    {skin:'#8a5a3a',hair:'#2a2018',shirt:'#7a5a2f',pants:'#4a3a24',hairstyle:'bun'},
    ['Hear it! The strait to the Frozen Isle runs free again - trade convoys sail within the fortnight!',
     'Hear it! The skies over the Aerie have quieted; her Rookmother sends her thanks to the unnamed traveler!',
     'Word comes off every isle at once - old curses breaking like ice in spring. The city cannot decide if it is a miracle or a warning.'],0.1));
  // ---- the Gardener, tending the memorial ----
  G.npcs.push(makeNPC('isolde','Isolde the Gardener', GA.x+0.5, GA.y+2.5,
    {skin:'#c99a72',hair:'#7a6a4a',shirt:'#4a5a44',pants:'#3a3a2c',hairstyle:'bun'},
    ['This is the Queen\'s garden. She loved the sea-colored blooms - so I keep them, though she has not walked here in thirty years.',
     'They never found her. Nor the babe. The King had the font built so there\'d be a place to weep that wasn\'t the shoreline.',
     'Strange - some travelers stand at the font and go pale, as if they half-remember it. You look a little that way yourself.'],0.15));
  // ---- market + harbor flavor ----
  G.npcs.push(makeNPC('doran','Doran the Factor', M.x+0.5, M.y+2.5,
    {skin:'#a0703f',hair:'#3a2f26',shirt:'#5a4a7a',pants:'#3a3244',beard:'#3a2f26'},
    ['Silk from the Sunward Isle, ore from Barik, ice-wine from the Frozen strait once it thaws - the Bazaar sells the whole map.',
     'Coin talks in Aldermere, friend, and lately it can\'t stop talking about you.'],0.3));
  G.npcs.push(makeNPC('mabley','Old Mabley', H.x+0.5, H.y+2.5,
    {skin:'#b58a5e',hair:'#cfc7b8',shirt:'#3a5a5a',pants:'#2f3a3a',beard:'#cfc7b8',beardLong:true},
    ['Sixty years mending nets on this quay. Watched the young prince\'s ship sail out. Watched it never come back.',
     'Bad water that season. Bad water and, some say, a bad man aboard. But that\'s an old sailor talking.'],0.25));
  // ---- Gale the Kitchen-Gardener: tends the palace lettuce beds ----
  const LG=crownLettucePlot();
  G.npcs.push(makeNPC('gale','Gale the Kitchen-Gardener', LG.x+0.5, LG.y+3.5,
    {skin:'#b58a5e',hair:'#6a5a3a',shirt:'#5a7a44',pants:'#4a3e28',apron:'#8a7a54',hairstyle:'short'},
    ['Thirty beds of lettuce, and every hare in the realm thinks it\'s a public garden.',
     'The King won\'t touch a supper without greens. So the greens had better survive till supper.',
     'You want honest work? There\'s always honest work where there\'s dirt.'],0.2));
  // ---- Odo the Victualler: supplies the palace kitchen; gives the kitchen-run ----
  G.npcs.push(makeNPC('odo','Odo the Victualler', M.x-3.5, M.y+3.5,
    {skin:'#c08850',hair:'#4a3a28',shirt:'#6a5a34',pants:'#4a3e28',apron:'#8a7048',beard:'#4a3a28'},
    ['I feed a palace and half a garrison off this one cart. Ask me anything but for a discount.',
     'The kitchen wants everything by supper and pays me by the moon. Such is the crown\'s trade.',
     'Reliable legs are worth more than gold in this city, friend, and just as hard to find.'],0.25));
}
function spawnMobsCrown(){
  const Z=CROWN_ZONES, BA=Z.barracks;
  // the capital is a safe city - a training yard for the garrison, no foes
  const yd=findOpenNear(Math.round(BA.x+3),Math.round(BA.y+4),5);
  if(yd) spawnMob('dummy',yd[0],yd[1]);
  const yd2=findOpenNear(Math.round(BA.x-3),Math.round(BA.y+4),5);
  if(yd2) spawnMob('dummy',yd2[0],yd2[1]);
  // garden hares raiding the palace lettuce beds - harmless pests for Gale's quest
  const LG=crownLettucePlot();
  for(const [dx,dy] of [[-2,-1],[2,0],[0,2]]){ const sp=findOpenNear(LG.x+dx, LG.y+dy, 4); if(sp) spawnMob('hare', sp[0], sp[1]); }
}
function updateCrownFolkMood(){
  if(!(P.story && P.story.kingTold)) return;
  const set=(id,lines)=>{ const n=G.npcs.find(x=>x.id===id); if(n){ n.idleLines=lines; n.li=0; } };
  // after the audience, the King speaks openly of the hunt he has charged you with
  set('aldous',['Thirty years I called Vath a drowned man and mourned him beside my own. Now I know he swam. Find him, traveler. Find what he did with my son.',
    'You wear that pendant like it was made for you. Perhaps that is why I trust you with this - though I could not say why.',
    'Go where the curses lead. They are his handwriting. Follow them to the hand that wrote them.']);
  set('perrin',['His Majesty has not stood so straight in decades. Whatever passed between you gave the old grief a direction. That is no small gift.',
    'A royal writ, an open purse, and the King\'s own hope riding on you. Do not squander them.']);
  set('brea',['Hear it! The King has named the traveler his own hand abroad - go where they go, and you go with the crown\'s blessing!']);
}
function genCrownAll(){
  genCrown(); bakeSolids(); placeObjectsCrown(); buildFoam();
  spawnCrownFolk(); spawnMobsCrown();
  buildMapBase();
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
  rw:{gold:15, item:{potion:2}, xp:{melee:40}}, unlocks:['nets','roadclear'] };
QUESTS.nets={ giver:'sela', title:'Nets of Barik', kind:'gather', need:{fish:6},
  brief:'The trawlers won\'t round the point while wolves haunt the cliff road, so my counter\'s bare. Six fresh fish from any Barik shallows keeps Greyharbor fed a week.',
  log:'Catch 6 fish in Barik\'s shallows for Sela.',
  doneText:'Fat ones, too. The harbor eats tonight - and pays this morning.',
  rw:{gold:45, item:{bread:2}, xp:{fishing:160}} };
QUESTS.roadclear={ giver:'kell', title:'Clear the King\'s Road', kind:'kill', kill:{wolf:8},
  brief:'The road from Greyharbor to Blackpine belongs to the wolves after dusk. Eight pelts thins the packs enough for the carts to run. Mind the crimson-ringed ones.',
  log:'Slay 8 wolves along Barik\'s roads and highlands.',
  doneText:'The carters are already singing about it. Off-key. Greyharbor thanks you properly: in coin.',
  rw:{gold:80, item:{wardstone:1}, xp:{melee:200, archery:120}} };
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
  rw:{gold:55, item:{crystal:1}, xp:{mining:220}}, unlocks:['torv2'] };
QUESTS.torv2={ giver:'torv', title:'The Old Vein', kind:'gather', need:{ore:4},
  brief:'Stone keeps walls up; ore keeps forges lit. The deep rock here still carries iron if you\'ve the arm for it. Four ore and Greyharbor\'s smith stays in business.',
  log:'Break 4 iron ore from Barik\'s stone for Torv.',
  doneText:'Good iron. Honest iron. The kind that remembers being a mountain.',
  rw:{gold:75, item:{crystal:2}, xp:{mining:260}} };
QUESTS.ivo1={ giver:'ivo', title:'Tidebalm', kind:'gather', need:{shell:5},
  brief:'Ground shell, kelp ash, and patience - tidebalm knits cuts the sea gives. The strand west of the docks throws up shells after every tide. Five whole ones, unbroken.',
  log:'Collect 5 shells from Barik\'s beaches for Ivo.',
  doneText:'Unbroken, every one. You\'d make a fair herbalist if the sword ever bores you. Balm\'s share is yours.',
  rw:{gold:35, item:{potion:2}, xp:{fishing:140}} };
QUESTS.ribbon1={ giver:'corvo', title:'A Ribbon for Wren', kind:'talk', talkTo:'mira', xpL:90, stageOf:'ribbon', stage:1,
  brief:'East past the shoals sits an island the charts pretend not to see. Bring my girl Wren a fine ribbon for her birthday and I will sail you there myself. Mira at Thimble and Thread in Greyharbor weaves the best on Barik.',
  log:'(1/3) Ask Mira the Seamstress in Greyharbor about a ribbon.',
  doneText:'A ribbon? I would love nothing more, truly. But my whole silk shipment was taken on the north road. Brigands nest in the pines north of Blackpine now, and my silk sits in their camp. I cannot say when more will come. Here - take a couple of tonics for the road; the pines are no place to go dry.',
  rw:{item:{potion:2}, xp:{archery:60}} };
QUESTS.ribbon2={ giver:'mira', title:'A Ribbon for Wren', kind:'gather', need:{silk:1}, xpL:200, stageOf:'ribbon', stage:2,
  brief:'If you can walk into that camp and walk out again: my silk sits in a chest they guard, north of the deep pines. Bring me one bolt and I will weave the finest ribbon Barik has seen.',
  log:'(2/3) Steal back a bolt of silk from Thieves\' Hollow, north of Blackpine.',
  doneText:'Dawn-colored, and not a thread pulled. Give me a moment... there. A Sunset Ribbon, and my thanks stitched into it.',
  rw:{item:{ribbon:1}, gold:40} };
QUESTS.ribbon3={ giver:'corvo', title:'A Ribbon for Wren', kind:'gather', need:{ribbon:1}, xpL:260, stageOf:'ribbon', stage:3,
  brief:'You have it? Wren will be over the moon and halfway back.',
  log:'(3/3) Bring the Sunset Ribbon to Captain Corvo at the east cove.',
  doneText:'She will wear it till the color goes. A bargain is a bargain - and the tide is with us NOW. Say the word, any time, and we run east for the Sunward Isle.',
  rw:{gold:150, item:{elixir:1}, xp:{archery:140}} };
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
// The windsurf is earned ONLY on Windsurf Isle now (Tolen's board + the Undermill
// sail dungeon), so it is the sole - and mandatory - source of the board. Kaia the
// Wavewright on the Sunward Isle no longer grants it: surf1 is no longer offered
// (dropped from the east quest-arming list) and grants NO surf. The def is kept
// inert only so an in-flight save that already accepted it doesn't dangle.
QUESTS.surf1={ giver:'kaia', title:'The Wind Is a Road', kind:'gather', need:{wood:8, crystal:1}, xpL:220,
  brief:'I\'d shape you a windsurf gladly - but there\'s no stormcloth this side of Windsurf Isle, and a board\'s a plank without a sail. Bring the timber and a crystal and I\'ll ready you a blank; the sail you must find across the cloud-sea.',
  log:'Bring Kaia 8 wood and 1 ember crystal for a board-blank. (The true windsurf waits on Windsurf Isle.)',
  doneText:'There - a good blank, cured and waiting. But bare it stays till you find a proper sail on Windsurf Isle. The wind\'s a road, friend - it just runs the long way round.',
  rw:{gold:30} };   // NO surf - the windsurf is earned only on Windsurf Isle
QUESTS.board={ giver:'tolen', title:'A Board for the Strait', kind:'gather', need:{wood:6, shell:3}, xpL:240,
  brief:'Face the beast in the strait? Not off Rell\'s jetty you won\'t - it only reaches so far, and that thing swims. You\'ll want a windsurf, and I\'m the only hand on this rock who can shape one. Bring me six lengths of good timber and three big spiral shells to inlay the rails, and I\'ll shape you a board fit for that killing water. The sail\'s another matter - but one thing at a time.',
  log:'Bring Tolen the Whittler 6 wood and 3 spiral shells so he can shape you a windsurf board. (Chop the palms; comb the beach for shells.)',
  doneText:'There she is - rails inlaid, deck sanded smooth. Fine board, if I say so. Only she\'s bare, and no board crosses that strait without a sail... and I\'ve none fit for it. The last stormsail on this rock is Nessa\'s, and it\'s locked in the old grinding works BENEATH THE WINDMILL - sealed the season the gear-train jammed. Bring it up and I\'ll step it for you.',
  rw:{gold:20} };
QUESTS.sail={ giver:'burl', title:'The Sail in the Undermill', kind:'special', xpL:220,
  brief:'The stair down? Chained shut, and for good reason - the gear-train siezed a season back and the works went dead, Nessa\'s good stormsail locked in the vault behind the millstone gate. And it wasn\'t rust that stopped it. Something got FOULED in the shaft down there and won\'t lie quiet. Put the thing down, the gear-train frees, the gate grinds up - and the sail\'s yours. Mind yourself in the dark.',
  log:'Descend the Undermill beneath the windmill. Defeat the guardian fouling the works to raise the millstone gate, and carry Nessa\'s stormsail back up.',
  doneText:'You brought it up! Nessa\'s stormsail, whole and dry. Take it to Tolen - or just set it to your board; she\'ll fly true now. Then it\'s Rell you want, and that thing past the breakwater.',
  rw:{surf:true, gold:40} };
QUESTS.tide={ giver:'rell', title:'The Treacherous Tide', kind:'kill', kill:{leviathan:1}, xpL:400,
  brief:'You feel it in the water, past my breakwater - a wrongness, cold and patient. No hull has crossed since it woke, and Windsurf is starving for want of a sail. It is no natural beast; it moves like something bound. Walk the jetty and face it, friend - end this, and you give this whole city back its sea.',
  log:'Confront the Bound Leviathan at the harbor breakwater and end the curse on the strait.',
  doneText:'The water\'s a mill-pond and the boats are already casting off. You didn\'t just kill a monster - you handed a dying city its livelihood. Windsurf will tell this one for a hundred years.',
  rw:{gold:300, item:{potion:3}, xp:{melee:420, archery:420, magic:420}} };
QUESTS.breakers={ giver:'coralie', title:'The Breakers Reopens', kind:'gather', need:{silk:2, shell:4}, xpL:200,
  brief:'The strait\'s open, the guests are trickling back, and I mean to give them a Breakers worth the crossing! But a year shuttered leaves a place threadbare. Bring me two bolts of good silk for fresh linens and four big spiral shells to dress the baths, would you? Do that, and I\'ll not only pay you - I\'ll keep our finest suite made up for YOU, on the house, for as long as you sail these waters.',
  log:'Bring Coralie 2 silk and 4 spiral shells to refit The Breakers. (Silk from traders/the market; shells comb the beaches.)',
  doneText:'Oh, they\'re PERFECT - the linens, the shells along the bath-rim, the whole place breathes again. Here\'s your pay, and here\'s your key: the sea-window suite is yours whenever you want it. Welcome home to the Breakers, friend.',
  rw:{gold:130, room:true, item:{potion:2}, xp:{}} };
QUESTS.roost={ giver:'wrenna', title:'The Screaming Aerie', kind:'special', xpL:440,
  brief:'Since the robed man climbed the Underclimb and never came down, my birds would sooner kill than land. It is no fever, friend - it is a binding, and it sits in a book at the heart of the roost, behind a warden with far too many teeth. The open slope will end you. Take the tunnel up. Burn the thing. Give me back my sky.',
  log:'Take the Underclimb tunnel up into the sealed Roost Heart. Slay the serpent warden, then destroy the cursed tome.',
  doneText:'The screaming stopped, and my old grey hen landed on my shoulder like nothing was ever wrong. You gave a whole island back its sky. There is no thanks big enough - but here is what I have, and it is yours.',
  rw:{gold:320, item:{potion:3}, xp:{melee:440, archery:440, magic:440}} };
QUESTS.thaw={ giver:'bryn', title:'The Weeping Warden', kind:'kill', kill:{frostwarden:1}, xpL:460,
  brief:'Our Warden kept these winters gentle for a hundred years - wept the strait free every spring. Then the robed man walked onto the glacier and the weeping stopped, and the cold has only deepened since. It is bound, not turned. Climb the ice road, break whatever holds it, and give the old thing back its tears. Hearthhold is freezing to death down here.',
  log:'Climb to the Weeping Glacier and free the bound ice Warden to thaw the strait. (Lv 13 - dress warm.)',
  doneText:'Water in the strait and tears on the glacier - you gave us back our guardian and our sea in one stroke. Hearthhold will drink your name warm for a generation. Take this, and our thanks.',
  rw:{gold:340, item:{potion:3}, xp:{melee:460, archery:460, magic:460}} };
QUESTS.audience={ giver:'brea', title:'An Audience with the King', kind:'talk', talkTo:'aldous', xpL:520,
  brief:'You are the one, aren\'t you - the traveler unmaking the old curses, isle by isle. Word of it reaches the throne faster than any ship. His Majesty King Aldous would look upon the curse-breaker himself. He holds court within the Tideglass Palace. Gain the hall and present yourself. One does not keep a grieving king waiting.',
  log:'Enter the Tideglass Palace and present yourself to King Aldous in the throne hall.',
  doneText:'',   // the audience is a scripted scene in the King's own dialogue
  rw:{gold:400, hp:12, item:{elixir:2}, xp:{melee:520, archery:520, magic:520}} };
QUESTS.kitchenrun={ giver:'odo', title:"The Victualler's Errand", kind:'special', xpL:180,
  brief:'You there - steady hands and no livery, perfect. My cart-boy\'s abed with the sweats and the palace kitchen is howling for this crate before the King\'s supper. The gate guards know my crate; carry it up the Processional and they\'ll wave you through the tradesman\'s door. Slip it to Nan the cook and you\'ll have done the crown a quiet favor - and earned the run of the gate besides.',
  log:"Carry Odo's crate up to the Tideglass Palace and deliver it to Nan in the kitchen.",
  doneText:'',   // completes when you hand it to the cook inside
  rw:{gold:60, item:{elixir:1}, xp:{fishing:120}} };
QUESTS.lettuce={ giver:'gale', title:'Rabbits in the Royal Lettuce', kind:'kill', kill:{hare:3}, xpL:150,
  brief:'You there, with the boots and the free afternoon! A warren of hares has decided my lettuce beds are the royal buffet - and the King does love his green. I can\'t chase and weed both. Shoo three of the little thieves off the beds for me - a firm bonk sends them bolting, no harm done - and I\'ll load you with the crispest heads in Aldermere.',
  log:'Shoo 3 garden hares off the lettuce beds by the Drowned Queen\'s Garden.',
  doneText:'Ha! Look at them run! The beds are mine again - for tonight, anyway. Here, straight from the good rows. Tell Nan in the palace kitchen they\'re from Gale, she\'ll know what to do with them.',
  rw:{gold:50, item:{lettuce:3, elixir:1}, xp:{farming:180}} };
QUESTS.wyrm={ giver:'vath', title:'The Wyrm of Mount Kea', kind:'kill', kill:{dragon:1}, xpL:320,
  brief:'You feel the heat off the mountain? A wyrm nests in the fire-heart, deep under the caldera - old, and lately black of heart. It will render Kohana to ash by the next storm, mark me. Climb the ash road, take the fissure DOWN into the Emberdeep, and put the beast down at the bottom. An Emberbinder pays well for a dead dragon.',
  log:'Climb Mount Kea, descend the caldera fissure into the Emberdeep, solve its three locks, and confront the wyrm at the end. (Lv 8+ recommended.)',
  doneText:'Ashwing sleeps easy now, and so does Kohana.',
  rw:{gold:220, item:{potion:3}, xp:{melee:420, archery:420, magic:420}} };
QUESTS.vhunt={ giver:'moli', title:'The Enchanter in the Grove', kind:'kill', kill:{mage:1}, xpL:300,
  brief:'That robed one - Vath, he calls himself - was never a friend to Kohana, eh. Drive him from the grove before he binds another soul, then come and sit, and we will call it square.',
  log:'Confront Vath the Emberbinder in the palm grove and drive him off.',
  doneText:'Slipped you like water through a fist, did he? Aye - his kind always does. But you had him on his knees, and the isle breathes easier for it. He will surface again somewhere; when he does, you will be ready. Take this, with Kohana\'s thanks.',
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
  rw:{gold:90, item:{elixir:1}, xp:{mining:200}} };
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
  rw:{gold:35, item:{crystal:1}, xp:{melee:120, archery:120}} };
QUESTS.orchard={ giver:'willa', title:'Applewood', kind:'gather', need:{apple:5},
  brief:"The old orchard south-east still fruits - nobody's picked it since the king went hollow. Five good apples and I'll bake you something worth the walk. Mind the branches; they drop hard.",
  log:'Pick 5 apples in the Old Orchard.',
  doneText:"Look at the color on these! The oven's already hot. Here - first loaves are yours, and the orchard knows your hands now.",
  rw:{item:{bread:2}, gold:12, xp:{farming:150}} };
QUESTS.shells={ giver:'nia', title:'Seven Spirals (well, four)', kind:'gather', need:{shell:4},
  brief:"Pip found a SHELL and it's the best thing I own. I need more! The beach hides spiral ones - bring me four and I'll trade you my second-best treasure. It's gold. Don't tell Maren where I got it.",
  log:'Gather 4 spiral shells from the beaches.',
  doneText:"FOUR! Look how they curl! Here - treasure for treasure. That's the rule of the beach.",
  rw:{gold:15, item:{potion:1}, xp:{fishing:80}} };
QUESTS.pearlq={ giver:'finn', title:'The One That Got Away', kind:'gather', need:{pearl:1},
  brief:"Thirty years I've fished this bay, and once - ONCE - I pulled up a pearl the size of a thumbnail. Dropped it in the drink showing off to Willa. Bring me one and I'll pay like a man buying back his youth.",
  log:'Catch a pearl while fishing (fishing skill improves the odds).',
  doneText:"There she is… no, keep your coin ready - HERE'S yours. Worth every piece to hold one again.",
  rw:{gold:45, hp:5, xp:{fishing:200}} };
QUESTS.remember={ giver:'orin', title:'The Island Remembers', kind:'gather', need:{page:3},
  brief:"Three texts survive on this isle: my tower's Ember Wars, Maren's Songs of the Well, and a farmer's almanac gathering dust in the barn. Read them, copy a page from each, and I'll pay you in something better than gold - understanding. Also crystals.",
  log:'Read the books inside the tower, Maren\'s cottage, and the barn (step inside and Read).',
  doneText:"The Ember Wars… the Well… the Almanac's warning. It all points to the same truth: this island forgives, but it never forgets. Take these - they remember being warm.",
  rw:{item:{crystal:2}, gold:25, xp:{magic:220}} };
QUESTS.embers={ giver:'kell', title:'Embers for the Watch', kind:'gather', need:{crystal:3},
  brief:"Winter watches are long and the braziers burn cold. Ember crystals hold heat like a grudge - three of them would warm the watchtower till spring. Mine the ruin-stone at Barrowfield or the Wolfcrag.",
  log:'Mine 3 ember crystals from stone near Barrowfield or Wolfcrag.',
  doneText:"Warm at last. The night watch drinks to you tonight - and Greyharbor pays its debts.",
  rw:{gold:60, item:{elixir:1}, xp:{magic:200, mining:150}} };
QUESTS.mossbrew={ giver:'moss', title:'A Hermit\'s Kindness', kind:'gather', need:{mushroom:4},
  brief:"Visitors! Rare as dry socks out here. The blackpine bluecaps glow kinder than the isle's - four of them and I'll share the batch I'm brewing. A hermit's word is oak.",
  log:'Gather 4 bluecap mushrooms in the Blackpine Reach for Moss.',
  doneText:"Kind hands, kind harvest. Here - three bottles, brewed slow. And drink this thimble now: my quickroot draught. Your legs will remember it when one dodge is not enough.",
  rw:{item:{potion:3}, gold:20, xp:{farming:160}, dash2:true} };
ITEMS.relic = {name:'Stormwatch Relic', desc:'+4 damage to every attack. Torn from the Peak.'};
ITEMS.fang = {name:"Greymaw's Fang", desc:'+8 melee damage. Pried from the Alpha\'s jaw.'};
// -- side-quest reward gear: a consumable and three always-on trinkets, so
//    optional work pays in more than coin --
ITEMS.elixir = {name:'Greater Tonic', desc:'Restores 60 HP - twice a common tonic.', use:'heal', heal:60};
ITEMS.warcharm = {name:'Battleworn Charm', desc:'+5 damage to every attack.'};
ITEMS.boots = {name:'Trailblazer Boots', desc:'Sure-footed and swift - you move noticeably faster.'};
ITEMS.wardstone = {name:"Warden's Wardstone", desc:'Turns aside 2 damage from every blow you take.'};
ITEMS.crate = {name:"Victualler's Crate", desc:'Provisions for the palace kitchen. Do not eat the evidence.'};
QUESTS.alpha = { giver:'kell', title:'The Alpha of Wolfcrag', kind:'kill', kill:{alpha:1},
  brief:"The elites answer to something. Greymaw - a wolf the size of a cart, eyes like coals. It dens high on Wolfcrag. Kill it, and the packs scatter for a generation. This is no bounty, adventurer. This is a hunt.",
  log:'Slay Greymaw, the Alpha, atop Wolfcrag Highlands.',
  doneText:"By the tides... you actually did it. The howling stopped last night - now I know why. Greyharbor will sing of this. Take the purse, hero. You've earned the name.",
  rw:{gold:250, item:{potion:4}, xp:{melee:400, archery:400, magic:400}} };

/* =====================================================================
   ACT IV - "The Enchanter's Tide" resolves. The King's audience sets you
   after Vath, and after the truth of his lost son. The pendant is a memory-
   ward; the Woodworker is the enchanted prince; you are the first mate who
   saved him from the wreck and carried the warning through thirty years of
   fog. Break Vath to loose the binding, wake the prince, bring him home.
   ===================================================================== */
QUESTS.pendant = { giver:'orin', title:'The Medallion', kind:'talk', talkTo:'orin', xpL:340,
  brief:"The King's charge rings in your ears - find Vath, find his son. And that pendant at your throat unsettled him as it once unsettled Maren. Sail back to Emberwick and lay it before Sage Orin; if any hand can read old work, it is his.",
  log:'Sail to Emberwick and show the pendant to Sage Orin at his tower.',
  doneText:"...This is no ornament. It is a memory-ward - a working meant to hold a mind whole against exactly the unmaking Vath deals. Someone wove a warning into it and keyed it to YOU, that you might carry it through the fog when all else was taken. And it is calling - to something bound and sleeping, close by. To someone. The Woodworker. Go to him. Only the breaking of Vath will loose what holds him.",
  rw:{gold:40, mp:6, xp:{magic:260}} };
QUESTS.enchanter = { giver:'orin', title:"The Enchanter's Tide", kind:'kill', kill:{mage:1}, xpL:620,
  brief:"Show the Woodworker the pendant. The song he hums is the royal anthem; the star he stacks on every woodpile is the star at your throat. The ward will crack his binding - and Vath, feeling his life's work come undone, will come for you both. End him, and the prince is free.",
  log:'Show the Woodworker the pendant on Emberwick, then defeat Vath the Emberbinder when he comes.',
  doneText:'',   // resolved by bindVath()
  rw:{gold:200, item:{elixir:2}, xp:{melee:400, magic:400, archery:400}} };
QUESTS.homecoming = { giver:'woody', title:'Homecoming', kind:'talk', talkTo:'aldous', xpL:520,
  brief:"The prince is awake, and remembers - the ship, the storm, the pendant pressed between your hands, and the father who never stopped waiting. Take him home across the water. King Aldous has grieved thirty years; let him grieve no longer.",
  log:'Bring word to King Aldous in the Tideglass Palace, Aldermere.',
  doneText:'',   // resolved by the palace coda scene
  rw:{gold:300, hp:20, item:{elixir:3}, xp:{melee:300, archery:300, magic:300}} };

// Vath's last stand: he descends on the Emberwick green the moment the ward
// cracks the prince's binding. A proper boss (bar + boss music via bigBoss),
// but no HP sponge - the rebalanced numbers keep him decisive.
function spawnFinalVath(){
  if(G.worldId!=='isle') return null;
  if(G.mobs.some(m=>m.kind==='mage' && m.finalVath && !m.dead)) return null;
  const base=[Math.round(ZONES.village.x)+3, Math.round(ZONES.village.y)-7];
  const sp=findOpenNear(base[0], base[1], 9) || base;
  const m=spawnMob('mage', sp[0], sp[1]);
  if(!m) return null;
  m.finalVath=true; m.bigBoss=true; m.title='VATH THE EMBERBINDER';
  m.lvl=13; m.maxhp=700; m.hp=700; m.dmg=30; m.speed=2.9; m.aggro=16;
  m.state='chase'; m.noAggroT=0; m.hx=sp[0]; m.hy=sp[1]; m.respawnT=-1;
  return m;
}
// Beaten, Vath is bound by his own compulsion - sealed, not slain, vowing return.
function bindVath(m){
  m.bound=1; m.dead=true; m.respawnT=-1; m.state='idle'; m.hp=1;
  P.story=P.story||{}; P.story.vathBound=1; P.story.act=Math.max(P.story.act||1,4);
  if(Snd.boss) Snd.boss(); G.shake=1.0; G.slowmo=1.2;
  shockwave(m.x,m.y,'rgba(199,123,255,0.95)',110);
  for(let i=0;i<40;i++){ const a=Math.random()*TAU, s=rnd(1,5);
    G.parts.push({x:m.x,y:m.y-0.4,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:rnd(0.8,1.8),color:'#c77bff',size:rnd(2,4),grav:-0.05}); }
  banner('VATH IS BOUND','SEALED BY HIS OWN COMPULSION');
  if(typeof updateBossUI==='function') updateBossUI();
  setTimeout(()=>toast('<i>You cut the violet cords one by one - and the last, freed, whips back and takes HIM. His own leash closes on his own throat.</i> <b style="color:#c9a0ff">"Clever. Cruel. You would have woven a fine binding of your own."</b> <i>The enchantment folds him into the old standing stone.</i> <b style="color:#c9a0ff">"No stone holds forever, first mate. I will thaw. I will come back - for you, and for all of you."</b> <i>Then quiet, and violet light dying in the grass.</i>',11000),400);
  setTimeout(()=>toast('Behind you the <b>Woodworker</b> sways, a hand to his head - like a man surfacing from deep water. <b style="color:var(--ember)">Speak with him.</b>',7000),9200);
  // credit the kill quest cleanly (death was intercepted). Delayed so the bind
  // banner is read before the QUEST COMPLETE banner lands.
  setTimeout(()=>{ if(qs('enchanter')==='active'){ P.prog.enchanter=1; completeQuest('enchanter'); } }, 3000);
  if(typeof autoSave==='function') autoSave();
}
// reload safety: if the last hunt is underway on Emberwick and Vath isn't bound
// yet, make sure he's back on the green when you return.
function ensureFinalVath(){
  if(G.worldId!=='isle') return;
  if(qs('enchanter')==='active' && P.story && P.story.vathCame && !P.story.vathBound){
    if(!G.mobs.some(m=>m.kind==='mage' && m.finalVath && !m.dead)) spawnFinalVath();
  }
}

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
  // Rendered at 5x native resolution (crisp at landmark scale) and cropped to
  // the building base (height 200, not 224) so the sprite's bottom edge is the
  // wall base - it seats on the ground instead of floating. Coords below are 1x.
  SPR.castle=makeCanvas(1500,1000,(g)=>{ g.scale(5,5);
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
    // the Duchess's banner on the keep
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
  // Greater Tonic: a fatter, brighter potion
  ICONS.elixir=makeCanvas(40,40,(g)=>{
    g.fillStyle='rgba(230,240,255,0.5)'; g.beginPath(); g.arc(20,23,11,0,TAU); g.fill(); g.fillRect(16,6,8,12);
    g.fillStyle='#7fd4ff'; g.beginPath(); g.arc(20,24,9,0,TAU); g.fill();
    g.fillStyle='#c9f0ff'; g.beginPath(); g.arc(20,24,9,Math.PI*1.05,Math.PI*1.6); g.fill();
    g.fillStyle='#8a6238'; g.fillRect(15,4,10,5);
    g.fillStyle='rgba(255,255,255,0.8)'; g.beginPath(); g.arc(16,19,2.4,0,TAU); g.fill(); });
  // Battleworn Charm: a cracked crimson gem on a cord
  ICONS.warcharm=makeCanvas(40,40,(g)=>{
    g.strokeStyle='#8a6238'; g.lineWidth=2; g.beginPath(); g.arc(20,6,8,Math.PI*0.15,Math.PI*0.85,true); g.stroke();
    g.fillStyle='#c8354a'; g.beginPath(); g.moveTo(20,10); g.lineTo(30,22); g.lineTo(20,36); g.lineTo(10,22); g.closePath(); g.fill();
    g.fillStyle='#ff6a7a'; g.beginPath(); g.moveTo(20,14); g.lineTo(26,22); g.lineTo(20,31); g.lineTo(14,22); g.closePath(); g.fill();
    g.strokeStyle='rgba(40,8,12,0.7)'; g.lineWidth=1.3; g.beginPath(); g.moveTo(17,17); g.lineTo(22,28); g.stroke(); });
  // Trailblazer Boots
  ICONS.boots=makeCanvas(40,40,(g)=>{
    g.fillStyle='#6e4a2b'; g.beginPath(); g.moveTo(12,8); g.lineTo(20,8); g.lineTo(20,24); g.lineTo(31,24); g.lineTo(31,32); g.lineTo(12,32); g.closePath(); g.fill();
    g.fillStyle='#4a3120'; g.fillRect(12,30,21,4);
    g.strokeStyle='rgba(20,12,6,0.7)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(12,8); g.lineTo(20,8); g.lineTo(20,24); g.lineTo(31,24); g.lineTo(31,32); g.lineTo(12,32); g.closePath(); g.stroke();
    g.fillStyle='#c9a24e'; g.fillRect(13,12,7,2.4); g.fillRect(13,16,7,2.4); });
  // Victualler's Crate: a roped wooden crate
  ICONS.crate=makeCanvas(40,40,(g)=>{
    g.fillStyle='#8a5a30'; g.fillRect(8,10,24,24);
    g.fillStyle='#a06a38'; g.fillRect(8,10,24,4); g.fillRect(8,20,24,3);
    g.strokeStyle='rgba(40,24,10,0.8)'; g.lineWidth=1.6; g.strokeRect(8,10,24,24);
    g.strokeStyle='#5a3a1c'; g.lineWidth=1.3; g.beginPath(); g.moveTo(8,10); g.lineTo(32,34); g.moveTo(32,10); g.lineTo(8,34); g.stroke();
    g.strokeStyle='#c9a24e'; g.lineWidth=2; g.beginPath(); g.moveTo(20,8); g.lineTo(20,36); g.stroke(); });
  // Warden's Wardstone: a rune-carved shield-stone
  ICONS.wardstone=makeCanvas(40,40,(g)=>{
    g.fillStyle='#6f7a86'; g.beginPath(); g.moveTo(20,5); g.lineTo(33,11); g.lineTo(31,26); g.quadraticCurveTo(20,36,9,26); g.lineTo(7,11); g.closePath(); g.fill();
    g.fillStyle='#9fb0bd'; g.beginPath(); g.moveTo(20,9); g.lineTo(29,13); g.lineTo(27,24); g.quadraticCurveTo(20,31,13,24); g.lineTo(11,13); g.closePath(); g.fill();
    g.strokeStyle='#3a5a80'; g.lineWidth=2; g.beginPath(); g.moveTo(20,13); g.lineTo(20,25); g.moveTo(15,18); g.lineTo(25,18); g.stroke();
    g.strokeStyle='rgba(20,28,36,0.7)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(20,5); g.lineTo(33,11); g.lineTo(31,26); g.quadraticCurveTo(20,36,9,26); g.lineTo(7,11); g.closePath(); g.stroke(); });
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
  if(b.sail){
    bumpStat('chests');
    P.story=P.story||{}; P.story.haveSail=1;
    shockwave(b.x,b.y,'rgba(200,225,255,0.9)',52); burst(b.x,b.y-0.5,'#dce8ff',18,2.6); Snd.levelup&&Snd.levelup();
    if(qs('sail')==='active'){
      completeQuest('sail');   // grants the windsurf (rw.surf) and marks the objective done
    } else if(!(P.unlocked && P.unlocked.surf)){
      P.unlocked=P.unlocked||{}; P.unlocked.surf=true;
      banner('THE STORMSAIL IS YOURS','THE BOARD IS WHOLE');
      toast('<b style="color:var(--ember)">Windsurf board earned!</b> Nessa\'s stormsail steps true to your board - walk onto the water and ride it, at nearly double speed.',6500);
    } else {
      giveGold(60); give('elixir',1);
      toast('A fine old stormsail, but you\'ve a board that already flies. Rolled and stowed - it\'ll fetch a good price ashore.',5200);
      setTimeout(autoSave,300); return;
    }
    // the Leviathan hunt opens the moment you can cross the light water
    if(qs('tide')!=='done' && !P.quests.tide) P.quests.tide='avail';
    setTimeout(()=>toast('Carry the sail up and see <b>Rell the Harbormaster</b> - he\'ll send you at the Leviathan now. Windsurf out past the breakwater onto the light water when you\'re ready.',6800),2600);
    setTimeout(autoSave,300);
    return;
  }
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
    // The first fingerprint of the enchanter: someone paid to have these ribbons
    // stolen - and it grounded Corvo's ferry. A pattern the player won't see yet.
    if(!P.story.vathNamed){ P.story.vathNamed=1;
      setTimeout(()=>toast('Tucked beneath the silk: a <b>coin older than the kingdom</b>. A cornered brigand spits as you pass: \u201cPaid us in old coin, that one - a <b>robed fellow</b>, soft-spoken, violet thread at his cuffs. Said it was only ribbons. What\'s the harm in a few ribbons?\u201d',9500),1600); }
    return;
  }
  if(b.emberking){
    giveGold(rndi(150,230)); give('potion',2); give('crystal',1);
    if(!(P.unlocked && P.unlocked.dash2)){
      P.unlocked=P.unlocked||{}; P.unlocked.dash2=true;
      banner("THE EMBER KING'S GIFT",'DOUBLE DASH - CHAIN A SECOND DODGE');
      setTimeout(()=>toast('The hoard’s heart is a coil of ember-thread that winds up your legs and settles. <b style="color:#c9b0ff">Double Dash learned!</b> Dash again in the instant after the first - two darts, quick as breath.',6800),400);
    } else {
      banner("THE EMBER KING'S HOARD",'GOLD, TONICS, AND EMBER-GLASS');
    }
    shockwave(b.x,b.y,'rgba(255,150,80,0.9)',60); burst(b.x,b.y-0.5,'#ffb060',22,2.8); Snd.levelup();
    setTimeout(autoSave,300);
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
  if(G.worldId==='isle'){
    if(qs('king')!=='done'){
      toast('Captain Brant eyes the northern ruins. <b>"Strait\'s cursed while the Hollow King stands. Fell him first."</b>',4800);
      return;
    }
    if(qs('wreck')!=='done'){
      toast('Captain Brant thumps the cracked hull. <b>"She won\'t swim till she\'s patched - bring me twelve wood and I\'ll mend her."</b> Speak with him here at the dock.',5800);
      return;
    }
  }
  // Windsurf is walled off by the killing tide until you calm the strait.
  if(G.worldId==='wind' && !(P.story && P.story.tideCalm)){
    toast('The strait past the breakwater churns like a cauldron - no hull could live in it, and you came down here by sail with no way back up. <b>Calm the water first</b> and the ferry can moor.',5200);
    return;
  }
  // Stormreach is only reachable by sea, so its berth is always a ferry - prompt for a destination
  if(G.worldId==='reach'){ boatMenu(); return; }
  // once the seas are calm, any boat is a ferry - pick a destination
  if(P.story && P.story.tideCalm && G.worldId!=='isle'){ boatMenu(); return; }
  // default single-hop routing before the archipelago reopens
  sailTo(G.worldId==='east' ? 'main' : G.worldId==='isle' ? 'main' : 'isle');
}
function sailTo(dest, msg){
  if(sailing) return; sailing=true;
  const fade=document.getElementById('fadeOv'); if(fade) fade.style.opacity=1; Snd.splash();
  if(msg) toast(msg,3000);
  setTimeout(()=>{ switchWorld(dest); setTimeout(()=>{ if(fade) fade.style.opacity=0; sailing=false; },100); },780);
}
function boatMenu(){
  // once the seas are calm every dock is a ferry hub - sail to any known isle
  const all=[['Sail home to Barik','main'],['Sail to the Sunward Isle','east'],
             ['Sail to Windsurf Isle','wind'],['Sail to Stormreach','reach'],
             ['Sail to the Aerie Isle','aerie'],['Sail to the Frozen Isle','frost'],
             ['Sail to Aldermere, the Capital','crown']];
  const dests=all.filter(([lbl,dst])=>dst!==G.worldId);
  dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='The Ferry';
  const pg=document.getElementById('dportrait').getContext('2d');
  pg.fillStyle='#20160c'; pg.fillRect(0,0,72,72);
  pg.fillStyle='#8f6a3e'; pg.beginPath(); pg.moveTo(12,44); pg.quadraticCurveTo(36,60,60,44); pg.lineTo(52,38); pg.quadraticCurveTo(36,48,20,38); pg.closePath(); pg.fill();
  pg.strokeStyle='#4f3a24'; pg.lineWidth=3; pg.beginPath(); pg.moveTo(36,38); pg.lineTo(36,14); pg.stroke();
  pg.fillStyle='#e8e0d0'; pg.beginPath(); pg.moveTo(36,16); pg.quadraticCurveTo(50,22,36,34); pg.closePath(); pg.fill();
  setDialog('“Calm seas at last, friend - the whole archipelago\'s open again. Where to?”',
    dests.map(([lbl,dst])=>({label:lbl, fn:()=>{ closeDialog(); sailTo(dst); }}))
      .concat([{label:'Stay ashore',ghost:true,fn:closeDialog}]));
}
function snapshotWorld(){
  WORLDS[G.worldId]={map:G.map,solid:G.solid,variant:G.variant,nodes:G.nodes,decor:G.decor,
    plots:G.plots,npcs:G.npcs,mobs:G.mobs,foam:G.foam,crows:G.crows,forgePos:G.forgePos,
    decals:G.decals,cat:G.cat,critters:G.critters,base:mapBase};
}
function switchWorld(id){
  const prevWorld=G.worldId;
  G._flying=0; G._flyUntil=0;   // arriving anywhere clears the in-flight lock, so a throw mid-flight can never strand the dragon/parachute
  snapshotWorld();
  G.projs.length=0; G.parts.length=0; G.floats.length=0; G.fogs.length=0; G.fireflies.length=0;
  const def=WORLD_DEFS[id];
  MAPW=def.W; MAPH=def.H; SEED=def.seed; ZONES=def.zones;
  if(WORLDS[id]){
    const w=WORLDS[id];
    G.map=w.map; G.solid=w.solid; G.variant=w.variant; G.nodes=w.nodes; G.decor=w.decor;
    G.plots=w.plots; G.npcs=w.npcs; G.mobs=w.mobs; G.foam=w.foam; G.crows=w.crows;
    G.forgePos=w.forgePos; G.decals=w.decals; G.cat=w.cat; G.critters=w.critters||[]; mapBase=w.base;
    // the minimap image is rebuilt for this world by drawMinimap's self-heal (it tracks
    // mapBaseWorld), so a stale/failed map canvas can never keep showing the wrong world
  } else {
    G.map=new Uint8Array(MAPW*MAPH); G.solid=new Uint8Array(MAPW*MAPH); G.variant=new Uint8Array(MAPW*MAPH);
    G.nodes=[]; G.decor=[]; G.plots=[]; G.npcs=[]; G.mobs=[]; G.foam=[]; G.crows=[];
    G.decals=[]; G.cat=null; G.critters=[]; G.forgePos=null;
    def.gen();
  }
  G.worldId=id;
  if(typeof syncMapUI==='function') syncMapUI();   // seal/unseal minimap+map for cloud worlds at once
  P.x=def.spawn.x; P.y=def.spawn.y; P.dir={x:1,y:0}; P.fishing=null;
  if(id==='main' && prevWorld==='east'){
    // sailing home from the Sunward Isle lands you back at Captain Corvo's cove
    // (his sloop, far south-east), not Greyharbor's dock clear across the map
    const sp=findOpenNear(330,244,10) || [330,244];
    P.x=sp[0]+0.5; P.y=sp[1]+0.5; P.dir={x:-1,y:0};
  }
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  if(id==='main') award('globetrotter');
  // Act IV: coming back to Emberwick with the last hunt underway - make sure Vath
  // is on the green if you'd already drawn him out and left mid-fight.
  if(id==='isle' && typeof ensureFinalVath==='function') ensureFinalVath();
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
    // Safety net: nobody should leave the tutorial isle without the three basics.
    // If you somehow sailed off missing the sword, axe or pickaxe, hand them over.
    // (Early-sail already gets a full kit above, so skip it in that case.)
    if(prevWorld==='isle' && !P.earlyKit){
      P.unlocked=P.unlocked||{}; P.tools=P.tools||{axe:0,pick:0};
      const got=[];
      if(!P.unlocked.melee){ P.unlocked.melee=true; P.swordTier=Math.max(P.swordTier||0,1); got.push('a sword'); }
      if(!P.kit || !(P.tools.axe>0)){ P.kit=true; P.tools.axe=Math.max(P.tools.axe||0,1); if(!got.includes('an axe')) got.push('an axe'); }
      if(!(P.tools.pick>0)){ P.kit=true; P.tools.pick=Math.max(P.tools.pick||0,1); got.push('a pickaxe'); }
      if(got.length){ if(typeof buildHotbar==='function') buildHotbar(); refreshUI();
        setTimeout(()=>toast('You check your pack on the crossing - the isle sent you off with '+got.join(', ')+'. Enough to make an honest start on Barik.',6000),1500); }
    }
  }
  if(id==='main' && !P.quests.bounty){ P.quests.bounty='avail';
    setTimeout(()=>toast('A hooded figure watches from the Warden\'s post. <b style="color:var(--ember)">Warden Kell</b> has work.',5200),1500); }
  if(id==='east') for(const q3 of ['hunt1','wyrm']) if(!P.quests[q3] && QUESTS[q3]) P.quests[q3]='avail';
  if(id==='east'){
    // the wyrm fight now happens deep inside Mount Kea (the Emberdeep), so when you
    // climb back out with the hunt underway, make sure Vath has surfaced in the
    // grove and left the village - spawnMobsEast only runs on the isle's first gen.
    if(P.mageHuntStarted){ const vi=G.npcs.findIndex(n=>n.id==='vath'); if(vi>=0) G.npcs.splice(vi,1); }
    if(qs('vhunt')==='active' && (P.prog.vhunt||0)<1 && !G.mobs.some(m=>m.kind==='mage' && !m.dead)){
      const GR=EAST_ZONES.grove, sp=findOpenNear(Math.round(GR.x), Math.round(GR.y), 8) || [GR.x, GR.y];
      const mg=spawnMob('mage', sp[0], sp[1]); if(mg){ mg.state='idle'; mg.hx=sp[0]; mg.hy=sp[1]; mg.respawnT=-1; }
    }
  }
  if(id==='wind'){
    const hasBoard = !!(P.unlocked && P.unlocked.surf);
    // you must earn a windsurf before Rell will send you at the Leviathan - the
    // beast lives on the water, past the reach of any jetty. Tolen shapes boards.
    if(!hasBoard && qs('board')!=='done' && !P.quests.board) P.quests.board='avail';
    if(hasBoard && qs('tide')!=='done' && !P.quests.tide) P.quests.tide='avail';
    // once the strait is calm, Coralie can finally reopen the Breakers properly
    if(P.story && P.story.tideCalm && qs('breakers')!=='done' && !P.quests.breakers) P.quests.breakers='avail';
    if(P.story && P.story.tideCalm) updateWindFolkMood();
    if(!P.prog.windSeen){ P.prog.windSeen=1; }   // arrival narration removed - let the isle speak for itself
  }
  if(id==='aerie'){
    if(qs('roost')!=='done' && !P.quests.roost) P.quests.roost='avail';
    if(!P.prog.aerieSeen){ P.prog.aerieSeen=1; }
  }
  if(id==='frost'){
    if(qs('thaw')!=='done' && !P.quests.thaw) P.quests.thaw='avail';
    if(P.story && P.story.frostFreed) updateFrostFolkMood();
    if(!P.prog.frostSeen){ P.prog.frostSeen=1; }
  }
  // Dungeons keep their mystery, but a single atmospheric hint on first entry
  // points the way without solving anything - a compass, not a walkthrough.
  if(id==='frostdeep' && !P.prog.deepSeen){ P.prog.deepSeen=1;
    setTimeout(()=>toast('<i>Three frost-locks bar the deep gate.</i> Somewhere in the pillar-warren stand three levers - throw them all, and the way opens.',7000),1400); }
  if(id==='eastdeep' && !P.prog.emberSeen){ P.prog.emberSeen=1;
    setTimeout(()=>toast('<i>Three sealed firegates lie ahead.</i> The old wards yield in turn: tread every warm plate, drain the lava channel, then wake the runes in their carved order.',7500),1400); }
  if(id==='aeriedeep' && !P.prog.underSeen){ P.prog.underSeen=1;
    setTimeout(()=>toast('<i>Bone gates and sigil-locks guard the Warden.</i> Set the bone-plates first; then walk the floor-sigils in the order they were struck.',7500),1400); }
  if(id==='frostvault' && !P.prog.vaultSeen){ P.prog.vaultSeen=1;
    setTimeout(()=>toast('<i>The ice gives no purchase - once you slide, only a footing-stone will stop you.</i> Levers open the gates; the last hall wants all three wards pulled.',7500),1400); }
  if(id==='crown'){
    // the King grants an audience once you've broken at least one of Vath's
    // curses on the isles (vathMet) - the herald offers it in the plaza.
    if(P.story && P.story.vathMet && !(P.story.act>=3) && !P.quests.audience) P.quests.audience='avail';
    // the palace gate is guarded; the kitchen-run delivery is how you earn the
    // run of the gate. Available from your first day in the capital.
    if(qs('kitchenrun')!=='done' && !P.quests.kitchenrun && !(P.story&&P.story.kingTold)) P.quests.kitchenrun='avail';
    if(qs('lettuce')!=='done' && !P.quests.lettuce) P.quests.lettuce='avail';
    if(P.story && P.story.kingTold) updateCrownFolkMood();
    if(!P.prog.crownSeen){ P.prog.crownSeen=1; }
  }
  Snd.quest();   // arrival chime (island-name intro banner removed by request)
  updateQuestUI(); refreshUI();
  setTimeout(autoSave,400);
}

/* ---------- dodge roll ---------- */
function tryRoll(){
  if(P.dead || G.state!=='play' || dlg.open || G.interior) return;
  if(!(P.unlocked && P.unlocked.dash)){
    // dash is taught by a mage-tower's scrying orb - nudge the player there
    if(!P._dashNagT || G.time>P._dashNagT){ P._dashNagT=G.time+4;
      toast('You have no trained footwork yet - a <b>mage tower’s orb</b> teaches the <b>dash</b>.',3600); }
    return;
  }
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

