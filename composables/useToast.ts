export interface ToastOptions {
  message: string;
  type: "success" | "error" | "warning" | "info";
  icon?: string;
}

export function useToast() {
  const showToast = ref<boolean>(false);
  const toastMessage = ref<string>("");
  const toastType = ref<string>("");
  const toastIcon = ref<string>("");

  const triggerToast = (options: ToastOptions): void => {
    toastMessage.value = options.message || "";
    toastType.value = options.type || "";
    toastIcon.value = options.icon || "";
    showToast.value = true;

    setTimeout(() => {
      showToast.value = false;
    }, 3000);
  };

  return {
    showToast,
    toastMessage,
    toastType,
    toastIcon,
    triggerToast,
  };
}
