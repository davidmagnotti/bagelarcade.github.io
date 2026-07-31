/* =====================================================================
   RESOURCE ECONOMY - rare materials, smithing, cooking, brewing, trade
   ===================================================================== */
P.tools=P.tools||{axe:0,pick:0}; P.armor=P.armor||0; P.armorOwn=Math.max(P.armorOwn||0,P.armor||0);
ITEMS.hardwood={name:'Hardwood', desc:'Dense heartwood from the old forest pines.'};
ITEMS.ore={name:'Iron Ore', desc:'Raw iron in the stone. Shipwrights and smiths pay well for it.'};
ITEMS.bar={name:'Iron Bar', desc:'A stamped bar of old iron - a curio now, but it still sells dear.'};
ITEMS.crystal={name:'Ember Crystal', desc:'Warm to the touch. Orin covets these.'};
ITEMS.pearl={name:'Pearl', desc:"A fisher's fortune - sells dearly."};
ITEMS.bread={name:'Fresh Bread', desc:'Restores 25 HP. Willa bakes it from 3 wheat.', use:'heal', heal:25};
ITEMS.cookedfish={name:'Grilled Fish', desc:'Restores 20 HP.', use:'heal', heal:20};
ITEMS.stew={name:'Hearth Stew', desc:'Restores 45 HP. A whole meal in a bowl.', use:'heal', heal:45};
ITEMS.roast={name:'Roast Boar', desc:'Restores 42 HP. Rich, dark, and dripping.', use:'heal', heal:42};
ACH.prospector={t:'Prospector',d:'Pull 5 iron ore from the stone.'};
ACH.pearldiver={t:'Pearl Diver',d:'Reel in a pearl.'};
ACH.mastersmith={t:'Master Smith',d:'Wield the steel sword.'};
ACH.loremaster={t:'Loremaster',d:'Read every text and stone on both islands.'};
ACH.ironclad={t:'Ironclad',d:'Wear the steel plate.'};
ACH.delver={t:'Delver',d:'Claim the heart of the Undermaw.'};   // awarded at the cave chest (20-lore) - was never registered, so the award silently no-op'd

const SELL_PRICES={fish:3, cookedfish:4, wood:1, stone:1, hardwood:4, ore:5, bar:14, pearl:25, crystal:15, mushroom:2, wheat:2, apple:2, stew:7, roast:7};

function costText(need){ return Object.keys(need).map(k=>need[k]+' '+ITEMS[k].name.toLowerCase()).join(' + '); }
function canPay(need){ for(const k in need) if(!has(k,need[k])) return false; return true; }
function pay(need){ for(const k in need) take(k,need[k]); }

/* ---------- Bram: the forge bench has been retired ----------
   The tutorial smith no longer runs a crafting menu. Weapons, armor and tool
   upgrades are earned through the isle's quests, its foes, and the crossing kit;
   the iron the quests and projects call for is now raw ore, mined directly, so
   nothing depends on a smelting bench any more. Iron bars survive only as a rare
   curio you can sell. (craftMenu removed.) */

/* ---------- Maren: trade goods for gold ---------- */
function sellMenu(npc){
  const btns=[];
  for(const k in SELL_PRICES){
    const n=P.inv[k]||0;
    if(n<=0) continue;
    const total=n*priceOf(k);
    btns.push({label:'Sell '+n+' '+ITEMS[k].name.toLowerCase()+' - <b style="color:#ffd76a">'+total+'g</b>',
      fn:()=>{ take(k,n); giveGold(total);
        P.prog.profit=(P.prog.profit||0)+n; updateQuestUI(); sellMenu(npc); }});
  }
  if(!btns.length) btns.push({label:'Nothing in the satchel worth coin', ghost:true, fn:()=>buildDialogContent(npc)});
  btns.push({label:'Back',ghost:true,fn:()=>buildDialogContent(npc)});
  setDialog('“Let\'s see what the island gave you. Fair prices, always.”', btns);
}

