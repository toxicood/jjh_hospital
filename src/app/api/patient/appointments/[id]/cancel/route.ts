import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPatientSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/** POST /api/patient/appointments/[id]/cancel — patient cancels own appointment */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getPatientSession();
  if (!session) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const patientId = Number(session.sub.split(":")[1]);
  const { id } = await ctx.params;
  const apptId = Number(id);
  if (!Number.isInteger(apptId)) return NextResponse.json({ ok: false, error: "Bad ID" }, { status: 400 });

  const appt = await prisma.appointment.findFirst({
    where: { id: apptId, patientId },
    include: { doctor: { select: { fullName: true } } },
  });
  if (!appt) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  if (["CANCELLED", "COMPLETED"].includes(appt.status)) {
    return NextResponse.json({ ok: false, message: "Appointment is already " + appt.status.toLowerCase() + "." }, { status: 409 });
  }

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: {
      status: "CANCELLED",
      statusReason: "Cancelled by patient",
      slotGuard: appt.slotGuard + "C", // releases the unique slot tuple
    },
  });

  await audit({
    actorType: "PATIENT",
    actorId: patientId,
    actorName: session.name,
    action: "APPOINTMENT_CANCELLED_BY_PATIENT",
    entity: "APPOINTMENT",
    entityId: appt.id,
    detail: appt.apptCode,
  });

  await Promise.all([
    notify({ channel: "ADMIN", recipient: "admin-inbox", message: `Patient cancelled ${appt.apptCode} (${appt.doctor.fullName}, ${new Date(appt.date).toISOString().slice(0, 10)} ${appt.time}).`, appointmentId: appt.id }),
    notify({ channel: "SMS", recipient: appt.mobile, message: `Your appointment ${appt.apptCode} has been cancelled as requested. To rebook visit our website.`, appointmentId: appt.id }),
  ]);

  return NextResponse.json({ ok: true, message: "Appointment cancelled", data: { status: updated.status } });
}
