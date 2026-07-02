/**
 * Gear catalog — all collectible items in the AGS reward system.
 * Items are earned from mystery gear bags after completing drills.
 */
import { type ImageRequireSource } from "react-native";

import { type BagTierConfig, BAG_TIERS } from "./coins";

export type GearCategory = "guitar" | "amp" | "pedal" | "cable" | "pick" | "strap" | "coin";

export type GearRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type PickFinish =
  | "solid" | "holographic" | "glitter" | "foil" | "pearl"
  | "prism" | "neon" | "galaxy" | "carbon" | "marble";

export type StrapPattern =
  | "solid" | "stripes" | "woven" | "leather" | "cosmic"
  | "chevron" | "diamond" | "studded" | "flames" | "leopard"
  | "lightning" | "tiedye" | "rainbow" | "zebra";

export interface GearItem {
  id: string;
  name: string;
  category: GearCategory;
  rarity: GearRarity;
  description: string;
  image?: ImageRequireSource;  // undefined for procedural items (picks, straps)
  color?: string;              // primary colour for picks / straps
  color2?: string;             // accent colour
  finish?: PickFinish;         // for picks
  pattern?: StrapPattern;      // for straps
  coinAmount?: number;         // for coin prizes only
}

export const RARITY_COLOR: Record<GearRarity, string> = {
  common:    "#9ca3af",
  rare:      "#60a5fa",
  epic:      "#a855f7",
  legendary: "#f59e0b",
  mythic:    "#ec4899",
};

export const RARITY_WEIGHT: Record<GearRarity, number> = {
  common:    60,
  rare:      25,
  epic:      10,
  legendary: 4,
  mythic:    1,
};

// ── Bag rolling ────────────────────────────────────────────────────────────────

function rollRarityForTier(tier: BagTierConfig): GearRarity {
  const weights: Record<GearRarity, number> =
    tier.id === "mythic"    ? { common: 0,  rare: 5,  epic: 30, legendary: 35, mythic: 30 }
    : tier.id === "legendary" ? { common: 0,  rare: 10, epic: 40, legendary: 40, mythic: 10 }
    : tier.id === "elite"     ? { common: 5,  rare: 25, epic: 45, legendary: 22, mythic: 3  }
    : tier.id === "premium"   ? { common: 20, rare: 40, epic: 28, legendary: 10, mythic: 2  }
    : { ...RARITY_WEIGHT };

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights) as [GearRarity, number][]) {
    roll -= weight;
    if (roll <= 0) return rarity as GearRarity;
  }
  return "common";
}

// ── Guitars ────────────────────────────────────────────────────────────────────
const GUITARS: GearItem[] = [
  { id: "guitar_nebula_starter",  name: "Nebula Starter",     category: "guitar", rarity: "common",    image: require("@/assets/images/gear/guitars/nebula-starter.png"),   description: "A battered but honest electric from the asteroid belt pawn shops." },
  { id: "guitar_black_strat",     name: "Black Strat",        category: "guitar", rarity: "common",    image: require("@/assets/images/gear/guitars/black-strat.png"),       description: "Stripped-back single-coil tone. Classic for a reason." },
  { id: "guitar_solar_spark",     name: "Solar Spark",        category: "guitar", rarity: "rare",      image: require("@/assets/images/gear/guitars/solar-spark.png"),       description: "Sunburst finish painted with nebula dust. Plays surprisingly well." },
  { id: "guitar_comet_cruiser",   name: "Comet Cruiser",      category: "guitar", rarity: "rare",      image: require("@/assets/images/gear/guitars/comet-cruiser.png"),     description: "Built for speed runs across the outer rim." },
  { id: "guitar_plasma_drifter",  name: "Plasma Drifter",     category: "guitar", rarity: "epic",      image: require("@/assets/images/gear/guitars/plasma-drifter.png"),   description: "Single-coil clarity from the Telecaster workshops of Texarion Prime." },
  { id: "guitar_lunar_lancer",    name: "Lunar Lancer",       category: "guitar", rarity: "epic",      image: require("@/assets/images/gear/guitars/lunar-lancer.png"),     description: "Balanced and bright — the weapon of choice on Harmonia IV." },
  { id: "guitar_frankenstrat",    name: "Frankenstrat",       category: "guitar", rarity: "legendary", image: require("@/assets/images/gear/guitars/frankenstrat.png"),     description: "Hand-built from salvaged parts. Resonates with cosmic energy." },
  { id: "guitar_demon_axe",       name: "Demon Axe",          category: "guitar", rarity: "legendary", image: require("@/assets/images/gear/guitars/demon-axe.png"),        description: "Awarded only to those who face a Guardian. Handle with care." },
  { id: "guitar_vortex_vanguard", name: "Vortex Vanguard",    category: "guitar", rarity: "mythic",    image: require("@/assets/images/gear/guitars/vortex-vanguard.png"),  description: "Pulled from a collapsing star. The worthy may play it." },
  { id: "guitar_ags_masterpiece", name: "AGS Masterpiece",    category: "guitar", rarity: "mythic",    image: require("@/assets/images/gear/guitars/ags-masterpiece.png"),  description: "Zashtar's own guitar. Left behind on Earth as a gift to the worthy." },
];

