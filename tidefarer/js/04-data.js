/* =====================================================================
   GAME DATA - items, skills, quests, NPCs
   ===================================================================== */
const ITEMS = {
  wood:{name:'Wood', desc:'Fresh-cut timber.'},
  stone:{name:'Stone', desc:'Solid island granite.'},
  fish:{name:'Fish', desc:'Eat to restore 12 HP.', use:'heal', heal:12},
  wheat:{name:'Wheat', desc:'Eat to restore 10 HP.', use:'heal', heal:10},
  seed:{name:'Wheat Seeds', desc:'Plant in tilled soil at the farm.'},
  mushroom:{name:'Bluecap', desc:'A glowing mushroom from the Whisperwood.'},
  potion:{name:'Ember Tonic', desc:'Restores 30 HP.', use:'heal', heal:30},
  charm:{name:'Ember Charm', desc:'+3 damage to every attack.'},
  crown:{name:'Hollow Crown', desc:'+25 max HP. You earned this.'},
  stormrune:{name:'Stormlight Rune', desc:'The Storm-Wraith\'s spark. Your staff-bolts now stun foes for a heartbeat.'}
};
const SKILLS = {
  melee:{name:'Melee', perk:'+2 dmg / lvl'},
  archery:{name:'Archery', perk:'+2 dmg / lvl'},
  magic:{name:'Magic', perk:'+3 dmg / lvl'},
  mining:{name:'Mining', perk:'+ore & speed'},
  woodcut:{name:'Woodcutting', perk:'+logs & speed'},
  fishing:{name:'Fishing', perk:'bigger catches'},
  farming:{name:'Farming', perk:'+crop yield'}
};
const xpForLevel = lv => Math.round(60*Math.pow(lv,1.55));

const P = {
  x:ZONES.village.x+0.5, y:ZONES.village.y+2.5,
  hp:100, maxhp:100, mp:30, maxmp:30,
  dir:{x:0,y:1}, moving:false, anim:0, speed:4.6,
  weapon:'melee', unlocked:{melee:false,bow:false,staff:false},
  level:1, xpL:0, bank:0, vault:{}, quickItem:'potion', bind:null, horse:0, riding:0, home:0, homeUp:{},
  swordTier:0, // 0 rusty, 1 iron
  atkCd:0, swing:0, hurtT:0, lastCombat:-99, regenT:0,
  inv:{potion:2, seed:0}, gold:0,
  skills:{}, // {lvl, xp}
  quests:{}, prog:{}, kills:{},
  // "The Enchanter's Tide" main-story state. The necklace is worn from wake-up;
  // the reveals (act 3+) stay dormant behind flags until then.
  story:{act:1, necklace:true},
  fishing:null, // {node, t, biteAt, bit}
  dead:false, petPip:false
};
for(const k in SKILLS) P.skills[k]={lvl:1,xp:0};

