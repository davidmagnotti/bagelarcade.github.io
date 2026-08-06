/* =====================================================================
   DIALOG SYSTEM
   ===================================================================== */
const dlg = {open:false, npc:null};
// After the reveal, the Woodworker is the prince in his own bright-blue wear, and
// answers to his name. One place decides the shown look and name for both.
function npcRoyalLook(npc){
  if(npc && npc.id==='woody' && P.story && P.story.royalGarb)
    return {...npc.look, shirt:'#2f6ad6', pants:'#26407a', trim:'#e6c25a'};
  return npc.look;
}
function npcDisplayName(npc){
  if(npc && npc.id==='woody' && P.story && P.story.royalGarb) return 'Prince Leo';
  return npc.name;
}
function drawPortrait(npc){
  const c=document.getElementById('dportrait'), g=c.getContext('2d');
  g.clearRect(0,0,72,72);
  g.fillStyle='#20160c'; g.fillRect(0,0,72,72);
  g.save(); g.translate(36,66); g.scale(1.35,1.35);
  const lk=npcRoyalLook(npc);
  drawHumanoid(g,0,0,{...lk, size:lk.size||1, dir:{x:0,y:1}, step:0});
  g.restore();
}
function openDialog(npc){
  P.click=null;
  // you've now met this soul: their name reads over their head for good (drawNPC).
  // Before this first word, the name only fades in when you stand close enough to speak.
  if(npc && npc.id){
    P.met=P.met||{};
    // Finn's gift: fishing takes a rod, and he's the one who hands it over. Grant it the first
    // time you speak with him so the south-east cove's lines are yours to cast right away.
    if(npc.id==='finn' && !P.rod && typeof giveRod==='function') giveRod();
    P.met[npc.id]=1;
  }
  const dl=dist(P.x,P.y,npc.x,npc.y)||1;
  npc.face={x:(P.x-npc.x)/dl, y:(P.y-npc.y)/dl};
  dlg.open=true; dlg.npc=npc;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent=npcDisplayName(npc);
  drawPortrait(npc);
  buildDialogContent(npc);
}
function closeDialog(){ dlg.open=false; dlg.btns=null; document.getElementById('dialog').style.display='none';
  // a skill card held for after the speaker's line (e.g. "Dash learned!") still fires if the
  // dialog is dismissed rather than clicked through - so the lesson is never silently dropped.
  if(P._dashCardPending){ const f=P._dashCardPending; P._dashCardPending=null; setTimeout(f,50); } }
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
  // Remember the live choices so keyboard players can pick one by number (see the
  // keydown handler in 07-input.js). Cleared when the dialog closes.
  dlg.btns=btns;
  const kb = (typeof isTouch==='undefined') || !isTouch;   // number-key hints on PC only
  btns.forEach((b,i)=>{
    const el=document.createElement('button');
    el.className='btn'+(b.ghost?' ghost':'')+(b.cls?' '+b.cls:'');
    // On PC, prefix a numbered hotkey ([1], [2]...) so players know they can choose
    // from the keyboard. Touch just taps, so no number clutter there.
    el.innerHTML = (kb && i<9 ? '<span style="opacity:.55;font-weight:normal">['+(i+1)+']</span> ' : '') + b.label;
    el.onclick=()=>b.fn(); bx.appendChild(el);
  });
  // Make it plain that a keyboard alone can drive the whole conversation - no mouse ever
  // needed. PC only (touch just taps the buttons). Lives inside #dbtns so it clears with it.
  if(kb && btns.length){
    const hint=document.createElement('div');
    hint.style.cssText='flex:0 0 100%;order:99;margin-top:5px;text-align:center;'+
      'font-size:10.5px;color:var(--parch-dim);opacity:.85;';
    hint.innerHTML = btns.length>1
      ? 'Keyboard: <b>1</b>–<b>'+Math.min(btns.length,9)+'</b> choose · <b>Enter</b> confirm · <b>Esc</b> close'
      : '<b>Enter</b> or <b>Space</b> to continue';
    bx.appendChild(hint);
  }
}
// === THE FOUNDERS' SEAL: the princess brings the Sealing Book up from the Tideward Crypt to
// Leo. He reads the old royal script, understands the binding for what it is - and what it
// will ask of him - and, afraid but certain, agrees to learn it and be the one to seal Vath.
// Learning it opens the road back to the capital for the reckoning. Shared by both the boat
// Leo (woody, royalGarb) on Emberwick and the companion 'brother' NPC on the other isles.
function leoSealScene(){
  P.story=P.story||{};
  const agree=()=>{
    P.story.sealLearned=1;
    if(typeof take==='function') take('sealtome',1);
    if(Snd.levelup) Snd.levelup();
    if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(255,233,168,0.9)',56);
    if(typeof burst==='function') burst(P.x,P.y-0.5,'#ffe9a8',22,2.8);
    if(typeof banner==='function') banner('THE SEAL IS LEARNED','LEO WILL BIND THE SHADOW');
    setDialog('<i>He closes the book on his thumb and stands, and for the first time since the surf gave him back he does not look like a woodcutter or a scholar - he looks like his father\'s son.</i> “Then it\'s time, Joan. No more isles, no more waiting. We sail for Aldermere and I put this working on Vath myself - while you keep him off me long enough to speak it to the end.” <i>His hand is steady on the cover now.</i> “Take us home. Let\'s finish it.”',
      [{label:'Sail for the capital', cls:'gold', fn:()=>{ if(typeof autoSave==='function') autoSave(); closeDialog();
        if(typeof toast==='function') setTimeout(()=>toast('<b style="color:var(--ember)">The road to Aldermere is open.</b> Board the ferry and sail to the capital - Vath holds the throne, and the seal rides with your brother.',8000),500); }}]);
  };
  const p2=()=>{
    setDialog('<i>His scholar\'s calm cracks.</i> “Joan, do you understand what this is? A binding this old isn\'t spoken and forgotten - it takes root in the one who casts it. If I seal him with this, part of me goes into the cage with him. I felt it lift off the page just reading the first line.” <i>He is quiet a long moment, afraid, and then he makes himself nod.</i> “...But I\'m the only one who can read the hand, and the only one who can hold the words. So it has to be me. I\'ll learn it. Every line.”',
      [{label:'I\'ll be right beside you, brother', cls:'gold', fn:agree}]);
  };
  setDialog('<i>You lay the heavy book in your brother\'s hands. Leo goes still the instant he sees the script down its spine - then he opens it, and the colour leaves his face.</i> “...This is the founders\' hand. The oldest of it.” <i>His eyes race the first page, and his breath goes shallow.</i> “Joan. This is a <b>sealing</b> - a binding meant for something that cannot be killed, only caged. This is what they raised that guardian to keep from the world.”',
    [{label:'Read it, Leo', fn:p2}]);
}
// Every quest-giver used to sign off an accepted quest with the same "Good. I'll be
// here." - fine once, grating by the tenth NPC. Pull a line from a small pool instead,
// keyed off the quest id so a given quest always reads the same (no flicker on re-open)
// while neighbouring quests sound different. Corvo and a few others keep bespoke lines
// upstream; this only covers the generic accept path.
const QUEST_ACCEPT_LINES = [
  'Good. I\'ll be here.',
  'Aye, that\'ll do. Off you go.',
  'Good - I\'ll not stray far.',
  'That\'s the spirit. I\'ll be about when it\'s done.',
  'Right you are. Come find me after.',
  'Then it\'s settled. Luck to you.',
  'Well met. I\'ll keep your place.',
  'Good hunting - I\'ll be waiting on word.',
];
function questAcceptLine(id){
  let h=0; const s=String(id||'');
  for(let i=0;i<s.length;i++) h=(h*31 + s.charCodeAt(i))|0;
  return QUEST_ACCEPT_LINES[Math.abs(h)%QUEST_ACCEPT_LINES.length];
}
function buildDialogContent(npc){
  // Speaking with Bram is what unlocks gathering - remember it the moment his dialog opens
  // (see hasMetBram / hitNode: no chopping or mining until you've been to the forge).
  if(npc.id==='bram'){ P.story=P.story||{}; P.story.bramMet=1; }
  // A skill card (e.g. "Dash learned!") raised mid-dialogue is held until the player clicks
  // through the speaker's line - it fires here, on the "Continue" that rebuilds the dialog.
  if(P._dashCardPending){ const f=P._dashCardPending; P._dashCardPending=null; try{ f(); }catch(e){} }
  // Farmer Hedda, the FIRST time you reach her after shattering Vath's violet ward that
  // sealed her steading off. A proper thank-you (and a sack of the harvest), shown once -
  // the flag is set so later talks fall through to her quests and idle chatter as normal.
  if(npc.id==='hedda' && P.story && P.story.tg && P.story.tg['main:heddaward'] && !P.story.heddaThanked){
    P.story.heddaThanked=1; npc.farmer=1;
    setDialog('<i>Hedda drops her hoe and hurries over the moment she sees you.</i> “You BROKE it! Oh, bless you - thank you, thank you. I woke one morning to that <b style="color:#c04bff">violet stone</b> shot up clean across my lane, humming and cold, walling me right out of my own fields till I couldn\'t reach the road nor the road reach me. Some soft-spoken fellow all in violet had walked my fences the night before and never said a word - and by daybreak I was penned into my own steading like a beetle in a jar. I\'d have starved in sight of my own crop. And you just <i>cut me loose</i>. Here - take a sack of the first harvest, and I\'ll not hear one word against it.”',
      [{label:'Continue', fn:()=>{ if(typeof give==='function') give('bread',3);
          if(typeof addFloat==='function' && typeof P!=='undefined') addFloat('+3 Bread', P.x, P.y-2, '#e8dcbd', 1.1);
          buildDialogContent(npc); }}]);
    return;
  }
  // Castellan of the Vael: once you carry Maelis's writ (feud2), calling on him
  // is a challenge - a taunt, then a boss fight. Otherwise he only warns you off.
  // A first-hour necklace moment: rare, short, and never explained (until Act 3).
  if(npc.id==='maren' && P.story && !P.story.marenNecklace){
    P.story.marenNecklace=1;
    setDialog('<i>Elder Maren\'s eyes catch the pendant at your throat and hold there a beat too long.</i> “…Odd thing, for a castaway to wash up wearing. Old work. Fine work - finer than these shores have seen.” <i>Then she looks to the sea, and says no more of it.</i>',
      [{label:'Continue', fn:()=>buildDialogContent(npc)}]);
    return;
  }
  // The Hollow Spirit is gated behind a fighter's full craft, not steel alone. If the
  // traveler comes to Maren with a sword but no parry, she will not speak the causeway
  // gate open - she sends them east to Rask the Bladesworn first, to learn the turning.
  if(npc.id==='maren' && qs('king')==='avail' && !(P.unlocked&&P.unlocked.parry)){
    setDialog('<i>Maren\'s face goes grave at the mention of the graveyard.</i> “The Hollow Spirit - aye, it stirs, and I\'ll speak the gate open for the one who\'ll face it. But not for a swinging arm alone. Whatever woke in that graveyard strikes back, and hard - you\'ll not last if all you know is how to hit. It is its rising that cursed the strait - its spite reaches out into the water and drags down any hull that dares the crossing, the same water that wrecked you. Put it down and the sea loosens its grip; Emberwick can sail again.” <i>She looks east, past the meadow.</i> “Go and find <b>Rask</b>. The old Bladesworn keeps the quiet out there - let him teach you to <b>turn a strike aside</b>. Come back to me when you can <b>parry</b>, and then we\'ll talk about facing it.”',
      shopButtons(npc,[{label:'I\'ll find Rask', ghost:true, fn:closeDialog}]));
    return;
  }
  // A parry alone is not enough: the traveler also needs the footwork Orin teaches.
  // If the turning is learned but the dash is not, Maren sends them up to the tower to
  // help Orin - his errand grants the dash. She doesn't name the mechanic; the gate is
  // held by this condition (!dash) re-showing until they have it.
  if(npc.id==='maren' && qs('king')==='avail' && (P.unlocked&&P.unlocked.parry) && !(P.unlocked&&P.unlocked.dash)){
    setDialog('<i>Maren looks you over, and her brows lift.</i> “Rask taught you the turning already? Steel in your hand and you know what to do with it - that\'s more than most manage. Not bad at all.” <i>She nods up the north road, toward the tower.</i> “Go see if you can lend <b>Sage Orin</b> a hand - the old man mentioned he\'s been needing an extra one. Help him out, then come back to me and we\'ll talk about the causeway.”',
      shopButtons(npc,[{label:'Off to see Orin', ghost:true, fn:closeDialog}]));
    return;
  }
  // After the Hollow Spirit falls, the elder does more than thank you: she names the
  // wider turmoil in the isles and asks the champion to carry that steel outward -
  // the in-world reason to board Brant's boat and leave Emberwick. Fires once, on
  // the first visit after the quest is done; either answer still points to the boat.
  if(npc.id==='maren' && P.story && qs('king')==='done' && !P.story.marenCharge){
    const toBoat=()=>{
      P.story.marenCharge=1;
      setDialog('<i>She grips your forearm, warrior to warrior.</i> “Then it\'s settled. The strait runs calm again now his curse is broken - the crossing is finally yours to make. <b>Captain Brant</b> is mending the Tidewalker down at the dock; help him make her seaworthy and step aboard when you\'re ready. Fair winds, Champion. Emberwick will keep a lantern lit for you.”',
        shopButtons(npc,[{label:'To the dock', cls:'gold', fn:()=>buildDialogContent(npc)}]));
    };
    setDialog('<i>Elder Maren studies you a long moment, and there is more than gratitude in it.</i> “I\'ve watched a great many castaways wash up on this rock. Not one of them could have gone down into that dark and walked back out. You\'re a rare hand with a blade, traveler - a born fighter - and Emberwick is only one small stone in a wide and troubled sea.” <i>Her eyes turn to the water.</i> “The other isles are in turmoil - cursed tides, beasts on the roads, wrongs with no one left to set them right. They could use someone like you out there. Will you carry what you are beyond our shore?”',
      [{label:'I\'ll go where I\'m needed', cls:'gold', fn:toBoat},
       {label:'The sea can wait', ghost:true, fn:()=>{
         P.story.marenCharge=1;   // she's made her pitch; don't repeat the big speech
         setDialog('<i>Maren nods, unsurprised.</i> “Ok. The sea keeps - and so do I. When you\'re ready to sail, <b>Captain Brant</b> is down at the dock, mending the Tidewalker.”',
           shopButtons(npc,[{label:'Right then', ghost:true, fn:()=>buildDialogContent(npc)}]));
       }}]);
    return;
  }
  // The Royal Audience - a scripted scene that opens Act III. The King receives
  // the curse-breaker, his gaze snags on the pendant (rare, short, unexplained),
  // and he tells the tragedy that binds Vath to the throne, then charges you.
  // Starts simply on talking to the King, any time before he has charged you
  // (kingTold) and before the later reveal - no herald/audience-quest step needed.
  if(npc.id==='aldous' && !(P.story&&(P.story.kingTold||P.story.unmasked||P.story.act1End))){
    const p3=()=>{
      setDialog('<i>He turns the truth over like a blade carried too long.</i> “The curses across my isles - the wyrm, the leviathan, the aerie, the weeping strait - are all one hand\'s work. His. I\'d know Vath\'s bindings anywhere; he learned them at this court. He did not drown out there all those years ago, whatever word came back. He\'s been out there all this time - and my children with him, or their graves.” <i>The King rises.</i> “I cannot send armies against a ghost. But you walk where he walks and unmake what he makes. Find him, traveler. Find what became of my boy and girl.”',
        [{label:'I will find him.', cls:'gold', fn:()=>{
            P.story.kingTold=1; P.story.act=Math.max(P.story.act||1,3);
            completeQuest('audience');
            if(typeof updateCrownFolkMood==='function') updateCrownFolkMood();
            banner('THE ENCHANTER\'S TIDE','THE KING\'S CHARGE');
            // launch the finale trail: the pendant is the thread. Send the player
            // back to Orin on Emberwick to have it read.
            if(!P.quests.pendant){ P.quests.pendant='active'; P.prog.pendant=0; }
            setTimeout(()=>toast('<b style="color:var(--ember)">The pendant is the thread.</b> Sail back to <b>Emberwick</b> and show it to <b>Sage Orin</b> at his tower.',7000),2600);
            setDialog('<i>The King presses a heavy purse and a folded writ into your hands, his seal in blue wax.</i> “Then you are my hand abroad. Every gate in Aldermere opens to that seal. Bring him to me, or bring me the truth. I have waited long years; I can wait a little longer, now that someone is looking.”',
              [{label:'Continue',fn:()=>buildDialogContent(npc)}]);
        }}]);
    };
    const p2=()=>{
      setDialog('“Long years past, a fever took my wife while our children were small - a fierce slip of a daughter who\'d sooner duel the guard than curtsy, and a boy still small enough to carry. Then the curses began: waters that ate ships, beasts that would not lie down. My most trusted man swore he could hunt their root, and counselled me the safest place for my blood was at his own side. Fool that grief had made me, I let him take them both. His name was <b>Vath</b>.” <i>His jaw tightens.</i> “A storm took the ship, or so the word came back - timbers and grief, nothing else. I buried two empty coffins and mourned Vath as a loyal man lost in my service.”',
        [{label:'…And now?', fn:p3}]);
    };
    setDialog('<i>The King\'s eyes catch on the pendant at your throat, and something crosses his face like a cloud over the sun.</i> “That medallion. Where did you—” <i>He stops himself.</i> “…Forgive me. An old man sees the dead in every stranger\'s face. You are the curse-breaker. Sit. Let me tell you why the sight of you unsteadies me.”',
      [{label:'Listen', fn:p2}]);
    return;
  }
  // First meeting with Vath the "Emberbinder": a smooth, flattering stranger who covets
  // the dragon's fire. He charms - but the tells leak through: he greets you before you
  // make a sound, prizes the nameless for carrying "no complications", and his gaze snags
  // on the pendant a beat too long, something older looking out before the smile slides
  // back. A tap-through scene that plants the suspicion before his wyrm quest is offered.
  if(npc.id==='vath' && P.story && !P.story.vathGreet && qs('wyrm')!=='done'){
    const p4=()=>{
      P.story.vathGreet=1;
      setDialog('<i>He spreads his hands, all warmth again.</i> “But here I am, running on, and you did not come all this way for an old man’s riddles.” <i>The smile returns; it still does not reach his eyes.</i> “There is a matter on this isle that someone of your… talents could set right. A beast in the mountain has made a misery of the good folk here - and will make ash of them before long. End their torment, and you would have their thanks, and mine. Shall I tell you of it?”',
        [{label:'Go on', cls:'gold', fn:()=>buildDialogContent(npc)}]);
    };
    const p3=()=>{
      setDialog('<i>His gaze snags on the pendant at your throat, and for the space of a breath the warmth drains out of him - something older and hungrier looking through the charm.</i> “…That is a fine old piece you wear. Very fine. I have seen its like before - once, a long way from here.” <i>He catches himself, and the easy smile slides back into place.</i> “Forgive an old collector. Pretty things are a weakness of mine.”',
        [{label:'…Where would that have been?', fn:()=>setDialog('“Oh - here, there. A wanderer wanders.” <i>He waves the question off like smoke.</i> “I never do recall the where of a thing. Only the worth of it.”',[{label:'Continue', fn:p4}])},
         {label:'Say nothing', fn:p4}]);
    };
    const p2=()=>{
      setDialog('“A wanderer. I go where the roads and the tides carry me, and I make myself useful where I land.” <i>He looks you over, unhurried, the way a jeweller weighs a stone.</i> “And you - washed up, nameless, a stranger even to your own face. How the tides do provide. I have always found the nameless make the finest company. They carry no… complications.”',
        [{label:'What do you want?', fn:p3}]);
    };
    setDialog('<i>The robed stranger turns to face you before you have made a sound, as though he felt you coming up the path.</i> “Ah - there you are. I did wonder when the sea’s newest gift would wander my way.” <i>His smile is generous, practiced, and does not once touch his eyes.</i> “Vath. A wanderer, and a friend to the friendless. And you are… interesting. Yes. Quite interesting.”',
      [{label:'Who are you?', fn:p2}]);
    return;
  }
  // First meeting with the Woodworker: two amnesiacs who each feel they have seen
  // the other before and cannot place it. Plants the recognition beat from hour one -
  // no spoilers, and it pays off far later (he is the lost prince). Fires once.
  if(npc.id==='woody' && !(P.prog&&P.prog.woodyMet) && !(P.story&&(P.story.wardRead||P.story.vathCame||P.story.vathBound))){
    P.prog=P.prog||{}; P.prog.woodyMet=1;
    setDialog('<i>The woodworker looks up from his logs - and for one breath you both go still, the way you do at a half-remembered face. He searches yours; you search his. Nothing surfaces.</i> “...Huh. Thought you were someone.” <i>He tilts his head, then lets it go with an easy smile and turns back to his stacking, humming that wandering tune.</i>',
      [{label:'…Have we met?', fn:()=>setDialog('<i>He considers it seriously, then shrugs it off.</i> “Couldn\'t say. I don\'t keep my yesterdays - and they don\'t seem to keep me. But you\'re welcome by the woodpile any time. I carve little boats, mostly. For someone. They\'ll turn up.”',[{label:'Farewell', ghost:true, fn:closeDialog}])},
       {label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // === ACT IV scripted scenes ===========================================
  // Nudge: any time the player is on the pendant trail - the King has sent them to
  // read the ward (pendant active), or Orin has read it (wardRead) - but they have
  // not yet taken up the hunt, the Woodworker gently points them back to Orin. This
  // covers the whole window after the royal audience so the trail can never dead-end
  // here: the "get the Woodworker back" quest opens at Orin, not at the woodpile.
  if(npc.id==='woody' && P.story && !P.story.unmasked && qs('enchanter')!=='active'
     && (P.story.wardRead || qs('pendant')==='active' || qs('pendant')==='done')){
    setDialog('<i>The Woodworker hums that same wandering tune and crowns his woodpile with the five-point star, easy as breathing.</i> “Back again? You keep looking at me like you mislaid something. <b>Sage Orin</b>’s your man for mislaid things - old books, old riddles. Show HIM whatever it is at your throat; he had that same look, last you two spoke.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // The other half of that hand-off: Orin has already read the ward (wardRead),
  // the reveal hasn't happened, and yet the Woodworker leg ('enchanter') isn't
  // running - so the woodpile nudge above bounces the player back to Orin with
  // nothing here to catch them, and the trail dead-ends between the two. This is
  // reachable from older saves that recorded the ward-reading without opening the
  // Woodworker leg (the pendant quest's launch of 'enchanter' post-dates them).
  // Any time the ward is read but the reveal is still ahead, (re)launch the leg
  // from Orin's own mouth and point the marker back to the green, matching the
  // pendant doneText. Skipped in the normal flow, where completing the pendant
  // quest at Orin already sets wardRead AND 'enchanter'=active in one breath.
  if(npc.id==='orin' && P.story && P.story.wardRead && !P.story.unmasked
     && !P.story.act1End && qs('enchanter')!=='active'){
    P.prog=P.prog||{};
    P.quests.enchanter='active'; P.prog.enchanter=P.prog.enchanter||0;
    if(typeof Snd!=='undefined' && Snd.quest) Snd.quest();
    setDialog('<i>Orin looks up from his workbench and finds the pendant already at your throat, unbidden.</i> “Still carrying it about like a riddle you can\'t set down - and no wonder. I told you once and I\'ll tell you plain again: take that necklace down to the <b>Woodworker</b>, by the green. Show it to HIM, and only that. Some doors a soul must walk through on its own - and this one has your name on it, and his.”',
      [{label:'To the Woodworker', ghost:true, fn:closeDialog}]);
    return;
  }
  // The pendant, shown to the Woodworker: the ward cracks his binding. He begs the
  // masked stranger to show her face - and when she does, the fog tears for them
  // both. Brother and sister, the scholar and the warrior, remember at once. This
  // is the emotional climax of Act I, and it takes the mask off for good.
  if(npc.id==='woody' && qs('enchanter')==='active' && P.story && !P.story.unmasked){
    // The reunion payoff, run once the animated memory-flood cutscene has played
    // (or immediately, if the overlay layer is missing): set the story state, drop
    // the banner, and play the sibling cards.
    const afterReveal=()=>{
      P.story.masked=0; P.story.unmasked=1; P.story.remembered=1; P.story.siblingsKnown=1;
      P.story.royalGarb=1;   // the castaway is the princess again: true colours, true look
      P.story.leoStay=1;     // for THIS Emberwick scene he stays at the woodpile, not the boat;
                             // cleared the moment you sail off, so he takes the dock from then on
      // Leo has remembered he is the prince, but for THIS scene he stays put at the woodpile.
      // Settle the live Woodworker NPC in place (no more humming his logs or pacing the yard)
      // WITHOUT walking him down to the boat - he moves to the dock later, on the next crossing.
      { const w=((typeof G!=='undefined'&&G.npcs)||[]).find(n=>n.id==='woody'); if(w){ w.hums=false; w.wander=0; w.tx=null; } }
      P.story.act=Math.max(P.story.act||1,4);
      if(qs('enchanter')==='active'){ P.prog.enchanter=1; completeQuest('enchanter'); }
      if(!P.quests.homecoming) P.quests.homecoming='active';
      banner('THE MASK COMES OFF','THE WARRIOR PRINCESS RETURNS');
      if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(240,220,150,0.85)',54);
      if(Snd.levelup) Snd.levelup();
      // No flowery reunion card - the banner lands, then a plain nudge toward the next step.
      setTimeout(()=>toast('You know him now - your brother, <b>Prince Leo</b>. Find <b>Captain Brant</b> at the dock and <b style="color:var(--ember)">sail to Aldermere</b> to reach your father, King Aldous, before Vath does.',8000),700);
    };
    const p5=()=>{
      closeDialog();
      // the animated memory-flood: the mask lifts and shatters, the amnesia fog tears
      // loose, and it all comes back - the boat, Vath's curse, the wicked mask, and the
      // names JOAN and LEO. Falls straight through to the reunion if the layer is absent.
      if(typeof maskRevealCutscene==='function') maskRevealCutscene(afterReveal);
      else afterReveal();
    };
    const p4=()=>{
      setDialog('<i>You lift your hands to the mask you have worn since the surf first spat you ashore - the one thing the sea let you keep - and for the first time since Emberwick, you take it off.</i>',
        [{label:'Let him see', cls:'gold', fn:p5}]);
    };
    const p3=()=>{
      setDialog('<i>He searches the pale mask as though he could read the face behind it.</i> “Whoever gave you cause to hide it - you don\'t need it. Not from me.” <i>His voice cracks on the next words without his knowing why.</i> “...Please. Take it off. I have to see.”',
        [{label:'…', fn:p4}]);
    };
    const p2=()=>{
      setDialog('“I stack that star every day, and I never once asked why my hands know a shape my head has never seen.” <i>He presses two fingers to the pendant, then to his own chest.</i> “There was a boat. A woman singing. And a girl - older than me, always braver - with her arm across me like a bar of iron.” <i>He looks up, stricken.</i> “That was YOU. Under there. I know it the way I know my own tune.”',
        [{label:'Go on', fn:p3}]);
    };
    setDialog('<i>You hold the pendant up between you. The Woodworker\'s humming falters. His eyes track the five-point star - and for one breath the vague, happy fog behind them tears, and something old and frightened looks out.</i> “That... I know that.” <i>His hands are shaking.</i>',
      [{label:'Steady him', cls:'gold', fn:p2}]);
    return;
  }
  // After the unmasking, before you reach the capital: the prince is impatient to sail.
  if(npc.id==='woody' && P.story && P.story.unmasked && !P.story.act1End){
    setDialog('<i>The prince keeps an axe in easy reach and his eyes on the water.</i> “Every hour on this rock is an hour lost, sister. Father is out there in Vath\'s grip - we need to reach him. Find Brant and <b>sail to Aldermere</b>; I\'m right behind you, Joan.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // Act II climax: you carry the Founders' Sealing Book up from the Tideward Crypt to the
  // boat where Leo keeps the way home. He reads it, fears it, and agrees to seal Vath.
  if(npc.id==='woody' && P.story && P.story.royalGarb && P.story.sealTome && !P.story.sealLearned){ leoSealScene(); return; }
  // Seal learned, capital road open: he keeps the book close and his eyes on the sea-road home.
  if(npc.id==='woody' && P.story && P.story.royalGarb && P.story.sealLearned){
    setDialog('<i>Leo stands by the boat with the Founders\' Sealing Book shut under his arm, the words already going round in him.</i> “I have it, Joan - every line of the binding, and it has me. There\'s nothing left to gather and no one left to ask. Take us to Aldermere. Hold Vath off me while I speak it, and we end this today.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // Act II underway: Leo keeps the boat on Emberwick and the way home while the princess
  // pulls Vath's hooks out of the old isles and hunts down the working that can bind him.
  if(npc.id==='woody' && P.story && P.story.act1End){
    setDialog('<i>Your brother stands at the tideline, one hand near the axe, looking east past every isle you know.</i> “Father bought us this - so don\'t waste it grieving. Vath holds the old islands now, and we don\'t have the strength to take them back yet. So we go and get it.” <i>He almost smiles.</i> “Pull his hooks out of the isles, sister - island by island, the way you always could. Somewhere out past the charts is the thing that binds him for good. Bring me anything written in the old hand, and I\'ll read us the rest of the way. I\'ll keep the boat.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // THE ENDING: at the dawn celebration, Leo offers you the throne at his side. You want the
  // horizon, not a crown - so he takes it, and asks one last favour that points past every chart.
  if(npc.id==='brother' && P.story && P.story.gameWon){
    const toCredits=()=>{ closeDialog(); if(typeof rollCredits==='function') rollCredits();
      else if(typeof banner==='function') banner('THE SHADOW IS SEALED','THE END — FOR NOW'); };
    const favour=()=>setDialog('<i>He settles the stolen crown onto his own brow - and for the first time it looks like it belongs there. Then he grins, the old scheming-brother grin.</i> “So. One favour, before you go. Those charts Old Mabley keeps swearing about - black water past Stormreach, isles no living hand has named - they\'re real. I\'ve seen the soundings. Something out there is stirring, sister, the way something stirred here.” <i>He grips your arm.</i> “Go and see. Free whatever needs freeing. And come home and tell me all of it - I\'ll keep the lamp lit and the sea-road open.” <b style="color:var(--ember)">Beyond the charted isles, a new tide is rising. (Coming soon.)</b>',
      [{label:'I\'ll send word from the edge of the map', cls:'gold', fn:toCredits}]);
    const takeIt=()=>setDialog('<i>Old Mabley, three steps down, isn\'t even pretending not to listen.</i> “There\'s black water past Stormreach, majesty-to-be,” <i>he calls up.</i> “Charts washed in from the deep. Isles with no names on them - and no warrior on them either.” <i>Leo looks from the old sailor to you, and something passes between the two of you that needs no words: you both know exactly where you\'ll be within the month.</i> “Then I\'ll keep the throne warm,” <i>he says softly.</i> “Somebody has to. It was always going to be me - the reader, not the blade.”',
      [{label:'You\'ll be a good king, Leo', fn:favour}]);
    const decline=()=>setDialog('<i>You shake your head before he\'s even done asking, and he laughs, because of course he knew.</i> “No. I didn\'t come all this way across every sea in the world to sit still on a chair, Leo - not even a gold one. You were always the one who loved these halls. I love what\'s past the harbour wall.” <i>He nods, unsurprised, a little proud.</i> “The tide keeps throwing you back out to it, doesn\'t it.”',
      [{label:'Someone has to see what\'s out there', fn:takeIt}]);
    setDialog('<i>Leo waits for you at the foot of the palace stair, the whole freed sea cheering at his back. He looks at you a long moment - the sister who went into the dark for him and came back out.</i> “We did it. Both of us, home, and the shadow in the stone.” <i>His voice goes careful.</i> “Father\'s throne stands empty, Joan. By blood it\'s yours before it\'s mine - you\'re the elder. Rule with me. Aldermere would follow you into the sea and back.”',
      [{label:'Take the throne? Not me.', cls:'gold', fn:decline},
       {label:'Hear him out', fn:decline}]);
    return;
  }
  // Old Wend on the plaza steps of the Act II capital: ask why the watch is gone and he tells
  // you the King has withdrawn into himself and dismissed the whole garrison. Quiet foreboding
  // for the reckoning still ahead - no guards left in Aldermere.
  if(npc.id==='wend'){
    const guards=()=>setDialog('<i>He gives a slow, uneasy nod up toward the palace.</i> “Sent away. Every last one of them - Captain Halvard and all his watch, marched out the gates a fortnight past and not a man called back. The King\'s own order, they tell me.” <i>He drops his voice.</i> “But the King... he hasn\'t been himself. Not for a good while now. Sits that throne day and night, won\'t see his stewards, won\'t hear his court. A man sends off the very swords that keep him safe - you tell me what that means, friend, for these old bones don\'t like the shape of it. A capital with no watch at all. I never thought I\'d live to walk it.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    setDialog('<i>An old man sits alone on the plaza steps, watching the bare gate-posts where the watch used to stand.</i> “Quiet, isn\'t it? Too quiet for a capital. You feel it too - I can see that you do.”',
      [{label:'Where are all the guards?', cls:'gold', fn:guards},
       {label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // The capital, at the last: the King knows both his children at a glance - then
  // Vath storms the hall. But this is a trap. The King rises to fight and buys his
  // children's escape - only to burn out the very Tideglass strength Vath came to
  // steal. Vath takes the magic, then rewrites the guards' memory to frame the prince
  // and princess as usurpers. This is the close of Act I.
  if(npc.id==='aldous' && P.story && P.story.unmasked && !P.story.act1End){
    // The reunion plays as ordinary dialogue with the King; pressing on it rolls
    // straight into the animated throne-hall cutscene (Vath crashes in, the King's
    // last stand, the frame), which then hands off to the sailing epilogue.
    const toCutscene=()=>{
      closeDialog();
      if(Snd.magic) Snd.magic();
      if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(160,110,240,0.85)',70);
      G.shake=1.0;
      if(typeof throneCutscene==='function'){ setTimeout(throneCutscene, 400); return; }
      // fallback if the cutscene layer isn't loaded: resolve Act I and sail on
      P.story.act1End=1; P.story.vathAscendant=1; P.story.kingFallen=1; P.story.framed=1;
      if(qs('homecoming')==='active') completeQuest('homecoming');
      if(typeof updateCrownFolkMood==='function') updateCrownFolkMood();
      if(typeof autoSave==='function') autoSave();
      if(typeof sailEpilogue==='function') sailEpilogue();
      else toast('<b style="color:#c9a0ff">Vath holds the Tideglass magic now</b>, and the strait behind you is his. But you and your brother live - and somewhere past the charted isles is the strength to come back for him. <b style="color:var(--ember)">Set your prow for Stormreach, and Act II.</b>',10000);
    };
    setDialog('<i>King Aldous rises from the Tideglass Throne, and reads your bare face and the man at your side in a single breath. The crown does not know how to weep; the old man beneath it does.</i> “A masked stranger unmaking my enemy\'s work, isle by isle - and all this time it was YOU. Joan. My daughter, my firstborn, that I gave to the water with my own blind hand. And you-” <i>his voice fails on the prince.</i> “...Leo. My boy. Both of you. Alive.”',
      [{label:'We came home, Father.', cls:'gold', fn:toCutscene}]);
    return;
  }
  // Act I aftermath: the King is diminished but tended; a somber coda that points at Act II.
  if(npc.id==='aldous' && P.story && P.story.act1End){
    setDialog('<i>They have not moved the King far from his throne. He is awake, grey and quiet, the Tideglass light gone out of him - but his hand finds yours with the old strength.</i> “Don\'t look at me like a grave, daughter. He took the magic; he did not take the man.” <i>His eyes go east.</i> “Go where he can\'t reach yet. Come back when you can end this. I kept the two of you through long years of empty coffins - I can keep a while longer.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // === The Duchess's love quest ==========================================
  // Deliver Maelis's sealed letter to Lord Elias on the Sunward Isle. He reads it,
  // his nerve finally catches up to his heart, and he writes back a proposal.
  if(npc.id==='elias' && qs('duchesslove')==='active' && !P.story.loveReplied){
    const send=()=>{
      P.story=P.story||{}; P.story.loveReplied=1;
      if(qs('duchesslove')==='active') completeQuest('duchesslove');
      P.quests.duchessreply='active'; P.prog.duchessreply=0;
      closeDialog();
      if(Snd.quest) Snd.quest();
      setTimeout(()=>toast('<i>Lord Elias folds the reply twice, presses his ring into the wax, and holds it out in both hands.</i> <b style="color:var(--ember)">Carry his answer back to Duchess Maelis in Barik.</b>',8000),300);
    };
    const p2=()=>{
      setDialog('<i>He reads it twice. Then a third time, more slowly, as though the words might change. When he looks up, his eyes are wet and his voice is steady for the first time.</i> “Three years I told myself the strait was the thing keeping us apart. It was never the strait.” <i>He takes up pen and a clean sheet.</i> “Give me a moment. I am going to write the sentence I have been too much a coward to write - and then, if she will have me, I am crossing that water for good.”',
        [{label:'Take your time', cls:'gold', fn:send}]);
    };
    setDialog('<i>You hold out the wax-sealed letter. Lord Elias goes very still, then takes it as if it might break.</i> “This seal - iron and ink, pressed by a hand I would know anywhere and have never held.” <i>His thumb hovers over the wax.</i> “She sent it with a person, not a courier. She sent it with YOU. …Forgive me. Let me read.”',
      [{label:'Give him the letter', cls:'gold', fn:p2}]);
    return;
  }
  // Elias, after writing back, waiting on word from Barik.
  if(npc.id==='elias' && P.story && P.story.loveReplied && !P.story.duchessWed){
    setDialog('<i>Lord Elias paces the tideline, watching the Barik heading.</i> “Is she - has she read it yet? No, don\'t tell me, I\'ll only unravel. Just - put it in her hand. Please. I have waited three years; I can wait the length of your crossing.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // The reply, carried home to Maelis: she reads it, and Barik holds a wedding.
  // The cutscene closes with the Duchess's gift of 1000 gold and a new Duke.
  if(npc.id==='maelis' && qs('duchessreply')==='active' && !P.story.duchessWed){
    const finishWed=()=>{
      P.story=P.story||{}; P.story.duchessWed=1;
      if(qs('duchessreply')==='active') completeQuest('duchessreply');   // grants 1000 gold
      // Elias leaves the Sunward Isle for good; the Duke takes his place at her side
      if(G.npcs){ const ei=G.npcs.findIndex(n=>n.id==='elias'); if(ei>=0) G.npcs.splice(ei,1); }
      if(typeof wedDuke==='function') wedDuke();
      if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(255,215,106,0.9)',64);
      setTimeout(()=>toast('<b style="color:#ffd76a">The Duchess presses 1000 gold into your hands.</b> “A steward\'s fee, and a friend\'s thanks. You will always have a room in this keep.”',8000),400);
    };
    const sc3=()=>{
      storyCard('<b style="color:#ffd76a; font-size:1.2em">A BARIK WEDDING</b><br><br><i>They marry beneath the keep\'s old banners, the strait calm at the windows. The tide-scholar who charted every crossing but the one that mattered stands across from the Duchess who rules by ledger and patience - and for once neither of them has a word ready. The bell of Barik rings until dusk.</i>',
        {label:'To the happy couple', onOk:finishWed});
    };
    const sc2=()=>{
      storyCard('<i>Within the month, a sail out of the Sunward Isle rounds the Barik light. Lord Elias steps onto the dock with one trunk of clothes and three of books, and Duchess Maelis - who has faced down a cousin\'s whole March without blinking - suddenly cannot decide what to do with her hands.</i>',
        {label:'Continue', onOk:sc3});
    };
    banner('THE DUCHESS SAYS YES','A LETTER ANSWERED AT LAST');
    setDialog('<i>Maelis breaks the wax, reads, and sets the letter flat on the ledger she rules her realm by. For a long moment the Duchess of Barik simply breathes.</i> “Three years of careful sentences, and the fool finally writes a plain one.” <i>She almost laughs; it comes out unsteady.</i> “He\'s coming. He\'s actually coming. …Then Barik had better make ready for a wedding.”',
      [{label:'You should tell him yes', cls:'gold', fn:sc2}]);
    return;
  }
  // Nessa the sailmaker owns the sail quest - once Tolen sends you to her, she warns
  // of the thing fouling the seized works below the windmill where her sail is locked.
  if(npc.id==='nessa' && qs('sail')==='active' && !(P.story&&P.story.haveSail)){
    setDialog('<i>Nessa sets down her needle and nods toward the windmill on the rise.</i> “My sail\'s down in the old works, behind the millstone gate - go <b>in through the mill</b> and take the <b>cellar stair down</b>. But hear me: it weren\'t rust that stopped those works. There\'s a <b>thing</b> fouled in the shaft, and it don\'t like company. Put it down and bring my sail up, and I\'ll step it to your board. Go armed.”',
      shopButtons(npc,[{label:'I\'ll go down',ghost:true,fn:closeDialog}]));
    return;
  }
  // Burl the millwright is just flavor now - he padlocked the works, but the sail (and
  // its quest) are Nessa's. He still grumbles about what's down there.
  if(npc.id==='burl' && qs('sail')==='active' && !(P.story&&P.story.haveSail)){
    setDialog('<i>Burl thumbs toward the mill behind him.</i> “Nessa send you down for her sail? Aye, I chained that stair myself when the gear-train seized - and I\'d not have done it for rust. Something\'s FOULED in the shaft down there. Mind yourself, and mind my millstones.”',
      shopButtons(npc,[{label:'I\'ll be careful',ghost:true,fn:closeDialog}]));
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
  // === THE TIDEFARER'S VERSE: the princess brings the prophecy up from the catacomb ====
  // On the strand Leo told her to "find what this place is hiding." This is her answer:
  // the verse-stone copied out of the Drowned Vault. He reads the old royal script their
  // father made them both learn - and names the hunt it sets them on. Fires once.
  if(npc.id==='brother' && P.story && P.story.reachProphecy && !P.story.reachProphecyRead){
    const read=()=>{
      P.story.reachProphecyRead=1;
      if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(201,176,255,0.85)',52);
      if(typeof burst==='function') burst(P.x,P.y-0.5,'#c9b0ff',18,2.4);
      banner('THE HUNT HAS A NAME','FIND THE TIDEFARER, FIND THE WEAPON');
      setDialog('<i>His eyes race the lines, and his breath catches.</i> “…the weapon the great queen forged to seal the shadow, and she lies buried with it, not where the histories laid her.” <i>He reads it again, slower, to be sure of it.</i> “Joan - this isn\'t a grave-song. It\'s a <b>prophecy</b>, in our own ancestor\'s hand. The Tidefarer forged a weapon that could end Vath for good, and it lies in her hidden grave - not the tomb the histories gave her. It doesn\'t say <i>where</i>… but a thing named is a thing that can be found.” <i>He rolls the rubbing careful into his case.</i> “I\'ll keep reading what\'s left. Go on freeing the isles - only now we know what we\'re freeing them TOWARD.”',
        [{label:'A name at last', cls:'gold', fn:()=>{ if(typeof autoSave==='function') autoSave(); closeDialog(); }}]);
    };
    setDialog('<i>You lay the verse-rubbing in your brother\'s hands. Leo goes still the moment he sees the letters running down it.</i> “Old royal script - the founders\' hand, or near enough. And this cadence...” <i>He stops, already reading.</i> “The catacomb. Of course it was the catacomb.”',
      [{label:'Read it, brother', fn:read}]);
    return;
  }
  // === THE FOUNDERS' SEAL: brought to the companion Leo on any isle he holds ==========
  if(npc.id==='brother' && P.story && P.story.sealTome && !P.story.sealLearned){ leoSealScene(); return; }
  if(npc.id==='brother' && P.story && P.story.sealLearned){
    setDialog('<i>Leo keeps the Founders\' Sealing Book shut under his arm, the binding already turning in him.</i> “I have every line of it, sister - and it has me. Take us to Aldermere when you\'re ready; hold Vath off me while I speak the seal, and we finish this.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // === THE WARDING VEIL: the brother reads the hush-frost spellbook ==========
  // The princess brings the Hush-Frost Spellbook up from the Rimefissure; Leo, the
  // scholar, reads the old royal script and casts the warding that hides them both from
  // Vath's eye - shown as its own overlay cutscene (veilCastCutscene, 39-more-cutscenes.js).
  // Casting the veil is what reopens the sea-roads to the old islands (boatMenu reads
  // P.story.vathVeil). "A warrior and a mind" - she found it, he casts it. The book also
  // carries other secrets - abilities the old line hid across the isles - which seeds the
  // hunt for the power to finally fight Vath.
  if(npc.id==='brother' && P.story && P.story.veilTome && !P.story.vathVeil){
    // The casting plays as its own overlay cutscene, whose closing beats already say the
    // way home is open and point you back at the old islands - so there is NO follow-up
    // popup card here (removed by request). We just save once the scene ends.
    const afterCast=()=>{ if(typeof autoSave==='function') autoSave(); };
    const cast=()=>{
      closeDialog();
      if(typeof take==='function') take('veilrune',1);
      if(typeof grantVathVeil==='function') grantVathVeil(true);   // sets vathVeil + spells.veil, silently
      else { P.story.vathVeil=1; P.spells=P.spells||{}; P.spells.veil=1; }
      if(typeof veilCastCutscene==='function') veilCastCutscene(afterCast);
      else {
        if(Snd.magic) Snd.magic();
        if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(201,176,255,0.9)',64);
        if(typeof burst==='function') burst(P.x,P.y-0.5,'#c9b0ff',26,3);
        G.slowmo=Math.max(G.slowmo||0,1.1);
        banner('THE WARDING VEIL','VATH\'S EYE SLIDES PAST YOU');
        setTimeout(afterCast,700);
      }
    };
    const p2=()=>{
      setDialog('<i>He works down the frost-page, lips moving.</i> “It\'s a warding of some kind - a hiding-spell, I think. The rest is past me at a glance.” <i>He looks up.</i> “Only one way to learn what it does. Hold still, sister - let me try it on you.”',
        [{label:'Cast it, brother', cls:'gold', fn:cast}]);
    };
    setDialog('<i>You lay the ice-bound book in your brother\'s hands. Leo goes still the moment he sees the marks.</i> “Old royal script - the founders\' hand, or older. Where did you...” <i>His scholar\'s eyes are already racing the page.</i>',
      [{label:'It was in the deep ice, past the Rimebound', fn:p2}]);
    return;
  }
  // Stormreach, after the verse is read: Leo holds the boat with the hunt in mind, so his
  // idle chatter no longer sends you to "find what this place is hiding" - you already did.
  // (Reach-world only, so it never overrides the Frozen-Isle Leo's landing lines.)
  if(npc.id==='brother' && typeof G!=='undefined' && G.worldId==='reach' && P.story && P.story.reachProphecyRead){
    setDialog('<i>Leo keeps the Drowned Verse close and an eye on the moored boat.</i> “Every curse you break is a step nearer her grave - the Tidefarer\'s, and the weapon in it. Keep pulling Vath\'s hooks out of the isles, sister. I\'ll hold the way home, and I\'ll keep puzzling the verse.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // After the Veil is cast: the brother holds the Frozen landing and points you home.
  if(npc.id==='brother' && P.story && P.story.vathVeil){
    setDialog('<i>Leo keeps a weather-eye on the strait and the moored boat, the frost-book open across his knee.</i> “The Veil holds - I can feel it holding. His curses have had free run of the old islands while we were gone; there\'s no telling what\'s festered. Sail back and undo them, one at a time - I\'ll keep the way home, same as ever, and keep reading. There are powers written in here yet, sister. If any of them can turn Vath, I\'ll find it.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // Rask the Bladesworn teaches the parry in ONE smooth lesson. The moment Bram's
  // kit is done (bladeoath offered or accepted), a single choice accepts, teaches,
  // AND completes it - so the guard is his in one conversation and the King unlocks.
  // If the newcomer arrives with no blade yet, he sends them to Bram to be armed first.
  if(npc.id==='rask' && !(P.unlocked&&P.unlocked.parry) && qs('bladeoath')!=='done'){
    if(qs('bladeoath')==='avail' || qs('bladeoath')==='active'){
      const drilling = !!P.parryDrill;
      setDialog('<b style="color:var(--ember)">'+QUESTS.bladeoath.title+'</b><br>“'+QUESTS.bladeoath.brief+'”',
        shopButtons(npc,[{label: drilling?'Ready - pitch it':'Take up your blade - drill me', cls:'gold', fn:()=>{
            closeDialog();
            if(typeof beginParryDrill==='function') beginParryDrill();   // the hands-on lesson: parry 3 thrown billets
          }},
          {label:'Maybe later', ghost:true, fn:closeDialog}]));
      return;
    }
    // no sword yet - the lesson would be wasted, so point them back to the forge
    setDialog('<i>The old swordsman looks you up and down and finds no blade on your hip.</i> “I teach the turning of a sword, friend - and you\'ve none to turn. Go see <b>Bram</b> at the forge; earn your iron off him and he\'ll send you back to me. Come find me when there\'s steel on your hip.”',
      shopButtons(npc,[{label:'I\'ll find Bram', ghost:true, fn:closeDialog}]));
    return;
  }
  // Sage Orin's off-the-cuff nudge toward the Drowned Knight. Once the traveller can
  // both turn a blade (parry) and dart aside (dash) - i.e. after Rask and Orin's own
  // lesson - the old sage half-remembers "an old friend" up the far north-east headland.
  // Shown ONCE (flag), then flows straight on into Orin's normal dialogue/quests.
  if(npc.id==='orin' && (P.unlocked&&P.unlocked.parry) && (P.unlocked&&P.unlocked.dash) &&
     !(P.unlocked&&P.unlocked.combos) && !(P.story&&P.story.knightHint)){
    P.story=P.story||{}; P.story.knightHint=1;
    setDialog('<i>As you make to leave, Orin waves a hand as though something has just surfaced.</i> “Oh - before you wander off. If you\'ve a taste for fighting <i>well</i>, and not merely fighting… there\'s an old friend of mine who keeps to the far <b>north-east headland</b>. Cantankerous sort. I\'ve not laid eyes on him in - hah - longer than I\'ll admit to. Go and poke about up there, would you? Tell him <b>Orin sent you</b>. He\'ll know what to make of someone like you.” <i>He has already turned back to his books, as if he never spoke.</i>',
      [{label:'…the far north-east', fn:()=>buildDialogContent(npc)}]);
    return;
  }
  // The Drowned Knight - the ancient spirit-protector who teaches the flow of blades
  // (cancels, chains, guard). The drill and the unlock live in 50-ancient-knight.js.
  if(npc.id==='knight' && !(P.unlocked&&P.unlocked.combos)){
    P.story=P.story||{};
    // Not yet a proper fighter: send them back to earn the basics first (mirrors Rask).
    if(!((P.unlocked&&P.unlocked.parry) && (P.unlocked&&P.unlocked.dash))){
      setDialog('<i>The spirit\'s gaze passes over you and finds you wanting.</i> “You\'ve the will - but not yet the craft. Come back when you can <b>turn a blade</b> and <b>dart aside</b>, and there\'ll be something in you worth the sharpening.”',
        [{label:'I\'ll return', ghost:true, fn:closeDialog}]);
      return;
    }
    // the training pitch (the three lessons), leading into the hands-on drill
    var knightOffer=function(){
      setDialog('<b style="color:#bcd8ee">“Any fool can swing. The trade is in the seams - the breath between one blow and the next, where a fight is truly won and lost.”</b> <i>He turns his spectral blade in the low light.</i> “I\'ll teach you to <b>cancel</b> a stroke you have already begun, to <b>chain</b> your footwork past its natural end, and to <b>set your guard</b> in the half-instant you are given. Three lessons. Then you will move like water - and the isles will learn to fear the tide again. Will you learn?”',
        [{label:'Teach me', cls:'gold', fn:()=>{ closeDialog(); if(typeof beginKnightDrill==='function') beginKnightDrill(); }},
         {label:'Not yet', ghost:true, fn:closeDialog}]);
    };
    if(P.knightDrill){
      setDialog('<b>“The lesson stands. When your feet are ready, so am I.”</b>',
        [{label:'I\'m ready', cls:'gold', fn:()=>{ closeDialog(); if(typeof knightDrillNudge==='function') knightDrillNudge(); }},
         {label:'A moment', ghost:true, fn:closeDialog}]);
      return;
    }
    if(!P.story.knightMet){
      P.story.knightMet=1;
      if(typeof knightRevealFx==='function') knightRevealFx();
      setDialog('<i>You crest the headland expecting a person - Orin\'s "old friend." There is no one. Then the air goes cold, the light bends, and a knight in drowned armour stands where the wind had been, watching you with a quiet, dreadful patience.</i><br><b style="color:#bcd8ee">“You were expecting a pulse. Orin always did leave out the interesting part.”</b> <i>Something like a smile crosses the ruined helm.</i> “I am what remains of this isle\'s first protector - I have kept this rock since before your grandmother\'s grandmother drew her first breath. And you: curse-broken, nameless, and already quicker than you have any right to be.”',
        [{label:'…you\'re a ghost?', fn:knightOffer}]);
      return;
    }
    knightOffer();
    return;
  }
  // After the flow is learned, the knight keeps the headland as a wry old mentor.
  if(npc.id==='knight' && (P.unlocked&&P.unlocked.combos)){
    setDialog('<i>The knight rests his spectral blade point-down, both hands folded on the pommel.</i> <b style="color:#bcd8ee">“You carry the flow now - wear it lightly, and it will not fail you.”</b> “Go on, tide-child. Break his curses off these islands, one by one. I have kept this headland a long age, and I will keep it yet - come back to me when an old sword\'s counsel would serve.”',
      [{label:'Thank you', ghost:true, fn:closeDialog}]);
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
            // A quest that teaches a skill (Orin's dash) hands you off to the lesson card, not
            // back into his brew menu: on Continue, CLOSE the dialog so the held dash card pops
            // over a clear screen (closeDialog fires P._dashCardPending) instead of the shop list.
            const cont = (q.rw && q.rw.dash) ? closeDialog : ()=>buildDialogContent(npc);
            setDialog('“'+q.doneText+'”',[{label:'Continue',fn:cont}]);
        }},{label:'Not yet',ghost:true,fn:closeDialog}]));
      return;
    }
  }
  // Brakk, the Pinewood thieves' chief: a parley over the stolen silk. Pay his ransom and the
  // bolt's yours, no blood spilt; tell him to get stuffed and he sets every guard on you. Once
  // provoked, there's no more talking - just his boys. (The guards are flagged brigandGuard in
  // spawnMobsMain; "GET 'EM, BOYS!" flips them all to a committed chase.)
  if(npc.id==='brakk'){
    P.story=P.story||{};
    if(P.story.brakkProvoked){
      setDialog('<i>Brakk bares his teeth over the din.</i> “Talk’s DONE, sailor - should’ve paid when you had the manners!”',
        [{label:'(back away)', ghost:true, fn:closeDialog}]);
      return;
    }
    const canPay=(P.gold||0)>=1000;
    setDialog('<i>A broad thief in a patched greatcoat plants himself between you and the cache, thumbs hooked in his belt.</i> “Well, well - come for the pretty cloth, have you? That dawn-silk’s worth a fortune off-isle, and it’s mine by right of taking. Tell you what, friend: <b style="color:#ffd76a">one thousand gold</b> and the bolt’s yours, no blood spilt. Fair’s fair.”',
      [ (canPay
          ? {label:'Pay 1,000 gold', cls:'gold', fn:()=>{
              P.gold-=1000; if(Snd.coin)Snd.coin(); P.story.brakkPaid=1;
              give('silk',1); if(typeof refreshUI==='function') refreshUI(); if(typeof autoSave==='function') autoSave();
              setDialog('<i>Brakk bites the coin, grins, and tosses you the bolt of stolen silk.</i> “Pleasure doing business. Now off my hill, before the boys get ideas.”',
                [{label:'Leave', ghost:true, fn:closeDialog}]);
            }}
          : {label:'Pay 1,000 gold', ghost:true, fn:()=>{
              setDialog('<i>Brakk snorts.</i> “A THOUSAND, I said. Come back when your purse is fatter - or don’t come back at all.”',
                [{label:'…', ghost:true, fn:closeDialog}]);
            }}),
        {label:'“Get stuffed.”', cls:'gold', fn:()=>{
            P.story.brakkProvoked=1; closeDialog();
            if(typeof toast==='function') toast('<b style="color:#ff8a5a">Brakk spits in the dirt.</b> “Ha! GET ’EM, BOYS!”',4200);
            if(Snd.boss)Snd.boss(); G.shake=Math.max(G.shake||0,0.45); if(typeof buzz==='function') buzz(18);
            for(const m of G.mobs){ if(m.brigandGuard && !m.dead){ m.aggro=16; m.state='chase'; m.noAggroT=0; } }
          }},
        {label:'(step back)', ghost:true, fn:closeDialog}
      ]);
    return;
  }
  // Captain Corvo's first ask plays as TWO beats: he lays out what the wizard did to his cove,
  // and only when you jump at the chance to sail does he let you down easy with the ribbon errand.
  if(npc.id==='corvo' && P.quests.ribbon1==='avail'){
    const q=QUESTS.ribbon1;
    setDialog('<b style="color:var(--ember)">'+q.title+'</b><br>“How did you break those pesky violet stones? Ha - I should have known better than to trust the word of that wicked wizard. I promised to sail him to an island east of every chart, and leaving those cursed stones strewn across my cove is how he repays me.”',
      withTravel(npc,[{label:'“Take me to that isle!”', cls:'gold', fn:()=>{
          setDialog('“Oh - you want ME to take you there? Ha, I\'d love nothing more, truly - but my girl Wren has been asking after a ribbon from Mira in the village, and I can\'t leave my boat to sail out that way. Tell you what: you fetch me a ribbon, and I\'ll run you out to that isle whenever you want, free of charge. Mira weaves the best at Thimble and Thread in Greyharbor.”'
            + '<div class="objbox"><b>Objective:</b> '+q.log+'</div>' + rewardText(q),
            withTravel(npc,[{label:'! Accept quest', cls:'gold', fn:()=>{
                acceptQuest('ribbon1');
                setDialog('“Good. Off to Mira with you - I\'ll be right here, minding the sloop.”'
                  + '<div class="objbox"><b>Objective:</b> '+q.log+'</div>'
                  + '<div style="font-size:11px;color:var(--parch-dim);margin-top:6px;">Follow the gold <b style="color:#ffd76a">◆</b> marker and check the tracker, top-right. Return here when it reads <b style="color:#ffd76a">Ready</b>.</div>',
                  [{label:'Off I go',fn:closeDialog}]);
              }},
             {label:'Later', ghost:true, fn:closeDialog}]));
        }},
       {label:'Later', ghost:true, fn:closeDialog}]));
    return;
  }
  // 3) offer available quest
  for(const id in QUESTS){
    if(P.quests[id]==='avail' && QUESTS[id].giver===npc.id){
      const q=QUESTS[id];
      setDialog('<b style="color:var(--ember)">'+q.title+'</b><br>“'+q.brief+'”'
        + '<div class="objbox"><b>Objective:</b> '+q.log+'</div>' + rewardText(q),
        withTravel(npc,[{label:'! Accept quest', cls:'gold', fn:()=>{
            acceptQuest(id);
            setDialog('“'+questAcceptLine(id)+'”'
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
// Travel affordances that must stay reachable in EVERY dialog state. Rell used to carry a
// "fly off the isle" button here, but travel off Windsurf now runs through two visible things
// at the harbour: ASHWING (talk to him to fly UP to the Cloudreach) and the FERRY moored at the
// pier (board it to sail across to the other isles). So Rell just talks - you ask the dragon, not
// the harbormaster, for a flight. Kept as a hook for any future always-reachable travel need.
function withTravel(npc,btns){
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
  // Bram no longer runs a crafting bench - the tutorial smith just gives quests and
  // talk now; gear is earned through the isle's tasks and foes (and the crossing kit).
  // Orin brews nothing now - Sage Orin is a talk-only NPC (lore, hints, quests), no tonic bench.
  if(npc.id==='willa'){
    btns.unshift({label:'Cook at the hearth…', fn:()=>cookMenu(npc)});
  }
  if(npc.id==='kell'){
    btns.unshift({label:'Harbor projects…', fn:()=>projectsMenu(npc)});
  }
  if(npc.id==='maren'){
    btns.unshift({label:'Sell goods…', fn:()=>sellMenu(npc)});
    btns.unshift({label:'Buy Ember Tonic (30g)', fn:()=>{
      if(P.gold>=30){ P.gold-=30; giveQuiet('potion',1); Snd.coin(); refreshUI();
        setDialog('“Sip it slow - or don\'t, if something\'s biting you.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); }
      else setDialog('“Coin first, tonic after. Island rules.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  // Greyharbor's signed shops now actually trade - Sela's Provisions, Ivo's
  // Herbary, and Thimble & Thread (Mira the clothier).
  if(npc.id==='sela'){
    btns.unshift({label:'Buy provisions…', fn:()=>vendorShop(npc,'Provisions for the road - fresh bread, grilled fish, an apple, a tonic for the bad days. What\'ll it be?',
      [{item:'bread',price:5},{item:'cookedfish',price:7},{item:'apple',price:3},{item:'potion',price:30}])});
  }
  if(npc.id==='ivo'){
    // the herbalist will also brew from what YOU bring in off the wilds (bluecaps, ember
    // crystals, slime goo) - the crafting bench Orin used to keep, moved to the herb-makers
    btns.unshift({label:'Brew tonics…', fn:()=>brewMenu(npc)});
    btns.unshift({label:'Buy remedies…', fn:()=>vendorShop(npc,'Tonics and tidebalm, every one brewed on this counter. The blue one\'s twice the mend - and twice the coin.',
      [{item:'potion',price:30},{item:'elixir',price:70}])});
  }
  // The Cloud-Tender keeps a little sky-stall at the landing - fire-tonics off the
  // cloud-tops for the Rainbow Road's long climb. (No more quiver bundles - arrows
  // are found and looted now, not bought off the cloud.)
  if(npc.id==='wisp'){
    btns.unshift({label:'Buy sky-goods…', fn:()=>vendorShop(npc,'Healing off the cloud-tops, friend - red for your hurts. The high road drinks deep, and there\'s no better balm up here.',
      [{item:'potion',price:30}])});
  }
  // Pia runs a food stall on Trade Row - fresh fish off the boats and island-grown fare.
  if(npc.id==='pia'){
    btns.unshift({label:'Buy from the stall…', fn:()=>vendorShop(npc,'Fresh off the boats and the orchards, friend - fish, a grilled fillet, an apple, a loaf, a sweet coconut. A stall with no customers is just a sad little roof - so what\'ll it be?',
      [{item:'fish',price:4},{item:'cookedfish',price:7},{item:'apple',price:3},{item:'bread',price:5},{item:'coconut',price:4}])});
  }
  // Mira the seamstress does not sell the recovered Stolen Silk - it's the one-off bolt
  // the brigands took, meant for Wren's ribbon, not stock to buy back over the counter.
  if(npc.id==='brant' && qs('wreck')==='done'){
    // Once you've found your brother, Brant's boat is a full ferry - sail anywhere,
    // the capital included. Before that, it's the one crossing to Barik.
    if(P.story && P.story.unmasked){
      btns.unshift({label:'Take ship — where to?', fn:()=>{ closeDialog(); boatMenu(); }});
    } else {
      btns.unshift({label:'Set sail for Greyharbor', fn:()=>{ closeDialog(); departEarly(); }});
    }
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
      setDialog('“Right there off the landing, riding at anchor.” <i>He nods out at the water.</i> “Walk out and <b>step aboard the sloop</b> yourself when you\'re ready - give the word to the tiller and she\'ll run you across to Barik. I\'ll stay and mind Wren.”',
        [{label:'Aye, Captain', ghost:true, fn:closeDialog}]);
    }});
  }
  if(npc.id==='sable'){
    btns.unshift({label:'Range drill (20g \u2192 archery)', fn:()=>{
      if(!(P.unlocked && P.unlocked.bow)){ setDialog('\u201cA range drill with no bow to draw? <i>She looks you over and shakes her head.</i> I train archers, not folk who mean to throw rocks at the target. Come back when you\u2019ve a bow on your shoulder - then the wind and I will have something to teach you.\u201d',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      if(P.gold<20){ setDialog('\u201cThe wind teaches for free. I do not.\u201d',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      P.gold-=20; Snd.coin(); refreshUI(); closeDialog();
      P.x=npc.x+1.2; P.y=npc.y+1.2; unstickEntity(P);
      TRAIN={who:'sable', stage:0, rolls:0, combo:0, _r:0, x:P.x, y:P.y,
        dmg0:G.mobs.filter(m=>m.kind==='dummy').reduce((a,m)=>a+(m.maxhp-m.hp),0)};
      toast('<b>Sable\'s drill:</b> deal <b>30 damage</b> to the range dummies with your <b>bow</b>.',5000); Snd.quest();
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
  // The forest hermit cards fine cord from the orb-weavers' silk - an alternative to
  // raiding the brigand camp for Mira's stolen bolt. Help him (he can't climb for
  // bluecaps) and the silk is yours, to carry to Mira for Wren's ribbon. Once.
  if(npc.id==='hermit' && !P.prog.hermitSilk && qs('ribbon2')!=='done'
     && (qs('ribbon1')==='done' || qs('ribbon2')==='avail' || qs('ribbon2')==='active')){
    btns.unshift({label:'“I need silk for a ribbon…”', fn:()=>{
      if(!has('mushroom',3)){
        setDialog('“Silk? The orb-weavers up in my pines spin a thread finer than any loom - I\'ll card you a bolt. But my knees are done climbing for bluecaps. Bring me <b>3 bluecaps</b> and the silk is yours.”',
          shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      take('mushroom',3); P.prog.hermitSilk=1; give('silk',1); Snd.quest(); refreshUI(); autoSave();
      setDialog('“There - a bolt of spider-silk, stronger than Mira\'s own and twice as soft. Carry it to her; she\'ll weave your ribbon and never think to ask where it came from.” <i>(+1 silk - take it to Mira for Wren\'s ribbon.)</i>',
        shopButtons(npc,[{label:'My thanks',ghost:true,fn:closeDialog}]));
    }});
  }
  if(npc.id==='bree' || npc.banker){
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
  if(npc.id==='rook'){
    // the apothecary brews to order too, from the makings you gather
    btns.unshift({label:'Brew tonics…', fn:()=>brewMenu(npc)});
    btns.unshift({label:'Buy remedies…', fn:()=>vendorShop(npc,'Straight off the shelf, friend - the red Ember Tonic for the small hurts, the blue elixir for when the small hurts aren\'t. What\'ll it be?',
      [{item:'potion',price:30},{item:'elixir',price:70}])});
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
    // Chestnut is no longer for sale - he's Hedda's gift for clearing the fields
    // ('Mire in the Fields'). Once you own him, Hedda whistles him up / stables him.
    if(P.horse) btns.unshift({label:P.riding? 'Dismount Chestnut':'Whistle for Chestnut', fn:()=>{
      P.riding=P.riding?0:1; closeDialog(); toast(P.riding?'Chestnut trots up, ears forward. <b>Mounted.</b>':'Chestnut wanders to the nearest grass. <b>Dismounted.</b>',2800);
    }});
  }
  if(npc.id==='saffi' || npc.id==='lani' || npc.id==='wenna' || npc.id==='greta' || npc.id==='hollis' || npc.id==='brinna'){
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
        P.hp=P.maxhp;
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
    btns.unshift({label:'Buy Ember Tonic (30g)', fn:()=>{
      if(P.gold>=30){ P.gold-=30; giveQuiet('potion',1); Snd.coin(); refreshUI();
        setDialog('“Brewed bitter so you remember to stay alive.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); }
      else setDialog('“Eight gold. Healing\'s cheap; herbs aren\'t.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
    btns.unshift({label:'Buy Bluecap (4g)', fn:()=>{
      if(P.gold>=4){ P.gold-=4; giveQuiet('mushroom',1); Snd.coin(); refreshUI();
        setDialog('“Glows a little. That\'s how you know it\'s working.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); }
      else setDialog('“Four coin a cap.”', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  // Willa and every island farmer (npc.farmer, set in 36-island-farms.js) hand out
  // seed for free - the "work with a farmer" hook that makes their plots plantable.
  if(npc.id==='willa' || npc.farmer){
    btns.unshift({label:'Ask for seeds (free)', fn:()=>{
      giveQuiet('seed',3); Snd.pickup(); refreshUI();
      const line = npc.id==='willa'
        ? '“Seeds are the island\'s, not mine. Plant kindly.” <i>(+3 seeds)</i>'
        : '“Here - a handful of seed. Work the beds and they\'ll pay you back.” <i>(+3 seeds)</i>';
      setDialog(line, shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  return withTravel(npc,btns);
}
