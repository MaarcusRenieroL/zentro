import { JSX } from "react";
import Link from "next/link";
import { CircleDotIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";
import { getModule } from "@zentro/modules";

import { SystemPage } from "~/src/components/system/system-page";
import { TurnOnModuleButton } from "~/src/components/system/turn-on-module-button";
import { getDashboardContext } from "~/src/lib/dashboard-context";
import { paths } from "~/src/lib/paths";

type Props = {
  searchParams: Promise<{ module?: string | string[] }>;
};

export default async function ModuleDisabledPage({
  searchParams,
}: Props): Promise<JSX.Element> {
  const params = await searchParams;
  const moduleId = Array.isArray(params.module)
    ? params.module[0]
    : params.module;
  const manifest = moduleId ? getModule(moduleId) : undefined;
  const { organization, snapshot } = await getDashboardContext();
  const canManage =
    snapshot.baseRole === "owner" || snapshot.baseRole === "admin";
  const name = manifest?.name ?? "This module";

  return (
    <SystemPage
      eyebrow="MODULE TURNED OFF"
      title={`${name} is turned off.`}
      description={`${name} is turned off for ${organization.name}. Everything in it is kept, and links to it from other places show as unavailable until it’s back on.`}
      actions={
        canManage && manifest ? (
          <>
            <TurnOnModuleButton
              moduleId={manifest.id}
              moduleName={manifest.name}
              href={manifest.basePath}
            />
            <Button variant="outline" size="lg" asChild>
              <Link href={paths.modulesSettings()}>Manage modules</Link>
            </Button>
          </>
        ) : (
          <Button variant="outline" size="lg" asChild>
            <Link href={paths.dashboard()}>
              <CircleDotIcon />
              Go to Today
            </Link>
          </Button>
        )
      }
      footnote={`Only owners and admins can turn modules on or off. Everyone gets ${name} back at the same time.`}
    />
  );
}
