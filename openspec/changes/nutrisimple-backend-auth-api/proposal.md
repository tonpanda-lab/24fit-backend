## Why

The NutriSimple Flutter app needs a backend to handle user authentication and data synchronization. Currently there is no backend, so user data is trapped on-device and authentication is not possible. This change establishes the foundational auth API and sync endpoints required for the app to support multi-device usage and secure user accounts.

## What Changes

- Create a new Node.js + Express backend project with MongoDB (Mongoose) persistence
- Implement email/password registration and login with bcrypt password hashing
- Implement Apple Sign-In and Google Sign-In OAuth flows
- Implement JWT access tokens (15min expiry, HS256) and refresh tokens (UUID, 7day expiry)
- Implement Bearer token authentication middleware
- Implement user data sync endpoints for profile and meals
- Add CORS configuration for Flutter mobile app clients

## Capabilities

### New Capabilities
- `auth-email-password`: Email/password registration and login with bcrypt hashing
- `auth-oapple`: Apple Sign-In via identity token verification using Apple's public keys
- `auth-google`: Google Sign-In via ID token verification using Google's tokeninfo endpoint
- `token-management`: JWT access/refresh token issuance, rotation, and revocation
- `user-data-sync`: Profile and meal data push/pull synchronization for authenticated users

### Modified Capabilities
- (none — this is a greenfield backend)

## Impact

- New backend service exposing `/v1/auth/*` and `/v1/sync/*` REST endpoints
- New MongoDB database with `User`, `RefreshToken`, and `UserData` collections
- New environment variables required for JWT secrets and OAuth client IDs
- Flutter app will need to integrate with these endpoints (separate change)
