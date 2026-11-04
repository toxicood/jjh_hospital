import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings, setting } from "@/lib/site";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const [settings, departments, doctors, services, testimonials] = await Promise.all([
    getSettings(),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
    prisma.doctor.findMany({ where: { isActive: true }, include: { department: true }, take: 6 }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  const facilities = services.filter((s) => s.category === "FACILITY");
  const whyUs = services.filter((s) => s.category === "WHY_US");
  const emergency = setting(settings, "EMERGENCY_PHONE");
  const mapQuery = encodeURIComponent(setting(settings, "MAP_QUERY", "Jeevan Jyoti Hospital Sirsa"));

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="container-x grid gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              🏥 {setting(settings, "HOSPITAL_NAME_HI", "जीवन ज्योति हॉस्पिटल")} · सिरसा, हरियाणा
            </p>
            <h1 className="mt-4 text-3xl leading-tight font-extrabold sm:text-4xl lg:text-5xl">
              Care with Compassion,
              <span className="block text-white/90 text-2xl sm:text-3xl lg:text-4xl font-bold mt-1">
                स्वास्थ्य की ज़िम्मेदारी, प्यार से
              </span>
            </h1>
            <p className="mt-4 max-w-prose text-sm/relaxed text-white/90 sm:text-base">
              Book OPD appointments online, avoid waiting room queues, and check your appointment
              status anytime. Emergency services follow the hospital's official availability.
            </p>
            <p className="mt-1 text-sm text-white/75">{setting(settings, "BANNER_NOTICE_HI", "")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/book" className="btn bg-white text-brand-700 hover:bg-brand-50">
                📅 Book Appointment <span className="text-xs font-normal opacity-80">(अपॉइंटमेंट बुक करें)</span>
              </Link>
              <a href={`tel:${emergency.replace(/[^\d+]/g, "")}`} className="btn border border-white/60 bg-white/10 text-white hover:bg-white/20">
                🚨 Emergency Contact
              </a>
              <Link href="/check-status" className="btn border border-white/40 text-white hover:bg-white/10">
                Check Status
              </Link>
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 text-center">
              <HeroStat label="Online Booking" />
              <HeroStat label="Smart Time Slots" />
              <HeroStat label="Multiple Departments" />
            </dl>
          </div>
          <div className="animate-fade-up flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl bg-white/95 p-6 text-slate-800 shadow-2xl">
              <h2 className="text-lg font-bold text-brand-800">Today at the Hospital</h2>
              <p className="mt-1 text-xs text-slate-500">Indicative information — always call to confirm availability.</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span>⏰</span>
                  <span><b>OPD Timings:</b> {setting(settings, "OPD_TIMING")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span>🚑</span>
                  <span><b>Emergency:</b> {emergency}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span>📍</span>
                  <span>{setting(settings, "ADDRESS")}</span>
                </li>
              </ul>
              <div className="mt-4 rounded-lg bg-brand-50 p-3 text-xs text-brand-800">
                नमूना जानकारी — अस्पताल प्रबंधन Admin panel से इसे अपडेट करेगा।
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="container-x py-14">
        <p className="section-sub">About Us · परिचय</p>
        <h2 className="section-title">{setting(settings, "HOSPITAL_NAME", "Jeevan Jyoti Hospital")}, Sirsa</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <p className="text-sm/relaxed text-slate-600 lg:col-span-2">{setting(settings, "HOME_ABOUT")}</p>
          <p className="text-sm/relaxed text-slate-600 hi-line">{setting(settings, "HOME_ABOUT_HI")}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <Link href="/about" className="btn-secondary">Read more — पूरा परिचय →</Link>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section className="bg-slate-50 py-14">
        <div className="container-x">
          <p className="section-sub">Departments · विभाग</p>
          <h2 className="section-title">Our Medical Departments</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <Link key={d.id} href={`/departments#${d.slug}`} className="card hover:border-brand-300 hover:shadow-md transition-all">
                <div className="text-2xl">{d.icon || "🏥"}</div>
                <h3 className="mt-2 font-semibold text-slate-900">{d.name}</h3>
                {d.nameHi && <p className="text-xs text-slate-500">{d.nameHi}</p>}
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{d.description}</p>
                {d.highlightDays && <p className="mt-2 text-xs font-semibold text-brand-700">{d.highlightDays}</p>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTORS */}
      <section className="container-x py-14">
        <p className="section-sub">Doctors · डॉक्टर</p>
        <h2 className="section-title">Our Expert Doctors</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <div key={doc.id} className="card flex flex-col">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-lg">
                  {doc.fullName.replace(/^Dr\.?\s*/i, "").charAt(0) || "D"}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900 leading-snug">{doc.fullName}</h3>
                  <p className="text-xs text-slate-500">{doc.specialization || doc.department?.name || "—"}</p>
                </div>
              </div>
              <div className="mt-3 flex-1 text-sm text-slate-600 space-y-1">
                {doc.qualification && <p>🎓 {doc.qualification}</p>}
                {doc.experienceYears !== null && doc.experienceYears !== undefined && doc.experienceYears > 0 && (
                  <p>🧑‍⚕️ {doc.experienceYears}+ years experience</p>
                )}
                {doc.consultationFee ? <p>💰 Consultation: ₹{doc.consultationFee}</p> : null}
              </div>
              {doc.isSample && <p className="mt-2"><span className="badge-sample">⚠️ Sample profile — replace via Admin</span></p>}
              <Link href={`/book?doctorId=${doc.id}`} className="btn-primary mt-4">Book Appointment</Link>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/doctors" className="btn-secondary">See all doctors →</Link>
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-brand-50 py-14">
        <div className="container-x">
          <p className="section-sub">Why Choose Us · हमी क्यों?</p>
          <h2 className="section-title">Why Patients Trust Us</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((s) => (
              <div key={s.id} className="card bg-white">
                <div className="text-2xl">{s.icon || "✅"}</div>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                {s.titleHi && <p className="text-xs text-slate-500">{s.titleHi}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FACILITIES */}
      <section className="container-x py-14">
        <p className="section-sub">Facilities · सुविधाएँ</p>
        <h2 className="section-title">Hospital Facilities</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((s) => (
            <div key={s.id} className="card">
              <div className="text-2xl">{s.icon || "🏥"}</div>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              {s.titleHi && <p className="text-xs text-slate-500">{s.titleHi}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="bg-slate-50 py-14">
          <div className="container-x">
            <p className="section-sub">Testimonials · मरीज़ों की राय</p>
            <h2 className="section-title">What Patients Say</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="card">
                  <div className="text-amber-500" aria-label={`${t.rating} stars`}>{"★".repeat(Math.min(5, Math.max(1, t.rating)))}</div>
                  <blockquote className="mt-2 text-sm text-slate-600">“{t.message}”</blockquote>
                  <figcaption className="mt-3 text-sm font-semibold text-slate-800">
                    {t.patientName}
                    {t.city ? <span className="font-normal text-slate-500">, {t.city}</span> : null}
                    {t.isSample && <> <span className="badge-sample ml-1">Sample</span></>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MAP + CONTACT */}
      <section className="container-x py-14">
        <p className="section-sub">Reach Us · हम तक कैसे पहुँचें</p>
        <h2 className="section-title">Find the Hospital</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <iframe
              title="Hospital location map"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-72 w-full rounded-lg border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="card space-y-3 text-sm">
            <p><b>📍 Address:</b> {setting(settings, "ADDRESS")}</p>
            <p><b>🚨 Emergency:</b> {emergency}</p>
            <p><b>⏰ OPD:</b> {setting(settings, "OPD_TIMING")}</p>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/contact" className="btn-secondary">Contact page →</Link>
              <Link href="/book" className="btn-primary">Book Appointment →</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
      <dt className="text-xs text-white/80">{label}</dt>
      <dd className="mt-1 text-[13px] font-bold text-white">Available</dd>
    </div>
  );
}
