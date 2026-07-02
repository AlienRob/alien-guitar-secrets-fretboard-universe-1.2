/**
 * Native (iOS / Android) fallback for the 3D guitar viewer.
 *
 * three / @react-three/fiber / @react-three/drei contain browser WebGL code
 * that crashes the Hermes bytecode compiler during iOS production bundling.
 * Metro picks this .native.tsx file for iOS/Android and uses the full
 * guitar-model-3d.tsx (with Three.js) for the web preview only.
 */
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";

interface Props {
  model: string;
  photoFallback?: ImageSourcePropType | null;
}

export default function GuitarModel3D({ photoFallback }: Props) {
  return (
    <View style={styles.root}>
      {photoFallback ? (
        <Image source={photoFallback} style={styles.photo} resizeMode="contain" />
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.hint}>3D view available in the web preview</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  photo: {
    width: "80%",
    height: "70%",
  },
  placeholder: {
    width: 200,
    height: 300,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
  },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },
});
