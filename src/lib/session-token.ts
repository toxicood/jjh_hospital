import { SignJWT, jwtVerify } from "jose";

export type Role = "ADMIN" | "PATIENT";

export interface SessionPayload {
  sub: string;
  role: Role;
  name: string;
  email?: string | null;
  mobile?: string | null;
}

export const SESSION_COOKIE = "jjh_session";
const ALG = "HS256";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing/too short — set it in .env");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload, maxAgeSec = 60 * 60 * 24 * 7): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || !payload.role) return null;
    return {
      sub: String(payload.sub),
      role: payload.role as Role,
      name: String(payload.name ?? ""),
      email: (payload.email as string) ?? null,
      mobile: (payload.mobile as string) ?? null,
    };
  } catch {
    return null;
  }
}
