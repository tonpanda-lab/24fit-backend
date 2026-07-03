# Frontend Meal Logging Integration Guide

This guide covers how to log, update, delete, and retrieve meals from the 24Fit backend.

**Base URL:** `https://api.nutrisimple.site/v1`

---

## Meal Record Schema

Each meal log is a flat object. Send this shape when creating or updating a meal.

```json
{
  "server_user_id": "507f1f77bcf86cd799439011",
  "date": "2024-01-15",
  "timestamp": 1705312800000,
  "item": "Oatmeal",
  "total_calories": 300
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `server_user_id` | string | yes | The user's ID from the JWT `sub` claim |
| `date` | string (YYYY-MM-DD) | yes | The calendar date the item was consumed |
| `timestamp` | integer (ms) | no | Unix timestamp in milliseconds. Defaults to current time if omitted |
| `item` | string | yes | Description of the food item |
| `total_calories` | number | yes | Total calories for this entry (must be ≥ 0) |

### Stored Record

The backend stores and returns:

```json
{
  "server_meal_id": "2024-01-15-1705312800000-oatmeal",
  "date": "2024-01-15",
  "timestamp": 1705312800000,
  "item": "Oatmeal",
  "total_calories": 300,
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

`server_meal_id` is generated as `{date}-{timestamp}-{slugified-item}`. Because `timestamp` is included, users can log the same item multiple times on the same day as long as the timestamps differ.

---

## Endpoints

### 1. Log a Meal

Create a new meal log, or replace an existing one with the same `server_meal_id`.

```http
POST /v1/sync/meals
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "server_user_id": "507f1f77bcf86cd799439011",
  "date": "2024-01-15",
  "timestamp": 1705312800000,
  "item": "Oatmeal",
  "total_calories": 300
}
```

**Success 200:**

```json
{ "server_meal_id": "2024-01-15-1705312800000-oatmeal" }
```

**Validation errors:**
- `400` — missing/invalid `date`
- `400` — missing/empty `item`
- `400` — invalid `total_calories` (negative or not a number)
- `400` — invalid `timestamp`

---

### 2. Update a Meal

Modify an existing meal record. The `server_meal_id` is regenerated if `date`, `timestamp`, or `item` changes.

```http
PUT /v1/meals/2024-01-15-1705312800000-oatmeal
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "timestamp": 1705312800000,
  "item": "Oatmeal",
  "total_calories": 350
}
```

**Success 200:**

```json
{ "server_meal_id": "2024-01-15-1705312800000-oatmeal" }
```

**Errors:**
- `400` — invalid payload
- `404` — meal not found
- `409` — a meal with the new date/timestamp/item already exists

---

### 3. Delete a Meal

Remove a meal record.

```http
DELETE /v1/meals/2024-01-15-1705312800000-oatmeal
Authorization: Bearer <access_token>
```

**Success 204:** empty body.

**Errors:**
- `404` — meal not found

---

### 4. Get Meal History

Retrieve paginated meal history, sorted by date descending.

```http
GET /v1/history?page=1&limit=20
Authorization: Bearer <access_token>
```

**Query parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | — | Page number (1-based) |
| `limit` | integer | 20 | 100 | Meals per page |

**Success 200:**

```json
{
  "meals": [
    {
      "server_meal_id": "2024-01-16-1705400000000-banana",
      "date": "2024-01-16",
      "timestamp": 1705400000000,
      "item": "Banana",
      "total_calories": 120,
      "updated_at": "2024-01-16T08:00:00.000Z"
    },
    {
      "server_meal_id": "2024-01-15-1705312800000-oatmeal",
      "date": "2024-01-15",
      "timestamp": 1705312800000,
      "item": "Oatmeal",
      "total_calories": 300,
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### 5. Get Daily Calorie Summary

Get total calories consumed per day over a date range.

```http
GET /v1/history/calories?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <access_token>
```

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | string (YYYY-MM-DD) | yes | Start of range |
| `end_date` | string (YYYY-MM-DD) | no | End of range (defaults to today) |

**Success 200:**

```json
{
  "data": [
    { "date": "2024-01-14", "total_calories": 1200 },
    { "date": "2024-01-15", "total_calories": 1850 },
    { "date": "2024-01-16", "total_calories": 0 }
  ],
  "start_date": "2024-01-14",
  "end_date": "2024-01-16"
}
```

**Error 400:** invalid dates, `end_date` before `start_date`, or range > 365 days.

---

## Flutter Example

### Model

```dart
class MealLog {
  final String serverUserId;
  final String date;
  final int timestamp;
  final String item;
  final double totalCalories;

  MealLog({
    required this.serverUserId,
    required this.date,
    required this.timestamp,
    required this.item,
    required this.totalCalories,
  });

  Map<String, dynamic> toMap() {
    return {
      'server_user_id': serverUserId,
      'date': date,
      'timestamp': timestamp,
      'item': item,
      'total_calories': totalCalories,
    };
  }

  factory MealLog.fromMap(Map<String, dynamic> map) {
    return MealLog(
      serverUserId: map['server_user_id'] ?? '',
      date: map['date'] ?? '',
      timestamp: map['timestamp'] ?? 0,
      item: map['item'] ?? '',
      totalCalories: (map['total_calories'] ?? 0).toDouble(),
    );
  }
}
```

### Log a Meal

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

const String apiBaseUrl = 'https://api.nutrisimple.site/v1';

Future<String> logMeal(String accessToken, MealLog meal) async {
  final response = await http.post(
    Uri.parse('$apiBaseUrl/sync/meals'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode(meal.toMap()),
  );

  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return json['server_meal_id'];
  } else {
    throw Exception('Failed to log meal: ${response.statusCode}');
  }
}
```

### Update a Meal

```dart
Future<String> updateMeal(
  String accessToken,
  String serverMealId,
  MealLog meal,
) async {
  final response = await http.put(
    Uri.parse('$apiBaseUrl/meals/$serverMealId'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode(meal.toMap()..remove('server_user_id')),
  );

  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return json['server_meal_id'];
  } else {
    throw Exception('Failed to update meal: ${response.statusCode}');
  }
}
```

### Delete a Meal

```dart
Future<void> deleteMeal(String accessToken, String serverMealId) async {
  final response = await http.delete(
    Uri.parse('$apiBaseUrl/meals/$serverMealId'),
    headers: {
      'Authorization': 'Bearer $accessToken',
    },
  );

  if (response.statusCode != 204) {
    throw Exception('Failed to delete meal: ${response.statusCode}');
  }
}
```

### Fetch History

```dart
Future<List<MealLog>> fetchMealHistory(
  String accessToken, {
  int page = 1,
  int limit = 20,
}) async {
  final response = await http.get(
    Uri.parse('$apiBaseUrl/history?page=$page&limit=$limit'),
    headers: {
      'Authorization': 'Bearer $accessToken',
    },
  );

  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    final meals = json['meals'] as List;
    return meals.map((m) => MealLog.fromMap(m)).toList();
  } else {
    throw Exception('Failed to fetch history: ${response.statusCode}');
  }
}
```

### Fetch Daily Calories

```dart
Future<Map<String, double>> fetchDailyCalories(
  String accessToken,
  String startDate,
  String endDate,
) async {
  final response = await http.get(
    Uri.parse('$apiBaseUrl/history/calories?start_date=$startDate&end_date=$endDate'),
    headers: {
      'Authorization': 'Bearer $accessToken',
    },
  );

  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    final data = json['data'] as List;
    return {
      for (var entry in data)
        entry['date'] as String: (entry['total_calories'] as num).toDouble()
    };
  } else {
    throw Exception('Failed to fetch calories: ${response.statusCode}');
  }
}
```

---

## React Native Example

```js
const API_BASE_URL = 'https://api.nutrisimple.site/v1';

async function logMeal(accessToken, meal) {
  const response = await fetch(`${API_BASE_URL}/sync/meals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meal),
  });

  if (!response.ok) {
    throw new Error(`Failed to log meal: ${response.status}`);
  }

  const data = await response.json();
  return data.server_meal_id;
}

