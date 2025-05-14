export interface ToastOptions {
  message: string;
  type: "success" | "error" | "warning" | "info";
  icon?: string;
  duration?: number;
}

export function useToast() {
  const toastState = useState("globalToast", () => ({
    show: false,
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
    icon: "",
    duration: 4000,
  }));

  const triggerToast = (options: ToastOptions) => {
    toastState.value = {
      show: true,
      message: options.message,
      type: options.type,
      icon: options.icon || "",
      duration: options.duration || 3000,
    };

    setTimeout(() => {
      toastState.value.show = false;
    }, toastState.value.duration);
  };

  return {
    showToast: computed(() => toastState.value.show),
    toastMessage: computed(() => toastState.value.message),
    toastType: computed(() => toastState.value.type),
    toastIcon: computed(() => toastState.value.icon),
    toastDuration: computed(() => toastState.value.duration),
    triggerToast,
  };
}
