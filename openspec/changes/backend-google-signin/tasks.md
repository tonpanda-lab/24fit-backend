## 1. Dependencies and Environment

- [x] 1.1 Install `google-auth-library` as a runtime dependency and update `package-lock.json`.
- [x] 1.2 Confirm `GOOGLE_CLIENT_ID` in `.env` and deployment environments is the Web application client ID. (Set to server/web client: `657264549865-rr0lcgu35vknp1m1nko3acajtbna01sb.apps.googleusercontent.com`)

## 2. Token Verification Service

- [x] 2.1 Create `src/services/googleAuth.js` that instantiates `OAuth2Client` with `GOOGLE_CLIENT_ID`.
- [x] 2.2 Implement `verifyGoogleIdToken(idToken)` to call `verifyIdToken`, validate `sub` and `email`, and return `{ providerId, email, displayName, photoUrl }`.
- [x] 2.3 Add error handling so invalid/expired/wrong-audience tokens throw a clear error distinguishable as an invalid token.

## 3. User Model Hardening

- [x] 3.1 Update `src/models/User.js` to add `unique: true, sparse: true` on the `providerId` field.
- [x] 3.2 Verify no duplicate `(authProvider: 'google', providerId)` pairs exist in the database before applying the index. (Confirmed for local/dev DB; production must be checked before deploying.)

## 4. Google Sign-In Route Refactor

- [x] 4.1 Refactor `POST /v1/auth/google` in `src/routes/auth.js` to import and use `verifyGoogleIdToken`.
- [x] 4.2 Validate that `id_token` is present and is a string; return 400 `Missing id_token` otherwise.
- [x] 4.3 Replace the `tokeninfo` `fetch` call and audience-list logic with a single `GOOGLE_CLIENT_ID` audience check via the service.
- [x] 4.4 Keep find-or-create behavior: query by `{ authProvider: 'google', providerId }`, create a new user if not found, and issue access/refresh tokens.
- [x] 4.5 Return the existing success response shape (`tokens` + `user`) on success.
- [x] 4.6 Return 401 `Invalid Google ID token` for verification failures and 500 `Internal server error` for unexpected errors.

## 5. Testing and Verification

- [ ] 5.1 Run a successful Google Sign-In request with a real ID token and confirm 200 + tokens + user object.
- [x] 5.2 Test missing `id_token` returns 400 `Missing id_token`. (Verified via temp Express test script.)
- [x] 5.3 Test an expired/forged ID token returns 401 `Invalid Google ID token`. (Verified via temp Express test script.)
- [ ] 5.4 Verify the sparse unique index prevents duplicate `providerId` values for Google users.
