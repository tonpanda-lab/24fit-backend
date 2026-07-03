## MODIFIED Requirements

### Requirement: Sync meals endpoint accepts flat meal records
The system SHALL change `POST /v1/sync/meals` to accept a flat meal record with `date`, `item`, and `total_calories` instead of the previous nested `meal` + `items` structure.

#### Scenario: Successful sync with new flat format
- **WHEN** an authenticated user sends `POST /v1/sync/meals` with body `{ "server_user_id": "...", "date": "2024-01-15", "item": "Oatmeal", "total_calories": 300 }`
- **THEN** the system stores the meal and returns `200 OK` with `{ "server_meal_id": "..." }`

#### Scenario: Update existing meal for same date and item
- **WHEN** an authenticated user sends a meal with the same `date` and `item` as an existing meal
- **THEN** the system updates the existing meal's `total_calories` and `updated_at`

#### Scenario: Invalid date format
- **WHEN** an authenticated user sends a meal with an invalid `date` format
- **THEN** the system returns `400 Bad Request`

#### Scenario: Invalid total_calories
- **WHEN** an authenticated user sends a meal with a negative or non-numeric `total_calories`
- **THEN** the system returns `400 Bad Request`

## REMOVED Requirements

### Requirement: Sync meals endpoint accepted nested meal and items array
**Reason**: The frontend only needs to log item, date, and total calories. The nested structure added unnecessary complexity.
**Migration**: Clients should update `POST /v1/sync/meals` payloads from `{ server_user_id, meal, items }` to `{ server_user_id, date, item, total_calories }`.
