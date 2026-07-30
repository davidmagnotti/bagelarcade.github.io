/* =====================================================================
   2.5D WEBGL RENDERER - Phase 0-2 (core + ground + entities)
   ---------------------------------------------------------------------
   Locked-camera GPU renderer. The camera stays at the exact current
   dimetric angle: we drive an orthographic camera in *screen-pixel space*
   and place every quad using the game's own isoX/isoY, so a tile lands on
   the identical pixel it does in the 2D path (worldToScreen/screenToWorld
   are reused untouched - controls are unaffected).

   Phase 1 GROUND: tiles + terrain fringes, batched from a texture atlas
   baked out of the existing procedural sprites.
   Phase 2 ENTITIES: scenery (trees/rocks/decor) and actors (player/NPCs/
   mobs/projectiles/pickups) are each rendered to a scratch canvas by the
   game's OWN draw fns, uploaded as textures, and blitted as billboards in
   one painter's-sorted (x+y) pass - so actors interleave with trees. Static
   art is cached; animated art re-renders each frame.

   Still on the 2D path (later phases): particles, floating combat text,
   fireflies, dynamic lighting, water sheen, post-FX grade, interiors,
   cutscenes. Those overlays don't show in gl mode yet.

   EVERYTHING here is gated behind RENDERER==='gl'. The default is '2d', so
   with the flag off this file allocates nothing and the live game renders
   exactly as before. Enable with ?gl=1, or window.TFGL.toggle().
   ===================================================================== */
