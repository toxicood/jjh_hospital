import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlots, weekdayOf } from "@/lib/slots";

export const dynamic = "force-dynamic";

/** GET /api/slots?doctorId=1&date=2026-11-10 → { slots: [{ time, remaining }] } */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = Number(searchParams.get("doctorId"));
  const date = searchParams.get("date") || "";
  if (!Number.isInteger(doctorId) || doctorId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: "doctorId and date (YYYY-MM-DD) required" }, { status: 400 });
  }

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isActive: true },
  });
  if (!doctor) return NextResponse.json({ ok: false, error: "Doctor not found" }, { status: 404 });

  const dateKey = date;
  const apptDate = new Date(`${dateKey}T00:00:00`);
  if (weekdayOf(dateKey) !== apptDate.getDay()) {
    return NextResponse.json({ ok: false, error: "Invalid date" }, { status: 400 });
  }

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
  if (wanted.length === 0) {
    return NextResponse.json({ ok: true, data: { slots: [] } });
  }

  const [bookings, overrides] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["time"],
      _count: { _all: true },
      where: { doctorId, date: apptDate, status: { not: "CANCELLED" } },
    }),
    prisma.timeSlot.findMany({ where: { doctorId, date: apptDate } }),
  ]);

  const booked = new Map(bookings.map((b) => [b.time, b._count._all]));
  const blocked = new Map(
    overrides.filter((o) => o.kind === "BLOCKED").map((o) => [o.fromTime, o]),
  );
  const extra = overrides.filter((o) => o.kind === "AVAILABLE");
  const customSlots = extra.map((e) => e.fromTime);

  const slots = Array.from(new Set([...wanted, ...customSlots])).sort();
  const remaining = slots.map((time) => {
    if (blocked.has(time)) return { time, remaining: 0 };
    return { time, remaining: Math.max(0, doctor.maxPerSlot - (booked.get(time) ?? 0)) };
  });

  return NextResponse.json({ ok: true, data: { slots: remaining } });
}
