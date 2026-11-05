/** Debug: build the OPD slip for a real appointment and write it to disk */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { buildSlipForAppointment } from "../src/lib/opd-slip-pdf";

async function main() {
  const id = Number(process.argv[2] || 7);
  const pdf = await buildSlipForAppointment(id);
  if (!pdf) {
    console.error("buildSlipForAppointment returned null (appointment missing or exception)");
    process.exit(1);
  }
  writeFileSync(`slip-${id}.pdf`, pdf);
  console.log(`written slip-${id}.pdf (${(pdf.length / 1024).toFixed(1)} KB)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