(function(){
  'use strict';

  /* ---------------- flag ---------------- */
  let RENDERER = '2d';
  try{ const q=new URLSearchParams(location.search);
    if(q.get('gl')==='1' || q.get('renderer')==='gl') RENDERER='gl'; }catch(e){}
  try{ if(RENDERER==='2d' && SafeStore.get('tf_renderer')==='gl') RENDERER='gl'; }catch(e){}

  const glcv = document.getElementById('glgame');
  const twoDcv = document.getElementById('game');
  let gl=null, glDead=false;          // glDead: a hard failure => stay on 2D forever

  /* ---------------- GL context + program ---------------- */
  const VERT = `#version 300 es
precision highp float;
in vec2 aPos;   // screen pixels (same space as worldToScreen)
in vec2 aUV;
uniform vec2 uVP; // viewport size in CSS px (VW,VH)
out vec2 vUV;
void main(){
  vec2 c = vec2((aPos.x/uVP.x)*2.0-1.0, 1.0-(aPos.y/uVP.y)*2.0);
  gl_Position = vec4(c, 0.0, 1.0);
  vUV = aUV;
}`;
  const FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 frag;
uniform sampler2D uTex;
void main(){
  vec4 c = texture(uTex, vUV);
  if(c.a < 0.004) discard;   // let the transparent diamond corners show neighbours
  frag = c;
}`;

  let prog=null, aPos=0, aUV=1, uVP=null, uTex=null, vbo=null, vao=null;

  function compile(type,src){
    const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))
      throw new Error('shader: '+gl.getShaderInfoLog(s));
    return s;
  }
  function initGL(){
    gl = glcv.getContext('webgl2', {alpha:false, antialias:false, depth:false,
      premultipliedAlpha:false, preserveDrawingBuffer:true});
    if(!gl) throw new Error('webgl2 unavailable');
    const vs=compile(gl.VERTEX_SHADER,VERT), fs=compile(gl.FRAGMENT_SHADER,FRAG);
    prog=gl.createProgram(); gl.attachShader(prog,vs); gl.attachShader(prog,fs);
    gl.bindAttribLocation(prog,0,'aPos'); gl.bindAttribLocation(prog,1,'aUV');
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS))
      throw new Error('link: '+gl.getProgramInfoLog(prog));
    aPos=0; aUV=1;
    uVP=gl.getUniformLocation(prog,'uVP'); uTex=gl.getUniformLocation(prog,'uTex');
    vao=gl.createVertexArray(); gl.bindVertexArray(vao);
    vbo=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,16,0);
    gl.enableVertexAttribArray(aUV);  gl.vertexAttribPointer(aUV,2,gl.FLOAT,false,16,8);
    gl.bindVertexArray(null);
    gl.disable(gl.DEPTH_TEST);         // ground is painter-ordered like the 2D pass
    gl.enable(gl.BLEND);
    // Textures are uploaded premultiplied (see texImage2D calls), so composite
    // premultiplied too. This keeps the soft, many-low-alpha-layer foliage from
    // darkening the way straight-alpha + un-premultiply would.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    glcv.addEventListener('webglcontextlost', e=>{ e.preventDefault(); glDead=true; },false);
  }

  /* ---------------- texture atlas (baked from procedural sprites) ----------------
     TILE_SPR[t][v] are 64x40 diamond tiles; FRINGE[cls][dir] are 64x32 edge
     blends - both already drawn procedurally at boot. We shelf-pack them into
     one atlas canvas and upload it as a single texture. */
  let atlasTex=null, atlasReady=false;
  const tileCell={}, fringeCell={};   // [t][v] / [cls][dir] -> {u0,v0,u1,v1,w,h}
  const GUT=2;                         // gutter between cells (avoids sampling bleed)

  function buildAtlas(){
    if(typeof TILE_SPR==='undefined' || !TILE_SPR || !Object.keys(TILE_SPR).length) return false;
    // collect sources (tiles are 64x40, fringes 64x32; ~60 cells total)
    const srcs=[];
    for(const t in TILE_SPR){ const arr=TILE_SPR[t];
      for(let v=0;v<arr.length;v++) srcs.push({canvas:arr[v], kind:'tile', t:+t, v:v}); }
    if(typeof FRINGE!=='undefined') for(const cls in FRINGE){ const arr=FRINGE[cls];
      for(let d=0;d<arr.length;d++) srcs.push({canvas:arr[d], kind:'fringe', cls:+cls, d:d}); }
    if(!srcs.length) return false;
    // shelf-pack into a fixed 1024x1024 atlas - ample for this cell count, so it
    // never needs to grow (which would invalidate already-computed UVs).
    const AW=1024, AH=1024;
    const pack=document.createElement('canvas'); pack.width=AW; pack.height=AH;
    const pg=pack.getContext('2d');
    let cx0=GUT, cy0=GUT, rowH=0;
    for(const s of srcs){
      const w=s.canvas.width, h=s.canvas.height;
      if(cx0+w+GUT > AW){ cx0=GUT; cy0+=rowH+GUT; rowH=0; }
      if(cy0+h+GUT > AH){ console.error('[TFGL] atlas overflow'); return false; }
      pg.drawImage(s.canvas, cx0, cy0);
      const cell={ u0:cx0/AW, v0:cy0/AH, u1:(cx0+w)/AW, v1:(cy0+h)/AH, w:w, h:h };
      if(s.kind==='tile'){ (tileCell[s.t]=tileCell[s.t]||{})[s.v]=cell; }
      else { (fringeCell[s.cls]=fringeCell[s.cls]||{})[s.d]=cell; }
      cx0+=w+GUT; rowH=Math.max(rowH,h);
    }
    atlasTex = atlasTex || gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,pack);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    atlasReady=true;
    return true;
  }

  /* ---------------- per-object billboard system (Phase 2) ----------------
     Every scenery node, decor, actor, projectile and pickup is drawn to a small
     scratch 2D canvas using the game's OWN draw fns (drawNode/drawDecor/drawNPC/
     drawMobEntity/drawPlayer/...), then uploaded as a texture and blitted as a
     billboard quad. Static objects (scenery nodes, non-animated decor) are cached
     by kind+variant so their art is drawn once; animated objects are re-rendered
     each frame into a small round-robin texture pool. Depth order is the game's
     own painter's key (x+y), so actors correctly pass in front of / behind trees. */

  // canvas-space size + anchor per bucket. The draw fns place art relative to a
  // screen point s; we render at s=(ax,ay) inside a wxh canvas, then billboard so
  // that (ax,ay) lands on the object's real screen position.
  const SIZE = {
    actor: {w:160,h:172,ax:80,ay:142},   // humanoids/mobs/cat/critter + name/HP above
    node:  {w:140,h:150,ax:70,ay:124},   // trees/rocks/bushes/mushrooms
    decor: {w:272,h:312,ax:136,ay:260},  // houses/towers/lamps/gates/...
    small: {w:64, h:64, ax:32,ay:44}     // projectiles / pickups
  };
  function bucketFor(kind){
    if(kind==='node') return 'node';
    if(kind==='decor'||kind==='lamp') return 'decor';
    if(kind==='proj'||kind==='pickup') return 'small';
    return 'actor'; // npc, mob, player, cat, critter
  }

  // one scratch canvas, reused for every render-to-texture (drawn at DPR for crispness)
  const scratch=document.createElement('canvas');
  let texDPR=1;
  function renderToScratch(kind, o, spec){
    const D=texDPR, cw=Math.ceil(spec.w*D), ch=Math.ceil(spec.h*D);
    if(scratch.width!==cw) scratch.width=cw;
    if(scratch.height!==ch) scratch.height=ch;
    const g=scratch.getContext('2d');
    g.setTransform(D,0,0,D,0,0);
    g.clearRect(0,0,spec.w,spec.h);
    const s={x:spec.ax, y:spec.ay};
    const saved=cx; cx=g;                       // repoint the global ctx the draw fns use
    try{ dispatchDraw(kind, o, s); }
    catch(e){ /* one bad object shouldn't kill the frame */ }
    finally{ cx=saved; }
    return scratch;
  }
  // the same dispatch the 2D entity pass uses (10-rendering.js), drawing to global cx
  function dispatchDraw(kind, o, s){
    switch(kind){
      case 'node': drawNode(o,s); break;
      case 'decor': case 'lamp': drawDecor(o,s); break;
      case 'npc': drawNPC(o,s); break;
      case 'mob': drawMobEntity(o,s); break;
      case 'cat': drawShadowAt(cx,s.x,s.y,9); drawCat(cx,s.x,s.y,o); break;
      case 'critter': drawShadowAt(cx,s.x,s.y,o.kind==='crab'?7:8); drawCritter(cx,s.x,s.y,o); break;
      case 'player': drawPlayer(s); break;
      case 'proj': drawProj(o,s); break;
      case 'pickup': drawPickup(o,s); break;
    }
  }
  function uploadInto(tex, canvas){
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  }

  // static-scenery texture cache, keyed by kind+variant+state; rebuilt if DPR changes
  const staticCache=new Map();
  let cacheDPR=1;
  function staticKey(kind,o){
    if(kind==='node') return 'n:'+o.kind+':'+(o.variant||0)+':'+(o.dead?1:0)+':'+(o.palm?1:0)+':'+(o.big?1:0);
    return 'd:'+o.kind+':'+(o.variant||0);
  }
  function isDynamic(kind,o){
    if(kind==='decor'||kind==='lamp') return !!(typeof DYNAMIC_DECOR!=='undefined' && DYNAMIC_DECOR[o.kind]);
    if(kind==='node') return false;                 // scenery is static (sway frozen, like Phase 1)
    return true;                                    // actors/projectiles/pickups animate
  }
  function staticTexFor(kind,o){
    const key=staticKey(kind,o);
    let e=staticCache.get(key);
    if(e) return e;
    const spec=SIZE[bucketFor(kind)];
    renderToScratch(kind,o,spec);
    const tex=gl.createTexture(); uploadInto(tex, scratch);
    e={tex, ax:spec.ax, ay:spec.ay, w:spec.w, h:spec.h};
    staticCache.set(key,e);
    return e;
  }
  // round-robin pool of textures for animated objects (re-uploaded every frame)
  const POOL_N=24; const pool=[]; let poolI=0;
  function dynamicTexFor(kind,o){
    const spec=SIZE[bucketFor(kind)];
    renderToScratch(kind,o,spec);
    let tex=pool[poolI]; if(!tex){ tex=gl.createTexture(); pool[poolI]=tex; }
    poolI=(poolI+1)%POOL_N;
    uploadInto(tex, scratch);
    return {tex, ax:spec.ax, ay:spec.ay, w:spec.w, h:spec.h};
  }

  /* ---------------- dynamic vertex batch ---------------- */
  let buf=new Float32Array(24*4096), n=0;   // 24 floats = one quad (6 verts * [x,y,u,v])
  function reset(){ n=0; }
  function grow(){ const nb=new Float32Array(buf.length*2); nb.set(buf); buf=nb; }
  function quad(x0,y0,w,h,c){
    if(n+24>buf.length) grow();
    const x1=x0+w, y1=y0+h, u0=c.u0,v0=c.v0,u1=c.u1,v1=c.v1;
    const d=buf; let i=n;
    d[i++]=x0;d[i++]=y0;d[i++]=u0;d[i++]=v0;
    d[i++]=x1;d[i++]=y0;d[i++]=u1;d[i++]=v0;
    d[i++]=x1;d[i++]=y1;d[i++]=u1;d[i++]=v1;
    d[i++]=x0;d[i++]=y0;d[i++]=u0;d[i++]=v0;
    d[i++]=x1;d[i++]=y1;d[i++]=u1;d[i++]=v1;
    d[i++]=x0;d[i++]=y1;d[i++]=u0;d[i++]=v1;
    n=i;
  }
  function flush(tex){
    if(n===0) return;
    gl.useProgram(prog); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
    gl.bufferData(gl.ARRAY_BUFFER, buf.subarray(0,n), gl.DYNAMIC_DRAW);
    gl.uniform2f(uVP, VW, VH);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(uTex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, n/4);
    gl.bindVertexArray(null);
    reset();
  }

  /* ---------------- ground pass (per-tile atlas quads) ----------------
     Mirrors the 2D full-detail ground loop in render() (10-rendering.js): same
     visible-range cull, same tile blit at worldToScreen-(TW/2,TH/2), same terrain
     fringe overlays. Animated water sheen is a live effect (Phase 3), omitted. */
  function visibleRange(){
    const corners=[screenToWorld(0,0),screenToWorld(VW,0),screenToWorld(0,VH),screenToWorld(VW,VH)];
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const c of corners){ minX=Math.min(minX,c.x);maxX=Math.max(maxX,c.x);
      minY=Math.min(minY,c.y);maxY=Math.max(maxY,c.y); }
    return { minX:Math.floor(minX)-2, maxX:Math.ceil(maxX)+2,
             minY:Math.floor(minY)-2, maxY:Math.ceil(maxY)+4 };
  }
  const NB=[[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]];
  function drawGround(r){
    const CLOUD = !!(WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].cloud);
    const y0=Math.max(0,r.minY), y1=Math.min(MAPH-1,r.maxY),
          x0=Math.max(0,r.minX), x1=Math.min(MAPW-1,r.maxX);
    reset();
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const t=G.map[y*MAPW+x];
      if(CLOUD && (t===T.DEEP||t===T.SHALLOW)) continue;
      const sx=isoX(x,y)-G.cam.x, sy=isoY(x,y)-G.cam.y;
      const tc=tileCell[t] && tileCell[t][G.variant[y*MAPW+x]];
      if(tc) quad(sx-TW/2, sy-TH/2, tc.w, tc.h, tc);
      if(t!==T.SHALLOW && t!==T.DEEP){
        const mc=terrainCls(t);
        if(mc<4) for(const nb of NB){
          const nc=terrainCls(tileAt(x+nb[0],y+nb[1]));
          const fc=fringeCell[nc] && fringeCell[nc][nb[2]];
          if(nc>mc && fc) quad(sx-TW/2, sy-TH/2, fc.w, fc.h, fc);
        }
      }
    }
    flush(atlasTex);
  }

  /* ---------------- unified depth-sorted entity pass (Phase 2) ----------------
     Replicates the full-detail 2D entity pass (10-rendering.js:188-221): collect
     scenery + actors, sort by the x+y depth key, and draw each as a billboard so
     they interleave correctly (an actor passes behind a nearer tree). Static
     objects come from the texture cache; animated ones re-render each frame. */
  function billboard(kind, o){
    const e = isDynamic(kind,o) ? dynamicTexFor(kind,o) : staticTexFor(kind,o);
    const sx=isoX(o.x,o.y)-G.cam.x, sy=isoY(o.x,o.y)-G.cam.y;
    reset();
    quad(sx-e.ax, sy-e.ay, e.w, e.h, {u0:0,v0:0,u1:1,v1:1});
    flush(e.tex);
  }
  const FLOOR_PLATE={firepit:1,spinwheel:1,froststream:1,icefloe:1,driftslab:1,
    conveytile:1,bonepit:1,fadetile:1,spiketile:1,dancebtn:1};
  function glEntityPass(minX,maxX,minY,maxY){
    const items=[];
    for(const nd of G.nodes){
      if(nd.tx<minX-1||nd.tx>maxX+1||nd.ty<minY-1||nd.ty>maxY+1) continue;
      items.push({d:nd.x+nd.y, kind:'node', o:nd});
    }
    for(const b of G.decor){
      const cm=b.grand?28:(b.kind==='tower'&&b.tall)?12:2;
      if(b.x<minX-cm||b.x>maxX+cm||b.y<minY-cm||b.y>maxY+cm) continue;
      const dd=FLOOR_PLATE[b.kind]? -9990 : b.x+b.y;
      items.push({d:dd, kind:b.kind==='lamp'?'lamp':'decor', o:b});
    }
    for(const nc of G.npcs){ if(nc.hidden) continue; items.push({d:nc.x+nc.y, kind:'npc', o:nc}); }
    for(const m of G.mobs){ if(!m.dead && !m.sealed) items.push({d:m.x+m.y, kind:'mob', o:m}); }
    if(G.cat) items.push({d:G.cat.x+G.cat.y, kind:'cat', o:G.cat});
    if(G.critters) for(const c of G.critters) items.push({d:c.x+c.y, kind:'critter', o:c});
    if(!P.dead) items.push({d:P.x+P.y, kind:'player', o:P});
    for(const p of G.projs) items.push({d:p.x+p.y, kind:'proj', o:p});
    for(const pt of G.parts){ if(pt.pickup) items.push({d:pt.x+pt.y, kind:'pickup', o:pt}); }
    items.sort((a,b)=>a.d-b.d);
    for(const it of items) billboard(it.kind, it.o);
  }

  /* ---------------- frame ---------------- */
  function syncSize(){
    // mirror #game's backing store + CSS geometry exactly (DPR, PERF letterbox)
    if(glcv.width!==twoDcv.width || glcv.height!==twoDcv.height){
      glcv.width=twoDcv.width; glcv.height=twoDcv.height;
    }
    glcv.style.width=twoDcv.style.width; glcv.style.height=twoDcv.style.height;
    glcv.style.left=twoDcv.style.left||'0px'; glcv.style.top=twoDcv.style.top||'0px';
    gl.viewport(0,0,glcv.width,glcv.height);
  }
  function glRender(){
    if(!gl){ initGL(); }
    if(!atlasReady){ if(!buildAtlas()) return; }
    syncSize();
    // texture supersample = DPR (crisp); rebuild the static cache if it changed
    texDPR=Math.max(0.5, Math.min(DPR||1, 2));
    if(texDPR!==cacheDPR){ staticCache.forEach(e=>gl.deleteTexture(e.tex)); staticCache.clear(); cacheDPR=texDPR; }
    const CLOUD = !!(WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].cloud);
    if(CLOUD) gl.clearColor(0.737,0.839,0.933,1); else gl.clearColor(0.086,0.157,0.243,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const r=visibleRange();
    drawGround(r);
    glEntityPass(r.minX,r.maxX,r.minY,r.maxY);
  }

  /* ---------------- canvas visibility ---------------- */
  function showGL(on){
    if(on){ if(glcv.style.display!=='block') glcv.style.display='block'; }
    else  { if(glcv.style.display!=='none')  glcv.style.display='none'; }
  }

  /* ---------------- install: wrap the global render() ----------------
     render is a mutable global that 22-/32- already wrap; we wrap the current
     one. In gl mode we draw the overworld on WebGL; interiors and every non-play
     state fall back to the intact 2D render on #game (Phase 5 ports interiors). */
  function install(){
    if(typeof render!=='function') return;
    const render2d = render;
    render = function(){
      if(RENDERER==='gl' && !glDead && !(typeof G!=='undefined' && G.interior)){
        try{ glRender(); showGL(true); return; }
        catch(e){ console.error('[TFGL] falling back to 2D:', e); glDead=true; showGL(false); }
      }
      showGL(false);
      return render2d.apply(this, arguments);
    };
  }
  // render() is defined by the time scripts finish parsing; install now.
  install();

  /* ---------------- public toggle ---------------- */
  window.TFGL = {
    get renderer(){ return RENDERER; },
    on(){ RENDERER='gl'; glDead=false; try{SafeStore.set('tf_renderer','gl');}catch(e){} },
    off(){ RENDERER='2d'; showGL(false); try{SafeStore.set('tf_renderer','2d');}catch(e){} },
    toggle(){ RENDERER==='gl'?this.off():this.on(); },
    _stats(){ return {renderer:RENDERER, glDead, atlasReady,
      staticTex:staticCache.size, poolTex:pool.length, glErr:gl?gl.getError():-1}; }
  };
})();
