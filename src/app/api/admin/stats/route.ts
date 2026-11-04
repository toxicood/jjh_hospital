import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { prettyDate } from "@/lib/site";

export const dynamic = "force-dynamic";

/** GET /api/admin/stats — dashboard counters + recent activity */
export async function GET() {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, pending, confirmed, cancelled, completed, todayCount, patients, doctors, departments, latest, latestAudit] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
    prisma.appointment.count({ where: { date: today } }),
    prisma.patient.count(),
    prisma.doctor.count({ where: { isActive: true } }),
    prisma.department.count({ where: { isActive: true } }),
    prisma.appointment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { doctor: { select: { fullName: true } }, department: { select: { name: true } } },
    }),
    prisma.auditLog.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      counts: { total, pending, confirmed, cancelled, completed, today: todayCount, patients, doctors, departments },
      latest: latest.map((a) => ({
        id: a.id,
        apptCode: a.apptCode,
        fullName: a.fullName,
        mobile: a.mobile,
        doctorName: a.doctor.fullName,
        departmentName: a.department?.name ?? null,
        date: prettyDate(a.date),
        time: a.time,
        status: a.status,
        createdAt: prettyDate(a.createdAt),
      })),
      latestAudit: latestAudit.map((l) => ({
        id: l.id,
        actorName: l.actorName ?? l.actorType,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        detail: l.detail,
        createdAt: prettyDate(l.createdAt),
      })),
    },
  });
}
