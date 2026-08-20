import { db } from "@/lib/db";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { customerSchema } from "@/lib/validation";
import { permissions } from "@/lib/permissions";
import { apiError, apiOk } from "@/lib/utils";

async function getScopedCustomer(businessId: string, id: string) {
  // Scoping by businessId in the WHERE clause is what makes cross-tenant
  // access impossible even if someone guesses another business's customer id.
  return db.customer.findFirst({ where: { id, businessId, deletedAt: null } });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const customer = await getScopedCustomer(user.businessId, params.id);
    if (!customer) return apiError("Customer not found.", 404);

    const tickets = await db.ticket.findMany({
      where: { customerId: customer.id, businessId: user.businessId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return apiOk({ customer, tickets });
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to load customer.", 500);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await getScopedCustomer(user.businessId, params.id);
    if (!existing) return apiError("Customer not found.", 404);

    const body = await req.json().catch(() => null);
    const parsed = customerSchema.partial().safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || "Invalid input.");

    const updated = await db.customer.update({
      where: { id: existing.id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
        ...(parsed.data.address !== undefined && { address: parsed.data.address || null }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes || null }),
      },
    });
    return apiOk(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to update customer.", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    if (!permissions.canDeleteCustomer(user.role as any)) {
      return apiError("You don't have permission to perform this action.", 403);
    }
    const existing = await getScopedCustomer(user.businessId, params.id);
    if (!existing) return apiError("Customer not found.", 404);

    const ticketCount = await db.ticket.count({ where: { customerId: existing.id, deletedAt: null } });

    // Never silently destroy repair history — soft delete instead when tickets exist.
    await db.customer.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });

    return apiOk({
      softDeleted: true,
      message:
        ticketCount > 0
          ? `Customer archived. Their ${ticketCount} repair ticket(s) are preserved for your records.`
          : "Customer archived.",
    });
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) return apiError(err.message, err.status);
    return apiError("Unable to delete customer.", 500);
  }
}
