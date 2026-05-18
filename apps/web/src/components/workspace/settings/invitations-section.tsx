"use client";

import { Button } from "@zentro/ui/components/shadcn/button";
import { Card, CardContent } from "@zentro/ui/components/shadcn/card";
import { Input } from "@zentro/ui/components/shadcn/input";
import { Label } from "@zentro/ui/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/components/shadcn/select";
import {
  MailIcon,
  PlusIcon,
  RotateCwIcon,
  SendIcon,
  XIcon,
} from "lucide-react";
import { FC, FormEvent, useState } from "react";

type Invitation = {
  id: string;
  email: string;
  role: "admin" | "member";
  invitedBy: string;
  expiresAt: string;
  status: "pending" | "expired";
};

const initialInvitations: Invitation[] = [
  {
    id: "1",
    email: "franky@strawhats.com",
    role: "member",
    invitedBy: "Monkey D. Luffy",
    expiresAt: "May 25, 2026",
    status: "pending",
  },
  {
    id: "2",
    email: "brook@strawhats.com",
    role: "admin",
    invitedBy: "Nami",
    expiresAt: "May 26, 2026",
    status: "pending",
  },
];

export const InvitationsSection: FC = () => {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loadingInviteId, setLoadingInviteId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );

  const handleSendInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setIsSending(true);
    window.setTimeout(() => {
      setInvitations((currentInvitations) => [
        {
          id: crypto.randomUUID(),
          email: email.trim().toLowerCase(),
          role,
          invitedBy: "Monkey D. Luffy",
          expiresAt: "May 25, 2026",
          status: "pending",
        },
        ...currentInvitations,
      ]);
      setEmail("");
      setRole("member");
      setIsSending(false);
    }, 400);
  };

  const handleResend = (id: string) => {
    setLoadingInviteId(id);
    window.setTimeout(() => setLoadingInviteId(null), 700);
  };

  const handleCancel = (id: string) => {
    setInvitations((currentInvitations) =>
      currentInvitations.filter((invitation) => invitation.id !== id),
    );
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-md bg-card/50 py-0 shadow-sm">
        <CardContent className="p-4">
          <form
            onSubmit={handleSendInvite}
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                placeholder="member@company.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as "admin" | "member")}
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={!email.trim() || isSending}>
              {isSending ? (
                <RotateCwIcon className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
              Send invite
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-md bg-card/50 py-0 shadow-sm">
        <CardContent className="p-4">
          {pendingInvitations.length > 0 ? (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col gap-4 rounded-md border bg-background/60 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <MailIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {invitation.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Invited by {invitation.invitedBy} · {invitation.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span className="text-xs text-muted-foreground">
                      Expires {invitation.expiresAt}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResend(invitation.id)}
                      disabled={loadingInviteId === invitation.id}
                    >
                      <RotateCwIcon
                        className={`size-3.5 ${
                          loadingInviteId === invitation.id
                            ? "animate-spin"
                            : ""
                        }`}
                      />
                      Resend
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(invitation.id)}
                    >
                      <XIcon className="size-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-md border border-dashed bg-background/40 p-10 text-center">
              <MailIcon className="mx-auto size-10 text-muted-foreground" />
              <h3 className="mt-4 text-base font-semibold text-foreground">
                No pending invitations
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Invite members to collaborate in this workspace.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => document.getElementById("invite-email")?.focus()}
              >
                <PlusIcon className="size-4" />
                Send first invite
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
