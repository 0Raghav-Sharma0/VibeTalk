import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { isClerkAPIResponseError } from "@clerk/clerk-react/errors";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";

function clerkErrorMessage(err, fallback) {
  if (!isClerkAPIResponseError(err)) return fallback;
  const first = err.errors[0];
  return first?.longMessage || first?.message || fallback;
}

function clerkErrorCode(err) {
  if (!isClerkAPIResponseError(err)) return null;
  return err.errors[0]?.code ?? null;
}

export default function EmailPasswordSignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const finishSignIn = async (sessionId) => {
    await setActive({ session: sessionId });
    navigate("/", { replace: true });
  };

  const startSecondFactor = async (attempt) => {
    const emailCodeFactor = attempt.supportedSecondFactors?.find(
      (factor) => factor.strategy === "email_code"
    );

    if (!emailCodeFactor) {
      setError(
        "Extra verification is required. Use Continue with Google, or try again from another device."
      );
      return false;
    }

    await signIn.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId: emailCodeFactor.emailAddressId,
    });
    setVerifying(true);
    setCode("");
    return true;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const attempt = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
      });

      if (attempt.status === "complete") {
        await finishSignIn(attempt.createdSessionId);
        return;
      }

      setError("Verification could not be completed. Please try again.");
    } catch (err) {
      setError(clerkErrorMessage(err, "Invalid verification code."));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn.create({ identifier: trimmedEmail });

      const supportsPassword = signIn.supportedFirstFactors?.some(
        (factor) => factor.strategy === "password"
      );

      if (!supportsPassword) {
        setError(
          "This email uses Google sign-in only. Tap Continue with Google above, or sign up with email on the Sign up tab using a different address."
        );
        return;
      }

      const attempt = await signIn.attemptFirstFactor({
        strategy: "password",
        password,
      });

      if (attempt.status === "complete") {
        await finishSignIn(attempt.createdSessionId);
        return;
      }

      if (attempt.status === "needs_second_factor") {
        await startSecondFactor(attempt);
        return;
      }

      setError("Sign-in could not be completed. Please try again.");
    } catch (err) {
      const code = clerkErrorCode(err);

      if (code === "strategy_for_user_invalid") {
        setError(
          "This email uses Google sign-in only. Tap Continue with Google above, or create a password account on the Sign up tab."
        );
        return;
      }

      if (code === "form_password_incorrect" || code === "form_password_or_identifier_incorrect") {
        setError("Incorrect email or password.");
        return;
      }

      setError(clerkErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <form className="auth-email-form" onSubmit={handleVerify} noValidate>
        <p className="auth-verify-hint">
          We sent a verification code to <strong>{email.trim()}</strong>
        </p>

        <div className="auth-field">
          <label htmlFor="signin-code">Verification code</label>
          <input
            id="signin-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter the 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error ? (
          <p className="auth-field-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="auth-submit-btn" disabled={!isLoaded || loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <>
              Verify and continue
              <ArrowRight className="w-4 h-4" aria-hidden />
            </>
          )}
        </button>

        <button
          type="button"
          className="auth-text-btn"
          disabled={loading}
          onClick={() => {
            setVerifying(false);
            setCode("");
            setError("");
          }}
        >
          Back to password sign-in
        </button>
      </form>
    );
  }

  return (
    <form className="auth-email-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label htmlFor="signin-email">Email address</label>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="signin-password">Password</label>
        <input
          id="signin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {error ? (
        <p className="auth-field-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="auth-submit-btn" disabled={!isLoaded || loading}>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
