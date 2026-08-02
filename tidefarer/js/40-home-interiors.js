"use strict";
/* =====================================================================
   HOME INTERIORS - themed homes, findable loot, extra furniture art
   ---------------------------------------------------------------------
   Ordinary house/house2 interiors used to be a bare box with a fixed
   handful of props, so every villager's home read the same. This layer
   gives each GENERIC home (one with no bespoke lore of its own) a
   deterministic THEME - fisherfolk, herbalist, weaver, hoarder, scholar,
   baker, retired sailor, potter - that picks its wall/floor mood, its
   furniture set, and what you turn up when you search the place. It also
   carries the new searchable furniture (chest, urn, drawers, cupboard,
   sack, loom, herb-table) plus the weighted loot tables and one-time
   caches those pieces draw from. Everything is stateless/deterministic
   off the building's map coords, so a home looks and loots the same each
   time you step in (bar the one-time chest, which persists in P.prog).
   ===================================================================== */

/* ---------- loot tables: weighted draws for a search ---------- */
/* entry: {w, gold:[lo,hi]} | {w, item, n:[lo,hi], msg} | {w, empty:true, msg} */
const HOME_LOOT = {
  fisher: [
    {w:26, item:'fish',       n:[1,2], msg:'A salted <b>fish</b>, tucked away for lean days.'},
    {w:18, item:'cookedfish', n:[1,1], msg:'A parcel of <b>smoked fish</b> in oilcloth.'},
    {w:14, item:'shell',      n:[1,2], msg:'A handful of <b>spiral shells</b> saved off the beach.'},
    {w:14, gold:[3,9]},
    {w:5,  item:'pearl',      n:[1,1], msg:'A <b>pearl</b> the fisher never sold - your luck, not theirs.'},
    {w:23, empty:true, msg:'Netting, cork floats, and the honest reek of brine.'},
  ],
  herb: [
    {w:26, item:'mushroom', n:[1,2], msg:'Dried <b>bluecaps</b> strung on a thread.'},
    {w:20, item:'seed',     n:[2,3], msg:'Little twists of paper - <b>seeds</b>, each labelled.'},
    {w:16, item:'apple',    n:[1,2], msg:'A couple of stored <b>apples</b>, still sound.'},
    {w:8,  item:'potion',   n:[1,1], msg:'A stoppered <b>tonic</b>, brewed and forgotten.'},
    {w:30, empty:true, msg:'Bundles of thyme and sage. Fragrant, but nothing to take.'},
  ],
  cloth: [
    {w:22, item:'silk',  n:[1,1], msg:'A folded length of <b>sea-silk</b>, saved for a fine order.'},
    {w:18, item:'wheat', n:[1,2], msg:'A heel of <b>bread-grain</b> kept by the loom.'},
    {w:16, gold:[4,11]},
    {w:12, item:'wood',  n:[1,1], msg:'Spare <b>spindles and dowel</b>.'},
    {w:32, empty:true, msg:'Off-cuts and loose thread. Pretty, but worthless.'},
  ],
  craft: [
    {w:24, item:'stone', n:[1,2], msg:'Rough <b>clay-stone</b>, kept for the wheel.'},
    {w:18, item:'ore',   n:[1,1], msg:'A lump of <b>iron ore</b> set aside.'},
    {w:16, gold:[3,10]},
    {w:6,  item:'bar',   n:[1,1], msg:'An old stamped <b>iron bar</b> - a curio worth good coin.'},
    {w:30, empty:true, msg:'Grit, glaze-dust, and a cracked mug.'},
  ],
  food: [
    {w:24, item:'bread',      n:[1,1], msg:'A fresh <b>loaf</b>, still faintly warm.'},
    {w:18, item:'apple',      n:[1,2], msg:'A few <b>apples</b> from the barrel.'},
    {w:16, item:'wheat',      n:[1,2], msg:'A scoop of <b>grain</b>.'},
    {w:12, item:'cookedfish', n:[1,1], msg:'A wrapped <b>cooked fish</b>.'},
    {w:26, empty:true, msg:'Crumbs and an empty crock.'},
  ],
  grain: [
    {w:34, item:'wheat', n:[2,3], msg:'You scoop <b>grain</b> from the open sack.'},
    {w:22, item:'seed',  n:[1,2], msg:'Loose <b>seed</b> mixed through the grain.'},
    {w:24, empty:true, msg:'Chaff and mouse-leavings. Nothing worth keeping.'},
  ],
  coin: [
    {w:40, gold:[3,10]},
    {w:14, gold:[10,22]},
    {w:10, item:'pearl', n:[1,1], msg:'A <b>pearl</b> squirrelled away in the bottom.'},
    {w:36, empty:true, msg:'Lint, a bent pin, and no coin at all.'},
  ],
  lore: [
    {w:26, item:'page',   n:[1,1], msg:'A loose <b>lore page</b> slipped from a binding.'},
    {w:16, gold:[4,12]},
    {w:8,  item:'potion', n:[1,1], msg:'A study-tonic, corked and dusty.'},
    {w:34, empty:true, msg:'Ink-pots, quills, and margins full of cramped notes.'},
  ],
  /* the rare good stash a secret compartment gives up */
  fine: [
    {w:24, item:'pearl',   n:[1,1], msg:'Hidden away: a lustrous <b>pearl</b>.'},
    {w:22, item:'bar',     n:[1,1], msg:'Hidden away: a stamped <b>iron bar</b>.'},
    {w:18, item:'crystal', n:[1,1], msg:'Hidden away: a warm <b>ember crystal</b>.'},
    {w:16, item:'elixir',  n:[1,1], msg:'Hidden away: a <b>greater tonic</b>.'},
    {w:20, gold:[15,40]},
  ],
};
/* one-time locked-chest hauls, flavoured per theme (falls back to generic) */
const HOME_CHEST = {
  fisher:  {gold:[30,70], items:[['pearl',1],['cookedfish',2]], line:'The sea-chest holds a fisher’s hoard: <b>a pearl</b>, smoked fish, and a purse of coin.'},
  hoarder: {gold:[60,120], items:[['bar',1],['crystal',1],['potion',1]], line:'The hoarder’s locked chest was worth the prying: <b>iron, crystal, a tonic</b>, and a fat purse.'},
  scholar: {gold:[25,55], items:[['page',2],['elixir',1]], line:'The scholar’s strongbox yields <b>two rare pages</b>, a greater tonic, and travel-coin.'},
  sailor:  {gold:[40,90], items:[['pearl',1],['coconut',2]], line:'The old salt’s footlocker gives up <b>a pearl</b>, island fruit, and hoarded pay.'},
  _def:    {gold:[30,70], items:[['crystal',1],['potion',1]], line:'The locked chest opens: <b>a crystal</b>, a tonic, and a purse of coin.'},
};

