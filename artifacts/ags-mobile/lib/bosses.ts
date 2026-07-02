/**
 * Boss character data for the mobile boss battle system.
 * Difficulty order (system 1 = easiest, system 10 = hardest):
 *   Nena → Sandy → LCS → Hemi → Arygmor → Ingvar → Hansy → Shreddy → Mo → Vairon
 *
 * Level unlock thresholds align with belt milestones in progression.ts.
 */
import type { Question } from "./drills";
import { makeQuestions } from "./drills";

export interface BossMobile {
  id: string;
  system: number;
  name: string;
  nameAccent?: string;
  planet: string;
  quote: string;
  specialty: string;
  accentColor: string;
  difficulty: number; // 1–5 stars
  difficultyTagline: string;
  unlockLevel: number;
  titles: string[];
  originStory: string[];
  specialAbility: { title: string; body: string };
  guardianPower: { title: string; body: string };
  funFacts: string[];
  trainingFocus: string[];
  /** 0-based index into bosses-sprite.png (4 cols × 2 rows, 384×512 per cell). -1 = no portrait. */
  portraitIndex: number;
  attributes: Array<{ label: string; value: number }>;
}

export const BOSSES: BossMobile[] = [
  {
    id: "nena",
    system: 1,
    name: "NENA CRAUS",
    planet: "Valkyria Nova",
    quote: "Talent opens the door. Discipline breaks it down.",
    specialty: "Alternate Picking, Modern Shred, Precision & Speed",
    accentColor: "#a855f7",
    difficulty: 1,
    difficultyTagline: "Your first challenge. Prove you mean it.",
    unlockLevel: 3,
    titles: ["Champion of the Fretboard Universe", "Guardian of the Final Frontier"],
    originStory: [
      "Valkyria Nova is the last star system before the edge of the known galaxy — a place where only the most determined travellers ever arrive. Nena Craus was born there. She has never been impressed by anything that wasn't earned.",
      "Where other prodigies relied on natural ability, Nena outworked everyone. Seven hours of practice before breakfast. Scales until her hands could not hold a pick. Then she put the pick down and kept going.",
      "She studied under every other Guardian before surpassing them all. Not because she is more gifted — because she refused to stop. The discipline she developed is so complete that talent became irrelevant.",
      "To reach Nena is to have already proven yourself. To beat her is to have become something new entirely.",
    ],
    specialAbility: {
      title: "Valkyria Strike",
      body: "A precisely executed series of alternate-picked passages at the absolute limit of human speed, each note landing with the force of absolute certainty. There is no slop. There is no escape.",
    },
    guardianPower: {
      title: "Unbreakable Discipline",
      body: "Nena's discipline is so complete that she cannot be rattled, slowed, or surprised. Every challenge makes her sharper. Every adversity refines her further. She does not have bad days.",
    },
    funFacts: [
      "Has practised every single day for 30 years. Without exception.",
      "Her warm-up routine takes 90 minutes. She considers this 'quick'.",
      "Claims she will one day hold the Fretboard Universe speed record. Nobody has disagreed yet.",
      "Sleeps four hours a night. The other twenty hours are accounted for.",
      "Once thanked an opponent for 'almost making her try'. They retired the next day.",
    ],
    trainingFocus: [
      "Natural notes on the first five frets of every string",
      "Perfect intervals: octave, perfect 5th and perfect 4th",
      "Minor pentatonic shape 1 in C, G and D",
      "Fretboard Notes and Intervals drills daily",
    ],
    portraitIndex: 5,
    attributes: [
      { label: "Speed", value: 6 },
      { label: "Technique", value: 6 },
      { label: "Creativity", value: 5 },
      { label: "Tone", value: 5 },
      { label: "Style", value: 6 },
    ],
  },
  {
    id: "hansy",
    system: 7,
    name: "HANSY MITTONS",
    planet: "Harmonia Prime",
    quote: "One note played with total conviction says more than a thousand played in a hurry.",
    specialty: "Melody, Phrasing, Sustain, Dynamics & Songcraft",
    accentColor: "#ec4899",
    difficulty: 3,
    difficultyTagline: "Less is everything.",
    unlockLevel: 35,
    titles: ["Guardian of the Perfect Melody", "Keeper of Musical Silence"],
    originStory: [
      "Harmonia Prime is so acoustically perfect that whispers carry for kilometres and a single guitar note can fill an entire valley. On such a world, restraint is not weakness — it is mastery.",
      "Hansy Mittons grew up studying silence as seriously as sound. On Harmonia, what you don't play is as important as what you do. Hansy understood this before the age of ten.",
      "Years of studying songcraft, melodic phrasing, and the architecture of dynamics produced a player who makes every note count. Audiences hold their breath between Hansy's notes because the space feels as meaningful as the music.",
      "To face Hansy is to face yourself. There is nowhere to hide behind speed or volume. Only the truth of your musical intent remains.",
    ],
    specialAbility: {
      title: "The Perfect Phrase",
      body: "Hansy plays a single melodic phrase so perfectly constructed that it renders all other musical arguments irrelevant. The phrase lingers in memory for days and makes everything else sound cluttered.",
    },
    guardianPower: {
      title: "Musical Silence",
      body: "Hansy weaponises space. The rests between notes carry as much weight as the notes themselves, creating a gravitational pull that draws the listener deeper and deeper into the music until escape is no longer possible.",
    },
    funFacts: [
      "Their longest recorded note lasted 47 seconds.",
      "Once silenced a room of 10,000 by playing three notes.",
      "Has never needed more than one take in a recording studio.",
      "Their songs have been described as 'architectural'. They consider this accurate.",
      "The mittens are not optional. No one has ever asked why.",
    ],
    trainingFocus: [
      "All seven modes across all 11 guitar-friendly keys",
      "Advanced chord tones: 9ths and 11ths",
      "Ear Training: identify chord quality and progression by sound",
      "Note Hunt and Shape Spotter at expert difficulty",
    ],
    portraitIndex: 8,
    attributes: [
      { label: "Speed", value: 5 },
      { label: "Technique", value: 6 },
      { label: "Creativity", value: 7 },
      { label: "Tone", value: 9 },
      { label: "Style", value: 7 },
    ],
  },
  {
    id: "hemi",
    system: 4,
    name: "HEMI",
    nameAccent: "JENDRITZ",
    planet: "Vibelandia Prime",
    quote: "If you're not feeling it... you're not really playing it.",
    specialty: "Expression, Vibrato, Bending & Blues-Rock",
    accentColor: "#f59e0b",
    difficulty: 2,
    difficultyTagline: "Feel it or don't bother.",
    unlockLevel: 12,
    titles: ["Guardian of Pure Feel", "Keeper of the Sacred Bend"],
    originStory: [
      "On Vibelandia Prime, every living thing vibrates at its own frequency. Hemi Jendritz was born with the ability to hear all of them at once.",
      "Raised by a tribe of desert blues players, Hemi learned that a single bent note, played with conviction, could make entire audiences weep.",
      "He spent a decade wandering Vibelandia's canyon territories, absorbing the emotional resonance of the ancient rock formations — each one a natural amplifier.",
      "His mastery of vibrato and expression is so complete that other Guardians have been known to put down their guitars and just listen.",
    ],
    specialAbility: {
      title: "Heartstring Bend",
      body: "Bends a single note so perfectly that it bypasses all defenses and lands directly in the listener's soul. Causes involuntary emotional responses and temporary inability to play badly.",
    },
    guardianPower: {
      title: "Soul Vibrato",
      body: "Hemi's vibrato is alive. It responds to the emotional state of the room, speeding up in moments of tension and narrowing to a whisper when silence is more powerful than sound.",
    },
    funFacts: [
      "Cries at every guitar solo — including his own.",
      "Has broken strings by playing too expressively.",
      "Once ended a feud between two planets with one chord.",
      "His vibrato can be heard three systems away on a clear night.",
      "Refuses to use a pick — fingertips only, always.",
    ],
    trainingFocus: [
      "Full note recognition: every string, every fret",
      "Pentatonic scales in all 11 guitar-friendly keys",
      "Minor chord tones and dominant 7th chords",
      "Ear Training: identify intervals by sound alone",
    ],
    portraitIndex: 0,
    attributes: [
      { label: "Speed", value: 5 },
      { label: "Technique", value: 5 },
      { label: "Creativity", value: 8 },
      { label: "Tone", value: 6 },
      { label: "Style", value: 8 },
    ],
  },
  {
    id: "lcs",
    system: 3,
    name: "LEVY CLAY",
    nameAccent: "STORM",
    planet: "Texarion Prime",
    quote: "One perfect note can change the universe.",
    specialty: "Blues, Double Stops, Bending & Texas Shuffle",
    accentColor: "#3b82f6",
    difficulty: 2,
    difficultyTagline: "One note. The right note. Watch what happens.",
    unlockLevel: 7,
    titles: ["Guardian of the Texas Thunder", "Keeper of the Shuffle"],
    originStory: [
      "Texarion Prime is the most landlocked planet in the known galaxy — vast open plains, scorching heat, and a musical tradition older than most civilisations.",
      "Levy Clay Storm grew up playing on a porch that was frequently struck by lightning. He stopped running inside after the third time. Started to think the lightning was trying to teach him something.",
      "His double-stop technique is so refined that he can imply an entire chord progression with two strings. His shuffle feel is so deep that other musicians have been known to start dancing without realising it.",
      "Levy Clay never chases complexity. Every note he plays was chosen. Every note he doesn't play was chosen too.",
    ],
    specialAbility: {
      title: "Thunder Double Stop",
      body: "Plays two notes simultaneously with such rhythmic authority that the groove physically locks everyone in the room. Resistance is futile. Your foot will tap.",
    },
    guardianPower: {
      title: "Texas Lightning",
      body: "Levy Clay channels Texarion's electrical storms through every string. His bends are impossibly expressive, his shuffle is unbreakable, and when he digs in, you feel it in your chest.",
    },
    funFacts: [
      "Has been struck by lightning seven times. Considers it a warmup.",
      "Once played a gig during a tornado. The tornado left early.",
      "Owns 47 guitars. Plays one of them.",
      "His tone is so good that amp manufacturers study recordings of him to understand what 'good' means.",
      "The Texas Shuffle was named after him. He will deny this.",
    ],
    trainingFocus: [
      "Chromatic note naming at every fret on every string",
      "Pentatonic scale spelling in all seven sharp keys",
      "Open chord tones: major and minor triads",
      "Scale Spelling and Chord Tones drills",
    ],
    portraitIndex: 3,
    attributes: [
      { label: "Speed", value: 7 },
      { label: "Technique", value: 7 },
      { label: "Creativity", value: 8 },
      { label: "Tone", value: 8 },
      { label: "Style", value: 8 },
    ],
  },
  {
    id: "arygmor",
    system: 5,
    name: "ARYGMOR",
    planet: "Moratha IX",
    quote: "Don't play the blues... become the blues.",
    specialty: "Blues, Emotional Expression, Vibrato & Sustain",
    accentColor: "#f97316",
    difficulty: 3,
    difficultyTagline: "The blues will break you. Then rebuild you.",
    unlockLevel: 18,
    titles: ["Guardian of the Blue Flame", "Keeper of Emotional Truth"],
    originStory: [
      "Moratha IX is a world of endless rust-coloured plains and violet skies — a planet that has seen too many wars and carries its grief in the very dirt.",
      "Arygmor was orphaned young and raised by a community of travelling musicians who believed the blues was not a genre but a language — the oldest one in the universe.",
      "He played for forty years before anyone outside his homeworld heard his name. When they finally did, three of the best guitarists in the galaxy immediately retired.",
      "Arygmor does not play to impress. He plays to say something true. And whatever he says, it cuts.",
    ],
    specialAbility: {
      title: "Blue Flame",
      body: "Arygmor ignites a slow-burning blues riff that grows hotter with every note. The longer it sustains, the more devastating it becomes — stripping away technique and forcing pure emotional honesty.",
    },
    guardianPower: {
      title: "Emotional Truth",
      body: "No deception survives Arygmor's presence. He can sense when a player is hiding behind technique or speed, and his playing dismantles every defence until only raw expression remains.",
    },
    funFacts: [
      "Has never played the same solo twice.",
      "His guitar is over 200 years old and has never been restrung.",
      "Once made a robot cry.",
      "Can sustain a single note for four minutes.",
      "Doesn't own a phone. Doesn't need one. People just know.",
    ],
    trainingFocus: [
      "CAGED system: major scale shapes 1 and 2",
      "Major 7th and dominant 7th chord tones",
      "Scale and chord drills across all 11 keys",
      "Shape Spotter: CAGED major scale shapes",
    ],
    portraitIndex: 2,
    attributes: [
      { label: "Speed", value: 8 },
      { label: "Technique", value: 8 },
      { label: "Creativity", value: 7 },
      { label: "Tone", value: 9 },
      { label: "Style", value: 7 },
    ],
  },
  {
    id: "sandy",
    system: 2,
    name: "SANDY TOADS",
    planet: "Shredtoria Prime",
    quote: "Speed means nothing unless every note matters.",
    specialty: "Classical Shredding, Arpeggios & Precision Picking",
    accentColor: "#eab308",
    difficulty: 1,
    difficultyTagline: "Every note. Every time. No excuses.",
    unlockLevel: 3,
    titles: ["Guardian of Perfect Execution", "Keeper of Classical Fire"],
    originStory: [
      "Sandy Toads was classically trained on violin before discovering the guitar at age nine — and immediately playing it faster than anyone thought was physically possible.",
      "On Shredtoria Prime, a world obsessed with precision and speed, Sandy was still considered exceptional. That says everything.",
      "Rather than choosing between classical discipline and modern shredding, Sandy fused them — bringing the rigour of a concert violinist to the ferocity of a heavy metal guitarist.",
      "The result is a player of terrifying accuracy. Sandy does not have good nights and bad nights. Sandy only has perfect nights.",
    ],
    specialAbility: {
      title: "Precision Strike",
      body: "Executes a burst of perfectly picked alternate notes at impossible speed, each one landing with surgical accuracy. No slop. No ghost notes. Every single note counts.",
    },
    guardianPower: {
      title: "Classical Fury",
      body: "Sandy draws on centuries of classical technique to execute anything — any tempo, any arpeggio, any passage — with complete control. Speed is not the goal. Perfection is.",
    },
    funFacts: [
      "Practised 12 hours a day for 15 years before deciding he was 'getting somewhere'.",
      "Can play Paganini Caprice No. 24 on guitar. Faster than Paganini.",
      "His metronome is set at 240 bpm. That's the slow setting.",
      "Once played a 32nd-note passage so cleanly that three audience members fainted.",
      "Has never played a wrong note. (This is not an exaggeration.)",
    ],
    trainingFocus: [
      "Natural notes across all six strings",
      "Major and minor intervals: unison through octave",
      "Major pentatonic shape 1 in C, G, D, A and E",
      "Fretboard Notes drill and Note Hunt game",
    ],
    portraitIndex: 6,
    attributes: [
      { label: "Speed", value: 8 },
      { label: "Technique", value: 8 },
      { label: "Creativity", value: 8 },
      { label: "Tone", value: 7 },
      { label: "Style", value: 8 },
    ],
  },
  {
    id: "ingvar",
    system: 6,
    name: "INGVAR",
    nameAccent: "MOR-ISMOR",
    planet: "Arpeggion Prime",
    quote: "Why play fewer notes when there are infinitely more waiting to be discovered?",
    specialty: "Arpeggios, Modes, Speed & Fretboard Precision",
    accentColor: "#b48cff",
    difficulty: 4,
    difficultyTagline: "There are no wrong notes. Only slow fingers.",
    unlockLevel: 25,
    titles: ["Guardian of the Infinite Fretboard", "Keeper of Modal Knowledge"],
    originStory: [
      "Arpeggion Prime is a world of pure mathematics. Its mountains are shaped like diminished chords, its rivers flow in Lydian mode, and its moons orbit in perfect 5-against-3 polyrhythm.",
      "Ingvar Mor-Ismor was a child prodigy who memorised the entire fretboard before he could read. By age twelve he had charted every mode across every key on every string.",
      "He spent his twenties developing a technique so precise that other players call it 'machine-like' — which Ingvar considers the highest possible compliment.",
      "His speed is legendary, but those who study him closely realise the speed is just a side effect of perfect knowledge. Ingvar never rushes. He simply already knows where every note is.",
    ],
    specialAbility: {
      title: "Arpeggio Storm",
      body: "Unleashes a cascade of perfectly voiced arpeggios across all seven modes simultaneously. Opponents are overwhelmed by harmonic precision and typically forget what key they are in.",
    },
    guardianPower: {
      title: "Modal Omniscience",
      body: "Ingvar knows every note on the fretboard in every key at all times. He cannot be surprised by a key change. He cannot be confused by a chord substitution. He simply adapts and continues.",
    },
    funFacts: [
      "Plays scales for fun. Genuinely.",
      "Has memorised 847 arpeggios, all 7 modes, and the fretboard in 12 keys.",
      "Once won an argument about music theory that lasted eleven years.",
      "His practice routine is 8 hours a day. On rest days.",
      "Considers playing slowly to be a form of surrender.",
    ],
    trainingFocus: [
      "CAGED system: all five major scale positions",
      "Three-note-per-string scale patterns",
      "Full 7th chord vocabulary across all keys",
      "Shape Spotter all shapes; Alien Invasion at speed",
    ],
    portraitIndex: 1,
    attributes: [
      { label: "Speed", value: 10 },
      { label: "Technique", value: 10 },
      { label: "Creativity", value: 8 },
      { label: "Tone", value: 8 },
      { label: "Style", value: 7 },
    ],
  },
  {
    id: "shreddy",
    system: 8,
    name: "SHREDDY",
    nameAccent: "HAN VELAN",
    planet: "Infernax IV",
    quote: "Why use one pedal when you can use seventeen?",
    specialty: "Alternate Picking, Sweep Arpeggios & Dive Bombs",
    accentColor: "#ef4444",
    difficulty: 4,
    difficultyTagline: "Loud. Fast. Completely unreasonable.",
    unlockLevel: 50,
    titles: ["Guardian of Chaos and Speed", "Destroyer of Practice Amps"],
    originStory: [
      "Infernax IV is a volcanic world of extreme temperatures, extreme weather, and extremely loud music. Shreddy Han Velan fits right in.",
      "Shreddy learned to play in a lava-side cave, competing against the sound of eruptions for volume. This explains both the playing style and the hearing damage.",
      "Technical excellence was never the goal — chaos with precision was. Shreddy's alternate picking reached inhuman speeds, sweep arpeggios became weapons, and the whammy bar became a way of life.",
      "Other Guardians practise. Shreddy just turns everything up to eleven and starts. The notes usually sort themselves out.",
    ],
    specialAbility: {
      title: "Inferno Sweep",
      body: "Launches a series of sweep arpeggios at speeds that make individual notes indistinguishable — but every single note is perfect. The result is a wall of musical fire that is both overwhelming and technically immaculate.",
    },
    guardianPower: {
      title: "Whammy Chaos",
      body: "Shreddy's whammy bar is a precision instrument wielded like a sledgehammer. Dive bombs, flutter picking, and pitch chaos combine into something that should be a mess but somehow, infuriatingly, works perfectly.",
    },
    funFacts: [
      "Owns 17 distortion pedals. Uses all of them. Simultaneously.",
      "Has melted three guitar necks through sheer playing heat.",
      "Once played a solo so fast that a photographer couldn't capture it.",
      "The Infernax regional fire department has a dedicated crew on standby during gigs.",
      "Claims to have invented dive bombs. No one has the energy to argue.",
    ],
    trainingFocus: [
      "All seven modes across all 11 keys",
      "Arpeggio shapes: major, minor and dominant",
      "Full interval and ear training mastery",
      "All games at hard difficulty in every key",
    ],
    portraitIndex: 7,
    attributes: [
      { label: "Speed", value: 9 },
      { label: "Technique", value: 8 },
      { label: "Creativity", value: 10 },
      { label: "Tone", value: 9 },
      { label: "Style", value: 9 },
    ],
  },
  {
    id: "mo",
    system: 9,
    name: "MO 'CURLY'",
    nameAccent: "PASTRAMI",
    planet: "Tidalia Prime",
    quote: "The wave already knows where it's going. Just ride it.",
    specialty: "Melodic Improvisation, Legato & Groove",
    accentColor: "#14b8a6",
    difficulty: 5,
    difficultyTagline: "Ride the wave. Shred everything.",
    unlockLevel: 65,
    titles: ["Guardian of Infinite Flow", "Keeper of the Eternal Groove"],
    originStory: [
      "Born on the ocean world of Tidalia Prime, Mo 'Curly' Pastrami grew up riding sonic waves generated by the planet's musical tides.",
      "While most Guardians trained for speed or technical perfection, Mo discovered something far more powerful — Flow.",
      "The great tidal reefs of Tidalia resonate with harmonic frequencies that can only be heard by those who truly listen.",
      "Through years of surfing both oceans and melodies, Mo learned to merge rhythm, expression and movement into a single force.",
    ],
    specialAbility: {
      title: "Sonic Tide",
      body: "Summons a massive wave of harmonic energy that carries every note perfectly into the pocket. Boosts groove by 200%, increases melodic awareness, and makes bad timing impossible.",
    },
    guardianPower: {
      title: "Infinite Flow",
      body: "The longer Mo plays, the stronger he becomes. Immune to overthinking, unlocks spontaneous creativity, and converts mistakes into musical ideas.",
    },
    funFacts: [
      "Surfs black holes for fun.",
      "Once improvised a solo for three days straight.",
      "Has never owned a metronome.",
      "Can detect a wrong note from another solar system.",
      "His hair has its own weather system.",
    ],
    trainingFocus: [
      "Modal fluency: every mode, every key, every position",
      "Complete chord vocabulary from triads through 13ths",
      "Ear Training: chord quality and progression recognition",
      "All games with maximum time pressure",
    ],
    portraitIndex: 4,
    attributes: [
      { label: "Speed", value: 9 },
      { label: "Technique", value: 9 },
      { label: "Creativity", value: 9 },
      { label: "Tone", value: 8 },
      { label: "Style", value: 8 },
    ],
  },
  {
    id: "vairon",
    system: 10,
    name: "VAIRON",
    planet: "Sonica Prime",
    quote: "Every note already exists somewhere in the universe. My job is to find it.",
    specialty: "Legato, Two-Handed Tapping, Harmonics & Sound Design",
    accentColor: "#38bdf8",
    difficulty: 5,
    difficultyTagline: "The sound you've never heard. Until now.",
    unlockLevel: 80,
    titles: ["Guardian of Sound Design", "Keeper of Harmonic Dimensions"],
    originStory: [
      "Sonica Prime exists at the intersection of three dimensional planes, and its inhabitants perceive sound in ways other species simply cannot. Vairon was born into this world and never took it for granted.",
      "From childhood, Vairon could hear harmonics within harmonics — the notes between the notes, the resonance inside the resonance. Standard guitar technique felt like whispering when the universe was screaming.",
      "Years of exploring two-handed tapping, natural and artificial harmonics, and sound manipulation led Vairon to develop a playing style that sounds less like a guitar and more like an entire orchestra finding itself.",
      "Other Guardians compete on speed or feel. Vairon competes on dimensions. There are simply sounds that no one else can make.",
    ],
    specialAbility: {
      title: "Harmonic Cascade",
      body: "Vairon unlocks a sequence of stacked natural harmonics that reverberate across frequencies the human ear was not designed to process. Opponents experience temporary synaesthesia.",
    },
    guardianPower: {
      title: "Dimensional Resonance",
      body: "Vairon hears and plays in multiple harmonic dimensions simultaneously. Each note triggers overtones, undertones, and resonant sympathies that fill the sonic space completely. The result is one person who sounds like twenty.",
    },
    funFacts: [
      "Can play legato runs so smooth they appear in medical textbooks as examples of muscle control.",
      "Hears 11 harmonics in every note. Most people hear 3.",
      "Once used a guitar as a synthesiser. The synthesiser was confused.",
      "Has a signature two-handed tapping pattern that has never been successfully transcribed.",
      "Sleeps in a room tuned to 432hz. Claims it's not weird.",
    ],
    trainingFocus: [
      "Total fretboard mastery: no limits, no exceptions",
      "Advanced theory: modal interchange and borrowed chords",
      "Ear Training: complex chord types and modulations",
      "Expert difficulty on every game in every key",
    ],
    portraitIndex: 9,
    attributes: [
      { label: "Speed", value: 10 },
      { label: "Technique", value: 10 },
      { label: "Creativity", value: 10 },
      { label: "Tone", value: 10 },
      { label: "Style", value: 10 },
    ],
  },
];

