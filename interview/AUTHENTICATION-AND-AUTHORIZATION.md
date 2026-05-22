# NexAura — Authentication & Authorization (Interview Guide)

Use this as a **single script** when an interviewer asks about auth. Open files in the order below and read the **“Say this”** lines out loud. Total time: about **5–8 minutes** (short version) or **12–15 minutes** (full version).

---

## 30-second elevator pitch (memorize this)

> In NexAura, **authentication** is handled by **Clerk** on the frontend — users sign in with Google or email/password. Clerk gives us a **session JWT**. Our Express API and Socket.IO server **verify that JWT** using Clerk’s public keys (JWKS) — we never mint our own tokens or store server sessions. After login, we **sync** the Clerk user to a **MongoDB user** (`clerkId` + profile). The app then uses that Mongo user (`authUser` / `req.user`) for chat, friends, and groups.
>
> **Authorization** is separate: once we know *who* you are, we check *what* you can do — for example **group admin vs member**, friend-graph rules, and **socket sender checks** so you cannot impersonate another user in realtime events.

---

## Authentication vs authorization (define upfront)

| | Authentication | Authorization |
|---|----------------|-----------------|
| **Question** | Who are you? | What are you allowed to do? |
| **In NexAura** | Clerk login → JWT → middleware → `req.user` | Group roles, membership, `assertSocketSender` |
| **Fails with** | 401 Unauthorized | 403 Forbidden (or business error) |
| **Main files** | `clerk.js`, `auth.middleware.js`, `ClerkAuthBridge.jsx` | `group.rules.js`, `group.service.js`, `socket/utils.js` |

---

## Two “users” in the system (important distinction)

| Layer | What it is | Where it lives |
|-------|------------|----------------|
| **Clerk user** | Identity provider account (Google/email) | Clerk SDK — `useUser()`, session JWT |
| **App user** | Your chat account in MongoDB | `authUser` in Zustand, `req.user` on API |

**Say this:** “Clerk proves identity. Our database holds the application user we use for messages and friendships. The link is `clerkId` = JWT claim `sub`.”

---

## Demo flow — files to open (authentication)

Open these tabs **in order**. Paths below are relative to the **project root** (`frontend/`, `backend/`, `docs/`).

---

### Step 1 — App entry & Clerk

**Open:** `frontend/src/main.jsx`

**Say this:**

- “`ClerkProvider` only needs the publishable key — one prop. Login routes and styling live on the `<SignIn />` / `<SignUp />` pages.”
- “Inside that, `ClerkAuthBridge` runs on every page — it’s the glue between Clerk and our backend.”
- “We don’t build login crypto ourselves; Clerk is the identity provider.”

**Point at:** `ClerkProvider`, `ClerkAuthBridge`.

---

### Step 2 — Sign-in UI (optional, if they ask “how do users log in?”)

**Open:** `frontend/src/components/auth/AuthClerkSignIn.jsx`  
**Optional:** `frontend/src/components/auth/EmailPasswordSignInForm.jsx`

**Say this:**

- “Top block: Clerk’s `<SignIn />` — **Google OAuth**.”
- “Bottom block: custom **email + password** form using Clerk’s headless `useSignIn` API — still Clerk, not our backend.”
- “Sign-up is the same pattern on `/signup` with `AuthClerkSignUp.jsx`.”

**Skip unless asked:** `frontend/src/pages/auth.css` (styling only).

---

### Step 3 — Bridge: Clerk session → Mongo user

**Open:** `frontend/src/components/ClerkAuthBridge.jsx`

**Say this:**

- “When Clerk says the user is signed in, we call `syncUser` with profile data from Clerk.”
- “We also register `getToken()` into `tokenBridge` so axios and sockets can attach the JWT.”
- “If not signed in, we `clearAuth()` — disconnect socket and clear `authUser`.”
- “We skip re-sync if `authUser` already exists to avoid duplicate API calls.”

**Point at:** lines with `setClerkTokenGetter`, `syncUser(toSyncProfile(clerkUser))`, `clearAuth`.

**Open next (small):** `frontend/src/utils/clerkProfile.js`

**Say this:** “This maps Clerk’s user object to `{ email, fullName, profilePic }` for the sync API.”

---

### Step 4 — Client state: who is logged in *in our app*

