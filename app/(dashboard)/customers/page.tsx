import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Plus } from "lucide-react";

const PAGE_SIZE = 25;

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const q = searchParams.q?.trim();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const where = {
    businessId: session.businessId,
    deletedAt: null,
    ...(q
      ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }, { email: { contains: q, mode: "insensitive" as const } }] }
      : {}),
  };

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { tickets: true } } },
    }),
    db.customer.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Customers</h1>
          <p className="text-sm text-ink-500">{total} total</p>
        </div>
        <Link href="/customers/new" className="btn-primary"><Plus size={16} /> New customer</Link>
      </div>

      <form className="relative max-w-sm" method="get">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input name="q" defaultValue={q} placeholder="Search name, phone, or email" className="input pl-9" />
      </form>

      {customers.length === 0 ? (
        <EmptyState
          title={q ? "No customers match your search." : "No customers yet."}
          description={q ? "Try a different name, phone, or email." : "Add your first customer to start creating tickets."}
          action={!q && <Link href="/customers/new" className="btn-primary">Add customer</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="hidden px-4 py-2.5 md:table-cell">Email</th>
                <th className="px-4 py-2.5">Tickets</th>
                <th className="hidden px-4 py-2.5 md:table-cell">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    <Link href={`/customers/${c.id}`}>{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{c.phone}</td>
                  <td className="hidden px-4 py-3 text-ink-600 md:table-cell">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-ink-600">{c._count.tickets}</td>
                  <td className="hidden px-4 py-3 text-ink-500 md:table-cell">{formatDate(c.createdAt)}</td>
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
            <Link className={`btn-secondary ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={`/customers?page=${page - 1}${q ? `&q=${q}` : ""}`}>Previous</Link>
            <Link className={`btn-secondary ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`} href={`/customers?page=${page + 1}${q ? `&q=${q}` : ""}`}>Next</Link>
          </div>
        </div>
      )}
    </div>
  );
}
