import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { noteSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await db.ticket.findFirst({
      where: { id: params.id, businessId: user.businessId, deletedAt: null },
    });
    if (!existing) return apiError("Ticket not found.", 404);

    const body = await req.json().catch(() => null);
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || "Invalid input.");

    const merged = existing.technicianNotes
      ? `${existing.technicianNotes}\n\n[${user.name}] ${parsed.data.note}`
      : `[${user.name}] ${parsed.data.note}`;

    const updated = await db.$transaction(async (tx) => {
      const u = await tx.ticket.update({ where: { id: existing.id }, data: { technicianNotes: merged } });
      await tx.ticketActivity.create({
        data: { ticketId: existing.id, userId: user.id, action: "Technician note added", newValue: parsed.data.note },
      });
      return u;
    });

    return apiOk(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to add note.", 500);
  }
}
