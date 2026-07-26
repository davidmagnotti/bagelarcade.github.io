# Tidefarer — Dungeon Analysis & Extension Plan

Working design notes (like `STORY.md`, this is reference, not shipped code).
Covers all **8 dungeons**, an estimate of how hard each is to *solve*, how long
each currently runs, and a concrete path to push each toward **~60 minutes** of
content — reusing systems already in the codebase wherever possible.

Combat baseline used for the estimates: player starts at 100 HP, gains **+6
HP/level** (`gainLXP`), and deals roughly **38–57 melee dmg** mid-game
(`meleeDmg`: `6 + swordTier*4 + meleeLvl*2 + charms`). Big bosses (maxhp ≥ 300)
take **+30% player damage** but their 900–1150 HP pools still mean long fights.
A dodge roll grants brief i-frames (`P.rollT`) that pass through most hazards.

---

## Summary table

| # | Dungeon (`worldId`) | Zones | Lv band | Boss (HP) | Solve difficulty | Now | Bottleneck to fix |
|---|---|---|---|---|---|---|---|
| 1 | The Emberdeep (`eastdeep`) | 5 + vault | 6–9 | Ashwing (680) | **6/10** platforming | ~10–15 min | Puzzle handlers coded but unwired |
| 2 | The Rimefissure (`frostdeep`) | 3 (+fork) | 13–15 | The Rimebound (1120) | **6/10** boss wall | ~8–12 min | Trivial puzzle layer; flame-relay never built |
| 3 | The Underclimb (`aeriedeep`) | 4 | 12–14 | Tome-Warden (920) | **6/10** timing+sponge | ~10–15 min | Two identical mazes; boss is one HP sponge |
| 4 | The Glacier Vault (`frostvault`) | 5 | 14–16 | (elite bear packs) | **7/10** wave combat | ~15–20 min | Lever puzzle coded but **no levers placed** |
| 5 | The Drowned Catacomb (`reachdeep`) | 3 | 12–14 | Drowned Minotaur (900) | **6/10** trap timing | ~8–12 min | "3 bone-locks" shipped as 2 levers + auto-gate |
| 6 | The Undermill (`milldeep`) | 3 | fixed | The Cog-Bound (480) | **4/10** puzzle-light | ~8–14 min | Content-rich but short; no trash mobs |
| 7 | The Undermaw (`undermaw`) | 3 | 11–13 | The Maw-Stalker (520) | **5/10** pure fight | ~3–6 min | **Shortest** — walk in, one fight, walk out |
| 8 | The Rainbow Road (`skydungeon`) | 7 isles | 9–13 | The Storm-Eye (~440 eff.) | **7/10** execution | ~15–22 min | Richest already; latent prism puzzle unused |

**Total today ≈ 95 minutes across 8 dungeons.** Target is 8 × 60 = 480 min, so
this is a real content lift — but four of the eight already contain
**fully-written but dormant puzzle code** that is the cheapest way to add depth.

---

## Cross-cutting findings

