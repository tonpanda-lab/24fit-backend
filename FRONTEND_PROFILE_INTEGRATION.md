# Frontend Profile Integration Guide

This guide covers how to sync and retrieve the user profile from the 24Fit backend.

**Base URL:** `https://api.nutrisimple.site/v1`

---

## Profile Schema

The profile is a single JSON object stored per user. Use the exact field names below when pushing or parsing profile data.

```json
{
  "profile": {
    "name": "Test User",
    "age": 30,
    "weight_kg": 70,
    "height_cm": 175,
    "ethnicity": "asian",
    "activity_level": "moderate",
    "goal": "maintain"
  }
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | User's display name |
| `age` | integer | Age in years |
| `weight_kg` | number | Weight in kilograms |
| `height_cm` | number | Height in centimeters |
| `ethnicity` | string | User's ethnicity |
| `activity_level` | string | Activity level, e.g., `sedentary`, `light`, `moderate`, `active`, `very_active` |
| `goal` | string | Fitness goal, e.g., `lose`, `maintain`, `gain` |

---

## Endpoints

### 1. Push Profile

Save or update the user's profile on the server.

```http
POST /v1/sync/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "server_user_id": "507f1f77bcf86cd799439011",
  "profile": {
    "name": "Test User",
    "age": 30,
    "weight_kg": 70,
    "height_cm": 175,
    "ethnicity": "asian",
    "activity_level": "moderate",
    "goal": "maintain"
  }
}
```

**Success 200:**

```json
{ "success": true }
```

**Errors:**
- `401`/`403` — missing or invalid token
- `403` — `server_user_id` does not match the authenticated user

---

### 2. Get Profile

Retrieve the currently stored profile.

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
    "ethnicity": "asian",
    "activity_level": "moderate",
    "goal": "maintain"
  }
}
```

**Success 200 (no profile yet):**

```json
{
  "profile": null
}
```

---

## Flutter Example

### Model

```dart
class UserProfile {
  final String name;
  final int age;
  final double weightKg;
  final double heightCm;
  final String ethnicity;
  final String activityLevel;
  final String goal;

  UserProfile({
    required this.name,
    required this.age,
    required this.weightKg,
    required this.heightCm,
    required this.ethnicity,
    required this.activityLevel,
    required this.goal,
  });

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'age': age,
      'weight_kg': weightKg,
      'height_cm': heightCm,
      'ethnicity': ethnicity,
      'activity_level': activityLevel,
      'goal': goal,
    };
  }

  factory UserProfile.fromMap(Map<String, dynamic> map) {
    return UserProfile(
      name: map['name'] ?? '',
      age: map['age'] ?? 0,
      weightKg: (map['weight_kg'] ?? 0).toDouble(),
      heightCm: (map['height_cm'] ?? 0).toDouble(),
      ethnicity: map['ethnicity'] ?? '',
      activityLevel: map['activity_level'] ?? '',
      goal: map['goal'] ?? '',
    );
  }
}
```

### Push Profile

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

const String apiBaseUrl = 'https://api.nutrisimple.site/v1';

Future<void> pushProfile(
  String accessToken,
  String userId,
  UserProfile profile,
) async {
  final response = await http.post(
    Uri.parse('$apiBaseUrl/sync/profile'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'server_user_id': userId,
      'profile': profile.toMap(),
    }),
  );

  if (response.statusCode != 200) {
    throw Exception('Failed to push profile: ${response.statusCode}');
  }
}
```

### Fetch Profile

```dart
Future<UserProfile?> fetchProfile(String accessToken) async {
  final response = await http.get(
    Uri.parse('$apiBaseUrl/profile'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
  );

  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    final profileData = json['profile'];
    if (profileData == null) return null;
    return UserProfile.fromMap(profileData);
  } else if (response.statusCode == 401 || response.statusCode == 403) {
    throw Exception('Token expired or invalid');
  } else {
    throw Exception('Failed to fetch profile: ${response.statusCode}');
  }
}
```

---

## React Native Example

```js
const API_BASE_URL = 'https://api.nutrisimple.site/v1';

async function pushProfile(accessToken, userId, profile) {
  const response = await fetch(`${API_BASE_URL}/sync/profile`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      server_user_id: userId,
      profile,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to push profile: ${response.status}`);
  }
}

async function fetchProfile(accessToken) {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`);
  }

  const data = await response.json();
  return data.profile;
}
```

---

## Sync Best Practices

1. **Always include `server_user_id`** in push requests. It must match the `sub` claim from the JWT access token.
2. **Push on save** — send the full profile object to the server whenever the user updates their profile.
3. **Fetch on app launch** — call `GET /v1/profile` after login to load the latest profile.
4. **Handle `null` profile** — a new user may not have pushed a profile yet.
5. **Use the exact field names** (`weight_kg`, `height_cm`, `activity_level`) so the backend and frontend stay in sync.

---

## Related Endpoints

- `POST /v1/sync/meals` — push meal logs
- `GET /v1/history` — fetch meal history
- `GET /v1/history/calories` — fetch daily calorie totals
