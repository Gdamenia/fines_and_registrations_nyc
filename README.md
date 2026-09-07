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

Working plate & VIN lookup tool (anonymous, web + mobile) **plus** accounts on the web side:
sign up / log in, save multiple cars (nickname + plate/state + optional VIN), see their
fines and registration, and an hourly cron job that rechecks every saved car and records
(and attempts to push-notify) any newly-found violation. See [CONTEXT.md](CONTEXT.md) for
the full picture, including what's explicitly not done yet — mobile screens for
accounts/dashboard are the next phase.

**Picking up on a new machine:**

```bash
nvm install && nvm use                               # repo pins Node 20.20.2 via .nvmrc
docker compose up -d                                 # starts Postgres (see CONTEXT.md)

cd server
npm install
cp .env.example .env                                 # fill in SOCRATA_APP_TOKEN + JWT_SECRET
npm run migrate                                       # creates users/cars/violations/etc.
npm start                                             # http://localhost:3001 — dashboard at /dashboard.html

cd ../mobile && npm install
npx expo start --lan                                 # then open in Expo Go on your phone
```

`mobile/src/api.ts` has `API_BASE_URL` hardcoded to a LAN IP for phone testing — update it to
match whatever machine is running `server/`. (Mobile doesn't have the accounts/dashboard
screens yet — only the original anonymous lookup.)
