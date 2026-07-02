import { AppIcon } from "@/components/app-icon";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DrillResult } from "@/components/drill-result";
import { OptionButton } from "@/components/option-button";
import { ScreenBg } from "@/components/screen-bg";
import { XpBar } from "@/components/xp-bar";
import { type DrillOutcome, useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { playSequence } from "@/lib/audio";
import { type EarQuestion, makeEarQuestions } from "@/lib/drills";

const MELODIC_STAGGER_MS = 520;

export default function EarTrainingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordDrill } = useProgress();

  const [questions, setQuestions] = useState<EarQuestion[]>(() => makeEarQuestions());
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
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

  const play = (q: EarQuestion, together = false) => {
    // Ignore playback taps once an answer is locked in, so the reveal window
    // doesn't stack audio that bleeds into the next question.
    if (lockRef.current) return;
    const notes = [q.rootValue, q.rootValue + q.semitones];
    if (together) playSequence(notes, 0);
    else playSequence(notes, MELODIC_STAGGER_MS);
    setHasPlayed(true);
  };

  const finish = async (finalCorrect: number) => {
    const minutes = (Date.now() - startTimeRef.current) / 60000;
    setDurationMinutes(minutes);
    const res = await recordDrill("ear", finalCorrect, questions.length);
    if (mountedRef.current) setOutcome(res);
  };

  const handleAnswer = (option: string) => {
    if (lockRef.current || !hasPlayed) return;
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
      setHasPlayed(false);
      if (index === questions.length - 1) {
        void finish(nextCorrect);
      } else {
        setIndex((i) => i + 1);
      }
    }, 900);
  };

  const restart = () => {
    startTimeRef.current = Date.now();
    setQuestions(makeEarQuestions());
    setIndex(0);
    setCorrect(0);
    setPicked(null);
    setHasPlayed(false);
    setOutcome(null);
    setDurationMinutes(0);
    lockRef.current = false;
  };

  if (outcome) {
    return (
      <DrillResult
        meta="Ear Training"
        correct={correct}
        total={questions.length}
        outcome={outcome}
        recaps={[]}
        onReplay={restart}
        onDone={() => router.back()}
        topPad={topPad}
        drillType="ear"
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Ear Training</Text>
          <Text style={[styles.counter, { color: colors.accent }]}>
            {index + 1}/{questions.length}
          </Text>
        </View>

        <XpBar value={index} max={questions.length} />

        <View style={styles.playArea}>
          <Text style={[styles.question, { color: colors.foreground }]}>Which interval do you hear?</Text>

          <Pressable
            onPress={() => play(current)}
            disabled={!!picked}
            style={({ pressed }) => [
              styles.playButton,
              {
                backgroundColor: "rgba(106,0,255,0.18)",
                borderColor: colors.accent,
                opacity: picked ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
            accessibilityLabel="Play interval"
          >
            <AppIcon name="play" size={40} color={colors.accent} />
          </Pressable>

          <View style={styles.playControls}>
            <Pressable
              onPress={() => play(current)}
              disabled={!!picked}
              style={({ pressed }) => [styles.smallBtn, { borderColor: colors.border, opacity: picked ? 0.4 : pressed ? 0.7 : 1 }]}
            >
              <AppIcon name="play" size={14} color={colors.mutedForeground} />
              <Text style={[styles.smallBtnText, { color: colors.mutedForeground }]}>Replay</Text>
            </Pressable>
            <Pressable
              onPress={() => play(current, true)}
              disabled={!!picked}
              style={({ pressed }) => [styles.smallBtn, { borderColor: colors.border, opacity: picked ? 0.4 : pressed ? 0.7 : 1 }]}
            >
              <AppIcon name="music" size={14} color={colors.mutedForeground} />
              <Text style={[styles.smallBtnText, { color: colors.mutedForeground }]}>Together</Text>
            </Pressable>
          </View>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            {hasPlayed ? "Listen, then pick the interval below" : "Tap play to hear the two notes"}
          </Text>
        </View>

        <View style={styles.options}>
          {current.options.map((opt) => {
            let state: "idle" | "correct" | "wrong" | "missed" = "idle";
            if (picked) {
              if (opt === current.answer) state = picked === opt ? "correct" : "missed";
              else if (opt === picked) state = "wrong";
            }
            return (
              <OptionButton
                key={opt}
                label={opt}
                state={state}
                disabled={!hasPlayed || !!picked}
                onPress={() => handleAnswer(opt)}
              />
            );
          })}
        </View>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_600SemiBold" },
  counter: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  playArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  question: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  playButton: {
    width: 110,
    height: 110,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  playControls: { flexDirection: "row", gap: 12 },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
  },
  smallBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  options: { gap: 12, paddingBottom: 40 },
});
