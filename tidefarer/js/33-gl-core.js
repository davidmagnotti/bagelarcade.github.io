/* =====================================================================
   2.5D WEBGL RENDERER - Phase 0+1 (core + ground/scenery)
   ---------------------------------------------------------------------
   Locked-camera GPU renderer. The camera stays at the exact current
   dimetric angle: we drive an orthographic camera in *screen-pixel space*
   and place every quad using the game's own isoX/isoY, so a tile lands on
   the identical pixel it does in the 2D path (worldToScreen/screenToWorld
   are reused untouched - controls are unaffected).

   This phase renders only the GROUND (tiles + terrain fringes, batched
   from a texture atlas baked out of the existing procedural sprites) plus
   the STATIC SCENERY layer (reusing the game's own scenery bake as one
   texture). Entities, effects, lighting, interiors and cutscenes stay on
   the intact 2D path and arrive in later phases.

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

  /* ---------------- scenery layer (reuse the game's own bake as one texture) ----
     buildSceneryCache() (10-rendering.js) depth-sorts every static node/decor and
     draws them into `sceneryCache` with the real per-object art. We upload that
     canvas and blit it as a single quad - pixel-identical to the 2D scenery. */
  let scnTex=null, scnKey='', scnDrawn=false;
  function ensureScenery(){
    if(typeof buildSceneryCache!=='function'){ scnDrawn=false; return; }
    const key=G.worldId+':'+(G.decor?G.decor.length:0);
    const stale = (typeof sceneryCache==='undefined' || !sceneryCache ||
                   typeof scnWorld==='undefined' || scnWorld!==G.worldId ||
                   (typeof scnDecorN!=='undefined' && scnDecorN!==(G.decor?G.decor.length:0)));
    if(stale || key!==scnKey || !scnTex){
      try{ buildSceneryCache(); }catch(e){ scnDrawn=false; return; }
      if(typeof sceneryCache==='undefined' || !sceneryCache){ scnDrawn=false; return; }
      scnTex = scnTex || gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, scnTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sceneryCache);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      scnErr=gl.getError();
      scnTexSize=[sceneryCache.width, sceneryCache.height, gl.getParameter(gl.MAX_TEXTURE_SIZE)];
      scnKey=key; scnDrawn=true;
    }
  }
  let scnErr=0, scnTexSize=null;

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
  const NB=[[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]];
  function drawGround(){
    const CLOUD = !!(WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].cloud);
    const corners=[screenToWorld(0,0),screenToWorld(VW,0),screenToWorld(0,VH),screenToWorld(VW,VH)];
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const c of corners){ minX=Math.min(minX,c.x);maxX=Math.max(maxX,c.x);
      minY=Math.min(minY,c.y);maxY=Math.max(maxY,c.y); }
    minX=Math.floor(minX)-2; maxX=Math.ceil(maxX)+2; minY=Math.floor(minY)-2; maxY=Math.ceil(maxY)+4;
    const y0=Math.max(0,minY), y1=Math.min(MAPH-1,maxY),
          x0=Math.max(0,minX), x1=Math.min(MAPW-1,maxX);
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

  function drawScenery(){
    if(!scnDrawn || !scnTex || typeof sceneryCache==='undefined' || !sceneryCache) return;
    const GCS=(typeof GC_S!=='undefined')?GC_S:0.5;
    // buildSceneryCache() offsets every object by gcDims().OX/OY but (unlike
    // buildGroundCache) never writes gcOX/gcOY, so we recompute the same origin
    // here rather than read those (stale) globals.
    const dims=(typeof gcDims==='function')?gcDims():{OX:0,OY:0};
    const ox=dims.OX, oy=dims.OY;
    const w=sceneryCache.width/GCS, h=sceneryCache.height/GCS;
    const px=-G.cam.x-ox, py=-G.cam.y-oy;
    reset();
    quad(px, py, w, h, {u0:0,v0:0,u1:1,v1:1});
    flush(scnTex);
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
    ensureScenery();
    const CLOUD = !!(WORLD_DEFS[G.worldId] && WORLD_DEFS[G.worldId].cloud);
    if(CLOUD) gl.clearColor(0.737,0.839,0.933,1); else gl.clearColor(0.086,0.157,0.243,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawGround();
    drawScenery();
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
    _stats(){ return {renderer:RENDERER, glDead, atlasReady, scnDrawn, scnErr, scnTexSize}; }
  };
})();
