import Link from "next/link";
import { Zap, CheckCircle2, Users, Wrench, LineChart, ShieldCheck, Smartphone, Clock } from "lucide-react";

const features = [
  { icon: Users, title: "Customer records", desc: "Search by name, phone, or email. Every repair history in one place." },
  { icon: Wrench, title: "Ticket workflow", desc: "Received → Diagnosing → Repairing → Ready → Delivered, with a full audit trail." },
  { icon: Clock, title: "Live tracking page", desc: "Customers check repair status themselves — no account, no phone calls." },
  { icon: LineChart, title: "Real-time dashboard", desc: "Open tickets, revenue, overdue jobs — pulled straight from your data." },
  { icon: ShieldCheck, title: "Role-based access", desc: "Owners, admins, and staff each see exactly what they should." },
  { icon: Smartphone, title: "Built for mobile", desc: "Update a ticket status from the shop floor with one tap." },
];

const plans = [
  { name: "Starter", price: "₹499", desc: "For a single shop just getting started.", features: ["Up to 2 staff accounts", "Unlimited customers & tickets", "Public tracking pages", "Email support"] },
  { name: "Professional", price: "₹999", desc: "For growing teams that need more control.", featured: true, features: ["Up to 10 staff accounts", "Role-based permissions", "Audit logs", "Priority support"] },
  { name: "Business", price: "₹1,999", desc: "For multi-location repair businesses.", features: ["Unlimited staff accounts", "Advanced reporting", "File attachments", "Dedicated support"] },
];

const faqs = [
  { q: "Do my customers need an account to track their repair?", a: "No. Each ticket gets a private tracking link — customers just open it in a browser." },
  { q: "Can I use this for a business that isn't phone/laptop repair?", a: "Yes. Trakwell's ticket workflow works for any service business that tracks jobs from intake to completion." },
  { q: "Is my data isolated from other businesses on Trakwell?", a: "Yes. Every account is fully separated at the database level — your data is never visible to other businesses." },
];

export default function LandingPage() {
  return (
    <div className="bg-white text-ink-900">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"><Zap size={16} /></div>
            <span className="text-base font-semibold">Trakwell</span>
          </div>
          <nav className="hidden gap-6 text-sm text-ink-600 md:flex">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-ink-700">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm">Start free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
          Repair and service management, without the chaos.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-600">
          Trakwell is a simple system for repair and service businesses to manage customers, track jobs from intake
          to delivery, and give customers a live status page — without a single spreadsheet.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register" className="btn-primary">Start free trial</Link>
          <a href="#features" className="btn-secondary">See how it works</a>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-y border-ink-100 bg-ink-50 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-red-600">The problem</p>
            <h3 className="mt-2 text-xl font-semibold">Repair shops run on sticky notes and group chats.</h3>
            <p className="mt-2 text-sm text-ink-600">Customers call to ask "is it ready yet" ten times a day, and nobody remembers what was diagnosed last week.</p>
          </div>
          <div>
            <p className="text-sm font-medium text-brand-700">The solution</p>
            <h3 className="mt-2 text-xl font-semibold">One system, one source of truth.</h3>
            <p className="mt-2 text-sm text-ink-600">Every ticket, note, and status change lives in one place — and customers can check progress themselves.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-4">
          {["Create a customer", "Open a repair ticket", "Update status as work happens", "Customer tracks it live"].map((step, i) => (
            <div key={step} className="text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{i + 1}</div>
              <p className="mt-3 text-sm font-medium text-ink-800">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-ink-100 bg-ink-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-semibold">Everything a service team needs</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5">
                <Icon size={20} className="text-brand-600" />
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold">A dashboard that tells you what's actually happening</h2>
        <p className="mt-2 text-sm text-ink-600">Open tickets, revenue, overdue jobs — always current, never a spreadsheet.</p>
        <div className="mt-8 card p-6 text-left">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["Open tickets", "Ready for pickup", "Revenue", "Overdue"].map((label) => (
              <div key={label} className="rounded-lg border border-ink-100 p-3">
                <p className="text-xs text-ink-500">{label}</p>
                <div className="mt-2 h-3 w-12 rounded bg-ink-200" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-ink-100 bg-ink-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-semibold">Simple, transparent pricing</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className={`card p-6 ${p.featured ? "border-brand-500 ring-1 ring-brand-500" : ""}`}>
                <h3 className="text-sm font-semibold">{p.name}</h3>
                <p className="mt-2 text-3xl font-semibold">{p.price}<span className="text-sm font-normal text-ink-500">/month</span></p>
                <p className="mt-1 text-sm text-ink-500">{p.desc}</p>
                <ul className="mt-4 space-y-2 text-sm text-ink-700">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> {f}</li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-6 w-full ${p.featured ? "btn-primary" : "btn-secondary"}`}>Start free trial</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-8 space-y-6">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="text-sm font-semibold text-ink-900">{f.q}</h3>
              <p className="mt-1 text-sm text-ink-600">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-ink-100 bg-ink-900 py-16 text-center text-white">
        <h2 className="text-2xl font-semibold">Get your shop off sticky notes today.</h2>
        <Link href="/register" className="btn-primary mt-6 inline-flex bg-white text-ink-900 hover:bg-ink-100">Start your free trial</Link>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-ink-400">© {new Date().getFullYear()} Trakwell. All rights reserved.</footer>
    </div>
  );
}
