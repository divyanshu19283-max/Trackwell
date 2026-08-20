// DEMO DATA — only ever run this manually against a dev/staging database.
// Never run this against production; it is not wired into any deploy step.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const db = new PrismaClient();

function token() {
  return randomBytes(24).toString("base64url");
}

async function main() {
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const business = await db.business.create({
    data: {
      name: "Northside Device Repair",
      slug: "northside-device-repair",
      email: "owner@northsiderepair.demo",
      phone: "+91 98765 43210",
      address: "12 MG Road, Delhi",
    },
  });

  const owner = await db.user.create({
    data: { name: "Asha Verma", email: "owner@northsiderepair.demo", passwordHash, role: "OWNER", businessId: business.id },
  });
  const staff = await db.user.create({
    data: { name: "Ravi Kumar", email: "staff@northsiderepair.demo", passwordHash, role: "STAFF", businessId: business.id },
  });

  const customers = await Promise.all(
    [
      { name: "Rahul Sharma", phone: "+91 91234 56780", email: "rahul@example.com" },
      { name: "Priya Nair", phone: "+91 91234 56781", email: "priya@example.com" },
      { name: "Vikram Singh", phone: "+91 91234 56782", email: "vikram@example.com" },
    ].map((c) => db.customer.create({ data: { ...c, businessId: business.id } }))
  );

  const ticketDefs = [
    { customer: customers[0], deviceName: "iPhone 13", problem: "Screen cracked", status: "REPAIRING", estimatedCost: 4500 },
    { customer: customers[1], deviceName: "Dell XPS 13", problem: "Won't power on", status: "DIAGNOSING", estimatedCost: 2500 },
    { customer: customers[2], deviceName: "Samsung S22", problem: "Battery drains fast", status: "READY", estimatedCost: 1800 },
  ];

  let i = 0;
  for (const t of ticketDefs) {
    i++;
    const ticket = await db.ticket.create({
      data: {
        businessId: business.id,
        customerId: t.customer.id,
        ticketNumber: `SR-${1000 + i}`,
        deviceName: t.deviceName,
        problem: t.problem,
        status: t.status as any,
        estimatedCost: t.estimatedCost,
        trackingToken: token(),
      },
    });
    await db.ticketActivity.create({
      data: { ticketId: ticket.id, userId: owner.id, action: "Ticket created", newValue: ticket.ticketNumber },
    });
  }

  console.log("Seeded demo business: northside-device-repair");
  console.log("Owner login: owner@northsiderepair.demo / Demo1234!");
  console.log("Staff login: staff@northsiderepair.demo / Demo1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
