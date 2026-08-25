# Adinas General Hospital — Full-Stack System

A real, functional rebuild of the Afilas General Hospital website (Bahir Dar, Ethiopia) with:

- **Public site** — departments, doctors, news, gallery, contact form, and appointment booking (no account required).
- **Admin portal** — staff login and full CRUD management of departments, doctors, appointments, news, and gallery.
- **Automatic email reminders** — a background job emails patients ahead of their appointment.

## Stack

- **Backend:** Node.js, Express, PostgreSQL, Prisma ORM, JWT auth, Nodemailer, node-cron
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS

## Project structure

```
afilas-hospital/
  backend/     Express API + Prisma schema + reminder cron job
  frontend/    Next.js app (public site + /admin portal)
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — your PostgreSQL connection string.
- `JWT_SECRET` — any long random string.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — an SMTP account for sending confirmation & reminder emails (e.g. a Gmail App Password, SendGrid, Mailgun, etc.).
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — the first admin account that gets created when you seed the database.

Create the database, then run:

```bash
npx prisma migrate dev --name init
npm run seed        # creates the admin account + seeds departments/doctors from the real site content
npm run dev          # starts the API on http://localhost:4000
```

The reminder job runs automatically every hour and emails any patient whose appointment falls within
`REMINDER_HOURS_BEFORE` hours (default 24) and hasn't already received a reminder.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # points the frontend at the backend API
npm run dev                         # starts the site on http://localhost:3000
```

- Public site: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login` (use the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` you set)

## How booking + reminders work

1. A patient fills out the **Appointment** page — no account needed. This creates an `Appointment` row
   (status `PENDING`) and immediately emails a confirmation.
2. Staff review and confirm/cancel appointments from **Admin → Appointments**.
3. Every hour, the backend checks for upcoming appointments and emails a reminder once, then marks
   `reminderSentAt` so the same patient is never reminded twice.

## Notes for going to production

- Change `SEED_ADMIN_PASSWORD` immediately after first login (add a "change password" admin endpoint if needed).
- Put the backend behind HTTPS and set `CLIENT_URL` to your real frontend origin (used for CORS).
- Gallery/doctor photos currently take a hosted image URL — wire up a storage provider (S3, Cloudinary, etc.)
  if you want direct file uploads from the admin panel.
- Consider adding rate limiting to the public `/api/appointments` and `/api/contact` endpoints.
