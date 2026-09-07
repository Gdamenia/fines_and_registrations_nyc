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

Both `server/public/index.html` (inline `I18N` object) and `mobile/src/i18n.ts` carry
**duplicated** translation strings for `en`, `ru`, `ka`, `es` — keep them in sync manually
when adding UI text. There's also a separate `VIOLATION_NAMES` lookup table in both places
for translating the raw English violation descriptions the API returns (e.g.
`"NO PARKING-STREET CLEANING"`) — anything not in that table falls back to the original
English string rather than breaking.

## Mobile app specifics

- `mobile/src/api.ts` has `API_BASE_URL` **hardcoded to a LAN IP** (`http://192.168.0.83:3000`)
  for phone-over-WiFi testing during development. Update this to match whatever machine is
  actually running `server/` — `localhost` from the phone's perspective means the phone
  itself, not the dev machine.
- Built with Expo SDK 57 / React Native 0.86. There's an `AGENTS.md` in `mobile/` warning
  that Expo changed significantly in this version — check
  https://docs.expo.dev/versions/v57.0.0/ before assuming older Expo patterns still apply.
- Node.js on the original dev machine was v20.11.0, below Expo SDK 57's stated minimum
  (`>=20.19.4`). It ran anyway with a warning, but this should be fixed properly (upgrade
  Node) rather than relied on continuing to "just work."
- Dev server run via `npx expo start --lan` (not `--tunnel` — that needs an extra
  interactively-installed `@expo/ngrok` package that failed in a non-interactive shell).

## In-flight feature: accounts + saved cars + cron + push (not started yet)

The next ask from the user, decided but **not yet built**:

- Users sign up via email/password **or** Google sign-in.
- **Explicit decision: rolling our own auth, not a third-party provider** (Supabase was
  offered and declined in favor of full control).
- **Explicit decision: Postgres** for the database (not SQLite) — but as of this commit,
  **no Postgres instance exists yet**. Neither Postgres nor Docker was installed on the
  original dev machine (Windows, no admin Postgres install done, no Docker Desktop). The
  user opted to continue this work from a MacBook that already has Postgres/Docker
  available, rather than provision a hosted free-tier Postgres (Neon etc.) from the Windows
  machine. **First step on the new machine: get a real Postgres instance running before
  writing any schema/migration code.**
- Planned schema (not yet created): `users`, `cars` (plate + state + VIN + owner),
  `violations` (per car, deduped by `summons_number`), `registrations` (per car, by VIN),
  plus a push-token table for Expo push notifications.
- Planned behavior: adding a car does an immediate fetch/store of violations+registration.
  A per-car "Update" button does an on-demand re-fetch/diff for just that car. An hourly
  cron job sweeps *all* saved cars, diffs against stored violations, and sends an Expo push
  notification (+ DB insert) for anything newly found.
- **Hosting for the always-on server + cron is explicitly deferred** — the user chose to
  keep developing against `localhost` for now and pick real hosting (Railway/Render/Fly.io/
  etc.) once the feature set works. Don't assume a hosting target; ask before building
  deploy-specific config.

## Repo hygiene notes

- `node_modules/` and `.env` are gitignored in both `server/` and `mobile/` — always
  `npm install` after cloning, and copy `server/.env.example` to `server/.env`.
- `mobile/` was originally scaffolded by `create-expo-app`, which auto-runs `git init`
  inside it — that nested `.git` was deleted so this is one single monorepo, not a
  submodule. If re-scaffolding any Expo project into this repo again, remember to remove
  its auto-created `.git` before committing.
