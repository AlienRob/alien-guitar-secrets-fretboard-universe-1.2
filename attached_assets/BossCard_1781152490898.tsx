import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * BOSS CHARACTER CARD — reusable template.
 * Every boss is described by the `boss` data object below. Swap the
 * text, numbers and image slots and the whole card re-skins itself.
 * ------------------------------------------------------------------ */

type Attribute = { label: string; value: number }; // value 0–10
type StatPanel = { title: string; body: string; icon: IconName };
type ImageSlot = { label: string; src?: string };

type IconName = "bolt" | "spark" | "infinity" | "alien" | "shield" | "planet";

export type Boss = {
  name: string;
  nameAccent?: string; // second line of the name, rendered in violet
  titles: string[]; // e.g. ["Guardian of Infinite Velocity", "Keeper of the Endless Arpeggio"]
  planet: string;
  heroImage?: string; // big character art (left)
  originStory: string[]; // paragraphs
  quote: string;
  specialty: StatPanel;
  specialAbility: StatPanel;
  guardianPower: StatPanel;
  funFacts: string[];
  attributes: Attribute[];
  unlock: { text: string };
  difficulty: number; // 1–5 stars
  difficultyTagline: string;
  gallery: ImageSlot[]; // 3 slots: signature guitar, close-up, avatar front
};

/* ---- TEMPLATE DATA -------------------------------------------------
 * Blank by design. This is the empty boss-card template: every slot is
 * left unfilled so the card shows a placeholder in its place. To make a
 * real boss, copy this object and fill in the values. (A fully-populated
 * "Ingvar" example lived here previously — see git history.)
 * ------------------------------------------------------------------ */
const TEMPLATE_BOSS: Boss = {
  name: "",
  nameAccent: "",
  titles: [],
  planet: "",
  heroImage: undefined,
  originStory: [],
  quote: "",
  specialty: { title: "Specialty", body: "", icon: "bolt" },
  specialAbility: { title: "Special Ability", body: "", icon: "spark" },
  guardianPower: { title: "Guardian Power", body: "", icon: "infinity" },
  funFacts: [],
  attributes: [
    { label: "Speed", value: 0 },
    { label: "Technique", value: 0 },
    { label: "Creativity", value: 0 },
    { label: "Ego", value: 0 },
    { label: "Stamina", value: 0 },
  ],
  unlock: { text: "" },
  difficulty: 0,
  difficultyTagline: "",
  gallery: [
    { label: "Signature Guitar" },
    { label: "Guitar Close-Up" },
    { label: "Avatar Front" },
  ],
};

/* ---- THEME -------------------------------------------------------- */
const C = {
  gold: "#f3c14b",
  goldDim: "#caa23a",
  violet: "#b48cff",
  violetSoft: "#8b7bd8",
  ink: "#ece8ff",
  inkDim: "#a39ccf",
  panel: "#000000",
  panelBorder: "rgba(168,85,247,0.8)",
  slot: "#000000",
};

const ARMS = "/__mockup/images/ags-coat-of-arms.png";
const WORDMARK = "/__mockup/images/ags-wordmark-2026.png";
const FRETBOARD_LOGO = "/__mockup/images/fretboard-universe-logo.png";

/* Ingvar image assets — drop the matching PNGs into /__mockup/images/ */
const IMG = {
  characterArt: "/__mockup/images/ingvar-character-art.png",
  portrait: "/__mockup/images/ingvar-portrait.png",
  signatureGuitar: "/__mockup/images/ingvar-signature-guitar.png",
  guitarCloseup: "/__mockup/images/ingvar-guitar-closeup.png",
};

