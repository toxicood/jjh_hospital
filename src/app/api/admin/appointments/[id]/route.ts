import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { generateSlots, weekdayOf, fromDateKey } from "@/lib/slots";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  action: z.enum(["CONFIRM", "CANCEL", "COMPLETE", "RESCHEDULE"]),
  reason: z.string().trim().max(300).optional().default(""),
  adminNotes: z.string().trim().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
});

const STATUS_REASONS: Record<string, string> = {
  CONFIRM: "Confirmed by hospital",
  CANCEL: "Cancelled by hospital",
  COMPLETE: "Visit completed",
};

/** PATCH /api/admin/appointments/[id] — status changes + reschedule */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const adminId = Number(g.session.sub.split(":")[1]);
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "VALIDATION_FAILED" }, { status: 422 });
  const { action, reason, adminNotes, date, time } = parsed.data;

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { doctor: true, department: { select: { name: true } } },
  });
  if (!appt) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const nowStatus = appt.status;
  if (["CANCELLED", "COMPLETED"].includes(nowStatus) && action !== "RESCHEDULE") {
    return NextResponse.json({ ok: false, message: "Cannot change an already " + nowStatus.toLowerCase() + " appointment." }, { status: 409 });
  }

  const doNotify = async (msg: string) => {
    await Promise.all([
      notify({ channel: "SMS", recipient: appt.mobile, message: msg, appointmentId: appt.id }),
      ...(appt.email ? [notify({ channel: "EMAIL", recipient: appt.email, message: msg, appointmentId: appt.id })] : []),
    ]);
  };
  const timeLabel = `${appt.time} IST`;
  const dateKey = new Date(appt.date).toISOString().slice(0, 10);

  if (action === "CONFIRM" || action === "COMPLETE") {
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: action, statusReason: reason || STATUS_REASONS[action] },
    });
    await audit({
      actorType: "ADMIN",
      actorId: adminId,
      actorName: g.session.name,
      action: action === "CONFIRM" ? "APPOINTMENT_CONFIRMED" : "APPOINTMENT_COMPLETED",
      entity: "APPOINTMENT",
      entityId: id,
      detail: appt.apptCode,
    });
    await doNotify(
      `Your appointment ${appt.apptCode} (${dateKey} ${timeLabel}, ${appt.doctor.fullName}) is now ${action.toLowerCase()}d. — Jeevan Jyoti Hospital`,
    );
    return NextResponse.json({ ok: true, data: updated });
  }

  if (action === "CANCEL") {
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        statusReason: reason || STATUS_REASONS.CANCEL,
        slotGuard: appt.slotGuard + "C",
      },
    });
    await audit({ actorType: "ADMIN", actorId: adminId, actorName: g.session.name, action: "APPOINTMENT_CANCELLED", entity: "APPOINTMENT", entityId: id, detail: `${appt.apptCode} — ${reason || "admin cancelled"}` });
    await doNotify(`Your appointment ${appt.apptCode} on ${dateKey} at ${timeLabel} has been cancelled by the hospital. ${reason ? "Reason: " + reason : ""}`);
    return NextResponse.json({ ok: true, data: updated });
  }

  // RESCHEDULE
  if (!date && !time) {
    return NextResponse.json({ ok: false, fieldErrors: { date: "New date or time required" } }, { status: 422 });
  }
  const newKey = date ?? dateKey;
  const newTime = time ?? appt.time;
  const newDate = fromDateKey(newKey);
  if (weekdayOf(newKey) !== newDate.getDay()) {
    return NextResponse.json({ ok: false, error: "Invalid date" }, { status: 400 });
  }
  const doctor = appt.doctor;
  const wanted = generateSlots(
    {
      morningFrom: doctor.morningFrom,
      morningTo: doctor.morningTo,
      eveningFrom: doctor.eveningFrom,
      eveningTo: doctor.eveningTo,
      slotMinutes: doctor.slotMinutes,
      availableDays: doctor.availableDays,
    },
    newKey,
  );
  const overrides = await prisma.timeSlot.findMany({ where: { doctorId: doctor.id, date: newDate, fromTime: newTime } });
  if (!(wanted.includes(newTime) || overrides.some((o) => o.kind === "AVAILABLE"))) {
    return NextResponse.json({ ok: false, message: "New slot is outside doctor's OPD window" }, { status: 400 });
  }
  const taken = await prisma.appointment.count({
    where: { doctorId: doctor.id, date: newDate, time: newTime, status: { not: "CANCELLED" }, NOT: { id } },
  });
  if (taken >= Math.max(1, doctor.maxPerSlot)) {
    return NextResponse.json({ ok: false, error: "SLOT_TAKEN" }, { status: 409 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      date: newDate,
      time: newTime,
      slotGuard: String(taken + 1),
      statusReason: reason || `Rescheduled from ${dateKey} ${appt.time}`,
    },
  });
  await audit({ actorType: "ADMIN", actorId: adminId, actorName: g.session.name, action: "APPOINTMENT_RESCHEDULED", entity: "APPOINTMENT", entityId: id, detail: `${appt.apptCode} → ${newKey} ${newTime}` });
  await doNotify(`Rescheduled: appointment ${appt.apptCode} is now on ${newKey} at ${newTime} IST with ${doctor.fullName}.`);
  return NextResponse.json({ ok: true, data: updated });
}
