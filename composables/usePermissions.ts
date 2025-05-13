interface User {
  permissions?: Record<string, Record<string, boolean>>;
  // Add other user properties if needed
}

export function usePermissions() {
  const hasPermission = (section: string, action: string): boolean => {
    const userString = sessionStorage.getItem("user");
    if (!userString) return false;

    try {
      const user: User = JSON.parse(userString);
      return user?.permissions?.[section]?.[action] ?? false;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return false;
    }
  };

  return { hasPermission };
}
