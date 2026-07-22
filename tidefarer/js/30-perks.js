/* =====================================================================
   SKILL PERKS - a build-defining choice at each combat skill's milestone.
   Reaching level 5 in melee, archery or magic offers a one-time pick of
   two perks that genuinely change how the weapon plays. Perks are stored
   on P.perks and read inline by the combat code (tryAttack / damageMob).
   ===================================================================== */
P.perks = P.perks || {};
P.perkAvail = P.perkAvail || {};

const PERKS = {
  melee: { lvl:5, label:'Melee', choices:[
    {id:'executioner', name:'Executioner', desc:'+50% damage to foes below 30% HP - end the wounded fast.'},
    {id:'cleaver',     name:'Cleaver',     desc:'Your finisher sweeps a wide, deep arc - a true crowd-cleaver.'} ]},
  archery: { lvl:5, label:'Archery', choices:[
    {id:'deadeye',   name:'Deadeye',   desc:'+18% critical-hit chance with the bow.'},
    {id:'quickdraw', name:'Quickdraw', desc:'Nock and loose far faster - about 30% quicker shots.'} ]},
  magic: { lvl:5, label:'Magic', choices:[
    {id:'emberburst', name:'Emberburst', desc:'Fire bolts erupt in a far wider blast.'},
    {id:'frostbolt',  name:'Frostbolt',  desc:'Your bolts chill and slow whatever they strike.'} ]}
};

// has the player already picked a perk for this skill?
function perkChosenFor(skill){
  const p=PERKS[skill]; if(!p) return false;
  return p.choices.some(c=>P.perks[c.id]);
}
// called from addXP after a level-up: open the choice when the milestone is reached
function checkPerkMilestone(skill){
  const p=PERKS[skill]; if(!p) return;
  P.perks=P.perks||{}; P.perkAvail=P.perkAvail||{};
  if((P.skills[skill].lvl||1) >= p.lvl && !perkChosenFor(skill) && !P.perkAvail[skill]){
    P.perkAvail[skill]=true;
    if(typeof banner==='function') banner(p.label.toUpperCase()+' MASTERY','CHOOSE A PERK - OPEN SKILLS');
    if(typeof toast==='function') toast('<b style="color:var(--ember)">A '+p.label+' perk awaits.</b> Open the <b>Skills</b> panel to choose your path.',6000);
  }
}
// commit a choice
function choosePerk(skill, id){
  const p=PERKS[skill]; if(!p || !P.perkAvail[skill]) return;
  if(perkChosenFor(skill)) return;
  const c=p.choices.find(x=>x.id===id); if(!c) return;
  P.perks=P.perks||{}; P.perks[id]=true; delete P.perkAvail[skill];
  if(typeof Snd!=='undefined' && Snd.levelup) Snd.levelup();
  if(typeof banner==='function') banner('PERK LEARNED', c.name.toUpperCase());
  if(typeof toast==='function') toast('<b style="color:#9be07f">'+c.name+':</b> '+c.desc, 6000);
  if(typeof shockwave==='function') shockwave(P.x,P.y,'rgba(155,224,127,0.9)',44);
  if(typeof refreshSkillsPanel==='function') refreshSkillsPanel();
  if(typeof autoSave==='function') setTimeout(autoSave,200);
}
// on load, surface any milestone the player already qualifies for but never picked
function syncPerkAvailability(){
  for(const skill in PERKS){
    const p=PERKS[skill];
    if(P.skills && P.skills[skill] && (P.skills[skill].lvl||1)>=p.lvl && !perkChosenFor(skill)) P.perkAvail[skill]=true;
  }
}

// ---- Skills-panel UI: append a perk section under the skill rows ----
function augmentSkillPerks(){
  const rows=document.getElementById('skillRows'); if(!rows) return;
  let html='<div style="margin-top:12px;border-top:1px solid #4a3a26;padding-top:8px;">'+
    '<div style="font-size:11px;letter-spacing:2px;color:var(--parch-dim);text-transform:uppercase;margin-bottom:6px;">Perks</div>';
  let any=false;
  for(const skill in PERKS){
    const p=PERKS[skill];
    const chosen=p.choices.find(c=>P.perks[c.id]);
    if(chosen){
      any=true;
      html+='<div class="skrow" style="align-items:center;"><div class="skn">'+p.label+'</div>'+
        '<div class="perk" style="flex:1;"><b style="color:#9be07f">★ '+chosen.name+'</b> - '+chosen.desc+'</div></div>';
    } else if(P.perkAvail[skill]){
      any=true;
      html+='<div class="skrow" style="flex-wrap:wrap;align-items:stretch;gap:6px;"><div class="skn" style="width:100%;color:var(--ember);">'+
        p.label+' - choose one:</div>';
      for(const c of p.choices){
        html+='<button class="btn" style="flex:1;min-width:44%;text-align:left;font-size:11px;padding:6px 8px;" '+
          'onclick="choosePerk(\''+skill+'\',\''+c.id+'\')"><b>'+c.name+'</b><br>'+
          '<span style="font-size:10px;color:var(--parch-dim)">'+c.desc+'</span></button>';
      }
      html+='</div>';
    } else {
      html+='<div class="skrow"><div class="skn">'+p.label+'</div>'+
        '<div class="perk" style="opacity:.6;">Perk unlocks at '+p.label+' level '+p.lvl+'.</div></div>';
    }
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
