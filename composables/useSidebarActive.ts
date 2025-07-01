export function useSidebarActive() {
  const route = useRoute();
  return (basePath: string) => {
    // Remove locale prefix (e.g. /ar, /en) if present
    const path = route.path.replace(/^\/(ar|en)(?=\/)/, "");
    return path.startsWith(basePath);
  };
}
