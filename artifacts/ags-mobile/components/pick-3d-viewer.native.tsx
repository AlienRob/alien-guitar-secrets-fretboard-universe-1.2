/**
 * pick-3d-viewer.native.tsx — iOS / Android fallback.
 *
 * three / @react-three/fiber / @react-three/drei contain browser WebGL code
 * that crashes the Hermes bytecode compiler during iOS production bundling.
 * Metro picks this .native.tsx file for iOS/Android and uses the full
 * pick-3d-viewer.tsx (with Three.js) for the web preview only.
 *
 * Shows the flat 2D SVG pick art at a generous size so the zoom card still
 * looks great on device — the 3D spin is a web-preview bonus.
 */
import React from "react";
import { View } from "react-native";

import type { GearItem } from "@/lib/gear";
import { PickRender } from "./pick-render";

export default function Pick3DViewer({
  item,
  style,
}: {
  item: GearItem;
  style?: object;
}) {
  return (
    <View
      style={[
        { flex: 1, width: "100%", alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <PickRender item={item} size={150} />
    </View>
  );
}