/* ---------- the themes ---------- */
/* wall:[c1,c2] two-tone; floorTint = rgba wash over the plank floor (or null) */
const HOME_THEMES = [
  { id:'fisher', name:'a fisher’s home',
    line:'Nets and cork floats on every hook; the whole place breathes brine.',
    wall:['#3f4a52','#374149'], floorTint:'rgba(64,92,116,0.12)',
    build(F,I){ F('net',3.0,1.3,{hw:1.1,hh:0.3}); F('shelf',6.6,1.3,{hw:1.0,hh:0.3});
      F('bed',7.2,4.7,{hw:1.0,hh:0.7}); F('barrel',1.8,2.9,{hw:0.45,hh:0.4,loot:'fisher'});
      F('barrel',2.6,3.5,{hw:0.45,hh:0.4,loot:'fisher'}); F('crate',6.7,3.1,{hw:0.55,hh:0.45,loot:'food'});
      F('chest',1.9,4.8,{hw:0.6,hh:0.45,once:'fisher',id:'seachest'}); F('rug',4.5,4.3,{hw:0,hh:0,solid:false}); } },

  { id:'herb', name:'a herbalist’s cottage',
    line:'Bunches of drying herbs sway from the beams; it smells of thyme and green sap.',
    wall:['#3a4a30','#33422b'], floorTint:'rgba(80,104,52,0.10)',
    build(F,I){ F('hearth',2.4,1.35,{hw:0.9,hh:0.35}); F('shelf',6.6,1.3,{hw:1.0,hh:0.3});
      F('herbtable',6.4,3.2,{hw:0.9,hh:0.6}); F('urn',1.7,3.3,{hw:0.4,hh:0.35,loot:'herb'});
      F('drawers',7.5,4.8,{hw:0.5,hh:0.4,loot:'herb'}); F('bed',1.9,4.9,{hw:1.0,hh:0.7});
      F('rug',4.5,4.3,{hw:0,hh:0,solid:false}); } },

  { id:'weaver', name:'a weaver’s home',
    line:'A great loom fills one wall, half-strung with reef-purple thread.',
    wall:['#463456','#3d2d4c'], floorTint:'rgba(96,72,120,0.10)',
    build(F,I){ F('loom',6.7,3.1,{hw:0.9,hh:0.5}); F('shelf',6.6,1.3,{hw:1.0,hh:0.3});
      F('crate',2.0,3.0,{hw:0.55,hh:0.45,loot:'cloth'}); F('urn',1.7,4.4,{hw:0.4,hh:0.35,loot:'cloth'});
      F('bed',7.3,5.0,{hw:1.0,hh:0.65}); F('drawers',2.7,4.9,{hw:0.5,hh:0.4,loot:'cloth',secret:true});
      F('rug',4.5,4.3,{hw:0,hh:0,solid:false}); } },

  { id:'hoarder', name:'a packrat’s den',
    line:'Crates to the rafters and barely a path between them. Someone never threw a thing away.',
    wall:['#4a3826','#42311f'], floorTint:'rgba(96,74,44,0.12)',
    build(F,I){ F('crate',1.8,2.7,{hw:0.55,hh:0.45,loot:'craft'}); F('crate',2.5,3.4,{hw:0.55,hh:0.45,loot:'food'});
      F('barrel',3.1,2.5,{hw:0.45,hh:0.4,loot:'craft'}); F('crate',6.6,3.0,{hw:0.55,hh:0.45,loot:'craft'});
      F('barrel',7.4,3.6,{hw:0.45,hh:0.4,loot:'coin'}); F('shelf',5.4,1.3,{hw:1.0,hh:0.3});
      F('chest',7.3,4.8,{hw:0.6,hh:0.45,once:'hoarder',id:'hoard'}); F('bed',1.9,4.9,{hw:1.0,hh:0.7}); } },

  { id:'scholar', name:'a scholar’s study',
    line:'Books to the ceiling, a desk drowned in charts, and the dry smell of old paper.',
    wall:['#2f3a4e','#293345'], floorTint:'rgba(60,78,112,0.10)',
    build(F,I){ F('desk',6.6,3.2,{hw:1.0,hh:0.6}); F('stool',6.6,4.3,{hw:0.35,hh:0.3});
      F('books',1.7,1.3,{hw:0.7,hh:0.3}); F('shelf',3.1,1.3,{hw:0.7,hh:0.3}); F('books',6.6,1.3,{hw:0.7,hh:0.3});
      F('cupboard',7.6,4.9,{hw:0.5,hh:0.4,loot:'lore'}); F('drawers',1.9,4.5,{hw:0.5,hh:0.4,loot:'lore',secret:true});
      F('bed',3.0,4.9,{hw:1.0,hh:0.65}); F('rug',4.7,4.6,{hw:0,hh:0,solid:false}); } },

  { id:'baker', name:'a baker’s home',
    line:'The oven still ticks with heat and the whole room smells of warm crust.',
    wall:['#54402a','#4a3824'], floorTint:'rgba(120,86,48,0.10)',
    build(F,I){ F('hearth',2.3,1.35,{hw:1.0,hh:0.35}); F('table',6.3,3.1,{hw:0.9,hh:0.6});
      F('sack',1.8,4.4,{hw:0.5,hh:0.4,loot:'grain'}); F('sack',2.6,4.8,{hw:0.5,hh:0.4,loot:'grain'});
      F('crate',7.2,4.6,{hw:0.55,hh:0.45,loot:'food'}); F('shelf',6.6,1.3,{hw:1.0,hh:0.3});
      F('bed',7.4,2.7,{hw:1.0,hh:0.6}); F('rug',4.5,4.3,{hw:0,hh:0,solid:false}); } },

  { id:'sailor', name:'a retired sailor’s berth',
    line:'A hammock, a sea-chest, and charts of waters this old salt will never sail again.',
    wall:['#33454a','#2d3d42'], floorTint:'rgba(64,96,104,0.11)',
    build(F,I){ F('net',3.0,1.3,{hw:1.1,hh:0.3}); F('shelf',6.6,1.3,{hw:1.0,hh:0.3});
      F('bed',7.3,4.8,{hw:1.0,hh:0.65}); F('barrel',1.8,3.0,{hw:0.45,hh:0.4,loot:'fisher'});
      F('urn',2.7,3.6,{hw:0.4,hh:0.35,loot:'coin'}); F('chest',1.9,4.8,{hw:0.6,hh:0.45,once:'sailor',id:'footlocker'});
      F('cupboard',6.7,3.1,{hw:0.5,hh:0.4,loot:'food'}); F('rug',4.5,4.3,{hw:0,hh:0,solid:false}); } },

  { id:'potter', name:'a potter’s workshop',
    line:'Shelves of drying pots, a wheel by the window, and clay-dust on everything.',
    wall:['#5a3a2c','#4f3226'], floorTint:'rgba(128,74,50,0.11)',
    build(F,I){ F('urn',1.8,2.8,{hw:0.4,hh:0.35,loot:'craft'}); F('urn',2.6,3.4,{hw:0.4,hh:0.35,loot:'craft'});
      F('urn',7.4,3.2,{hw:0.4,hh:0.35,loot:'coin'}); F('table',6.4,4.6,{hw:0.9,hh:0.6});
      F('shelf',6.6,1.3,{hw:1.0,hh:0.3}); F('drawers',1.9,4.8,{hw:0.5,hh:0.4,loot:'craft',secret:true});
      F('bed',7.3,2.7,{hw:1.0,hh:0.6}); F('rug',4.5,4.3,{hw:0,hh:0,solid:false}); } },
];

