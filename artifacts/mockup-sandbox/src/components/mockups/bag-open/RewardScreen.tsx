import { useState } from "react";
import { MysteryBagReveal } from "./MysteryBagReveal";
import { RARITY_COLOR, RARITY_FRAME_FILTER, RARITY_BG } from "./rarity";

// ── Reward type ────────────────────────────────────────────────────────────
type Reward = {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  color: string;
  img: string | null;
  type: string;
  amount?: number;
  pickColor?: string;
  flavor?: string;
  isDuplicate?: boolean;
};

// XP / Coins awarded when converting a duplicate item (by rarity)
const CONVERT_XP: Record<string, number>    = { common:25,  rare:75,  epic:150,  legendary:300,  mythic:600  };
const CONVERT_COINS: Record<string, number> = { common:10,  rare:25,  epic:50,   legendary:100,  mythic:200  };

// ── Full reward pool ───────────────────────────────────────────────────────
const REWARDS: Reward[] = [
  // Guitars — 22 total
  { id:"g1",  name:"Nebula Starter",          rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/guitars/nebula-starter.png",        type:"Guitar",  flavor:"A reliable ship for any young explorer." },
  { id:"g2",  name:"Comet Cruiser",           rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/guitars/comet-cruiser.png",         type:"Guitar",  flavor:"Built to streak across the fretboard." },
  { id:"g3",  name:"Asteroid Axe",            rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/guitars/asteroid-axe.png",          type:"Guitar",  flavor:"Forged from cosmic rock." },
  { id:"g4",  name:"Lunar Lancer",            rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/guitars/lunar-lancer.png",          type:"Guitar",  flavor:"Light as moonbeams." },
  { id:"g5",  name:"Solar Spark",             rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/guitars/solar-spark.png",           type:"Guitar",  flavor:"Charges up under stage lights." },
  { id:"g6",  name:"Plasma Drifter",          rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/guitars/plasma-drifter.png",        type:"Guitar",  flavor:"Drifts between dimensions." },
  { id:"g7",  name:"Quasar Quake",            rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/guitars/quasar-quake.png",          type:"Guitar",  flavor:"Every power chord sends ripples." },
  { id:"g8",  name:"Pulsar Prime",            rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/guitars/pulsar-prime.png",          type:"Guitar",  flavor:"Pulsing with raw signal." },
  { id:"g9",  name:"Meteor Mauler",           rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/guitars/meteor-mauler.png",         type:"Guitar",  flavor:"Leaves a trail of fire." },
  { id:"g10", name:"Vortex Vanguard",         rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/guitars/vortex-vanguard.png",       type:"Guitar",  flavor:"Pulls the crowd into its orbit." },
  { id:"g11", name:"Singularity Shredder",    rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/guitars/singularity-shredder.png",  type:"Guitar",  flavor:"No note escapes its gravity." },
  { id:"g12", name:"Eventide Eclipse",        rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/guitars/eventide-eclipse.png",      type:"Guitar",  flavor:"Plays best at twilight." },
  { id:"g13", name:"Woodstock White Bolt",    rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/guitars/woodstock-white.png",       type:"Guitar",  flavor:"Half a million souls felt this." },
  { id:"g14", name:"Texas Flood No.1",        rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/guitars/texas-number-one.png",      type:"Guitar",  flavor:"Battered, beloved, and blazing." },
  { id:"g15", name:"Comfortably Black",       rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/guitars/black-strat.png",           type:"Guitar",  flavor:"Feels like outer space." },
  { id:"g16", name:"Appetite Goldtop",        rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/guitars/appetite-paul.png",         type:"Guitar",  flavor:"Appetite for destruction." },
  { id:"g17", name:"Stairway No.1",           rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/guitars/stairway-no1.png",          type:"Guitar",  flavor:"The riff heard around the world." },
  { id:"g18", name:"Frankenbolt",             rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/guitars/frankenstrat.png",          type:"Guitar",  flavor:"Born in a mad genius's garage." },
  { id:"g19", name:"Polka Nova V",            rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/guitars/polka-v.png",               type:"Guitar",  flavor:"A flying V from another planet." },
  { id:"g20", name:"Lydian JEM-Star",         rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/guitars/lydian-jem-star.png",       type:"Guitar",  flavor:"Built for the seventh mode." },
  { id:"g21", name:"Demon Axe Bass",          rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/guitars/demon-axe.png",             type:"Guitar",  flavor:"Low-end power from the dark side." },
  { id:"g22", name:"AGS Galactic Masterpiece",rarity:"mythic",    color:RARITY_COLOR.mythic,    img:"/__mockup/gear/guitars/ags-masterpiece.png",       type:"Guitar",  flavor:"One was made. You found it." },

  // Pedals
  { id:"p1",  name:"PolyStrobe Tuner",        rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/pedals/polystrobe-tuner.png",        type:"Pedal",   flavor:"Always in tune with the cosmos." },
  { id:"p2",  name:"Classic Distortion",      rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/pedals/classic-distortion.png",      type:"Pedal",   flavor:"The crunch that started it all." },
  { id:"p3",  name:"Fuzz Comet",              rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/pedals/fuzz-comet.png",              type:"Pedal",   flavor:"Warm, woolly, wonderful." },
  { id:"p4",  name:"Delay Echo",              rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/pedals/delay-echo.png",              type:"Pedal",   flavor:"Your note, repeated into infinity." },
  { id:"p5",  name:"Bluesy Musey Drive",      rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/pedals/bluesy-musey-drive.png",      type:"Pedal",   flavor:"Whisky-soaked tone in a box." },
  { id:"p6",  name:"Galaxy Chorus",           rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/pedals/galaxy-chorus.png",           type:"Pedal",   flavor:"Makes one guitar sound like starlight." },
  { id:"p7",  name:"Shred Distortion",        rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/pedals/shred-distortion.png",        type:"Pedal",   flavor:"Face-melting at any volume." },
  { id:"p8",  name:"Cosmic Wah",              rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/pedals/cosmic-wah.png",              type:"Pedal",   flavor:"The universe says 'wacka wacka'." },
  { id:"p9",  name:"Meteor Lights",           rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/pedals/meteor-lights.png",           type:"Pedal",   flavor:"The pedalboard lights up around it." },
  { id:"p10", name:"Delay Blackhole",         rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/pedals/delay-blackhole.png",         type:"Pedal",   flavor:"Notes go in. They never come back." },
  { id:"p11", name:"Supernova Overdrive",     rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/pedals/supernova-overdrive.png",     type:"Pedal",   flavor:"Explodes with musical brilliance." },
  { id:"p12", name:"Apocalypse Distortion",   rarity:"mythic",    color:RARITY_COLOR.mythic,    img:"/__mockup/gear/pedals/apocalypse-distortion.png",   type:"Pedal",   flavor:"At high gain, walls crumble." },
  { id:"p13", name:"Quantum Octavia",         rarity:"mythic",    color:RARITY_COLOR.mythic,    img:"/__mockup/gear/pedals/quantum-octavia.png",         type:"Pedal",   flavor:"One note becomes infinite harmonics." },

  // Amps
  { id:"a1",  name:"Modeling Cube",           rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/amps/modeling-amp.png",              type:"Amp",     flavor:"A thousand amps in one small box." },
  { id:"a2",  name:"Vintage Tweed Deluxe",    rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/amps/vintage-tweed-deluxe.png",      type:"Amp",     flavor:"Warm as a Texas afternoon." },
  { id:"a3",  name:"Bluesy AC Combo",         rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/amps/bm-ac.png",                     type:"Amp",     flavor:"Chimey, sparkling, pure." },
  { id:"a4",  name:"Quantum Mesa",            rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/amps/quantum-mesa.png",              type:"Amp",     flavor:"Tight as a fist. Loud as a star." },
  { id:"a5",  name:"Overdrive Special",       rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/amps/dumble.png",                    type:"Amp",     flavor:"Hand-wired by obsessive hands." },
  { id:"a6",  name:"JCM Stack",              rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/amps/jcm-stack.png",                 type:"Amp",     flavor:"The voice of a generation." },
  { id:"a7",  name:"Quantum Stack",           rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/amps/quantum-stack.png",             type:"Amp",     flavor:"Fills arenas with light." },
  { id:"a8",  name:"Galaxy Full Stack",       rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/amps/galaxy-full-stack.png",         type:"Amp",     flavor:"The stage shakes when it's on." },
  { id:"a9",  name:"Mythic Wall",             rarity:"mythic",    color:RARITY_COLOR.mythic,    img:"/__mockup/gear/amps/mythic-wall.png",               type:"Amp",     flavor:"Taller than the venue. Louder than everything." },

  // Cables
  { id:"c1",  name:"Black Purple Speck",      rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/cables/black-purple-speck.png",      type:"Cable",   flavor:"Dark and reliable." },
  { id:"c2",  name:"Electric Blue",           rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/cables/electric-blue.png",           type:"Cable",   flavor:"As blue as the sound it carries." },
  { id:"c3",  name:"Ruby Red",                rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/cables/ruby-red.png",                type:"Cable",   flavor:"Precious signal, precious colour." },
  { id:"c4",  name:"White Gold",              rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/cables/white-gold.png",              type:"Cable",   flavor:"Audiophile clarity." },
  { id:"c5",  name:"Plasma Blue Glow",        rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/cables/plasma-blue-glow.png",        type:"Cable",   flavor:"Glows faintly in dark venues." },
  { id:"c6",  name:"Purple Cosmic",           rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/cables/purple-cosmic.png",           type:"Cable",   flavor:"Vibrates at universal frequencies." },
  { id:"c7",  name:"Cosmic Glow",             rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/cables/cosmic-glow.png",             type:"Cable",   flavor:"People think you're playing through starlight." },
  { id:"c8",  name:"Supernova",               rarity:"mythic",    color:RARITY_COLOR.mythic,    img:"/__mockup/gear/cables/supernova.png",               type:"Cable",   flavor:"Connects you to the infinite." },

  // Straps
  { id:"s1",  name:"Butterscotch Leather",    rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/straps/butterscotch-leather.png",    type:"Strap",   flavor:"Aged like a great guitar." },
  { id:"s2",  name:"Desert Tan",              rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/straps/desert-tan.png",              type:"Strap",   flavor:"Road-worn from the start." },
  { id:"s3",  name:"Sand Leather",            rarity:"common",    color:RARITY_COLOR.common,    img:"/__mockup/gear/straps/sand-leather.png",            type:"Strap",   flavor:"Soft and steady." },
  { id:"s4",  name:"Amber Racer",             rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/straps/amber-racer.png",             type:"Strap",   flavor:"For players who move." },
  { id:"s5",  name:"Cobalt Racer",            rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/straps/cobalt-racer.png",            type:"Strap",   flavor:"Cool as a deep-space drift." },
  { id:"s6",  name:"Crimson Racer",           rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/straps/crimson-racer.png",           type:"Strap",   flavor:"Red says everything." },
  { id:"s7",  name:"Folk Tapestry",           rarity:"rare",      color:RARITY_COLOR.rare,      img:"/__mockup/gear/straps/folk-tapestry.png",           type:"Strap",   flavor:"Woven stories from the road." },
  { id:"s8",  name:"Azure Tapestry",          rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/straps/azure-tapestry.png",          type:"Strap",   flavor:"As rich as deep ocean." },
  { id:"s9",  name:"Ocean Tapestry",          rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/straps/ocean-tapestry.png",          type:"Strap",   flavor:"Carries the weight of waves." },
  { id:"s10", name:"Prism Burst",             rarity:"epic",      color:RARITY_COLOR.epic,      img:"/__mockup/gear/straps/prism-burst.png",             type:"Strap",   flavor:"A rainbow under stage lights." },
  { id:"s11", name:"Royal Brocade",           rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/straps/royal-brocade.png",           type:"Strap",   flavor:"Worn by those who earned it." },
  { id:"s12", name:"Sunset Rainbow",          rarity:"legendary", color:RARITY_COLOR.legendary, img:"/__mockup/gear/straps/sunset-rainbow.png",          type:"Strap",   flavor:"Every show ends like this." },

  // Picks
  { id:"pk1", name:"Onyx Standard",           rarity:"common",    color:RARITY_COLOR.common,    img:null, type:"Pick", pickColor:"#1c2233",  flavor:"Simple. Effective. Eternal." },
  { id:"pk2", name:"Solar Flare",             rarity:"common",    color:RARITY_COLOR.common,    img:null, type:"Pick", pickColor:"#f5a623",  flavor:"Hot off the press." },
  { id:"pk3", name:"Cobalt Glitter",          rarity:"common",    color:RARITY_COLOR.common,    img:null, type:"Pick", pickColor:"#1d4ed8",  flavor:"Sparkles under the lights." },
  { id:"pk4", name:"Holographic Nebula",      rarity:"rare",      color:RARITY_COLOR.rare,      img:null, type:"Pick", pickColor:"#8a2be2",  flavor:"Changes colour with every strum." },
  { id:"pk5", name:"Prism Pulsar",            rarity:"epic",      color:RARITY_COLOR.epic,      img:null, type:"Pick", pickColor:"#22d3ee",  flavor:"Bends light. Bends strings." },
  { id:"pk6", name:"Aurora Pearl",            rarity:"legendary", color:RARITY_COLOR.legendary, img:null, type:"Pick", pickColor:"#a7f3d0",  flavor:"Found at the edge of the atmosphere." },
  { id:"pk7", name:"Singularity",             rarity:"mythic",    color:RARITY_COLOR.mythic,    img:null, type:"Pick", pickColor:"#b026ff",  flavor:"One pick. One destiny." },

  // XP
  { id:"xp1", name:"50 XP",                   rarity:"common",    color:RARITY_COLOR.common,    img:null, type:"XP",    amount:50,   flavor:"Every journey starts with a step." },
  { id:"xp2", name:"150 XP",                  rarity:"rare",      color:RARITY_COLOR.rare,      img:null, type:"XP",    amount:150,  flavor:"Progress comes in waves." },
  { id:"xp3", name:"300 XP",                  rarity:"epic",      color:RARITY_COLOR.epic,      img:null, type:"XP",    amount:300,  flavor:"You're accelerating." },
  { id:"xp4", name:"500 XP",                  rarity:"legendary", color:RARITY_COLOR.legendary, img:null, type:"XP",    amount:500,  flavor:"A leap through the cosmos." },
  { id:"xp5", name:"1000 XP",                 rarity:"mythic",    color:RARITY_COLOR.mythic,    img:null, type:"XP",    amount:1000, flavor:"The universe notices." },

  // Alien Coins
  { id:"coin1", name:"10 Coins",              rarity:"common",    color:RARITY_COLOR.common,    img:null, type:"Coins", amount:10,   flavor:"Spend wisely." },
  { id:"coin2", name:"25 Coins",              rarity:"rare",      color:RARITY_COLOR.rare,      img:null, type:"Coins", amount:25,   flavor:"The alien economy rewards you." },
  { id:"coin3", name:"50 Coins",              rarity:"epic",      color:RARITY_COLOR.epic,      img:null, type:"Coins", amount:50,   flavor:"Real spending power." },
  { id:"coin4", name:"100 Coins",             rarity:"legendary", color:RARITY_COLOR.legendary, img:null, type:"Coins", amount:100,  flavor:"A small fortune in alien currency." },
  { id:"coin5", name:"250 Coins",             rarity:"mythic",    color:RARITY_COLOR.mythic,    img:null, type:"Coins", amount:250,  flavor:"The Alien Treasury is watching." },
];

// ── Roll exactly: 1 gear item + 1 XP tier + 1 Coins tier, shuffled ─────────
function rollBag(owned: Set<string>): [Reward, Reward, Reward] {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const gearPool  = REWARDS.filter(r => r.type !== "XP" && r.type !== "Coins");
  const xpPool    = REWARDS.filter(r => r.type === "XP");
  const coinPool  = REWARDS.filter(r => r.type === "Coins");

  const rawItem = pick(gearPool);
  const item: Reward = owned.has(rawItem.id)
    ? { ...rawItem, isDuplicate: true }
    : rawItem;

  const three: [Reward, Reward, Reward] = [item, pick(xpPool), pick(coinPool)];
  // Shuffle position so the player doesn't always know which slot is which
  return three.sort(() => Math.random() - 0.5) as [Reward, Reward, Reward];
}

// ── Bag colour by best rarity in the roll ──────────────────────────────────
const RARITY_ORDER = ["common", "rare", "epic", "legendary", "mythic"] as const;

function bestRarity(rewards: [Reward, Reward, Reward]): string {
  return rewards.reduce((best, r) =>
    RARITY_ORDER.indexOf(r.rarity as typeof RARITY_ORDER[number]) >
    RARITY_ORDER.indexOf(best as typeof RARITY_ORDER[number]) ? r.rarity : best
  , "common");
}

// CSS hue-rotate values that transform the purple bag artwork into each tier
const BAG_HUE: Record<string, number> = {
  common:    0,    // original deep purple
  rare:      190,  // teal / electric cyan
  epic:      310,  // blue-violet
  legendary: 140,  // amber / gold
  mythic:    100,  // fiery orange-red
};

const BAG_LABEL: Record<string, string> = {
  common:    "Common Bag",
  rare:      "Rare Bag",
  epic:      "Epic Bag",
  legendary: "Legendary Bag",
  mythic:    "Mythic Bag",
};

type Phase = "idle" | "playing" | "cards" | "done";

// ── Zoom overlay — full-screen prize showcase ──────────────────────────────
const SPARKLE_POSITIONS = [
  { top:"12%", left:"8%",  delay:"0.0s", size:7 },
  { top:"18%", right:"10%",delay:"0.3s", size:5 },
  { top:"35%", left:"4%",  delay:"0.6s", size:6 },
  { top:"62%", left:"6%",  delay:"0.1s", size:4 },
  { top:"78%", right:"8%", delay:"0.4s", size:7 },
  { top:"50%", right:"5%", delay:"0.7s", size:5 },
  { top:"25%", left:"18%", delay:"0.2s", size:4 },
  { top:"70%", right:"18%",delay:"0.5s", size:6 },
  { top:"88%", left:"22%", delay:"0.15s",size:5 },
  { top:"90%", right:"25%",delay:"0.45s",size:4 },
];

function ZoomContent({ reward }: { reward: Reward }) {
  if (reward.type === "XP") return (
    <div className="zoom-center-content">
      <div style={{ fontSize:96, lineHeight:1 }}>⚡</div>
      <div style={{ fontSize:56, fontWeight:900, color:reward.color, lineHeight:1 }}>{reward.amount}</div>
      <div style={{ fontSize:13, color:"#d1d5db", letterSpacing:3, textTransform:"uppercase" as const }}>Experience</div>
    </div>
  );
  if (reward.type === "Coins") return (
    <div className="zoom-center-content">
      <img src="/__mockup/gear/coins.png" style={{ width:150, height:150, objectFit:"contain" }} alt="" />
      <div style={{ fontSize:56, fontWeight:900, color:reward.color, lineHeight:1 }}>{reward.amount}</div>
      <div style={{ fontSize:13, color:"#d1d5db", letterSpacing:3, textTransform:"uppercase" as const }}>Alien Coins</div>
    </div>
  );
  if (reward.type === "Pick") return (
    <div className="zoom-center-content">
      <div className="zoom-pick" style={{
        background: reward.pickColor ?? "#888",
        boxShadow:`0 0 60px ${reward.pickColor ?? "#888"}, 0 0 120px ${reward.pickColor ?? "#888"}66`,
      }} />
    </div>
  );
  const TYPE_ICON: Record<string, string> = { Guitar:"🎸", Amp:"🔊", Pedal:"🎛️", Cable:"🔌", Strap:"🎵" };
  if (!reward.img) return (
    <div className="zoom-center-content">
      <div style={{ fontSize:100, lineHeight:1 }}>{TYPE_ICON[reward.type] ?? "🎁"}</div>
    </div>
  );
  return (
    <img
      src={reward.img}
      alt={reward.name}
      className="zoom-img"
      style={{ filter:`drop-shadow(0 0 40px ${reward.color}99) drop-shadow(0 0 80px ${reward.color}44)` }}
    />
  );
}

function ZoomOverlay({
  reward, onClose, onConvertXP, onConvertCoins,
}: {
  reward: Reward;
  onClose: () => void;
  onConvertXP?: () => void;
  onConvertCoins?: () => void;
}) {
  const rc = reward.color;
  const isDup = !!reward.isDuplicate;

  return (
    <div className="zoom-overlay" onClick={onClose}>
      {/* ── Close button ── */}
      <button
        onClick={onClose}
        style={{
          position:"absolute", top:16, right:16,
          width:40, height:40,
          borderRadius:"50%",
          background:"rgba(0,0,0,0.55)",
          border:"1.5px solid rgba(255,255,255,0.18)",
          color:"#fff",
          fontSize:20, lineHeight:1,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer",
          zIndex:200,
        }}
        aria-label="Close"
      >×</button>

      <div className="zoom-scene" onClick={e => e.stopPropagation()}>

        {/* ── The card itself — identical frame + content, just big ── */}
        <div className="zoom-big-card" style={{
          background: RARITY_BG[reward.rarity],
          boxShadow: `0 0 60px ${rc}55, 0 0 120px ${rc}22, 0 24px 64px rgba(0,0,0,0.9)`,
        }}>
          <img
            src={CARD_FRAME}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"fill", borderRadius:16, zIndex:2, filter: RARITY_FRAME_FILTER[reward.rarity] }}
            alt=""
          />
          <div style={{
            position:"relative", zIndex:3,
            display:"flex", flexDirection:"column", alignItems:"center",
            height:"100%",
          }}>
            {/* Item image — upper 72% of the card */}
            <div style={{ flex:"0 0 72%", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", paddingTop:"14%" }}>
              <CardInner reward={reward} />
            </div>
            {/* Name/rarity — sits in the scroll banner (lower 28%) */}
            <div style={{ flex:"0 0 28%", width:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", paddingBottom:"6%", gap:2 }}>
              <div style={{ fontSize:9, fontWeight:900, letterSpacing:3, color:rc, textTransform:"uppercase" as const }}>
                {reward.rarity}
              </div>
              <div style={{ fontSize:15, fontWeight:800, color:"#fff", lineHeight:1.15, textAlign:"center", padding:"0 12%" }}>{reward.name}</div>
              {reward.type !== "XP" && reward.type !== "Coins" && (
                <div style={{ fontSize:9, color:"#c4a96b", marginTop:1, letterSpacing:0.5 }}>{reward.type}</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Below-card extras ── */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, width:"100%", maxWidth:260 }}>

          {isDup && (
            <div className="zoom-dup-banner">Already in your collection</div>
          )}

          {!isDup && reward.flavor && (
            <div style={{ fontSize:12, color:"#9ca3af", textAlign:"center", fontStyle:"italic", lineHeight:1.5, padding:"0 8px" }}>
              "{reward.flavor}"
            </div>
          )}

          {isDup && (
            <div className="zoom-convert-row">
              <div className="zoom-convert-label">Convert to:</div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="zoom-convert-btn" style={{ borderColor:"#facc15", color:"#facc15" }} onClick={onConvertXP}>
                  ⚡ {CONVERT_XP[reward.rarity]} XP
                </button>
                <button className="zoom-convert-btn" style={{ borderColor:"#a78bfa", color:"#a78bfa" }} onClick={onConvertCoins}>
                  🪙 {CONVERT_COINS[reward.rarity]} Coins
                </button>
              </div>
            </div>
          )}

          <div className="zoom-tap-to-close">
            {isDup ? "Or tap outside to keep" : "Tap anywhere to close"}
          </div>
        </div>

      </div>
    </div>
  );
}

const CARD_FRAME = "/__mockup/animations/mystery-bag-reveal/card-reward-frame.png";

// ── Card inner content (sits on top of the gold frame) ─────────────────────
function CardInner({ reward }: { reward: Reward }) {
  if (reward.type === "XP") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, flex:1 }}>
      <div style={{ fontSize:38, lineHeight:1 }}>⚡</div>
      <div style={{ fontSize:26, fontWeight:900, color:reward.color, lineHeight:1 }}>{reward.amount}</div>
      <div style={{ fontSize:9, color:"#d1d5db", letterSpacing:1, textTransform:"uppercase" }}>Experience</div>
    </div>
  );
  if (reward.type === "Coins") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, flex:1 }}>
      <img src="/__mockup/gear/coins.png" style={{ width:44, height:44, objectFit:"contain" }} alt="" />
      <div style={{ fontSize:26, fontWeight:900, color:reward.color, lineHeight:1 }}>{reward.amount}</div>
      <div style={{ fontSize:9, color:"#d1d5db", letterSpacing:1, textTransform:"uppercase" }}>Alien Coins</div>
    </div>
  );
  if (reward.type === "Pick") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, flex:1 }}>
      <div style={{
        width:44, height:54,
        background: reward.pickColor ?? "#888",
        clipPath:"polygon(50% 0%, 100% 38%, 50% 100%, 0% 38%)",
        boxShadow:`0 0 24px ${reward.pickColor ?? "#888"}88`,
      }} />
    </div>
  );
  if (reward.img) return (
    <img
      src={reward.img}
      alt={reward.name}
      style={{ width:"78%", flex:1, objectFit:"contain", filter:"drop-shadow(0 4px 16px rgba(0,0,0,0.8))" }}
    />
  );
  const TYPE_ICON: Record<string, string> = { Guitar:"🎸", Amp:"🔊", Pedal:"🎛️", Cable:"🔌", Strap:"🎵" };
  return (
    <div style={{ fontSize:38, lineHeight:1, flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
      {TYPE_ICON[reward.type] ?? "🎁"}
    </div>
  );
}

// ── Card front face — always the gold ornate frame ─────────────────────────
function CardFront({ reward }: { reward: Reward }) {
  return (
    <>
      {/* Ornate frame — tinted per rarity */}
      <img
        src={CARD_FRAME}
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"fill", borderRadius:12, zIndex:2, filter: RARITY_FRAME_FILTER[reward.rarity] }}
        alt=""
      />
      {/* Content layer */}
      <div style={{
        position:"relative", zIndex:3,
        display:"flex", flexDirection:"column", alignItems:"center",
        height:"100%", padding:"18px 10px 10px",
      }}>
        <CardInner reward={reward} />
        <div style={{ textAlign:"center", marginTop:4 }}>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:2, color:reward.color, textTransform:"uppercase", marginBottom:1 }}>
            {reward.rarity}
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:"#fff", lineHeight:1.2 }}>{reward.name}</div>
          {reward.type !== "XP" && reward.type !== "Coins" && (
            <div style={{ fontSize:8, color:"#9ca3af", marginTop:1 }}>{reward.type}</div>
          )}
        </div>
      </div>
    </>
  );
}

// ── One card ──────────────────────────────────────────────────────────────
function RewardCard({
  reward, animClass, bagHue = 0, flipped = false, onTap,
}: {
  reward: Reward; animClass: string; bagHue?: number; flipped?: boolean; onTap?: () => void;
}) {
  return (
    <div
      className={`card-wrap ${animClass}${flipped ? " card-flipped" : ""}`}
      onClick={onTap}
      style={{ cursor: "pointer" }}
    >
      <div className="card-inner">
        {/* card-flipper is the scaleX layer — fly anim on card-inner, flip anim here */}
        <div className="card-flipper">
          <div className="card-face card-back">
            <img
              src="/__mockup/animations/mystery-bag-reveal/card-mystery.png"
              style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12, filter: bagHue ? `hue-rotate(${bagHue}deg)` : undefined }}
              alt=""
            />
          </div>
          <div className="card-face card-front" style={{ background: RARITY_BG[reward.rarity] }}>
            <CardFront reward={reward} />
          </div>
        </div>
      </div>
      {/* Ring pulses different colours: mystery purple = unflipped, rarity = flipped */}
      <div className="tap-ring" style={{ borderColor: flipped ? reward.color : "#a855f7" }} />
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────
export function RewardScreen() {
  const [phase,        setPhase]        = useState<Phase>("idle");
  const [round,        setRound]        = useState(0);
  const [ownedItems,   setOwnedItems]   = useState<Set<string>>(new Set());
  const [rewards,      setRewards]      = useState<[Reward,Reward,Reward]>(() => rollBag(new Set()));
  const [showClaim,    setShowClaim]    = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [zoomed,       setZoomed]       = useState<Reward | null>(null);

  function open() {
    const next = rollBag(ownedItems);
    setRewards(next);
    setRound(r => r + 1);
    setShowClaim(false);
    setFlippedCards(new Set());
    setZoomed(null);
    setPhase("playing");
  }

  function onBagComplete() {
    setPhase("cards");
    // cards fly in — no auto-flip, player taps each one
  }

  // idx: 0=left, 1=center, 2=right
  function handleCardTap(idx: number, reward: Reward) {
    if (!flippedCards.has(idx)) {
      // First tap → flip the card
      const next = new Set(flippedCards);
      next.add(idx);
      setFlippedCards(next);
      if (next.size === 3) setShowClaim(true);
    } else {
      // Second tap on an already-flipped card → zoom in
      setZoomed(reward);
    }
  }

  function claim() {
    rewards.forEach(r => {
      if (r.type !== "XP" && r.type !== "Coins" && !r.isDuplicate) {
        setOwnedItems(prev => new Set([...prev, r.id]));
      }
    });
    setZoomed(null);
    setPhase("idle");
    setShowClaim(false);
    setFlippedCards(new Set());
  }

  const [leftReward, centerReward, rightReward] = rewards;
  const bagTier  = bestRarity(rewards);
  const bagHue   = BAG_HUE[bagTier];
  const bagColor = RARITY_COLOR[bagTier];

  function handleConvert(reward: Reward, to: "xp" | "coins") {
    // Mark the item as converted (treat like non-duplicate for display purposes)
    // and close the zoom — in the real app this would credit the player
    setZoomed(null);
    // Don't add to ownedItems since player chose to convert instead
  }

  return (
    <>
      <style>{CSS}</style>

      {zoomed && (
        <ZoomOverlay
          reward={zoomed}
          onClose={() => setZoomed(null)}
          onConvertXP={zoomed.isDuplicate ? () => handleConvert(zoomed, "xp")    : undefined}
          onConvertCoins={zoomed.isDuplicate ? () => handleConvert(zoomed, "coins") : undefined}
        />
      )}

      <div style={{
        minHeight:"100vh", background:"#07040e",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:24, gap:16,
        fontFamily:"system-ui, sans-serif",
        overflow:"hidden",
      }}>
        {/* Title + bag tier badge */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <h2 style={{ color:"#c084fc", margin:0, letterSpacing:1, fontSize:18 }}>
            Mystery Bag
          </h2>
          <div style={{
            fontSize:9, fontWeight:800, letterSpacing:3,
            textTransform:"uppercase", padding:"3px 10px",
            borderRadius:999, border:`1px solid ${bagColor}66`,
            color:bagColor, background:`${bagColor}18`,
          }}>
            {BAG_LABEL[bagTier]}
          </div>
        </div>

        {(phase === "idle" || phase === "playing") && (
          <div style={{ width:"min(260px, 80vw)" }}>
            <MysteryBagReveal
              key={round}
              playing={phase === "playing"}
              onComplete={onBagComplete}
            />
          </div>
        )}

        {(phase === "cards" || phase === "done") && (
          <>
            <div style={{
              position:"relative", height:280, width:"min(340px, 90vw)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <RewardCard reward={leftReward}   animClass="card-left"   bagHue={40}  flipped={flippedCards.has(0)} onTap={() => handleCardTap(0, leftReward)}   />
              <RewardCard reward={rightReward}  animClass="card-right"  bagHue={220} flipped={flippedCards.has(2)} onTap={() => handleCardTap(2, rightReward)}  />
              <RewardCard reward={centerReward} animClass="card-center" bagHue={0}   flipped={flippedCards.has(1)} onTap={() => handleCardTap(1, centerReward)} />
            </div>
            {!showClaim && (
              <p style={{ color:"#7c3aed", fontSize:11, margin:0, letterSpacing:1, textTransform:"uppercase" }}>
                {flippedCards.size === 0 ? "Tap a card to reveal it" :
                 flippedCards.size < 3  ? `${3 - flippedCards.size} card${3 - flippedCards.size > 1 ? "s" : ""} left to reveal` :
                 "Tap any card to zoom in"}
              </p>
            )}
          </>
        )}

        {phase === "idle" && (
          <button onClick={open} style={btnStyle("#7c3aed", "#a855f7")}>
            Open Mystery Bag
          </button>
        )}
        {phase === "playing" && (
          <p style={{ color:"#a78bfa", margin:0, fontSize:14 }}>Revealing…</p>
        )}
        {(phase === "cards" || phase === "done") && showClaim && (
          <button onClick={claim} style={btnStyle("#b45309", "#f59e0b")}>
            Claim Reward
          </button>
        )}
      </div>
    </>
  );
}

function btnStyle(from: string, to: string): React.CSSProperties {
  return {
    padding:"12px 32px", borderRadius:999,
    background:`linear-gradient(135deg, ${from}, ${to})`,
    color:"#fff", fontWeight:700, fontSize:16,
    border:"none", cursor:"pointer",
    boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
    position:"relative", zIndex:10,
  };
}

// ── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
/* ── Card layout ─────────────────────────────────────────────────────── */
.card-wrap {
  position: absolute;
  width: 140px;
  height: 200px;
  pointer-events: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.card-wrap:active .card-inner,
.card-wrap:focus .card-inner {
  /* no visual change on press */
}

.card-wrap[style*="pointer: pointer"],
.card-wrap[style*="cursor: pointer"] {
  pointer-events: auto;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  opacity: 0;
}

.card-face {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.7);
  transition: box-shadow 0.2s ease;
}

.card-back  { background: #1a0a2e; }
.card-front { background: linear-gradient(160deg, #1a0a2e 0%, #0d0520 100%); }


/* Tap ring indicator */
.tap-ring {
  position: absolute;
  inset: -4px;
  border-radius: 16px;
  border: 2px solid;
  opacity: 0;
  animation: tapPulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes tapPulse {
  0%, 100% { opacity: 0;   transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(1.03); }
}

/* ── Card fly keyframes (land face-down — no flip baked in) ───────────── */
@keyframes flyCenter {
  0%   { transform: translate(0, 120px) scale(0.25); opacity: 0; }
  10%  { opacity: 1; }
  80%  { transform: translate(0, 4px) scale(0.97); }
  100% { transform: translate(0, 0) scale(1); opacity: 1; }
}

@keyframes flyLeftFlip {
  0%   { transform: translate(0, 120px) scale(0.25); opacity: 0; }
  10%  { opacity: 0.85; }
  100% { transform: translate(-112px, 18px) scale(0.76) rotateZ(-13deg); opacity: 0.75; }
}

@keyframes flyRightFlip {
  0%   { transform: translate(0, 120px) scale(0.25); opacity: 0; }
  10%  { opacity: 0.85; }
  100% { transform: translate(112px, 18px) scale(0.76) rotateZ(13deg); opacity: 0.75; }
}

/* Fly positioning — no face animations, cards land back-up */
.card-left   { z-index: 1; }
.card-left   .card-inner { animation: flyLeftFlip  1.15s cubic-bezier(0.23,1,0.32,1) 0.00s forwards; }
.card-right  { z-index: 1; }
.card-right  .card-inner { animation: flyRightFlip 1.15s cubic-bezier(0.23,1,0.32,1) 0.08s forwards; }
.card-center { z-index: 3; }
.card-center .card-inner { animation: flyCenter    1.15s cubic-bezier(0.23,1,0.32,1) 0.18s forwards; }

/* card-flipper: the scaleX layer sitting inside card-inner */
.card-flipper {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Default face visibility: back shown, front hidden */
.card-back  { opacity: 1; }
.card-front { opacity: 0; }

/* ── Tap-to-flip ─────────────────────────────────────────────────────── */
@keyframes flipCard {
  0%   { transform: scaleX(1); }
  44%  { transform: scaleX(0); }
  56%  { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
@keyframes hideOnFlip {
  0%, 43%   { opacity: 1; }
  45%, 100% { opacity: 0; }
}
@keyframes showOnFlip {
  0%, 43%   { opacity: 0; }
  45%, 100% { opacity: 1; }
}

.card-flipped .card-flipper { animation: flipCard    0.38s cubic-bezier(0.4,0,0.2,1) forwards; }
.card-flipped .card-back    { animation: hideOnFlip  0.38s cubic-bezier(0.4,0,0.2,1) forwards; }
.card-flipped .card-front   { animation: showOnFlip  0.38s cubic-bezier(0.4,0,0.2,1) forwards; }

/* ── Zoom overlay ─────────────────────────────────────────────────────── */
.zoom-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 2, 14, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 0.18s ease forwards;
  backdrop-filter: blur(8px);
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* Wrapper that animates in as a unit */
.zoom-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: zoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes zoomIn {
  from { transform: scale(0.3) translateY(30px); opacity: 0; }
  to   { transform: scale(1)   translateY(0);    opacity: 1; }
}

/* The big card — fills most of the screen height, aspect ratio locked */
.zoom-big-card {
  position: relative;
  height: min(72vh, 520px);
  width: auto;
  aspect-ratio: 7 / 10;
  border-radius: 20px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(160deg, #1a0a2e 0%, #0d0520 100%);
}

.zoom-name {
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
  letter-spacing: -0.3px;
}

.zoom-type-label {
  font-size: 11px;
  color: #6b7280;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.zoom-flavor {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
  line-height: 1.4;
  margin-top: 2px;
}

.zoom-tap-to-close {
  position: relative;
  z-index: 2;
  margin-top: 16px;
  font-size: 10px;
  color: #374151;
  letter-spacing: 1px;
}

/* ── Duplicate banner + convert buttons ───────────────────────────────── */
.zoom-dup-banner {
  position: relative;
  z-index: 2;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 999px;
  padding: 4px 14px;
  margin-bottom: 8px;
}

.zoom-convert-row {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 14px 16px;
  background: rgba(255,255,255,0.04);
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.07);
  width: 100%;
}

.zoom-convert-label {
  font-size: 10px;
  color: #6b7280;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.zoom-convert-btn {
  flex: 1;
  padding: 9px 14px;
  border-radius: 10px;
  background: transparent;
  border: 1.5px solid;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: opacity 0.15s;
}

.zoom-convert-btn:hover {
  opacity: 0.8;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}

/* ── Sparkle dots ─────────────────────────────────────────────────────── */
.sparkle-dot {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 201;
  animation: sparkleTwinkle 1.3s ease-in-out infinite;
}

@keyframes sparkleTwinkle {
  0%, 100% { opacity: 0;   transform: scale(0.4); }
  50%       { opacity: 1;   transform: scale(1.6); }
}
`;
