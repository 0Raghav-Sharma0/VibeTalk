import { useCallback, useEffect, useRef, useState } from "react";

export const AUTH_LOTTIE_SRC =
  "https://lottie.host/5a4c9f68-0a91-4373-83ba-809e7d1ced57/rlqClPNnCc.lottie";

const DOTLOTTIE_SCRIPT =
  "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";

const DESKTOP_MQ = "(min-width: 1024px)";
const LOAD_TIMEOUT_MS = 20_000;

function loadDotlottieScript() {
  if (typeof customElements !== "undefined" && customElements.get("dotlottie-player")) {
    return Promise.resolve();
  }

  const existing = document.getElementById("dotlottie-script");
  if (existing) {
    return customElements.whenDefined("dotlottie-player");
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "dotlottie-script";
    script.type = "module";
    script.src = DOTLOTTIE_SCRIPT;
    script.onload = () => {
      customElements.whenDefined("dotlottie-player").then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error("Failed to load dotlottie player"));
    document.body.appendChild(script);
  });
}

function preloadLottieFile(src) {
  return fetch(src, { mode: "cors", cache: "force-cache" }).then((res) => {
    if (!res.ok) throw new Error(`Lottie preload failed (${res.status})`);
    return res.arrayBuffer();
  });
}

/**
 * Blocks auth page reveal until the side illustration is ready (desktop only).
 */
export function useAuthIllustrationReady() {
  const [ready, setReady] = useState(false);
  const [needsIllustration, setNeedsIllustration] = useState(false);
  const [playerScriptReady, setPlayerScriptReady] = useState(false);
  const [playerNode, setPlayerNode] = useState(null);
  const settledRef = useRef(false);

  const settle = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    setReady(true);
  }, []);

  const setPlayerRef = useCallback((node) => {
    setPlayerNode(node);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const apply = () => {
      const desktop = mq.matches;
      setNeedsIllustration(desktop);
      if (!desktop) settle();
    };

    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [settle]);

  useEffect(() => {
    if (!needsIllustration || settledRef.current) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) settle();
    }, LOAD_TIMEOUT_MS);

    (async () => {
      try {
        await Promise.all([loadDotlottieScript(), preloadLottieFile(AUTH_LOTTIE_SRC)]);
        if (!cancelled) setPlayerScriptReady(true);
      } catch {
        if (!cancelled) settle();
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [needsIllustration, settle]);

  useEffect(() => {
    if (!playerNode || !needsIllustration || !playerScriptReady || settledRef.current) return;

    const handleReady = () => settle();
    const handleError = () => settle();

    playerNode.addEventListener("ready", handleReady);
    playerNode.addEventListener("load", handleReady);
    playerNode.addEventListener("error", handleError);

    return () => {
      playerNode.removeEventListener("ready", handleReady);
      playerNode.removeEventListener("load", handleReady);
      playerNode.removeEventListener("error", handleError);
    };
  }, [playerNode, needsIllustration, playerScriptReady, settle]);

  return { ready, needsIllustration, playerScriptReady, setPlayerRef, settle };
}
