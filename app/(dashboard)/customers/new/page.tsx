import { CustomerForm } from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-xl font-semibold text-ink-900">New customer</h1>
      <div className="card p-6">
        <CustomerForm />
      </div>
    </div>
  );
}
