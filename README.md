# Dash Duckies 🦆

Global rubber-duck tracking platform. Physical ducks carry QR / "Quacker Tracker" (QT) codes;
people scan a duck, register or report sightings (photo + location), and follow each duck's
journey on a live map. This is a ground-up rewrite of the legacy Blazor .NET app, built on
**Nuxt** and deployed on **Railway**.

- **Production:** https://dashduckies.up.railway.app (deploys from `main`)
- **Staging:** https://dashduckies-staging.up.railway.app (deploys from the `staging` branch)
- **Repo:** `masteroleary/dashduckiesvue`

> 🧪 **There are two environments. Develop new features on the `staging` branch → test on the
> staging server → promote to `main` for production.** See [Environments](#environments) below
> before deploying.

---

## Architecture at a glance

One **Nuxt** app serves three concerns from a single origin:

| Surface | Rendering | Purpose |
|---|---|---|
| Public pages (`/`, `/quackertracker/[code]`, `/stickers`, `/contact`, `/terms`, `/duck/...`) | **SSR** | Crawlable HTML for SEO |
| `/app/**` (member + admin) | **client-only SPA** (`ssr: false`) | Authenticated app |
| `server/api/**` | **Nitro** server routes | REST API |

Because it's one origin, a single **HTTP-only session cookie** is readable by both the SSR pages
and the SPA — that's how the session is shared.

**Stack:** Nuxt 4 · Vuetify (`vuetify-nuxt-module`) · Drizzle ORM + Postgres · Azure Blob Storage ·
jimp + exifr (images) · jose (JWT) · SendGrid (email) · Twilio Verify (SMS) · HERE (geocoding) ·
Leaflet + OpenStreetMap (maps).

---

## Prerequisites

- **Node 22.x** (the repo pins this; nvm/Volta recommended)
- Access to the Railway Postgres (public proxy URL) — already in the team `.env`
- A `.env` file (see [Environment variables](#environment-variables))

---

## Local setup

```bash
npm install
cp .env.example .env      # then fill in the values (DATABASE_URL, JWT_SECRET, service keys)
npm run dev               # http://localhost:3000
```

> **Important:** `.env` uses the **public** Railway Postgres proxy URL
> (`...proxy.rlwy.net:PORT`), not the internal `postgres.railway.internal` one — the internal
> host only resolves inside Railway. The deployed app uses the internal URL via a Railway
> reference variable.

Seed demo data (10 ducks across US cities, 3 users, 30 sightings):

```bash
npm run db:seed
```

> ⚠️ **Point your local `DATABASE_URL` at the STAGING Postgres, not production.** Whatever DB your
> `.env` points at is the DB your local dev + `db:seed`/`db:migrate` will modify. Use staging's
> **public** proxy URL (Railway → Postgres service → *staging* env → Variables → `DATABASE_PUBLIC_URL`)
> so local work never touches prod data. See [Environments](#environments).

---

## Testing locally (no real email/SMS needed)

Login is passwordless (email or phone → 6-digit code). For local development there's a **dev
bypass**: any address listed in `DEVELOPER_EMAILS` / `DEVELOPER_PHONES` (in `.env`) skips
SendGrid/Twilio and accepts the code **`000000`**.

**Dev accounts (from `.env`):**

| Account | Role | Code |
|---|---|---|
| `info@dashduckies.com` | **admin** (+ member) | `000000` |
| `webdevllc@gmail.com` | member | `000000` |
| `+13216151531`, `+14074564001` | member | `000000` |

The admin flag is applied on server startup by `server/plugins/admin-init.ts`, which marks
`ADMIN_ACCOUNT_EMAIL` as admin.

**A quick manual smoke test:**

1. `npm run dev` → open http://localhost:3000
2. Home: hero, **live map** of seeded sightings, stats, how-it-works, newsletter.
3. Scan a seeded duck: `/quackertracker/100001` (codes are **100001–100010**) → duck profile,
   journey map, like button, "Post a sighting".
4. Sign in: go to `/app`, enter `info@dashduckies.com`, code `000000`.
5. Member area: Dashboard (stats + map), My Ducks, Account (incl. profile-photo upload).
6. Admin (as `info@…`): **Admin · Stats / Members / Ducks** in the nav — role switches,
   member delete, duck bulk-create / edit / delete.
7. Register / sighting with a photo: `/duck/register/[duckId]` or `/duck/[duckId]/sighting`
   (image upload exercises the jimp → Azure pipeline).

> **The dev bypass never works in production** — `DEVELOPER_*` is intentionally not set on
> Railway, so prod always sends real codes via SendGrid/Twilio.

> **Production login is untested from the dev box** (no bypass there). To verify real email/SMS,
> sign in on the live site with a real address; if codes don't arrive, check SendGrid sender/domain
> verification and the Twilio Verify service.

---

## Database (Drizzle)

```bash
npm run db:generate   # diff server/db/schema.ts -> new SQL migration in server/db/migrations
npm run db:migrate    # apply pending migrations to $DATABASE_URL
npm run db:studio     # browse data in a local GUI
npm run db:seed       # demo data
```

Schema lives in `server/db/schema.ts` (7 tables: `users`, `ducks`, `duck_sightings`,
`duck_likes`, `verification_codes`, `auth_tokens`, `email_subscriptions`). Conventions: UUID PKs,
`timestamptz`, **soft delete via nullable `deleted_at`** (NULL = active).

### Migrating data from the legacy SQL Server

`scripts/migrate-from-sqlserver.mjs` (`npm run db:migrate-legacy`) is a one-time ETL from the old
**SQL Server** DB to Postgres. Set the source connection in `.env` (one of):

```bash
OLD_SQLSERVER_URL=Server=host;Database=db;User Id=user;Password=pass;Encrypt=false   # preferred
# or OLD_SQLSERVER_HOST / OLD_SQLSERVER_DB / OLD_SQLSERVER_USER / OLD_SQLSERVER_PASSWORD
```

```bash
npm run db:migrate-legacy                      # DRY RUN — reads source, reports counts, writes nothing
npm run db:migrate-legacy -- --commit          # import (idempotent: on-conflict-do-nothing)
npm run db:migrate-legacy -- --commit --wipe   # clear target tables first (removes demo seed), then import
```

What it does: auto-discovers source table/column names; transforms PascalCase→snake_case,
`UTCDeletedOn=MinValue`→`deleted_at NULL`, `RegistrationType` enum int→text, lowercases emails;
inserts in FK order preserving GUID/int ids (resets serial sequences after). **Skips** `auth_tokens`
(old JWTs are invalid under the new `JWT_SECRET`) and `verification_codes` (ephemeral).

> The old `db32347.databaseasp.net` host is IP-restricted and not reachable from every network —
> run this from a machine/network that can reach it, or provide a reachable connection string.
> Always do a **dry run first**, and use `--wipe` only when you intend to replace the demo seed.

---

## Project structure

```
nuxt.config.ts            # Vuetify theme, routeRules (/app ssr:false), favicon
app.vue                   # NuxtLayout + NuxtPage
layouts/
  default.vue             # public nav + footer (black app bar, logo)
  app.vue                 # member shell: auth-gated, member/admin nav drawer
pages/
  index.vue               # home (SSR)
  quackertracker/         # scan landing (index + [identifier])
  stickers, contact, terms.vue
  duck/register/[id].vue, duck/[id]/sighting.vue   # write flows
  app/index|ducks|account.vue                       # member SPA
  app/admin/index|members|ducks.vue                 # admin SPA
components/
  LiveMap.client.vue      # Leaflet map (client-only)
  LoginCard.vue           # passwordless login
composables/useAuth.ts    # auth state + login/logout
server/
  api/                    # Nitro REST endpoints (auth, duck, member, my-ducks, admin, ...)
  middleware/auth.ts      # reads session cookie -> event.context.user
  plugins/admin-init.ts   # marks ADMIN_ACCOUNT_EMAIL as admin on startup
  db/{schema.ts,index.ts,migrations/}
  utils/{jwt,verification,userAuth,session,ducks,member,account,geocode,images,rateLimit,admin}.ts
scripts/seed.mjs          # demo seed
public/                   # brand images (logo, hero-banner, steps, stickers, sampleducks/, favicon)
```

---

## How auth & sessions work

1. `POST /api/auth/request-code` → emails (SendGrid) or texts (Twilio Verify) a code; dev accounts
   get `000000`.
2. `POST /api/auth/verify-code` → verifies, finds/creates the user, signs a **JWT (jose)**, stores
   it in `auth_tokens` (for revocation), and sets it in the **`dd_session` HTTP-only cookie**.
3. `server/middleware/auth.ts` runs on every request: if the cookie is valid **and** the token is
   still in `auth_tokens`, it attaches `event.context.user`.
4. `POST /api/auth/logout` deletes the token row (instant revocation) and clears the cookie.
5. Route guards: `requireUser(event)` / `requireAdmin(event)` (in `server/utils/session.ts`).

**Anonymous claim:** guests can register/report; the API returns a `claimToken` stored in
`localStorage` (`dd_claim_token`) and attributed to their account on next login (7-day grace).

---

## Images

`server/utils/images.ts`: **jimp** (pure JS — chosen over sharp, whose native libvips can't be
bundled on Railway) resizes to ≤1920px and re-encodes to JPEG q85; **jimp auto-orients from EXIF on
read** (don't add manual rotation — it double-rotates); **exifr** extracts GPS. Uploads go to Azure
Blob containers `profile-images` / `duck-images` / `sighting-images` (public blobs).

---

## Environments

There are **two Railway environments** in the `dashduckies` project, each with its **own web
service deploy and its own isolated Postgres database**. New features go to **staging first**.

| | Production | Staging |
|---|---|---|
| URL | https://dashduckies.up.railway.app | https://dashduckies-staging.up.railway.app |
| Git branch | **`main`** | **`staging`** |
| Database | prod Postgres | **separate** staging Postgres (own data) |
| Dev login bypass (`000000`) | **off** — real SendGrid/Twilio codes | **on** — `DEVELOPER_*` set, so you can log in without real email/SMS |
| Image storage | prod Azure account | dev Azure account |
| JWT secret | prod | separate |

### Branch workflow — develop on `staging`, promote to `main`

```bash
# 1) build a feature on the staging branch
git checkout staging
# ...code, commit...
git push origin staging      # → auto-deploys to dashduckies-staging.up.railway.app

# 2) test on the staging server (log in with code 000000 — no real email/SMS needed)

# 3) promote to production
git checkout main
git merge staging
git push origin main         # → auto-deploys to dashduckies.up.railway.app
```

> ⚠️ **Do not push experimental work straight to `main`** — `main` is production. Use `staging`.
> Pushing to either branch triggers an automatic Railway deploy of that environment.

### Deploy mechanics & per-environment config

- Railway (railpack) runs `npm ci` → `npm run build` → `npm run start` (`node .output/server/index.mjs`).
- The web service (**"Web App"**) and a Postgres service live in the `dashduckies` Railway project;
  each environment has its own instance of both.
- Env vars are set **per environment** on the web service (Railway → service → Variables, with the
  environment selector). `DATABASE_URL` is a reference to `${{Postgres.DATABASE_URL}}` so each
  environment automatically points at its own Postgres.
- The per-environment branch is a Railway **deployment trigger** (prod→`main`, staging→`staging`).
- **Schema changes:** after editing `server/db/schema.ts`, run `npm run db:generate`, then apply to
  **each** database (`db:migrate` against staging's `DATABASE_URL`, then prod's). Staging and prod
  DBs are separate, so a migration must be run against both.

---

## Conventions & gotchas

- **`npm ci` is strict.** Railway builds with `npm ci`, which fails if `package-lock.json` is even
  slightly out of sync. After any dependency change, run `npm ci` locally and only commit the
  lockfile if it passes. (Prefer pinned versions over `latest`.)
- **Vuetify `<v-img>` lazy-loads** — add `eager` if you need the image in the SSR HTML (we do this
  for the hero/step/stickers images).
- **Soft deletes everywhere** — always filter `deleted_at IS NULL` for active rows.
- **Rate limiting** on submissions: 30/user, 5/IP per 10 min (`server/utils/rateLimit.ts`,
  in-memory / single instance).
- **Sightings with `0,0` coords are hidden** from maps (geocoding failed / no GPS).

---

## Known limitations / deferred

- Admin **sighting editing** endpoint/UI not ported (members + ducks admin are done).
- My-Ducks edit covers name/description/location; **image replacement** there isn't wired (admin
  duck edit does support image replace).
- Real **SendGrid/Twilio** delivery is unverified from the dev box (see testing notes).

---

## Environment variables

See `.env.example`. Summary (set the production values in Railway → Variables):

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres. Local = public proxy URL; prod = `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET`, `JWT_EXPIRATION_HOURS` | Session JWT signing (default 720h) |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` | Email codes |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` | SMS codes |
| `HERE_API_KEY`, `HERE_APP_ID` | Address → coordinates geocoding |
| `AZURE_STORAGE_CONNECTION_STRING` | Image storage (dev account locally, prod account on Railway) |
| `ADMIN_ACCOUNT_EMAIL` | Marked admin on startup |
| `ADMIN_NOTIFICATION_EMAILS` | Admin notification recipients |
| `DEVELOPER_EMAILS`, `DEVELOPER_PHONES` | **Local only** — dev login bypass (code `000000`). Never set in prod. |

> Never commit `.env` (it's gitignored). Secrets live in `.env` locally and Railway Variables in prod.
