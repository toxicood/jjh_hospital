import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <AdminShell adminName={session.name}>{children}</AdminShell>;
}
