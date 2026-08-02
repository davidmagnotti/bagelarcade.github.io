/* =====================================================================
   GAMEPLAY SYSTEMS
   ===================================================================== */
function moveEntity(e,dx,dy,rad,waterOK,diveOK){
  rad=rad||0.28;
  // DEV float / noclip: the player drifts through everything - walls, water, land-solids,
  // pits - with no collision at all. Toggled from the dev menu (window.DEVFLOAT).
  if(e===P && window.DEVFLOAT){ e.x+=dx; e.y+=dy; return; }
  // In the Undermaw the black scar is a bottomless pit the hero crosses on platforms.
  // Mobs have no falling logic, so left alone they wander out and float over the void.
  // Hold every non-player entity back at the pit's edge; the player still crosses freely.
  const mobPit = e!==P && G.worldId==='undermaw' && G._mawPits;
  let nx=e.x+dx;
  if(!circleBlocked(nx,e.y,rad,waterOK,diveOK) && !(mobPit && G._mawPits.has((nx|0)+','+(e.y|0)))) e.x=nx;
  let ny=e.y+dy;
  if(!circleBlocked(e.x,ny,rad,waterOK,diveOK) && !(mobPit && G._mawPits.has((e.x|0)+','+(ny|0)))) e.y=ny;
}
function unstickEntity(e, waterOK){
  // if an entity is embedded in water or a solid, snap it to the nearest open tile.
  // waterOK (a windsurfer) treats light shallows as valid footing, so the board is
  // never yanked back to shore - without it, a surfer on the water reads as "stuck".
  if(!circleBlocked(e.x,e.y,0.26,waterOK)) return false;
  for(let d=0;d<=8;d++) for(let oy=-d;oy<=d;oy++) for(let ox=-d;ox<=d;ox++){
    if(Math.max(Math.abs(ox),Math.abs(oy))!==d) continue;
    const tx=Math.round(e.x)+ox, ty=Math.round(e.y)+oy;
    if(!inb(tx,ty)) continue;
    const tt=tileAt(tx,ty);
    if((walkTile(tt) || (waterOK && tt===T.SHALLOW)) && !circleBlocked(tx+0.5,ty+0.5,0.3,waterOK)){
      e.x=tx+0.5; e.y=ty+0.5; return true;
    }
  }
  return false;
}
// The palace wall is one flat, screen-centred billboard, so tile solids give its
// edge a diamond-toothed feel. This is the crisp, continuous line you actually
// collide with: a point is inside the keep when its on-screen centre is under the
// sprite (|rx|<=span) and at/behind the wall base (ry in [back, base]).
function palaceBarrier(x,y){
  if(!PALACE_BAR || G.worldId!=='crown') return false;
  const B=PALACE_BAR;
  const rx=((x-y)-B.axm)*32, ry=((x+y)-B.aym)*16;
  return ry<=B.base && ry>=B.back && rx<=B.span && rx>=-B.span;
}
function circleBlocked(x,y,r,waterOK,diveOK){
  if(palaceBarrier(x,y)) return true;
  for(const [ox,oy] of [[-r,-r],[r,-r],[-r,r],[r,r],[0,-r],[0,r],[-r,0],[r,0]]){
    if(palaceBarrier(x+ox,y+oy)) return true;   // radius-aware straight wall
    const tx=Math.floor(x+ox), ty=Math.floor(y+oy);
    if(solidAt(tx,ty)){
      // the windsurf board rides only the LIGHT water near shore - shallows -
      // never the dark deep-water beyond. That keeps you close to land.
      if(waterOK && inb(tx,ty) && tileAt(tx,ty)===T.SHALLOW) continue;
      // DIVING (Barik's drowned-vault gift): a diver crosses the deep water itself,
      // sinking under the flood the windsurf could never ride. Both shallow and deep
      // open up - but only over genuine water tiles, never through walls or land-solids.
      if(diveOK && inb(tx,ty)){ const dt=tileAt(tx,ty); if(dt===T.DEEP||dt===T.SHALLOW) continue; }
      return true;
    }
  }
  return false;
}

/* ---- the Hollow Spirit's wall of fire ----------------------------------------
   When the hero steps north of the ruin mouth to meet the King, a wall of fire
   roars up across the gate behind them, sealing the arena until the King falls
   (or the hero is carried out of it). The gate tiles are made solid while lit. */
let HOLLOW_FIRE = {active:false, t:0};
function raiseHollowFire(){
  if(HOLLOW_FIRE.active || !HOLLOW_GATE || !HOLLOW_GATE.length) return;
  HOLLOW_FIRE.active=true; HOLLOW_FIRE.t=0;
  for(const [x,y] of HOLLOW_GATE){
    setSolid(x,y,1);
    G.decor.push({kind:'kingfire', x:x+0.5, y:y+0.5, ph:Math.random()*TAU});
  }
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(typeof banner==='function') banner('A WALL OF FIRE','THE RUINS SEAL - FELL THE KING TO PASS');
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
  G.shake=Math.max(G.shake||0,0.7);
}
function dropHollowFire(){
  if(!HOLLOW_FIRE.active) return;
  HOLLOW_FIRE.active=false; HOLLOW_FIRE.t=0;
  if(HOLLOW_GATE) for(const [x,y] of HOLLOW_GATE) setSolid(x,y,0);
  G.decor = G.decor.filter(b=>b.kind!=='kingfire');
  if(typeof invalidateScenery==='function') invalidateScenery();
}
function updateHollowFire(dt){
  if(G.worldId!=='isle') return;                  // arena only exists on Emberwick
  if(G.hollowSealed) return;                       // the ward still holds - no arena yet
  const boss = G.mobs.find(m=>m.boss);
  if(!boss || boss.dead){ dropHollowFire(); return; }  // King down (or gone) - lift the seal
  if(!HOLLOW_FIRE.active){
    // seal once the hero has stepped north of the gate, onto the King's ground
    if(!P.dead && P.y < HOLLOW_GATEY-0.6 && P.x>HOLLOW_MINX-1 && P.x<HOLLOW_MAXX+1) raiseHollowFire();
  } else {
    HOLLOW_FIRE.t+=dt;
    // hero carried out of the arena (death/respawn) - the fire gutters out
    if(P.dead || P.y > HOLLOW_GATEY+0.6){ dropHollowFire(); return; }
    // embers drifting up off the wall
    if(typeof fxOn==='function' && fxOn('particles') && Math.random()<0.6){
      const g=HOLLOW_GATE[(Math.random()*HOLLOW_GATE.length)|0];
      if(g) G.parts.push({x:g[0]+0.5+rnd(-0.4,0.4), y:g[1]+0.4, vx:rnd(-0.2,0.2), vy:-rnd(0.8,1.6),
        life:rnd(0.5,1.1), color:Math.random()<0.5?'#ff9a3c':'#ffd76a', size:rnd(1.5,3), grav:-0.15});
    }
  }
}

/* ---- the ward that seals the Hollow Spirit away until the quest begins --------
   Before Elder Maren speaks her charge, the ruined causeway stands walled: the
   ward-gate tiles are solid, a rampart of old ruin-stone renders across the neck,
   and the King with his bone-guard are hidden behind it (skipped by AI, targeting
   and rendering while sealed). Accepting the king quest - or reloading a save with
   it already underway - opens the gate for good. The seal is raised at world-gen
   and reconciled every frame by updateHollowSeal, so it settles correctly no
   matter when quest state is restored on load. */
function kingQuestBegun(){ return qs('king')==='active' || qs('king')==='done'; }
function sealHollowKing(){
  if(G.worldId!=='isle' || typeof WARD_GATE==='undefined' || !WARD_GATE.length){ G.hollowSealed=false; return; }
  G.hollowSealed=true;
  for(const [x,y] of WARD_GATE){
    setSolid(x,y,1);
    if(!G.decor.some(d=>d.kind==='wardgate' && d.gx===x && d.gy===y))
      G.decor.push({kind:'wardgate', x:x+0.5, y:y+0.5, gx:x, gy:y, mid:(x===Math.round(ZONES.ruins.x)), ph:Math.random()*TAU});
  }
  for(const m of G.mobs) if(m.hollowGuard) m.sealed=true;
  if(typeof invalidateScenery==='function') invalidateScenery();
}
function openHollowGate(announce){
  if(!G.hollowSealed && !G.decor.some(b=>b.kind==='wardgate')) return;
  G.hollowSealed=false;
  if(typeof WARD_GATE!=='undefined' && WARD_GATE) for(const [x,y] of WARD_GATE) setSolid(x,y,0);
  G.decor = G.decor.filter(b=>b.kind!=='wardgate');
  // the bone-guard rise to meet you when the gate opens - but the KING himself stays
  // hidden in the barrow-earth until you come for him (revealed + risen on approach,
  // see updateHollowSeal), so he isn't just standing there waiting.
  for(const m of G.mobs) if(m.hollowGuard && !m.boss) m.sealed=false;
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(announce){
    if(typeof banner==='function') banner('THE WARD-GATE OPENS','THE CAUSEWAY LIES OPEN - THE HOLLOW SPIRIT STIRS');
    const mx=(typeof WARD_MINX!=='undefined')?(WARD_MINX+WARD_MAXX)/2+0.5:46;
    if(typeof shockwave==='function') shockwave(mx, WARD_GATEY+0.5, 'rgba(155,224,160,0.85)', 55);
    G.shake=Math.max(G.shake||0,0.55);
    if(typeof Snd!=='undefined' && Snd.quest) Snd.quest();
  }
}
function updateHollowSeal(){
  if(G.worldId!=='isle') return;
  if(G.hollowSealed && kingQuestBegun()) openHollowGate(false);
  // the King waits hidden in the earth until you draw near: reveal him and start his
  // rise the moment you close on the barrow, so he never stands about before the fight
  if(!G.hollowSealed && kingQuestBegun() && !G.bossIntro){
    const k=G.mobs.find(m=>m.boss && m.hollowGuard && m.sealed && !m.dead);
    if(k && dist(P.x,P.y,k.x,k.y)<10){
      k.sealed=false;
      if(typeof startBossIntro==='function' && k.entrance && !k.entranceDone)
        startBossIntro(k,{kind:k.entrance,title:k.entranceTitle,sub:k.entranceSub});
    }
  }
}

/* ---- nearest interactable ---- */
function nearestInteract(){
  // bd tracks the nearest candidate; each candidate enforces its own reach.
  // (It used to start at 1.9, which silently capped every longer reach below -
  // most visibly fishing, whose 2.3 range never applied, so a fish node just out
  // of a dock's reach gave no prompt at all.)
  let best=null, bd=Infinity;
  for(const n of G.npcs){ if(n.hidden) continue; const d=dist(P.x,P.y,n.x,n.y); if(d<1.9 && d<bd){bd=d;best={type:'npc',o:n,label:'Talk'};} }
  if(G.cat && !G.cat.following){ const d=dist(P.x,P.y,G.cat.x,G.cat.y);
    if(d<1.9 && d<bd){bd=d;best={type:'cat',o:G.cat,label:'Pet'};} }
  // any wandering cat (the ambient village/plaza critters) can be petted for a 'meow'
  for(const c of (G.critters||[])){ if(c.kind!=='cat') continue; const d=dist(P.x,P.y,c.x,c.y);
    if(d<1.6 && d<bd){bd=d;best={type:'petcat',o:c,label:'Pet'};} }
  for(const n of G.nodes){
    if(n.dead) continue;
    const d=dist(P.x,P.y,n.x,n.y);
    const rng = n.kind==='fish'?2.4:1.7;   // fish sit in open water - reach across from the bank
    if(d<rng && d<bd){
      bd=d;
      const lbl={tree:'Chop',rock:'Mine',mushroom:'Pick',shell:'Gather',apple:'Pick',fish: P.fishing? (P.fishing.bit?'Strike!':'…wait…') :'Fish'}[n.kind];
      best={type:'node',o:n,label:lbl};
    }
  }
  for(const b of G.decor){
    // only pillars carrying an intentional lore note are readable now; plain ruin
    // pillars (the crypt/ruins dressing) are scenery, with no generic "Read" text
    if(b.kind==='pillar' && b.loreKey){
      const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.6 && d<bd){ bd=d; best={type:'lore',key:b.loreKey,o:b,label:'Read'}; }
    }
    if(b.kind==='crypt' && !b.noRead){
      const d=dist(P.x,P.y,b.x,b.y+1);
      if(d<2.2 && d<bd){ bd=d; best={type:'lore',key:'crypt',o:b,label:'Read'}; }
    }
    if(b.kind==='tunnelmouth'){
      const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.0 && d<bd){ bd=d; best= b.deep? {type:'aeriedeep',o:b,label:b.up?'Climb out':'Descend'} : {type:'warp',o:b,label:'Enter'}; }
    }
    if(b.kind==='tome' && !b.destroyed){
      const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.0 && d<bd){ bd=d; best={type:'tome',o:b,label:'Destroy'}; }
    }
    if(b.kind==='well' && P.projects.well){
      const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.8 && d<bd){ bd=d; best={type:'well',o:b,label: P.wellCd>0? 'Well ('+Math.ceil(P.wellCd)+'s)':'Drink'}; }
    }
    if(b.kind==='bazaar' && b.shop){ const d=dist(P.x,P.y,b.x,b.y+0.9);
      if(d<1.9 && d<bd){ bd=d; best={type:'shop',o:b,label:'Shop'}; } }
    if(b.kind==='house'||b.kind==='house2'||b.kind==='igloo'||b.kind==='forge'||b.kind==='barn'||b.kind==='tower'||b.kind==='castle'||b.kind==='hut'||b.kind==='resort'||b.kind==='windmill'||b.kind==='waterwheel'){
      const doorX=b.door?b.door.x:b.x, doorY=b.door?b.door.y:(b.y+(b.kind==='resort'?2.2:0.9));
      const d=dist(P.x,P.y,doorX,doorY);
      if(d<(b.grand?2.6:1.8) && d<bd){ bd=d; best={type:'door',o:b,label:b.grand?'Enter the palace':'Enter'}; }
    }
    if(b.kind==='lairmouth'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.3 && d<bd){ bd=d; best={type:'lair',o:b,label:'Enter'}; } }
    if(b.kind==='cavemouth'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.2 && d<bd){ bd=d; best={type:'cave',o:b,label:'Enter'}; } }
    if(b.kind==='dungeonmouth'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.3 && d<bd){ bd=d; best={type: b.vault?'vaultdungeon': b.mill?'milldungeon': b.ember?'emberdungeon': b.undermaw?'undermawdungeon': b.drowned?'drowneddungeon': b.deepworld?'gatedungeon':'dungeon',o:b,
        label: b.exit?'Climb out':(b.ember && !(P.story&&(P.story.emberKey||P.story.emberDone||qs('wyrm')==='done')))?'Locked - Ember-Key needed':(b.vault && !(P.story&&P.story.iceBearDown))?'A bear’s den':'Descend'}; } }
    if(b.kind==='icelever'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.8 && d<bd){ bd=d; best={type:'lever',o:b,label:b.on?'Lever (thrown)':'Pull lever'}; } }
    if(b.kind==='emberlever'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.8 && d<bd){ bd=d; best={type:'emberlever',o:b,label:b.on?'Lever (thrown)':'Pull lever'}; } }
    if(b.kind==='firelever'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.8 && d<bd){ bd=d; best={type:'firelever',o:b,label:'Pull the fire-lever'}; } }
    if(b.kind==='sluicelever'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.9 && d<bd){ bd=d; best={type:'sluicelever',o:b,label:(b.on?'Sluice (open)':'Turn the sluice valve')}; } }
    if(b.kind==='icebrazier'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.9 && d<bd){ bd=d; best={type:'icebrazier',o:b,label:b.lit?'Light torch':(b.frozen?'Frozen brazier':'Brazier')}; } }
    // the warding runes (Emberdeep puzzle 3) - reachable by E / the touch button,
    // not only a direct tap, so they can actually be pressed on mobile
    if(b.kind==='emberbutton'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.8 && d<bd){ bd=d; best={type:'emberbutton',o:b,label:b.set?'Rune (lit)':'Press rune'}; } }
    if(b.kind==='staffgate' && !b.open){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.0 && d<bd){ bd=d; best={type:'staffgate',o:b,label:(P.unlocked&&P.unlocked.melee)?'Cut the ward':'Arcane ward'}; } }
    if(b.kind==='tombmouth'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.3 && d<bd){ bd=d; best={type:'tomb',o:b,label:b.up?'Climb out':'Enter the catacomb'}; } }
    if(b.kind==='dragonrest'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<3.0 && d<bd){ bd=d; best={type:'dragonrest',o:b,label:'Speak'}; } }
    if(b.kind==='boat'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.4 && d<bd){ bd=d; best={type:'boat',o:b,label:'Sail'}; } }
    if(b.kind==='ashwing'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<3.0 && d<bd){ bd=d; best={type:'ashwing',o:b,label:b.sky?'Fly down':'Fly home'}; } }
    if(b.kind==='leappoint'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.2 && d<bd){ bd=d; best={type:'leap',o:b,label:(P.story&&P.story.parachute)?'Take the Leap':'The Leap'}; } }
    if(b.kind==='signalbeacon'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.2 && d<bd){ bd=d; best={type:'signalbeacon',o:b,label:(P.story&&P.story.tideCalm)?'Signal Ashwing to the Cloudreach':'A signal beacon'}; } }
    if(b.kind==='fastexit'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.4 && d<bd){ bd=d; best={type:'fastexit',o:b,label:'Climb out'}; } }
    if(b.kind==='skybird'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.6 && d<bd){ bd=d; best={type:'skybird',o:b,label: G.worldId==='skydungeon'?'Fly down':'Speak'}; } }
    if(b.kind==='skytile' && !(P.story&&P.story.skyG2)){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.7 && d<bd){ bd=d; best={type:'skytile',o:b,label:b.set?'Rune (lit)':'Tread rune'}; } }
    if(b.kind==='skyprism' && !(P.story&&P.story.skyG2)){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.8 && d<bd){ bd=d; best={type:'skyprism',o:b,label:'Rotate prism'}; } }
    if((b.kind==='chest'||b.kind==='chestOpen') && !(b.cache && !qs('ribbon2'))){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.9 && d<bd){ bd=d; best={type:'chest',o:b,label:'Open'}; } }
  }
  for(const pl of G.plots){
    const d=dist(P.x,P.y,pl.x+0.5,pl.y+0.5);
    if(d<1.5 && d<bd){
      let lbl = pl.stage===0? (has('seed',1)?'Plant':null) : pl.stage===4? 'Harvest' : null;
      if(lbl){ bd=d; best={type:'plot',o:pl,label:lbl}; }
    }
  }
  // the hot springs: a place to REST - full heal plus a warm yellow buffer.
  // Zone-based (no marker stone), so stand at the pool's edge and interact.
  if(ZONES.springs && G.worldId==='isle'){
    const d=dist(P.x,P.y,ZONES.springs.x,ZONES.springs.y);
    if(d<3.2 && d<bd){ bd=d; best={type:'springrest',label:(P.springCd>0)?'Rest ('+Math.ceil(P.springCd)+'s)':'Rest'}; }
  }
  return best;
}

