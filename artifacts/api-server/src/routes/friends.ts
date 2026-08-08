import { Router } from "express";
import { eq, or, and, ne } from "drizzle-orm";
import { db, friendsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// GET /friends — list all friends and requests for current user
router.get("/friends", requireAuth, async (req, res): Promise<void> => {
  const ME = (req as any).userId;

  const rows = await db
    .select()
    .from(friendsTable)
    .where(or(eq(friendsTable.userId, ME), eq(friendsTable.friendId, ME)));

  const userIds = new Set<number>();
  rows.forEach((r) => {
    if (r.userId !== ME) userIds.add(r.userId);
    if (r.friendId !== ME) userIds.add(r.friendId);
  });

  const users =
    userIds.size > 0
      ? await db
          .select()
          .from(usersTable)
          .where(or(...[...userIds].map((id) => eq(usersTable.id, id))))
      : [];

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const friends = rows.map((r) => {
    const otherId = r.userId === ME ? r.friendId : r.userId;
    const other = userMap[otherId];
    return {
      id: r.id,
      userId: otherId,
      username: other?.username ?? "Unknown",
      avatarColor: other?.avatarColor ?? "#6366f1",
      avatarUrl: other?.avatarUrl ?? null,
      xp: other?.xp ?? 0,
      level: other?.level ?? 1,
      status: r.status,
      direction: r.userId === ME ? "sent" : "received",
    };
  });

  res.json(friends);
});

// GET /friends/pending-count — lightweight badge count of incoming pending requests
router.get("/friends/pending-count", requireAuth, async (req, res): Promise<void> => {
  const ME = (req as any).userId;
  const rows = await db
    .select()
    .from(friendsTable)
    .where(and(eq(friendsTable.friendId, ME), eq(friendsTable.status, "pending")));
  res.json({ count: rows.length });
});

// POST /friends/add — send a friend REQUEST (pending, not instant)
router.post("/friends/add", requireAuth, async (req, res): Promise<void> => {
  const ME = (req as any).userId;
  const { username } = req.body as { username?: string };
  if (!username) {
    res.status(400).json({ error: "username required" });
    return;
  }

  const target = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.username, username), ne(usersTable.id, ME)))
    .limit(1);

  if (!target[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const targetId = target[0].id;

  // Check for existing relationship in either direction
  const existing = await db
    .select()
    .from(friendsTable)
    .where(
      or(
        and(eq(friendsTable.userId, ME), eq(friendsTable.friendId, targetId)),
        and(eq(friendsTable.userId, targetId), eq(friendsTable.friendId, ME))
      )
    )
    .limit(1);

  if (existing[0]) {
    res.status(409).json({
      error:
        existing[0].status === "accepted"
          ? "Already friends"
          : "Request already sent",
    });
    return;
  }

  // Insert as PENDING — requires acceptance from the other side
  const [row] = await db
    .insert(friendsTable)
    .values({ userId: ME, friendId: targetId, status: "pending" })
    .returning();

  res.json({
    id: row.id,
    userId: targetId,
    username: target[0].username,
    avatarColor: target[0].avatarColor,
    avatarUrl: target[0].avatarUrl,
    xp: target[0].xp,
    level: target[0].level,
    status: "pending",
    direction: "sent",
  });
});

// POST /friends/accept/:id — accept a received friend request
router.post(
  "/friends/accept/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const ME = (req as any).userId;
    const id = parseInt(req.params.id as string, 10);

    // Only the recipient (friendId) can accept
    const rows = await db
      .select()
      .from(friendsTable)
      .where(
        and(
          eq(friendsTable.id, id),
          eq(friendsTable.friendId, ME),
          eq(friendsTable.status, "pending")
        )
      )
      .limit(1);

    if (!rows[0]) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    await db
      .update(friendsTable)
      .set({ status: "accepted" })
      .where(eq(friendsTable.id, id));

    res.json({ success: true });
  }
);

// POST /friends/decline/:id — decline or cancel a friend request
router.post(
  "/friends/decline/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const ME = (req as any).userId;
    const id = parseInt(req.params.id as string, 10);

    await db.delete(friendsTable).where(
      and(
        eq(friendsTable.id, id),
        or(eq(friendsTable.userId, ME), eq(friendsTable.friendId, ME))
      )
    );

    res.json({ success: true });
  }
);

// DELETE /friends/:id — remove an accepted friend
router.delete(
  "/friends/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const ME = (req as any).userId;
    const id = parseInt(req.params.id as string, 10);
    await db.delete(friendsTable).where(
      and(
        eq(friendsTable.id, id),
        or(eq(friendsTable.userId, ME), eq(friendsTable.friendId, ME))
      )
    );
    res.json({ success: true });
  }
);

export default router;
