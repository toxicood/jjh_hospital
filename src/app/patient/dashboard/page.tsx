import { redirect } from "next/navigation";
import { getPatientSession } from "@/lib/auth";
import PatientDashboard from "@/components/PatientDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Dashboard" };

export default async function PatientDashboardPage() {
  const session = await getPatientSession();
  if (!session) redirect("/patient/login");
  return <PatientDashboard patientName={session.name} />;
}
