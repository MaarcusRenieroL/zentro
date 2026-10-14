import { getInitials } from "./task-detail-utils";

type Props = {
  value: string | null | undefined;
};

export function AvatarInitials({ value }: Props) {
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-signal-subtle text-[10px] font-semibold text-signal">
      {getInitials(value)}
    </span>
  );
}
