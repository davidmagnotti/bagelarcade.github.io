"use strict";
/* =====================================================================
   THE RECKONING - Act II finale: the ambush, the three-stage Vath fight,
   the sealing, and the dawn celebration. Drives the crownVath boss set up
   by spawnCrownReckoning (js/12-world-layer.js) and the hp<=0 stage hooks
   in damageMob (js/09-gameplay.js). Kept in its own file so the whole
   endgame reads top-to-bottom in one place.
   ===================================================================== */

// The arena is a circle in front of the Tideglass throne. Centre + radius are
// derived from the palace zone so it always sits in the forecourt.
function vathArena(){ const PA=CROWN_ZONES.palace; return {cx:PA.x, cy:PA.y+7, r:8}; }

/* ---- POST-CREDITS REWIND -------------------------------------------------
   Snapshot the world at the point of no return (the throne-room doors slam), so the
   ending screen can offer to set the player back down in the capital with the reckoning
   still ahead of them. Kept in its OWN storage key so it never clobbers the main autosave
   (the finished tale is preserved). The snapshot's hero is placed at the Kingsferry Quay -
   well clear of the arena trigger - so a restore doesn't instantly re-spring the ambush. */
function snapshotPreFinale(){
  if(typeof saveCode!=='function' || (typeof G!=='undefined' && G.noPersist)) return;
  const ox=P.x, oy=P.y;
  try{
    const q=(typeof CROWN_ZONES!=='undefined') && CROWN_ZONES.dock;
    if(q){ const o=(typeof findOpenNear==='function' && findOpenNear(Math.round(q.x),Math.round(q.y),10))||[q.x,q.y]; P.x=o[0]+0.5; P.y=o[1]+0.5; }
    SafeStore.set('emberwickPreFinale', saveCode());
  }catch(e){}
  finally{ P.x=ox; P.y=oy; }
}
function hasPreFinale(){ try{ return !!SafeStore.get('emberwickPreFinale'); }catch(e){ return false; } }
function restorePreFinale(){
  try{ const s=SafeStore.get('emberwickPreFinale'); if(!s) return false; return (typeof loadCode==='function') ? loadCode(s) : false; }
  catch(e){ return false; }
}

/* =====================================================================
   SPEAKER PORTRAITS  -  busts painted into the story-card portrait canvas
   (storyCard's opts.speaker.draw). Same art vocabulary as the in-world
   bosses so the face on the card is the face you fight. Static (drawn once
   when the card opens), so no time-based flicker.
   ===================================================================== */
/* Vath: a hooded emberbinder. form='man' -> pale bearded face under the hood;
   form='shadow' -> the mask is gone, only violet-eyed dark remains. */
function drawVathPortrait(g,w,h,form){
  const cx=w/2, S=w/120;                         // designed at 120px, scales to any size
  g.save(); g.translate(cx, 0); g.scale(S,S);
  const shadow=(form==='shadow');
  // violet aura
  const au=g.createRadialGradient(0,58,4,0,58,64);
  au.addColorStop(0,'rgba(150,60,200,0.42)'); au.addColorStop(0.6,'rgba(96,30,150,0.18)'); au.addColorStop(1,'rgba(60,16,110,0)');
  g.fillStyle=au; g.fillRect(-60,-8,120,128);
  // shoulders / robe rising into the hood
  g.fillStyle=shadow?'#160a26':'#3a1f56';
  g.beginPath(); g.moveTo(-46,120); g.quadraticCurveTo(-40,70,-18,52);
  g.quadraticCurveTo(0,44,18,52); g.quadraticCurveTo(40,70,46,120); g.closePath(); g.fill();
  // ragged hem highlights (wisps for the shadow form)
  g.strokeStyle=shadow?'rgba(150,80,210,0.55)':'rgba(120,70,170,0.5)'; g.lineWidth=1.6;
  for(let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(i*15,118); g.quadraticCurveTo(i*15+4,96,i*13,78); g.stroke(); }
  // hood
  g.fillStyle=shadow?'#0e0720':'#241436';
  g.beginPath(); g.moveTo(-30,66); g.quadraticCurveTo(-38,18,0,10); g.quadraticCurveTo(38,18,30,66);
  g.quadraticCurveTo(0,58,-30,66); g.closePath(); g.fill();
  g.strokeStyle='rgba(140,80,200,0.4)'; g.lineWidth=1.4; g.stroke();
  if(!shadow){
    // pale face inside the hood
    g.fillStyle='#c2a892'; g.beginPath(); g.ellipse(0,40,15,19,0,0,TAU); g.fill();
    // short beard wrapping the jaw
    g.fillStyle='#2a2038';
    g.beginPath(); g.moveTo(-13,38); g.quadraticCurveTo(-14,55,0,60); g.quadraticCurveTo(14,55,13,38);
    g.quadraticCurveTo(7,47,0,46); g.quadraticCurveTo(-7,47,-13,38); g.closePath(); g.fill();
    // deep sockets + violet eyes + stern brow
    g.fillStyle='#170c26'; g.beginPath(); g.arc(-6,36,4.4,0,TAU); g.arc(6,36,4.4,0,TAU); g.fill();
    g.save(); g.globalCompositeOperation='lighter';
    g.fillStyle='rgba(224,176,255,0.95)'; g.beginPath(); g.arc(-6,36,2.4,0,TAU); g.arc(6,36,2.4,0,TAU); g.fill();
    g.fillStyle='rgba(199,123,255,0.5)'; g.beginPath(); g.arc(-6,36,5,0,TAU); g.arc(6,36,5,0,TAU); g.fill();
    g.restore();
    g.strokeStyle='#1c1024'; g.lineWidth=2; g.lineCap='round';
    g.beginPath(); g.moveTo(-11,29); g.lineTo(-2,31.5); g.moveTo(11,29); g.lineTo(2,31.5); g.stroke(); g.lineCap='butt';
  } else {
    // the shadow-thing: a dark mask of nothing with two burning eyes and rising wisps
    g.fillStyle='#0a0518'; g.beginPath(); g.ellipse(0,40,13,17,0,0,TAU); g.fill();
    g.save(); g.globalCompositeOperation='lighter';
    g.fillStyle='rgba(210,150,255,0.95)'; g.beginPath(); g.ellipse(-6,37,2.6,3.4,0,0,TAU); g.ellipse(6,37,2.6,3.4,0,0,TAU); g.fill();
    g.fillStyle='rgba(160,70,220,0.5)'; g.beginPath(); g.arc(-6,37,6,0,TAU); g.arc(6,37,6,0,TAU); g.fill();
    g.strokeStyle='rgba(170,90,220,0.6)'; g.lineWidth=2;
    for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(i*9,16); g.quadraticCurveTo(i*15,-2,i*8,-18); g.stroke(); }
    g.restore();
  }
  g.restore();
}
/* Leo, your brother: a young scholar-prince. white=true adds the temple streak
   the seal costs him. */
