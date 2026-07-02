import { BossCardBody, type Boss } from "./BossCard";

const SHREDDY: Boss = {
  name: "SHREDDY",
  nameAccent: "HAN VELAN",
  titles: ["Destroyer of Clean Tones", "Lord of the Whammy Bar"],
  planet: "Infernax IV",
  heroImage: "/__mockup/images/shreddy-full.png",
  originStory: [
    "Forged in the molten core of Infernax IV, Shreddy Hellfire learned guitar by playing through active volcanos. The distortion was free.",
    "He has never played below 11. He doesn't know what 11 means. He just keeps turning it up.",
  ],
  quote: "Why use one pedal when you can use seventeen?",
  specialty: {
    title: "Specialty",
    body: "Alternate picking, sweep arpeggios, dive bombs, and making sound engineers cry.",
    icon: "bolt",
  },
  specialAbility: {
    title: "Hellfire Cascade",
    body: "Unleashes a wall of gain so thick it bends the laws of physics and melts the front row.",
    icon: "spark",
  },
  guardianPower: {
    title: "Tone Destroyer",
    body: "Immune to \"less is more.\" Every note adds +10% distortion to the room.",
    icon: "infinity",
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
  unlock: { text: "Complete all Shred Trials and survive 50,000 XP of pure chaos" },
  difficulty: 5,
  difficultyTagline: "Not for the faint-hearted.",
  accentColor: "#ef4444",
  gallery: [
    { label: "Signature Guitar", src: "/__mockup/images/shreddy-guitar.png" },
    { label: "Guitar Close-Up", src: "/__mockup/images/shreddy-guitar-closeup.png" },
    { label: "Avatar Front", src: "/__mockup/images/shreddy-full.png" },
  ],
};

export function BossCardShreddy() {
  return <BossCardBody boss={SHREDDY} />;
}
