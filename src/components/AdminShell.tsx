"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

const MENU = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/appointments", label: "Appointments", icon: "📅" },
  { href: "/admin/doctors", label: "Doctors", icon: "👨‍⚕️" },
  { href: "/admin/departments", label: "Departments", icon: "🏥" },
  { href: "/admin/patients", label: "Patients", icon: "🧑‍🤝‍🧑" },
  { href: "/admin/services", label: "Services & Facilities", icon: "🛠️" },
  { href: "/admin/gallery", label: "Gallery", icon: "🖼️" },
  { href: "/admin/testimonials", label: "Testimonials", icon: "⭐" },
  { href: "/admin/content", label: "Site Content", icon: "📝" },
  { href: "/admin/messages", label: "Contact Inbox", icon: "📨" },
  { href: "/admin/alerts", label: "Notification Log", icon: "🔔" },
  { href: "/admin/audit", label: "Audit Log", icon: "🧾" },
];

export default function AdminShell({ adminName, children }: { adminName: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className={`no-print fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-slate-900 text-slate-300 transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-black text-white">J</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">Hospital Admin</p>
            <p className="truncate text-xs text-slate-400">{adminName}</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {MENU.map((m) => {
            const active = pathname === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-brand-600 text-white" : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{m.icon}</span> {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <Link href="/" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-800 hover:text-white">🌐 View Website</Link>
          <button onClick={logout} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-slate-800 hover:text-red-200">⏻ Logout</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <p className="hidden text-sm text-slate-500 lg:block">Jeevan Jyoti Hospital — Management Console</p>
          <div className="flex items-center gap-2">
            <Link href="/admin/appointments" className="btn-primary btn-sm">+ Manage Appointments</Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
