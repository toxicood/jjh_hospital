import Link from "next/link";
import { prisma } from "@/lib/db";
import { prettyDate } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard" };

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-slate-200 text-slate-700",
};

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, pending, confirmed, cancelled, completed, todayCount, patients, latest, latestAudit] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
    prisma.appointment.count({ where: { date: today } }),
    prisma.patient.count(),
    prisma.appointment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { doctor: { select: { fullName: true } } },
    }),
    prisma.auditLog.findMany({ take: 6, orderBy: { createdAt: "desc" } }),
  ]);

  const stats = [
    { label: "Total Appointments", value: total, href: "/admin/appointments", tone: "text-brand-700" },
    { label: "Today", value: todayCount, href: "/admin/appointments", tone: "text-brand-700" },
    { label: "Pending", value: pending, href: "/admin/appointments?status=PENDING", tone: "text-amber-600" },
    { label: "Confirmed", value: confirmed, href: "/admin/appointments?status=CONFIRMED", tone: "text-green-600" },
    { label: "Completed", value: completed, href: "/admin/appointments?status=COMPLETED", tone: "text-slate-600" },
    { label: "Cancelled", value: cancelled, href: "/admin/appointments?status=CANCELLED", tone: "text-red-500" },
    { label: "Registered Patients", value: patients, href: "/admin/patients", tone: "text-brand-700" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard — आज की हालत</h1>
        <p className="text-sm text-slate-500">Appointments, patients and system activity overview</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card hover:border-brand-300 transition-colors">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-black ${s.tone}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Latest Appointments</h2>
            <Link href="/admin/appointments" className="text-xs font-semibold text-brand-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {latest.length === 0 && <p className="text-sm text-slate-500">No appointments yet — sample data seed nahi chali ya bookings nahi hui.</p>}
            {latest.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{a.apptCode} · {a.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{a.doctor.fullName} — {prettyDate(a.date)} {a.time}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLES[a.status] ?? "bg-slate-100"}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-900">Recent Activity (Audit)</h2>
          <div className="space-y-2 text-sm">
            {latestAudit.length === 0 && <p className="text-slate-500">No activity yet.</p>}
            {latestAudit.map((l) => (
              <div key={l.id} className="rounded-lg border border-slate-100 px-3 py-2">
                <p className="font-medium text-slate-700">{l.action} <span className="text-xs text-slate-400">— {l.actorName || l.actorType}</span></p>
                <p className="text-xs text-slate-500">{l.detail || l.entity} · {prettyDate(l.createdAt)}</p>
              </div>
            ))}
          </div>
          <Link href="/admin/audit" className="mt-3 inline-block text-xs font-semibold text-brand-600 hover:underline">Full audit log →</Link>
        </div>
      </section>

      <section className="card border-amber-200 bg-amber-50">
        <h2 className="font-semibold text-amber-900">⚠️ Sample data present</h2>
        <p className="mt-1 text-sm text-amber-800">
          Seeded doctors/services/testimonials are clearly marked SAMPLE. Replace them via Doctors / Services / Testimonials
          pages. Also change your default admin password (seeded credentials are in <code>.env</code>).
        </p>
      </section>
    </div>
  );
}
