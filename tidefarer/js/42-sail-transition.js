/* ============================================================================
   42-sail-transition.js  -  the "sailing between isles" loading screen
   ----------------------------------------------------------------------------
   A brief (~1.6s) painted vignette that plays over every sea voyage: a little
   boat rides a dusk-lit swell toward the horizon while the world quietly swaps
   underneath the cover of the overlay. Replaces the old plain fade-to-black in
   sailTo()/departEarly() (see js/12-world-layer.js), which now call
   playSailTransition() when this module is present and fall back to the fade if
   it ever isn't.

   Contract:
     playSailTransition(title, onSwitch, onDone)
       title    - display name of the destination (WORLD_DEFS[id].title), or ''
       onSwitch - called ONCE, while the overlay is fully opaque, to switch world
       onDone   - called after the overlay has faded back out (unlock sailing)
   ============================================================================ */
(function(){
  'use strict';

  // Timeline (ms). Kept inside the 1-2s the brief asked for.
  const FADE_IN   = 320;   // overlay wipes up to fully opaque
  const SWITCH_AT = 540;   // world swap - safely after we're opaque, hidden
  const FADE_OUT  = 340;   // overlay wipes back to reveal the new isle
  const TOTAL     = 1600;  // whole voyage, start to hidden

  const reduced = (function(){
    try{ return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch(_){ return false; }
  })();

  let running = false;

  function playSailTransition(title, onSwitch, onDone){
    const ov  = document.getElementById('sailOv');
    const cv  = document.getElementById('sailCv');
    const cap = document.getElementById('sailCap');
    // No overlay in the DOM -> let the caller keep its fallback fade.
    if(!ov || !cv || !cv.getContext){ if(onSwitch) onSwitch(); if(onDone) onDone(); return false; }
    // Re-entrancy guard mirrors the `sailing` latch in world-layer, but be safe.
    if(running){ if(onSwitch) onSwitch(); if(onDone) onDone(); return true; }
    running = true;

    const ctx = cv.getContext('2d', {alpha:false});
    // Back the canvas at device resolution (capped) for crisp edges, but draw in
    // CSS pixels so the scene math stays simple.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    function resize(){
      W = window.innerWidth; H = window.innerHeight;
      cv.width  = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    if(cap) cap.textContent = title ? ('Sailing to ' + niceCase(title)) : 'Sailing…';

    // Prime the first frame BEFORE showing, so nothing flashes empty.
    draw(0);
    ov.style.opacity = '0';
    ov.style.display = 'block';

    const start = performance.now();
    let switched = false;

    // The fade is driven per-frame here (not via a CSS transition): a CSS
    // transition starts on the compositor's schedule, which can lag when the
    // page has been idle, and we must be certain the overlay is fully opaque
    // before the world swaps. Frame-driven opacity makes the hide deterministic.
    function tick(now){
      const el = now - start;               // elapsed ms
      draw(el / 1000);                       // animation runs on seconds

      let op;
      if(el < FADE_IN)              op = el / FADE_IN;                 // wipe in
      else if(el > TOTAL - FADE_OUT) op = Math.max(0, (TOTAL - el) / FADE_OUT); // wipe out
      else                          op = 1;                            // full cover
      ov.style.opacity = op.toFixed(3);

      // Swap only once we are certainly opaque (el >= FADE_IN guarantees op===1).
      if(!switched && el >= SWITCH_AT){ switched = true; try{ onSwitch && onSwitch(); }catch(_){} }

      if(el < TOTAL){ requestAnimationFrame(tick); }
      else { finish(); }
    }
    requestAnimationFrame(tick);

    function finish(){
      ov.style.display = 'none';
      ov.style.opacity = '0';
      window.removeEventListener('resize', resize);
      running = false;
      try{ onDone && onDone(); }catch(_){}
    }

    /* ---------------- the painted scene ---------------- */
    function draw(t){
      const horizon = H * 0.54;
      const cx = W * 0.5;

      // --- sky: deep dusk overhead warming to an ember horizon ---
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0,   '#0b1526');
      sky.addColorStop(0.55,'#182a44');
      sky.addColorStop(0.85,'#6b4a2a');
      sky.addColorStop(1,   '#d98b3c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, horizon);

      // --- the low sun: a soft ember disc the boat sails toward ---
      const sunY = horizon - H * 0.015, sunR = Math.max(46, H * 0.085);
      const glow = ctx.createRadialGradient(cx, sunY, 0, cx, sunY, sunR * 3.2);
      glow.addColorStop(0,   'rgba(255,214,138,0.95)');
      glow.addColorStop(0.18,'rgba(255,154,60,0.85)');
      glow.addColorStop(0.5, 'rgba(201,111,30,0.28)');
      glow.addColorStop(1,   'rgba(201,111,30,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, sunY, sunR * 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffdca0';
      ctx.beginPath(); ctx.arc(cx, sunY, sunR, 0, Math.PI * 2); ctx.fill();

      // --- sea ---
      const sea = ctx.createLinearGradient(0, horizon, 0, H);
      sea.addColorStop(0, '#274a63');
      sea.addColorStop(0.4,'#1c3550');
      sea.addColorStop(1, '#0c1a2c');
      ctx.fillStyle = sea;
      ctx.fillRect(0, horizon, W, H - horizon);

      // shimmering ember path from the sun down toward the viewer
      const shimmer = reduced ? 0 : t;
      for(let i = 0; i < 22; i++){
        const p  = i / 22;
        const y  = horizon + p * (H - horizon);
        const w  = (0.03 + p * 0.16) * W;                       // path widens toward us
        const wob = Math.sin(t * 2.2 + i * 0.8) * (2 + p * 10) * (reduced ? 0.2 : 1);
        const a  = (0.26 - p * 0.22) * (0.7 + 0.3 * Math.sin(shimmer * 6 + i));
        if(a <= 0) continue;
        ctx.fillStyle = 'rgba(255,178,96,' + a.toFixed(3) + ')';
        ctx.fillRect(cx - w / 2 + wob, y, w, Math.max(1.5, p * 4));
      }

      // rolling wave highlight lines for depth
      ctx.lineWidth = 1.5;
      for(let i = 0; i < 7; i++){
        const p  = (i + 1) / 8;
        const y  = horizon + p * (H - horizon) * 0.98;
        const amp = (1.5 + p * 6) * (reduced ? 0.15 : 1);
        const spd = 0.6 + p * 0.9;
        const off = (reduced ? 0 : t * spd * 40 + i * 30);
        ctx.strokeStyle = 'rgba(150,196,224,' + (0.10 + p * 0.12).toFixed(3) + ')';
        ctx.beginPath();
        for(let x = -20; x <= W + 20; x += 12){
          const yy = y + Math.sin((x + off) * 0.035 + i) * amp;
          if(x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }

      // --- the boat, riding the swell toward the sun ---
      const bob  = reduced ? 0 : Math.sin(t * 2.4) * 5;
      const rock = reduced ? 0 : Math.sin(t * 1.9 + 0.6) * 0.05;   // radians
      const drift= reduced ? 0 : Math.sin(t * 0.7) * 8;            // gentle side sway
      const bx = cx + drift, by = horizon + H * 0.055 + bob;
      const scale = Math.max(1, H / 620);

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(rock);
      ctx.scale(scale, scale);
      drawBoat(ctx, t);
      ctx.restore();

      // bow wake / foam just under the hull
      if(!reduced){
        ctx.fillStyle = 'rgba(230,240,246,0.5)';
        for(let i = 0; i < 3; i++){
          const ph = (t * 1.6 + i * 0.33) % 1;
          const fw = (34 + ph * 46) * scale;
          const fy = by + (10 + ph * 10) * scale;
          const fa = 0.45 * (1 - ph);
          ctx.fillStyle = 'rgba(230,240,246,' + fa.toFixed(3) + ')';
          ctx.beginPath();
          ctx.ellipse(bx, fy, fw, 3 * scale, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // a soft vignette to seat the scene
      const vig = ctx.createRadialGradient(cx, H * 0.5, H * 0.3, cx, H * 0.5, H * 0.8);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }

    // Boat drawn around its own origin (waterline at y=0), silhouetted against
    // the sun with a warm rim of light on the sail and gunwale.
    function drawBoat(g, t){
      // sail flutters just slightly
      const flut = reduced ? 0 : Math.sin(t * 4) * 1.2;

      // mast
      g.strokeStyle = '#1a120a'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 2); g.lineTo(0, -46); g.stroke();

      // sail (a warm-lit triangle billowing toward the sun)
      g.beginPath();
      g.moveTo(2, -44);
      g.quadraticCurveTo(30 + flut, -30, 26 + flut, -6);
      g.lineTo(2, -6);
      g.closePath();
      const sg = g.createLinearGradient(2, -44, 28, -6);
      sg.addColorStop(0, '#f4ead0');
      sg.addColorStop(1, '#caa06a');
      g.fillStyle = sg; g.fill();
      // shaded back sail
      g.beginPath();
      g.moveTo(-2, -44);
      g.quadraticCurveTo(-20 + flut, -28, -18 + flut, -8);
      g.lineTo(-2, -8);
      g.closePath();
      g.fillStyle = '#8a6a44'; g.fill();

      // pennant at the masthead
      g.fillStyle = '#e05648';
      g.beginPath();
      g.moveTo(0, -46);
      g.lineTo(14 + flut * 2, -43);
      g.lineTo(0, -40);
      g.closePath(); g.fill();

      // hull - dark walnut silhouette with a lit top edge
      g.beginPath();
      g.moveTo(-34, -6);
      g.lineTo(34, -6);
      g.quadraticCurveTo(26, 12, 0, 13);
      g.quadraticCurveTo(-26, 12, -34, -6);
      g.closePath();
      const hg = g.createLinearGradient(0, -6, 0, 13);
      hg.addColorStop(0, '#3a2817');
      hg.addColorStop(1, '#1a120a');
      g.fillStyle = hg; g.fill();
      // ember rim light on the gunwale
      g.strokeStyle = 'rgba(255,154,60,0.85)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-34, -6); g.lineTo(34, -6); g.stroke();
    }
    return true;
  }

  // "EMBERWICK ISLE" -> "Emberwick Isle" for the caption line.
  function niceCase(s){
    return String(s).toLowerCase().replace(/\b([a-z])/g, function(m, c){ return c.toUpperCase(); });
  }

  window.playSailTransition = playSailTransition;
})();