/* ---- INGVAR — fully populated example boss ------------------------ */
export const INGVAR: Boss = {
  name: "Ingvar",
  nameAccent: "Mor-Ismor",
  titles: ["Guardian of Infinite Velocity", "Keeper of the Endless Arpeggio"],
  planet: "Arpeggion Prime",
  heroImage: undefined, // Replit: wire up zoomable character art (IMG.characterArt)
  originStory: [
    "Born in the ice-capped fjords of Arpeggion Prime, Ingvar Mor-Ismor was blessed with perfect pitch, perfect technique, and absolutely zero humility.",
    "While others chased tone, he chased infinity. While others played notes, he conquered them.",
  ],
  quote: "Why play fewer notes when there are infinitely more waiting to be discovered?",
  specialty: { title: "Specialty", body: "Arpeggios, modes, speed, harmonic minor & fretboard precision.", icon: "bolt" },
  specialAbility: { title: "Special Ability", body: "Infinite Cascade — unleashes an endless stream of arpeggios so fast it bends spacetime and makes metronomes cry.", icon: "spark" },
  guardianPower: { title: "Guardian Power", body: "Unlimited Ego — immune to 'less is more.' Gains more power the more he plays.", icon: "infinity" },
  funFacts: [
    "Practices 16 hours a day. Before breakfast.",
    "Has played every note in existence. Twice.",
    "His hair has its own zip code.",
    "Believes silence is a waste of good time.",
  ],
  attributes: [
    { label: "Speed", value: 10 },
    { label: "Technique", value: 9 },
    { label: "Creativity", value: 7 },
    { label: "Ego", value: 10 },
    { label: "Stamina", value: 9 },
  ],
  unlock: { text: "Complete all Speed Trials and earn 75,000 XP" },
  difficulty: 5,
  difficultyTagline: "Only the determined can handle more.",
  gallery: [
    // Replit: wire up zoomable images (IMG.signatureGuitar, IMG.guitarCloseup, IMG.portrait)
    { label: "Signature Guitar" },
    { label: "Guitar Close-Up" },
    { label: "Portrait" },
  ],
};

/* ---- ICONS (inline SVG, no emoji) -------------------------------- */
function Icon({ name }: { name: IconName }) {
  const common = { width: 22, height: 22, fill: "none", stroke: C.gold, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "bolt":
      return (<svg viewBox="0 0 24 24" {...common}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill={C.gold} stroke="none" /></svg>);
    case "spark":
      return (<svg viewBox="0 0 24 24" {...common}><path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" stroke={C.violet} /></svg>);
    case "infinity":
      return (<svg viewBox="0 0 24 24" {...common} stroke={C.violet}><path d="M7 9a3 3 0 1 0 0 6c2 0 3-3 5-3s3 3 5 3a3 3 0 1 0 0-6c-2 0-3 3-5 3S9 9 7 9Z" /></svg>);
    case "alien":
      return (<svg viewBox="0 0 24 24" {...common} stroke={C.violet}><path d="M12 3c4 0 7 3 7 7 0 5-4 11-7 11S5 15 5 10c0-4 3-7 7-7Z" /><path d="M8 11c1 1.5 2 2 2 2M16 11c-1 1.5-2 2-2 2" /></svg>);
    case "shield":
      return (<svg viewBox="0 0 24 24" {...common}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" fill={C.gold} stroke={C.goldDim} /><path d="M9 12l2 2 4-4" stroke="#2a1c0a" /></svg>);
    case "planet":
      return (<svg viewBox="0 0 24 24" {...common} stroke={C.violet}><circle cx="12" cy="12" r="6" /><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-20 12 12)" /></svg>);
  }
}

/* ---- SMALL BUILDING BLOCKS --------------------------------------- */
function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 12, padding: 14, boxShadow: "0 0 8px rgba(168,85,247,0.25)", ...style }}>
      {children}
    </div>
  );
}

