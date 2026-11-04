"use client";

import { useCallback, useEffect, useState } from "react";
import { WEEKDAY_OPTIONS } from "@/lib/weekdays";

interface DoctorRow {
  id: number;
  fullName: string;
  qualification: string | null;
  specialization: string | null;
  departmentId: number | null;
  experienceYears: number | null;
  bio: string | null;
  photoUrl: string | null;
  consultationFee: number | null;
  availableDays: string;
  morningFrom: string;
  morningTo: string;
  eveningFrom: string | null;
  eveningTo: string | null;
  slotMinutes: number;
  maxPerSlot: number;
  isActive: boolean;
  isSample: boolean;
  department?: { name: string } | null;
}

interface Dep {
  id: number;
  name: string;
}

const EMPTY_FORM = {
  fullName: "",
  qualification: "",
  specialization: "",
  departmentId: "",
  experienceYears: "",
  bio: "",
  photoUrl: "",
  consultationFee: "",
  availableDays: "1,2,3,4,5",
  morningFrom: "09:00",
  morningTo: "13:00",
  eveningFrom: "",
  eveningTo: "",
  slotMinutes: "30",
  maxPerSlot: "1",
  isActive: true,
  isSample: true,
};

export default function DoctorsManager() {
  const [rows, setRows] = useState<DoctorRow[]>([]);
  const [deps, setDeps] = useState<Dep[]>([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [d, dp] = await Promise.all([
      fetch("/api/admin/doctors").then((r) => r.json()),
      fetch("/api/admin/departments").then((r) => r.json()),
    ]);
    if (d?.ok) setRows(d.data);
    if (dp?.ok) setDeps(dp.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setFieldErrors({});
  }

  function startEdit(d: DoctorRow) {
    setEditingId(d.id);
    setFieldErrors({});
    setForm({
      fullName: d.fullName,
      qualification: d.qualification ?? "",
      specialization: d.specialization ?? "",
      departmentId: d.departmentId ? String(d.departmentId) : "",
      experienceYears: d.experienceYears ? String(d.experienceYears) : "",
      bio: d.bio ?? "",
      photoUrl: d.photoUrl ?? "",
      consultationFee: d.consultationFee ? String(d.consultationFee) : "",
    availableDays: d.availableDays,
      morningFrom: d.morningFrom,
      morningTo: d.morningTo,
      eveningFrom: d.eveningFrom ?? "",
      eveningTo: d.eveningTo ?? "",
      slotMinutes: String(d.slotMinutes),
      maxPerSlot: String(d.maxPerSlot),
      isActive: d.isActive,
      isSample: d.isSample,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setFieldErrors({});
    const body = {
      ...form,
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
      consultationFee: form.consultationFee ? Number(form.consultationFee) : null,
      slotMinutes: Number(form.slotMinutes),
      maxPerSlot: Number(form.maxPerSlot),
    };
    const res = await fetch(editingId ? `/api/admin/doctors/${editingId}` : "/api/admin/doctors", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
      setError(data?.error || "Save failed");
      return;
    }
    setMessage(editingId ? "✅ Doctor updated" : "✅ Doctor added");
    resetForm();
    void load();
  }

  async function remove(d: DoctorRow) {
    if (!confirm(`Deactivate "${d.fullName}"? Past appointments stay safe.`)) return;
    const res = await fetch(`/api/admin/doctors/${d.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      setMessage("Doctor deactivated");
      void load();
    } else setError(data?.message || "Failed");
  }

  const F = (name: string, label: string, node: React.ReactNode, span = "") => (
    <label className={`block ${span}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {node}
      {fieldErrors[name] && <span className="mt-1 block text-xs text-red-600">{fieldErrors[name]}</span>}
    </label>
  );
  const inp = (name: keyof typeof form, type = "text", extra?: Record<string, unknown>) => (
    <input
      className={`field ${fieldErrors[name] ? "field-error" : ""}`}
      type={type}
      value={String(form[name])}
      {...extra}
      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
    />
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Doctors — डॉक्टर प्रबंधन</h1>
        <p className="text-sm text-slate-500">Add/Edit/Delete doctors. Site pe turant update ho jayega.</p>
      </header>

      {/* Form */}
      <form onSubmit={submit} className="card space-y-4">
        <h2 className="font-semibold text-slate-900">{editingId ? `✏️ Edit doctor (ID ${editingId})` : "➕ Add new doctor"}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {F("fullName", "Full Name *", inp("fullName", "text", { placeholder: "Dr. ... (use verified details)" }))}
          {F("qualification", "Qualification", inp("qualification", "text", { placeholder: "MBBS, MD..." }))}
          {F("specialization", "Specialization", inp("specialization", "text"))}
          {F("departmentId", "Department", (
            <select className="field" value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">— none —</option>
              {deps.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          ))}
          {F("experienceYears", "Experience (years)", inp("experienceYears", "number", { min: 0 }))}
          {F("consultationFee", "Consultation fee (₹)", inp("consultationFee", "number", { min: 0 }))}
          {F("photoUrl", "Photo URL (optional)", inp("photoUrl", "text", { placeholder: "https://..." }))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {F("availableDays", "Available days *", (
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_OPTIONS.map((w) => {
                const sel = form.availableDays.split(",").map((x) => x.trim()).includes(String(w.value));
                return (
                  <button type="button" key={w.value}
                    onClick={() => {
                      const parts = form.availableDays.split(",").map((x) => x.trim()).filter(Boolean).map(Number);
                      const next = sel ? parts.filter((p) => p !== w.value) : [...parts, w.value].sort();
                      setForm({ ...form, availableDays: next.join(",") || "0" });
                    }}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${sel ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white"}`}>
                    {w.label}
                  </button>
                );
              })}
            </div>
          ), "sm:col-span-2 lg:col-span-2")}
          {F("slotMinutes", "Slot length (min)", inp("slotMinutes", "number", { min: 5, max: 180 }))}
          {F("maxPerSlot", "Patients per slot", inp("maxPerSlot", "number", { min: 1, max: 20 }))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {F("morningFrom", "Morning OPD from", <input className="field" type="time" value={form.morningFrom} onChange={(e) => setForm({ ...form, morningFrom: e.target.value })} />)}
          {F("morningTo", "Morning OPD to", <input className="field" type="time" value={form.morningTo} onChange={(e) => setForm({ ...form, morningTo: e.target.value })} />)}
          {F("eveningFrom", "Evening OPD from", <input className="field" type="time" value={form.eveningFrom} onChange={(e) => setForm({ ...form, eveningFrom: e.target.value })} />)}
          {F("eveningTo", "Evening OPD to", <input className="field" type="time" value={form.eveningTo} onChange={(e) => setForm({ ...form, eveningTo: e.target.value })} />)}
        </div>
        {F("bio", "Bio / notes", <textarea className="field min-h-16" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />)}

        <div className="flex space-x-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active (show on website)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isSample} onChange={(e) => setForm({ ...form, isSample: e.target.checked })} />
            Mark as SAMPLE (show "replace via admin" badge)
          </label>
        </div>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

        <div className="flex gap-2">
          <button className="btn-primary">{editingId ? "Save changes" : "Add doctor"}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel edit</button>}
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div className="card text-sm text-slate-500">⏳ Loading doctors…</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Doctor</th>
                <th className="px-3 py-2.5">Department</th>
                <th className="px-3 py-2.5">Schedule</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => (
                <tr key={d.id} className={`align-top ${!d.isActive ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-800">{d.fullName}</p>
                    <p className="text-xs text-slate-500">{[d.qualification, d.specialization].filter(Boolean).join(" · ")}</p>
                    {d.isSample && <span className="badge-sample mt-1">Sample</span>}
                  </td>
                  <td className="px-3 py-2.5">{deps.find((x) => x.id === d.departmentId)?.name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs">
                    <p>{d.availableDays} · {d.morningFrom}–{d.morningTo}{d.eveningFrom ? ` / ${d.eveningFrom}–${d.eveningTo}` : ""}</p>
                    <p className="text-slate-400">{d.slotMinutes} min · {d.maxPerSlot}/slot{d.consultationFee ? ` · ₹${d.consultationFee}` : ""}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${d.isActive ? "bg-green-100 text-green-800" : "bg-slate-200"}`}>
                      {d.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1.5">
                      <button onClick={() => startEdit(d)} className="btn-secondary btn-sm">✏️ Edit</button>
                      {d.isActive && <button onClick={() => remove(d)} className="btn-danger btn-sm">🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
