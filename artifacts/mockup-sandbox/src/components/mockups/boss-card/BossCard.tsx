import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  nameAccent?: string;
  titles: string[];
  planet: string;
  heroImage?: string;
  originStory: string[];
  quote: string;
  specialty: StatPanel;
  specialAbility: StatPanel;
  guardianPower: StatPanel;
  funFacts: string[];
  attributes: Attribute[];
  unlock: { text: string };
  difficulty: number; // 1–5
  difficultyTagline: string;
  gallery: ImageSlot[];
  /** Hex colour for borders, glows, and accent text. Default: #b48cff */
  accentColor?: string;
  /** Override the hero image height (default 300). */
  heroHeight?: number;
  /** Scale the hero image up inside its container (default 1). Use to zoom a small figure. */
  heroScale?: number;
  /** Shift the hero image vertically in pre-scale pixels. Negative = move up. */
  heroOffsetY?: number;
};

/* ---- BLANK TEMPLATE ----------------------------------------------- */
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

/* ---- FIXED PALETTE (non-accent colours) --------------------------- */
const C = {
  gold: "#f3c14b",
  goldDim: "#caa23a",
  ink: "#ece8ff",
  inkDim: "#a39ccf",
  panel: "#000000",
};

/* ---- ACCENT SYSTEM ------------------------------------------------
 * Each card carries its own accent derived from boss.accentColor.
 * The context is consumed by all child components so you only set it once.
 * ------------------------------------------------------------------ */
type Accent = {
  color: string;        // full hex
  soft: string;         // rgba at ~60% — used for placeholder text
  border: string;       // rgba at ~55% — panel borders
  borderBright: string; // rgba at ~80% — outer card border
  glowSm: string;       // rgba at ~15% — panel inner glow
  glowLg: string;       // rgba at ~25% — card outer glow
};

