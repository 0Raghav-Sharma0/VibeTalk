import { useEffect } from "react";

const MOBILE_MQ = "(max-width: 768px)";

/** Keeps --chat-viewport-height and --vv-bottom-inset in sync with mobile browser chrome / keyboard */
export function useMobileViewportInsets() {
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const vv = window.visualViewport;

    const update = () => {
      if (!mq.matches || !vv) {
        document.documentElement.style.removeProperty("--chat-viewport-height");
        document.documentElement.style.removeProperty("--vv-bottom-inset");
        return;
      }
      const bottomInset = Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
      document.documentElement.style.setProperty("--chat-viewport-height", `${vv.height}px`);
      document.documentElement.style.setProperty("--vv-bottom-inset", `${bottomInset}px`);
    };

    update();
    mq.addEventListener("change", update);
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);

    return () => {
      mq.removeEventListener("change", update);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty("--chat-viewport-height");
      document.documentElement.style.removeProperty("--vv-bottom-inset");
    };
  }, []);
}
