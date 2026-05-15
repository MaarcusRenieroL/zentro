"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Users, Building2, Check } from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@zentro/ui/shadcn/field";
import { EmptyState } from "@zentro/ui/components/empty-state";

// Simulated pending invites
const pendingInvites = [
  {
    id: "1",
    orgName: "Design Team",
    orgSlug: "design-team",
    invitedBy: "Sarah Chen",
    role: "Member",
  },
  {
    id: "2",
    orgName: "Acme Corp",
    orgSlug: "acme-corp",
    invitedBy: "John Smith",
    role: "Admin",
  },
];

export default function JoinOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoiningWithCode, setIsJoiningWithCode] = useState(false);
  const [codeError, setCodeError] = useState("");

  const handleAcceptInvite = async (orgSlug: string, inviteId: string) => {
    setIsLoading(inviteId);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(null);
    router.push(`/${orgSlug}`);
  };

  const handleJoinWithCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsJoiningWithCode(true);
    setCodeError("");
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate: code "INVALID" fails, others succeed
    if (inviteCode.toUpperCase() === "INVALID") {
      setCodeError("Invalid or expired invite code");
      setIsJoiningWithCode(false);
      return;
    }

    setIsJoiningWithCode(false);
    router.push("/new-org");
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Join an organization
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accept a pending invite or enter an invite code to join.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        {pendingInvites.length > 0 ? (
          <>
            <h2 className="mb-4 text-sm font-medium text-foreground">
              Pending invitations
            </h2>
            <div className="flex flex-col gap-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {invite.orgName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Invited by {invite.invitedBy} as {invite.role}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading === invite.id}
                    onClick={() =>
                      handleAcceptInvite(invite.orgSlug, invite.id)
                    }
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
          </>
        ) : (
          <EmptyState
            title="No pending invitations"
            description="Enter an invite code below to join a workspace."
            className="min-h-32 border-0 p-0"
          />
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium text-foreground">
          Have an invite code?
        </h2>
        <form onSubmit={handleJoinWithCode}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">Invite code</FieldLabel>
              <Input
                id="code"
                type="text"
                placeholder="Enter your invite code"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setCodeError("");
                }}
                className={codeError ? "border-destructive" : ""}
              />
              {codeError ? (
                <p className="text-xs text-destructive">{codeError}</p>
              ) : (
                <FieldDescription>
                  Paste the code shared by your organization admin.
                </FieldDescription>
              )}
            </Field>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isJoiningWithCode || !inviteCode.trim()}
            >
              {isJoiningWithCode ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Joining...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Join organization
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </FieldGroup>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Want to create your own workspace?{" "}
        <Link
          href="/auth/create-organization"
          className="text-primary hover:text-primary/80"
        >
          Create organization
        </Link>
      </p>
    </div>
  );
}