function parseHex(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace("#", "").trim();
  const expanded = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const n = parseInt(expanded, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function makeAccent(hex = "#b48cff"): Accent {
  const { r, g, b } = parseHex(hex);
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
  return {
    color: hex,
    soft: rgba(0.6),
    border: rgba(0.45),
    borderBright: rgba(0.8),
    glowSm: rgba(0.15),
    glowLg: rgba(0.25),
  };
}

const DEFAULT_ACCENT = makeAccent("#b48cff");
const AccentCtx = createContext<Accent>(DEFAULT_ACCENT);
const useAccent = () => useContext(AccentCtx);

/* ---- ICONS (inline SVG) ------------------------------------------ */
function Icon({ name }: { name: IconName }) {
  const A = useAccent();
  const common = { width: 22, height: 22, fill: "none", stroke: C.gold, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "bolt":
      return (<svg viewBox="0 0 24 24" {...common}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill={C.gold} stroke="none" /></svg>);
    case "spark":
      return (<svg viewBox="0 0 24 24" {...common}><path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" stroke={A.color} /></svg>);
    case "infinity":
      return (<svg viewBox="0 0 24 24" {...common} stroke={A.color}><path d="M7 9a3 3 0 1 0 0 6c2 0 3-3 5-3s3 3 5 3a3 3 0 1 0 0-6c-2 0-3 3-5 3S9 9 7 9Z" /></svg>);
    case "alien":
      return (<svg viewBox="0 0 24 24" {...common} stroke={A.color}><path d="M12 3c4 0 7 3 7 7 0 5-4 11-7 11S5 15 5 10c0-4 3-7 7-7Z" /><path d="M8 11c1 1.5 2 2 2 2M16 11c-1 1.5-2 2-2 2" /></svg>);
    case "shield":
      return (<svg viewBox="0 0 24 24" {...common}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" fill={C.gold} stroke={C.goldDim} /><path d="M9 12l2 2 4-4" stroke="#2a1c0a" /></svg>);
    case "planet":
      return (<svg viewBox="0 0 24 24" {...common} stroke={A.color}><circle cx="12" cy="12" r="6" /><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-20 12 12)" /></svg>);
  }
}

/* ---- BUILDING BLOCKS --------------------------------------------- */
function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const A = useAccent();
  return (
    <div style={{ background: C.panel, border: `1px solid ${A.border}`, borderRadius: 12, padding: 14, boxShadow: `inset 0 0 24px ${A.glowSm}`, ...style }}>
      {children}
    </div>
  );
}

function SectionHead({ icon, title, color }: { icon?: IconName; title: string; color?: string }) {
  const A = useAccent();
  const resolved = color ?? A.color;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      {icon && <Icon name={icon} />}
      <span style={{ color: resolved, fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</span>
    </div>
  );
}

function ZoomHint() {
  const A = useAccent();
  return (
    <span style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(12,7,28,0.7)", border: `1px solid ${A.border}` }}>
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
      </svg>
    </span>
  );
}

function ImagePlaceholder({ label, src, height = 110, scale = 1, offsetY = 0, onZoom }: { label: string; src?: string; height?: number; scale?: number; offsetY?: number; onZoom?: (src: string, label: string) => void }) {
  const A = useAccent();
  const zoomable = Boolean(src && onZoom);
  return (
    <div
      onClick={zoomable ? () => onZoom!(src as string, label) : undefined}
      title={zoomable ? "Click to zoom" : undefined}
      style={{ position: "relative", height, borderRadius: 10, overflow: "hidden", border: `1px solid ${A.border}`, background: src ? "transparent" : "radial-gradient(circle at 50% 35%, rgba(90,60,160,0.4), rgba(15,8,32,0.95))", display: "flex", alignItems: "center", justifyContent: "center", cursor: zoomable ? "zoom-in" : "default" }}
    >
      {src ? (
        <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "contain", transform: (scale !== 1 || offsetY !== 0) ? `translateY(${offsetY}px) scale(${scale})` : undefined, transformOrigin: "center center" }} />
      ) : (
        <span style={{ color: A.soft, fontSize: 11, letterSpacing: "0.06em", opacity: 0.8 }}>image slot</span>
      )}
      {zoomable && <ZoomHint />}
      <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "5px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.ink, background: "linear-gradient(to top, rgba(10,5,24,0.92), rgba(10,5,24,0))" }}>{label}</span>
    </div>
  );
}

function LbBtn({ label, onClick }: { label: string; onClick: () => void }) {
  const A = useAccent();
  return (
    <button onClick={onClick} style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${A.border}`, background: "transparent", color: C.gold, fontSize: 16, fontWeight: 800, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{label}</button>
  );
}

/* Full-screen zoom overlay */
function Lightbox({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  const A = useAccent();
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
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 10, background: "rgba(18,11,38,0.85)", border: `1px solid ${A.border}`, borderRadius: 999, padding: "6px 12px" }}>
        <LbBtn label={"\u2212"} onClick={() => setZoom(scale - 0.5)} />
        <span style={{ color: C.inkDim, fontSize: 11, fontWeight: 700, minWidth: 40, textAlign: "center" }}>{Math.round(scale * 100)}%</span>
        <LbBtn label="+" onClick={() => setZoom(scale + 0.5)} />
      </div>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close" style={{ position: "absolute", top: 14, right: 16, width: 34, height: 34, borderRadius: "50%", border: `1px solid ${A.border}`, background: "rgba(18,11,38,0.85)", color: C.ink, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>{"\u00d7"}</button>
    </div>
  );
}

function AttrBar({ value }: { value: number }) {
  const segs = 14;
  const filled = Math.round((value / 10) * segs);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: segs }).map((_, i) => (
        <div key={i} style={{ width: 7, height: 11, borderRadius: 1, background: i < filled ? C.gold : "rgba(120,100,180,0.22)", boxShadow: i < filled ? `0 0 4px ${C.gold}` : "none" }} />
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

const ARMS = "/__mockup/images/ags-coat-of-arms.png";
const WORDMARK = "/__mockup/images/ags-wordmark-2026.png";
const FRETBOARD_LOGO = "/__mockup/images/fretboard-universe-logo.png";

function Brand({ arms = 64, mark = 150, gap = 6 }: { arms?: number; mark?: number; gap?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap }}>
      <img src={ARMS} alt="Alien Guitar Secrets coat of arms" style={{ width: arms, height: "auto", objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(120,70,200,0.45))" }} />
      <img src={WORDMARK} alt="Alien Guitar Secrets" style={{ width: mark, height: "auto", objectFit: "contain" }} />
    </div>
  );
}

/* ---- THE CARD ----------------------------------------------------- */
export function BossCardBody({ boss }: { boss: Boss }) {
  const A = makeAccent(boss.accentColor ?? "#b48cff");
  const [zoom, setZoom] = useState<{ src: string; label: string } | null>(null);
  const openZoom = (src: string, label: string) => setZoom({ src, label });

  return (
    <AccentCtx.Provider value={A}>
      <div style={{ minHeight: "100vh", width: "100%", display: "flex", justifyContent: "center", padding: "24px 16px", background: "#000000", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div
          style={{
            width: 588,
            color: C.ink,
            borderRadius: 18,
            padding: 16,
            background: "#000000",
            border: `1.5px solid ${A.borderBright}`,
            boxShadow: `0 0 40px ${A.glowLg}, inset 0 0 0 1px ${A.glowSm}`,
          }}
        >
          {/* HEADER */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <Brand arms={84} mark={224} />
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontWeight: 800, lineHeight: 0.95 }}>
                {boss.name ? (
                  <div style={{ fontSize: 40, color: C.gold, textShadow: "0 2px 10px rgba(243,193,75,0.4)" }}>{boss.name}</div>
                ) : (
                  <div style={{ fontSize: 34, color: A.soft, opacity: 0.55 }}>Boss Name</div>
                )}
                {boss.nameAccent && <div style={{ fontSize: 32, color: A.color, textShadow: `0 2px 12px ${A.glowLg}` }}>{boss.nameAccent}</div>}
              </div>
              {boss.titles.length ? (
                boss.titles.map((t) => (
                  <div key={t} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.inkDim }}>{t}</div>
                ))
              ) : (
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: A.soft, opacity: 0.55, fontStyle: "italic" }}>Titles / roles</div>
              )}
            </div>
          </div>

          {/* HERO ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <ImagePlaceholder label="Character Art" src={boss.heroImage} height={boss.heroHeight ?? 300} scale={boss.heroScale ?? 1} offsetY={boss.heroOffsetY ?? 0} onZoom={openZoom} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Panel style={{ padding: 10 }}>
                <SectionHead icon="planet" title="Planet" color={A.color} />
                {boss.planet ? (
                  <div style={{ color: A.color, fontWeight: 700, fontSize: 13, fontStyle: "italic" }}>{boss.planet}</div>
                ) : (
                  <div style={{ color: A.soft, opacity: 0.55, fontWeight: 700, fontSize: 13, fontStyle: "italic" }}>Home planet</div>
                )}
              </Panel>
              <Panel style={{ flex: 1, padding: 12 }}>
                <SectionHead title="Origin Story" color={C.gold} />
                {boss.originStory.length ? (
                  boss.originStory.map((p, i) => (
                    <p key={i} style={{ fontSize: 11.5, lineHeight: 1.45, color: C.ink, margin: "0 0 7px" }}>{p}</p>
                  ))
                ) : (
                  <p style={{ fontSize: 11.5, lineHeight: 1.45, color: A.soft, opacity: 0.55, fontStyle: "italic", margin: 0 }}>The boss&apos;s backstory — where they came from and how they earned their title.</p>
                )}
              </Panel>
            </div>
          </div>

          <Panel style={{ marginBottom: 12, borderColor: "rgba(243,193,75,0.4)" }}>
            {boss.quote ? (
              <p style={{ margin: 0, fontStyle: "italic", fontWeight: 700, fontSize: 14, color: C.gold, lineHeight: 1.4, textAlign: "center" }}>&ldquo;{boss.quote}&rdquo;</p>
            ) : (
              <p style={{ margin: 0, fontStyle: "italic", fontWeight: 700, fontSize: 13, color: A.soft, opacity: 0.6, lineHeight: 1.4, textAlign: "center" }}>Signature quote</p>
            )}
          </Panel>

          {/* THREE STAT PANELS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
            {[boss.specialty, boss.specialAbility, boss.guardianPower].map((s, i) => (
              <Panel key={i}>
                <SectionHead icon={s.icon} title={s.title} color={i === 0 ? C.gold : A.color} />
                {s.body ? (
                  <p style={{ margin: 0, fontSize: 11, lineHeight: 1.4, color: C.inkDim }}>{s.body}</p>
                ) : (
                  <p style={{ margin: 0, fontSize: 11, lineHeight: 1.4, color: A.soft, opacity: 0.55, fontStyle: "italic" }}>Describe this power.</p>
                )}
              </Panel>
            ))}
          </div>

          {/* FUN FACTS / ATTRIBUTES / UNLOCK */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <Panel>
              <SectionHead icon="alien" title="Fun Facts" color={A.color} />
              {boss.funFacts.length ? (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {boss.funFacts.map((f) => (
                    <li key={f} style={{ fontSize: 10.5, lineHeight: 1.4, color: C.inkDim, marginBottom: 5 }}>{f}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.4, color: A.soft, opacity: 0.55, fontStyle: "italic" }}>A few quirky facts about this boss.</p>
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
                <p style={{ margin: "0 0 10px", fontSize: 11, lineHeight: 1.4, color: A.soft, opacity: 0.55, fontStyle: "italic" }}>How players unlock this boss.</p>
              )}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "radial-gradient(circle, rgba(243,193,75,0.25), transparent)" }}>
                  <Icon name="shield" />
                </div>
              </div>
            </Panel>
          </div>

          {/* DIFFICULTY */}
          <Panel style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ color: C.gold, fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>Difficulty</span>
            <Stars n={boss.difficulty} />
            {boss.difficultyTagline ? (
              <span style={{ marginLeft: "auto", color: A.color, fontSize: 11, fontStyle: "italic", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right" }}>{boss.difficultyTagline}</span>
            ) : (
              <span style={{ marginLeft: "auto", color: A.soft, opacity: 0.55, fontSize: 11, fontStyle: "italic", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right" }}>Difficulty tagline</span>
            )}
          </Panel>

          {/* GALLERY */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${boss.gallery.length},1fr)`, gap: 8, marginBottom: 12 }}>
            {boss.gallery.map((g) => (
              <ImagePlaceholder key={g.label} label={g.label} src={g.src} height={120} onZoom={openZoom} />
            ))}
          </div>

          {/* FOOTER */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center", paddingTop: 4 }}>
            <Brand arms={52} mark={152} />
            <div style={{ textAlign: "right" }}>
              <img src={FRETBOARD_LOGO} alt="Mentor in Fretboard Universe" style={{ width: "100%", maxWidth: 250, height: "auto", objectFit: "contain", marginLeft: "auto", display: "block", filter: "drop-shadow(0 0 12px rgba(120,70,200,0.4))" }} />
            </div>
          </div>
        </div>

        {zoom && <Lightbox src={zoom.src} label={zoom.label} onClose={() => setZoom(null)} />}
      </div>
    </AccentCtx.Provider>
  );
}

export function BossCard() {
  return <BossCardBody boss={TEMPLATE_BOSS} />;
}
