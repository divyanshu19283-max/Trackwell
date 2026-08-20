import { randomBytes } from "crypto";

export function generateTrackingToken() {
  return randomBytes(24).toString("base64url");
}

export async function nextTicketNumber(db: any, businessId: string) {
  const count = await db.ticket.count({ where: { businessId } });
  return `SR-${1000 + count + 1}`;
}

export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 50);
}

export const statusLabels: Record<string, string> = {
  RECEIVED: "Received",
  DIAGNOSING: "Diagnosing",
  WAITING_FOR_PARTS: "Waiting for Parts",
  REPAIRING: "Repairing",
  READY: "Ready for Pickup",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const statusOrder = ["RECEIVED", "DIAGNOSING", "WAITING_FOR_PARTS", "REPAIRING", "READY", "DELIVERED"];

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function apiOk(data: unknown, status = 200) {
  return Response.json({ data }, { status });
}

// Central catch-all for API route handlers. Never lets a raw error (Prisma
// message, stack trace, connection string, etc.) reach the client — always
// logs the real error server-side and returns a safe, useful message.
//
// Prisma error codes we care about here:
//   P2002 - unique constraint violation (e.g. duplicate email/slug)
//   P1001/P1002/P1008/P1017 - can't reach / timed out talking to the database
export function handleApiError(err: unknown, fallbackMessage: string) {
  // Known application errors (UnauthorizedError, ForbiddenError, etc.) are
  // handled by the caller before this runs — this is the last resort.
  console.error("[api]", fallbackMessage, err);

  if (err instanceof Error) {
    // Session/config problems (e.g. AUTH_SECRET missing) throw a plain Error
    // from lib/session.ts with this message — surface a clear, safe cause.
    if (err.message.includes("AUTH_SECRET")) {
      return apiError(
        "Authentication is not configured correctly on the server. Please contact support.",
        503
      );
    }
  }

  const code = (err as { code?: string } | null)?.code;
  if (typeof code === "string") {
    if (code === "P2002") {
      return apiError("That value is already in use. Please use a different one.", 409);
    }
    if (["P1001", "P1002", "P1008", "P1017"].includes(code)) {
      return apiError("Database is unavailable right now. Please try again in a moment.", 503);
    }
  }

  return apiError(fallbackMessage, 500);
}
