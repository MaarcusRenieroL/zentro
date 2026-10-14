"use client";

import { CheckIcon } from "lucide-react";
import { useMemo, type FC } from "react";

import { listModules } from "@zentro/modules";
import { Tile } from "@zentro/ui/components/tile";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { useCatalog } from "./use-catalog";

type Role = {
  id: string;
  name: string;
  scope: string;
  systemKey: string | null;
  permissions: string[];
};

const moduleNames: Record<string, string> = {
  platform: "Platform",
  ...Object.fromEntries(
    listModules().map((module) => [module.id, module.name]),
  ),
};

/** Who can do what: a check where a role grants it, a dim dash where it does not. */
export const PermissionMatrix: FC<{ roles: Role[] }> = ({ roles }) => {
  const catalog = useCatalog();
  const columns = roles.filter((role) => role.scope === "organization");
  const rows = useMemo(
    () =>
      (catalog ?? [])
        .filter((entry) => entry.scopes.includes("organization"))
        .sort(
          (a, b) =>
            a.module.localeCompare(b.module) || a.group.localeCompare(b.group),
        ),
    [catalog],
  );

  if (!catalog) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <Tile
      title="Permission matrix"
      description="What each organization role can do."
      flush
    >
      <div className="max-h-[32rem] overflow-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead className="sticky top-0 z-[1] bg-surface">
            <tr className="border-b border-hairline">
              <th
                scope="col"
                className="px-(--pad-tile) py-3 text-left font-medium text-ink-2"
              >
                Permission
              </th>
              {columns.map((role) => (
                <th
                  key={role.id}
                  scope="col"
                  className="px-3 py-3 text-center font-medium text-ink-2"
                >
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((entry, index) => {
              const showModule =
                index === 0 || rows[index - 1]!.module !== entry.module;

              return [
                showModule ? (
                  <tr key={`m-${entry.module}`} className="bg-sunken/60">
                    <th
                      colSpan={columns.length + 1}
                      scope="colgroup"
                      className="eyebrow px-(--pad-tile) py-2 text-left"
                    >
                      {moduleNames[entry.module] ?? entry.module}
                    </th>
                  </tr>
                ) : null,
                <tr
                  key={entry.key}
                  className="border-b border-hairline last:border-b-0 hover:bg-hover"
                >
                  <th
                    scope="row"
                    className="px-(--pad-tile) py-2.5 text-left font-normal text-ink"
                  >
                    {entry.label}
                  </th>
                  {columns.map((role) => {
                    const granted =
                      role.systemKey === "owner" ||
                      role.permissions.includes(entry.key);

                    return (
                      <td key={role.id} className="px-3 py-2.5 text-center">
                        {granted ? (
                          <>
                            <CheckIcon
                              className="mx-auto size-4 text-status-done"
                              aria-hidden="true"
                            />
                            <span className="sr-only">Allowed</span>
                          </>
                        ) : (
                          <>
                            <span
                              aria-hidden="true"
                              className="font-mono text-ink-disabled"
                            >
                              –
                            </span>
                            <span className="sr-only">Not allowed</span>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>
    </Tile>
  );
};
