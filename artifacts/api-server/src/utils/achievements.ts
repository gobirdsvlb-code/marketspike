import { and, count, eq, isNotNull, or } from "drizzle-orm";
import {
  db,
  achievementsTable,
  userAchievementsTable,
  usersTable,
  tradesTable,
  holdingsTable,
  userLessonsTable,
  friendsTable,
} from "@workspace/db";
import { getLevelFromXp } from "./level";

interface Stats {
  trades: number;
  holdings: number;
  lessons: number;
  riverRuns: number;
  streak: number;
  level: number;
  friends: number;
}

interface Definition {
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  earned: (s: Stats) => boolean;
}

export const ACHIEVEMENTS: Definition[] = [
  { name: "First Trade", description: "Make your first trade", icon: "TrendingUp", xpReward: 50, rarity: "common", earned: s => s.trades >= 1 },
  { name: "Active Trader", description: "Make 10 trades", icon: "Activity", xpReward: 150, rarity: "rare", earned: s => s.trades >= 10 },
  { name: "Diversified", description: "Hold 5 different stocks at once", icon: "Briefcase", xpReward: 150, rarity: "rare", earned: s => s.holdings >= 5 },
  { name: "First Lesson", description: "Complete your first lesson", icon: "BookOpen", xpReward: 50, rarity: "common", earned: s => s.lessons >= 1 },
  { name: "Scholar", description: "Complete 10 lessons", icon: "GraduationCap", xpReward: 300, rarity: "epic", earned: s => s.lessons >= 10 },
  { name: "River Crosser", description: "Finish your first River Crossing", icon: "Star", xpReward: 50, rarity: "common", earned: s => s.riverRuns >= 1 },
  { name: "River Master", description: "Finish 10 River Crossings", icon: "Trophy", xpReward: 300, rarity: "epic", earned: s => s.riverRuns >= 10 },
  { name: "On Fire", description: "Reach a 7-day streak", icon: "Flame", xpReward: 150, rarity: "rare", earned: s => s.streak >= 7 },
  { name: "Unstoppable", description: "Reach a 30-day streak", icon: "Shield", xpReward: 500, rarity: "legendary", earned: s => s.streak >= 30 },
  { name: "Rising Star", description: "Reach level 10", icon: "Cpu", xpReward: 200, rarity: "rare", earned: s => s.level >= 10 },
  { name: "Team Player", description: "Make your first friend", icon: "DollarSign", xpReward: 50, rarity: "common", earned: s => s.friends >= 1 },
];

async function ensureCatalog(): Promise<Map<string, number>> {
  const existing = await db.select().from(achievementsTable);
  const byName = new Map(existing.map(a => [a.name, a.id]));
  for (const def of ACHIEVEMENTS) {
    if (byName.has(def.name)) continue;
    const [row] = await db
      .insert(achievementsTable)
      .values({ name: def.name, description: def.description, icon: def.icon, xpReward: def.xpReward, rarity: def.rarity })
      .returning();
    byName.set(def.name, row.id);
  }
  return byName;
}

async function loadStats(userId: number): Promise<Stats | null> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return null;

  const [[trades], [holdings], [lessons], [friends]] = await Promise.all([
    db.select({ n: count() }).from(tradesTable).where(eq(tradesTable.userId, userId)),
    db.select({ n: count() }).from(holdingsTable).where(eq(holdingsTable.userId, userId)),
    db.select({ n: count() }).from(userLessonsTable)
      .where(and(eq(userLessonsTable.userId, userId), isNotNull(userLessonsTable.completedAt))),
    db.select({ n: count() }).from(friendsTable)
      .where(and(
        or(eq(friendsTable.userId, userId), eq(friendsTable.friendId, userId)),
        eq(friendsTable.status, "accepted"),
      )),
  ]);

  return {
    trades: trades.n,
    holdings: holdings.n,
    lessons: lessons.n,
    riverRuns: user.riverCompletions ?? 0,
    streak: user.streak,
    level: user.level,
    friends: friends.n,
  };
}

/**
 * Award any achievements the user now qualifies for (and their XP).
 * Never throws — callers are in the middle of unrelated requests.
 */
export async function checkAchievements(userId: number): Promise<string[]> {
  try {
    const stats = await loadStats(userId);
    if (!stats) return [];

    const catalog = await ensureCatalog();
    const owned = await db
      .select({ achievementId: userAchievementsTable.achievementId })
      .from(userAchievementsTable)
      .where(eq(userAchievementsTable.userId, userId));
    const ownedIds = new Set(owned.map(o => o.achievementId));

    const newlyEarned: string[] = [];
    let bonusXp = 0;
    for (const def of ACHIEVEMENTS) {
      const id = catalog.get(def.name);
      if (id === undefined || ownedIds.has(id) || !def.earned(stats)) continue;
      await db.insert(userAchievementsTable).values({ userId, achievementId: id });
      bonusXp += def.xpReward;
      newlyEarned.push(def.name);
    }

    if (bonusXp > 0) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      if (user) {
        const xp = user.xp + bonusXp;
        await db.update(usersTable).set({ xp, level: getLevelFromXp(xp) }).where(eq(usersTable.id, userId));
      }
    }
    return newlyEarned;
  } catch (err) {
    console.error("[achievements] check failed:", err);
    return [];
  }
}
