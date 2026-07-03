## ADDED Requirements

### Requirement: Authenticated users can modify a meal record
The system SHALL expose `PUT /v1/meals/:server_meal_id` to update `date`, `timestamp`, `item`, and `total_calories` of an existing meal record belonging to the authenticated user.

#### Scenario: Successful update
- **WHEN** an authenticated user sends `PUT /v1/meals/:server_meal_id` with valid fields
- **THEN** the system updates the record and returns `200 OK` with the new `{ server_meal_id }`

#### Scenario: Update not found
- **WHEN** an authenticated user sends `PUT /v1/meals/:server_meal_id` for a record that does not exist or does not belong to them
- **THEN** the system returns `404 Not Found`

#### Scenario: Invalid update payload
- **WHEN** an authenticated user sends `PUT /v1/meals/:server_meal_id` with invalid `total_calories` or `date`
- **THEN** the system returns `400 Bad Request`

### Requirement: Authenticated users can delete a meal record
The system SHALL expose `DELETE /v1/meals/:server_meal_id` to remove a meal record belonging to the authenticated user.

#### Scenario: Successful deletion
- **WHEN** an authenticated user sends `DELETE /v1/meals/:server_meal_id`
- **THEN** the system removes the record and returns `204 No Content`

#### Scenario: Delete not found
- **WHEN** an authenticated user sends `DELETE /v1/meals/:server_meal_id` for a record that does not exist or does not belong to them
- **THEN** the system returns `404 Not Found`
