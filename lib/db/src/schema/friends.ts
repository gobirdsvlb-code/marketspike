import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const friendsTable = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  friendId: integer("friend_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Friend = typeof friendsTable.$inferSelect;
