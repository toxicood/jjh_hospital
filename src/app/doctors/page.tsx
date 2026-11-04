import Link from "next/link";
import { prisma } from "@/lib/db";
import { WEEKDAY_OPTIONS } from "@/lib/weekdays";

export const metadata = { title: "Our Doctors" };

function daysLabel(csv: string): string {
  const parts = csv.split(",").map((x) => parseInt(x.trim(), 10)).filter((n) => !Number.isNaN(n));
  if (parts.length === 7) return "All days";
  return parts.map((d) => WEEKDAY_OPTIONS[d]?.label ?? "").filter(Boolean).join(", ");
}

export default async function DoctorsPage() {
  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    include: { department: true },
    orderBy: [{ departmentId: "asc" }, { fullName: "asc" }],
  });

  return (
    <div className="container-x py-10">
      <p className="section-sub">Doctors · डॉक्टर</p>
      <h1 className="section-title">Our Expert Doctors</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Profiles marked "Sample" are placeholders until the hospital administration enters verified details.
        नमूना प्रोफ़ाइल — प्रबंधन सत्यापित जानकारी दर्ज करेगा।
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.length === 0 && (
          <div className="card text-sm text-slate-500">No doctor profiles are published yet.</div>
        )}
        {doctors.map((d) => (
          <div key={d.id} className="card flex flex-col">
            <div className="flex items-center gap-3">
              {d.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.photoUrl} alt={d.fullName} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                  {d.fullName.replace(/^Dr\.?\s*/i, "").charAt(0) || "D"}
                </span>
              )}
              <div>
                <h2 className="font-bold text-slate-900">{d.fullName}</h2>
                <p className="text-xs text-slate-500">{d.specialization || d.department?.name || "—"}</p>
              </div>
            </div>
            <dl className="mt-3 space-y-1 text-sm text-slate-600">
              {d.qualification && <p>🎓 {d.qualification}</p>}
              {d.experienceYears !== null && d.experienceYears > 0 && <p>🧑‍⚕️ {d.experienceYears}+ years</p>}
              {d.consultationFee ? <p>💰 ₹{d.consultationFee} consultation</p> : null}
              <p>📅 {daysLabel(d.availableDays)}</p>
              <p>⏰ {d.morningFrom}–{d.morningTo}{d.eveningFrom && d.eveningTo ? ` & ${d.eveningFrom}–${d.eveningTo}` : ""} (IST)</p>
            </dl>
            {d.bio && <p className="mt-2 text-xs text-slate-500">{d.bio}</p>}
            {d.isSample && <p className="mt-2"><span className="badge-sample">⚠️ Sample profile — replace via Admin</span></p>}
            <Link href={`/book?doctorId=${d.id}`} className="btn-primary mt-4">Appointment बुक करें</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
