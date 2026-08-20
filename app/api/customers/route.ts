import { db } from "@/lib/db";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { customerSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/utils";

const PAGE_SIZE = 25;

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

    // Every query is scoped to user.businessId from the session — never from the client.
    const where = {
      businessId: user.businessId,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { _count: { select: { tickets: true } } },
      }),
      db.customer.count({ where }),
    ]);

    return apiOk({ customers, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
  } catch (err) {
    if (err instanceof UnauthorizedError) return apiError(err.message, err.status);
    return apiError("Unable to load customers.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || "Invalid input.");

    const customer = await db.customer.create({
      data: {
        businessId: user.businessId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null,
      },
    });
    return apiOk(customer, 201);
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) return apiError(err.message, err.status);
    return apiError("Unable to create customer.", 500);
  }
}
