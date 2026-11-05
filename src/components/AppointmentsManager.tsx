"use client";

import { useCallback, useEffect, useState } from "react";
import { STATUS_LABELS } from "@/lib/status";

interface Appt {
  id: number;
  apptCode: string;
  fullName: string;
  mobile: string;
  age: number | null;
  gender: string | null;
  email: string | null;
  problemDescription: string | null;
  doctorName: string;
  doctorId: number;
  departmentName: string | null;
  departmentId: number | null;
  date: string;
  rawDate: string;
  time: string;
  status: string;
  statusReason: string | null;
  adminNotes: string | null;
  source: string;
  createdAt: string;
}

interface Ref {
  id: number;
  name: string;
}

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

/** Click-to-chat link — opens WhatsApp with a ready-made status message for the patient. */
function waLink(a: Appt): string {
  const phone = a.mobile.replace(/[^\d]/g, "").replace(/^91/, "");
  const lines: string[] = [`🙏 *Jeevan Jyoti Hospital, Sirsa* — Appointment ${a.apptCode}`];
  if (a.status === "PENDING") {
    lines.push("आपका पंजीकरण प्राप्त हो गया है — confirmation का इंतज़ार है।", "");
  } else if (a.status === "CONFIRMED") {
    lines.push("हमारे पास आपकी appointment book है।", "");
  } else if (a.status === "CANCELLED") {
    lines.push("आपकी appointment cancel कर दी गई है।", `कारण: ${a.statusReason || "—"}`, "");
  } else if (a.status === "COMPLETED") {
    lines.push("आपकी appointment पूरी हो चुकी है — धन्यवाद।", "");
  }
  lines.push(`👤 ${a.fullName}`, `🩺 ${a.doctorName}${a.departmentName ? ` (${a.departmentName})` : ""}`, `📅 ${a.date} · ⏰ ${a.time} IST`, "", "किसी बदलाव के लिए यहाँ reply करें या अस्पताल call करें। धन्यवाद।");
  return `https://wa.me/91${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export default function AppointmentsManager() {
  const [rows, setRows] = useState<Appt[]>([]);
  const [doctors, setDoctors] = useState<Ref[]>([]);
  const [departments, setDepartments] = useState<Ref[]>([]);
  const [filters, setFilters] = useState({ status: "", doctorId: "", departmentId: "", from: "", to: "", q: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resched, setResched] = useState<Appt | null>(null);
  const [reschedForm, setReschedForm] = useState({ date: "", time: "" });
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async (f: typeof filters) => {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams(
      Object.entries(f).filter(([, v]) => v !== "") as [string, string][],
    ).toString();
    const res = await fetch(`/api/admin/appointments?${qs}`);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      setError("Could not load appointments — are you logged in as admin?");
      setRows([]);
    } else {
      setRows(data.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(filters);
    fetch("/api/admin/doctors").then((r) => r.json()).then((d) => {
      if (d?.ok) setDoctors(d.data.map((x: { id: number; fullName: string }) => ({ id: x.id, name: x.fullName })));
    }).catch(() => {});
    fetch("/api/admin/departments").then((r) => r.json()).then((d) => {
      if (d?.ok) setDepartments(d.data.map((x: { id: number; name: string }) => ({ id: x.id, name: x.name })));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(id: number, body: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      setError(data?.message || data?.error || "Action failed");
    }
    setBusyId(null);
    setResched(null);
    void load(filters);
  }

  const exportUrl = () => {
    const qs = new URLSearchParams(
      Object.entries({ ...filters, format: "csv" }).filter(([, v]) => v !== "") as [string, string][],
    ).toString();
    return `/api/admin/appointments/export?${qs}`;
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments — मरीज़ों की बुकिंग</h1>
          <p className="text-sm text-slate-500">Confirm, cancel, reschedule and export</p>
        </div>
        <a href={exportUrl()} className="btn-secondary btn-sm">⬇️ Download CSV / Excel report</a>
      </header>

      {/* Filters */}
      <div className="card grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <select className="field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select className="field" value={filters.doctorId} onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}>
          <option value="">All doctors</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="field" value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input className="field" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} title="From date" />
        <input className="field" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} title="To date" />
        <div className="flex gap-2">
          <input className="field" placeholder="Search name/ID/mobile" value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && load(filters)} />
          <button className="btn-primary btn-sm" onClick={() => load(filters)}>Search</button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading && <div className="card text-sm text-slate-500">⏳ Loading appointments…</div>}

      {/* Table */}
      {!loading && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2.5">ID / Patient</th>
                <th className="px-3 py-2.5">Doctor / Dept</th>
                <th className="px-3 py-2.5">Date & Time</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">No appointments match the filters.</td></tr>
              )}
              {rows.map((a) => (
                <tr key={a.id} className="align-top hover:bg-slate-50/60">
                  <td className="px-3 py-2.5">
                    <p className="font-bold text-slate-800">{a.apptCode}</p>
                    <p>{a.fullName} · {a.mobile}</p>
                    <p className="text-xs text-slate-400">{a.age}/{a.gender?.[0] ?? "-"} · via {a.source.toLowerCase()}</p>
                    {a.problemDescription && <p className="mt-1 max-w-xs text-xs text-slate-500">“{a.problemDescription}”</p>}
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{a.doctorName}</p>
                    <p className="text-xs text-slate-500">{a.departmentName}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{a.date}</p>
                    <p className="text-xs text-slate-500">{a.time} IST</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusPill status={a.status} />
                    {a.statusReason && <p className="mt-1 text-xs text-slate-400">{a.statusReason}</p>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {a.status === "PENDING" && (
                        <button disabled={busyId === a.id} onClick={() => act(a.id, { action: "CONFIRM" })} className="btn btn-sm btn-primary">✅ Confirm</button>
                      )}
                      {a.status === "CONFIRMED" && (
                        <button disabled={busyId === a.id} onClick={() => act(a.id, { action: "COMPLETE" })} className="btn btn-sm btn-secondary">🏁 Complete</button>
                      )}
                      {!["CANCELLED", "COMPLETED"].includes(a.status) && (
                        <>
                          <button disabled={busyId === a.id} onClick={() => { setResched(a); setReschedForm({ date: a.rawDate.slice(0, 10), time: a.time }); }} className="btn btn-sm btn-secondary">🕒 Reschedule</button>
                          <button disabled={busyId === a.id} onClick={() => { if (confirm(`Cancel ${a.apptCode}?`)) act(a.id, { action: "CANCEL" }); }} className="btn btn-sm btn-danger">✖ Cancel</button>
                        </>
                      )}
                      <button onClick={() => printReceipt(a)} className="btn btn-sm btn-secondary">🖨️ Print<br /></button>
                      <a href={`/api/admin/appointments/${a.id}/slip`} className="btn btn-sm btn-secondary">📄 OPD Slip<br /></a>
                      <a
                        href={waLink(a)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm bg-green-500 text-white hover:bg-green-600"
                      >💬 WhatsApp<br /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reschedule modal */}
      {resched && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setResched(null)}>
          <div className="card w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900">Reschedule {resched.apptCode}</h3>
            <p className="text-xs text-slate-500">{resched.doctorName} — current: {resched.date} {resched.time}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className="field" type="date" value={reschedForm.date} min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setReschedForm({ ...reschedForm, date: e.target.value })} />
              <input className="field" type="time" value={reschedForm.time}
                onChange={(e) => setReschedForm({ ...reschedForm, time: e.target.value })} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Time must be within doctor's OPD window (pick a slot shown on booking page, e.g. 09:00–13:00 every 30 min).</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary" onClick={() => act(resched.id, { action: "RESCHEDULE", date: reschedForm.date, time: reschedForm.time.slice(0, 5) })}>Save new slot</button>
              <button className="btn-secondary" onClick={() => setResched(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-700",
    COMPLETED: "bg-slate-200 text-slate-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${styles[status] ?? "bg-slate-100"}`}>{STATUS_LABELS[status] ?? status}</span>;
}

