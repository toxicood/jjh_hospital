import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appointmentStatusCheckSchema, zodFieldErrors } from "@/lib/validation";
import { prettyDate } from "@/lib/site";

export const dynamic = "force-dynamic";

/** POST /api/appointments/status — patient self-service, mobile must match. */
export async function POST(req: Request) {
  let body: { apptCode?: string; mobile?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = appointmentStatusCheckSchema.safeParse({
    apptCode: body.apptCode ?? "",
    mobile: body.mobile ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION_FAILED", fieldErrors: zodFieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const appt = await prisma.appointment.findFirst({
    where: {
      apptCode: parsed.data.apptCode.toUpperCase(),
      mobile: parsed.data.mobile,
    },
    include: { doctor: { select: { fullName: true } }, department: { select: { name: true } }, patient: true },
  });
  if (!appt) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND", message: "No appointment found for this ID and mobile combination." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      apptCode: appt.apptCode,
      status: appt.status,
      statusLabel: appt.status.charAt(0) + appt.status.slice(1).toLowerCase(),
      fullName: appt.fullName,
      doctorName: appt.doctor.fullName,
      departmentName: appt.department?.name ?? null,
      date: prettyDate(appt.date),
      time: appt.time,
      createdAt: prettyDate(appt.createdAt),
    },
  });
}
