/** Route labels and default back targets for navigation UI */

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  settings: "/settings",
  profile: "/profile",
  watchParty: "/watch-party",
};

export function isAuthRoute(pathname) {
  return (
    pathname === ROUTES.login ||
    pathname.startsWith(`${ROUTES.login}/`) ||
    pathname === ROUTES.signup ||
    pathname.startsWith(`${ROUTES.signup}/`)
  );
}

export const PAGE_META = {
  [ROUTES.settings]: { title: "Settings", backTo: ROUTES.home, backLabel: "Chats" },
  [ROUTES.profile]: { title: "Profile", backTo: ROUTES.settings, backLabel: "Settings" },
  [ROUTES.watchParty]: {
    title: "Watch Party",
    backTo: ROUTES.home,
    backLabel: "Chats",
  },
};

export function getPageMeta(pathname) {
  return PAGE_META[pathname] ?? null;
}
