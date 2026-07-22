"use strict";
/* Build number - bump on every change so a cached/stale load is obvious.
   Shown in the ?perf overlay and logged to the console on load. */
const BUILD = '68';
try{ console.log('%cTidefarer  build '+BUILD, 'color:#7CFC00;font-weight:bold;font-size:14px'); }catch(e){}
// A tiny always-visible build tag, so a stale/cached load is obvious at a glance:
// if this number doesn't match the latest, the device is running old cached code.
try{ const _bt=document.createElement('div'); _bt.textContent='build '+BUILD;
  _bt.style.cssText='position:fixed;left:3px;bottom:2px;font:9px/1 monospace;color:rgba(255,255,255,.4);z-index:99999;pointer-events:none;text-shadow:0 1px 2px #000;';
  (document.body||document.documentElement).appendChild(_bt); }catch(e){}
/* Storage can throw SecurityError in sandboxed frames / private browsing.
   Probe once; fall back to in-memory so the game always boots. */
const SafeStore=(()=>{
  let ok=false; const mem={};
  try{ const k='__ew_probe'; localStorage.setItem(k,'1'); localStorage.removeItem(k); ok=true; }catch(e){ ok=false; }
  return {
    get:(k)=>{ try{ return ok? localStorage.getItem(k) : (k in mem? mem[k] : null); }catch(e){ return (k in mem? mem[k]:null); } },
    set:(k,v)=>{ try{ if(ok){ localStorage.setItem(k,v); return; } }catch(e){} mem[k]=String(v); },
    del:(k)=>{ try{ if(ok){ localStorage.removeItem(k); return; } }catch(e){} delete mem[k]; },
    persistent: ok
  };
})();
/* =====================================================================
   EMBERWICK ISLE - a single-file isometric sandbox adventure
   All art is drawn procedurally. All audio is synthesized. No assets.
   ===================================================================== */

/* ---------------- constants & helpers ---------------- */
const TW = 64, TH = 32;                 // iso tile size
let MAPW = 112, MAPH = 112;
const T = { DEEP:0, SHALLOW:1, SAND:2, GRASS:3, FOREST:4, RUIN:5, PATH:6, SOIL:7, PLANK:8, SNOW:9, ICE:10 };
const clamp = (v,a,b)=> v<a?a : v>b?b : v;
const lerp = (a,b,t)=> a+(b-a)*t;
const dist = (ax,ay,bx,by)=> Math.hypot(ax-bx, ay-by);
const rndi = (a,b)=> a + Math.floor(Math.random()*(b-a+1));
const rnd  = (a,b)=> a + Math.random()*(b-a);
const TAU = Math.PI*2;

function mulberry32(seed){ let a = seed>>>0;
  return function(){ a|=0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a>>>15, 1|a);
    t = t + Math.imul(t ^ t>>>7, 61|t) ^ t;
    return ((t ^ t>>>14)>>>0)/4294967296; }; }

/* value noise */
function makeNoise(seed, gridN){
  const rand = mulberry32(seed);
  const g = new Float32Array((gridN+1)*(gridN+1));
  for(let i=0;i<g.length;i++) g[i]=rand();
  const smooth = t=> t*t*(3-2*t);
  return function(x,y){ // x,y in 0..1
    const fx = x*gridN, fy = y*gridN;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = smooth(fx-x0), ty = smooth(fy-y0);
    const i = (xx,yy)=> g[clamp(yy,0,gridN)*(gridN+1)+clamp(xx,0,gridN)];
    return lerp( lerp(i(x0,y0), i(x0+1,y0), tx), lerp(i(x0,y0+1), i(x0+1,y0+1), tx), ty );
  };
}

