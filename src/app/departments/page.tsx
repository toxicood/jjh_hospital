import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata = { title: "Departments & Services" };

export default async function DepartmentsPage() {
  const [departments, facilities] = await Promise.all([
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { doctors: { where: { isActive: true } } } } },
    }),
    prisma.service.findMany({ where: { isActive: true, category: "FACILITY" }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="container-x py-10">
      <p className="section-sub">Departments · विभाग</p>
      <h1 className="section-title">Medical Departments & Services</h1>

      <div className="mt-8 space-y-5">
        {departments.map((d) => (
          <section key={d.id} id={d.slug} className="card scroll-mt-24">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{d.icon} {d.name}</h2>
                {d.nameHi && <p className="text-sm text-slate-500">{d.nameHi}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-brand-700">{d._count.doctors} doctor(s) listed</p>
                {d.highlightDays && <p className="text-xs font-bold text-green-700">{d.highlightDays}</p>}
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{d.description}</p>
            {d.descriptionHi && <p className="mt-1 text-sm text-slate-500 hi-line">{d.descriptionHi}</p>}
            <div className="mt-4 flex gap-2">
              <Link href="/book" className="btn-primary btn-sm">Book in this department</Link>
              <Link href={`/doctors`} className="btn-secondary btn-sm">See doctors →</Link>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="section-title">Other Hospital Services</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((f) => (
            <div key={f.id} className="card">
              <div className="text-2xl">{f.icon || "🛠️"}</div>
              <h3 className="mt-2 font-semibold">{f.title}</h3>
              {f.titleHi && <p className="text-xs text-slate-500">{f.titleHi}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