/* ---------- quests ---------- */
const QUESTS = {
  welcome:{ giver:'maren', title:'Welcome Ashore', kind:'talk', talkTo:'bram',
    brief:'New boots on old sand - welcome, traveler. Our smith Bram has been muttering about needing help. Follow the lanterns east of the well and introduce yourself.',
    log:'Speak with Bram at the forge, east of the village well.',
    doneText:'Maren sent you? Ha! She only sends me the promising ones.',
    rw:{gold:10, item:{potion:1}, xp:{melee:30}}, unlocks:['kit','fish','harvest','cat','shells','springs'] },
  kit:{ giver:'bram', title:'Tools of the Trade', kind:'gather', need:{wood:1, stone:1},
    brief:'You\'ll get nowhere on this isle bare-handed - take these, a woodsman\'s axe and a miner\'s pick off my own rack. Fell a tree for wood, break a rock for stone, then bring them back. Prove you can use them and I\'ll forge you a proper iron sword.',
    log:'Chop a tree for 1 wood and mine a rock for 1 stone with your new tools, then bring them to Bram.',
    doneText:'Good hands - I can see the work in them already. *CLANG* - here\'s your steel, balanced and mean. Off you go - Maren\'s by the well, and she\'ll have work worthy of that blade.',
    rw:{sword:1, gold:5, xp:{woodcut:40, mining:40, melee:60}}, unlocks:['king'] },
  // - Captain Brant's shipwright chain -
  wreck:{ giver:'brant', title:'The Wrecked Tidewalker', kind:'gather', need:{wood:12},
    brief:'The Hollow King\'s down and the strait\'s gone calm - so now she just needs patching, and honest timber is all it takes. See that hull? Split like a walnut on Gull Reef. Bring me twelve planks of common wood and I\'ll have the Tidewalker seaworthy by the tide. No iron, no fuss.',
    log:'Gather 12 wood for the hull, then return to Captain Brant at the dock.',
    doneText:'Aye, that\'s proper timber! *hammers* - there, she\'s watertight. Step aboard at the dock whenever you\'re ready and we\'ll cross to Greyharbor.',
    rw:{gold:30, item:{bread:2}, xp:{woodcut:180}} },
  fittings:{ giver:'brant', title:'Iron Fittings', kind:'gather', need:{bar:4},
    brief:'A hull without iron is a coffin with sails. Four iron bars - Bram smelts them, two ore and a wood apiece. Nails, brackets, and a new anchor chain.',
    log:'Bring 4 iron bars (Bram smelts each from 2 ore + 1 wood).',
    doneText:'Good iron, well struck. She\'s watertight - now to fill her hold.',
    rw:{gold:25, item:{potion:2}, xp:{mining:150}}, unlocks:['provisions'] },
  provisions:{ giver:'brant', title:'Provisions for the Voyage', kind:'gather', need:{bread:4, cookedfish:4, potion:2},
    brief:'The strait\'s two days in a foul wind. Four loaves from Willa\'s hearth, four grilled fish, and two of Orin\'s tonics for luck. A full hold or no voyage.',
    log:'Stock the hold: 4 bread, 4 grilled fish, 2 Ember Tonics.',
    doneText:'A full hold and a mended hull! Now the only anchor left is your own unfinished business ashore.',
    rw:{gold:30, item:{elixir:1}, xp:{fishing:150, farming:100}}, unlocks:['setsail'] },
  setsail:{ giver:'brant', title:'Set Sail', kind:'special',
    brief:'I don\'t weigh anchor while my passenger has debts of the heart ashore. Settle every last task on this isle - every single one - and we catch the morning tide to Greyharbor.',
    log:'Complete every other quest on Emberwick Isle, then return to Captain Brant.',
    doneText:'All squared away? Then stow your gear - the Tidewalker sails! Board her at the dock whenever you\'re ready.',
    rw:{gold:50, item:{boots:1}, xp:{melee:120, archery:120, magic:120}} },
  // - village side work -
  masterwork:{ giver:'bram', title:'The Smith\'s Masterwork', kind:'gather', need:{ore:5, crystal:2, hardwood:2},
    brief:'Before you leave this isle I mean to forge something worth remembering. Five ore, two ember crystals, two hardwood for the charcoal. Do this and I\'ll start you a stock of bars, free.',
    log:'Bring Bram 5 iron ore, 2 ember crystals, and 2 hardwood.',
    doneText:'Look at that heat! Take these bars - first fruits of the masterwork. The rest becomes something the mainland will hear about.',
    rw:{gold:20, item:{bar:2}, xp:{mining:200}} },
  wolffold:{ giver:'willa', title:'Wolves at the Fold', kind:'kill', kill:{wolf:6},
    brief:'Six sets of tracks around the fold this morning. SIX. The cove pack\'s grown bold since the cold snap. Thin them before I lose a single lamb.',
    log:'Hunt 6 wolves (the pine cove to the northeast, and the deep forest).',
    doneText:'Six pelts\' worth of peace. The flock thanks you - loudly, at dawn, forever.',
    rw:{gold:24, hp:6, xp:{melee:120, archery:120}} },
  feast:{ giver:'willa', title:'A Village Feast', kind:'gather', need:{bread:3, apple:3, fish:2},
    brief:'Before you sail we\'re doing this PROPERLY: a farewell feast. Three loaves, three orchard apples, two fresh fish. I\'ll handle the rest - and no, you can\'t eat the ingredients on the way.',
    log:'Gather the feast: 3 bread, 3 orchard apples, 2 fish.',
    doneText:'Perfect! Tonight we eat like the harvest never ends. You\'ll be missed, you know.',
    rw:{gold:26, item:{bread:3}, xp:{farming:180}} },
  echoes:{ giver:'orin', title:'Echoes of the Isle', kind:'special',
    brief:'Three pages barely wet your feet, apprentice. The isle keeps at least seven echoes of its history - in homes, on stones, in places warm and cold. Read seven and you\'ll leave here knowing WHERE you\'ve been.',
    log:'Read 7 lore writings across the isle (books, standing stones, the crypt...).',
    doneText:'Seven echoes! You now know this island better than most who were born on it.',
    rw:{gold:30, mp:6, xp:{magic:220}} },
  gravelord:{ giver:'orin', title:'The Gravelord Stirs', kind:'kill', kill:{gravelord:1},
    brief:'The Hollow King had a herald - Varek, his gravelord. My wards report the old bones knitting back together in the ruins. Put him down before he finishes what his master started. And take Bram\'s yew bow - old bones splinter under arrows, half again as deep.',
    log:'Slay Gravelord Varek in the Old Ruins.',
    doneText:'Varek, unmade. The ruins will finally hold nothing but memory. You\'ve the makings of a legend, you know.',
    rw:{gold:45, item:{warcharm:1}, xp:{melee:200, magic:150}} },
  necklace:{ giver:'nia', title:'A Gift of the Sea', kind:'gather', need:{shell:6, pearl:1},
    brief:'Mama\'s birthday is after you sail, and she always says the sea gives the best gifts. Six spiral shells and... a real PEARL? Fishers say they hide in the deep casts. Please?',
    log:'Gather 6 spiral shells and 1 pearl (a rare catch while fishing).',
    doneText:'A REAL PEARL! She\'s going to cry. Happy crying! You\'re my favorite person who isn\'t Mama.',
    rw:{gold:35, mp:4, xp:{fishing:200}} },
  profit:{ giver:'maren', title:'A Tidy Profit', kind:'special',
    brief:'Commerce keeps a village breathing, traveler. Sell twelve goods across my counter - fish, timber, pearls, whatever the isle yields - and I\'ll teach you the trick of mainland haggling.',
    log:'Sell 12 items to Elder Maren.',
    doneText:'Twelve sales, fairly struck! Here - and remember on the mainland: never take the first price.',
    rw:{gold:40, item:{elixir:1}, xp:{farming:80, fishing:80}} },
  sharpen:{ giver:'bram', title:'Iron in the Fire', kind:'gather', need:{wood:5,stone:3},
    brief:'That rusty letter-opener of yours won\'t cut butter. Bring me 5 wood and 3 stone - there\'s a pine stand south of the village and a stone outcrop up the north road - and I\'ll forge you a proper iron sword.',
    log:'Bring Bram 5 wood and 3 stone.',
    doneText:'Stand back- *CLANG* -there. Iron, balanced, and mean. Try not to lose it.',
    rw:{item:{}, sword:1, gold:5, xp:{melee:60, mining:80, woodcut:80}}, unlocks:['slimes','cove'] },
  slimes:{ giver:'bram', title:'Meadow Menace', kind:'kill', kill:{slime:4},
    brief:'Slimes have gone and claimed the east meadow - Willa\'s cows won\'t graze. Squash four of them and I\'ll dig out my old hunting bow for you.',
    log:'Defeat 4 slimes in the meadow east of the village.',
    doneText:'Not a drop of goo on you! Here - my old yew bow. She pulls a little left. Press 2 to draw it.',
    rw:{bow:true, gold:10, xp:{melee:80, archery:120}}, unlocks:['mushrooms'] },
  fish:{ giver:'finn', title:'Supper for Three', kind:'gather', need:{fish:3},
    brief:'Tide\'s kind today. Grab a spot on the dock where the water ripples, cast, and strike the moment you feel a bite. Three fish feeds my family - keep any extra.',
    log:'Catch 3 fish at rippling water. Interact to cast, again on the "!"',
    doneText:'Beautiful catch! You\'ve got dock-hands, friend. Take these tonics - brewed them from sea kelp myself.',
    rw:{item:{potion:3}, xp:{fishing:150}, gold:5} },
  harvest:{ giver:'willa', title:'Golden Rows', kind:'special', count:4,
    brief:'Soil\'s turned and begging for seed. Take these - plant them in the tilled plots, and wheat grows quick as gossip on this island. Harvest four bundles for me.',
    log:'Plant seeds in Willa\'s plots and harvest 4 wheat.',
    doneText:'Look at that gold! You keep half, that\'s farm law. Come plant whenever you like.',
    rw:{item:{seed:4, wheat:2}, gold:15, xp:{farming:180}} },
  cat:{ giver:'nia', title:'Where\'s Pip?', kind:'special',
    brief:'My cat Pip chased a moth into the Whisperwood and never came back! He\'s orange and he\'s the BEST cat. Please find him? He likes tall trees…',
    log:'Find Pip the cat in the Whisperwood, west of the village.',
    doneText:'PIP! You found him! Thank you thank you thank you! Mama says these red drinks fix everything.',
    rw:{item:{potion:2}, xp:{melee:40}, gold:3} },
  mushrooms:{ giver:'orin', title:'Light in the Dark', kind:'gather', need:{mushroom:3},
    brief:'Hm. You have the look of someone who hasn\'t set anything on fire yet. Promising. Fetch me three bluecap mushrooms from the Whisperwood - they only glow where the shade is honest - and I will wake the staff that\'s been asleep in my cellar.',
    log:'Gather 3 bluecaps from the Whisperwood for Orin.',
    doneText:'Bluecaps, crushed… essence, bound… there. This staff will throw fire that answers to you. Press 3. Mind the eyebrows. And here - the ward on my tower is lifted for you now. Go inside and lay both hands on the scrying orb; fire is only half of what a mage owes their feet. It has one more lesson to give you.',
    rw:{staff:true, xp:{magic:150}} },
  skeletons:{ giver:'orin', title:'Restless Bones', kind:'kill', kill:{skeleton:3},
    brief:'The old ruins north of my tower are rattling again. Skeletons - rude ones. Put three of them back to sleep and I\'ll give you a charm I\'ve been saving for someone reckless.',
    log:'Destroy 3 skeletons in the Old Ruins, north of the tower.',
    doneText:'Quieter already. This ember charm rides your strikes - every blow burns a little brighter now.',
    rw:{item:{charm:1}, gold:20, xp:{melee:80, archery:80, magic:80}}, unlocks:['king'] },
  king:{ giver:'maren', title:'The Hollow King', kind:'kill', kill:{boss:1},
    brief:'Then it\'s true - the Hollow King stirs beneath the crypt. Long ago he traded his heart for a crown, and the island has carried his silence since. End it, traveler. Take your tonics, your steel, your fire. Emberwick believes in you.',
    log:'Defeat the Hollow King at the crypt in the Old Ruins.',
    doneText:'The lanterns burn brighter tonight because of you. Rise, traveler - Champion of Emberwick. The isle is free, and the strait beyond it lies calm at last. Captain Brant can ready the ship now.',
    rw:{gold:100, xp:{melee:150,archery:150,magic:150,mining:100,woodcut:100,fishing:100,farming:100}} }
};

