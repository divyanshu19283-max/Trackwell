import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { db } from "./db";
import { getSession } from "./session";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Password reset tokens: the raw token is only ever shown to the user once
// (in the email link). We store a SHA-256 hash of it, so a leaked database
// never exposes usable tokens — the same principle as never storing plaintext
// passwords.
export function generateResetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "You must be signed in to do that.") {
    super(message);
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "You don't have permission to perform this action.") {
    super(message);
  }
}

// Every API route that touches tenant data MUST call this instead of trusting
// any businessId/userId sent from the browser. The business always comes from
// the signed server-side session, never from request params or body.
export async function requireUser() {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive || user.businessId !== session.businessId) {
    throw new UnauthorizedError("Your session is no longer valid. Please sign in again.");
  }
  return user;
}

export function assertRole(user: { role: string }, allowed: Array<"OWNER" | "ADMIN" | "STAFF">) {
  if (!allowed.includes(user.role as any)) {
    throw new ForbiddenError();
  }
}
