## ADDED Requirements

### Requirement: Authenticated users can retrieve paginated meal history
The system SHALL expose a `GET /v1/history` endpoint that returns the authenticated user's meal history sorted by most recently updated first, with pagination support.

#### Scenario: Successful paginated history retrieval
- **WHEN** an authenticated user sends `GET /v1/history?page=1&limit=20` with a valid Bearer token
- **THEN** the system returns `200 OK` with a JSON body containing `{ "meals": [...], "pagination": { "page": 1, "limit": 20, "total": <count>, "totalPages": <pages> } }`

#### Scenario: Default pagination
- **WHEN** an authenticated user sends `GET /v1/history` without query parameters
- **THEN** the system returns page 1 with a default limit of 20 meals

#### Scenario: Empty history
- **WHEN** an authenticated user with no meals sends `GET /v1/history`
- **THEN** the system returns `200 OK` with `{ "meals": [], "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 } }`

#### Scenario: Limit exceeds maximum
- **WHEN** an authenticated user sends `GET /v1/history?limit=200`
- **THEN** the system clamps the limit to the configured maximum (100)

#### Scenario: Invalid pagination parameters
- **WHEN** an authenticated user sends `GET /v1/history?page=-1&limit=abc`
- **THEN** the system returns `400 Bad Request` with a clear error message

#### Scenario: Missing or invalid token
- **WHEN** a request is sent to `GET /v1/history` without a Bearer token or with an invalid/expired token
- **THEN** the system returns `401 Unauthorized` or `403 Forbidden`
