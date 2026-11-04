import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { contactMessageSchema, zodFieldErrors } from "@/lib/validation";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/** POST /api/contact — public contact form */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, fieldErrors: zodFieldErrors(parsed.error) }, { status: 422 });
  }
  const msg = await prisma.contactMessage.create({ data: parsed.data });
  void notify({
    channel: "ADMIN",
    recipient: "admin-inbox",
    message: `New contact message from ${msg.name} (${msg.phone}): ${msg.subject || "General"} — "${msg.message.slice(0, 150)}"`,
  });
  return NextResponse.json({ ok: true, message: "Message received — hospital staff will contact you soon." }, { status: 201 });
}
