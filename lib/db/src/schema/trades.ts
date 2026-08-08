import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { stocksTable } from "./stocks";

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  stockId: integer("stock_id").notNull().references(() => stocksTable.id),
  type: text("type").notNull(), // 'buy' | 'sell'
  quantity: numeric("quantity", { precision: 14, scale: 6 }).notNull(),
  price: numeric("price", { precision: 14, scale: 4 }).notNull(),
  total: numeric("total", { precision: 14, scale: 4 }).notNull(),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true, executedAt: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
