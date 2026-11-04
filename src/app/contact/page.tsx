import ContactForm from "@/components/ContactForm";
import { getSettings, setting } from "@/lib/site";

export const metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const settings = await getSettings();
  const emergency = setting(settings, "EMERGENCY_PHONE");
  const phone = setting(settings, "PHONE");
  const whatsapp = setting(settings, "WHATSAPP_NUMBER");
  const email = setting(settings, "EMAIL");
  const address = setting(settings, "ADDRESS");
  const mapQuery = encodeURIComponent(setting(settings, "MAP_QUERY", "Jeevan Jyoti Hospital Sirsa"));

  return (
    <div className="container-x py-10">
      <p className="section-sub">Contact · संपर्क</p>
      <h1 className="section-title">Contact the Hospital</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="card space-y-2.5 text-sm">
            <p><b>📍 Address:</b><br />{address}</p>
            <p><b>📞 Phone:</b> {phone}</p>
            <p><b>🚨 Emergency:</b> <a className="font-bold text-red-600" href={`tel:${emergency.replace(/[^\d+]/g, "")}`}>{emergency}</a></p>
            <p><b>✉️ Email:</b> {email}</p>
            <p><b>⏰ OPD:</b> {setting(settings, "OPD_TIMING")}</p>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn bg-green-500 text-white hover:bg-green-600">
                💬 WhatsApp us — व्हाट्सएप करें
              </a>
            )}
          </div>
          <div className="card border-red-200 bg-red-50">
            <p className="font-bold text-red-700">🚨 Emergency cases</p>
            <p className="mt-1 text-sm text-red-700">
              For severe emergencies, do <b>not</b> wait for an online appointment — call {emergency} or come directly.
              गंभीर आपातकाल में सीधे अस्पताल पहुँचें।
            </p>
          </div>
          <div className="card overflow-hidden">
            <iframe
              title="Hospital location map"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-64 w-full rounded-lg border-0"
              loading="lazy"
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
