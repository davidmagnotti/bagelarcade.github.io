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
  castle:   {x:110,y:300, r:14, name:'Barik Keep', lv:[1,1]},
  spire:    {x:196,y:332, r:8,  name:"Aelin's Spire", lv:[2,4]},
  hollow:   {x:162,y:148, r:6,  name:"Thieves' Hollow", lv:[7,7]},
  desert:   {x:300,y:112, r:32, name:'Sunscour Valley', lv:[11,14]},
  undermaw: {x:212,y:196, r:8,  name:'The Undermaw', lv:[5,7]},
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
const FROSTDEEP_ZONES = { // the ice-dungeon beneath the Frozen Isle
  entry: {x:44, y:107, r:6,  name:'The Frostgate',     lv:[13,15]},
  ice:   {x:42, y:66,  r:16, name:'The Long Drift',    lv:[13,15]},
  boss:  {x:44, y:22,  r:11, name:'The Frozen Heart',  lv:[15,15]}
};
const FROSTVAULT_ZONES = { // THE GLACIER VAULT - a 5-room ice-puzzle dungeon under
  entry:  {x:40, y:84, r:8,  name:'The Icefall Landing', lv:[14,16]}, // the bear's old den
  slide1: {x:40, y:66, r:11, name:'The Frostgate Hall',  lv:[14,16]}, // lever -> gate
  glide:  {x:41, y:47, r:12, name:'The Pillar Hall',     lv:[15,17]}, // weave the pillars to the lever
  wards:  {x:40, y:28, r:11, name:'The Three Wards',     lv:[15,17]}, // pull-all-three lever puzzle
  hoard:  {x:44, y:10, r:12, name:'The Hoarfrost Hoard', lv:[16,16]}  // the reward chamber
};
const SKY_ZONES = { // THE CLOUDREACH - a tiny cloud-perch hub; Ashwing flies you up, and the
  // Wind-Lost Bird's rainbow road is the real journey (and the only way down).
  landing: {x:32, y:42, r:7,  name:'Cloudfall Landing', lv:[9,10]},  // where the dragon sets you down
  leap:    {x:18, y:28, r:5,  name:'The Leap',          lv:[9,10]}   // stormsail jump-off -> Windsurf (won on the Rainbow Road)
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
  // the four lower chambers sit +47 from where they used to, to open room for the
  // two new island crossings (the Floating Isles + the Bat Roost) before the dragon.
  entry:   {x:40, y:131, r:8,  name:'The Emberthroat',     lv:[6,8]},
  font:    {x:40, y:113, r:11, name:'The Ember Font',      lv:[6,8]},   // visit-all plate puzzle
  causeway:{x:40, y:94,  r:11, name:'The Sunken Causeway', lv:[7,9]},   // lever / lava-drain puzzle
  glyph:   {x:40, y:75,  r:11, name:'The Warding Locks',   lv:[7,9]},   // button-order puzzle
  isles:   {x:40, y:56,  r:12, name:'The Floating Isles',  lv:[8,9]},   // hop the stationary isles, ride the last (turning) one
  roost:   {x:40, y:34,  r:15, name:'The Bat Roost',       lv:[8,9]},   // a wide isle-field crossed under bat assault
  rest:    {x:40, y:10,  r:14, name:"Ashwing's Rest",      lv:[9,9]}    // the dragon, at the very end
};
const MILLDEEP_ZONES = { // THE UNDERMILL - the grinding works beneath the Windsurf windmill
  entry: {x:20, y:95, r:6,  name:'The Millstair',         lv:[0,0]},
  works: {x:20, y:6,  r:5,  name:'The Grinding Floor',    lv:[0,0]}, // the guardian (boss arena, y4-8)
  vault: {x:20, y:2,  r:4,  name:"The Sailwright's Vault", lv:[0,0]}  // Nessa's stormsail + the way up (behind the gate)
};
const UNDERMAW_ZONES = { // THE UNDERMAW - a four-trial gauntlet under the Barik hills
  maw:  {x:22, y:185, r:6,  name:'The Maw',          lv:[5,6]},   // the entry
  den:  {x:22, y:23,  r:9,  name:"The Stalker's Den", lv:[6,7]},   // the boss fight
  hoard:{x:22, y:5,   r:5,  name:'The Deep Hoard',    lv:[0,0]}      // the reward alcove past the door
};
const DROWNED_ZONES = { // THE DROWNED VAULT - the flooded harbor-vault beneath Barik (grants Dive)
  entry:  {x:36, y:88, r:7,  name:'The Sunken Stair',  lv:[3,5]},
  gallery:{x:36, y:56, r:12, name:'The Flooded Gallery', lv:[4,6]},  // a plank causeway over deep water, flanked by drowned dead
  vault:  {x:36, y:20, r:12, name:'The Tide-Lock Vault', lv:[6,7]}   // the Drowned Minotaur + the diving-charm chest
};
const GALEDEEP_ZONES = { // THE GALE SPIRE - a wind-scoured shaft beneath Windsurf (grants the Swiftstep charm (quicker dash))
  entry: {x:36, y:88, r:7,  name:'The Windward Stair', lv:[4,6]},
  updraft:{x:36, y:54, r:12, name:'The Updraft Hall',  lv:[5,7]},   // gale-swept gaps you dash across
  eye:   {x:36, y:20, r:12, name:'The Eye of the Gale', lv:[7,8]}   // the Storm-Wraith + the swiftstep chest
};
const EMBERGIFT_ZONES = { // THE ASHEN FORGE - a lava-worked vault under Mount Kea (grants the flame snare)
  entry:  {x:36, y:88, r:7,  name:'The Cinder Stair',  lv:[6,8]},
  causeway:{x:36, y:54, r:12, name:'The Lava Causeway', lv:[7,9]},  // basalt path between fire-pits
  forge:  {x:36, y:20, r:12, name:'The Ashen Forge',   lv:[8,10]}   // the Ash-Scorpion + the flame-snare chest
};
const STORMTEMPLE_ZONES = { // THE STORM TEMPLE - a lightning-wracked temple on the Cloudreach (grants the double dash)
  entry:  {x:36, y:88, r:7,  name:'The Thunderstair',  lv:[9,11]},
  nave:   {x:36, y:54, r:12, name:'The Storm Nave',    lv:[10,12]}, // strike-lanes you double-dash between
  sanctum:{x:36, y:20, r:12, name:'The Stormheart',    lv:[11,13]}  // the Storm-Eye + the twin-dash chest
};
const TIDEWARD_ZONES = { // THE TIDEWARD CRYPT - the Emberwick capstone, opened only with all four gifts
  entry:  {x:40, y:96, r:8,  name:'The Founders\' Stair', lv:[12,14]},
  ford:   {x:40, y:74, r:12, name:'The Sunken Ford',    lv:[12,14]},   // DIVE across
  span:   {x:40, y:54, r:12, name:'The Broken Span',     lv:[13,15]},  // a 2-tile gap the base dash clears
  briar:  {x:40, y:36, r:12, name:'The Emberbriar Gate', lv:[13,15]},  // FLAME SNARE the wardthorns
  chasm:  {x:40, y:18, r:14, name:'The Tideward Vault',  lv:[14,16]}   // DOUBLE DASH the chasm -> the guardian
};
var PALACE_BAR=null;   // continuous screen-space collision line for the palace wall (set in placeObjectsCrown)
const CROWN_ZONES = { // ALDERMERE - the royal capital, grandest of the realms
  dock:    {x:36, y:150, r:7,  name:'Kingsferry Quay', lv:[0,0]},
  harbor:  {x:52, y:140, r:11, name:'The Salt Quarter', lv:[0,0]},
  market:  {x:74, y:126, r:15, name:'The Grand Bazaar', lv:[0,0]},
  plaza:   {x:96, y:102, r:13, name:'Crown Plaza', lv:[0,0]},
  temple:  {x:118,y:112, r:8,  name:'The Cathedral of the Tide', lv:[0,0]},
  palace:  {x:100,y:64,  r:16, name:'The Tideglass Palace', lv:[0,0]},
  garden:  {x:130,y:78,  r:11, name:"The Queen's Garden", lv:[0,0]},
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
  frostdeep:{ W:88, H:120, seed:33377, zones:FROSTDEEP_ZONES, dungeon:1, dark:0.18,
    spawn:{x:44.5,y:110.5}, title:'THE RIMEFISSURE', sub:'BENEATH THE FROZEN ISLE - A WARREN OF FROZEN STONE',
    // Both the entry landing and the Frozen Heart arena are FOOTED slick floors: a short
    // coasting slide (a beat of momentum that quickly settles), NOT a full glide. Keeping your
    // feet means a misstep drifts a little and stops, instead of the old full glide that flung
    // you across the ice endlessly until you fetched up on a wall.
    driftFloor:[{x0:34,y0:100,x1:54,y1:114},{x0:28,y0:10,x1:60,y1:33}],
    gen:()=>genFrostDeepAll() },
  aeriedeep:{ W:150, H:130, seed:52411, zones:AERIEDEEP_ZONES, dungeon:1, dark:0.5,
    spawn:{x:75.5,y:119.5}, title:'THE UNDERCLIMB', sub:'A CATACOMB BENEATH THE ROOST - GRIT, BONE, AND OLD SIGILS',
    gen:()=>genAerieDeepAll() },
  eastdeep:{ W:80, H:142, seed:55219, zones:EASTDEEP_ZONES, dungeon:1, dark:0.34,
    spawn:{x:40.5,y:132.5}, title:'THE EMBERDEEP', sub:'THE FIRE-HEART OF MOUNT KEA - WALLED, WARDED, AND OLD',
    gen:()=>genEastDeepAll() },
  frostvault:{ W:80, H:96, seed:41983, zones:FROSTVAULT_ZONES, dungeon:1, dark:0.16,
    spawn:{x:40.5,y:86.5}, title:'THE GLACIER VAULT', sub:'THE ICE-BEAR’S DEN - FROZEN HALLS AND OLD FROST-WARDS',
    gen:()=>genFrostVaultAll() },
  sky:{ W:64, H:64, seed:70123, zones:SKY_ZONES, cloud:1,
    spawn:{x:32.5,y:44.5}, title:'THE CLOUDREACH', sub:'A CLOUD-PERCH ABOVE THE WORLD - AND THE RAINBOW ROAD DOWN',
    gen:()=>genSkyAll() },
  reach:{ W:120, H:120, seed:60947, zones:REACH_ZONES,
    spawn:{x:60.5,y:98.5}, title:'STORMREACH', sub:'A STORM-COAST OF BROKEN KEELS - AND THE BRUTE THAT MADE THEM',
    gen:()=>genReachAll() },
  reachdeep:{ W:80, H:96, seed:48311, zones:REACHDEEP_ZONES, dungeon:1, dark:0.42,
    spawn:{x:40.5,y:86.5}, title:'THE DROWNED CATACOMB', sub:'BENEATH THE STORMREACH GRAVES - BONE, BRINE, AND OLD LOCKS',
    gen:()=>genReachDeepAll() },
  milldeep:{ W:40, H:104, seed:39218, zones:MILLDEEP_ZONES, dungeon:1, dark:0.30,
    spawn:{x:19.5,y:95.5}, title:'THE UNDERMILL', sub:'THE OLD GRINDING WORKS - COG, SHAFT, AND STONE',
    gen:()=>genMillDeepAll() },
  undermaw:{ W:44, H:192, seed:52741, zones:UNDERMAW_ZONES, dungeon:1, dark:0.34,
    spawn:{x:22.5,y:185.5}, title:'THE UNDERMAW', sub:'A SCAR IN THE BARIK HILLS - AND WHAT DENS IN IT',
    gen:()=>genUndermawAll() },
  barikdeep:{ W:72, H:100, seed:66413, zones:DROWNED_ZONES, dungeon:1, dark:0.30,
    spawn:{x:36.5,y:92.5}, title:'THE DROWNED VAULT', sub:'BENEATH FLOODED BARIK - DRINK-DARK HALLS AND OLD TIDE-LOCKS',
    gen:()=>genBarikDeepAll() },
  winddeep:{ W:72, H:100, seed:71822, zones:GALEDEEP_ZONES, dungeon:1, dark:0.26,
    spawn:{x:36.5,y:92.5}, title:'THE GALE SPIRE', sub:'BENEATH WINDSURF - A SHAFT SCOURED BY THE MADDENED WIND',
    gen:()=>genWindDeepAll() },
  sunwarddeep:{ W:72, H:100, seed:83194, zones:EMBERGIFT_ZONES, dungeon:1, dark:0.30,
    spawn:{x:36.5,y:92.5}, title:'THE ASHEN FORGE', sub:'DEEP IN MOUNT KEA - BASALT, EMBER, AND RUNNING FIRE',
    gen:()=>genSunwardDeepAll() },
  skydeep:{ W:72, H:100, seed:90277, zones:STORMTEMPLE_ZONES, dungeon:1, dark:0.34,
    spawn:{x:36.5,y:92.5}, title:'THE STORM TEMPLE', sub:'ATOP THE CLOUDREACH - A TEMPLE THE LIGHTNING NEVER LEAVES',
    gen:()=>genSkyDeepAll() },
  embertomb:{ W:80, H:110, seed:70715, zones:TIDEWARD_ZONES, dungeon:1, dark:0.28,
    spawn:{x:40.5,y:100.5}, title:'THE TIDEWARD CRYPT', sub:'BENEATH EMBERWICK - SEALED SINCE THE FOUNDERS, OPENED ONLY BY ALL FOUR GIFTS',
    gen:()=>genEmberTombAll() }
};
const WORLDS = {}; // cached generated worlds
// a dungeon is an underground world: no day/night cycle, no night-wraiths, its own
// fixed ambient darkness. Marked with `dungeon:1` on its WORLD_DEF.
function inDungeon(id){ const d=WORLD_DEFS[id||G.worldId]; return !!(d && d.dungeon); }
// ---- THE WAY UP: a single, identical fast-exit portal that opens where a dungeon boss falls,
// in EVERY dungeon. Step into it to rise to the surface, mended and whole. It replaces
// the old per-kill "take the quick road out" dialogue - same object, same look, in every dungeon.
function spawnFastExit(x,y){
  if(!inDungeon() || !G.decor || G.decor.some(d=>d.kind==='fastexit')) return;
  const sp=(typeof findOpenNear==='function' && findOpenNear(Math.round(x),Math.round(y),4)) || [Math.round(x),Math.round(y)];
  G.decor.push({kind:'fastexit', x:sp[0]+0.5, y:sp[1]+0.5, name:'CLIMB OUT', labelY:-46});
  if(typeof invalidateScenery==='function') invalidateScenery();
  setTimeout(()=>{ if(typeof toast==='function') toast('The guardian is down and the prize is yours - a <b style="color:#c9b0ff">way out</b> opens where it fell. Take what it guarded, then step in to <b>climb out</b> of the dungeon, <b>mended and whole</b>.',6500); },1600);
}
// which exit each dungeon world uses to climb back to the surface
function leaveDungeon(){
  const EX={ eastdeep:typeof exitEmberDungeon==='function'&&exitEmberDungeon,
    aeriedeep:typeof exitAerieDungeon==='function'&&exitAerieDungeon,
    frostdeep:typeof exitFrostDungeon==='function'&&exitFrostDungeon,
    frostvault:typeof exitFrostVault==='function'&&exitFrostVault,
    milldeep:typeof exitMillDungeon==='function'&&exitMillDungeon,
    undermaw:typeof exitUndermaw==='function'&&exitUndermaw,
    reachdeep:typeof exitReachDeep==='function'&&exitReachDeep,
    barikdeep:typeof exitBarikDeep==='function'&&exitBarikDeep };
  const fn=EX[G.worldId];
  if(fn){ fn(); return true; }
  // the returned-isle gate dungeons (winddeep, sunwarddeep, skydeep, embertomb) climb out
  // through their own `deepworld` way-up mouth
  const gm=(G.decor||[]).find(d=>d.kind==='dungeonmouth' && d.exit && d.deepworld);
  if(gm && typeof useGateDungeon==='function'){ useGateDungeon(gm); return true; }
  return false;
}
// step into THE WAY UP: full heal and rise to the surface. Only let the climb through if we can
// actually leave from here - otherwise a missing exit mapping would strand you in the dungeon.
// The climb-out mends you but grants NO XP; levels are earned in the dungeon, not for leaving it.
function useFastExit(){
  if(dlg.open) return;
  if(!leaveDungeon()){ if(typeof toast==='function') toast('There is no way up from here.',3000); return; }
  P.hp=P.maxhp;
  if(typeof burst==='function') burst(P.x,P.y-0.5,'#c9b0ff',20,2); Snd.magic&&Snd.magic();
  toast('You climb out of the dungeon - whole again.',4200);
}

// ---- THE REWARD ROOM: the way every dungeon SHOULD pay off - not a portal dropped where the
// boss falls, but a separate chamber the guardian was warding, with the dungeon's prize in a
// chest and the climb-out inside it. Generalizes the Undermill's sail-vault to every dungeon.
// A dungeon that carries a `gate:'reward'` catgate uses this pattern; killMob opens it on the
// boss's death (see openRewardRoom) instead of dropping THE WAY UP.
function hasRewardRoom(){ return !!(G.decor && G.decor.some(d=>d.kind==='catgate' && (d.gate==='reward' || d.reward))); }
// Wall off a reward room at the top of a boss arena: a stone partition row across [x0..x1] at
// wallY with a gated gap [gx0..gx1], then the prize chest + a climb-out placed inside the room
// (above the wall). The gap is a `gate:'reward'` catgate, sealed until the boss falls.
//   sealInGen: the partition row was already laid in the dungeon's gen (so its wall-face pass
//   enclosed the room) - skip re-laying it here and only add the gate/contents.
function buildRewardRoom(o){
  const wallT=(typeof T!=='undefined' && T.RUIN!=null)?T.RUIN:0, floorT=(o.floorT!=null)?o.floorT:wallT;
  const gap=[]; for(let x=o.gx0;x<=o.gx1;x++) gap.push([x,o.wallY]);
  if(!o.sealInGen){ for(let x=o.x0;x<=o.x1;x++){ setTile(x,o.wallY,wallT); setSolid(x,o.wallY,1); } }
  G.decor.push({kind:'catgate', x:(o.gx0+o.gx1)/2, y:o.wallY, open:!!o.cleared, gate:'reward',
    tiles:gap.slice(), openTile:floorT, label:o.label||'the vault gate'});
  for(const [x,y] of gap){ setSolid(x,y, o.cleared?0:1); if(o.cleared) setTile(x,y,floorT); }
  if(o.chest && !o.chestTaken) G.decor.push(o.chest);
  G.decor.push({kind:'fastexit', x:o.exitX+0.5, y:o.exitY+0.5, name:'CLIMB OUT', labelY:-46});
}
// Grind the reward-room gate up when the guardian falls: unseal the gap so the prize + climb-out
// stand open, right where the boss was warding them.
function openRewardRoom(){
  const g=(G.decor||[]).find(d=>d.kind==='catgate' && (d.gate==='reward' || d.reward));
  if(!g || g.open) return false;   // a dungeon that opens its own reward gate (e.g. the Undermaw Hoard Door) is already handled
  g.open=true;
  for(const [x,y] of (g.tiles||[])){ setSolid(x,y,0); setTile(x,y, g.openTile!=null?g.openTile:T.RUIN); }
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(typeof Snd!=='undefined' && Snd.quest) Snd.quest(); G.shake=Math.max(G.shake||0,0.45);
  if(typeof shockwave==='function') shockwave(g.x+0.5, g.y+0.5, 'rgba(201,176,255,0.9)', 50);
  setTimeout(()=>{ if(typeof toast==='function') toast('The guardian is down. Behind it, a sealed vault grinds open - <b style="color:#c9b0ff">the prize it warded and the way up</b> stand within. Take what it guarded, then step in to <b>climb out</b>, <b>mended and whole</b>.',6500); },1200);
  return true;
}

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
  // raise the ward-gate across the ruined causeway. It stands sealed until Elder
  // Maren gives her charge; updateHollowSeal() lifts it at once on a save where the
  // king quest is already underway, once quest state has been restored.
  if(typeof sealHollowKing==='function') sealHollowKing();
  placeEmberTomb();
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
  carveDisc(ZONES.castle.x,ZONES.castle.y,ZONES.castle.r,T.GRASS,false);   // keep grounds - the open meadow the King's Road crosses
  // The keep itself now stands on a headland extended WEST of the through-road, so
  // travellers pass to the EAST of it and never have to round its back to reach the
  // gate. Extend the land to carry the keep and the apron before its south gate.
  carveDisc(ZONES.castle.x-11,ZONES.castle.y,12,T.GRASS,false);            // the western keep headland
  carveDisc(ZONES.castle.x-9, ZONES.castle.y+7,7,T.GRASS,false);           // a broad apron of ground before the gate
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
  // ---- Barik Keep approach ----
  // Tie the village and spire roads together with a short link that runs EAST of the
  // keep, so the King's Road skirts the grounds rather than driving past the keep's
  // back. A cobbled walkway then branches west off that link, straight up to a small
  // forecourt at the south gate - visitors approach the gate head-on and no one has
  // to walk behind the keep.
  carveLine(ZONES.castle.x-6,ZONES.castle.y-4, ZONES.castle.x+6,ZONES.castle.y+4, T.PATH,0);
  carveLine(ZONES.castle.x+4,ZONES.castle.y+3, ZONES.castle.x-10,ZONES.castle.y+3, T.PATH,1);
  carveDisc(ZONES.castle.x-11,ZONES.castle.y+2,3,T.PATH,true);   // the cobbled forecourt at the gate
  // ---- Greyharbor's harbor promenade ----
  // The town's houses now ring the shoreline (placed in placeObjectsMain), each out
  // at the water's edge instead of huddled by the well. This coastal lane threads
  // between them and ties into the four King's Roads (dock, forest, east, keep) so
  // every door still has a road home. carveLine only paves land, so any stretch that
  // grazes the shallows is simply left unpaved - the shore stays a shore.
  const HARBOR_LANE=[
    [68,256],[69,250],[74,245],[79,245],[83,248],[86,251],
    [86,256],[83,260],[78,263],[72,262],[68,258],[68,256]
  ];
  for(let i=0;i<HARBOR_LANE.length-1;i++)
    carveLine(HARBOR_LANE[i][0],HARBOR_LANE[i][1],HARBOR_LANE[i+1][0],HARBOR_LANE[i+1][1], T.PATH,0);
  const HARBOR_SPURS=[
    [66,257,68,256],[65,251,69,250],[71,244,74,245],[77,243,79,245],  // shore doors -> ring
    [83,244,83,248],[86,262,83,260],[72,264,72,262],[67,261,68,258],
    [68,256,65,256],[86,254,88,256],[85,249,88,250],[80,262,82,262]   // ring -> the radial roads
  ];
  for(const s of HARBOR_SPURS) carveLine(s[0],s[1],s[2],s[3], T.PATH,0);
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
    if(dist(x,y,ZONES.castle.x,ZONES.castle.y)<ZONES.castle.r) continue;   // keep the keep's grass meadow clear
    if(dist(x,y,ZONES.castle.x-11,ZONES.castle.y)<8) continue;             // and the western keep headland
    // leave a one-tile margin along the King's Roads so no tree overhangs and blocks the path
    let byRoad=false;
    for(let ry=-1;ry<=1&&!byRoad;ry++) for(let rx=-1;rx<=1;rx++) if(tileAt(x+rx,y+ry)===T.PATH){ byRoad=true; break; }
    if(byRoad) continue;
    const p=(t===T.FOREST)?0.22:0.05;
    if(r()<p) addNode('tree',x,y);
  }
  for(let i=0;i<300;i++){ const x=rndiR(r,4,MAPW-5), y=rndiR(r,4,MAPH-5);
    const t=tileAt(x,y);
    if(dist(x,y,ZONES.castle.x,ZONES.castle.y)<ZONES.castle.r) continue;   // no stone strewn across the keep meadow
    if(dist(x,y,ZONES.castle.x-11,ZONES.castle.y)<8) continue;             // nor across the western keep headland
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
  // Greyharbor rings its harbor: every house sits out on the shoreline rather than
  // huddled around the well, strung along the promenade lane (carved in genMainland,
  // which also links the ring to the King's Roads). Going round the shore:
  addBuilding('house', V.x-13,V.y+1, "Harbor house");                 // (64,255) set back onto the green so its door faces the village/path, not the water you arrive on
  addBuilding('house', V.x-12,V.y-3, 'Thimble & Thread (Clothier)').closedMsg='<b>Thimble &amp; Thread</b> has its shutters down and its needles away. “Mira sews by daylight, dear - come back then.”'; // (65,251) north-west shore
  addBuilding('house2',V.x-6, V.y-10,"Ivo's Herbary");               // (71,244) north shore
  addBuilding('house2',V.x,   V.y-11,"Warden's post");               // (77,243) north point
  addBuilding('barn',  V.x+6, V.y-10,'Trade hall');                  // (83,244) north-east shore
  addBuilding('house', V.x+9, V.y+8, "Rook's Remedies (Apothecary)"); // (86,262) south-east shore
  addBuilding('house2',V.x-5, V.y+10,'The Gull & Anchor (Inn)');     // (72,264) south shore
  addBuilding('house', V.x-10,V.y+7, "Sela's Provisions");           // (67,261) south-west shore
  addBuilding('lamp',  V.x-9, V.y+5, '');
  addBuilding('lamp',  V.x+2, V.y-8, '');
  const FZ=ZONES.farm;
  addBuilding('barn', FZ.x+4,FZ.y-4,"Hedda's barn");
  addBuilding('house',FZ.x-6,FZ.y+5,'Farmhouse').closedMsg='The <b>Farmhouse</b> is dark - early to bed, early to the fields. A dog barks once, then thinks better of it.';
  addBuilding('lamp',FZ.x,FZ.y,'');
  const MZ=ZONES.mines;
  addBuilding('lamp',MZ.x+1,MZ.y-1,'');
  // Barik Keep - the Duchess's seat, set on the western headland with its gate
  // opening south onto the cobbled forecourt (see the approach carved in genMainland).
  const CK=ZONES.castle, KX=CK.x-11, KY=CK.y-3;   // KX,KY = the keep's anchor, shifted west of the through-road
  addBuilding('castle', KX,KY,'Barik Keep - Hall of Duchess Maelis');
  addBuilding('house2',KX-7,KY+2,'Keep barracks');   // service buildings on the landward (west) side, clear of the walkway
  addBuilding('house2',KX-7,KY+6,'Keep granary');
  addBuilding('lamp',KX-2,KY+4,''); addBuilding('lamp',KX+2,KY+4,'');   // lamps at the gate mouth
  G.decor.push({kind:'pillar',x:KX-4.5,y:KY+1.5,broken:false}); setSolid(KX-5,KY+1,1);
  G.decor.push({kind:'pillar',x:KX+4.5,y:KY+1.5,broken:false}); setSolid(KX+4,KY+1,1);
  // Aelin's Spire - the magic tower
  const SP=ZONES.spire;
  addBuilding('tower', SP.x,SP.y,"Aelin's Spire - school of the weave").tall=true;   // a proper wizard's spire, twice as tall
  addBuilding('lamp',SP.x-2,SP.y+2,'');
  // (Rook's old archery butts are gone - he trades in tonics now, not arrows;
  // Rook's Remedies stands in the shoreline ring above.)
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
  for(const [wz,wlv] of [[ZONES.highlands,4],[ZONES.ruins,6],[ZONES.desert,12],[ZONES.vael,12],[ZONES.undermaw,7],[ZONES.spire,3]]){
    const wsp=findOpenNear(wz.x+3,wz.y+3,6);
    if(wsp){ G.decor.push({kind:'chest',x:wsp[0]+0.5,y:wsp[1]+0.5,opened:false,rich:wlv}); setSolid(wsp[0],wsp[1],1); }
  }
  // the brigand camp and their stolen-goods cache (it only matters once you know of it)
  addBuilding('lamp',161,147,'');
  G.decor.push({kind:'chest',x:162.5,y:146.5,opened:false,cache:1});
  // Captain Corvo's cove on the far shore; his sloop rides at anchor
  addBuilding('lamp',330,244,'');
  addBuilding('boat',338.5,249.5,'');
  // (Thimble & Thread is placed with the shoreline ring above)
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
  // lamps strung along the harbor promenade so the shore-front ring reads at night
  addBuilding('lamp',V.x-8,V.y-4,''); addBuilding('lamp',V.x-1,V.y-8,'');
  addBuilding('lamp',V.x+6,V.y-6,''); addBuilding('lamp',V.x+7,V.y+5,'');
  addBuilding('lamp',V.x-3,V.y+8,''); addBuilding('lamp',V.x-8,V.y+4,'');
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
  G.npcs.push(makeNPC('kell','Warden Kell', V.x+2,V.y-9,
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
  // Brenna waits by the boat where you first step ashore - Torv the Delver's sister,
  // bound up-country to look in on him. Her chatter is the breadcrumb to Torv (and his
  // "reopen the shafts" quest) up at the Old Barik Mines.
  { const dz=ZONES.dock;
    const bsp=(typeof findOpenNear==='function' && findOpenNear(dz.x+2,dz.y+1,5)) || [dz.x+2,dz.y+1];
    G.npcs.push(makeNPC('brenna',"Brenna, Torv's Sister", bsp[0],bsp[1],
      {skin:'#c49a72',hair:'#3a3a3c',shirt:'#5a5048',pants:'#3a352f',apron:'#6a5f52',hairstyle:'bun'},
      ["I'm away up to the Old Barik Mines to find my brother Torv - he's holed up in those shafts alone since the wild roads cut the pit off, and someone in this family ought to see he's still breathing. You're headed inland? Look in on him for me.",
       "Torv won't come down to the harbor, won't leave his precious stone. Stubborn as the rock he digs. If the delver won't come to his kin, his kin'll go to the delver.",
       "Mind the north road if you take it - it's not the walk it was. That's the half of why I worry after Torv."],0.3)); }
}
function spawnBarikFolk(){
  const V=ZONES.village, FZ=ZONES.farm, MZ=ZONES.mines;
  G.npcs.push(makeNPC('sela','Sela the Provisioner', V.x-9,V.y+9,
    {skin:'#d3a377',hair:'#3c2f22',shirt:'#7a4a36',pants:'#4a3a2c',apron:'#c9b48e',hairstyle:'bun'},
    ["Bread, fish, and no questions - Greyharbor's finest counter.",
     "The farmsteads east keep us fed. Mostly."],1.2));
  G.npcs.push(makeNPC('ivo','Ivo the Herbalist', V.x-5,V.y-8,
    {skin:'#c9a884',hair:'#5a6a4a',shirt:'#46603c',pants:'#35402c',robe:'#3f5a3a',trim:'#9ab87a'},
    ["Everything on Barik either heals you or bites you. I sell the first kind.",
     "Bluecaps, tonics, tidebalm. The wilds provide - I just bottle it."],1.0));
  G.npcs.push(makeNPC('hedda','Farmer Hedda', FZ.x+1.5,FZ.y+1.5,
    {skin:'#d8ab7d',hair:'#b8863e',shirt:'#8a6a3a',pants:'#5a4630',apron:'#7a5a3a',hairstyle:'bun'},
    ["Soil's good here. It's everything ELSE that's the problem.",
     "Slimes from the Mirefen eat a season's work in a night."],1.4));
  // Torv holds the Old Barik Mines until you reopen his shafts (torv1). After that his
  // worrying sister marches him down to the harbor, so on later visits he stands by the
  // boats beside Brenna (his reunion chatter is swapped in by applyIdleDialogue). See
  // the torv1 hook in completeQuest (05-inventory-skills-quests.js) for the live move.
  const torvLook={skin:'#b98f68',hair:'#3a3a3c',shirt:'#4a4440',pants:'#332f2c',beard:'#4a4a4c',armor:1};
  if(P.story && P.story.torvHome){
    const dz=ZONES.dock;
    const tsp=(typeof findOpenNear==='function' && findOpenNear(dz.x+4,dz.y+1,6)) || [dz.x+4,dz.y+1];
    G.npcs.push(makeNPC('torv','Torv the Delver', tsp[0],tsp[1], torvLook,
      ["Brenna wouldn't let it lie till I came down and showed her all my fingers - so here I am, blinking at the daylight.",
       "The shafts'll keep till morning. Family first, Brenna says - and she's usually right, curse her."],0.4));
  } else {
    G.npcs.push(makeNPC('torv','Torv the Delver', MZ.x+1.5,MZ.y+2.5, torvLook,
      ["These shafts fed three generations before the wilds took the road.",
       "Stone's still down there. Just needs hands brave enough."],0.9));
  }
}
// Live-relocate Torv from the mines down to the harbor beside Brenna the moment his shafts
// are reopened (torv1), so their reunion holds in the already-cached Barik world without a
// reload. On a fresh regen spawnBarikFolk does the same placement from P.story.torvHome.
function relocateTorvHome(){
  if(G.worldId!=='main' || !G.npcs) return;
  const torv=G.npcs.find(n=>n.id==='torv'); if(!torv) return;
  const dz=ZONES.dock;
  const sp=(typeof findOpenNear==='function' && findOpenNear(dz.x+4,dz.y+1,6)) || [dz.x+4,dz.y+1];
  torv.x=sp[0]+0.5; torv.y=sp[1]+0.5; torv.hx=torv.x; torv.hy=torv.y; torv.wander=0.4; torv.li=0;
  if(typeof DIALOGUE!=='undefined' && DIALOGUE.idleVariant && DIALOGUE.idleVariant.torvHome)
    torv.idleLines=DIALOGUE.idleVariant.torvHome.slice();
  const bre=G.npcs.find(n=>n.id==='brenna');
  if(bre && typeof DIALOGUE!=='undefined' && DIALOGUE.idleVariant && DIALOGUE.idleVariant.brennaHome){
    bre.idleLines=DIALOGUE.idleVariant.brennaHome.slice(); bre.li=0; }
}
window.relocateTorvHome=relocateTorvHome;
// Once Maelis and Elias are wed, the Duke stands at her side in the keep. Spawns
// him beside her if he isn't already there - called on world-gen and the moment
// the wedding scene resolves, so he appears without needing a reload.
function wedDuke(){
  if(!(P.story && P.story.duchessWed)) return;
  if(G.worldId!=='main') return;
  if(G.npcs && G.npcs.some(n=>n.id==='dukeElias')) return;
  const mae = G.npcs && G.npcs.find(n=>n.id==='maelis');
  const bx = mae? Math.round(mae.x-1.6) : Math.round(ZONES.castle.x-12);
  const by = mae? Math.round(mae.y) : Math.round(ZONES.castle.y+1);
  const sp = (typeof findOpenNear==='function' && findOpenNear(bx,by,3)) || [bx,by];
  const duke = makeNPC('dukeElias','Duke Elias of Barik', sp[0], sp[1],
    {skin:'#caa27b',hair:'#3a2f26',shirt:'#3a4a6e',pants:'#2c3346',robe:'#33406a',trim:'#e8c860',hat:'crown',hairstyle:'short'},
    ['Three years of letters, and it turns out she is even better in person. I have you to thank for the crossing.',
     'A tide-scholar, a duke - I still answer to "Elias," if you please. Old habits.',
     'Maelis rules; I read the tides and keep her tea warm. We are both exactly where we wished to be.'],0.3);
  if(mae) duke.face={x:1,y:0};
  G.npcs.push(duke);
}
function spawnRealmFolk(){
  const CK=ZONES.castle, SP=ZONES.spire, V=ZONES.village, VM=ZONES.vael;
  const KX=CK.x-11, KY=CK.y-3;   // the relocated keep's anchor (matches placeObjectsMain)
  const wed = !!(P.story && P.story.duchessWed);
  G.npcs.push(makeNPC('maelis','Duchess Maelis of Barik', KX+0.5,KY+3.8,
    {skin:'#e0b088',hair:'#d8c090',shirt:'#6a3a5e',pants:'#3a2a3c',robe:'#5a2a52',trim:'#e8c860',hat:'crown',hairstyle:'long'},
    wed
    ? ["My Duke charts the tides from the west solar now. Strange, to rule beside someone at last.",
       "You carried the letter that carried my heart. Barik does not forget a debt like that - nor do I."]
    : ["Barik feeds three baronies and fears one: the Vael March, north-east, where my cousin plays at war.",
       "A duchess rules by ledger and by patience. The sword is for those who run out of both."],0.5));
  wedDuke();
  { const kw=makeNPC('guardc1','Keep Warden', KX-2.5,KY+5.2,
    {skin:'#caa27b',hair:'#2e2a28',shirt:'#4a4f5e',pants:'#2f333c',armor:2,pauldrons:true},
    ["Her Majesty receives travelers. Mind your manners and your mud."],0.4);
    kw.nightOwl=true; G.npcs.push(kw); }   // the keep is guarded round the clock
  G.npcs.push(makeNPC('aelin','Aelin the Weaver', SP.x+1.5,SP.y+2.2,
    {skin:'#d0a884',hair:'#8a8aa8',shirt:'#3a3a6a',pants:'#2c2c48',robe:'#40408a',trim:'#9a9ae0',hat:'wizard',hairstyle:'long'},
    ["The Spire's mine to keep - old glass, older books, and a candle that won't quite die.",
     "Do me a kindness - bring me some bluecaps from the pines. My knees are done climbing for them, and the weave burns truer by their light. Caught out after dark? Knock - there's a cot by the hearth."],0.6));
  G.npcs.push(makeNPC('rook','Rook the Apothecary', V.x+7,V.y+6,
    {skin:'#b98f68',hair:'#4a3a28',shirt:'#5a6a3c',pants:'#3a4228',apron:'#7a5a3a'},
    ["A good tonic asks no questions and mends what it finds.",
     "Ember Tonic for the small hurts, the blue elixir for the big ones."],0.8));
  G.npcs.push(makeNPC('mira','Mira the Seamstress', V.x-10,V.y-1,
    {skin:'#c9a081',hair:'#2c2030',shirt:'#5e3a6a',pants:'#3a2c44',hairstyle:'long'},
    ['Silk holds a memory of every hand that touches it.',
     'My whole shipment, taken on the north road. The pines have thieves in them now.'],0.5));
  G.npcs.push((()=>{ const cv2=makeNPC('corvo','Captain Corvo', 330.5,243.2,
    {skin:'#b98a62',hair:'#3a3634',shirt:'#3c4a5e',pants:'#2a3038',hat:'hood',hatColor:'#2f3a48'},
    ['You cracked that wizard\'s violet stones for me - I\'ll not soon forget it. Bring my Wren her ribbon from Mira and I\'ll sail you out to his uncharted isle, free of charge.',
     'My girl Wren turns twelve at the next full tide. I promised her something fine.',
     'Think on it: first my ribbons go missing, so my ferry sits idle. Then they say a dragon shut the eastern sky. Now word is Windsurf\'s own harbor has turned deadly. One door after another, latched between the isles - and always, they say, by some soft-spoken fellow who never raises his voice.'],0.3); cv2.nightOwl=true; return cv2; })());
  G.npcs.push((()=>{ const hm=makeNPC('hermit','Moss-Brother Fen', ZONES.forest.x+9.5,ZONES.forest.y-6.6,
    {skin:'#c9a27b',hair:'#9aa08a',shirt:'#4a5a3a',pants:'#3a4230',robe:'#54644a'},
    ['Sixty years the pines kept my secret. You brought an axe to a riddle - fair enough.',
     'The forest regrows what you take. Remember that about yourself, too.'],0); hm.nightOwl=true; return hm; })());
  G.npcs.push(makeNPC('bree','Goldwarden Bree', V.x+6,V.y-8,
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
  if(cap){ cap.boss=true; cap.bigBoss=true; cap.title='CASTELLAN OF THE VAEL'; cap.ach='vaelbreaker';
    cap.hx=x; cap.hy=y; cap.respawnT=-1; cap.entrance='loom'; }
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
  const inn=makeNPC('saffi','Saffi the Innkeeper', V.x-4,V.y+8,
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
    ['skeleton', ZONES.undermaw, 5, 0.9, {tag:'scarSkel', hideWhen:'undermawDown'}],  // the bone-kin at the scar's mouth - gone once the Maw-Stalker falls
    ['wolf',     {x:150,y:316,r:8}, 5, 0.4],   // the spire road earns its length
    ['skeleton', {x:172,y:325,r:7}, 5, 0.45],
    ['brigand',  {x:162,y:148,r:6}, 5, 0.25]   // they guard what they stole
  ];
  // practice dummies: Rook's yard by his range (dry side - the shore bites).
  // (Aelin's Spire keeps no range now - the Weaver sends students for bluecaps, not bolts.)
  // findOpenNear dodges buildings, trees, and water so a dummy can never spawn wedged.
  carveDisc(Math.round(ZONES.village.x+8), Math.round(ZONES.village.y+5), 2, T.SOIL, false);
  for(const [yx,yy] of [[ZONES.village.x+7,ZONES.village.y+5],[ZONES.village.x+9,ZONES.village.y+4]]){
    const yd=findOpenNear(Math.round(yx),Math.round(yy),5);
    if(yd) spawnMob('dummy',yd[0],yd[1]);
  }
  const pr=mulberry32(SEED+41);
  for(const [kind,z,count,eliteP,opt] of packs){
    if(opt && opt.hideWhen && P.story && P.story[opt.hideWhen]) continue;   // a cleared-dungeon pack no longer haunts the surface
    for(let i=0;i<count;i++){
      const a=pr()*TAU, dd=2+pr()*(z.r-3);
      const s=findOpenNear(Math.round(z.x+Math.cos(a)*dd),Math.round(z.y+Math.sin(a)*dd),4);
      if(s){ const m=spawnMob(kind,s[0],s[1], pr()<eliteP); if(m && opt && opt.tag) m[opt.tag]=1; }
    }
  }
  // a den of wolves atop Wolfcrag (the old Greymaw den - now just a thick pack)
  { const wr=mulberry32(SEED+77);
    for(let i=0;i<6;i++){ const a=wr()*TAU, dd=1+wr()*3.5;
      const s=findOpenNear(Math.round(ZONES.highlands.x+Math.cos(a)*dd),Math.round(ZONES.highlands.y-2+Math.sin(a)*dd),4);
      if(s) spawnMob('wolf', s[0], s[1], wr()<0.4); } }
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
  // once Ashwing is freed he comes up out of the throat to bask on the warm ash-shelf
  // beside the caldera - friendly, dozing in the open, ready to talk and to fly you up
  // to the Cloudreach (dragonrest's tap runs dragonLairSpeak, which offers the flight).
  if(qs('wyrm')==='done' || (P.story && P.story.emberDone) || P.eastDragonFreed){
    const C=EAST_ZONES.caldera;
    const ds=findOpenNear(Math.round(C.x+6), Math.round(C.y+C.r+4), 8)
          || findOpenNear(Math.round(C.x), Math.round(C.y+C.r+5), 12) || [C.x+6, C.y+C.r+4];
    G.decor.push({kind:'dragonrest', x:ds[0]+0.5, y:ds[1]+0.5});
  }
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
  // Lord Elias - a tide-scholar who has courted the Duchess of Barik by letter for
  // three years and never once crossed the strait to meet her. He leaves the isle
  // once the two are wed (he becomes Barik's Duke), so he only stands here before.
  if(!(P.story && P.story.duchessWed))
    G.npcs.push(makeNPC('elias','Lord Elias', V.x+2.5,V.y-3.4,
      {skin:'#caa27b',hair:'#3a2f26',shirt:'#3a4a6e',pants:'#2c3346',robe:'#33406a',trim:'#c9a24e',hairstyle:'short'},
      ['I chart the tides for a living, and cannot chart the one crossing I actually want to make.',
       'There is a lady in Barik I have written to for three years. Her letters smell of ink and iron. I would cross an ocean for the next one - if my nerve ever caught up to my heart.',
       'If you are ever bound for Barik... no. Never mind. Some letters a man must send himself. Or wishes he would.'],0.4));
  // Lani keeps the Kohana longhut - rest here to mend and set your waking-place
  { const inn=makeNPC('lani','Lani the Innkeeper', V.x-4, V.y-1.1,
      {skin:'#b58a5e',hair:'#241a14',shirt:'#3f7a5e',pants:'#3a3026',apron:'#c9b48a',hairstyle:'bun'},
      ['Eh, down off Kea in one piece? Come in, come in - the mat is soft and the hearth is warm.',
       'Ten gold, a woven mat, and the reef to hum you under. Sleep as long as the tide pleases.'],0.7);
    inn.nightOwl=true; G.npcs.push(inn); }
  // Vath - a visiting Emberbinder who covets the dragon's fire and will lie to
  // get it. Once the wyrm is freed he's fled to the grove, no longer in the village
  // (quest-state gated so it survives reloads).
  // He stands well NORTH of the village clearing, alone out in the wild grass toward
  // the mountain - set apart from the warm hearths on purpose. Wander is 0 so he holds
  // eerily still, a robed figure watching from the treeline: something off about him.
  if(qs('wyrm')!=='done'){
    const vth=makeNPC('vath','Vath the Wanderer', V.x-9,V.y-10.5,
      {skin:'#c2a892',hair:'#241a2e',robe:'#4a2a5e',rune:true,beard:'#2a2038'},
      ['The mountain\'s heat is... wasted, on a sleeping beast.',
       'You have the look of someone the world owes a favor. Climb the mountain; collect it.'],0);
    vth.nightOwl=true;   // a wanderer keeps no one's hours - he lingers by the treeline day and night
    G.npcs.push(vth);
  }
}
/* The caldera set-piece: told the wyrm is evil, you climb Mount Kea and step
   INTO his lair, where he turns out kind. Vath's binding takes him mid-word;
   you're driven out to the caldera to break the spell in a fight. */
function dragonLairSpeak(){
  // Only "still to be faced" while the fight is LIVE. A beaten dragon lingers a beat
  // as a fainted (m.fainted), freed mob before disperseDragon() finally marks it dead -
  // keying off !m.dead alone made that window read as "still enthralled", so talking
  // showed "Face him" and blocked the flight offer below (a soft-lock: he sits there
  // green, and you can no longer transport up). Gate on !m.fainted instead.
  if(G.mobs && G.mobs.some(m=>m.kind==='dragon' && !m.dead && !m.fainted)){ // he's enthralled, right here in the chamber
    lairDialog('Ashwing’s Rest','The violet has him. Ashwing rears over the fire-shelf, wings cracking the basalt - no more words to give. There is nowhere left to go but through him. <b>Break the spell.</b>',
      [{label:'Face him', cls:'gold', fn:()=>{ closeDialog(); if(G.interior) exitHouse(); }}]);
    return;
  }
  if(qs('wyrm')==='done' || P.eastDragonFreed){
    const haveChart = !!(P.story && P.story.skyMapTaken);
    const fbtns=[{label:'Fly me up to the Cloudreach', cls:'gold', fn:()=>{ askDragonFlight(); }}];
    if(haveChart) fbtns.push({label:'Fly me on to Windsurf', fn:()=>{ closeDialog();
      flyToWorld('wind','Ashwing springs from the fire-shelf and climbs - the Sunward Isle falls away, and far off Windsurf rises bright on the water ahead.'); }});
    fbtns.push({label:'Rest a while', ghost:true, fn:closeDialog});
    lairDialog('Ashwing','“Rest by my fire as long as you like, little flame. A mountain remembers a kindness.” <i>His great eye turns up, past the smoke-hole, to the weather.</i> “And when horizons itch at you - there is a place above the clouds, and the whole archipelago spread below like a map. My wings do not fear the height. Say where, and I will carry you.”',
      fbtns);
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
        'A voice pours from the walls, and the air turns cold and violet: “Sentiment. Sleep, wyrm - or kill for me.” <i>Ashwing swings his great head toward you, fighting it - and losing. He is between you and the only way out.</i>',
        [{label:'Stand and fight', cls:'gold', fn:()=>{ closeDialog(); if(G.interior) exitHouse();
        // the enthrall now plays as a full animated cutscene (the violet takes him); it hands
        // straight to the fight (awakenDragon(true), already bound) on its final beat
        if(typeof dragonEnthrallCutscene==='function') dragonEnthrallCutscene(); else awakenDragon(); }}])}])}]);
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
function awakenDragon(alreadyBound){
  if(G.mobs && G.mobs.some(m=>m.kind==='dragon' && !m.dead)) return; // one Ashwing at a time
  const C = G.worldId==='eastdeep' ? EASTDEEP_ZONES.rest : (ZONES.caldera||EAST_ZONES.caldera);
  const sp=findOpenNear(Math.round(P.x), Math.round(P.y+3), 7)
        || findOpenNear(Math.round(C.x), Math.round(C.y+ (G.worldId==='eastdeep'?4:7)), 8) || [C.x, C.y+4];
  const dr=spawnMob('dragon', sp[0], sp[1]);
  if(dr){ dr.bigBoss=true; dr.ach='dragonsworn'; dr.noAggroT=0;
    dr.respawnT=-1; dr.hx=sp[0]; dr.hy=sp[1]; G.dragonMob=dr;
    if(alreadyBound){
      // the overlay enthrall cutscene already SHOWED the violet take him - so he wakes
      // already bound and turns on you at once; skip the on-canvas 'enthrall' entrance
      // (which would replay the same beat) and land the fight-banner here instead
      dr.enspelled=true; dr.ensAmt=1; dr.entranceDone=true; dr.state='chase';
      if(typeof banner==='function') banner('ASHWING, ENTHRALLED','BREAK THE SPELL - DO NOT LET HIM FALL TO IT');
      Snd.boss&&Snd.boss(); G.slowmo=Math.max(G.slowmo||0,0.8);
    } else {
      // fallback path (no cutscene): spawn him as HIMSELF (natural green) and let the
      // 'enthrall' entrance wash the violet across him, then hand to the fight
      dr.enspelled=false; dr.ensAmt=0; dr.state='idle';
      dr.entrance='enthrall'; dr.entranceTitle='ASHWING, ENTHRALLED'; dr.entranceSub='BREAK THE SPELL - DO NOT LET HIM FALL TO IT';
    }
  }
  P.metDragon=1;
  // seal the chamber: the Dragon Gate flares shut behind you - no way out (and no
  // boar in) until the wyrm is down. Only the Emberdeep has the firegate to close.
  if(G.worldId==='eastdeep'){
    const g3=G.decor.find(d=>d.kind==='firegate' && d.gate==='g3');
    if(g3){ g3.open=false; for(let x=g3.x0;x<=g3.x1;x++) setSolid(x,g3.gy,1);
      if(typeof invalidateScenery==='function') invalidateScenery();
      if(typeof shockwave==='function') shockwave(40.5,g3.gy+0.5,'rgba(255,140,60,0.92)',50);
      G.shake=Math.max(G.shake||0,0.5); Snd.boss&&Snd.boss(); }
    G.dragonSealed=1;
  }
  // the banner + shake now ride the 'enthrall' entrance (fires as he rouses) - see startBossIntro
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
  // (Vath no longer lurks in the grove after the dragon quest - he flees the isle
  // entirely when Ashwing is freed, so there's no mage mob to place here.)
}
function genEastAll(){
  genEast(); bakeSolids(); placeObjectsEast(); buildFoam();
  placeSunwardHazard();
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
  // gate1/gate2 ride +47 down with the lower chambers; gate3 (the Dragon Gate) stays put
  // at the boss doorway - only its room-below neighbour changed (now the Bat Roost).
  gate1:{y:104, x0:39, x1:41}, gate2:{y:85, x0:39, x1:41}, gate3:{y:19, x0:39, x1:41}
};
let EDEEP_WALLS = [];   // basalt tiles that read as visible walls (bordering the floor)
function genEastDeep(){
  // the whole map begins as solid basalt; we cut the chambers out of it
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  // ---- the four lower chambers (entry up through the Warding Locks), all +47 from
  //      their old spots to make room for the two new island crossings above them ----
  carve(30,125,50,137); // R0 THE EMBERTHROAT - entry landing (the way up sits here)
  carve(39,120,41,126); // doorway A -> the Ember Font
  carve(28,106,52,121); // R1 THE EMBER FONT - visit-all plate chamber
  carve(39,101,41,107); // doorway B (Gate 1 seals it at y=104)
  carve(28,87,52,102);  // R2 THE SUNKEN CAUSEWAY - lever chamber
  carve(39,82,41,88);   // doorway C (Gate 2 seals it at y=85)
  carve(28,68,52,83);   // R3 THE WARDING LOCKS - button-order chamber
  carve(39,63,41,69);   // doorway D -> the Floating Isles (stands open - the pit is the test)
  // ---- the two NEW island crossings, between the Warding Locks and the dragon ----
  carve(28,48,52,64);   // R4 THE FLOATING ISLES - hop the stationary isles, ride the last (turning) one
  carve(39,44,41,49);   // doorway E -> the Bat Roost (stands open)
  carve(24,24,56,44);   // R5 THE BAT ROOST - a wide field of stationary isles crossed under bat assault
  carve(18,31,25,36);   // the WEST bat-tunnel - bats swoop out of this offscreen mouth
  carve(55,31,62,36);   // the EAST bat-tunnel
  carve(39,16,41,26);   // doorway F (Gate 3, the Dragon Gate, seals it at y=19)
  carve(20,2,60,18);    // R6 ASHWING'S REST - the end chamber (room to break the spell)
  // THE EMBER KING'S HOARD - an OPTIONAL walled vault off the Warding Locks,
  // sealed by an arcane ember-fence only the fire staff can break. Carved here (as
  // floor, before the wall-face pass) so its basalt walls render as real walls and
  // the fence doorway does NOT get recorded as basalt (it becomes the ember-gate).
  carve(54,71,61,81);   // the vault chamber, east of R3
  carve(52,75,54,77);   // the short approach corridor + the fence doorway
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
  // only the Causeway Gate (chamber 2, worked by its lever) is sealed across its corridor;
  // chambers 1 and 3 have no crossing-gate, so their corridors stand open (the pit is the test)
  for(let x=EDEEP.gate2.x0;x<=EDEEP.gate2.x1;x++){ setTile(x,EDEEP.gate2.y,T.RUIN); setSolid(x,EDEEP.gate2.y,1); }
}
function edeepLava(x,y,r){ // a molten pool that both glows and blocks the floor
  G.decor.push({kind:'lava', x:x+0.5, y:y+0.5, r});
  for(let yy=Math.round(y-r);yy<=Math.round(y+r);yy++) for(let xx=Math.round(x-r);xx<=Math.round(x+r);xx++)
    if(inb(xx,yy) && dist(xx,yy,x,y)<=r-0.2){ setSolid(xx,yy,1); }
}
function placeObjectsEastDeep(){
  G.decor=G.decor||[];
  // the whole dungeon turns on the DASH - make sure it's available so the crossings can't soft-lock
  if(!(P.unlocked && P.unlocked.dash)){ P.unlocked=P.unlocked||{}; P.unlocked.dash=true; toast('The heat quickens your step - you can <b>DASH</b> here (tap <b>Ctrl</b> or <b>L</b> / the dodge button).',4200); }
  const Z=EASTDEEP_ZONES;
  // the basalt walls that give the rooms their shape (baked static scenery)
  for(const [x,y] of EDEEP_WALLS) G.decor.push({kind:'ewall', x:x+0.5, y:y+0.5, s:((x*7+y*13)%5)});
  // the way back up the Emberthroat, in the landing chamber
  G.decor.push({kind:'dungeonmouth', ember:1, exit:1, x:40.5, y:135.5, label:'the way up'});
  setSolid(40,135,0); setTile(40,135,T.RUIN);
  // torches bracketed along the chamber walls (the two new island rooms get their own pair)
  for(const [tx,ty] of [[31,126],[49,126],[29,107],[51,107],[29,88],[51,88],[29,69],[51,69],
                        [29,50],[51,50],[26,27],[54,27],[24,4],[56,4],[40,3]])
    if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // ============ THE TURNING BRIDGES: DASH across the pit on rotating basalt slabs ============
  // Each chamber is a bottomless fire-pit spanned only by stone slabs that turn on a central
  // spindle. There is a gap of open pit between every ledge and slab, so you must DASH (roll)
  // to board a slab and to leap from one to the next - time the dash to when a slab swings to
  // you. Miss and you drop into the pit (you climb back out singed: -5 HP) and start the
  // crossing over. Reach the far ledge and the gate rises.
  G._eastChasm=new Set(); G._eastWheels=[]; G._eastSlabs=[]; G._eastT=0; G._eastCross=[]; G._eastFallHint=0; G._emberGateT={}; G._emberDrop=null;
  G._eastBatT=0; G._eastBatN=0; G._eastBatHint=0;
  const chasm=(x0,x1,y0,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)&&!solidAt(x,y)){ G._eastChasm.add(x+','+y); G.decor.push({kind:'firepit', x:x+0.5, y:y+0.5, seed:(x*7+y*13)%9}); } };
  const pad=(x,y)=>{ G._eastChasm.delete(x+','+y); const k=(x+0.5)+','+(y+0.5); G.decor=G.decor.filter(d=>!(d.kind==='firepit' && d.x===x+0.5 && d.y===y+0.5)); };
  const wheel=(hx,hy,r,spd,ang0,gate)=>{ const w={kind:'spinwheel', x:hx+0.5, y:hy+0.5, hx:hx+0.5, hy:hy+0.5, r, spd, ang:ang0, armw:1.15, gate}; G.decor.push(w); G._eastWheels.push(w); };
  // a STATIONARY floating isle: a 3x3 block of solid footing over the pit, drawn as a raised
  // basalt slab. It never drifts (not added to G._eastSlabs) - you DASH from isle to isle.
  const isle=(cx,cy)=>{ for(let y=cy-1;y<=cy+1;y++) for(let x=cx-1;x<=cx+1;x++) pad(x,y);
    G.decor.push({kind:'driftslab', x:cx+0.5, y:cy+0.5, w:3, h:3}); };
  // CH1 - one slab. South ledge y119+, pit y109-118, far ledge y106-108. (learn the dash-board rhythm)
  chasm(28,52,109,118);
  wheel(40,113, 3.2, 0.9, Math.PI/2, 'g1');
  G._eastCross.push({gate:'g1', cy0:109, cy1:118, farY:106, startY:120.0});
  // (no crossing-gate here - dash the pit and walk on)
  // CH2 - two COUNTER-TURNING slabs, spaced so open pit always lies between them (no walking
  // across) + a TIMED LEVER on a side pad. Dash to the pad, pull the lever (the Causeway Gate
  // hauls up for 14s, then resets), dash back, then time the two slabs and slip through the gate
  // before it shuts. The slabs turn opposite ways so their tips meet (with a gap) mid-swing:
  // board the low slab at the ledge, dash to the high slab when they line up, dash off to the gate.
  chasm(28,52,87,100);
  wheel(40,96, 2.6,  1.2,  Math.PI/2, 'g2');   // low slab: swings toward the entrance ledge (dash to board)
  wheel(40,89, 2.6, -1.2, -Math.PI/2, 'g2');   // high slab: counter-turns, points to the far ledge at the start
  for(const [px,py] of [[34,96],[35,96],[34,97],[35,97],[34,98],[35,98]]) pad(px,py);   // the side pad (safe island, one dash N off the entrance ledge)
  G.decor.push({kind:'firelever', x:34.5, y:96.5, gate:'g2', on:false, label:'a fire-lever'});
  G._eastCross.push({gate:'g2', cy0:87, cy1:100, farY:86, startY:101.5, lever:true, leverDur:20});
  G.decor.push({kind:'firegate', gate:'g2', x:40.5, y:EDEEP.gate2.y+0.5, gy:EDEEP.gate2.y, x0:EDEEP.gate2.x0, x1:EDEEP.gate2.x1, open:false, perm:false, label:'the Causeway Gate'});
  // CH3 - three counter-turning slabs (the true test), then a roomy far-ledge landing. No
  // crossing-gate: dash all three slabs and walk on into the Floating Isles.
  chasm(28,52,70,83);
  wheel(40,80, 1.7,  1.0,  Math.PI/2, 'g3');
  wheel(40,74.8, 1.7, -1.0, -Math.PI/2, 'g3');
  wheel(40,69.6, 1.7,  1.0,  Math.PI/2, 'g3');
  G._eastCross.push({gate:'g3', cy0:70, cy1:83, farY:67, startY:84.5});
  // ============ R4 THE FLOATING ISLES: hop the stationary isles, ride the last (turning) one ====
  // A pit spanned by three fixed basalt isles you DASH between, then a single TURNING slab at the
  // north end - board it as it swings to the last isle, ride it round, and dash off to the far
  // ledge when it lines up. Miss any hop and you drop into the pit (climb out singed, -5 HP).
  chasm(28,52,50,61);
  // an evenly-stepped zigzag: each hop is the same short dash (dx2, dy3), centred on the room
  isle(40,59);   // first isle - one dash off the south ledge
  isle(38,56);   // second - a short dash up-left
  isle(40,53);   // third - back to centre; the turning slab waits just north of it
  wheel(40,50, 2.3, 0.85, -Math.PI/2, 'ga');   // the ROTATING isle: hop on at the third isle, ride it, hop off north
  G._eastCross.push({gate:'ga', cy0:50, cy1:61, farY:48, startY:62.5});
  // ============ R5 THE BAT ROOST: a wide field of stationary isles, crossed under bat assault ====
  // The final crossing before the dragon: a broad pit strewn with many fixed isles. Cave bats
  // pour out of the offscreen tunnels east and west and dive at you - a bite SHOVES you hard,
  // enough to knock you off an isle into the pit. Cut them down or weave through and press north.
  chasm(25,55,26,41);
  // the guaranteed north-bound spine - an even zigzag, every hop the same dash (dx2, dy3)
  isle(40,39); isle(38,36); isle(40,33); isle(38,30); isle(40,27);
  // ...and evenly-placed flanking isles: symmetric left/right pairs stepped up the room
  // (a multitude - wider routes, and room to dodge the bats), no longer bunched to one side
  isle(32,36); isle(48,36); isle(32,33); isle(48,33); isle(32,30); isle(48,30); isle(34,27); isle(46,27);
  G._eastCross.push({gate:'gb', cy0:26, cy1:41, farY:24, startY:43.5});
  // the Dragon Gate (Gate 3) - the boss-arena seal at the Bat Roost's north doorway. Starts OPEN;
  // it slams shut when you rouse Ashwing, then reopens when he's freed.
  G.decor.push({kind:'firegate', gate:'g3', x:40.5, y:EDEEP.gate3.y+0.5, gy:EDEEP.gate3.y, x0:EDEEP.gate3.x0, x1:EDEEP.gate3.x1, open:true, label:'the Dragon Gate'});
  // ---- THE EMBER KING'S HOARD (optional): an arcane ember-fence across the vault
  // doorway, solid until the FIRE STAFF unmakes it. Inside waits the Double Dash. ----
  const FENCE=[[53,75],[53,76],[53,77]];
  for(const [x,y] of FENCE) setSolid(x,y,1);
  const ward={kind:'staffgate', x:53.5, y:76.5, tiles:FENCE, open:false, label:'the Ember Ward'};
  G.decor.push(ward);
  G.decor.push({kind:'chest', x:58.5, y:76.5, deep:1, emberking:1});
  // ---- THE VAULT CROSSING: a STATIONARY stepping-stone. A drifting slab used to nudge you off,
  // so instead a fixed basalt slab sits mid-pit - DASH from the R3 far ledge onto it, then DASH
  // again onto the landing pad west of the Ember Ward (break the Ward with the fire staff). ----
  for(const [x,y] of [[50,75],[51,75],[52,75],[50,76],[51,76],[52,76],[50,77],[51,77],[52,77]]) pad(x,y);   // solid landing pad west of the fence
  for(const [x,y] of [[50,71],[51,71],[52,71],[50,72],[51,72],[52,72],[50,73],[51,73],[52,73]]) pad(x,y);   // the mid-pit stepping stone (solid footing)
  G.decor.push({kind:'driftslab', x:51.5, y:72.5, w:3, h:3});   // drawn as a raised stone slab; STATIC (not in G._eastSlabs, so it never drifts)
  G.decor.push({kind:'lamp', x:55.5, y:72.5}); G.decor.push({kind:'lamp', x:60.5, y:72.5});
  if(P.story && (P.story.emberWard || P.story.emberDone)){   // already broken - keep it open
    ward.open=true; for(const [x,y] of FENCE){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
  }
  // ---- ASHWING'S REST: the dragon dozes here; talking to him IS the finale ----
  edeepLava(24,6,1.6); edeepLava(56,6,1.6);
  G.decor.push({kind:'dragonrest', x:40.5, y:9.5});
  G.decor.push({kind:'chest', x:26.5, y:15.5, deep:1, rich:9});
  G.critters=[];
  // an already-won run (story-complete, or dev-toggled) opens straight to Ashwing: gates up
  // and the chasms filled to solid basalt, so there's no timing to redo
  if(P.story && P.story.emberDone){
    for(const b of G.decor){ if(b.kind==='firegate'){ b.open=true; for(let x=b.x0;x<=b.x1;x++){ setSolid(x,b.gy,0); setTile(x,b.gy,T.RUIN); } } }
    G.decor=G.decor.filter(d=>d.kind!=='firepit' && d.kind!=='spinwheel' && d.kind!=='firelever' && d.kind!=='driftslab');
    G._eastChasm=new Set(); G._eastWheels=[]; G._eastSlabs=[];
  }
}
// ---- FLOATING PLATFORMS (driftslabs) ----
// a slab drifts back and forth between (ax,ay) and (bx,by) and carries whoever rides it. Shared
// by the Emberdeep vault ferry and the Undermaw's floating-platform rooms.
function updateDriftSlabs(slabs, t){
  for(const s of (slabs||[])){ s.prevx=(s.x!=null?s.x:s.ax); s.prevy=(s.y!=null?s.y:s.ay);
    const u=(Math.sin(t*s.spd + (s.phase||0))+1)/2;
    s.x = s.ax + (s.bx-s.ax)*u; s.y = s.ay + (s.by-s.ay)*u; }
}
// if the player stands within a slab's footprint, carry them by the slab's motion; return true if aboard
function driftCarry(slabs){
  let best=null, bd=99;
  for(const s of (slabs||[])){ const dx=Math.abs(P.x-s.x), dy=Math.abs(P.y-s.y);
    if(dx<=(s.w||3)/2+0.2 && dy<=(s.h||3)/2+0.2 && (dx+dy)<bd){ best=s; bd=dx+dy; } }
  if(best){ const nx=P.x+(best.x-best.prevx), ny=P.y+(best.y-best.prevy);
    if(!circleBlocked(nx,ny,0.28)){ P.x=nx; P.y=ny; } return true; }
  return false;
}
// ROTATING PLATFORMS (spinwheels): if the player rides a turning slab-arm, sweep them around it.
// Returns true if aboard. Shared by the Undermaw (the Emberdeep keeps its own inline copy).
function wheelCarry(wheels, dt){
  let best=null, bestPerp=99;
  for(const w of (wheels||[])){ const dx=P.x-w.hx, dy=P.y-w.hy;
    const along=dx*Math.cos(w.ang)+dy*Math.sin(w.ang), perp=-dx*Math.sin(w.ang)+dy*Math.cos(w.ang);
    if(along>=-0.5 && along<=w.r+0.3 && Math.abs(perp)<=w.armw+0.5 && Math.abs(perp)<bestPerp){ best=w; bestPerp=Math.abs(perp); } }
  if(best){ const dA=best.spd*dt, dx=P.x-best.hx, dy=P.y-best.hy;
    const nx=best.hx + dx*Math.cos(dA)-dy*Math.sin(dA), ny=best.hy + dx*Math.sin(dA)+dy*Math.cos(dA);
    if(!circleBlocked(nx,ny,0.28)){ P.x=nx; P.y=ny; } return true; }
  return false;
}
// carry the player on the slab they're standing on, and drop them into the pit (restart the
// crossing, -5 HP) if the open pit under them has no slab. Mid-dash you're airborne over the
// pit - that's the only way across the gaps, so boarding a slab always takes an active dash.
function updateEastDeep(dt){
  const wheels=G._eastWheels||[]; if(!wheels.length) return;
  for(const w of wheels) w.ang += w.spd*dt;
  G._eastT=(G._eastT||0)+dt; updateDriftSlabs(G._eastSlabs, G._eastT);   // drift the vault ferry
  updateEmberBats(dt);   // the Bat Roost: swarm the bats and shove the player off the isles
  // chambers 1 and 3 have no crossing-gate now - only chamber 2's Causeway Gate, worked by its lever.
  // the lever gate: while its clock runs it stands open; stepping through it
  // (north of the gate) locks it for good, else it shuts when the clock runs out
  G._emberGateT=G._emberGateT||{};
  for(const c of (G._eastCross||[])){ if(!c.lever) continue;
    let t=G._emberGateT[c.gate]||0; if(t<=0) continue;
    t-=dt; G._emberGateT[c.gate]=t;
    const fg=G.decor.find(d=>d.kind==='firegate' && d.gate===c.gate);
    if(fg && !fg.perm && P.y < fg.gy){ fg.perm=true; G._emberGateT[c.gate]=0; banner('THE GATE HOLDS','THE WAY NORTH IS YOURS'); }
    else if(t<=0 && fg && !fg.perm){ emberCloseGate(c.gate); }
  }
  // a fall is in progress: run the drop animation, then respawn at the crossing's start
  if(G._emberDrop){ G._emberDrop.t+=dt;
    if(Math.random()<0.5) burst(G._emberDrop.x+rnd(-0.3,0.3), G._emberDrop.y+rnd(-0.2,0.2), '#c8621f', 1, 1.4);
    if(G._emberDrop.t>=G._emberDrop.dur) emberRespawn();
    return; }
  if(P.dead || (P.rollT||0)>0) return;   // mid-dash: airborne over the pit
  const tx=Math.floor(P.x), ty=Math.floor(P.y);
  if(!(G._eastChasm && G._eastChasm.has(tx+','+ty))) return;   // on a ledge / pad / solid - safe footing
  // grounded over the pit: on a slab -> carried; else -> fall
  let best=null, bestPerp=99;
  for(const w of wheels){ const dx=P.x-w.hx, dy=P.y-w.hy;
    const along=dx*Math.cos(w.ang)+dy*Math.sin(w.ang), perp=-dx*Math.sin(w.ang)+dy*Math.cos(w.ang);
    if(along>=-0.5 && along<=w.r+0.3 && Math.abs(perp)<=w.armw+0.5 && Math.abs(perp)<bestPerp){ best=w; bestPerp=Math.abs(perp); } }   // perp stays generous (never fall while aboard); along is snug so the slabs never bridge the pit
  if(best){
    const dA=best.spd*dt, dx=P.x-best.hx, dy=P.y-best.hy;
    const nx=best.hx + dx*Math.cos(dA)-dy*Math.sin(dA), ny=best.hy + dx*Math.sin(dA)+dy*Math.cos(dA);
    if(!circleBlocked(nx,ny,0.28)){ P.x=nx; P.y=ny; }
  } else if(driftCarry(G._eastSlabs)){ /* riding the vault ferry across the pit */ }
  else eastFall(ty);
}
// a fire-lever (CH2's side pad, CH3's far landing): hauls its gate open for a while, then resets
function pullFireLever(b){
  const c=(G._eastCross||[]).find(cc=>cc.gate===b.gate);
  const fg=G.decor.find(d=>d.kind==='firegate' && d.gate===b.gate);
  const name=(fg&&fg.label)||'the gate';
  if(fg && fg.perm){ toast('The '+name.replace(/^the /,'')+' already stands open.',2600); return; }
  b.on=true;
  const dur=(c&&c.leverDur)||14;
  G._emberGateT=G._emberGateT||{}; G._emberGateT[b.gate]=dur;
  if(fg){ fg.open=true; for(let x=fg.x0;x<=fg.x1;x++){ setSolid(x,fg.gy,0); setTile(x,fg.gy,T.RUIN); } }
  invalidateScenery&&invalidateScenery();
  Snd.quest&&Snd.quest(); buzz&&buzz(9); shockwave(b.x,b.y,'rgba(255,150,60,0.8)',40); burst(b.x,b.y-0.4,'#ffb04a',14,2.2);
  banner((name+' hauls up').toUpperCase(),'GO NORTH THROUGH IT');
  toast('The lever bites and '+name+' grinds up - it will fall again in <b>'+dur+' seconds</b>. <b>Go north through the gate before it shuts.</b>',5200);
}
function emberCloseGate(gate){
  const fg=G.decor.find(d=>d.kind==='firegate' && d.gate===gate); if(!fg || fg.perm) return;
  fg.open=false; for(let x=fg.x0;x<=fg.x1;x++){ setSolid(x,fg.gy,1); setTile(x,fg.gy,T.RUIN); }
  const fl=G.decor.find(d=>d.kind==='firelever' && d.gate===gate); if(fl) fl.on=false;
  invalidateScenery&&invalidateScenery(); Snd.hit&&Snd.hit(); G.shake=Math.max(G.shake||0,0.35);
  toast('The '+((fg.label||'gate').replace(/^the /,''))+' slams shut - the lever has reset. Work it again.',3600);
}
function eastFall(ty){
  if(G._emberDrop) return;   // already falling
  const c=(G._eastCross||[]).find(cc=>ty>=cc.cy0 && ty<=cc.cy1) || (G._eastCross||[])[0];
  // deduct the singe up front, then hand off to the drop animation (updateEastDeep ticks it)
  if(P.hp>1){ P.hp=Math.max(1, P.hp-5); if(typeof refreshUI==='function') refreshUI(); addFloat('-5',P.x,P.y-1.4,'#ff8a5a',0.95); }
  Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.5); buzz&&buzz(18);
  burst(P.x,P.y-0.3,'#ff9a3c',12,2.2); shockwave(P.x,P.y,'rgba(255,140,50,0.75)',38);
  P.click=null; P.moving=false; P.slideDir=null; P.rollT=0;
  G._emberDrop={ t:0, dur:0.62, x:P.x, y:P.y, startY:(c?c.startY:73.0) };
}
// end the drop: set the hero back on the crossing's south ledge and hand control back
function emberRespawn(){
  const d=G._emberDrop; G._emberDrop=null; if(!d) return;
  P.x=40.5; P.y=d.startY; P.click=null; P.moving=false; P.slideDir=null; P.rollT=0;
  if(G.cam){ G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
  if(!G._eastFallHint){ G._eastFallHint=1; toast('You plunge into the pit and haul yourself back out, singed (<b>-5 HP</b>). <b>DASH onto a slab when it swings to your ledge, ride it round, and dash off when it lines up with the next.</b>',5200); }
}
// THE BAT ROOST: cave bats pour out of the offscreen tunnels (west x~20, east x~60) and dive at
// the hero as they cross the isle-field. A bite SHOVES hard - enough to knock you off an isle
// into the pit. Capped, active only while you're in the roost and the dragon still sleeps. They
// fly straight in (over walls and pit alike) and can be cut down like any mob.
function updateEmberBats(dt){
  if(P.story && P.story.emberDone) return;   // dungeon already cleared - no swarm
  const inRoost = P.y>25 && P.y<45;           // the Bat Roost's y-band (R5)
  G._eastBatT=(G._eastBatT||0)-dt;
  if(inRoost && !P.dead && G._eastBatT<=0){
    G._eastBatT=3.0;
    const alive=(G.mobs||[]).filter(m=>m.bat && !m.dead).length;
    if(alive<4){
      G._eastBatN=(G._eastBatN||0)+1;
      const fromLeft=(G._eastBatN%2===0);
      const sx=fromLeft?20:60, sy=31+Math.floor(Math.random()*5);   // out of the tunnel mouths (y31-35)
      const m=spawnMob('bat', sx, sy);
      if(m){ m.bat=1; m.respawnT=-1; m.hx=sx; m.hy=sy; m.state='chase'; m.bob=Math.random()*TAU;
        burst(sx+0.5, sy+0.5, '#2a2233', 8, 2.0); Snd.hit&&Snd.hit(); }
    }
    if(!G._eastBatHint){ G._eastBatHint=1; toast('<b>Bats!</b> They swoop from the tunnels to either side - a bite will <b>shove you off an isle into the pit</b>. Cut them down or weave through, and press north to the Dragon Gate.',5200); }
  }
  for(const m of (G.mobs||[])){ if(!m.bat || m.dead) continue;
    // don't let a bat trail the hero through the Dragon Gate into Ashwing's arena - it wheels
    // back at the gate line and, if it somehow gets past, is culled rather than joining the boss.
    if(m.y<23.5){ if(m.y<21){ m.dead=true; burst(m.x,m.y-0.4,'#2a2233',8,1.8); continue; } m.y=23.5; }
    m.bob=(m.bob||0)+dt*9;
    const dx=P.x-m.x, dy=P.y-m.y, l=Math.hypot(dx,dy)||1;
    const sp=(MOBDEF.bat?MOBDEF.bat.speed:5)*(P.dead?0.4:1);
    m.x+=dx/l*sp*dt; m.y+=dy/l*sp*dt;   // flies straight in - over walls and the pit
    m.face=(dx<0?-1:1);
    if(l<0.85 && !P.dead && (P.rollT||0)<=0 && P.hurtT<=0){
      hurtPlayer(m.dmg||12, m);
      moveEntity(P, dx/l*0.8, dy/l*0.8);   // an extra shove - enough to knock you off an isle
      burst(P.x,P.y-0.4,'#2a2233',10,2.2);
    }
  }
}
function spawnMobsEastDeep(){
  // bristlebacks den on the ledges (NOT out over the lava) - fight them on solid footing
  // before you time the turning slabs. Kept off the central board-point (x40) and off any
  // chasm tile so nothing can bump you into the lava mid-crossing.
  const isChasm=(x,y)=>G._eastChasm && G._eastChasm.has(x+','+y);
  for(const [sx,sy] of [[34,119],[46,119],[34,100],[46,82]]){   // +47 with the lower chambers
    const sp=findOpenNear(sx,sy,4);
    if(sp && !isChasm(Math.round(sp[0]),Math.round(sp[1]))) spawnMob('boar', sp[0], sp[1]); }
}
function genEastDeepAll(){
  genEastDeep(); placeObjectsEastDeep(); spawnMobsEastDeep(); buildMapBase();
}
function enterEmberDungeon(){
  // the Emberthroat is sealed with a heavy ember-lock; only Vath's key opens it, and
  // you only get the key by taking his errand - so the dungeon cannot be run cold.
  if(!(P.story && (P.story.emberKey || P.story.emberDone || qs('wyrm')==='done'))){
    toast('A heavy <b style="color:var(--ember)">ember-lock</b> seals the throat of the mountain - no blade or shoulder will shift it. <i>The robed wanderer down in the village spoke of a key.</i>',5200);
    Snd.step&&Snd.step(5); return;
  }
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
  const msg={ g1:['THE EMBERFONT GATE RISES','THE WHEEL CATCHES AND TURNS'],
              g2:['THE CAUSEWAY GATE GRINDS UP','BOTH WHEELS TURN AS ONE'],
              g3:['THE DRAGON GATE OPENS','THE THREE WHEELS BLAZE'] }[gate];
  if(msg) banner(msg[0],msg[1]);
  if(gate==='g1') toast('The diverted flow floods the trough and the fire-wheel groans into motion - deep in the wall a counterweight lets go and the Emberfont Gate grinds up.',5000);
  else if(gate==='g2') toast('With both channels routed to their troughs, the twin wheels turn as one - old iron shrieks and the Causeway Gate hauls up into the rock.',5200);
  else toast('The last wheel blazes into life and all three turn together - the seal breaks and the Dragon Gate swings inward on a wash of heat. Ashwing rests just beyond.',5400);
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
/* THE EMBER WARD: an arcane fence across the hoard's doorway. The working feeds on
   a caster's own fire - so a plain steel edge, carrying none, cuts its threads
   where a spell would only be swallowed. A braced sword-strike unmakes it. */
function dispelStaffGate(b){
  if(!b || b.open) return;
  if(!(P.unlocked && P.unlocked.melee)){
    toast('An <b>arcane ember-ward</b> hums across the way. It drinks any fire thrown at it - but it has no answer for cold steel. You will want a <b style="color:var(--ember)">sword</b> in hand.',4800);
    Snd.step&&Snd.step(5); return;
  }
  b.open=true;
  for(const [x,y] of (b.tiles||[])){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
  P.story=P.story||{}; P.story.emberWard=1;
  if(typeof invalidateScenery==='function') invalidateScenery();
  Snd.magic&&Snd.magic(); G.shake=0.45;
  shockwave(b.x,b.y,'rgba(255,150,80,0.9)',44); burst(b.x,b.y-0.4,'#ffb060',20,2.6);
  banner('THE EMBER WARD BREAKS','THE HOARD LIES OPEN');
  autoSave&&autoSave();
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
  for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) setSolid(MI.x+dx, MI.y+dy, 0);  // clear the whole plot first
  for(let dy=-2;dy<=0;dy++) for(let dx=-2;dx<=2;dx++) setSolid(MI.x+dx, MI.y+dy, 1);  // solid tower mass; front face flush at MI.y so you can't slip up behind the mill
  setSolid(MI.x-2,MI.y-2,0); setSolid(MI.x+2,MI.y-2,0);                               // round off the two back corners - it's a round tower, not a box
  for(let dx=-1;dx<=1;dx++) setSolid(MI.x+dx, MI.y, 0);                               // arched doorway, dead-centre on the front face
  mill.door={x:MI.x+0.5, y:MI.y+1.4};                                                // hotspot one tile out front on open ground, right where you walk up
  // The Undermill dungeon is entered from INSIDE the windmill (its door opens the
  // mill interior, and a cellar stair there drops into the workings) - so there is
  // no exterior hatch out here in the city.
  const wheel=addBuilding('waterwheel', WH.x, WH.y, 'The Old Waterwheel');
  for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=4;dx++) setSolid(WH.x+dx, WH.y+dy, 0);  // clear the whole plot first
  for(let dy=-2;dy<=0;dy++) for(let dx=-2;dx<=3;dx++) setSolid(WH.x+dx, WH.y+dy, 1);  // mill-house + the wheel to its east; front face flush at WH.y so nothing slips behind
  for(let dx=-2;dx<=0;dx++) setSolid(WH.x+dx, WH.y, 0);                               // doorway on the mill-house front face, where the arch is drawn - open ground right in front
  wheel.door={x:WH.x-0.5, y:WH.y+1.4};                                               // hotspot one tile out front on clear ground, right where you walk up
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
  // A ferry moors at the Windsurf pier the moment you can cross the strait: in Act I once the
  // tide is calmed, and in Act II the moment the Warding Veil opens the sea-roads home. The boat
  // is your way BETWEEN the isles now - the dragon below only lifts you UP.
  if(P.story && (P.story.tideCalm || (P.story.act2 && P.story.vathVeil))) addBuilding('boat', D.x+2, D.y+6, '');
  // ASHWING waits at the HARBOUR, right beside Rell - the great dragon that bore you down onto
  // Windsurf stays at your side. He is the way UP: talk to him to fly to the Cloudreach. Crossing
  // between the isles is the ferryman's work now, not the dragon's, so his roost sits by the dock.
  { const sp=findOpenNear(D.x-3, D.y-2, 8) || [D.x-3, D.y-2];
    G.decor.push({kind:'ashwing', x:sp[0]+0.5, y:sp[1]+0.5, face:-1, name:'ASHWING', labelY:-82});
    setSolid(sp[0], sp[1], 1); }
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
  // spiral shells along the strand: keep trying until a dozen have landed on real
  // sand, spaced out - the old "22 random tries" almost always found bare grass and
  // left just one or two on the whole isle.
  let shells=0;
  for(let tries=0; tries<8000 && shells<12; tries++){ const ax=Math.floor(pr()*MAPW), ay=Math.floor(pr()*MAPH);
    if(tileAt(ax,ay)===T.SAND && !solidAt(ax,ay) && !G.nodes.some(n=>n.kind==='shell'&&dist(n.tx,n.ty,ax,ay)<5)){
      addNode('shell',ax,ay); shells++; } }
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
  // Innkeep of the Windsurf Inn - keeps the fire lit though no guest has rung the
  // bell in a season. Rooms are TEN GOLD (dialog handles 'Rest the night'), and
  // she keeps night hours (nightOwl) so a storm-late traveller can always rouse her.
  { const inn=makeNPC('wenna','Wenna the Innkeeper', T2.x-4.5, T2.y+6.3,
      {skin:'#caa27b',hair:'#4a3a2c',shirt:'#4a6a7a',pants:'#3a3a44',apron:'#d8cbb2',hairstyle:'bun'},
      ['Beds made, fire lit, and not a soul to fill them since the strait turned. Habit\'s a stubborn thing.',
       'Ten gold buys a bed and a hot breakfast - same as it\'s been thirty years. I\'ll not gouge a castaway.'],0.6);
    inn.nightOwl=true; G.npcs.push(inn); }
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
    // the shake + banner now ride the 'surface' entrance (fires as it breaches); keep the
    // toast for the gameplay hint, delayed until control returns to the player
    if(lv){ setTimeout(()=>toast('Something vast breaks the surface off the breakwater, ringed in <b style="color:#c9a0ff">violet light</b>. The <b>Bound Leviathan</b> has you now - it can chase you across any water, so keep to your board and end it.',6000),2800); }
  }
}
function spawnLeviathan(){
  if(G.mobs && G.mobs.some(m=>m.kind==='leviathan' && !m.dead)) return null;
  const h=leviathanHome();
  const lv=spawnMob('leviathan', h.x-0.5, h.y-0.5);
  if(lv){ lv.boss=true; lv.bigBoss=true; lv.rooted=1; lv.title='THE BOUND LEVIATHAN'; lv.ach='tidebreaker';
    lv.hx=h.x; lv.hy=h.y; lv.x=h.x; lv.y=h.y; lv.state='idle'; lv.noAggroT=0; lv.respawnT=-1;
    lv.entrance='surface'; lv.surf=0; }   // it swims up and breaches - shown, then the fight
  return lv;
}
function freeLeviathan(m){
  // Beaten, the binding shatters - the beast is a victim, not a foe. It does NOT sink at
  // once: like Ashwing when his spell breaks, it surfaces calm and UNBOUND (the violet
  // drains from its hide) and holds there while you speak, before it finally dives.
  m.freed=1; m.state='idle'; m.tx=null; m.hp=m.maxhp; m.surf=1; m.rooted=1; m.dead=false;
  m.windup=0; m.swing=0; m.lunge=0; m.shootCd=1e9; m.lungeCd=1e9; m.volleyCd=1e9; m.noAggroT=1e9; m.respawnT=-1;
  Snd.boss&&Snd.boss(); G.shake=0.9; G.slowmo=1.15;
  shockwave(m.x,m.y,'rgba(150,220,245,0.95)',95);
  for(let i=0;i<30;i++){ const a=Math.random()*TAU, sp=rnd(1,4);
    G.parts.push({x:m.x,y:m.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-0.8,life:rnd(0.8,1.7),color:Math.random()<0.5?'#bfe8ff':'#8fd0e0',size:rnd(2,5),grav:0.05}); }
  P.story.tideCalm=1; P.story.vathMet=1;
  bossReward(m);
  // the binding does not simply vanish - it sheds a cold shard of Vath's violet magic
  // onto the water, which you take up: a curse from Vath, and hard proof of his hand.
  if(typeof give==='function' && !(P.inv && P.inv.vathcurse)) give('vathcurse',1);
  // the strait is safe: the ferry can finally moor at the pier (it was hidden while
  // no hull could live in the water). Add it now so it's there without a reload.
  if(G.worldId==='wind' && !G.decor.some(d=>d.kind==='boat')){
    const D=WIND_ZONES.dock; addBuilding('boat', D.x+2, D.y+6, ''); invalidateScenery&&invalidateScenery();
  }
  banner('THE TIDE GOES CALM','THE STRAIT IS OPEN - BOATS MAY CROSS AGAIN');
  if(qs('tide')==='active') completeQuest('tide');
  updateWindFolkMood();
  // The freeing is now a full-overlay cutscene (js/38-leviathan-cutscene.js), the sea-mirror
  // of the Ashwing FREED bookend: the beast's thanks AND the reveal that Vath was here - a
  // robed man on the breakwater, violet at his wrists - play as one scene. When it ends, the
  // calmed beast finally dives.
  setTimeout(()=>{
    if(typeof leviathanFreedCutscene==='function') leviathanFreedCutscene(m, ()=>sinkLeviathan(m));
    else sinkLeviathan(m);
  },1400);
}
// The calmed, unbound beast finally slips back under - a shockwave and a scatter of cold spray
// as the water closes over it. Called when the freeing cutscene ends (or straight away if the
// overlay is missing). The Curse-Mark and the tide-calm state are already granted in
// freeLeviathan; the Vath reveal now lives inside the cutscene, not a story-card afterward.
function sinkLeviathan(m){
  if(m && !m.dead){ m.dead=true; m.respawnT=-1;
    shockwave(m.x,m.y,'rgba(150,220,245,0.9)',80);
    for(let i=0;i<26;i++){ const a=Math.random()*TAU, sp=rnd(1,3.6);
      G.parts.push({x:m.x,y:m.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp+0.4,life:rnd(0.7,1.5),color:Math.random()<0.5?'#bfe8ff':'#8fd0e0',size:rnd(2,5),grav:0.05}); } }
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
  placeWindHazard();
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
  // no flight-narration toast - the fade and the Cloudreach itself carry the moment
  flyToWorld('sky');
}
function askAshwingHome(){
  // Ashwing waits at the Windsurf harbour, the dragon that bore you down here - and he is the way
  // UP. Crossing between the isles is the ferry's work now (the boat at the pier); the dragon only
  // lifts you to the cloud-sea. NOT gated on the tide - the way up is always open.
  const btns=[ {label:'Fly up into the Cloudreach', cls:'gold', fn:()=>{ closeDialog(); flyToCloudreach(); }},
               {label:'Not just yet', ghost:true, fn:closeDialog} ];
  // open the dialog window (dlg.open + display + portrait) via lairDialog, not a bare setDialog
  // into a hidden panel - otherwise the flight menu never shows
  lairDialog('Ashwing','<i>Ashwing swings his great head round and rumbles low - warm, patient, ready. He\'ll carry you up past the last cloud whenever you say the word; the sea-crossings he leaves to the ferryman at the pier.</i>', btns);
}
/* The signal beacon on the Windward Bluffs. Until the strait is calmed you are stranded on
   Windsurf by the killing tide - no wing will risk that water. Once it's calm, lighting the
   beacon signals Ashwing down from the cloud-sea and he bears you up to the Cloudreach. */
function signalAshwing(b){
  if(!(P.story && P.story.tideCalm)){
    toast('A cold signal-brazier stands ready on the bluffs. But the strait below still boils and churns - <b>no wing would risk that water</b>. Calm the tide first, then call Ashwing down.',5200);
    Snd.step&&Snd.step(5); return;
  }
  if(b){ b.lit=1; invalidateScenery&&invalidateScenery(); }
  Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.3);
  P.story=P.story||{}; P.story.skyKnown=1;
  toast('You touch a flame to the beacon and it ROARS up gold against the sky. Far above, something vast peels off the cloud-sea and comes wheeling down - <b>Ashwing</b>, answering the signal.',5200);
  setTimeout(()=>{ askWindsurfFlight(); },2600);
}
// Where to, from Windsurf? Ashwing always bears you up to the Cloudreach; with the Cloud-Chart
// in hand he'll also fly you on to the Sunward Isle - the three isles the chart maps.
function askWindsurfFlight(){
  const haveChart = !!(P.story && P.story.skyMapTaken);
  const btns=[ {label:'Fly up to the Cloudreach', cls:'gold', fn:()=>{ closeDialog(); flyToCloudreach(); }} ];
  if(haveChart) btns.push({label:'Fly to the Sunward Isle', fn:()=>{ closeDialog();
    flyToWorld('east','You climb Ashwing\'s warm shoulder and he springs from the bluff - Windsurf falls away behind, and the Sunward Isle swells green out of the sea ahead.'); }});
  btns.push({label:'Not just yet', ghost:true, fn:closeDialog});
  lairDialog('Ashwing','<i>Ashwing settles on the bluff, wings spread against the wind, and rumbles low - where to?</i>', btns);
}
/* =====================================================================
   THE AERIE ISLE - Vath turned the sky against the island. Screaming
   raptors wall off the plateau; the only way in is the old Underclimb
   tunnel, to a sealed roost-heart where a cursed tome (and its serpent
   warden) must be destroyed to give the birds their minds back.
   ===================================================================== */
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
function destroyTome(b){
  if(b.destroyed) return;
  // the tome cannot be touched while the Tome-Warden still guards it - felling the serpent
  // is what breaks the binding. This holds whether the warden is roused or still sealed in
  // its crypt, so there's no slipping past it to burn the tome early.
  if(G.mobs && G.mobs.some(m=>(m.ach==='tomewarden'||m.kind==='serpent') && !m.dead)){
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
  // The burning now plays as a full-overlay cutscene (js/39-more-cutscenes.js): the cursed
  // tome flares and curls to violet ash, the maddened sky remembers itself, and a robed
  // after-image gives the Vath reveal. The falconers' account follows when it ends. Falls
  // back to the old toast if the overlay layer is absent.
  const falconers=()=>toast('The cursed tome curls to violet ash, and outside the screaming <b>stops</b> - all at once, mid-cry. When you climb back into daylight the falconers of Rookhaven crowd round, near weeping as their birds settle to the glove: “Our sky is ours again - <b>thank you</b>. It was a <b>robed man</b> did this to us, they say. Climbed the Underclimb quiet as smoke, violet at his sleeves, and never came down the same. If you cross him, friend - give him nothing.”',10000);
  setTimeout(()=>{
    if(typeof aerieFreedCutscene==='function') aerieFreedCutscene(b, falconers);
    else falconers();
  },1500);
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
let AERIE_WALLS = [];   // catacomb stone bordering the carved floor - drawn as visible ewall blocks
const AERIE_CRYPT_SEAL=[[73,32],[74,32],[75,32],[76,32],[77,32]];   // the crypt mouth; a portcullis slams shut here the moment you step into the Warden's Crypt
function genAerieDeep(){
  // the whole map begins as solid catacomb rock; we cut the chambers out of it
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  carve(66,108,84,124);   // the Underclimb Landing (entry hall)
  carve(73,96,77,110);    // corridor A -> the Ossuary
  carve(58,76,92,96);     // THE OSSUARY - plate puzzle chamber
  carve(73,64,77,78);     // corridor B (the Bone Gate sits at y=70)
  carve(58,42,92,64);     // THE GALLERY OF SIGILS - ordered-plate chamber
  carve(73,32,77,44);     // corridor C (the Sepulchre Gate sits at y=38)
  carve(52,10,98,32);     // THE WARDEN'S CRYPT - boss chamber
  // wall off a REWARD ROOM across the top of the crypt (y10-12); the gap (x73-77) is left as floor
  // so the wall-face pass below excludes it - a catgate seals it in placeObjects until the warden falls
  for(let x=52;x<=98;x++){ if(x>=73 && x<=77) continue; setTile(x,13,T.RUIN); setSolid(x,13,1); }
  // record the visible wall faces (stone bordering the carved floor) BEFORE the gates
  // go solid, so a raised gate never leaves a phantom wall block behind
  AERIE_WALLS=[];
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(!solidAt(x,y)) continue;
    let border=false;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])
      if(inb(x+dx,y+dy) && !solidAt(x+dx,y+dy)){ border=true; break; }
    if(border) AERIE_WALLS.push([x,y]);
  }
  // the two sealed gates begin as solid stone across their corridors (drawn by the catgate)
  for(let x=73;x<=77;x++){ setTile(x,70,T.RUIN); setSolid(x,70,1); }  // BONE GATE
  for(let x=73;x<=77;x++){ setTile(x,38,T.RUIN); setSolid(x,38,1); }  // SEPULCHRE GATE
  // decorative bone-pits flanking the crypt (non-blocking floor detail via tiles)
}
function placeObjectsAerieDeep(){
  G.decor=G.decor||[];
  // the catacomb walls that give the chambers their shape (static baked scenery) - so
  // the solid stone reads as real walls, never invisible collision
  for(const [x,y] of AERIE_WALLS) G.decor.push({kind:'ewall', x:x+0.5, y:y+0.5, s:((x*7+y*13)%5)});
  // the way back up the Underclimb, in the landing hall
  G.decor.push({kind:'tunnelmouth', x:75.5, y:122.5, deep:1, up:1, label:'the way up'});
  setSolid(75,122,0); setTile(75,122,T.RUIN);
  // torches lighting the long dark
  for(const [tx,ty] of [[68,110],[82,110],[60,78],[90,78],[60,44],[90,44],[56,12],[94,12],[70,14],[80,14]])
    if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // catacomb dressing: broken columns (the readable crypts have been removed)
  for(const [px,py,br] of [[62,90,1],[88,90,0],[62,50,0],[88,50,1],[58,20,1],[92,20,0]])
    G.decor.push({kind:'pillarBroken', x:px+0.5, y:py+0.5, broken:!!br});
  // ---- THE WARD-MAZE ----
  // Each chamber is a long maze of solid stone cut through by a snaking corridor you must weave.
  // Vath's curse fires lances of violet light ACROSS each corridor on a beat: watch the telegraph
  // and slip past a lance only while it's dark. Touch a live lance and you're ZAPPED - you wake at
  // the hall's mouth with a little less blood (-5 HP). At the far end of each maze a WARD-PLATE
  // waits; step onto it to grind the gate up. Cursed raptors keep swooping in as you go.
  G._aerieVoid=new Set(); G._aerieCross=[]; G._aerieFallHint=0; G._aerieT=0; G._aerieBeams=[]; G._aerieMazeTiles=[];
  G._aerieSpawnT=6; G._aerieZap=null;
  const beam=(x,y,dx,dy,len,period,phase)=>{ const b={kind:'skybeam', x, y, dx, dy, len, period, phase, on:false, warn:0}; G.decor.push(b); G._aerieBeams.push(b); };
  // A WIDE BRANCHING GRID-MAZE: a spanning tree over a cols x rows grid of 3-wide cells, so the
  // corridors fork into many FALSE PATHS and dead ends. Enter from the south, and the ward-plate
  // that unlocks the gate is hidden in the dead end FARTHEST from the door - so you must weave the
  // whole maze to reach it, then double back to the gate. Ward-lances span each guarded corridor
  // WALL TO WALL, the first one right off the entry.
  const LANE=3, PITCH=4;   // 3-wide corridors, 1-wide walls between cells
  const aerieMaze=(o)=>{
    const {x0,y0,cols,rows,col,wall,entryStub,gateStub,gateObj,cross,period,seed,beams=3}=o;
    const safe=new Set();
    const cX=cx=> x0 + cx*PITCH, cY=cy=> y0 + cy*PITCH;
    const addRect=(ax,ay,w,h)=>{ for(let dx=0;dx<w;dx++) for(let dy=0;dy<h;dy++) safe.add((ax+dx)+','+(ay+dy)); };
    const doorE=(cx,cy)=> addRect(cX(cx)+LANE, cY(cy), 1, LANE);   // open the wall between (cx,cy)&(cx+1,cy)
    const doorS=(cx,cy)=> addRect(cX(cx), cY(cy)+LANE, LANE, 1);   // open the wall between (cx,cy)&(cx,cy+1)
    // seeded DFS spanning tree (deterministic, so shared test links show the same maze)
    let s=(seed>>>0)||1; const rng=()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
    const K=(cx,cy)=>cx+','+cy, adj={}; const link=(a,b)=>{ (adj[a]=adj[a]||[]).push(b); (adj[b]=adj[b]||[]).push(a); };
    const eCx=col, eCy=rows-1, gCx=col, gCy=0, vis=new Set(), stack=[[eCx,eCy]]; vis.add(K(eCx,eCy));
    while(stack.length){ const [cx,cy]=stack[stack.length-1], nb=[];
      if(cx>0 && !vis.has(K(cx-1,cy))) nb.push([cx-1,cy,'W']);
      if(cx<cols-1 && !vis.has(K(cx+1,cy))) nb.push([cx+1,cy,'E']);
      if(cy>0 && !vis.has(K(cx,cy-1))) nb.push([cx,cy-1,'N']);
      if(cy<rows-1 && !vis.has(K(cx,cy+1))) nb.push([cx,cy+1,'S']);
      if(!nb.length){ stack.pop(); continue; }
      const [nx,ny,dir]=nb[(rng()*nb.length)|0]; vis.add(K(nx,ny)); link(K(cx,cy),K(nx,ny));
      if(dir==='E') doorE(cx,cy); else if(dir==='W') doorE(nx,ny); else if(dir==='S') doorS(cx,cy); else doorS(nx,ny);
      stack.push([nx,ny]); }
    for(let cy=0;cy<rows;cy++) for(let cx=0;cx<cols;cx++) addRect(cX(cx), cY(cy), LANE, LANE);   // carve every cell
    addRect(cX(col), entryStub[0], LANE, entryStub[1]-entryStub[0]+1);   // entry stub -> south corridor
    addRect(cX(col), gateStub[0],  LANE, gateStub[1]-gateStub[0]+1);     // gate stub  -> north corridor
    // BFS from the gate cell: distances + parents, for the main path and the farthest dead end
    const dist={}, par={}, gK=K(gCx,gCy); dist[gK]=0; const q=[gK];
    for(let i=0;i<q.length;i++){ for(const n of (adj[q[i]]||[])){ if(!(n in dist)){ dist[n]=dist[q[i]]+1; par[n]=q[i]; q.push(n); } } }
    // the ward-plate: the leaf cell (a dead end) farthest from the gate, never the entry/gate itself
    let plateK=K(eCx,eCy), best=-1;
    for(const k in dist){ if(k===K(eCx,eCy)||k===gK) continue; if((adj[k]||[]).length===1 && dist[k]>best){ best=dist[k]; plateK=k; } }
    const [pcx,pcy]=plateK.split(',').map(Number), plateTile=[cX(pcx)+1, cY(pcy)+1];
    // wall-fill the chamber around the carved maze
    for(let y=wall[1];y<=wall[3];y++) for(let x=wall[0];x<=wall[2];x++){ if(!inb(x,y)||solidAt(x,y)||safe.has(x+','+y)) continue;
      setSolid(x,y,1); G._aerieMazeTiles.push([x,y]); G.decor.push({kind:'ewall', x:x+0.5, y:y+0.5, s:((x*7+y*13)%5), maze:true}); }
    // the true path entry -> gate, for placing the ward-lances that guard it
    const path=[]; let k=K(eCx,eCy); while(k && k!==gK){ path.push(k); k=par[k]; } path.push(gK);
    const innerN=path.length-2; const idxs=[];
    for(let i=0;i<Math.min(beams,innerN);i++) idxs.push(1+Math.floor((i+1)*innerN/(Math.min(beams,innerN)+1)));
    if(innerN>0) idxs[0]=1;   // the FIRST lance sits in the first corridor off the entry
    const seenB=new Set();
    idxs.filter(j=>j>=1 && j<=path.length-2 && !seenB.has(j) && seenB.add(j)).forEach((j,i)=>{
      // anchor the lance ACROSS the doorway chokepoint between this path cell and the next: a
      // doorway is always exactly LANE wide with solid wall on both sides, so a lance spanning it
      // (plus a tile into each wall) is guaranteed to connect WALL TO WALL - no slipping past its end.
      const A=path[j].split(',').map(Number), B=path[j+1].split(',').map(Number);
      const ax=A[0],ay=A[1],bx=B[0],by=B[1]; let lx,ly,ldx,ldy;
      if(bx>ax){ lx=cX(ax)+LANE+0.5; ly=cY(ay)+LANE/2; ldx=0; ldy=1; }        // east doorway  -> vertical lance
      else if(bx<ax){ lx=cX(ax)-0.5;    ly=cY(ay)+LANE/2; ldx=0; ldy=1; }     // west doorway
      else if(by>ay){ lx=cX(ax)+LANE/2; ly=cY(ay)+LANE+0.5; ldx=1; ldy=0; }   // south doorway -> horizontal lance
      else          { lx=cX(ax)+LANE/2; ly=cY(ay)-0.5;     ldx=1; ldy=0; }    // north doorway
      beam(lx, ly, ldx, ldy, LANE/2+1.0, period, (i*0.37)%1); });   // len reaches a tile into each wall
    // tonic caches in the next-farthest dead ends
    const leaves=Object.keys(adj).filter(kk=>(adj[kk]||[]).length===1 && kk!==plateK && kk!==K(eCx,eCy) && kk!==gK).sort((a,b)=>dist[b]-dist[a]);
    for(const lk of leaves.slice(0,2)){ const [lx,ly]=lk.split(',').map(Number); G.decor.push({kind:'chest', x:cX(lx)+1.5, y:cY(ly)+1.5, deep:1, potions:1}); }
    // the ward-plate, planted in the far dead end
    G.decor.push({kind:'boneplate', x:plateTile[0]+0.5, y:plateTile[1]+0.5, gate:cross.gate, pressed:false, label:'a ward-plate'});
    cross.plate=[plateTile[0], plateTile[1]];
    G.decor.push(gateObj); G._aerieCross.push(cross);
  };
  // CHAMBER 1 - THE OSSUARY: a wide 8x4 grid-maze -> a far ward-plate -> the Bone Gate
  aerieMaze({ x0:59, y0:78, cols:8, rows:4, col:4, wall:[58,76,92,96], entryStub:[90,96], gateStub:[76,80],
    gateObj:{kind:'beamgate', x:75, y:70, x0:73, x1:77, tiles:[[73,70],[74,70],[75,70],[76,70],[77,70]], gate:'bone', openAmt:0, open:false, done:false, label:'the Bone Gate'},
    cross:{gate:'bone', openY:77, southY:95.0, entryX:75}, period:2.5, seed:52411, beams:3 });
  // CHAMBER 2 - THE GALLERY: a wide 8x5 grid-maze, faster lances -> a far ward-plate -> the Sepulchre Gate
  aerieMaze({ x0:59, y0:44, cols:8, rows:5, col:4, wall:[58,42,92,64], entryStub:[60,64], gateStub:[42,46],
    gateObj:{kind:'beamgate', x:75, y:38, x0:73, x1:77, tiles:[[73,38],[74,38],[75,38],[76,38],[77,38]], gate:'sep', openAmt:0, open:false, done:false, label:'the Sepulchre Gate'},
    cross:{gate:'sep', openY:43, southY:61.0, entryX:75}, period:2.1, seed:60947, beams:4 });
  // the cursed tome, on its lectern at the crypt's far wall behind the warden.
  // a already-won run (story-complete, or dev-toggled) shows it already burnt.
  G.decor.push({kind:'tome', x:75.5, y:14.5, destroyed:!!(P.story&&P.story.aerieFreed), deep:1});
  setSolid(75,14,1);
  // THE CRYPT SEAL - a portcullis at the crypt mouth. It stands open as you approach; stepping
  // into the Warden's Crypt slams it shut behind you (see updateAerieDeep), so the Tome-Warden's
  // rise (and the fight) begins only once you're inside, with no way back out until it falls.
  G._cryptSealed=0;
  G.decor.push({kind:'catgate', x:75, y:32, open:true, gate:'crypt', tiles:AERIE_CRYPT_SEAL.slice(), label:'the Sepulchre Seal'});
  // THE REWARD ROOM: the warden's hoard + the climb-out, walled off across the top of the crypt
  // (partition laid in genAerieDeep), sealed until the Tome-Warden falls (killMob -> openRewardRoom).
  buildRewardRoom({ x0:52, x1:98, wallY:13, gx0:73, gx1:77, floorT:T.RUIN, sealInGen:true,
    chest:{kind:'chest', x:58.5, y:11.5, deep:1}, exitX:90, exitY:11,
    cleared:!!(P.story && P.story.aerieFreed) });
  G.critters=[];
  // a cleared run leaves the gates open and the pits floored over (no crossing to redo)
  if(P.story && P.story.aerieFreed){
    for(const g of G.decor){ if(g.kind==='beamgate'){ g.done=true; g.open=true; g.openAmt=1; for(const [x,y] of g.tiles){ setSolid(x,y,0); setTile(x,y,T.RUIN); } } }
    for(const [x,y] of (G._aerieMazeTiles||[])){ setSolid(x,y,0); setTile(x,y,T.RUIN); }   // tear the maze walls down
    G.decor=G.decor.filter(d=>!(d.kind==='ewall'&&d.maze) && d.kind!=='skybeam'); G._aerieMazeTiles=[]; G._aerieBeams=[];
  }
}
function spawnMobsAerieDeep(){
  const Z=AERIEDEEP_ZONES;
  if(!(P.story && P.story.aerieFreed)){
    const sp=findOpenNear(Z.crypt.x, Z.crypt.y, 6) || [Z.crypt.x, Z.crypt.y];
    const sn=spawnMob('serpent', sp[0], sp[1]);
    // sealed = inert and unseen until you step into the crypt and the seal shuts behind you
    // (updateAerieDeep reveals it and hands into its rise entrance then) - so the Tome-Warden
    // never coils waiting in view; it hauls up out of the crypt floor once there's no backing out.
    if(sn){ sn.boss=true; sn.bigBoss=true; sn.sealed=true; sn.title='THE TOME-WARDEN'; sn.entranceSub='GUARDIAN OF THE CURSED TOME'; sn.ach='tomewarden'; sn.hx=sp[0]; sn.hy=sp[1]; sn.state='idle'; sn.respawnT=-1; sn.entrance='rise'; }
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
      banner('THE UNDERCLIMB','A CATACOMB, NOT A ROOST - PUT DOWN THE WARDEN');
      setTimeout(()=>toast('The tunnel does not climb - it <b>descends</b>, into cold bone-and-stone dark. At the very bottom, past two sealed gates, coils the <b>Tome-Warden</b>. Put it down and the cursed tome it guards crumbles with it - that breaks the curse.',7000),1200);
    } }, 300);
}
function exitAerieDungeon(){
  // Vath's curse seals the climb: you cannot leave (to slip away and heal) until the cursed tome
  // is destroyed. Once it's burnt, the way up is free.
  if(!(P.story && P.story.aerieFreed)){
    Snd.hit&&Snd.hit(); G.shake=Math.max(G.shake||0,0.3);
    banner('THE CLIMB IS SEALED','PUT DOWN THE WARDEN TO LEAVE');
    toast('Violet frost crawls across the stair and will not let you pass. <b>The curse seals the Underclimb until the Tome-Warden falls</b> - put the serpent down and the tome crumbles with it, then the way up opens.',5200);
    return;
  }
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.click=null;
  setTimeout(()=>{ switchWorld('aerie');
    const r=P._aerieReturn; if(r){ P.x=r.x; P.y=r.y; G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
// distance from a point to a line segment (used by the ward-lance hit test)
function distToSeg(px,py, ax,ay, bx,by){
  const dx=bx-ax, dy=by-ay, l2=dx*dx+dy*dy;
  let tt = l2? ((px-ax)*dx+(py-ay)*dy)/l2 : 0; tt=Math.max(0,Math.min(1,tt));
  const cx2=ax+tt*dx, cy2=ay+tt*dy; return Math.hypot(px-cx2, py-cy2);
}
// a live lance ZAPS you: freeze, play the shock, then wake at the hall's mouth with -5 HP
function aerieZapStart(){
  if(G._aerieZap) return;
  if(P.hp>1){ P.hp=Math.max(1, P.hp-5); if(typeof refreshUI==='function') refreshUI(); addFloat('-5',P.x,P.y-1.4,'#d8b0ff', 0.95); }
  Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.55); buzz&&buzz(24); G.flash=Math.max(G.flash||0,0.3);
  G._aerieZap={ t:0, dur:0.62, x:P.x, y:P.y };
  P.click=null; P.moving=false; P.slideDir=null; P.rollT=0;
}
function aerieRespawn(){
  const z=G._aerieZap; G._aerieZap=null; if(!z) return;
  const py=Math.floor(z.y);
  const c=(G._aerieCross||[]).find(cc=>py>=cc.openY && py<cc.southY) || (G._aerieCross||[])[0];
  burst(P.x,P.y-0.3,'#d8b0ff', 14, 2.4); shockwave(P.x,P.y,'rgba(199,123,255,0.8)', 40);
  if(c){ P.x=(c.entryX!=null?c.entryX:75)+0.5; P.y=c.southY; }
  P.click=null; P.moving=false; P.slideDir=null; P.rollT=0;
  if(G.cam){ G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
  if(!G._aerieFallHint){ G._aerieFallHint=1; toast('The ward-lance <b>zaps you senseless</b> and you wake at the hall\'s mouth, singed (<b>-5 HP</b>). <b>A lit lance is death</b> - weave the stone maze and slip across each corridor only while its lance is dark.',5600); }
}
// THE WARD-MAZE: violet lances sweep each corridor on a beat; touch a live one and you're zapped
// (-5 HP restart). Step on the far ward-plate to open the gate. Cursed raptors swoop in as you go.
function updateAerieDeep(dt){
  const t=(G._aerieT=(G._aerieT||0)+dt);
  for(const b of (G._aerieBeams||[])){
    const p=((t/b.period + b.phase)%1 + 1)%1;
    b.warn = (p>=0.55 && p<0.70)? (p-0.55)/0.15 : 0;
    b.on   = p>=0.70 && p<0.92;
    if(b.on && Math.random()<0.5){   // sparks streaming off a live lance
      const s=rnd(-b.len,b.len); G.parts.push({x:b.x+b.dx*s, y:b.y+b.dy*s, vx:rnd(-0.4,0.4), vy:rnd(-0.6,0.2), life:rnd(0.2,0.5), color:'rgba(199,123,255,0.7)', size:rnd(1,2.4), grav:0}); }
  }
  // stepping on a chamber's WARD-PLATE grinds its gate up
  for(const c of (G._aerieCross||[])){ if(!c.plate) continue; const g=G.decor.find(d=>d.kind==='beamgate' && d.gate===c.gate);
    if(g && !g.done && !P.dead && !G._aerieZap && Math.floor(P.x)===c.plate[0] && Math.floor(P.y)===c.plate[1]){
      g.done=true; const pl=G.decor.find(d=>d.kind==='boneplate' && d.gate===c.gate); if(pl) pl.pressed=true;
      Snd.quest&&Snd.quest(); shockwave(g.x,g.y,'rgba(199,123,255,0.8)',48); G.shake=Math.max(G.shake||0,0.4);
      if(g.gate==='bone') banner('THE BONE GATE GRINDS UP','THE GALLERY LIES BEYOND');
      else { banner('THE SEPULCHRE GATE GRINDS UP','THE WARDEN AWAITS BELOW'); toast('The ward-plate sinks and the Sepulchre Gate grinds up. Something vast uncoils in the crypt ahead.',5000); } } }
  // the gates ease up once their plate is pressed; keep their tiles' solidity in step
  for(const g of G.decor){ if(g.kind!=='beamgate') continue;
    g.openAmt = g.done? Math.min(1,(g.openAmt||0)+dt*3) : 0;
    const openNow=g.openAmt>0.55;
    if(openNow!==g.open){ g.open=openNow; for(const [x,y] of g.tiles) setSolid(x,y, openNow?0:1); }
  }
  // THE CRYPT SEAL: stepping into the Warden's Crypt with the Tome-Warden alive slams a portcullis
  // shut behind you, and the serpent hauls up out of the crypt floor - so the fight (and its rise
  // entrance) begins only once you're inside the room, with no retreat.
  if(!G._cryptSealed && !(P.story&&P.story.aerieFreed) && P.y<=31 && P.y>=10 && P.x>=52 && P.x<=98
     && (G.mobs||[]).some(m=>m.ach==='tomewarden' && !m.dead)){
    G._cryptSealed=1; for(const [x,y] of AERIE_CRYPT_SEAL) setSolid(x,y,1);
    const cg=G.decor.find(d=>d.kind==='catgate' && d.gate==='crypt'); if(cg) cg.open=false;
    invalidateScenery&&invalidateScenery(); Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.5); buzz&&buzz(20);
    banner('THE CRYPT SEALS BEHIND YOU','NO RETREAT - PUT DOWN THE TOME-WARDEN');
    // now that the way back is shut, the Tome-Warden rises: reveal it and hand into its entrance beat
    const boss=(G.mobs||[]).find(m=>m.ach==='tomewarden' && !m.dead);
    if(boss){ boss.sealed=false;
      if(typeof startBossIntro==='function' && !boss.entranceDone && !G.bossIntro)
        startBossIntro(boss,{kind:boss.entrance, title:boss.title, sub:boss.entranceSub}); }
  }
  // the zap plays out, then respawns you
  if(G._aerieZap){ G._aerieZap.t+=dt; if(G._aerieZap.t>=G._aerieZap.dur) aerieRespawn(); return; }
  // cursed raptors keep swooping in (capped) while the tome still holds the sky
  if(!(P.story && P.story.aerieFreed)){
    G._aerieSpawnT=(G._aerieSpawnT||0)-dt;
    if(G._aerieSpawnT<=0){ G._aerieSpawnT=9;
      const alive=(G.mobs||[]).filter(m=>m.aerieAdd && !m.dead).length;
      if(alive<3 && P.y<102 && P.y>30){ const sp=findOpenNear(Math.round(P.x+rnd(-6,6)), Math.round(P.y-rnd(3,7)), 5);
        if(sp){ const m=spawnMob('raptor', sp[0], sp[1]); if(m){ m.aerieAdd=1; m.respawnT=-1; } } } }
  }
  if(P.dead) return;
  // a live lance is lethal - the maze walls are solid, so timing the lances is the only danger
  for(const b of (G._aerieBeams||[])){ if(!b.on) continue;
    const d=distToSeg(P.x,P.y, b.x-b.dx*b.len, b.y-b.dy*b.len, b.x+b.dx*b.len, b.y+b.dy*b.len);
    if(d<0.5){ aerieZapStart(); return; } }
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
  // spaced well apart around the hollow so each igloo reads as its own dwelling,
  // not a huddle stacked on top of the well
  addBuilding('igloo', V.x-8, V.y-4, 'Hearthhold igloo');
  addBuilding('igloo', V.x+6, V.y-5, 'The Kettle & Hearth (Inn)');
  addBuilding('igloo', V.x+8, V.y+4, 'The Icewright\'s igloo');
  addBuilding('igloo', V.x-7, V.y+5, 'Frostferry lodge');
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
    ['Two moons of this cursed cold, and the strait locked dead and silent - no seal on the floes, no fish beneath them. Hearthhold is eating its own boots.',
     'The Warden used to keep our winters KIND - deep snow and thick safe ice, seals fat on the floes and fish under them. A hard season, but a living one. Then a robed man walked onto the glacier, and the cold turned cruel - violet frost, and the life went out of the ice.',
     'You\'ll want the Rimefissure if you mean to fix this at the root - a crack in the ice that opened the night the cold came, right off the glacier road. We put a cairn and lamps at the turn so none of ours wanders past it. Mind the warren down there; three old frost-locks bar the deep gate, and you must throw them all.'],0.4));
  G.npcs.push(makeNPC('sigrid','Sigrid the Icewright', V.x+4.5, V.y+3.5,
    {skin:'#b58a5e',hair:'#8a7a5e',shirt:'#5a6a5a',pants:'#3a3a2c',hairstyle:'bun'},
    ['Wrap up warm and mind the glacier - the Warden is up there, and it is not itself.',
     'It was never a monster, friend. It is the kindest thing on this rock. Whatever holds it now is not.',
     'And keep off the Rimewood flats unless you mean to fight - a great white bear has denned in the old ice-cave out there. Hoarfrost, the hunters call it. Whatever it guards down that hole, it guards it jealously.'],0.4));
  // ---- Greta: keeps The Kettle & Hearth, Hearthhold's one warm bed ----
  { const inn=makeNPC('greta','Greta the Innkeeper', V.x+3.5, V.y-0.3,
    {skin:'#c2a488',hair:'#cfc7b8',shirt:'#5a4a5e',pants:'#3a3340',apron:'#b8a890',hairstyle:'bun'},
    ['The Kettle & Hearth keeps the only fire in Hearthhold that never goes cold. Ten gold for a bed by it, and a bowl of whatever\'s in the pot.',
     'No seals on the floes, no fish beneath them - but a warm bed I can still give you. Rest here whenever the ice gets into your bones.',
     'Come in from that wind before it takes your ears off. Sleep\'s ten gold; the thaw, if you can win it, is on the house.'],0.5);
    inn.nightOwl=true; G.npcs.push(inn); }   // an innkeep on a frozen coast keeps the hearth lit round the clock
}
function spawnFrostWarden(){
  if(G.mobs && G.mobs.some(m=>m.kind==='frostwarden' && !m.dead)) return null;
  const GL=FROST_ZONES.glacier, sp=findOpenNear(Math.round(GL.x), Math.round(GL.y), 5) || [GL.x, GL.y];
  const w=spawnMob('frostwarden', sp[0], sp[1]);
  if(w){ w.boss=true; w.bigBoss=true; w.enspelled=true; w.title='THE WEEPING WARDEN'; w.ach='thawwarden'; w.hx=sp[0]; w.hy=sp[1]; w.state='idle'; w.respawnT=-1; w.entrance='enthrall'; }
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
    if(bear){ bear.boss=true; bear.bigBoss=true; bear.title='THE HOARFROST BEAR'; bear.subtitle='TERROR OF THE RIMEWOOD'; bear.vaultbear=1; bear.ach='bearslayer'; bear.hx=sp[0]; bear.hy=sp[1]; bear.respawnT=-1; bear.entrance='loom'; }
  }
}
function freeWarden(m){
  m.freed=1; m.enspelled=false; m.dead=true; m.respawnT=-1; m.state='idle';
  Snd.boss&&Snd.boss(); G.shake=0.9; G.slowmo=1.15;
  shockwave(m.x,m.y,'rgba(180,225,245,0.95)',95);
  for(let i=0;i<32;i++){ const a=Math.random()*TAU, sp=rnd(1,4);
    G.parts.push({x:m.x,y:m.y-0.4,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:rnd(0.8,1.8),color:Math.random()<0.5?'#bfe8ff':'#e6f6ff',size:rnd(2,4.5),grav:0.05}); }
  P.story.frostFreed=1; P.story.vathMet=1;
  bossReward(m);
  banner('THE ICE WEEPS AGAIN','THE WARDEN IS FREE - THE CRUEL COLD BREAKS');
  if(qs('thaw')==='active') completeQuest('thaw');
  updateFrostFolkMood();
  // Felling the surface Warden breaks the cruel cold - but the thing that hides you
  // from Vath (the WARDING VEIL) is not earned here. It waits deeper: the hush-frost
  // spellbook in the Rimefissure's reward chest, read into a spell by your brother.
  // Sigrid points the way down. (see openChest `veiltome` + the 'brother' scene.)
  // The freeing now plays as a full-overlay cutscene (js/39-more-cutscenes.js) - the same
  // freed-victim bookend the Leviathan got: the violet sloughs off, the Warden weeps clean
  // meltwater, a soft winter returns, and Vath is glimpsed on the glacier road. When it ends,
  // Sigrid's pointer card (the trail down to the Rimefissure) follows. Falls back to the old
  // story-card if the overlay layer is absent.
  const sigridCard=()=>storyCard('<i>On the road down, </i><b>Sigrid</b><i> catches your hands.</i> “You gave us back our guardian. And if you\'ve the nerve for the deep, there\'s one thing more: an <b>old warding sleeps in the ice down the Rimefissure</b>, past whatever the cold bound there - older than this curse, older than the crown, and no one living has read a word of it. Old magic, old script. Take it to your brother; a scholar\'s the only one who could ever work it.”',
    {onOk:()=>{ if(typeof autoSave==='function') autoSave(); }});
  setTimeout(()=>{
    if(typeof wardenFreedCutscene==='function') wardenFreedCutscene(m, sigridCard);
    else sigridCard();
  },1400);
}
// The WARDING VEIL: a warding read from the hush-frost spellbook the Rimebound guarded,
// hiding its bearer from Vath's eye and letting you steal back to the old islands (all but
// the capital, which Vath holds outright). The book is retrieved from the Rimefissure's
// reward chest (the Hush-Frost Spellbook) and cast by your brother Jaist in dialogue; this
// helper just sets the flags. `silent` sets them with no fanfare - used by that scene (which
// plays its own casting cutscene), save-migration, and the dev menu.
function grantVathVeil(silent){
  P.story=P.story||{}; if(P.story.vathVeil) return;
  P.story.vathVeil=1; P.spells=P.spells||{}; P.spells.veil=1;
  // the old islands wear their curses (and their new dungeon mouths) only once the Veil is
  // yours - drop any cached copies so they regenerate with the curse the next time you land.
  if(typeof WORLDS!=='undefined'){ delete WORLDS.main; delete WORLDS.east; delete WORLDS.wind; delete WORLDS.sky; delete WORLDS.isle; }
  if(silent) return;
  if(Snd.magic) Snd.magic();
  banner('THE WARDING VEIL','VATH\'S EYE SLIDES PAST YOU');
  setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>Jaist reads the warding from the hush-frost spellbook and settles it over you - cut from the ice the Warden wept.</i> “The robed man\'s eye is on the old islands now, watching every sea-road home. But not on <b>you</b> - not while this holds.” <b style="color:#c9b0ff">You learn the WARDING VEIL. Vath\'s influence slides past you now, and the ferry can steal you back to the old islands - Barik, the Sunward Isle, Windsurf, Emberwick.</b> <i>“But not the capital. His gaze never leaves the throne he stole. Aldermere stays shut to us.”</i>'); }, 900);
  if(typeof autoSave==='function') autoSave();
}
function updateFrostFolkMood(){
  if(!(P.story && P.story.frostFreed)) return;
  const set=(id,lines)=>{ const n=G.npcs.find(x=>x.id===id); if(n){ n.idleLines=lines; n.li=0; } };
  set('bryn',['The cold\'s gone KIND again - you can breathe without it biting, and there\'s seals back on the floes. A boat\'ll work the strait-edge by morning.','Still deep in snow, thank the Warden - but it\'s OUR winter now, not his. We owe you the whole season, friend.']);
  set('sigrid',['The glacier\'s stopped bleeding that violet - clean frost again, up there. I could kiss you, but my lips would freeze, so take my thanks instead.','It is itself again, up there. Gentle as ever. You gave us back our guardian - and a winter we can live in.']);
}
// Jaist sails the reaches at his sister's side and holds the way home while she takes
// the isle - the same watch he keeps on Stormreach. On the Frozen Isle he waits by the
// Frostferry landing, where the princess brings the hush-frost spellbook up from the Rimefissure
// for him to read and cast. Only present once Act II is underway (when the Frozen Isle opens).
function placeFrostBrother(){
  if(!(P.story && P.story.act2)) return;
  if(G.npcs.some(n=>n.id==='brother')) return;
  const D=(typeof FROST_ZONES!=='undefined' && FROST_ZONES.dock) ? FROST_ZONES.dock : {x:40,y:118};
  const sp=(typeof findOpenNear==='function' && findOpenNear(Math.round(D.x+3), Math.round(D.y-4), 8)) || [D.x+3, D.y-4];
  const b=makeNPC('brother','Jaist, Your Brother the Prince', sp[0], sp[1],
    {skin:'#d8a97a',hair:'#7a5a3a',shirt:'#3b5a7a',pants:'#33302a',cloak:'#274052',hairstyle:'short'},
    ["Go on - I'll hold the landing. If Hearthhold has the right of it, whatever Vath bound is down the Rimefissure, past the deep ice.",
     "The whole strait talks of a robed man on the glacier. That's Vath, or his handiwork. Find what he hid down there, Joan - and mind the cold.",
     "Bring me anything strange you turn up in the deep. Old script, old magic - that's my half of this fight, remember?"],0.1);
  b.nightOwl=true;
  G.npcs.push(b);
}
function genFrostAll(){
  genFrost(); bakeSolids(); placeObjectsFrost(); buildFoam();
  spawnFrostFolk(); spawnMobsFrost(); placeFrostBrother();
  buildMapBase();
}

/* ---------- THE RIMEFISSURE: the frozen dungeon beneath the Frozen Isle ----------
   THE GUTTERING FLAME - Vath's winter has sealed the warren with walls of living ice.
   Light a torch at the Emberheart and carry it north to THAW a way through - but the
   cold saps the flame, so you must relight at braziers along the relay (each itself
   frozen over until you thaw it) to reach and melt the great seal on the deep gate.
   Thin ice cracks if you linger. No levers now; the flame IS the puzzle.
   ================================================================================= */
// THE LONG DRIFT: a solid lever-island parked mid-channel (carved into the water later)
const FROST_ISLAND={x0:39, x1:49, y0:62, y1:69};   // reach it, pull its lever to open the Deep Gate
const HEART_SEAL=[[40,34],[41,34],[42,34],[43,34],[44,34],[45,34],[46,34],[47,34],[48,34]];   // spans the whole arena mouth; slams shut behind you when you enter
function genFrostDeep(){
  // an ice-dungeon carved from solid frozen rock: a long drift-channel crossing up to the Frozen Heart.
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1,tile)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,tile); setSolid(x,y,0); } };
  carve(34,100,54,114,T.ICE);             // THE FROSTGATE - the ice-cavern landing (entry)
  carve(42,92,46,101,T.ICE);              // corridor A -> the long drift
  carve(30,44,54,92,T.ICE);               // THE LONG DRIFT - a 3x channel of floes + rotating slabs
  carve(FROST_ISLAND.x0, FROST_ISLAND.y0, FROST_ISLAND.x1, FROST_ISLAND.y1, T.ICE);   // the solid lever-island, mid-channel
  carve(42,30,46,45,T.ICE);               // corridor B -> the arena
  carve(40,34,48,34,T.ICE);               // the Heart-Seal mouth - flared to the arena's full doorway so the seal spans it
  for(let x=42;x<=46;x++){ setTile(x,37,T.RUIN); setSolid(x,37,1); }  // the DEEP GATE - shut until the island lever is thrown
  // THE FROZEN HEART: one large slippery arena where you fight THE RIMEBOUND. Its edges drop away
  // into spiked freezing water (placed in placeObjectsFrostDeep), and a seal slams shut behind you.
  carve(28,10,60,33,T.ICE);               // the arena (enters from corridor B at y33, x42-46)
}
function placeObjectsFrostDeep(){
  G.decor=G.decor||[];
  G.decor.push({kind:'dungeonmouth', x:44.5, y:112.5, exit:1, label:'the way up'});  // back to the surface
  setSolid(44,112,0); setTile(44,112,T.ICE);
  // the long drift turns on the DASH (to board the rotating slabs) - guarantee it so nothing soft-locks
  if(!(P.unlocked && P.unlocked.dash)){ P.unlocked=P.unlocked||{}; P.unlocked.dash=true; toast('The cold quickens your step - you can <b>DASH</b> here (tap <b>Ctrl</b> or <b>L</b> / the dodge button).',4200); }
  for(const [tx,ty] of [[36,44],[52,44],[40,64],[48,64],[36,90],[52,90],[31,14],[57,14],[31,30],[57,30],[38,108],[50,108]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  const spire=(x,y)=>{ if(inb(x,y)&&!solidAt(x,y)){ G.decor.push({kind:'icespire', x:x+0.5, y:y+0.5}); setSolid(x,y,1); } };
  for(const [px,py] of [[38,110],[50,110]]) spire(px,py);
  // ---- THE FROZEN HEART ARENA ----
  // one big slippery room. Its edges drop away into spiked freezing water - avoid them - and a
  // seal slams shut behind you when you step in, so there's no backing out to kite the Rimebound.
  G._heartSealed=0;
  G.decor.push({kind:'catgate', x:44, y:34, open:true, gate:'heart', tiles:HEART_SEAL.slice(), label:'the Heart-Seal'});
  // ---- THE LONG DRIFT ----
  // a 3x channel of black freezing water. The SOUTH half is crossed on drift-ice floes that slide
  // back and forth; midway sits a solid ISLAND with the DRIFT-LOCK LEVER - throw it to grind the
  // Deep Gate up. The NORTH half is crossed on ROTATING SLABS (dash to board, like the Emberdeep).
  // Fall in and the cold flings you back - to the landing, or (once the lever is thrown) the island.
  G._frostVoid=new Set(); G._frostFloes=[]; G._frostWheels=[]; G._frostT=0; G._frostGateOpen=false; G._frostFallHint=0;
  for(let y=46;y<=89;y++) for(let x=30;x<=54;x++){ if(!inb(x,y)||solidAt(x,y)) continue;
    if(x>=FROST_ISLAND.x0 && x<=FROST_ISLAND.x1 && y>=FROST_ISLAND.y0 && y<=FROST_ISLAND.y1) continue;   // the island stays dry land
    G._frostVoid.add(x+','+y); G.decor.push({kind:'froststream', x:x+0.5, y:y+0.5, seed:(x*5+y*11)%9}); }
  const floe=(cy,cx,amp,spd,phase)=>{ const f={kind:'icefloe', cx:cx+0.5, y:cy+0.5, x:cx+0.5, prevx:cx+0.5, amp, spd, phase, w:5, h:3}; G.decor.push(f); G._frostFloes.push(f); };
  const wheel=(hx,hy,r,spd,ang0)=>{ const w={kind:'spinwheel', x:hx+0.5, y:hy+0.5, hx:hx+0.5, hy:hy+0.5, r, spd, ang:ang0, armw:1.15}; G.decor.push(w); G._frostWheels.push(w); };
  // SOUTH HALF: floes (3 apart, so they touch as they line up) from the entry ledge to the island
  floe(88,42,6,0.5,0.0); floe(85,42,6,0.5,1.3); floe(82,42,6,0.5,2.6); floe(79,42,6,0.5,3.9);
  floe(76,42,6,0.5,5.2); floe(73,42,6,0.5,0.7); floe(70,42,6,0.5,2.0);
  // NORTH HALF: rotating slabs (their reaches overlap) from the island up to the far ledge
  wheel(42,58, 3.0,  0.9,  Math.PI/2); wheel(42,52, 3.0, -0.9, -Math.PI/2); wheel(42,47, 3.0, 0.9, Math.PI/2);
  // the drift-lock lever, on the island (a bare icelever opens the Deep Gate; see pullIceLever)
  G.decor.push({kind:'icelever', x:44.5, y:66.5, on:false, island:1, label:'the drift-lock lever'});
  G._frostCross={cy0:46, cy1:89, farY:44, startX:44, startY:90.5, island:[44,67]};
  // THE REWARD ROOM: wall off the back of the Frozen Heart (inside the spiked ring) - the Hush-Frost
  // Spellbook (the Warding Veil) + the climb-out wait within, sealed until the Rimebound is freed
  // (freeColossus -> openRewardRoom). floor is ICE.
  buildRewardRoom({ x0:30, x1:58, wallY:16, gx0:40, gx1:42, floorT:T.ICE,
    chest:{kind:'chest', x:36.5, y:14.5, deep:1, veiltome:1}, exitX:52, exitY:14,
    cleared:!!(P.story && P.story.deepDone) });
  // frostdeep has no ewall wall-faces of its own (its arena is ringed by void, not stone), so dress
  // the reward-room partition with explicit ewall blocks - a chunky raised wall that reads clearly as
  // a barrier (cold 'brine' palette to sit right in the ice). The tiles are already solid.
  for(let x=30;x<=58;x++){ if(x>=40 && x<=42) continue; G.decor.push({kind:'ewall', x:x+0.5, y:16.5, s:((x*7+208)%5), theme:'brine'}); }
  // lamps flanking the gate, on the boss side, so the sealed vault door reads clearly during the fight
  for(const [lx,ly] of [[38,17],[44,17]]) if(inb(lx,ly)) G.decor.push({kind:'lamp', x:lx+0.5, y:ly+0.5});
  // ---- THE ARENA'S SPIKED EDGE: a ring of spiked freezing water round the Frozen Heart. Step
  // onto it and you plunge (see frostPlungeStart). The entry lane (x40-48) stays clear. ----
  for(let y=10;y<=33;y++) for(let x=28;x<=60;x++){
    if(!inb(x,y) || solidAt(x,y)) continue;
    const edge=(x<=29 || x>=59 || y<=11 || y>=32), entry=(x>=40 && x<=48 && y>=31);
    if(edge && !entry){ setTile(x,y,T.DEEP); setSolid(x,y,0); G._frostVoid.add(x+','+y); G.decor.push({kind:'froststream', x:x+0.5, y:y+0.5, seed:(x*5+y*11)%9}); }
  }
  G.critters=[];
  // an already-cleared run drains the channel + arena edge to solid ice and leaves the gates open
  if(P.story && P.story.deepDone){
    for(let x=42;x<=46;x++){ setSolid(x,37,0); setTile(x,37,T.ICE); }
    for(const [x,y] of HEART_SEAL){ setSolid(x,y,0); setTile(x,y,T.ICE); }
    for(const d of G.decor){ if(d.kind==='catgate' && d.gate==='heart') d.open=true; }
    for(const k of G._frostVoid){ const [x,y]=k.split(',').map(Number); if(y<=33){ setTile(x,y,T.ICE); setSolid(x,y,0); } }   // arena edge freezes over
    G.decor=G.decor.filter(d=>d.kind!=='froststream' && d.kind!=='icefloe' && d.kind!=='spinwheel');
    G._frostVoid=new Set(); G._frostFloes=[]; G._frostWheels=[]; G._frostGateOpen=true;
  }
}
// throwing the island's drift-lock lever grinds the Deep Gate up (far to the north) and moves the
// respawn checkpoint out to the island for the rotating-slab half of the crossing.
function openFrostGate(){
  if(G._frostGateOpen) return; G._frostGateOpen=true;
  for(let x=42;x<=46;x++){ setSolid(x,37,0); setTile(x,37,T.ICE); }
  invalidateScenery&&invalidateScenery();
  if(G._frostCross && G._frostCross.island){ G._frostCross.startX=G._frostCross.island[0]; G._frostCross.startY=G._frostCross.island[1]; }
  Snd.quest&&Snd.quest(); shockwave(44,66,'rgba(180,225,245,0.9)',52); G.shake=Math.max(G.shake||0,0.5);
  banner('THE DEEP GATE GRINDS OPEN','THE FROZEN HEART LIES BEYOND');
  toast('You throw the drift-lock and, far to the north, the deep gate grinds up. Ride the <b>rotating slabs</b> the rest of the way - fall now and you wake back here on the island.',5600);
  autoSave&&autoSave();
}
// plunging into the freezing water: control freezes and the hero flails in the cracking ice,
// the cold biting (-4 HP), before being flung back to the landing (see frostRespawn).
function frostPlungeStart(){
  if(G._frostPlunge) return;
  if(P.hp>1){ P.hp=Math.max(1, P.hp-4); if(typeof refreshUI==='function') refreshUI(); addFloat('-4',P.x,P.y-1.4,'#cfeaf8',0.95); }
  Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.5); buzz&&buzz(18);
  burst(P.x,P.y-0.3,'#cfeaf8',16,2.4); shockwave(P.x,P.y,'rgba(150,200,225,0.8)',40);
  G._frostPlunge={ t:0, dur:0.7, x:P.x, y:P.y };
  P.click=null; P.moving=false; P.slideDir=null; P._glv=null; P.rollT=0;
}
function frostRespawn(){
  const z=G._frostPlunge; G._frostPlunge=null; if(!z) return;
  burst(P.x,P.y-0.3,'#cfeaf8',12,2.0);
  if(z.y<=34){ P.x=44.5; P.y=30; }   // fell off the arena's spiked edge -> back onto the arena floor
  else { const c=G._frostCross; if(c){ P.x=c.startX+0.5; P.y=c.startY; } }   // fell in the drift -> the checkpoint
  P.click=null; P.moving=false; P.slideDir=null; P._glv=null;
  if(G.cam){ G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
  if(!G._frostFallHint){ G._frostFallHint=1; toast('The freezing water drags you under, shivering (<b>-4 HP</b>). Mind the <b>spiked edges</b> - and the ice is slick, so <b>mind your momentum</b>.',5200); }
}
// carry the player on the floe they're standing on, and drop them (restart) if the open
// water under them has no floe
function updateFrostDeep(dt){
  // the plunge plays out (control frozen in updatePlayer), then flings you back to the checkpoint
  if(G._frostPlunge){ G._frostPlunge.t+=dt; if(G._frostPlunge.t>=G._frostPlunge.dur) frostRespawn(); return; }
  // THE HEART-SEAL: stepping into the arena with the Rimebound alive slams the seal shut behind you
  if(!G._heartSealed && !(P.story&&P.story.deepDone) && P.y>=11 && P.y<=31 && P.x>=28 && P.x<=60
     && (G.mobs||[]).some(m=>m.ach==='rimebreaker' && !m.dead)){
    G._heartSealed=1; for(const [x,y] of HEART_SEAL) setSolid(x,y,1);
    const cg=G.decor.find(d=>d.kind==='catgate' && d.gate==='heart'); if(cg) cg.open=false;
    invalidateScenery&&invalidateScenery(); Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.5); buzz&&buzz(20);
    banner('THE ICE SEALS BEHIND YOU','NO RETREAT - FELL THE RIMEBOUND');
    // now that the way back is shut, the Rimebound arrives: reveal it and hand into its entrance beat
    const boss=(G.mobs||[]).find(m=>m.ach==='rimebreaker' && !m.dead);
    if(boss){ boss.sealed=false;
      if(typeof startBossIntro==='function' && !boss.entranceDone && !G.bossIntro)
        startBossIntro(boss,{kind:boss.entrance, title:boss.entranceTitle, sub:boss.entranceSub}); }
  }
  const floes=G._frostFloes||[], wheels=G._frostWheels||[];
  if(!floes.length && !wheels.length) return;   // a cleared run - the channel is solid ice
  G._frostT=(G._frostT||0)+dt;
  for(const f of floes){ f.prevx=f.x; f.x = f.cx + f.amp*Math.sin(G._frostT*f.spd + f.phase); }
  for(const w of wheels) w.ang += w.spd*dt;
  if(P.dead || (P.rollT||0)>0) return;   // mid-dash: airborne over the water
  const tx=Math.floor(P.x), ty=Math.floor(P.y);
  if(!(G._frostVoid && G._frostVoid.has(tx+','+ty))) return;   // on solid ice / a ledge / the island - safe
  // over the water: a floe carries you, else a rotating slab, else you plunge
  let best=null, bestd=99;
  for(const f of floes){ const dx=Math.abs(P.x-f.x), dy=Math.abs(P.y-f.y);
    if(dx<=f.w/2 && dy<=f.h/2 && (dx+dy)<bestd){ best=f; bestd=dx+dy; } }
  if(best){ const nx=P.x + (best.x-best.prevx); if(!circleBlocked(nx,P.y,0.28)) P.x=nx; return; }   // carried by the drift
  if(wheelCarry(wheels, dt)) return;   // riding a rotating slab
  frostPlungeStart();
}
function spawnMobsFrostDeep(){
  const Z=FROSTDEEP_ZONES;
  if(!(P.story && P.story.deepDone)){
    const sp=findOpenNear(Z.boss.x, Z.boss.y, 6) || [Z.boss.x, Z.boss.y];
    const b=spawnMob('icecolossus', sp[0], sp[1]);
    // sealed = inert and unseen until you walk into the Heart and the seal shuts behind you
    // (updateFrostDeep reveals it and hands into its entrance beat then) - so the Rimebound
    // never stands waiting in view; it arrives once there's no backing out.
    if(b){ b.boss=true; b.bigBoss=true; b.enspelled=true; b.sealed=true; b.title='THE RIMEBOUND'; b.entranceSub='VATH\'S ICE-THRALL - BREAK THE BINDING'; b.ach='rimebreaker'; b.hx=sp[0]; b.hy=sp[1]; b.respawnT=-1; b.entrance='enthrall'; }
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
  if(b.on){ toast('The drift-lock is already thrown - the deep gate stands open to the north.',3200); return; }
  b.on=true;
  openFrostGate();   // grind the Deep Gate up and move the checkpoint out to the island
}
function freeColossus(m){
  m.freed=1; m.enspelled=false; m.dead=true; m.respawnT=-1; m.state='idle';
  // the fight is won - the Heart-Seal grinds back open
  if(typeof HEART_SEAL!=='undefined') for(const [x,y] of HEART_SEAL){ setSolid(x,y,0); setTile(x,y,T.ICE); }
  G._heartSealed=0;
  { const cg=(G.decor||[]).find(d=>d.kind==='catgate' && d.gate==='heart'); if(cg) cg.open=true; }
  invalidateScenery&&invalidateScenery();
  Snd.boss&&Snd.boss(); G.shake=0.9; G.slowmo=1.15;
  shockwave(m.x,m.y,'rgba(190,230,250,0.95)',100);
  for(let i=0;i<36;i++){ const a=Math.random()*TAU, sp=rnd(1,4);
    G.parts.push({x:m.x,y:m.y-0.5,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:rnd(0.8,1.9),color:Math.random()<0.5?'#bfe8ff':'#e6f6ff',size:rnd(2,5),grav:0.05}); }
  if(P.story){ P.story.deepDone=1; P.story.vathMet=1; }
  bossReward(m);
  giveGold(150); give('elixir',2);
  if(typeof openRewardRoom==='function') openRewardRoom();   // the sealed vault at the arena's back grinds open - prize + climb-out within
  banner('THE RIMEBOUND IS FREED','THE CURSE SLOUGHS AWAY LIKE SPRING ICE');
  // The freeing now plays as a full-overlay cutscene (js/39-more-cutscenes.js): the violet
  // bleeds out of the great ice-whale and it settles calm into the melt, laying bare the
  // book it was set to guard. It carries that "guarding a secret" beat the old story-card
  // held, so the card is dropped (as the Leviathan's "Where it sank..." card was) - the old
  // card stays only as a fallback if the overlay layer is missing.
  setTimeout(()=>{
    if(typeof rimeboundFreedCutscene==='function') rimeboundFreedCutscene(m, ()=>{ if(typeof autoSave==='function') autoSave(); });
    else if(typeof storyCard==='function') storyCard('The violet bleeds out of the great ice-thing - a whale of the deep, once, that wandered too near the cold. It settles calm into the melt, <i>and the ice it guarded gives up its secret: an old <b>book</b>, bound in frost that will not thaw. This one Vath never set to hunt you - he set it here to keep something buried.</i>');
  },1400);
}

/* =====================================================================
   THE GLACIER VAULT - a wave-gauntlet dungeon sealed behind the Hoarfrost
   Bear's den on the Frozen Isle. Opened only once the bear is driven off.
   THREE arena halls, each sealed by its own gate: step in and the ice-beasts
   come in mounting waves - clear the whole escalating horde and that hall's
   gate grinds up, letting you press on to the next. Past the last gate lies
   the Hoarfrost Hoard. The first two halls are slick ice, so you slide as you
   fight. Reuses spawnMob + the ice-slide.
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
  // arena cover: a few ice-pillars to break line-of-sight and fight around in each hall
  for(const [px,py] of [[34,64],[46,68],[36,46],[48,50],[36,28],[46,28]]) spire(px,py);
  // ---- THE GAUNTLET: three halls, each a wave-fight. Step in and the ice-beasts come in
  // waves, one lot after the next; clear them all and the hall's gate grinds up. ----
  G._vaultT=0;
  // each hall is a longer, escalating gauntlet - the packs grow and the last wave of each
  // brings elites, so you fight a large, mounting horde before its gate ever grinds up.
  // gy = the FORWARD gate (grinds up when the hall is cleared, letting you press on).
  // ey = the ENTRY gate, in the corridor BEHIND you: it slams shut the moment you step
  // into the hall, sealing you in with the horde, and lifts again the instant it's cleared.
  G._vaultRooms=[
    { key:'A', gy:57, ey:76, gx0:38, gx1:42, y0:58, y1:73, sx:40, sy:65, active:false, done:false, sealed:false, wi:-1, spawnT:0,
      waves:[ [['wolf',4]], [['wolf',4],['polarbear',1]], [['wolf',3],['polarbear',2]], [['wolf',5],['polarbear',1]] ] },
    { key:'B', gy:38, ey:56, gx0:38, gx1:42, y0:40, y1:54, sx:40, sy:47, active:false, done:false, sealed:false, wi:-1, spawnT:0,
      waves:[ [['wolf',5]], [['polarbear',2],['wolf',3]], [['polarbear',3],['wolf',3]], [['wolf',5],['polarbear',2]], [['polarbear',2,true],['wolf',3]] ] },
    { key:'C', gy:19, ey:37, gx0:38, gx1:42, y0:21, y1:35, sx:40, sy:28, active:false, done:false, sealed:false, wi:-1, spawnT:0,
      waves:[ [['wolf',6]], [['polarbear',3],['wolf',3]], [['polarbear',2,true],['wolf',4]], [['polarbear',3],['wolf',5]], [['polarbear',3,true],['wolf',4]] ] },
  ];
  // ---- R5: the Hoarfrost Hoard (the reward past the last gate) ----
  // the central chest holds THE TIDEFARER'S CHART - the map that explains the whole Act II
  // hunt (the great queen's hidden grave and the sealing weapon); the side chest is gold.
  G.decor.push({kind:'chest', x:44.5, y:9.5, deep:1, tidechart:1});
  G.decor.push({kind:'chest', x:34.5, y:12.5, deep:1, rich:8});
  // THE WAY UP stands here IN the hoard - not dropped where a boss fell. You clear the last hall,
  // the gate grinds up, and the prize + the climb-out are waiting in the vault beyond.
  G.decor.push({kind:'fastexit', x:50.5, y:10.5, name:'CLIMB OUT', labelY:-46});
  spire(30,5); spire(58,5); spire(30,15); spire(58,15);
  G.critters=[];
  // an already-cleared run keeps every gate open and skips the fights
  if(P.story && P.story.vaultDone){
    for(const r of G._vaultRooms){ r.done=true; for(let x=r.gx0;x<=r.gx1;x++){ setTile(x,r.gy,T.ICE); setSolid(x,r.gy,0); } }
  }
}
function spawnMobsFrostVault(){
  // the halls are empty until you step into each one - the ice-beasts come in waves (see updateFrostVault)
}
// spawn one wave of a vault hall, tagged to that hall so we can tell when it's cleared
function startVaultWave(r, i){
  r.wi=i; r.spawnT=G._vaultT||0;
  for(const [kind,count,elite] of (r.waves[i]||[])){
    for(let k=0;k<count;k++){
      const a=Math.random()*TAU, rr=1+Math.random()*4;
      const sp=findOpenNear(Math.round(r.sx+Math.cos(a)*rr), Math.round(r.sy+Math.sin(a)*rr), 5) || [r.sx, r.sy];
      const m=spawnMob(kind, sp[0], sp[1], !!elite);
      if(m){ m._vaultRoom=r.key; m.respawnT=-1; m.hx=sp[0]; m.hy=sp[1]; }
    }
  }
  Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.3); buzz&&buzz(8);
  banner(i===0?'THE ICE STIRS':'ANOTHER WAVE', 'WAVE '+(i+1)+' OF '+r.waves.length);
}
// the entry gate BEHIND you: seal it to lock you in the hall, lift it to let you leave.
function sealVaultRoom(r){
  if(r.sealed || r.ey==null) return; r.sealed=true;
  for(let x=r.gx0;x<=r.gx1;x++){ setTile(x,r.ey,T.RUIN); setSolid(x,r.ey,1); }
  invalidateScenery&&invalidateScenery();
  shockwave(40.5, r.ey+0.5, 'rgba(180,225,245,0.9)', 46); G.shake=Math.max(G.shake||0,0.4); buzz&&buzz(8);
}
function unsealVaultRoom(r){
  if(!r.sealed || r.ey==null) return; r.sealed=false;
  for(let x=r.gx0;x<=r.gx1;x++){ setTile(x,r.ey,T.ICE); setSolid(x,r.ey,0); }
  invalidateScenery&&invalidateScenery();
}
function openVaultGate(r){
  for(let x=r.gx0;x<=r.gx1;x++){ setTile(x,r.gy,T.ICE); setSolid(x,r.gy,0); }
  unsealVaultRoom(r);   // clearing the hall also lifts the gate you were sealed behind
  invalidateScenery&&invalidateScenery();
  shockwave(40.5, r.gy+0.5, 'rgba(180,225,245,0.9)', 52); G.shake=Math.max(G.shake||0,0.5); Snd.quest&&Snd.quest();
  if(r.key==='C'){ P.story=P.story||{}; P.story.vaultDone=1; autoSave&&autoSave();
    // the climb-out already waits inside the Hoard (placeObjectsFrostVault) - no portal dropped here
    banner('THE HALLS ARE CLEARED','THE HOARFROST HOARD LIES OPEN');
    toast('The last of the ice-beasts falls and the final gate hauls up into the ceiling. <b>The Hoarfrost Hoard is yours.</b>',5000);
  } else banner('THE HALL IS CLEARED','THE GATES GRIND UP');
}
// drive the vault gauntlet: activate a hall when the player steps in (sealing them in),
// then feed waves until the horde is cleared - at which point both gates grind up.
function updateFrostVault(dt){
  const rooms=G._vaultRooms||[]; if(!rooms.length) return;
  G._vaultT=(G._vaultT||0)+dt;
  for(const r of rooms){
    if(r.done) continue;
    if(!r.active){
      if(!P.dead && P.x>=28 && P.x<=54 && P.y>=r.y0 && P.y<=r.y1){
        r.active=true; sealVaultRoom(r); startVaultWave(r,0);   // gate slams shut behind you - fight your way out
      }
      continue;
    }
    // died mid-fight: unseal and reset the hall so it re-triggers fresh on your way back in
    // (respawn is at the vault mouth, SOUTH of the sealed gate - never leave the hero locked out)
    if(P.dead){
      unsealVaultRoom(r);
      for(const m of G.mobs){ if(m._vaultRoom===r.key && !m.dead){ m.dead=true; m.respawnT=-1; } }
      r.active=false; r.wi=-1;
      continue;
    }
    if(r.wi>=0 && (G._vaultT - r.spawnT)>0.5){
      const alive=G.mobs.some(m=>!m.dead && m._vaultRoom===r.key);
      if(!alive){ if(r.wi+1 < r.waves.length) startVaultWave(r, r.wi+1); else { r.done=true; openVaultGate(r); } }
    }
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
      // only pop a toast for gates that carry a CUSTOM message (some name the room beyond);
      // the generic "the way lies open" line just restated the banner, so it's dropped
      if(b.openMsg) toast(b.openMsg,5200);
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
const MILL_BOSS_SEAL=[[18,9],[19,9],[20,9],[21,9],[22,9]];   // the corridor mouth into the Grinding Floor; slams shut behind you when you step up to the Cog-Bound
const MILL_VAULT_SEAL=[[19,3],[20,3],[21,3]];                // the inner millstone gate into the sail-vault; grinds up when the Cog-Bound falls
function genMillDeep(){
  // the flooded undercroft: an entry landing, then FOUR flooded halls climbing north, and the
  // guardian's chamber at the top with the sail. The first two halls (A,B) are COMBINATION
  // water-mazes (find the valve-states that open a door in every wall). The two DEEPER halls
  // (C,D) are TIDE-LOCKS - you must throw their valves in the one CARVED ORDER or the whole hall
  // floods back and the sequence resets. Every solid tile bordering the carved floor is recorded
  // as a WALL (ewall decor) so the rooms read clearly - no invisible collision.
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  carve(9,1,31,8);      // THE GRINDING FLOOR - the guardian below, the sail-vault above
  // split it: a REWARD VAULT (y1-2, the sail + the way up) behind an inner millstone gate at
  // y3, and the BOSS ARENA (y4-8) below. The gate opens only when the Cog-Bound falls.
  for(let x=9;x<=31;x++){ if(x>=19 && x<=21) continue; setTile(x,3,T.RUIN); setSolid(x,3,1); }
  carve(18,8,22,11);    // corridor -> Hall D
  carve(7,11,33,28);    // TIDE-LOCK HALL D - the five-lock sequence (deepest, hardest)
  carve(18,28,22,31);   // corridor -> Hall C
  carve(7,31,33,48);    // TIDE-LOCK HALL C - the four-lock sequence
  carve(18,48,22,51);   // corridor -> Hall B
  carve(7,51,33,68);    // FLOODED HALL B - combination water-maze
  carve(18,68,22,71);   // corridor -> Hall A
  carve(7,71,33,88);    // FLOODED HALL A - combination water-maze
  carve(18,88,22,91);   // corridor -> the entry landing
  carve(10,91,30,100);  // THE MILLSTAIR - entry landing (the way up + the arms-chest)
  // record the visible wall faces (stone bordering the carved floor) BEFORE the water goes down,
  // so the water-walls read as water (not phantom stone)
  MILL_WALLS=[];
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(!solidAt(x,y)) continue;
    let border=false;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])
      if(inb(x+dx,y+dy) && !solidAt(x+dx,y+dy)){ border=true; break; }
    if(border) MILL_WALLS.push([x,y]);
  }
}
function placeObjectsMillDeep(){
  G.decor=G.decor||[];
  // the stone walls that give the rooms their shape (static baked scenery)
  for(const [x,y] of MILL_WALLS) G.decor.push({kind:'ewall', x:x+0.5, y:y+0.5, s:((x*7+y*13)%5)});
  G.decor.push({kind:'dungeonmouth', mill:1, exit:1, x:19.5, y:98.5, label:'the way up'});  // back to the surface
  setSolid(19,98,0); setTile(19,98,T.RUIN);
  // THE COG-GATE: a gear-driven portcullis at the mouth of the Grinding Floor. It stands open
  // until you step up to the Cog-Bound, then slams shut (updateMillDeep) - no retreat - and
  // grinds back up when the guardian falls (killMob). A cleared run leaves it open.
  G._millSealed=0;
  G.decor.push({kind:'catgate', x:20, y:9, open:true, gate:'cog', tiles:MILL_BOSS_SEAL.slice(), label:'the Cog-Gate'});
  // THE SAIL-VAULT GATE: the inner millstone gate (y3) into the reward vault above the arena.
  // Sealed until the Cog-Bound falls (killMob), then it grinds up and the sail + the way out
  // stand right there.
  { const vopen=!!(P.story && P.story.millDone); const vt=MILL_VAULT_SEAL.slice();
    G.decor.push({kind:'catgate', x:20, y:3, open:vopen, gate:'millvault', tiles:vt, label:'the sail-vault gate'});
    for(const [x,y] of vt) setSolid(x,y, vopen?0:1); }
  for(const [tx,ty] of [[12,95],[28,95],[9,84],[31,72],[9,64],[31,52],[9,44],[31,32],[9,24],[31,12],[12,1],[28,1]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // a decorative great wheel in the landing (the works are drowned, not turning)
  G.decor.push({kind:'millwheel', x:12.5, y:97.2, r:6});
  // (No arms-chest / winch-crank gate any more - the sluice valves turn by hand, straight away.)
  // ---- THE FLOODED HALLS. Each hall is barred by four WATER-WALLS, every doorway flooded shut by
  // default (you cannot get through). Sluice valves sit at each hall's mouth. There are TWO kinds:
  //   * COMBINATION halls (A,B): each valve is coupled to TWO doorways - throwing it drains one pair
  //     and floods another. Find the STATE that leaves a drained doorway in every wall at once.
  //   * TIDE-LOCK halls (C,D): the deeper locks. The water only falls if you throw the valves in the
  //     one CARVED ORDER (read the stone plaque at the mouth). Each correct valve drains the next
  //     wall northward; a WRONG valve reverses the sluices and floods the whole hall back to the
  //     start. Hall D adds a sixth DECOY valve whose number never appears in the order - touch it
  //     and the locks slam shut. ----
  G._millWalls=[];
  const wwall=(hall, id, y, doorX0, doorX1)=>{
    for(let x=7;x<=33;x++){ if(inb(x,y)){ setTile(x,y,T.DEEP); setSolid(x,y,1);
      // a raised churning water-curtain over every flooded tile, so the barrier reads as a WALL of
      // water (not a calm pool you might jump). The render hides itself where a doorway has drained.
      G.decor.push({kind:'millwater', x:x+0.5, y:y+0.5, gx:x, gy:y}); } }
    // sSpd/sPhase drive the TIMED SURGE once this doorway is drained: the race pulses water back
    // across the opening on a telegraphed cycle. Stagger the phase by row so a hall's doorways never
    // all surge at once (there's always a passable beat somewhere). See updateMillDeep + 'millsurge'.
    const w={hall, id, y, dx0:doorX0, dx1:doorX1, on:false, sSpd:0.26, sPhase:((y*0.137)%1+1)%1, _surgeI:0, _warn:0};
    G._millWalls.push(w); applyMillWall(w);   // doorway starts shut
    // a surge-curtain over each doorway tile, drawn only while the drained doorway is surging shut
    for(let x=doorX0;x<=doorX1;x++) if(inb(x,y)) G.decor.push({kind:'millsurge', x:x+0.5, y:y+0.5, gx:x, gy:y, w});
  };
  const valve=(hall, vx, vy, flips)=>{ G.decor.push({kind:'sluicelever', x:vx+0.5, y:vy+0.5, on:false, hall, flips, label:'a sluice valve'}); };
  const ovalve=(hall, vx, vy, pips)=>{ G.decor.push({kind:'sluicelever', x:vx+0.5, y:vy+0.5, on:false, hall, order:true, pips, label:'a tide-lock valve'}); };
  const plaque=(hall, px, py, seq)=>{ G.decor.push({kind:'millplaque', x:px+0.5, y:py+0.5, hall, seq}); };
  // HALL A (y71-88): four staggered water-walls; three coupled valves. Solve: valve1 on, valve2 off, valve3 on.
  wwall('A','a1', 86, 20,24); wwall('A','a2', 83, 9,13); wwall('A','a3', 80, 20,24); wwall('A','a4', 77, 9,13);
  valve('A', 11,87, ['a1','a2']); valve('A', 20,87, ['a2','a3']); valve('A', 29,87, ['a3','a4']);
  // HALL B (y51-68): four more, coupled differently. Solve: valve1 off, valve2 on, valve3 on.
  wwall('B','b1', 66, 20,24); wwall('B','b2', 63, 9,13); wwall('B','b3', 60, 20,24); wwall('B','b4', 57, 9,13);
  valve('B', 11,67, ['b2','b3']); valve('B', 20,67, ['b1','b2']); valve('B', 29,67, ['b3','b4']);
  // HALL C (y31-48): four water-walls, one valve per wall. Throw each valve to drain its own
  // stretch - any order (the old carved-order tide-lock is gone). Drain all four to cross.
  wwall('C','c1', 46, 20,24); wwall('C','c2', 43, 9,13); wwall('C','c3', 40, 26,30); wwall('C','c4', 37, 15,19);
  valve('C', 9,47, ['c1']); valve('C', 15,47, ['c2']); valve('C', 25,47, ['c3']); valve('C', 31,47, ['c4']);
  // HALL D (y11-28): five water-walls, one valve per wall - same simple drain, any order.
  wwall('D','d1', 26, 20,24); wwall('D','d2', 23, 9,13); wwall('D','d3', 20, 26,30); wwall('D','d4', 17, 15,19); wwall('D','d5', 14, 9,13);
  valve('D', 8,27, ['d1']); valve('D', 13,27, ['d2']); valve('D', 18,27, ['d3']); valve('D', 23,27, ['d4']); valve('D', 28,27, ['d5']);
  // ---- THE GRINDING HAZARDS ----
  // the drowned works still turn where the shaft never fully seized: rusted spike-grates snap up
  // through the floor and toothed grind-blades sweep the open stretches. A clip costs blood, not a
  // restart - and a DASH's roll frames pass clean through. The deeper the hall, the harder it grinds.
  G._millT=0; G._millSpikes=[]; G._millAxes=[];
  // Each spike-grate spans the hall WALL TO WALL (x7-33) along one open floor row between the
  // water-walls, so there's no end to sidestep round - you read its telegraph and time a step
  // across when the iron drops. Grates and grind-blades alternate gap-by-gap, one hazard per
  // stretch, so no two ever pinch the same row. Staggered phases keep a crossing window open.
  const mspikes=(y,spd,phase)=>{ for(let x=7;x<=33;x++){ if(!inb(x,y)||solidAt(x,y)) continue; const s={kind:'spiketile', x:x+0.5, y:y+0.5, gx:x, gy:y, spd, phase, up:false, warnP:0, dmg:14}; G.decor.push(s); G._millSpikes.push(s); } };
  const maxe=(x,y,amp,spd,phase)=>{ const a={kind:'axetrap', x:x+0.5, y:y+0.5, hx:x+0.5, hy:y+0.5, amp, spd, phase, hitR:0.82, dmg:18}; G.decor.push(a); G._millAxes.push(a); };
  // Hall A (walls y86,83,80,77) - two wall-to-wall grates + one slow grind-blade, one per gap
  mspikes(84, 0.75, 0.0); maxe(20,81, 2.4, 1.9, 0.2); mspikes(78, 0.75, 0.4);
  // Hall B (walls y66,63,60,57) - three wall-to-wall grates + two faster blades
  mspikes(64, 0.9, 0.0); maxe(20,61, 2.8, 2.2, 0.0); mspikes(58, 0.9, 0.5); maxe(20,55, 2.8, 2.3, 0.5); mspikes(53, 0.9, 0.25);
  // Hall C (tide-lock, walls y46,43,40,37) - two wall-to-wall grates + the blades you earn once the order's right
  mspikes(44, 0.85, 0.0); maxe(20,42, 2.6, 2.1, 0.2); mspikes(39, 0.85, 0.4); maxe(20,35, 2.6, 2.2, 0.6);
  // Hall D (tide-lock, walls y26,23,20,17,14) - the meat-grinder: three wall-to-wall grates + two blades, alternating every gap
  mspikes(25, 0.95, 0.0); maxe(20,21, 3.0, 2.4, 0.0); mspikes(18, 0.95, 0.5); maxe(20,15, 3.0, 2.5, 0.5); mspikes(12, 0.95, 0.25);
  // THE STORMSAIL + THE WAY UP, in the reward vault above the arena (behind the sail-vault gate,
  // so you only reach them once the Cog-Bound falls and the gate grinds up). The exit is right here.
  if(!(P.story && P.story.haveSail)) G.decor.push({kind:'chest', x:24.5, y:1.5, sail:1});
  G.decor.push({kind:'dungeonmouth', mill:1, exit:1, x:15.5, y:1.5, label:'the way up'});
  setSolid(15,1,0); setTile(15,1,T.RUIN);
  G.critters=[];
  // a cleared run leaves every hall drained (the mazes are solved), the works stilled, and the
  // sail-vault gate standing open
  if(P.story && P.story.millDone){ for(const w of G._millWalls){ w.on=true; applyMillWall(w); }
    for(const d of G.decor) if(d.kind==='sluicelever') d.on=true;
    for(const [x,y] of MILL_VAULT_SEAL){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
    G.decor=G.decor.filter(d=>d.kind!=='spiketile' && d.kind!=='axetrap'); G._millSpikes=[]; G._millAxes=[]; }
}
// drain (walkable) or flood (blocking water) a water-wall's doorway to match its valve
function applyMillWall(w){
  for(let x=w.dx0;x<=w.dx1;x++){ if(!inb(x,w.y)) continue;
    if(w.on){ setTile(x,w.y,T.RUIN); setSolid(x,w.y,0); }
    else { setTile(x,w.y,T.DEEP); setSolid(x,w.y,1); } }
}
// THE SLUICE VALVES. Halls A/B couple each valve to TWO doorways (a small combination puzzle);
// halls C/D give each valve its own single doorway (just throw them all - no order to read).
// You turn any valve straight away - no tool to fetch first.
function pullSluiceLever(b){
  if(!b.flips) return;   // the mill's only valves are the water-sluices
  b.on=!b.on; Snd.quest&&Snd.quest(); buzz&&buzz(8); shockwave(b.x,b.y,'rgba(120,190,235,0.8)',40);
  for(const id of b.flips){ const w=(G._millWalls||[]).find(x=>x.id===id); if(!w) continue;
    w.on=!w.on; applyMillWall(w);
    for(let i=0;i<8;i++){ const px=w.dx0+Math.random()*(w.dx1-w.dx0+1), a=Math.random()*TAU, sp=rnd(0.5,2.0);
      G.parts.push({x:px, y:w.y+0.5, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp*0.5-0.3, life:rnd(0.4,1.0), color:w.on?'#bfe0f4':'#6a9ab8', size:rnd(1.5,3), grav:0.05}); } }
  invalidateScenery&&invalidateScenery();
  const hw=(G._millWalls||[]).filter(w=>w.hall===b.hall), openN=hw.filter(w=>w.on).length;
  if(hw.length && openN===hw.length){
    G.shake=Math.max(G.shake||0,0.4); banner('THE HALL DRAINS','A DOORWAY OPENS IN EVERY WALL');
    toast('The last stretch drains - a doorway now stands open in every wall of the hall. <b>Weave the open path north.</b>',4600);
  } else {
    addFloat(openN+' / '+hw.length+' walls open', b.x, b.y-1.4, '#bfe0f4', 1.1);
    toast('The coupled sluices shift - some stretches drain as others flood over. <b>'+openN+' of '+hw.length+'</b> walls stand open. Find the combination that opens them all at once.',3600);
  }
}
// (The old carved-ORDER tide-lock - pullSluiceOrder + the millplaque steles - was cut. Halls C/D
//  are plain per-valve drains now; every sluice runs through pullSluiceLever above.)
// drive the mill's grinding hazards: cycle the spike-grates and sweep the grind-blades, bleeding
// the player on a clean hit (a dash's roll frames pass through everything unharmed).
function updateMillDeep(dt){
  const t=(G._millT=(G._millT||0)+dt);
  // THE COG-GATE: stepping onto the Grinding Floor RAISES the Cog-Bound out of the works and
  // slams the gate shut behind you - the guardian is not there until you commit. No backing down
  // the halls to kite it; the gate reopens only when it falls.
  if(!G._millSealed && !(P.story&&P.story.millDone) && P.y>=4 && P.y<=8 && P.x>=9 && P.x<=31){
    if(typeof spawnCogBound==='function') spawnCogBound();
    // the Cog-Bound has no marquee entrance, so stamp the boss respawn point here as the
    // Cog-Gate shuts (see startBossIntro for the same idea on entrance bosses)
    P.bossCheck={w:G.worldId, x:P.x, y:P.y};
    G._millSealed=1; for(const [x,y] of MILL_BOSS_SEAL) setSolid(x,y,1);
    const cg=G.decor.find(d=>d.kind==='catgate' && d.gate==='cog'); if(cg) cg.open=false;
    invalidateScenery&&invalidateScenery(); Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.5); buzz&&buzz(20);
    banner('THE SLUICE-MAW RISES','THE COG-GATE SLAMS SHUT - NO RETREAT');
  }
  const safe = P.dead || (P.rollT||0)>0;
  const HIT=(dmg,x,y)=>{ if(!safe) hurtPlayer(dmg,{x,y,lvl:12}); };
  for(const a of (G._millAxes||[])){
    a.hx = a.x + a.amp*Math.sin(t*a.spd + a.phase); a.hy = a.y;
    if(Math.hypot(P.x-a.hx, P.y-a.hy) < a.hitR) HIT(a.dmg, a.hx, a.hy);
  }
  for(const s of (G._millSpikes||[])){
    const ph=((t*s.spd + s.phase)%1 + 1)%1;
    s.warnP = (ph>=0.55 && ph<0.68)? (ph-0.55)/0.13 : 0;
    s.up = ph>=0.68 && ph<0.95;
    if(s.up && Math.floor(P.x)===s.gx && Math.floor(P.y)===s.gy) HIT(s.dmg, s.x, s.y);
  }
  // TIMED SLUICE SURGES: a drained doorway is not safe forever - the race still pulses. On a
  // telegraphed cycle the water gathers (warn), then sweeps back across the opening (flood) as a
  // wall you cannot walk through, then recedes. Time your run - or DASH: a roll's i-frames carry you
  // through a surge clean, same as the grind-blades. Caught on foot, you're washed back downstream.
  if(!(P.story && P.story.millDone)) for(const w of (G._millWalls||[])){
    if(!w.on){ w._surgeI=0; w._warn=0; continue; }   // a still-shut doorway is the valve's business, no surge
    const ph=((t*w.sSpd + w.sPhase)%1 + 1)%1;
    let inten=0, warn=0;
    if(ph>=0.50 && ph<0.62){ warn=(ph-0.50)/0.12; inten=0.22*warn; }        // water gathers low - the tell
    else if(ph>=0.62 && ph<0.86){ inten=Math.min(1,(ph-0.62)/0.05); }       // surges up fast and holds
    else if(ph>=0.86 && ph<0.94){ inten=1-(ph-0.86)/0.08; }                 // recedes
    w._surgeI=inten; w._warn=warn;
    const flood = ph>=0.64 && ph<0.86;   // the impassable window (a hair inside the visual, so the tell is honest)
    if(flood){
      const onDoor = Math.floor(P.y)===w.y && Math.floor(P.x)>=w.dx0 && Math.floor(P.x)<=w.dx1;
      if(onDoor && !safe){   // washed back downstream (south) and bloodied - unless a dash carries you through
        HIT(15, P.x, w.y+0.5); P.y=w.y+1.55; P.click=null; P.moving=false;
        shockwave(P.x, w.y+0.5, 'rgba(150,205,235,0.7)', 26); Snd.step&&Snd.step(6);
      }
    }
  }
}
// THE COG-BOUND: the miller who was caught in the gear-train when it seized, risen
// fused to the works and guarding them. Fell it and the freed shaft grinds the
// millstone gate up. A single mini-boss - the whole reason the dungeon exists.
function spawnMobsMillDeep(){
  // The Cog-Bound no longer stands waiting - it rises only when you step onto the Grinding Floor
  // and the Cog-Gate slams shut behind you (see spawnCogBound, called from updateMillDeep).
}
function spawnCogBound(){
  if(P.story && P.story.millDone) return;
  if((G.mobs||[]).some(mb=>mb.millboss)) return;   // one at a time
  const Z=MILLDEEP_ZONES.works;
  const sp=findOpenNear(Math.round(Z.x), Math.round(Z.y), 5) || [Z.x, Z.y];
  // The thing that fouled the drowned works is a water-monster - an angler-maw that swam up the
  // flooded shaft and lodged in the gears (kind 'tidemaw' for its render). It keeps the millboss
  // flag for the gate/kill logic, but NOT the tidemaw AI flag, so it just chases and bites (the
  // Barik Tidemaw's submerge/spout AI never runs outside barikdeep). Same HP - not a hard fight.
  const b=spawnMob('tidemaw', sp[0], sp[1]);
  if(b){ b.boss=true; b.bigBoss=true; b.millboss=1; b.title='THE SLUICE-MAW'; b.subtitle='FOULED IN THE DROWNED WORKS'; b.ach='cogbreaker';
    b.hp=b.maxhp=480; b.dmg=27; b.speed=2.3; b.lvl=12; b.xp=520; b.gold=[0,0];   // no coin - the SAIL in the vault is the only prize here
    b.hx=sp[0]; b.hy=sp[1]; b.state='chase'; b.noAggroT=0; b.respawnT=-1; b.entrance='rise'; }
  return b;
}
function genMillDeepAll(){ genMillDeep(); placeObjectsMillDeep(); spawnMobsMillDeep(); buildMapBase(); }
function enterMillDungeon(){
  // The windmill is ALWAYS locked - Burl's padlock. You may only enter once you
  // hold the key Tolen hands you for shaping the board (millKey). The haveSail /
  // surf / sail-active fallbacks keep older saves (and anyone already sent below)
  // from ever being locked out of a dungeon they've been sent to.
  const maySeek = (P.story && (P.story.millKey || P.story.boardMade || P.story.haveSail)) || (P.unlocked && P.unlocked.surf) || qs('sail')==='active';
  if(!maySeek){
    toast('A chained cellar-hatch beside the windmill, padlocked over a stair going down into the old works. It\'s locked tight, and you\'ve no <b>key</b> - shape a board with <b>Tolen</b> and he\'ll hand you one.',4800); Snd.step&&Snd.step(5); return;
  }
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P._millReturn={x:P.x, y:P.y+1.3}; P.click=null;
  setTimeout(()=>{ switchWorld('milldeep'); if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function exitMillDungeon(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.click=null;
  setTimeout(()=>{ switchWorld('wind');
    const mi=P._millInterior;
    if(mi){
      // you came DOWN the cellar stair from inside the mill - so climbing out drops
      // you back inside the mill at the foot of that stair, not out on the street
      G.interior=mi;
      P.x=mi.w/2; P.y=Math.min(mi.h-1.4, 4.9); P.dir={x:0,y:1}; P.moving=false; P.fishing=null; P.combo=0;
      P._millInterior=null;
      if(typeof closeAllPanels==='function') closeAllPanels();
    } else {
      const r=P._millReturn; if(r){ P.x=r.x; P.y=r.y; G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
    }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
// The Undermill is now entered from INSIDE the windmill: its door opens the mill
// interior, and a stone cellar-stair (the 'millcellar' hotspot) drops you into the
// dungeon. Same gate as the exterior hatch used to have. Climbing back out lands
// you at the windmill's door in the city.
function enterMillFromInterior(){
  // Same lock as the exterior hatch: the mill opens only to the key Tolen gives you
  // for shaping the board (millKey). Fallbacks keep you from being locked out mid-quest.
  const maySeek = (P.story && (P.story.millKey || P.story.boardMade || P.story.haveSail)) || (P.unlocked && P.unlocked.surf) || qs('sail')==='active';
  if(!maySeek){
    toast('A heavy stone hatch is set in the mill floor - chained and padlocked over a stair going down into the old works. It\'s locked, and you hold no <b>key</b>; shape a board with <b>Tolen</b> and he\'ll give you one.',4800); Snd.step&&Snd.step(5); return;
  }
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  const MI=WIND_ZONES.mill;
  P._millReturn={x:MI.x+0.5, y:MI.y+1.8};   // fallback: the windmill's street door, if the interior can't be rebuilt
  P._millInterior=G.interior;               // stash the mill interior so climbing out puts you back UPSTAIRS at the cellar stair, not out in the street
  G.interior=null; P.click=null;            // leave the mill interior for the dungeon world
  setTimeout(()=>{ switchWorld('milldeep'); if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}

/* =====================================================================
   THE UNDERMAW - a four-trial gauntlet under the Barik hills, climbing north
   to the Maw-Stalker's den and the hoard beyond. The trials:
     R1  floating slabs drifting across a bottomless scar
     R2  a grinding conveyor of stone belts, dashed across a bottomless scar
     R3  a mix of a rotating slab and a floating slab
     R4  floating slabs run under fire from rooted skeleton archers
   Reuses ewall walls, driftslabs, spinwheels, the catgate, bonepit, archers.
   ===================================================================== */
let UNDERMAW_WALLS = [];
const UNDERMAW_GATE = [[19,11],[20,11],[21,11],[22,11],[23,11]];   // the Hoard Door, sealed until the beast falls
const MAW_SHOOTGATE = [[20,112],[21,112],[22,112],[23,112],[24,112]];   // the Warded Gate, sealed until the ward-eye is struck
const MAW_HORDEGATE = [[20,139],[21,139],[22,139],[23,139],[24,139]];   // the Bone Gate, sealed until the bone-yard horde is put down
const MAW_DENGATE   = [[20,34],[21,34],[22,34],[23,34],[24,34]];   // the Den Gate: stands OPEN until you step into the Stalker's Den, then slams shut behind you
function genUndermaw(){
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  carve(16,180,28,190);   // R0 THE MAW - entry landing (the way up sits here)
  carve(20,174,24,181);   // throat
  carve(6,142,38,174);    // R1 - a long black scar, crossed on scattered floating platforms
  carve(20,136,24,143);   // corridor 1
  carve(6,114,38,136);    // R2 - the conveyor (dash across the grinding belts; its gate stands open)
  carve(20,108,24,115);   // corridor 2 (the Warded Gate sits at y=112)
  carve(6,76,38,108);     // R3 - a long black scar of scattered floating platforms
  carve(20,70,24,77);     // corridor 3
  carve(6,38,38,70);      // R4 - floating platforms under archer fire
  carve(20,32,24,39);     // corridor 4 -> the den
  carve(8,14,36,33);      // R5 THE MAW-STALKER'S DEN (the boss fight)
  carve(19,8,23,15);      // hoard corridor (the Hoard Door sits at y=11)
  carve(14,2,30,8);       // R6 THE DEEP HOARD - the reward alcove
  UNDERMAW_WALLS=[];
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(!solidAt(x,y)) continue;
    let border=false;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])
      if(inb(x+dx,y+dy) && !solidAt(x+dx,y+dy)){ border=true; break; }
    if(border) UNDERMAW_WALLS.push([x,y]);
  }
  for(const [x,y] of UNDERMAW_GATE){ setTile(x,y,T.RUIN); setSolid(x,y,1); }
  for(const [x,y] of MAW_HORDEGATE){ setTile(x,y,T.RUIN); setSolid(x,y,1); }
  // R2's old Warded Gate no longer seals the corridor - the room is a conveyor
  // crossing now, so its exit stands open (the pit is the trial, not a gate).
  for(const [x,y] of MAW_SHOOTGATE){ setTile(x,y,T.RUIN); setSolid(x,y,0); }
}
function placeObjectsUndermaw(){
  G.decor=G.decor||[];
  for(const [x,y] of UNDERMAW_WALLS) G.decor.push({kind:'ewall', x:x+0.5, y:y+0.5, s:((x*7+y*13)%5)});
  G.decor.push({kind:'dungeonmouth', undermaw:1, exit:1, x:22.5, y:188.5, label:'the way up'});
  setSolid(22,188,0); setTile(22,188,T.RUIN);
  // A second way out at the very top, in the Deep Hoard beyond the boss: once the
  // Maw-Stalker is down and the Hoard Door opens, you can leave from here instead of
  // re-running the whole gauntlet back to the entrance.
  // the climb-out IN the Deep Hoard (a full heal, like every dungeon's reward-room exit),
  // behind the Hoard Door so you only reach it once the Maw-Stalker falls
  G.decor.push({kind:'fastexit', x:27.5, y:4.5, name:'CLIMB OUT', labelY:-46});
  setSolid(27,4,0); setTile(27,4,T.RUIN);
  // the scar's platform-hops turn on the DASH - make sure it's on hand so nothing soft-locks.
  // (No bow is granted here: R2's old ward-eye - the one puzzle that needed a ranged shot -
  // was replaced by the conveyor crossing, so the maw no longer hands out a "magical" bow.
  // The bow lives on the Cloudreach now, at the Gale-Shrine.)
  if(!(P.unlocked && P.unlocked.dash)){ P.unlocked=P.unlocked||{}; P.unlocked.dash=true; toast('The dark quickens your step - you can <b>DASH</b> here (tap <b>Ctrl</b> or <b>L</b> / the dodge button).',4200); }
  for(const [tx,ty] of [[8,178],[36,178],[8,156],[36,156],[8,124],[36,124],[8,92],[36,92],[8,54],[36,54],[10,20],[34,20],[16,4],[28,4]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});

  G._mawT=0; G._mawPits=new Set(); G._mawWheels=[]; G._mawSlabs=[]; G._mawCross=[]; G._mawFallHint=0; G._mawDrop=null;
  const pit=(x0,x1,y0,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)&&!solidAt(x,y)){ G._mawPits.add(x+','+y); G.decor.push({kind:'bonepit', x:x+0.5, y:y+0.5, seed:(x*7+y*13)%9}); } };
  // a small platform that slides only a SHORT way left-and-right. The slabs are kept
  // deliberately small (1.5 tiles) so the gaps between them read wide - the centre-to-centre
  // spine hop stays ~3 tiles (still dashable), but with less slab under you the jumps land
  // tighter and the R3/R4 scars feel more spread out.
  const slab=(cx,cy,amp,spd,phase)=>{ const s={kind:'driftslab', ax:cx-amp, ay:cy, bx:cx+amp, by:cy, spd, phase:phase||0, x:cx-amp, y:cy, prevx:cx-amp, prevy:cy, w:1.5, h:1.5}; G.decor.push(s); G._mawSlabs.push(s); };
  // scatter a navigable FIELD of small sliding platforms across a big black pit: a guaranteed
  // zig-zag "spine" of dash-hops from the south ledge to the north, plus spread-out extra
  // platforms (left and right) so there are several routes up.
  const field=(nY,sY,seed)=>{
    let prng=(seed>>>0)||1; const rng=()=>{ prng=(prng*1664525+1013904223)>>>0; return prng/4294967296; };
    let px=22;
    for(let y=sY-2; y>=nY+2; y-=3){
      px=Math.max(11, Math.min(33, px + (rng()<0.5?-3:3)));                 // spine hop (<=3 tiles: dashable)
      slab(px, y, 1.0, 0.55+rng()*0.3, rng()*6.28);                         // the spine platform (guarantees a path)
      for(const ex of [11,18,26,33]){ if(Math.abs(ex-px)>=5 && rng()<0.5)   // extras, spread wide left and right
        slab(Math.max(10,Math.min(34,ex)), y, 1.0, 0.55+rng()*0.3, rng()*6.28); }
    }
  };
  // ---- R1: THE BONE-YARD - a solid-floored chamber where a horde of the maw's
  // bone-guard rouses and gives chase. Clear every last one and the Bone Gate at
  // the room's north throat grinds up, opening the way deeper. (No scar here - the
  // platform-hop trial waits in R3/R4.) ----
  G.decor.push({kind:'catgate', x:22, y:139, open:false, gate:'horde', tiles:MAW_HORDEGATE.slice(), label:'the Bone Gate'});
  // ---- R5: THE DEN GATE - a portcullis at the den's mouth. It stands OPEN as you approach;
  // the moment you step up into the Stalker's Den it slams shut behind you, and only then does
  // the Maw-Stalker rouse (see updateUndermaw). No retreat until the beast falls.
  G._mawDenSealed=0;
  G.decor.push({kind:'catgate', x:22, y:34, open:true, gate:'den', tiles:MAW_DENGATE.slice(), label:'the Den Gate'});
  // ---- R3: a longer, busier scar ----
  pit(6,38, 79,105); field(79,105, 6203);
  G._mawCross.push({y0:76,y1:108, sx:22, sy:107});
  // ---- R4: the scar under archer fire ----
  pit(6,38, 41,67); field(41,67, 7207);
  G._mawCross.push({y0:38,y1:70, sx:22, sy:69});
  // ---- R2: THE CONVEYOR - five grinding belts of stone tiles, and ADJACENT belts run
  // OPPOSITE ways: one surfaces at the LEFT and streams RIGHT (tipping off the right edge),
  // the next surfaces at the RIGHT and streams LEFT (tipping off the left edge), and so on.
  // Every belt shares one speed and one tile-spacing and they start aligned, so a right-going
  // tile and a left-going tile are never far apart - a continuous zig-zag of dashable hops
  // (a clear path) stays open across the pit at every instant, even as the whole field slides.
  // You still time and place each dash and dodge the bats; you just can't get locked out. ----
  buildMawConveyor();
  // ---- THE HOARD DOOR + reward ----
  // reward:1 marks the Deep Hoard as this dungeon's reward room, so killMob opens it here (it
  // already does, via the m.undermawBeast handler) and never drops a "way out" at the boss instead
  G.decor.push({kind:'catgate', x:21, y:11, open:false, gate:'undermaw', reward:1, tiles:UNDERMAW_GATE.slice(), label:'the Hoard Door'});
  // The Maw-Stalker's prize (the Cragbreaker Pick) is dropped into the Deep Hoard here, at 22,4 -
  // the reward-room chest (see awardDungeonTool's `spot`). A wall of violet WARDSTONE - the very
  // same Vath-ward crystal that walls off the Barik farm (GATES.vathward) - seals the hoard's
  // climb-out (the "way out"), so the moment the boss falls and you claim the pick you can put it
  // straight to work: cut one block through to open the shortcut. Never a soft-lock - the entrance
  // way-up at the Maw always stands open, so you can also just walk back down. (These stones carry
  // no ward gid, so they break one at a time here - not as the single shattering ring the farm is.)
  if(typeof addGateNode==='function') for(let gy=2; gy<=8; gy++) addGateNode('vathward', 25, gy);
  // A supply cache in the corridor just before the den: three Ember Tonics for the
  // boss fight. Claimed once, then it stays taken across later descents.
  if(!(P.story && P.story.undermawTonics)) G.decor.push({kind:'chest', x:22.5, y:37.5, mawTonics:1});
  G.critters=[];
  G._mawHordeLeft=0;   // set in spawnMobsUndermaw when the bone-guard is placed
  // an already-cleared run stands every gate open and quiets the den (the platforms remain to re-cross)
  if(P.story && P.story.undermawDown){
    for(const [x,y] of [...UNDERMAW_GATE, ...MAW_SHOOTGATE, ...MAW_HORDEGATE]){ setTile(x,y,T.RUIN); setSolid(x,y,0); }
    for(const d of G.decor){ if(d.kind==='catgate') d.open=true; if(d.kind==='shoottarget') d.hit=true; }
  } else if(P.story && P.story.mawHordeDown){
    // the bone-yard's already been swept on an earlier descent - its gate stays up
    for(const [x,y] of MAW_HORDEGATE){ setTile(x,y,T.RUIN); setSolid(x,y,0); }
    const bg=G.decor.find(d=>d.kind==='catgate' && d.gate==='horde'); if(bg) bg.open=true;
  }
}
function spawnMobsUndermaw(){
  if(P.story && P.story.undermawDown) return;   // already felled - the den is quiet
  const Z=UNDERMAW_ZONES.den;
  const sp=findOpenNear(Math.round(Z.x), Math.round(Z.y), 7) || [Z.x, Z.y];
  const b=spawnMob('scorpion', sp[0], sp[1]);
  if(b){ b.boss=true; b.bigBoss=true; b.undermawBeast=1; b.bscale=1.7; b.title='THE MAW-STALKER'; b.subtitle='TERROR OF THE UNDERMAW';
    b.hp=b.maxhp=360; b.dmg=18; b.lvl=7; b.xp=380; b.gold=[35,60];
    // sealed = inert and unseen until you walk into the den and the Den Gate shuts behind you
    // (updateUndermaw unseals it and hands into its 'loom' entrance). Never looming in view first.
    b.sealed=true;
    b.hx=sp[0]; b.hy=sp[1]; b.state='idle'; b.noAggroT=0; b.respawnT=-1; b.entrance='loom'; }
  // R4 skeleton archers: rooted on the ledges flanking the crossing, raining bone arrows as you cross
  for(const [ax,ay] of [[14,39],[30,39],[14,69],[30,69]]){
    const a=spawnMob('archer', ax, ay);
    if(a){ a.rooted=true; a.hx=ax; a.hy=ay; a.respawnT=-1; a.state='idle'; a.noAggroT=0; }
  }
  // R1 THE BONE-YARD: 15 skeletons scattered across the second room. They rouse as you
  // climb in and give chase in a swarm; every last one must fall before the Bone Gate
  // at the north throat grinds up. (Individually a touch lighter than a lone skeleton -
  // it's the numbers that make the fight.) They never respawn and never leash home, so
  // the horde hounds you across the whole chamber until it's cleared.
  if(!(P.story && P.story.mawHordeDown)){
    const hordeSpots=[[10,150],[17,148],[24,150],[31,148],[35,152],
                      [10,158],[17,159],[22,157],[27,159],[34,158],
                      [12,167],[18,169],[24,167],[30,169],[33,166]];
    let placed=0;
    for(const [sx,sy] of hordeSpots){
      const o=findOpenNear(sx,sy,3) || [sx,sy];
      const s=spawnMob('skeleton', o[0], o[1]);
      if(s){ s.mawHorde=1; s.arena=1; s.respawnT=-1; s.noAggroT=0;
        s.hp=s.maxhp=30; s.dmg=11; s.speed=2.5; s.aggro=16; s.xp=18; s.lvl=6;
        placed++; }
    }
    G._mawHordeLeft=placed;
  }
}
// R2 THE CONVEYOR: lay the crossing pit and its five counter-running belts of stone tiles.
// Called from placeObjectsUndermaw with G._mawPits/_mawCross already initialised.
function buildMawConveyor(){
  G._mawConvey=[];
  // the crossing pit fills R2's middle, leaving a south entry ledge (y>=132) and a
  // north exit ledge (y<=116) of solid footing
  for(let y=117;y<=131;y++) for(let x=7;x<=37;x++) if(inb(x,y)&&!solidAt(x,y)){
    G._mawPits.add(x+','+y); G.decor.push({kind:'bonepit', x:x+0.5, y:y+0.5, seed:(x*7+y*13)%9}); }
  G._mawCross.push({y0:114,y1:136, sx:22, sy:134});   // a fall here restarts you on the south ledge
  // FIVE belts climb the pit, and adjacent belts run OPPOSITE ways (see `dir`): a rightward
  // belt (dir +1) surfaces at x0 and tips off the right edge; a leftward belt (dir -1)
  // surfaces at x1 and tips off the left edge. Every belt shares one speed and one tile
  // spacing `p`, and all five start on the SAME lattice, so the nearest rightward tile and
  // leftward tile are never more than p/2 apart in x. Lanes sit 3 rows apart (a 1-tile pit
  // gap between belts - a dash clears it), and the tiles are 2 wide, so at every instant a
  // continuous zig-zag of dashable hops (a guaranteed path) spans the pit even while it all
  // slides. `p` (=4) keeps the worst hop inside a plain dash's reach.
  const x0=9.5, x1=33.5, span=x1-x0, p=4, n=span/p, spd=2.0, w=2;
  const lane=(ly,dir)=>{
    for(let k=0;k<n;k++){
      const x = dir>0 ? x0 + k*p : x1 - k*p;   // rightward belts fill from the left, leftward belts from the right
      const t={kind:'conveytile', x, y:ly+0.5, prevx:x, prevy:ly+0.5, x0, x1, dir, spd, w, h:2, falling:false, fallT:0};
      G.decor.push(t); G._mawConvey.push(t);
    }
  };
  // south -> north: right, left, right, left, right (each belt opposes its neighbour)
  lane(130,+1); lane(127,-1); lane(124,+1); lane(121,-1); lane(118,+1);
}
// advance the conveyor belts: slide each tile along its belt's direction, tip it off the
// far edge (a short fall animation), then resurface it at the near edge to come round again.
function updateConveyor(dt){
  for(const t of (G._mawConvey||[])){
    t.prevx=t.x; t.prevy=t.y;
    if(t.falling){
      t.fallT+=dt;
      if(t.fallT>=0.55){ t.falling=false; t.fallT=0; t.x=(t.dir>0)?t.x0:t.x1; t.prevx=t.x; }   // resurface at the near wall; no carry-jump
    } else {
      t.x += t.dir*t.spd*dt;
      if(t.dir>0 && t.x>=t.x1){ t.falling=true; t.fallT=0; }        // rightward belt reached the right edge
      else if(t.dir<0 && t.x<=t.x0){ t.falling=true; t.fallT=0; }   // leftward belt reached the left edge
    }
  }
}
// if the player stands on a conveyor tile, carry them by its motion (drifting them east).
// Falling tiles give no footing - ride one to the edge and you drop with it. Returns true if aboard.
function conveyCarry(tiles){
  let best=null, bd=99;
  for(const s of (tiles||[])){ if(s.falling) continue;
    const dx=Math.abs(P.x-s.x), dy=Math.abs(P.y-s.y);
    if(dx<=(s.w||2)/2+0.2 && dy<=(s.h||2)/2+0.2 && (dx+dy)<bd){ best=s; bd=dx+dy; } }
  if(best){ const nx=P.x+(best.x-best.prevx), ny=P.y+(best.y-best.prevy);
    if(!circleBlocked(nx,ny,0.28)){ P.x=nx; P.y=ny; } return true; }
  return false;
}
// drive the Undermaw's crossings: turn the spinwheels, drift the slabs, run the conveyor,
// swarm the bats, and drop the player back to the ledge (-5 HP) if they stand over the scar
// with no platform beneath them.
function updateUndermaw(dt){
  G._mawT=(G._mawT||0)+dt;
  for(const w of (G._mawWheels||[])) w.ang += w.spd*dt;
  updateDriftSlabs(G._mawSlabs, G._mawT);
  updateConveyor(dt);
  updateMawBats(dt);
  // THE DEN GATE: stepping up into the Stalker's Den with the Maw-Stalker still alive slams the
  // portcullis shut behind you - and only then does the beast rouse. The fight (and its 'loom'
  // entrance) begins only once you're a few tiles inside the den, locked in, with no way back
  // until it falls. The gate row is y=34; wait until the hero is well past it (P.y<31) so the
  // seal reads as "you walked into the room", not "you brushed the doorway".
  if(!G._mawDenSealed && !P.dead && !(P.story&&P.story.undermawDown)
     && P.y<31 && P.y>13 && P.x>7 && P.x<37
     && (G.mobs||[]).some(m=>m.undermawBeast && !m.dead)){
    G._mawDenSealed=1; for(const [x,y] of MAW_DENGATE) setSolid(x,y,1);
    const cg=(G.decor||[]).find(d=>d.kind==='catgate' && d.gate==='den'); if(cg) cg.open=false;
    invalidateScenery&&invalidateScenery(); Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.5); buzz&&buzz(20);
    banner('THE DEN SEALS BEHIND YOU','NO RETREAT - PUT DOWN THE MAW-STALKER');
    // the way back is shut: rouse the Maw-Stalker - reveal it and hand into its entrance beat
    const boss=(G.mobs||[]).find(m=>m.undermawBeast && !m.dead);
    if(boss){ boss.sealed=false;
      if(typeof startBossIntro==='function' && !boss.entranceDone && !G.bossIntro)
        startBossIntro(boss,{kind:boss.entrance, title:boss.title, sub:boss.subtitle}); }
  }
  // a fall is in progress: the hero tumbles down into the black, then respawns on the ledge
  if(G._mawDrop){ G._mawDrop.t+=dt;
    if(Math.random()<0.4) burst(G._mawDrop.x+rnd(-0.3,0.3), G._mawDrop.y+rnd(-0.2,0.2), '#1a1512', 1, 1.2);
    if(G._mawDrop.t>=G._mawDrop.dur) mawRespawn();
    return; }
  if(P.dead || (P.rollT||0)>0) return;   // mid-dash: airborne over the scar
  const tx=Math.floor(P.x), ty=Math.floor(P.y);
  if(!(G._mawPits && G._mawPits.has(tx+','+ty))) return;   // solid footing
  if(wheelCarry(G._mawWheels, dt)) return;                 // riding a rotating slab
  if(driftCarry(G._mawSlabs)) return;                      // riding a floating slab
  if(conveyCarry(G._mawConvey)) return;                    // riding a conveyor tile
  mawFall(ty);
}
// CAVE BATS: removed from the Undermaw entirely - the crossings now test only footwork
// (the slabs, wheels, conveyor, and scar), with no swooping flyers. This purges any bats
// left over in a cached instance and never spawns new ones.
function updateMawBats(dt){
  for(const m of (G.mobs||[])){ if(m.bat && !m.dead){ m.dead=true; m.respawnT=-1; } }
}
// hit the black scar with no platform under you: the hero plummets (a drop animation plays in
// drawPlayer; updateUndermaw ticks it), then wakes back on the ledge with -5 HP.
function mawFall(ty){
  if(G._mawDrop) return;
  const c=(G._mawCross||[]).find(cc=>ty>=cc.y0 && ty<=cc.y1) || (G._mawCross||[])[0];
  if(P.hp>1){ P.hp=Math.max(1, P.hp-5); if(typeof refreshUI==='function') refreshUI(); addFloat('-5',P.x,P.y-1.4,'#c9b48a',0.95); }
  Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.45); buzz&&buzz(16);
  P.click=null; P.moving=false; P.slideDir=null; P.rollT=0;
  G._mawDrop={ t:0, dur:0.6, x:P.x, y:P.y, sx:(c?c.sx:22), sy:(c?c.sy:173) };
}
function mawRespawn(){
  const d=G._mawDrop; G._mawDrop=null; if(!d) return;
  P.x=d.sx+0.5; P.y=d.sy+0.5; P.click=null; P.moving=false; P.slideDir=null; P.rollT=0;
  burst(P.x,P.y-0.3,'#6a5c48',12,2.0); shockwave(P.x,P.y,'rgba(120,105,80,0.7)',36);
  if(G.cam){ G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
  if(!G._mawFallHint){ G._mawFallHint=1; toast('You plunge into the black scar and haul yourself back to the ledge, battered (<b>-5 HP</b>). <b>Hop the small platforms</b> - they slide as you go, so time each jump.',5400); }
}
// strike a ward-eye with an arrow or bolt: grind its gate up for good
function hitShootTarget(d){
  if(d.hit) return; d.hit=true;
  Snd.quest&&Snd.quest(); G.shake=Math.max(G.shake||0,0.4); buzz&&buzz(10);
  shockwave(d.x,d.y,'rgba(255,150,60,0.85)',48); burst(d.x,d.y-0.3,'#ffb04a',16,2.6);
  for(const [x,y] of (d.gateTiles||[])){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
  const cg=G.decor.find(g=>g.kind==='catgate' && g.gate===d.gate); if(cg) cg.open=true;
  invalidateScenery&&invalidateScenery();
  banner('THE WARD-EYE SHATTERS','THE WARDED GATE GRINDS UP');
  toast('Your shot bursts the ward-eye and the gate grinds up beyond it. The way deeper lies open.',4400);
}
// clear the R1 bone-yard horde: grind the Bone Gate up for good and let the player press on
function openMawHordeGate(){
  P.story=P.story||{}; if(P.story.mawHordeDown) return; P.story.mawHordeDown=1;
  for(const [x,y] of MAW_HORDEGATE){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
  const cg=(G.decor||[]).find(g=>g.kind==='catgate' && g.gate==='horde'); if(cg) cg.open=true;
  invalidateScenery&&invalidateScenery();
  Snd.quest&&Snd.quest(); G.shake=Math.max(G.shake||0,0.45); buzz&&buzz(10);
  banner('THE BONE-YARD IS STILLED','THE BONE GATE GRINDS UP');
  toast('The last of the bone-guard clatters into a heap, and the Bone Gate grinds up. The way deeper lies open.',4600);
  if(typeof autoSave==='function') autoSave();
}
function genUndermawAll(){ genUndermaw(); placeObjectsUndermaw(); spawnMobsUndermaw(); buildMapBase(); }
function enterUndermaw(){
  if(G.interior) return;
  if(P.riding){ P.riding=0; if(typeof updateMountBtn==='function') updateMountBtn(); }
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P._undermawReturn={x:P.x, y:P.y+1.3}; P.click=null;
  setTimeout(()=>{ switchWorld('undermaw'); if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function exitUndermaw(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.click=null;
  setTimeout(()=>{ switchWorld('main');
    let r=P._undermawReturn;
    // No stored spot (e.g. the game was reloaded straight into the dungeon): step back
    // out at the Undermaw's surface cave-mouth rather than the far-off town landing.
    if(!r){
      const cm=(G.decor||[]).find(d=>d.kind==='cavemouth');
      if(cm){ const sp=findOpenNear(Math.round(cm.x), Math.round(cm.y)+2, 6) || [Math.round(cm.x), Math.round(cm.y)+2];
        r={x:sp[0]+0.5, y:sp[1]+0.5}; }
    }
    if(r){ P.x=r.x; P.y=r.y; G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}

/* =====================================================================
   THE CLOUDREACH (sky) + STORMREACH (reach) - a two-island arc:
   Ashwing flies you UP into the cloud-sea to the Cloudreach. Run the
   Wind-Lost Bird's RAINBOW ROAD (the sky-dungeon) and put out the Storm-Eye
   to calm the high wind - that wins you a stormsail and opens THE LEAP, the
   way DOWN through the cloud onto Windsurf, then Stormreach far below. (The
   Storm Roc that rules the eyrie is an optional trophy hunt, not the road
   down.) No keel has reached Stormreach in memory, so you are stranded there
   until you put down its brute-lord; do that and the castaways mend a hull,
   and Stormreach joins the ferry roads.
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
// ---------- THE CLOUDREACH (a tiny cloud-perch hub) ----------
function genSky(){
  genRadialIsle(32,32,22);
  // The Cloudreach is CLOUD, not earth: the "land" is white foamy cloud (SNOW), and
  // the ring beyond it is open sky (the water tiles are kept only for the island's
  // shape, its foamy rim, and its solid edge - the renderer draws them as sky, not
  // sea, whenever the world def is flagged cloud:1).
  for(let i=0;i<MAPW*MAPH;i++){ const t=G.map[i]; if(t===T.GRASS||t===T.SAND) G.map[i]=T.SNOW; }
  const Z=SKY_ZONES;
  carveDisc(Z.landing.x,Z.landing.y,Z.landing.r,T.SNOW,false);
  carveDisc(Z.leap.x,Z.leap.y,Z.leap.r,T.SNOW,false);
  carveDisc(32,16,5,T.SNOW,false);   // the Gale-Shrine (the wind spirit + the bow) at the north
}
function placeObjectsSky(){
  const Z=SKY_ZONES;
  // Ashwing waits at the landing - your ride back down to Windsurf at any time
  { const sp=findOpenNear(Z.landing.x, Z.landing.y+3, 6) || [Z.landing.x, Z.landing.y+3];
    G.decor.push({kind:'ashwing', x:sp[0]+0.5, y:sp[1]+0.5, face:-1, name:'ASHWING', labelY:-82, sky:1});
    setSolid(sp[0],sp[1],1); setSolid(sp[0]+1,sp[1],1); }
  // a few standing stones ring the little landing for shape (and a scrap of lore)
  for(let i=0;i<5;i++){ const a=i/5*TAU, px=Math.round(Z.landing.x+Math.cos(a)*5), py=Math.round(Z.landing.y+Math.sin(a)*4.2);
    if(inb(px,py)&&!solidAt(px,py) && dist(px,py,Z.landing.x,Z.landing.y+3)>2){ G.decor.push({kind:'pillar', x:px+0.5, y:py+0.5, broken:i%3===0, loreKey:'cloudreach'}); setSolid(px,py,1); } }
  G.decor.push({kind:'lamp', x:Z.landing.x-3+0.5, y:Z.landing.y+0.5}); G.decor.push({kind:'lamp', x:Z.landing.x+3+0.5, y:Z.landing.y+0.5});
  // THE LEAP: a jutting stone shelf over the cloud-drop. Usable once the Rainbow Road
  // is run and the sky is calmed (that grants the stormsail) - it carries you to Windsurf far below.
  G.decor.push({kind:'leappoint', x:Z.leap.x+0.5, y:Z.leap.y+0.5, name:'THE LEAP', labelY:-40});
  G.decor.push({kind:'lamp', x:Z.leap.x-2+0.5, y:Z.leap.y+0.5}); G.decor.push({kind:'lamp', x:Z.leap.x+2+0.5, y:Z.leap.y+0.5});
  // THE WIND-LOST BIRD - her plea opens the Rainbow Road (a "sky dungeon"). She perches
  // toward the north edge of the landing, set well apart and up from Ashwing and the
  // Cloud-Tender so she's easy to spot (she reads small and got lost in the crowd before).
  { const sp=findOpenNear(Z.landing.x-3, Z.landing.y-6, 5) || [Z.landing.x-3, Z.landing.y-6];
    G.decor.push({kind:'skybird', x:sp[0]+0.5, y:sp[1]+0.5, name:'A WIND-LOST BIRD', labelY:-44}); }
  // THE GALE-SHRINE: a little stone-ringed shrine at the north where a WIND SPIRIT guards a
  // chest. Beat the spirit and the wind-ward across the throat lifts (see killMob's windspirit
  // branch), and the chest gives up the BOW - the one arm that can strike the Storm-Eye.
  { const cx0=32, cy0=15;
    const walls=[[31,13],[32,13],[33,13],[30,14],[30,15],[30,16],[34,14],[34,15],[34,16],[30,17],[34,17]];
    for(const [x,y] of walls){ if(inb(x,y)){ G.decor.push({kind:'pillar', x:x+0.5, y:y+0.5, broken:false}); setSolid(x,y,1); } }
    // the bow-chest, boxed inside the ring
    if(!(P.story && P.story.skyBowTaken)) G.decor.push({kind:'chest', x:cx0+0.5, y:cy0+0.5, skybow:1});
    // the wind-ward across the southern throat - open once the spirit is down
    const tiles=[[31,17],[32,17],[33,17]];
    const wopen=!!(P.story && P.story.skyWindSpiritDown);
    G.decor.push({kind:'skygate', gate:'windward', x:32, y:17, tiles, open:wopen, label:'a wind-ward'});
    for(const [x,y] of tiles) setSolid(x,y, wopen?0:1);
  }
  G.critters=[];
}
function spawnSkyFolk(){
  const Z=SKY_ZONES;
  G.npcs.push(makeNPC('aeron','Aeron the Skyward', Z.landing.x-2.5, Z.landing.y+2.5,
    {skin:'#c2a488',hair:'#d8d0c0',shirt:'#5a6a8a',pants:'#33384a',hairstyle:'long'},
    ['Few climb Ashwing’s wing this high. Fewer still leave - the wind up here is soured, and a soured sky suffers no guests.',
     'There\'s a wind <b>spirit</b> haunting the shrine to the north - it guards an old <b>bow</b>. Mind it if you mean to run the road: the Storm-Eye up there laughs at steel, and only an arrow will reach it.',
     'See the little wind-lost bird by the landing? Run her <b>rainbow road</b> and put out the <b>Storm-Eye</b> that fouled the sky. Bring the chart down from the crown, and <b>Ashwing</b> will bear you on to <b>Windsurf</b>, bright on the water below.'],0.4));
  G.npcs.push(makeNPC('wisp','A Cloud-Tender', Z.landing.x+2.5, Z.landing.y-1.5,
    {skin:'#b8a0c8',hair:'#e8e0f0',shirt:'#6a5a8a',pants:'#3a3350',hairstyle:'bun'},
    ['Mind your footing near the edges - the cloud looks solid and is not.',
     'Fire-tonics off the cloud-tops, if the climb wears you thin - the rainbow road asks a lot of a body. And the way onward is the bird\'s <b>rainbow road</b>: calm the wind and it bears you down.',
     'If the height gets into your knees, Ashwing will carry you back to the Sunward shore.'],0.5));
}
function spawnMobsSky(){
  // THE WIND SPIRIT guards the Gale-Shrine at the north until it's put down. Beat it (with
  // blade or bolt - you've no bow yet) and the ward on the shrine lifts, giving up the bow.
  if(!(P.story && P.story.skyWindSpiritDown)){
    const sp=findOpenNear(32, 21, 4) || [32,21];
    const m=spawnMob('stormwraith', sp[0], sp[1]);
    if(m){ m.boss=true; m.bigBoss=true; m.windspirit=1; m.bscale=1.7; m.title='THE WIND SPIRIT';
      m.hp=m.maxhp=360; m.dmg=20; m.lvl=Math.max(9,Math.min(12,P.level||10)); m.hx=m.x; m.hy=m.y;
      m.respawnT=-1; m.entrance='descend'; }
  }
}
function genSkyAll(){ genSky(); bakeSolids(); placeObjectsSky(); buildFoam(); placeSkyHazard(); spawnSkyFolk(); spawnMobsSky(); buildMapBase(); }
// ---------- STORMREACH ----------
function genReach(){
  genRadialIsle(60,60,48);
  // Stormreach is a storm-lashed coast, not a green isle: no grass at all. Turn the
  // whole interior to churned mud (SOIL) with coherent patches of broken stone (RUIN),
  // so the ground reads wet, grey and beaten - matching the reef-storm the isle sits under.
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){ const i=y*MAPW+x;
    if(G.map[i]!==T.GRASS) continue;
    const n=Math.sin(x*0.34)*Math.cos(y*0.29)+Math.sin((x+y)*0.18);
    G.map[i] = n>0.62 ? T.RUIN : T.SOIL; }
  const Z=REACH_ZONES;
  carveDisc(Z.strand.x,Z.strand.y,Z.strand.r,T.SAND,false);
  carveDisc(Z.camp.x,Z.camp.y,Z.camp.r,T.SOIL,false);      // mud, not grass
  carveDisc(Z.barrow.x,Z.barrow.y,Z.barrow.r,T.SOIL,false); // the beast's churned ground
  carveDisc(Z.dock.x,Z.dock.y,4,T.SAND,false);
  carveDisc(Z.camp.x,Z.camp.y,3,T.PATH,false);
  carveLine(Z.strand.x,Z.strand.y, Z.camp.x,Z.camp.y, T.PATH,0);
  carveLine(Z.camp.x,Z.camp.y, Z.barrow.x,Z.barrow.y, T.PATH,0);
  carveLine(Z.camp.x,Z.camp.y, Z.dock.x,Z.dock.y, T.PATH,0);
}
function placeObjectsReach(){
  const Z=REACH_ZONES;
  // the castaway camp: two cast sea-stone storm-houses and a well. The stranded
  // gave up on lean-tos long ago - these are squat, buttressed concrete shelters
  // that shrug off the reef-storms (see SPR.stormhut).
  addBuilding('stormhut', Z.camp.x-3, Z.camp.y-2, 'Castaway storm-house');
  addBuilding('stormhut', Z.camp.x+3, Z.camp.y+1, 'Sea-wall shelter');
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
    G.decor.push({kind:'pillar', x:GV.x+2+0.5, y:GV.y+4+0.5, broken:true, loreKey:'stormreach'});
    // the Tidefarer's verse-stone on the tomb's threshold - the Act II clue that turns
    // the isle-by-isle curse-lifting into a hunt for the great queen's sealing weapon
    G.decor.push({kind:'pillar', x:GV.x+0.5, y:GV.y+2+0.5, broken:false, loreKey:'prophecy@reach'}); }
  carveLine(Z.camp.x,Z.camp.y, Z.graves.x,Z.graves.y, T.PATH,0);
  // Your sloop, beached at the Wreckstrand landing where you put in. Stormreach is a
  // sea-stop, but the way home is the very hull you arrived in - the prince holds it here
  // on the strand rather than a ferry off the far dock. Walk seaward from the landing and
  // drop it on the first sea tile, so it reads as pulled up on the shingle by your brother.
  { const sdx=Z.strand.x-60, sdy=Z.strand.y-60, sl=Math.hypot(sdx,sdy)||1; let placed=false;
    for(let step=2; step<=18 && !placed; step++){ const tx=Math.round(Z.strand.x+sdx/sl*step), ty=Math.round(Z.strand.y+sdy/sl*step);
      if(inb(tx,ty)){ const t=tileAt(tx,ty); if(t===T.SHALLOW||t===T.DEEP){ addBuilding('boat', tx, ty, ''); placed=true; } } }
    if(!placed) addBuilding('boat', Z.strand.x, Z.strand.y+6, ''); }
  // lamps light the landing (the old dock off east is quiet now that the boat rides here)
  addBuilding('lamp', Z.strand.x-3, Z.strand.y-1, ''); addBuilding('lamp', Z.strand.x+3, Z.strand.y-1, '');
  // scatter: the storm-coast is barren - broken stone strewn over the mud, with only a
  // few wind-bent palms clinging to the sand strand. No inland trees (there's no grass left).
  const pr=mulberry32(SEED+19);
  for(let i=0;i<120;i++){ const ax=Math.floor(pr()*MAPW), ay=Math.floor(pr()*MAPH), t=tileAt(ax,ay);
    if(((t===T.SOIL&&pr()<0.14)||(t===T.RUIN&&pr()<0.22)||(t===T.SAND&&pr()<0.10)) && !solidAt(ax,ay) && dist(ax,ay,Z.camp.x,Z.camp.y)>5){
      const n=addNode(t===T.SAND?'tree':'rock',ax,ay); if(n&&t===T.SAND) n.palm=1; } }
  G.decor.push({kind:'chest', x:Z.barrow.x+0.5, y:Z.barrow.y-7+0.5, rich:10, armorgift:2});
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
  // Your brother the prince holds the Wreckstrand landing and the beached sloop - the way
  // home - while you take the isle. Set up when you first make landfall in Act II, and kept
  // here on every visit so you always land beside him and the boat (not just the cutscene).
  if(!G.npcs.some(n=>n.id==='brother')){
    const sp=(typeof findOpenNear==='function' && findOpenNear(Math.round(Z.strand.x+2), Math.round(Z.strand.y+1), 5)) || [Z.strand.x+2, Z.strand.y+1];
    const b=makeNPC('brother','Jaist, Your Brother the Prince', sp[0], sp[1],
      {skin:'#d8a97a',hair:'#7a5a3a',shirt:'#3b5a7a',pants:'#33302a',cloak:'#274052',hairstyle:'short'},
      ["Go on - I'll mind the boat. If this rock stoves a hull the way the charts promised, someone has to keep our way home afloat.",
       "I'll keep a fire lit here on the strand. Find what this place is hiding, Joan - nothing I'd have to write a ballad about.",
       "Storm won't let up. Shout if the isle bites back and I'll come running, axe and all."],0.1);
    b.nightOwl=true;
    G.npcs.push(b);
  }
}
function spawnMobsReach(){
  const Z=REACH_ZONES;
  if(!(P.story && P.story.reachBossDown)){
    const sp=findOpenNear(Z.barrow.x, Z.barrow.y, 6) || [Z.barrow.x, Z.barrow.y];
    const brute=spawnMob('raidcap', sp[0], sp[1]);
    if(brute){ brute.boss=true; brute.bigBoss=true; brute.title='THE BARROW BRUTE'; brute.subtitle='WRECKER OF STORMREACH'; brute.reachboss=1; brute.ach='brutebane';
      brute.hp=brute.maxhp=3000; brute.dmg=34; brute.lvl=13; brute.hx=sp[0]; brute.hy=sp[1]; brute.respawnT=-1; brute.entrance='rise'; }
  }
  // storm-driven raiders wash up around the barrow
  if(!(P.story && P.story.reachBossDown)) for(let i=0;i<4;i++){ const a=Math.random()*TAU, r2=6+Math.random()*12;
    const sp=findOpenNear(Math.round(Z.barrow.x+Math.cos(a)*r2), Math.round(Z.barrow.y+Math.sin(a)*r2), 5);
    if(sp) spawnMob('raider', sp[0], sp[1]); }
}
function genReachAll(){ genReach(); bakeSolids(); placeObjectsReach(); placeReachHazard(); buildFoam(); spawnReachFolk(); spawnMobsReach(); buildMapBase(); }
// ---------- THE DROWNED CATACOMB (reachdeep) - THE OSSUARY DANCE ----------
// The Ossuary is cut into three stacked button-chambers. On first setting foot in each,
// a spectral BONEWRIGHT treads the chamber's floor-stones in a set order (a cut scene);
// then the stones go dark and you must tread the same steps. A wrong stone looses a
// ward-jolt (-HP) and the bonewright shows you the pattern again. Solve all three to
// grind the Bone Gate up onto the Drowned Vault. Leaving and re-descending replays the
// dances (the dungeon regenerates fresh until the warden is felled).
const RDANCE = {
  x0:27, x1:53, gateX0:39, gateX1:41,   // Ossuary interior span + the 3-wide central ward-gates
  chambers:[
    { name:'THE FIRST STEP',     y0:55, y1:62, entryY:61.4, gateY:54,
      cells:[[37,57],[43,57],[37,60],[43,60]],
      seq:[2,0,3] },
    { name:'THE SECOND MEASURE', y0:48, y1:53, entryY:53.2, gateY:47,
      cells:[[35,49],[40,49],[45,49],[35,52],[40,52],[45,52]],
      seq:[3,1,5,0] },
    { name:'THE LAST DANCE',     y0:41, y1:46, entryY:46.2, gateY:null,   // last -> the Bone Gate (y37)
      cells:[[35,42],[40,42],[45,42],[35,44],[40,44],[45,44],[35,46],[40,46],[45,46]],
      seq:[8,4,0,5,3] }
  ]
};
let REACHDEEP_WALLS = [];   // catacomb stone bordering the carved floor - drawn as visible ewall blocks
function genReachDeep(){
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  carve(30,76,50,90);   // R1 THE SUNKEN STAIR - entry landing
  // OPTIONAL SIDE BRANCH - THE BONE ANNEX: a winding grave-crypt off the Sunken Stair (east, then
  // up, then back west to the cache) - the catacomb's one true detour. Dead-end, never gates a route.
  carve(50,84,64,86);   // east passage from the landing
  carve(60,70,66,86);   // the crypt-shaft, turning north
  carve(52,70,66,73);   // the annex gallery (the cache waits here)
  carve(38,60,42,78);   // corridor A
  carve(26,40,54,62);   // R2 THE OSSUARY - the three dance-chambers
  carve(38,34,42,42);   // corridor B (the sealed gate at y37)
  carve(28,6,52,34);    // R3 THE DROWNED VAULT - warden + hoard
  // wall off a REWARD ROOM across the top of the vault (y6-12); the gap (x38-42) is left as floor
  // so the wall-face pass below excludes it - a catgate seals it until the warden falls
  for(let x=28;x<=52;x++){ if(x>=38 && x<=42) continue; setTile(x,13,T.RUIN); setSolid(x,13,1); }
  // the two internal ward-walls that split the Ossuary into three chambers: solid stone
  // across the room, save the 3-wide central doorway each ward-gate seals (see setupReachDance).
  // Span the FULL carved width (26..54), not just RDANCE.x0..x1 (27..53): the old span left a
  // one-tile floor gap at each edge (x=26 and x=54) you could slip through to skip the gates.
  for(const gy of [54,47]) for(let x=26;x<=54;x++){
    if(x>=RDANCE.gateX0 && x<=RDANCE.gateX1) continue;   // leave the central doorway carved
    setSolid(x,gy,1); setTile(x,gy,T.RUIN);
  }
  // record the visible wall faces (catacomb stone bordering the carved floor) BEFORE
  // the bone gate goes solid, so an opened gate never leaves a phantom wall behind
  REACHDEEP_WALLS=[];
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(!solidAt(x,y)) continue;
    let border=false;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])
      if(inb(x+dx,y+dy) && !solidAt(x+dx,y+dy)){ border=true; break; }
    if(border) REACHDEEP_WALLS.push([x,y]);
  }
  for(let x=38;x<=42;x++){ setTile(x,37,T.RUIN); setSolid(x,37,1); }   // BONE GATE - solid until all three locks
}
function placeObjectsReachDeep(){
  G.decor=G.decor||[];
  // the catacomb stone that gives the rooms their shape (baked static scenery)
  for(const [x,y] of REACHDEEP_WALLS) G.decor.push({kind:'ewall', x:x+0.5, y:y+0.5, s:((x*7+y*13)%5)});
  G.decor.push({kind:'tombmouth', x:40.5, y:88.5, up:1, label:'the way up'});   // back to the graveyard
  setSolid(40,88,0); setTile(40,88,T.RUIN);
  for(const [tx,ty] of [[32,80],[48,80],[28,58],[52,58],[28,50],[52,50],[28,44],[52,44],[30,10],[50,10],[40,8],[56,85],[63,78],[57,72]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // THE BONE ANNEX cache (off the Sunken Stair's east passage) - optional detour loot
  if(!(P.story && P.story.sideCacheTaken && P.story.sideCacheTaken.reach))
    G.decor.push({kind:'chest', x:54.5, y:71.5, sideCache:'reach', loot:'bone', title:'THE BONE ANNEX', sub:'GRAVE-GOODS THE CATACOMB KEPT'});
  const grave=(x,y)=>{ if(inb(x,y)&&!solidAt(x,y)){ G.decor.push({kind:'grave',x:x+0.5,y:y+0.5,s:(x+y)%3}); setSolid(x,y,1); } };
  G._reachGateOpen=false;
  // ---- THE OSSUARY DANCE: three floor-stone memory chambers (see setupReachDance) ----
  setupReachDance();
  // dressing graves in the far corners of the chambers (clear of the stones + their lanes)
  for(const [gx,gy] of [[29,56],[51,56],[29,43],[51,43],[30,26],[50,26],[34,12],[46,12]]) grave(gx,gy);
  // THE REWARD ROOM: the warden's hoard + the climb-out, walled off across the top of the vault
  // (partition laid in genReachDeep), sealed until the Drowned Minotaur falls (killMob -> openRewardRoom).
  buildRewardRoom({ x0:28, x1:52, wallY:13, gx0:38, gx1:42, floorT:T.RUIN, sealInGen:true,
    chest:{kind:'chest', x:34.5, y:9.5, deep:1, reachverse:1}, exitX:46, exitY:9,
    cleared:!!(P.story && P.story.tombBossDown) });
  // No loose loot chest down in the vault: the catacomb's one true keeping is the Tidefarer's
  // verse, sealed in the reward room past the warden (the 'reachverse' branch in openChest) -
  // the thing Jaist sent you down here to find, not a stray tonic on the boss-room floor.
  G.critters=[];
  // THE BONE GATE (y37) gets its own visible bone-portcullis so the wall you cannot
  // yet pass reads as a sealed gate, not an invisible barrier - it grinds up (bars and
  // all) in openBoneGate once the last dance is trodden true. Skipped on a cleared run,
  // where the gate already stands open below.
  if(!(P.story && P.story.tombBossDown))
    for(let x=38;x<=42;x++) G.decor.push({kind:'bonebars', x:x+0.5, y:37.5, gate:'bonemain'});
  // a cleared run (the warden is down) tears the dance down and stands every gate open
  if(P.story && P.story.tombBossDown){ G._reachGateOpen=true;
    collapseReachDance();
    for(let x=38;x<=42;x++){ setSolid(x,37,0); setTile(x,37,T.RUIN); } }
}
// ================= THE OSSUARY DANCE =================
// Build the three button-chambers: the floor-stones, and the two ward-gates that seal each
// chamber's northern doorway until its pattern is trodden true.
function setupReachDance(){
  const D={ chambers:[], demo:null, zap:null, lastKey:'',
            ghostDecor:{kind:'danceghost', x:-99, y:-99, hidden:true, anim:0, face:1, fadeA:1} };
  G.decor.push(D.ghostDecor);
  for(const spec of RDANCE.chambers){
    const c={ name:spec.name, y0:spec.y0, y1:spec.y1, entryY:spec.entryY, gateY:spec.gateY,
              seq:spec.seq.slice(), lit:0, shown:false, solved:false, awaitInput:false, btns:[], gateTiles:null };
    for(let i=0;i<spec.cells.length;i++){ const [x,y]=spec.cells[i];
      const b={kind:'dancebtn', x:x+0.5, y:y+0.5, tx:x, ty:y, lit:false, litT:0};
      G.decor.push(b); c.btns.push(b); }
    if(spec.gateY!=null){   // seal the ward-gate doorway (the last chamber exits by the Bone Gate)
      const tiles=[]; const tag='dance'+c.name;
      for(let x=RDANCE.gateX0;x<=RDANCE.gateX1;x++){ tiles.push([x,spec.gateY]);
        setSolid(x,spec.gateY,1); setTile(x,spec.gateY,T.RUIN);
        G.decor.push({kind:'bonebars', x:x+0.5, y:spec.gateY+0.5, gate:tag}); }
      c.gateTiles=tiles; c.gateTag=tag;
    }
    D.chambers.push(c);
  }
  G._dance=D;
}
// tear the whole dance down (the warden has fallen): open every ward-gate, strip the stones
function collapseReachDance(){
  const D=G._dance; if(!D) return;
  D.demo=null; D.zap=null; if(D.ghostDecor) D.ghostDecor.hidden=true;
  for(const c of D.chambers){ c.solved=true; c.awaitInput=false;
    if(c.gateTiles) for(const [x,y] of c.gateTiles){ setSolid(x,y,0); setTile(x,y,T.RUIN); } }
  G.decor=G.decor.filter(d=> d.kind!=='dancebtn' && d.kind!=='danceghost'
    && !(d.kind==='bonebars' && (''+d.gate).indexOf('dance')===0));
  G._dance=null;
}
// the spectral bonewright rises and treads chamber c's stones in order - the cut scene
function startReachDemo(c){
  const D=G._dance; if(!D) return;
  c.shown=true; c.awaitInput=false; c.lit=0;
  for(const b of c.btns){ b.lit=false; b.litT=0; }
  const wp=[{x:40.5, y:c.entryY}];                         // in from the south doorway...
  for(const idx of c.seq) wp.push({x:c.btns[idx].x, y:c.btns[idx].y, btn:idx});   // ...onto each stone in turn
  D.demo={ chamber:c, wp, seg:0, pause:0.55, done:false };
  const gh=D.ghostDecor; gh.hidden=false; gh.x=40.5; gh.y=c.entryY+1.4; gh.face=1; gh.anim=0; gh.fadeA=1;
  if(typeof cinematic==='function') cinematic(true);
  banner(c.name, 'THE BONEWRIGHT TREADS THE WARD - MARK EACH STONE');
  Snd.boss&&Snd.boss(); G.shake=Math.max(G.shake||0,0.2);
  P.click=null; P.moving=false;
}
// advance the cut scene: walk the bonewright waypoint to waypoint, lighting each stone as trod
function advanceReachDemo(dt){
  const D=G._dance, dm=D.demo, gh=D.ghostDecor, c=dm.chamber;
  gh.anim=(gh.anim||0)+dt*3.2;
  if(dm.done){ gh.fadeA=(gh.fadeA!=null?gh.fadeA:1)-dt*2.0; if(gh.fadeA<=0) finishReachDemo(); return; }
  if(dm.pause>0){ dm.pause-=dt; return; }
  const tgt=dm.wp[dm.seg];
  if(!tgt){ dm.done=true; dm.pause=0.5; return; }          // route done -> hold, then fade
  const dx=tgt.x-gh.x, dy=tgt.y-gh.y, dd=Math.hypot(dx,dy)||1e-4;
  if(dx<-0.03) gh.face=-1; else if(dx>0.03) gh.face=1;
  const step=4.2*dt;
  if(dd<=step){ gh.x=tgt.x; gh.y=tgt.y;
    if(tgt.btn!=null){ const b=c.btns[tgt.btn]; b.lit=true; b.litT=0;
      Snd.pickup&&Snd.pickup(); burst(b.x,b.y-0.2,'#9fe8c0',10,1.8); shockwave(b.x,b.y,'rgba(120,220,160,0.6)',22);
      G.shake=Math.max(G.shake||0,0.12); dm.pause=0.44; }
    dm.seg++;
  } else { gh.x+=dx/dd*step; gh.y+=dy/dd*step; }
}
// the cut scene ends: the stones go dark and control returns for the player's turn
function finishReachDemo(){
  const D=G._dance, c=D.demo.chamber, gh=D.ghostDecor;
  gh.hidden=true; gh.x=-99; gh.y=-99;
  for(const b of c.btns){ b.lit=false; b.litT=0; }
  c.awaitInput=true; c.lit=0; D.demo=null;
  D.lastKey=Math.floor(P.x)+','+Math.floor(P.y);
  if(typeof cinematic==='function') cinematic(false);
  banner('YOUR TURN', 'TREAD THE SAME STONES, IN THE SAME ORDER');
  Snd.quest&&Snd.quest();
}
// read the hero's footfalls onto chamber c's stones (called only while awaiting input)
function reachDanceStep(c){
  const D=G._dance;
  const tx=Math.floor(P.x), ty=Math.floor(P.y), key=tx+','+ty;
  if(key===D.lastKey) return;        // only act as we step onto a NEW tile
  D.lastKey=key;
  const bi=c.btns.findIndex(b=>b.tx===tx && b.ty===ty);
  if(bi<0) return;                   // plain floor between the stones - safe
  const b=c.btns[bi];
  if(bi===c.seq[c.lit]){             // the right stone, in turn
    b.lit=true; b.litT=0; c.lit++;
    Snd.pickup&&Snd.pickup(); burst(b.x,b.y-0.2,'#9fe8c0',10,1.8);
    addFloat(String(c.lit), b.x, b.y-1.4, '#bff0d0', 1.0);
    if(c.lit>=c.seq.length) solveReachChamber(c);
  } else {                           // a wrong stone - the ward jolts you
    reachDanceZap(c);
  }
}
// the pattern is trodden true: the ward-gate (or the Bone Gate) grinds up
function solveReachChamber(c){
  c.solved=true; c.awaitInput=false;
  for(const b of c.btns) b.lit=true;
  Snd.quest&&Snd.quest(); G.shake=Math.max(G.shake||0,0.4);
  if(c.gateTiles){
    for(const [x,y] of c.gateTiles){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
    G.decor=G.decor.filter(d=>!(d.kind==='bonebars' && d.gate===c.gateTag));
    invalidateScenery&&invalidateScenery();
    shockwave(40.5, c.gateY+0.5, 'rgba(120,220,160,0.85)', 48);
    banner('A WARD-GATE GRINDS UP','THE DANCE WAS TRUE - CLIMB ON');
  } else {
    openBoneGate();   // the last chamber opens onto the Drowned Vault
  }
  autoSave&&autoSave();
}
// a wrong step: the ward looses a bone-green jolt (-HP), wipes the stones, and re-shows the dance
function reachDanceZap(c){
  const D=G._dance; if(D.zap) return;
  if(P.hp>1){ P.hp=Math.max(1, P.hp-6); if(typeof refreshUI==='function') refreshUI(); addFloat('-6',P.x,P.y-1.4,'#9fe8c0',1.0); }
  Snd.boss&&Snd.boss(); Snd.hit&&Snd.hit(); G.shake=Math.max(G.shake||0,0.6); buzz&&buzz(24); G.flash=Math.max(G.flash||0,0.35);
  shockwave(P.x,P.y,'rgba(120,220,160,0.85)',46); burst(P.x,P.y-0.4,'#9fe8c0',18,2.6);
  for(const b of c.btns){ b.lit=false; b.litT=0; }
  c.lit=0; c.awaitInput=false;
  D.zap={ chamber:c, t:0, dur:0.75, x:P.x, y:P.y };
  P.click=null; P.moving=false; P.slideDir=null; P.rollT=0;
  banner('A WARD-JOLT!','A WRONG STONE - WATCH THE DANCE AGAIN');
}
function openBoneGate(){
  if(G._reachGateOpen) return; G._reachGateOpen=true;
  for(let x=38;x<=42;x++){ setSolid(x,37,0); setTile(x,37,T.RUIN); }
  G.decor=G.decor.filter(d=>!(d.kind==='bonebars' && d.gate==='bonemain'));   // the portcullis grinds up with it
  invalidateScenery&&invalidateScenery();
  Snd.quest&&Snd.quest(); shockwave(40.5,37.5,'rgba(120,220,160,0.85)',55); G.shake=Math.max(G.shake||0,0.5);
  banner('THE BONE GATE GRINDS UP','THE DROWNED VAULT LIES OPEN');
  autoSave&&autoSave();
}
// drive THE OSSUARY DANCE: play each chamber's cut scene on first entry, then read the
// hero's footfalls against the pattern; a wrong stone looses a ward-jolt and re-shows it.
function updateReachDeep(dt){
  const D=G._dance; if(!D) return;
  // gently age each lit stone's glow phase
  for(const c of D.chambers) for(const b of c.btns) if(b.lit) b.litT=(b.litT||0)+dt;
  // the cut scene plays out (the hero is held still, see updatePlayer)
  if(D.demo){ advanceReachDemo(dt); return; }
  // the ward-jolt plays out, then the bonewright shows the dance again
  if(D.zap){ D.zap.t+=dt;
    if(Math.random()<0.6) burst(D.zap.x+rnd(-0.4,0.4), D.zap.y-rnd(0,1.4), '#9fe8c0', 1, 1.6);
    if(D.zap.t>=D.zap.dur){ const c=D.zap.chamber; D.zap=null; startReachDemo(c); }
    return;
  }
  if(P.dead) return;
  // which chamber is the hero standing in?
  let cur=null;
  for(const c of D.chambers){ if(P.x>=RDANCE.x0-0.5 && P.x<=RDANCE.x1+1.5 && P.y>=c.y0-0.4 && P.y<=c.y1+0.6){ cur=c; break; } }
  if(!cur) return;
  if(!cur.shown && !cur.solved){ startReachDemo(cur); return; }   // first arrival -> the cut scene
  if(cur.awaitInput && !cur.solved) reachDanceStep(cur);          // the player's turn
}
function spawnMobsReachDeep(){
  const Z=REACHDEEP_ZONES;
  // the Drowned Minotaur wardens the vault beyond the Bone Gate; skeletons haunt it with him
  if(!(P.story && P.story.tombBossDown)){
    const sp=findOpenNear(Z.heart.x, Z.heart.y, 6) || [Z.heart.x, Z.heart.y];
    const w=spawnMob('minotaur', sp[0], sp[1]);
    if(w){ w.boss=true; w.bigBoss=true; w.title='THE DROWNED MINOTAUR'; w.subtitle='WARDEN OF THE DROWNED VAULT'; w.tombboss=1; w.ach='deepwarden';
      w.hp=w.maxhp=900; w.dmg=34; w.lvl=14; w.hx=sp[0]; w.hy=sp[1]; w.respawnT=-1; w.entrance='rise'; }
  }
  // skeletons haunt the vault only - the Ossuary above is left to its ward-dance
  for(let i=0;i<3;i++){ const z=Z.heart, a=Math.random()*TAU, r2=Math.random()*z.r*0.5;
    const sp=findOpenNear(Math.round(z.x+Math.cos(a)*r2), Math.round(z.y+Math.sin(a)*r2), 5);
    if(sp) spawnMob('skeleton', sp[0], sp[1]); }
  // THE BONE ANNEX side-crypt: three dead guarding the grave-goods (skip once the warden's down)
  if(!(P.story && P.story.tombBossDown))
    for(const [zx,zy] of [[55,71],[62,73],[62,81]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('skeleton',sp[0],sp[1]); }
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
  // no flight-narration toast - the fade and the Cloudreach itself carry the moment
  flyToWorld('sky');
}
function askSkyDragon(){
  // Ashwing on the Cloudreach is your ride between the isles. He always bears you back to
  // the Sunward Isle; once you carry the CLOUD-CHART down from the Broken Crown (and the high
  // wind is tamed), he'll also fly you on to Windsurf - the three isles the chart maps.
  const haveChart = !!(P.story && P.story.skyMapTaken);
  const btns=[];
  if(haveChart) btns.push({label:'Fly on to Windsurf', cls:'gold', fn:()=>{ closeDialog();
    if(!flightLockOK()) return;
    const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1;
    toast('Ashwing tips off the cloud-shelf and pours down through the cold cloud - an industrious city rising bright out of the water to meet you: <b>Windsurf</b>.',6000);
    if(Snd.boss) Snd.boss();
    setTimeout(()=>{ try{ switchWorld('wind'); autoSave&&autoSave();
        banner('WINDSURF ISLE','YOU COME DOWN OUT OF THE CLOUD');
      } finally { setTimeout(()=>{ if(fd) fd.style.opacity=0; G._flying=0; G._flyUntil=0; },260); } }, 1000);
  }});
  btns.push({label:'Fly back to the Sunward Isle', cls: haveChart?undefined:'gold', fn:()=>{ closeDialog();
    flyToWorld('east','Ashwing tips off the cloud-shelf and pours downward - the Sunward Isle swelling up green out of the sea to meet you.'); }});
  btns.push({label:'Not just yet', ghost:true, fn:closeDialog});
  const line = haveChart
    ? '<i>Ashwing dips his great head to the Cloud-Chart and rumbles low, tracing a wing-tip along its inked wind-roads. He knows every one - Windsurf, the Cloudreach, the Sunward Isle - and will bear you to any of them, now the high wind lies still.</i> <b>"Wherever you need to go, friend - only name it, and I\'ll gladly bear you there."</b>'
    : '<i>Ashwing folds a wing against the wind and rumbles - he will carry you back down to the Sunward Isle whenever the height gets into your knees. (Run the rainbow road and bring back the crown\'s chart, and he\'ll fly you on to Windsurf too.)</i>';
  // open the dialog window itself (dlg.open + display + portrait) via lairDialog - calling
  // setDialog alone only fills a HIDDEN panel, so the menu never appeared and "Fly down" read as dead
  lairDialog('Ashwing', line, btns);
}
// The Leap is now just a scenic overlook - there is no stormsail. Travel between the isles
// is Ashwing's work, unlocked by the Cloud-Chart. The shelf points you to him.
function useLeapPoint(){
  if(!(P.story && P.story.skyMapTaken)){
    toast('You lean over the shelf-lip - nothing below but cold cloud and, far down, a city bright on the water. <b>It is far too far to jump.</b> Run the <b>Wind-Lost Bird</b>\'s rainbow road, put out the Storm-Eye, and bring the <b>Cloud-Chart</b> back to <b>Ashwing</b> at the landing - he\'ll bear you down.',6600);
  } else {
    toast('The high wind is tamed, but it is still a long drop. <b>Ashwing</b> waits at the landing - show him the <b>Cloud-Chart</b> and he\'ll fly you down to Windsurf, on to the Sunward Isle, or back up here whenever you like.',6000);
  }
  Snd.step&&Snd.step(5);
}

/* =====================================================================
   ALDERMERE - the royal capital. A great walled city climbing from the
   harbor to the Tideglass Palace, where a grieving king has ruled alone
   since a fever took his queen when his children were small - and Vath's
   treachery later took the children themselves.
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
  addBuilding('tower', T2.x, T2.y, 'The Cathedral of the Tide').tall=true;   // the capital's spire stands twice as tall, same as Orin's tower on Emberwick
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
  // ---- the Queen's Garden: a place of quiet mourning ----
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
// the lettuce beds sit just southwest of the Queen's Garden
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
    ['His Majesty grieves in public now, which is new. For all those long years he did it behind a shut door.',
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
      g.nightOwl=true; g.noBark=1;   // the watch stands silent - no floating idle chatter over their heads (still speaks if you talk to them)
      G.npcs.push(g);
    }); }
  // ---- the Herald: town crier in the plaza ----
  G.npcs.push(makeNPC('brea','Brea the Herald', PL.x+0.5, PL.y+2.5,
    {skin:'#8a5a3a',hair:'#2a2018',shirt:'#7a5a2f',pants:'#4a3a24',hairstyle:'bun'},
    ['Hear it! The Frozen Isle\'s cursed cold is broken - the strait is safe to sail again, and trade convoys run within the fortnight!',
     'Hear it! The skies over the Aerie have quieted; her Rookmother sends her thanks to the unnamed traveler!',
     'Word comes off every isle at once - old curses breaking like ice in spring. The city cannot decide if it is a miracle or a warning.'],0.1));
  // ---- the Gardener, tending the memorial ----
  G.npcs.push(makeNPC('isolde','Isolde the Gardener', GA.x+0.5, GA.y+2.5,
    {skin:'#c99a72',hair:'#7a6a4a',shirt:'#4a5a44',pants:'#3a3a2c',hairstyle:'bun'},
    ['This is the Queen\'s garden. She loved the sea-colored blooms - so I keep them, though she has not walked here since the children were small.',
     'A fever took her that winter, and no draught in the realm could turn it. The King had the font built so there\'d be a place to weep that wasn\'t her own empty rooms.',
     'Strange - some travelers stand at the font and go pale, as if they half-remember it. You look a little that way yourself.'],0.15));
  // ---- market + harbor flavor ----
  G.npcs.push(makeNPC('doran','Doran the Factor', M.x+0.5, M.y+2.5,
    {skin:'#a0703f',hair:'#3a2f26',shirt:'#5a4a7a',pants:'#3a3244',beard:'#3a2f26'},
    ['Silk from the Sunward Isle, ore from Barik, ice-wine off the Frozen strait now the road\'s safe - the Bazaar sells the whole map.',
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
  // ---- Hollis: keeper of The Coin & Cup, the capital's public house off the Bazaar ----
  { const inn=makeNPC('hollis','Hollis the Innkeeper', M.x-2, M.y+10.5,
    {skin:'#c29a6e',hair:'#3a2f2a',shirt:'#5a3a5e',pants:'#3a3340',apron:'#b8a890',hairstyle:'bun'},
    ['Welcome to the Coin & Cup - grandest beds in Aldermere, and the only ones the crown\'s taxes haven\'t reached. Yet.',
     'Isle-folk, factors, off-duty guardsmen - they all end their night under my roof, whatever they started it as.',
     'A clean bed and a hot bowl, same price as ever. The court can keep its banquets.'],0.6);
    inn.nightOwl=true; G.npcs.push(inn); }   // a good innkeep is up as long as the lamps are lit
  // ---- Jaist, Your Brother the Prince: once the mask is off and Act I's homecoming is
  // underway, he crosses from the isles at your side and WALKS THE CAPITAL WITH YOU -
  // from the quay up to the Tideglass Palace and the audience with the King. He trails
  // the player (follow) rather than holding a post, and only stands here during that
  // homecoming window (unmasked, before the throne scene closes Act I). ----
  if(P.story && P.story.unmasked && !P.story.act1End){
    const S=Z.spawn||{x:H.x,y:H.y};
    const bp=findOpenNear(Math.round(S.x+1),Math.round(S.y-1),8)||[S.x+1,S.y-1];
    const bro=makeNPC('brother','Jaist, Your Brother the Prince', bp[0], bp[1],
      {skin:'#d8a97a',hair:'#7a5a3a',shirt:'#2f5fa0',pants:'#33302a',cloak:'#25406a',hairstyle:'short'},
      ['Lead on, Joan. Whatever waits in that throne room, we walk into it together this time.',
       'So this is Aldermere with my own eyes, and not a page in a book. Father is up past the forecourt - take us to him.',
       'Every wall of this city was raised for the three of us. Let us go and give the old man back two of the three.'],0);
    bro.follow=1; bro.nightOwl=1;
    G.npcs.push(bro);
  }
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
  set('aldous',['Long years I called Vath a drowned man and mourned him beside my own. Now I know he swam. Find him, traveler. Find what he did with my son and daughter.',
    'You wear that pendant like it was made for you. Perhaps that is why I trust you with this - though I could not say why.',
    'Go where the curses lead. They are his handwriting. Follow them to the hand that wrote them.']);
  set('perrin',['His Majesty has not stood so straight in decades. Whatever passed between you gave the old grief a direction. That is no small gift.',
    'A royal writ, an open purse, and the King\'s own hope riding on you. Do not squander them.']);
  set('brea',['Hear it! The King has named the traveler his own hand abroad - go where they go, and you go with the crown\'s blessing!']);
}
// THE RECKONING: once Jaist has learned the founders' seal, the ferry runs to Aldermere for
// the final confrontation. The capital has fallen - Vath holds the throne, the King is long
// gone, the guards and folk are fled, and violet corruption bleeds out from the palace. The
// city is empty but for Vath, waiting on the stolen throne. Ends when Vath is bound (vathDown).
function crownReckoning(){ return !!(P.story && P.story.sealLearned && !P.story.vathDown); }
function genCrownAll(){
  genCrown(); bakeSolids(); placeObjectsCrown(); buildFoam();
  if(crownReckoning()) spawnCrownReckoning();   // deserted, corrupted, Vath on the throne
  else { spawnCrownFolk(); spawnMobsCrown(); }
  buildMapBase();
}
// Aldermere fallen: no folk, no guards, no King - only Vath, waiting sealed on the throne
// until you climb the palace to face him. (Beat 1: the arrival + confrontation + phase-1
// fight. The rage/monster phase 2 and the sealing ending hang off crownVathDown / vathDown.)
function spawnCrownReckoning(){
  const Z=CROWN_ZONES, PA=Z.palace;
  G._crownConfront=0;
  const base=[Math.round(PA.x), Math.round(PA.y+2)];
  const sp=(typeof findOpenNear==='function' && findOpenNear(base[0], base[1], 9)) || base;
  const m=spawnMob('mage', sp[0], sp[1]);
  if(m){
    m.crownVath=1; m.boss=true; m.bigBoss=true; m.title='VATH THE EMBERBINDER'; m.subtitle='ON THE THRONE HE STOLE';
    m.ach='enchantersbane'; m.lvl=16; m.maxhp=1000; m.hp=1000; m.dmg=32; m.speed=2.7; m.aggro=16;
    m.hx=sp[0]; m.hy=sp[1]; m.respawnT=-1; m.state='idle'; m.noAggroT=1e9;
    m.sealed=true; m.invuln=true; m.arena=1; m.wphase=1; m.entrance='enthrall';
  }
}
// proximity trigger: climbing to the throne wakes Vath. Mirrors the Tideward Guardian's
// sealed-until-you-step-in reveal (updateEmberTomb). Fires the confrontation, then the fight.
function updateCrownReckoning(dt){
  if(!crownReckoning()) return;
  // PHASE 2: Vath's unbound demon is a customAI boss (generic AI leaves it be), so it is driven
  // here with the heavy sweep/shard/slam moveset - the same one the Tideward Guardian uses.
  for(const m of G.mobs) if(m.vathDemon && !m.dead && !m.sealed && !m.introKind && !(typeof dlg!=='undefined'&&dlg.open)) updateWardKing(m,dt);
  const boss=G.mobs.find(m=>m.crownVath && !m.dead);
  if(!boss) return;
  const PA=CROWN_ZONES.palace;
  if(boss.sealed && !G._crownConfront && dist(P.x,P.y,boss.x,boss.y)<7 && P.y<PA.y+7){
    G._crownConfront=1;
    if(typeof storyCard==='function') storyCard('<i>You climb the Tideglass steps into the throne room. It is empty - the long hall stripped and silent, the great seat where your father sat run through with veins of living violet.</i> <b>Your father is not here.</b> <i>He has been gone a long time. Only one figure waits in the dark under the stolen crown, and he does not rise so much as unfold.</i> <b style="color:#c9a0ff">"The last of the line. Come all this way to give me the set."</b> <i>Vath steps down off the throne, violet gathering to his hands.</i>',
      {label:'End this', onOk:()=>{
        boss.sealed=false; boss.invuln=false; boss.noAggroT=0; boss.state='chase';
        if(typeof startBossIntro==='function' && !G.bossIntro) startBossIntro(boss,{kind:boss.entrance||'enthrall',title:boss.title,sub:boss.subtitle});
      }});
  }
}
function genMainAll(){
  genMainland(); bakeSolids(); placeObjectsMain(); buildFoam();
  if(P.projects && P.projects.beacon) placeBeacon();
  placeBarikFlood();
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
  doneText:'Rows are clean, seed\'s safe, and I owe you more than coin. See that chestnut cob by the paddock? Old plough-horse, sound legs, and bored to tears since we went over to oxen. He\'s yours - Chestnut answers a whistle, and I\'ll stable him here whenever you\'ve no need of him. Go on, a farmhand like you has ground to cover.',
  rw:{gold:60, item:{potion:1}, xp:{melee:160, magic:120}, horse:true} };
QUESTS.torv1={ giver:'torv', title:'Reopen the Shafts', kind:'gather', need:{stone:10},
  brief:'Brenna sent you up from the harbor, did she? She frets - always has. Well, you\'ve climbed all this way, so make it worth the boots: three generations of Barik built with stone from these shafts, then the wilds took the road and the pit went quiet. Help me clear the mouth - ten good stone proves the vein still gives.',
  log:'Mine 10 stone around the Old Barik Mines for Torv.',
  doneText:'Listen to that ring - the old girl\'s awake, and that\'s your doing. Barik builds again, starting with your pay. ... Here, one more word, since you swing a pick like you mean it: away to the south-east, past the Mirefen, a run of strange violet rock came up in the night. Won\'t chip, won\'t split - no pick on Barik so much as marks it, and believe me I\'ve tried. But the old delvers swore the Undermaw keeps a pick of star-dark iron down in its deep hoard - the one tool that bites clean through stone like that. You want past those purple rocks, that\'s where your edge is waiting.',
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
  brief:'How did you break those pesky violet stones? Ha - I should have known better than to trust the word of that wicked wizard. I promised to sail him to an island east of every chart, and leaving those cursed stones strewn across my cove is how he repays me. ... You want me to take you there? I\'d love nothing more, truly - but my girl Wren has been asking after a ribbon from Mira in the village, and I can\'t leave my boat to sail out that way. Tell you what: you get me a ribbon, and I\'ll take you out to that isle whenever you want, free of charge. Mira weaves the best at Thimble and Thread in Greyharbor.',
  log:'(1/3) Ask Mira the Seamstress in Greyharbor about a ribbon.',
  doneText:'A ribbon? Oh, I\'d weave you the prettiest on Barik in a heartbeat - but my whole silk shipment was taken on the north road. Brigands nest in the pines north of Blackpine now, and my silk sits in their camp. I cannot say when more will come. Here - take a couple of tonics for the road; the pines are no place to go dry.',
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
  doneText:'There she is - rails inlaid, deck sanded smooth. Fine board, if I say so. Only she\'s bare, and no board crosses that strait without a sail... and I\'ve none fit for it. The last stormsail on this rock is <b>Nessa the sailmaker\'s</b>, locked in the old grinding works BENEATH THE WINDMILL since the gear-train jammed. Burl left the key with me for just such a day - here, take it. Now go see <b>Nessa</b>: it\'s her sail down there, and she\'ll tell you what fouled the works. Bring it up and she\'ll step it to your board.',
  rw:{gold:20} };
QUESTS.sail={ giver:'nessa', title:'The Sail in the Undermill', kind:'special', xpL:220,
  brief:'So Tolen shaped you a board - then it\'s my sail you\'ll be needing, and there\'s the rub. My last good stormsail is locked in the old grinding works BENEATH THE WINDMILL, behind the millstone gate, and has been since the gear-train seized a season back. And it wasn\'t rust that stopped it - something got FOULED in the shaft down there and won\'t lie quiet. Take Tolen\'s key, go down, put the thing down, and bring my sail up. Do that and I\'ll step it to your board myself.',
  log:'Descend the Undermill beneath the windmill. Defeat the guardian fouling the works to raise the millstone gate, and carry Nessa\'s stormsail back up to her.',
  doneText:'You brought it up - my own stormsail, whole and dry, after all this time. Hold still and I\'ll step it to your board now... there. She\'ll fly true. <b>You\'re good to go</b> - she\'ll carry you clean across the shallows, so the light water\'s a road to you now. Then it\'s <b>Rell</b> you want, down at the docks - he\'ll point you at that cold thing past the breakwater.',
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
  brief:'Our Warden kept these winters KIND for a hundred years - deep snow and thick safe ice, seals on the floes and fish beneath them. Then the robed man walked onto the glacier and the weeping stopped, and the cold turned cruel and dead. It is bound, not turned. Climb the ice road, break whatever holds it, and give the old thing back its tears - and Hearthhold its living winter. We are freezing to death down here.',
  log:'Climb to the Weeping Glacier and free the bound ice Warden to break the cursed cold. (Lv 13 - dress warm.)',
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
  log:'Shoo 3 garden hares off the lettuce beds by the Queen\'s Garden.',
  doneText:'Ha! Look at them run! The beds are mine again - for tonight, anyway. Here, straight from the good rows. Tell Nan in the palace kitchen they\'re from Gale, she\'ll know what to do with them.',
  rw:{gold:50, item:{lettuce:3, elixir:1}, xp:{farming:180}} };
QUESTS.wyrm={ giver:'vath', title:'The Wyrm of Mount Kea', kind:'kill', kill:{dragon:1}, xpL:320,
  brief:'You feel the heat off the mountain? A wyrm nests in the fire-heart, deep under the caldera - old, and lately black of heart. It has become a torment to the folk of this isle - scorching their groves, driving them off the high ground - and it will render Kohana to ash by the next storm, mark me. Climb the ash road, take the fissure DOWN into the Emberdeep, and put the beast down at the bottom.',
  log:'Climb Mount Kea, descend the caldera fissure into the Emberdeep, solve its three locks, and confront the wyrm at the end. (Lv 8+ recommended.)',
  doneText:'Ashwing sleeps easy now, and so does Kohana.',
  rw:{gold:220, item:{potion:3}, xp:{melee:420, archery:420, magic:420}} };
QUESTS.vhunt={ giver:'moli', title:'The Enchanter in the Grove', kind:'kill', kill:{mage:1}, xpL:300,
  brief:'That robed one - Vath, he calls himself - was never a friend to Kohana, eh. Drive him from the grove before he binds another soul, then come and sit, and we will call it square.',
  log:'Confront Vath the enchanter in the palm grove and drive him off.',
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
/* ---------- The Duchess's love: a letter carried to the Sunward Isle, a reply
   carried home, and a wedding that leaves Barik with a Duke. Two 'special'
   quests driven entirely by scripted scenes at Elias and Maelis (see 06-dialog),
   so neither the generic talk-completion nor a quest board can short-circuit
   the marriage. duchesslove opens on your first landing on the Sunward Isle. --- */
QUESTS.duchesslove={ giver:'maelis', title:'A Letter for Sunward', kind:'special', xpL:260,
  brief:'May I trust you with something that is not a war? There is a man on the Sunward Isle - Lord Elias, a scholar of tides. We have written to one another for three years and met in person not once, the strait being what it was. Now that you have opened the water, carry him this.<br><i>(She presses a wax-sealed letter into your hands, and does not quite meet your eye.)</i> Put it in his hand, and no other.',
  log:'Carry the Duchess’s sealed letter to Lord Elias on the Sunward Isle.',
  doneText:'',   // resolved by the scripted delivery scene at Elias
  rw:{xp:{magic:120}} };
QUESTS.duchessreply={ giver:'elias', title:'The Reply', kind:'special', xpL:320,
  brief:'',      // never offered from a board - handed to you in the delivery scene
  log:'Bring Lord Elias’s reply back to Duchess Maelis in Barik Keep.',
  doneText:'',   // resolved by the marriage scene at Maelis (grants the 1000g)
  rw:{gold:1000, xp:{magic:200}} };
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
  rw:{gold:150, item:{potion:3}, xp:{melee:260, archery:260, magic:260}}, unlocks:['embers'] };
QUESTS.springs={ giver:'maren', title:'Waters of Old', kind:'visit', zone:'springs',
  brief:"My grandmother swore there were warm springs in the western hills - water that closes wounds. I'm too old for the walk and too stubborn to admit it. Find them for me. Just… find them.",
  log:'Discover the Ember Springs in the isle\'s western hills.',
  doneText:"You FOUND them. Warm as a kettle, she used to say. Go soak whenever the island bites you - and take this for an old woman's peace of mind.",
  rw:{gold:30, item:{potion:1}, xp:{farming:80, fishing:80}} };
QUESTS.cove={ giver:'bram', title:"Smuggler's Rest", kind:'kill', kill:{slime:3},
  brief:"There's an old smuggler camp on the northeast point - good iron in that chest, if the tales hold. Trouble is, a nest of slimes has oozed in and claimed it. Squash three of them and the cove's yours to pick clean.",
  log:'Squash 3 slimes at Smuggler\'s Cove and claim the camp.',
  doneText:"Three less to ooze about. The cove's yours, friend - crack that chest open and think of me.",
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
ITEMS.vathcurse = {name:"Vath's Curse-Mark", desc:'A shard of violet binding-magic, torn loose when the Bound Leviathan was freed. Cold as deep water, and unmistakably his work - proof of the enchanter\'s hand for the crown to see.'};
ITEMS.relic = {name:'Stormwatch Relic', desc:'+4 damage to every attack. Torn from the Peak.'};
ITEMS.tidechart = {name:"The Tidefarer's Chart", desc:'An old sea-chart sealed in wax against the ice, drawn in the royal script. It marks an isle on no modern map - and a single grave upon it. The great queen, the Tidefarer, does not rest where the histories laid her; her true grave holds the weapon she forged to seal the shadow. Sage Orin of Emberwick might place these hidden waters.'};
ITEMS.frostchart = {name:"Tibb's Frostferry Chart", desc:"A wax-sealed sea-chart Tibb pressed on you at Stormreach, the road north marked in a raftwright's rough hand. It ends at the Frozen Isle, and beside the mark he has scrawled only: something lies sealed under that ice - the sort of thing a curse-breaker ought to go and get."};
// -- side-quest reward gear: a consumable and three always-on trinkets, so
//    optional work pays in more than coin --
ITEMS.elixir = {name:'Greater Tonic', desc:'Restores 60 HP - twice a common tonic.', use:'heal', heal:60};
ITEMS.warcharm = {name:'Battleworn Charm', desc:'+5 damage to every attack.'};
ITEMS.boots = {name:'Trailblazer Boots', desc:'Sure-footed and swift - you move noticeably faster.'};
ITEMS.wardstone = {name:"Warden's Wardstone", desc:'Turns aside 2 damage from every blow you take.'};
ITEMS.crate = {name:"Victualler's Crate", desc:'Provisions for the palace kitchen. Do not eat the evidence.'};
/* =====================================================================
   ACT I FINALE - "The Enchanter's Tide" turns. The King's audience sets you
   after Vath, and after the truth of his lost children. The pendant is a
   memory-ward; the Woodworker is the enchanted prince, the scholarly brother;
   and YOU - the masked stranger - are the warrior princess, the elder sister
   lost with him to the sea. Show the ward, take off the mask, remember, and bring the prince
   to the capital - where Vath comes not to fight but to seize the throne's
   magic, and the King spends himself to buy your escape.
   ===================================================================== */
QUESTS.pendant = { giver:'orin', title:'The Medallion', kind:'talk', talkTo:'orin', xpL:340,
  brief:"The King's charge rings in your ears - find Vath, find his son. And that pendant at your throat unsettled him as it once unsettled Maren. Sail back to Emberwick and lay it before Sage Orin; if any hand can read old work, it is his.",
  log:'Sail to Emberwick and show the pendant to Sage Orin at his tower.',
  doneText:"<i>Orin turns the medallion once in the lantern-light - and chuckles, low and knowing.</i> Ho ho... I wondered when you'd come back, wearing that. You've done well, freeing the isles of Vath's wicked influence. <i>He folds your fingers gently back over it, then reaches into the clutter of his desk and draws out a rolled sea-chart, its wax seal long broken.</i> One thing more - a gift, and a burden with it. A chart to an isle off the edge of every map I own: <b>Stormreach</b>, a lone rock under a storm that never breaks, far past anywhere Vath's hand can reach. <i>He presses it into your palm and holds your gaze.</i> When you've stood before the King - whatever passes in that hall - you sail there next. Ask me no more; some things a soul must come to on its own. <i>He straightens, the moment passing.</i> Now - go and show that necklace to the Woodworker, down by the green. Just that, nothing more. You might yet free both of you from this affliction.",
  rw:{gold:40, xp:{magic:260}} };
QUESTS.enchanter = { giver:'orin', title:"The Enchanter's Tide", kind:'talk', talkTo:'woody', xpL:620,
  brief:"Go down to the green and seek out the Woodworker. Show him the pendant - only that, nothing more - and let happen what will. I'll not spoil it by naming it; some things a soul must come to on its own. Go, child. Trust these old bones: this is a door you have carried the key to all along.",
  log:'Show the Woodworker the pendant on Emberwick, and let him see the face behind the mask.',
  doneText:'',   // resolved by the unmasking scene (buildDialogContent, woody)
  rw:{gold:200, item:{elixir:2}, xp:{melee:400, magic:400, archery:400}} };
QUESTS.homecoming = { giver:'woody', title:'Homecoming', kind:'talk', talkTo:'aldous', xpL:520,
  brief:"Your brother the prince walks free at last - and Vath means the throne now, and the Tideglass magic in your father's blood. Take ship for Aldermere and bring both of you before King Aldous, before the enchanter reaches him first.",
  log:'Bring the prince before King Aldous in the Tideglass Palace, Aldermere - before Vath does.',
  doneText:'',   // resolved by the capital confrontation scene
  rw:{gold:300, hp:20, item:{elixir:3}, xp:{melee:300, archery:300, magic:300}} };

/* ---------- Regional boss-hunts ----------------------------------------------
   The island monsters were once ambient encounters - a banner and a loot chest,
   but no hand to send you and no name on a board. Each now has a quest-giver in
   its home hub. Completion keys off the story-flag the boss already sets on
   death (see 09-gameplay.js), except the Rimebound, whose 'icecolossus' kind is
   unique and so tracks as a plain kill. --------------------------------------- */
QUESTS.hoarfrost={ giver:'bryn', title:'Terror of the Rimewood', kind:'special', xpL:440,
  brief:'You\'ve heard me fret over the white bear out on the Rimewood flats - Hoarfrost, denned in the old ice-cave, and no hunter who went looking has come back to argue. It guards that hole like it hates the whole world. Put the beast down before it comes for Hearthhold - and whatever it hoards below is yours by right.',
  log:'Slay the Hoarfrost Bear on the Rimewood flats, east of Hearthhold. (Its den opens the Glacier Vault below.)',
  doneText:'The Hoarfrost, DOWN? Then Hearthhold sleeps sound tonight, first time in a season. Take my thanks and a warm bowl on the house - and mind the stair that beast was guarding.',
  rw:{gold:120, item:{elixir:1, potion:2}, xp:{melee:280, archery:200}} };
QUESTS.rimebound={ giver:'sigrid', title:'The Rimebound', kind:'special', xpL:480,
  brief:'Past the bear\'s den, down in the Glacier Vault, something older stands frozen mid-stride - a colossus of blue ice, wound in the same violet frost that took the Weeping Warden. Vath\'s work, unmistakable. It is no monster; it is a prisoner. Break the binding, free the poor giant, and let it rest at last.',
  log:'Descend the Glacier Vault and free the Rimebound from Vath\'s enchantment.',
  doneText:'The violet frost let go? Then it is at peace - and so, a little, am I. Two of Vath\'s cruelties undone on our ice alone. The Hoarfrost Hoard is yours; you paid for it in cold.',
  rw:{gold:160, item:{elixir:1, potion:2}, xp:{melee:320, magic:280}} };
QUESTS.stormroc={ giver:'aeron', title:'Terror of the Cloud-Sea', kind:'special', xpL:420,
  brief:'Feel that wind? That is HER temper. The Storm Roc has ruled this cloud-rock since my grandfather\'s day, and of late she suffers no guest in her sky - takes ships, takes sail, takes the odd fool who climbs too high. She is no one\'s road home, mind - the way DOWN runs along the bird\'s rainbow. But if your blade itches for a true terror, face her on the eyrie. Best her, and the Cloudreach will sing your name.',
  log:'Optional: defeat the Storm Roc on her eyrie atop the Cloudreach.',
  doneText:'She is DOWN? By every wind - the Roc herself, felled! The cloud-folk will tell that tale for three generations. You have earned the name Skyward, and a hero\'s share of her hoard besides.',
  rw:{gold:140, item:{elixir:1}, xp:{archery:300, melee:220}} };
QUESTS.barrowbrute={ giver:'mora', title:'Wrecker of Stormreach', kind:'special', xpL:440,
  brief:'Look about you, traveler - we did not choose this wreck-strewn shore. We STAYED, because the Barrow Brute walks the barrow road and no boat we launch outlives the reef while it lives. Put the great brute back in its barrow. Do that, and Stormreach is a port again - and some of us go home.',
  log:'Hunt down the Barrow Brute on the barrow road above Stormreach.',
  doneText:'The whole coast felt it fall. You have given a hundred stranded souls their sea back. Tibb is already at the water with fresh timber - and we will name a cove for you, the least a grateful shore can do.',
  rw:{gold:150, item:{potion:3}, xp:{melee:320, archery:240}} };
QUESTS.drownedwarden={ giver:'tibb', title:'Warden of the Drowned Vault', kind:'special', xpL:420,
  brief:'There is a stair under the drowned graveyard, and a great bull-headed brute wardening the vault below - the Drowned Minotaur, my grandfather\'s grandfather sealed it in and told us never to dig. But the old ward still guards the deep: the Ossuary floor is a lock of bone-stones, and a dead thing dances you the key. Tread its steps true, chamber by chamber, and the Bone Gate opens. Go down, put the beast\'s horns in the dirt, and let us bury our dead in peace.',
  log:'Descend into the catacomb beneath Stormreach, tread the Ossuary\'s ward-dance, and put down the Drowned Minotaur.',
  doneText:'The whole warren went quiet when it fell - I felt the floor settle, and the salvage is ours at last. Take a raftwright\'s thanks, and this tonic from the vault it guarded. And one thing more - <b>a chart, north to the Frozen Isle</b>. There\'s a thing sealed under that ice the old songs won\'t name; if you\'re hunting what I think you\'re hunting, that\'s where your road runs next. The strait\'s open to a keel now - the ferry will carry you.',
  rw:{gold:130, item:{elixir:1, potion:2, frostchart:1}, xp:{melee:260, magic:220}} };
/* ---------- Act II: the returned-isle RESTORATIONS -----------------------------
   Under the Warding Veil you steal home to find each old isle warped by a curse
   Vath let fester. Each isle's curse is anchored to a spirit bound in a new
   dungeon; put the spirit down and the wound closes and the isle is itself again.
   One restoration quest per isle, offered only in Act II while the curse stands
   (armed in switchWorld), completing off the dungeon's clear flag. -- */
QUESTS.windRestore={ giver:'rell', title:'The Drowning of Windsurf', kind:'special', xpL:460,
  brief:'Look at my harbour, traveler - half of it under water that has no business being there. The old waterwheel spun itself to ruin and burst its race, and a wind that will not die has driven the sea up over Waterwheel Row and a whole north-yard district besides. It is no natural gale; it is a thing, denned in the spire that tore open at the wheel\'s foot. Go down into the Gale Spire and still whatever howls in it. Till then Windsurf drowns by inches.',
  log:'Descend the Gale Spire at the ruined waterwheel and still the maddened wind, and Windsurf\'s flood will drain.',
  doneText:'The wind just... stopped. Dead calm, for the first time in weeks - and look, the water\'s pulling back off the Row already. You\'ve given us our isle back, and the yard the flood stole with it. Windsurf won\'t forget the day you walked in under that Veil.',
  rw:{gold:150, item:{elixir:1, potion:2}, xp:{melee:300, archery:220}} };
QUESTS.sunRestore={ giver:'moli', title:'The Unquiet Mountain', kind:'special', xpL:470,
  brief:'You feel the ground, child? Mount Kea has not slept a single night since the robed man\'s shadow fell on us. It burns without pause - lava down every slope, ash on every breath - and it is no mere eruption. Something has been stoked in the mountain\'s heart, in the forge-fissure that split the south face. Go down into the Ashen Forge and quench whatever fans that fire, or Kea will bury the Sunward Isle in cinders.',
  log:'Descend the Ashen Forge on Mount Kea\'s south face and quench the spirit stoking the eruption, and the mountain will settle.',
  doneText:'The mountain is quiet. QUIET - do you hear it? No grumble, no gout of fire. The ash is thinning already and the slopes are cooling under our feet. You have given the Sunward Isle back its mornings. Bless you, child, and take an elder\'s thanks.',
  rw:{gold:160, item:{elixir:1, potion:2}, xp:{melee:320, archery:220}} };
QUESTS.barikRestore={ giver:'kell', title:'The Drowning of Barik', kind:'special', xpL:470,
  brief:'You sailed from a green isle, and you come back to a drowned one. Vath\'s flood has swallowed the Mirefen and the whole farm-lowland east of here - Hedda\'s fields are a lake, and the folk that worked them are crowded onto the high ground. The water rises from a sinkhole up the reed-causeway, and it will not fall while the thing wardening the vault below still churns the deep. Go down into the Drowned Vault, put it down, and give Barik its shore back.',
  log:'Descend the Drowned Vault up the reed-causeway and fell the thing that churns the flood, and Barik\'s water will recede.',
  doneText:'The Warden\'s work is done - look east, the water\'s falling off the fields by the hour. The farmsteads will drain and dry, and Hedda can put a plough in real dirt again. You gave a drowned isle back its ground, and I\'ll see the whole of Barik hears whose hand did it.',
  rw:{gold:160, item:{elixir:1, potion:2}, xp:{melee:320, mining:160}} };
QUESTS.skyRestore={ giver:'aeron', title:'The Storm That Will Not Break', kind:'special', xpL:450,
  brief:'This cloud has weathered every gale in living memory, but not this one - a storm settled over the Cloudreach the day the robed man\'s shadow reached us, and it will NOT break. Lightning walks the standing stones and splits them where they stand. It is caged thunder, traveler, penned in the temple that cracked open by the landing. Go down into the Storm Temple and let it out, or spend it, or do whatever a hero does - only make my sky clear again.',
  log:'Descend the Storm Temple by the landing and quiet the caged thunder, and the endless storm will break.',
  doneText:'It broke. The storm just - broke, clean away to blue, like a held breath let go. First clear sky over the Cloudreach in a season. You have my thanks, Skyward, and the whole cloud\'s besides - we thought we\'d lost the sun for good.',
  rw:{gold:150, item:{elixir:1, potion:2}, xp:{melee:300, archery:220}} };
QUESTS.reachRestore={ giver:'mora', title:'The Storm That Drowns the Coast', kind:'special', xpL:470,
  brief:'You come back to a Stormreach the sea has half-swallowed, warrior. The storm that always tested us will not break now - it drives the surge up over the shingle and the wrack with it, and the coast drowns by inches. It is no weather; it is the thing our fathers sealed under the graveyard, churning the deep awake again. The Drowned Minotaur wardens the catacomb below the graves - go down, put the beast down for good, and the sea will fall back off our shore.',
  log:'Descend the Drowned Catacomb below the graveyard, fell the Drowned Minotaur that churns the surge, and Stormreach\'s storm will break.',
  doneText:'The storm broke the moment it fell - I felt the wind drop and the surge start pulling back off the shingle. You have given the whole coast its shore back, warrior, and a hundred stranded souls their sea. Stormreach will name a cove for you and mean it.',
  rw:{gold:160, item:{elixir:1, potion:2}, xp:{melee:320, archery:220}} };

// Act I isle side-work that RETIRES when Act II opens: the returned isles have moved past these
// errands, so they never re-offer once you sail back under the Veil, and any left sitting 'avail'
// but unaccepted is purged at the Act II transition. The Duchess chain (duchesslove/duchessreply)
// is deliberately excluded - it is the one Act I errand that carries into Act II.
const ACT1_ISLE_QUESTS=['welcome2','nets','roadclear','hedda1','hedda2','torv1','torv2','ivo1',
  'ribbon1','ribbon2','ribbon3','feud1','feud2','sting1','undermaw1','bounty','embers',
  'mossbrew','pearlq','hunt1','tame1','wyrm','vhunt','board','sail','tide','breakers'];
// Clear any of the above that is merely offered ('avail') but never accepted, so a returned isle
// shows none of its Act I quest-board work. Accepted ('active') and finished ('done') quests are
// preserved untouched.
function purgeAct1AvailQuests(){
  if(typeof P==='undefined' || !P || !P.quests) return;
  for(const id of ACT1_ISLE_QUESTS) if(P.quests[id]==='avail') delete P.quests[id];
}

/* ---------- Aldermere side-work ----------------------------------------------
   The royal capital was grand but quiet - a dozen townsfolk and only three
   quests, most of them story-gated. These give its people something to ask of a
   passing hero, and tie a little more of the lost-queen thread into the city. -- */
QUESTS.roses={ giver:'isolde', title:"The Queen's Garden", kind:'gather', need:{shell:6, pearl:1}, xpL:240,
  brief:'This garden is a memorial. The King planted it for his queen, who took a fever and died when his children were small, and I have tended it alone ever since. She loved the colors of the shore - so bring the shore to her: six spiral shells for the border, one true pearl for the fountain\'s heart, and she will have the garden she was owed.',
  log:'Bring Isolde 6 spiral shells and 1 pearl for the Queen\'s memorial garden.',
  doneText:'Oh - a REAL pearl. It catches the light just as she used to. There. The King walks here some evenings; he will see it, and know that someone still remembers her. That is worth more than you know.',
  rw:{gold:60, item:{elixir:1}, xp:{fishing:200, farming:120}} };
QUESTS.larder={ giver:'doran', title:'Stock the Grand Bazaar', kind:'gather', need:{cookedfish:6, bread:4}, xpL:200,
  brief:'A capital eats, traveler, and the strait\'s long closure left our larders thin. The stalls will pay honest coin for honest fare - six grilled fish and four fresh loaves to stock the Bazaar against a lean week. Do that and I\'ll cut you the crown\'s own rate.',
  log:'Bring Doran the Factor 6 grilled fish and 4 fresh bread for the Bazaar stores.',
  doneText:'Counted and crated - the stalls will bless your name by morning. Here is the crown\'s rate, and a little over for the legs it cost you.',
  rw:{gold:90, item:{potion:2}, xp:{fishing:120, farming:120}} };
QUESTS.garrison={ giver:'halvard', title:'Steel for the Watch', kind:'gather', need:{ore:8, hardwood:2}, xpL:220,
  brief:'The Garrison stands the capital\'s last wall, and long quiet years have rusted more than our blades. Eight lumps of good iron ore and two lengths of hardwood for the hafts - our own smith will strike the rest - and the armoury stands sound again. A soldier does not beg - so consider it a commission, soldier to soldier.',
  log:'Bring Captain Halvard 8 iron ore and 2 hardwood for the Garrison armoury.',
  doneText:'Good steel, well chosen. The Watch stands the sounder for it - and so does the King who sleeps behind our wall. Take a soldier\'s thanks, and a soldier\'s coin.',
  rw:{gold:100, item:{elixir:1, potion:2}, xp:{melee:200, mining:120}} };

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
  m.finalVath=true; m.bigBoss=true; m.title='VATH THE EMBERBINDER'; m.ach='enchantersbane';
  m.lvl=13; m.maxhp=700; m.hp=700; m.dmg=30; m.speed=2.9; m.aggro=16;
  m.state='idle'; m.noAggroT=0; m.hx=sp[0]; m.hy=sp[1]; m.respawnT=-1;
  m.entrance='enthrall';   // the enchanter manifests in a gathering of his own violet
  return m;
}
// Beaten, Vath is bound by his own compulsion - sealed, not slain, vowing return.
function bindVath(m){
  m.bound=1; m.dead=true; m.respawnT=-1; m.state='idle'; m.hp=1;
  P.story=P.story||{}; P.story.vathBound=1; P.story.act=Math.max(P.story.act||1,4);
  bossReward(m);
  if(Snd.boss) Snd.boss(); G.shake=1.0; G.slowmo=1.2;
  shockwave(m.x,m.y,'rgba(199,123,255,0.95)',110);
  for(let i=0;i<40;i++){ const a=Math.random()*TAU, s=rnd(1,5);
    G.parts.push({x:m.x,y:m.y-0.4,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:rnd(0.8,1.8),color:'#c77bff',size:rnd(2,4),grav:-0.05}); }
  banner('VATH IS BOUND','SEALED BY HIS OWN COMPULSION');
  if(typeof updateBossUI==='function') updateBossUI();
  // The binding now plays as a full-overlay cutscene (js/39-more-cutscenes.js): the violet
  // cords whip back and take him, the enchantment folds him into the old standing stone, and
  // he vows to return. When it ends, the nudge to the Woodworker follows. Falls back to the
  // old story-card if the overlay layer is absent. The enchanter-quest credit below is a
  // separate, unchanged timer - the cutscene does not touch any story/quest state.
  const woodyNudge=()=>toast('Behind you the <b>Woodworker</b> sways, a hand to his head. <b style="color:var(--ember)">Speak with him.</b>',7000);
  setTimeout(()=>{
    if(typeof vathBoundCutscene==='function') vathBoundCutscene(m, woodyNudge);
    else storyCard('<i>You cut the violet cords one by one - and the last, freed, whips back and takes HIM, his own leash closing on his own throat.</i> <b style="color:#c9a0ff">"Clever. Cruel. You\'d have woven a fine binding yourself."</b> <i>The enchantment folds him into the old standing stone.</i> <b style="color:#c9a0ff">"No stone holds forever, first mate. Your blood has caged me before - a lifetime ago, and lifetimes before that - and every seal your line ever set, I have outwaited. Delayed. Never once undone. I will thaw. I will come back."</b> <i>Then quiet, and violet light dying in the grass.</i>',
      {onOk:woodyNudge});
  },1200);
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
  // Stormreach shelters: cast sea-stone storm-houses - squat, battered concrete
  // walls under a low heavy roof, corner buttresses and shuttered slit-windows.
  // Nothing like the Kohana straw huts; these are built to shrug off the reef-storms.
  SPR.stormhut=makeCanvas(96,86,(g)=>{
    const OUT='rgba(20,14,8,0.9)';
    const wallL='#9b978d', wallR='#7c786e', wallB='#67635a';   // sunlit / shade / splash-base
    const roof='#6e6a62', roofL='#847f75', roofDk='#4f4c46';
    // ---- battered (bottom-heavy) concrete body ----
    g.lineWidth=2; g.strokeStyle=OUT;
    g.beginPath(); g.moveTo(20,40); g.lineTo(76,40); g.lineTo(82,80); g.lineTo(14,80); g.closePath();
    g.fillStyle=wallL; g.fill();
    g.beginPath(); g.moveTo(48,40); g.lineTo(76,40); g.lineTo(82,80); g.lineTo(48,80); g.closePath();
    g.fillStyle=wallR; g.fill();
    g.beginPath(); g.moveTo(20,40); g.lineTo(76,40); g.lineTo(82,80); g.lineTo(14,80); g.closePath(); g.stroke();
    // heavier base course (the wet splash-band the surf works at)
    g.fillStyle=wallB;
    g.beginPath(); g.moveTo(15.5,72); g.lineTo(80.5,72); g.lineTo(82,80); g.lineTo(14,80); g.closePath(); g.fill();
    g.strokeStyle='rgba(30,24,16,0.5)'; g.lineWidth=1.3;
    g.beginPath(); g.moveTo(16,72); g.lineTo(80,72); g.stroke();
    // board-formed concrete seams (faint horizontals)
    g.strokeStyle='rgba(40,36,30,0.28)'; g.lineWidth=1;
    for(let yy=48; yy<70; yy+=6){ g.beginPath(); g.moveTo(19,yy); g.lineTo(77,yy); g.stroke(); }
    // salt / rain streaks weeping down the face
    g.strokeStyle='rgba(212,216,216,0.16)'; g.lineWidth=1.4;
    for(const sx of [30,44,58,68]){ g.beginPath(); g.moveTo(sx,44); g.lineTo(sx-1,70); g.stroke(); }
    // ---- corner buttresses (thicker at the foot) ----
    g.strokeStyle=OUT; g.lineWidth=2;
    const buttress=(bx)=>{ g.fillStyle=wallB;
      g.beginPath(); g.moveTo(bx-3,42); g.lineTo(bx+3,42); g.lineTo(bx+5,80); g.lineTo(bx-5,80); g.closePath(); g.fill(); g.stroke(); };
    buttress(18); buttress(78);
    // ---- low heavy hipped roof (a slab, not a straw cone) ----
    g.fillStyle=roof;
    g.beginPath(); g.moveTo(10,44); g.lineTo(86,44); g.lineTo(74,26); g.lineTo(22,26); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=roofL;   // sunlit left half of the cap
    g.beginPath(); g.moveTo(10,44); g.lineTo(48,44); g.lineTo(48,26); g.lineTo(22,26); g.closePath(); g.fill();
    g.fillStyle=roofDk; g.fillRect(22,24,52,4); g.strokeRect(22,24,52,4);   // ridge cap
    g.fillStyle='rgba(20,16,10,0.22)'; g.fillRect(20,44,56,3);              // eave shadow onto the wall
    // ---- deep-set door: recessed concrete frame + banded timber ----
    g.strokeStyle=OUT; g.lineWidth=2;
    g.fillStyle='#4a463f'; g.fillRect(41,56,16,24); g.strokeRect(41,56,16,24);
    g.fillStyle='#5a4023'; g.fillRect(44,58,10,22);
    g.strokeStyle='rgba(24,16,8,0.7)'; g.lineWidth=1.4; g.strokeRect(44,58,10,22);
    g.strokeStyle='#3a2c1a'; g.lineWidth=2;
    g.beginPath(); g.moveTo(44,64); g.lineTo(54,64); g.moveTo(44,74); g.lineTo(54,74); g.stroke();
    // ---- small deep-set slit-windows, one warm-lit ----
    g.strokeStyle=OUT; g.lineWidth=2;
    g.fillStyle='#2f2b26'; g.fillRect(26,50,9,9); g.strokeRect(26,50,9,9);
    g.fillStyle='#3a352e'; g.fillRect(63,50,9,9); g.strokeRect(63,50,9,9);
    g.fillStyle='#ffce7a'; g.fillRect(65,52,5,5);
    g.strokeStyle='rgba(24,16,8,0.5)'; g.lineWidth=1;
    g.beginPath(); g.moveTo(26,54.5); g.lineTo(35,54.5); g.stroke();
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
/* =====================================================================
   THE DROWNED VAULT - the flooded harbor-vault beneath Barik. When you steal
   home under the Warding Veil you find the old harbor drowned by Vath's curse.
   Descend, cross the Flooded Gallery on its plank causeway (the deep water walls
   you in until you learn to swim it), fell the Drowned Minotaur wardening the
   Tide-Lock Vault, and take the Pearl of the Deep from its chest: the gift to
   DIVE, which opens the drowned water across the old islands.
   ================================================================================= */
/* ---------- THE DROWNED VAULT (barikdeep) - bespoke: THE TIDE RACE + THE CISTERN ----
   A drowned harbor-vault. You descend to the Sunken Stair, then cross THE TIDE RACE - a
   flooded void spanned only by tumbled vault-stones that drift on the swell (DASH stone
   to stone; miss and the undertow drags you back, -5 HP). Beyond it the Cistern seals shut
   behind you and THE TIDEMAW surfaces - an angler-leviathan that spouts brine and submerges
   untouchable to slam up beneath you. Fell it to open the seal and take the Pearl of the Deep.
   ================================================================================= */
const BARIK_SEAL=[[34,45],[35,45],[36,45],[37,45],[38,45]];   // the Cistern gate - slams shut behind you
function genBarikDeep(){
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1,tile)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,tile||T.RUIN); setSolid(x,y,0); } };
  // race water is a NON-SOLID gap: DASH over it (airborne); come to rest on it and the undertow
  // drags you under. (Solid water would block the dash entirely - the old bug.)
  const flood=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.DEEP); setSolid(x,y,0); } };
  carve(28,89,44,96);            // THE SUNKEN STAIR - entry landing
  carve(34,86,38,90);            // corridor
  carve(20,80,52,86);            // ROOM 1 - THE WEEPING HALL (dead + the sluice-lever for gate A)
  // OPTIONAL SIDE BRANCH - THE OSSUARY DRAIN: a dead-end silt-crypt off the Weeping Hall's west
  // wall, holding a diver's cache. Purely off the main climb (never gates a route).
  carve(9,82,20,84);             // west passage from Room 1
  carve(3,79,11,87);             // the drain-crypt (the cache in the silt)
  carve(34,77,38,81);            // GATE-A corridor (barred at y78)
  carve(20,71,52,77);            // ROOM 2 - THE TIDE RACE
  flood(20,72,52,76);            //   race water, FULL WIDTH
  carve(28,74,44,74);            //   a mid stone-bridge - a dash-gap of water each side
  carve(34,68,38,72);            // corridor
  carve(20,62,52,68);            // ROOM 3 - THE CISTERN-STEPS (dead guarding a ward-plate for gate B)
  carve(34,59,38,63);            // GATE-B corridor (barred at y60)
  carve(20,53,52,59);            // ROOM 4 - THE UNDERTOW
  flood(20,55,52,56);            //   a 2-row race, FULL WIDTH
  carve(34,50,38,54);            // corridor
  carve(20,46,52,52);            // ROOM 5 - THE DROWNED APPROACH (a last stand of the dead)
  carve(34,42,38,47);            // corridor up to the Cistern (the Cistern gate sits at y45)
  carve(18,8,54,42);             // THE CISTERN - the Tidemaw's flooded hall
}
function placeObjectsBarikDeep(){
  G.decor=G.decor||[];
  G.decor.push({kind:'dungeonmouth', x:36.5, y:93.5, drowned:1, exit:1, label:'the way up'});
  setSolid(36,93,0); setTile(36,93,T.RUIN);
  for(const [tx,ty] of [[24,84],[48,84],[24,74],[48,74],[24,66],[48,66],[24,54],[48,54],[24,49],[48,49],[22,10],[52,10],[36,9]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // ---- THE TIDE RACES: every DEEP tile is a non-solid gap you dash over; rest on one and the
  // undertow drags you under (-5 HP) back to the last dry ground you stood on. ----
  G._barikVoid=new Set(); G._barikSlabs=[]; G._barikT=0; G._barikPlunge=null;
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++) if(tileAt(x,y)===T.DEEP) G._barikVoid.add(x+','+y);
  G._barikCross={sx:36.5, sy:76.5};   // default respawn (updates to the last dry ledge you reach)
  // ---- THE LOCKS: clearing room 1 of its drowned dead raises gate A (no lever - the fight is
  // the key); a ward-plate in room 3 raises gate B. ----
  // the Ossuary Drain's cache (off Room 1's west passage) - optional detour loot
  if(!(P.story && P.story.sideCacheTaken && P.story.sideCacheTaken.barik))
    G.decor.push({kind:'chest', x:6.5, y:83.5, sideCache:'barik', loot:'water', title:'THE OSSUARY DRAIN', sub:'A DIVER\'S CACHE IN THE SILT'});
  dungGate('barA', 78, 34, 38, 'The last of the drowned dead falls - the barred gate grinds up into the vault roof.');
  dungGate('barB', 60, 34, 38, 'The ward-plate sinks - the inner gate hauls open.');
  G.decor.push({kind:'dplate', x:36.5, y:64.5, gate:'barB', pressed:false, label:'a ward-plate'});
  // ---- THE CISTERN: the boss seal + the reward ----
  G._barikSealed=0;
  G.decor.push({kind:'catgate', x:36, y:45, open:true, gate:'cistern', tiles:BARIK_SEAL.slice(), label:'the Cistern gate'});
  // THE REWARD ROOM: the Pearl of the Deep (grants DIVE) + the climb-out stand in a vault walled
  // off the top of the Cistern, sealed until the Tidemaw falls (killMob -> openRewardRoom).
  buildRewardRoom({ x0:18, x1:54, wallY:13, gx0:35, gx1:37, floorT:T.RUIN,
    chest:{kind:'chest', x:32.5, y:10.5, drowned:1, divegift:1}, exitX:40, exitY:10,
    cleared:!!(P.story && P.story.barikDeepDone) });
  G.critters=[];
  // an already-cleared run: the flood recedes to dry stone, the gates and seal stand open
  if(P.story && P.story.barikDeepDone){
    for(const k of G._barikVoid){ const [x,y]=k.split(',').map(Number); setTile(x,y,T.RUIN); setSolid(x,y,0); }
    G._barikVoid=new Set(); G.decor=G.decor.filter(d=>!d.barikraft); G._barikSlabs=[];
    dungOpenAllGates(true);
    for(const [x,y] of BARIK_SEAL) setSolid(x,y,0);
    const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='cistern'); if(cg) cg.open=true;
  }
}
function spawnMobsBarikDeep(){
  if(!(P.story && P.story.barikDeepDone)){
    // ROOM 1 combat: drowned dead + a bowman - fell them all to raise gate A
    for(const [zx,zy,k] of [[28,83,'skeleton'],[42,84,'skeleton'],[30,82,'archer']]){ const sp=findOpenNear(zx,zy,3); if(sp){ const mm=spawnMob(k,sp[0],sp[1]); if(mm){ mm.room1gate='barA'; mm.respawnT=-1; } } }
    // ROOM 3: dead guarding the ward-plate
    for(const [zx,zy] of [[28,65],[44,65]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('skeleton',sp[0],sp[1]); }
    // THE OSSUARY DRAIN side-crypt: two dead guarding the diver's cache
    for(const [zx,zy] of [[5,84],[8,81]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('skeleton',sp[0],sp[1]); }
    // ROOM 5: a last stand of the dead before the Cistern
    for(const [zx,zy] of [[28,49],[44,49]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('skeleton',sp[0],sp[1]); }
  }
  // THE TIDEMAW - sealed and unseen until you step into the Cistern (barikSealCheck reveals it)
  if(!(P.story && P.story.barikDeepDone)){
    const sp=findOpenNear(36, 20, 6) || [36,20];
    const b=spawnMob('tidemaw', sp[0], sp[1]);
    if(b){ b.boss=true; b.bigBoss=true; b.title='THE TIDEMAW'; b.subtitle='WARDEN OF THE DROWNED VAULT'; b.hx=sp[0]; b.hy=sp[1]; b.respawnT=-1; b.tidemaw=1; b.customAI=1; b.sealed=true; b.arena=1; b.phase='stalk'; b.entrance='surface'; }
  }
}
function genBarikDeepAll(){ genBarikDeep(); placeObjectsBarikDeep(); _dungWalls('brine'); spawnMobsBarikDeep(); buildMapBase(); }
// ---- THE TIDE RACE per-frame: drag a misstep under (fall + respawn), seal the Cistern ----
function updateBarikDeep(dt){
  if(!G._barikSlabs) return;
  G._barikT=(G._barikT||0)+dt;
  updateDriftSlabs(G._barikSlabs, G._barikT);
  if(G._barikPlunge){ G._barikPlunge.t+=dt; if(G._barikPlunge.t>=G._barikPlunge.dur) barikRespawn(); }
  else if(!P.dead && (P.rollT||0)<=0){
    const tx=Math.floor(P.x), ty=Math.floor(P.y);
    if(G._barikVoid.has(tx+','+ty) && !driftCarry(G._barikSlabs)) barikPlungeStart();   // over the void, not aboard a stone
    else if(walkTile(tileAt(tx,ty))) G._barikCross={sx:tx+0.5, sy:ty+0.5};   // bank the last dry ledge as respawn
  }
  dungPlateCheck();
  dungRoom1Check('barA');
  barikSealCheck();
  for(const m of G.mobs) if(m.tidemaw && !m.dead && !m.sealed && !m.introKind && !(typeof dlg!=='undefined' && dlg.open)) updateTidemaw(m,dt);
}
function barikPlungeStart(){
  G._barikPlunge={t:0,dur:0.5}; P.hp=Math.max(1,P.hp-5); P.hurtT=Math.max(P.hurtT||0,0.5);
  if(typeof buzz==='function') buzz(10); shockwave(P.x,P.y,'rgba(120,180,220,0.85)',32);
  for(let i=0;i<12;i++) G.parts.push({x:P.x+rnd(-0.3,0.3),y:P.y,vx:rnd(-1.2,1.2),vy:-rnd(1,2.2),life:0.6,color:Math.random()<0.5?'#bfe0f2':'#8fc0d8',size:rnd(2,4.5),grav:0.08});
  if(Snd.noise) Snd.noise(0.14,0.05,300,0.6);
  P.click=null; P.moving=false;
}
function barikRespawn(){
  G._barikPlunge=null;
  const c=G._barikCross||{sx:36.5,sy:75.5};
  P.x=c.sx; P.y=c.sy; P.click=null; P.moving=false; P.slideDir=null;
  if(typeof isoX==='function'){ G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
}
function barikSealCheck(){
  if(G._barikSealed || (P.story&&P.story.barikDeepDone)) return;
  const boss=G.mobs.find(m=>m.tidemaw && !m.dead); if(!boss) return;
  if(P.y<=41 && P.x>=18 && P.x<=54){   // stepped into the Cistern
    G._barikSealed=1;
    for(const [x,y] of BARIK_SEAL) setSolid(x,y,1);
    const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='cistern'); if(cg) cg.open=false;
    if(typeof invalidateScenery==='function') invalidateScenery();
    boss.sealed=false; boss.arena=1;
    if(typeof startBossIntro==='function' && !G.bossIntro) startBossIntro(boss,{kind:boss.entrance||'surface',title:boss.title,sub:boss.subtitle});
  }
}
function unsealBarikCistern(){
  G._barikSealed=0;
  for(const [x,y] of BARIK_SEAL) setSolid(x,y,0);
  const cg=(G.decor||[]).find(d=>d.kind==='catgate'&&d.gate==='cistern'); if(cg) cg.open=true;
  if(typeof invalidateScenery==='function') invalidateScenery();
}
// THE TIDEMAW's phase AI: stalk (chase + telegraphed bite + brine spouts), and at half
// health a single SUBMERGE (untouchable, glides under you) that ERUPTS in a slam + spout-fan.
function updateTidemaw(m,dt){
  const pd=dist(m.x,m.y,P.x,P.y);
  m.face=(P.x<m.x?-1:1);
  m.shootCd=(m.shootCd||0)-dt; m.biteCd=(m.biteCd||0)-dt;
  if(!m.enraged && m.hp<m.maxhp*0.5 && m.phase!=='submerge'){ m.enraged=1; m.phase='submerge'; m.pT=1.3; m.invuln=1;
    shockwave(m.x,m.y,'rgba(120,180,220,0.8)',54); G.shake=0.5; }
  if(m.phase==='submerge'){
    m.pT-=dt;
    if(pd>1.4){ const a=Math.atan2(P.y-m.y,P.x-m.x); moveEntity(m, Math.cos(a)*m.speed*1.1*dt, Math.sin(a)*m.speed*1.1*dt); }
    if(m.pT<=0){ m.phase='stalk'; m.invuln=0; G.shake=0.7; shockwave(m.x,m.y,'rgba(150,210,235,0.9)',64);
      if(dist(m.x,m.y,P.x,P.y)<3 && (P.rollT||0)<=0 && !P.dead) hurtPlayer(Math.round(m.dmg*1.15), m);
      tidemawSpout(m,true); }
    return;
  }
  const spd=m.speed*(m.enraged?0.95:0.72);
  if(pd>1.7 && !((m.stunT||0)>0) && !(m.windup>0)){ const a=Math.atan2(P.y-m.y,P.x-m.x); moveEntity(m, Math.cos(a)*spd*dt, Math.sin(a)*spd*dt); }
  if(m.shootCd<=0 && pd>2.6){ m.shootCd=m.enraged?1.9:2.7; tidemawSpout(m,m.enraged); }
  if(pd<2.3 && m.biteCd<=0 && !(m.windup>0) && !((m.stunT||0)>0)){ m.windup=0.5; m.biteCd=m.enraged?1.8:2.5; }
  if(m.windup>0){ m.windup-=dt; if(m.windup<=0){ m.windup=0; m.swing=0.3;
    if(dist(m.x,m.y,P.x,P.y)<2.7 && (P.rollT||0)<=0 && !P.dead) hurtPlayer(m.dmg, m);
    burst(m.x+m.face*1.2,m.y-0.5,'#bfe0f2',10,2.4); } }
}
function tidemawSpout(m, fan){
  const base=Math.atan2(P.y-m.y,P.x-m.x), offs=fan?[-0.42,-0.21,0,0.21,0.42]:[0];
  for(const o of offs){ const a=base+o; G.projs.push({kind:'spout', x:m.x, y:m.y-0.6, vx:Math.cos(a)*7, vy:Math.sin(a)*7, life:1.7, dmg:Math.round(m.dmg*0.6), from:'mob'}); }
  if(Snd.magic) Snd.magic();
}
function enterBarikDeep(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P._deepReturn={x:P.x, y:P.y+1.3}; P.slideDir=null; P.click=null;
  setTimeout(()=>{ switchWorld('barikdeep'); if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
function exitBarikDeep(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.slideDir=null; P.click=null;
  setTimeout(()=>{ switchWorld('main');
    const r=P._deepReturn; if(r){ P.x=r.x; P.y=r.y; G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}
// BARIK's curse made visible: once the Warding Veil lets you steal home, Vath's flood has
// drowned the low ground - the Mirefen marsh has become open water, and the Drowned Vault's
// mouth hides in a flooded sinkhole among the reeds (not a lamp-lit hole by the dock). A
// diver's cache waits on a rock the deep water keeps.
// Flood-fill of every tile you can WALK to from (sx,sy): orthogonal steps over non-solid,
// walkable, non-water tiles. Used to PROVE a sealed curse-pocket is (a) truly cut off while the
// curse stands and (b) never seals a route to the isle's living zones. One cheap pass at gen.
function _curseReach(sx,sy,cap){
  const seen=new Set([sx+','+sy]), st=[[sx,sy]]; let n=0;
  const walk=(x,y)=> inb(x,y) && !solidAt(x,y) && walkTile(tileAt(x,y)) && tileAt(x,y)!==T.DEEP && tileAt(x,y)!==T.SHALLOW;
  while(st.length){ const p=st.pop(); if(++n>cap) break;
    const nb=[[p[0]+1,p[1]],[p[0]-1,p[1]],[p[0],p[1]+1],[p[0],p[1]-1]];
    for(const c of nb){ const k=c[0]+','+c[1]; if(seen.has(k)||!walk(c[0],c[1])) continue; seen.add(k); st.push(c); } }
  return seen;
}
function placeBarikFlood(){
  if(!(P.story && P.story.vathVeil)) return;
  // Once the Tidemaw in the Drowned Vault is felled (barikDeepDone), Vath's flood recedes and
  // Barik is itself again - so a restored isle regenerates without the flood/decor, keeping only
  // the Vault mouth so the drained halls stay re-enterable.
  const restored = !!(P.story && P.story.barikDeepDone);
  const D=(typeof MAIN_ZONES!=='undefined' && MAIN_ZONES.dock) ? MAIN_ZONES.dock : {x:55,y:258};
  const M=(typeof MAIN_ZONES!=='undefined' && MAIN_ZONES.meadow) ? MAIN_ZONES.meadow : {x:258,y:254,r:24};
  const F=(typeof MAIN_ZONES!=='undefined' && MAIN_ZONES.farm) ? MAIN_ZONES.farm : {x:293,y:213,r:16};
  // VATH'S FLOOD, made total: the whole east of Barik has drowned. The Mirefen is a black
  // lagoon, the farmsteads are a drowned lowland sea, and dead trees stand in the shallows
  // where the fields used to be. The isle you sailed from is unrecognisable - a mirror of the
  // Drowned Vault waiting beneath it. (Integer loop bounds; a float r no-ops the loop.)
  const flooded=[];   // remember the new shallows so we can decorate their edges
  const way=[];       // the dry reed-causeway (also feeds the sinkhole-mouth placement)
  const flood=(cx,cy,r,deepR)=>{ cx=Math.round(cx); cy=Math.round(cy); const R=Math.ceil(r);
    for(let y=cy-R;y<=cy+R;y++) for(let x=cx-R;x<=cx+R;x++){ const dd=dist(x,y,cx,cy);
      if(inb(x,y) && dd<=r && walkTile(tileAt(x,y)) && !solidAt(x,y) && tileAt(x,y)!==T.PATH && tileAt(x,y)!==T.PLANK){
        setTile(x,y, dd<=deepR?T.DEEP:T.SHALLOW); setSolid(x,y,1);
        if(dd>deepR && dd>r*0.7) flooded.push([x,y]); } } };
  if(!restored){
    // the Mirefen: a huge lagoon with a drowned heart
    flood(M.x, M.y, M.r*1.05, M.r*0.55);
    flood(M.x-M.r*0.5, M.y-M.r*0.35, M.r*0.55, M.r*0.22);
    // the drowned farmlands to the north - a second inland sea, joined to the fen by a channel
    flood(F.x, F.y, F.r*1.0, F.r*0.4);
    flood((M.x+F.x)/2, (M.y+F.y)/2, M.r*0.42, M.r*0.14);   // the channel linking them
    // KEEP THE ISLE REACHABLE: a dry reed-causeway from the south shore up to the sinkhole,
    // so you can still walk to the Vault before you've earned the dive.
    for(let yy=Math.round(M.y+M.r*0.95); yy>=Math.round(M.y+M.r*0.2); yy--){
      const xx=Math.round(M.x-M.r*0.7 + Math.sin((yy-M.y)*0.25)*2);
      for(let ox=-1;ox<=1;ox++){ const cxx=xx+ox; if(inb(cxx,yy) && (tileAt(cxx,yy)===T.SHALLOW||tileAt(cxx,yy)===T.DEEP)){ setTile(cxx,yy,T.SOIL); setSolid(cxx,yy,0); } }
      way.push([xx,yy]);
    }
  }
  // THE MAROONED CROFT: a dry islet at the drowned HEART of the Mirefen, ringed on every side by
  // Vath's deep flood - no causeway touches it (the causeway hugs the west edge) and no foot
  // crosses solid deep water, so its reward sits UNREACHABLE until the Drowned Vault falls and the
  // lagoon drains back to meadow. The core + chest are laid in BOTH states; only the surrounding
  // flood (laid above, cursed only) isolates it - so this adds NO barrier of its own and can never
  // seal a route: a restored isle simply walks out to it over dry ground.
  { const ix=Math.round(M.x), iy=Math.round(M.y);
    for(let y=iy-2;y<=iy+2;y++) for(let x=ix-2;x<=ix+2;x++){ if(inb(x,y) && dist(x,y,ix,iy)<=2.5){
      setTile(x,y,T.SOIL); setSolid(x,y,0);
      if(G.nodes) G.nodes=G.nodes.filter(n=>!(Math.floor(n.x)===x && Math.floor(n.y)===y)); } }
    if(!restored && !G.decor.some(d=>d.fenCroft)){
      G.decor.push({kind:'snag', x:ix-1.4, y:iy-1.3, ph:2.1, h:13, lean:0.34, fenCroft:1});
      G.decor.push({kind:'pillar', x:ix+1.4, y:iy+1.4, broken:true, fenCroft:1}); }
    if(!G.decor.some(d=>d.fenCroftChest)) G.decor.push({kind:'chest', x:ix+0.5, y:iy+0.5, rich:7, fenCroftChest:1}); }
  // the hidden mouth: a flooded sinkhole in the reeds at the head of the causeway. Placed even on
  // a restored isle (on now-dry ground) so the drained Vault below stays re-enterable.
  const head=way.length? way[way.length-1] : null;
  const sp=head || ((typeof findOpenNear==='function' && findOpenNear(Math.round(M.x-M.r*0.7), Math.round(M.y+M.r*0.3), 12)) || null);
  if(sp && inb(sp[0],sp[1]) && !G.decor.some(d=>d.kind==='dungeonmouth' && d.drowned)){
    setTile(sp[0],sp[1],T.PATH); setSolid(sp[0],sp[1],0);
    setTile(sp[0],sp[1]+1,T.PATH); setSolid(sp[0],sp[1]+1,0);   // dry approach from the south
    G.decor.push({kind:'dungeonmouth', x:sp[0]+0.5, y:sp[1]+0.5, drowned:1, label:'the Drowned Vault', name:'THE DROWNED VAULT ▼', hidden:1});
  }
  if(!restored){
    // decorate the drowned land: dead trees standing in the shallows, half-sunk ruins, and reeds.
    { const RS=mulberry32(((SEED||1)+4471)>>>0);
      const causeway=new Set(way.map(w=>w[0]+','+w[1]));
      let placed=0;
      for(let i=0;i<flooded.length && placed<160;i++){ const [x,y]=flooded[(i*29+7)%flooded.length];
        if(causeway.has(x+','+y)) continue;
        const roll=RS();
        if(roll<0.10){ G.decor.push({kind:'snag', x:x+0.5, y:y+0.5, ph:RS()*6.28, h:12+RS()*10, lean:(RS()-0.5)*1.4}); placed++; }
        else if(roll<0.14){ G.decor.push({kind:'pillar', x:x+0.5, y:y+0.5, broken:true}); placed++; }
        else if(roll<0.22){ G.decor.push({kind:'tuft', x:x+0.5, y:y+0.5, ph:RS()*6.28}); placed++; }
      } }
    // a diver's cache out on a drowned rock offshore of the docks (once you can dive)
    if(P.unlocked && P.unlocked.dive && !G.decor.some(d=>d.diverCache)){
      let rock=null;
      for(let rr=6; rr<=22 && !rock; rr+=2){ for(let a=0;a<16 && !rock;a++){
        const ang=a/16*TAU, rx=Math.round(D.x+Math.cos(ang)*rr), ry=Math.round(D.y+Math.sin(ang)*rr);
        if(inb(rx,ry) && tileAt(rx,ry)===T.DEEP) rock=[rx,ry];
      }}
      if(rock){ setTile(rock[0],rock[1],T.SAND); setSolid(rock[0],rock[1],0);
        G.decor.push({kind:'chest', x:rock[0]+0.5, y:rock[1]+0.5, rich:6, diverCache:1}); }
    }
    _curseHint('barikCurseSeen','<b>Vath\'s flood has swallowed the east of Barik</b> - the Mirefen and the farmsteads are one drowned sea now, dead trees standing where the fields were, and a lone croft left marooned out in the deep water. Something waits in a <b>flooded sinkhole</b> up the reed-causeway from the south shore.');
  }
}
/* =====================================================================
   THE OLD-ISLAND RETURN DUNGEONS - Windsurf, Sunward, Cloudreach. Under the
   Warding Veil you steal home to find each old isle warped by a curse Vath let
   fester while you were driven to the reaches; each hides a new dungeon whose
   guardian's hoard grants a new way to move or fight. They share one generic
   descend/ascend mechanism (a dungeonmouth carrying `deepworld`) and one boss
   book-keeping flag (m.gateboss + m.gateDone), so the pattern stays tight.
   ================================================================================= */
function _dungReset(){ for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; } }
function _dungCarve(x0,y0,x1,y1,tile){ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,tile); setSolid(x,y,0); } }
// CONTAIN a dungeon with visible walls: every stone (RUIN) solid tile that borders a walkable
// floor OR a water gap becomes a raised `ewall` block, so the carved chambers read as enclosed
// rooms instead of open floor with invisible collision. (Same technique the Undermill/Undermaw/
// Drowned Catacomb use.) Skips tiles already occupied by a wall-like decor (thornwall pillars,
// gates, mouths). Call it once, after all of a dungeon's tiles+decor are placed.
function _dungWalls(theme){
  const NB=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
  const taken=new Set();
  for(const d of (G.decor||[])){
    if(d.kind==='catgate' && d.tiles){ for(const [tx,ty] of d.tiles) taken.add(tx+','+ty); }   // a gate's gap tiles are never walls
    else if(d.kind==='pillar'||d.kind==='catgate'||d.kind==='ewall'||d.kind==='dungeonmouth') taken.add(Math.floor(d.x)+','+Math.floor(d.y));
    else if(d.kind==='dgate'){ for(let x=d.x0;x<=d.x1;x++) taken.add(x+','+d.gy); }   // a closed gate's solid tiles aren't walls
  }
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(!solidAt(x,y) || tileAt(x,y)!==T.RUIN || taken.has(x+','+y)) continue;   // walls are stone only (not water gaps)
    let border=false;
    for(const [dx,dy] of NB){ const nx=x+dx, ny=y+dy; if(!inb(nx,ny)) continue; const nt=tileAt(nx,ny);
      if(!solidAt(nx,ny) || nt===T.DEEP || nt===T.SHALLOW){ border=true; break; } }   // borders floor or a water gap
    if(border) G.decor.push({kind:'ewall', x:x+0.5, y:y+0.5, s:((x*7+y*13)%5), theme:theme});
  }
}
// ===== GENERIC DUNGEON LOCKS: levers & floor-plates raise gates that block the way on =====
// A `dgate` plugs a corridor row (x0..x1 at gy) and starts SOLID (closed). A `dlever` (pulled)
// or a `dplate` (trodden) opens the matching gate. Call dungGate() in placeObjects AFTER the
// carves so the gate tiles are re-solidified; _dungWalls skips them so they render as a gate.
function dungGate(id, gy, x0, x1, openMsg){
  G.decor.push({kind:'dgate', gate:id, gy, x0, x1, x:(x0+x1)/2+0.5, y:gy+0.5, open:false, openMsg});
  for(let x=x0;x<=x1;x++){ setTile(x,gy,T.RUIN); setSolid(x,gy,1); }
}
function dungOpenGate(id, silent){
  const g=G.decor.find(d=>d.kind==='dgate' && d.gate===id); if(!g || g.open) return;
  g.open=true; for(let x=g.x0;x<=g.x1;x++){ setSolid(x,g.gy,0); setTile(x,g.gy,T.RUIN); }
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(silent) return;
  if(Snd.quest) Snd.quest(); G.shake=Math.max(G.shake||0,0.35);
  if(typeof shockwave==='function') shockwave((g.x0+g.x1)/2+0.5, g.gy+0.5, 'rgba(224,214,182,0.85)', 42);
  if(typeof toast==='function') toast(g.openMsg || 'A gate grinds up - the way on is open.', 3000);
}
function dungOpenAllGates(silent){ for(const d of (G.decor||[])) if(d.kind==='dgate') dungOpenGate(d.gate, silent); }
function pullDungLever(b){
  if(b.on){ if(typeof toast==='function') toast('The lever is already thrown.',1600); return; }
  b.on=true; if(typeof facePoint==='function') facePoint(b.x,b.y);
  if(typeof burst==='function') burst(b.x,b.y-0.4,'#d8d0b8',10,1.6);
  dungOpenGate(b.gate);
}
function dungPlateCheck(){
  if(P.dead) return;
  for(const d of (G.decor||[])){ if(d.kind!=='dplate' || d.pressed) continue;
    if(Math.abs(P.x-d.x)<0.62 && Math.abs(P.y-d.y)<0.62){ d.pressed=true;
      if(Snd.pickup) Snd.pickup(); if(typeof burst==='function') burst(d.x,d.y-0.15,'#dfe6c8',12,1.7);
      dungOpenGate(d.gate); } }
}
// ---- WINDSURF: THE GALE SPIRE (grants the Swiftstep charm (quicker dash)) ----
/* ---------- WINDSURF: THE GALE SPIRE (winddeep) - bespoke ----------
   Three chambers climb the wind-scoured spire before the Eye. THE ANTECHAMBER, where cave-bats
   swoop out of the dark; then two ABYSS CROSSINGS - THE UPDRAFT and THE HIGH CROSSING - each a
   bottomless wind-shaft you cross on a drifting stone platform while a SIDEWAYS GALE (east in
   one room, west in the next, on staggered timing) shoves you toward the drop. Ride the
   platform and hold into the wind or be swept off. At the top the Eye of the Gale seals shut
   and THE SKIRL forms; its charm grants the Swiftstep boon (a quicker dash). ============================== */
const WIND_SEAL=[[34,37],[35,37],[36,37],[37,37],[38,37]];
function genWindDeep(){
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  carve(28,89,44,95);            // ENTRY landing
  carve(34,86,38,90);            // corridor
  carve(20,80,52,86);            // ROOM 1 - THE ANTECHAMBER (bats + the vane-lever for gate A)
  carve(34,77,38,81);            // GATE-A corridor (barred at y78)
  carve(20,70,52,77);            // ROOM 2 - THE UPDRAFT (abyss + platform + gale EAST)
  carve(34,67,38,71);            // corridor
  carve(20,60,52,67);            // ROOM 3 - THE LEE (combat guarding a vane-plate for gate B)
  // OPTIONAL SIDE BRANCH - THE VENTWAY: a dead-end wind-shaft off the Lee's east wall, holding a
  // stash in the lee of the gale. Off the main climb (never gates a route).
  carve(52,62,63,64);            // east passage from Room 3
  carve(61,58,69,68);            // the ventway pocket (the cache)
  carve(34,57,38,61);            // GATE-B corridor (barred at y58)
  carve(20,49,52,57);            // ROOM 4 - THE HIGH CROSSING (abyss + platform + gale WEST)
  carve(34,45,38,50);            // corridor
  carve(20,38,52,45);            // ROOM 5 - THE EYE STEP (a last stand before the Eye)
  carve(34,34,38,39);            // boss corridor (Eye-gate at y37)
  carve(18,8,54,36);             // THE EYE OF THE GALE (boss arena)
}
function placeObjectsWindDeep(){
  G.decor=G.decor||[];
  G.decor.push({kind:'dungeonmouth', x:36.5, y:93.5, deepworld:'wind', exit:1, label:'the way up'});
  // the Ventway's cache (off Room 3's east passage) - optional detour loot
  if(!(P.story && P.story.sideCacheTaken && P.story.sideCacheTaken.wind))
    G.decor.push({kind:'chest', x:65.5, y:63.5, sideCache:'wind', loot:'mat', title:'THE VENTWAY', sub:'A STASH IN THE LEE OF THE GALE'});
  setSolid(36,93,0); setTile(36,93,T.RUIN);
  for(const [tx,ty] of [[24,84],[48,84],[22,73],[52,73],[24,64],[48,64],[22,53],[52,53],[24,40],[48,40],[22,10],[52,10],[36,9]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // ---- THE LOCKS: clearing room 1 of its cave-bats raises gate A (no lever - the fight is the
  // key); a vane-plate in room 3 raises gate B. ----
  dungGate('winA', 78, 34, 38, 'The last bat drops - the gate hauls up on a howl of wind.');
  dungGate('winB', 58, 34, 38, 'The vane-plate drops - the inner gate grinds wide.');
  G.decor.push({kind:'dplate', x:36.5, y:63.5, gate:'winB', pressed:false, label:'a vane-plate'});
  // ---- THE TWO ABYSS CROSSINGS: void bands crossed on drifting platforms, swept by gales ----
  //  ROOM 2 [70..77]: south ledge 76-77 | BAND 72-75 gale EAST | north ledge 70-71
  //  ROOM 4 [49..57]: south ledge 55-57 | BAND 51-54 gale WEST | north ledge 49-50
  G._windChasm=new Set(); G._windSlabs=[]; G._windGusts=[]; G._windT=0; G._windDrop=null;
  G._windStart={sx:36.5, sy:76.5};   // respawn: room-2 south ledge (moves up as you reach each ledge)
  const band=(y0,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=20;x<=52;x++) if(inb(x,y) && !solidAt(x,y)){ G._windChasm.add(x+','+y); G.decor.push({kind:'windpit', x:x+0.5, y:y+0.5, seed:(x*7+y*13)%9}); } };
  band(72,75);   // ROOM 2 abyss
  band(51,54);   // ROOM 4 abyss
  const nsSlab=(cx,ay,by,spd,phase)=>{ const s={kind:'driftslab', ax:cx, ay:ay, bx:cx, by:by, spd:spd, phase:phase||0, x:cx, y:ay, prevx:cx, prevy:ay, w:3, h:3}; G.decor.push(s); G._windSlabs.push(s); };
  nsSlab(31, 76, 71, 0.80, 0);       // ROOM 2 ferry (west lane)
  nsSlab(41, 71, 76, 0.80, 1.1);     // ROOM 2 ferry (east lane, offset - a second route)
  nsSlab(36, 55, 50, 0.90, 0.5);     // ROOM 4 ferry
  // the sideways gales: opposite directions, staggered timing so a lull always comes
  G._windGusts.push({x0:20,x1:52,y0:72,y1:75, dir: 1, push:3.0, period:3.6, t:0.0});   // ROOM 2 blows EAST
  G._windGusts.push({x0:20,x1:52,y0:51,y1:54, dir:-1, push:3.0, period:4.0, t:2.0});   // ROOM 4 blows WEST
  G._windSealed=0; G._windCleared=(P.story&&P.story.galeDeepDone)?1:0;
  G.decor.push({kind:'catgate', x:36, y:37, open:true, gate:'galeeye', tiles:WIND_SEAL.slice(), label:'the Eye-gate'});
  // THE REWARD ROOM: wall off the top of the Eye and stand the Swiftstep charm (QUICKER DASH) +
  // the climb-out inside it, sealed until the Skirl falls (killMob -> openRewardRoom). No portal
  // dropped where the boss dies - the prize was always in the chamber it warded.
  buildRewardRoom({ x0:18, x1:54, wallY:13, gx0:35, gx1:37, floorT:T.RUIN,
    chest:{kind:'chest', x:32.5, y:10.5, dashgift:1}, exitX:40, exitY:10,
    cleared:!!(P.story && P.story.galeDeepDone) });
  G.critters=[];
  if(P.story && P.story.galeDeepDone){ for(const [x,y] of WIND_SEAL) setSolid(x,y,0);
    const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='galeeye'); if(cg) cg.open=true; dungOpenAllGates(true); }
}
function spawnMobsWindDeep(){
  if(!(P.story && P.story.galeDeepDone)){
    // ROOM 1 combat: a flock of cave-bats - fell them all to raise gate A
    for(const [zx,zy] of [[28,83],[44,83],[36,82],[30,84]]){ const sp=findOpenNear(zx,zy,3); if(sp){ const mm=spawnMob('bat',sp[0],sp[1]); if(mm){ mm.room1gate='winA'; mm.respawnT=-1; } } }
    // ROOM 3: bats swarming the vane-plate
    for(const [zx,zy] of [[28,64],[44,64],[36,65]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('bat',sp[0],sp[1]); }
    // THE VENTWAY side-shaft: bats roosting over the cache
    for(const [zx,zy] of [[64,62],[66,65]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('bat',sp[0],sp[1]); }
    // ROOM 5: a last swarm on the Eye step
    for(const [zx,zy] of [[28,41],[44,41]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('bat',sp[0],sp[1]); }
  }
  if(!(P.story && P.story.galeDeepDone)){
    const sp=findOpenNear(36, 20, 7) || [36,20];
    const b=spawnMob('skirl', sp[0], sp[1]);
    if(b){ b.boss=true; b.bigBoss=true; b.title='THE SKIRL'; b.subtitle='THE MADDENED WIND GIVEN SHAPE'; b.hx=sp[0]; b.hy=sp[1]; b.respawnT=-1; b.skirl=1; b.customAI=1; b.gateboss=1; b.gateDone='galeDeepDone'; b.sealed=true; b.arena=1; b.phase='stalk'; b.entrance='descend'; }
  }
}
function genWindDeepAll(){ genWindDeep(); placeObjectsWindDeep(); _dungWalls('gale'); spawnMobsWindDeep(); buildMapBase(); }
// THE UPDRAFT SHAFT per-frame: drift the platforms, blow the sideways gales, fall/respawn over
// the abyss, hold the Eye seal, and run the Skirl.
function updateWindDeep(dt){
  if(!G._windSlabs) return;
  G._windT=(G._windT||0)+dt;
  updateDriftSlabs(G._windSlabs, G._windT);
  windGustPush(dt);
  // ambient: a cold updraft hazes up out of the shaft
  if(Math.random()<dt*16){ const by=[68,58,49][Math.floor(Math.random()*3)]+rnd(-2,2);
    G.parts.push({x:rnd(20,52), y:by, vx:rnd(-0.3,0.3), vy:-rnd(2,4), life:rnd(0.6,1.2), color:'rgba(190,215,235,0.4)', size:rnd(1,2.4), grav:-0.05}); }
  if(G._windDrop){ G._windDrop.t+=dt;
    if(Math.random()<0.6) G.parts.push({x:P.x+rnd(-0.3,0.3), y:P.y+rnd(-0.2,0.6), vx:rnd(-0.4,0.4), vy:rnd(5,9), life:0.4, color:'rgba(210,230,244,0.6)', size:rnd(1.5,3), grav:0});
    if(G._windDrop.t>=G._windDrop.dur) windRespawn();
  } else if(!P.dead){
    const aboard = driftCarry(G._windSlabs);   // ride the platform under you, if any
    windCheckpoint();
    if((P.rollT||0)<=0 && !aboard){            // grounded over the void with no platform -> the shaft takes you
      const tx=Math.floor(P.x), ty=Math.floor(P.y);
      if(G._windChasm.has(tx+','+ty)) windPitStart();
    }
  }
  dungPlateCheck();
  dungRoom1Check('winA');
  windSealCheck();
  for(const m of G.mobs) if(m.skirl && !m.dead && !m.sealed && !m.introKind && !(typeof dlg!=='undefined' && dlg.open)) updateSkirl(m,dt);
}
// the sideways gales: each blasts on its own cycle (lull -> build/telegraph -> BLAST). During a
// blast, standing in the zone shoves you along its heading - toward the drop while you cross.
function windGustPush(dt){
  for(const gz of (G._windGusts||[])){
    gz.t=(gz.t||0)+dt;
    const ph=gz.t % gz.period;
    const building=ph>=gz.period*0.42 && ph<gz.period*0.58, blasting=ph>=gz.period*0.58;
    if((building||blasting) && Math.random()<dt*(blasting?64:24)){
      const sy=rnd(gz.y0, gz.y1+1);
      G.parts.push({x: gz.dir>0? gz.x0-1 : gz.x1+1, y:sy, vx:gz.dir*rnd(8,13), vy:rnd(-0.3,0.3), life:rnd(0.5,1.1), color:blasting?'rgba(235,245,252,0.85)':'rgba(200,220,235,0.5)', size:rnd(1.5,3), grav:0});
    }
    if(blasting && !P.dead){
      const inZone = P.x>=gz.x0 && P.x<=gz.x1 && P.y>=gz.y0 && P.y<=gz.y1;
      if(inZone){ const nx=P.x + gz.dir*gz.push*dt; if(!circleBlocked(nx,P.y,0.28)) P.x=nx; }
    }
  }
}
// bank the last safe ledge you stood on as the respawn point (a fall drops you back one room, not to the start)
function windCheckpoint(){
  if((P.rollT||0)>0) return;
  const tx=Math.floor(P.x), ty=Math.floor(P.y);
  if(!G._windChasm.has(tx+','+ty) && walkTile(tileAt(tx,ty))) G._windStart={sx:tx+0.5, sy:ty+0.5};
}
function windPitStart(){
  G._windDrop={t:0,dur:0.55}; P.hp=Math.max(1,P.hp-4); P.hurtT=Math.max(P.hurtT||0,0.5);
  if(typeof buzz==='function') buzz(9);
  for(let i=0;i<10;i++) G.parts.push({x:P.x+rnd(-0.3,0.3), y:P.y, vx:rnd(-0.6,0.6), vy:rnd(6,11), life:rnd(0.4,0.8), color:'rgba(220,235,246,0.7)', size:rnd(1.5,3), grav:0});
  if(Snd.noise) Snd.noise(0.16,0.05,220,0.6);
  P.click=null; P.moving=false;
}
function windRespawn(){
  G._windDrop=null; const c=G._windStart||{sx:36.5,sy:76.5};
  P.x=c.sx; P.y=c.sy; P.click=null; P.moving=false; P.slideDir=null;
  if(typeof isoX==='function'){ G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
}
function windSealCheck(){
  if(!G._windSealed && !(P.story&&P.story.galeDeepDone)){
    const boss=G.mobs.find(m=>m.skirl && !m.dead);
    if(boss && P.y<=33 && P.x>=18 && P.x<=54){
      G._windSealed=1; for(const [x,y] of WIND_SEAL) setSolid(x,y,1);
      const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='galeeye'); if(cg) cg.open=false;
      if(typeof invalidateScenery==='function') invalidateScenery();
      boss.sealed=false; boss.arena=1;
      if(typeof startBossIntro==='function' && !G.bossIntro) startBossIntro(boss,{kind:boss.entrance||'descend',title:boss.title,sub:boss.subtitle});
    }
  }
  if(G._windSealed && !G._windCleared && !G.mobs.some(m=>m.skirl && !m.dead)){
    G._windCleared=1; for(const [x,y] of WIND_SEAL) setSolid(x,y,0);
    const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='galeeye'); if(cg) cg.open=true;
    if(typeof invalidateScenery==='function') invalidateScenery();
  }
}
function updateSkirl(m,dt){
  const pd=dist(m.x,m.y,P.x,P.y); m.face=(P.x<m.x?-1:1);
  m.shootCd=(m.shootCd||0)-dt; m.pulseCd=(m.pulseCd||0)-dt; m.biteCd=(m.biteCd||0)-dt; m.whirlCd=(m.whirlCd||3)-dt;
  if(!m.enraged && m.hp<m.maxhp*0.45){ m.enraged=1; burst(m.x,m.y-1,'#dfeaf2',24,3.2); G.shake=0.5; }
  if(m.phase==='whirl'){ m.pT-=dt; moveEntity(m, Math.cos(m.whirlA)*m.speed*2.1*dt, Math.sin(m.whirlA)*m.speed*2.1*dt);
    if(dist(m.x,m.y,P.x,P.y)<1.9 && (P.rollT||0)<=0 && !P.dead) hurtPlayer(Math.round(m.dmg*0.8), m);
    if(Math.random()<dt*20) burst(m.x,m.y-1,'#eaffff',3,2);
    if(m.pT<=0) m.phase='stalk'; return; }
  if(m.phase==='pulse'){ m.pT-=dt;
    if(m.pT<=0){ m.phase='stalk'; G.shake=0.6; shockwave(m.x,m.y,'rgba(223,234,242,0.85)',72);
      if(pd<5 && !P.dead){ const a=Math.atan2(P.y-m.y,P.x-m.x); const nx=P.x+Math.cos(a)*2.4, ny=P.y+Math.sin(a)*2.4;
        if(!circleBlocked(nx,ny,0.28)){ P.x=nx; P.y=ny; } if((P.rollT||0)<=0) hurtPlayer(Math.round(m.dmg*0.7), m); } }
    return; }
  const spd=m.speed*(m.enraged?1.25:1.0);
  if(pd>1.6 && !((m.stunT||0)>0)){ const a=Math.atan2(P.y-m.y,P.x-m.x)+Math.sin(G.time*3)*0.5; moveEntity(m, Math.cos(a)*spd*dt, Math.sin(a)*spd*dt); }
  if(m.shootCd<=0 && pd>2){ m.shootCd=m.enraged?1.6:2.4; skirlBlades(m); }
  if(m.pulseCd<=0 && pd<4.5){ m.pulseCd=m.enraged?4:6; m.phase='pulse'; m.pT=0.7; burst(m.x,m.y-1,'#eaffff',14,2); }
  if(m.enraged && m.whirlCd<=0){ m.whirlCd=5; m.phase='whirl'; m.pT=1.1; m.whirlA=Math.atan2(P.y-m.y,P.x-m.x); return; }
  if(pd<1.7 && m.biteCd<=0 && !P.dead){ m.biteCd=1.4; m.swing=0.3; if((P.rollT||0)<=0) hurtPlayer(m.dmg, m); }
}
function skirlBlades(m){ const base=Math.atan2(P.y-m.y,P.x-m.x);
  for(const o of [-0.3,0,0.3]){ const a=base+o; G.projs.push({kind:'shard', x:m.x, y:m.y-0.8, vx:Math.cos(a)*8, vy:Math.sin(a)*8, life:1.6, dmg:Math.round(m.dmg*0.55), from:'mob'}); }
  if(Snd.noise) Snd.noise(0.1,0.04,900,0.5);
}
// ---- SUNWARD: THE ASHEN FORGE (grants the flame snare) ----
/* ---------- SUNWARD: THE ASHEN FORGE (sunwarddeep) - bespoke: THE FORGE CAUSEWAY ----------
   Deep in Mount Kea. The Forge Causeway is a field of lava-vents that erupt on staggered
   timers: each glows and rumbles (telegraph), then jets a column of fire - stand on it and
   you burn. Read the rhythm and thread across between eruptions. At the forge-heart THE
   CINDERWROUGHT rises. Its ember grants the FLAME SNARE. ============================== */
const SUN_SEAL=[[34,37],[35,37],[36,37],[37,37],[38,37]];
function genSunwardDeep(){
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  carve(28,89,44,95);            // ENTRY landing
  carve(34,86,38,90);            // corridor
  carve(20,80,52,86);            // ROOM 1 - THE SLAG YARD (combat + the bellows-lever for gate A)
  carve(34,77,38,81);            // GATE-A corridor (barred at y78)
  carve(20,70,52,77);            // ROOM 2 - THE FORGE CAUSEWAY (lava pool + spinning platform)
  // OPTIONAL SIDE BRANCH - THE CINDER NOOK: a dead-end slag-gallery off the Causeway's west wall,
  // holding a cache among the clinker. Off the main climb (never gates a route).
  carve(9,72,20,74);             // west passage from Room 2
  carve(3,68,11,78);             // the cinder nook (the cache)
  carve(34,67,38,71);            // corridor
  carve(20,60,52,67);            // ROOM 3 - THE STOKEHOLD (combat guarding a heat-plate for gate B)
  carve(34,57,38,61);            // GATE-B corridor (barred at y58)
  carve(20,49,52,57);            // ROOM 4 - THE BELLOWS WALK (vent field on foot)
  // OPTIONAL REJOINING LOOP - THE SLAG DRIFT: a longer western way from Room 4 up to Room 5, winding
  // through a side-gallery with a stash. Rejoins the climb at Room 5 - both routes stay below the boss
  // gate, so it never bypasses the seal. The direct corridor is faster; the long way pays loot.
  carve(10,53,20,55);            // Room 4 -> the west gallery
  carve(4,40,12,55);             // the slag-drift gallery (the long way up)
  carve(10,40,20,42);            // the gallery -> Room 5 (rejoin)
  carve(34,45,38,50);            // corridor
  carve(20,38,52,45);            // ROOM 5 - THE CLINKER STAIR (a last stand before the forge-heart)
  carve(34,34,38,39);            // boss corridor (Forge-gate at y37)
  carve(18,8,54,36);             // THE ASHEN FORGE (boss arena)
}
function placeObjectsSunwardDeep(){
  G.decor=G.decor||[];
  G.decor.push({kind:'dungeonmouth', x:36.5, y:93.5, deepworld:'east', exit:1, label:'the way up'});
  // the Cinder Nook's cache (off Room 2's west passage) - optional detour loot
  if(!(P.story && P.story.sideCacheTaken && P.story.sideCacheTaken.sun))
    G.decor.push({kind:'chest', x:6.5, y:73.5, sideCache:'sun', loot:'fire', title:'THE CINDER NOOK', sub:'A CACHE AMONG THE CLINKER'});
  // the Slag Drift's stash (the reward for taking the long western way up from Room 4)
  if(!(P.story && P.story.sideCacheTaken && P.story.sideCacheTaken.sunLoop))
    G.decor.push({kind:'chest', x:7.5, y:47.5, sideCache:'sunLoop', loot:'mat', title:'THE SLAG DRIFT', sub:'A STASH ON THE LONG WAY UP'});
  setSolid(36,93,0); setTile(36,93,T.RUIN);
  for(const [tx,ty] of [[24,84],[48,84],[22,73],[52,73],[24,64],[48,64],[22,53],[52,53],[24,40],[48,40],[22,10],[52,10],[36,9]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  G._forgeVents=[]; G._forgeErupts=[]; G._forgeT=0;
  let n=0;
  const ventField=(x0,y0,x1,y1,step)=>{ for(let gy=y0; gy<=y1; gy+=(step||3)) for(let gx=x0; gx<=x1; gx+=5){
    const jx=gx+((Math.floor(gy/3)%2)? 2:0);   // stagger alternate rows
    if(inb(jx,gy) && !solidAt(jx,gy)){ G.decor.push({kind:'firepit', x:jx+0.5, y:gy+0.5}); G._forgeVents.push({gx:jx, gy, period:2.6+((n*0.7)%2), nextT:0.6+(n%5)*0.5}); n++; } } };
  // ---- THE LOCKS: clearing THE SLAG YARD (room 1) of its guardians raises gate A;
  // a heat-plate in room 3 raises gate B. (No lever - the fight is the key.) ----
  dungGate('sunA', 78, 34, 38, 'The last of the yard\'s guardians falls - the iron gate hauls up in a gust of heat.');
  dungGate('sunB', 58, 34, 38, 'The heat-plate glows and sinks - the inner gate grinds open.');
  G.decor.push({kind:'dplate', x:36.5, y:63.5, gate:'sunB', pressed:false, label:'a heat-plate'});
  // ---- ROOM 2 - THE FORGE CAUSEWAY: the lava is gathered into one POOL, crossed only on a
  // spinning basalt platform. Board it at the south rim, ride it over the lava to the north rim,
  // and TIME your crossing so the pool's lava-spouts don't catch you on the arm. ----
  G._forgeChasm=new Set(); G._forgeWheels=[]; G._forgePlunge=null; G._forgeStart={sx:36.5, sy:76.5};
  const lavaPool=(x0,x1,y0,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y) && !solidAt(x,y)){ G._forgeChasm.add(x+','+y); G.decor.push({kind:'firepit', x:x+0.5, y:y+0.5, seed:(x*7+y*13)%9, pool:1}); } };
  lavaPool(20,52,72,75);          // the pool spans the full room width - no dry edge to walk around
  const wheel=(hx,hy,r,spd,ang0)=>{ const w={kind:'spinwheel', x:hx+0.5, y:hy+0.5, hx:hx+0.5, hy:hy+0.5, r, spd, ang:ang0, armw:1.2}; G.decor.push(w); G._forgeWheels.push(w); };
  wheel(36,73.5, 3.5, 0.6, Math.PI/2);   // the spinning platform: boards at the south rim, sweeps to the north
  // two lava-spouts erupt from the pool on the platform's sweep-path - offset timers leave a window
  G._forgeVents.push({gx:33, gy:72, period:3.0, nextT:0.6}); n++;
  G._forgeVents.push({gx:33, gy:75, period:3.0, nextT:2.1}); n++;
  // ---- ROOM 4 - THE BELLOWS WALK: a last field of erupting vents to thread on foot ----
  ventField(24,50,48,56,2);
  // a couple of forge-pits in the slag yard, for theming
  for(const [px,py] of [[26,82],[46,84],[36,81]]) if(inb(px,py) && !solidAt(px,py)) G.decor.push({kind:'firepit', x:px+0.5, y:py+0.5});
  G._sunSealed=0; G._sunCleared=(P.story&&P.story.ashenForgeDone)?1:0;
  // glowing lava-veins seamed through the forge floor (theming, on walkable stone)
  { const LS=mulberry32((SEED||1)+717);
    for(let i=0;i<16;i++){ const gx=18+Math.floor(LS()*36), gy=10+Math.floor(LS()*70);
      if(inb(gx,gy) && tileAt(gx,gy)===T.RUIN && !solidAt(gx,gy)) G.decor.push({kind:'lavacrack', x:gx+0.5, y:gy+0.5, seed:i, big:i%5===0}); } }
  G.decor.push({kind:'catgate', x:36, y:37, open:true, gate:'forge', tiles:SUN_SEAL.slice(), label:'the Forge-gate'});
  // THE REWARD ROOM: the Flame Snare + the climb-out stand in a vault walled off the top of the
  // forge, sealed until the Cinderwrought falls (killMob -> openRewardRoom).
  buildRewardRoom({ x0:18, x1:54, wallY:13, gx0:35, gx1:37, floorT:T.RUIN,
    chest:{kind:'chest', x:32.5, y:10.5, snaregift:1}, exitX:40, exitY:10,
    cleared:!!(P.story && P.story.ashenForgeDone) });
  G.critters=[];
  if(P.story && P.story.ashenForgeDone){ for(const [x,y] of SUN_SEAL) setSolid(x,y,0);
    const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='forge'); if(cg) cg.open=true;
    dungOpenAllGates(true);
    // a cleared run: the pool cools to crossable stone and the spinning platform stills
    for(const k of G._forgeChasm){ const [x,y]=k.split(',').map(Number); setTile(x,y,T.RUIN); setSolid(x,y,0); }
    G._forgeChasm=new Set(); G._forgeWheels=[]; G.decor=G.decor.filter(d=>d.kind!=='spinwheel' && !d.pool);
  }
}
function spawnMobsSunwardDeep(){
  if(!(P.story && P.story.ashenForgeDone)){
    // ROOM 1 combat: a scorpion and ash-wracked dead guarding the way up - fell them all to raise gate A
    for(const [zx,zy,k] of [[28,83,'scorpion'],[42,84,'skeleton'],[30,82,'skeleton']]){ const sp=findOpenNear(zx,zy,3); if(sp){ const mm=spawnMob(k,sp[0],sp[1]); if(mm){ mm.room1gate='sunA'; mm.respawnT=-1; } } }
    // ROOM 3: a stoker guarding the heat-plate
    for(const [zx,zy,k] of [[28,64,'skeleton'],[44,64,'scorpion']]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob(k,sp[0],sp[1]); }
    // THE CINDER NOOK side-gallery: a scorpion and dead over the cache
    for(const [zx,zy,k] of [[5,73,'scorpion'],[8,76,'skeleton']]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob(k,sp[0],sp[1]); }
    // THE SLAG DRIFT loop: the toll for the long way up - a scorpion and dead in the gallery
    for(const [zx,zy,k] of [[6,45,'scorpion'],[9,50,'skeleton']]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob(k,sp[0],sp[1]); }
    // ROOM 5: a last stand on the clinker stair
    for(const [zx,zy] of [[28,41],[44,41]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('skeleton',sp[0],sp[1]); }
  }
  if(!(P.story && P.story.ashenForgeDone)){
    const sp=findOpenNear(36, 20, 7) || [36,20];
    const b=spawnMob('cinderwrought', sp[0], sp[1]);
    if(b){ b.boss=true; b.bigBoss=true; b.title='THE CINDERWROUGHT'; b.subtitle='STOKED IN MOUNT KEA\'S FIRE'; b.hx=sp[0]; b.hy=sp[1]; b.respawnT=-1; b.cinder=1; b.customAI=1; b.gateboss=1; b.gateDone='ashenForgeDone'; b.sealed=true; b.arena=1; b.entrance='rise'; }
  }
}
function genSunwardDeepAll(){ genSunwardDeep(); placeObjectsSunwardDeep(); _dungWalls('forge'); spawnMobsSunwardDeep(); buildMapBase(); }
function forgeQueueErupt(x,y,big){ if(!inb(x,y)) return; (G._forgeErupts=G._forgeErupts||[]).push({x,y,phase:'warn',t:0,hitCd:0,big:big?1:0}); }
function forgeTickErupts(dt){
  const list=G._forgeErupts||[];
  for(let i=list.length-1;i>=0;i--){ const e=list[i]; e.t+=dt; e.hitCd-=dt;
    const big=e.big;
    const warnDur=big?1.0:0.7, eruptDur=big?0.9:0.6, radius=big?2.7:1.35, dmg=big?24:13;
    if(e.phase==='warn'){
      // telegraph: a growing ring of embers - the bigger the spout, the wider the danger ring
      if(Math.random()<dt*(big?70:30)){ const a=Math.random()*TAU, rr=radius*(0.5+0.5*(e.t/warnDur));
        G.parts.push({x:e.x+0.5+Math.cos(a)*rr,y:e.y+0.5+Math.sin(a)*rr,vx:0,vy:-rnd(0.3,0.9),life:0.4,color:big?'rgba(255,110,40,0.8)':'rgba(255,150,60,0.7)',size:rnd(1.5,3.5),grav:-0.05}); }
      if(e.t>=warnDur){ e.phase='erupt'; e.t=0; if(G.shake<(big?0.55:0.25)) G.shake=big?0.55:0.25; }
    }
    else {
      // erupt: for big spouts, a tall column of lava fountains up from the vent
      const burst=big?90:50;
      if(Math.random()<dt*burst){ const spread=big?0.9:0.4;
        G.parts.push({x:e.x+0.5+rnd(-spread,spread),y:e.y+0.5,vx:rnd(-0.8,0.8)*(big?1.6:1),vy:-rnd(2,big?7.5:4.5),life:rnd(0.4,big?1.3:0.9),color:Math.random()<0.5?'#ff8a30':'#ffd060',size:rnd(2,big?6:4.5),grav:0.1}); }
      if(big && Math.random()<dt*40){ G.parts.push({x:e.x+0.5+rnd(-0.5,0.5),y:e.y+0.5,vx:0,vy:-rnd(5,9),life:rnd(0.5,1),color:'#ffe9a0',size:rnd(3,6),grav:0.05}); }
      if(dist(P.x,P.y,e.x+0.5,e.y+0.5)<radius && (P.rollT||0)<=0 && !P.dead && e.hitCd<=0){ e.hitCd=0.35; hurtPlayer(dmg,{x:e.x+0.5,y:e.y+0.5});
        if(big){ const a=Math.atan2(P.y-(e.y+0.5),P.x-(e.x+0.5)); moveEntity(P,Math.cos(a)*1.1,Math.sin(a)*1.1); } }
      if(e.t>=eruptDur) list.splice(i,1);
    }
  }
}
function updateSunwardDeep(dt){
  if(!G._forgeVents) return;
  if(Math.random()<dt*10) G.parts.push({x:rnd(20,52),y:rnd(38,80),vx:rnd(-0.2,0.2),vy:rnd(0.4,1),life:rnd(1.5,3),color:'rgba(90,80,74,0.5)',size:rnd(1.5,3),grav:0});  // drifting ash
  // ---- the spinning platform over the lava pool (ROOM 2) ----
  for(const w of (G._forgeWheels||[])) w.ang += w.spd*dt;
  if(G._forgePlunge){ G._forgePlunge.t+=dt;
    if(Math.random()<0.6) burst(P.x+rnd(-0.3,0.3), P.y+rnd(-0.2,0.2), Math.random()<0.5?'#ff8a30':'#ffd060', 1, 1.8);
    if(G._forgePlunge.t>=G._forgePlunge.dur) forgeRespawn();
  } else if(!P.dead){
    if(!wheelCarry(G._forgeWheels, dt) && (P.rollT||0)<=0){   // not riding the platform, grounded
      const tx=Math.floor(P.x), ty=Math.floor(P.y);
      if((G._forgeChasm||new Set()).has(tx+','+ty)) forgePlungeStart();   // stepped/swept into the lava
      else if(walkTile(tileAt(tx,ty))) G._forgeStart={sx:tx+0.5, sy:ty+0.5};   // bank the last dry rim as respawn
    }
  }
  for(const v of G._forgeVents){ v.nextT-=dt; if(v.nextT<=0){ v.nextT=v.period; forgeQueueErupt(v.gx,v.gy); } }
  // random big lava spouts erupt across THE BELLOWS WALK (room 4) - safe footing is never guaranteed
  G._bigSpoutT=(G._bigSpoutT||1.6)-dt;
  if(G._bigSpoutT<=0){ G._bigSpoutT=rnd(1.4,2.8);
    const inVents=P.y>=49 && P.y<=57 && P.x>=20 && P.x<=52;
    let sx,sy;
    if(inVents && Math.random()<0.6){ sx=Math.round(P.x+rnd(-4,4)); sy=Math.round(P.y+rnd(-4,4)); }
    else { sx=Math.round(rnd(22,50)); sy=Math.round(rnd(50,56)); }
    if(inb(sx,sy) && tileAt(sx,sy)>=T.SAND && !solidAt(sx,sy)) forgeQueueErupt(sx,sy,1);
  }
  forgeTickErupts(dt);
  dungPlateCheck();
  dungRoom1Check('sunA');
  forgeSealCheck();
  for(const m of G.mobs) if(m.cinder && !m.dead && !m.sealed && !m.introKind && !(typeof dlg!=='undefined'&&dlg.open)) updateCinderwrought(m,dt);
}
function forgePlungeStart(){
  G._forgePlunge={t:0,dur:0.5}; P.hp=Math.max(1,P.hp-8); P.hurtT=Math.max(P.hurtT||0,0.6);
  if(typeof buzz==='function') buzz(12); if(G.shake<0.4) G.shake=0.4;
  for(let i=0;i<14;i++) G.parts.push({x:P.x+rnd(-0.3,0.3),y:P.y,vx:rnd(-1,1),vy:-rnd(1,3),life:rnd(0.4,0.9),color:Math.random()<0.5?'#ff8a30':'#ffd060',size:rnd(2,4.5),grav:0.08});
  if(Snd.noise) Snd.noise(0.16,0.05,180,0.7);
  P.click=null; P.moving=false;
}
function forgeRespawn(){
  G._forgePlunge=null; const c=G._forgeStart||{sx:36.5,sy:62.5};
  P.x=c.sx; P.y=c.sy; P.click=null; P.moving=false; P.slideDir=null;
  if(typeof isoX==='function'){ G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
}
// A room-1 combat lock: once every guardian tagged for `gate` is dead, that gate hauls up - the
// fight is the key, no lever. Fail-safe: if none are present (a cleared run, or no open spawn
// tile), the gate simply opens so the way is never barred.
function dungRoom1Check(gate){
  const g=G.decor.find(d=>d.kind==='dgate' && d.gate===gate);
  if(!g || g.open) return;
  if(!G.mobs.some(m=>m.room1gate===gate && !m.dead)) dungOpenGate(gate);
}
function forgeSealCheck(){
  if(!G._sunSealed && !(P.story&&P.story.ashenForgeDone)){
    const boss=G.mobs.find(m=>m.cinder && !m.dead);
    if(boss && P.y<=33 && P.x>=18 && P.x<=54){
      G._sunSealed=1; for(const [x,y] of SUN_SEAL) setSolid(x,y,1);
      const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='forge'); if(cg) cg.open=false;
      if(typeof invalidateScenery==='function') invalidateScenery();
      boss.sealed=false; boss.arena=1;
      if(typeof startBossIntro==='function' && !G.bossIntro) startBossIntro(boss,{kind:boss.entrance||'rise',title:boss.title,sub:boss.subtitle});
    }
  }
  if(G._sunSealed && !G._sunCleared && !G.mobs.some(m=>m.cinder && !m.dead)){
    G._sunCleared=1; for(const [x,y] of SUN_SEAL) setSolid(x,y,0);
    const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='forge'); if(cg) cg.open=true;
    if(typeof invalidateScenery==='function') invalidateScenery();
  }
}
function updateCinderwrought(m,dt){
  const pd=dist(m.x,m.y,P.x,P.y); m.face=(P.x<m.x?-1:1);
  m.slamCd=(m.slamCd||0)-dt; m.eruptCd=(m.eruptCd||0)-dt;
  if(!m.enraged && m.hp<m.maxhp*0.5){ m.enraged=1; if(G.shake<0.5) G.shake=0.5; }
  const spd=m.speed*(m.enraged?1.25:1);
  if(pd>1.9 && !(m.windup>0) && !((m.stunT||0)>0)){ const a=Math.atan2(P.y-m.y,P.x-m.x); moveEntity(m,Math.cos(a)*spd*dt,Math.sin(a)*spd*dt); }
  if(pd<2.6 && m.slamCd<=0 && !(m.windup>0) && !((m.stunT||0)>0)){ m.windup=0.6; m.slamCd=m.enraged?2.4:3.4; }
  if(m.windup>0){ m.windup-=dt; if(m.windup<=0){ m.swing=0.3; G.shake=0.7; shockwave(m.x,m.y,'rgba(255,150,60,0.9)',72);
    if(dist(m.x,m.y,P.x,P.y)<3 && (P.rollT||0)<=0 && !P.dead) hurtPlayer(m.dmg, m);
    for(let k=0;k<6;k++){ const a=k/6*TAU; forgeQueueErupt(Math.round(m.x+Math.cos(a)*2.2), Math.round(m.y+Math.sin(a)*2.2)); } } }
  if(m.eruptCd<=0 && pd>2.5){ m.eruptCd=m.enraged?2.4:3.6; forgeQueueErupt(Math.round(P.x),Math.round(P.y));
    if(m.enraged){ forgeQueueErupt(Math.round(P.x)+1,Math.round(P.y)); forgeQueueErupt(Math.round(P.x)-1,Math.round(P.y)); } }
}
// ---- CLOUDREACH: THE STORM TEMPLE (grants the double dash) ----
/* ---------- CLOUDREACH: THE STORM TEMPLE (skydeep) - bespoke: THE STORM NAVE ----------
   A temple the lightning never leaves. Cross THE STORM NAVE and the storm hunts you: a bolt
   is telegraphed on the tile beneath you, then falls a beat later - so you can never stand
   still, you must keep moving up the nave a step ahead of the strikes. At the Stormheart THE
   THUNDERCALLER waits behind a shield it only drops for a beat after each discharge. Its charge
   grants the DOUBLE DASH. ============================================================ */
const STORM_SEAL=[[34,37],[35,37],[36,37],[37,37],[38,37]];
function genSkyDeep(){
  for(let i=0;i<MAPW*MAPH;i++){ G.map[i]=T.RUIN; G.solid[i]=1; }
  const carve=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y)){ setTile(x,y,T.RUIN); setSolid(x,y,0); } };
  carve(28,89,44,95);            // ENTRY landing
  carve(34,86,38,90);            // corridor
  carve(20,80,52,86);            // ROOM 1 - THE NARTHEX (combat + the bell-lever for gate A)
  carve(34,77,38,81);            // GATE-A corridor (barred at y78)
  carve(20,70,52,77);            // ROOM 2 - THE STORM NAVE (hunting strikes)
  carve(34,67,38,71);            // corridor
  carve(20,60,52,67);            // ROOM 3 - THE TRANSEPT (combat guarding a rune-plate for gate B)
  carve(34,57,38,61);            // GATE-B corridor (barred at y58)
  carve(20,49,52,57);            // ROOM 4 - THE CHANCEL (hunting strikes + pillars)
  // OPTIONAL REJOINING LOOP - THE CLOISTER: a longer western way from Room 4 up to Room 5, winding
  // through a side-aisle with a stash (and out of the hunting lightning). Rejoins the climb at Room 5 -
  // both routes stay below the boss gate, so it never bypasses the seal. Direct is faster; the long way pays loot.
  carve(10,53,20,55);            // Room 4 -> the west cloister
  carve(4,40,12,55);             // the cloister aisle (the long way up)
  carve(10,40,20,42);            // the cloister -> Room 5 (rejoin)
  carve(34,45,38,50);            // corridor
  carve(20,38,52,45);            // ROOM 5 - THE SANCTUARY STEP (a last stand before the Stormheart)
  // OPTIONAL SIDE BRANCH - THE RELIQUARY: a dead-end side-chapel off the Sanctuary Step's east
  // wall (kept clear of the boss arena above), holding a cache. Off the main climb (never gates a route).
  carve(52,41,63,43);            // east passage from Room 5
  carve(61,39,69,46);            // the reliquary pocket (the cache)
  carve(34,34,38,39);            // boss corridor (Stormheart-gate at y37)
  carve(18,8,54,36);             // THE STORMHEART (boss arena)
}
function placeObjectsSkyDeep(){
  G.decor=G.decor||[];
  G.decor.push({kind:'dungeonmouth', x:36.5, y:93.5, deepworld:'sky', exit:1, label:'the way up'});
  // the Reliquary's cache (off Room 5's east passage) - optional detour loot
  if(!(P.story && P.story.sideCacheTaken && P.story.sideCacheTaken.sky))
    G.decor.push({kind:'chest', x:65.5, y:42.5, sideCache:'sky', loot:'storm', title:'THE RELIQUARY', sub:'A CACHE BEHIND THE CHAPEL'});
  // the Cloister's stash (the reward for taking the long western way up from Room 4)
  if(!(P.story && P.story.sideCacheTaken && P.story.sideCacheTaken.skyLoop))
    G.decor.push({kind:'chest', x:7.5, y:47.5, sideCache:'skyLoop', loot:'mat', title:'THE CLOISTER', sub:'A STASH ON THE LONG WAY UP'});
  setSolid(36,93,0); setTile(36,93,T.RUIN);
  for(const [tx,ty] of [[24,84],[48,84],[22,73],[52,73],[24,64],[48,64],[22,53],[52,53],[24,40],[48,40],[22,10],[52,10],[36,9]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  // ---- THE LOCKS: clearing room 1 of its storm-shades raises gate A (no lever - the fight is
  // the key); a rune-plate in room 3 raises gate B. ----
  dungGate('skyA', 78, 34, 38, 'The last storm-shade scatters - the temple gate rises on a peal of thunder.');
  dungGate('skyB', 58, 34, 38, 'The rune-plate lights and sinks - the inner gate swings wide.');
  G.decor.push({kind:'dplate', x:36.5, y:63.5, gate:'skyB', pressed:false, label:'a rune-plate'});
  // tall temple pillars for cover-that-isn't (the lightning falls from straight above)
  for(const [px,py] of [[26,73],[46,73],[26,52],[46,52],[30,55],[42,55]]) if(inb(px,py) && !solidAt(px,py)){ G.decor.push({kind:'pillar', x:px+0.5, y:py+0.5, broken:false}); setSolid(px,py,1); }
  // the hunting-lightning haunts THE STORM NAVE (room 2) and THE CHANCEL (room 4); other rooms are safe
  G._stormNaves=[{x0:20,x1:52,y0:70,y1:77},{x0:20,x1:52,y0:49,y1:57}];
  G._stormStrikes=[]; G._stormT=0; G._stormHuntT=0.8;
  G._skySealed=0; G._skyCleared=(P.story&&P.story.stormTempleDone)?1:0;
  G.decor.push({kind:'catgate', x:36, y:37, open:true, gate:'stormheart', tiles:STORM_SEAL.slice(), label:'the Stormheart-gate'});
  // THE REWARD ROOM: the Stormstep (double dash) + the climb-out stand in a vault walled off the
  // top of the temple, sealed until the Thundercaller falls (killMob -> openRewardRoom).
  buildRewardRoom({ x0:18, x1:54, wallY:13, gx0:35, gx1:37, floorT:T.RUIN,
    chest:{kind:'chest', x:32.5, y:10.5, dash2gift:1}, exitX:40, exitY:10,
    cleared:!!(P.story && P.story.stormTempleDone) });
  G.critters=[];
  if(P.story && P.story.stormTempleDone){ for(const [x,y] of STORM_SEAL) setSolid(x,y,0);
    const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='stormheart'); if(cg) cg.open=true; dungOpenAllGates(true); }
}
function spawnMobsSkyDeep(){
  if(!(P.story && P.story.stormTempleDone)){
    // ROOM 1 combat: storm-shades and a bowman - fell them all to raise gate A
    for(const [zx,zy,k] of [[28,83,'skywraith'],[42,84,'skywraith'],[30,82,'archer']]){ const sp=findOpenNear(zx,zy,3); if(sp){ const mm=spawnMob(k,sp[0],sp[1]); if(mm){ mm.room1gate='skyA'; mm.respawnT=-1; } } }
    // ROOM 3: storm-shades guarding the rune-plate
    for(const [zx,zy] of [[28,64],[44,64]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('skywraith',sp[0],sp[1]); }
    // THE RELIQUARY side-chapel: two storm-shades over the cache
    for(const [zx,zy] of [[64,41],[66,44]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('skywraith',sp[0],sp[1]); }
    // THE CLOISTER loop: the toll for the long way up - two storm-shades in the aisle
    for(const [zx,zy] of [[6,45],[9,50]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('skywraith',sp[0],sp[1]); }
    // ROOM 5: a last stand on the sanctuary step
    for(const [zx,zy,k] of [[28,41,'skywraith'],[44,41,'archer']]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob(k,sp[0],sp[1]); }
  }
  if(!(P.story && P.story.stormTempleDone)){
    const sp=findOpenNear(36, 20, 7) || [36,20];
    const b=spawnMob('thundercaller', sp[0], sp[1]);
    if(b){ b.boss=true; b.bigBoss=true; b.title='THE THUNDERCALLER'; b.subtitle='THE TEMPLE\'S CAGED THUNDER'; b.hx=sp[0]; b.hy=sp[1]; b.respawnT=-1; b.thunder=1; b.customAI=1; b.gateboss=1; b.gateDone='stormTempleDone'; b.sealed=true; b.arena=1; b.phase='open'; b.invuln=0; b.entrance='descend'; }
  }
}
function genSkyDeepAll(){ genSkyDeep(); placeObjectsSkyDeep(); _dungWalls('storm'); spawnMobsSkyDeep(); buildMapBase(); }
function stormQueueStrike(x,y){ if(!inb(x,y)) return; (G._stormStrikes=G._stormStrikes||[]).push({x,y,phase:'warn',t:0}); }
function stormTickStrikes(dt){
  const list=G._stormStrikes||[];
  for(let i=list.length-1;i>=0;i--){ const e=list[i]; e.t+=dt;
    if(e.phase==='warn'){ if(Math.random()<dt*26) G.parts.push({x:e.x+0.5+rnd(-0.45,0.45),y:e.y+0.5+rnd(-0.45,0.45),vx:0,vy:0,life:0.3,color:'rgba(150,200,255,0.7)',size:rnd(1,2.5),grav:0});
      if(e.t>=0.85){ e.phase='strike'; e.t=0; if(G.shake<0.4) G.shake=0.4; if(Snd.noise) Snd.noise(0.12,0.05,200,0.7);
        for(let k=0;k<14;k++) G.parts.push({x:e.x+0.5+rnd(-0.3,0.3),y:e.y+0.5-k*0.3,vx:rnd(-0.3,0.3),vy:0,life:0.25,color:k%2?'#eaf2ff':'#bcd8ff',size:rnd(2,4),grav:0});
        if(dist(P.x,P.y,e.x+0.5,e.y+0.5)<1.4 && (P.rollT||0)<=0 && !P.dead) hurtPlayer(16,{x:e.x+0.5,y:e.y+0.5}); } }
    else if(e.t>=0.18) list.splice(i,1);
  }
}
function updateSkyDeep(dt){
  if(!G._stormNaves) return;
  G._stormHuntT=(G._stormHuntT||0)-dt;
  const inNave = G._stormNaves.some(N=> P.x>=N.x0&&P.x<=N.x1&&P.y>=N.y0&&P.y<=N.y1);
  if(G._stormHuntT<=0 && inNave){ G._stormHuntT=1.35; stormQueueStrike(Math.round(P.x),Math.round(P.y)); }
  stormTickStrikes(dt);
  dungPlateCheck();
  dungRoom1Check('skyA');
  stormSealCheck();
  for(const m of G.mobs) if(m.thunder && !m.dead && !m.sealed && !m.introKind && !(typeof dlg!=='undefined'&&dlg.open)) updateThundercaller(m,dt);
}
function stormSealCheck(){
  if(!G._skySealed && !(P.story&&P.story.stormTempleDone)){
    const boss=G.mobs.find(m=>m.thunder && !m.dead);
    if(boss && P.y<=33 && P.x>=18 && P.x<=54){
      G._skySealed=1; for(const [x,y] of STORM_SEAL) setSolid(x,y,1);
      const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='stormheart'); if(cg) cg.open=false;
      if(typeof invalidateScenery==='function') invalidateScenery();
      boss.sealed=false; boss.arena=1;
      if(typeof startBossIntro==='function' && !G.bossIntro) startBossIntro(boss,{kind:boss.entrance||'descend',title:boss.title,sub:boss.subtitle});
    }
  }
  if(G._skySealed && !G._skyCleared && !G.mobs.some(m=>m.thunder && !m.dead)){
    G._skyCleared=1; for(const [x,y] of STORM_SEAL) setSolid(x,y,0);
    const cg=G.decor.find(d=>d.kind==='catgate'&&d.gate==='stormheart'); if(cg) cg.open=true;
    if(typeof invalidateScenery==='function') invalidateScenery();
  }
}
function updateThundercaller(m,dt){
  const pd=dist(m.x,m.y,P.x,P.y); m.face=(P.x<m.x?-1:1);
  m.strikeCd=(m.strikeCd||0)-dt; m.cycleT=(m.cycleT||0)-dt;
  if(!m.enraged && m.hp<m.maxhp*0.5){ m.enraged=1; }
  // shield cycle: CHARGE (invulnerable) -> discharge -> OPEN (the strike window) -> repeat
  if(m.phase==='charge'){ m.invuln=1;
    if(m.cycleT<=0){ m.phase='open'; m.invuln=0; m.cycleT=m.enraged?2.2:2.8; if(G.shake<0.6) G.shake=0.6; shockwave(m.x,m.y,'rgba(180,215,255,0.85)',82);
      if(pd<3.4 && (P.rollT||0)<=0 && !P.dead) hurtPlayer(Math.round(m.dmg*0.9), m); } }
  else { m.invuln=0; if(m.cycleT<=0){ m.phase='charge'; m.invuln=1; m.cycleT=3.2; } }
  if(pd>3 && !((m.stunT||0)>0)){ const a=Math.atan2(P.y-m.y,P.x-m.x); moveEntity(m,Math.cos(a)*m.speed*0.7*dt,Math.sin(a)*m.speed*0.7*dt); }
  if(m.strikeCd<=0){ m.strikeCd=m.enraged?0.95:1.6; stormQueueStrike(Math.round(P.x),Math.round(P.y));
    if(m.enraged) stormQueueStrike(Math.round(P.x)+Math.round(rnd(-2,2)),Math.round(P.y)+Math.round(rnd(-2,2))); }
}

// ---- THE EMBERWICK CAPSTONE: THE TIDEWARD CRYPT ----
// Sealed since the founders, opened only when you carry all four returned-isle
// gifts. Inside, the Sunken Ford is a genuine DIVE crossing; the deeper halls are
// the founders' trials, ending at the Tideward Guardian and a hook toward the
// weapon the prophecy names (see STORY.md, Act II climax).
/* ---------- THE TIDEWARD CRYPT (embertomb) - the Emberwick capstone, bespoke ------------
   Opened only with all four returned-isle gifts (DIVE, the SWIFTSTEP charm, the FLAME SNARE,
   and the DOUBLE DASH). DIVE the Sunken Ford, hop the Broken Span (a 2-tile gap the base dash
   clears now), burn the Emberbriar with a FLAME SNARE, and cross the Sundering Chasm with the
   DOUBLE DASH - then face THE
   TIDEWARD GUARDIAN, the founders' sentinel, and take the trail to the weapon.
   ================================================================================= */
const TOMB_THORN=[[37,29],[38,29],[39,29],[40,29],[41,29],[42,29],[43,29]];   // the Emberbriar wall
function genEmberTomb(){
  _dungReset();
  _dungCarve(32,96,48,108,T.RUIN);        // THE FOUNDERS' STAIR (entry)
  _dungCarve(37,88,43,96,T.RUIN);         // corridor
  _dungCarve(28,82,52,88,T.RUIN);         // SUNKEN FORD - south lip
  for(let y=74;y<=82;y++) for(let x=28;x<=52;x++) if(inb(x,y)){ setTile(x,y,T.DEEP); setSolid(x,y,1); }  // ...flooded: DIVE across
  _dungCarve(28,68,52,74,T.RUIN);         // north lip
  _dungCarve(37,62,43,68,T.RUIN);         // corridor
  _dungCarve(28,56,52,62,T.RUIN);         // BROKEN SPAN - south ledge
  _dungCarve(28,50,52,55,T.RUIN);         // ...the span floor (a 2-tile band is voided in placeObjects - base dash clears it)
  _dungCarve(28,44,52,50,T.RUIN);         // north ledge
  _dungCarve(37,38,43,44,T.RUIN);         // corridor
  _dungCarve(28,30,52,38,T.RUIN);         // EMBERBRIAR chamber
  _dungCarve(37,22,43,30,T.RUIN);         // corridor north (walled by the briar until burned)
  _dungCarve(26,16,54,22,T.RUIN);         // SUNDERING CHASM - south ledge
  _dungCarve(26,10,54,15,T.RUIN);         // ...the chasm floor (voided in placeObjects: DOUBLE DASH)
  _dungCarve(20,2,60,10,T.RUIN);          // THE TIDEWARD VAULT (guardian + reward)
}
function placeEmberTombObjects(){
  G.decor=G.decor||[];
  G.decor.push({kind:'dungeonmouth', x:40.5, y:104.5, deepworld:'isle', exit:1, label:'the way up'});
  setSolid(40,104,0); setTile(40,104,T.RUIN);
  for(const [tx,ty] of [[34,98],[46,98],[26,70],[54,70],[26,58],[54,58],[26,32],[54,32],[24,4],[56,4],[40,3]]) if(inb(tx,ty)) G.decor.push({kind:'lamp',x:tx+0.5,y:ty+0.5});
  G._tombVoid=new Set(); G._tombPlunge=null; G._tombCheck={x:40.5,y:90.5};
  // Every void cell reads as opaque black pit, so what LOOKS like a fall is exactly what
  // drops you (the old 1-in-3 scatter left plunge-tiles that looked like solid floor).
  const voidRect=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(inb(x,y) && walkTile(tileAt(x,y))){ G._tombVoid.add(x+','+y); G.decor.push({kind:'bonepit', x:x+0.5, y:y+0.5}); } };
  voidRect(28,52,52,53);        // THE BROKEN SPAN gap - a 2-tile void the base dash clears (the old longer-dash requirement is gone)
  voidRect(26,10,54,15);        // THE SUNDERING CHASM gap (double dash)...
  // ...but leave a small mid-island to land the first dash on, then dash again to the vault
  for(let y=11;y<=13;y++) for(let x=38;x<=42;x++){ G._tombVoid.delete(x+','+y); setTile(x,y,T.RUIN); setSolid(x,y,0);
    for(let i=G.decor.length-1;i>=0;i--){ const d=G.decor[i]; if(d.kind==='bonepit' && Math.floor(d.x)===x && Math.floor(d.y)===y) G.decor.splice(i,1); } }
  // THE EMBERBRIAR: a thornwall across the north corridor, opened by a FLAME SNARE on its bud
  G._tombThornOpen=0; G._tombThorn={x:40.5, y:34.5};
  for(const [x,y] of TOMB_THORN){ setTile(x,y,T.RUIN); setSolid(x,y,1); G.decor.push({kind:'pillar', x:x+0.5, y:y+0.5, broken:false, thornwall:1}); }   // the barred wall
  G.decor.push({kind:'shoottarget', x:40.5, y:34.5, thornbud:1});       // the bud you burn with a flame-snare
  // THE REWARD ROOM: wall off the top of the Tideward Vault - the founders' hoard + the climb-out
  // stand within, sealed until the Tideward Guardian falls (killMob -> openRewardRoom).
  // a shallow reward vault (y2-3) so the Tideward Guardian keeps the deeper half of the hall (y5-10)
  buildRewardRoom({ x0:20, x1:60, wallY:4, gx0:38, gx1:42, floorT:T.RUIN,
    chest:{kind:'chest', x:34.5, y:2.5, tidewardHoard:1}, exitX:46, exitY:2,
    cleared:!!(P.story && P.story.tidewardDone) });
  G.critters=[];
  if(P.story && P.story.tidewardDone){ tombBurnThorns(true); }           // a cleared run stands open
}
function spawnEmberTombMobs(){
  for(const [zx,zy] of [[34,34],[46,34],[30,20],[50,20]]){ const sp=findOpenNear(zx,zy,3); if(sp) spawnMob('skeleton',sp[0],sp[1]); }
  if(!(P.story && P.story.tidewardDone)){
    const sp=findOpenNear(40, 8, 6) || [40,8];   // below the reward-room wall (y4) so the guardian rises in its deeper arena (y5-10)
    const b=spawnMob('wardking', sp[0], sp[1]);
    if(b){ b.boss=true; b.bigBoss=true; b.title='THE TIDEWARD GUARDIAN'; b.subtitle='THE FOUNDERS\' LAST WARD'; b.hx=sp[0]; b.hy=sp[1]; b.respawnT=-1; b.wardking=1; b.customAI=1; b.gateboss=1; b.gateDone='tidewardDone'; b.tidewardboss=1; b.sealed=true; b.arena=1; b.wphase=1; b.entrance='rise'; }
  }
}
function genEmberTombAll(){ genEmberTomb(); placeEmberTombObjects(); _dungWalls('tide'); spawnEmberTombMobs(); buildMapBase(); }
function tombPlungeStart(){
  G._tombPlunge={t:0,dur:0.5}; P.hp=Math.max(1,P.hp-6); P.hurtT=Math.max(P.hurtT||0,0.5);
  if(typeof buzz==='function') buzz(10); shockwave(P.x,P.y,'rgba(180,190,210,0.7)',30);
  for(let i=0;i<10;i++) G.parts.push({x:P.x+rnd(-0.3,0.3),y:P.y,vx:rnd(-1,1),vy:-rnd(1,2),life:0.6,color:'rgba(200,205,220,0.7)',size:rnd(2,4),grav:0.08});
  P.click=null; P.moving=false;
}
function tombRespawn(){
  G._tombPlunge=null; const c=G._tombCheck||{x:40.5,y:90.5};
  P.x=c.x; P.y=c.y; P.click=null; P.moving=false; P.slideDir=null;
  if(typeof isoX==='function'){ G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
}
function tombBurnThorns(silent){
  G._tombThornOpen=1;
  for(const [x,y] of TOMB_THORN) setSolid(x,y,0);
  G.decor=G.decor.filter(d=>!(d.kind==='pillar'&&d.thornwall) && !(d.kind==='shoottarget'&&d.thornbud));
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(!silent){ if(G._tombThorn) shockwave(G._tombThorn.x,G._tombThorn.y,'rgba(255,150,60,0.9)',48);
    if(G._tombThorn) burst(G._tombThorn.x,G._tombThorn.y-0.3,'#ff9a3c',20,2.8);
    if(typeof toast==='function') toast('The flame-snare catches in the wardbriar and it curls to ash - the way north opens.',4200); }
}
function updateEmberTomb(dt){
  if(!G._tombVoid) return;
  if(G._tombPlunge){ G._tombPlunge.t+=dt; if(G._tombPlunge.t>=G._tombPlunge.dur) tombRespawn(); }
  else if(!P.dead && (P.rollT||0)<=0){
    const tx=Math.floor(P.x), ty=Math.floor(P.y);
    if(G._tombVoid.has(tx+','+ty)) tombPlungeStart();
    else if(walkTile(tileAt(tx,ty)) && tileAt(tx,ty)!==T.DEEP) G._tombCheck={x:P.x,y:P.y};   // last safe footing = the checkpoint
  }
  // THE EMBERBRIAR: a player flame-snare bolt near the bud burns the wall away
  if(!G._tombThornOpen && G._tombThorn){ for(const p of (G.projs||[])){ if(p.from==='player' && p.flame && dist(p.x,p.y,G._tombThorn.x,G._tombThorn.y)<1.6){ tombBurnThorns(); break; } } }
  // THE VAULT: the Guardian rises when you step in
  const boss=G.mobs.find(m=>m.wardking && !m.dead);
  if(boss && boss.sealed && P.y<=10 && P.x>=20 && P.x<=60){ boss.sealed=false; boss.arena=1;
    if(typeof startBossIntro==='function' && !G.bossIntro) startBossIntro(boss,{kind:boss.entrance||'rise',title:boss.title,sub:boss.subtitle}); }
  for(const m of G.mobs) if(m.wardking && !m.dead && !m.sealed && !m.introKind && !(typeof dlg!=='undefined'&&dlg.open)) updateWardKing(m,dt);
}
function updateWardKing(m,dt){
  const pd=dist(m.x,m.y,P.x,P.y); m.face=(P.x<m.x?-1:1);
  m.wphase = m.hp<m.maxhp*0.33?3 : m.hp<m.maxhp*0.66?2 : 1;
  m.sweepCd=(m.sweepCd||0)-dt; m.shardCd=(m.shardCd||0)-dt; m.slamCd=(m.slamCd||0)-dt;
  const spd=m.speed*(m.wphase>=3?1.2:1);
  if(pd>1.9 && !(m.windup>0) && !((m.stunT||0)>0)){ const a=Math.atan2(P.y-m.y,P.x-m.x); moveEntity(m,Math.cos(a)*spd*dt,Math.sin(a)*spd*dt); }
  if(pd<3 && m.sweepCd<=0 && !(m.windup>0) && !((m.stunT||0)>0)){ m.windup=0.55; m.sweepCd=m.wphase>=3?2.2:3.0; }   // telegraphed greatsword sweep
  if(m.windup>0){ m.windup-=dt; if(m.windup<=0){ m.swing=0.35; G.shake=0.55; shockwave(m.x+m.face,m.y-0.3,'rgba(200,240,255,0.85)',56);
    if(dist(m.x,m.y,P.x,P.y)<3.3 && (P.rollT||0)<=0 && !P.dead) hurtPlayer(m.dmg, m); } }
  if(m.wphase>=2 && m.shardCd<=0 && pd>2.4){ m.shardCd=2.8; wardShards(m); }   // phase 2: tideglass shard fan
  if(m.wphase>=3 && m.slamCd<=0){ m.slamCd=8; G.shake=0.8; shockwave(m.x,m.y,'rgba(230,220,150,0.8)',82);   // phase 3: summoning slam
    for(let k=0;k<2;k++){ const sp=findOpenNear(Math.round(m.x+rnd(-4,4)),Math.round(m.y+rnd(-3,3)),4); if(sp){ const s=spawnMob('skeleton',sp[0],sp[1]); if(s){ s.state='chase'; s.respawnT=-1; } } } }
}
function wardShards(m){ const base=Math.atan2(P.y-m.y,P.x-m.x);
  for(const o of [-0.5,-0.25,0,0.25,0.5]){ const a=base+o; G.projs.push({kind:'shard', x:m.x, y:m.y-1, vx:Math.cos(a)*8, vy:Math.sin(a)*8, life:1.7, dmg:Math.round(m.dmg*0.5), from:'mob'}); }
  if(Snd.magic) Snd.magic();
}

// generic descend/ascend for every `deepworld` dungeonmouth
function useGateDungeon(b){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8);
  P.slideDir=null; P.click=null;
  if(!b.exit) P._deepReturn={x:P.x, y:P.y+1.3};
  const ret=P._deepReturn, dest=b.deepworld;
  setTimeout(()=>{ switchWorld(dest);
    if(b.exit && ret){ P.x=ret.x; P.y=ret.y; if(typeof isoX==='function'){ G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; } }
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },200); }, 300);
}

// ---- the surface CURSES + hidden dungeon mouths, planted when the Veil lets you return ----
// Each old isle now visibly bears the wound Vath let fester while you were driven to the
// reaches, and each dungeon's mouth is tucked into a thematic landmark (not a lamp-lit hole
// by the dock). All gated on P.story.vathVeil.

// Place a hidden entrance at an EXACT tile: carve it dry (a stair amid the curse), with a dry
// approach on one side so it's always reachable. No give-away lamps - the fissure art reads
// as the anomaly. Returns false if a mouth for this dungeon already stands.
function _curseMouthAt(x,y,approach,deepworld,label,name){
  if(!inb(x,y)) return false;
  if(G.decor.some(d=>d.kind==='dungeonmouth' && d.deepworld===deepworld)) return false;
  setTile(x,y,T.PATH); setSolid(x,y,0);
  const [ax,ay]=approach||[x,y+1];
  if(inb(ax,ay)){ setTile(ax,ay,T.PATH); setSolid(ax,ay,0); }
  G.decor.push({kind:'dungeonmouth', x:x+0.5, y:y+0.5, deepworld, label, name, hidden:1});
  return true;
}
// a one-time hint the first time you make landfall on a cursed isle under the Veil
function _curseHint(flag,msg){ P.prog=P.prog||{}; if(P.prog[flag]) return; P.prog[flag]=1;
  if(typeof toast==='function') setTimeout(()=>{ try{ toast(msg,7000); }catch(e){} }, 1100); }

// WINDSURF - the maddened wind spun the old waterwheel to ruin: its race burst and drowned
// Waterwheel Row, and a shaft tore open at the foot of the wheel: the Gale Spire.
function placeWindHazard(){
  if(!(P.story && P.story.vathVeil)) return;
  // Once the Skirl in the Gale Spire is felled (galeDeepDone) the maddened wind dies, the burst
  // race stops, and the flood drains - a restored isle regenerates dry (keeping only the Spire
  // mouth), and the drowned north-yard district opens back up so its reward can be claimed.
  const restored = !!(P.story && P.story.galeDeepDone);
  const WH=(typeof WIND_ZONES!=='undefined' && WIND_ZONES.wheel) ? WIND_ZONES.wheel : {x:58,y:68};
  const flooded=[];
  const flood=(cx,cy,r)=>{ cx=Math.round(cx); cy=Math.round(cy); const R=Math.ceil(r);
    for(let y=cy-R;y<=cy+R;y++) for(let x=cx-R;x<=cx+R;x++){ const dd=dist(x,y,cx,cy);
      if(inb(x,y) && dd<=r && walkTile(tileAt(x,y)) && !solidAt(x,y) && tileAt(x,y)!==T.PATH){
        setTile(x,y, dd<=r-1.6?T.DEEP:T.SHALLOW); setSolid(x,y,1);
        if(dd>r-1.6) flooded.push([x,y]); } } };
  if(!restored){
    // the burst race drowns the whole of Waterwheel Row - a wide brown lagoon east of the wheel
    flood(WH.x+5, WH.y+1, 6);
    flood(WH.x+4, WH.y-4, 4);     // ...and spills across the north yard
    flood(WH.x+8, WH.y+4, 4);     // ...and down the mill-leat to the south-east
  }
  // The Gale Spire is entered by going INSIDE the old waterwheel itself - no separate hole in
  // the ground. Flag the wheel building so its door descends into winddeep (see enterHouse).
  // Set in both states so the Spire below stays re-enterable after the flood drains.
  { const wheel=G.decor.find(d=>d.kind==='waterwheel');
    if(wheel){ wheel.deepworld='winddeep'; wheel.galeSpire=1; }
    // make sure the wheel's south door stays a dry, walkable approach even at full flood
    for(const [dx,dy] of [[0,1],[-1,1],[-1,2]]){ const ax=Math.round(WH.x+dx), ay=Math.round(WH.y+dy);
      if(inb(ax,ay) && tileAt(ax,ay)!==T.DEEP){ setTile(ax,ay,T.PATH); setSolid(ax,ay,0); } } }
  // THE DROWNED DISTRICT: a whole scrap of the north yard the flood cuts off ENTIRELY - a little
  // island of drowned rooftops ringed by deep water you cannot reach at all while the isle is
  // cursed. Its reward chest is placed in BOTH states, but while the curse stands a wide ring of
  // solid deep water moats the district off (dive-proof - DIVE only crosses NON-solid deep water).
  // Only once the Spire is cleared and the waters drain does the yard regenerate as dry ground,
  // opening the district and leaving the chest reachable. (The north yard holds no town zone and no
  // through-route, so sealing it can never block a way anywhere - see the reachability audit.)
  { const cx=WH.x+4, cy=WH.y-9;   // (62,59) - deep in the peripheral north yard
    if(inb(cx,cy)){
      if(!restored){
        // a broad moat: a solid deep-water ring (radius 2.5 out to 5) with no gap, so nothing
        // walks in. Contiguous with the dry core below (no walkable land between core and ring).
        for(let y=cy-5;y<=cy+5;y++) for(let x=cx-5;x<=cx+5;x++){ const dd=dist(x,y,cx,cy);
          if(inb(x,y) && dd>2.5 && dd<=5 && tileAt(x,y)!==T.PATH && tileAt(x,y)!==T.PLANK){ setTile(x,y,T.DEEP); setSolid(x,y,1); } }
      }
      // the dry district core (~5 tiles across), walkable in both states; a couple of half-sunk
      // rooftops for flavour while it is an island
      for(let y=cy-2;y<=cy+2;y++) for(let x=cx-2;x<=cx+2;x++){ if(inb(x,y) && dist(x,y,cx,cy)<=2.5){ setTile(x,y,T.SOIL); setSolid(x,y,0);
        if(G.nodes) G.nodes=G.nodes.filter(n=>!(Math.floor(n.x)===x && Math.floor(n.y)===y)); } }
      if(!restored && !G.decor.some(d=>d.kind==='snag'&&d.windRoof)){
        G.decor.push({kind:'snag', x:cx-1.5, y:cy-1.5, ph:1.2, h:12, lean:0.4, windRoof:1});
        G.decor.push({kind:'snag', x:cx+1.5, y:cy+1.5, ph:3.4, h:10, lean:-0.5, windRoof:1});
      }
      if(!G.decor.some(d=>d.windDistrict)) G.decor.push({kind:'chest', x:cx+0.5, y:cy+0.5, rich:8, windDistrict:1});
    } }
  if(!restored){
    // flotsam in the drowned yard: snapped mill-timbers, reeds, a toppled post
    { const RS=mulberry32(((SEED||1)+2213)>>>0); let placed=0;
      for(let i=0;i<flooded.length && placed<40;i++){ const [x,y]=flooded[(i*17+5)%flooded.length];
        if(Math.abs(x-(WH.x+2))<=1 && Math.abs(y-(WH.y+2))<=2) continue;   // keep the mouth clear
        const roll=RS();
        if(roll<0.12){ G.decor.push({kind:'snag', x:x+0.5, y:y+0.5, ph:RS()*6.28, h:10+RS()*7, lean:(RS()-0.5)*1.6}); placed++; }
        else if(roll<0.18){ G.decor.push({kind:'woodpile', x:x+0.5, y:y+0.5}); placed++; }
        else if(roll<0.26){ G.decor.push({kind:'tuft', x:x+0.5, y:y+0.5, ph:RS()*6.28}); placed++; }
      } }
    _curseHint('windCurseSeen','<b>Windsurf lies half-drowned</b> - the maddened wind has spun the old <b>waterwheel</b> to ruin and burst its race, flooding all of Waterwheel Row, and a whole north-yard district is cut off by the deep water. Something has torn open at the wheel\'s foot.');
  }
}
// SUNWARD - Mount Kea erupts unending: fresh lava creeps down the slopes and a fissure has
// split open low on the south face - the way into the Ashen Forge.
// A deterministic peripheral land-nub on the Sunward Isle, far from the volcano and every living
// zone, ringed by as much water/solid as possible - a natural peninsula a lava moat can seal cheap.
// Same in both curse states (reads only base terrain + a fixed scan), so the reward never moves.
function _sunwardPocketSpot(){
  const Z=(typeof EAST_ZONES!=='undefined')?EAST_ZONES:{};
  const isLand=(x,y)=> inb(x,y) && !solidAt(x,y) && walkTile(tileAt(x,y)) && tileAt(x,y)!==T.DEEP && tileAt(x,y)!==T.SHALLOW;
  const coreOK=(cx,cy)=>{ for(let y=cy-2;y<=cy+2;y++) for(let x=cx-2;x<=cx+2;x++){ if(dist(x,y,cx,cy)<=2.5 && !isLand(x,y)) return false; } return true; };
  const zonesClear=(cx,cy)=>{ for(const k in Z){ const z=Z[k]; if(dist(cx,cy,z.x,z.y) < (z.r||6)+9) return false; } return true; };
  const V=Z.volcano||{x:88,y:52,r:22};
  // how boxed-in a spot already is (water/solid around a radius-5 ring) - a peninsula seals with the fewest moat tiles
  const boxScore=(cx,cy)=>{ let s=0; for(let a=0;a<16;a++){ const ang=a/16*TAU, x=Math.round(cx+Math.cos(ang)*5), y=Math.round(cy+Math.sin(ang)*5);
    if(!isLand(x,y)) s++; } return s; };
  let best=null, bestScore=-1;
  for(let y=16;y<MAPH-16;y+=4) for(let x=16;x<MAPW-16;x+=4){
    if(dist(x,y,V.x,V.y) < V.r+6) continue;               // keep clear of Mount Kea's lava field
    if(!coreOK(x,y) || !zonesClear(x,y)) continue;
    const sc=boxScore(x,y);
    if(sc>bestScore){ bestScore=sc; best=[x,y]; }
  }
  return best;
}
function placeSunwardHazard(){
  if(!(P.story && P.story.vathVeil)) return;
  // Once the Cinderwrought in the Ashen Forge is felled (ashenForgeDone) Mount Kea settles - the
  // lava flows cool and the ash clears - so a restored isle regenerates without the lava/cracks,
  // keeping only the fissure mouth so the Forge below stays re-enterable.
  const restored = !!(P.story && P.story.ashenForgeDone);
  const V=(typeof EAST_ZONES!=='undefined' && EAST_ZONES.volcano) ? EAST_ZONES.volcano : {x:88,y:52,r:22};
  if(!restored){
    // fresh lava flows + glowing cracks down the mid-slopes (on the RUIN massif, clear of the caldera)
    const lavaPool=(cx,cy,r)=>{ if(!inb(cx,cy) || tileAt(cx,cy)!==T.RUIN) return;
      G.decor.push({kind:'lava', x:cx+0.5, y:cy+0.5, r});
      for(let y=cy-r;y<=cy+r;y++) for(let x=cx-r;x<=cx+r;x++) if(inb(x,y) && dist(x,y,cx,cy)<=r-0.3 && tileAt(x,y)===T.RUIN) setSolid(x,y,1); };
    const S=mulberry32((SEED||1)+404);
    for(let i=0;i<14;i++){ const a=S()*TAU, rr=V.r*0.45+S()*V.r*0.4;
      lavaPool(Math.round(V.x+Math.cos(a)*rr), Math.round(V.y+Math.sin(a)*rr*0.9), 2+Math.floor(S()*2)); }
    for(let i=0;i<26;i++){ const a=S()*TAU, rr=V.r*0.4+S()*V.r*0.55;
      const cx=Math.round(V.x+Math.cos(a)*rr), cy=Math.round(V.y+Math.sin(a)*rr*0.9);
      if(inb(cx,cy) && tileAt(cx,cy)===T.RUIN && !solidAt(cx,cy)) G.decor.push({kind:'lavacrack', x:cx+0.5, y:cy+0.5, seed:i, big:i%4===0}); }
  }
  // the hidden fissure, low on the south slope (distinct from the summit Emberthroat). Placed even
  // on a restored isle so the Ashen Forge below stays re-enterable.
  const fx=Math.round(V.x), fy=Math.round(V.y+V.r*0.72);
  const sp=(typeof findOpenNear==='function' && findOpenNear(fx, fy, 8)) || [fx,fy];
  _curseMouthAt(sp[0], sp[1], [sp[0], sp[1]+1], 'sunwarddeep', 'the Ashen Forge', 'THE ASHEN FORGE ▼');
  // THE ASHLOCKED TERRACE: a peninsula of green the eruption rings in a MOAT OF MOLTEN ROCK -
  // unreachable while Kea burns, opened when the Ashen Forge is quenched and the lava cools. The
  // core + chest are laid in BOTH states; the moat (cursed only) is flood-fill VERIFIED to seal the
  // pocket without cutting any route to the living zones - if it can't, it is ripped straight back
  // out, so it can never soft-lock (the same verify-or-bail as the Hedda ward).
  { const pk=_sunwardPocketSpot();
    if(pk){ const ix=pk[0], iy=pk[1];
      // core kept walkable in both states
      for(let y=iy-2;y<=iy+2;y++) for(let x=ix-2;x<=ix+2;x++){ if(inb(x,y) && dist(x,y,ix,iy)<=2.5){ setSolid(x,y,0);
        if(!(walkTile(tileAt(x,y)) && tileAt(x,y)!==T.DEEP && tileAt(x,y)!==T.SHALLOW)) setTile(x,y,T.GRASS);
        if(G.nodes) G.nodes=G.nodes.filter(n=>!(Math.floor(n.x)===x && Math.floor(n.y)===y)); } }
      if(!restored){
        // the molten moat: solid ring of lava (radius 2.5..5, matching the Windsurf drowned-district
        // seal). Record the tiles so a failed reachability check can rip them straight back out.
        const ringed=[];
        for(let y=iy-5;y<=iy+5;y++) for(let x=ix-5;x<=ix+5;x++){ const dd=dist(x,y,ix,iy);
          if(inb(x,y) && dd>2.5 && dd<=5 && !solidAt(x,y) && walkTile(tileAt(x,y)) && tileAt(x,y)!==T.DEEP && tileAt(x,y)!==T.SHALLOW){
            ringed.push([x,y]); setSolid(x,y,1); } }
        for(let i=0;i<ringed.length;i++) G.decor.push({kind:'lava', x:ringed[i][0]+0.5, y:ringed[i][1]+0.5, r:1, ashLockMoat:1});
        // VERIFY from the isle spawn: the pocket must be SEALED and every living zone still REACHABLE.
        const spw=(WORLD_DEFS.east && WORLD_DEFS.east.spawn) || {x:44.5,y:120.5};
        const reach=_curseReach(Math.round(spw.x-0.5), Math.round(spw.y-0.5), 60000);
        const nearReach=(z)=>{ if(!z) return true; for(let r=0;r<=6;r++) for(let a=0;a<8;a++){
          const x=Math.round(z.x+Math.cos(a/8*TAU)*r), y=Math.round(z.y+Math.sin(a/8*TAU)*r); if(reach.has(x+','+y)) return true; } return false; };
        const zonesOK=['dock','village','grove'].every(k=>nearReach(EAST_ZONES[k]));
        const sealed=!reach.has(ix+','+iy);
        if(!(zonesOK && sealed)){                       // moat would cut a route (or fails to seal) - tear it out
          for(let i=0;i<ringed.length;i++) setSolid(ringed[i][0], ringed[i][1], 0);
          G.decor=G.decor.filter(d=>!d.ashLockMoat);
          try{ console.warn('placeSunwardHazard: ashlocked terrace verify failed (zones='+zonesOK+' sealed='+sealed+') - moat not placed'); }catch(_){}
        }
      }
      if(!G.decor.some(d=>d.ashLockChest)) G.decor.push({kind:'chest', x:ix+0.5, y:iy+0.5, rich:8, ashLockChest:1});
    } }
  if(!restored) _curseHint('sunCurseSeen','<b>Mount Kea burns without pause</b> - lava creeps down the slopes and ash chokes the sky. A fresh <b>fissure</b> has split the mountain\'s south face, and a green terrace stands marooned in a moat of molten rock.');
}
// CLOUDREACH - a storm has settled over the cloud and will not break: the old standing stones
// are lightning-struck and toppled, and one has cracked open onto the Storm Temple below.
function placeSkyHazard(){
  if(!(P.story && P.story.vathVeil)) return;
  // Once the Thundercaller in the Storm Temple is felled (stormTempleDone) the storm breaks and
  // the Cloudreach clears - so a restored isle regenerates without the stormstruck stones, keeping
  // only the Temple mouth so it stays re-enterable.
  const restored = !!(P.story && P.story.stormTempleDone);
  const L=(typeof SKY_ZONES!=='undefined' && SKY_ZONES.landing) ? SKY_ZONES.landing : {x:32,y:42,r:7};
  if(!restored){
    // the storm has walked the whole ring: stones toppled and lightning-split right across the
    // plateau (SNOW->cloud is the ground here). A scatter of stormstruck stones, not just three.
    const RS=mulberry32(((SEED||1)+7717)>>>0);
    for(let i=0;i<16;i++){ const a=(i/16)*TAU + RS()*0.4, rr=2+RS()*7;
      const cx=Math.round(L.x+Math.cos(a)*rr), cy=Math.round(L.y+Math.sin(a)*rr*0.9);
      if(inb(cx,cy) && tileAt(cx,cy)===T.SNOW && !solidAt(cx,cy) && !(Math.abs(cx-(L.x+4))<=1 && Math.abs(cy-(L.y+3))<=1))
        G.decor.push({kind:'pillar', x:cx+0.5, y:cy+0.5, broken:true, stormstruck:1}); }
  }
  // the hidden mouth beside a shattered stone, just off the landing. Placed even on a restored isle
  // so the Storm Temple below stays re-enterable.
  const sp=(typeof findOpenNear==='function' && findOpenNear(L.x+4, L.y+3, 8)) || [L.x+4, L.y+3];
  _curseMouthAt(sp[0], sp[1], [sp[0], sp[1]+1], 'skydeep', 'the Storm Temple', 'THE STORM TEMPLE ▼');
  if(!restored) _curseHint('skyCurseSeen','<b>A storm has seized the Cloudreach</b> and will not break - lightning walks the cloud and the old standing stones lie split and smoking.');
}
// STORMREACH - Vath's storm never breaks: the sea has climbed the shingle and swamped the low
// coast in surge and wrack. The spirit that churns it dens in the Drowned Catacomb below the
// graveyard (its warden, the Drowned Minotaur), so felling that boss (tombBossDown) lifts the
// surge - a restored isle regenerates dry. No new dungeon or mouth is placed here: Stormreach
// already ships the catacomb and its tomb-mouth (placeObjectsReach), so the reef "sits alongside"
// it exactly as the roadmap invites, and adds NO fifth returned-isle gift.
function placeReachHazard(){
  if(!(P.story && P.story.vathVeil)) return;
  if(P.story && P.story.tombBossDown) return;   // the surge lifts once the catacomb warden falls
  const Z=(typeof REACH_ZONES!=='undefined') ? REACH_ZONES : {strand:{x:60,y:98},dock:{x:98,y:82}};
  // THE STORM-SURGE: the sea climbs the outermost shingle - just the shoreline band, so nothing
  // inland is ever cut off (the tiles behind the new tideline are still land, and the coast roads
  // are PATH tiles the surge skips). A dry berth is kept at the landing and the ferry dock so you
  // can always put in. Computed in TWO passes off the ORIGINAL coastline: pass 1 marks the low-land
  // tiles that border the sea, pass 2 drowns them - so the surge never cascades inland tile-by-tile
  // (an in-place single pass would chain each new shallow into the next and flood the whole isle).
  const sea=(u,v)=>{ const tt=tileAt(u,v); return tt===T.SHALLOW||tt===T.DEEP; };
  const surged=[];
  for(let y=1;y<MAPH-1;y++) for(let x=1;x<MAPW-1;x++){
    const t=tileAt(x,y);
    if((t===T.SAND||t===T.GRASS) && !solidAt(x,y)
       && (sea(x+1,y)||sea(x-1,y)||sea(x,y+1)||sea(x,y-1))
       && !(dist(x,y,Z.strand.x,Z.strand.y)<5 || dist(x,y,Z.dock.x,Z.dock.y)<5))
      surged.push([x,y]);
  }
  for(const [x,y] of surged){ setTile(x,y,T.SHALLOW); setSolid(x,y,1); }
  // stormwrack driven up the new tideline: snapped keels + driftwood, thinned so it never fences a route
  const RS=mulberry32(((SEED||1)+9137)>>>0); let placed=0;
  for(let i=0;i<surged.length && placed<26;i++){ const [x,y]=surged[(i*13+3)%surged.length];
    const roll=RS();
    if(roll<0.13){ G.decor.push({kind:'snag', x:x+0.5, y:y+0.5, ph:RS()*6.28, h:9+RS()*7, lean:(RS()-0.5)*1.7}); placed++; }
    else if(roll<0.19){ G.decor.push({kind:'woodpile', x:x+0.5, y:y+0.5}); placed++; }
  }
  _curseHint('reachCurseSeen','<b>The storm over Stormreach will not break</b> - the sea has climbed the shingle and the coast lies half-drowned in surge and wrack. Whatever churns the water dens below the graveyard, in the <b>Drowned Catacomb</b>.');
}

/* ---- Act II returned-isle DIALOGUE.  NOTE: the damaged/restored lines below are the
   SOURCE OF TRUTH in js/00-dialogue.js (DIALOGUE.curse / DIALOGUE.restore) and are
   re-applied by applyIdleDialogue on every world entry - edit them THERE, not here.
   The folk speak the wound while it stands, and speak
   their relief once you break it. Each is gated on the Warding Veil (so it never touches the
   Act I town) and picks the damaged or restored line-set by the isle's spirit-dungeon clear
   flag. Called from switchWorld's per-isle block, which re-spawns the NPCs every visit - so a
   single call there covers first arrival and the post-restoration return. set() no-ops on any
   NPC not present (conditional spawns like Lord Elias), so the lists are safe supersets. ---- */
function _curseMoodSetter(restored){
  return (id,dmg,res)=>{ const n=G.npcs.find(x=>x.id===id); if(n){ n.idleLines=restored?res:dmg; n.li=0; } };
}
// BARIK - Vath's flood drowned the Mirefen and the eastern farmlands (barikDeepDone lifts it).
function updateBarikCurseMood(){
  if(!(P.story && P.story.vathVeil)) return;
  const set=_curseMoodSetter(!!(P.story && P.story.barikDeepDone));
  set('kell',
    ['You come back to a drowned Barik, warrior. The flood took the whole east - fen, farms, the low road - and half my folk are camped on the keep hill. Whatever churns that water up the reed-causeway, it needs putting DOWN.',
     'I hold the high ground and count heads by lantern. It is all a warden can do while the sea sits where the wheat should be. If you mean to go down that sinkhole - go with my blessing, and quickly.'],
    ['The water\'s falling by the hour and the fields are surfacing black and rich. You gave Barik back its ground, warrior - I\'ll not forget it, and neither will the folk coming down off the hill.',
     'Dry road east again for the first time in weeks. The keep can breathe. Whatever you put down in that vault, it stayed down - and Barik is Barik again because of it.']);
  set('sela',
    ['Half my stores are under three feet of floodwater, love. I\'m selling what I could carry uphill, at prices that shame me. This isn\'t weather - it\'s a curse, plain as the wet.',
     'I rationed the dry goods and prayed. That\'s a provisioner\'s whole trade this season - rationing and praying. End this flood and I\'ll stand you a full pack, free.'],
    ['Cellars drying out, shelves filling back up - I can trade like an honest woman again. Come by, the first hot meal off the mended hearth is yours.',
     'The flood\'s gone and trade\'s come roaring back up the dry road. Bless you for it, love - take a loaf, on the house, and don\'t argue.']);
  set('hedda',
    ['My fields are a LAKE, friend. Thirty years I worked that lowland and now I row a boat over my own furrows. There\'s no farming a curse - somebody has to break the thing making the water.',
     'The beasts are penned on the high paddock and the ploughs are under water. I just sit and watch the flood and grind my teeth. If you can drain it, I\'ll name my best sow after you.'],
    ['DIRT. Real, honest, draining dirt where my lake used to be! It\'ll want a season to dry true, but it\'s mine again. You wonderful, wonderful stranger.',
     'I had a plough in the ground the very morning the water fell. You gave a farmer back her fields - there\'s no thanks big enough, so take a sackful of the first crop and we\'ll call it a start.']);
  set('torv',
    ['I read the deep for a living, and the deep is WRONG. The water\'s not rising off the sky - it\'s welling up from something churning in the vault below the sinkhole. Go quiet whatever it is before the whole east goes under.',
     'Every delver instinct I own says stay out of that flooded stair. And every one says it\'s the only way to stop the water. So - mind the reed-causeway, and go down braver than I would.'],
    ['The deep\'s gone still and honest again - no more churn, no more welling water. Whatever you put down in that vault, the stone remembers it was afraid of you.',
     'I can work the low tunnels again now the flood\'s drained. Found your name would be worth carving over the vault mouth, if you\'d let me.']);
  set('ivo',
    ['The shell-beds are all under deep water now, and what I can reach tastes of the curse. Grim season to be a gatherer on Barik.',
     'I gather what the flood leaves me and it isn\'t much. End this and the beds come back - I\'d owe you the finest pearl in them.'],
    ['Shell-beds surfacing again and the water running clear off them - best gathering in years, and I\'ve you to thank for the season.',
     'The tide sits where it ought to and the beds are fat. Take a spiral shell, friend, for luck - you\'ve earned a whole strand of them.']);
  set('saffi',
    ['Everyone I know is crowded onto the high streets and frightened. The flood came up so fast, and it just... stays. Please tell me you mean to do something about it.',
     'I keep the little ones away from the waterline - it\'s not right, that water, it looks like it\'s watching. Break the curse, warrior. We\'re all counting on it.'],
    ['The streets are draining and folk are drifting back down to their own doors, laughing like they forgot how. That\'s YOUR doing.',
     'It feels like the isle exhaled. Thank you - truly. Barik will tell your name to its children.']);
  set('maelis',
    ['A duchess rules by ledger and patience, warrior, and neither balances a flood. Vath\'s water has cost Barik half its harvest and all its calm. Whatever wardens that drowned vault - it is beyond my writ. It may not be beyond your blade.',
     'I have quartered the flooded families in the keep and stretched the stores as far as sums allow. It is not enough. Nothing is, while the water rules the east. If you can end it, name your fee.'],
    ['You have done what no ledger of mine could: given Barik back its ground. The east will dry, the harvest will come late but it will come, and the keep will remember whose hand drained the fen.',
     'Barik is solvent in more than coin again, thanks to you. The Duchy owes you a debt it will be glad to keep paying.']);
}
// BARIK sheltering: while Vath's storm rages over the flooded isle (vathVeil && !barikDeepDone),
// the townsfolk cannot stand in the open - they huddle on the keep forecourt under the Duchess's
// walls (the same "quartered the flooded families in the keep" the curse dialogue already speaks),
// and only Warden Kell holds the landing, the last soul willing to meet you in the storm and warn
// you off. Runs on every Barik entry (main is cached, so this repositions the restored NPCs too);
// once the Drowned Vault falls the isle regenerates calm and everyone drifts back to their doors.
function shelterBarikFolk(){
  if(G.worldId!=='main') return;
  if(!(P.story && P.story.vathVeil) || (P.story && P.story.barikDeepDone)) return;
  if(typeof findOpenNear!=='function') return;
  const CK=(typeof ZONES!=='undefined' && ZONES.castle) ? ZONES.castle : {x:110,y:300};
  const KX=CK.x-11, KY=CK.y-3;                 // the keep's anchor (gate opens south onto the forecourt)
  const occ={};
  // huddle an NPC onto the nearest free tile to (KX+ox,KY+oy), never onto a tile already taken
  const huddle=(id,ox,oy)=>{
    const n=G.npcs && G.npcs.find(x=>x.id===id); if(!n) return;
    let sp=null;
    for(let r=1;r<=6 && !sp;r++){ const c=findOpenNear(Math.round(KX+ox),Math.round(KY+oy),r);
      if(c && !occ[c[0]+','+c[1]]) sp=c; }
    if(!sp) return;
    occ[sp[0]+','+sp[1]]=1;
    n.x=sp[0]+0.5; n.y=sp[1]+0.5; n.hx=n.x; n.hy=n.y;   // move AND re-anchor so they don't wander home
    n.wander=Math.min(n.wander||0,0.15);                // frightened folk keep close
    n.face={x:0,y:-1};                                  // turned toward the keep at their backs
    n.sheltered=1;
  };
  // spread across the forecourt and the approach south of the gate, so it reads as a crowd taking refuge
  huddle('sela',-3,6); huddle('ivo',-1,6); huddle('rook',1,6); huddle('mira',3,6);
  // Act II Mira has no ribbon-and-thieves errand any more - just grief for the drowning isle
  { const _m=G.npcs && G.npcs.find(n=>n.id==='mira'); if(_m) _m.idleLines=[
    'I keep the needles moving so my hands forget to shake.',
    'Look at the water - grey as a grave and climbing. Whatever that man did out east, it is drowning us slow.',
    'I do not care about silk or ribbons now. I only want the sea to go back to blue.']; }
  huddle('bree',-4,8); huddle('saffi',-2,8); huddle('dockhand',0,8); huddle('hedda',2,8); huddle('torv',4,8);
  huddle('moss',-3,10); huddle('hermit',-1,10); huddle('aelin',1,10);
  // Warden Kell alone holds the landing you arrive at, to turn you back into the keep
  const D=(typeof ZONES!=='undefined' && ZONES.dock)?ZONES.dock:{x:55,y:258};
  const kell=G.npcs && G.npcs.find(n=>n.id==='kell');
  const ks=findOpenNear(Math.round(D.x+3),Math.round(D.y+1),7);
  if(kell && ks){ kell.x=ks[0]+0.5; kell.y=ks[1]+0.5; kell.hx=kell.x; kell.hy=kell.y; kell.wander=0; kell.warner=1; }
}
// WINDSURF - the maddened wind drowned Waterwheel Row and a north district (galeDeepDone lifts it).
function updateWindCurseMood(){
  if(!(P.story && P.story.vathVeil)) return;
  const set=_curseMoodSetter(!!(P.story && P.story.galeDeepDone));
  set('rell',
    ['Half my harbour\'s under water that shouldn\'t be there, and a wind that won\'t die drove it up over the Row and a whole north district besides. That\'s no gale - it\'s a THING, denned in the spire that tore open at the wheel\'s foot. Go still it.',
     'I count my drowned jetties every morning and swear at the wind. It never stops - never once drops - and till it does, Windsurf drowns by inches. If you\'ve the nerve for that spire, harbormaster to hero: go.'],
    ['Dead calm, first time in weeks, and the water\'s pulling back off the Row like a tide remembering its manners. You gave us our harbour back - and the north district the flood had stolen with it.',
     'Boats working the strait again and every one of them puts in to ask who broke the curse. I point them at you. Windsurf owes you its whole livelihood, and it knows it.']);
  set('coralie',
    ['I\'ve shuttered the Breakers against the gale and the sea both - the salt baths are full of storm-wrack and the guest wing looks out on a flood. No one takes a room to watch a curse. Break it, and I\'ll open every window I own.',
     'The wind screams down the chimneys all night and the water laps the terrace. A resort needs weather folk want to sit IN. Still that spire, love, and the Breakers lives again.'],
    ['GUESTS again! The wind\'s gone gentle and the flood\'s drawn off the terrace - the salt baths are hot and the sea view is glorious. All yours, on the house, for as long as you like.',
     'The Breakers is full to the rafters and the sea\'s a mill-pond off the terrace. You didn\'t just save a resort, you saved my whole trade. Bless you, traveller.']);
  set('burl',
    ['I built half the jetties the flood just ate. Forty years of joinery gone brackish overnight. It\'s that cursed wind off the wheel - fix the wheel\'s curse and I\'ll rebuild, gladly.',
     'Can\'t drive a pile in water that won\'t hold still and a wind that won\'t quit. A wright\'s hands go idle in a drowned town. Go do the thing I can\'t.'],
    ['Solid ground to build on again and a calm sky to build under - I\'ve three jetties framed already. Good work makes a body forget the bad season, and this is good work.',
     'The Row\'s draining and every plank I lay stays dry. That\'s your doing, and I\'ll carve it into the first new post if you don\'t stop me.']);
  set('pia',
    ['Trade Row\'s half-flooded and the sailors that used to buy me out are gone with the calm water. I sell what I can from the high stalls and watch the deep creep up the cobbles.',
     'No fleet, no festival, no sugar-melon sold by noon - just the wind and the rising water. Break the curse and I\'ll have this Row humming by nightfall, see if I don\'t.'],
    ['Sold clean out by midday - the sailors are back and they buy like it\'s a festival! Take a spice-plum, on the house, for giving Trade Row its bustle back.',
     'The Row hums again and the deep water\'s off the cobbles for good. Best season I can remember, and I know exactly whose boots to thank for it.']);
  set('tolen',
    ['A whittler needs dry wood and a steady hand, and this cursed wind gives me neither - it snatches the shavings clean off my knife. No boards get shaped till that gale is stilled.',
     'I keep my good timber up on the loft-beams away from the flood and wait. That\'s all Windsurf does now: keep things high, and wait. Go end the waiting.'],
    ['The wind\'s gentle enough to whittle by again - curls of cedar dropping neat at my feet like the old days. Come by, I\'ll shape you something that rides a calm sea.',
     'Dry benches, still air, and a whole stack of boards to catch up on. You handed a craftsman back his craft, friend. That\'s not a small thing.']);
  set('nessa',
    ['Every loom in my loft would run if there were a fleet to buy the canvas - but the flood\'s drowned the Row and the wind\'s eaten the sails I DID make. There\'s no sailmaking under a curse.',
     'I stitch and I unpick and I watch the water. Told you once I\'d have this town in sail by nightfall if a boat could only cross - well. Break the wind\'s curse and hold me to it.'],
    ['Every loom in the loft running and the fleet wants canvas YESTERDAY - the strait\'s a highway again. You made a liar of no one: the town\'s in sail, just as I swore.',
     'Sails going out faster than I can stitch them, and a calm sky to test them under. That\'s a sailmaker\'s heaven, and you built it. My thanks, on every hull that crosses.']);
  set('wenna',
    ['The little ones aren\'t allowed near the waterline anymore - it came up so fast and it just STAYS, and the wind never lets up. I\'ll sleep easy the day someone stills that spire.',
     'We keep to the high streets and mind the young ones and hope. Please - if you can quiet that wind, do it soon. This isn\'t a town anymore, it\'s a huddle.'],
    ['The children are back paddling in the SHALLOWS where the flood used to be, laughing their heads off. That\'s the sound of a curse lifted, and it\'s the sweetest thing I know.',
     'The wind\'s a friend again and the water knows its place. You gave us our town back, whole. We won\'t forget the day you walked in under that Veil.']);
}
// SUNWARD - Mount Kea erupts without pause, ash and lava over the isle (ashenForgeDone lifts it).
function updateSunCurseMood(){
  if(!(P.story && P.story.vathVeil)) return;
  const set=_curseMoodSetter(!!(P.story && P.story.ashenForgeDone));
  set('moli',
    ['Kea has not slept one night since the robed man\'s shadow crossed us, child. It burns and burns - lava down every slope, ash on every breath. Something is stoked in the mountain\'s heart, in the fissure on the south face. Quench it, or Kea buries us all.',
     'I am too old to run from a mountain and too stubborn to leave it. So I sit in the ash and I trust that a hero walked in under the Veil for a reason. Go down into that forge, child, and give me back my quiet mornings.'],
    ['Quiet. QUIET - do you feel it under your feet? No grumble, no fire. The ash is thinning and the slopes cool by the hour. You gave the Sunward Isle back its mornings, child. Bless you.',
     'The mountain sleeps like it used to, and the sky is blue over Kohana again. An old woman does not cry easily, but I came near it when the first clear dawn broke. Thank you.']);
  set('kaia',
    ['I can\'t launch a hull through ash this thick - it fouls the sail and burns little holes clean through the canvas. The Wavewright sits idle while Kea rages. That fire needs quenching at its source.',
     'Every wave off the north shore comes in grey with cinders. No wright works in weather like this. Still the mountain and I\'ll build you the finest boat on the isle.'],
    ['Clear air off the water again - I\'ve two hulls on the stocks and ash-free canvas for both. You gave a wavewright back her trade, and the sea back its blue.',
     'The strait\'s clean and the sky is clear and every boat I launch stays that way. Come sail one out with me sometime - I owe you at least that.']);
  set('huk',
    ['The boars have gone half-mad with the ash and the shaking, fleeing down off the slopes into the village pens. A boarfather can\'t herd against a burning mountain. Somebody has to cool Kea\'s temper.',
     'Even the tuskiest old sow won\'t face those slopes now, and I don\'t blame her - the lava creeps where the grazing was. Quench the mountain and I\'ll drive the herd back up myself.'],
    ['The herd\'s climbing back up the cooled slopes to the good grazing, calm as you please. The mountain scared them witless for a season - you unscared it. My thanks, hunter.',
     'Boars fat and slopes green again, no ash in the wallows. That\'s a good isle to be a boarfather on, and you made it one. Come, I\'ll roast you the best of the drove.']);
  set('sable',
    ['The ash gets into everything - the wells, the washing, the lungs of the little ones. We wear rags over our faces and pray the mountain tires. It never does. Not on its own.',
     'I sweep the same ash off the same step three times a day and it falls again by dusk. This isn\'t living, it\'s enduring. End it, traveler, if any hand can.'],
    ['Clean air, clear wells, washing that dries WHITE on the line - I\'d forgotten the isle could be like this. That\'s your gift to us, and I\'ll thank you for it every clean morning.',
     'The little ones play in the open again with no rag over their faces. You gave the Sunward Isle back its breath. There\'s no repaying that, so I\'ll just say bless you.']);
  set('lani',
    ['The groves are choked grey and half the fruit drops scorched before it ripens. Ash-farming, we\'re calling it, and laughing so we don\'t weep. Cool that mountain and the green comes back.',
     'I shake cinders off the leaves and gather what survives. It isn\'t much of a harvest under a burning sky. Still Kea and I\'ll fill your pack with the first clean fruit.'],
    ['The groves are GREEN again and the fruit ripens sweet with no ash to scorch it. First honest harvest in a season, and it\'s down to you. Take an armful, they\'re perfect.',
     'Leaves clean, boughs heavy, sky clear - a grower could weep for joy. You gave us the season back. The whole Sunward Isle eats better because you walked in under that Veil.']);
  set('corvoE',
    ['I\'d ferry folk clear of this burning rock if the ash didn\'t choke my sails to rags. So I sit at anchor and watch Kea rage and curse the robed man who woke it.',
     'No captain sails blind through a cinder-sky, and that\'s all the sky there is now. Quench the mountain, hero, and I\'ll run you anywhere the water reaches.'],
    ['Clear air and a fair wind - the Sunward\'s a port worth calling at again. You cooled the mountain that had me trapped at anchor, and a captain remembers a debt like that.',
     'Sailed out this morning under a blue sky for the first time in a season and near wept at the clean horizon. That\'s your doing. Passage is free for you, always.']);
}
// CLOUDREACH - a storm settled over the cloud and will not break (stormTempleDone lifts it).
function updateSkyCurseMood(){
  if(!(P.story && P.story.vathVeil)) return;
  const set=_curseMoodSetter(!!(P.story && P.story.stormTempleDone));
  set('aeron',
    ['This cloud weathered every gale in memory, Skyward - but not this one. A storm settled the day the robed man\'s shadow reached us and it will NOT break. Lightning walks the standing stones and splits them where they lie. It\'s caged thunder, penned in the temple by the landing. Let it out.',
     'I have watched the sky my whole life and I have never seen it stay angry this long. It is unnatural - a curse, penned and pacing. Go down into that temple and quiet it, before the lightning walks the whole cloud to rubble.'],
    ['It BROKE. The storm broke clean away to blue, like a held breath let go - first clear sky over the Cloudreach in a season. You have my thanks, Skyward, and the whole cloud\'s besides.',
     'Clear air and gentle wind and the old stones standing quiet. We truly thought we\'d lost the sun for good. You gave it back. The cloud-folk will sing your name up here for three generations.']);
  set('wisp',
    ['I tend the cloud, but there\'s no tending a storm that won\'t break - it frays the vapour faster than I can knit it, and the lightning scares the sky-drift clean away. Please, quiet the temple.',
     'The endless thunder sets my teeth on edge and thins the cloud beneath our very feet. I do what a cloud-tender can and it isn\'t enough. Still it, Skyward, before the plateau itself comes apart.'],
    ['The cloud knits thick and gentle again and the sky-drift\'s drifting home - I can hear myself think for the first time in a season. That\'s your gift, and I\'ll tend it well.',
     'Calm sky, whole cloud, quiet stones. You gave the Cloudreach back to the cloud-folk. There\'s no thanks light enough to float up here and carry all I mean by it.']);
}
// STORMREACH - Vath's storm-surge drowns the coast until the Drowned Minotaur is felled (tombBossDown lifts it).
function updateReachCurseMood(){
  if(!(P.story && P.story.vathVeil)) return;
  const set=_curseMoodSetter(!!(P.story && P.story.tombBossDown));
  set('mora',
    ['You come back to a drowned coast, warrior. The storm that always tested us will not break now - it drives the sea up over the shingle faster than we can haul the boats clear. It is the thing under the graveyard, our fathers\' old prisoner, churning the deep awake. Put the Drowned Minotaur down and the surge will fall.',
     'I count heads by lantern on the high strand and watch the water take another yard of shore by morning. It is all a coast-elder can do while the storm rules the tideline. Go down into that catacomb, warrior, and give us our shore back.'],
    ['The storm broke the hour you felled it and the surge is pulling back off the shingle by the yard. You gave Stormreach its coast again, warrior - the boats are already going back down to real water.',
     'Clear tideline, falling water, and a coast worth living on for the first time in weeks. Whatever you put down under the graves, it stayed down - and Stormreach is Stormreach again because of it.']);
  set('tibb',
    ['Every hull I drag up the strand, the surge climbs and takes it back by dark. There is no raftwright\'s trade to be had while the sea walks up the shingle like this. Still the thing churning it and I can work again.',
     'I mend what the wrack throws up and the water swallows it by dawn. It is heartbreak, not carpentry. Break the storm at its source, warrior, and I\'ll keep this coast in sound keels for good.'],
    ['Dry strand to work on and the tide sitting where it ought - I\'ve two hulls up on the blocks and neither\'s floated off since. You gave a raftwright back his trade, and the coast back its keels.',
     'The surge is gone and the salvage is ours again, high and dry up the shingle. Take a raftwright\'s thanks - and a berth here, sound and safe, whenever your sail needs it.']);
}
// The Emberwick capstone opens only once all four returned-isle gifts are in hand.
function haveAllFourGifts(){ return !!(P.unlocked && P.unlocked.dive && P.unlocked.swiftstep && P.unlocked.dash2 && P.spells && P.spells.flamesnare); }
function placeEmberTomb(){
  if(!haveAllFourGifts()) return;
  if(G.worldId && G.worldId!=='isle') return;   // only the Emberwick surface carries the mouth
  if(G.decor.some(d=>d.kind==='dungeonmouth' && d.deepworld==='embertomb')) return;
  const Z=(typeof ISLE_TOMB!=='undefined' && ISLE_TOMB) ? ISLE_TOMB : {x:52,y:82};   // the isle's SOUTHERN shore (moved off the northern Old Ruins)
  const sp=(typeof findOpenNear==='function' && findOpenNear(Math.round(Z.x), Math.round(Z.y), 14)) || null;
  if(sp && inb(sp[0],sp[1])){
    for(let y=sp[1]-1;y<=sp[1]+1;y++) for(let x=sp[0]-1;x<=sp[0]+1;x++) if(inb(x,y) && walkTile(tileAt(x,y))) setTile(x,y,T.PATH);
    G.decor.push({kind:'dungeonmouth', x:sp[0]+0.5, y:sp[1]+0.5, deepworld:'embertomb', label:'the Tideward Crypt', name:'THE TIDEWARD CRYPT ▼'});
    G.decor.push({kind:'lamp', x:sp[0]-1.5, y:sp[1]+0.5}); G.decor.push({kind:'lamp', x:sp[0]+1.5, y:sp[1]+0.5});
    // The four gifts are gathered on the returned isles, and only the DIVE gift dropped the
    // cached Emberwick - so if DIVE wasn't the LAST gift in hand, a fresh regen never ran and
    // the mouth never appeared. switchWorld now calls this on every isle entry, so when it lands
    // live on an already-generated (cached) Emberwick, redraw the scenery + big map and point the
    // player north to the Old Ruins the first time the way opens.
    if(typeof invalidateScenery==='function') invalidateScenery();
    if(typeof buildMapBase==='function') buildMapBase();
    if(!(P.story && P.story.tidewardSeen)){ P.story=P.story||{}; P.story.tidewardSeen=1;
      if(typeof toast==='function') setTimeout(()=>toast('<b style="color:var(--ember)">With all four gifts in hand, the ground splits open at the isle\'s southern shore.</b> A founders\' stair winds down into <b>the Tideward Crypt</b> - at the <b>ruins on Emberwick\'s southern point, past Willa\'s farm</b>, where the last ward was sealed. Go down when you\'re ready.',8500), 700); }
  }
}
function beginOpenChest(b){
  if(b.opened){ openChest(b); return; }
  if(P.openCh && P.openCh.b===b) return;
  P.openCh={b, t:0, dur:1.5};
  P.click=null; Snd.step(6);
}
function openChest(b){
  if(b.opened){ toast('Empty - already plundered.'); return; }
  b.opened=true; b.kind='chestOpen';
  // tool-gate content persistence: any chest carrying a stable tgid records itself
  // opened, so it is not re-placed when the world regenerates on reload (35-toolgate-content.js)
  if(b.tgid){ P.story=P.story||{}; P.story.tg=P.story.tg||{}; P.story.tg[b.tgid]=1; }
  // AN ARMOR CACHE: the Barrow Brute's hoard held plate, not coin. Grants (and equips) an
  // armor upgrade - never a downgrade if you already wear better.
  if(b.armorgift){
    bumpStat('chests');
    const tier=b.armorgift, names=['Traveler’s Clothes','Iron Armor','Steel Plate'], red=[0,15,30];
    shockwave(b.x,b.y,'rgba(200,205,215,0.9)',52); burst(b.x,b.y-0.5,'#cdd4de',18,2.5); if(Snd.levelup) Snd.levelup();
    const already=(P.armorOwn||0)>=tier;
    P.armorOwn=Math.max(P.armorOwn||0, tier);
    if((P.armor||0)<tier) P.armor=tier;   // auto-equip the better plate
    giveGold(rndi(40,80));
    if(typeof buildHotbar==='function') buildHotbar();
    if(typeof refreshUI==='function') refreshUI();
    if(already){ banner('THE BARROW HOARD','ARMOR YOU ALREADY BETTER - AND OLD COIN'); }
    else banner('THE BARROW HOARD', (names[tier]||'ARMOR').toUpperCase()+' - TURNS ASIDE '+(red[tier]||0)+'% OF EVERY BLOW');
    setTimeout(autoSave,300); return;
  }
  // THE DROWNED VAULT'S REWARD: the Pearl of the Deep - the gift to DIVE, to cross the
  // drowned water Vath's flood raised over the old islands.
  if(b.divegift){
    bumpStat('chests');
    P.story=P.story||{}; P.unlocked=P.unlocked||{};
    shockwave(b.x,b.y,'rgba(120,200,230,0.9)',56); burst(b.x,b.y-0.5,'#8fd8ff',22,2.8); if(Snd.levelup) Snd.levelup();
    if(!P.unlocked.dive){
      P.unlocked.dive=true; P.story.barikDeepDone=1;
      if(typeof WORLDS!=='undefined'){ delete WORLDS.isle; delete WORLDS.main; }   // refresh the capstone mouth + drain restored Barik
      banner('THE PEARL OF THE DEEP','DIVE - CROSS THE DROWNED WATER');
      setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>In the vault\'s heart, cupped in the Minotaur\'s drowned hoard, a single great <b>pearl</b> the colour of deep water. It is warm, though the vault is cold, and when you close your hand on it the flood outside stops feeling like a wall.</i> <b style="color:#8fd8ff">You learn to DIVE.</b> <i>Walk into the deep water now and you sink beneath it and swim - the drowned reaches Vath\'s flood cut off across the old islands are yours to cross at last.</i>'); },500);
    } else { giveGold(rndi(120,180)); give('pearl',1); banner('THE TIDE-LOCK HOARD','PEARLS AND OLD COIN'); }
    setTimeout(autoSave,300); return;
  }
  // THE GALE-SHRINE (Cloudreach): the bow - moved here from the old world, and the ONLY arm
  // that can strike the Storm-Eye up on the rainbow road. A genuine surprise behind the spirit.
  if(b.skybow){
    bumpStat('chests');
    P.story=P.story||{}; P.story.skyBowTaken=1;
    shockwave(b.x,b.y,'rgba(255,215,106,0.85)',48); burst(b.x,b.y-0.5,'#ffd76a',16,2.4);
    P.unlocked=P.unlocked||{};
    if(!P.unlocked.bow){
      P.unlocked.bow=true; P.maxArrows=P.maxArrows||20; P.arrows=P.maxArrows;
      if(typeof buildHotbar==='function') buildHotbar();
      if(typeof refreshUI==='function') refreshUI();
      Snd.levelup&&Snd.levelup();
      banner('THE STORMWARD BOW','A RANGED ARM - AND THE BANE OF THE STORM-EYE');
      setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>The shrine\'s coffer gives up a tall stormward <b>bow</b> of horn and windcord, and a quiver of twenty long shafts fletched in gull-grey.</i> <b style="color:var(--ember)">Bow unlocked!</b> '+((typeof isTouch!=='undefined'&&isTouch)?'Tap the bow slot':'Press 2')+' to loose arrows - each one bites deep, and the <b>quiver of 20</b> does not refill on its own - gather dropped shafts to restock, so make them count. <i>Keep it close - up on the rainbow road, when you face the <b>Storm-Eye</b>, the bow is the <b>only</b> thing that will bite it.</i>', {label:'OK'});
        else toast('<b style="color:var(--ember)">Bow unlocked!</b> Only the bow can strike the Storm-Eye ahead.',7000); },400);
    } else {
      giveGold(30); give('potion',1); Snd.quest&&Snd.quest();
      banner('THE SHRINE OPENS','A QUIVER AND A TONIC');
      setTimeout(()=>toast('You carry a bow already - the shrine\'s spare goes to the pack with a tonic and a few coins. (Its long shafts are the one thing the <b>Storm-Eye</b> will feel.)',6000),400);
    }
    setTimeout(autoSave,300); return;
  }
  // THE BROKEN CROWN: the Cloud-Chart - the map you carry to Ashwing to be borne between isles.
  if(b.skymap){
    bumpStat('chests');
    P.story=P.story||{}; P.story.skyMapTaken=1; give('skymap',1);
    shockwave(b.x,b.y,'rgba(200,225,255,0.9)',52); burst(b.x,b.y-0.5,'#dce8ff',18,2.6); Snd.levelup&&Snd.levelup();
    banner('THE CLOUD-CHART','A MAP OF THE WIND-ROADS');
    setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>The crown kept an old chart, inked on stormcloth - every wind-road the great dragon once flew, laid out isle to isle.</i> <b style="color:#c9b0ff">You take the Cloud-Chart.</b> <i>The bird waits at the vault\'s edge to bear you down to the Cloudreach. Show the chart to <b>Ashwing</b> at the landing, and - now the high wind is tamed - he will fly you on to <b>Windsurf</b>, back to the Cloudreach, or to the <b>Sunward Isle</b>.</i>'); },500);
    setTimeout(autoSave,300); return;
  }
  // WINDSURF - THE GALE SPIRE: the Swiftstep charm - a QUICKER dash (faster recovery, not longer).
  if(b.dashgift){
    bumpStat('chests'); P.unlocked=P.unlocked||{}; P.story=P.story||{};
    shockwave(b.x,b.y,'rgba(180,230,255,0.9)',56); burst(b.x,b.y-0.5,'#bfe8ff',22,2.8); if(Snd.levelup) Snd.levelup();
    if(!P.unlocked.swiftstep){
      P.unlocked.swiftstep=true; P.story.galeDeepDone=1;
      if(typeof WORLDS!=='undefined'){ delete WORLDS.isle; delete WORLDS.wind; }   // drain restored Windsurf
      banner('THE SWIFTSTEP CHARM','QUICKER DASH - YOUR DODGE RECOVERS FASTER');
      setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>The Gale-Wraith unravels back into ordinary wind, and where its heart hung there drifts a charm of knotted stormcloth. It settles against your chest and the maddened gusts outside go slack.</i> <b style="color:#bfe8ff">Your dash recovers half again as fast</b> - <i>you can roll again far sooner. Windsurf can breathe again.</i>'); },500);
    } else { giveGold(rndi(120,180)); give('crystal',1); banner('THE EYE OF THE GALE','WIND-WORN COIN AND CRYSTAL'); }
    setTimeout(autoSave,300); return;
  }
  // SUNWARD - THE ASHEN FORGE: the Flame Snare - fire-fletched arrows root a foe.
  if(b.snaregift){
    bumpStat('chests'); P.spells=P.spells||{}; P.story=P.story||{};
    shockwave(b.x,b.y,'rgba(255,140,60,0.9)',56); burst(b.x,b.y-0.5,'#ff9a3c',22,2.8); if(Snd.levelup) Snd.levelup();
    if(!P.spells.flamesnare){
      P.spells.flamesnare=1; P.story.ashenForgeDone=1;
      if(typeof WORLDS!=='undefined'){ delete WORLDS.isle; delete WORLDS.east; }   // settle restored Sunward
      banner('THE FLAME-SNARE','FIRE-FLETCHED ARROWS ROOT A FOE');
      setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>In the forge\'s heart, cooling on the anvil where the Ash-Scorpion guarded it, a bead of black glass with a live coal trapped inside. It sinks warm into your quiver, and the volcano\'s fury eases off the isle above.</i> <b style="color:#ff9a3c">Your arrows now lay a FLAME SNARE</b> - <i>every shaft roots the foe it strikes in a snare of fire, held fast where it stands. Loose it with the bow ('+((typeof isTouch!=='undefined'&&isTouch)?'the bow slot':'press 2')+').</i>'); },500);
    } else { giveGold(rndi(120,180)); give('crystal',1); banner('THE ASHEN FORGE','EMBER-GLASS AND OLD COIN'); }
    setTimeout(autoSave,300); return;
  }
  // CLOUDREACH - THE STORM TEMPLE: the Stormstep - a double dash.
  if(b.dash2gift){
    bumpStat('chests'); P.unlocked=P.unlocked||{}; P.story=P.story||{};
    shockwave(b.x,b.y,'rgba(201,176,255,0.9)',56); burst(b.x,b.y-0.5,'#c9b0ff',22,2.8); if(Snd.levelup) Snd.levelup();
    if(!P.unlocked.dash2){
      P.unlocked.dash2=true; P.story.stormTempleDone=1;
      if(typeof WORLDS!=='undefined'){ delete WORLDS.isle; delete WORLDS.sky; }   // clear restored Cloudreach
      banner('THE STORMSTEP','DOUBLE DASH - CHAIN A SECOND DODGE');
      setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>The Stormheart gutters out, and the caged thunder pours into your legs like a second heartbeat. The temple\'s endless lightning stills to a clean, quiet sky.</i> <b style="color:#c9b0ff">Double Dash learned!</b> <i>Dash again in the instant after the first - two darts, quick as breath - to clear the widest gaps of all.</i>'); },500);
    } else { giveGold(rndi(120,180)); give('crystal',1); banner('THE STORMHEART','STORM-GLASS AND OLD COIN'); }
    setTimeout(autoSave,300); return;
  }
  // -- the tiered gathering-tool prizes (see 34-toolgates.js): a dungeon each --
  if(b.embergift){ bumpStat('chests');
    if((P.tools&&P.tools.pick||0)<4){ if(typeof grantEmberbreaker==='function') grantEmberbreaker(); }
    else { giveGold(rndi(120,180)); give('crystal',1); banner('THE FORGE-HOARD','EMBERSTONE AND OLD COIN'); }
    setTimeout(autoSave,300); return; }
  if(b.slaggift){ bumpStat('chests');
    if((P.tools&&P.tools.pick||0)<3){ if(typeof grantCograzor==='function') grantCograzor(); }
    else { giveGold(rndi(120,180)); give('ore',2); banner('THE MILL-HOARD','SLAGIRON AND OLD COIN'); }
    setTimeout(autoSave,300); return; }
  // -- the tiered gathering-tool prizes (see 34-toolgates.js): a dungeon each --
  if(b.axegift){ bumpStat('chests');
    if((P.tools&&P.tools.axe||0)<2){ if(typeof grantRivenedge==='function') grantRivenedge(); }
    else { giveGold(rndi(120,180)); give('hardwood',1); banner('THE WOODSMAN\'S HOARD','HEARTWOOD AND OLD COIN'); }
    setTimeout(autoSave,300); return; }
  if(b.pickgift){ bumpStat('chests');
    if((P.tools&&P.tools.pick||0)<2){ if(typeof grantCragbreaker==='function') grantCragbreaker(); }
    else { giveGold(rndi(120,180)); give('ore',2); banner('THE DELVER\'S HOARD','ORE AND OLD COIN'); }
    setTimeout(autoSave,300); return; }
  if(b.delvegift){ bumpStat('chests');   // the Undermaw's pickaxe - shatters Vath's wardstone
    if((P.tools&&P.tools.pick||0)<2){ if(typeof grantDelvebreaker==='function') grantDelvebreaker(); }
    else { giveGold(rndi(120,180)); give('ore',2); banner('THE MAW\'S DEEP HOARD','ORE AND OLD COIN'); }
    setTimeout(autoSave,300); return; }
  // EMBERWICK CAPSTONE - THE TIDEWARD VAULT: the founders' hoard, and the SEALING BOOK -
  // the one working the old line hid away, strong enough to bind Vath. You carry it to Jaist
  // (the woody/brother 'sealTome' scenes in 06-dialog.js), who reads and learns the seal.
  if(b.tidewardHoard){
    bumpStat('chests'); P.story=P.story||{};
    shockwave(b.x,b.y,'rgba(240,220,150,0.9)',64); burst(b.x,b.y-0.5,'#ffe9a8',26,3); if(Snd.levelup) Snd.levelup();
    giveGold(rndi(300,450)); give('crystal',2); give('pearl',1);
    P.story.sealTome=1; give('sealtome',1);
    banner('THE TIDEWARD VAULT','THE FOUNDERS’ SEALING WORK');
    setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>The Tideward Guardian sinks to its knees and is still, and the founders’ vault gives up its keeping: old crowned coin, ember-glass, a great pearl - and, laid open atop it all, a heavy book bound in tide-worn hide, its pages cut deep in the old royal script.</i> <i>You cannot read a word of it, but you know the weight of what it is - the founders raised their sentinel over this one working above every coin in the vault.</i> <b style="color:#ffe9a8">You take the Founders’ Sealing Book.</b> <i>This is the thing that could end Vath - not a blade, but a binding. Carry it to <b>Jaist</b>; only your brother can read the old hand, and only he could ever cast it.</i>'); },500);
    setTimeout(autoSave,300); return;
  }
  // THE RIMEFISSURE'S REWARD: the hush-frost spellbook the Rimebound was set to guard.
  // The princess cannot read the old royal script - she carries it up to her brother the
  // scholar (see the 'brother' scene in 06-dialog.js), who reads it into the WARDING VEIL.
  if(b.veiltome){
    bumpStat('chests');
    P.story=P.story||{};
    shockwave(b.x,b.y,'rgba(201,176,255,0.9)',56); burst(b.x,b.y-0.5,'#c9b0ff',20,2.7); if(Snd.magic) Snd.magic();
    if(P.story.vathVeil){
      // already cloaked from Vath - the book's warding is spent through you; a keepsake and some coin
      giveGold(rndi(120,180)); give('elixir',1);
      banner('THE HUSH-FROST SPELLBOOK','ITS WARDING IS ALREADY WOVEN THROUGH YOU');
      setTimeout(autoSave,300); return;
    }
    P.story.veilTome=1; give('veilrune',1);
    banner('A SECRET, KEPT IN ICE','THE HUSH-FROST SPELLBOOK');
    setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>Past the freed Rimebound, the melt lays bare an old iron coffer, and in it a <b>book bound in ice that will not thaw</b>, scored deep in the old royal script.</i> The kind your father made you both learn and only <b>Jaist</b> ever loved - you cannot read a word of it. <i>It is older than the cold, maybe older than the crown; the Rimebound was set to keep it here long before any living grief, and what its frost-pages actually DO you cannot begin to guess.</i> <b style="color:#c9b0ff">You take the Hush-Frost Spellbook.</b> <i>Carry it up out of the ice to your brother. If anyone alive can read it, it is Jaist.</i>'); },520);
    setTimeout(autoSave,300);
    return;
  }
  // THE DROWNED CATACOMB'S REWARD: the Tidefarer's verse, cut into a stone deep in the warden's
  // vault. This - not a coffer of coin - is what Jaist sent you down here to find. The princess
  // copies it off the wall to carry up to her brother the scholar, who reads the old royal script
  // (see the 'brother' scene in 06-dialog.js): the Act II clue that turns the isle-by-isle
  // freeing into a HUNT for the great queen's hidden grave and the sealing weapon in it.
  if(b.reachverse){
    bumpStat('chests');
    P.story=P.story||{};
    shockwave(b.x,b.y,'rgba(201,176,255,0.9)',56); burst(b.x,b.y-0.5,'#c9b0ff',20,2.7); if(Snd.levelup) Snd.levelup();
    if(P.story.reachProphecy){
      // already copied and carried up - the picked-over vault keeps only its old coin now
      giveGold(rndi(120,180)); if(Math.random()<0.5) give('potion',1);
      banner('THE DROWNED VAULT','PICKED CLEAN BUT FOR OLD COIN');
      setTimeout(autoSave,300); return;
    }
    P.story.reachProphecy=1; give('reachverse',1); giveGold(rndi(80,130));
    banner('THE DROWNED VERSE','THE THING THIS PLACE WAS HIDING');
    toast('You copied down the <b style="color:#c9b0ff">Drowned Verse</b> - old royal script you can\'t read. Carry it up to <b>Jaist</b>.',6000);
    setTimeout(autoSave,300);
    return;
  }
  if(b.sail){
    bumpStat('chests');
    P.story=P.story||{};
    shockwave(b.x,b.y,'rgba(200,225,255,0.9)',52); burst(b.x,b.y-0.5,'#dce8ff',18,2.6); Snd.levelup&&Snd.levelup();
    // Already sailing (an edge case - you only ever get surf FROM Nessa) - the old sail is salvage.
    if(P.unlocked && P.unlocked.surf){
      giveGold(60); give('elixir',1);
      toast('A fine old stormsail, but you\'ve a board that already flies. Rolled and stowed - it\'ll fetch a good price ashore.',5200);
      setTimeout(autoSave,300); return;
    }
    // You lift the sail, but a rolled sail is not a stepped sail: carry it UP to Nessa, who
    // steps it to your board (completeQuest('sail') -> grants the windsurf). The chest no longer
    // hands you the board or any coin - that was the "just gold" bug when the quest state slipped.
    P.story.haveSail=1;
    banner('NESSA\'S STORMSAIL','WHOLE AND DRY AFTER ALL THIS TIME');
    setTimeout(()=>toast('You lift <b style="color:#dce8ff">Nessa\'s stormsail</b> from the vault, whole and dry after all this time. <b>Carry it up to Nessa</b> at the Sailmaker\'s Loft - she\'ll step it to your board and see you off.',6800),600);
    setTimeout(autoSave,300);
    return;
  }
  if(b.mawTonics){
    bumpStat('chests');
    P.story=P.story||{}; P.story.undermawTonics=1;
    give('potion',3);
    banner('A CACHE OF TONICS','THREE EMBER TONICS');
    shockwave(b.x,b.y,'rgba(255,150,120,0.85)',44); burst(b.x,b.y-0.5,'#ff9a7a',16,2.4); Snd.levelup&&Snd.levelup();
    setTimeout(()=>toast('Three <b style="color:var(--ember)">Ember Tonics</b> stashed here for the last push - stow them for the Maw-Stalker.',5200),400);
    setTimeout(autoSave,300);
    return;
  }
  // OPTIONAL SIDE-BRANCH CACHES: the "get stuff" detour chests tucked off the main line of the
  // returned-isle spirit dungeons and the Drowned Catacomb. One per dungeon, themed loot, taken-state
  // persisted per id so a re-descent never re-hands it. Placed by each dungeon's gen side-branch.
  if(b.sideCache){
    bumpStat('chests');
    P.story=P.story||{}; P.story.sideCacheTaken=P.story.sideCacheTaken||{}; P.story.sideCacheTaken[b.sideCache]=1;
    giveGold(rndi(70,120)); give('elixir',1); give('potion',2);
    if(b.loot==='water') give('pearl',1);
    else if(b.loot==='mat'){ give('bar',1); give('ore',2); }
    else if(b.loot==='bone') giveGold(rndi(60,100));
    else give('crystal',1);   // fire / storm
    banner(b.title||'A HIDDEN CACHE', b.sub||'STOWED OFF THE MAIN WAY');
    shockwave(b.x,b.y,'rgba(255,215,106,0.85)',50); burst(b.x,b.y-0.5,'#ffd76a',18,2.6); Snd.levelup&&Snd.levelup();
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
  if(b.potions){
    const n=2+(Math.random()<0.5?1:0);
    give('potion',n); giveGold(rndi(10,24));
    if(Math.random()<0.3) give('elixir',1);
    banner('A CACHE OF TONICS', n+' EMBER TONIC'+(n>1?'S':''));
    shockwave(b.x,b.y,'rgba(255,150,120,0.85)',44); burst(b.x,b.y-0.5,'#ff9a7a',14,2.2); Snd.quest&&Snd.quest();
    setTimeout(autoSave,300); return;
  }
  // TOOL-GATE SIDE-CACHE: the reward walled behind an ironwood/basalt gate (35-toolgate-content.js)
  if(b.tgcache){
    const L=b.tgcache;
    if(L==='charm'){ give('charm',1); giveGold(rndi(40,70)); banner('AN OLD EMBER CHARM','+3 DAMAGE TO EVERY ATTACK'); }
    else if(L==='trove'){ giveGold(rndi(180,260)); give('crystal',2); give('pearl',1); banner('A HIDDEN TROVE','COIN, CRYSTAL, AND A PEARL'); }
    else if(L==='materials'){ give('hardwood',3); give('ore',3); give('bar',2); giveGold(rndi(30,60)); banner("A DELVER'S STASH",'HEARTWOOD, ORE, AND IRON BARS'); }
    else if(L==='elixirs'){ give('elixir',3); giveGold(rndi(30,60)); banner("A HEALER'S CACHE",'THREE ELIXIRS'); }
    else { giveGold(rndi(60,120)); give('potion',2); banner('A HIDDEN CACHE','COIN AND TONICS'); }
    shockwave(b.x,b.y,'rgba(240,220,150,0.85)',48); burst(b.x,b.y-0.5,'#ffe9a8',18,2.6); Snd.levelup&&Snd.levelup();
    setTimeout(autoSave,300); return;
  }
  // THE HOARFROST HOARD'S true prize: the chart that turns the isle-by-isle curse-lifting
  // into a HUNT - it names the great queen's hidden grave, and the sealing weapon that lies
  // with her. This is the "why" behind the whole Act II journey, handed to you on the ice.
  if(b.tidechart){
    bumpStat('chests');
    P.story=P.story||{}; P.story.tideChart=1;
    if(!(P.inv && P.inv.tidechart)) give('tidechart',1);
    giveGold(rndi(140,200)); if(Math.random()<0.6) give('elixir',1);
    shockwave(b.x,b.y,'rgba(150,205,235,0.9)',58); burst(b.x,b.y-0.5,'#bfe8ff',22,2.8); Snd.levelup&&Snd.levelup();
    banner("THE TIDEFARER'S CHART",'THE HUNT HAS A HEADING AT LAST');
    setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>Beneath the frozen coin of the Hoarfrost Hoard lies a thing worth more than all of it: a sea-chart, sealed in wax against the ice, its ink still bright after a hundred winters.</i> It marks an isle drawn on no chart you have ever seen - and upon that isle, a single grave. Beside it, a hand has inked in the old royal script: <b>HERE LIES THE TIDEFARER, AND WITH HER THE SEAL SHE FORGED.</b><br><br><i>So the drowned verse-stone told it true. The great queen who once sailed the isles free - curse by curse, exactly as you have - did not rest where the histories laid her. Her grave holds the one weapon named to bind the shadow: to bind <b>Vath</b>. This, at last, is what all the freeing has been FOR.</i><br><br>The old work is beyond you to read in full. <b style="color:var(--ember)">Carry the chart to Sage Orin on Emberwick</b> - if any living hand can place these hidden waters, it is his.', {label:'A heading at last'}); },500);
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

// The ferryman's warning on your first night on Barik: night is dangerous off
// Emberwick's sheltered shores - get behind a door, find the inn, take a bed.
function barikArrivalGreeting(){
  if(G.state!=='play' || (typeof dlg!=='undefined' && dlg.open)) return;
  dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='The Ferryman';
  const pg=document.getElementById('dportrait').getContext('2d');
  pg.fillStyle='#141a24'; pg.fillRect(0,0,72,72);
  pg.save(); pg.translate(36,64); pg.scale(1.3,1.3);
  if(typeof drawHumanoid==='function') drawHumanoid(pg,0,0,{skin:'#c98d5f',hair:'#6a5a44',beard:'#5a4a38',shirt:'#2e4a5e',pants:'#3a3229',hat:'straw',dir:{x:0,y:1},step:0});
  pg.restore();
  setDialog('<i>The ferryman makes fast to the Greyharbor pilings and claps the salt from his hands.</i> “Barik, then - and mind yourself. This is no Emberwick. Off these sheltered shores the dark brings things down off the crag, and folk with any sense are behind a bolted door by dusk.” <i>He nods up at the shuttered town.</i> “And night is already on us. Find the <b>inn</b> - the <b>Gull &amp; Anchor</b>, up past the well - and take a bed. Whatever is prowling out there will keep till morning.”',
    [{label:'I\'ll find a bed', cls:'gold', fn:closeDialog}]);
}
// The first time you drop out of the cloud onto Windsurf, Rell the harbormaster gapes at the
// impossible visitor - you can only get here on Ashwing's back, so the high wind is already
// calmed by now. What still keeps Windsurf cut off is the water: rough as ever, no hull dares it.
function windArrivalGreeting(){
  if(G.state!=='play' || (typeof dlg!=='undefined' && dlg.open)) return;
  dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='Rell the Harbormaster';
  const pc=document.getElementById('dportrait');
  if(pc){ const pg=pc.getContext('2d');
    pg.fillStyle='#141a24'; pg.fillRect(0,0,72,72);
    pg.save(); pg.translate(36,64); pg.scale(1.3,1.3);
    if(typeof drawHumanoid==='function') drawHumanoid(pg,0,0,{skin:'#a9784e',hair:'#2a2622',beard:'#2a2622',shirt:'#33566e',pants:'#2c3540',dir:{x:0,y:1},step:0});
    pg.restore(); }
  setDialog('<i>A weathered man on the docks shades his eyes at the sky and near drops his coil of rope as a DRAGON folds down over his harbour.</i> “…Well I\'ll be salted. That\'s Ashwing himself - and you rode him DOWN.” <i>He keeps glancing up at the great beast, plainly not believing it.</i> “Forty years on this dock and I never once saw a soul come in on the back of a living legend. The high wind\'s gone quiet at last - first calm sky in a season - but don\'t let that fool you. Our water\'s rough as it ever was, and no hull\'s dared the straits regardless. Nobody comes to Windsurf any more. And here you are, right out of the sky.” <i>He sticks out a calloused hand.</i> “Rell. Harbormaster of a harbor with no ships. Find me at the docks when you\'ve found your feet - there\'s a thing out past the reef I\'d give my last coin to see gone.”',
    [{label:'Glad to be down', cls:'gold', fn:closeDialog}]);
}
// A banker stands next to every town's inn (except Cloudreach, which has none) so
// gold and raw goods can be vaulted anywhere. Bree already keeps Barik's ledger;
// elsewhere we auto-place a Coinkeeper beside the building labelled "(Inn)".
function placeBankerByInn(){
  if(G.worldId==='sky' || (typeof inDungeon==='function' && inDungeon())) return;
  if((G.npcs||[]).some(n=>n.banker || n.id==='bree')) return;   // world already has a banker
  const inn=(G.decor||[]).find(b=>/\(inn\)/i.test(String(b.label||'')));
  if(!inn || typeof findOpenNear!=='function') return;
  let sp=null;
  for(const off of [[2,2],[-2,2],[2,-1],[-2,-1],[3,1],[-3,1],[0,3]]){
    const c=findOpenNear(Math.round(inn.x)+off[0], Math.round(inn.y)+off[1], 3);
    if(c){ sp=c; break; }
  }
  if(!sp) return;
  const b=makeNPC('banker_'+G.worldId,'Coinkeeper', sp[0], sp[1],
    {skin:'#caa27b',hair:'#4a3a2c',shirt:'#3a3a5a',pants:'#332c3c',apron:'#8a7a5a',hairstyle:'bun'},
    ['The vault holds what the grave cannot take - deposit while you breathe.',
     'Coin in your purse tempts the dark. Coin in my vault is only coin.'],0.4);
  b.banker=1; b.nightOwl=1; G.npcs.push(b);
}
function ensureGravelord(announce){
  if(G.worldId!=='isle' || qs('gravelord')!=='active') return;
  if(G.mobs.some(m=>m.kind==='gravelord' && !m.dead)) return;
  const m=spawnMob('gravelord', Math.round(ZONES.ruins.x), Math.round(ZONES.ruins.y));
  m.elite=true; m.ach='gravebane';
  if(announce) toast('A grave chill rises from the <b>Old Ruins</b> to the north...',5000);
}
/* ---------- sailing ---------- */
let sailing=false;
function departEarly(){
  if(sailing) return;
  sailing=true;
  toast('“Cast off! Barik, then - and luck to the bold.”',3000);
  Snd.splash();
  if(typeof playSailTransition==='function'){
    const title=(WORLD_DEFS.main && WORLD_DEFS.main.title) || '';
    playSailTransition(title, ()=>switchWorld('main'), ()=>{ sailing=false; });
    return;
  }
  const fade=document.getElementById('fadeOv');
  fade.style.opacity=1;
  setTimeout(()=>{ switchWorld('main'); fade.style.opacity=0; sailing=false; }, 900);
}
function attemptSail(){
  if(sailing) return;
  if(G.worldId==='isle'){
    if(qs('king')!=='done'){
      blockMsg('Captain Brant eyes the northern ruins. <b>"Strait\'s cursed while the Hollow Spirit stands. Fell him first."</b>');
      return;
    }
    if(qs('wreck')!=='done'){
      blockMsg('Captain Brant thumps the cracked hull. <b>"She won\'t swim till she\'s patched - bring me twelve wood and I\'ll mend her."</b> Speak with him here at the dock.');
      return;
    }
  }
  // Windsurf is walled off by the killing tide until you calm the strait - UNLESS Act II's
  // Warding Veil has opened the sea-roads home, in which case the ferry moored at the pier crosses
  // freely (the dragon at the harbour is only for flying up to the Cloudreach).
  if(G.worldId==='wind' && !(P.story && (P.story.tideCalm || (P.story.act2 && P.story.vathVeil)))){
    blockMsg('The strait past the breakwater churns like a cauldron - no hull could live in it, and you came down here by sail with no way back up. <b>Calm the water first</b> and the ferry can moor.');
    return;
  }
  // Stormreach is only reachable by sea, so its berth is always a ferry. But in
  // Act II the storm-coast opens stranded: the Barrow Brute's reef eats any hull
  // that launches, so there's no sailing at all until the Brute is down and the
  // port breathes again (P.story.reachBossDown). Beating Stormreach is the first
  // link of the Act II chain that unlocks the Frozen Isle (see boatMenu).
  if(G.worldId==='reach'){
    if(P.story && P.story.act2 && !P.story.reachBossDown){
      blockMsg('Your brother lays a hand on the bow-line and shakes his head. <b>"No boat outlives that reef while the Barrow Brute walks it, sister. Put the great brute down - then we sail."</b>');
      return;
    }
    boatMenu(); return;
  }
  // Act II: Vath holds the old world, so the ferry runs only the gated far-reach
  // routes - and, once the Warding Veil is earned, the old islands (never the
  // capital). boatMenu sorts out which destinations are open.
  if(P.story && P.story.act2){ boatMenu(); return; }
  // once the seas are calm, any boat is a ferry - pick a destination (Emberwick included:
  // by this point in the story its dock runs the full ferry like every other port)
  if(P.story && P.story.tideCalm){ boatMenu(); return; }
  // default single-hop routing before the archipelago reopens
  sailTo(G.worldId==='east' ? 'main' : G.worldId==='isle' ? 'main' : 'isle');
}
function sailTo(dest, msg){
  if(sailing) return; sailing=true;
  Snd.splash();
  if(msg) toast(msg,3000);
  // The boat vignette (js/42-sail-transition.js) hides the world swap under a
  // brief sailing loading screen; if it isn't loaded, fall back to the old fade.
  if(typeof playSailTransition==='function'){
    const title=(WORLD_DEFS[dest] && WORLD_DEFS[dest].title) || '';
    playSailTransition(title, ()=>switchWorld(dest), ()=>{ sailing=false; });
    return;
  }
  const fade=document.getElementById('fadeOv'); if(fade) fade.style.opacity=1;
  setTimeout(()=>{ switchWorld(dest); setTimeout(()=>{ if(fade) fade.style.opacity=0; sailing=false; },100); },780);
}
function boatMenu(){
  // once the seas are calm every dock is a ferry hub, but WHERE it will carry you
  // depends on the act. In Act I: the settled routes and the capital. In Act II
  // Vath holds the old world, so the ferry runs a GATED chain - Stormreach, then
  // the Frozen Isle (once the Barrow Brute falls), then the Aerie - and only the
  // Warding Veil steals you back to the old islands. Never the capital.
  const A2       = !!(P.story && P.story.act2);
  const beatReach= !!(P.story && P.story.reachBossDown);  // Barrow Brute down - Stormreach is a port again
  const frostWon = !!(P.story && P.story.frostFreed);     // Weeping Warden freed - the Frozen Isle is done
  const veil     = !!(P.story && P.story.vathVeil);       // the Warding Veil cloaks you from Vath's eye
  let all;
  if(!A2){
    // ACT I: the settled routes and the capital. The far reaches - Stormreach, the
    // Aerie, the Frozen strait - stay closed to any ferryman until Act II.
    all=[['Sail home to Barik','main'],['Sail to the Sunward Isle','east'],
         ['Sail to Windsurf Isle','wind'],['Sail to Aldermere, the Capital','crown']];
  } else {
    all=[['Sail to Stormreach','reach']];                          // the storm-coast hub, where the prince holds the boat
    if(beatReach) all.push(['Sail to the Frozen Isle','frost']);   // the Brute's fall thaws the strait north
    if(frostWon)  all.push(['Sail to the Aerie Isle','aerie']);    // the last far reach opens once the Frozen Isle is won
    if(veil) all.push(['Sail to Barik','main'],['Sail to the Sunward Isle','east'],
                      ['Sail to Windsurf Isle','wind'],['Slip back to Emberwick','isle']);
    // the capital stays shut all through Act II - until Jaist learns the founders' seal and
    // it is time for the reckoning. Then, and only then, the ferry will run to Aldermere.
    if(P.story && P.story.sealLearned) all.push(['Sail to Aldermere — the reckoning','crown']);
  }
  const dests=all.filter(([lbl,dst])=>dst!==G.worldId);
  dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='The Ferry';
  const pg=document.getElementById('dportrait').getContext('2d');
  pg.fillStyle='#20160c'; pg.fillRect(0,0,72,72);
  pg.fillStyle='#8f6a3e'; pg.beginPath(); pg.moveTo(12,44); pg.quadraticCurveTo(36,60,60,44); pg.lineTo(52,38); pg.quadraticCurveTo(36,48,20,38); pg.closePath(); pg.fill();
  pg.strokeStyle='#4f3a24'; pg.lineWidth=3; pg.beginPath(); pg.moveTo(36,38); pg.lineTo(36,14); pg.stroke();
  pg.fillStyle='#e8e0d0'; pg.beginPath(); pg.moveTo(36,16); pg.quadraticCurveTo(50,22,36,34); pg.closePath(); pg.fill();
  const sealed = !!(P.story && P.story.sealLearned);
  const line = !A2
    ? '“Calm seas on the settled routes now, friend, and a clear run to the capital. The far reaches - Stormreach, the Aerie, the Frozen strait - no ferryman will chance those yet. Where to?”'
    : sealed
      ? '“So it\'s Aldermere at last... aye, I\'ll take you, though the water off the capital\'s gone black as pitch and every gull\'s fled it. Whatever you mean to do there - do it. Where to?”'
    : veil
      ? '“The Veil\'s on you, friend - Vath\'s eye slides right past. The old isles are open to us again... all but the capital. Never the capital. Where to?”'
      : beatReach
        ? '“The Brute\'s down and the reef\'s gone quiet - the strait north to the Frozen Isle runs clear at last. Where to?”'
        : '“Storm\'s eased enough for a short hop, friend. Where to?”';
  setDialog(line,
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
  P.bossCheck=null;   // a boss respawn point belongs to the run that set it - leaving the world clears it
  G._flying=0; G._flyUntil=0;   // arriving anywhere clears the in-flight lock, so a throw mid-flight can never strand the dragon/parachute
  snapshotWorld();
  G.projs.length=0; G.parts.length=0; G.floats.length=0; G.fogs.length=0; G.fireflies.length=0;
  const def=WORLD_DEFS[id];
  MAPW=def.W; MAPH=def.H; SEED=def.seed; ZONES=def.zones;
  // Wave / puzzle / trap dungeons reset fresh on every visit until they are BEATEN: otherwise a
  // cached copy from an earlier descent (waves already killed, gates already open, traps sprung)
  // shows up empty on re-entry. Skip the cache and regenerate a fresh challenge until it's won.
  const FRESH_UNTIL_WON={ milldeep:'millDone', frostvault:'vaultDone', reachdeep:'tombBossDown', undermaw:'undermawDown', barikdeep:'barikDeepDone', winddeep:'galeDeepDone', sunwarddeep:'ashenForgeDone', skydeep:'stormTempleDone', embertomb:'tidewardDone' };
  const _fw=FRESH_UNTIL_WON[id];
  if(_fw && !(P.story && P.story[_fw])) delete WORLDS[id];
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
    // seed the tiered-tool gates & side-caches for this freshly-generated world,
    // skipping any already felled/looted (persisted in P.story.tg). See 35-toolgate-content.js
    if(typeof placeToolgates==='function') placeToolgates(id);
    // a farm & farmer you can work with on every overworld isle (36-island-farms.js)
    if(typeof placeIslandFarms==='function') placeIslandFarms(id);
    // Vath's wardstone ring around Hedda's steading on Barik (41-barik-ward.js) - after
    // the farms so Hedda already exists to box in; self-verifies or bails, never soft-locks.
    if(typeof placeBarikWard==='function') placeBarikWard(id);
    if(typeof placeDungeonHideaways==='function') placeDungeonHideaways(id);
  }
  G.worldId=id;
  // a dungeon's genXAll() built the shared mapBase while G.worldId still named the PREVIOUS
  // world, mislabelling it - so the big map read all-gray on return. Force a correct rebuild.
  if(typeof invalidateMapBase==='function') invalidateMapBase();
  if(typeof syncMapUI==='function') syncMapUI();   // seal/unseal minimap+map for cloud worlds at once
  P.x=def.spawn.x; P.y=def.spawn.y; P.dir={x:1,y:0}; P.fishing=null;
  // Arriving on an isle should not pop a DISCOVERED banner for the spot you land on -
  // quietly mark the landing zone found so only zones you actively explore announce.
  P.disc=P.disc||{};
  for(const zk in ZONES){ const z=ZONES[zk];
    if(z && z.name && dist(def.spawn.x,def.spawn.y,z.x,z.y) < (z.r||6)+2) P.disc[id+':'+zk]=1; }
  if(id==='main' && prevWorld==='east'){
    // sailing home from the Sunward Isle lands you back at Captain Corvo's cove
    // (his sloop, far south-east), not Greyharbor's dock clear across the map
    const sp=findOpenNear(330,244,10) || [330,244];
    P.x=sp[0]+0.5; P.y=sp[1]+0.5; P.dir={x:-1,y:0};
  }
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  if(id==='main') award('globetrotter');
  // THE RECKONING: sailing into the fallen capital for the final confrontation with Vath.
  if(id==='crown' && crownReckoning()){
    if(typeof banner==='function') banner('ALDERMERE','THE THRONE VATH STOLE');
    setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>The ferryman will not put in past the quay. Aldermere stands dead ahead - and it IS dead: the watch-fires cold, the wall unmanned, not a guard nor a soul on the long streets. A violet stain has crept out from the palace and soaked the whole city through, and the nearer the throne, the more the stone seems to <b>breathe</b>.</i> <b style="color:#c9a0ff">Vath is on the throne. Your father is nowhere.</b> <i>Climb to the palace. Keep him off Jaist long enough for your brother to speak the seal to its end.</i>'); }, 900);
  }
  // Act IV: coming back to Emberwick with the last hunt underway - make sure Vath
  // is on the green if you'd already drawn him out and left mid-fight.
  if(id==='isle' && typeof ensureFinalVath==='function') ensureFinalVath();
  // Act II capstone: the Tideward Crypt mouth opens once all four returned-isle gifts are
  // in hand. Run on EVERY isle entry (Emberwick is cached, so a fresh regen may never fire
  // after the last gift lands) - placeEmberTomb self-guards against double-placing.
  if(id==='isle' && typeof placeEmberTomb==='function') placeEmberTomb();
  // Act I side-work is suppressed once Act II opens - Barik's story has moved on (the Duchess
  // chain below is the one exception, left armed on purpose).
  if(id==='main' && !P.quests.mossbrew && !(P.story&&P.story.act2)) P.quests.mossbrew='avail';
  if(id==='main' && !P.quests.pearlq && qs('fish')==='done' && !(P.story&&P.story.act2)) P.quests.pearlq='avail';
  // Act II: under the Veil, Barik lies flooded until the Drowned Vault is cleared - Warden Kell's
  // restoration plea (offered only while the flood stands).
  if(id==='main' && P.story && P.story.vathVeil && !P.story.barikDeepDone && qs('barikRestore')!=='done' && !P.quests.barikRestore) P.quests.barikRestore='avail';
  if(id==='main' && typeof updateBarikCurseMood==='function') updateBarikCurseMood();
  if(id==='main' && typeof shelterBarikFolk==='function') shelterBarikFolk();   // storm-refuge: townsfolk huddle at the keep, Kell holds the landing
  if(id==='main'){
    if(!(P.story&&P.story.act2)) for(const q2 of ['welcome2','hedda1','torv1','ivo1','ribbon1']) if(!P.quests[q2] && QUESTS[q2]) P.quests[q2]='avail';
    if(P.earlySail && !P.earlyKit){
      P.earlyKit=1;
      P.kit=true;
      P.unlocked.melee=true; P.unlocked.bow=true; P.unlocked.parry=true; P.unlocked.dash=true;
      P.maxArrows=P.maxArrows||20; P.arrows=P.maxArrows;
      P.swordTier=Math.max(P.swordTier||0,2);
      P.armorOwn=Math.max(P.armorOwn||0,2); P.armor=Math.max(P.armor||0,2);
      giveQuiet('potion',3); giveQuiet('bread',2); P.gold+=50;
      buildHotbar(); refreshUI();
      setTimeout(()=>{
        toast('Brant claps your shoulder on the gangway. <b>“I can\'t have you walking around unprepared, so here”</b> - steel sword, yew bow, plate, tools, tonics, and fifty gold press into your arms - and a word from old Rask on how to turn a blade aside. <b>“The isle\'s lessons, minus the homework. Don\'t make me regret the shortcut.”</b>',9000);
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
    // First landing on the wild shores: night here (Emberwick's endless day is behind
    // you), and the ferryman warns you to get behind a door - go find an inn.
    if(prevWorld==='isle' && !(P.prog&&P.prog.barikArrived)){
      P.prog=P.prog||{}; P.prog.barikArrived=1;
      G.dayT=0.70;   // arrive at night
      setTimeout(()=>{ if(typeof barikArrivalGreeting==='function') barikArrivalGreeting(); }, 1000);
    }
  }
  if(id==='main' && !P.quests.bounty && !(P.story&&P.story.act2)){ P.quests.bounty='avail'; }   // Act I: Warden Kell's work; suppressed in Act II
  // the Duchess's letter-errand waits at the keep; carry it on your first trip east. This is the
  // ONE Act I quest that carries into Act II - left ungated on purpose.
  if(id==='main' && !P.quests.duchesslove && !(P.story&&P.story.duchessWed)) P.quests.duchesslove='avail';
  if(id==='east' && !(P.story&&P.story.act2)) for(const q3 of ['hunt1','wyrm']) if(!P.quests[q3] && QUESTS[q3]) P.quests[q3]='avail';
  // Act II: the Sunward Isle burns until the Ashen Forge is quenched - Elder Moli's restoration plea
  if(id==='east' && P.story && P.story.vathVeil && !P.story.ashenForgeDone && qs('sunRestore')!=='done' && !P.quests.sunRestore) P.quests.sunRestore='avail';
  if(id==='east' && typeof updateSunCurseMood==='function') updateSunCurseMood();
  if(id==='east'){
    // Vath leaves the Sunward village for good once the wyrm quest is behind you; he
    // does NOT reappear as a grove mob (the dragon-freeing no longer starts a hunt).
    if(P.mageHuntStarted || qs('wyrm')==='done'){ const vi=G.npcs.findIndex(n=>n.id==='vath'); if(vi>=0) G.npcs.splice(vi,1); }
  }
  if(id==='wind'){
    const hasBoard = !!(P.unlocked && P.unlocked.surf);
    const wA2 = !!(P.story && P.story.act2);
    // Act I: you must earn a windsurf before Rell will send you at the Leviathan - the beast lives
    // on the water, past the reach of any jetty. Tolen shapes boards. All suppressed in Act II.
    if(!hasBoard && qs('board')!=='done' && !P.quests.board && !wA2) P.quests.board='avail';
    if(hasBoard && qs('tide')!=='done' && !P.quests.tide && !wA2) P.quests.tide='avail';
    // once the strait is calm, Coralie can finally reopen the Breakers properly
    if(P.story && P.story.tideCalm && qs('breakers')!=='done' && !P.quests.breakers && !wA2) P.quests.breakers='avail';
    if(P.story && P.story.tideCalm) updateWindFolkMood();
    // Act II: Windsurf lies half-drowned until the Gale Spire is cleared - Rell's restoration plea.
    // Runs AFTER updateWindFolkMood so the curse/restore lines win over the Act I tideCalm mood.
    if(P.story && P.story.vathVeil && !P.story.galeDeepDone && qs('windRestore')!=='done' && !P.quests.windRestore) P.quests.windRestore='avail';
    if(typeof updateWindCurseMood==='function') updateWindCurseMood();
    if(!P.prog.windSeen){ P.prog.windSeen=1; }
    // First drop out of the cloud (you can only reach Windsurf via The Leap): Rell greets
    // the impossible visitor. Fires once, after the arrival fade/banner has settled.
    if(prevWorld==='sky' && !P.prog.windGreeted){
      P.prog.windGreeted=1;
      setTimeout(()=>{ if(typeof windArrivalGreeting==='function') windArrivalGreeting(); }, 1200);
    }
  }
  if(id==='aerie'){
    if(qs('roost')!=='done' && !P.quests.roost) P.quests.roost='avail';
    if(!P.prog.aerieSeen){ P.prog.aerieSeen=1; }
  }
  if(id==='frost'){
    if(qs('thaw')!=='done' && !P.quests.thaw) P.quests.thaw='avail';
    // Bryn will name the Hoarfrost Bear from your first day on the ice; Sigrid's
    // Rimebound hunt only opens once the bear's den (the Glacier Vault) is breached.
    if(qs('hoarfrost')!=='done' && !P.quests.hoarfrost) P.quests.hoarfrost='avail';
    if(P.story && P.story.iceBearDown && qs('rimebound')!=='done' && !P.quests.rimebound) P.quests.rimebound='avail';
    if(P.story && P.story.frostFreed) updateFrostFolkMood();
    if(!P.prog.frostSeen){ P.prog.frostSeen=1; }
  }
  if(id==='sky'){
    // The Rainbow Road is the way DOWN off the Cloudreach: run it, calm the sky, and
    // the wind bears you to Windsurf. Point first-timers at the bird so it isn't missed.
    if(!(P.story && (P.story.birdQuest || P.story.skyDungeonDone || P.story.parachute)))
      setTimeout(()=>toast('A stormtossed <b>Wind-Lost Bird</b> frets by the landing. The high wind is soured, and it is the only road down from here - hear her out and run her <b>rainbow road</b> to calm the sky.',7600),1200);
    // Act II: the Cloudreach is stormbound until the Storm Temple is cleared - Aeron's restoration plea
    if(P.story && P.story.vathVeil && !P.story.stormTempleDone && qs('skyRestore')!=='done' && !P.quests.skyRestore) P.quests.skyRestore='avail';
    if(typeof updateSkyCurseMood==='function') updateSkyCurseMood();
  }
  if(id==='reach'){
    // the castaways' two tormentors: the Brute on the barrow road (Mora) and the
    // Drowned Minotaur in the catacomb below (Tibb).
    if(qs('barrowbrute')!=='done' && !P.quests.barrowbrute) P.quests.barrowbrute='avail';
    // Tibb's Act I catacomb bounty; under the Veil the same descent is reframed as Mora's Act II
    // restoration (reachRestore) below, so don't freshly re-offer this one in Act II.
    if(!(P.story&&P.story.vathVeil) && qs('drownedwarden')!=='done' && !P.quests.drownedwarden) P.quests.drownedwarden='avail';
    // Act II: under the Veil, Stormreach's storm never breaks and the surge drowns the coast until
    // the catacomb warden is felled - Mora's restoration plea (offered only while the surge stands).
    if(P.story && P.story.vathVeil && !P.story.tombBossDown && qs('reachRestore')!=='done' && !P.quests.reachRestore) P.quests.reachRestore='avail';
    if(typeof updateReachCurseMood==='function') updateReachCurseMood();
  }
  // Dungeons keep their mystery, but a single atmospheric hint on first entry
  // points the way without solving anything - a compass, not a walkthrough.
  if(id==='frostdeep' && !P.prog.deepSeen && !(P.story && P.story.deepDone)){ P.prog.deepSeen=1;
    setTimeout(()=>banner('THE RIMEFISSURE','RIDE THE DRIFTING FLOES ACROSS THE BLACK WATER'),1200);
    setTimeout(()=>toast('<i>The warren has flooded into a channel of freezing black water.</i> Cross it on the sliding <b>drift-ice floes</b>: <b>board a floe</b> as it drifts to your ledge, ride it, and <b>step to the next floe</b> (or the far ledge) when they line up. The floe-ice is <b>slick - your steps carry momentum</b>, so time each hop and don\'t over-run it. Fall in and the cold flings you back to the landing to try again.',9000),1800); }
  if(id==='eastdeep' && !P.prog.emberSeen && !(P.story && P.story.emberDone)){ P.prog.emberSeen=1;
    setTimeout(()=>banner('THE EMBERDEEP','DASH THE TURNING SLABS ACROSS THE PIT'),1200);
    setTimeout(()=>toast('<i>Bottomless fire-pits bar the fire-heart.</i> They are spanned only by <b>turning basalt slabs</b> and <b>floating stone isles</b>, with open pit between every ledge and slab - so you must <b>DASH</b> (tap <b>Ctrl</b> or <b>L</b> / the dodge button) to board a slab or hop an isle, ride the turning ones round, then dash off to the next. Miss and you fall into the pit and climb back out singed (<b>-5 HP</b>), starting the crossing over. One chamber is barred by a gate with a <b>fire-lever</b>; the last, deepest chamber is a wide isle-field where <b>cave bats</b> swoop from the tunnels to shove you into the dark - cut them down or weave past, and press on to Ashwing.',9500),1800); }
  if(id==='reachdeep' && !P.prog.tombSeen && !(P.story && P.story.tombBossDown)){ P.prog.tombSeen=1;
    setTimeout(()=>banner('THE DROWNED CATACOMB','FOLLOW THE BONEWRIGHT - TREAD THE WARD-DANCE TRUE'),1200);
    setTimeout(()=>toast('<i>The Ossuary is a lock, and the key is a dance.</i> In each chamber a <b>spectral bonewright rises and treads the floor-stones in a set order</b> - <b>watch the pattern</b>, then <b>walk the same stones in the same sequence</b> to spring the ward-gate open. A <b>wrong stone</b> looses a bone-green ward-jolt (a little blood, no restart) and shows you the dance again, so take your time and read it. <b>Follow the pattern true in all three chambers</b> and the <b>Bone Gate</b> grinds up onto the Drowned Vault.',9500),1800); }
  if(id==='aeriedeep' && !P.prog.underSeen && !(P.story && P.story.aerieFreed)){ P.prog.underSeen=1;
    setTimeout(()=>banner('THE UNDERCLIMB','WEAVE THE MAZE - TIME THE WARD-LANCES'),1200);
    setTimeout(()=>toast('<i>Each chamber is a maze of solid stone, its corridors snaking north.</i> Weave it, and time the <b>ward-lances</b> that sweep each corridor: watch the telegraph and slip across only while a lance is <b>dark</b>. <b>Touch a lit lance and you die</b> - you wake at the hall\'s mouth with <b>5 less HP</b> and the crossing to redo. Reach the far side and the gate grinds up. <b>The curse seals the climb until you put down the Tome-Warden below.</b>',9500),1800); }
  if(id==='frostvault' && !P.prog.vaultSeen){ P.prog.vaultSeen=1;
    setTimeout(()=>banner('THE GLACIER VAULT','THREE HALLS OF ICE-BEASTS - FIGHT YOUR WAY DOWN'),1200);
    setTimeout(()=>toast('<i>The bear was only the doorkeeper.</i> Each hall is a killing-floor: step in and a <b>gate slams shut behind you</b>, sealing you in as the <b>ice-beasts come in waves</b>, one lot after the next. <b>Clear every wave</b> and both gates grind up, opening the way on. Survive all three halls to reach the <b>Hoarfrost Hoard</b>.',9000),1800); }
  if(id==='milldeep' && !P.prog.millSeen && !(P.story && P.story.millDone)){ P.prog.millSeen=1;
    setTimeout(()=>banner('THE UNDERMILL','WORK THE SLUICES - FOUR DROWNED HALLS'),1200);
    setTimeout(()=>toast('<i>The works have drowned - FOUR halls stand flooded, walled off by deep water, no way through by default.</i> <b>Turn the sluice valves</b> to drain the water-walls. The first two halls are <b>combination</b> locks: each valve is coupled to two doorways, so <b>find the states</b> that open a doorway in every wall at once. In the two deeper halls each valve drains its own stretch - just <b>turn them all</b>. Weave north, hall after hall, to the thing that fouls the works.',10000),1800); }
  if(id==='undermaw' && !P.prog.mawSeen){ P.prog.mawSeen=1;
    if(!(P.story && P.story.undermawDown)) setTimeout(()=>toast('<i>The dark ahead breathes - something dens here, and a stone door stands shut past it.</i> <b>Put the beast down</b> and the Hoard Door will grind open.',6800),1400); }
  if(id==='crown'){
    // the King grants an audience once you've broken at least one of Vath's
    // curses on the isles (vathMet) - the herald offers it in the plaza.
    if(P.story && P.story.vathMet && !(P.story.act>=3) && !P.quests.audience) P.quests.audience='avail';
    // the palace gate is guarded; the kitchen-run delivery is how you earn the
    // run of the gate. Available from your first day in the capital.
    if(qs('kitchenrun')!=='done' && !P.quests.kitchenrun && !(P.story&&P.story.kingTold)) P.quests.kitchenrun='avail';
    if(qs('lettuce')!=='done' && !P.quests.lettuce) P.quests.lettuce='avail';
    // capital side-work: the gardener, the factor, and the garrison captain
    if(qs('roses')!=='done' && !P.quests.roses) P.quests.roses='avail';
    if(qs('larder')!=='done' && !P.quests.larder) P.quests.larder='avail';
    if(qs('garrison')!=='done' && !P.quests.garrison) P.quests.garrison='avail';
    if(P.story && P.story.kingTold) updateCrownFolkMood();
    if(!P.prog.crownSeen){ P.prog.crownSeen=1; }
  }
  // DIALOGUE has the final word: overlay every NPC's chatter (and story-state mood)
  // from js/00-dialogue.js, after the built-in mood updaters above. See that file to
  // edit any spoken line by hand.
  if(typeof applyIdleDialogue==='function') applyIdleDialogue();
  if(typeof placeBankerByInn==='function') placeBankerByInn();   // a banker by the inn, on every town that has one
  Snd.quest();   // arrival chime (island-name intro banner removed by request)
  updateQuestUI(); refreshUI();
  setTimeout(autoSave,400);
}

/* ---------- dodge roll ---------- */
function tryRoll(){
  if(P.dead || G.state!=='play' || dlg.open || G.interior || (P.stunT||0)>0) return;
  if(!(P.unlocked && P.unlocked.dash)){
    // dash is taught by a mage-tower's scrying orb - nudge the player there
    if(!P._dashNagT || G.time>P._dashNagT){ P._dashNagT=G.time+4;
      toastErr('You have no trained footwork yet - a <b>mage tower’s orb</b> teaches the <b>dash</b>.',3600); }
    return;
  }
  if((P.rollT||0)>0) return;
  if((P.rollCd||0)>0){
    // double dash (Moss's quickroot): one chained roll inside the cooldown window
    if(!(P.unlocked&&P.unlocked.dash2) || P.dashChain) return;
    P.dashChain=1;
  } else P.dashChain=0;
  // the Gale Spire's Swiftstep charm (P.unlocked.swiftstep) quickens your FOOTING, not your
  // reach: the dash recovers faster, so you can roll again sooner. The reach itself is fixed
  // (no more half-again dash), so no gap anywhere depends on it.
  // PERFECT DODGE: rolling at the last instant before a blow lands rewards the read -
  // a flash of slow-mo, a refunded cooldown, and a RIPOSTE that empowers your next strike.
  let imminent=false;
  for(const m of G.mobs){ if(m.dead||m.sealed) continue;
    const md=dist(P.x,P.y,m.x,m.y);
    if((m.windup||0)>0 && (m.windup||0)<0.22 && md<2.3){ imminent=true; break; }
    if((m.lunge||0)>0 && md<2.5){ imminent=true; break; }
  }
  if(!imminent && G.projs){ for(const p of G.projs){ if(p.from==='mob' && dist(P.x,P.y,p.x,p.y)<1.7){ imminent=true; break; } } }
  P.rollT=0.26; P.rollMax=P.rollT; P.rollCd=(P.unlocked&&P.unlocked.swiftstep)?0.62:1.0; buzz(9);
  Snd.noise(0.16,0.05,600,0.7);
  if(imminent){
    P.empower=1; P.empowerT=3;
    G.slowmo=Math.max(G.slowmo||0, 0.3);
    P.rollCd=Math.min(P.rollCd, (P.unlocked&&P.unlocked.swiftstep)?0.3:0.5);   // reward: roll again sooner
    addFloat('PERFECT!', P.x, P.y-2.4, '#bfe8ff', 1.4);
    if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(191,232,255,0.85)',30);
    if(Snd.crit) Snd.crit();
    buzz(18);
  }
  for(let i=0;i<6;i++) G.parts.push({x:P.x+rnd(-0.3,0.3),y:P.y+rnd(-0.3,0.3),
    vx:-P.dir.x*rnd(0.5,1.2),vy:-P.dir.y*rnd(0.5,1.2),life:0.35,color:'rgba(200,190,160,0.6)',size:2.6});
}

