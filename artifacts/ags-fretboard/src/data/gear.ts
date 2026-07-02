// Static catalog for the AGS Galactic Display Vault "Gear Locker" sections.
//
// Like guitars, gear is earned purely from the player's progress — no extra
// storage is needed. Each item unlocks from one of three milestones: reaching a
// level, completing a number of practice sessions, or holding a daily streak.
// This gives a healthy mix of "climb the levels" and "keep practising" rewards.

import { type Rarity } from "./guitars";

// Real photo-style pedal artwork (background-removed transparent PNGs). Every
// effect pedal is now a rendered image rather than procedural SVG, so the
// catalog imports the asset URL and stores it on the item's `image` field.
import pedalTuner from "@assets/pedals/polystrobe-tuner.png";
import pedalClassic from "@assets/pedals/classic-distortion.png";
import pedalFuzzComet from "@assets/pedals/fuzz-comet.png";
import pedalDelayEcho from "@assets/pedals/delay-echo.png";
import pedalCompressor from "@assets/pedals/studio-compressor.png";
import pedalBluesy from "@assets/pedals/bluesy-musey-drive.png";
import pedalFloodBlues from "@assets/pedals/flood-of-blues.png";
import pedalGalaxyChorus from "@assets/pedals/galaxy-chorus.png";
import pedalAuroraChorus from "@assets/pedals/aurora-chorus.png";
import pedalOrbitPhaser from "@assets/pedals/orbit-phaser.png";
import pedalVortexPhaser from "@assets/pedals/vortex-phaser.png";
import pedalJetFlanger from "@assets/pedals/jet-flanger.png";
import pedalShred from "@assets/pedals/shred-distortion.png";
import pedalPlasmaFlanger from "@assets/pedals/plasma-flanger.png";
import pedalCosmicWah from "@assets/pedals/cosmic-wah.png";
import pedalCrymoreWah from "@assets/pedals/crymore-wah.png";
import pedalFuzzNebulous from "@assets/pedals/fuzz-nebulous.png";
import pedalMeteor from "@assets/pedals/meteor-lights.png";
import pedalBlackholeDelay from "@assets/pedals/delay-blackhole.png";
import pedalSupernova from "@assets/pedals/supernova-overdrive.png";
import pedalApocalypse from "@assets/pedals/apocalypse-distortion.png";
import pedalQuantumOctavia from "@assets/pedals/quantum-octavia.png";

// Real photo-style amplifier artwork (background-removed transparent PNGs). Like
// pedals, every amp is now a rendered image rather than procedural SVG.
import ampModeling from "@assets/amps/modeling-amp.png";
import ampStarlight from "@assets/amps/starlight-clean.png";
import ampTweedDeluxe from "@assets/amps/vintage-tweed-deluxe.png";
import ampBmAc from "@assets/amps/bm-ac.png";
import ampQuantumMesa from "@assets/amps/quantum-mesa.png";
import ampVintageModern from "@assets/amps/vintage-modern.png";
import ampDumble from "@assets/amps/dumble.png";
import ampFrontalLobe from "@assets/amps/frontal-lobe-fx.png";
import ampHiWattage from "@assets/amps/hiwattage.png";
import ampFuturistic from "@assets/amps/futuristic.png";
import ampJcmStack from "@assets/amps/jcm-stack.png";
import ampQuantumStack from "@assets/amps/quantum-stack.png";
import ampInfinityRack from "@assets/amps/infinity-rack-fx.png";
import ampGalaxyFull from "@assets/amps/galaxy-full-stack.png";
import ampInfinityRackIii from "@assets/amps/infinity-rack-fx-iii.png";
import ampTripleStackWall from "@assets/amps/triple-stack-wall.png";
import ampMythicWall from "@assets/amps/mythic-wall.png";

// Real photo-style cable artwork (background-removed transparent PNGs). The
// coiled-cable photo is the locker art; each cable also carries a `color`/
// `color2` (and optional `glow`) that drive the lead drawn across the rig scene.
import cableBlackPurple from "@assets/cables/black-purple-speck.png";
import cableElectricBlue from "@assets/cables/electric-blue.png";
import cableRubyRed from "@assets/cables/ruby-red.png";
import cableWhiteGold from "@assets/cables/white-gold.png";
import cablePlasmaBlue from "@assets/cables/plasma-blue-glow.png";
import cablePurpleCosmic from "@assets/cables/purple-cosmic.png";
import cableCosmicGlow from "@assets/cables/cosmic-glow.png";
import cableSupernova from "@assets/cables/supernova.png";

export type GearCategory = "pick" | "strap" | "pedal" | "amp" | "cable" | "coin";

export interface GearCategoryMeta {
  id: GearCategory;
  title: string;
  subtitle: string;
}

export const GEAR_CATEGORIES: GearCategoryMeta[] = [
  { id: "pick", title: "Cosmic Picks", subtitle: "Plectrums forged from stardust and light" },
  { id: "strap", title: "Galactic Straps", subtitle: "Hold your axe across the void" },
  { id: "pedal", title: "Effect Pedals", subtitle: "Stompboxes from distant worlds" },
  { id: "amp", title: "Amplifiers", subtitle: "Cabinets that shake the cosmos" },
  { id: "cable", title: "Patch Cables", subtitle: "Carry your signal through the stars" },
];

