"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function BusinessProfileForm({ business, readOnly }: { business: any; readOnly: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [form, setForm] = useState({
    name: business?.name || "",
    email: business?.email || "",
    phone: business?.phone || "",
    address: business?.address || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/business", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Something went wrong."); return; }
      push("Business profile saved");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div><label className="label">Business name</label><input disabled={readOnly} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><label className="label">Email</label><input disabled={readOnly} type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div><label className="label">Phone</label><input disabled={readOnly} className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div><label className="label">Address</label><input disabled={readOnly} className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!readOnly && <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Save changes"}</button>}
    </form>
  );
}
