export type AppErrorShape = {
  title: string;
  description: string;
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Something went wrong. Please try again.";
}

export function toAppError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): AppErrorShape {
  return {
    title: "Error",
    description: getErrorMessage(error) || fallback,
  };
}
