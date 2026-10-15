"use client";

import { useTrpcClient } from "@zentro/api/react";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Input } from "@zentro/ui/components/shadcn/input";
import { Switch } from "@zentro/ui/components/shadcn/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/components/shadcn/select";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, FormEvent, KeyboardEvent, useState } from "react";

import { usePermission } from "~/src/components/permissions/permission-provider";
import { trpcResult } from "~/src/lib/trpc-result";

import { SettingsError, SettingsHeader } from "./settings-kit";

export type InvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  inviterName: string | null;
};

type Props = {
  organizationName: string;
  invitations: InvitationRow[];
};

type Role = "member" | "admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DAY = 24 * 60 * 60 * 1000;

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Why an address can't be sent, in words a person can act on. */
function problemWith(email: string) {
  if (!email.includes("@")) return `${email} is missing the @.`;
  if (!/\.[^\s@.]{2,}$/.test(email.split("@")[1] ?? "")) {
    return `${email} is missing the ending, like .com.`;
  }

  return `${email} doesn’t look like an email address.`;
}

/** The invite's state: pending, expired or accepted. */
function stateOf(invitation: InvitationRow, now: number) {
  if (invitation.status === "accepted") return "accepted" as const;

  const expired =
    invitation.expiresAt !== null &&
    new Date(invitation.expiresAt).getTime() < now;

  return expired ? ("expired" as const) : ("pending" as const);
}

const RoleSelect: FC<{
  id: string;
  value: Role;
  onChange: (role: Role) => void;
}> = ({ id, value, onChange }) => (
  <Select
    value={value}
    onValueChange={(next) => {
      if (next !== "") onChange(next as Role);
    }}
  >
    <SelectTrigger id={id} className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="member">Member</SelectItem>
      <SelectItem value="admin">Admin</SelectItem>
    </SelectContent>
  </Select>
);

