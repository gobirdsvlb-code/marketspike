import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // kept for backward compat
  stage: text("stage").notNull().default("easy"),     // 'easy' | 'medium' | 'hard'
  category: text("category").notNull().default("equities"), // 'equities' | 'etfs' | 'key_terms'
  levelNumber: integer("level_number").notNull().default(1), // 1=Equities, 2=ETFs, 3=Key Terms
  sortOrder: integer("sort_order").notNull().default(0),
  xpReward: integer("xp_reward").notNull().default(50),
  durationMinutes: integer("duration_minutes").notNull().default(5),
  icon: text("icon").notNull().default("BookOpen"),
});

export const userLessonsTable = pgTable("user_lessons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"), // null = started but not yet completed
});

export type Lesson = typeof lessonsTable.$inferSelect;
export type UserLesson = typeof userLessonsTable.$inferSelect;
