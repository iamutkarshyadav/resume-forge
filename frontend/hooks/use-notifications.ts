import { toast } from "sonner";

export type NotificationType = "success" | "error" | "info" | "warning";

export function useNotifications() {
  const notify = (message: string, type: NotificationType = "info", options?: Record<string, any>) => {
    toast[type](message, {
      duration: 4000,
      ...options,
    });
  };

  return {
    success: (message: string, options?: Record<string, any>) => notify(message, "success", options),
    error: (message: string, options?: Record<string, any>) => notify(message, "error", options),
    info: (message: string, options?: Record<string, any>) => notify(message, "info", options),
    warning: (message: string, options?: Record<string, any>) => notify(message, "warning", options),
  };
}
