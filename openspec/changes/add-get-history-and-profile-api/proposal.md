## Why

The current sync API only supports pushing profile/meal data and fetching everything together via `GET /v1/sync/data`. Frontend clients need lightweight, focused endpoints to retrieve the current user profile and meal history independently, improving performance and simplifying client-side state management.

## What Changes

- Add a new protected `GET /v1/profile` endpoint that returns the authenticated user's stored profile.
- Add a new protected `GET /v1/history` endpoint that returns the authenticated user's meal history with optional filtering/pagination.
- Update the backend route structure to expose these endpoints under `/v1`.
- Add tests and update API documentation (Postman collection + frontend integration guide).

## Capabilities

### New Capabilities

- `get-profile-api`: Retrieve the authenticated user's stored profile as a dedicated endpoint.
- `get-history-api`: Retrieve the authenticated user's meal history with support for pagination.

### Modified Capabilities

- None. Existing sync endpoints remain unchanged.

## Impact

- New Express routes in `src/routes/`.
- Reuses existing `UserData` Mongoose model and `authenticateToken` middleware.
- No database schema migrations required.
- Postman collection and `FRONTEND_INTEGRATION.md` will be updated.
