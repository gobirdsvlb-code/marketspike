import { db, friendsTable, usersTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import { getLevelFromXp } from "./level";

/**
 * When a user earns XP, grant every accepted friend half that amount.
 * Runs fire-and-forget — caller does not need to await.
 */
export async function grantFriendXp(
  userId: number,
  xpEarned: number
): Promise<void> {
  if (xpEarned <= 0) return;
  const bonus = Math.floor(xpEarned / 2);
  if (bonus <= 0) return;

  const friendships = await db
    .select()
    .from(friendsTable)
    .where(
      and(
        or(
          eq(friendsTable.userId, userId),
          eq(friendsTable.friendId, userId)
        ),
        eq(friendsTable.status, "accepted")
      )
    );

  if (friendships.length === 0) return;

  const friendIds = friendships.map((f) =>
    f.userId === userId ? f.friendId : f.userId
  );

  // Fetch all friends in one query
  const friendRows = await db
    .select()
    .from(usersTable)
    .where(or(...friendIds.map((id) => eq(usersTable.id, id))));

  for (const friend of friendRows) {
    const newXp = friend.xp + bonus;
    const newLevel = getLevelFromXp(newXp);
    await db
      .update(usersTable)
      .set({ xp: newXp, level: newLevel })
      .where(eq(usersTable.id, friend.id));
  }
}
