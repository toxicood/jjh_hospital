/**
 * Notification layer — WhatsApp / SMS / Email / in-app admin alerts.
 *
 * Providers are intentionally generic: set any provider that accepts an
 * HTTPS POST with a JSON payload + bearer token (MSG91, Fast2SMS, Gupshup,
 * Meta WhatsApp Cloud API etc. — adapt the payload builder if needed).
 *
 * IMPORTANT: if credentials are not configured the system NEVER crashes or
 * blocks booking flow — the message is recorded in the Notification table
 * with status SKIPPED_NO_CREDENTIALS so it is auditable and the admin
 * dashboard shows clear guidance.
 */
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

type Channel = "WHATSAPP" | "SMS" | "EMAIL" | "ADMIN";

export interface OutboundMessage {
  channel: Channel;
  recipient?: string | null; // phone (digits) or email
  message: string;
  appointmentId?: number | null;
  /** Optional email subject override (hospital copies use their own line). */
  subject?: string;
}

/** Hospital/doctor inbox — gets a copy of every email notification.
 *  (A phone push is not possible without a paid SMS/WhatsApp gateway; the
 *  Gmail copy is the reliable channel that works today.) */
export function hospitalInbox(): string | undefined {
  return process.env.HOSPITAL_NOTIFY_EMAIL || process.env.SMTP_USER || undefined;
}

/** Send the hospital's own copy of an appointment email (details + OPD slip PDF). */
export async function notifyHospitalCopy(appointmentId: number, eventLine: string): Promise<void> {
  const inbox = hospitalInbox();
  if (!inbox) return;
  await notify({
    channel: "EMAIL",
    recipient: inbox,
    message: eventLine,
    appointmentId,
    subject: `Jeevan Jyoti Hospital — ${eventLine.slice(0, 60)}`,
  });
}

async function postJson(url: string, token: string, payload: unknown): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Provider HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 500);
}

const SUBJECTS: Record<string, string> = {
  PENDING: "Jeevan Jyoti Hospital — Appointment received (OPD Slip attached)",
  CONFIRMED: "Jeevan Jyoti Hospital — Appointment CONFIRMED (OPD Slip attached)",
  CANCELLED: "Jeevan Jyoti Hospital — Appointment cancelled",
  COMPLETED: "Jeevan Jyoti Hospital — Visit completed. Thank you!",
};

async function sendEmail(msg: OutboundMessage): Promise<{ status: string; slipAttached: boolean }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return { status: "SKIPPED_NO_CREDENTIALS", slipAttached: false };
  }
  // Attach the OPD slip PDF when the email concerns an appointment in an
  // active state (booking received / confirmed). Skipped for cancelled.
  let attachments: Array<{ filename: string; content: Buffer }> = [];
  let subject = "Jeevan Jyoti Hospital — Appointment";
  let html: string | undefined;
  let slipAttached = false;
  if (msg.appointmentId) {
    try {
      const appt = await prisma.appointment.findUnique({
        where: { id: msg.appointmentId },
        select: { status: true, apptCode: true },
      });
      if (appt) {
        subject = msg.subject ?? SUBJECTS[appt.status] ?? subject;
        if (appt.status === "PENDING" || appt.status === "CONFIRMED") {
          const { buildSlipForAppointment } = await import("@/lib/opd-slip-pdf");
          const pdf = await buildSlipForAppointment(msg.appointmentId);
          if (pdf) {
            attachments = [{ filename: `OPD-Slip-${appt.apptCode}.pdf`, content: pdf }];
            slipAttached = true;
            html = `<div style="font-family:Arial,sans-serif;max-width:560px">
              <p>Namaste,</p>
              <p>Aapki <b>OPD Slip PDF</b> is email ke saath attached hai 📎 — booking/reception me dikhane ke liye print karein ya phone me rakh lein.</p>
              <p>Appointment code: <b>${appt.apptCode}</b></p>
              <p style="color:#777;font-size:12px">Jeevan Jyoti Hospital, Sirsa — Near R.S.D. School, Dabwali Road · Ph. 01666-231100</p>
            </div>`;
          }
        }
      }
    } catch (err) {
      console.error("[email] OPD slip generation failed — sending email without attachment", err);
    }
  }
  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to: msg.recipient,
    subject,
    text: msg.message,
    html,
    attachments,
  });
  return { status: "SENT", slipAttached };
}

async function sendHttpsProvider(
  msg: OutboundMessage,
  url?: string,
  token?: string,
): Promise<string> {
  if (!url || !token) return "SKIPPED_NO_CREDENTIALS";
  // Generic payload: providers differ — see docs/API.md to customise.
  return postJson(url, token, {
    to: msg.recipient,
    text: msg.message,
  });
}

/** Record + attempt delivery. Never throws — booking flow must not break. */
export async function notify(msg: OutboundMessage): Promise<{ status: string; detail?: string }> {
  let status = "FAILED";
  let detail: string | undefined = "init";
  try {
    if (msg.channel === "ADMIN") {
      // In-app admin alert only.
      status = "SENT";
      detail = "Recorded in admin inbox";
    } else if (msg.channel === "EMAIL") {
      if (!msg.recipient) {
        status = "SKIPPED_NO_CREDENTIALS";
        detail = "Recipient email missing";
      } else {
        const res = await sendEmail(msg);
        status = res.status;
        if (status === "SENT") detail = res.slipAttached ? "SENT with OPD Slip PDF attached" : undefined;
        else detail = "SMTP not configured (SMTP_HOST/USER/PASS)";
      }
    } else if (msg.channel === "WHATSAPP") {
      status = await sendHttpsProvider(msg, process.env.WHATSAPP_API_URL, process.env.WHATSAPP_API_TOKEN);
      if (status === "SKIPPED_NO_CREDENTIALS") detail = "WhatsApp API not configured (WHATSAPP_API_URL/TOKEN)";
    } else if (msg.channel === "SMS") {
      status = await sendHttpsProvider(msg, process.env.SMS_API_URL, process.env.SMS_API_TOKEN);
      if (status === "SKIPPED_NO_CREDENTIALS") detail = "SMS gateway not configured (SMS_API_URL/TOKEN)";
    }
  } catch (err) {
    status = "FAILED";
    detail = err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500);
  }
  try {
    await prisma.notification.create({
      data: {
        channel: msg.channel,
        recipient: msg.recipient ?? null,
        message: msg.message,
        status,
        statusDetail: detail,
        appointmentId: msg.appointmentId ?? null,
      },
    });
  } catch {
    // Never break caller due to logging failure.
  }
  return { status, detail };
}

export function buildBookingSms(code: string, doctor: string, dateKey: string, time: string): string {
  return `Appointment received — Jeevan Jyoti Hospital, Sirsa. ID: ${code}, Doctor: ${doctor}, Date: ${dateKey}, Time: ${time} (IST). Status: Pending confirmation. Check status: /check-status`;
}
