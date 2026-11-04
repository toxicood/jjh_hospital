"use client";

import { useEffect, useState } from "react";

interface PatientRow {
  id: number;
  fullName: string;
  mobile: string;
  email: string | null;
  age: number | null;
  gender: string | null;
  isActive: boolean;
  appointmentCount: number;
  registeredOn: string;
  hasLogin: boolean;
}

export default function AdminPatientsPage() {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(query = "") {
    setLoading(true);
    const res = await fetch(`/api/admin/patients${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json().catch(() => null);
    if (data?.ok) setRows(data.data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Patients — मरीज़ रजिस्ट्री</h1>
        <p className="text-sm text-slate-500">Patients created via booking or registration. Medical details are shown only to authorized staff.</p>
      </header>

      <div className="card flex gap-2">
        <input className="field" placeholder="Search name / mobile / email"
          value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)} />
        <button className="btn-primary btn-sm" onClick={() => load(q)}>Search</button>
      </div>

      {loading ? (
        <div className="card text-sm text-slate-500">⏳ Loading…</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Patient</th>
                <th className="px-3 py-2.5">Contact</th>
                <th className="px-3 py-2.5">Appointments</th>
                <th className="px-3 py-2.5">Portal</th>
                <th className="px-3 py-2.5">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">No patients found.</td></tr>}
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-800">{p.fullName}</p>
                    <p className="text-xs text-slate-500">{p.age ?? "—"} yrs · {p.gender ?? "-"}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p>{p.mobile}</p>
                    <p className="text-xs text-slate-500">{p.email ?? ""}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <a className="font-bold text-brand-600 hover:underline" href={`/admin/appointments?q=${p.mobile}`}>{p.appointmentCount}</a>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${p.hasLogin ? "bg-green-100 text-green-800" : "bg-slate-200"}`}>
                      {p.hasLogin ? "Has login" : "Guest (no password)"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{p.registeredOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
