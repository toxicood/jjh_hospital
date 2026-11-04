export const metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="container-x max-w-3xl py-10">
      <p className="section-sub">Legal · नियम</p>
      <h1 className="section-title">Privacy Policy</h1>
      <div className="card mt-6 space-y-4 text-sm leading-relaxed text-slate-700">
        <p><b>Jeevan Jyoti Hospital, Sirsa</b> ("the hospital") respects your privacy. This policy explains what information the website collects and how it is protected.</p>
        <h2 className="font-bold text-slate-900">1. What we collect</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Appointment details you enter: name, mobile number, optional email, age, gender, department/doctor choice, and an optional brief problem description.</li>
          <li>Account details if you register: mobile number and a securely hashed password (passwords are never stored in readable form).</li>
          <li>Contact form messages you send us.</li>
        </ul>
        <h2 className="font-bold text-slate-900">2. How we use it</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>To schedule, confirm, reschedule or cancel appointments.</li>
          <li>To send you status notifications (SMS/WhatsApp/Email when configured).</li>
          <li>To respond to your queries.</li>
        </ul>
        <h2 className="font-bold text-slate-900">3. What we never do</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>We do not sell or share your personal/medical information with marketers or third parties for advertising.</li>
          <li>We do not display patient information publicly.</li>
        </ul>
        <h2 className="font-bold text-slate-900">4. Security</h2>
        <p>Passwords are hashed (bcrypt) and sessions use secure httpOnly cookies. Access to records is limited to authorized hospital staff. Applicable Indian data-protection and healthcare privacy requirements are observed.</p>
        <h2 className="font-bold text-slate-900">5. Your rights</h2>
        <p>You can request correction or deletion of your records by contacting the hospital (Contact page).</p>
        <p className="text-xs text-slate-500">This template policy should be reviewed/updated by the hospital management and legal advisor before production use.</p>
      </div>
    </div>
  );
}
