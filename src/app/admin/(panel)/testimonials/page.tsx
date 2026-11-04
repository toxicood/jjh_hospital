import ContentManager from "@/components/ContentManager";

export const metadata = { title: "Manage Testimonials" };

export default function AdminTestimonialsPage() {
  return (
    <ContentManager
      module="testimonials"
      title="Patient Testimonials — मरीज़ों की राय"
      subtitle="Add only verified feedback with patient consent. Mark sample ones clearly."
      titleKey="patientName"
      fields={[
        { key: "patientName", label: "Patient name", required: true },
        { key: "city", label: "City" },
        { key: "rating", label: "Rating (1-5)", type: "number" },
        { key: "message", label: "Feedback text", type: "textarea", required: true, full: true },
        { key: "isSample", label: "Mark as SAMPLE (demo content)", type: "checkbox" },
        { key: "isActive", label: "Active (visible on site)", type: "checkbox" },
      ]}
    />
  );
}
