import { describe, it, expect } from "vitest";
import { customerSchema, ticketSchema, registerSchema } from "@/lib/validation";

describe("validation schemas", () => {
  it("rejects a customer with no phone", () => {
    const result = customerSchema.safeParse({ name: "Test", phone: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid customer", () => {
    const result = customerSchema.safeParse({ name: "Test", phone: "9876543210" });
    expect(result.success).toBe(true);
  });

  it("rejects a ticket with no problem description", () => {
    const result = ticketSchema.safeParse({ customerId: "abc", deviceName: "Phone", problem: "" });
    expect(result.success).toBe(false);
  });

  it("rejects registration with a short password", () => {
    const result = registerSchema.safeParse({
      businessName: "Test Repairs",
      ownerName: "Test Owner",
      email: "test@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});
