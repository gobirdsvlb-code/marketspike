import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  kind: text("kind").notNull(), // 'coins' | 'plan'
  itemId: text("item_id").notNull(), // bundle id or plan id
  amountCents: integer("amount_cents").notNull(),
  provider: text("provider").notNull(), // 'mock' | 'stripe'
  status: text("status").notNull().default("pending"), // 'pending' | 'paid'
  providerRef: text("provider_ref").unique(), // Stripe Checkout Session id
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export type Payment = typeof paymentsTable.$inferSelect;