function drawLeoPortrait(g,w,h,white){
  const cx=w/2, S=w/120;
  g.save(); g.translate(cx,0); g.scale(S,S);
  const au=g.createRadialGradient(0,54,4,0,54,62);
  au.addColorStop(0,'rgba(90,140,220,0.35)'); au.addColorStop(0.6,'rgba(60,90,160,0.15)'); au.addColorStop(1,'rgba(40,60,120,0)');
  g.fillStyle=au; g.fillRect(-60,-6,120,128);
  // shoulders: blue shirt under a gold-trimmed cloak
  g.fillStyle='#c9a24e'; g.beginPath(); g.moveTo(-50,120); g.quadraticCurveTo(-42,66,-16,54);
  g.quadraticCurveTo(0,48,16,54); g.quadraticCurveTo(42,66,50,120); g.closePath(); g.fill();
  g.fillStyle='#2f5fa0'; g.beginPath(); g.moveTo(-26,120); g.quadraticCurveTo(-22,72,0,60);
  g.quadraticCurveTo(22,72,26,120); g.closePath(); g.fill();
  // neck + face
  g.fillStyle='#c88f63'; g.fillRect(-8,44,16,14);
  g.fillStyle='#d8a97a'; g.beginPath(); g.ellipse(0,34,16,19,0,0,TAU); g.fill();
  // short blonde hair
  g.fillStyle='#e8cd6e'; g.beginPath(); g.arc(0,28,17,Math.PI*1.04,TAU*1.02); g.fill();
  g.beginPath(); g.moveTo(-16,28); g.quadraticCurveTo(-14,16,0,14); g.quadraticCurveTo(14,16,16,28);
  g.quadraticCurveTo(6,22,0,23); g.quadraticCurveTo(-6,22,-16,28); g.closePath(); g.fill();
  if(white){ g.fillStyle='#e8e2d4'; g.beginPath(); g.moveTo(9,20); g.quadraticCurveTo(16,22,15,30); g.quadraticCurveTo(11,26,9,20); g.closePath(); g.fill(); }
  // calm eyes + faint smile
  g.fillStyle='#241a2e'; g.beginPath(); g.arc(-6,34,1.9,0,TAU); g.arc(6,34,1.9,0,TAU); g.fill();
  g.strokeStyle='#8a5a3a'; g.lineWidth=1.4; g.lineCap='round';
  g.beginPath(); g.moveTo(-4,42); g.quadraticCurveTo(0,44.5,4,42); g.stroke(); g.lineCap='butt';
  g.restore();
}
/* speaker presets passed to storyCard(opts.speaker) */
function vathSpeaker(form){ return {name:'Vath', role: form==='shadow'?'The Shadow, Unshaped':'The Emberbinder',
  tint:'rgba(201,160,255,.85)', draw:(g,w,h)=>drawVathPortrait(g,w,h,form)}; }
function leoSpeaker(white){ return {name:'Leo', role:'Your Brother, the Scholar-Prince',
  tint:'rgba(140,185,240,.85)', draw:(g,w,h)=>drawLeoPortrait(g,w,h,white)}; }

