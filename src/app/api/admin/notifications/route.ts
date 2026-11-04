import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** GET /api/admin/notifications — outbound message log */
export async function GET() {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const rows = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { appointment: { select: { apptCode: true } } },
  });
  return NextResponse.json({
    ok: true,
    data: rows.map((n) => ({
      id: n.id,
      channel: n.channel,
      recipient: n.recipient,
      message: n.message,
      status: n.status,
      statusDetail: n.statusDetail,
      apptCode: n.appointment?.apptCode ?? null,
      createdAt: new Date(n.createdAt).toISOString().slice(0, 16).replace("T", " "),
    })),
  });
}
