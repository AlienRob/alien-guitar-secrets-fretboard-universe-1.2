import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, usersTable, challengesTable, dailyQuestsTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  GetProfileSummaryResponse,
  GetProfileStatsResponse,
  RedeemPremiumCodeBody,
  RedeemPremiumCodeResponse,
  UpdateTrailBody,
  UpdateTrailResponse,
} from "@workspace/api-zod";
import {
  computeLevel,
  computeBelt,
  computeSolarSystem,
  computePlanet,
  xpToNextLevel,
  seedQuestTemplates,
  ensureDailyQuests,
} from "../lib/agsGameLogic";
import { isPremium, hasFullAccess } from "../lib/premium";

const router: IRouter = Router();

router.get("/profile", async (req, res): Promise<void> => {
  const user = req.appUser!;
  const level = computeLevel(user.xp);
  const belt = computeBelt(level);
  const solarSystem = computeSolarSystem(level);
  const planet = computePlanet(level);

  res.json(GetProfileResponse.parse({
    id: user.id,
    username: user.username,
    xp: user.xp,
    level,
    belt,
    streak: user.streak,
    totalChallenges: user.totalSessions,
    solarSystem,
    planet,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.appUser!;

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.username !== undefined) updates.username = parsed.data.username;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, user.id))
    .returning();

  const level = computeLevel(updated.xp);
  const belt = computeBelt(level);
  const solarSystem = computeSolarSystem(level);
  const planet = computePlanet(level);

  res.json(UpdateProfileResponse.parse({
    id: updated.id,
    username: updated.username,
    xp: updated.xp,
    level,
    belt,
    streak: updated.streak,
    totalChallenges: updated.totalSessions,
    solarSystem,
    planet,
    createdAt: updated.createdAt.toISOString(),
  }));
});

