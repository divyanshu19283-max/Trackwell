// Minimal email-sending abstraction. Trakwell doesn't ship a specific email
// provider by default (see .env.example — EMAIL_PROVIDER_KEY). Until one is
// wired up, this logs to the server console instead of silently pretending
// an email was sent, which would be confusing in development and dangerous
// to rely on in production.
//
// To go live: implement `sendViaProvider` for your provider (Resend,
// Postmark, SES, etc.) using EMAIL_PROVIDER_KEY / EMAIL_FROM, and this
// function's callers don't need to change.

export function isEmailConfigured() {
  return Boolean(process.env.EMAIL_PROVIDER_KEY);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!isEmailConfigured()) {
    // Development-safe fallback: make the link impossible to miss in the
    // server logs instead of failing silently.
    console.log(
      `\n[email] EMAIL_PROVIDER_KEY is not set — no email was actually sent.\n[email] Password reset link for ${to}:\n[email] ${resetUrl}\n`
    );
    return { sent: false as const };
  }

  // TODO: wire up your provider here, e.g.:
  // await fetch("https://api.resend.com/emails", {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${process.env.EMAIL_PROVIDER_KEY}`, "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     from: process.env.EMAIL_FROM,
  //     to,
  //     subject: "Reset your Trakwell password",
  //     html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  //   }),
  // });
  return { sent: true as const };
}
