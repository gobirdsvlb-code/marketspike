import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, stocksTable, holdingsTable, tradesTable } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const STARTING_BALANCE = 10000;

const router = Router();

// GET /portfolio/leaderboard — rank all users by total portfolio value
router.get("/portfolio/leaderboard", async (req, res): Promise<void> => {
  const allUsers = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      avatarColor: usersTable.avatarColor,
      balance: usersTable.balance,
    })
    .from(usersTable);

  const entries = await Promise.all(
    allUsers.map(async (u) => {
      const userHoldings = await db
        .select({ quantity: holdingsTable.quantity, price: stocksTable.price, change: stocksTable.change })
        .from(holdingsTable)
        .innerJoin(stocksTable, eq(holdingsTable.stockId, stocksTable.id))
        .where(eq(holdingsTable.userId, u.id));

      const cash = parseFloat(u.balance);
      const holdingsValue = userHoldings.reduce(
        (sum, h) => sum + parseFloat(h.quantity) * parseFloat(h.price),
        0
      );
      const dailyChange = userHoldings.reduce(
        (sum, h) => sum + parseFloat(h.quantity) * parseFloat(h.change),
        0
      );
      const totalValue = cash + holdingsValue;
      const gainLoss = totalValue - STARTING_BALANCE;
      const gainLossPercent = (gainLoss / STARTING_BALANCE) * 100;

      return { userId: u.id, username: u.username, avatarUrl: u.avatarUrl, avatarColor: u.avatarColor, cash, holdingsValue, totalValue, gainLoss, gainLossPercent, dailyChange };
    })
  );

  const ranked = entries
    .sort((a, b) => b.totalValue - a.totalValue)
    .map((e, i) => ({ rank: i + 1, ...e }));

  res.json(ranked);
});

// GET /portfolio/holdings
router.get("/portfolio/holdings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const holdings = await db
    .select({
      id: holdingsTable.id,
      stockId: holdingsTable.stockId,
      quantity: holdingsTable.quantity,
      avgBuyPrice: holdingsTable.avgBuyPrice,
      symbol: stocksTable.symbol,
      name: stocksTable.name,
      logoUrl: stocksTable.logoUrl,
      currentPrice: stocksTable.price,
      todayChange: stocksTable.change,
      todayChangePercent: stocksTable.changePercent,
    })
    .from(holdingsTable)
    .innerJoin(stocksTable, eq(holdingsTable.stockId, stocksTable.id))
    .where(eq(holdingsTable.userId, userId));

  res.json(holdings.map(h => {
    const qty = parseFloat(h.quantity);
    const avgBuy = parseFloat(h.avgBuyPrice);
    const currentPrice = parseFloat(h.currentPrice);
    const currentValue = qty * currentPrice;
    const gainLoss = currentValue - qty * avgBuy;
    const gainLossPercent = avgBuy > 0 ? ((currentPrice - avgBuy) / avgBuy) * 100 : 0;
    const todayChange = parseFloat(h.todayChange ?? "0");
    const todayChangePercent = parseFloat(h.todayChangePercent ?? "0");
    return {
      id: h.id,
      stockId: h.stockId,
      symbol: h.symbol,
      name: h.name,
      logoUrl: h.logoUrl,
      quantity: qty,
      avgBuyPrice: avgBuy,
      currentPrice,
      currentValue,
      gainLoss,
      gainLossPercent,
      todayChange,          // today's $ change per share
      todayChangePercent,   // today's % change
    };
  }));
});

