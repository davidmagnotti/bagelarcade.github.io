/* =====================================================================
   DEV / DEBUG MENU  -  toggle with the  `  (backtick)  key, or tap the
   small "DEV" tab in the top-left. A scratch panel for testing: teleport
   between islands, mark curses/bosses defeated, drive the story, and buff
   the hero. REMOVE THIS FILE (and its <script> tag) FOR THE FINAL BUILD.
   ===================================================================== */
(function(){
'use strict';

let god=false;

function note(m){ try{ if(typeof toast==='function') toast(m,1500); }catch(e){} }
function ui(){ try{ refreshUI&&refreshUI(); buildHotbar&&buildHotbar(); updateQuestUI&&updateQuestUI(); }catch(e){} }

/* ---- actions ---- */
function tp(id){
  if(typeof switchWorld!=='function') return;
  if(G.interior){ G.interior=null; }
  if(G.state!=='play'){ G.state='play'; }
  P.dead=false; document.getElementById('deadOv').style.display='none';
  switchWorld(id); ui(); note('Teleported: '+id);
}
function setAct(n){
  P.story=P.story||{}; P.story.act=n; P.story.necklace=true;
  if(n>=2) P.story.vathMet=1, P.story.vathNamed=1;
  if(n>=3) P.story.kingTold=1;
  note('Act set to '+n);
}
function freeCurse(which){
  P.story=P.story||{}; P.story.vathMet=1; P.story.vathNamed=1;
  const done=q=>{ if(QUESTS&&QUESTS[q]) P.quests[q]='done'; };
  if(which==='dragon'||which==='all'){ P.eastDragonFreed=1; P.metDragon=1; done('wyrm'); done('vhunt'); }
  if(which==='tide'  ||which==='all'){ P.story.tideCalm=1;  done('tide');  }
  if(which==='aerie' ||which==='all'){ P.story.aerieFreed=1; done('roost'); }
  if(which==='frost' ||which==='all'){ P.story.frostFreed=1; done('thaw');  }
  // clear any of those bosses still standing on the current map
  for(const m of (G.mobs||[])){ if(['leviathan','frostwarden','serpent','dragon','mage'].includes(m.kind) && !m.dead){ m.freed=1; m.dead=true; m.respawnT=-1; } }
  ui(); note('Curse(s) freed: '+which);
}
function clearMobs(){
  let n=0; for(const m of (G.mobs||[])){ if(!m.dead){ m.dead=true; m.respawnT=-1; n++; } }
  note('Cleared '+n+' foes on this map');
}
function completeActive(){
  let n=0; for(const id in P.quests){ if(P.quests[id]==='active' && QUESTS[id]){ try{ completeQuest(id); n++; }catch(e){} } }
  ui(); note('Completed '+n+' active quest(s)');
}
function unlockAll(){
  P.unlocked=P.unlocked||{}; P.unlocked.melee=P.unlocked.bow=P.unlocked.staff=P.unlocked.surf=P.unlocked.moa=true;
  P.swordTier=Math.max(P.swordTier||0,3); P.armorOwn=Math.max(P.armorOwn||0,2); P.armor=Math.max(P.armor||0,2);
  P.kit=true; if(P.tools){ P.tools.axe=1; P.tools.pick=1; }
  ui(); note('All weapons, board, moa & tools unlocked');
}
function heal(){ P.hp=P.maxhp; P.mp=P.maxmp; P.poisonT=0; ui(); note('Restored to full'); }
function gold(n){ if(typeof giveGold==='function') giveGold(n); else P.gold=(P.gold||0)+n; ui(); note('+'+n+' gold'); }
function xp(n){ if(typeof gainLXP==='function') gainLXP(n); ui(); note('+'+n+' level XP'); }
function maxSkills(){ for(const s in (P.skills||{})){ if(typeof addXP==='function') addXP(s, 9999); } ui(); note('Skills boosted'); }
function toggleGod(btn){ god=!god; btn.textContent='God mode: '+(god?'ON':'off'); btn.style.color=god?'#9be07f':''; note('God mode '+(god?'on':'off')); }
function saveNow(){ try{ autoSave&&autoSave(); note('Saved'); }catch(e){} }

setInterval(()=>{ try{ if(god && typeof P!=='undefined' && P && !P.dead){ P.hp=P.maxhp; P.mp=P.maxmp; } }catch(e){} }, 400);

/* ---- panel ---- */
const SECTIONS=[
  ['Teleport island', [
    ['Emberwick (start)',()=>tp('isle')], ['Barik',()=>tp('main')], ['Sunward',()=>tp('east')],
    ['Windsurf',()=>tp('wind')], ['Aerie',()=>tp('aerie')], ['Frozen',()=>tp('frost')],
    ['Aldermere (Capital)',()=>tp('crown')],
  ]],
  ['Story / Act', [
    ['Act I',()=>setAct(1)], ['Act II',()=>setAct(2)], ['Act III',()=>setAct(3)],
  ]],
  ['Curses & bosses defeated', [
    ['Free Dragon',()=>freeCurse('dragon')], ['Free Leviathan',()=>freeCurse('tide')],
    ['Free Aerie',()=>freeCurse('aerie')], ['Free Frozen',()=>freeCurse('frost')],
    ['Free ALL curses',()=>freeCurse('all')], ['Clear foes on this map',()=>clearMobs()],
  ]],
  ['Quests', [
    ['Complete active quests',()=>completeActive()],
  ]],
  ['Hero', [
    ['+1000 gold',()=>gold(1000)], ['+2000 XP',()=>xp(2000)], ['Full heal',()=>heal()],
    ['Unlock all abilities',()=>unlockAll()], ['Boost skills',()=>maxSkills()],
    ['God mode: off',(b)=>toggleGod(b)],
  ]],
  ['System', [
    ['Save now',()=>saveNow()], ['Reload page',()=>location.reload()],
  ]],
];

function build(){
  if(panelEl()) return;
  const p=document.createElement('div'); p.id='devMenu';
  p.style.cssText='position:fixed;top:38px;left:8px;z-index:99999;width:214px;max-height:82vh;overflow:auto;'+
    'display:none;padding:9px 10px 12px;border-radius:10px;background:rgba(14,10,6,.94);'+
    'border:1px solid #4a3826;box-shadow:0 6px 24px rgba(0,0,0,.55);font-family:Verdana,sans-serif;color:#e8dcc4;';
  let html='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'+
    '<b style="font-size:12px;letter-spacing:.5px;color:#ffb26b;">DEV MENU</b>'+
    '<span id="devClose" style="cursor:pointer;font-size:14px;color:#c9a24e;padding:0 4px;">✕</span></div>'+
    '<div style="font-size:9.5px;color:#9a8a70;margin-bottom:7px;">Press <b>`</b> to toggle. Remove for release.</div>';
  SECTIONS.forEach((sec,si)=>{
    html+='<div style="font-size:9.5px;letter-spacing:.5px;color:#c98a4a;text-transform:uppercase;margin:7px 0 3px;">'+sec[0]+'</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:4px;" data-sec="'+si+'"></div>';
  });
  p.innerHTML=html;
  document.body.appendChild(p);
  SECTIONS.forEach((sec,si)=>{
    const box=p.querySelector('[data-sec="'+si+'"]');
    sec[1].forEach(([label,fn])=>{
      const b=document.createElement('button');
      b.textContent=label;
      b.style.cssText='flex:1 1 auto;min-width:62px;font-size:10.5px;padding:5px 6px;cursor:pointer;'+
        'background:#2b2013;color:#e8dcc4;border:1px solid #4a3826;border-radius:6px;';
      b.onmouseover=()=>b.style.background='#3a2c1a'; b.onmouseout=()=>b.style.background='#2b2013';
      b.onclick=(ev)=>{ ev.stopPropagation(); try{ fn(b); }catch(e){ note('err: '+e.message); } };
      box.appendChild(b);
    });
  });
  p.querySelector('#devClose').onclick=()=>toggle(false);

  // a tiny always-visible tab to open it on touch devices
  const tab=document.createElement('div'); tab.id='devTab';
  tab.textContent='DEV';
  tab.style.cssText='position:fixed;top:8px;left:8px;z-index:99998;font:bold 10px Verdana;color:#ffb26b;'+
    'background:rgba(14,10,6,.8);border:1px solid #4a3826;border-radius:6px;padding:3px 7px;cursor:pointer;opacity:.6;';
  tab.onclick=()=>toggle();
  document.body.appendChild(tab);
}
function panelEl(){ return document.getElementById('devMenu'); }
function toggle(force){
  build(); const p=panelEl(); if(!p) return;
  const show = (force===undefined)? (p.style.display==='none') : force;
  p.style.display= show? 'block':'none';
}

window.addEventListener('keydown',(e)=>{
  if(e.key==='`'||e.key==='~'){
    const t=e.target; if(t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA')) return;
    e.preventDefault(); toggle();
  }
});
// build the tab once the DOM/game is ready
if(document.body) build(); else window.addEventListener('DOMContentLoaded',build);
})();
