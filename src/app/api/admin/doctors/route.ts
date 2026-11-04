import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { doctorSchema, zodFieldErrors } from "@/lib/validation";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** GET /api/admin/doctors — full list incl. inactive */
export async function GET() {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const doctors = await prisma.doctor.findMany({
    include: { department: { select: { name: true } } },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json({ ok: true, data: doctors });
}

/** POST /api/admin/doctors — create doctor */
export async function POST(req: Request) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const body = await req.json().catch(() => ({}));
  const parsed = doctorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, fieldErrors: zodFieldErrors(parsed.error) }, { status: 422 });
  }
  const v = parsed.data;
  const doctor = await prisma.doctor.create({ data: { ...v, departmentId: v.departmentId ?? null } });
  await audit({ actorType: "ADMIN", actorId: Number(g.session.sub.split(":")[1]), actorName: g.session.name, action: "DOCTOR_CREATED", entity: "DOCTOR", entityId: doctor.id, detail: doctor.fullName });
  return NextResponse.json({ ok: true, data: doctor }, { status: 201 });
}
