## 1. Project Setup

- [x] 1.1 Initialize Node.js project with package.json
- [x] 1.2 Install dependencies: express, mongoose, bcryptjs, jsonwebtoken, uuid, cors, dotenv, node-fetch (or use built-in fetch for Node 18+)
- [x] 1.3 Install dev dependencies: nodemon (optional)
- [x] 1.4 Create project folder structure (src/models, src/routes, src/middleware, src/utils)
- [x] 1.5 Create .env.example with all required environment variables
- [x] 1.6 Create main server entry point (src/index.js)

## 2. Database Models

- [x] 2.1 Create User Mongoose model (email, passwordHash, authProvider, providerId, displayName, photoUrl, timestamps)
- [x] 2.2 Create RefreshToken Mongoose model (userId, token, expiresAt, createdAt)
- [x] 2.3 Create UserData Mongoose model (userId, profile, meals, updatedAt)
- [x] 2.4 Set up MongoDB connection in src/index.js with error handling

## 3. Authentication Utilities

- [x] 3.1 Create JWT utility: generateAccessToken(user) with HS256, 15min expiry
- [x] 3.2 Create JWT utility: verifyAccessToken(token)
- [x] 3.3 Create refresh token utility: generateRefreshToken() returning UUID
- [x] 3.4 Create password utility: hashPassword(password) using bcrypt
- [x] 3.5 Create password utility: comparePassword(password, hash) using bcrypt

## 4. Middleware

- [x] 4.1 Create authenticateToken middleware: extract Bearer token, verify JWT, attach req.userId
- [x] 4.2 Create global error handler middleware
- [x] 4.3 Configure CORS middleware for mobile app clients

## 5. Auth Routes — Email/Password

- [x] 5.1 Implement POST /v1/auth/register: validate input, check duplicate email, hash password, create user, issue tokens, return 201 with exact response shape
- [x] 5.2 Implement POST /v1/auth/login: validate input, find user, compare password, issue tokens, return 200 with exact response shape
- [x] 5.3 Handle 409 for duplicate email on register
- [x] 5.4 Handle 400 for invalid email or short password
- [x] 5.5 Handle 401 for invalid credentials on login

## 6. Auth Routes — Apple Sign-In

- [x] 6.1 Implement Apple identity token verification: fetch Apple public keys from JWKS endpoint, verify JWT signature
- [x] 6.2 Implement POST /v1/auth/apple: verify token, extract sub and email, find or create user with authProvider "apple", issue tokens
- [x] 6.3 Handle new Apple user creation with providerId stored
- [x] 6.4 Handle 401 for invalid Apple identity token

## 7. Auth Routes — Google Sign-In

- [x] 7.1 Implement Google ID token verification: call Google tokeninfo endpoint
- [x] 7.2 Implement POST /v1/auth/google: verify token, extract sub/email/name/picture, find or create user with authProvider "google", issue tokens
- [x] 7.3 Handle new Google user creation with displayName and photoUrl populated
- [x] 7.4 Handle 401 for invalid Google ID token

## 8. Token Management Routes

- [x] 8.1 Implement POST /v1/auth/refresh: look up refresh token in DB, check expiry, issue new access token, return tokens
- [x] 8.2 Implement POST /v1/auth/logout: delete refresh token from DB, return 204
- [x] 8.3 Handle 401 for invalid or expired refresh token

## 9. Sync Routes

- [x] 9.1 Implement POST /v1/sync/profile: verify Bearer token, upsert UserData profile, return 200
- [x] 9.2 Implement POST /v1/sync/meals: verify Bearer token, upsert meal into UserData.meals (match by timestamp or assign server_meal_id), return 200 with server_meal_id
- [x] 9.3 Implement GET /v1/sync/data: verify Bearer token, accept server_user_id query, return profile and meals array
- [x] 9.4 Ensure sync endpoints return 403 without valid Bearer token

## 10. Integration & Verification

- [x] 10.1 Wire all routes in Express app with correct base paths
- [x] 10.2 Verify all response shapes match BACKEND_INTEGRATION.md exactly
- [x] 10.3 Test the server starts successfully and connects to MongoDB
- [x] 10.4 Run through the testing checklist from BACKEND_INTEGRATION.md section 8
