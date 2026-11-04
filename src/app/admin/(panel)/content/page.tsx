"use client";

import { useEffect, useState } from "react";

const GROUPS: { label: string; keys: [string, string][] }[] = [
  {
    label: "Hospital identity — हॉस्पिटल का परिचय",
    keys: [
      ["HOSPITAL_NAME", "Hospital name (English)"],
      ["HOSPITAL_NAME_HI", "Hospital name (Hindi)"],
      ["TAGLINE", "Tagline (English)"],
      ["TAGLINE_HI", "Tagline (Hindi)"],
    ],
  },
  {
    label: "Contact details — संपर्क",
    keys: [
      ["ADDRESS", "Full address"],
      ["PHONE", "Main phone"],
      ["EMERGENCY_PHONE", "Emergency phone"],
      ["EMAIL", "Email"],
      ["WHATSAPP_NUMBER", "WhatsApp number (digits only, with 91 prefix)"],
      ["MAP_QUERY", "Google Maps search query"],
      ["OPD_TIMING", "OPD timings text"],
    ],
  },
  {
    label: "Home page text — होम पेज",
    keys: [
      ["HOME_ABOUT", "About paragraph (English)"],
      ["HOME_ABOUT_HI", "About paragraph (Hindi)"],
      ["BANNER_NOTICE_HI", "Top banner notice (Hindi)"],
    ],
  },
  {
    label: "Policies — नीतियाँ",
    keys: [
      ["CANCELLATION_POLICY", "Cancellation policy text"],
      ["DISCLAIMER", "Site disclaimer"],
      ["FOOTER_NOTE", "Footer note"],
    ],
  },
];

export default function AdminContentPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setSettings(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) setMessage("✅ Saved — website pe turant change nazar aayega");
    else setError(data?.error || "Save failed");
    setSaving(false);
  }

  if (loading) return <div className="card text-sm text-slate-500">⏳ Loading content…</div>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Site Content — वेबसाइट की लिखाई</h1>
        <p className="text-sm text-slate-500">Editable text blocks, contact info and policies used across the website.</p>
      </header>

      {GROUPS.map((g) => (
        <section key={g.label} className="card space-y-4">
          <h2 className="font-semibold text-slate-900">{g.label}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.keys.map(([key, label]) => (
              <label key={key} className={["ADDRESS", "HOME_ABOUT", "HOME_ABOUT_HI", "CANCELLATION_POLICY", "DISCLAIMER", "BANNER_NOTICE_HI"].includes(key) ? "sm:col-span-2" : ""}>
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
                {["ADDRESS", "HOME_ABOUT", "HOME_ABOUT_HI", "CANCELLATION_POLICY"].includes(key) ? (
                  <textarea
                    className="field min-h-16"
                    value={settings[key] ?? ""}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  />
                ) : (
                  <input
                    className="field"
                    value={settings[key] ?? ""}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      {message && <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button className="btn-primary" onClick={save} disabled={saving}>
        {saving ? "⏳ Saving…" : "💾 Save all content"}
      </button>
    </div>
  );
}
