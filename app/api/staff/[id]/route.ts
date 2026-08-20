import { db } from "@/lib/db";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { permissions } from "@/lib/permissions";
import { apiError, apiOk } from "@/lib/utils";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    if (!permissions.canManageStaff(user.role as any)) {
      return apiError("You don't have permission to perform this action.", 403);
    }
    const target = await db.user.findFirst({ where: { id: params.id, businessId: user.businessId } });
    if (!target) return apiError("Staff member not found.", 404);
    if (target.role === "OWNER") return apiError("The business owner's access can't be changed here.", 400);

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid input.");

    const updated = await db.user.update({
      where: { id: target.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return apiOk(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) return apiError(err.message, err.status);
    return apiError("Unable to update staff member.", 500);
  }
}
