// Boss Character Cards — the named antagonists of the AGS galaxy.
//
// Each character pairs with a BossBattle entry (see bossBattles.ts) to give
// the boss fight a face, a backstory, and a visual identity. Characters are
// intentionally separate from the battle config so the card can be rendered
// anywhere (intro screen, galaxy map, trophy wall) without pulling in the
// question-generation logic.
//
// Images live in /public/characters/<id>/ as:
//   bust.png          — upper-body portrait used as the card hero image
//   full.png          — full-body avatar (used in Avatar Front gallery slot)
//   guitar.png        — signature guitar, full view
//   guitar-closeup.png — body/detail crop of the signature guitar
//
// Add new characters by appending to BOSS_CHARACTERS and dropping their
// images into the matching /public/characters/<id>/ folder.

export type BossAttribute = { label: string; value: number }; // 0–10

export interface BossCharacter {
  /** Matches the `system` number in BossBattle, e.g. 1 for system 1. */
  system: number;
  /** Unique slug used for the image folder, e.g. "ingvar". */
  id: string;
  /** First line of the name, displayed in gold. */
  name: string;
  /** Second line of the name, displayed in the accent colour. Optional. */
  nameAccent?: string;
  /** Short titles shown below the name in small caps. */
  titles: string[];
  /** Home planet / origin world. */
  planet: string;
  /** Origin story paragraphs (shown on the card). */
  originStory: string[];
  /** Signature quote. */
  quote: string;
  /** Primary skill description. */
  specialty: string;
  /** Named special ability and its description. */
  specialAbility: { name: string; description: string };
  /** Named guardian power and its description. */
  guardianPower: { name: string; description: string };
  /** Fun-fact bullet points. */
  funFacts: string[];
  /** Stat bars — ordered as they appear on the card. */
  attributes: BossAttribute[];
  /** What the player must do to unlock this boss. */
  unlockRequirement: string;
  /** Stars 1–5. */
  difficulty: number;
  /** Italicised tagline next to the difficulty stars. */
  difficultyTagline: string;
  /** Hex accent colour for borders, glows and accent text on the card. */
  accentColor: string;
}

// ---------------------------------------------------------------------------
// System 1 — Ingvar Mor-Ismor
// Guardian of notes / fretboard mastery
// ---------------------------------------------------------------------------
export const INGVAR_MOR_ISMOR: BossCharacter = {
  system: 1,
  id: "ingvar",
  name: "INGVAR",
  nameAccent: "MOR-ISMOR",
  titles: ["Guardian of Infinite Velocity", "Keeper of the Endless Arpeggio"],
  planet: "Arpeggion Prime",
  originStory: [
    "Born in the ice-capped fjords of Arpeggion Prime, Ingvar Mor-Ismor was blessed with perfect pitch, perfect technique, and absolutely zero humility.",
    "While others chased tone, he chased infinity. While others played notes, he conquered them.",
  ],
  quote:
    "Why play fewer notes when there are infinitely more waiting to be discovered?",
  specialty:
    "Arpeggios, modes, speed, harmonic minor & fretboard precision.",
  specialAbility: {
    name: "Infinite Cascade",
    description:
      "Unleashes an endless stream of arpeggios so fast it bends spacetime and makes metronomes cry.",
  },
  guardianPower: {
    name: "Unlimited Ego",
    description:
      'Immune to "less is more." Gains more power the more he plays.',
  },
  funFacts: [
    "Practices 16 hours a day. Before breakfast.",
    "Has played every note in existence. Twice.",
    "His hair has its own zip code.",
    "Believes silence is a waste of good time.",
  ],
  attributes: [
    { label: "Speed", value: 10 },
    { label: "Technique", value: 10 },
    { label: "Creativity", value: 8 },
    { label: "Tone", value: 8 },
    { label: "Stamina", value: 9 },
    { label: "Style", value: 7 },
  ],
  unlockRequirement: "Complete all Speed Trials and earn 75,000 XP",
  difficulty: 5,
  difficultyTagline: "Only the determined can handle more.",
  accentColor: "#b48cff",
};

