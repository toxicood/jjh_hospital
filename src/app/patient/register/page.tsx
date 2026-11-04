"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PatientRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", mobile: "", password: "", confirm: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (form.password !== form.confirm) {
      setFieldErrors({ confirm: "Passwords don't match" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: form.fullName, mobile: form.mobile, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        else setError(data.error || "Registration failed");
        return;
      }
      router.push(data.data.redirect || "/patient/dashboard");
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-md animate-fade-up">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl text-white shadow">📝</span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Patient Registration</h1>
          <p className="mt-1 text-sm text-slate-500">नया पेशेंट खाता बनाएँ — बुकिंग और हिस्ट्री एक जगह</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Full Name *</span>
            <input className={`field ${fieldErrors.fullName ? "field-error" : ""}`} value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            {fieldErrors.fullName && <span className="mt-1 block text-xs text-red-600">{fieldErrors.fullName}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Mobile Number *</span>
            <input className={`field ${fieldErrors.mobile ? "field-error" : ""}`} value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })} inputMode="numeric" required />
            {fieldErrors.mobile && <span className="mt-1 block text-xs text-red-600">{fieldErrors.mobile}</span>}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Password *</span>
              <input className={`field ${fieldErrors.password ? "field-error" : ""}`} type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              {fieldErrors.password && <span className="mt-1 block text-xs text-red-600">{fieldErrors.password}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Confirm *</span>
              <input className={`field ${fieldErrors.confirm ? "field-error" : ""}`} type="password" value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
              {fieldErrors.confirm && <span className="mt-1 block text-xs text-red-600">{fieldErrors.confirm}</span>}
            </label>
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "⏳ Creating account…" : "Create account"}</button>
          <p className="text-center text-xs text-slate-400">Password minimum 8 characters. Bookings made earlier with the same mobile link automatically.</p>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already registered? <Link className="font-semibold text-brand-600 underline" href="/patient/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
