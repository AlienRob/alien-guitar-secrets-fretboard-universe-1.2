/**
 * Vertical snap-scroll drum-roller picker.
 * Centre slot = selected value. Surrounding items fade for depth.
 * If `renderItem` is provided it renders custom content per row;
 * opacity + scale are applied to the row container automatically.
 */
import React, { useCallback, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export const PICKER_ITEM_H = 44;

interface ScrollPickerProps {
  values: (string | number)[];
  initialIndex?: number;
  onIndexChange: (index: number) => void;
  width?: number;
  visibleItems?: number; // must be odd; default 5
  renderItem?: (value: string | number, index: number) => React.ReactNode;
}

export function ScrollPicker({
  values,
  initialIndex = 0,
  onIndexChange,
  width = 90,
  visibleItems = 5,
  renderItem,
}: ScrollPickerProps) {
  const colors = useColors();
  const pad = Math.floor(visibleItems / 2);
  const pickerH = PICKER_ITEM_H * visibleItems;

  const ref = useRef<ScrollView>(null);
  const [selectedIdx, setSelectedIdx] = useState(initialIndex);

  const handleLayout = useCallback(() => {
    ref.current?.scrollTo({ y: initialIndex * PICKER_ITEM_H, animated: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const raw = e.nativeEvent.contentOffset.y / PICKER_ITEM_H;
      const clamped = Math.max(0, Math.min(values.length - 1, Math.round(raw)));
      setSelectedIdx(clamped);
      onIndexChange(clamped);
    },
    [onIndexChange, values.length],
  );

  return (
    <View style={[styles.container, { width, height: pickerH }]}>
      {/* Centre-slot highlight */}
      <View
        pointerEvents="none"
        style={[
          styles.highlight,
          {
            top: PICKER_ITEM_H * pad,
            height: PICKER_ITEM_H,
            borderColor: colors.primary,
            backgroundColor: colors.muted,
          },
        ]}
      />

      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={PICKER_ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PICKER_ITEM_H * pad }}
        onMomentumScrollEnd={handleScrollEnd}
        onLayout={handleLayout}
        scrollEventThrottle={16}
      >
        {values.map((v, i) => {
          const dist = Math.abs(i - selectedIdx);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.45 : 0.15;
          const scale   = dist === 0 ? 1.12 : 1;
          const color   = dist === 0 ? colors.foreground : colors.mutedForeground;
          const weight  = dist === 0 ? ("700" as const) : ("400" as const);
          return (
            <View
              key={i}
              style={[styles.item, { opacity, transform: [{ scale }] }]}
            >
              {renderItem ? renderItem(v, i) : (
                <Text
                  style={{ fontSize: 20, color, fontWeight: weight, textAlign: "center" }}
                >
                  {v}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Fade overlays */}
      <View pointerEvents="none"
        style={[styles.fade, styles.fadeTop,    { backgroundColor: colors.card }]} />
      <View pointerEvents="none"
        style={[styles.fade, styles.fadeBottom, { backgroundColor: colors.card }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
  item: { height: PICKER_ITEM_H, alignItems: "center", justifyContent: "center" },
  highlight: {
    position: "absolute", left: 6, right: 6,
    borderRadius: 8, borderWidth: 1, zIndex: 0,
  },
  fade: {
    position: "absolute", left: 0, right: 0,
    height: PICKER_ITEM_H * 1.5, zIndex: 1, opacity: 0.85,
  },
  fadeTop:    { top: 0 },
  fadeBottom: { bottom: 0 },
});
