#!/usr/bin/env node
/**
 * FAANG-style verification gate — run before interviews / CI.
 * Usage: node scripts/verify-all.mjs
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: backendRoot,
      stdio: "inherit",
      shell: false,
      ...opts,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function main() {
  const steps = [
    ["npm", ["test"]],
    ["node", ["--check", "src/index.js"]],
    ["node", ["--check", "src/services/messagePipeline.service.js"]],
  ];

  const baseUrl = process.env.BASE_URL || "http://localhost:5001";
  let healthOk = false;
  try {
    const res = await fetch(`${baseUrl}/health`);
    healthOk = res.ok;
  } catch {
    healthOk = false;
  }

  console.log("\n🚀 NexAura FAANG verification gate\n");

  for (const [cmd, args] of steps) {
    console.log(`\n▶ ${cmd} ${args.join(" ")}`);
    await run(cmd, args);
  }

  if (healthOk) {
    console.log("\n▶ load-test (API detected)");
    await run("node", ["scripts/load-test.mjs"], {
      env: { ...process.env, BASE_URL: baseUrl },
    });
  } else {
    console.log("\n⚠️  Skipping load-test — start API: npm run dev");
  }

  console.log("\n✅ All verification steps passed\n");
}

main().catch((err) => {
  console.error("\n❌ Verification failed:", err.message);
  process.exit(1);
});
