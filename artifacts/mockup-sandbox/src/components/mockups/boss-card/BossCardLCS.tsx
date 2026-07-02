import { BossCardBody, type Boss } from "./BossCard";

/* ------------------------------------------------------------------ *
 * FILLED EXAMPLE — "Levy Clay Storm" (LCS).
 * Guardian of the Infinite Flood / Keeper of the Texas Thunder.
 * Accent: Texas storm blue #3b82f6
 * ------------------------------------------------------------------ */
const LCS: Boss = {
  name: "LEVY CLAY STORM",
  titles: ["Guardian of the Infinite Flood", "Keeper of the Texas Thunder"],
  planet: "Texarion Prime",
  heroImage: "/__mockup/images/lcs-full.png",
  originStory: [
    "Born beneath the endless thunderclouds of Texarion Prime — a scorching desert world where colossal storms roll across crimson canyons and every lightning strike sounds like a cranked tube amplifier.",
    "Levy Clay Storm learned that true power wasn't found in speed alone. It lived in touch. In feel. In the space between the notes.",
    "While others chased complexity, Levy mastered the art of making a single note speak louder than an entire galaxy of scales.",
    "Today he travels the Fretboard Universe carrying the legendary storms of Texarion Prime wherever he plays.",
  ],
  quote: "One perfect note can change the universe.",
  specialty: {
    title: "Specialty",
    body: "Blues, Double Stops, String Bending, Shuffle Groove, Texas Blues & Emotional Soloing.",
    icon: "spark",
  },
  specialAbility: {
    title: "Texas Floodgate",
    body: "Summons a tidal wave of blues energy that overwhelms opponents with pure feel and tone. Grants +300% Tone, +200% Soul, and restores Groove Energy.",
    icon: "infinity",
  },
  guardianPower: {
    title: "Infinite Bend",
    body: "Can bend notes beyond normal physical limits, creating rifts in space-time and emotional damage to nearby listeners.",
    icon: "planet",
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
  unlock: { text: "Complete all Texas Flood Trials and earn 90,000 XP" },
  difficulty: 5,
  difficultyTagline: "Feel first. Speed second.",
  accentColor: "#3b82f6",
  gallery: [
    { label: "Signature Guitar", src: "/__mockup/images/lcs-guitar.png" },
    { label: "Guitar Close-Up", src: "/__mockup/images/lcs-guitar-closeup.png" },
    { label: "Avatar Front", src: "/__mockup/images/lcs-full.png" },
  ],
};

export function BossCardLCS() {
  return <BossCardBody boss={LCS} />;
}
