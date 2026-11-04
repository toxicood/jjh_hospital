import StatusChecker from "@/components/StatusChecker";

export const metadata = { title: "Check Appointment Status" };

export default function CheckStatusPage() {
  return (
    <div className="container-x py-10">
      <p className="section-sub">Self Service · अपनी बुकिंग देखें</p>
      <h1 className="section-title">Check Appointment Status</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Enter your Appointment ID and the mobile number you booked with.
        अपनी Appointment ID और बुकिंग के समय दिया गया मोबाइल नंबर डालें।
      </p>
      <div className="mt-6">
        <StatusChecker />
      </div>
    </div>
  );
}
