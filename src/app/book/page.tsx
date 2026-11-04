import { prisma } from "@/lib/db";
import BookingForm, { BookingOption } from "@/components/BookingForm";

export const metadata = { title: "Book Appointment" };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string }>;
}) {
  const sp = await searchParams;
  const [departments, doctors] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.doctor.findMany({
      where: { isActive: true },
      include: { department: true },
      orderBy: [{ departmentId: "asc" }, { fullName: "asc" }],
    }),
  ]);

  const deps: BookingOption[] = departments.map((d) => ({ id: d.id, name: d.name, icon: d.icon || "🏥" }));
  const docs: BookingOption[] = doctors.map((d) => ({
    id: d.id,
    name: d.fullName,
    departmentId: d.departmentId ?? undefined,
    description: [d.qualification, d.specialization].filter(Boolean).join(" · "),
    isSample: d.isSample,
    availableDays: d.availableDays,
    opdTiming:
      d.morningFrom && d.morningTo
        ? `${d.morningFrom}–${d.morningTo}${d.eveningFrom && d.eveningTo ? ` & ${d.eveningFrom}–${d.eveningTo}` : ""}`
        : undefined,
  }));

  const preDoctorId = sp.doctorId && doctors.some((d) => d.id === Number(sp.doctorId)) ? Number(sp.doctorId) : undefined;
  const preDepartmentId = doctors.find((d) => d.id === preDoctorId)?.departmentId ?? undefined;

  return (
    <div className="container-x py-10">
      <p className="section-sub">Online Booking · ऑनलाइन बुकिंग</p>
      <h1 className="section-title">Book Your Appointment</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Choose a department and doctor, pick a free time slot, and submit. You will receive a
        unique Appointment ID immediately — save it for status checks. Hi, अपनी पसंद का विभाग, डॉक्टर, तारीख़ और समय चुनकर बुक करें।
      </p>
      <div className="mt-6">
        <BookingForm departments={deps} doctors={docs} preDoctorId={preDoctorId} preDepartmentId={preDepartmentId} />
      </div>
    </div>
  );
}
