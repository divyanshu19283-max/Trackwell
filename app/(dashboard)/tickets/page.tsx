import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ticketStatuses, ticketPriorities } from "@/lib/validation";
import { statusLabels } from "@/lib/utils";
import { Search, Plus } from "lucide-react";

const PAGE_SIZE = 25;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; priority?: string; overdue?: string; page?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q, status, priority, overdue } = searchParams;
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  const where: any = { businessId: session.businessId, deletedAt: null };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (overdue === "true") {
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
      include: { customer: { select: { name: true, phone: true } } },
    }),
    db.ticket.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, status, priority, overdue, ...overrides };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    return `?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Tickets</h1>
          <p className="text-sm text-ink-500">{total} total</p>
        </div>
        <Link href="/tickets/new" className="btn-primary"><Plus size={16} /> New ticket</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form className="relative" method="get">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={q} placeholder="Search ticket, device, customer" className="input w-64 pl-9" />
          {status && <input type="hidden" name="status" value={status} />}
          {priority && <input type="hidden" name="priority" value={priority} />}
        </form>
        <div className="flex flex-wrap gap-1.5">
          <Link href={qs({ status: undefined })} className={`badge ${!status ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-600"}`}>All</Link>
          {ticketStatuses.map((s) => (
            <Link key={s} href={qs({ status: s })} className={`badge ${status === s ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-600"}`}>
              {statusLabels[s]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ticketPriorities.map((p) => (
            <Link key={p} href={qs({ priority: priority === p ? undefined : p })} className={`badge ${priority === p ? "bg-amber-100 text-amber-800" : "bg-ink-100 text-ink-600"}`}>
              {p}
            </Link>
          ))}
        </div>
        <Link href={qs({ overdue: overdue === "true" ? undefined : "true" })} className={`badge ${overdue === "true" ? "bg-red-100 text-red-700" : "bg-ink-100 text-ink-600"}`}>
          Overdue
        </Link>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="No repair tickets yet."
          description="Create your first ticket to start tracking repairs."
          action={<Link href="/tickets/new" className="btn-primary">Create ticket</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2.5">Ticket</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="hidden px-4 py-2.5 md:table-cell">Device</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="hidden px-4 py-2.5 sm:table-cell">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3 font-medium text-ink-900"><Link href={`/tickets/${t.id}`}>{t.ticketNumber}</Link></td>
                  <td className="px-4 py-3 text-ink-600">{t.customer.name}</td>
                  <td className="hidden px-4 py-3 text-ink-600 md:table-cell">{t.deviceName}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="hidden px-4 py-3 sm:table-cell"><PriorityBadge priority={t.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-600">
          <span>Page {page} of {totalPages} · {total} results</span>
          <div className="flex gap-2">
            <Link className={`btn-secondary ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={qs({ page: String(page - 1) })}>Previous</Link>
            <Link className={`btn-secondary ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`} href={qs({ page: String(page + 1) })}>Next</Link>
          </div>
        </div>
      )}
    </div>
  );
}
