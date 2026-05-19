#!/usr/bin/env node
/**
 * Run verify-all up to N times until green (local quality gate).
 *   node scripts/verify-loop.mjs
 *   MAX_ROUNDS=5 node scripts/verify-loop.mjs
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX = Number(process.env.MAX_ROUNDS) || 3;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runVerify() {
  return new Promise((resolve) => {
    const child = spawn("node", ["scripts/verify-all.mjs"], {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    });
    child.on("close", (code) => resolve(code === 0));
  });
}

async function main() {
  for (let i = 1; i <= MAX; i++) {
    console.log(`\n══════════ Verify round ${i}/${MAX} ══════════\n`);
    const ok = await runVerify();
    if (ok) {
      console.log(`\n✅ Passed on round ${i}\n`);
      process.exit(0);
    }
    console.log(`\n⚠️  Round ${i} failed\n`);
  }
  console.error(`\n❌ Failed after ${MAX} rounds\n`);
  process.exit(1);
}

main();
