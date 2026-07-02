# AGS art brief — checklist for your own AI agent

A practical brief for generating artwork with a separate AI tool and importing it
into Alien Guitar Secrets (AGS). Hand the relevant section to your image AI, get
the files back, and send them to me to wire in.

Everything must fit the AGS look: **cosmic / deep-space, dark backdrop, neon
accents (electric purple `#6A00FF`, cyan `#00BFFF`, alien teal `#00FFD5`),
premium and a little sci-fi.**

---

## READ THIS FIRST — two very different kinds of asset

There are two buckets, and they import very differently. This matters a lot for
how much work it is.

### Bucket A — Avatars = real picture files (easy to import)
The avatars already ARE photo image files in the app. If your AI produces new
ones in the same size and naming, I can drop them straight in. **Low effort.**

### Bucket B — Guitars, amps, picks, pedals = currently drawn by code, NOT pictures
Right now the app does **not** use any picture files for guitars, amps, picks or
pedals. It draws every one of them from instructions in code (colours, shape,
hardware), so they can spin in 3D and recolour instantly. There are no image
files to "replace".

So if you want **picture-based** guitars/amps/picks/pedals instead, that is a
bigger change, and you need to decide the trade-off:

- **Pros of switching to pictures:** they can look as rich/photoreal as your AI
  can make them.
- **Cons of switching to pictures:** you lose the live 3D spin and the instant
  recolouring; every item becomes a fixed flat image; and I have to build a new
  picture-based display to replace the code-drawn one (extra work on my side).

**Decision needed from you (per item type):** keep the current code-drawn art, or
switch that type over to imported pictures? You can mix — e.g. keep guitars
code-drawn but bring in picture amps. Tell me which, and I'll set it up.

The specs below for Bucket B assume you have chosen pictures for that type.

---

## Universal rules (apply to every asset)

- [ ] **Format:** PNG.
- [ ] **Background:** transparent (no backdrop) for everything EXCEPT avatars
      (avatars keep their dark cosmic backdrop — see below).
- [ ] **One subject per file**, centred, generous even margins, not cropped at
      the edges.
- [ ] **Consistent camera angle and lighting across a whole set** — all picks
      shot the same way, all amps the same way, etc. Mismatched angles look broken
      in a grid.
- [ ] **Consistent scale** within a set (a "mythic" pick and a "common" pick
      should be roughly the same size in frame).
- [ ] **No real brand names or logos.** The app deliberately uses made-up brands
      (e.g. "BOZZ", "MARSDEN", "VOXEN") and "inspired by" naming. Do not put
      Fender/Gibson/Boss/Marshall etc. names, headstock logos, or exact trademarked
      shapes on anything.
- [ ] **Naming:** use the EXACT filenames in the tables below. The app matches art
      to items by filename. A typo = a missing image.
- [ ] **Keep file size sensible.** Photoreal PNGs get heavy. The 60 avatars alone
      are ~87 MB, which is already a lot for a phone app. Aim for the smallest file
      that still looks good; I can compress further on import.
- [ ] Deliver each set in its own folder, filenames lowercase, no spaces.

---

## 1. AVATARS (Bucket A — drop-in ready)

The player's character: a head-and-shoulders portrait of a being.

- [ ] **Size:** 896 × 1280 px (portrait, 7:10). Keep this ratio; you may go larger
      at the same ratio (e.g. 1344 × 1920) for sharper images.
- [ ] **Framing:** head and shoulders, face centred, eyes about a third down from
      the top. Looking toward camera.
- [ ] **Background:** keep a dark cosmic backdrop (deep space, subtle nebula/stars,
      soft rim light in purple/cyan/teal). NOT transparent.
- [ ] **Style:** photoreal / cinematic portrait, consistent across all 60 so they
      look like one set.
- [ ] **EYES — make them warm and loving.** Soft, kind, friendly eyes with a gentle
      catch-light; a faint, warm almost-smile in the eyes. Avoid cold, blank,
      aggressive or "dead" stares. This applies to every being, aliens included
      (a Grey can still look gentle and benevolent).

### The six beings (species)
- **Human** — ordinary human.
- **Nordic** — tall, fair, classic "Nordic alien" human-like look.
- **Pleiadian** — ethereal, luminous, beautiful human-like being.
- **Hybrid** — human/alien mix: mostly human with subtle alien hints (slightly
  larger eyes, finer features).
- **Grey** — classic grey alien: smooth grey skin, large dark almond eyes, no
  hair. (Still give it gentle, loving eyes.)
- **Reptilian** — humanoid reptile: scaled skin, ridged brow, no hair.

### What varies
- **Gender:** male and female for every being.
- **Hair colour (human-like beings only):** Black, Brown, Blonde, Red, Silver,
  Blue, Violet. (Grey and Reptilian have no hair — one image per gender.)