function SectionHead({ icon, title, color = C.gold }: { icon?: IconName; title: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      {icon && <Icon name={icon} />}
      <span style={{ color, fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</span>
    </div>
  );
}

function ZoomHint() {
  return (
    <span style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(12,7,28,0.7)", border: `1px solid ${C.panelBorder}` }}>
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
      </svg>
    </span>
  );
}

function ImagePlaceholder({ label, src, height = 110, onZoom }: { label: string; src?: string; height?: number; onZoom?: (src: string, label: string) => void }) {
  const zoomable = Boolean(src && onZoom);
  return (
    <div
      onClick={zoomable ? () => onZoom!(src as string, label) : undefined}
      title={zoomable ? "Click to zoom" : undefined}
      style={{ position: "relative", height, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.panelBorder}`, boxShadow: "0 0 8px rgba(168,85,247,0.25)", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", cursor: zoomable ? "zoom-in" : "default" }}
    >
      {src ? (
        <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: C.violetSoft, fontSize: 11, letterSpacing: "0.06em", opacity: 0.8 }}>image slot</span>
      )}
      {zoomable && <ZoomHint />}
      <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "5px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.ink, background: "linear-gradient(to top, rgba(10,5,24,0.92), rgba(10,5,24,0))" }}>{label}</span>
    </div>
  );
}

function LbBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${C.panelBorder}`, background: "transparent", color: C.gold, fontSize: 16, fontWeight: 800, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{label}</button>
  );
}

/* Full-screen zoom overlay: wheel / +- buttons to zoom, drag to pan,
 * double-click to toggle, Esc or click-out to close. */
function Lightbox({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const clamp = (s: number) => Math.min(6, Math.max(1, s));
  const setZoom = (next: number) => {
    const n = clamp(next);
    setScale(n);
    if (n === 1) setPos({ x: 0, y: 0 });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => {
        const n = clamp(s - e.deltaY * 0.0018 * s);
        if (n === 1) setPos({ x: 0, y: 0 });
        return n;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({ x: drag.current.ox + (e.clientX - drag.current.px), y: drag.current.oy + (e.clientY - drag.current.py) });
  };
  const onPointerUp = () => { drag.current = null; };

  return (
    <div
      ref={boxRef}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(5,3,14,0.93)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 28, overflow: "hidden" }}
    >
      <img
        src={src}
        alt={label}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={() => setZoom(scale > 1 ? 1 : 2.5)}
        draggable={false}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, transition: drag.current ? "none" : "transform 0.12s ease-out", cursor: scale > 1 ? "grab" : "zoom-in", userSelect: "none", touchAction: "none", filter: "drop-shadow(0 18px 60px rgba(0,0,0,0.7))" }}
      />

      <div style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", color: C.ink, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", pointerEvents: "none" }}>{label}</div>

      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 10, background: "rgba(18,11,38,0.85)", border: `1px solid ${C.panelBorder}`, borderRadius: 999, padding: "6px 12px" }}>
        <LbBtn label={"\u2212"} onClick={() => setZoom(scale - 0.5)} />
        <span style={{ color: C.inkDim, fontSize: 11, fontWeight: 700, minWidth: 40, textAlign: "center" }}>{Math.round(scale * 100)}%</span>
        <LbBtn label="+" onClick={() => setZoom(scale + 0.5)} />
      </div>

      <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close" style={{ position: "absolute", top: 14, right: 16, width: 34, height: 34, borderRadius: "50%", border: `1px solid ${C.panelBorder}`, background: "rgba(18,11,38,0.85)", color: C.ink, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>{"\u00d7"}</button>
    </div>
  );
}

function AttrBar({ value }: { value: number }) {
  const segs = 14;
  const filled = Math.round((value / 10) * segs);
  return (
    <div style={{ display: "flex", gap: 2, maxWidth: 140 }}>
      {Array.from({ length: segs }).map((_, i) => (
        <div key={i} style={{ flex: "1 1 0", minWidth: 0, height: 11, borderRadius: 1, background: i < filled ? C.gold : "rgba(120,100,180,0.22)", boxShadow: i < filled ? `0 0 4px ${C.gold}` : "none" }} />
      ))}
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={20} height={20} viewBox="0 0 24 24">
          <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.8 6.1 20.3l1.3-6.5L2.5 9.3l6.6-.8L12 2.5Z" fill={i < n ? C.gold : "rgba(120,100,180,0.25)"} stroke={i < n ? C.goldDim : "none"} strokeWidth={0.6} />
        </svg>
      ))}
    </span>
  );
}

function Brand({ arms = 64, mark = 150, gap = 6 }: { arms?: number; mark?: number; gap?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap }}>
      <img src={ARMS} alt="Alien Guitar Secrets coat of arms" style={{ width: arms, maxWidth: "100%", height: "auto", objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(120,70,200,0.45))" }} />
      <img src={WORDMARK} alt="Alien Guitar Secrets" style={{ width: mark, maxWidth: "100%", height: "auto", objectFit: "contain" }} />
    </div>
  );
}

