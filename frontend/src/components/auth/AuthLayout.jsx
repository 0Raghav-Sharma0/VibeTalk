import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { ROUTES } from "../../constants/routes";
import "../../pages/auth.css";

export default function AuthLayout({ mode, subtitle, children }) {
  const { pathname } = useLocation();
  const isSignUp = mode === "sign-up" || pathname.startsWith("/signup");

  useEffect(() => {
    if (document.getElementById("dotlottie-script")) return;
    const script = document.createElement("script");
    script.id = "dotlottie-script";
    script.type = "module";
    script.src =
      "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
    document.body.appendChild(script);
  }, []);

  return (
    <div className="auth-page dark-mode-root">
      <div className="auth-grid">
        <div className="auth-form-col">
          <div className="auth-form-inner">
            <div className="auth-logo-row">
              <div className="auth-logo-mark">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="auth-logo-title">VibeTalk</h1>
                <p className="auth-tagline">{subtitle}</p>
              </div>
            </div>

            <nav className="auth-mode-tabs" aria-label="Authentication mode">
              <Link
                to={ROUTES.login}
                className={`auth-mode-tab ${!isSignUp ? "auth-mode-tab--active" : ""}`}
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.signup}
                className={`auth-mode-tab ${isSignUp ? "auth-mode-tab--active" : ""}`}
              >
                Sign up
              </Link>
            </nav>

            <div className="auth-panel">
              <div className="auth-clerk-shell">{children}</div>
            </div>

            <p className="auth-hint">
              {isSignUp
                ? "Use Google or create an account with email and password."
                : "Use Google for one-tap access, or sign in with your email and password."}
            </p>
          </div>
        </div>

        <aside className="auth-brand-col" aria-hidden="true">
          <dotlottie-player
            src="https://lottie.host/5a4c9f68-0a91-4373-83ba-809e7d1ced57/rlqClPNnCc.lottie"
            background="transparent"
            speed="1"
            loop
            autoplay
            style={{ width: 320, height: 320, maxWidth: "100%" }}
          />
        </aside>
      </div>
    </div>
  );
}
