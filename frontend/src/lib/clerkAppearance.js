/**
 * Clerk SignIn / SignUp options only (not on ClerkProvider).
 * Styling: auth.css + minimal appearance below.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#7c3aed",
    borderRadius: "0.75rem",
  },
  elements: {
    header: "hidden",
    footer: "hidden",
    logoBox: "hidden",
  },
};

export const clerkSignInOptions = {
  routing: "path",
  path: "/login",
  signUpUrl: "/signup",
  forceRedirectUrl: "/",
};

export const clerkSignUpOptions = {
  routing: "path",
  path: "/signup",
  signInUrl: "/login",
  forceRedirectUrl: "/",
};
