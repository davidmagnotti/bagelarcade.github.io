# Tidefarer — Story & Mechanics Roadmap

Working design notes for the full arc. This is the reference we build against;
it is not shipped code. Where a beat already exists in the game it is tagged
**[built]**; new material is tagged **[new]**. Open design questions are
collected at the end.

---

## The three-act spine — [new, canonical]

This is the governing structure. Everything below hangs off it.

- **Act I — Amnesia and the fall.** You wash ashore an amnesiac castaway,
  masked, lifting island curses by instinct. Act I **climaxes when your memory
  returns** (your brother frees you of the mask) **and you learn your father
  has been taken captive by Vath.** You end the act knowing who you are and how
  much you have lost.
- **Act II — The prophecy and the weapon.** You sail the shattered isles,
  **discover the prophecy** of the Tidefarer, and **retrieve the magical item**
  it names — the means to seal Vath. This is the treasure hunt: the prophecy is
  the map, the item is the prize.
- **Act III — The battle for the capital.** The sea to Aldermere finally opens.
  You **fight Vath's controlled troops across the capital**, then **face Vath
  himself** in the throne hall.

> **Reconciling with the older draft.** An earlier version of these notes ended
> Act I on the "six months later" crossing and put the Emberwick tomb reveal in
> Act III. Under the canonical spine above, the crossing is the **Act I → II
> bridge** (you sail out to find the means to fight back), the Emberwick tomb /
> prophecy / item is the **heart of Act II**, and Act III is the **capital
> assault**. The isle-spirit exploration content is the **body of Act II** —
> the sailing you do while chasing the prophecy.

---

## Backstory (the true history) — [new]

The load-bearing lore, roughly chronological. Most of it is **told**, not
played — see the reveal cadence for who says what, and when.

- For centuries the **royal house of Aldermere** ruled the isles in peace,
  their bloodline blessed with the **Tideglass magic** — a power passed to each
  generation, strong enough to protect the isles from evil and **so strong that
  Vath's own magic cannot touch the royal blood directly.**
- Generations ago, the great warrior queen — the **Tidefarer** — defeated Vath
  and beat him down to a broken spirit. She meant to seal him forever, but in
  the final moment **he turned her own sealing spell back on her**, trapping her
  spirit on a hidden isle off Emberwick. He survived, barely, and **waited.**
- He waited out the Tidefarer's death and longer, rebuilding strength. Then he
  **crafted himself a vessel** — a beggar child with a feigned gift for magic —
  and presented himself to the King, who took the prodigy in as his protégé.
- Vath waited again: through the King's marriage, his heirs, his growing trust,
  until age made the King **physically weak.** All the while he **seeded the
  isles with curses** — distrust, unease, pressure — to force the King to act.
- Vath manipulated the King into sending the **warrior daughter** and the
  **scholar son** out to the troubled isles. He would have killed them, but the
  bloodline's magic put them beyond his reach — so he **cursed them instead**,
  using new magic he had researched in secret. The son he cursed with ease. The
  daughter's quiet inner strength resisted him, so he bound her in a **mask** she
  could never bring herself to remove, and took her memory.
- Even amnesiac, the daughter drifted isle to isle **lifting curses by instinct
  — acting not from memory but from obligation, from the nature of her blood.**
- Two things protected the siblings beyond the bloodline: that resistance, and a
  **necklace their dying mother left them, imbued with her love.** That love
  **restored the son's memory**, and he in turn **removed the mask from his
  sister**, freeing her.
- Vath's power kept growing. He **overthrew the King and seized the capital**,
  bending its soldiers to his will. His magic cannot harm the royal blood — **but
  the people and creatures he controls can.** If he turns the whole kingdom
  against the prince and princess, the bloodline's protection fails, the kingdom
  falls, and the greatest force for good the isles have known dies with it.

### The prophecy

> **The legend of the Tidefarer.** A great maiden of the royal house, sailing
> island to island, freeing them of a great evil — who would one day find the
> magical item needed to seal that evil away forever.

