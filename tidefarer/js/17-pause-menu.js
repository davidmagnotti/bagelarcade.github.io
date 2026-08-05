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
  const d=document.getElementById('dialog');
  if(G.paused){
    closeAllPanels(); buildPauseStats(); syncCfgUI(); autoSave();
    // Preserve an open conversation: tuck it behind the pause menu rather than
    // calling closeDialog() (which drops you out of the talk). It returns on resume.
    if(typeof dlg!=='undefined' && dlg.open && d) d.style.display='none';
  } else {
    // resuming - bring a still-open conversation back up where you left it
    if(typeof dlg!=='undefined' && dlg.open && d) d.style.display='block';
  }
}
/* #pausePanel is styled as a full-screen overlay (position:fixed;inset:0) but
   was nested inside #titleOv, which is display:none during play - so a hidden
   parent kept the whole pause menu (Sound, Display & comfort, the Effects
   panel) from ever appearing while playing. Move it to <body> so it shows. */
try{ document.body.appendChild(document.getElementById('pausePanel')); }catch(e){}
/* #confirmWipe lived inside #titleOv too (hidden during play); move it to <body>
   so the pause-menu "Start Over" reset can actually show it. */
try{ document.body.appendChild(document.getElementById('confirmWipe')); }catch(e){}
/* ---------- Save backup ----------------------------------------------------
   Progress lives in a single localStorage slot that a cleared browser cache
   wipes without warning. Surface the copy/paste save code (it always existed
   under the hood) so a player can keep a real backup and restore it anywhere. */
try{
  const savePane=document.getElementById('pauseSavePane');
  if(savePane && !document.getElementById('backupSection')){
    const head=document.createElement('div');
    head.className='pHead'; head.textContent='Backup';
    const wrap=document.createElement('div'); wrap.id='backupSection';
    wrap.style.cssText='display:flex;flex-direction:column;gap:8px;';
    wrap.innerHTML=
      '<div style="font-size:11px;color:var(--parch-dim);line-height:1.6;">Your adventure saves to this browser only. Copy a save code to keep a backup - paste it here (or in another browser) to restore.</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+
        '<button class="btn" id="copySaveBtn">Copy save code</button>'+
        '<button class="btn" id="restoreSaveBtn">Restore from code</button>'+
      '</div>'+
      '<textarea id="saveCodeBox" spellcheck="false" autocomplete="off" placeholder="Save code appears here / paste one to restore" '+
        'style="display:none;width:100%;box-sizing:border-box;height:70px;resize:vertical;border-radius:8px;border:1.5px solid #4a3a26;background:#241a10;color:var(--parch);font:inherit;font-size:11px;padding:7px 10px;"></textarea>';
    savePane.appendChild(head); savePane.appendChild(wrap);
    const box=wrap.querySelector('#saveCodeBox');
    box.addEventListener('keydown',e=>e.stopPropagation());   // don't let hotbar/pause keys eat typing
    wrap.querySelector('#copySaveBtn').onclick=()=>{
      let code=''; try{ code=saveCode(); }catch(e){}
      if(!code){ toast('Could not read the save just now - try again in a moment.'); return; }
      box.style.display='block'; box.value=code; box.select();
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(code).then(
          ()=>toast('<b>Save code copied.</b> Paste it somewhere safe.',4200),
          ()=>toast('Select the text below and copy it by hand.',4200));
      } else toast('Select the text below and copy it by hand.',4200);
    };
    wrap.querySelector('#restoreSaveBtn').onclick=()=>{
      if(box.style.display==='none' || !box.value.trim()){
        box.style.display='block'; box.value=''; try{ box.focus(); }catch(e){}
        toast('Paste your save code below, then press <b>Restore from code</b> again.',5200); return;
      }
      const code=box.value.trim();
      if(typeof loadCode!=='function'){ toast('Restore is unavailable in this build.'); return; }
      if(loadCode(code)===false){ toast('That save code could not be read. Check you copied all of it.',5200); return; }
      store.set(code); box.style.display='none';
      togglePause(false); refreshUI&&refreshUI();
      banner('SAVE RESTORED','YOUR ADVENTURE CONTINUES');
    };
  }
}catch(e){}
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
// "Exit": desktop (Electron) build only. A browser tab can't close itself, so
// on the web this button stays hidden; when the Electron bridge is present we
// reveal it and quit the app (saving first, so nothing is lost on the way out).
(function(){
  const exitBtn=document.getElementById('exitGameBtn');
  if(!exitBtn) return;
  if(window.electronAPI && typeof window.electronAPI.quit==='function'){
    exitBtn.style.display='';
    exitBtn.onclick=()=>{ try{ autoSave(); }catch(e){} window.electronAPI.quit(); };
  }
})();
document.getElementById('cfgMus').oninput=function(){ CFG.mus=this.value/100; saveCfg(); };
document.getElementById('cfgSfx').oninput=function(){ CFG.sfx=this.value/100; saveCfg(); Snd.tone(660,0.07,'sine',0.06); };
document.getElementById('cfgShakeOn').onclick=()=>{ CFG.shake=1; saveCfg(); syncCfgUI(); };
document.getElementById('cfgShakeOff').onclick=()=>{ CFG.shake=0; saveCfg(); syncCfgUI(); };
document.getElementById('cfgFlashOn').onclick=()=>{ CFG.flash=1; saveCfg(); syncCfgUI(); };
document.getElementById('cfgFlashOff').onclick=()=>{ CFG.flash=0; saveCfg(); syncCfgUI(); };
for(let i=0;i<3;i++) document.getElementById('diff'+i).onclick=()=>{ CFG.diff=i; saveCfg(); syncCfgUI(); };

/* ---------- Tabbed pause menu -----------------------------------------------
   Settings are split across taps (Sound / Display / Difficulty / Deeds /
   Chronicle / Save) so no single pane needs scrolling to the bottom on a phone.
   Injected rows (bloom, cinematic grade, performance mode, per-effect toggles)
   anchor to elements inside the Display pane, so they land there automatically. */
(function(){
  const tabs=document.getElementById('pauseTabs');
  const body=document.getElementById('pauseTabBody');
  if(!tabs || !body) return;
  function showTab(name){
    let active=null;
    tabs.querySelectorAll('.pTabBtn').forEach(b=>{
      const on=b.getAttribute('data-tab')===name;
      b.classList.toggle('on', on);
      if(on) active=b;
    });
    body.querySelectorAll('.pTab').forEach(p=>
      p.classList.toggle('on', p.getAttribute('data-pane')===name));
    body.scrollTop=0;   // start each pane at the top
    // keep the active tab in view if the strip scrolls on a narrow phone
    if(active && active.scrollIntoView){
      try{ active.scrollIntoView({inline:'nearest',block:'nearest'}); }catch(e){}
    }
  }
  tabs.querySelectorAll('.pTabBtn').forEach(b=>{
    b.onclick=()=>{ showTab(b.getAttribute('data-tab')); if(typeof Snd!=='undefined'&&Snd.tone) Snd.tone(540,0.05,'sine',0.04); };
  });
  window.showPauseTab=showTab;
  // Always open on the first tab so settings are one tap away, never mid-scroll.
  const _tp=togglePause;
  togglePause=function(force){ _tp(force); if(G.paused) showTab('sound'); };
})();