/* ---------------- tiny synth audio ---------------- */
const Snd = {
  ctx:null, on:true,
  init(){ if(!this.ctx){ try{ this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ this.on=false; } } if(this.ctx && this.ctx.state==='suspended') this.ctx.resume(); },
  tone(freq, dur, type, vol, slide){
    if(!this.on || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type||'square'; o.frequency.setValueAtTime(freq, t0);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide), t0+dur);
    if(CFG.sfx<=0.02) return;
    g.gain.setValueAtTime((vol||0.08)*CFG.sfx, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t0); o.stop(t0+dur+0.02);
  },
  _nb:null,
  noiseBuf(){ if(this._nb||!this.ctx) return this._nb;
    const b=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);
    const d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    this._nb=b; return b; },
  noise(dur,vol,freq,q){ if(!this.on||!this.ctx) return;
    const t0=this.ctx.currentTime, s=this.ctx.createBufferSource(); s.buffer=this.noiseBuf();
    const f=this.ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq||800; f.Q.value=q||0.8;
    if(CFG.sfx<=0.02) return;
    const g=this.ctx.createGain(); g.gain.setValueAtTime((vol||0.05)*CFG.sfx,t0);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    s.connect(f); f.connect(g); g.connect(this.ctx.destination); s.start(t0); s.stop(t0+dur+0.02); },
  step(t){ this.noise(0.05, 0.016, t===2?900 : t===8?480 : 300, 1.2); },
  crit(){ this.tone(880,0.1,'square',0.055,-300); this.noise(0.12,0.045,2400,1); },
  thunder(){ this.noise(1.6,0.14,120,0.4); setTimeout(()=>this.noise(1.1,0.08,80,0.3),300); },
  chirp(){ const f=2000+Math.random()*1200; this.tone(f,0.07,'sine',0.018,-400);
    setTimeout(()=>this.tone(f*0.9,0.06,'sine',0.014,-300),90); },
  cricket(){ for(let i=0;i<3+Math.floor(Math.random()*3);i++)
    setTimeout(()=>this.tone(4200,0.03,'sine',0.011,60),i*70); },
  caw(){ this.noise(0.13,0.035,900,2); this.tone(340,0.14,'sawtooth',0.024,-140);
    if(Math.random()<0.5) setTimeout(()=>{ this.noise(0.1,0.028,850,2); this.tone(320,0.12,'sawtooth',0.02,-120); },220); },
  hit(){ this.tone(160,0.09,'square',0.07,-80); },
  chop(){ this.tone(220,0.07,'triangle',0.09,-120); },
  mine(){ this.tone(700,0.05,'square',0.05,-300); this.tone(180,0.08,'triangle',0.06,-60); },
  hurt(){ this.tone(120,0.18,'sawtooth',0.09,-60); },
  pickup(){ this.tone(660,0.07,'sine',0.08,220); },
  coin(){ this.tone(900,0.06,'square',0.05,300); setTimeout(()=>this.tone(1200,0.08,'square',0.05,200),60); },
  quest(){ [523,659,784,1046].forEach((f,i)=> setTimeout(()=>this.tone(f,0.16,'triangle',0.09),i*90)); },
  levelup(){ [392,523,659,784].forEach((f,i)=> setTimeout(()=>this.tone(f,0.2,'sine',0.09),i*100)); },
  bow(){ this.tone(300,0.08,'sine',0.06,500); },
  magic(){ this.tone(500,0.2,'sawtooth',0.05,400); this.tone(1000,0.15,'sine',0.04,-400); },
  splash(){ this.tone(300,0.2,'sine',0.06,-200); },
  die(){ [300,220,160,110].forEach((f,i)=> setTimeout(()=>this.tone(f,0.25,'sawtooth',0.08,-30),i*140)); },
  boss(){ [110,98,110,82].forEach((f,i)=> setTimeout(()=>this.tone(f,0.35,'sawtooth',0.1,-10),i*180)); }
};

/* ---------------- canvas setup ---------------- */
const cv = document.getElementById('game');
/* alpha:false = opaque canvas. The scene fills every pixel (sky fill each
   frame), so we never need transparency, and an opaque canvas is far cheaper
   for the browser to composite - critical on weak GPUs (e.g. Snapdragon/ARM
   with little graphics memory), where per-pixel blending of a transparent
   full-viewport canvas dominates the frame. */
/* alpha:false = opaque canvas (scene fills every pixel), cheaper to composite.
   NOTE: desynchronized:true was tried and REVERTED - on this ARM/Edge setup it
   caused a strobe/flicker (canvas presenting out of sync with the DOM UI on
   top) without improving performance. */
/* `let` (not const) so the low-gfx scenery baker can briefly point drawing at
   an offscreen cache and restore it - see buildSceneryCache in js/10-rendering. */
let cx = cv.getContext('2d', {alpha:false});
let VW=0, VH=0, DPR=1;
/* RQ = render-quality scale, LOWFX = drop the most expensive post-FX,
   SAFE = minimal-GPU mode (also skips dynamic lighting). The adaptive perf
   tuner (js/24-perf.js) lowers these on weak GPUs; SAFE is forced by ?safe. */
let RQ=1, LOWFX=false, SAFE=false;
/* PERF (Performance Mode) shrinks the DISPLAYED canvas into a smaller centered
   box - the one lever that actually helps GPUs that are slow to composite a
   full-viewport canvas (fewer on-screen pixels to present each frame). LB holds
   the letterbox offset so input coords map back into the smaller canvas. */
