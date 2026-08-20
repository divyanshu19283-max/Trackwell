import { db } from "@/lib/db";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { ticketUpdateSchema } from "@/lib/validation";
import { permissions } from "@/lib/permissions";
import { apiError, apiOk } from "@/lib/utils";

async function getScopedTicket(businessId: string, id: string) {
  return db.ticket.findFirst({ where: { id, businessId, deletedAt: null }, include: { customer: true } });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const ticket = await getScopedTicket(user.businessId, params.id);
    if (!ticket) return apiError("Ticket not found.", 404);
    return apiOk(ticket);
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to load ticket.", 500);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await getScopedTicket(user.businessId, params.id);
    if (!existing) return apiError("Ticket not found.", 404);

    const body = await req.json().catch(() => null);
    const parsed = ticketUpdateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || "Invalid input.");
    const d = parsed.data;

    const changes: { action: string; oldValue?: string; newValue?: string }[] = [];
    const trackChange = (field: string, oldV: unknown, newV: unknown) => {
      if (newV !== undefined && String(oldV ?? "") !== String(newV ?? "")) {
        changes.push({ action: `${field} updated`, oldValue: String(oldV ?? "—"), newValue: String(newV ?? "—") });
      }
    };
    trackChange("Diagnosis", existing.diagnosis, d.diagnosis);
    trackChange("Estimated cost", existing.estimatedCost, d.estimatedCost);
    trackChange("Final cost", existing.finalCost, d.finalCost);
    trackChange("Priority", existing.priority, d.priority);

    const updated = await db.$transaction(async (tx) => {
      const u = await tx.ticket.update({
        where: { id: existing.id },
        data: {
          ...(d.deviceName !== undefined && { deviceName: d.deviceName }),
          ...(d.deviceModel !== undefined && { deviceModel: d.deviceModel || null }),
          ...(d.serialNumber !== undefined && { serialNumber: d.serialNumber || null }),
          ...(d.problem !== undefined && { problem: d.problem }),
          ...(d.diagnosis !== undefined && { diagnosis: d.diagnosis || null }),
          ...(d.estimatedCost !== undefined && { estimatedCost: d.estimatedCost }),
          ...(d.finalCost !== undefined && { finalCost: d.finalCost }),
          ...(d.priority !== undefined && { priority: d.priority }),
          ...(d.expectedCompletion !== undefined && {
            expectedCompletion: d.expectedCompletion ? new Date(d.expectedCompletion) : null,
          }),
        },
      });
      if (changes.length) {
        await tx.ticketActivity.createMany({
          data: changes.map((c) => ({ ticketId: existing.id, userId: user.id, ...c })),
        });
      }
      return u;
    });

    return apiOk(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to update ticket.", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    if (!permissions.canDeleteTicket(user.role as any)) {
      return apiError("You don't have permission to perform this action.", 403);
    }
    const existing = await getScopedTicket(user.businessId, params.id);
    if (!existing) return apiError("Ticket not found.", 404);

    await db.$transaction([
      db.ticket.update({ where: { id: existing.id }, data: { deletedAt: new Date() } }),
      db.ticketActivity.create({
        data: { ticketId: existing.id, userId: user.id, action: "Ticket deleted" },
      }),
    ]);

    return apiOk({ softDeleted: true, message: "Ticket deleted. It's kept in your records for audit purposes." });
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) return apiError(err.message, err.status);
    return apiError("Unable to delete ticket.", 500);
  }
}
