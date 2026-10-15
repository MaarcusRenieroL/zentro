"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";

import { authClient } from "@zentro/auth/client";
import { toastError, toastSuccess } from "@zentro/ui/lib/toast";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";

import {
  AuthField,
  AuthHeading,
  ConsentCheckbox,
  PasswordInput,
  PasswordMeter,
} from "~/src/features/auth/components/kit/auth-kit";
import {
  SignupFormValues,
  signupSchema,
} from "~/src/features/auth/lib/zod-schema";
import { paths } from "~/src/lib/paths";

export default function SignupPage() {
  const router = useRouter();
  const [terms, setTerms] = useState(false);
  const [updates, setUpdates] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onTouched",
  });

  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = async (formValues: SignupFormValues) => {
    if (!terms) {
      setTermsError(true);
      return;
    }

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
        "Account created",
        "Check your email for the verification code.",
      );
    }

    router.replace(paths.auth.verifyEmail(email));
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit, () => {
        if (!terms) setTermsError(true);
      })}
    >
      <div className="flex flex-col gap-5">
        <AuthHeading
          title="Create your account"
          description="Free for teams up to 10. No card needed."
        />

        <div className="flex flex-col gap-3.5">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <AuthField
                label="Full name"
                htmlFor="name"
                error={fieldState.error?.message}
              >
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  aria-invalid={fieldState.invalid || undefined}
                  aria-describedby={fieldState.error ? "name-error" : undefined}
                  {...field}
                />
              </AuthField>
            )}
          />

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
                  autoComplete="email"
                  aria-invalid={fieldState.invalid || undefined}
                  aria-describedby={
                    fieldState.error ? "email-error" : undefined
                  }
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
        </div>

        <div className="flex flex-col gap-2.5">
          <ConsentCheckbox
            id="terms"
            checked={terms}
            invalid={termsError}
            onChange={(value) => {
              setTerms(value);
              if (value) setTermsError(false);
            }}
          >
            I agree to the Terms of Service and have read the Privacy Policy.
          </ConsentCheckbox>
          {termsError ? (
            <p
              role="alert"
              className="-mt-1 ml-7 text-[13px] leading-5 text-danger-text"
            >
              Please accept the terms to create your account.
            </p>
          ) : null}
          <ConsentCheckbox id="updates" checked={updates} onChange={setUpdates}>
            <span className="text-ink-2">
              Email me product updates, about once a month. Optional.
            </span>
          </ConsentCheckbox>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </div>
    </form>
  );
}
