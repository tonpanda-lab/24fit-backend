## ADDED Requirements

### Requirement: Verify Google ID token server-side
The system SHALL verify every Google ID token using `google-auth-library` before processing a Google Sign-In request.

#### Scenario: Valid token is accepted
- **WHEN** the client sends a valid Google ID token minted for the configured `GOOGLE_CLIENT_ID` audience
- **THEN** the system SHALL extract the Google `sub`, email, name, and picture from the verified payload

#### Scenario: Invalid token is rejected
- **WHEN** the client sends an ID token with an invalid signature, expired `exp`, wrong `aud`, or wrong `iss`
- **THEN** the system SHALL respond with HTTP 401 and the error message `Invalid Google ID token`

### Requirement: Find or create Google user
The system SHALL locate an existing user by Google `providerId` or create a new Google user when verification succeeds.

#### Scenario: Existing Google user signs in
- **WHEN** a verified Google `sub` matches an existing user with `authProvider: 'google'`
- **THEN** the system SHALL issue tokens for that existing user without creating a duplicate account

#### Scenario: New Google user signs in
- **WHEN** a verified Google `sub` does not match any existing user
- **THEN** the system SHALL create a new user with `authProvider: 'google'`, the Google `sub` as `providerId`, and the verified email, name, and picture

### Requirement: Enforce unique Google provider ID
The system SHALL enforce that each Google `providerId` maps to at most one user account.

#### Scenario: Duplicate Google provider ID is prevented
- **WHEN** the database contains a user with a given `providerId`
- **THEN** the system SHALL reject any attempt to create another user with the same `providerId`

### Requirement: Issue NutriSimple tokens on successful Google Sign-In
The system SHALL issue a NutriSimple access token and refresh token after successful Google Sign-In.

#### Scenario: Successful Google Sign-In returns tokens and user
- **WHEN** Google token verification succeeds and a user is found or created
- **THEN** the system SHALL respond with HTTP 200 containing `tokens.access_token`, `tokens.refresh_token`, and the user object (`id`, `email`, `display_name`, `photo_url`)

### Requirement: Validate request payload
The system SHALL reject Google Sign-In requests that do not include a valid `id_token`.

#### Scenario: Missing id_token
- **WHEN** the client sends a request without an `id_token` field
- **THEN** the system SHALL respond with HTTP 400 and the error message `Missing id_token`

#### Scenario: Non-string id_token
- **WHEN** the client sends an `id_token` that is not a string
- **THEN** the system SHALL respond with HTTP 400 and the error message `Missing id_token`