// How an item is earned.
export type GearReq =
  | { kind: "level"; level: number }
  | { kind: "sessions"; sessions: number }
  | { kind: "streak"; streak: number };

export type PickFinish =
  | "solid"
  | "holographic"
  | "glitter"
  | "foil"
  | "pearl"
  | "prism"
  | "neon"
  | "galaxy"
  | "carbon"
  | "marble";

export type StrapPattern =
  | "solid"
  | "stripes"
  | "woven"
  | "leather"
  | "cosmic"
  | "chevron"
  | "diamond"
  | "studded"
  | "flames"
  | "leopard"
  | "lightning"
  | "tiedye"
  | "rainbow"
  | "zebra";

// Surface finish for a patch cable's jacket — drives the thumb artwork and the
// look of the cable drawn snaking across the rig scene.
interface GearBase {
  id: string;
  name: string;
  category: GearCategory;
  rarity: Rarity;
  req: GearReq;
  blurb: string;
}

export type GearItem =
  | (GearBase & { category: "pick"; finish: PickFinish; color: string; color2?: string })
  | (GearBase & { category: "strap"; pattern: StrapPattern; color: string; color2?: string; image?: string })
  | (GearBase & { category: "coin"; coinAmount: number })
  | (GearBase & {
      category: "pedal";
      // Background-removed photo-style artwork (imported asset URL).
      image: string;
    })
  | (GearBase & {
      category: "amp";
      // Background-removed photo-style artwork (imported asset URL).
      image: string;
    })
  | (GearBase & {
      category: "cable";
      // Background-removed photo of the coiled lead (locker art).
      image: string;
      color: string; // lead colour drawn snaking across the rig scene
      color2?: string; // accent / plug colour
      glow?: boolean; // soft neon glow on the rig lead
    });

export interface GearStats {
  level: number;
  sessions: number;
  streak: number;
  fullAccess: boolean;
}

export function isGearUnlocked(item: GearItem, stats: GearStats): boolean {
  if (stats.fullAccess) return true;
  switch (item.req.kind) {
    case "level":
      return stats.level >= item.req.level;
    case "sessions":
      return stats.sessions >= item.req.sessions;
    case "streak":
      return stats.streak >= item.req.streak;
  }
}

// Short label for a locked item's requirement, e.g. "LVL 8", "50 sessions".
export function requirementLabel(req: GearReq): string {
  switch (req.kind) {
    case "level":
      return `LVL ${req.level}`;
    case "sessions":
      return `${req.sessions} sessions`;
    case "streak":
      return `${req.streak}-day streak`;
  }
}

