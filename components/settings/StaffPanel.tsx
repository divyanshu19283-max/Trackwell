"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

type Staff = { id: string; name: string; email: string; role: string; isActive: boolean };

export function StaffPanel({ initialStaff, canManage, currentUserId }: { initialStaff: Staff[]; canManage: boolean; currentUserId: string }) {
  const { push } = useToast();
  const [staff, setStaff] = useState(initialStaff);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Unable to add staff member."); return; }
      setStaff((s) => [...s, { ...json.data }]);
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      push("Staff account created");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/staff/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
    const json = await res.json();
    if (!res.ok) return push(json.error || "Unable to update.", "error");
    setStaff((s) => s.map((m) => (m.id === id ? { ...m, isActive: !isActive } : m)));
    push(!isActive ? "Staff member reactivated" : "Staff member deactivated");
  }

  return (
    <div className="space-y-5">
      <div className="divide-y divide-ink-100 rounded-lg border border-ink-100">
        {staff.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-ink-900">{m.name} {m.id === currentUserId && <span className="text-xs text-ink-400">(you)</span>}</p>
              <p className="text-ink-500">{m.email} · {m.role}{!m.isActive && " · Deactivated"}</p>
            </div>
            {canManage && m.role !== "OWNER" && (
              <button className="btn-ghost text-xs" onClick={() => toggleActive(m.id, m.isActive)}>
                {m.isActive ? "Deactivate" : "Reactivate"}
              </button>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <form onSubmit={addStaff} className="grid grid-cols-1 gap-3 rounded-lg border border-dashed border-ink-200 p-4 sm:grid-cols-2">
          <input required placeholder="Name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" placeholder="Temporary password" minLength={8} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
          {error && <p role="alert" className="col-span-2 text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-secondary col-span-2" disabled={loading}>{loading ? "Adding..." : "Add staff member"}</button>
        </form>
      )}
    </div>
  );
}
