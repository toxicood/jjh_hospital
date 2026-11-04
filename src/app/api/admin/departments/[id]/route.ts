import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { departmentSchema, zodFieldErrors } from "@/lib/validation";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const parsed = departmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, fieldErrors: zodFieldErrors(parsed.error) }, { status: 422 });
  }
  try {
    const department = await prisma.department.update({ where: { id }, data: parsed.data });
    await audit({ actorType: "ADMIN", actorId: Number(g.session.sub.split(":")[1]), actorName: g.session.name, action: "DEPARTMENT_UPDATED", entity: "DEPARTMENT", entityId: id, detail: department.name });
    return NextResponse.json({ ok: true, data: department });
  } catch {
    return NextResponse.json({ ok: false, error: "Department not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const id = Number((await ctx.params).id);
  const used = await prisma.doctor.count({ where: { departmentId: id } });
  if (used > 0) {
    return NextResponse.json({ ok: false, message: "Department has doctors linked — deactivate it instead of deleting." }, { status: 409 });
  }
  const department = await prisma.department.delete({ where: { id } }).catch(() => null);
  if (!department) return NextResponse.json({ ok: false, error: "Department not found" }, { status: 404 });
  await audit({ actorType: "ADMIN", actorId: Number(g.session.sub.split(":")[1]), actorName: g.session.name, action: "DEPARTMENT_DELETED", entity: "DEPARTMENT", entityId: id, detail: department.name });
  return NextResponse.json({ ok: true });
}
