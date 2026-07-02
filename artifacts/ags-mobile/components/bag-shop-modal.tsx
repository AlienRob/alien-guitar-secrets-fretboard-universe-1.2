/**
 * Bag Shop modal — placeholder stub.
 * All bag imagery has been removed pending a new design.
 * The props interface and onSelect/onClose wiring are preserved exactly.
 */
import React from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { BAG_TIERS, type BagTierConfig } from "@/lib/coins";

const COIN_SINGLE_IMG = require("@/assets/images/gear/coin-single.png");

interface BagShopModalProps {
  visible: boolean;
  coins: number;
  onSelect: (tier: BagTierConfig) => void;
  onClose: () => void;
}

export function BagShopModal({ visible, coins, onSelect, onClose }: BagShopModalProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>MYSTERY BAG SHOP</Text>
          <Text style={[styles.balance, { color: colors.mutedForeground }]}>
            Your coins: {coins}
          </Text>

          <ScrollView style={{ width: "100%" }} contentContainerStyle={{ gap: 12 }}>
            {BAG_TIERS.map((tier) => {
              const canAfford = coins >= tier.cost;
              return (
                <View
                  key={tier.id}
                  style={[
                    styles.tierRow,
                    {
                      borderColor: canAfford ? tier.accentColor + "88" : colors.border,
                      backgroundColor: canAfford ? tier.accentColor + "12" : colors.card,
                    },
                  ]}
                >
                  <View style={styles.tierInfo}>
                    <Text style={[styles.tierLabel, { color: canAfford ? tier.accentColor : colors.mutedForeground }]}>
                      {tier.label.toUpperCase()}
                    </Text>
                    <Text style={[styles.tierOdds, { color: colors.mutedForeground }]}>
                      {tier.oddsBlurb}
                    </Text>
                    <View style={styles.costRow}>
                      <Image source={COIN_SINGLE_IMG} style={{ width: 14, height: 14 }} resizeMode="contain" />
                      <Text style={[styles.costText, { color: canAfford ? tier.accentColor : colors.mutedForeground }]}>
                        {tier.cost} coins
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={canAfford ? () => onSelect(tier) : undefined}
                    style={({ pressed }) => [
                      styles.openBtn,
                      { backgroundColor: canAfford ? tier.accentColor : colors.border, opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Text style={[styles.openBtnText, { color: canAfford ? "#000" : colors.mutedForeground }]}>
                      {canAfford ? "Open" : "Need coins"}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.closeTxt, { color: colors.mutedForeground }]}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet:     { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "80%", alignItems: "center" },
  title:     { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 2, marginBottom: 4 },
  balance:   { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 20 },
  tierRow:   { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 14, gap: 12 },
  tierInfo:  { flex: 1, gap: 3 },
  tierLabel: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  tierOdds:  { fontSize: 11, fontFamily: "Inter_400Regular" },
  costRow:   { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  costText:  { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  openBtn:   { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  openBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  closeBtn:  { marginTop: 20, borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32 },
  closeTxt:  { fontSize: 14, fontFamily: "Inter_500Medium" },
});
