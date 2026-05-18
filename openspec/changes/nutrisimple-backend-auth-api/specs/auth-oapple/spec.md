## ADDED Requirements

### Requirement: User can sign in with Apple
The system SHALL verify an Apple identity token and authenticate or create a user linked to their Apple account.

#### Scenario: Successful Apple sign-in for existing user
- **WHEN** an existing user submits a valid Apple identity token to POST /v1/auth/apple
- **THEN** the system verifies the token signature using Apple's public keys, extracts the Apple user ID (sub) and email, finds the existing user by providerId, and returns the user object and tokens with HTTP 200

#### Scenario: Successful Apple sign-in for new user
- **WHEN** a new user submits a valid Apple identity token to POST /v1/auth/apple
- **THEN** the system verifies the token, creates a new user with authProvider "apple", stores the Apple user ID as providerId, and returns the user object and tokens with HTTP 200

#### Scenario: Invalid Apple identity token
- **WHEN** a user submits an invalid or expired Apple identity token
- **THEN** the system returns HTTP 401 with an error message
