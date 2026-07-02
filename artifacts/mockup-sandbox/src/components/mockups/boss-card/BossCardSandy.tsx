import { BossCardBody, type Boss } from "./BossCard";

/* ------------------------------------------------------------------ *
 * FILLED EXAMPLE — "Sandy Toads".
 * Guardian of the Eternal Shredstorm / Keeper of the Celestial Polka Flame.
 * Accent: celestial gold #eab308
 * ------------------------------------------------------------------ */
const SANDY: Boss = {
  name: "SANDY TOADS",
  titles: ["Guardian of the Eternal Shredstorm", "Keeper of the Celestial Polka Flame"],
  planet: "Shredtoria Prime",
  heroImage: "/__mockup/images/sandy-full.png",
  originStory: [
    "Born on Shredtoria Prime — a world of floating marble mountains, classical temples and endless lightning storms where music and discipline are considered sacred forces.",
    "Sandy spent his youth studying both the ancient scrolls of harmony and the sacred art of high-velocity guitar playing.",
    "Unlike many Guardians who relied purely on speed, Sandy believed true mastery came from balancing precision, melody and discipline.",
    "After scaling the legendary Mount Arpeggius and surviving the Great Lightning Solo Storm, Sandy unlocked the Celestial Polka Flame — a mysterious force that empowers both technique and musical expression.",
  ],
  quote: "Speed means nothing unless every note matters.",
  specialty: {
    title: "Specialty",
    body: "Classical-Inspired Shredding, Arpeggios, Precision Picking, Harmonic Minor Mastery, Melodic Soloing & Discipline.",
    icon: "spark",
  },
  specialAbility: {
    title: "Celestial Shredstorm",
    body: "Summons a vortex of lightning-fast arpeggios and scale sequences. Grants +300% Picking Accuracy, +200% Speed, and temporarily slows time perception.",
    icon: "infinity",
  },
  guardianPower: {
    title: "Polka Flame Ascension",
    body: "Channels the ancient power of the Celestial Flame through his legendary polka-dot guitar. Enhances precision, amplifies technique, and unlocks advanced musical awareness.",
    icon: "planet",
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
  unlock: { text: "Complete all Shredstorm Trials and earn 95,000 XP" },
  difficulty: 5,
  difficultyTagline: "Practice until the impossible becomes easy.",
  accentColor: "#eab308",
  heroHeight: 560,
  heroScale: 1.7,
  heroOffsetY: -160,
  gallery: [
    { label: "Signature Guitar", src: "/__mockup/images/sandy-guitar.png" },
    { label: "Guitar Close-Up", src: "/__mockup/images/sandy-guitar-closeup.png" },
    { label: "Avatar Front", src: "/__mockup/images/sandy-full.png" },
  ],
};

export function BossCardSandy() {
  return <BossCardBody boss={SANDY} />;
}
