import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
};

/** One row of the Details tile: a 13px label, then the control. */
export function DetailRow({ label, children }: Props) {
  return (
    <div className="grid min-h-11 grid-cols-[88px_minmax(0,1fr)] items-center gap-3 border-t border-hairline/60 px-4 first:border-t-0">
      <span className="text-[13px] text-ink-2">{label}</span>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}