The siblings uncover it in the **catacombs of Stormreach**: a prophecy written
by their ancestors, naming a weapon the Tidefarer forged to seal an evil. It
sends them hunting.

### The weapon (Act II climax)

The hunt leads back to **Emberwick**, to **Sage Orin** — now facing death — who
points them to an adjacent isle where the weapon is rumored, though even he
doubts it. They find not a weapon but a **grave**: the Tidefarer's own
headstone, lost to time. Her **spirit wakes** and tells them the true history —
Vath's many names, and how he turned her sealing spell back on her. She begs
them to **destroy the headstone** to free her and the **book** it guards, which
holds the spell to seal Vath. As the blade falls, the **spirits of the royal
family awaken and attack** — guardians set to test whoever would claim the
weapon. Winning proves the warrior worthy.

### The two gifts

The book holds the spell — and it takes **two working together, a warrior and a
mind:**

- **For the brother (the scholar) — the seal.** A binding spell; his role in the
  finale is to **seal Vath, not kill him.**
- **For the sister (the warrior) — the combat gift.** **Slow time** (equivalently,
  move at incredible speed): in a slowed world she strikes many times before a
  foe can answer.

> **Foundation exists:** the engine already runs a cinematic `G.slowmo`
> (`21-exploration.js`, boss beats). The player ability is a new, costed,
> player-triggered version — natural to build on the skills/MP systems in
> `05-inventory-skills-quests.js`.

---

## Name reconciliation — [decision needed]

The backstory draft and the shipped game use **two different name-sets**. Pick
one before wiring dialogue — renaming later means chasing a lot of strings.
**Recommendation: keep the game's invented proper nouns, and adopt the draft's
names only for the currently-unnamed siblings.**

| Backstory draft | Game / this doc today | Recommendation |
|-----------------|-----------------------|----------------|
| House **Kensington**, isles of **Yorkshire** | House of **Aldermere**, the **Tideglass** line | **Aldermere.** "Yorkshire" reads as real-world England and clashes with the invented register (Emberwick, Tideglass). Drop it. |
| King **Archer** | King **Aldous** | **Aldous** (shipped in dialogue already). |
| **Joan** (warrior daughter) | the **Princess** (unnamed) | **Joan.** Naming the sibling is an upgrade. |
| **Jaist** (scholar son) | the **Prince** (unnamed) | **Jaist.** |
| Queen **Regina** (ancestor who beat Vath) | the **Tidefarer**, great-grandmother | **Tidefarer** as title; **Regina** can be her name — but note *regina* is Latin for "queen," so "Queen Regina" = "Queen Queen." Make it a choice, not an accident. |
| **Orin** on Emberwick | **Sage Orin** on Emberwick | Already match. |
| the mother | a lost queen, drowned ~30 years gone (shipped) | Already match. |

