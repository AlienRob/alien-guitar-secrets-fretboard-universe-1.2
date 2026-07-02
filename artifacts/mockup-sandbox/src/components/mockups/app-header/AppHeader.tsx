/**
 * Mockup: Redesigned AGS mobile home header
 *
 * Two states shown side-by-side:
 *   Left  — default (no name set) → "Welcome back, Guest"
 *   Right — after avatar name set  → "Welcome back, Rob"
 *
 * Design changes from previous:
 * - AGS horizontal logo fills the full phone width
 * - "FRETBOARD UNIVERSE" in luminescent grey-green below the logo
 * - No "MISSION CONTROL" kicker
 * - Greeting uses player displayName, falls back to "Guest"
 */
import React from "react";

import coatOfArms from "@/assets/coat-of-arms.png";
import agsWordmark from "@/assets/ags-wordmark.png";

// Load Rajdhani Bold — technical, wide, very legible at all sizes
const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap";
if (!document.head.querySelector('link[href*="Rajdhani"]')) {
  document.head.appendChild(FONT_LINK);
}

const GOLD = "#ffcf5a";
const BG = "#050816";

// Luminescent grey-green — soft neon mint, legible on dark
const FU_COLOR = "#b8ffd4";
const FU_GLOW = "0 0 10px rgba(150,255,190,0.75), 0 0 28px rgba(100,220,150,0.35)";

const SPACE_BG: React.CSSProperties = {
  background: `
    radial-gradient(ellipse at 20% 0%, rgba(106,0,255,0.20) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 10%, rgba(0,191,255,0.10) 0%, transparent 50%),
    ${BG}
  `,
};

function Stars() {
  const pts = [
    { x: 15, y: 20 }, { x: 62, y: 9 }, { x: 130, y: 24 }, { x: 220, y: 7 },
    { x: 310, y: 16 }, { x: 368, y: 22 }, { x: 80, y: 38 }, { x: 350, y: 40 },
    { x: 185, y: 33 }, { x: 270, y: 29 }, { x: 45, y: 54 }, { x: 330, y: 58 },
  ];
  return (
    <svg
      width="390" height="70"
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y}
          r={i % 3 === 0 ? 1.2 : 0.75}
          fill="white"
          opacity={0.45 + (i % 4) * 0.12}
        />
      ))}
    </svg>
  );
}

function PhoneCard({ displayName }: { displayName: string }) {
  const isGuest = !displayName || displayName === "Guest";

  return (
    <div style={{
      width: 390,
      padding: "52px 0 22px",
      position: "relative",
      overflow: "hidden",
      ...SPACE_BG,
    }}>
      <Stars />

      {/* Coat of arms — centred above the wordmark */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
        <img
          src={coatOfArms}
          alt=""
          style={{
            width: 100,
            height: 100,
            objectFit: "contain",
            filter: "drop-shadow(0 0 16px rgba(130,60,255,0.6))",
          }}
        />
      </div>

      {/* Alien Guitar Secrets wordmark — centred, full width */}
      <div style={{ display: "flex", justifyContent: "center", paddingLeft: 12, paddingRight: 12 }}>
        <img
          src={agsWordmark}
          alt="Alien Guitar Secrets"
          style={{
            width: "100%",
            height: "auto",
            filter: "drop-shadow(0 0 10px rgba(255,207,90,0.4))",
          }}
        />
      </div>

      {/* FRETBOARD UNIVERSE — luminescent grey-green */}
      <div style={{
        textAlign: "center",
        marginTop: 14,
        marginBottom: 22,
        letterSpacing: "0.18em",
        fontSize: 23,
        fontWeight: 700,
        fontFamily: "'Rajdhani', 'Barlow Condensed', 'Arial Narrow', Arial, system-ui",
        textTransform: "uppercase",
        color: FU_COLOR,
        textShadow: FU_GLOW,
      }}>
        Fretboard Universe
      </div>

      {/* Thin gold separator */}
      <div style={{
        height: 1,
        margin: "0 20px 18px",
        background: "linear-gradient(90deg, transparent, rgba(255,207,90,0.35), transparent)",
      }} />

      {/* Greeting */}
      <div style={{ paddingLeft: 20, paddingRight: 20 }}>
        <p style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 700,
          color: "white",
          fontFamily: "system-ui",
          lineHeight: 1.2,
        }}>
          Welcome back,{" "}
          <span style={{ color: isGuest ? "rgba(255,255,255,0.45)" : GOLD }}>
            {displayName || "Guest"}
          </span>
        </p>
        {isGuest && (
          <p style={{
            margin: "5px 0 0",
            fontSize: 12,
            color: "rgba(255,255,255,0.38)",
            fontFamily: "system-ui",
          }}>
            Set your name in the Avatar tab
          </p>
        )}
      </div>

      {/* Belt card */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 18 }}>
        <div style={{
          borderRadius: 14,
          border: "1px solid rgba(106,0,255,0.4)",
          background: "linear-gradient(135deg, rgba(106,0,255,0.22), rgba(0,191,255,0.08))",
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 9.5, letterSpacing: "0.18em", color: "rgba(255,255,255,0.45)", fontFamily: "system-ui" }}>
                CURRENT RANK
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 17, fontWeight: 700, color: "white", fontFamily: "system-ui" }}>
                White Belt
              </p>
            </div>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#e8e8f0", boxShadow: "0 0 8px rgba(232,232,240,0.5)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "white", fontFamily: "system-ui" }}>Level 1</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "system-ui" }}>0 / 250 XP</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
            <div style={{ width: "6%", height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #6a00ff, #00bfff)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppHeader() {
  return (
    <div style={{
      display: "flex",
      gap: 32,
      padding: 32,
      background: "#111",
      fontFamily: "system-ui",
      alignItems: "flex-start",
    }}>
      <div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Default — no name set
        </p>
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          <PhoneCard displayName="Guest" />
        </div>
      </div>

      <div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.15em" }}>
          After setting avatar name
        </p>
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          <PhoneCard displayName="Rob" />
        </div>
      </div>
    </div>
  );
}
