import { AppIcon } from "@/components/app-icon";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DrillResult } from "@/components/drill-result";
import { OptionButton } from "@/components/option-button";
import { ScreenBg } from "@/components/screen-bg";
import { XpBar } from "@/components/xp-bar";
import { type DrillOutcome, useProgress } from "@/contexts/progress";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { useColors } from "@/hooks/useColors";
import { DRILLS, type DrillType, type Question, type Recap, makeQuestions } from "@/lib/drills";

const DRILL_MUSIC = require("@/assets/audio/drill_music.mp3");

const VALID: DrillType[] = ["intervals", "notes", "scales", "chords"];

export default function DrillScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordDrill } = useProgress();
  const { muted, toggleMuted } = useBackgroundMusic(DRILL_MUSIC);
  const params = useLocalSearchParams<{ type: string }>();
  const type = (VALID.includes(params.type as DrillType) ? params.type : "intervals") as DrillType;
  const meta = DRILLS.find((d) => d.type === type)!;

  const [questions, setQuestions] = useState<Question[]>(() => makeQuestions(type));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<DrillOutcome | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const lockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const current = questions[index];

  const recaps = useMemo(() => {
    const seen = new Set<string>();
    const out: Recap[] = [];
    for (const q of questions) {
      if (q.recap && !seen.has(q.recap.title)) {
        seen.add(q.recap.title);
        out.push(q.recap);
      }
    }
    return out;
  }, [questions]);

  const finish = async (finalCorrect: number) => {
    const minutes = (Date.now() - startTimeRef.current) / 60000;
    setDurationMinutes(minutes);
    const res = await recordDrill(type, finalCorrect, questions.length);
    if (mountedRef.current) setOutcome(res);
  };

  const handleAnswer = (option: string) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setPicked(option);

    const isRight = option === current.answer;
    const nextCorrect = isRight ? correct + 1 : correct;
    if (isRight) setCorrect(nextCorrect);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        isRight ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      );
    }

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      lockRef.current = false;
      setPicked(null);
      if (index === questions.length - 1) {
        void finish(nextCorrect);
      } else {
        setIndex((i) => i + 1);
      }
    }, 750);
  };

  const restart = () => {
    startTimeRef.current = Date.now();
    setQuestions(makeQuestions(type));
    setIndex(0);
    setCorrect(0);
    setPicked(null);
    setOutcome(null);
    setDurationMinutes(0);
    lockRef.current = false;
  };

  if (outcome) {
    return (
      <DrillResult
        meta={meta.title}
        correct={correct}
        total={questions.length}
        outcome={outcome}
        recaps={recaps}
        onReplay={restart}
        onDone={() => router.back()}
        topPad={topPad}
        drillType={type}
        durationMinutes={durationMinutes}
      />
    );
  }

  return (
    <ScreenBg>
      <View style={{ flex: 1, paddingTop: topPad, paddingHorizontal: 20 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <AppIcon name="x" size={26} color={colors.mutedForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{meta.title}</Text>
          <View style={styles.headerRight}>
            <Pressable onPress={toggleMuted} hitSlop={12}>
              <AppIcon
                name={muted ? "volume-x" : "volume-2"}
                size={20}
                color={muted ? colors.mutedForeground : colors.accent}
              />
            </Pressable>
            <Text style={[styles.counter, { color: colors.accent }]}>
              {index + 1}/{questions.length}
            </Text>
          </View>
        </View>

        <XpBar value={index} max={questions.length} />

        <View style={styles.promptArea}>
          {current.highlightA ? (
            <>
              <Text style={[styles.promptSmall, { color: colors.mutedForeground }]}>{current.prompt}</Text>
              <View style={styles.notePair}>
                <Text style={[styles.note, { color: colors.chordTone }]}>{current.highlightA}</Text>
                <AppIcon name="arrow-right" size={26} color={colors.mutedForeground} />
                <Text style={[styles.note, { color: colors.scaleNote }]}>{current.highlightB}</Text>
              </View>
            </>
          ) : (
            <Text style={[styles.prompt, { color: colors.foreground }]}>{current.prompt}</Text>
          )}
        </View>

        <View style={styles.options}>
          {current.options.map((opt) => {
            let state: "idle" | "correct" | "wrong" | "missed" = "idle";
            if (picked) {
              if (opt === current.answer) state = picked === opt ? "correct" : "missed";
              else if (opt === picked) state = "wrong";
            }
            return (
              <OptionButton key={opt} label={opt} state={state} disabled={!!picked} onPress={() => handleAnswer(opt)} />
            );
          })}
        </View>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_600SemiBold" },
  counter: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  promptArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  promptSmall: { fontSize: 16, fontFamily: "Inter_500Medium" },
  prompt: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center", lineHeight: 36 },
  notePair: { flexDirection: "row", alignItems: "center", gap: 18 },
  note: { fontSize: 52, fontFamily: "SpaceGrotesk_700Bold" },
  options: { gap: 12, paddingBottom: 40 },
});
