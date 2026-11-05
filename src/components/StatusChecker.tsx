"use client";

import { useState } from "react";

interface Result {
  apptCode: string;
  status: string;
  statusLabel: string;
  doctorName: string;
  departmentName: string | null;
  date: string;
  time: string;
  createdAt: string;
  fullName: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-slate-200 text-slate-700",
};

export default function StatusChecker() {
  const [apptCode, setApptCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/appointments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apptCode: apptCode.trim(), mobile: mobile.replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Not found");
        return;
      }
      setResult(data.data);
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="card max-w-xl space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Appointment ID *</span>
            <input className="field" value={apptCode} onChange={(e) => setApptCode(e.target.value.toUpperCase())}
              placeholder="JJH-XXXXXX" required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Registered Mobile *</span>
            <input className="field" value={mobile} onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile" inputMode="numeric" required />
          </label>
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button className="btn-primary" disabled={loading}>
          {loading ? "⏳ Checking…" : "🔍 Check Status — स्थिति देखें"}
        </button>
      </form>

      {result && (
        <div className="card max-w-xl animate-fade-up">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500">Appointment ID</p>
              <p className="text-2xl font-black tracking-wider text-brand-700">{result.apptCode}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[result.status] ?? "bg-slate-100"}`}>
              {result.statusLabel}
            </span>
          </div>
          <dl className="mt-4 grid gap-1.5 text-sm text-slate-700">
            <p><b>Patient:</b> {result.fullName}</p>
            <p><b>Doctor:</b> {result.doctorName}</p>
            {result.departmentName && <p><b>Department:</b> {result.departmentName}</p>}
            <p><b>Date:</b> {result.date} · <b>Time:</b> {result.time} IST</p>
            <p><b>Booked on:</b> {result.createdAt}</p>
          </dl>
          {["PENDING", "CONFIRMED"].includes(result.status) && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <a
                href={`/api/appointments/slip?code=${encodeURIComponent(result.apptCode)}&mobile=${encodeURIComponent(mobile.replace(/\D/g, ""))}`}
                className="btn btn-primary"
              >
                📄 Download OPD Slip PDF — पर्ची डाउनलोड करें
              </a>
              <p className="mt-2 text-xs text-slate-500">
                Yahi slip reception par dikha sakte hain. Isi PDF ka ek copy aapke email par bhi bhej diya gaya hai.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
