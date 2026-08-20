import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { ticketSchema } from "@/lib/validation";
import { apiError, apiOk, generateTrackingToken, nextTicketNumber } from "@/lib/utils";

const PAGE_SIZE = 25;

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const overdue = searchParams.get("overdue") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

    const where: any = { businessId: user.businessId, deletedAt: null };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (overdue) {
      where.expectedCompletion = { lt: new Date() };
      where.status = { notIn: ["DELIVERED", "CANCELLED"] };
    }
    if (q) {
      where.OR = [
        { ticketNumber: { contains: q, mode: "insensitive" } },
        { deviceName: { contains: q, mode: "insensitive" } },
        { problem: { contains: q, mode: "insensitive" } },
        { customer: { is: { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      db.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { customer: { select: { id: true, name: true, phone: true } } },
      }),
      db.ticket.count({ where }),
    ]);

    return apiOk({ tickets, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to load tickets.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = ticketSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || "Invalid input.");

    // Confirm the customer belongs to this business before attaching a ticket to it.
    const customer = await db.customer.findFirst({
      where: { id: parsed.data.customerId, businessId: user.businessId, deletedAt: null },
    });
    if (!customer) return apiError("Customer not found.", 404);

    const ticketNumber = await nextTicketNumber(db, user.businessId);

    const ticket = await db.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          businessId: user.businessId,
          customerId: customer.id,
          ticketNumber,
          deviceName: parsed.data.deviceName,
          deviceModel: parsed.data.deviceModel || null,
          serialNumber: parsed.data.serialNumber || null,
          problem: parsed.data.problem,
          diagnosis: parsed.data.diagnosis || null,
          estimatedCost: parsed.data.estimatedCost ?? null,
          priority: parsed.data.priority,
          expectedCompletion: parsed.data.expectedCompletion ? new Date(parsed.data.expectedCompletion) : null,
          trackingToken: generateTrackingToken(),
        },
      });
      await tx.ticketActivity.create({
        data: { ticketId: created.id, userId: user.id, action: "Ticket created", newValue: ticketNumber },
      });
      return created;
    });

    return apiOk(ticket, 201);
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to create ticket.", 500);
  }
}
