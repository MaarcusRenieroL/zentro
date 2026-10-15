"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@zentro/auth/client";
import { toastError, toastSuccess } from "@zentro/ui/lib/toast";

import { Button } from "@zentro/ui/shadcn/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@zentro/ui/shadcn/input-otp";
import { AuthHeading } from "~/src/features/auth/components/kit/auth-kit";
import {
  formatMmSs,
  useCountdown,
} from "~/src/features/auth/lib/use-countdown";
import { LoadingState } from "@zentro/ui/components/loading-state";
import { paths } from "~/src/lib/paths";
import { getOtpErrorMessage } from "~/src/features/auth/lib/helpers";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const wait = useCountdown();
  const startWait = wait.start;

  // A code was just sent, so the first resend waits out the same minute.
  useEffect(() => startWait(60), [startWait]);

  useEffect(() => {
    if (!email) {
      toastError("Missing email", "Please sign up again.");
      router.replace(paths.auth.signUp());
    }
  }, [email, router]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await authClient.getSession();

      if (data?.user.emailVerified) {
        router.replace(paths.dashboard());
        router.refresh();
      }
    };

    void checkSession();
  }, [router]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toastError("Enter the 6-digit code", "Paste it or type all six digits.");
      return;
    }

    if (!email) {
      toastError("Missing email", "Please sign up again.");
      router.replace(paths.auth.signUp());
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
      router.replace(paths.dashboard());
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toastError("Missing email", "Please sign up again.");
      router.replace(paths.auth.signUp());
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
      wait.start(60);
      toastSuccess("Code sent again", "Check your inbox in a minute.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <AuthHeading
        title="Check your email"
        description={
          <>
            We sent a 6-digit code to{" "}
            <span className="font-mono text-ink break-all">{email}</span>. It
            expires in 10 minutes.
          </>
        }
      />

      <div className="flex flex-col gap-2.5">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          disabled={isLoading}
          autoFocus
          aria-label="Verification code"
          containerClassName="gap-[18px]"
        >
          {[0, 3].map((start) => (
            <InputOTPGroup key={start} className="gap-1.5 sm:gap-2">
              {[0, 1, 2].map((offset) => (
                <InputOTPSlot
                  key={start + offset}
                  index={start + offset}
                  className="h-14 w-11 rounded-xl border bg-surface font-mono text-[22px] first:rounded-xl first:border-l sm:h-16 sm:w-14 sm:text-[26px] data-[active=true]:ring-4 data-[active=true]:ring-ring/22"
                />
              ))}
            </InputOTPGroup>
          ))}
        </InputOTP>
        <p className="text-[13px] leading-5 text-ink-3">
          You can paste the whole code.{" "}
          {wait.done ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="rounded-xs text-signal underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
            >
              {isResending ? "Sending…" : "Resend the code"}
            </button>
          ) : (
            <span className="font-mono">
              Resend in {formatMmSs(wait.seconds, false)}
            </span>
          )}
        </p>
      </div>

      <Button
        type="button"
        onClick={handleVerify}
        loading={isLoading}
        // Short codes are checked on press, never by a dead button.
        className="w-full"
      >
        Verify email
      </Button>
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
