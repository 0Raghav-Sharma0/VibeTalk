/**
 * Migration: Drop legacy senderId_1_receiverId_1 index from friendrequests
 *
 * The FriendRequest model uses fromUser/toUser, but an old index on
 * senderId/receiverId may exist. New documents don't have those fields,
 * so they get (null, null) in the index, causing E11000 duplicate key errors.
 *
 * Run: node scripts/drop-legacy-friendrequest-index.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://Raghav010101:Bambambhole007@cluster0.p6uis.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const collection = db.collection("friendrequests");

    const indexes = await collection.indexes();
    const legacyIndex = indexes.find(
      (idx) => idx.name === "senderId_1_receiverId_1"
    );

    if (legacyIndex) {
      await collection.dropIndex("senderId_1_receiverId_1");
      console.log("✅ Dropped legacy index: senderId_1_receiverId_1");
    } else {
      console.log("ℹ️ Legacy index senderId_1_receiverId_1 not found (already removed)");
    }
  } catch (err) {
    if (err.code === 27) {
      console.log("ℹ️ Index does not exist (already removed)");
    } else {
      console.error("❌ Migration failed:", err.message);
      process.exit(1);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
