# Deploy backend on Render

## Why the service exits immediately

If logs show only `✅ Cloudinary configured` then `Exited with status 1`, the process failed **before** MongoDB connected. Usually:

1. **`MONGODB_URI` or `CLERK_JWT_ISSUER` missing** in Render → Environment (`.env` is not deployed to Render).
2. **MongoDB connection failed** (wrong URI, IP not allowlisted in Atlas).

After the latest startup changes, logs will show `❌ Startup failed:` with the exact reason.

## Required environment variables (Render Dashboard)

| Key | Example / notes |
|-----|------------------|
| `MONGODB_URI` | `mongodb+srv://USER:PASS@cluster.mongodb.net/vibetalk?retryWrites=true&w=majority` — include `/vibetalk` database name |
| `CLERK_JWT_ISSUER` | `https://your-instance.clerk.accounts.dev` (no trailing slash) |
| `REDIS_URL` | From Render Redis or `redis://...` |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | Your Vercel URL(s), comma-separated |
| `CLOUDINARY_CLOUD_NAME` | |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | |
| `RUN_WORKERS_IN_API` | `true` (single web service) |
| `TRUST_PROXY` | `true` |

`PORT` is set automatically by Render — do not override unless needed.

## Service settings

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

## MongoDB Atlas

Network Access → allow `0.0.0.0/0` (or Render outbound IPs) so Atlas accepts connections from Render.

## After deploy

```bash
curl https://YOUR-SERVICE.onrender.com/health
```

Should return `"status":"ok"` when MongoDB is connected.
