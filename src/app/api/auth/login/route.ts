import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie, signSession, type Role } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  role: z.enum(["ADMIN", "PATIENT"]),
  identifier: z.string().trim().min(3),
  password: z.string().min(6),
});

/** POST /api/auth/login  { role, identifier, password } */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "VALIDATION_FAILED" }, { status: 422 });
  }
  const { role, identifier, password } = parsed.data;

  const user =
    role === "ADMIN"
      ? await prisma.admin.findUnique({ where: { email: identifier.toLowerCase() } })
      : await prisma.patient.findUnique({ where: { mobile: identifier } });

  if (!user || !user.isActive || !user.passwordHash) {
    return NextResponse.json(
      { ok: false, message: "Invalid credentials" },
      { status: 401 },
    );
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await audit({ actorType: role, actorId: user.id, actorName: role === "ADMIN" ? user.name : user.fullName, action: "LOGIN_FAILED", entity: "SESSION" });
    return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
  }

  const name = role === "ADMIN" ? user.name : user.fullName;
  const jwt = await signSession(
    {
      sub: `${role.toLowerCase()}:${user.id}`,
      role: role as Role,
      name,
      email: role === "ADMIN" ? user.email : user.email ?? null,
      mobile: role === "PATIENT" ? user.mobile : null,
    },
  );
  await setSessionCookie(jwt);
  await audit({ actorType: role, actorId: user.id, actorName: name, action: "LOGIN_OK", entity: "SESSION" });

  return NextResponse.json({ ok: true, data: { role, name, redirect: role === "ADMIN" ? "/admin" : "/patient/dashboard" } });
}