export const InvitationsSection: FC<Props> = ({
  organizationName,
  invitations,
}) => {
  const canInvite = usePermission("members.invite");
  const canResend = usePermission("invitations.resend");
  const canCancel = usePermission("invitations.cancel");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [several, setSeveral] = useState(false);
  const [email, setEmail] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const router = useRouter();
  const trpc = useTrpcClient();
  const now = Date.now();

  // Cancelled and declined invites are history, not something to act on.
  const sent = invitations.filter(
    (invitation) =>
      invitation.status === "pending" || invitation.status === "accepted",
  );
  const pendingCount = sent.filter(
    (invitation) => stateOf(invitation, now) === "pending",
  ).length;

  const addChips = (text: string) => {
    const next = text
      .split(/[\s,;]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (next.length === 0) return;
    setChips((current) => [...new Set([...current, ...next])]);
    setDraft("");
    setError(null);
  };

  const invalidChips = chips.filter((chip) => !emailPattern.test(chip));
  const validChips = chips.filter((chip) => emailPattern.test(chip));

  const sendAll = async (emails: string[]) => {
    setSending(true);

    const failed: string[] = [];

    for (const address of emails) {
      const { error: sendError } = await trpcResult(
        trpc.invitation.invite.mutate({ email: address, role }),
      );

      if (sendError) failed.push(`${address}: ${sendError.message}`);
    }

    setSending(false);

    const sentCount = emails.length - failed.length;

    if (failed.length > 0) setError(failed.join(" "));
    if (sentCount > 0) {
      toastSuccess(
        sentCount === 1 ? "Invite sent" : `${sentCount} invites sent`,
        "They have 7 days to accept.",
      );
      router.refresh();
    }

    return failed.length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (several) {
      const pending = draft.trim()
        ? [...chips, ...draft.split(/[\s,;]+/).filter(Boolean)]
        : chips;

      if (draft.trim()) addChips(draft);
      if (pending.length === 0) {
        setError("Paste or type at least one email address.");
        return;
      }

      const bad = pending.filter((chip) => !emailPattern.test(chip));

      if (bad.length > 0) {
        const others = pending.length - bad.length;

        setError(
          `${problemWith(bad[0]!)} Fix it or remove it${
            others > 0 ? ` to send the other ${others}` : ""
          }.`,
        );
        return;
      }

      if (await sendAll(pending.map((chip) => chip.toLowerCase()))) {
        setChips([]);
      }

      return;
    }

    const address = email.trim().toLowerCase();

    if (!address) {
      setError("Enter the email address to invite.");
      return;
    }
    if (!emailPattern.test(address)) {
      setError(problemWith(address));
      return;
    }

    setError(null);
    if (await sendAll([address])) setEmail("");
  };

  const onChipKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", " ", "Tab"].includes(event.key) && draft.trim()) {
      event.preventDefault();
      addChips(draft);
    } else if (event.key === "Backspace" && !draft && chips.length) {
      setChips((current) => current.slice(0, -1));
    }
  };

  const act = async (id: string, kind: "resend" | "cancel") => {
    setBusyId(id);

    try {
      const { error: actError } =
        kind === "resend"
          ? await trpcResult(
              trpc.invitation.resend.mutate({ invitationId: id }),
            )
          : await trpcResult(
              trpc.invitation.cancel.mutate({ invitationId: id }),
            );

      if (actError) {
        toastError(actError.statusText, actError.message);
        return;
      }

      toastSuccess(
        kind === "resend" ? "Invite sent again" : "Invite cancelled",
        kind === "resend"
          ? "It's good for another 7 days."
          : "The link no longer works.",
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const sendCount = several ? validChips.length + invalidChips.length : 1;

  return (
    <div className="flex flex-col gap-6">
      <SettingsHeader
        eyebrow="ORGANIZATION"
        title="Invitations"
        description="Invite people by email. Invites expire after 7 days."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
        {canInvite ? (
          <form
            noValidate
            onSubmit={submit}
            aria-labelledby="invite-title"
            className="tile flex flex-col gap-4 p-5"
          >
            <div className="flex items-center gap-3">
              <h2 id="invite-title" className="flex-1 font-semibold">
                Invite people
              </h2>
              <label className="flex items-center gap-2 text-[13px] text-ink-2">
                Several at once
                <Switch
                  checked={several}
                  onCheckedChange={(checked) => {
                    setSeveral(checked);
                    setError(null);
                  }}
                />
              </label>
            </div>

            {several ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite-emails" className="text-sm font-medium">
                  Emails
                </label>
                <div
                  className={cn(
                    "flex min-h-24 flex-wrap content-start gap-1.5 rounded-md border border-input bg-surface p-2 focus-within:ring-2 focus-within:ring-ring",
                    error && "border-danger",
                  )}
                >
                  {chips.map((chip) => {
                    const bad = !emailPattern.test(chip);

                    return (
                      <span
                        key={chip}
                        className={cn(
                          "inline-flex h-6 items-center gap-1 rounded-sm border px-1.5 font-mono text-xs",
                          bad
                            ? "border-danger bg-danger-subtle text-danger-text"
                            : "border-hairline bg-hover",
                        )}
                      >
                        {chip}
                        <button
                          type="button"
                          aria-label={`Remove ${chip}`}
                          onClick={() =>
                            setChips((current) =>
                              current.filter((value) => value !== chip),
                            )
                          }
                          className="text-ink-3 hover:text-ink"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </span>
                    );
                  })}
                  <input
                    id="invite-emails"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={onChipKey}
                    onPaste={(event) => {
                      event.preventDefault();
                      addChips(event.clipboardData.getData("text"));
                    }}
                    onBlur={() => addChips(draft)}
                    placeholder={
                      chips.length ? "" : "Paste or type, separated by commas"
                    }
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "invite-error" : undefined}
                    className="h-6 min-w-40 flex-1 bg-transparent font-mono text-xs outline-none placeholder:font-sans placeholder:text-ink-3"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  placeholder="name@company.com"
                  autoComplete="email"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "invite-error" : undefined}
                  className="font-mono text-sm"
                />
              </div>
            )}

            <SettingsError id="invite-error">
              {error ?? undefined}
            </SettingsError>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-role" className="text-sm font-medium">
                Role
              </label>
              <RoleSelect id="invite-role" value={role} onChange={setRole} />
              <p className="text-xs text-ink-3">
                {role === "admin"
                  ? `Admins manage people, roles and modules in ${organizationName}.`
                  : `Members create tasks and docs and see every open project.`}
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-hairline pt-4">
              <span className="flex-1 text-xs text-ink-3">
                Invites expire after 7 days.
              </span>
              <Button type="submit" loading={sending}>
                {several && sendCount > 1
                  ? `Send ${sendCount} invites`
                  : "Send invite"}
              </Button>
            </div>
          </form>
        ) : null}

        <section
          aria-labelledby="sent-title"
          className={cn("flex flex-col gap-2", !canInvite && "lg:col-span-2")}
        >
          <h2 id="sent-title" className="flex items-center gap-2 font-semibold">
            Sent invites
            <span className="font-mono text-xs font-normal text-ink-3">
              {pendingCount}
            </span>
          </h2>

          {sent.length > 0 ? (
            <ul className="flex flex-col">
              {sent.map((invitation) => {
                const state = stateOf(invitation, now);
                const left = invitation.expiresAt
                  ? Math.ceil(
                      (new Date(invitation.expiresAt).getTime() - now) / DAY,
                    )
                  : null;
                const busy = busyId === invitation.id;

                return (
                  <li
                    key={invitation.id}
                    className="flex flex-col gap-2 border-b border-hairline/60 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm">
                          {invitation.email}
                        </p>
                        <p
                          suppressHydrationWarning
                          className="text-xs text-ink-3"
                        >
                          {capitalize(invitation.role)}
                          {invitation.inviterName
                            ? ` · invited by ${invitation.inviterName.split(" ")[0]}, ${shortDate(invitation.createdAt)}`
                            : ` · ${shortDate(invitation.createdAt)}`}
                        </p>
                      </div>

                      {state === "pending" ? (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-hairline px-1.5 py-px text-[11px] text-ink-2">
                          <CircleIcon className="size-3" aria-hidden="true" />
                          Pending
                        </span>
                      ) : state === "expired" ? (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-danger/50 bg-danger-subtle px-1.5 py-px text-[11px] text-danger-text">
                          <CircleDashedIcon
                            className="size-3"
                            aria-hidden="true"
                          />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-hairline px-1.5 py-px text-[11px] text-ink-2">
                          <CheckCircle2Icon
                            className="size-3 text-success-text"
                            aria-hidden="true"
                          />
                          Accepted
                        </span>
                      )}

                      <span
                        suppressHydrationWarning
                        className={cn(
                          "w-32 font-mono text-xs text-ink-3",
                          state === "pending" &&
                            left !== null &&
                            left <= 3 &&
                            "text-warning-text",
                          state === "expired" && "text-danger-text",
                        )}
                      >
                        {state === "accepted"
                          ? `Joined ${shortDate(invitation.createdAt)}`
                          : state === "expired"
                            ? `Expired ${shortDate(invitation.expiresAt!)}`
                            : left === null
                              ? "No expiry"
                              : `Expires in ${left} ${left === 1 ? "day" : "days"}`}
                      </span>

                      {state === "expired" && canResend ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={busy}
                          onClick={() => act(invitation.id, "resend")}
                        >
                          Resend
                        </Button>
                      ) : null}
                    </div>

                    {state === "pending" && (canResend || canCancel) ? (
                      <div className="flex gap-1">
                        {canResend ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => act(invitation.id, "resend")}
                          >
                            Resend
                          </Button>
                        ) : null}
                        {canCancel ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => act(invitation.id, "cancel")}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
              <p className="font-serif-italic text-[2rem] leading-10">
                No invites waiting.
              </p>
              <p className="max-w-[380px] text-[15px] leading-[22px] text-ink-2">
                Invites you send show up here until they&apos;re accepted or
                expire after 7 days.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
