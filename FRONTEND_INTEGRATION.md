# Frontend Integration Guide — 24Fit Backend

This guide is for frontend/mobile developers connecting an app to the **24Fit Backend** (Node.js + Express + MongoDB).

**Live backend (current deployment):** `https://api.nutrisimple.site`  
**API base path:** `/v1`

> Replace the IP with your own domain (e.g., `https://api.yourdomain.com`) once HTTPS is configured.

---

## 1. Base URLs & Environment Config

Use different base URLs for development and production.

### Example `.env` / config

```bash
# Development (local backend)
API_BASE_URL=http://localhost:3000/v1

# Production
API_BASE_URL=https://api.nutrisimple.site/v1
```

### Flutter / Dart

```dart
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://api.nutrisimple.site/v1',
);
```

### JavaScript / React / React Native

```js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.nutrisimple.site/v1';
```

---

## 2. Authentication Overview

The backend uses **JWT access tokens** + **UUID refresh tokens**.

| Token | Type | Lifetime | Storage |
|-------|------|----------|---------|
| `access_token` | JWT (HS256) | 15 minutes | Secure memory / keychain |
| `refresh_token` | UUID string | 7 days | Secure persistent storage |

### Flow

1. Call `POST /v1/auth/register` or `POST /v1/auth/login`
2. Store `access_token` and `refresh_token` securely
3. Send `Authorization: Bearer <access_token>` on every protected request
4. When `access_token` expires (HTTP 403), call `POST /v1/auth/refresh` to get a new one
5. Call `POST /v1/auth/logout` when the user signs out

---

## 3. Auth Endpoints

### 3.1 Register

```http
POST /v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success 201:**

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
- `400` — invalid email or password < 8 characters
- `409` — email already registered

### 3.2 Login

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success 200:** same shape as register.

**Errors:**
- `401` — invalid credentials

### 3.3 Apple Sign-In

```http
POST /v1/auth/apple
Content-Type: application/json

{
  "identity_token": "<apple-jwt>",
  "authorization_code": "<code>",
  "user_identifier": "001234.abc123..."
}
```

**Success 200:** same token/user shape as register.

### 3.4 Google Sign-In

```http
POST /v1/auth/google
Content-Type: application/json

{
  "id_token": "<google-jwt>",
  "access_token": "<google-access-token>"
}
```

**Success 200:** same token/user shape as register.

### 3.5 Refresh Access Token

```http
POST /v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "<uuid>"
}
```

**Success 200:**

```json
{
  "tokens": {
    "access_token": "<new-jwt>",
    "refresh_token": "<same-or-new-uuid>"
  }
}
```

**Errors:**
- `401` — invalid or expired refresh token

### 3.6 Logout

```http
POST /v1/auth/logout
Content-Type: application/json

{
  "refresh_token": "<uuid>"
}
```

**Success 204:** empty body.

---

## 4. Token Storage & Usage

### Flutter (flutter_secure_storage)

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _storage = FlutterSecureStorage();

Future<void> saveTokens(String accessToken, String refreshToken) async {
  await _storage.write(key: 'access_token', value: accessToken);
  await _storage.write(key: 'refresh_token', value: refreshToken);
}

Future<String?> getAccessToken() => _storage.read(key: 'access_token');
Future<String?> getRefreshToken() => _storage.read(key: 'refresh_token');
```

### React Native (Keychain / EncryptedStorage)

```js
import * as Keychain from 'react-native-keychain';

await Keychain.setGenericPassword('access_token', accessToken, { service: 'access_token' });
await Keychain.setGenericPassword('refresh_token', refreshToken, { service: 'refresh_token' });
```

### Web (less secure — use httpOnly cookies if possible)

```js
localStorage.setItem('access_token', accessToken);
localStorage.setItem('refresh_token', refreshToken);
```

---

## 5. Making Authenticated Requests

Every protected endpoint requires:

```http
Authorization: Bearer <access_token>
```

### Example: GET user sync data

```http
GET /v1/sync/data?server_user_id=<user_id>
Authorization: Bearer <access_token>
```

