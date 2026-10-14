"use client";

import { FC, useEffect } from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check } from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";
import { useTrpcClient } from "@zentro/api/react";
import type { JoinOrganizationListSchema } from "@zentro/api/types/zod-schema";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { paths } from "~/src/lib/paths";
import { authClient } from "@zentro/auth/client";

export const InvitedOrgsList: FC = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [invitedOrgsList, setInvitedOrgsList] = useState<
    JoinOrganizationListSchema[] | null
  >(null);

  const router = useRouter();
  const trpc = useTrpcClient();

  useEffect(() => {
    const loadInvitationsList = async () => {
      try {
        const data = await trpc.user.listPendingInvites.query();

        if (data.length === 0) {
          toastError(
            "No invitations found",
            "Create an organization to continue.",
          );
          router.replace(paths.auth.createOrganization());
          return;
        }

        setInvitedOrgsList(data);
      } catch {
        toastError("Error", "Could not load pending invitations");
        router.replace(paths.auth.createOrganization());
      }
    };

    loadInvitationsList();
  }, [router, trpc]);

  const handleAcceptInvite = async (inviteId: string) => {
    setIsLoading(inviteId);

    const { error } = await authClient.organization.acceptInvitation({
      invitationId: inviteId,
    });

    if (error) {
      toastError(error.statusText, error.message);
      setIsLoading(null);
      return;
    }

    toastSuccess("Success", "Invite accepted successfully");
    router.push(paths.dashboard());
    router.refresh();
  };

  if (invitedOrgsList === null) {
    return (
      <div className="mb-6 tile p-5 sm:p-7">
        <div className="h-24 animate-pulse rounded-lg bg-secondary/60" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 tile p-5 sm:p-7">
        <h2 className="mb-4 text-sm font-medium text-foreground">
          Pending invitations
        </h2>
        <div className="flex flex-col gap-3">
          {invitedOrgsList.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {invite.orgName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Invited by {invite.invitedBy} as {invite.role}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                disabled={isLoading === invite.id}
                onClick={() => handleAcceptInvite(invite.id)}
              >
                {isLoading === invite.id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <span className="flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Join
                  </span>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
