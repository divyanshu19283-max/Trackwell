"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // Non-JSON response (e.g. an unhandled server error) — fall through
        // to the generic message below instead of throwing here.
      }

      if (!res.ok) {
        setError(json?.error || "Something went wrong. Please try again.");
        return;
      }
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
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
          <h1 className="text-lg font-semibold text-ink-900">Sign in</h1>
          <p className="mt-1 text-sm text-ink-500">Welcome back to your workspace.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
              <div className="mt-1.5 text-right">
                <Link href="/forgot-password" className="text-xs font-medium text-brand-700">
                  Forgot password?
                </Link>
              </div>
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-ink-500">
          No account yet? <Link href="/register" className="font-medium text-brand-700">Create one</Link>
        </p>
      </div>
    </div>
  );
}