/* ---------- NPCs ---------- */
function makeNPC(id,name,x,y,look,idleLines,wander){
  return {id,name,x:x+0.5,y:y+0.5,hx:x+0.5,hy:y+0.5,look,idleLines,wander:wander||0,
    face:{x:0,y:1}, anim:0, wt:rnd(1,4), li:0};
}
function spawnNPCs(){
  G.npcs = [
    makeNPC('maren','Elder Maren',47,56,{skin:'#e6c39a',hair:'#cfcfd6',shirt:'#7a5a8f',pants:'#4a3a5a',robe:'#5a4472',trim:'#c9a24e',hairstyle:'bun',necklace:'#9be07f'},
      ['The well water tastes of iron. Always has.','Lanterns out by the dock mean rain, they say.','You walk like someone the island wanted.'],0.6),
    makeNPC('bram','Bram the Smith',59,57,{skin:'#d9a06a',hair:'#3a2a1c',shirt:'#8f4a3a',pants:'#3a3a40',hairstyle:'bald',beard:'#2c1f14',apron:'#4a3322'},
      ['A dull blade is a heavy blade.','Hear that ring? That\'s good iron talking.','Stone from the north road takes an edge best.'],0.4),
    (()=>{ const b=makeNPC('brant','Captain Brant',27.5,63.8,{skin:'#c98d5f',hair:'#8a8578',shirt:'#2e4a5e',pants:'#3a3229',cloak:'#274052',beard:'#8a8578',beardLong:true,necklace:'#c9a24e'},
      ['The Tidewalker\'s taken worse. Not much worse, mind.','Gull Reef gave her that gash. Reef always collects a toll.','A captain without a ship is just a man who stares at the sea.','Greyharbor, cross the strait. Finest port this side of anywhere.'],false);
      b.nightOwl=true; return b; })(), // a captain sleeps aboard - findable at any hour
    (()=>{ const f=makeNPC('finn','Finn the Fisher',31.5,61,{skin:'#e2b184',hair:'#c98f1e',shirt:'#3e6f8f',pants:'#5a4632',hat:'straw',beard:'#a8791c'},
      ['Fish bite best where the water ripples.','Night fish are the honest ones - they bite from hunger, not habit.','Salt cures fish and moods alike.','Used to be a ship a week put in at this dock. Now? Nobody arrives anymore. Nobody leaves, neither. Strange tide, that.'],0.5);
      f.nightOwl=true; return f; })(),
    (()=>{ const inn=makeNPC('perrin','Perrin the Innkeep', 40.5,58.6,
      {skin:'#d8a97a',hair:'#6a5038',shirt:'#7a5a3a',pants:'#4a3a2c',apron:'#c9b48e',beard:'#6a5038'},
      ["A bed, a hearth, and no questions past dark. Ten gold.",
       "Night's for wolves and worries. Neither gets past my door."],0.7);
      inn.nightOwl=true; return inn; })(),
    makeNPC('willa','Willa the Farmer',60,60,{skin:'#c98d5f',hair:'#5a3d24',shirt:'#b0763a',pants:'#4f6032',hat:'straw',hairstyle:'long',apron:'#6e5738'},
      ['Wheat here grows in minutes, not months. Old island magic.','Rain does half my work and takes all the credit.','You can eat wheat raw in a pinch. Farmer\'s secret.'],0.7),
    makeNPC('orin','Sage Orin',56.5,36.5,{skin:'#e6c39a',hair:'#8a93a8',shirt:'#3a4a6f',pants:'#2c3852',hat:'wizard',hatColor:'#2c3852',robe:'#33415e',trim:'#7fd4ff',rune:true,beard:'#cfcfd6',beardLong:true},
      ['Magic is just patience, pronounced quickly.','The ruins hum at dusk. Listen, but don\'t answer.','Mana returns with calm breath. Stop flailing.'],0.3),
    makeNPC('nia','Nia',49.5,60.5,{skin:'#e2b184',hair:'#2c2018',shirt:'#c96f8a',pants:'#5a4632',size:0.72,hairstyle:'long'},
      ['Pip can catch moths RIGHT out of the air.','I\'m not allowed past the meadow. Yet.','Did you know slimes bounce? I know everything.'],1.0),
    // The Woodworker - the most forgettable soul on the island. (He is more than
    // that; the clues are planted from hour one and pay off far, far later.)
    (()=>{ const w=makeNPC('woody','The Woodworker',57.5,50.5,
      {skin:'#d8a97a',hair:'#7a5a3a',shirt:'#6a5a44',pants:'#4a3f30',hairstyle:'short'},
      ['Nice day for it. Every day is a nice day for it, really.',
       'I carve little boats, mostly. For someone. I forget who - but they will turn up.',
       'Where am I from? Ha. Woke here one morning, the wood needed chopping, so I chopped. Been happy since.',
       'That tune in my head? No idea the name. My hands seem to, though - I stack the logs to it.'],0.25);
      w.hums=true; return w; })()
  ];
  // Pip the cat
  G.cat = {x:34.5, y:31.5, face:1, anim:0, wt:2, found:false, home:{x:34.5,y:31.5}};
}

