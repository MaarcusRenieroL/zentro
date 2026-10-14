"use client";

import { paths } from "~/src/lib/paths";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@zentro/auth/client";

import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { Field, FieldGroup, FieldLabel } from "@zentro/ui/shadcn/field";
import { toastError, toastSuccess } from "@zentro/ui/lib/toast";
import {
  SignupFormValues,
  signupSchema,
} from "~/src/features/auth/lib/zod-schema";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = async (formValues: SignupFormValues) => {
    const email = formValues.email.trim().toLowerCase();
    const name = formValues.name.trim();

    const { error } = await authClient.signUp.email({
      email,
      name,
      password: formValues.password,
    });

    if (error) {
      toastError(error.statusText ?? "Signup failed", error.message);
      return;
    }

    const { error: emailOtpError } =
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

    if (emailOtpError) {
      toastError(
        "Verification email failed",
        "Your account was created, but we could not send the verification code. Try resending it on the next page.",
      );
    } else {
      toastSuccess(
        "Success",
        "Account created. Check your email for the code.",
      );
    }

    router.replace(paths.auth.verifyEmail(email));
  };

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

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl text-ink">Create your account</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Start building with Zentro.
        </p>
      </div>

      <div className="tile p-5 sm:p-7">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="name">Full name</FieldLabel>

                  <Input id="name" type="text" autoComplete="name" {...field} />

                  {fieldState.error && (
                    <p className="mt-2 text-xs text-danger-text">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="email">Work email</FieldLabel>

                  <Input
                    id="email"
                    type="email"
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
                      className="pr-10"
                      autoComplete="new-password"
                      {...field}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
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

            <Button
              type="submit"
              disabled={
                !isValid ||
                isSubmitting ||
                !passwordRequirements.every((requirement) => requirement.met)
              }
              className="w-full"
              suppressHydrationWarning
            >
              {isSubmitting ? (
                <span>Creating account...</span>
              ) : (
                <span className="flex items-center gap-2">
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </FieldGroup>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={paths.auth.signIn()}
          className="text-primary hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
