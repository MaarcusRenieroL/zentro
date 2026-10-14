"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { authClient } from "@zentro/auth/client";
import { useDensity } from "@zentro/ui/components/appearance";
import { SegmentedControl } from "@zentro/ui/components/segmented-control";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { TaskKey } from "@zentro/ui/components/task-key";
import { Tile } from "@zentro/ui/components/tile";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import { Field, FieldLabel } from "@zentro/ui/shadcn/field";
import { Input } from "@zentro/ui/shadcn/input";
import { parseDensity } from "@zentro/ui/lib/theme-colors";

function FieldError({ id, children }: { id: string; children?: string }) {
  return children ? (
    <p id={id} role="alert" className="mt-2 text-xs text-danger-text">
      {children}
    </p>
  ) : null;
}

export function ProfileSection({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [value, setValue] = useState(name);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const error =
    touched && value.trim().length < 2
      ? "Use at least two characters so teammates can recognise you."
      : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);

    if (value.trim().length < 2) return;

    setSaving(true);

    const { error: failure } = await authClient.updateUser({
      name: value.trim(),
    });

    setSaving(false);

    if (failure) {
      toastError(failure, "Could not save your name");

      return;
    }

    toastSuccess("Saved", "Your name is updated.");
  };

  return (
    <Tile
      title="Profile"
      description="How you appear to your team."
      className="max-w-xl"
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <Field>
          <FieldLabel htmlFor="profile-name">Name</FieldLabel>
          <Input
            id="profile-name"
            value={value}
            autoComplete="name"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "profile-name-error" : undefined}
            onChange={(event) => setValue(event.target.value)}
            onBlur={() => setTouched(true)}
          />
          <FieldError id="profile-name-error">{error}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-email">Email</FieldLabel>
          <Input id="profile-email" value={email} readOnly disabled />
          <p className="mt-2 text-xs text-ink-3">
            Your email is how you sign in, so it cannot be changed here.
          </p>
        </Field>
        <div>
          <Button
            type="submit"
            loading={saving}
            disabled={value.trim() === name}
          >
            Save changes
          </Button>
        </div>
      </form>
    </Tile>
  );
}

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [density, setDensity] = useDensity();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Tile title="Theme" description="Follows your system unless you choose.">
        <SegmentedControl
          label="Theme"
          value={mounted ? ((theme ?? "system") as string) : "system"}
          onValueChange={setTheme}
          options={[
            {
              value: "light",
              label: (
                <>
                  <SunIcon aria-hidden="true" /> Light
                </>
              ),
            },
            {
              value: "dark",
              label: (
                <>
                  <MoonIcon aria-hidden="true" /> Dark
                </>
              ),
            },
            {
              value: "system",
              label: (
                <>
                  <MonitorIcon aria-hidden="true" /> System
                </>
              ),
            },
          ]}
        />
      </Tile>
      <Tile
        title="Density"
        description="Comfortable is roomy. Compact fits more on the screen."
      >
        <div className="flex flex-col gap-5">
          <SegmentedControl
            label="Density"
            value={density}
            onValueChange={(value) => setDensity(parseDensity(value))}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
          <ul
            aria-label="Preview"
            className="rounded-md border border-hairline"
          >
            {[
              ["in-progress", "ZEN-9", "Write the release notes"],
              ["todo", "ZEN-12", "Review onboarding copy"],
            ].map(([status, key, title]) => (
              <li
                key={key}
                className="flex h-(--row-h) items-center gap-3 border-b border-hairline px-3 last:border-b-0"
              >
                <StatusGlyph status={status!} size={16} />
                <TaskKey>{key}</TaskKey>
                <span className="truncate text-sm text-ink">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      </Tile>
    </div>
  );
}

export function SecuritySection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [touched, setTouched] = useState({ current: false, next: false });
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const currentError =
    touched.current && !current ? "Enter your current password." : undefined;
  const nextError = !touched.next
    ? undefined
    : next.length < 8
      ? "Use at least 8 characters."
      : !/\d/.test(next) || !/[a-z]/.test(next) || !/[A-Z]/.test(next)
        ? "Mix upper and lower case letters with at least one number."
        : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ current: true, next: true });

    if (!current || next.length < 8 || nextError) return;

    setSaving(true);

    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });

    setSaving(false);

    if (error) {
      toastError(
        error,
        "That current password does not match. Check it and try again.",
      );

      return;
    }

    setCurrent("");
    setNext("");
    setTouched({ current: false, next: false });
    toastSuccess("Password changed", "Other devices were signed out.");
  };

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Tile
        title="Password"
        description="Changing it signs you out everywhere else."
      >
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
          <Field>
            <FieldLabel htmlFor="current-password">Current password</FieldLabel>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              aria-invalid={Boolean(currentError)}
              onChange={(event) => setCurrent(event.target.value)}
              onBlur={() =>
                setTouched((state) => ({ ...state, current: true }))
              }
            />
            <FieldError id="current-password-error">{currentError}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={next}
              aria-invalid={Boolean(nextError)}
              onChange={(event) => setNext(event.target.value)}
              onBlur={() => setTouched((state) => ({ ...state, next: true }))}
            />
            <FieldError id="new-password-error">{nextError}</FieldError>
          </Field>
          <div>
            <Button type="submit" loading={saving}>
              Change password
            </Button>
          </div>
        </form>
      </Tile>
      <Tile
        title="Other devices"
        description="Sign out of every session except this one."
      >
        <Button
          variant="outline"
          loading={signingOut}
          onClick={async () => {
            setSigningOut(true);

            const { error } = await authClient.revokeOtherSessions();

            setSigningOut(false);

            if (error) {
              toastError(error, "Could not sign out other devices");

              return;
            }

            toastSuccess("Done", "Every other device is signed out.");
          }}
        >
          Sign out other devices
        </Button>
      </Tile>
    </div>
  );
}