**Also settle:** the isle called **"Sunwick"** here ships as **"The Sunward
Isle."** And the Tidefarer's generation — the draft calls Archer her
*great-grandson* (making her the kids' great-great-grandmother), while these
notes have said *great-grandmother*. Pick one.

The world already contains the isles this arc uses:

| This roadmap calls it | In the game today |
|-----------------------|-------------------|
| Emberwick             | `isle` — **Emberwick Isle**, the home/tutorial shores |
| Barik                 | `main` — **Barik**, port town **Greyharbor** |
| Sunwick               | `east` — **The Sunward Isle**, Kohana Village, **Mount Kea** volcano |
| Windsurf              | `wind` — **Windsurf Isle**, the industrial city (windmill, waterwheel) |
| Stormreach            | `reach` — **Stormreach**, storm-coast sea stop |
| The capital           | `crown` — **Aldermere**, the Tideglass throne |

---

## Reveal cadence — who says what, and when — [new]

The backstory is exposition-dense ("he waited, and he waited, and he waited").
It dies if delivered in one lump. **Ration it across all three channels — book
lore, a Vath soliloquy, and the Tidefarer's spirit — so no single moment dumps
the whole history.**

| Beat | Act | Channel | Notes |
|------|-----|---------|-------|
| Something is wrong with the King's advisor | I | **Ambient** — Orin's unease, "a loyal man drowned in my service," the pendant, the mask | Hooks, not answers. Explain nothing. **[partly built]** |
| Who you are; the night of the coup; your father is Vath's captive | I climax | **Memory return** (mask off, necklace) | The *personal* history only — not Vath's deep past. **[built: mask/memory]** |
| Vath has other names; an ancestor once beat something like him | II | **Book/scattered lore** + the **Stormreach prophecy** | The *shape* of the truth. **[seed built]** |
| Vath has been beside the family longer than you've been alive; he curses rather than kills because he cannot touch your blood | II (mid/late) | **Vath soliloquy** | The villain gut-punch. Stop here — **do not** spend his origin. |
| His many names, the long con, and how he turned the Tidefarer's own spell against her | II climax | **The Tidefarer's spirit** | The deepest history, from his victim's mouth — weightier than a boast. |
| The seal, the slow-time gift, "a warrior and a mind" | II climax | **The book** | Sets up the Act III finale. |

**Act I — seed only, explain nothing.** Leave Act I knowing the advisor is
wrong and nothing more.

**Act II — feel Vath before you understand him.** The isle curses/hazards are
his manipulation made physical. Drip the shape of the truth through lore and the
prophecy; land the confidant reveal as a soliloquy; save the origin for the
Tidefarer.

**Act III — no new history, just payoff.** The capital assault *is* the "turn
the kingdom against them" rule made playable.

---

## Craft notes on the backstory — [new]

1. **Fix the waterfall redirect — it reads as luck, not cunning.** "He kept her
   talking until she happened to cast toward a waterfall, then ducked" makes Vath
   *fortunate*, not brilliant. Rewrite so he **maneuvered the duel to that spot
   on purpose.** Bonus: it gives Joan a thematic warning for the finale — *don't
   let Vath talk* — to pay off in the last fight.
2. **State the "can't be touched" rule explicitly — it's load-bearing.** Vath's
   own magic and anything he *directly* controls cannot harm royal blood, but
   people and creatures he *manipulates* can. This single rule explains why he
   curses instead of killing, why the whole capital's soldiers are the Act III
   threat, and why the finale is about the kingdom, not a duel. Never break it.
3. **Make the two loopholes mirror each other.** The seam — "if he can't touch
   them, how did he curse them?" — is answered by "new magic he researched." Lean
   in: **the curse is his researched loophole; the Tidefarer's seal is the
   heroes' researched loophole.** Visible symmetry.
4. **Don't let the necklace and the book do the same job.** Both "undo Vath's
   magic." Split their domains: the **necklace undoes the *personal* curse**
   (memory, mask — love vs. spite); the **book/seal undoes *Vath himself*.**
5. **The long con is backstory, not a scene.** "Beggar → protégé → confidant →
   waits out the King" is great *told* history but deadly to *play*. Keep it in
   the Tidefarer's mouth and Vath's gloat — narrated, not dramatized.

---

## Act I — amnesia and the fall

**Where it stands — [built].** You play the princess (**Joan**), daughter of
**King Aldous** of Aldermere; your brother the prince (**Jaist**) fights at your
side. **Vath the Emberbinder** stole the **Tideglass magic** from your father's
blood; in the throne-hall coup the King is taken and Vath rewrites the guards'
memory to frame the prince. You wash ashore on Emberwick an amnesiac, masked,
wearing your mother's pendant, and begin lifting curses by instinct.

**Climax — [built beats, re-aimed].** Your brother restores your memory and
frees you of the mask (the necklace's doing). Full memory returns: you remember
the coup, and that **your father lives as Vath's prisoner.** The act ends at the
low point — you know who you are and how much you've lost — and you sail out
(the crossing) to find the means to fight back.

---

## Act II — the prophecy and the weapon (the shattered isles)

The treasure hunt. The prophecy is the map; the Tidefarer's weapon is the prize.
Sailing the shattered isles is the body of the act.

### Navigation: Stormreach is the turnstile — [new gating]

After you **defeat Stormreach**, the sea opens: you may sail to **any isle except
the capital**. Aldermere stays sealed until Act III — you are not ready for Vath,
and the story keeps that door shut on purpose.

> **Change from today:** the ferry currently runs a fixed chain (Stormreach →
> Frozen Isle → older isles). The new intent is free sailing once Stormreach
> falls, with only the capital gated. Frozen Isle / Aerie / Cloudreach stay as
> optional side-content the open map surfaces.

### The island spirits — [new]

Every isle carries a wound tied to a bound or maddened **island spirit** — Vath's
theft of the Tideglass magic unmoored the spirits the tide once held in balance.
Each expresses as a distinct, readable hazard:

- **Windsurf — vicious winds.** Gusts that knock people off their feet; the
  **windmill and waterwheel spin out of control.** (Fits Millward Rise,
  Waterwheel Row, the Undermill, the "harbor turned deadly" lore.)
- **Barik — earthquakes.** The ground heaves at random intervals.
- **Sunwick — the erupting volcano.** Mount Kea erupts, blanketing the isle in
  drifting **ash.**

**Mechanically:** timed knock-down gusts, screen-shaking quakes that open/close
paths, ash that cuts visibility and chips health outdoors. Calming each spirit is
the isle's questline payoff (and likely how new terrain/items open up).

### Traversal gates: new items and changed terrain — [new]

Calming a spirit, or an item won on one isle, changes terrain or gives a new way
to move — so isles you couldn't fully cross open up on return. (Same shape as the
existing Stormlight and stormsail unlocks.)

#### The relic verbs — [removed; folded into the tiered picks]

Earlier drafts had a set of actively-triggered "verb" tools (a grapple, a slow-time, a
heart-iron **Lodestone** that dragged a block onto a plate, and a **Blast Charge** that
lobbed a bomb to crack walls) — each on its own on-screen button. They were all cut: the
first two read as *just more dashes*, and the Lodestone/Blast Charge buttons were an
odd second control scheme sitting alongside the ordinary chop/mine. **Gated progression
now lives entirely in the tiered gathering picks below** — every sealed nook is just a
coloured gated rock you walk up and mine, exactly like a tree or a common stone. The
`js/33-relics.js` module and its `#relicBtns` UI are gone; older saves are migrated
(`loadCode`) so anyone who'd earned a relic keeps the pick that replaced it.

**Placed in the world — [built] (`js/37-dungeon-hideaways.js`).** The hideaways hold real
loot out on the isles (dungeon interiors are too densely connected for sealable nooks):
**emberstone gate rooms** (a flood-fill-verified nook whose neck is a molten **emberstone**
gate the tier-4 Emberbreaker Pick mines through — Barik, Sunward, Stormreach, Windsurf)
and **slagiron gate rooms** (the same kind of nook, neck sealed by a rust-red **slagiron**
gate the tier-3 Cograzor Pick mines — Barik, Windsurf, Frozen, Sunward). Same pocket
method + `P.story.tg` persistence as the tool-gate caches; each hideaway is proven
sealed-until-opened and never blocks a route.

#### Tiered gathering tools as Metroidvania keys — [built: systems; open: placement]

The preferred direction over more dashes: **better axe/pickaxe upgrades that cut
special trees/rocks, gating paths you return to later** (`js/34-toolgates.js`). The
chop/mine power formula already treats `P.tools.axe`/`P.tools.pick` as integer tiers
(0 none · 1 iron from the forge); this adds **tier 2**, dungeon-forged, plus two
gated materials only a tier-2 tool can cut. A gated node is an ordinary tree/rock
with `n.gate` set — a **solid barrier that never regrows once felled** (`n.gone`), so
cutting it opens the way for good; below your tier it just clinks and bounces.
Colour-coded on sight so you can note it and come back.

| Dungeon prize | Tier | Cuts (gated material) | Colour | Chest flag |
|---------------|------|-----------------------|--------|------------|
| **Rivenedge Axe** | `axe`→2 | **Ironwood** — blue-black pines | blue `#8fb3ff` | `{axegift:1}` |
| **Cragbreaker Pick** | `pick`→2 | **Basalt** — violet stone | violet `#c79bff` | `{pickgift:1}` |
| **Cograzor Pick** | `pick`→3 | **Slagiron** — rust-red stone | rust `#e0955a` | `{slaggift:1}` |
| **Emberbreaker Pick** | `pick`→4 | **Emberstone** — molten fire-rock | ember `#ff7a4a` | `{embergift:1}` |

The tier also **speeds all ordinary chopping/mining**, so the upgrade is a felt
reward, not just a key. One dungeon gives the axe, another the pick — **hard gates on
main routes** are the intended placement (with care to avoid dead-ends).

**Test now:** dev menu → *Gathering tools & gates* → "Sandbox: spawn gated walls
here," chop/mine to feel the bounce, then "Grant Rivenedge Axe / Cragbreaker Pick."

#### Placed in the world — [built] (`js/35-toolgate-content.js`)

`placeToolgates(id)` runs from `switchWorld` on each fresh world-gen and seeds:

- **Gated side-caches with item rewards.** A gate walls off a **natural enclosed
  pocket** (a peninsula/nook, proven small & content-free by a flood-fill so gating
  it can *never* soft-lock), or, failing that, a **carved dead-end alcove**. A reward
  chest sits inside (`tgcache` loot: an Ember Charm, a trove, a materials stash, three
  elixirs…). Configured on **Barik, Sunward, Windsurf** (and Emberwick/Stormreach/
  Frozen where geography allows) — **7+ caches** in a typical seed. Verified by a
  reachability audit: every chest is unreachable while its gate stands and reachable
  once it's cut, and only the small pockets are ever sealed.
- **The two tools**, in fitting dungeons: `{axegift}` in the **Undermaw** (Barik),
  `{pickgift}` in the **Emberdeep** (Mount Kea).

**Persistence:** a felled gate (`n.gid`) and a looted cache (`b.tgid`) record into
`P.story.tg`, which saves with `P.story`; on reload the world regen's and
`placeToolgates` skips anything already felled/looted, so opened caches stay open and
taken tools stay taken.

**Still open:** truly *mandatory* hard gates on a critical path (as opposed to gated
side-pockets) — those want a per-site, human reachability pass so the unlocking tool
is always obtainable first; left as authored content.

#### The four tools are BOSS PRIZES — [built] (`awardDungeonTool`, `js/37-dungeon-hideaways.js`)

One usable prize per dungeon, dropped when the dungeon's marquee boss falls (hooked from
`killMob`), each with its "use it here" example already in the world. (An earlier draft
scattered these — plus a set of passive stat-trinkets — into chests; the trinkets are cut
and the tools are now earned off the boss, one per dungeon.)

