import YahooFinance from "yahoo-finance2";
import { eq, and, sql } from "drizzle-orm";
import { db, stocksTable, priceHistoryTable } from "@workspace/db";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

/** How often to refresh current prices (ms) */
const PRICE_INTERVAL_MS = 60_000;

/** How many symbols to send in one Yahoo Finance batch call */
const QUOTE_BATCH_SIZE = 200;

/** Track which date we last wrote price-history rows (once per calendar day) */
let lastHistoryDate = "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ---------------------------------------------------------------------------
// Core sync
// ---------------------------------------------------------------------------

async function syncPrices(): Promise<void> {
  try {
    const stocks = await db
      .select({ id: stocksTable.id, symbol: stocksTable.symbol })
      .from(stocksTable);

    if (stocks.length === 0) return;

    const today = todayStr();
    const writeHistory = today !== lastHistoryDate;

    const batches = chunk(stocks, QUOTE_BATCH_SIZE);
    let updated = 0;

    for (const batch of batches) {
      const symbols = batch.map((s) => s.symbol);

      // Single network round-trip for the whole batch
      let quotes: Record<string, any>;
      try {
        const raw = await yahooFinance.quote(symbols, {}, { validateResult: false });
        // quote() returns an array when given an array; index by symbol
        quotes = {};
        if (Array.isArray(raw)) {
          for (const q of raw) if (q?.symbol) quotes[q.symbol] = q;
        } else if (raw && typeof raw === "object") {
          quotes[(raw as any).symbol] = raw;
        }
      } catch {
        continue; // skip batch on network error, try next cycle
      }

      // Build DB updates in parallel within the batch
      await Promise.all(
        batch.map(async (stock) => {
          const quote = quotes[stock.symbol];
          const price = quote?.regularMarketPrice;
          if (!price || price <= 0) return;

          const change = quote?.regularMarketChange ?? 0;
          const changePercent = quote?.regularMarketChangePercent ?? 0;

          await db
            .update(stocksTable)
            .set({
              price: price.toFixed(4),
              change: change.toFixed(4),
              changePercent: changePercent.toFixed(4),
              updatedAt: new Date(),
            })
            .where(eq(stocksTable.id, stock.id));

          // Price history: only once per day
          if (writeHistory) {
            const existing = await db
              .select({ id: priceHistoryTable.id })
              .from(priceHistoryTable)
              .where(
                and(
                  eq(priceHistoryTable.stockId, stock.id),
                  eq(priceHistoryTable.date, today)
                )
              )
              .limit(1);

            if (existing.length === 0) {
              await db
                .insert(priceHistoryTable)
                .values({ stockId: stock.id, date: today, price: price.toFixed(4) });
            } else {
              await db
                .update(priceHistoryTable)
                .set({ price: price.toFixed(4) })
                .where(eq(priceHistoryTable.id, existing[0].id));
            }
          }

          updated++;
        })
      );
    }

    if (writeHistory) lastHistoryDate = today;
    console.log(`[priceSync] Updated ${updated}/${stocks.length} stocks`);
  } catch (err) {
    console.error("[priceSync] Error:", err);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function startPriceSync(): void {
  const interval = Math.max(PRICE_INTERVAL_MS, 60_000);
  console.log(`[priceSync] Starting — batch size ${QUOTE_BATCH_SIZE}, interval ${interval / 1000}s`);
  void syncPrices();
  setInterval(() => void syncPrices(), interval);
}
