"use client";

import { useCallback, useEffect, useState } from "react";

interface Row {
  token: number;
  apptCode: string;
  fullName: string;
  mobile: string;
  age: number | null;
  gender: string | null;
  doctor: string;
  department: string | null;
  date: string;
  time: string;
  source: string;
  status: string;
  bookedAt: string;
}

interface Data {
  startDate: string;
  days: number;
  totals: { total: number; pending: number; confirmed: number; completed: number; cancelled: number; online: number };
  patients: Row[];
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  COMPLETED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function OpdReportPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState(1);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/opd-report?date=${date}&days=${days}`)
      .then((r) => r.json())
      .then((d) => { if (d?.ok) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date, days]);

  useEffect(load, [load]);

  function printReport() {
    window.print();
  }

  function downloadCsv() {
    if (!data) return;
    const head = ["Token", "Appointment ID", "Patient Name", "Mobile", "Age", "Gender", "Doctor", "Department", "Date", "Time", "Source", "Status", "Booked On"];
    const lines = [
      `Jeevan Jyoti Hospital, Sirsa - OPD Report`,
      `Period: ${data.startDate}${days > 1 ? ` (+${days - 1} days)` : ""} | Generated: ${new Date().toLocaleString()}`,
      `Total OPD: ${data.totals.total} | Confirmed: ${data.totals.confirmed} | Pending: ${data.totals.pending} | Completed: ${data.totals.completed} | Cancelled: ${data.totals.cancelled}`,
      "",
      head.join(","),
      ...data.patients.map((p) =>
        [p.token, p.apptCode, p.fullName, p.mobile, p.age ?? "-", p.gender ?? "-", p.doctor, p.department ?? "-", p.date, p.time, p.source, p.status, p.bookedAt]
          .map((f) => `"${String(f).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `OPD-Report-${data.startDate}${days > 1 ? `-${days}days` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const end = data ? new Date(new Date(data.startDate).getTime() + (data.days - 1) * 86400000).toISOString().slice(0, 10) : "";

