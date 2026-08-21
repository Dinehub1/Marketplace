# Hermes

Multi-tenant local business directory. One backend, three deliverables:

```
.
├── apps/
│   ├── web/         Next.js 16 — 27 brand sites on one multi-tenant router
│   └── mobile/      Expo (iOS + Android) — SarkarMarketplace
├── packages/
│   ├── core/        Domain logic shared by both apps (slugs, formatting, links)
│   └── tokens/      Design system — colours GENERATED from the web's globals.css
├── supabase/        Migrations and edge functions
└── docs/
```

npm workspaces. The repo root is a workspace root and nothing else — it has no
application code and no runtime dependencies.

## Commands (all from the repo root)

```bash
npm install                 # installs every workspace
npm run dev                 # web dev server
npm run build               # web production build
npm run typecheck           # every workspace
npm run tokens              # regenerate native colours from globals.css
npm run mobile              # Expo dev server
npm run mobile:ios          # Expo on an iOS simulator
```

## Environment

`apps/web/.env` — Next.js loads `.env` from the app directory, **not** the repo
root, so a file at the root is silently never read. See `.env.example`.

The mobile app does not read `.env`. React Native has no dotenv at runtime; its
config comes from `apps/mobile/app.config.ts`, which reads `EXPO_PUBLIC_*` from
the build environment. See `apps/mobile/README.md`.

## What is actually shared, and what is not

**Shared:** design tokens and domain logic. A category slug, a cleaned business
name and a `wa.me` link are computed by the same code on both platforms, so the
two products can never disagree about their own data. Colours are generated
one-way from `apps/web/app/globals.css` — two hand-maintained palettes drift
within a week.

**Not shared: the components themselves.** Sharing rendering across web and
native means `react-native-web`, and that would be a downgrade, not an upgrade.
The web UI is built on things `react-native-web` cannot express: `backdrop-filter`
materials, `:hover` and `:focus-visible`, `prefers-reduced-motion` and
`prefers-contrast` media queries, fluid `clamp()` type, and a variable font axis.
Collapsing to the lowest common denominator would cost all of it to save
duplicating some layout markup.

So `BusinessCard` exists twice — once in `apps/web/components/directory/` and
once in `apps/mobile/components/` — and both call the same `@hermes/core`
functions and read the same `@hermes/tokens` values. What must agree, agrees;
what should differ per platform, differs.

## Deployment

**Web (Vercel).** The root `vercel.json` builds the workspace, so the Vercel
project's **Root Directory** should stay at the repo root. If you would rather
set Root Directory to `apps/web` in the dashboard, delete `vercel.json` in the
same change — having both is what produces "no Next.js version detected".

**Web (pm2).** `ecosystem.config.js` runs `next start` with `cwd` set to
`apps/web`. It resolves the `next` binary from the hoisted root `node_modules`.

**Mobile.** EAS. See `apps/mobile/README.md`.
