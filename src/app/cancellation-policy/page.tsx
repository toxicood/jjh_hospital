import Link from "next/link";
import { getSettings, setting } from "@/lib/site";

export const metadata = { title: "Cancellation Policy" };

export default async function CancellationPolicyPage() {
  const s = await getSettings();
  return (
    <div className="container-x max-w-3xl py-10">
      <p className="section-sub">Policy · नीति</p>
      <h1 className="section-title">Appointment Cancellation Policy</h1>
      <div className="card mt-6 space-y-4 text-sm leading-relaxed text-slate-700">
        <p>{setting(s, "CANCELLATION_POLICY")}</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Patients can cancel from their dashboard (Patient → Dashboard → Cancel), subject to the policy above.</li>
          <li>मरीज़ अपने डैशबोर्ड से या हॉस्पिटल कॉल करके बुकिंग रद्द कर सकते हैं।</li>
          <li>Cancelled time slots become available again for other patients automatically.</li>
          <li>Emergency care never depends on appointments.</li>
        </ul>
        <p className="text-slate-500">This page text is editable in Admin → Site Content. Last update shown on site footer.</p>
      </div>
      <div className="mt-6 flex gap-3">
        <Link href="/book" className="btn-primary">Book Appointment</Link>
        <Link href="/check-status" className="btn-secondary">Check My Appointment</Link>
      </div>
    </div>
  );
}
