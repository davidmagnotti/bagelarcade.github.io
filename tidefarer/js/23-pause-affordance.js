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
    #btnPause.playing{color:#9be07f;animation:btnPulse 1.2s ease-in-out infinite;}
    @keyframes btnPulse{0%{box-shadow:0 0 0 0 rgba(155,224,127,.55)}70%{box-shadow:0 0 0 12px rgba(155,224,127,0)}100%{box-shadow:0 0 0 0 rgba(155,224,127,0)}}
  `;
  document.head.appendChild(st);
  const pg=document.createElement('div');
  pg.id='pauseGlyph'; pg.innerHTML='<span></span><span></span>';
  const pp=document.getElementById('pausePanel');
  pp.insertBefore(pg, pp.firstChild);
  const btn=document.getElementById('btnPause');
  const _tp=togglePause;
  togglePause=function(force){
    _tp(force);
    const on=!!G.paused;
    pg.style.display=on?'flex':'none';
    if(btn){ btn.textContent=on?'\u25B6':'\u23F8'; btn.classList.toggle('playing',on); }
  };
  if(btn) btn.onclick=()=>togglePause();
  const rb=document.getElementById('resumeBtn');
  if(rb) rb.onclick=()=>togglePause(false);
})();

