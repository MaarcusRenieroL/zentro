"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@zentro/auth/client";

import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@zentro/ui/shadcn/field";
import { toastError, toastSuccess } from "@zentro/ui/lib/toast";
import { GithubIcon, GoogleIcon } from "@zentro/ui/components/icons";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain a number")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

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
    const { error } = await authClient.signUp.email({
      email: formValues.email,
      name: formValues.name,
      password: formValues.password,
    });

    if (error) {
      toastError(error, "Error creating user.");
      return;
    }

    toastSuccess("Success", "User created successfully");

    await authClient.emailOtp.sendVerificationOtp({
      email: formValues.email,
      type: "email-verification",
    });

    router.replace(
      `/auth/verify-email?email=${encodeURIComponent(formValues.email)}`,
    );
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start building with Zentro.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="name">Full name</FieldLabel>
                  <Input id="name" {...field} />
                  {fieldState.error && (
                    <p className="mt-2 text-xs text-red-400">
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
                  <Input id="email" {...field} />
                  {fieldState.error && (
                    <p className="mt-2 text-xs text-red-400">
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
                      {...field}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
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
                      {passwordRequirements.map((req) => (
                        <div
                          key={req.label}
                          className={`flex items-center gap-2 text-xs ${
                            req.met ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                          {req.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {fieldState.error && (
                    <p className="mt-2 text-xs text-red-400">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
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

        <FieldSeparator className="my-6" />

        <Button variant="outline" className="w-full mb-3">
          <GoogleIcon className="fill-white" />
          Continue with Google
        </Button>

        <Button variant="outline" className="w-full">
          <GithubIcon className="fill-white" />
          Continue with GitHub
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/sign-in"
          className="text-primary hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
