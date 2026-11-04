"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setError(data.error || "Failed to send");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card border-green-200 bg-green-50/60 text-center">
        <div className="text-3xl">📨</div>
        <h3 className="mt-2 font-bold text-green-800">Message sent!</h3>
        <p className="mt-1 text-sm text-green-700">
          आपका संदेश आ गया है — हमारी टीम जल्द संपर्क करेगी। (Hospital staff will get back to you soon.)
        </p>
      </div>
    );
  }

  const err = (k: string) => fieldErrors[k] ? "field-error" : "";
  const line = (k: string) => fieldErrors[k] ? <span className="mt-1 block text-xs text-red-600">{fieldErrors[k]}</span> : null;

  return (
    <form onSubmit={submit} className="card space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Your Name *</span>
          <input className={`field ${err("name")}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          {line("name")}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Phone *</span>
          <input className={`field ${err("phone")}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="numeric" required />
          {line("phone")}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Email (optional)</span>
          <input className={`field ${err("email")}`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {line("email")}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Subject</span>
          <input className="field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="General / Feedback / Report" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Message *</span>
        <textarea className={`field min-h-24 ${err("message")}`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        {line("message")}
      </label>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button className="btn-primary" disabled={loading}>{loading ? "⏳ Sending…" : "✉️ Send Message — संदेश भेजें"}</button>
    </form>
  );
}
