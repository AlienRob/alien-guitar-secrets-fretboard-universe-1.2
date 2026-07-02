import { eq, and } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { db, usersTable, achievementsTable, challengesTable, dailyQuestsTable, questTemplatesTable } from "@workspace/db";

export function computeLevel(xp: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (xp >= xpNeeded + level * 150) {
    xpNeeded += level * 150;
    level++;
    if (level >= 100) break;
  }
  return level;
}

export function xpToNextLevel(level: number, xp: number): number {
  let accumulated = 0;
  for (let l = 1; l < level; l++) {
    accumulated += l * 150;
  }
  const needed = level * 150;
  return needed - (xp - accumulated);
}

export function computeBelt(level: number): string {
  if (level >= 90) return "galactic_master";
  if (level >= 80) return "alien_master";
  if (level >= 70) return "black";
  if (level >= 60) return "brown";
  if (level >= 50) return "purple";
  if (level >= 40) return "blue";
  if (level >= 30) return "green";
  if (level >= 20) return "orange";
  if (level >= 10) return "yellow";
  return "white";
}

export function computeSolarSystem(level: number): number {
  return Math.ceil(level / 10);
}

export function computePlanet(level: number): number {
  return ((level - 1) % 6) + 1;
}

export function computeXpForChallenge(correctAnswers: number, totalQuestions: number): number {
  const accuracy = correctAnswers / Math.max(totalQuestions, 1);
  // Daily practice drills give modest XP on purpose: guitars unlock by LEVEL, so
  // keeping XP low makes guitars a slow, long-term climb. Picks, straps and
  // pedals come from session and streak milestones instead, so everyday practice
  // still pays off quickly without handing out guitars too fast.
  const baseXp = Math.round(20 * accuracy);
  const perfectBonus = accuracy === 1 ? 5 : 0;
  return baseXp + perfectBonus;
}

// Boss Battles are the big-payout milestone moments: clearing a boss should
// noticeably move the player's level (and often promote their belt). The bonus
// scales with accuracy so a clean win pays the most, and is only added on top of
// the normal challenge XP when `boss` is set — ordinary drills are untouched, so
// the slow guitars-by-level climb is preserved.
export const BOSS_XP_BONUS = 400;

// A boss is only "defeated" at 80% accuracy or better. We re-check the threshold
// here on the server so the big bonus is never awarded for a sub-pass run even if
// a client mislabels a losing attempt as a boss win.
export const BOSS_PASS_PCT = 80;

export function computeBossBonusXp(correctAnswers: number, totalQuestions: number): number {
  const accuracy = correctAnswers / Math.max(totalQuestions, 1);
  if (accuracy * 100 < BOSS_PASS_PCT) return 0;
  return Math.round(BOSS_XP_BONUS * accuracy);
}

// Resolve the app user row for an authenticated Clerk user, creating it on
// first sign-in. The username is derived from the Clerk profile and made unique
// against the `username` unique constraint.
export async function getOrCreateUserByClerkId(clerkId: string) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  if (existing.length > 0) return existing[0];

  let base = "Guitarist";
  try {
    const cu = await clerkClient.users.getUser(clerkId);
    base =
      cu.firstName ||
      cu.username ||
      cu.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "Guitarist";
  } catch {
    // Clerk lookup failed — fall back to the generic base name.
  }

  let username = base;
  for (let attempt = 0; attempt < 50; attempt++) {
    const taken = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (taken.length === 0) break;
    username = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const [newUser] = await db
    .insert(usersTable)
    .values({ username, clerkId })
    .returning();
  return newUser;
}

export interface AchievementContext {
  totalChallenges: number;
  xp: number;
  level: number;
  streak: number;
  score: number;
  exerciseType: string;
}

