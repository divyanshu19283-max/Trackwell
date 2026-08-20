import { db } from "@/lib/db";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { permissions } from "@/lib/permissions";
import { apiError, apiOk } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    if (!permissions.canEditBusinessSettings(user.role as any)) {
      return apiError("You don't have permission to perform this action.", 403);
    }
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || "Invalid input.");

    const updated = await db.business.update({
      where: { id: user.businessId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
      },
    });
    return apiOk(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) return apiError(err.message, err.status);
    return apiError("Unable to update business profile.", 500);
  }
}