/* ---------- apply a deterministic theme to a generic home ---------- */
function applyHomeTheme(I,b){
  if(!I || (I.kind!=='house' && I.kind!=='house2')) return;
  // leave bespoke homes alone: anything with its own lore, a shop, an inn, your deed
  if(I.loreKey || I.vault || I.home || I.inn || I.spire) return;
  const h=(Math.floor(b.x)*73856093 ^ Math.floor(b.y)*19349663) >>> 0;
  const th=HOME_THEMES[h % HOME_THEMES.length];
  I.theme=th;
  I.furn.length=0;                          // rebuild the room from the theme
  const F=(type,x,y,opts)=>{ opts=opts||{};
    const f={type,x,y,hw:opts.hw!=null?opts.hw:0.6,hh:opts.hh!=null?opts.hh:0.5,solid:opts.solid!==false};
    if(opts.loot)   f.loot=opts.loot;
    if(opts.once)   f.once=opts.once;   // one-time locked chest (HOME_CHEST[opts.once])
    if(opts.secret) f.secret=true;
    if(opts.lore)   f.lore=opts.lore;
    if(opts.id)     f.id=opts.id;
    I.furn.push(f);
  };
  th.build(F,I);
}

/* ---------- searching: weighted loot, secret caches, one-time chests ---------- */
function _lootPick(table){
  const list=HOME_LOOT[table]; if(!list) return null;
  let tot=0; for(const e of list) tot+=e.w;
  let r=Math.random()*tot;
  for(const e of list){ r-=e.w; if(r<=0) return e; }
  return list[list.length-1];
}
function _grant(e){
  if(e.empty){ toast(e.msg||'Nothing useful in there.'); return; }
  if(e.gold!=null){ const g=rndi(e.gold[0],e.gold[1]); giveGold(g); if(e.msg) toast(e.msg); return; }
  const n=e.n? rndi(e.n[0],e.n[1]) : 1;
  give(e.item,n); if(e.msg) toast(e.msg,3600);
}
/* returns true if it fully handled the search (so legacy rummage is skipped) */
function homeSearch(f){
  const I=G.interior;
  // one-time locked chest: a real haul, then empty forever (persisted)
  if(f.once){
    const key='home:'+((I&&I.src)?(I.src.w+':'+I.src.x+','+I.src.y):'?')+':'+(f.id||(f.x+'_'+f.y));
    if(P.prog[key]){ toast('The chest sits open and empty - you cleared it out already.',3000); return true; }
    P.prog[key]=1;
    const c=HOME_CHEST[f.once]||HOME_CHEST._def;
    giveGold(rndi(c.gold[0],c.gold[1]));
    for(const it of c.items) give(it[0],it[1]);
    if(typeof burst==='function') burst(P.x,P.y-0.5,'#ffd76a',18);
    Snd.quest? Snd.quest() : Snd.pickup&&Snd.pickup();
    toast(c.line,5200); autoSave&&autoSave();
    return true;
  }
  if(!f.loot) return false;                 // not a themed piece - fall to legacy rummage
  // secret compartment: the FIRST search turns up a fine cache, then it's ordinary
  if(f.secret && !f.searchedOnce){
    f.searchedOnce=true; f.rummaged=true;
    const e=_lootPick('fine'); if(e){ _grant(e); if(typeof burst==='function') burst(P.x,P.y-0.5,'#c9b0ff',12); }
    toast('<i>A false back slides aside - a hidden cache!</i>',3200);
    Snd.quest? Snd.quest():Snd.pickup&&Snd.pickup();
    return true;
  }
  if(f.rummaged){ toast('Nothing more in there.'); return true; }
  f.rummaged=true;
  const e=_lootPick(f.loot); if(e) _grant(e);
  Snd.step&&Snd.step(8);
  return true;
}

