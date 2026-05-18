## ADDED Requirements

### Requirement: System issues JWT access tokens
The system SHALL issue HS256-signed JWT access tokens containing the user ID (sub) and email, with a configurable expiry defaulting to 15 minutes.

#### Scenario: Token issuance on authentication
- **WHEN** a user successfully registers, logs in, or completes OAuth sign-in
- **THEN** the system generates a JWT access token with sub, email, iat, and exp claims, signed with JWT_ACCESS_SECRET

### Requirement: System issues refresh tokens
The system SHALL issue opaque UUID refresh tokens stored in the database with an expiry date, defaulting to 7 days.

#### Scenario: Refresh token issuance on authentication
- **WHEN** a user successfully registers, logs in, or completes OAuth sign-in
- **THEN** the system generates a cryptographically random UUID, stores it in the RefreshToken collection with the user ID and expiry, and returns it alongside the access token

### Requirement: User can refresh an access token
The system SHALL allow a user to exchange a valid refresh token for a new access token.

#### Scenario: Successful token refresh
- **WHEN** a user submits a valid, non-expired refresh token to POST /v1/auth/refresh
- **THEN** the system looks up the token in the database, verifies it has not expired, issues a new access token, and returns the new tokens with HTTP 200

#### Scenario: Invalid or expired refresh token
- **WHEN** a user submits a refresh token that does not exist or has expired
- **THEN** the system returns HTTP 401 with an error message

### Requirement: User can log out
The system SHALL allow a user to revoke their refresh token on logout.

#### Scenario: Successful logout
- **WHEN** a user submits their refresh token to POST /v1/auth/logout
- **THEN** the system deletes the refresh token from the database if it exists and returns HTTP 204
