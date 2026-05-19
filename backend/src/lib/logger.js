import { env } from "../config/env.js";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function shouldLog(level) {
  const min = env.isProduction ? LEVELS.info : LEVELS.debug;
  return LEVELS[level] >= min;
}

function formatMessage(level, msg, meta) {
  const base = {
    ts: new Date().toISOString(),
    level,
    msg,
    service: "nexaura-api",
    env: env.nodeEnv,
  };
  if (meta && Object.keys(meta).length) Object.assign(base, meta);
  return env.isProduction ? JSON.stringify(base) : `${base.ts} [${level}] ${msg}${meta ? ` ${JSON.stringify(meta)}` : ""}`;
}

export const logger = {
  debug(msg, meta) {
    if (shouldLog("debug")) console.debug(formatMessage("debug", msg, meta));
  },
  info(msg, meta) {
    if (shouldLog("info")) console.log(formatMessage("info", msg, meta));
  },
  warn(msg, meta) {
    if (shouldLog("warn")) console.warn(formatMessage("warn", msg, meta));
  },
  error(msg, meta) {
    if (shouldLog("error")) console.error(formatMessage("error", msg, meta));
  },
};
