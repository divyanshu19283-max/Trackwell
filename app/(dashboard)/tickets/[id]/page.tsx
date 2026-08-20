import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { TicketWorkspace } from "@/components/tickets/TicketWorkspace";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const ticket = await db.ticket.findFirst({
    where: { id: params.id, businessId: session.businessId, deletedAt: null },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });
  if (!ticket) notFound();

  const activity = await db.ticketActivity.findMany({
    where: { ticketId: ticket.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true } } },
  });

  return (
    <TicketWorkspace
      ticket={JSON.parse(JSON.stringify(ticket))}
      activity={JSON.parse(JSON.stringify(activity))}
      role={session.role}
      appUrl={process.env.APP_URL || "http://localhost:3000"}
    />
  );
}
