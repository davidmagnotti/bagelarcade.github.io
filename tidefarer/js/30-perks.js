/* =====================================================================
   SKILL PERKS - build-defining choices along each combat skill's climb.
   Each combat skill (melee/archery/magic) now has THREE milestone TIERS,
   at levels 5, 12 and 20 - a one-time pick of two perks at each. This is
   the fix for the old "dead tail": leveling past 5 now keeps paying out in
   real choices. Perks are stored on P.perks by id and read inline by the
   combat code (tryAttack / damageMob / meleeDmg&co / killMob). Per-tier
   availability is keyed 'skill:tierIndex' in P.perkAvail and is always
   RE-DERIVED from level + chosen-state, so old saves migrate for free.
   ===================================================================== */
P.perks = P.perks || {};
P.perkAvail = P.perkAvail || {};

const PERKS = {
  melee: { label:'Melee', tiers:[
    { lvl:5,  choices:[
      {id:'executioner', name:'Executioner', desc:'+50% damage to foes below 30% HP - end the wounded fast.'},
      {id:'cleaver',     name:'Cleaver',     desc:'Your finisher sweeps a wide, deep arc - a true crowd-cleaver.'} ]},
    { lvl:12, choices:[
      {id:'reaver', name:'Reaver', desc:'+15% melee damage - every blow bites deeper.'},
      {id:'vigor',  name:'Vigor',  desc:'+25 max HP, healed full on the spot - harder to put down.'} ]},
    { lvl:20, choices:[
      {id:'bloodthirst', name:'Bloodthirst', desc:'Recover 3 HP on every melee kill - fight on through a crowd.'},
      {id:'juggernaut',  name:'Juggernaut',  desc:'+40 max HP, healed full on the spot - a wall of a warrior.'} ]},
  ]},
  archery: { label:'Archery', tiers:[
    { lvl:5,  choices:[
      {id:'deadeye',   name:'Deadeye',   desc:'+18% critical-hit chance with the bow.'},
      {id:'quickdraw', name:'Quickdraw', desc:'Nock and loose far faster - about 30% quicker shots.'} ]},
    { lvl:12, choices:[
      {id:'sharpshooter', name:'Sharpshooter', desc:'+15% bow damage - each shaft hits harder.'},
      {id:'deepquiver',   name:'Deep Quiver',  desc:'+8 quiver capacity, refilled now - loose more before you run dry.'} ]},
    { lvl:20, choices:[
      {id:'hawkeye', name:'Hawkeye', desc:'A further +18% critical-hit chance with the bow.'},
      {id:'plenty',  name:'Ample Quiver', desc:'+12 quiver capacity, refilled now - a near-endless volley.'} ]},
  ]},
  magic: { label:'Magic', tiers:[
    { lvl:5,  choices:[
      {id:'emberburst', name:'Emberburst', desc:'Fire bolts erupt in a far wider blast.'},
      {id:'frostbolt',  name:'Overcharge', desc:'Your bolts strike for double damage.'} ]},
    { lvl:12, choices:[
      {id:'arcanist', name:'Arcanist', desc:'+15% magic damage.'},
      {id:'manawell', name:'Mana Well', desc:'+20 max mana, refilled now - cast longer between rests.'} ]},
    { lvl:20, choices:[
      {id:'channeler', name:'Channeler', desc:'+20% magic damage.'},
      {id:'overflow',  name:'Overflow',  desc:'+30 max mana, refilled now - a deep, deep well.'} ]},
  ]}
};

