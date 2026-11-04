import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** PUT /api/admin/settings — body: { key: value, ... } */
export async function PUT(req: Request) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid body — send { key: value } map" }, { status: 400 });
  }
  // Never allow setting auth/infra secrets through this endpoint
  const blocked = new Set(["AUTH_SECRET", "DATABASE_URL", "ADMIN_PASSWORD"]);
  const entries = Object.entries(body).filter(([k]) => k && !blocked.has(k) && typeof k === "string");
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value ?? "") },
        create: { key, value: String(value ?? "") },
      }),
    ),
  );
  return NextResponse.json({ ok: true, updated: entries.map(([k]) => k) });
}

/** GET /api/admin/settings */
export async function GET() {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json({ ok: true, data: map });
}
