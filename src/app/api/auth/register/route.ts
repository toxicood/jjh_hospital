import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";
import { patientRegisterSchema, zodFieldErrors } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** POST /api/auth/register — patient self-registration */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patientRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "VALIDATION_FAILED", fieldErrors: zodFieldErrors(parsed.error) }, { status: 422 });
  }
  const { fullName, mobile, password } = parsed.data;

  const existing = await prisma.patient.findUnique({ where: { mobile } });
  if (existing?.passwordHash) {
    return NextResponse.json(
      { ok: false, fieldErrors: { mobile: "This mobile number is already registered — please login instead." } },
      { status: 409 },
    );
  }

  const patient = existing
    ? await prisma.patient.update({ where: { mobile }, data: { passwordHash: await hashPassword(password) } })
    : await prisma.patient.create({ data: { fullName, mobile, passwordHash: await hashPassword(password) } });

  const jwt = await signSession({
    sub: `patient:${patient.id}`,
    role: "PATIENT",
    name: patient.fullName,
    mobile: patient.mobile,
  });
  await setSessionCookie(jwt);
  await audit({ actorType: "PATIENT", actorId: patient.id, actorName: patient.fullName, action: "PATIENT_REGISTERED", entity: "PATIENT" });
  void notify({ channel: "SMS", recipient: patient.mobile, message: `Welcome to Jeevan Jyoti Hospital patient portal! You can now book and manage appointments online.` });

  return NextResponse.json({ ok: true, data: { name: patient.fullName, redirect: "/patient/dashboard" } }, { status: 201 });
}
