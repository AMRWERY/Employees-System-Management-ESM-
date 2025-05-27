export interface ToastOptions {
  message: string;
  type: "success" | "error" | "warning" | "info";
  icon?: string;
  duration?: number;
}
