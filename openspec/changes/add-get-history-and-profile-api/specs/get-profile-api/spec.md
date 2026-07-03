## ADDED Requirements

### Requirement: Authenticated users can retrieve their stored profile
The system SHALL expose a `GET /v1/profile` endpoint that returns the profile object stored for the authenticated user.

#### Scenario: Profile exists
- **WHEN** an authenticated user sends `GET /v1/profile` with a valid Bearer token
- **THEN** the system returns `200 OK` with a JSON body containing `{ "profile": <stored profile object> }`

#### Scenario: Profile does not exist
- **WHEN** an authenticated user sends `GET /v1/profile` with a valid Bearer token but has not yet pushed a profile
- **THEN** the system returns `200 OK` with a JSON body containing `{ "profile": null }`

#### Scenario: Missing or invalid token
- **WHEN** a request is sent to `GET /v1/profile` without a Bearer token or with an invalid/expired token
- **THEN** the system returns `401 Unauthorized` or `403 Forbidden`
