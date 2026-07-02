import { BossCardBody, type Boss } from "./BossCard";

/* ------------------------------------------------------------------ *
 * FILLED EXAMPLE — "Hemi Jendritz".
 * Guardian of Cosmic Expression / Keeper of the Infinite Vibe.
 * Accent: warm amber #f59e0b
 * ------------------------------------------------------------------ */
const HEMI: Boss = {
  name: "HEMI",
  nameAccent: "JENDRITZ",
  titles: ["Guardian of Cosmic Expression", "Keeper of the Infinite Vibe"],
  planet: "Vibelandia Prime",
  heroImage: "/__mockup/images/hemi-full.png",
  originStory: [
    "Born beneath the psychedelic moons of Vibelandia Prime, Hemi Jendritz discovered early that music wasn't merely something you played...",
    "It was something you became.",
    "While others practised scales, Hemi practised freedom. While others chased perfection, Hemi chased feeling.",
    "Armed with a backwards Strat and a pocket full of cosmic stardust, he learned to bend notes, minds and occasionally the laws of physics.",
    "Legends say a single sustained note from Hemi once caused an entire solar system to spontaneously grow afros.",
  ],
  quote: "If you're not feeling it... you're not really playing it.",
  specialty: {
    title: "Specialty",
    body: "Expression, Vibrato, Bending, Blues-Rock Improvisation & Stage Presence.",
    icon: "bolt",
  },
  specialAbility: {
    title: "Cosmic Vibrato",
    body: "Unleashes a sustained note so powerful that strings begin vibrating on nearby planets, audience members forget what day it is, and guitar solos gain +300% soul.",
    icon: "spark",
  },
  guardianPower: {
    title: "Purple Haze Field",
    body: "Creates an aura of pure musical freedom. Immune to overthinking. Notes automatically gain feeling. Makes metronomes slightly nervous.",
    icon: "infinity",
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
  unlock: { text: "Complete all Expression Challenges and earn 65,000 XP" },
  difficulty: 4,
  difficultyTagline: "Feel first. Think later.",
  accentColor: "#f59e0b",
  gallery: [
    { label: "Signature Guitar", src: "/__mockup/images/hemi-guitar.png" },
    { label: "Guitar Close-Up", src: "/__mockup/images/hemi-guitar-closeup.png" },
    { label: "Avatar Front", src: "/__mockup/images/hemi-full.png" },
  ],
};

export function BossCardHemi() {
  return <BossCardBody boss={HEMI} />;
}