function doInteract(){
  if(G.state!=='play') return;
  // a blocker / story card is up - the interact key just dismisses it (so keyboard
  // players can clear "it's locked" and friends without reaching for the mouse)
  const sov=document.getElementById('storyOv');
  if(sov && sov.style.display!=='none'){ const sb=document.getElementById('storyBtn'); if(sb) sb.click(); return; }
  if(G.paused) return;   // paused via the menu: interact does nothing
  if(G.interior){
    if(dlg.open){ closeDialog(); return; }
    const hs=interiorHotspot();
    const ex=G.interior.exit;
    const nearExit=ex && dist(P.x,P.y,ex.x,ex.y)<1.6;
    if(hs && (!nearExit || dist(P.x,P.y,hs.f.x,hs.f.y)<dist(P.x,P.y,ex.x,ex.y))){
      useHotspot(hs); return;
    }
    if(nearExit){ exitHouse(); return; }
    blockMsg('Nothing to use here. Step onto the <b>doorway</b> to head back outside.');
    return;
  }
  if(dlg.open){ closeDialog(); return; }
  const it=nearestInteract();
  if(!it){ noActionMsg(); return; }
  if(it.type==='lore'){ facePoint(it.o.x,it.o.y); readLore(it.key); return; }
  if(it.type==='well'){
    if(P.wellCd>0){ blockMsg('The well needs <b>'+Math.ceil(P.wellCd)+'s</b> to refill before you can drink again.'); return; }
    P.hp=P.maxhp; P.mp=P.maxmp; P.arrows=P.maxArrows||20; P.wellCd=90;
    addFloat('Fully restored',P.x,P.y-1.8,'#7fe07f',1.2);
    burst(P.x,P.y-0.6,'#9ecbe8',14,2.2); Snd.pickup(); refreshUI();
    return;
  }
  if(it.type==='springrest'){
    if(P.springCd>0){ blockMsg('The spring must gather its warmth again - <b>'+Math.ceil(P.springCd)+'s</b> before you can rest here anew.'); return; }
    P.hp=P.maxhp; P.arrows=P.maxArrows||20; P.overheal=10; P.springCd=45;
    addFloat('Rested - fully mended',P.x,P.y-1.8,'#7fe07f',1.2);
    addFloat('+10 warmth',P.x,P.y-2.5,'#f0d24a',1.25);   // the yellow bonus buffer
    burst(P.x,P.y-0.6,'#f0d24a',16,2.2); Snd.pickup(); refreshUI();
    return;
  }
  if(it.type==='shop'){ facePoint(it.o.x,it.o.y); openStallShop(it.o); return; }
  if(it.type==='door'){ facePoint(it.o.x,it.o.y); enterHouse(it.o); return; }
  if(it.type==='lair'){ facePoint(it.o.x,it.o.y); enterLair(); return; }
  if(it.type==='cave'){ facePoint(it.o.x,it.o.y); enterUndermaw(); return; }
  if(it.type==='undermawdungeon'){ facePoint(it.o.x,it.o.y); if(it.o.exit) exitUndermaw(); else enterUndermaw(); return; }
  if(it.type==='drowneddungeon'){ facePoint(it.o.x,it.o.y); if(it.o.exit) exitBarikDeep(); else enterBarikDeep(); return; }
  if(it.type==='gatedungeon'){ facePoint(it.o.x,it.o.y); useGateDungeon(it.o); return; }
  if(it.type==='dungeon'){ facePoint(it.o.x,it.o.y); if(it.o.exit) exitFrostDungeon(); else enterFrostDungeon(); return; }
  if(it.type==='emberdungeon'){ facePoint(it.o.x,it.o.y); if(it.o.exit) exitEmberDungeon(); else enterEmberDungeon(); return; }
  if(it.type==='milldungeon'){ facePoint(it.o.x,it.o.y); if(it.o.exit) exitMillDungeon(); else enterMillDungeon(); return; }
  if(it.type==='vaultdungeon'){ facePoint(it.o.x,it.o.y);
    if(it.o.exit){ exitFrostVault(); return; }
    if(!(P.story&&P.story.iceBearDown)){ blockMsg('The <b>Hoarfrost Bear</b>’s den, rank with old kills - and something vast still breathes in the dark of it. Drive the beast off before you go down.'); Snd.step&&Snd.step(5); return; }
    enterFrostVault(); return; }
  if(it.type==='lever'){ facePoint(it.o.x,it.o.y); pullIceLever(it.o); return; }
  if(it.type==='emberlever'){ facePoint(it.o.x,it.o.y); pullEmberLever(it.o); return; }
  if(it.type==='firelever'){ facePoint(it.o.x,it.o.y); pullFireLever(it.o); return; }
  if(it.type==='sluicelever'){ facePoint(it.o.x,it.o.y); pullSluiceLever(it.o); return; }
  if(it.type==='icebrazier'){ facePoint(it.o.x,it.o.y);
    if(it.o.lit){ G._flameT=(typeof FLAME_MAX!=='undefined'?FLAME_MAX:8); burst(P.x,P.y-1.2,'#ffce7a',10,1.8); Snd.pickup&&Snd.pickup();
      addFloat('torch lit',P.x,P.y-1.8,'#ffd07a',1.0); }
    else blockMsg('The brazier is crusted over with ice. Thaw it with a <b>lit torch</b> to wake its fire.');
    return; }
  if(it.type==='emberbutton'){ facePoint(it.o.x,it.o.y); pressEmberButton(it.o); return; }
  if(it.type==='staffgate'){ facePoint(it.o.x,it.o.y); dispelStaffGate(it.o); return; }
  if(it.type==='tomb'){ facePoint(it.o.x,it.o.y); if(it.o.up) exitReachDeep(); else enterReachDeep(); return; }
  if(it.type==='dragonrest'){ facePoint(it.o.x,it.o.y); if(typeof dragonLairSpeak==='function') dragonLairSpeak(); return; }
  if(it.type==='warp'){ facePoint(it.o.x,it.o.y); warpTo(it.o); return; }
  if(it.type==='aeriedeep'){ facePoint(it.o.x,it.o.y); if(it.o.up) exitAerieDungeon(); else enterAerieDungeon(); return; }
  if(it.type==='tome'){ facePoint(it.o.x,it.o.y); if(typeof destroyTome==='function') destroyTome(it.o); return; }
  if(it.type==='boat'){ facePoint(it.o.x,it.o.y); attemptSail(); return; }
  if(it.type==='ashwing'){ facePoint(it.o.x,it.o.y); if(it.o.sky) askSkyDragon(); else askAshwingHome(); return; }
  if(it.type==='signalbeacon'){ facePoint(it.o.x,it.o.y); if(typeof signalAshwing==='function') signalAshwing(it.o); return; }
  if(it.type==='fastexit'){ facePoint(it.o.x,it.o.y); if(typeof useFastExit==='function') useFastExit(); return; }
  if(it.type==='leap'){ facePoint(it.o.x,it.o.y); useLeapPoint(); return; }
  if(it.type==='skybird'){ facePoint(it.o.x,it.o.y); if(typeof skyBirdSpeak==='function') skyBirdSpeak(); return; }
  if(it.type==='skytile'){ facePoint(it.o.x,it.o.y); if(typeof pressSkyTile==='function') pressSkyTile(it.o); return; }
  if(it.type==='skyprism'){ facePoint(it.o.x,it.o.y); if(typeof rotateSkyPrism==='function') rotateSkyPrism(it.o); return; }
  if(it.type==='chest'){ facePoint(it.o.x,it.o.y); beginOpenChest(it.o); return; }
  if(it.type==='npc'){ facePoint(it.o.x,it.o.y); openDialog(it.o); return; }
  if(it.type==='cat'){
    if(qs('cat')==='active' && !P.petPip){
      P.petPip=true; G.cat.found=true; G.cat.following=true;
      burst(G.cat.x,G.cat.y-0.4,'#ffd76a',12); Snd.quest();
      toast('<b style="color:var(--ember)">Pip found!</b> He trots along behind you - back to Nia!');
      updateQuestUI();
    } else { addFloat('meow',G.cat.x,G.cat.y-1,'#ffd76a'); Snd.pickup(); }
    return;
  }
  if(it.type==='petcat'){ facePoint(it.o.x,it.o.y); addFloat('meow',it.o.x,it.o.y-1,'#ffd76a'); if(Snd.pickup)Snd.pickup(); return; }
  if(it.type==='node') hitNode(it.o);
  if(it.type==='plot') usePlot(it.o);
}
const BUILDING_KINDS={house:1,house2:1,igloo:1,forge:1,barn:1,tower:1,castle:1,hut:1,resort:1,windmill:1,waterwheel:1};
// The interact button found nothing in reach. Rather than fail silently, word the
// blocker in-world - if a building is close by, the player almost certainly meant
// its door, so point them at it; otherwise a plain "nothing here" line.
function noActionMsg(){
  /* Pressing E / the interact button with nothing in reach is now silent - no
     "there's nothing here to use" (or "step up to the door") nag popup at all. */
}
function facePoint(x,y){ const dx=x-P.x, dy=y-P.y, l=Math.hypot(dx,dy)||1; P.dir={x:dx/l,y:dy/l}; }
function warpTo(b){ // step through a tunnel to its far end (same world), with a fade
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8); P.click=null;
  setTimeout(()=>{ P.x=b.tx; P.y=b.ty; P.moving=false;
    G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
    setTimeout(()=>{ if(fd) fd.style.opacity=0; },130); }, 260);
}

/* ---- gathering ---- */
// Gathering is Bram's craft to grant: no chopping wood or mining stone until you've been
// to the forge and spoken with Bram the Smith. Old saves are grandfathered generously so
// no returning player is suddenly locked out (met him, holds a weapon, or off Emberwick).
function hasMetBram(){
  if(P.story && P.story.bramMet) return true;
  if(P.kit || qs('kit')==='done' || qs('kit')==='active') return true;
  if(P.unlocked && (P.unlocked.melee || P.unlocked.bow)) return true;
  if(typeof G!=='undefined' && G.worldId && G.worldId!=='isle') return true;
  return false;
}
function hitNode(n){
  facePoint(n.x,n.y);
  // hold gathering behind the smith - hack a tree or a rock before seeing Bram and you're
  // told to go find him first (a soft nag, throttled so it doesn't spam every swing).
  if((n.kind==='tree' || n.kind==='rock') && !hasMetBram()){
    if(!P._bramNagT || G.time>P._bramNagT){ P._bramNagT=G.time+3;
      toastErr('You\'ve nothing to work it with yet - see <b>Bram the Smith</b> at the forge first.',3600); }
    P.click=null; return;
  }
  // GATED MATERIAL: ironwood pines / basalt stone bounce your current tool until
  // you carry the right tier (a dungeon-forged Rivenedge Axe / Cragbreaker Pick).
  // gateBlocked() shows the "your tool barely marks it" feedback itself.
  if((n.kind==='tree'||n.kind==='rock') && n.gate && typeof gateBlocked==='function' && gateBlocked(n)){ P.click=null; return; }
  if(n.kind==='tree' || n.kind==='rock'){
    // No proper tool - bare hands, or just a sword? You can still hack at it, but it's
    // stupid weak (see the power formula below): a slow chip that takes many times as
    // long. A real axe/pick from Bram's forge fells wood and stone far faster.
    if(!P.kit) hintOnce('needtool', n.kind==='tree'
      ? 'You hack at the trunk with what you have - it barely marks. A proper <b>axe</b> from <b>Bram</b>\'s forge would make short work of it.'
      : 'You scrape at the stone with what you have - it barely chips. A proper <b>pick</b> from <b>Bram</b>\'s forge would split it far faster.');
    P.gatherT=0.32; P.gatherKind = n.kind==='tree'? 'axe':'pick';   // a touch quicker swing cadence - wood & stone come in a little faster
    P.swing=Math.max(P.swing||0, 0.26);
  }
  if(n.kind==='fish'){ fishAction(n); return; }
  if(n.kind==='mushroom'){
    n.dead=true; n.respawn=38; invalidateScenery();
    give('mushroom',1); addXP('farming',6); burst(n.x,n.y-0.3,'#7fb4e8',8);
    return;
  }
  if(n.kind==='apple'){
    n.hp-=1; n.shake=0.2; P.swing=0.28; P.anim+=0.5; Snd.chop();
    burst(n.x,n.y-1.6,'#c9385a',5,1.6);
    if(n.hp<=0){
      n.dead=true; n.respawn=rnd(30,45); invalidateScenery();
      give('apple',2+(P.skills.farming.lvl>=3?1:0)); addXP('farming',10);
      addFloat('+apples',n.x,n.y-2,'#e0708a',1.05);
    }
    return;
  }
  if(n.kind==='shell'){
    n.dead=true; n.respawn=rnd(45,70); invalidateScenery();
    give('shell',1); burst(n.x,n.y-0.2,'#eaf4f8',7,1.4); Snd.pickup();
    return;
  }
  const isTree=n.kind==='tree';
  P.swing=0.28; P.anim+=0.5;
  // Woodcutting & mining no longer level - chop/mine speed is fixed for the whole game,
  // set entirely by the tool. A basic iron axe/pick (tier 1) fells a tree or stone in a
  // handful of swings; a dungeon-forged one (tier 2) bites far deeper. With no proper tool
  // at all - bare hands, or a sword - it's stupid weak: a slow chip many times as long.
  const tier = isTree ? (P.tools.axe||0) : (P.tools.pick||0);
  const power = tier>=4 ? 9 : tier>=3 ? 7 : tier>=2 ? 5 : tier>=1 ? 2 : 0.34;
  n.hp-=power;
  if(isTree){ Snd.chop(); burst(n.x,n.y-1.2,'#4f9457',5,1.6); n.shake=0.22; }
  else { Snd.mine(); burst(n.x,n.y-0.5,'#c9ced6',5,1.6); n.shake=0.18; }
  if(n.hp<=0){
    // a gated barrier (ironwood/basalt) falls for good - it never regrows, and the
    // way it sealed stays open. clearGateNode() handles the drop + the "way opens" beat.
    if(n.gate){ if(typeof clearGateNode==='function') clearGateNode(n); else { n.dead=true; n.gone=true; setSolid(n.tx,n.ty,0); invalidateScenery(); } return; }
    n.dead=true; n.respawn= isTree? rnd(20,30) : rnd(26,38); invalidateScenery();
    hintOnce('regrow','The island <b>regrows</b> - felled pines and broken stone return in under a minute.');
    setSolid(n.tx,n.ty,0);
    if(isTree){
      const amt=2+(P.tools.axe>=2?2:0); give('wood',Math.min(amt,4));
      if(n.palm && Math.random()<0.35){ give('coconut',1); addFloat('+1 coconut',n.x,n.y-1.6,'#e8d8a8',1.0); }
      const windfall=Math.random();
      if(windfall<0.16){ give('apple',1); addFloat('+1 apple',n.x,n.y-1.6,'#e0708a',1.0); }
      else if(windfall<0.24){ give('mushroom',1); addFloat('+1 mushroom',n.x,n.y-1.6,'#d8b0c8',1.0); }
      if(n.big && Math.random() < 0.45 + P.tools.axe*0.3){
        give('hardwood',1); addFloat('+1 hardwood',n.x,n.y-2.2,'#c9a24e',1.1);
        hintOnce('hardwood','<b>Hardwood!</b> Old forest pines hide dense heartwood - Bram forges tools and steel with it.');
      }
    } else {
      const amt=1+(P.tools.pick>=2?1:0); give('stone',Math.min(amt,3));
      if(Math.random() < 0.22 + P.tools.pick*0.3){
        give('ore',1); addFloat('+1 iron ore',n.x,n.y-2,'#c9ced6',1.1);
        hintOnce('ore','<b>Iron ore!</b> The isle\'s smiths and shipwrights are always wanting it - Captain Brant needs it for the Tidewalker\'s fittings.');
      }
      const nearVein = (ZONES.ruins && dist(n.x,n.y,ZONES.ruins.x,ZONES.ruins.y)<13) ||
        (ZONES.highlands && dist(n.x,n.y,ZONES.highlands.x,ZONES.highlands.y)<13) ||
        (ZONES.volcano && dist(n.x,n.y,ZONES.volcano.x,ZONES.volcano.y)<ZONES.volcano.r) ||
        tileAt(Math.floor(n.x),Math.floor(n.y))===T.RUIN; // ember crystals vein the volcano rock
      if(nearVein && Math.random()<0.16){
        give('crystal',1); addFloat('+1 ember crystal',n.x,n.y-2.4,'#ff9a3c',1.15);
        burst(n.x,n.y-0.6,'#ff9a3c',10,2);
        hintOnce('crystal','<b>An ember crystal!</b> They vein the old stone near ruins. Sage Orin brews tonics from them.');
      }
    }
  }
}
function fishAction(n){
  if(!P.fishing){
    P.fishing={node:n, t:0, biteAt:rnd(1.2,3), bit:false, bitT:0};
    addFloat('cast…',P.x,P.y-1.4,'#9ecbe8'); Snd.splash();
    hintOnce('fish','Wait for the <b style="color:var(--ember)">!</b> then press the button again to strike!');
    return;
  }
  if(P.fishing.bit){
    const big = P.skills.fishing.lvl>=3 && Math.random()<0.4;
    give('fish', (big?2:1) + (P.projects.crane?1:0)); addXP('fishing',12);
    burst(n.x,n.y-0.4,'#9ecbe8',10); Snd.pickup();
    if(big) addFloat('Big catch!',P.x,P.y-2,'#ffd76a',1.3);
    if(Math.random() < 0.06 + P.skills.fishing.lvl*0.015){
      give('pearl',1); addFloat('A PEARL!',P.x,P.y-2.4,'#eaf4f8',1.4);
      shockwave(n.x,n.y,'rgba(230,244,248,0.9)',30); Snd.levelup();
      hintOnce('pearl','A <b>pearl</b>! Elder Maren pays 25 gold for these beauties.');
    }
    P.fishing=null;
  } else {
    addFloat('too soon…',P.x,P.y-1.4,'#c9b990'); P.fishing=null; Snd.splash();
  }
}
function usePlot(pl){
  if(pl.stage===0 && has('seed',1)){
    take('seed',1); pl.stage=1; pl.t=0;
    burst(pl.x+0.5,pl.y+0.3,'#7a5230',6,1.4); Snd.chop();
    addFloat('planted',pl.x+0.5,pl.y-0.4,'#9be07f');
  } else if(pl.stage===4){
    pl.stage=0; pl.t=0;
    const amt = 1 + (Math.random()<P.skills.farming.lvl*0.15 ? 1:0);
    give('wheat',amt); addXP('farming',10);
    if(qs('harvest')==='active'){ P.prog.harvest=(P.prog.harvest||0)+1; updateQuestUI(); }
    burst(pl.x+0.5,pl.y,'#ffd76a',8);
  }
}

/* ---- combat ---- */
function tryAttack(useMouse){
  if(P.atkCd>0 || G.state!=='play' || dlg.open || G.interior || (P.stunT||0)>0) return;
  if(!P.unlocked[P.weapon==='melee'?'melee':P.weapon]){
    P._noWpnT=P._noWpnT||0;
    if(G.time>P._noWpnT){ P._noWpnT=G.time+2.5;
      blockMsg('Bare hands won\'t do - <b>Bram\'s forge</b> can arm you. (Quest: <b>Iron in the Fire</b>)'); }
    return;
  }
  // if a gatherable is closer than any mob and we're in melee, gather instead (mobile friendliness)
  const it=nearestInteract();
  if(it && it.type==='node' && it.o.kind!=='fish'){
    const mobNear = G.mobs.some(m=>!m.dead && dist(P.x,P.y,m.x,m.y)<1.8);
    if(!mobNear){ hitNode(it.o); P.atkCd=0.38; return; }
  }
  // aim
  let aim;
  if(useMouse && !isTouch){
    const w=screenToWorld(input.mx,input.my);
    aim={x:w.x-P.x, y:w.y-P.y};
  } else {
    let bm=null, bd=7;
    for(const m of G.mobs){ if(m.dead||m.sealed) continue; const d=dist(P.x,P.y,m.x,m.y); if(d<bd){bd=d;bm=m;} }
    aim = bm? {x:bm.x-P.x,y:bm.y-P.y} : {...P.dir};
  }
  // Rask's drill tests TIMING, not aim: a swing always turns to meet the billet in
  // flight, so the student only has to get the moment right (parry needs a front-facing
  // guard - see parryCovers).
  if(P.parryDrill && P.parryDrill.proj && !P.parryDrill.proj.parried){
    const pj=P.parryDrill.proj; aim={x:pj.x-P.x, y:pj.y-P.y};
  }
  const l=Math.hypot(aim.x,aim.y)||1; aim.x/=l; aim.y/=l;
  P.dir={...aim};
  P.lastCombat=G.time;
  if(P.weapon==='melee'){
    // no room to swing a blade from the saddle - dismount to fight with the sword. The
    // bow is fine from horseback (this guard is melee-only), so a mounted rider can still
    // loose arrows but can't sword-fight while riding Kiko or Chestnut.
    if(P.riding){
      P._rideSwordT=P._rideSwordT||0;
      if(G.time>P._rideSwordT){ P._rideSwordT=G.time+2.5;
        blockMsg('No room to swing a sword from the saddle - <b>dismount</b> to fight with the blade. (Arrows loose fine from horseback.)'); }
      P.atkCd=0.25; P.combo=0;
      return;
    }
    P.atkCd=0.42; P.swing=0.3; Snd.hit();
    // PARRY is a matter of TIMING now: a swing opens a brief guard window, so a blow
    // or arrow that lands in that window (from the front) is turned aside. Strike as
    // the enemy's blow arrives to parry it. (Also active during Rask's drill.)
    if((P.unlocked&&P.unlocked.parry) || P.parryDrill){ P.parryT=PARRY_WIN; P.parryMax=PARRY_WIN; }   // swing on the WHITE flash to turn the blow
    const finisher=(P.combo||0)>=2;
    const dmgBase= finisher? Math.round(meleeDmg()*1.5) : meleeDmg();
    // Cleaver perk (melee L5): the finisher sweeps a wide, deep arc instead of a lunge
    const cleave = finisher && P.perks && P.perks.cleaver;
    let hitAny=false;
    for(const m of G.mobs){
      if(m.dead||m.sealed) continue;
      const dx=m.x-P.x, dy=m.y-P.y, d=Math.hypot(dx,dy);
      const reach = finisher? (cleave?2.7:2.1) : 1.65; // the finisher lunges; cleaver reaches further
      const arc = cleave? -0.15 : 0.15;                // cleaver widens the arc past 90 degrees
      if(d<reach && (dx*aim.x+dy*aim.y)/Math.max(d,0.01) > arc){
        damageMob(m, dmgBase, aim, 'melee'); hitAny=true;
      }
    }
    if(hitAny){
      G.shake=Math.max(G.shake,0.12);
      P.comboT=1.4;
      if(finisher){
        P.combo=0; P.atkCd=0.6;
        G.shake=Math.max(G.shake,0.3); G.hitStop=Math.max(G.hitStop,0.1);
        shockwave(P.x+aim.x,P.y+aim.y,'rgba(255,235,200,0.9)',44);
        Snd.noise(0.2,0.06,900,1);
        addFloat('FINISHER!',P.x,P.y-2.2,'#ffd76a',1.5);
      } else {
        P.combo=(P.combo||0)+1;
        if(P.combo===2) addFloat('COMBO x2',P.x,P.y-2,'#ffce7a',1.1);
      }
    } else { P.combo=0; }
  } else if(P.weapon==='bow'){
    // the quiver: a spent bow can't loose. Shafts trickle back over time (see updatePlayer)
    if((P.arrows||0) < 1){ toastErr('<b>Your quiver is empty.</b> Arrows return as you catch your breath - or wade in with the sword.'); P.atkCd=0.28; return; }
    P.arrows=Math.max(0,(P.arrows||0)-1);
    // Quickdraw perk (archery L5): markedly faster nocking
    P.atkCd=(P.perks&&P.perks.quickdraw)?0.43:0.62; P.swing=0.2; Snd.bow();
    const arrow={kind:'arrow',x:P.x,y:P.y-0.4,vx:aim.x*13,vy:aim.y*13,life:1.1,dmg:bowDmg(),from:'player',skill:'archery'};
    if(P.spells && P.spells.flamesnare){ arrow.snare=1.6; arrow.flame=1; }   // the Ashen Forge gift: fire-fletched arrows root what they strike
    G.projs.push(arrow);
    refreshUI();
  } else if(P.weapon==='staff'){
    if(P.mp<8){ toastErr('Not enough mana - it returns as you breathe.'); P.atkCd=0.3; return; }
    P.mp-=8; P.atkCd=0.7; P.swing=0.3; Snd.magic();
    if(TRAIN && TRAIN.who==='aelin') TRAIN.casts=(TRAIN.casts||0)+1;   // Aelin's drill counts staff casts
    // Emberburst perk (magic L5): bigger splash. Overcharge perk: the bolt strikes twice as hard.
    const eb=P.perks&&P.perks.emberburst, oc=P.perks&&P.perks.frostbolt;
    const bolt={kind:'bolt',x:P.x,y:P.y-0.5,vx:aim.x*10,vy:aim.y*10,life:1.4,dmg:oc?magicDmg()*2:magicDmg(),from:'player',skill:'magic',aoe:eb?1.9:1.2};
    if(P.spells && P.spells.flamesnare){ bolt.snare=1.6; bolt.flame=1; }   // Sunward's Emberdeep gift: bolts root a foe in a snare of fire
    G.projs.push(bolt);
    refreshUI();
  }
}
function xpForP(l){ return 70+55*l; }
function gainLXP(n){
  P.xpL+=n;
  addFloat('+'+n+' XP', P.x, P.y-2.6, '#c9b0ff');
  while(P.xpL>=xpForP(P.level) && P.level<20){
    P.xpL-=xpForP(P.level); P.level++;
    P.maxhp+=6; P.maxmp+=2; P.hp=P.maxhp; P.mp=P.maxmp; P.arrows=P.maxArrows||20;   // level-up tops the quiver too
    burst(P.x,P.y-0.5,'#c9b0ff',20); Snd.levelup();
    shockwave(P.x,P.y,'rgba(201,176,255,0.9)',46);
    banner('LEVEL '+P.level, 'Barik takes your measure - and steps back.');
    P.cheerT=3;
  }
  refreshUI();
}
/* Dash (the dodge-roll) is now a TRAINED ability, taught by a mage-tower's scrying
   orb. This grants it once and announces it. Grandfathered generously on load so
   no returning player ever loses their footwork. */
