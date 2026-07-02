import { BossCardBody, type Boss } from "./BossCard";

/* ------------------------------------------------------------------ *
 * FILLED EXAMPLE — "Hansy Mittons".
 * Guardian of Infinite Melody / Keeper of the Resonance Current.
 * Accent: emerald green #10b981
 * ------------------------------------------------------------------ */
const HANSY: Boss = {
  name: "HANSY MITTONS",
  titles: ["Guardian of Infinite Melody", "Keeper of the Resonance Current"],
  planet: "Harmonia Prime",
  heroImage: "/__mockup/images/hansy-full.png",
  originStory: [
    "Born amongst the floating resonance islands of Harmonia Prime — a world where melodies drift through the skies like clouds and every mountain resonates with harmonic frequencies.",
    "While other Guardians chased speed and complexity, Hansy devoted himself to crafting melodies capable of travelling across entire solar systems.",
    "Legend says a single melody from Hansy once ended a thousand-year war without a single word being spoken.",
    "Today he serves as the melodic heart of the Fretboard Universe.",
  ],
  quote: "The right note at the right time is worth more than a thousand notes played too fast.",
  specialty: {
    title: "Specialty",
    body: "Melody, Phrasing, Sustain, Dynamics, Songcraft & Emotional Expression.",
    icon: "spark",
  },
  specialAbility: {
    title: "Infinite Sustain",
    body: "Creates a harmonic field where every note blooms endlessly through space and time. Grants +300% Sustain, +200% Emotional Impact, and amplifies melodic awareness.",
    icon: "infinity",
  },
  guardianPower: {
    title: "Resonance Cascade",
    body: "Transforms simple melodies into powerful waves of inspiration. Strengthens nearby allies, increases creativity, and unlocks hidden musical pathways.",
    icon: "planet",
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
  unlock: { text: "Complete all Resonance Trials and earn 80,000 XP" },
  difficulty: 4,
  difficultyTagline: "Make every note matter.",
  accentColor: "#10b981",
  gallery: [
    { label: "Signature Guitar", src: "/__mockup/images/hansy-guitar.png" },
    { label: "Guitar Close-Up", src: "/__mockup/images/hansy-guitar-closeup.png" },
    { label: "Avatar Front", src: "/__mockup/images/hansy-full.png" },
  ],
};

export function BossCardHansy() {
  return <BossCardBody boss={HANSY} />;
}
