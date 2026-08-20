import { requireUser, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const business = await db.business.findUnique({ where: { id: user.businessId } });
    return apiOk({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      business: business ? { id: business.id, name: business.name, slug: business.slug } : null,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
