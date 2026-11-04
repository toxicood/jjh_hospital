# API Documentation — Jeevan Jyoti Hospital Website

Base URL (dev): `http://localhost:3000`

All mutating endpoints return JSON: `{ ok: boolean, data?, error?, message?, fieldErrors? }`.
Auth is via an httpOnly cookie `jjh_session` (JWT, role-based: `ADMIN` / `PATIENT`).

---

## Public endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/public/departments` | Active departments ordered by sortOrder |
| GET | `/api/public/doctors` | Active doctors (+department). Optional `?departmentId=1` |
| GET | `/api/public/testimonials` | Active testimonials |
| GET | `/api/public/settings` | Public site settings (name, address, phones, timings, FAQ keys) |
| POST | `/api/contact` | Contact form → `{ name, email?, phone, subject?, message }` |

## Appointments

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/appointments` | none (public booking) | Creates appointment. Body: fullName, mobile, email?, age, gender, departmentId, doctorId, date (`YYYY-MM-DD`), time (`HH:mm`), problemDescription? Returns `apptCode`. Slot is locked at DB level — double booking of the same doctor/date/time is impossible; if the slot was taken mid-flight you get `409 { error: "SLOT_TAKEN" }`. |
| GET | `/api/slots` | none | `?doctorId=1&date=YYYY-MM-DD` → `{ slots: [{ time, remaining }] }` |
| POST | `/api/appointments/status` | none | `{ apptCode, mobile }` → appointment status (patient self-service). Mobile must match. |

Sessions (see below) also expose:
- `GET /api/patient/appointments` — patient's own appointments
- `POST /api/patient/appointments/[id]/cancel` — cancel own appointment (policy-limited)

## Patient auth

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/auth/patient/register` | `{ fullName, mobile, password }` |
| POST | `/api/auth/patient/login` | `{ mobile, password }` |
| POST | `/api/auth/logout` | clears session |
| GET | `/api/auth/me` | current session role/name |

## Admin auth

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/auth/admin/login` | `{ email, password }` (role ADMIN required) |

## Admin data management (ADMIN session required)

All support `GET` list + `POST` create; `/[id]` routes support `PUT` update + `DELETE`.

| Module | Base path |
| ------ | --------- |
| Doctors | `/api/admin/doctors` |
| Departments | `/api/admin/departments` |
| Appointments | `/api/admin/appointments` (+ `[id]` status/reschedule PATCH, `/export?format=csv`) |
| Patients | `/api/admin/patients` |
| Services | `/api/admin/services` |
| Gallery | `/api/admin/gallery` |
| Testimonials | `/api/admin/testimonials` |
| Site content / contact info | `/api/admin/settings` |
| Contact messages | `/api/admin/messages` |
| Dashboard stats | `/api/admin/stats` |
| Notifications log | `/api/admin/notifications` |
| Audit log | `/api/admin/audit-log` |

### Appointment admin actions

`PATCH /api/admin/appointments/[id]`

```json
{ "action": "CONFIRM" | "CANCEL" | "COMPLETE" | "RESCHEDULE", "time": "10:30", "date": "2026-11-10", "reason": "..." }
```

Every status change creates a Notification record (WhatsApp/SMS/EMAIL as configured —
gracefully `SKIPPED_NO_CREDENTIALS` when not configured) and an AuditLog entry.

### CSV export

`GET /api/admin/appointments/export?format=csv&from=2026-01-01&to=2026-12-31&status=CONFIRMED&doctorId=2&departmentId=1`

Returns a downloadable CSV compatible with Excel. PDF: use the receipt/print
views (browser print-to-PDF) — see Patient Dashboard → Print receipt.

---

## Notifications configuration

Set in `.env`:

```
WHATSAPP_API_URL=   # any HTTPS endpoint accepting {to, text} POST
WHATSAPP_API_TOKEN= # sent as Authorization: Bearer <token>
SMS_API_URL=
SMS_API_TOKEN=
SMS_SENDER_ID=      # e.g. JJHSIR (approval from BSNL/DLT needed in India)
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
```

When empty, all outbound messages are recorded with status `SKIPPED_NO_CREDENTIALS`
and visible in Admin → Notifications — the booking flow is never blocked.
