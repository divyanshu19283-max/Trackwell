"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ticketPriorities } from "@/lib/validation";

export function TicketEditForm({ ticket }: { ticket: any }) {
  const router = useRouter();
  const { push } = useToast();
  const [form, setForm] = useState({
    deviceName: ticket.deviceName || "",
    deviceModel: ticket.deviceModel || "",
    problem: ticket.problem || "",
    diagnosis: ticket.diagnosis || "",
    estimatedCost: ticket.estimatedCost ?? "",
    finalCost: ticket.finalCost ?? "",
    priority: ticket.priority || "NORMAL",
    expectedCompletion: ticket.expectedCompletion ? String(ticket.expectedCompletion).slice(0, 10) : "",
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
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimatedCost: form.estimatedCost === "" ? null : Number(form.estimatedCost),
          finalCost: form.finalCost === "" ? null : Number(form.finalCost),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }
      push("Ticket updated");
      router.push(`/tickets/${ticket.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Device</label><input required className="input" value={form.deviceName} onChange={(e) => update("deviceName", e.target.value)} /></div>
        <div><label className="label">Model</label><input className="input" value={form.deviceModel} onChange={(e) => update("deviceModel", e.target.value)} /></div>
      </div>
      <div><label className="label">Problem</label><textarea required className="input" rows={2} value={form.problem} onChange={(e) => update("problem", e.target.value)} /></div>
      <div><label className="label">Diagnosis</label><textarea className="input" rows={2} value={form.diagnosis} onChange={(e) => update("diagnosis", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Estimated cost</label><input type="number" min="0" step="0.01" className="input" value={form.estimatedCost} onChange={(e) => update("estimatedCost", e.target.value)} /></div>
        <div><label className="label">Final cost</label><input type="number" min="0" step="0.01" className="input" value={form.finalCost} onChange={(e) => update("finalCost", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => update("priority", e.target.value)}>
            {ticketPriorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div><label className="label">Expected completion</label><input type="date" className="input" value={form.expectedCompletion} onChange={(e) => update("expectedCompletion", e.target.value)} /></div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Save changes"}</button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
