import { AppIcon } from "@/components/app-icon";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenBg } from "@/components/screen-bg";
import { type DrillOutcome, useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { useMicPitch } from "@/hooks/useMicPitch";
import { NOTES_SHARP } from "@/lib/musicTheory";
import { samePitchClass } from "@/lib/pitch";

const ROUND_LEN = 5;
/** Consecutive matching frames required before we count a note as played. */
const MATCH_FRAMES = 2;
/** Cents within this of perfect are shown as "in tune". */
const IN_TUNE_CENTS = 8;

function randomPc(exclude = -1): number {
  let pc = Math.floor(Math.random() * 12);
  if (pc === exclude) pc = (pc + 1 + Math.floor(Math.random() * 11)) % 12;
  return pc;
}

export default function NoteCheckScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordDrill } = useProgress();
  const { supported, status, reading, error, start, stop } = useMicPitch(true);

  const [target, setTarget] = useState(() => randomPc());
  const [roundIdx, setRoundIdx] = useState(0); // which target in the round (0-based)
  const [hits, setHits] = useState(0);
  const [justMatched, setJustMatched] = useState(false);
  const [outcome, setOutcome] = useState<DrillOutcome | null>(null);

  const targetRef = useRef(target);
  const roundRef = useRef(0);
  const hitsRef = useRef(0);
  const matchedRef = useRef(false);
  const streakRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  targetRef.current = target;

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      stop();
    };
  }, [stop]);

  const finishRound = async () => {
    stop();
    const res = await recordDrill("listen", hitsRef.current, ROUND_LEN);
    if (mountedRef.current) setOutcome(res);
  };

  const advance = (countedHit: boolean) => {
    if (countedHit) {
      hitsRef.current += 1;
      setHits(hitsRef.current);
    }
    const next = roundRef.current + 1;
    if (next >= ROUND_LEN) {
      void finishRound();
      return;
    }
    roundRef.current = next;
    setRoundIdx(next);
    setTarget(randomPc(targetRef.current));
    setJustMatched(false);
    matchedRef.current = false;
    streakRef.current = 0;
  };

  // Detect a sustained match of the current target note.
  useEffect(() => {
    if (status !== "listening" || matchedRef.current) return;
    if (reading && samePitchClass(reading.midi, target)) {
      streakRef.current += 1;
      if (streakRef.current >= MATCH_FRAMES) {
        matchedRef.current = true;
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setJustMatched(true);
        timerRef.current = setTimeout(() => {
          if (mountedRef.current) advance(true);
        }, 900);
      }
    } else {
      streakRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading, status, target]);

  const beginRound = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    hitsRef.current = 0;
    roundRef.current = 0;
    setHits(0);
    setRoundIdx(0);
    setTarget(randomPc());
    setJustMatched(false);
    setOutcome(null);
    matchedRef.current = false;
    streakRef.current = 0;
    start();
  };

  // Stop listening manually: cancel any pending match timeout and reset the
  // per-target refs so a stale callback can't advance/score after stopping.
  const handleStop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    matchedRef.current = false;
    streakRef.current = 0;
    setJustMatched(false);
    stop();
  };

  const skip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    matchedRef.current = true;
    advance(false);
  };

  const targetName = NOTES_SHARP[target];

  return (
    <ScreenBg>
      <View style={{ flex: 1, paddingTop: topPad, paddingHorizontal: 20 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <AppIcon name="x" size={26} color={colors.mutedForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Note Check</Text>
          <View style={{ width: 26 }} />
        </View>

        {outcome ? (
          <ResultView
            hits={hits}
            outcome={outcome}
            onAgain={beginRound}
            onDone={() => router.back()}
          />
        ) : !supported ? (
          <UnsupportedView />
        ) : status === "listening" ? (
          <ListeningView
            targetName={targetName}
            reading={reading}
            roundIdx={roundIdx}
            justMatched={justMatched}
            onSkip={skip}
            onStop={handleStop}
          />
        ) : (
          <IntroView status={status} error={error} onStart={beginRound} />
        )}
      </View>
    </ScreenBg>
  );
}

function IntroView({
  status,
  error,
  onStart,
}: {
  status: string;
  error: string | null;
  onStart: () => void;
}) {
  const colors = useColors();
  const requesting = status === "requesting";
  const blocked = status === "denied" || status === "error";

  return (
    <View style={styles.center}>
      <View style={[styles.bigIcon, { backgroundColor: "rgba(106,0,255,0.18)" }]}>
        <AppIcon name="mic" size={48} color={colors.accent} />
      </View>
      <Text style={[styles.kicker, { color: colors.accent }]}>EAR TRAINER</Text>
      <Text style={[styles.bigTitle, { color: colors.foreground }]}>Note Check</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        We'll name a note. Play it on your guitar — any octave — and the app listens to
        check you got it right. Five notes per round.
      </Text>

      {blocked && error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}

      <Pressable
        onPress={onStart}
        disabled={requesting}
        style={({ pressed }) => [
          styles.primaryBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius,
            opacity: pressed || requesting ? 0.85 : 1,
          },
        ]}
      >
        <AppIcon name="mic" size={18} color={colors.primaryForeground} />
        <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
          {requesting ? "Asking for microphone…" : blocked ? "Try again" : "Start listening"}
        </Text>
      </Pressable>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        Tip: play single notes clearly, and tune up first for the best results.
      </Text>
    </View>
  );
}

function ListeningView({
  targetName,
  reading,
  roundIdx,
  justMatched,
  onSkip,
  onStop,
}: {
  targetName: string;
  reading: ReturnType<typeof useMicPitch>["reading"];
  roundIdx: number;
  justMatched: boolean;
  onSkip: () => void;
  onStop: () => void;
}) {
  const colors = useColors();
  const cents = reading?.cents ?? 0;
  const inTune = reading ? Math.abs(cents) <= IN_TUNE_CENTS : false;
  // Marker position across the cents bar (-50..+50 -> 0..100%).
  const markerPct = Math.max(0, Math.min(100, ((cents + 50) / 100) * 100));

  return (
    <View style={styles.listenWrap}>
      <View style={styles.dots}>
        {Array.from({ length: ROUND_LEN }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < roundIdx ? colors.correct : i === roundIdx ? colors.accent : "transparent",
                borderColor: i <= roundIdx ? colors.accent : colors.border,
              },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.playLabel, { color: colors.mutedForeground }]}>PLAY THIS NOTE</Text>
      <Text style={[styles.targetNote, { color: justMatched ? colors.correct : colors.foreground }]}>
        {targetName}
      </Text>

      {justMatched ? (
        <View style={[styles.matchPill, { backgroundColor: "rgba(0,255,102,0.16)" }]}>
          <AppIcon name="check-circle" size={18} color={colors.correct} />
          <Text style={[styles.matchText, { color: colors.correct }]}>Nice — that's a {targetName}!</Text>
        </View>
      ) : (
        <Text style={[styles.heard, { color: colors.mutedForeground }]}>
          {reading ? (
            <>
              I hear{" "}
              <Text style={{ color: colors.foreground, fontFamily: "SpaceGrotesk_700Bold" }}>
                {reading.name}
                {reading.octave}
              </Text>
            </>
          ) : (
            "Listening… play a note"
          )}
        </Text>
      )}

      {/* Tuning meter */}
      <View style={styles.meterWrap}>
        <View style={[styles.meterBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <View style={[styles.meterCenter, { backgroundColor: colors.border }]} />
          {reading ? (
            <View
              style={[
                styles.meterMarker,
                { left: `${markerPct}%`, backgroundColor: inTune ? colors.correct : colors.chordTone },
              ]}
            />
          ) : null}
        </View>
        <View style={styles.meterLabels}>
          <Text style={[styles.meterLabel, { color: colors.mutedForeground }]}>flat</Text>
          <Text style={[styles.meterLabel, { color: inTune ? colors.correct : colors.mutedForeground }]}>
            {reading ? (inTune ? "in tune" : `${cents > 0 ? "+" : ""}${cents}¢`) : "—"}
          </Text>
          <Text style={[styles.meterLabel, { color: colors.mutedForeground }]}>sharp</Text>
        </View>
      </View>

      <View style={styles.listenBtns}>
        <Pressable onPress={onSkip} style={({ pressed }) => [styles.ghostBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
          <AppIcon name="skip-forward" size={16} color={colors.mutedForeground} />
          <Text style={[styles.ghostBtnText, { color: colors.mutedForeground }]}>Skip</Text>
        </Pressable>
        <Pressable onPress={onStop} style={({ pressed }) => [styles.ghostBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
          <AppIcon name="square" size={16} color={colors.mutedForeground} />
          <Text style={[styles.ghostBtnText, { color: colors.mutedForeground }]}>Stop</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ResultView({
  hits,
  outcome,
  onAgain,
  onDone,
}: {
  hits: number;
  outcome: DrillOutcome;
  onAgain: () => void;
  onDone: () => void;
}) {
  const colors = useColors();
  const great = hits >= 4;

  return (
    <View style={styles.center}>
      <View style={styles.bigIcon}>
        <AppIcon name={great ? "award" : "check-circle"} size={56} color={great ? colors.chordTone : colors.accent} />
      </View>
      <Text style={[styles.kicker, { color: colors.accent }]}>ROUND COMPLETE</Text>
      <Text style={[styles.score, { color: colors.foreground }]}>
        {hits}/{ROUND_LEN}
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>notes played correctly</Text>

      <View style={[styles.xpPill, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <AppIcon name="zap" size={18} color={colors.chordTone} />
        <Text style={[styles.xpEarned, { color: colors.foreground }]}>+{outcome.xpEarned} XP</Text>
      </View>

      {outcome.leveledUp ? (
        <Text style={[styles.levelUp, { color: colors.accent }]}>Level up! You reached Level {outcome.newLevel}</Text>
      ) : null}
      {outcome.beltChanged ? (
        <Text style={[styles.levelUp, { color: outcome.newBelt.color }]}>New rank: {outcome.newBelt.name} Belt</Text>
      ) : null}

      <Pressable
        onPress={onAgain}
        style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}
      >
        <AppIcon name="rotate-ccw" size={18} color={colors.primaryForeground} />
        <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Go again</Text>
      </Pressable>
      <Pressable onPress={onDone} style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Back to practice</Text>
      </Pressable>
    </View>
  );
}

function UnsupportedView() {
  const colors = useColors();
  return (
    <View style={styles.center}>
      <View style={[styles.bigIcon, { backgroundColor: "rgba(106,0,255,0.18)" }]}>
        <AppIcon name="smartphone" size={44} color={colors.accent} />
      </View>
      <Text style={[styles.kicker, { color: colors.accent }]}>EAR TRAINER</Text>
      <Text style={[styles.bigTitle, { color: colors.foreground }]}>Almost ready</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        Live note listening uses your phone's microphone, which the quick preview can't
        reach. It will switch on in the installed app once the microphone feature is added
        to your next phone build. You can try it right now in a web browser.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_600SemiBold" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40 },
  bigIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  kicker: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  bigTitle: { fontSize: 30, fontFamily: "SpaceGrotesk_700Bold", marginTop: 4, marginBottom: 14 },
  body: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, paddingHorizontal: 8 },
  errorText: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 18 },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 16, paddingHorizontal: 12 },

  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, paddingHorizontal: 28, marginTop: 28, alignSelf: "stretch" },
  primaryBtnText: { fontSize: 17, fontFamily: "SpaceGrotesk_600SemiBold" },
  secondaryBtn: { alignItems: "center", paddingVertical: 16 },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },

  listenWrap: { flex: 1, alignItems: "center", paddingTop: 8 },
  dots: { flexDirection: "row", gap: 10, marginBottom: 28 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  playLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  targetNote: { fontSize: 104, fontFamily: "SpaceGrotesk_700Bold", marginTop: 4, marginBottom: 8 },
  heard: { fontSize: 17, fontFamily: "Inter_400Regular", textAlign: "center", minHeight: 26 },
  matchPill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minHeight: 26 },
  matchText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },

  meterWrap: { alignSelf: "stretch", marginTop: 40, paddingHorizontal: 4 },
  meterBar: { height: 16, borderRadius: 8, borderWidth: 1, justifyContent: "center" },
  meterCenter: { position: "absolute", left: "50%", width: 2, height: 16, marginLeft: -1 },
  meterMarker: { position: "absolute", width: 8, height: 24, borderRadius: 4, marginLeft: -4, top: -4 },
  meterLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  meterLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },

  listenBtns: { flexDirection: "row", gap: 12, marginTop: "auto", marginBottom: 28, alignSelf: "stretch" },
  ghostBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderWidth: 1, borderRadius: 14 },
  ghostBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },

  score: { fontSize: 72, fontFamily: "SpaceGrotesk_700Bold", marginTop: 4 },
  xpPill: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, marginTop: 22 },
  xpEarned: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  levelUp: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold", textAlign: "center", marginTop: 14 },
});
