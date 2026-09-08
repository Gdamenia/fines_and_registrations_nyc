# Tixradar — NYC Fines & Registration

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

Working plate & VIN lookup tool (web + mobile) with accounts, saved vehicles, fines, registration, and the redesigned **Tixradar** mobile experience. The mobile app now includes onboarding, auth, dashboard, garage, vehicle details, violation/payment flows, notifications, profile/settings, and a demo-preview mode for UI review. The backend still performs the hourly saved-car violation sweep and records notification events.

**Picking up on a new machine:**

```bash
nvm install && nvm use                               # repo pins Node 20.20.2 via .nvmrc
docker compose up -d                                 # starts Postgres (see CONTEXT.md)

cd server
npm install
cp .env.example .env                                 # fill in SOCRATA_APP_TOKEN + JWT_SECRET
npm run migrate                                       # creates users/cars/violations/etc.
npm start                                             # http://localhost:3001 — dashboard at /dashboard.html

cd ../mobile
nvm use                                             # mobile/.nvmrc uses Node 22.13+ for Expo SDK 57
npm install
EXPO_PUBLIC_API_BASE_URL=http://YOUR-LAN-IP:3001 npx expo start --lan
```

`mobile/src/api.ts` uses `EXPO_PUBLIC_API_BASE_URL` when provided and otherwise falls back to the previous development LAN URL. For a production App Store build, point this environment variable at an HTTPS API. See `mobile/TIXRADAR_UI.md` for the upgraded screen map and launch notes.
