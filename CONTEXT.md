# Project context for whoever (human or Claude) picks this up next

This file exists so a fresh session doesn't have to rediscover things the hard way —
several of these were found by trial and error and aren't obvious from the code alone.

## What this is

An app for checking NYC parking/camera violations and NY DMV registration info by plate
number or VIN, for a product that will let registered clients track their cars' fines.
Two clients share one backend:

- `server/` — Node/Express API + a plain HTML/JS web UI (`server/public/index.html`).
- `mobile/` — React Native (Expo, TypeScript) app, same functionality, native UI.

## Data sources — READ THIS BEFORE CHANGING DATASET IDS

- **Violations**: `https://data.cityofnewyork.us/resource/nc67-uf89.json` (Socrata dataset
  `nc67-uf89`, "Open Parking and Camera Violations", NYC DOF). Query with
  `$where=upper(plate)=upper('...') AND upper(state)=upper('...')`.
  - **Do not use `pxdn-gtu9`.** It looks like a valid dataset id and returns valid-looking
    JSON, but its own metadata (`/api/views/pxdn-gtu9.json`) reports `"assetType": "filter"`
    — it's a saved/filtered *view*, not the base table, and it silently returns empty
    results for plates that do have real violations. This cost real debugging time before
    the user independently found `nc67-uf89` and we confirmed the difference. If a dataset
    id ever needs re-verifying, check `"assetType"` in its metadata first — it must say
    `"dataset"`, not `"filter"`.
  - No `X-App-Token` is required for light testing, but the app is coded to send one
    automatically via `SOCRATA_APP_TOKEN` in `.env` once registered (raises rate limits).
  - `amount_due` is the authoritative paid/unpaid signal — `"0"` means paid/resolved/written
    off, anything higher is genuinely outstanding right now. Don't use `violation_status`
    for this — it's only populated after a hearing/dispute, blank otherwise.
  - `issue_date` is a plain `MM/DD/YYYY` string field, not a real date type.

- **Registration**: `https://data.ny.gov/resource/w4pv-hbkt.json` (Socrata dataset
  `w4pv-hbkt`, NY DMV "Vehicle, Snowmobile, and Boat Registrations"). **VIN-only** — there is
  no `plate` field in this dataset at all, by design: the federal Driver's Privacy Protection
  Act (DPPA) restricts public disclosure of plate-to-registration/owner linkage. Don't try to
  add plate-based lookup here; it doesn't exist and can't legally be added via public data.

## CityPay ("pay the fine") — dead ends already explored, don't redo them

`https://a836-citypay.nyc.gov/citypay/Parking` is NYC DOF's real-time payment portal.
Several automation approaches were tried and ruled out:

- **No live/real-time public API exists** for NYC parking tickets. CityPay is the only
  live source, and it's a plain HTML form, not an API.
