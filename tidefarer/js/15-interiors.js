/* =====================================================================
   INTERIORS - step inside the buildings
   ===================================================================== */
// The Tideglass Palace: a grand two-storey interior. Level 0 is the great
// hall - a colonnaded throne room around a massive open courtyard with the
// King and his guards; level 1 is the ramparts, with the four corner towers,
// the crenellated wall-walk, and its garrison. A stairwell swaps between them.
function palaceInterior(level){
  const I = (level===1)
    ? {kind:'castle', palace:1, level:1, sky:1, w:34, h:22, t:0, furn:[], ret:null,
       exit:null, stairLanding:{x:17,y:17}, courtyard:null}
    : {kind:'castle', palace:1, level:0, w:32, h:26, t:0, furn:[], ret:null,
       exit:{x:16,y:24.4}, stairLanding:{x:28,y:22}, courtyard:{x0:9,y0:8,x1:23,y1:18}};
  const F=(type,x,y,hw,hh,solid,extra)=>{ const f={type,x,y,hw:hw||0.6,hh:hh||0.5,solid:solid!==false}; if(extra) Object.assign(f,extra); I.furn.push(f); };
  if(level===1){
    // RAMPARTS: four corner towers, the crenellated wall-walk, guards, stairs down
    F('towertop',3,3,1.2,1.0); F('towertop',31,3,1.2,1.0); F('towertop',3,19,1.2,1.0); F('towertop',31,19,1.2,1.0);
    F('banner',11,1.3,0.9,0.25); F('banner',23,1.3,0.9,0.25);
    for(let x=6;x<=28;x+=2) F('crenel',x,1.6,0,0,false);       // the wall's teeth (decorative)
    for(const gx of [9,15,20,26]) F('guard',gx,4,0.4,0.4);      // the wall garrison
    F('guard',7,11,0.4,0.4); F('guard',27,13,0.4,0.4);
    F('stairs',17,18,0.9,0.6,true,{dir:'down'});
  } else {
    // GROUND: throne dais + long colonnaded halls + the open central courtyard
    F('rug',16,3.4,0,0,false);
    F('throne',16,2.0,1.0,0.6); F('king',16,1.5,0.6,0.55);
    F('guard',12.5,2.6,0.4,0.4); F('guard',19.5,2.6,0.4,0.4);
    F('banner',8.5,1.3,0.9,0.25); F('banner',23.5,1.3,0.9,0.25);
    F('hearth',2.4,1.35,1.1,0.35); F('hearth',29.6,1.35,1.1,0.35);
    for(let y=5;y<=21;y+=2){ F('column',4,y,0.55,0.5); F('column',28,y,0.55,0.5); }   // long side halls
    // the massive central courtyard: an open garden around a grand fountain
    F('palacefountain',16,13,1.6,1.1);
    F('plant',10.5,9,0.6,0.6); F('plant',21.5,9,0.6,0.6); F('plant',10.5,17,0.6,0.6); F('plant',21.5,17,0.6,0.6);
    F('guard',6,10,0.4,0.4); F('guard',26,16,0.4,0.4);          // hall guards
    F('rug',16,23,0,0,false);
    F('stairs',28,22,0.9,0.6,true,{dir:'up'});
  }
  I.follow=1;   // both floors are larger than the screen; the camera tracks you
  return I;
}
function useStairs(dir){
  const cur=G.interior; if(!cur||!cur.palace) return;
  const nI=palaceInterior(dir==='up'?1:0);
  nI.ret=cur.ret;
  // Swap synchronously so the level change always lands - the fade is purely
  // cosmetic and must never gate the actual transition.
  G.interior=nI;
  const L=nI.stairLanding; P.x=L.x; P.y=L.y+1.4; P.moving=false; P.click=null;
  if(typeof Snd!=='undefined' && Snd.step) Snd.step(3);
  banner(dir==='up'?'THE RAMPARTS':'THE GREAT HALL', dir==='up'?'THE FOUR TOWERS OF ALDERMERE':'THE TIDEGLASS THRONE');
  const fade=document.getElementById('fadeOv');
  if(fade){ fade.style.opacity=1; setTimeout(()=>{ fade.style.opacity=0; },140); }
}
function palaceKingSpeak(){
  // the throne hosts the scripted scenes: the audience (Act III) and the Act IV
  // coda (the homecoming). Route those through buildDialogContent so the King's
  // NPC dialogue handlers run.
  if(qs('audience')==='active' || (P.story && P.story.princeWoke && !P.story.finale)){
    const king=G.npcs && G.npcs.find(n=>n.id==='aldous');
    if(king && typeof buildDialogContent==='function'){ dlg.open=true; dlg.npc=king;
      document.getElementById('dialog').style.display='block'; document.getElementById('dname').textContent=king.name;
      drawPortrait&&drawPortrait(king); buildDialogContent(king); return; }
  }
  dlg.open=true; document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='King Aldous';
  const pg=document.getElementById('dportrait').getContext('2d'); pg.fillStyle='#20160c'; pg.fillRect(0,0,72,72);
  pg.save(); pg.translate(36,64); pg.scale(1.3,1.3);
  drawHumanoid(pg,0,0,{skin:'#d8b48c',hair:'#d6d0c4',shirt:'#3a2f5e',robe:'#402a68',trim:'#c9a24e',beard:'#d6d0c4',beardLong:true,hat:'crown',dir:{x:0,y:1},step:0});
  pg.restore();
  const told = P.story && P.story.kingTold;
  const line = (P.story && P.story.finale)
    ? 'My son takes the sea air on the ramparts - thirty years he missed of it. Sit with us a while, first mate. This hall rings again, and it rings your name.'
    : told
    ? 'The hall is quieter than it looks, traveler. Thirty years I have paced this floor waiting for word of my son. Bring me an ending - any ending - and these old stones will ring again.'
    : 'Welcome to the Tideglass, traveler. Walk the courtyard, take the air on the ramparts. A palace this size is mostly for echoes now, but the doors are open to a curse-breaker.';
  setDialog('“'+line+'”', [{label:'Your Majesty', ghost:true, fn:closeDialog}]);
}
// The palace kitchen: where the victualler's crate is delivered. A warm working
// room with a great hearth, a prep table, and Nan the cook.
function kitchenInterior(){
  const I={kind:'kitchen', w:14, h:9, ret:null, exit:{x:7,y:8.1}, t:0, furn:[], kitchen:1};
  const F=(type,x,y,hw,hh,solid)=>I.furn.push({type,x,y,hw:hw||0.6,hh:hh||0.5,solid:solid!==false});
  F('hearth',2.2,1.35,1.1,0.35);
  F('shelf',5,1.3,1.2,0.3); F('shelf',9.2,1.3,1.2,0.3);
  F('table',7,3.6,1.7,0.7);
  F('barrel',11.6,2.2,0.45,0.4); F('barrel',12.2,3.0,0.45,0.4);
  F('crate',1.7,4.6,0.55,0.45); F('crate',2.5,5.1,0.55,0.45);
  F('stool',6.0,4.9,0.35,0.3); F('stool',8.0,5.0,0.35,0.3);
  F('rug',7,5.4,0,0,false);
  F('cook',10.2,4.4,0.4,0.45);
  return I;
}
function cookSpeak(){
  dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='Nan the Cook';
  const pg=document.getElementById('dportrait').getContext('2d'); pg.fillStyle='#2a1c12'; pg.fillRect(0,0,72,72);
  pg.save(); pg.translate(36,64); pg.scale(1.3,1.3);
  drawHumanoid(pg,0,0,{skin:'#d8a878',hair:'#cfc7b8',shirt:'#8a4a3a',pants:'#5a4a3a',apron:'#e7ddc9',hairstyle:'bun',dir:{x:0,y:1},step:0});
  pg.restore();
  if(qs('kitchenrun')==='active' && has('crate',1)){
    take('crate',1); if(P.story) P.story.palaceLeave=1;
    completeQuest('kitchenrun');
    setDialog('<i>Nan takes the crate without breaking stride, cracks the lid, sniffs, and grunts approval.</i> “Bless you, runner - saved my supper and my neck both. Odo’s a good sort under all that bluster.” <i>She tips her head toward the inner doors.</i> “His Majesty holds court within. The guards won’t stop you now - you came in on the crown’s own errand. Go on through, and mind your boots on the marble.”',
      [{label:'Thank you, Nan', ghost:true, fn:closeDialog}]);
    return;
  }
  setDialog('“The kitchen never sleeps, love. Thirty years I’ve fed a court of three and a garrison of two hundred - and not once has anyone finished their greens.”',
    [{label:'Farewell', ghost:true, fn:closeDialog}]);
}
function enterHouse(b){
  if(G.interior) return;
  if(b.grand){ // the Aldermere palace GATE - guarded; you need the King's leave
    if(P.riding){ P.riding=0; if(typeof updateMountBtn==='function') updateMountBtn(); }
    const leave = qs('kitchenrun')==='done' || (P.story&&(P.story.palaceLeave||P.story.kingTold));
    if(!leave){
      toast('Two guards cross their halberds at the gate. “<b>None shall pass</b> without the King’s leave.”',4200);
      Snd.step(5); return;
    }
    const I=palaceInterior(0); I.ret={x:P.x,y:P.y+0.3}; G.interior=I;
    P.click=null; P.x=I.w/2; P.y=I.h-1.6; P.moving=false; P.fishing=null; P.combo=0;
    banner('THE TIDEGLASS PALACE','THE GREAT HALL OF ALDERMERE'); Snd.quest&&Snd.quest();
    closeAllPanels&&closeAllPanels(); return;
  }
  if(b.kitchen){ // the palace kitchen - its own door and room, round the west side
    if(P.riding){ P.riding=0; if(typeof updateMountBtn==='function') updateMountBtn(); }
    if(qs('kitchenrun')!=='active' && qs('kitchenrun')!=='done' && !(P.story&&P.story.palaceLeave)){
      toast('The kitchen door is barred - crown’s tradesfolk only. “Bring me Odo’s crate and I’ll open up,” calls a voice within, over the clatter of pans.',4600);
      Snd.step(5); return;
    }
    const I=kitchenInterior(); I.ret={x:P.x,y:P.y+0.3}; G.interior=I;
    P.click=null; P.x=I.w/2; P.y=I.h-1.6; P.moving=false; P.fishing=null; P.combo=0;
    banner('THE PALACE KITCHEN','TRADESMAN’S ENTRANCE'); Snd.quest&&Snd.quest();
    closeAllPanels&&closeAllPanels(); return;
  }
  // b.lockMsg: barred at ALL hours with its own line (private homes, guild halls,
  // the Mint...). b.locked keeps the old Vael war-tent default.
  if(b.lockMsg){ toast(b.lockMsg,3800); Snd.step(5); return; }
  if(b.locked){ toast('The <b>Vael war-tent</b> is barred from within - the Castellan’s ground, and no friend of Barik walks in unbidden.',3400); Snd.step(5); return; }
  // you always dismount at the door - no riding indoors
  if(P.riding){ P.riding=0; if(typeof updateMountBtn==='function') updateMountBtn(); }
  const nightL=nightAmount(); const lblL=String(b.label||'').toLowerCase();
  // the resort (and inns/towers/your home) keeps its doors open around the clock
  const alwaysOpen = lblL.includes('(inn)') || b.kind==='tower' || b.kind==='resort' || lblL.includes('your homestead');
  if(nightL>0.5 && !alwaysOpen){
    let minD=1e9; for(const zk of ['village','dock','farm','castle','spire']){ const zz=ZONES[zk]; if(zz) minD=Math.min(minD,dist(b.x,b.y,zz.x,zz.y)); }
    if((b.kind==='house'||b.kind==='house2') && minD>24 && !b.closedMsg){
      // remote hospitality: far from any town, folk take a knocker in
      give('bread',1);
      const fadeH=document.getElementById('fadeOv'); fadeH.style.opacity=1; Snd.tone(200,0.5,'sine',0.04,-60);
      setTimeout(()=>{ G.dayT=0.09; P.hp=P.maxhp; P.mp=P.maxmp; G.fireflies.length=0; refreshUI(); autoSave();
        toast('You knock. \u201cStorm-late, are you? Come in, the hearth is yours till dawn.\u201d They wake you with <b>bread</b> at first light.',5200);
        setTimeout(()=>{ fadeH.style.opacity=0; },120); },750);
      return;
    }
    // b.closedMsg: a custom "shut for the night" line for this door; else a generic one
    toast(b.closedMsg || ['Latched for the night. '+(G.worldId==='main'?'Greyharbor':'Emberwick')+' keeps honest hours.',
      '\u201cWe are abed!\u201d calls a voice inside. The door stays shut till dawn.',
      'No light under the door, and the latch will not lift. Locked.'][rndi(0,2)],3600);
    Snd.step(5); return;
  }
  const kinds={
    house:{line:'Dried herbs hang from every beam. It smells of thyme and woodsmoke.'},
    house2:{line:'Nets, floats, and the good honest stink of the sea.'},
    forge:{line:'The coals never quite sleep. Tools line every wall.'},
    barn:{line:'Hay, harness, and something purring out of sight.'},
    tower:{line:'Star charts, humming glass, and a faint smell of ozone.'},
    castle:{line:'Banners, cold stone, and a hearth that has heard a hundred oaths.'},
    hut:{line:'Woven mats, hanging nets, and the sweet smell of dried palm.'},
    resort:{line:'Sea-view windows, cane chairs, and the salt-sweet hush of a grand hotel lobby.'},
    igloo:{line:'Curved snow-block walls, a fire pit at the heart, and furs enough to sleep through any storm.'}
  };
  const dims = b.kind==='castle'? [17,12] : b.kind==='resort'? [30,20] : (String(b.label||'').toLowerCase().includes('trade hall')? [12,7] : [9,7]);
  const I={kind:b.kind, w:dims[0], h:dims[1], ret:{x:P.x,y:P.y+0.3}, exit:{x:dims[0]/2,y:dims[1]-0.9}, t:0, furn:[],
    src:{x:Math.round(b.x), y:Math.round(b.y), w:G.worldId}};   // stable per-building id (tower orb boon keys off this)
  if(String(b.label||'').toLowerCase().includes('trade hall')) I.vault=1;
  if(String(b.label||'').toLowerCase().includes('homestead')) I.home=1;
  if(String(b.label||'').toLowerCase().includes('(inn)')) I.inn=1;
  const F=(type,x,y,hw,hh,solid,lore)=>I.furn.push({type,x,y,hw:hw||0.6,hh:hh||0.5,solid:solid!==false,lore});
  if(b.kind==='house'){ F('bed',1.9,2.8,1.0,0.7); F('table',6.4,3.4,0.9,0.6); F('stool',5.2,4.2,0.35,0.3); F('stool',7.4,4.4,0.35,0.3); F('rug',4.5,4.4,0,0,false); F('hearth',2.4,1.35,0.9,0.35); F('shelf',6.4,1.3,1.0,0.3); }
  if(b.kind==='house2'){ F('bed',7.1,2.8,1.0,0.7); F('barrel',1.8,3.0,0.45,0.4); F('barrel',2.6,3.5,0.45,0.4); F('crate',1.9,4.6,0.55,0.45); F('net',4.4,1.3,1.2,0.3); F('shelf',6.2,1.3,1.0,0.3); F('rug',4.6,4.3,0,0,false); }
  if(b.kind==='forge'){ F('anvil',4.5,3.3,0.6,0.4); F('barrel',6.8,3.2,0.45,0.4); F('crate',7.2,4.4,0.55,0.45); F('hearth',2.2,1.35,1.1,0.35); F('tools',6.0,1.3,1.4,0.3); }
  if(b.kind==='barn'){ F('hay',2.0,2.6,0.9,0.7); F('hay',3.4,2.2,0.9,0.7); F('hay',2.4,4.0,0.9,0.7); F('crate',6.8,2.6,0.55,0.45); F('crate',7.3,3.6,0.55,0.45); F('cartwheel',6.5,1.3,0.8,0.25); F('books',4.2,1.4,1.0,0.3); }
  if(b.kind==='tower'){
    // a mage's study: a whole wall of readable tomes on the magic arts, plus the
    // desk, a scrying orb, and a rug. Each book opens a different lesson.
    F('desk',6.6,3.2,1.0,0.6); F('stool',6.6,4.3,0.35,0.3); F('orb',2.4,3.4,0.5,0.4);
    F('books',1.7,1.3,0.7,0.3,true,'weave@tower');
    F('shelf',3.1,1.3,0.7,0.3,true,'mana@tower');
    F('books',4.5,1.3,0.7,0.3,true,'ember@tower');
    F('shelf',5.9,1.3,0.7,0.3,true,'wards@tower');
    F('books',7.3,1.3,0.7,0.3,true,'enchant@tower');
    F('books',2.0,4.6,0.7,0.3,true,'weaver@tower');   // a stray primer left on the reading table
    F('rug',4.5,4.9,0,0,false);
    // Aelin's Spire keeps a students' cot - rest here free - and after dark the
    // Weaver herself is in, working by candlelight (villagers vanish outdoors at night)
    if(String(b.label||'').toLowerCase().includes('spire')){
      I.spire=1;
      F('bed',7.6,5.3,1.0,0.62);
      if(typeof isNight==='function' && isNight()) F('aelin',3.3,2.5,0.5,0.5);
    }
  }
  if(b.kind==='resort'){
    // The Breakers is a bespoke open-air resort: a marble lobby with a front
    // desk, ornate flowering vases and potted palms, opening onto a sunlit pool
    // where guests lounge and chat. drawResortScene paints the pool from I.pool.
    // Two areas: an indoor marble LOBBY at the front (where you enter), and an
    // open-air pool COURTYARD out the back, joined by an arched gateway.
    I.resort=1; I.follow=1;
    I.partY=13; I.gate={x0:12.6,x1:16.4};            // the courtyard entrance archway
    I.pool={x0:17.5,y0:3,x1:27.5,y1:9.5};            // a trimmer pool, leaving broad deck to walk
    I.suite={x0:22.4,y0:13.2,x1:29,y1:19.6};         // the private suite alcove, right of the lobby
    // ---- LOBBY (indoor, y >= 13). Furniture hugs the walls so the whole
    // centre stays an open floor to stroll and greet guests. ----
    F('frontdesk',4.6,15.0,2.2,0.9);
    F('table',9.0,14.6,0.9,0.6); F('stool',9.0,15.9,0.35,0.3);      // a reading nook by the desk
    F('plant',1.9,13.5,0.6,0.6); F('vase',1.7,18.6,0.5,0.5);
    F('rug',13.5,18.2,0,0,false);
    // the private SUITE you unlock at the desk: a curtained alcove with a made
    // canopy bed, a sea-view, a welcome basket and a soft rug.
    F('suitebed',26.6,15.0,1.2,0.8);
    F('rug',25.6,17.6,0,0,false); F('plant',28.4,13.7,0.6,0.6); F('vase',28.4,19.0,0.5,0.5);
    F('vase',23.6,14.0,0.45,0.4);                                    // a welcome bouquet at the bedside
    // ---- COURTYARD (open-air, y < 13): pool, a FEW loungers & guests, palms,
    // parasols. Deliberately uncrowded - room to wander and chat. ----
    F('lounger',19.4,11.3,1.0,0.55); F('lounger',25.6,11.3,1.0,0.55); F('lounger',6.6,9.4,1.0,0.55);
    F('poolguest',22.5,11.4,0.4,0.4); F('poolguest',5.0,6.6,0.4,0.4); F('poolguest',14.7,4.6,0.4,0.4);
    F('parasol',10.4,7.6,0.6,0.5); F('parasol',4.6,10.6,0.6,0.5);
    F('plant',2.0,2.2,0.6,0.6); F('plant',12.2,2.0,0.6,0.6); F('plant',28.4,2.2,0.6,0.6); F('plant',2.0,11.4,0.6,0.6);
    F('vase',13.8,6.4,0.5,0.5); F('vase',13.8,10.0,0.5,0.5);
  }
  if(b.kind==='hut'){ F('rug',4.5,3.6,0,0,false); F('hearth',6.8,1.35,1.0,0.35); F('bed',2.2,1.6,1.05,0.65); F('crate',6.9,5.0,0.55,0.45); F('stool',3.4,4.2,0.35,0.3);
    F('shelf',4.6,1.35,1.0,0.3);                            // a woven shelf - read it for the isle's story
    // each named hut carries its own lore (Kohana on the Sunward Isle, castaways on Stormreach)
    I.loreKey = G.worldId==='reach' ? 'castaway@reach'
      : lblL.includes('weaver') ? 'weaver@east'
      : lblL.includes('hunt')   ? 'hunt@east'
      : lblL.includes('board')  ? 'board@east'
      : lblL.includes('drying') ? 'drying@east'
      : 'longhut@east';
  }
  if(b.kind==='igloo'){ I.igloo=1;
    F('hearth',I.w/2,I.h/2-0.3,0.9,0.5);                    // the central fire pit
    F('bed',2.1,2.2,1.05,0.7); F('rug',I.w/2,I.h-2.4,0,0,false);
    F('shelf',I.w-2.4,1.35,1.0,0.3); F('crate',I.w-1.9,I.h-1.9,0.55,0.45); F('barrel',2.2,I.h-2.0,0.45,0.4);
    // each Hearthhold igloo reads differently
    I.loreKey = (lblL.includes('inn')||lblL.includes('kettle')) ? 'inn@frost'
      : lblL.includes('icewright') ? 'icewright@frost'
      : (lblL.includes('ferry')||lblL.includes('lodge')) ? 'ferry@frost'
      : 'igloo@frost';
  }
  if(b.kind==='windmill'){
    // inside the great mill: grain sacks, the grinding shaft, and the miller's
    // notes on the wall - read them to hear how the mill has kept the city fed.
    // A stone stair in the floor descends to the old grinding works (the Undermill).
    I.loreKey='windmill@wind';
    F('books',I.w/2,1.35,1.0,0.3,true,'windmill@wind');
    F('crate',2.0,2.6,0.55,0.45); F('crate',2.7,3.4,0.55,0.45); F('barrel',I.w-2.0,2.8,0.45,0.4);
    F('shelf',I.w/2+2.4,1.3,0.9,0.3); F('stool',I.w-2.4,4.4,0.35,0.3);
    // the grinding-shaft descent sits dead-centre on the mill floor, right where you
    // walk in - a stone stair down into the workings (the Undermill)
    F('millcellar',I.w/2,3.3,1.0,0.7,true);
  }
  if(b.kind==='waterwheel'){
    // the mill-house at the wheel's hub: cart-wheel gears, a damp stone floor,
    // and the wright's ledger explaining how the wheel drives the millstones
    I.loreKey='waterwheel@wind';
    F('books',I.w/2,1.35,1.0,0.3,true,'waterwheel@wind');
    F('cartwheel',I.w/2+2.4,1.3,0.8,0.25); F('barrel',2.0,2.8,0.45,0.4); F('barrel',2.7,3.4,0.45,0.4);
    F('crate',I.w-2.0,4.6,0.55,0.45); F('rug',I.w/2,4.4,0,0,false);
  }
  if(b.kind==='castle'){
    // a grand throne hall: a long carpet runner up a colonnaded nave to the
    // throne, banners and braziers down the walls, and a clear central aisle
    F('throne',8.5,1.7,1.0,0.6);
    F('rug',8.5,4.0,0,0,false); F('rug',8.5,6.4,0,0,false); F('rug',8.5,8.8,0,0,false);
    F('banner',2.6,1.25,0.9,0.25); F('banner',5.9,1.25,0.9,0.25);
    F('banner',11.1,1.25,0.9,0.25); F('banner',14.4,1.25,0.9,0.25);
    F('column',4.5,3.4,0.5,0.45); F('column',12.5,3.4,0.5,0.45);
    F('column',4.5,6.4,0.5,0.45); F('column',12.5,6.4,0.5,0.45);
    F('column',4.5,9.4,0.5,0.45); F('column',12.5,9.4,0.5,0.45);
    F('hearth',1.9,1.35,1.1,0.35); F('hearth',15.1,1.35,1.1,0.35);
    F('books',6.6,1.3,1.2,0.3); F('books',10.4,1.3,1.2,0.3);
    F('plant',2.4,4.8,0.6,0.6); F('plant',14.6,4.8,0.6,0.6);
    F('vase',2.4,8.6,0.5,0.5); F('vase',14.6,8.6,0.5,0.5);
  }
  // per-house variation: no two homes furnished quite alike
  if(b.kind==='house'||b.kind==='house2'){
    const hv=(Math.floor(b.x)*7+Math.floor(b.y)*13)%3;
    if(hv===1){ F('crate',I.w-1.6,I.h-1.9,0.55,0.45); F('stool',2.6,I.h-2.1,0.35,0.3); }
    if(hv===2){ F('barrel',I.w-1.7,2.6,0.45,0.4); F('rug',I.w/2+1.4,I.h-2.5,0,0,false); }
  }
  // the Trade hall is Bree's vault inside: strongbox rows behind the counter
  if(I.vault){ I.furn.length=0;
    F('strongbox',2.0,2.4,0.7,0.5); F('strongbox',2.0,3.6,0.7,0.5); F('strongbox',2.0,4.8,0.7,0.5);
    F('strongbox',10.0,2.4,0.7,0.5); F('strongbox',10.0,3.6,0.7,0.5); F('strongbox',10.0,4.8,0.7,0.5);
    F('table',6.0,2.6,1.3,0.6); F('books',6.0,1.3,1.4,0.3);
    F('crate',4.0,5.2,0.55,0.45); F('crate',8.2,5.2,0.55,0.45); F('rug',6.0,4.2,0,0,false);
  }
  // Windsurf Isle: give each named building its own lore (read the shelf/books)
  // and a signature furnishing, so no two insides feel the same.
  if(G.worldId==='wind'){
    const lbl=String(b.label||'').toLowerCase();
    if(lbl.includes('guildhall')){ I.loreKey='guildhall@wind'; F('books',I.w/2,1.35,1.3,0.3); F('table',I.w/2,3.4,1.2,0.6); }
    else if(lbl.includes('sailmaker')){ I.loreKey='sailloft@wind'; F('net',I.w/2+1.6,1.3,1.3,0.3); F('crate',2.2,4.9,0.55,0.45); }
    else if(lbl.includes('chandlery')){ I.loreKey='chandlery@wind'; F('barrel',2.1,4.7,0.45,0.4); F('crate',3.2,5.3,0.55,0.45); F('crate',I.w-2.0,4.7,0.55,0.45); }
    else if(lbl.includes('cottage')){ I.loreKey='cottage@wind'; F('rug',I.w/2-1.2,I.h-2.6,0,0,false); }
    else if(lbl.includes('inn')){ I.loreKey='inn@wind'; F('bed',I.w-1.9,4.5,1.0,0.7); }
    else if(b.kind==='resort'){ I.loreKey='resort@wind'; }
  }
  G.interior=I;
  P.click=null;
  P.x=I.w/2; P.y=I.h-1.6; P.moving=false; P.fishing=null; P.combo=0;
  toast('<b>'+(b.label||'Inside')+'</b>', 2400);
  Snd.step(8);
}
function enterCave(){
  if(G.interior) return;
  const I={kind:'cave', w:9, h:7, ret:{x:P.x,y:P.y+0.4}, exit:{x:4.5,y:6.1}, t:0, furn:[], cave:1, loreKey:'undermaw'};
  const F=(type,x,y,hw,hh,solid,lore)=>I.furn.push({type,x,y,hw:hw||0.6,hh:hh||0.5,solid:solid!==false,lore});
  F('orb',2.2,2.6,0.5,0.4);
  F('crate',7.0,4.4,0.55,0.45);
  F('cavechest',4.6,2.2,0.7,0.5);
  F('books',6.6,1.5,1.2,0.3,true,'undermaw');
  G.interior=I; P.click=null;
  P.x=4.5; P.y=5.4; P.moving=false; P.fishing=null; P.combo=0;
  toast('<b>The Undermaw</b> - the dark breathes here, slow and cold. Something glitters at the heart of it.',4600);
  Snd.step(8);
}
function enterLair(){
  if(G.interior) return;
  // a vast basalt cathedral inside Mount Kea, not a cottage
  const I={kind:'cave', w:15, h:12, ret:{x:P.x,y:P.y+0.4}, exit:{x:7.5,y:11.0}, t:0, furn:[], cave:1, lair:1};
  const F=(type,x,y,hw,hh,solid)=>I.furn.push({type,x,y,hw:hw||0.6,hh:hh||0.5,solid:solid!==false});
  const dragonOut = G.mobs && G.mobs.some(m=>m.kind==='dragon' && !m.dead); // he's raging at the caldera
  if(!dragonOut) F('dragon',7.5,3.4,3.0,1.9,true);   // Ashwing, huge on his fire-shelf
  // molten seams the lair renderer glows; the back pool sits behind the wyrm
  I.lava=[{x:7.5,y:1.9,rx:6.2,ry:1.2},{x:2.4,y:8.4,rx:1.6,ry:0.9},{x:12.6,y:8.4,rx:1.6,ry:0.9}];
  F('lavavent',2.6,2.8,0.5,0.4,false);
  F('lavavent',12.4,2.9,0.5,0.4,false);
  F('rockcol',1.9,6.2,0.7,0.8,true); F('rockcol',13.1,6.2,0.7,0.8,true);
  G.interior=I; P.click=null;
  P.x=7.5; P.y=9.6; P.moving=false; P.fishing=null; P.combo=0;
  toast(dragonOut ? '<b>Ashwing’s Lair</b> - empty, and shaking. He rages on the caldera above.'
    : qs('wyrm')==='done' ? '<b>Ashwing’s Lair</b> - warm and still. The old dragon dozes, safe now.'
    : '<b>Ashwing’s Lair</b> - heat shimmers off the stone. Something vast turns to regard you.',4600);
  Snd.step(8);
}
function exitHouse(){
  const r=G.interior.ret;
  G.interior=null;
  P.x=r.x; P.y=r.y;
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  Snd.step(8);
}
function interiorBlocked(x,y,r){
  const I=G.interior;
  if(x-r<0.75||x+r>I.w-0.75||y-r<1.9||y+r>I.h-0.45) return true;
  for(const f of I.furn) if(f.solid && Math.abs(x-f.x)<f.hw+r && Math.abs(y-f.y)<f.hh+r) return true;
  if(I.lava) for(const L of I.lava){ const dx=(x-L.x)/(L.rx+r), dy=(y-L.y)/(L.ry+r); if(dx*dx+dy*dy<1) return true; }
  if(I.pool){ const p=I.pool; if(x+r>p.x0 && x-r<p.x1 && y+r>p.y0 && y-r<p.y1) return true; } // walk around the water, not through it
  if(I.partY!=null && y+r>I.partY-0.4 && y-r<I.partY+0.4){ // the lobby/courtyard partition, save for the arch
    const g=I.gate; if(!(g && x-r>g.x0 && x+r<g.x1)) return true; }
  return false;
}
function updateInterior(dt){
  const I=G.interior; I.t+=dt;
  let mx=0,my=0;
  if(keys['w']||keys['arrowup']) { mx-=1; my-=1; }
  if(keys['s']||keys['arrowdown']) { mx+=1; my+=1; }
  if(keys['a']||keys['arrowleft']) { mx-=1; my+=1; }
  if(keys['d']||keys['arrowright']){ mx+=1; my-=1; }
  if(input.joy.active){ mx=input.joy.x; my=input.joy.y; }
  else if(input.gpDir){ mx=input.gpDir.x; my=input.gpDir.y; }
  if(Math.hypot(mx,my)>0.05){ I.click=null; }
  else if(I.click && !dlg.open){
    const C=I.click, d=dist(P.x,P.y,C.x,C.y);
    const range=C.f? 1.15 : C.exit? 1.2 : 0.14;
    if(d>range){ mx=(C.x-P.x)/d; my=(C.y-P.y)/d;
      if(!I._sp || dist(P.x,P.y,I._sp.x,I._sp.y)>0.05){ I._sp={x:P.x,y:P.y}; I._st=0; }
      I._st=(I._st||0)+dt;
      if(I._st>0.8){ I.click=null; mx=0; my=0; }
    } else {
      const f=C.f, ex=C.exit; I.click=null;
      if(f) useHotspot({f,label:''});
      else if(ex) exitHouse();
    }
  }
  const ml=Math.hypot(mx,my);
  P.moving = ml>0.05 && !dlg.open;
  if(P.moving){
    mx/=ml; my/=ml;
    const sp=3.8;
    let nx=P.x+mx*sp*dt; if(!interiorBlocked(nx,P.y,0.28)) P.x=nx;
    let ny=P.y+my*sp*dt; if(!interiorBlocked(P.x,ny,0.28)) P.y=ny;
    P.dir={x:mx,y:my}; P.anim+=dt*9;
  }
  P.swing=Math.max(0,P.swing-dt);
  P.hurtT=Math.max(0,P.hurtT-dt);
  P.mp=Math.min(P.maxmp,P.mp+dt*2.6);
  if(G.time-P.lastCombat>5) P.hp=Math.min(P.maxhp,P.hp+dt*2.2);
}
function iBox(s,w,d,h,top,lft,rgt){
  // iso box at screen point s: footprint w×d tiles, height h px
  const gx=(dxw,dyd)=>({x:s.x+(dxw-dyd)*(TW/2), y:s.y+(dxw+dyd)*(TH/2)});
  const c1=gx(-w/2,-d/2), c2=gx(w/2,-d/2), c3=gx(w/2,d/2), c4=gx(-w/2,d/2);
  // left face (c4-c3)
  cx.fillStyle=lft; cx.beginPath();
  cx.moveTo(c4.x,c4.y-h); cx.lineTo(c3.x,c3.y-h); cx.lineTo(c3.x,c3.y); cx.lineTo(c4.x,c4.y); cx.closePath(); cx.fill();
  // right face (c3-c2)
  cx.fillStyle=rgt; cx.beginPath();
  cx.moveTo(c3.x,c3.y-h); cx.lineTo(c2.x,c2.y-h); cx.lineTo(c2.x,c2.y); cx.lineTo(c3.x,c3.y); cx.closePath(); cx.fill();
  // top
  cx.fillStyle=top; cx.beginPath();
  cx.moveTo(c1.x,c1.y-h); cx.lineTo(c2.x,c2.y-h); cx.lineTo(c3.x,c3.y-h); cx.lineTo(c4.x,c4.y-h); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(15,9,4,0.5)'; cx.lineWidth=1; cx.stroke();
}
function drawLairScene(w2s,I){
  const t=I.t;
  // a hellish shaft of daylight-and-ember down from the caldera mouth, center-back
  const top=w2s(I.w/2,0.2);
  const sg=cx.createRadialGradient(top.x,top.y-30,8,top.x,top.y-30,200);
  sg.addColorStop(0,'rgba(255,150,70,0.20)'); sg.addColorStop(1,'rgba(255,70,20,0)');
  cx.fillStyle=sg; cx.fillRect(0,0,VW,VH);
  // molten pools on the floor (drawn before furniture so the wyrm sits over them)
  for(const L of (I.lava||[])){
    const s=w2s(L.x,L.y), rx=L.rx*TW/2, ry=L.ry*TH/2, gl=0.6+0.4*Math.sin(t*2+L.x);
    cx.save(); cx.translate(s.x,s.y);
    cx.fillStyle='rgba(255,120,40,'+(0.22*gl).toFixed(2)+')';
    cx.beginPath(); cx.ellipse(0,0,rx+18,ry+12,0,0,TAU); cx.fill();
    const g=cx.createRadialGradient(0,0,4,0,0,rx);
    g.addColorStop(0,'#ffd858'); g.addColorStop(0.5,'#ff7a1e'); g.addColorStop(1,'#8f2a10');
    cx.fillStyle=g; cx.beginPath(); cx.ellipse(0,0,rx,ry,0,0,TAU); cx.fill();
    cx.fillStyle='rgba(28,14,10,0.55)';
    for(let i=0;i<5;i++){ const a=i*1.5+t*0.4;
      cx.beginPath(); cx.ellipse(Math.cos(a)*rx*0.55, Math.sin(a)*ry*0.55, 5,2.6,0,0,TAU); cx.fill(); }
    cx.restore();
    if(Math.random()<0.3) G.parts.push({x:L.x+rnd(-L.rx,L.rx), y:L.y, vx:rnd(-0.2,0.2), vy:-rnd(0.6,1.7), life:rnd(0.8,1.9), color:Math.random()<0.6?'#ff9a44':'#ffd858', size:rnd(1.5,3), grav:-0.12});
  }
}
function drawResortScene(w2s,I){
  const t=I.t, partY=(I.partY!=null?I.partY:I.h), g=I.gate||{x0:-9,x1:-9};
  const TALL=62, LOW=15;
  const wallQuad=(a,b,H,fill,cap)=>{
    cx.fillStyle=fill;
    cx.beginPath(); cx.moveTo(a.x-TW/2,a.y-TH/2); cx.lineTo(b.x-TW/2,b.y-TH/2);
    cx.lineTo(b.x-TW/2,b.y-TH/2-H); cx.lineTo(a.x-TW/2,a.y-TH/2-H); cx.closePath(); cx.fill();
    if(cap){ cx.fillStyle=cap; cx.beginPath();
      cx.moveTo(a.x-TW/2,a.y-TH/2-H); cx.lineTo(b.x-TW/2,b.y-TH/2-H); cx.lineTo(b.x-TW/2,b.y-TH/2-H-3); cx.lineTo(a.x-TW/2,a.y-TH/2-H-3); cx.closePath(); cx.fill(); }
  };
  // --- north wall (y=0): the courtyard's far side -> a low garden balustrade,
  // open sky above it ---
  for(let x=0;x<I.w;x++) wallQuad(w2s(x,0),w2s(x+1,0),LOW, x%2?'#d3ccb6':'#c7c0aa', '#eae4d4');
  // --- west wall (x=0): tall & cream in the lobby, low garden out in the court ---
  for(let y=0;y<I.h;y++){ const tall=y>=partY;
    wallQuad(w2s(0,y),w2s(0,y+1), tall?TALL:LOW, tall?(y%2?'#e6dcc6':'#d8cdb4'):(y%2?'#d3ccb6':'#c7c0aa'), tall?null:'#eae4d4'); }
  // --- the partition between lobby and courtyard, with an arched gateway.
  // Kept a shade darker than the marble so it reads clearly as a dividing wall ---
  for(let x=0;x<I.w;x++){ if(x+0.5>g.x0 && x+0.5<g.x1) continue;   // the archway opening
    wallQuad(w2s(x,partY),w2s(x+1,partY),TALL, x%2?'#c3b797':'#b4a884', '#d8cdb4'); }
  // arch: columns at the gateway edges + a curved lintel
  const L=w2s(g.x0,partY), R=w2s(g.x1,partY);
  cx.fillStyle='#ddd2b9'; cx.fillRect(L.x-TW/2-4,L.y-TH/2-TALL,8,TALL); cx.fillRect(R.x-TW/2-4,R.y-TH/2-TALL,8,TALL);
  cx.strokeStyle='#ddd2b9'; cx.lineWidth=9; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(L.x-TW/2,L.y-TH/2-TALL+6);
  cx.quadraticCurveTo((L.x+R.x)/2-TW/2, Math.min(L.y,R.y)-TH/2-TALL-26, R.x-TW/2,R.y-TH/2-TALL+6); cx.stroke();
  cx.lineCap='butt';
  cx.fillStyle='#c9a24e'; cx.beginPath(); cx.arc((L.x+R.x)/2-TW/2, Math.min(L.y,R.y)-TH/2-TALL-18, 3.5,0,TAU); cx.fill(); // keystone stud
  // --- the pool: coping ring + rippling water ---
  const p=I.pool; if(!p) return;
  for(let y=Math.floor(p.y0)-1; y<=Math.ceil(p.y1)+1; y++) for(let x=Math.floor(p.x0)-1; x<=Math.ceil(p.x1)+1; x++){
    const inside = x+0.5>=p.x0 && x+0.5<=p.x1 && y+0.5>=p.y0 && y+0.5<=p.y1;
    const rim = !inside && x+0.5>=p.x0-1 && x+0.5<=p.x1+1 && y+0.5>=p.y0-1 && y+0.5<=p.y1+1;
    const s=w2s(x+0.5,y+0.5);
    const dia=()=>{ cx.beginPath(); cx.moveTo(s.x,s.y-TH/2); cx.lineTo(s.x+TW/2,s.y); cx.lineTo(s.x,s.y+TH/2); cx.lineTo(s.x-TW/2,s.y); cx.closePath(); cx.fill(); };
    if(inside){
      const sh=0.5+0.5*Math.sin(t*1.6+x*0.9+y*0.7);
      cx.fillStyle= sh>0.5? '#4fb2da' : '#3f98c8'; dia();
      if(((x*5+y*3+Math.floor(t*2))%9)===0){ cx.fillStyle='rgba(255,255,255,0.5)'; cx.beginPath(); cx.ellipse(s.x,s.y-1,4,2,0,0,TAU); cx.fill(); }
    } else if(rim){
      cx.fillStyle=(x+y)%2? '#d7cdb6':'#cabfa6'; dia();
    }
  }
}
function drawFurniture(f,s){
  switch(f.type){
    case 'bed':
      iBox(s,2.0,1.3,10,'#6e5738','#4a3322','#3e2b1c');
      iBox({x:s.x,y:s.y-10},1.9,1.2,8,'#8f4a3a','#6e3a2c','#5e3226');
      iBox({x:s.x-(0.55)*(TW/2),y:s.y-(0.55)*(TH/2)-18},0.7,0.9,5,'#e8dcbd','#c9b990','#b0a078');
      break;
    case 'table':
      iBox(s,1.7,1.1,16,'#6e5030','#4a3322','#3e2b1c');
      cx.fillStyle='#ffd76a'; cx.beginPath(); cx.arc(s.x+6,s.y-19,3,0,TAU); cx.fill(); // candle glow base
      cx.fillStyle='#ff9a3c'; cx.beginPath(); cx.arc(s.x+6,s.y-22,1.6+Math.sin(G.interior.t*9)*0.5,0,TAU); cx.fill();
      break;
    case 'desk':
      iBox(s,1.9,1.1,16,'#5a4630','#3e2f1e','#332618');
      cx.fillStyle='#e8dcbd'; cx.fillRect(s.x-14,s.y-22,12,7);
      cx.fillStyle='#7fd4ff'; cx.beginPath(); cx.arc(s.x+10,s.y-21,3,0,TAU); cx.fill();
      break;
    case 'stool': iBox(s,0.6,0.6,9,'#6e5030','#4a3322','#3e2b1c'); break;
    case 'throne':
      iBox(s,1.5,1.0,10,'#5a4630','#3e2f1e','#332618');
      iBox({x:s.x,y:s.y-10},1.2,0.8,24,'#7a2a3a','#5a1f2c','#4a1a24');
      cx.fillStyle='#e8c860';
      cx.beginPath(); cx.arc(s.x-15,s.y-36,3,0,TAU); cx.arc(s.x+15,s.y-36,3,0,TAU); cx.fill();
      cx.beginPath(); cx.arc(s.x,s.y-42,4.5,0,TAU); cx.fill();
      break;
    case 'column':
      iBox(s,0.8,0.8,46,'#a8a49b','#8f8b83','#6e6a63');
      cx.fillStyle='#b8b4ab'; cx.fillRect(s.x-15,s.y-54,30,5);
      break;
    case 'banner':
      cx.fillStyle='#6a3a5e'; cx.fillRect(s.x-9,s.y-48,18,30);
      cx.beginPath(); cx.moveTo(s.x-9,s.y-18); cx.lineTo(s.x,s.y-10); cx.lineTo(s.x+9,s.y-18); cx.closePath(); cx.fill();
      cx.fillStyle='#e8c860'; cx.beginPath(); cx.arc(s.x,s.y-36,5,0,TAU); cx.fill();
      cx.strokeStyle='#3a2a1a'; cx.lineWidth=2; cx.beginPath(); cx.moveTo(s.x-11,s.y-48); cx.lineTo(s.x+11,s.y-48); cx.stroke();
      break;
    case 'strongbox':
      iBox(s,1.1,0.9,13,'#4a4f5e','#33363f','#2a2c33');
      cx.strokeStyle='#8f97a8'; cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(s.x-13,s.y-13); cx.lineTo(s.x+13,s.y-13); cx.stroke();
      cx.fillStyle='#e8c860'; cx.fillRect(s.x-2.5,s.y-11,5,6);
      break;
    case 'crate': iBox(s,1.0,0.9,14,'#7d5834','#5a3d24','#4a3322'); break;
    case 'hay':
      iBox(s,1.7,1.3,13,'#c9a24e','#a8843c','#8f6f30');
      cx.strokeStyle='rgba(120,90,30,0.6)'; cx.lineWidth=1;
      for(let i=0;i<4;i++){ cx.beginPath(); cx.moveTo(s.x-14+i*8,s.y-12); cx.lineTo(s.x-10+i*8,s.y-4); cx.stroke(); }
      break;
    case 'barrel':
      cx.fillStyle='#5a3d24'; cx.beginPath(); cx.ellipse(s.x,s.y-2,10,5,0,0,TAU); cx.fill();
      cx.fillRect(s.x-10,s.y-20,20,18);
      cx.fillStyle='#6e4a2b'; cx.beginPath(); cx.ellipse(s.x,s.y-20,10,5,0,0,TAU); cx.fill();
      cx.strokeStyle='rgba(15,9,4,0.6)'; cx.strokeRect(s.x-10,s.y-20,20,18);
      cx.strokeStyle='#3a2818'; cx.beginPath(); cx.moveTo(s.x-10,s.y-14); cx.lineTo(s.x+10,s.y-14);
      cx.moveTo(s.x-10,s.y-7); cx.lineTo(s.x+10,s.y-7); cx.stroke();
      break;
    case 'anvil':
      iBox(s,0.9,0.7,7,'#4a4d54','#3a3d43','#33363b');
      iBox({x:s.x,y:s.y-7},1.3,0.6,7,'#8a919d','#5c626d','#4c525c');
      break;
    case 'orb':
      iBox(s,0.8,0.8,14,'#6f6a63','#4c4842','#403c37');
      { const pl=0.7+0.3*Math.sin(G.interior.t*3);
        cx.fillStyle='rgba(127,212,255,'+(0.25*pl)+')'; cx.beginPath(); cx.arc(s.x,s.y-24,12*pl,0,TAU); cx.fill();
        cx.fillStyle='#7fd4ff'; cx.beginPath(); cx.arc(s.x,s.y-24,6,0,TAU); cx.fill();
        cx.fillStyle='#dff4ff'; cx.beginPath(); cx.arc(s.x-2,s.y-26,2,0,TAU); cx.fill(); }
      break;
    case 'books': case 'shelf':
      iBox(s,1.6,0.55,22,'#4a3322','#3a2818','#332214');
      for(let i=0;i<5;i++){ cx.fillStyle=['#8f4a3a','#3e6f8f','#5a4472','#4f6032','#8a6d30'][i];
        cx.fillRect(s.x-16+i*7,s.y-20,5,12); }
      break;
    case 'rug':
      cx.save(); cx.translate(s.x,s.y); cx.scale(1,0.5); cx.rotate(0);
      cx.fillStyle='rgba(143,74,58,0.85)'; cx.beginPath(); cx.arc(0,0,34,0,TAU); cx.fill();
      cx.strokeStyle='#c9a24e'; cx.lineWidth=2; cx.beginPath(); cx.arc(0,0,26,0,TAU); cx.stroke();
      cx.restore();
      break;
    case 'lavavent':
      { const gl=0.55+0.45*Math.sin(G.interior.t*2.3+s.x);
        cx.save(); cx.translate(s.x,s.y); cx.scale(1,0.5);
        cx.fillStyle='rgba(255,120,40,'+(0.28*gl).toFixed(2)+')'; cx.beginPath(); cx.arc(0,0,22,0,TAU); cx.fill();
        cx.fillStyle='#2a1610'; cx.beginPath(); cx.arc(0,0,13,0,TAU); cx.fill();
        cx.fillStyle='#ff8a1e'; cx.beginPath(); cx.arc(0,0,9,0,TAU); cx.fill();
        cx.fillStyle='rgba(255,225,150,'+(0.7*gl).toFixed(2)+')'; cx.beginPath(); cx.arc(-2,-2,4,0,TAU); cx.fill();
        cx.restore();
        if(Math.random()<0.2) G.parts.push({x:f.x,y:f.y,vx:rnd(-0.2,0.2),vy:-rnd(0.4,1),life:rnd(0.6,1.2),color:Math.random()<0.5?'#ff8a44':'rgba(90,84,80,0.5)',size:rnd(1.5,3),grav:-0.1});
      }
      break;
    case 'dragon':
      cx.save(); cx.translate(s.x,s.y); cx.scale(2.4,2.4);
      drawDragon(cx,0,0,{face:1, enspelled:false, anim:1, hurtT:0});
      cx.restore();
      break;
    case 'rockcol':
      { // a basalt column reaching up out of frame, ember-lit on one face
        cx.fillStyle='#1a100c'; cx.fillRect(s.x-11,s.y-84,22,86);
        cx.fillStyle='#0f0908'; cx.fillRect(s.x-11,s.y-84,7,86);
        cx.fillStyle='rgba(255,120,50,0.14)'; cx.fillRect(s.x+4,s.y-84,5,86);
        cx.strokeStyle='rgba(0,0,0,0.4)'; cx.lineWidth=1;
        for(let yy=s.y-76; yy<s.y; yy+=14){ cx.beginPath(); cx.moveTo(s.x-11,yy); cx.lineTo(s.x+11,yy); cx.stroke(); }
      }
      break;
    case 'frontdesk':
      iBox(s,2.7,1.0,20,'#6a4a30','#4a3320','#3a2718');            // wooden counter
      cx.fillStyle='#d8cbb0'; cx.fillRect(s.x-30,s.y-27,60,5);     // marble top
      cx.strokeStyle='rgba(0,0,0,0.2)'; cx.lineWidth=1; cx.strokeRect(s.x-30,s.y-27,60,5);
      cx.fillStyle='#e8dcbd'; cx.fillRect(s.x-10,s.y-27,14,4);     // open ledger
      cx.fillStyle='#c9a24e'; cx.beginPath(); cx.arc(s.x+18,s.y-29,3,0,TAU); cx.fill(); // brass bell
      cx.fillStyle='#8a6d30'; cx.fillRect(s.x+16.5,s.y-26,3,2);
      // hanging RECEPTION sign
      cx.fillStyle='#3a5c6a'; cx.fillRect(s.x-18,s.y-60,36,15);
      cx.strokeStyle='#c9a24e'; cx.lineWidth=1.5; cx.strokeRect(s.x-18,s.y-60,36,15);
      cx.fillStyle='#ffe9a8'; cx.font='bold 8px Georgia'; cx.textAlign='center'; cx.fillText('RECEPTION', s.x, s.y-50);
      // the concierge behind the counter
      drawHumanoid(cx, s.x-3, s.y-22, {skin:'#caa27b',hair:'#3a2e26',shirt:'#5a3a6a',pants:'#33303c',trim:'#c9a24e',dir:{x:0,y:1},step:0,size:0.82});
      break;
    case 'vase':
      cx.fillStyle='#356a86'; cx.beginPath();                      // glazed ceramic vase
      cx.moveTo(s.x-7,s.y-2); cx.quadraticCurveTo(s.x-11,s.y-16,s.x-5,s.y-24);
      cx.lineTo(s.x+5,s.y-24); cx.quadraticCurveTo(s.x+11,s.y-16,s.x+7,s.y-2); cx.closePath(); cx.fill();
      cx.strokeStyle='#c9a24e'; cx.lineWidth=1.5; cx.stroke();
      cx.fillStyle='rgba(255,255,255,0.25)'; cx.beginPath(); cx.ellipse(s.x-3,s.y-15,2,6,0,0,TAU); cx.fill();
      { const fc=['#e86a8a','#ffd76a','#c9a0ff','#ff9a5a','#f0f0f0','#e86a8a'];
        for(let i=0;i<6;i++){ const a=-Math.PI/2+(i-2.5)*0.5, fx=s.x+Math.cos(a)*10, fy=s.y-27+Math.sin(a)*9;
          cx.strokeStyle='#4f7a3a'; cx.lineWidth=1.4; cx.beginPath(); cx.moveTo(s.x,s.y-24); cx.lineTo(fx,fy); cx.stroke();
          cx.fillStyle=fc[i]; cx.beginPath(); cx.arc(fx,fy,3.2,0,TAU); cx.fill(); } }
      break;
    case 'plant':
      iBox(s,0.75,0.75,10,'#a05a3a','#7a4028','#5e3020');           // terracotta pot
      cx.strokeStyle='#3e7a3a'; cx.lineWidth=2.6; cx.lineCap='round'; // palm fronds
      for(let i=0;i<7;i++){ const a=-Math.PI/2+(i-3)*0.42;
        cx.beginPath(); cx.moveTo(s.x,s.y-11); cx.quadraticCurveTo(s.x+Math.cos(a)*11,s.y-28,s.x+Math.cos(a)*21,s.y-30-Math.sin(Math.abs(a))*3); cx.stroke(); }
      cx.lineCap='butt';
      break;
    case 'lounger':
      cx.save(); cx.translate(s.x,s.y);
      cx.strokeStyle='#5a4630'; cx.lineWidth=2; cx.beginPath(); cx.moveTo(-14,3); cx.lineTo(-17,9); cx.moveTo(11,3); cx.lineTo(14,9); cx.stroke(); // legs
      cx.fillStyle='#eae0c8'; cx.beginPath(); cx.moveTo(-15,3); cx.lineTo(11,3); cx.lineTo(18,-13); cx.lineTo(-8,-13); cx.closePath(); cx.fill(); // reclined cushion
      cx.strokeStyle='#c98a4a'; cx.lineWidth=1.6; cx.stroke();
      cx.strokeStyle='rgba(120,90,50,0.4)'; cx.lineWidth=1; for(let i=-2;i<=2;i++){ cx.beginPath(); cx.moveTo(i*5+1,3); cx.lineTo(i*5+6,-13); cx.stroke(); }
      cx.restore();
      break;
    case 'poolguest':
      { const gp=Math.floor(f.x*13+f.y*7);
        drawShadowAt(cx,s.x,s.y,12);
        drawHumanoid(cx, s.x, s.y, {skin:['#e6c39a','#caa27b','#a9784e','#8f6a48'][gp%4], hair:['#3a2e26','#6a5a44','#2a241e','#cfc7b8'][(gp>>1)%4],
          shirt:['#e86a8a','#5aa0c0','#ffd76a','#7fb05b'][gp%4], pants:'#3a4a6a', dir:{x:(gp%2?1:-1),y:1}, step:0, size:1.28});
        cx.font='9px Verdana'; cx.textAlign='center'; cx.fillStyle='rgba(0,0,0,0.5)'; cx.fillText('Guest',s.x+1,s.y-40); cx.fillStyle='#ffe9a8'; cx.fillText('Guest',s.x,s.y-41); }
      break;
    case 'parasol':
      cx.save(); cx.translate(s.x,s.y);
      // a little round bistro table under a striped beach umbrella
      cx.fillStyle='#c9b48a'; cx.beginPath(); cx.ellipse(0,-1,9,4.5,0,0,TAU); cx.fill();
      cx.strokeStyle='#7a5a38'; cx.lineWidth=2; cx.beginPath(); cx.moveTo(0,-2); cx.lineTo(0,-34); cx.stroke(); // pole
      const seg=8;
      for(let i=0;i<seg;i++){ const a0=Math.PI+ i/seg*Math.PI, a1=Math.PI+(i+1)/seg*Math.PI;
        cx.fillStyle= i%2? '#e86a6a':'#f4ede0';
        cx.beginPath(); cx.moveTo(0,-34); cx.lineTo(Math.cos(a0)*22,-30+Math.sin(a0)*6); cx.lineTo(Math.cos(a1)*22,-30+Math.sin(a1)*6); cx.closePath(); cx.fill(); }
      cx.fillStyle='#c94a4a'; cx.beginPath(); cx.arc(0,-34,2,0,TAU); cx.fill();
      cx.restore();
      break;
    case 'suitebed':
      { const owned = !!P.resortRoom;
        cx.save(); cx.translate(s.x,s.y);
        // four posts + a canopy, drawn behind the mattress
        cx.strokeStyle='#5a3f28'; cx.lineWidth=3;
        for(const px of [-17,17]){ cx.beginPath(); cx.moveTo(px,4); cx.lineTo(px,-30); cx.stroke(); }
        cx.fillStyle= owned? '#c98a4a':'#7a6a52';
        cx.beginPath(); cx.moveTo(-20,-28); cx.lineTo(20,-28); cx.lineTo(16,-34); cx.lineTo(-16,-34); cx.closePath(); cx.fill(); // canopy valance
        cx.restore();
        // the mattress (reuse the bed blocks, warmer linens when it's yours)
        iBox(s,2.1,1.35,10,'#6e5738','#4a3322','#3e2b1c');
        iBox({x:s.x,y:s.y-10},2.0,1.25,8, owned?'#4f8fb0':'#7f8a6a', owned?'#3f7690':'#5e6a4c', owned?'#356080':'#4e5a40');
        iBox({x:s.x-(0.55)*(TW/2),y:s.y-(0.55)*(TH/2)-18},0.75,0.95,5,'#f0e8d4','#d4c6a0','#bcaa82'); // plumped pillow
        cx.font='9px Verdana'; cx.textAlign='center';
        const lbl= owned? 'Your Suite' : 'Suite';
        cx.fillStyle='rgba(0,0,0,0.5)'; cx.fillText(lbl,s.x+1,s.y-43); cx.fillStyle= owned? '#ffe9a8':'#c8bfa8'; cx.fillText(lbl,s.x,s.y-44);
        if(!owned){ const gl=0.4+0.3*Math.sin(G.time*3); cx.fillStyle='rgba(200,190,168,'+gl.toFixed(2)+')'; cx.font='12px Georgia'; cx.fillText('🔒',s.x,s.y-30); }
      }
      break;
    case 'king':
      drawShadowAt(cx,s.x,s.y,13);
      drawHumanoid(cx, s.x, s.y-2, {skin:'#d8b48c',hair:'#d6d0c4',shirt:'#3a2f5e',pants:'#2a2340',robe:'#402a68',trim:'#c9a24e',beard:'#d6d0c4',beardLong:true,hat:'crown',dir:{x:0,y:1},step:0,size:1.3});
      cx.font='10px Verdana'; cx.textAlign='center'; cx.fillStyle='rgba(0,0,0,0.55)'; cx.fillText('King Aldous',s.x+1,s.y-49); cx.fillStyle='#ffe9a8'; cx.fillText('King Aldous',s.x,s.y-50);
      break;
    case 'cook':
      drawShadowAt(cx,s.x,s.y,12);
      drawHumanoid(cx, s.x, s.y, {skin:'#d8a878',hair:'#cfc7b8',shirt:'#8a4a3a',pants:'#5a4a3a',apron:'#e7ddc9',hairstyle:'bun',dir:{x:-1,y:1},step:0,size:1.24});
      cx.font='10px Verdana'; cx.textAlign='center'; cx.fillStyle='rgba(0,0,0,0.55)'; cx.fillText('Nan the Cook',s.x+1,s.y-45); cx.fillStyle='#ffe9a8'; cx.fillText('Nan the Cook',s.x,s.y-46);
      if(typeof qs==='function' && qs('kitchenrun')==='active' && has('crate',1)){ // a clear "deliver here" cue
        const gl=0.5+0.3*Math.sin(G.time*3);
        cx.strokeStyle='rgba(255,215,106,'+gl.toFixed(2)+')'; cx.lineWidth=2;
        cx.beginPath(); cx.ellipse(s.x,s.y-2,16,7,0,0,TAU); cx.stroke();
        cx.fillStyle='#ffd76a'; cx.font='bold 18px Georgia'; cx.textAlign='center';
        cx.fillText('!', s.x, s.y-58+Math.sin(G.time*3)*3);
      }
      break;
    case 'aelin':
      drawShadowAt(cx,s.x,s.y,12);
      drawHumanoid(cx, s.x, s.y, {skin:'#d0a884',hair:'#8a8aa8',shirt:'#3a3a6a',pants:'#2c2c48',robe:'#40408a',trim:'#9a9ae0',hat:'wizard',hairstyle:'long',dir:{x:0,y:1},step:0,size:1.24});
      cx.font='10px Verdana'; cx.textAlign='center'; cx.fillStyle='rgba(0,0,0,0.55)'; cx.fillText('Aelin the Weaver',s.x+1,s.y-45); cx.fillStyle='#ffe9a8'; cx.fillText('Aelin the Weaver',s.x,s.y-46);
      break;
    case 'guard':
      { const fl=(Math.floor(f.x*3+f.y*5)%2)?1:-1;
        drawShadowAt(cx,s.x,s.y,11);
        drawHumanoid(cx, s.x, s.y, {skin:'#c79a6a',hair:'#3a2f26',shirt:'#5a6478',pants:'#3a4050',trim:'#c9a24e',dir:{x:fl,y:1},step:0,size:1.24});
        cx.strokeStyle='#5a4630'; cx.lineWidth=2.4; cx.beginPath(); cx.moveTo(s.x+fl*9,s.y+1); cx.lineTo(s.x+fl*9,s.y-42); cx.stroke();   // spear
        cx.fillStyle='#c9ccd4'; cx.beginPath(); cx.moveTo(s.x+fl*9,s.y-42); cx.lineTo(s.x+fl*6,s.y-49); cx.lineTo(s.x+fl*12,s.y-49); cx.closePath(); cx.fill(); }
      break;
    case 'stairs':
      { cx.save(); cx.translate(s.x,s.y);
        for(let i=0;i<5;i++){ cx.fillStyle=i%2?'#8f8b83':'#7a766e'; cx.fillRect(-17+i*2,-i*6,34-i*4,8); cx.strokeStyle='rgba(0,0,0,0.3)'; cx.lineWidth=1; cx.strokeRect(-17+i*2,-i*6,34-i*4,8); }
        cx.fillStyle='#ffd76a'; cx.font='bold 13px Georgia'; cx.textAlign='center'; cx.fillText(f.dir==='up'?'▲':'▼', 0, -36+Math.sin(G.time*3)*2);
        cx.restore(); }
      break;
    case 'millcellar':
      // a stone stairwell sunk into the mill floor: a dressed-stone rim around a
      // dark opening with worn steps descending, a warm lamp far below, and a
      // bobbing arrow so it clearly reads as a way DOWN
      { cx.save(); cx.translate(s.x,s.y);
        const pulse=0.5+0.5*Math.sin(G.time*1.8);
        cx.fillStyle='rgba(0,0,0,0.28)'; cx.beginPath(); cx.ellipse(0,6,34,15,0,0,TAU); cx.fill();  // shadow
        cx.fillStyle='#7a6a50';                              // dressed-stone rim (lit top edge)
        cx.beginPath(); cx.moveTo(-34,6); cx.lineTo(-26,-17); cx.lineTo(26,-17); cx.lineTo(34,6); cx.closePath(); cx.fill();
        cx.fillStyle='#5e5040'; cx.beginPath(); cx.moveTo(-34,6); cx.lineTo(-26,-17); cx.lineTo(-20,-17); cx.lineTo(-27,6); cx.closePath(); cx.fill();  // shaded rim side
        cx.strokeStyle='#332a20'; cx.lineWidth=2.4; cx.beginPath(); cx.moveTo(-34,6); cx.lineTo(-26,-17); cx.lineTo(26,-17); cx.lineTo(34,6); cx.closePath(); cx.stroke();
        cx.fillStyle='#0d0906';                              // the dark throat
        cx.beginPath(); cx.moveTo(-22,5); cx.lineTo(-17,-12); cx.lineTo(17,-12); cx.lineTo(22,5); cx.closePath(); cx.fill();
        for(let i=0;i<4;i++){ cx.fillStyle=i%2?'#2a2018':'#372c21'; cx.fillRect(-19+i*3,3-i*4,38-i*6,4); }   // worn steps descending
        cx.fillStyle='rgba(255,196,110,'+(0.12+0.16*pulse)+')';   // warm lamp glow from the workings below
        cx.beginPath(); cx.moveTo(-13,4); cx.quadraticCurveTo(0,-8,13,4); cx.closePath(); cx.fill();
        cx.fillStyle='#ffd76a'; cx.font='bold 15px Georgia'; cx.textAlign='center'; cx.fillText('▼', 0, -24+Math.sin(G.time*3)*2);   // "way down"
        cx.restore(); }
      break;
    case 'palacefountain':
      { const t=(G.interior?G.interior.t:G.time); cx.save(); cx.translate(s.x,s.y);
        cx.fillStyle='rgba(0,0,0,0.14)'; cx.beginPath(); cx.ellipse(0,6,46,14,0,0,TAU); cx.fill();
        cx.fillStyle='#b8b4ab'; cx.beginPath(); cx.ellipse(0,0,44,21,0,0,TAU); cx.fill();
        cx.fillStyle='#8f8b83'; cx.beginPath(); cx.ellipse(0,0,44,21,0,0,TAU); cx.stroke();
        cx.fillStyle='#5aa0d0'; cx.beginPath(); cx.ellipse(0,-1,35,15,0,0,TAU); cx.fill();
        cx.fillStyle='rgba(255,255,255,0.4)'; for(let i=0;i<4;i++){ const a=t*1.4+i*1.6; cx.beginPath(); cx.ellipse(Math.cos(a)*17,Math.sin(a)*7,4,2,0,0,TAU); cx.fill(); }
        cx.fillStyle='#a8a49b'; cx.fillRect(-5,-32,10,30); cx.fillStyle='#c9a24e'; cx.beginPath(); cx.arc(0,-34,5,0,TAU); cx.fill();
        cx.strokeStyle='rgba(150,205,235,0.6)'; cx.lineWidth=2; for(let i=0;i<5;i++){ const a=-Math.PI/2+(i-2)*0.42; cx.beginPath(); cx.moveTo(0,-34); cx.quadraticCurveTo(Math.cos(a)*15,-44,Math.cos(a)*24,-24); cx.stroke(); }
        cx.restore(); }
      break;
    case 'towertop':
      { cx.save(); cx.translate(s.x,s.y);
        cx.fillStyle='#8f8b83'; cx.fillRect(-17,-74,34,76); cx.fillStyle='#6e6a63'; cx.fillRect(-17,-74,11,76);
        cx.fillStyle='#a8a49b'; for(let i=0;i<5;i++) cx.fillRect(-17+i*7.4,-82,5,11);
        cx.fillStyle='#241a10'; cx.fillRect(-5,-52,10,17); cx.fillStyle='#ffce7a'; cx.fillRect(-3,-50,6,8);
        cx.strokeStyle='#3a2a1a'; cx.lineWidth=2.4; cx.beginPath(); cx.moveTo(0,-82); cx.lineTo(0,-98); cx.stroke();
        cx.fillStyle='#6a3a5e'; cx.beginPath(); cx.moveTo(0,-98); cx.lineTo(17,-93); cx.lineTo(0,-88); cx.closePath(); cx.fill();
        cx.restore(); }
      break;
    case 'crenel':
      cx.fillStyle='#8f8b83'; cx.fillRect(s.x-8,s.y-15,16,15);
      cx.fillStyle='#a8a49b'; cx.fillRect(s.x-8,s.y-20,6,6); cx.fillRect(s.x+2,s.y-20,6,6);
      cx.strokeStyle='rgba(0,0,0,0.25)'; cx.lineWidth=1; cx.strokeRect(s.x-8,s.y-15,16,15);
      break;
  }
}
function drawWallDecor(kind,w2s,I){
  // hanging items along the north wall
  const at=(x,fn)=>{ const s=w2s(x,0.05); fn(s.x,s.y-42); };
  if(kind==='house'||kind==='tower'){
    at(6.4,(x,y)=>{ if(kind!=='house') return; cx.fillStyle='#5a3d24'; cx.fillRect(x-22,y+6,44,4);
      for(let i=0;i<3;i++){ cx.fillStyle=['#7fb05b','#c96f8a','#7fd4ff'][i]; cx.fillRect(x-16+i*14,y-2,8,8); } });
  }
  if(kind==='tower'){
    at(4.6,(x,y)=>{ cx.fillStyle='#5a3d24'; cx.fillRect(x-30,y+6,60,4);
      for(let i=0;i<6;i++){ cx.fillStyle=['#8f4a3a','#3e6f8f','#6e5030','#5a4472','#4f6032','#8a6d30'][i]; cx.fillRect(x-27+i*9,y-8,7,14); } });
    at(2.2,(x,y)=>{ cx.fillStyle='#e8dcbd'; cx.fillRect(x-14,y-10,28,22);
      cx.strokeStyle='#3a4a6f'; cx.beginPath(); cx.arc(x,y+1,7,0,TAU); cx.stroke();
      cx.fillStyle='#ffd76a'; for(const p of [[-8,-5],[6,-3],[9,6],[-5,8]]){ cx.fillRect(x+p[0],y+p[1],2,2); } });
  }
  if(kind==='forge'){
    at(6.0,(x,y)=>{ cx.fillStyle='#5a3d24'; cx.fillRect(x-30,y+6,60,4);
      cx.strokeStyle='#8a919d'; cx.lineWidth=3;
      cx.beginPath(); cx.moveTo(x-20,y+4); cx.lineTo(x-20,y-10); cx.moveTo(x-24,y-8); cx.lineTo(x-16,y-8);
      cx.moveTo(x,y+4); cx.lineTo(x,y-10); cx.moveTo(x-4,y-10); cx.lineTo(x+4,y-10);
      cx.moveTo(x+18,y+4); cx.lineTo(x+18,y-8); cx.stroke(); });
  }
  if(kind==='house2'){
    at(4.4,(x,y)=>{ cx.strokeStyle='rgba(201,185,144,0.75)'; cx.lineWidth=1;
      for(let i=0;i<5;i++){ cx.beginPath(); cx.moveTo(x-26+i*13,y-12); cx.quadraticCurveTo(x-20+i*13,y+8,x-26+i*13,y+16); cx.stroke(); }
      for(let i=0;i<4;i++){ cx.beginPath(); cx.moveTo(x-28,y-8+i*7); cx.quadraticCurveTo(x,y-4+i*7,x+28,y-8+i*7); cx.stroke(); } });
  }
  if(kind==='barn'){
    at(6.5,(x,y)=>{ cx.strokeStyle='#5a3d24'; cx.lineWidth=4; cx.beginPath(); cx.arc(x,y+2,14,0,TAU); cx.stroke();
      cx.beginPath(); for(let i=0;i<6;i++){ const a=i*TAU/6; cx.moveTo(x,y+2); cx.lineTo(x+Math.cos(a)*13,y+2+Math.sin(a)*13); } cx.lineWidth=2; cx.stroke(); });
  }
}
// Interior camera: small rooms frame on their centre (whole room visible);
// big rooms (I.follow, e.g. the grand resort) track the player so you can
// wander a space larger than the screen.
function interiorCenter(I){
  I=I||G.interior;
  if(I && I.follow) return {x:isoX(P.x,P.y), y:isoY(P.x,P.y)};
  return {x:isoX(I.w/2,I.h/2), y:isoY(I.w/2,I.h/2)};
}
function renderInterior(){
  cx.setTransform(DPR,0,0,DPR,0,0);
  const I=G.interior;
  if(I.resort || I.sky){ // open sky - resort courtyard, or the palace ramparts
    const sg=cx.createLinearGradient(0,0,0,VH);
    sg.addColorStop(0,'#bcdff2'); sg.addColorStop(0.4,'#dcecf6'); sg.addColorStop(1,'#141210');
    cx.fillStyle=sg;
  } else cx.fillStyle='#0b0906';
  cx.fillRect(0,0,VW,VH);
  const cc=interiorCenter(I);
  const ccx=cc.x, ccy=cc.y;
  const w2s=(x,y)=>({x:isoX(x,y)-ccx+VW/2, y:isoY(x,y)-ccy+VH/2+14});
  // floor
  for(let y=0;y<I.h;y++) for(let x=0;x<I.w;x++){
    const s=w2s(x,y);
    if(I.lair){
      cx.fillStyle=['#241713','#1c110e','#2a1a15','#180f0c'][(x*7+y*13)%4];
      cx.beginPath(); cx.moveTo(s.x,s.y-TH/2); cx.lineTo(s.x+TW/2,s.y); cx.lineTo(s.x,s.y+TH/2); cx.lineTo(s.x-TW/2,s.y); cx.closePath(); cx.fill();
      if((x*5+y*3)%7===0){ cx.fillStyle='rgba(255,110,40,0.10)'; // faint ember cracks in the rock
        cx.beginPath(); cx.moveTo(s.x-6,s.y); cx.lineTo(s.x,s.y-3); cx.lineTo(s.x+6,s.y+1); cx.stroke&&cx.stroke(); cx.strokeStyle='rgba(255,120,50,0.16)'; cx.lineWidth=1; cx.stroke(); }
    } else if(I.resort){
      // marble in the lobby; open patio stone out in the pool courtyard
      const courtyard = I.partY!=null && y < I.partY;
      cx.fillStyle= courtyard? ((x+y)%2? '#ccc6b0':'#c1baa2') : ((x+y)%2? '#eae2d0':'#ddd3bd');
      cx.beginPath(); cx.moveTo(s.x,s.y-TH/2); cx.lineTo(s.x+TW/2,s.y); cx.lineTo(s.x,s.y+TH/2); cx.lineTo(s.x-TW/2,s.y); cx.closePath(); cx.fill();
      cx.strokeStyle= courtyard? 'rgba(120,110,88,0.28)':'rgba(255,255,255,0.25)'; cx.lineWidth=1; cx.stroke();
    } else if(I.igloo){
      // packed snow & ice floor
      cx.fillStyle=(x+y)%2? '#e4ebf4':'#d3ddea';
      cx.beginPath(); cx.moveTo(s.x,s.y-TH/2); cx.lineTo(s.x+TW/2,s.y); cx.lineTo(s.x,s.y+TH/2); cx.lineTo(s.x-TW/2,s.y); cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(150,175,205,0.3)'; cx.lineWidth=1; cx.stroke();
    } else if(I.palace){
      // grey flagstone; the central courtyard is an open green atrium
      const court = I.courtyard && x+0.5>=I.courtyard.x0 && x+0.5<=I.courtyard.x1 && y+0.5>=I.courtyard.y0 && y+0.5<=I.courtyard.y1;
      cx.fillStyle= court? ((x+y)%2?'#6f9a54':'#658c4c') : ((x+y)%2? '#8f8b83':'#807c74');
      cx.beginPath(); cx.moveTo(s.x,s.y-TH/2); cx.lineTo(s.x+TW/2,s.y); cx.lineTo(s.x,s.y+TH/2); cx.lineTo(s.x-TW/2,s.y); cx.closePath(); cx.fill();
      cx.strokeStyle= court? 'rgba(40,70,30,0.25)':'rgba(40,36,30,0.35)'; cx.lineWidth=1; cx.stroke();
    } else {
      cx.drawImage(TILE_SPR[T.PLANK][(x*7+y*13)%4], s.x-TW/2, s.y-TH/2);
    }
  }
  // walls: north (y=0) and west (x=0). The resort draws its own zoned walls
  // (tall lobby, low garden courtyard, arched partition) in drawResortScene.
  const WH= I.lair? 96 : I.palace? 76 : 62;   // the lair & the great hall run tall
  if(!I.resort && !I.sky){   // the ramparts are open to the sky - no enclosing walls
    for(let x=0;x<I.w;x++){
      const a=w2s(x,0), b=w2s(x+1,0);
      cx.fillStyle= I.lair? (x%2?'#231510':'#1a0f0b') : I.igloo? (x%2?'#e6edf6':'#d6e0ec') : I.palace? (x%2?'#6e6a63':'#615d57') : (x%2? '#4a3626':'#443122');
      cx.beginPath(); cx.moveTo(a.x-TW/2,a.y-TH/2); cx.lineTo(b.x-TW/2,b.y-TH/2);
      cx.lineTo(b.x-TW/2,b.y-TH/2-WH); cx.lineTo(a.x-TW/2,a.y-TH/2-WH); cx.closePath(); cx.fill();
    }
    for(let y=0;y<I.h;y++){
      const a=w2s(0,y), b=w2s(0,y+1);
      cx.fillStyle= I.lair? (y%2?'#1d110d':'#150c09') : I.igloo? (y%2?'#d6e0ec':'#c6d3e3') : I.palace? (y%2?'#615d57':'#55524c') : (y%2? '#3a2a1c':'#352718');
      cx.beginPath(); cx.moveTo(a.x-TW/2,a.y-TH/2); cx.lineTo(b.x-TW/2,b.y-TH/2);
      cx.lineTo(b.x-TW/2,b.y-TH/2-WH); cx.lineTo(a.x-TW/2,a.y-TH/2-WH); cx.closePath(); cx.fill();
    }
  }
  if(I.lair) drawLairScene(w2s,I);
  if(I.resort) drawResortScene(w2s,I);
  if(I.igloo){
    // faint horizontal snow-block courses on the two walls
    cx.strokeStyle='rgba(150,175,205,0.35)'; cx.lineWidth=1;
    for(let c=1;c<=3;c++){ const yo=c*18;
      let a=w2s(0,0), b2=w2s(I.w,0); cx.beginPath(); cx.moveTo(a.x-TW/2,a.y-TH/2-yo); cx.lineTo(b2.x-TW/2,b2.y-TH/2-yo); cx.stroke();
      let c2=w2s(0,0), d2=w2s(0,I.h); cx.beginPath(); cx.moveTo(c2.x-TW/2,c2.y-TH/2-yo); cx.lineTo(d2.x-TW/2,d2.y-TH/2-yo); cx.stroke(); }
    // the central fire pit
    const hf=I.furn.find(f=>f.type==='hearth');
    if(hf){ const s=w2s(hf.x,hf.y);
      const gg=cx.createRadialGradient(s.x,s.y-8,4,s.x,s.y-8,96); gg.addColorStop(0,'rgba(255,184,96,0.24)'); gg.addColorStop(1,'rgba(255,184,96,0)');
      cx.fillStyle=gg; cx.fillRect(s.x-96,s.y-96,192,192);
      cx.fillStyle='#5a554e'; cx.beginPath(); cx.ellipse(s.x,s.y+2,22,10,0,0,TAU); cx.fill();  // stone ring
      cx.fillStyle='#241f1a'; cx.beginPath(); cx.ellipse(s.x,s.y,14,6,0,0,TAU); cx.fill();
      cx.fillStyle='#3a2a1c'; cx.fillRect(s.x-12,s.y-3,24,3);  // logs
      for(let i=0;i<4;i++){ const fl=Math.sin(I.t*8+i*1.7)*3; cx.fillStyle=['#ff9a3c','#ffce7a','#e05648','#ffb26b'][i];
        cx.beginPath(); cx.moveTo(s.x-9+i*6,s.y-2); cx.quadraticCurveTo(s.x-7+i*6+fl,s.y-22-i*2,s.x-5+i*6,s.y-2); cx.closePath(); cx.fill(); }
      if(Math.random()<0.3) G.parts.push({x:hf.x,y:hf.y-0.2,vx:rnd(-0.15,0.15),vy:-rnd(0.5,1.2),life:rnd(0.5,1.1),color:Math.random()<0.5?'#ffb26b':'rgba(180,180,180,0.5)',size:rnd(1.2,2.6),grav:-0.08}); }
  }
  // window with moody light on the north wall
  if(!I.lair && !I.resort && !I.igloo && !I.palace){ const s=w2s(7.0,0.05);
    const night=nightAmount();
    cx.fillStyle= night>0.4? '#1c2a4a' : '#c9d8e8';
    cx.fillRect(s.x-12,s.y-52,24,20);
    cx.strokeStyle='#241b12'; cx.lineWidth=3; cx.strokeRect(s.x-12,s.y-52,24,20);
    cx.beginPath(); cx.moveTo(s.x,s.y-52); cx.lineTo(s.x,s.y-32); cx.moveTo(s.x-12,s.y-42); cx.lineTo(s.x+12,s.y-42); cx.stroke();
  }
  // hearth fire (house & forge)
  if(I.kind==='house'||I.kind==='forge'||I.kind==='kitchen'){
    const hf=I.furn.find(f=>f.type==='hearth');
    const s=w2s(hf.x,0.1);
    cx.fillStyle='#57534c'; cx.fillRect(s.x-26,s.y-56,52,40);
    cx.fillStyle='#1c1712'; cx.fillRect(s.x-16,s.y-42,32,26);
    for(let i=0;i<3;i++){
      const fl=Math.sin(I.t*8+i*2.1)*3;
      cx.fillStyle=['#ff9a3c','#ffce7a','#e05648'][i];
      cx.beginPath();
      cx.moveTo(s.x-10+i*8,s.y-18);
      cx.quadraticCurveTo(s.x-8+i*8+fl,s.y-32-i*3, s.x-6+i*8,s.y-18);
      cx.closePath(); cx.fill();
    }
  }
  drawWallDecor(I.kind,w2s,I);
  // door mat + glow at the exit (the ramparts have no door - you leave by the stairs down)
  if(I.exit){ const s=w2s(I.exit.x,I.exit.y+0.5);
    cx.fillStyle='rgba(255,215,106,'+(0.15+0.1*Math.sin(G.time*3))+')';
    cx.save(); cx.translate(s.x,s.y); cx.scale(1,0.5);
    cx.beginPath(); cx.arc(0,0,26,0,TAU); cx.fill(); cx.restore();
    cx.fillStyle='#ffd76a'; cx.font='bold 14px Georgia'; cx.textAlign='center';
    cx.fillText('▼', s.x, s.y+4-Math.abs(Math.sin(G.time*3))*4);
  }
  // furniture & player, depth-sorted
  const items=I.furn.map(f=>({d:f.x+f.y,f}));
  items.push({d:P.x+P.y,player:true});
  items.sort((a,b)=>a.d-b.d);
  for(const it of items){
    if(it.player){ const s=w2s(P.x,P.y); drawShadowAt(cx,s.x,s.y,11); drawPlayer(s); }
    else drawFurniture(it.f, w2s(it.f.x,it.f.y));
  }
  // ambient grade: volcanic red-orange for the lair, cozy warm elsewhere
  const wg=cx.createRadialGradient(VW/2,VH/2,60,VW/2,VH/2,Math.max(VW,VH)*0.62);
  if(I.lair){ wg.addColorStop(0,'rgba(255,90,30,0.10)'); wg.addColorStop(1,'rgba(20,0,0,0.66)'); }
  else if(I.resort){ wg.addColorStop(0,'rgba(255,240,200,0.10)'); wg.addColorStop(1,'rgba(40,60,80,0.30)'); } // bright, airy daylight
  else if(I.igloo){ wg.addColorStop(0,'rgba(255,188,110,0.10)'); wg.addColorStop(1,'rgba(46,66,98,0.46)'); } // firelight in a cold shell
  else if(I.palace){ if(I.sky){ wg.addColorStop(0,'rgba(255,240,205,0.08)'); wg.addColorStop(1,'rgba(50,66,92,0.34)'); } // bright ramparts
                     else { wg.addColorStop(0,'rgba(255,210,140,0.07)'); wg.addColorStop(1,'rgba(10,8,14,0.5)'); } } // torchlit hall
  else { wg.addColorStop(0,'rgba(255,170,90,0.06)'); wg.addColorStop(1,'rgba(0,0,0,0.55)'); }
  cx.fillStyle=wg; cx.fillRect(0,0,VW,VH);
  drawGritGrade();
  // interact affordance: hotspots beat the door when closer
  const hs=interiorHotspot();
  const nearExit=I.exit && dist(P.x,P.y,I.exit.x,I.exit.y)<1.5;
  const ib=document.getElementById('interactBtn');
  let label=null, at=null;
  if(hs && (!nearExit || dist(P.x,P.y,hs.f.x,hs.f.y)<dist(P.x,P.y,I.exit.x,I.exit.y))){
    label=hs.label; at=w2s(hs.f.x,hs.f.y);
    cx.strokeStyle='rgba(255,215,106,0.8)'; cx.lineWidth=2;
    cx.setLineDash([5,4]); cx.lineDashOffset=-G.time*16;
    cx.beginPath(); cx.ellipse(at.x,at.y,20,9,0,0,TAU); cx.stroke(); cx.setLineDash([]);
  } else if(nearExit){ label='Leave'; at=w2s(I.exit.x,I.exit.y); }
  if(isTouch){
    ib.style.display= label? 'flex':'none';
    if(label) ib.textContent=label;
  } else if(label){
    cx.font='11px Verdana'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,0.6)'; cx.fillText('E - '+label, at.x+1, at.y-33);
    cx.fillStyle='#ffe9a8'; cx.fillText('E - '+label, at.x, at.y-34);
  }
}

