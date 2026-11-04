import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPatientSession } from "@/lib/auth";
import { prettyDate } from "@/lib/site";

export const dynamic = "force-dynamic";

/** GET /api/patient/appointments — own appointments */
export async function GET() {
  const session = await getPatientSession();
  if (!session) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const patientId = Number(session.sub.split(":")[1]);
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: { doctor: { select: { fullName: true, specialization: true } }, department: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    ok: true,
    data: appointments.map((a) => ({
      id: a.id,
      apptCode: a.apptCode,
      doctorName: a.doctor.fullName,
      specialization: a.doctor.specialization,
      departmentName: a.department?.name ?? null,
      date: prettyDate(a.date),
      rawDate: a.date,
      time: a.time,
      status: a.status,
      createdAt: prettyDate(a.createdAt),
      problemDescription: a.problemDescription,
      adminNotes: a.adminNotes,
      statusReason: a.statusReason,
    })),
  });
}
