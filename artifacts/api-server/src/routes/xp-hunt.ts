import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { XP_HUNT_QUESTIONS } from "../data/xp-hunt-questions";
import { getLevelFromXp } from "../utils/level";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// GET /game/xp-hunt — shuffled questions from the dedicated XP Hunt bank
router.get("/game/xp-hunt", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }

  const shuffled = [...XP_HUNT_QUESTIONS].sort(() => Math.random() - 0.5);
  res.json({ questions: shuffled });
});

// POST /game/xp-hunt/collect — award XP for treasure collected
router.post("/game/xp-hunt/collect", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const { tier } = req.body as { tier: "coin" | "gem" | "trophy" };
  const XP: Record<string, number> = { coin: 75, gem: 125, trophy: 200 };
  const xpReward = XP[tier] ?? 75;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }

  const newXp    = users[0].xp + xpReward;
  const newLevel = getLevelFromXp(newXp);
  const leveledUp = newLevel > users[0].level;

  await db.update(usersTable).set({ xp: newXp, level: newLevel }).where(eq(usersTable.id, userId));
  res.json({ xpEarned: xpReward, newXp, newLevel, leveledUp });
});

export default router;
