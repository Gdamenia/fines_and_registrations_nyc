# Plate & VIN Lookup App

**→ Read [CONTEXT.md](CONTEXT.md) first, especially if you're an AI assistant picking this
up in a new session.** It documents non-obvious gotchas (a wrong-but-plausible dataset ID
that silently returns empty results, why CityPay can't be automated, decisions already made
and rejected) that aren't visible from the code alone.

Monorepo with two projects:

- **[server/](server/)** — Node/Express backend + web frontend.
  - Queries NYC DOF Open Parking and Camera Violations (`nc67-uf89`) and NY DMV vehicle
    registrations (`w4pv-hbkt`) via Socrata's public APIs.
  - Serves a plain HTML/JS web UI from `server/public/`.
- **[mobile/](mobile/)** — React Native (Expo) app, same functionality natively for iOS/Android.

## Status / next steps

Currently a working plate & VIN lookup tool (web + mobile), no accounts yet. In progress:
user accounts (email/password + Google sign-in), a Postgres database, saved cars per user,
an hourly cron job that re-checks all saved cars for new violations, and push notifications
when a new fine appears.

**Picking up on a new machine:**

```bash
cd server && npm install && cp .env.example .env   # fill in SOCRATA_APP_TOKEN once registered
npm start                                            # http://localhost:3000

cd ../mobile && npm install
npx expo start --lan                                 # then open in Expo Go on your phone
```

`mobile/src/api.ts` has `API_BASE_URL` hardcoded to a LAN IP for phone testing — update it to
match whatever machine is running `server/`.

Postgres: not yet installed/configured locally as of this commit — see [CONTEXT.md](CONTEXT.md)
for the full plan (custom email/password + Google OAuth, no third-party auth provider).
