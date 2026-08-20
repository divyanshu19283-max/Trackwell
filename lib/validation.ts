import { z } from "zod";

export const registerSchema = z
  .object({
    businessName: z.string().trim().min(2, "Business name is too short").max(100),
    ownerName: z.string().trim().min(2, "Your name is too short").max(100),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z.string().trim().max(30).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset link is invalid or expired"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(30),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const ticketStatuses = [
  "RECEIVED",
  "DIAGNOSING",
  "WAITING_FOR_PARTS",
  "REPAIRING",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;

export const ticketPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export const ticketSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  deviceName: z.string().trim().min(1, "Device is required").max(120),
  deviceModel: z.string().trim().max(120).optional().or(z.literal("")),
  serialNumber: z.string().trim().max(120).optional().or(z.literal("")),
  problem: z.string().trim().min(1, "Describe the problem").max(2000),
  diagnosis: z.string().trim().max(2000).optional().or(z.literal("")),
  estimatedCost: z.coerce.number().nonnegative().optional().nullable(),
  finalCost: z.coerce.number().nonnegative().optional().nullable(),
  priority: z.enum(ticketPriorities).default("NORMAL"),
  expectedCompletion: z.string().optional().or(z.literal("")),
});

export const ticketUpdateSchema = ticketSchema.partial();

export const statusChangeSchema = z.object({
  status: z.enum(ticketStatuses),
});

export const noteSchema = z.object({
  note: z.string().trim().min(1, "Note cannot be empty").max(2000),
});

export const staffInviteSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "STAFF"]),
});
