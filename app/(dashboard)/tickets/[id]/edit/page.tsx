import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { TicketEditForm } from "@/components/tickets/TicketEditForm";

export default async function EditTicketPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const ticket = await db.ticket.findFirst({ where: { id: params.id, businessId: session.businessId, deletedAt: null } });
  if (!ticket) notFound();

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-xl font-semibold text-ink-900">Edit {ticket.ticketNumber}</h1>
      <div className="card p-6">
        <TicketEditForm ticket={JSON.parse(JSON.stringify(ticket))} />
      </div>
    </div>
  );
}
