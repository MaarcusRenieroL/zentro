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
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [checkedSlug, setCheckedSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const workspaceSlug = slugEdited ? slug : slugify(name);
  const visibleSlugAvailability =
    workspaceSlug && checkedSlug === workspaceSlug ? slugAvailable : null;

  // Check slug availability (simulated)
  useEffect(() => {
    if (!workspaceSlug) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      // Simulate API call to check slug availability
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (cancelled) {
        return;
      }
      // Simulate: most slugs are available except "acme" and "zentro"
      const reserved = ["acme", "zentro", "admin", "api", "app"];
      setCheckedSlug(workspaceSlug);
      setSlugAvailable(!reserved.includes(workspaceSlug.toLowerCase()));
      setCheckingSlug(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [workspaceSlug]);

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!visibleSlugAvailability) return;

    setIsLoading(true);
    // Simulate API call to create organization
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    // Redirect to workspace
    router.push(`/${workspaceSlug}`);
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
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Organization name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Acme Inc."
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="organization"
              />
              <FieldDescription>
                This is how your organization will appear to members.
              </FieldDescription>
            </Field>

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
                  value={workspaceSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="pl-9 pr-10"
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
                      <span className="text-xs text-destructive">Taken</span>
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
            </Field>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                isLoading || !name || !workspaceSlug || !visibleSlugAvailability
              }
            >
              {isLoading ? (
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
