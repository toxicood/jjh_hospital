/** Generate a sample OPD slip PDF for visual inspection: scripts/make-sample-slip.ts */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { buildOpdSlipPdf } from "../src/lib/opd-slip-pdf";

async function main() {
  const pdf = await buildOpdSlipPdf({
    apptCode: "JJH-XQWQFW",
    uhid: "47088",
    opdNo: "XQWQFW",
    name: "MANPHOL s/o SH. GANGA RAM",
    address: "CHAKKAN",
    phone: "9416392332",
    ageSex: "60 Y / M",
    consultant: "Dr. Suresh Bishnoi",
    department: "General Medicine",
    dateLabel: "06-Nov-2026",
    bookedAtLabel: "09:00 AM",
    amountLabel: "200.00",
    validUptoLabel: "11-Nov-26",
    statusLabel: "PENDING — awaiting confirmation",
  });
  writeFileSync("opd-slip-sample.pdf", pdf);
  console.log(`written: opd-slip-sample.pdf (${(pdf.length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