- **Scraping/auto-submitting CityPay's form is blocked**: it's protected by Google
  reCAPTCHA Enterprise (confirmed — a raw POST returns "Unable to verify reCAPTCHA with
  Google"). Don't build a server-side scraper against it.
- **The `summons_image.url` field from the violations dataset is dead**: it points at
  `nycserv.nyc.gov/NYCServWeb/ShowImage`, which sits behind an Akamai WAF that 403s any
  direct/automated request (confirmed via curl, both HTTP and HTTPS). It's not shown in the
  UI anymore — deliberately removed.
- **No URL query parameters pre-fill CityPay's form fields** — confirmed by inspecting the
  page source; it's a plain POST form with no query-string handling in its JS. A `<select>`
  option for the violation-number tab has `id="violation-number"` / `name="VIOLATION_NUMBER"`
  if this ever needs re-checking.
- **X-Frame-Options: SAMEORIGIN + CSP** on CityPay's page — it cannot be iframed either.
- **Current approach**: the "Pay" button copies the summons # to the clipboard, shows a
  toast, and opens CityPay in a new tab/system browser. For power users on desktop web,
  there's an optional Tampermonkey userscript (`server/public/citypay-autofill.user.js`)
  that reads a `#summons=...` URL hash (never sent to CityPay's server) and fills the field
  automatically — but Tampermonkey is a browser extension the user has to install first, it
  is **not native to any browser**. This doesn't translate to mobile at all (no userscript
  managers on iOS/Android) — the mobile app just does copy + `Linking.openURL`.

## i18n

`server/public/index.html`, `server/public/dashboard.html` (each an inline `I18N` object)
and `mobile/src/i18n.ts` carry **duplicated** translation strings for `en`, `ru`, `ka`,
`es` — keep them in sync manually when adding UI text. Each also has its own copy of the
`VIOLATION_NAMES` lookup table for translating the raw English violation descriptions the
API returns (e.g. `"NO PARKING-STREET CLEANING"`) — anything not in that table falls back
to the original English string rather than breaking. Language choice is stored in
`localStorage` under the `lang` key and shared across `index.html` and `dashboard.html`.
Static markup is translated via `data-i18n` / `data-i18n-placeholder` attributes;
dynamically rendered strings go through the `t(key, vars)` helper.

## Mobile app specifics

- `mobile/src/api.ts` has `API_BASE_URL` **hardcoded to a LAN IP** for phone-over-WiFi
  testing during development. Update this to match whatever machine is actually running
  `server/` — `localhost` from the phone's perspective means the phone itself, not the dev
  machine. Currently `http://192.168.0.28:3001` — this MacBook's LAN IP + the port `server/`
  now runs on (see "Machine-specific setup notes" below for why it's 3001, not 3000).
- Built with Expo SDK 57 / React Native 0.86. There's an `AGENTS.md` in `mobile/` warning
  that Expo changed significantly in this version — check
  https://docs.expo.dev/versions/v57.0.0/ before assuming older Expo patterns still apply.
- Node.js on the original (Windows) dev machine was v20.11.0, below Expo SDK 57's stated
  minimum (`>=20.19.4`). It ran anyway with a warning there. **Fixed properly on this
  MacBook** — see "Machine-specific setup notes" below.
- Dev server run via `npx expo start --lan` (not `--tunnel` — that needs an extra
  interactively-installed `@expo/ngrok` package that failed in a non-interactive shell).

## Accounts + saved cars + cron + push

Status: **backend + web dashboard built and working (on the MacBook, this commit). Mobile
screens are the explicit next phase, not done yet** — the user asked for web first so the
pattern could be proven before duplicating it to Expo. If you're picking this up to build
the mobile side, read this whole section, then `mobile/src/api.ts` and `server/public/
dashboard.html` for the shape to mirror.

- **Auth: email/password only, built with our own logic** (bcryptjs + JWT), not a
  third-party provider (Supabase was offered earlier and declined in favor of full
  control). **Google sign-in was discussed as a possible future option early on but was
  never part of an actual build request — don't assume it's still wanted; ask before
  building it.** JWTs are long-lived (30d, see `server/src/auth.js`) since this is a
  personal-use app, not `expiresIn` tuned for anything security-sensitive.
- **Postgres**: `docker-compose.yml` at the repo root runs `postgres:16` on `5432`,
  credentials `plate_lookup`/`plate_lookup`/`plate_lookup` (fine for local dev, rotate
  before any real deploy). `docker compose up -d` starts it.
- **Migrations**: plain numbered `.sql` files in `server/migrations/`, run via
  `npm run migrate` (`server/src/db/migrate.js` — a ~40-line hand-rolled runner, no ORM,
  tracks applied files in a `schema_migrations` table). `0001_init.sql` has the full
  schema: `users`, `cars` (nickname + plate + state + vin, owned by a user), `violations`
  (one row per violation ever seen, `data` JSONB holding the full raw Socrata record plus a
  few pulled-out columns for querying — deduped by `(car_id, summons_number)`, **per-car
  not global**, so two users tracking the same physical plate each get their own copy and
  notifications), `registrations` (one row per car, replaced on each fetch — it's a live
  snapshot, not a log), `push_tokens` (Expo push tokens per user — empty until the mobile
  app registers one), `notification_events` (one row per new violation found, `sent_at`
  null until a push actually went out — doubles as a future "recent activity" feed).
- **Cars API** (`server/src/carsService.js`, mounted in `server.js`): `POST /api/cars`
  creates the car row *and* does the initial violations+registration fetch inline (not
  deferred to cron) so the dashboard has data immediately, per the product spec. Fetch
  failures don't block car creation (`Promise.allSettled` — a car should still get saved
  even if Socrata is down or the plate/VIN has nothing on file yet); the cron picks it up
  on the next sweep regardless. All car routes require `Authorization: Bearer <jwt>` via
  `requireAuth` middleware and are scoped to `req.userId` — verified there's no
  cross-user leakage (a car ID that exists but belongs to someone else 404s, not 403s, to
  avoid confirming the ID exists to a different user).
- **Cron** (`server/src/cron.js`, started from `server.js` on boot via `node-cron`,
  schedule `0 * * * *` — hourly on the hour): sequential over all cars, not parallel — a
  `Promise.all` here would just trade this problem for hitting Socrata's rate limit faster
  (see the "no `SOCRATA_APP_TOKEN`" gotcha above). One car's fetch failing (network error,
  Socrata down) logs and moves on rather than crashing the whole sweep. Verified end-to-end
  by hand: deleted a stored violation row and re-ran the sweep — it was correctly
  re-detected as "new," got a `notification_events` row, and a push send was attempted
  (and correctly left `sent_at` null since it's a fake token — see push section below).
- **Push** (`server/src/push.js`, `expo-server-sdk`): `POST /api/push-tokens` (also behind
  auth) lets a client register an Expo push token — nothing calls this yet since the
  mobile app doesn't have push registration wired up. `sendPushToUser()` silently does
  nothing (returns `{sent: 0, ...}`) if a user has zero registered tokens — this is the
  expected, normal state right now, not a bug. **Real delivery genuinely can't be verified
  until real App Store/Play Store apps exist and someone installs one** — per the user's
  own framing of this feature. What's built and confirmed working up to that point: token
  registration, storage, and the send-attempt-with-graceful-failure code path (tested with
  a well-formed-but-fake Expo token — the sweep completed, logged the failure, didn't
  crash, and left the notification_event unsent for a retry/inspection later instead of
  losing the fact that a new violation was found).
- **Web dashboard** (`server/public/dashboard.html`, linked from `index.html`'s header):
  login/signup tabs, add-car form (nickname + plate + state + optional VIN), car list with
  violation count / total due / registration presence, expandable per-car detail (full
  violations + registration), remove-car with a confirm prompt. Reuses `index.html`'s CSS
  variables and card/badge/kv classes for visual consistency but is **English only** — the
  4-language i18n system in `index.html` was not extended to it (a much bigger
  content-authoring task than "add a dashboard"; flagged to the user, not done unless
  asked). Verified with a real headless-browser run (Playwright, driven directly — no
  `chromium-cli` in this environment): signup → dashboard → add a real plate → violations
  render with correct paid/due badge coloring, zero console errors.
- **Not done / explicitly deferred**:
  - Mobile screens (signup/login/dashboard) — next phase, see top of this section.
  - Google sign-in — see auth bullet above.
  - Email verification, password reset — never asked for; signup activates immediately.
  - Rate limiting on `/api/auth/*` — worth adding before this is ever internet-facing
    somewhere real; not done for local dev.
  - A uniqueness check on (user, plate) — a user can currently add the same plate twice as
    two separate car rows. Not asked for either way; flagging in case it surprises someone.
  - **Hosting for the always-on server + cron is still explicitly deferred** — keep
    developing against `localhost` for now; ask before building deploy-specific config.

## Machine-specific setup notes (this MacBook, first session here)

- **Node version pinned via `.nvmrc` → 20.20.2.** Installed via `nvm install` (not set as the
  global default — only pinned for this project via `.nvmrc`, so other projects on this
  machine keep whatever Node they were already using). Reinstalled `mobile/node_modules`
  under it; the `EBADENGINE` warning mentioned above is gone as of this commit.
- **`server/.env`'s `PORT` moved from 3000 → 3001.** Port 3000 on this machine is already
  taken by an unrelated project's (`revotrac-front-end`) Vite dev server — confirmed via
  `lsof -i :3000` before touching anything. `.env`, `.env.example`, and `mobile/src/api.ts`'s
  `API_BASE_URL` were all updated to match. Don't assume 3000 is free on any given machine
  without checking first — this one silently wasn't.
- Both changes verified end-to-end: `server` boots, `/health` responds, and a live
  `/api/violations` call against the real Socrata endpoint returned successfully.

## Machine-specific setup notes (back on the original Windows machine, merging in the MacBook's work)

The MacBook session's `TIXRADAR.zip` (full backend accounts/Postgres/cron/push + the
redesigned "Tixradar" mobile app) was merged into this repo, replacing `server/` and
`mobile/` wholesale. Verifying it here surfaced real bugs worth knowing about:

- **`expo-server-sdk` is an ESM-only package** (`"type": "module"` in its own
  `package.json`) — `require()`-ing it from CommonJS (`server/src/push.js`) throws
  `ERR_REQUIRE_ESM` on Node < 20.19, because synchronous `require()` of an ESM module is
  only supported from Node 20.19+ (and stable/unflagged from 22.12+). This machine's Node
  was v20.11.0 (below the `.nvmrc`-pinned 20.20.2) and hit this immediately as a hard crash
  on `server` boot, not just an `EBADENGINE` warning like before — adding `push.js` in the
  MacBook session turned a soft version mismatch into a real blocker. **Fixed by upgrading
  Node globally to v24.19.0** via `winget install --id OpenJS.NodeJS.LTS` (satisfies both
  the server's ≥20.19 need and `mobile/.nvmrc`'s ≥22.13 for Expo SDK 57 in one install, so
  no per-project nvm juggling was needed here — if that changes, revisit).
- **Found via the Node crash, but a real bug independent of it**: when `DATABASE_URL` is
  unreachable, `pg`'s connection attempt on this Node version throws an `AggregateError`
  (dual-stack `::1` + `127.0.0.1` both refusing) whose top-level `.message` is `""` by
  design — the real messages are nested in `.errors[]`. Every route handler in
  `server/src/server.js` was doing `res.json({ error: err.message })`, so any DB-down
  failure surfaced to the client (and to server logs — there wasn't any `console.error`
  either) as a silent, content-free `{"error":""}`. **Fixed**: added an `errorMessage()`
  helper that falls back to `.errors[].message`, a `sendError()` wrapper that also
  `console.error`s server-side, applied it to every route (including three —
  `GET /api/cars`, `GET /api/cars/:id`, `GET /api/notifications` — that had no try/catch at
  all before, relying on Express 5's automatic async-rejection forwarding to its *default*
  HTML error page, which the JSON-only clients can't parse), and added a catch-all JSON
  error middleware as a final safety net. This wasn't Windows-specific — it would misfire
  identically on the Mac any time Postgres is unreachable — worth keeping.
- **`mobile/App.tsx` had three latent bugs that only a real typecheck/bundle surfaced**
  (the MacBook session's own notes don't mention running `tsc` or forcing a Metro bundle,
  only that it typechecked — these must have been introduced in the "Home / offers update"
  pass mentioned in `UPGRADE_SUMMARY.md`, since that's the most recent asset-touching
  change):
  1. `CAR_DARK` was referenced (in `VehiclesIllustration`) but its `require('./assets/
     car-dark.png')` constant was never declared — the asset file exists, just the binding
     was missing. Added it next to the other `CAR_*` consts.
  2. `AppScroll`'s `refreshControl` prop was typed as a bare `ReactElement`, which doesn't
     structurally satisfy `ScrollView`'s expected `ReactElement<RefreshControlProps>`.
     Loosened to `ReactElement<any>`.
  3. `StyleSheet.absoluteFillObject` doesn't exist in RN 0.86 — confirmed by reading the
     installed package's own source (`node_modules/react-native/Libraries/StyleSheet/
     StyleSheetExports.js`): only `absoluteFill` (the plain spreadable object) is exported
     now. Renamed the one usage in `splashShade`.
  - All three fixed; `npx tsc --noEmit` is clean and `npx expo start` produces a working
    4.4MB bundle with no errors as of this commit. If TIXRADAR-derived mobile work ever
    gets re-imported from another machine again, run both of those checks before assuming
    "it worked on the other machine" means it's actually sound.
- **Postgres is still not running on this Windows machine** (no Docker, no local Postgres
  install — same limitation as before the MacBook work existed). `server` boots fine and
  the plate/VIN lookup routes work (they don't touch the DB), but every auth/cars/
  notifications route correctly 500s with a real "connect ECONNREFUSED" message now. Get
  `docker compose up -d` (or an equivalent Postgres) running here before trying to exercise
  signup/login/cars end-to-end on this machine.
- `server/.env` was recreated here (it's gitignored, wasn't in the zip) with the same
  `docker-compose.yml`-matching `DATABASE_URL` default and a freshly generated `JWT_SECRET`
  — this machine's JWT secret is now **different** from the MacBook's, which is correct/
  expected (tokens shouldn't be portable across environments) but means a token minted on
  one machine won't verify on the other.
- This machine's LAN IP is `192.168.0.83` (`ipconfig`), not the MacBook's `192.168.0.28` —
  `mobile/src/api.ts`'s hardcoded fallback still says `192.168.0.28`. It wasn't changed,
  since the recommended path is now `EXPO_PUBLIC_API_BASE_URL=http://192.168.0.83:3001 npx
  expo start --lan` per the README, not editing the fallback — but if something reads the
  fallback without setting that env var, it'll silently try to reach a Mac that may not be
  on the network.

## Machine-specific setup notes (the MacBook, first session there)

- **Node version pinned via `.nvmrc` → 20.20.2.** Installed via `nvm install` (not set as the
  global default — only pinned for this project via `.nvmrc`, so other projects on this
  machine keep whatever Node they were already using). Reinstalled `mobile/node_modules`
  under it; the `EBADENGINE` warning mentioned above is gone as of this commit.
- **`server/.env`'s `PORT` moved from 3000 → 3001.** Port 3000 on this machine is already
  taken by an unrelated project's (`revotrac-front-end`) Vite dev server — confirmed via
  `lsof -i :3000` before touching anything. `.env`, `.env.example`, and `mobile/src/api.ts`'s
  `API_BASE_URL` were all updated to match. Don't assume 3000 is free on any given machine
  without checking first — this one silently wasn't.
- Both changes verified end-to-end: `server` boots, `/health` responds, and a live
  `/api/violations` call against the real Socrata endpoint returned successfully.

## Repo hygiene notes

- `node_modules/` and `.env` are gitignored in both `server/` and `mobile/` — always
  `npm install` after cloning, and copy `server/.env.example` to `server/.env`.
- `mobile/` was originally scaffolded by `create-expo-app`, which auto-runs `git init`
  inside it — that nested `.git` was deleted so this is one single monorepo, not a
  submodule. If re-scaffolding any Expo project into this repo again, remember to remove
  its auto-created `.git` before committing.
