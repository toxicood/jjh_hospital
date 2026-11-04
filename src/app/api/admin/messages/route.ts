import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { prettyDate } from "@/lib/site";

export const dynamic = "force-dynamic";

/** GET /api/admin/messages — contact form inbox */
export async function GET() {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({
    ok: true,
    data: messages.map((m) => ({ ...m, createdAt: prettyDate(m.createdAt) })),
  });
}
