"use client";

import { JSX, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { authClient } from "@zentro/auth/client";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";

import {
  AuthField,
  AuthHeading,
  AuthNote,
} from "~/src/features/auth/components/kit/auth-kit";
import { getResetPasswordRedirectUrl } from "~/src/features/auth/lib/helpers";
import {
  formatMmSs,
  useCountdown,
} from "~/src/features/auth/lib/use-countdown";
import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "~/src/features/auth/lib/zod-schema";
import { paths } from "~/src/lib/paths";

const resendWait = 60;

function BackToSignIn() {
  return (
    <Link
      href={paths.auth.signIn()}
      className="-mb-2 flex w-fit items-center gap-1 rounded-xs text-[13px] text-ink-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
      Back to sign in
    </Link>
  );
}

export default function ForgotPasswordPage(): JSX.Element {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const wait = useCountdown();

  const {
    handleSubmit,
    control,
    getValues,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const send = async (email: string) => {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: getResetPasswordRedirectUrl(),
    });

    if (error) {
      toastError(error.statusText, error.message);
      return false;
    }

    wait.start(resendWait);

    return true;
  };

  const onSubmit = async ({ email }: ForgotPasswordFormValues) => {
    if (await send(email)) setIsSubmitted(true);
  };

  const resend = async () => {
    setIsResending(true);

    if (await send(getValues("email"))) {
      toastSuccess("Link sent again", "Check your inbox in a minute.");
    }

    setIsResending(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-5">
        <BackToSignIn />
        <AuthHeading
          title="Check your email"
          description="If an account uses this address, a reset link is on its way."
        />
        <div className="flex flex-col gap-1.5 rounded-2xl border border-hairline bg-surface p-4">
          <span className="font-mono text-sm break-all">
            {getValues("email")}
          </span>
          <span className="text-sm leading-5 text-ink-2">
            The link works once and expires in 30 minutes. Check spam if it
            isn’t there in a minute.
          </span>
        </div>
        <div className="flex justify-center">
          {wait.done ? (
            <Button
              variant="ghost"
              loading={isResending}
              onClick={resend}
              className="w-full"
            >
              Send the link again
            </Button>
          ) : (
            <AuthNote>
              Didn’t get it? Send again in{" "}
              <span className="font-mono">
                {formatMmSs(wait.seconds, false)}
              </span>
            </AuthNote>
          )}
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-5">
        <BackToSignIn />
        <AuthHeading
          title="Reset your password"
          description="Enter the email you sign in with and we’ll send a link to choose a new password."
        />
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <AuthField
              label="Email"
              htmlFor="email"
              error={fieldState.error?.message}
            >
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid || undefined}
                aria-describedby={fieldState.error ? "email-error" : undefined}
                className="font-mono text-sm"
                {...field}
              />
            </AuthField>
          )}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>
      </div>
    </form>
  );
}
