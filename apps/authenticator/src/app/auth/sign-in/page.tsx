"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@zentro/ui/shadcn/field";
import { GithubIcon, GoogleIcon } from "@zentro/ui/components/icons";
import { Controller, useForm } from "react-hook-form";
import { SignInFormValues, signInSchema } from "../../lib/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@zentro/auth/client";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { useRouter } from "next/navigation";
import { submitWorkspaceSessionBridge } from "../../../lib/session-bridge";

type OnboardingRedirectResponse = {
  redirectTo?: string;
  sessionToken?: string;
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isValid },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (formValues: SignInFormValues) => {
    const { data, error: signInError } = await authClient.signIn.email({
      email: formValues.email,
      password: formValues.password,
    });

    if (signInError) {
      toastError(signInError, "Login failed");
      return;
    }

    toastSuccess("Success", "Logged in successfully");

    const response = await fetch("/api/auth/onboarding-redirect", {
      credentials: "include",
    });

    const redirect = (await response.json()) as OnboardingRedirectResponse;

    if (!response.ok) {
      router.replace(redirect.redirectTo ?? "/auth/sign-in");
      return;
    }

    submitWorkspaceSessionBridge({
      redirectTo: redirect.redirectTo ?? "/auth/sign-in",
      sessionToken: data?.token ?? redirect.sessionToken,
    });
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your Zentro account
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

            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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

                  {fieldState.error && (
                    <p className="mt-2 text-xs text-red-400">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:text-primary/80"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </FieldGroup>
        </form>

        <FieldSeparator className="my-6">or</FieldSeparator>

        <div className="flex flex-col gap-3">
          <Button variant="outline" className="w-full">
            <GoogleIcon className="fill-white" />
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full">
            <GithubIcon className="fill-white" />
            Continue with GitHub
          </Button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="text-primary hover:text-primary/80"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
