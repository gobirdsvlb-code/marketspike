import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, holdingsTable, stocksTable, tradesTable, lessonsTable, userLessonsTable, achievementsTable, userAchievementsTable } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// GET /stats/portfolio-summary
router.get("/stats/portfolio-summary", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const startingBalance = 10000;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const cashBalance = parseFloat(users[0].balance);

  const holdings = await db
    .select({
      quantity: holdingsTable.quantity,
      avgBuyPrice: holdingsTable.avgBuyPrice,
      currentPrice: stocksTable.price,
      change: stocksTable.change,
    })
    .from(holdingsTable)
    .innerJoin(stocksTable, eq(holdingsTable.stockId, stocksTable.id))
    .where(eq(holdingsTable.userId, userId));

  const holdingsValue = holdings.reduce((sum, h) => sum + parseFloat(h.quantity) * parseFloat(h.currentPrice), 0);
  const dailyChange = holdings.reduce((sum, h) => sum + parseFloat(h.quantity) * parseFloat(h.change), 0);
  const totalValue = cashBalance + holdingsValue;
  const totalGainLoss = totalValue - startingBalance;
  const totalGainLossPercent = ((totalValue - startingBalance) / startingBalance) * 100;
  const dailyChangePercent = holdingsValue > 0 ? (dailyChange / holdingsValue) * 100 : 0;

  res.json({
    totalValue,
    holdingsValue,
    cashBalance,
    totalGainLoss,
    totalGainLossPercent,
    dailyChange,
    dailyChangePercent,
    startingBalance,
  });
});

// GET /stats/activity-feed
router.get("/stats/activity-feed", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const trades = await db
    .select({
      id: tradesTable.id,
      type: tradesTable.type,
      quantity: tradesTable.quantity,
      price: tradesTable.price,
      total: tradesTable.total,
      executedAt: tradesTable.executedAt,
      symbol: stocksTable.symbol,
      name: stocksTable.name,
    })
    .from(tradesTable)
    .innerJoin(stocksTable, eq(tradesTable.stockId, stocksTable.id))
    .where(eq(tradesTable.userId, userId))
    .orderBy(desc(tradesTable.executedAt))
    .limit(5);

  const completedLessons = await db
    .select({
      id: userLessonsTable.id,
      completedAt: userLessonsTable.completedAt,
      title: lessonsTable.title,
      icon: lessonsTable.icon,
    })
    .from(userLessonsTable)
    .innerJoin(lessonsTable, eq(userLessonsTable.lessonId, lessonsTable.id))
    .where(eq(userLessonsTable.userId, userId))
    .orderBy(desc(userLessonsTable.completedAt))
    .limit(5);

  const earnedAchievements = await db
    .select({
      id: userAchievementsTable.id,
      earnedAt: userAchievementsTable.earnedAt,
      name: achievementsTable.name,
      icon: achievementsTable.icon,
    })
    .from(userAchievementsTable)
    .innerJoin(achievementsTable, eq(userAchievementsTable.achievementId, achievementsTable.id))
    .where(eq(userAchievementsTable.userId, userId))
    .orderBy(desc(userAchievementsTable.earnedAt))
    .limit(5);

  const feed = [
    ...trades.map(t => ({
      id: `trade-${t.id}`,
      type: "trade" as const,
      title: `${t.type === "buy" ? "Bought" : "Sold"} ${t.symbol}`,
      description: `${parseFloat(t.quantity)} shares at $${parseFloat(t.price).toFixed(2)}`,
      timestamp: t.executedAt,
      icon: t.type === "buy" ? "TrendingUp" : "TrendingDown",
    })),
    ...completedLessons.map(l => ({
      id: `lesson-${l.id}`,
      type: "lesson" as const,
      title: `Completed: ${l.title}`,
      description: "Lesson finished and XP earned",
      timestamp: l.completedAt,
      icon: l.icon,
    })),
    ...earnedAchievements.map(a => ({
      id: `achievement-${a.id}`,
      type: "achievement" as const,
      title: `Achievement Unlocked: ${a.name}`,
      description: "Badge earned",
      timestamp: a.earnedAt,
      icon: a.icon,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  res.json(feed);
});

// GET /stats/market-movers
router.get("/stats/market-movers", async (req, res): Promise<void> => {
  const allStocks = await db.select().from(stocksTable);

  const mapped = allStocks.map(s => ({
    id: s.id,
    symbol: s.symbol,
    name: s.name,
    price: parseFloat(s.price),
    change: parseFloat(s.change),
    changePercent: parseFloat(s.changePercent),
    sector: s.sector,
    logoUrl: s.logoUrl,
    marketCap: s.marketCap,
  }));

  const sorted = [...mapped].sort((a, b) => b.changePercent - a.changePercent);
  const gainers = sorted.slice(0, 4);
  const losers = sorted.slice(-4).reverse();

  res.json({ gainers, losers });
});

export default router;
