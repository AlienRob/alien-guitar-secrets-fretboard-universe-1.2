import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// expo-av will be replaced by expo-audio in SDK 54; suppress the known
// deprecation warning so it doesn't light up the Expo Go error indicator.
LogBox.ignoreLogs(["[expo-av]: Expo AV has been deprecated"]);

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AvatarProvider } from "@/contexts/avatar";
import { BossesProvider } from "@/contexts/bosses";
import { GearProvider } from "@/contexts/gear";
import { ProgressProvider } from "@/contexts/progress";

SplashScreen.preventAutoHideAsync();

// Configure the iOS audio session at app startup so it plays through the
// silent/ringer switch and allows background-music + note sounds from the
// first user tap — not lazily on first sound trigger, which is too late on iOS.
if (typeof navigator !== "undefined" && navigator.product !== "ReactDOM") {
  try {
    const { setAudioModeAsync } = require("expo-audio") as {
      setAudioModeAsync: (opts: Record<string, unknown>) => Promise<void>;
    };
    void setAudioModeAsync({ playsInSilentMode: true, shouldDuckAndroid: true });
  } catch { /* expo-audio unavailable */ }
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#050816" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
      <Stack.Screen name="tuner"     options={{ presentation: "card" }} />
      <Stack.Screen name="metronome" options={{ presentation: "card" }} />
      <Stack.Screen name="drill/[type]" options={{ presentation: "card" }} />
      <Stack.Screen name="guitar-3d" options={{ presentation: "modal" }} />
      <Stack.Screen name="galaxy" options={{ presentation: "card" }} />
      <Stack.Screen name="boss/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="boss/battle/[id]" options={{ presentation: "card" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  // If useFonts hangs (e.g. offline mode after cache clear), proceed after 3s
  // rather than freezing behind the splash screen forever.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const ready = fontsLoaded || !!fontError || timedOut;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <ProgressProvider>
              <GearProvider>
                <BossesProvider>
                  <AvatarProvider>
                    <StatusBar style="light" />
                    <RootLayoutNav />
                  </AvatarProvider>
                </BossesProvider>
              </GearProvider>
            </ProgressProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
