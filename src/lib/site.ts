import { prisma } from "@/lib/db";

export type SettingsMap = Record<string, string>;

/** Load all editable settings (site content, contact info, FAQs). */
export async function getSettings(): Promise<SettingsMap> {
  const rows = await prisma.setting.findMany();
  const map: SettingsMap = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export function setting(map: SettingsMap, key: string, fallback = ""): string {
  return map[key] && map[key].trim() ? map[key] : fallback;
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export function prettyDate(d: Date | string): string {
  // Prisma @db.Date values arrive as UTC-midnight Date objects; format them in UTC
  // so a machine in a timezone behind UTC doesn't display the previous day.
  const date = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  if (typeof d === "string") {
    return date.toLocaleDateString("en-IN", opts);
  }
  return date.toLocaleDateString("en-IN", { ...opts, timeZone: "UTC" });
}