### Filenames (60 total) — use EXACTLY these
Human-like beings (human, nordic, pleiadian, hybrid) — one per hair colour:
```
avatar_<species>_<gender>_<hair>.png
```
where `<species>` = human | nordic | pleiadian | hybrid,
`<gender>` = male | female,
`<hair>` = black | brown | blonde | red | silver | blue | violet.

That is 4 species × 2 genders × 7 hair colours = **56 files**, e.g.:
- `avatar_human_male_brown.png`
- `avatar_nordic_female_silver.png`
- `avatar_pleiadian_female_violet.png`
- `avatar_hybrid_male_black.png`

Hairless beings (Grey = `alien`, Reptilian = `reptilian`) — one per gender:
```
avatar_alien_male.png
avatar_alien_female.png
avatar_reptilian_male.png
avatar_reptilian_female.png
```
That is **4 files**. 56 + 4 = **60 total**.

> Note: the Grey alien's files use the word `alien` (not `grey`). Keep that spelling.

---

## 2. GUITARS (Bucket B — only if you choose pictures over the current 3D)

- [ ] **Size:** 1024 × 1024 px, transparent background.
- [ ] **View:** whole guitar, **front on, neck pointing up**, same angle for all 31.
- [ ] **Style:** clean studio product shot, cosmic premium finish, soft neon rim
      light. No headstock logos.
- [ ] One file per guitar id, named `guitar_<id>.png`.

### The 31 guitars (id — name)
```
guitar_nebula-starter.png        Nebula Starter
guitar_comet-cruiser.png         Comet Cruiser
guitar_asteroid-axe.png          Asteroid Axe
guitar_lunar-lancer.png          Lunar Lancer
guitar_solar-spark.png           Solar Spark
guitar_plasma-drifter.png        Plasma Drifter
guitar_quasar-quake.png          Quasar Quake
guitar_pulsar-prime.png          Pulsar Prime
guitar_meteor-mauler.png         Meteor Mauler
guitar_vortex-vanguard.png       Vortex Vanguard
guitar_singularity-shredder.png  Singularity Shredder
guitar_eventide-eclipse.png      Eventide Eclipse
guitar_woodstock-white.png       Woodstock White Bolt
guitar_texas-number-one.png      Texas Flood No.1
guitar_black-strat.png           Comfortably Black
guitar_appetite-paul.png         Appetite Goldtop
guitar_number-one-lp.png         Stairway No.1
guitar_frankenstrat.png          Frankenbolt
guitar_polka-v.png               Polka Nova V
guitar_jem-floral.png            Lydian JEM-Star
guitar_js-chrome.png             Surfing Chrome
guitar_majesty.png               Majesty Starcrown
guitar_n4-natural.png            Extreme N-Nova
guitar_bullseye-lp.png           Bullseye Berserker
guitar_yngwie-cream.png          Vanilla Fury
guitar_greeny-burst.png          Greenstone Burst
guitar_at-burst.png              Melodic Maple Burst
guitar_spaceman-lp.png           Spaceman Smokestack
guitar_starchild-iceman.png      Starchild Mirror
guitar_demon-axe.png             Demon Axe Bass
guitar_ags-masterpiece.png       AGS Galactic Masterpiece
```
> The names hint at the vibe ("inspired by" real legends) — use them for mood, but
> keep shapes/finishes generic and logo-free.

---

## 3. AMPS (Bucket B — only if you choose pictures)

- [ ] **Size:** 1024 × 1024 px, transparent background, front on, same angle for all.
- [ ] **Style:** cosmic guitar amplifier/cabinet, glowing control panel, made-up
      brand badge only.
- [ ] One file per id, named `amp_<id>.png`.

### The 5 amps (combo / stack / fullstack)
```
amp_amp-pulse.png      Pulse Cube 15      (small practice combo)
amp_amp-orbit.png      Orbit Stack        (half stack: head on a 4x12 cab)
amp_amp-plasma.png     Plasma Halfstack   (glowing-tube half stack)
amp_amp-galaxy.png     Galaxy Fullstack   (head over a double stack of cabs)
amp_amp-bigbang.png    Big Bang Wall      (huge full stack, loudest rig)
```

---

## 4. PICKS (Bucket B — only if you choose pictures)

- [ ] **Size:** 512 × 512 px, transparent background, single plectrum, point down,
      same angle for all.
- [ ] **Style:** premium guitar pick with the named finish (holographic, foil,
      glitter, galaxy swirl, marble, neon glow, carbon weave, pearl, etc.).
- [ ] One file per id, named `pick_<id>.png`.

### The 17 picks (id — name)
```
pick_pick-onyx.png             Onyx Standard      (matte black)
pick_pick-solar.png            Solar Flare        (amber)
pick_pick-holo.png             Holographic Nebula
pick_pick-glitter.png          Quasar Glitter
pick_pick-foil.png             Stardust Foil      (mirror foil)
pick_pick-prism.png            Prism Pulsar
pick_pick-aurora.png           Aurora Pearl
pick_pick-singularity.png      Singularity        (neon, black-hole vibe)
pick_pick-glitter-cobalt.png   Cobalt Glitter
pick_pick-carbon.png           Carbon Vortex
pick_pick-neon-pink.png        Hot Pink Laser
pick_pick-neon-acid.png        Acid Pulse         (toxic green)
pick_pick-galaxy.png           Galaxy Swirl
pick_pick-marble.png           Marble Comet
pick_pick-holo-gold.png        Holo Gold
pick_pick-galaxy-void.png      Void Spiral
pick_pick-marble-obsidian.png  Obsidian Vein      (black marble + gold)
```

