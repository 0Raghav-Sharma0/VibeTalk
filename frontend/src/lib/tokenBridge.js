/** Clerk getToken() injected from ClerkAuthBridge for axios + sockets */
let tokenGetter = null;

export function setClerkTokenGetter(getter) {
  tokenGetter = getter;
}

export async function getClerkToken() {
  if (!tokenGetter) return null;
  return tokenGetter();
}
