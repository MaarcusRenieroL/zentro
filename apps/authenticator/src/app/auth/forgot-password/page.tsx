"use client";

import { JSX, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@zentro/ui/shadcn/field";
import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "../../lib/zod-schema";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@zentro/auth/client";
import { toastError, toastSuccess } from "@zentro/ui/index";

export default function ForgotPasswordPage(): JSX.Element {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isValid },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (formValues: ForgotPasswordFormValues) => {
    const { error } = await authClient.requestPasswordReset({
      email: formValues.email,
      redirectTo: "http://localhost:3001/auth/reset-password",
    });

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("Success", "Email sent successfully");

    setIsSubmitted(true);

    return;
  };

  const resendEmail = () => {};

  if (isSubmitted) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
        </div>

        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the email?{" "}
          </p>
          <Button onClick={() => resendEmail()}>Click to resend</Button>
        </div>

        <p className="mt-6 text-center">
          <Link
            href="/auth/sign-in"
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No worries, we&apos;ll send you reset instructions.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
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
                    <p className="text-xs text-red-400 mt-2">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting || !isValid}
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
          href="/auth/sign-in"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