/* ---------- extra furniture art (returns true if it drew f) ---------- */
function drawExtraFurniture(f,s){
  switch(f.type){
    case 'chest':{
      iBox(s,1.1,0.8,8,'#6e4a2b','#4a3018','#3c2614');           // body
      iBox({x:s.x,y:s.y-8},1.1,0.8,5,'#7d5834','#583c22','#48301b'); // domed lid course
      cx.strokeStyle='#8f7a52'; cx.lineWidth=2;                   // iron bands
      cx.beginPath(); cx.moveTo(s.x-13,s.y-12); cx.lineTo(s.x-13,s.y-1);
      cx.moveTo(s.x+13,s.y-12); cx.lineTo(s.x+13,s.y-1); cx.stroke();
      cx.fillStyle='#c9a24e'; cx.fillRect(s.x-2.5,s.y-11,5,5);    // lock plate
      return true; }
    case 'urn':{
      const grd=cx.createLinearGradient(0,s.y-20,0,s.y);
      grd.addColorStop(0,'#b5673a'); grd.addColorStop(1,'#7c3f22');
      cx.fillStyle=grd; cx.beginPath();
      cx.moveTo(s.x-4,s.y-20); cx.quadraticCurveTo(s.x-11,s.y-11,s.x-8,s.y-2);
      cx.quadraticCurveTo(s.x,s.y+2,s.x+8,s.y-2);
      cx.quadraticCurveTo(s.x+11,s.y-11,s.x+4,s.y-20); cx.closePath(); cx.fill();
      cx.fillStyle='#8a4d2c'; cx.beginPath(); cx.ellipse(s.x,s.y-20,4.6,1.8,0,0,TAU); cx.fill(); // rim
      cx.fillStyle='rgba(255,236,206,0.16)'; cx.beginPath(); cx.ellipse(s.x-3,s.y-12,1.8,5,0,0,TAU); cx.fill(); // sheen
      return true; }
    case 'drawers':{
      iBox(s,1.0,0.7,16,'#6a4c30','#48311c','#3b2717');
      cx.strokeStyle='rgba(20,12,6,0.6)'; cx.lineWidth=1;
      cx.strokeRect(s.x-11,s.y-14,22,4.6); cx.strokeRect(s.x-11,s.y-9,22,4.6);
      cx.fillStyle='#c9a24e'; cx.beginPath(); cx.arc(s.x,s.y-11.5,1.2,0,TAU); cx.arc(s.x,s.y-6.6,1.2,0,TAU); cx.fill();
      return true; }
    case 'cupboard':{
      iBox(s,0.9,0.7,24,'#5c4228','#3e2c19','#332415');
      cx.strokeStyle='rgba(20,12,6,0.6)'; cx.lineWidth=1;
      cx.beginPath(); cx.moveTo(s.x,s.y-22); cx.lineTo(s.x,s.y-2); cx.stroke(); // door seam
      cx.fillStyle='#c9a24e'; cx.beginPath(); cx.arc(s.x-2.4,s.y-11,1.1,0,TAU); cx.arc(s.x+2.4,s.y-11,1.1,0,TAU); cx.fill();
      return true; }
    case 'sack':{
      cx.fillStyle='#c9b184'; cx.beginPath();
      cx.moveTo(s.x-9,s.y); cx.quadraticCurveTo(s.x-12,s.y-13,s.x-4,s.y-16);
      cx.quadraticCurveTo(s.x,s.y-19,s.x+4,s.y-16);
      cx.quadraticCurveTo(s.x+12,s.y-13,s.x+9,s.y); cx.closePath(); cx.fill();
      cx.fillStyle='#a8906a'; cx.beginPath(); cx.moveTo(s.x-4,s.y-16); cx.quadraticCurveTo(s.x,s.y-13,s.x+4,s.y-16);
      cx.lineTo(s.x+3,s.y-19); cx.quadraticCurveTo(s.x,s.y-17,s.x-3,s.y-19); cx.closePath(); cx.fill(); // tied neck
      cx.strokeStyle='rgba(90,70,44,0.5)'; cx.lineWidth=1; cx.beginPath(); cx.moveTo(s.x-6,s.y-6); cx.lineTo(s.x+6,s.y-6); cx.stroke();
      return true; }
    case 'herbtable':{
      iBox(s,1.6,1.0,15,'#5a4630','#3e2f1e','#332618');
      // a mortar and a couple of stoppered bottles on top
      cx.fillStyle='#8a8078'; cx.beginPath(); cx.ellipse(s.x-8,s.y-17,3.4,2,0,0,TAU); cx.fill();
      cx.fillStyle='#6a625a'; cx.beginPath(); cx.ellipse(s.x-8,s.y-17,2,1.1,0,0,TAU); cx.fill();
      for(let i=0;i<3;i++){ cx.fillStyle=['#7fb05b','#c85a7a','#7fd4ff'][i];
        cx.fillRect(s.x+2+i*4,s.y-22,2.6,6); cx.fillStyle='#3a2a1a'; cx.fillRect(s.x+2.4+i*4,s.y-24,1.8,2); }
      return true; }
    case 'loom':{
      cx.strokeStyle='#6a4a2c'; cx.lineWidth=3; cx.lineCap='round';   // A-frame
      cx.beginPath(); cx.moveTo(s.x-12,s.y); cx.lineTo(s.x-8,s.y-30);
      cx.moveTo(s.x+12,s.y); cx.lineTo(s.x+8,s.y-30);
      cx.moveTo(s.x-9,s.y-30); cx.lineTo(s.x+9,s.y-30); cx.stroke();   // top beam
      cx.strokeStyle='rgba(180,150,190,0.55)'; cx.lineWidth=1;         // warp threads
      for(let i=-3;i<=3;i++){ cx.beginPath(); cx.moveTo(s.x+i*2.6,s.y-29); cx.lineTo(s.x+i*2.6,s.y-6); cx.stroke(); }
      cx.strokeStyle='#8a5a7a'; cx.lineWidth=3;                        // half-woven cloth
      cx.beginPath(); cx.moveTo(s.x-8,s.y-12); cx.lineTo(s.x+8,s.y-12); cx.stroke();
      cx.lineCap='butt';
      return true; }
  }
  return false;
}

