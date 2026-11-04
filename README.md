# Jeevan Jyoti Hospital, Sirsa — Website + Appointment Management System

Full-stack hospital website with **online appointment booking, patient portal and admin dashboard**.

> ⚠️ **Sample content notice:** Doctors, testimonials and parts of facility text are *placeholder
> data* (badged on-screen) until verified details are entered via the Admin Dashboard.

## Tech stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS v4** — blue/white/cyan theme
- **MySQL 8** via **Prisma ORM**
- Auth: JWT session cookie (httpOnly) + bcrypt password hashing, role-based (ADMIN/PATIENT)
- Validation: Zod (frontend + backend)
- Optional integrations: WhatsApp Business API / SMS gateway / SMTP email — configurable in `.env`, graceful fallback when unconfigured

## Quick start (development)

```bash
# 1. MySQL must be running on localhost:3306 and .env must exist (see .env.example)
# 2. install dependencies
npm install

# 3. create tables from schema
npx prisma db push

# 4. seed first admin + sample content (clearly marked)
npx prisma db seed

# 5. run
npm run dev   # http://localhost:3000
```

### Default logins (development seed — change before production use)

| Role | Credential |
| ---- | ---------- |
| Admin | email from `.env` `ADMIN_EMAIL` (default `admin@jjh.in`) / password from `.env` `ADMIN_PASSWORD` |

Patients self-register on the website.

## Project structure

```
prisma/schema.prisma        DB schema (Admin, Patient, Doctor, Department, Appointment,
                            TimeSlot, Service, Gallery, Testimonial, ContactMessage,
                            Notification, AuditLog, Setting)
prisma/seed.ts              First admin + marked sample content
src/app/(site)…             Public pages: Home, About, Doctors, Departments, Book,
                            Check Status, Contact, FAQ, Privacy, Terms, 404
src/app/patient/…           Patient portal (register, login, dashboard)
src/app/admin/…             Admin dashboard (secure, role-guarded)
src/app/api/…               REST API routes (see docs/API.md)
src/lib/                    db, auth, validation, slots, notifications, audit
src/components/             UI components
```

## Security notes

- No plain-text passwords (bcrypt, cost 12)
- httpOnly + SameSite cookies; secure in production
- Input validated on client and server (Zod)
- Server queries via Prisma (no SQL injection surface)
- Patient medical details are never shown publicly
- Audit log records admin/system/patient actions
- Set `HTTPS` and real `AUTH_SECRET` in production

## Deployment

1. Provision MySQL (cloud or your hosting), run `npx prisma db push && npx prisma db seed`
2. Set environment variables on host: `DATABASE_URL`, `AUTH_SECRET` (long random), `APP_URL`
3. `npm run build && npm start` (or deploy to Vercel/Railway with a managed MySQL)
4. Configure WhatsApp/SMS/SMTP credentials in `.env` — see `docs/API.md`
