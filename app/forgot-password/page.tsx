"use client";
import { useState } from "react";
import Link from "next/link";
import { Zap, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // fall through to generic error below
      }
      if (!res.ok) {
        setError(json?.error || "Something went wrong. Please try again.");
        return;
      }
      // Always show the same success state, regardless of whether the email
      // actually matched an account — this endpoint intentionally never
      // reveals whether an email is registered.
      setSent(true);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white"><Zap size={18} /></div>
          <span className="text-lg font-semibold text-ink-900">Trakwell</span>
        </div>
        <div className="card p-6">
          <h1 className="text-lg font-semibold text-ink-900">Reset your password</h1>
          <p className="mt-1 text-sm text-ink-500">
            Enter your email and we'll send you a link to reset it.
          </p>

          {sent ? (
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>If an account exists for that email, we've sent a link to reset your password.</span>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-ink-500">
          <Link href="/login" className="font-medium text-brand-700">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
