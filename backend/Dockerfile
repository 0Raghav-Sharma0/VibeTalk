FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src

# API: sockets + enqueue (no embedded workers in production)
FROM base AS api
ENV NODE_ENV=production
ENV RUN_WORKERS_IN_API=false
EXPOSE 5001
CMD ["node", "src/index.js"]

# Worker fleet: BullMQ + Redis emitter delivery
FROM base AS worker
ENV NODE_ENV=production
ENV WORKER_ONLY=true
CMD ["node", "src/workers/standalone.js"]
