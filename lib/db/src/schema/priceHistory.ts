import { pgTable, serial, integer, numeric, date } from "drizzle-orm/pg-core";
import { stocksTable } from "./stocks";

export const priceHistoryTable = pgTable("price_history", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull().references(() => stocksTable.id),
  date: date("date").notNull(),
  price: numeric("price", { precision: 14, scale: 4 }).notNull(),
});

export type PriceHistory = typeof priceHistoryTable.$inferSelect;
