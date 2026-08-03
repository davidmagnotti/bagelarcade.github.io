/* =====================================================================
   ACT II RETURNED-ISLE HAZARD ATMOSPHERE  -  the wound made SKY-WIDE.

   The terrain hazards (placeBarikFlood / placeWindHazard / placeSunwardHazard,
   12-world-layer.js) already redraw the GROUND of a cursed isle - a drowned
   fen, lava on the slopes, a flooded Row. But those wounds sit out at the
   Mirefen / up Mount Kea / at the wheel, so the moment you LAND the isle can
   still read as calm. This module paints the curse across the whole screen so
   the disaster is unmistakable everywhere you stand:

     - SUNWARD (east)  -> Mount Kea's unending eruption: a choking ash-fall, an
                          ember-lit brown haze, and a far-off rumble underfoot.
     - BARIK   (main)  -> Vath's storm never breaks: a black overcast, driving
                          rain + thunder (fed through WX, below), deep gloom.
     - WINDSURF(wind)  -> the maddened wind: a grey overcast and pale gusts
                          scoured sideways across the view, over WX's rain.

   All of it is gated exactly like the terrain hazards - only under the Warding
   Veil (P.story.vathVeil) and only until that isle's spirit-dungeon boss falls
   (ashenForgeDone / barikDeepDone / galeDeepDone). Because every draw reads
   those flags LIVE, the sky clears itself the instant the isle is freed; there
   is nothing to tear down and nothing to persist - it all rides P.story.

   Two seams into the rest of the engine, both guarded by typeof so load order
   never matters:
     - render() (10-rendering.js) calls drawIsleHazard() in its overlay block.
     - WX.update (13-aaa-layer.js) calls isleStormActive()/isleGaleActive() to
       lock Barik & Windsurf into a permanent tempest, reusing the exact
       Stormreach storm path (rain, sideways wind, lightning, thunder).
   ===================================================================== */
