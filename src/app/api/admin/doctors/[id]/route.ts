import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { doctorSchema, zodFieldErrors } from "@/lib/validation";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PUT /api/admin/doctors/[id] */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const parsed = doctorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, fieldErrors: zodFieldErrors(parsed.error) }, { status: 422 });
  }
  const v = parsed.data;
  try {
    const doctor = await prisma.doctor.update({ where: { id }, data: { ...v, departmentId: v.departmentId ?? null } });
    await audit({ actorType: "ADMIN", actorId: Number(g.session.sub.split(":")[1]), actorName: g.session.name, action: "DOCTOR_UPDATED", entity: "DOCTOR", entityId: id, detail: doctor.fullName });
    return NextResponse.json({ ok: true, data: doctor });
  } catch {
    return NextResponse.json({ ok: false, error: "Doctor not found" }, { status: 404 });
  }
}

/** DELETE /api/admin/doctors/[id] — soft delete: deactivate */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
  const doctor = await prisma.doctor.update({ where: { id }, data: { isActive: false } }).catch(() => null);
  if (!doctor) return NextResponse.json({ ok: false, error: "Doctor not found" }, { status: 404 });
  await audit({ actorType: "ADMIN", actorId: Number(g.session.sub.split(":")[1]), actorName: g.session.name, action: "DOCTOR_DEACTIVATED", entity: "DOCTOR", entityId: id, detail: doctor.fullName });
  return NextResponse.json({ ok: true, message: "Doctor deactivated (kept for history)" });
}
