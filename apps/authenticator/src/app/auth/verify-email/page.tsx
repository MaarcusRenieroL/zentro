"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, RefreshCw } from "lucide-react";
import { Button } from "@zentro/ui/components/shadcn/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@zentro/ui/components/shadcn/input-otp";

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState("");

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    // Redirect to dashboard on success
  };

  const handleResend = async () => {
    setIsResending(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsResending(false);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification code to your email.
          <br />
          Enter the code below to continue.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-6">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            onClick={handleVerify}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Verify email
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Didn&apos;t receive the code?</span>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend"
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong email?{" "}
        <Link href="/auth/sign-up" className="text-primary hover:text-primary/80">
          Use a different email
        </Link>
      </p>
    </div>
  );
}
