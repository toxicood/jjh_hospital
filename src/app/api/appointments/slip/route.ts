import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildSlipForAppointment } from "@/lib/opd-slip-pdf";

/** GET /api/appointments/slip?code=JJH-XXXXXX&mobile=9999999999
 *  Patient downloads their own OPD slip — must know BOTH the appointment code
 *  and the mobile number it was booked with (same keys as /check-status). */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || "").trim().toUpperCase();
  const mobile = (url.searchParams.get("mobile") || "").replace(/\D/g, "");
  if (!/^JJH-[A-Z0-9]{6}$/.test(code) || mobile.length !== 10) {
    return NextResponse.json({ ok: false, error: "BAD_INPUT" }, { status: 422 });
  }

  const appt = await prisma.appointment.findFirst({
    where: { apptCode: code, mobile },
    select: { id: true, status: true },
  });
  if (!appt) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  if (!["PENDING", "CONFIRMED"].includes(appt.status)) {
    return NextResponse.json(
      { ok: false, error: "SLIP_NOT_AVAILABLE", message: "OPD slip is only available for active appointments." },
      { status: 409 },
    );
  }

  try {
    const pdf = await buildSlipForAppointment(appt.id);
    if (!pdf) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="OPD-Slip-${code}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[slip] public generation failed", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
