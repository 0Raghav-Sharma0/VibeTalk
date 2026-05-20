import AuthLayout from "../components/auth/AuthLayout";
import AuthClerkSignIn from "../components/auth/AuthClerkSignIn";

export default function LoginPage() {
  return (
    <AuthLayout
      mode="sign-in"
      subtitle="Welcome back — sign in to continue chatting"
    >
      <AuthClerkSignIn />
    </AuthLayout>
  );
}