export const ALL_AGS_ACHIEVEMENTS = [
  { key: "first_challenge", title: "First Contact", description: "Complete your first challenge", category: "general", xpReward: 50, iconEmoji: "🛸", check: (c: AchievementContext) => c.totalChallenges >= 1 },
  { key: "perfect_score", title: "Alien Precision", description: "Achieve a perfect score on any challenge", category: "general", xpReward: 100, iconEmoji: "⭐", check: (c: AchievementContext) => c.score === 100 },
  { key: "challenges_10", title: "Initiate", description: "Complete 10 challenges", category: "general", xpReward: 75, iconEmoji: "🎸", check: (c: AchievementContext) => c.totalChallenges >= 10 },
  { key: "challenges_50", title: "Cadet", description: "Complete 50 challenges", category: "general", xpReward: 150, iconEmoji: "💪", check: (c: AchievementContext) => c.totalChallenges >= 50 },
  { key: "challenges_100", title: "Commander", description: "Complete 100 challenges", category: "general", xpReward: 300, iconEmoji: "🏆", check: (c: AchievementContext) => c.totalChallenges >= 100 },
  { key: "fretboard_master", title: "Fretboard Cartographer", description: "Complete 10 fretboard challenges", category: "fretboard", xpReward: 100, iconEmoji: "🗺️", check: (c: AchievementContext) => c.exerciseType === "fretboard" && c.totalChallenges >= 10 },
  { key: "interval_master", title: "Interval Architect", description: "Complete 10 interval challenges", category: "intervals", xpReward: 100, iconEmoji: "📐", check: (c: AchievementContext) => c.exerciseType === "intervals" && c.totalChallenges >= 10 },
  { key: "scale_master", title: "Scale Sorcerer", description: "Complete 10 scale challenges", category: "scales", xpReward: 100, iconEmoji: "🔮", check: (c: AchievementContext) => c.exerciseType === "scales" && c.totalChallenges >= 10 },
  { key: "chord_master", title: "Chord Alchemist", description: "Complete 10 chord challenges", category: "chords", xpReward: 100, iconEmoji: "⚗️", check: (c: AchievementContext) => c.exerciseType === "chords" && c.totalChallenges >= 10 },
  { key: "streak_3", title: "Orbital Lock", description: "Maintain a 3-day streak", category: "streak", xpReward: 75, iconEmoji: "🌀", check: (c: AchievementContext) => c.streak >= 3 },
  { key: "streak_7", title: "Cosmic Consistency", description: "Maintain a 7-day streak", category: "streak", xpReward: 200, iconEmoji: "⚡", check: (c: AchievementContext) => c.streak >= 7 },
  { key: "streak_30", title: "Galactic Devotion", description: "Maintain a 30-day streak", category: "streak", xpReward: 500, iconEmoji: "🌌", check: (c: AchievementContext) => c.streak >= 30 },
  { key: "level_5", title: "Planet Hopper", description: "Reach level 5", category: "level", xpReward: 100, iconEmoji: "🪐", check: (c: AchievementContext) => c.level >= 5 },
  { key: "level_10", title: "Solar Explorer", description: "Reach level 10", category: "level", xpReward: 200, iconEmoji: "☀️", check: (c: AchievementContext) => c.level >= 10 },
  { key: "level_25", title: "Galactic Wanderer", description: "Reach level 25", category: "level", xpReward: 400, iconEmoji: "🌟", check: (c: AchievementContext) => c.level >= 25 },
  { key: "level_50", title: "Star Lord", description: "Reach level 50", category: "level", xpReward: 750, iconEmoji: "👑", check: (c: AchievementContext) => c.level >= 50 },
  { key: "belt_yellow", title: "Yellow Belt Unlocked", description: "Earn the Yellow Belt — level 10", category: "belt", xpReward: 100, iconEmoji: "🥋", check: (c: AchievementContext) => c.level >= 10 },
  { key: "belt_blue", title: "Blue Belt Unlocked", description: "Earn the Blue Belt — level 40", category: "belt", xpReward: 300, iconEmoji: "💙", check: (c: AchievementContext) => c.level >= 40 },
  { key: "belt_black", title: "Black Belt Unlocked", description: "Reach Black Belt mastery — level 70", category: "belt", xpReward: 600, iconEmoji: "⬛", check: (c: AchievementContext) => c.level >= 70 },
];