export const GEAR: GearItem[] = [
  // --- Picks ---------------------------------------------------------------
  { id: "pick-onyx", name: "Onyx Standard", category: "pick", rarity: "common", req: { kind: "sessions", sessions: 1 }, blurb: "A trusty matte-black plectrum for every cadet.", finish: "solid", color: "#1c2233" },
  { id: "pick-solar", name: "Solar Flare", category: "pick", rarity: "common", req: { kind: "sessions", sessions: 5 }, blurb: "Warm amber resin that glows with practice.", finish: "solid", color: "#f5a623" },
  { id: "pick-holo", name: "Holographic Nebula", category: "pick", rarity: "rare", req: { kind: "sessions", sessions: 20 }, blurb: "Shifts through every colour of a distant nebula.", finish: "holographic", color: "#8a2be2", color2: "#00e5ff" },
  { id: "pick-glitter", name: "Quasar Glitter", category: "pick", rarity: "rare", req: { kind: "streak", streak: 3 }, blurb: "Suspended starflecks sparkle as you strum.", finish: "glitter", color: "#ff3ea5" },
  { id: "pick-foil", name: "Stardust Foil", category: "pick", rarity: "epic", req: { kind: "sessions", sessions: 50 }, blurb: "Mirror-bright foil milled from a fallen comet.", finish: "foil", color: "#c0c6d6" },
  { id: "pick-prism", name: "Prism Pulsar", category: "pick", rarity: "epic", req: { kind: "sessions", sessions: 100 }, blurb: "Splits your tone into a spectrum of light.", finish: "prism", color: "#22d3ee", color2: "#f43f5e" },
  { id: "pick-aurora", name: "Aurora Pearl", category: "pick", rarity: "legendary", req: { kind: "streak", streak: 21 }, blurb: "An iridescent pearl that shimmers like polar skies.", finish: "pearl", color: "#a7f3d0", color2: "#60a5fa" },
  { id: "pick-singularity", name: "Singularity", category: "pick", rarity: "mythic", req: { kind: "streak", streak: 14 }, blurb: "Forged at the edge of a black hole. Few hold it.", finish: "neon", color: "#b026ff", color2: "#00ffd5" },
  { id: "pick-glitter-cobalt", name: "Cobalt Glitter", category: "pick", rarity: "common", req: { kind: "sessions", sessions: 8 }, blurb: "Deep blue resin packed with twinkling flecks.", finish: "glitter", color: "#1d4ed8" },
  { id: "pick-carbon", name: "Carbon Vortex", category: "pick", rarity: "rare", req: { kind: "sessions", sessions: 12 }, blurb: "Woven carbon weave with a stealthy sheen.", finish: "carbon", color: "#161b24", color2: "#2b3242" },
  { id: "pick-neon-pink", name: "Hot Pink Laser", category: "pick", rarity: "rare", req: { kind: "sessions", sessions: 18 }, blurb: "Searing neon that hums against the dark.", finish: "neon", color: "#ff1f8f", color2: "#ff6ad5" },
  { id: "pick-neon-acid", name: "Acid Pulse", category: "pick", rarity: "rare", req: { kind: "streak", streak: 4 }, blurb: "Toxic-green glow you can spot a galaxy away.", finish: "neon", color: "#aaff00", color2: "#00ffa3" },
  { id: "pick-galaxy", name: "Galaxy Swirl", category: "pick", rarity: "rare", req: { kind: "sessions", sessions: 30 }, blurb: "A whole spiral arm caught in resin.", finish: "galaxy", color: "#2b0a4a", color2: "#00e5ff" },
  { id: "pick-marble", name: "Marble Comet", category: "pick", rarity: "epic", req: { kind: "sessions", sessions: 45 }, blurb: "Cream stone veined with magenta lightning.", finish: "marble", color: "#eef1f7", color2: "#c026d3" },
  { id: "pick-holo-gold", name: "Holo Gold", category: "pick", rarity: "epic", req: { kind: "streak", streak: 7 }, blurb: "Gold that fans into emerald as you tilt it.", finish: "holographic", color: "#f59e0b", color2: "#34d399" },
  { id: "pick-galaxy-void", name: "Void Spiral", category: "pick", rarity: "epic", req: { kind: "sessions", sessions: 65 }, blurb: "Light bends around its impossible centre.", finish: "galaxy", color: "#06121f", color2: "#22d3ee" },
  { id: "pick-marble-obsidian", name: "Obsidian Vein", category: "pick", rarity: "legendary", req: { kind: "sessions", sessions: 85 }, blurb: "Black marble laced with rivers of gold.", finish: "marble", color: "#1a1a22", color2: "#fbbf24" },

  // --- Straps --------------------------------------------------------------
  { id: "strap-cadet", name: "Cadet Webbing", category: "strap", rarity: "common", req: { kind: "sessions", sessions: 3 }, blurb: "Standard-issue nylon for the young explorer.", pattern: "solid", color: "#4456a0" },
  { id: "strap-comet", name: "Comet Tail", category: "strap", rarity: "common", req: { kind: "sessions", sessions: 10 }, blurb: "Twin stripes that streak like a passing comet.", pattern: "stripes", color: "#1e293b", color2: "#f59e0b" },
  { id: "strap-woven", name: "Woven Galaxy", category: "strap", rarity: "rare", req: { kind: "sessions", sessions: 40 }, blurb: "Hand-woven threads from a spiral galaxy.", pattern: "woven", color: "#5b21b6", color2: "#22d3ee" },
  { id: "strap-meteor", name: "Meteor Leather", category: "strap", rarity: "rare", req: { kind: "streak", streak: 5 }, blurb: "Tanned hide stamped with crater patterns.", pattern: "leather", color: "#7c4a21" },
  { id: "strap-plasma", name: "Plasma Weave", category: "strap", rarity: "epic", req: { kind: "streak", streak: 10 }, blurb: "Crackling energy braided into a band.", pattern: "cosmic", color: "#0b1026", color2: "#ec4899" },
  { id: "strap-eclipse", name: "Eclipse Royale", category: "strap", rarity: "legendary", req: { kind: "sessions", sessions: 100 }, blurb: "Black silk crowned with a corona of gold.", pattern: "cosmic", color: "#0a0a0f", color2: "#fbbf24" },
  { id: "strap-studded", name: "Star Studded", category: "strap", rarity: "rare", req: { kind: "sessions", sessions: 18 }, blurb: "Chrome rivets marching in twin constellations.", pattern: "studded", color: "#2b1840", color2: "#e9d5ff" },
  { id: "strap-chevron", name: "Pulse Chevron", category: "strap", rarity: "rare", req: { kind: "sessions", sessions: 28 }, blurb: "Cyan arrows pointing ever onward.", pattern: "chevron", color: "#14233f", color2: "#22d3ee" },
  { id: "strap-diamond", name: "Diamond Lattice", category: "strap", rarity: "rare", req: { kind: "streak", streak: 4 }, blurb: "A net of glinting diamonds across the void.", pattern: "diamond", color: "#1a0820", color2: "#ff5fa2" },
  { id: "strap-chevron-solar", name: "Solar Chevron", category: "strap", rarity: "epic", req: { kind: "streak", streak: 7 }, blurb: "Molten gold zigzags blazing down the band.", pattern: "chevron", color: "#2a0f0f", color2: "#f59e0b" },
  { id: "strap-studded-gold", name: "Gold Rivet", category: "strap", rarity: "epic", req: { kind: "sessions", sessions: 70 }, blurb: "Heavy gold studs fit for a cosmic outlaw.", pattern: "studded", color: "#1a1206", color2: "#fbbf24" },
  { id: "strap-diamond-ice", name: "Ice Lattice", category: "strap", rarity: "epic", req: { kind: "streak", streak: 14 }, blurb: "Frost-blue diamonds that catch every star.", pattern: "diamond", color: "#07142a", color2: "#7dd3fc" },
  // Funky additions — loud, colourful and a bit ridiculous, on purpose.
  { id: "strap-flames", name: "Hot Rod Flames", category: "strap", rarity: "epic", req: { kind: "sessions", sessions: 55 }, blurb: "Licking flames blazing up a jet-black band.", pattern: "flames", color: "#0a0a0f", color2: "#ff5a00" },
  { id: "strap-leopard", name: "Cosmic Leopard", category: "strap", rarity: "rare", req: { kind: "sessions", sessions: 22 }, blurb: "Wild rosette spots for the rockstar in you.", pattern: "leopard", color: "#caa34a", color2: "#1a1206" },
  { id: "strap-lightning", name: "Thunder Bolt", category: "strap", rarity: "rare", req: { kind: "streak", streak: 6 }, blurb: "Electric bolts crackling down the length.", pattern: "lightning", color: "#0b1026", color2: "#fde047" },
  { id: "strap-tiedye", name: "Nebula Tie-Dye", category: "strap", rarity: "epic", req: { kind: "sessions", sessions: 60 }, blurb: "Psychedelic swirls straight off a comet trail.", pattern: "tiedye", color: "#7c3aed", color2: "#22d3ee" },
  { id: "strap-zebra", name: "Zebra Static", category: "strap", rarity: "rare", req: { kind: "streak", streak: 8 }, blurb: "Bold black-and-white stripes with attitude.", pattern: "zebra", color: "#f5f5f7", color2: "#0a0a0f" },
  { id: "strap-rainbow", name: "Prism Rainbow", category: "strap", rarity: "legendary", req: { kind: "streak", streak: 18 }, blurb: "Every colour of the spectrum in one wild band.", pattern: "rainbow", color: "#05060f", color2: "#ffffff" },

  // --- Pedals --------------------------------------------------------------
  { id: "pedal-tuner", name: "PolyStrobe Tuner", category: "pedal", rarity: "common", req: { kind: "sessions", sessions: 1 }, blurb: "Lock onto any note from light-years away.", image: pedalTuner },
  { id: "pedal-classic", name: "Classic Distortion", category: "pedal", rarity: "common", req: { kind: "sessions", sessions: 12 }, blurb: "Warm, dependable grit for every cadet.", image: pedalClassic },
  { id: "pedal-fuzz-comet", name: "Fuzz Comet", category: "pedal", rarity: "common", req: { kind: "sessions", sessions: 18 }, blurb: "Thick, woolly fuzz with a cosmic snarl.", image: pedalFuzzComet },
  { id: "pedal-delay-echo", name: "Delay Echo", category: "pedal", rarity: "common", req: { kind: "sessions", sessions: 22 }, blurb: "Tidy repeats that trail off into the dark.", image: pedalDelayEcho },
  { id: "pedal-compressor", name: "Studio Compressor", category: "pedal", rarity: "common", req: { kind: "sessions", sessions: 26 }, blurb: "Evens out your tone with studio polish.", image: pedalCompressor },
  { id: "pedal-bluesy", name: "Bluesy Musey Drive", category: "pedal", rarity: "rare", req: { kind: "sessions", sessions: 30 }, blurb: "Soulful, singing overdrive with a cosmic-blue sparkle.", image: pedalBluesy },
  { id: "pedal-flood-blues", name: "Flood of Blues", category: "pedal", rarity: "rare", req: { kind: "sessions", sessions: 38 }, blurb: "A rolling tide of warm, expressive drive.", image: pedalFloodBlues },
  { id: "pedal-galaxy-chorus", name: "Galaxy Chorus", category: "pedal", rarity: "rare", req: { kind: "streak", streak: 4 }, blurb: "Splits one note into a shimmering galaxy.", image: pedalGalaxyChorus },
  { id: "pedal-aurora-chorus", name: "Aurora Chorus", category: "pedal", rarity: "rare", req: { kind: "sessions", sessions: 45 }, blurb: "Liquid shimmer that ripples like polar skies.", image: pedalAuroraChorus },
  { id: "pedal-orbit-phaser", name: "Orbit Phaser", category: "pedal", rarity: "rare", req: { kind: "sessions", sessions: 52 }, blurb: "Sweeping swirls that orbit your tone.", image: pedalOrbitPhaser },
  { id: "pedal-vortex-phaser", name: "Vortex Phaser", category: "pedal", rarity: "rare", req: { kind: "streak", streak: 6 }, blurb: "A deeper swirl that pulls tone into the void.", image: pedalVortexPhaser },
  { id: "pedal-jet-flanger", name: "Jet Flanger", category: "pedal", rarity: "rare", req: { kind: "sessions", sessions: 60 }, blurb: "Jet-engine sweeps screaming across the stars.", image: pedalJetFlanger },
  { id: "pedal-shred", name: "Shred Distortion", category: "pedal", rarity: "epic", req: { kind: "streak", streak: 8 }, blurb: "High-gain fury for warp-speed runs.", image: pedalShred },
  { id: "pedal-plasma-flanger", name: "Plasma Flanger", category: "pedal", rarity: "epic", req: { kind: "sessions", sessions: 68 }, blurb: "Crackling plasma sweeps that bend the air.", image: pedalPlasmaFlanger },
  { id: "pedal-cosmic-wah", name: "Cosmic Wah", category: "pedal", rarity: "epic", req: { kind: "streak", streak: 10 }, blurb: "An expressive wah forged on a distant world.", image: pedalCosmicWah },
  { id: "pedal-crymore-wah", name: "Wah Wah Crymore", category: "pedal", rarity: "epic", req: { kind: "sessions", sessions: 75 }, blurb: "A vocal, crying wah with stealth styling.", image: pedalCrymoreWah },
  { id: "pedal-fuzz-nebulous", name: "Fuzz Nebulous", category: "pedal", rarity: "epic", req: { kind: "streak", streak: 12 }, blurb: "Octave-laced fuzz lost in a purple nebula.", image: pedalFuzzNebulous },
  { id: "pedal-meteor", name: "Meteor Lights", category: "pedal", rarity: "legendary", req: { kind: "sessions", sessions: 90 }, blurb: "Distortion that streaks like a falling meteor.", image: pedalMeteor },
  { id: "pedal-blackhole-delay", name: "Delay Blackhole", category: "pedal", rarity: "legendary", req: { kind: "streak", streak: 14 }, blurb: "Repeats that fall forever into a black hole.", image: pedalBlackholeDelay },
  { id: "pedal-supernova", name: "Supernova Overdrive", category: "pedal", rarity: "legendary", req: { kind: "sessions", sessions: 110 }, blurb: "An exploding star compressed into a stompbox.", image: pedalSupernova },
  { id: "pedal-apocalypse", name: "Apocalypse Distortion", category: "pedal", rarity: "mythic", req: { kind: "streak", streak: 21 }, blurb: "End-of-worlds gain. Few dare to switch it on.", image: pedalApocalypse },
  { id: "pedal-quantum-octavia", name: "Quantum Octavia", category: "pedal", rarity: "mythic", req: { kind: "streak", streak: 28 }, blurb: "Splits your note across parallel universes.", image: pedalQuantumOctavia },

  // --- Amps ----------------------------------------------------------------
  { id: "amp-modeling", name: "Modeling Cube", category: "amp", rarity: "common", req: { kind: "level", level: 3 }, blurb: "A compact modeller with a galaxy of tones in one box.", image: ampModeling },
  { id: "amp-starlight", name: "Starlight Clean", category: "amp", rarity: "common", req: { kind: "level", level: 6 }, blurb: "Crystal-clear cleans that shimmer like distant stars.", image: ampStarlight },
  { id: "amp-tweed", name: "Vintage Tweed Deluxe", category: "amp", rarity: "common", req: { kind: "level", level: 9 }, blurb: "A warm, breaking-up combo from a bygone era.", image: ampTweedDeluxe },
  { id: "amp-bmac", name: "Bluesy AC Combo", category: "amp", rarity: "rare", req: { kind: "level", level: 12 }, blurb: "Chimey top end with a singing midrange bite.", image: ampBmAc },
  { id: "amp-quantummesa", name: "Quantum Mesa", category: "amp", rarity: "rare", req: { kind: "level", level: 16 }, blurb: "Tight, gain-soaked thunder for cosmic riffs.", image: ampQuantumMesa },
  { id: "amp-vintagemodern", name: "Vintage Modern", category: "amp", rarity: "rare", req: { kind: "level", level: 20 }, blurb: "Old-school grit with modern-day muscle.", image: ampVintageModern },
  { id: "amp-dumble", name: "Overdrive Special", category: "amp", rarity: "epic", req: { kind: "level", level: 24 }, blurb: "A boutique holy grail with liquid, vocal drive.", image: ampDumble },
  { id: "amp-frontallobe", name: "Frontal Lobe FX", category: "amp", rarity: "epic", req: { kind: "level", level: 28 }, blurb: "A floor-based brain of effects and amp models.", image: ampFrontalLobe },
  { id: "amp-hiwattage", name: "HiWattage 100", category: "amp", rarity: "epic", req: { kind: "level", level: 32 }, blurb: "Brutally loud, crystalline British headroom.", image: ampHiWattage },
  { id: "amp-futuristic", name: "Futuristic Head", category: "amp", rarity: "epic", req: { kind: "level", level: 36 }, blurb: "A sleek next-gen head from a far-off world.", image: ampFuturistic },
  { id: "amp-jcm", name: "JCM Stack", category: "amp", rarity: "legendary", req: { kind: "level", level: 40 }, blurb: "The classic roar that built rock and roll.", image: ampJcmStack },
  { id: "amp-quantumstack", name: "Quantum Stack", category: "amp", rarity: "legendary", req: { kind: "level", level: 44 }, blurb: "A half stack charged with quantum fire.", image: ampQuantumStack },
  { id: "amp-infinityrack", name: "Infinity Axe Rack", category: "amp", rarity: "legendary", req: { kind: "level", level: 47 }, blurb: "A rack of infinite tones at your fingertips.", image: ampInfinityRack },
  { id: "amp-galaxyfull", name: "Galaxy Full Stack", category: "amp", rarity: "legendary", req: { kind: "level", level: 50 }, blurb: "A towering wall of cosmic-grade thunder.", image: ampGalaxyFull },
  { id: "amp-infinityrackiii", name: "Infinity Axe Rack III", category: "amp", rarity: "mythic", req: { kind: "level", level: 55 }, blurb: "The third-gen rack that bends time and tone.", image: ampInfinityRackIii },
  { id: "amp-triplestack", name: "Triple Stack Wall", category: "amp", rarity: "mythic", req: { kind: "level", level: 62 }, blurb: "Three stacks high — a fortress of pure volume.", image: ampTripleStackWall },
  { id: "amp-mythicwall", name: "Mythic Wall", category: "amp", rarity: "mythic", req: { kind: "level", level: 70 }, blurb: "The loudest rig in the known universe.", image: ampMythicWall },

  // --- Cables ---------------------------------------------------------------
  { id: "cable-blackpurple", name: "Black Purple Speck", category: "cable", rarity: "common", req: { kind: "sessions", sessions: 2 }, blurb: "Standard-issue black braid flecked with cosmic purple.", image: cableBlackPurple, color: "#2a2436", color2: "#8b5cf6" },
  { id: "cable-electricblue", name: "Electric Blue", category: "cable", rarity: "common", req: { kind: "sessions", sessions: 9 }, blurb: "A bright woven lead with an electric-blue sheen.", image: cableElectricBlue, color: "#1d4ed8", color2: "#60a5fa" },
  { id: "cable-rubyred", name: "Ruby Red", category: "cable", rarity: "rare", req: { kind: "sessions", sessions: 24 }, blurb: "Deep red braid with gold AGS jacks at each end.", image: cableRubyRed, color: "#991b1b", color2: "#ef4444" },
  { id: "cable-whitegold", name: "White Gold", category: "cable", rarity: "rare", req: { kind: "streak", streak: 5 }, blurb: "A cream-and-gold lead fit for the main stage.", image: cableWhiteGold, color: "#d8c9a3", color2: "#fde68a" },
  { id: "cable-plasmablue", name: "Plasma Blue Glow", category: "cable", rarity: "epic", req: { kind: "sessions", sessions: 55 }, blurb: "Dark blue jacket lit by a pulsing plasma seam.", image: cablePlasmaBlue, color: "#1e3a8a", color2: "#3b82f6", glow: true },
  { id: "cable-purplecosmic", name: "Purple Cosmic", category: "cable", rarity: "epic", req: { kind: "streak", streak: 12 }, blurb: "A whole spiral arm of purple running down the jacket.", image: cablePurpleCosmic, color: "#6d28d9", color2: "#a78bfa", glow: true },
  { id: "cable-cosmicglow", name: "Cosmic Glow", category: "cable", rarity: "legendary", req: { kind: "sessions", sessions: 95 }, blurb: "Purple-and-gold weave crackling with cosmic light.", image: cableCosmicGlow, color: "#4c1d95", color2: "#facc15", glow: true },
  { id: "cable-supernova", name: "Supernova", category: "cable", rarity: "mythic", req: { kind: "streak", streak: 21 }, blurb: "Pure molten-gold braid pulled from a dying star.", image: cableSupernova, color: "#a16207", color2: "#fde047", glow: true },

  // --- Photo Straps (bag drops only — real photo art) -------------------------
  { id: "strap-p-caramel",     name: "Caramel Leather",   category: "strap", rarity: "common",    req: { kind: "sessions", sessions: 0 }, blurb: "Warm tan leather with a mellow finish.",                   pattern: "leather", color: "#c49a6c", image: "/gear/straps/caramel-leather.png" },
  { id: "strap-p-sand",        name: "Sand Leather",      category: "strap", rarity: "common",    req: { kind: "sessions", sessions: 0 }, blurb: "Desert-pale leather for a clean, minimal look.",            pattern: "leather", color: "#d4b896", image: "/gear/straps/sand-leather.png" },
  { id: "strap-p-ivory",       name: "Ivory White",       category: "strap", rarity: "common",    req: { kind: "sessions", sessions: 0 }, blurb: "Crisp white weave — classic for a reason.",                 pattern: "solid",   color: "#f5f0e8", image: "/gear/straps/ivory-white.png" },
  { id: "strap-p-vintage",     name: "Vintage Cream",     category: "strap", rarity: "common",    req: { kind: "sessions", sessions: 0 }, blurb: "Aged cream cotton, well-travelled.",                        pattern: "solid",   color: "#e8dcc8", image: "/gear/straps/vintage-cream.png" },
  { id: "strap-p-midnight-bk", name: "Midnight Black",    category: "strap", rarity: "common",    req: { kind: "sessions", sessions: 0 }, blurb: "Matte black nylon. Goes with everything.",                  pattern: "solid",   color: "#0a0a0f", image: "/gear/straps/midnight-black.png" },
  { id: "strap-p-chestnut",    name: "Chestnut Leather",  category: "strap", rarity: "common",    req: { kind: "sessions", sessions: 0 }, blurb: "Dark chestnut hide stamped with a fine grain.",             pattern: "leather", color: "#6b3a2a", image: "/gear/straps/chestnut-leather.png" },
  { id: "strap-p-baroque",     name: "Baroque Tapestry",  category: "strap", rarity: "rare",      req: { kind: "sessions", sessions: 0 }, blurb: "Ornate woven gold on deep burgundy.",                      pattern: "woven",   color: "#4a1020", color2: "#d4a847", image: "/gear/straps/baroque-tapestry.png" },
  { id: "strap-p-autumn",      name: "Autumn Tapestry",   category: "strap", rarity: "rare",      req: { kind: "sessions", sessions: 0 }, blurb: "Warm rust and amber woven into one.",                      pattern: "woven",   color: "#7c3a14", color2: "#d4882a", image: "/gear/straps/autumn-tapestry.png" },
  { id: "strap-p-sapphire",    name: "Sapphire Floral",   category: "strap", rarity: "rare",      req: { kind: "sessions", sessions: 0 }, blurb: "Deep blue with delicate floral embroidery.",               pattern: "woven",   color: "#1a2a5e", color2: "#60a5fa", image: "/gear/straps/sapphire-floral.png" },
  { id: "strap-p-rose",        name: "Rose Garden",       category: "strap", rarity: "rare",      req: { kind: "sessions", sessions: 0 }, blurb: "Blush tones and rose embroidery on cream.",                pattern: "woven",   color: "#8b3a52", color2: "#f9a8d4", image: "/gear/straps/rose-garden.png" },
  { id: "strap-p-aqua",        name: "Aqua Garden",       category: "strap", rarity: "rare",      req: { kind: "sessions", sessions: 0 }, blurb: "Teal weave with botanical accents.",                       pattern: "woven",   color: "#0d4a52", color2: "#22d3ee", image: "/gear/straps/aqua-garden.png" },
  { id: "strap-p-copper",      name: "Copper Tapestry",   category: "strap", rarity: "rare",      req: { kind: "sessions", sessions: 0 }, blurb: "Burnished copper threads in a geometric pattern.",          pattern: "woven",   color: "#5a2e0a", color2: "#b45309", image: "/gear/straps/copper-tapestry.png" },
  { id: "strap-p-honey",       name: "Honey Leather",     category: "strap", rarity: "rare",      req: { kind: "sessions", sessions: 0 }, blurb: "Amber-gold leather, supple and rich.",                     pattern: "leather", color: "#a06820", image: "/gear/straps/honey-leather.png" },
  { id: "strap-p-cobalt",      name: "Cobalt Racer",      category: "strap", rarity: "rare",      req: { kind: "sessions", sessions: 0 }, blurb: "Vivid cobalt with speed-stripe accents.",                  pattern: "stripes", color: "#1e40af", color2: "#93c5fd", image: "/gear/straps/cobalt-racer.png" },
  { id: "strap-p-dark-brocade",name: "Dark Brocade",      category: "strap", rarity: "epic",      req: { kind: "sessions", sessions: 0 }, blurb: "Black brocade woven with silver moonlight.",               pattern: "woven",   color: "#0f1014", color2: "#9ca3af", image: "/gear/straps/dark-brocade.png" },
  { id: "strap-p-folk",        name: "Folk Tapestry",     category: "strap", rarity: "epic",      req: { kind: "sessions", sessions: 0 }, blurb: "Boho weave in forest colours with folk motifs.",            pattern: "woven",   color: "#2d4a1e", color2: "#86efac", image: "/gear/straps/folk-tapestry.png" },
  { id: "strap-p-ocean",       name: "Ocean Tapestry",    category: "strap", rarity: "epic",      req: { kind: "sessions", sessions: 0 }, blurb: "Wave-blue gradient tapestry from the deep.",               pattern: "woven",   color: "#0c2a4a", color2: "#38bdf8", image: "/gear/straps/ocean-tapestry.png" },
  { id: "strap-p-obsidian",    name: "Obsidian Tapestry", category: "strap", rarity: "epic",      req: { kind: "sessions", sessions: 0 }, blurb: "Black and charcoal weave with volcanic depth.",             pattern: "woven",   color: "#0a0a14", color2: "#6b7280", image: "/gear/straps/obsidian-tapestry.png" },
  { id: "strap-p-mid-roses",   name: "Midnight Roses",    category: "strap", rarity: "epic",      req: { kind: "sessions", sessions: 0 }, blurb: "Crimson roses blooming against the void.",                 pattern: "woven",   color: "#1a0510", color2: "#ef4444", image: "/gear/straps/midnight-roses.png" },
  { id: "strap-p-sunset",      name: "Sunset Rainbow",    category: "strap", rarity: "epic",      req: { kind: "sessions", sessions: 0 }, blurb: "Every sunset colour woven into one wild band.",             pattern: "rainbow", color: "#1a0a1e", color2: "#f59e0b", image: "/gear/straps/sunset-rainbow.png" },
  { id: "strap-p-neon",        name: "Neon Pink Rush",    category: "strap", rarity: "epic",      req: { kind: "sessions", sessions: 0 }, blurb: "Hot-pink racer with neon speed lines.",                    pattern: "stripes", color: "#2d0020", color2: "#f472b6", image: "/gear/straps/neon-pink.png" },
  { id: "strap-p-prism",       name: "Prism Burst",       category: "strap", rarity: "legendary", req: { kind: "sessions", sessions: 0 }, blurb: "A prism of light frozen in the finest tapestry.",          pattern: "rainbow", color: "#05060f", color2: "#ffffff", image: "/gear/straps/prism-burst.png" },
  { id: "strap-p-golden-gdn",  name: "Golden Garden",     category: "strap", rarity: "legendary", req: { kind: "sessions", sessions: 0 }, blurb: "Gold floral brocade on pearl — for the worthy.",           pattern: "woven",   color: "#1a1206", color2: "#fbbf24", image: "/gear/straps/golden-garden.png" },
  { id: "strap-p-royal",       name: "Royal Brocade",     category: "strap", rarity: "legendary", req: { kind: "sessions", sessions: 0 }, blurb: "Regal tapestry last seen in a royal court.",               pattern: "woven",   color: "#0f0a2a", color2: "#c4b5fd", image: "/gear/straps/royal-brocade.png" },

  // --- Coin prizes (credit wallet, never added to gear collection) ------------
  { id: "coin-50",  name: "50 Coins",  category: "coin", rarity: "common", req: { kind: "sessions", sessions: 0 }, blurb: "A handful of alien coins.", coinAmount: 50 },
  { id: "coin-150", name: "150 Coins", category: "coin", rarity: "rare",   req: { kind: "sessions", sessions: 0 }, blurb: "A decent pile of alien coins.", coinAmount: 150 },
  { id: "coin-300", name: "300 Coins", category: "coin", rarity: "epic",   req: { kind: "sessions", sessions: 0 }, blurb: "A fat stack of alien coins.", coinAmount: 300 },
];

