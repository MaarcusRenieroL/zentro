"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { LaptopIcon, LockIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { authClient } from "@zentro/auth/client";
import { useDensity } from "@zentro/ui/components/appearance";
import { StatusGlyph } from "@zentro/ui/components/status-glyph";
import { TaskKey } from "@zentro/ui/components/task-key";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import { parseDensity, type Density } from "@zentro/ui/lib/theme-colors";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import {
  SettingsError,
  SettingsFooter,
  SettingsHeader,
  SettingsRow,
  SettingsTile,
} from "./settings-kit";

export function ProfileSection({
  name,
  email,
  organizationName,
}: {
  name: string;
  email: string;
  organizationName: string;
}) {
  const [saved, setSaved] = useState(name);
  const [value, setValue] = useState(name);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const invalid = value.trim().length < 2;
  const error =
    touched && invalid
      ? "Add your name. Teammates see it on tasks, comments and mentions."
      : undefined;
  const dirty = value.trim() !== saved;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);

    if (invalid) return;

    setSaving(true);

    const { error: failure } = await authClient.updateUser({
      name: value.trim(),
    });

    setSaving(false);

    if (failure) {
      toastError(failure, "Could not save your name");

      return;
    }

    setSaved(value.trim());
    toastSuccess("Saved", "Your name is updated.");
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <SettingsHeader
        eyebrow="ACCOUNT"
        title="Profile"
        description={`How you appear to people in ${organizationName}.`}
      />
      <SettingsTile>
        <SettingsRow label="Full name" htmlFor="profile-name">
          <Input
            id="profile-name"
            value={value}
            autoComplete="name"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? "profile-name-error" : undefined}
            onChange={(event) => setValue(event.target.value)}
            onBlur={() => setTouched(true)}
          />
          <SettingsError id="profile-name-error">{error}</SettingsError>
        </SettingsRow>
        <SettingsRow label="Email" htmlFor="profile-email">
          <div className="relative">
            <Input
              id="profile-email"
              value={email}
              readOnly
              aria-describedby="profile-email-hint"
              className="bg-hover pr-9 font-mono text-sm"
            />
            <LockIcon
              className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-ink-3"
              aria-hidden="true"
            />
          </div>
          <p
            id="profile-email-hint"
            className="text-[13px] leading-5 text-ink-3"
          >
            Your email is how you sign in, so it can’t be changed here.
          </p>
        </SettingsRow>
        <SettingsFooter
          dirty={dirty}
          changes={dirty ? 1 : 0}
          errors={touched && invalid ? 1 : 0}
          saving={saving}
          onDiscard={() => {
            setValue(saved);
            setTouched(false);
          }}
        />
      </SettingsTile>
    </form>
  );
}

type ThemeChoice = "light" | "dark" | "system";

/**
 * A 96px miniature of the app in the theme it names. Each pane wears the
 * `.light` or `.dark` token scope, so it shows that theme whatever is active.
 */
