"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", en: "Home", hi: "होम" },
  { href: "/about", en: "About", hi: "परिचय" },
  { href: "/departments", en: "Departments", hi: "विभाग" },
  { href: "/doctors", en: "Doctors", hi: "डॉक्टर" },
  { href: "/check-status", en: "Check Status", hi: "स्थिति देखें" },
  { href: "/contact", en: "Contact", hi: "संपर्क" },
  { href: "/faq", en: "FAQ", hi: "सवाल-जवाब" },
];

interface Me {
  role: "ADMIN" | "PATIENT" | null;
  name: string;
}

export default function Header({
  name,
  nameHi,
  emergency,
}: {
  name: string;
  nameHi: string;
  emergency: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me>({ role: null, name: "" });

  useEffect(() => {
    let live = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => live && setMe({ role: d?.role ?? null, name: d?.name ?? "" }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/95 shadow-sm backdrop-blur">
      {/* top strip */}
      <div className="hidden bg-brand-700 text-white sm:block">
        <div className="container-x flex h-8 items-center justify-between text-xs">
          <span className="truncate">{nameHi ? `जीवन ज्योति हॉस्पिटल, सिरसा — आपकी सेवा में हमेशा` : name}</span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              🚨 Emergency: <a className="font-bold hover:underline" href={`tel:${emergency.replace(/[^\d+]/g, "")}`}>{emergency}</a>
            </span>
          </span>
        </div>
      </div>

      <div className="container-x flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-black text-white shadow-md">
            J
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] leading-tight font-bold text-brand-800 sm:text-lg">{name}</span>
            <span className="block truncate text-[11px] text-slate-500">{nameHi} · Sirsa, Haryana</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === n.href ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50 hover:text-brand-700"
              }`}
              title={n.hi}
            >
              {n.en}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {me.role === "ADMIN" && (
            <Link href="/admin" className="btn-secondary btn-sm">Admin Panel</Link>
          )}
          {me.role === "PATIENT" && (
            <Link href="/patient/dashboard" className="btn-secondary btn-sm">My Account ({me.name})</Link>
          )}
          {me.role === null && (
            <Link href="/patient/login" className="btn-secondary btn-sm">Patient Login</Link>
          )}
          <Link href="/book" className="btn-primary btn-sm">Book Appointment</Link>
        </div>

        <button
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 lg:hidden"
        >
          <span className={`h-0.5 w-5 bg-slate-700 transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-slate-700 transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 bg-slate-700 transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <nav className="container-x flex flex-col py-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-50">
                {n.en} <span className="text-xs text-slate-400">/{n.hi}</span>
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t pt-2">
              {me.role !== "ADMIN" && (
                <Link href="/patient/dashboard" className="btn-secondary btn-sm w-full">My Account</Link>
              )}
              <Link href="/book" className="btn-primary btn-sm w-full">Book Appointment</Link>
              <a href={`tel:${emergency.replace(/[^\d+]/g, "")}`} className="btn-danger btn-sm w-full">🚨 Emergency: {emergency}</a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
