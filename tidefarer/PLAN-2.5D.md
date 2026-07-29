# Tidefarer → 2.5D (locked-camera WebGL) — Migration Plan

**Goal:** Replace the Canvas 2D renderer with a GPU (WebGL) renderer while keeping
the camera locked at the current fixed dimetric angle. Controls, UI, and gameplay
stay **identical**. The existing procedural art code is reused as-is to bake GPU
textures — no hand-authored assets, no new art.

**Non-goals (this plan):** camera rotation/tilt/zoom, real terrain elevation, mesh
models. The data is laid out so those become possible later, but none ship here.

---

## 1. Guiding principles

1. **Pixel-identity is the acceptance test.** Phase 1–2 target a frame that is a
   pixel-for-pixel (or near-imperceptible) match of the current 2D output. We keep
   an A/B feature flag so the 2D and WebGL renderers can be diffed side by side.
2. **Keep the projection math exactly as-is.** Because the camera is locked, we do
   **not** need a "real" tilted 3D camera. We drive a WebGL **orthographic camera in
   screen-pixel space** and place every quad using the existing `isoX/isoY`
   (`01-core.js:188`). The GPU is used for *batching, a depth buffer, and shader
   lighting* — not for a new projection. Consequence: **`screenToWorld` /
   `worldToScreen` need zero changes**, so click-to-move, WASD, joystick, gamepad,
   and combat aim are literally untouched.
3. **The art code doesn't move.** Every `makeCanvas(...)` / `drawXxx(...)` routine in
   `03-art.js` keeps drawing to an offscreen 2D canvas. Those canvases become GPU
   textures. Bake-time weathering (`weatherAll`, `11-main-loop.js:9`) also stays.
4. **UI is DOM and stays DOM.** The HUD, panels, hotbar, dialog, pause menu, and
   touch joystick (`index.html`, `styles.css`) sit *over* the canvas and are not
   touched. "Identical UI" is guaranteed by not editing those files.
5. **Ship incrementally behind a flag.** Every phase is independently runnable and
   revertible; the 2D path stays alive until the WebGL path is proven.

---

## 2. Target architecture

```
                 ┌─────────────────────────────────────────┐
   gameplay/     │  main loop (11-main-loop.js)  UNCHANGED   │
   input/state   │  calls render() / renderInterior()        │
                 └───────────────┬──────────────────────────┘
                                 │  (same entry points)
                 ┌───────────────▼──────────────────────────┐
                 │  Renderer facade  (new: js/33-gl-*.js)     │
                 │  render()/renderInterior() rewritten to    │
                 │  BUILD/UPDATE a scene instead of 2D draws  │
                 └───┬───────────────┬───────────────┬───────┘
                     │               │               │
          ┌──────────▼───┐  ┌────────▼────────┐  ┌───▼────────────────┐
          │ WebGL canvas │  │ Texture atlas   │  │ World-text overlay │
          │ (#glgame)    │  │ (baked from     │  │ (thin 2D canvas    │
          │ ortho cam,   │  │ 03-art.js SPR)  │  │ for floats/labels) │
          │ depth buffer │  └─────────────────┘  └────────────────────┘
          └──────────────┘
```

- **Engine:** Three.js (WebGL2), vendored as a single local `js/lib/three.min.js`
  with a `?v=` cache-bust, matching the project's zero-build, script-tag ethos.
  (Raw WebGL2 is a viable alternative to avoid the dependency, at the cost of
  writing our own batching/atlas/camera plumbing. Recommendation: Three.js first;
  it pays for itself in Phases 2–4.)
- **Camera:** `THREE.OrthographicCamera` configured 1:1 with screen pixels and DPR,
  so a quad placed at `(isoX(x,y)-cam.x, isoY(x,y)-cam.y)` lands on the exact pixel
  it does today. Depth (`z`) is set from the world depth key `x+y` so the hardware
  depth buffer reproduces the current painter's-sort ordering — and removes the
  tall-sprite overlap hacks for free.
- **Static geometry** (ground tiles, static scenery/decor) → merged/instanced quads
  with atlas UVs, rebuilt only on change. This deletes `groundCache`,
  `sceneryCache`, the per-tile fringe passes, and the `LOWFX` tile path
  (`10-rendering.js:16–86,115–170`).
- **Live sprites** (player, NPCs, mobs, and every animated `DYNAMIC_DECOR` kind) →
  one uniform path: each keeps drawing to a small per-object 2D canvas via the
  existing routines; that canvas is uploaded as a `CanvasTexture` on the frames it
  changes. Bounded by on-screen count.
