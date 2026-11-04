import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/** GET /api/admin/appointments/export?format=csv&from=&to=&status=&doctorId=&departmentId= */
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
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) where.date = { ...(where.date as Prisma.DateTimeFilter ?? {}), gte: new Date(`${from}T00:00:00`) };
  const to = sp.get("to");
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) where.date = { ...(where.date as Prisma.DateTimeFilter ?? {}), lte: new Date(`${to}T00:00:00`) };

  const rows = await prisma.appointment.findMany({
    where,
    include: { doctor: { select: { fullName: true } }, department: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { time: "asc" }],
  });

  const header = [
    "Appointment ID", "Patient", "Mobile", "Email", "Age", "Gender",
    "Department", "Doctor", "Date", "Time", "Status", "Source", "Booked At", "Problem / Notes",
  ];
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    header.join(","),
    ...rows.map((a) =>
      [
        a.apptCode, a.fullName, a.mobile, a.email, a.age, a.gender,
        a.department?.name ?? "", a.doctor.fullName,
        new Date(a.date).toISOString().slice(0, 10), a.time, a.status, a.source,
        new Date(a.createdAt).toISOString().slice(0, 16).replace("T", " "),
        (a.statusReason ?? "") + (a.adminNotes ? ` | Admin: ${a.adminNotes}` : ""),
      ].map(esc).join(","),
    ),
  ];

  return new NextResponse("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="appointments-${Date.now()}.csv"`,
    },
  });
}
