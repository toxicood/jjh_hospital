import Link from "next/link";
import { getSettings, setting } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <FooterInfo />
        <QuickLinks />
        <FaqLinks />
        <FooterContact />
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Jeevan Jyoti Hospital, Sirsa. All rights reserved.</p>
        <p className="mt-1 flex flex-wrap justify-center gap-x-3">
          <Link className="hover:text-white" href="/privacy-policy">Privacy Policy</Link>
          <Link className="hover:text-white" href="/terms">Terms & Conditions</Link>
          <Link className="hover:text-white" href="/cancellation-policy">Cancellation Policy</Link>
        </p>
      </div>
    </footer>
  );
}

function FooterInfo() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-black text-white">J</span>
        <span className="text-base font-bold text-white">Jeevan Jyoti Hospital</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed">हमारा लक्ष्य — हर मरीज़ को सम्मान और गुणवत्ता वाली स्वास्थ्य सेवा। (Quality healthcare with compassion.)</p>
    </div>
  );
}

function QuickLinks() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold tracking-wide text-white uppercase">Quick Links</h3>
      <ul className="space-y-2 text-sm">
        <li><Link className="hover:text-white" href="/doctors">Our Doctors</Link></li>
        <li><Link className="hover:text-white" href="/book">Book Appointment</Link></li>
        <li><Link className="hover:text-white" href="/check-status">Check Appointment Status</Link></li>
        <li><Link className="hover:text-white" href="/patient/login">Patient Login</Link></li>
        <li><Link className="hover:text-white" href="/patient/register">New Patient Registration</Link></li>
        <li><Link className="hover:text-white" href="/admin/login">Staff / Admin Login</Link></li>
      </ul>
    </div>
  );
}

function FaqLinks() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold tracking-wide text-white uppercase">Information</h3>
      <ul className="space-y-2 text-sm">
        <li><Link className="hover:text-white" href="/faq">FAQs</Link></li>
        <li><Link className="hover:text-white" href="/about">About Hospital</Link></li>
        <li><Link className="hover:text-white" href="/departments">Departments & Services</Link></li>
        <li><Link className="hover:text-white" href="/cancellation-policy">Appointment Policy</Link></li>
      </ul>
    </div>
  );
}

async function FooterContact() {
  const s = await getSettings();
  const emergency = setting(s, "EMERGENCY_PHONE");
  const address = setting(s, "ADDRESS");
  return (
    <div className="text-sm">
      <h3 className="mb-3 text-sm font-bold tracking-wide text-white uppercase">Contact</h3>
      <ul className="space-y-2">
        <li>📍 {address}</li>
        <li>🚨 Emergency: <span className="font-semibold text-white">{emergency}</span></li>
        <li>⏰ OPD: {setting(s, "OPD_TIMING")}</li>
      </ul>
    </div>
  );
}