- **Effects** (particles, foam, decals, fireflies, birds, water) → instanced quads
  / additive blending / a small water shader.
- **Lighting + post-FX** → shader passes (light accumulation + fullscreen grade,
  grain, vignette, flashes), replacing the separate lighting canvas and its
  `destination-out` punch-through (`13-aaa-layer.js:1156`).
- **World-space text** (damage floats, gold pickups, "COMBO x2") → a thin
  transparent 2D overlay canvas on top of the WebGL canvas, drawn with the
  unchanged `worldToScreen`. Avoids GPU text/SDF entirely.
- **Minimap and all cutscenes** stay on their own 2D canvases, unchanged
  (`10-rendering.js:3316`, `13-aaa-layer.js`, `32-cinematic.js`). They are
  camera-locked, low-frequency, and independent of the world renderer.

---

## 3. The seam (what actually changes vs. what doesn't)

| Code | Disposition |
|---|---|
| `03-art.js` (all `makeCanvas`/`drawXxx`, `buildTiles`, `buildSprites`, `drawHumanoid`) | **Unchanged.** Becomes the texture/atlas source and the live-sprite drawer. |
| `weatherAll` (`11-main-loop.js:9`) | **Unchanged.** Bake-time post-process on source canvases. |
| `10-rendering.js` `render()` (~300 lines, 12+ passes) | **Rewritten** to build/update the WebGL scene. Same function name + entry point. |
| `15-interiors.js` `renderInterior()` | **Rewritten** the same way (same iso math, `w2s` at `:882`). |
| Live humanoid draw calls in `09-gameplay.js` / `03-art.js` | **Redirected** to per-entity canvas → texture. Drawing code unchanged. |
| `worldToScreen`/`screenToWorld` (`10-rendering.js:4`) | **Unchanged** (ortho camera calibrated to match). |
| `01-core.js:134` `cx = getContext('2d')` | **Kept** for overlay/minimap/cutscenes; a new `gl` context is added alongside. |
| Input (`07-input.js`), movement/combat/collision (`09-gameplay.js`), worldgen (`02`), data (`04`) | **Unchanged.** All already world-space. |
| `index.html` UI, `styles.css` | **Unchanged.** Guarantees identical UI. |
| Cutscenes (`13-aaa-layer.js`, `32-cinematic.js`), minimap | **Unchanged** (stay 2D). Optional later port. |
| Adaptive-perf/LOWFX system (`01-core.js:136`, ground/scenery caches) | **Deleted/retuned** in the final phase once GPU handles fill-rate. |

---

## 4. Coordinate & depth mapping (precise)

- Screen position of any object at world `(x,y)`: unchanged —
  `sx = isoX(x,y) - G.cam.x`, `sy = isoY(x,y) - G.cam.y`.
- Quad placement: ortho camera in pixel space, quad centered at `(sx, sy)` with the
  sprite's existing pivot offsets (the current `-TW/2, -TH/2` and per-sprite
  `s.y-96` etc. carry over verbatim as quad anchor offsets).
- Depth: `z = f(x + y)` (plus small per-layer biases for the existing special cases:
  flat floor plates at `d = -9990`, `10-rendering.js:196`). Larger `x+y` = nearer =
  wins the depth test. This reproduces the current sort (`10-rendering.js:188`).
- Ground vs. entities vs. overlays keep their current pass ordering via depth ranges
  (ground furthest, overlays via a separate always-on-top pass / the 2D overlay).

---

## 5. Phased delivery

Each phase is behind `RENDERER = 'gl' | '2d'` (default `'2d'` until Phase 4 lands).

### Phase 0 — Scaffolding & proof (small)
- Vendor `three.min.js`; add `#glgame` canvas layered under `#hud`, matching size/DPR.
- New module `js/33-gl-core.js`: WebGL renderer, ortho camera calibrated to
  `isoX/isoY`, atlas allocator, a `RENDERER` flag, and a resize/DPR path mirroring
  the current one (`VW/VH/DPR`, letterbox `LB`).
- **Milestone:** render one tile and one billboard through WebGL at the exact pixel
  position of the 2D version. Establish the pixel-diff harness (screenshot A vs B).

### Phase 1 — Ground & static scenery (medium)
- Bake `TILE_SPR`, `FRINGE`, and static `SPR.*` into a texture atlas at boot.
- Build the ground as instanced/merged quads with atlas UVs; rebuild on tile change
  (`invalidateGround` becomes "mark mesh dirty"). Fold fringe blends into a second
  UV layer or overlay quads.
