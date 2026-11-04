"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";

interface Appt {
  id: number;
  apptCode: string;
  doctorName: string;
  specialization: string | null;
  departmentName: string | null;
  date: string;
  time: string;
  status: string;
  createdAt: string;
  problemDescription: string | null;
  adminNotes: string | null;
  statusReason: string | null;
}

export default function PatientDashboard({ patientName }: { patientName: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/patient/appointments");
    if (res.status === 401) {
      router.push("/patient/login");
      return;
    }
    const data = await res.json().catch(() => null);
    if (data?.ok) setRows(data.data);
    else setError("Could not load your appointments");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(id: number, code: string) {
    if (!confirm(`Cancel appointment ${code}?`)) return;
    const res = await fetch(`/api/patient/appointments/${id}/cancel`, { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      alert(data?.message || "Could not cancel — please call the hospital");
      return;
    }
    void load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/patient/login");
    router.refresh();
  }

  const upcoming = rows.filter((r) => ["PENDING", "CONFIRMED"].includes(r.status));
  const history = rows.filter((r) => !["PENDING", "CONFIRMED"].includes(r.status));

  return (
    <div className="container-x space-y-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-sub">My Health · मेरा खाता</p>
          <h1 className="section-title">Welcome, {patientName} 👋</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/book" className="btn-primary">📅 New Appointment बुक करें</Link>
          <button onClick={logout} className="btn-secondary">Logout</button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section>
        <h2 className="mb-2 font-bold text-slate-900">Upcoming appointments — आगामी बुकिंग</h2>
        {loading ? (
          <div className="card text-sm text-slate-500">⏳ Loading…</div>
        ) : upcoming.length === 0 ? (
          <div className="card text-sm text-slate-500">
            No upcoming appointments. <Link className="text-brand-600 underline" href="/book">Book now →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800">{a.apptCode} · {a.doctorName}</p>
                  <p className="text-sm text-slate-500">{a.departmentName?.concat(" · ") ?? ""}{a.date} · {a.time} IST</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[a.status] ?? "bg-slate-100"}`}>{STATUS_LABELS[a.status]}</span>
                  <button onClick={() => cancel(a.id, a.apptCode)} className="btn-danger btn-sm">Cancel — रद्द करें</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-bold text-slate-900">History — पिछली बुकिंग</h2>
        {!loading && history.length === 0 ? (
          <p className="text-sm text-slate-500">No past appointments yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((a) => (
              <div key={a.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800">{a.apptCode} · {a.doctorName}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLES[a.status] ?? "bg-slate-100"}`}>{STATUS_LABELS[a.status]}</span>
                </div>
                <p className="text-sm text-slate-500">{a.date} · {a.time} IST · booked {a.createdAt}</p>
                {a.statusReason && <p className="mt-1 text-xs text-slate-400">Note: {a.statusReason}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
