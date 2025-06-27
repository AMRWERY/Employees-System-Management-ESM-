export function useSidebarActive() {
  const route = useRoute();
  return (basePath: string) => route.path.startsWith(basePath);
}
