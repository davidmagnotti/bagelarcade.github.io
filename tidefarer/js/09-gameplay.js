/* =====================================================================
   GAMEPLAY SYSTEMS
   ===================================================================== */
function moveEntity(e,dx,dy,rad,waterOK){
  rad=rad||0.28;
  let nx=e.x+dx;
  if(!circleBlocked(nx,e.y,rad,waterOK)) e.x=nx;
  let ny=e.y+dy;
  if(!circleBlocked(e.x,ny,rad,waterOK)) e.y=ny;
}
function unstickEntity(e){
  // if an entity is embedded in water or a solid, snap it to the nearest open tile
  if(!circleBlocked(e.x,e.y,0.26)) return false;
  for(let d=0;d<=8;d++) for(let oy=-d;oy<=d;oy++) for(let ox=-d;ox<=d;ox++){
    if(Math.max(Math.abs(ox),Math.abs(oy))!==d) continue;
    const tx=Math.round(e.x)+ox, ty=Math.round(e.y)+oy;
    if(!inb(tx,ty)) continue;
    if(walkTile(tileAt(tx,ty)) && !circleBlocked(tx+0.5,ty+0.5,0.3)){
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
function circleBlocked(x,y,r,waterOK){
  if(palaceBarrier(x,y)) return true;
  for(const [ox,oy] of [[-r,-r],[r,-r],[-r,r],[r,r],[0,-r],[0,r],[-r,0],[r,0]]){
    if(palaceBarrier(x+ox,y+oy)) return true;   // radius-aware straight wall
    const tx=Math.floor(x+ox), ty=Math.floor(y+oy);
    if(solidAt(tx,ty)){
      // the windsurf board rides only the LIGHT water near shore - shallows -
      // never the dark deep-water beyond. That keeps you close to land.
      if(waterOK && inb(tx,ty) && tileAt(tx,ty)===T.SHALLOW) continue;
      return true;
    }
  }
  return false;
}

/* ---- the Hollow King's wall of fire ----------------------------------------
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
    if(b.kind==='pillar'){
      const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.6 && d<bd){ bd=d; best={type:'lore',key:b.loreKey||('stone@'+(G.worldId==='main'?'main':'isle')),o:b,label:'Read'}; }
    }
    if(b.kind==='crypt'){
      const d=dist(P.x,P.y,b.x,b.y+1);
      if(d<2.2 && d<bd){ bd=d; best={type:'lore',key:'crypt',o:b,label:'Read'}; }
    }
    if(b.kind==='woodpile'){
      const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.9 && d<bd){ bd=d; best={type:'lore',key:'woodpile@isle',o:b,label:'Inspect'}; }
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
      if(d<2.3 && d<bd){ bd=d; best={type: b.ember?'emberdungeon':'dungeon',o:b,label:b.exit?'Climb out':'Descend'}; } }
    if(b.kind==='icelever'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.8 && d<bd){ bd=d; best={type:'lever',o:b,label:b.on?'Lever (thrown)':'Pull lever'}; } }
    if(b.kind==='emberlever'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.8 && d<bd){ bd=d; best={type:'emberlever',o:b,label:b.on?'Lever (thrown)':'Pull lever'}; } }
    // the warding runes (Emberdeep puzzle 3) - reachable by E / the touch button,
    // not only a direct tap, so they can actually be pressed on mobile
    if(b.kind==='emberbutton'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<1.8 && d<bd){ bd=d; best={type:'emberbutton',o:b,label:b.set?'Rune (lit)':'Press rune'}; } }
    if(b.kind==='dragonrest'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<3.0 && d<bd){ bd=d; best={type:'dragonrest',o:b,label:'Speak'}; } }
    if(b.kind==='boat'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<2.4 && d<bd){ bd=d; best={type:'boat',o:b,label:'Sail'}; } }
    if(b.kind==='ashwing'){ const d=dist(P.x,P.y,b.x,b.y);
      if(d<3.0 && d<bd){ bd=d; best={type:'ashwing',o:b,label:'Fly home'}; } }
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
  return best;
}

function doInteract(){
  if(G.state!=='play') return;
  if(G.interior){
    if(dlg.open){ closeDialog(); return; }
    const hs=interiorHotspot();
    const ex=G.interior.exit;
    const nearExit=ex && dist(P.x,P.y,ex.x,ex.y)<1.6;
    if(hs && (!nearExit || dist(P.x,P.y,hs.f.x,hs.f.y)<dist(P.x,P.y,ex.x,ex.y))){
      useHotspot(hs); return;
    }
    if(nearExit) exitHouse();
    return;
  }
  if(dlg.open){ closeDialog(); return; }
  const it=nearestInteract();
  if(!it) return;
  if(it.type==='lore'){ facePoint(it.o.x,it.o.y); readLore(it.key); return; }
  if(it.type==='well'){
    if(P.wellCd>0){ toast('The well needs '+Math.ceil(P.wellCd)+'s to refill.'); return; }
    P.hp=P.maxhp; P.mp=P.maxmp; P.wellCd=90;
    addFloat('Fully restored',P.x,P.y-1.8,'#7fe07f',1.2);
    burst(P.x,P.y-0.6,'#9ecbe8',14,2.2); Snd.pickup(); refreshUI();
    return;
  }
  if(it.type==='shop'){ facePoint(it.o.x,it.o.y); openStallShop(it.o); return; }
  if(it.type==='door'){ facePoint(it.o.x,it.o.y); enterHouse(it.o); return; }
  if(it.type==='lair'){ facePoint(it.o.x,it.o.y); enterLair(); return; }
  if(it.type==='cave'){ facePoint(it.o.x,it.o.y); enterCave(); return; }
  if(it.type==='dungeon'){ facePoint(it.o.x,it.o.y); if(it.o.exit) exitFrostDungeon(); else enterFrostDungeon(); return; }
  if(it.type==='emberdungeon'){ facePoint(it.o.x,it.o.y); if(it.o.exit) exitEmberDungeon(); else enterEmberDungeon(); return; }
  if(it.type==='lever'){ facePoint(it.o.x,it.o.y); pullIceLever(it.o); return; }
  if(it.type==='emberlever'){ facePoint(it.o.x,it.o.y); pullEmberLever(it.o); return; }
  if(it.type==='emberbutton'){ facePoint(it.o.x,it.o.y); pressEmberButton(it.o); return; }
  if(it.type==='dragonrest'){ facePoint(it.o.x,it.o.y); if(typeof dragonLairSpeak==='function') dragonLairSpeak(); return; }
  if(it.type==='warp'){ facePoint(it.o.x,it.o.y); warpTo(it.o); return; }
  if(it.type==='aeriedeep'){ facePoint(it.o.x,it.o.y); if(it.o.up) exitAerieDungeon(); else enterAerieDungeon(); return; }
  if(it.type==='tome'){ facePoint(it.o.x,it.o.y); if(typeof destroyTome==='function') destroyTome(it.o); return; }
  if(it.type==='boat'){ facePoint(it.o.x,it.o.y); attemptSail(); return; }
  if(it.type==='ashwing'){ facePoint(it.o.x,it.o.y); askAshwingHome(); return; }
  if(it.type==='chest'){ facePoint(it.o.x,it.o.y); beginOpenChest(it.o); return; }
  if(it.type==='npc'){ facePoint(it.o.x,it.o.y); openDialog(it.o); return; }
  if(it.type==='cat'){
    if(qs('cat')==='active' && !P.petPip){
      P.petPip=true; G.cat.found=true; G.cat.following=true;
      burst(G.cat.x,G.cat.y-0.4,'#ffd76a',12); Snd.quest();
      toast('<b style="color:var(--ember)">Pip found!</b> He trots along behind you - back to Nia!');
      updateQuestUI();
    } else { addFloat('mrrp~',G.cat.x,G.cat.y-1,'#ffd76a'); Snd.pickup(); }
    return;
  }
  if(it.type==='node') hitNode(it.o);
  if(it.type==='plot') usePlot(it.o);
}
function facePoint(x,y){ const dx=x-P.x, dy=y-P.y, l=Math.hypot(dx,dy)||1; P.dir={x:dx/l,y:dy/l}; }
function warpTo(b){ // step through a tunnel to its far end (same world), with a fade
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1; if(Snd.step) Snd.step(8); P.click=null;
  setTimeout(()=>{ P.x=b.tx; P.y=b.ty; P.moving=false;
    G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
    setTimeout(()=>{ if(fd) fd.style.opacity=0; },130); }, 260);
}

/* ---- gathering ---- */
function hitNode(n){
  facePoint(n.x,n.y);
  if((n.kind==='tree' || n.kind==='rock') && !P.kit){
    P._toolT=P._toolT||0;
    if(G.time>P._toolT){ P._toolT=G.time+2.5;
      toast(n.kind==='tree'
        ? 'Bark tears at bare palms - you need an <b>axe</b>. <b>Bram</b> at the forge keeps spares.'
        : 'Stone laughs at fists - you need a <b>pick</b>. <b>Bram</b> at the forge keeps spares.',4200);
    }
    P.click=null;
    return;
  }
  if(P.kit && (n.kind==='tree' || n.kind==='rock')){
    P.gatherT=0.4; P.gatherKind = n.kind==='tree'? 'axe':'pick';
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
  const power = 1 + Math.floor((isTree? P.skills.woodcut.lvl : P.skills.mining.lvl)/3)
              + (isTree? P.tools.axe : P.tools.pick);
  n.hp-=power;
  if(isTree){ Snd.chop(); burst(n.x,n.y-1.2,'#4f9457',5,1.6); n.shake=0.22; }
  else { Snd.mine(); burst(n.x,n.y-0.5,'#c9ced6',5,1.6); n.shake=0.18; }
  if(n.hp<=0){
    n.dead=true; n.respawn= isTree? rnd(20,30) : rnd(26,38); invalidateScenery();
    hintOnce('regrow','The island <b>regrows</b> - felled pines and broken stone return in under a minute.');
    setSolid(n.tx,n.ty,0);
    if(isTree){
      const amt=2+Math.floor(P.skills.woodcut.lvl/2); give('wood',Math.min(amt,4)); addXP('woodcut',8);
      if(n.palm && Math.random()<0.35){ give('coconut',1); addFloat('+1 coconut',n.x,n.y-1.6,'#e8d8a8',1.0); }
      const windfall=Math.random();
      if(windfall<0.16){ give('apple',1); addFloat('+1 apple',n.x,n.y-1.6,'#e0708a',1.0); }
      else if(windfall<0.24){ give('mushroom',1); addFloat('+1 mushroom',n.x,n.y-1.6,'#d8b0c8',1.0); }
      if(n.big && Math.random() < 0.45 + P.tools.axe*0.3 + P.skills.woodcut.lvl*0.03){
        give('hardwood',1); addFloat('+1 hardwood',n.x,n.y-2.2,'#c9a24e',1.1);
        hintOnce('hardwood','<b>Hardwood!</b> Old forest pines hide dense heartwood - Bram forges tools and steel with it.');
      }
    } else {
      const amt=1+Math.floor(P.skills.mining.lvl/2); give('stone',Math.min(amt,3)); addXP('mining',9);
      if(Math.random() < 0.22 + P.tools.pick*0.3 + P.skills.mining.lvl*0.04){
        give('ore',1); addFloat('+1 iron ore',n.x,n.y-2,'#c9ced6',1.1);
        hintOnce('ore','<b>Iron ore!</b> Take it to Bram - two ore and a stick of wood smelt into an iron bar.');
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
  if(P.atkCd>0 || G.state!=='play' || dlg.open || G.interior) return;
  if(!P.unlocked[P.weapon==='melee'?'melee':P.weapon]){
    P._noWpnT=P._noWpnT||0;
    if(G.time>P._noWpnT){ P._noWpnT=G.time+2.5;
      toast('Bare hands won\'t do - <b>Bram\'s forge</b> can arm you. (Quest: <b>Iron in the Fire</b>)'); }
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
    for(const m of G.mobs){ if(m.dead) continue; const d=dist(P.x,P.y,m.x,m.y); if(d<bd){bd=d;bm=m;} }
    aim = bm? {x:bm.x-P.x,y:bm.y-P.y} : {...P.dir};
  }
  const l=Math.hypot(aim.x,aim.y)||1; aim.x/=l; aim.y/=l;
  P.dir={...aim};
  P.lastCombat=G.time;
  if(P.weapon==='melee'){
    P.atkCd=0.42; P.swing=0.3; Snd.hit();
    const finisher=(P.combo||0)>=2;
    const dmgBase= finisher? Math.round(meleeDmg()*1.5) : meleeDmg();
    let hitAny=false;
    for(const m of G.mobs){
      if(m.dead) continue;
      const dx=m.x-P.x, dy=m.y-P.y, d=Math.hypot(dx,dy);
      const reach = finisher? 2.1 : 1.65; // the finisher lunges
      if(d<reach && (dx*aim.x+dy*aim.y)/Math.max(d,0.01) > 0.15){
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
    P.atkCd=0.62; P.swing=0.2; Snd.bow();
    G.projs.push({kind:'arrow',x:P.x,y:P.y-0.4,vx:aim.x*13,vy:aim.y*13,life:1.1,dmg:bowDmg(),from:'player',skill:'archery'});
  } else if(P.weapon==='staff'){
    if(P.mp<8){ toast('Not enough mana - it returns as you breathe.'); P.atkCd=0.3; return; }
    P.mp-=8; P.atkCd=0.7; P.swing=0.3; Snd.magic();
    if(P.spell==='snare' && P.spells && P.spells.snare)
      G.projs.push({kind:'snarebolt',x:P.x,y:P.y-0.5,vx:aim.x*10,vy:aim.y*10,life:1.4,dmg:Math.max(4,Math.round(magicDmg()*0.4)),from:'player',skill:'magic',aoe:1.2,snare:2.5});
    else
      G.projs.push({kind:'bolt',x:P.x,y:P.y-0.5,vx:aim.x*10,vy:aim.y*10,life:1.4,dmg:magicDmg(),from:'player',skill:'magic',aoe:1.2});
    refreshUI();
  }
}
function xpForP(l){ return 70+55*l; }
function gainLXP(n){
  P.xpL+=n;
  addFloat('+'+n+' XP', P.x, P.y-2.6, '#c9b0ff');
  while(P.xpL>=xpForP(P.level) && P.level<20){
    P.xpL-=xpForP(P.level); P.level++;
    P.maxhp+=6; P.maxmp+=2; P.hp=P.maxhp; P.mp=P.maxmp;
    burst(P.x,P.y-0.5,'#c9b0ff',20); Snd.levelup();
    shockwave(P.x,P.y,'rgba(201,176,255,0.9)',46);
    banner('LEVEL '+P.level, 'Barik takes your measure - and steps back.');
    P.cheerT=3;
  }
  refreshUI();
}
function drawMobBars(m,s){
  if(m.hp<m.maxhp){
    const w=m.bigBoss?54:26, top= m.kind==='scorpion'? -30 : m.kind==='dragon'? -100 : -52;
    cx.fillStyle='rgba(0,0,0,0.6)'; cx.fillRect(s.x-w/2,s.y+top,w,4);
    cx.fillStyle='#e05648'; cx.fillRect(s.x-w/2,s.y+top,w*clamp(m.hp/m.maxhp,0,1),4);
  }
  if(!m.dead && dist(P.x,P.y,m.x,m.y)<8){
    const dl=(m.lvl||1)-(P.level||1);
    cx.font='bold 9px Georgia'; cx.textAlign='center';
    cx.fillStyle= dl>=3?'#ff6a5a': dl>=1?'#ffd76a': dl<=-3?'#8a94a0':'#e8e0d0';
    const top2= m.kind==='scorpion'? -36 : m.kind==='dragon'? -128 : m.boss?-102: m.kind==='alpha'?-94: -58;
    cx.strokeStyle='rgba(0,0,0,0.7)'; cx.lineWidth=2.6;
    cx.strokeText('Lv '+(m.lvl||1), s.x, s.y+top2);
    cx.fillText('Lv '+(m.lvl||1), s.x, s.y+top2);
  }
}
function damageMob(m,dmg,knock,skill){
  if(m.fainted) return; // a felled, freed dragon takes no more harm
  if(skill==='archery' && (m.kind==='skeleton'||m.kind==='archer'||m.kind==='gravelord'||m.kind==='boss')){
    dmg=Math.round(dmg*1.75);
    addFloat('WEAK!', m.x, m.y-2.1, '#ffd76a');
    if(!P._boneHint){ P._boneHint=1;
      toast('Old bones splinter - <b style="color:#ffd76a">arrows deal heavy bonus damage to skeletons!</b>',5000); }
  }
  let crit=false;
  if(Math.random()<0.12){ dmg=Math.round(dmg*1.6); crit=true; }
  const lvdiff=Math.max(0,(m.lvl||1)-(P.level||1));
  dmg=Math.max(1,Math.round(dmg*Math.max(0.35,1-0.09*lvdiff))); // high-level foes shrug
  m.hp-=dmg; m.hurtT=0.18; m.state='chase'; m.noAggroT=0;
  addFloat(crit? dmg+'!' : dmg, m.x, m.y-1.3, crit?'#ff5c48':'#ffb26b', crit?1.5:1.05);
  if(crit){ Snd.crit(); shockwave(m.x,m.y,'rgba(255,200,120,0.9)',26); }
  if(skill==='melee') G.hitStop=Math.max(G.hitStop, crit?0.09:0.045);
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
    else if(m.kind==='mage' && !m.escaped){ m.hp=1; vathEscapes(m); } // Vath never falls - he slips away
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
  toast('<b>Vath does not fall.</b> Beaten to one knee, he only tilts his head and <i>looks</i> at you - at the pendant at your throat - a beat too long. <b style="color:#c9a0ff">“…You shouldn\'t be possible,”</b> he says, almost kindly. Then the violet folds inward and he is <b>gone</b>, the way smoke is gone.',9000);
  if(typeof killCredit==='function') killCredit('mage'); // "drove him off" - vhunt turns in at Moli
}
function dragonFaints(m){
  // beaten down, the binding shatters - Ashwing swoons and comes to himself
  m.fainted=1; m.enspelled=false; m.state='idle'; m.tx=null;
  m.windup=0; m.swing=0; m.lunge=0; m.lungeCd=1e9; m.hitCd=1e9; m.noAggroT=1e9;
  Snd.boss(); G.shake=0.9; G.slowmo=1.15;
  shockwave(m.x,m.y,'rgba(255,190,90,0.95)',95);
  banner('THE SPELL BREAKS','ASHWING RETURNS TO HIMSELF');
  P.eastDragonFought=1; P.eastDragonFreed=1; G.dragonMob=null;
  if(typeof freeDragon==='function') freeDragon(m.x,m.y-0.4);
  toast('<b style="color:#ffcf8a">The violet light shatters.</b> Ashwing sways, then sinks to the ash - breathing, himself again. “...You could have run me through. You broke the chain instead. My thanks, little flame.” <br>His great eye narrows: “...The binder\'s fire reached for you, too, on the climb - I felt it grope for your mind. It found no hold. That is not luck, little flame. But I do not know what it is.” <br>“He fled into the palm grove. Do not let him bind another.”',10000);
  if(qs('wyrm')==='active') completeQuest('wyrm');
  if(typeof startMageHunt==='function') startMageHunt();
  // a breath later he rouses and beats away to rest in his lair
  setTimeout(()=>{ if(m && !m.dead){ m.dead=true; m.respawnT=-1;
    for(let i=0;i<24;i++){ const a=Math.random()*TAU, sp=rnd(1,4);
      G.parts.push({x:m.x,y:m.y-0.6,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.4,life:rnd(0.9,1.8),
        color:Math.random()<0.5?'#ffd24a':'#8fd0a0',size:rnd(2,5),grav:-0.2}); }
  } }, 4500);
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
  if(m.kind==='boss') award('kingslayer');   // only the Hollow King earns Kingslayer
  if(m.kind==='alpha') award('wolfsbane');
  killCredit(m.kind);
  if(m.elite) killCredit('elite');
  // drops
  const g=rndi(d.gold[0],d.gold[1])*(m.elite?3:1);
  if(m.kind==='boar' && Math.random()<0.7){ give('boarmeat',1); addFloat('+1 boar meat',m.x,m.y-1.6,'#e0a070',1.0); }
  if(m.kind==='mage'){ m.respawnT=-1; Snd.magic();
    shockwave(m.x,m.y,'rgba(199,123,255,0.8)',46);
    toast('<b>Vath’s binding unravels with him.</b> “...the fire was to be mine,” he says, unhurried even now - and the violet goes out. The grove falls quiet.',6000); }
  if(g>0) G.parts.push({x:m.x,y:m.y,vx:0,vy:0,life:20,pickup:'gold',n:g,size:9,color:''});
  if(Math.random()<(m.elite?1:0.4)) G.parts.push({x:m.x+0.3,y:m.y+0.2,vx:0,vy:0,life:20,pickup:'heart',n:12,size:9,color:''});
  if(m.kind==='alpha'){
    Snd.boss(); G.shake=0.8; G.slowmo=1.0;
    shockwave(m.x,m.y,'rgba(255,140,110,0.9)',70);
    banner('GREYMAW FALLS','THE HIGHLANDS GO QUIET');
    give('fang',1);
    toast('<b style="color:#ffb0a0">Greymaw\'s Fang</b> - +8 melee damage while carried.',5200);
  }
  if(m.kind==='boss'){
    // THE Hollow King (Emberwick's main-story boss) - the only fall that seals
    // the isle's victory screen
    Snd.boss(); G.shake=0.9; G.slowmo=1.15;
    shockwave(m.x,m.y,'rgba(160,255,200,0.9)',85);
    banner('THE HOLLOW KING FALLS','THE ISLE BREATHES AGAIN');
    dropHollowFire();   // the seal breaks with him
    // his risen court crumbles with him: clear every summoned skeleton and any
    // bone volley still in the air so nothing can kill you on the victory lap
    for(const o of G.mobs){ if(!o.dead && o.kind==='skeleton'){ o.dead=true; o.respawnT=-1; burst(o.x,o.y-0.4,'#d8d8c8',10,1.4); } }
    for(let i=G.projs.length-1;i>=0;i--){ if(G.projs[i].kind==='bone') G.projs.splice(i,1); }
    G.victory=true;   // invulnerable through the win sequence (see hurtPlayer)
    if(qs('king')!=='done'){ P.quests.king='active'; P.prog.king=1; updateQuestUI(); } // rushed the boss? still counts
    // freeze the world once the victory screen is up so you can read it in peace
    setTimeout(()=>{ document.getElementById('winOv').style.display='flex'; if(G.state==='play') G.paused=true; },2400);
  } else if(m.boss){
    // any other named regional boss (the Tome-Warden snake, the Leviathan, the
    // Castellan...) falls under its own name - never the Hollow King's
    Snd.boss(); G.shake=0.85; G.slowmo=1.1;
    shockwave(m.x,m.y,'rgba(160,255,200,0.9)',80);
    banner((m.title||'THE FOE')+' FALLS','A SHADOW LIFTS FROM THIS PLACE');
  } else Snd.hit();
  // After felling a dungeon boss, offer the quick road out - mended and a level
  // stronger. (Overworld bosses stay put; dungeons have a clear "way up".)
  if((m.boss||m.bigBoss) && typeof inDungeon==='function' && inDungeon()){
    setTimeout(offerDungeonExit, 2400);
  }
}
function offerDungeonExit(){
  if(G.state!=='play' || P.dead || (typeof inDungeon==='function' && !inDungeon()) || dlg.open) return;
  const exit=G.decor.find(b=>(b.kind==='dungeonmouth'||b.kind==='tunnelmouth') && (b.exit||b.up));
  dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='The Way Up';
  const pg=document.getElementById('dportrait').getContext('2d');
  pg.fillStyle='#141018'; pg.fillRect(0,0,72,72);
  const rg=pg.createRadialGradient(36,30,4,36,30,34); rg.addColorStop(0,'#e8dcff'); rg.addColorStop(1,'rgba(140,120,200,0)');
  pg.fillStyle=rg; pg.fillRect(0,0,72,72);
  setDialog('The warden is down and the wards go dark. A cold updraught tugs at you - the way up stands open. <b>Take the quick road out</b>, mended and a level stronger for what you’ve done?',
    [{label:'Rise - healed & stronger', cls:'gold', fn:()=>{
        closeDialog();
        P.hp=P.maxhp; P.mp=P.maxmp;
        gainLXP(xpForP(P.level));   // ~one full level
        if(exit){ P.x=exit.x; P.y=exit.y+0.6; P.click=null; P.moving=false;
          G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20; }
        burst(P.x,P.y-0.5,'#c9b0ff',20,2); Snd.magic&&Snd.magic();
        toast('Whole again, and a level the wiser. The way up is right here.',4200);
      }},
     {label:'Stay a while', ghost:true, fn:closeDialog}]);
}
function buzz(ms){ if(CFG.shake && navigator.vibrate){ try{ navigator.vibrate(ms); }catch(e){} } }
function hurtPlayer(dmg,src){
  if(P.hurtT>0 || P.dead || (P.rollT||0)>0 || G.victory) return;   // no dying during the victory sequence
  buzz(24);
  dmg=dmg*[0.6,1,1.35][CFG.diff|0];
  dmg=Math.max(1, Math.round(dmg*(1-[0,0.15,0.30][P.armor||0])));
  if(has('wardstone',1)) dmg=Math.max(1, dmg-2);   // the Warden's Wardstone turns aside a sliver of every blow
  const lvUp=Math.max(0,(src&&src.lvl||1)-(P.level||1));
  dmg=Math.round(dmg*Math.min(1.8,1+0.08*lvUp)); // and hit harder
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
  if(src){ const dx=P.x-src.x, dy=P.y-src.y, l=Math.hypot(dx,dy)||1; moveEntity(P,dx/l*0.5,dy/l*0.5); }
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
  // another island. Honour a bind only if it's on this world; else its village.
  const b=P.bind;
  if(b && b.w===G.worldId){ P.x=b.x; P.y=b.y; }
  else { const home=ZONES.village||ZONES.town||(WORLD_DEFS[G.worldId]&&WORLD_DEFS[G.worldId].spawn)||{x:P.x,y:P.y};
    P.x=home.x+0.5; P.y=home.y+2.5; }
  P.hurtT=1.5; refreshUI(); autoSave();
};
document.getElementById('winBtn').onclick=()=>{ document.getElementById('winOv').style.display='none'; G.paused=false; G.victory=false; };

/* ---- per-frame updates ---- */
function updatePlayer(dt){
  if(P.dead) return;
  // safety net: never leave the player wedged between water and land
  if(!G.interior && unstickEntity(P)){
    hintOnce('unstuck','Solid ground found its way back under your boots.');
  }
  if((G.interior || (typeof inDungeon==='function' && inDungeon())) && P.riding){
    P.riding=0; toast((P.unlocked&&P.unlocked.moa)?'Kiko waits outside - no room to ride here.':'Chestnut waits outside.',2200);
  }
  // dodge roll
  P.rollT=Math.max(0,(P.rollT||0)-dt); P.rollCd=Math.max(0,(P.rollCd||0)-dt);
  if(P.rollCd<=0) P.dashChain=0;
  if(keys['shift']) tryRoll();
  if(P.rollT>0){
    const _rx=P.x, _ry=P.y, _step=P.speed*2.7*dt;
    moveEntity(P, P.dir.x*_step, P.dir.y*_step, 0.28, P.unlocked&&P.unlocked.surf&&!P.riding);
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
  }
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
  // --- Frostdeep ice-slide: on the dungeon's slick ice you glide in one world
  //     direction until a wall stops you or you glide off the ice onto footing ---
  // only the Sliding Halls are slick; the Frostgate and Frozen Heart are ice-floored
  // for the theme but keep your footing (G.slideZone bounds the slippery room).
  const sz=G.slideZone;
  const inSlide = sz && P.x>=sz.x0 && P.x<=sz.x1 && P.y>=sz.y0 && P.y<=sz.y1;
  const onSlick = G.worldId==='frostdeep' && inSlide && P.rollT<=0 && !dlg.open && tileAt(Math.floor(P.x),Math.floor(P.y))===T.ICE;
  if(onSlick){
    if(!P.slideDir && ml>0.25){
      // push off along the stronger input axis - but never INTO a wall. If that
      // way is blocked, push off the other axis instead (so you can turn); if
      // both are walled you're in a corner and simply hold until you aim clear.
      const ax={x:Math.sign(mx),y:0}, ay={x:0,y:Math.sign(my)};
      const primary = Math.abs(mx)>Math.abs(my)? ax : ay, other = (primary===ax)? ay : ax;
      const open=(dir)=> (dir.x||dir.y) && !circleBlocked(P.x+dir.x*0.5, P.y+dir.y*0.5, 0.28);
      P.slideDir = open(primary)? primary : (open(other)? other : null);
    }
    if(P.slideDir){
      const ss=7.0*dt; let moved=false;
      const nx=P.x+P.slideDir.x*ss; if(!circleBlocked(nx,P.y,0.28)){ P.x=nx; moved=true; }
      const ny=P.y+P.slideDir.y*ss; if(!circleBlocked(P.x,ny,0.28)){ P.y=ny; moved=true; }
      P.dir=P.slideDir; P.moving=true; P.anim+=ss*3.1;
      if(Math.random()<dt*20) G.parts.push({x:P.x+rnd(-0.3,0.3),y:P.y+rnd(0,0.3),vx:-P.slideDir.x*0.6,vy:-P.slideDir.y*0.6,life:0.4,color:'#eaf6ff',size:2.2,grav:0});
      if(!moved || tileAt(Math.floor(P.x),Math.floor(P.y))!==T.ICE){ P.slideDir=null; Snd.step&&Snd.step(T.ICE); }
    } else P.moving=false;
  } else {
  if(P.slideDir) P.slideDir=null;
  if(P.rollT<=0) P.moving = ml>0.05 && !dlg.open;
  if(P.moving && P.rollT<=0){
    mx/=ml; my/=ml;
    const onWater=tileAt(Math.floor(P.x),Math.floor(P.y))<=T.SHALLOW;
    const canSurf=P.unlocked&&P.unlocked.surf&&!P.riding;
    const sp=P.speed*(tileAt(Math.floor(P.x),Math.floor(P.y))===T.PATH?1.12:1)
      *(P.riding? (P.unlocked&&P.unlocked.moa?2.1:1.55) :1)
      *(onWater&&canSurf?1.8:1)
      *(has('boots',1)?1.14:1);
    moveEntity(P, mx*sp*dt, my*sp*dt, 0.28, canSurf);
    if(onWater&&canSurf&&Math.random()<dt*14)
      G.parts.push({x:P.x+rnd(-0.3,0.3),y:P.y+rnd(0,0.3),vx:-mx*0.8+rnd(-0.4,0.4),vy:-my*0.8+rnd(-0.4,0.4),life:0.35,color:'#eaf6ff',size:2.4,grav:0});
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
  P.comboT=Math.max(0,(P.comboT||0)-dt); if(P.comboT===0) P.combo=0;
  P.atkCd=Math.max(0,P.atkCd-dt);
  P.swing=Math.max(0,P.swing-dt);
  P.gatherT=Math.max(0,(P.gatherT||0)-dt);
  P.hurtT=Math.max(0,P.hurtT-dt);
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
    if(P.rollT>0 && !TRAIN._r){ TRAIN._r=1; TRAIN.rolls++; }
    if(P.rollT<=0) TRAIN._r=0;
    TRAIN.combo=Math.max(TRAIN.combo,P.combo||0);
    if(dist(P.x,P.y,TRAIN.x,TRAIN.y)>14){ TRAIN=null; toast('Drill abandoned. The dummies gossip about you.',3200); }
    else if(TRAIN.stage===0 && dmgDone>=30){ TRAIN.stage=1; Snd.quest();
      toast('<b>Good.</b> Now chain it: land a <b>COMBO x2</b> without pausing between strikes.',4400); }
    else if(TRAIN.stage===1 && TRAIN.combo>=2){ TRAIN.stage=2; Snd.quest();
      toast('<b>Sharp.</b> Footwork now: <b>dodge-roll 3 times</b>'+(isTouch?' (the roll button)':' (Shift)')+'.',4400); }
    else if(TRAIN.stage===2 && TRAIN.rolls>=3){
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
  // regen
  P.mp=Math.min(P.maxmp,P.mp+dt*2.6);
  if(G.time-P.lastCombat>5) P.hp=Math.min(P.maxhp,P.hp+dt*2.2);
  // fishing timer
  if(P.fishing){
    const f=P.fishing; f.t+=dt;
    if(!f.bit && f.t>=f.biteAt){ f.bit=true; f.bitT=0; Snd.pickup(); }
    if(f.bit){ f.bitT+=dt; if(f.bitT>1.0){ P.fishing=null; addFloat('it got away…',P.x,P.y-1.4,'#c9b990'); Snd.splash(); } }
  }
  // pickups & hint zones
  for(const pt of G.parts){
    if(pt.pickup && dist(P.x,P.y,pt.x,pt.y)<0.7){
      if(pt.pickup==='gold') giveGold(pt.n);
      else { P.hp=Math.min(P.maxhp,P.hp+pt.n); addFloat('+'+pt.n+' HP',P.x,P.y-1.4,'#7fe07f'); Snd.pickup(); refreshUI(); }
      pt.life=0;
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
  if(G.worldId==='isle' && P.y>=HOLLOW_GATEY && P.y<HOLLOW_GATEY+8 && P.x>HOLLOW_MINX-2 && P.x<HOLLOW_MAXX+2)
    hintOnce('kingwarn','Skull-boards hammered into the grass warn you back. Beyond them the ground turns to broken stone - and something older than the isle waits at its tip.');
  if(ZONES.ruins && dist(P.x,P.y,ZONES.ruins.x,ZONES.ruins.y)<11) hintOnce('ruins','The Old Ruins - the air is cold here. Bones walk.');
  if(ZONES.forest && dist(P.x,P.y,ZONES.forest.x,ZONES.forest.y)<8) hintOnce('forest','The Whisperwood. Wolves prowl; bluecaps glow in the shade.');
}

function updateNPCs(dt){
  const night=isNight();
  if(!night) G.nightToasted=false;
  else if(!G.nightToasted && !G.interior){
    G.nightToasted=true;
    toast('Lamps flicker on as the villagers head indoors for the night. The <b>inn</b> keeps its door open.',5200);
  }
  for(const n of G.npcs) n.hidden = n.throne ? true : (night && !n.nightOwl);   // throne-bound NPCs (the King) never appear in the open city
  for(const n of G.npcs){
    n.bubbleT=Math.max(0,(n.bubbleT||0)-dt);
    if(n.hums && !n.hidden){ // the Woodworker hums a tune he can't name (the royal anthem)
      n.humT=(n.humT===undefined? rnd(1,4):n.humT)-dt;
      if(n.humT<=0){ n.humT=rnd(2.6,5.2); addFloat('♪', n.x, n.y-1.9, 'rgba(206,196,232,0.92)', 0.9); }
    }
    n.chatT=(n.chatT===undefined? rnd(4,10) : n.chatT)-dt;
    if(n.chatT<=0){ n.chatT=rnd(10,20);
      if(dist(n.x,n.y,P.x,P.y)<6.5 && !dlg.open && G.state==='play'){
        n.bubble=n.idleLines[(n.li=((n.li||0)+1))%n.idleLines.length];
        n.bubbleT=3.6;
      }
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

function updateMobs(dt){
  updateHollowFire(dt);
  for(const m of G.mobs){
    if(m.dead){
      if(m.respawnT>0){ m.respawnT-=dt;
        if(m.respawnT<=0 && dist(P.x,P.y,m.hx,m.hy)>10){ m.dead=false; m.hp=m.maxhp; m.x=m.hx; m.y=m.hy; m.state='idle'; }
        else if(m.respawnT<=0) m.respawnT=5;
      }
      continue;
    }
    m.anim+=dt; m.hitCd=Math.max(0,m.hitCd-dt); m.hurtT=Math.max(0,m.hurtT-dt);
    m.swing=Math.max(0,(m.swing||0)-dt);
    const d0=MOBDEF[m.kind], pd=dist(m.x,m.y,P.x,P.y);
    const d={dmg:m.dmg||d0.dmg, speed:m.speed||d0.speed, aggro:m.aggro||d0.aggro};
    if(m.state==='idle'){
      m.noAggroT=Math.max(0,(m.noAggroT||0)-dt);
      if(pd<d.aggro && !P.dead && !inSafeZone(P.x,P.y) && m.noAggroT<=0){ m.state='chase';
        if(m.kind==='boss'){ Snd.boss(); toast('<b style="color:#78dca0">The Hollow King rises.</b>'); }
        else if(m.bigBoss && Snd.boss) Snd.boss(); }
      m.wt-=dt;
      if(m.wt<=0){ m.wt=rnd(2,5); const a=Math.random()*TAU; m.tx=m.hx+Math.cos(a)*1.6; m.ty=m.hy+Math.sin(a)*1.6; }
      if(m.tx!=null){ const dx=m.tx-m.x, dy=m.ty-m.y, l=Math.hypot(dx,dy);
        if(l>0.15 && !((m.snareT||0)>0)){ moveEntity(m,dx/l*d.speed*0.4*dt,dy/l*d.speed*0.4*dt); if(Math.abs(dx)>0.35) m.face=dx<0?-1:1; } else if(l<=0.15) m.tx=null; }
    } else {
      // leash
      if(pd>d.aggro*2.2 || P.dead || dist(m.x,m.y,m.hx,m.hy)>14){
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
      if(l>stop && !((m.snareT||0)>0) && !m.rooted){
        const ox2=m.x, oy2=m.y;
        if((m.detourLock||0)>0){
          // committed detour: slide purely along the wall until the lock expires
          m.detourLock-=dt;
          moveEntity(m, -dy/l*d.speed*dt*m.detour, dx/l*d.speed*dt*m.detour);
        } else {
          moveEntity(m, dx/l*d.speed*dt, dy/l*d.speed*dt);
        }
        if(Math.hypot(m.x-ox2,m.y-oy2) < d.speed*dt*0.2){
          // no progress: flip the shoulder and commit to the slide
          m.detour = -(m.detour||(((m.x*7+m.y*13)|0)%2? 1:-1));
          m.detourLock=0.7;
          m.wedgeT=(m.wedgeT||0)+dt;
          if(m.wedgeT>3){ m.wedgeT=0; m.detourLock=0; unstickEntity(m); }
        } else if((m.detourLock||0)<=0){ m.wedgeT=0; }
      }
      // telegraphed strike: wind up, then the blow lands - roll through it!
      if(l<1.15+(m.boss?0.5:0) && m.hitCd<=0 && !P.dead && !(m.windup>0)){
        m.windup = m.elite?0.26 : m.boss?0.42 : 0.34;
        m.hitCd= m.boss?1.1:1.25;
      }
      if(m.windup>0){
        m.windup-=dt;
        if(m.windup<=0){
          m.windup=0; m.swing=0.3;
          if(l<1.95+(m.boss?0.6:0) && !P.dead) hurtPlayer(d.dmg, m);
        }
      }
      if(m.kind==='archer'){
        // kite: back away if crowded, loose bone arrows from range
        if(l<3 && l>0.01) moveEntity(m, -dx/l*d.speed*1.1*dt, -dy/l*d.speed*1.1*dt);
        m.shootCd-=dt;
        if(m.shootCd<=0 && l>2 && l<10.5){
          m.shootCd=2.3; m.swing=0.3;
          G.projs.push({kind:'bone',x:m.x,y:m.y-0.8,vx:dx/l*8,vy:dy/l*8,life:1.7,dmg:d.dmg,from:'mob'});
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
      if(m.kind==='alpha'){
        m.lungeCd=(m.lungeCd||3)-dt;
        if(m.lungeCd<=0 && l>2.2 && l<7.5){
          m.lungeCd=4.2; m.lunge=0.5;
          Snd.noise(0.35,0.07,300,0.6); Snd.tone(180,0.4,'sawtooth',0.06,-90); // howl
          addFloat('HOWL', m.x, m.y-2.4, '#ffb0a0', 1.2);
        }
        if((m.lunge||0)>0){ m.lunge-=dt;
          moveEntity(m, dx/l*d.speed*2.6*dt, dy/l*d.speed*2.6*dt);
          if(Math.random()<0.5) G.parts.push({x:m.x,y:m.y,vx:-dx/l,vy:-dy/l,life:0.3,color:'rgba(190,190,200,0.5)',size:3});
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
      if(m.kind==='leviathan'){
        // bound in the deep - never leaves the water, but hurls spouts and
        // rears to slam anything on the breakwater. Volleys wider when hurt.
        m.rooted=1;
        m.shootCd-=dt;
        if(m.shootCd<=0 && l>1.3 && l<14){
          m.shootCd = m.hp<m.maxhp*0.5? 1.5 : 2.3; m.swing=0.3;
          const spread = m.hp<m.maxhp*0.5? [-0.3,0,0.3] : [0];
          for(const off of spread){ const ca=Math.atan2(dy,dx)+off;
            G.projs.push({kind:'spout',x:m.x,y:m.y-1.0,vx:Math.cos(ca)*7,vy:Math.sin(ca)*7,life:2.0,dmg:Math.round(d.dmg*0.7),from:'mob'}); }
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
      if(m.kind==='boss'){ // the Hollow King alone raises bone and calls the dead
        m.shootCd-=dt;
        if(m.shootCd<=0 && l>2){
          m.shootCd=2.6;
          G.projs.push({kind:'bone',x:m.x,y:m.y-0.8,vx:dx/l*7,vy:dy/l*7,life:1.8,dmg:12,from:'mob'});
          Snd.bow();
        }
        if(!m.summoned[0] && m.hp<m.maxhp*0.66){ m.summoned[0]=true; bossSummon(m); }
        if(!m.summoned[1] && m.hp<m.maxhp*0.33){ m.summoned[1]=true; bossSummon(m); }
      }
    }
  }
}
function bossSummon(m){
  toast('<b style="color:#78dca0">“Rise, my court!”</b>');
  for(let i=0;i<2;i++){ const s=spawnMob('skeleton', m.x+rnd(-2,2), m.y+rnd(1,2.5));
    s.state='chase'; s.respawnT=-1; burst(s.x,s.y-0.4,'#78dca0',12); }
  Snd.magic();
}

function updateProjs(dt){
  for(const p of G.projs){
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
    if(p.kind==='bolt'&&Math.random()<0.6) G.parts.push({x:p.x,y:p.y-0.4,vx:rnd(-0.5,0.5),vy:rnd(-0.5,0.2),life:0.3,color:'#ffb26b',size:3,grav:0});
    if(p.kind==='snarebolt'&&Math.random()<0.6) G.parts.push({x:p.x,y:p.y-0.4,vx:rnd(-0.5,0.5),vy:rnd(-0.5,0.2),life:0.32,color:'#6fe0c8',size:3,grav:0});
    if(p.kind==='hex'&&Math.random()<0.6) G.parts.push({x:p.x,y:p.y-0.4,vx:rnd(-0.5,0.5),vy:rnd(-0.5,0.2),life:0.3,color:'#c77bff',size:3,grav:0});
    if(p.kind==='arrow'&&Math.random()<0.5) G.parts.push({x:p.x,y:p.y-0.35,vx:0,vy:0,life:0.18,color:'rgba(230,225,205,0.55)',size:2});
    const tx=Math.floor(p.x), ty=Math.floor(p.y);
    if(G.solid[ty*MAPW+tx]===1 && tileAt(tx,ty)>=T.SAND){ p.life=0; burst(p.x,p.y-0.3,'#c9b990',4,1.5); continue; }
    if(p.from==='player'){
      for(const m of G.mobs){
        if(m.dead) continue;
        if(dist(p.x,p.y,m.x,m.y-0.3)<0.6){
          if(p.aoe){ for(const m2 of G.mobs){ if(!m2.dead && dist(p.x,p.y,m2.x,m2.y)<p.aoe){
              damageMob(m2,p.dmg,{x:p.vx/10,y:p.vy/10},p.skill);
              if(p.snare && !m2.boss && !m2.bigBoss){ m2.snareT=p.snare; m2.windup=0;
                burst(m2.x,m2.y-0.3,'#6fe0c8',10,2); } } }
            burst(p.x,p.y-0.3,p.snare?'#6fe0c8':'#ff9a3c',14,3); }
          else damageMob(m,p.dmg,{x:p.vx/13,y:p.vy/13},p.skill);
          p.life=0; break;
        }
      }
    } else {
      if(!P.dead && dist(p.x,p.y,P.x,P.y-0.3)<0.55){ hurtPlayer(p.dmg,{x:p.x-p.vx,y:p.y-p.vy}); p.life=0; }
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
    if(n.dead){ n.respawn-=dt;
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
  if(night<0.2) G.fireflies.length=0;
  // night hunters: after dark the wilds send foes; dawn scatters them to mist.
  // NEVER underground (no wraiths in a dungeon) and NEVER in the royal capital -
  // Aldermere is a walled, patrolled city and stays safe after dark.
  if(night>0.55 && !G.interior && !inDungeon() && G.worldId!=='crown' && !P.dead && !inSafeZone(P.x,P.y)){
    let nn=0; for(const m of G.mobs) if(m.night && !m.dead) nn++;
    if(nn<4 && Math.random()<dt*0.22){
      const a2=Math.random()*TAU, dd2=11+Math.random()*4;
      const nx=Math.round(P.x+Math.cos(a2)*dd2), ny=Math.round(P.y+Math.sin(a2)*dd2);
      if(inb(nx,ny) && walkTile(tileAt(nx,ny)) && !solidAt(nx,ny) && !inSafeZone(nx,ny)){
        const m=spawnMob('wraith', nx,ny, Math.random()<0.15);
        m.night=1;
        m.lvl=Math.max(3,Math.min(8,P.level)); // the dark measures you before it strikes
        m.maxhp=90+m.lvl*12; m.hp=m.maxhp;
        burst(nx+0.5,ny,'#8fa8d8',12,2.2);
      }
    }
  }
  if(night<0.15){
    // dawn quietly clears the night mobs (nightfall/dawn toasts removed by request)
    for(const m of G.mobs) if(m.night && !m.dead){ m.dead=true; m.respawnT=1e9; burst(m.x,m.y-0.5,'#c8d8e8',8,1.6); }
  }
  if(G.worldId==='aeriedeep' && typeof updateAerieDeep==='function') updateAerieDeep(dt);
  if(G.worldId==='eastdeep' && typeof updateEastDeep==='function') updateEastDeep(dt);
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
