import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stocksTable = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 14, scale: 4 }).notNull(),
  change: numeric("change", { precision: 10, scale: 4 }).notNull().default("0"),
  changePercent: numeric("change_percent", { precision: 8, scale: 4 }).notNull().default("0"),
  sector: text("sector").notNull(),
  logoUrl: text("logo_url"),
  marketCap: text("market_cap"),
  description: text("description").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStockSchema = createInsertSchema(stocksTable).omit({ id: true, updatedAt: true });
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stocksTable.$inferSelect;
