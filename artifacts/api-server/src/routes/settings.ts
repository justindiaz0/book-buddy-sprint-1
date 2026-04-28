import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireUser } from "../middleware/auth";

const router = Router();

router.get("/settings", requireUser, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.currentUserId!));
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    return res.json({
      userId: user.id,
      dailyGoalMinutes: user.dailyGoalMinutes,
      reminderEnabled: user.reminderEnabled,
      reminderTime: user.reminderTime ?? null,
      burnoutWindowStart: user.burnoutWindowStart ?? null,
      burnoutWindowEnd: user.burnoutWindowEnd ?? null,
      darkMode: user.darkMode,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting settings");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/settings", requireUser, async (req, res) => {
  try {
    const body = req.body as {
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
    return res.json({
      userId: user.id,
      dailyGoalMinutes: user.dailyGoalMinutes,
      reminderEnabled: user.reminderEnabled,
      reminderTime: user.reminderTime ?? null,
      burnoutWindowStart: user.burnoutWindowStart ?? null,
      burnoutWindowEnd: user.burnoutWindowEnd ?? null,
      darkMode: user.darkMode,
    });
  } catch (err) {
    req.log.error({ err }, "Error updating settings");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
