"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

export function CustomerActions({ customerId, role, hasTickets }: { customerId: string; role: string; hasTickets: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const canDelete = role === "OWNER" || role === "ADMIN";

  async function onDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        push(json.error || "Unable to delete customer.", "error");
        return;
      }
      push(json.data.message || "Customer deleted");
      router.push("/customers");
      router.refresh();
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Link href={`/customers/${customerId}/edit`} className="btn-secondary"><Pencil size={15} /> Edit</Link>
      {canDelete && (
        <button className="btn-secondary text-red-600" onClick={() => setConfirmOpen(true)}>
          <Trash2 size={15} /> Delete
        </button>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this customer?"
        description={
          hasTickets
            ? "This customer has repair tickets on file. They'll be archived, not erased — their ticket history stays intact."
            : "This action cannot be undone."
        }
        loading={loading}
        onConfirm={onDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