// ---------------------------------------------------------------------------
// System 2 — Hemi Jendritz
// Guardian of Cosmic Expression / expression, bending, blues-rock
// ---------------------------------------------------------------------------
export const HEMI_JENDRITZ: BossCharacter = {
  system: 2,
  id: "hemi",
  name: "HEMI",
  nameAccent: "JENDRITZ",
  titles: ["Guardian of Cosmic Expression", "Keeper of the Infinite Vibe"],
  planet: "Vibelandia Prime",
  originStory: [
    "Born beneath the psychedelic moons of Vibelandia Prime, Hemi Jendritz discovered early that music wasn't merely something you played...",
    "It was something you became.",
    "While others practised scales, Hemi practised freedom. While others chased perfection, Hemi chased feeling.",
    "Armed with a backwards Strat and a pocket full of cosmic stardust, he learned to bend notes, minds and occasionally the laws of physics.",
    "Legends say a single sustained note from Hemi once caused an entire solar system to spontaneously grow afros.",
  ],
  quote: "If you're not feeling it... you're not really playing it.",
  specialty:
    "Expression, Vibrato, Bending, Blues-Rock Improvisation & Stage Presence.",
  specialAbility: {
    name: "Cosmic Vibrato",
    description:
      "Unleashes a sustained note so powerful that strings begin vibrating on nearby planets, audience members forget what day it is, and guitar solos gain +300% soul.",
  },
  guardianPower: {
    name: "Purple Haze Field",
    description:
      "Creates an aura of pure musical freedom. Immune to overthinking. Notes automatically gain feeling. Makes metronomes slightly nervous.",
  },
  funFacts: [
    "Never plays the same solo twice.",
    "Once bent a note so far it arrived tomorrow.",
    "Owns seventeen identical red headbands.",
    "Believes every mistake is just a future lick.",
    "Can communicate with wah pedals telepathically.",
  ],
  attributes: [
    { label: "Speed", value: 6 },
    { label: "Technique", value: 7 },
    { label: "Creativity", value: 10 },
    { label: "Tone", value: 9 },
    { label: "Stamina", value: 8 },
    { label: "Style", value: 9 },
  ],
  unlockRequirement: "Complete all Expression Challenges and earn 65,000 XP",
  difficulty: 4,
  difficultyTagline: "Feel first. Think later.",
  accentColor: "#f59e0b",
};

// ---------------------------------------------------------------------------
// System 3 — Shreddy Han Velan
// Destroyer of Clean Tones / speed, shred, metal
// ---------------------------------------------------------------------------
export const SHREDDY_HAN_VELAN: BossCharacter = {
  system: 3,
  id: "shreddy",
  name: "SHREDDY",
  nameAccent: "HAN VELAN",
  titles: ["Destroyer of Clean Tones", "Lord of the Whammy Bar"],
  planet: "Infernax IV",
  originStory: [
    "Forged in the molten core of Infernax IV, Shreddy Han Velan learned guitar by playing through active volcanos. The distortion was free.",
    "He has never played below 11. He doesn't know what 11 means. He just keeps turning it up.",
  ],
  quote: "Why use one pedal when you can use seventeen?",
  specialty:
    "Alternate picking, sweep arpeggios, dive bombs, and making sound engineers cry.",
  specialAbility: {
    name: "Hellfire Cascade",
    description:
      "Unleashes a wall of gain so thick it bends the laws of physics and melts the front row.",
  },
  guardianPower: {
    name: "Tone Destroyer",
    description:
      'Immune to "less is more." Every note adds +10% distortion to the room.',
  },
  funFacts: [
    "Has never played a clean tone. Not once.",
    "Owns 47 overdrive pedals. Uses all of them at once.",
    "His pick has a restraining order against other picks.",
    "Once shredded so hard the frets melted. He called it an upgrade.",
  ],
  attributes: [
    { label: "Speed", value: 9 },
    { label: "Technique", value: 9 },
    { label: "Creativity", value: 4 },
    { label: "Tone", value: 6 },
    { label: "Stamina", value: 9 },
    { label: "Style", value: 7 },
  ],
  unlockRequirement: "Complete all Shred Trials and survive 50,000 XP of pure chaos",
  difficulty: 5,
  difficultyTagline: "Not for the faint-hearted.",
  accentColor: "#ef4444",
};

