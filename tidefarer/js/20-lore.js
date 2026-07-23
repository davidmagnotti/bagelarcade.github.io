/* =====================================================================
   LORE & LIVING INTERIORS - readable writings, and the interactive
   furniture (beds, hearths, orbs, rummage-ables) that make interiors live.
   ===================================================================== */
P.loreRead=P.loreRead||{};
ITEMS.shell={name:'Spiral Shell', desc:'A perfect beach spiral. Nia collects them.'};
ITEMS.apple={name:'Orchard Apple', desc:'Crisp and sweet. Restores 10 HP.', use:'heal', heal:10};
ITEMS.silk={name:'Stolen Silk', desc:'A bolt of dawn-colored silk, liberated back from the brigands.'};
ITEMS.ribbon={name:'Sunset Ribbon', desc:'Mira\'s finest work. Made for a captain\'s daughter.'};
ITEMS.coconut={name:'Coconut', desc:'Sweet water, rich meat. Restores 15 HP.', use:'heal', heal:15};
ITEMS.boarmeat={name:'Boar Meat', desc:'Rich and gamey. Restores 22 HP.', use:'heal', heal:22};
ITEMS.page={name:'Lore Page', desc:'A page copied from an old island text. Orin wants these.'};
ITEMS.lettuce={name:'Crisp Lettuce', desc:'Restores 8 HP. The King\'s favorite, apparently.', use:'heal', heal:8};

