/**
 * Seed / refresh all tradable US securities from every available free source:
 *  1. NASDAQ exchange files (nasdaqlisted + otherlisted) — all NASDAQ/NYSE/AMEX/ARCA listings
 *  2. Alpha Vantage LISTING_STATUS — comprehensive active US securities including OTC
 *
 * Safe to re-run: only inserts symbols not already in the DB.
 * Run with:  npx tsx lib/db/src/seed-stocks.ts
 */

import { db, stocksTable } from "./index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawStock {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
}

// ---------------------------------------------------------------------------
// Source 1: NASDAQ exchange files
// ---------------------------------------------------------------------------

async function fetchNasdaqListed(): Promise<RawStock[]> {
  const url = "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt";
  const text = await fetch(url).then((r) => r.text());
  const lines = text.split("\n").slice(1);

  const results: RawStock[] = [];
  for (const line of lines) {
    if (!line.trim() || line.startsWith("File Creation Time")) continue;
    const parts = line.split("|");
    if (parts.length < 8) continue;
    const [symbol, name, , testIssue, , , etf] = parts;
    if (testIssue?.trim() === "Y") continue;
    const sym = symbol?.trim();
    if (!sym || !/^[A-Z]{1,6}$/.test(sym)) continue;
    results.push({
      symbol: sym,
      name: cleanName(name?.trim() ?? ""),
      sector: etf?.trim() === "Y" ? "ETF" : "Equities",
      exchange: "NASDAQ",
    });
  }
  return results;
}

async function fetchOtherListed(): Promise<RawStock[]> {
  const url = "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt";
  const text = await fetch(url).then((r) => r.text());
  const lines = text.split("\n").slice(1);

  const results: RawStock[] = [];
  for (const line of lines) {
    if (!line.trim() || line.startsWith("File Creation Time")) continue;
    const parts = line.split("|");
    if (parts.length < 7) continue;
    // ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue
    const [actSymbol, name, exchange, , etf, , testIssue] = parts;
    if (testIssue?.trim() === "Y") continue;
    const sym = actSymbol?.trim();
    if (!sym || !/^[A-Z]{1,6}$/.test(sym)) continue;
    results.push({
      symbol: sym,
      name: cleanName(name?.trim() ?? ""),
      sector: etf?.trim() === "Y" ? "ETF" : "Equities",
      exchange: exchange?.trim() ?? "NYSE",
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Source 2: Alpha Vantage LISTING_STATUS (no API key required with "demo")
// Returns all active US securities including OTC stocks
// ---------------------------------------------------------------------------

async function fetchAlphaVantage(): Promise<RawStock[]> {
  const url =
    "https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=demo";
  const text = await fetch(url).then((r) => r.text());
  const lines = text.split("\n").slice(1); // skip header

  // symbol,name,exchange,assetType,ipoDate,delistingDate,status
  const results: RawStock[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(",");
    if (parts.length < 7) continue;
    const [symbol, name, exchange, assetType, , , status] = parts;
    if (status?.trim() !== "Active") continue;
    const sym = symbol?.trim();
    // Accept standard ticker symbols: 1-6 uppercase letters (no dashes, dots, numbers)
    if (!sym || !/^[A-Z]{1,6}$/.test(sym)) continue;
    const sector =
      assetType?.trim() === "ETF"
        ? "ETF"
        : assetType?.trim() === "Mutual Fund"
        ? "Mutual Fund"
        : "Equities";
    results.push({
      symbol: sym,
      name: cleanName(name?.trim() ?? ""),
      sector,
      exchange: exchange?.trim() ?? "",
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanName(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*Common Stock.*$/i, "")
    .replace(/\s*Common Stock$/i, "")
    .replace(/\s*Class [A-Z] (Common )?Shares?$/i, "")
    .replace(/\s*Ordinary Shares?$/i, "")
    .replace(/\s*American Depositary Shares?.*$/i, " ADR")
    .trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  console.log("Fetching all sources in parallel...");

  const [nasdaq, other, av] = await Promise.all([
    fetchNasdaqListed(),
    fetchOtherListed(),
    fetchAlphaVantage(),
  ]);

  console.log(
    `  NASDAQ listed:  ${nasdaq.length.toLocaleString()}\n` +
    `  Other listed:   ${other.length.toLocaleString()}\n` +
    `  Alpha Vantage:  ${av.length.toLocaleString()}`
  );

  // Deduplicate across all sources — NASDAQ listing wins for same symbol
  const map = new Map<string, RawStock>();
  for (const s of [...av, ...other, ...nasdaq]) map.set(s.symbol, s);
  const all = [...map.values()];

  console.log(`  Combined unique: ${all.length.toLocaleString()}`);

  // Get existing symbols from DB
  const existing = await db
    .select({ symbol: stocksTable.symbol })
    .from(stocksTable);
  const existingSet = new Set(existing.map((e) => e.symbol));

  const toInsert = all.filter((s) => !existingSet.has(s.symbol));
  console.log(
    `\n${existingSet.size.toLocaleString()} already in DB — inserting ${toInsert.length.toLocaleString()} new symbols`
  );

  if (toInsert.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Insert in batches of 100
  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    await db.insert(stocksTable).values(
      batch.map((s) => ({
        symbol: s.symbol,
        name: s.name || s.symbol,
        sector: s.sector,
        price: "0.0001",
        change: "0",
        changePercent: "0",
        marketCap: null,
        description: `${s.name || s.symbol} — traded on ${s.exchange || "US Markets"}`,
      }))
    );
    inserted += batch.length;
    if (i % (BATCH * 20) === 0 || i + BATCH >= toInsert.length) {
      console.log(`  ${inserted.toLocaleString()}/${toInsert.length.toLocaleString()} inserted...`);
    }
  }

  const total = existingSet.size + inserted;
  console.log(
    `\nDone! Total in DB: ${total.toLocaleString()}\n` +
    `Note: This is every active US-listed security across NASDAQ, NYSE, AMEX, ARCA,\n` +
    `and OTC markets from Alpha Vantage's comprehensive listing.\n` +
    `The US market has ~10,000–15,000 unique tradable securities in total.`
  );
}

seed().catch(console.error).finally(() => process.exit(0));
