## Why

The backend currently implements Google Sign-In using a manual `fetch` call to Google's `tokeninfo` endpoint, which only validates the token audience and does not verify the token signature, issuer, or expiration claims. To align with the security requirements in `BACKEND_GOOGLE_SIGNIN.md` and protect against forged or replayed tokens, we need to migrate verification to the official `google-auth-library` and harden the user model for OAuth accounts.

## What Changes

- Add `google-auth-library` as a runtime dependency.
- Create a reusable `src/services/googleAuth.js` service that verifies Google ID tokens using `OAuth2Client.verifyIdToken`, validating signature, `aud`, `iss`, and `exp` claims.
- Refactor `POST /v1/auth/google` in `src/routes/auth.js` to delegate verification to the new service and keep user find/create behavior consistent with the existing email/password flow.
- Update the `User` model to add a sparse unique index on `providerId` so Google users are uniquely keyed without conflicting with email/password users.
- Update environment variable guidance: verify `GOOGLE_CLIENT_ID` is the Web application client ID used as the server audience.

## Capabilities

### New Capabilities

- `google-sign-in`: Server-side Google Sign-In using `google-auth-library` token verification, find-or-create user handling, and issuance of NutriSimple access/refresh tokens.

### Modified Capabilities

<!-- No existing openspec specs are being modified at the requirement level. -->

## Impact

- `src/routes/auth.js`: refactored Google route.
- `src/services/googleAuth.js`: new token verification service.
- `src/models/User.js`: sparse unique index on `providerId`.
- `package.json` / `package-lock.json`: new `google-auth-library` dependency.
- Environment variables: `GOOGLE_CLIENT_ID` (Web application client ID) must be set; optional `GOOGLE_ANDROID_CLIENT_ID` and `GOOGLE_IOS_CLIENT_ID` are no longer used for audience validation.
