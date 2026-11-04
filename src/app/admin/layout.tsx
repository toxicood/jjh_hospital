export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Guarded shell for panel pages lives in (panel) route group.
  return <>{children}</>;
}
