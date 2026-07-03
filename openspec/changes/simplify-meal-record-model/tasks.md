## 1. Update Sync Meals Endpoint

- [x] 1.1 Update `POST /v1/sync/meals` in `src/routes/sync.js` to accept flat `{ date, item, total_calories }`
- [x] 1.2 Add validation for required fields (`date`, `item`, `total_calories`)
- [x] 1.3 Validate `date` is a valid `YYYY-MM-DD` string
- [x] 1.4 Validate `total_calories` is a non-negative number
- [x] 1.5 Match existing meals by `date` + `item` and update calories, or create new entry
- [x] 1.6 Return `{ server_meal_id }` on success

## 2. Update History & Sync Data Responses

- [x] 2.1 Verify `GET /v1/history` returns simplified meal records correctly
- [x] 2.2 Verify `GET /v1/sync/data` returns simplified meal records correctly

## 3. Update Documentation

- [x] 3.1 Update `FRONTEND_INTEGRATION.md` meal sync example to new flat format
- [x] 3.2 Update `FRONTEND_INTEGRATION.md` history response example
- [x] 3.3 Update `24fit-backend.postman_collection.json` `Push Meal` request body
- [x] 3.4 Update Postman collection history/profile response examples

## 4. Test

- [x] 4.1 Test `POST /v1/sync/meals` with valid flat payload
- [x] 4.2 Test `POST /v1/sync/meals` with missing fields returns 400
- [x] 4.3 Test `POST /v1/sync/meals` with invalid date returns 400
- [x] 4.4 Test `POST /v1/sync/meals` with negative calories returns 400
- [x] 4.5 Test updating the same `date` + `item` replaces calories
- [x] 4.6 Test `GET /v1/history` shows updated meal records

## 5. Deploy

- [x] 5.1 Commit and push changes to GitHub
- [x] 5.2 Deploy updated backend to server
- [x] 5.3 Verify endpoints on production
