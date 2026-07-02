import { BossCardBody, type Boss } from "./BossCard";

/* ------------------------------------------------------------------ *
 * FILLED EXAMPLE — "Vairon".
 * Architect of Sound / Keeper of Infinite Possibility.
 * Accent: cosmic cyan #38bdf8
 * ------------------------------------------------------------------ */
const VAIRON: Boss = {
  name: "VAIRON",
  titles: ["Architect of Sound", "Keeper of Infinite Possibility"],
  planet: "Sonica Prime",
  heroImage: "/__mockup/images/vairon-full.png",
  originStory: [
    "Born amongst the floating harmonic crystal cities of Sonica Prime, Vairon discovered at an early age that music was more than sound — it was architecture.",
    "While other musicians learned scales, Vairon learned to sculpt frequencies into living structures.",
    "Legends claim he once built an entire floating city using nothing but harmonics, sustain and imagination.",
    "Today he wanders the Fretboard Universe searching for sounds that have never existed before.",
  ],
  quote: "Every note already exists somewhere in the universe. My job is to find it.",
  specialty: {
    title: "Specialty",
    body: "Legato, Two-Handed Tapping, Whammy Bar Techniques, Harmonics, Musical Creativity & Sound Design.",
    icon: "spark",
  },
  specialAbility: {
    title: "Infinite Resonance",
    body: "Creates cascading waves of harmonics that multiply every note played nearby. Doubles creativity output, unlocks hidden frequencies, and makes ordinary licks sound extraordinary.",
    icon: "infinity",
  },
  guardianPower: {
    title: "Architect of Sound",
    body: "Can shape pure sound into structures, pathways and portals. Creates sonic bridges between dimensions, generates harmonic force fields, and transforms imagination into reality.",
    icon: "planet",
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
  unlock: { text: "Complete all Harmonic Trials and earn 90,000 XP" },
  difficulty: 5,
  difficultyTagline: "Imagine it. Hear it. Become it.",
  accentColor: "#38bdf8",
  gallery: [
    { label: "Signature Guitar", src: "/__mockup/images/vairon-guitar.png" },
    { label: "Guitar Close-Up", src: "/__mockup/images/vairon-guitar-closeup.png" },
    { label: "Avatar Front", src: "/__mockup/images/vairon-full.png" },
  ],
};

export function BossCardVairon() {
  return <BossCardBody boss={VAIRON} />;
}
