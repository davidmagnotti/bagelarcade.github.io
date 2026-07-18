/* =====================================================================
   AUTO-SAVE - quietly persists to this browser's local storage
   ===================================================================== */
const CFG=(()=>{ try{ return Object.assign({mus:1,sfx:1,shake:1,flash:1,diff:1},
  JSON.parse(SafeStore.get('emberwickCfg')||'{}')); }catch(e){ return {mus:1,sfx:1,shake:1,flash:1,diff:1}; } })();
function saveCfg(){ try{ SafeStore.set('emberwickCfg',JSON.stringify(CFG)); }catch(e){} }
const store={
  get(){ try{ return SafeStore.get('emberwickSave'); }catch(e){ return null; } },
  set(v){ try{ SafeStore.set('emberwickSave',v); }catch(e){} },
  clear(){ try{ SafeStore.del('emberwickSave'); }catch(e){} }
};
let autoT=0;
function autoSave(){
  if(G.state!=='play' || P.dead || G.interior) return;
  store.set(saveCode());
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    autoSave();
    if(G.state==='play' && !G.paused && !CINE && !P.dead) togglePause(true);
  }
});