function ThemePreview({ mode }: { mode: ThemeChoice }) {
  const pane = (dark: boolean) => (
    <div
      className={cn(
        dark ? "dark" : "light",
        "flex h-full flex-1 flex-col gap-1.5 bg-canvas p-2",
      )}
    >
      <span className="h-1.5 w-8 rounded-full bg-ink" />
      {[0, 1, 2].map((row) => (
        <span
          key={row}
          className="flex h-3.5 items-center gap-1 rounded bg-surface px-1"
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              row === 0 ? "bg-signal" : "bg-status-todo",
            )}
          />
          <span className="h-1 flex-1 rounded-full bg-hairline" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className="flex h-24 overflow-hidden rounded-lg border border-hairline"
    >
      {mode === "system" ? (
        <>
          {pane(false)}
          {pane(true)}
        </>
      ) : (
        pane(mode === "dark")
      )}
    </div>
  );
}

function ChoiceCard({
  selected,
  label,
  description,
  onSelect,
  children,
}: {
  selected: boolean;
  label: string;
  description?: string;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border bg-surface p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-[1.5px] border-signal ring-4 ring-signal/20"
          : "border-hairline hover:border-line-strong",
      )}
    >
      {children}
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 rounded-full border",
            selected ? "border-[5px] border-signal" : "border-line-strong",
          )}
        />
        <span className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>
          {description ? (
            <span className="text-xs text-ink-3">{description}</span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function DensityPreview({ density }: { density: Density }) {
  const rows = density === "comfortable" ? 3 : 5;
  const height = density === "comfortable" ? "h-[30px]" : "h-5";

  return (
    <div
      aria-hidden="true"
      className="flex h-24 flex-col overflow-hidden rounded-lg border border-hairline bg-canvas"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "flex shrink-0 items-center gap-1.5 border-b border-hairline px-2 last:border-b-0",
            height,
          )}
        >
          <span className="size-2 rounded-full bg-status-todo" />
          <span className="h-1 flex-1 rounded-full bg-line-strong/60" />
        </span>
      ))}
    </div>
  );
}

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [density, setDensity] = useDensity();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentTheme = (
    mounted ? (theme ?? "system") : "system"
  ) as ThemeChoice;

  return (
    <div className="flex flex-col gap-6">
      <SettingsHeader
        eyebrow="ACCOUNT"
        title="Appearance"
        description="Changes apply right away. There’s nothing to save."
      />

      <SettingsTile>
        <SettingsRow
          label="Theme"
          description="Follows your system unless you choose."
        >
          <div
            role="radiogroup"
            aria-label="Theme"
            className="grid gap-3 sm:grid-cols-3"
          >
            {(
              [
                ["light", "Light"],
                ["dark", "Dark"],
                ["system", "Match system"],
              ] as const
            ).map(([value, label]) => (
              <ChoiceCard
                key={value}
                label={label}
                selected={currentTheme === value}
                onSelect={() => setTheme(value)}
              >
                <ThemePreview mode={value} />
              </ChoiceCard>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label="Density" description="Changes row height only.">
          <div
            role="radiogroup"
            aria-label="Density"
            className="grid gap-3 sm:grid-cols-2"
          >
            {(
              [
                ["comfortable", "Comfortable", "Roomy rows, 44px and up"],
                ["compact", "Compact", "Fits more on screen, 32px rows"],
              ] as const
            ).map(([value, label, hint]) => (
              <ChoiceCard
                key={value}
                label={label}
                description={hint}
                selected={density === value}
                onSelect={() => setDensity(parseDensity(value))}
              >
                <DensityPreview density={value} />
              </ChoiceCard>
            ))}
          </div>
        </SettingsRow>
      </SettingsTile>

      <section aria-label="Preview" className="flex flex-col gap-2">
        <p className="eyebrow">Preview</p>
        <div className="tile overflow-hidden">
          <p className="flex items-center gap-2 px-4 pt-3 pb-1 text-sm font-medium">
            <StatusGlyph status="in-progress" size={14} decorative />
            In progress
            <span className="font-mono text-xs text-ink-3">2</span>
          </p>
          <ul>
            {[
              [
                "in-progress",
                "ZEN-18",
                "Fix login redirect loop on expired sessions",
              ],
              ["in-progress", "ZEN-22", "Retry failed webhook deliveries"],
            ].map(([status, key, title]) => (
              <li
                key={key}
                className="flex h-(--row-h) items-center gap-3 border-t border-hairline/60 px-4"
              >
                <StatusGlyph status={status!} size={16} />
                <TaskKey>{key}</TaskKey>
                <span className="truncate text-sm text-ink">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

type SessionRow = {
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  updatedAt: Date | string;
};

function describeDevice(userAgent?: string | null) {
  const ua = userAgent ?? "";
  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /chrome\//i.test(ua)
      ? "Chrome"
      : /firefox\//i.test(ua)
        ? "Firefox"
        : /safari\//i.test(ua)
          ? "Safari"
          : "Browser";
  const os = /iphone/i.test(ua)
    ? "iPhone"
    : /ipad/i.test(ua)
      ? "iPad"
      : /android/i.test(ua)
        ? "Android"
        : /mac os x/i.test(ua)
          ? "macOS"
          : /windows/i.test(ua)
            ? "Windows"
            : /linux/i.test(ua)
              ? "Linux"
              : "Unknown device";
  const Icon = /iphone|android/i.test(ua)
    ? SmartphoneIcon
    : /ipad/i.test(ua)
      ? TabletIcon
      : LaptopIcon;

  return { name: `${browser} on ${os}`, Icon };
}

function lastActive(value: Date | string) {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 60000),
  );

  if (minutes < 2) return "Active now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;

  return `${Math.floor(minutes / (60 * 24))}d ago`;
}

export function SecuritySection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const currentError =
    touched.current && !current ? "Enter your current password." : undefined;
  const nextError = !touched.next
    ? undefined
    : next.length < 8
      ? "Use at least 8 characters."
      : !/\d/.test(next) || !/[a-z]/.test(next) || !/[A-Z]/.test(next)
        ? "Mix upper and lower case letters with at least one number."
        : undefined;
  const confirmError =
    touched.confirm && confirm !== next
      ? "These passwords don’t match. Check both and try again."
      : undefined;

  const loadSessions = useCallback(async () => {
    const [list, active] = await Promise.all([
      authClient.listSessions(),
      authClient.getSession(),
    ]);

    setSessions((list.data as SessionRow[] | null) ?? []);
    setCurrentToken(active.data?.session.token ?? null);
  }, []);

  useEffect(() => {
    void loadSessions().catch(() => setSessions([]));
  }, [loadSessions]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ current: true, next: true, confirm: true });

    if (!current || next.length < 8 || nextError || confirm !== next) return;

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
    setConfirm("");
    setTouched({ current: false, next: false, confirm: false });
    toastSuccess("Password changed", "Other devices were signed out.");
    void loadSessions();
  };

  const revoke = async (token: string) => {
    setRevoking(token);

    const { error } = await authClient.revokeSession({ token });

    setRevoking(null);

    if (error) {
      toastError(error, "Could not sign out that device");
      return;
    }

    toastSuccess("Signed out", "That device no longer has access.");
    await loadSessions();
  };

  const others = (sessions ?? []).filter(
    (session) => session.token !== currentToken,
  );

  return (
    <div className="flex flex-col gap-6">
      <SettingsHeader
        eyebrow="SECURITY"
        title="Password & sessions"
        description="Change your password and see where you’re signed in."
      />

      <form onSubmit={submit} noValidate>
        <SettingsTile>
          <SettingsRow label="Current password" htmlFor="current-password">
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              aria-invalid={Boolean(currentError) || undefined}
              aria-describedby={
                currentError ? "current-password-error" : undefined
              }
              onChange={(event) => setCurrent(event.target.value)}
              onBlur={() =>
                setTouched((state) => ({ ...state, current: true }))
              }
            />
            <SettingsError id="current-password-error">
              {currentError}
            </SettingsError>
          </SettingsRow>
          <SettingsRow label="New password" htmlFor="new-password">
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={next}
              aria-invalid={Boolean(nextError) || undefined}
              aria-describedby={nextError ? "new-password-error" : undefined}
              onChange={(event) => setNext(event.target.value)}
              onBlur={() => setTouched((state) => ({ ...state, next: true }))}
            />
            <SettingsError id="new-password-error">{nextError}</SettingsError>
          </SettingsRow>
          <SettingsRow label="Confirm password" htmlFor="confirm-password">
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              aria-invalid={Boolean(confirmError) || undefined}
              aria-describedby={
                confirmError ? "confirm-password-error" : undefined
              }
              onChange={(event) => setConfirm(event.target.value)}
              onBlur={() =>
                setTouched((state) => ({ ...state, confirm: true }))
              }
            />
            <SettingsError id="confirm-password-error">
              {confirmError}
            </SettingsError>
          </SettingsRow>
          <div className="flex items-center gap-3 bg-sunken/50 px-[22px] py-3.5">
            <p className="text-[13px] text-ink-3">
              Changing it signs you out everywhere else.
            </p>
            <span className="flex-1" />
            <Button
              type="submit"
              variant="outline"
              loading={saving}
              disabled={!current || !next || !confirm}
            >
              Update password
            </Button>
          </div>
        </SettingsTile>
      </form>

      <SettingsTile>
        <SettingsRow
          label="Two-factor authentication"
          description="An extra step when you sign in."
        >
          <p className="flex items-center gap-2 text-sm">
            <span className="rounded-full border border-dashed border-ink-3 px-2.5 py-px font-mono text-[11px] text-ink-2">
              Coming
            </span>
            <span className="text-ink-2">
              Authenticator-app codes are on the way. Your password is the only
              factor for now.
            </span>
          </p>
        </SettingsRow>
      </SettingsTile>

      <section className="flex flex-col gap-2" aria-labelledby="sessions-title">
        <div className="flex items-center gap-3">
          <h3 id="sessions-title" className="text-sm font-semibold">
            Active sessions
          </h3>
          <span className="flex-1" />
          {others.length > 0 ? (
            <button
              type="button"
              onClick={async () => {
                const { error } = await authClient.revokeOtherSessions();

                if (error) {
                  toastError(error, "Could not sign out other devices");
                  return;
                }

                toastSuccess("Done", "Every other device is signed out.");
                await loadSessions();
              }}
              className="rounded-xs text-[13px] text-signal underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Sign out of all other sessions
            </button>
          ) : null}
        </div>
        <SettingsTile>
          {sessions === null ? (
            <div className="flex flex-col gap-3 px-[22px] py-[18px]">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-[22px] py-[18px] text-sm text-ink-2">
              No sessions to show.
            </p>
          ) : (
            sessions.map((session) => {
              const { name, Icon } = describeDevice(session.userAgent);
              const here = session.token === currentToken;

              return (
                <div
                  key={session.token}
                  className="flex items-center gap-3 px-[22px] py-3.5"
                >
                  <Icon
                    className="size-[18px] shrink-0 text-ink-3"
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{name}</span>
                      {here ? (
                        <span className="rounded-full border border-hairline px-2 py-px text-[11px] font-normal text-ink-2">
                          This device
                        </span>
                      ) : null}
                    </span>
                    <span className="truncate font-mono text-xs text-ink-3">
                      {session.ipAddress || "Unknown IP"} ·{" "}
                      {lastActive(session.updatedAt)}
                    </span>
                  </div>
                  {here ? null : (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={revoking === session.token}
                      onClick={() => revoke(session.token)}
                    >
                      Sign out
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </SettingsTile>
      </section>
    </div>
  );
}
