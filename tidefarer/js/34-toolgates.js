/* =====================================================================
   GATHERING-TOOL GATES  -  tiered axe/pick as Metroidvania keys.

   The chop/mine power formula already reads P.tools.axe / P.tools.pick as
   integer tiers (0 = none, 1 = iron from the forge). This adds the
   dungeon/mill-forged upper tiers - a Rivenedge Axe and Cragbreaker Pick
   (tier 2) and a Cograzor Pick (tier 3) - and three gated materials that
   only the matching tool can cut:

     - IRONWOOD  (blue-black pines)  needs axe  tier >= 2  (Rivenedge)
     - BASALT    (violet stone)      needs pick tier >= 2  (Cragbreaker)
     - SLAGIRON  (rust-red stone)    needs pick tier >= 3  (Cograzor)

   A gated node is an ordinary tree/rock with n.gate set. It is a solid
   BARRIER: it never regrows once felled (n.gone), so cutting it opens the
   way for good. Below your tier it just clinks and bounces. Colour-coded
   on sight (drawGateAura) so you can note it and come back.

   Placement (content): call addGateNode(gate,x,y) in a world's gen to wall
   a passage; drop {axegift:1}/{pickgift:1} chests in the two dungeons.
   Persisting a felled gate across save/reload needs a story flag, same as
   the dungeon-mouth state - a placement concern, not a systems one.
   ===================================================================== */
