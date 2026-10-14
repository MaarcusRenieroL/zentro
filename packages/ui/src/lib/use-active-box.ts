"use client";

import * as React from "react";

export type ActiveBox = {
  left: number;
  width: number;
  top: number;
  height: number;
};

/**
 * Where the active item sits inside its container, so one indicator can glide
 * between items with a transform and size transition. Re-measures when the
 * active item changes or the container resizes.
 */
export function useActiveBox(
  containerRef: React.RefObject<HTMLElement | null>,
  activeSelector: string,
) {
  const [box, setBox] = React.useState<ActiveBox | null>(null);

  const measure = React.useCallback(() => {
    const container = containerRef.current;
    const active = container?.querySelector<HTMLElement>(activeSelector);

    if (!container || !active) {
      setBox(null);

      return;
    }

    // Measured against the container, whatever the active element's own
    // offsetParent is (a list item that is itself positioned, for one).
    const from = container.getBoundingClientRect();
    const to = active.getBoundingClientRect();

    setBox({
      left: to.left - from.left + container.scrollLeft,
      width: to.width,
      top: to.top - from.top + container.scrollTop,
      height: to.height,
    });
  }, [containerRef, activeSelector]);

  React.useLayoutEffect(() => {
    measure();

    const container = containerRef.current;

    if (!container) return;

    const mutations = new MutationObserver(measure);

    mutations.observe(container, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state", "aria-current", "data-active"],
    });

    const resize = new ResizeObserver(measure);

    resize.observe(container);
    window.addEventListener("resize", measure);

    return () => {
      mutations.disconnect();
      resize.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, measure]);

  return box;
}
