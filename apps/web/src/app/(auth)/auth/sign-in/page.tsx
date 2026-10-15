"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { authClient } from "@zentro/auth/client";
import { toastError } from "@zentro/ui/lib/toast";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";

import {
  AuthBanner,
  AuthField,
  AuthHeading,
  AuthNote,
  PasswordInput,
} from "~/src/features/auth/components/kit/auth-kit";
import {
  formatMmSs,
  useCountdown,
} from "~/src/features/auth/lib/use-countdown";
import {
  SignInFormValues,
  signInSchema,
} from "~/src/features/auth/lib/zod-schema";
import { getSafeRedirectPath, paths } from "~/src/lib/paths";

function getRedirectTarget() {
  const redirectTo = new URLSearchParams(window.location.search).get(
    "redirectTo",
  );

  return getSafeRedirectPath(redirectTo) ?? paths.dashboard();
}

export default function LoginPage() {
  const router = useRouter();
  const pause = useCountdown();
  const [signInError, setSignInError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = async (formValues: SignInFormValues) => {
    setSignInError(null);

    let retryAfter = 0;
    const { error } = await authClient.signIn.email(
      { email: formValues.email, password: formValues.password },
      {
        onError(context) {
          if (context.response.status === 429) {
            retryAfter =
              Number(context.response.headers.get("X-Retry-After")) || 60;
          }
        },
      },
    );

    if (retryAfter > 0) {
      // Paused for this email: the button waits out the countdown.
      pause.start(retryAfter);
      return;
    }

    if (error) {
      setSignInError(
        error.message ?? "That email and password didn’t match. Try again.",
      );
      toastError(error, "Sign in failed");
      return;
    }

    // The dashboard sends users without an organization or a verified email
    // to the matching onboarding step.
    router.replace(getRedirectTarget());
    router.refresh();
  };

  const paused = !pause.done;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-5">
        <AuthHeading
          title="Sign in to Zentro"
          description="Welcome back. Use your work account."
        />

        {paused ? (
          <AuthBanner title="Too many attempts.">
            For your security we paused sign-in for this email. Try again in{" "}
            <span className="font-mono text-ink">
              {formatMmSs(pause.seconds)}.
            </span>
          </AuthBanner>
        ) : null}

        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <AuthField
              label="Work email"
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

        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <AuthField
              label="Password"
              htmlFor="password"
              link={{
                href: paths.auth.forgotPassword(),
                label: "Forgot password?",
              }}
              error={fieldState.error?.message ?? signInError ?? undefined}
            >
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={
                  fieldState.invalid || Boolean(signInError) || undefined
                }
                aria-describedby={
                  fieldState.error || signInError ? "password-error" : undefined
                }
                {...field}
              />
            </AuthField>
          )}
        />

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={paused}
          // The paused state is the one place the button is disabled, and it
          // says why, in the banner above.
          className={cn("w-full", paused && "opacity-40")}
        >
          Sign in
        </Button>

        {paused ? (
          <AuthNote>
            You can still reset your password. Sign-in unlocks when the timer
            ends.
          </AuthNote>
        ) : null}
      </div>
    </form>
  );
}
