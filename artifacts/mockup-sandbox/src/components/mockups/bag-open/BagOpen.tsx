import { useEffect, useRef, useState } from "react";

// ─── bag catalogue ─────────────────────────────────────────────────────────────
const BAGS = {
  blue:   { closed: "/__mockup/bags/blue_closed.png",   open: "/__mockup/bags/blue_open.png",   pip: "#3b82f6", cards: 3, zipColor: "gold"   as const, openLogoLift: -5, openBagDrop: 17, closedScale: 1.05 },
  gold:   { closed: "/__mockup/bags/gold_closed.png",   open: "/__mockup/bags/gold_open.png",   pip: "#fbbf24", cards: 5, zipColor: "gold"   as const, openLogoLift: -8, openBagDrop: 10, closedScale: 1,    cardRows: [2,3] as number[] },
  purple: { closed: "/__mockup/bags/purple_closed.png", open: "/__mockup/bags/purple_open.png", pip: "#a855f7", cards: 3, zipColor: "gold"   as const, openLogoLift: 0,  openBagDrop: 10, closedScale: 1,    cardRows: [2,1] as number[] },
  red:    { closed: "/__mockup/bags/red_closed.png",    open: "/__mockup/bags/red_open.png",    pip: "#ef4444", cards: 3, zipColor: "gold"   as const, openLogoLift: -5, openBagDrop: 10, closedScale: 1,    cardRows: [2,1] as number[] },
  silver: { closed: "/__mockup/bags/silver_closed.png", open: "/__mockup/bags/silver_open.png", pip: "#94a3b8", cards: 4, zipColor: "silver" as const, openLogoLift: -10, openBagDrop: 10, closedScale: 1, openLogoRot: 3, cardRows: [2,2] as number[] },
};

type BagKey = keyof typeof BAGS;

// CSS filter to tint the zip pull tab
const ZIP_FILTER: Record<"gold" | "silver", string> = {
  gold:   "drop-shadow(0 2px 5px #0009) sepia(0.6) saturate(1.6) hue-rotate(5deg) brightness(1.02)",
  silver: "drop-shadow(0 2px 5px #0009) brightness(1.25) saturate(0.25) contrast(1.1)",
};

// ─── layout ────────────────────────────────────────────────────────────────────
const BAG_W   = 320;
const PAD_TOP = 200;
const ZIP_W   = 13;
const ZIP_H   = 22;
const CARD_W  = 88;
const CARD_H  = 124;
const ZIP_MS  = 1000;

// ─── types ─────────────────────────────────────────────────────────────────────
type Phase = "wait" | "zipping" | "open" | "deal" | "done";
interface CardDef { tx: number; ty: number; rot: number; delay: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; r: number; hue: number; }

function makeCards(count: number, vw: number, _vh: number, ox: number, oy: number, cardRows?: number[]): CardDef[] {
  const GAP_X = 20;
  const GAP_Y = 14;
  const baseY = PAD_TOP + (oy - PAD_TOP) + 80;

  if (cardRows) {
    // Multi-row layout: row 0 floats ABOVE the bag, rows 1+ land BELOW
    const cards: CardDef[] = [];
    let idx = 0;
    cardRows.forEach((rowCount, row) => {
      const rowGap = row === 0 ? GAP_X + 20 : GAP_X;   // top row gets extra spread
      const rowW   = rowCount * CARD_W + (rowCount - 1) * rowGap;
      // Row 0 centres over the bag opening; other rows centre over the viewport
      const startX = row === 0 ? ox - rowW / 2 : (vw - rowW) / 2;
      const rowY   = row === 0
        ? oy - 180                                       // above the bag opening
        : oy + 80 + (row - 1) * (CARD_H + GAP_Y);      // below the bag body
      for (let i = 0; i < rowCount; i++) {
        cards.push({
          tx:    startX + i * (CARD_W + rowGap) - ox,
          ty:    rowY - oy,
          rot:   (Math.random() - 0.5) * 6,
          delay: idx * 500,
        });
        idx++;
      }
    });
    return cards;
  }

  // Single-row layout (default)
  const totalW = count * CARD_W + (count - 1) * GAP_X;
  const startX = (vw - totalW) / 2;
  return Array.from({ length: count }, (_, i) => ({
    tx:    startX + i * (CARD_W + GAP_X) - ox,
    ty:    baseY + (i % 2 === 0 ? 0 : 28) - oy,
    rot:   (Math.random() - 0.5) * 6,
    delay: i * 624,
  }));
}

