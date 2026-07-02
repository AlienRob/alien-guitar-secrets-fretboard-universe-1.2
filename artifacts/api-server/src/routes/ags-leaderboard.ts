import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetLeaderboardQueryParams, GetLeaderboardResponse } from "@workspace/api-zod";
import { computeLevel, computeBelt } from "../lib/agsGameLogic";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const params = GetLeaderboardQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;

  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.xp))
    .limit(limit);

  const entries = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    username: u.username,
    xp: u.xp,
    level: computeLevel(u.xp),
    belt: computeBelt(computeLevel(u.xp)),
  }));

  res.json(GetLeaderboardResponse.parse(entries));
});

export default router;
