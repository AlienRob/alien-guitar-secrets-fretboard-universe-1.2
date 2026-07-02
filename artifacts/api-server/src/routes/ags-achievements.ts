import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, achievementsTable } from "@workspace/db";
import { ALL_AGS_ACHIEVEMENTS } from "../lib/agsGameLogic";

const router: IRouter = Router();

router.get("/achievements", async (req, res): Promise<void> => {
  const user = req.appUser!;

  const unlocked = await db
    .select()
    .from(achievementsTable)
    .where(eq(achievementsTable.userId, user.id));

  const unlockedMap = new Map(unlocked.map(a => [a.key, a]));

  const result = ALL_AGS_ACHIEVEMENTS.map((def, idx) => {
    const record = unlockedMap.get(def.key);
    return {
      id: record?.id ?? -(idx + 1),
      key: def.key,
      title: def.title,
      description: def.description,
      category: def.category,
      xpReward: def.xpReward,
      unlockedAt: record?.unlockedAt ? record.unlockedAt.toISOString() : null,
    };
  });

  res.json(result);
});

export default router;
