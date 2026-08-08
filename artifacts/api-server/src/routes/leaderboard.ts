import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

// GET /leaderboard — returns all users ranked by XP (no hard cap)
router.get("/leaderboard", async (req, res): Promise<void> => {
  const rawLimit = req.query.limit as string | undefined;
  const limit = rawLimit ? parseInt(rawLimit, 10) : 10000; // default: all users

  // Sort by XP descending — XP is the rank metric
  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.xp))
    .limit(limit);

  const ranked = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl,
    avatarColor: u.avatarColor,
    level: u.level,
    xp: u.xp,
    streak: u.streak,
  }));

  res.json(ranked);
});

export default router;
