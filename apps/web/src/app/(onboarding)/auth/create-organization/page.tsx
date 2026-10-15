"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, CheckIcon, LockIcon, XIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { useTrpcClient } from "@zentro/api/react";
import { authClient } from "@zentro/auth/client";
import { Logo } from "@zentro/ui/components/logo";
import { toastError } from "@zentro/ui/lib/toast";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import { slugify, slugifyInput } from "@zentro/utils";

import { AuthField } from "~/src/features/auth/components/kit/auth-kit";
import {
  CreateOrganizationFormValues,
  createOrganizationSchema,
} from "~/src/features/auth/lib/zod-schema";
import { getModuleIcon } from "~/src/lib/module-icons";
import { paths } from "~/src/lib/paths";
import { trpcResult } from "~/src/lib/trpc-result";

const steps = ["Workspace", "Teammates", "Modules"] as const;

type Invite = {
  id: number;
  email: string;
  role: "member" | "admin";
  error?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function emailError(email: string) {
  if (!email.trim()) return undefined;
  if (emailPattern.test(email.trim())) return undefined;

  return email.includes("@") && !email.split("@")[1]?.includes(".")
    ? "This address is missing its ending, like .dev or .com."
    : "That doesn’t look like an email address. Check it for typos.";
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex flex-1 items-center justify-center gap-2.5">
      {steps.map((label, index) => {
        const number = index + 1;
        const done = number < step;
        const current = number === step;

        return (
          <li key={label} className="flex items-center gap-2.5">
            <span
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 text-sm",
                current
                  ? "font-medium text-ink"
                  : done
                    ? "text-ink"
                    : "text-ink-3",
              )}
            >
              <span
                className={cn(
                  "flex size-[22px] items-center justify-center rounded-full font-mono text-[11px]",
                  done && "bg-success font-bold text-on-success",
                  current && "bg-ink text-ink-inverse",
                  !done && !current && "border border-hairline",
                )}
              >
                {done ? (
                  <CheckIcon className="size-3" strokeWidth={3} />
                ) : (
                  number
                )}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </span>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className="h-px w-6 bg-line-strong sm:w-10"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

type ModuleRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  core: boolean;
  enabled: boolean;
};

const moduleTint: Record<string, string> = {
  projects: "bg-tint-projects",
  tasks: "bg-tint-tasks",
  docs: "bg-tint-docs",
};

const moduleNote: Record<string, string> = {
  projects: "Stays on while Tasks is on",
  tasks: "Needs Projects",
  docs: "Works alone",
};

export default function CreateOrganizationPage() {
  const router = useRouter();
  const trpc = useTrpcClient();
  const [email, setEmail] = useState("");

  useEffect(() => {
    void authClient.getSession().then(({ data }) => {
      setEmail(data?.user.email ?? "");
    });
  }, []);

  const [step, setStep] = useState(1);
  const [created, setCreated] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [checkedSlug, setCheckedSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const [invites, setInvites] = useState<Invite[]>([
    { id: 1, email: "", role: "member" },
    { id: 2, email: "", role: "member" },
  ]);
  const [nextId, setNextId] = useState(3);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  const [sending, setSending] = useState(false);

  const [modules, setModules] = useState<ModuleRow[] | null>(null);
  const [want, setWant] = useState<Record<string, boolean>>({});
  const [finishing, setFinishing] = useState(false);

  const {
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting },
  } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { name: "", slug: "" },
    mode: "onTouched",
  });

  const name = useWatch({ control, name: "name" }) ?? "";
  const slug = useWatch({ control, name: "slug" }) ?? "";
  const workspaceSlug = slugEdited ? slug : slugify(name);
  const visibleSlugAvailability =
    workspaceSlug && checkedSlug === workspaceSlug ? slugAvailable : null;

  useEffect(() => {
    if (!workspaceSlug || created) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingSlug(true);

      try {
        const { error } = await authClient.organization.checkSlug({
          slug: workspaceSlug,
        });

        if (cancelled) return;

        setCheckedSlug(workspaceSlug);
        setSlugAvailable(!error);
      } finally {
        if (!cancelled) setCheckingSlug(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [workspaceSlug, created]);

  // The module cards are real: they come from the organization just created.
  useEffect(() => {
    if (step !== 3 || modules) return;

    void trpc.modules.list
      .query()
      .then((data) => {
        const rows = (data.modules as ModuleRow[]).filter((row) => !row.core);

        setModules(rows);
        setWant(Object.fromEntries(rows.map((row) => [row.id, row.enabled])));
      })
      .catch(() => {
        toastError("Error", "Could not load modules");
        setModules([]);
      });
  }, [step, modules, trpc]);

  const createWorkspace = async (values: CreateOrganizationFormValues) => {
    if (created) {
      setStep(2);
      return;
    }

    if (!visibleSlugAvailability) return;

    const { data: organization, error } = await authClient.organization.create({
      name: values.name,
      slug: slugify(values.slug),
    });

    if (error) {
      toastError(error, "Could not create organization");
      return;
    }

    const { error: setActiveError } = await authClient.organization.setActive({
      organizationId: organization.id,
    });

    if (setActiveError) {
      toastError(setActiveError, "Could not open the new organization");
      return;
    }

    setCreated(true);
    setStep(2);
  };

  const updateInvite = (id: number, patch: Partial<Invite>) =>
    setInvites((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );

  const filled = invites.filter((row) => row.email.trim());
  const valid = filled.filter((row) => !emailError(row.email));

  const addPasted = () => {
    const emails = pasted
      .split(/[\s,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    let id = nextId;
    const added = emails.map((email) => ({
      id: id++,
      email,
      role: "member" as const,
      error: emailError(email),
    }));

    setNextId(id);
    setInvites((rows) => [...rows.filter((row) => row.email.trim()), ...added]);
    setPasted("");
    setPasting(false);
  };

  const sendInvites = async () => {
    const withErrors = invites.map((row) => ({
      ...row,
      error: emailError(row.email),
    }));

    setInvites(withErrors);

    if (withErrors.some((row) => row.error)) return;

    const toSend = withErrors.filter((row) => row.email.trim());

    if (toSend.length === 0) {
      setStep(3);
      return;
    }

    setSending(true);

    const failed: Invite[] = [];

    for (const row of toSend) {
      const { error } = await trpcResult(
        trpc.invitation.invite.mutate({
          email: row.email.trim().toLowerCase(),
          role: row.role,
        }),
      );

      if (error) failed.push({ ...row, error: error.message });
    }

    setSending(false);

    if (failed.length > 0) {
      setInvites(failed);
      return;
    }

    setStep(3);
  };

  const toggleModule = (row: ModuleRow, on: boolean) =>
    setWant((current) => {
      const next = { ...current, [row.id]: on };

      // Tasks needs Projects: turning Tasks on brings Projects with it.
      if (row.id === "tasks" && on) next.projects = true;

      return next;
    });

  const finish = async () => {
    if (!modules) return;

    setFinishing(true);

    // Turn on dependencies first and turn off dependents first.
    const changes = modules.filter((row) => want[row.id] !== row.enabled);
    const order = (row: ModuleRow) =>
      want[row.id]
        ? row.id === "projects"
          ? 0
          : 1
        : row.id === "tasks"
          ? 0
          : 1;

    for (const row of changes.sort((a, b) => order(a) - order(b))) {
      const { error } = await trpcResult(
        trpc.modules.setEnabled.mutate({
          moduleId: row.id,
          enabled: want[row.id] ?? row.enabled,
        }),
      );

      if (error) {
        toastError(error.statusText, error.message);
        setFinishing(false);
        return;
      }
    }

    router.replace(paths.dashboard());
    router.refresh();
  };

  const eyebrow = `STEP ${step} OF 3`;
  const title = [
    "Name your workspace",
    "Invite your teammates",
    "Choose your modules",
  ][step - 1];
  const description = [
    "This is where your team keeps its projects, tasks and docs.",
    "They’ll get an email with a link to join. You can invite more people later.",
    "Start with what you need today. Everything is linked, so turning one on later fills in the gaps.",
  ][step - 1];

  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b border-hairline px-5 sm:px-8">
        <Link href={paths.home()} aria-label="Zentro home" className="w-fit">
          <Logo />
        </Link>
        <Stepper step={step} />
        <span className="hidden font-mono text-xs text-ink-3 md:block">
          {email}
        </span>
      </header>

      <main className="flex flex-1 justify-center px-5 py-10 sm:px-8 sm:py-16">
        <div className="flex w-full max-w-[640px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="font-display text-[1.75rem] leading-8 sm:text-[2rem] sm:leading-9">
              {title}
            </h1>
            <p className="max-w-[540px] text-[15px] leading-[22px] text-ink-2">
              {description}
            </p>
          </div>

          {step === 1 ? (
            <form
              id="workspace-form"
              noValidate
              onSubmit={handleSubmit(createWorkspace)}
              className="tile flex flex-col gap-4 p-[22px]"
            >
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <AuthField
                    label="Workspace name"
                    htmlFor="name"
                    hint="Usually your company or team name. You can change it later."
                    error={fieldState.error?.message}
                  >
                    <Input
                      id="name"
                      type="text"
                      placeholder="Northwind Labs"
                      autoComplete="organization"
                      readOnly={created}
                      aria-invalid={fieldState.invalid || undefined}
                      aria-describedby={
                        fieldState.error ? "name-error" : undefined
                      }
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
                  </AuthField>
                )}
              />

              <Controller
                name="slug"
                control={control}
                render={({ field, fieldState }) => {
                  const taken = visibleSlugAvailability === false;

                  return (
                    <AuthField
                      label="Workspace URL"
                      htmlFor="slug"
                      error={
                        fieldState.error?.message ??
                        (taken
                          ? `zentro.app/${workspaceSlug} is taken. Try ${workspaceSlug}-labs or ${workspaceSlug}-hq.`
                          : undefined)
                      }
                    >
                      <div
                        className={cn(
                          "flex h-(--control-h) items-center overflow-hidden rounded-md border border-border-strong bg-surface font-mono text-sm focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/22",
                          (fieldState.invalid || taken) && "border-danger",
                        )}
                      >
                        <span className="flex h-full items-center border-r border-hairline px-3 text-ink-3">
                          zentro.app/
                        </span>
                        <input
                          id="slug"
                          type="text"
                          placeholder="northwind-labs"
                          readOnly={created}
                          aria-invalid={
                            fieldState.invalid || taken || undefined
                          }
                          aria-describedby={
                            fieldState.error || taken ? "slug-error" : undefined
                          }
                          className="h-full min-w-0 flex-1 bg-transparent px-2.5 outline-none placeholder:text-ink-3"
                          name={field.name}
                          ref={field.ref}
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(event) => {
                            setSlugEdited(true);
                            field.onChange(slugifyInput(event.target.value));
                          }}
                        />
                      </div>
                      {workspaceSlug &&
                      !fieldState.error &&
                      !taken &&
                      !created ? (
                        <p className="flex items-center gap-1.5 text-[13px] leading-5 text-ink-2">
                          {visibleSlugAvailability ? (
                            <>
                              <span className="flex size-3.5 items-center justify-center rounded-full bg-success text-on-success">
                                <CheckIcon
                                  className="size-2.5"
                                  strokeWidth={3.5}
                                  aria-hidden="true"
                                />
                              </span>
                              Available. Lowercase letters, numbers and dashes
                              only.
                            </>
                          ) : (
                            <>Checking {workspaceSlug}…</>
                          )}
                        </p>
                      ) : null}
                    </AuthField>
                  );
                }}
              />
            </form>
          ) : null}

          {step === 2 ? (
            <div className="tile flex flex-col gap-2.5 p-[22px]">
              <div className="grid grid-cols-[minmax(0,1fr)_120px_32px] gap-2 text-[13px] font-medium sm:grid-cols-[minmax(0,1fr)_140px_32px]">
                <span>Email</span>
                <span>Role</span>
                <span />
              </div>
              {invites.map((row, index) => (
                <div key={row.id} className="flex flex-col gap-1.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_120px_32px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_140px_32px]">
                    <Input
                      type="email"
                      value={row.email}
                      placeholder="name@company.com"
                      aria-label={`Teammate ${index + 1} email`}
                      aria-invalid={Boolean(row.error) || undefined}
                      className="font-mono text-sm"
                      onChange={(event) =>
                        updateInvite(row.id, {
                          email: event.target.value,
                          error: undefined,
                        })
                      }
                      onBlur={() =>
                        updateInvite(row.id, { error: emailError(row.email) })
                      }
                    />
                    <Select
                      value={row.role}
                      onValueChange={(role) =>
                        updateInvite(row.id, { role: role as Invite["role"] })
                      }
                    >
                      <SelectTrigger
                        aria-label={`Teammate ${index + 1} role`}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      aria-label={`Remove teammate ${index + 1}`}
                      disabled={invites.length === 1}
                      onClick={() =>
                        setInvites((rows) =>
                          rows.filter((item) => item.id !== row.id),
                        )
                      }
                      className="flex size-8 items-center justify-center justify-self-center rounded-md text-ink-3 outline-none hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                  {row.error ? (
                    <p
                      role="alert"
                      className="text-[13px] leading-5 text-danger-text"
                    >
                      {row.error}
                    </p>
                  ) : null}
                </div>
              ))}

              {pasting ? (
                <div className="flex flex-col gap-2 pt-1">
                  <Textarea
                    value={pasted}
                    onChange={(event) => setPasted(event.target.value)}
                    placeholder="Paste emails separated by commas, spaces or new lines"
                    aria-label="Emails to add"
                    className="min-h-24 font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={addPasted}>
                      Add these
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPasting(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[13px]">
                <button
                  type="button"
                  onClick={() => {
                    setInvites((rows) => [
                      ...rows,
                      { id: nextId, email: "", role: "member" },
                    ]);
                    setNextId((value) => value + 1);
                  }}
                  className="rounded-xs text-signal underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Add another
                </button>
                <button
                  type="button"
                  onClick={() => setPasting(true)}
                  className="rounded-xs text-signal underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Paste a list of emails
                </button>
                <span className="flex-1" />
                <span className="text-ink-3">Invites expire after 7 days.</span>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            modules === null ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-36 rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {modules.map((row) => {
                    const on = want[row.id] ?? row.enabled;
                    // Projects is held on while Tasks is on.
                    const locked = row.id === "projects" && Boolean(want.tasks);
                    const Icon = getModuleIcon(row.icon);

                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "tile overflow-hidden",
                          locked && "border-dashed",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-[52px] items-center gap-2.5 pr-4 pl-3",
                            moduleTint[row.id] ?? "bg-tint-tasks",
                          )}
                        >
                          <span className="flex size-7 items-center justify-center rounded-md border border-hairline bg-tint-chip">
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                          <span className="text-[15px] font-semibold">
                            {row.name}
                          </span>
                          <span className="flex-1" />
                          {locked ? (
                            <LockIcon
                              className="size-3.5 text-ink-2"
                              aria-label="Locked on"
                            />
                          ) : null}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={on}
                            aria-label={`${row.name} module`}
                            disabled={locked}
                            onClick={() => toggleModule(row, !on)}
                            className={cn(
                              "relative h-5 w-9 shrink-0 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                              on ? "bg-ink" : "bg-line-strong",
                              locked && "opacity-45",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 size-4 rounded-full bg-canvas shadow-xs transition-[left] duration-200",
                                on ? "left-[18px]" : "left-0.5",
                              )}
                            />
                          </button>
                        </div>
                        <div className="flex flex-col gap-1.5 px-4 pt-3 pb-3.5">
                          <p className="text-sm leading-5 text-ink-2">
                            {row.description}
                          </p>
                          <p className="font-mono text-xs text-ink-3">
                            {moduleNote[row.id] ?? "Works alone"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[13px] text-ink-3">
                  Files, Chat, Meetings and more are on the way. You can turn
                  modules on or off any time in Settings.
                </p>
              </>
            )
          ) : null}

          <div className="flex items-center gap-2 pt-1">
            {step > 1 ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep((value) => value - 1)}
              >
                <ArrowLeftIcon />
                Back
              </Button>
            ) : null}
            <span className="flex-1" />
            {step === 2 ? (
              <Button variant="ghost" size="lg" onClick={() => setStep(3)}>
                Skip for now
              </Button>
            ) : null}
            {step === 1 ? (
              <Button
                type="submit"
                form="workspace-form"
                size="lg"
                loading={
                  isSubmitting ||
                  checkingSlug ||
                  (!created &&
                    Boolean(workspaceSlug) &&
                    visibleSlugAvailability === null)
                }
              >
                Continue
              </Button>
            ) : null}
            {step === 2 ? (
              <Button size="lg" loading={sending} onClick={sendInvites}>
                {valid.length > 0
                  ? `Send ${valid.length} invite${valid.length === 1 ? "" : "s"}`
                  : "Continue"}
              </Button>
            ) : null}
            {step === 3 ? (
              <Button
                size="lg"
                loading={finishing}
                disabled={modules === null}
                onClick={finish}
              >
                Finish setup
              </Button>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