(function(){
'use strict';

var GATES={
  ironwood:{ tool:'axe',  req:2, kind:'tree', hp:20, tag:'IRONWOOD',
             color:'#8fb3ff', glow:'rgba(70,110,190,1)', spark:'#a9c4ff',
             need:'the dungeon-forged <b>Rivenedge Axe</b>', drop:'hardwood', dropN:2, skill:'woodcut' },
  basalt:{   tool:'pick', req:2, kind:'rock', hp:24, tag:'BASALT',
             color:'#c79bff', glow:'rgba(120,70,180,1)', spark:'#d9b8ff',
             need:'the dungeon-forged <b>Cragbreaker Pick</b>', drop:'ore', dropN:2, skill:'mining' },
  slagiron:{ tool:'pick', req:3, kind:'rock', hp:26, tag:'SLAGIRON',
             color:'#e0955a', glow:'rgba(190,95,45,1)', spark:'#f2b98a',
             need:'the mill-forged <b>Cograzor Pick</b>', drop:'ore', dropN:3, skill:'mining' }
};
function tierOf(tool){ return (P.tools && P.tools[tool]) || 0; }

/* ---- placement: a gated barrier node ---- */
function addGateNode(gate,x,y){
  var cfg=GATES[gate]; if(!cfg || !inb(x,y)) return null;
  var n={ kind:cfg.kind, gate:gate, x:x+0.5, y:y+0.5, tx:x, ty:y,
          hp:cfg.hp, maxhp:cfg.hp, dead:false, gone:false, respawn:1e9,
          variant:rndi(0,2), sway:Math.random()*TAU };
  G.nodes.push(n); setSolid(x,y,1);
  return n;
}

/* ---- the clink: below-tier tools bounce ---- */
function gateBlocked(n){
  var cfg=GATES[n.gate]; if(!cfg) return false;
  if(tierOf(cfg.tool) >= cfg.req) return false;   // you can cut it - not blocked
  n.shake=0.16; P.swing=Math.max(P.swing||0,0.2); P.anim+=0.3;
  if(Snd.tone) Snd.tone(170,0.07,'square',0.05,-40);
  burst(n.x, n.y-(cfg.kind==='rock'?0.4:1.1), cfg.spark, 5, 1.4);
  if(!P._gateNagT || G.time>P._gateNagT){ P._gateNagT=G.time+2.6;
    toastErr('Your '+(cfg.tool==='axe'?'axe':'pick')+' barely marks the <b style="color:'+cfg.color+'">'+cfg.tag.toLowerCase()+'</b> - only '+cfg.need+' '+(cfg.tool==='axe'?'fells':'breaks')+' it.',4200); }
  return true;
}

/* ---- felled for good: the way opens ---- */
function clearGateNode(n){
  var cfg=GATES[n.gate]||{};
  n.dead=true; n.gone=true; setSolid(n.tx,n.ty,0);
  // persist: a placed gate (n.gid) stays felled across save/reload (35-toolgate-content.js)
  if(n.gid){ P.story=P.story||{}; P.story.tg=P.story.tg||{}; P.story.tg[n.gid]=1; }
  if(typeof invalidateScenery==='function') invalidateScenery();
  shockwave(n.x,n.y,cfg.glow||'rgba(200,200,200,0.8)',40);
  burst(n.x,n.y-(cfg.kind==='rock'?0.5:1.4), cfg.spark||'#ccc', 18, 2.6);
  if(cfg.kind==='rock'){ if(Snd.mine) Snd.mine(); } else { if(Snd.chop) Snd.chop(); }
  G.shake=Math.max(G.shake||0,0.3);
  if(cfg.drop){ give(cfg.drop,cfg.dropN||1); addFloat('+'+(cfg.dropN||1)+' '+(ITEMS[cfg.drop]?ITEMS[cfg.drop].name:cfg.drop), n.x, n.y-2, cfg.color||'#e8dcbd', 1.1); }
  if(cfg.skill && typeof addXP==='function') addXP(cfg.skill, 34);
  if(typeof hintOnce==='function') hintOnce('gateopen','A gated way falls open. Old paths you couldn\'t clear before are yours now - it stays open for good.');
}

/* ---- colour-coding (called from drawNode in 10-rendering.js) ---- */
function drawGateAura(n,s){
  var cfg=GATES[n.gate]; if(!cfg) return;
  var t=G.time, pulse=0.5+0.5*Math.sin(t*2+n.tx*0.7);
  cx.save();
  // ground glow
  cx.globalAlpha=0.16+0.18*pulse; cx.fillStyle=cfg.glow;
  cx.beginPath(); cx.ellipse(s.x, s.y-3, 22, 11, 0, 0, TAU); cx.fill();
  cx.globalAlpha=1;
  // drifting motes in the gate colour
  if(Math.random()<0.06) G.parts.push({x:n.x+rnd(-0.3,0.3), y:n.y-rnd(0.2,1.4), vx:rnd(-0.1,0.1), vy:-rnd(0.2,0.5), life:0.7, color:cfg.spark, size:2.2, grav:0});
  // a colour-keyed tag above the node, fading in as you approach
  var d=dist(P.x,P.y,n.x,n.y);
  if(d<9){
    var top=(cfg.kind==='rock')? -52 : -106;
    cx.globalAlpha=Math.max(0,Math.min(1,(9-d)/3.2));
    cx.font='bold 10px Georgia'; cx.textAlign='center';
    cx.lineWidth=3.2; cx.strokeStyle='rgba(0,0,0,0.82)'; cx.strokeText(cfg.tag, s.x, s.y+top);
    cx.fillStyle=cfg.color; cx.fillText(cfg.tag, s.x, s.y+top);
    cx.globalAlpha=1;
  }
  cx.restore();
}

/* ---- grants: the two dungeon-forged tools ---- */
function grantRivenedge(){
  P.tools=P.tools||{axe:0,pick:0}; P.kit=true;
  if((P.tools.axe||0)>=2) return;
  P.tools.axe=2; give('rivenedge',1);
  banner('THE RIVENEDGE AXE','IRONWOOD WILL FALL');
  storyCard('<i>Cooling on the forge-stone where the dungeon kept it, a greataxe with an edge like a split of dark water.</i> <b style="color:#8fb3ff">You take the Rivenedge Axe.</b> <i>The blue-black <b>ironwood</b> that walled the old paths is only timber to it now - and every common pine falls in a swing or two. Go back for the ways you had to leave behind.</i>');
  if(typeof refreshUI==='function') refreshUI();
}
function grantCragbreaker(){
  P.tools=P.tools||{axe:0,pick:0}; P.kit=true;
  if((P.tools.pick||0)>=2) return;
  P.tools.pick=2; give('cragbreaker',1);
  banner('THE CRAGBREAKER PICK','BASALT WILL SPLIT');
  storyCard('<i>A pick of blackened steel, heavy as a grudge, hafted for two hands.</i> <b style="color:#c79bff">You take the Cragbreaker Pick.</b> <i>The violet <b>basalt</b> that sealed the deep ways shatters under it - and ordinary stone gives up far faster. The sealed passages you passed are open to you now.</i>');
  if(typeof refreshUI==='function') refreshUI();
}
function grantCograzor(){
  P.tools=P.tools||{axe:0,pick:0}; P.kit=true;
  if((P.tools.pick||0)>=3) return;
  P.tools.pick=3; give('cograzor',1);
  banner('THE COGRAZOR PICK','SLAGIRON WILL BREAK');
  storyCard('<i>A pick hafted from a broken mill-gear, its tooth still keen.</i> <b style="color:#e0955a">You take the Cograzor Pick.</b> <i>The rust-red <b>slagiron</b> that sealed the mill-deep nooks breaks under it - and every ordinary stone splits faster still. Go back for the ways the slagiron kept from you.</i>');
  if(typeof refreshUI==='function') refreshUI();
}

/* ---- sandbox (dev): a hard gate of each, treasure behind, NO tools granted
        so you feel the bounce first; grant the tools from the dev menu. ---- */
function walkNear(dx,dy){
  var tx=Math.round(P.x)+dx, ty=Math.round(P.y)+dy;
  if(inb(tx,ty) && walkTile(tileAt(tx,ty)) && !solidAt(tx,ty)) return [tx,ty];
  for(var r=1;r<=5;r++) for(var oy=-r;oy<=r;oy++) for(var ox=-r;ox<=r;ox++){
    var x=tx+ox,y=ty+oy; if(inb(x,y) && walkTile(tileAt(x,y)) && !solidAt(x,y)) return [x,y];
  }
  return [tx,ty];
}
function spawnToolgateSandbox(){
  // a wall of ironwood to the east, a chest behind it
  for(var i=-1;i<=1;i++){ var w=walkNear(5, i); addGateNode('ironwood', w[0], w[1]); }
  var ce=walkNear(7,0); G.decor.push({kind:'chest', x:ce[0]+0.5, y:ce[1]+0.5, axegift:1});
  // a wall of basalt to the west, a chest behind it
  for(var j=-1;j<=1;j++){ var b=walkNear(-5, j); addGateNode('basalt', b[0], b[1]); }
  var cw=walkNear(-7,0); G.decor.push({kind:'chest', x:cw[0]+0.5, y:cw[1]+0.5, pickgift:1});
  // a wall of slagiron to the south, a chest behind it (needs the tier-3 Cograzor Pick)
  for(var s=-1;s<=1;s++){ var sg=walkNear(s, 5); addGateNode('slagiron', sg[0], sg[1]); }
  var cs=walkNear(0,7); G.decor.push({kind:'chest', x:cs[0]+0.5, y:cs[1]+0.5, slaggift:1});
  if(typeof invalidateScenery==='function') invalidateScenery();
  if(typeof toast==='function') toast('<b>Tool-gate sandbox:</b> a wall of <b style="color:#8fb3ff">ironwood</b> east, <b style="color:#c79bff">basalt</b> west, <b style="color:#e0955a">slagiron</b> south - each with a chest behind. Try chopping/mining them now (they bounce), then grant the matching tool from the dev menu.',8000);
}

/* ---- exports ---- */
window.GATES=GATES; window.addGateNode=addGateNode;
window.gateBlocked=gateBlocked; window.clearGateNode=clearGateNode; window.drawGateAura=drawGateAura;
window.grantRivenedge=grantRivenedge; window.grantCragbreaker=grantCragbreaker;
window.grantCograzor=grantCograzor;
window.spawnToolgateSandbox=spawnToolgateSandbox;

})();
