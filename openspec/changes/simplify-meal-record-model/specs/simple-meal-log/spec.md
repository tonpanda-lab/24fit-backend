## ADDED Requirements

### Requirement: Meal log contains only date, item, and total calories
The system SHALL store each meal log as a flat object containing `date`, `item`, and `total_calories`.

#### Scenario: Log a simple meal
- **WHEN** an authenticated user sends a meal with `date`, `item`, and `total_calories`
- **THEN** the system stores the meal as `{ date, item, total_calories, server_meal_id, updated_at }`

#### Scenario: Reject missing fields
- **WHEN** an authenticated user sends a meal without `date`, `item`, or `total_calories`
- **THEN** the system returns `400 Bad Request`

#### Scenario: Reject invalid calories
- **WHEN** an authenticated user sends a meal with a negative `total_calories`
- **THEN** the system returns `400 Bad Request`
