export const useUserRoles = () => {
  const getUser = () => JSON.parse(sessionStorage.getItem("user") || "{}");

  const hasRole = (role: string) => getUser()?.role === role;

  const hasAnyRole = (...roles: string[]) => roles.includes(getUser()?.role);

  return { hasRole, hasAnyRole };
};