let PERF = false; try{ PERF = SafeStore.get('tf_perf')==='1'; }catch(e){}
const PERF_CAP = 640;   // max displayed longest-edge in Performance Mode
const LB = {x:0, y:0};
/* Per-effect toggles for Performance mode (checkboxes in the pause menu).
   Defaults = the balanced low-gfx preset: the full-screen-expensive passes off,
   the cheaper ambiance on. Persisted per-effect. In normal (non-perf) detail
   everything renders regardless - fxOn() short-circuits when !LOWFX. */
const FX = { grade:0, lighting:0, bloom:0, cloudShadows:0, foam:0,
             fog:1, decals:1, particles:1, fireflies:1, birds:1, vignette:1 };
try{ for(const k in FX){ const v=SafeStore.get('tf_fx_'+k); if(v!==null) FX[k]=(v==='1')?1:0; } }catch(e){}
function fxOn(n){ return !LOWFX || !!FX[n]; }   // full detail => always on
/* Benchmark hooks: DBG flags gate individual render passes so js/26-bench.js
   can attribute real (GPU-side) cost per pass via differential timing (?bench).
   All default on, so normal play is unchanged. BENCH pauses the auto-tuner. */
let BENCH=false;
const DBG={ground:1, entities:1, particles:1, floats:1, vignette:1};
function resize(){
  const iw = window.innerWidth, ih = window.innerHeight;
  let dispW = iw, dispH = ih, offX = 0, offY = 0;
  if(PERF){
    // Shrink the displayed canvas so the GPU composites far fewer pixels.
    const sc = Math.min(1, PERF_CAP / Math.max(iw, ih));
    dispW = Math.max(1, Math.round(iw*sc));
    dispH = Math.max(1, Math.round(ih*sc));
    offX = Math.round((iw-dispW)/2);
    offY = Math.round((ih-dispH)/2);
  }
  VW = dispW; VH = dispH;                 // logical render size == displayed size
  const base = Math.min(window.devicePixelRatio||1, 2);
  let dpr = base*RQ;
  /* Cap the backing store to a pixel budget so a big high-DPI desktop panel
     (e.g. Surface) isn't asked to fill a canvas several times the size of a
     phone's every frame. Phones stay under budget, so they're unaffected. */
  const BUDGET = 2000000; // ~1080p worth of device pixels
  const px = VW*VH*dpr*dpr;
  if(px > BUDGET) dpr *= Math.sqrt(BUDGET/px);
  DPR = Math.max(0.4, dpr);
  cv.width = Math.round(VW*DPR); cv.height = Math.round(VH*DPR);
  cv.style.width = dispW+'px'; cv.style.height = dispH+'px';
  cv.style.left = offX+'px'; cv.style.top = offY+'px';
  LB.x = offX; LB.y = offY;               // input maps client coords back in
}
window.addEventListener('resize', resize); resize();

const isoX = (x,y)=> (x-y)*(TW/2);
const isoY = (x,y)=> (x+y)*(TH/2);

/* ---------------- game state root ---------------- */
const G = {
  state:'title', time:0, dayT:0.32, dayLen:240,
  map:new Uint8Array(MAPW*MAPH), solid:new Uint8Array(MAPW*MAPH),
  variant:new Uint8Array(MAPW*MAPH),
  nodes:[], npcs:[], mobs:[], projs:[], parts:[], floats:[], decor:[], plots:[],
  cam:{x:0,y:0}, shake:0, killFeedTimer:0,
  hitStop:0, slowmo:0, flash:0, lightning:0,
  clouds:[], foam:[], forgePos:null,
  decals:[], fogs:[], crows:[], critters:[],
  flags:{}, hintShown:{}, fireflies:[],
  paused:false
};
const inb = (x,y)=> x>=0&&y>=0&&x<MAPW&&y<MAPH;
const tileAt = (x,y)=> inb(x,y) ? G.map[y*MAPW+x] : T.DEEP;
const setTile = (x,y,t)=> { if(inb(x,y)){ G.map[y*MAPW+x]=t;
  if(typeof invalidateGround==='function') invalidateGround(); } };
const solidAt = (x,y)=> !inb(x,y) || G.solid[y*MAPW+x]===1;
const setSolid = (x,y,v)=> { if(inb(x,y)) G.solid[y*MAPW+x]=v; };
const walkTile = t => (t>=T.SAND); // sand and above are land

