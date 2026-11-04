import ContentManager from "@/components/ContentManager";

export const metadata = { title: "Manage Services" };

export default function AdminServicesPage() {
  return (
    <ContentManager
      module="services"
      title="Hospital Services & Facilities — सुविधाएँ संपादित करें"
      subtitle="FACILITY items appear as 'Hospital Facilities', WHY_US items as 'Why Choose Us' on the home page."
      titleKey="title"
      fields={[
        { key: "title", label: "Title (English)", required: true },
        { key: "titleHi", label: "Title (Hindi / हिंदी)" },
        { key: "description", label: "Description", type: "textarea", full: true },
        { key: "descriptionHi", label: "Description (Hindi)", type: "textarea", full: true },
        { key: "icon", label: "Icon (emoji e.g. 🚑)" },
        {
          key: "category", label: "Category", type: "select", required: true,
          options: [
            { value: "FACILITY", label: "Facility (features list)" },
            { value: "WHY_US", label: "Why Choose Us" },
          ],
        },
        { key: "sortOrder", label: "Sort order", type: "number" },
        { key: "isActive", label: "Active (visible on site)", type: "checkbox" },
      ]}
    />
  );
}
