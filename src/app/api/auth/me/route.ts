import { NextResponse } from "next/server";
import { getAdminSession, getSession, getPatientSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/auth/me → { role, name, mobile, email } or { role: null } */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, role: null, name: null });

  if (session.role === "ADMIN") {
    const s = await getAdminSession();
    return NextResponse.json(!s ? { ok: true, role: null, name: null } : { ok: true, role: "ADMIN", name: session.name, email: session.email });
  }
  const s = await getPatientSession();
  return NextResponse.json(!s ? { ok: true, role: null, name: null } : { ok: true, role: "PATIENT", name: session.name, mobile: session.mobile });
}
