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
  if (!env.clerkPublishableKey) {
    console.error("Missing VITE_CLERK_PUBLISHABLE_KEY in frontend/.env");
  }
}
