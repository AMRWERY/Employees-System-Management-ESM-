export function useLoading(duration = 3000) {
  const isLoading = ref(false);

  const startLoading = () => {
    isLoading.value = true;
    setTimeout(() => {
      isLoading.value = false;
    }, duration);
  };

  return {
    isLoading,
    startLoading,
  };
}
