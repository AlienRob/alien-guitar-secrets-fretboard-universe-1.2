import { BossCardBody, type Boss } from "./BossCard";

/* ------------------------------------------------------------------ *
 * FILLED EXAMPLE — "Arygmor".
 * Guardian of the Eternal Blues Flame / Keeper of the Soulfire Note.
 * Accent: soulfire amber-orange #f97316
 * ------------------------------------------------------------------ */
const ARYGMOR: Boss = {
  name: "ARYGMOR",
  titles: ["Guardian of the Eternal Blues Flame", "Keeper of the Soulfire Note"],
  planet: "Moratha IX",
  heroImage: "/__mockup/images/arygmor-full.png",
  originStory: [
    "Born in the Bluesfire Mountains of Moratha IX, where every melody must survive the fires of hardship before it can be called music.",
    "Arygmor did not learn scales — he learned to survive. And in that survival, he discovered the most powerful force in the universe: soul.",
    "The inhabitants of Moratha IX believe one perfect note forged in genuine emotion is worth more than a thousand technically flawless ones.",
    "Today Arygmor wanders the Fretboard Universe carrying the Eternal Blues Flame — a force that transforms pain into music and setbacks into inspiration.",
  ],
  quote: "Don't play the blues... become the blues.",
  specialty: {
    title: "Specialty",
    body: "Blues Guitar, Emotional Expression, Vibrato, String Bending, Sustain & Melodic Soloing.",
    icon: "spark",
  },
  specialAbility: {
    title: "Soulfire Bend",
    body: "A single bend so emotional it ignites the hearts of everyone within hearing distance. Grants +300% Emotion, restores confidence, inspires creativity, and weakens robotic playing.",
    icon: "infinity",
  },
  guardianPower: {
    title: "Eternal Blues Flame",
    body: "A mystical force that transforms pain into music. Converts setbacks into inspiration, strengthens emotional expression, and makes every note tell a story.",
    icon: "planet",
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
  unlock: { text: "Complete all Blues Flame Trials and earn 85,000 XP" },
  difficulty: 5,
  difficultyTagline: "Don't play the blues... become the blues.",
  accentColor: "#f97316",
  gallery: [
    { label: "Signature Guitar", src: "/__mockup/images/arygmor-guitar.png" },
    { label: "Guitar Close-Up", src: "/__mockup/images/arygmor-guitar-closeup.png" },
    { label: "Avatar Front", src: "/__mockup/images/arygmor-full.png" },
  ],
};

export function BossCardArygmor() {
  return <BossCardBody boss={ARYGMOR} />;
}
