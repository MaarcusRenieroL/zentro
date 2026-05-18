"use client";

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
import { Button } from "@zentro/ui/components/shadcn/button";
import { Badge } from "@zentro/ui/components/shadcn/badge";
import { Card, CardContent } from "@zentro/ui/components/shadcn/card";
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
import {
  AlertCircleIcon,
  MoreHorizontalIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react";
import { FC, useMemo, useState } from "react";

type Role = "owner" | "admin" | "member";

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
};

const currentUserId = "1";

const initialMembers: Member[] = [
  {
    id: "1",
    name: "Monkey D. Luffy",
    email: "luffy@strawhats.com",
    role: "owner",
    joinedAt: "Jan 15, 2026",
  },
  {
    id: "2",
    name: "Roronoa Zoro",
    email: "zoro@strawhats.com",
    role: "admin",
    joinedAt: "Jan 18, 2026",
  },
  {
    id: "3",
    name: "Nami",
    email: "nami@strawhats.com",
    role: "member",
    joinedAt: "Feb 2, 2026",
  },
  {
    id: "4",
    name: "Usopp",
    email: "usopp@strawhats.com",
    role: "member",
    joinedAt: "Feb 20, 2026",
  },
];

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

export const MembersSection: FC = () => {
  const [members, setMembers] = useState(initialMembers);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const currentUser = members.find((member) => member.id === currentUserId);
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const canManageMembers = currentUser?.role === "owner";

  const handleRoleChange = (memberId: string, role: Role) => {
    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId ? { ...member, role } : member,
      ),
    );
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;

    setMembers((currentMembers) =>
      currentMembers.filter((member) => member.id !== memberToRemove.id),
    );

    setMemberToRemove(null);
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
          const isCurrentUser = member.id === currentUserId;

          return (
            <div className="flex min-w-[280px] items-center gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="text-xs font-medium">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {member.name}
                  </p>

                  {isCurrentUser ? (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      You
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {member.email}
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
          const isCurrentUser = member.id === currentUserId;

          return (
            <RoleControl
              disabled={!canManageMembers}
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
            {row.original.joinedAt}
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
          const isCurrentUser = member.id === currentUserId;

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
                <DropdownMenuTrigger asChild disabled={!canManageMembers}>
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
    [canManageMembers],
  );

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={members}
        emptyMessage="No members found."
        filterPlaceholder="Search members..."
        getRowId={(member) => member.id}
        initialPageSize={5}
        showRowSelection
      />

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
              {memberToRemove?.name} will lose access to this organization and
              its workspace apps.
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
