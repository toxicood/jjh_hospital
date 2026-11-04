import { z } from "zod";

const MOBILE_RE = /^[6-9]\d{9}$/; // Indian mobile: starts 6-9, 10 digits
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Checkbox-safe boolean (avoids z.coerce.boolean treating "false" as true). */
export const boolField = z.preprocess(
  (v) => v === true || v === "true" || v === "on" || v === 1 || v === "1",
  z.boolean(),
);


export const mobileSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-]/g, "").replace(/^(\+?91)/, ""))
  .pipe(z.string().regex(MOBILE_RE, "Enter a valid 10-digit Indian mobile number"));

export const appointmentCreateSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(80),
  mobile: mobileSchema,
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  age: z.coerce.number().int().min(0).max(120),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  departmentId: z.coerce.number().int().positive(),
  doctorId: z.coerce.number().int().positive(),
  date: z.string().regex(DATE_RE, "Invalid date"),
  time: z.string().regex(TIME_RE, "Invalid time"),
  problemDescription: z.string().trim().max(1000).optional(),
});

export const appointmentStatusCheckSchema = z.object({
  apptCode: z.string().trim().min(6).max(20),
  mobile: mobileSchema,
});

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
});

export const patientRegisterSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  mobile: mobileSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const patientLoginSchema = z.object({
  mobile: mobileSchema,
  password: z.string().min(8),
});

export const doctorSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  qualification: z.string().trim().max(200).optional().default(""),
  specialization: z.string().trim().max(120).optional().default(""),
  departmentId: z.coerce.number().int().positive().nullable().optional(),
  experienceYears: z.coerce.number().int().min(0).max(70).nullable().optional(),
  bio: z.string().trim().max(2000).optional().default(""),
  photoUrl: z.string().trim().max(500).optional().default(""),
  consultationFee: z.coerce.number().int().min(0).max(1000000).nullable().optional(),
  availableDays: z.string().trim().max(20).default("1,2,3,4,5"),
  morningFrom: z.string().regex(TIME_RE).default("09:00"),
  morningTo: z.string().regex(TIME_RE).default("13:00"),
  eveningFrom: z.union([z.literal(""), z.string().regex(TIME_RE)]).default(""),
  eveningTo: z.union([z.literal(""), z.string().regex(TIME_RE)]).default(""),
  slotMinutes: z.coerce.number().int().min(5).max(180).default(30),
  maxPerSlot: z.coerce.number().int().min(1).max(20).default(1),
  isActive: boolField.default(true),
  isSample: boolField.default(false),
});

export const departmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  nameHi: z.string().trim().max(100).optional().default(""),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  description: z.string().trim().max(2000).optional().default(""),
  descriptionHi: z.string().trim().max(2000).optional().default(""),
  icon: z.string().trim().max(8).optional().default(""),
  highlightDays: z.string().trim().max(120).optional().default(""),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: boolField.default(true),
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  phone: mobileSchema,
  subject: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(5).max(2000),
});

/** Flatten a ZodError into a {field: message} map for API responses. */
export function zodFieldErrors(err: { issues: { path: (string | number | symbol)[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
