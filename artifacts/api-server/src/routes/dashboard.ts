import { Router } from "express";
import { db, booksTable, readingSessionsTable, usersTable } from "@workspace/db";
import { eq, desc, count, and, gte, lte } from "drizzle-orm";
import { requireUser } from "../middleware/auth";

const router = Router();

function getDaysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

const ENCOURAGEMENT_MESSAGES = [
  "You showed up today.",
  "Progress counts, even on low energy days.",
  "Every page moves you forward.",
  "You're building something real.",
  "Nice work — you kept the habit alive.",
  "Small steps add up to something big.",
  "You followed through.",
  "Rest when you need to. The book will be there.",
  "Even two pages keeps the momentum going.",
  "You showed up. That's what matters.",
];

const RECOVERY_MESSAGES = [
  "Ready to pick it back up?",
  "A short session is enough to get back into it.",
  "Even two pages keeps the habit moving.",
  "Welcome back — the book's been waiting.",
  "No pressure. Just a few pages whenever you're ready.",
];

router.get("/dashboard/summary", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));

    const [currentBook] = await db
      .select()
      .from(booksTable)
      .where(and(eq(booksTable.userId, uid), eq(booksTable.isCurrent, true)));

    const allSessions = await db
      .select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.userId, uid))
      .orderBy(desc(readingSessionsTable.sessionDate));

    const today = getDateStr(new Date());

    const todaySessions = allSessions.filter(s => s.sessionDate === today);
    const todayMinutesRead = todaySessions.reduce((sum, s) => sum + s.minutesRead, 0);
    const todayPagesRead = todaySessions.reduce((sum, s) => sum + s.pagesRead, 0);
    const dailyGoal = user?.dailyGoalMinutes ?? 15;
    const todayGoalMet = todayMinutesRead >= dailyGoal;
    const totalPagesRead = allSessions.reduce((sum, s) => sum + s.pagesRead, 0);
    const totalMinutesRead = allSessions.reduce((sum, s) => sum + s.minutesRead, 0);

    const uniqueDates = [...new Set(allSessions.map(s => s.sessionDate))].sort().reverse();
    const lastReadAt = uniqueDates[0] ? new Date(uniqueDates[0] + "T12:00:00Z").toISOString() : null;

    let daysSinceLastRead: number | null = null;
    if (lastReadAt) {
      const last = new Date(lastReadAt);
      const now = new Date();
      daysSinceLastRead = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    }

    const isRecovering = daysSinceLastRead !== null && daysSinceLastRead > 1;

    let currentStreak = 0;
    let checkDate = new Date();
    for (let i = 0; i <= 365; i++) {
      const ds = getDateStr(checkDate);
      if (uniqueDates.includes(ds)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    let longestStreak = 0;
    let runningStreak = 0;
    const sortedUnique = [...uniqueDates].sort();
    for (let i = 0; i < sortedUnique.length; i++) {
      if (i === 0) {
        runningStreak = 1;
      } else {
        const prev = new Date(sortedUnique[i - 1] + "T12:00:00Z");
        const curr = new Date(sortedUnique[i] + "T12:00:00Z");
        const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        runningStreak = diff === 1 ? runningStreak + 1 : 1;
      }
      if (runningStreak > longestStreak) longestStreak = runningStreak;
    }

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const weekDates = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      weekDates.add(getDateStr(d));
    }
    const weeklyActiveDays = uniqueDates.filter(d => weekDates.has(d)).length;
    const momentumLabel = `${weeklyActiveDays} of 7 days`;

    const encouragementMessage = isRecovering
      ? RECOVERY_MESSAGES[Math.floor(Math.random() * RECOVERY_MESSAGES.length)]
      : ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];

    let formattedBook = null;
    if (currentBook) {
      const [{ count: c }] = await db
        .select({ count: count() })
        .from(readingSessionsTable)
        .where(eq(readingSessionsTable.bookId, currentBook.id));
      const percentComplete = currentBook.totalPages > 0
        ? Math.round((currentBook.currentPage / currentBook.totalPages) * 100)
        : 0;
      formattedBook = {
        id: currentBook.id,
        title: currentBook.title,
        author: currentBook.author ?? null,
        totalPages: currentBook.totalPages,
        currentPage: currentBook.currentPage,
        percentComplete,
        isCompleted: currentBook.isCompleted,
        completedAt: currentBook.completedAt?.toISOString() ?? null,
        lastReadAt: currentBook.lastReadAt?.toISOString() ?? null,
        totalSessions: Number(c ?? 0),
        isCurrent: currentBook.isCurrent,
        createdAt: currentBook.createdAt.toISOString(),
      };
    }

    return res.json({
      currentStreak,
      longestStreak,
      weeklyActiveDays,
      weeklyGoalDays: 7,
      momentumLabel,
      totalPagesRead,
      totalMinutesRead,
      lastReadAt,
      daysSinceLastRead,
      isRecovering,
      currentBook: formattedBook,
      todayMinutesRead,
      todayPagesRead,
      todayGoalMet,
      encouragementMessage,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting dashboard summary");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/dashboard/weekly", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const allSessions = await db
      .select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.userId, uid));

    const sessionsByDate = new Map<string, { pages: number; minutes: number }>();
    for (const s of allSessions) {
      const existing = sessionsByDate.get(s.sessionDate) ?? { pages: 0, minutes: 0 };
      sessionsByDate.set(s.sessionDate, {
        pages: existing.pages + s.pagesRead,
        minutes: existing.minutes + s.minutesRead,
      });
    }

    const today = new Date();
    const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const week = [];
    let activeDays = 0;
    let totalPagesThisWeek = 0;
    let totalMinutesThisWeek = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getDateStr(d);
      const activity = sessionsByDate.get(dateStr);
      const isActive = !!activity;
      if (isActive) activeDays++;
      const pages = activity?.pages ?? 0;
      const minutes = activity?.minutes ?? 0;
      totalPagesThisWeek += pages;
      totalMinutesThisWeek += minutes;
      week.push({
        date: dateStr,
        dayLabel: DAY_LABELS[d.getDay()],
        isActive,
        isToday: i === 0,
        isFuture: false,
        pagesRead: pages,
        minutesRead: minutes,
      });
    }

    return res.json({ week, activeDays, totalPagesThisWeek, totalMinutesThisWeek });
  } catch (err) {
    req.log.error({ err }, "Error getting weekly summary");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/dashboard/history", requireUser, async (req, res) => {
  try {
    const uid = req.currentUserId!;
    const monthParam = String(req.query.month ?? "");
    let monthStr: string;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      monthStr = monthParam;
    } else {
      const now = new Date();
      monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    const [year, month] = monthStr.split("-").map(Number);
    const startDate = `${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${monthStr}-${String(lastDay).padStart(2, "0")}`;

    const allSessions = await db
      .select()
      .from(readingSessionsTable)
      .where(
        and(
          eq(readingSessionsTable.userId, uid),
          gte(readingSessionsTable.sessionDate, startDate),
          lte(readingSessionsTable.sessionDate, endDate)
        )
      )
      .orderBy(desc(readingSessionsTable.createdAt));

    const bookIds = [...new Set(allSessions.map(s => s.bookId))];
    const bookTitles = new Map<number, string>();
    for (const bookId of bookIds) {
      const [book] = await db.select().from(booksTable).where(eq(booksTable.id, bookId));
      bookTitles.set(bookId, book?.title ?? "Unknown");
    }

    type SessionEntry = {
      id: number; bookId: number; bookTitle: string;
      pagesRead: number; minutesRead: number; startPage: number;
      endPage: number; sessionDate: string; notes: string | null; createdAt: string;
    };

    const sessionsByDate: Record<string, SessionEntry[]> = {};
    const activeDates: string[] = [];

    for (const s of allSessions) {
      if (!sessionsByDate[s.sessionDate]) {
        sessionsByDate[s.sessionDate] = [];
        activeDates.push(s.sessionDate);
      }
      sessionsByDate[s.sessionDate].push({
        id: s.id,
        bookId: s.bookId,
        bookTitle: bookTitles.get(s.bookId) ?? "Unknown",
        pagesRead: s.pagesRead,
        minutesRead: s.minutesRead,
        startPage: s.startPage,
        endPage: s.endPage,
        sessionDate: s.sessionDate,
        notes: s.notes ?? null,
        createdAt: s.createdAt.toISOString(),
      });
    }

    return res.json({
      month: monthStr,
      activeDates: [...new Set(activeDates)],
      sessionsByDate,
      monthlyStats: {
        totalSessions: allSessions.length,
        totalPages: allSessions.reduce((sum, s) => sum + s.pagesRead, 0),
        totalMinutes: allSessions.reduce((sum, s) => sum + s.minutesRead, 0),
        activeDays: [...new Set(allSessions.map(s => s.sessionDate))].length,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error getting reading history");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