export async function checkAndGrantAchievements(userId: number, ctx: AchievementContext) {
  const existing = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId));
  const existingKeys = new Set(existing.map(a => a.key));
  const newlyUnlocked = [];

  for (const def of ALL_AGS_ACHIEVEMENTS) {
    if (existingKeys.has(def.key)) continue;
    if (def.check(ctx)) {
      const [inserted] = await db
        .insert(achievementsTable)
        .values({
          userId,
          key: def.key,
          title: def.title,
          description: def.description,
          iconEmoji: def.iconEmoji,
          category: def.category,
          xpReward: def.xpReward,
          unlockedAt: new Date(),
        })
        .returning();
      newlyUnlocked.push(inserted);
    }
  }

  return newlyUnlocked.map(a => ({
    id: a.id,
    key: a.key,
    title: a.title,
    description: a.description,
    category: a.category,
    xpReward: a.xpReward,
    unlockedAt: a.unlockedAt ? a.unlockedAt.toISOString() : null,
  }));
}

const QUEST_TEMPLATES = [
  { title: "Fretboard Scan", description: "Complete 3 fretboard challenges", exerciseType: "fretboard", targetCount: 3, xpReward: 75 },
  { title: "Interval Training", description: "Complete 3 interval challenges", exerciseType: "intervals", targetCount: 3, xpReward: 75 },
  { title: "Scale Discovery", description: "Complete 3 scale challenges", exerciseType: "scales", targetCount: 3, xpReward: 75 },
  { title: "Chord Mastery", description: "Complete 3 chord challenges", exerciseType: "chords", targetCount: 3, xpReward: 75 },
  { title: "Daily Warmup", description: "Complete any 2 challenges today", exerciseType: "any", targetCount: 2, xpReward: 50 },
  { title: "Mission Sprint", description: "Complete any 5 challenges today", exerciseType: "any", targetCount: 5, xpReward: 100 },
];

export async function ensureDailyQuests(userId: number): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const existing = await db
    .select()
    .from(dailyQuestsTable)
    .where(and(eq(dailyQuestsTable.userId, userId), eq(dailyQuestsTable.questDate, today)));

  if (existing.length > 0) return;

  const templates = await db.select().from(questTemplatesTable);
  const chosen = templates.slice(0, 3);

  if (chosen.length === 0) return;

  await db.insert(dailyQuestsTable).values(
    chosen.map(t => ({
      userId,
      templateId: t.id,
      title: t.title,
      description: t.description,
      exerciseType: t.exerciseType,
      targetCount: t.targetCount,
      currentCount: 0,
      xpReward: t.xpReward,
      completed: false,
      questDate: today,
    }))
  );
}

export async function updateQuestProgress(userId: number, exerciseType: string): Promise<Array<{ questId: number; title: string; completed: boolean; currentCount: number; targetCount: number }>> {
  const today = new Date().toISOString().split("T")[0];

  const quests = await db
    .select()
    .from(dailyQuestsTable)
    .where(and(eq(dailyQuestsTable.userId, userId), eq(dailyQuestsTable.questDate, today)));

  const updatedQuests = [];
  for (const quest of quests) {
    if (quest.completed) {
      updatedQuests.push({ questId: quest.id, title: quest.title, completed: true, currentCount: quest.currentCount, targetCount: quest.targetCount });
      continue;
    }
    const matches = quest.exerciseType === "any" || quest.exerciseType === exerciseType;
    if (!matches) {
      updatedQuests.push({ questId: quest.id, title: quest.title, completed: false, currentCount: quest.currentCount, targetCount: quest.targetCount });
      continue;
    }

    const newCount = quest.currentCount + 1;
    const nowCompleted = newCount >= quest.targetCount;

    await db
      .update(dailyQuestsTable)
      .set({ currentCount: newCount, completed: nowCompleted })
      .where(eq(dailyQuestsTable.id, quest.id));

    updatedQuests.push({ questId: quest.id, title: quest.title, completed: nowCompleted, currentCount: newCount, targetCount: quest.targetCount });
  }

  return updatedQuests;
}

export async function seedQuestTemplates(): Promise<void> {
  const existing = await db.select().from(questTemplatesTable).limit(1);
  if (existing.length > 0) return;

  await db.insert(questTemplatesTable).values(QUEST_TEMPLATES);
}
