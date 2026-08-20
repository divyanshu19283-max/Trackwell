"use client";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, CheckCircle2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const isValid = token.length > 0 && password.length >= 8 && confirmPassword === password;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValid) {
      if (!token) setError("This reset link is missing its token. Please request a new one.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
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
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
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
          <h1 className="text-lg font-semibold text-ink-900">Set a new password</h1>
          <p className="mt-1 text-sm text-ink-500">Choose a new password for your account.</p>

          {done ? (
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>Your password has been reset. Redirecting you to sign in...</span>
            </div>
          ) : !token ? (
            <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              This reset link is invalid or missing its token.{" "}
              <Link href="/forgot-password" className="font-medium underline">
                Request a new one
              </Link>
              .
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <PasswordInput
                id="password"
                label="New password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                showStrength
              />
              <PasswordInput
                id="confirmPassword"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                error={mismatch ? "Passwords do not match" : undefined}
              />
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading || !isValid}>
                {loading ? "Resetting..." : "Reset password"}
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