function unlockDash(msg){
  P.unlocked=P.unlocked||{};
  if(P.unlocked.dash) return;
  P.unlocked.dash=true;
  if(typeof updateMountBtn==='function') updateMountBtn();
  Snd.quest&&Snd.quest();
  const dashMsg = msg || '<b style="color:#c9b0ff">Dash learned!</b> '+((typeof isTouch!=='undefined'&&isTouch)?'Tap the dodge button':'Press Ctrl or L')+' to dart aside - a breath of speed and no damage taken mid-dash.';
  // a click-to-dismiss popup (not a passing toast) so the lesson can't be missed
  const showDashCard=()=>{ if(typeof storyCard==='function') storyCard(dashMsg, {label:'OK'}); else toast(dashMsg, 4600); };
  // If the dash is granted mid-dialogue (Orin's quest turn-in), hold this card until the
  // player has clicked "Continue" through Orin's own line - then it pops (see buildDialogContent).
  if(typeof dlg!=='undefined' && dlg.open){ P._dashCardPending=showDashCard; }
  else showDashCard();
}
/* PARRY - a TRAINED, timed defence taught by the isle's blade-master (Rask). A
   brief braced stance: any blow or shot that lands from the front while it holds
   is turned aside - melee attackers are staggered, and arrows/bolts are batted
   back the way they came. It is the sword's answer to a ranged or telegraphed
   attack, where the dash is the answer to an unavoidable one. */
// The parry timing window. A foe's wind-up ends with its blow landing; for the LAST
// PARRY_WIN seconds of that wind-up the tell flares WHITE - that white flash is the
// parry moment. A swing opens a guard of exactly this length, so swinging on the
// white flash (a hair early or late is fine) turns the blow; swinging during the
// earlier red build-up is too early - the guard lapses before the strike lands.
const PARRY_WIN = 0.32;
function unlockParry(msg){
  P.unlocked=P.unlocked||{};
  if(P.unlocked.parry) return;
  P.unlocked.parry=true;
  Snd.quest&&Snd.quest();
  const parryMsg = msg || '<b style="color:#ffe08a">Parry learned!</b> No separate button - it\'s all <b>timing</b>. Against a <b>melee</b> foe, a red <b style="color:#ff5a4a">!</b> builds as it winds up, then flares <b style="color:#fff">WHITE</b> - <b>attack on that white flash</b> to turn the blow and leave the striker staggered wide open. You can parry a <b>thrown shot</b> just as well - an arrow, a bone, a bomb: it <b style="color:#fff">flares WHITE</b> as it closes on you, so <b>time your swing to the incoming shot</b> and you\'ll bat it <b>right back at whoever threw it</b>. (A hair early or late is fine - just don\'t swing during a melee foe\'s red build-up.)';
  if(typeof storyCard==='function') storyCard(parryMsg, {label:'OK'});
  else toast(parryMsg, 5200);
  if(typeof questReadySweep==='function') questReadySweep();
  if(typeof updateQuestUI==='function') updateQuestUI();
  if(typeof autoSave==='function') autoSave();
}
// Is (sx,sy) inside the arc the raised guard covers - i.e. roughly in front of
// the way the player faces? Used to decide whether a blow can be parried.
function parryCovers(sx,sy){
  const dx=sx-P.x, dy=sy-P.y, l=Math.hypot(dx,dy)||1;
  return (P.dir.x*dx + P.dir.y*dy)/l > 0.15;   // ~±80 degrees of front
}
// A blow/shot was turned: the flash, the sound, and the little window of
// follow-up grace. Returns true so callers can early-out of taking damage.
function onParry(sx,sy){
  P.parrySuccess=0.22; P.parryT=Math.min(P.parryT||0,0.06);   // the guard is spent on a clean parry
  P.lastCombat=G.time;
  const mx=(P.x+sx)/2, my=(P.y+sy)/2;
  addFloat('PARRY!', P.x, P.y-2.1, '#ffe08a', 1.3);
  shockwave(mx,my,'rgba(255,235,170,0.95)',30); burst(mx,my-0.3,'#fff2c0',14,2.6);
  G.hitStop=Math.max(G.hitStop||0,0.07); G.shake=Math.max(G.shake||0,0.18);
  Snd.crit&&Snd.crit(); buzz(14);
  return true;
}
/* Rask's parry lesson - a hands-on DRILL, not a lecture. He PITCHES a practice billet
   (a length of wood) at you; watch it close, and ATTACK as it reaches you to turn it
   back. Land 3 clean parries and the guard is yours. A billet that gets past your
   swing just thumps you for 1 hp. Timed-attack parry is enabled for the drill even
   before it's formally learned (see tryAttack). */
function beginParryDrill(){
  const rask=G.npcs&&G.npcs.find(n=>n.id==='rask'); if(!rask) return;
  if(qs('bladeoath')!=='active'){ P.quests.bladeoath='active'; P.prog.bladeoath=0; }
  // step the student back a few paces so Rask's billet has room to fly - you want to SEE it
  // cross the gap and read the timing, not have it in your face the instant he lets go.
  { const dx=P.x-rask.x, dy=P.y-rask.y, l=Math.hypot(dx,dy)||1;
    if(l<5.5 && typeof findOpenNear==='function'){
      const s=findOpenNear(Math.round(rask.x+dx/l*5.5), Math.round(rask.y+dy/l*5.5), 4);
      if(s){ P.x=s[0]+0.5; P.y=s[1]+0.5; P.click=null; P.moving=false; } }
    if(typeof facePoint==='function') facePoint(rask.x,rask.y); }
  P.parryDrill={count:0, need:3, phase:'rest', t:1.0, proj:null};
  rask.drillWarn=0;
  if(typeof banner==='function') banner('THE TURNING','Parry Rask\'s billet - three times');
  toast('Rask <b>pitches a wooden billet</b> at you: watch it close, and <b>attack as it reaches you</b> ('+((typeof isTouch!=='undefined'&&isTouch)?'tap ⚔':'Space / click')+') to turn it back. A white ring flares on the billet at the moment to swing. <b>Parry 3.</b>',7000);
}
// Rask hurls a practice billet at the student. It's a normal enemy projectile, so the
// existing shot-parry (updateProjs) turns it back and the shot-tell (drawProj) flares
// its white ring - the drill just watches whether the billet gets parried or lands.
function throwPracticeBillet(rask,D){
  const dx=P.x-rask.x, dy=(P.y-0.3)-(rask.y-0.3), l=Math.hypot(dx,dy)||1;
  const sp=4.8;   // a gentle lob - the billet is visible its whole flight, so timing reads fair
  const pr={ x:rask.x, y:rask.y-0.3, vx:dx/l*sp, vy:dy/l*sp, life:l/sp+1.0,
             kind:'woodblock', from:'rask', owner:rask, dmg:1, skill:'melee' };
  G.projs.push(pr);
  D.proj=pr; D.phase='watch';
  rask.swing=0.3;                                   // a short pitching motion
  { const l2=Math.hypot(dx,dy)||1; rask.face={x:dx/l2, y:dy/l2}; }
  Snd.tone&&Snd.tone(430,0.06,'square',0.03,180);   // the release
}
function updateParryDrill(dt){
  const D=P.parryDrill; if(!D) return;
  const rask=G.npcs&&G.npcs.find(n=>n.id==='rask');
  if(!rask || P.dead || G.interior){ if(rask){ rask.drillWarn=0; } P.parryDrill=null; return; }
  // Rask keeps his eyes on the student, and his pitching motion plays out (decays)
  { const dx=P.x-rask.x, dy=P.y-rask.y, l=Math.hypot(dx,dy)||1; rask.face={x:dx/l,y:dy/l}; }
  if((rask.swing||0)>0) rask.swing=Math.max(0,(rask.swing||0)-dt);
  D.t-=dt;
  if(D.phase==='rest'){
    if(D.t<=0) throwPracticeBillet(rask,D);
  } else if(D.phase==='watch'){
    const p=D.proj;
    if(p && p.parried){                          // turned it back with a timed swing
      D.count++;
      addFloat('PARRY  '+D.count+' / '+D.need, P.x, P.y-2.7, '#ffe08a', 1.45);
      D.proj=null;
      if(D.count>=D.need){ finishParryDrill(); return; }
      D.phase='rest'; D.t=rnd(0.7,1.1);
    } else if(!p || p.life<=0){                   // it thumped you (1 hp) or fell short - try again
      addFloat('watch the billet - swing as it reaches you', P.x, P.y-2.3, '#ffd0a0', 1.05);
      D.proj=null; D.phase='rest'; D.t=rnd(0.75,1.15);
    }
  }
}
function finishParryDrill(){
  const rask=G.npcs&&G.npcs.find(n=>n.id==='rask'); if(rask){ rask.drillWarn=0; rask.swing=0; }
  P.parryDrill=null;
  // The guard is learned - but no "Parry learned!" skill card. Set it silently, then let
  // Rask close the lesson himself, in character (his line still teaches the timing).
  P.unlocked=P.unlocked||{}; P.unlocked.parry=true;
  Snd.quest&&Snd.quest();
  if(qs('bladeoath')==='active' && questReady('bladeoath')) completeQuest('bladeoath');
  if(typeof questReadySweep==='function') questReadySweep();
  if(typeof updateQuestUI==='function') updateQuestUI();
  if(typeof autoSave==='function') autoSave();
  if(rask && typeof setDialog==='function'){
    // open Rask's dialog panel directly (skipping buildDialogContent) so his "nice work"
    // line shows instead of his normal chatter.
    P.click=null;
    { const dl=Math.hypot(P.x-rask.x,P.y-rask.y)||1; rask.face={x:(P.x-rask.x)/dl, y:(P.y-rask.y)/dl}; }
    dlg.open=true; dlg.npc=rask;
    document.getElementById('dialog').style.display='block';
    document.getElementById('dname').textContent = (typeof npcDisplayName==='function')? npcDisplayName(rask) : rask.name;
    if(typeof drawPortrait==='function') drawPortrait(rask);
    setDialog('<i>Rask lowers his billet and gives a short, satisfied nod.</i> “Nice work - that\'s the turning. No button to it, just the eye and the timing: when a foe winds up, watch for the white flash and swing on it. You\'ll knock the blow aside and leave the striker wide open. A thrown shot\'s the same - time your swing and you\'ll bat it right back the way it came.”',
      [{label:'Got it', ghost:true, fn:closeDialog}]);
  }
}
function drawMobBars(m,s){
  if(m.hp<m.maxhp){
    const w=m.bigBoss?54:26, top= m.kind==='scorpion'? -30 : m.kind==='dragon'? -100 : -52;
    cx.fillStyle='rgba(0,0,0,0.6)'; cx.fillRect(s.x-w/2,s.y+top,w,4);
    cx.fillStyle='#e05648'; cx.fillRect(s.x-w/2,s.y+top,w*clamp(m.hp/m.maxhp,0,1),4);
  }
  if(!m.dead && dist(P.x,P.y,m.x,m.y)<8){
    const dl=(m.lvl||1)-(P.level||1);
    cx.font='bold 9px "Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif'; cx.textAlign='center';
    cx.fillStyle= dl>=3?'#ff6a5a': dl>=1?'#ffd76a': dl<=-3?'#8a94a0':'#e8e0d0';
    const top2= m.kind==='scorpion'? -36 : m.kind==='dragon'? -128 : m.boss?-102: -58;
    cx.strokeStyle='rgba(0,0,0,0.7)'; cx.lineWidth=2.6;
    cx.strokeText('Lv '+(m.lvl||1), s.x, s.y+top2);
    cx.fillText('Lv '+(m.lvl||1), s.x, s.y+top2);
  }
  // PARRY TELL, in two stages: a red ! BUILDS through the early wind-up (get ready),
  // then flares WHITE for the last PARRY_WIN seconds - THAT white flash is the moment
  // to swing and turn the blow. Reads at a glance so the timing is legible.
  // Night-wraiths strike WITHOUT a tell - no red/white ! builds over them (their blow
  // can't be parried either; see hurtPlayer). They're read by their lunge and closing, not a cue.
  if(!m.dead && (m.windup||0)>0 && m.kind!=='wraith' && dist(P.x,P.y,m.x,m.y)<11){
    const top3= m.bigBoss? -108 : m.kind==='dragon'? -134 : m.kind==='scorpion'? -42 : -66;
    const flash = (m.windup||0) <= (typeof PARRY_WIN!=='undefined'?PARRY_WIN:0.32);
    cx.save(); cx.textAlign='center';
    if(flash){
      // the strike moment: a big, bright WHITE ! + a quick expanding ring shouting NOW
      const p=0.85+0.15*Math.sin(G.time*40);
      cx.globalAlpha=1; cx.font='bold 30px "Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif';
      cx.strokeStyle='rgba(0,0,0,0.85)'; cx.lineWidth=5.5;
      cx.strokeText('!', s.x, s.y+top3);
      cx.fillStyle='rgba(255,255,255,'+p.toFixed(2)+')'; cx.fillText('!', s.x, s.y+top3);
      const rr=6+18*(1-Math.max(0,m.windup)/(typeof PARRY_WIN!=='undefined'?PARRY_WIN:0.32));
      cx.globalAlpha=0.5; cx.strokeStyle='#fff6c8'; cx.lineWidth=2.5;
      cx.beginPath(); cx.arc(s.x, s.y+top3-8, rr, 0, TAU); cx.stroke();
    } else {
      // the build-up: a red ! that grows as the flash nears
      const grow = 1 - Math.min(1, (m.windup - PARRY_WIN)/0.34);   // 0 early -> ~1 just before the flash
      cx.globalAlpha=0.55+0.3*Math.sin(G.time*13);
      cx.font='bold '+Math.round(15+9*grow)+'px "Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif';
      cx.strokeStyle='rgba(0,0,0,0.8)'; cx.lineWidth=3.5;
      cx.strokeText('!', s.x, s.y+top3); cx.fillStyle='#ff7a4a'; cx.fillText('!', s.x, s.y+top3);
    }
    cx.restore();
  }
}
function damageMob(m,dmg,knock,skill){
  if(m.fainted) return; // a felled, freed dragon takes no more harm
  if(m.introKind){ if(Math.random()<0.4) addFloat('!',m.x,m.y-2.1,'#e8dcff'); return; } // untouchable mid-entrance
  if(m.invuln){
    m.hurtT=0.12;
    // the cloud-snatcher can't be cut - but a solid melee blow rattles it: it's stunned
    // (frozen, can't grab) for a beat and shoved back, so you can fend it off and slip past.
    if(m.grabber && skill==='melee'){
      m.stunT=Math.max(m.stunT||0, 0.9); m.windup=0;
      if(knock) moveEntity(m, knock.x*0.7, knock.y*0.7);
      burst(m.x,m.y-0.3,'#bfe8ff',10,2.4); if(Snd.hit) Snd.hit();
      addFloat('STUNNED', m.x, m.y-2.4, '#bfe8ff', 1.1);
    } else if(Math.random()<0.5) addFloat('!',m.x,m.y-2.1,'#bfe8ff');
    return;
  }
  // THE STORM-EYE answers only to the bow - blade and staff-bolt scatter off it. (Its shield
  // still gates WHEN even an arrow can land: only while it's discharged, above.)
  if(m.stormeye && skill!=='archery'){
    m.hurtT=0.1;
    if(Math.random()<0.35) addFloat('BOW ONLY', m.x, m.y-2.2, '#bfe8ff');
    if(!P._eyeBowHint){ P._eyeBowHint=1;
      toast('Blade and bolt scatter off the Storm-Eye - <b style="color:#bfe8ff">only your bow can strike it</b>. Wait for it to DISCHARGE, then loose an arrow.',5600); }
    return;
  }
  if(skill==='archery' && (m.kind==='skeleton'||m.kind==='archer'||m.kind==='gravelord'||m.kind==='boss')){
    dmg=Math.round(dmg*1.75);
    addFloat('WEAK!', m.x, m.y-2.1, '#ffd76a');
    if(!P._boneHint){ P._boneHint=1;
      toast('Old bones splinter - <b style="color:#ffd76a">arrows deal heavy bonus damage to skeletons!</b>',5000); }
  }
  let crit=false;
  // Deadeye perk (archery L5): sharply higher crit chance with the bow
  const critCh = 0.12 + ((skill==='archery' && P.perks && P.perks.deadeye)?0.18:0);
  if(Math.random()<critCh){ dmg=Math.round(dmg*1.6); crit=true; }
  // RIPOSTE: a perfectly-timed dodge (see tryRoll) empowers the very next blow that lands -
  // a guaranteed, heavy crit. Consumed on use, so it rewards reading the telegraph.
  if(P.empower){ dmg=Math.round(dmg*1.8); crit=true; P.empower=0; P.empowerT=0;
    addFloat('RIPOSTE!', m.x, m.y-2.7, '#bfe8ff', 1.5); if(Snd.crit) Snd.crit();
    shockwave(m.x,m.y,'rgba(191,232,255,0.9)',30); G.hitStop=Math.max(G.hitStop,0.1); }
  // Executioner perk (melee L5): heavy bonus versus badly-wounded foes
  if(skill==='melee' && P.perks && P.perks.executioner && m.maxhp && m.hp/m.maxhp < 0.30) dmg=Math.round(dmg*1.5);
  const lvdiff=Math.max(0,(m.lvl||1)-(P.level||1));
  dmg=Math.max(1,Math.round(dmg*Math.max(0.5,1-0.07*lvdiff))); // high-level foes shrug (softened - the old 0.35/0.09 floor turned late bosses into 25-hit slogs)
  // big setpiece fights (any 300+ HP boss) yield to a determined blade - a targeted
  // boss-damage bonus that leaves trash-mob tuning untouched. Keeps marquee fights
  // decisive instead of attrition sponges. TUNE: softened from 1.3 as part of the
  // late-game difficulty pass (dmgLvl's diminishing returns already keep bosses
  // from melting, so this bonus no longer needs to carry as much). Lower toward
  // 1.0 to make bosses tankier, raise it if they start to feel like slogs.
  const BOSS_DMG_MULT = 1.2;
  if((m.maxhp||0)>=300) dmg=Math.round(dmg*BOSS_DMG_MULT);
  // Backstab: a melee blow from behind bites half again as deep. Marquee bosses
  // (bigBoss) wheel to face you and are immune. Taught in Rook's yard drill.
  let backstab=false;
  if(skill==='melee' && m.face && !m.bigBoss){
    const bx=P.x-m.x, by=P.y-m.y, bl=Math.hypot(bx,by)||1;
    if((m.face.x*bx+m.face.y*by)/bl < -0.3){
      dmg=Math.round(dmg*1.5); backstab=true;
      if(TRAIN && TRAIN.who==='rook') TRAIN.backstabs=(TRAIN.backstabs||0)+1;
    }
  }
  m.hp-=dmg; m.hurtT=0.18; m.state='chase'; m.noAggroT=0;
  // POISE / STAGGER: sustained blows break a foe's footing for a brief opening. Marquee
  // bosses and scripted-AI foes keep their footing (their phases drive the fight instead).
  if(!m.boss && !m.bigBoss && !m.customAI && !m.stormeye && !m.bat && (m.stunT||0)<=0 && (m.poiseCd||0)<=0){
    m.poise=(m.poise||0)+dmg;
    if(m.poise >= Math.max(20,(m.maxhp||30)*0.7)){
      m.poise=0; m.poiseCd=2.0; m.stunT=Math.max(m.stunT||0,0.4); m.windup=0; m.lunge=0;
      addFloat('STAGGER!', m.x, m.y-2.5, '#ffe6a0', 1.2);
      burst(m.x,m.y-0.4,'#ffe6a0',10,2); if(Snd.crit) Snd.crit();
      G.hitStop=Math.max(G.hitStop,0.08);
      if(knock) moveEntity(m, knock.x*0.6, knock.y*0.6);
    }
  }
  addFloat(crit? dmg+'!' : dmg, m.x, m.y-1.3, crit?'#ff5c48':'#ffb26b', crit?1.5:1.05);
  if(backstab) addFloat('BACKSTAB!', m.x, m.y-2.4, '#ff9a5a', 1.2);
  if(crit){ Snd.crit(); shockwave(m.x,m.y,'rgba(255,200,120,0.9)',26); }
  if(skill==='melee') G.hitStop=Math.max(G.hitStop, crit?0.09:0.045);
  else G.hitStop=Math.max(G.hitStop, crit?0.06:0.03);   // bow/staff hits used to feel flat - give them a beat of chunk too
  burst(m.x,m.y-0.5, m.kind==='slime'?'#7fca6a': m.kind==='wolf'?'#8a8d96':'#eceee6', 6, 2);
  // ranged hits chain a combo too - melee builds it in the swing code, but bow
  // and staff never did, so the archery/magic training drills (which ask for a
  // COMBO x2) were impossible to clear. Consecutive ranged hits now count.
  if(skill==='archery' || skill==='magic'){
    P.comboT=1.4;
    P.combo=(P.combo||0)+1;
    if(P.combo===2) addFloat('COMBO x2', P.x, P.y-2, '#ffce7a', 1.1);
  }
  if(knock && !m.boss){ moveEntity(m, knock.x*0.35, knock.y*0.35); }
  if(m.hp<=0){
    if(m.kind==='dragon' && !m.fainted){ m.hp=1; dragonFaints(m); } // he faints, he does not fall
    else if(m.kind==='mage' && m.capVath && !m.sealed){ m.hp=1; if(typeof sealVath==='function') sealVath(m); } // Act III finale: sealed for good by Jaist's seal (js/45)
    else if(m.kind==='mage' && m.finalVath && !m.bound){ m.hp=1; bindVath(m); } // Act IV: the last stand - bound, not slain
    else if(m.kind==='mage' && !m.escaped){ m.hp=1; vathEscapes(m); } // Vath never falls (mid-game) - he slips away
    else if(m.kind==='leviathan' && !m.freed){ m.hp=1; freeLeviathan(m); } // the curse breaks; it is a victim, not a foe
    else if(m.kind==='frostwarden' && !m.freed){ m.hp=1; freeWarden(m); } // the ice guardian is freed, not felled
    else if(m.kind==='icecolossus' && !m.freed){ m.hp=1; freeColossus(m); } // the Rimebound is another of Vath's cursed victims
    else killMob(m, skill);
  }
}
function vathEscapes(m){
  // The enchanter is not surprised, and he does not die. He studies you - the
  // pendant, most of all - and is simply gone. (He surfaces again, isle by isle.)
  m.escaped=1; m.dead=true; m.respawnT=-1; m.state='idle';
  Snd.magic(); G.slowmo=0.85;
  shockwave(m.x,m.y,'rgba(199,123,255,0.85)',60);
  for(let i=0;i<28;i++){ const a=Math.random()*TAU, sp=rnd(1,4.2);
    G.parts.push({x:m.x,y:m.y-0.4,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:rnd(0.7,1.6),color:'#c77bff',size:rnd(2,4),grav:-0.1}); }
  P.story.vathMet=1; P.prog.vhunt=Math.max(P.prog.vhunt||0,1);
  banner('VATH SLIPS AWAY','THE ENCHANTER WAS NOT SURPRISED');
  setTimeout(()=>storyCard('<b>Vath does not fall.</b> Beaten to one knee, he tilts his head and <i>looks</i> at you - at the pendant at your throat. <b style="color:#c9a0ff">“…You shouldn\'t be possible,”</b> he says, almost kindly. Then the violet folds inward, and he is <b>gone</b>.'),1200);
  if(typeof killCredit==='function') killCredit('mage'); // "drove him off" - vhunt turns in at Moli
}
function dragonFaints(m){
  // beaten down, the binding shatters - Ashwing swoons and comes to himself
  // ensAmt drives his colour (violet at 1, his own green at 0) and takes precedence over
  // enspelled in drawDragon, so it MUST be cleared here or he lingers fully purple after the
  // spell breaks. Restore his health too, so the freed dragon reads as whole, not a husk.
  m.fainted=1; m.enspelled=false; m.ensAmt=0; m.hp=m.maxhp; m.state='idle'; m.tx=null;
  // the chamber unseals: the Dragon Gate opens again now the wyrm is down
  if(G.dragonSealed){
    const g3=G.decor.find(d=>d.kind==='firegate' && d.gate==='g3');
    if(g3){ g3.open=true; for(let x=g3.x0;x<=g3.x1;x++){ setSolid(x,g3.gy,0); setTile(x,g3.gy,T.RUIN); }
      if(typeof invalidateScenery==='function') invalidateScenery(); }
    G.dragonSealed=0;
  }
  bossReward(m);
  m.windup=0; m.swing=0; m.lunge=0; m.lungeCd=1e9; m.hitCd=1e9; m.noAggroT=1e9;
  // no "way out" drop here: the freed Ashwing personally bears you up (the lift below), and the
  // far-south ember mouth remains - the Emberdeep's exit is the dragon, not a portal at his feet
  Snd.boss(); G.shake=0.9; G.slowmo=1.15;
  shockwave(m.x,m.y,'rgba(255,190,90,0.95)',95);
  banner('THE SPELL BREAKS','ASHWING RETURNS TO HIMSELF');
  P.eastDragonFought=1; P.eastDragonFreed=1; G.dragonMob=null;
  // drop the cached Sunward overworld so climbing back out regenerates it with the
  // freed Ashwing basking by the volcano (see spawnEastFolk's dragonrest placement)
  if(typeof WORLDS!=='undefined') delete WORLDS.east;
  if(typeof freeDragon==='function') freeDragon(m.x,m.y-0.4);
  // Ashwing lingers right where he fell, freed and grateful - he does not fly off on
  // his own; he stays at your side and offers the lift up to the Cloudreach at once.
  const disperseDragon=()=>{ if(m && !m.dead){ m.dead=true; m.respawnT=-1;
    for(let i=0;i<24;i++){ const a=Math.random()*TAU, sp=rnd(1,4);
      G.parts.push({x:m.x,y:m.y-0.6,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.4,life:rnd(0.9,1.8),
        color:Math.random()<0.5?'#ffd24a':'#8fd0a0',size:rnd(2,5),grav:-0.2}); } } };
  const offerLift=()=>{
    P.story=P.story||{}; P.story.skyKnown=1;
    setDialog('<i>Ashwing settles beside you, warm as a banked forge, and rumbles up toward the weather beyond the smoke-hole.</i> “There is a place above the clouds, little flame - a rock adrift in the cloud-sea, the whole archipelago spread below like a map. Climb onto my shoulder and I will bear you up.”',
      [{label:'Fly me up to the Cloudreach', cls:'gold', fn:()=>{ closeDialog(); disperseDragon(); if(typeof askDragonFlight==='function') askDragonFlight(); }},
       {label:'Not just yet', ghost:true, fn:()=>{ closeDialog(); disperseDragon(); }}]);
  };
  // the freeing plays as a full animated cutscene (the violet shatters, his green
  // floods back), then hands off to Ashwing's offer of a lift up to the Cloudreach.
  // Fall through to the old story-card if the cutscene layer isn't loaded.
  if(typeof dragonFreedCutscene==='function'){
    setTimeout(()=>dragonFreedCutscene(offerLift), 700);
  } else {
    setTimeout(()=>storyCard('<b style="color:#ffcf8a">The violet shatters.</b> Ashwing sinks to the ash - breathing, himself again. “You could have run me through. You broke the chain instead. My thanks, little flame.” <i>His great eye narrows.</i> “The binder\'s fire reached for your mind on the climb, and found no hold. That is not luck - but I do not know what it is. He fled the moment the chain broke - gone from the isle entirely, the way his kind goes. You will meet him again, I think. But not here.”',
      {onOk:offerLift}),1200);
  }
  if(qs('wyrm')==='active') completeQuest('wyrm');
}
// Which overworld isle a dungeon belongs to - felling a dungeon boss pacifies
// the isle above it too, so its nights fall quiet like any other cleared isle.
const OVERWORLD_PARENT = { frostvault:'frost', frostdeep:'frost', aeriedeep:'aerie',
  eastdeep:'east', reachdeep:'reach', milldeep:'main', undermaw:'main', skydungeon:'sky' };
