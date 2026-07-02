import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import challengesRouter from "./challenges";
import agsAchievementsRouter from "./ags-achievements";
import agsLeaderboardRouter from "./ags-leaderboard";
import questsRouter from "./quests";
import stripeRouter from "./stripe";
import leadsRouter from "./leads";
import { requireUser } from "../middlewares/requireUser";

const router: IRouter = Router();

// Public routes (no auth)
router.use(healthRouter);
router.use(leadsRouter);

// Everything below requires an authenticated user
router.use(requireUser);
router.use(profileRouter);
router.use(challengesRouter);
router.use(agsAchievementsRouter);
router.use(agsLeaderboardRouter);
router.use(questsRouter);
router.use(stripeRouter);

export default router;