/* ---- the violet flame-ring that seals the arena once the fight begins ---- */
function raiseVathFire(){
  if(G._vathFire) return;
  const A=vathArena(); G._vathFire=1;
  for(let y=Math.floor(A.cy-A.r-1); y<=Math.ceil(A.cy+A.r+1); y++){
    for(let x=Math.floor(A.cx-A.r-1); x<=Math.ceil(A.cx+A.r+1); x++){
      if(!inb(x,y)) continue;
      const dd=dist(x,y,A.cx,A.cy);
      if(dd>=A.r-0.55 && dd<=A.r+0.55 && walkTile(tileAt(x,y)) && !solidAt(x,y)){
        setSolid(x,y,1);
        G.decor.push({kind:'vathfire', x:x+0.5, y:y+0.5, ph:Math.random()*TAU});
      }
    }
  }
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
  G.shake=Math.max(G.shake||0,0.8);
}
function dropVathFire(){
  if(!G._vathFire) return; G._vathFire=0;
  const A=vathArena();
  for(let y=Math.floor(A.cy-A.r-1); y<=Math.ceil(A.cy+A.r+1); y++)
    for(let x=Math.floor(A.cx-A.r-1); x<=Math.ceil(A.cx+A.r+1); x++)
      if(inb(x,y)){ const dd=dist(x,y,A.cx,A.cy); if(dd>=A.r-0.6 && dd<=A.r+0.6) setSolid(x,y,0); }
  G.decor = G.decor.filter(d=>d.kind!=='vathfire' || d.cageRing);   // leave any cage ring standing
  if(typeof invalidateScenery==='function') invalidateScenery();
}

/* ---- STAGE 3 signpost: once Vath is formless and no blade can touch him, the
   sealing-fire leaves the arena wall and coils in a tight ring around the caged
   brother - a beacon that says "the way to end this is HERE, break the cage." The
   ring is DECOR ONLY (never solid), so you walk straight through it to strike the
   cage; it's just the objective, lit up. ---- */
function raiseCageFire(cage){
  if(!cage || G._cageFire) return; G._cageFire=1;
  const R=2.4;
  for(let y=Math.floor(cage.y-R-1); y<=Math.ceil(cage.y+R+1); y++)
    for(let x=Math.floor(cage.x-R-1); x<=Math.ceil(cage.x+R+1); x++){
      if(!inb(x,y)) continue;
      const dd=dist(x+0.5,y+0.5,cage.x,cage.y);
      if(dd>=R-0.55 && dd<=R+0.55 && walkTile(tileAt(x,y)))
        G.decor.push({kind:'vathfire', cageRing:1, x:x+0.5, y:y+0.5, ph:Math.random()*TAU});
    }
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
  G.shake=Math.max(G.shake||0,0.7);
}
function dropCageFire(){
  if(!G._cageFire) return; G._cageFire=0;
  G.decor = G.decor.filter(d=>!(d.kind==='vathfire' && d.cageRing));
  if(typeof invalidateScenery==='function') invalidateScenery();
}

/* ---- THE AMBUSH: step into the throne room, the gate seals, Vath drops in
   behind you, laughs, and shows you your brother caged. Then he sheds his
   shape into the first monster and the fight is on. ---- */
function startVathIntro(boss){
  if(G._vathIntro) return;
  G._vathIntro=1;
  if(typeof snapshotPreFinale==='function') snapshotPreFinale();   // capture "before the final fight" for the post-credits rewind
  const A=vathArena();
  // stand the player at the arena's heart so the flame-ring closes cleanly around them
  const ps=(typeof findOpenNear==='function' && findOpenNear(Math.round(A.cx), Math.round(A.cy+2), 5)) || [A.cx, A.cy+2];
  P.x=ps[0]+0.5; P.y=ps[1]+0.5; P.dir={x:0,y:-1}; P.moving=false; P.click=null; P.fishing=null;
  // Vath unfolds out of the violet BEHIND you (to the south), between you and the door
  const bs=(typeof findOpenNear==='function' && findOpenNear(Math.round(P.x), Math.round(P.y+3), 4)) || [P.x, P.y+2.6];
  boss.x=bs[0]+0.5; boss.y=bs[1]+0.5; boss.hx=boss.x; boss.hy=boss.y; boss.sealed=false; boss.invuln=true; boss.face=-1;
  // checkpoint INSIDE the sealed arena: dying respawns you here (not at the far dock, where the
  // flame-ring would lock you out), and the fight resumes at its current stage. Cleared on leaving crown.
  P.bossCheck={w:'crown', x:P.x, y:P.y};
  if(typeof Snd!=='undefined' && Snd.magic) Snd.magic();
  if(typeof shockwave==='function') shockwave(boss.x,boss.y,'rgba(199,123,255,0.95)',84);
  G.shake=0.9; G.slowmo=Math.max(G.slowmo||0,1.15);
  for(let i=0;i<28;i++){ const a=Math.random()*TAU, s=rnd(1,4);
    G.parts.push({x:boss.x,y:boss.y-0.4,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:rnd(0.7,1.6),color:'#c77bff',size:rnd(2,4),grav:-0.06}); }
  const cage=G.mobs.find(m=>m.brotherCage);
  // begin the fight by SHEDDING the man: the flame-ring closes, then Vath tears out of
  // his human shape into the shadow husk (vathBeginMorph) before stage 1's AI wakes.
  const begin=()=>{ raiseVathFire(); vathBeginMorph(boss); G._vathIntro=0; };
  const cardCage=()=>{ if(cage){ cage.sealed=false; if(typeof shockwave==='function') shockwave(cage.x,cage.y,'rgba(120,40,180,0.85)',60); }   // the cage is revealed
    if(typeof storyCard!=='function'){ begin(); return; }
    storyCard('<i>He lifts one hand toward the dais - and the shadow there peels back off a cage of black glass. Your brother is on his knees inside it, mouth moving on words the walls eat, one palm flat to the barrier.</i> <b style="color:#c9a0ff">"The scholar stays where I can see him. No seal today, little prince."</b> <i>Violet fire roars up in a ring, and the doors behind you are gone.</i> <b style="color:var(--ember)">There is no way out but through him.</b>',
      {label:'Then through him', onOk:begin, speaker:vathSpeaker('man')}); };
  if(typeof storyCard==='function'){
    storyCard('<i>The throne-room doors boom shut at your back, and the cold air folds. Vath does not come DOWN off the stolen throne - he unfolds out of the dark right behind you, close enough to whisper.</i> <b style="color:#c9a0ff">"There she is. And on the day I\'d all but given up waiting."</b> <i>He laughs, low and delighted.</i> <b style="color:#c9a0ff">"I have been so patient - for YOU, and for that brother of yours. The whole set, come to me at last."</b>',
      {label:'Where is Leo?', onOk:cardCage, speaker:vathSpeaker('man')});
  } else begin();
}

