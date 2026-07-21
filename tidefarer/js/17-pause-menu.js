/* =====================================================================
   PAUSE MENU & SETTINGS
   ===================================================================== */
function fmtTime(sec){ sec=sec|0; const h=(sec/3600)|0, m=((sec%3600)/60)|0;
  return h? h+'h '+m+'m' : m+'m '+(sec%60)+'s'; }
function buildPauseStats(){
  const s=P.stats||{};
  const done=Object.keys(P.quests).filter(id=>P.quests[id]==='done').length;
  document.getElementById('statGrid').innerHTML=
    '<div>Time adventured <b>'+fmtTime(s.time||0)+'</b></div>'+
    '<div>Monsters slain <b>'+(s.kills||0)+'</b></div>'+
    '<div>Quests completed <b>'+done+'</b></div>'+
    '<div>Gold earned <b>'+(s.goldEarned||0)+'</b></div>'+
    '<div>Deaths <b>'+(s.deaths||0)+'</b></div>'+
    '<div>Lore found <b>'+Object.keys(P.loreRead||{}).length+'/'+Object.keys(LORE).length+'</b></div>';
  const ag=document.getElementById('achGrid'); ag.innerHTML='';
  for(const k in ACH){
    const got=!!P.ach[k];
    ag.insertAdjacentHTML('beforeend','<div class="achRow'+(got?' got':'')+'">'+
      (got?'★ ':'☆ ')+'<b>'+ACH[k].t+'</b> - '+ACH[k].d+'</div>');
  }
}
function syncCfgUI(){
  document.getElementById('cfgMus').value=Math.round(CFG.mus*100);
  document.getElementById('cfgSfx').value=Math.round(CFG.sfx*100);
  document.getElementById('cfgShakeOn').classList.toggle('on',!!CFG.shake);
  document.getElementById('cfgShakeOff').classList.toggle('on',!CFG.shake);
  document.getElementById('cfgFlashOn').classList.toggle('on',!!CFG.flash);
  document.getElementById('cfgFlashOff').classList.toggle('on',!CFG.flash);
  for(let i=0;i<3;i++) document.getElementById('diff'+i).classList.toggle('on',(CFG.diff|0)===i);
}
function togglePause(force){
  if(G.state!=='play') return;
  G.paused = force!==undefined? force : !G.paused;
  document.getElementById('pausePanel').style.display = G.paused? 'flex':'none';
  if(G.paused){ closeAllPanels(); closeDialog(); buildPauseStats(); syncCfgUI(); autoSave(); }
}
/* #pausePanel is styled as a full-screen overlay (position:fixed;inset:0) but
   was nested inside #titleOv, which is display:none during play - so a hidden
   parent kept the whole pause menu (Sound, Display & comfort, the Effects
   panel) from ever appearing while playing. Move it to <body> so it shows. */
try{ document.body.appendChild(document.getElementById('pausePanel')); }catch(e){}
/* #confirmWipe lived inside #titleOv too (hidden during play); move it to <body>
   so the pause-menu "Start Over" reset can actually show it. */
try{ document.body.appendChild(document.getElementById('confirmWipe')); }catch(e){}
document.getElementById('btnPause').onclick=()=>togglePause();
document.getElementById('resumeBtn').onclick=()=>togglePause(false);
// "Start Over": the game boots straight into play now, so there's no title to
// quit to - this button is the reset, guarded by the type-to-confirm wipe modal.
document.getElementById('quitTitleBtn').onclick=()=>{
  // Keep the game paused; show the confirm modal above the pause panel.
  const cw=document.getElementById('confirmWipe'); if(!cw) return;
  cw.style.display='block';
  const inp=document.getElementById('wipeInput'); if(inp) inp.value='';
  const conf=document.getElementById('wipeConfirm'); if(conf) conf.disabled=true;
  if(!isTouch && inp){ try{ inp.focus(); }catch(e){} }
};
document.getElementById('cfgMus').oninput=function(){ CFG.mus=this.value/100; saveCfg(); };
document.getElementById('cfgSfx').oninput=function(){ CFG.sfx=this.value/100; saveCfg(); Snd.tone(660,0.07,'sine',0.06); };
document.getElementById('cfgShakeOn').onclick=()=>{ CFG.shake=1; saveCfg(); syncCfgUI(); };
document.getElementById('cfgShakeOff').onclick=()=>{ CFG.shake=0; saveCfg(); syncCfgUI(); };
document.getElementById('cfgFlashOn').onclick=()=>{ CFG.flash=1; saveCfg(); syncCfgUI(); };
document.getElementById('cfgFlashOff').onclick=()=>{ CFG.flash=0; saveCfg(); syncCfgUI(); };
for(let i=0;i<3;i++) document.getElementById('diff'+i).onclick=()=>{ CFG.diff=i; saveCfg(); syncCfgUI(); };

