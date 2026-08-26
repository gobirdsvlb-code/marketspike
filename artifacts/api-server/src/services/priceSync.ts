import { eq, and } from "drizzle-orm";
import { db, stocksTable, priceHistoryTable } from "@workspace/db";

/** Milliseconds between Finnhub calls — free plan allows 60 req/min */
const RATE_LIMIT_DELAY_MS = 1100;

/** How often to start a new sync cycle */
const PRICE_INTERVAL_MS = 120_000;

/** Track which calendar date we last wrote price-history rows */
let lastHistoryDate = "";

/** Prevent overlapping sync cycles */
let syncRunning = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchQuote(
  symbol: string,
  apiKey: string
): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { c: number; d: number; dp: number };
    if (!data.c || data.c <= 0) return null;
    return { price: data.c, change: data.d ?? 0, changePercent: data.dp ?? 0 };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core sync
// ---------------------------------------------------------------------------

async function syncPrices(): Promise<void> {
  if (syncRunning) return; // skip if a previous cycle is still running
  syncRunning = true;
  try {
    const apiKey = process.env["FINNHUB_API_KEY"];
    if (!apiKey) {
      console.warn("[priceSync] FINNHUB_API_KEY not set — skipping sync");
      return;
    }

    const stocks = await db
      .select({ id: stocksTable.id, symbol: stocksTable.symbol })
      .from(stocksTable);

    if (stocks.length === 0) return;

    const today = todayStr();
    const writeHistory = today !== lastHistoryDate;
    let updated = 0;

    for (const stock of stocks) {
      const quote = await fetchQuote(stock.symbol, apiKey);

      if (quote) {
        await db
          .update(stocksTable)
          .set({
            price: quote.price.toFixed(4),
            change: quote.change.toFixed(4),
            changePercent: quote.changePercent.toFixed(4),
            updatedAt: new Date(),
          })
          .where(eq(stocksTable.id, stock.id));

        // Price history: write once per calendar day
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
              .values({ stockId: stock.id, date: today, price: quote.price.toFixed(4) });
          } else {
            await db
              .update(priceHistoryTable)
              .set({ price: quote.price.toFixed(4) })
              .where(eq(priceHistoryTable.id, existing[0].id));
          }
        }

        updated++;
      }

      // Respect Finnhub free-plan rate limit between each symbol
      await sleep(RATE_LIMIT_DELAY_MS);
    }

    if (writeHistory && updated > 0) lastHistoryDate = today;
    console.log(`[priceSync] Updated ${updated}/${stocks.length} stocks via Finnhub`);
  } catch (err) {
    console.error("[priceSync] Error:", err);
  } finally {
    syncRunning = false;
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function startPriceSync(): void {
  console.log("[priceSync] Starting with Finnhub — rate-limited to ~54 req/min");
  void syncPrices();
  setInterval(() => void syncPrices(), PRICE_INTERVAL_MS);
}