// ── Pedals ─────────────────────────────────────────────────────────────────────
const PEDALS: GearItem[] = [
  { id: "pedal_tuner",         name: "PolyStrobe Tuner",       category: "pedal", rarity: "common",    image: require("@/assets/images/gear/pedals/polystrobe-tuner.png"),      description: "Lock onto any note from light-years away." },
  { id: "pedal_classic_dist",  name: "Classic Distortion",     category: "pedal", rarity: "common",    image: require("@/assets/images/gear/pedals/classic-distortion.png"),    description: "Warm, dependable grit for every cadet." },
  { id: "pedal_fuzz_comet",    name: "Fuzz Comet",             category: "pedal", rarity: "common",    image: require("@/assets/images/gear/pedals/fuzz-comet.png"),             description: "Thick, woolly fuzz with a cosmic snarl." },
  { id: "pedal_delay_echo",    name: "Delay Echo",             category: "pedal", rarity: "common",    image: require("@/assets/images/gear/pedals/delay-echo.png"),             description: "Tidy repeats that trail off into the dark." },
  { id: "pedal_bluesy",        name: "Bluesy Musey Drive",     category: "pedal", rarity: "rare",      image: require("@/assets/images/gear/pedals/bluesy-musey-drive.png"),    description: "Soulful, singing overdrive with a cosmic-blue sparkle." },
  { id: "pedal_galaxy_chorus", name: "Galaxy Chorus",          category: "pedal", rarity: "rare",      image: require("@/assets/images/gear/pedals/galaxy-chorus.png"),          description: "Splits one note into a shimmering galaxy." },
  { id: "pedal_shred",         name: "Shred Distortion",       category: "pedal", rarity: "epic",      image: require("@/assets/images/gear/pedals/shred-distortion.png"),      description: "High-gain fury for warp-speed runs." },
  { id: "pedal_cosmic_wah",    name: "Cosmic Wah",             category: "pedal", rarity: "epic",      image: require("@/assets/images/gear/pedals/cosmic-wah.png"),             description: "An expressive wah forged on a distant world." },
  { id: "pedal_meteor",        name: "Meteor Lights",          category: "pedal", rarity: "legendary", image: require("@/assets/images/gear/pedals/meteor-lights.png"),          description: "Distortion that streaks like a falling meteor." },
  { id: "pedal_delay_bh",      name: "Delay Blackhole",        category: "pedal", rarity: "legendary", image: require("@/assets/images/gear/pedals/delay-blackhole.png"),       description: "Repeats that fall forever into a black hole." },
  { id: "pedal_supernova",     name: "Supernova Overdrive",    category: "pedal", rarity: "legendary", image: require("@/assets/images/gear/pedals/supernova-overdrive.png"),   description: "An exploding star compressed into a stompbox." },
  { id: "pedal_apocalypse",    name: "Apocalypse Distortion",  category: "pedal", rarity: "mythic",    image: require("@/assets/images/gear/pedals/apocalypse-distortion.png"), description: "End-of-worlds gain. Few dare to switch it on." },
  { id: "pedal_quantum_oct",   name: "Quantum Octavia",        category: "pedal", rarity: "mythic",    image: require("@/assets/images/gear/pedals/quantum-octavia.png"),       description: "Splits your note across parallel universes." },
];

