import { NextResponse } from "next/server";
import { requireAdmin, isFailed } from "@/lib/admin";
import { buildSlipForAppointment } from "@/lib/opd-slip-pdf";

/** GET /api/admin/appointments/[id]/slip — download the OPD slip PDF */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });

  let pdf: Buffer | null = null;
  try {
    pdf = await buildSlipForAppointment(id);
  } catch (err) {
    console.error("[slip] generation failed", err);
  }
  if (!pdf) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="OPD-Slip-JJH-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