// ─── canvas burst  (NOTE: migrate to @shopify/react-native-skia on mobile) ────
function runBurst(canvas: HTMLCanvasElement, ox: number, oy: number) {
  const ctx = canvas.getContext("2d")!;
  if (!ctx) return () => {};

  const particles: Particle[] = Array.from({ length: 160 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;
    const hue   = Math.random() < 0.5 ? 210 + Math.random() * 20 : 44 + Math.random() * 14;
    return { x: ox, y: oy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2.5,
             life: 0, maxLife: 70 + Math.random() * 80, r: 2.5 + Math.random() * 5, hue };
  });

  const RAY_ANGLES = [-55,-42,-30,-20,-10,-3,3,10,20,30,42,55];
  const RAY_WIDTHS = [16, 22, 28, 34, 40, 46,46,40,34,28,22,16];
  const RAY_LEN    = 420;

  let flashAlpha = 1, rayAlpha = 1, raf = 0;

  function frame() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (flashAlpha > 0.01) {
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 340);
      g.addColorStop(0,   `rgba(255,255,255,${flashAlpha})`);
      g.addColorStop(0.1, `rgba(220,240,255,${flashAlpha * 0.92})`);
      g.addColorStop(0.3, `rgba(160,210,255,${flashAlpha * 0.60})`);
      g.addColorStop(0.6, `rgba(255,215,90,${flashAlpha * 0.28})`);
      g.addColorStop(1,   "rgba(180,130,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flashAlpha = Math.max(0, flashAlpha - 0.0042);
    }

    if (rayAlpha > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.filter = "blur(8px)";
      RAY_ANGLES.forEach((deg, i) => {
        const rad = (deg - 90) * (Math.PI / 180);
        const ex = ox + Math.cos(rad) * RAY_LEN, ey = oy + Math.sin(rad) * RAY_LEN;
        const g  = ctx.createLinearGradient(ox, oy, ex, ey);
        g.addColorStop(0,    `rgba(255,255,255,${rayAlpha})`);
        g.addColorStop(0.15, `rgba(220,240,255,${rayAlpha * 0.88})`);
        g.addColorStop(0.5,  `rgba(255,215,90,${rayAlpha * 0.45})`);
        g.addColorStop(1,    "rgba(180,130,0,0)");
        ctx.strokeStyle = g; ctx.lineWidth = RAY_WIDTHS[i]; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke();
      });
      ctx.filter = "none"; ctx.restore();
      rayAlpha = Math.max(0, rayAlpha - 0.007);
    }

    let alive = false;
    for (const p of particles) {
      if (p.life >= p.maxLife) continue;
      p.x += p.vx; p.y += p.vy; p.vy += 0.10; p.life++;
      alive = true;
      const a = 1 - p.life / p.maxLife;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 10);
      g.addColorStop(0,    `hsla(${p.hue},100%,100%,${a})`);
      g.addColorStop(0.25, `hsla(${p.hue},100%,85%,${a * 0.75})`);
      g.addColorStop(0.6,  `hsla(${p.hue},90%,60%,${a * 0.35})`);
      g.addColorStop(1,    `hsla(${p.hue},80%,40%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }

    if (alive || flashAlpha > 0.01 || rayAlpha > 0.02) { raf = requestAnimationFrame(frame); }
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); };
}

// ─── prize catalogue (real gear images) ────────────────────────────────────────
const G = "/__mockup/gear";
type PrizeEntry = { name: string; type: string; rarity: string; color: string; img?: string; amount?: number };

const PRIZE_POOL: PrizeEntry[] = [
  // Common
  { name: "PolyStrobe Tuner",   type: "Pedal",  rarity: "Common",    color: "#94a3b8", img: `${G}/pedals/polystrobe-tuner.png` },
  { name: "Classic Distortion", type: "Pedal",  rarity: "Common",    color: "#94a3b8", img: `${G}/pedals/classic-distortion.png` },
  { name: "Fuzz Comet",         type: "Pedal",  rarity: "Common",    color: "#94a3b8", img: `${G}/pedals/fuzz-comet.png` },
  { name: "Delay Echo",         type: "Pedal",  rarity: "Common",    color: "#94a3b8", img: `${G}/pedals/delay-echo.png` },
  { name: "Modeling Amp",       type: "Amp",    rarity: "Common",    color: "#94a3b8", img: `${G}/amps/modeling-amp.png` },
  { name: "Starlight Clean",    type: "Amp",    rarity: "Common",    color: "#94a3b8", img: `${G}/amps/starlight-clean.png` },
  { name: "Nebula Starter",     type: "Guitar", rarity: "Common",    color: "#94a3b8", img: `${G}/guitars/nebula-starter.png` },
  { name: "Electric Blue",      type: "Cable",  rarity: "Common",    color: "#94a3b8", img: `${G}/cables/electric-blue.png` },
  { name: "Ruby Red",           type: "Cable",  rarity: "Common",    color: "#94a3b8", img: `${G}/cables/ruby-red.png` },
  { name: "50 Coins",           type: "Coins",  rarity: "Common",    color: "#fbbf24", amount: 50,  img: `${G}/coins.png` },
  // Rare
  { name: "Bluesy Musey Drive", type: "Pedal",  rarity: "Rare",      color: "#3b82f6", img: `${G}/pedals/bluesy-musey-drive.png` },
  { name: "Galaxy Chorus",      type: "Pedal",  rarity: "Rare",      color: "#3b82f6", img: `${G}/pedals/galaxy-chorus.png` },
  { name: "Orbit Phaser",       type: "Pedal",  rarity: "Rare",      color: "#3b82f6", img: `${G}/pedals/orbit-phaser.png` },
  { name: "Jet Flanger",        type: "Pedal",  rarity: "Rare",      color: "#3b82f6", img: `${G}/pedals/jet-flanger.png` },
  { name: "JCM Stack",          type: "Amp",    rarity: "Rare",      color: "#3b82f6", img: `${G}/amps/jcm-stack.png` },
  { name: "Comet Cruiser",      type: "Guitar", rarity: "Rare",      color: "#3b82f6", img: `${G}/guitars/comet-cruiser.png` },
  { name: "Woodstock White",    type: "Guitar", rarity: "Rare",      color: "#3b82f6", img: `${G}/guitars/woodstock-white.png` },
  { name: "Plasma Blue Glow",   type: "Cable",  rarity: "Rare",      color: "#3b82f6", img: `${G}/cables/plasma-blue-glow.png` },
  { name: "150 Coins",          type: "Coins",  rarity: "Rare",      color: "#fbbf24", amount: 150, img: `${G}/coins.png` },
  // Epic
  { name: "Shred Distortion",   type: "Pedal",  rarity: "Epic",      color: "#a855f7", img: `${G}/pedals/shred-distortion.png` },
  { name: "Cosmic Wah",         type: "Pedal",  rarity: "Epic",      color: "#a855f7", img: `${G}/pedals/cosmic-wah.png` },
  { name: "Fuzz Nebulous",      type: "Pedal",  rarity: "Epic",      color: "#a855f7", img: `${G}/pedals/fuzz-nebulous.png` },
  { name: "Galaxy Full Stack",  type: "Amp",    rarity: "Epic",      color: "#a855f7", img: `${G}/amps/galaxy-full-stack.png` },
  { name: "Solar Spark",        type: "Guitar", rarity: "Epic",      color: "#a855f7", img: `${G}/guitars/solar-spark.png` },
  { name: "Lunar Lancer",       type: "Guitar", rarity: "Epic",      color: "#a855f7", img: `${G}/guitars/lunar-lancer.png` },
  { name: "Supernova Cable",    type: "Cable",  rarity: "Epic",      color: "#a855f7", img: `${G}/cables/supernova.png` },
  { name: "300 Coins",          type: "Coins",  rarity: "Epic",      color: "#fbbf24", amount: 300, img: `${G}/coins.png` },
  // Legendary
  { name: "Meteor Lights",      type: "Pedal",  rarity: "Legendary", color: "#ffd700", img: `${G}/pedals/meteor-lights.png` },
  { name: "Mythic Wall",        type: "Amp",    rarity: "Legendary", color: "#ffd700", img: `${G}/amps/mythic-wall.png` },
  { name: "Meteor Mauler",      type: "Guitar", rarity: "Legendary", color: "#ffd700", img: `${G}/guitars/meteor-mauler.png` },
  // Picks — Common
  { name: "Onyx Standard",      type: "Pick",   rarity: "Common",    color: "#94a3b8" },
  { name: "Solar Flare",        type: "Pick",   rarity: "Common",    color: "#94a3b8" },
  { name: "Cobalt Glitter",     type: "Pick",   rarity: "Common",    color: "#94a3b8" },
  // Picks — Rare
  { name: "Holographic Nebula", type: "Pick",   rarity: "Rare",      color: "#3b82f6" },
  { name: "Quasar Glitter",     type: "Pick",   rarity: "Rare",      color: "#3b82f6" },
  { name: "Carbon Vortex",      type: "Pick",   rarity: "Rare",      color: "#3b82f6" },
  { name: "Hot Pink Laser",     type: "Pick",   rarity: "Rare",      color: "#3b82f6" },
  { name: "Acid Pulse",         type: "Pick",   rarity: "Rare",      color: "#3b82f6" },
  { name: "Galaxy Swirl",       type: "Pick",   rarity: "Rare",      color: "#3b82f6" },
  // Picks — Epic
  { name: "Stardust Foil",      type: "Pick",   rarity: "Epic",      color: "#a855f7" },
  { name: "Marble Comet",       type: "Pick",   rarity: "Epic",      color: "#a855f7" },
  { name: "Holo Gold",          type: "Pick",   rarity: "Epic",      color: "#a855f7" },
  { name: "Prism Pulsar",       type: "Pick",   rarity: "Epic",      color: "#a855f7" },
  // Picks — Legendary / Mythic
  { name: "Aurora Pearl",       type: "Pick",   rarity: "Legendary", color: "#ffd700" },
  { name: "Obsidian Vein",      type: "Pick",   rarity: "Legendary", color: "#ffd700" },
  { name: "Singularity",        type: "Pick",   rarity: "Mythic",    color: "#ec4899" },
  // Straps — Common
  { name: "Caramel Leather",    type: "Strap",  rarity: "Common",    color: "#94a3b8", img: `${G}/straps/caramel-leather.png` },
  { name: "Sand Leather",       type: "Strap",  rarity: "Common",    color: "#94a3b8", img: `${G}/straps/sand-leather.png` },
  { name: "Ivory White",        type: "Strap",  rarity: "Common",    color: "#94a3b8", img: `${G}/straps/ivory-white.png` },
  { name: "Vintage Cream",      type: "Strap",  rarity: "Common",    color: "#94a3b8", img: `${G}/straps/vintage-cream.png` },
  { name: "Midnight Black",     type: "Strap",  rarity: "Common",    color: "#94a3b8", img: `${G}/straps/midnight-black.png` },
  { name: "Chestnut Leather",   type: "Strap",  rarity: "Common",    color: "#94a3b8", img: `${G}/straps/chestnut-leather.png` },
  // Straps — Rare
  { name: "Baroque Tapestry",   type: "Strap",  rarity: "Rare",      color: "#3b82f6", img: `${G}/straps/baroque-tapestry.png` },
  { name: "Autumn Tapestry",    type: "Strap",  rarity: "Rare",      color: "#3b82f6", img: `${G}/straps/autumn-tapestry.png` },
  { name: "Sapphire Floral",    type: "Strap",  rarity: "Rare",      color: "#3b82f6", img: `${G}/straps/sapphire-floral.png` },
  { name: "Rose Garden",        type: "Strap",  rarity: "Rare",      color: "#3b82f6", img: `${G}/straps/rose-garden.png` },
  { name: "Aqua Garden",        type: "Strap",  rarity: "Rare",      color: "#3b82f6", img: `${G}/straps/aqua-garden.png` },
  { name: "Copper Tapestry",    type: "Strap",  rarity: "Rare",      color: "#3b82f6", img: `${G}/straps/copper-tapestry.png` },
  { name: "Honey Leather",      type: "Strap",  rarity: "Rare",      color: "#3b82f6", img: `${G}/straps/honey-leather.png` },
  { name: "Cobalt Racer",       type: "Strap",  rarity: "Rare",      color: "#3b82f6", img: `${G}/straps/cobalt-racer.png` },
  // Straps — Epic
  { name: "Dark Brocade",       type: "Strap",  rarity: "Epic",      color: "#a855f7", img: `${G}/straps/dark-brocade.png` },
  { name: "Folk Tapestry",      type: "Strap",  rarity: "Epic",      color: "#a855f7", img: `${G}/straps/folk-tapestry.png` },
  { name: "Ocean Tapestry",     type: "Strap",  rarity: "Epic",      color: "#a855f7", img: `${G}/straps/ocean-tapestry.png` },
  { name: "Obsidian Tapestry",  type: "Strap",  rarity: "Epic",      color: "#a855f7", img: `${G}/straps/obsidian-tapestry.png` },
  { name: "Midnight Roses",     type: "Strap",  rarity: "Epic",      color: "#a855f7", img: `${G}/straps/midnight-roses.png` },
  { name: "Sunset Rainbow",     type: "Strap",  rarity: "Epic",      color: "#a855f7", img: `${G}/straps/sunset-rainbow.png` },
  { name: "Neon Pink Rush",     type: "Strap",  rarity: "Epic",      color: "#a855f7", img: `${G}/straps/neon-pink.png` },
  // Straps — Legendary
  { name: "Prism Burst",        type: "Strap",  rarity: "Legendary", color: "#ffd700", img: `${G}/straps/prism-burst.png` },
  { name: "Golden Garden",      type: "Strap",  rarity: "Legendary", color: "#ffd700", img: `${G}/straps/golden-garden.png` },
  { name: "Royal Brocade",      type: "Strap",  rarity: "Legendary", color: "#ffd700", img: `${G}/straps/royal-brocade.png` },
];
const LEGENDARY_PRIZE: PrizeEntry = { name: "Singularity Shredder", type: "Guitar", rarity: "Legendary", color: "#ffd700", img: `${G}/guitars/singularity-shredder.png` };

const RARITY_COLOR: Record<string, string> = {
  Common: "#94a3b8", Rare: "#3b82f6", Epic: "#a855f7", Legendary: "#ffd700", Mythic: "#ec4899",
};

// ─── reusable prize face (used on card and in zoom overlay) ────────────────────
function PrizeFace({ prize, prizeColor, delay, size }: {
  prize: PrizeEntry; prizeColor: string; delay: number; size: "card" | "zoom";
}) {
  const isLegendary = prize.rarity === "Legendary" || prize.rarity === "Mythic";
  const scale = size === "zoom" ? 1 : 1;
  const pad = size === "zoom" ? 20 : 8;
  const nameSz = size === "zoom" ? 18 : 11;
  const typeSz = size === "zoom" ? 10 : 8;
  const rarSz  = size === "zoom" ? 9  : 7;
  const imgSz  = size === "zoom" ? 140 : 52;

  return (
    <div style={{
      position:"absolute", inset:0, borderRadius: size === "zoom" ? 16 : 10,
      overflow:"hidden",
      backfaceVisibility: size === "card" ? "hidden" : undefined,
      transform: size === "card" ? "rotateY(180deg)" : undefined,
      background:`linear-gradient(145deg,#06001a 0%,${prizeColor}22 60%,#070015 100%)`,
      border:`1.5px solid ${prizeColor}`,
      boxShadow: isLegendary
        ? `0 0 24px 8px ${prizeColor}88,0 0 48px 16px ${prizeColor}44,0 8px 32px #000e`
        : `0 0 12px 3px ${prizeColor}55,0 4px 20px #000c`,
      animation: isLegendary ? "gold-glow 2s ease-in-out infinite" : "none",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      gap: size === "zoom" ? 10 : 4, padding:`${pad}px ${pad * 0.75}px`,
    }}>
      {/* Top rarity bar */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height: size === "zoom" ? 4 : 3,
        background:`linear-gradient(90deg,transparent,${prizeColor},transparent)`,
        boxShadow:`0 0 8px 2px ${prizeColor}88`,
      }}/>
      {/* Rarity pill */}
      <div style={{
        fontSize:rarSz, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase",
        color:prizeColor, border:`1px solid ${prizeColor}55`, borderRadius:20,
        padding:`${rarSz * 0.3}px ${rarSz}px`, background:`${prizeColor}18`,
      }}>{prize.rarity}</div>
      {/* Item image */}
      {prize.img ? (
        <img src={prize.img} alt={prize.name}
          style={{
            width:imgSz, height:imgSz, objectFit:"contain",
            filter:`drop-shadow(0 0 ${size === "zoom" ? 16 : 8}px ${prizeColor}88)`,
            pointerEvents:"none",
          }}
        />
      ) : null}
      {/* Type label */}
      <div style={{ fontSize:typeSz, color:"rgba(255,255,255,0.45)", letterSpacing:1.5, textTransform:"uppercase", fontWeight:600 }}>
        {prize.type === "Coins" ? `+${prize.amount}` : prize.type}
      </div>
      {/* Name */}
      <div style={{
        fontSize:nameSz, fontWeight:800, color:"#fff", textAlign:"center", lineHeight:1.25,
        textShadow:`0 0 12px ${prizeColor}`,
      }}>{prize.name}</div>
      {/* Shimmer sweep */}
      <div style={{
        position:"absolute", top:"-100%", left:0, width:"35%", height:"300%",
        background:"linear-gradient(105deg,transparent 0%,rgba(255,255,255,0.09) 50%,transparent 100%)",
        animation:`card-shimmer 3s ease-in-out ${delay}s infinite`,
        pointerEvents:"none",
      }}/>
      {/* Bottom bar */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, height: size === "zoom" ? 4 : 3,
        background:`linear-gradient(90deg,transparent,${prizeColor}55,transparent)`,
      }}/>
    </div>
  );
}