**Open:** `frontend/src/store/useAuthStore.js`

**Say this:**

- “`authUser` is our **MongoDB user DTO** returned from the backend — not the Clerk object.”
- “`syncUser` calls `POST /api/auth/sync` and stores the result.”
- “Route guards in `App.jsx` use `authUser`, so you can’t use chat until sync succeeds.”
- “On failure we toast — e.g. API down on Render while Clerk login worked.”

**Optional:** `frontend/src/App.jsx` — show routes redirect to `/login` without `authUser`.

---

### Step 5 — Sending the JWT on HTTP

**Open:** `frontend/src/lib/tokenBridge.js` then `frontend/src/lib/axios.js`

**Say this:**

- “Hooks can’t be used inside axios interceptors, so we store Clerk’s `getToken` in a small bridge.”
- “Every API request adds `Authorization: Bearer <token>` if a session exists.”
- “On 401 we log a warning; we don’t auto-logout — Clerk handles session refresh.”

**Open:** `frontend/src/services/authApi.js`

**Say this:** “Auth endpoints: `sync`, `check-auth`, `update-profile` — all go through that axios instance.”

---

### Step 6 — Auth API routes

**Open:** `backend/src/routes/auth.route.js`

**Say this:**

- “`POST /sync` uses **`verifyJwt`** only — valid JWT, user may not exist in Mongo yet.”
- “`GET /check-auth` and `PUT /update-profile` use **`requireAuth`** — JWT + synced Mongo user.”
- “Rate limited: 60 requests per 15 minutes.”
- “Mounted at `/api/auth` and `/api/v1/auth`.”

**Open:** `backend/src/controllers/auth.controller.js` then `backend/src/services/auth.service.js`

**Say this:**

- “Controller is thin; `authService.syncUser` merges JWT claims + body and calls `findOrCreateFromClerk`.”
- “Update profile can upload avatar to Cloudinary.”

---

### Step 7 — JWT verification (backend core)

**Open:** `backend/src/lib/clerk.js`

**Say this:**

- “We use the `jose` library and Clerk’s **JWKS** URL: `{CLERK_JWT_ISSUER}/.well-known/jwks.json`.”
- “We verify **issuer** and signature — no `JWT_SECRET` in our app.”
- “`verifyBearerToken` returns `clerkId` from claim `sub` — used by HTTP middleware and sockets.”
- “This is **stateless**: we don’t store sessions in Redis or cookies for auth.”

**Env (mention, don’t open unless asked):** `CLERK_JWT_ISSUER` in `backend/src/config/env.js`, `VITE_CLERK_PUBLISHABLE_KEY` on frontend.

---

### Step 8 — HTTP middleware

**Open:** `backend/src/middleware/auth.middleware.js`

**Say this:**

- “**`verifyJwt`**: Bearer token valid → set `req.clerkId` and `req.jwtClaims`.”
- “**`requireAuth`**: same + load user from Mongo with cache → set `req.user`.”
- “All protected REST routes use `requireAuth` — messages, friends, groups.”

**Open one example:** `backend/src/routes/message.route.js` (or `friend.route.js`)

**Say this:** “Every handler is behind `requireAuth` — if JWT is missing or invalid, we never hit the controller.”

---

### Step 9 — User persistence & sync

**Open:** `backend/src/domain/user.dto.js`

**Say this:** “`toUserDTO` strips sensitive fields. `profileFromClerkPayload` builds profile from JWT claims and request body.”

**Open:** `backend/src/services/user.service.js` (scroll to `findOrCreateFromClerk`, `getByClerkIdCached`)

**Say this:**

- “First login: create Mongo user with `clerkId`, or **link legacy** account by email.”
- “`getByClerkIdCached` — 5-minute cache; throws if user never synced.”

**Optional:** `backend/src/models/user.model.js` — show `clerkId` field; `password` is legacy/unused with Clerk.

---

### Step 10 — WebSocket authentication

**Open:** `frontend/src/hooks/useAuthSocket.js` (connect + `auth: { token }`)

**Say this:** “Socket connects only when `authUser._id` exists. Handshake sends Clerk JWT in `auth.token`. On reconnect we refresh the token.”

**Open:** `backend/src/lib/socketAuth.js`

**Say this:**

