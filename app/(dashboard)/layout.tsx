import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const business = await db.business.findUnique({ where: { id: session.businessId } });
  if (!business) redirect("/login");

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-ink-50">
        <Sidebar businessName={business.name} />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
