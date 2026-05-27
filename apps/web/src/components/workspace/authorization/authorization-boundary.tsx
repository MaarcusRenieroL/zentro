import { EmptyState } from "@zentro/ui";
import { LockKeyholeIcon } from "lucide-react";
import { type FC, type ReactNode } from "react";

type UnauthorizedEmptyStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export const UnauthorizedEmptyState: FC<UnauthorizedEmptyStateProps> = ({
  title = "You do not have access",
  description = "Ask an organization owner or admin for permission to manage this area.",
  className,
}) => {
  return (
    <EmptyState
      className={className}
      icon={<LockKeyholeIcon className="size-5" aria-hidden="true" />}
      title={title}
      description={description}
    />
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
        className={className}
      />
    )
  );
};
