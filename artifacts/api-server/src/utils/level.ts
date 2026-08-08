/**
 * Progressive XP level system.
 * XP needed to go from level N → N+1 = 200 + (N-1)*100
 *   Level 1→2 : 200 XP
 *   Level 2→3 : 300 XP
 *   Level 3→4 : 400 XP  …and so on
 */

/** Total XP required to *reach* level N (cumulative from level 1). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  const n = level - 1; // number of level-ups completed
  return 200 * n + 50 * n * (n - 1);
}

/** XP needed within the current level to advance to the next one. */
export function xpNeededThisLevel(level: number): number {
  return 200 + (level - 1) * 100;
}

/** Derive current level from total accumulated XP. */
export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

/** Streak bonus XP awarded on daily login (0 for day 1, 10 for day 2, +1 each extra day). */
export function streakBonus(streak: number): number {
  return streak >= 2 ? streak + 8 : 0;
}
