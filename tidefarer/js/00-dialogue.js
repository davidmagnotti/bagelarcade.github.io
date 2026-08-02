/* =====================================================================
   DIALOGUE  -  the single, hand-editable home for the game's spoken text.

   Everything here is the SOURCE OF TRUTH. On load, applyIdleDialogue() and
   applyQuestDialogue() (and the mood helpers) push these strings onto the
   NPCs and quests, overriding the built-in defaults elsewhere in the code.
   To change any line a character says, or any quest's text, edit it HERE.

   Layout:
     idle        - each NPC's everyday chatter, by NPC id -> [lines]
     idleByWorld - NPCs whose id repeats across isles (perrin, brother)
     idleVariant - story-swapped looks (woody after the reveal, maelis wed)
     farmers     - the per-isle island farmers (36-island-farms)
     curse       - Act II per-isle "wounded / healed" chatter {dmg, res}
     restore     - Act I "the strait/cold is fixed" celebration chatter
     crown       - the capital folk after the royal audience
     quests      - every quest's brief / log / doneText, by quest id
   ===================================================================== */
const DIALOGUE = {
  // ---- everyday NPC chatter --------------------------------------------
  idle: {
    "maren": [
      "The well water tastes of iron. Always has.",
      "Lanterns out by the dock mean rain, they say.",
      "You walk like someone the island wanted."
    ],
    "bram": [
      "A dull blade is a heavy blade.",
      "Hear that ring? That's good iron talking.",
      "Stone from the north road takes an edge best."
    ],
    "brant": [
      "The Tidewalker's taken worse. Not much worse, mind.",
      "Gull Reef gave her that gash. Reef always collects a toll.",
      "A captain without a ship is just a man who stares at the sea.",
      "Greyharbor, cross the strait. Finest port this side of anywhere.",
      "There's an old sailing-hymn my crew's grandfathers hummed - the Tide-Queen's anthem, for the warrior-queen who first calmed these waters. Fine tune. But her name, in the last verse? Worn clean out of the song. Nobody living can call it back.",
      "That five-point star some folk stitch for luck - older than luck, that. The old blood-mark of the tide-queen's line, passed hand to hand down her whole house. You don't earn a mark like that. You're born owed it."
    ],
    "finn": [
      "Fish bite best where the water ripples.",
      "Night fish are the honest ones - they bite from hunger, not habit.",
      "Salt cures fish and moods alike.",
      "Used to be a ship a week put in at this dock. Now? Nobody arrives anymore. Nobody leaves, neither. Strange tide, that."
    ],
    "willa": [
      "Wheat here grows in minutes, not months. Old island magic.",
      "Rain does half my work and takes all the credit.",
      "You can eat wheat raw in a pinch. Farmer's secret."
    ],
    "rask": [
      "A blade that only knows how to swing knows half its trade.",
      "A parry is only a strike with perfect timing - meet their blade with yours.",
      "I turned strikes on three isles before this one. My hands still remember every one.",
      "Late. Always parry LATE - meet the strike, don't reach for it."
    ],
    "orin": [
      "Magic is just patience, pronounced quickly.",
      "The ruins hum at dusk. Listen, but don't answer.",
      "Mana returns with calm breath. Stop flailing."
    ],
    "nia": [
      "Pip can catch moths RIGHT out of the air.",
      "I'm not allowed past the meadow. Yet.",
      "Did you know slimes bounce? I know everything."
    ],
    "woody": [
      "Nice day for it. Every day is a nice day for it, really.",
      "I carve little boats, mostly. For someone. I forget who - but they will turn up.",
      "Where am I from? Ha. Woke here one morning, the wood needed chopping, so I chopped. Been happy since.",
      "That tune in my head? No idea the name. My hands seem to, though - I stack the logs to it."
    ],
    "kell": [
      "Mind the roads, stranger. The wilds here don't forgive.",
      "Elites wear a crimson ring. You'll know them when they charge."
    ],
    "moss": [
      "The pines talk, you know. Mostly complaints.",
      "I came out here for quiet. The wolves had other ideas.",
      "Bluecaps glow brightest the night after rain."
    ],
    "dockhand": [
      "Emberwick? Quaint little training ground, that isle.",
      "They say a storm-relic sits atop the Peak. Guarded, of course."
    ],
    "sela": [
      "Bread, fish, and no questions - Greyharbor's finest counter.",
      "The farmsteads east keep us fed. Mostly."
    ],
    "ivo": [
      "Everything on Barik either heals you or bites you. I sell the first kind.",
      "Bluecaps, tonics, tidebalm. The wilds provide - I just bottle it."
    ],
    "hedda": [
      "Soil's good here. It's everything ELSE that's the problem.",
      "Slimes from the Mirefen eat a season's work in a night."
    ],
    "torv": [
      "These shafts fed three generations before the wilds took the road.",
      "Stone's still down there. Just needs hands brave enough."
    ],
    "maelis": [
      "Barik feeds three baronies and fears one: the Vael March, north-east, where my cousin plays at war.",
      "A duchess rules by ledger and by patience. The sword is for those who run out of both."
    ],
    "guardc1": [
      "Her Majesty receives travelers. Mind your manners and your mud."
    ],
    "aelin": [
      "The Spire's mine to keep - old glass, older books, and a candle that won't quite die.",
      "I hold the range by day and the tower by night. Caught out after dark? Knock - there's a cot by the hearth."
    ],
    "rook": [
      "A good tonic asks no questions and mends what it finds.",
      "Ember Tonic for the small hurts, the blue elixir for the big ones."
    ],
    "mira": [
      "Silk holds a memory of every hand that touches it.",
      "My whole shipment, taken on the north road. The pines have thieves in them now."
    ],
    "corvo": [
      "East past the shoals sits an island the charts pretend not to see.",
      "My girl Wren turns twelve at the next full tide. I promised her something fine.",
      "Think on it: first my ribbons go missing, so my ferry sits idle. Then they say a dragon shut the eastern sky. Now word is Windsurf's own harbor has turned deadly. One door after another, latched between the isles - and always, they say, by some soft-spoken fellow who never raises his voice."
    ],
    "hermit": [
      "Sixty years the pines kept my secret. You brought an axe to a riddle - fair enough.",
      "The forest regrows what you take. Remember that about yourself, too."
    ],
    "bree": [
      "The vault holds what the grave cannot take. Deposit while you breathe.",
      "Greyharbor's ledger balances daily. Unlike its taverns."
    ],
    "castell": [
      "Turn back, Barik-friend. The March answers to its own crown now.",
      "The Duchess's cousin pays iron for iron. You've been warned once."
    ],
    "saffi": [
      "Sailors, wardens, wanderers - everyone sleeps under my roof eventually.",
      "Ten gold buys the best bed on Barik. The second-best is the floor."
    ],
    "corvoE": [
      "Wren has not taken the ribbon off since we landed.",
      "The sloop's provisioned and riding at anchor off the landing. Whenever the island's done with you, just step aboard and cast off - she knows the way back to Barik."
    ],
    "sable": [
      "Rook still owes me twenty gold. Tell him the wind remembers.",
      "A bow is a held breath. Learn to let it go."
    ],
    "huk": [
      "No hurry, eh? A boar you chase today is a boar you chase tomorrow.",
      "The bristlebacks fatten on fallen coconuts. So do I - no shame in a soft life."
    ],
    "kaia": [
      "The wind is a road, friend - but you'd need a windsurf to ride it, and I've no stormcloth to step a sail. That's Windsurf Isle's trade, out past the cloud-sea.",
      "I shaped boards once. Now the reef sits idle - no proper sail this side of Windsurf, and no board worth the name without one. Seek the whittler there, when the wind takes you."
    ],
    "moli": [
      "Kea grumbles, the palms bow, the reef sings. Sit a while - let the island talk to you.",
      "Old Ashwing has warmed these waters since my mother's mother. Pay that robed woman no mind."
    ],
    "elias": [
      "I chart the tides for a living, and cannot chart the one crossing I actually want to make.",
      "There is a lady in Barik I have written to for three years. Her letters smell of ink and iron. I would cross an ocean for the next one - if my nerve ever caught up to my heart.",
      "If you are ever bound for Barik... no. Never mind. Some letters a man must send himself. Or wishes he would."
    ],
    "lani": [
      "Eh, down off Kea in one piece? Come in, come in - the mat is soft and the hearth is warm.",
      "Ten gold, a woven mat, and the reef to hum you under. Sleep as long as the tide pleases."
    ],
    "vath": [
      "The mountain's heat is... wasted, on a sleeping beast.",
      "You have the look of someone the world owes a favor. Climb the mountain; collect it."
    ],
    "rell": [
      "Off Ashwing's back? Then you're one of a lucky few - no hull's crossed our straits in a season.",
      "Something churns the deep water out past the reef. It eats boats, and it's eating this town."
    ],
    "coralie": [
      "Welcome to the Breakers! Sea view, salt baths, and not a single guest all month, alas.",
      "Windsurf lives on visitors. No boats, no visitors - and the awnings gather dust."
    ],
    "burl": [
      "Grain still grinds and the wind still blows - that much the sea can't spoil.",
      "The wheel and the mill kept this city fed for a hundred years. We'll not stop now."
    ],
    "pia": [
      "Mangoes, sugar-melon, spice-plums - all island-grown, none of it shipped, so it's cheap and it's fresh.",
      "Buy something, friend? A stall with no customers is just a sad little roof."
    ],
    "tolen": [
      "Windvanes, whistles, little carved gulls - knick-knacks to remember Windsurf by.",
      "Made all these by hand. Wind gives me the wood off the bluffs, I give it back a shape."
    ],
    "nessa": [
      "I stitch the finest sails on any shore - and every one of them hangs idle in my loft.",
      "The day a boat can cross again, I'll have this town in canvas by nightfall."
    ],
    "wenna": [
      "Beds made, fire lit, and not a soul to fill them since the strait turned. Habit's a stubborn thing.",
      "Ten gold buys a bed and a hot breakfast - same as it's been thirty years. I'll not gouge a castaway."
    ],
    "wrenna": [
      "My birds raised me and I raised them, and now they'd take my eyes if I climbed the plateau. Something up there has turned their hearts.",
      "They were gentle a season ago. Then a robed man walked up the Underclimb and never walked down. The screaming started that night."
    ],
    "cade": [
      "Don't go up the open slope, friend - you'll be ribbons before the first ledge.",
      "There's an old miners' tunnel down by the plateau's foot - the Underclimb. It doesn't climb, whatever the old songs say; it drops into a catacomb under the roost. That's where the curse is anchored. Beat your way to the bottom, put down the warden, and burn the tome it guards - THEN the birds get their minds back."
    ],
    "bryn": [
      "Two moons of this cursed cold, and the strait locked dead and silent - no seal on the floes, no fish beneath them. Hearthhold is eating its own boots.",
      "The Warden used to keep our winters KIND - deep snow and thick safe ice, seals fat on the floes and fish under them. A hard season, but a living one. Then a robed man walked onto the glacier, and the cold turned cruel - violet frost, and the life went out of the ice.",
      "You'll want the Rimefissure if you mean to fix this at the root - a crack in the ice that opened the night the cold came, right off the glacier road. We put a cairn and lamps at the turn so none of ours wanders past it. Mind the warren down there; three old frost-locks bar the deep gate, and you must throw them all."
    ],
    "sigrid": [
      "Wrap up warm and mind the glacier - the Warden is up there, and it is not itself.",
      "It was never a monster, friend. It is the kindest thing on this rock. Whatever holds it now is not.",
      "And keep off the Rimewood flats unless you mean to fight - a great white bear has denned in the old ice-cave out there. Hoarfrost, the hunters call it. Whatever it guards down that hole, it guards it jealously."
    ],
    "aeron": [
      "Few climb Ashwing’s wing this high. Fewer still leave - the wind up here is soured, and a soured sky suffers no guests.",
      "There's a wind <b>spirit</b> haunting the shrine to the north - it guards an old <b>bow</b>. Mind it if you mean to run the road: the Storm-Eye up there laughs at steel, and only an arrow will reach it.",
      "See the little wind-lost bird by the landing? Run her <b>rainbow road</b> and put out the <b>Storm-Eye</b> that fouled the sky. Bring the chart down from the crown, and <b>Ashwing</b> will bear you on to <b>Windsurf</b>, bright on the water below."
    ],
    "wisp": [
      "Mind your footing near the edges - the cloud looks solid and is not.",
      "Bottled mana, if your spellwork's thirsty - the rainbow road asks a lot of a staff. And the way onward is the bird's <b>rainbow road</b>: calm the wind and it bears you down.",
      "If the height gets into your knees, Ashwing will carry you back to the Sunward shore."
    ],
    "mora": [
      "Stormreach! Not many keels chance our reef-storms - fewer still on purpose. Welcome, then, to the edge of the map.",
      "A thing dens up at the Barrow, north - big as a boat and twice as mean. It stove in the last three hulls that put in, and it walks the coast at night. Put it down and we could trade like honest folk again.",
      "Do the coast that kindness and you will always have a berth here, a hot meal, and the truth about what the storms wash up."
    ],
    "tibb": [
      "Every hull I mend by the water, that Barrow-brute wanders down and stamps to kindling for the joy of it.",
      "Silence the brute and I’ll keep this berth sound for any ship that dares the reefs. My word on it."
    ],
    "aldous": [
      "A stranger, and from the isles by your salt. Be welcome in Aldermere. We have grandeur enough - it is gladness we run short of.",
      "This whole city was built for a family of three. I am the one left rattling in it.",
      "They tell me to remarry, to name an heir from the cousins. I tell them the sea still owes me an answer first.",
      "You have the look of someone the tide keeps throwing back. I know that look. I wear it."
    ],
    "halvard": [
      "The Garrison drills dawn to dark. A soft capital is a short one.",
      "You carry yourself like you've put down worse than street thieves. Good. The realm can always use another arm.",
      "Trouble on the isles? We hear things. Robed men, curses lifting. Someone out there is doing the crown's work for it."
    ],
    "cguard": [
      "Move along, citizen. The peace holds while we hold it.",
      "Aldermere sleeps easy because we do not.",
      "Nothing gets past the wall on my watch - not thief, not wraith, not worse.",
      "The night shift is the long one. Keep your lantern lit and your business honest."
    ],
    "brea": [
      "Hear it! The Frozen Isle's cursed cold is broken - the strait is safe to sail again, and trade convoys run within the fortnight!",
      "Hear it! The skies over the Aerie have quieted; her Rookmother sends her thanks to the unnamed traveler!",
      "Word comes off every isle at once - old curses breaking like ice in spring. The city cannot decide if it is a miracle or a warning."
    ],
    "isolde": [
      "This is the Queen's garden. She loved the sea-colored blooms - so I keep them, though she has not walked here in thirty years.",
      "They never found her. Nor the babe. The King had the font built so there'd be a place to weep that wasn't the shoreline.",
      "Strange - some travelers stand at the font and go pale, as if they half-remember it. You look a little that way yourself."
    ],
    "doran": [
      "Silk from the Sunward Isle, ore from Barik, ice-wine off the Frozen strait now the road's safe - the Bazaar sells the whole map.",
      "Coin talks in Aldermere, friend, and lately it can't stop talking about you."
    ],
    "mabley": [
      "Sixty years mending nets on this quay. Watched the young prince's ship sail out. Watched it never come back.",
      "Bad water that season. Bad water and, some say, a bad man aboard. But that's an old sailor talking."
    ],
    "gale": [
      "Thirty beds of lettuce, and every hare in the realm thinks it's a public garden.",
      "The King won't touch a supper without greens. So the greens had better survive till supper.",
      "You want honest work? There's always honest work where there's dirt."
    ],
    "odo": [
      "I feed a palace and half a garrison off this one cart. Ask me anything but for a discount.",
      "The kitchen wants everything by supper and pays me by the moon. Such is the crown's trade.",
      "Reliable legs are worth more than gold in this city, friend, and just as hard to find."
    ]
  },

  // ---- ids that recur on more than one isle ----------------------------
  idleByWorld: {
    "perrin": {  // Emberwick innkeep vs. Aldermere lord steward
      "isle": [
        "A bed, a hearth, and no questions past dark. Ten gold.",
        "Night's for wolves and worries. Neither gets past my door."
      ],
      "crown": [
        "His Majesty grieves in public now, which is new. For thirty years he did it behind a shut door.",
        "Do not speak of the lost prince within the King's hearing unless you mean to ruin his week. The whole court steps around it.",
        "Aldermere runs on ledgers and patience. I supply both."
      ]
    },
    "brother": {  // Jaist on the Frozen Isle vs. Stormreach
      "frost": [
        "Go on - I'll hold the landing. If Hearthhold has the right of it, whatever Vath bound is down the Rimefissure, past the deep ice.",
        "The whole strait talks of a robed man on the glacier. That's Vath, or his handiwork. Find what he hid down there, Joan - and mind the cold.",
        "Bring me anything strange you turn up in the deep. Old script, old magic - that's my half of this fight, remember?"
      ],
      "reach": [
        "Go on - I'll mind the boat. If this rock stoves a hull the way the charts promised, someone has to keep our way home afloat.",
        "I'll keep a fire lit here on the strand. Find what this place is hiding, Joan - nothing I'd have to write a ballad about.",
        "Storm won't let up. Shout if the isle bites back and I'll come running, axe and all."
      ]
    }
  },

  // ---- story-swapped variants ------------------------------------------
  idleVariant: {
    "woodyRoyal": [
      "Go on and see to the old rock - I'll keep the boat and our way home, same as ever.",
      "Vath's curses have had free run of these islands while we were gone. Undo what you can, Joan; I'll hold the tideline here.",
      "Strange, standing on Emberwick and knowing at last it's mine to leave. I'll be right here by the water when you're ready to sail."
    ],
    "maelisWed": [
      "My Duke charts the tides from the west solar now. Strange, to rule beside someone at last.",
      "You carried the letter that carried my heart. Barik does not forget a debt like that - nor do I."
    ]
  },

  // ---- per-isle island farmers -----------------------------------------
  farmers: {
    "mahina": [
      "Ash makes the sweetest soil - Kea's gift, if you can stand the smoke.",
      "Taro, yam, and good island wheat. All of it loves this sun.",
      "Plant at the grove's edge - the palms keep the wind off the rows."
    ],
    "gethin": [
      "The mill up the rise wants grain, and grain wants working. Care to?",
      "City folk forget bread starts in the dirt. Not me.",
      "Wind's good for the sails and good for the wheat. Lucky isle."
    ],
    "corin": [
      "I farm the ridge in terraces - flat ground's for the birds up here.",
      "The rooks steal a share, but they earn it keeping the grubs down.",
      "Sow high, harvest higher. Best view of any field in the isles."
    ],
    "halla": [
      "Nothing grows on the ice - so we grow it under glass, warm as a hearth.",
      "Turnip, beet, hardy things. They don't mind the cold, and neither do I.",
      "Seed in the warm beds and they'll come up green for you. Try it."
    ],
    "nella": [
      "Storm wrecked us here, so we planted. A camp with a field is a home.",
      "Salt spray and all, the beds still take. The sea gives more than it takes.",
      "Take some seed. On this coast, a full row is worth more than gold."
    ]
  },

  // ---- Act II per-isle curse mood: dmg = still cursed, res = restored ---
  curse: {
    "barik": {
      "kell": { dmg: [
          "You come back to a drowned Barik, warrior. The flood took the whole east - fen, farms, the low road - and half my folk are camped on the keep hill. Whatever churns that water up the reed-causeway, it needs putting DOWN.",
          "I hold the high ground and count heads by lantern. It is all a warden can do while the sea sits where the wheat should be. If you mean to go down that sinkhole - go with my blessing, and quickly."
        ], res: [
          "The water's falling by the hour and the fields are surfacing black and rich. You gave Barik back its ground, warrior - I'll not forget it, and neither will the folk coming down off the hill.",
          "Dry road east again for the first time in weeks. The keep can breathe. Whatever you put down in that vault, it stayed down - and Barik is Barik again because of it."
        ] },
      "sela": { dmg: [
          "Half my stores are under three feet of floodwater, love. I'm selling what I could carry uphill, at prices that shame me. This isn't weather - it's a curse, plain as the wet.",
          "I rationed the dry goods and prayed. That's a provisioner's whole trade this season - rationing and praying. End this flood and I'll stand you a full pack, free."
        ], res: [
          "Cellars drying out, shelves filling back up - I can trade like an honest woman again. Come by, the first hot meal off the mended hearth is yours.",
          "The flood's gone and trade's come roaring back up the dry road. Bless you for it, love - take a loaf, on the house, and don't argue."
        ] },
      "ivo": { dmg: [
          "The shell-beds are all under deep water now, and what I can reach tastes of the curse. Grim season to be a gatherer on Barik.",
          "I gather what the flood leaves me and it isn't much. End this and the beds come back - I'd owe you the finest pearl in them."
        ], res: [
          "Shell-beds surfacing again and the water running clear off them - best gathering in years, and I've you to thank for the season.",
          "The tide sits where it ought to and the beds are fat. Take a spiral shell, friend, for luck - you've earned a whole strand of them."
        ] },
      "hedda": { dmg: [
          "My fields are a LAKE, friend. Thirty years I worked that lowland and now I row a boat over my own furrows. There's no farming a curse - somebody has to break the thing making the water.",
          "The beasts are penned on the high paddock and the ploughs are under water. I just sit and watch the flood and grind my teeth. If you can drain it, I'll name my best sow after you."
        ], res: [
          "DIRT. Real, honest, draining dirt where my lake used to be! It'll want a season to dry true, but it's mine again. You wonderful, wonderful stranger.",
          "I had a plough in the ground the very morning the water fell. You gave a farmer back her fields - there's no thanks big enough, so take a sackful of the first crop and we'll call it a start."
        ] },
      "torv": { dmg: [
          "I read the deep for a living, and the deep is WRONG. The water's not rising off the sky - it's welling up from something churning in the vault below the sinkhole. Go quiet whatever it is before the whole east goes under.",
          "Every delver instinct I own says stay out of that flooded stair. And every one says it's the only way to stop the water. So - mind the reed-causeway, and go down braver than I would."
        ], res: [
          "The deep's gone still and honest again - no more churn, no more welling water. Whatever you put down in that vault, the stone remembers it was afraid of you.",
          "I can work the low tunnels again now the flood's drained. Found your name would be worth carving over the vault mouth, if you'd let me."
        ] },
      "maelis": { dmg: [
          "A duchess rules by ledger and patience, warrior, and neither balances a flood. Vath's water has cost Barik half its harvest and all its calm. Whatever wardens that drowned vault - it is beyond my writ. It may not be beyond your blade.",
          "I have quartered the flooded families in the keep and stretched the stores as far as sums allow. It is not enough. Nothing is, while the water rules the east. If you can end it, name your fee."
        ], res: [
          "You have done what no ledger of mine could: given Barik back its ground. The east will dry, the harvest will come late but it will come, and the keep will remember whose hand drained the fen.",
          "Barik is solvent in more than coin again, thanks to you. The Duchy owes you a debt it will be glad to keep paying."
        ] },
      "saffi": { dmg: [
          "Everyone I know is crowded onto the high streets and frightened. The flood came up so fast, and it just... stays. Please tell me you mean to do something about it.",
          "I keep the little ones away from the waterline - it's not right, that water, it looks like it's watching. Break the curse, warrior. We're all counting on it."
        ], res: [
          "The streets are draining and folk are drifting back down to their own doors, laughing like they forgot how. That's YOUR doing.",
          "It feels like the isle exhaled. Thank you - truly. Barik will tell your name to its children."
        ] }
    },
    "wind": {
      "rell": { dmg: [
          "Half my harbour's under water that shouldn't be there, and a wind that won't die drove it up over the Row and a whole north district besides. That's no gale - it's a THING, denned in the spire that tore open at the wheel's foot. Go still it.",
          "I count my drowned jetties every morning and swear at the wind. It never stops - never once drops - and till it does, Windsurf drowns by inches. If you've the nerve for that spire, harbormaster to hero: go."
        ], res: [
          "Dead calm, first time in weeks, and the water's pulling back off the Row like a tide remembering its manners. You gave us our harbour back - and the north district the flood had stolen with it.",
          "Boats working the strait again and every one of them puts in to ask who broke the curse. I point them at you. Windsurf owes you its whole livelihood, and it knows it."
        ] },
      "coralie": { dmg: [
          "I've shuttered the Breakers against the gale and the sea both - the salt baths are full of storm-wrack and the guest wing looks out on a flood. No one takes a room to watch a curse. Break it, and I'll open every window I own.",
          "The wind screams down the chimneys all night and the water laps the terrace. A resort needs weather folk want to sit IN. Still that spire, love, and the Breakers lives again."
        ], res: [
          "GUESTS again! The wind's gone gentle and the flood's drawn off the terrace - the salt baths are hot and the sea view is glorious. All yours, on the house, for as long as you like.",
          "The Breakers is full to the rafters and the sea's a mill-pond off the terrace. You didn't just save a resort, you saved my whole trade. Bless you, traveller."
        ] },
      "burl": { dmg: [
          "I built half the jetties the flood just ate. Forty years of joinery gone brackish overnight. It's that cursed wind off the wheel - fix the wheel's curse and I'll rebuild, gladly.",
          "Can't drive a pile in water that won't hold still and a wind that won't quit. A wright's hands go idle in a drowned town. Go do the thing I can't."
        ], res: [
          "Solid ground to build on again and a calm sky to build under - I've three jetties framed already. Good work makes a body forget the bad season, and this is good work.",
          "The Row's draining and every plank I lay stays dry. That's your doing, and I'll carve it into the first new post if you don't stop me."
        ] },
      "pia": { dmg: [
          "Trade Row's half-flooded and the sailors that used to buy me out are gone with the calm water. I sell what I can from the high stalls and watch the deep creep up the cobbles.",
          "No fleet, no festival, no sugar-melon sold by noon - just the wind and the rising water. Break the curse and I'll have this Row humming by nightfall, see if I don't."
        ], res: [
          "Sold clean out by midday - the sailors are back and they buy like it's a festival! Take a spice-plum, on the house, for giving Trade Row its bustle back.",
          "The Row hums again and the deep water's off the cobbles for good. Best season I can remember, and I know exactly whose boots to thank for it."
        ] },
      "tolen": { dmg: [
          "A whittler needs dry wood and a steady hand, and this cursed wind gives me neither - it snatches the shavings clean off my knife. No boards get shaped till that gale is stilled.",
          "I keep my good timber up on the loft-beams away from the flood and wait. That's all Windsurf does now: keep things high, and wait. Go end the waiting."
        ], res: [
          "The wind's gentle enough to whittle by again - curls of cedar dropping neat at my feet like the old days. Come by, I'll shape you something that rides a calm sea.",
          "Dry benches, still air, and a whole stack of boards to catch up on. You handed a craftsman back his craft, friend. That's not a small thing."
        ] },
      "nessa": { dmg: [
          "Every loom in my loft would run if there were a fleet to buy the canvas - but the flood's drowned the Row and the wind's eaten the sails I DID make. There's no sailmaking under a curse.",
          "I stitch and I unpick and I watch the water. Told you once I'd have this town in sail by nightfall if a boat could only cross - well. Break the wind's curse and hold me to it."
        ], res: [
          "Every loom in the loft running and the fleet wants canvas YESTERDAY - the strait's a highway again. You made a liar of no one: the town's in sail, just as I swore.",
          "Sails going out faster than I can stitch them, and a calm sky to test them under. That's a sailmaker's heaven, and you built it. My thanks, on every hull that crosses."
        ] },
      "wenna": { dmg: [
          "The little ones aren't allowed near the waterline anymore - it came up so fast and it just STAYS, and the wind never lets up. I'll sleep easy the day someone stills that spire.",
          "We keep to the high streets and mind the young ones and hope. Please - if you can quiet that wind, do it soon. This isn't a town anymore, it's a huddle."
        ], res: [
          "The children are back paddling in the SHALLOWS where the flood used to be, laughing their heads off. That's the sound of a curse lifted, and it's the sweetest thing I know.",
          "The wind's a friend again and the water knows its place. You gave us our town back, whole. We won't forget the day you walked in under that Veil."
        ] }
    },
    "sun": {
      "corvoE": { dmg: [
          "I'd ferry folk clear of this burning rock if the ash didn't choke my sails to rags. So I sit at anchor and watch Kea rage and curse the robed man who woke it.",
          "No captain sails blind through a cinder-sky, and that's all the sky there is now. Quench the mountain, hero, and I'll run you anywhere the water reaches."
        ], res: [
          "Clear air and a fair wind - the Sunward's a port worth calling at again. You cooled the mountain that had me trapped at anchor, and a captain remembers a debt like that.",
          "Sailed out this morning under a blue sky for the first time in a season and near wept at the clean horizon. That's your doing. Passage is free for you, always."
        ] },
      "sable": { dmg: [
          "The ash gets into everything - the wells, the washing, the lungs of the little ones. We wear rags over our faces and pray the mountain tires. It never does. Not on its own.",
          "I sweep the same ash off the same step three times a day and it falls again by dusk. This isn't living, it's enduring. End it, traveler, if any hand can."
        ], res: [
          "Clean air, clear wells, washing that dries WHITE on the line - I'd forgotten the isle could be like this. That's your gift to us, and I'll thank you for it every clean morning.",
          "The little ones play in the open again with no rag over their faces. You gave the Sunward Isle back its breath. There's no repaying that, so I'll just say bless you."
        ] },
      "huk": { dmg: [
          "The boars have gone half-mad with the ash and the shaking, fleeing down off the slopes into the village pens. A boarfather can't herd against a burning mountain. Somebody has to cool Kea's temper.",
          "Even the tuskiest old sow won't face those slopes now, and I don't blame her - the lava creeps where the grazing was. Quench the mountain and I'll drive the herd back up myself."
        ], res: [
          "The herd's climbing back up the cooled slopes to the good grazing, calm as you please. The mountain scared them witless for a season - you unscared it. My thanks, hunter.",
          "Boars fat and slopes green again, no ash in the wallows. That's a good isle to be a boarfather on, and you made it one. Come, I'll roast you the best of the drove."
        ] },
      "kaia": { dmg: [
          "I can't launch a hull through ash this thick - it fouls the sail and burns little holes clean through the canvas. The Wavewright sits idle while Kea rages. That fire needs quenching at its source.",
          "Every wave off the north shore comes in grey with cinders. No wright works in weather like this. Still the mountain and I'll build you the finest boat on the isle."
        ], res: [
          "Clear air off the water again - I've two hulls on the stocks and ash-free canvas for both. You gave a wavewright back her trade, and the sea back its blue.",
          "The strait's clean and the sky is clear and every boat I launch stays that way. Come sail one out with me sometime - I owe you at least that."
        ] },
      "moli": { dmg: [
          "Kea has not slept one night since the robed man's shadow crossed us, child. It burns and burns - lava down every slope, ash on every breath. Something is stoked in the mountain's heart, in the fissure on the south face. Quench it, or Kea buries us all.",
          "I am too old to run from a mountain and too stubborn to leave it. So I sit in the ash and I trust that a hero walked in under the Veil for a reason. Go down into that forge, child, and give me back my quiet mornings."
        ], res: [
          "Quiet. QUIET - do you feel it under your feet? No grumble, no fire. The ash is thinning and the slopes cool by the hour. You gave the Sunward Isle back its mornings, child. Bless you.",
          "The mountain sleeps like it used to, and the sky is blue over Kohana again. An old woman does not cry easily, but I came near it when the first clear dawn broke. Thank you."
        ] },
      "lani": { dmg: [
          "The groves are choked grey and half the fruit drops scorched before it ripens. Ash-farming, we're calling it, and laughing so we don't weep. Cool that mountain and the green comes back.",
          "I shake cinders off the leaves and gather what survives. It isn't much of a harvest under a burning sky. Still Kea and I'll fill your pack with the first clean fruit."
        ], res: [
          "The groves are GREEN again and the fruit ripens sweet with no ash to scorch it. First honest harvest in a season, and it's down to you. Take an armful, they're perfect.",
          "Leaves clean, boughs heavy, sky clear - a grower could weep for joy. You gave us the season back. The whole Sunward Isle eats better because you walked in under that Veil."
        ] }
    },
    "sky": {
      "aeron": { dmg: [
          "This cloud weathered every gale in memory, Skyward - but not this one. A storm settled the day the robed man's shadow reached us and it will NOT break. Lightning walks the standing stones and splits them where they lie. It's caged thunder, penned in the temple by the landing. Let it out.",
          "I have watched the sky my whole life and I have never seen it stay angry this long. It is unnatural - a curse, penned and pacing. Go down into that temple and quiet it, before the lightning walks the whole cloud to rubble."
        ], res: [
          "It BROKE. The storm broke clean away to blue, like a held breath let go - first clear sky over the Cloudreach in a season. You have my thanks, Skyward, and the whole cloud's besides.",
          "Clear air and gentle wind and the old stones standing quiet. We truly thought we'd lost the sun for good. You gave it back. The cloud-folk will sing your name up here for three generations."
        ] },
      "wisp": { dmg: [
          "I tend the cloud, but there's no tending a storm that won't break - it frays the vapour faster than I can knit it, and the lightning scares the sky-drift clean away. Please, quiet the temple.",
          "The endless thunder sets my teeth on edge and thins the cloud beneath our very feet. I do what a cloud-tender can and it isn't enough. Still it, Skyward, before the plateau itself comes apart."
        ], res: [
          "The cloud knits thick and gentle again and the sky-drift's drifting home - I can hear myself think for the first time in a season. That's your gift, and I'll tend it well.",
          "Calm sky, whole cloud, quiet stones. You gave the Cloudreach back to the cloud-folk. There's no thanks light enough to float up here and carry all I mean by it."
        ] }
    }
  },

  // ---- Act I restoration chatter (strait reopened / cold broken) --------
  restore: {
    "wind": {
      "rell": [
        "Boats in the harbor again! First hull to cross in a season put in this morning.",
        "Whatever you did out past the breakwater - the water's a mill-pond now. Windsurf owes you its livelihood."
      ],
      "coralie": [
        "We have GUESTS! Three rooms let by noon. The Breakers is alive again - come, the salt baths are hot.",
        "Bless you, traveller. The awnings are down and the sea view is open for trade."
      ],
      "pia": [
        "Sold clean out of sugar-melon by midday - sailors buy like it's a festival!",
        "Trade Row hums again. Take a spice-plum, on the house, for what you did."
      ],
      "nessa": [
        "Every loom in my loft is running - the fleet wants canvas and they want it yesterday!",
        "Told you: the day a boat could cross, I'd have this town in sail by nightfall. And so I have."
      ]
    },
    "frost": {
      "bryn": [
        "The cold's gone KIND again - you can breathe without it biting, and there's seals back on the floes. A boat'll work the strait-edge by morning.",
        "Still deep in snow, thank the Warden - but it's OUR winter now, not his. We owe you the whole season, friend."
      ],
      "sigrid": [
        "The glacier's stopped bleeding that violet - clean frost again, up there. I could kiss you, but my lips would freeze, so take my thanks instead.",
        "It is itself again, up there. Gentle as ever. You gave us back our guardian - and a winter we can live in."
      ]
    }
  },

  // ---- Aldermere folk after the royal audience -------------------------
  crown: {
    "aldous": [
      "Thirty years I called Vath a drowned man and mourned him beside my own. Now I know he swam. Find him, traveler. Find what he did with my son.",
      "You wear that pendant like it was made for you. Perhaps that is why I trust you with this - though I could not say why.",
      "Go where the curses lead. They are his handwriting. Follow them to the hand that wrote them."
    ],
    "perrin": [
      "His Majesty has not stood so straight in decades. Whatever passed between you gave the old grief a direction. That is no small gift.",
      "A royal writ, an open purse, and the King's own hope riding on you. Do not squander them."
    ],
    "brea": [
      "Hear it! The King has named the traveler his own hand abroad - go where they go, and you go with the crown's blessing!"
    ]
  },

  // ---- quest text: brief (offer) / log (tracker) / doneText (turn-in) ---
  quests: {
    "welcome": {
      brief: "New boots on old sand - welcome, traveler. Two of us could use a hand: our smith <b>Bram</b> at the forge east of the well, and <b>Willa</b> at the farm down the lane south of his forge. Start with Bram - he'll set you right - then go see what Willa needs.",
      log: "Speak with Bram at the forge, east of the well - and meet Willa at the farm down the lane to the south.",
      doneText: "Maren sent you? Ha! She only sends me the promising ones."
    },
    "kit": {
      brief: "You'll get nowhere on this isle bare-handed - take these, a woodsman's axe and a miner's pick off my own rack. Fell a tree for wood, break a rock for stone, then bring them back. Prove you can use them and I'll forge you a proper iron sword.",
      log: "Chop a tree for 1 wood and mine a rock for 1 stone with your new tools, then bring them to Bram.",
      doneText: "Good hands - I can see the work in them already. *CLANG* - here's your steel, balanced and mean. Now, a blade's only half of it - anyone can swing. Go east, past the meadow, and find old <b>Rask</b>. Bladesworn, before he came to keep the quiet out there. He'll teach you to TURN a strike aside - the thing that keeps you breathing when they come at you two and three at once. Then Maren will have work worthy of you."
    },
    "bladeoath": {
      brief: "So Bram sent me another one with a new sword and no idea what to do when it's the OTHER fellow swinging. Anyone can hack away - the trade is knowing what to do when the blow comes back at YOU. You PARRY: watch the strike, and meet it with your own edge at the very instant it lands. Time it true and you turn the blow - an arrow flies back the way it came, a swordsman's left staggered on his own missed swing. No trick to it but timing. Take up your steel - I'll pitch a practice billet at you, and you'll turn it back on your edge. Do it three times and it's yours.",
      log: "Learn to parry from Rask, in his grove at the island's far east - past the Slime Meadow.",
      doneText: "There it is - you felt that, the billet just… gone, turned off your edge. That's the turning. Watch the blow in and meet it LATE, right as it reaches you, not early - a swordsman's strike is no different. Now you're fit to go down into that crypt. Off to Maren."
    },
    "wreck": {
      brief: "The Hollow Spirit's down and the strait's gone calm - so now she just needs patching, and honest timber is all it takes. See that hull? Split like a walnut on Gull Reef. Bring me twelve planks of common wood and I'll have the Tidewalker seaworthy by the tide. No iron, no fuss.",
      log: "Gather 12 wood for the hull, then return to Captain Brant at the dock.",
      doneText: "Aye, that's proper timber! *hammers* - there, she's watertight. Step aboard at the dock whenever you're ready and we'll cross to Greyharbor."
    },
    "fittings": {
      brief: "A hull without iron is a coffin with sails. Bring me eight lumps of iron ore - nails, brackets, and a new anchor chain, and I'll strike every one on my own little anvil. The north road's outcrops are thick with it.",
      log: "Mine 8 iron ore for the Tidewalker's fittings, then return to Captain Brant.",
      doneText: "Good iron, well struck. She's watertight - now to fill her hold."
    },
    "provisions": {
      brief: "The strait's two days in a foul wind. Four loaves from Willa's hearth, four grilled fish, and two of Orin's tonics for luck. A full hold or no voyage.",
      log: "Stock the hold: 4 bread, 4 grilled fish, 2 Ember Tonics.",
      doneText: "A full hold and a mended hull! Now the only anchor left is your own unfinished business ashore."
    },
    "setsail": {
      brief: "I don't weigh anchor while my passenger has debts of the heart ashore. Settle every last task on this isle - every single one - and we catch the morning tide to Greyharbor.",
      log: "Complete every other quest on Emberwick Isle, then return to Captain Brant.",
      doneText: "All squared away? Then stow your gear - the Tidewalker sails! Board her at the dock whenever you're ready."
    },
    "masterwork": {
      brief: "Before you leave this isle I mean to strike something worth remembering. Five ore, two ember crystals, two hardwood for the charcoal. Do this and I'll see you leave with something worth the carrying.",
      log: "Bring Bram 5 iron ore, 2 ember crystals, and 2 hardwood.",
      doneText: "Look at that heat! Take this - a tonic of my own tempering, and worth more than its weight. The rest becomes something the mainland will hear about."
    },
    "wolffold": {
      brief: "Six slime-trails around the fold this morning. SIX. The meadow nest's grown bold since the warm snap - and they spook the flock something awful. Thin them before I lose a single lamb to a stampede.",
      log: "Squash 6 slimes (the meadow to the east, and the smuggler's cove).",
      doneText: "Six less to ooze about. The flock thanks you - loudly, at dawn, forever."
    },
    "feast": {
      brief: "Before you sail we're doing this PROPERLY: a farewell feast. Three loaves, three orchard apples, two fresh fish. I'll handle the rest - and no, you can't eat the ingredients on the way.",
      log: "Gather the feast: 3 bread, 3 orchard apples, 2 fish.",
      doneText: "Perfect! Tonight we eat like the harvest never ends. You'll be missed, you know."
    },
    "echoes": {
      brief: "Three pages barely wet your feet, apprentice. The isle keeps at least seven echoes of its history - in homes, on stones, in places warm and cold. Read seven and you'll leave here knowing WHERE you've been.",
      log: "Read 7 lore writings across the isle (books, standing stones, the crypt...).",
      doneText: "Seven echoes! You now know this island better than most who were born on it."
    },
    "gravelord": {
      brief: "The Hollow Spirit had a herald - Varek, his gravelord. My wards report the old bones knitting back together in the ruins. Put him down before he finishes what his master started. And take Bram's yew bow - old bones splinter under arrows, half again as deep.",
      log: "Slay Gravelord Varek in the Old Ruins.",
      doneText: "Varek, unmade. The ruins will finally hold nothing but memory. You've the makings of a legend, you know."
    },
    "necklace": {
      brief: "Mama's birthday is after you sail, and she always says the sea gives the best gifts. Six spiral shells and... a real PEARL? Fishers say they hide in the deep casts. Please?",
      log: "Gather 6 spiral shells and 1 pearl (a rare catch while fishing).",
      doneText: "A REAL PEARL! She's going to cry. Happy crying! You're my favorite person who isn't Mama."
    },
    "profit": {
      brief: "Commerce keeps a village breathing, traveler. Sell twelve goods across my counter - fish, timber, pearls, whatever the isle yields - and I'll teach you the trick of mainland haggling.",
      log: "Sell 12 items to Elder Maren.",
      doneText: "Twelve sales, fairly struck! Here - and remember on the mainland: never take the first price."
    },
    "sharpen": {
      brief: "That rusty letter-opener of yours won't cut butter. Bring me 5 wood and 3 stone - there's a pine stand south of the village and a stone outcrop up the north road - and I'll forge you a proper iron sword.",
      log: "Bring Bram 5 wood and 3 stone.",
      doneText: "Stand back- *CLANG* -there. Iron, balanced, and mean. Try not to lose it."
    },
    "slimes": {
      brief: "Slimes have gone and claimed the east meadow - Willa's cows won't graze. Squash four of them and I'll see you right.",
      log: "Defeat 4 slimes in the meadow east of the village.",
      doneText: "Not a drop of goo on you! Willa's cows can graze again - here's coin for a clean job, and my thanks."
    },
    "fish": {
      brief: "Tide's kind today. Grab a spot on the dock where the water ripples, cast, and strike the moment you feel a bite. Three fish feeds my family - keep any extra.",
      log: "Catch 3 fish at rippling water. Interact to cast, again on the \"!\"",
      doneText: "Beautiful catch! You've got dock-hands, friend. Take these tonics - brewed them from sea kelp myself."
    },
    "harvest": {
      brief: "Soil's turned and begging for seed. Take these - plant them in the tilled plots, and wheat grows quick as gossip on this island. Harvest four bundles for me.",
      log: "Plant seeds in Willa's plots and harvest 4 wheat.",
      doneText: "Look at that gold! You keep half, that's farm law. Come plant whenever you like."
    },
    "cat": {
      brief: "My cat Pip chased a moth into the Whisperwood and never came back! He's orange and he's the BEST cat. Please find him? He likes tall trees…",
      log: "Find Pip the cat in the Whisperwood, west of the village.",
      doneText: "PIP! You found him! Thank you thank you thank you! Mama says these red drinks fix everything."
    },
    "mushrooms": {
      brief: "Hm. You move like someone who has never once had to move fast. That will get you killed in the ruins. Fetch me three bluecap mushrooms from the Whisperwood - they only glow where the shade is honest - and I will grind them into a draught that quickens the blood. Then I will teach your feet the one lesson worth more than any blade.",
      log: "Gather 3 bluecaps from the Whisperwood for Orin.",
      doneText: "Bluecaps crushed, essence bound, and down it goes… there. <i>He walks you through it twice in the tower yard - a low push off the back foot, a breath of speed, and gone before the blow lands.</i> That is the DASH. <i>He studies you a moment longer than is polite.</i> Fearless, curse-broken, washed up without even a name… I do not spend this old trick on just anyone. Take those quick feet down to Elder Maren - tell her old Orin says you're ready for the Hollow Spirit. A sword is only half of what a fighter owes their feet."
    },
    "skeletons": {
      brief: "The old ruins north of my tower are rattling again. Skeletons - rude ones. Put three of them back to sleep and I'll give you a charm I've been saving for someone reckless.",
      log: "Destroy 3 skeletons in the Old Ruins, north of the tower.",
      doneText: "Quieter already. This ember charm rides your strikes - every blow burns a little brighter now."
    },
    "king": {
      brief: "Rask says you can turn a blade, and Orin says your feet are quick - after a single WEEK ashore? <i>Elder Maren's brow climbs.</i> Neither man warms to strangers, and here they both stand vouching for you. They must see something in you... and neither is a fool. All right, then: put down the <b>Hollow Spirit</b> that woke in the old north graveyard - the curse that took your ship and sealed our strait - and I'll speak the warded gate open for you.",
      log: "Elder Maren will open the warded gate: defeat the Hollow Spirit in the old graveyard at the isle's north tip.",
      doneText: "The lanterns burn brighter tonight because of you. Rise, traveler - Champion of Emberwick. The isle is free, the Hollow Spirit's curse breaks with him, and the strait beyond lies calm at last - a ship can finally make the crossing."
    },
    "welcome2": {
      brief: "New boots off the Emberwick ferry - I can smell the tutorial on you. Barik's bigger, hungrier, and less forgiving. Get provisioned before you get ambitious: Sela runs the counter south of the well. Tell her the Warden sent you.",
      log: "Introduce yourself to Sela the Provisioner in Greyharbor.",
      doneText: "Kell sent you? Then you're either useful or doomed. Let's find out which - Barik has work for both kinds."
    },
    "nets": {
      brief: "The trawlers won't round the point while wolves haunt the cliff road, so my counter's bare. Six fresh fish from any Barik shallows keeps Greyharbor fed a week.",
      log: "Catch 6 fish in Barik's shallows for Sela.",
      doneText: "Fat ones, too. The harbor eats tonight - and pays this morning."
    },
    "roadclear": {
      brief: "The road from Greyharbor to Blackpine belongs to the wolves after dusk. Eight pelts thins the packs enough for the carts to run. Mind the crimson-ringed ones.",
      log: "Slay 8 wolves along Barik's roads and highlands.",
      doneText: "The carters are already singing about it. Off-key. Greyharbor thanks you properly: in coin."
    },
    "hedda1": {
      brief: "Harvest crew works dawn to dark and eats like it. Bluecaps from Blackpine make the only stew worth the name. Six caps and you'll eat with us besides.",
      log: "Gather 6 bluecap mushrooms from Blackpine Reach for Hedda.",
      doneText: "Smell that? That's Barik in a pot. Take your share and your coin."
    },
    "hedda2": {
      brief: "Every wet season the Mirefen leaks its muck-things into my east rows. They eat seed, root, and hope, in that order. Six burst slimes buys my fields a season.",
      log: "Destroy 6 slimes around the Mirefen and Farmsteads.",
      doneText: "Rows are clean, seed's safe, and I owe you more than coin. See that chestnut cob by the paddock? Old plough-horse, sound legs, and bored to tears since we went over to oxen. He's yours - Chestnut answers a whistle, and I'll stable him here whenever you've no need of him. Go on, a farmhand like you has ground to cover."
    },
    "torv1": {
      brief: "Three generations of Barik built with stone from these shafts - then the wilds took the road and the pit went quiet. Help me clear the mouth: ten good stone proves the vein still gives.",
      log: "Mine 10 stone around the Old Barik Mines for Torv.",
      doneText: "Listen to that ring. The old girl's awake. Barik builds again - starting with your pay."
    },
    "torv2": {
      brief: "Stone keeps walls up; ore keeps forges lit. The deep rock here still carries iron if you've the arm for it. Four ore and Greyharbor's smith stays in business.",
      log: "Break 4 iron ore from Barik's stone for Torv.",
      doneText: "Good iron. Honest iron. The kind that remembers being a mountain."
    },
    "ivo1": {
      brief: "Ground shell, kelp ash, and patience - tidebalm knits cuts the sea gives. The strand west of the docks throws up shells after every tide. Five whole ones, unbroken.",
      log: "Collect 5 shells from Barik's beaches for Ivo.",
      doneText: "Unbroken, every one. You'd make a fair herbalist if the sword ever bores you. Balm's share is yours."
    },
    "ribbon1": {
      brief: "East past the shoals sits an island the charts pretend not to see. Bring my girl Wren a fine ribbon for her birthday and I will sail you there myself. Mira at Thimble and Thread in Greyharbor weaves the best on Barik.",
      log: "(1/3) Ask Mira the Seamstress in Greyharbor about a ribbon.",
      doneText: "A ribbon? I would love nothing more, truly. But my whole silk shipment was taken on the north road. Brigands nest in the pines north of Blackpine now, and my silk sits in their camp. I cannot say when more will come. Here - take a couple of tonics for the road; the pines are no place to go dry."
    },
    "ribbon2": {
      brief: "If you can walk into that camp and walk out again: my silk sits in a chest they guard, north of the deep pines. Bring me one bolt and I will weave the finest ribbon Barik has seen.",
      log: "(2/3) Steal back a bolt of silk from Thieves' Hollow, north of Blackpine.",
      doneText: "Dawn-colored, and not a thread pulled. Give me a moment... there. A Sunset Ribbon, and my thanks stitched into it."
    },
    "ribbon3": {
      brief: "You have it? Wren will be over the moon and halfway back.",
      log: "(3/3) Bring the Sunset Ribbon to Captain Corvo at the east cove.",
      doneText: "She will wear it till the color goes. A bargain is a bargain - and the tide is with us NOW. Say the word, any time, and we run east for the Sunward Isle."
    },
    "hunt1": {
      brief: "The bristlebacks breed quicker than the palms can feed them, eh, and now they are into our gardens. Thin the sounder for me - six boars - and Kohana eats easy either way. No rush about it.",
      log: "Hunt 6 bristleback boars in Palmwatch Grove or on the ash slopes.",
      doneText: "Six, clean - you hunt like you mean it, friend. Come see me when you are ready to meet Kiko. She only takes to folk who can keep her pace."
    },
    "tame1": {
      brief: "Kiko is a moa - tall as a door, quicker than gossip. She will carry a friend, and friendship with Kiko runs exactly three crisp apples. Barik orchards grow them; so does a lucky axe swing. Take your time.",
      log: "Bring Huk 3 orchard apples to win over Kiko the Moa.",
      doneText: "Ha - she likes you. That is settled, then. Kiko is yours to whistle for - press M, or just ask me, and hold on with your knees."
    },
    "surf1": {
      brief: "I'd shape you a windsurf gladly - but there's no stormcloth this side of Windsurf Isle, and a board's a plank without a sail. Bring the timber and a crystal and I'll ready you a blank; the sail you must find across the cloud-sea.",
      log: "Bring Kaia 8 wood and 1 ember crystal for a board-blank. (The true windsurf waits on Windsurf Isle.)",
      doneText: "There - a good blank, cured and waiting. But bare it stays till you find a proper sail on Windsurf Isle. The wind's a road, friend - it just runs the long way round."
    },
    "board": {
      brief: "Face the beast in the strait? Not off Rell's jetty you won't - it only reaches so far, and that thing swims. You'll want a windsurf, and I'm the only hand on this rock who can shape one. Bring me six lengths of good timber and three big spiral shells to inlay the rails, and I'll shape you a board fit for that killing water. The sail's another matter - but one thing at a time.",
      log: "Bring Tolen the Whittler 6 wood and 3 spiral shells so he can shape you a windsurf board. (Chop the palms; comb the beach for shells.)",
      doneText: "There she is - rails inlaid, deck sanded smooth. Fine board, if I say so. Only she's bare, and no board crosses that strait without a sail... and I've none fit for it. The last stormsail on this rock is <b>Nessa the sailmaker's</b>, locked in the old grinding works BENEATH THE WINDMILL since the gear-train jammed. Burl left the key with me for just such a day - here, take it. Now go see <b>Nessa</b>: it's her sail down there, and she'll tell you what fouled the works. Bring it up and she'll step it to your board."
    },
    "sail": {
      brief: "So Tolen shaped you a board - then it's my sail you'll be needing, and there's the rub. My last good stormsail is locked in the old grinding works BENEATH THE WINDMILL, behind the millstone gate, and has been since the gear-train seized a season back. And it wasn't rust that stopped it - something got FOULED in the shaft down there and won't lie quiet. Take Tolen's key, go down, put the thing down, and bring my sail up. Do that and I'll step it to your board myself.",
      log: "Descend the Undermill beneath the windmill. Defeat the guardian fouling the works to raise the millstone gate, and carry Nessa's stormsail back up to her.",
      doneText: "You brought it up - my own stormsail, whole and dry, after all this time. Hold still and I'll step it to your board now... there. She'll fly true. Then it's Rell you want, and that cold thing past the breakwater."
    },
    "tide": {
      brief: "You feel it in the water, past my breakwater - a wrongness, cold and patient. No hull has crossed since it woke, and Windsurf is starving for want of a sail. It is no natural beast; it moves like something bound. Walk the jetty and face it, friend - end this, and you give this whole city back its sea.",
      log: "Confront the Bound Leviathan at the harbor breakwater and end the curse on the strait.",
      doneText: "The water's a mill-pond and the boats are already casting off. You didn't just kill a monster - you handed a dying city its livelihood. Windsurf will tell this one for a hundred years."
    },
    "breakers": {
      brief: "The strait's open, the guests are trickling back, and I mean to give them a Breakers worth the crossing! But a year shuttered leaves a place threadbare. Bring me two bolts of good silk for fresh linens and four big spiral shells to dress the baths, would you? Do that, and I'll not only pay you - I'll keep our finest suite made up for YOU, on the house, for as long as you sail these waters.",
      log: "Bring Coralie 2 silk and 4 spiral shells to refit The Breakers. (Silk from traders/the market; shells comb the beaches.)",
      doneText: "Oh, they're PERFECT - the linens, the shells along the bath-rim, the whole place breathes again. Here's your pay, and here's your key: the sea-window suite is yours whenever you want it. Welcome home to the Breakers, friend."
    },
    "roost": {
      brief: "Since the robed man climbed the Underclimb and never came down, my birds would sooner kill than land. It is no fever, friend - it is a binding, and it sits in a book at the heart of the roost, behind a warden with far too many teeth. The open slope will end you. Take the tunnel up. Burn the thing. Give me back my sky.",
      log: "Take the Underclimb tunnel up into the sealed Roost Heart. Slay the serpent warden, then destroy the cursed tome.",
      doneText: "The screaming stopped, and my old grey hen landed on my shoulder like nothing was ever wrong. You gave a whole island back its sky. There is no thanks big enough - but here is what I have, and it is yours."
    },
    "thaw": {
      brief: "Our Warden kept these winters KIND for a hundred years - deep snow and thick safe ice, seals on the floes and fish beneath them. Then the robed man walked onto the glacier and the weeping stopped, and the cold turned cruel and dead. It is bound, not turned. Climb the ice road, break whatever holds it, and give the old thing back its tears - and Hearthhold its living winter. We are freezing to death down here.",
      log: "Climb to the Weeping Glacier and free the bound ice Warden to break the cursed cold. (Lv 13 - dress warm.)",
      doneText: "Water in the strait and tears on the glacier - you gave us back our guardian and our sea in one stroke. Hearthhold will drink your name warm for a generation. Take this, and our thanks."
    },
    "audience": {
      brief: "You are the one, aren't you - the traveler unmaking the old curses, isle by isle. Word of it reaches the throne faster than any ship. His Majesty King Aldous would look upon the curse-breaker himself. He holds court within the Tideglass Palace. Gain the hall and present yourself. One does not keep a grieving king waiting.",
      log: "Enter the Tideglass Palace and present yourself to King Aldous in the throne hall.",
      doneText: ""
    },
    "kitchenrun": {
      brief: "You there - steady hands and no livery, perfect. My cart-boy's abed with the sweats and the palace kitchen is howling for this crate before the King's supper. The gate guards know my crate; carry it up the Processional and they'll wave you through the tradesman's door. Slip it to Nan the cook and you'll have done the crown a quiet favor - and earned the run of the gate besides.",
      log: "Carry Odo's crate up to the Tideglass Palace and deliver it to Nan in the kitchen.",
      doneText: ""
    },
    "lettuce": {
      brief: "You there, with the boots and the free afternoon! A warren of hares has decided my lettuce beds are the royal buffet - and the King does love his green. I can't chase and weed both. Shoo three of the little thieves off the beds for me - a firm bonk sends them bolting, no harm done - and I'll load you with the crispest heads in Aldermere.",
      log: "Shoo 3 garden hares off the lettuce beds by the Drowned Queen's Garden.",
      doneText: "Ha! Look at them run! The beds are mine again - for tonight, anyway. Here, straight from the good rows. Tell Nan in the palace kitchen they're from Gale, she'll know what to do with them."
    },
    "wyrm": {
      brief: "You feel the heat off the mountain? A wyrm nests in the fire-heart, deep under the caldera - old, and lately black of heart. It will render Kohana to ash by the next storm, mark me. Climb the ash road, take the fissure DOWN into the Emberdeep, and put the beast down at the bottom. A wanderer pays well for a dead dragon - I have coin, and reasons of my own.",
      log: "Climb Mount Kea, descend the caldera fissure into the Emberdeep, solve its three locks, and confront the wyrm at the end. (Lv 8+ recommended.)",
      doneText: "Ashwing sleeps easy now, and so does Kohana."
    },
    "vhunt": {
      brief: "That robed one - Vath, he calls himself - was never a friend to Kohana, eh. Drive him from the grove before he binds another soul, then come and sit, and we will call it square.",
      log: "Confront Vath the enchanter in the palm grove and drive him off.",
      doneText: "Slipped you like water through a fist, did he? Aye - his kind always does. But you had him on his knees, and the isle breathes easier for it. He will surface again somewhere; when he does, you will be ready. Take this, with Kohana's thanks."
    },
    "feud1": {
      brief: "My cousin of the Vael March styles himself a king and pays raiders in my own minted coin. Six of his red hoods driven from my roads will remind him whose realm feeds his. Go armed, traveler - they are Lv 12 men and proud of it.",
      log: "Drive off 6 Vael Raiders in the north-east March.",
      doneText: "Six hoods emptied. My cousin will sulk for a season - Barik thanks you in gold and in standing. But the March still has a spine: the man who holds his war-tent. Come back when you have the stomach for him."
    },
    "feud2": {
      brief: "Driving off his hirelings only bloodied my cousin's nose. The March will not kneel while his <b>Castellan</b> holds the war-tent - a captain worth ten raiders, and he knows it. Go to the north-east March, call the man out, and put his standard in the dirt. Come ready, and come armored.",
      log: "Confront and defeat the Castellan of the Vael at the war-tent in the north-east March. (Lv 14 - come ready.)",
      doneText: "The Castellan down and the standard fallen? Then the March is mine in all but name, and my cousin has no sword left to hide behind. Barik will remember this - and so will I. Take a captain's due."
    },
    "sting1": {
      brief: "The Sunscour breeds armored horrors that drag off goats, carts, and the occasional tax collector. Cull five. I am told their shells turn all but the truest blows - Lv 13, my wardens reckon.",
      log: "Slay 5 Sunscour Scorpions in the desert valley.",
      doneText: "Five stingers for the trophy wall. The caravans will run the valley road again - carefully."
    },
    "duchesslove": {
      brief: "May I trust you with something that is not a war? There is a man on the Sunward Isle - Lord Elias, a scholar of tides. We have written to one another for three years and met in person not once, the strait being what it was. Now that you have opened the water, carry him this.<br><i>(She presses a wax-sealed letter into your hands, and does not quite meet your eye.)</i> Put it in his hand, and no other.",
      log: "Carry the Duchess’s sealed letter to Lord Elias on the Sunward Isle.",
      doneText: ""
    },
    "duchessreply": {
      brief: "",
      log: "Bring Lord Elias’s reply back to Duchess Maelis in Barik Keep.",
      doneText: ""
    },
    "undermaw1": {
      brief: "East of the Mirefen the ground splits - the Undermaw, we call it. Miners' tales say a hoard sleeps inside, guarded by bone-kin who never liked daylight. Find the mouth. What you do after is between you and the dark.",
      log: "Find the Undermaw, east of the Mirefen. (Lv 10+ recommended.)",
      doneText: "You found it and kept your skin - that's rarer than the gold. Whatever you carried out, you earned."
    },
    "bounty": {
      brief: "The wilds have turned. Crimson-ringed beasts - elites, we call them - press on the road every season. Cull eight of them: wolves on Wolfcrag, bones in Barrowfield, muck-things in the Mirefen. Greyharbor pays well.",
      log: "Slay 8 elite beasts anywhere on the mainland.",
      doneText: "Eight heads' worth of quiet. The road breathes easier - and so do I. Greyharbor's coin, as promised. If you're still hungry, the Peak keeps its own secret."
    },
    "springs": {
      brief: "My grandmother swore there were warm springs in the western hills - water that closes wounds. I'm too old for the walk and too stubborn to admit it. Find them for me. Just… find them.",
      log: "Discover the Ember Springs in the isle's western hills.",
      doneText: "You FOUND them. Warm as a kettle, she used to say. Go soak whenever the island bites you - and take this for an old woman's peace of mind."
    },
    "cove": {
      brief: "There's an old smuggler camp on the northeast point - good iron in that chest, if the tales hold. Trouble is, a nest of slimes has oozed in and claimed it. Squash three of them and the cove's yours to pick clean.",
      log: "Squash 3 slimes at Smuggler's Cove and claim the camp.",
      doneText: "Three less to ooze about. The cove's yours, friend - crack that chest open and think of me."
    },
    "orchard": {
      brief: "The old orchard south-east still fruits - nobody's picked it since the king went hollow. Five good apples and I'll bake you something worth the walk. Mind the branches; they drop hard.",
      log: "Pick 5 apples in the Old Orchard.",
      doneText: "Look at the color on these! The oven's already hot. Here - first loaves are yours, and the orchard knows your hands now."
    },
    "shells": {
      brief: "Pip found a SHELL and it's the best thing I own. I need more! The beach hides spiral ones - bring me four and I'll trade you my second-best treasure. It's gold. Don't tell Maren where I got it.",
      log: "Gather 4 spiral shells from the beaches.",
      doneText: "FOUR! Look how they curl! Here - treasure for treasure. That's the rule of the beach."
    },
    "pearlq": {
      brief: "Thirty years I've fished this bay, and once - ONCE - I pulled up a pearl the size of a thumbnail. Dropped it in the drink showing off to Willa. Bring me one and I'll pay like a man buying back his youth.",
      log: "Catch a pearl while fishing (fishing skill improves the odds).",
      doneText: "There she is… no, keep your coin ready - HERE'S yours. Worth every piece to hold one again."
    },
    "remember": {
      brief: "Three texts survive on this isle: my tower's Ember Wars, Maren's Songs of the Well, and a farmer's almanac gathering dust in the barn. Read them, copy a page from each, and I'll pay you in something better than gold - understanding. Also crystals.",
      log: "Read the books inside the tower, Maren's cottage, and the barn (step inside and Read).",
      doneText: "The Ember Wars… the Well… the Almanac's warning. It all points to the same truth: this island forgives, but it never forgets. Take these - they remember being warm."
    },
    "embers": {
      brief: "Winter watches are long and the braziers burn cold. Ember crystals hold heat like a grudge - three of them would warm the watchtower till spring. Mine the ruin-stone at Barrowfield or the Wolfcrag.",
      log: "Mine 3 ember crystals from stone near Barrowfield or Wolfcrag.",
      doneText: "Warm at last. The night watch drinks to you tonight - and Greyharbor pays its debts."
    },
    "mossbrew": {
      brief: "Visitors! Rare as dry socks out here. The blackpine bluecaps glow kinder than the isle's - four of them and I'll share the batch I'm brewing. A hermit's word is oak.",
      log: "Gather 4 bluecap mushrooms in the Blackpine Reach for Moss.",
      doneText: "Kind hands, kind harvest. Here - three bottles, brewed slow. And drink this thimble now: my quickroot draught. Your legs will remember it when one dodge is not enough."
    },
    "alpha": {
      brief: "The elites answer to something. Greymaw - a wolf the size of a cart, eyes like coals. It dens high on Wolfcrag. Kill it, and the packs scatter for a generation. This is no bounty, adventurer. This is a hunt.",
      log: "Slay Greymaw, the Alpha, atop Wolfcrag Highlands.",
      doneText: "By the tides... you actually did it. The howling stopped last night - now I know why. Greyharbor will sing of this. Take the purse, hero. You've earned the name."
    },
    "pendant": {
      brief: "The King's charge rings in your ears - find Vath, find his son. And that pendant at your throat unsettled him as it once unsettled Maren. Sail back to Emberwick and lay it before Sage Orin; if any hand can read old work, it is his.",
      log: "Sail to Emberwick and show the pendant to Sage Orin at his tower.",
      doneText: "<i>Orin turns the medallion once in the lantern-light - and chuckles, low and knowing.</i> Ho ho... I wondered when you'd come back, wearing that. You've done well, freeing the isles of Vath's wicked influence. <i>He folds your fingers gently back over it, then reaches into the clutter of his desk and draws out a rolled sea-chart, its wax seal long broken.</i> One thing more - a gift, and a burden with it. A chart to an isle off the edge of every map I own: <b>Stormreach</b>, a lone rock under a storm that never breaks, far past anywhere Vath's hand can reach. <i>He presses it into your palm and holds your gaze.</i> When you've stood before the King - whatever passes in that hall - you sail there next. Ask me no more; some things a soul must come to on its own. <i>He straightens, the moment passing.</i> Now - go and show that necklace to the Woodworker, down by the green. Just that, nothing more. You might yet free both of you from this affliction."
    },
    "enchanter": {
      brief: "Go down to the green and seek out the Woodworker. Show him the pendant - only that, nothing more - and let happen what will. I'll not spoil it by naming it; some things a soul must come to on its own. Go, child. Trust these old bones: this is a door you have carried the key to all along.",
      log: "Show the Woodworker the pendant on Emberwick, and let him see the face behind the mask.",
      doneText: ""
    },
    "homecoming": {
      brief: "Your brother the prince walks free at last - and Vath means the throne now, and the Tideglass magic in your father's blood. Take ship for Aldermere and bring both of you before King Aldous, before the enchanter reaches him first.",
      log: "Bring the prince before King Aldous in the Tideglass Palace, Aldermere - before Vath does.",
      doneText: ""
    },
    "hoarfrost": {
      brief: "You've heard me fret over the white bear out on the Rimewood flats - Hoarfrost, denned in the old ice-cave, and no hunter who went looking has come back to argue. It guards that hole like it hates the whole world. Put the beast down before it comes for Hearthhold - and whatever it hoards below is yours by right.",
      log: "Slay the Hoarfrost Bear on the Rimewood flats, east of Hearthhold. (Its den opens the Glacier Vault below.)",
      doneText: "The Hoarfrost, DOWN? Then Hearthhold sleeps sound tonight, first time in a season. Take my thanks and a warm bowl on the house - and mind the stair that beast was guarding."
    },
    "rimebound": {
      brief: "Past the bear's den, down in the Glacier Vault, something older stands frozen mid-stride - a colossus of blue ice, wound in the same violet frost that took the Weeping Warden. Vath's work, unmistakable. It is no monster; it is a prisoner. Break the binding, free the poor giant, and let it rest at last.",
      log: "Descend the Glacier Vault and free the Rimebound from Vath's enchantment.",
      doneText: "The violet frost let go? Then it is at peace - and so, a little, am I. Two of Vath's cruelties undone on our ice alone. The Hoarfrost Hoard is yours; you paid for it in cold."
    },
    "stormroc": {
      brief: "Feel that wind? That is HER temper. The Storm Roc has ruled this cloud-rock since my grandfather's day, and of late she suffers no guest in her sky - takes ships, takes sail, takes the odd fool who climbs too high. She is no one's road home, mind - the way DOWN runs along the bird's rainbow. But if your blade itches for a true terror, face her on the eyrie. Best her, and the Cloudreach will sing your name.",
      log: "Optional: defeat the Storm Roc on her eyrie atop the Cloudreach.",
      doneText: "She is DOWN? By every wind - the Roc herself, felled! The cloud-folk will tell that tale for three generations. You have earned the name Skyward, and a hero's share of her hoard besides."
    },
    "barrowbrute": {
      brief: "Look about you, traveler - we did not choose this wreck-strewn shore. We STAYED, because the Barrow Brute walks the barrow road and no boat we launch outlives the reef while it lives. Put the great brute back in its barrow. Do that, and Stormreach is a port again - and some of us go home.",
      log: "Hunt down the Barrow Brute on the barrow road above Stormreach.",
      doneText: "The whole coast felt it fall. You have given a hundred stranded souls their sea back. Tibb is already at the water with fresh timber - and we will name a cove for you, the least a grateful shore can do."
    },
    "drownedwarden": {
      brief: "There is a stair under the drowned graveyard, and a great bull-headed brute wardening the vault below - the Drowned Minotaur, my grandfather's grandfather sealed it in and told us never to dig. But the old ward still guards the deep: the Ossuary floor is a lock of bone-stones, and a dead thing dances you the key. Tread its steps true, chamber by chamber, and the Bone Gate opens. Go down, put the beast's horns in the dirt, and let us bury our dead in peace.",
      log: "Descend into the catacomb beneath Stormreach, tread the Ossuary's ward-dance, and put down the Drowned Minotaur.",
      doneText: "The whole warren went quiet when it fell - I felt the floor settle. The bone-stones lie dark and the way stands open now, and the salvage is ours at last. Take a raftwright's thanks, and this tonic, salvaged from the vault it guarded."
    },
    "windRestore": {
      brief: "Look at my harbour, traveler - half of it under water that has no business being there. The old waterwheel spun itself to ruin and burst its race, and a wind that will not die has driven the sea up over Waterwheel Row and a whole north-yard district besides. It is no natural gale; it is a thing, denned in the spire that tore open at the wheel's foot. Go down into the Gale Spire and still whatever howls in it. Till then Windsurf drowns by inches.",
      log: "Descend the Gale Spire at the ruined waterwheel and still the maddened wind, and Windsurf's flood will drain.",
      doneText: "The wind just... stopped. Dead calm, for the first time in weeks - and look, the water's pulling back off the Row already. You've given us our isle back, and the yard the flood stole with it. Windsurf won't forget the day you walked in under that Veil."
    },
    "sunRestore": {
      brief: "You feel the ground, child? Mount Kea has not slept a single night since the robed man's shadow fell on us. It burns without pause - lava down every slope, ash on every breath - and it is no mere eruption. Something has been stoked in the mountain's heart, in the forge-fissure that split the south face. Go down into the Ashen Forge and quench whatever fans that fire, or Kea will bury the Sunward Isle in cinders.",
      log: "Descend the Ashen Forge on Mount Kea's south face and quench the spirit stoking the eruption, and the mountain will settle.",
      doneText: "The mountain is quiet. QUIET - do you hear it? No grumble, no gout of fire. The ash is thinning already and the slopes are cooling under our feet. You have given the Sunward Isle back its mornings. Bless you, child, and take an elder's thanks."
    },
    "barikRestore": {
      brief: "You sailed from a green isle, and you come back to a drowned one. Vath's flood has swallowed the Mirefen and the whole farm-lowland east of here - Hedda's fields are a lake, and the folk that worked them are crowded onto the high ground. The water rises from a sinkhole up the reed-causeway, and it will not fall while the thing wardening the vault below still churns the deep. Go down into the Drowned Vault, put it down, and give Barik its shore back.",
      log: "Descend the Drowned Vault up the reed-causeway and fell the thing that churns the flood, and Barik's water will recede.",
      doneText: "The Warden's work is done - look east, the water's falling off the fields by the hour. The farmsteads will drain and dry, and Hedda can put a plough in real dirt again. You gave a drowned isle back its ground, and I'll see the whole of Barik hears whose hand did it."
    },
    "skyRestore": {
      brief: "This cloud has weathered every gale in living memory, but not this one - a storm settled over the Cloudreach the day the robed man's shadow reached us, and it will NOT break. Lightning walks the standing stones and splits them where they stand. It is caged thunder, traveler, penned in the temple that cracked open by the landing. Go down into the Storm Temple and let it out, or spend it, or do whatever a hero does - only make my sky clear again.",
      log: "Descend the Storm Temple by the landing and quiet the caged thunder, and the endless storm will break.",
      doneText: "It broke. The storm just - broke, clean away to blue, like a held breath let go. First clear sky over the Cloudreach in a season. You have my thanks, Skyward, and the whole cloud's besides - we thought we'd lost the sun for good."
    },
    "roses": {
      brief: "This garden is a memorial. The King planted it for his queen, lost to the sea thirty years gone, and I have tended it alone ever since. The sea took her; let the sea honour her. Six spiral shells for the border, one true pearl for the fountain's heart, and she will have the garden she was owed.",
      log: "Bring Isolde 6 spiral shells and 1 pearl for the Drowned Queen's memorial garden.",
      doneText: "Oh - a REAL pearl. It catches the light just as she used to. There. The King walks here some evenings; he will see it, and know that someone still remembers her. That is worth more than you know."
    },
    "larder": {
      brief: "A capital eats, traveler, and the strait's long closure left our larders thin. The stalls will pay honest coin for honest fare - six grilled fish and four fresh loaves to stock the Bazaar against a lean week. Do that and I'll cut you the crown's own rate.",
      log: "Bring Doran the Factor 6 grilled fish and 4 fresh bread for the Bazaar stores.",
      doneText: "Counted and crated - the stalls will bless your name by morning. Here is the crown's rate, and a little over for the legs it cost you."
    },
    "garrison": {
      brief: "The Garrison stands the capital's last wall, and thirty quiet years have rusted more than our blades. Eight lumps of good iron ore and two lengths of hardwood for the hafts - our own smith will strike the rest - and the armoury stands sound again. A soldier does not beg - so consider it a commission, soldier to soldier.",
      log: "Bring Captain Halvard 8 iron ore and 2 hardwood for the Garrison armoury.",
      doneText: "Good steel, well chosen. The Watch stands the sounder for it - and so does the King who sleeps behind our wall. Take a soldier's thanks, and a soldier's coin."
    }
  }
};