const LORE={
  cloudreach:{title:'The Windshrine Stones', text:'“Faces cut into cloud-worn granite, all turned skyward. The old script beneath them reads: <i>WE RAISED THESE TO THANK THE STORM ROC FOR THE RAIN SHE BRINGS - AND TO BEG HER FOR THE SHIP SHE TOOK.</i> A later hand, shakier: <i>she takes more than she gives now. Do not climb.</i>”'},
  stormreach:{title:'The Wreckstrand Cairn', text:'“A cairn of ship-nails and knuckle-bone on a shore of broken keels. The plank set into it is scratched, not carved: <i>THE REEFS TAKE THE CARELESS. THE BRUTE TAKES THE REST. Trade here at your peril - or put the beast back in its barrow and be a legend.</i> The tally of names beneath it is very long.”'},
  castle:{title:'The Ledger of the Duchy', text:'“Three hundred years of harvests, tithes, and quiet mercies in Maelis’s own hand and her mothers’ before her. One margin note repeats every winter, every reign: <i>feed the March anyway.</i>”'},
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
  'woodpile@isle':{title:'The Woodpile', text:'“Split logs, stacked with a quiet craftsman\'s care - and every pile crowned by the same figure: five points struck clean from a single centre. A child\'s star, you\'d guess, but the hand that lays it never wavers by a finger\'s width, as if it could stack this shape asleep. <i>You have seen this mark somewhere before.</i> You cannot, for your life, think where.”'},
  // ---- Windsurf Isle: a trading city choked by the closed strait ----
  'guildhall@wind':{title:'The Harbor Guild Ledger', text:'“Forty years of manifests in a dozen clerks\' hands, and then a cliff: <i>Season of the Still Water - 0 sailings, 0 tariffs, 0 cargo.</i> The last entry is not a number at all: <i>We are a port with no sea. The Guild votes to burn the debt-books rather than read them aloud. Someone must go out past the reef and LOOK at the thing.</i>”'},
  'sailloft@wind':{title:"Nessa's Pattern Book", text:'“Sail patterns drafted to the inch - mains, jibs, a storm-trysail stitched in red thread \'for the day someone dares the strait again.\' Tucked in the spine, a scrap: <i>a sailmaker with no boats is a poet with no words. I keep cutting canvas anyway. Hope is a kind of hemming - you fold the frayed edge under and carry on.</i>”'},
  'inn@wind':{title:'The Windsurf Inn Register', text:'“Guest after guest, then blank pages soft with dust. The innkeep still writes the date at the top of each empty leaf, every morning, in a neat and stubborn hand. On the counter, a bell nobody has rung in a season - and beside it, polished daily: <i>RING FOR ROOMS. WE KEEP THE FIRE LIT.</i>”'},
  'chandlery@wind':{title:'The Chandler\'s Inventory', text:'“Rope, pitch, lamp-oil, hardtack, fish-hooks by the gross - a whole shop provisioned for voyages that never cast off. A hand-lettered card leans in the window, hopeful and unbought: <i>OUTFITTING FOR THE FIRST SHIP THROUGH. Half price to whoever proves it can be done.</i>”'},
  'cottage@wind':{title:'A Windowsill Diary', text:'“A child\'s diary, kept in wax crayon and total certainty. <i>Day 1: the monster is real. Day 6: I drew it. It has too many arms. Day 20: grown-ups are sad about boats. I am not sad, I am going to FIGHT it when I am big.</i> The last page is just a stick figure with a very large sword. It looks a little like you.”'},
  'resort@wind':{title:'The Breakers Guest Book', text:'“Rapturous reviews in a dozen hands - <i>the salt baths! the sunsets!</i> - and then nothing but Coralie\'s own careful entries, keeping the ritual alive for no one: <i>Weather fair. Baths warmed. Awnings swept. Should a single guest arrive, they will find us ready.</i> She has signed and dated every empty week.”'},
  'windmill@wind':{title:'The Millward Windmill', text:'“Burl the Millwright\'s notes, tacked to the shaft in a careful hand: <i>Four sails, canvas trimmed to the season. The wind turns the cap, the cap turns the shaft, the shaft turns the stones - and the stones turn Windsurf\'s wheat to bread. A hundred years she has run, and she does not care that the harbor sits idle.</i> Below, freshly pencilled: <i>keep her turning. A city that still grinds flour is a city that still means to eat.</i>”'},
  'waterwheel@wind':{title:'The Old Waterwheel', text:'“The wright\'s ledger, pages swollen with damp: <i>The millpond feeds the race, the race drives the wheel, the wheel drives the gear-train - and the great oak cogs, each tooth cut by hand, carry the turning down to the grindstones below. She wants only water, and Windsurf has never been short of that.</i> A last line, underlined twice: <i>while the wheel turns, the strait has not beaten us yet.</i>”'},
  rimefissure:{title:'The Rimefissure', text:'“A cairn of stacked ice-stone marks the turn off the glacier road. Chiselled into the top slab, then frost-glazed near to silence: <i>BELOW: THE RIMEFISSURE. THE OLD WARDEN\'S DOWN-HALL, WHERE THE STRAIT WAS FIRST FROZEN. THREE FROST-LOCKS BAR THE DEEP GATE.</i> A fresh scratch beneath: <i>find all three. the warden waits past them.</i>”'},
  underclimb:{title:'The Underclimb', text:'“The old miners\' tunnel does not come up inside the roost as the falconers still say - it goes DOWN, into a catacomb the birds were never meant to guard. Scratched by the mouth, in a hand already going shaky: <i>the tome is at the bottom, past the bone gate and the sigils. the warden keeps it. put the warden down first. do not read the pages.</i>”'},
  // ---- Orin's tower: a mage's library. Read the shelves to learn the craft. ----
  'weave@tower':{title:'On the Weave', text:'“<i>A First Reader in the Arts.</i> Every living thing hums, and the humming braids together into one cloth the old hands call the Weave. A mage does not <i>make</i> power - she finds a loose thread and pulls, gently, and the world gives. Pull kindly and it mends behind you. Pull greedily and it frays, and frayed weave snags on everything - which is why the reckless caster is followed by small misfortunes for a season after.”'},
  'mana@tower':{title:'The Caster\'s Well', text:'“What you spend when you cast is not the Weave itself but <b>mana</b> - the water you\'ve drawn up into your own well from it. A deep well is not born; it is dug, one drill at a time, one incantation repeated past boredom. <i>Rest refills the well. Panic empties it. The orb on the desk lets a tired student top up without waiting on sleep.</i> Drink from someone else\'s well and you have not learned magic - you have learned theft.”'},
  'ember@tower':{title:'Ember-Glass & Bound Fire', text:'“In the Ember Wars the court mages could not carry hearths to the front, so they bound fire into crystal - <b>ember-glass</b> - warmth that remembers being asked politely. You still turn it up out of the ruin-rock, veined red. It cures resin, warms a strait, steps a windsurf sail true. <i>Fire bound with consent stays warm and patient. Fire bound against its will only waits.</i> Remember which you are holding.”'},
  'wards@tower':{title:'Wards, Circles & Seals', text:'“Defensive weaving: a ward is a promise written into a threshold - <i>this far and no farther.</i> The bathing-stones, the standing stones, the sigils on a dungeon floor: all wards, some kind, some cruel. A well-set circle asks nothing of the one inside it and everything of the one who would cross. <i>To break a hostile ward you rarely need more force - you need to read what it was promised, and prove the promise already kept.</i>”'},
  'enchant@tower':{title:'On Compulsion (a warning)', text:'“The blackest branch of the art is <b>enchantment</b> - not persuading a mind but overwriting one. Bind a beast so and it forgets it was ever gentle: the guardian turns on the guarded, the warden on the warded. <i>The binder threads a single violet cord through the creature\'s well and drinks it dry to fuel the leash.</i> Cut the cord and the beast is simply itself again - grateful, usually, and very tired. It is a coward\'s magic. It is also, lately, someone\'s favourite.”'},
  'weaver@tower':{title:'Orin\'s Marginalia', text:'“A primer left open on the reading table, thick with a teacher\'s scribbles. <i>Rule 1: intent shapes the thread - want the wrong thing precisely and you\'ll get it precisely.</i> <i>Rule 2: never cast angry; anger pulls greedy.</i> <i>Rule 3 (underlined twice): if a spell asks for another\'s will as an ingredient, close the book and walk out. That road has one traveller already, and he does not come back the same.</i>”'},
  // ---- The Undermaw: a deep cave beneath the Barik mines ----
  undermaw:{title:'The Deep-Miners\' Mark', text:'“Chalk-marks the deep-miners left for one another, fading into the damp - the last legible one a warning, not a direction: <i>past this seam the Maw keeps its own counsel. It gives up good ore and better gold, but it counts what leaves and it remembers a face. Take the heart of it once, and once only. Come back greedy and the dark comes back with you.</i>”'},
  // ---- Hearthhold: snow-block igloos against the endless cold (Frozen Isle) ----
  'igloo@frost':{title:'The Hearth-Keeper\'s Creed', text:'“Snow-block courses fitted so close no wind whistles through. Scratched into the ice-brick by the door: <i>we do not fight the cold, we out-last it. Keep the fire fed, the kettle on, and a bed spare for whoever comes off the glacier half-frozen. Let the winter howl itself hoarse. We will still be here, warm, in the spring.</i>”'},
  'inn@frost':{title:'The Kettle & Hearth Register', text:'“The inn\'s register, warm to the touch from its place by the fire. Few names, but a second tally runs down every margin - bowls of soup served, in the hundreds, none of them charged: <i>no traveler turned out, whatever the hour or the coin. The glacier takes enough from us all. This one roof gives a little back.</i>”'},
  'icewright@frost':{title:'Sigrid\'s Workbook', text:'“Blade-runners, sled-shoes, ice-picks, and the whole trick of the craft in one line: <i>you do not carve cold iron, you coax it. Warm the steel just shy of temper and the frost itself shows you where it wants to break.</i> A later, unhappier note: <i>the Weeping Glacier taught me that - back when it still only wept water, and not the cold that walks.</i>”'},
  'ferry@frost':{title:'The Frostferry Log', text:'“Crossings to the mainland, tallied by season in a steady hand - and then the pages thin to nothing: <i>strait\'s frozen solid, keel to shore. No boat crosses ice a fathom thick. Whatever the old Warden did down in the Rimefissure did not thaw with spring, and will not. Someone will have to go DOWN and unfreeze the sea by hand, or Hearthhold is landlocked till it starves.</i>”'},
  // ---- Kohana, the Sunward Isle: woven longhuts under Mount Kea ----
  'longhut@east':{title:'The Longhut Welcome-Cord', text:'“Elder Moli keeps the guest-count not in ink but in knotted cord, a knot for every mat unrolled. Her note beside it: <i>the Sunward folk measure a house by who it feeds, not who it holds. Every mat is a welcome; every welcome a debt the isle is glad to owe.</i> A newer knot, tied cruelly tight: <i>the enchanter came as a guest too. We fed him. We should have watched his hands.</i>”'},
  'weaver@east':{title:'The Ashcloth Patterns', text:'“Bark-cloth pinned to the wall, dyed in reef-purple and a grey the weavers make from Kea\'s own ash. A card explains the custom: <i>we wear the mountain so we never have to fear it. A wyrm sleeps under our thread; best she sleep warm, and wake to find herself already loved.</i>”'},
  'hunt@east':{title:'Huk\'s Tally-Board', text:'“Bristlebacks culled, moa gentled, seasons kept - all burned in a hunter\'s shorthand into a slab of driftwood. The lintel above carries the only lesson that matters: <i>take the boar that charges; leave the moa that runs. Learn the difference before the grove teaches it to you the hard way.</i>”'},
  'board@east':{title:'Kaia\'s Shaping-Notes', text:'“Curls of palm-shaving still caught in the seams of the page. <i>A board is a promise to the wind: shape it true and the wind keeps its half.</i> Below, ruefully: <i>bare it stays, though, till it carries a sail - and no cloth this side of Windsurf Isle is fit for the cloud-sea crossing. The wind\'s a road. It just runs the long way round.</i>”'},
  'drying@east':{title:'The Drying-Rack Count', text:'“Racks of fish and reef-fruit curing slow in the trade wind. Low on the corner post, a child\'s chalk warning to a sibling: <i>if you steal one Papa WILL know, because he counts them in his sleep. He counted 341. Do not make it 340.</i>”'},
  // ---- Stormreach: castaways stranded by the closed strait ----
  'castaway@reach':{title:'The Driftwood Plank', text:'“Lashed driftwood and a sailcloth roof - the shelter of people the strait stranded. Charcoal on the broadest plank, added to in a dozen different hands: <i>WE WERE NOT WRECKED HERE. We washed up and we STAYED, because the Brute walks the barrow road and the reef eats every boat and there was nowhere left to sail TO. Put the beast back in its barrow and maybe this is a port again. Maybe some of us go home.</i>”'},
  // ---- Rookhaven, the Aerie Isle: a village that keeps the birds' hours ----
  'roundhouse@aerie':{title:'The Rook-Feather Rafters', text:'“A round stone house braced low against the ridge-wind, every rafter hung with moulted rook-feathers for luck. Scratched by the hearth: <i>we live where the birds live and keep their hours - up before the thermals, down before the gales. The high wind feeds us and the high wind buries us. Respect it and it is a road; forget it and it is a cliff.</i>”'},
  'innaerie@aerie':{title:'The Windward Rest', text:'“The inn\'s book, weighted with a rook-stone against the draught. <i>Beds cut into the lee of the ridge, warm as a folded wing. We keep a lamp burning in the high window every night - not for guests, but for the young birds that lose the wind and need a mark to steer home by.</i>”'},
  'mews@aerie':{title:"Cade's Mews-Log", text:'“Each bird named, weighed, and flown, in the falconer\'s cramped hand. <i>A rook is not tamed, it is befriended, and the friendship is renewed daily or not at all.</i> The last entries turn anxious: <i>the Roost Heart used to sing the flock home. Since the tome-thing woke in the deep below, the young birds come back wrong-eyed and will not perch. Someone must go DOWN and quiet it.</i>”'},
  // ---- Aldermere, the royal capital: grand halls that read grander than a village well ----
  'charts@crown':{title:'The Hall of Charts', text:'“Wall upon wall of sea-charts, the whole known archipelago inked and re-inked by a century of pilots. One chart alone hangs draped in black cloth: the eastern shoals off Emberwick, a single ship marked on it in the queen\'s own hand, thirty years old. No clerk has ever had the heart to file it away.”'},
  'mint@crown':{title:'The Tideglass Mint', text:'“Coin-dies under lock and royal seal. The mintmaster\'s note by the press: <i>every mark we strike bears the drowned crown - the old king\'s grief, made legal tender. He said a coin that remembers what was lost is spent more kindly. Thirty years on, no one has dared change the die.</i>”'},
  'spice@crown':{title:'The Spice Hall', text:'“Cinnamon, ember-pepper, dried reef-plum - the trade of half a world, gone thin in the years the strait stood shut. A merchant\'s complaint still pinned to a barrel: <i>thirty years we lived off our own stores and called it patience. Open the sea again and let us be gloriously, greedily busy.</i>”'},
  'cloth@crown':{title:'The Cloth Hall', text:'“Bolts of silk and sailcloth stacked to the rafters. One bolt of dawn-dyed silk stands apart, tagged in a seamstress\'s hand from far Greyharbor: <i>Mira\'s work - held for the day a certain captain\'s daughter wears her ribbon in this very hall. Keep it clean. She\'ll come.</i>”'},
  'inn@crown':{title:'The Coin & Cup', text:'“The capital\'s oldest inn register - kings have drunk here in plain cloaks, if you trust the margins. The newest entry, in the innkeep\'s delighted hand: <i>strait\'s open, the ships are back, and last night we ran clean OUT of ale for the first time in thirty years. Best shortage I ever had the joy to pour.</i>”'},
  'garrison@crown':{title:'The Garrison Roster', text:'“The watch-roster of the capital\'s last wall. Beneath the duty-list, an old captain\'s oath, re-inked by every hand that has held the post since: <i>we guard a grieving king and an empty nursery. We will keep guarding them until both are full again.</i>”'},
  'highrow@crown':{title:'A House on Highrow', text:'“A comfortable house on the high row, where the capital\'s easy folk look down on the harbour lights. A child\'s sampler hangs framed by the door, the stitches long grown crooked with age: <i>THE SEA GIVES, THE SEA KEEPS, THE SEA GIVES BACK. HOME BY THE TIDE.</i>”'},
  'range@main':{title:"Rook's Range-Book", text:'“Fletcher Rook\'s ledger, all wind-doping and arrow-spines. <i>My cousin teaches the bow proper, out east past the water - I only keep the butts and the tally. Straight shaft, true feather, patient eye. The wind will lie to you; the arrow doesn\'t have to.</i>”'}
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
  // lore pages are environmental reading, not character dialogue - leave their
  // quotes and italics as authored (raw), don't run the speech cleaner on them
  setDialog(L.text + (first? ' <br><i style="color:#9be07f">(+1 Lore Page copied)</i>':''),
    [{label:'Close the book',ghost:true,fn:closeDialog}], true);
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
function resortDesk(){
  const COST=150, I=G.interior;
  dlg.open=true; document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='The Front Desk';
  const pg=document.getElementById('dportrait').getContext('2d');
  pg.fillStyle='#20160c'; pg.fillRect(0,0,72,72);
  pg.save(); pg.translate(36,64); pg.scale(1.35,1.35);
  drawHumanoid(pg,0,0,{skin:'#caa27b',hair:'#3a2e26',shirt:'#5a3a6a',pants:'#33303c',trim:'#c9a24e',dir:{x:0,y:1},step:0});
  pg.restore();
  const canPay=(P.gold||0)>=COST;
  setDialog('“Welcome to <b>The Breakers</b> - the finest suite on any shore. Sea views, salt baths, linens turned down at dusk. A night with us is <b>'+COST+' gold</b>.”'
      + (canPay? '' : '<br><i>(You are '+(COST-(P.gold||0))+' gold short.)</i>'),
    [ canPay
        ? {label:'Take a suite ('+COST+'g)', cls:'gold', fn:()=>{
            P.gold-=COST; P.hp=P.maxhp; P.mp=P.maxmp;
            P.resortRoom=1;                                          // the suite is yours from now on
            if(I&&I.ret) P.bind={w:G.worldId,x:I.ret.x,y:I.ret.y};   // wake here if you fall
            refreshUI(); Snd.quest&&Snd.quest(); autoSave&&autoSave();
            setDialog('<i>The concierge rings the brass bell and presses a heavy brass key into your hand.</i> “Suite by the sea-window - just there, past the lobby, the one with the canopy bed.” <i>She beams.</i> “It\'s <b>kept for you now</b> - come back and sleep whenever the road wearies you, no charge. Rest well.”<br><i>(Fully restored. Your private suite is unlocked - sleep in it any time. You will wake at the Breakers if you fall.)</i>',
              [{label:'Wonderful',fn:closeDialog}]);
          }}
        : {label:'I\'m short the coin', ghost:true, fn:closeDialog},
      {label:'Just admiring the lobby', ghost:true, fn:closeDialog} ]);
}
function resortSuiteSleep(){
  if(!P.resortRoom){
    toast('The suite is made up and waiting, but it\'s <b>locked</b> - take a room at the <b>front desk</b> (150 gold, or ask Coralie about work) and the key is yours for good.',4600);
    return;
  }
  const fade=document.getElementById('fadeOv'), I=G.interior;
  fade.style.opacity=1; Snd.tone(220,0.5,'sine',0.04,-80);
  setTimeout(()=>{
    G.dayT=0.02; P.hp=P.maxhp; P.mp=P.maxmp; G.fireflies.length=0;
    if(I&&I.ret) P.bind={w:G.worldId, x:I.ret.x, y:I.ret.y};
    refreshUI(); setTimeout(autoSave,300);
    toast('You sink into <b>your suite\'s</b> canopy bed, the sea breathing beyond the shutters. Dawn finds you <b>fully mended</b> - and the Breakers will keep you if you fall.',4200);
    setTimeout(()=>{ fade.style.opacity=0; },120);
  },750);
}
function resortGuestChat(f){
  const gp=Math.floor(f.x*13+f.y*7);
  const names=['Lady Coralind','Sir Pemberton','Old Salt Tam','Merri the Trader','Wynn the Idler','Doran of the Row'];
  const lines=[
    'The salt baths cured my knee - or the sea air did. Either way I\'m not leaving till the gold runs out.',
    'You didn\'t hear it from me, but the strait\'s safe again. First holiday I\'ve dared in a year.',
    'A whole resort near enough to ourselves. Terrible for Coralie, wonderful for the quiet.',
    'They say a hot spring under the isle heats the pool. I say don\'t question a warm swim.',
    'I came for a night. That was three weeks ago. The lounger has my shape in it now.',
    'Mind the deep end - I dropped a whole sugar-plum in there and never saw it again.'
  ];
  const name=names[gp%names.length], line=lines[gp%lines.length];
  dlg.open=true; document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent=name;
  const pg=document.getElementById('dportrait').getContext('2d'); pg.fillStyle='#20160c'; pg.fillRect(0,0,72,72);
  pg.save(); pg.translate(36,64); pg.scale(1.3,1.3);
  drawHumanoid(pg,0,0,{skin:['#e6c39a','#caa27b','#a9784e','#8f6a48'][gp%4],hair:['#3a2e26','#6a5a44','#2a241e','#cfc7b8'][(gp>>1)%4],shirt:['#e86a8a','#5aa0c0','#ffd76a','#7fb05b'][gp%4],pants:'#3a4a6a',dir:{x:0,y:1},step:0});
  pg.restore();
  setDialog('“'+line+'”', [{label:'Enjoy your stay', ghost:true, fn:closeDialog}]);
}
function interiorHotspot(){
  const I=G.interior; if(!I) return null;
  let best=null, bestD=1e9;
  for(const f of I.furn){
    let lbl={bed:(I.home&&P.home)?'Sleep':'Bed', hearth:'Cook', anvil:'Smith', orb:'Attune',
      books:'Read', shelf:'Read', barrel:'Rummage', hay:'Rummage', crate:'Rummage', dragon:'Speak', frontdesk:'Front desk', poolguest:'Chat', suitebed:(P.resortRoom?'Sleep':'Suite'), king:'Speak', cook:'Speak', stairs:'Stairs', millcellar:'Descend'}[f.type];
    if(f.type==='stairs') lbl = f.dir==='up'? 'Go up' : 'Go down';
    if(f.type==='cook' && qs('kitchenrun')==='active' && has('crate',1)) lbl='Deliver crate';
    if(!lbl) continue;
    // the wyrm & the wide reception desk need a hotspot that reaches past them
    const reach = f.type==='dragon'? 3.2 : f.type==='frontdesk'? 2.0 : (f.type==='king'||f.type==='stairs'||f.type==='cook'||f.type==='millcellar')? 1.8 : 1.55;
    const d=dist(P.x,P.y,f.x,f.y);
    if(d<reach && d<bestD){ bestD=d; best={f,label:lbl}; }
  }
  return best;
}
// Talking to Aelin's figure inside the Spire (after dark) opens her normal
// dialogue - lessons by day, and she's here to mind the tower by night.
function spireAelinSpeak(){
  const a=G.npcs && G.npcs.find(n=>n.id==='aelin');
  if(a && typeof buildDialogContent==='function'){
    dlg.open=true; dlg.npc=a;
    document.getElementById('dialog').style.display='block';
    document.getElementById('dname').textContent=a.name;
    if(typeof drawPortrait==='function') drawPortrait(a);
    buildDialogContent(a);
  } else {
    toast('Aelin looks up from her books by candlelight. “Rest if you need it - the cot’s yours.”',4200);
  }
}
function useHotspot(h){
  const f=h.f, I=G.interior;
  if(f.type==='bed'){
    // beds belong to somebody - only your own (furnished) bed grants free sleep
    if(G.interior && G.interior.home){
      if(!P.home) toast('The <b>FOR SALE</b> sign creaks outside. <b>Hedda</b> at the farmsteads holds the deed.',4200);
      else sleepInBed(true);   // once the deed is yours, so is the bed - no furnishing required
    }
    else if(G.interior && G.interior.inn) toast('\u201cBeds are <b>ten gold</b>, friend,\u201d calls the innkeep from the hearth. <b>Talk to them</b> to rest the night.',4200);
    else if(G.interior && G.interior.spire){                     // Aelin's cot: students rest free
      toast('You stretch out on the Spire\u2019s spare cot. \u201cSleep, then,\u201d Aelin murmurs. \u201cThe weave keeps better hours than you do.\u201d',4200);
      sleepInBed(false);
    }
    else toast(['You smooth the quilt back down. Not your bed.',
      'Tempting - but the whole village would hear of it by lunch.',
      'Someone\u2019s slippers wait beside it. You leave the bed be.'][rndi(0,2)],3600);
  }
  else if(f.type==='aelin'){ spireAelinSpeak(); }
  else if(f.type==='dragon'){ if(typeof dragonLairSpeak==='function') dragonLairSpeak(); }
  else if(f.type==='poolguest'){ resortGuestChat(f); }
  else if(f.type==='suitebed'){ resortSuiteSleep(); }
  else if(f.type==='king'){ palaceKingSpeak(); }
  else if(f.type==='cook'){ cookSpeak(); }
  else if(f.type==='stairs'){ useStairs(f.dir); }
  else if(f.type==='millcellar'){ if(typeof enterMillFromInterior==='function') enterMillFromInterior(); }
  else if(f.type==='frontdesk'){ resortDesk(); }
  else if(f.type==='hearth') openStation('The Hearth', cookMenu);
  else if(f.type==='anvil') openStation('The Anvil', craftMenu);
  else if(f.type==='orb'){
    // A mage-tower's scrying orb is now a ONE-TIME BOON per tower: it pours its
    // stored focus into you for a whole free level, instead of the old
    // just-tops-up-your-mana refill. (The Undermaw cave orb is unaffected.)
    const key = (I && I.kind==='tower' && I.src) ? ('orb:'+I.src.w+':'+I.src.x+','+I.src.y) : null;
    if(key && !P.prog[key]){
      P.prog[key]=1; P.mp=P.maxmp;
      if(typeof gainLXP==='function' && typeof xpForP==='function') gainLXP(xpForP(P.level));
      burst(P.x,P.y-0.8,'#c9b0ff',18,2.4); Snd.magic&&Snd.magic(); refreshUI&&refreshUI();
      addFloat('The orb’s focus floods you',P.x,P.y-1.8,'#c9b0ff',1.3);
      // no toast here: gainLXP already throws the big LEVEL banner + XP float, so a
      // popup box restating it would just be redundant with what's already on screen
      // the FIRST mage-tower orb also teaches the dash - the mage's parting gift of speed
      const learnsDash = !(P.unlocked && P.unlocked.dash);
      if(learnsDash && typeof unlockDash==='function') setTimeout(()=>unlockDash('The orb’s last lesson settles into your feet. <b style="color:#c9b0ff">Dash learned!</b> <b>Step outside to try it</b> - '+((typeof isTouch!=='undefined'&&isTouch)?'tap the dodge button':'press Shift')+' to dart aside.'), 1600);
      autoSave&&autoSave();
      return;
    }
    if(P.mp>=P.maxmp){ toast(key? 'The orb is spent - its gift already yours. It only hums now.' : 'The orb hums - your mana is already full.'); return; }
    P.mp=P.maxmp; burst(P.x,P.y-0.8,'#7fd4ff',12,2); Snd.magic(); refreshUI();
    addFloat('Mana restored',P.x,P.y-1.8,'#7fd4ff',1.1);
  }
  else if(f.type==='books') readLore(f.lore || I.loreKey || ((I.kind==='tower'?'tower': I.kind==='castle'?'castle':'barn')+(G.worldId==='main'?'@m':'')));
  else if(f.type==='shelf') readLore(f.lore || I.loreKey || ((I.kind==='house2'?'house2':'house')+(G.worldId==='main'?'@m':'')));
  else if(f.type==='cavechest'){
    if(P.prog.caveChest){ toast('The great chest sits empty. The dark remembers you took its heart.',3200); }
    else { P.prog.caveChest=1; giveGold(220); give('potion',3); gainLXP(180);
      burst(P.x,P.y-0.5,'#c9b0ff',22); Snd.quest(); award&&award('delver');
      toast('The Undermaw yields: <b>220 gold</b>, three tonics, and a story worth <b>180 XP</b>.',5200); }
  }
  else rummage(f);
}

