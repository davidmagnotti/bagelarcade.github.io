/* =====================================================================
   GPU COST ATTRIBUTION  -  tidefarer/?bench
   Differential benchmark: forces full detail, then disables one render pass
   at a time for a few seconds and measures the real end-to-end frame time.
   Because the cost is GPU-side (draw calls only queue in JS), timing functions
   directly can't see it - but turning a pass OFF and watching the frame rate
   change does. Prints a ranked "most expensive -> least" table.

   The first row, "ALL rendering", is a control: if disabling it barely helps,
   the cost is the canvas present itself (only a smaller canvas helps); if it
   helps hugely, it's the drawing and the per-pass rows say which part.
   ===================================================================== */
(function(){
'use strict';
try{ if((location.search||'').toLowerCase().indexOf('bench')<0) return; }catch(e){ return; }
if(typeof frame!=='function' || typeof render!=='function') return;

// Stop the auto-tuner so conditions stay steady, but DON'T force a mode:
// - plain ?bench            -> measures full detail
// - ?bench together w/ ?lowgfx -> measures low-gfx (what you actually play)
// (?lowgfx is applied by 27-perfmode, which loads after this file.)
BENCH=true;
if((location.search||'').toLowerCase().indexOf('lowgfx')<0){ SAFE=false; LOWFX=false; RQ=1; }
if(typeof resize==='function') resize();

const toggles=[];
// Control: disable ALL rendering.
(function(){
  const f=window.render; let en=true;
  window.render=function(){ return en? f.apply(this,arguments):undefined; };
  toggles.push({name:'ALL rendering (control)', off:()=>{en=false;}, on:()=>{en=true;}});
})();
// Inline passes gated by DBG flags.
[['ground','ground tiles'],['entities','entities/sprites'],['particles','particles'],
 ['floats','floating text'],['vignette','vignette']].forEach(([k,label])=>{
  toggles.push({name:label, off:()=>{DBG[k]=0;}, on:()=>{DBG[k]=1;}});
});
// Global function passes.
function gateFn(name,label){
  const f=window[name]; if(typeof f!=='function') return;
  let en=true; window[name]=function(){ return en? f.apply(this,arguments):undefined; };
  toggles.push({name:label, off:()=>{en=false;}, on:()=>{en=true;}});
}
gateFn('drawFoam','foam'); gateFn('drawDecals','decals'); gateFn('drawFog','ground fog');
gateFn('drawCrows','crows'); gateFn('drawGulls','gulls'); gateFn('drawGritGrade','cinematic grade');
gateFn('drawMinimap','minimap'); gateFn('drawLighting','dynamic lighting');
function gateMethod(obj,key,label){
  if(!obj||typeof obj[key]!=='function') return;
  const f=obj[key]; let en=true; obj[key]=function(){ return en? f.apply(this,arguments):undefined; };
  toggles.push({name:label, off:()=>{en=false;}, on:()=>{en=true;}});
}
if(typeof WX==='object'){ gateMethod(WX,'drawRain','rain'); gateMethod(WX,'drawCloudShadows','cloud shadows'); }

const WINDOW_MS=3000;
const median=a=>{ if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y); return s[(s.length>>1)]; };
const allOn=()=>toggles.forEach(t=>t.on());
function apply(i){ allOn(); if(i>=0) toggles[i].off(); }

const box=document.createElement('div');
box.style.cssText='position:fixed;top:6px;left:6px;z-index:99999;font:12px/1.35 monospace;'+
  'white-space:pre;color:#7CFC00;background:rgba(0,0,0,.82);padding:8px 11px;border-radius:6px;'+
  'pointer-events:none;text-shadow:0 1px 2px #000;max-width:96vw;';
document.body.appendChild(box);

let phase=-1, baseline=0, samples=[], winStart=0, prevTs=0;
const results=[];
apply(-1); // baseline: everything on

const _frame=frame;
frame=function(ts){
  _frame(ts);
  if(prevTs){ const dt=ts-prevTs; if(dt>0&&dt<4000) samples.push(dt); }
  prevTs=ts;
  if(!winStart) winStart=ts;

  const label = phase<0? 'baseline (all passes on)' : ('OFF: '+toggles[phase].name);
  box.textContent='BUILD '+(typeof BUILD!=='undefined'?BUILD:'?')+
    (typeof LOWFX!=='undefined'&&LOWFX?'  [low-gfx]':'  [full detail]')+'\n'+
    'BENCHMARKING…  '+(phase+2)+' / '+(toggles.length+1)+'\n'+
    label+'\nkeep this window focused; ~'+Math.ceil((toggles.length+1)*WINDOW_MS/1000)+'s total';

  if(ts-winStart>=WINDOW_MS){
    const use=samples.slice(2);               // drop warmup frames
    const med=median(use.length?use:samples);
    if(phase<0) baseline=med;
    else results.push({name:toggles[phase].name, ms:med, fps:med?1000/med:0,
                       save: med? baseline-med : 0});
    phase++;
    if(phase>=toggles.length){ finish(); return; }
    apply(phase); samples=[]; winStart=ts;
  }
};

function finish(){
  allOn();
  results.sort((a,b)=>b.save-a.save);
  const bfps=baseline?1000/baseline:0;
  let s='BUILD '+(typeof BUILD!=='undefined'?BUILD:'?')+
        (typeof LOWFX!=='undefined'&&LOWFX?'  [low-gfx]':'  [full detail]')+'\n'+
        'BENCHMARK COMPLETE  (most expensive first)\n'+
        'baseline '+baseline.toFixed(0)+'ms/frame = '+bfps.toFixed(1)+' FPS\n'+
        'disabling → frametime / fps / time saved\n';
  for(const r of results)
    s+='  '+r.ms.toFixed(0).padStart(4)+'ms  '+r.fps.toFixed(1).padStart(5)+'fps  -'+
       r.save.toFixed(0).padStart(4)+'ms  '+r.name+'\n';
  s+='(copy this whole block from the console: [bench])';
  box.textContent=s;
  try{ console.log('[bench]\n'+s); }catch(e){}
}
})();
