import { RARITY_COLOR, RARITY_FRAME_FILTER, RARITY_BG } from "./rarity";

const CARD_FRAME = "/__mockup/animations/mystery-bag-reveal/card-reward-frame.png";
const GUITAR_IMG = "/__mockup/gear/guitars/woodstock-white.png";

const RARITIES = ["common", "rare", "epic", "legendary", "mythic"] as const;
type Rarity = typeof RARITIES[number];

const RARITY_LABEL: Record<Rarity, string> = {
  common:    "Common",
  rare:      "Rare",
  epic:      "Epic",
  legendary: "Legendary",
  mythic:    "Mythic",
};

function FrameCard({ rarity }: { rarity: Rarity }) {
  const color = RARITY_COLOR[rarity];
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      {/* Card */}
      <div style={{
        position:"relative",
        width:120, height:171,
        borderRadius:10,
        background: RARITY_BG[rarity],
        overflow:"hidden",
        boxShadow: `0 0 18px ${color}55, 0 8px 24px rgba(0,0,0,0.8)`,
      }}>
        {/* Tinted frame */}
        <img
          src={CARD_FRAME}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"fill", borderRadius:10, zIndex:2, filter: RARITY_FRAME_FILTER[rarity] }}
          alt=""
        />
        {/* Item image in upper zone */}
        <div style={{ position:"absolute", inset:0, zIndex:3, display:"flex", flexDirection:"column" }}>
          <div style={{ flex:"0 0 72%", display:"flex", alignItems:"center", justifyContent:"center", paddingTop:"16%" }}>
            <img src={GUITAR_IMG} alt="" style={{ width:"72%", maxHeight:"100%", objectFit:"contain", filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.9))" }} />
          </div>
          {/* Banner text */}
          <div style={{ flex:"0 0 28%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", paddingBottom:"8%", gap:1 }}>
            <div style={{ fontSize:6, fontWeight:900, letterSpacing:2, color, textTransform:"uppercase" as const }}>{RARITY_LABEL[rarity]}</div>
            <div style={{ fontSize:9, fontWeight:700, color:"#fff", textAlign:"center", lineHeight:1.2, padding:"0 6px" }}>Woodstock White Bolt</div>
          </div>
        </div>
      </div>
      {/* Label below card */}
      <div style={{ fontSize:11, fontWeight:700, color, letterSpacing:1, textTransform:"uppercase" as const }}>
        {RARITY_LABEL[rarity]}
      </div>
    </div>
  );
}

export function FramePreview() {
  return (
    <div style={{
      minHeight:"100vh",
      background:"#04020e",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      gap:24,
      padding:"24px 16px",
      fontFamily:"system-ui, sans-serif",
    }}>
      <div style={{ fontSize:13, color:"#6b7280", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>
        Frame colour options by rarity
      </div>

      {/* Row 1: Common · Rare · Epic */}
      <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
        <FrameCard rarity="common" />
        <FrameCard rarity="rare" />
        <FrameCard rarity="epic" />
      </div>

      {/* Row 2: Legendary · Mythic */}
      <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
        <FrameCard rarity="legendary" />
        <FrameCard rarity="mythic" />
      </div>
    </div>
  );
}
