# Tixradar UI/UX Upgrade

## Mobile app rebuilt

The Expo app in `mobile/` has been redesigned around the approved green / gray / white Tixradar direction and expanded from a basic lookup screen into a full product flow.

Implemented:
- Splash / brand screen
- 3-step onboarding
- Sign in
- Create account
- Demo preview mode
- Home dashboard with totals and quick actions
- Fixed bottom navigation
- Garage / My Vehicles
- Vehicle detail
- Plate lookup + results
- VIN registration lookup + results
- Add vehicle + success state
- Violations list + filters
- Violation detail
- Official CityPay handoff
- Notifications/activity
- More
- Profile & Settings
- Notification preference sheet
- Persistent onboarding and login session

## Backend additions

- Full-name support for account creation/login (`users.full_name`)
- New migration: `server/migrations/0002_profile_and_notification_feed.sql`
- New authenticated `GET /api/notifications` route
- Mobile API client now supports auth, cars, details, notifications, creation, lookup, and CityPay handoff flow
- Mobile API base URL can be configured with `EXPO_PUBLIC_API_BASE_URL`

## Brand assets

The final product brand is **Tixradar**. The supplied master SVG is preserved at `mobile/assets/Tixradar.svg`, with app-ready light/dark wordmarks, splash artwork, favicon, and square app-icon exports in `mobile/assets/`. The obsolete previous-brand concept boards were removed from the distributable project to avoid mixed branding.

## Production note

Apple/Google social login requires provider credentials and backend OAuth routes, which were not present in the supplied project. The buttons are visually included but should be wired or removed before store submission.

## Home / offers update (September 8, 2026)

- Removed the large dashboard hero image from the signed-in Home screen.
- Added a horizontally scrollable **Offers for you** section using the supplied offer-card artwork.
- Added a dedicated offer-detail route with an in-app **Claim 20% Off** state and copyable claim code placeholder for future partner integration.
- Replaced dashboard summary, quick-action, notification, back, and bottom-navigation glyphs with exports from the supplied SVG icon set.
- Updated the signed-in wordmark to the newly supplied black Tixradar SVG artwork.
- Replaced garage/vehicle-card art with the supplied sedan, SUV, and Jeep PNGs and reused those assets consistently on vehicle detail/success views.

## v1.5.0 dark redesign integration (September 12, 2026)

The `tixradar_v150` design/build (delivered as a full mobile+server project, not just
artwork) was merged in as the new source of truth for the mobile app. See its own
`SOCIAL_AUTH_SETUP.md` (copied in at the repo root) for the social-auth production checklist.

- **Mobile app (`mobile/App.tsx`, `src/api.ts`, `src/demo.ts`) replaced wholesale** with the
  v1.5.0 build: dark automotive theme (`app.json` `userInterfaceStyle: dark`), new
  `WelcomeScreen` (replaces the old 3-step `Onboarding`, offers "Continue as X" for a
  returning signed-in user), rebuilt single-flow `AuthScreen` with Apple/Google buttons (dev
  preview only — see `SOCIAL_AUTH_SETUP.md`), a new post-signup `ProfileSetupScreen`
  (nickname + avatar, mandatory before reaching Home) and `ProfileEditScreen`, a
  vehicle-shape picker (`VehicleIconSelector` / `vehicle_icon`) on add/edit vehicle, and new
  notification copy for `new_fine` vs `weekly_reminder` kinds.
- **Two RN-0.86-specific bugs that were already fixed once (see the "Machine-specific setup
  notes" sections below) reappeared in the v1.5.0 package and were re-fixed during this
  merge**: `styles.splashShade` used `StyleSheet.absoluteFillObject` again (doesn't exist in
  this RN version — reverted to `absoluteFill`), and `AppScroll`'s `refreshControl` prop was
  typed as bare `ReactElement` again (loosened back to `ReactElement<any>`). If a future
  Tixradar package import ever reintroduces either, that's why.
- **Known leftover dead code from the v1.5.0 package itself, left in place rather than
  silently deleted**: `VehiclesScreen`, `FinesScreen`, `MoreScreen`, `BottomNav`, `OfferCard`,
  `OfferDetailScreen`, and the `OFFERS` data are still defined in `App.tsx` but are no longer
  reachable from any route — the redesign collapsed bottom-tab navigation (Home / Vehicles /
  Fines / More) down to a single Home surface with everything reachable from there
  (`openMain()` now always forces the `home` tab). They don't affect the build (`tsc
  --noEmit` and `expo export --platform ios` are both clean) but are candidates for deletion
  in a future cleanup pass if nothing ever needs the old tab layout back.
- **Backend additions** (`server/src/`) to support the new screens, merged by hand rather
  than overwritten — the v1.5.0 package's `server.js` had *regressed* the AggregateError
  /empty-`err.message` fix documented below (dropped `sendError`/`errorMessage` and the
  catch-all JSON error middleware, and removed try/catch from a few routes again); the merge
  kept our existing error handling and added only the new pieces on top:
  - `PATCH /api/profile` (nickname) — `auth.js#updateProfile`.
  - `vehicle_icon` column on `cars` (migration `0004_vehicle_icon.sql`) threaded through
    `createCar`/`updateCar` and the `POST`/`PATCH /api/cars` routes.
  - `notification_events` gained `kind` / `title` / `body` / `reminder_key`, and
    `violation_id` is now nullable (migration `0003_weekly_fine_reminders.sql`), so a
    Monday-10am-America/New_York cron (`cron.js#runWeeklyFineReminders`) can create one
    `weekly_reminder` notification per car per week (deduped via `reminder_key`) for any car
    that still has an open balance, alongside the existing hourly `new_fine` sweep.
    `GET /api/notifications` was updated to `LEFT JOIN violations` (weekly reminders have no
    `violation_id`) and select the new columns.
  - Verified end-to-end against the local Postgres (`docker compose up -d`): ran
    `npm run migrate`, booted `server.js` under Node 20.20.2 (the `.nvmrc`-pinned version —
    `expo-server-sdk`'s ESM-only `push.js` still hard-crashes boot under this machine's
    default Node 20.12.2, same issue documented below), signed up, set a nickname via
    `PATCH /api/profile`, created a car with `vehicle_icon`, confirmed it round-trips through
    `GET /api/cars`, and manually invoked `runWeeklyFineReminders()` once to confirm the SQL
    and dedup key are correct against real dev data.
- **Web dashboard (`server/public/index.html`, `dashboard.html`) was not touched** — the
  v1.5.0 design/build only covers the mobile app; the web UI's own signup still asks for a
  full name up front and has no avatar/vehicle-icon concept. Not a regression, just
  out of scope for this design.
- Version bumped to 1.5.0 in `mobile/package.json` and `mobile/app.json`, matching the
  design's own bump.
