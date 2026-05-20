const isDev = import.meta.env.MODE === "development";

export const env = {
  isDev,
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  backendUrl: isDev
    ? "http://localhost:5001"
    : import.meta.env.VITE_BACKEND_URL || "",
  apiBaseUrl: isDev
    ? "http://localhost:5001/api"
    : `${import.meta.env.VITE_BACKEND_URL}/api`,
  socketUrl: isDev
    ? "http://localhost:5001"
    : (import.meta.env.VITE_SOCKET_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        ""
      ).replace(/\/api$/, ""),
};

export function assertFrontendEnv() {
  const problems = [];
  if (!env.clerkPublishableKey) {
    problems.push("VITE_CLERK_PUBLISHABLE_KEY is missing (Clerk login will not work)");
  }
  if (!isDev && !env.backendUrl) {
    problems.push(
      "VITE_BACKEND_URL is missing on this deployment (API calls will fail after login)"
    );
  }
  if (problems.length) {
    console.error("[NexAura] Environment misconfigured:\n- " + problems.join("\n- "));
  }
}
