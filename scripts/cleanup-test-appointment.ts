/** Delete the EMAIL-TEST appointment + its notifications */
import { prisma } from "../src/lib/db";

async function main() {
  const appt = await prisma.appointment.findFirst({ where: { apptCode: "JJH-DP9L8X" } });
  if (appt) {
    await prisma.notification.deleteMany({ where: { appointmentId: appt.id } });
    await prisma.appointment.delete({ where: { id: appt.id } });
    console.log("deleted test appointment JJH-DP9L8X + its notifications");
  } else {
    console.log("test appointment not found (already clean)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
