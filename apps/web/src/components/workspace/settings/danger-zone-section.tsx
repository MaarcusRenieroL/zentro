"use client";

import { authClient } from "@zentro/auth/client";
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
import { Button } from "@zentro/ui/components/shadcn/button";
import { Card, CardContent } from "@zentro/ui/components/shadcn/card";
import { Input } from "@zentro/ui/components/shadcn/input";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { AlertTriangleIcon, Building2Icon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";

const confirmationText = "leave organization";

type OrganizationRole = "owner" | "admin" | "member";

type Props = {
  organizationRole: OrganizationRole;
  totalMembers: number;
  organization: {
    id: string;
  };
};

export const DangerZoneSection: FC<Props> = ({
  organizationRole,
  totalMembers,
  organization,
}) => {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState("");

  const router = useRouter();

  const isOwner = organizationRole === "owner";

  const leaveOrganization = async () => {
    const { error } = await authClient.organization.leave({
      organizationId: organization.id,
    });

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastError("Success", "Left the organization sucecssfully");
    router.refresh();
  };

  const deleteOrganization = async () => {
    const { error } = await authClient.organization.delete({
      organizationId: organization.id,
    });

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("Success", "Deleted organization successfully");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {!isOwner ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 py-0 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10">
                <LogOutIcon className="size-5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Leave organization
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  You will lose access to this organization, its members, and
                  its workspace apps. This action cannot be undone by you.
                </p>
                <Button
                  variant="destructive"
                  className="mt-5"
                  onClick={() => setIsLeaveDialogOpen(true)}
                >
                  <LogOutIcon className="size-4" />
                  Leave organization
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {organizationRole === "owner" && (
        <Card className="rounded-md bg-card/50 py-0 opacity-70 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10">
                <Building2Icon className="size-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Delete organization
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Permanently deleting organizations is disabled until ownership
                  and data export flows are implemented.
                </p>
                <Button
                  variant="destructive"
                  className="mt-5"
                  onClick={() => deleteOrganization()}
                >
                  Delete organization
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={isLeaveDialogOpen}
        onOpenChange={(open) => {
          setIsLeaveDialogOpen(open);
          if (!open) {
            setTypedConfirmation("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-left">
              <div className="flex size-9 items-center justify-center rounded-md bg-destructive/10">
                <AlertTriangleIcon className="size-5 text-destructive" />
              </div>
              <AlertDialogTitle>Leave organization?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              You will be removed from this workspace. The other {totalMembers}{" "}
              members will keep access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="mt-4 text-sm text-muted-foreground">
            Type{" "}
            <span className="rounded bg-secondary px-1.5 py-1 font-mono text-xs text-foreground">
              {confirmationText}
            </span>{" "}
            to confirm.
          </p>
          <Input
            value={typedConfirmation}
            onChange={(event) => setTypedConfirmation(event.target.value)}
            placeholder="Type confirmation text"
            className="mt-3"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              disabled={typedConfirmation !== confirmationText}
              onClick={() => leaveOrganization()}
            >
              Leave organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
