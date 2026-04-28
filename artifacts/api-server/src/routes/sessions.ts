import { Router } from "express";
import { db, readingSessionsTable, booksTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireUser } from "../middleware/auth";

const router = Router();

function formatSession(session: typeof readingSessionsTable.$inferSelect, bookTitle: string) {
  return {
    id: session.id,
    bookId: session.bookId,
    bookTitle,
    pagesRead: session.pagesRead,
    minutesRead: session.minutesRead,
    startPage: session.startPage,
    endPage: session.endPage,
    sessionDate: session.sessionDate,
    notes: session.notes ?? null,
    createdAt: session.createdAt.toISOString(),
  };
}

router.get("/sessions/recent", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const limit = parseInt(String(req.query.limit ?? "7"));
    const sessions = await db
      .select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.userId, uid))
      .orderBy(desc(readingSessionsTable.createdAt))
      .limit(limit);
    const results = await Promise.all(
      sessions.map(async (s) => {
        const [book] = await db.select().from(booksTable).where(eq(booksTable.id, s.bookId));
        return formatSession(s, book?.title ?? "Unknown");
      })
    );
    return res.json(results);
  } catch (err) {
    req.log.error({ err }, "Error getting recent sessions");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/sessions", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const bookId = req.query.bookId ? parseInt(String(req.query.bookId)) : undefined;
    const limit = parseInt(String(req.query.limit ?? "50"));
    const offset = parseInt(String(req.query.offset ?? "0"));

    const where = bookId
      ? and(eq(readingSessionsTable.userId, uid), eq(readingSessionsTable.bookId, bookId))
      : eq(readingSessionsTable.userId, uid);

    const sessions = await db
      .select()
      .from(readingSessionsTable)
      .where(where)
      .orderBy(desc(readingSessionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const results = await Promise.all(
      sessions.map(async (s) => {
        const [book] = await db.select().from(booksTable).where(eq(booksTable.id, s.bookId));
        return formatSession(s, book?.title ?? "Unknown");
      })
    );
    return res.json(results);
  } catch (err) {
    req.log.error({ err }, "Error listing sessions");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/sessions", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const body = req.body as {
      bookId: number;
      pagesRead: number;
      minutesRead: number;
      startPage: number;
      endPage: number;
      notes?: string | null;
    };
    const today = new Date().toISOString().split("T")[0];
    const [session] = await db
      .insert(readingSessionsTable)
      .values({
        userId: uid,
        bookId: body.bookId,
        pagesRead: body.pagesRead,
        minutesRead: body.minutesRead,
        startPage: body.startPage,
        endPage: body.endPage,
        sessionDate: today,
        notes: body.notes ?? null,
      })
      .returning();
    await db
      .update(booksTable)
      .set({ currentPage: body.endPage, lastReadAt: new Date() })
      .where(and(eq(booksTable.id, body.bookId), eq(booksTable.userId, uid)));
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, body.bookId));
    return res.status(201).json(formatSession(session, book?.title ?? "Unknown"));
  } catch (err) {
    req.log.error({ err }, "Error creating session");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
