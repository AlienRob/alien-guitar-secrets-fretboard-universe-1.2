import { BossCardBody, type Boss } from "./BossCard";

/* ------------------------------------------------------------------ *
 * FILLED EXAMPLE — "Nena Craus".
 * Guardian of the Solar Shredstorm / Keeper of the Celestial Velocity Core.
 * Accent: nova purple #a855f7
 * ------------------------------------------------------------------ */
const NENA: Boss = {
  name: "NENA CRAUS",
  titles: ["Guardian of the Solar Shredstorm", "Keeper of the Celestial Velocity Core"],
  planet: "Valkyria Nova",
  heroImage: "/__mockup/images/nena-full.png",
  originStory: [
    "Born beneath the twin suns of Valkyria Nova — a world where floating crystal citadels orbit giant purple suns and every citizen trains in the arts of discipline, precision and performance.",
    "While others relied on talent, Nena devoted herself to relentless training, mastering every challenge placed before her.",
    "After conquering the legendary Velocity Peaks and defeating the Mechanical Titans of Nova Sector Seven, she unlocked the Celestial Velocity Core.",
    "Today she serves as one of the most feared and respected Guardians in the Fretboard Universe.",
  ],
  quote: "Talent opens the door. Discipline breaks it down.",
  specialty: {
    title: "Specialty",
    body: "Alternate Picking, Modern Shred, Precision Technique, Stage Performance, Speed Training & Musical Discipline.",
    icon: "spark",
  },
  specialAbility: {
    title: "Velocity Surge",
    body: "Channels pure kinetic energy through her guitar, dramatically increasing speed and accuracy. Grants +300% Picking Speed, +200% Precision, and temporarily slows enemy reaction time.",
    icon: "infinity",
  },
  guardianPower: {
    title: "Starfire Ascension",
    body: "Transforms momentum into raw musical power. Increases attack speed, enhances endurance, and unlocks advanced technique combinations.",
    icon: "planet",
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
  unlock: { text: "Complete all Velocity Trials and earn 95,000 XP" },
  difficulty: 5,
  difficultyTagline: "Train harder. Play louder.",
  accentColor: "#a855f7",
  gallery: [
    { label: "Signature Guitar", src: "/__mockup/images/nena-guitar.png" },
    { label: "Guitar Close-Up", src: "/__mockup/images/nena-guitar-closeup.png" },
    { label: "Avatar Front", src: "/__mockup/images/nena-full.png" },
  ],
};

export function BossCardNena() {
  return <BossCardBody boss={NENA} />;
}