/* ---------- mobs ---------- */
const MOBDEF = {
  slime:{hp:18, dmg:12, speed:1.7, aggro:4.5, xp:16, gold:[1,2], name:'Slime'},
  wolf:{hp:32, dmg:20, speed:3.4, aggro:6, xp:26, gold:[1,3], name:'Wolf'},
  skeleton:{hp:46, dmg:26, speed:2.3, aggro:6.5, xp:42, gold:[2,4], name:'Skeleton'},
  archer:{hp:26, dmg:27, speed:2.5, aggro:9, xp:38, gold:[2,4], name:'Barrow Archer'},
  gravelord:{hp:150, dmg:42, speed:2.95, aggro:10, xp:150, gold:[18,26], name:'Gravelord Varek'},
  boss:{hp:210, dmg:25, speed:2.4, aggro:9, xp:220, gold:[30,40], lvl:5, name:'The Hollow King'},
  alpha:{hp:460, dmg:48, speed:3.6, aggro:8, xp:400, gold:[60,85], lvl:8, name:'Greymaw, the Alpha'},
  scorpion:{hp:300, dmg:34, speed:3.2, aggro:8, xp:300, gold:[40,60], lvl:13, name:'Sunscour Scorpion'},
  raider:{hp:280, dmg:30, speed:3.0, aggro:9, xp:280, gold:[35,55], lvl:12, name:'Vael Raider'},
  raidcap:{hp:820, dmg:40, speed:3.15, aggro:12, xp:620, gold:[120,180], lvl:14, name:'Castellan of the Vael'},
  brigand:{hp:240, dmg:22, speed:3.15, aggro:9, xp:180, gold:[18,34], lvl:7, name:'Pinewood Brigand'},
  wraith:{hp:130, dmg:15, speed:4.2, aggro:13, xp:110, gold:[10,20], lvl:6, name:'Night Wraith'},
  boar:{hp:160, dmg:16, speed:3.5, aggro:7, xp:130, gold:[6,14], lvl:5, name:'Bristleback Boar'},
  dragon:{hp:680, dmg:40, speed:3.1, aggro:11, xp:600, gold:[90,140], lvl:9, name:'Ashwing, the Enthralled'},
  mage:{hp:200, dmg:26, speed:2.7, aggro:12, xp:260, gold:[30,55], lvl:8, name:'Vath the Emberbinder'},
  leviathan:{hp:1000, dmg:34, speed:0, aggro:16, xp:700, gold:[0,0], lvl:11, name:'The Bound Leviathan'},
  raptor:{hp:64, dmg:24, speed:4.5, aggro:11, xp:70, gold:[0,0], lvl:12, name:'Screaming Raptor'},
  serpent:{hp:920, dmg:36, speed:2.7, aggro:12, xp:0, gold:[0,0], lvl:13, name:'The Tome-Warden Serpent'},
  frostwarden:{hp:1150, dmg:36, speed:1.9, aggro:13, xp:800, gold:[0,0], lvl:13, name:'The Weeping Warden'},
  dummy:{hp:5000, dmg:0, speed:0, aggro:0, xp:0, gold:[0,0], lvl:1, name:'Practice Dummy'},
  hare:{hp:12, dmg:0, speed:2.6, aggro:0, xp:10, gold:[0,0], lvl:1, name:'Garden Hare'},   // a harmless lettuce thief - bonk it and it bolts
  polarbear:{hp:560, dmg:46, speed:3.5, aggro:9.5, xp:380, gold:[26,44], lvl:14, name:'Ice-Maddened Bear'},   // vicious, high-level frost predator
  icecolossus:{hp:1120, dmg:42, speed:2.1, aggro:12, xp:840, gold:[0,0], lvl:15, name:'The Rimebound'},   // Vath-cursed dungeon guardian - freed, not slain
  // -- the Rainbow Road (sky-dungeon) --
  skywraith:{hp:120, dmg:16, speed:4.3, aggro:12, xp:96, gold:[6,14], lvl:10, name:'Sky Wraith'},           // pale cloud-shades barring the perches
  skygrabber:{hp:900, dmg:6, speed:5.1, aggro:16, xp:0, gold:[0,0], lvl:11, name:'The Cloud-Snatcher'},     // cannot be slain - faster than you, so dash to juke it or stun it with a sword-blow; it only grabs at point-blank
  stormwraith:{hp:560, dmg:26, speed:3.9, aggro:13, xp:520, gold:[40,70], lvl:11, name:'The Storm-Wraith'}, // mini-boss; its stormlight lets your staff stun
  skyspirit:{hp:980, dmg:30, speed:3.2, aggro:13, xp:820, gold:[0,0], lvl:13, name:'The Corrupted Spirit'}, // (retired) old final sky boss
  stormeye:{hp:900, dmg:24, speed:1.4, aggro:20, xp:900, gold:[0,0], lvl:13, name:'The Storm-Eye'},         // final sky boss: shielded, hurls dodge-only gale-wisps; only vulnerable when it discharges
  galewisp:{hp:1, dmg:18, speed:0, aggro:0, xp:0, gold:[0,0], lvl:12, name:'Gale-Wisp'}                     // its spat minions (spawned as dodge-only projectiles)
};
function inSafeZone(x,y){
  for(const k of ['village','dock','farm']){
    const z=ZONES[k];
    if(z && dist(x,y,z.x,z.y) < (z.r||6)+1.5) return true;
  }
  return false;
}
function spawnMob(kind,x,y,elite){
  const d=MOBDEF[kind];
  const hp=Math.round(d.hp*(elite?2.3:1));
  const m={kind, x:x+0.5, y:y+0.5, hx:x+0.5, hy:y+0.5, hp, maxhp:hp,
    dmg:Math.round(d.dmg*(elite?1.7:1)), speed:d.speed*(elite?1.12:1), aggro:d.aggro*(elite?1.2:1),
    xp:Math.round(d.xp*(elite?2.5:1)), elite:!!elite, lvl:(d.lvl||1)+(elite?2:0),
    face:1, anim:Math.random()*10, state:'idle', wt:rnd(1,3), hitCd:0, hurtT:0,
    swing:0, boss:kind==='boss', bigBoss:(kind==='boss'||kind==='alpha'),
    title: kind==='boss'? 'THE HOLLOW KING' : kind==='alpha'? 'GREYMAW, THE ALPHA' : null,
    dead:false, shootCd:0, summoned:[false,false]};
  G.mobs.push(m); return m;
}
function spawnMobs(){
  const slimeSpots=[[66,47],[70,50],[68,52],[72,47],[67,44],[71,53]];
  for(const [x,y] of slimeSpots) spawnMob('slime',x,y);
  const wolfSpots=[[30,39],[35,36],[28,34],[37,42]];
  for(const [x,y] of wolfSpots){ const s=findOpenNear(x,y,3); if(s) spawnMob('wolf',s[0],s[1]); }
  // bone-guard the ground between the fire-gate and the King, at the northern spit
  const skelSpots=[[43,18],[49,18],[45,14],[48,15],[46,12]];
  for(const [x,y] of skelSpots) spawnMob('skeleton',x,y);
  spawnMob('boss',46,10);
}
