import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getLevelFromXp, streakBonus } from "../utils/level";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

function todayDate() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export const PREMIUM_AVATARS = [
  '🦁','🐯','🦊','🐺','🦄','🐲','🦅','🐬','🦖','🤖','👾','🔥','⚡','💎','🎭',
];
export const AVATAR_COST_BASE = 10_000; // price of 1st emoji; each subsequent unlock costs +10,000 more
export const AVATAR_COST  = AVATAR_COST_BASE; // kept for back-compat imports
export const CAMERA_COST  = 100_000;

// Keep for back-compat (buy-color endpoint still exists)
export const PREMIUM_COLORS: string[] = [];
export const COLOR_COST = 100;

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

// GET /users/list — public directory of all users
router.get("/users/list", async (req, res): Promise<void> => {
  const q = ((req.query.q as string) || "").trim().toLowerCase();
  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      avatarColor: usersTable.avatarColor,
      xp: usersTable.xp,
      level: usersTable.level,
      streak: usersTable.streak,
    })
    .from(usersTable)
    .orderBy(usersTable.username);

  const filtered = q
    ? users.filter((u) => u.username.toLowerCase().includes(q))
    : users;

  res.json(filtered);
});

// GET /users/profile/:username — public profile for any user
router.get("/users/profile/:username", async (req, res): Promise<void> => {
  const username = req.params.username as string;
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!rows[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const u = rows[0];
  res.json({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl,
    avatarColor: u.avatarColor,
    bio: u.bio,
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    createdAt: u.createdAt,
  });
});

// GET /users/me
router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }

  // Auto-reset lives if day has changed
  const today = todayDate();
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (users[0].livesResetDate !== today) {
    updates.lives = 5;
    updates.livesResetDate = today;
    users[0].lives = 5;
    users[0].livesResetDate = today;
  }

  // Auto-correct level if XP formula changed
  const correctLevel = getLevelFromXp(users[0].xp);
  if (correctLevel !== users[0].level) {
    updates.level = correctLevel;
    users[0].level = correctLevel;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));
  }

  res.json(serializeUser(users[0]));
});

// PATCH /users/me
router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const { username, avatarUrl, avatarColor, bio } = req.body as {
    username?: string; avatarUrl?: string; avatarColor?: string; bio?: string;
  };
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (username) updates.username = username;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (avatarColor) updates.avatarColor = avatarColor;
  if (bio !== undefined) updates.bio = bio;

  const updated = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!updated[0]) { res.status(404).json({ error: "User not found" }); return; }
  res.json(serializeUser(updated[0]));
});

// POST /users/daily-checkin — award streak XP once per day
router.post("/users/daily-checkin", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const today = todayDate();
  const d = new Date(); d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().slice(0, 10);

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }
  const u = users[0];

  if (u.lastLoginDate === today) {
    res.json({ alreadyCheckedIn: true, xpEarned: 0, streak: u.streak, newLevel: u.level, leveledUp: false });
    return;
  }

  // Determine new streak
  let newStreak: number;
  if (u.lastLoginDate === yesterday) {
    newStreak = u.streak + 1;      // consecutive day
  } else if (u.lastLoginDate === "") {
    newStreak = 1;                  // first ever login
  } else {
    newStreak = 1;                  // streak broken — restart
  }

  const xpEarned = streakBonus(newStreak);
  const newXp    = u.xp + xpEarned;
  const newLevel = getLevelFromXp(newXp);
  const leveledUp = newLevel > u.level;

  // Daily coin grant by tier
  const tierCoins: Record<string, number> = { free: 0, pro: 400, elite: 900 };
  const coinsEarned = tierCoins[u.tier] ?? 0;
  const newCoins = u.coins + coinsEarned;

  await db.update(usersTable)
    .set({ lastLoginDate: today, streak: newStreak, xp: newXp, level: newLevel, coins: newCoins })
    .where(eq(usersTable.id, userId));

  res.json({ alreadyCheckedIn: false, xpEarned, streak: newStreak, newLevel, leveledUp, coinsEarned, newCoins });
});

// POST /users/me/buy-avatar — purchase a premium emoji avatar or unlock camera
router.post("/users/me/buy-avatar", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const { avatarId } = req.body as { avatarId: string }; // emoji string OR "camera"

  const isCamera = avatarId === "camera";
  const isValidEmoji = PREMIUM_AVATARS.includes(avatarId);
  if (!isCamera && !isValidEmoji) {
    res.status(400).json({ error: "Not a valid premium avatar" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }
  const u = users[0];

  const unlocked: string[] = JSON.parse(u.unlockedColors || "[]");
  if (unlocked.includes(avatarId)) {
    res.status(400).json({ error: "Avatar already unlocked" });
    return;
  }

  // Emoji cost escalates: 10,000 × (number of emojis already unlocked + 1)
  const emojiUnlockedCount = unlocked.filter((a: string) => a !== 'camera').length;
  const cost = isCamera ? CAMERA_COST : AVATAR_COST_BASE * (emojiUnlockedCount + 1);
  if (u.coins < cost) {
    res.status(400).json({ error: `Not enough coins (need ${cost.toLocaleString()})` });
    return;
  }

  const newUnlocked = [...unlocked, avatarId];
  const newCoins = u.coins - cost;
  await db.update(usersTable)
    .set({ coins: newCoins, unlockedColors: JSON.stringify(newUnlocked) })
    .where(eq(usersTable.id, userId));

  res.json({ success: true, coins: newCoins, unlockedAvatars: newUnlocked });
});

// POST /users/me/use-life  — deduct one life on wrong answer
router.post("/users/me/use-life", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const today = todayDate();
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }

  let lives = users[0].livesResetDate !== today ? 5 : users[0].lives;
  if (lives > 0) lives -= 1;

  await db.update(usersTable).set({ lives, livesResetDate: today }).where(eq(usersTable.id, userId));
  res.json({ lives, outOfLives: lives === 0 });
});

export default router;
