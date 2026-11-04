import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, ctx: { params: Promise<{ module: string; id: string }> }) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  return handle(req, ctx, "update");
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ module: string; id: string }> }) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  return handle(_req, ctx, "delete");
}

async function handle(req: Request, ctx: { params: Promise<{ module: string; id: string }> }, op: "update" | "delete") {
  const { module, id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });

  // Delegate to the shard route's exported logic to avoid duplication
  return executor(req as never, module, id, op);
}

async function executor(req: Request, module: string, id: number, op: "update" | "delete") {
  const models: Record<string, any> = {
    services: (prisma as any).service,
    gallery: (prisma as any).galleryImage,
    testimonials: (prisma as any).testimonial,
    timeslot: (prisma as any).timeSlot,
  };
  const model = models[module];
  if (!model) return NextResponse.json({ ok: false, error: "Unknown module" }, { status: 404 });

  if (op === "delete") {
    const row = await model.delete({ where: { id } }).catch(() => null);
    if (!row) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  const body = await req.json().catch(() => ({}));
  const data = await sanitizeFor(module, body);
  const row = await model.update({ where: { id }, data }).catch(() => null);
  if (!row) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: row });
}

import { prisma } from "@/lib/db";

const FIELD_TYPES: Record<string, Record<string, "string" | "number" | "boolean">> = {
  services: {
    title: "string", titleHi: "string", description: "string", descriptionHi: "string",
    icon: "string", category: "string", sortOrder: "number", isActive: "boolean",
  },
  gallery: { title: "string", imageUrl: "string", caption: "string", sortOrder: "number", isActive: "boolean" },
  testimonials: { patientName: "string", city: "string", rating: "number", message: "string", isSample: "boolean", isActive: "boolean" },
  timeslot: { doctorId: "number", fromTime: "string", kind: "string", reason: "string" },
};

async function sanitizeFor(module: string, body: any): Promise<Record<string, unknown>> {
  const types = FIELD_TYPES[module];
  const out: Record<string, unknown> = {};
  if (types) {
    for (const [k, t] of Object.entries(types)) {
      if (k in body) {
        out[k] = t === "number" ? Number(body[k]) || 0 : t === "boolean" ? !!body[k] : String(body[k] ?? "");
      }
    }
  }
  // timeslot date handling
  if (module === "timeslot" && typeof body?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    out.date = new Date(`${body.date}T00:00:00`);
  }
  return out;
}
