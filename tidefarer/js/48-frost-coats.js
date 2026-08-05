/* =====================================================================
   THE FROZEN ISLE - THE COLD, AND THE COATS THAT BEAT IT.
   -----------------------------------------------------------------------
   Step off the ferry onto the Frozen Isle and the cursed cold takes you at
   once: you arrive FREEZING - a hard shiver, breath smoking off you in the
   wind, the screen biting blue at its edges. A local furrier (Rurik, who
   keeps the whole isle in coats) hurries down the Frostferry Landing the
   first time you land and bundles you AND your brother Leo into matched
   fur-lined parkas - and from then on the two of you pull those coats on the
   instant you set foot on the ice and shrug them off again the moment you
   sail away. The freezing only lasts the breath or two before you're bundled.

   All of it rides two facts, so nothing has to be torn down or persisted
   beyond a single story flag:
     - P.story.frostCoat  (persisted) -> you OWN the coats (Rurik's gift).
     - P._coatOn          (runtime)   -> a coat is on your body right now.
   The coat is WORN only on the frost surface, only once owned, and only after
   the brief arrival-shiver has passed. Everything reads those live, so a
   reload straight onto the isle re-bundles you and the cold never lingers.

   Seams into the rest of the engine, all guarded by typeof so load order
   never matters:
     - switchWorld('frost')  (12-world-layer.js) calls enterFrost().
     - drawPlayerFigure      (10-rendering.js) coat-ifies the hero's look via
       frostCoatWorn()/frostCoatLook(); drawNPC does the same for Leo.
     - drawPlayer            (10-rendering.js) offsets the figure by
       frostShakeX() while freezing.
     - render()              (10-rendering.js) calls drawFrostChill() in its
       overlay block - the cold vignette + everyone's smoking breath.
     - spawnFrostFolk        (12-world-layer.js) stands Rurik at the landing.
   ===================================================================== */
