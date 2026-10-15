"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { CheckIcon, EyeIcon, EyeOffIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { Input } from "@zentro/ui/shadcn/input";

/** The page title and the sentence under it. Left aligned, no card. */
export function AuthHeading({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-[1.75rem] leading-8 text-balance sm:text-[2rem] sm:leading-9">
        {title}
      </h1>
      {description ? (
        <p className="text-[15px] leading-[22px] text-ink-2">{description}</p>
      ) : null}
    </div>
  );
}

/** Label row (with an optional link on the right), control, then hint or error. */
export function AuthField({
  label,
  htmlFor,
  link,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor: string;
  link?: { href: string; label: string };
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline">
        <label htmlFor={htmlFor} className="text-[13px] font-medium">
          {label}
        </label>
        <span className="flex-1" />
        {link ? (
          <Link
            href={link.href}
            className="rounded-xs text-[13px] text-signal underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {link.label}
          </Link>
        ) : null}
      </div>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-[13px] leading-5 text-danger-text"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] leading-5 text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

/** A password input with a show/hide toggle inside the field. */
export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <Input
        type={shown ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-label={shown ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-xs text-ink-3 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
      >
        {shown ? (
          <EyeOffIcon className="size-4" />
        ) : (
          <EyeIcon className="size-4" />
        )}
      </button>
    </div>
  );
}

export type PasswordStrength = {
  /** 0 to 4 filled segments. */
  segments: number;
  label: string;
  tone: "warning" | "success";
  hint?: string;
};

/**
 * The same rules the form enforces (8 or more characters, a number, lower and
 * upper case), shown as four segments. Fewer than 8 characters is "Too short".
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) {
    const missing = 8 - password.length;

    return {
      segments: 1,
      label: "Too short",
      tone: "warning",
      hint: `Add ${missing} more character${missing === 1 ? "" : "s"}. 10 or more works best.`,
    };
  }

  const score =
    1 +
    Number(/\d/.test(password)) +
    Number(/[a-z]/.test(password) && /[A-Z]/.test(password)) +
    Number(password.length >= 12);

  if (score <= 2) {
    return {
      segments: score,
      label: "Weak",
      tone: "warning",
      hint: "Add a number, and mix upper and lower case letters.",
    };
  }

  return {
    segments: score,
    label: score === 3 ? "Strong" : "Very strong",
    tone: "success",
  };
}

export function PasswordMeter({ password }: { password: string }) {
  if (!password) return null;

  const strength = getPasswordStrength(password);

  return (
    <div className="flex flex-col gap-1.5" aria-live="polite">
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full",
              index < strength.segments
                ? strength.tone === "success"
                  ? "bg-success"
                  : "bg-warning"
                : "bg-sunken",
            )}
          />
        ))}
        <span className="ml-1.5 font-mono text-xs text-ink-2">
          {strength.label}
        </span>
      </div>
      {strength.hint ? (
        <p className="text-[13px] leading-5 text-ink-3">{strength.hint}</p>
      ) : null}
    </div>
  );
}

/** A rose-bordered notice with a ring "!" icon. */
export function AuthBanner({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-md border border-danger/40 bg-danger-subtle/50 p-3.5"
    >
      <span
        aria-hidden="true"
        className="mt-px flex size-5 flex-none items-center justify-center rounded-full border-[1.5px] border-danger font-mono text-[11px] font-semibold text-danger-text"
      >
        !
      </span>
      <p className="text-sm leading-5">
        <strong className="font-semibold">{title}</strong>{" "}
        <span className="text-ink-2">{children}</span>
      </p>
    </div>
  );
}

export function AuthNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-[13px] leading-5 text-ink-3">{children}</p>
  );
}

/** The consent checkbox row. */
export function ConsentCheckbox({
  id,
  checked,
  onChange,
  invalid,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-2.5 text-sm leading-5"
    >
      <span className="relative mt-px size-[18px] shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-ink bg-transparent outline-none checked:bg-ink focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-danger"
        />
        <CheckIcon
          aria-hidden="true"
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto size-3 text-ink-inverse opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span>{children}</span>
    </label>
  );
}