// Is this mob a boss of any stripe? Covers the marquee bosses, the regional
// named foes, and every dungeon beast - the full roster crowd-control (snare)
// must never touch. Keep this list in step with the isle-clear check below.
function isBossMob(m){
  return !!(m && (m.boss||m.bigBoss||m.kind==='boss'||m.vaultbear||m.skyboss
    ||m.skyfinalboss||m.tombboss||m.reachboss||m.millboss||m.undermawBeast));
}
// Record that this isle's boss has fallen. Once cleared, the wilds stop sending
// night-wraiths here after dark, and any still abroad quietly disperse. This is
// deliberately unannounced - the night simply stops being dangerous.
function markBossCleared(){
  P.story=P.story||{}; P.story.bossCleared=P.story.bossCleared||{};
  const w=G.worldId; P.story.bossCleared[w]=1;
  const p=OVERWORLD_PARENT[w]; if(p) P.story.bossCleared[p]=1;
  // scatter any night-wraiths already prowling this world, without a word about it
  for(const o of G.mobs) if(o.night && !o.dead){ o.dead=true; o.respawnT=1e9; burst(o.x,o.y-0.5,'#c8d8e8',8,1.6); }
}
function killMob(m,skill){
  buzz(13);
  gainLXP((m.lvl||1)*6+4);
  m.dead=true; m.respawnT = m.bigBoss? -1 : rnd(24,40);
  const d=MOBDEF[m.kind];
  burst(m.x,m.y-0.4,'#fff',14,3);
  shockwave(m.x,m.y,'rgba(255,255,255,0.75)',30);
  if(skill && SKILLS[skill]) addXP(skill, m.xp||d.xp);
  bumpStat('kills');
  // named bosses (the Hollow Spirit by kind, every other boss by its
  // ach tag) grant their achievement AND a one-time +max-mana on defeat
  bossReward(m);
  // felling any isle boss - the marquee bosses, the regional named foes, or the
  // beasts denning in the isle's dungeons - marks the isle cleared and stills its nights
  if(isBossMob(m)){
    markBossCleared();
  }
  killCredit(m.kind);
  if(m.elite) killCredit('elite');
  // drops
  const g=rndi(d.gold[0],d.gold[1])*(m.elite?3:1);
  if(m.kind==='boar' && Math.random()<0.7){ give('boarmeat',1); addFloat('+1 boar meat',m.x,m.y-1.6,'#e0a070',1.0); }
  if(m.kind==='slime' && Math.random()<0.7){ give('goo',1); addFloat('+1 slime goo',m.x,m.y-1.6,'#7fca6a',1.0); }
  if(m.kind==='mage'){ m.respawnT=-1; Snd.magic();
    shockwave(m.x,m.y,'rgba(199,123,255,0.8)',46);
    toast('<b>Vath’s binding unravels with him.</b> “...the fire was to be mine,” he says, unhurried even now - and the violet goes out. The grove falls quiet.',6000); }
  if(g>0) G.parts.push({x:m.x,y:m.y,vx:0,vy:0,life:20,pickup:'gold',n:g,size:9,color:''});
  if(Math.random()<(m.elite?1:0.4)) G.parts.push({x:m.x+0.3,y:m.y+0.2,vx:0,vy:0,life:20,pickup:'heart',n:12,size:9,color:''});
  // dropped shafts - archers carry quivers, barrow-bones and raiders shed a few, and
  // a hard boss is a good resupply. Only worth dropping once you've a bow to catch them.
  if(P.unlocked && P.unlocked.bow && !m.bigBoss){
    let na=0;
    if(m.kind==='archer') na=rndi(4,8);
    else if(m.kind==='skeleton'||m.kind==='raider'||m.kind==='brigand'||m.kind==='raptor') na=rndi(2,4);
    else if(m.boss) na=rndi(4,8);
    else if(Math.random()<0.30) na=rndi(1,2);
    if(m.elite) na*=2;
    if(na>0) G.parts.push({x:m.x-0.3,y:m.y+0.2,vx:0,vy:0,life:20,pickup:'arrows',n:na,size:9,color:''});
  }
  if(m.kind==='boss'){
    // THE Hollow Spirit (Emberwick's main-story boss) - the only fall that seals
    // the isle's victory screen
    Snd.boss(); G.shake=0.9; G.slowmo=1.15;
    shockwave(m.x,m.y,'rgba(160,255,200,0.9)',85);
    banner('THE HOLLOW SPIRIT FALLS','THE CURSE BREAKS - THE STRAIT LIES OPEN');
    dropHollowFire();   // the seal breaks with him
    // his risen court crumbles with him FOR GOOD: clear every skeleton on the isle -
    // alive or merely waiting to respawn - so the northern spit stays quiet, and drop
    // any bone volley still in the air so nothing can kill you on the victory lap
    for(const o of G.mobs){ if(o.kind==='skeleton'){ if(!o.dead) burst(o.x,o.y-0.4,'#d8d8c8',10,1.4); o.dead=true; o.respawnT=-1; } }
    for(let i=G.projs.length-1;i>=0;i--){ if(G.projs[i].kind==='bone') G.projs.splice(i,1); }
    G.victory=true;   // invulnerable through the win sequence (see hurtPlayer)
    if(qs('king')!=='done'){ P.quests.king='active'; P.prog.king=1; updateQuestUI(); } // rushed the boss? still counts
    // freeze the world once the victory screen is up so you can read it in peace
    setTimeout(()=>{ document.getElementById('winOv').style.display='flex'; if(G.state==='play') G.paused=true; },2400);
  } else if(m.boss){
    // any other named regional boss (the Tome-Warden snake, the Leviathan, the
    // Castellan...) falls under its own name - never the Hollow Spirit's
    Snd.boss(); G.shake=0.85; G.slowmo=1.1;
    shockwave(m.x,m.y,'rgba(160,255,200,0.9)',80);
    banner((m.title||'THE FOE')+' FALLS','A SHADOW LIFTS FROM THIS PLACE');
  } else Snd.hit();
  // The Hoarfrost Bear guarded the Glacier Vault's den - felling it opens the way down.
  if(m.vaultbear){
    P.story=P.story||{}; P.story.iceBearDown=1;
    // The beast hoarded a blade among its kills - it DROPS a new sword, wielded at
    // once. This is granted purely by the kill, independent of Bryn's quest turn-in
    // (which completes off the iceBearDown flag), so the sword isn't gated on it.
    const newBlade = (P.swordTier||0) < 3;
    P.unlocked=P.unlocked||{}; P.unlocked.melee=true;
    P.swordTier=Math.max(P.swordTier||0, 3);
    if(typeof buildHotbar==='function') buildHotbar();
    setTimeout(()=>toast('The great bear slumps across the snow and lies still. Behind it, black against the ice, gapes the <b>den mouth</b> - past the old kills, a stair of glare-ice leads <b>down</b> into the glacier. The way to the <b>Glacier Vault</b> is open.',6000), 1500);
    if(newBlade) setTimeout(()=>{ if(typeof banner==='function') banner('THE RIMEFANG SWORD','A NEW BLADE - KEENER THAN STEEL');
      toast('Half-buried among the bear\'s old kills lies a <b style="color:#bfe8ff">frost-forged sword</b>, its rimed edge still unbroken. The <b style="color:#bfe8ff">Rimefang</b> is yours - already in your hand, and it bites deeper than any steel from the forge.',7000);
      if(Snd.levelup) Snd.levelup(); }, 3400);
    if(typeof autoSave==='function') autoSave();
  }
  // The Tome-Warden: felling the serpent IS the deed now - the cursed tome crumbles with it,
  // so there's no separate "destroy the tome" step to hunt down after the fight.
  if(m.ach==='tomewarden'){
    m.dead=true;
    // the crypt seal grinds back up now the warden is down - the way out (back to the Underclimb) is clear
    if(typeof AERIE_CRYPT_SEAL!=='undefined') for(const [x,y] of AERIE_CRYPT_SEAL){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
    { const cg=(G.decor||[]).find(d=>d.kind==='catgate' && d.gate==='crypt'); if(cg) cg.open=true; }
    invalidateScenery&&invalidateScenery();
    const tome=G.decor && G.decor.find(d=>d.kind==='tome' && !d.destroyed);
    if(tome && typeof destroyTome==='function') setTimeout(()=>destroyTome(tome), 600);
    else { P.story=P.story||{}; P.story.aerieFreed=1; if(typeof autoSave==='function') autoSave(); }
  }
  // The Storm Roc - the Cloudreach's apex terror. She is an OPTIONAL trophy hunt
  // now: felling her wins glory and a fat purse, but the road DOWN comes from
  // calming the sky on the Rainbow Road, not from her eyrie.
  if(m.skyboss){
    P.story=P.story||{}; P.story.rocDown=1;   // trophy taken; also settles the Roc bounty
    if(typeof giveGold==='function') giveGold(120);
    setTimeout(()=>{ if(typeof storyCard==='function') storyCard('The Storm Roc folds out of the sky and does not rise - the eyrie is yours, and <b style="color:#ffd76a">120 gold</b> of scattered sky-plunder with it. <i>The way down still runs along the wind: seek the Wind-Lost Bird\'s <b>rainbow road</b> to calm it.</i>', {label:'OK'});
      else toast('The Storm Roc folds out of the sky and does not rise - the eyrie is yours, and 120 gold with it.',7000); }, 1500);
    if(typeof autoSave==='function') autoSave();
  }
  // (The Storm-Wraith mini-boss on the Rainbow Road was cut - the fourth isle is a quiet
  //  waypoint now, so there is no mid-road boss kill to handle here.)
  // THE STORM-EYE (Rainbow Road final boss) - felling it stills the high wind and unknots the
  // crown-ward to the vault beyond, where the Cloud-Chart waits. No stormsail, no Leap: you
  // carry the chart to Ashwing, who bears you between the isles (see askSkyDragon).
  if(m.skyfinalboss){
    P.story=P.story||{}; P.story.skyDungeonDone=1; P.story.skyEyeDone=1;
    Snd.boss&&Snd.boss();
    // open the crown-ward to the Crown-Vault, and reopen the arena seal now the fight is won
    if(typeof openSkyGate==='function') openSkyGate('gEye');
    const g5=G.decor&&G.decor.find(d=>d.kind==='skygate'&&d.gate==='g5');
    if(g5 && !g5.open){ g5.open=true; for(const [x,y] of (g5.tiles||[])) setSolid(x,y,0); }
    P.hp=P.maxhp; P.mp=P.maxmp;
    if(typeof gainLXP==='function' && typeof xpForP==='function') gainLXP(xpForP(P.level));
    banner('THE STORM-EYE CLOSES','THE HIGH WIND FALLS STILL');
    if(typeof autoSave==='function') autoSave();
    // The Rainbow Road's finale now plays as a full-overlay cutscene (js/39-more-cutscenes.js):
    // the shielded storm-core guts itself into mist, the high wind falls still, the rainbow runs
    // quiet, and the cloud-vault opens north. When it ends, the pointer card (take the vault's
    // prize down to Ashwing) follows. Falls back to the old story-card if the overlay is absent.
    const skyCard=()=>storyCard('<i>North of the Broken Crown the little vault stands open on the cloud, its ward unknotted - something the crown kept, waiting there for you.</i> <b style="color:#c9b0ff">Take what it kept, then carry it down to Ashwing.</b>',
      {label:'OK'});
    setTimeout(()=>{
      if(typeof stormEyeCutscene==='function') stormEyeCutscene(skyCard);
      else skyCard();
    }, 1400);
  }
  // THE WIND SPIRIT on the Cloudreach - felling it lifts the ward on the Gale-Shrine, so you
  // can take the bow (the one arm that can strike the Storm-Eye up on the rainbow road).
  if(m.windspirit){
    P.story=P.story||{}; P.story.skyWindSpiritDown=1;
    const g=G.decor&&G.decor.find(d=>d.kind==='skygate'&&d.gate==='windward');
    if(g && !g.open){ g.open=true; for(const [x,y] of (g.tiles||[])) setSolid(x,y,0);
      shockwave(g.x,g.y,'rgba(200,230,255,0.9)',44); }
    Snd.boss&&Snd.boss();
    banner('THE WIND SPIRIT FALLS','THE SHRINE-WARD LIFTS');
    toast('The wind spirit unravels into still air, and the ward on the little shrine winks out. <b>Something waits in the chest within.</b>',5200);
    if(typeof autoSave==='function') autoSave();
  }
  // The Drowned Minotaur dens in the Stormreach catacomb. In Act II it is Stormreach's
  // spirit-boss: felling it breaks Vath's storm-surge over the coast. Drop the cached isle so
  // it regenerates restored (the surge drains, the wrack clears) the next time you land - the
  // same revert the other four returned isles do off their own dungeon clears.
  if(m.tombboss){
    P.story=P.story||{}; P.story.tombBossDown=1;
    if(P.story.vathVeil){
      if(typeof WORLDS!=='undefined' && WORLDS.reach) delete WORLDS.reach;
      banner('THE DROWNED MINOTAUR FALLS','THE STORM-SURGE BREAKS OVER STORMREACH');
    }
    if(typeof autoSave==='function') autoSave();
  }
  // THE TIDEMAW wardening Barik's Drowned Vault - felling it stills the flooded halls,
  // opens the Cistern seal, and lets you take the Pearl of the Deep (grants DIVE).
  if(m.tidemaw){
    P.story=P.story||{}; P.story.barikDeepDone=1;
    if(typeof unsealBarikCistern==='function') unsealBarikCistern();
    // Vath's flood recedes: drop Barik's cached surface so it regenerates restored on return.
    if(typeof WORLDS!=='undefined' && WORLDS.main) delete WORLDS.main;
    banner('THE TIDEMAW IS SLAIN','THE DROWNED VAULT FALLS STILL');
    if(typeof autoSave==='function') autoSave();
  }
  // The returned-isle dungeon guardians (Gale-Wraith, Ash-Scorpion, Stormheart, and the
  // Emberwick Tideward Guardian) share one clear-flag: m.gateDone names the story flag.
  if(m.gateboss && m.gateDone){
    P.story=P.story||{}; P.story[m.gateDone]=1;
    // Clearing an isle's spirit-dungeon lifts its surface curse: drop the parent isle's cached
    // world so it regenerates restored (flood/lava/storm gone) the next time the player lands.
    { const SURF={galeDeepDone:'wind', ashenForgeDone:'east', stormTempleDone:'sky'};
      const sid=SURF[m.gateDone];
      if(sid && typeof WORLDS!=='undefined' && WORLDS[sid]) delete WORLDS[sid]; }
    if(typeof autoSave==='function') autoSave();
  }
  // The Barrow Brute menaces the storm-coast - down it and Stormreach can breathe
  if(m.reachboss){
    P.story=P.story||{}; P.story.reachBossDown=1;
    setTimeout(()=>toast('The brute crashes down and does not rise, and the storm-coast lets out a breath it has held for a lifetime. <b>Tibb</b> is already dragging fresh timber to the water. Stormreach is yours to walk in peace - and the castaways will name a cove for you.',6500), 1500);
    if(typeof autoSave==='function') autoSave();
  }
  // THE COG-BOUND (Undermill mini-boss) - felling it frees the seized gear-train,
  // which grinds the millstone gate up and opens the way to Nessa's sail.
  if(m.millboss){
    P.story=P.story||{}; P.story.millDone=1;
    // drain every flooded hall for good (the mazes need no re-solving on a later descent)
    if(G._millWalls && typeof applyMillWall==='function') for(const w of G._millWalls){ w.on=true; applyMillWall(w); }
    // the works fall silent: still the grind-blades and spike-grates
    G._millAxes=[]; G._millSpikes=[]; G.decor=G.decor.filter(d=>d.kind!=='spiketile' && d.kind!=='axetrap');
    // the freed gear-train grinds BOTH gates up: the Cog-Gate behind you (so you're not trapped)
    // and the inner sail-vault gate ahead - the sail and the way up stand right there.
    if(typeof MILL_BOSS_SEAL!=='undefined') for(const [x,y] of MILL_BOSS_SEAL){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
    if(typeof MILL_VAULT_SEAL!=='undefined') for(const [x,y] of MILL_VAULT_SEAL){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
    { const cg=G.decor.find(d=>d.kind==='catgate' && d.gate==='cog'); if(cg) cg.open=true; }
    { const vg=G.decor.find(d=>d.kind==='catgate' && d.gate==='millvault'); if(vg) vg.open=true; }
    G._millSealed=0;
    if(typeof invalidateScenery==='function') invalidateScenery();
    banner('THE COG-BOUND FALLS','THE VAULT GRINDS OPEN - THE SAIL IS YOURS');
    if(typeof autoSave==='function') autoSave();
  }
  // THE BONE-YARD (Undermaw R1): the second room's horde. Each fallen skeleton stays
  // down; when the last one drops, the Bone Gate grinds up and the way deeper opens.
  if(m.mawHorde){
    m.respawnT=-1;   // horde bones never rise again
    G._mawHordeLeft=Math.max(0,(G._mawHordeLeft||0)-1);
    if(G._mawHordeLeft>0) addFloat(G._mawHordeLeft+' left', m.x, m.y-1.6, '#d8d8c8', 1.1);
    else if(typeof openMawHordeGate==='function') openMawHordeGate();
  }
  if(m.undermawBeast){
    P.story=P.story||{}; P.story.undermawDown=1;
    if(typeof UNDERMAW_GATE!=='undefined') for(const [x,y] of UNDERMAW_GATE){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
    const cg=G.decor.find(d=>d.kind==='catgate' && d.gate==='undermaw'); if(cg) cg.open=true;
    // the Stalker's venom stops the moment it falls - no lingering sting after the win
    P.poisonT=0; P._venAcc=0;
    // the bone-kin loitering at the surface scar were its wardens: clear them from the cached
    // Barik world (and from here if you're standing in it) so the mouth is quiet on your way out.
    const clearScar=arr=>{ if(!arr) return; for(let i=arr.length-1;i>=0;i--){ if(arr[i] && arr[i].scarSkel) arr.splice(i,1); } };
    if(typeof WORLDS!=='undefined' && WORLDS.main) clearScar(WORLDS.main.mobs);
    if(G.worldId==='main') clearScar(G.mobs);
    if(typeof invalidateScenery==='function') invalidateScenery();
    banner('THE MAW-STALKER FALLS','THE HOARD DOOR GRINDS OPEN');
    if(typeof autoSave==='function') autoSave();
  }
  // After felling ANY dungeon boss, open the way up. Dungeons that carry a REWARD ROOM (a
  // `gate:'reward'` catgate) grind that room open instead - the prize + the climb-out stand in a
  // sealed chamber the guardian was warding, not a portal dropped where it fell. Dungeons not yet
  // on that pattern fall back to the old fast-exit drop. (Overworld bosses stay put; the Undermill
  // opens its own sail-vault via m.millboss.)
  if((m.boss||m.bigBoss) && !m.millboss && typeof inDungeon==='function' && inDungeon()){
    if(typeof hasRewardRoom==='function' && hasRewardRoom()){ if(typeof openRewardRoom==='function') openRewardRoom(); }
    else if(typeof spawnFastExit==='function') spawnFastExit(m.x, m.y);
  }
  // the four tier-2 tool prizes are BOSS DROPS - one per dungeon (see 37-dungeon-hideaways.js)
  if(typeof awardDungeonTool==='function') awardDungeonTool(m);
}
function buzz(ms){ if(CFG.shake && navigator.vibrate){ try{ navigator.vibrate(ms); }catch(e){} } }
function stunPlayer(dur){
  if(P.dead || G.victory) return;
  P.stunT=Math.max(P.stunT||0, dur||0.9);
  P.moving=false; P.click=null;
  addFloat('STUNNED!', P.x, P.y-2.0, '#bfe8ff', 1.2);
  burst(P.x,P.y-0.5,'#bfe8ff',12,2.2);
  G.shake=Math.max(G.shake,0.3); buzz(30);
}
function hurtPlayer(dmg,src){
  if(P.hurtT>0 || P.dead || (P.rollT||0)>0 || G.victory) return;   // no dying during the victory sequence
  // PARRY: a braced guard turns a telegraphed melee blow. Only a real striker
  // (a mob, with a position) can be parried this way - hazards, poison and falls
  // pass a plain source and cut straight through the guard. Projectiles are turned
  // separately, in updateProjs (they get batted back). Marquee bosses (bigBoss)
  // hit too hard to fully turn - a parry only softens their blow, never negates it.
  if((P.parryT||0)>0 && src && src.kind && src.kind!=='wraith' && src.x!=null && parryCovers(src.x,src.y)){
    if(src.bigBoss){ dmg*=0.35; onParry(src.x,src.y); }   // chip through - can't be fully turned
    else {
      onParry(src.x,src.y);
      src.stunT=Math.max(src.stunT||0,1.1); src.windup=0; src.swing=0;   // left wide open
      const kx=src.x-P.x, ky=src.y-P.y, kl=Math.hypot(kx,ky)||1;
      if(!src.boss) moveEntity(src, kx/kl*0.6, ky/kl*0.6);   // shoved back off the failed swing
      return;
    }
  }
  buzz(24);
  dmg=dmg*[0.6,1,1.35][CFG.diff|0];
  let _red=[0,0.15,0.30][P.armor||0];
  if(typeof has==='function' && has('wardplate',1)) _red=Math.min(0.65, _red+0.15);   // the Deepiron Ward stacks atop worn armour
  dmg=Math.max(1, Math.round(dmg*(1-_red)));
  if(has('wardstone',1)) dmg=Math.max(1, dmg-2);   // the Warden's Wardstone turns aside a sliver of every blow
  const lvUp=Math.max(0,(src&&src.lvl||1)-(P.level||1));
  dmg=Math.round(dmg*Math.min(1.8,1+0.08*lvUp)); // and hit harder
  // the hot-spring buffer (yellow overheal) soaks the blow before HP does - it lets
  // you shrug off an extra hit, but it does not regenerate: rest at the spring to renew it
  if((P.overheal||0)>0){
    const absorb=Math.min(P.overheal, dmg);
    P.overheal-=absorb; dmg-=absorb;
    if(absorb>0){ addFloat('-'+absorb, P.x, P.y-1.9, '#f0d24a', 1.15); burst(P.x,P.y-0.5,'#f0d24a',6,1.8); }
    if(dmg<=0){ P.hurtT=0.55; P.lastCombat=G.time; Snd.hurt&&Snd.hurt(); G.shake=Math.max(G.shake,0.18); refreshUI&&refreshUI(); return; }
  }
  P.hp-=dmg; P.hurtT=0.7; P.lastCombat=G.time;
  // grit: every so many hits taken, your hide toughens - the bar rises each level,
  // and each level grants a bigger slab of max HP
  P.gritN=(P.gritN||0)+1;
  const gritNeed=Math.round(10*Math.pow(1.4,P.gritLv||0));
  if(P.gritN>=gritNeed){
    P.gritN=0; P.gritLv=(P.gritLv||0)+1;
    const gritGain=6+P.gritLv*2;
    P.maxhp+=gritGain; P.hp=Math.min(P.maxhp,P.hp+gritGain);
    banner('GRIT - LEVEL '+P.gritLv, '+'+gritGain+' MAX HP - WHAT DOES NOT KILL YOU...');
    Snd.levelup(); burst(P.x,P.y-0.5,'#ff9a6a',14,2);
    setTimeout(()=>refreshUI(),0);
  }
  if(src && src.kind==='scorpion'){ P.poisonT=6;
    hintOnce('venom','<b>Venom!</b> Scorpion stings burn for a few breaths - the poison fades on its own.'); }
  if(P.openCh){ P.openCh=null; toast('The blow knocks you off the chest lid!'); }
  addFloat('-'+dmg,P.x,P.y-1.6,'#ff8a7a',1.1);
  burst(P.x,P.y-0.5,'#e05648',8); Snd.hurt(); G.shake=Math.max(G.shake,0.25);
  G.flash=0.28; G.hitStop=Math.max(G.hitStop,0.05);
  if(src){ const dx=P.x-src.x, dy=P.y-src.y, l=Math.hypot(dx,dy)||1;
    moveEntity(P,dx/l*0.5,dy/l*0.5);
    // shove the camera the way the blow throws you (screen-space kick)
    G.kickX=(dx-dy)/l*6; G.kickY=(dx+dy)/l*3; }
  refreshUI();
  if(P.hp<=0){ P.hp=0; playerDie(); }
}
function playerDie(){
  P.dead=true; Snd.die(); P.stats.deaths=(P.stats.deaths||0)+1;
  setTimeout(()=>{ document.getElementById('deadOv').style.display='flex'; },600);
}
document.getElementById('respawnBtn').onclick=()=>{
  document.getElementById('deadOv').style.display='none';
  P.dead=false; P.hp=Math.round(P.maxhp*0.6); P.mp=P.maxmp;
  P.poisonT=0; P._venAcc=0; // venom does not carry through death
  // when a foe kills you it recovers fully - no chipping a boss down across
  // repeated deaths. Every living mob is healed to full and sent home to rest.
  for(const m of G.mobs){
    if(m.dead) continue;
    m.hp=m.maxhp; m.state='idle'; m.hurtT=0; m.noAggroT=2.5;
    m.summoned=[false,false];               // bosses may summon their guard anew
    if(typeof m.hx==='number'){ m.x=m.hx; m.y=m.hy; }   // sent back to its post
  }
  // if you died sealed in Ashwing's chamber, reset the encounter: unseal the Dragon
  // Gate and clear the wyrm so re-entering re-triggers (and re-seals) the fight cleanly
  if(G.dragonSealed){
    const g3=G.decor.find(d=>d.kind==='firegate' && d.gate==='g3');
    if(g3){ g3.open=true; for(let x=g3.x0;x<=g3.x1;x++){ setSolid(x,g3.gy,0); setTile(x,g3.gy,T.RUIN); }
      if(typeof invalidateScenery==='function') invalidateScenery(); }
    for(const m of G.mobs){ if(m.kind==='dragon' && !m.fainted){ m.dead=true; m.respawnT=-1; } }
    G.dragonMob=null; G.dragonSealed=0;
  }
  // if you died sealed in the Warden's Crypt, reset the encounter: raise the crypt seal and
  // re-seal the Tome-Warden so re-entering the room re-triggers (and re-seals) the fight cleanly
  if(G._cryptSealed){
    if(typeof AERIE_CRYPT_SEAL!=='undefined') for(const [x,y] of AERIE_CRYPT_SEAL){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
    { const cg=(G.decor||[]).find(d=>d.kind==='catgate' && d.gate==='crypt'); if(cg) cg.open=true; }
    for(const m of G.mobs){ if(m.ach==='tomewarden' && !m.dead){ m.sealed=true; m.entranceDone=false; m.introKind=null; } }
    if(typeof invalidateScenery==='function') invalidateScenery();
    G._cryptSealed=0;
  }
  // if you died sealed in the Grinding Floor, raise the Cog-Gate and reset so re-entering the
  // chamber re-triggers (and re-seals) the Cog-Bound fight cleanly (the boss is healed above)
  if(G._millSealed){
    if(typeof MILL_BOSS_SEAL!=='undefined') for(const [x,y] of MILL_BOSS_SEAL){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
    { const cg=(G.decor||[]).find(d=>d.kind==='catgate' && d.gate==='cog'); if(cg) cg.open=true; }
    if(typeof invalidateScenery==='function') invalidateScenery();
    G._millSealed=0;
  }
  // if you died sealed in the Stalker's Den, reset the encounter: raise the Den Gate and
  // re-seal the Maw-Stalker so walking back into the den re-triggers (and re-seals) it cleanly
  if(G._mawDenSealed){
    if(typeof MAW_DENGATE!=='undefined') for(const [x,y] of MAW_DENGATE){ setSolid(x,y,0); setTile(x,y,T.RUIN); }
    { const cg=(G.decor||[]).find(d=>d.kind==='catgate' && d.gate==='den'); if(cg) cg.open=true; }
    for(const m of G.mobs){ if(m.undermawBeast && !m.dead){ m.sealed=true; m.entranceDone=false; m.introKind=null; } }
    if(typeof invalidateScenery==='function') invalidateScenery();
    G._mawDenSealed=0;
  }
  const toll=Math.floor((P.gold||0)*0.15);
  if(toll>0){ P.gold-=toll;
    toast('Death takes its toll: <b>'+toll+' gold</b> lost from your purse. <i>(Banked gold is beyond its reach - Goldwarden Bree, Greyharbor.)</i>',6200); }
  if((CFG.diff|0)>0){ // Story mode keeps your goods
    const lost=[];
    for(const lk in SELL_PRICES){ const lc=P.inv[lk]||0;
      if(lc>=2){ const dl=Math.max(1,Math.floor(lc*0.25)); take(lk,dl);
        lost.push(dl+' '+(ITEMS[lk]?ITEMS[lk].name.toLowerCase():lk)); } }
    if(lost.length) setTimeout(()=>toast('Scavengers picked your satchel while you lay senseless: <b>'+lost.join(', ')+'</b> gone. <i>(Goods in Bree\u2019s vault are safe.)</i>',7500),1200);
  }
  // respawn on the shore you fell on - never yank the hero across the sea to
  // another island. A boss checkpoint (set when you roused a dungeon boss) wins first,
  // so dying to the boss means another go at the boss, not the whole gauntlet again;
  // then honour a bind if it's on this world; else the world's village/spawn.
  const bc=P.bossCheck;
  if(bc && bc.w===G.worldId){ P.x=bc.x; P.y=bc.y; if(typeof unstickEntity==='function') unstickEntity(P); }
  else { const b=P.bind;
    if(b && b.w===G.worldId){ P.x=b.x; P.y=b.y; }
    else { const home=ZONES.village||ZONES.town||(WORLD_DEFS[G.worldId]&&WORLD_DEFS[G.worldId].spawn)||{x:P.x,y:P.y};
      P.x=home.x+0.5; P.y=home.y+2.5; } }
  P.hurtT=1.5; refreshUI(); autoSave();
};
document.getElementById('winBtn').onclick=()=>{ document.getElementById('winOv').style.display='none'; G.paused=false; G.victory=false; };

/* ---- per-frame updates ---- */
function updatePlayer(dt){
  if(P.dead) return;
  // falling into the Emberdeep pit: control is frozen while the drop animation plays out
  // (updateEastDeep ticks the timer and respawns). Roll cooldown still recovers.
  if(typeof G!=='undefined' && (G._emberDrop||G._mawDrop)){ P.moving=false; P.click=null; P.rollT=0; P.rollCd=Math.max(0,(P.rollCd||0)-dt); return; }
  // ZAPPED by an Underclimb ward-lance: control is frozen while the shock plays out
  // (updateAerieDeep ticks the timer and respawns). Roll cooldown still recovers.
  if(typeof G!=='undefined' && G._aerieZap){ P.moving=false; P.click=null; P.rollT=0; P.rollCd=Math.max(0,(P.rollCd||0)-dt); return; }
  // PLUNGING into the Rimefissure's freezing water: control frozen while the hero flails in the
  // cracking ice (updateFrostDeep ticks the timer and respawns). Roll cooldown still recovers.
  if(typeof G!=='undefined' && G._frostPlunge){ P.moving=false; P.click=null; P.rollT=0; P.rollCd=Math.max(0,(P.rollCd||0)-dt); return; }
  // THE OSSUARY DANCE: control is frozen while the bonewright treads the pattern (the cut
  // scene) and while a ward-jolt plays out (updateReachDeep drives both). Cooldowns still tick.
  if(typeof G!=='undefined' && G._dance && (G._dance.demo||G._dance.zap)){ P.moving=false; P.click=null; P.rollT=0; P.rollCd=Math.max(0,(P.rollCd||0)-dt); return; }
  // FALLING between the Rainbow Road's floating platforms: control frozen while the hero
  // drops through the cloud (updateSkyDungeon ticks the timer and respawns). Roll cd recovers.
  if(typeof G!=='undefined' && G._skyFall){ P.moving=false; P.click=null; P.rollT=0; P.rollCd=Math.max(0,(P.rollCd||0)-dt); return; }
  // hold the hero still during a scripted camera pan (the ward-gate reveal), so
  // control returns exactly where it left off and no dash/move fires unseen
  if(G.camCine){ P.moving=false; P.click=null; return; }
  // STUNNED (dazed): the Storm-Wraith's snap can lock you for a beat - no walking,
  // dashing, steering or striking. Timers still tick so you recover on schedule.
  if((P.stunT||0)>0){
    P.stunT-=dt; P.moving=false; P.click=null;
    P.rollT=Math.max(0,(P.rollT||0)-dt); P.rollCd=Math.max(0,(P.rollCd||0)-dt);
    P.atkCd=Math.max(0,(P.atkCd||0)-dt);
    return;
  }
  // safety net: never leave the player wedged between water and land. A windsurfer
  // (surf unlocked) counts light shallows as valid footing, so the board isn't
  // snapped back to shore the instant it touches the water.
  if(!G.interior && unstickEntity(P, P.unlocked&&P.unlocked.surf)){
    hintOnce('unstuck','Solid ground found its way back under your boots.');
  }
  if((G.interior || (typeof inDungeon==='function' && inDungeon())) && P.riding){
    P.riding=0; toast((P.unlocked&&P.unlocked.moa)?'Kiko waits outside - no room to ride here.':'Chestnut waits outside.',2200);
  }
  // dodge roll
  P.rollT=Math.max(0,(P.rollT||0)-dt); P.rollCd=Math.max(0,(P.rollCd||0)-dt);
  if(P.rollCd<=0) P.dashChain=0;
  if(keys['control'] || keys['l']) tryRoll();   // dash: Ctrl OR L (L avoids the Ctrl+W tab-close risk)
  // parry timers: the short guard window a swing opens, and the clean-parry flash.
  // No movement freeze now - the parry rides your attack, so you keep your footing.
  P.parryT=Math.max(0,(P.parryT||0)-dt);
  P.parrySuccess=Math.max(0,(P.parrySuccess||0)-dt);
  if(P.parryDrill) updateParryDrill(dt);
  if(P.rollT>0){
    // a little hop through the roll (item 3): the dash leaves the ground and lands
    P.z=Math.sin(Math.PI*(1-P.rollT/(P.rollMax||0.26)))*7;
    const _rx=P.x, _ry=P.y, _step=P.speed*2.7*dt;
    const _dvault=(G.worldId==='barikdeep');   // Tide Race water is non-solid, so the dash crosses it regardless
    moveEntity(P, P.dir.x*_step, P.dir.y*_step, 0.28, P.unlocked&&P.unlocked.surf&&!P.riding&&!_dvault, P.unlocked&&P.unlocked.dive&&!P.riding&&!_dvault);
    // rolled straight into a wall (or a corner) with no ground covered: end the roll
    // now so control returns at once, instead of the legs churning against the wall
    // for the rest of the animation. Sliding ALONG a wall still clears this threshold.
    if(Math.hypot(P.x-_rx,P.y-_ry) < _step*0.4){ P.rollT=0; P.rollCd=Math.min(P.rollCd,0.35); }
    P.anim+=P.speed*2.7*dt*3.1; P.moving=true;
    P.stepT=(P.stepT||0)-dt;
    if(P.stepT<=0 && !G.interior){
      P.stepT=0.27;
      const tt=tileAt(P.x|0,P.y|0);
      if(tt>=T.SAND){
        const col = tt===T.SAND? 'rgba(226,205,160,0.5)'
                  : (tt===T.PATH||tt===T.SOIL)? 'rgba(150,120,90,0.5)'
                  : 'rgba(120,140,88,0.42)';
        for(let i=0;i<2;i++) G.parts.push({x:P.x+rnd(-0.15,0.15), y:P.y+rnd(-0.05,0.05),
          vx:rnd(-0.4,0.4), vy:rnd(-0.5,-0.1), life:rnd(0.25,0.4), color:col, size:rnd(2,3.2), grav:0});
      }
    }
    if(Math.random()<0.6) G.parts.push({x:P.x,y:P.y,vx:-P.dir.x*0.8,vy:-P.dir.y*0.8,
      life:0.25,color:'rgba(210,200,175,0.5)',size:2.2});
  } else if(P.z){ P.z=0; }   // grounded again once the roll ends
  let mx=0,my=0;
  if(keys['w']||keys['arrowup']) { mx-=1; my-=1; }
  if(keys['s']||keys['arrowdown']) { mx+=1; my+=1; }
  if(keys['a']||keys['arrowleft']) { mx-=1; my+=1; }
  if(keys['d']||keys['arrowright']){ mx+=1; my-=1; }
  if(input.joy.active){ mx=input.joy.x; my=input.joy.y; }
  else if(input.gpDir){ mx=input.gpDir.x; my=input.gpDir.y; }
  if(P.clickFx) P.clickFx.t-=dt;
  if(Math.hypot(mx,my)>0.05){ P.click=null; }
  else if(P.click && !dlg.open){
    let tx,ty,range; const C=P.click;
    if(C.type==='mob'){ if(C.m.dead){ P.click=null; } else { tx=C.m.x; ty=C.m.y; range=P.weapon==='melee'?1.45:6.0; } }
    else if(C.type==='gather'){ if(C.n.dead){ P.click=null; } else { tx=C.n.x; ty=C.n.y; range=C.range; } }
    else if(C.type==='inter'){ tx=C.x; ty=C.y; range=C.range; }
    else { tx=C.x; ty=C.y; range=0.14; }
    if(P.click){
      const d=dist(P.x,P.y,tx,ty);
      if(d>range){
        mx=(tx-P.x)/d; my=(ty-P.y)/d;
        P._seek=P._seek||{x:P.x,y:P.y,t:0};
        P._seek.t+=dt;
        if(dist(P.x,P.y,P._seek.x,P._seek.y)>0.06){ P._seek.x=P.x; P._seek.y=P.y; P._seek.t=0; }
        else if(P._seek.t>0.8){ P.click=null; mx=0; my=0; }
      } else {
        if(P._seek) P._seek.t=0; // engaged, not stuck
        if(C.type==='mob'){ facePoint(tx,ty); if(P.atkCd<=0) tryAttack(false); }
        else if(C.type==='gather'){ facePoint(tx,ty); if(P.atkCd<=0){ P.atkCd=0.45; hitNode(C.n); } }
        else if(C.type==='inter'){ P.click=null; C.go(); }
        else P.click=null;
      }
    }
  }
  const ml=Math.hypot(mx,my);
  // --- Rimefissure ice: every slick floor is a FOOTED coasting slide, never a full
  //     glide. Steps carry a beat of momentum that quickly settles on release, and you
  //     always keep your feet - so no floor ever sends you sliding endlessly. ---
  // Rimefissure drift-ice: standing on a floe over the channel gives a SLIGHT slide (momentum),
  // so lining up a precise hop takes timing.
  const onFloe = G.worldId==='frostdeep' && !dlg.open && G._frostVoid && G._frostVoid.has(Math.floor(P.x)+','+Math.floor(P.y));
  // a FOOTED-but-slick floor (the Frostgate entry landing and the Frozen Heart arena):
  // the same slight-slide as the drift-floes, so your steps carry a little momentum and
  // coast a beat on release - but you keep your feet and never glide across the room.
  const driftZones = (WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].driftFloor) || [];
  const onDriftFloor = driftZones.length && P.rollT<=0 && !dlg.open
    && driftZones.some(sz=> P.x>=sz.x0 && P.x<=sz.x1 && P.y>=sz.y0 && P.y<=sz.y1)
    && tileAt(Math.floor(P.x),Math.floor(P.y))===T.ICE;
  if(onFloe || onDriftFloor){
    // a slight slide: your steps build a little momentum and coast a beat when you let go,
    // so a precise step between drifting floes takes timing (over-run and you slide into the water)
    if(P.slideDir) P.slideDir=null;
    P._glv=P._glv||{x:0,y:0};
    const spF=P.speed*(has('boots',1)?1.14:1);
    let tvx=0,tvy=0;
    if(ml>0.05){ tvx=mx/ml*spF; tvy=my/ml*spF; P.dir={x:mx/ml,y:my/ml}; }
    const acc=(ml>0.05?7.0:4.0)*dt;
    P._glv.x += (tvx-P._glv.x)*Math.min(1,acc);
    P._glv.y += (tvy-P._glv.y)*Math.min(1,acc);
    const gm=Math.hypot(P._glv.x,P._glv.y);
    P.moving = P.rollT<=0 && gm>0.4;
    if(P.moving){ moveEntity(P, P._glv.x*dt, P._glv.y*dt, 0.28); P.anim+=gm*dt*3.1;
      P.stepT=(P.stepT||0)+dt; if(P.stepT>0.27){ P.stepT=0; Snd.step&&Snd.step(T.ICE); } }
  } else {
  if(P._glv){ P._glv.x=0; P._glv.y=0; }
  if(P.slideDir) P.slideDir=null;
  if(P.rollT<=0) P.moving = ml>0.05 && !dlg.open;
  if(P.moving && P.rollT<=0){
    mx/=ml; my/=ml;
    // a mounted rider can't take the water - stepping toward light water slips you
    // off Kiko and onto your board, so the windsurf always works even while riding
    if(P.riding && P.unlocked && P.unlocked.surf){
      const ax=Math.floor(P.x+mx*0.5), ay=Math.floor(P.y+my*0.5);
      if(inb(ax,ay) && tileAt(ax,ay)===T.SHALLOW){
        P.riding=0; if(typeof updateMountBtn==='function') updateMountBtn();
        // silently slip off the mount onto the board - no toast, by request
      }
    }
    const curTile=tileAt(Math.floor(P.x),Math.floor(P.y));
    const onWater=curTile<=T.SHALLOW;
    // the Drowned Vault's Tide Race is a fall hazard, not sailing water: no board, no dive here -
    // touch it grounded and you plunge (see updateBarikDeep). The water is non-solid, so a dash
    // still carries you across; disabling surf/dive only stops the sail and the skim-boost.
    const drownedVault=(G.worldId==='barikdeep');
    const canSurf=P.unlocked&&P.unlocked.surf&&!P.riding&&!drownedVault;
    const canDive=P.unlocked&&P.unlocked.dive&&!P.riding&&!drownedVault;
    // DIVING: you're submerged whenever you have the gift and stand over the deep water
    // (where the board can't go). Swimming under is a touch slower than a surf skim.
    P.diving = !!(canDive && curTile===T.DEEP);
    const sp=P.speed*(curTile===T.PATH?1.12:1)
      *(P.riding? (P.unlocked&&P.unlocked.moa?2.1:1.55) :1)
      *(onWater&&canSurf&&!P.diving?1.8:1)
      *(P.diving?0.82:1)
      *(has('boots',1)?1.14:1);
    moveEntity(P, mx*sp*dt, my*sp*dt, 0.28, canSurf, canDive);
    if(onWater&&canSurf&&!P.diving&&Math.random()<dt*14)
      G.parts.push({x:P.x+rnd(-0.3,0.3),y:P.y+rnd(0,0.3),vx:-mx*0.8+rnd(-0.4,0.4),vy:-my*0.8+rnd(-0.4,0.4),life:0.35,color:'#eaf6ff',size:2.4,grav:0});
    if(P.diving&&Math.random()<dt*12)   // rising air-bubbles trail the diver
      G.parts.push({x:P.x+rnd(-0.25,0.25),y:P.y+rnd(-0.2,0.2),vx:rnd(-0.15,0.15),vy:-rnd(0.4,0.9),life:rnd(0.4,0.9),color:'rgba(220,240,255,0.7)',size:rnd(1.5,3),grav:-0.04});
    P.dir={x:mx,y:my}; P.anim+=sp*dt*3.1; // stride matches ground covered - no foot-sliding
    P.stepT=(P.stepT||0)+dt;
    if(P.stepT>0.27){ P.stepT=0;
      const ut=tileAt(Math.floor(P.x),Math.floor(P.y));
      Snd.step(ut);
      G.parts.push({x:P.x+rnd(-0.15,0.15),y:P.y+rnd(-0.15,0.15),vx:rnd(-0.3,0.3),vy:rnd(-0.3,0.3),
        life:0.35,size:2.6,color: ut===T.SAND?'rgba(226,207,147,0.7)': ut===T.PATH?'rgba(180,160,130,0.6)':'rgba(120,150,90,0.55)'});
    }
    if(P.fishing){ P.fishing=null; addFloat('line reeled in',P.x,P.y-1.3,'#c9b990'); }
  }
  }
  P.wellCd=Math.max(0,(P.wellCd||0)-dt);
  P.springCd=Math.max(0,(P.springCd||0)-dt);   // the hot-spring rest recharges
  P.comboT=Math.max(0,(P.comboT||0)-dt); if(P.comboT===0) P.combo=0;
  P.atkCd=Math.max(0,P.atkCd-dt);
  P.swing=Math.max(0,P.swing-dt);
  P.gatherT=Math.max(0,(P.gatherT||0)-dt);
  P.hurtT=Math.max(0,P.hurtT-dt);
  P.healCd=Math.max(0,(P.healCd||0)-dt);   // draughts share a short cooldown - no chugging mid-swing
  if((P.empowerT||0)>0){ P.empowerT-=dt; if(P.empowerT<=0){ P.empowerT=0; P.empower=0; } } // a riposte window that lapses if unused
  if(P.cheerT) P.cheerT=Math.max(0,P.cheerT-dt);
  if(input.attack || (input.mouseDown && !isTouch)) tryAttack(input.mouseDown);
  // scorpion venom: damage over time, never lethal, times out on its own
  if((P.poisonT||0)>0){
    P.poisonT-=dt; P._venAcc=(P._venAcc||0)+dt;
    if(P._venAcc>=1){ P._venAcc-=1;
      const vd=Math.min(3, Math.max(0,P.hp-1));
      if(vd>0){ P.hp-=vd; addFloat('-'+vd+' venom',P.x,P.y-1.4,'#8ae06a',0.95);
        burst(P.x,P.y-0.6,'#6fbf4e',4,1.2); refreshUI(); } }
    if(P.poisonT<=0){ P.poisonT=0; P._venAcc=0; addFloat('venom fades',P.x,P.y-1.7,'#bfe8a8',0.9); }
  }
  // prying open a chest takes a moment; stepping away or a hit interrupts
  if(P.openCh){
    const ob=P.openCh.b;
    if(P.moving || dist(P.x,P.y,ob.x,ob.y)>2.1) P.openCh=null;
    else { P.openCh.t+=dt;
      if(P.openCh.t>=P.openCh.dur){ P.openCh=null; openChest(ob); } }
  }
  // training drills: strikes, combos, footwork
  if(TRAIN){
    const dums=G.mobs.filter(m=>m.kind==='dummy');
    const dmgDone=dums.reduce((a,m)=>a+(m.maxhp-m.hp),0)-TRAIN.dmg0;
    TRAIN.combo=Math.max(TRAIN.combo,P.combo||0);
    // ARENA: keep the trainee inside the ring - clamp them back rather than abandon
    { const R=6.2, ax=P.x-TRAIN.x, ay=P.y-TRAIN.y, ad=Math.hypot(ax,ay);
      if(ad>R){ P.x=TRAIN.x+ax/ad*R; P.y=TRAIN.y+ay/ad*R; P.click=null; } }
    if(TRAIN.who==='aelin'){
      // The Spire lesson is pure spellwork - no footwork gates (no dodge-roll to
      // learn here). Land 5 staff casts on the practice dummy and the weave lifts
      // you a whole magic level. Gated to once per day back in aelinStudy.
      if((TRAIN.casts||0)>=5){
        TRAIN=null; for(const m of dums){ m.hp=m.maxhp; }
        P.prog=P.prog||{}; P.prog.spireDay=(P.prog.dayN||1);          // today's lesson is spent
        P.prog.spireTrainedEver=1;                                    // the Spire door now knows you
        const mg=P.skills.magic; addXP('magic', Math.max(160, xpForLevel(mg.lvl)-mg.xp));  // guarantee a level
        gainLXP(80);
        toast('<b>Aelin smiles.</b> “Five true casts - the weave knows your hand now, and that\'s my lesson done. Now step <b>inside the Spire</b> and lay both hands on the <b>orb</b> - it keeps a prize for a student who\'s earned it.”',6200);
        Snd.levelup();
      }
    }
    else if(TRAIN.stage===0 && dmgDone>=30){ TRAIN.stage=1; Snd.quest();
      toast('<b>Good.</b> Now chain it: land a <b>COMBO x2</b> without pausing between strikes.',4400); }
    else if(TRAIN.stage===1 && TRAIN.combo>=2){ TRAIN.stage=2;
      if(TRAIN.who==='rook'){ Snd.quest();
        toast('<b>Sharp.</b> Now <b>footwork</b>: circle <b>BEHIND</b> a dummy and strike - a blow from behind bites <b>half again as deep</b>.',5200); } }
    else if(TRAIN.stage===2 && (TRAIN.who!=='rook' || (TRAIN.backstabs||0)>=1)){
      const who=TRAIN.who; TRAIN=null;
      for(const m of dums){ m.hp=m.maxhp; }
      if(who==='sable'){ addXP('archery',160); gainLXP(120);
        toast('<b>Sable nods once.</b> \u201cBreath in, world out, loose.\u201d <i>(+160 Archery XP, +120 XP)</i>',5200); }
      else if(who==='rook'){ addXP('melee',150); gainLXP(120);
        toast('<b>Rook nods.</b> \u201cStrike, chain, move. That is the whole art.\u201d <i>(+150 Melee XP, +120 XP)</i>',5200); }
      else { addXP('magic',150); gainLXP(120);
        toast('<b>Aelin smiles.</b> \u201cThe weave rewards a moving target.\u201d <i>(+150 Magic XP, +120 XP)</i>',5200); }
      Snd.levelup();
    }
  }
  P.stillT = P.moving? 0 : (P.stillT||0)+dt; // how long we've truly stood still
  P.moveT  = P.moving? (P.moveT||0)+dt : 0;   // ...and how long we've been under way (launch spring)
  // regen
  P.mp=Math.min(P.maxmp,P.mp+dt*2.6);
  // the quiver slowly refills toward its cap (~1 shaft every 1.7s) so the bow is a
  // rationed burst weapon, never a permanent dead-end
  if((P.arrows||0) < (P.maxArrows||20)){
    const before=Math.floor(P.arrows||0);
    P.arrows=Math.min(P.maxArrows||20, (P.arrows||0)+dt*0.6);
    if(Math.floor(P.arrows) !== before) refreshUI();
  }
  if(G.time-P.lastCombat>5 && !dlg.open) P.hp=Math.min(P.maxhp,P.hp+dt*2.2); // no mending mid-conversation
  // fishing timer
  if(P.fishing){
    const f=P.fishing; f.t+=dt;
    if(!f.bit && f.t>=f.biteAt){ f.bit=true; f.bitT=0; Snd.pickup(); }
    if(f.bit){ f.bitT+=dt; if(f.bitT>1.0){ P.fishing=null; addFloat('it got away…',P.x,P.y-1.4,'#c9b990'); Snd.splash(); } }
  }
  // pickups & hint zones
  for(const pt of G.parts){
    if(pt.pickup && dist(P.x,P.y,pt.x,pt.y)<0.7){
      if(pt.pickup==='gold'){ giveGold(pt.n); pt.life=0; }
      else if(pt.pickup==='arrows'){
        // gather dropped shafts into the quiver. If it's full (or you've no bow
        // yet) leave them lying so nothing is wasted - grab them once there's room.
        if(P.unlocked && P.unlocked.bow && (P.arrows||0) < (P.maxArrows||20)){
          P.arrows=Math.min(P.maxArrows||20,(P.arrows||0)+pt.n);
          addFloat('+'+pt.n+' arrows',P.x,P.y-1.4,'#d9a441'); Snd.pickup(); refreshUI(); pt.life=0;
        }
      }
      else { P.hp=Math.min(P.maxhp,P.hp+pt.n); addFloat('+'+pt.n+' HP',P.x,P.y-1.4,'#7fe07f'); Snd.pickup(); refreshUI(); pt.life=0; }
    }
  }
  if(ZONES.springs){
    const sd=dist(P.x,P.y,ZONES.springs.x,ZONES.springs.y);
    if(sd<ZONES.springs.r){
      if(qs('springs')==='active' && !(P.prog.springs)){ P.prog.springs=1; updateQuestUI();
        toast('<b style="color:var(--ember)">Ember Springs discovered!</b> Return to Maren.',4200); Snd.quest(); }
      hintOnce('springs','The <b>Ember Springs</b> - warm water rises from the island\'s heart. Wade at the pool\'s edge to mend your wounds.');
      if(sd<2.4){
        P.hp=Math.min(P.maxhp,P.hp+6*dt);
        if(Math.random()<0.15) G.parts.push({x:P.x+rnd(-0.6,0.6),y:P.y+rnd(-0.6,0.6),
          vx:rnd(-0.15,-0.05),vy:rnd(-0.15,-0.05),life:rnd(1.2,2),color:'rgba(230,240,245,0.35)',size:5,grav:-0.15});
      }
    }
    if(sd<ZONES.springs.r+2 && Math.random()<0.06)
      G.parts.push({x:ZONES.springs.x+rnd(-1.5,1.5),y:ZONES.springs.y+rnd(-1.5,1.5),
        vx:rnd(-0.1,0),vy:rnd(-0.12,-0.04),life:rnd(1.5,2.5),color:'rgba(225,235,240,0.28)',size:6,grav:-0.15});
  }
  // (No hint at the warded causeway wall - the player is left to find who can open
  // it on their own. The wall itself renders as an obvious barrier.)
  if(ZONES.ruins && dist(P.x,P.y,ZONES.ruins.x,ZONES.ruins.y)<11) hintOnce('ruins','The Old Ruins - the air is cold here. Bones walk.');
  if(ZONES.forest && dist(P.x,P.y,ZONES.forest.x,ZONES.forest.y)<8) hintOnce('forest','The Whisperwood. Wolves prowl; bluecaps glow in the shade.');
}

function updateNPCs(dt){
  const night=isNight();
  // during a training drill the yard clears - only the trainer is present (n.id===TRAIN.who)
  for(const n of G.npcs){
    let hide = n.throne ? true : ((TRAIN && n.id!==TRAIN.who) || (night && !n.nightOwl));   // throne-bound NPCs (the King) never appear in the open city
    // ...but a quest-giver you have a completed quest ready to report to keeps a light lit
    // past dusk, so nightfall never strands a finished quest until dawn. Only overrides a
    // plain night-hide (not the throne-bound or a training-yard clear-out).
    if(hide && night && !n.throne && !(TRAIN && n.id!==TRAIN.who) && npcHasReadyTurnIn(n)) hide=false;
    n.hidden = hide;
  }
  for(const n of G.npcs){
    // NPCs no longer bark idle chatter in floating bubbles over their heads -
    // their lines are heard only when you actually talk to them (see buildDialogContent).
    if(n.hums && !n.hidden){ // the Woodworker hums a tune he can't name (the royal anthem)
      n.humT=(n.humT===undefined? rnd(1,4):n.humT)-dt;
      if(n.humT<=0){ n.humT=rnd(2.6,5.2); addFloat('♪', n.x, n.y-1.9, 'rgba(206,196,232,0.92)', 0.9); }
    }
    n.wt-=dt;
    if(n.wander>0 && n.wt<=0 && !dlg.open){
      n.wt=rnd(2,5);
      const a=Math.random()*TAU, d=rnd(0.5,n.wander);
      n.tx=n.hx+Math.cos(a)*d; n.ty=n.hy+Math.sin(a)*d;
    }
    if(n.tx!=null){
      const dx=n.tx-n.x, dy=n.ty-n.y, l=Math.hypot(dx,dy);
      if(l>0.1){ moveEntity(n,dx/l*1.1*dt,dy/l*1.1*dt); n.anim+=dt*7; n.face={x:dx/l,y:dy/l}; }
      else n.tx=null;
    }
  }
  // Personal space: villagers ease apart so they never pile onto one tile - inn
  // yards and market crowds read as a spread of people, not a heap. Gentle and
  // collision-aware (they still mill and walk), tethered to home so the nudge
  // can never slowly walk anyone off their post, and frozen mid-conversation so
  // the person you're speaking to holds still.
  if(!dlg.open){
    const SEP=1.5, SEPV=0.85;
    for(const n of G.npcs){
      if(n.hidden || n.throne) continue;
      let px=0, py=0, near=0;
      for(const m of G.npcs){
        if(m===n || m.hidden || m.throne) continue;
        const dx=n.x-m.x, dy=n.y-m.y, d2=dx*dx+dy*dy;
        if(d2>0.0001 && d2<SEP*SEP){ const d=Math.sqrt(d2), w=(SEP-d)/SEP; px+=dx/d*w; py+=dy/d*w; near++; }
      }
      if(near){
        const l=Math.hypot(px,py)||1; moveEntity(n,(px/l)*SEPV*dt,(py/l)*SEPV*dt);
        if(n.hx!=null){ const hd=Math.hypot(n.x-n.hx,n.y-n.hy), lim=(n.wander||0)+1.6;
          if(hd>lim){ n.x=n.hx+(n.x-n.hx)/hd*lim; n.y=n.hy+(n.y-n.hy)/hd*lim; } }
      }
    }
  }
  updateCritters(dt);
  // Pip
  const c=G.cat; if(!c) return;
  c.anim+=dt;
  if(c.following){
    const d=dist(c.x,c.y,P.x,P.y);
    if(d>1.2){ const dx=P.x-c.x, dy=P.y-c.y, l=Math.hypot(dx,dy)||1;
      moveEntity(c,dx/l*Math.min(5,d*2.4)*dt, dy/l*Math.min(5,d*2.4)*dt, 0.2); c.face=dx<0?-1:1; }
  } else if(c.homebound){
    const dx=49.7-c.x, dy=61.2-c.y, l=Math.hypot(dx,dy);
    if(l>0.4){ moveEntity(c,dx/l*2*dt,dy/l*2*dt,0.2); c.face=dx<0?-1:1; } else c.homebound=false;
  } else {
    c.wt-=dt;
    if(c.wt<=0){ c.wt=rnd(2,6); c.tx=c.home.x+rnd(-2,2); c.ty=c.home.y+rnd(-2,2); }
    if(c.tx!=null){ const dx=c.tx-c.x, dy=c.ty-c.y, l=Math.hypot(dx,dy);
      if(l>0.15){ moveEntity(c,dx/l*1.4*dt,dy/l*1.4*dt,0.2); c.face=dx<0?-1:1; } else c.tx=null; }
  }
}

/* ---- combat-feel overhaul ----
   Trash-mob fights used to be one identical "walk up, wind up, poke" for every
   melee kind. These two rosters give the common foes real behaviour:
   - LUNGERS close the gap in a fast telegraphed dash you must read and dodge.
   - HEAVIES telegraph a slower, bigger blow and are then rooted in a recovery
     window - the reward for baiting it out is a free punish. */
const LUNGERS={wolf:1,raptor:1,boar:1,brigand:1,raider:1,wraith:1};
const HEAVIES={polarbear:1,minotaur:1,raidcap:1,scorpion:1,gravelord:1};
// Foes bound to Emberwick's gray ruins - the Hollow Spirit's bone-guard, and every
// skeleton / the gravelord up at the barrow - never leave the ruin-stone.
function ruinsBound(m){ return !!(m.hollowGuard || (G.worldId==='isle' && (m.kind==='skeleton'||m.kind==='gravelord'))); }
const ISLE_SKELE_CAP=6;   // keep the barrow from filling with an endless bone-heap if you ignore them
function liveIsleSkeletons(){ let n=0; for(const x of G.mobs) if(x.kind==='skeleton' && !x.dead) n++; return n; }
function updateMobs(dt){
  updateHollowSeal();
  updateHollowFire(dt);
  for(const m of G.mobs){
    if(m.sealed) continue;                 // walled behind the ward-gate - inert until it opens
    if(m.dead){
      if(m.respawnT>0){ m.respawnT-=dt;
        // hold a skeleton's respawn while the barrow is already crowded - no bone-heap
        if(m.respawnT<=0 && m.kind==='skeleton' && G.worldId==='isle' && liveIsleSkeletons()>=ISLE_SKELE_CAP){ m.respawnT=6; }
        else if(m.respawnT<=0 && dist(P.x,P.y,m.hx,m.hy)>10){ m.dead=false; m.hp=m.maxhp; m.x=m.hx; m.y=m.hy; m.state='idle'; }
        else if(m.respawnT<=0) m.respawnT=5;
      }
      continue;
    }
    // While a dialogue is open the world keeps ticking (only story cards pause it),
    // so hold every foe in place - no advancing, no attacking - until it closes. Any
    // wind-up mid-swing is cancelled so nothing lands the instant the dialogue ends.
    if(dlg.open){ m.windup=0; m.swing=0; continue; }
    m.anim+=dt; m.hitCd=Math.max(0,m.hitCd-dt); m.hurtT=Math.max(0,m.hurtT-dt);
    m.swing=Math.max(0,(m.swing||0)-dt);
    // ruins containment: track the last ruin-stone tile a bound foe stood on, and snap
    // it back if anything (a knockback, a stray step) put it out on the grass
    if(ruinsBound(m)){
      if(tileAt(m.x|0,m.y|0)===T.RUIN){ m._rx=m.x; m._ry=m.y; }
      else if(m._rx!=null){ m.x=m._rx; m.y=m._ry; m.tx=null; }
    }
    if((m.stunT||0)>0){ m.stunT-=dt; m.windup=0; }   // stormlight-stunned: no attack this beat
    m.recover=Math.max(0,(m.recover||0)-dt);          // a heavy's post-swing punish window
    // POISE: staggers reset it and lock it out for a beat so nothing gets perma-stunned
    m.poiseCd=Math.max(0,(m.poiseCd||0)-dt);
    if((m.poiseCd||0)<=0) m.poise=Math.max(0,(m.poise||0)-dt*6);
    // Emberdeep: the denned boars keep to the puzzle chambers - they never cross the
    // Dragon Gate line (y=19) into Ashwing's chamber; that fight is the player's alone
    if(G.worldId==='eastdeep' && m.kind==='boar' && m.y<20){ m.y=20; if(m.ty!=null && m.ty<20) m.ty=20; }
    if(m.bat){ m.face=(P.x<m.x?-1:1); continue; }   // fully custom flying AI (see updateUndermaw) - still killable/damageable as a mob
    if(m.stormeye){   // fully custom AI (see updateSkyDungeon) - no generic chase/melee
      if(m.entrance && !m.entranceDone && !G.bossIntro && typeof startBossIntro==='function' && dist(m.x,m.y,P.x,P.y)<11)
        startBossIntro(m,{kind:m.entrance, title:m.entranceTitle, sub:m.entranceSub});   // it descends out of the storm
      m.face=(P.x<m.x?-1:1); continue; }
    if(m.customAI){ m.face=(P.x<m.x?-1:1); continue; }   // bespoke returned-isle bosses: driven by their dungeon's update hook
    const d0=MOBDEF[m.kind], pd=dist(m.x,m.y,P.x,P.y);
    const d={dmg:m.dmg||d0.dmg, speed:m.speed||d0.speed, aggro:m.aggro||d0.aggro};
    if(m.state==='idle'){
      m.noAggroT=Math.max(0,(m.noAggroT||0)-dt);
      if(pd<d.aggro && !P.dead && !inSafeZone(P.x,P.y) && m.noAggroT<=0){
        // a marquee boss ARRIVES with an in-world entrance the first time it's roused;
        // the entrance hands straight to the fight when it finishes (see startBossIntro)
        if(m.entrance && !m.entranceDone && !G.bossIntro && typeof startBossIntro==='function'){
          startBossIntro(m,{kind:m.entrance, title:m.entranceTitle, sub:m.entranceSub}); continue;
        }
        m.state='chase';
        if(m.kind==='boss'){ Snd.boss(); }   // the Hollow Spirit's rise is shown now, not toasted
        else if(m.bigBoss && Snd.boss) Snd.boss(); }
      m.wt-=dt;
      if(m.wt<=0){ m.wt=rnd(2,5); const a=Math.random()*TAU; m.tx=m.hx+Math.cos(a)*1.6; m.ty=m.hy+Math.sin(a)*1.6; }
      if(m.tx!=null){ const dx=m.tx-m.x, dy=m.ty-m.y, l=Math.hypot(dx,dy);
        if(l>0.15 && !((m.snareT||0)>0)){ moveEntity(m,dx/l*d.speed*0.4*dt,dy/l*d.speed*0.4*dt); if(Math.abs(dx)>0.35) m.face=dx<0?-1:1; } else if(l<=0.15) m.tx=null; }
    } else {
      // leash (arena mobs - e.g. the Undermaw bone-yard horde - never leash home; they hound you until felled)
      if(!m.arena && (pd>d.aggro*2.2 || P.dead || dist(m.x,m.y,m.hx,m.hy)>14)){
        m.state='idle';
        m.noAggroT=4; // walk it off: ignore the player while heading home
        if(!m.boss && !m.bigBoss && G.time-(m.leashHealT||0)>10){ // bosses keep their wounds
          m.hp=Math.min(m.maxhp,m.hp+m.maxhp*0.3); m.leashHealT=G.time;
        }
        m.tx=m.hx; m.ty=m.hy; continue;
      }
      const dx=P.x-m.x, dy=P.y-m.y, l=Math.hypot(dx,dy)||1;
      if(Math.abs(dx)>0.35) m.face=dx<0?-1:1; // hysteresis: chasing straight up/down no longer mirror-flips every frame
      if(!m.boss && inSafeZone(P.x,P.y)){ m.state='idle'; m.tx=null; m.windup=0; }
      if((m.snareT||0)>0){ m.snareT-=dt; } // rooted: the weave holds its feet
      const stop = m.boss?1.3 : m.kind==='archer'?6.5 : 0.95;
      // archetypes only reshape ordinary foes - boss variants of these kinds keep their scripted fight
      const heavy = HEAVIES[m.kind] && !m.boss && !m.bigBoss && !m.customAI;
      const lunger = LUNGERS[m.kind] && !m.boss && !m.bigBoss && !m.customAI;
      // stormlight-stunned foes freeze where they stand - no advance and (below) no attack
      if(l>stop && !((m.snareT||0)>0) && !m.rooted && !((m.stunT||0)>0) && !((m.recover||0)>0)){
        const ox2=m.x, oy2=m.y;
        if((m.detourLock||0)>0){
          // committed detour: slide purely along the wall until the lock expires
          m.detourLock-=dt;
          moveEntity(m, -dy/l*d.speed*dt*m.detour, dx/l*d.speed*dt*m.detour);
        } else {
          moveEntity(m, dx/l*d.speed*dt, dy/l*d.speed*dt);
        }
        // ruins-bound foes never leave the gray ruins: a step that would carry one off
        // the ruin-stone (onto the grass approach) is reverted at once, so they hold the
        // barrow and never chase you out onto the meadow
        if(ruinsBound(m) && tileAt(m.x|0, m.y|0)!==T.RUIN){ m.x=ox2; m.y=oy2; }
        if(Math.hypot(m.x-ox2,m.y-oy2) < d.speed*dt*0.2){
          // no progress: flip the shoulder and commit to the slide
          m.detour = -(m.detour||(((m.x*7+m.y*13)|0)%2? 1:-1));
          m.detourLock=0.7;
          m.wedgeT=(m.wedgeT||0)+dt;
          if(m.wedgeT>3){ m.wedgeT=0; m.detourLock=0; unstickEntity(m); }
        } else if((m.detourLock||0)<=0){ m.wedgeT=0; }
      }
      // telegraphed strike: wind up, then the blow lands - roll through it!
      if(l<1.15+(m.boss?0.5:0) && m.hitCd<=0 && !P.dead && !(m.windup>0) && !((m.stunT||0)>0) && !((m.recover||0)>0)){
        // Wind-ups are long enough to read: a red ! builds, then the last PARRY_WIN
        // seconds flare WHITE (the parry moment). HEAVIES telegraph slowest and hit hard.
        // wraiths get a short, tell-less wind-up (no parry cue, no red !); everything else telegraphs to read
        m.windup = m.kind==='wraith'?0.34 : m.elite?0.42 : m.boss?0.58 : (heavy?0.66:0.5);
        m.hitCd= m.boss?1.1:1.25;
      }
      if(m.windup>0){
        const preFlash = m.windup > PARRY_WIN;
        m.windup-=dt;
        // ring the parry-cue the instant the tell flares white (once per swing, close foes only) - never for the un-parryable wraith
        if(preFlash && m.windup<=PARRY_WIN && l<9 && m.kind!=='wraith'){ Snd.tone&&Snd.tone(1180,0.05,'square',0.022,240); }
        if(m.windup<=0){
          m.windup=0; m.swing=0.3;
          if(l<1.95+(m.boss?0.6:0) && !P.dead) hurtPlayer(heavy?Math.round(d.dmg*1.25):d.dmg, m);
          if(heavy) m.recover=0.8;   // rooted after the big swing - punish it
        }
      }
      // LUNGER archetype: a fast telegraphed dash that closes the gap - dodge it or reposition
      if(lunger && !((m.stunT||0)>0) && !((m.recover||0)>0)){
        m.lungeCd=(m.lungeCd||rnd(2.5,4.5))-dt;
        if(m.lungeCd<=0 && (m.lunge||0)<=0 && l>2.0 && l<6.5){
          m.lungeCd=rnd(3,5); m.lunge=0.38; m.face=dx<0?-1:1;
          if(m.kind!=='wraith') addFloat('LUNGE!', m.x, m.y-2.2, '#ffcf8a', 1.0);   // the wraith closes in silence - no shout, no !
          if(Snd.noise) Snd.noise(0.20,0.06,300,0.5);
        }
        if((m.lunge||0)>0){ m.lunge-=dt;
          moveEntity(m, dx/l*d.speed*2.4*dt, dy/l*d.speed*2.4*dt);
          if(Math.random()<0.5) G.parts.push({x:m.x,y:m.y,vx:-dx/l,vy:-dy/l,life:0.28,color:'rgba(200,190,160,0.5)',size:2.4});
        }
      }
      if(m.kind==='archer'){
        // kite: back away if crowded, loose bone arrows from range
        if(l<3 && l>0.01) moveEntity(m, -dx/l*d.speed*1.1*dt, -dy/l*d.speed*1.1*dt);
        m.shootCd-=dt;
        if(m.shootCd<=0 && l>2 && l<10.5){
          m.shootCd=2.3; m.swing=0.3;
          G.projs.push({kind:'bone',x:m.x,y:m.y-0.8,vx:dx/l*8,vy:dy/l*8,life:1.7,dmg:d.dmg,from:'mob',owner:m});
          Snd.bow();
        }
      }
      if(m.kind==='mage'){
        // Vath kites and flings hex bolts - sometimes a three-fanned volley
        if(l<3.5 && l>0.01) moveEntity(m, -dx/l*d.speed*1.15*dt, -dy/l*d.speed*1.15*dt);
        m.shootCd-=dt;
        if(m.shootCd<=0 && l>1.6 && l<11){
          m.shootCd=1.9; m.swing=0.3;
          const spread = m.hp<m.maxhp*0.5 ? [-0.22,0,0.22] : [0]; // desperate volleys when hurt
          for(const off of spread){ const ca=Math.atan2(dy,dx)+off;
            G.projs.push({kind:'hex',x:m.x,y:m.y-0.9,vx:Math.cos(ca)*7.5,vy:Math.sin(ca)*7.5,life:1.7,dmg:Math.round(d.dmg*0.7),from:'mob'}); }
          if(Snd.magic) Snd.magic();
        }
      }
      // THE MAW-STALKER pounces: it periodically telegraphs, then dashes hard at you and
      // keeps chasing - the lunge is a fast closing burst (its telegraphed slam still lands
      // the blow, which you can dodge-roll through).
      if(m.undermawBeast && !m.introKind){
        m.lungeCd=(m.lungeCd||rnd(3,4))-dt;
        if(m.lungeCd<=0 && (m.lunge||0)<=0 && l>2.0 && l<8.5 && !((m.stunT||0)>0)){
          m.lungeCd=rnd(3.2,4.8); m.lunge=0.5; m.face=dx<0?-1:1;
          addFloat('SKITTER', m.x, m.y-2.8, '#ffd08a', 1.2);
          if(Snd.noise) Snd.noise(0.30,0.07,270,0.6);
          G.shake=Math.max(G.shake||0,0.2);
        }
        if((m.lunge||0)>0){ m.lunge-=dt;
          moveEntity(m, dx/l*d.speed*3.0*dt, dy/l*d.speed*3.0*dt);   // the pounce - a hard closing dash
          for(let k=0;k<2;k++) G.parts.push({x:m.x+rnd(-0.4,0.4),y:m.y,vx:-dx/l*rnd(0.5,1.1),vy:-dy/l*rnd(0.5,1.1),life:0.3,color:'rgba(210,180,120,0.6)',size:2.8});
        }
      }
      if(m.kind==='frostwarden'){
        // a slow siege-engine of ice: closes ground and flings frost shards,
        // fanning wider volleys as the binding drives it harder (lower HP)
        m.shootCd-=dt;
        if(m.shootCd<=0 && l>2 && l<12){
          m.shootCd = m.hp<m.maxhp*0.5? 1.6 : 2.4; m.swing=0.3;
          const spread = m.hp<m.maxhp*0.5? [-0.26,0,0.26] : [0];
          for(const off of spread){ const ca=Math.atan2(dy,dx)+off;
            G.projs.push({kind:'shard',x:m.x,y:m.y-1.1,vx:Math.cos(ca)*8,vy:Math.sin(ca)*8,life:1.8,dmg:Math.round(d.dmg*0.7),from:'mob'}); }
          if(Snd.magic) Snd.magic();
        }
        if((m.swing||0)>0.14 && Math.random()<0.5){ // frost breath as the slam lands
          G.parts.push({x:m.x+rnd(-1.5,1.5),y:m.y-0.6,vx:rnd(-0.4,0.4),vy:-rnd(0.3,0.9),life:0.5,color:Math.random()<0.5?'#bfe8ff':'#e6f6ff',size:rnd(2,4),grav:0.04}); }
      }
      if(m.kind==='leviathan' && !m.freed){
        // bound in the deep - it never leaves the water, but it GIVES CHASE now: it swims
        // hard after you across the light-water arena to close to slam range, still hurling
        // spouts and rearing to slam. Flee onto the breakwater and it can't follow you up.
        m.rooted=1;   // generic land-chase stays off; it swims via the water-only step here
        if(l>2.4 && !((m.stunT||0)>0) && !((m.snareT||0)>0)){
          const spd=(m.hp<m.maxhp*0.5)?2.6:1.8;   // enraged and faster once wounded
          // it swims through ANY water - the surf shallows or the dark deep beyond the
          // breakwater - so it can chase you across the whole harbour; it just can't crawl onto land
          const swim=(nx,ny)=>{ const tx=nx|0, ty=ny|0; return inb(tx,ty) && tileAt(tx,ty)<=T.SHALLOW; };
          const sx=m.x+dx/l*spd*dt; if(swim(sx,m.y)) m.x=sx;
          const sy=m.y+dy/l*spd*dt; if(swim(m.x,sy)) m.y=sy;
        }
        m.shootCd-=dt;
        if(m.shootCd<=0 && l>1.3 && l<16){
          m.shootCd = m.hp<m.maxhp*0.5? 1.1 : 1.7; m.swing=0.3;
          // aimed spouts - a tight cluster, denser and wider once wounded
          const spread = m.hp<m.maxhp*0.5? [-0.5,-0.25,0,0.25,0.5] : [-0.2,0,0.2];
          for(const off of spread){ const ca=Math.atan2(dy,dx)+off;
            G.projs.push({kind:'spout',x:m.x,y:m.y-1.0,vx:Math.cos(ca)*7.5,vy:Math.sin(ca)*7.5,life:2.2,dmg:Math.round(d.dmg*0.7),from:'mob'}); }
          if(Snd.splash) Snd.splash();
        }
        // THE BRINE BARRAGE - a second ranged attack: it rears and hurls a sweeping FAN of
        // spouts across the whole light-water arena, so you can never just sit and trade at range.
        m.volleyCd=(m.volleyCd||rnd(4,6))-dt;
        if(m.volleyCd<=0 && l<16){
          m.volleyCd = m.hp<m.maxhp*0.5? rnd(3.2,4.4) : rnd(5,7); m.swing=0.35;
          addFloat('BARRAGE', m.x, m.y-3.4, '#8fd8ff', 1.1); G.shake=Math.max(G.shake,0.2);
          const base=Math.atan2(dy,dx), n=(m.hp<m.maxhp*0.5)?9:7;
          for(let i=0;i<n;i++){ const ca=base+(i-(n-1)/2)*0.28;
            G.projs.push({kind:'spout',x:m.x,y:m.y-1.0,vx:Math.cos(ca)*6.2,vy:Math.sin(ca)*6.2,life:2.6,dmg:Math.round(d.dmg*0.6),from:'mob'}); }
          if(Snd.splash) Snd.splash();
        }
        m.lungeCd=(m.lungeCd||3)-dt;
        if(m.lungeCd<=0 && l<9){
          m.lungeCd=rnd(3.6,5.4); m.lunge=0.55;
          addFloat('SURGE', m.x, m.y-3.2, '#8fd8ff', 1.2); G.shake=Math.max(G.shake,0.24);
          if(Snd.splash) Snd.splash();
        }
        if((m.lunge||0)>0){ m.lunge-=dt;
          if(m.lunge<=0 && l<2.6 && !P.dead) hurtPlayer(Math.round(d.dmg*1.2), m); // the slam lands
          for(let k=0;k<3;k++) G.parts.push({x:m.x+rnd(-2,2),y:m.y+rnd(-1,1),vx:rnd(-0.4,0.4),vy:-rnd(0.5,1.4),life:0.55,color:Math.random()<0.5?'#bfe8ff':'#e6f6ff',size:rnd(2,4.5),grav:0.06}); }
      }
      if(m.kind==='dragon'){
        // periodic charging lunge with a roar
        m.lungeCd=(m.lungeCd||4)-dt;
        if(m.lungeCd<=0 && l>2.2 && l<9){
          m.lungeCd=rnd(4,6); m.lunge=0.5;
          addFloat('ROAR', m.x, m.y-3.4, '#ff9a5a', 1.3);
          if(Snd.noise) Snd.noise(0.32,0.08,240,0.7);
          G.shake=Math.max(G.shake,0.25);
        }
        if((m.lunge||0)>0){ m.lunge-=dt;
          moveEntity(m, dx/l*d.speed*2.4*dt, dy/l*d.speed*2.4*dt);
          for(let k=0;k<2;k++) G.parts.push({x:m.x+rnd(-1,1),y:m.y-0.6,vx:0,vy:-rnd(0.5,1.2),
            life:0.5,color:Math.random()<0.5?'#ff8a44':'#ffd24a',size:rnd(2,4),grav:-0.1});
        }
        // fire-breath flourish as the bite lands
        if((m.swing||0)>0.15 && Math.random()<0.7){ const ba=Math.atan2(dy,dx)+rnd(-0.35,0.35), rr=rnd(0.6,3.6);
          G.parts.push({x:m.x+Math.cos(ba)*rr, y:m.y-0.6+Math.sin(ba)*rr*0.7, vx:Math.cos(ba)*1.7, vy:Math.sin(ba)*1.7,
            life:0.42, color:Math.random()<0.5?'#ff7a1e':'#ffd24a', size:rnd(2.5,5), grav:0}); }
      }
      if(m.kind==='boss'){ // the Hollow Spirit alone raises bone and calls the dead
        m.shootCd-=dt;
        if(m.shootCd<=0 && l>2){
          m.shootCd=2.6;
          G.projs.push({kind:'bone',x:m.x,y:m.y-0.8,vx:dx/l*7,vy:dy/l*7,life:1.8,dmg:12,from:'mob',owner:m});
          Snd.bow();
        }
        if(!m.summoned[0] && m.hp<m.maxhp*0.66){ m.summoned[0]=true; bossSummon(m); }
        if(!m.summoned[1] && m.hp<m.maxhp*0.33){ m.summoned[1]=true; bossSummon(m); }
      }
    }
  }
}
function bossSummon(m){
  // never conjure past the barrow's cap - the King only tops the ranks back up
  const room = ISLE_SKELE_CAP - liveIsleSkeletons();
  if(room<=0) return;
  toast('<b style="color:#c79bff">“Rise, my court!”</b>');
  for(let i=0;i<Math.min(2,room);i++){ const s=spawnMob('skeleton', m.x+rnd(-2,2), m.y+rnd(1,2.5));
    if(s){ s.state='chase'; s.respawnT=-1; s.hollowGuard=true; s.hx=s.x; s.hy=s.y; burst(s.x,s.y-0.4,'#c79bff',12); } }
  Snd.magic();
}

function updateProjs(dt){
  for(const p of G.projs){
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
    // fake-3D arc (item 3): physical arcing shots ride a parabola in p.z. Purely
    // visual - collisions still use the flat (x,y), so gameplay is untouched.
    if(p.z0==null){ p.z0=p.life+dt; p.arc=(p.kind==='arrow'||p.kind==='bone'||p.kind==='shard'); }
    if(p.arc){ const f=1-Math.max(0,p.life)/p.z0; p.z=Math.sin(Math.PI*Math.min(1,f))*(p.z0*15); }
    if(p.kind==='bolt'&&Math.random()<0.6) G.parts.push({x:p.x,y:p.y-0.4,vx:rnd(-0.5,0.5),vy:rnd(-0.5,0.2),life:0.3,color:'#ffb26b',size:3,grav:0});
    if(p.kind==='snarebolt'&&Math.random()<0.6) G.parts.push({x:p.x,y:p.y-0.4,vx:rnd(-0.5,0.5),vy:rnd(-0.5,0.2),life:0.32,color:'#6fe0c8',size:3,grav:0});
    if(p.kind==='hex'&&Math.random()<0.6) G.parts.push({x:p.x,y:p.y-0.4,vx:rnd(-0.5,0.5),vy:rnd(-0.5,0.2),life:0.3,color:'#c77bff',size:3,grav:0});
    if(p.kind==='arrow'&&Math.random()<0.5) G.parts.push({x:p.x,y:p.y-0.35,vx:0,vy:0,life:0.18,color:'rgba(230,225,205,0.55)',size:2});
    const tx=Math.floor(p.x), ty=Math.floor(p.y);
    // a player shot striking a ward-eye mechanism works its gate (checked before the wall-kill so a
    // wall-mounted eye still registers)
    if(p.from==='player'){
      let struck=false;
      for(const d of G.decor){ if(d.kind==='shoottarget' && !d.hit && !d.thornbud && dist(p.x,p.y,d.x,d.y-0.3)<0.75){
        if(typeof hitShootTarget==='function') hitShootTarget(d); p.life=0; struck=true; break; } }
      if(struck) continue;
    }
    if(G.solid[ty*MAPW+tx]===1 && tileAt(tx,ty)>=T.SAND){ p.life=0; burst(p.x,p.y-0.3,'#c9b990',4,1.5); continue; }
    if(p.from==='player'){
      // A homing riposte (a parried bone sent back at its thrower) curves toward its
      // mark each frame and phases through every other mob until it reaches him.
      if(p.homeTo){
        if(p.homeTo.dead || p.homeTo.sealed){ p.homeTo=null; }   // thrower fell - collide normally again
        else { const sp=Math.hypot(p.vx,p.vy)||9, ddx=p.homeTo.x-p.x, ddy=(p.homeTo.y-0.3)-p.y, dl=Math.hypot(ddx,ddy)||1;
          p.vx=ddx/dl*sp; p.vy=ddy/dl*sp; }
      }
      for(const m of G.mobs){
        if(m.dead||m.sealed) continue;
        if(p.homeTo && m!==p.homeTo) continue;   // seeking the thrower - ignore bystanders
        if(dist(p.x,p.y,m.x,m.y-0.3)<0.6){
          if(p.aoe){ for(const m2 of G.mobs){ if(!m2.dead && !m2.sealed && dist(p.x,p.y,m2.x,m2.y)<p.aoe){
              damageMob(m2,p.dmg,{x:p.vx/10,y:p.vy/10},p.skill);
              if(p.snare && !isBossMob(m2)){ m2.snareT=p.snare; m2.windup=0;
                burst(m2.x,m2.y-0.3,'#6fe0c8',10,2); }
              if(p.stun && !isBossMob(m2)){ m2.stunT=Math.max(m2.stunT||0,p.stun); m2.windup=0;
                burst(m2.x,m2.y-0.3,'#eae0ff',8,2); } } }
            burst(p.x,p.y-0.3,p.snare?'#6fe0c8':'#ff9a3c',14,3); }
          else { damageMob(m,p.dmg,{x:p.vx/13,y:p.vy/13},p.skill);
            if(p.stun && !isBossMob(m)){ m.stunT=Math.max(m.stunT||0,p.stun); m.windup=0; burst(m.x,m.y-0.3,'#eae0ff',8,2); } }
          p.life=0; break;
        }
      }
    } else if(!P.dead){
      const dP=dist(p.x,p.y,P.x,P.y-0.3);
      // Parry catches a shot from farther out than a bare hit lands, so a
      // well-timed swing bats the bone away before it ever reaches the body.
      if((P.parryT||0)>0 && !p.parried && dP<1.05 && parryCovers(p.x,p.y)){
          p.parried=1; p.from='player'; p.skill='melee';
          // Send the bone straight back to whoever threw it - so a parried King bone
          // flies at the KING even when his skeletons crowd you. When we know the thrower,
          // the returned bone HOMES to him and punches through lesser bones in the way,
          // so a body-blocking skeleton can't swallow your riposte. No thrower -> just bat
          // it back at the nearest foe the old way.
          const sp=Math.max(Math.hypot(p.vx,p.vy)||8, 9);   // a turned bone flies back briskly
          if(p.owner && !p.owner.dead && !p.owner.sealed){
            p.homeTo=p.owner;   // seek the thrower; collision loop ignores everyone else
            const ddx=p.owner.x-p.x, ddy=(p.owner.y-0.3)-p.y, dl=Math.hypot(ddx,ddy)||1;
            p.vx=ddx/dl*sp; p.vy=ddy/dl*sp;
            p.life=Math.max(p.life, dl/sp + 0.6);   // live long enough to reach a distant King
          } else {
            let tgt=null,tb=99;
            for(const m2 of G.mobs){ if(m2.dead||m2.sealed) continue; const dd=dist(p.x,p.y,m2.x,m2.y); if(dd<tb){tb=dd;tgt=m2;} }
            if(tgt){ const ddx=tgt.x-p.x, ddy=(tgt.y-0.3)-p.y, dl=Math.hypot(ddx,ddy)||1; p.vx=ddx/dl*sp; p.vy=ddy/dl*sp; }
            else { p.vx=-p.vx; p.vy=-p.vy; }
            p.life=Math.max(p.life,1.3);
          }
          p.dmg=Math.round((p.dmg||6)*1.5)+meleeDmg();   // a turned shot hits hard
          onParry(p.x,p.y);
        } else if(dP<0.55){ hurtPlayer(p.dmg,{x:p.x-p.vx,y:p.y-p.vy}); p.life=0; }
    }
  }
  G.projs=G.projs.filter(p=>p.life>0);
}

function updateCritters(dt){
  const cs=G.critters; if(!cs || !cs.length) return;
  for(const c of cs){
    c.anim=(c.anim||0)+dt;
    c.wt-=dt;
    if(c.wt<=0){
      c.wt=rnd(c.kind==='crab'?1.4:2.5, c.kind==='crab'?4:7);
      if(Math.random()<0.4) c.tx=null; // pause to peck / bask
      else { c.tx=c.home.x+rnd(-c.range,c.range); c.ty=c.home.y+rnd(-c.range,c.range); }
    }
    if(c.tx!=null){
      const dx=c.tx-c.x, dy=c.ty-c.y, l=Math.hypot(dx,dy);
      if(l>0.15){ const sp=c.kind==='crab'?1.0:1.35;
        moveEntity(c, dx/l*sp*dt, dy/l*sp*dt, 0.16); c.face=dx<0?-1:1; c.moving=true; }
      else { c.tx=null; c.moving=false; }
    } else c.moving=false;
  }
}
function updateWorld(dt){
  // nodes respawn
  for(const n of G.nodes){
    if(n.dead && !n.gone){ n.respawn-=dt;   // n.gone = a felled gate barrier; never regrows
      if(n.respawn<=0 && dist(P.x,P.y,n.x,n.y)>2.5){ n.dead=false; n.hp=n.maxhp; invalidateScenery();
        if(n.kind==='tree'||n.kind==='rock') setSolid(n.tx,n.ty,1);
        burst(n.x,n.y-0.6,'#9be07f',9,1.6);
        if(dist(P.x,P.y,n.x,n.y)<14) Snd.tone(740,0.09,'sine',0.02,180);
      } }
    if(n.shake) n.shake=Math.max(0,n.shake-dt);
  }
  // crops
  for(const pl of G.plots){
    if(pl.stage>=1 && pl.stage<4){ pl.t+=dt;
      const per = 13 - P.skills.farming.lvl; // faster with skill
      if(pl.t> Math.max(7,per)){ pl.t=0; pl.stage++;
        if(pl.stage===4) burst(pl.x+0.5,pl.y+0.3,'#ffd76a',6,1.2); } }
  }
  // particles & floats
  for(const pt of G.parts){
    if(pt.pickup){ pt.life-=dt; continue; }
    pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.vy+=(pt.grav||0)*dt; pt.life-=dt;
  }
  G.parts=G.parts.filter(p=>p.life>0);
  for(const f of G.floats){ f.y+=f.vy*dt; f.life-=dt; }
  G.floats=G.floats.filter(f=>f.life>0);
  // day cycle - frozen underground: dungeons keep their own fixed light, and time
  // does not pass while you are down there.
  if(!inDungeon()) G.dayT=(G.dayT+dt/G.dayLen)%1;
  // a persisted day counter: any time the clock rolls back to a new dawn - the
  // natural midnight wrap OR a sleep that jumps to morning - a fresh day begins.
  // (Once-per-day things, like training at the Spire, key off this.)
  if(G._lastDayT===undefined) G._lastDayT=G.dayT;
  if(G.dayT < G._lastDayT-0.0001){ P.prog=P.prog||{}; P.prog.dayN=(P.prog.dayN||1)+1; }
  G._lastDayT=G.dayT;
  // gore decals fade, fog rolls
  for(const d of G.decals) d.life-=dt;
  if(G.decals.length && G.decals[0].life<=0) G.decals=G.decals.filter(d=>d.life>0);
  for(const f of G.fogs){ f.life+=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; }
  G.fogs=G.fogs.filter(f=>f.life<f.max);
  // fireflies at dusk/night near forest
  const night = nightAmount();
  if(night>0.35 && G.fireflies.length<40 && Math.random()<0.3){
    const a=Math.random()*TAU, d=rnd(3,9);
    const fx=P.x+Math.cos(a)*d, fy=P.y+Math.sin(a)*d;
    const t=tileAt(Math.floor(fx),Math.floor(fy));
    if(t===T.FOREST||t===T.GRASS) G.fireflies.push({x:fx,y:fy,ph:Math.random()*TAU,life:rnd(6,12)});
  }
  for(const f of G.fireflies){ f.ph+=dt*2; f.life-=dt;
    f.x+=Math.cos(f.ph*0.7)*dt*0.5; f.y+=Math.sin(f.ph*0.9)*dt*0.5; }
  G.fireflies=G.fireflies.filter(f=>f.life>0 && dist(f.x,f.y,P.x,P.y)<16);
  if(G.worldId==='east' && ZONES.caldera && Math.random()<dt*4){
    const CC=ZONES.caldera;
    G.parts.push({x:CC.x+rnd(-2,2), y:CC.y-rnd(0,0.6),
      vx:rnd(-0.3,0.3), vy:-rnd(0.8,1.7), life:rnd(1.6,2.8),
      color:Math.random()<0.35?'#ff8a44':'rgba(90,84,80,0.55)', size:rnd(2,4), grav:-0.12});
  }
  // ---- Act II surface-curse ambience (only while the isle still wears its curse) ----
  // Gated on the isle's own spirit-dungeon clear flag, not just the Veil: winning the dungeon
  // drains the flood / cools the lava / breaks the storm, so the matching weather must stop too -
  // the same revert the terrain (place*Hazard) and the folk's dialogue (update*CurseMood) already do.
  const _curseFlag={east:'ashenForgeDone', wind:'galeDeepDone', main:'barikDeepDone', sky:'stormTempleDone', reach:'tombBossDown'}[G.worldId];
  if(P.story && P.story.vathVeil && !G.interior && _curseFlag && !P.story[_curseFlag]){
    // SUNWARD: drifting ash blown across the whole isle while Kea erupts
    if(G.worldId==='east' && Math.random()<dt*6){
      G.parts.push({x:P.x+rnd(-14,14), y:P.y-rnd(4,10), vx:rnd(-0.4,0.2), vy:rnd(0.5,1.4),
        life:rnd(2,4), color:'rgba(80,74,70,0.5)', size:rnd(1.5,3), grav:0});
    }
    // WINDSURF: sea-spray/mist whipped off the burst race by the gale
    if(G.worldId==='wind' && Math.random()<dt*5){
      G.parts.push({x:P.x+rnd(-13,13), y:P.y-rnd(2,8), vx:rnd(1,3), vy:rnd(-0.3,0.3),
        life:rnd(0.5,1.1), color:'rgba(214,232,242,0.5)', size:rnd(1.5,3), grav:0});
    }
    // BARIK: the flood-curse leaves a cold drizzle hanging over the drowned home shores
    if(G.worldId==='main' && Math.random()<dt*7){
      G.parts.push({x:P.x+rnd(-13,13), y:P.y-rnd(6,12), vx:rnd(-0.3,0.1), vy:rnd(3.5,6),
        life:rnd(0.35,0.7), color:'rgba(170,195,210,0.4)', size:rnd(0.8,1.8), grav:0.3});
    }
    // CLOUDREACH: a storm that won't break - occasional sky-flashes + drifting sparks
    if(G.worldId==='sky'){
      if(Math.random()<dt*8) G.parts.push({x:P.x+rnd(-12,12), y:P.y-rnd(2,9), vx:rnd(-0.3,0.3), vy:rnd(0.6,1.4),
        life:rnd(0.4,0.9), color:Math.random()<0.5?'rgba(190,215,255,0.7)':'rgba(150,200,255,0.5)', size:rnd(1,2.4), grav:0});
      if(Math.random()<dt*0.5){ G.shake=Math.max(G.shake,0.18);
        for(let k=0;k<10;k++) G.parts.push({x:P.x+rnd(-9,9), y:P.y-9+k*0.7, vx:rnd(-0.2,0.2), vy:0, life:0.2, color:k%2?'#eaf2ff':'#bcd8ff', size:rnd(1.5,3), grav:0}); }
    }
    // STORMREACH: the storm-surge won't break - wind-driven rain slants across the drowned coast
    if(G.worldId==='reach'){
      if(Math.random()<dt*9) G.parts.push({x:P.x+rnd(-14,14), y:P.y-rnd(6,12), vx:rnd(1.5,3.5), vy:rnd(4,7),
        life:rnd(0.3,0.6), color:'rgba(180,205,222,0.45)', size:rnd(0.8,1.8), grav:0.25});
      if(Math.random()<dt*4) G.parts.push({x:P.x+rnd(-13,13), y:P.y-rnd(2,7), vx:rnd(1,3), vy:rnd(-0.3,0.3),
        life:rnd(0.5,1.0), color:'rgba(206,224,236,0.45)', size:rnd(1.5,3), grav:0});
      if(Math.random()<dt*0.3) G.shake=Math.max(G.shake,0.14);
    }
  }
  // ---- per-dungeon ambience: each new Act II dungeon breathes its own element ----
  const wid=G.worldId;
  if(wid==='barikdeep'){                         // rising air-bubbles + drifting silt
    if(Math.random()<dt*7) G.parts.push({x:P.x+rnd(-11,11), y:P.y+rnd(-6,4), vx:rnd(-0.1,0.1), vy:-rnd(0.5,1.3), life:rnd(0.8,1.8), color:'rgba(190,225,235,0.5)', size:rnd(1,2.6), grav:-0.03});
  } else if(wid==='winddeep'){                    // wind-blown dust streaking sideways
    if(Math.random()<dt*8) G.parts.push({x:P.x+rnd(-12,12), y:P.y-rnd(1,7), vx:rnd(2,4.5), vy:rnd(-0.2,0.2), life:rnd(0.3,0.7), color:'rgba(220,228,236,0.45)', size:rnd(1,2.2), grav:0});
  } else if(wid==='sunwarddeep'){                 // rising embers off the forge-fire
    if(Math.random()<dt*8) G.parts.push({x:P.x+rnd(-12,12), y:P.y+rnd(-4,4), vx:rnd(-0.3,0.3), vy:-rnd(0.8,2), life:rnd(0.7,1.6), color:Math.random()<0.5?'#ff8a30':'#ffcf60', size:rnd(1.5,3), grav:-0.08});
  } else if(wid==='skydeep'){                      // temple sparks + a caged-thunder flicker
    if(Math.random()<dt*7) G.parts.push({x:P.x+rnd(-12,12), y:P.y-rnd(1,8), vx:rnd(-0.4,0.4), vy:rnd(0.4,1.2), life:rnd(0.3,0.8), color:'rgba(170,205,255,0.6)', size:rnd(1,2.4), grav:0});
    if(Math.random()<dt*0.35) for(let k=0;k<8;k++) G.parts.push({x:P.x+rnd(-8,8), y:P.y-8+k*0.7, vx:rnd(-0.2,0.2), vy:0, life:0.18, color:k%2?'#eaf2ff':'#bcd8ff', size:rnd(1.5,3), grav:0});
  } else if(wid==='embertomb'){                    // slow gold motes drifting off the tideglass
    if(Math.random()<dt*5) G.parts.push({x:P.x+rnd(-11,11), y:P.y+rnd(-5,3), vx:rnd(-0.15,0.15), vy:-rnd(0.2,0.7), life:rnd(1.2,2.4), color:Math.random()<0.5?'rgba(232,202,120,0.5)':'rgba(200,240,255,0.4)', size:rnd(1,2.4), grav:-0.02});
  }
  if(night<0.2) G.fireflies.length=0;
  // night hunters: after dark the wilds send foes; dawn scatters them to mist.
  // NEVER underground (no wraiths in a dungeon) and NEVER in the royal capital -
  // Aldermere is a walled, patrolled city and stays safe after dark. And NEVER in
  // Act II: once you sail out under the Warding Veil the old night-wraiths are gone
  // from the isles entirely (they no longer spawn, see below for dispersing strays).
  const isleCleared = P.story && P.story.bossCleared && P.story.bossCleared[G.worldId];
  const act2 = !!(P.story && P.story.act2);
  if(night>0.55 && !act2 && !G.interior && !inDungeon() && G.worldId!=='crown' && G.worldId!=='sky' && !isleCleared && !P.dead && !inSafeZone(P.x,P.y)){
    let nn=0; for(const m of G.mobs) if(m.night && !m.dead) nn++;
    if(nn<4 && Math.random()<dt*0.22){
      const a2=Math.random()*TAU, dd2=11+Math.random()*4;
      const nx=Math.round(P.x+Math.cos(a2)*dd2), ny=Math.round(P.y+Math.sin(a2)*dd2);
      if(inb(nx,ny) && walkTile(tileAt(nx,ny)) && !solidAt(nx,ny) && !inSafeZone(nx,ny)){
        const m=spawnMob('wraith', nx,ny, Math.random()<0.15);
        m.night=1;
        m.lvl=Math.max(2,Math.min(8,(P.level||1)-2)); // the dark measures you, but stays two rungs under - never scales up to your level
        m.maxhp=90+m.lvl*12; m.hp=m.maxhp;
        burst(nx+0.5,ny,'#8fa8d8',12,2.2);
      }
    }
  }
  if(night<0.15 || act2){
    // dawn quietly clears the night mobs (nightfall/dawn toasts removed by request) -
    // and in Act II any wraith still abroad from an Act I save disperses at once.
    for(const m of G.mobs) if(m.night && !m.dead){ m.dead=true; m.respawnT=1e9; burst(m.x,m.y-0.5,'#c8d8e8',8,1.6); }
  }
  if(G.worldId==='aeriedeep' && typeof updateAerieDeep==='function') updateAerieDeep(dt);
  if(G.worldId==='eastdeep' && typeof updateEastDeep==='function') updateEastDeep(dt);
  if(G.worldId==='milldeep' && typeof updateMillDeep==='function') updateMillDeep(dt);
  if(G.worldId==='undermaw' && typeof updateUndermaw==='function') updateUndermaw(dt);
  if(G.worldId==='frostdeep' && typeof updateFrostDeep==='function') updateFrostDeep(dt);
  if(G.worldId==='frostvault' && typeof updateFrostVault==='function') updateFrostVault(dt);
  if(G.worldId==='reachdeep' && typeof updateReachDeep==='function') updateReachDeep(dt);
  if(G.worldId==='barikdeep' && typeof updateBarikDeep==='function') updateBarikDeep(dt);
  if(G.worldId==='winddeep' && typeof updateWindDeep==='function') updateWindDeep(dt);
  if(G.worldId==='sunwarddeep' && typeof updateSunwardDeep==='function') updateSunwardDeep(dt);
  if(G.worldId==='skydeep' && typeof updateSkyDeep==='function') updateSkyDeep(dt);
  if(G.worldId==='embertomb' && typeof updateEmberTomb==='function') updateEmberTomb(dt);
  if(G.worldId==='skydungeon' && typeof updateSkyDungeon==='function') updateSkyDungeon(dt);
  if(G.worldId==='wind' && typeof updateWind==='function') updateWind(dt);
  G.shake=Math.max(0,G.shake-dt*2.5);
}
function isNight(){ return nightAmount()>0.55; }
function nightAmount(){
  // underground worlds don't have a sky: they hold a fixed ambient darkness (set
  // per-dungeon via WORLD_DEF.dark) and never cycle through day and night.
  if(inDungeon()){ const d=WORLD_DEFS[G.worldId]; return d.dark!=null? d.dark : 0.4; }
  // Emberwick's tutorial shores stay in daylight - no dark, no wraiths, no
  // shuttered shops. Night only falls once you sail beyond the isle.
  if(G.worldId==='isle') return 0;
  // dayT: 0=dawn .25=noon .5=dusk .75=midnight
  const t=G.dayT;
  if(t<0.08) return lerp(0.8,0,t/0.08);
  if(t<0.42) return 0;
  if(t<0.55) return lerp(0,0.8,(t-0.42)/0.13);
  if(t<0.92) return 0.8;
  return lerp(0.8,0.8,0);
}
