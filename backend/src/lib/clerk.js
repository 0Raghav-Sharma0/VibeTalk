import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";

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
