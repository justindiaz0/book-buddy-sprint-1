import { Router } from "express";
import { db, booksTable, readingSessionsTable } from "@workspace/db";
import { eq, desc, count, and } from "drizzle-orm";
import { requireUser } from "../middleware/auth";

const router = Router();

function formatBook(book: typeof booksTable.$inferSelect, sessionCount: number) {
  const percentComplete = book.totalPages > 0
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;
  return {
    id: book.id,
    title: book.title,
    author: book.author ?? null,
    totalPages: book.totalPages,
    currentPage: book.currentPage,
    percentComplete,
    isCompleted: book.isCompleted,
    completedAt: book.completedAt?.toISOString() ?? null,
    lastReadAt: book.lastReadAt?.toISOString() ?? null,
    totalSessions: sessionCount,
    isCurrent: book.isCurrent,
    createdAt: book.createdAt.toISOString(),
  };
}

router.get("/books/current", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const [book] = await db
      .select()
      .from(booksTable)
      .where(and(eq(booksTable.userId, uid), eq(booksTable.isCurrent, true)));
    if (!book) {
      return res.status(404).json({ message: "No current book" });
    }
    const [{ count: c }] = await db
      .select({ count: count() })
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.bookId, book.id));
    return res.json(formatBook(book, Number(c ?? 0)));
  } catch (err) {
    req.log.error({ err }, "Error getting current book");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/books", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const books = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.userId, uid))
      .orderBy(desc(booksTable.createdAt));
    const results = await Promise.all(
      books.map(async (book) => {
        const [{ count: c }] = await db
          .select({ count: count() })
          .from(readingSessionsTable)
          .where(eq(readingSessionsTable.bookId, book.id));
        return formatBook(book, Number(c ?? 0));
      })
    );
    return res.json(results);
  } catch (err) {
    req.log.error({ err }, "Error listing books");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/books", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const body = req.body as {
      title: string;
      author?: string | null;
      totalPages: number;
      currentPage?: number;
      setAsCurrent?: boolean;
    };
    if (body.setAsCurrent !== false) {
      await db
        .update(booksTable)
        .set({ isCurrent: false })
        .where(eq(booksTable.userId, uid));
    }
    const [inserted] = await db.insert(booksTable).values({
      userId: uid,
      title: body.title,
      author: body.author ?? null,
      totalPages: body.totalPages,
      currentPage: body.currentPage ?? 0,
      isCurrent: body.setAsCurrent !== false,
    }).returning();
    return res.status(201).json(formatBook(inserted, 0));
  } catch (err) {
    req.log.error({ err }, "Error creating book");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/books/:id", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const id = parseInt(req.params.id);
    const [book] = await db
      .select()
      .from(booksTable)
      .where(and(eq(booksTable.id, id), eq(booksTable.userId, uid)));
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    const [{ count: c }] = await db
      .select({ count: count() })
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.bookId, id));
    return res.json(formatBook(book, Number(c ?? 0)));
  } catch (err) {
    req.log.error({ err }, "Error getting book");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/books/:id", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const id = parseInt(req.params.id);
    const body = req.body as {
      title?: string;
      author?: string | null;
      totalPages?: number;
      currentPage?: number;
      isCurrent?: boolean;
    };
    if (body.isCurrent === true) {
      await db
        .update(booksTable)
        .set({ isCurrent: false })
        .where(eq(booksTable.userId, uid));
    }
    const [updated] = await db
      .update(booksTable)
      .set({
        ...(body.title !== undefined && { title: body.title }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.totalPages !== undefined && { totalPages: body.totalPages }),
        ...(body.currentPage !== undefined && { currentPage: body.currentPage }),
        ...(body.isCurrent !== undefined && { isCurrent: body.isCurrent }),
      })
      .where(and(eq(booksTable.id, id), eq(booksTable.userId, uid)))
      .returning();
    if (!updated) {
      return res.status(404).json({ message: "Book not found" });
    }
    const [{ count: c }] = await db
      .select({ count: count() })
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.bookId, id));
    return res.json(formatBook(updated, Number(c ?? 0)));
  } catch (err) {
    req.log.error({ err }, "Error updating book");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/books/:id/complete", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const id = parseInt(req.params.id);
    const [existing] = await db
      .select()
      .from(booksTable)
      .where(and(eq(booksTable.id, id), eq(booksTable.userId, uid)));
    if (!existing) {
      return res.status(404).json({ message: "Book not found" });
    }
    const [updated] = await db
      .update(booksTable)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        isCurrent: false,
        currentPage: existing.totalPages,
      })
      .where(and(eq(booksTable.id, id), eq(booksTable.userId, uid)))
      .returning();
    const [{ count: c }] = await db
      .select({ count: count() })
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.bookId, id));
    return res.json(formatBook(updated, Number(c ?? 0)));
  } catch (err) {
    req.log.error({ err }, "Error completing book");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
