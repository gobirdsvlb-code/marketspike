import { Request, Response, NextFunction } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getLevelFromXp } from "../utils/level";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Look up the local user by Clerk ID
  let users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!users[0]) {
    // JIT provision: fetch Clerk user details, then either link an existing
    // account (matched by email) or create a fresh one.
    try {
      const clerkUser = await clerk.users.getUser(clerkUserId);
      const email =
        clerkUser.emailAddresses[0]?.emailAddress ?? null;

      // Try to adopt an existing account that shares this email (old-auth users)
      if (email) {
        const byEmail = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, email))
          .limit(1);

        if (byEmail[0]) {
          // Link the Clerk ID to the pre-existing row
          const linked = await db
            .update(usersTable)
            .set({ clerkUserId })
            .where(eq(usersTable.id, byEmail[0].id))
            .returning();
          users = linked;
        }
      }

      // No existing account — create a new one
      if (!users[0]) {
        const raw =
          clerkUser.username ||
          clerkUser.firstName ||
          (email ? email.split("@")[0] : "trader");
        let username = (raw ?? "trader")
          .replace(/[^a-zA-Z0-9_]/g, "")
          .slice(0, 20) || "trader";

        // Ensure username uniqueness
        const takenName = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.username, username))
          .limit(1);
        if (takenName[0]) {
          username = `${username}${Math.floor(Math.random() * 9000) + 1000}`;
        }

        const created = await db
          .insert(usersTable)
          .values({ clerkUserId, username, email })
          .returning();
        users = created;
      }
    } catch (err) {
      console.error("[requireAuth] JIT provisioning failed:", err);
      res.status(500).json({ error: "Failed to provision user" });
      return;
    }
  }

  // Auto-correct level if XP formula changed
  const u = users[0];
  const correctLevel = getLevelFromXp(u.xp);
  if (correctLevel !== u.level) {
    await db
      .update(usersTable)
      .set({ level: correctLevel })
      .where(eq(usersTable.id, u.id));
    users[0] = { ...u, level: correctLevel };
  }

  (req as any).userId = users[0].id;
  next();
}
