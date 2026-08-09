## Context

The 24fit backend is an Express/Mongoose JavaScript application. Authentication is handled in `src/routes/auth.js`, with JWT helpers in `src/utils/jwt.js` and the `User` model in `src/models/User.js`.

A `POST /v1/auth/google` route already exists, but it calls `https://oauth2.googleapis.com/tokeninfo` directly with `fetch`. That endpoint returns token metadata but does not cryptographically verify the ID token's signature, issuer (`iss`), or expiration (`exp`). It also accepts multiple mobile client audiences (`GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`) rather than treating the backend's Web client ID as the single server audience. The new guide (`BACKEND_GOOGLE_SIGNIN.md`) requires server-side verification via `google-auth-library`, using only the Web application `GOOGLE_CLIENT_ID` as the audience.

## Goals / Non-Goals

**Goals:**
- Replace the manual `tokeninfo` verification with `google-auth-library` (`OAuth2Client.verifyIdToken`).
- Validate `aud`, `iss`, and `exp` claims on every Google ID token.
- Keep the existing route contract (`POST /v1/auth/google`, request/response shape, token issuance) unchanged for mobile clients.
- Enforce a sparse unique index on `User.providerId` to prevent duplicate Google accounts without affecting email/password users.

**Non-Goals:**
- Account linking between email/password and Google accounts.
- New client SDK configuration or mobile UI changes.
- Changes to access/refresh token formats or expiry values.

## Decisions

1. **Use `google-auth-library` instead of `fetch` to `tokeninfo`**
   - **Rationale**: `verifyIdToken` performs full JWT validation (signature, issuer, audience, expiry) using Google's published keys. This is the approach documented in `BACKEND_GOOGLE_SIGNIN.md` and is the recommended pattern for server-side Google Sign-In.
   - **Alternative considered**: Keep `fetch` to `tokeninfo` and add manual signature verification. Rejected because it is more error-prone and requires key-caching logic that the library already provides.

2. **Single audience: `GOOGLE_CLIENT_ID` (Web application client ID)**
   - **Rationale**: Mobile clients must send ID tokens minted for the Web audience (`serverClientId`). This matches the guide and prevents accepting tokens intended for other app audiences.
   - **Alternative considered**: Continue accepting Android/iOS client IDs. Rejected because it weakens audience validation and is not what the guide specifies.

3. **Create a dedicated `src/services/googleAuth.js` service**
   - **Rationale**: Isolates Google-specific logic, makes it testable, and keeps `src/routes/auth.js` focused on HTTP concerns.
   - **Alternative considered**: Inline `OAuth2Client` usage in the route. Rejected because it complicates testing and reuse.

4. **Sparse unique index on `providerId`**
   - **Rationale**: The field is only set for Google users. A sparse index enforces uniqueness for those users while allowing `null`/`undefined` for email/password users without violating the index.
   - **Alternative considered**: Make `providerId` required for all users. Rejected because email/password users do not have a provider ID.

## Risks / Trade-offs

- [Risk] Production tokens currently issued for Android/iOS client IDs will be rejected once only the Web client ID is accepted.  
  → Mitigation: Confirm mobile `serverClientId` is set to the Web client ID before deploying.
- [Risk] Adding a unique index on `providerId` fails if duplicate Google `sub` values already exist in the database.  
  → Mitigation: Add the index as part of this change and verify no duplicate `(authProvider: 'google', providerId)` pairs exist before deployment.
- [Risk] `google-auth-library` increases the dependency surface.  
  → Mitigation: It is the official Google library and is actively maintained; lock the version in `package-lock.json`.

## Migration Plan

1. Install `google-auth-library`.
2. Create `src/services/googleAuth.js` and add unit/service tests.
3. Refactor `src/routes/auth.js` to use the new service.
4. Update `src/models/User.js` with the sparse unique index.
5. Verify `GOOGLE_CLIENT_ID` in production environment is the Web application client ID.
6. Deploy and run the existing Postman/curl Google Sign-In test.

## Open Questions

- None.
