export type AuthErrorLike = {
  code?: string;
  message?: string;
  statusText?: string;
};

export type OtpErrorMessage = {
  title: string;
  description: string;
};

export type ResetPasswordErrorMessage = {
  title: string;
  message: string;
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

export function getResetPasswordErrorMessage(
  error: string | null,
): ResetPasswordErrorMessage | null {
  const normalizedError = error?.toLowerCase();

  switch (normalizedError) {
    case "invalid_token":
    case "invalid-token":
    case "invalid_token_error":
    case "invalid_token_error_description":
      return {
        title: "Invalid reset link",
        message:
          "This reset link is invalid. Please request a new password reset link.",
      };

    case "expired_token":
    case "expired-token":
    case "otp_expired":
    case "otp-expired":
      return {
        title: "Expired reset link",
        message:
          "This reset link has expired. Please request a new password reset link.",
      };

    case "too_many_attempts":
    case "too-many-attempts":
      return {
        title: "Too many attempts",
        message:
          "Too many attempts. Please wait a bit before requesting another reset link.",
      };

    case undefined:
      return null;

    default:
      return {
        title: "Reset link error",
        message:
          "There was a problem with your reset link. Please request a new one.",
      };
  }
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
