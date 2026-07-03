## Context

The meal logging feature was recently simplified to `{ date, item, total_calories }`, with `server_meal_id` derived from `date` + `item`. This design prevents logging the same item more than once per day and lacks update/delete capabilities.

## Goals / Non-Goals

**Goals:**
- Add `timestamp` to meal records so multiple same-item entries can exist on the same day.
- Include `timestamp` in `server_meal_id` generation.
- Add `PUT /v1/meals/:server_meal_id` to update a meal's `item`, `total_calories`, and `date`.
- Add `DELETE /v1/meals/:server_meal_id` to remove a meal.
- Add `GET /v1/history/calories` to return daily calorie totals for a date range.

**Non-Goals:**
- No database schema migration.
- No changes to auth or profile endpoints.
- No batch create/update/delete operations.

## Decisions

1. **Record shape**: Each meal record stores `{ server_meal_id, date, timestamp, item, total_calories, updated_at }`.

2. **Timestamp format**: Use Unix timestamp in milliseconds (integer) for stable, sortable values. Clients may also send ISO strings and the server will convert them.

3. **server_meal_id format**: `{date}-{timestamp}-{slugified-item}`. Example: `2024-01-15-1705312800000-oatmeal`. This guarantees uniqueness across same-day duplicates.

4. **Update behavior**: `PUT /v1/meals/:server_meal_id` finds the record by ID, updates allowed fields, and regenerates the ID if `date`, `timestamp`, or `item` changes. Returns the new `server_meal_id`.

5. **Calorie summary**: `GET /v1/history/calories?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` aggregates `total_calories` per `date`. Dates with no meals return `0`.

6. **Date validation**: `start_date` and `end_date` must be valid `YYYY-MM-DD` strings. `end_date` may be omitted (defaults to today).

## Risks / Trade-offs

- **[Risk]** Changing `server_meal_id` format means existing records created before this change keep old IDs and new entries get new IDs. Mixed ID formats are acceptable because lookups use the stored ID.  
  → **Mitigation**: None needed; lookup is by stored ID.

- **[Risk]** `PUT` regenerating the ID could surprise clients that cache IDs.  
  → **Mitigation**: Return the new `server_meal_id` in the response so clients can update their cache.

- **[Risk]** Calorie summary with a very wide date range could return many zero entries.  
  → **Mitigation**: Cap the range (e.g., 365 days) and document it.

## Migration Plan

- Update sync meals to accept optional `timestamp` and generate new ID format.
- Add new routes.
- Update docs and Postman.
- Deploy.
