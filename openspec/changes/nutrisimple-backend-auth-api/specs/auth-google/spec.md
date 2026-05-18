## ADDED Requirements

### Requirement: User can sign in with Google
The system SHALL verify a Google ID token and authenticate or create a user linked to their Google account.

#### Scenario: Successful Google sign-in for existing user
- **WHEN** an existing user submits a valid Google ID token to POST /v1/auth/google
- **THEN** the system verifies the token using Google's tokeninfo endpoint, extracts sub, email, name, and picture, finds the existing user by providerId, and returns the user object and tokens with HTTP 200

#### Scenario: Successful Google sign-in for new user
- **WHEN** a new user submits a valid Google ID token to POST /v1/auth/google
- **THEN** the system verifies the token, creates a new user with authProvider "google", stores the Google sub as providerId, copies name to displayName and picture to photoUrl, and returns the user object and tokens with HTTP 200

#### Scenario: Invalid Google ID token
- **WHEN** a user submits an invalid or expired Google ID token
- **THEN** the system returns HTTP 401 with an error message
