"use client";

import { useRouter } from "next/navigation";
import { FC, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { authClient } from "@zentro/auth/client";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zentro/ui/shadcn/dialog";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";

import { trpcResult } from "~/src/lib/trpc-result";

import { SettingsHeader, SettingsRow, SettingsTile } from "./settings-kit";

type OrganizationRole = "owner" | "admin" | "member";

type Props = {
  organizationRole: OrganizationRole;
  totalMembers: number;
  organization: { id: string; name: string };
  /** Admins the owner could hand the organization to. */
  admins: Array<{ id: string; name: string }>;
  counts: { projects: number; tasks: number; docs: number };
};

export const DangerZoneSection: FC<Props> = ({
  organizationRole,
  totalMembers,
  organization,
  admins,
  counts,
}) => {
  const router = useRouter();
  const trpc = useTrpcClient();
  const isOwner = organizationRole === "owner";

  const [transferTo, setTransferTo] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [working, setWorking] = useState(false);

  // The exact name, case-sensitive. Only a match unlocks the button.
  const matches = typed === organization.name;
  const leaveMatches = typed === organization.name;

  const transfer = async () => {
    setTransferring(true);

    const { error } = await trpcResult(
      trpc.member.transferOwnership.mutate({ memberId: transferTo }),
    );

    setTransferring(false);

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("Ownership transferred", "You are now an admin.");
    router.refresh();
  };

  const deleteOrganization = async () => {
    setWorking(true);

    const { error } = await trpcResult(trpc.organization.delete.mutate());

    if (error) {
      setWorking(false);
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("Organization deleted", "Everyone’s access has ended.");
    router.replace("/");
    router.refresh();
  };

  const leave = async () => {
    setWorking(true);

    const { error } = await authClient.organization.leave({
      organizationId: organization.id,
    });

    if (error) {
      setWorking(false);
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("You left the organization");
    router.replace("/");
    router.refresh();
  };

  const closeDialogs = () => {
    setDeleteOpen(false);
    setLeaveOpen(false);
    setTyped("");
    setWorking(false);
  };

  const stats = [
    [totalMembers, "people"],
    [counts.projects, "projects"],
    [counts.tasks, "tasks"],
    [counts.docs, "docs"],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <SettingsHeader
        tone="danger"
        eyebrow="DANGER ZONE"
        title="Delete or transfer"
        description={
          isOwner
            ? "These actions affect everyone in the organization."
            : "You can leave this organization. An owner can change anything else."
        }
      />

      <SettingsTile tone="danger">
        {isOwner ? (
          <>
            <SettingsRow
              label="Transfer ownership"
              description="Make an admin the owner. You become an admin."
            >
              {admins.length === 0 ? (
                <p className="text-sm text-ink-2">
                  Promote someone to admin first, then you can hand over
                  ownership.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Select value={transferTo} onValueChange={setTransferTo}>
                    <SelectTrigger
                      aria-label="New owner"
                      className="w-full sm:w-64"
                    >
                      <SelectValue placeholder="Choose an admin" />
                    </SelectTrigger>
                    <SelectContent>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    loading={transferring}
                    disabled={!transferTo}
                    onClick={transfer}
                  >
                    Transfer
                  </Button>
                </div>
              )}
            </SettingsRow>
            <SettingsRow
              label="Export data"
              description="A ZIP of everything, by email."
            >
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <span className="rounded-full border border-dashed border-ink-3 px-2.5 py-px font-mono text-[11px]">
                  Coming
                </span>
                Exports aren’t available yet.
              </p>
            </SettingsRow>
            <SettingsRow
              label="Delete organization"
              description="Everyone loses access right away."
            >
              <div>
                <Button
                  variant="outline"
                  className="border-danger/50 text-danger-text hover:bg-danger-subtle"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete organization
                </Button>
              </div>
            </SettingsRow>
          </>
        ) : (
          <SettingsRow
            label="Leave organization"
            description="You lose access to its projects, tasks and docs."
          >
            <div>
              <Button
                variant="outline"
                className="border-danger/50 text-danger-text hover:bg-danger-subtle"
                onClick={() => setLeaveOpen(true)}
              >
                Leave organization
              </Button>
            </div>
          </SettingsRow>
        )}
      </SettingsTile>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => (open ? setDeleteOpen(true) : closeDialogs())}
      >
        <DialogContent className="max-w-[520px] rounded-[20px]">
          <DialogHeader>
            <DialogTitle>Delete {organization.name}?</DialogTitle>
            <DialogDescription>
              Everyone loses access right away. We keep a backup for 7 days, so
              you can ask support to restore it until then.
            </DialogDescription>
          </DialogHeader>

          <dl className="grid grid-cols-4 divide-x divide-hairline rounded-xl border border-hairline">
            {stats.map(([value, label]) => (
              <div
                key={label}
                className="flex flex-col items-center gap-0.5 py-3"
              >
                <dt className="sr-only">{label}</dt>
                <dd className="font-mono text-lg">{value}</dd>
                <span aria-hidden="true" className="text-xs text-ink-3">
                  {label}
                </span>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="delete-confirm" className="text-sm">
              Type{" "}
              <span className="rounded-xs bg-sunken px-1.5 py-0.5 font-mono text-xs">
                {organization.name}
              </span>{" "}
              to confirm.
            </label>
            <Input
              id="delete-confirm"
              value={typed}
              autoComplete="off"
              onChange={(event) => setTyped(event.target.value)}
              placeholder={organization.name}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button
              loading={working}
              disabled={!matches}
              onClick={deleteOrganization}
              className={cn(
                matches
                  ? "bg-danger text-on-danger hover:bg-danger/90"
                  : "border border-line-strong bg-transparent text-ink-3",
              )}
            >
              Delete organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={leaveOpen}
        onOpenChange={(open) => (open ? setLeaveOpen(true) : closeDialogs())}
      >
        <DialogContent className="max-w-[520px] rounded-[20px]">
          <DialogHeader>
            <DialogTitle>Leave {organization.name}?</DialogTitle>
            <DialogDescription>
              You’ll be removed from this workspace. The other{" "}
              {Math.max(totalMembers - 1, 0)} people keep access.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="leave-confirm" className="text-sm">
              Type{" "}
              <span className="rounded-xs bg-sunken px-1.5 py-0.5 font-mono text-xs">
                {organization.name}
              </span>{" "}
              to confirm.
            </label>
            <Input
              id="leave-confirm"
              value={typed}
              autoComplete="off"
              onChange={(event) => setTyped(event.target.value)}
              placeholder={organization.name}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button
              loading={working}
              disabled={!leaveMatches}
              onClick={leave}
              className={cn(
                leaveMatches
                  ? "bg-danger text-on-danger hover:bg-danger/90"
                  : "border border-line-strong bg-transparent text-ink-3",
              )}
            >
              Leave organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
