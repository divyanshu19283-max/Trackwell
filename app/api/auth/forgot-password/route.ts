import { db } from "@/lib/db";
import { generateResetToken, hashResetToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Always returns the same generic message whether or not the email exists,
// so this endpoint can't be used to enumerate registered accounts.
const GENERIC_MESSAGE =
  "If an account exists for that email, we've sent a link to reset your password.";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message || "Invalid input.");
  }
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  try {
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    // Only do the (more expensive) token + email work if a matching, active
    // user actually exists — but the HTTP response is identical either way.
    if (user && user.isActive) {
      const token = generateResetToken();
      const tokenHash = hashResetToken(token);

      await db.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    return apiOk({ message: GENERIC_MESSAGE });
  } catch (err) {
    // Even on an unexpected error, don't leak anything more specific than
    // the generic message — but do log it so it's actionable server-side.
    console.error("[forgot-password]", err);
    return apiOk({ message: GENERIC_MESSAGE });
  }
}
