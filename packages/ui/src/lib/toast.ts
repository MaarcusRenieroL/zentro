import { toast } from "sonner";

import { toAppError } from "./errors";

export function toastError(error: unknown, fallback?: string) {
  if (typeof error === "string" && fallback) {
    toast.error(error, {
      description: fallback,
    });
    return;
  }

  const message = toAppError(error, fallback);

  toast.error(message.title, {
    description: message.description,
  });
}

export function toastSuccess(title: string, description?: string) {
  toast.success(title, {
    description,
  });
}
