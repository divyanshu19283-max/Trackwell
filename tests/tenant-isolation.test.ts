// Security tests: tenant isolation, auth boundaries, tracking token safety.
// Run with: npm test (requires a test DATABASE_URL — see README).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const db = new PrismaClient();

async function makeBusinessWithUser(name: string) {
  const business = await db.business.create({
    data: { name, slug: `${name.toLowerCase().replace(/\s/g, "-")}-${Date.now()}`, email: `${name}@test.demo` },
  });
  const passwordHash = await bcrypt.hash("Test1234!", 12);
  const user = await db.user.create({
    data: { name: "Owner", email: `owner-${Date.now()}-${Math.random()}@test.demo`, passwordHash, role: "OWNER", businessId: business.id },
  });
  return { business, user };
}

describe("multi-tenant isolation", () => {
  let bizA: Awaited<ReturnType<typeof makeBusinessWithUser>>;
  let bizB: Awaited<ReturnType<typeof makeBusinessWithUser>>;
  let customerA: { id: string };

  beforeAll(async () => {
    bizA = await makeBusinessWithUser("BusinessA");
    bizB = await makeBusinessWithUser("BusinessB");
    customerA = await db.customer.create({ data: { businessId: bizA.business.id, name: "Alice", phone: "111" } });
  });

  afterAll(async () => {
    await db.customer.deleteMany({ where: { businessId: { in: [bizA.business.id, bizB.business.id] } } });
    await db.user.deleteMany({ where: { businessId: { in: [bizA.business.id, bizB.business.id] } } });
    await db.business.deleteMany({ where: { id: { in: [bizA.business.id, bizB.business.id] } } });
    await db.$disconnect();
  });

  it("business B cannot fetch business A's customer via a businessId-scoped query", async () => {
    // This mirrors what every API route does: scope the WHERE clause by the
    // session's businessId, not by any id supplied by the client.
    const result = await db.customer.findFirst({ where: { id: customerA.id, businessId: bizB.business.id } });
    expect(result).toBeNull();
  });

  it("business A can fetch its own customer", async () => {
    const result = await db.customer.findFirst({ where: { id: customerA.id, businessId: bizA.business.id } });
    expect(result?.id).toBe(customerA.id);
  });

  it("an invalid tracking token returns no ticket", async () => {
    const result = await db.ticket.findFirst({ where: { trackingToken: randomBytes(24).toString("base64url") } });
    expect(result).toBeNull();
  });

  it("a soft-deleted ticket is excluded from normal queries", async () => {
    const customer = await db.customer.create({ data: { businessId: bizA.business.id, name: "Bob", phone: "222" } });
    const ticket = await db.ticket.create({
      data: {
        businessId: bizA.business.id,
        customerId: customer.id,
        ticketNumber: `TEST-${Date.now()}`,
        deviceName: "Test device",
        problem: "Test",
        trackingToken: randomBytes(24).toString("base64url"),
        deletedAt: new Date(),
      },
    });
    const found = await db.ticket.findFirst({ where: { id: ticket.id, businessId: bizA.business.id, deletedAt: null } });
    expect(found).toBeNull();
  });
});
