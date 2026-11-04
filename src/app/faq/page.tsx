import { getSettings } from "@/lib/site";

export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const settings = await getSettings();
  const faqs: { q: string; a: string }[] = [];
  for (let i = 1; i <= 10; i++) {
    const q = settings[`FAQ_${i}_Q`];
    const a = settings[`FAQ_${i}_A`];
    if (q && a) faqs.push({ q, a });
  }

  return (
    <div className="container-x py-10">
      <p className="section-sub">FAQ · सामान्य सवाल</p>
      <h1 className="section-title">Frequently Asked Questions</h1>
      <p className="mt-1 text-sm text-slate-600">नीचे सामान्य प्रश्नों के उत्तर पढ़ें — और सवाल हो तो Contact page से पूछें।</p>
      <div className="mt-8 space-y-3">
        {faqs.length === 0 && <div className="card text-sm text-slate-500">FAQs will be published by the hospital administration.</div>}
        {faqs.map((f, i) => (
          <details key={i} className="card">
            <summary className="cursor-pointer font-semibold text-slate-800">{f.q}</summary>
            <p className="mt-2 text-sm text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
