# Fix Clerk signup on Vercel

If the browser console shows:

- `Cookie "__clerk_test_..." has been rejected for invalid domain`
- `Clerk has been loaded with development keys`

Clerk is blocking the session on your Vercel URL until you allow that domain.

## 1. Clerk Dashboard — allow your Vercel URLs

1. [Clerk Dashboard](https://dashboard.clerk.com) → your application
2. **Configure** → **Paths** (or **Domains**)
3. Under **Allowed redirect URLs**, add (one per line or comma-separated):

```
http://localhost:5173/*
https://blah-blah-jvc4.vercel.app/*
https://blah-blah-hky1.vercel.app/*
https://blah-blah-qvva.vercel.app/*
https://*.vercel.app/*
```

4. **Home URL** / **Sign-in URL** / **Sign-up URL** should match the app:
   - Sign-in: `/login`
   - Sign-up: `/signup`

5. **Configure** → **Developers** → **API keys** → enable **Vercel** integration if available (auto-adds preview URLs).

## 2. Vercel — environment variables

For **every** Vercel project that deploys the frontend:

| Key | Value |
|-----|--------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` from Clerk → API keys → Vite |
| `VITE_BACKEND_URL` | `https://blah-blah-3.onrender.com` (your **live** Render API, no trailing slash) |

Redeploy after saving env vars.

## 3. Render — backend must be up

Clerk only handles login. After signup, the app calls `POST /api/auth/sync` on Render.

Render needs at least:

- `CLERK_JWT_ISSUER=https://gorgeous-malamute-98.clerk.accounts.dev`
- `MONGODB_URI=.../vibetalk?...`
- `REDIS_URL=...`

Test: `https://YOUR-API.onrender.com/health` → `"status":"ok"`

## 4. Google OAuth in Clerk

**Configure** → **SSO connections** → **Google** → enabled.

Authorized redirect URI in Google Cloud Console must include Clerk’s callback URL (shown in Clerk Google settings).

## 5. Email + password in Clerk

**Configure** → **User & authentication**:

- Email: sign-up + sign-in ON
- Password: sign-up + sign-in ON
- Username: OFF (optional)

## Quick test

1. Open Vercel preview `/signup`
2. DevTools → Network: no cookie “rejected for invalid domain”
3. After signup, Network → `POST .../api/auth/sync` → **200**
