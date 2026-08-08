import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  avatarColor: text("avatar_color").notNull().default("#6366f1"),
  bio: text("bio").notNull().default(""),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("10000.00"),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  streak: integer("streak").notNull().default(0),
  lives: integer("lives").notNull().default(5),
  livesResetDate: text("lives_reset_date").notNull().default(""),
  lastLoginDate: text("last_login_date").notNull().default(""),
  riverCompletions: integer("river_completions").notNull().default(0),
  clerkUserId: text("clerk_user_id").unique(),
  coins: integer("coins").notNull().default(0),
  tier: text("tier").notNull().default("free"),           // 'free' | 'pro' | 'elite'
  unlockedColors: text("unlocked_colors").notNull().default("[]"), // JSON array of hex strings
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
