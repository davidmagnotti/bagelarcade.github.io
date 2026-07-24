# Tidefarer — Missing / Incomplete Content Audit

_A read-only analysis of the game content in `tidefarer/js/*.js`. No gameplay
code was changed to produce this document._

## TL;DR

Tidefarer ships as a **complete, playable "Act I — The Enchanter's Tide."** The
world is far more finished than a typical work-in-progress: 9 full overworld
isles, 8 dungeons, and a sky-dungeon — **18 generated worlds, all reachable and
populated** — plus 73 fully-defined quests, and internally-consistent items,
recipes, perks, interiors, NPCs and mobs (no dangling references anywhere).

The "missing content" falls into two buckets: **(A) content that was
deliberately deferred** (Act II is teased but unbuilt), and **(B) content that
is finished but unreachable because a trigger flag or counter is never set** —
these are the real defects, and they're small, high-leverage fixes.

---

## A. Deliberately deferred — Act II

The entire shipped game is branded **"Act I"** in the credits
(`13-aaa-layer.js:18`). It ends with King Aldous falling, Vath seizing the
Tideglass magic and escaping, a credits roll, and an explicit teaser:

- Brother at the tideline — `06-dialog.js:171`:
  _"…isles out past the charts, and allies we haven't made. When we come back for
  him, we come back ready. **(Act II - coming soon.)**"_
- End-of-Act toast — `06-dialog.js:191`: _"**Act II - coming soon.**"_
- Credits close — `13-aaa-layer.js:26`: _"…somewhere past the charted isles / is
  the strength to come back for him." / "The tide will turn again."_
- King's coda — `06-dialog.js:223`, `15-interiors.js:72`: _"Come back when you
  can end this."_

This is the single largest body of "missing" content, but it is **by design** —
a sequel hook, not a bug. Its only mechanical stub is the ferry gate
`P.story.act2` (below).

---

## B. Finished-but-unreachable content (the real defects)

### B1. ⭐ The "defeat & bind Vath" finale is dead code (most significant)

The repo contains a **second, fully-authored ending** in which the player beats
Vath and seals him — boss, cutscene, and achievement all written — but it can
**never trigger**:

- `spawnFinalVath()` — boss with health bar/music, `title:'VATH THE EMBERBINDER'`,
  `ach:'enchantersbane'` — `12-world-layer.js:3155`.
- `bindVath()` — payoff cutscene, `banner('VATH IS BOUND','SEALED BY HIS OWN
  COMPULSION')`, sets `P.story.vathBound`, awards the achievement —
  `12-world-layer.js:3168`.
- Achievement **"The Enchanter's Bane — Bind Vath the Emberbinder for good."** —
  `14-meta-layer.js:32`.
- Kill hook: `m.finalVath && !m.bound → bindVath(m)` — `09-gameplay.js:600`.

**Why it's dead:** `spawnFinalVath()` runs only via `ensureFinalVath()`
(`12-world-layer.js:3187`), gated on `P.story.vathCame`:

```js
if(qs('enchanter')==='active' && P.story && P.story.vathCame && !P.story.vathBound){ … spawnFinalVath() }
```

`P.story.vathCame` is **only ever read, never assigned** anywhere in the codebase
(`06-dialog.js:112`, `12-world-layer.js:3189`). Additionally, the `enchanter`
quest is completed at the unmasking scene (`06-dialog.js:136`), so
`qs('enchanter')==='active'` is already false before any final fight could spawn.

**Result:** every player gets the "Vath wins and escapes" ending; the "bind Vath"
finale never plays and its achievement `enchantersbane` is **unobtainable**.

### B2. The Storm-Eye final boss is bypassed — `stormbreaker` achievement dead

The Rainbow Road sky-dungeon (`31-skyquest.js`) has a proper final boss, the
**Storm-Eye** (900 HP, shielded AI, `ach:'stormbreaker'`, `31-skyquest.js:142`),
on the last isle (i6). But the **mini-boss** on isle i4 drops a reward bead whose
pickup (`collectStormBead`, `31-skyquest.js:270`) sets `skyDungeonDone` **and
force-kills the Storm-Eye directly** via `m.dead=true` (line 280) — its own
comment reads _"There is no Storm-Eye beyond this point."_

Because the bead auto-collects (`dist<0.9`) and is the intended "way home"
reward, normal play ends at i4 and despawns the final boss before isles 5–6 are
ever crossed. And because the despawn sets `m.dead=true` directly rather than
routing through the kill/`bossReward` path (`09-gameplay.js:680`), the
**`stormbreaker` achievement is never granted** (`14-meta-layer.js:31`). The
Storm-Eye's full boss AI and death handler (`09-gameplay.js:768`) are effectively
unused.

