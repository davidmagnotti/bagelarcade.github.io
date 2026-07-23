/* =====================================================================
   DIALOG SYSTEM
   ===================================================================== */
const dlg = {open:false, npc:null};
function drawPortrait(npc){
  const c=document.getElementById('dportrait'), g=c.getContext('2d');
  g.clearRect(0,0,72,72);
  g.fillStyle='#20160c'; g.fillRect(0,0,72,72);
  g.save(); g.translate(36,66); g.scale(1.35,1.35);
  drawHumanoid(g,0,0,{...npc.look, size:npc.look.size||1, dir:{x:0,y:1}, step:0});
  g.restore();
}
function openDialog(npc){
  P.click=null;
  const dl=dist(P.x,P.y,npc.x,npc.y)||1;
  npc.face={x:(P.x-npc.x)/dl, y:(P.y-npc.y)/dl};
  dlg.open=true; dlg.npc=npc;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent=npc.name;
  drawPortrait(npc);
  buildDialogContent(npc);
}
function closeDialog(){ dlg.open=false; document.getElementById('dialog').style.display='none'; }
// A bazaar stall you can buy from - opens a standalone shop panel (no NPC).
function openStallShop(b){
  const sh=b&&b.shop; if(!sh) return;
  P.click=null; dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent=sh.name;
  // a little market-stall portrait: striped canopy over a counter of goods
  const pg=document.getElementById('dportrait').getContext('2d');
  const cA=['#b5423a','#2f6f7a','#5a4472'][(b.variant||0)%3];
  pg.fillStyle='#241a10'; pg.fillRect(0,0,72,72);
  for(let i=0;i<7;i++){ pg.fillStyle=i%2?'#e7ddc9':cA; pg.fillRect(2+i*10,12,10,15); }
  pg.fillStyle='#8a5a30'; pg.fillRect(8,44,56,20);
  pg.fillStyle='#c9a24e'; pg.beginPath(); pg.arc(20,52,5,0,TAU); pg.arc(36,52,5,0,TAU); pg.fill();
  pg.fillStyle='#7fb05b'; pg.fillRect(46,47,12,8);
  const rebuild=(msg)=>{
    const btns=sh.wares.map(w=>({label:'Buy '+ITEMS[w.item].name+' <b style="color:#ffd76a">'+w.price+'g</b>', fn:()=>{
      if(P.gold>=w.price){ P.gold-=w.price; giveQuiet(w.item,1); if(Snd.coin)Snd.coin(); refreshUI();
        rebuild('“Sold - one '+ITEMS[w.item].name+', and a fair price.”'); }
      else rebuild('“'+w.price+' gold, friend. The crown taxes us dearly.”');
    }}));
    btns.push({label:'Maybe later', ghost:true, fn:closeDialog});
    setDialog(msg || ('“'+sh.line+'”'), btns);
  };
  rebuild();
}
// Dialogue is authored as spoken lines wrapped in “curly quotes” with the odd
// <i>stage direction</i> woven between them. Present it as plain, naturally-
// flowing speech instead: drop the wrapping quotes and the italic stage-
// directions. Functional italics are kept - styled notes (<i style=…>) and
// parenthetical game notes like <i>(+1 Lore Page)</i> - then close the gaps.
function cleanSpeech(html){
  if(typeof html!=='string') return html;
  return html
    .replace(/<i>(?!\()[\s\S]*?<\/i>/gi,'')   // plain stage-directions only
    .replace(/[“”]/g,'')             // the “ ” speech quotes (HTML attrs use straight ")
    .replace(/ {2,}/g,' ')                      // close the gaps the removals leave
    .replace(/ +([.,!?…])/g,'$1')               // no space before sentence punctuation
    .trim();
}
function setDialog(text,btns,raw){
  document.getElementById('dtext').innerHTML = raw? text : cleanSpeech(text);
  const bx=document.getElementById('dbtns'); bx.innerHTML='';
  btns.forEach(b=>{
    const el=document.createElement('button');
    el.className='btn'+(b.ghost?' ghost':'')+(b.cls?' '+b.cls:''); el.innerHTML=b.label;
    el.onclick=()=>b.fn(); bx.appendChild(el);
  });
}
function buildDialogContent(npc){
  // Castellan of the Vael: once you carry Maelis's writ (feud2), calling on him
  // is a challenge - a taunt, then a boss fight. Otherwise he only warns you off.
  // A first-hour necklace moment: rare, short, and never explained (until Act 3).
  if(npc.id==='maren' && P.story && !P.story.marenNecklace){
    P.story.marenNecklace=1;
    setDialog('<i>Elder Maren\'s eyes catch the pendant at your throat and hold there a beat too long.</i> “…Odd thing, for a castaway to wash up wearing. Old work. Fine work - finer than these shores have seen.” <i>Then she looks to the sea, and says no more of it.</i>',
      [{label:'Continue', fn:()=>buildDialogContent(npc)}]);
    return;
  }
  // The Royal Audience - a scripted scene that opens Act III. The King receives
  // the curse-breaker, his gaze snags on the pendant (rare, short, unexplained),
  // and he tells the tragedy that binds Vath to the throne, then charges you.
  if(npc.id==='aldous' && qs('audience')==='active'){
    const p3=()=>{
      setDialog('<i>He turns the truth over like a blade carried too long.</i> “The curses across my isles - the wyrm, the leviathan, the aerie, the weeping strait - are all one hand\'s work. His. I\'d know Vath\'s bindings anywhere; he learned them at this court. He did not drown thirty years ago. He\'s been out there all this time - and my son with him, or my son\'s grave.” <i>The King rises.</i> “I cannot send armies against a ghost. But you walk where he walks and unmake what he makes. Find him, traveler. Find what became of my boy.”',
        [{label:'I will find him.', cls:'gold', fn:()=>{
            P.story.kingTold=1; P.story.act=Math.max(P.story.act||1,3);
            completeQuest('audience');
            if(typeof updateCrownFolkMood==='function') updateCrownFolkMood();
            banner('ACT III','THE ENCHANTER\'S TIDE');
            // launch the finale trail: the pendant is the thread. Send the player
            // back to Orin on Emberwick to have it read.
            if(!P.quests.pendant){ P.quests.pendant='active'; P.prog.pendant=0; }
            setTimeout(()=>toast('<b style="color:var(--ember)">The pendant is the thread.</b> Sail back to <b>Emberwick</b> and show it to <b>Sage Orin</b> at his tower.',7000),2600);
            setDialog('<i>The King presses a heavy purse and a folded writ into your hands, his seal in blue wax.</i> “Then you are my hand abroad. Every gate in Aldermere opens to that seal. Bring him to me, or bring me the truth. I have waited thirty years; I can wait a little longer, now that someone is looking.”',
              [{label:'Continue',fn:()=>buildDialogContent(npc)}]);
        }}]);
    };
    const p2=()=>{
      setDialog('“Thirty years past, I had a wife I did not deserve and a son not yet a season old. My queen wished to show the boy her mother\'s isles - Emberwick, past the eastern shoals. My court enchanter chose the ship and sailed with them to see them safe. His name was <b>Vath</b>.” <i>His jaw tightens.</i> “A storm took the ship off the shoals. We recovered timbers and grief, nothing else. I buried three empty coffins and called Vath a loyal man drowned in my service.”',
        [{label:'…And now?', fn:p3}]);
    };
    setDialog('<i>The King\'s eyes catch on the pendant at your throat, and something crosses his face like a cloud over the sun.</i> “That medallion. Where did you—” <i>He stops himself.</i> “…Forgive me. An old man sees the dead in every stranger\'s face. You are the curse-breaker. Sit. Let me tell you why the sight of you unsteadies me.”',
      [{label:'Listen', fn:p2}]);
    return;
  }
  // === ACT IV scripted scenes ===========================================
  // Nudge: Orin has read the ward and named the Woodworker, but the player hasn't
  // taken up the hunt yet - a gentle pointer back to Orin without spoiling anything.
  if(npc.id==='woody' && P.story && P.story.wardRead && !P.story.vathBound
     && !P.story.vathCame && qs('enchanter')!=='active'){
    setDialog('<i>The Woodworker hums that same wandering tune and crowns his woodpile with the five-point star, easy as breathing.</i> “Back again? You keep looking at me like you mislaid something. <b>Sage Orin</b>’s your man for mislaid things - old books, old riddles. He had that same look, last you two spoke.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // The Woodworker, shown the pendant: the ward cracks his binding and draws
  // Vath out for his final stand on the Emberwick green.
  if(npc.id==='woody' && qs('enchanter')==='active' && P.story && !P.story.vathCame){
    const go=()=>{
      P.story.vathCame=1; closeDialog();
      if(typeof spawnFinalVath==='function') spawnFinalVath();
      banner('THE ENCHANTER COMES','VATH THE EMBERBINDER');
      setTimeout(()=>toast('<b>Vath strides out of the treeline</b>, violet at his cuffs, and does not raise his voice. <b style="color:#c9a0ff">"So the ward held. Thirty years\' work, undone by a first mate\'s stubbornness. Come, then - I will bind you both properly this time."</b>',9000),300);
    };
    setDialog('<i>You hold the pendant up between you. The Woodworker\'s humming falters. His eyes track the five-point star - and for one breath the vague, happy fog behind them tears, and something old and frightened looks out.</i> “That... I know that. I stack it. Every day, and I never once asked why my hands know a shape my head has never seen -” <i>His hands are shaking.</i>',
      [{label:'Steady him', cls:'gold', fn:go}]);
    return;
  }
  // The Woodworker wakes: the prince returns, remembers you, and your own memory
  // floods back. The emotional climax of the game.
  if(npc.id==='woody' && P.story && P.story.vathBound && !P.story.princeWoke){
    const p4=()=>{
      P.story.princeWoke=1; P.story.remembered=1;
      if(!P.quests.homecoming) P.quests.homecoming='active';
      banner("THE ENCHANTER'S TIDE",'ACT IV - THE PRINCE RETURNS');
      setDialog('<i>He closes your hand around the pendant - his pendant - and for the first time since the surf spat you ashore, you remember your own name, and the deck beneath your boots, and the weight of the boy you dragged from the black water.</i> “First mate.” <i>The prince grips your shoulder.</i> “You carried the warning thirty years, through a fog thick as tar, and never once set it down. Take me home. Let my father see we both came back.”',
        [{label:'Home, then', cls:'gold', fn:()=>{ closeDialog();
          setTimeout(()=>toast('The prince is awake, and the strait is his father\'s again. <b style="color:var(--ember)">Sail to Aldermere and bring word to King Aldous.</b>',7500),600); }}]);
    };
    const p3=()=>{
      setDialog('“There was a storm that was not a storm - Vath\'s hand on the water. My mother went under.” <i>He falters.</i> “And you had me by the collar with the boat gone from under us both. You pressed this into my hands - no. I pressed it into YOURS. \'Warn my father. And remember.\' Then the fog took me whole, and it took you kinder, because you were too busy being brave to let it in all the way.”',
        [{label:'...I remember now', fn:p4}]);
    };
    const p2=()=>{
      setDialog('<i>The Woodworker straightens, and the set of his shoulders is suddenly nothing like a woodcutter\'s.</i> “It comes back the way the tide does - all at once, and cold. The anthem I hum. The little boats I carve for a father I could never name. Thirty years of split logs and a happiness that was really only forgetting.”',
        [{label:'Go on', fn:p3}]);
    };
    setDialog('<i>The violet is gone from him. He looks at you with clear eyes for the first time.</i> “You. I know you. Not from the village - from before all of this. From the water.”',
      [{label:'Listen', fn:p2}]);
    return;
  }
  // The palace coda: father and son reunited; the first mate honored; THE END.
  if(npc.id==='aldous' && P.story && P.story.princeWoke && !P.story.finale){
    const done=()=>{
      P.story.finale=1;
      if(qs('homecoming')==='active') completeQuest('homecoming');
      if(typeof updateCrownFolkMood==='function') updateCrownFolkMood();
      if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(255,215,106,0.9)',60);
      setDialog('<i>The old King holds his son at arm\'s length, then crushes him close, and the whole cold hall of the Tideglass Palace seems to warm a degree.</i> “Thirty years.” <i>He turns to you - the first mate - and a crown does not know how to bow, but the man beneath it tries.</i> “You brought both my children home. What Aldermere has, you have. The strait is calm, the isles are free, and Vath sleeps in a stone of his own making.” <i>A pause, quieter:</i> “He said he would return. Let him. He will find us waiting - and no longer afraid.”',
        [{label:'Rest, at last', cls:'gold', fn:()=>{ closeDialog();
          setTimeout(()=>banner('TIDEFARER','~ THANK YOU FOR PLAYING ~'),900); }}]);
    };
    const p2=()=>{
      setDialog('<i>The great doors stand open. The Woodworker - the prince - waits in the light, older than the boy the King buried in an empty coffin, and unmistakably his.</i> The King rises so fast the throne rocks back. “...Is this a cruelty? A binding? Some dream you\'ve carried in on the tide?” <i>He cannot finish.</i>',
        [{label:'It\'s real. He\'s home.', cls:'gold', fn:done}]);
    };
    setDialog('<i>King Aldous reads your face before you speak a word, and grips the arms of the Tideglass Throne until his knuckles whiten.</i> “You found him. You found Vath - and you found my boy. Tell me true, traveler, before this old heart decides for itself: which grave do I open?”',
      [{label:'No grave, my King.', fn:p2}]);
    return;
  }
  // Burl keeps the Undermill - once Tolen sends you for the sail, the millwright
  // warns of the thing fouling the seized works below.
  if(npc.id==='burl' && qs('sail')==='active' && !(P.story&&P.story.haveSail)){
    setDialog('<i>Burl lowers his voice, nodding at the mill behind him.</i> “Tolen sent you for the sail - Nessa\'s finest, locked in the vault since the gear-train seized. Go <b>in through the mill</b> and take the <b>cellar stair down</b>. But hear me: it weren\'t rust that stopped the works. There\'s a <b>thing</b> fouled in the shaft, and it don\'t like company. Put it down and the sail\'s yours. Go armed.”',
      shopButtons(npc,[{label:'I\'ll go down',ghost:true,fn:closeDialog}]));
    return;
  }
  // Rell won't send you at the Leviathan until you have a windsurf - the beast
  // lives out on the water, past the reach of his jetty. He points you onward.
  if(npc.id==='rell' && !(P.unlocked&&P.unlocked.surf) && qs('tide')!=='done'){
    if(P.story && P.story.boardMade){
      setDialog('“So Tolen shaped you a board - good. But she\'s bare, and a bare board\'s a plank.” <i>Rell jerks a thumb toward the mill.</i> “The last stormsail on this rock is locked in the <b>Undermill</b>, below Burl\'s windmill. Bring it up, step it, and THEN come talk to me about that thing past the breakwater.”',
        shopButtons(npc,[{label:'To the Undermill',ghost:true,fn:closeDialog}]));
    } else {
      setDialog('“Face it? On foot?” <i>Rell barks a joke of a laugh.</i> “My jetty only reaches so far, friend, and that thing <b>swims</b>. You\'ll want a <b>windsurf</b> to meet it out on the light water - and <b>Tolen the Whittler</b>, up at Trade Row, is the only hand on this rock who can shape you one. Get yourself a board. Then come back, and I\'ll point you at the beast.”',
        shopButtons(npc,[{label:'I\'ll go see Tolen', ghost:true, fn:closeDialog}]));
    }
    return;
  }
  if(npc.id==='castell' && qs('feud2')==='active'){
    setDialog('“So the Duchess sends her hound at last.” <i>The Castellan sets his helm and draws a long, notched blade.</i> “You should have stayed your side of the road, Barik-friend. Come - the March will bury one of us.”',
      [{label:'Draw steel', cls:'gold', fn:()=>{ closeDialog(); challengeCastellan(npc); }},
       {label:'Hold - not yet', ghost:true, fn:closeDialog}]);
    return;
  }
  // 1) talk-quest completion
  for(const id in P.quests){
    if(P.quests[id]==='active' && QUESTS[id].kind==='talk' && QUESTS[id].talkTo===npc.id){
      completeQuest(id);
      setDialog('“'+QUESTS[id].doneText+'”', [{label:'Continue',fn:()=>buildDialogContent(npc)}]);
      return;
    }
  }
  // 2) turn-in
  for(const id in P.quests){
    if(P.quests[id]==='active' && QUESTS[id].giver===npc.id && questReady(id)){
      const q=QUESTS[id];
      setDialog('“'+ (q.kind==='gather'? 'That everything I asked for? Hand it over, then!' : q.kind==='kill'? 'It\'s done? Truly?' : id==='harvest'? 'Four golden bundles - let\'s see them!' : 'You found it?!') +'”'
        + rewardText(q),
        withTravel(npc,[{label:'✓ Complete - '+q.title, cls:'gold', fn:()=>{
            completeQuest(id);
            setDialog('“'+q.doneText+'”',[{label:'Continue',fn:()=>buildDialogContent(npc)}]);
        }},{label:'Not yet',ghost:true,fn:closeDialog}]));
      return;
    }
  }
  // 3) offer available quest
  for(const id in QUESTS){
    if(P.quests[id]==='avail' && QUESTS[id].giver===npc.id){
      const q=QUESTS[id];
      setDialog('<b style="color:var(--ember)">'+q.title+'</b><br>“'+q.brief+'”'
        + '<div class="objbox"><b>Objective:</b> '+q.log+'</div>' + rewardText(q),
        withTravel(npc,[{label:'! Accept quest', cls:'gold', fn:()=>{
            acceptQuest(id);
            setDialog('“Good. I\'ll be here.”'
              + '<div class="objbox"><b>Objective:</b> '+q.log+'</div>'
              + '<div style="font-size:11px;color:var(--parch-dim);margin-top:6px;">Follow the gold <b style="color:#ffd76a">◆</b> marker and check the tracker, top-right. Return here when it reads <b style="color:#ffd76a">Ready</b>.</div>',
              [{label:'Off I go',fn:closeDialog}]);
          }},
         {label:'Later', ghost:true, fn:closeDialog}]));
      return;
    }
  }
  // 4) active quest reminder from giver - restate objective + live progress
  for(const id in P.quests){
    if(P.quests[id]==='active' && QUESTS[id].giver===npc.id && QUESTS[id].kind!=='talk'){
      setDialog('“How goes it?”'
        + '<div class="objbox"><b>'+QUESTS[id].title+':</b> '+QUESTS[id].log
        + '<br><span style="color:#9be07f">'+questProgressText(id)+'</span></div>',
        shopButtons(npc,[{label:'On it',ghost:true,fn:closeDialog}]));
      return;
    }
  }
  // 5) idle chatter + shop
  npc.li=(npc.li+1)%npc.idleLines.length;
  setDialog('“'+npc.idleLines[npc.li]+'”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
}
// Travel affordances that must stay reachable in EVERY dialog state - including a
// quest offer or turn-in, which otherwise return before shopButtons() runs. Without
// this, a player who declines Rell's quest is stranded on Windsurf, since Ashwing is
// the only way off the isle until the strait is calmed. Kept as the single source of
// truth for the fly-home button (shopButtons and the quest paths both route through it).
function withTravel(npc,btns){
  if(npc.id==='rell'){
    btns.unshift({label:'Signal Ashwing - fly back to Kohana', fn:()=>{
      flyToWorld('east','You run Rell\'s signal-kite up the mast. Before long a green shape wheels out of the sun - Ashwing, come to carry you home.');
    }});
  }
  return btns;
}
// A simple NPC storefront: a sub-menu of Buy buttons for the wares a shop-
// keeper stocks. Same idea as the bazaar stall, hung off an NPC's dialogue so
// the signed shops of Greyharbor actually SELL something.
function vendorShop(npc,line,wares){
  const rebuild=(msg)=>{
    const btns=wares.map(w=>({label:'Buy '+ITEMS[w.item].name+' <b style="color:#ffd76a">'+w.price+'g</b>', fn:()=>{
      if(P.gold>=w.price){ P.gold-=w.price; giveQuiet(w.item,1); if(Snd.coin)Snd.coin(); refreshUI();
        rebuild('“Sold - one '+ITEMS[w.item].name+', and fairly.”'); }
      else rebuild('“'+w.price+' gold, friend. No coin, no goods.”');
    }}));
    btns.push({label:'Back', ghost:true, fn:()=>buildDialogContent(npc)});
    setDialog(msg || ('“'+line+'”'), btns);
  };
  rebuild();
}
function shopButtons(npc,btns){
  if(npc.id==='bram'){
    btns.unshift({label:'Smith & craft…', fn:()=>craftMenu(npc)});
  }
  if(npc.id==='orin'){
    btns.unshift({label:'Brew tonics…', fn:()=>brewMenu(npc)});
  }
  if(npc.id==='willa'){
    btns.unshift({label:'Cook at the hearth…', fn:()=>cookMenu(npc)});
  }
  if(npc.id==='kell'){
    btns.unshift({label:'Harbor projects…', fn:()=>projectsMenu(npc)});
  }
  if(npc.id==='maren'){
    btns.unshift({label:'Village projects…', fn:()=>projectsMenu(npc)});
    btns.unshift({label:'Supply contract…', fn:()=>contractMenu(npc)});
    btns.unshift({label:'Sell goods…', fn:()=>sellMenu(npc)});
    btns.unshift({label:'Buy Ember Tonic (8g)', fn:()=>{
      if(P.gold>=8){ P.gold-=8; giveQuiet('potion',1); Snd.coin(); refreshUI();
        setDialog('“Sip it slow - or don\'t, if something\'s biting you.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); }
      else setDialog('“Coin first, tonic after. Island rules.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  // Greyharbor's signed shops now actually trade - Sela's Provisions, Ivo's
  // Herbary, and Thimble & Thread (Mira the clothier).
  if(npc.id==='sela'){
    btns.unshift({label:'Buy provisions…', fn:()=>vendorShop(npc,'Provisions for the road - fresh bread, grilled fish, an apple, a tonic for the bad days. What\'ll it be?',
      [{item:'bread',price:5},{item:'cookedfish',price:7},{item:'apple',price:3},{item:'potion',price:8}])});
  }
  if(npc.id==='ivo'){
    btns.unshift({label:'Buy remedies…', fn:()=>vendorShop(npc,'Tonics and tidebalm, every one brewed on this counter. The blue one\'s twice the mend - and twice the coin.',
      [{item:'potion',price:8},{item:'elixir',price:24}])});
  }
  if(npc.id==='mira'){
    btns.unshift({label:'Buy cloth…', fn:()=>vendorShop(npc,'Dawn-dyed silk, cut clean and true. A bolt goes further than you\'d think - and the resort\'s always wanting more.',
      [{item:'silk',price:14}])});
  }
  if(npc.id==='brant' && qs('wreck')==='done'){
    btns.unshift({label:'Set sail for Greyharbor', fn:()=>{ closeDialog(); departEarly(); }});
  }
  if(npc.id==='corvo' && P.prog.eastSail){
    btns.unshift({label:'Set sail east - the Sunward Isle', fn:()=>{
      closeDialog();
      const fd=document.getElementById('fadeOv'); fd.style.opacity=1;
      setTimeout(()=>{ switchWorld('east'); autoSave(); setTimeout(()=>{ fd.style.opacity=0; },200); },700);
    }});
  }
  if(npc.id==='corvoE'){
    btns.unshift({label:'Where\'s the boat?', ghost:true, fn:()=>{
      setDialog('“Right there off the landing, riding at anchor.” <i>He nods out at the water.</i> “Walk out and <b>step aboard the sloop</b> yourself when you\'re ready - give the word to the tiller and she\'ll run you home to Barik. I\'ll stay and mind Wren.”',
        [{label:'Aye, Captain', ghost:true, fn:closeDialog}]);
    }});
  }
  if(npc.id==='sable'){
    btns.unshift({label:'Range drill (20g \u2192 archery)', fn:()=>{
      if(P.gold<20){ setDialog('\u201cThe wind teaches for free. I do not.\u201d',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      P.gold-=20; Snd.coin(); refreshUI(); closeDialog();
      P.x=npc.x+1.2; P.y=npc.y+1.2; unstickEntity(P);
      TRAIN={who:'sable', stage:0, rolls:0, combo:0, _r:0, x:P.x, y:P.y,
        dmg0:G.mobs.filter(m=>m.kind==='dummy').reduce((a,m)=>a+(m.maxhp-m.hp),0)};
      toast('<b>Sable\'s drill:</b> deal <b>30 damage</b> to the range dummies - a bow if you have one, anything if you don\'t.',5000); Snd.quest();
    }});
  }
  if(npc.id==='cade'){
    btns.unshift({label:'Loose a rook to scout the isle (15g)', fn:()=>{
      if(P.gold<15){ setDialog('“Fifteen gold - a working bird\'s got to eat, same as you.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      P.gold-=15; Snd.coin(); refreshUI(); if(typeof scoutReveal==='function') scoutReveal();
      setDialog('“Off she goes.” <i>A rook folds away over the ridge, and minutes later the whole isle lies clear in your mind\'s eye.</i> “Open your map - you\'ll find no corner of this rock still dark. The zones you\'ll still want to set foot in yourself; a bird won\'t read you a signpost.”',
        shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  if(npc.id==='huk' && P.unlocked && P.unlocked.moa){
    btns.unshift({label:P.riding? 'Dismount Kiko':'Whistle for Kiko the Moa', fn:()=>{
      P.riding=P.riding?0:1; closeDialog();
    }});
  }
  if(npc.id==='hermit' && !P.prog.hermitGift){
    btns.unshift({label:'“Why hide out here?”', fn:()=>{
      P.prog.hermitGift=1;
      giveGold(150); giveQuiet('potion',2); giveQuiet('crystal',1); refreshUI(); Snd.quest(); autoSave();
      setDialog('“To see who\'d bother looking. You did - so take what the pines saved for you: <b>150 gold</b>, two <b>tonics</b>, and an <b>ember crystal</b> I found where the roots run hot. Tell no one, or tell everyone. Both amuse me.”',
        shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  if(npc.id==='bree'){
    btns.unshift({label:'Store goods in the vault', fn:()=>{
      let vn=0; P.vault=P.vault||{};
      for(const vk in SELL_PRICES){ const vc=P.inv[vk]||0;
        if(vc>0){ P.vault[vk]=(P.vault[vk]||0)+vc; take(vk,vc); vn+=vc; } }
      Snd.coin(); autoSave();
      setDialog(vn>0? '“'+vn+' goods, shelved and sealed under your name. Scavengers only take what\'s loose in a satchel - tonics ride your belt, steel your back. The vault guards the rest.”'
        : '“Your satchel holds nothing the vault takes - raw goods only: catch, crop, timber, ore and gem.”',
        shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
    btns.unshift({label:'Reclaim stored goods', fn:()=>{
      let vn=0; P.vault=P.vault||{};
      for(const vk in P.vault){ if(P.vault[vk]>0){ giveQuiet(vk,P.vault[vk]); vn+=P.vault[vk]; } }
      P.vault={}; Snd.coin(); refreshUI(); autoSave();
      setDialog(vn>0? '“'+vn+' goods, counted twice, back in your keeping.”' : '“The shelf under your name sits empty.”',
        shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
    btns.unshift({label:'Deposit all gold', fn:()=>{
      P.bank=(P.bank||0)+P.gold; const dep=P.gold; P.gold=0; Snd.coin(); refreshUI(); autoSave();
      setDialog('“'+dep+' gold, sealed in the vault. Total holdings: <b>'+P.bank+'</b>. Death itself signs no withdrawal slips here.”',
        shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
    btns.unshift({label:'Withdraw all gold', fn:()=>{
      P.gold+=(P.bank||0); const w=P.bank||0; P.bank=0; Snd.coin(); refreshUI(); autoSave();
      setDialog('“'+w+' gold, counted twice. Spend it somewhere that deserves it.”',
        shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  if(npc.id==='aelin'){
    // tuition scales with mastery (25g \u00d7 magic level) and the Spire caps out at level 7
    const aelinFee=()=>25*Math.max(1,P.skills.magic.lvl);
    const aelinStudy=()=>{
      if(P.skills.magic.lvl>=7){ setDialog('“Level seven - the Spire\'s ceiling. Past this point the weave teaches <i>you</i>, and it does not take gold. Go and practice.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      // one lesson per day - the weave needs a night to settle before the next
      if(P.prog && P.prog.spireDay===(P.prog.dayN||1)){
        setDialog('“You\'ve trained today already - and the weave settles only overnight. Rest, and come back at dawn for the next lesson.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      const f=aelinFee();
      if(P.gold<f){ setDialog('“The Spire\'s wisdom is subsidized, not free. '+f+' gold - mastery raises tuition.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      P.gold-=f; Snd.coin(); refreshUI(); closeDialog();
      P.x=npc.x+2.5; P.y=npc.y+1.6; unstickEntity(P);
      TRAIN={who:'aelin', stage:0, rolls:0, combo:0, casts:0, _r:0, x:P.x, y:P.y,
        dmg0:G.mobs.filter(m=>m.kind==='dummy').reduce((a,m)=>a+(m.maxhp-m.hp),0)};
      toast('<b>Aelin\'s lesson:</b> attune your staff (<b>press 3</b>) and cast <b>5 bolts</b> at the practice dummy. No footwork - just clean casting.',5600); Snd.quest();
    };
    const trainedToday = P.prog && P.prog.spireDay===(P.prog.dayN||1);
    btns.unshift({label:P.skills.magic.lvl>=7? 'Train at the Spire (mastered)' : trainedToday? 'Train at the Spire (rest first)' : 'Train at the Spire ('+aelinFee()+'g → magic)', fn:aelinStudy});
    if(P.skills.magic.lvl>=5){
      P.spells=P.spells||{};
      if(!P.spells.snare){
        btns.unshift({label:'Learn Snare (100g)', fn:()=>{
          if(P.gold<100){ setDialog('“A hundred gold. Binding-work is the hardest weave there is.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
          P.gold-=100; P.spells.snare=1; Snd.quest(); refreshUI(); autoSave();
          setDialog('“Snare: the weave made rope. Your staff can now <b>root a foe in place</b>. Come back any time to attune between <b>Bolt</b> and <b>Snare</b>.”',
            shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
        }});
      } else {
        const nextSpell=(P.spell||'bolt')==='bolt'? 'Snare':'Bolt';
        btns.unshift({label:'Attune staff: '+nextSpell, fn:()=>{
          P.spell=nextSpell.toLowerCase(); Snd.magic(); autoSave();
          setDialog('“Attuned. Your staff now casts <b>'+nextSpell+'</b>.”',
            shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
        }});
      }
    }
  }
  if(npc.id==='rook'){
    btns.unshift({label:'Drill in the yard (20g \u2192 melee)', fn:()=>{
      if(P.gold<20){ setDialog('\u201cSweat is free. My time is twenty gold.\u201d',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      P.gold-=20; Snd.coin(); refreshUI(); closeDialog();
      P.x=npc.x-2.5; P.y=npc.y-2.7; unstickEntity(P);
      TRAIN={who:'rook', stage:0, rolls:0, combo:0, _r:0, x:P.x, y:P.y,
        dmg0:G.mobs.filter(m=>m.kind==='dummy').reduce((a,m)=>a+(m.maxhp-m.hp),0)};
      toast('<b>Rook\'s drill:</b> deal <b>30 damage</b> to the practice dummies in the yard. Strike!',4600); Snd.quest();
    }});
    btns.unshift({label:'\u201cArchery lessons?\u201d', fn:()=>{
      setDialog('\u201cBows? My cousin teaches archery across the eastern water. Proper range, proper wind. When the strait opens, sail out and tell her I still owe her twenty gold.\u201d',
        shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  if(npc.id==='hedda'){
    if(!P.home) btns.unshift({label:'Buy the homestead (250g)', fn:()=>{
      if(P.gold<250){ setDialog('“Two hundred fifty. The land\'s worth twice that - I like your face.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      P.gold-=250; P.home=1; Snd.quest(); refreshUI(); autoSave();
      const hb=G.decor.find(b=>String(b.label||'').includes('Homestead')); if(hb) hb.label='Your homestead';
      setDialog('“Then it\'s yours - deed, door, and drafts. Come back when you\'re ready to <b>improve</b> it.”',
        shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
    else btns.unshift({label:'Home improvements\u2026', fn:()=>{
      const opts=[];
      if(!P.homeUp.story) opts.push({label:'Raise a second story (200g)', fn:()=>{
        if(P.gold<200) return;
        P.gold-=200; P.homeUp.story=1; Snd.quest(); refreshUI(); autoSave();
        const hb=G.decor.find(b=>String(b.label||'').includes('Your homestead')); if(hb) hb.kind='house2';
        setDialog('“A second story! The gulls will be jealous.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
      }});
      if(!P.homeUp.furnish) opts.push({label:'Furnish it proper (150g)', fn:()=>{
        if(P.gold<150) return;
        P.gold-=150; P.homeUp.furnish=1; Snd.quest(); refreshUI(); autoSave();
        setDialog('“Rug, hearth-iron, and a bed worth oversleeping in. <b>Sleep free at home</b> from now on.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
      }});
      if(!P.homeUp.farm) opts.push({label:'Buy the adjoining field (100g)', fn:()=>{
        if(P.gold<100) return;
        P.gold-=100; P.homeUp.farm=1; Snd.quest(); refreshUI(); autoSave();
        const hb=G.decor.find(b=>String(b.label||'').includes('Your homestead'));
        if(hb) for(let i=0;i<8;i++) G.plots.push({x:Math.floor(hb.x)+3+(i%4)*1.5, y:Math.floor(hb.y)+1+Math.floor(i/4)*1.5, crop:null, t:0});
        setDialog('“Good soil. Willa\'s seeds grow anywhere - plant away.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
      }});
      opts.push({label:'Farewell',ghost:true,fn:closeDialog});
      setDialog(opts.length>1? '“What\'ll it be? A house is never finished - that\'s the joy of it.”':'“She\'s complete, roof to root. A proper Barik homestead.”', shopButtons(npc,opts));
    }});
    if(!P.horse) btns.unshift({label:'Buy a horse - Chestnut (150g)', fn:()=>{
      if(P.gold<150){ setDialog('“Hundred fifty for Chestnut. He eats like a duke but runs like a rumor.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      P.gold-=150; P.horse=1; P.riding=1; Snd.quest(); refreshUI(); autoSave();
      setDialog('“He\'s yours. Whistle any time -” <i>Chestnut is already nosing your pockets.</i> <b>(Toggle riding via Hedda or the pause menu.)</b>',
        shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
    else btns.unshift({label:P.riding? 'Dismount Chestnut':'Whistle for Chestnut', fn:()=>{
      P.riding=P.riding?0:1; closeDialog(); toast(P.riding?'Chestnut trots up, ears forward. <b>Mounted.</b>':'Chestnut wanders to the nearest grass. <b>Dismounted.</b>',2800);
    }});
  }
  if(npc.id==='perrin' || npc.id==='saffi' || npc.id==='lani'){
    btns.unshift({label:'Rest the night (10g)', fn:()=>{
      if(P.gold<10){
        setDialog('“Ten gold for the bed, friend. The hearth\'s warmth is free to look at.”',
          shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
        return;
      }
      P.gold-=10; Snd.coin(); closeDialog();
      const fade=document.getElementById('fadeOv');
      fade.style.opacity=1;
      setTimeout(()=>{
        G.dayT=0.09; // morning proper - the dark is done
        P.hp=P.maxhp; P.mp=P.maxmp;
        P.bind={w:G.worldId, x:npc.x, y:npc.y+1};
        fade.style.opacity=0;
        toast('You sleep deep and dreamless. Dawn finds you <b>fully mended</b>.',4600);
        Snd.quest(); refreshUI(); autoSave();
      }, 800);
    }});
  }
  if(npc.id==='sela'){
    btns.unshift({label:'Buy Bread (5g)', fn:()=>{
      if(P.gold>=5){ P.gold-=5; giveQuiet('bread',1); Snd.coin(); refreshUI();
        setDialog('“Still warm. Don\'t tell the gulls.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); }
      else setDialog('“Five coin. The oven doesn\'t run on kindness.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
    btns.unshift({label:'Buy Cooked Fish (7g)', fn:()=>{
      if(P.gold>=7){ P.gold-=7; giveQuiet('cookedfish',1); Snd.coin(); refreshUI();
        setDialog('“Caught at dawn, crisped at noon.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); }
      else setDialog('“Seven, friend. Fish don\'t catch themselves.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  if(npc.id==='ivo'){
    btns.unshift({label:'Buy Ember Tonic (8g)', fn:()=>{
      if(P.gold>=8){ P.gold-=8; giveQuiet('potion',1); Snd.coin(); refreshUI();
        setDialog('“Brewed bitter so you remember to stay alive.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); }
      else setDialog('“Eight gold. Healing\'s cheap; herbs aren\'t.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
    btns.unshift({label:'Buy Bluecap (4g)', fn:()=>{
      if(P.gold>=4){ P.gold-=4; giveQuiet('mushroom',1); Snd.coin(); refreshUI();
        setDialog('“Glows a little. That\'s how you know it\'s working.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); }
      else setDialog('“Four coin a cap.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  if(npc.id==='willa'){
    btns.unshift({label:'Ask for seeds (free)', fn:()=>{
      giveQuiet('seed',3); Snd.pickup(); refreshUI();
      setDialog('“Seeds are the island\'s, not mine. Plant kindly.” <i>(+3 seeds)</i>', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  return withTravel(npc,btns);
}
