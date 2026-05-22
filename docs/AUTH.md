# Authentication (simple)

VibeTalk uses **Clerk** for sign-in (Google OAuth, etc.). The backend does not issue its own tokens or server sessions.

## Flow

1. User signs in with Clerk in the browser (frontend unchanged).
2. Frontend sends the Clerk **session JWT** on every API call and socket connection:
   `Authorization: Bearer <token>`
3. Backend verifies that JWT with Clerk’s public keys (JWKS).
4. On first login, frontend calls `POST /api/auth/sync` to create/link the MongoDB user.
5. Protected routes require a valid JWT **and** a synced MongoDB user.

## Backend middleware

| Middleware   | What it does                                      |
|-------------|---------------------------------------------------|
| `verifyJwt` | Valid Clerk JWT only (`POST /auth/sync`)          |
| `requireAuth` | Valid JWT + MongoDB user (`req.user`)           |

Sockets use the same JWT check in `socketAuth.js` (`handshake.auth.token`).

## Env

- Frontend: `VITE_CLERK_PUBLISHABLE_KEY`
- Backend: `CLERK_JWT_ISSUER` (e.g. `https://your-app.clerk.accounts.dev`)

No `JWT_SECRET` — tokens come from Clerk, not this app.
