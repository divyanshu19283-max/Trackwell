"use client";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  showStrength = false,
  error,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: "current-password" | "new-password";
  showStrength?: boolean;
  error?: string;
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          className="input pr-10"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-400 hover:text-ink-600"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={0}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
      {showStrength && value.length > 0 && <PasswordStrength password={value} />}
    </div>
  );
}

type Strength = { label: string; score: number; className: string };

function scorePassword(password: string): Strength {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "Weak", score, className: "bg-red-500 w-1/4" };
  if (score <= 2) return { label: "Fair", score, className: "bg-amber-500 w-2/4" };
  if (score <= 3) return { label: "Good", score, className: "bg-blue-500 w-3/4" };
  return { label: "Strong", score, className: "bg-emerald-500 w-full" };
}

function PasswordStrength({ password }: { password: string }) {
  const strength = scorePassword(password);
  return (
    <div className="mt-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full rounded-full transition-all ${strength.className}`} />
      </div>
      <p className="mt-1 text-xs text-ink-400">Password strength: {strength.label}</p>
    </div>
  );
}