// ── Amps ───────────────────────────────────────────────────────────────────────
const AMPS: GearItem[] = [
  { id: "amp_modeling",      name: "Modeling Cube",        category: "amp", rarity: "common",    image: require("@/assets/images/gear/amps/modeling-amp.png"),          description: "A compact modeller with a galaxy of tones in one box." },
  { id: "amp_tweed",         name: "Vintage Tweed Deluxe", category: "amp", rarity: "common",    image: require("@/assets/images/gear/amps/vintage-tweed-deluxe.png"),  description: "A warm, breaking-up combo from a bygone era." },
  { id: "amp_bmac",          name: "Bluesy AC Combo",      category: "amp", rarity: "rare",      image: require("@/assets/images/gear/amps/bm-ac.png"),                 description: "Chimey top end with a singing midrange bite." },
  { id: "amp_quantum_mesa",  name: "Quantum Mesa",         category: "amp", rarity: "rare",      image: require("@/assets/images/gear/amps/quantum-mesa.png"),          description: "Tight, gain-soaked thunder for cosmic riffs." },
  { id: "amp_dumble",        name: "Overdrive Special",    category: "amp", rarity: "epic",      image: require("@/assets/images/gear/amps/dumble.png"),                description: "A boutique holy grail with liquid, vocal drive." },
  { id: "amp_jcm",           name: "JCM Stack",            category: "amp", rarity: "legendary", image: require("@/assets/images/gear/amps/jcm-stack.png"),             description: "The classic roar that built rock and roll." },
  { id: "amp_quantum_stack", name: "Quantum Stack",        category: "amp", rarity: "legendary", image: require("@/assets/images/gear/amps/quantum-stack.png"),         description: "A half-stack charged with quantum fire." },
  { id: "amp_galaxy_full",   name: "Galaxy Full Stack",    category: "amp", rarity: "legendary", image: require("@/assets/images/gear/amps/galaxy-full-stack.png"),     description: "A towering wall of cosmic-grade thunder." },
  { id: "amp_mythic_wall",   name: "Mythic Wall",          category: "amp", rarity: "mythic",    image: require("@/assets/images/gear/amps/mythic-wall.png"),           description: "More a sonic weapon than an amplifier. Only the worthy may turn it past 3." },
];

// ── Cables ─────────────────────────────────────────────────────────────────────
const CABLES: GearItem[] = [
  { id: "cable_black_purple", name: "Black Purple Speck",  category: "cable", rarity: "common",    image: require("@/assets/images/gear/cables/black-purple-speck.png"), description: "Short patch cable. Keeps your signal clean between planets." },
  { id: "cable_electric_blue",name: "Electric Blue",       category: "cable", rarity: "common",    image: require("@/assets/images/gear/cables/electric-blue.png"),       description: "Cool blue coil for the no-nonsense player." },
  { id: "cable_ruby_red",     name: "Ruby Red",            category: "cable", rarity: "rare",      image: require("@/assets/images/gear/cables/ruby-red.png"),            description: "Hot-red signal path, zero noise floor." },
  { id: "cable_white_gold",   name: "White Gold",          category: "cable", rarity: "rare",      image: require("@/assets/images/gear/cables/white-gold.png"),          description: "Premium gold-tipped cable. Style and substance." },
  { id: "cable_plasma_blue",  name: "Plasma Blue Glow",    category: "cable", rarity: "epic",      image: require("@/assets/images/gear/cables/plasma-blue-glow.png"),   description: "Glows faintly at high volume. Nobody knows why." },
  { id: "cable_purple_cosmic",name: "Purple Cosmic",       category: "cable", rarity: "epic",      image: require("@/assets/images/gear/cables/purple-cosmic.png"),       description: "Hand-wound on Arpeggion Prime. Zero signal loss." },
  { id: "cable_cosmic_glow",  name: "Cosmic Glow",         category: "cable", rarity: "legendary", image: require("@/assets/images/gear/cables/cosmic-glow.png"),         description: "Emits an actual glow at stage volume. Still passes safety checks." },
  { id: "cable_supernova",    name: "Supernova",           category: "cable", rarity: "mythic",    image: require("@/assets/images/gear/cables/supernova.png"),            description: "Scientifically impossible. Zero signal loss. Yet here we are." },
];

