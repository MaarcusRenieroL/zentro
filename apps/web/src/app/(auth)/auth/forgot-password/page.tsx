"use client";

import { paths } from "~/src/lib/paths";
import { JSX, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { Field, FieldGroup, FieldLabel } from "@zentro/ui/shadcn/field";
import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "~/src/features/auth/lib/zod-schema";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@zentro/auth/client";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { getResetPasswordRedirectUrl } from "~/src/features/auth/lib/helpers";

export default function ForgotPasswordPage(): JSX.Element {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    handleSubmit,
    control,
    getValues,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onTouched",
  });

  const onSubmit = async (formValues: ForgotPasswordFormValues) => {
    const { error } = await authClient.requestPasswordReset({
      email: formValues.email,
      redirectTo: getResetPasswordRedirectUrl(),
    });

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess(
      "Success",
      "If an account exists, we sent reset instructions.",
    );

    setIsSubmitted(true);
  };

  const resendEmail = async () => {
    const email = getValues("email");

    if (!email) {
      toastError("Email missing", "Please go back and enter your email.");
      setIsSubmitted(false);
      return;
    }

    setIsResending(true);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: getResetPasswordRedirectUrl(),
    });

    setIsResending(false);

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess(
      "Email sent",
      "If an account exists, we sent reset instructions again.",
    );
  };

  if (isSubmitted) {
    const email = getValues("email");

    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>

          <h1 className="font-display text-3xl text-ink">Check your email</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            We sent reset instructions to{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-5 tile p-5 sm:p-7">
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the email?
          </p>

          <Button onClick={resendEmail} disabled={isResending}>
            {isResending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Resending...
              </span>
            ) : (
              "Click to resend"
            )}
          </Button>
        </div>

        <p className="mt-6 text-center">
          <Link
            href={paths.auth.signIn()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl text-ink">
          Forgot your password?
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          No worries, we&apos;ll send you reset instructions.
        </p>
      </div>

      <div className="tile p-5 sm:p-7">
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>

                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                    {...field}
                  />

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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Sending...
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

      <p className="mt-6 text-center">
        <Link
          href={paths.auth.signIn()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
