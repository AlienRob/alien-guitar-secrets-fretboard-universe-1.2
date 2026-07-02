import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, dailyQuestsTable } from "@workspace/db";
import { seedQuestTemplates, ensureDailyQuests } from "../lib/agsGameLogic";
import { GetDailyQuestsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/quests/daily", async (req, res): Promise<void> => {
  const user = req.appUser!;
  await seedQuestTemplates();
  await ensureDailyQuests(user.id);

  const today = new Date().toISOString().split("T")[0];
  const quests = await db
    .select()
    .from(dailyQuestsTable)
    .where(and(eq(dailyQuestsTable.userId, user.id), eq(dailyQuestsTable.questDate, today)));

  res.json(GetDailyQuestsResponse.parse(quests.map(q => ({
    id: q.id,
    title: q.title,
    description: q.description,
    exerciseType: q.exerciseType,
    targetCount: q.targetCount,
    currentCount: q.currentCount,
    xpReward: q.xpReward,
    completed: q.completed,
  }))));
});

export default router;
