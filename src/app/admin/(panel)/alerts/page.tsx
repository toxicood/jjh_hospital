"use client";

import { useEffect, useState } from "react";

const STATUS_STYLE: Record<string, string> = {
  SENT: "bg-green-100 text-green-800",
  QUEUED: "bg-blue-100 text-blue-700",
  SKIPPED_NO_CREDENTIALS: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-700",
};

export default function AlertsPage() {
  const [rows, setRows] = useState<{
    id: number; channel: string; recipient: string | null; message: string;
    status: string; statusDetail: string | null; apptCode: string | null; createdAt: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setRows(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Notification Log — भेजे गए संदेश</h1>
        <p className="text-sm text-slate-500">
          Every WhatsApp/SMS/Email alert is recorded here. <b>SKIPPED_NO_CREDENTIALS</b> means the provider is not yet
          configured in <code>.env</code> — messages still show so nothing is lost.
        </p>
      </header>
      {loading ? (
        <div className="card text-sm text-slate-500">⏳ Loading…</div>
      ) : rows.length === 0 ? (
        <div className="card text-sm text-slate-500">No notifications yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((n) => (
            <div key={n.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold">{n.channel}</span>
                  {n.apptCode ? <span className="text-brand-700">{n.apptCode}</span> : "System"}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[n.status] ?? "bg-slate-100"}`}>{n.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{n.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                → {n.recipient ?? "—"} · {n.createdAt}{n.statusDetail ? ` · ${n.statusDetail}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
