"use client";

import { FC, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTrpcClient } from "@zentro/api/react";
import type { JoinOrganizationListSchema } from "@zentro/api/types/zod-schema";
import { authClient } from "@zentro/auth/client";
import { OrgAvatar } from "@zentro/ui/components/org-avatar";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { paths } from "~/src/lib/paths";

import { AuthField } from "../kit/auth-kit";

/** Pending invitations for this email, plus a field for an invite code. */
export const InvitedOrgsList: FC = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [invitedOrgsList, setInvitedOrgsList] = useState<
    JoinOrganizationListSchema[] | null
  >(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const router = useRouter();
  const trpc = useTrpcClient();

  useEffect(() => {
    const loadInvitationsList = async () => {
      try {
        setInvitedOrgsList(await trpc.user.listPendingInvites.query());
      } catch {
        // The code field still works without the list.
        setInvitedOrgsList([]);
        toastError("Error", "Could not load pending invitations");
      }
    };

    void loadInvitationsList();
  }, [trpc]);

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

  const submitCode = () => {
    const value = code.trim();

    if (!value) {
      setCodeError(
        "Enter the invite code from your email. Codes work for 7 days.",
      );
      return;
    }

    router.push(paths.auth.invite(value));
  };

  return (
    <div className="flex flex-col gap-5">
      {invitedOrgsList === null ? (
        <Skeleton className="h-[72px] rounded-2xl" />
      ) : (
        invitedOrgsList.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3.5"
          >
            <OrgAvatar name={invite.orgName} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-semibold">
                {invite.orgName}
              </span>
              <span className="truncate text-[13px] text-ink-2">
                You’ll join as {invite.role} · invited by {invite.invitedBy}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              loading={isLoading === invite.id}
              onClick={() => handleAcceptInvite(invite.id)}
            >
              Join
            </Button>
          </div>
        ))
      )}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submitCode();
        }}
        className="flex flex-col gap-3.5"
      >
        <AuthField
          label="Invite code"
          htmlFor="invite-code"
          error={codeError ?? undefined}
        >
          <Input
            id="invite-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setCodeError(null);
            }}
            placeholder="Paste your invite code"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={codeError ? true : undefined}
            aria-describedby={codeError ? "invite-code-error" : undefined}
            className="h-13 font-mono text-base tracking-[0.04em]"
          />
        </AuthField>
        <Button type="submit" variant="outline" className="w-full">
          Find my organization
        </Button>
      </form>
    </div>
  );
};
