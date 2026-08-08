import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("Trophy"),
  xpReward: integer("xp_reward").notNull().default(100),
  rarity: text("rarity").notNull().default("common"), // 'common' | 'rare' | 'epic' | 'legendary'
});

export const userAchievementsTable = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  achievementId: integer("achievement_id").notNull().references(() => achievementsTable.id),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export type Achievement = typeof achievementsTable.$inferSelect;
export type UserAchievement = typeof userAchievementsTable.$inferSelect;
