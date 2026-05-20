import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { APP_NAME } from "../../constants/brand";
import { ROUTES } from "../../constants/routes";
import {
  AUTH_LOTTIE_SRC,
  useAuthIllustrationReady,
} from "../../hooks/useAuthIllustrationReady";
import "../../pages/auth.css";

export default function AuthLayout({ mode, subtitle, children }) {
  const { pathname } = useLocation();
  const isSignUp = mode === "sign-up" || pathname.startsWith("/signup");
  const { ready, needsIllustration, playerScriptReady, setPlayerRef } =
    useAuthIllustrationReady();

  return (
    <div className="auth-page dark-mode-root">
      {!ready ? (
        <div className="auth-page-loader" role="status" aria-live="polite">
          <div className="auth-page-loader__inner">
            <div className="auth-page-loader__spinner" aria-hidden />
            <p className="auth-page-loader__text">Loading {APP_NAME}…</p>
          </div>
        </div>
      ) : null}

      <div
        className={`auth-page-content${ready ? " auth-page-content--visible" : ""}`}
        aria-hidden={!ready}
      >
        <div className="auth-grid">
          <div className="auth-form-col">
            <div className="auth-form-inner">
              <div className="auth-logo-row">
                <div className="auth-logo-mark">
                  <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="auth-logo-title">{APP_NAME}</h1>
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
            {needsIllustration && playerScriptReady ? (
              <dotlottie-player
                ref={setPlayerRef}
                src={AUTH_LOTTIE_SRC}
                background="transparent"
                speed="1"
                loop
                autoplay
                className="auth-lottie-player"
              />
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
