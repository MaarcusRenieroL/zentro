import { JSX } from "react";
import { EmptyState } from "@zentro/ui";
import { BlocksIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@zentro/ui/components/shadcn/button";
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
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
      <EmptyState
        icon={<BlocksIcon className="size-5" aria-hidden="true" />}
        title={
          manifest ? `${manifest.name} is turned off` : "Module turned off"
        }
        description="This module is turned off. Ask an admin to enable it."
      />
      <Button asChild variant="outline">
        <Link href={paths.dashboard()}>Back to dashboard</Link>
      </Button>
    </section>
  );
}
