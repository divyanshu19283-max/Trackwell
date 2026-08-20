import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const ticket = await db.ticket.findFirst({ where: { id: params.id, businessId: user.businessId } });
    if (!ticket) return apiError("Ticket not found.", 404);

    const activity = await db.ticketActivity.findMany({
      where: { ticketId: ticket.id },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true } } },
    });
    return apiOk(activity);
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to load ticket activity.", 500);
  }
}
