import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { registerSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { apiError, apiOk, handleApiError } from "@/lib/utils";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid request body.");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message || "Invalid input.");
  }
  const { businessName, ownerName, email, password, phone } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Checked up front for a clean error message, but a unique constraint
    // still backs this up in the transaction below in case two requests
    // race for the same email.
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return apiError("An account with this email already exists.", 409);
    }

    // Ensure a unique slug for the business (used in public-facing URLs later).
    const base = slugify(businessName) || "business";
    let slug = base;
    let n = 1;
    while (await db.business.findUnique({ where: { slug } })) {
      slug = `${base}-${++n}`;
    }

    const passwordHash = await hashPassword(password);

    const result = await db.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: { name: businessName, slug, email: normalizedEmail, phone: phone || null },
      });
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: normalizedEmail,
          passwordHash,
          role: "OWNER",
          businessId: business.id,
        },
      });
      return { business, user };
    });

    // Business + user were created successfully. Session creation is kept
    // separate so a session/config failure never rolls back — or hides —
    // the fact that the account itself was created.
    try {
      await createSession({
        userId: result.user.id,
        businessId: result.business.id,
        role: "OWNER",
      });
    } catch (sessionErr) {
      console.error("[register] account created but session creation failed", sessionErr);
      return apiOk(
        {
          businessId: result.business.id,
          sessionCreated: false,
          message: "Your workspace was created. Please sign in to continue.",
        },
        201
      );
    }

    return apiOk({ businessId: result.business.id, sessionCreated: true }, 201);
  } catch (err: any) {
    // Unique constraint raced past our pre-check (duplicate email or, far
    // less likely, a duplicate slug that slipped through the loop above).
    if (err?.code === "P2002") {
      const target = Array.isArray(err?.meta?.target) ? err.meta.target.join(",") : String(err?.meta?.target || "");
      if (target.includes("email")) {
        return apiError("An account with this email already exists.", 409);
      }
      if (target.includes("slug")) {
        return apiError("That business name is already taken. Please try a slightly different name.", 409);
      }
    }
    return handleApiError(err, "Registration temporarily unavailable. Please try again.");
  }
}
