"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Crumb = { label: string; mono?: boolean };
type Register = (pathname: string, crumb: Crumb | null) => void;

const CrumbsContext = createContext<Record<string, Crumb>>({});
// Kept apart from the crumbs so that registering one does not re-run the
// effect of the page that registered it.
const RegisterContext = createContext<Register>(() => undefined);

/**
 * Pages that load a named thing (a project, a task, a doc, a role) tell the
 * shell its name, so the breadcrumb shows "Website Redesign" and not a slug.
 */
export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Record<string, Crumb>>({});
  const register = useCallback<Register>((pathname, crumb) => {
    setCrumbs((current) => {
      if (!crumb) {
        if (!(pathname in current)) return current;

        return Object.fromEntries(
          Object.entries(current).filter(([key]) => key !== pathname),
        );
      }

      const existing = current[pathname];

      return existing?.label === crumb.label && existing.mono === crumb.mono
        ? current
        : { ...current, [pathname]: crumb };
    });
  }, []);

  return (
    <RegisterContext.Provider value={register}>
      <CrumbsContext.Provider value={crumbs}>{children}</CrumbsContext.Provider>
    </RegisterContext.Provider>
  );
}

export function useCrumbs() {
  return useContext(CrumbsContext);
}

/** Names the current page in the breadcrumb once its data has loaded. */
export function usePageCrumb(
  pathname: string,
  label: string | null | undefined,
  options: { mono?: boolean } = {},
) {
  const register = useContext(RegisterContext);
  const mono = options.mono;

  useEffect(() => {
    if (!label) return;

    register(pathname, { label, mono });

    return () => register(pathname, null);
  }, [pathname, label, mono, register]);
}
