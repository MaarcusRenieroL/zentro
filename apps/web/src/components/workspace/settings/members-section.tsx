"use client";

import { useTrpcClient } from "@zentro/api/react";
import { type DataTableColumnDef } from "@zentro/ui/components/data-table";
import { DataTable } from "@zentro/ui/components/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@zentro/ui/components/shadcn/alert-dialog";
import { Avatar, AvatarFallback } from "@zentro/ui/components/shadcn/avatar";
import { Badge } from "@zentro/ui/components/shadcn/badge";
import { Button } from "@zentro/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zentro/ui/components/shadcn/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/components/shadcn/select";
import { toastError, toastSuccess } from "@zentro/ui/index";
import {
  AlertCircleIcon,
  MoreHorizontalIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { trpcResult } from "~/src/lib/trpc-result";
import { FC, useCallback, useMemo, useState } from "react";
import { formatRelativeDate } from "~/src/lib/helpers";
import { Member } from "~/src/lib/types";

type Role = "owner" | "admin" | "member";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatRole(role: Role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

type RoleControlProps = {
  disabled: boolean;
  isCurrentUser: boolean;
  member: Member;
  onRoleChange: (memberId: string, role: Role) => void;
};

const RoleControl: FC<RoleControlProps> = ({
  disabled,
  isCurrentUser,
  member,
  onRoleChange,
}) => {
  if (isCurrentUser) {
    return (
      <Badge variant="secondary" className="inline-flex items-center gap-1">
        <ShieldIcon className="size-3" />
        {formatRole(member.role)}
      </Badge>
    );
  }

  return (
    <Select
      value={member.role}
      disabled={disabled}
      onValueChange={(value) => onRoleChange(member.id, value as Role)}
    >
      <SelectTrigger size="sm" className="h-8 w-32">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="owner">Owner</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="member">Member</SelectItem>
      </SelectContent>
    </Select>
  );
};

type Props = {
  members: Member[];
  userId: string;
  orgId: string;
  permissions: {
    canRemoveMembers: boolean;
    canUpdateMemberRoles: boolean;
  };
};

export const MembersSection: FC<Props> = ({
  members: initialMembers,
  userId,
  orgId,
  permissions,
}) => {
  const [members, setMembers] = useState(initialMembers);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const router = useRouter();
  const trpc = useTrpcClient();

  const currentUser = members.find((member) => member.userId === userId);
  const ownerCount = members.filter((member) => member.role === "owner").length;

  const handleRoleChange = useCallback(
    async (memberId: string, role: Role) => {
      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === memberId ? { ...member, role } : member,
        ),
      );

      const { error } = await trpcResult(
        trpc.member.updateRole.mutate({
          memberId,
          role: role === "owner" ? "admin" : role,
        }),
      );

      if (error) {
        toastError(error.statusText, error.message);
        return;
      }

      toastSuccess("Success", "User role updated successfully");
      router.refresh();
    },
    [router, trpc],
  );

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    const { error } = await trpcResult(
      trpc.member.remove.mutate({ memberId: memberToRemove.id }),
    );

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("Success", "User removed from organization successfully");
    router.refresh();
  };

  const columns = useMemo<DataTableColumnDef<Member>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Member",
        meta: {
          label: "Member",
        },
        cell: ({ row }) => {
          const member = row.original;
          const isCurrentUser = member.userId === userId;

          return (
            <div className="flex min-w-56 items-center gap-3 sm:min-w-70">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="text-xs font-medium">
                  {getInitials(member.user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {member.user.name}
                  </p>

                  {isCurrentUser ? (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      You
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        meta: {
          label: "Role",
          className: "w-40",
        },
        cell: ({ row }) => {
          const member = row.original;
          const isCurrentUser = member.userId === userId;

          return (
            <RoleControl
              disabled={!permissions.canUpdateMemberRoles}
              isCurrentUser={isCurrentUser}
              member={member}
              onRoleChange={handleRoleChange}
            />
          );
        },
      },
      {
        accessorKey: "joinedAt",
        header: "Joined",
        meta: {
          label: "Joined",
          className: "text-muted-foreground",
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        meta: {
          label: "Actions",
          className: "w-16 text-right",
        },
        cell: ({ row }) => {
          const member = row.original;
          const isCurrentUser = member.userId === userId;

          if (isCurrentUser) {
            return (
              <span className="text-xs text-muted-foreground">
                Current user
              </span>
            );
          }

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  disabled={!permissions.canRemoveMembers}
                >
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontalIcon className="size-4" />
                    <span className="sr-only">Open member actions</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    variant="destructive"
                    className="gap-2"
                    onClick={() => setMemberToRemove(member)}
                  >
                    <Trash2Icon className="size-4" />
                    Remove member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      handleRoleChange,
      permissions.canRemoveMembers,
      permissions.canUpdateMemberRoles,
      userId,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="-mx-4 sm:mx-0">
        <DataTable
          columns={columns}
          data={members}
          emptyMessage="No members found."
          filterPlaceholder="Search members..."
          getRowId={(member) => member.id}
          initialPageSize={5}
          showRowSelection
        />
      </div>

      {ownerCount === 1 && currentUser?.role === "owner" ? (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-yellow-500" />

          <div>
            <p className="text-sm font-medium text-foreground">
              You&apos;re the only owner
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Promote another member to owner before removing yourself or
              leaving the organization.
            </p>
          </div>
        </div>
      ) : null}

      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>

            <AlertDialogDescription>
              {memberToRemove?.user.name} will lose access to this organization
              and its workspace apps.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMember}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
