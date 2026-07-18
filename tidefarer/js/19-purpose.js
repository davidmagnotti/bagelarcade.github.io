/* =====================================================================
   PURPOSE LAYER - village projects & rolling supply contracts
   ===================================================================== */
P.projects=P.projects||{}; P.contract=P.contract||0; P.wellCd=0;

const PROJECTS={
  well:  {name:'Mend the Old Well', need:{stone:8, bar:2}, where:'maren',
    perk:'Drink at the village well: full heal, every 90s.',
    done:'“Sweetest water on the isle, flowing again. Drink deep whenever you pass.”'},
  crane: {name:'Raise the Dock Crane', need:{wood:12, hardwood:4}, where:'maren',
    perk:'Every catch lands +1 fish, and fish sell for more.',
    done:'“Finn wept, you know. Actual tears. The crane swings again.”'},
  lanes: {name:'Light the Lanes', need:{wood:10, stone:6}, where:'maren',
    perk:'New lanterns warm the village paths at night.',
    done:'“Look at them glow. No one stumbles home in the dark now - that\'s your doing.”'},
  beacon:{name:'Raise the Harbor Beacon', need:{bar:6, hardwood:8}, where:'kell',
    perk:'Trade routes open: everything sells for +15%.',
    done:'“Ships already turning toward the light. Greyharbor trades again - prices are up, friend.”'}
};
function priceOf(k){
  let p=SELL_PRICES[k]||0;
  if(k==='fish'||k==='cookedfish') p += P.projects.crane?1:0;
  if(P.projects.beacon) p=Math.round(p*1.15);
  return p;
}
function placeLaneLamps(){
  for(const s of [[45,60],[49,62],[52,60],[47,55]]) addBuilding('lamp',s[0],s[1],'');
}
function placeBeacon(){
  const D=ZONES.dock;
  addBuilding('lamp',D.x-1,D.y-2,''); addBuilding('lamp',D.x-1,D.y+3,'');
  addBuilding('lamp',D.x+1,D.y-2,''); addBuilding('lamp',D.x+1,D.y+3,'');
}
function buildProject(id,npc){
  P.projects[id]=true;
  if(id==='lanes' && G.worldId==='isle') placeLaneLamps();
  if(id==='beacon' && G.worldId==='main') placeBeacon();
  banner('PROJECT COMPLETE', PROJECTS[id].name.toUpperCase());
  shockwave(P.x,P.y,'rgba(255,215,106,0.9)',50);
  addXP('woodcut',60); addXP('mining',60);
  Snd.levelup(); setTimeout(autoSave,300);
  setDialog('“'+PROJECTS[id].done+'”', [{label:'Continue',fn:()=>projectsMenu(npc)}]);
}
function projectsMenu(npc){
  const btns=[];
  for(const id in PROJECTS){
    const pr=PROJECTS[id];
    if(pr.where!==npc.id) continue;
    if(P.projects[id]){
      btns.push({label:'✓ '+pr.name+' <span style="font-size:10px;color:#9be07f">(built)</span>', ghost:true, fn:()=>{}});
      continue;
    }
    btns.push({label:pr.name+'<br><span style="font-size:10px;color:var(--parch-dim)">'+costText(pr.need)+' - '+pr.perk+'</span>',
      fn:()=>{
        if(!canPay(pr.need)){
          setDialog('“A fine ambition - bring '+costText(pr.need)+' and we\'ll see it done.”',
            [{label:'Back',fn:()=>projectsMenu(npc)},{label:'Farewell',ghost:true,fn:closeDialog}]);
          return;
        }
        pay(pr.need); buildProject(id,npc);
      }});
  }
  btns.push({label:'Back',ghost:true,fn:()=>buildDialogContent(npc)});
  setDialog(npc.id==='maren'
    ? '“The isle gives you wood and stone - give a little back, and watch the village grow.”'
    : '“Greyharbor was great once. With the right materials, it will be again.”', btns);
}

/* ---------- rolling supply contracts: gathering always pays ---------- */
const CONTRACTS=[
  {need:{wood:10},   gold:20, skill:'woodcut', xp:50, line:'Bram wants pine for tool hafts.'},
  {need:{stone:8},   gold:18, skill:'mining',  xp:50, line:'The well wall wants shoring.'},
  {need:{fish:5},    gold:24, skill:'fishing', xp:60, line:'Nia\'s begged for a fish supper all week.'},
  {need:{hardwood:3},gold:24, skill:'woodcut', xp:70, line:'Orin needs heartwood for staff blanks.'},
  {need:{ore:4},     gold:28, skill:'mining',  xp:70, line:'Bram\'s stockpile of raw iron runs thin.'},
  {need:{wheat:6},   gold:20, skill:'farming', xp:60, line:'The village ovens are hungry.'}
];
function contractMenu(npc){
  const c=CONTRACTS[P.contract%CONTRACTS.length];
  setDialog('<b style="color:var(--ember)">Supply contract</b><br>“'+c.line+'”<br>'+
    '<span style="font-size:11px;color:var(--parch-dim)">Deliver '+costText(c.need)+' → <b style="color:#ffd76a">'+c.gold+'g</b> + '+c.xp+' '+SKILLS[c.skill].name+' XP</span>',
    [{label:'Deliver', fn:()=>{
        if(!canPay(c.need)){
          setDialog('“Short of the order. It\'ll keep - the island regrows fast.”',
            [{label:'Back',fn:()=>contractMenu(npc)},{label:'Farewell',ghost:true,fn:closeDialog}]);
          return;
        }
        pay(c.need); giveGold(c.gold); addXP(c.skill,c.xp);
        P.contract++; Snd.coin(); setTimeout(autoSave,300);
        setDialog('“Delivered and paid. A new request is already on the board.”',
          [{label:'Next contract',fn:()=>contractMenu(npc)},{label:'Farewell',ghost:true,fn:closeDialog}]);
      }},
     {label:'Back',ghost:true,fn:()=>buildDialogContent(npc)}]);
}

