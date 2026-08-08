import { pgTable, serial, integer, text, jsonb } from "drizzle-orm/pg-core";
import { lessonsTable } from "./lessons";

export const lessonQuestionsTable = pgTable("lesson_questions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  type: text("type").notNull().default("multiple_choice"), // 'multiple_choice' | 'true_false'
  options: jsonb("options"), // string[] for multiple_choice, null for true_false
  correctAnswer: text("correct_answer").notNull(), // option text, or 'true'/'false'
  explanation: text("explanation").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type LessonQuestion = typeof lessonQuestionsTable.$inferSelect;
