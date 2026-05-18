## ADDED Requirements

### Requirement: User can register with email and password
The system SHALL allow a new user to register with a unique email address and a password of at least 8 characters.

#### Scenario: Successful registration
- **WHEN** a user submits a valid email and password to POST /v1/auth/register
- **THEN** the system creates a new user with authProvider "email", hashes the password with bcrypt, issues access and refresh tokens, and returns the user object and tokens with HTTP 201

#### Scenario: Email already registered
- **WHEN** a user submits an email that already exists in the database
- **THEN** the system returns HTTP 409 with an error message

#### Scenario: Invalid input
- **WHEN** a user submits an invalid email or a password shorter than 8 characters
- **THEN** the system returns HTTP 400 with an error message

### Requirement: User can log in with email and password
The system SHALL authenticate a registered user by verifying their email and password.

#### Scenario: Successful login
- **WHEN** a registered user submits their correct email and password to POST /v1/auth/login
- **THEN** the system verifies the bcrypt hash, issues new access and refresh tokens, and returns the user object and tokens with HTTP 200

#### Scenario: Invalid credentials
- **WHEN** a user submits an incorrect email or password
- **THEN** the system returns HTTP 401 with an error message
