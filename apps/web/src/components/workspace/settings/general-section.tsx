"use client";

import { Button } from "@zentro/ui/components/shadcn/button";
import { Card, CardContent } from "@zentro/ui/components/shadcn/card";
import { Input } from "@zentro/ui/components/shadcn/input";
import { Label } from "@zentro/ui/components/shadcn/label";
import {
  CheckCircle2Icon,
  RotateCcwIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { ChangeEvent, FC, useMemo, useState } from "react";

type Props = {
  organization: {
    name: string;
    slug: string;
    logo?: string | null;
  };
};

export const GeneralSection: FC<Props> = ({ organization }) => {
  const [name, setName] = useState(organization.name);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    organization.logo ?? null,
  );
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const hasChanges = useMemo(
    () =>
      name !== organization.name || logoPreview !== (organization.logo ?? null),
    [logoPreview, name, organization.logo, organization.name],
  );

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
      setSaveState("idle");
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setName(organization.name);
    setLogoPreview(organization.logo ?? null);
    setSaveState("idle");
  };

  const handleSave = () => {
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 2500);
  };

  return (
    <div className="space-y-6 pb-24">
      {saveState === "saved" ? (
        <div className="flex items-center gap-3 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-foreground">
          <CheckCircle2Icon className="size-4 text-green-500" />
          Organization settings saved.
        </div>
      ) : null}

      <Card className="rounded-md bg-card/50 py-0 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Organization name
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This name appears across Zentro.
              </p>
            </div>
            <div className="max-w-xl space-y-2">
              <Label htmlFor="organization-name">Name</Label>
              <Input
                id="organization-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setSaveState("idle");
                }}
              />
              <p className="text-sm text-muted-foreground">
                This is your organization&apos;s public name.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md bg-card/50 py-0 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
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

      <Card className="rounded-md bg-card/50 py-0 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Organization logo
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Used in switchers and workspace headers.
              </p>
            </div>
            <div>
              {logoPreview ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div
                    aria-label="Organization logo preview"
                    className="size-24 rounded-md border bg-cover bg-center"
                    role="img"
                    style={{ backgroundImage: `url(${logoPreview})` }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild>
                      <label
                        htmlFor="organization-logo"
                        className="cursor-pointer"
                      >
                        <UploadIcon className="size-4" />
                        Change logo
                      </label>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setLogoPreview(null);
                        setSaveState("idle");
                      }}
                    >
                      <Trash2Icon className="size-4" />
                      Delete logo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed bg-background/40 p-8 text-center">
                  <UploadIcon className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-4 text-sm font-medium text-foreground">
                    Upload a logo
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    PNG, JPG, or GIF. Max 2MB.
                  </p>
                  <Button variant="outline" className="mt-5" asChild>
                    <label
                      htmlFor="organization-logo"
                      className="cursor-pointer"
                    >
                      Choose file
                    </label>
                  </Button>
                </div>
              )}
              <input
                id="organization-logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChanges ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <RotateCcwIcon className="size-4" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <CheckCircle2Icon className="size-4" />
                Save changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
