"use client";

import { paths } from "~/src/lib/paths";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { Field, FieldGroup, FieldLabel } from "@zentro/ui/shadcn/field";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    formState: { isSubmitting, isValid },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onChange",
  });

  const password = useWatch({ control, name: "newPassword" }) ?? "";

  const passwordRequirements = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "Contains a number",
      met: /\d/.test(password),
    },
    {
      label: "Contains a lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains an uppercase letter",
      met: /[A-Z]/.test(password),
    },
  ];

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
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl text-ink">Set new password</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      <div className="tile p-5 sm:p-7">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="newPassword"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="password">New password</FieldLabel>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      required
                      autoComplete="new-password"
                      className="pr-10"
                      {...field}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-2 flex flex-col gap-1">
                      {passwordRequirements.map((requirement) => (
                        <div
                          key={requirement.label}
                          className={`flex items-center gap-2 text-xs ${
                            requirement.met
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Check
                            className={`h-3 w-3 ${
                              requirement.met ? "opacity-100" : "opacity-30"
                            }`}
                          />

                          {requirement.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {fieldState.error && (
                    <p className="mt-2 text-xs text-danger-text">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmNewPassword"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm password
                  </FieldLabel>

                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      required
                      autoComplete="new-password"
                      className="pr-10"
                      {...field}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {fieldState.error && (
                    <p className="mt-2 text-xs text-danger-text">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                isSubmitting ||
                !isValid ||
                !passwordRequirements.every((requirement) => requirement.met)
              }
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Resetting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Reset password
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