  return (
    <div className="space-y-4">
      {/* Screen-only controls */}
      <div className="noprint space-y-3">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">OPD Report — आज की पर्चियों की सूची</h1>
          <p className="text-sm text-slate-500">
            Daily OPD register in English with Total OPD count. Print, save as PDF or download CSV.
          </p>
        </header>
        <div className="card flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Report Date / From</span>
            <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Period</span>
            <select className="field" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={1}>Single day — एक दिन</option>
              <option value={7}>Last 7 days from date — 7 दिन</option>
              <option value={30}>Last 30 days from date — 30 दिन</option>
            </select>
          </label>
          <button className="btn btn-secondary" onClick={load}>🔄 Refresh</button>
          <button className="btn btn-secondary" onClick={downloadCsv}>⬇️ Download CSV</button>
          <button className="btn btn-primary" onClick={printReport}>🖨️ Print / Save as PDF</button>
        </div>
      </div>

      {loading && <div className="card text-sm text-slate-500 noprint">⏳ Loading report…</div>}

      {data && (
        <div id="opd-print-area" className="print-sheet card p-6">
          {/* Letterhead */}
          <div className="border-b-4 border-red-600 pb-3">
            <div className="flex items-start justify-between text-[11px] text-slate-600">
              <span className="font-semibold">drsureshbishnoi@yahoo.com</span>
              <span className="font-semibold">Ph. 01666-231100</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="grid h-8 w-10 place-items-center rounded bg-red-600 text-sm font-black text-white">JJ</span>
              <span className="text-lg text-red-600">—</span>
              <h2 className="text-2xl font-black tracking-wide text-red-600">Jeevan Jyoti Hospital</h2>
              <span className="text-lg text-red-600">—</span>
            </div>
            <p className="text-center text-xs font-bold text-slate-800">Near R.S.D. School, Dabwali Road, SIRSA (Hry.)</p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-base font-bold uppercase tracking-wider text-slate-900">OPD Report</h3>
            <p className="text-xs text-slate-600">
              <b>Period:</b> {data.startDate}{days > 1 ? ` to ${end}` : ""} &nbsp;·&nbsp; <b>Generated:</b> {new Date().toLocaleString("en-IN")}
            </p>
          </div>

          {/* Totals */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
            <div className="rounded-lg bg-red-50 p-3 text-center ring-1 ring-red-100">
              <p className="text-[11px] font-bold uppercase text-red-700">Total OPD</p>
              <p className="text-2xl font-black text-red-700">{data.totals.total}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center ring-1 ring-green-100">
              <p className="text-[11px] font-bold uppercase text-green-800">Confirmed</p>
              <p className="text-2xl font-black text-green-800">{data.totals.confirmed}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center ring-1 ring-amber-100">
              <p className="text-[11px] font-bold uppercase text-amber-800">Pending</p>
              <p className="text-2xl font-black text-amber-800">{data.totals.pending}</p>
            </div>
            <div className="rounded-lg bg-slate-100 p-3 text-center">
              <p className="text-[11px] font-bold uppercase text-slate-600">Completed</p>
              <p className="text-2xl font-black text-slate-700">{data.totals.completed}</p>
            </div>
            <div className="rounded-lg bg-red-50/60 p-3 text-center ring-1 ring-red-100">
              <p className="text-[11px] font-bold uppercase text-red-700">Cancelled</p>
              <p className="text-2xl font-black text-red-700">{data.totals.cancelled}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center ring-1 ring-blue-100">
              <p className="text-[11px] font-bold uppercase text-blue-700">Online (web)</p>
              <p className="text-2xl font-black text-blue-700">{data.totals.online}</p>
            </div>
          </div>

          {/* Table */}
          <table className="mt-5 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-left text-[10px] uppercase text-slate-600">
                <th className="border border-slate-200 px-2 py-1.5">Token</th>
                <th className="border border-slate-200 px-2 py-1.5">Appt ID</th>
                <th className="border border-slate-200 px-2 py-1.5">Patient Name</th>
                <th className="border border-slate-200 px-2 py-1.5">Mobile</th>
                <th className="border border-slate-200 px-2 py-1.5">Age/Sex</th>
                <th className="border border-slate-200 px-2 py-1.5">Doctor</th>
                <th className="border border-slate-200 px-2 py-1.5">Department</th>
                <th className="border border-slate-200 px-2 py-1.5">Time</th>
                <th className="border border-slate-200 px-2 py-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.patients.length === 0 && (
                <tr><td colSpan={9} className="border border-slate-200 px-2 py-4 text-center text-slate-400">No OPD patients in this period.</td></tr>
              )}
              {data.patients.map((p) => (
                <tr key={p.apptCode} className="odd:bg-white even:bg-slate-50/60">
                  <td className="border border-slate-200 px-2 py-1.5 font-bold">{p.token}</td>
                  <td className="border border-slate-200 px-2 py-1.5 font-mono">{p.apptCode}</td>
                  <td className="border border-slate-200 px-2 py-1.5 font-medium">{p.fullName}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{p.mobile}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{p.age ?? "-"} / {p.gender?.[0] ?? "-"}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{p.doctor}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{p.department ?? "-"}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{p.time}</td>
                  <td className="border border-slate-200 px-2 py-1.5">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${STATUS_STYLE[p.status] ?? "bg-slate-100"}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signature row */}
          <div className="mt-8 flex items-end justify-between text-xs text-slate-600">
            <div>
              <p className="font-bold text-slate-800 not-italic">Generated by Hospital Website</p>
              <p className="mt-6 border-t border-slate-300 pt-1 pr-10">Reception / Admin Signature</p>
            </div>
            <div className="border-t border-slate-300 pt-1 pl-10 text-right">Checked by (Doctor / RMO)</div>
          </div>
          <p className="mt-4 text-center text-[10px] text-slate-400">
            Jeevan Jyoti Hospital, Sirsa — OPD timings: Mon–Sat 10:00–15:00, Evening 17:00–18:30 · Not Valid for Medico Legal Purpose
          </p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          html, body { background: white !important; }
          #opd-print-area, #opd-print-area * { visibility: visible; }
          #opd-print-area { position: absolute; inset: 0; width: 100%; box-shadow: none; border: none; padding: 10mm; }
          .noprint { display: none !important; }
        }
      `}</style>
    </div>
  );
}