/* ---------- soft contact shadow under a furniture piece ---------- */
const _FURN_SHADOW = { bed:16, table:13, desk:14, throne:14, column:8, strongbox:11, crate:11,
  hay:14, barrel:8, anvil:10, orb:7, chest:11, urn:6, drawers:10, cupboard:11, loom:12, sack:9,
  herbtable:13, vase:5, plant:7, lounger:12, suitebed:16, frontdesk:16, stool:5, throne2:0 };
function furnShadow(f,s){
  const r=_FURN_SHADOW[f.type]; if(!r) return;   // wall-hung / flat pieces cast none
  cx.save(); cx.globalAlpha=0.22; cx.fillStyle='#000';
  cx.beginPath(); cx.ellipse(s.x, s.y+2, r, r*0.4, 0, 0, TAU); cx.fill();
  cx.restore();
}

/* ---------- door transition: snap to black, then ease the scene up ---------- */
function _revealFromBlack(){
  const fo=document.getElementById('fadeOv'); if(!fo) return;
  fo.style.transition='none'; fo.style.opacity='1';
  void fo.offsetWidth;                                   // force the jump-to-black to apply
  fo.style.transition='opacity .45s ease'; fo.style.opacity='0';
  setTimeout(()=>{ fo.style.transition=''; }, 520);      // restore the default 0.7s ease
}

window._revealFromBlack=_revealFromBlack;
window.applyHomeTheme=applyHomeTheme;
window.homeSearch=homeSearch;
window.drawExtraFurniture=drawExtraFurniture;
window.furnShadow=furnShadow;