- Bake static (`!DYNAMIC_DECOR`) scenery into the same batched pass.
- **Milestone:** overworld ground+scenery pixel-matches 2D; `groundCache`/
  `sceneryCache`/`LOWFX` tile path become dead code (removed in Phase 8).

### Phase 2 — Entities & the live-sprite path (medium/large — highest risk)
- Billboard pass for `nodes/npcs/mobs/player/decor/projs`, depth from `x+y`, no CPU
  sort.
- **Live-sprite system:** any object whose art animates (the humanoid; all
  `DYNAMIC_DECOR` kinds — lava, gates, glowing runes, etc.) draws to a small
  per-object 2D canvas each frame via the *existing* routines and uploads a
  `CanvasTexture`. Static kinds use atlas UVs. Cache humanoid textures by appearance
  where static; cap live uploads by on-screen count.
- **Milestone:** a full overworld scene with moving actors pixel-matches 2D; the
  painter's-sort and tall-sprite hacks are gone.

### Phase 3 — Effects (medium)
- Particles/foam/decals/fireflies as instanced quads (additive where the 2D code
  uses `'lighter'`); birds as instanced quads/line segments.
- Water sheen/caustics/sparkle move to a small time-driven shader (or animated
  overlay quads to start).
- **Milestone:** effects match; per-water-tile path-op cost is gone.

### Phase 4 — Lighting & post-FX (medium) — **first shippable overworld build**
- Light accumulation pass (lamps/houses/forge/tower glows + night darkening),
  replacing the lighting canvas + `destination-out` composite.
- Fullscreen post: cinematic grade, film grain, vignette, dawn/dusk warmth, rain,
  lightning/red-damage flash, low-HP vignette, chest-progress ring.
- **Milestone:** overworld is fully on WebGL and shippable; flag can default to `gl`.

### Phase 5 — Interiors (medium)
- Port `renderInterior()` (same iso `w2s`, AABB furniture, resort/lair/palace
  variants) to the WebGL path. Interior collision/logic unchanged.
- **Milestone:** all interiors + the ~19 overworlds render on WebGL.

### Phase 6 — World-text overlay (small)
- Thin 2D overlay canvas for damage floats, gold numbers, banners tied to world
  positions, using unchanged `worldToScreen`.
- **Milestone:** all in-world text back, no GPU text needed.

### Phase 7 — Cutscenes (optional, deferrable)
- `13-aaa-layer.js`/`32-cinematic.js` can stay 2D indefinitely. Port only if we want
  unified lighting/perf there.

### Phase 8 — Cleanup & cross-device (medium)
- Delete dead 2D machinery (ground/scenery caches, fringe passes, `LOWFX` tile
  path). Retune the adaptive-quality system for GPU (fewer knobs needed).
- Test across the weak devices the old `LOWFX` targeted; confirm the fill-rate wins.

---

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Blend-mode fidelity (`lighter`, `source-atop`, `destination-out`) | `source-atop` is bake-time (unchanged); `lighter`→additive quads; `destination-out` lighting→accumulation pass. All standard. |
| Many live-canvas uploads (animated decor + actors) | Bounded by on-screen count; cache static appearances; cap and profile in Phase 2. |
| Draw-call overhead negating the perf win | Enforce atlas + instancing/merging from Phase 1; that's where the speedup lives, not the port itself. |
| Subtle pixel drift from GPU sampling/AA | Nearest-filtering + integer pixel snap to match 2D; pixel-diff harness gates each phase. |
| Dependency in a zero-build static site | Single vendored `three.min.js`, `?v=` bust, no toolchain. Raw-WebGL2 fallback documented. |
| Scope creep into "real 3D" | Locked camera + billboards enforced; elevation/tilt explicitly out of scope. |

---

## 7. Effort & sequencing

- **Bulk of risk:** Phases 0–2 (camera calibration, atlas, the live-sprite path).
- **First shippable overworld:** end of Phase 4.
- **Full parity (interiors + text):** end of Phase 6.
- Realistically a multi-week effort for one engineer; each phase is a reviewable PR
  behind the flag, so it can land gradually with the 2D path as a safety net.

## 8. Acceptance criteria

1. **Controls identical** — no changes to `07-input.js` or the movement/combat/
   collision code; `screenToWorld` unchanged.
2. **UI identical** — no changes to `index.html` UI markup or `styles.css`.
3. **Visuals** — pixel-diff harness shows no perceptible difference on a canonical
   set of overworld/interior frames.
4. **Performance** — equal or better frame time on the current `LOWFX` target
   devices, with the 2D perf-workaround machinery removed.
