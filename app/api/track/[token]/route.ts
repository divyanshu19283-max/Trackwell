import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils";

// Public endpoint — intentionally requires NO session. Authorization is the
// unguessable random token itself, not the ticket id. We only ever return
// customer-safe fields: no internal notes, no user info, no database ids
// beyond the ticket number, no audit log.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const ticket = await db.ticket.findFirst({
    where: { trackingToken: params.token, deletedAt: null },
    include: { business: { select: { name: true, phone: true, email: true, logo: true } }, customer: { select: { name: true } } },
  });

  if (!ticket) return apiError("Tracking link not found.", 404);

  return apiOk({
    ticketNumber: ticket.ticketNumber,
    deviceName: ticket.deviceName,
    deviceModel: ticket.deviceModel,
    problem: ticket.problem,
    status: ticket.status,
    priority: ticket.priority,
    expectedCompletion: ticket.expectedCompletion,
    estimatedCost: ticket.estimatedCost,
    finalCost: ticket.status === "DELIVERED" ? ticket.finalCost : null,
    createdAt: ticket.createdAt,
    deliveredAt: ticket.deliveredAt,
    customerName: ticket.customer.name,
    business: ticket.business,
  });
}
