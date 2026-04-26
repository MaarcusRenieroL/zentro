"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, Globe } from "lucide-react";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Input } from "@zentro/ui/components/shadcn/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@zentro/ui/components/shadcn/field";

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
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Auto-generate slug from name unless user has edited it
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(slugify(name));
    }
  }, [name, slugEdited]);

  // Check slug availability (simulated)
  useEffect(() => {
    if (!slug) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      // Simulate API call to check slug availability
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Simulate: most slugs are available except "acme" and "zentro"
      const reserved = ["acme", "zentro", "admin", "api", "app"];
      setSlugAvailable(!reserved.includes(slug.toLowerCase()));
      setCheckingSlug(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!slugAvailable) return;

    setIsLoading(true);
    // Simulate API call to create organization
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    // Redirect to workspace
    router.push(`/${slug}`);
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
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="pl-9 pr-10"
                />
                {slug && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {checkingSlug ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    ) : slugAvailable ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : slugAvailable === false ? (
                      <span className="text-xs text-destructive">Taken</span>
                    ) : null}
                  </div>
                )}
              </div>
              <FieldDescription>
                <span className="text-muted-foreground">zentro.app/</span>
                <span className="text-foreground">{slug || "your-org"}</span>
              </FieldDescription>
            </Field>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading || !name || !slug || !slugAvailable}
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
          href="/join-organization"
          className="text-primary hover:text-primary/80"
        >
          Join an existing organization
        </a>
      </p>
    </div>
  );
}
