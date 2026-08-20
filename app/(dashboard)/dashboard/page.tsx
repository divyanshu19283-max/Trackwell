import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, statusLabels } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const businessId = session.businessId;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalCustomers, byStatus, todayTickets, overdueTickets, delivered, pending, recentTickets] = await Promise.all([
    db.customer.count({ where: { businessId, deletedAt: null } }),
    db.ticket.groupBy({ by: ["status"], where: { businessId, deletedAt: null }, _count: true }),
    db.ticket.count({ where: { businessId, deletedAt: null, createdAt: { gte: startOfToday } } }),
    db.ticket.count({
      where: { businessId, deletedAt: null, status: { notIn: ["DELIVERED", "CANCELLED"] }, expectedCompletion: { lt: new Date() } },
    }),
    db.ticket.aggregate({ where: { businessId, deletedAt: null, status: "DELIVERED" }, _sum: { finalCost: true } }),
    db.ticket.aggregate({
      where: { businessId, deletedAt: null, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      _sum: { estimatedCost: true },
    }),
    db.ticket.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: { select: { name: true } } },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of byStatus) statusCounts[row.status] = row._count;
  const openTickets = Object.entries(statusCounts)
    .filter(([s]) => !["DELIVERED", "CANCELLED"].includes(s))
    .reduce((sum, [, c]) => sum + c, 0);

  const chartData = Object.entries(statusLabels)
    .filter(([key]) => key !== "CANCELLED")
    .map(([key, label]) => ({ name: label, value: statusCounts[key] || 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500">Live overview of your repair workflow.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total customers" value={totalCustomers} />
        <StatCard label="Open tickets" value={openTickets} />
        <StatCard label="Ready for pickup" value={statusCounts.READY || 0} />
        <StatCard label="Delivered" value={statusCounts.DELIVERED || 0} />
        <StatCard label="Repairing" value={statusCounts.REPAIRING || 0} />
        <StatCard label="Waiting for parts" value={statusCounts.WAITING_FOR_PARTS || 0} />
        <StatCard label="Today's tickets" value={todayTickets} />
        <StatCard label="Overdue" value={overdueTickets} hint={overdueTickets > 0 ? "Needs attention" : undefined} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <StatCard label="Revenue (delivered)" value={formatCurrency(delivered._sum.finalCost)} />
        <StatCard label="Pending estimated revenue" value={formatCurrency(pending._sum.estimatedCost)} />
      </div>

      <DashboardCharts statusData={chartData} />

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Recent tickets</h2>
          <Link href="/tickets" className="text-sm font-medium text-brand-700">View all</Link>
        </div>
        {recentTickets.length === 0 ? (
          <EmptyState
            title="No repair tickets yet."
            description="Create your first ticket to start tracking repairs."
            action={<Link href="/tickets/new" className="btn-primary">Create ticket</Link>}
          />
        ) : (
          <div className="divide-y divide-ink-100">
            {recentTickets.map((t) => (
              <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center justify-between py-3 text-sm hover:bg-ink-50 -mx-2 px-2 rounded-lg">
                <div>
                  <p className="font-medium text-ink-900">{t.ticketNumber} · {t.deviceName}</p>
                  <p className="text-ink-500">{t.customer.name} · {formatDate(t.createdAt)}</p>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
