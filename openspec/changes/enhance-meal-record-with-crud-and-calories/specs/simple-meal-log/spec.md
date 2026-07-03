## MODIFIED Requirements

### Requirement: Meal log includes date, timestamp, item, and total calories
The system SHALL store each meal log as `{ server_meal_id, date, timestamp, item, total_calories, updated_at }`, where `timestamp` allows multiple entries of the same item on the same day.

#### Scenario: Log a meal with timestamp
- **WHEN** an authenticated user sends `POST /v1/sync/meals` with `{ server_user_id, date, timestamp, item, total_calories }`
- **THEN** the system stores the meal and returns `{ server_meal_id }`

#### Scenario: Log two of the same item on the same day
- **WHEN** an authenticated user sends two meals with the same `date` and `item` but different `timestamp` values
- **THEN** the system creates two distinct meal records

#### Scenario: Timestamp defaults to current time
- **WHEN** an authenticated user sends a meal without a `timestamp`
- **THEN** the system uses the current Unix timestamp

## ADDED Requirements

### Requirement: server_meal_id includes timestamp
The system SHALL generate `server_meal_id` as `{date}-{timestamp}-{slugified-item}` to ensure uniqueness.

#### Scenario: Generate unique ID for same-day duplicate items
- **WHEN** two meals have the same `date` and `item` but different `timestamp` values
- **THEN** their `server_meal_id` values are different
