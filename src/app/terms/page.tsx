export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <div className="container-x max-w-3xl py-10">
      <p className="section-sub">Legal · नियम</p>
      <h1 className="section-title">Terms & Conditions</h1>
      <div className="card mt-6 space-y-4 text-sm leading-relaxed text-slate-700">
        <h2 className="font-bold text-slate-900">1. Use of this website</h2>
        <p>The online appointment system is a convenience facility. Booking confirmation depends on availability and hospital approval; the hospital may reschedule or cancel a slot when medically necessary or due to emergency circumstances.</p>
        <h2 className="font-bold text-slate-900">2. Information accuracy</h2>
        <p>Patients must provide accurate contact details. Marked "Sample" content is placeholder data being replaced by verified hospital information; it should not be treated as medical advice. Always confirm timings, fees and doctor availability directly with the hospital.</p>
        <h2 className="font-bold text-slate-900">3. Not for emergencies</h2>
        <p>This website is not for emergencies. In an emergency call the hospital helpline or go directly to the hospital.</p>
        <h2 className="font-bold text-slate-900">4. Responsibility</h2>
        <p>The hospital is not liable for missed appointments caused by wrong contact numbers or non-confirmation of pending bookings. Patients should check status via the Check Status page or dashboard.</p>
        <h2 className="font-bold text-slate-900">5. Changes</h2>
        <p>The hospital may update these terms and fees/timings from time to time as per its policy.</p>
        <p className="text-xs text-slate-500">Template terms — review by the hospital management before production use.</p>
      </div>
    </div>
  );
}
