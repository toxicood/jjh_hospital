import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken, SESSION_COOKIE, type SessionPayload } from "@/lib/session-token";

export type { SessionPayload };
export { SESSION_COOKIE };

export async function signSession(payload: SessionPayload, maxAgeSec = 60 * 60 * 24 * 7): Promise<string> {
  return signSessionToken(payload, maxAgeSec);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  return verifySessionToken(token);
}

export async function setSessionCookie(jwt: string, maxAgeSec = 60 * 60 * 24 * 7): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const s = await getSession();
  return s && s.role === "ADMIN" ? s : null;
}

export async function getPatientSession(): Promise<SessionPayload | null> {
  const s = await getSession();
  return s && s.role === "PATIENT" ? s : null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
