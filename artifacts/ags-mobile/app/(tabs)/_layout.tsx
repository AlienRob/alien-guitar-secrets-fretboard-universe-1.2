import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";
import { useBosses } from "@/contexts/bosses";
import { BOSSES } from "@/lib/bosses";
import { consumeIntroFade } from "@/lib/introHandoff";

/**
 * NativeTabLayout — iOS Liquid Glass (unstable-native-tabs).
 * bossReady: show a badge on the Home trigger to signal that the boss is
 * reachable from the boss teaser card on that tab (Galaxy has no dedicated tab).
 */
function NativeTabLayout({ bossReady }: { bossReady: boolean }) {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="practice">
        <Icon sf={{ default: "guitars", selected: "guitars.fill" }} />
        <Label>Practice</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="toolbox">
        <Icon sf={{ default: "wrench.and.screwdriver", selected: "wrench.and.screwdriver.fill" }} />
        <Label>Toolbox</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Icon sf={{ default: "grid", selected: "grid.circle.fill" }} />
        <Label>Fretboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="precision-labs">
        <Icon sf={{ default: "dial.medium", selected: "dial.medium.fill" }} />
        <Label>Labs</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Progress</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout({ bossReady, bossAccentColor }: { bossReady: boolean; bossAccentColor: string }) {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  // Badge on Home tab — Galaxy (boss) is reached from the boss teaser on Home.
  const homeBadge = bossReady ? "!" : undefined;

  const renderIcon = (
    sf: string,
    mci: keyof typeof MaterialCommunityIcons.glyphMap,
    color: string,
  ) =>
    isIOS ? (
      <SymbolView name={sf as never} tintColor={color} size={24} />
    ) : (
      <MaterialCommunityIcons name={mci} size={24} color={color} />
    );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => renderIcon("house", "home-variant", color),
          tabBarBadge: homeBadge,
          tabBarBadgeStyle: bossReady ? { backgroundColor: bossAccentColor, minWidth: 18, height: 18, borderRadius: 9, fontSize: 11 } : undefined,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{ title: "Practice", tabBarIcon: ({ color }) => renderIcon("guitars", "guitar-acoustic", color) }}
      />
      <Tabs.Screen
        name="toolbox"
        options={{ title: "Toolbox", tabBarIcon: ({ color }) => renderIcon("wrench.and.screwdriver", "tools", color) }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: "Fretboard", tabBarIcon: ({ color }) => renderIcon("grid", "grid", color) }}
      />
      <Tabs.Screen
        name="precision-labs"
        options={{
          title: "Labs",
          tabBarIcon: ({ color }) => renderIcon("dial.medium", "tune", color),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Progress", tabBarIcon: ({ color }) => renderIcon("chart.bar", "chart-bar", color) }}
      />
      <Tabs.Screen name="games"     options={{ href: null }} />
      <Tabs.Screen name="avatar"    options={{ href: null }} />
      <Tabs.Screen name="gear"      options={{ href: null }} />
      <Tabs.Screen name="legends"   options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default function TabLayout() {
  const fromIntro = useRef(consumeIntroFade()).current;
  const veil = useRef(new Animated.Value(fromIntro ? 1 : 0)).current;
  const { bossReady } = useBeginnerTrail();
  const { isBeaten } = useBosses();
  const nextBoss = BOSSES.find((b) => !isBeaten(b.id));
  const bossAccentColor = nextBoss?.accentColor ?? "#a855f7";

  useEffect(() => {
    if (!fromIntro) return;
    Animated.timing(veil, {
      toValue: 0,
      duration: 900,
      delay: 80,
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inner = isLiquidGlassAvailable()
    ? <NativeTabLayout bossReady={bossReady} />
    : <ClassicTabLayout bossReady={bossReady} bossAccentColor={bossAccentColor} />;

  return (
    <View style={styles.root}>
      {inner}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: veil }]}
      />
    </View>
  );
}
