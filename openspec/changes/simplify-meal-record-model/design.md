## Context

The current `POST /v1/sync/meals` endpoint accepts a nested structure:

```json
{
  "server_user_id": "...",
  "meal": { "timestamp": "...", "type": "...", "total_calories": 450 },
  "items": [{ "name": "...", "calories": 300 }]
}
```

The frontend only needs to log the food item, the date consumed, and the total calories for that entry. The new design flattens this into a single record.

## Goals / Non-Goals

**Goals:**
- Simplify the `POST /v1/sync/meals` request body to `{ date, item, total_calories }`.
- Store meal logs as flat objects in `UserData.meals`.
- Keep `GET /v1/history` and `GET /v1/sync/data` returning the same simplified shape.
- Update API documentation and Postman collection.

**Non-Goals:**
- No database schema migration (meals remain an array of objects).
- No new endpoints.
- No changes to auth, profile sync, or existing GET endpoints beyond response shape.

## Decisions

1. **Date format**: Use ISO 8601 date strings (`YYYY-MM-DD`) for the `date` field. This is simple, timezone-friendly for daily logging, and easy to validate.

2. **Meal matching strategy**: Replace the previous timestamp-based matching. Match incoming logs by `date` + `item` to update an existing entry's `total_calories`, or create a new entry if no match exists. This allows users to correct a calorie count for a specific item on a specific day.

3. **Response shape**: `POST /v1/sync/meals` continues to return `{ server_meal_id }` for compatibility, but the `server_meal_id` is now generated as a deterministic key from `date` + `item` (or a UUID if not available). This makes idempotent updates easier for clients.

4. **Stored object shape**:
   ```json
   {
     "server_meal_id": "2024-01-15-oatmeal",
     "date": "2024-01-15",
     "item": "Oatmeal",
     "total_calories": 300,
     "updated_at": "2024-01-15T10:30:00.000Z"
   }
   ```

5. **Validation**: `date`, `item`, and `total_calories` are required. `total_calories` must be a non-negative number. `item` must be a non-empty string. `date` must be a valid `YYYY-MM-DD` string.

## Risks / Trade-offs

- **[Risk]** Existing meal documents in MongoDB use the old nested shape. They will still be returned by history endpoints but may not match future updates correctly.  
  → **Mitigation**: Document the breaking change. Clients can re-push historical data in the new format if needed, or we can run a one-time migration later.

- **[Risk]** Deterministic `server_meal_id` from `date` + `item` can collide if the same item is logged twice on the same day.  
  → **Mitigation**: For this use case, same item on same day is treated as an update. If users need multiple servings of the same item, they can log "Oatmeal (2 servings)" or similar. This matches the simplified logging model.

- **[Risk]** Flattening removes per-item calorie breakdown.  
  → **Mitigation**: This is intentional. The frontend only needs total calories per entry.

## Migration Plan

- Update `src/routes/sync.js` to accept and store the new flat shape.
- Update `src/routes/history.js` sort to use `updated_at` (already in place).
- Update Postman collection and `FRONTEND_INTEGRATION.md`.
- Deploy to server.
- Communicate the breaking change to frontend developers.
