import { db } from "@/lib/db";
import { hashPassword, hashResetToken } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { apiError, apiOk, handleApiError } from "@/lib/utils";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message || "Invalid input.");
  }
  const { token, password } = parsed.data;

  try {
    const tokenHash = hashResetToken(token);
    const resetRecord = await db.passwordReset.findUnique({ where: { tokenHash } });

    const invalid =
      !resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt < new Date();

    if (invalid) {
      return apiError(
        "This reset link is invalid or has expired. Please request a new one.",
        400
      );
    }

    const passwordHash = await hashPassword(password);

    await db.$transaction([
      db.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      // Single-use: mark this token consumed immediately.
      db.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Defense in depth: invalidate any other outstanding reset tokens for
      // this user too, in case several were requested.
      db.passwordReset.updateMany({
        where: { userId: resetRecord.userId, usedAt: null, id: { not: resetRecord.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    return apiOk({ message: "Your password has been reset. You can now sign in." });
  } catch (err) {
    return handleApiError(err, "Unable to reset your password right now. Please try again.");
  }
}
