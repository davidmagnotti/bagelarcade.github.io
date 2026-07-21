"use strict";
/* =====================================================================
   CANVAS BACKEND PROBE  (diagnostic + auto-tune seed)
   -----------------------------------------------------------------------
   There is no web API that says "is this Canvas2D hardware-accelerated?".
   So we measure it. At boot we run a tiny workload that mirrors the game's
   hottest passes - a radial gradient fill, a non-separable ('soft-light')
   full-surface blend, and a fistful of path fills - then force the pipeline
   to flush with a 1px getImageData() readback and time the whole thing.

     * Hardware-backed canvas (iOS/Metal, desktop GPU raster): the work is
       near-instant; per-iteration cost is a fraction of a millisecond.
     * Software raster (Skia CPU / SwiftShader - the likely state on a
       low-VRAM Windows-on-ARM Surface where the browser blocklisted GPU
       canvas): every fill is CPU pixel work; per-iteration cost is several
       milliseconds.

   Results are published on window.GPUINFO (read by the ?perf overlay) and a
   coarse window.SOFTCANVAS boolean (read by the adaptive tuner, js/24-perf.js,
   to concede one quality tier up front instead of waiting to measure live
   frames). Thresholds carry generous headroom so a merely-busy fast machine
   is never mislabelled "software".

   This is a ONE-SHOT measurement at load; it never runs per frame.
   ===================================================================== */
(function(){
  var info = {
    class:'unknown', ms:0, perIter:0, iters:0,
    dpr:(window.devicePixelRatio||1),
    ua:(navigator.userAgent||'')
  };
  try{
    var W=256, H=256, ITER=48;
    var c=document.createElement('canvas'); c.width=W; c.height=H;
    var g=c.getContext('2d',{alpha:false});
    if(!g) throw new Error('no 2d context');

    // Warm up: the first paint allocates the backing store (and, on a GPU
    // canvas, uploads it). Do it, and one readback, OUTSIDE the timed region.
    g.fillStyle='#101418'; g.fillRect(0,0,W,H);
    g.getImageData(0,0,1,1);

    var t0=performance.now();
    for(var i=0;i<ITER;i++){
      // (1) radial gradient disc - like every entity shadow / lamp glow
      var gr=g.createRadialGradient(128,128,12,128,128,124);
      gr.addColorStop(0,'rgba(255,180,80,0.5)');
      gr.addColorStop(1,'rgba(255,180,80,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(128,128,124,0,6.283185); g.fill();
      // (2) non-separable full-surface blend - like the cinematic grade
      g.globalCompositeOperation='soft-light';
      g.fillStyle='rgba(40,60,80,0.5)'; g.fillRect(0,0,W,H);
      g.globalCompositeOperation='source-over';
      // (3) a scatter of path fills - like live-drawn foliage/entities
      for(var k=0;k<40;k++){
        g.fillStyle='rgba(0,0,0,0.06)';
        g.beginPath();
        g.ellipse((i*7+k*13)%W, (i*11+k*17)%H, 9, 4, 0, 0, 6.283185);
        g.fill();
      }
    }
    // Force the whole queued batch to actually rasterize before we stop timing.
    g.getImageData(0,0,1,1);
    var ms=performance.now()-t0;

    info.ms=ms; info.iters=ITER; info.perIter=ms/ITER;
    info.class = info.perIter>3.2 ? 'software-likely'
               : info.perIter>1.2 ? 'marginal'
               : 'hardware-likely';
  }catch(e){
    info.class='probe-failed';
    info.error=(e&&e.message)||String(e);
  }

  window.GPUINFO=info;
  window.SOFTCANVAS=(info.class==='software-likely');

  try{
    console.log('%c[gpu-probe] Canvas2D raster: '+info.class+
      '  ('+(info.perIter||0).toFixed(2)+' ms/iter, '+(info.ms||0).toFixed(1)+
      'ms total over '+info.iters+' iters)  DPR '+info.dpr,
      'color:'+(window.SOFTCANVAS?'#ff9a3c':'#7CFC00')+';font-weight:bold');
    if(window.SOFTCANVAS){
      console.log('%c[gpu-probe] Software-rasterized canvas detected - starting at a '+
        'lower quality tier and disabling read-back post-fx (bloom). '+
        'Try edge://gpu / chrome://gpu to confirm, or append ?safe to force minimal mode.',
        'color:#ff9a3c');
    }
  }catch(e){}
})();
