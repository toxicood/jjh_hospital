/**
 * One-off SMTP test — sends a real email via the credentials in .env
 * Run: npm.cmd run db:seed-style... actually: npx tsx scripts/test-email.ts
 */
import "dotenv/config";
import nodemailer from "nodemailer";

async function main() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.argv[2] || user;

  console.log(`SMTP config: host=${host} port=${port} user=${user}`);

  if (!host || !user || !pass) {
    console.error("MISSING SMTP CREDENTIALS in .env");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to,
      subject: "✅ Test: Jeevan Jyoti Hospital email system working",
      text: "Namaste!\n\nYeh ek TEST email hai — aapki hospital website ki email service ab kaam kar rahi hai.\n\nAb se jab koi appointment book karega (aur email diya ho), to confirm/cancel/update ki email automatically is Gmail se jayegi.\n\n— Jeevan Jyoti Hospital, Sirsa (website system)",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px">
        <h2 style="color:#0d6efd">🏥 Jeevan Jyoti Hospital, Sirsa</h2>
        <p><b>Namaste!</b></p>
        <p>Yeh ek <b>TEST email</b> hai — website ki email service ab <span style="color:green"><b>kaam kar rahi hai</b></span> ✅</p>
        <p>Ab se jab koi patient appointment book karega (aur apna email diya ho), to usko appointment ki <b>confirmation / cancellation / update</b> ki email automatically isi address se jayegi.</p>
        <hr />
        <p style="color:#888;font-size:12px">Yeh automated test message hai — website system se bheja gaya.</p>
      </div>`,
    });
    console.log(`SENT OK → ${info.messageId} → to: ${to}`);
  } catch (err) {
    console.error("SEND FAILED:", err instanceof Error ? err.message : err);
    process.exit(2);
  }
}

main();