router.get("/profile/summary", async (req, res): Promise<void> => {
  const user = req.appUser!;
  await seedQuestTemplates();
  await ensureDailyQuests(user.id);

  const level = computeLevel(user.xp);
  const belt = computeBelt(level);
  const solarSystem = computeSolarSystem(level);
  const planet = computePlanet(level);
  const nextLevelXp = xpToNextLevel(level, user.xp);

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [todayResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(challengesTable)
    .where(
      and(
        eq(challengesTable.userId, user.id),
        sql`${challengesTable.completedAt} >= CURRENT_DATE`
      )
    );

  const [weeklyXpResult] = await db
    .select({ total: sql<number>`coalesce(sum(${challengesTable.xpEarned}), 0)::int` })
    .from(challengesTable)
    .where(
      and(
        eq(challengesTable.userId, user.id),
        sql`${challengesTable.completedAt} >= ${weekAgo}`
      )
    );

  const [accuracyResult] = await db
    .select({
      accuracy: sql<number>`coalesce(avg(${challengesTable.score}), 0)::float`,
    })
    .from(challengesTable)
    .where(eq(challengesTable.userId, user.id));

  const quests = await db
    .select()
    .from(dailyQuestsTable)
    .where(and(eq(dailyQuestsTable.userId, user.id), eq(dailyQuestsTable.questDate, today)));

  const questsCompleted = quests.filter(q => q.completed).length;
  const questsTotal = quests.length;

  const premium = await isPremium(user);

  const trailFlags = {
    findingNotesViewed: user.trailFlags?.findingNotesViewed ?? false,
    intervalsViewed: user.trailFlags?.intervalsViewed ?? false,
    practiceStarted: user.trailFlags?.practiceStarted ?? false,
    scaleLessonViewed: user.trailFlags?.scaleLessonViewed ?? false,
    chordLessonViewed: user.trailFlags?.chordLessonViewed ?? false,
  };

  res.json(GetProfileSummaryResponse.parse({
    isPremium: premium,
    fullAccess: hasFullAccess(user),
    xp: user.xp,
    level,
    belt,
    streak: user.streak,
    totalChallenges: user.totalSessions,
    todayChallenges: todayResult?.count ?? 0,
    weeklyXp: weeklyXpResult?.total ?? 0,
    accuracyRate: accuracyResult?.accuracy ?? 0,
    solarSystem,
    planet,
    xpToNextLevel: nextLevelXp,
    questsCompleted,
    questsTotal,
    trailFlags,
  }));
});

router.patch("/profile/trail", async (req, res): Promise<void> => {
  const parsed = UpdateTrailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.appUser!;
  const merged = {
    findingNotesViewed: user.trailFlags?.findingNotesViewed ?? false,
    intervalsViewed: user.trailFlags?.intervalsViewed ?? false,
    practiceStarted: user.trailFlags?.practiceStarted ?? false,
    scaleLessonViewed: user.trailFlags?.scaleLessonViewed ?? false,
    chordLessonViewed: user.trailFlags?.chordLessonViewed ?? false,
    // Only ever flip flags to true — trail progress never goes backward.
    ...(parsed.data.findingNotesViewed ? { findingNotesViewed: true } : {}),
    ...(parsed.data.intervalsViewed ? { intervalsViewed: true } : {}),
    ...(parsed.data.practiceStarted ? { practiceStarted: true } : {}),
    ...(parsed.data.scaleLessonViewed ? { scaleLessonViewed: true } : {}),
    ...(parsed.data.chordLessonViewed ? { chordLessonViewed: true } : {}),
  };

  await db
    .update(usersTable)
    .set({ trailFlags: merged })
    .where(eq(usersTable.id, user.id));

  res.json(UpdateTrailResponse.parse(merged));
});

// Redeem a premium access code (shared by the owner with friends/testers) to
// unlock full premium without a Stripe payment. The code is configured via the
// PREMIUM_ACCESS_CODE env var; redeeming flips the user's comped_premium flag.
router.post("/profile/redeem-code", async (req, res): Promise<void> => {
  const parsed = RedeemPremiumCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A code is required." });
    return;
  }

  const expected = (process.env.PREMIUM_ACCESS_CODE ?? "").trim();
  const provided = parsed.data.code.trim();
  if (!expected || provided !== expected) {
    res.status(400).json({ error: "That access code is not valid." });
    return;
  }

  const user = req.appUser!;
  await db
    .update(usersTable)
    .set({ compedPremium: true })
    .where(eq(usersTable.id, user.id));

  res.json(RedeemPremiumCodeResponse.parse({ isPremium: true }));
});

router.get("/profile/stats", async (req, res): Promise<void> => {
  const user = req.appUser!;

  const stats = await db
    .select({
      exerciseType: challengesTable.exerciseType,
      totalChallenges: sql<number>`count(*)::int`,
      averageScore: sql<number>`avg(${challengesTable.score})::float`,
      bestScore: sql<number>`max(${challengesTable.score})::int`,
      totalCorrect: sql<number>`sum(${challengesTable.correctAnswers})::int`,
      totalQuestions: sql<number>`sum(${challengesTable.totalQuestions})::int`,
    })
    .from(challengesTable)
    .where(eq(challengesTable.userId, user.id))
    .groupBy(challengesTable.exerciseType);

  const allTypes = ["fretboard", "intervals", "scales", "chords", "ear_training"];
  const statsMap = new Map(stats.map(s => [s.exerciseType, s]));

  const result = allTypes.map(type => {
    const s = statsMap.get(type);
    return {
      exerciseType: type,
      totalChallenges: s?.totalChallenges ?? 0,
      averageScore: s?.averageScore ?? 0,
      bestScore: s?.bestScore ?? 0,
      totalCorrect: s?.totalCorrect ?? 0,
      totalQuestions: s?.totalQuestions ?? 0,
    };
  });

  res.json(GetProfileStatsResponse.parse(result));
});

export default router;
