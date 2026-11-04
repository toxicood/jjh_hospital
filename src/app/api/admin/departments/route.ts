import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { departmentSchema, zodFieldErrors } from "@/lib/validation";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const departments = await prisma.department.findMany({
    include: { _count: { select: { doctors: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ ok: true, data: departments });
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const body = await req.json().catch(() => ({}));
  const parsed = departmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, fieldErrors: zodFieldErrors(parsed.error) }, { status: 422 });
  }
  try {
    const department = await prisma.department.create({ data: parsed.data });
    await audit({ actorType: "ADMIN", actorId: Number(g.session.sub.split(":")[1]), actorName: g.session.name, action: "DEPARTMENT_CREATED", entity: "DEPARTMENT", entityId: department.id, detail: department.name });
    return NextResponse.json({ ok: true, data: department }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, fieldErrors: { slug: "Slug already in use" } }, { status: 409 });
  }
}
