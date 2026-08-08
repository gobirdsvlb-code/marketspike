import { pgTable, serial, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { stocksTable } from "./stocks";

export const holdingsTable = pgTable("holdings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  stockId: integer("stock_id").notNull().references(() => stocksTable.id),
  quantity: numeric("quantity", { precision: 14, scale: 6 }).notNull(),
  avgBuyPrice: numeric("avg_buy_price", { precision: 14, scale: 4 }).notNull(),
});

export const insertHoldingSchema = createInsertSchema(holdingsTable).omit({ id: true });
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdingsTable.$inferSelect;
