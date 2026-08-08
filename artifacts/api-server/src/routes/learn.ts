import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, lessonsTable, userLessonsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";
import { grantFriendXp } from "../utils/friendXp";

const router = Router();

const STAGE_ORDER = ["easy", "medium", "hard"];
const LEVEL_ORDER = ["equities", "etfs", "key_terms"];
const STAGE_LABELS: Record<string, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const CATEGORY_LABELS: Record<string, string> = { equities: "Equities", etfs: "ETFs & Mutual Funds", key_terms: "Key Terms" };

// GET /learn/curriculum — structured view grouped by stage > level
router.get("/learn/curriculum", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const lessons = await db.select().from(lessonsTable).orderBy(lessonsTable.sortOrder);
  const userRows = await db.select().from(userLessonsTable).where(eq(userLessonsTable.userId, userId));

  const completedIds = new Set(userRows.filter(r => r.completedAt !== null).map(r => r.lessonId));
  const startedIds = new Set(userRows.map(r => r.lessonId));

  const completedByStage: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  const totalByStage: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  for (const l of lessons) {
    totalByStage[l.stage] = (totalByStage[l.stage] || 0) + 1;
    if (completedIds.has(l.id)) completedByStage[l.stage] = (completedByStage[l.stage] || 0) + 1;
  }

  const stageUnlocked = (stage: string) => {
    if (stage === "easy") return true;
    if (stage === "medium") return completedByStage["easy"] >= totalByStage["easy"];
    if (stage === "hard") return completedByStage["medium"] >= totalByStage["medium"];
    return false;
  };

  const completedByStageLevel: Record<string, number> = {};
  const totalByStageLevel: Record<string, number> = {};
  for (const l of lessons) {
    const key = `${l.stage}-${l.levelNumber}`;
    totalByStageLevel[key] = (totalByStageLevel[key] || 0) + 1;
    if (completedIds.has(l.id)) completedByStageLevel[key] = (completedByStageLevel[key] || 0) + 1;
  }

  const levelUnlocked = (stage: string, levelNum: number) => {
    if (!stageUnlocked(stage)) return false;
    if (levelNum === 1) return true;
    const prevKey = `${stage}-${levelNum - 1}`;
    return (completedByStageLevel[prevKey] || 0) >= (totalByStageLevel[prevKey] || 1);
  };

  const curriculum = STAGE_ORDER.map((stage, si) => {
    const levels = LEVEL_ORDER.map((cat, li) => {
      const levelNum = li + 1;
      const stageLessons = lessons
        .filter(l => l.stage === stage && l.category === cat)
        .map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
          difficulty: l.difficulty,
          stage: l.stage,
          category: l.category,
          levelNumber: l.levelNumber,
          sortOrder: l.sortOrder,
          xpReward: l.xpReward,
          durationMinutes: l.durationMinutes,
          completed: completedIds.has(l.id),
          started: startedIds.has(l.id),
          icon: l.icon,
        }));

      const completedCount = stageLessons.filter(l => l.completed).length;

      return {
        stage,
        stageLabel: STAGE_LABELS[stage],
        category: cat,
        categoryLabel: CATEGORY_LABELS[cat],
        levelNumber: levelNum,
        lessons: stageLessons,
        totalLessons: stageLessons.length,
        completedLessons: completedCount,
        isUnlocked: levelUnlocked(stage, levelNum),
      };
    });

    return {
      stage,
      stageLabel: STAGE_LABELS[stage],
      stageNumber: si + 1,
      isUnlocked: stageUnlocked(stage),
      levels,
    };
  });

  res.json(curriculum);
});

// GET /learn/lessons
router.get("/learn/lessons", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const lessons = await db.select().from(lessonsTable).orderBy(lessonsTable.sortOrder);
  const userRows = await db.select().from(userLessonsTable).where(eq(userLessonsTable.userId, userId));
  const completedIds = new Set(userRows.filter(r => r.completedAt !== null).map(r => r.lessonId));
  const startedIds = new Set(userRows.map(r => r.lessonId));

  res.json(lessons.map(l => ({
    id: l.id,
    title: l.title,
    description: l.description,
    difficulty: l.difficulty,
    stage: l.stage,
    category: l.category,
    levelNumber: l.levelNumber,
    sortOrder: l.sortOrder,
    xpReward: l.xpReward,
    durationMinutes: l.durationMinutes,
    completed: completedIds.has(l.id),
    started: startedIds.has(l.id),
    icon: l.icon,
  })));
});

// POST /learn/lessons/:lessonId/start — record that the user opened the lesson
router.post("/learn/lessons/:lessonId/start", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const lessonId = parseInt(req.params.lessonId, 10);
  if (isNaN(lessonId)) { res.status(400).json({ error: "Invalid lesson ID" }); return; }

  const existing = await db
    .select()
    .from(userLessonsTable)
    .where(and(eq(userLessonsTable.userId, userId), eq(userLessonsTable.lessonId, lessonId)))
    .limit(1);

  if (!existing[0]) {
    await db.insert(userLessonsTable).values({ userId, lessonId, completedAt: null });
  }

  res.json({ started: true });
});

// POST /learn/lessons/:lessonId/complete
router.post("/learn/lessons/:lessonId/complete", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
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
  const lesson = lessons[0];

  const existing = await db
    .select()
    .from(userLessonsTable)
    .where(and(eq(userLessonsTable.userId, userId), eq(userLessonsTable.lessonId, lessonId)))
    .limit(1);

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let xpEarned = 0;
  let coinsEarned = 0;
  let newLevel = user[0].level;
  let leveledUp = false;

  const alreadyCompleted = existing[0]?.completedAt !== null && existing[0]?.completedAt !== undefined;

  // Coins per difficulty stage
  const STAGE_COINS: Record<string, number> = { easy: 10, medium: 20, hard: 30 };

  if (!alreadyCompleted) {
    const now = new Date();
    if (existing[0]) {
      // Row exists (started) — mark it complete
      await db
        .update(userLessonsTable)
        .set({ completedAt: now })
        .where(eq(userLessonsTable.id, existing[0].id));
    } else {
      // No row yet — insert as complete
      await db.insert(userLessonsTable).values({ userId, lessonId, completedAt: now });
    }

    xpEarned = lesson.xpReward;
    coinsEarned = STAGE_COINS[lesson.stage] ?? 0;
    const newXp = user[0].xp + xpEarned;
    newLevel = Math.floor(newXp / 200) + 1;
    leveledUp = newLevel > user[0].level;
    const newCoins = user[0].coins + coinsEarned;

    await db.update(usersTable)
      .set({ xp: newXp, level: newLevel, coins: newCoins })
      .where(eq(usersTable.id, userId));

    // Grant half the XP to each accepted friend (fire-and-forget)
    grantFriendXp(userId, xpEarned).catch(() => {});
  }

  res.json({ xpEarned, coinsEarned, newLevel, leveledUp, newAchievements: [] });
});

export default router;
