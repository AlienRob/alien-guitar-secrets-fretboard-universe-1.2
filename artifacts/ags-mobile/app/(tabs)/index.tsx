import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COIN_SINGLE_IMG = require("@/assets/images/gear/coin-single.png");

import { AppIcon } from "@/components/app-icon";
import { ScreenBg } from "@/components/screen-bg";
import { StreakFlameBadge } from "@/components/streak-flame-badge";
import { XpBar } from "@/components/xp-bar";
import { useAvatar } from "@/contexts/avatar";
import { useBosses } from "@/contexts/bosses";
import { useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";
import { BOSSES } from "@/lib/bosses";
import { getDailyQuote } from "@/lib/dailyQuote";
import { getCurrentFlame } from "@/lib/streakFlame";

const DAILY_GOAL = 3;
const XP_PER_LEVEL = 250;
const AVG_XP_PER_CHALLENGE = 80;

// ── LEARNING PATH DATA ────────────────────────────────────────────────────────

type LessonItem = {
  id: string;
  title: string;
  blurb: string;
  icon: string;
  color: string;
  href?: string;
  tag?: string;
};

type LessonSection = {
  id: string;
  title: string;
  color: string;
  items: LessonItem[];
};

const SECTIONS: LessonSection[] = [
  {
    id: "introduction",
    title: "INTRODUCTION",
    color: "#60a5fa",
    items: [
      {
        id: "intro-guitar",
        href: "/lesson/intro-guitar",
        title: "The Guitar & Fretboard",
        blurb: "A beginner's guide to the instrument — parts, strings, frets, and how it all fits together.",
        icon: "🎸",
        color: "#60a5fa",
      },
      {
        id: "nine-steps",
        href: "/lesson/nine-steps",
        title: "9 Steps to Great Practice",
        blurb: "Rob's complete guide to practising effectively — goal setting, focus, timing, and consistency.",
        icon: "📋",
        color: "#60a5fa",
      },
    ],
  },
  {
    id: "foundations",
    title: "FRETBOARD FOUNDATIONS",
    color: "#00FFD5",
    items: [
      {
        id: "finding-notes",
        href: "/lesson/finding-notes",
        title: "The Fretboard",
        blurb: "Finding the notes on the fretboard using the five octave formulas.",
        icon: "🎸",
        color: "#00FFD5",
      },
      {
        id: "intervals",
        href: "/lesson/intervals",
        title: "Demystifying Intervals",
        blurb: "The distances between notes — the building blocks of melody and harmony.",
        icon: "🎵",
        color: "#00FFD5",
      },
      {
        id: "natural-notes",
        href: "/lesson/natural-notes",
        title: "Mapping Natural Notes",
        blurb: "Learn the layout of the seven natural notes on every string.",
        icon: "🗺️",
        color: "#00FFD5",
      },
      {
        id: "sharps-flats",
        href: "/lesson/sharps-flats",
        title: "Sharps & Flats",
        blurb: "Understand how sharps and flats work and how to find them easily.",
        icon: "♯",
        color: "#00FFD5",
      },
      {
        id: "enharmonics",
        href: "/lesson/enharmonics",
        title: "Understanding Enharmonics",
        blurb: "Why the same note can have two different names — and when each is used.",
        icon: "♭",
        color: "#00FFD5",
      },
    ],
  },
  {
    id: "rhythm",
    title: "RHYTHM & TIME",
    color: "#f59e0b",
    items: [
      {
        id: "rhythm-and-time",
        href: "/lesson/rhythm-and-time",
        title: "Rhythm & Time",
        blurb: "Tempo, note values, time signatures, counting systems, and straight vs swing feel — the complete foundation.",
        icon: "🥁",
        color: "#f59e0b",
      },
      {
        id: "rhythmic-patterns",
        title: "Rhythmic Patterns",
        blurb: "Essential strumming and picking patterns to memorise and build from.",
        icon: "⚡",
        color: "#f59e0b",
      },
      {
        id: "groove-and-feel",
        title: "Groove & Feel",
        blurb: "Locking in with a drummer, subdivisions, and developing your internal clock.",
        icon: "🔒",
        color: "#f59e0b",
      },
      {
        id: "syncopation",
        title: "Syncopation",
        blurb: "Off-beat accents, anticipations, and how to make rhythm feel alive.",
        icon: "🎭",
        color: "#f59e0b",
      },
    ],
  },
  {
    id: "scales",
    title: "SCALES",
    color: "#a78bfa",
    items: [
      {
        id: "how-to-practice-scales",
        href: "/lesson/how-to-practice-scales",
        title: "How to Practise Scales",
        blurb: "Rob's nine strategies for turning scale exercises into real fretboard fluency.",
        icon: "📖",
        color: "#a78bfa",
      },
      {
        id: "major-minor-scales",
        href: "/lesson/major-minor-scales",
        title: "The Major & Natural Minor Scales",
        blurb: "The two parent scales — their formulas, degree tables, and relative relationship explained.",
        icon: "🎼",
        color: "#a78bfa",
      },
      {
        id: "modes-major",
        href: "/lesson/modes-major",
        title: "Modes of the Major Scale",
        blurb: "Seven unique flavours from one parent key — with Rob's method for hearing and applying each one.",
        icon: "🌈",
        color: "#a78bfa",
      },
      {
        id: "pentatonic",
        href: "/lesson/pentatonic",
        title: "The Pentatonic Scale",
        blurb: "Five notes, infinite possibilities — major and minor pentatonic across all five positions.",
        icon: "⭐",
        color: "#a78bfa",
      },
      {
        id: "blues-scale",
        href: "/lesson/blues-scale",
        title: "The Blues Scale",
        blurb: "The pentatonic with a blue note — instantly recognisable grit and soul.",
        icon: "🎷",
        color: "#a78bfa",
      },
      {
        id: "modes-harmonic-minor",
        href: "/lesson/modes-harmonic-minor",
        title: "Modes of the Harmonic Minor",
        blurb: "Seven modes built on the raised 7th — including the dramatic Phrygian Dominant.",
        icon: "🌙",
        color: "#a78bfa",
      },
      {
        id: "modes-melodic-minor",
        href: "/lesson/modes-melodic-minor",
        title: "Modes of the Melodic Minor",
        blurb: "The most sophisticated scale system — Lydian Dominant, Altered Scale, and more.",
        icon: "🚀",
        color: "#a78bfa",
      },
      {
        id: "symmetrical-scales",
        title: "Symmetrical Scales",
        blurb: "Whole tone, diminished, and augmented scales — equal-interval patterns with unique sounds.",
        icon: "🔵",
        color: "#a78bfa",
      },
      {
        id: "exotic-scales",
        title: "Exotic Scales",
        blurb: "Hungarian minor, double harmonic, and scales from outside Western music.",
        icon: "🌍",
        color: "#a78bfa",
      },
      {
        id: "creating-with-modes",
        title: "Creating with Modes",
        blurb: "How to write chord progressions and melodies that bring out the mood of each mode.",
        icon: "🎨",
        color: "#a78bfa",
      },
      {
        id: "playing-with-pentatonics",
        title: "Playing with Pentatonics",
        blurb: "Mastery exercises and superimposition — layering pentatonic shapes for exotic sounds.",
        icon: "🔮",
        color: "#a78bfa",
      },
      {
        id: "fluid-scale-movement",
        title: "Fluid Scale Movement",
        blurb: "Move seamlessly between scale patterns across the whole neck without losing your flow.",
        icon: "💧",
        color: "#a78bfa",
      },
    ],
  },
  {
    id: "chords",
    title: "CHORDS & HARMONY",
    color: "#f59e0b",
    items: [
      {
        id: "chord-construction",
        href: "/lesson/chord-construction",
        title: "Chord Construction",
        blurb: "See how triads and seventh chords are built from intervals, note by note.",
        icon: "🪐",
        color: "#f59e0b",
      },
      {
        id: "chord-extensions",
        title: "Chord Extensions",
        blurb: "Add 9ths, 11ths, and 13ths — plus the art of chord substitution.",
        icon: "✨",
        color: "#f59e0b",
      },
      {
        id: "drop-chords",
        title: "Drop Chords",
        blurb: "Rearrange voicings to create rich, guitaristic chord shapes.",
        icon: "🎯",
        color: "#f59e0b",
      },
      {
        id: "scales-to-chords",
        title: "Matching Scales to Chords",
        blurb: "Know exactly which scale to play over any chord, every time.",
        icon: "🗺️",
        color: "#f59e0b",
      },
      {
        id: "chord-progressions",
        title: "Building Chord Progressions",
        blurb: "Craft compelling harmonic movement from the ground up.",
        icon: "🏗️",
        color: "#f59e0b",
      },
    ],
  },
  {
    id: "improvisation",
    title: "IMPROVISATION",
    color: "#ef4444",
    items: [
      {
        id: "intro-improv",
        title: "Introduction to Improvisation",
        blurb: "Your first steps into the art of making music in the moment.",
        icon: "🎤",
        color: "#ef4444",
      },
      {
        id: "chord-tones",
        title: "Targeting Chord Tones",
        blurb: "Land on the right notes at the right time — the secret of great solos.",
        icon: "🎯",
        color: "#ef4444",
      },
      {
        id: "dynamic-phrasing",
        title: "Dynamic Phrasing",
        blurb: "Shape your lines with rhythm, space, and emotional contrast.",
        icon: "🌊",
        color: "#ef4444",
      },
      {
        id: "limitation-freedom",
        title: "Limitation as Freedom",
        blurb: "Why fewer notes and constraints unlock more creativity.",
        icon: "🔓",
        color: "#ef4444",
      },
      {
        id: "motifs",
        title: "Creating Musical Motifs",
        blurb: "Build and develop short musical ideas into full phrases.",
        icon: "🧩",
        color: "#ef4444",
      },
      {
        id: "melodies",
        title: "Building Melodies with Purpose",
        blurb: "Craft melodies that tell a story and move the listener.",
        icon: "🎵",
        color: "#ef4444",
      },
    ],
  },
];


// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    belt, level, xpIntoLevel, xpPerLevel, streak, accuracy,
    coins, xp, dailyChallengesCount, dailyQuestDone, xpMultiplier, streakFreezes,
    dailyTrailComplete,
  } = useProgress();
  const { avatar } = useAvatar();
  const { isBeaten } = useBosses();
  const { bossReady } = useBeginnerTrail();

  const quote = useMemo(() => getDailyQuote(), []);
  const name = (avatar.displayName?.trim() || "").toUpperCase() || "PLAYER";
  const bossesBeaten = BOSSES.filter((b) => isBeaten(b.id)).length;
  const flame = getCurrentFlame(streak);

  const nextBoss = useMemo(() => BOSSES.find((b) => !isBeaten(b.id)), [isBeaten]);
  const currentPlanet = nextBoss?.planet ?? "The Galaxy";

  const challengesRemaining = useMemo(() => {
    if (!nextBoss || bossReady) return 0;
    const xpNeeded = Math.max(0, (nextBoss.unlockLevel - 1) * XP_PER_LEVEL - xp);
    return Math.max(1, Math.ceil(xpNeeded / AVG_XP_PER_CHALLENGE));
  }, [nextBoss, bossReady, xp]);

  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ]),
    ).start();
  }, [glowAnim]);
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (Platform.OS === "web" ? 84 : insets.bottom) + 100;
  const questProgress = Math.min(dailyChallengesCount, DAILY_GOAL);

  // ── LESSON CARD RENDERER ──────────────────────────────────────────────────

  function renderLessonCard(item: LessonItem) {
    const available = !!item.href;
    const cardContent = (
      <>
        <LinearGradient
          colors={[item.color + "22", item.color + "08"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {!available && (
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>SOON</Text>
          </View>
        )}
        <View style={[styles.lessonIconWrap, { backgroundColor: item.color + "22" }]}>
          <Text style={styles.lessonEmoji}>{item.icon}</Text>
        </View>
        <Text style={[styles.lessonTitle, { color: available ? colors.foreground : "rgba(255,255,255,0.45)" }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.lessonBlurb, { color: available ? colors.mutedForeground : "rgba(255,255,255,0.25)" }]}
          numberOfLines={3}
        >
          {item.blurb}
        </Text>
        {item.tag && (
          <View style={[styles.tagChip, { backgroundColor: item.color + "22", borderColor: item.color + "44" }]}>
            <Text style={[styles.tagText, { color: item.color }]}>{item.tag.toUpperCase()}</Text>
          </View>
        )}
      </>
    );

    if (available) {
      return (
        <Pressable
          key={item.id}
          onPress={() => router.push(item.href as Parameters<typeof router.push>[0])}
          style={({ pressed }) => [
            styles.lessonCard,
            { borderColor: item.color + "55", opacity: pressed ? 0.8 : 1 },
          ]}
        >
          {cardContent}
        </Pressable>
      );
    }

    return (
      <View
        key={item.id}
        style={[styles.lessonCard, { borderColor: item.color + "22", opacity: 0.55 }]}
      >
        {cardContent}
      </View>
    );
  }

  function renderSection(section: LessonSection) {
    return (
      <View key={section.id} style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionAccent, { backgroundColor: section.color }]} />
          <Text style={[styles.sectionLabel, { color: section.color }]}>{section.title}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lessonScroll}
          style={{ marginBottom: 6 }}
        >
          {section.items.map(renderLessonCard)}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScreenBg>
      {/* ── TOP RESOURCE BAR ── */}
      <View style={[styles.topBar, { paddingTop: topPad, borderBottomColor: "rgba(0,255,213,0.12)" }]}>
        <View style={styles.resChip}>
          <Text style={[styles.resValue, { color: "#facc15" }]}>{xp}</Text>
          <Text style={styles.resIcon}>⚡</Text>
          <Text style={[styles.resLabel, { color: "#facc15" }]}>XP</Text>
        </View>
        <View style={styles.resDivider} />
        <Pressable style={styles.resChip} onPress={() => router.push("/(tabs)/gear")}>
          <Text style={[styles.resValue, { color: "#f59e0b" }]}>{coins}</Text>
          <Image source={COIN_SINGLE_IMG} style={{ width: 14, height: 14 }} resizeMode="contain" />
          <Text style={[styles.resLabel, { color: "#f59e0b" }]}>Coins</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── LOGO / TITLE ── */}
        <View style={styles.logoSection}>
          <Image
            source={require("@/assets/images/ags-wordmark.png")}
            style={styles.logoHorizontal}
            resizeMode="contain"
          />
          <Text style={styles.titleSub}>FRETBOARD UNIVERSE</Text>
        </View>

        {/* ── DAILY QUOTE ── */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText} numberOfLines={2}>
            {`\u201C${quote.text}\u201D \u2014 ${quote.author}`}
          </Text>
        </View>

        {/* ── PLAYER CARD ── */}
        <Pressable
          onPress={() => router.push("/(tabs)/avatar")}
          style={({ pressed }) => [styles.playerCard, { borderColor: belt.color, opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={[`${belt.color}55`, `${belt.color}18`, "rgba(5,8,22,0.95)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.playerCardTop}>
            <View style={styles.playerNameRow}>
              <Text style={styles.playerIcon}>👤</Text>
              <Text style={[styles.playerName, { color: colors.foreground }]}>{name}</Text>
            </View>
            <View style={[styles.beltBadge, { backgroundColor: belt.color + "33", borderColor: belt.color }]}>
              <View style={[styles.beltDot, { backgroundColor: belt.color }]} />
              <Text style={[styles.beltBadgeText, { color: belt.color }]}>{belt.name.toUpperCase()} BELT</Text>
            </View>
          </View>
          <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>LEVEL {level}</Text>
          <XpBar value={xpIntoLevel} max={xpPerLevel} />
          <View style={styles.xpRow}>
            <Text style={[styles.xpText, { color: colors.mutedForeground }]}>{xpIntoLevel} / {xpPerLevel} XP</Text>
          </View>
          <View style={styles.planetRow}>
            <Text style={styles.planetIcon}>🪐</Text>
            <Text style={[styles.planetLabel, { color: colors.mutedForeground }]}>Planet  </Text>
            <Text style={[styles.planetName, { color: "#00ffd5" }]}>{currentPlanet}</Text>
          </View>
        </Pressable>

        {/* ── TODAY'S QUEST ── */}
        <Pressable
          onPress={() => router.push("/quest-briefing")}
          style={({ pressed }) => [
            styles.questCard,
            { borderColor: dailyQuestDone ? "#22c55e" : "#f59e0b", borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <LinearGradient
            colors={
              dailyQuestDone
                ? ["rgba(34,197,94,0.18)", "rgba(34,197,94,0.06)"]
                : ["rgba(245,158,11,0.22)", "rgba(245,158,11,0.06)"]
            }
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.questHeader}>
            <Text style={[styles.questTitle, { color: dailyQuestDone ? "#22c55e" : "#f59e0b" }]}>
              {dailyQuestDone ? "✓  QUEST COMPLETE" : "TODAY'S QUEST"}
            </Text>
            <Text style={[styles.questCount, { color: dailyQuestDone ? "#22c55e" : "#f59e0b" }]}>
              {questProgress}/{DAILY_GOAL}
            </Text>
          </View>
          <Text style={[styles.questDesc, { color: colors.foreground }]}>Complete {DAILY_GOAL} challenges</Text>
          <View style={styles.rewardRow}>
            <Text style={styles.rewardEmoji}>🎁</Text>
            <Text style={styles.rewardLabel}>Mystery Gear Bag</Text>
          </View>
          <View style={[styles.questBtn, { backgroundColor: dailyQuestDone ? "#16a34a" : "#b45309" }]}>
            <Text style={styles.questBtnText}>
              {dailyQuestDone ? "🎁  CLAIM REWARD" : "▶  CONTINUE QUEST"}
            </Text>
          </View>
        </Pressable>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <LinearGradient
            colors={flame ? [`${flame.color}33`, `${flame.color}0a`] : ["rgba(250,204,21,0.20)","rgba(250,204,21,0.05)"]}
            style={[styles.statTile, { borderColor: flame ? `${flame.color}55` : "#facc1566", borderRadius: colors.radius }]}
          >
            <Text style={[styles.statValue, { color: flame ? flame.color : "#facc15" }]}>{streak}</Text>
            <StreakFlameBadge streak={streak} variant="chip" />
            {xpMultiplier > 1 && (
              <View style={[styles.multChip, { borderColor: "#fbbf2466", backgroundColor: "rgba(251,191,36,0.12)" }]}>
                <Text style={[styles.multChipText, { color: "#fbbf24" }]}>⚡ {xpMultiplier}× XP</Text>
              </View>
            )}
            {streakFreezes > 0 && (
              <View style={[styles.multChip, { borderColor: "#38bdf855", backgroundColor: "rgba(56,189,248,0.10)" }]}>
                <Text style={[styles.multChipText, { color: "#38bdf8" }]}>🧊 ×{streakFreezes}</Text>
              </View>
            )}
          </LinearGradient>
          <LinearGradient colors={["rgba(34,197,94,0.20)","rgba(34,197,94,0.05)"]} style={[styles.statTile, { borderColor: "#22c55e66", borderRadius: colors.radius }]}>
            <Text style={[styles.statValue, { color: "#22c55e" }]}>{accuracy}%</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>🎯 Accuracy</Text>
          </LinearGradient>
          <LinearGradient colors={["rgba(239,68,68,0.20)","rgba(239,68,68,0.05)"]} style={[styles.statTile, { borderColor: "#ef444466", borderRadius: colors.radius }]}>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>{bossesBeaten}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Bosses</Text>
          </LinearGradient>
        </View>

        {/* ── NEXT GUARDIAN ── */}
        {nextBoss && (
          <Pressable
            onPress={() => router.push("/galaxy")}
            style={({ pressed }) => [
              styles.bossCard,
              { borderColor: bossReady ? nextBoss.accentColor : `${nextBoss.accentColor}55`, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <LinearGradient
              colors={[`${nextBoss.accentColor}28`, "rgba(5,8,22,0)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bossKicker, { color: bossReady ? "#ef4444" : nextBoss.accentColor }]}>
                {bossReady && dailyTrailComplete
                  ? "⚔  READY TO CHALLENGE"
                  : bossReady && !dailyTrailComplete
                  ? "⚔  BOSS UNLOCKED"
                  : "🌌  NEXT GUARDIAN"}
              </Text>
              <Text style={[styles.bossName, { color: colors.foreground }]}>
                {nextBoss.name}{nextBoss.nameAccent ? ` ${nextBoss.nameAccent}` : ""}
              </Text>
              <Text style={[styles.bossSub, { color: colors.mutedForeground }]}>
                {bossReady && !dailyTrailComplete
                  ? "Complete today's trail to challenge"
                  : bossReady
                  ? "Head to the Galaxy Map"
                  : challengesRemaining === 1
                  ? "1 challenge remaining"
                  : `~${challengesRemaining} challenges remaining`}
              </Text>
            </View>
            <View style={[styles.bossBadge, { backgroundColor: bossReady && !dailyTrailComplete ? "#6b7280" : nextBoss.accentColor }]}>
              <AppIcon name={bossReady && !dailyTrailComplete ? "lock" : "zap"} size={18} color="#050816" />
            </View>
          </Pressable>
        )}

        {/* ── FRETBOARD GAMES ── */}
        <Pressable
          onPress={() => router.push("/(tabs)/games")}
          style={({ pressed }) => [styles.gamesCard, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={["rgba(255,107,53,0.20)", "rgba(0,255,213,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.gamesCardTop}>
            <Text style={styles.gamesKicker}>FRETBOARD GAMES</Text>
            <Text style={styles.gamesArrow}>›</Text>
          </View>
          <Text style={[styles.gamesTitle, { color: colors.foreground }]}>Play your way to mastery</Text>
          <View style={styles.gamesPills}>
            {[
              { label: "Note Hunt", color: "#00FFD5" },
              { label: "Shape Spotter", color: "#FFD700" },
              { label: "Alien Invasion", color: "#FF6B35" },
            ].map((g) => (
              <View key={g.label} style={[styles.gamesPill, { borderColor: `${g.color}55`, backgroundColor: `${g.color}15` }]}>
                <Text style={[styles.gamesPillTxt, { color: g.color }]}>{g.label}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        {/* ── GEAR ROOM ── */}
        <Pressable
          onPress={() => router.push("/(tabs)/gear")}
          style={({ pressed }) => [styles.gearRoomCard, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={["rgba(168,85,247,0.22)", "rgba(0,255,213,0.07)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.gamesCardTop}>
            <Text style={styles.gearRoomKicker}>HALL OF LEGENDS</Text>
            <Text style={styles.gearRoomArrow}>›</Text>
          </View>
          <Text style={[styles.gamesTitle, { color: colors.foreground }]}>Your collection &amp; mystery bags</Text>
          <View style={styles.gamesPills}>
            {[
              { label: "Picks", color: "#a855f7" },
              { label: "Straps", color: "#00FFD5" },
              { label: "Cables", color: "#FFD700" },
              { label: "Open a Bag", color: "#FF6B35" },
            ].map((g) => (
              <View key={g.label} style={[styles.gamesPill, { borderColor: `${g.color}55`, backgroundColor: `${g.color}15` }]}>
                <Text style={[styles.gamesPillTxt, { color: g.color }]}>{g.label}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        {/* ── YOUR LEARNING PATH ── */}
        <Animated.Text style={[styles.pathTitle, { opacity: glowOpacity }]}>
          YOUR LEARNING PATH
        </Animated.Text>
        <Text style={styles.pathSubtitle}>
          Rob Lobasso's full curriculum — tap any available lesson to begin.
        </Text>

        {/* ── CURRICULUM SECTIONS ── */}
        {SECTIONS.map(renderSection)}


      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  // TOP BAR
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
    gap: 28,
    backgroundColor: "rgba(5,8,22,0.97)",
    borderBottomWidth: 1,
  },
  resChip: { alignItems: "center", flexDirection: "row", gap: 5 },
  resValue: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  resIcon: { fontSize: 13 },
  resLabel: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  resDivider: { width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.10)" },

  // QUOTE
  quoteCard: { paddingHorizontal: 4, paddingBottom: 10 },
  quoteText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    color: "rgba(220,210,255,0.90)",
    lineHeight: 20,
    letterSpacing: 0.2,
    textShadowColor: "#a78bfa",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // LOGO
  logoSection: { paddingTop: 4, paddingBottom: 8, alignItems: "center" },
  coatOfArms: { width: 44, height: 44, marginBottom: 4 },
  logoHorizontal: { height: 44, width: "80%", alignSelf: "center" },
  titleSub: {
    fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#b8ffd4",
    letterSpacing: 4, textTransform: "uppercase", marginTop: 2,
  },

  // PLAYER CARD
  playerCard: { borderWidth: 1.5, borderRadius: 14, padding: 12, marginBottom: 12, overflow: "hidden" },
  playerCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  playerNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  playerIcon: { fontSize: 16 },
  playerName: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  beltBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  beltDot: { width: 8, height: 8, borderRadius: 4 },
  beltBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  levelLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 5 },
  xpRow: { alignItems: "flex-end", marginTop: 3 },
  xpText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  planetRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 2 },
  planetIcon: { fontSize: 12 },
  planetLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  planetName: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 0.5 },

  // QUEST
  questCard: { borderWidth: 1, padding: 11, marginBottom: 11, overflow: "hidden" },
  questHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  questTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  questCount: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },
  questDesc: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 4 },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  rewardEmoji: { fontSize: 13 },
  rewardLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#f5c842" },
  questBtn: { borderRadius: 8, paddingVertical: 9, alignItems: "center" },
  questBtnText: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", letterSpacing: 0.5 },

  // STATS
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statTile: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
  multChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  multChipText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },

  // BOSS
  bossCard: {
    flexDirection: "row", alignItems: "center",
    padding: 16, borderWidth: 1, marginBottom: 20,
    overflow: "hidden",
  },
  bossKicker: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 3 },
  bossName: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  bossSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  bossBadge: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  // GAMES PROMO
  gamesCard: {
    borderWidth: 1, borderColor: "#FF6B3544", borderRadius: 16,
    padding: 14, marginBottom: 20, overflow: "hidden", gap: 6,
  },
  gamesCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gamesKicker: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2, color: "#FF6B35" },
  gamesArrow: { fontSize: 18, color: "#FF6B35" },
  gamesTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  gamesPills: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 2 },
  gamesPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  gamesPillTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  // GEAR ROOM PROMO
  gearRoomCard: {
    borderWidth: 1, borderColor: "#a855f744", borderRadius: 16,
    padding: 14, marginBottom: 20, overflow: "hidden", gap: 6,
  },
  gearRoomKicker: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2, color: "#a855f7" },
  gearRoomArrow: { fontSize: 18, color: "#a855f7" },

  // LEARNING PATH HEADER
  pathTitle: {
    fontSize: 20, fontFamily: "SpaceGrotesk_700Bold",
    color: "#00ffd5", letterSpacing: 2,
    marginBottom: 4,
    textShadowColor: "#00ffd5", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
  },
  pathSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.40)",
    marginBottom: 20,
    lineHeight: 18,
  },

  // SECTION ROWS
  sectionBlock: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionAccent: { width: 3, height: 18, borderRadius: 2 },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2,
  },

  // LESSON CARDS
  lessonScroll: { paddingRight: 16, gap: 10 },
  lessonCard: {
    width: 160,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    overflow: "hidden",
  },
  lessonIconWrap: {
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
    borderRadius: 10,
    marginBottom: 2,
  },
  lessonEmoji: { fontSize: 22 },
  lessonTitle: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold", lineHeight: 18 },
  lessonBlurb: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },

  // COMING SOON BADGE
  soonBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  soonText: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.40)",
    letterSpacing: 1,
  },

  // TECHNIQUE TAG CHIP
  tagChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  tagText: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
});