export function gearByCategory(category: GearCategory): GearItem[] {
  return GEAR.filter((g) => g.category === category);
}

export type PickItem = Extract<GearItem, { category: "pick" }>;

// Finishes considered "flashy" — these are the picks earned for a great Daily
// Practice score. Listed in collection priority (holographic first, to honour
// "a great score earns a holographic pick").
const GREAT_PICK_FINISHES: PickFinish[] = [
  "holographic",
  "foil",
  "prism",
  "pearl",
  "galaxy",
  "neon",
];

// Picks awarded by Daily Practice, graded by drill accuracy. A "great" score
// earns one of the flashy picks (holographic first); an "ok" score earns one of
// the everyday picks. The caller collects the first item the player doesn't
// already own.
export function pickRewardPool(tier: "ok" | "great"): PickItem[] {
  const picks = GEAR.filter((g): g is PickItem => g.category === "pick");
  if (tier === "great") {
    return picks
      .filter((p) => GREAT_PICK_FINISHES.includes(p.finish))
      .sort(
        (a, b) =>
          GREAT_PICK_FINISHES.indexOf(a.finish) - GREAT_PICK_FINISHES.indexOf(b.finish),
      );
  }
  return picks.filter((p) => !GREAT_PICK_FINISHES.includes(p.finish));
}

