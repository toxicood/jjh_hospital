import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { prettyDate } from "@/lib/site";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/** GET /api/admin/appointments?status=&doctorId=&departmentId=&from=&to=&q= */
export async function GET(req: Request) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const sp = new URL(req.url).searchParams;

  const where: Prisma.AppointmentWhereInput = {};
  const status = sp.get("status");
  if (status && ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) where.status = status;
  const doctorId = Number(sp.get("doctorId"));
  if (Number.isInteger(doctorId) && doctorId > 0) where.doctorId = doctorId;
  const departmentId = Number(sp.get("departmentId"));
  if (Number.isInteger(departmentId) && departmentId > 0) where.departmentId = departmentId;
  const from = sp.get("from");
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    where.date = { ...(where.date as Prisma.DateTimeFilter ?? {}), gte: new Date(`${from}T00:00:00`) };
  }
  const to = sp.get("to");
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    where.date = { ...(where.date as Prisma.DateTimeFilter ?? {}), lte: new Date(`${to}T00:00:00`) };
  }
  const q = sp.get("q")?.trim();
  if (q) {
    where.OR = [
      { apptCode: { contains: q } },
      { fullName: { contains: q } },
      { mobile: { contains: q } },
    ];
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { doctor: { select: { fullName: true } }, department: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { time: "asc" }],
    take: 500,
  });

  return NextResponse.json({
    ok: true,
    data: appointments.map((a) => ({
      id: a.id,
      apptCode: a.apptCode,
      fullName: a.fullName,
      mobile: a.mobile,
      age: a.age,
      gender: a.gender,
      email: a.email,
      problemDescription: a.problemDescription,
      doctorName: a.doctor.fullName,
      doctorId: a.doctorId,
      departmentName: a.department?.name ?? null,
      departmentId: a.departmentId,
      date: prettyDate(a.date),
      rawDate: a.date,
      time: a.time,
      status: a.status,
      statusReason: a.statusReason,
      adminNotes: a.adminNotes,
      source: a.source,
      createdAt: prettyDate(a.createdAt),
    })),
  });
}
