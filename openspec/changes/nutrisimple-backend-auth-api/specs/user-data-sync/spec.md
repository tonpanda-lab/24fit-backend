## ADDED Requirements

### Requirement: Authenticated user can push their profile
The system SHALL allow an authenticated user to upload or update their profile data.

#### Scenario: Successful profile push
- **WHEN** an authenticated user sends their profile to POST /v1/sync/profile with a valid Bearer token
- **THEN** the system upserts the UserData document for that user, stores the profile object, updates updatedAt, and returns HTTP 200

#### Scenario: Profile push without authentication
- **WHEN** a request to POST /v1/sync/profile lacks a valid Bearer token
- **THEN** the system returns HTTP 401 or 403

### Requirement: Authenticated user can push a meal entry
The system SHALL allow an authenticated user to upload or update a meal entry.

#### Scenario: Successful meal push
- **WHEN** an authenticated user sends a meal and its items to POST /v1/sync/meals with a valid Bearer token
- **THEN** the system upserts the meal into the user's UserData.meals array (matching by timestamp or assigning a server_meal_id), and returns HTTP 200 with the server_meal_id

#### Scenario: Meal push without authentication
- **WHEN** a request to POST /v1/sync/meals lacks a valid Bearer token
- **THEN** the system returns HTTP 401 or 403

### Requirement: Authenticated user can fetch all synced data
The system SHALL allow an authenticated user to retrieve their complete profile and all meal entries.

#### Scenario: Successful data fetch
- **WHEN** an authenticated user requests GET /v1/sync/data with a valid Bearer token and server_user_id query parameter
- **THEN** the system returns HTTP 200 with the user's profile and meals array

#### Scenario: Data fetch without authentication
- **WHEN** a request to GET /v1/sync/data lacks a valid Bearer token
- **THEN** the system returns HTTP 401 or 403
