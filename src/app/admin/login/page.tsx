"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "ADMIN", identifier: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }
      router.push(data.data.redirect || "/admin");
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
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl font-black text-white shadow">J</span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Staff / Admin Login</h1>
          <p className="mt-1 text-sm text-slate-500">Hospital staff panel — appointment & content management</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@jjh.in" required autoFocus />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "⏳ Logging in…" : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Patient? <Link className="text-brand-600 underline" href="/patient/login">Patient login"</Link>
        </p>
      </div>
    </div>
  );
}
