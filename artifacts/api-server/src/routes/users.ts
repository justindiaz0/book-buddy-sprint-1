import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireUser } from "../middleware/auth";

const router = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    dailyGoalMinutes: user.dailyGoalMinutes,
    reminderEnabled: user.reminderEnabled,
    reminderTime: user.reminderTime ?? null,
    burnoutWindowStart: user.burnoutWindowStart ?? null,
    burnoutWindowEnd: user.burnoutWindowEnd ?? null,
    darkMode: user.darkMode,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users/me", requireUser, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.currentUserId!));
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    return res.json(formatUser(user));
  } catch (err) {
    req.log.error({ err }, "Error getting user");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/users/me", requireUser, async (req, res) => {
  try {
    const body = req.body as {
      displayName?: string;
      dailyGoalMinutes?: number;
      reminderEnabled?: boolean;
      reminderTime?: string | null;
      burnoutWindowStart?: string | null;
      burnoutWindowEnd?: string | null;
      darkMode?: boolean;
    };
    const [user] = await db
      .update(usersTable)
      .set({
        ...(body.displayName !== undefined && { displayName: body.displayName }),
        ...(body.dailyGoalMinutes !== undefined && { dailyGoalMinutes: body.dailyGoalMinutes }),
        ...(body.reminderEnabled !== undefined && { reminderEnabled: body.reminderEnabled }),
        ...(body.reminderTime !== undefined && { reminderTime: body.reminderTime }),
        ...(body.burnoutWindowStart !== undefined && { burnoutWindowStart: body.burnoutWindowStart }),
        ...(body.burnoutWindowEnd !== undefined && { burnoutWindowEnd: body.burnoutWindowEnd }),
        ...(body.darkMode !== undefined && { darkMode: body.darkMode }),
      })
      .where(eq(usersTable.id, req.currentUserId!))
      .returning();
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    return res.json(formatUser(user));
  } catch (err) {
    req.log.error({ err }, "Error updating user");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Onboarding: called after sign-up. Creates or updates the user profile and
// adds the first book. The email is taken from the auth header.
router.post("/users/onboard", async (req, res) => {
  try {
    const email = req.userEmail;
    if (!email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const body = req.body as {
      displayName: string;
      bookTitle: string;
      bookAuthor?: string | null;
      bookTotalPages: number;
      currentPage?: number;
      dailyGoalMinutes?: number;
      reminderEnabled?: boolean;
      reminderTime?: string | null;
      burnoutWindowStart?: string | null;
      burnoutWindowEnd?: string | null;
      darkMode?: boolean;
    };

    const userPayload = {
      displayName: body.displayName,
      dailyGoalMinutes: body.dailyGoalMinutes ?? 15,
      reminderEnabled: body.reminderEnabled ?? false,
      reminderTime: body.reminderTime ?? null,
      burnoutWindowStart: body.burnoutWindowStart ?? null,
      burnoutWindowEnd: body.burnoutWindowEnd ?? null,
      darkMode: body.darkMode ?? true,
    };

    let user: typeof usersTable.$inferSelect;

    if (req.currentUserId) {
      // User already exists — update profile
      const [updated] = await db
        .update(usersTable)
        .set(userPayload)
        .where(eq(usersTable.id, req.currentUserId))
        .returning();
      user = updated;
    } else {
      // First time — create user record
      const [inserted] = await db
        .insert(usersTable)
        .values({ email, supabaseAuthId: req.supabaseUserId ?? null, ...userPayload })
        .returning();
      user = inserted;
    }

    // Reset current book flag for this user, then add the new book
    await db
      .update(booksTable)
      .set({ isCurrent: false })
      .where(eq(booksTable.userId, user.id));

    await db.insert(booksTable).values({
      userId: user.id,
      title: body.bookTitle,
      author: body.bookAuthor ?? null,
      totalPages: body.bookTotalPages,
      currentPage: body.currentPage ?? 0,
      isCurrent: true,
      lastReadAt: null,
    });

    return res.status(201).json(formatUser(user));
  } catch (err) {
    req.log.error({ err }, "Error onboarding user");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
