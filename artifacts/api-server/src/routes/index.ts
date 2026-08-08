import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import friendsRouter from "./friends";
import gameRouter from "./game";
import marketRouter from "./market";
import portfolioRouter from "./portfolio";
import learnRouter from "./learn";
import questionsRouter from "./questions";
import achievementsRouter from "./achievements";
import leaderboardRouter from "./leaderboard";
import statsRouter from "./stats";
import xpHuntRouter from "./xp-hunt";
import coinsRouter from "./coins";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(friendsRouter);
router.use(gameRouter);
router.use(marketRouter);
router.use(portfolioRouter);
router.use(learnRouter);
router.use(questionsRouter);
router.use(achievementsRouter);
router.use(leaderboardRouter);
router.use(statsRouter);
router.use(xpHuntRouter);
router.use(coinsRouter);

export default router;
