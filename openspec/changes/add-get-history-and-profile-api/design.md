## Context

The 24Fit backend is a Node.js/Express API backed by MongoDB (Mongoose). Authentication is handled via JWT access tokens. The `UserData` model already stores `profile` (object) and `meals` (array of objects) per user. Currently, clients can push profile/meal data through `POST /v1/sync/profile` and `POST /v1/sync/meals`, and fetch the combined document via `GET /v1/sync/data`. There is no dedicated, lightweight endpoint for fetching just the profile or a paginated view of meal history.

## Goals / Non-Goals

**Goals:**
- Add `GET /v1/profile` to return only the authenticated user's stored profile.
- Add `GET /v1/history` to return a paginated list of the authenticated user's meals, sorted newest first.
- Reuse existing `authenticateToken` middleware and the `UserData` model.
- Maintain backward compatibility with existing sync endpoints.

**Non-Goals:**
- No changes to the authentication flow.
- No new database collections or schema migrations.
- No editing/deleting individual meals or profiles through these endpoints.

## Decisions

1. **Route structure**: Create two new route files, `src/routes/profile.js` and `src/routes/history.js`, and mount them in `src/index.js` at `/v1/profile` and `/v1/history`. This keeps read-only endpoints separate from the existing sync write endpoints and follows the existing project conventions.

2. **Data source**: Both endpoints query the existing `UserData` collection by `userId` extracted from the JWT. This avoids duplicating data and keeps the implementation minimal.

3. **History pagination**: Use query parameters `page` and `limit` with sensible defaults (`page=1`, `limit=20`, max `limit=100`). Pagination is implemented in-memory on the `meals` array because meals are embedded in `UserData`. As meal history grows, this should be revisited (e.g., extracting meals to a separate collection).

4. **Sort order**: Meals are sorted by `updated_at` descending so the most recently updated meals appear first. If `updated_at` is missing, fall back to the array index order.

5. **Response shapes**:
   - `GET /v1/profile` → `{ "profile": { ... } }` (profile is `null` if not set)
   - `GET /v1/history?page=1&limit=20` → `{ "meals": [...], "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }`

6. **Error handling**: Use the existing global error handler pattern. Return `401`/`403` from `authenticateToken`, `404` only if appropriate, and `500` for unexpected errors.

## Risks / Trade-offs

- **[Risk]** In-memory pagination on a potentially large embedded `meals` array could become slow as users accumulate years of meal entries.  
  → **Mitigation**: Set a max `limit` of 100 and document that a future migration to a dedicated `Meal` collection may be needed for scale.

- **[Risk]** Clients may expect `GET /v1/sync/data` to be deprecated in favor of the new endpoints.  
  → **Mitigation**: Leave `GET /v1/sync/data` unchanged and document that the new endpoints are additions, not replacements.

- **[Risk]** Sorting by `updated_at` string/ISO format may behave unexpectedly if existing data uses different formats.  
  → **Mitigation**: Use `new Date()` comparison after validating the field exists; otherwise preserve array order.

## Migration Plan

- Deploy new routes alongside existing code.
- No database migration is required.
- After deployment, update Postman collection and `FRONTEND_INTEGRATION.md` with the new endpoints.
- Rollback: revert the route mounts in `src/index.js` and delete the new route files.