async function updateMeal(accessToken, serverMealId, meal) {
  const response = await fetch(`${API_BASE_URL}/meals/${serverMealId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meal),
  });

  if (!response.ok) {
    throw new Error(`Failed to update meal: ${response.status}`);
  }

  const data = await response.json();
  return data.server_meal_id;
}

async function deleteMeal(accessToken, serverMealId) {
  const response = await fetch(`${API_BASE_URL}/meals/${serverMealId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete meal: ${response.status}`);
  }
}

async function fetchMealHistory(accessToken, page = 1, limit = 20) {
  const response = await fetch(
    `${API_BASE_URL}/history?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.status}`);
  }

  return response.json();
}

async function fetchDailyCalories(accessToken, startDate, endDate) {
  const response = await fetch(
    `${API_BASE_URL}/history/calories?start_date=${startDate}&end_date=${endDate}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch calories: ${response.status}`);
  }

  return response.json();
}
```

---

## Best Practices

1. **Use `DateTime.now().millisecondsSinceEpoch`** for `timestamp` if the user does not provide a specific time.
2. **Send `date` as `YYYY-MM-DD`** in UTC or local time consistently.
3. **Cache `server_meal_id`** after logging so you can update or delete the entry later.
4. **Update the cached ID after `PUT`** because the backend may regenerate `server_meal_id`.
5. **Handle `409` on update** by prompting the user if a duplicate entry would be created.
6. **Limit history pagination** to `20`–`50` items per page for smooth scrolling.
7. **Request calorie summaries in weekly or monthly chunks** to stay under the 365-day limit.

---

## Related Endpoints

- `POST /v1/sync/profile` — push user profile
- `GET /v1/profile` — fetch user profile
