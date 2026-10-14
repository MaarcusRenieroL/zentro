"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTrpcClient } from "@zentro/api/react";
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
import { useRouter } from "next/navigation";

import { trpcResult } from "~/src/lib/trpc-result";
import { formatRelativeDate } from "~/src/lib/helpers";

type Props = {
  invitations: NewInvitation[];
};

export const InvitationsSection: FC<Props> = ({ invitations }) => {
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(
    null,
  );
  const [cancelingInviteId, setCancelingInviteId] = useState<string | null>(
    null,
  );

  const router = useRouter();
  const trpc = useTrpcClient();

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const pendingInvitations = invitations.filter((invitation) => {
    const expiresAt = invitation.expiresAt;
    const isExpired = Boolean(expiresAt && expiresAt.getTime() < Date.now());

    return invitation.status === "pending" && !isExpired;
  });

  const handleSendInvite = async (formValues: InviteMemberFormValues) => {
    const { error } = await trpcResult(
      trpc.invitation.invite.mutate({
        email: formValues.email,
        role: formValues.role,
      }),
    );

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("Success", "Organization Invite sent successfully");
    reset({
      email: "",
      role: "member",
    });
    router.refresh();
  };

  const handleResend = async (id: string) => {
    const invitation = invitations.find(
      (currentInvitation) => currentInvitation.id === id,
    );

    if (!invitation) {
      toastError("Invite not found", "Please refresh and try again.");
      return;
    }

    setResendingInviteId(id);

    try {
      const { error } = await trpcResult(
        trpc.invitation.resend.mutate({ invitationId: id }),
      );

      if (error) {
        toastError(error.statusText, error.message);
        return;
      }

      toastSuccess("Success", "Invitation resent successfully.");
      router.refresh();
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleCancel = async (id: string) => {
    setCancelingInviteId(id);

    try {
      const { error } = await trpcResult(
        trpc.invitation.cancel.mutate({ invitationId: id }),
      );

      if (error) {
        toastError(error.statusText, error.message);
        return;
      }

      toastSuccess("Success", "Invitation cancelled successfully.");
      router.refresh();
    } finally {
      setCancelingInviteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-xl py-0">
        <CardContent className="p-4 sm:p-5">
          <form
            noValidate
            onSubmit={handleSubmit(handleSendInvite)}
            className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-[minmax(0,1fr)_180px_auto] xl:items-start"
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
              disabled={isSubmitting}
              className="w-full md:col-span-2 xl:col-span-1 xl:mt-7 xl:w-auto"
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

      <Card className="rounded-xl py-0">
        <CardContent className="p-4 sm:p-5">
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
                    className="flex flex-col gap-4 rounded-xl border border-hairline/60 bg-surface/60 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sunken">
                        <MailIcon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {invitation.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invitation.role}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
                      <span
                        suppressHydrationWarning
                        className="text-xs text-muted-foreground"
                      >
                        Expires{" "}
                        {formatRelativeDate(invitation.expiresAt ?? null)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => handleResend(invitationId)}
                        disabled={
                          resendingInviteId === invitationId ||
                          cancelingInviteId === invitationId
                        }
                      >
                        <RotateCwIcon
                          className={`size-3.5 ${
                            resendingInviteId === invitationId
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                        Resend
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => handleCancel(invitationId)}
                        disabled={
                          cancelingInviteId === invitationId ||
                          resendingInviteId === invitationId
                        }
                      >
                        {cancelingInviteId === invitationId ? (
                          <RotateCwIcon className="size-3.5 animate-spin" />
                        ) : (
                          <XIcon className="size-3.5" />
                        )}
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-md border border-dashed bg-background/40 p-6 text-center sm:p-10">
              <MailIcon className="mx-auto size-10 text-muted-foreground" />
              <h3 className="mt-4 text-base font-semibold text-foreground">
                No pending invitations
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Invite members to collaborate in this workspace.
              </p>
              <Button
                variant="outline"
                className="mt-5 w-full sm:w-auto"
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