export function getBoss(id: string): BossMobile | undefined {
  return BOSSES.find((b) => b.id === id);
}

/**
 * Returns the guardian trainer for a given player level.
 * The active guardian is the boss with the highest system number whose
 * unlockLevel is ≤ the player's current level. Falls back to Nena (system 1)
 * before any boss has unlocked.
 */
export function guardianForLevel(level: number): BossMobile {
  const eligible = BOSSES.filter((b) => b.unlockLevel <= level).sort(
    (a, b) => b.system - a.system,
  );
  return eligible[0] ?? BOSSES.find((b) => b.id === "nena")!;
}

/** 10 mixed questions: 3 intervals + 3 fretboard notes + 2 scales + 2 chords. */
export function makeBossQuestions(): Question[] {
  const pool: Question[] = [
    ...makeQuestions("intervals").slice(0, 3),
    ...makeQuestions("notes").slice(0, 3),
    ...makeQuestions("scales").slice(0, 2),
    ...makeQuestions("chords").slice(0, 2),
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/** Extended question type that carries a per-question category tag so the
 *  fail screen can surface only the areas the player actually missed. */
export interface TaggedBossQuestion extends Question {
  bossCategory: "intervals" | "notes" | "scales" | "chords";
}

/** Same pool as makeBossQuestions() but each item carries bossCategory. */
export function makeBossQuestionsTagged(): TaggedBossQuestion[] {
  const pool: TaggedBossQuestion[] = [
    ...makeQuestions("intervals").slice(0, 3).map((q) => ({ ...q, bossCategory: "intervals" as const })),
    ...makeQuestions("notes").slice(0, 3).map((q) => ({ ...q, bossCategory: "notes" as const })),
    ...makeQuestions("scales").slice(0, 2).map((q) => ({ ...q, bossCategory: "scales" as const })),
    ...makeQuestions("chords").slice(0, 2).map((q) => ({ ...q, bossCategory: "chords" as const })),
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/** Pass threshold for a boss battle (7 out of 10). */
export const BOSS_PASS_THRESHOLD = 7;
