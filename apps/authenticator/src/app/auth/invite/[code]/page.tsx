"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, Users, AlertCircle } from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";

// Simulated invite data lookup
const getInviteData = async (code: string) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simulate different scenarios
  if (code === "expired") {
    return { error: "expired" };
  }
  if (code === "invalid") {
    return { error: "invalid" };
  }

  return {
    orgName: "Design Team",
    orgSlug: "design-team",
    orgLogo: null,
    invitedBy: "Sarah Chen",
    invitedByEmail: "sarah@designteam.com",
    role: "Member",
    memberCount: 12,
  };
};

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invite, setInvite] = useState<{
    orgName: string;
    orgSlug: string;
    orgLogo: string | null;
    invitedBy: string;
    invitedByEmail: string;
    role: string;
    memberCount: number;
  } | null>(null);
  const [error, setError] = useState<"expired" | "invalid" | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      const result = await getInviteData(code);
      if ("error" in result) {
        setError(result.error as "expired" | "invalid");
      } else {
        setInvite(result);
      }
      setIsLoading(false);
    };
    fetchInvite();
  }, [code]);

  const handleAccept = async () => {
    if (!invite) return;
    setIsAccepting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    router.push(`/${invite.orgSlug}`);
  };

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
            <AlertCircle className="h-7 w-7 text-destructive" />
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
            onClick={() => router.push("/join-organization")}
          >
            <span className="flex items-center gap-2">
              Enter invite code
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/create-organization")}
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

  if (!invite) return null;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Join {invite.orgName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {invite.invitedBy} has invited you to join their organization.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:gap-4 sm:p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
              <span className="text-lg font-bold text-primary-foreground">
                {invite.orgName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {invite.orgName}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{invite.memberCount} members</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-secondary/30 p-3 text-sm sm:p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <span className="text-muted-foreground">Invited by</span>
              <span className="text-foreground">{invite.invitedBy}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <span className="text-muted-foreground">Your role</span>
              <span className="text-foreground">{invite.role}</span>
            </div>
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isAccepting}
            onClick={handleAccept}
          >
            {isAccepting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Joining...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Accept invitation
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/")}
          >
            Decline
          </Button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong account?{" "}
        <Link href="/login" className="text-primary hover:text-primary/80">
          Sign in with a different account
        </Link>
      </p>
    </div>
  );
}
