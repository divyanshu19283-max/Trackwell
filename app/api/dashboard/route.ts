import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const businessId = user.businessId;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      byStatus,
      todayTickets,
      overdueTickets,
      deliveredWithCost,
      pendingWithEstimate,
      recentTickets,
    ] = await Promise.all([
      db.customer.count({ where: { businessId, deletedAt: null } }),
      db.ticket.groupBy({ by: ["status"], where: { businessId, deletedAt: null }, _count: true }),
      db.ticket.count({ where: { businessId, deletedAt: null, createdAt: { gte: startOfToday } } }),
      db.ticket.count({
        where: {
          businessId,
          deletedAt: null,
          status: { notIn: ["DELIVERED", "CANCELLED"] },
          expectedCompletion: { lt: new Date() },
        },
      }),
      db.ticket.aggregate({
        where: { businessId, deletedAt: null, status: "DELIVERED" },
        _sum: { finalCost: true },
      }),
      db.ticket.aggregate({
        where: { businessId, deletedAt: null, status: { notIn: ["DELIVERED", "CANCELLED"] } },
        _sum: { estimatedCost: true },
      }),
      db.ticket.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { customer: { select: { name: true } } },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of byStatus) statusCounts[row.status] = row._count;

    // Tickets created per day for the last 14 days (for the trend chart).
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const recentForTrend = await db.ticket.findMany({
      where: { businessId, deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const trend: Record<string, number> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      trend[d.toISOString().slice(0, 10)] = 0;
    }
    for (const t of recentForTrend) {
      const key = new Date(t.createdAt).toISOString().slice(0, 10);
      if (key in trend) trend[key] += 1;
    }

    return apiOk({
      totalCustomers,
      statusCounts,
      openTickets: Object.entries(statusCounts)
        .filter(([s]) => !["DELIVERED", "CANCELLED"].includes(s))
        .reduce((sum, [, c]) => sum + c, 0),
      todayTickets,
      overdueTickets,
      revenue: Number(deliveredWithCost._sum.finalCost || 0),
      pendingRevenue: Number(pendingWithEstimate._sum.estimatedCost || 0),
      recentTickets,
      trend: Object.entries(trend).map(([date, count]) => ({ date, count })),
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to load dashboard.", 500);
  }
}