// GET /portfolio/trades
router.get("/portfolio/trades", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const trades = await db
    .select({
      id: tradesTable.id,
      stockId: tradesTable.stockId,
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
    .orderBy(tradesTable.executedAt);

  res.json(trades.map(t => ({
    id: t.id,
    stockId: t.stockId,
    symbol: t.symbol,
    name: t.name,
    type: t.type,
    quantity: parseFloat(t.quantity),
    price: parseFloat(t.price),
    total: parseFloat(t.total),
    executedAt: t.executedAt,
  })).reverse());
});

// POST /portfolio/trades
router.post("/portfolio/trades", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const { stockId, type, quantity } = req.body as { stockId: number; type: string; quantity: number };

  if (!stockId || !type || !quantity || quantity <= 0) {
    res.status(400).json({ error: "Invalid trade parameters" });
    return;
  }

  const stocks = await db.select().from(stocksTable).where(eq(stocksTable.id, stockId)).limit(1);
  if (!stocks[0]) {
    res.status(400).json({ error: "Stock not found" });
    return;
  }
  const stock = stocks[0];
  const price = parseFloat(stock.price);
  const total = price * quantity;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) {
    res.status(400).json({ error: "User not found" });
    return;
  }
  const user = users[0];
  const balance = parseFloat(user.balance);

  if (type === "buy") {
    if (balance < total) {
      res.status(400).json({ error: "Insufficient funds" });
      return;
    }

    await db
      .update(usersTable)
      .set({ balance: (balance - total).toFixed(2) })
      .where(eq(usersTable.id, userId));

    const existingHoldings = await db
      .select()
      .from(holdingsTable)
      .where(and(eq(holdingsTable.userId, userId), eq(holdingsTable.stockId, stockId)))
      .limit(1);

    if (existingHoldings[0]) {
      const existing = existingHoldings[0];
      const existingQty = parseFloat(existing.quantity);
      const existingAvg = parseFloat(existing.avgBuyPrice);
      const newQty = existingQty + quantity;
      const newAvg = ((existingQty * existingAvg) + (quantity * price)) / newQty;
      await db
        .update(holdingsTable)
        .set({ quantity: newQty.toString(), avgBuyPrice: newAvg.toFixed(4) })
        .where(eq(holdingsTable.id, existing.id));
    } else {
      await db.insert(holdingsTable).values({
        userId,
        stockId,
        quantity: quantity.toString(),
        avgBuyPrice: price.toFixed(4),
      });
    }

    await db
      .update(usersTable)
      .set({ xp: user.xp + 10 })
      .where(eq(usersTable.id, userId));

  } else if (type === "sell") {
    const existingHoldings = await db
      .select()
      .from(holdingsTable)
      .where(and(eq(holdingsTable.userId, userId), eq(holdingsTable.stockId, stockId)))
      .limit(1);

    if (!existingHoldings[0] || parseFloat(existingHoldings[0].quantity) < quantity) {
      res.status(400).json({ error: "Insufficient shares to sell" });
      return;
    }

    const existing = existingHoldings[0];
    const existingQty = parseFloat(existing.quantity);
    const newQty = existingQty - quantity;

    if (newQty <= 0.0001) {
      await db.delete(holdingsTable).where(eq(holdingsTable.id, existing.id));
    } else {
      await db
        .update(holdingsTable)
        .set({ quantity: newQty.toString() })
        .where(eq(holdingsTable.id, existing.id));
    }

    await db
      .update(usersTable)
      .set({ balance: (balance + total).toFixed(2) })
      .where(eq(usersTable.id, userId));

    await db
      .update(usersTable)
      .set({ xp: user.xp + 5 })
      .where(eq(usersTable.id, userId));
  } else {
    res.status(400).json({ error: "Invalid trade type" });
    return;
  }

  const inserted = await db.insert(tradesTable).values({
    userId,
    stockId,
    type,
    quantity: quantity.toString(),
    price: price.toFixed(4),
    total: total.toFixed(4),
  }).returning();

  const t = inserted[0];
  res.status(201).json({
    id: t.id,
    stockId: t.stockId,
    symbol: stock.symbol,
    name: stock.name,
    type: t.type,
    quantity: parseFloat(t.quantity),
    price: parseFloat(t.price),
    total: parseFloat(t.total),
    executedAt: t.executedAt,
  });
});

export default router;
