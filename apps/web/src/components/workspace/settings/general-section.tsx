"use client";

import { Button } from "@zentro/ui/components/shadcn/button";
import { Card, CardContent } from "@zentro/ui/components/shadcn/card";
import { Input } from "@zentro/ui/components/shadcn/input";
import { Label } from "@zentro/ui/components/shadcn/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, RotateCcwIcon } from "lucide-react";
import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  GeneralSectionFormValues,
  generalSectionSchema,
} from "~/src/lib/zod-schema";
import { authClient } from "@zentro/auth/client";
import { toastError, toastSuccess } from "@zentro/ui/index";

type Props = {
  organization: {
    name: string;
    slug: string;
    id: string;
  };
};

export const GeneralSection: FC<Props> = ({ organization }) => {
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<GeneralSectionFormValues>({
    resolver: zodResolver(generalSectionSchema),
    defaultValues: {
      name: organization.name,
    },
    mode: "onChange",
  });

  const handleCancel = () => {
    reset({
      name: organization.name,
    });

    setSaveState("idle");
  };

  const handleSave = async (values: GeneralSectionFormValues) => {
    const { error } = await authClient.organization.update({
      data: {
        name: values.name,
      },
      organizationId: organization.id,
    });

    if (error) {
      toastError(error.statusText, error.message);
      setSaveState("idle");

      return;
    }

    toastSuccess("Success", "Organization Name updated successfully");
    reset(values);

    setSaveState("saved");

    window.setTimeout(() => {
      setSaveState("idle");
    }, 2500);
  };

  return (
    <form className="space-y-6 pb-24" onSubmit={handleSubmit(handleSave)}>
      {saveState === "saved" ? (
        <div className="flex items-center gap-3 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-foreground">
          <CheckCircle2Icon className="size-4 text-green-500" />
          Organization settings saved.
        </div>
      ) : null}

      <Card className="rounded-md bg-card/50 py-0 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Organization name
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This name appears across Zentro.
              </p>
            </div>
            <div className="max-w-xl space-y-2">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <>
                    <Label htmlFor="organization-name">Name</Label>
                    <Input
                      id="organization-name"
                      autoComplete="organization"
                      aria-invalid={Boolean(errors.name)}
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        field.onChange(event);
                        setSaveState("idle");
                      }}
                    />
                  </>
                )}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This is your organization&apos;s public name.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md bg-card/50 py-0 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Workspace URL
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your workspace address.
              </p>
            </div>
            <div className="max-w-xl space-y-2">
              <Label htmlFor="organization-slug">Slug</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-sm text-muted-foreground">
                  zentro.app/
                </span>
                <Input
                  id="organization-slug"
                  value={organization.slug}
                  disabled
                  className="sm:max-w-sm"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Read-only for now. Contact support to change your workspace URL.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isDirty ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes.
            </p>
            <div className="grid gap-2 sm:flex">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleCancel}
              >
                <RotateCcwIcon className="size-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isSubmitting || !isValid}
              >
                <CheckCircle2Icon className="size-4" />
                Save changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
};
