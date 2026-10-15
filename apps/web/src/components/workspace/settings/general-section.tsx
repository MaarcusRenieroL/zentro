"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { Controller, useForm } from "react-hook-form";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Input } from "@zentro/ui/shadcn/input";

import { trpcResult } from "~/src/lib/trpc-result";
import {
  GeneralSectionFormValues,
  generalSectionSchema,
} from "~/src/lib/zod-schema";

import {
  SettingsError,
  SettingsFooter,
  SettingsHeader,
  SettingsRow,
  SettingsTile,
} from "./settings-kit";

type Props = {
  organization: {
    name: string;
    slug: string;
    id: string;
  };
};

export const GeneralSection: FC<Props> = ({ organization }) => {
  const trpc = useTrpcClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GeneralSectionFormValues>({
    resolver: zodResolver(generalSectionSchema),
    defaultValues: { name: organization.name },
    mode: "onTouched",
  });

  const save = async (values: GeneralSectionFormValues) => {
    const { error } = await trpcResult(
      trpc.organization.update.mutate({ name: values.name }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Saved", "Organization name updated.");
    reset(values);
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(save)}
      className="flex flex-col gap-6"
    >
      <SettingsHeader
        eyebrow="ORGANIZATION"
        title="General"
        description={`The name and address of ${organization.name}. Only owners and admins can change these.`}
      />
      <SettingsTile>
        <SettingsRow label="Name" htmlFor="organization-name">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                id="organization-name"
                autoComplete="organization"
                aria-invalid={Boolean(errors.name) || undefined}
                aria-describedby={
                  errors.name ? "organization-name-error" : undefined
                }
                {...field}
              />
            )}
          />
          <SettingsError id="organization-name-error">
            {errors.name?.message}
          </SettingsError>
        </SettingsRow>
        <SettingsRow
          label="URL"
          htmlFor="organization-slug"
          description="Your workspace identifier."
        >
          <div className="flex h-(--control-h) items-center overflow-hidden rounded-md border border-hairline bg-hover font-mono text-sm">
            <span className="flex h-full items-center border-r border-hairline px-3 text-ink-3">
              zentro.app/
            </span>
            <input
              id="organization-slug"
              value={organization.slug}
              readOnly
              aria-describedby="organization-slug-hint"
              className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-ink-2 outline-none"
            />
          </div>
          <p
            id="organization-slug-hint"
            className="text-[13px] leading-5 text-ink-3"
          >
            Read-only for now. Contact support to change your workspace URL.
          </p>
        </SettingsRow>
        <SettingsFooter
          dirty={isDirty}
          changes={isDirty ? 1 : 0}
          errors={errors.name ? 1 : 0}
          saving={isSubmitting}
          onDiscard={() => reset({ name: organization.name })}
        />
      </SettingsTile>
    </form>
  );
};