- “Same `verifyBearerToken` as HTTP.”
- “Loads Mongo user by `clerkId`; if missing → **user not synced**.”
- “Sets `socket.userId` from Mongo `_id` — that’s the ID used in chat pipelines.”

**Optional chain:** `frontend/src/components/AuthSocketProvider.jsx` — wires socket into Zustand when `authUser` exists.

---

### End-to-end authentication trace (one sentence)

**Say this:**

> User signs in with Clerk → `ClerkAuthBridge` syncs → `authUser` in Zustand → axios/socket send Bearer JWT → `verifyJwt` or `requireAuth` / `socketAuth` verify with JWKS → `req.user` / `socket.userId` for the rest of the app.

---

## Demo flow — files to open (authorization)

Open **after** authentication is clear. Say: “Now that we know who you are, we enforce permissions.”

---

### Step A — Route-level gate (authentication, not fine-grained authz)

**Open:** `backend/src/routes/group.route.js`

**Say this:** “You must be logged in (`requireAuth`) to hit any group endpoint. That’s still authentication.”

---

### Step B — Business rules: who can do what

**Open:** `backend/src/domain/group.rules.js`

**Say this:**

- “`isMember` — can read/send in group context.”
- “`isAdmin` — can add/remove members (except rules in service).”
- “Pure functions — easy to test, no HTTP knowledge.”

**Open:** `backend/src/services/group.service.js` (search for `groupRules.isAdmin`, `isMember`)

**Say this:**

- “Before mutating a group, service checks admin/member.”
- “Example: only admin can add members; must be friends with invitee.”
- “This is **authorization** — assumes `req.user` is already set by middleware.”

---

### Step C — Realtime authorization

**Open:** `backend/src/presentation/socket/utils.js`

**Say this:**

- “`assertSocketSender` ensures `senderId` in the event payload matches `socket.userId`.”
- “Prevents a connected user from sending messages as someone else.”
- “Authentication got them on the socket; this checks each action.”

**Optional:** `backend/src/presentation/socket/handlers/messaging.handler.js` — show where `assertSocketSender` is used.

---

### What we do **not** have (good to mention honestly)

- No app-wide RBAC (no “superadmin” role on users).
- No custom JWT issuance or refresh tokens on our backend.
- No cookie-based session store for API auth.
- `GET /auth/check-auth` exists but frontend relies on **sync** on login instead.
- Watch party has looser client `user` payload in places — messaging is stricter.

---

## Quick reference — all auth-related files

### Must-know (show in interview)

| File | Role |
|------|------|
| `frontend/src/main.jsx` | ClerkProvider root |
| `frontend/src/components/ClerkAuthBridge.jsx` | Sync + token bridge |
| `frontend/src/lib/axios.js` | Bearer JWT on API |
| `frontend/src/store/useAuthStore.js` | App user state |
| `backend/src/lib/clerk.js` | JWT verify (JWKS) |
| `backend/src/middleware/auth.middleware.js` | `verifyJwt`, `requireAuth` |
| `backend/src/routes/auth.route.js` | Auth HTTP API |
| `backend/src/lib/socketAuth.js` | Socket JWT auth |
| `backend/src/domain/group.rules.js` | Authorization example |
| `backend/src/presentation/socket/utils.js` | Socket sender check |

### Supporting (open if asked)

| File | Role |
|------|------|
| `frontend/src/lib/tokenBridge.js` | getToken for non-React code |
| `frontend/src/services/authApi.js` | sync / profile API calls |
| `frontend/src/utils/clerkProfile.js` | Clerk → sync body |
| `frontend/src/hooks/useAuthSocket.js` | Socket lifecycle |
| `frontend/src/components/auth/AuthClerkSignIn.jsx` | Google + email UI |
| `frontend/src/components/auth/EmailPasswordSignInForm.jsx` | Email/password sign-in |
| `backend/src/controllers/auth.controller.js` | HTTP handlers |
| `backend/src/services/auth.service.js` | Sync / update profile |
| `backend/src/services/user.service.js` | findOrCreate, cache |
| `backend/src/domain/user.dto.js` | DTO + profile mapping |
| `backend/src/repositories/user.repository.js` | DB access |
| `backend/src/models/user.model.js` | User schema + `clerkId` |
| `backend/src/services/group.service.js` | Admin/member enforcement |
| `backend/src/routes/message.route.js` | `requireAuth` example |
| `docs/AUTH.md` | Short architecture note |

