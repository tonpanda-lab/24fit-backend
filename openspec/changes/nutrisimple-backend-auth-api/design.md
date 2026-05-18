## Context

This is a greenfield backend for the NutriSimple Flutter app. There is no existing server, database, or API. The Flutter app currently operates entirely offline and needs a backend to support user accounts, authentication, and cross-device data synchronization.

Constraints:
- MongoDB as the primary database (team preference, flexible schema for evolving mobile data)
- Node.js + Express runtime (widely supported, fast to prototype)
- JWT-based auth (stateless, mobile-friendly)
- OAuth providers: Apple and Google (required by app store policies and user expectations)

## Goals / Non-Goals

**Goals:**
- Provide secure user authentication via email/password, Apple Sign-In, and Google Sign-In
- Issue short-lived JWT access tokens and long-lived refresh tokens
- Protect sync endpoints with Bearer token middleware
- Store and retrieve user profile and meal data
- Enable CORS for Flutter mobile clients

**Non-Goals:**
- Password reset / email verification flows
- Rate limiting or DDoS protection
- Admin dashboard or user management UI
- File upload or image hosting
- Real-time sync (WebSockets / SSE)
- Production deployment scripts or Docker configuration

## Decisions

**MongoDB + Mongoose over SQL**
- Rationale: User data structure mirrors Flutter maps/objects which evolve frequently. MongoDB's schemaless nature avoids migration overhead for early-stage mobile data models.
- Alternative considered: PostgreSQL with JSONB — rejected due to added operational complexity for a small team.

**UUID refresh tokens over JWT refresh tokens**
- Rationale: UUIDs stored in DB allow instantaneous revocation (logout deletes the row). JWT refresh tokens would require a denylist or short expiry, adding complexity.
- Trade-off: Requires a DB lookup on every refresh, but `RefreshToken` collection is small and indexed.

**HS256 for access tokens over RS256**
- Rationale: Single backend server — no need for public key distribution. HS256 is simpler to configure and faster to verify.
- Trade-off: If the service scales to multiple instances, a shared secret or switch to RS256 will be needed.

**OAuth verification on backend over frontend-only OAuth**
- Rationale: The Flutter app sends identity tokens to the backend, which verifies them against Apple/Google public keys/APIs. This keeps the client lightweight and centralizes trust.
- Apple Sign-In: Verify JWT signature using Apple's JWKS endpoint (`https://appleid.apple.com/auth/keys`), extract `sub` and `email`.
- Google Sign-In: Verify ID token using Google's tokeninfo endpoint (`https://oauth2.googleapis.com/tokeninfo?id_token=...`), extract `sub`, `email`, `name`, `picture`.

**In-place meal upsert over full sync protocol**
- Rationale: For MVP, matching meals by `timestamp` (or assigning `server_meal_id`) on push is sufficient. A full CRDT or sync protocol is unnecessary complexity at this stage.

## Risks / Trade-offs

- **Risk**: Apple/Google public key fetch failures block OAuth sign-in → Mitigation: Cache JWKS with a TTL; fallback to re-fetch on verify failure.
- **Risk**: MongoDB connection failures crash the app → Mitigation: Use mongoose connection event handlers; process exits gracefully so orchestrator can restart.
- **Risk**: Refresh token leaks grant long-lived access → Mitigation: Store expiry in DB; on logout, delete token immediately. Consider refresh token rotation in future.
- **Risk**: No rate limiting exposes brute-force on login → Mitigation: Document as future work; recommend placing behind API gateway or Cloudflare.

## Migration Plan

Not applicable — greenfield project. Deploy by setting environment variables and starting the Node.js process.

## Open Questions

- Should we implement refresh token rotation (issue new refresh token on every use)? Documented in BACKEND_INTEGRATION.md as optional — deferred to post-MVP.
- Should `UserData` meals use a separate collection or embedded array? Decision: embedded array for atomic user-document updates at MVP scale.
