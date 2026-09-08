# Tixradar mobile UI upgrade

This folder now contains the full mobile experience designed from the approved green / soft-gray / white Tixradar direction.

## Included screens

- Splash + 3-step onboarding
- Sign in + create account
- Optional demo preview for design review without a backend
- Home dashboard
- Plate lookup + results
- VIN / registration lookup + results
- My Vehicles / garage
- Add Vehicle + success state
- Vehicle detail
- Violations list + filters
- Violation detail
- CityPay handoff screen
- Notifications / activity
- More / Profile & Settings
- Notification preference sheet

## API setup

`src/api.ts` reads the backend URL from `EXPO_PUBLIC_API_BASE_URL`.

Example local value:

```text
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:3001
```

For TestFlight / App Store builds this should be an HTTPS production API URL.

## Backend changes included in this repo

- `server/migrations/0002_profile_and_notification_feed.sql` adds `users.full_name`.
- Auth signup accepts `fullName`; auth responses return `full_name`.
- `GET /api/notifications` exposes the user's recorded notification events for the mobile activity feed.

## Before App Store submission

The Apple and Google sign-in buttons are intentionally visual placeholders because the existing backend has no OAuth provider credentials/routes yet. Either wire them to production OAuth or remove them before submission.

The CityPay flow copies the summons number and opens the official NYC CityPay page because the external form cannot be safely pre-filled through a supported public deep-link parameter.