### Skip in interview unless relevant

| File | Why skip |
|------|----------|
| `frontend/src/pages/auth.css` | UI only |
| `frontend/src/hooks/useAuthIllustrationReady.js` | Lottie loading |
| `backend/scripts/clear-clerk-users.js` | Dev ops script |
| `docs/CLERK_VERCEL.md` | Deploy troubleshooting |

---

## Likely interview questions & short answers

**Why Clerk instead of rolling your own auth?**  
OAuth, email verification, 2FA, and session management are security-sensitive. Clerk handles that; we focus on chat logic and map users to MongoDB.

**Why sync to MongoDB if Clerk already has the user?**  
Chat, friends, groups, and messages reference **Mongo `_id`**. Clerk `sub` is stored as `clerkId` for lookup. Sync also links pre-Clerk legacy users by email.

**Why two middlewares (`verifyJwt` vs `requireAuth`)?**  
On first login, JWT is valid but Mongo user may not exist yet. `/sync` only needs JWT; everything else needs a synced app user.

**How do you scale auth across multiple API servers?**  
JWT verification is stateless (JWKS). No sticky sessions required. Socket scale-out uses Redis adapter when `REDIS_URL` works.

**What happens if JWT expires?**  
Clerk frontend refreshes session; `getToken()` returns a new JWT. Socket reconnect handler refreshes `socket.auth.token`.

**Difference between 401 and 403 in your app?**  
401: bad/missing JWT or user not synced. 403-style: logged in but not allowed (e.g. not group admin) — often returned as 400/403 from `AppError` in services.

**Is `withCredentials: true` used for auth?**  
Axios sends it, but auth is **Bearer JWT**, not cookies.

---

## 5-tab minimal setup (time-crunched interview)

If you only open **5 files**, use these and follow Steps 3, 5, 7, 8, B:

1. `frontend/src/components/ClerkAuthBridge.jsx`
2. `frontend/src/lib/axios.js`
3. `backend/src/lib/clerk.js`
4. `backend/src/middleware/auth.middleware.js`
5. `backend/src/domain/group.rules.js`

---

## Diagram to draw on whiteboard

```text
┌─────────────┐     Google / Email      ┌──────────────┐
│   Browser   │ ──────────────────────► │    Clerk     │
└──────┬──────┘                         └──────┬───────┘
       │ session JWT                            │
       │ POST /api/auth/sync                    │
       ▼                                        │
┌─────────────┐     verify JWT (JWKS)          │
│   Express   │ ◄──────────────────────────────┘
│  requireAuth│
└──────┬──────┘
       │ req.user (Mongo)
       ▼
┌─────────────┐     isAdmin / isMember
│   Groups    │     assertSocketSender
│  Messages   │
└─────────────┘
```

---

## Closing line

> “Authentication is **Clerk JWT + JWKS + Mongo sync**. Authorization is **middleware for login** plus **domain rules** for groups and **sender checks** on sockets. I can trace any request from the login button to `req.user` or walk through a group admin action if you’d like.”

---

*Last aligned with codebase: simplified auth middleware (`verifyJwt`, `requireAuth`) and Clerk-first flow.*


One interesting challenge I faced was maintaining authentication consistency across multiple layers of the application.

We were using Clerk for authentication, but we also had our own backend APIs, Zustand frontend state management, Axios interceptors, and Socket.IO realtime connections. The main issue was that authentication state could easily go out of sync between these systems, especially during page refreshes, async initialization, or token expiration scenarios.

For example, Clerk could consider the user authenticated while the backend APIs or socket connections were missing valid JWTs, causing authorization failures and race conditions.

To solve this, I designed a centralized authentication synchronization architecture. I introduced a ClerkAuthBridge layer to synchronize Clerk sessions with frontend state and backend user records. I also implemented a token bridge pattern so that Axios interceptors and sockets could securely access JWTs outside React components.

On the backend, I used JOSE with JWKS-based verification to securely validate Clerk-issued JWTs using public key cryptography. I also unified REST and Socket.IO authentication through a shared verification layer.

This architecture significantly improved reliability, reduced auth-related bugs, and made the authentication system scalable and maintainable.
