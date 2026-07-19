/* =====================================================================
   PAUSE AFFORDANCE: giant dashed bars centered in the pause screen,
   and a pulsing play button up top
   ===================================================================== */
(function(){
  const st=document.createElement('style');
  st.textContent=`
    #pausePanel{flex-direction:column;gap:18px;}
    #pauseGlyph{display:none;gap:26px;pointer-events:none;
      animation:pgPulse 1.5s ease-in-out infinite;}
    #pauseGlyph span{display:block;width:0;height:92px;
      border-left:15px dashed rgba(240,226,192,.95);
      filter:drop-shadow(0 3px 8px rgba(0,0,0,.9));}
    @keyframes pgPulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
    /* The pause button is on screen the entire game; its old box-shadow "ping"
       animation forced a full repaint every frame (no compositor fast-path) and
       was the main cause of low FPS in-game. Static colour, no animation. */
    #btnPause.playing{color:#9be07f;}
  `;
  document.head.appendChild(st);
  const pg=document.createElement('div');
  pg.id='pauseGlyph'; pg.innerHTML='<span></span><span></span>';
  const pp=document.getElementById('pausePanel');
  pp.insertBefore(pg, pp.firstChild);
  const btn=document.getElementById('btnPause');
  const card=document.getElementById('pauseCard');
  const hint=document.getElementById('pauseScrollHint');
  // bottom fade + chevron signalling "there's more below"; fades out at the end
  const cue=document.createElement('div');
  cue.id='pauseMoreCue'; cue.textContent='\u2193 more';
  if(card) card.appendChild(cue);
  function updateCue(){
    if(!card) return;
    const scrollable = card.scrollHeight - card.clientHeight > 8;
    const atEnd = card.scrollTop + card.clientHeight >= card.scrollHeight - 4;
    cue.classList.toggle('atEnd', atEnd || !scrollable);
    if(hint) hint.style.display = (!scrollable || card.scrollTop>6) ? 'none' : '';
  }
  if(card) card.addEventListener('scroll', updateCue, {passive:true});

  const _tp=togglePause;
  togglePause=function(force){
    _tp(force);
    const on=!!G.paused;
    pg.style.display=on?'flex':'none';
    if(btn){ btn.textContent=on?'\u25B6':'\u23F8'; btn.classList.toggle('playing',on); }
    // open at the top so the Resume button is visible without scrolling
    if(on && card){ card.scrollTop=0; if(hint) hint.style.display=''; requestAnimationFrame(updateCue); }
  };
  if(btn) btn.onclick=()=>togglePause();
  const rb=document.getElementById('resumeBtn');
  if(rb) rb.onclick=()=>togglePause(false);
  const rt=document.getElementById('resumeTopBtn');
  if(rt) rt.onclick=()=>togglePause(false);
})();

