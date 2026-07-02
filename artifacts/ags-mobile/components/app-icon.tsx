/**
 * AppIcon — inline SVG icons that work on all platforms including Android.
 * Replaces @expo/vector-icons/Feather which fails to load its font on Android
 * in Expo Go. Add new icons here as needed; keep the same viewBox (0 0 24 24).
 */
import React from "react";
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from "react-native-svg";

export type AppIconName =
  | "book-open"
  | "compass"
  | "layers"
  | "git-commit"
  | "map-pin"
  | "trending-up"
  | "headphones"
  | "mic"
  | "play"
  | "chevron-right"
  | "arrow-left"
  | "arrow-right"
  | "zap"
  | "target"
  | "award"
  | "x"
  | "x-circle"
  | "check-circle"
  | "alert-circle"
  | "info"
  | "refresh-cw"
  | "rotate-ccw"
  | "globe"
  | "lock"
  | "music"
  | "star"
  | "zoom-in"
  | "skip-forward"
  | "square"
  | "smartphone"
  | "crosshair"
  | "grid"
  | "sliders"
  | "search"
  | "volume-2"
  | "volume-x";

interface Props {
  name: AppIconName;
  size?: number;
  color?: string;
}

export function AppIcon({ name, size = 24, color = "#fff" }: Props) {
  const s = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };
  const vb = "0 0 24 24";

  switch (name) {
    case "book-open":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" {...s} />
          <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" {...s} />
        </Svg>
      );
    case "compass":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" {...s} />
        </Svg>
      );
    case "layers":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polygon points="12 2 2 7 12 12 22 7 12 2" {...s} />
          <Polyline points="2 17 12 22 22 17" {...s} />
          <Polyline points="2 12 12 17 22 12" {...s} />
        </Svg>
      );
    case "git-commit":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="12" cy="12" r="4" {...s} />
          <Line x1="1.05" y1="12" x2="7" y2="12" {...s} />
          <Line x1="17.01" y1="12" x2="22.96" y2="12" {...s} />
        </Svg>
      );
    case "map-pin":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" {...s} />
          <Circle cx="12" cy="10" r="3" {...s} />
        </Svg>
      );
    case "trending-up":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" {...s} />
          <Polyline points="17 6 23 6 23 12" {...s} />
        </Svg>
      );
    case "headphones":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Path d="M3 18v-6a9 9 0 0 1 18 0v6" {...s} />
          <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" {...s} />
          <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" {...s} />
        </Svg>
      );
    case "mic":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" {...s} />
          <Path d="M19 10v2a7 7 0 0 1-14 0v-2" {...s} />
          <Line x1="12" y1="19" x2="12" y2="23" {...s} />
          <Line x1="8" y1="23" x2="16" y2="23" {...s} />
        </Svg>
      );
    case "play":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polygon points="5 3 19 12 5 21 5 3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={color} />
        </Svg>
      );
    case "chevron-right":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polyline points="9 18 15 12 9 6" {...s} />
        </Svg>
      );
    case "arrow-left":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Line x1="19" y1="12" x2="5" y2="12" {...s} />
          <Polyline points="12 19 5 12 12 5" {...s} />
        </Svg>
      );
    case "zap":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={color} />
        </Svg>
      );
    case "target":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Circle cx="12" cy="12" r="6" {...s} />
          <Circle cx="12" cy="12" r="2" {...s} />
        </Svg>
      );
    case "award":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="12" cy="8" r="7" {...s} />
          <Polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" {...s} />
        </Svg>
      );
    case "x":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Line x1="18" y1="6" x2="6" y2="18" {...s} />
          <Line x1="6" y1="6" x2="18" y2="18" {...s} />
        </Svg>
      );
    case "info":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Line x1="12" y1="8" x2="12" y2="12" {...s} />
          <Line x1="12" y1="16" x2="12.01" y2="16" {...s} />
        </Svg>
      );
    case "refresh-cw":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polyline points="23 4 23 10 17 10" {...s} />
          <Polyline points="1 20 1 14 7 14" {...s} />
          <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" {...s} />
        </Svg>
      );
    case "rotate-ccw":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polyline points="1 4 1 10 7 10" {...s} />
          <Path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" {...s} />
        </Svg>
      );
    case "arrow-right":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Line x1="5" y1="12" x2="19" y2="12" {...s} />
          <Polyline points="12 5 19 12 12 19" {...s} />
        </Svg>
      );
    case "check-circle":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" {...s} />
          <Polyline points="22 4 12 14.01 9 11.01" {...s} />
        </Svg>
      );
    case "x-circle":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Line x1="15" y1="9" x2="9" y2="15" {...s} />
          <Line x1="9" y1="9" x2="15" y2="15" {...s} />
        </Svg>
      );
    case "alert-circle":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Line x1="12" y1="8" x2="12" y2="12" {...s} />
          <Line x1="12" y1="16" x2="12.01" y2="16" {...s} />
        </Svg>
      );
    case "globe":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Line x1="2" y1="12" x2="22" y2="12" {...s} />
          <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" {...s} />
        </Svg>
      );
    case "lock":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" {...s} />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" {...s} />
        </Svg>
      );
    case "music":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Path d="M9 18V5l12-2v13" {...s} />
          <Circle cx="6" cy="18" r="3" {...s} />
          <Circle cx="18" cy="16" r="3" {...s} />
        </Svg>
      );
    case "star":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={color} />
        </Svg>
      );
    case "zoom-in":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="11" cy="11" r="8" {...s} />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" {...s} />
          <Line x1="11" y1="8" x2="11" y2="14" {...s} />
          <Line x1="8" y1="11" x2="14" y2="11" {...s} />
        </Svg>
      );
    case "skip-forward":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polygon points="5 4 15 12 5 20 5 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={color} />
          <Line x1="19" y1="5" x2="19" y2="19" {...s} />
        </Svg>
      );
    case "square":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" {...s} />
        </Svg>
      );
    case "smartphone":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" {...s} />
          <Line x1="12" y1="18" x2="12.01" y2="18" {...s} />
        </Svg>
      );
    case "crosshair":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Line x1="22" y1="12" x2="18" y2="12" {...s} />
          <Line x1="6" y1="12" x2="2" y2="12" {...s} />
          <Line x1="12" y1="6" x2="12" y2="2" {...s} />
          <Line x1="12" y1="22" x2="12" y2="18" {...s} />
        </Svg>
      );
    case "grid":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Rect x="3" y="3" width="7" height="7" {...s} />
          <Rect x="14" y="3" width="7" height="7" {...s} />
          <Rect x="14" y="14" width="7" height="7" {...s} />
          <Rect x="3" y="14" width="7" height="7" {...s} />
        </Svg>
      );
    case "sliders":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Line x1="4" y1="21" x2="4" y2="14" {...s} />
          <Line x1="4" y1="10" x2="4" y2="3" {...s} />
          <Line x1="12" y1="21" x2="12" y2="12" {...s} />
          <Line x1="12" y1="8" x2="12" y2="3" {...s} />
          <Line x1="20" y1="21" x2="20" y2="16" {...s} />
          <Line x1="20" y1="12" x2="20" y2="3" {...s} />
          <Line x1="1" y1="14" x2="7" y2="14" {...s} />
          <Line x1="9" y1="8" x2="15" y2="8" {...s} />
          <Line x1="17" y1="16" x2="23" y2="16" {...s} />
        </Svg>
      );
    case "search":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Circle cx="11" cy="11" r="8" {...s} />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" {...s} />
        </Svg>
      );
    case "volume-2":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" {...s} />
          <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" {...s} />
          <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" {...s} />
        </Svg>
      );
    case "volume-x":
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" {...s} />
          <Line x1="23" y1="9" x2="17" y2="15" {...s} />
          <Line x1="17" y1="9" x2="23" y2="15" {...s} />
        </Svg>
      );
    default:
      return null;
  }
}
