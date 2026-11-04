/**
 * Appointment slot helpers.
 * All times are IST "HH:mm" strings; weeks use Irwin day numbers 0-6 (Sun..Sat).
 */

export interface OpdWindows {
  morningFrom: string;
  morningTo: string;
  eveningFrom?: string | null;
  eveningTo?: string | null;
  slotMinutes?: number;
  maxPerSlot?: number;
  availableDays?: string; // csv of day numbers
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayLabel(day: number): string {
  return WEEKDAY_LABELS[day] ?? "";
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Human label for a time: "10:00" -> "10:00 AM" */
export function prettyTime(hhmm: string): string {
  const [hStr, m] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${m} ${suffix}`;
}

/** YYYY-MM-DD (local-based, no UTC shifting). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  // Build at UTC midnight: Prisma writes @db.Date columns in UTC, so a
  // local-midnight Date would roll back one day on an IST (+05:30) machine.
  return new Date(`${key}T00:00:00Z`);
}

/** Day number (0-6) for date key — computed without timezone effects. */
export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map((x) => parseInt(x, 10));
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).getUTCDay();
}

/**
 * Generate all theoretical slot times for a doctor on a date.
 * Returns [] when the doctor has no OPD that weekday.
 */
export function generateSlots(windows: OpdWindows, dateKey: string): string[] {
  const day = weekdayOf(dateKey);
  const allowed = (windows.availableDays ?? "1,2,3,4,5")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  if (!allowed.includes(day)) return [];

  const interval = Math.max(5, windows.slotMinutes ?? 30);
  const slots: string[] = [];
  const pushRange = (from: string | null | undefined, to: string | null | undefined) => {
    if (!from || !to) return;
    if (toMinutes(from) >= toMinutes(to)) return;
    for (let t = toMinutes(from); t + interval <= toMinutes(to) + 59; t += interval) {
      const end = t + interval;
      if (end <= toMinutes(to)) slots.push(toHHMM(t));
    }
  };
  pushRange(windows.morningFrom, windows.morningTo);
  pushRange(windows.eveningFrom, windows.eveningTo);
  return Array.from(new Set(slots)).sort();
}
