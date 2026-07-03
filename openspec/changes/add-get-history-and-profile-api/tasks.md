## 1. Setup

- [x] 1.1 Create `src/routes/profile.js` route module
- [x] 1.2 Create `src/routes/history.js` route module
- [x] 1.3 Add pagination helper utility in `src/utils/pagination.js`

## 2. Implement GET /v1/profile

- [x] 2.1 Add `authenticateToken` middleware to `GET /v1/profile`
- [x] 2.2 Query `UserData` by `req.userId` and return `{ profile }`
- [x] 2.3 Return `profile: null` when no profile exists
- [x] 2.4 Handle errors with the global error handler pattern

## 3. Implement GET /v1/history

- [x] 3.1 Add `authenticateToken` middleware to `GET /v1/history`
- [x] 3.2 Parse and validate `page` and `limit` query parameters
- [x] 3.3 Enforce default `page=1`, `limit=20`, and max `limit=100`
- [x] 3.4 Sort meals by `updated_at` descending (fallback to array order)
- [x] 3.5 Return paginated meals with `{ meals, pagination }` shape
- [x] 3.6 Return `400 Bad Request` for invalid pagination input

## 4. Wire Up Routes

- [x] 4.1 Import `profileRoutes` and `historyRoutes` in `src/index.js`
- [x] 4.2 Mount routes at `/v1/profile` and `/v1/history`
- [x] 4.3 Restart the local dev server and verify routes respond

## 5. Verify & Document

- [x] 5.1 Manually test `GET /v1/profile` with valid and missing tokens
- [x] 5.2 Manually test `GET /v1/history` with default, custom, and invalid pagination
- [x] 5.3 Add the new endpoints to `24fit-backend.postman_collection.json`
- [x] 5.4 Update `FRONTEND_INTEGRATION.md` with `GET /v1/profile` and `GET /v1/history` documentation

## 6. Deploy

- [x] 6.1 Deploy updated backend to the server
- [x] 6.2 Confirm endpoints work on production domain
