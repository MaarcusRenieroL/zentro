import type { ReactElement, ReactNode } from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

const tones = {
  info: { box: "bg-info-subtle text-info-text", icon: InfoIcon },
  success: {
    box: "bg-success-subtle text-success-text",
    icon: CircleCheckIcon,
  },
  warning: {
    box: "bg-warning-subtle text-warning-text",
    icon: TriangleAlertIcon,
  },
  danger: { box: "bg-danger-subtle text-danger-text", icon: OctagonXIcon },
} as const;

/** A message that sits in the flow of a page or form. */
export function InlineAlert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children?: ReactNode;
  className?: string;
}): ReactElement {
  const { box, icon: Icon } = tones[tone];

  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      data-slot="inline-alert"
      data-tone={tone}
      className={cn(
        "flex gap-2.5 rounded-lg px-3 py-2.5 text-sm",
        box,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-0.5">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-sm">{children}</div> : null}
      </div>
    </div>
  );
}
