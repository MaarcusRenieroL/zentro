import Link from "next/link";
import { CircleDotIcon } from "lucide-react";
import { type FC, type ReactNode } from "react";

import { Button } from "@zentro/ui/shadcn/button";

import { SystemPage } from "~/src/components/system/system-page";
import { paths } from "~/src/lib/paths";

type UnauthorizedEmptyStateProps = {
  title?: string;
  description?: string;
  /** The permission the page needs, shown in mono so it can be quoted. */
  permission?: string;
  className?: string;
};

/** 403: what is needed, and a way out. Never a dead end. */
export const UnauthorizedEmptyState: FC<UnauthorizedEmptyStateProps> = ({
  title = "You don’t have access to this.",
  description = "Ask an organization owner or admin for permission to open this area.",
  permission,
  className,
}) => {
  return (
    <SystemPage
      className={className}
      eyebrow="403 · NO ACCESS"
      title={title}
      description={description}
      actions={
        <Button variant="outline" asChild>
          <Link href={paths.dashboard()}>
            <CircleDotIcon />
            Go to Today
          </Link>
        </Button>
      }
    >
      {permission ? (
        <div className="mt-1.5 flex min-h-12 items-center gap-4 rounded-xl border border-hairline bg-surface px-[18px] py-1.5">
          <span className="w-[150px] shrink-0 text-xs text-ink-3">Needed</span>
          <code className="rounded-xs border border-hairline px-1.5 py-px font-mono text-[13px]">
            {permission}
          </code>
        </div>
      ) : null}
    </SystemPage>
  );
};

type AuthorizationBoundaryProps = UnauthorizedEmptyStateProps & {
  isAllowed: boolean;
  children: ReactNode;
  fallback?: ReactNode;
};

export const AuthorizationBoundary: FC<AuthorizationBoundaryProps> = ({
  isAllowed,
  children,
  fallback,
  title,
  description,
  permission,
  className,
}) => {
  if (isAllowed) {
    return children;
  }

  return (
    fallback ?? (
      <UnauthorizedEmptyState
        title={title}
        description={description}
        permission={permission}
        className={className}
      />
    )
  );
};
