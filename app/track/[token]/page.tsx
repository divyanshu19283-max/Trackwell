import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Zap, Phone } from "lucide-react";
import { formatCurrency, formatDate, statusLabels, statusOrder } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function TrackPage({ params }: { params: { token: string } }) {
  // Public page — no session required. Authorization is the random token itself.
  const ticket = await db.ticket.findFirst({
    where: { trackingToken: params.token, deletedAt: null },
    include: {
      business: {
        select: { name: true, phone: true, email: true },
      },
      customer: {
        select: { name: true },
      },
    },
  });

  if (!ticket) notFound();

  const isCancelled = ticket.status === "CANCELLED";
  const currentIndex = statusOrder.indexOf(ticket.status);
  const progressPct = isCancelled
    ? 0
    : Math.max(6, ((currentIndex + 1) / statusOrder.length) * 100);

  const amount =
    ticket.status === "DELIVERED"
      ? ticket.finalCost
      : ticket.estimatedCost;

  return (
    <div className="min-h-screen bg-ink-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Zap size={18} />
          </div>

          <span className="text-lg font-semibold text-ink-900">
            {ticket.business.name}
          </span>
        </div>

        <div className="card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            Your Repair
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-ink-900">
            {ticket.ticketNumber}
          </h1>

          <p className="text-sm text-ink-600">
            {ticket.deviceName}
            {ticket.deviceModel ? ` · ${ticket.deviceModel}` : ""}
          </p>

          <div className="mt-5">
            <p className="text-xs font-medium uppercase text-ink-500">
              Current status
            </p>

            <p className="mt-1 text-lg font-semibold text-brand-700">
              {statusLabels[ticket.status]}
            </p>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {!isCancelled && (
            <ol className="mt-5 space-y-2">
              {statusOrder.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      i < currentIndex
                        ? "bg-emerald-500 text-white"
                        : i === currentIndex
                          ? "bg-brand-600 text-white"
                          : "bg-ink-200 text-ink-500"
                    }`}
                  >
                    {i < currentIndex
                      ? "✓"
                      : i === currentIndex
                        ? "●"
                        : "○"}
                  </span>

                  <span
                    className={
                      i <= currentIndex
                        ? "text-ink-900"
                        : "text-ink-400"
                    }
                  >
                    {statusLabels[s]}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-100 pt-5 text-sm">
            <div>
              <p className="text-xs uppercase text-ink-500">
                Expected completion
              </p>

              <p className="mt-1 text-ink-900">
                {formatDate(ticket.expectedCompletion)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-ink-500">
                {ticket.status === "DELIVERED"
                  ? "Final amount"
                  : "Estimated amount"}
              </p>

              <p className="mt-1 text-ink-900">
                {formatCurrency(amount?.toString())}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-ink-100 pt-5 text-sm">
            <p className="text-xs uppercase text-ink-500">
              Problem reported
            </p>

            <p className="mt-1 text-ink-900">
              {ticket.problem}
            </p>
          </div>

          {ticket.business.phone && (
            <a
              href={`tel:${ticket.business.phone}`}
              className="btn-primary mt-6 w-full"
            >
              <Phone size={16} />
              Contact {ticket.business.name}
            </a>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-ink-400">
          Powered by Trakwell
        </p>
      </div>
    </div>
  );
}