# Backend Integration Guide — NutriSimple Auth API

## Stack
- **Runtime**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (access + refresh tokens)
- **OAuth**: Verify Google ID tokens

---

## 1. Data Models

### User
```js
const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },           // null for OAuth users
  authProvider: { type: String, enum: ['email', 'google'], required: true },
  providerId:   { type: String },           // Google sub
  displayName:  { type: String },
  photoUrl:     { type: String },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
});
```

### RefreshToken
```js
const refreshTokenSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:     { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});
```

### UserData (sync target)
```js
const userDataSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  profile:   { type: Object },              // mirrors Flutter UserProfile.toMap()
  meals:     [{ type: Object }],            // array of meal entries with items
  updatedAt: { type: Date, default: Date.now },
});
```

---

## 2. Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nutrisimple
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

---

## 3. API Endpoints

### 3.1 POST `/v1/auth/register`
Email/password registration.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response 201:**
```json
{
  "tokens": {
    "access_token": "<jwt>",
    "refresh_token": "<uuid>"
  },
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "display_name": null,
    "photo_url": null
  }
}
```

**Errors:**
- `409` — email already registered
- `400` — invalid email or password < 8 chars

---

### 3.2 POST `/v1/auth/login`
Email/password login.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response 200:** same shape as register.

**Errors:**
- `401` — invalid credentials

---

### 3.3 POST `/v1/auth/google`
Google Sign-In.

**Request:**
```json
{
  "id_token": "<google-jwt>",
  "access_token": "<google-access-token>"
}
```

**Flow:**
1. Verify Google ID token using Google API (`https://oauth2.googleapis.com/tokeninfo?id_token=...`)
2. Extract `sub`, `email`, `name`, `picture`
3. If user exists by `providerId` → sign in
4. If new → create user with `authProvider: 'google'`
5. Return tokens

**Response 200:** same shape as register.

---

### 3.4 POST `/v1/auth/refresh`
Token refresh.

**Request:**
```json
{
  "refresh_token": "<uuid>"
}
```

**Flow:**
1. Look up refresh token in DB
2. Ensure not expired
3. Issue new access token (optionally rotate refresh token)
4. Return new tokens

**Response 200:**
```json
{
  "tokens": {
    "access_token": "<new-jwt>",
    "refresh_token": "<new-or-same-uuid>"
  }
}
```

**Errors:**
- `401` — invalid or expired refresh token

---

### 3.5 POST `/v1/auth/logout`
Revoke refresh token (best-effort).

**Request:**
```json
{
  "refresh_token": "<uuid>"
}
```

**Flow:**
1. Delete refresh token from DB if found
2. Return `204`

---

### 3.6 POST `/v1/sync/profile`
Push user profile from device.

**Request:**
```json
{
  "server_user_id": "507f1f77bcf86cd799439011",
  "profile": { ... }  // Flutter UserProfile.toMap()
}
```

**Flow:**
1. Verify Bearer token from `Authorization` header
2. Upsert `UserData` document for the authenticated user
3. Set `updatedAt` to now
4. Return `200`

---

### 3.7 POST `/v1/sync/meals`
Push a meal entry from device.

**Request:**
```json
{
  "server_user_id": "507f1f77bcf86cd799439011",
  "meal": { ... },
  "items": [ ... ]
}
```

**Flow:**
1. Verify Bearer token
2. Upsert meal into user's `UserData.meals` array (match by `timestamp` or assign `server_meal_id`)
3. Return `200` with `{ "server_meal_id": "..." }`

---

### 3.8 GET `/v1/sync/data`
Fetch all user data for device sync.

**Query:** `?server_user_id=<id>`

**Headers:** `Authorization: Bearer <access_token>`

**Response 200:**
```json
{
  "profile": { ... },
  "meals": [
    {
      "server_meal_id": "abc123",
      "updated_at": "2024-01-15T10:30:00Z",
      ...
    }
  ]
}
```

---

## 4. JWT Access Token Structure

Header:
```json
{ "alg": "HS256", "typ": "JWT" }
```

Payload:
```json
{
  "sub": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "iat": 1705312800,
  "exp": 1705313700
}
```

The Flutter app decodes the payload to extract `sub` as the user ID.

---

## 5. Middleware

### `authenticateToken`
```js
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.userId = payload.sub;
    next();
  });
}
```

Apply to all `/v1/sync/*` routes and any protected endpoints.

---

## 6. CORS

Allow the Flutter app origin:
```js
app.use(cors({
  origin: '*', // or restrict to app bundle IDs via custom headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## 7. Kimi Code CLI Prompt Template

When implementing this backend with Kimi Code CLI, use this prompt:

```
Implement the NutriSimple backend auth API using Node.js, Express, and MongoDB (Mongoose).

Requirements:
- Create Express server with routes under /v1/auth/* and /v1/sync/*
- Use MongoDB with Mongoose models: User, RefreshToken, UserData
- JWT access tokens (HS256, 15min expiry) and refresh tokens (UUID, 7day expiry)
- OAuth verification for Google Sign-In
- All sync endpoints protected by Bearer token middleware
- CORS enabled for mobile app clients
- Return exact JSON response shapes as defined in BACKEND_INTEGRATION.md

Start by creating the project structure, then models, then auth routes, then sync routes, then middleware.
```

---

## 8. Testing Checklist (Post-Implementation)

- [ ] `POST /v1/auth/register` creates user and returns tokens
- [ ] `POST /v1/auth/login` returns tokens for valid credentials
- [ ] `POST /v1/auth/login` returns 401 for bad password
- [ ] `POST /v1/auth/google` verifies Google ID token and creates/returns user
- [ ] `POST /v1/auth/refresh` returns new access token
- [ ] `POST /v1/auth/refresh` with bad token returns 401
- [ ] `POST /v1/auth/logout` deletes refresh token
- [ ] `GET /v1/sync/data` returns 403 without Bearer token
- [ ] `GET /v1/sync/data` returns user data with valid token
- [ ] `POST /v1/sync/meals` stores meal and returns server_meal_id
