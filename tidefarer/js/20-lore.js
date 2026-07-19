/* =====================================================================
   LORE, LIVING INTERIORS & NEW QUESTS
   ===================================================================== */
P.loreRead=P.loreRead||{};
ITEMS.shell={name:'Spiral Shell', desc:'A perfect beach spiral. Nia collects them.'};
ITEMS.apple={name:'Orchard Apple', desc:'Crisp and sweet. Restores 10 HP.', use:'heal', heal:10};
ITEMS.silk={name:'Stolen Silk', desc:'A bolt of dawn-colored silk, liberated back from the brigands.'};
ITEMS.ribbon={name:'Sunset Ribbon', desc:'Mira\'s finest work. Made for a captain\'s daughter.'};
ITEMS.coconut={name:'Coconut', desc:'Sweet water, rich meat. Restores 15 HP.', use:'heal', heal:15};
ITEMS.boarmeat={name:'Boar Meat', desc:'Rich and gamey. Restores 22 HP.', use:'heal', heal:22};
ITEMS.page={name:'Lore Page', desc:'A page copied from an old island text. Orin wants these.'};

const LORE={
  castle:{title:'The Ledger of Queens', text:'“Three hundred years of harvests, tithes, and quiet mercies in Maelis’s own hand and her mothers’ before her. One margin note repeats every winter, every reign: <i>feed the March anyway.</i>”'},
  house2:{title:'Tide Tables & Margin Notes', text:'“Finn\'s hand, over thirty years of tide tables. The margins tell the real story: <i>W. said yes today</i> - circled twice. <i>Pearl. Showed off. Lost it.</i> And on the last page, pressed flat: a dried sea-flower, and the words <i>worth more anyway.</i>”'},
  'house@m':{title:"A Sailor's Letters", text:'“Unsent letters, salt-stiff. <i>Dearest M - the strait is closed again. They say a dead king holds the far isle and the water obeys him. I will wait. The sea has taught me nothing if not waiting.</i> The last letter is dated the week the strait calmed.”'},
  'house2@m':{title:"The Warden's Ledger", text:'“Kell\'s ledger, precise as a blade: <i>wolves - 14 sighted, crimson-marked. They move like soldiers now. Something on the crag gives orders.</i> A later entry, pressed hard into the page: <i>heard it howl. The packs went silent to listen.</i>”'},
  'barn@m':{title:'Trade Hall Manifest', text:'“Cargo lists from Greyharbor\'s golden years - silk, cedar, ember-glass. The final page is an auction notice for the hall itself. Someone has written beneath it, recently and in hope: <i>the beacon will burn again.</i>”'},
  springs:{title:'The Bathing Stone', text:'“Old court script, worn smooth by steam: <i>HERE THE FIRE UNDER THE ISLAND RISES GENTLE. SOLDIER, SET DOWN YOUR SWORD AND SOAK. THE WAR WILL KEEP.</i> Below it, in a child\'s hand: <i>it tickles.</i>”'},
  'stone@isle':{title:'The Standing Stone', text:'“Weathered near to silence, the old script still bites: <i>HERE WATCHED THE KING WHO WOULD NOT DRINK. KINDNESS RUSTS NO CROWN - BUT PRIDE HOLLOWS ONE.</i> Below, in newer, angrier scratches: <i>we warned him.</i>”'},
  'stone@main':{title:'The Barrow Dirge', text:'“A burial stone of the old court, carved with a dirge: <i>SLEEP, SWORDS OF THE EMBER WARS. YOUR KING REMEMBERS YOU - THAT IS THE PROBLEM.</i> The barrow soil around it never quite settles.”'},
  crypt:{title:'The Hollow Crypt', text:'“The arch above the crypt bears the royal cipher, defaced by grief or fury. Inside the threshold, a single line remains legible: <i>He kept the crown. It kept him. Now it keeps us all awake.</i> The stone is cold in a way the sun cannot fix.”'},
  tower:{title:'The Ember Wars', text:'“Before the lanterns, the isle burned. Mages of the old court bound their fire into crystals - the same warm stones you still find veined in ruin-rock. When the court fell, only the crystals remembered how to be warm.”'},
  house:{title:'Songs of the Well', text:'“The well was dug by the first family, who swore its water could knit a wound shut overnight. They also swore the last king refused to drink - said kindness would rust his crown. He kept the crown. It kept him.”'},
  barn:{title:"A Farmer's Almanac", text:'“Wheat here ripens in minutes - old island magic, Willa calls it. The almanac disagrees: it says the soil remembers being loved, and simply hurries to please. Also: beware the grey wolf that casts no howl. It saves them.”'},
  'woodpile@isle':{title:'The Woodpile', text:'“Split logs, stacked with a quiet craftsman\'s care - and every pile crowned by the same figure: five points struck clean from a single centre. A child\'s star, you\'d guess, but the hand that lays it never wavers by a finger\'s width, as if it could stack this shape asleep. <i>You have seen this mark somewhere before.</i> You cannot, for your life, think where.”'}
};
function readLore(key){
  if(!LORE[key] && key.endsWith('@m')) key=key.slice(0,-2);
  const L=LORE[key]; if(!L) return;
  const first=!P.loreRead[key];
  if(first){ P.loreRead[key]=true; give('page',1); Snd.quest();
    if(Object.keys(P.loreRead).length>=Object.keys(LORE).length) award('loremaster'); }
  dlg.open=true;
  document.getElementById('dialog').style.display='flex';
  document.getElementById('dname').textContent=L.title;
  const pg=document.getElementById('dportrait').getContext('2d');
  pg.fillStyle='#20160c'; pg.fillRect(0,0,72,72);
  pg.fillStyle='#e8dcbd'; pg.fillRect(14,10,44,52);
  pg.strokeStyle='#8a6d30'; pg.strokeRect(14,10,44,52);
  pg.strokeStyle='rgba(90,70,40,0.8)'; pg.lineWidth=1;
  for(let i=0;i<6;i++){ pg.beginPath(); pg.moveTo(19,20+i*7); pg.lineTo(53,20+i*7); pg.stroke(); }
  setDialog(L.text + (first? ' <br><i style="color:#9be07f">(+1 Lore Page copied)</i>':''),
    [{label:'Close the book',ghost:true,fn:closeDialog}]);
}
function openStation(name,menuFn){
  dlg.open=true;
  document.getElementById('dialog').style.display='flex';
  document.getElementById('dname').textContent=name;
  const pg=document.getElementById('dportrait').getContext('2d');
  pg.fillStyle='#20160c'; pg.fillRect(0,0,72,72);
  pg.fillStyle='#ff9a3c'; pg.beginPath(); pg.arc(36,44,16,0,TAU); pg.fill();
  pg.fillStyle='#ffce7a'; pg.beginPath(); pg.arc(36,42,9,0,TAU); pg.fill();
  menuFn(null);
}
function sleepInBed(own){
  const fade=document.getElementById('fadeOv');
  fade.style.opacity=1; Snd.tone(220,0.5,'sine',0.04,-80);
  setTimeout(()=>{
    G.dayT=0.02; // dawn
    P.hp=P.maxhp; P.mp=P.maxmp;
    G.fireflies.length=0;
    if(own && G.interior) P.bind={w:G.worldId, x:G.interior.ret.x, y:G.interior.ret.y};
    refreshUI(); setTimeout(autoSave,300);
    toast(own? 'You sleep in <b>your own bed</b> - free, deep, and yours. Dawn finds you <b>fully mended</b>.'
             : 'You wake at <b>dawn</b>, whole and rested.',3600);
    setTimeout(()=>{ fade.style.opacity=0; },120);
  },750);
}
function rummage(f){
  if(f.rummaged){ toast('Nothing more in there.'); return; }
  f.rummaged=true;
  const roll=Math.random();
  if(f.type==='barrel'){ if(roll<0.45){ give('fish',1); toast('A salted <b>fish</b> at the bottom of the barrel!'); }
    else toast('Brine and old rope. Nothing useful.'); }
  else if(f.type==='hay'){ if(roll<0.45){ give(roll<0.2?'wheat':'seed',2); toast('You comb <b>seeds and grain</b> from the hay.'); }
    else toast('Just hay. Itchy, honest hay.'); }
  else if(f.type==='crate'){ if(roll<0.4){ giveGold(rndi(2,6)); }
    else if(roll<0.7){ give('wood',1); toast('Spare <b>timber</b> in the crate.'); }
    else toast('Packing straw and disappointment.'); }
  Snd.step(8);
}
function interiorHotspot(){
  const I=G.interior; if(!I) return null;
  let best=null, bestD=1e9;
  for(const f of I.furn){
    const lbl={bed:(I.home&&P.home&&P.homeUp&&P.homeUp.furnish)?'Sleep':'Bed', hearth:'Cook', anvil:'Smith', orb:'Attune',
      books:'Read', shelf:'Read', barrel:'Rummage', hay:'Rummage', crate:'Rummage', dragon:'Speak'}[f.type];
    if(!lbl) continue;
    // the wyrm is huge and solid, so his hotspot has to reach past his footprint
    const reach = f.type==='dragon'? 3.2 : 1.45;
    const d=dist(P.x,P.y,f.x,f.y);
    if(d<reach && d<bestD){ bestD=d; best={f,label:lbl}; }
  }
  return best;
}
function useHotspot(h){
  const f=h.f, I=G.interior;
  if(f.type==='bed'){
    // beds belong to somebody - only your own (furnished) bed grants free sleep
    if(G.interior && G.interior.home){
      if(!P.home) toast('The <b>FOR SALE</b> sign creaks outside. <b>Hedda</b> at the farmsteads holds the deed.',4200);
      else if(!(P.homeUp&&P.homeUp.furnish)) toast('Your roof - but a bare frame and a straw tick. Have <b>Hedda furnish it proper</b> and the bed is yours.',4600);
      else sleepInBed(true);
    }
    else if(G.interior && G.interior.inn) toast('\u201cBeds are <b>ten gold</b>, friend,\u201d calls the innkeep from the hearth. <b>Talk to them</b> to rest the night.',4200);
    else toast(['You smooth the quilt back down. Not your bed.',
      'Tempting - but the whole village would hear of it by lunch.',
      'Someone\u2019s slippers wait beside it. You leave the bed be.'][rndi(0,2)],3600);
  }
  else if(f.type==='dragon'){ if(typeof dragonLairSpeak==='function') dragonLairSpeak(); }
  else if(f.type==='hearth') openStation('The Hearth', cookMenu);
  else if(f.type==='anvil') openStation('The Anvil', craftMenu);
  else if(f.type==='orb'){
    if(P.mp>=P.maxmp){ toast('The orb hums - your mana is already full.'); return; }
    P.mp=P.maxmp; burst(P.x,P.y-0.8,'#7fd4ff',12,2); Snd.magic(); refreshUI();
    addFloat('Mana restored',P.x,P.y-1.8,'#7fd4ff',1.1);
  }
  else if(f.type==='books') readLore((I.kind==='tower'?'tower': I.kind==='castle'?'castle':'barn')+(G.worldId==='main'?'@m':''));
  else if(f.type==='shelf') readLore((I.kind==='house2'?'house2':'house')+(G.worldId==='main'?'@m':''));
  else if(f.type==='cavechest'){
    if(P.prog.caveChest){ toast('The great chest sits empty. The dark remembers you took its heart.',3200); }
    else { P.prog.caveChest=1; giveGold(220); give('potion',3); gainLXP(180);
      burst(P.x,P.y-0.5,'#c9b0ff',22); Snd.quest(); award&&award('delver');
      toast('The Undermaw yields: <b>220 gold</b>, three tonics, and a story worth <b>180 XP</b>.',5200); }
  }
  else rummage(f);
}

