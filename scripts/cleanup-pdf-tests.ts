/** Delete all PDF-test appointments (PDF Test Patient) + notifications + test patient */
import { prisma } from "../src/lib/db";

async function main() {
  const appts = await prisma.appointment.findMany({
    where: { fullName: "PDF Test Patient" },
    select: { id: true, apptCode: true },
  });
  console.log(`found ${appts.length} test appointments: ${appts.map((a) => a.apptCode).join(", ") || "none"}`);
  for (const a of appts) {
    await prisma.notification.deleteMany({ where: { appointmentId: a.id } });
    await prisma.auditLog.deleteMany({ where: { entity: "APPOINTMENT", entityId: a.id } });
    await prisma.appointment.delete({ where: { id: a.id } });
    console.log(`deleted ${a.apptCode}`);
  }
  const p = await prisma.patient.findUnique({ where: { mobile: "9999777666" } });
  if (p) {
    await prisma.patient.delete({ where: { id: p.id } });
    console.log("deleted test patient");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