/* ---- THE SHEDDING: a brief in-arena transformation the player WATCHES before the
   fight begins. The robed man cross-dissolves into the rising shadow husk, spitting
   violet as his shape tears. Driven by m.morphT (counted down in updateVathBoss);
   when it elapses, vathToStage1 wakes the husk's AI. Rendered by the 'vathmorph'
   branch in drawMob (js/10-rendering.js). ---- */
function vathBeginMorph(m){
  m.vstage=0.5; m.kind='vathmorph'; m.dead=false; m.sealed=false; m.invuln=true; m.customAI=1;
  m.morphMax=1.9; m.morphT=1.9;
  m.title='VATH'; m.subtitle='THE MAN WAS ALWAYS A MASK'; m.name='Vath';
  m.maxhp=560; m.hp=560; m.state='idle'; m.windup=0; m.hurtT=0; m.face=(P.x<m.x?-1:1);
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
  G.shake=1.1; G.slowmo=Math.max(G.slowmo||0,1.35);
  if(typeof shockwave==='function') shockwave(m.x,m.y-0.4,'rgba(150,30,180,0.95)',120);
  for(let i=0;i<34;i++){ const a=Math.random()*TAU, s=rnd(1,5);
    G.parts.push({x:m.x,y:m.y-0.6,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.1,life:rnd(0.7,1.7),color:i%2?'#c77bff':'#3a1a5e',size:rnd(2,4.5),grav:-0.05}); }
  if(typeof banner==='function') banner('THE MASK COMES OFF','VATH SHEDS HIS HUMAN SHAPE');
  if(typeof updateBossUI==='function') updateBossUI();
}

/* ---- STAGE 1: Vath sheds the man and fights as a lean shadow-thing. ---- */
function vathToStage1(m){
  m.vstage=1; m.kind='vathhusk'; m.dead=false; m.sealed=false; m.invuln=false; m.customAI=1;
  m.title='VATH UNSHAPED'; m.subtitle='THE MAN WAS ALWAYS A MASK'; m.name='Vath Unshaped';
  m.maxhp=560; m.hp=560; m.dmg=26; m.speed=3.2; m.aggro=18; m.size=1.12;
  m.state='chase'; m.noAggroT=0; m.windup=0; m.meleeCd=1.2; m.boltCd=2.6; m.stunT=0;
  m.boss=true; m.bigBoss=true;
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss(); G.shake=1.0;
  if(typeof shockwave==='function') shockwave(m.x,m.y,'rgba(150,30,180,0.95)',110);
  if(typeof banner==='function') banner('VATH UNSHAPED','STAGE ONE — CUT THE SHADOW DOWN');
  if(typeof updateBossUI==='function') updateBossUI();
}
/* ---- STAGE 2: the shadow swells into a fire-and-ice Goliath. ---- */
function vathToStage2(m){
  m.vstage=2; m.kind='goliath'; m.dead=false; m.invuln=false;
  m.title='VATH THE GOLIATH'; m.subtitle='STAGE TWO — FLAME AND FROST'; m.name='Vath the Goliath';
  m.maxhp=1500; m.hp=1500; m.dmg=46; m.speed=2.35; m.aggro=20; m.size=1.7;
  m.state='chase'; m.windup=0; m.smashCd=2.4; m.fireCd=3.0; m.iceCd=4.6; m.stunT=0;
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss(); G.shake=1.2; G.slowmo=Math.max(G.slowmo||0,1.2);
  if(typeof shockwave==='function') shockwave(m.x,m.y,'rgba(255,120,40,0.9)',140);
  for(let i=0;i<48;i++){ const a=Math.random()*TAU, s=rnd(1.5,6);
    G.parts.push({x:m.x,y:m.y-0.6,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.2,life:rnd(0.9,2),color:i%2?'#ff8a1e':'#bfe8ff',size:rnd(2,5),grav:-0.05}); }
  if(typeof banner==='function') banner('VATH THE GOLIATH','HE HURLS FLAME AND ICE — KEEP MOVING');
  if(typeof updateBossUI==='function') updateBossUI();
}
/* ---- STAGE 3: broken, he abandons all shape - a formless dark thing no blade
   can touch. The only way to end it is to SHATTER the cage so Leo can seal him. ---- */
