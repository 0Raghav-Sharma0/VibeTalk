import AuthLayout from "../components/auth/AuthLayout";
import AuthClerkSignUp from "../components/auth/AuthClerkSignUp";

export default function SignupPage() {
  return (
    <AuthLayout
      mode="sign-up"
      subtitle="Create your account and start vibing"
    >
      <AuthClerkSignUp />
    </AuthLayout>
  );
}
