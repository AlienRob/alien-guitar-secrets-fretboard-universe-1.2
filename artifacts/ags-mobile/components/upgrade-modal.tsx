import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

const FEATURES = [
  "All instruments (guitar, bass, uke)",
  "All string counts & alternate tunings",
  "Adjustable A4 reference pitch (430–450 Hz)",
  "All time signatures (1–12 beats)",
  "Subdivisions & accent beat control",
  "Per-beat muting",
  "Full colour theme library",
];

export function UpgradeModal({ visible, onClose, feature }: UpgradeModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
          <LinearGradient colors={["#1e0a38", "#0c0c1e"]} style={styles.card}>
            <Text style={styles.lockGlyph}>🔒</Text>
            <Text style={styles.title}>PRECISION LABS PRO</Text>
            <Text style={styles.sub}>Included with Fretboard Universe Premium</Text>
            {feature ? (
              <View style={styles.featureChip}>
                <Text style={styles.featureChipText}>{feature}</Text>
              </View>
            ) : null}
            <View style={styles.divider} />
            <Text style={styles.listHead}>PREMIUM INCLUDES</Text>
            {FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.bullet}>✦</Text>
                <Text style={styles.featureItem}>{f}</Text>
              </View>
            ))}
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Got it</Text>
            </Pressable>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.80)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cardWrap: { width: "100%", maxWidth: 340 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(185,66,255,0.35)",
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  lockGlyph: { fontSize: 32 },
  title: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3,
    color: "rgba(185,66,255,0.9)",
    textAlign: "center",
  },
  sub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  featureChip: {
    backgroundColor: "rgba(185,66,255,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(185,66,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 2,
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(185,66,255,0.8)",
    letterSpacing: 1,
  },
  divider: {
    width: "80%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 4,
  },
  listHead: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.5,
    color: "rgba(255,255,255,0.3)",
    alignSelf: "flex-start",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  bullet: { fontSize: 9, color: "rgba(185,66,255,0.6)" },
  featureItem: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  closeBtn: {
    marginTop: 8,
    width: "100%",
    backgroundColor: "rgba(185,66,255,0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(185,66,255,0.4)",
    paddingVertical: 12,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(185,66,255,0.9)",
    letterSpacing: 1.5,
  },
});
