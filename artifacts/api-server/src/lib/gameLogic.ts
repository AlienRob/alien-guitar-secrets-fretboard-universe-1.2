import { eq } from "drizzle-orm";
import { db, usersTable, achievementsTable } from "@workspace/db";

export function computeLevel(xp: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (xp >= xpNeeded + level * 100) {
    xpNeeded += level * 100;
    level++;
    if (level >= 50) break;
  }
  return level;
}

export function computeXpForSession(correctAnswers: number, totalQuestions: number, score: number): number {
  const baseXp = Math.round(50 * (correctAnswers / Math.max(totalQuestions, 1)));
  const perfectBonus = score === 100 ? 20 : 0;
  return baseXp + perfectBonus;
}

const DEFAULT_USERNAME = "Guitarist";

export async function getOrCreateDefaultUser() {
  const users = await db.select().from(usersTable).limit(1);
  if (users.length > 0) return users[0];

  const [newUser] = await db
    .insert(usersTable)
    .values({ username: DEFAULT_USERNAME })
    .returning();
  return newUser;
}

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  iconEmoji: string;
  check: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  totalSessions: number;
  xp: number;
  level: number;
  streak: number;
  score: number;
  exerciseType: string;
}

export const ALL_ACHIEVEMENTS: Omit<AchievementDef, "check">[] = [
  { key: "first_session", title: "First Jam", description: "Complete your first practice session", iconEmoji: "🎸" },
  { key: "perfect_score", title: "Perfect Run", description: "Get a perfect score on any exercise", iconEmoji: "⭐" },
  { key: "sessions_5", title: "Getting Warmed Up", description: "Complete 5 practice sessions", iconEmoji: "🔥" },
  { key: "sessions_25", title: "Dedicated Practitioner", description: "Complete 25 practice sessions", iconEmoji: "💪" },
  { key: "sessions_100", title: "Guitar Legend", description: "Complete 100 practice sessions", iconEmoji: "🏆" },
  { key: "fretboard_10", title: "Fretboard Navigator", description: "Complete 10 fretboard exercises", iconEmoji: "🎵" },
  { key: "interval_10", title: "Interval Master", description: "Complete 10 interval exercises", iconEmoji: "🎼" },
  { key: "scale_10", title: "Scale Wizard", description: "Complete 10 scale exercises", iconEmoji: "🧙" },
  { key: "chord_10", title: "Chord King", description: "Complete 10 chord exercises", iconEmoji: "👑" },
  { key: "streak_3", title: "On A Roll", description: "Maintain a 3-day practice streak", iconEmoji: "📅" },
  { key: "streak_7", title: "Week Warrior", description: "Maintain a 7-day practice streak", iconEmoji: "⚡" },
  { key: "level_5", title: "Rising Star", description: "Reach level 5", iconEmoji: "🌟" },
  { key: "level_10", title: "Pro Player", description: "Reach level 10", iconEmoji: "🎓" },
  { key: "xp_500", title: "XP Collector", description: "Earn 500 total XP", iconEmoji: "💎" },
];

const ACHIEVEMENT_CHECKS: Record<string, (ctx: AchievementContext) => boolean> = {
  first_session: (ctx) => ctx.totalSessions >= 1,
  perfect_score: (ctx) => ctx.score === 100,
  sessions_5: (ctx) => ctx.totalSessions >= 5,
  sessions_25: (ctx) => ctx.totalSessions >= 25,
  sessions_100: (ctx) => ctx.totalSessions >= 100,
  fretboard_10: (ctx) => ctx.exerciseType === "fretboard_notes" && ctx.totalSessions >= 10,
  interval_10: (ctx) => ctx.exerciseType === "intervals" && ctx.totalSessions >= 10,
  scale_10: (ctx) => ctx.exerciseType === "scales" && ctx.totalSessions >= 10,
  chord_10: (ctx) => ctx.exerciseType === "chords" && ctx.totalSessions >= 10,
  streak_3: (ctx) => ctx.streak >= 3,
  streak_7: (ctx) => ctx.streak >= 7,
  level_5: (ctx) => ctx.level >= 5,
  level_10: (ctx) => ctx.level >= 10,
  xp_500: (ctx) => ctx.xp >= 500,
};

export async function checkAchievements(
  userId: number,
  ctx: AchievementContext
): Promise<Array<{ id: number; key: string; title: string; description: string; iconEmoji: string; unlockedAt: string | null }>> {
  const existing = await db
    .select()
    .from(achievementsTable)
    .where(eq(achievementsTable.userId, userId));

  const existingKeys = new Set(existing.map(a => a.key));
  const newlyUnlocked: typeof existing = [];

  for (const def of ALL_ACHIEVEMENTS) {
    if (existingKeys.has(def.key)) continue;
    const checkFn = ACHIEVEMENT_CHECKS[def.key];
    if (checkFn && checkFn(ctx)) {
      const [inserted] = await db
        .insert(achievementsTable)
        .values({
          userId,
          key: def.key,
          title: def.title,
          description: def.description,
          iconEmoji: def.iconEmoji,
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
    iconEmoji: a.iconEmoji,
    unlockedAt: a.unlockedAt ? a.unlockedAt.toISOString() : null,
  }));
}