// ---------------------------------------------------------------------------
// System 4 — Vairon
// Architect of Sound / harmonics, tapping, legato, sound design
// ---------------------------------------------------------------------------
export const VAIRON: BossCharacter = {
  system: 4,
  id: "vairon",
  name: "VAIRON",
  titles: ["Architect of Sound", "Keeper of Infinite Possibility"],
  planet: "Sonica Prime",
  originStory: [
    "Born amongst the floating harmonic crystal cities of Sonica Prime, Vairon discovered at an early age that music was more than sound — it was architecture.",
    "While other musicians learned scales, Vairon learned to sculpt frequencies into living structures.",
    "Legends claim he once built an entire floating city using nothing but harmonics, sustain and imagination.",
    "Today he wanders the Fretboard Universe searching for sounds that have never existed before.",
  ],
  quote: "Every note already exists somewhere in the universe. My job is to find it.",
  specialty:
    "Legato, Two-Handed Tapping, Whammy Bar Techniques, Harmonics, Musical Creativity & Sound Design.",
  specialAbility: {
    name: "Infinite Resonance",
    description:
      "Creates cascading waves of harmonics that multiply every note played nearby. Doubles creativity output, unlocks hidden frequencies, and makes ordinary licks sound extraordinary.",
  },
  guardianPower: {
    name: "Architect of Sound",
    description:
      "Can shape pure sound into structures, pathways and portals. Creates sonic bridges between dimensions, generates harmonic force fields, and transforms imagination into reality.",
  },
  funFacts: [
    "Has never played the same solo twice.",
    "Can hear frequencies invisible to most lifeforms.",
    "Once got lost inside his own delay pedal.",
    "Owns over 300 ceremonial whammy bars.",
    "Claims every guitar already contains infinite songs.",
  ],
  attributes: [
    { label: "Speed", value: 10 },
    { label: "Technique", value: 10 },
    { label: "Creativity", value: 10 },
    { label: "Tone", value: 10 },
    { label: "Stamina", value: 9 },
    { label: "Style", value: 10 },
  ],
  unlockRequirement: "Complete all Harmonic Trials and earn 90,000 XP",
  difficulty: 5,
  difficultyTagline: "Imagine it. Hear it. Become it.",
  accentColor: "#38bdf8",
};

// ---------------------------------------------------------------------------
// System 5 — Mo "Curly" Pastrami
// Guardian of Infinite Flow / groove, legato, melody, improvisation
// ---------------------------------------------------------------------------
export const MO_CURLY_PASTRAMI: BossCharacter = {
  system: 5,
  id: "mo",
  name: "MO 'CURLY' PASTRAMI",
  titles: ["Guardian of Infinite Flow", "Keeper of the Eternal Groove"],
  planet: "Tidalia Prime",
  originStory: [
    "Born on the ocean world of Tidalia Prime, Mo 'Curly' Pastrami grew up riding sonic waves generated by the planet's musical tides.",
    "While most Guardians trained for speed or technical perfection, Mo discovered something far more powerful — Flow.",
    "The great tidal reefs of Tidalia resonate with harmonic frequencies that can only be heard by those who truly listen.",
    "Through years of surfing both oceans and melodies, Mo learned to merge rhythm, expression and movement into a single force.",
  ],
  quote: "The wave already knows where it's going. Just ride it.",
  specialty:
    "Melodic Improvisation, Legato, Groove, Feel, Phrasing & Musical Storytelling.",
  specialAbility: {
    name: "Sonic Tide",
    description:
      "Summons a massive wave of harmonic energy that carries every note perfectly into the pocket. Boosts groove by 200%, increases melodic awareness, and makes bad timing impossible.",
  },
  guardianPower: {
    name: "Infinite Flow",
    description:
      "The longer Mo plays, the stronger he becomes. Immune to overthinking, unlocks spontaneous creativity, and converts mistakes into musical ideas.",
  },
  funFacts: [
    "Surfs black holes for fun.",
    "Once improvised a solo for three days straight.",
    "Has never owned a metronome.",
    "Can detect a wrong note from another solar system.",
    "His hair has its own weather system.",
  ],
  attributes: [
    { label: "Speed", value: 9 },
    { label: "Technique", value: 9 },
    { label: "Creativity", value: 10 },
    { label: "Tone", value: 10 },
    { label: "Stamina", value: 9 },
    { label: "Style", value: 10 },
  ],
  unlockRequirement: "Complete all Groove Challenges and earn 70,000 XP",
  difficulty: 4,
  difficultyTagline: "Ride the wave. Shred everything.",
  accentColor: "#14b8a6",
};

