import ContentManager from "@/components/ContentManager";

export const metadata = { title: "Manage Gallery" };

export default function AdminGalleryPage() {
  return (
    <ContentManager
      module="gallery"
      title="Photo Gallery — गैलरी"
      subtitle="Paste image URLs (https://...). Images appear in the About page gallery."
      titleKey="title"
      fields={[
        { key: "title", label: "Title" },
        { key: "imageUrl", label: "Image URL", required: true, full: true },
        { key: "caption", label: "Caption" },
        { key: "sortOrder", label: "Sort order", type: "number" },
        { key: "isActive", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
