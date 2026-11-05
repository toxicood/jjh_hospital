import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { fromDateKey, toDateKey } from "@/lib/slots";

/** GET /api/admin/opd-report?date=YYYY-MM-DD[&days=N|month=1]
 *  English OPD report data — totals + patient rows for the selected date(s). */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;

  const url = new URL(req.url);
  const dateKey = url.searchParams.get("date") || toDateKey(new Date());
  const days = Math.min(Math.max(Number(url.searchParams.get("days") || 1), 1), 92);

  const start = fromDateKey(dateKey);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + days);

  const rows = await prisma.appointment.findMany({
    where: { date: { gte: start, lt: end } },
    include: { doctor: { select: { fullName: true } }, department: { select: { name: true } } },
    orderBy: [{ date: "asc" }, { time: "asc" }, { id: "asc" }],
  });

  const patients = rows.map((r, i) => ({
    token: i + 1,
    apptCode: r.apptCode,
    fullName: r.fullName,
    mobile: r.mobile,
    age: r.age,
    gender: r.gender,
    doctor: r.doctor.fullName,
    department: r.department?.name ?? null,
    date: r.date.toISOString().slice(0, 10),
    time: r.time,
    source: r.source,
    status: r.status,
    bookedAt: r.createdAt.toISOString(),
  }));

  const totals = {
    total: patients.length,
    pending: patients.filter((p) => p.status === "PENDING").length,
    confirmed: patients.filter((p) => p.status === "CONFIRMED").length,
    completed: patients.filter((p) => p.status === "COMPLETED").length,
    cancelled: patients.filter((p) => p.status === "CANCELLED").length,
    online: patients.filter((p) => p.source === "WEBSITE").length,
  };

  return NextResponse.json({ ok: true, data: { startDate: dateKey, days, totals, patients } });
}