(function(){
'use strict';

// The matched fur-lined parka: a hood, a heavy russet body, a pale fur trim -
// the same cut on the hero and on Leo, so they read as bundled by one hand.
var COAT='#7a563a', COAT_HOOD='#664630', COAT_PANTS='#3a2f26', FUR='#e6ddc8';

// ---- state helpers ---------------------------------------------------
function onFrostSurface(){ return typeof G!=='undefined' && G.worldId==='frost'; }
function hasFrostCoat(){ return !!(typeof P!=='undefined' && P.story && P.story.frostCoat); }
// A coat is on your body only on the isle, only once owned, once you've bundled.
function frostCoatWorn(){ return onFrostSurface() && hasFrostCoat() && !!(typeof P!=='undefined' && P._coatOn); }
// You are FREEZING on the isle whenever you're up and about without your coat on.
function frostChillActive(){
  if(!onFrostSurface()) return false;
  if(typeof G==='undefined' || G.interior || G.state!=='play') return false;
  if(typeof P==='undefined' || P.dead) return false;
  return !frostCoatWorn();
}
window.frostCoatWorn   = frostCoatWorn;
window.frostChillActive = frostChillActive;

// ---- the coat look ---------------------------------------------------
// Mutates + returns a look object, pulling the parka over whatever's beneath
// (works over the castaway's greens or the princess's royal magenta alike).
function frostCoatLook(look){
  look.shirt=COAT; look.pants=COAT_PANTS;
  look.hat='hood'; look.hatColor=COAT_HOOD; look.trim=FUR;
  look.apron=null;                 // nothing peeks out under a buttoned parka
  return look;
}
// The furrier's own bundled look (portrait + the NPC at the landing).
function frostFurrierLook(){
  return {skin:'#c99e78',hair:'#d8d2c4',beard:'#d8d2c4',shirt:COAT,pants:COAT_PANTS,
          hat:'hood',hatColor:COAT_HOOD,trim:FUR,hairstyle:'short'};
}
window.frostCoatLook    = frostCoatLook;
window.frostFurrierLook = frostFurrierLook;

// A small side-to-side shiver for the hero's figure while freezing (rendering
// offsets the figure by this; the shadow stays put, so it reads as a shudder).
function frostShakeX(){
  if(!frostChillActive()) return 0;
  var t=(typeof G!=='undefined' && G.time)||0;
  return Math.sin(t*34)*0.9 + Math.sin(t*57)*0.5;
}
window.frostShakeX = frostShakeX;

// ---- arrival: off the ferry, into the teeth of it --------------------
function enterFrost(){
  if(typeof P==='undefined') return;
  P._coatOn=false;                 // you always arrive out of your coat, cold
  _breathAcc=0;
  if(!hasFrostCoat()){
    // first landing: the furrier comes down to bundle you both up
    setTimeout(frostCoatGreeting, 1300);
  } else {
    // you own the coats already - pull them on against the cold after a shiver
    setTimeout(function(){ bundleUp(false); }, 1500);
  }
}
window.enterFrost = enterFrost;

function bundleUp(quiet){
  if(!onFrostSurface() || typeof P==='undefined') return;   // sailed off before it fired
  if(P._coatOn) return;
  P._coatOn=true;
  if(!quiet && typeof addFloat==='function') addFloat('You pull your coat tight.', P.x, P.y-1.6, '#dfeaf5', 0.9);
}

// The furrier hurries down the Frostferry Landing your first time ashore and
// presses a fur coat on you and one on Leo. A modal talk, like the Barik /
// Windsurf arrival greetings.
function frostCoatGreeting(){
  if(!onFrostSurface() || typeof G==='undefined' || G.state!=='play') return;
  if(hasFrostCoat()) return;                                 // already handled
  if(typeof dlg!=='undefined' && dlg.open){ setTimeout(frostCoatGreeting, 800); return; }  // wait out any open talk
  if(typeof setDialog!=='function' || typeof dlg==='undefined') { grantFrostCoats(); return; }
  dlg.open=true; dlg.npc=null;
  var dEl=document.getElementById('dialog'); if(dEl) dEl.style.display='block';
  var nEl=document.getElementById('dname'); if(nEl) nEl.textContent='Rurik the Furrier';
  var pc=document.getElementById('dportrait');
  if(pc){ var pg=pc.getContext('2d');
    pg.fillStyle='#0e161e'; pg.fillRect(0,0,72,72);
    pg.save(); pg.translate(36,64); pg.scale(1.3,1.3);
    if(typeof drawHumanoid==='function') drawHumanoid(pg,0,0,Object.assign(frostFurrierLook(),{dir:{x:0,y:1},step:0}));
    pg.restore(); }
  setDialog('<i>Before your boots are off the ferry-boards, a bundled figure comes stumping down the landing, arms full of fur.</i> “Off the boat and straight into the teeth of it - aye, I know that look. Wore it myself, once.” <i>A heavy fur-lined coat is pressed into your arms, and a second swung over your brother\'s shoulders.</i> “Rurik. I keep this isle in coats - nobody sets foot on Hearthhold ice without one, that\'s the rule that keeps us all breathing. And this cold\'s not the honest kind any more; it bites clean to the bone. So wear these while you\'re on my ice, the both of you - I\'ll not have a thawed-out southerner freezing solid on my landing.”',
    [{label:'Thank you — we\'re half-frozen', cls:'gold', fn:grantFrostCoats}]);
}

function grantFrostCoats(){
  if(typeof closeDialog==='function') closeDialog();
  if(typeof P!=='undefined'){ P.story=P.story||{}; P.story.frostCoat=1; }
  bundleUp(true);                                            // the coats go on now
  if(typeof Snd!=='undefined' && Snd.quest) try{ Snd.quest(); }catch(e){}
  if(typeof addFloat==='function' && typeof P!=='undefined') addFloat('You bundle into the fur.', P.x, P.y-1.6, '#ffe9c8', 0.95);
  if(typeof autoSave==='function') setTimeout(autoSave,300);
}
window.frostCoatGreeting = frostCoatGreeting;

// ---- the cold, painted screen-wide + everyone's smoking breath -------
var _last=0, _dt=0, _breathAcc=0, _amt=0;
function _tick(){ var t=(typeof G!=='undefined' && G.time)||0; _dt=Math.max(0,Math.min(0.05,t-_last)); _last=t; }

// a puff of breath, smoking off a figure into the cold (world-space particles)
function _breath(px,py,face,hard){
  if(typeof G==='undefined' || !G.parts) return;
  if(typeof fxOn==='function' && !fxOn('particles')) return;
  var fx=(face&&face.x)||0, fy=(face&&face.y)||0.6;
  var ox=fx*0.32, oy=-1.15 + fy*0.12;                       // out from the mouth, on the heading
  var n=hard?2:1;
  for(var i=0;i<n;i++){
    G.parts.push({ x:px+ox+rnd(-0.12,0.12), y:py+oy+rnd(-0.1,0.1),
      vx:fx*0.5 + rnd(-0.18,0.18), vy:-rnd(0.18,0.5),
      life:hard?rnd(0.5,0.85):rnd(0.7,1.1),
      color:'rgba(226,238,250,'+(hard?0.6:0.42)+')',
      size:rnd(1.6,3.0), grav:-0.03, glow:true });
  }
}

// render() overlay seam - one call. The icy vignette eases in while you freeze
// and out once you're bundled; breath smokes off you (harder while freezing)
// and off Leo whenever he's near on the ice.
function drawFrostChill(){
  if(typeof cx==='undefined' || typeof G==='undefined') return;
  _tick();
  var onIce = onFrostSurface() && !G.interior && G.state==='play';
  var freezing = frostChillActive();
  // ease the cold-bite vignette toward its target (full while freezing, a whisper once coated)
  var target = !onIce ? 0 : (freezing ? 1 : 0.16);
  _amt += (target-_amt)*Math.min(1, _dt*3.2);
  if(_amt>0.01 && typeof VW!=='undefined'){
    var pulse = freezing ? (0.85+0.15*Math.sin(G.time*3.1)) : 1;
    var a=_amt*pulse;
    var vg=cx.createRadialGradient(VW*0.5,VH*0.52,Math.min(VW,VH)*0.30, VW*0.5,VH*0.52,Math.max(VW,VH)*0.72);
    vg.addColorStop(0,'rgba(150,196,232,0)');
    vg.addColorStop(1,'rgba(150,196,232,'+(0.30*a).toFixed(3)+')');
    cx.fillStyle=vg; cx.fillRect(0,0,VW,VH);
  }
  if(!onIce || typeof P==='undefined' || P.dead){ _breathAcc=0; return; }
  // smoking breath: fast, panting bursts while freezing; slow, calm plumes once bundled
  _breathAcc += _dt;
  var every = freezing ? 0.42 : 1.7;
  if(_breathAcc>=every){
    _breathAcc=0;
    _breath(P.x, P.y, P.dir, freezing);
    // Leo, bundled beside you on the ice, breathes the cold too
    if(G.npcs){ for(var i=0;i<G.npcs.length;i++){ var n=G.npcs[i];
      if(n && n.id==='brother' && dist(P.x,P.y,n.x,n.y)<10){ _breath(n.x, n.y, n.face, freezing); break; } } }
  }
}
window.drawFrostChill = drawFrostChill;

})();
