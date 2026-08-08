import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

// Only set up Google OAuth if credentials are configured
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (clientID && clientSecret) {
  const callbackURL =
    process.env.GOOGLE_REDIRECT_URI ??
    `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      { clientID, clientSecret, callbackURL },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const email =
            profile.emails?.[0]?.value?.toLowerCase().trim() ?? null;
          const avatarUrl = profile.photos?.[0]?.value ?? null;
          const displayName =
            profile.displayName ??
            profile.name?.givenName ??
            `User${profile.id.slice(0, 6)}`;

          if (!email) {
            return done(new Error("No email from Google profile"), undefined);
          }

          // Find existing user by email
          const existing = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

          if (existing[0]) {
            return done(null, existing[0]);
          }

          // Create new user from Google profile
          const [newUser] = await db
            .insert(usersTable)
            .values({
              username: displayName,
              email,
              avatarUrl,
              xp: 0,
              level: 1,
              streak: 0,
              lives: 5,
              livesResetDate: todayDate(),
              lastLoginDate: "",
            })
            .returning();

          return done(null, newUser);
        } catch (err) {
          return done(err as Error, undefined);
        }
      }
    )
  );
}

// GET /auth/google — kick off OAuth flow
router.get("/auth/google", (req, res, next) => {
  if (!clientID || !clientSecret) {
    res.status(503).json({ error: "Google OAuth is not configured" });
    return;
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
});

// GET /auth/google/callback — Google redirects here
router.get(
  "/auth/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, async (err: Error | null, user: typeof usersTable.$inferSelect | false) => {
      if (err || !user) {
        return res.redirect("/?auth_error=google_failed");
      }

      // Set our own session (not passport sessions)
      (req as any).userId = user.id;
      req.session.save((saveErr) => {
        if (saveErr) {
          return res.redirect("/?auth_error=session_failed");
        }
        // Redirect to the app home — frontend will pick up the session
        const basePath = process.env.FRONTEND_BASE_PATH ?? "/";
        res.redirect(`${basePath}home`);
      });
    })(req, res, next);
  }
);

export default router;
