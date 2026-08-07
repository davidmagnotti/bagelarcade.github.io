/* ============================================================================
   COMBAT FLOURISH  -  js/52-combat-flourish.js
   ----------------------------------------------------------------------------
   The one thing the fight lacked for FLUIDITY: feedback for the swing itself in
   the WORLD, not only on the little character sprite. This adds two things, both
   riding the game's existing particle system and its perf toggles:

     1. A SLASH ARC - a crescent swept along the swing's aim the instant a melee
        blow commits. Steel-white by default, warm on the iron/steel blade, frost
        on Rimefang, and a fat gold arc on a combo FINISHER.
     2. A HIT SPARK - a crisp impact star (plus a few directional debris streaks)
        at the exact point a blow bites, tinted by the weapon that struck. The
        radial burst the core already throws stays; this adds the DIRECTIONAL
        read that says "connect".

   Everything is monkey-patched onto the globals (matching js/49-combo-proto's
   pattern) so the core files stay untouched, and every spawn is gated behind
   fxOn('particles') / LOWFX - so Performance mode and the per-effect toggles
   strip it exactly like the rest of the juice. The two new particle TYPES
   (pt.slash / pt.spark) are rendered in js/10-rendering.js.
   ============================================================================ */
(function(){
  'use strict';

  function partsOn(){ return typeof fxOn!=='function' || fxOn('particles'); }
  function lowFx(){ return typeof LOWFX!=='undefined' && LOWFX; }

  // tint the arc by the blade in hand: frost for Rimefang (t3), warm for the
  // steel blade (t2), a clean bright edge for iron/rusty.
  function bladeColor(){
    var t = (typeof P!=='undefined' && P.swordTier) || 0;
    return t>=3 ? '#dff4ff' : t===2 ? '#ffe6b0' : '#eef3fb';
  }

  /* ---- a world-space crescent swept along (dx,dy), a world direction ---- */
  function slashArc(x,y,dx,dy,opts){
    if(typeof G==='undefined' || !G.parts || !partsOn()) return;
    opts=opts||{};
    var l=Math.hypot(dx,dy)||1, ux=dx/l, uy=dy/l;
    var life=opts.life||0.19;
    // anchored a touch out in front of the swinger so the arc reads as the blade's path
    G.parts.push({ slash:true, x:x+ux*0.5, y:y+uy*0.5, dx:ux, dy:uy,
      reach:opts.reach||1.7, wide:opts.wide||1.0, lw:opts.lw||5,
      color:opts.color||bladeColor(), life:life, max:life, vx:0, vy:0, grav:0 });
  }
  window.slashArc = slashArc;

  /* ---- a crisp impact star + a few directional debris streaks ---- */
  function hitSpark(x,y,dx,dy,opts){
    if(typeof G==='undefined' || !G.parts || !partsOn()) return;
    opts=opts||{};
    var col=opts.color||'#fff4d8';
    G.parts.push({ spark:true, x:x, y:y, size:opts.size||3.4, color:col,
      life:0.16, max:0.16, vx:0, vy:0, grav:0 });
    if(lowFx()) return;                       // the streaks are the extra flourish - drop them on low-fx
    var l=Math.hypot(dx||0,dy||0)||1, ux=(dx||0)/l, uy=(dy||0)/l;
    var n=opts.n||4;
    for(var i=0;i<n;i++){
      var a=(Math.random()-0.5)*1.1;                       // fan roughly along the blow
      var sx=ux*Math.cos(a)-uy*Math.sin(a), sy=ux*Math.sin(a)+uy*Math.cos(a);
      var sp=2.4+Math.random()*3.2;
      G.parts.push({ x:x, y:y-0.35, vx:sx*sp, vy:sy*sp*0.6-0.3,
        life:0.18+Math.random()*0.16, color:col, size:1.4+Math.random()*1.6, grav:3 });
    }
  }
  window.hitSpark = hitSpark;

  /* ---- wrap tryAttack: throw the blade arc as a melee swing commits ---- */
  // A real attack (not a gather-instead, not the blocked mounted case) sets
  // P.lastCombat=G.time just before the weapon branch runs. So after the call,
  // P.lastCombat===G.time && weapon==='melee' && !riding cleanly identifies a
  // melee swing this frame. comboBefore>=2 means this swing was the FINISHER
  // (the core zeroes the combo on it), which earns the bigger gold arc.
  if(typeof window.tryAttack==='function'){
    var _tryAttack=window.tryAttack;
    window.tryAttack=function(useMouse){
      var lc = (typeof P!=='undefined') ? P.lastCombat : null;
      var comboBefore = (typeof P!=='undefined' && P.combo) || 0;
      var r=_tryAttack.apply(this,arguments);
      try{
        if(typeof P!=='undefined' && P.weapon==='melee' && !P.riding &&
           typeof G!=='undefined' && P.lastCombat!==lc && P.lastCombat===G.time && P.dir){
          var fin = comboBefore>=2;
          slashArc(P.x, P.y-0.2, P.dir.x, P.dir.y, fin
            ? { reach:2.4, wide:1.35, lw:7, color:'#ffdf9a', life:0.24 }
            : { reach:1.7, wide:1.0,  lw:5, life:0.19 });
        }
      }catch(e){}
      return r;
    };
  }

  /* ---- wrap damageMob: a directional spark where a blow actually bites ---- */
  // Reading m.hp across the call means the spark fires ONLY on a blow that dealt
  // damage - every WARDED / BOW ONLY / invuln branch returns without lowering hp,
  // so those correctly get no spark. Direction comes from the knockback vector
  // (the aim), falling back to the player->mob line.
  if(typeof window.damageMob==='function'){
    var _damageMob=window.damageMob;
    window.damageMob=function(m,dmg,knock,skill){
      var hp0 = m ? m.hp : 0;
      var r=_damageMob.apply(this,arguments);
      try{
        if(m && typeof m.hp==='number' && m.hp < hp0){
          var px=(typeof P!=='undefined')?P.x:m.x, py=(typeof P!=='undefined')?P.y:m.y;
          var dx = knock ? knock.x : (m.x-px), dy = knock ? knock.y : (m.y-py);
          var col = skill==='magic' ? '#c9a8ff' : skill==='archery' ? '#ffe1a0' : '#fff4d8';
          hitSpark(m.x, m.y-0.4, dx, dy,
            { color:col, size: skill==='melee'?3.8:3.0, n: skill==='melee'?5:3 });
        }
      }catch(e){}
      return r;
    };
  }
})();
