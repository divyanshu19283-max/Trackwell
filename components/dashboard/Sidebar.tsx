"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Wrench, Settings, LogOut, Zap } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/tickets", label: "Tickets", icon: Wrench },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-200 bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Zap size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">Trakwell</p>
            <p className="truncate text-xs text-ink-500">{businessName}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink-100 p-3">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            <LogOut size={17} /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-200 bg-white md:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs ${active ? "text-brand-700" : "text-ink-500"}`}
            >
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