### Flutter example

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> fetchUserData(String userId, String accessToken) async {
  final response = await http.get(
    Uri.parse('$apiBaseUrl/sync/data?server_user_id=$userId'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else if (response.statusCode == 401 || response.statusCode == 403) {
    throw Exception('Token expired or invalid');
  } else {
    throw Exception('Failed to load user data: ${response.statusCode}');
  }
}
```

---

## 6. Token Refresh Pattern

Build an API client that auto-refreshes on 401/403.

### Pseudoflow

```text
1. Make request with access_token
2. If 401/403:
   a. Call POST /v1/auth/refresh with stored refresh_token
   b. If success: store new access_token, retry original request
   c. If fail: clear tokens and send user to login screen
```

### Dart interceptor example

```dart
class AuthInterceptor extends http.BaseClient {
  final http.Client _client = http.Client();

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final accessToken = await getAccessToken();
    if (accessToken != null) {
      request.headers['Authorization'] = 'Bearer $accessToken';
    }

    var response = await _client.send(request);

    if (response.statusCode == 401 || response.statusCode == 403) {
      final refreshed = await _refreshToken();
      if (refreshed != null) {
        request.headers['Authorization'] = 'Bearer $refreshed';
        response = await _client.send(request);
      } else {
        // Clear tokens and logout
        await clearTokens();
        throw Exception('Session expired');
      }
    }

    return response;
  }

  Future<String?> _refreshToken() async {
    final refreshToken = await getRefreshToken();
    if (refreshToken == null) return null;

    final response = await http.post(
      Uri.parse('$apiBaseUrl/auth/refresh'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refresh_token': refreshToken}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final tokens = data['tokens'];
      await saveTokens(tokens['access_token'], tokens['refresh_token']);
      return tokens['access_token'];
    }
    return null;
  }
}
```

---

## 7. Sync Endpoints

These endpoints require authentication.

### 7.1 Push profile

```http
POST /v1/sync/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "server_user_id": "507f1f77bcf86cd799439011",
  "profile": { /* your UserProfile object */ }
}
```

**Success 200:**

```json
{ "success": true }
```

### 7.2 Push meal

```http
POST /v1/sync/meals
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "server_user_id": "507f1f77bcf86cd799439011",
  "date": "2024-01-15",
  "item": "Oatmeal",
  "total_calories": 300
}
```

**Success 200:**

```json
{ "server_meal_id": "2024-01-15-oatmeal" }
```

The backend matches meals by `date` + `item`. If the same item is logged on the same date, the calories are updated.

**Validation errors:**
- `400` — missing/invalid `date` (must be `YYYY-MM-DD`)
- `400` — missing/empty `item`
- `400` — invalid `total_calories` (must be a non-negative number)

### 7.3 Fetch all user data

```http
GET /v1/sync/data?server_user_id=507f1f77bcf86cd799439011
Authorization: Bearer <access_token>
```

**Success 200:**

```json
{
  "profile": { /* profile object */ },
  "meals": [
    {
      "server_meal_id": "2024-01-15-oatmeal",
      "date": "2024-01-15",
      "item": "Oatmeal",
      "total_calories": 300,
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 8. Read Endpoints (Protected)

These endpoints require authentication.

### 8.1 Get Profile

```http
GET /v1/profile
Authorization: Bearer <access_token>
```

**Success 200 (profile exists):**

```json
{
  "profile": {
    "name": "Test User",
    "age": 30,
    "weight_kg": 70,
    "height_cm": 175,
    "goal": "maintain"
  }
}
```

**Success 200 (no profile):**

```json
{
  "profile": null
}
```

### 8.2 Get Meal History

```http
GET /v1/history?page=1&limit=20
Authorization: Bearer <access_token>
```

**Query parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | — | Page number (1-based) |
| `limit` | integer | 20 | 100 | Number of meals per page |

**Success 200:**

```json
{
  "meals": [
    {
      "server_meal_id": "2024-01-15-oatmeal",
      "date": "2024-01-15",
      "item": "Oatmeal",
      "total_calories": 300,
      "updated_at": "2024-01-15T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Error 400:** invalid `page` or `limit` values.

---

## 9. Health Check

Use this for connection monitoring.

```http
GET /health
```

**Success 200:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "uptime": 123.45
}
```

---

## 10. Error Reference

| Status | Meaning | Action |
|--------|---------|--------|
| `200` | OK | — |
| `201` | Created | — |
| `204` | No content | — |
| `400` | Bad request | Show validation error |
| `401` | Unauthorized / missing token | Refresh token or login |
| `403` | Forbidden / invalid token | Refresh token or login |
| `409` | Conflict (email exists) | Show "email already registered" |
| `500` | Server error | Retry or report |

---

## 11. Quick Checklist

- [ ] Set correct `API_BASE_URL` per environment
- [ ] Store tokens securely (keychain / secure storage)
- [ ] Attach `Authorization: Bearer <token>` to all `/v1/sync/*` calls
- [ ] Implement automatic token refresh on 401/403
- [ ] Send `server_user_id` in sync body/query matching the JWT `sub` claim
- [ ] Use `GET /v1/profile` to fetch the current user profile
- [ ] Use `GET /v1/history` to fetch paginated meal history
- [ ] Call `/v1/auth/logout` on sign-out and delete stored tokens
- [ ] Replace OAuth placeholders in backend `.env` before using Apple/Google Sign-In

---

## 12. Postman Collection

Use the included [`24fit-backend.postman_collection.json`](./24fit-backend.postman_collection.json) to test endpoints manually.
