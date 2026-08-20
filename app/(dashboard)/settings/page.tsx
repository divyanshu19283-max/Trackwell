import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { BusinessProfileForm } from "@/components/settings/BusinessProfileForm";
import { StaffPanel } from "@/components/settings/StaffPanel";
import { permissions } from "@/lib/permissions";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const business = await db.business.findUnique({ where: { id: session.businessId } });
  const staff = await db.user.findMany({
    where: { businessId: session.businessId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  const canManageStaff = permissions.canManageStaff(session.role as any);
  const canEditBusiness = permissions.canEditBusinessSettings(session.role as any);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500">Manage your business profile, team, and preferences.</p>
      </div>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink-900">Business profile</h2>
        <p className="mt-1 text-sm text-ink-500">Shown to customers on your public tracking pages.</p>
        <div className="mt-4">
          <BusinessProfileForm business={JSON.parse(JSON.stringify(business))} readOnly={!canEditBusiness} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink-900">Users & staff</h2>
        <p className="mt-1 text-sm text-ink-500">
          {canManageStaff ? "Add staff, change roles, or deactivate access." : "Only the business owner can manage staff."}
        </p>
        <div className="mt-4">
          <StaffPanel initialStaff={staff} canManage={canManageStaff} currentUserId={session.userId} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink-900">Notifications</h2>
        <p className="mt-1 text-sm text-ink-500">
          In-app notifications are on by default. Email and SMS notifications aren't configured yet — add
          <code className="mx-1 rounded bg-ink-100 px-1.5 py-0.5 text-xs">EMAIL_PROVIDER_KEY</code> to enable them.
        </p>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink-900">Billing</h2>
        <p className="mt-1 text-sm text-ink-500">
          You're on a free workspace. Payment processing isn't connected yet — add
          <code className="mx-1 rounded bg-ink-100 px-1.5 py-0.5 text-xs">PAYMENT_PROVIDER_KEY</code> to enable paid plans.
        </p>
      </section>
    </div>
  );
}
