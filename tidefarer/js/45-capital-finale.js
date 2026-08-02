/* =====================================================================
   ACT III — THE BATTLE FOR THE CAPITAL
   -----------------------------------------------------------------------
   The finale the three-act spine builds to (STORY.md, "Act III"). Once the
   Tidefarer's book is won (P.story.finaleOpen), the storm-wall over Aldermere
   falls and the ferry will finally carry you to the capital.

   The rule the whole story rests on made playable: Vath's magic cannot touch
   the royal blood, so he throws the thing that can — the kingdom itself.
   You cut through waves of his THRALLED soldiers up the processional to the
   palace, then face VATH. The two gifts converge: Joan's SLOW-TIME (js/43)
   makes the openings and survives his onslaught; Jaist's SEAL finishes it.
   He is SEALED, not slain — the Tidefarer's unfinished work, completed —
   and the King, Vath's captive since Act I, is freed.

   Callback: the waterfall lesson — do not let Vath talk. His taunts are short
   here on purpose; the fight answers them.

   Staged entirely in the `crown` overworld via a per-frame driver
   (capitalTick, hooked from the main loop) plus one death-intercept clause in
   js/09-gameplay.js that routes the finale Vath to sealVath instead of the
   mid-game "he escapes" path.
   ===================================================================== */
