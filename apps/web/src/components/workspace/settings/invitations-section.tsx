"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTrpcClient } from "@zentro/api/react";
import { EmptyState } from "@zentro/ui/components/empty-state";
import { SegmentedControl } from "@zentro/ui/components/segmented-control";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Input } from "@zentro/ui/components/shadcn/input";
import { Textarea } from "@zentro/ui/components/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/components/shadcn/select";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { MailIcon, SendIcon } from "lucide-react";
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

import { SettingsError, SettingsHeader, SettingsTile } from "./settings-kit";

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
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkRole, setBulkRole] = useState<"member" | "admin">("member");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);

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

  const sendBulk = async () => {
    const emails = bulkText
      .split(/[\s,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    const invalid = emails.filter(
      (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email),
    );

    if (emails.length === 0) {
      setBulkError("Paste at least one email address.");
      return;
    }

    if (invalid.length > 0) {
      setBulkError(
        `${invalid[0]} doesn’t look like an email address. Fix it or remove it, then try again.`,
      );
      return;
    }

    setBulkError(null);
    setBulkSending(true);

    const failed: string[] = [];

    for (const email of emails) {
      const { error } = await trpcResult(
        trpc.invitation.invite.mutate({
          email: email.toLowerCase(),
          role: bulkRole,
        }),
      );

      if (error) failed.push(`${email}: ${error.message}`);
    }

    setBulkSending(false);

    if (failed.length > 0) {
      setBulkError(failed.join(" "));
    } else {
      setBulkText("");
    }

    if (failed.length < emails.length) {
      toastSuccess(
        `${emails.length - failed.length} invite${emails.length - failed.length === 1 ? "" : "s"} sent`,
      );
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsHeader
        eyebrow="ORGANIZATION"
        title="Invitations"
        description="Invite people by email. Invites expire after 7 days."
      />

      <SettingsTile>
        <div className="flex items-center gap-3 px-[22px] pt-4">
          <SegmentedControl
            label="Invite mode"
            value={bulk ? "bulk" : "one"}
            onValueChange={(value) => setBulk(value === "bulk")}
            options={[
              { value: "one", label: "One person" },
              { value: "bulk", label: "Several people" },
            ]}
          />
        </div>

        {bulk ? (
          <div className="flex flex-col gap-3 px-[22px] py-[18px]">
            <label htmlFor="bulk-emails" className="text-sm font-medium">
              Email addresses
            </label>
            <Textarea
              id="bulk-emails"
              value={bulkText}
              onChange={(event) => {
                setBulkText(event.target.value);
                setBulkError(null);
              }}
              placeholder="arjun@company.com, meera@company.com"
              aria-invalid={bulkError ? true : undefined}
              aria-describedby={bulkError ? "bulk-emails-error" : undefined}
              className="min-h-28 font-mono text-sm"
            />
            <SettingsError id="bulk-emails-error">
              {bulkError ?? undefined}
            </SettingsError>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={bulkRole}
                onValueChange={(value) =>
                  setBulkRole(value as "member" | "admin")
                }
              >
                <SelectTrigger aria-label="Role for everyone" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <span className="flex-1" />
              <Button loading={bulkSending} onClick={sendBulk}>
                <SendIcon />
                Send invites
              </Button>
            </div>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={handleSubmit(handleSendInvite)}
            className="grid gap-4 px-[22px] py-[18px] md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-start"
          >
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="invite-email" className="text-sm font-medium">
                    Email address
                  </label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="member@company.com"
                    autoComplete="email"
                    aria-invalid={Boolean(fieldState.error) || undefined}
                    aria-describedby={
                      fieldState.error ? "invite-email-error" : undefined
                    }
                    className="font-mono text-sm"
                    {...field}
                  />
                  <SettingsError id="invite-email-error">
                    {fieldState.error?.message}
                  </SettingsError>
                </div>
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="invite-role" className="text-sm font-medium">
                    Role
                  </label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="invite-role" className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full md:mt-[26px] md:w-auto"
            >
              <SendIcon />
              Send invite
            </Button>
          </form>
        )}
      </SettingsTile>

      <section aria-labelledby="pending-title" className="flex flex-col gap-2">
        <h3 id="pending-title" className="eyebrow px-3">
          Pending · {pendingInvitations.length}
        </h3>
        {pendingInvitations.length > 0 ? (
          <ul className="flex flex-col">
            {pendingInvitations.map((invitation) => {
              const invitationId = invitation.id;

              if (!invitationId) return null;

              const busy =
                resendingInviteId === invitationId ||
                cancelingInviteId === invitationId;

              return (
                <li
                  key={invitationId}
                  className="flex flex-wrap items-center gap-3 rounded-xl border-t border-hairline/60 px-3 py-3 first:border-t-0 hover:bg-hover"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sunken">
                    <MailIcon
                      className="size-4 text-ink-3"
                      aria-hidden="true"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm">
                      {invitation.email}
                    </p>
                    <p className="text-xs text-ink-3 capitalize">
                      {invitation.role}
                    </p>
                  </div>
                  <span className="rounded-full border border-hairline px-2 py-px text-[11px] text-ink-2">
                    Pending
                  </span>
                  <span
                    suppressHydrationWarning
                    className="font-mono text-xs text-ink-3"
                  >
                    Expires {formatRelativeDate(invitation.expiresAt ?? null)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={resendingInviteId === invitationId}
                    disabled={busy}
                    onClick={() => handleResend(invitationId)}
                  >
                    Resend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={cancelingInviteId === invitationId}
                    disabled={busy}
                    onClick={() => handleCancel(invitationId)}
                  >
                    Cancel
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<MailIcon className="size-4" aria-hidden="true" />}
            title="No pending invitations."
            description="Invite people to work in this workspace with you."
          />
        )}
      </section>
    </div>
  );
};