/* ---- THE CARD ----------------------------------------------------- */
/* Shared card body — render any boss by passing the data object. */
export function BossCardBody({ boss }: { boss: Boss }) {
  const [zoom, setZoom] = useState<{ src: string; label: string } | null>(null);
  const openZoom = (src: string, label: string) => setZoom({ src, label });
  return (
    <div style={{ minHeight: "100vh", width: "100%", boxSizing: "border-box", display: "flex", justifyContent: "center", padding: "24px clamp(8px, 3vw, 16px)", background: "#000000", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 588,
          boxSizing: "border-box",
          color: C.ink,
          borderRadius: 18,
          padding: 16,
          background: "#000000",
          border: `1.5px solid rgba(168,85,247,0.8)`,
          boxShadow: "0 0 40px rgba(140,60,220,0.3), inset 0 0 0 1px rgba(168,85,247,0.15)",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: "center", marginBottom: 14 }}>
          <Brand arms={84} mark={224} />
          <div style={{ flex: "1 1 260px", textAlign: "right", minWidth: 0 }}>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontWeight: 800, lineHeight: 0.95 }}>
              {boss.name ? (
                <div style={{ fontSize: "clamp(26px, 7vw, 40px)", color: C.gold, textShadow: "0 2px 10px rgba(243,193,75,0.4)", overflowWrap: "break-word" }}>{boss.name}</div>
              ) : (
                <div style={{ fontSize: "clamp(22px, 6vw, 34px)", color: C.violetSoft, opacity: 0.55 }}>Boss Name</div>
              )}
              {boss.nameAccent && <div style={{ fontSize: "clamp(22px, 6vw, 32px)", color: C.violet, textShadow: "0 2px 12px rgba(180,140,255,0.45)", overflowWrap: "break-word" }}>{boss.nameAccent}</div>}
            </div>
            {boss.titles.length ? (
              boss.titles.map((t) => (
                <div key={t} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.inkDim }}>{t}</div>
              ))
            ) : (
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.violetSoft, opacity: 0.55, fontStyle: "italic" }}>Titles / roles</div>
            )}
          </div>
        </div>

        {/* HERO ROW: character art + planet/origin/quote */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12, marginBottom: 12 }}>
          <ImagePlaceholder label="Character Art" src={boss.heroImage} height={300} onZoom={openZoom} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Panel style={{ padding: 10 }}>
              <SectionHead icon="planet" title="Planet" color={C.violet} />
              {boss.planet ? (
                <div style={{ color: C.violet, fontWeight: 700, fontSize: 13, fontStyle: "italic" }}>{boss.planet}</div>
              ) : (
                <div style={{ color: C.violetSoft, opacity: 0.55, fontWeight: 700, fontSize: 13, fontStyle: "italic" }}>Home planet</div>
              )}
            </Panel>
            <Panel style={{ flex: 1, padding: 12 }}>
              <SectionHead title="Origin Story" color={C.gold} />
              {boss.originStory.length ? (
                boss.originStory.map((p, i) => (
                  <p key={i} style={{ fontSize: 11.5, lineHeight: 1.45, color: C.ink, margin: "0 0 7px" }}>{p}</p>
                ))
              ) : (
                <p style={{ fontSize: 11.5, lineHeight: 1.45, color: C.violetSoft, opacity: 0.55, fontStyle: "italic", margin: 0 }}>The boss&apos;s backstory — where they came from and how they earned their title.</p>
              )}
            </Panel>
          </div>
        </div>

        <Panel style={{ marginBottom: 12, borderColor: "rgba(243,193,75,0.4)" }}>
          {boss.quote ? (
            <p style={{ margin: 0, fontStyle: "italic", fontWeight: 700, fontSize: 14, color: C.gold, lineHeight: 1.4, textAlign: "center" }}>&ldquo;{boss.quote}&rdquo;</p>
          ) : (
            <p style={{ margin: 0, fontStyle: "italic", fontWeight: 700, fontSize: 13, color: C.violetSoft, opacity: 0.6, lineHeight: 1.4, textAlign: "center" }}>Signature quote</p>
          )}
        </Panel>

        {/* THREE STAT PANELS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: 10, marginBottom: 12 }}>
          {[boss.specialty, boss.specialAbility, boss.guardianPower].map((s, i) => (
            <Panel key={i}>
              <SectionHead icon={s.icon} title={s.title} color={i === 0 ? C.gold : C.violet} />
              {s.body ? (
                <p style={{ margin: 0, fontSize: 11, lineHeight: 1.4, color: C.inkDim }}>{s.body}</p>
              ) : (
                <p style={{ margin: 0, fontSize: 11, lineHeight: 1.4, color: C.violetSoft, opacity: 0.55, fontStyle: "italic" }}>Describe this power.</p>
              )}
            </Panel>
          ))}
        </div>

        {/* FUN FACTS / ATTRIBUTES / UNLOCK */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 165px), 1fr))", gap: 10, marginBottom: 12 }}>
          <Panel>
            <SectionHead icon="alien" title="Fun Facts" color={C.violet} />
            {boss.funFacts.length ? (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {boss.funFacts.map((f) => (
                  <li key={f} style={{ fontSize: 10.5, lineHeight: 1.4, color: C.inkDim, marginBottom: 5 }}>{f}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.4, color: C.violetSoft, opacity: 0.55, fontStyle: "italic" }}>A few quirky facts about this boss.</p>
            )}
          </Panel>
          <Panel>
            <SectionHead title="Attributes" color={C.gold} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {boss.attributes.map((a) => (
                <div key={a.label}>
                  <div style={{ fontSize: 9.5, letterSpacing: "0.05em", textTransform: "uppercase", color: C.inkDim, marginBottom: 3 }}>{a.label}</div>
                  <AttrBar value={a.value} />
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <SectionHead icon="shield" title="Unlock Requirement" color={C.gold} />
            {boss.unlock.text ? (
              <p style={{ margin: "0 0 10px", fontSize: 11, lineHeight: 1.4, color: C.ink }}>{boss.unlock.text}</p>
            ) : (
              <p style={{ margin: "0 0 10px", fontSize: 11, lineHeight: 1.4, color: C.violetSoft, opacity: 0.55, fontStyle: "italic" }}>How players unlock this boss.</p>
            )}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "radial-gradient(circle, rgba(243,193,75,0.25), transparent)" }}>
                <Icon name="shield" />
              </div>
            </div>
          </Panel>
        </div>

        {/* DIFFICULTY */}
        <Panel style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
          <span style={{ color: C.gold, fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>Difficulty</span>
          <Stars n={boss.difficulty} />
          {boss.difficultyTagline ? (
            <span style={{ marginLeft: "auto", color: C.violet, fontSize: 11, fontStyle: "italic", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right" }}>{boss.difficultyTagline}</span>
          ) : (
            <span style={{ marginLeft: "auto", color: C.violetSoft, opacity: 0.55, fontSize: 11, fontStyle: "italic", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right" }}>Difficulty tagline</span>
          )}
        </Panel>

        {/* GALLERY */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${boss.gallery.length}, 1fr)`, gap: 8, marginBottom: 12 }}>
          {boss.gallery.map((g) => (
            <ImagePlaceholder key={g.label} label={g.label} src={g.src} height={120} onZoom={openZoom} />
          ))}
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
          <Brand arms={152} mark={152} />
          <div style={{ flex: "1 1 200px", textAlign: "right", minWidth: 0 }}>
            <img src={FRETBOARD_LOGO} alt="Mentor in Fretboard Universe" style={{ width: "100%", maxWidth: 360, height: "auto", objectFit: "contain", marginLeft: "auto", display: "block", filter: "drop-shadow(0 0 12px rgba(120,70,200,0.4))" }} />
          </div>
        </div>
      </div>
      {zoom && <Lightbox src={zoom.src} label={zoom.label} onClose={() => setZoom(null)} />}
    </div>
  );
}

/* Blank template — every slot shows a placeholder to fill in. */
export function BossCard() {
  return <BossCardBody boss={TEMPLATE_BOSS} />;
}

/* Ingvar — the fully populated example card. */
export function IngvarCard() {
  return <BossCardBody boss={INGVAR} />;
}
