import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CustomerActions } from "@/components/customers/CustomerActions";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const customer = await db.customer.findFirst({
    where: { id: params.id, businessId: session.businessId, deletedAt: null },
  });
  if (!customer) notFound();

  const tickets = await db.ticket.findMany({
    where: { customerId: customer.id, businessId: session.businessId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{customer.name}</h1>
          <p className="text-sm text-ink-500">Customer since {formatDate(customer.createdAt)}</p>
        </div>
        <CustomerActions customerId={customer.id} role={session.role} hasTickets={tickets.length > 0} />
      </div>

      <div className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase text-ink-500">Phone</p>
          <p className="mt-1 text-sm text-ink-900">{customer.phone}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-ink-500">Email</p>
          <p className="mt-1 text-sm text-ink-900">{customer.email || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-ink-500">Address</p>
          <p className="mt-1 text-sm text-ink-900">{customer.address || "—"}</p>
        </div>
      </div>
      {customer.notes && (
        <div className="card p-5">
          <p className="text-xs font-medium uppercase text-ink-500">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-900">{customer.notes}</p>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Repair history</h2>
          <Link href={`/tickets/new?customerId=${customer.id}`} className="text-sm font-medium text-brand-700">New ticket</Link>
        </div>
        {tickets.length === 0 ? (
          <EmptyState title="No repair tickets yet." description="Create a ticket to start tracking a repair for this customer." />
        ) : (
          <div className="card divide-y divide-ink-100">
            {tickets.map((t) => (
              <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-ink-50">
                <div>
                  <p className="font-medium text-ink-900">{t.ticketNumber} · {t.deviceName}</p>
                  <p className="text-ink-500">{t.problem}</p>
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
