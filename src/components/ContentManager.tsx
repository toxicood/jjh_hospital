"use client";

import { useCallback, useEffect, useState } from "react";

type FieldType = "text" | "textarea" | "number" | "checkbox" | "select";
interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  full?: boolean;
}

interface Row {
  id: number;
  [key: string]: unknown;
}

/**
 * Generic CRUD manager for simple content modules (services / gallery / testimonials).
 * Talks to /api/admin/content/[module] & /api/admin/content/[module]/[id].
 */
export default function ContentManager({
  module,
  title,
  subtitle,
  fields,
  titleKey,
}: {
  module: string;
  title: string;
  subtitle: string;
  fields: FieldDef[];
  titleKey: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/content/${module}`);
    const data = await res.json().catch(() => null);
    if (data?.ok) setRows(data.data);
    setLoading(false);
  }, [module]);

  useEffect(() => {
    void load();
  }, [load]);

  function reset() {
    setForm({});
    setEditingId(null);
    setFieldErrors({});
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setFieldErrors({});
    const res = await fetch(editingId ? `/api/admin/content/${module}/${editingId}` : `/api/admin/content/${module}`, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
      setError(data?.error || data?.message || "Save failed");
      return;
    }
    setMessage(`✅ ${editingId ? "Updated" : "Added"} successfully`);
    reset();
    void load();
  }

  async function remove(row: Row) {
    if (!confirm("Delete this item permanently?")) return;
    const res = await fetch(`/api/admin/content/${module}/${row.id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Deleted");
      void load();
    } else setError("Delete failed (item may be in use)");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </header>

      <form onSubmit={submit} className="card space-y-4">
        <h2 className="font-semibold">{editingId ? "✏️ Edit item" : "➕ Add new item"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={f.key} className={`block ${f.full ? "sm:col-span-2" : ""}`}>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">{f.label}{f.required ? " *" : ""}</span>
              {f.type === "textarea" ? (
                <textarea
                  className={`field min-h-16 ${fieldErrors[f.key] ? "field-error" : ""}`}
                  value={String(form[f.key] ?? "")}
                  required={f.required}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              ) : f.type === "select" ? (
                <select
                  className={`field ${fieldErrors[f.key] ? "field-error" : ""}`}
                  value={String(form[f.key] ?? "")}
                  required={f.required}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                >
                  <option value="">— select —</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === "checkbox" ? (
                <input type="checkbox" checked={Boolean(form[f.key] ?? true)} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} className="h-4 w-4" />
              ) : (
                <input
                  className={`field ${fieldErrors[f.key] ? "field-error" : ""}`}
                  type={f.type === "number" ? "number" : "text"}
                  value={String(form[f.key] ?? "")}
                  required={f.required}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
              {fieldErrors[f.key] && <span className="mt-1 block text-xs text-red-600">{fieldErrors[f.key]}</span>}
            </label>
          ))}
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        <div className="flex gap-2">
          <button className="btn-primary">{editingId ? "Save changes" : "Add"}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={reset}>Cancel edit</button>}
        </div>
      </form>

      {loading ? (
        <div className="card text-sm text-slate-500">⏳ Loading…</div>
      ) : (
        <div className="space-y-2">
          {rows.length === 0 && <div className="card text-sm text-slate-500">No items yet.</div>}
          {rows.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">{String(r[titleKey] ?? `(item ${r.id})`)}</p>
                {"isActive" in r && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${r.isActive ? "bg-green-100 text-green-800" : "bg-slate-200"}`}>
                    {r.isActive ? "Active" : "Hidden"}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    const f: Record<string, string | boolean> = {};
                    for (const def of fields) {
                      const v = r[def.key];
                      f[def.key] = def.type === "checkbox" ? Boolean(v) : v === null || v === undefined ? "" : String(v);
                    }
                    setForm(f);
                    setEditingId(r.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  ✏️ Edit
                </button>
                <button className="btn-danger btn-sm" onClick={() => remove(r)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
