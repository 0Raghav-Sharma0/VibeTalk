/**
 * Clerk UI theme — matches VibeTalk violet palette without changing app colors.
 * Enable in Clerk Dashboard: Google OAuth + Email with password (sign-in/up).
 */
export const clerkAppearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    colorPrimary: "#7c3aed",
    colorPrimaryForeground: "#ffffff",
    colorDanger: "#ef4444",
    colorSuccess: "#10b981",
    colorText: "#1f2937",
    colorTextSecondary: "#6b7280",
    colorBackground: "transparent",
    colorInputBackground: "#f3f4f6",
    colorInputText: "#111827",
    borderRadius: "0.75rem",
    fontFamily: '"Outfit", "Plus Jakarta Sans", system-ui, sans-serif',
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full max-w-full min-w-0 mx-0 overflow-hidden box-border",
    card: "w-full max-w-full min-w-0 shadow-none border-0 bg-transparent p-0 gap-3 box-border",
    cardBox: "w-full max-w-full min-w-0 shadow-none overflow-hidden mx-0 box-border",
    main: "w-full max-w-full min-w-0 box-border",
    scrollBox: "w-full max-w-full min-w-0 overflow-x-hidden box-border",
    form: "w-full max-w-full min-w-0 gap-3 box-border",
    formFieldRow: "!grid !grid-cols-1 !gap-3 min-w-0 w-full",
    formField: "min-w-0 w-full max-w-full",
    formFieldInputWrapper: "w-full max-w-full min-w-0",
    formFieldInputGroup: "w-full max-w-full min-w-0",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "auth-social-btn !w-full !max-w-full !min-w-0 !box-border !border-gray-200 dark:!border-white/15 !bg-white dark:!bg-white/5 hover:!bg-gray-50 dark:hover:!bg-white/10 !text-gray-800 dark:!text-white !font-medium !shadow-sm",
    socialButtonsBlockButtonText: "!font-semibold !min-w-0",
    dividerLine: "bg-gray-200 dark:bg-white/10",
    dividerText: "text-gray-500 dark:text-white/50 text-xs font-medium",
    formFieldLabel: "text-gray-700 dark:text-white/85 text-sm font-semibold",
    formFieldInput:
      "auth-field-input !w-full !max-w-full !min-w-0 !box-border !bg-gray-100 dark:!bg-white/10 !border-transparent !text-gray-900 dark:!text-white placeholder:!text-gray-400 dark:placeholder:!text-white/45 focus:!ring-2 focus:!ring-violet-500/35",
    formButtonPrimary:
      "auth-primary-btn !bg-violet-600 hover:!bg-violet-700 dark:!bg-violet-500 dark:hover:!bg-violet-400 !text-white !font-semibold !shadow-md !shadow-violet-500/20",
    footerActionLink: "!text-violet-600 dark:!text-violet-300 font-semibold hover:!underline",
    footerActionText: "text-gray-600 dark:text-white/70 text-sm",
    identityPreviewText: "text-gray-900 dark:text-white font-medium",
    identityPreviewEditButton: "text-violet-600 dark:text-violet-300",
    formResendCodeLink: "text-violet-600 dark:text-violet-300 font-semibold",
    otpCodeFieldInput:
      "!bg-gray-100 dark:!bg-white/10 !border-gray-200 dark:!border-white/15 !text-gray-900 dark:!text-white !text-lg !tracking-widest",
    alertText: "text-sm",
    formFieldErrorText: "text-red-500 text-xs",
    navbar: "hidden",
    logoBox: "hidden",
    footer: "hidden",
    footerPages: "hidden",
  },
};

export const clerkSignInOptions = {
  routing: "path",
  path: "/login",
  signUpUrl: "/signup",
  forceRedirectUrl: "/",
  signUpForceRedirectUrl: "/",
  appearance: clerkAppearance,
};

export const clerkSignUpOptions = {
  routing: "path",
  path: "/signup",
  signInUrl: "/login",
  forceRedirectUrl: "/",
  signInForceRedirectUrl: "/",
  appearance: clerkAppearance,
};