(function(){
'use strict';

// The active-curse isle id (east|main|wind) for the CURRENT world, or null if
// there is no standing hazard here (no Veil yet, wrong world, or already freed).
// _BOSS maps each returned isle to the story flag that lifts its curse.
var _BOSS = { east:'ashenForgeDone', main:'barikDeepDone', wind:'galeDeepDone' };
function isleHazardId(id){
  if(typeof P==='undefined' || !P.story || !P.story.vathVeil) return null;
  id = id || (typeof G!=='undefined' && G.worldId);
  var flag = _BOSS[id];
  if(!flag) return null;               // not a returned old isle
  return P.story[flag] ? null : id;    // freed -> no hazard; else the isle id
}
// Barik & Windsurf wear a real storm; Sunward does NOT (it burns, it does not
// rain). WX.update reads these to force a permanent tempest on those two isles.
function isleStormActive(){ var h=isleHazardId(); return h==='main' || h==='wind'; }
function isleGaleActive(){ return isleHazardId()==='wind'; }   // rain driven hard sideways
window.isleHazardId    = isleHazardId;
window.isleStormActive = isleStormActive;
window.isleGaleActive  = isleGaleActive;

// ---- own frame clock (render() has no dt handy here) ----
var _last=0, _dt=0;
function tick(){ var t=(typeof G!=='undefined' && G.time)||0; _dt=Math.max(0,Math.min(0.05,t-_last)); _last=t; }

// ---- eased intensity so the sky fades in/out instead of popping ----
var _amt=0, _lastKind=null;
// screen-anchored particle fields (built lazily, sized to the active hazard)
var _ash=[], _emb=[], _gust=[];
var HZ_PARALLAX=1;                                   // 1 = pinned to the world, like the snow/rain fields
function _wrap(v,cam,span,M){ return ((v-cam+M)%span+span)%span-M; }

// SUNWARD - a choking ash pall, falling ash, drifting embers, a low rumble.
function _drawAsh(a){
  // --- the pall: a heavy desaturating ash-grey haze (cold, so it reads over the tan
  //     sand instead of blending in), lit from below by a dim ember underglow ---
  cx.fillStyle='rgba(58,54,50,'+(0.46*a).toFixed(3)+')'; cx.fillRect(-20,-20,VW+40,VH+40);
  var gt=cx.createLinearGradient(0,0,0,VH*0.55);
  gt.addColorStop(0,'rgba(30,26,24,'+(0.30*a).toFixed(3)+')'); gt.addColorStop(1,'rgba(30,26,24,0)');
  cx.fillStyle=gt; cx.fillRect(0,0,VW,VH);                 // ash sits thickest overhead
  var g=cx.createLinearGradient(0,VH*0.45,0,VH);
  g.addColorStop(0,'rgba(150,60,24,0)'); g.addColorStop(1,'rgba(176,66,22,'+(0.12*a).toFixed(3)+')');
  cx.fillStyle=g; cx.fillRect(0,0,VW,VH);                  // a sullen ember glow off the burning slopes
  if(typeof fxOn==='function' && !fxOn('particles') && !LOWFX) return;
  var camX=(G.cam?G.cam.x:0)*HZ_PARALLAX, camY=(G.cam?G.cam.y:0)*HZ_PARALLAX;
  // --- ash flakes: grey, slow, drifting sideways as they fall. Kept (thinned) even on
  //     the low tier - the ash-fall IS the isle's signature, like the snow on the Frozen Isle ---
  var low=(typeof LOWFX!=='undefined' && LOWFX);
  var want=Math.round((low?46:120)*a);
  while(_ash.length<want) _ash.push({x:Math.random()*VW,y:Math.random()*VH,r:0.8+Math.random()*2.0,spd:22+Math.random()*34,ph:Math.random()*TAU,g:0.45+Math.random()*0.5});
  if(_ash.length>want) _ash.length=want;
  var M=6, WW=VW+2*M, HH=VH+2*M;
  for(var i=0;i<_ash.length;i++){ var f=_ash[i];
    f.y+=f.spd*_dt; f.x+=(Math.sin(G.time*0.9+f.ph)*10 + 14)*_dt;   // a steady sideways drift
    if(f.y>VH+M){ f.y=-M; f.x=Math.random()*WW-M; }
    var dx=_wrap(f.x,camX,WW,M), dy=_wrap(f.y,camY,HH,M);
    cx.fillStyle='rgba(150,144,136,'+(f.g*a).toFixed(3)+')';
    cx.beginPath(); cx.arc(dx,dy,f.r,0,TAU); cx.fill();
  }
  if(low) return;                                          // embers are the flourish, full tier only
  // --- embers: sparse, glowing, rising and winking out ---
  var ew=Math.round(16*a);
  while(_emb.length<ew) _emb.push({x:Math.random()*VW,y:Math.random()*VH,vy:-(10+Math.random()*22),ph:Math.random()*TAU,r:0.8+Math.random()*1.3});
  if(_emb.length>ew) _emb.length=ew;
  cx.globalCompositeOperation='lighter';
  for(var e=0;e<_emb.length;e++){ var m=_emb[e];
    m.y+=m.vy*_dt; m.x+=Math.sin(G.time*1.6+m.ph)*16*_dt;
    if(m.y<-M){ m.y=VH+M; m.x=Math.random()*VW; }
    var mx=_wrap(m.x,camX,WW,M), my=_wrap(m.y,camY,HH,M);
    var tw=0.55+0.45*Math.sin(G.time*4+m.ph);
    cx.fillStyle='rgba(255,150,60,'+(tw*a).toFixed(3)+')';
    cx.beginPath(); cx.arc(mx,my,m.r,0,TAU); cx.fill();
  }
  cx.globalCompositeOperation='source-over';
}

// BARIK - a black storm gloom over WX's rain/thunder. Deep, cold, and heavy.
function _drawStormGloom(a){
  cx.fillStyle='rgba(18,24,38,'+(0.34*a).toFixed(3)+')'; cx.fillRect(-20,-20,VW+40,VH+40);
  var g=cx.createLinearGradient(0,0,0,VH*0.6);
  g.addColorStop(0,'rgba(8,12,22,'+(0.30*a).toFixed(3)+')'); g.addColorStop(1,'rgba(8,12,22,0)');
  cx.fillStyle=g; cx.fillRect(0,0,VW,VH);   // the sky sits darkest overhead
}

// WINDSURF - a grey overcast and pale gusts scoured sideways over WX's rain.
function _drawGale(a){
  cx.fillStyle='rgba(40,48,60,'+(0.30*a).toFixed(3)+')'; cx.fillRect(-20,-20,VW+40,VH+40);
  var gt=cx.createLinearGradient(0,0,0,VH*0.5);
  gt.addColorStop(0,'rgba(22,28,38,'+(0.20*a).toFixed(3)+')'); gt.addColorStop(1,'rgba(22,28,38,0)');
  cx.fillStyle=gt; cx.fillRect(0,0,VW,VH);
  var low=(typeof LOWFX!=='undefined' && LOWFX);
  var want=Math.round((low?24:46)*a);
  while(_gust.length<want) _gust.push({x:Math.random()*VW,y:Math.random()*VH,spd:520+Math.random()*380,len:34+Math.random()*44,w:0.6+Math.random()*0.8});
  if(_gust.length>want) _gust.length=want;
  cx.lineWidth=1; cx.strokeStyle='rgba(210,222,236,'+(0.14*a).toFixed(3)+')';
  cx.beginPath();
  for(var i=0;i<_gust.length;i++){ var s=_gust[i];
    s.x+=s.spd*_dt; s.y+=s.spd*0.16*_dt;                       // driven hard to the SE
    if(s.x>VW+60){ s.x=-60; s.y=Math.random()*VH; }
    if(s.y>VH+20){ s.y=-20; }
    cx.moveTo(s.x,s.y); cx.lineTo(s.x-s.len,s.y-s.len*0.16);
  }
  cx.stroke();
}

// the far-off eruption felt underfoot on Sunward - a soft, slow rumble (never a jolt)
var _rumbleT=0;
function _rumble(a){
  if(typeof G==='undefined') return;
  _rumbleT-=_dt;
  if(_rumbleT<=0){ _rumbleT=2.2+Math.random()*3.4; G.shake=Math.max(G.shake||0, 0.16*a); }
}

// ---- the render() seam: one call, all worlds ----
function drawIsleHazard(){
  if(typeof cx==='undefined' || typeof G==='undefined') return;
  tick();
  // no weather inside a building or on a menu; else the current isle's standing curse
  var here=(G.interior || G.state!=='play') ? null : isleHazardId();
  if(here) _lastKind=here;          // what to keep painting while the sky eases back to calm
  var target=here?1:0;
  _amt += (target-_amt)*Math.min(1,_dt*3);
  if(_amt<=0.01){ _amt=0; return; }
  // Sailing straight from one cursed isle to another is a hard cut at full weight (both
  // have here!=null, so _amt never dips) - and that swap hides under the sail-transition
  // fade anyway. Only leaving for a CALM place (here=null) eases the sky out.
  var kind=here||_lastKind, a=_amt;
  if(kind==='east'){ _drawAsh(a); _rumble(a); }
  else if(kind==='main'){ _drawStormGloom(a); }
  else if(kind==='wind'){ _drawGale(a); }
}
window.drawIsleHazard = drawIsleHazard;

})();
