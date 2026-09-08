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
