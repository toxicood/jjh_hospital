import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appointmentCreateSchema, zodFieldErrors } from "@/lib/validation";
import { generateApptCode } from "@/lib/appt-code";
import { notify, notifyHospitalCopy, hospitalInbox } from "@/lib/notifications";
import { audit } from "@/lib/audit";
import { fromDateKey, toDateKey, weekdayOf } from "@/lib/slots";

export const dynamic = "force-dynamic";

interface Body {
  fullName: string;
  mobile: string;
  email?: string;
  age: number | string;
  gender: "MALE" | "FEMALE" | "OTHER";
  departmentId: number | string;
  doctorId: number | string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  problemDescription?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = appointmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION_FAILED", fieldErrors: zodFieldErrors(parsed.error) },
      { status: 422 },
    );
  }
  const v = parsed.data;

  // Validate doctor + department + date
  const doctor = await prisma.doctor.findFirst({
    where: { id: v.doctorId, isActive: true },
    include: { department: true },
  });
  if (!doctor) {
    return NextResponse.json({ ok: false, error: "Doctor not found or inactive" }, { status: 400 });
  }

  const dateKey = v.date;
  const apptDate = fromDateKey(dateKey);
  if (weekdayOf(dateKey) !== apptDate.getUTCDay() || Number.isNaN(apptDate.getTime())) {
    return NextResponse.json({ ok: false, error: "Invalid date" }, { status: 400 });
  }

  // Same-day / past booking guard (date-only, timezone-safe)
  const todayKey = toDateKey(new Date());
  const todayDate = fromDateKey(todayKey);
  if (apptDate < todayDate) {
    return NextResponse.json({ ok: false, error: "Date is in the past" }, { status: 400 });
  }
  const maxDate = new Date(todayDate);
  maxDate.setUTCDate(maxDate.getUTCDate() + 45);
  if (apptDate > maxDate) {
    return NextResponse.json({ ok: false, error: "Bookings allowed only 45 days ahead" }, { status: 400 });
  }

  // Patient: find by mobile (auto-create lightweight record for first-time bookers)
  const patient = await prisma.patient.upsert({
    where: { mobile: v.mobile },
    update: { fullName: v.fullName, email: v.email ?? undefined, age: v.age ?? undefined, gender: v.gender ?? undefined },
    create: { fullName: v.fullName, mobile: v.mobile, email: v.email || null, age: v.age, gender: v.gender },
  });

  // Server-side slot validity: requested time must be within the doctor's
  // generated slots (or an admin override) and have free capacity.
  const { generateSlots } = await import("@/lib/slots");
  const wanted = generateSlots(
    {
      morningFrom: doctor.morningFrom,
      morningTo: doctor.morningTo,
      eveningFrom: doctor.eveningFrom,
      eveningTo: doctor.eveningTo,
      slotMinutes: doctor.slotMinutes,
      availableDays: doctor.availableDays,
    },
    dateKey,
  );
  const overrides = await prisma.timeSlot.findMany({ where: { doctorId: doctor.id, date: apptDate, fromTime: v.time } });
  const allowed = wanted.includes(v.time) || overrides.some((o) => o.kind === "AVAILABLE");
  if (!allowed || overrides.some((o) => o.kind === "BLOCKED")) {
    return NextResponse.json({ ok: false, error: "INVALID_SLOT", message: "Requested time slot is not available" }, { status: 400 });
  }
  const taken = await prisma.appointment.count({
    where: { doctorId: doctor.id, date: apptDate, time: v.time, status: { not: "CANCELLED" } },
  });
  if (taken >= Math.max(1, doctor.maxPerSlot)) {
    return NextResponse.json({ ok: false, error: "SLOT_TAKEN", message: "Slot capacity full — choose another slot." }, { status: 409 });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        apptCode: generateApptCode(),
        patientId: patient.id,
        doctorId: doctor.id,
        departmentId: v.departmentId,
        fullName: v.fullName,
        mobile: v.mobile,
        email: v.email || null,
        age: v.age,
        gender: v.gender,
        problemDescription: v.problemDescription || null,
        date: apptDate,
        time: v.time,
        slotGuard: String(taken + 1),
        status: "PENDING",
        source: "WEBSITE",
      },
    });

    await audit({
      actorType: "PATIENT",
      actorId: patient.id,
      actorName: v.fullName,
      action: "APPOINTMENT_BOOKED",
      entity: "APPOINTMENT",
      entityId: appointment.id,
      detail: `${appointment.apptCode} — doctor ${doctor.fullName}, ${dateKey} ${v.time}`,
    });

    // Admin in-app alert (always) + optional outbound channels
    const timeLabel = v.time;
    const hospitalLine = `NEW BOOKING ${appointment.apptCode}: ${v.fullName} (${v.mobile}${v.age ? `, ${v.age}Y` : ""} ${v.gender?.[0] || ""}) — ${doctor.fullName}${doctor.department ? ` (${doctor.department.name})` : ""} on ${dateKey} at ${timeLabel}${v.problemDescription ? ` · Problem: ${v.problemDescription}` : ""}.`;
    await Promise.all([
      notify({
        channel: "ADMIN",
        recipient: "admin-inbox",
        message: `New appointment ${appointment.apptCode}: ${v.fullName} (${v.mobile}) with ${doctor.fullName} on ${dateKey} at ${timeLabel}.`,
        appointmentId: appointment.id,
      }),
      notify({
        channel: "SMS",
        recipient: patient.mobile,
        message: `Booking received at Jeevan Jyoti Hospital. ID ${appointment.apptCode} — ${doctor.fullName}, ${dateKey} ${timeLabel}. Status: pending.`,
        appointmentId: appointment.id,
      }),
      ...(patient.email && patient.email !== hospitalInbox()
        ? [notify({ channel: "EMAIL", recipient: patient.email, message: `Your appointment ID is ${appointment.apptCode} (${dateKey} ${timeLabel}, ${doctor.fullName}). It is pending confirmation.`, appointmentId: appointment.id })]
        : []),
      // Hospital/doctor's own Gmail copy with details + OPD slip PDF
      notifyHospitalCopy(appointment.id, hospitalLine),
    ]);

    return NextResponse.json(
      { ok: true, message: "Appointment booked successfully", data: { apptCode: appointment.apptCode, status: "PENDING" } },
      { status: 201 },
    );
  } catch (err: unknown) {
    // P2002 = unique constraint violation → slot already taken
    if (
      typeof err === "object" && err !== null &&
      "code" in err && (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { ok: false, error: "SLOT_TAKEN", message: "This time slot was just booked. Please choose another slot." },
        { status: 409 },
      );
    }
    console.error(err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
