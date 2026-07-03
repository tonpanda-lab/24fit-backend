## 1. Setup

- [ ] 1.1 Create `src/routes/profile.js` route module
- [ ] 1.2 Create `src/routes/history.js` route module
- [ ] 1.3 Add pagination helper utility in `src/utils/pagination.js`

## 2. Implement GET /v1/profile

- [ ] 2.1 Add `authenticateToken` middleware to `GET /v1/profile`
- [ ] 2.2 Query `UserData` by `req.userId` and return `{ profile }`
- [ ] 2.3 Return `profile: null` when no profile exists
- [ ] 2.4 Handle errors with the global error handler pattern

## 3. Implement GET /v1/history

- [ ] 3.1 Add `authenticateToken` middleware to `GET /v1/history`
- [ ] 3.2 Parse and validate `page` and `limit` query parameters
- [ ] 3.3 Enforce default `page=1`, `limit=20`, and max `limit=100`
- [ ] 3.4 Sort meals by `updated_at` descending (fallback to array order)
- [ ] 3.5 Return paginated meals with `{ meals, pagination }` shape
- [ ] 3.6 Return `400 Bad Request` for invalid pagination input

## 4. Wire Up Routes

- [ ] 4.1 Import `profileRoutes` and `historyRoutes` in `src/index.js`
- [ ] 4.2 Mount routes at `/v1/profile` and `/v1/history`
- [ ] 4.3 Restart the local dev server and verify routes respond

## 5. Verify & Document

- [ ] 5.1 Manually test `GET /v1/profile` with valid and missing tokens
- [ ] 5.2 Manually test `GET /v1/history` with default, custom, and invalid pagination
- [ ] 5.3 Add the new endpoints to `24fit-backend.postman_collection.json`
- [ ] 5.4 Update `FRONTEND_INTEGRATION.md` with `GET /v1/profile` and `GET /v1/history` documentation

## 6. Deploy

- [ ] 6.1 Deploy updated backend to the server
- [ ] 6.2 Confirm endpoints work on production domain
