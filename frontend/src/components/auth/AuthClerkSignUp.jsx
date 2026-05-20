import { useMemo } from "react";
import { SignUp } from "@clerk/clerk-react";
import { useThemeStore } from "../../store/useThemeStore";
import { clerkAppearance, clerkSignUpOptions } from "../../lib/clerkAppearance";
import EmailPasswordSignUpForm from "./EmailPasswordSignUpForm";

const DARK_THEMES = ["dark", "coffee", "nexaura"];

export default function AuthClerkSignUp() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = DARK_THEMES.includes(theme);

  const appearance = useMemo(
    () => ({
      ...clerkAppearance,
      variables: {
        ...clerkAppearance.variables,
        colorText: isDark ? "#f5f3ff" : "#1f2937",
        colorTextSecondary: isDark ? "rgba(255,255,255,0.65)" : "#6b7280",
        colorInputBackground: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6",
        colorInputText: isDark ? "#ffffff" : "#111827",
      },
    }),
    [isDark]
  );

  return (
    <div className="auth-signin-stack">
      <div className="auth-oauth-only">
        <SignUp {...clerkSignUpOptions} appearance={appearance} />
      </div>

      <div id="clerk-captcha" className="auth-clerk-captcha" />

      <div className="auth-or-divider" aria-hidden="true">
        <span>or</span>
      </div>

      <EmailPasswordSignUpForm />
    </div>
  );
}