function vathToStage3(m){
  m.vstage=3; m.kind='vathshadow'; m.dead=false; m.invuln=true;   // untouchable now
  m.title='VATH THE FORMLESS'; m.subtitle='NO BLADE BITES — FREE LEO'; m.name='Vath the Formless';
  m.maxhp=1; m.hp=1; m.dmg=34; m.speed=3.3; m.aggro=22; m.size=1.5;
  m.state='chase'; m.windup=0; m.slamCd=2.2; m.reachCd=3.4;
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss(); G.shake=1.1; G.slowmo=Math.max(G.slowmo||0,1.2);
  if(typeof shockwave==='function') shockwave(m.x,m.y,'rgba(60,10,90,0.95)',150);
  // the cage becomes destructible now - and the sealing-fire leaves the arena wall to
  // ring the cage, pointing you straight at the one thing that can end the fight
  const cage=G.mobs.find(c=>c.brotherCage && !c.dead);
  if(cage){ cage.invuln=false; cage.sealed=false; cage.maxhp=cage.maxhp||520; cage.hp=cage.maxhp;
    if(typeof dropVathFire==='function') dropVathFire();       // the wall of fire falls...
    if(typeof raiseCageFire==='function') raiseCageFire(cage); // ...and re-forms around your brother
  }
  if(typeof banner==='function') banner('VATH THE FORMLESS','SMASH THE CAGE — SET LEO FREE');
  if(typeof toast==='function') toast('<b style="color:#c9a0ff">Your blade passes clean through him.</b> He cannot be cut - only <b>SEALED</b>. <b style="color:var(--ember)">The sealing-fire draws in around the cage</b> - break through it and free Leo so he can speak the founders\' seal, and stay ahead of Vath while you do.',9000);
  if(typeof updateBossUI==='function') updateBossUI();
}

/* ---- the boss brain, driven each frame from updateCrownReckoning ---- */
function vathFireBolt(m, spread){ const base=Math.atan2(P.y-m.y,P.x-m.x);
  for(const o of (spread||[-0.18,0,0.18])){ const a=base+o;
    G.projs.push({kind:'bolt', x:m.x, y:m.y-1.1, vx:Math.cos(a)*7.6, vy:Math.sin(a)*7.6, life:2.0, dmg:Math.round(m.dmg*0.55), from:'mob', owner:m}); }
  if(typeof Snd!=='undefined' && Snd.magic) Snd.magic();
}
function vathIceFan(m){ const base=Math.atan2(P.y-m.y,P.x-m.x);
  for(const o of [-0.5,-0.25,0,0.25,0.5]){ const a=base+o;
    G.projs.push({kind:'shard', x:m.x, y:m.y-1.0, vx:Math.cos(a)*7.0, vy:Math.sin(a)*7.0, life:1.9, dmg:Math.round(m.dmg*0.5), from:'mob', owner:m}); }
  if(typeof Snd!=='undefined' && Snd.magic) Snd.magic();
}
function updateVathBoss(m,dt){
  // THE SHEDDING: hold still and tear apart while the transformation plays out. He
  // takes no action and no damage here; when the timer runs out the husk's AI wakes.
  if(m.kind==='vathmorph'){
    m.morphT=Math.max(0,(m.morphT||0)-dt); m.face=(P.x<m.x?-1:1); m.anim=(m.anim||0)+dt;
    const p=1-m.morphT/(m.morphMax||1);
    if(Math.random()<0.5+p*0.5){ const a=Math.random()*TAU, s=rnd(1,3.5+p*3);
      G.parts.push({x:m.x+rnd(-0.4,0.4),y:m.y-1+rnd(-0.6,0.4),vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:rnd(0.5,1.3),color:Math.random()<0.5?'#c77bff':'#2a1240',size:rnd(2,4),grav:-0.05}); }
    if(m.morphT<=0) vathToStage1(m);
    return;
  }
  const pd=dist(m.x,m.y,P.x,P.y); m.face=(P.x<m.x?-1:1);
  const wasWind=(m.windup||0)>0;
  m.windup=Math.max(0,(m.windup||0)-dt); m.stunT=Math.max(0,(m.stunT||0)-dt);
  const busy = m.windup>0 || m.stunT>0;
  // frame-based telegraph: the strike resolves the exact frame the wind-up elapses (respects
  // pause/slow-mo, unlike a real-time timer). m.pendReach carries what the pending blow can hit.
  if(wasWind && m.windup<=0 && m.pendReach){
    m.swing=0.35; G.shake=0.55;
    if(typeof shockwave==='function') shockwave(m.x+m.face, m.y-0.3, 'rgba(199,123,255,0.82)', m.pendGlow||52);
    if(m.pendQuake && typeof shockwave==='function') shockwave(m.x, m.y, 'rgba(255,150,60,0.8)', 78);
    if(dist(m.x,m.y,P.x,P.y)<m.pendReach && (P.rollT||0)<=0 && !P.dead && typeof hurtPlayer==='function') hurtPlayer(m.dmg, m);
    m.pendReach=0; m.pendQuake=0;
  }
  const step=(spd)=>{ if(pd>1.9 && !busy){ const a=Math.atan2(P.y-m.y,P.x-m.x); moveEntity(m,Math.cos(a)*spd*dt,Math.sin(a)*spd*dt); } };
  const startSwing=(reach,glow,dur,quake)=>{ m.windup=dur||0.55; m.pendReach=reach; m.pendGlow=glow; m.pendQuake=quake?1:0; };

  if(m.vstage===1){
    m.meleeCd=(m.meleeCd||0)-dt; m.boltCd=(m.boltCd||0)-dt; step(m.speed);
    if(pd<2.6 && m.meleeCd<=0 && !busy){ m.meleeCd=1.6; startSwing(3.0,50,0.5,0); }
    if(pd>2.8 && m.boltCd<=0 && !busy){ m.boltCd=2.4; G.projs.push({kind:'hex', x:m.x, y:m.y-1, vx:(P.x-m.x)/pd*7.5, vy:(P.y-m.y)/pd*7.5, life:1.8, dmg:Math.round(m.dmg*0.6), from:'mob', owner:m}); if(typeof Snd!=='undefined'&&Snd.magic) Snd.magic(); }
  } else if(m.vstage===2){
    m.smashCd=(m.smashCd||0)-dt; m.fireCd=(m.fireCd||0)-dt; m.iceCd=(m.iceCd||0)-dt; step(m.speed);
    if(pd<3.4 && m.smashCd<=0 && !busy){ m.smashCd=2.8; startSwing(3.7,74,0.6,1); }
    if(m.fireCd<=0 && pd>2.2 && !busy){ m.fireCd=2.9; vathFireBolt(m,[-0.22,0,0.22]); }
    if(m.iceCd<=0 && pd>2.4 && !busy){ m.iceCd=4.4; vathIceFan(m); }
  } else if(m.vstage===3){
    m.slamCd=(m.slamCd||0)-dt; m.reachCd=(m.reachCd||0)-dt; step(m.speed);
    // untouchable now - he just HOUNDS you: a slam you dodge, and shadow-reach bolts
    if(pd<3.2 && m.slamCd<=0 && !busy){ m.slamCd=2.4; startSwing(3.4,66,0.55,1); }
    if(m.reachCd<=0 && pd>2.0 && !busy){ m.reachCd=2.6; G.projs.push({kind:'hex', x:m.x, y:m.y-1, vx:(P.x-m.x)/pd*8, vy:(P.y-m.y)/pd*8, life:1.8, dmg:Math.round(m.dmg*0.6), from:'mob', owner:m}); if(typeof Snd!=='undefined'&&Snd.magic) Snd.magic(); }
  }
}

