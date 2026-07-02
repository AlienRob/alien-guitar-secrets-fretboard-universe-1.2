import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import type { User } from "@workspace/db";
import { getOrCreateUserByClerkId } from "../lib/agsGameLogic";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appUser?: User;
    }
  }
}

// Requires an authenticated Clerk session and attaches the matching app user
// (creating it on first sign-in) as `req.appUser`.
export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    req.appUser = await getOrCreateUserByClerkId(clerkId);
    next();
  } catch (err) {
    next(err);
  }
}
