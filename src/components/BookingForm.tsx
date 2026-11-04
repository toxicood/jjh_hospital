"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export interface BookingOption {
  id: number;
  name: string;
  icon?: string;
  departmentId?: number;
  description?: string;
  isSample?: boolean;
  availableDays?: string; // "1,3,5"
  opdTiming?: string; // "09:00–13:00 & ..."
}

interface SlotResult {
  slots: { time: string; remaining: number }[];
}

interface Result {
  apptCode: string;
}

const GENDERS = [
  { value: "MALE", label: "Male / पुरुष" },
  { value: "FEMALE", label: "Female / महिला" },
  { value: "OTHER", label: "Other / अन्य" },
];

export default function BookingForm({
  departments,
  doctors,
  preDoctorId,
  preDepartmentId,
}: {
  departments: BookingOption[];
  doctors: BookingOption[];
  preDoctorId?: number;
  preDepartmentId?: number;
}) {
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    age: "",
    gender: "",
    departmentId: preDepartmentId ? String(preDepartmentId) : "",
    doctorId: preDoctorId ? String(preDoctorId) : "",
    date: "",
    time: "",
    problemDescription: "",
  });
  const [slots, setSlots] = useState<SlotResult["slots"]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const filteredDoctors = useMemo(
    () =>
      form.departmentId
        ? doctors.filter((d) => d.departmentId?.toString() === form.departmentId)
        : doctors,
    [doctors, form.departmentId],
  );

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === Number(form.doctorId)),
    [doctors, form.doctorId],
  );

  const dayNames = (csv?: string) => {
    if (!csv) return "";
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return csv
      .split(",")
      .map((x) => labels[parseInt(x.trim(), 10)])
      .filter(Boolean)
      .join(", ");
  };

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const maxKey = () => {
    const d = new Date(Date.now() + 45 * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  /** Next available dates (upcoming, max `limit`) based on the doctor's OPD days. */
  const nextAvailableDates = useMemo(() => {
    if (!selectedDoctor?.availableDays) return [];
    const days = selectedDoctor.availableDays.split(",").map((x) => parseInt(x.trim(), 10)).filter((n) => !Number.isNaN(n));
    const out: { key: string; label: string }[] = [];
    const base = new Date();
    for (let i = 0; i < 45 && out.length < 4; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      if (!days.includes(d.getDay())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", weekday: "short" });
      out.push({ key, label });
    }
    return out;
  }, [selectedDoctor]);

  useEffect(() => {
    if (form.departmentId && form.doctorId && !filteredDoctors.some((d) => d.id === Number(form.doctorId))) {
      setForm((f) => ({ ...f, doctorId: "" }));
    }
  }, [form.departmentId, form.doctorId, filteredDoctors]);

  // Load slots whenever doctor+date changes
  useEffect(() => {
    if (!form.doctorId || !form.date) {
      setSlots([]);
      return;
    }
    let live = true;
    setSlotsLoading(true);
    fetch(`/api/slots?doctorId=${form.doctorId}&date=${form.date}`)
      .then((r) => r.json())
      .then((d) => live && setSlots(d.data?.slots ?? []))
      .catch(() => live && setSlots([]))
      .finally(() => live && setSlotsLoading(false));
    return () => {
      live = false;
    };
  }, [form.doctorId, form.date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (!form.time) {
      setFieldErrors({ time: "पहले ऊपर उपलब्ध समय (time slot) चुनें / pick a time slot first" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          email: form.email || undefined,
          problemDescription: form.problemDescription || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setError(
          data.error === "VALIDATION_FAILED"
            ? "फ़ॉर्म में कुछ जानकारी ठीक नहीं है — लाल निशान वाले फ़ील्ड देखें और सुधारें। / Some fields need correction — see the red marks."
            : data.message || data.error || "Booking failed — please try again",
        );
        return;
      }
      setResult(data.data);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="card max-w-xl animate-fade-up border-brand-200 bg-brand-50/60">
        <div className="text-4xl">🎉</div>
        <h2 className="mt-2 text-xl font-bold text-brand-800">Appointment booked!</h2>
        <p className="text-sm text-slate-600">आपकी बुकिंग सफल रही — नीचे आपकी Appointment ID सहेज लें।</p>
        <div className="mt-4 rounded-xl border border-brand-200 bg-white p-4">
          <p className="text-xs text-slate-500">Appointment ID</p>
          <p className="text-2xl font-black tracking-wider text-brand-700">{result.apptCode}</p>
          <dl className="mt-3 grid gap-1 text-sm text-slate-700">
            <div><dt className="inline font-semibold">Name: </dt><dd className="inline">{form.fullName}</dd></div>
            <div><dt className="inline font-semibold">Date: </dt><dd className="inline">{form.date}</dd></div>
            <div><dt className="inline font-semibold">Time: </dt><dd className="inline">{form.time} (IST)</dd></div>
            <div><dt className="inline font-semibold">Status: </dt><dd className="inline font-semibold text-amber-600">Pending confirmation</dd></div>
          </dl>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Status stays <b>Pending</b> until hospital staff confirms it. Notifications (WhatsApp/SMS/Email) are sent when configured by the hospital.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/check-status" className="btn-primary btn-sm">Check status →</Link>
          <Link href="/patient/register" className="btn-secondary btn-sm">Register to manage bookings →</Link>
          <button
            onClick={() => {
              setResult(null);
              setForm((f) => ({ ...f, date: "", time: "" }));
            }}
            className="btn-secondary btn-sm"
          >
            Book another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card max-w-3xl space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name / पूरा नाम *" error={fieldErrors.fullName}>
          <input className={`field ${fieldErrors.fullName ? "field-error" : ""}`} value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Ramesh Kumar" required />
        </Field>
        <Field label="Mobile Number / मोबाइल *" error={fieldErrors.mobile}>
          <input className={`field ${fieldErrors.mobile ? "field-error" : ""}`} value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="10-digit mobile" inputMode="numeric" required />
        </Field>
        <Field label="Email (optional / वैकल्पिक)" error={fieldErrors.email}>
          <input className={`field ${fieldErrors.email ? "field-error" : ""}`} type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@email.com" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Age / उम्र *" error={fieldErrors.age}>
            <input className={`field ${fieldErrors.age ? "field-error" : ""}`} type="number" min={0} max={120} value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })} required />
          </Field>
          <Field label="Gender / लिंग *" error={fieldErrors.gender}>
            <select className={`field ${fieldErrors.gender ? "field-error" : ""}`} value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
              <option value="">— Select —</option>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Department / विभाग *" error={fieldErrors.departmentId}>
          <select className={`field ${fieldErrors.departmentId ? "field-error" : ""}`} value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value, time: "" })} required>
            <option value="">— Select department —</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
          </select>
        </Field>
        <Field label="Doctor / डॉक्टर *" error={fieldErrors.doctorId}>
          <select className={`field ${fieldErrors.doctorId ? "field-error" : ""}`} value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value, time: "" })} required>
            <option value="">— Select doctor —</option>
            {filteredDoctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}{d.description ? ` (${d.description})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date / तारीख़ *" error={fieldErrors.date}>
          <input className={`field ${fieldErrors.date ? "field-error" : ""}`} type="date" value={form.date}
            min={todayKey()}
            max={maxKey()}
            onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })} required
            disabled={!form.doctorId} />
          {selectedDoctor?.availableDays && (
            <>
              <span className="mt-1 block text-xs text-slate-500">
                👨‍⚕️ {selectedDoctor.name} की OPD: <b>{dayNames(selectedDoctor.availableDays)}</b>
                {selectedDoctor.opdTiming ? ` · ${selectedDoctor.opdTiming}` : ""} — इन्हीं दिनों की तारीख़ चुनें
              </span>
              {nextAvailableDates.length > 0 && (
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400">आगामी उपलब्ध:</span>
                  {nextAvailableDates.map((d) => (
                    <button
                      type="button"
                      key={d.key}
                      onClick={() => setForm((f) => ({ ...f, date: d.key, time: "" }))}
                      className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                        form.date === d.key ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white hover:border-brand-400"
                      }`}
                    >
                      📅 {d.label}
                    </button>
                  ))}
                </span>
              )}
            </>
          )}
        </Field>
        <Field label="Time Slot / समय *" error={fieldErrors.time}>
          {slotsLoading ? (
            <div className="field flex items-center gap-2">⏳ Checking availability…</div>
          ) : slots.length === 0 ? (
            <div className="field">
              {form.doctorId && form.date ? (
                <>
                  ❌ No slots available for this doctor/date — pick another date.
                  <br />
                  {selectedDoctor?.availableDays && (
                    <span className="text-xs text-slate-500">
                      इस डॉक्टर के OPD दिन: <b>{dayNames(selectedDoctor.availableDays)}</b> — उन्हीं दिनों की तारीख़ चुनें।
                    </span>
                  )}
                </>
              ) : (
                "Select doctor and date first"
              )}
            </div>
          ) : (
            <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-5">
              {slots.map((s) => (
                <button type="button" key={s.time}
                  onClick={() => setForm({ ...form, time: s.time })}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    form.time === s.time
                      ? "border-brand-600 bg-brand-600 text-white"
                      : s.remaining > 0
                        ? "border-slate-200 bg-white hover:border-brand-400"
                        : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                  }`}
                  disabled={s.remaining <= 0}>
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </Field>
      </div>

      <Field label="Problem Description / समस्या का विवरण" error={fieldErrors.problemDescription}>
        <textarea className="field min-h-20" value={form.problemDescription}
          onChange={(e) => setForm({ ...form, problemDescription: e.target.value })}
          placeholder="Briefly describe your problem (optional; do not include sensitive medical details here)" />
      </Field>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error === "SLOT_TAKEN" ? "⚠️ This slot was just booked by someone else — pick another slot." : error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "⏳ Submitting…" : "✅ Submit Appointment Booking ⸻ बुकिंग पूरी करें"}
        </button>
        <p className="text-xs text-slate-500">
          By submitting you agree to the <Link className="underline" href="/cancellation-policy">appointment policy</Link>.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
