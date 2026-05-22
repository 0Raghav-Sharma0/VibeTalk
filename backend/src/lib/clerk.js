import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";

let jwks = null;

function getJwks() {
  if (!jwks) {
    if (!env.clerkJwtIssuer) {
      throw new Error("CLERK_JWT_ISSUER is not set");
    }
    jwks = createRemoteJWKSet(
      new URL(`${env.clerkJwtIssuer}/.well-known/jwks.json`)
    );
  }
  return jwks;
}

/** Verify a Clerk session JWT and return its claims. */
export async function verifyClerkToken(token) {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: env.clerkJwtIssuer,
  });
  return payload;
}

export function extractBearerToken(req) {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
}

export function getBearerToken(req) {
  const token = extractBearerToken(req);
  if (!token) throw AppError.unauthorized("No token provided");
  return token;
}

/** Shared JWT check for HTTP routes and Socket.IO. */
export async function verifyBearerToken(token) {
  if (!token) throw AppError.unauthorized("No token provided");
  try {
    const claims = await verifyClerkToken(token);
    return { clerkId: claims.sub, claims };
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }
}
