/**
 * OPD Slip PDF generator — styled after the hospital's real printed OPD slip.
 *
 * Layout (A4):
 *  - Red letterhead: JJ logo block, "OPD SLIP", hospital name + address, email & phone
 *  - Left column: doctor panel list, Vitals, Pain Score, Allergies, Investigation,
 *    Nutritional Advice, Follow up
 *  - Right column: registration box (UHID, OPD No, Name, Add, Phone, Age/Sex,
 *    Consultant, Date, Amount, Valid Up To)
 *  - Red footer band: OPD timings (Hindi), Ayushman/empanelment note, medico-legal note
 *
 * Fonts: built-in Helvetica for Latin; Mangal (bundled in assets/fonts) for
 * Devanagari lines. Edit HOSPITAL constants below (or per-deployment) to match
 * the printed letterhead.
 */
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/db";

export interface SlipData {
  apptCode: string;
  uhid: string;
  opdNo: string;
  name: string;
  fatherName?: string | null;
  address?: string | null;
  phone: string;
  ageSex: string;
  consultant: string;
  department?: string | null;
  dateLabel: string; // "12-Sep-2026"
  bookedAtLabel: string; // "10:50 AM"
  amountLabel: string; // "200.00"
  validUptoLabel: string; // "17-Sep-26"
  statusLabel: string; // "PENDING" etc.
}

// Real consultant panel from the printed letterhead (edit if hospital adds doctors).
const PANEL_DOCTORS: Array<{ name: string; degrees: string; speciality: string }> = [
  { name: "Dr. Munish Singla", degrees: "M.S., MRCS(England)", speciality: "(General & Laparoscopic Surgeon)" },
  { name: "Dr. Suresh Bishnoi", degrees: "M.D.(General Medicine)", speciality: "(Heart, Sugar & Chest Specialist)" },
  { name: "Dr. Richa Bishnoi", degrees: "B.D.S.", speciality: "(Dental Surgeon)" },
  { name: "Dr. Sandeep Sharma", degrees: "", speciality: "Resident Medical Officer" },
];

const RED = "#c8102e";
const DARK = "#1a1a1a";
const GREY = "#444444";

const FONT_HI = "mangal.ttf";
const FONT_HI_BOLD = "mangalb.ttf";

function fontPath(file: string): string {
  return path.join(process.cwd(), "assets", "fonts", file);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12-Sep-2026" from a Date (UTC-safe, machine is IST) */
function slipDate(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, "0")}-${MONTHS[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
}

/** "17-Sep-26" — validity = appointment date + 5 days */
function validUpto(d: Date): string {
  const v = new Date(d.getTime() + 5 * 24 * 60 * 60 * 1000);
  return `${String(v.getUTCDate()).padStart(2, "0")}-${MONTHS[v.getUTCMonth()]}-${String(v.getUTCFullYear()).slice(2)}`;
}

function time12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Build the PDF for an existing appointment (loads Doctor/Patient from DB). */
export async function buildSlipForAppointment(appointmentId: number): Promise<Buffer | null> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true, department: true, patient: true },
  });
  if (!appt) return null;

  const statusText: Record<string, string> = {
    PENDING: "PENDING — awaiting confirmation",
    CONFIRMED: "CONFIRMED",
    CANCELLED: `CANCELLED${appt.statusReason ? ` (${appt.statusReason})` : ""}`,
    COMPLETED: "COMPLETED",
  };

  const data: SlipData = {
    apptCode: appt.apptCode,
    uhid: String(appt.patientId + 47000),
    opdNo: appt.apptCode.replace("JJH-", ""),
    name: appt.fullName,
    address: appt.patient.address ?? null,
    phone: appt.mobile,
    ageSex: `${appt.age ?? "-"} Y / ${appt.gender?.[0] ?? "-"}`,
    consultant: appt.doctor.fullName,
    department: appt.department?.name ?? appt.doctor.specialization ?? null,
    dateLabel: slipDate(appt.date),
    bookedAtLabel: time12(appt.time),
    amountLabel: `${(appt.doctor.consultationFee ?? 200).toFixed(2)}`,
    validUptoLabel: validUpto(appt.date),
    statusLabel: statusText[appt.status] ?? appt.status,
  };
  return buildOpdSlipPdf(data);
}

export function buildOpdSlipPdf(data: SlipData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `OPD Slip ${data.apptCode} — Jeevan Jyoti Hospital` } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    draw(doc, data);
    doc.end();
  });
}

function hline(doc: PDFKit.PDFDocument, y: number, x1: number, x2: number, color = RED, width = 1.6) {
  doc.save().moveTo(x1, y).lineTo(x2, y).lineWidth(width).strokeColor(color).stroke().restore();
}

