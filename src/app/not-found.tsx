import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl">🩺</div>
      <h1 className="mt-4 text-3xl font-black text-slate-900">404 — Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        The page you are looking for doesn't exist or has moved.
        आपने जो पेज खोजा, वह नहीं मिला — नीचे सही जगह पर चलें।
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">🏠 Home pages जाएँ</Link>
        <Link href="/book" className="btn-secondary">Book Appointment</Link>
        <Link href="/check-status" className="btn-secondary">Check Status</Link>
        <Link href="/contact" className="btn-secondary">Contact</Link>
      </div>
    </div>
  );
}
