import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const customer = await db.customer.findFirst({ where: { id: params.id, businessId: session.businessId, deletedAt: null } });
  if (!customer) notFound();

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-xl font-semibold text-ink-900">Edit customer</h1>
      <div className="card p-6">
        <CustomerForm customer={customer} />
      </div>
    </div>
  );
}
