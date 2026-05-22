import { SignUp } from "@clerk/clerk-react";
import { clerkAppearance, clerkSignUpOptions } from "../../lib/clerkAppearance";
import EmailPasswordSignUpForm from "./EmailPasswordSignUpForm";

export default function AuthClerkSignUp() {
  return (
    <div className="auth-signin-stack">
      <div className="auth-oauth-only">
        <SignUp {...clerkSignUpOptions} appearance={clerkAppearance} />
      </div>

      <div id="clerk-captcha" className="auth-clerk-captcha" />

      <div className="auth-or-divider" aria-hidden="true">
        <span>or</span>
      </div>

      <EmailPasswordSignUpForm />
    </div>
  );
}