export const PICKS: GearItem[] = [
  { id: "pick_onyx",       name: "Onyx Standard",      category: "pick", rarity: "common",    finish: "solid",        color: "#1c2233",                description: "A trusty matte-black plectrum for every cadet." },
  { id: "pick_solar",      name: "Solar Flare",         category: "pick", rarity: "common",    finish: "solid",        color: "#f5a623",                description: "Warm amber resin that glows with practice." },
  { id: "pick_cobalt",     name: "Cobalt Glitter",      category: "pick", rarity: "common",    finish: "glitter",      color: "#1d4ed8",                description: "Deep blue resin packed with twinkling flecks." },
  { id: "pick_holo",       name: "Holographic Nebula",  category: "pick", rarity: "rare",      finish: "holographic",  color: "#8a2be2", color2: "#00e5ff", description: "Shifts through every colour of a distant nebula." },
  { id: "pick_glitter",    name: "Quasar Glitter",      category: "pick", rarity: "rare",      finish: "glitter",      color: "#ff3ea5",                description: "Suspended starflecks sparkle as you strum." },
  { id: "pick_carbon",     name: "Carbon Vortex",       category: "pick", rarity: "rare",      finish: "carbon",       color: "#161b24", color2: "#2b3242", description: "Woven carbon weave with a stealthy sheen." },
  { id: "pick_neon_pink",  name: "Hot Pink Laser",      category: "pick", rarity: "rare",      finish: "neon",         color: "#ff1f8f", color2: "#ff6ad5", description: "Searing neon that hums against the dark." },
  { id: "pick_galaxy",     name: "Galaxy Swirl",        category: "pick", rarity: "rare",      finish: "galaxy",       color: "#2b0a4a", color2: "#00e5ff", description: "A whole spiral arm caught in resin." },
  { id: "pick_foil",       name: "Stardust Foil",       category: "pick", rarity: "epic",      finish: "foil",         color: "#c0c6d6",                description: "Mirror-bright foil milled from a fallen comet." },
  { id: "pick_prism",      name: "Prism Pulsar",        category: "pick", rarity: "epic",      finish: "prism",        color: "#22d3ee", color2: "#f43f5e", description: "Splits your tone into a spectrum of light." },
  { id: "pick_marble",     name: "Marble Comet",        category: "pick", rarity: "epic",      finish: "marble",       color: "#eef1f7", color2: "#c026d3", description: "Cream stone veined with magenta lightning." },
  { id: "pick_holo_gold",  name: "Holo Gold",           category: "pick", rarity: "epic",      finish: "holographic",  color: "#f59e0b", color2: "#34d399", description: "Gold that fans into emerald as you tilt it." },
  { id: "pick_aurora",     name: "Aurora Pearl",        category: "pick", rarity: "legendary", finish: "pearl",        color: "#a7f3d0", color2: "#60a5fa", description: "An iridescent pearl that shimmers like polar skies." },
  { id: "pick_singularity",name: "Singularity",         category: "pick", rarity: "mythic",    finish: "neon",         color: "#b026ff", color2: "#00ffd5", description: "Forged at the edge of a black hole. Few hold it." },
];

export const STRAPS: GearItem[] = [
  { id: "strap_cadet",       name: "Cadet Webbing",   category: "strap", rarity: "common",    pattern: "solid",     color: "#4456a0",                description: "Standard-issue nylon for the young explorer." },
  { id: "strap_comet",       name: "Comet Tail",      category: "strap", rarity: "common",    pattern: "stripes",   color: "#1e293b", color2: "#f59e0b", description: "Twin stripes that streak like a passing comet." },
  { id: "strap_meteor",      name: "Meteor Leather",  category: "strap", rarity: "rare",      pattern: "leather",   color: "#7c4a21",                description: "Tanned hide stamped with crater patterns." },
  { id: "strap_studded",     name: "Star Studded",    category: "strap", rarity: "rare",      pattern: "studded",   color: "#2b1840", color2: "#e9d5ff", description: "Chrome rivets marching in twin constellations." },
  { id: "strap_chevron",     name: "Pulse Chevron",   category: "strap", rarity: "rare",      pattern: "chevron",   color: "#14233f", color2: "#22d3ee", description: "Cyan arrows pointing ever onward." },
  { id: "strap_diamond",     name: "Diamond Lattice", category: "strap", rarity: "rare",      pattern: "diamond",   color: "#1a0820", color2: "#ff5fa2", description: "A net of glinting diamonds across the void." },
  { id: "strap_leopard",     name: "Cosmic Leopard",  category: "strap", rarity: "rare",      pattern: "leopard",   color: "#caa34a", color2: "#1a1206", description: "Wild rosette spots for the rockstar in you." },
  { id: "strap_zebra",       name: "Zebra Static",    category: "strap", rarity: "rare",      pattern: "zebra",     color: "#f5f5f7", color2: "#0a0a0f", description: "Bold black-and-white stripes with attitude." },
  { id: "strap_woven",       name: "Woven Galaxy",    category: "strap", rarity: "epic",      pattern: "woven",     color: "#5b21b6", color2: "#22d3ee", description: "Hand-woven threads from a spiral galaxy." },
  { id: "strap_plasma",      name: "Plasma Weave",    category: "strap", rarity: "epic",      pattern: "cosmic",    color: "#0b1026", color2: "#ec4899", description: "Crackling energy braided into a band." },
  { id: "strap_flames",      name: "Hot Rod Flames",  category: "strap", rarity: "epic",      pattern: "flames",    color: "#0a0a0f", color2: "#ff5a00", description: "Licking flames blazing up a jet-black band." },
  { id: "strap_lightning",   name: "Thunder Bolt",    category: "strap", rarity: "rare",      pattern: "lightning", color: "#0b1026", color2: "#fde047", description: "Electric bolts crackling down the length." },
  { id: "strap_eclipse",     name: "Eclipse Royale",  category: "strap", rarity: "legendary", pattern: "cosmic",    color: "#0a0a0f", color2: "#fbbf24", description: "Black silk crowned with a corona of gold." },
  { id: "strap_rainbow",     name: "Prism Rainbow",   category: "strap", rarity: "legendary", pattern: "rainbow",   color: "#05060f", color2: "#ffffff", description: "Every colour of the spectrum in one wild band." },
];

