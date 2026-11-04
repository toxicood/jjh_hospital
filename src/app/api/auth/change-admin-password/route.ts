import { NextResponse } from "next/server";
import { getAdminSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

interface ChangePasswordBody {
  action: string;
  currentPassword?: string;
  newPassword?: string;
}

/**
 * POST /api/auth/change-admin-password
 * Body: { action: "CHANGE_MY_PASSWORD", currentPassword, newPassword }
 * Admin self-service password change (first login should change default password).
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as ChangePasswordBody;
  if (body.action !== "CHANGE_MY_PASSWORD") {
    return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
  }
  const newPassword = (body.newPassword ?? "").trim();
  const currentPassword = body.currentPassword ?? "";
  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, fieldErrors: { newPassword: "Password must be at least 8 characters" } }, { status: 422 });
  }
  const admin = await prisma.admin.findUnique({ where: { id: Number(session.sub.split(":")[1]) } });
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Admin not found" }, { status: 404 });
  }
  if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
    return NextResponse.json({ ok: false, fieldErrors: { currentPassword: "Current password incorrect" } }, { status: 401 });
  }
  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await audit({
    actorType: "ADMIN",
    actorId: admin.id,
    actorName: admin.name,
    action: "ADMIN_PASSWORD_CHANGED",
    entity: "ADMIN",
    entityId: admin.id,
  });
  return NextResponse.json({ ok: true, message: "Password changed successfully" });
}