/* ---------- Willa: hearth cooking ---------- */
function cookMenu(npc){
  const opts=[
    {label:'Bake bread (3 wheat) - heals 25', need:{wheat:3}, item:'bread', line:'“Fresh from the oven - mind your fingers.”'},
    {label:'Grill fish (1 fish) - heals 20', need:{fish:1}, item:'cookedfish', line:'“Skin-crisp and steaming. Eat it warm.”'},
    {label:'Simmer hearth stew (1 grilled fish + 1 bluecap + 1 wheat) - heals 45', need:{cookedfish:1, mushroom:1, wheat:1}, item:'stew', line:'“A whole meal in one bowl - that\'ll put the legs back under you.”'},
    {label:'Roast boar (1 boar meat + 1 wheat) - heals 42', need:{boarmeat:1, wheat:1}, item:'roast', line:'“Slow-turned over the coals till it falls off the bone. Rich work, that.”'}
  ];
  const btns=opts.map(o=>({label:o.label, fn:()=>{
    if(!canPay(o.need)){ setDialog('“You\'ll need '+costText(o.need)+' for that.”',
      [{label:'Back',fn:()=>cookMenu(npc)}]); return; }
    pay(o.need); give(o.item,1); Snd.pickup();
    setDialog(o.line, [{label:'Cook more',fn:()=>cookMenu(npc)},{label:'Farewell',ghost:true,fn:closeDialog}]);
  }}));
  btns.push({label: npc?'Back':'Step away', ghost:true, fn:()=> npc? buildDialogContent(npc) : closeDialog()});
  setDialog('“The hearth\'s always lit. Hungry work, adventuring.”', btns);
}

/* ---------- Orin: crystal brewing ---------- */
function brewMenu(npc){
  const tonic={mushroom:2, crystal:1};
  const great={potion:2, crystal:1, mushroom:1};
  const gooTonic={goo:3};
  setDialog('“The cellar\'s warm and the crystals are humming. What shall we draw off the boil?”',
    [{label:'Render slime goo (3 goo → 1 tonic)', fn:()=>{
        if(!canPay(gooTonic)){ setDialog('“Slime goo, of all things - but render <b>three globs</b> and the muck thickens into honest medicine. '+costText(gooTonic)+'.”',
          [{label:'Back',fn:()=>brewMenu(npc)}]); return; }
        pay(gooTonic); give('potion',1); Snd.magic();
        setDialog('“Would you look at that - the muck mends. <i>(+1 Ember Tonic)</i>”',
          [{label:'Brew more',fn:()=>brewMenu(npc)},{label:'Farewell',ghost:true,fn:closeDialog}]);
      }},
     {label:'Brew tonics (2 bluecap + 1 crystal → 2 tonics)', fn:()=>{
        if(!canPay(tonic)){ setDialog('“The recipe is exact: '+costText(tonic)+'. Nature doesn\'t haggle.”',
          [{label:'Back',fn:()=>brewMenu(npc)}]); return; }
        pay(tonic); give('potion',2); Snd.magic();
        setDialog('“Careful - it\'s still humming.” <i>(+2 Ember Tonics)</i>',
          [{label:'Brew more',fn:()=>brewMenu(npc)},{label:'Farewell',ghost:true,fn:closeDialog}]);
      }},
     {label:'Reduce a Greater Tonic (2 tonics + 1 crystal + 1 bluecap → 1 elixir)', fn:()=>{
        if(!canPay(great)){ setDialog('“Twice the mend takes twice the care: '+costText(great)+'. Boil two tonics down with a crystal and a bluecap and I\'ll draw the stronger draught.”',
          [{label:'Back',fn:()=>brewMenu(npc)}]); return; }
        pay(great); give('elixir',1); Snd.magic();
        setDialog('“There - a <b>Greater Tonic</b>, thick as honey and twice the mend. Don\'t waste it on a scratch.” <i>(+1 Greater Tonic)</i>',
          [{label:'Brew more',fn:()=>brewMenu(npc)},{label:'Farewell',ghost:true,fn:closeDialog}]);
      }},
     {label:'Back',ghost:true,fn:()=>buildDialogContent(npc)}]);
}

