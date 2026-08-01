/* =====================================================================
   DUNGEON TRINKETS  -  a distinct new item prize for every dungeon.

   Each is a passive keepsake with ONE clear, themed effect, plugged into
   the existing stat formulas (meleeDmg/bowDmg/magicDmg, the crit roll, the
   hurt-reduction, the gather power, the walk speed) via trinketBonus(stat).
   +max-hp / +max-mana kinds apply once on pickup, like the Hollow Crown.

   Placement: placeDungeonItems(id) runs from switchWorld on each fresh
   world-gen and drops a {itemgift:<key>} bonus chest near the dungeon
   entrance, once, persisted through P.story.tg (like the tool-gate content).
   Dungeons that already got a bespoke prize this session - the Undermaw
   (Rivenedge Axe) and Emberdeep (Cragbreaker Pick) - are left as they are.
   ===================================================================== */
(function(){
'use strict';

var TRINKETS={
  skytalon:   {name:'Skytalon Charm',    tag:'+8% CRITICAL CHANCE',        crit:0.08,
    desc:'A raptor’s talon from the Underclimb, strung on sinew. Your blows find the gap far oftener.'},
  rimeheart:  {name:'Rimeheart Pendant',  tag:'-3 DAMAGE FROM EVERY BLOW',  flatdef:3,
    desc:'A shard of the Rimebound’s frozen heart. The cold in it drinks a blow’s bite - every hit you take lands 3 lighter.'},
  bearhide:   {name:'Bearhide Cloak',     tag:'+25 MAX HEALTH',            hp:25,
    desc:'The Hoarfrost Bear’s pelt, cured and clasped at the throat. +25 to your maximum health, for good.'},
  drownpearl: {name:'Drowned Pearl',      tag:'+20 MAX MANA',             mp:20,
    desc:'A black pearl the Drowned Minotaur guarded, cold and deep. +20 to your maximum mana.'},
  geargloves: {name:'Gearwright Gloves',  tag:'+2 GATHERING POWER',       gather:2,
    desc:'Oiled leather gloves from the Undermill’s works. Wood and stone give way faster under axe and pick.'},
  tidesteel:  {name:'Tidesteel Band',     tag:'+5 MELEE DAMAGE',          melee:5,
    desc:'A ring beaten from tide-cured steel in the Drowned Vault. +5 damage to every melee blow.'},
  galeboots:  {name:'Galestride Boots',   tag:'+12% MOVE SPEED',          speed:0.12,
    desc:'Storm-light boots from the Gale Spire. The wind is always at your heel - you move a good deal faster.'},
  cinderring: {name:'Cinderforged Ring',  tag:'+6 MAGIC DAMAGE',          magic:6,
    desc:'A band forged in the Ashen Forge with a coal still live within. +6 damage to every spell and staff-bolt.'},
  stormcore:  {name:'Stormcore Shard',    tag:'+3 DAMAGE - ALL ATTACKS',  dmg:3,
    desc:'The Storm Temple’s caged lightning, set in glass. +3 damage to every attack you make.'},
  signet:     {name:'Founders’ Signet', tag:'+4 ALL DAMAGE, +15 MAX HP', dmg:4, hp:15,
    desc:'The signet of the royal house, sealed in the Tideward Crypt. The founders’ favour: +4 to every attack and +15 max health.'},
  prismlens:  {name:'Prism Lens',         tag:'+6 ARCHERY DAMAGE',        archery:6,
    desc:'A sliver of the Storm-Eye’s shattered core. Sighted through it, every arrow bites deeper.'}
};

// dungeon world id -> the trinket it awards
var TG_DUNGEON_ITEM={
  aeriedeep:'skytalon', frostdeep:'rimeheart', frostvault:'bearhide', reachdeep:'drownpearl',
  milldeep:'geargloves', barikdeep:'tidesteel', winddeep:'galeboots', sunwarddeep:'cinderring',
  skydeep:'stormcore', embertomb:'signet', skydungeon:'prismlens'
};

// register into the master ITEMS table so the satchel shows them
for(var k in TRINKETS){ if(typeof ITEMS!=='undefined') ITEMS[k]={name:TRINKETS[k].name, desc:TRINKETS[k].desc}; }

// sum the given effect across every trinket the player is carrying
function trinketBonus(stat){
  var s=0;
  for(var key in TRINKETS){ var it=TRINKETS[key]; if(it[stat] && P.inv && (P.inv[key]||0)>0) s+=it[stat]; }
  return s;
}

function grantTrinket(key){
  var it=TRINKETS[key]; if(!it) return false;
  var had=!!(P.inv && P.inv[key]);
  give(key,1);
  if(!had){ if(it.hp){ P.maxhp+=it.hp; P.hp=P.maxhp; } if(it.mp){ P.maxmp+=it.mp; P.mp=P.maxmp; } }
  banner(it.name.toUpperCase(), it.tag);
  if(typeof storyCard==='function') storyCard('<b style="color:#ffe9a8">'+it.name+'</b> - <i>'+it.desc+'</i>');
  if(typeof Snd!=='undefined' && Snd.levelup) Snd.levelup();
  if(typeof refreshUI==='function') refreshUI();
  return true;
}

function placeDungeonItems(id){
  try{
    var key=TG_DUNGEON_ITEM[id]; if(!key) return;
    P.story=P.story||{}; P.story.tg=P.story.tg||{};
    if(P.story.tg[id+':item']) return;          // already taken
    if(P.inv && P.inv[key]) return;             // already own it
    var def=WORLD_DEFS[id]; if(!def || !def.spawn) return;
    var sx=Math.round(def.spawn.x), sy=Math.round(def.spawn.y);
    var pos=(typeof findOpenNear==='function' &&
      (findOpenNear(sx-5,sy+3,10)||findOpenNear(sx+4,sy+4,10)||findOpenNear(sx,sy+6,12)||findOpenNear(sx,sy,16))) || null;
    if(!pos) return;
    G.decor.push({kind:'chest', x:pos[0]+0.5, y:pos[1]+0.5, itemgift:key, tgid:id+':item'});
  }catch(e){ try{ console.warn('placeDungeonItems failed', e); }catch(_){ } }
}

window.TRINKETS=TRINKETS; window.trinketBonus=trinketBonus; window.grantTrinket=grantTrinket;
window.placeDungeonItems=placeDungeonItems;

})();
