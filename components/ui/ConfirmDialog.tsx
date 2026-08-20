"use client";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4" role="dialog" aria-modal="true">
      <div className="card w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        <p className="mt-2 text-sm text-ink-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
