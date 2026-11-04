"use client";

import { useEffect, useState } from "react";

export default function AuditPage() {
  const [rows, setRows] = useState<{
    id: number; actorType: string; actorName: string | null; action: string;
    entity: string; entityId: number | null; detail: string | null; createdAt: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-log")
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
        <h1 className="text-2xl font-bold text-slate-900">Audit Log — हर काम का रिकॉर्ड</h1>
        <p className="text-sm text-slate-500">All administrative actions for security and accountability.</p>
      </header>
      {loading ? (
        <div className="card text-sm text-slate-500">⏳ Loading…</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2 text-xs text-slate-500">{l.createdAt}</td>
                  <td className="px-3 py-2">{l.actorName || l.actorType}</td>
                  <td className="px-3 py-2"><span className="font-semibold">{l.action}</span></td>
                  <td className="px-3 py-2 text-xs text-slate-500">{l.detail || `${l.entity}#${l.entityId ?? ""}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
