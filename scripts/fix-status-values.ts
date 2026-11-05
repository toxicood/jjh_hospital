/** Normalize legacy status values written by the old admin route: CONFIRM→CONFIRMED, COMPLETE→COMPLETED */
import { prisma } from "../src/lib/db";

async function main() {
  const a = await prisma.appointment.updateMany({ where: { status: "CONFIRM" }, data: { status: "CONFIRMED" } });
  const b = await prisma.appointment.updateMany({ where: { status: "COMPLETE" }, data: { status: "COMPLETED" } });
  console.log(`CONFIRM → CONFIRMED: ${a.count} rows`);
  console.log(`COMPLETE → COMPLETED: ${b.count} rows`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
