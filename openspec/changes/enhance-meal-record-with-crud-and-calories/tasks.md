## 1. Update Meal Record Shape

- [ ] 1.1 Update `POST /v1/sync/meals` to accept `date`, `timestamp`, `item`, `total_calories`
- [ ] 1.2 Default `timestamp` to current time when not provided
- [ ] 1.3 Update `server_meal_id` generation to `{date}-{timestamp}-{slugified-item}`
- [ ] 1.4 Update meal record matching logic to use `server_meal_id`
- [ ] 1.5 Update stored record shape to include `timestamp`

## 2. Add Meal CRUD Routes

- [ ] 2.1 Create `src/routes/meals.js` route module
- [ ] 2.2 Implement `PUT /v1/meals/:server_meal_id`
- [ ] 2.3 Implement `DELETE /v1/meals/:server_meal_id`
- [ ] 2.4 Validate update payload fields
- [ ] 2.5 Regenerate `server_meal_id` on update when date/timestamp/item change

## 3. Add Daily Calorie Summary

- [ ] 3.1 Add `GET /v1/history/calories` to `src/routes/history.js`
- [ ] 3.2 Validate `start_date` and `end_date` query parameters
- [ ] 3.3 Enforce max range of 365 days
- [ ] 3.4 Aggregate calories per date and return all dates in range with zero fill

## 4. Wire Up Routes

- [ ] 4.1 Import `mealsRoutes` in `src/index.js`
- [ ] 4.2 Mount routes at `/v1/meals`
- [ ] 4.3 Verify `/v1/history/calories` is accessible

## 5. Update Documentation

- [ ] 5.1 Update `FRONTEND_INTEGRATION.md` with new meal record shape
- [ ] 5.2 Document `PUT /v1/meals/:id` and `DELETE /v1/meals/:id`
- [ ] 5.3 Document `GET /v1/history/calories`
- [ ] 5.4 Update `24fit-backend.postman_collection.json`

## 6. Test

- [ ] 6.1 Test posting two same-item meals on same day with different timestamps
- [ ] 6.2 Test `PUT /v1/meals/:id` updates and regenerates ID
- [ ] 6.3 Test `DELETE /v1/meals/:id` removes record
- [ ] 6.4 Test `GET /v1/history/calories` returns daily totals
- [ ] 6.5 Test invalid date range and missing start_date

## 7. Deploy

- [ ] 7.1 Commit and push changes
- [ ] 7.2 Deploy to server
- [ ] 7.3 Verify production endpoints
