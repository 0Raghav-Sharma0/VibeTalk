import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { setClerkTokenGetter } from "../lib/tokenBridge.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { toSyncProfile } from "../utils/clerkProfile.js";
import AuthSocketProvider from "./AuthSocketProvider.jsx";

export default function ClerkAuthBridge({ children }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { syncUser, clearAuth, setCheckingAuth } = useAuthStore();

  useEffect(() => {
    setClerkTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    (async () => {
      const hadUser = Boolean(useAuthStore.getState().authUser);
      if (!hadUser) setCheckingAuth(true);

      if (!isSignedIn || !clerkUser) {
        clearAuth();
        setCheckingAuth(false);
        return;
      }

      const current = useAuthStore.getState().authUser;
      if (current && isSignedIn) {
        setCheckingAuth(false);
        return;
      }

      await syncUser(toSyncProfile(clerkUser));
      setCheckingAuth(false);
    })();
  }, [isLoaded, isSignedIn, clerkUser?.id, syncUser, clearAuth, setCheckingAuth]);

  return <AuthSocketProvider>{children}</AuthSocketProvider>;
}