/* ---- THE SEAL: the cage shatters, Leo steps free and speaks the founders'
   binding, and Vath is dragged down into the stone. Then the collapse. ---- */
function cageBreak(cage){
  cage.cageBroken=1; cage.dead=true; cage.respawnT=-1;
  if(typeof dropCageFire==='function') dropCageFire();   // the ring gutters out as the glass shatters
  const boss=G.mobs.find(m=>m.crownVath && !m.dead);
  if(boss){ boss.sealing=1; boss.invuln=true; boss.state='idle'; boss.windup=0; }
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss(); G.shake=1.0; G.slowmo=Math.max(G.slowmo||0,1.2);
  if(typeof shockwave==='function') shockwave(cage.x,cage.y,'rgba(240,220,150,0.9)',90);
  for(let i=0;i<36;i++){ const a=Math.random()*TAU, s=rnd(1,5);
    G.parts.push({x:cage.x,y:cage.y-0.6,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:rnd(0.8,1.9),color:i%2?'#1a0e2e':'#c9b0ff',size:rnd(2,4),grav:-0.04}); }
  if(typeof banner==='function') banner('THE CAGE SHATTERS','LEO IS FREE — NOW, THE SEAL');
  // Play the animated seal cutscene - Leo shatters the cage, reads the founders' binding,
  // and Vath is dragged down into the throne-hall floor - then hand off to the collapse +
  // dawn. Falls through to the static story-card sequence if the cutscene is unavailable.
  if(typeof sealCutscene==='function'){ sealCutscene(vathSealComplete); return; }
  const p1=()=>{ if(typeof storyCard!=='function'){ vathSealComplete(); return; }
    storyCard('<i>The black glass breaks like a held breath let go, and Leo is on his feet with the founders\' book already open. Not the low voice he read you to sleep with - this is the old hand spoken ALOUD, and each word drops like a stone down a deep well. The formless thing that was Vath strains against nothing you can see, then less, then not at all.</i> <b style="color:#c9a0ff">"You think a CHILD can hold what a hundred of your blood could not-"</b> <i>The book takes the last word out of his mouth.</i>',
      {label:'Hold the line', onOk:p2, speaker:vathSpeaker('shadow')}); };
  const p2=()=>{ storyCard('<i>The seal roots the way he swore it would - into the one who casts it. He staggers; for a breath the violet crawls up his own arm before the binding drags it down into the stone with Vath. When he lowers the book his hair has gone white at one temple and his hand will not stop shaking - but he is smiling, and he is HIM, all the way through.</i> <b style="color:#ffe9a8">"It held,"</b> <i>he says, hardly believing it. "Sister - it HELD."</i>',
      {label:'…', onOk:p3, speaker:leoSpeaker(true)}); };
  const p3=()=>{ storyCard('<i>The violet drains out of Aldermere like a tide going out, and with it goes the very last of your strength. Your knees give. Leo catches you before the marble does, and you hear him call your name from very far away.</i> <b style="color:var(--ember)">The shadow is sealed. The isles are free.</b> <i>Everything goes soft, and dark, and quiet.</i>',
      {label:'…', onOk:vathSealComplete}); };
  p1();
}
function vathSealComplete(){
  P.story=P.story||{}; P.story.vathDown=1; P.story.vathSealed=1; P.story.gameWon=1; P.story.finale=1;
  if(typeof award==='function') award('enchantersbane');
  const boss=G.mobs.find(m=>m.crownVath && !m.dead); if(boss){ boss.dead=true; boss.respawnT=-1; }
  // hold the screen black through the scene-change, then wake in a bright room
  G.paused=true;   // freeze the collapse - no wandering the arena through the black-out
  const fade=document.getElementById('fadeOv'); if(fade){ fade.style.transition='opacity 1.1s ease'; fade.style.opacity=1; }
  setTimeout(()=>{
    dropVathFire();
    // rebuild the crown from scratch (mirroring switchWorld's fresh-world reset) so the dawn
    // celebration is generated clean instead of stacked on top of the emptied arena.
    G.mobs.length=0; G.projs.length=0; G.parts.length=0; G.floats.length=0;
    G.map=new Uint8Array(MAPW*MAPH); G.solid=new Uint8Array(MAPW*MAPH); G.variant=new Uint8Array(MAPW*MAPH);
    G.nodes=[]; G.decor=[]; G.plots=[]; G.foam=[]; G.crows=[]; G.decals=[]; G.critters=[]; G.cat=null; G.forgePos=null; G.npcs=[];
    P.hp=P.maxhp; P.dead=false; P.combo=0; G.slowmo=0; G.shake=0;
    P.story.crownDawn=1;                 // it is morning, and the capital celebrates
    if(typeof genCrownAll==='function') genCrownAll();   // regenerate the freed, celebrating city
    if(typeof invalidateScenery==='function') invalidateScenery();
    if(typeof invalidateMapBase==='function') invalidateMapBase();
    wakeInCastleRoom();
    if(typeof autoSave==='function') autoSave();
  }, 1500);
}
/* ---- wake up: a bright room high in the palace, a door to walk out of ---- */
function wakeInCastleRoom(){
  const PA=CROWN_ZONES.palace;
  const rs=(typeof findOpenNear==='function' && findOpenNear(Math.round(PA.x), Math.round(PA.y+12), 10)) || [PA.x, PA.y+12];
  const I={kind:'house', w:11, h:8, ret:{x:rs[0]+0.5, y:rs[1]+0.5}, exit:{x:5.5, y:7.1}, t:0, furn:[], home:1, dawnRoom:1};
  const F=(type,x,y,hw,hh,solid)=>I.furn.push({type,x,y,hw:hw||0.6,hh:hh||0.5,solid:solid!==false});
  F('bed',2.4,2.6,1.1,0.78); F('hearth',2.4,1.35,1.0,0.35); F('shelf',7.7,1.3,1.1,0.3);
  F('table',8.4,3.5,0.9,0.6); F('stool',7.3,4.5,0.35,0.3); F('rug',5.4,4.4,0,0,false);
  G.interior=I; P.click=null; P.x=I.w/2; P.y=I.h-1.8; P.moving=false; P.fishing=null; P.dir={x:0,y:-1};
  P.prog=P.prog||{}; P.prog.dawnRoom=1;   // gate: the celebration arrival only fires AFTER you wake and step out
  G.paused=false;                          // release the collapse-freeze now that the room is ready
  const fade=document.getElementById('fadeOv');
  if(typeof _revealFromBlack==='function') _revealFromBlack();
  else if(fade){ fade.style.transition='opacity 0.8s ease'; fade.style.opacity=0; }
  setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>You wake to sunlight. A high, bright room you half-remember from a childhood that was taken from you - your OWN room, kept all these years in a palace you thought you\'d never see again. Your armour is folded on the chair; someone washed the salt out of it.</i> <b style="color:#ffe9a8">You are home, and it is morning, and nothing in all the isles is hunting you.</b> <i>There are voices below - a great many of them.</i>',
    {label:'Rise and go down', onOk:()=>{ if(typeof toast==='function') toast('<b>Step out the door</b> and go down to the city.',6000); }}); }, 720);
}
/* ---- the moment you step out into the freed, celebrating capital ---- */
function celebrationArrival(){
  if(typeof banner==='function') banner('ALDERMERE, AT DAWN','THE ISLES ARE FREE — AND EVERYONE HAS COME');
  if(typeof Snd!=='undefined' && Snd.levelup) Snd.levelup();
  setTimeout(()=>{ if(typeof storyCard==='function') storyCard('<i>You step out onto the palace stair and stop dead. The whole of Aldermere is below you - and not just Aldermere. Every soul you ever pulled out from under Vath\'s shadow is here: the folk of Barik and the Sunward Isle, of Windsurf and the Frozen strait, the Aerie\'s flyers, the crews off Stormreach. Ashwing dozes gold in the square with children on his tail. Someone is playing the old Tide-Queen\'s anthem, and this time the whole crowd knows the last verse.</i> <b style="color:#ffe9a8">Your brother stands at the foot of the stair, waiting for you. Go and speak with him.</b>',
    {label:'Go to Leo'}); }, 700);
}

