import { Router } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, lessonQuestionsTable, lessonsTable, usersTable } from "@workspace/db";
import { getLevelFromXp } from "../utils/level";
import { grantFriendXp } from "../utils/friendXp";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
const RIVER_SIZE = 8; // questions per crossing

// XP multipliers for each of the 6 river levels
const RIVER_LEVEL_MULTIPLIERS = [1.0, 1.25, 1.5, 2.0, 2.5, 3.0];

// Difficulty cycles: easy×2 → medium×2 → hard×2 → repeat
function getDifficulty(completions: number): "easy" | "medium" | "hard" {
  const cycle = completions % 6;
  if (cycle < 2) return "easy";
  if (cycle < 4) return "medium";
  return "hard";
}

function getNextMilestone(completions: number): { nextDifficulty: string; runsUntilChange: number } {
  const cycle = completions % 6;
  if (cycle < 2) return { nextDifficulty: "medium", runsUntilChange: 2 - cycle };
  if (cycle < 4) return { nextDifficulty: "hard", runsUntilChange: 4 - cycle };
  return { nextDifficulty: "easy", runsUntilChange: 6 - cycle };
}

// GET /game/river — return a set of questions at the player's current difficulty
router.get("/game/river", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const today = new Date().toISOString().slice(0, 10);
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  // Auto-reset lives daily
  let lives = user.livesResetDate !== today ? 5 : user.lives;
  if (user.livesResetDate !== today) {
    await db.update(usersTable).set({ lives: 5, livesResetDate: today }).where(eq(usersTable.id, userId));
  }

  const completions = user.riverCompletions ?? 0;
  const difficulty = getDifficulty(completions);
  const milestone = getNextMilestone(completions);

  // Pull questions from lessons of the current difficulty stage
  const stageLessons = await db.select().from(lessonsTable).where(eq(lessonsTable.stage, difficulty));
  const lessonIds = stageLessons.map(l => l.id);

  if (lessonIds.length === 0) {
    res.json({ questions: [], lives, difficulty, completions, ...milestone });
    return;
  }

  const allQuestions = await db.select().from(lessonQuestionsTable)
    .where(inArray(lessonQuestionsTable.lessonId, lessonIds));

  // Shuffle and pick RIVER_SIZE
  const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, RIVER_SIZE);

  res.json({
    lives,
    difficulty,
    completions,
    ...milestone,
    questions: shuffled.map(q => ({
      id: q.id,
      lessonId: q.lessonId,
      question: q.question,
      type: q.type,
      options: q.options as string[] | null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      sortOrder: q.sortOrder,
    })),
  });
});

// POST /game/river/complete — award XP and advance difficulty counter
router.post("/game/river/complete", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const { correctAnswers = 0, riverLevel = 1 } = req.body as {
    questionsAnswered?: number;
    correctAnswers?: number;
    riverLevel?: number;
  };

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }

  const user = users[0];
  const completions = (user.riverCompletions ?? 0) + 1;
  const prevDifficulty = getDifficulty(completions - 1);
  const nextDifficulty = getDifficulty(completions);
  const difficulty_up = nextDifficulty !== prevDifficulty;

  // Bonus XP for harder difficulties
  const difficultyBonus = prevDifficulty === "easy" ? 1 : prevDifficulty === "medium" ? 1.5 : 2;

  // Level multiplier (clamp to valid range)
  const clampedLevel = Math.min(6, Math.max(1, Math.round(riverLevel)));
  const levelMultiplier = RIVER_LEVEL_MULTIPLIERS[clampedLevel - 1] ?? 1;

  const xpReward = Math.round((50 + correctAnswers * 15) * difficultyBonus * levelMultiplier);

  const newXp = user.xp + xpReward;
  const newLevel = getLevelFromXp(newXp);
  const leveledUp = newLevel > user.level;

  await db.update(usersTable)
    .set({ xp: newXp, level: newLevel, riverCompletions: completions })
    .where(eq(usersTable.id, userId));

  // Grant half the XP to each accepted friend (fire-and-forget)
  grantFriendXp(userId, xpReward).catch(() => {});

  res.json({
    xpEarned: xpReward,
    newXp,
    newLevel,
    leveledUp,
    difficulty: prevDifficulty,
    nextDifficulty,
    difficulty_up,
    completions,
    riverLevel: clampedLevel,
  });
});

export default router;
