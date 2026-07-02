import { BossCardBody, type Boss } from "./BossCard";

/* ------------------------------------------------------------------ *
 * FILLED EXAMPLE — "Ingvar Mor-Ismor".
 * Shows the template populated with a real boss so you can see how a
 * finished card looks next to the blank skeleton. Same layout, same
 * component — only the data object differs.
 * ------------------------------------------------------------------ */
const INGVAR: Boss = {
  name: "INGVAR",
  nameAccent: "MOR-ISMOR",
  titles: ["Guardian of Infinite Velocity", "Keeper of the Endless Arpeggio"],
  planet: "Arpeggion Prime",
  heroImage: "/__mockup/images/ingvar-full.png",
  heroHeight: 480,
  heroOffsetY: -30,
  originStory: [
    "Born in the ice-capped fjords of Arpeggion Prime, Ingvar Mor-Ismor was blessed with perfect pitch, perfect technique, and absolutely zero humility.",
    "While others chased tone, he chased infinity. While others played notes, he conquered them.",
  ],
  quote:
    "Why play fewer notes when there are infinitely more waiting to be discovered?",
  specialty: {
    title: "Specialty",
    body: "Arpeggios, modes, speed, harmonic minor & fretboard precision.",
    icon: "bolt",
  },
  specialAbility: {
    title: "Infinite Cascade",
    body: "Unleashes an endless stream of arpeggios so fast it bends spacetime and makes metronomes cry.",
    icon: "spark",
  },
  guardianPower: {
    title: "Unlimited Ego",
    body: 'Immune to "less is more." Gains more power the more he plays.',
    icon: "infinity",
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
  unlock: { text: "Complete all Speed Trials and earn 75,000 XP" },
  difficulty: 5,
  difficultyTagline: "Only the determined can handle more.",
  accentColor: "#b48cff",
  gallery: [
    { label: "Signature Guitar", src: "/__mockup/images/ingvar-guitar.png" },
    { label: "Guitar Close-Up", src: "/__mockup/images/ingvar-guitar-closeup.png" },
    { label: "Avatar Front", src: "/__mockup/images/ingvar-full.png" },
  ],
};

export function BossCardExample() {
  return <BossCardBody boss={INGVAR} />;
}
