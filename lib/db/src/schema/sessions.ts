import { pgTable, serial, integer, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { booksTable } from "./books";

export const readingSessionsTable = pgTable("reading_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => booksTable.id, { onDelete: "cascade" }),
  pagesRead: integer("pages_read").notNull(),
  minutesRead: integer("minutes_read").notNull(),
  startPage: integer("start_page").notNull(),
  endPage: integer("end_page").notNull(),
  sessionDate: date("session_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(readingSessionsTable).omit({ id: true, createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type ReadingSession = typeof readingSessionsTable.$inferSelect;