// ─── background stars (deterministic positions, no Math.random in render) ──────
const BG_STARS = Array.from({ length: 72 }, (_, i) => {
  const h = (i * 2654435761) >>> 0;
  return {
    left:  (h        & 0xffff) / 655.36,
    top:   ((h >> 8) & 0xffff) / 655.36,
    size:  i % 7 === 0 ? 2 : 1,
    delay: ((h >> 16) & 0x3ff) / 100,
    dur:   2.4 + ((h >> 20) & 0x1f) / 10,
    op:    0.25 + ((h >> 25) & 0x3f) / 200,
  };
});

// ─── component ─────────────────────────────────────────────────────────────────
export function BagOpen() {
  const [bagKey, setBagKey] = useState<BagKey>("purple");
  const BAG = BAGS[bagKey];

  const [phase,       setPhase]       = useState<Phase>("wait");
  const [zipPct,      setZipPct]      = useState(0);
  const [trailLinger, setTrailLinger] = useState(false);
  const [cards,    setCards]    = useState<CardDef[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [flipped,  setFlipped]  = useState<boolean[]>([]);
  const [prizes,   setPrizes]   = useState<PrizeEntry[]>([]);
  const [zoomed,      setZoomed]      = useState<number | null>(null);
  const [pinchScales, setPinchScales] = useState<number[]>([]);
  const [closedH,  setClosedH]  = useState(108);
  const [openH,    setOpenH]    = useState(134);
  const [hintP,    setHintP]    = useState(0);
  const [hintOp,   setHintOp]   = useState(0);

  const phaseRef          = useRef<Phase>("wait");
  const canvasRef         = useRef<HTMLCanvasElement>(null);
  const stopBurst         = useRef<(() => void) | null>(null);
  const dragActiveRef     = useRef(false);
  const dragStartXRef     = useRef(0);
  const dragStartYRef     = useRef(0);
  const zipPctRef         = useRef(0);
  const rafRef            = useRef(0);
  const t0Ref             = useRef(0);
  const pinchPtrsRef      = useRef<Map<number, Map<number, {x:number;y:number}>>>(new Map());
  const pinchBaseRef      = useRef<Map<number, {scale:number;dist:number}>>(new Map());
  const pinchActiveRef    = useRef<Set<number>>(new Set());
  const pinchScalesRef    = useRef<number[]>([]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Single RAF loop drives both hand + trail so they are always in sync
  useEffect(() => {
    if (phase !== "wait") { setHintP(0); setHintOp(0); return; }
    let raf: number;
    let t0: number | null = null;
    const CYCLE = 1800;
    function tick(now: number) {
      if (t0 === null) t0 = now;
      const frac = ((now - t0) % CYCLE) / CYCLE;
      let p: number, op: number;
      if (frac < 0.08)       { p = 0; op = frac / 0.08; }
      else if (frac < 0.75)  { p = (frac - 0.08) / 0.67; op = 1; }
      else                   { p = 1; op = Math.max(0, 1 - (frac - 0.75) / 0.25); }
      setHintP(p);
      setHintOp(op);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const t             = zipPct / 100;
  const isWait        = phase === "wait";
  const isZip         = phase === "zipping";
  const isOpenOrLater = ["open","deal","done"].includes(phase);

  const closedOp = isOpenOrLater ? 0 : 1 - t;
  const openOp   = isWait ? 0 : isOpenOrLater ? 1 : t;
  const containerH = Math.max(closedH, openH);

  // Seam: lid-body junction in perspective. Source (1219×444): left(175,105) → right(1090,175)
  const seamRightY = containerH - closedH + closedH * 0.39;
  const seamLeftY  = containerH - closedH + closedH * 0.24;
  const seamY      = (seamRightY + seamLeftY) / 2;

  // Zip tab path
  const zipStartX = BAG_W * 0.89 - ZIP_W / 2 - 29;
  const zipStartY = seamRightY - ZIP_H * 0.14 - 18;
  const zipEndX   = BAG_W * 0.14 - ZIP_W / 2 + 1;
  const zipEndY   = seamLeftY  - ZIP_H * 0.14 - 8; // +10px lower at end of journey
  const zipTabX   = isWait ? zipStartX : zipStartX + (zipEndX - zipStartX) * t;
  const zipTabY   = isWait ? zipStartY : zipStartY + (zipEndY - zipStartY) * t;

  // Demo auto-play: idle hint plays → auto-zip → open → deal → done → 3s gap → repeat
  useEffect(() => {
    if (phase !== "wait") return;
    const t = setTimeout(() => runZip(), 2400);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line

  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => reset(), 3000);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line

  // Canvas burst removed — replaced by light_burst2.png

  // ── Open sequence (called after zip reaches 100%) ────────────────────────────
  function triggerOpen() {
    setTrailLinger(true);
    setTimeout(() => setTrailLinger(false), 300);
    setPhase("open");
    phaseRef.current = "open";
    const originX = (window.innerWidth - BAG_W) / 2 + BAG_W * 0.5;
    const originY = PAD_TOP + seamY;
    const defs = makeCards(BAG.cards, window.innerWidth, window.innerHeight, originX, originY, (BAG as any).cardRows);
    setCards(defs);

    const count = defs.length;

    // Weighted type draw — no two prizes of the same type in one bag.
    // Coins/Strap/Pick are 4× more likely to appear than Amp/Pedal/Guitar.
    const TYPE_WEIGHT: Record<string, number> = {
      Coins: 4, Strap: 4, Pick: 4, Cable: 2, Pedal: 1, Amp: 1, Guitar: 1,
    };
    const fullPool = [...PRIZE_POOL, LEGENDARY_PRIZE];

    // Group pool by type
    const byType: Record<string, PrizeEntry[]> = {};
    for (const p of fullPool) {
      (byType[p.type] ??= []).push(p);
    }

    // Weighted pick of types without replacement
    function pickWeightedType(available: string[]): string {
      const total = available.reduce((s, t) => s + (TYPE_WEIGHT[t] ?? 1), 0);
      let r = Math.random() * total;
      for (const t of available) {
        r -= TYPE_WEIGHT[t] ?? 1;
        if (r <= 0) return t;
      }
      return available[available.length - 1];
    }

    const availableTypes = Object.keys(byType);
    const picked: PrizeEntry[] = [];
    for (let i = 0; i < count && availableTypes.length > 0; i++) {
      const type = pickWeightedType(availableTypes);
      availableTypes.splice(availableTypes.indexOf(type), 1); // remove so no repeat
      const pool = byType[type].sort(() => Math.random() - 0.5);
      picked.push(pool[0]); // random item from that type
    }

    setPrizes(picked);
    const initScales = new Array(defs.length).fill(1);
    pinchScalesRef.current = initScales;
    setPinchScales(initScales);
    setFlipped(new Array(defs.length).fill(false));
    setTimeout(() => {
      setPhase("deal");
      defs.forEach((_, i) => {
        setTimeout(() => {
          setRevealed(r => [...r, i]);
          if (i === defs.length - 1) setTimeout(() => setPhase("done"), 800);
        }, 800 + i * 624);
      });
    }, 1000);
  }

  // ── Swipe gesture — constant speed regardless of finger velocity ─────────────
  function runZip() {
    // Always animates 0→100 at ZIP_MS — finger speed has no effect
    cancelAnimationFrame(rafRef.current);
    setPhase("zipping"); phaseRef.current = "zipping";
    t0Ref.current = performance.now();
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - t0Ref.current) / ZIP_MS) * 100);
      setZipPct(pct); zipPctRef.current = pct;
      if (pct < 100) { rafRef.current = requestAnimationFrame(tick); }
      else            { triggerOpen(); }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (phaseRef.current !== "wait") return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragActiveRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragActiveRef.current) return;
    if (phaseRef.current !== "wait") return;
    const dx = dragStartXRef.current - e.clientX;   // positive = moved left (right-to-left)
    const dy = Math.abs(e.clientY - dragStartYRef.current);
    if (dx < 32) return;              // must move at least 32px horizontally
    if (dy > dx * 0.8) return;        // reject if mostly vertical (scroll, not swipe)
    dragActiveRef.current = false;    // disarm — animation takes over
    runZip();
  }

  function handlePointerUp() {
    dragActiveRef.current = false;
  }

  function reset() {
    cancelAnimationFrame(rafRef.current);
    stopBurst.current?.();
    setPhase("wait"); setZipPct(0); setCards([]); setRevealed([]);
    setFlipped([]); setPrizes([]); setZoomed(null); setPinchScales([]);
    dragActiveRef.current = false; zipPctRef.current = 0;
    pinchPtrsRef.current.clear(); pinchBaseRef.current.clear(); pinchActiveRef.current.clear();
    pinchScalesRef.current = [];
  }

  // ── Pinch-to-zoom helpers ─────────────────────────────────────────────────────
  function ptDist(m: Map<number, {x:number;y:number}>): number {
    const [[,a],[,b]] = [...m.entries()];
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function handleCardDown(e: React.PointerEvent, idx: number, isFlipped: boolean) {
    e.stopPropagation();
    if (!isFlipped) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const m = pinchPtrsRef.current.get(idx) ?? new Map<number, {x:number;y:number}>();
    m.set(e.pointerId, {x: e.clientX, y: e.clientY});
    pinchPtrsRef.current.set(idx, m);
    if (m.size === 2) {
      pinchBaseRef.current.set(idx, {
        scale: pinchScalesRef.current[idx] ?? 1,
        dist:  ptDist(m),
      });
      pinchActiveRef.current.add(idx);
    }
  }

  function handleCardMove(e: React.PointerEvent, idx: number, isFlipped: boolean) {
    if (!isFlipped) return;
    const m = pinchPtrsRef.current.get(idx);
    if (!m?.has(e.pointerId)) return;
    m.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (m.size < 2) return;
    const base = pinchBaseRef.current.get(idx);
    if (!base) return;
    const s = Math.max(0.55, Math.min(4.5, base.scale * (ptDist(m) / base.dist)));
    pinchScalesRef.current = pinchScalesRef.current.map((v, i) => i === idx ? s : v);
    setPinchScales([...pinchScalesRef.current]);
  }

  function handleCardUp(e: React.PointerEvent, idx: number) {
    const m = pinchPtrsRef.current.get(idx);
    if (m) { m.delete(e.pointerId); if (m.size < 2) pinchBaseRef.current.delete(idx); }
  }

  useEffect(() => {
    if (phase !== "done") return;
    const id = setTimeout(reset, 15000);
    return () => clearTimeout(id);
  }, [phase]); // eslint-disable-line

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse 80% 55% at 50% 18%, #1e0545 0%, #0b0028 40%, #040210 75%, #020108 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: PAD_TOP,
        fontFamily: "system-ui,sans-serif",
        position: "relative", overflow: "hidden", userSelect: "none",
        cursor: isWait ? "grab" : isZip ? "grabbing" : "default",
        touchAction: "none",
      }}
    >
      <style>{`
        @keyframes card-fly {
          0%   { transform:translate(0,0) scale(0) rotate(0deg); opacity:0 }
          15%  { transform:translate(0,0) scale(0.06) rotate(0deg); opacity:1 }
          100% { transform:translate(var(--tx),var(--ty)) scale(1) rotate(calc(var(--rot)*1deg)); opacity:1 }
        }
        @keyframes card-float {
          0%,100% { transform: translateY(0px) }
          50%     { transform: translateY(-4px) }
        }
        @keyframes card-reveal { 0%{transform:rotateY(90deg)} 100%{transform:rotateY(0deg)} }
        @keyframes gold-glow {
          0%,100%{ box-shadow:0 0 14px 5px #ffd700,0 0 28px 10px #ffd70044,0 6px 20px #000e }
          50%    { box-shadow:0 0 22px 8px #ffd700,0 0 40px 14px #ffd70066,0 6px 20px #000e }
        }
        @keyframes card-shimmer {
          0%   { transform:translateX(-100%) }
          60%  { transform:translateX(-100%) }
          100% { transform:translateX(500%) }
        }
        @keyframes pip-pulse {
          0%,100% { opacity:1 }
          50%     { opacity:0.55 }
        }
        @keyframes card-shake {
          0%,100% { transform: rotate(0deg) translateY(0px) }
          18%     { transform: rotate(-2.5deg) translateY(-1px) }
          36%     { transform: rotate(2.5deg) translateY(1px) }
          54%     { transform: rotate(-1.5deg) translateY(-1px) }
          72%     { transform: rotate(1.5deg) translateY(0px) }
          88%     { transform: rotate(-0.5deg) translateY(0px) }
        }
        @keyframes burst-pop {
          0%    { opacity: 0; }
          8%    { opacity: 0.18; }
          20%   { opacity: 0.72; }
          33%   { opacity: 1; }
          65%   { opacity: 1; }
          80%   { opacity: 0.52; }
          92%   { opacity: 0.1; }
          100%  { opacity: 0; }
        }
        @keyframes star-twinkle {
          0%,100% { opacity: var(--star-op); transform: scale(1) }
          50%     { opacity: calc(var(--star-op) * 0.25); transform: scale(0.7) }
        }
      `}</style>

      {/* ── Star field ── */}
      {BG_STARS.map((s, i) => (
        <div key={i} style={{
          position: "fixed",
          left: `${s.left}%`, top: `${s.top}%`,
          width: s.size, height: s.size, borderRadius: "50%",
          background: i % 9 === 0 ? "#c4aaff" : i % 5 === 0 ? "#a0d4ff" : "#ffffff",
          pointerEvents: "none",
          // @ts-expect-error css var
          "--star-op": s.op,
          animation: `star-twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          zIndex: 0,
        }} />
      ))}

      {/* Canvas overlay */}
      <canvas ref={canvasRef} style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:50 }} />

      {/* Burst rays PNG — source bottom-centre anchored at bag interior pinpoint, rays billow freely above */}
      {isOpenOrLater && phase !== "done" && (() => {
        const imgTop   = Math.round(containerH + BAG.openBagDrop - openH);
        const pinY     = PAD_TOP + 46 + imgTop + Math.round((seamRightY - imgTop) * 0.55);
        // Rotate to match the seam slope (left is higher than right)
        const seamAngle = Math.atan2(seamRightY - seamLeftY, BAG_W) * 180 / Math.PI + 2;
        // Display at 520×290; source sits at ~90% down = 261 px
        const W = 520, H = 290, srcY = Math.round(H * 0.90);
        return (
          <img
            src="/__mockup/bags/burst_rays.png"
            alt=""
            style={{
              position: "absolute",
              left: "calc(50% - 10px)",
              top: pinY - srcY + 17,
              width: W, height: H,
              transform: `translateX(-50%) rotate(${seamAngle.toFixed(2)}deg)`,
              transformOrigin: "50% 90%",
              mixBlendMode: "screen",
              WebkitMaskImage: "linear-gradient(to top, black 0%, black 38%, transparent 65%, transparent 100%)",
              maskImage: "linear-gradient(to top, black 0%, black 38%, transparent 65%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 10,
              animation: "burst-pop 1800ms ease-out forwards",
            }}
          />
        );
      })()}

      {/* ── "OPEN YOUR BAG" sign — always rendered so the bag stage doesn't jump ── */}
      <div style={{
        marginBottom: 18,
        height: 28,
        color: "#e8d5ff",
        fontSize: 20,
        fontWeight: 800,
        letterSpacing: 3,
        textTransform: "uppercase",
        textShadow: "0 0 18px #9b5de5, 0 0 36px #9b5de566, 0 2px 8px #000a",
        opacity: isWait ? 1 : 0,
        transition: "opacity 400ms ease",
        pointerEvents: "none",
        zIndex: 2,
      }}>
        Open your bag
      </div>

      {/* ── BAG STAGE ── */}
      <div style={{ position:"relative", width:BAG_W, height:containerH }}>

        {/* Hot-spot pinpoint — tight circle at the bag interior centre */}
        {isOpenOrLater && phase !== "done" && (() => {
          const imgTop     = Math.round(containerH + BAG.openBagDrop - openH);
          const pinY       = imgTop + Math.round((seamRightY - imgTop) * 0.55);
          return (
            <div style={{
              position: "absolute",
              left: "50%", top: pinY,
              width: 70, height: 70,
              marginLeft: -45, marginTop: -35,
              borderRadius: "50%",
              background: [
                "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 30%)",
                "radial-gradient(circle, rgba(255,248,180,0.9) 0%, rgba(255,248,180,0) 80%)",
              ].join(", "),
              pointerEvents: "none",
              zIndex: 5,
              animation: "burst-pop 1800ms ease-out forwards",
            }} />
          );
        })()}

        <img src={BAG.open} alt="open bag"
          style={{ position:"absolute", bottom:9-BAG.openBagDrop, left:0, width:BAG_W, display:"block",
                   opacity:openOp, transition:"opacity 1000ms ease" }}
          onLoad={e => setOpenH((e.target as HTMLImageElement).offsetHeight)}
        />
        <img src={BAG.closed} alt="closed bag"
          style={{ position:"absolute", bottom:0, left:"50%", transform:`translateX(-50%) scaleX(${BAG.closedScale}) scaleY(${BAG.closedScale})`, transformOrigin:"bottom center", width:BAG_W, display:"block",
                   opacity:closedOp, transition:"opacity 1000ms ease" }}
          onLoad={e => setClosedH((e.target as HTMLImageElement).offsetHeight)}
        />

        {/* AGS logo on the closed bag face */}
        <img src="/__mockup/bags/ags_logo.png" alt="Alien Guitar Secrets"
          style={{
            position:"absolute",
            left: "50%",
            transform: "translateX(calc(-50% - 20px)) rotate(2deg)",
            bottom: closedH * 0.28 + 4,
            width: BAG_W * 0.34,
            pointerEvents: "none",
            opacity: closedOp,
            transition: "opacity 1000ms ease",
            filter: "invert(1)",
            mixBlendMode: "multiply",
            zIndex: 3,
          }}
        />
        {/* AGS logo on the open bag face */}
        <img src="/__mockup/bags/ags_logo.png" alt="Alien Guitar Secrets"
          style={{
            position:"absolute",
            left: "50%",
            transform: `translateX(calc(-50% - 23px)) rotate(${(BAG as any).openLogoRot ?? 4}deg)`,
            bottom: (openH || closedH) * 0.20 + 5 + BAG.openLogoLift,
            width: BAG_W * 0.34,
            pointerEvents: "none",
            opacity: openOp,
            transition: "opacity 1000ms ease",
            filter: "invert(1)",
            mixBlendMode: "multiply",
            zIndex: 3,
          }}
        />

        {/* Zip pull tab — moves with the swipe */}
        {!isOpenOrLater && (
          <img src="/__mockup/bags/zip_tab.png" alt=""
            style={{
              position:"absolute", left:zipTabX, top:zipTabY,
              width:ZIP_W, height:ZIP_H, pointerEvents:"none",
              filter: ZIP_FILTER[BAG.zipColor],
              transform:"rotate(-6deg)", transformOrigin:"50% 15%",
            }}
          />
        )}

        {/* Hand + trail — both driven by the same progress value so they never drift */}
        {(isWait || isZip || trailLinger) && (() => {
          const progress = trailLinger ? 1 : isZip ? zipPct / 100 : hintP;
          const opacity  = trailLinger ? 1 : isZip ? 1 : hintOp;
          const handDx   = zipEndX - zipStartX;
          const handDy   = zipEndY - zipStartY;
          const trailAngle = Math.atan2(zipStartY - zipEndY, zipStartX - zipEndX) * 180 / Math.PI;
          const trailW   = zipStartX - (zipEndX + 13) + 10;
          const scaleX   = `scaleX(${progress})`;
          return (
            <>
              {/* Light trail — grows right-to-left behind the fingertip */}
              <div style={{
                position: "absolute",
                left: zipEndX + 13,
                top: zipEndY - 12,
                width: trailW, height: 24,
                transform: `rotate(${trailAngle}deg)`,
                transformOrigin: "left center",
                pointerEvents: "none",
                zIndex: 8,
                opacity,
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to right, transparent 0%, rgba(255,210,60,0.45) 10%, rgba(255,230,100,0.6) 55%, rgba(255,245,150,0.7) 86%, transparent 100%)",
                  borderRadius: 12, filter: "blur(7px)",
                  transformOrigin: "right center", transform: scaleX,
                }}/>
                <div style={{
                  position: "absolute", inset: "4px 0",
                  background: "linear-gradient(to right, transparent 0%, rgba(255,240,150,0.6) 10%, rgba(255,255,255,0.88) 50%, rgba(255,255,255,0.95) 86%, transparent 100%)",
                  borderRadius: 8, filter: "blur(2.5px)",
                  transformOrigin: "right center", transform: scaleX,
                }}/>
                <div style={{
                  position: "absolute", inset: "9px 0",
                  background: "linear-gradient(to right, transparent 0%, rgba(255,250,200,0.8) 8%, rgba(255,255,255,1) 40%, rgba(255,255,255,1) 83%, transparent 100%)",
                  borderRadius: 3, filter: "blur(0.5px)",
                  transformOrigin: "right center", transform: scaleX,
                }}/>
              </div>

              {/* Hand PNG — only shown in the idle hint, not during real swipe */}
              {isWait && (
                <div style={{
                  position: "absolute",
                  left: zipStartX - Math.round(110 * 0.62) + 25,
                  top:  zipStartY - Math.round(110 * 1.33 * 0.03) - 31,
                  width: 110,
                  pointerEvents: "none",
                  zIndex: 10,
                  filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.8))",
                  transform: `translate(${progress * handDx}px, ${progress * handDy}px)`,
                  opacity,
                }}>
                  <img src="/__mockup/bags/hand_pointer.png" alt="" style={{ width: "100%", display: "block" }}/>
                </div>
              )}
            </>
          );
        })()}

      </div>

      {/* ── FLYING CARDS ── */}
      {(phase === "deal" || phase === "done") && cards.map((c, i) => {
        const isLegendary = i === BAG.cards - 1;
        const isLanded    = revealed.includes(i);
        const isFlipped   = flipped[i] ?? false;
        const prize       = prizes[i];
        const prizeColor  = prize ? RARITY_COLOR[prize.rarity] : BAG.pip;
        return (
          <div key={i} style={{
            position:"absolute", top:PAD_TOP + seamY, left:"50%", marginLeft:-CARD_W/2,
            width:CARD_W, height:CARD_H,
            // @ts-expect-error css vars
            "--tx":`${c.tx}px`, "--ty":`${c.ty}px`, "--rot":`${c.rot}`,
            animation:`card-fly 1800ms ${c.delay}ms cubic-bezier(.25,.46,.45,.94) both`,
            zIndex:20,
          }}>
            {/* Float bob wrapper */}
            <div style={{
              width:"100%", height:"100%",
              animation: isLegendary
                ? `card-float 2.4s ease-in-out ${c.delay + 2000}ms infinite both, card-shake 0.55s ease-in-out ${c.delay + 1900}ms 3 both`
                : `card-float 2.4s ease-in-out ${c.delay + 2000}ms infinite both`,
              perspective:800,
            }}>
              {/* Pinch-zoom + tap wrapper */}
              <div
                onPointerDown={e => handleCardDown(e, i, isFlipped)}
                onPointerMove={e => handleCardMove(e, i, isFlipped)}
                onPointerUp={e => handleCardUp(e, i)}
                onPointerCancel={e => handleCardUp(e, i)}
                onClick={() => {
                  if (!isLanded) return;
                  if (!isFlipped) {
                    setFlipped(f => { const n = [...f]; n[i] = true; return n; });
                    return;
                  }
                  // If a pinch just ended, suppress the synthetic click
                  if (pinchActiveRef.current.has(i)) { pinchActiveRef.current.delete(i); return; }
                  const sc = pinchScalesRef.current[i] ?? 1;
                  if (sc > 1.08) {
                    // Tap while zoomed → spring back to 1
                    pinchScalesRef.current[i] = 1;
                    setPinchScales(s => { const n = [...s]; n[i] = 1; return n; });
                  } else {
                    setZoomed(i);
                  }
                }}
                style={{
                  width:"100%", height:"100%",
                  transform:`scale(${pinchScales[i] ?? 1})`,
                  transformOrigin:"center center",
                  transition: (pinchPtrsRef.current.get(i)?.size ?? 0) >= 2 ? "none" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  cursor: isLanded ? "pointer" : "default",
                  touchAction:"none",
                }}
              >
              {/* 3D flip container */}
              <div
                style={{
                  width:"100%", height:"100%",
                  transformStyle:"preserve-3d",
                  transition:"transform 0.65s cubic-bezier(0.4,0,0.2,1)",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  borderRadius:10,
                }}
              >
                {/* ── BACK FACE (mystery — AGS logo) ── */}
                <div style={{
                  position:"absolute", inset:0, borderRadius:10, overflow:"hidden",
                  backfaceVisibility:"hidden",
                  background:"linear-gradient(145deg,#06001a 0%,#110030 55%,#070015 100%)",
                  border:`1.5px solid ${isLegendary ? "#ffd700" : BAG.pip + "88"}`,
                  boxShadow: isLegendary
                    ? "0 0 18px 6px #ffd700,0 0 36px 12px #ffd70055,0 8px 24px #000e"
                    : `0 0 10px 2px ${BAG.pip}44,0 4px 20px #000c`,
                  animation: isLegendary ? "gold-glow 2s ease-in-out infinite" : "none",
                }}>
                  {/* Accent bar */}
                  <div style={{
                    position:"absolute", top:0, left:0, right:0, height:3,
                    background: isLegendary
                      ? "linear-gradient(90deg,#ffd700,#fffacd,#ffd700)"
                      : `linear-gradient(90deg,transparent,${BAG.pip},transparent)`,
                    boxShadow:`0 0 8px 2px ${isLegendary ? "#ffd70088" : BAG.pip + "88"}`,
                    animation: isLegendary ? "none" : "pip-pulse 2.5s ease-in-out infinite",
                  }}/>
                  {/* Star field */}
                  {[[8,18],[32,7],[58,22],[82,11],[22,42],[74,38],[44,65],[88,58],[14,78],[52,88],[68,72],[36,52],[91,30],[5,60]].map(([x,y],si) => (
                    <div key={si} style={{
                      position:"absolute", left:`${x}%`, top:`${y}%`,
                      width:si%4===0?2:1, height:si%4===0?2:1,
                      borderRadius:"50%", background:"white",
                      opacity:0.35+(si%3)*0.2,
                      boxShadow:si%4===0?"0 0 2px 1px rgba(255,255,255,0.35)":"none",
                    }}/>
                  ))}
                  {/* Centre icon */}
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img src="/__mockup/bags/ags_icon.png" alt=""
                      style={{
                        width:"78%", height:"auto",
                        filter: isLegendary
                          ? "drop-shadow(0 0 10px #ffd700) drop-shadow(0 0 4px #ffd700)"
                          : `drop-shadow(0 0 6px ${BAG.pip})`,
                        pointerEvents:"none",
                      }}
                    />
                  </div>
                  {/* Tap hint (only when landed and not yet flipped) */}
                  {isLanded && !isFlipped && (
                    <div style={{
                      position:"absolute", bottom:6, left:0, right:0,
                      textAlign:"center", fontSize:7, letterSpacing:2,
                      fontWeight:800, color:"rgba(255,255,255,0.55)", textTransform:"uppercase",
                      animation:"pip-pulse 1.6s ease-in-out infinite",
                    }}>TAP TO REVEAL</div>
                  )}
                  {/* Shimmer sweep */}
                  <div style={{
                    position:"absolute", top:"-100%", left:0,
                    width:"35%", height:"300%",
                    background:"linear-gradient(105deg,transparent 0%,rgba(255,255,255,0.07) 50%,transparent 100%)",
                    animation:`card-shimmer ${isLegendary?2.5:4}s ease-in-out ${i*0.4}s infinite`,
                    pointerEvents:"none",
                  }}/>
                </div>

                {/* ── FRONT FACE (prize reveal) ── */}
                {prize && <PrizeFace prize={prize} prizeColor={prizeColor} delay={i * 0.3} size="card" />}
              </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── ZOOM OVERLAY ── */}
      {zoomed !== null && prizes[zoomed] && (() => {
        const p = prizes[zoomed]!;
        const pc = RARITY_COLOR[p.rarity] ?? "#fff";
        return (
          <div
            onClick={() => setZoomed(null)}
            style={{
              position:"fixed", inset:0, zIndex:100,
              background:"rgba(0,0,0,0.88)",
              display:"flex", alignItems:"center", justifyContent:"center",
              backdropFilter:"blur(6px)",
            }}
          >
            <div style={{
              width:260, height:370,
              animation:"card-reveal 320ms cubic-bezier(0.34,1.56,0.64,1) both",
            }}
              onClick={e => e.stopPropagation()}
            >
              <PrizeFace prize={p} prizeColor={pc} delay={0} size="zoom" />
            </div>
            <div style={{
              position:"absolute", bottom:40, left:0, right:0,
              textAlign:"center", fontSize:10, letterSpacing:2,
              color:"rgba(255,255,255,0.35)", textTransform:"uppercase", fontWeight:600,
            }}>Tap anywhere to close</div>
          </div>
        );
      })()}

    </div>
  );
}
