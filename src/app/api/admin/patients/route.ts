import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isFailed } from "@/lib/admin";
import { prettyDate } from "@/lib/site";

export const dynamic = "force-dynamic";

/** GET /api/admin/patients?q= */
export async function GET(req: Request) {
  const g = await requireAdmin();
  if (isFailed(g)) return g.error;
  const q = new URL(req.url).searchParams.get("q")?.trim();

  const patients = await prisma.patient.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q } },
            { mobile: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : undefined,
    include: { _count: { select: { appointments: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({
    ok: true,
    data: patients.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      mobile: p.mobile,
      email: p.email,
      age: p.age,
      gender: p.gender,
      isActive: p.isActive,
      appointmentCount: p._count.appointments,
      registeredOn: prettyDate(p.createdAt),
      hasLogin: Boolean(p.passwordHash),
    })),
  });
}
