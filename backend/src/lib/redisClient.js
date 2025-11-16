// // backend/src/lib/redisClient.js
// import { createClient } from "redis";

// const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// // MAIN redis client
// const client = createClient({
//   url: REDIS_URL,
// });

// client.on("error", (err) => console.error("Redis Client Error:", err));
// client.on("connect", () => console.log("🔌 Redis Client Connecting..."));
// client.on("ready", () => console.log("✅ Redis Client Ready"));

// // connect main client
// await client.connect();

// // PUB/SUB clients (required for socket.io redis adapter)
// const pubClient = client.duplicate();
// const subClient = client.duplicate();

// pubClient.on("error", (err) => console.error("Redis PUB Error:", err));
// subClient.on("error", (err) => console.error("Redis SUB Error:", err));

// await pubClient.connect();
// await subClient.connect();

// console.log("📡 Redis Pub/Sub Connected");

// export default client;
// export { pubClient, subClient };
// Redis temporarily disabled for deployment.
// Keep this file for future use.

const redisClient = {
  connect: async () => {},
  on: () => {},
  duplicate: () => ({
    connect: async () => {},
  }),
};

export default redisClient;
