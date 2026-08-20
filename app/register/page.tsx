"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, CheckCircle2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

type FormState = {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
};

const EMPTY_FORM: FormState = {
  businessName: "",
  ownerName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
};

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.businessName.trim().length > 0 && form.businessName.trim().length < 2) {
    errors.businessName = "Business name is too short";
  }
  if (form.ownerName.trim().length > 0 && form.ownerName.trim().length < 2) {
    errors.ownerName = "Your name is too short";
  }
  if (form.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address";
  }
  if (form.password.length > 0 && form.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }
  if (form.confirmPassword.length > 0 && form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords do not match";
  }
  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const errors = useMemo(() => validate(form), [form]);
  const isValid =
    form.businessName.trim().length >= 2 &&
    form.ownerName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length >= 8 &&
    form.confirmPassword === form.password &&
    Object.keys(errors).length === 0;

  function update(k: keyof FormState, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function markTouched(k: keyof FormState) {
    setTouched((t) => ({ ...t, [k]: true }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setTouched({
      businessName: true,
      ownerName: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true,
    });
    if (!isValid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // Response wasn't JSON (e.g. an unhandled server error rendered an
        // HTML error page). Fall through to the generic message below
        // rather than crashing on res.json().
      }

      if (!res.ok) {
        setServerError(json?.error || "Something went wrong. Please try again.");
        return;
      }

      if (json?.data?.sessionCreated === false) {
        setSuccessMessage(json.data.message || "Your workspace was created. Please sign in.");
        setTimeout(() => router.push("/login"), 1500);
        return;
      }

      setSuccessMessage("Workspace created! Redirecting...");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Zap size={18} />
          </div>
          <span className="text-lg font-semibold text-ink-900">Trakwell</span>
        </div>
        <div className="card p-6">
          <h1 className="text-lg font-semibold text-ink-900">Create your workspace</h1>
          <p className="mt-1 text-sm text-ink-500">Set up your business in under a minute.</p>

          {successMessage ? (
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="businessName">
                  Business name
                </label>
                <input
                  id="businessName"
                  required
                  className="input"
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  onBlur={() => markTouched("businessName")}
                  aria-invalid={Boolean(touched.businessName && errors.businessName)}
                />
                {touched.businessName && errors.businessName && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.businessName}
                  </p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="ownerName">
                  Your name
                </label>
                <input
                  id="ownerName"
                  required
                  className="input"
                  value={form.ownerName}
                  onChange={(e) => update("ownerName", e.target.value)}
                  onBlur={() => markTouched("ownerName")}
                  aria-invalid={Boolean(touched.ownerName && errors.ownerName)}
                />
                {touched.ownerName && errors.ownerName && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.ownerName}
                  </p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  onBlur={() => markTouched("email")}
                  aria-invalid={Boolean(touched.email && errors.email)}
                />
                {touched.email && errors.email && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  autoComplete="tel"
                  className="input"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <PasswordInput
                id="password"
                label="Password"
                value={form.password}
                onChange={(v) => update("password", v)}
                autoComplete="new-password"
                showStrength
                error={touched.password ? errors.password : undefined}
              />
              <PasswordInput
                id="confirmPassword"
                label="Confirm password"
                value={form.confirmPassword}
                onChange={(v) => update("confirmPassword", v)}
                autoComplete="new-password"
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
              />
              {serverError && (
                <p role="alert" className="text-sm text-red-600">
                  {serverError}
                </p>
              )}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Creating workspace..." : "Create workspace"}
              </button>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
