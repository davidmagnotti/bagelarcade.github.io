# Tidefarer — Story & Mechanics Roadmap

Working design notes for the arc that follows Act I. This is the reference we
build against; it is not shipped code. Where a beat already exists in the game
it is tagged **[built]**; new material is tagged **[new]**. Open design
questions are collected at the end.

---

## Where the story stands (Act I recap) — [built]

- You play the **princess**, daughter of **King Aldous** of Aldermere; your
  **brother**, the **prince**, fights at your side.
- **Vath the Emberbinder** stole the **Tideglass magic** from your father's
  blood. In the throne-hall climax the King spends himself buying his
  children's escape, and Vath rewrites the guards' memory to frame the prince.
- Act I closes on the "six months later" crossing: the siblings sail out past
  the charted isles to grow strong enough to come back for Vath.

The world already contains the isles this arc uses:

| This roadmap calls it | In the game today |
|-----------------------|-------------------|
| Emberwick             | `isle` — **Emberwick Isle**, the home/tutorial shores |
| Barik                 | `main` — **Barik**, port town **Greyharbor** |
| Sunwick               | `east` — **The Sunward Isle**, Kohana Village, **Mount Kea** volcano |
| Windsurf              | `wind` — **Windsurf Isle**, the industrial city (windmill, waterwheel) |
| Stormreach            | `reach` — **Stormreach**, storm-coast sea stop |
| The capital           | `crown` — **Aldermere**, the Tideglass throne |

> **Naming note:** the roadmap says "Sunwick"; the game currently ships it as
> "The Sunward Isle." Pick one before we wire dialogue — renaming later means
> chasing a lot of strings. (Others already match: Barik, Windsurf, Stormreach.)

---

## Act II — the shattered isles

### Navigation: Stormreach is the turnstile — [new gating]

After you **defeat Stormreach**, the sea opens: you may sail to **any isle
except the capital**. Aldermere stays sealed until the endgame — you are not
ready for Vath, and the story keeps that door shut on purpose.

> **Change from today:** the Act II ferry currently runs a fixed chain
> (Stormreach → Frozen Isle → the older isles). The new intent is to convert
> that into free sailing once Stormreach falls, with only the capital gated.
> Frozen Isle / Aerie / Cloudreach can stay as optional side-content that the
> open map now surfaces.

### The island spirits — [new]

Every isle carries a wound tied to a bound or maddened **island spirit**. The
land itself is in revolt, and each isle's spirit expresses as a distinct,
readable environmental hazard. The through-line: Vath's theft of the Tideglass
magic unmoored the spirits that the tide once kept in balance.

- **Windsurf — vicious winds.** Gusts strong enough to knock people off their
  feet; being outside is dangerous. Buildings overturned; the **windmill and
  waterwheel spin out of control.** (Fits what's already here: Millward Rise,
  Waterwheel Row, the Undermill, and the "harbor turned deadly" lore.)
- **Barik — earthquakes.** The ground heaves at random intervals.
- **Sunwick — the erupting volcano.** Mount Kea is erupting, blanketing the
  isle in a drifting cloud of **ash.**

**Mechanically**, each becomes a recurring world hazard plus set dressing:
timed knock-down gusts, screen-shaking quakes that may open/close paths,
ash that reduces visibility and chips health outdoors. Calming each spirit is
the isle's questline payoff (and likely how new terrain/items open up — see
below).

### Traversal gates: new items and changed terrain — [new]

Exploration widens as you go. Calming a spirit, or an item won on one isle,
changes the terrain or gives you a new way to move — so isles you couldn't
fully cross before open up on a return visit. (Same shape as the existing
Stormlight and stormsail unlocks: a mid-arc prize that re-opens the map.)

---

## Act III — Emberwick and the Tidefarer's rest

One of the **final places before the capital** is a **hidden site on
Emberwick** — you come home to end where you began.

### The reveal — [new]

There you learn where the **Tidefarer** rests. She was your
**great-grandmother**, and she **fought Vath** in her own age. She wounded him
but could not finish it: **Vath survived, and her spirit was trapped** there.

She tells you she carries a **secret that can destroy Vath** — one she never
had the means to use, because it takes **two working together: a warrior and
one of great intellect.** That mind is your **brother.**

### The test — striking the headstone — [new]

She bids you **destroy her headstone** to lay her spirit to rest and free the
prize it guards: a **book.** As your blade falls, the **spirits of the royal
family awaken and attack** — your ancestors, set here as **guardians of the
weapon and a test of the one who would claim it.** Winning the fight is proof
you are the warrior the secret demands.

> Reuses the game's headstone / tomb-mouth art and the guardian-spirit /
> wraith enemy family already in the engine.

### The book — two gifts — [new]

Your brother reads the book and finds it holds the spells that let the two of
you finally face Vath:

- **For the brother — the seal.** A binding spell; his role in the final fight
  is to **seal Vath** rather than kill him.
- **For you — the combat gift.** A new ability: **slow time** (equivalently,
  **move at incredible speed**). In a slowed world you strike many times before
  a foe can answer.

> **Foundation exists:** the engine already runs a cinematic `G.slowmo`
> (see `21-exploration.js`, used for boss beats). The player ability is a new,
> costed, player-triggered version of that — natural to build on the skills/MP
> systems in `05-inventory-skills-quests.js`.

---

## Suggested build order

1. **Slow-time ability** — self-contained, testable now; the marquee mechanic.
2. **Post-Stormreach open sailing** (capital gated) — a navigation/gating change.
3. **Island-spirit hazards** — Windsurf winds, Barik quakes, Sunwick ash — as
   world hazards + set dressing, one isle at a time.
4. **Emberwick Tidefarer tomb** — the reveal, the headstone strike, the
   royal-family guardian fight, and the book that grants the two gifts. This
   ties the mechanic in (1) to the story.

---

## Open questions

- **"Sunwick" vs "The Sunward Isle"** — settle the canonical name.
- **Free sailing vs. chain** — fully open the map after Stormreach, or keep a
  couple of isles behind soft story gates? What exactly does "any isle but the
  capital" include (Frozen, Aerie, Cloudreach)?
- **Slow-time cost & feel** — MP drain, a cooldown, or a charge meter? How much
  does time slow, and does the player also speed up, or just the world slow?
- **Spirit hazards — punishing or flavor?** Do quakes/gusts/ash deal damage and
  gate paths, or mostly dress the isle until you calm the spirit?
- **Do the three spirits need boss fights**, or is calming them a quest/puzzle
  with the hazard as the obstacle?
- **The brother's seal in the finale** — is he a controlled ally, a scripted
  cutscene role, or a mechanic you protect during the Vath fight?
