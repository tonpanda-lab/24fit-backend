## Why

The current meal sync model requires clients to send a nested `meal` object plus a separate `items` array, which is overly complex for the app's actual needs. The frontend only needs to log what was eaten, the date it was eaten, and the total calories for that entry. Simplifying the model reduces client-side complexity and aligns the API with the real use case.

## What Changes

- **BREAKING**: Change `POST /v1/sync/meals` request body from a nested `meal` + `items` structure to a flat record containing `date`, `item`, and `total_calories`.
- Store each meal log as a flat object in the `UserData.meals` array.
- Update `GET /v1/history` to return the simplified meal records.
- Update `GET /v1/sync/data` to return the simplified meal records.
- Update Postman collection and `FRONTEND_INTEGRATION.md` to reflect the new request/response shape.

## Capabilities

### New Capabilities

- `simple-meal-log`: Log a single meal entry with date, item name, and total calories.

### Modified Capabilities

- `sync-meals`: Request body and stored shape change from nested `meal` + `items` to flat `{ date, item, total_calories }`. Existing data in MongoDB that uses the old shape will remain but may be displayed as-is until migrated or replaced.

## Impact

- `src/routes/sync.js` — `POST /v1/sync/meals` handler updated.
- `src/routes/history.js` — history response shape updated (no structural code change needed).
- `src/models/UserData.js` — no schema change needed (meals remain an array of objects).
- Frontend/mobile clients must update the request payload they send.
- Postman collection and docs updated.
