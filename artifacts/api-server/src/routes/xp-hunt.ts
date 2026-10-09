import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { XP_HUNT_QUESTIONS } from "../data/xp-hunt-questions";
import { getLevelFromXp } from "../utils/level";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const XP_BY_TIER: Record<string, number> = { coin: 75, gem: 125, trophy: 200 };
// A real round needs two correct answers plus the walk to the treasure.
const MIN_COLLECT_INTERVAL_MS = 10_000;
const lastCollectAt = new Map<number, number>();

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
  const { tier } = (req.body ?? {}) as { tier?: string };
  if (!tier || !Object.prototype.hasOwnProperty.call(XP_BY_TIER, tier)) {
    res.status(400).json({ error: "Invalid treasure tier" });
    return;
  }
  const xpReward = XP_BY_TIER[tier];

  const now = Date.now();
  const last = lastCollectAt.get(userId) ?? 0;
  if (now - last < MIN_COLLECT_INTERVAL_MS) {
    res.status(429).json({ error: "Treasure collected too quickly" });
    return;
  }
  lastCollectAt.set(userId, now);

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }

  const newXp    = users[0].xp + xpReward;
  const newLevel = getLevelFromXp(newXp);
  const leveledUp = newLevel > users[0].level;

  await db.update(usersTable).set({ xp: newXp, level: newLevel }).where(eq(usersTable.id, userId));
  res.json({ xpEarned: xpReward, newXp, newLevel, leveledUp });
});

export default router;
