## ADDED Requirements

### Requirement: Authenticated users can retrieve daily calorie totals
The system SHALL expose `GET /v1/history/calories` that returns total calories consumed per day within a date range.

#### Scenario: Successful summary retrieval
- **WHEN** an authenticated user sends `GET /v1/history/calories?start_date=2024-01-01&end_date=2024-01-31`
- **THEN** the system returns `200 OK` with an array of `{ date, total_calories }` for each day in the range

#### Scenario: Days with no meals show zero
- **WHEN** a date within the requested range has no meals
- **THEN** the response includes `{ date, total_calories: 0 }` for that day

#### Scenario: Missing start_date
- **WHEN** an authenticated user sends `GET /v1/history/calories` without `start_date`
- **THEN** the system returns `400 Bad Request`

#### Scenario: Invalid date range
- **WHEN** an authenticated user sends `end_date` before `start_date`
- **THEN** the system returns `400 Bad Request`

#### Scenario: Range too wide
- **WHEN** an authenticated user requests a range exceeding 365 days
- **THEN** the system returns `400 Bad Request`
