import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, achievementsTable, userAchievementsTable } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// GET /achievements
router.get("/achievements", async (req, res): Promise<void> => {
  const achievements = await db.select().from(achievementsTable);
  res.json(achievements.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    xpReward: a.xpReward,
    rarity: a.rarity,
  })));
});

// GET /achievements/me
router.get("/achievements/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const earned = await db
    .select({
      id: userAchievementsTable.id,
      earnedAt: userAchievementsTable.earnedAt,
      achievementId: achievementsTable.id,
      name: achievementsTable.name,
      description: achievementsTable.description,
      icon: achievementsTable.icon,
      xpReward: achievementsTable.xpReward,
      rarity: achievementsTable.rarity,
    })
    .from(userAchievementsTable)
    .innerJoin(achievementsTable, eq(userAchievementsTable.achievementId, achievementsTable.id))
    .where(eq(userAchievementsTable.userId, userId));

  res.json(earned.map(e => ({
    id: e.id,
    earnedAt: e.earnedAt,
    achievement: {
      id: e.achievementId,
      name: e.name,
      description: e.description,
      icon: e.icon,
      xpReward: e.xpReward,
      rarity: e.rarity,
    },
  })));
});

export default router;
