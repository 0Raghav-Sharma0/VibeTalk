/**
 * 10k concurrent-user tuning — all values overridable via env.
 * Target: ~2,500 sockets per API pod × 4 pods = 10,000 online.
 */
function num(key, fallback) {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function bool(key, defaultValue) {
  if (process.env[key] === undefined) return defaultValue;
  return process.env[key] === "true" || process.env[key] === "1";
}

export const scaleConfig = {
  /** Design target (documentation / metrics labels) */
  targetConcurrentUsers: num("SCALE_TARGET_CONCURRENT", 10_000),

  /** Suggested API replicas behind LB with sticky sessions */
  apiReplicas: num("SCALE_API_REPLICAS", 4),

  /** Suggested worker replicas (same Redis queues, horizontal consumers) */
  workerReplicas: num("SCALE_WORKER_REPLICAS", 6),

  /** Connections per API instance (soft planning number) */
  connectionsPerApiInstance: num("SCALE_CONNECTIONS_PER_API", 2_500),

  socket: {
    /** Prefer WebSocket only in production (fewer long-polling connections) */
    websocketOnly: bool("SOCKET_WEBSOCKET_ONLY", process.env.NODE_ENV === "production"),
    pingTimeout: num("SOCKET_PING_TIMEOUT_MS", 60_000),
    pingInterval: num("SOCKET_PING_INTERVAL_MS", 25_000),
    connectTimeout: num("SOCKET_CONNECT_TIMEOUT_MS", 20_000),
    /** Disable per-message deflate at scale (saves CPU) */
    perMessageDeflate: bool("SOCKET_PER_MESSAGE_DEFLATE", false),
    maxHttpBufferSize: num("SOCKET_MAX_HTTP_BUFFER", 1_000_000),
    connectionStateRecovery: bool("SOCKET_CONNECTION_RECOVERY", true),
  },

  mongodb: {
    maxPoolSize: num("MONGODB_MAX_POOL_SIZE", 100),
    minPoolSize: num("MONGODB_MIN_POOL_SIZE", 10),
    serverSelectionTimeoutMS: num("MONGODB_SERVER_SELECTION_TIMEOUT_MS", 10_000),
  },

  metrics: {
    logSocketCountIntervalMs: num("SOCKET_METRICS_INTERVAL_MS", 60_000),
  },
};

export function getScaleSummary() {
  return {
    targetConcurrentUsers: scaleConfig.targetConcurrentUsers,
    apiReplicas: scaleConfig.apiReplicas,
    workerReplicas: scaleConfig.workerReplicas,
    connectionsPerApiInstance: scaleConfig.connectionsPerApiInstance,
    plannedCapacity:
      scaleConfig.apiReplicas * scaleConfig.connectionsPerApiInstance,
  };
}
