import { FC } from "react";

type Props = {
  status: string;
  owner: string;
  createdAt: Date;
  startDate: Date;
  teamName?: string | null;
  keyPrefix?: string | null;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-10 grid-cols-[88px_minmax(0,1fr)] items-center gap-3 border-t border-hairline/60 px-4 first:border-t-0">
      <dt className="text-[13px] text-ink-2">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

export const ProjectDetails: FC<Props> = ({
  status,
  owner,
  startDate,
  teamName,
  keyPrefix,
}) => (
  <section aria-label="Details" className="tile overflow-hidden">
    <dl>
      <Row label="Status">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className={
              status === "archived"
                ? "size-1.5 rounded-full border border-ink-3"
                : "size-1.5 rounded-full bg-status-done"
            }
          />
          {status === "archived" ? "Archived" : "Active"}
        </span>
      </Row>
      <Row label="Lead">{owner}</Row>
      <Row label="Team">{teamName ?? "Workspace level"}</Row>
      <Row label="Start">
        <span className="font-mono text-[13px]">{formatDate(startDate)}</span>
      </Row>
      {keyPrefix ? (
        <Row label="Key prefix">
          <span className="font-mono text-[13px]">{keyPrefix}</span>
        </Row>
      ) : null}
    </dl>
  </section>
);