### B3. Six gather achievements are permanently unobtainable

`checkStats()` (`14-meta-layer.js:55`) awards six achievements when gather
counters cross a threshold:

| Achievement | Requires | Line |
|---|---|---|
| `woodsman` | `P.stats.wood >= 15` | 57 |
| `stonebreaker` | `P.stats.stone >= 15` | 58 |
| `angler` | `P.stats.fish >= 5` | 59 |
| `greenthumb` | `P.stats.wheat >= 5` | 60 |
| `prospector` | `P.stats.ore >= 5` | 64 |
| `pearldiver` | `P.stats.pearl >= 1` | 65 |

But `bumpStat(...)` is only ever called with `'chests'` and `'kills'`, and no
code ever writes `P.stats.wood/stone/fish/wheat/ore/pearl`. Those six branches
always read 0 and never fire — **six unearnable achievements.** (The kill/chest
achievements `firstblood`, `slayer`, `plunderer` work because those counters
*are* bumped. Note `18-economy.js:19` documents this exact class of bug being
fixed once before for `ACH.delver`.)

### B4. 14 quests never appear in the quest log / tracker

The journal and tracker render only ids listed in two hardcoded `order` arrays,
`08-ui-panels.js:270` (`refreshQuestLog`) and `08-ui-panels.js:350`
(`updateQuestUI`). These 14 **defined, functional** quests are in neither array,
so they never show as journal entries or tracker cards even while active:

`sail`, `breakers`, `wyrm`, `vhunt`, `lettuce`, `kitchenrun`, `hoarfrost`,
`rimebound`, `stormroc`, `barrowbrute`, `drownedwarden`, `roses`, `larder`,
`garrison`.

They still function (accept / track / complete), but the player gets no visible
objective for them — a maintenance drift where new quests were added to `QUESTS`
without updating the display lists.

---

## C. Minor / cosmetic

- **`P.story.act2` never set in gameplay.** The ferry's "far reaches" routes to
  Stormreach / Aerie / Frozen (`12-world-layer.js:3630`) only open when `act2` is
  true, which only the dev menu sets. Narratively those isles stay off the ferry,
  though they remain reachable by windsurf / dragon flight, so no region is
  actually stranded.
- **Act-numbering inconsistency.** Internally `P.story.act` climbs to 3 (King's
  audience) and 4 (unmasking), and comments say "Act IV", but every player-facing
  banner and the credits brand the whole thing "Act I"; the dev menu exposes only
  Acts I/II/III. Cosmetic, but confusing for maintenance.
- **Retired `skyspirit` boss.** "The Corrupted Spirit" (980 HP, `04-data.js:230`,
  tagged _"(retired) old final sky boss"_) is fully defined and has render code
  but is never spawned — replaced by `stormeye`. Dead definition.
- **README under-documents the file list.** `tidefarer/README.md` documents files
  01–23; the game also ships and loads `24-perf`, `25-debug`, `26-bench`,
  `27-perfmode`, `28-fxpanel`, `29-devmenu`, `30-perks`, `31-skyquest` (all wired
  into `index.html`). No dead files — the docs are just stale.
- Small dead code: `surf1` inert quest kept for old saves (`12-world-layer.js:2914`,
  intentional); empty `item:{}` reward on `sharpen` (`04-data.js:121`); unread
  `kinds` map in interiors (`15-interiors.js:178`).

---

## What is NOT missing (verified complete)

- **Quests:** all 73 defined; no referenced-but-undefined quest ids; no undefined
  reward items; every giver/`talkTo` NPC exists.
- **Items / recipes / perks:** every item id used in recipes, rewards, shops and
  quick-slots resolves to a definition; all 6 perks consistent; smithing/cooking/
  brewing I/O all valid.
- **World:** 9 overworld isles + 8 dungeons + sky-dungeon, all reachable and
  populated; no empty maps or dead sail links; 18 live bosses.
- **Interiors / NPCs / mobs:** every placed building kind has furniture; every
  `spawnMob`/`spawnNPC` kind resolves.

---

## Suggested priority order if these are to be addressed

1. **B1** — wire up the Vath "bind" finale (set `P.story.vathCame` at the right
   beat, or re-point `ensureFinalVath`), so the authored true ending and its
   achievement are reachable. Highest narrative payoff.
2. **B2** — let the Storm-Eye actually be fought (don't force-kill it on bead
   pickup, or route its despawn through `bossReward`) so `stormbreaker` can drop.
3. **B3** — add `bumpStat` calls in the gather/mine/fish/harvest paths so the six
   gather achievements can be earned.
4. **B4** — add the 14 missing quest ids to the two `order` arrays.
5. **C** — Act II (major, deferred), plus the cosmetic cleanups.