/* ---- wiring: push the text above onto the live NPCs and quests ---------- */
function _dlgIdleFor(npc){
  if(!npc || !npc.id) return null;
  const id = npc.id;
  const w  = (typeof G!=='undefined' && G.worldId) || '';
  const st = (typeof P!=='undefined' && P.story) || {};
  if(id==='perrin')  return (w==='crown') ? DIALOGUE.idleByWorld.perrin.crown : DIALOGUE.idleByWorld.perrin.isle;
  if(id==='brother') return (DIALOGUE.idleByWorld.brother[w]) || DIALOGUE.idleByWorld.brother.reach;
  if(id==='woody')   return st.royalGarb  ? DIALOGUE.idleVariant.woodyRoyal : DIALOGUE.idle.woody;
  if(id==='maelis')  return st.duchessWed ? DIALOGUE.idleVariant.maelisWed  : DIALOGUE.idle.maelis;
  if(/^cguard\d+$/.test(id)) return DIALOGUE.idle.cguard;
  if(DIALOGUE.farmers[id]) return DIALOGUE.farmers[id];
  return DIALOGUE.idle[id] || null;
}
// Overlay every present NPC's chatter from DIALOGUE, then layer the story-state
// mood chatter on top (Act I restoration, Act II curse, the post-audience capital).
// Call this LAST when a world is (re)entered - from switchWorld (after the built-in
// mood updaters) and from boot() - so DIALOGUE is always the final word.
function applyIdleDialogue(){
  if(typeof G==='undefined' || !G.npcs) return;
  const st = (typeof P!=='undefined' && P.story) || {};
  const w  = (typeof G!=='undefined' && G.worldId) || '';
  for(const npc of G.npcs){
    const lines = _dlgIdleFor(npc);
    if(lines && lines.length){ npc.idleLines = lines.slice(); if(typeof npc.li==='number' && npc.li>=lines.length) npc.li=0; }
  }
  // Act I restoration chatter (a later Act II curse below overrides it if the Veil is up)
  if(w==='wind'  && st.tideCalm)   applyRestoreMood('wind');
  if(w==='frost' && st.frostFreed) applyRestoreMood('frost');
  // Act II per-isle curse mood, gated on the Warding Veil
  if(st.vathVeil){
    if(w==='main') applyCurseMood('barik', !!st.barikDeepDone);
    if(w==='wind') applyCurseMood('wind',  !!st.galeDeepDone);
    if(w==='east') applyCurseMood('sun',   !!st.ashenForgeDone);
    if(w==='sky')  applyCurseMood('sky',   !!st.stormTempleDone);
  }
  // The capital, after the royal audience
  if(w==='crown' && st.kingTold) applyCrownMood();
  // Barik: while Vath's wardstone still boxes Hedda in, Kell & Corvo point you at it
  // (41-barik-ward.js). Re-applied here because we just reset every NPC's idle lines.
  if(w==='main' && typeof attachBarikWardRumours==='function') attachBarikWardRumours();
}
// Overlay quest brief/log/doneText. Called once at boot, after all QUESTS are defined.
function applyQuestDialogue(){
  if(typeof QUESTS==='undefined') return;
  for(const id in DIALOGUE.quests){
    if(!QUESTS[id]) continue;
    const t = DIALOGUE.quests[id];
    if('brief' in t) QUESTS[id].brief = t.brief;
    if('log' in t) QUESTS[id].log = t.log;
    if('doneText' in t) QUESTS[id].doneText = t.doneText;
  }
}
// Shared helpers the mood updaters in 12-world-layer.js delegate to, so their text
// lives here too. dmg/res picked by the isle's spirit-dungeon clear flag.
function _dlgSetLines(id, lines){
  if(typeof G==='undefined' || !G.npcs || !lines) return;
  const n = G.npcs.find(x=>x.id===id); if(n){ n.idleLines = lines.slice(); n.li=0; }
}
function applyCurseMood(isle, restored){
  const set = DIALOGUE.curse[isle]; if(!set) return;
  for(const id in set) _dlgSetLines(id, restored ? set[id].res : set[id].dmg);
}
function applyRestoreMood(isle){
  const set = DIALOGUE.restore[isle]; if(!set) return;
  for(const id in set) _dlgSetLines(id, set[id]);
}
function applyCrownMood(){
  for(const id in DIALOGUE.crown) _dlgSetLines(id, DIALOGUE.crown[id]);
}
