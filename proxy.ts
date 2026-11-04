import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session-token";

/**
 * Optimistic route guard (Next.js 16 "proxy", formerly middleware).
 * Full authorization still happens in layouts + APIs; this just avoids
 * loading dashboards for plainly unauthenticated users.
 */
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const { pathname } = req.nextUrl;

  const isAdminArea = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isPatientArea = pathname.startsWith("/patient") &&
    !pathname.startsWith("/patient/login") &&
    !pathname.startsWith("/patient/register");

  if (isAdminArea && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (isPatientArea && session?.role !== "PATIENT") {
    return NextResponse.redirect(new URL("/patient/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/patient/:path*"],
};