1. **Every dungeon is a strictly linear single-map spine.** Rooms stack S→N,
   each sealed by a gate that opens when you clear that room's challenge. No
   branching, no backtracking, no optional wings (except Emberdeep's one vault).
   *Branching the spines is the single biggest structural lever for length.*

2. **Difficulty is bimodal — skill gate OR gear gate, rarely both at once.**
   - *Skill-gate* dungeons (Emberdeep, Rainbow Road, Catacomb) test timing
     (rotating slabs, fading bridges, swinging axes). Puzzles are forgiving:
     a miss costs 4–5 HP and an instant retry, so they gate *patience*, not runs.
   - *Gear-gate* dungeons (Rimefissure, Underclimb) are a single high-HP boss
     with a trivial puzzle layer around it. The wall is the boss's HP pool.
   - The Glacier Vault is the outlier: sustained multi-target **wave combat**
     (560-HP / 46-dmg polar bears, up to 3 elites at once) on slick ice.

3. **There is a surprising amount of dead / latent puzzle content.** These are
   the highest-payoff, lowest-effort extensions because the systems already run:
   - **Emberdeep**: `stepEmberPlate` / `pullEmberLever` / `pressEmberButton`
     (visit-all-plate, timed-lever, button-order puzzles) are fully written but
     **not wired** — the shipped rooms use dash-across-pit crossings instead.
   - **Glacier Vault**: `pullVaultLever` (pull-all-three-wards, with `n/N`
     progress toasts) is complete, but **no `icelever` objects are placed** — the
     labeled "Three Wards" room is empty; gates open purely by clearing waves.
   - **Rainbow Road**: the **Prism-Ward beam puzzle** (`skyBeamTrace` /
     `rotateSkyPrism` — reflect a beam through `/` `\` prisms to a crystal) is
     fully coded but the rune-tile puzzle is what's actually wired to gate `g2`.
   - **Rimefissure**: the block comment describes a **flame-relay torch puzzle**
     (carry fire north, relight at braziers, cold saps the flame) that was
     never implemented — the room it belongs in is under-used.
   - **Drowned Catacomb**: zone comment says "three bone-locks"; shipped as two
     path-side levers + a final auto-opening gate.

4. **Reusable systems already in the engine** (use these for new content, no new
   tech required): the **wave spawner** (`startVaultWave` / `_vaultRoom` clear
   check), **boss HP-threshold phases** (summon/enrage logic already keys off
   `hp/maxhp` at ~66%/50%/33%), **trap hazards** (`spiketile` 16, `axetrap`
   18–22, `arrowtrap` 14), **ward-lance beams** (`skybeam`, supports any
   `dx/dy` axis), **coupled sluice valves** (`pullSluiceLever`), **fading tiles**
   (`skyFadeSolid`), **ice-slide zones** (`G.slideZones`), the **catgate**
   portcullis, and `spawnMob` for trash.

---

## Per-dungeon breakdown

### 1. The Emberdeep (`eastdeep`) — lv 6–9 · ~10–15 min · **6/10**
The dash-timing dungeon. Three pit crossings on rotating basalt slabs (CH1 one
slab → CH2 two counter-slabs behind a 20-second timed lever → CH3 three-slab
chain), ending at **Ashwing** (dragon, 680 HP, freed not slain). Light combat (4
Bristleback boars). A missed dash drops you −5 HP and restarts that crossing.
**Reward:** breaks Vath's spell → unlocks the dragon-flight to Cloudreach; the
optional vault grants the **Double Dash**.
**To ~60 min:** (a) **Re-wire the three coded puzzles** as gates layered on the
crossings — visit-all plates in the Font, the I–II–IV button-order lock in the
Warding room (a wrong press already spawns a chasing archer). (b) Add a boar/
archer **wave** on each far-ledge landing before its gate rises. (c) Add
**lava-jet timing** (`edeepLava` + `firepit`) so slabs pass under damaging
bursts. (d) Make Ashwing a **multi-phase** fight (HP-threshold logic exists).

### 2. The Rimefissure (`frostdeep`) — lv 13–15 · ~8–12 min · **6/10**
One drifting-ice-floe crossing (sine-oscillating slabs, −4 HP + reset on a fall,
slick footing) + two ward-levers you simply find and pull (no ordering, no
timing) → **The Rimebound** (ice colossus, **1120 HP** / 42 dmg — the biggest
boss wall in the game for its level band, freed not slain). No trash mobs at all.
**Reward:** advances the Vath thread; 150 gold + 2 elixirs; +max mana.
**To ~60 min:** (a) **Build the flame-relay puzzle** the comment already
describes (timed torch + thawable braziers) to fill the dead antechamber.
(b) **Guard each ward-lever** with an ice-beast wave (reuse the Vault spawner) so
the trivial fork becomes two mini-arenas. (c) Add **thin-ice collapse** tiles
(also already flagged in a comment) for a second timing layer. (d) Give the
Rimebound **summon + enrage** phases and a Deep-Gate miniboss.

### 3. The Underclimb (`aeriedeep`) — lv 12–14 · ~10–15 min · **6/10**
Two structurally identical **ward-lance mazes** (`skybeam` sweeps a violet lance
across a serpentine corridor on a beat; cross while dark, −5 HP + retry on a
hit; the second is just faster) → **Tome-Warden** (serpent, **920 HP** / 36 dmg)
with `raptor` adds (lvl 12) swooping in every 9s. Sealed — no exit until the
boss dies.
**Reward:** crumbles the cursed Tome (`aerieFreed`), breaks the curse, opens the
exit; warden's-hoard chest.
**To ~60 min:** (a) Add **2 more maze chambers** with more legs, shorter periods,
and a **horizontal lance axis** (`beam` already takes `dx/dy`). (b) Make one maze
a **sequence-plate** puzzle (light plates in a shown order) so it's memory + not
just timing. (c) Add a **mid-boss** at the Sepulchre Gate so combat isn't all
back-loaded. (d) Give the Warden a `<50%` **lance-burst + raptor-summon** phase.

### 4. The Glacier Vault (`frostvault`) — lv 14–16 · ~15–20 min · **7/10**
A **wave gauntlet**: three arena halls (4 / 5 / 5 waves) on slick ice, each
gate opening only when every wave is cleared, climaxing at **3 elite polar bears
+ 4 wolves** (bears 560 HP / 46 dmg). No named boss. Richest loot (`rich:14`).
**To ~60 min:** (a) **Wire up the dormant lever puzzle** — place three `icelever`
with a shared `wardGroup` in the empty "Three Wards" room; `pullVaultLever` fully
supports it. (b) **Build the pillar-glide puzzle** the comment describes (aim
slides off `icespire` pillars to reach a lever landing). (c) Add a **named vault
boss** in the Hoard (a `bigBoss` polar bear with an entrance). (d) Extend the
gauntlet with ranged variety (`archer`/`raptor`) + between-wave ward-lances.

### 5. The Drowned Catacomb (`reachdeep`) — lv 12–14 · ~8–12 min · **6/10**
A **trap gauntlet** up a forced serpentine path — swinging axes (22), spike
strips (16), arrow crossfire (14), ramping per leg — plus two path-side bone
levers, ending at the **Drowned Minotaur** (900 HP / 34 dmg) with 3 skeletons.
Dash i-frames pass through any trap, so a careful player can dash-cancel the maze.
**To ~60 min:** (a) **Build the real 3-lock puzzle** the comment promises —
three hidden bone-levers on dead-end spurs, forcing full-maze exploration.
(b) **Trigger skeleton waves** on each lever pull so combat overlaps trap-dodging.
(c) Give the Minotaur a telegraphed **charge-lunge + pillar-slam shield** phase
(copy `updateStormWraith`'s tele→lunge→stun). (d) Add a **rising-brine escape**
after the kill (reuse `T.SHALLOW` + slide mechanics) into a second hoard room.

### 6. The Undermill (`milldeep`) — fixed level · ~8–14 min · **4/10**
The most puzzle-rich dungeon: two **coupled-sluice water mazes** (valves each
toggle two adjacent flood-walls; find the combo that opens a doorway in every
wall) + timed spike-grates and grind-blades, ending at **The Cog-Bound** (scaled
skeleton, 480 HP). No trash mobs.
**Reward:** **Nessa's stormsail** → unlocks windsurfing (story-critical).
**To ~60 min:** (a) Add **2–3 more flood halls** with larger valve graphs
(4→5→6), reusing `pullSluiceLever` verbatim. (b) **Populate the halls** with
patrolling drowned skeletons so you fight while dodging hazard cycles. (c) Give
the Cog-Bound **summon/enrage** phases. (d) Add a **gear-key side-alcove** fight
that frees a valve — a light branch off the linear spine.

### 7. The Undermaw (`undermaw`) — lv 11–13 · ~3–6 min · **5/10**
The **shortest** dungeon: three rooms in a line, no puzzles (the catgate is a
kill-gate that auto-opens when the beast dies), one fight — **The Maw-Stalker**
(scaled scorpion, 520 HP / 24 dmg, fast).
**Reward:** the **Deepiron Ward** (−15% damage passive, stacks with armor) —
optional power upgrade.
**To ~60 min (biggest lift — currently a single fight):** (a) **Wave gauntlet**
in the den before the boss (kill-count gate via the existing `bossCleared`
pattern). (b) **Branch into multiple dens**, each with its own catgate + reward
alcove — the `catgate` machinery is reusable per-gate. (c) **Import the
Undermill's hazard system** (`spiketile`/`axetrap`) into the throat corridors.
(d) Give the Maw-Stalker a **burrow/summon + <50% enrage** set-piece.

### 8. The Rainbow Road (`skydungeon`, via Cloudreach) — lv 9–13 · ~15–22 min · **7/10**
The longest and most mechanically varied: **7 cloud-isles** up a rainbow road,
gated by wind-ward bridges — wraith fights (i1, i5), an **order-unknown rune-tile
puzzle** (wrong tile resets all + spawns a wraith), a **fading rainbow bridge**
(travelling on/off wave, drop = teleport back), an **invulnerable Cloud-Snatcher**
you must dash-juke, a **Storm-Wraith mini-boss** (telegraphed lunge → stun; drops
the **Stormlight** stun upgrade), and the **Storm-Eye** finale (shielded; only
vulnerable when it discharges).
**Reward:** Stormlight (staff bolts stun) mid-road; completion grants the
stormsail/parachute → **The Leap** down to Windsurf; +a full level, full heal.
**To ~60 min:** (a) **Wire in the coded Prism-Ward beam puzzle** as a 7th trial
isle (multi-crystal beam-bending for a bonus Stormlight upgrade). (b) Add a
**second fading-bridge variant** (faster / two interleaved waves) + a drifting
moving-platform span. (c) Make i3 a **multi-Snatcher** chained-juke gauntlet.
(d) Give the Storm-Eye a **shielded-hover add phase** (timed wraith waves you
clear with the new stun) to lengthen the finale.

---

## Suggested build order (by payoff-to-effort)

1. **Ship the dormant code** — wire Emberdeep's plate/button puzzles, the Glacier
   Vault's three-ward levers, and the Rainbow Road's prism puzzle. Highest depth
   per line of code because the systems already run.
2. **Give every boss HP-threshold phases** — the summon/enrage logic already keys
   off `hp/maxhp`; turning five single-phase HP sponges into 2–3 phase fights adds
   length *and* fixes the "gear-check, not skill-check" complaint at once.
3. **Add combat between puzzle rooms** — waves/patrols via `spawnMob` in the
   dungeons that ship with `G.critters=[]` (Rimefissure, Undermill, Undermaw).
4. **Branch the linear spines** — one optional wing per dungeon (reward alcove +
   its own gate) using `catgate`, converting straight climbs into small warrens.
5. **Prioritize the two shortest** — the **Undermaw** (~5 min) and **Rimefissure**
   (~10 min, trivial puzzles) need the most new material to reach an hour.

> **Reality check on "1 hour each":** 60 minutes is a lot for a single dungeon in
> a game where the whole act is a sequence of them — pushing all eight to a full
> hour risks pacing fatigue. A more defensible target may be a **tiered** one:
> ~30–40 min for the marquee isle dungeons (Emberdeep, Underclimb, Rimefissure,
> Glacier Vault, Rainbow Road) and ~15–20 min for the side dungeons (Undermill,
> Undermaw, Catacomb). The extension ideas above scale to whichever target you pick.
