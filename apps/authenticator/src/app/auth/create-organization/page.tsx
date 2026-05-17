"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, Globe } from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@zentro/ui/shadcn/field";
import { LoadingState } from "@zentro/ui/components/loading-state";
import { authClient } from "@zentro/auth/client";
import { toastError, toastSuccess } from "@zentro/ui/lib/toast";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateOrganizationFormValues,
  createOrganizationSchema,
} from "../../lib/zod-schema";
import { getOrgAppUrl } from "@zentro/utils";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [slugEdited, setSlugEdited] = useState(false);
  const [checkedSlug, setCheckedSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const {
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting, isValid },
  } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
    mode: "onChange",
  });

  const name = useWatch({ control, name: "name" }) ?? "";
  const slug = useWatch({ control, name: "slug" }) ?? "";
  const workspaceSlug = slugEdited ? slug : slugify(name);
  const visibleSlugAvailability =
    workspaceSlug && checkedSlug === workspaceSlug ? slugAvailable : null;

  useEffect(() => {
    if (!workspaceSlug) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingSlug(true);

      try {
        const { error } = await authClient.organization.checkSlug({
          slug: workspaceSlug,
        });

        if (cancelled) {
          return;
        }

        setCheckedSlug(workspaceSlug);
        setSlugAvailable(!error);
      } finally {
        if (!cancelled) {
          setCheckingSlug(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [workspaceSlug]);

  const onSubmit = async (formValues: CreateOrganizationFormValues) => {
    if (!visibleSlugAvailability) return;

    const normalizedSlug = slugify(formValues.slug);

    const { data: organization, error } = await authClient.organization.create({
      name: formValues.name,
      slug: normalizedSlug,
    });

    if (error) {
      toastError(error, "Could not create organization");
      return;
    }

    toastSuccess("Success", "Organization created successfully");
    router.replace(
      getOrgAppUrl({
        orgSlug: organization.slug,
        app: "workspace",
        path: "/dashboard",
      }),
    );
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your organization
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up your workspace to start collaborating with your team.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="name">Organization name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Acme Inc."
                    required
                    autoComplete="organization"
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      field.onChange(event);

                      if (!slugEdited) {
                        setValue("slug", slugify(event.target.value), {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                  <FieldDescription>
                    This is how your organization will appear to members.
                  </FieldDescription>

                  {fieldState.error && (
                    <p className="mt-2 text-xs text-red-400">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <Controller
              name="slug"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="slug">Workspace URL</FieldLabel>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="slug"
                      type="text"
                      placeholder="acme"
                      required
                      className="pl-9 pr-10"
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        setSlugEdited(true);
                        field.onChange(slugify(event.target.value));
                      }}
                    />
                    {workspaceSlug && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {checkingSlug ? (
                          <LoadingState
                            label="Checking workspace URL"
                            className="min-h-0"
                            showLabel={false}
                          />
                        ) : visibleSlugAvailability ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : visibleSlugAvailability === false ? (
                          <span className="text-xs text-destructive">
                            Taken
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <FieldDescription>
                    <span className="text-muted-foreground">zentro.app/</span>
                    <span className="text-foreground">
                      {workspaceSlug || "your-org"}
                    </span>
                  </FieldDescription>

                  {fieldState.error && (
                    <p className="mt-2 text-xs text-red-400">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                isSubmitting ||
                checkingSlug ||
                !isValid ||
                visibleSlugAvailability !== true
              }
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating workspace...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create workspace
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </FieldGroup>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Have an invite?{" "}
        <a
          href="/auth/join-organization"
          className="text-primary hover:text-primary/80"
        >
          Join an existing organization
        </a>
      </p>
    </div>
  );
}
