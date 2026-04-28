import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { supabase } from "../lib/supabase";

declare global {
  namespace Express {
    interface Request {
      userEmail?: string;
      currentUserId?: number;
      supabaseUserId?: string;
    }
  }
}

export async function extractUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) return next();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return next();

  req.userEmail = user.email;
  req.supabaseUserId = user.id;

  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      or(
        eq(usersTable.supabaseAuthId, user.id),
        eq(usersTable.email, user.email!)
      )
    );

  if (dbUser) {
    req.currentUserId = dbUser.id;
  }

  return next();
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUserId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  return next();
}
