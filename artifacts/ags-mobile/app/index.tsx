import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";

import { SKIP_INTRO_KEY } from "./intro";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      setSkip(true);
      setReady(true);
      return;
    }
    AsyncStorage.getItem(SKIP_INTRO_KEY).then((val) => {
      setSkip(val === "true");
      setReady(true);
    });
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: "#050816" }} />;
  if (skip) return <Redirect href="/(tabs)" />;
  return <Redirect href="/intro" />;
}