// ---------------------------------------------------------------------------
// System 6 — Arygmor
// Guardian of the Eternal Blues Flame / blues, vibrato, bending, soul
// ---------------------------------------------------------------------------
export const ARYGMOR: BossCharacter = {
  system: 6,
  id: "arygmor",
  name: "ARYGMOR",
  titles: ["Guardian of the Eternal Blues Flame", "Keeper of the Soulfire Note"],
  planet: "Moratha IX",
  originStory: [
    "Born in the Bluesfire Mountains of Moratha IX, where every melody must survive the fires of hardship before it can be called music.",
    "Arygmor did not learn scales — he learned to survive. And in that survival, he discovered the most powerful force in the universe: soul.",
    "The inhabitants of Moratha IX believe one perfect note forged in genuine emotion is worth more than a thousand technically flawless ones.",
    "Today Arygmor wanders the Fretboard Universe carrying the Eternal Blues Flame — a force that transforms pain into music and setbacks into inspiration.",
  ],
  quote: "Don't play the blues... become the blues.",
  specialty:
    "Blues Guitar, Emotional Expression, Vibrato, String Bending, Sustain & Melodic Soloing.",
  specialAbility: {
    name: "Soulfire Bend",
    description:
      "A single bend so emotional it ignites the hearts of everyone within hearing distance. Grants +300% Emotion, restores confidence, inspires creativity, and weakens robotic playing.",
  },
  guardianPower: {
    name: "Eternal Blues Flame",
    description:
      "A mystical force that transforms pain into music. Converts setbacks into inspiration, strengthens emotional expression, and makes every note tell a story.",
  },
  funFacts: [
    "Once held a note for seventeen minutes.",
    "Can make a guitar cry on command.",
    "Believes one perfect note is worth a thousand fast ones.",
    "Refuses to rush a solo.",
    "The Blues Council once declared him a national treasure.",
  ],
  attributes: [
    { label: "Speed", value: 7 },
    { label: "Technique", value: 9 },
    { label: "Creativity", value: 9 },
    { label: "Tone", value: 10 },
    { label: "Stamina", value: 9 },
    { label: "Style", value: 10 },
  ],
  unlockRequirement: "Complete all Blues Flame Trials and earn 85,000 XP",
  difficulty: 5,
  difficultyTagline: "Don't play the blues... become the blues.",
  accentColor: "#f97316",
};

// ---------------------------------------------------------------------------
// System 7 — Sandy Toads
// Guardian of the Eternal Shredstorm / arpeggios, speed, discipline, classical metal
// ---------------------------------------------------------------------------
export const SANDY_TOADS: BossCharacter = {
  system: 7,
  id: "sandy",
  name: "SANDY TOADS",
  titles: ["Guardian of the Eternal Shredstorm", "Keeper of the Celestial Polka Flame"],
  planet: "Shredtoria Prime",
  originStory: [
    "Born on Shredtoria Prime — a world of floating marble mountains, classical temples and endless lightning storms where music and discipline are sacred forces.",
    "Sandy spent his youth studying both the ancient scrolls of harmony and the sacred art of high-velocity guitar playing.",
    "Unlike many Guardians who relied purely on speed, Sandy believed true mastery came from balancing precision, melody and discipline.",
    "After scaling the legendary Mount Arpeggius and surviving the Great Lightning Solo Storm, Sandy unlocked the Celestial Polka Flame.",
  ],
  quote: "Speed means nothing unless every note matters.",
  specialty:
    "Classical-Inspired Shredding, Arpeggios, Precision Picking, Harmonic Minor Mastery, Melodic Soloing & Discipline.",
  specialAbility: {
    name: "Celestial Shredstorm",
    description:
      "Summons a vortex of lightning-fast arpeggios and scale sequences. Grants +300% Picking Accuracy, +200% Speed, and temporarily slows time perception.",
  },
  guardianPower: {
    name: "Polka Flame Ascension",
    description:
      "Channels the ancient power of the Celestial Flame through his legendary polka-dot guitar. Enhances precision, amplifies technique, and unlocks advanced musical awareness.",
  },
  funFacts: [
    "Practices scales while sleeping.",
    "Can play arpeggios faster than most beings can think.",
    "Owns over 500 polka-dot capes.",
    "Once climbed Mount Arpeggius carrying three guitars.",
    "Believes discipline is the secret superpower.",
  ],
  attributes: [
    { label: "Speed", value: 10 },
    { label: "Technique", value: 10 },
    { label: "Creativity", value: 9 },
    { label: "Tone", value: 9 },
    { label: "Stamina", value: 10 },
    { label: "Style", value: 10 },
  ],
  unlockRequirement: "Complete all Shredstorm Trials and earn 95,000 XP",
  difficulty: 5,
  difficultyTagline: "Practice until the impossible becomes easy.",
  accentColor: "#eab308",
};

