"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Copy, Share2, Pencil, Trash2, Plus } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate, formatDateTime, statusLabels, statusOrder } from "@/lib/utils";

type Ticket = {
  id: string;
  ticketNumber: string;
  deviceName: string;
  deviceModel?: string | null;
  problem: string;
  diagnosis?: string | null;
  technicianNotes?: string | null;
  status: string;
  priority: string;
  estimatedCost?: string | number | null;
  finalCost?: string | number | null;
  expectedCompletion?: string | null;
  trackingToken: string;
  createdAt: string;
  customer: { id: string; name: string; phone: string };
};

type Activity = { id: string; action: string; oldValue?: string | null; newValue?: string | null; createdAt: string; user?: { name: string } | null };

export function TicketWorkspace({ ticket, activity, role, appUrl }: { ticket: Ticket; activity: Activity[]; role: string; appUrl: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [statusLoading, setStatusLoading] = useState(false);
  const [note, setNote] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const canDelete = role === "OWNER" || role === "ADMIN";
  const trackingUrl = `${appUrl}/track/${ticket.trackingToken}`;

  async function changeStatus(status: string) {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) return push(json.error || "Unable to update status.", "error");
      push("Status changed");
      router.refresh();
    } finally {
      setStatusLoading(false);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setNoteLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const json = await res.json();
      if (!res.ok) return push(json.error || "Unable to add note.", "error");
      push("Note added");
      setNote("");
      router.refresh();
    } finally {
      setNoteLoading(false);
    }
  }

  async function deleteTicket() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) return push(json.error || "Unable to delete ticket.", "error");
      push("Ticket deleted");
      router.push("/tickets");
      router.refresh();
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
    }
  }

  function copyPhone() {
    navigator.clipboard.writeText(ticket.customer.phone);
    push("Phone number copied");
  }

  function shareTrackingLink() {
    navigator.clipboard.writeText(trackingUrl);
    push("Tracking link copied");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{ticket.ticketNumber}</h1>
          <p className="text-sm text-ink-500">{ticket.customer.name} · {formatDate(ticket.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/tickets/${ticket.id}/edit`} className="btn-secondary"><Pencil size={15} /> Edit</Link>
          {canDelete && (
            <button className="btn-secondary text-red-600" onClick={() => setConfirmOpen(true)}><Trash2 size={15} /> Delete</button>
          )}
        </div>
      </div>

      {/* Quick actions — optimized for one-handed mobile use */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <a href={`tel:${ticket.customer.phone}`} className="btn-secondary justify-center"><Phone size={15} /> Call</a>
        <button onClick={copyPhone} className="btn-secondary justify-center"><Copy size={15} /> Copy phone</button>
        <button onClick={shareTrackingLink} className="btn-secondary justify-center"><Share2 size={15} /> Share link</button>
        <Link href={`/tickets/${ticket.id}/edit`} className="btn-secondary justify-center"><Plus size={15} /> Add cost</Link>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div><p className="text-xs uppercase text-ink-500">Device</p><p className="mt-1 text-ink-900">{ticket.deviceName}{ticket.deviceModel ? ` (${ticket.deviceModel})` : ""}</p></div>
          <div><p className="text-xs uppercase text-ink-500">Estimated cost</p><p className="mt-1 text-ink-900">{formatCurrency(ticket.estimatedCost)}</p></div>
          <div><p className="text-xs uppercase text-ink-500">Final cost</p><p className="mt-1 text-ink-900">{formatCurrency(ticket.finalCost)}</p></div>
          <div><p className="text-xs uppercase text-ink-500">Expected completion</p><p className="mt-1 text-ink-900">{formatDate(ticket.expectedCompletion)}</p></div>
        </div>
        <div className="mt-4">
          <p className="text-xs uppercase text-ink-500">Problem reported</p>
          <p className="mt-1 text-sm text-ink-900">{ticket.problem}</p>
        </div>
        {ticket.diagnosis && (
          <div className="mt-4">
            <p className="text-xs uppercase text-ink-500">Diagnosis</p>
            <p className="mt-1 text-sm text-ink-900">{ticket.diagnosis}</p>
          </div>
        )}
      </div>

      {/* Large status control — easy to tap on mobile */}
      <div className="card p-5">
        <p className="mb-3 text-sm font-semibold text-ink-900">Update status</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {statusOrder.concat(["CANCELLED"]).map((s) => (
            <button
              key={s}
              disabled={statusLoading || ticket.status === s}
              onClick={() => changeStatus(s)}
              className={`rounded-lg border px-3 py-3 text-sm font-medium ${
                ticket.status === s ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="card p-5">
        <p className="mb-3 text-sm font-semibold text-ink-900">Timeline</p>
        <ol className="space-y-3 border-l border-ink-200 pl-4">
          {activity.map((a) => (
            <li key={a.id} className="relative text-sm">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
              <p className="text-ink-900">
                {a.action}
                {a.oldValue && a.newValue ? `: ${a.oldValue} → ${a.newValue}` : a.newValue ? ` — ${a.newValue}` : ""}
              </p>
              <p className="text-xs text-ink-500">{formatDateTime(a.createdAt)}{a.user?.name ? ` · ${a.user.name}` : ""}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Technician notes (internal only — never shown on the public tracking page) */}
      <div className="card p-5">
        <p className="mb-3 text-sm font-semibold text-ink-900">Technician notes (internal)</p>
        {ticket.technicianNotes && <p className="mb-3 whitespace-pre-wrap text-sm text-ink-700">{ticket.technicianNotes}</p>}
        <div className="flex gap-2">
          <input className="input" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn-secondary" onClick={addNote} disabled={noteLoading}>{noteLoading ? "Adding..." : "Add"}</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this repair ticket?"
        description="This action cannot be undone from here — the ticket is archived and kept in your audit history."
        loading={deleteLoading}
        onConfirm={deleteTicket}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
