import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** GET /api/admin/audit-log */
export async function GET() {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return NextResponse.json({
    ok: true,
    data: rows.map((l) => ({
      id: l.id,
      actorType: l.actorType,
      actorName: l.actorName,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      detail: l.detail,
      createdAt: new Date(l.createdAt).toISOString().slice(0, 16).replace("T", " "),
    })),
  });
}
