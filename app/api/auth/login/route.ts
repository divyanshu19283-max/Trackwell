import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { apiError, apiOk, handleApiError } from "@/lib/utils";

// Simple in-memory rate limit per process. In production, back this with
// Redis or your edge provider's rate limiter so it works across instances.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function tooManyAttempts(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message || "Invalid input.");
  }
  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const rateLimitKey = `${ip}:${normalizedEmail}`;

  if (tooManyAttempts(rateLimitKey)) {
    return apiError("Too many login attempts. Please try again later.", 429);
  }

  try {
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    // Always compare against a hash (even a dummy one) to avoid timing leaks
    // that reveal whether an email exists.
    const validPassword = await verifyPassword(
      password,
      user?.passwordHash || "$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsalu"
    );

    if (!user || !validPassword) {
      return apiError("Invalid email or password.", 401);
    }
    if (!user.isActive) {
      // Deliberately more specific than "invalid credentials" here — the
      // person has proven they know the password, so this doesn't leak
      // anything an attacker couldn't already infer.
      return apiError("This account has been disabled. Contact your workspace owner.", 403);
    }

    await createSession({ userId: user.id, businessId: user.businessId, role: user.role as any });
    return apiOk({ id: user.id, name: user.name, role: user.role });
  } catch (err) {
    return handleApiError(err, "Unable to sign in right now. Please try again.");
  }
}
