import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, usersTable, challengesTable } from "@workspace/db";
import {
  ListChallengesQueryParams,
  ListChallengesResponse,
  SubmitChallengeBody,
} from "@workspace/api-zod";
import {
  computeLevel,
  computeBelt,
  computeSolarSystem,
  computePlanet,
  computeXpForChallenge,
  computeBossBonusXp,
  checkAndGrantAchievements,
  updateQuestProgress,
  seedQuestTemplates,
  ensureDailyQuests,
} from "../lib/agsGameLogic";

const router: IRouter = Router();

router.get("/challenges", async (req, res): Promise<void> => {
  const params = ListChallengesQueryParams.safeParse(req.query);
  const user = req.appUser!;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const exerciseType = params.success ? params.data.exerciseType : undefined;

  const conditions = [eq(challengesTable.userId, user.id)];
  if (exerciseType) {
    conditions.push(eq(challengesTable.exerciseType, exerciseType));
  }

  const challenges = await db
    .select()
    .from(challengesTable)
    .where(and(...conditions))
    .orderBy(desc(challengesTable.completedAt))
    .limit(limit);

  res.json(ListChallengesResponse.parse(challenges.map(c => ({
    ...c,
    completedAt: c.completedAt.toISOString(),
  }))));
});

router.post("/challenges", async (req, res): Promise<void> => {
  const parsed = SubmitChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.appUser!;
  await seedQuestTemplates();
  await ensureDailyQuests(user.id);

  const { exerciseType, totalQuestions, correctAnswers, durationSeconds, boss } = parsed.data;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const bossBonus = boss ? computeBossBonusXp(correctAnswers, totalQuestions) : 0;
  const xpEarned = computeXpForChallenge(correctAnswers, totalQuestions) + bossBonus;

  const [challenge] = await db
    .insert(challengesTable)
    .values({
      userId: user.id,
      exerciseType,
      score,
      totalQuestions,
      correctAnswers,
      durationSeconds,
      xpEarned,
    })
    .returning();

  const oldLevel = computeLevel(user.xp);
  const newXp = user.xp + xpEarned;
  const newLevel = computeLevel(newXp);
  const leveledUp = newLevel > oldLevel;
  const newBelt = computeBelt(newLevel);
  const oldBelt = computeBelt(oldLevel);
  const beltChanged = newBelt !== oldBelt;

  const today = new Date().toISOString().split("T")[0];
  const isNewDay = user.lastActiveDate !== today;
  const newStreak = isNewDay ? user.streak + 1 : user.streak;
  const newTotalSessions = user.totalSessions + 1;

  const newSolarSystem = computeSolarSystem(newLevel);
  const newPlanet = computePlanet(newLevel);

  await db
    .update(usersTable)
    .set({
      xp: newXp,
      level: newLevel,
      belt: newBelt,
      streak: newStreak,
      lastActiveDate: today,
      totalSessions: newTotalSessions,
      solarSystem: newSolarSystem,
      planet: newPlanet,
    })
    .where(eq(usersTable.id, user.id));

  const newAchievements = await checkAndGrantAchievements(user.id, {
    totalChallenges: newTotalSessions,
    xp: newXp,
    level: newLevel,
    streak: newStreak,
    score,
    exerciseType,
  });

  const questProgress = await updateQuestProgress(user.id, exerciseType);

  res.status(201).json({
    challenge: {
      ...challenge,
      completedAt: challenge.completedAt.toISOString(),
    },
    xpEarned,
    leveledUp,
    newLevel,
    newBelt: beltChanged ? newBelt : null,
    newAchievements,
    questProgress,
  });
});

router.get("/challenges/recent", async (req, res): Promise<void> => {
  const user = req.appUser!;

  const challenges = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.userId, user.id))
    .orderBy(desc(challengesTable.completedAt))
    .limit(10);

  res.json(challenges.map(c => ({
    ...c,
    completedAt: c.completedAt.toISOString(),
  })));
});

export default router;
