export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();
  const localeRoute = useLocalePath();
  const publicRoutes = [
    "/auth/login",
    "/auth/sign-up",
    "/auth/forget-password",
  ];

  await auth.init();

  // Handle localized paths
  const pathWithoutLocale = to.path.split("/").slice(2).join("/") || "/";
  const isPublic = publicRoutes.includes(`/${pathWithoutLocale}`);
  const loginPath = localeRoute("/auth/login");

  if (!auth.isAuthenticated && !isPublic && to.path !== loginPath) {
    return navigateTo(loginPath);
  }

  if (auth.isAuthenticated && isPublic && to.path !== localeRoute("/")) {
    return navigateTo(localeRoute("/"));
  }
});
