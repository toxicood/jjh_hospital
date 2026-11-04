import { randomBytes } from "crypto";

/** Unique, human-readable appointment code, e.g. JJH-7KQ4F2 */
export function generateApptCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/l/0/1 confusion
  const bytes = randomBytes(6);
  let code = "";
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return `JJH-${code}`;
}
