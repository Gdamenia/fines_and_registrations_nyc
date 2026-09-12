# Google / Apple sign-in before release

Tixradar v1.5.0 includes the complete Google/Apple registration UX and routes both providers through the same nickname + avatar setup used by email registration.

For development/browser UX testing, the social buttons create a development-only preview session so the complete flow can be reviewed immediately.

Before a production App Store build, replace that preview bridge with real provider authentication:

1. Configure Sign in with Apple for the iOS bundle identifier in Apple Developer.
2. Configure Google OAuth client IDs for iOS / Android / web as required.
3. Exchange the provider identity token with the Tixradar API.
4. Verify Google / Apple tokens server-side before creating or signing in a user.
5. Link provider identities to the existing users table and keep email/password login as a separate supported method.

Do not ship the development preview social-auth fallback as production authentication.
