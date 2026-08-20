# Trakwell

Repair and service ticket management for small repair/service businesses (phones,
laptops, and beyond). Multi-tenant, role-based, with a public no-login tracking
page for customers.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind · PostgreSQL + Prisma · session
auth via signed httpOnly cookies (`jose`) · bcrypt password hashing · Zod
validation · Recharts.

## Project structure

```
app/
  (dashboard)/          # authenticated app: dashboard, customers, tickets, settings
  api/                  # route handlers (auth, customers, tickets, dashboard, track, staff)
  track/[token]/        # public, no-auth ticket tracking page
  login/ register/      # auth pages
  page.tsx              # marketing landing page
components/             # reusable UI, dashboard, customers, tickets, settings components
lib/                    # db client, session/auth, validation, permissions, utils
prisma/                 # schema.prisma, seed.ts
tests/                  # vitest: tenant isolation + validation
```

## 1. Setup

```bash
npm install
cp .env.example .env
# edit .env — at minimum set DATABASE_URL and AUTH_SECRET
```

Generate a secret:
```bash
openssl rand -base64 32
```

## 2. Database

Requires a running PostgreSQL instance (local, Docker, Supabase, Neon, RDS, etc).

```bash
npx prisma migrate dev --name init   # creates tables from prisma/schema.prisma
npm run seed                         # optional: loads demo data (dev/staging only)
```

Seed login (demo data): `owner@northsiderepair.demo` / `Demo1234!`

## 3. Run

```bash
npm run dev        # http://localhost:3000
npm run build       # production build
npm start            # serve the production build
```

## 4. Test

```bash
npm test
```
Covers: tenant isolation (business A cannot read business B's data), invalid
tracking tokens, soft-deleted records being excluded, and input validation.
Point `DATABASE_URL` at a disposable test database first.

## 5. Deploy

- Frontend/backend: Vercel (or any Node host that supports Next.js).
- Database: any managed Postgres (Neon, Supabase, RDS, etc). Use the pooled
  connection string in production.
- Set the same environment variables from `.env.example` in your host's
  dashboard. **Never** commit `.env` or expose `DATABASE_URL`/`AUTH_SECRET` to
  the client.
- Run `npx prisma migrate deploy` as part of your deploy step (not `migrate dev`).
- Do not run `npm run seed` against production.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` | Yes | Signs session cookies (32+ random chars) |
| `APP_URL` | Yes | Base URL used to build tracking links |
| `STORAGE_URL`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` | No | Enables file uploads (photos/receipts) when set |
| `EMAIL_PROVIDER_KEY`, `EMAIL_FROM` | No | Enables email notifications when set |
| `PAYMENT_PROVIDER_KEY` | No | For Stripe/Razorpay billing integration |

## Security

- **Tenant isolation**: every query is scoped by `businessId` taken from the
  signed server-side session (`lib/session.ts` → `requireUser()`), never from
  the client. See `tests/tenant-isolation.test.ts`.
- **Auth**: bcrypt password hashing (cost 12), httpOnly/secure/sameSite
  session cookies, session verified on every API call, login rate-limited.
- **Authorization**: role checks (`lib/permissions.ts`) enforced server-side
  in every API route, not just hidden in the UI.
- **Public tracking**: authorized by an unguessable random token
  (`crypto.randomBytes(24)`), not a predictable ticket id. Internal notes,
  staff identities, and audit logs are never included in the public response.
- **Soft deletes**: customers and tickets are archived (`deletedAt`), not
  hard-deleted, so repair history and audit trails are preserved.
- **Headers**: `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, restrictive `Permissions-Policy` set in `next.config.mjs`.
- Secrets only ever live in environment variables, read server-side.

## Implemented features

Auth (register/login/logout, bcrypt, sessions, rate limiting) · multi-tenant
business/user model with roles (Owner/Admin/Staff) · customer CRUD with soft
delete · ticket CRUD with soft delete, status workflow, priorities, audit
trail (`TicketActivity`) · technician notes · public token-based tracking page
· dashboard with real aggregated stats and charts · server-side search,
filters, and pagination for customers and tickets · staff management (add,
deactivate, change role) · business profile settings · responsive layout with
mobile bottom nav and a one-handed mobile ticket workspace · landing page with
pricing/FAQ · SEO (robots, sitemap, metadata, tracking pages excluded from
indexing) · security/validation test suite.

## Known limitations (explicitly out of scope for this pass)

- **File uploads**: schema/env vars are ready (`STORAGE_*`), but the upload
  UI and S3 client aren't wired up yet.
- **Email/SMS notifications**: architecture supports it (`EMAIL_PROVIDER_KEY`),
  but no provider is integrated — the Settings page tells the owner this
  plainly rather than faking a "sent" state.
- **Billing**: pricing UI only; no Stripe/Razorpay integration yet.
- **Forgot/reset password and email verification**: schema (`PasswordReset`
  model) is in place; the request/confirm flow and email delivery aren't
  built yet.
- **In-app notification center**: `TicketActivity` gives you the audit trail
  this would read from, but there's no dedicated notification inbox UI yet.

These are intentionally deferred per the phased build order (auth/data first,
billing/notifications/files last) rather than half-built and broken.
