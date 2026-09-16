# @hermes/mobile

Native iOS and Android apps, built with Expo (SDK 57, New Architecture, Expo Router).
**One codebase, nineteen store listings** — see "Nineteen apps from one codebase" below.

The marketplace build has two modes:

- **Browse / Search / Saved** — open to everyone, no account.
- **Owner dashboard** — WhatsApp OTP sign-in, leads for listings registered to
  that number.

## Running it

```bash
npm install            # from the repo root
npm run mobile         # Expo dev server
npm run mobile:ios     # build + launch on an iOS simulator
npm run mobile:android # build + launch on an Android emulator
```

Run those from the repo root — each one is a workspace script, so npm sets the working
directory to this package for you. The command that must **not** be run from the root is a
bare `npx expo start`. Expo would treat the monorepo itself as the project, find no `main`
in the root `package.json` and no `App.tsx` beside it, and fail with:

```
Unable to resolve "../../App" from "node_modules/expo/AppEntry.js"
```

Use `npm run app -- <id>` (see "Nineteen apps from one codebase") or `npm run mobile`,
which both start Expo with `apps/mobile` as the working directory. The tell-tale sign of
the mistake is a `.expo/` directory appearing in the repo root.

### Required environment

Nothing is committed. `app.config.ts` reads these from the build environment:

| variable                              | what it is                                    |
| ------------------------------------- | --------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`            | same project the web app reads                 |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`| the **publishable** key — never the service key |
| `EXPO_PUBLIC_WEB_BASE_URL`            | origin of the deployed web app, for OTP        |

`lib/config.ts` throws at boot if the Supabase values are missing, rather than
rendering an empty directory that looks like a data problem.

In development `EXPO_PUBLIC_WEB_BASE_URL` must be a LAN address
(`http://192.168.x.x:3001`) — on a phone or simulator, `localhost` is the device.

## Nineteen apps from one codebase

This app is not one app. `targets.mjs` defines nineteen store listings — six wellness
apps, seven product apps, three directory apps and three games — and `APP_TARGET` decides
which one a build is:

```bash
APP_TARGET=breathe npx expo start          # run the Breathe app
APP_TARGET=toolbox npx expo start          # run the toolbox instead
npx expo start                             # no target = the marketplace
```

Everything a store listing is judged on comes from that one word, resolved in
`app.config.ts` and read back at runtime by `lib/target.ts`:

| | comes from | example (`APP_TARGET=breathe`) |
| --- | --- | --- |
| name, slug, scheme | target | `Breathe: Slow Breathing` / `breathe` |
| bundle id / package | target | `co.dropby.breathe` |
| icon, adaptive icon, splash | `assets/targets/<id>/` | `assets/targets/breathe/icon.png` |
| accent colour | target | `#0891b2` |
| permissions | target | `INTERNET` only — no camera |
| **first screen** | `FIRST_ROUTE` in `targets.mjs` | `/breathe` |

The first screen matters most. Each app opens on its own product: `app/index.tsx` reads
the target and redirects. Four targets have `firstRoute: null` because their screen is
not built yet — those builds say so on screen rather than opening the marketplace and
calling it Room Redesign, which is a fast route to an Apple 4.3 rejection.

Products live in `lib/products.ts`, the registry `targets.mjs` has always pointed at.
It records each product's screen and its state, so "what does this listing still owe"
is answerable in one place:

```bash
node -e "import('./apps/mobile/lib/products.ts')"   # or just read the file
```

### Store art

```bash
npm run icons -w @hermes/mobile        # regenerate 19 icon sets from targets.mjs
```

These are generated monograms — distinct, shippable placeholders. Replace them with
designed art before publishing, keeping the paths: `assets/targets/<id>/icon.png` (1024,
opaque), `adaptive-icon.png` (1024, transparent, inside the Android safe zone),
`splash-icon.png` (512, transparent).

### Building one app

```bash
npm run eas:profiles -w @hermes/mobile     # regenerate a profile per target
eas build --profile breathe --platform ios
eas build --profile toolbox --platform all
```

A profile per target rather than an environment variable, because `eas build` evaluates
`app.config.ts` on EAS's servers — a variable exported in your shell never reaches the
builder. Each profile carries its own update channel, so an over-the-air update for one
app cannot land on another.

Adding a target: add it to `targets.mjs`, add its `FIRST_ROUTE`, add a `MARK` entry in
`scripts/make-app-icons.mjs`, then run `npm run icons` and `npm run eas:profiles`.

Adding a **game** target is that list plus two, because a game screen is the whole app:
register a probe in `scripts/interactions.mjs` and a capture in `scripts/app-shots.mjs` (a
PNG of a game that cannot score looks exactly like one that can), and keep the rules in a
`lib/*.ts` module with no renderer in it — `lib/block-clear.ts` is the pattern, and
`npm run check:game` asserts it in plain Node.

Two gates run against the fleet — before every store build, and on demand:

```bash
npm run check:targets -w @hermes/mobile              # are two listings too alike to pass review?
npm run check:fleet   -w @hermes/mobile              # does each one resolve to a real app?
npm run check:fleet   -w @hermes/mobile -- --require-ready   # exit 1 unless every app is publishable
npm run check:game                                   # do the game's rules still hold?
```

`check:targets` is the spam/4.3 gate. `check:fleet` resolves the real `app.config.ts` for
all nineteen and asserts a unique name, slug and bundle id, art on disk, and a first
screen that exists — then reports how much of each listing is actually built. It exits 0
while apps are still owed a screen, so it can be run daily; `--require-ready` is the
release form that refuses.

`check:game` (root, `scripts/check-block-clear.mjs`) loads the Block Clear engine directly
and asserts placement, line clearing, the combo rule, the end condition and the rewarded
tray's promise. It needs no browser on purpose: the probes in `scripts/interactions.mjs`
prove the screen *responds*, but they only run where Playwright and a preview exist.

