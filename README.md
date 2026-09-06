# Liberty Assemblies of God Management System

A comprehensive church management platform for member administration, giving, events, ministries, attendance, and church life content.

## Features

- **Member & visitor management** — CRUD, public visitor signup, follow-up tracking
- **Attendance** — Service records with headcount and member tracking
- **Departments (ministries)** — Ministry organization with leaders and members
- **Giving & donations** — Tithes, offerings, receipts, finance reporting
- **Events** — Create events and member RSVP registration
- **Church life** — Sermons, announcements, prayer requests, devotionals, media
- **Role-based access** — Super Admin, Pastor, Church Administrator, Finance Officer, Department Leader, Media, Member
- **Multi-currency** — USD, GHS, EUR, NGN
- **Session persistence** — Stay logged in across page refreshes

### ChMeetings-inspired modules

- **Calendar** — Monthly event calendar with day view
- **Volunteers** — Role definitions and volunteer scheduling/rota
- **Worship Planning** — Song library and order-of-service plans
- **Pledges & Funds** — Designated funds and pledge campaigns with progress tracking
- **Communications** — Bulk email, SMS, and push notifications to groups
- **Check-In** — Event kiosk check-in for members
- **Households** — Family grouping for members
- **Forms** — Custom embeddable forms for data collection
- **Accounting** — Income/expense ledger with fund tracking

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js
- **Database:** PostgreSQL

## Run Locally

**Prerequisites:** Node.js 18+, PostgreSQL

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file and configure:
   ```bash
   cp .env.example .env
   ```
   Set `DATABASE_URL` or individual `DB_*` variables for PostgreSQL.

3. Initialize the database:
   ```bash
   npm run init-db
   ```

4. Create an admin user:
   ```bash
   node server/add-admin.js
   ```

5. Start the API server (terminal 1):
   ```bash
   npm run server
   ```

6. Start the frontend dev server (terminal 2):
   ```bash
   npm run dev
   ```

The Vite dev server proxies `/api` to `http://localhost:3001`.

## Production (Render)

| Service | URL |
|---------|-----|
| Frontend | https://church-ae7v.onrender.com |
| API | https://churchapi-o3pk.onrender.com |

Set `VITE_API_URL=https://churchapi-o3pk.onrender.com/api` when building the frontend.

### Intek SMS (production API service)

On the **churchapi** Render web service, set:

| Variable | Value |
|----------|--------|
| `MESSAGING_PROVIDER` | `intek` |
| `SMS_ENABLED` | `true` |
| `INTEK_API_KEY` | your Intek API key |
| `INTEK_SENDER` | `mychurch` |
| `INTEK_API_URL` | `https://www.inteksms.top/api/v1` |
| `CHURCH_NAME` | `Liberty Assemblies of God` |
| `APP_URL` | `https://church-ae7v.onrender.com` |

Or run (requires a [Render API key](https://dashboard.render.com/u/settings#api-keys)):

```powershell
$env:RENDER_API_KEY = "rnd_..."
$env:INTEK_API_KEY = "INTEK_..."
.\scripts\configure-render-sms.ps1
```

Verify: `GET https://churchapi-o3pk.onrender.com/api/messaging/config` should show `"provider":"intek"` and a balance.

For a single-service deploy, set `SERVE_STATIC=true` and run `npm run build` before `npm start`.

## Project Structure

```
src/           React frontend (components, API client, types)
server/        Express API, routes, PostgreSQL schema
server/routes/ API route handlers
server/schema.sql  Database schema (auto-applied on startup)
```

## Default Credentials

After running `add-admin.js`, use the email and password you configured. New registrations receive a default password shown once at signup.
