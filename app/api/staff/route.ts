import { db } from "@/lib/db";
import { requireUser, hashPassword, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { permissions } from "@/lib/permissions";
import { staffInviteSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const staff = await db.user.findMany({
      where: { businessId: user.businessId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    return apiOk(staff);
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to load staff.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!permissions.canManageStaff(user.role as any)) {
      return apiError("You don't have permission to perform this action.", 403);
    }
    const body = await req.json().catch(() => null);
    const parsed = staffInviteSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || "Invalid input.");

    const existing = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (existing) return apiError("A user with this email already exists.", 409);

    const passwordHash = await hashPassword(parsed.data.password);
    const created = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        role: parsed.data.role,
        businessId: user.businessId,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return apiOk(created, 201);
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) return apiError(err.message, err.status);
    return apiError("Unable to create staff account.", 500);
  }
}