---

## 5. PEDALS (Bucket B — only if you choose pictures)

- [ ] **Size:** 768 × 768 px, transparent background, **top-down view of a guitar
      effects stompbox**, footswitch at the bottom, knobs at the top, same angle
      for all.
- [ ] **Style:** cosmic effects pedal; made-up brand text only (e.g. BOZZ, SONIK,
      TUBEROAR, FXR); knob count per the notes below.
- [ ] One file per id, named `pedal_<id>.png`.

### The 13 pedals (id — name)
```
pedal_pedal-fuzz.png          Fuzz Comet         (orange, 3 knobs)
pedal_pedal-delay.png         Echo Nebula        (blue, 3 knobs)
pedal_pedal-overdrive.png     Warp Drive         (green, 3 knobs)
pedal_pedal-chorus.png        Quantum Chorus     (purple, 3 knobs)
pedal_pedal-reverb.png        Black Hole Reverb  (near-black, 3 knobs)
pedal_pedal-distortion.png    Supernova Dist.    (red, 3 knobs)
pedal_pedal-boost.png         Toxic Boost        (green sparkle, 3 knobs)
pedal_pedal-holo.png          Hologram Haze      (holographic shell, 3 knobs)
pedal_pedal-sparkle.png       Stardust Drive     (pink sparkle, 3 knobs)
pedal_pedal-tremolo.png       Pulse Tremolo      (blue sparkle, 3 knobs)
pedal_pedal-chrome.png        Chrome Phaser      (chrome, 1 knob)
pedal_pedal-flange.png        Solar Flange       (orange holo, 3 knobs)
pedal_pedal-octave.png        Quantum Octave     (black holo, 1 knob)
```

---

## 6. STRAPS (optional — Bucket B, currently code-drawn)

If you also want picture straps:
- [ ] **Size:** 1024 × 1024 px, transparent background, strap laid out (slight
      curve or straight), same angle for all.
- [ ] One file per id, named `strap_<id>.png`. There are 18 straps (Cadet Webbing,
      Comet Tail, Woven Galaxy, Meteor Leather, Plasma Weave, Eclipse Royale, Star
      Studded, Pulse Chevron, Diamond Lattice, Solar Chevron, Gold Rivet, Ice
      Lattice, Hot Rod Flames, Cosmic Leopard, Thunder Bolt, Nebula Tie-Dye, Zebra
      Static, Prism Rainbow). Ask me for the exact id list if you go this route.

---

## Copy-paste prompt templates

Replace the **bold** bits per item. Run one consistent "style seed" across a whole
set so they match.

**Avatar:**
> Photoreal cinematic head-and-shoulders portrait of a **female Pleiadian** being,
> **silver hair**, gentle warm loving eyes with a soft catch-light and a faint kind
> almost-smile, looking toward camera. Dark deep-space background with a subtle
> nebula and soft purple/cyan rim light. Centred, eyes a third from the top.
> 896×1280 portrait. No text, no logo.

**Guitar:**
> Studio product shot of a futuristic electric guitar, front on, neck pointing up,
> **<finish/colour vibe from the name>**, cosmic premium look with soft neon rim
> light, on a fully transparent background. No brand name or headstock logo. 1024×1024,
> centred with even margins.

**Amp:**
> Studio product shot of a cosmic guitar **<combo / half stack / full stack>**
> amplifier, front on, glowing control panel, made-up brand badge only, transparent
> background, soft neon rim light. 1024×1024, centred.

**Pick:**
> A single premium guitar plectrum, point down, **<finish: e.g. holographic
> nebula>** finish, studio lighting, transparent background. 512×512, centred.

**Pedal:**
> Top-down view of a guitar effects stompbox, footswitch at bottom, **<N>** knobs at
> top, **<colour>** enclosure with **<accent>** graphics, made-up brand text only,
> transparent background. 768×768, centred.

---

## Hand-back checklist (what to send me)

- [ ] All files named EXACTLY as in the tables (lowercase, no spaces).
- [ ] PNG; transparent background for guitars/amps/picks/pedals/straps; dark cosmic
      backdrop for avatars.
- [ ] Consistent angle, lighting and scale within each set.
- [ ] No real brand names/logos.
- [ ] For each Bucket B type, tell me your decision: **keep code-drawn** or **switch
      to these pictures** (and whether it's for the web app, the phone app, or both).
- [ ] Zip each set in its own folder and send them over — I'll import and wire them up.
```
