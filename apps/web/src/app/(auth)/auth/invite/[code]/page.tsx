"use client";

import { useTrpcClient } from "@zentro/api/react";
import { authClient } from "@zentro/auth/client";
import { OrgAvatar } from "@zentro/ui/components/org-avatar";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Skeleton } from "@zentro/ui/components/shadcn/skeleton";
import { AuthHeading } from "~/src/features/auth/components/kit/auth-kit";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { paths } from "~/src/lib/paths";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InvitationType } from "~/src/features/auth/lib/types";

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
          router.replace(paths.auth.signIn(paths.auth.invite(invite)));
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
    router.push(paths.dashboard());
    router.refresh();
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
    router.push(paths.auth.createOrganization());
  };

  const memberCountLabel =
    data?.membersCount === 1
      ? "1 member"
      : `${data?.membersCount ?? 0} members`;

  if (!invite) return null;

  if (isLoading) {
    return (
      <div aria-busy="true" className="flex flex-col gap-5">
        <Skeleton className="h-[72px] rounded-2xl" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-11 rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5">
        <AuthHeading
          title={
            error === "expired"
              ? "This invite has expired."
              : "This invite isn’t available."
          }
          description={
            error === "expired"
              ? "Invitation links work for 7 days. Ask for a new one and it will land in your inbox."
              : "The link is invalid, or it was sent to another email address. Sign in with the address it was sent to, or ask for a new invite."
          }
        />
        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => router.push(paths.auth.joinOrganization())}
          >
            Go to invitations
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.replace(paths.auth.createOrganization())}
          >
            Create a new organization
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3.5">
        <OrgAvatar name={data.organizationName} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-semibold">
            {data.organizationName}
          </span>
          <span className="font-mono text-xs text-ink-3">
            {memberCountLabel}
          </span>
        </div>
      </div>

      <AuthHeading
        title={`${data.inviterName} invited you to ${data.organizationName}`}
        description={`You’ll join as ${/^[aeiou]/i.test(data.role) ? "an" : "a"} ${data.role}.`}
      />

      <div className="flex flex-col gap-2">
        <Button
          className="w-full"
          loading={isAccepting}
          onClick={() => handleAcceptInvite(invite)}
        >
          Accept invitation
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          loading={isDeclining}
          onClick={handleDeclineInvite}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
