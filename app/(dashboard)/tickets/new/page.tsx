import { TicketForm } from "@/components/tickets/TicketForm";

export default function NewTicketPage({ searchParams }: { searchParams: { customerId?: string } }) {
  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-xl font-semibold text-ink-900">New repair ticket</h1>
      <div className="card p-6">
        <TicketForm initialCustomerId={searchParams.customerId} />
      </div>
    </div>
  );
}
