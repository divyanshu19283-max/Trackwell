import { statusLabels } from "@/lib/utils";

const styles: Record<string, string> = {
  RECEIVED: "bg-ink-100 text-ink-700",
  DIAGNOSING: "bg-amber-100 text-amber-800",
  WAITING_FOR_PARTS: "bg-orange-100 text-orange-800",
  REPAIRING: "bg-blue-100 text-blue-800",
  READY: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-ink-200 text-ink-600",
  CANCELLED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${styles[status] || "bg-ink-100 text-ink-700"}`}>{statusLabels[status] || status}</span>;
}

const priorityStyles: Record<string, string> = {
  LOW: "bg-ink-100 text-ink-600",
  NORMAL: "bg-blue-50 text-blue-700",
  HIGH: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-700",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`badge ${priorityStyles[priority] || "bg-ink-100 text-ink-600"}`}>{priority}</span>;
}