export type StrapItem = Extract<GearItem, { category: "strap" }>;
export type PedalItem = Extract<GearItem, { category: "pedal" }>;
export type AmpItem = Extract<GearItem, { category: "amp" }>;

// Hand out the most modest gear first as rewards, working up to the rare stuff.
const REWARD_RARITY_ORDER: Rarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

function byRewardRarity(a: GearItem, b: GearItem): number {
  return (
    REWARD_RARITY_ORDER.indexOf(a.rarity) - REWARD_RARITY_ORDER.indexOf(b.rarity)
  );
}

// Straps handed out by Daily Practice (modest rarities first). Like picks, the
// reward is decoupled from the strap's own milestone — practising the routine is
// what earns it.
export function strapRewardPool(): StrapItem[] {
  return GEAR.filter((g): g is StrapItem => g.category === "strap").sort(
    byRewardRarity,
  );
}

// Pedals handed out by Daily Practice (modest rarities first), same idea as
// straps.
export function pedalRewardPool(): PedalItem[] {
  return GEAR.filter((g): g is PedalItem => g.category === "pedal").sort(
    byRewardRarity,
  );
}

// Amps the player has levelled up enough to claim, lowest level first. Amps
// unlock by level (see each amp's req), matching the Vault's "climb the levels
// to claim amps" promise — so they only feature as rewards once earned.
export function ampRewardPool(level: number): AmpItem[] {
  return GEAR.filter(
    (g): g is AmpItem =>
      g.category === "amp" && g.req.kind === "level" && level >= g.req.level,
  ).sort((a, b) => {
    const al = a.req.kind === "level" ? a.req.level : 0;
    const bl = b.req.kind === "level" ? b.req.level : 0;
    return al - bl;
  });
}