// ---------------------------------------------------------------------------
// System 8 — Levy Clay Storm (LCS)
// Guardian of the Infinite Flood / blues, bending, tone, Texas shuffle
// ---------------------------------------------------------------------------
export const LEVY_CLAY_STORM: BossCharacter = {
  system: 8,
  id: "lcs",
  name: "LEVY CLAY STORM",
  titles: ["Guardian of the Infinite Flood", "Keeper of the Texas Thunder"],
  planet: "Texarion Prime",
  originStory: [
    "Born beneath the endless thunderclouds of Texarion Prime — a scorching desert world where colossal storms roll across crimson canyons and every lightning strike sounds like a cranked tube amplifier.",
    "Levy Clay Storm learned that true power wasn't found in speed alone. It lived in touch. In feel. In the space between the notes.",
    "While others chased complexity, Levy mastered the art of making a single note speak louder than an entire galaxy of scales.",
    "Today he travels the Fretboard Universe carrying the legendary storms of Texarion Prime wherever he plays.",
  ],
  quote: "One perfect note can change the universe.",
  specialty:
    "Blues, Double Stops, String Bending, Shuffle Groove, Texas Blues & Emotional Soloing.",
  specialAbility: {
    name: "Texas Floodgate",
    description:
      "Summons a tidal wave of blues energy that overwhelms opponents with pure feel and tone. Grants +300% Tone, +200% Soul, and restores Groove Energy.",
  },
  guardianPower: {
    name: "Infinite Bend",
    description:
      "Can bend notes beyond normal physical limits, creating rifts in space-time and emotional damage to nearby listeners.",
  },
  funFacts: [
    "Can break strings using emotion alone.",
    "Has never played a weak shuffle.",
    "Thunderstorms follow him across planets.",
    "Claims every guitar sounds better loud.",
    "Once sustained a note for an entire lunar cycle.",
  ],
  attributes: [
    { label: "Speed", value: 9 },
    { label: "Technique", value: 10 },
    { label: "Creativity", value: 9 },
    { label: "Tone", value: 10 },
    { label: "Stamina", value: 10 },
    { label: "Style", value: 10 },
  ],
  unlockRequirement: "Complete all Texas Flood Trials and earn 90,000 XP",
  difficulty: 5,
  difficultyTagline: "Feel first. Speed second.",
  accentColor: "#3b82f6",
};

// ---------------------------------------------------------------------------
// System 9 — Nena Craus
// Guardian of the Solar Shredstorm / speed, alternate picking, discipline, modern shred
// ---------------------------------------------------------------------------
export const NENA_CRAUS: BossCharacter = {
  system: 9,
  id: "nena",
  name: "NENA CRAUS",
  titles: ["Guardian of the Solar Shredstorm", "Keeper of the Celestial Velocity Core"],
  planet: "Valkyria Nova",
  originStory: [
    "Born beneath the twin suns of Valkyria Nova — a world where floating crystal citadels orbit giant purple suns and every citizen trains in the arts of discipline, precision and performance.",
    "While others relied on talent, Nena devoted herself to relentless training, mastering every challenge placed before her.",
    "After conquering the legendary Velocity Peaks and defeating the Mechanical Titans of Nova Sector Seven, she unlocked the Celestial Velocity Core.",
    "Today she serves as one of the most feared and respected Guardians in the Fretboard Universe.",
  ],
  quote: "Talent opens the door. Discipline breaks it down.",
  specialty:
    "Alternate Picking, Modern Shred, Precision Technique, Stage Performance, Speed Training & Musical Discipline.",
  specialAbility: {
    name: "Velocity Surge",
    description:
      "Channels pure kinetic energy through her guitar, dramatically increasing speed and accuracy. Grants +300% Picking Speed, +200% Precision, and temporarily slows enemy reaction time.",
  },
  guardianPower: {
    name: "Starfire Ascension",
    description:
      "Transforms momentum into raw musical power. Increases attack speed, enhances endurance, and unlocks advanced technique combinations.",
  },
  funFacts: [
    "Practices before breakfast, lunch and dinner.",
    "Once defeated a boss battle without missing a note.",
    "Can alternate pick faster than most starships accelerate.",
    "Owns a collection of cosmic battle guitars.",
    "Never skips warm-ups.",
  ],
  attributes: [
    { label: "Speed", value: 10 },
    { label: "Technique", value: 10 },
    { label: "Creativity", value: 9 },
    { label: "Tone", value: 9 },
    { label: "Stamina", value: 10 },
    { label: "Style", value: 10 },
  ],
  unlockRequirement: "Complete all Velocity Trials and earn 95,000 XP",
  difficulty: 5,
  difficultyTagline: "Train harder. Play louder.",
  accentColor: "#a855f7",
};