// one-time stat bumps applied the instant a perk is chosen (persist via the save's
// maxhp/maxmp/maxArrows - a perk is only ever chosen once, so they never double-apply)
const PERK_BUMPS = {
  vigor:{hp:25}, juggernaut:{hp:40},
  deepquiver:{arrows:8}, plenty:{arrows:12},
  manawell:{mp:20}, overflow:{mp:30}
};
function applyPerkBump(id){
  const b=PERK_BUMPS[id]; if(!b) return;
  if(b.hp){ P.maxhp+=b.hp; P.hp=P.maxhp; }
  if(b.mp){ P.maxmp+=b.mp; P.mp=P.maxmp; }
  if(b.arrows){ P.maxArrows=(P.maxArrows||20)+b.arrows; P.arrows=P.maxArrows; }
  if(typeof refreshUI==='function') refreshUI();
}
// has any choice in this tier been picked?
function tierChosen(tier){ return tier.choices.some(c=>P.perks[c.id]); }
// locate a perk id -> {skill, tier, ti}
function findPerk(id){
  for(const sk in PERKS){ const ts=PERKS[sk].tiers;
    for(let i=0;i<ts.length;i++){ if(ts[i].choices.some(c=>c.id===id)) return {skill:sk, tier:ts[i], ti:i}; } }
  return null;
}
// has the player already picked a perk for EVERY reached tier of this skill? (used to
// gate the milestone banner - true only when nothing is pending)
function perkChosenFor(skill){
  const p=PERKS[skill]; if(!p) return false;
  const lvl=(P.skills[skill] && P.skills[skill].lvl)||1;
  return p.tiers.every(t=> lvl<t.lvl || tierChosen(t));
}
// called from addXP after a level-up: open any newly-reached tier's choice
function checkPerkMilestone(skill){
  const p=PERKS[skill]; if(!p) return;
  P.perks=P.perks||{}; P.perkAvail=P.perkAvail||{};
  const lvl=(P.skills[skill] && P.skills[skill].lvl)||1;
  p.tiers.forEach((t,i)=>{
    const key=skill+':'+i;
    if(lvl>=t.lvl && !tierChosen(t) && !P.perkAvail[key]){
      P.perkAvail[key]=true;
      if(typeof banner==='function') banner(p.label.toUpperCase()+' MASTERY','CHOOSE A PERK - OPEN SKILLS');
    }
  });
}
// commit a choice
function choosePerk(skill, id){
  const info=findPerk(id); if(!info || info.skill!==skill) return;
  const key=skill+':'+info.ti;
  if(!P.perkAvail[key] || tierChosen(info.tier)) return;
  const c=info.tier.choices.find(x=>x.id===id); if(!c) return;
  P.perks=P.perks||{}; P.perks[id]=true; delete P.perkAvail[key];
  applyPerkBump(id);
  if(typeof Snd!=='undefined' && Snd.levelup) Snd.levelup();
  if(typeof banner==='function') banner('PERK LEARNED', c.name.toUpperCase());
  if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(155,224,127,0.9)',44);
  if(typeof refreshSkillsPanel==='function') refreshSkillsPanel();
  if(typeof autoSave==='function') setTimeout(autoSave,200);
}
// on load, surface any tier the player already qualifies for but never picked
function syncPerkAvailability(){
  P.perks=P.perks||{}; P.perkAvail=P.perkAvail||{};
  for(const skill in PERKS){
    const p=PERKS[skill]; const lvl=(P.skills && P.skills[skill] && P.skills[skill].lvl)||1;
    p.tiers.forEach((t,i)=>{ if(lvl>=t.lvl && !tierChosen(t)) P.perkAvail[skill+':'+i]=true; });
  }
}

// ---- Skills-panel UI: append a perk section under the skill rows ----
function augmentSkillPerks(){
  const rows=document.getElementById('skillRows'); if(!rows) return;
  let html='<div style="margin-top:12px;border-top:1px solid #4a3a26;padding-top:8px;">'+
    '<div style="font-size:11px;letter-spacing:2px;color:var(--parch-dim);text-transform:uppercase;margin-bottom:6px;">Perks</div>';
  for(const skill in PERKS){
    const p=PERKS[skill];
    const lvl=(P.skills && P.skills[skill] && P.skills[skill].lvl)||1;
    p.tiers.forEach((t,i)=>{
      const chosen=t.choices.find(c=>P.perks[c.id]);
      const label=p.label+' <span style="color:var(--parch-dim);font-weight:normal;">Lv '+t.lvl+'</span>';
      if(chosen){
        html+='<div class="skrow" style="align-items:center;"><div class="skn">'+label+'</div>'+
          '<div class="perk" style="flex:1;"><b style="color:#9be07f">★ '+chosen.name+'</b> - '+chosen.desc+'</div></div>';
      } else if(P.perkAvail[skill+':'+i] || (lvl>=t.lvl)){
        html+='<div class="skrow" style="flex-wrap:wrap;align-items:stretch;gap:6px;"><div class="skn" style="width:100%;color:var(--ember);">'+
          p.label+' Lv '+t.lvl+' - choose one:</div>';
        for(const c of t.choices){
          html+='<button class="btn" style="flex:1;min-width:44%;text-align:left;font-size:11px;padding:6px 8px;" '+
            'onclick="choosePerk(\''+skill+'\',\''+c.id+'\')"><b>'+c.name+'</b><br>'+
            '<span style="font-size:10px;color:var(--parch-dim)">'+c.desc+'</span></button>';
        }
        html+='</div>';
      } else {
        html+='<div class="skrow"><div class="skn">'+label+'</div>'+
          '<div class="perk" style="opacity:.6;">Unlocks at '+p.label+' level '+t.lvl+'.</div></div>';
      }
    });
  }
  html+='</div>';
  rows.insertAdjacentHTML('beforeend', html);
}

// wrap the base skills-panel renderer so the perk section always follows it
if(typeof refreshSkillsPanel==='function'){
  const _baseRefreshSkills = refreshSkillsPanel;
  refreshSkillsPanel = function(){
    _baseRefreshSkills();
    if(document.getElementById('skillPanel') && document.getElementById('skillPanel').style.display==='block') augmentSkillPerks();
  };
}
// catch up any already-earned milestones from an older save
try{ syncPerkAvailability(); }catch(e){}
