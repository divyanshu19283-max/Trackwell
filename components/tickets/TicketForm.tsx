"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ticketPriorities } from "@/lib/validation";

type Customer = { id: string; name: string; phone: string };

export function TicketForm({ initialCustomerId }: { initialCustomerId?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    customerId: initialCustomerId || "",
    deviceName: "",
    deviceModel: "",
    serialNumber: "",
    problem: "",
    diagnosis: "",
    estimatedCost: "",
    priority: "NORMAL",
    expectedCompletion: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/customers?page=1").then((r) => r.json()).then((j) => setCustomers(j.data?.customers || []));
  }, []);

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }
      push("Ticket created");
      router.push(`/tickets/${json.data.id}`);
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
        <label className="label">Customer</label>
        <select required className="input" value={form.customerId} onChange={(e) => update("customerId", e.target.value)}>
          <option value="">Select a customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Device</label>
          <input required className="input" value={form.deviceName} onChange={(e) => update("deviceName", e.target.value)} placeholder="iPhone 13" />
        </div>
        <div>
          <label className="label">Model / details (optional)</label>
          <input className="input" value={form.deviceModel} onChange={(e) => update("deviceModel", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Serial number (optional)</label>
        <input className="input" value={form.serialNumber} onChange={(e) => update("serialNumber", e.target.value)} />
      </div>
      <div>
        <label className="label">Problem reported</label>
        <textarea required className="input" rows={3} value={form.problem} onChange={(e) => update("problem", e.target.value)} placeholder="Screen cracked" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Estimated cost (optional)</label>
          <input type="number" min="0" step="0.01" className="input" value={form.estimatedCost} onChange={(e) => update("estimatedCost", e.target.value)} />
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => update("priority", e.target.value)}>
            {ticketPriorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Expected completion (optional)</label>
        <input type="date" className="input" value={form.expectedCompletion} onChange={(e) => update("expectedCompletion", e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Creating..." : "Create ticket"}</button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
