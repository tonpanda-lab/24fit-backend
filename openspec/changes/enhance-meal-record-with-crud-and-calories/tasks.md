## 1. Update Meal Record Shape

- [x] 1.1 Update `POST /v1/sync/meals` to accept `date`, `timestamp`, `item`, `total_calories`
- [x] 1.2 Default `timestamp` to current time when not provided
- [x] 1.3 Update `server_meal_id` generation to `{date}-{timestamp}-{slugified-item}`
- [x] 1.4 Update meal record matching logic to use `server_meal_id`
- [x] 1.5 Update stored record shape to include `timestamp`

## 2. Add Meal CRUD Routes

- [x] 2.1 Create `src/routes/meals.js` route module
- [x] 2.2 Implement `PUT /v1/meals/:server_meal_id`
- [x] 2.3 Implement `DELETE /v1/meals/:server_meal_id`
- [x] 2.4 Validate update payload fields
- [x] 2.5 Regenerate `server_meal_id` on update when date/timestamp/item change

## 3. Add Daily Calorie Summary

- [x] 3.1 Add `GET /v1/history/calories` to `src/routes/history.js`
- [x] 3.2 Validate `start_date` and `end_date` query parameters
- [x] 3.3 Enforce max range of 365 days
- [x] 3.4 Aggregate calories per date and return all dates in range with zero fill

## 4. Wire Up Routes

- [x] 4.1 Import `mealsRoutes` in `src/index.js`
- [x] 4.2 Mount routes at `/v1/meals`
- [x] 4.3 Verify `/v1/history/calories` is accessible

## 5. Update Documentation

- [x] 5.1 Update `FRONTEND_INTEGRATION.md` with new meal record shape
- [x] 5.2 Document `PUT /v1/meals/:id` and `DELETE /v1/meals/:id`
- [x] 5.3 Document `GET /v1/history/calories`
- [x] 5.4 Update `24fit-backend.postman_collection.json`

## 6. Test

- [x] 6.1 Test posting two same-item meals on same day with different timestamps
- [x] 6.2 Test `PUT /v1/meals/:id` updates and regenerates ID
- [x] 6.3 Test `DELETE /v1/meals/:id` removes record
- [x] 6.4 Test `GET /v1/history/calories` returns daily totals
- [x] 6.5 Test invalid date range and missing start_date

## 7. Deploy

- [x] 7.1 Commit and push changes
- [x] 7.2 Deploy to server
- [x] 7.3 Verify production endpoints
