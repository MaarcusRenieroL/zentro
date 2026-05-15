"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { Field, FieldGroup, FieldLabel } from "@zentro/ui/shadcn/field";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains a letter", met: /[a-zA-Z]/.test(password) },
  ];

  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  if (isSubmitted) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Password reset
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been successfully reset.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <Button
            asChild
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/login">
              <span className="flex items-center gap-2">
                Continue to sign in
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Set new password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
                      <Check
                        className={`h-3 w-3 ${req.met ? "opacity-100" : "opacity-30"}`}
                      />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirm password
              </FieldLabel>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              {confirmPassword && (
                <div
                  className={`mt-2 flex items-center gap-2 text-xs ${
                    passwordsMatch ? "text-primary" : "text-destructive"
                  }`}
                >
                  <Check
                    className={`h-3 w-3 ${passwordsMatch ? "opacity-100" : "opacity-30"}`}
                  />
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </div>
              )}
            </Field>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                isLoading ||
                !passwordsMatch ||
                !passwordRequirements.every((r) => r.met)
              }
            >
              {isLoading ? (
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
