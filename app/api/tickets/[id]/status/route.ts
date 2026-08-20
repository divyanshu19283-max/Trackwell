import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { statusChangeSchema } from "@/lib/validation";
import { statusLabels, apiError, apiOk } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await db.ticket.findFirst({
      where: { id: params.id, businessId: user.businessId, deletedAt: null },
    });
    if (!existing) return apiError("Ticket not found.", 404);

    const body = await req.json().catch(() => null);
    const parsed = statusChangeSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid status.");

    const { status } = parsed.data;
    const now = new Date();

    const updated = await db.$transaction(async (tx) => {
      const u = await tx.ticket.update({
        where: { id: existing.id },
        data: {
          status,
          ...(status === "READY" && !existing.completedAt && { completedAt: now }),
          ...(status === "DELIVERED" && { deliveredAt: now }),
        },
      });
      await tx.ticketActivity.create({
        data: {
          ticketId: existing.id,
          userId: user.id,
          action: "Status changed",
          oldValue: statusLabels[existing.status],
          newValue: statusLabels[status],
        },
      });
      return u;
    });

    return apiOk(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to update status.", 500);
  }
}
