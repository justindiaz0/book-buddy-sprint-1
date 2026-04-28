import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  supabaseAuthId: text("supabase_auth_id").unique(),
  displayName: text("display_name").notNull(),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(15),
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  reminderTime: text("reminder_time"),
  burnoutWindowStart: text("burnout_window_start"),
  burnoutWindowEnd: text("burnout_window_end"),
  darkMode: boolean("dark_mode").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
