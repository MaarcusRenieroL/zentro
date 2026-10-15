import type { ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";

/** The top of a settings page: mono eyebrow, 22/600 title, one sentence. */
export function SettingsHeader({
  eyebrow,
  title,
  description,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <header className="flex flex-col gap-1.5">
      <span className={cn("eyebrow", tone === "danger" && "text-danger-text")}>
        {eyebrow}
      </span>
      <h2 className="text-[22px] leading-7 font-semibold">{title}</h2>
      {description ? (
        <p className="max-w-[620px] text-[15px] leading-[22px] text-ink-2">
          {description}
        </p>
      ) : null}
    </header>
  );
}

/** A tile of form rows separated by hairlines. */
export function SettingsTile({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={cn(
        "tile divide-y divide-hairline/70 overflow-hidden",
        tone === "danger" && "border-danger/40",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** One row: the label and its hint on the left, the control on the right. */
export function SettingsRow({
  label,
  description,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  description?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2 px-[22px] py-[18px] sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </label>
        ) : (
          <span className="text-sm font-medium">{label}</span>
        )}
        {description ? (
          <span className="text-[13px] leading-5 text-ink-3">
            {description}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">{children}</div>
    </div>
  );
}

export function SettingsError({
  id,
  children,
}: {
  id?: string;
  children?: string;
}) {
  return children ? (
    <p id={id} role="alert" className="text-[13px] leading-5 text-danger-text">
      {children}
    </p>
  ) : null;
}

/** "N unsaved changes", Discard, and the one violet Save. */
export function SettingsFooter({
  dirty,
  changes,
  errors = 0,
  saving,
  onDiscard,
  saveLabel = "Save changes",
}: {
  dirty: boolean;
  changes: number;
  errors?: number;
  saving?: boolean;
  onDiscard: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-sunken/50 px-[22px] py-3.5">
      <p
        className={cn(
          "text-[13px]",
          errors > 0 ? "text-danger-text" : "text-ink-3",
        )}
        aria-live="polite"
      >
        {errors > 0
          ? `Fix ${errors} field${errors === 1 ? "" : "s"} to save`
          : dirty
            ? `${changes} unsaved change${changes === 1 ? "" : "s"}`
            : "No changes yet"}
      </p>
      <span className="flex-1" />
      {dirty ? (
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex h-(--control-h) items-center rounded-full px-4 text-sm text-ink-2 outline-none hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          Discard
        </button>
      ) : null}
      <SaveButton saving={saving} label={saveLabel} />
    </div>
  );
}

function SaveButton({ saving, label }: { saving?: boolean; label: string }) {
  return (
    <Button type="submit" loading={saving}>
      {label}
    </Button>
  );
}
