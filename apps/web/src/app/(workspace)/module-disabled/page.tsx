import { JSX } from "react";
import { BlocksIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@zentro/ui/components/empty-state";
import { Button } from "@zentro/ui/shadcn/button";
import { getModule } from "@zentro/modules";

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

  return (
    <div className="mx-auto mt-10 flex w-full max-w-xl flex-col items-center gap-4 text-center">
      <EmptyState
        className="w-full"
        icon={<BlocksIcon className="size-4" aria-hidden="true" />}
        title={
          manifest ? `${manifest.name} is turned off` : "Module turned off"
        }
        description="This module is turned off. Ask an admin to enable it."
      />
      <Button asChild variant="outline">
        <Link href={paths.dashboard()}>Back to dashboard</Link>
      </Button>
    </div>
  );
}