### Where the product list lives

The hub (`app/tools/index.tsx`) renders `TARGET.products` through `lib/products.ts`. A
target shows exactly what its listing promises and nothing else — the toolbox used to
offer the passport photo, the PDF toolkit and the invoice, which are three *other*
targets' products, and an app advertising its siblings is the signal both stores reject.
To give a target a product, add the slug in `targets.mjs`; there is no second list.

## Native builds

```bash
npx eas login
npx eas build:configure                       # once — writes the EAS project id
npm run build:preview -w @hermes/mobile       # internal .apk / ad-hoc .ipa
npm run build:ios     -w @hermes/mobile       # App Store
npm run build:android -w @hermes/mobile       # Play Store (.aab)
```

Store credentials are yours to supply: EAS will prompt for an Apple Developer
account on the first iOS build and generate an Android keystore it then manages.
Put the three `EXPO_PUBLIC_*` values in **EAS secrets**, not in the repo.

`ios/` and `android/` are generated by `expo prebuild` and are **gitignored**.
Checking them in means every native config change has to be made twice — once in
`app.config.ts` and once by hand — and the two drift. Write a config plugin
instead. If you ever genuinely need to hand-edit native code, un-ignore them in
the same commit and say why.

## Shipping another tenant

Set `BRAND_SLUG`, `BRAND_NAME`, `BRAND_BUNDLE_ID`, `BRAND_PRIMARY`,
`BRAND_SECONDARY`, `BRAND_ACCENT` and re-run prebuild. No code changes. Runtime
brand switching was deliberately not built — it would put a brand picker in
front of a user who only ever wanted one of them.

## Wellness data and the database

The six wellness screens (breathe, stretch, walk, water, japa, sleep) split their data
in two, on purpose:

| Data | Where it lives | Why |
|---|---|---|
| Sessions and daily counts | Supabase (`wellness_sessions`, `wellness_daily`) | The only thing a person would miss if they lost the phone |
| Goals, phrase, offline cache, pending-write queue, install token | `AsyncStorage` | Cheap to re-enter, meaningless without the sessions, and the token must never leave the device |
| Everything else in the app | as before | — |

There is no login. Each install mints a random token on first use, keeps it in
`AsyncStorage`, and sends it as the `x-wellness-token` header. The migration
(`supabase/migrations/20260917000000_wellness_sync.sql`) stores only the SHA-256 of that
header, computed in SQL, and every row policy compares against it — so the database never
holds a usable credential, a request can only touch its own rows, and the client needs no
crypto library (Hermes has no WebCrypto).

The consequence, stated on the Profile page too: the token does not travel. Reinstalling
the app or moving to a new phone starts a new record, and the old rows become unreachable.
That is the trade for not asking anyone to sign up.

`lib/wellness-db.ts` is the network half; `lib/session.ts` is the offline-first store every
screen reads. Writes land locally first and drain through a queue, so the app stays correct
in aeroplane mode. The `SyncBadge` under each screen title reports which half is current
rather than implying a backup that has not happened.

## Design tokens

Colours are **generated** from the web app's `apps/web/app/globals.css`:

```bash
npm run tokens         # from the repo root
```

Re-run after changing a colour token on the web side. One-way on purpose: two
hand-maintained palettes drift within a week.

Everything else in `@hermes/tokens` (type scale, spacing, radii, springs,
elevation) is hand-written, because React Native has no `clamp()`, no `em`, no
cascade, and a per-platform shadow model.

### Deliberate divergences from web

1. **Font weights.** RN accepts only 100–900 in hundreds. The web scale uses a
   real variable axis (620, 760, 540), so each native entry snaps to the nearest
   legal weight and records the web value it maps to, in
   `packages/tokens/src/index.ts`.
2. **Brand tints.** Web uses `color-mix(in oklab, …)`. RN has no such function,
   so `brandTokens()` does the same mixes numerically in sRGB. Identical ratios,
   different colour space; not visible at the alphas in use.
3. **No `react-native-web` target.** `platforms` is `["ios", "android"]`. A web
   target would produce a second, worse version of a site that already exists.

## Monorepo notes (not boilerplate — removing these breaks the build)

- `metro.config.js` sets `watchFolders`, `nodeModulesPaths` and
  `extraNodeModules`. tsconfig `paths` are a type-checker concern only; Metro
  has its own resolver and needs the workspace packages mapped explicitly, or
  they typecheck fine and fail at bundle time.
- `metro.config.js` sets `EXPO_ROUTER_APP_ROOT`. It is otherwise derived from the
  process cwd, which in a workspace is the repo root.
- `metro.config.js` deliberately does **not** set `disableHierarchicalLookup`.
  That is Expo's advice for pnpm; with npm's hoisting it breaks expo-router's
  internal `@expo/metro-runtime` import.
- `metro.config.js` pins `react` / `react-dom` / `react-native` to **this app's**
  copies via `resolveRequest`. Next 16 needs React 19.2.4 and RN 0.81 needs
  exactly 19.1.0, so npm hoists 19.2.4 to the root and nests 19.1.0 here; Metro
  resolves hierarchically from the importing file, so the renderer and React end
  up on different versions and the app dies at launch with "Incompatible React
  versions". `nodeModulesPaths` does not fix it — that list is only consulted
  after the normal upward walk fails.
- The **root** `package.json` lists `expo-router` in `devDependencies`. The web
  app never imports it. `babel-preset-expo` hoists to the root and decides
  whether to enable the router transform via `require.resolve('expo-router')`
  from its own location; with `expo-router` nested under `apps/mobile` that
  lookup fails, the transform silently never runs, and the bundle dies with a
  confusing `require.context` error.