function draw(doc: PDFKit.PDFDocument, d: SlipData) {
  const W = doc.page.width;
  const H = doc.page.height;
  const M = 28;

  // ---------- Letterhead ----------
  // thin top rule + JJ logo block
  doc.rect(M, M, W - 2 * M, 6).fill(RED);

  // JJ logo: red rounded box with white letters
  doc.save();
  doc.roundedRect(M, M + 14, 56, 44, 6).fill(RED);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(26).text("JJ", M + 16, M + 25, { width: 40, align: "center" });
  doc.restore();

  // email + phone row (small, like hand note on printed slip)
  doc.font("Helvetica").fontSize(8).fillColor(GREY)
    .text("drsureshbishnoi@yahoo.com", M + 70, M + 12, { width: 240, align: "center" });
  doc.text(`Ph. 01666-231100`, W - M - 150, M + 12, { width: 150, align: "right" });

  doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK)
    .text("OPD SLIP", M + 70, M + 30, { width: 240, align: "center" });

  // Hospital name
  doc.font("Helvetica-Bold").fontSize(24).fillColor(RED)
    .text("Jeevan Jyoti Hospital", M, M + 62, { width: W - 2 * M, align: "center" });
  hline(doc, M + 92, M, W - M);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(DARK)
    .text("Near R.S.D. School, Dabwali Road, SIRSA (Hry.)", M, M + 96, { width: W - 2 * M, align: "center" });
  hline(doc, M + 114, M, W - M);

  const bodyTop = M + 124;
  const bodyBottom = H - M - 96;
  const colW = 150; // left column width
  const rightX = M + colW + 10;

  // ---------- Left column ----------
  doc.save();
  const leftH = bodyBottom - bodyTop;
  doc.roundedRect(M, bodyTop, colW, leftH, 3).fillOpacity(0.06).fill("#0d6efd").fillOpacity(1);
  doc.restore();

  let y = bodyTop + 8;
  const lx = M + 8;
  const lw = colW - 16;
  for (const doc2 of PANEL_DOCTORS) {
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(RED).text(doc2.name, lx, y, { width: lw });
    y = doc.y + 1;
    if (doc2.degrees) {
      doc.font("Helvetica").fontSize(7.5).fillColor(DARK).text(doc2.degrees, lx, y, { width: lw });
      y = doc.y + 1;
    }
    doc.font("Helvetica").fontSize(7.5).fillColor(GREY).text(doc2.speciality, lx, y, { width: lw });
    y = doc.y + 5;
  }

  // Vitals block
  y += 6;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text("Vitals", lx, y);
  y = doc.y + 3;
  for (const [label, val] of [["BP", "............"], ["PR", "............"], ["SPO2/R.", "............"], ["Temp", "............"], ["Ht", "............"], ["Wt", "............"]] as const) {
    doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
    doc.text(`${label} : ${val}`, lx, y, { width: lw });
    y = doc.y + 2;
  }

  y += 8;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text("Pain Score", lx, y);
  y = doc.y + 2;
  doc.font("Helvetica").fontSize(7).fillColor(GREY).text("0   1-3   4-6   7-9   10", lx, y, { width: lw });
  y = doc.y + 3;
  doc.font("Helvetica").fontSize(7).fillColor(GREY).text("No    Mild       Moderate known 7      Severe     Very Severe     Worst Pain", lx, y, { width: lw, lineBreak: false });
  y = doc.y + 6;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text("Allergies: Y/N", lx, y);
  y = doc.y + 8;
  doc.text("Investigation", lx, y);
  y = doc.y + 8;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text("Nutritional Advice", lx, y, { underline: true });
  y = doc.y + 10;
  doc.text("Follow up", lx, y, { underline: true });

  // ---------- Right column ----------
  const boxTop = bodyTop;
  const boxH = 86;
  doc.save();
  doc.rect(rightX, boxTop, W - M - rightX, boxH).lineWidth(1).strokeColor(DARK).stroke();
  doc.restore();

  const rx = rightX + 6;
  const rw = W - M - rightX - 12;

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK);
  doc.text(`UHID : ${d.uhid}`, rx, boxTop + 6, { width: rw * 0.4, continued: false });
  doc.text(`OPD No : ${d.opdNo}`, rx + rw * 0.38, boxTop + 6, { width: rw * 0.36 });
  doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
  doc.text(`Consultant  : ${d.consultant}`, rx + rw * 0.7, boxTop + 6, { width: rw * 0.3, align: "right" });

  doc.font("Helvetica-Bold").fontSize(9.5);
  doc.text(`Name : ${d.name}`, rx, boxTop + 24, { width: rw * 0.62 });
  doc.font("Helvetica").fontSize(9);
  doc.text(`Age :Sex: ${d.ageSex}`, rx + rw * 0.7, boxTop + 24, { width: rw * 0.3, align: "right" });

  doc.font("Helvetica").fontSize(9);
  doc.text(`Add. : ${d.address ?? "—"}`, rx, boxTop + 40, { width: rw * 0.62 });
  doc.text(`Amount : ${d.amountLabel}`, rx + rw * 0.7, boxTop + 40, { width: rw * 0.3, align: "right" });

  doc.text(`Phone No. : ${d.phone}`, rx, boxTop + 56, { width: rw * 0.5 });
  doc.text(`Valid UpTo : ${d.validUptoLabel}`, rx + rw * 0.55, boxTop + 56, { width: rw * 0.45, align: "right" });

  doc.text(`Date : ${d.dateLabel}  ${d.bookedAtLabel}`, rx, boxTop + 72, { width: rw * 0.62 });
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(d.statusLabel.startsWith("CANCELLED") ? RED : "#0a7d24");
  doc.text(`${d.statusLabel}`, rx + rw * 0.55, boxTop + 72, { width: rw * 0.45, align: "right" });

  // token / appointment code strip under details box
  const stripY = boxTop + boxH + 8;
  doc.roundedRect(rightX, stripY, W - M - rightX, 20, 3).fillOpacity(0.08).fill(RED).fillOpacity(1);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(RED)
    .text(`Appointment ${d.apptCode}  ·  OPD ${d.dateLabel} ${d.bookedAtLabel}`, rightX, stripY + 5, { width: W - M - rightX, align: "center" });

  // clinical / instructions block
  let ry = stripY + 34;
  const sections: Array<[string, string[]]> = [
    ["Chief Complaint / Problem", d.department ? [d.department] : []],
    ["Instruction — Please bring", [
      "Is slip apne saath le aayein aur appointment se 10 minute pehle hospital pahunchein.",
      "Purani dawai ki list / reports saath layein.",
      "Badalav (cancel/reschedule) ke liye hospital phone karein: 01666-231100.",
    ]],
  ];
  for (const [title, lines] of sections) {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text(title, rightX, ry);
    ry = doc.y + 3;
    doc.font("Helvetica").fontSize(8.5).fillColor(GREY);
    for (const ln of lines) {
      doc.text(`• ${ln}`, rightX, ry, { width: rw - 10 });
      ry = doc.y + 2;
    }
    ry += 6;
    hline(doc, ry - 4, rightX, W - M, "#dddddd", 0.7);
  }

  // validation stamp box
  const stampY = bodyBottom - 40;
  doc.save();
  doc.rect(rightX, stampY, W - M - rightX, 30).lineWidth(1).strokeColor(RED).stroke();
  doc.restore();
  doc.font("Helvetica").fontSize(8).fillColor(GREY)
    .text("Reception use only — Token No: ______   Fee Paid: ______   Receipt No: ______", rightX + 6, stampY + 11);

  // ---------- Footer band ----------
  const fy = H - M - 84;
  doc.rect(M, fy, W - 2 * M, 84).fill(RED);
  doc.fillColor("#ffffff");

  const hi = (text: string, f = FONT_HI) =>
    doc.font(fontPath(f), text.length > 40 ? 7.5 : 8.5).fillColor("#ffffff").text(text, M + 10, doc.y, { width: W / 2 - 20, align: "left", lineBreak: true });

  // left: timings (Hindi)
  doc.y = fy + 8;
  hi("सोम.-शुक्र. 10:00 बजे से 03:00 बजे तक");
  hi("शाम  5:00 बजे से  06:30 बजे तक");
  // right side: medico-legal note
  doc.font("Helvetica").fontSize(8).fillColor("#ffffff")
    .text("Not Valid for Medico Legal Purpose", W / 2, fy + 10, { width: W / 2 - M - 16, align: "left" })
    .fontSize(8.5).font("Helvetica-Bold")
    .text("Sunday only Emergency", W / 2, doc.y + 2, { width: W / 2 - M - 16, align: "left" });

  // center strip: empanelment
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff")
    .text("Empanelled with: Ayushman Bharat · Star Health · Niva Bupa · MDIndia · Medi Assist · Chola · FHPL · VDAL Health · HDFC Ergo · ICICI Lombard", M + 10, fy + 44, { width: W - 2 * M - 20, align: "left" });
  doc.font(fontPath(FONT_HI_BOLD), 9).fillColor("#ffffff")
    .text("हरियाणा सरकार व आयुष्मान भारत के पैनल पर", M + 10, fy + 62, { width: W - 2 * M - 20, align: "left" });

  // tiny print note
  doc.font("Helvetica").fontSize(6.5).fillColor("#f7d4db")
    .text("Computer-generated OPD slip — valid with photo ID. Appointment code required at reception.", M + 10, fy + 74, { width: W - 2 * M - 20, align: "left" });
}
