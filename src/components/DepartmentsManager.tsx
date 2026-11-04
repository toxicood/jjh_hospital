"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface DepRow {
  id: number;
  name: string;
  nameHi: string | null;
  slug: string;
  description: string | null;
  descriptionHi: string | null;
  icon: string | null;
  highlightDays: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { doctors: number };
}

const EMPTY = { name: "", nameHi: "", slug: "", description: "", descriptionHi: "", icon: "", highlightDays: "", sortOrder: "0", isActive: true };

export default function DepartmentsManager() {
  const [rows, setRows] = useState<DepRow[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/departments");
    const data = await res.json().catch(() => null);
    if (data?.ok) setRows(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setFieldErrors({});
    const body = { ...form, sortOrder: Number(form.sortOrder) };
    const res = await fetch(editingId ? `/api/admin/departments/${editingId}` : "/api/admin/departments", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
      setError(data?.message || data?.error || "Save failed");
      return;
    }
    setMessage(`✅ ${editingId ? "Updated" : "Added"} department`);
    setForm({ ...EMPTY });
    setEditingId(null);
    void load();
  }

  async function remove(d: DepRow) {
    const res = await fetch(`/api/admin/departments/${d.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      setMessage("Department deleted");
    } else setError(data?.message || "Delete failed");
    void load();
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  }

  const fe = (k: string) => fieldErrors[k] ? "field-error" : "";
  const errLine = (k: string) => fieldErrors[k] ? <span className="mt-1 block text-xs text-red-600">{fieldErrors[k]}</span> : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Departments — विभाग प्रबंधन</h1>
        <p className="text-sm text-slate-500">Website ke Departments page aur booking form mein turant change dikhega.</p>
      </header>

      <form onSubmit={submit} className="card space-y-4">
        <h2 className="font-semibold">{editingId ? `✏️ Edit department (ID ${editingId})` : "➕ Add department"}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Name (English) *</span>
            <input className={`field ${fe("name")}`} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : slugify(e.target.value) })}
              required />
            {errLine("name")}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">नाम (Hindi)</span>
            <input className={`field ${fe("nameHi")}`} value={form.nameHi} onChange={(e) => setForm({ ...form, nameHi: e.target.value })} />
            {errLine("nameHi")}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Slug (URL) *</span>
            <input className={`field ${fe("slug")}`} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            {errLine("slug")}
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Description (English)</span>
            <textarea className={`field min-h-16 ${fe("description")}`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {errLine("description")}
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">विवरण (Hindi)</span>
            <textarea className={`field min-h-16 ${fe("descriptionHi")}`} value={form.descriptionHi} onChange={(e) => setForm({ ...form, descriptionHi: e.target.value })} />
            {errLine("descriptionHi")}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Icon (emoji)</span>
            <input className={`field ${fe("icon")}`} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🏥" />
            {errLine("icon")}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Highlight line (e.g. Open 24×7)</span>
            <input className={`field ${fe("highlightDays")}`} value={form.highlightDays} onChange={(e) => setForm({ ...form, highlightDays: e.target.value })} />
            {errLine("highlightDays")}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Sort order</span>
            <input className={`field ${fe("sortOrder")}`} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            {errLine("sortOrder")}
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active (visible)
          </label>
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        <div className="flex gap-2">
          <button className="btn-primary">{editingId ? "Save changes" : "Add department"}</button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={() => { setForm({ ...EMPTY }); setEditingId(null); }}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="card text-sm text-slate-500">⏳ Loading…</div>
      ) : (
        <div className="space-y-2">
          {rows.map((d) => (
            <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">{d.icon} {d.name} {d.nameHi ? <span className="text-sm font-normal text-slate-500">({d.nameHi})</span> : null}</p>
                <p className="truncate text-xs text-slate-500">/{d.slug} · {d._count?.doctors ?? 0} doctors · order {d.sortOrder}{d.isActive ? " · active" : " · HIDDEN"}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    setEditingId(d.id);
                    setForm({
                      name: d.name,
                      nameHi: d.nameHi ?? "",
                      slug: d.slug,
                      description: d.description ?? "",
                      descriptionHi: d.descriptionHi ?? "",
                      icon: d.icon ?? "",
                      highlightDays: d.highlightDays ?? "",
                      sortOrder: String(d.sortOrder),
                      isActive: d.isActive,
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  ✏️ Edit
                </button>
                <button className="btn-danger btn-sm" onClick={() => remove(d)}>🗑️</button>
                <Link href={`/departments#${d.slug}`} className="btn-secondary btn-sm">👁️ View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
