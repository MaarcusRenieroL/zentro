"use client";

import { paths } from "~/src/lib/paths";
import { Suspense, useEffect, useMemo } from "react";
import { Button } from "@zentro/ui/shadcn/button";
import {
  AuthField,
  AuthHeading,
  PasswordInput,
  PasswordMeter,
} from "~/src/features/auth/components/kit/auth-kit";
import { useForm, Controller, useWatch } from "react-hook-form";
import {
  ResetPasswordFormValues,
  resetPasswordSchema,
} from "~/src/features/auth/lib/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@zentro/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { getResetPasswordErrorMessage } from "~/src/features/auth/lib/helpers";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const resetPasswordError = useMemo(
    () => getResetPasswordErrorMessage(error),
    [error],
  );

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onTouched",
  });

  const password = useWatch({ control, name: "newPassword" }) ?? "";

  useEffect(() => {
    if (!token || resetPasswordError) {
      if (resetPasswordError) {
        toastError(resetPasswordError.title, resetPasswordError.message);
      } else {
        toastError(
          "Missing reset link",
          "Please request a new password reset link.",
        );
      }

      router.replace(paths.auth.forgotPassword());
    }
  }, [token, resetPasswordError, router]);

  const onSubmit = async (formValues: ResetPasswordFormValues) => {
    if (!token) {
      toastError("Missing reset link", "Please request a new one.");
      router.replace(paths.auth.forgotPassword());
      return;
    }

    const { error } = await authClient.resetPassword({
      newPassword: formValues.newPassword,
      token,
    });

    if (error) {
      toastError(
        error.statusText ?? "Reset failed",
        error.message ?? "Please request a new password reset link.",
      );

      router.replace(paths.auth.forgotPassword());
      return;
    }

    toastSuccess("Success", "Your password has been reset.");
    router.replace(paths.auth.signIn());
  };

  if (!token || resetPasswordError) {
    return null;
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-5">
        <AuthHeading
          title="Choose a new password"
          description="This signs you out on every other device."
        />

        <Controller
          name="newPassword"
          control={control}
          render={({ field, fieldState }) => (
            <AuthField
              label="New password"
              htmlFor="password"
              error={fieldState.error?.message}
            >
              <PasswordInput
                id="password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid || undefined}
                aria-describedby={
                  fieldState.error ? "password-error" : undefined
                }
                {...field}
              />
              <PasswordMeter password={password} />
            </AuthField>
          )}
        />

        <Controller
          name="confirmNewPassword"
          control={control}
          render={({ field, fieldState }) => (
            <AuthField
              label="Confirm password"
              htmlFor="confirm-password"
              error={fieldState.error?.message}
            >
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid || undefined}
                aria-describedby={
                  fieldState.error ? "confirm-password-error" : undefined
                }
                {...field}
              />
            </AuthField>
          )}
        />

        <Button type="submit" loading={isSubmitting} className="w-full">
          Reset password
        </Button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