/* ---- the celebration crowd: everyone, and every creature, that you freed ---- */
function spawnVictoryCrowd(){
  const Z=CROWN_ZONES, PA=Z.palace, PL=Z.plaza, M=Z.market, GA=Z.garden;
  const put=(id,name,x,y,look,lines,wander)=>{ const sp=(typeof findOpenNear==='function' && findOpenNear(Math.round(x),Math.round(y),7)) || [x,y];
    const n=makeNPC(id,name,sp[0],sp[1],look,lines,wander||0); n.nightOwl=true; G.npcs.push(n); return n; };
  // Leo, your brother, at the foot of the palace stair - carries the ending
  put('brother','Leo, Your Brother the Prince', PA.x, PA.y+11,
    {skin:'#d8a97a',hair:'#e8cd6e',shirt:'#2f5fa0',pants:'#33302a',cloak:'#c9a24e',hairstyle:'short'},
    ['Look at them all, sister. Every isle we freed, come to say it with their own mouths: thank you.',
     'A streak of white in my hair and a book I can never un-read. Small price. We WON.'],0.05);
  // the old sailor who first sang you the anthem, now with the last verse restored
  put('mabley','Old Mabley', M.x+1, M.y+1,
    {skin:'#b58a5e',hair:'#cfc7b8',shirt:'#3a5a5a',pants:'#2f3a3a',beard:'#cfc7b8',beardLong:true},
    ['Sixty years I sang that hymn with a hole where the queen\'s name should be. Heard the whole square fill it in this morning. Thought these old eyes were done leaking.',
     'There\'s black water past Stormreach, they\'re saying - charts washed up in the deep. Isles no living soul has named. If I were young and swung a blade like you...'],0.2);
  // a herald calling the peace
  put('brea','Brea the Herald', PL.x, PL.y-2,
    {skin:'#8a5a3a',hair:'#2a2018',shirt:'#7a5a2f',pants:'#4a3a24',hairstyle:'bun'},
    ['Hear it! The shadow is SEALED, the crown restored, and every isle from Emberwick to the Aerie stands free!',
     'Hear it! The two the tide threw back have come home - and the whole sea has come to thank them!'],0.1);
  // a scatter of isle-folk and returned guards, milling and glad
  const folk=[
    ['maren','Elder Maren',{skin:'#e6c39a',hair:'#cfcfd6',shirt:'#7a5a8f',pants:'#4a3a5a',robe:'#5a4472',hairstyle:'bun'},['The island wanted you. I said so the day you washed ashore, and I say it now.']],
    ['bram','Bram the Smith',{skin:'#d9a06a',hair:'#3a2a1c',shirt:'#8f4a3a',pants:'#3a3a40',hairstyle:'bald',beard:'#2c1f14',apron:'#4a3322'},['I forged the first sword you ever swung. Look what you did with it.']],
    ['sela','Sela the Provisioner',{skin:'#c98d5f',hair:'#4a3526',shirt:'#5a7a6a',pants:'#3a3a2c',apron:'#c8b898'},['Barik sent every cart it had. Nobody\'s counting the tab today.']],
    ['sigrid','Sigrid of the Frost',{skin:'#e2c3a0',hair:'#d8d2c6',shirt:'#4a6a8a',pants:'#33404a',hairstyle:'long'},['We came down off the ice for this. Wouldn\'t have missed it for a warm winter.']],
    ['moli','Elder Moli',{skin:'#a06a3a',hair:'#2a2018',shirt:'#8a5a2f',pants:'#4a3a24',hairstyle:'bun'},['The Sunward Isle burns bright again - the good kind of bright. We owe you a mountain.']],
    ['guardc0','City Guard',{skin:'#bd8f60',hair:'#3a2f26',shirt:'#42506a',pants:'#2e3340',trim:'#c9a24e',armor:1,hairstyle:'short'},['The King - the new one - called the whole watch back to the wall this morning. Feels right to stand a post again.']],
    ['guardc1','City Guard',{skin:'#c29a6e',hair:'#2a2018',shirt:'#42506a',pants:'#2e3340',trim:'#c9a24e',armor:1,hairstyle:'short'},['We stood down when the old King wasn\'t himself. We\'ll not stand down again.']],
  ];
  const spots=[[PL.x-4,PL.y+2],[PL.x+5,PL.y+1],[PL.x-2,PL.y+5],[M.x-3,M.y+2],[M.x+4,M.y+3],[PA.x-6,PA.y+9],[PA.x+6,PA.y+9]];
  folk.forEach((f,i)=>{ const s=spots[i%spots.length]; put(f[0],f[1],s[0],s[1],f[2],f[3],0.15); });
  // Ashwing the dragon, dozing friendly in the plaza
  { const ds=(typeof findOpenNear==='function' && findOpenNear(Math.round(PL.x+2),Math.round(PL.y+6),8)) || [PL.x+2,PL.y+6];
    G.decor.push({kind:'dragonrest', x:ds[0]+0.5, y:ds[1]+0.5}); }
  // chickens and cats underfoot, because it is that kind of morning
  const FOWL=['#efe7d6','#b07a44','#8a7a5e'];
  const critter=(kind,x,y,col,range)=>{ const rx=Math.round(x), ry=Math.round(y);
    if(!inb(rx,ry)||solidAt(rx,ry)) return;
    G.critters.push({kind, x:rx+0.5, y:ry+0.5, home:{x:rx+0.5,y:ry+0.5}, tx:null, ty:null, wt:rnd(0.5,4), face:Math.random()<0.5?-1:1, anim:Math.random()*6, range:range||2.5, col, moving:false}); };
  for(let i=0;i<8;i++) critter('fowl', PL.x-5+i*1.4, PL.y+3+(i%3), FOWL[i%3], 2.2);
  critter('cat', PL.x+1, PL.y-1, '#c9c2b6', 3); critter('cat', M.x, M.y+2, '#3a3330', 3);
  critter('cat', PA.x+3, PA.y+9, '#d8c088', 2.5);
}
