import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
};

export function DetailRow({ label, children }: Props) {
  return (
    <div className="grid min-h-10 grid-cols-[120px_minmax(0,1fr)] items-center gap-3 rounded-md px-2">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
