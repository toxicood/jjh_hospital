import { NextResponse } from "next/server";
import { prisma, type PrismaClient } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type AnyPrisma = Record<string, any>;

const MODULES: Record<string, { model: keyof PrismaClient; fields: Record<string, "string" | "number" | "boolean" | "nullable-number"> }> = {
  services: {
    model: "service",
    fields: {
      title: "string",
      titleHi: "string",
      description: "string",
      descriptionHi: "string",
      icon: "string",
      category: "string",
      sortOrder: "number",
      isActive: "boolean",
    },
  },
  gallery: {
    model: "galleryImage",
    fields: {
      title: "string",
      imageUrl: "string",
      caption: "string",
      sortOrder: "number",
      isActive: "boolean",
    },
  },
  testimonials: {
    model: "testimonial",
    fields: {
      patientName: "string",
      city: "string",
      rating: "number",
      message: "string",
      isSample: "boolean",
      isActive: "boolean",
    },
  },
  timeslot: {
    model: "timeSlot",
    fields: { doctorId: "number", fromTime: "string", kind: "string", reason: "string" },
  },
};

function cast(type: string, value: unknown): unknown {
  switch (type) {
    case "number": return Number(value) || 0;
    case "nullable-number": {
      const n = Number(value);
      return Number.isFinite(n) && value !== null && value !== "" ? n : null;
    }
    case "boolean": return value === true || value === "true" || value === "on" || value === 1;
    default: return String(value ?? "");
  }
}

function sanitize(module: string, body: any): Record<string, unknown> {
  const def = MODULES[module];
  const out: Record<string, unknown> = {};
  for (const [k, type] of Object.entries(def.fields)) {
    if (k in body) out[k] = cast(type, body[k]);
  }
  return out;
}

function modelOf(module: string): AnyPrisma {
  const def = MODULES[module];
  return def ? (prisma as unknown as AnyPrisma)[def.model as string] : null;
}

/** GET /api/admin/content/[module] */
export async function GET(_req: Request, ctx: { params: Promise<{ module: string }> }) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const { module } = await ctx.params;
  const model = modelOf(module);
  if (!model) return NextResponse.json({ ok: false, error: "Unknown module" }, { status: 404 });
  const rows = await model.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ ok: true, data: rows });
}

/** POST /api/admin/content/[module] */
export async function POST(req: Request, ctx: { params: Promise<{ module: string }> }) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const { module } = await ctx.params;
  const model = modelOf(module);
  if (!model) return NextResponse.json({ ok: false, error: "Unknown module" }, { status: 404 });
  const body = await req.json().catch(() => ({}));

  // special handling: timeslot needs a date
  if (module === "timeslot") {
    const date = String(body.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, fieldErrors: { date: "Date required (YYYY-MM-DD)" } }, { status: 422 });
    }
    const row = await model.create({
      data: { ...sanitize(module, body), date: new Date(`${date}T00:00:00`) },
    });
    return NextResponse.json({ ok: true, data: row }, { status: 201 });
  }

  const row = await model.create({ data: sanitize(module, body) });
  await audit({ actorType: "ADMIN", actorId: Number(g.session.sub.split(":")[1]), actorName: g.session.name, action: `${module.toUpperCase()}_CREATED`, entity: module.toUpperCase(), entityId: row.id });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
