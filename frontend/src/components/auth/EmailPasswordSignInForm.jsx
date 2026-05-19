import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { isClerkAPIResponseError } from "@clerk/clerk-react/errors";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";

export default function EmailPasswordSignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/", { replace: true });
        return;
      }

      if (result.status === "needs_second_factor") {
        setError(
          "Extra verification is required for this device. Use Google sign-in or try again later."
        );
        return;
      }

      setError("Sign-in could not be completed. Please try again.");
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(
          err.errors[0]?.longMessage ||
            err.errors[0]?.message ||
            "Invalid email or password."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
