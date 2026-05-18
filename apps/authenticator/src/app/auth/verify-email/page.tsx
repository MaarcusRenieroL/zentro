"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, RefreshCw, ArrowRight } from "lucide-react";

import { authClient } from "@zentro/auth/client";
import { toastError, toastSuccess } from "@zentro/ui/lib/toast";

import { Button } from "@zentro/ui/shadcn/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@zentro/ui/shadcn/input-otp";
import { LoadingState } from "@zentro/ui/components/loading-state";
import { getOtpErrorMessage } from "../../lib/helpers";
import { submitWorkspaceSessionBridge } from "../../../lib/session-bridge";

type OnboardingRedirectResponse = {
  redirectTo?: string;
  sessionToken?: string;
};

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      toastError("Missing email", "Please sign up again.");
      router.replace("/auth/sign-up");
    }
  }, [email, router]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await authClient.getSession();

      if (data?.user.emailVerified) {
        const response = await fetch("/api/auth/onboarding-redirect", {
          credentials: "include",
        });
        const redirect = (await response.json()) as OnboardingRedirectResponse;

        if (!response.ok || !redirect.redirectTo) {
          router.replace(redirect.redirectTo ?? "/auth/create-organization");
          return;
        }

        submitWorkspaceSessionBridge({
          redirectTo: redirect.redirectTo,
          sessionToken: redirect.sessionToken,
        });
      }
    };

    void checkSession();
  }, [router]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    if (!email) {
      toastError("Missing email", "Please sign up again.");
      router.replace("/auth/sign-up");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });

      if (error) {
        const otpError = getOtpErrorMessage(error);

        setOtp("");
        toastError(otpError.title, otpError.description);

        return;
      }

      toastSuccess("Success", "Email successfully verified.");
      router.replace("/auth/create-organization");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toastError("Missing email", "Please sign up again.");
      router.replace("/auth/sign-up");
      return;
    }

    setIsResending(true);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (error) {
        const otpError = getOtpErrorMessage(error);
        toastError(otpError.title, otpError.description);
        return;
      }

      setOtp("");
      toastSuccess("Success", "Verification code resent.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

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
          We sent a verification code to{" "}
          <span className="font-medium text-foreground">{email}</span>.
          <br />
          Enter it below to continue.
        </p>
      </div>

      <div className="flex items-center justify-center rounded-xl border border-border bg-card p-6">
        <div className="space-y-6">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
          >
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
            type="button"
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

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Didn&apos;t receive the code?</span>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1 text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`}
              />
              {isResending ? "Sending..." : "Resend"}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong email?{" "}
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading verification form..." />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
