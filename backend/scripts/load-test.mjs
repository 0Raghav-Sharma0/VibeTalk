#!/usr/bin/env node
/**
 * NexAura load probe — run with API + Redis up.
 *
 *   node scripts/load-test.mjs
 *   BASE_URL=http://localhost:5001 CONCURRENCY=50 DURATION_SEC=10 node scripts/load-test.mjs
 */
const BASE_URL = process.env.BASE_URL || "http://localhost:5001";
const CONCURRENCY = Number(process.env.CONCURRENCY) || 30;
const DURATION_SEC = Number(process.env.DURATION_SEC) || 8;

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function oneHealthFetch() {
  const start = performance.now();
  const res = await fetch(`${BASE_URL}/health`);
  const body = await res.json();
  const ms = performance.now() - start;
  return { ok: res.ok, ms, body };
}

async function worker(until, latencies, errors) {
  while (Date.now() < until) {
    try {
      const r = await oneHealthFetch();
      latencies.push(r.ms);
      if (!r.ok) errors.push("non-ok");
    } catch (e) {
      errors.push(e.message);
    }
  }
}

async function main() {
  console.log(`\n🔬 NexAura load probe`);
  console.log(`   ${BASE_URL} | concurrency=${CONCURRENCY} | ${DURATION_SEC}s\n`);

  const warmup = await oneHealthFetch();
  if (!warmup.ok) {
    console.error("❌ API not reachable. Start backend: cd backend && npm run dev");
    process.exit(1);
  }

  const queues = warmup.body?.queues?.queues || {};
  console.log("✅ Warmup OK — services:", warmup.body?.services);
  console.log("   Queues:", JSON.stringify(queues, null, 2));

  const until = Date.now() + DURATION_SEC * 1000;
  const latencies = [];
  const errors = [];

  const runners = Array.from({ length: CONCURRENCY }, () =>
    worker(until, latencies, errors)
  );
  await Promise.all(runners);

  latencies.sort((a, b) => a - b);
  const total = latencies.length;
  const rps = (total / DURATION_SEC).toFixed(1);

  console.log("\n📊 Results (GET /health)");
  console.log(`   Requests:    ${total}`);
  console.log(`   Errors:      ${errors.length}`);
  console.log(`   Throughput:  ~${rps} req/s`);
  if (total > 0) {
    console.log(`   Latency p50: ${percentile(latencies, 50).toFixed(1)} ms`);
    console.log(`   Latency p95: ${percentile(latencies, 95).toFixed(1)} ms`);
    console.log(`   Latency p99: ${percentile(latencies, 99).toFixed(1)} ms`);
  }

  const post = await oneHealthFetch();
  if (post.body?.queues?.enabled) {
    console.log("\n📬 Queue state after test:");
    console.log(JSON.stringify(post.body.queues.queues, null, 2));
  }

  console.log("\n💡 For message-path load, use two real users + socket send while watching queue waiting/active in /health.\n");
  process.exit(errors.length > total * 0.05 ? 1 : 0);
}

main();