(function(){
'use strict';

// ---- the ferry offers the capital once the book is won (boatMenu hook) -------
// Returns an extra [label,dest] entry (or null). Called from boatMenu.
function capitalFerryOption(){
  if(P.story && P.story.finaleOpen && !P.story.vathSealed && G.worldId!=='crown')
    return ['Sail to Aldermere — the last road', 'crown'];
  return null;
}
window.capitalFerryOption = capitalFerryOption;

// ---- per-frame driver (real dt; runs only in the capital, in the finale) -----
function capitalTick(dt){
  if(typeof G==='undefined' || G.worldId!=='crown') return;
  P.story = P.story || {};
  if(!P.story.finaleOpen || P.story.vathSealed) return;
  if(!G._capital) capitalBegin();
  const c=G._capital; if(!c) return;
  const busy = (typeof dlg!=='undefined' && dlg.open) || G.paused || G.menuPause || G.bossIntro;
  if(busy) return;
  c.t = (c.t||0) + dt;
  if(c.phase==='assault'){
    let live=0; for(const m of G.mobs) if(m.capThrall && !m.dead) live++;
    if(live===0 && (c.t - (c.lastWaveT||0)) > 1.0){
      if(c.wave < c.waves){ c.wave++; c.lastWaveT=c.t; spawnThrallWave(c.wave); }
      else { c.phase='vath'; c.lastWaveT=c.t; capitalVathPhase(); }
    }
  }
}
window.capitalTick = capitalTick;

// ---- the city turns against you ----------------------------------------------
function capitalBegin(){
  G._capital = { phase:'assault', wave:0, waves:3, t:0, lastWaveT:0 };
  // the thralled city: no friendly drills, no idle folk — they have fled or fallen
  for(let i=G.mobs.length-1;i>=0;i--){ const m=G.mobs[i]; if(m.kind==='dummy'||m.kind==='hare') G.mobs.splice(i,1); }
  if(G.npcs) for(let i=G.npcs.length-1;i>=0;i--){ if(!G.npcs[i].throne) G.npcs.splice(i,1); }  // King stays (throne interior)
  if(typeof banner==='function') banner('ALDERMERE HAS FALLEN','VATH HOLDS THE THRONE — CUT THROUGH THE THRALLS TO THE PALACE');
  if(typeof cinematic==='function'){ cinematic(true); setTimeout(()=>cinematic(false), 2600); }
  const C='#c9b0ff';
  storyCard('<i>The ferry runs you in under a sky gone wrong — Aldermere\'s own violet, poured down over white towers. On the quay your brother </i><b style="color:'+C+'">Jaist</b><i> grips the seal-book white-knuckled.</i> <b style="color:'+C+'">"He\'s bent the whole city, Joan — the Watch, the Bazaar, folk who dandled us as babes. His magic can\'t touch our blood, so he throws theirs at us."</b> <i>He steadies.</i> <b style="color:'+C+'">"Cut me a road to the throne. I\'ll ready the seal. And whatever he says up there — <u>do not let him talk</u>."</b>',
    { label:'Draw your steel', onOk:()=>{ if(G._capital) G._capital.lastWaveT = (G._capital.t||0); } });
  if(typeof autoSave==='function') autoSave();
}

function spawnThrallWave(n){
  const kinds = n===1 ? ['raider','raider','brigand','archer','raider','brigand']
              : n===2 ? ['raider','brigand','archer','wraith','raidcap','brigand','archer']
              :         ['brigand','wraith','archer','raidcap','wraith','brigand','archer','raider'];
  if(typeof banner==='function')
    banner(n<3 ? ('THE THRALLS CLOSE IN — WAVE '+n+' OF 3') : 'THE LAST OF THE FALLEN GUARD',
           n<3 ? 'CUT THROUGH — THE PALACE LIES NORTH' : 'PAST THEM STANDS THE THRONE');
  const arm=(m,sp)=>{ if(!m) return false;
    m.capThrall=1; m.thralled=1; m.enspelled=true;
    m.aggro=Math.max(m.aggro||8, 17); m.state='chase'; m.hx=sp[0]; m.hy=sp[1]; m.respawnT=-1;
    if(typeof burst==='function') burst(m.x, m.y-0.4, '#c77bff', 8, 1.8); return true; };
  let placed=0;
  for(let i=0;i<kinds.length;i++){
    // try a spread of rings around the player (biased north, toward the palace) until a
    // spot takes - the capital's quays and canals leave patchy open ground.
    let sp=null;
    for(const r of [7, 10, 5, 13, 9]){
      const a=(i/kinds.length)*TAU + Math.sin(n*1.7+i)*0.35;
      const gx=Math.round(P.x+Math.cos(a)*r), gy=Math.round(P.y+Math.sin(a)*r - 3);
      sp=(typeof findOpenNear==='function' && findOpenNear(gx,gy,7)) || null;
      if(sp) break;
    }
    if(!sp) continue;
    if(arm(spawnMob(kinds[i], sp[0], sp[1]), sp)) placed++;
  }
  // never stall the finale: if geometry blocked the whole wave, force one by the player
  if(!placed){
    const sp=(typeof findOpenNear==='function' && findOpenNear(Math.round(P.x), Math.round(P.y)-4, 12)) || [Math.round(P.x), Math.round(P.y)-4];
    arm(spawnMob('raider', sp[0], sp[1]), sp);
  }
}

// ---- Vath comes down from the throne -----------------------------------------
function capitalVathPhase(){
  if(typeof banner==='function') banner('VATH THE EMBERBINDER','THE USURPER COMES DOWN FROM THE THRONE');
  const PA=(typeof CROWN_ZONES!=='undefined') ? CROWN_ZONES.palace : {x:100,y:64};
  let sp = (typeof findOpenNear==='function' && findOpenNear(Math.round(P.x), Math.round(P.y)-9, 9))
        || (typeof findOpenNear==='function' && findOpenNear(Math.round(PA.x), Math.round(PA.y)+18, 14))
        || [Math.round(P.x), Math.round(P.y)-9];
  const m=spawnMob('mage', sp[0], sp[1]);
  if(m){
    m.capVath=1; m.boss=true; m.bigBoss=true;
    m.title='VATH THE EMBERBINDER'; m.subtitle='USURPER OF THE TIDEGLASS THRONE'; m.ach='enchantersbane';
    m.lvl=18; m.maxhp=1500; m.hp=1500; m.dmg=34; m.speed=3.0; m.aggro=22;
    m.state='idle'; m.hx=sp[0]; m.hy=sp[1]; m.respawnT=-1;
    m.entrance='enthrall'; m.entranceTitle='VATH THE EMBERBINDER'; m.entranceSub='USURPER OF THE TIDEGLASS THRONE';
  }
  const C='#c9a0ff';
  storyCard('<i>The violet gathers into a shape you have chased across every isle, and at last it stops running. He spreads empty hands over the fallen city like a man showing you his work.</i> <b style="color:'+C+'">"First mate. You brought the whole line home to me — the sister, the brother, the little book. How TIDY."</b> <i>He smiles, and draws breath to go on —</i> <b style="color:#bfe8ff">so you still the tide, and do not let him finish.</b>',
    { label:'Still the tide — and end him', onOk:()=>{} });
  if(typeof autoSave==='function') autoSave();
}

// ---- the seal (death-intercept target — see js/09-gameplay.js) ---------------
function sealVath(m){
  m.sealed=1; m.dead=true; m.respawnT=-1; m.state='idle'; m.hp=1;
  P.story = P.story || {};
  P.story.vathSealed=1; P.story.finaleWon=1; P.story.kingFreed=1;
  P.story.act=Math.max(P.story.act||1, 5);
  // his hand comes off the thralls the instant he is bound
  for(const o of G.mobs){ if(o.capThrall && !o.dead){ o.dead=true; o.respawnT=-1; if(typeof burst==='function') burst(o.x,o.y-0.4,'#c8b8e0',10,1.8); } }
  if(typeof bossReward==='function') bossReward(m);
  if(typeof Snd!=='undefined' && Snd.boss) Snd.boss();
  G.shake=1.0; G.slowmo=1.2;
  if(typeof shockwave==='function') shockwave(m.x, m.y, 'rgba(199,123,255,0.95)', 140);
  if(typeof G!=='undefined') for(let i=0;i<48;i++){ const a=Math.random()*TAU, s=rnd(1,5);
    G.parts.push({x:m.x,y:m.y-0.4,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:rnd(0.8,1.9),color:'#c77bff',size:rnd(2,4),grav:-0.05}); }
  if(typeof banner==='function') banner('VATH IS SEALED',"THE TIDEFARER'S WORK, FINISHED");
  if(typeof updateBossUI==='function') updateBossUI();
  // a liberated capital should regenerate peaceful (folk back, no thralls) on any return
  if(typeof WORLDS!=='undefined') delete WORLDS.crown;
  setTimeout(()=>capitalEnding(m), 1300);
  if(typeof autoSave==='function') autoSave();
}
window.sealVath = sealVath;

// ---- the ending --------------------------------------------------------------
function capitalEnding(m){
  const C='#c9a0ff', J='#c9b0ff', A='#ffe9a8';
  const card=(html,label,next)=>storyCard(html,{label:label||'Continue', onOk:next});
  card('<i>He is on his knees, and still he opens his mouth — the old trick, the talking, the turning. But this time a second voice comes first.</i> <b style="color:'+J+'">Jaist.</b> <i>The scholar reads the Tidefarer\'s seal off the tide-glass page, low and sure and unhurried, the sealing done RIGHT — and it does not rebound.</i>',
    'Speak the seal', ()=>
  card('<b style="color:'+C+'">"...clever,"</b> <i>Vath breathes, as the violet cords whip back and take him — his own leash, closing on his own throat. He folds inward, smaller and smaller, into a bound and silent dark.</i> <b style="color:#8fd8ff">No waterfall this time. No last word. Just the seal, and quiet.</b>',
    'The throne hall', ()=>
  card('<i>The palace doors stand open. On the dais, grey and thin but UPRIGHT, </i><b style="color:'+A+'">King Aldous</b><i> rises from the stolen throne as the violet drains out of the Tideglass and the old warm light comes home to it.</i> <b style="color:'+A+'">"My daughter. My son."</b> <i>His voice breaks on it.</i> <b style="color:'+A+'">"The tide owed me an answer. It sent me two."</b>',
    'Come home', ()=>
  card('<i>Dawn breaks over Aldermere — a true one, the first in an age. Isle by isle the curses lift for good: the wind falls kind over Windsurf, Mount Kea cools, the strait off Barik runs clear, and on a grave-isle off Emberwick a pale queen sleeps easy at last, her work finished by the line she trusted it to.</i>',
    'The Tidefarer\'s work is done', ()=>
  card('<b style="color:'+A+'">THE TIDEFARER</b><br><br><i>Joan the warrior, Jaist the scholar, and Aldous their father hold the isles again — not by a blood the enemy could not touch, but by the two of you who would not let the kingdom fall while you still stood between it and the dark.</i><br><br><b style="color:'+A+'">— THE END —</b>',
    'The isles are free', ()=>{
      P.story = P.story || {}; P.story.finale = 1;
      if(typeof award==='function'){ try{ award('enchantersbane'); }catch(e){} }
      if(typeof toast==='function') toast('<b style="color:#ffe9a8">The Tidefarer is free.</b> The isles are yours to sail in peace — the curses lifted, the seas open, the capital liberated. Thank you for playing.', 12000);
      if(typeof autoSave==='function') autoSave();
    })))));
}
window.capitalEnding = capitalEnding;

})();
