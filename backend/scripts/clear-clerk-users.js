/**
 * Delete every user in your Clerk application (Development or Production).
 *
 * Requires CLERK_SECRET_KEY in backend/.env (Clerk Dashboard → API keys → Secret key).
 *
 * Run from backend/: npm run clerk:clear-users
 */
import dotenv from "dotenv";

dotenv.config();

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  console.error(
    "CLERK_SECRET_KEY is not set in backend/.env\n" +
      "Get it from: Clerk Dashboard → API keys → Secret keys → copy sk_test_... or sk_live_..."
  );
  process.exit(1);
}

const BASE = "https://api.clerk.com/v1";
const PAGE_SIZE = 100;

async function clerkFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Clerk API ${res.status} ${path}: ${body}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function listAllUsers() {
  const users = [];
  let offset = 0;

  while (true) {
    const data = await clerkFetch(
      `/users?limit=${PAGE_SIZE}&offset=${offset}&order_by=-created_at`
    );
    const batch = data ?? [];
    users.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return users;
}

async function run() {
  console.log("Fetching Clerk users…");
  const users = await listAllUsers();

  if (users.length === 0) {
    console.log("No Clerk users found — nothing to delete.");
    return;
  }

  console.log(`Deleting ${users.length} Clerk user(s)…`);

  for (const user of users) {
    const label =
      user.email_addresses?.[0]?.email_address ||
      user.username ||
      user.id;
    await clerkFetch(`/users/${user.id}`, { method: "DELETE" });
    console.log(`  deleted: ${label}`);
  }

  console.log("Done. All Clerk users removed.");
  console.log(
    "Tip: also run npm run db:clear to wipe MongoDB (app database is separate from Clerk)."
  );
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
