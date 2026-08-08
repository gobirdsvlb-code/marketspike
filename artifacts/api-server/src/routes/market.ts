import { Router } from "express";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { db, stocksTable, priceHistoryTable } from "@workspace/db";

const router = Router();

// GET /market/stocks
router.get("/market/stocks", async (req, res): Promise<void> => {
  const { sector, search } = req.query as { sector?: string; search?: string };

  const conditions: SQL[] = [];
  if (sector) conditions.push(eq(stocksTable.sector, sector));
  if (search) conditions.push(ilike(stocksTable.name, `%${search}%`));

  const stocks = conditions.length > 0
    ? await db.select().from(stocksTable).where(and(...conditions))
    : await db.select().from(stocksTable);

  res.json(stocks.map(s => ({
    id: s.id,
    symbol: s.symbol,
    name: s.name,
    price: parseFloat(s.price),
    change: parseFloat(s.change),
    changePercent: parseFloat(s.changePercent),
    sector: s.sector,
    logoUrl: s.logoUrl,
    marketCap: s.marketCap,
  })));
});

// GET /market/stocks/:symbol
router.get("/market/stocks/:symbol", async (req, res): Promise<void> => {
  const symbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : req.params.symbol;

  const stocks = await db.select().from(stocksTable).where(eq(stocksTable.symbol, symbol.toUpperCase())).limit(1);
  if (!stocks[0]) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }
  const s = stocks[0];

  const history = await db
    .select()
    .from(priceHistoryTable)
    .where(eq(priceHistoryTable.stockId, s.id))
    .orderBy(priceHistoryTable.date);

  res.json({
    id: s.id,
    symbol: s.symbol,
    name: s.name,
    price: parseFloat(s.price),
    change: parseFloat(s.change),
    changePercent: parseFloat(s.changePercent),
    sector: s.sector,
    logoUrl: s.logoUrl,
    marketCap: s.marketCap,
    description: s.description,
    priceHistory: history.map(h => ({ date: h.date, price: parseFloat(h.price) })),
  });
});

export default router;
