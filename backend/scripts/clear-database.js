/**
 * Wipe all documents from every collection in the MongoDB database (keeps indexes).
 *
 * Run from backend/: node scripts/clear-database.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set in backend/.env");
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  if (collections.length === 0) {
    console.log("No collections found — database is already empty.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Clearing ${collections.length} collection(s) in "${db.databaseName}"…`);

  for (const { name } of collections) {
    const result = await db.collection(name).deleteMany({});
    console.log(`  ${name}: deleted ${result.deletedCount} document(s)`);
  }

  console.log("Done. All user/message data removed.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