// Photo straps — real photograph-cropped images, used as the strap drop pool
// for mystery bags.  The procedural STRAPS above stay for milestone rewards.
const PHOTO_STRAPS: GearItem[] = [
  // Common
  { id: "strap_p_caramel",     name: "Caramel Leather",   category: "strap", rarity: "common",    image: require("@/assets/images/gear/straps/caramel-leather.png"),   pattern: "leather", color: "#c49a6c", description: "Warm tan leather with a mellow finish." },
  { id: "strap_p_sand",        name: "Sand Leather",      category: "strap", rarity: "common",    image: require("@/assets/images/gear/straps/sand-leather.png"),      pattern: "leather", color: "#d4b896", description: "Desert-pale leather for a clean, minimal look." },
  { id: "strap_p_ivory",       name: "Ivory White",       category: "strap", rarity: "common",    image: require("@/assets/images/gear/straps/ivory-white.png"),       pattern: "solid",   color: "#f5f0e8", description: "Crisp white weave — classic for a reason." },
  { id: "strap_p_vintage",     name: "Vintage Cream",     category: "strap", rarity: "common",    image: require("@/assets/images/gear/straps/vintage-cream.png"),     pattern: "solid",   color: "#e8dcc8", description: "Aged cream cotton, well-travelled." },
  { id: "strap_p_midnight_bk", name: "Midnight Black",    category: "strap", rarity: "common",    image: require("@/assets/images/gear/straps/midnight-black.png"),    pattern: "solid",   color: "#0a0a0f", description: "Matte black nylon. Goes with everything." },
  { id: "strap_p_chestnut",    name: "Chestnut Leather",  category: "strap", rarity: "common",    image: require("@/assets/images/gear/straps/chestnut-leather.png"),  pattern: "leather", color: "#6b3a2a", description: "Dark chestnut hide stamped with a fine grain." },
  // Rare
  { id: "strap_p_baroque",     name: "Baroque Tapestry",  category: "strap", rarity: "rare",      image: require("@/assets/images/gear/straps/baroque-tapestry.png"),  pattern: "woven",   color: "#4a1020", color2: "#d4a847", description: "Ornate woven gold on deep burgundy." },
  { id: "strap_p_autumn",      name: "Autumn Tapestry",   category: "strap", rarity: "rare",      image: require("@/assets/images/gear/straps/autumn-tapestry.png"),   pattern: "woven",   color: "#7c3a14", color2: "#d4882a", description: "Warm rust and amber woven into one." },
  { id: "strap_p_sapphire",    name: "Sapphire Floral",   category: "strap", rarity: "rare",      image: require("@/assets/images/gear/straps/sapphire-floral.png"),   pattern: "woven",   color: "#1a2a5e", color2: "#60a5fa", description: "Deep blue with delicate floral embroidery." },
  { id: "strap_p_rose",        name: "Rose Garden",       category: "strap", rarity: "rare",      image: require("@/assets/images/gear/straps/rose-garden.png"),       pattern: "woven",   color: "#8b3a52", color2: "#f9a8d4", description: "Blush tones and rose embroidery on cream." },
  { id: "strap_p_aqua",        name: "Aqua Garden",       category: "strap", rarity: "rare",      image: require("@/assets/images/gear/straps/aqua-garden.png"),       pattern: "woven",   color: "#0d4a52", color2: "#22d3ee", description: "Teal weave with botanical accents." },
  { id: "strap_p_copper",      name: "Copper Tapestry",   category: "strap", rarity: "rare",      image: require("@/assets/images/gear/straps/copper-tapestry.png"),   pattern: "woven",   color: "#5a2e0a", color2: "#b45309", description: "Burnished copper threads in a geometric pattern." },
  { id: "strap_p_honey",       name: "Honey Leather",     category: "strap", rarity: "rare",      image: require("@/assets/images/gear/straps/honey-leather.png"),     pattern: "leather", color: "#a06820", description: "Amber-gold leather, supple and rich." },
  { id: "strap_p_cobalt",      name: "Cobalt Racer",      category: "strap", rarity: "rare",      image: require("@/assets/images/gear/straps/cobalt-racer.png"),      pattern: "stripes", color: "#1e40af", color2: "#93c5fd", description: "Vivid cobalt with speed-stripe accents." },
  // Epic
  { id: "strap_p_dark_brocade",name: "Dark Brocade",      category: "strap", rarity: "epic",      image: require("@/assets/images/gear/straps/dark-brocade.png"),      pattern: "woven",   color: "#0f1014", color2: "#9ca3af", description: "Black brocade woven with silver moonlight." },
  { id: "strap_p_folk",        name: "Folk Tapestry",     category: "strap", rarity: "epic",      image: require("@/assets/images/gear/straps/folk-tapestry.png"),      pattern: "woven",   color: "#2d4a1e", color2: "#86efac", description: "Boho weave in forest colours with folk motifs." },
  { id: "strap_p_ocean",       name: "Ocean Tapestry",    category: "strap", rarity: "epic",      image: require("@/assets/images/gear/straps/ocean-tapestry.png"),     pattern: "woven",   color: "#0c2a4a", color2: "#38bdf8", description: "Wave-blue gradient tapestry from the deep." },
  { id: "strap_p_obsidian",    name: "Obsidian Tapestry", category: "strap", rarity: "epic",      image: require("@/assets/images/gear/straps/obsidian-tapestry.png"),  pattern: "woven",   color: "#0a0a14", color2: "#6b7280", description: "Black and charcoal weave with volcanic depth." },
  { id: "strap_p_mid_roses",   name: "Midnight Roses",    category: "strap", rarity: "epic",      image: require("@/assets/images/gear/straps/midnight-roses.png"),     pattern: "woven",   color: "#1a0510", color2: "#ef4444", description: "Crimson roses blooming against the void." },
  { id: "strap_p_sunset",      name: "Sunset Rainbow",    category: "strap", rarity: "epic",      image: require("@/assets/images/gear/straps/sunset-rainbow.png"),     pattern: "rainbow", color: "#1a0a1e", color2: "#f59e0b", description: "Every sunset colour woven into one wild band." },
  { id: "strap_p_neon",        name: "Neon Pink Rush",    category: "strap", rarity: "epic",      image: require("@/assets/images/gear/straps/neon-pink.png"),          pattern: "stripes", color: "#2d0020", color2: "#f472b6", description: "Hot-pink racer with neon speed lines." },
  // Legendary
  { id: "strap_p_prism",       name: "Prism Burst",       category: "strap", rarity: "legendary", image: require("@/assets/images/gear/straps/prism-burst.png"),       pattern: "rainbow", color: "#05060f", color2: "#ffffff", description: "A prism of light frozen in the finest tapestry." },
  { id: "strap_p_golden_gdn",  name: "Golden Garden",     category: "strap", rarity: "legendary", image: require("@/assets/images/gear/straps/golden-garden.png"),     pattern: "woven",   color: "#1a1206", color2: "#fbbf24", description: "Gold floral brocade on pearl — for the worthy." },
  { id: "strap_p_royal",       name: "Royal Brocade",     category: "strap", rarity: "legendary", image: require("@/assets/images/gear/straps/royal-brocade.png"),     pattern: "woven",   color: "#0f0a2a", color2: "#c4b5fd", description: "Regal tapestry last seen in a royal court." },
];

