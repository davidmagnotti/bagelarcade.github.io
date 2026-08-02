# Tidefarer — Art Direction Spec

The visual identity of the 2D game (`/tidefarer/`), extracted from the source so
the 3D build (`/tidefarer3d/`) can be graded to read as the **same world,
authored by the same hand** — not generic cel-shading, not Roblox.

Sources read: `js/03-art.js` (procedural sprites), `js/10-rendering.js`
(world/sky/sea + night light rig), `js/34-atmosphere.js` (day hearth glow +
contact AO), `js/11-main-loop.js` `drawGritGrade` (the cinematic grade),
`js/13-aaa-layer.js` (dynamic light), `styles.css` `:root` (canonical palette).

The touchstones for this look: **Okami** (warm ink), **Wind Waker** (toon + sea,
warm/cool split), **Tunic / A Short Hike** (low-poly that reads as authored).

---

## 1. The canonical palette (hex)

From `styles.css :root` and the `PAL` table in `03-art.js`:

### Ink / parchment (the storybook base)
| token | hex | use |
|---|---|---|
| `--walnut` | `#241a10` | **outlines / ink**, deepest brown |
| `--walnut2` | `#33251a` | frames, secondary ink |
| `--parch` | `#f0e2c0` | warm paper — UI text, base warmth |
| `--parch-dim`| `#c9b990` | dimmer parchment |

### Ember (warm firelight — the warm pole)
| token | hex | use |
|---|---|---|
| `--ember` | `#ff9a3c` | firelight, the signature accent |
| `--ember-dk` | `#c96f1e` | ember shadow |
| gold | `#ffd76a` | windows, lamplight, highlights |
| dawn/dusk warm | `#ff8c3c` / `rgba(255,140,60,·)` | horizon warmth |

### Tideglass (cool sea/shadow — the cool pole)
| token | hex | use |
|---|---|---|
| sea-night top | `#1e4467` | sea/sky backdrop top |
| sea-night mid | `#16283e` | backdrop mid |
| sea-night deep | `#0c1727` | abyss |
| `--mana` | `#5aa7e8` | mana blue, cool accent |
| cool-shadow grade | `#243642` | **the tideglass tint laid over shadows** |

### Nature (matte, muted — never full-saturation)
| token | hex | use |
|---|---|---|
| `--leaf` | `#7fb05b` | grass highlight |
| grass / grassHi | `#5b8544` / `#688f4b` | ground |
| forest | `#3e6030` | tree/forest |
| sand / sand2 | `#c8b482` / `#bda873` | beach |
| deep / shallow | `#1e4066` / `#39708f` | water |
| ruin | `#6f6a63` | stone |
| `--blood` | `#e05648` | blood/danger accent |

**Key observation:** the 2D grass is `#5b8544` (muted olive), not a bright
`#6f9048` Kelly green. Sand is `#c8b482` (dusty), not `#d8c193`. Everything is
knocked back toward parchment. **Full-saturation stock colors are the Roblox
tell — the 2D game has none.**

---

## 2. Outline treatment

The single most important anti-Roblox lever.

- **Color: warm walnut brown, never pure black.** Sprite strokes throughout
  `03-art.js` use `rgba(20,14,8,0.5–0.9)` (≈`#140e08`), `#241a0e`, `#38240f`,
  `#241a10` — a dark *walnut*, warm not neutral. The frame/UI ink is `#241a10`.
- **Rounded joins & caps.** `g.lineJoin='round'`, `g.lineCap='round'` used on
  strokes (tiles, branches, midribs, foam). Nothing is sharp/mitred.
- **Variable weight.** `lineWidth` ranges ~1–3.2px across sprites (thin grain
  lines, fat hull outlines) — the line has hand-inked weight variation, not one
  uniform pixel width.
- Outlines are **omnipresent** — every sprite silhouette carries one.

**3D translation:** inverted-hull outline, color exactly `#241a10`, weight that
varies a touch by prop scale (big forms get a heavier hull), on every mesh that
reads as a drawn object.

---

## 3. Lighting mood — the ember/tideglass warm/cool split

The whole world is **warm firelight set against cool sea/shadow.** Lit surfaces
skew warm; shadows skew blue; **nothing is neutral grey.**

### Warm (light) side
- Night lamp halos: `rgba(255,184,86)` → `rgba(255,150,66)` additive (`10-rendering.js`).
- **Day hearth glow (`34-atmosphere.js`):** every house/forge casts a warm
  ground pool even at noon — `rgba(255,196,110)` core → `rgba(255,166,84)` →
  `rgba(255,150,60,0)`, with a brighter window spill `rgba(255,210,130)`. The
  **forge burns hottest of all** (`[58, 0.075, 0.06]` — glows at noon). The
  world leans hard on hearth glow; reproduce it.
- Dawn/dusk wash: `rgba(255,140,60,·)` full-screen.

### Cool (shadow) side — the grade
`drawGritGrade` (`11-main-loop.js`) is the whole look in two blends:
1. **Cool the shadows:** `soft-light` fill of `#243642` (tideglass blue-grey) at
   **alpha 0.35** over the whole frame. This is what tips shadows blue.
2. **Film grain:** `overlay` at **alpha 0.07**, a 192px noise tile, jittered per
   frame.
Plus a **vignette** — `rgba(0,0,0,0.45)` radial (`10-rendering.js`).

### Contact / grounding
- **Contact AO:** a tight dark walnut core in the crease where a wall meets the
  ground, nestling buildings into terrain.
- Cast/contact shadows are **warm walnut** — `rgba(20,14,8,·)`, never black.

**3D translation:** one **low, warm golden key** (firelight angle, `#ffe1b0`-ish)
+ a **cool tideglass ambient/hemi fill** (`#5aa7e8`-leaning sky). Toon self-shade
band tinted tideglass-blue; ground cast shadows tinted warm walnut `#241a10`.
Grade the composite: tideglass soft-light on shadows, warm parchment lift, low
saturation, vignette, grain, and a faint paper texture.

---

## 4. Register

**Parchment storybook.** Matte, hand-drawn, painterly — nothing glossy. A warm
diorama viewed from a fixed-ish, slightly telephoto 3/4 iso angle (the 2D game
is isometric); the camera should preserve that diorama/storybook feel rather
than free-orbit. Warm hearths everywhere; cool sea around the edges; a walnut
ink line on everything. Cozy, lamp-lit, a little melancholy at dusk.

---

## 5. Build checklist (levers, in order of impact)

1. **Ink outlines** — walnut `#241a10`, variable weight, rounded feel. *Most work.*
2. **Toon ramp with a cool shadow** — 2–3 band ramp; lit band warm, shadow band
   tideglass-blue, not grey/black.
3. **Lock the palette** — clamp materials to the hex set above; kill full-sat
   stock colors; grade toward warm parchment.
4. **Committed lighting** — one low warm key + cool blue fill; real cast shadows,
   warm-brown, never black.
5. **Matte materials** — roughness up / metalness+specular to zero (MeshToon is
   already matte); add a faint paper/canvas texture overlay.
6. **Post + framing** — vignette, bloom limited to ember sources (lanterns, the
   forge glow), film grain, gentle DoF; fixed-ish telephoto 3/4 camera.
