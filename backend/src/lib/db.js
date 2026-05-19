import mongoose from "mongoose";
import { env } from "../config/env.js";
import { scaleConfig } from "../config/scale.config.js";

export const connectDB = async () => {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is not set");
  }
  const { maxPoolSize, minPoolSize, serverSelectionTimeoutMS } =
    scaleConfig.mongodb;

  const conn = await mongoose.connect(env.mongodbUri, {
    maxPoolSize,
    minPoolSize,
    serverSelectionTimeoutMS,
  });
  console.log(
    `MongoDB connected: ${conn.connection.host} (pool ${minPoolSize}-${maxPoolSize})`
  );
};
