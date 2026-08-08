import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, lessonQuestionsTable, lessonsTable } from "@workspace/db";

const router = Router();

// GET /learn/lessons/:lessonId/questions
router.get("/learn/lessons/:lessonId/questions", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId;
  const lessonId = parseInt(rawId, 10);

  if (isNaN(lessonId)) {
    res.status(400).json({ error: "Invalid lesson ID" });
    return;
  }

  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId)).limit(1);
  if (!lessons[0]) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const questions = await db
    .select()
    .from(lessonQuestionsTable)
    .where(eq(lessonQuestionsTable.lessonId, lessonId))
    .orderBy(lessonQuestionsTable.sortOrder);

  res.json(questions.map(q => ({
    id: q.id,
    lessonId: q.lessonId,
    question: q.question,
    type: q.type,
    options: q.options as string[] | null,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    sortOrder: q.sortOrder,
  })));
});

export default router;
