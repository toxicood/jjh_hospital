import { NextResponse } from "next/server";
import { getAdminSession, type SessionPayload } from "@/lib/auth";

export interface AdminGuard {
  session: SessionPayload;
}

/** Returns session or a NextResponse error (null session means OK). */
export async function requireAdmin(): Promise<AdminGuard | { error: NextResponse }> {
  const session = await getAdminSession();
  if (!session) {
    return { error: NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 }) };
  }
  return { session };
}

export function isFailed(g: AdminGuard | { error: NextResponse }): g is { error: NextResponse } {
  return "error" in g;
}