| Dungeon | Boss | Prize | Where you use it |
|---------|------|-------|------------------|
| **Undermaw** (Barik) | Maw-Stalker | **Rivenedge Axe** (axe→2) | fells **ironwood** gates (isles) |
| **Emberdeep** (Mount Kea) | Ashwing | **Cragbreaker Pick** (pick→2) | breaks **basalt** gates (isles) |
| **Undermill** (Windsurf) | Cog-Bound | **Cograzor Pick** (pick→3) | mines **slagiron** gate rooms (isles) |
| **Ashen Forge** (Sunward) | Cinderwrought | **Emberbreaker Pick** (pick→4) | mines **emberstone** gate rooms (isles) |

`awardDungeonTool(m)` matches the dungeon + its boss, then (after the boss's own fall beat)
calls the existing grant fn — so nothing is placed as a loose chest and no dungeon carries
more than one of these. The tools also speed ordinary chopping/mining/etc. as before.

### Bosses & new dungeons — [new]

Each isle gets a dungeon ending in a boss tied to its spirit — clearing it quiets
the surface hazard.

**Gating — Act II only.** These open when Act II does (Stormreach falls) and
close before the Act III finale — the same turnstile that seals the capital
fences the isle bosses inside Act II. Dungeon mouths stay shut until Stormreach
is cleared, and once the story crosses into the Emberwick tomb / capital endgame
they are no longer enterable. Nothing here is reachable in Act I, and nothing
lets the player wander back into an isle boss mid-finale.

- **Sunwick — the Giant Crab.** A **new barrier island** offshore holds the lair
  (separate from the Emberdeep / Ashwing dungeon in Mount Kea). Ties to the reef
  sketched at Windward Reef.
- **Windsurf — the Underground Temple.** A buried temple **beneath The Breakers
  Resort** (separate from the Undermill — Windsurf gets two underground sites).
- **Stormreach — the Barrier Reef.** A dungeon **at/below the waterline**
  (Stormreach already ships the **Drowned Catacomb** with the Drowned Minotaur —
  decide whether the reef replaces or sits alongside it).
- **Cloudreach — skipped.** Too small; leave it as the optional Rainbow Road.
- **Barik — TBD.** No boss/dungeon yet for the quake spirit. Could reuse
  Stormwatch Peak / the Undermaw / the catacombs, or get its own site.

> **Underwater dungeons are a new mode.** Both reef sites lean on
> below-waterline traversal the engine doesn't do yet — prototype the "under
> water level" feel once before committing both.

### Ashwing, the Enthralled — the Sunward dragon bookends — [built]

The Sunward Isle's climax is **Ashwing**, an old fire-wyrm who has warmed
Mount Kea's waters "since your grandmothers were girls." He is no monster —
only old, and kind, and tired — until **Vath seizes him** and turns him on
you, between you and the only way out. Beaten, he does not die: **you break
the chain instead of running him through**, and he is freed, grateful, and
becomes your lift up to the **Cloudreach**. He is a load-bearing proof of the
canonical rule (Backstory / craft note #2): *Vath cannot touch royal blood
directly, so he throws the creatures he controls at you.* Ashwing is that rule
made a boss.

The two turns are **matched animated cutscenes** (full-overlay, own rAF loop,
in the exact mold of the Act I throne-hall scene — `js/35-dragon-cutscenes.js`,
rendering the game's own `drawDragon` art with its `ensAmt` violet wash):

- **The enthrall — before the fight.** From `dragonLairSpeak` ("Stand and
  fight"): Vath's violet pours in from the dark, Ashwing rears against it and
  loses, an eye opens in the stone, and he turns on you (**ASHWING,
  ENTHRALLED**). Hands straight to the fight (`awakenDragon(true)`, already
  bound — the chamber's Dragon Gate seals behind you).
- **The freeing — after the fight.** From `dragonFaints` (he faints, never
  falls): you hold the blade, drive your will into the binding, and the violet
  **shatters** — his own green floods back (**ASHWING, FREED**). Hands off to
  his offer of a lift to the Cloudreach.

> **The reusable bookend.** The freed-victim shape (enthralled → beaten →
> freed, "a victim, not a foe") is shared by the **Leviathan**, the **Weeping
> Warden**, and the **Rimebound** (all `enthrall`-entrance bosses that already
> run the lightweight on-canvas wash + a story-card freeing). The same
> overlay-cutscene template is the natural upgrade for those three.
>
> The **Leviathan** now takes it (`js/38-leviathan-cutscene.js`,
> `leviathanFreedCutscene`): a sea-surface mirror of the Ashwing FREED scene.
> The binding shatters and the violet drains from its hide, and — the reveal
> that used to live in a "Where it sank…" story-card afterward — the beast
> names the hand that bound it and we **see him**: a robed man on the
> breakwater, violet at his wrists, who turns and is gone. The thanks and the
> Vath reveal are one scene now; the story-card is retired. The **Weeping
> Warden** and the **Rimebound** are the two still on the old wash + card.

### The prophecy and the weapon — [new]

The **Stormreach catacombs** yield the prophecy → it names the Tidefarer's
weapon → the hunt leads back to **Emberwick / Orin** → an adjacent isle → the
Tidefarer's **grave**, her spirit, the **headstone strike**, the **royal-family
guardian fight**, and the **book** with the two gifts. This is the Act II climax.
See the Backstory section above for the full sequence.

> Reuses the game's headstone / tomb-mouth art and the guardian-spirit / wraith
> enemy family already in the engine.

---

## Act III — the battle for the capital

The sea to **Aldermere** finally opens.

- **Fight through the capital — [new].** Vath's magic cannot touch your blood,
  so he throws the thing that can: **the kingdom itself.** Battle his controlled
  soldiers and creatures across the capital. This is the "turn the whole kingdom
  against them" rule made playable — the reason the finale is a war, not a duel.
- **Face Vath — [new].** The two gifts converge: **Joan's slow-time** creates the
  openings and survives his onslaught; **Jaist's seal** finishes it. He is
  **sealed, not killed** — the Tidefarer's unfinished work, completed. Callback:
  *don't let Vath talk* (the waterfall lesson).
- **Free the King.** Your father, Vath's captive since Act I, is the rescue stake
  the finale pays off. **[open: is he freed, or is his fate the final cost?]**

---

## Suggested build order

1. **Slow-time ability** — self-contained, testable now; the marquee mechanic.
2. **Post-Stormreach open sailing** (capital gated) — a navigation/gating change.
3. **Island-spirit hazards** — Windsurf winds, Barik quakes, Sunwick ash — as
   world hazards + set dressing, one isle at a time.
4. **Isle dungeons & bosses** — one per isle, tied to its spirit. Prototype the
   underwater mode first, then Windsurf's temple, then settle Barik.
5. **Emberwick Tidefarer tomb** (Act II climax) — the reveal, headstone strike,
   guardian fight, and the book granting the two gifts. Ties mechanic (1) to
   story.
6. **The capital assault** (Act III) — controlled-troop encounters across
   Aldermere and the Vath finale (slow-time + seal).

---

## Open questions

- **Name-set** — adopt the reconciliation table above? Settle "Sunwick" vs "The
  Sunward Isle," and the Tidefarer's exact generation.
- **Free sailing vs. chain** — fully open the map after Stormreach, or keep soft
  story gates? What does "any isle but the capital" include (Frozen, Aerie,
  Cloudreach)?
- **Slow-time cost & feel** — MP drain, cooldown, or charge meter? How much does
  time slow, and does the player also speed up, or just the world slow?
- **Spirit hazards — punishing or flavor?** Do quakes/gusts/ash deal damage and
  gate paths, or mostly dress the isle until you calm the spirit?
- **Barik's dungeon & boss** — its own new site, or reuse Stormwatch Peak / the
  Undermaw / the catacombs?
- **Stormreach's reef vs. its catacomb** — does the new reef dungeon replace the
  existing Drowned Catacomb, or sit alongside it?
- **Underwater traversal** — swimming, a diving mechanic, drained/flooded rooms?
  Prototype before committing two of them.
- **Boss = spirit, or guardian?** Is each isle boss the maddened spirit itself,
  or a guardian standing between you and calming it?
- **Act II boss gating — mandatory or optional?** Must every isle boss fall
  before Act III opens, or can the player enter the finale having skipped some?
  Once cleared, do the dungeons stay open within Act II or lock behind you?
- **The brother's seal in the finale** — a controlled ally, a scripted cutscene
  role, or a mechanic you protect during the Vath fight?
- **The King's fate** — freed in the finale, or is his loss the final cost?
