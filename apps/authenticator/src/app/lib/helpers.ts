export type AuthErrorLike = {
  code?: string;
  message?: string;
  statusText?: string;
};

export type OtpErrorMessage = {
  title: string;
  description: string;
};

const authenticatorUrl =
  process.env.NEXT_PUBLIC_AUTHENTICATOR_URL ?? "http://localhost:3001";

export function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const maybeError = error as AuthErrorLike;

  return maybeError.code ?? maybeError.message ?? maybeError.statusText ?? null;
}

export function getResetPasswordRedirectUrl() {
  return new URL("/auth/reset-password", authenticatorUrl).toString();
}

export function getOtpErrorMessage(error: unknown): OtpErrorMessage {
  const normalizedCode = getErrorCode(error)?.toLowerCase();

  switch (normalizedCode) {
    case "invalid_otp":
    case "invalid_code":
    case "invalid_token":
      return {
        title: "Invalid code",
        description: "The verification code is incorrect. Please try again.",
      };

    case "otp_expired":
    case "expired_otp":
    case "expired_token":
      return {
        title: "Code expired",
        description:
          "This verification code has expired. Please request a new one.",
      };

    case "too_many_attempts":
      return {
        title: "Too many attempts",
        description: "Too many failed attempts. Please request a new code.",
      };

    default:
      return {
        title: "Verification failed",
        description: "Could not verify your email. Please try again.",
      };
  }
}