// Coin prizes credit the wallet — never enter the gear collection.
const COIN_PRIZES: GearItem[] = [
  { id: "coin_50",  name: "50 Coins",  category: "coin", rarity: "common", coinAmount: 50,  image: require("@/assets/images/gear/coins.png"), description: "A handful of alien coins." },
  { id: "coin_150", name: "150 Coins", category: "coin", rarity: "rare",   coinAmount: 150, image: require("@/assets/images/gear/coins.png"), description: "A decent pile of alien coins." },
  { id: "coin_300", name: "300 Coins", category: "coin", rarity: "epic",   coinAmount: 300, image: require("@/assets/images/gear/coins.png"), description: "A fat stack of alien coins." },
];

export const GEAR_CATALOG: GearItem[] = [
  ...GUITARS,
  ...AMPS,
  ...PEDALS,
  ...CABLES,
  ...PICKS,
  ...STRAPS,
  ...PHOTO_STRAPS,
  ...COIN_PRIZES,
];

// ── Weighted bag rolling ────────────────────────────────────────────────────────

type BagCategory = "coin" | "strap" | "cable" | "pedal" | "amp" | "guitar";

const BAG_TYPE_WEIGHTS: Record<BagCategory, number> = {
  coin: 4, strap: 5, cable: 3, pedal: 2, amp: 1, guitar: 1,
};

