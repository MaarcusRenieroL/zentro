"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@zentro/auth/client";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Card, CardContent } from "@zentro/ui/components/shadcn/card";
import { Field, FieldLabel } from "@zentro/ui/components/shadcn/field";
import { Input } from "@zentro/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/components/shadcn/select";
import { toastError, toastSuccess } from "@zentro/ui/index";
import {
  MailIcon,
  PlusIcon,
  RotateCwIcon,
  SendIcon,
  XIcon,
} from "lucide-react";
import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  InviteMemberFormValues,
  inviteMemberSchema,
} from "~/src/lib/zod-schema";
import { NewInvitation } from "@zentro/db/schema";

type Props = {
  organizationId: string;
  invitations: NewInvitation[];
};

export const InvitationsSection: FC<Props> = ({
  organizationId,
  invitations: initialInvitations,
}) => {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [loadingInviteId, setLoadingInviteId] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isValid },
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );

  const handleSendInvite = async (formValues: InviteMemberFormValues) => {
    const { error } = await authClient.organization.inviteMember({
      email: formValues.email,
      role: formValues.role,
      organizationId: organizationId,
    });

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("Success", "Organization Invite sent successfully");
  };

  const handleResend = async (id: string) => {
    const invitation = invitations.find(
      (currentInvitation) => currentInvitation.id === id,
    );

    if (!invitation) {
      toastError("Invite not found", "Please refresh and try again.");
      return;
    }

    setLoadingInviteId(id);

    const { error } = await authClient.organization.inviteMember({
      email: invitation.email,
      role: invitation.role as "member" | "admin" | "owner",
      organizationId,
      resend: true,
    });

    setLoadingInviteId(null);

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("Success", "Invitation resent successfully.");
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
            onSubmit={handleSubmit(handleSendInvite)}
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-start"
          >
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field className="space-y-2">
                  <FieldLabel htmlFor="invite-email">Email address</FieldLabel>

                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="member@company.com"
                    autoComplete="email"
                    aria-invalid={Boolean(fieldState.error)}
                    {...field}
                  />

                  {fieldState.error ? (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field, fieldState }) => (
                <Field className="space-y-2">
                  <FieldLabel htmlFor="invite-role">Role</FieldLabel>

                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="invite-role"
                      className="w-full"
                      aria-invalid={Boolean(fieldState.error)}
                    >
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  {fieldState.error ? (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </Field>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="lg:mt-7"
            >
              {isSubmitting ? (
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
              {pendingInvitations.map((invitation) => {
                const invitationId = invitation.id;

                if (!invitationId) {
                  return null;
                }

                return (
                  <div
                    key={invitationId}
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
                          Invited by invited_email · {invitation.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <span className="text-xs text-muted-foreground">
                        Expires expires_at
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(invitationId)}
                        disabled={loadingInviteId === invitationId}
                      >
                        <RotateCwIcon
                          className={`size-3.5 ${
                            loadingInviteId === invitationId
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                        Resend
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(invitationId)}
                      >
                        <XIcon className="size-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              })}
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
