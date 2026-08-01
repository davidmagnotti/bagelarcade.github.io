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
  if(npc && npc.id==='woody' && P.story && P.story.royalGarb) return 'Prince Jaist';
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
  const dl=dist(P.x,P.y,npc.x,npc.y)||1;
  npc.face={x:(P.x-npc.x)/dl, y:(P.y-npc.y)/dl};
  dlg.open=true; dlg.npc=npc;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent=npcDisplayName(npc);
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
  // The Hollow King is gated behind Sage Orin's fire. If the traveler comes to Maren
  // with steel but no staff, she will not speak the causeway gate open - she sends
  // them to Orin first. (Once his staff quest is done, the normal offer path fires,
  // with Maren's astonishment that Orin lent it woven into the brief.)
  if(npc.id==='maren' && qs('king')==='avail' && qs('mushrooms')!=='done'){
    setDialog('<i>Maren\'s face goes grave at the mention of the crypt.</i> “The Hollow King - aye, he stirs, and I\'ll speak the gate open for the one who\'ll face him. But not for steel alone. Whatever crawls beneath that crypt is older than iron, and it does not fear a blade. It is his waking that cursed the strait - his spite reaches out into the water and drags down any hull that dares the crossing. Put him down and the sea loosens its grip; Emberwick can sail again.” <i>She nods up the north road, toward the tower.</i> “Go and see <b>Sage Orin</b>. Do what the old mage asks of you, and let him arm you with more than an edge. Come back to me when you carry his <b>fire</b> - then, and only then, will I open the causeway.”',
      shopButtons(npc,[{label:'I\'ll find Orin', ghost:true, fn:closeDialog}]));
    return;
  }
  // Fire alone is not enough: the traveler also needs the footwork Orin's tower
  // teaches. If the staff quest is done but the scrying orb's dash has not yet been
  // learned, Maren will not open the causeway - she sends them back up to the tower
  // to lay hands on the orb before they take up the Hollow King.
  if(npc.id==='maren' && qs('king')==='avail' && qs('mushrooms')==='done' && !(P.unlocked&&P.unlocked.dash)){
    setDialog('<i>Maren stays your hand before you can speak of the crypt.</i> “Orin\'s fire, aye - but fire alone won\'t carry you through what waits down there. Did the old man not send you to his scrying orb?” <i>She frowns up the north road, toward the tower.</i> “Go back to <b>Orin\'s tower</b> and lay both hands on the <b>orb</b>. It will teach your feet to <b>dash</b> - and you\'ll want that step under you before I open the causeway. Come back when you have it.”',
      shopButtons(npc,[{label:'Back to the tower', ghost:true, fn:closeDialog}]));
    return;
  }
  // After the Hollow King falls, the elder does more than thank you: she names the
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
       {label:'The sea can wait', ghost:true, fn:toBoat}]);
    return;
  }
  // The Royal Audience - a scripted scene that opens Act III. The King receives
  // the curse-breaker, his gaze snags on the pendant (rare, short, unexplained),
  // and he tells the tragedy that binds Vath to the throne, then charges you.
  // Starts simply on talking to the King, any time before he has charged you
  // (kingTold) and before the later reveal - no herald/audience-quest step needed.
  if(npc.id==='aldous' && !(P.story&&(P.story.kingTold||P.story.unmasked||P.story.act1End))){
    const p3=()=>{
      setDialog('<i>He turns the truth over like a blade carried too long.</i> “The curses across my isles - the wyrm, the leviathan, the aerie, the weeping strait - are all one hand\'s work. His. I\'d know Vath\'s bindings anywhere; he learned them at this court. He did not drown thirty years ago. He\'s been out there all this time - and my children with him, or their graves.” <i>The King rises.</i> “I cannot send armies against a ghost. But you walk where he walks and unmake what he makes. Find him, traveler. Find what became of my boy and girl.”',
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
      setDialog('“Thirty years past, I had a wife I did not deserve, a fierce slip of a daughter who would sooner duel the guard than curtsy, and a son not yet a season old. Then the curses began - waters that ate ships, beasts that would not lie down, isle after isle turning strange and cruel. I sent to learn their root, and my most trusted man went to lead the search and keep my blood safe: my daughter, my infant son, and the queen who would not be parted from either. His name was <b>Vath</b>.” <i>His jaw tightens.</i> “A storm took the ship off the shoals. We recovered timbers and grief, nothing else. I buried three empty coffins - my queen, my girl, my boy - and called Vath a loyal man drowned in my service.”',
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
      setDialog('<i>He spreads his hands, all warmth again.</i> “But here I am, running on, and you did not climb all this way for an old man’s riddles.” <i>The smile returns; it still does not reach his eyes.</i> “There is a matter on this isle that someone of your… talents could set right. And I pay - handsomely. Shall I tell you of it?”',
        [{label:'Go on', cls:'gold', fn:()=>buildDialogContent(npc)}]);
    };
    const p3=()=>{
      setDialog('<i>His gaze snags on the pendant at your throat, and for the space of a breath the warmth drains out of him - something older and hungrier looking through the charm.</i> “…That is a fine old piece you wear. Very fine. I have seen its like before - once, a long way from here.” <i>He catches himself, and the easy smile slides back into place.</i> “Forgive an old collector. Pretty things are a weakness of mine.”',
        [{label:'…Where would that have been?', fn:()=>setDialog('“Oh - here, there. A binder wanders.” <i>He waves the question off like smoke.</i> “I never do recall the where of a thing. Only the worth of it.”',[{label:'Continue', fn:p4}])},
         {label:'Say nothing', fn:p4}]);
    };
    const p2=()=>{
      setDialog('“An Emberbinder. I bind fire to a purpose, where lesser hands only let it burn.” <i>He looks you over, unhurried, the way a jeweller weighs a stone.</i> “And you - washed up, nameless, a stranger even to your own face. How the tides do provide. I have always found the nameless make the finest company. They carry no… complications.”',
        [{label:'What do you want?', fn:p3}]);
    };
    setDialog('<i>The robed stranger turns to face you before you have made a sound, as though he felt you coming up the path.</i> “Ah - there you are. I did wonder when the sea’s newest gift would wander my way.” <i>His smile is generous, practiced, and does not once touch his eyes.</i> “Vath. A binder of fire; a friend to the friendless. And you are… interesting. Yes. Quite interesting.”',
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
  // The pendant, shown to the Woodworker: the ward cracks his binding. He begs the
  // masked stranger to show her face - and when she does, the fog tears for them
  // both. Brother and sister, the scholar and the warrior, remember at once. This
  // is the emotional climax of Act I, and it takes the mask off for good.
  if(npc.id==='woody' && qs('enchanter')==='active' && P.story && !P.story.unmasked){
    const p5=()=>{
      P.story.masked=0; P.story.unmasked=1; P.story.remembered=1; P.story.siblingsKnown=1;
      P.story.royalGarb=1;   // the castaway is the princess again: true colours, true look
      P.story.act=Math.max(P.story.act||1,4);
      if(qs('enchanter')==='active'){ P.prog.enchanter=1; completeQuest('enchanter'); }
      if(!P.quests.homecoming) P.quests.homecoming='active';
      closeDialog();
      banner('THE MASK COMES OFF','THE WARRIOR PRINCESS RETURNS');
      if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(240,220,150,0.85)',54);
      if(Snd.levelup) Snd.levelup();
      const cardB=()=>storyCard('<i>Then the smile fades - you both remember the rest in the same breath.</i> “Vath,” <i>you say, the way you name a wound.</i> “It was always Vath - and Father is still out there in his grip.” <i>The salt-bleached rags fall away and you stand in your own colours at last: a deep royal magenta, your hair swept up in the old high ponytail. Beside you, Jaist trades the woodpile grey for his own bright blue and shoulders his axe like the sword it should have been.</i> “Take me to Father,” <i>he says.</i> “And I\'m not letting you walk into Vath alone this time.”',
        {label:'To Aldermere', onOk:()=>{
          setTimeout(()=>toast('Your brother the prince walks at your side now. <b style="color:var(--ember)">Sail to Aldermere and bring both of you before King Aldous</b> - before Vath reaches the throne first.',8000),400);
        }});
      setTimeout(()=>storyCard('<i>The mask comes away, and thirty years of fog goes with it. You remember the deck pitching in the dark, a woman singing, your little brother screaming - and your own name at last, the one the sea had kept from you.</i> <b>Joan.</b> <i>You say it aloud, and it fits like a hand in an old glove.</i> “You always ran AT the storm, Joan,” <i>your brother says, half a laugh and half a sob - and his own name surfaces alongside yours.</i> <b>Jaist.</b> “The warrior. And I read the books and named the stars. Some pair we make.” <i>For one long breath the woodpile and all the lost years fall away, and the two of you simply look at each other - and smile.</i>',
        {label:'Go on', onOk:cardB}),1100);
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
    setDialog('<i>The prince has left the woodpile for good; he keeps one hand near the axe and his eyes on the water.</i> “Why are we still on this rock? Vath wants what runs in Father\'s blood - the Tideglass magic - and every hour we wait is an hour closer to him having it. <b>Sail to Aldermere.</b> I\'m right behind you, Joan.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
    return;
  }
  // Act II teaser, once Act I has closed on the capital.
  if(npc.id==='woody' && P.story && P.story.act1End){
    setDialog('<i>Your brother stands at the tideline, looking east past every isle you know.</i> “Father bought us this - don\'t waste it grieving. Vath has the Tideglass magic now, and we don\'t have the strength to take it back. Not yet.” <i>He almost smiles.</i> “So we go and get strong. There are isles out past the charts, and allies we haven\'t made. When we come back for him, we come back ready. <b style="color:var(--ember)">(Act II - coming soon.)</b>”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
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
      else toast('<b style="color:#c9a0ff">Vath holds the Tideglass magic now</b>, and the strait behind you is his. But you and your brother live - and somewhere past the charted isles is the strength to come back for him. <b style="color:var(--ember)">Act II - coming soon.</b>',10000);
    };
    setDialog('<i>King Aldous rises from the Tideglass Throne, and reads your bare face and the man at your side in a single breath. The crown does not know how to weep; the old man beneath it does.</i> “A masked stranger unmaking my enemy\'s work, isle by isle - and all this time it was YOU. Joan. My daughter, the one the sea took first. And you-” <i>his voice fails on the prince.</i> “...Jaist. My boy. Both of you. Alive.”',
      [{label:'We came home, Father.', cls:'gold', fn:toCutscene}]);
    return;
  }
  // Act I aftermath: the King is diminished but tended; a somber coda that points at Act II.
  if(npc.id==='aldous' && P.story && P.story.act1End){
    setDialog('<i>They have not moved the King far from his throne. He is awake, grey and quiet, the Tideglass light gone out of him - but his hand finds yours with the old strength.</i> “Don\'t look at me like a grave, daughter. He took the magic; he did not take the man.” <i>His eyes go east.</i> “Go where he can\'t reach yet. Come back when you can end this. I kept the two of you for thirty years of empty coffins - I can keep a while longer.”',
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
  // === THE WARDING VEIL: the brother casts the hush-frost rune =============
  // The princess brings the Rune of Hush-Frost up from the Rimefissure; Jaist, the
  // scholar, reads the old royal script and works it into the warding that hides them
  // both from Vath's eye. Setting the veil is what reopens the sea-roads to the old
  // islands (boatMenu reads P.story.vathVeil). "A warrior and a mind" - she found it,
  // he casts it.
  if(npc.id==='brother' && P.story && P.story.veilTome && !P.story.vathVeil){
    const cast=()=>{
      closeDialog();
      if(typeof take==='function') take('veilrune',1);
      if(typeof grantVathVeil==='function') grantVathVeil(true);   // sets vathVeil + spells.veil, silently
      else { P.story.vathVeil=1; P.spells=P.spells||{}; P.spells.veil=1; }
      if(Snd.magic) Snd.magic();
      if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(201,176,255,0.9)',64);
      if(typeof burst==='function') burst(P.x,P.y-0.5,'#c9b0ff',26,3);
      G.slowmo=Math.max(G.slowmo||0,1.1);
      banner('THE WARDING VEIL','VATH\'S EYE SLIDES PAST YOU');
      const card2=()=>storyCard('<b style="color:#c9b0ff">You learn the WARDING VEIL. Vath\'s eye slides past you now.</b> <i>The sea-roads home are open again - the ferry can steal you back to the old islands: <b>Barik</b>, the <b>Sunward Isle</b>, <b>Windsurf</b>, and <b>Emberwick</b>.</i> “Not the capital,” <i>Jaist warns.</i> “His gaze never leaves the throne he stole. But everywhere else his curses have festered while we were chased out to the reaches - and now we can walk back in unseen and pull his hooks out, one isle at a time. Go, sister. I\'ll mind the boat.”',
        {label:'Sail for the old islands', onOk:()=>{ if(typeof autoSave==='function') autoSave(); if(typeof toast==='function') setTimeout(()=>toast('<b style="color:var(--ember)">Sail back to the old islands</b> - the Warding Veil hides you from Vath. Board the ferry when you\'re ready.',7000),500); }});
      setTimeout(()=>storyCard('<i>Jaist closes his eyes and speaks the old words the way he used to read to you when the sea was loud - low, sure, unhurried. The frost-rune lifts from his palm, breaks into a fine violet snow, and settles over you and sinks in: cold, then gone.</i> “There,” <i>he breathes, and opens his eyes.</i> “It\'s a scholar\'s trick, not a warrior\'s - it won\'t stop a blade, mind. But Vath hunts by his witch-sight, and to that you\'re a blank stretch of open sea now. He won\'t see you coming.”',
        {label:'Go on', onOk:card2}),700);
    };
    const p2=()=>{
      setDialog('<i>He turns the plate of ice to the lamplight, lips moving over the script.</i> “Hush-frost, wept from a warden Vath enslaved - and someone cut it into a warding. Do you know what this IS, Joan? It\'s the spell to go unseen by him. To hide.” <i>He almost laughs.</i> “Trust the deep ice to keep the one thing that could save us. Hold still and let me read it onto you properly - this is the one kind of fight I was ever built for.”',
        [{label:'Cast it, brother', cls:'gold', fn:cast}]);
    };
    setDialog('<i>You lay the rune-scored plate of ice in your brother\'s hands. Jaist goes still the moment he sees the marks.</i> “Where did you - this is old script. Grandmother\'s hand, or near enough.” <i>His scholar\'s eyes are already devouring it.</i>',
      [{label:'It was in the deep ice, past the Rimebound', fn:p2}]);
    return;
  }
  // After the Veil is cast: the brother holds the Frozen landing and points you home.
  if(npc.id==='brother' && P.story && P.story.vathVeil){
    setDialog('<i>Jaist keeps a weather-eye on the strait and the moored boat.</i> “The Veil holds - I can feel it holding. His curses have had free run of the old islands while we were gone; there\'s no telling what\'s festered. Sail back and undo them, one at a time. I\'ll keep the way home - same as ever.”',
      [{label:'Farewell', ghost:true, fn:closeDialog}]);
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
  // Bram no longer runs a crafting bench - the tutorial smith just gives quests and
  // talk now; gear is earned through the isle's tasks and foes (and the crossing kit).
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
    btns.unshift({label:'Buy remedies…', fn:()=>vendorShop(npc,'Tonics and tidebalm, every one brewed on this counter. The blue one\'s twice the mend - and twice the coin.',
      [{item:'potion',price:30},{item:'elixir',price:70}])});
  }
  // The Cloud-Tender keeps a little sky-stall at the landing - bottled mana for the
  // spellwork the Rainbow Road demands, and a few fire-tonics besides.
  if(npc.id==='wisp'){
    btns.unshift({label:'Buy sky-tonics…', fn:()=>vendorShop(npc,'Bottled calm off the cloud-tops, friend - blue for your mana, red for your hurts. The high road drinks both.',
      [{item:'manapot',price:10},{item:'potion',price:30}])});
  }
  if(npc.id==='mira'){
    // her silk was stolen on the north road - she has none to sell until it's recovered
    // (the ribbon quest, stage 2). Before that, no cloth for sale.
    if(qs('ribbon2')==='done'){
      btns.unshift({label:'Buy cloth…', fn:()=>vendorShop(npc,'Dawn-dyed silk, cut clean and true - back on the loom now the north road\'s seen to. A bolt goes further than you\'d think, and the resort\'s always wanting more.',
        [{item:'silk',price:14}])});
    }
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
  if(npc.id==='aelin'){
    // tuition scales with mastery (25g \u00d7 magic level) and the Spire caps out at level 7
    const aelinFee=()=>25*Math.max(1,P.skills.magic.lvl);
    const aelinStudy=()=>{
      if(P.skills.magic.lvl>=7){ setDialog('“Level seven - the Spire\'s ceiling. Past this point the weave teaches <i>you</i>, and it does not take gold. Go and practice.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      // one lesson, ever - a single true lesson is all the Spire gives
      if(P.prog && P.prog.spireTrainedEver){
        setDialog('“You\'ve had my lesson, and the weave keeps it - there\'s nothing more I can drill into you here. Go and practice what you know. And if you haven\'t yet - step inside; the orb has a gift for a student who\'s earned it.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      const f=aelinFee();
      if(P.gold<f){ setDialog('“The Spire\'s wisdom is subsidized, not free. '+f+' gold - mastery raises tuition.”',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      // she gives the lesson aloud first - a click-to-continue brief - then the drill begins
      const beginLesson=()=>{
        P.gold-=f; Snd.coin(); refreshUI(); closeDialog();
        P.x=npc.x+2.5; P.y=npc.y+1.6; unstickEntity(P);
        TRAIN={who:'aelin', stage:0, rolls:0, combo:0, casts:0, _r:0, x:P.x, y:P.y,
          dmg0:G.mobs.filter(m=>m.kind==='dummy').reduce((a,m)=>a+(m.maxhp-m.hp),0)};
        toast('<b>Aelin\'s lesson:</b> strike the dummy with <b>5 bolts</b>. Attune your staff with <b>3</b>.',5000); Snd.quest();
      };
      setDialog('<i>Aelin sets a practice dummy at the heart of the ring and steps clear.</i> “Here is the whole of today\'s lesson: attune your staff - <b>press 3</b> - and strike that dummy with <b>five clean bolts</b>. No footwork, no flourish - just the weave, loosed true, five times over. Ready your staff, and begin when you are.”',
        [{label:'Begin the lesson ('+f+'g)', cls:'gold', fn:beginLesson},
         {label:'Not yet', ghost:true, fn:closeDialog}]);
    };
    const trained = P.prog && P.prog.spireTrainedEver;
    btns.unshift({label: trained? 'Train at the Spire (lesson learned)' : 'Train at the Spire ('+aelinFee()+'g → magic)', fn:aelinStudy});
    // (Snare removed - the staff casts only Bolt now.)
  }
  if(npc.id==='rook'){
    btns.unshift({label:'Drill in the yard (20g \u2192 melee)', fn:()=>{
      if(P.gold<20){ setDialog('\u201cSweat is free. My time is twenty gold.\u201d',shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}])); return; }
      P.gold-=20; Snd.coin(); refreshUI(); closeDialog();
      P.x=npc.x-2.5; P.y=npc.y-2.7; unstickEntity(P);
      // face every yard dummy the same way so "get behind it" is a clear, learnable spot
      for(const m of G.mobs) if(m.kind==='dummy') m.face={x:0,y:1};
      TRAIN={who:'rook', stage:0, combo:0, backstabs:0, x:P.x, y:P.y,
        dmg0:G.mobs.filter(m=>m.kind==='dummy').reduce((a,m)=>a+(m.maxhp-m.hp),0)};
      toast('<b>Rook\'s drill.</b> <i>He scuffs a chalk ring around the yard.</i> “Stay inside the ring till I say. First - <b>deal 30 damage</b> to the dummies. Strike!”',5200); Snd.quest();
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
    // Chestnut is no longer for sale - he's Hedda's gift for clearing the fields
    // ('Mire in the Fields'). Once you own him, Hedda whistles him up / stables him.
    if(P.horse) btns.unshift({label:P.riding? 'Dismount Chestnut':'Whistle for Chestnut', fn:()=>{
      P.riding=P.riding?0:1; closeDialog(); toast(P.riding?'Chestnut trots up, ears forward. <b>Mounted.</b>':'Chestnut wanders to the nearest grass. <b>Dismounted.</b>',2800);
    }});
  }
  if(npc.id==='perrin' || npc.id==='saffi' || npc.id==='lani' || npc.id==='wenna'){
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
  if(npc.id==='willa'){
    btns.unshift({label:'Ask for seeds (free)', fn:()=>{
      giveQuiet('seed',3); Snd.pickup(); refreshUI();
      setDialog('“Seeds are the island\'s, not mine. Plant kindly.” <i>(+3 seeds)</i>', shopButtons(npc,[{label:'Farewell',ghost:true,fn:closeDialog}]));
    }});
  }
  return withTravel(npc,btns);
}
