import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings, setting } from "@/lib/site";

export const metadata = { title: "About Us" };

export default async function AboutPage() {
  const [settings, gallery, departments, doctors] = await Promise.all([
    getSettings(),
    prisma.galleryImage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
    prisma.service.findMany({ where: { isActive: true, category: "FACILITY" }, orderBy: { sortOrder: "asc" } }),
    prisma.doctor.count({ where: { isActive: true } }),
  ]);

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-700 to-brand-500 py-12 text-white">
        <div className="container-x">
          <p className="text-sm font-semibold text-white/80">About Us · परिचय</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{setting(settings, "HOSPITAL_NAME", "Jeevan Jyoti Hospital")}, Sirsa</h1>
          <p className="mt-2 max-w-2xl text-white/90">{setting(settings, "TAGLINE", "Care with Compassion")} — {setting(settings, "TAGLINE_HI", "सेवा के साथ संवेदना")}</p>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <p className="text-sm/relaxed text-slate-700">{setting(settings, "HOME_ABOUT")}</p>
            <p className="text-sm/relaxed text-slate-600 hi-line">{setting(settings, "HOME_ABOUT_HI")}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card border-brand-100">
                <h2 className="font-bold text-brand-700">🎯 Our Mission / हमारा लक्ष्य</h2>
                <p className="mt-2 text-sm text-slate-600">
                  To provide accessible, affordable and quality healthcare to every family in Sirsa and surrounding
                  villages. (Sample text — administration will update.)
                </p>
              </div>
              <div className="card border-brand-100">
                <h2 className="font-bold text-brand-700">🔭 Our Vision / हमारी दृष्टि</h2>
                <p className="mt-2 text-sm text-slate-600">
                  To become the region's most trusted multispecialty hospital where technology meets compassion.
                  (Sample text — administration will update.)
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-bold text-slate-900">Quick facts</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>👨‍⚕️ Active doctor profiles listed: <b>{doctors}</b></li>
              <li>🚑 Emergency: <b>{setting(settings, "EMERGENCY_PHONE")}</b></li>
              <li>⏰ OPD: {setting(settings, "OPD_TIMING")}</li>
              <li>📍 {setting(settings, "ADDRESS")}</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">{setting(settings, "DISCLAIMER", "")}</p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="container-x">
          <h2 className="section-title">Facilities & Infrastructure</h2>
          <p className="mt-1 text-sm text-slate-500">सुविधाएँ एवं संरचना (editable from admin)</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {departments.map((f) => (
              <div key={f.id} className="card">
                <div className="text-2xl">{f.icon || "🏥"}</div>
                <h3 className="mt-2 font-semibold">{f.title}</h3>
                {f.titleHi && <p className="text-xs text-slate-500">{f.titleHi}</p>}
                {f.description && <p className="mt-1 text-xs text-slate-500">{f.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-12">
        <h2 className="section-title">Gallery — चित्रों में हमारा अस्पताल</h2>
        {gallery.length === 0 ? (
          <div className="card mt-6 text-sm text-slate-500">
            No photos added yet. Hospital administration can upload via Admin → Gallery (image URL based).
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((g) => (
              <figure key={g.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {/* Admin-provided URLs only */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.imageUrl} alt={g.title || "Hospital photo"} className="h-40 w-full object-cover" loading="lazy" />
                <figcaption className="px-3 py-2 text-xs text-slate-500">{g.caption ?? g.title}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="bg-brand-50 py-10">
        <div className="container-x flex flex-wrap items-center justify-between gap-4">
          <p className="font-semibold text-brand-900">जीवन ज्योति — आपको घर बुला रहा है</p>
          <div className="flex gap-3">
            <Link href="/book" className="btn-primary">Book Appointment</Link>
            <Link href="/contact" className="btn-secondary">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