// ---------------------------------------------------------------------------
// System 10 — Hansy Mittons
// Guardian of Infinite Melody / melody, phrasing, sustain, dynamics, songcraft
// ---------------------------------------------------------------------------
export const HANSY_MITTONS: BossCharacter = {
  system: 10,
  id: "hansy",
  name: "HANSY MITTONS",
  titles: ["Guardian of Infinite Melody", "Keeper of the Resonance Current"],
  planet: "Harmonia Prime",
  originStory: [
    "Born amongst the floating resonance islands of Harmonia Prime — a world where melodies drift through the skies like clouds and every mountain resonates with harmonic frequencies.",
    "While other Guardians chased speed and complexity, Hansy devoted himself to crafting melodies capable of travelling across entire solar systems.",
    "Legend says a single melody from Hansy once ended a thousand-year war without a single word being spoken.",
    "Today he serves as the melodic heart of the Fretboard Universe.",
  ],
  quote: "The right note at the right time is worth more than a thousand notes played too fast.",
  specialty: "Melody, Phrasing, Sustain, Dynamics, Songcraft & Emotional Expression.",
  specialAbility: {
    name: "Infinite Sustain",
    description:
      "Creates a harmonic field where every note blooms endlessly through space and time. Grants +300% Sustain, +200% Emotional Impact, and amplifies melodic awareness.",
  },
  guardianPower: {
    name: "Resonance Cascade",
    description:
      "Transforms simple melodies into powerful waves of inspiration. Strengthens nearby allies, increases creativity, and unlocks hidden musical pathways.",
  },
  funFacts: [
    "Can remember every melody he has ever played.",
    "Has never rushed a guitar solo.",
    "Once sustained a note across three dimensions.",
    "Believes every note deserves a purpose.",
    "Owns the largest collection of delay pedals in Harmonia Prime.",
  ],
  attributes: [
    { label: "Speed", value: 9 },
    { label: "Technique", value: 10 },
    { label: "Creativity", value: 9 },
    { label: "Tone", value: 10 },
    { label: "Stamina", value: 9 },
    { label: "Style", value: 10 },
  ],
  unlockRequirement: "Complete all Resonance Trials and earn 80,000 XP",
  difficulty: 4,
  difficultyTagline: "Make every note matter.",
  accentColor: "#10b981",
};

// ---------------------------------------------------------------------------
// All characters — add new ones here as they arrive.
// ---------------------------------------------------------------------------
export const BOSS_CHARACTERS: BossCharacter[] = [
  INGVAR_MOR_ISMOR,
  HEMI_JENDRITZ,
  SHREDDY_HAN_VELAN,
  VAIRON,
  MO_CURLY_PASTRAMI,
  ARYGMOR,
  SANDY_TOADS,
  LEVY_CLAY_STORM,
  NENA_CRAUS,
  HANSY_MITTONS,
];

/** Look up a character by solar-system number. Returns undefined if not yet added. */
export function getBossCharacter(system: number): BossCharacter | undefined {
  return BOSS_CHARACTERS.find((c) => c.system === system);
}

/** Resolved public image URLs for a character. */
export function getBossCharacterImages(id: string) {
  const base = `/characters/${id}`;
  return {
    bust: `${base}/bust.png`,
    full: `${base}/full.png`,
    guitar: `${base}/guitar.png`,
    guitarCloseup: `${base}/guitar-closeup.png`,
  };
}
