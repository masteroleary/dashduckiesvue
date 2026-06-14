# Dash Duckies

Global rubber-duck tracking platform. A ground-up rewrite of the legacy Blazor .NET app,
built on **Nuxt 3** and deployed on **Railway**.

## Stack

- **Nuxt 3** — single app:
  - **SSR** public pages (`/`, `/quackertracker/[id]`, `/stickers`, `/contact`, `/terms`, ...) for SEO
  - **client-only SPA** at `/app/**` (`ssr: false`) for the member + admin areas
  - **Nitro** server routes (`server/api/**`) for the REST API
- **Vuetify** (via `vuetify-nuxt-module`) for UI
- **Drizzle ORM** + **Postgres** (Railway)
- **Azure Blob Storage** for images
- Auth: email/SMS verification → JWT in an **HTTP-only cookie** (shared across SSR + SPA)

## Local development

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL etc.
npm run dev            # http://localhost:3000
```

## Database (Drizzle)

```bash
npm run db:generate    # generate SQL migration from server/db/schema.ts
npm run db:migrate     # apply migrations to $DATABASE_URL
npm run db:studio      # browse data
```

## Deploy

Push to `main` → Railway builds (`npm run build`) and starts (`npm run start`,
i.e. `node .output/server/index.mjs`) → live at `dashduckies.up.railway.app`.
Set environment variables (see `.env.example`) in Railway → service → Variables.
