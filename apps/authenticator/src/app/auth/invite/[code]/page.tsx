"use client";

import { useTrpcClient } from "@zentro/api/react";
import { authClient } from "@zentro/auth/client";
import { Button } from "@zentro/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { getOrgAppUrl } from "@zentro/utils";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  Building2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InvitationType } from "~/app/lib/types";

type TRPCErrorLike = {
  data?: {
    code?: string;
  };
};

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const trpcClient = useTrpcClient();

  const invite = params.code as string;

  const [data, setData] = useState<InvitationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<"expired" | "invalid" | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!invite) {
        setIsLoading(false);
        return;
      }

      try {
        const inviteDetails =
          await trpcClient.organization.getInviteDetails.query({
            invitationId: invite,
          });

        setData(inviteDetails);
      } catch (error) {
        const trpcError = error as TRPCErrorLike;

        if (trpcError.data?.code === "UNAUTHORIZED") {
          router.replace(
            `/auth/sign-in?redirectTo=${encodeURIComponent(`/auth/invite/${invite}`)}`,
          );
          return;
        }

        setError(
          trpcError.data?.code === "BAD_REQUEST" ? "expired" : "invalid",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvite();
  }, [invite, router, trpcClient]);

  const handleAcceptInvite = async (code: string) => {
    if (!data) {
      toastError("Invite details unavailable", "Please refresh and try again.");
      return;
    }

    setIsAccepting(true);

    const { error } = await authClient.organization.acceptInvitation({
      invitationId: code,
    });

    if (error) {
      toastError(error.statusText, error.message);
      setIsAccepting(false);
      return;
    }

    toastSuccess("Success", "Invite accepted successfully");
    router.push(
      getOrgAppUrl({
        app: "workspace",
        orgSlug: data.organizationSlug,
        path: "/dashboard",
      }),
    );
    return;
  };

  const handleDeclineInvite = async () => {
    setIsDeclining(true);

    const { error } = await authClient.organization.rejectInvitation({
      invitationId: invite,
    });

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    setIsDeclining(false);

    toastSuccess("Success", "Invite rejected successfully");
    router.push("/auth/create-organization");
  };

  const memberCountLabel =
    data?.membersCount === 1
      ? "1 member"
      : `${data?.membersCount ?? 0} members`;

  if (!invite) return null;

  if (isLoading) {
    return (
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-full bg-secondary" />
          <div className="h-6 w-48 animate-pulse rounded bg-secondary" />
          <div className="h-4 w-64 animate-pulse rounded bg-secondary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircleIcon className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {error === "expired" ? "Invite expired" : "Invalid invite"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error === "expired"
              ? "This invitation link has expired. Please ask for a new invite."
              : "This invitation link is invalid. Please check the URL or ask for a new invite."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push("/auth/join-organization")}
          >
            <span className="flex items-center gap-2">
              Go to invitations
              <ArrowRightIcon className="h-4 w-4" />
            </span>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.replace("/auth/create-organization")}
          >
            Create new organization
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:text-primary/80">
            Return to homepage
          </Link>
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Building2Icon className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Join {data.organizationName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.organizationName} has invited you to join their organization.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:gap-4 sm:p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/60">
              <span className="text-lg font-bold text-primary-foreground">
                {data.organizationName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {data.organizationName}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UsersIcon className="h-3 w-3" />
                <span>{memberCountLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-secondary/30 p-3 text-sm sm:p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <span className="text-muted-foreground">Invited by</span>
              <span className="text-foreground">{data.inviterName}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <span className="text-muted-foreground">Your role</span>
              <span className="text-foreground">{data.role}</span>
            </div>
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isAccepting}
            onClick={() => handleAcceptInvite(invite)}
          >
            {isAccepting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Joining...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Accept invitation
                <ArrowRightIcon className="h-4 w-4" />
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            disabled={isDeclining}
            onClick={handleDeclineInvite}
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
