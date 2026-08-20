"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

type Customer = { id?: string; name?: string; phone?: string; email?: string | null; address?: string | null; notes?: string | null };

export function CustomerForm({ customer, redirectOnSave }: { customer?: Customer; redirectOnSave?: (id: string) => string }) {
  const router = useRouter();
  const { push } = useToast();
  const [form, setForm] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
    notes: customer?.notes || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = customer?.id ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer?.id ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }
      push(customer?.id ? "Customer updated" : "Customer created");
      const id = customer?.id || json.data.id;
      router.push(redirectOnSave ? redirectOnSave(id) : `/customers/${id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input required className="input" value={form.name} onChange={(e) => update("name", e.target.value)} />
      </div>
      <div>
        <label className="label">Phone</label>
        <input required className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
      </div>
      <div>
        <label className="label">Email (optional)</label>
        <input type="email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
      </div>
      <div>
        <label className="label">Address (optional)</label>
        <input className="input" value={form.address} onChange={(e) => update("address", e.target.value)} />
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <textarea className="input" rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : customer?.id ? "Save changes" : "Create customer"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