function getBagPool(type: BagCategory): GearItem[] {
  switch (type) {
    case "coin":   return COIN_PRIZES;
    case "strap":  return PHOTO_STRAPS;
    case "cable":  return CABLES;
    case "pedal":  return PEDALS;
    case "amp":    return AMPS;
    case "guitar": return GUITARS;
  }
}

function pickWeightedType(available: BagCategory[]): BagCategory {
  const total = available.reduce((s, t) => s + BAG_TYPE_WEIGHTS[t], 0);
  let roll = Math.random() * total;
  for (const t of available) {
    roll -= BAG_TYPE_WEIGHTS[t];
    if (roll <= 0) return t;
  }
  return available[available.length - 1];
}

/**
 * Roll a mystery bag for a given tier.
 * Type draw is weighted (coins/straps/picks 4× · cables 2× · pedals/amps/guitars 1×)
 * and no category repeats within one bag.
 * Coin prizes credit the wallet — they never enter the gear collection.
 */
export function rollBagForTier(tier: BagTierConfig, ownedIds: string[]): GearItem[] {
  const count =
    tier.id === "legendary" ? 3
    : tier.id === "premium"  ? 2 + (Math.random() < 0.5 ? 1 : 0)
    : 1 + (Math.random() < 0.5 ? 1 : 0);

  const dropped: GearItem[] = [];
  const droppedIds = new Set<string>();
  const usedTypes = new Set<BagCategory>();

  for (let i = 0; i < count; i++) {
    const availableTypes = (Object.keys(BAG_TYPE_WEIGHTS) as BagCategory[]).filter(
      (t) => !usedTypes.has(t) && getBagPool(t).some((g) => !droppedIds.has(g.id)),
    );
    if (availableTypes.length === 0) break;

    const type = pickWeightedType(availableTypes);
    usedTypes.add(type);

    const typePool = getBagPool(type).filter((g) => !droppedIds.has(g.id));
    let picked: GearItem;
    if (type === "coin") {
      picked = typePool[Math.floor(Math.random() * typePool.length)];
    } else {
      const rarity = rollRarityForTier(tier);
      const rarityPool = typePool.filter((g) => g.rarity === rarity);
      const pool = rarityPool.length > 0 ? rarityPool : typePool;
      picked = pool[Math.floor(Math.random() * pool.length)];
    }

    dropped.push(picked);
    droppedIds.add(picked.id);
  }

  return dropped;
}

export const STARTER_GEAR_IDS: string[] = [
  "guitar_nebula_starter",
  "guitar_black_strat",
  "pedal_tuner",
  "amp_modeling",
  "cable_black_purple",
  "pick_onyx",
  "strap_cadet",
];

export function gearById(id: string): GearItem | undefined {
  return GEAR_CATALOG.find((g) => g.id === id);
}

export function gearByCategory(cat: GearCategory): GearItem[] {
  return GEAR_CATALOG.filter((g) => g.category === cat);
}

// ── Bag rolling ────────────────────────────────────────────────────────────────

export interface GearBagResult {
  xpBonus: number;
  items: GearItem[];
}

