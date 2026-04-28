"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, RefreshCw, ArrowRight } from "lucide-react";

import { authClient } from "@zentro/auth/client";
import { toast } from "@zentro/ui/components/toast";

import { Button } from "@zentro/ui/components/shadcn/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@zentro/ui/components/shadcn/input-otp";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    if (!email) {
      toast.error("Error", {
        description: "Invalid email",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });

      if (error) {
        toast.error("Verification Failed", {
          description: error.message,
        });
        return;
      }

      toast.success("Success", {
        description: "Email successfully verified",
      });

      router.replace("/auth/create-organization");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Error", {
        description: "Invalid email",
      });
      return;
    }

    setIsResending(true);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (error) {
        toast.error("Error", {
          description: error.message,
        });
        return;
      }

      toast.success("Success", {
        description: "Verification code resent",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-7 w-7 text-primary" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Verify your email
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification code
          {email ? <> to {email}</> : null}.
          <br />
          Enter it below to continue.
        </p>
      </div>

      <div className="flex items-center justify-center rounded-xl border border-border bg-card p-6">
        <div className="space-y-6">
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
            disabled={isLoading || otp.length !== 6}
            className="w-full"
          >
            {isLoading ? (
              <span>Verifying...</span>
            ) : (
              <span className="flex items-center gap-2">
                Verify Email
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Didn’t receive the code?</span>

            <button
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1 text-primary"
            >
              <RefreshCw className="h-3 w-3" />
              {isResending ? "Sending..." : "Resend"}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong email{" "}
        <Link
          href="/auth/sign-up"
          className="text-primary hover:text-primary/80"
        >
          Use a different email
        </Link>
      </p>
    </div>
  );
}
