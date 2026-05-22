import { SignIn } from "@clerk/clerk-react";
import { clerkAppearance, clerkSignInOptions } from "../../lib/clerkAppearance";
import EmailPasswordSignInForm from "./EmailPasswordSignInForm";

export default function AuthClerkSignIn() {
  return (
    <div className="auth-signin-stack">
      <div className="auth-oauth-only">
        <SignIn {...clerkSignInOptions} appearance={clerkAppearance} />
      </div>

      <div id="clerk-captcha" className="auth-clerk-captcha" />

      <div className="auth-or-divider" aria-hidden="true">
        <span>or</span>
      </div>

      <EmailPasswordSignInForm />
    </div>
  );
}