function rollRarity(masteryScore: number): GearRarity {
  const shift = Math.floor(masteryScore / 20);
  const weights: Record<GearRarity, number> = {
    common:    Math.max(10, 60 - shift * 8),
    rare:      25 + shift * 2,
    epic:      10 + shift * 2,
    legendary: Math.min(15, 4 + shift),
    mythic:    Math.min(5, shift > 3 ? shift - 2 : 0),
  };
  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights) as [GearRarity, number][]) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return "common";
}

export function rollGearBag(
  drillCount: number,
  masteryScore: number,
  ownedIds: string[],
): GearBagResult {
  const xpBonus = 10 + Math.floor(Math.random() * 20);

  const ownedSet = new Set(ownedIds);
  const available = GEAR_CATALOG.filter((g) => !ownedSet.has(g.id));
  if (available.length === 0) {
    return { xpBonus, items: [] };
  }

  const count = drillCount < 10 ? 1 : drillCount < 30 ? 2 : 3;

  const dropped: GearItem[] = [];
  const droppedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(masteryScore);
    let pool = available.filter((g) => g.rarity === rarity && !droppedIds.has(g.id));
    if (pool.length === 0) {
      pool = available.filter((g) => !droppedIds.has(g.id));
    }
    if (pool.length === 0) break;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    dropped.push(pick);
    droppedIds.add(pick.id);
  }

  return { xpBonus, items: dropped };
}

// ── Drill reward bags ──────────────────────────────────────────────────────────

/**
 * A game/drill bag: picks, plain straps, cables, and coin prizes only.
 * Max rarity Common (70%) or Rare (30%) — no Epic/Legendary/Mythic.
 * Always drops exactly 1 item.
 */
export function rollGameBag(ownedIds: string[]): GearBagResult {
  const ownedSet = new Set(ownedIds);
  const pool = [...PICKS, ...STRAPS, ...CABLES, ...COIN_PRIZES];
  // Coins are always available; gear must be unowned
  const available = pool.filter(
    (g) => g.category === "coin" || !ownedSet.has(g.id),
  );
  if (available.length === 0) return { xpBonus: 5, items: [] };

  const rarity: GearRarity = Math.random() < 0.3 ? "rare" : "common";
  const byRarity = available.filter((g) => g.rarity === rarity);
  const finalPool = byRarity.length > 0 ? byRarity : available;
  const item = finalPool[Math.floor(Math.random() * finalPool.length)];
  return { xpBonus: 5, items: [item] };
}

/**
 * A trail-completion bag: full gear pool.
 * Tier: 60 % Rare (premium), 30 % Epic (elite), 10 % Legendary.
 * Drops 2–3 items (matches those tier configs).
 */
export function rollTrailCompleteBag(ownedIds: string[]): GearBagResult {
  const roll = Math.random();
  const tierId: BagTierConfig["id"] =
    roll < 0.10 ? "legendary" : roll < 0.40 ? "elite" : "premium";
  const tier = BAG_TIERS.find((t) => t.id === tierId) ?? BAG_TIERS[1];
  return { xpBonus: 50, items: rollBagForTier(tier, ownedIds) };
}

// ── Guardian Belt ──────────────────────────────────────────────────────────────

export type GuardianBelt = "none" | "bronze" | "silver" | "gold";

export interface GuardianProgress {
  drillCounts: Record<string, number>;
  accuracies: Record<string, number>;
  practiceMinutes: number;
}

export const GUARDIAN_REQUIREMENTS = {
  practiceMinutes: 300,
  drillCount: 20,
  accuracy: 80,
  drillTypes: ["notes", "intervals", "scales", "chords"] as string[],
};

export function computeGuardianBelt(progress: GuardianProgress): GuardianBelt {
  const req = GUARDIAN_REQUIREMENTS;
  const types = req.drillTypes;

  const bronzeDrills = types.every((t) => (progress.drillCounts[t] ?? 0) >= 5);
  if (!bronzeDrills) return "none";

  const silverDrills = types.every((t) => (progress.drillCounts[t] ?? 0) >= 10);
  const silverAccuracy = types.every((t) => (progress.accuracies[t] ?? 0) >= 70);
  if (!silverDrills || !silverAccuracy) return "bronze";

  const goldDrills = types.every((t) => (progress.drillCounts[t] ?? 0) >= req.drillCount);
  const goldAccuracy = types.every((t) => (progress.accuracies[t] ?? 0) >= req.accuracy);
  const goldTime = progress.practiceMinutes >= req.practiceMinutes;
  if (!goldDrills || !goldAccuracy || !goldTime) return "silver";

  return "gold";
}
