/**
 * Semantic design tokens for the Alien Guitar Secrets mobile app.
 *
 * These mirror the cosmic dark palette of the sibling web app
 * (artifacts/ags-fretboard/src/index.css), converted from HSL to hex so both
 * artifacts share one visual identity. The app is always dark (cosmic), so the
 * same palette is used for both light and dark device schemes.
 */

const cosmic = {
  // Legacy aliases (kept for backward compatibility)
  text: "#ffffff",
  tint: "#6a00ff",

  // Core surfaces
  background: "#050816",
  foreground: "#ffffff",

  // Cards / elevated surfaces
  card: "#0a1124",
  cardForeground: "#ffffff",

  // Primary action color (buttons, active states) — vivid purple
  primary: "#6a00ff",
  primaryForeground: "#ffffff",

  // Secondary — electric cyan
  secondary: "#00bfff",
  secondaryForeground: "#ffffff",

  // Muted / subdued elements
  muted: "#0e163e",
  mutedForeground: "#a8aec8",

  // Accent highlights — alien teal
  accent: "#00ffd5",
  accentForeground: "#050816",

  // Destructive actions
  destructive: "#ff3b30",
  destructiveForeground: "#ffffff",

  // Borders and input outlines
  border: "#2a1a66",
  input: "#1a1040",

  // Brand note colors (match web --root-note etc.)
  rootNote: "#ff2d55",
  scaleNote: "#00ffd5",
  chordTone: "#ffd700",
  correct: "#00ff66",
  incorrect: "#ff3b30",
};

const colors = {
  // The app is always cosmic-dark, so the same palette serves every scheme.
  light: cosmic,

  // Border radius (in px).
  radius: 14,
};

export default colors;
