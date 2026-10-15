"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/lib/toast";
import { Button } from "@zentro/ui/shadcn/button";

/** The one violet action on the module-off page. */
export function TurnOnModuleButton({
  moduleId,
  moduleName,
  href,
}: {
  moduleId: string;
  moduleName: string;
  href: string;
}) {
  const trpc = useTrpcClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      size="lg"
      loading={busy}
      onClick={async () => {
        setBusy(true);

        try {
          await trpc.modules.setEnabled.mutate({ moduleId, enabled: true });
          toastSuccess(`${moduleName} turned on`);
          router.push(href);
          router.refresh();
        } catch (error) {
          toastError(error, `Could not turn ${moduleName} on`);
          setBusy(false);
        }
      }}
    >
      Turn {moduleName} back on
    </Button>
  );
}