function printReceipt(a: Appt) {
  const w = window.open("", "_blank", "width=480,height=640");
  if (!w) return;
  w.document.write(`<html><head><title>Receipt ${a.apptCode}</title>
    <style>body{font-family:system-ui;padding:24px;color:#0f172a}h1{color:#0463cf;margin:0}table{border-collapse:collapse;margin-top:16px}td{padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:14px}td:first-child{color:#64748b}</style>
  </head><body>
    <h1>Jeevan Jyoti Hospital, Sirsa</h1>
    <p style="color:#64748b">Appointment Receipt</p>
    <table>
      <tr><td>Appointment ID</td><td><b>${a.apptCode}</b></td></tr>
      <tr><td>Patient</td><td>${a.fullName} (${a.age ?? "-"}, ${a.gender ?? "-"})</td></tr>
      <tr><td>Mobile</td><td>${a.mobile}</td></tr>
      <tr><td>Doctor</td><td>${a.doctorName}</td></tr>
      <tr><td>Department</td><td>${a.departmentName ?? "-"}</td></tr>
      <tr><td>Date</td><td>${a.date}</td></tr>
      <tr><td>Time</td><td>${a.time} IST</td></tr>
      <tr><td>Status</td><td>${a.status}</td></tr>
      <tr><td>Booked on</td><td>${a.createdAt}</td></tr>
    </table>
    <p style="margin-top:24px;color:#94a3b8;font-size:12px">Please arrive 15 minutes before your slot with this receipt and ID proof.</p>
  </body></html>`);
  w.document.close();
  w.focus();
  void w.print?.();
}
