"use client";

import { useEffect, useState } from "react";

interface Msg {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/messages")
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
        <h1 className="text-2xl font-bold text-slate-900">Contact Inbox — संपर्क फ़ॉर्म के संदेश</h1>
        <p className="text-sm text-slate-500">Messages submitted from the contact page.</p>
      </header>
      {loading ? (
        <div className="card text-sm text-slate-500">⏳ Loading…</div>
      ) : rows.length === 0 ? (
        <div className="card text-sm text-slate-500">No messages yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((m) => (
            <div key={m.id} className={`card ${m.isRead ? "" : "border-brand-300"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-800">{m.subject || "(no subject)"}</p>
                <span className="text-xs text-slate-400">{m.createdAt}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{m.message}</p>
              <p className="mt-2 text-xs text-slate-500">👤 {m.name} · 📞 {m.phone}{m.email ? ` · ✉️ ${m.email}` : ""}</p>
              <div className="mt-2 flex gap-1.5">
                {!m.isRead && (
                  <span className="badge-sample">NEW</span>
                )}
                <a className="btn-secondary btn-sm" href={`tel:${m.phone}`}>📞 Call</a>
                <a className="btn-secondary btn-sm" href={`https://wa.me/91${m.phone.replace(/^\+91|^91/, "")}`} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
