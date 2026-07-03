## Why

The current simplified meal log only supports one entry per `date` + `item` combination, which prevents users from logging the same item multiple times on the same day. Additionally, clients need the ability to edit or delete individual meal records and retrieve daily calorie consumption totals over a date range.

## What Changes

- Enhance meal records to include both `date` and `timestamp`.
- Update `server_meal_id` generation to include `timestamp` so multiple entries of the same item can exist on the same day.
- Add `PUT /v1/meals/:server_meal_id` to modify an existing meal record.
- Add `DELETE /v1/meals/:server_meal_id` to delete a meal record.
- Add `GET /v1/history/calories` to return daily calorie consumption totals within a date range.
- Update `POST /v1/sync/meals` to accept the new record shape and generate timestamp-based IDs.
- Update Postman collection and `FRONTEND_INTEGRATION.md`.

## Capabilities

### New Capabilities

- `meal-crud`: Modify and delete individual meal records.
- `daily-calorie-summary`: Retrieve total calories consumed per day over a date range.

### Modified Capabilities

- `simple-meal-log`: Meal records now include `timestamp` and `server_meal_id` includes `timestamp` to allow duplicate items per day.

## Impact

- `src/routes/sync.js` — `POST /v1/sync/meals` updated to handle timestamp.
- `src/routes/meals.js` — new route module for `PUT` and `DELETE`.
- `src/routes/history.js` — new `GET /v1/history/calories` endpoint.
- `src/index.js` — mount new routes.
- Postman collection and frontend docs updated.
