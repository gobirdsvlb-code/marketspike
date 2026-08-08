import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function serializeUser(u: typeof usersTable.$inferSelect) {
  const today = todayDate();
  const lives = u.livesResetDate !== today ? 5 : u.lives;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    avatarUrl: u.avatarUrl,
    avatarColor: u.avatarColor,
    bio: u.bio,
    balance: parseFloat(u.balance),
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    lives,
    coins: u.coins,
    tier: u.tier,
    unlockedColors: JSON.parse(u.unlockedColors || "[]") as string[],
    createdAt: u.createdAt,
  };
}

// GET /auth/me — kept for backward compat; returns the local user for the current Clerk session
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }
  res.json(serializeUser(users[0]));
});

export default router;
